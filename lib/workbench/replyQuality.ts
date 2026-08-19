/**
 * Detect unusable Minds replies and hollow upstream content for Chirp workbench.
 */

const CONTRACT_META =
  /TASK-prefix|PIVOT-Ops|contract confirmation|work queue request|Chirp TASK|TASKs executed under contract|same as [0-9A-F]{6,}/i

const PLACEHOLDER_START =
  /^(粘贴|Paste|可选|optional|补充|Fill by|运行「提炼」|（运行|Write a brief|Optional brief|Optional campaign)/i

/** Mind returned ops / contract chatter instead of product content. */
export function isContractMetaReply(text?: string | null): boolean {
  const t = (text || '').trim()
  if (!t) return false
  if (CONTRACT_META.test(t)) return true
  // Short "OK. … contract …" acknowledgements
  if (/^OK\.\s+/i.test(t) && /TASK|contract|PIVOT/i.test(t)) return true
  return false
}

/** Knowledge / marketing upstream must be real brand content, not stubs or meta. */
export function isUsableContent(
  body?: string,
  tags?: string[],
  extra?: { summary?: string; anglesCount?: number },
): boolean {
  const summary = (extra?.summary || '').trim()
  if (summary.length >= 24 && !isContractMetaReply(summary)) return true
  if ((extra?.anglesCount ?? 0) >= 2) return true
  const t = (body || '').trim()
  if (tags && tags.length > 0 && (t.length >= 8 || summary.length >= 8) && !isContractMetaReply(t)) return true
  if (!t) return false
  if (t.length < 24) return false
  if (PLACEHOLDER_START.test(t)) return false
  if (/metadata\+description|元数据\+描述|非逐帧/i.test(t) && t.length < 160) return false
  if (isContractMetaReply(t)) return false
  return true
}

/** Plan chat accidentally returned a four-platform repurpose JSON blob. */
export function looksLikeRepurposeJson(text?: string | null): boolean {
  const t = (text || '').trim()
  if (!t.startsWith('{') && !t.includes('"youtube"')) return false
  try {
    const m = t.match(/\{[\s\S]*\}/)
    if (!m) return false
    const j = JSON.parse(m[0]) as Record<string, unknown>
    const keys = ['youtube', 'instagram', 'tiktok', 'twitter']
    const hit = keys.filter(k => typeof j[k] === 'string' && String(j[k]).trim().length > 20)
    return hit.length >= 3
  } catch {
    return /"youtube"\s*:/.test(t) && /"tiktok"\s*:/.test(t) && /"instagram"\s*:/.test(t)
  }
}

/** Knowledge refine should look like a card, not a one-line OK. */
export function isPlausibleKnowledgeCard(text?: string | null): boolean {
  const t = (text || '').trim()
  if (!t || t.length < 40) return false
  if (isContractMetaReply(t)) return false
  if (looksLikeRepurposeJson(t)) return false
  // Prefer section-ish content; don't hard-fail if Mind uses different headings
  const hasStructure =
    /定位|受众|语气|支柱|Positioning|Audience|Tone|Pillar|Do\/Don't|不要|禁忌/i.test(t)
    || t.split('\n').filter(l => l.trim()).length >= 4
  return hasStructure
}

export const KNOWLEDGE_REPAIR_SUFFIX = `

Your previous reply was NOT usable (ops/contract meta, or not a knowledge card).
Rewrite now as a concise brand knowledge card ONLY.
Use short sections: Positioning, Audience, Tone, Pillars, Do/Don't.
No TASK-prefix, no contract IDs, no PIVOT-Ops, no HTML, no JSON.`

export const PLAN_REPAIR_SUFFIX = `

Your previous reply was a platform-repurpose JSON blob. That is wrong for Plan mode.
Reply in plain language with: 1) direction 2) a 3–6 step plan 3) suggested canvas nodes (knowledge/asset/marketing/repurpose/schedule).
Do NOT output youtube/instagram/tiktok/twitter JSON.`

export const APPLY_REPAIR_SUFFIX = `

Your previous reply was NOT usable (ops/contract meta, or invalid workflow JSON).
Return ONLY one JSON object in the required Apply schema:
{"status":"ready","summary":"...","workflow":{"title":"...","nodes":[{"tempId":"a","kind":"knowledgeSource","title":"...","body":"..."}],"edges":[{"source":"a","target":"b"}]}}
OR {"status":"need_clarification","questions":["..."]}
No TASK-prefix, no PIVOT-Ops, no markdown fences.`
