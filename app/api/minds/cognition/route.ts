import { NextResponse } from 'next/server'
import { getMindsClient, getMindId } from '@/lib/minds/client'

/** GET /api/minds/cognition — remaining cognition balance for the configured Mind */
export async function GET() {
  try {
    const client = getMindsClient()
    const mindId = getMindId()
    const balance = await client.getCognitionBalance(mindId)
    return NextResponse.json({ cognition: balance.cognition })
  } catch (e) {
    console.error('[minds/cognition]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
