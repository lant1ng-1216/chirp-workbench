import { NextRequest, NextResponse } from 'next/server'
import { getMentions } from '@/lib/publish/x'
import type { XCredentials } from '@/lib/brand'

/**
 * POST /api/platforms/x/mentions — fetch recent mentions for the authenticated
 * X account. Credentials are BYOK and never stored server-side.
 */
export async function POST(req: NextRequest) {
  try {
    const { credentials, maxResults } = await req.json() as {
      credentials: XCredentials
      maxResults?: number
    }
    if (!credentials?.apiKey || !credentials?.apiSecret || !credentials?.accessToken || !credentials?.accessSecret) {
      return NextResponse.json({ error: 'credentials required' }, { status: 400 })
    }
    const result = await getMentions(credentials, maxResults ?? 20)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
    }
    return NextResponse.json({ ok: true, mentions: result.mentions })
  } catch (e) {
    console.error('[platforms/x/mentions]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
