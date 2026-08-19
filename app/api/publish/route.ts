import { NextRequest, NextResponse } from 'next/server'
import { getAdapter, publishSimulated } from '@/lib/publish/adapters'
import type { Post, PublishReceipt, PlatformAccount } from '@/lib/brand'

/**
 * POST /api/publish — dispatch a post to its platform adapter.
 *
 * Decision order:
 *  1. Live account + adapter has env credentials → real platform API
 *  2. Otherwise → simulated publish (demo mode, same call path)
 *
 * OAuth token resolution: live accounts would carry a tokenRef resolved
 * from server-side storage; simulated accounts skip this entirely.
 */
export async function POST(req: NextRequest) {
  try {
    const { post, account, allowSimulated } = await req.json() as { post: Post; account?: PlatformAccount; allowSimulated?: boolean }
    if (!post?.platform) {
      return NextResponse.json({ error: 'post is required' }, { status: 400 })
    }

    const adapter = getAdapter(post.platform)
    if (!adapter) {
      return NextResponse.json({ error: `No adapter for platform "${post.platform}"` }, { status: 400 })
    }

    const ctx = {
      handle: account?.handle,
      credentials: account?.credentials,
      youtubeCredentials: account?.youtubeCredentials,
    }

    if (account?.via === 'live') {
      const result = await adapter.publishLive(post, ctx)
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
      }
      const receipt: PublishReceipt = { via: 'live', url: result.url, at: new Date().toISOString() }
      return NextResponse.json({ ok: true, receipt })
    }

    // Simulated publishing is only available when the client explicitly
    // enables demo mode — real usage must connect a live account.
    if (!allowSimulated) {
      return NextResponse.json(
        { ok: false, error: 'no-live-account' },
        { status: 409 }
      )
    }
    const receipt = await publishSimulated(post, ctx)
    return NextResponse.json({ ok: true, receipt })
  } catch (e) {
    console.error('[publish]', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
