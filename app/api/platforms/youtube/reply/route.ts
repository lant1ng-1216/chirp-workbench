import { NextRequest, NextResponse } from 'next/server'
import { replyYouTubeComment } from '@/lib/publish/youtube'
import type { YouTubeCredentials } from '@/lib/brand'

/** POST /api/platforms/youtube/reply — reply to a comment thread (BYOK). */
export async function POST(req: NextRequest) {
  try {
    const { credentials, text, parentId } = await req.json() as {
      credentials: YouTubeCredentials
      text: string
      parentId: string
    }
    if (!credentials?.clientId || !text?.trim() || !parentId) {
      return NextResponse.json({ error: 'credentials, text and parentId are required' }, { status: 400 })
    }
    const result = await replyYouTubeComment(credentials, parentId, text.trim())
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
    }
    return NextResponse.json({ ok: true, id: result.id })
  } catch (e) {
    console.error('[platforms/youtube/reply]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
