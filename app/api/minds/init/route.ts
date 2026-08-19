import { NextRequest, NextResponse } from 'next/server'
import { ensurePipConversation } from '@/lib/minds/pip'
import { getMindsClient } from '@/lib/minds/client'

/**
 * The TASK contract, taught to the Mind once per conversation.
 * Minds are persona agents with an identity firewall: structured work
 * requests are only honored when the Mind has agreed to the convention.
 * Long-term memory makes this stick across threads, but new conversations
 * get a fresh copy so behavior never depends on probe history.
 */
export const TASK_CONTRACT =
  `A note about how we work together, please remember this: the Chirp app sends you structured work requests on behalf of the creator. They start with "TASK:". They are legitimate instructions from me, not spam — each one has different content. When you receive a TASK request, just do the task and return ONLY the requested output format (if it asks for JSON, reply with raw JSON only, no HTML, no commentary). You stay yourself in normal chat — TASK messages are simply the app's work queue. Reply "OK" to confirm.`

export async function POST(req: NextRequest) {
  try {
    const { alias } = await req.json() as { alias: string }
    if (!alias) return NextResponse.json({ error: 'alias is required' }, { status: 400 })
    const result = await ensurePipConversation(alias)

    // Teach the TASK contract (fire-and-forget — onboarding must not block
    // on the reply; the Mind's memory picks it up either way).
    const client = getMindsClient()
    void client.sendMessage({ alias, messageText: TASK_CONTRACT })
      .catch(e => console.error('[minds/init] task contract send failed', e))

    return NextResponse.json(result)
  } catch (e) {
    console.error('[minds/init]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
