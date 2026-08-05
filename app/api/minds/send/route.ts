import { NextRequest, NextResponse } from 'next/server'
import { sendToPip } from '@/lib/minds/pip'

export async function POST(req: NextRequest) {
  try {
    const { alias, message, timeoutMs } = await req.json() as {
      alias: string
      message: string
      timeoutMs?: number
    }
    if (!alias || !message) {
      return NextResponse.json({ error: 'alias and message are required' }, { status: 400 })
    }
    const reply = await sendToPip(alias, message, timeoutMs ?? 120_000)
    return NextResponse.json(reply)
  } catch (e) {
    console.error('[minds/send]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
