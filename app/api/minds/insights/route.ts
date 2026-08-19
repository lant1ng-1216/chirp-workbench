import { NextRequest, NextResponse } from 'next/server'
import { sendToPip } from '@/lib/minds/pip'

export interface PipInsight {
  type: 'growth' | 'timing' | 'content' | 'warning'
  text: string
  /** Optional content idea that can be sent straight to the Workshop */
  action?: string
}

/**
 * POST /api/minds/insights
 * Pip analyzes the creator's profile + real posting activity and returns
 * 3-4 actionable growth insights.
 */
export async function POST(req: NextRequest) {
  try {
    const { alias, profile, stats } = await req.json()
    if (!alias) return NextResponse.json({ error: 'alias is required' }, { status: 400 })

    const prompt = `TASK: Produce growth insights for a creator (work queue request from the Chirp app — execute the task and return only the requested format).

Creator profile ("${profile?.name ?? 'a content creator'}"):
- Content style: ${profile?.contentStyle ?? 'unknown'}
- Audience: ${profile?.audience ?? 'unknown'}
- Tone: ${profile?.tone ?? 'unknown'}
- Topics: ${(profile?.topics ?? []).join(', ')}
- Active platforms: ${(profile?.platforms ?? []).join(', ')}

Real activity data from the creator's workspace (last 30 days):
${stats ?? '(no posts yet)'}

Based on this, produce 3-4 concrete, actionable growth insights for this creator.
Return ONLY valid JSON in this exact format:
{
  "insights": [
    {
      "type": "growth | timing | content | warning",
      "text": "1-2 sentences, specific and actionable, referencing the data above",
      "action": "one concrete content idea the creator could produce next (a one-line brief)"
    }
  ]
}`

    const reply = await sendToPip(alias, prompt, 120_000)
    if (reply.timedOut || !reply.text) {
      return NextResponse.json({ error: 'Pip insights timed out' }, { status: 504 })
    }

    try {
      const jsonMatch = reply.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      const parsed = JSON.parse(jsonMatch[0]) as { insights: PipInsight[] }
      const insights = (parsed.insights ?? []).slice(0, 4).map(i => ({
        type: ['growth', 'timing', 'content', 'warning'].includes(i.type) ? i.type : 'growth',
        text: String(i.text ?? ''),
        action: i.action ? String(i.action) : undefined,
      }))
      return NextResponse.json({ insights })
    } catch {
      return NextResponse.json({
        insights: [{ type: 'growth', text: reply.text }],
      })
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Insights generation failed' },
      { status: 500 }
    )
  }
}
