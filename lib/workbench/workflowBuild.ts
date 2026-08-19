import type { CanvasEdge, CanvasNode, CanvasNodeKind } from '@/lib/canvas'
import { makeNode } from '@/lib/canvas'
import { enrichWorkflowFromConversation } from '@/lib/workbench/assetMatch'

export type WorkflowSpecNode = {
  tempId: string
  kind: CanvasNodeKind
  title?: string
  body?: string
  tags?: string[]
}

export type WorkflowSpec = {
  title?: string
  nodes: WorkflowSpecNode[]
  edges: Array<{ source: string; target: string }>
}

export type PlanApplyResult =
  | { status: 'ready'; workflow: WorkflowSpec; summary?: string }
  | { status: 'need_clarification'; questions: string[]; note?: string }
  | { status: 'error'; error: string }

const KIND_SET = new Set<CanvasNodeKind>([
  'knowledgeSource', 'knowledgeCard', 'asset', 'marketing', 'repurpose', 'schedule', 'note',
])

export function parsePlanApplyReply(raw: string): PlanApplyResult {
  const text = raw.replace(/```json|```/g, '').trim()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) {
    return { status: 'error', error: 'no-json' }
  }
  try {
    const j = JSON.parse(match[0]) as {
      status?: string
      questions?: unknown
      note?: string
      summary?: string
      workflow?: {
        title?: string
        nodes?: Array<Record<string, unknown>>
        edges?: Array<Record<string, unknown>>
      }
      error?: string
    }

    if (j.status === 'need_clarification') {
      const questions = Array.isArray(j.questions)
        ? j.questions.map(String).filter(Boolean)
        : []
      if (questions.length === 0) {
        return { status: 'need_clarification', questions: ['请再具体一点：目标平台、内容形式、是否已有成稿？'], note: j.note }
      }
      return { status: 'need_clarification', questions, note: j.note }
    }

    const nodesIn = j.workflow?.nodes ?? (Array.isArray((j as { nodes?: unknown }).nodes) ? (j as { nodes: Array<Record<string, unknown>> }).nodes : [])
    const edgesIn = j.workflow?.edges ?? (Array.isArray((j as { edges?: unknown }).edges) ? (j as { edges: Array<Record<string, unknown>> }).edges : [])

    if (!nodesIn.length) {
      return { status: 'error', error: 'empty-workflow' }
    }

    const nodes: WorkflowSpecNode[] = []
    for (const n of nodesIn) {
      const kind = String(n.kind || '') as CanvasNodeKind
      if (!KIND_SET.has(kind)) continue
      const tempId = String(n.tempId || n.id || `t-${nodes.length}`)
      nodes.push({
        tempId,
        kind,
        title: n.title != null ? String(n.title) : undefined,
        body: n.body != null ? String(n.body) : undefined,
        tags: Array.isArray(n.tags) ? n.tags.map(String) : undefined,
      })
    }
    if (nodes.length === 0) return { status: 'error', error: 'no-valid-nodes' }

    const idSet = new Set(nodes.map(n => n.tempId))
    const edges = edgesIn
      .map(e => ({ source: String(e.source), target: String(e.target) }))
      .filter(e => idSet.has(e.source) && idSet.has(e.target))

    return {
      status: 'ready',
      summary: j.summary || j.workflow?.title,
      workflow: {
        title: j.workflow?.title || j.summary,
        nodes,
        edges,
      },
    }
  } catch {
    return { status: 'error', error: 'json-parse' }
  }
}

/** Fill hollow scaffold bodies from Plan conversation before materializing. */
export function prepareWorkflowSpec(spec: WorkflowSpec, conversation: string): WorkflowSpec {
  const enriched = enrichWorkflowFromConversation(spec.nodes, conversation)
  return {
    ...spec,
    nodes: enriched.map((n, i) => ({
      ...spec.nodes[i],
      title: n.title ?? spec.nodes[i]?.title,
      body: n.body ?? spec.nodes[i]?.body,
    })),
  }
}

/** Layout a workflow onto the canvas near an origin. */
export function materializeWorkflow(
  spec: WorkflowSpec,
  origin: { x: number; y: number },
  zh: boolean,
): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const colW = 320
  const rowH = 200
  const idMap = new Map<string, string>()

  // Simple layered layout by edge depth
  const depth = new Map<string, number>()
  for (const n of spec.nodes) depth.set(n.tempId, 0)
  let changed = true
  while (changed) {
    changed = false
    for (const e of spec.edges) {
      const d = (depth.get(e.source) ?? 0) + 1
      if (d > (depth.get(e.target) ?? 0)) {
        depth.set(e.target, d)
        changed = true
      }
    }
  }

  const buckets = new Map<number, WorkflowSpecNode[]>()
  for (const n of spec.nodes) {
    const d = depth.get(n.tempId) ?? 0
    const list = buckets.get(d) ?? []
    list.push(n)
    buckets.set(d, list)
  }

  const nodes: CanvasNode[] = []
  for (const [d, list] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    list.forEach((n, i) => {
      const defaults = defaultCopy(n.kind, zh)
      const node = makeNode(n.kind, {
        x: origin.x + d * colW,
        y: origin.y + i * rowH,
      }, {
        title: n.title?.trim() || defaults.title,
        body: n.body ?? defaults.body,
        tags: n.tags,
        status: 'idle',
      })
      idMap.set(n.tempId, node.id)
      nodes.push(node)
    })
  }

  const edges: CanvasEdge[] = spec.edges.map((e, i) => ({
    id: `e-wf-${Date.now()}-${i}`,
    source: idMap.get(e.source)!,
    target: idMap.get(e.target)!,
  })).filter(e => e.source && e.target)

  return { nodes, edges }
}

function defaultCopy(kind: CanvasNodeKind, zh: boolean): { title: string; body: string } {
  switch (kind) {
    case 'knowledgeSource':
      return {
        title: zh ? '知识源' : 'Knowledge source',
        body: zh ? '在此粘贴品牌设定 / 成稿素材…' : 'Paste brand brief / source material…',
      }
    case 'knowledgeCard':
      return {
        title: zh ? '品牌知识' : 'Brand knowledge',
        body: zh ? '（运行「提炼」后填充）' : '(Fill by running refine)',
      }
    case 'marketing':
      return {
        title: zh ? '营销草稿' : 'Marketing draft',
        body: zh ? '补充 brief（可选）。生成时将使用上游知识。' : 'Optional brief. Generation uses upstream knowledge.',
      }
    case 'repurpose':
      return {
        title: zh ? '跨平台复用' : 'Cross-platform reuse',
        body: '',
      }
    case 'asset':
      return {
        title: zh ? '素材' : 'Asset',
        body: zh ? '上传图片/视频，或写说明后分析打标。' : 'Upload media or describe, then analyze & tag.',
      }
    case 'schedule':
      return {
        title: zh ? '排期板' : 'Schedule board',
        body: '',
      }
    case 'note':
      return {
        title: zh ? '源内容' : 'Source',
        body: zh ? '在此粘贴成稿…' : 'Paste source draft…',
      }
    default:
      return { title: kind, body: '' }
  }
}

export function buildPlanApplyPrompt(conversation: string, zh: boolean): string {
  return `TASK: You are Chirp's workflow planner. Based on the creator conversation below, either ask clarifying questions OR output a canvas workflow JSON.

Conversation:
"""
${conversation.slice(0, 6000)}
"""

Rules:
- If intent is ambiguous (missing goal, platforms, whether they have a draft, knowledge vs asset-first), return need_clarification.
- If clear enough, return a COMPLETE engineered workflow (typically 3–6 nodes with edges), not a single node and not a toy 2-node stub unless the user truly only asked for that.
- Prefer Chirp node kinds: knowledgeSource, knowledgeCard, asset, marketing, repurpose, schedule, note.
- ALWAYS pre-fill knowledgeSource / knowledgeCard / note / marketing bodies with concrete facts extracted from the conversation (brand, product, platforms, audience, tone). Do not leave empty stubs when the user already said something useful.
- Marketing must sit downstream of knowledgeCard and/or asset when the goal is campaign copy.
- Repurpose should sit downstream of note or marketing when the goal is multi-platform.
- Schedule can sit at the end to pin drafts.

Return ONLY one JSON object (no markdown) in one of these shapes:

{"status":"need_clarification","questions":["...","..."],"note":"optional"}

{"status":"ready","summary":"one-line","workflow":{"title":"...","nodes":[{"tempId":"a","kind":"knowledgeSource","title":"...","body":"..."}],"edges":[{"source":"a","target":"b"}]}}

Language for titles/bodies/questions: ${zh ? 'Chinese' : 'English'}.`
}
