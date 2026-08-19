/**
 * Plan chat: markdown contract, normalize, extract steps / follow-ups.
 */

export function buildPlanChatPrompt(userMsg: string, zh: boolean, canvasContext?: string): string {
  const ctx = canvasContext?.trim()
    ? (zh
      ? `\n\n当前画布（只读，禁止编造不存在的节点 id；排期是「排期·待办板」不是 schedule 画布节点）：\n${canvasContext}\n`
      : `\n\nCurrent canvas (read-only; do not invent node ids; schedule is the Schedule·Tasks board, not a canvas schedule node):\n${canvasContext}\n`)
    : ''

  if (zh) {
    return `你是 Chirp 内容策划助手（Plan 模式）。用户在画布工作流里规划内容。

请用简洁中文回复，必须使用 Markdown，且包含以下三级标题（不可省略）：

## 方向
2～4 句结论。每句单独成段或同一段内正常标点，不要整篇挤成一行。

## 分步 Plan
严格用有序列表，**每步只占一行**，3～6 步。格式必须是：
1. 短标题（≤20字）— 一句说明
2. …
禁止把多步粘成一段；禁止在列表项里塞平台规格长文（TikTok 9:16 等细节放到「画布建议」或省略）。

## 画布建议
无序列表：节点种类 + 连线意图，每条一行。营销角度是**一个 marketing 节点上的 angles[]**，不要建议「每个角度一个子节点」。

可选：
## 下一步
2～3 条短 follow-up（用户可点选）。

规则：
- 定制用户目标，不灌水。
- 版本号如 2.0 不要写成列表序号。
- 禁止四平台 JSON；禁止 TASK-prefix / PIVOT-Ops。
- 若用户主要在要「写好的营销角度/文案」，不要用 Plan 四段式硬套，应提示改用写角度能力。
${ctx}
用户说：
${userMsg}`
  }
  return `You are Chirp's content planning assistant (Plan mode).

Reply in Markdown with required H2 sections:

## Direction
(2–4 short sentences)

## Step-by-step Plan
Numbered list, ONE step per line, 3–6 steps. Short title + one clause. No walls of specs.

## Canvas suggestions
Bullet list of node kinds + wiring. Marketing angles live on ONE marketing node as angles[] — do not suggest one node per angle.

Optional ## Next with 2–3 follow-ups.

Do not treat product versions like 2.0 as list markers. No four-platform JSON. No TASK-prefix / PIVOT-Ops.
If the user mainly wants finished marketing angles/copy, do not force a full Plan — point them to angle drafting.
${ctx}
User:
${userMsg}`
}

export function buildAgentChatPrompt(userMsg: string, zh: boolean, canvasContext?: string): string {
  const ctx = canvasContext?.trim()
    ? (zh
      ? `\n当前画布摘要：\n${canvasContext}\n`
      : `\nCanvas summary:\n${canvasContext}\n`)
    : ''
  if (zh) {
    return `你是 Chirp 工作区 Agent（Minds）。像 Claude 一样正常对话：简洁、有用。
可以聊策略、解释画布，但不要无故输出「方向/分步 Plan/画布建议」四段式。
若用户明确要落地画布或写营销角度，用一两句说明可以点「应用到画布」或说「写 3 个营销角度」/使用 /apply /angles。
禁止四平台 JSON；禁止编造节点 id。
绝对禁止输出任何 TASK-prefix、合同确认、contract IDs、PIVOT-Ops、工单/运营类内容；不要复述历史线程。
${ctx}
用户：
${userMsg}`
  }
  return `You are Chirp's workspace Agent (Minds). Chat like Claude: concise and useful.
Do not force a Plan markdown template unless asked to plan.
If they want canvas changes or marketing angles, briefly point to Apply /angles /apply.
No four-platform JSON. Do not invent node ids.
Never output TASK-prefix, contract confirmations, contract IDs, PIVOT-Ops, or internal/ops chatter; do not recap prior threads.
${ctx}
User:
${userMsg}`
}

/**
 * Normalize Mind output without breaking decimals like "2.0".
 * Only promote real list markers at line starts.
 */
export function normalizePlanMarkdown(raw: string): string {
  let t = (raw || '').replace(/<[^>]+>/g, ' ').trim()
  if (!t) return t

  t = t.replace(
    /(^|\n|\s)(#{0,2}\s*)?(方向建议|方向|分步\s*Plan|分步计划|画布节点组合|画布建议|下一步)(\s*[:：])?/gi,
    (_m, pre, _hashes, title) => `${pre === '\n' ? '\n' : pre}\n\n## ${title}\n\n`,
  )
  t = t.replace(/(^|\s)##\s*(Direction|Step-by-step Plan|Canvas suggestions|Next)\b/gi, '\n\n## $2\n\n')

  // List markers ONLY at start of string or after newline — never mid-token (avoids 2.0 → "2." + "0")
  t = t.replace(/(^|\n)\s*(\d+)([.)、])(?!\d)\s+/g, '$1$2. ')

  // Split jammed Chinese step labels onto new lines
  t = t.replace(
    /(?=[\s，。；]|^)((?:锁定知识源|提炼知识卡|生成营销|出营销|四平台复用|跨平台复用|挂排期|排期锚点|应用到画布)[^。\n]{0,8}[：:])/g,
    '\n$1',
  )

  t = t.replace(/\n{3,}/g, '\n\n').trim()
  return t
}

/** Body for markdown bubble when steps are shown as TaskRows (drop duplicate Plan section). */
export function markdownWithoutPlanSteps(md: string): string {
  const lines = (md || '').split('\n')
  const out: string[] = []
  let skipping = false
  for (const line of lines) {
    if (/^##\s*(分步\s*Plan|分步计划|Step-by-step Plan)\b/i.test(line)) {
      skipping = true
      continue
    }
    if (skipping && /^##\s+/.test(line)) skipping = false
    if (!skipping) out.push(line)
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export type PlanStep = { id: string; title: string }

const STEP_LABEL =
  /^(?:锁定知识源|提炼知识卡|生成营销|出营销角度|出营销|四平台复用|跨平台复用|挂排期|排期|应用到画布)[^：:]{0,12}[：:]/

export function extractPlanSteps(md: string): PlanStep[] {
  const normalized = normalizePlanMarkdown(md)
  const fromLines = stepsFromPlanSection(normalized)
  if (fromLines.length >= 2) return fromLines.slice(0, 8)

  const section = planSectionBody(normalized)
  const fromLabels = stepsFromLabelSplits(section || normalized)
  if (fromLabels.length >= 2) return fromLabels.slice(0, 8)

  return fromLines.length ? fromLines : fromLabels
}

function planSectionBody(md: string): string {
  const lines = md.split('\n')
  let inPlan = false
  const body: string[] = []
  for (const line of lines) {
    if (/^##\s*(分步|Step)/i.test(line)) {
      inPlan = true
      continue
    }
    if (/^##\s+/.test(line) && inPlan) break
    if (inPlan) body.push(line)
  }
  return body.join('\n').trim()
}

function stepsFromPlanSection(md: string): PlanStep[] {
  const steps: PlanStep[] = []
  const lines = md.split('\n')
  let inPlan = false
  for (const line of lines) {
    if (/^##\s*(分步|Step)/i.test(line)) {
      inPlan = true
      continue
    }
    if (/^##\s+/.test(line) && inPlan) break
    if (!inPlan) continue
    const m = line.match(/^\s*(?:\d+[.)]\s*|[-*]\s+)(.+)/)
    if (m) {
      const title = shortenStep(m[1])
      if (title) steps.push({ id: `s${steps.length + 1}`, title })
      continue
    }
    const label = line.trim().match(STEP_LABEL)
    if (label) {
      const title = shortenStep(line.trim())
      if (title) steps.push({ id: `s${steps.length + 1}`, title })
    }
  }
  return steps
}

function stepsFromLabelSplits(body: string): PlanStep[] {
  const text = body.replace(/\s+/g, ' ').trim()
  if (!text) return []
  const parts = text.split(
    /(?=(?:锁定知识源|提炼知识卡|生成营销|出营销|四平台复用|跨平台复用|挂排期|排期节点|应用到画布)[^。]{0,16}[：:])/,
  )
  const steps: PlanStep[] = []
  for (const p of parts) {
    const t = shortenStep(p.trim())
    if (t && t.length > 4) steps.push({ id: `s${steps.length + 1}`, title: t })
  }
  return steps
}

function shortenStep(raw: string): string {
  let t = raw.replace(/\*\*/g, '').replace(/^\d+[.)]\s*/, '').trim()
  // Keep first clause
  const cut = t.split(/[。；;\n]/)[0] || t
  t = cut.trim()
  if (t.length > 72) t = `${t.slice(0, 70)}…`
  return t
}

export function extractFollowUps(md: string, zh: boolean): string[] {
  const lines = md.split('\n')
  let inNext = false
  const out: string[] = []
  for (const line of lines) {
    if (/^##\s*(下一步|Next)\b/i.test(line)) {
      inNext = true
      continue
    }
    if (/^##\s+/.test(line) && inNext) break
    if (!inNext) continue
    const m = line.match(/^\s*(?:\d+[.)]\s*|[-*]\s+)(.+)/)
    if (m) out.push(m[1].replace(/\*\*/g, '').trim())
  }
  if (out.length) return out.slice(0, 3)
  return zh
    ? ['把这个 Plan 应用到画布', '为 Electric Mint 写 3 个营销角度', '加一条素材分析节点']
    : ['Apply this plan to the canvas', 'Draft 3 marketing angles', 'Add an asset-analyze node']
}
