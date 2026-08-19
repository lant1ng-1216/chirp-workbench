import OAuth from 'oauth-1.0a'
import crypto from 'node:crypto'
import type { XCredentials } from '@/lib/brand'

/**
 * X (Twitter) API v2 with OAuth 1.0a user-context signing.
 * BYOK model: the creator applies for their own free developer credentials
 * (developer.x.com — free tier includes 1,500 posts/month) and Chirp signs
 * requests with them. Credentials live in the user's browser (localStorage)
 * and are only sent to our own API routes, which forward to api.x.com.
 */

function makeOAuth(creds: XCredentials) {
  return new OAuth({
    consumer: { key: creds.apiKey, secret: creds.apiSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(base, key) {
      return crypto.createHmac('sha1', key).update(base).digest('base64')
    },
  })
}

function authHeader(creds: XCredentials, method: string, url: string): string {
  const oauth = makeOAuth(creds)
  const token = { key: creds.accessToken, secret: creds.accessSecret }
  const auth = oauth.authorize({ url, method }, token)
  return oauth.toHeader(auth).Authorization
}

export interface XResult<T = unknown> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

async function xRequest<T>(method: string, url: string, creds: XCredentials, body?: unknown): Promise<XResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: authHeader(creds, method, url),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
    const text = await res.text()
    let data: T | undefined
    try { data = text ? JSON.parse(text) : undefined } catch { data = undefined }
    if (!res.ok) {
      const detail = (data as { detail?: string; title?: string } | undefined)?.detail
        ?? (data as { title?: string } | undefined)?.title
        ?? text.slice(0, 200)
      return { ok: false, status: res.status, error: `X API ${res.status}: ${detail}` }
    }
    return { ok: true, status: res.status, data }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause.message : ''
    const network = /fetch failed|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|certificate|network/i.test(`${msg} ${cause}`)
    return {
      ok: false,
      status: 0,
      error: network
        ? `无法连接 X API（${cause || msg}）。请确认本机/终端能访问 api.x.com（如需代理，给运行 Next 的进程设置 https_proxy 后重启）。`
        : String(e),
    }
  }
}

/** Verify credentials — returns the authenticated user's handle */
export async function verifyXCredentials(creds: XCredentials): Promise<{ ok: boolean; handle?: string; name?: string; error?: string }> {
  const r = await xRequest<{ data?: { username?: string; name?: string } }>(
    'GET', 'https://api.x.com/2/users/me', creds
  )
  if (!r.ok) return { ok: false, error: r.error }
  const username = r.data?.data?.username
  if (!username) return { ok: false, error: 'X API returned no user' }
  return { ok: true, handle: `@${username}`, name: r.data?.data?.name }
}

/** Post a tweet — returns the canonical status URL */
export async function postTweet(creds: XCredentials, text: string, replyToId?: string): Promise<{ ok: boolean; url?: string; id?: string; error?: string }> {
  const body: Record<string, unknown> = { text: text.slice(0, 280) }
  if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId }
  const r = await xRequest<{ data?: { id?: string } }>(
    'POST', 'https://api.x.com/2/tweets', creds, body
  )
  if (!r.ok) return { ok: false, error: r.error }
  const id = r.data?.data?.id
  return { ok: true, id, url: id ? `https://x.com/i/status/${id}` : undefined }
}

/** Fetch recent mentions of the authenticated user */
export async function getMentions(creds: XCredentials, maxResults = 20): Promise<{ ok: boolean; mentions?: Array<{ id: string; text: string; author_id?: string; created_at?: string; authorUsername?: string }>; error?: string }> {
  const me = await xRequest<{ data?: { id?: string } }>('GET', 'https://api.x.com/2/users/me', creds)
  if (!me.ok || !me.data?.data?.id) return { ok: false, error: me.error ?? 'no user id' }
  const uid = me.data.data.id
  const url = `https://api.x.com/2/users/${uid}/mentions?max_results=${Math.min(100, Math.max(5, maxResults))}&tweet.fields=author_id,created_at,conversation_id&expansions=author_id&user.fields=username,name`
  const r = await xRequest<{
    data?: Array<{ id: string; text: string; author_id?: string; created_at?: string }>
    includes?: { users?: Array<{ id: string; username: string; name?: string }> }
  }>('GET', url, creds)
  if (!r.ok) return { ok: false, error: r.error }
  const users = new Map((r.data?.includes?.users ?? []).map(u => [u.id, u]))
  const mentions = (r.data?.data ?? []).map(m => ({
    ...m,
    authorUsername: users.get(m.author_id ?? '')?.username,
  }))
  return { ok: true, mentions }
}
