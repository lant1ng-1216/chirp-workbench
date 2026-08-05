import { NextRequest, NextResponse } from 'next/server'
import { sendToPip } from '@/lib/minds/pip'

export interface AssetAnalysis {
  tags: string[]
  analysis: string
  platforms: string[]
}

/**
 * POST /api/minds/analyze-asset
 * Asks Pip to analyze an uploaded asset (based on its name, type and the
 * creator's text description) and return tags + platform recommendations.
 */
export async function POST(req: NextRequest) {
  try {
    const { alias, name, type, description, profile } = await req.json()
    if (!alias) return NextResponse.json({ error: 'alias is required' }, { status: 400 })
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const prompt = `You are Pip, the AI content agent for creator ${profile?.name ?? 'a content creator'}.

Creator profile:
- Content style: ${profile?.contentStyle ?? 'unknown'}
- Audience: ${profile?.audience ?? 'unknown'}
- Tone: ${profile?.tone ?? 'unknown'}
- Topics: ${(profile?.topics ?? []).join(', ')}

A new asset was just added to the creator's asset library:
- File name: ${name}
- Asset type: ${type} (image | video | text)
- Creator's description: """${description || '(no description provided — infer from the file name)'}"""

Analyze this asset for cross-platform content repurposing. Return ONLY valid JSON in this exact format:
{
  "tags": ["3-5 short tags describing content type, style and mood"],
  "analysis": "2-3 sentences: what this asset is best used for and why, referencing the creator's style",
  "platforms": ["subset of: youtube, instagram, tiktok, twitter — best-fit platforms for this asset"]
}`

    const reply = await sendToPip(alias, prompt, 120_000)
    if (reply.timedOut || !reply.text) {
      return NextResponse.json({ error: 'Pip analysis timed out' }, { status: 504 })
    }

    try {
      const jsonMatch = reply.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      const parsed = JSON.parse(jsonMatch[0]) as AssetAnalysis
      return NextResponse.json({
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
        analysis: typeof parsed.analysis === 'string' ? parsed.analysis : reply.text,
        platforms: Array.isArray(parsed.platforms) ? parsed.platforms.map(String) : [],
      })
    } catch {
      // Pip replied in prose — still useful as the analysis text
      return NextResponse.json({ tags: [], analysis: reply.text, platforms: [] })
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Asset analysis failed' },
      { status: 500 }
    )
  }
}
