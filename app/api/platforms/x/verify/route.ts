import { NextRequest, NextResponse } from 'next/server'
import { verifyXCredentials } from '@/lib/publish/x'
import type { XCredentials } from '@/lib/brand'

/**
 * POST /api/platforms/x/verify — validate BYOK X credentials before the
 * client stores them. Credentials are used once (GET /2/users/me) and never
 * persisted server-side; they live in the user's browser only.
 */
export async function POST(req: NextRequest) {
  try {
    const creds = await req.json() as Partial<XCredentials>
    if (!creds.apiKey || !creds.apiSecret || !creds.accessToken || !creds.accessSecret) {
      return NextResponse.json({ error: 'apiKey, apiSecret, accessToken and accessSecret are all required' }, { status: 400 })
    }
    const result = await verifyXCredentials(creds as XCredentials)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 401 })
    }
    return NextResponse.json({ ok: true, handle: result.handle, name: result.name })
  } catch (e) {
    console.error('[platforms/x/verify]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
