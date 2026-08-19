/**
 * Marketing angles: strict template prompt, parse, repair.
 */

export type MarketingAngle = {
  headline: string
  body: string
  cta: string
}

export type MarketingParse =
  | { ok: true; angles: MarketingAngle[]; leftoverAdvice?: string }
  | { ok: false; reason: string }

export function formatAnglesPlain(angles: MarketingAngle[]): string {
  return angles.map((a, i) => (
    `Angle ${i + 1}\nHeadline: ${a.headline}\nBody: ${a.body}\nCTA: ${a.cta}`
  )).join('\n\n')
}

export function buildMarketingPrompt(
  knowledgeCtx: string,
  assetCtx: string,
  brief: string,
): string {
  return `TASK: Write marketing content angles for a creator workbench.
You MUST ground every claim in UPSTREAM_KNOWLEDGE and/or UPSTREAM_ASSETS below.
If upstream knowledge is missing, empty, OR is ops/contract meta (TASK-prefix, PIVOT-Ops, contract IDs) rather than real brand facts, reply exactly: INSUFFICIENT_UPSTREAM
Do NOT invent a brand, product, or audience that is not supported by upstream.
Do NOT treat "OK. TASK-prefix contract…" style text as knowledge.
Do NOT reuse or continue any previous marketing draft that appears in BRIEF — BRIEF is optional direction only.
Do NOT rewrite the knowledge card. Do NOT include schedule/calendar advice, weekly plans, or "next steps for you".

UPSTREAM_KNOWLEDGE:
"""
${knowledgeCtx || '(empty)'}
"""
UPSTREAM_ASSETS:
"""
${assetCtx || '(empty)'}
"""
BRIEF (optional direction only — not a knowledge source):
"""
${brief || '(none)'}
"""

If upstream is sufficient: return EXACTLY 3 angles in this plain-text template (no HTML, no JSON, no markdown fences):

Angle 1
Headline: ...
Body: ...
CTA: ...

Angle 2
Headline: ...
Body: ...
CTA: ...

Angle 3
Headline: ...
Body: ...
CTA: ...`
}

export const MARKETING_REPAIR_SUFFIX = `

Your previous reply was NOT usable (wrong shape, knowledge-card rewrite, contract meta, or missing angles).
Rewrite now with EXACTLY the Angle/Headline/Body/CTA template for 3 angles.
No TASK-prefix, no PIVOT-Ops, no schedule advice, no knowledge-card sections.`

/** Parse Angle/Headline/Body/CTA blocks (tolerant of Chinese labels + single-line Mind style). */
export function parseMarketingAngles(raw: string): MarketingParse {
  const text = (raw || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return { ok: false, reason: 'empty' }
  if (/INSUFFICIENT_UPSTREAM/i.test(text)) return { ok: false, reason: 'insufficient' }

  // Split on Angle N markers (keep delimiter)
  const parts = text.split(/(?=(?:Angle|角度)\s*\d+)/i).map(s => s.trim()).filter(Boolean)
  const angles: MarketingAngle[] = []

  for (const part of parts) {
    if (!/(?:Angle|角度)\s*\d+/i.test(part) && !/(?:Headline|标题)\s*[:：]/i.test(part)) continue
    const extracted = extractAngleFields(part)
    if (extracted) angles.push(extracted)
  }

  if (angles.length < 2) {
    // Global scan: Headline/Body/CTA triplets in order
    const triples = extractGlobalTriples(text)
    if (triples.length >= 2) return { ok: true, angles: triples.slice(0, 3) }
  }

  if (angles.length < 2) return { ok: false, reason: `sparse:${angles.length}` }
  return { ok: true, angles: angles.slice(0, 3) }
}

function extractAngleFields(part: string): MarketingAngle | null {
  const headline = takeLabeled(part, ['Headline', '标题'])
  const body = takeLabeled(part, ['Body', '正文', '文案'])
  const cta = takeLabeled(part, ['CTA', '行动号召', '号召'])
  if (!headline && !body) return null
  if (!headline && !cta) return null
  return {
    headline: (headline || '').trim(),
    body: (body || '').trim(),
    cta: (cta || '').trim(),
  }
}

function takeLabeled(text: string, labels: string[]): string | null {
  const labelAlt = labels.map(escapeRe).join('|')
  const stopAlt = ['Headline', 'Body', 'CTA', '标题', '正文', '文案', '行动号召', '号召', 'Angle', '角度']
    .map(escapeRe).join('|')
  const re = new RegExp(
    `(?:${labelAlt})\\s*[:：]\\s*(.+?)(?=\\s*(?:${stopAlt})\\s*[:：]|\\s*(?:Angle|角度)\\s*\\d+|$)`,
    'i',
  )
  const m = text.match(re)
  return m ? m[1].trim() : null
}

function extractGlobalTriples(text: string): MarketingAngle[] {
  const angles: MarketingAngle[] = []
  const re = /(?:Headline|标题)\s*[:：]\s*(.+?)\s*(?:Body|正文|文案)\s*[:：]\s*(.+?)\s*(?:CTA|行动号召|号召)\s*[:：]\s*(.+?)(?=\s*(?:Angle|角度)\s*\d+|\s*(?:Headline|标题)\s*[:：]|$)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    angles.push({
      headline: m[1].trim(),
      body: m[2].trim(),
      cta: m[3].trim(),
    })
  }
  return angles
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
