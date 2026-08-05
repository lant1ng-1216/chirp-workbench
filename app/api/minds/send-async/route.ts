import { NextRequest, NextResponse } from 'next/server'
import { getMindsClient, getMindId } from '@/lib/minds/client'

// Fire-and-forget: send message and return the fingerprint immediately.
// The client polls /api/minds/history to detect the reply.
export async function POST(req: NextRequest) {
  try {
    const { alias, message } = await req.json() as { alias: string; message: string }
    if (!alias || !message) {
      return NextResponse.json({ error: 'alias and message are required' }, { status: 400 })
    }
    const client = getMindsClient()
    const mindId  = getMindId()
    // Ensure conversation exists (idempotent — safe to call every time)
    await client.ensureConversation(alias, mindId)
    const sentAt = Date.now()
    await client.sendMessage({ alias, messageText: message })
    return NextResponse.json({ ok: true, sentAt })
  } catch (e) {
    console.error('[minds/send-async]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
