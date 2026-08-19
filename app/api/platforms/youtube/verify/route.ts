import { NextRequest, NextResponse } from 'next/server'
import { verifyYouTubeCredentials, type YouTubeCredentials } from '@/lib/publish/youtube'

/**
 * POST /api/platforms/youtube/verify — validate BYOK YouTube OAuth credentials
 * before the client stores them. Never persisted server-side.
 */
export async function POST(req: NextRequest) {
  try {
    const creds = await req.json() as Partial<YouTubeCredentials>
    if (!creds.clientId || !creds.clientSecret || !creds.refreshToken) {
      return NextResponse.json(
        { error: 'clientId, clientSecret and refreshToken are all required' },
        { status: 400 },
      )
    }
    const result = await verifyYouTubeCredentials(creds as YouTubeCredentials)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 401 })
    }
    return NextResponse.json({
      ok: true,
      handle: result.handle,
      name: result.name,
      channelId: result.channelId,
    })
  } catch (e) {
    console.error('[platforms/youtube/verify]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
