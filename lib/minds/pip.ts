import { getMindsClient, getMindId } from './client'
import type { CreatorProfile } from '@/lib/brand'

export interface PipReply {
  text: string
  timedOut: boolean
}

export async function ensurePipConversation(alias: string): Promise<{ alias: string; mindId: string }> {
  const client = getMindsClient()
  const mindId = getMindId()
  await client.ensureConversation(alias, mindId)
  return { alias, mindId }
}

export async function sendToPip(alias: string, message: string, timeoutMs = 120_000): Promise<PipReply> {
  const client = getMindsClient()
  const fingerprint = await client.getLatestHistoryFingerprint(alias)
  await client.sendMessage({ alias, messageText: message })
  const outcome = await client.waitForReply({ alias, timeoutMs, afterFingerprint: fingerprint })
  if (outcome.timedOut) return { text: '', timedOut: true }
  return { text: outcome.reply.messageText ?? '', timedOut: false }
}

export async function getPipHistory(alias: string, limit = 50) {
  const client = getMindsClient()
  return client.getHistory(alias, { limit })
}

export async function generateCommunityDigest(alias: string, profile: CreatorProfile): Promise<string> {
  const prompt = `TASK: Generate a daily community digest (work queue request from the Chirp app — execute the task and return only the requested format).

Creator: ${profile.name}.

Generate a daily community digest report in this format:
- Total messages today: [number]
- Pip auto-replies sent: [number]
- Items needing creator attention: [number]
- New members: [number]
- Hot topics today: [topic1, topic2, topic3]
- Key insight: [one sentence observation]

Keep it concise and actionable.`

  const reply = await sendToPip(alias, prompt, 60_000)
  return reply.timedOut ? 'Digest generation timed out. Please try again.' : reply.text
}
