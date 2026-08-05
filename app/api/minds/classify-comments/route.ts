import { NextRequest, NextResponse } from 'next/server'
import { sendToPip } from '@/lib/minds/pip'

export interface ClassifiedComment {
  id: string
  sentiment: 'positive' | 'negative' | 'question' | 'spam'
  reply: string
}

/**
 * POST /api/minds/classify-comments
 * Pip classifies a batch of community comments by sentiment and drafts
 * a suggested reply for each (spam excluded).
 */
export async function POST(req: NextRequest) {
  try {
    const { alias, profile, comments } = await req.json() as {
      alias: string
      profile: { name?: string; tone?: string; contentStyle?: string }
      comments: { id: string; author: string; text: string; platform: string }[]
    }
    if (!alias) return NextResponse.json({ error: 'alias is required' }, { status: 400 })
    if (!Array.isArray(comments) || comments.length === 0) {
      return NextResponse.json({ error: 'comments array is required' }, { status: 400 })
    }

    const list = comments
      .slice(0, 20)
      .map(c => `- id: ${c.id} | ${c.platform} | ${c.author}: ${c.text}`)
      .join('\n')

    const prompt = `You are Pip, the community manager for creator ${profile?.name ?? 'a content creator'} (tone: ${profile?.tone ?? 'friendly'}, style: ${profile?.contentStyle ?? 'unknown'}).

Classify each comment below as one of: positive, negative, question, spam.
For non-spam comments, draft a short reply in the creator's voice (1-2 sentences, warm and genuine, matching the comment's language). For spam, reply with an empty string.

Comments:
${list}

Return ONLY valid JSON in this exact format:
{
  "results": [
    { "id": "<comment id>", "sentiment": "positive|negative|question|spam", "reply": "<drafted reply or empty>" }
  ]
}`

    const reply = await sendToPip(alias, prompt, 120_000)
    if (reply.timedOut || !reply.text) {
      return NextResponse.json({ error: 'Pip classification timed out' }, { status: 504 })
    }

    const jsonMatch = reply.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Unexpected Pip response' }, { status: 502 })

    const parsed = JSON.parse(jsonMatch[0]) as { results: ClassifiedComment[] }
    const valid = ['positive', 'negative', 'question', 'spam']
    const results = (parsed.results ?? []).map(r => ({
      id: String(r.id),
      sentiment: valid.includes(r.sentiment) ? r.sentiment : 'positive',
      reply: typeof r.reply === 'string' ? r.reply : '',
    }))
    return NextResponse.json({ results })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Classification failed' },
      { status: 500 }
    )
  }
}
