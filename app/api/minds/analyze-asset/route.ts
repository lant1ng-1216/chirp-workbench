import { NextRequest, NextResponse } from 'next/server'
import { sendToPip } from '@/lib/minds/pip'
import { sanitizeMindText, looksLikeGibberish } from '@/lib/minds/repurpose'

export interface AssetAnalysis {
  tags: string[]
  analysis: string
  platforms: string[]
}

const VALID_PLATFORMS = ['youtube', 'instagram', 'tiktok', 'twitter']

function buildPrompt(profile: Record<string, unknown> | undefined, name: string, type: string, description: string, retry: boolean): string {
  const base = `TASK: Analyze a new asset for cross-platform repurposing (work queue request from the Chirp app — execute the task and return only the requested format).

Creator profile ("${(profile?.name as string) ?? 'a content creator'}"):
- Content style: ${(profile?.contentStyle as string) ?? 'unknown'}
- Audience: ${(profile?.audience as string) ?? 'unknown'}
- Tone: ${(profile?.tone as string) ?? 'unknown'}
- Topics: ${((profile?.topics as string[]) ?? []).join(', ')}

A new asset was just added to the creator's asset library:
- File name: ${name}
- Asset type: ${type} (image | video | text)
- Creator's description: """${description || '(no description provided — infer from the file name)'}"""

Analyze this asset for cross-platform content repurposing.

OUTPUT RULES — READ CAREFULLY:
- Return ONLY a single valid JSON object. No markdown fences, no commentary.
- Write in English. Keep every value short.
- Never output random characters or placeholder text.
Format:
{
  "tags": ["3-4 short lowercase tags, 1-2 words each"],
  "analysis": "ONE sentence: what this asset is best used for, referencing the creator's style",
  "platforms": ["subset of: youtube, instagram, tiktok, twitter"]
}`
  return retry
    ? base + `\n\nYour previous reply was unusable (invalid JSON or garbled text). Try again: one valid JSON object only, English only.`
    : base
}

function parseAnalysis(raw: string): AssetAnalysis | null {
  const clean = sanitizeMindText(raw)
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<AssetAnalysis>
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.map(t => sanitizeMindText(String(t))).filter(t => t && t.length <= 24 && !looksLikeGibberish(t)).slice(0, 4)
      : []
    const analysis = typeof parsed.analysis === 'string' ? sanitizeMindText(parsed.analysis) : ''
    const platforms = Array.isArray(parsed.platforms)
      ? parsed.platforms.map(String).filter(p => VALID_PLATFORMS.includes(p))
      : []
    if (!analysis || looksLikeGibberish(analysis)) return null
    return { tags, analysis, platforms }
  } catch {
    return null
  }
}

/**
 * POST /api/minds/analyze-asset
 * Asks Minds to analyze an uploaded asset (name, type, description) and
 * return tags + platform recommendations. Retries once if validation fails.
 */
export async function POST(req: NextRequest) {
  try {
    const { alias, name, type, description, profile } = await req.json()
    if (!alias) return NextResponse.json({ error: 'alias is required' }, { status: 400 })
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    for (let attempt = 0; attempt < 2; attempt++) {
      const reply = await sendToPip(alias, buildPrompt(profile, name, type, description, attempt > 0), 180_000)
      if (reply.timedOut || !reply.text) continue
      const parsed = parseAnalysis(reply.text)
      if (parsed) return NextResponse.json(parsed)
    }

    return NextResponse.json(
      { error: 'Minds could not produce a clean analysis. Please try again.' },
      { status: 502 },
    )
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Asset analysis failed' },
      { status: 500 }
    )
  }
}
