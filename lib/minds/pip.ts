import { getMindsClient, getMindId } from './client'
import type { CreatorProfile } from '@/lib/brand'

export interface PipReply {
  text: string
  timedOut: boolean
}

export interface RepurposeResult {
  youtube: string
  instagram: string
  tiktok: string
  twitter: string
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

export async function repurposeContent(
  alias: string,
  profile: CreatorProfile,
  input: string
): Promise<RepurposeResult> {
  const prompt = `You are Pip, a content repurposing agent for creator ${profile.name}.

Creator profile:
- Content style: ${profile.contentStyle}
- Audience: ${profile.audience}
- Tone: ${profile.tone}
- Topics: ${profile.topics.join(', ')}
- Active platforms: ${profile.platforms.join(', ')}

Input content to repurpose:
"""
${input}
"""

Generate platform-adapted versions. Return ONLY valid JSON in this exact format:
{
  "youtube": "Video description (300-500 words, SEO optimised, include timestamps if relevant)",
  "instagram": "Caption (storytelling style) + 25-30 hashtags on new lines",
  "tiktok": "First 3-second hook sentence + bullet points for the script",
  "twitter": "Opening tweet for a thread (≤280 chars, punchy and engaging)"
}`

  const reply = await sendToPip(alias, prompt, 180_000)
  if (reply.timedOut || !reply.text) {
    return { youtube: '', instagram: '', tiktok: '', twitter: '' }
  }

  try {
    const jsonMatch = reply.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    return JSON.parse(jsonMatch[0]) as RepurposeResult
  } catch {
    return {
      youtube: reply.text,
      instagram: reply.text,
      tiktok: reply.text,
      twitter: reply.text,
    }
  }
}

export async function generateCommunityDigest(alias: string, profile: CreatorProfile): Promise<string> {
  const prompt = `You are Pip, the community manager for ${profile.name}.

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
