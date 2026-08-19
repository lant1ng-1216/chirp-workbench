/** Client helpers to run workbench nodes against Minds (SSE + analyze API). */

import type { CreatorProfile } from '@/lib/brand'
import { buildRepurposePrompt, parseRepurposeReply, REPAIR_PROMPT_SUFFIX, isRepurposeGrounded } from '@/lib/minds/repurpose'
import {
  buildMarketingPrompt,
  MARKETING_REPAIR_SUFFIX,
  parseMarketingAngles,
  formatAnglesPlain,
  type MarketingAngle,
} from '@/lib/workbench/marketing'
import { buildPlanApplyPrompt, parsePlanApplyReply } from '@/lib/workbench/workflowBuild'
import { buildAgentChatPrompt, buildPlanChatPrompt, normalizePlanMarkdown } from '@/lib/workbench/planFormat'
import {
  AGENT_CHAT_REPAIR_SUFFIX,
  APPLY_REPAIR_SUFFIX,
  isContractMetaReply,
  isPlausibleKnowledgeCard,
  KNOWLEDGE_REPAIR_SUFFIX,
  looksLikeRepurposeJson,
  PLAN_REPAIR_SUFFIX,
} from '@/lib/workbench/replyQuality'

/** Unified wait budget for long Minds tasks (refine / marketing / repurpose). */
export const MINDS_REPLY_TIMEOUT_MS = 300_000

export type WaitProgress = {
  phase: 'sending' | 'waiting' | 'polling'
  elapsedMs: number
}

async function pollHistoryOnce(
  alias: string,
  since: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/minds/history?alias=${encodeURIComponent(alias)}&limit=8`,
    )
    if (!res.ok) return null
    const data = await res.json() as {
      messages?: Array<{ role?: string; senderType?: number; text?: string; messageText?: string; createdAt?: string }>
      history?: Array<{ role?: string; senderType?: number; text?: string; messageText?: string; createdAt?: string }>
    }
    const list = data.history ?? data.messages ?? []
    for (let i = list.length - 1; i >= 0; i--) {
      const m = list[i] as {
        senderType?: number
        messageText?: string
        text?: string
        createdAt?: string
      }
      const raw = String(m.createdAt ?? '')
      const normalized = raw && !raw.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(raw) ? `${raw}Z` : raw
      const t = normalized ? new Date(normalized).getTime() : 0
      if (t && t < since - 2000) continue
      const isMind = m.senderType === 0 || m.senderType === 2
      const text = (m.messageText ?? m.text ?? '').replace(/<[^>]+>/g, ' ').trim()
      if (isMind && text) return text
    }
    return null
  } catch {
    return null
  }
}

export async function sendAndWaitForReply(
  alias: string,
  message: string,
  timeoutMs = MINDS_REPLY_TIMEOUT_MS,
  onProgress?: (p: WaitProgress) => void,
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const started = Date.now()
  const tick = (phase: WaitProgress['phase']) => {
    onProgress?.({ phase, elapsedMs: Date.now() - started })
  }

  try {
    tick('sending')
    const sendRes = await fetch('/api/minds/send-async', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias, message }),
    })
    const sendData = await sendRes.json()
    if (!sendRes.ok || sendData.error) {
      return { ok: false, error: sendData.error ?? `HTTP ${sendRes.status}` }
    }
    const sentAt = sendData.sentAt as number
    tick('waiting')

    const sseResult = await new Promise<{ ok: boolean; text?: string; error?: string }>(resolve => {
      const es = new EventSource(`/api/minds/events?alias=${encodeURIComponent(alias)}&since=${sentAt}`)
      const progressIv = setInterval(() => tick('waiting'), 4000)
      const timeout = setTimeout(() => {
        clearInterval(progressIv)
        es.close()
        resolve({ ok: false, error: 'timeout' })
      }, timeoutMs)
      es.addEventListener('reply', (ev) => {
        clearTimeout(timeout)
        clearInterval(progressIv)
        es.close()
        try {
          const data = JSON.parse((ev as MessageEvent).data) as { messageText: string }
          const clean = (data.messageText ?? '').replace(/<[^>]+>/g, ' ').trim()
          resolve({ ok: true, text: clean })
        } catch {
          resolve({ ok: false, error: 'parse-error' })
        }
      })
      es.addEventListener('error', () => {
        // EventSource auto-reconnects; only fail on timeout
      })
    })

    if (sseResult.ok) return sseResult

    // Soft recovery: one history poll after SSE timeout (reply may have landed)
    tick('polling')
    const polled = await pollHistoryOnce(alias, sentAt)
    if (polled) return { ok: true, text: polled }

    return sseResult.error === 'timeout'
      ? { ok: false, error: 'timeout' }
      : sseResult
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

export function stripToText(s: string) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Distill raw notes into a brand knowledge card via Minds SSE (+ one repair on meta/junk). */
export async function refineKnowledge(
  alias: string,
  sourceText: string,
  onProgress?: (p: WaitProgress) => void,
  zh = true,
) {
  const prompt = `TASK: Distill the following into a concise brand/knowledge card for a content creator workbench.
Return plain text ONLY with short sections: ${zh ? '定位 / 受众 / 语气 / 内容支柱 / 可做 / 不要做' : 'Positioning, Audience, Tone, Pillars, Do/Don\'t'}.
No HTML. No JSON. No TASK-prefix. No contract IDs. No PIVOT-Ops. No ops acknowledgements.
INPUT:
"""
${sourceText}
"""`
  const first = await sendAndWaitForReply(alias, prompt, MINDS_REPLY_TIMEOUT_MS, onProgress)
  if (!first.ok || !first.text) return first
  if (isPlausibleKnowledgeCard(first.text) && !isContractMetaReply(first.text)) {
    return first
  }
  const repair = await sendAndWaitForReply(
    alias,
    prompt + KNOWLEDGE_REPAIR_SUFFIX + `\n\nPREVIOUS UNUSABLE REPLY:\n${first.text.slice(0, 800)}`,
    MINDS_REPLY_TIMEOUT_MS,
    onProgress,
  )
  if (!repair.ok || !repair.text) {
    return { ok: false as const, error: 'knowledge-unusable' }
  }
  if (!isPlausibleKnowledgeCard(repair.text) || isContractMetaReply(repair.text)) {
    return { ok: false as const, error: 'knowledge-unusable' }
  }
  return repair
}

/** Plan-mode chat with markdown contract + one repair if Mind returns repurpose JSON. */
export async function planChatViaMinds(
  alias: string,
  userMsg: string,
  zh: boolean,
  onProgress?: (p: WaitProgress) => void,
  canvasContext?: string,
) {
  const prompt = buildPlanChatPrompt(userMsg, zh, canvasContext)

  const first = await sendAndWaitForReply(alias, prompt, MINDS_REPLY_TIMEOUT_MS, onProgress)
  if (!first.ok || !first.text) return first
  if (!looksLikeRepurposeJson(first.text) && !isContractMetaReply(first.text)) {
    return { ok: true as const, text: normalizePlanMarkdown(first.text) }
  }

  const repair = await sendAndWaitForReply(
    alias,
    prompt + PLAN_REPAIR_SUFFIX + `\n\nPREVIOUS WRONG REPLY:\n${first.text.slice(0, 600)}`,
    MINDS_REPLY_TIMEOUT_MS,
    onProgress,
  )
  if (!repair.ok || !repair.text) {
    return {
      ok: true as const,
      text: zh
        ? '刚才模型误回了跨平台复用 JSON。请换个说法再问一次，或到「跨平台复用」节点去拆四平台。'
        : 'The model returned a repurpose JSON by mistake. Rephrase, or use the Repurpose node for four-platform drafts.',
    }
  }
  if (looksLikeRepurposeJson(repair.text) || isContractMetaReply(repair.text)) {
    return {
      ok: true as const,
      text: zh
        ? 'Plan 被串成了复用结果。请再描述一次目标（平台/是否已有成稿），或改用「应用到画布」。'
        : 'Plan was contaminated by a repurpose reply. Clarify goals again, or use Apply to canvas.',
    }
  }
  return { ok: true as const, text: normalizePlanMarkdown(repair.text) }
}

/** Free-form chat (no forced Plan sections). */
export async function agentChatViaMinds(
  alias: string,
  userMsg: string,
  zh: boolean,
  onProgress?: (p: WaitProgress) => void,
  canvasContext?: string,
) {
  const prompt = buildAgentChatPrompt(userMsg, zh, canvasContext)
  const r = await sendAndWaitForReply(alias, prompt, MINDS_REPLY_TIMEOUT_MS, onProgress)
  if (!r.ok || !r.text) return r
  if (looksLikeRepurposeJson(r.text)) {
    return {
      ok: true as const,
      text: zh
        ? '刚才误回了跨平台 JSON。请直接问策略问题，或到复用节点拆四平台。'
        : 'Got a repurpose JSON by mistake. Ask in chat, or use the Repurpose node.',
    }
  }
  // Align with plan/marketing: do not surface contract/ops chatter (TASK-prefix, PIVOT-Ops).
  if (!isContractMetaReply(r.text)) {
    return { ok: true as const, text: r.text.trim() }
  }
  const repair = await sendAndWaitForReply(
    alias,
    prompt + AGENT_CHAT_REPAIR_SUFFIX + `\n\nPREVIOUS UNUSABLE REPLY:\n${r.text.slice(0, 600)}`,
    MINDS_REPLY_TIMEOUT_MS,
    onProgress,
  )
  if (repair.ok && repair.text && !isContractMetaReply(repair.text) && !looksLikeRepurposeJson(repair.text)) {
    return { ok: true as const, text: repair.text.trim() }
  }
  return {
    ok: true as const,
    text: zh
      ? '刚才那次回复串到了无关内容。请换种说法再问一次；要落到画布可直接点「应用到画布」或用 /apply、/plan。'
      : 'That reply drifted into unrelated ops text. Please rephrase, or use Apply to canvas / /apply / /plan directly.',
  }
}

/** Analyze an asset via existing /api/minds/analyze-asset (Minds under the hood). */
export async function analyzeAssetViaApi(opts: {
  alias: string
  name: string
  type?: string
  description: string
  profile?: CreatorProfile
}): Promise<{ ok: true; tags: string[]; summary: string; platforms: string[] } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/minds/analyze-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alias: opts.alias,
        name: opts.name,
        type: opts.type || 'text',
        description: opts.description,
        profile: opts.profile
          ? {
              name: opts.profile.name,
              contentStyle: opts.profile.contentStyle,
              audience: opts.profile.audience,
              tone: opts.profile.tone,
              topics: opts.profile.topics,
            }
          : undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      return { ok: false, error: data.error ?? `HTTP ${res.status}` }
    }
    return {
      ok: true,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      summary: typeof data.analysis === 'string' ? data.analysis : '',
      platforms: Array.isArray(data.platforms) ? data.platforms.map(String) : [],
    }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

/** Fallback asset analysis via SSE when the dedicated API is unavailable. */
export async function analyzeAssetViaSse(
  alias: string,
  title: string,
  body: string,
  onProgress?: (p: WaitProgress) => void,
) {
  const prompt = `TASK: Analyze this content asset for a creator workbench. Return JSON only: {"tags":["..."],"summary":"...","platforms":["youtube"|"instagram"|"tiktok"|"twitter"]}.
ASSET NAME: ${title}
DESCRIPTION / CONTENT:
"""
${body}
"""`
  return sendAndWaitForReply(alias, prompt, MINDS_REPLY_TIMEOUT_MS, onProgress)
}

/** Marketing angles grounded ONLY in provided upstream knowledge/assets. */
export async function generateMarketing(
  alias: string,
  knowledgeCtx: string,
  sourceText: string,
  assetCtx: string,
  onProgress?: (p: WaitProgress) => void,
): Promise<
  | { ok: true; text: string; angles: MarketingAngle[] }
  | { ok: false; error: string }
> {
  const prompt = buildMarketingPrompt(knowledgeCtx, assetCtx, sourceText)
  const first = await sendAndWaitForReply(alias, prompt, MINDS_REPLY_TIMEOUT_MS, onProgress)
  if (!first.ok || !first.text) return { ok: false, error: first.error ?? 'empty' }

  if (/INSUFFICIENT_UPSTREAM/i.test(first.text) || isContractMetaReply(first.text)) {
    // Still try repair once for contract meta; insufficient stays fail
    if (/INSUFFICIENT_UPSTREAM/i.test(first.text)) {
      return { ok: false, error: 'insufficient-upstream' }
    }
  }

  let parsed = parseMarketingAngles(first.text)
  if (parsed.ok && !isContractMetaReply(first.text)) {
    return { ok: true, text: formatAnglesPlain(parsed.angles), angles: parsed.angles }
  }

  const repair = await sendAndWaitForReply(
    alias,
    prompt + MARKETING_REPAIR_SUFFIX + `\n\nPREVIOUS UNUSABLE REPLY:\n${first.text.slice(0, 800)}`,
    MINDS_REPLY_TIMEOUT_MS,
    onProgress,
  )
  if (!repair.ok || !repair.text) {
    return { ok: false, error: repair.error ?? 'marketing-unusable' }
  }
  if (/INSUFFICIENT_UPSTREAM/i.test(repair.text)) {
    return { ok: false, error: 'insufficient-upstream' }
  }
  if (isContractMetaReply(repair.text)) {
    return { ok: false, error: 'marketing-unusable' }
  }
  parsed = parseMarketingAngles(repair.text)
  if (!parsed.ok) return { ok: false, error: `marketing-unusable:${parsed.reason}` }
  return { ok: true, text: formatAnglesPlain(parsed.angles), angles: parsed.angles }
}

export async function planApplyViaMinds(
  alias: string,
  conversation: string,
  zh: boolean,
  onProgress?: (p: WaitProgress) => void,
) {
  const prompt = buildPlanApplyPrompt(conversation, zh)
  const first = await sendAndWaitForReply(alias, prompt, MINDS_REPLY_TIMEOUT_MS, onProgress)
  if (!first.ok || !first.text) return first

  const firstParsed = parsePlanApplyReply(first.text)
  if (
    !isContractMetaReply(first.text)
    && (firstParsed.status === 'ready' || firstParsed.status === 'need_clarification')
  ) {
    return first
  }

  const repair = await sendAndWaitForReply(
    alias,
    prompt + APPLY_REPAIR_SUFFIX + `\n\nPREVIOUS UNUSABLE REPLY:\n${first.text.slice(0, 600)}`,
    MINDS_REPLY_TIMEOUT_MS,
    onProgress,
  )
  if (!repair.ok || !repair.text) {
    return { ok: false as const, error: 'apply-unusable' }
  }
  if (isContractMetaReply(repair.text)) {
    return { ok: false as const, error: 'apply-unusable' }
  }
  const repaired = parsePlanApplyReply(repair.text)
  if (repaired.status === 'error') {
    return { ok: false as const, error: `apply-unusable:${repaired.error}` }
  }
  return repair
}

/** Cross-platform repurpose with parse + grounding repair. */
export async function runRepurpose(
  alias: string,
  profile: CreatorProfile,
  sourceText: string,
  onProgress?: (p: WaitProgress) => void,
) {
  const runId = `R-${Date.now().toString(36)}`
  const prompt = buildRepurposePrompt(profile, sourceText, runId)
  const first = await sendAndWaitForReply(alias, prompt, MINDS_REPLY_TIMEOUT_MS, onProgress)
  if (!first.ok || !first.text) return { ok: false as const, error: first.error ?? 'empty' }

  let parsed = parseRepurposeReply(first.text)
  if (parsed.ok && isRepurposeGrounded(sourceText, parsed.result)) {
    return { ok: true as const, result: parsed.result }
  }

  const failHint = !parsed.ok
    ? parsed.reason
    : 'ungrounded-off-topic'
  const repair = await sendAndWaitForReply(
    alias,
    prompt + REPAIR_PROMPT_SUFFIX + `\n\nPREVIOUS UNUSABLE REPLY (${failHint}):\n${first.text.slice(0, 1200)}`,
    MINDS_REPLY_TIMEOUT_MS,
    onProgress,
  )
  if (!repair.ok || !repair.text) {
    return { ok: false as const, error: `repurpose-failed: ${failHint}; repair: ${repair.error ?? 'empty'}` }
  }
  parsed = parseRepurposeReply(repair.text)
  if (!parsed.ok) return { ok: false as const, error: `repurpose-failed: ${parsed.reason}` }
  if (!isRepurposeGrounded(sourceText, parsed.result)) {
    return { ok: false as const, error: 'repurpose-failed: ungrounded' }
  }
  return { ok: true as const, result: parsed.result }
}
