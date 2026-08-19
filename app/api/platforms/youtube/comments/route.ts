import { NextRequest, NextResponse } from 'next/server'
import { getChannelComments } from '@/lib/publish/youtube'
import type { YouTubeCredentials } from '@/lib/brand'

/** POST /api/platforms/youtube/comments — fetch recent channel comment threads (BYOK). */
export async function POST(req: NextRequest) {
  try {
    const { credentials, maxResults } = await req.json() as {
      credentials: YouTubeCredentials
      maxResults?: number
    }
    if (!credentials?.clientId || !credentials?.clientSecret || !credentials?.refreshToken) {
      return NextResponse.json({ error: 'credentials required' }, { status: 400 })
    }
    const result = await getChannelComments(credentials, maxResults ?? 20)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
    }
    return NextResponse.json({ ok: true, comments: result.comments })
  } catch (e) {
    console.error('[platforms/youtube/comments]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
