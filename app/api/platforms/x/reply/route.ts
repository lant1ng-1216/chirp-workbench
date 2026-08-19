import { NextRequest, NextResponse } from 'next/server'
import { postTweet } from '@/lib/publish/x'
import type { XCredentials } from '@/lib/brand'

/**
 * POST /api/platforms/x/reply — reply to a tweet (in_reply_to_tweet_id).
 * Credentials are BYOK and never stored server-side.
 */
export async function POST(req: NextRequest) {
  try {
    const { credentials, text, replyToId } = await req.json() as {
      credentials: XCredentials
      text: string
      replyToId: string
    }
    if (!credentials?.apiKey || !text?.trim() || !replyToId) {
      return NextResponse.json({ error: 'credentials, text and replyToId are required' }, { status: 400 })
    }
    const result = await postTweet(credentials, text.trim(), replyToId)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
    }
    return NextResponse.json({ ok: true, id: result.id, url: result.url })
  } catch (e) {
    console.error('[platforms/x/reply]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
