import { NextRequest, NextResponse } from 'next/server'
import { getMindsClient, getMindId } from '@/lib/minds/client'
import { buildRepurposePrompt, REPAIR_PROMPT_SUFFIX } from '@/lib/minds/repurpose'
import type { CreatorProfile } from '@/lib/brand'

/**
 * POST /api/minds/repurpose/start
 * Sends the repurpose prompt to Pip and returns immediately (fire-and-forget).
 * The client polls /api/minds/repurpose/result for the outcome.
 * Pass retry: true to append the repair suffix after a failed attempt.
 */
export async function POST(req: NextRequest) {
  try {
    const { alias, profile, input, retry } = await req.json() as {
      alias: string
      profile: CreatorProfile
      input: string
      retry?: boolean
    }
    if (!alias || !profile || !input) {
      return NextResponse.json({ error: 'alias, profile, and input are required' }, { status: 400 })
    }
    const client = getMindsClient()
    await client.ensureConversation(alias, getMindId())
    const prompt = buildRepurposePrompt(profile, input) + (retry ? REPAIR_PROMPT_SUFFIX : '')
    const sentAt = Date.now()
    await client.sendMessage({ alias, messageText: prompt })
    return NextResponse.json({ ok: true, sentAt })
  } catch (e) {
    console.error('[minds/repurpose/start]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
