import type { YouTubeCredentials } from '@/lib/brand'

/**
 * YouTube Data API v3 — BYOK via OAuth 2.0 refresh tokens.
 * Creator applies at console.cloud.google.com, enables YouTube Data API,
 * creates an OAuth client, and generates a refresh token (e.g. via
 * Google OAuth Playground). Credentials live in the browser only.
 *
 * Honest limit: YouTube has no public third-party write API for Community
 * posts. Live publish here means channel verify + comment/reply. Video
 * upload requires a media file (resumable) — not wired in this MVP.
 */

export type { YouTubeCredentials }

export interface YtResult<T = unknown> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

async function refreshAccessToken(creds: YouTubeCredentials): Promise<{ ok: boolean; accessToken?: string; error?: string }> {
  try {
    const body = new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: 'refresh_token',
    })
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await res.json() as { access_token?: string; error?: string; error_description?: string }
    if (!res.ok || !data.access_token) {
      return { ok: false, error: data.error_description ?? data.error ?? `token ${res.status}` }
    }
    return { ok: true, accessToken: data.access_token }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

async function ytRequest<T>(method: string, url: string, accessToken: string, body?: unknown): Promise<YtResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
    const text = await res.text()
    let data: T | undefined
    try { data = text ? JSON.parse(text) : undefined } catch { data = undefined }
    if (!res.ok) {
      const errObj = data as { error?: { message?: string } } | undefined
      return { ok: false, status: res.status, error: `YouTube API ${res.status}: ${errObj?.error?.message ?? text.slice(0, 200)}` }
    }
    return { ok: true, status: res.status, data }
  } catch (e) {
    return { ok: false, status: 0, error: String(e) }
  }
}

/** Verify credentials — returns the channel title/handle */
export async function verifyYouTubeCredentials(creds: YouTubeCredentials): Promise<{ ok: boolean; handle?: string; name?: string; channelId?: string; error?: string }> {
  const tok = await refreshAccessToken(creds)
  if (!tok.ok || !tok.accessToken) return { ok: false, error: tok.error }
  const r = await ytRequest<{ items?: Array<{ id: string; snippet?: { title?: string; customUrl?: string } }> }>(
    'GET',
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    tok.accessToken,
  )
  if (!r.ok) return { ok: false, error: r.error }
  const ch = r.data?.items?.[0]
  if (!ch) return { ok: false, error: 'No YouTube channel linked to these credentials' }
  return {
    ok: true,
    channelId: ch.id,
    name: ch.snippet?.title,
    handle: ch.snippet?.customUrl ? `@${ch.snippet.customUrl.replace(/^@/, '')}` : ch.snippet?.title,
  }
}

/**
 * Publish a community-style text post via videos.insert metadata-only is not
 * supported without a media file. For text-only, we create a playlist item
 * description isn't enough either — YouTube Data API has no "community post"
 * write endpoint for third parties. We therefore publish as a video description
 * update when videoId is provided; otherwise return a clear error.
 *
 * Practical MVP path: post a status by creating a new public video with a
 * placeholder — not viable. Instead expose comment reply + channel verify,
 * and for "publish" require an attached video asset URL (resumable upload).
 *
 * For the hackathon MVP we support commenting/replying and channel verification.
 * Text-only "community posts" are documented as unsupported by the public API.
 */
export async function postYouTubeComment(creds: YouTubeCredentials, videoId: string, text: string): Promise<{ ok: boolean; id?: string; url?: string; error?: string }> {
  const tok = await refreshAccessToken(creds)
  if (!tok.ok || !tok.accessToken) return { ok: false, error: tok.error }
  const r = await ytRequest<{ id?: string }>(
    'POST',
    'https://www.googleapis.com/youtube/v3/commentThreads?part=snippet',
    tok.accessToken,
    {
      snippet: {
        videoId,
        topLevelComment: { snippet: { textOriginal: text } },
      },
    },
  )
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true, id: r.data?.id, url: r.data?.id ? `https://youtube.com/watch?v=${videoId}&lc=${r.data.id}` : undefined }
}

export async function replyYouTubeComment(creds: YouTubeCredentials, parentId: string, text: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const tok = await refreshAccessToken(creds)
  if (!tok.ok || !tok.accessToken) return { ok: false, error: tok.error }
  const r = await ytRequest<{ id?: string }>(
    'POST',
    'https://www.googleapis.com/youtube/v3/comments?part=snippet',
    tok.accessToken,
    { snippet: { parentId, textOriginal: text } },
  )
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true, id: r.data?.id }
}

/** List recent comment threads on the authenticated channel's videos */
export async function getChannelComments(creds: YouTubeCredentials, maxResults = 20): Promise<{ ok: boolean; comments?: Array<{ id: string; text: string; author: string; videoId?: string; createdAt?: string }>; error?: string }> {
  const tok = await refreshAccessToken(creds)
  if (!tok.ok || !tok.accessToken) return { ok: false, error: tok.error }
  // First resolve channel id
  const ch = await ytRequest<{ items?: Array<{ id: string }> }>(
    'GET', 'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', tok.accessToken,
  )
  const channelId = ch.data?.items?.[0]?.id
  if (!ch.ok || !channelId) return { ok: false, error: ch.error ?? 'no channel' }

  const r = await ytRequest<{
    items?: Array<{
      id: string
      snippet?: {
        videoId?: string
        topLevelComment?: { snippet?: { textDisplay?: string; authorDisplayName?: string; publishedAt?: string } }
      }
    }>
  }>(
    'GET',
    `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId=${channelId}&maxResults=${Math.min(50, Math.max(1, maxResults))}&order=time`,
    tok.accessToken,
  )
  if (!r.ok) return { ok: false, error: r.error }
  const comments = (r.data?.items ?? []).map(item => ({
    id: item.id,
    text: item.snippet?.topLevelComment?.snippet?.textDisplay ?? '',
    author: item.snippet?.topLevelComment?.snippet?.authorDisplayName ?? 'unknown',
    videoId: item.snippet?.videoId,
    createdAt: item.snippet?.topLevelComment?.snippet?.publishedAt,
  }))
  return { ok: true, comments }
}
