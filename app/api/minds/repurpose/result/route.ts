import { NextRequest, NextResponse } from 'next/server'
import { getMindsClient } from '@/lib/minds/client'
import { parseRepurposeReply } from '@/lib/minds/repurpose'

/**
 * GET /api/minds/repurpose/result?alias=…&sentAt=…
 * Non-blocking check: has Pip replied after sentAt? If yes, parse & validate.
 * Returns { ready: false } | { ready: true, result } | { ready: true, failed: reason }
 */
/**
 * POST { text } — parse & validate a reply body that the client already
 * received via SSE. Returns { result } | { failed: reason }.
 */
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json() as { text: string }
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })
    const parsed = parseRepurposeReply(text)
    if (!parsed.ok) return NextResponse.json({ failed: parsed.reason })
    return NextResponse.json({ result: parsed.result })
  } catch (e) {
    console.error('[minds/repurpose/result POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const alias = req.nextUrl.searchParams.get('alias')
    const sentAt = Number(req.nextUrl.searchParams.get('sentAt') ?? 0)
    if (!alias || !sentAt) {
      return NextResponse.json({ error: 'alias and sentAt are required' }, { status: 400 })
    }
    const client = getMindsClient()
    const history = await client.getHistory(alias, { limit: 10 }) as Array<{
      senderType: number
      messageText: string
      createdAt: string
    }>
    const reply = history.find(m =>
      m.senderType === 0 && new Date(m.createdAt).getTime() >= sentAt
    )
    if (!reply) return NextResponse.json({ ready: false })

    const parsed = parseRepurposeReply(reply.messageText ?? '')
    if (!parsed.ok) return NextResponse.json({ ready: true, failed: parsed.reason })
    return NextResponse.json({ ready: true, result: parsed.result })
  } catch (e) {
    console.error('[minds/repurpose/result]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
