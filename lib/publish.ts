import type { Post, PublishReceipt, PlatformAccount } from './brand'

export type { PublishReceipt }

export interface PublishOutcome {
  ok: boolean
  receipt?: PublishReceipt
  error?: string
}

/**
 * Client-side publish call — goes through /api/publish, which dispatches
 * to the per-platform adapter (real platform API when the account is live
 * and credentials are configured; simulated receipt otherwise).
 */
export async function publishPost(post: Post, account?: PlatformAccount, allowSimulated = false): Promise<PublishOutcome> {
  try {
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post, account, allowSimulated }),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) return { ok: false, error: data.error ?? `HTTP ${res.status}` }
    return { ok: true, receipt: data.receipt }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
