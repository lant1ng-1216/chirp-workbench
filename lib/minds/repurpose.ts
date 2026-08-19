import type { CreatorProfile } from '@/lib/brand'

export interface RepurposeResult {
  youtube: string
  instagram: string
  tiktok: string
  twitter: string
}

/** Strong, schema-explicit prompt. Per-run nonce fights conversation TASK reuse. */
export function buildRepurposePrompt(profile: CreatorProfile, input: string, runId?: string): string {
  const rid = runId || `R-${Date.now().toString(36)}`
  const langHint = /[\u4e00-\u9fff]/.test(input)
    ? 'SOURCE is primarily Chinese — write platform copy in Chinese (except hashtags/handles if needed).'
    : 'Write everything in English unless SOURCE is clearly another language.'

  return `TASK: Repurpose content into four platform-native posts (Chirp work-queue request ${rid} — execute THIS source only; ignore prior tasks in chat history).

CREATOR PROFILE ("${profile.name}")
- Content style: ${profile.contentStyle || 'not specified'}
- Audience: ${profile.audience || 'not specified'}
- Tone of voice: ${profile.tone || 'not specified'}
- Content topics: ${(profile.topics ?? []).join(', ') || 'not specified'}

SOURCE CONTENT (the ONLY material you may adapt — do not reuse earlier posts, habits essays, or other brands from this conversation)
"""
${input}
"""

TASK
Adapt THIS source into four platform-native posts. Each version must be genuinely different — written for that platform's audience, culture and format rules.
${langHint}
If SOURCE names a product/brand/campaign, every platform value MUST clearly reference it (names, hooks, or claims from SOURCE). Do NOT invent a different topic (e.g. generic "creator habits" when SOURCE is a product campaign).

PLATFORM REQUIREMENTS
- "youtube": Video description, 150–250 words. SEO-first: keyword-rich opening line, short paragraphs, 3–5 hashtag-less keywords at the end, one call-to-action to subscribe.
- "instagram": Caption, 80–120 words, storytelling first line that works as a hook, then value, then a question to drive comments. After the caption add exactly 10 hashtags on a new line.
- "tiktok": A spoken script outline. Start with "HOOK:" — one sentence for the first 3 seconds. Then 3–4 short beats prefixed with "BEAT:". End with "CTA:" one line.
- "twitter": A single tweet, strictly under 260 characters. Punchy, no hashtags, no em-dash chains, one clear idea.

OUTPUT RULES — READ CAREFULLY
- Return ONLY a single valid JSON object. No markdown fences, no commentary, no explanation.
- Keys exactly: "youtube", "instagram", "tiktok", "twitter". Values are plain strings = ready-to-post copy ONLY.
- Do NOT put weekly plans, calendars, "90-day" roadmaps, or schedule advice inside any platform value.
- Never repeat the same text across platforms. Never output random characters or placeholder text.`
}

/* ── Reply sanitization & parsing ── */

export function sanitizeMindText(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFD]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function looksLikeGibberish(s: string): boolean {
  if (!s || s.length < 10) return true
  const normal = (s.match(/[a-zA-Z0-9\s.,!?'":;#@()\-—\n\u4e00-\u9fff]/g) ?? []).length
  return normal / s.length < 0.55
}

function nearDuplicate(a: string, b: string): boolean {
  if (!a || !b) return false
  const na = a.replace(/\s+/g, ' ').toLowerCase()
  const nb = b.replace(/\s+/g, ' ').toLowerCase()
  if (na === nb) return true
  const shorter = na.length < nb.length ? na : nb
  const longer = na.length < nb.length ? nb : na
  return shorter.length > 60 && longer.includes(shorter.slice(0, Math.floor(shorter.length * 0.8)))
}

export type RepurposeParse =
  | { ok: true; result: RepurposeResult }
  | { ok: false; reason: string }

export function parseRepurposeReply(raw: string): RepurposeParse {
  const clean = sanitizeMindText(raw)
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { ok: false, reason: 'no-json' }
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return { ok: false, reason: 'bad-json' }
  }
  const get = (k: keyof RepurposeResult) =>
    typeof parsed[k] === 'string' ? sanitizeMindText(parsed[k] as string) : ''
  const result: RepurposeResult = {
    youtube: get('youtube'),
    instagram: get('instagram'),
    tiktok: get('tiktok'),
    twitter: get('twitter'),
  }
  const values = Object.values(result)
  if (values.every(v => !v)) return { ok: false, reason: 'empty' }
  if (values.some(v => v && looksLikeGibberish(v))) return { ok: false, reason: 'gibberish' }
  const pairs: [string, string][] = [
    [result.youtube, result.instagram], [result.youtube, result.tiktok],
    [result.youtube, result.twitter], [result.instagram, result.tiktok],
    [result.instagram, result.twitter], [result.tiktok, result.twitter],
  ]
  if (pairs.some(([a, b]) => nearDuplicate(a, b))) return { ok: false, reason: 'not-adapted' }
  return { ok: true, result }
}

/** Distinctive tokens from SOURCE for grounding checks. */
export function extractSourceAnchors(source: string, limit = 8): string[] {
  const text = (source || '').trim()
  if (!text) return []
  const anchors = new Set<string>()

  // Latin proper-ish tokens (Volt, Runner, Electric, Mint, TikTok…)
  for (const m of text.matchAll(/\b([A-Za-z][A-Za-z0-9]{2,})\b/g)) {
    const w = m[1]
    if (/^(the|and|for|with|from|that|this|your|you|are|not|but|can|will|into|content|post|posts|platform|video|caption)$/i.test(w)) continue
    anchors.add(w.toLowerCase())
  }
  // Chinese 2–6 char runs
  for (const m of text.matchAll(/[\u4e00-\u9fff]{2,6}/g)) {
    anchors.add(m[0])
  }
  // Brand-ish Title Case phrases already covered; keep Angle headlines fragments
  for (const m of text.matchAll(/Headline:\s*(.+)/gi)) {
    const chunk = m[1].trim().slice(0, 24)
    if (chunk.length >= 2) anchors.add(chunk.toLowerCase())
  }

  return [...anchors].filter(a => a.length >= 2).slice(0, limit)
}

/** At least `minHits` platform drafts must contain ≥1 source anchor. */
export function isRepurposeGrounded(
  source: string,
  result: RepurposeResult,
  minPlatformHits = 2,
): boolean {
  const anchors = extractSourceAnchors(source)
  if (anchors.length === 0) return true // nothing distinctive to check
  const platforms = [result.youtube, result.instagram, result.tiktok, result.twitter].filter(Boolean)
  let hits = 0
  for (const p of platforms) {
    const low = p.toLowerCase()
    if (anchors.some(a => low.includes(a.toLowerCase()))) hits++
  }
  return hits >= Math.min(minPlatformHits, platforms.length)
}

export const REPAIR_PROMPT_SUFFIX = `

Your previous reply was not usable (invalid JSON, garbled text, identical platforms, OR off-topic vs SOURCE).
Try again: one valid JSON object only; genuinely different text per platform; EVERY platform must adapt THIS SOURCE only — do not reuse earlier conversation drafts about other topics.`
