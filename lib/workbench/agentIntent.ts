/**
 * Sidebar Agent intent: chat / plan / deliverable / canvas — Claude-like routing.
 */

export type AgentIntent =
  | 'chat'
  | 'plan'
  | 'deliverable_angles'
  | 'canvas_apply'
  | 'canvas_run'
  | 'canvas_schedule'
  | 'help'

export type AgentReplyKind = 'chat' | 'plan' | 'deliverable' | 'canvas' | 'clarify' | 'error'

export type AgentToolChip = {
  id: string
  label: string
  status?: 'done' | 'running' | 'error' | 'pending'
}

export type AgentTurnResult = {
  text: string
  kind: AgentReplyKind
  angles?: import('@/lib/workbench/marketing').MarketingAngle[]
  tools?: AgentToolChip[]
  offerApply?: boolean
  lastAppliedIds?: string[]
  clarifyQuestions?: string[]
  clarifyNote?: string
  openSchedule?: boolean
  pipelineTasks?: Array<{ id: string; title: string; status: 'running' | 'done' | 'error' | 'pending'; meta?: string }>
  detectedIntent: AgentIntent
}

export type SlashParse = {
  command: AgentIntent | null
  rest: string
}

const SLASH: Record<string, AgentIntent> = {
  plan: 'plan',
  angles: 'deliverable_angles',
  angle: 'deliverable_angles',
  marketing: 'deliverable_angles',
  apply: 'canvas_apply',
  run: 'canvas_run',
  pipeline: 'canvas_run',
  schedule: 'canvas_schedule',
  board: 'canvas_schedule',
  help: 'help',
  chat: 'chat',
}

/** Parse leading `/command` (P2). */
export function parseSlashCommand(raw: string): SlashParse {
  const t = (raw || '').trim()
  const m = t.match(/^\/([a-zA-Z_-]+)\s*([\s\S]*)$/)
  if (!m) return { command: null, rest: t }
  const key = m[1].toLowerCase()
  const intent = SLASH[key]
  if (!intent) return { command: null, rest: t }
  return { command: intent, rest: (m[2] || '').trim() }
}

export function classifyAgentIntent(raw: string): AgentIntent {
  const slash = parseSlashCommand(raw)
  if (slash.command) return slash.command

  const t = slash.rest.toLowerCase()
  const zh = raw

  if (/^\/help\b/i.test(raw.trim()) || /^(帮助|怎么用|你能做什么)\s*$/.test(zh.trim())) {
    return 'help'
  }

  // Canvas act — strong verbs
  if (
    /应用到画布|落到画布|生成工作流|搭(?:建)?(?:一条)?(?:工作流|链路)|apply\s+(to\s+)?canvas|materialize|build\s+(the\s+)?workflow/i.test(zh)
    || /\bapply\b/.test(t)
  ) {
    return 'canvas_apply'
  }
  if (
    /一键(?:按依赖)?运行|按依赖(?:跑|运行)|跑(?:一遍)?(?:管线|pipeline)|运行(?:此)?工作流|run\s+(the\s+)?pipeline|run\s+workflow/i.test(zh)
  ) {
    return 'canvas_run'
  }
  if (
    /(?:打开|查看)?排期\s*[·・]?\s*待办|(?:打开|查看)排期板|schedule\s*board|加(?:到)?排期板|\/schedule\b/i.test(zh)
    && !/知识|营销|复用|角度|plan|规划/i.test(zh)
  ) {
    return 'canvas_schedule'
  }

  // Deliverable — angles / copy (before generic plan)
  if (
    /写\s*\d*\s*个?营销角度|出\s*\d*\s*个?角度|营销角度|headline\s*[:：]|draft\s+\d*\s*angles?|marketing\s+angles?|写(?:一?[点些])?营销文案|三个角度|3\s*个角度/i.test(zh)
  ) {
    return 'deliverable_angles'
  }

  // Plan — roadmap without immediate execute
  if (
    /规划|计划|方案|路线|分步|怎么搭|怎么做|plan\b|roadmap|拆解一下/i.test(zh)
    && !/写\s*\d*\s*个?角度|应用到画布|一键运行/i.test(zh)
  ) {
    return 'plan'
  }

  // Soft plan: long brief about workflow chain
  if (/知识.{0,24}营销.{0,24}(?:复用|排期)|knowledge.{0,20}marketing.{0,20}repurpose/i.test(zh)) {
    return 'plan'
  }

  return 'chat'
}

export function followUpsForKind(kind: AgentReplyKind, zh: boolean): string[] {
  if (zh) {
    switch (kind) {
      case 'plan':
        return ['应用到画布', '先写 3 个营销角度', '打开排期 · 待办']
      case 'deliverable':
        return ['应用到画布（若还没有链路）', '一键运行营销上游', '继续拆四平台复用']
      case 'canvas':
        return ['一键按依赖运行', '为营销写 3 个角度', '打开排期 · 待办']
      case 'clarify':
        return ['补充品牌设定到知识库', '先规划一条链路', '说明目标平台']
      case 'error':
        return ['重试', '改用 /plan 先规划', '打开排期 · 待办']
      default:
        return ['规划一条知识→营销→复用链路', '写 3 个营销角度', '应用到画布']
    }
  }
  switch (kind) {
    case 'plan':
      return ['Apply to canvas', 'Draft 3 marketing angles', 'Open schedule board']
    case 'deliverable':
      return ['Apply workflow if missing', 'Run upstream → marketing', 'Repurpose to 4 platforms']
    case 'canvas':
      return ['Run pipeline by deps', 'Draft 3 marketing angles', 'Open schedule board']
    case 'clarify':
      return ['Add brand knowledge first', 'Plan a workflow', 'Clarify target platforms']
    case 'error':
      return ['Retry', 'Use /plan first', 'Open schedule board']
    default:
      return ['Plan knowledge → marketing → reuse', 'Draft 3 angles', 'Apply to canvas']
  }
}

export function intentLabel(intent: AgentIntent, zh: boolean): string {
  if (zh) {
    switch (intent) {
      case 'plan': return 'Plan'
      case 'deliverable_angles': return 'Writing'
      case 'canvas_apply':
      case 'canvas_run':
      case 'canvas_schedule': return 'Canvas'
      case 'help': return 'Help'
      default: return 'Chat'
    }
  }
  switch (intent) {
    case 'plan': return 'Plan'
    case 'deliverable_angles': return 'Writing'
    case 'canvas_apply':
    case 'canvas_run':
    case 'canvas_schedule': return 'Canvas'
    case 'help': return 'Help'
    default: return 'Chat'
  }
}

export function helpText(zh: boolean): string {
  if (zh) {
    return `我是 Chirp 工作区 Agent（Minds）。

**能做的事**
- 聊天对齐品牌与策略
- \`/plan\` 出分步方案
- \`/angles\` 写营销角度并写入画布营销节点（吃上游知识）
- \`/apply\` 把方案落到画布节点与连线
- \`/run\` 按依赖跑管线
- \`/schedule\` 打开排期 · 待办板

亮点：在对话里驱动画布，而不只是写文档。`
  }
  return `I'm the Chirp workspace Agent (Minds).

**I can**
- Chat about brand & strategy
- \`/plan\` for a step plan
- \`/angles\` draft marketing angles into a marketing node (grounded in upstream)
- \`/apply\` land a workflow on the canvas
- \`/run\` run the pipeline by deps
- \`/schedule\` open the schedule · tasks board

Highlight: drive the canvas from chat — not docs only.`
}
