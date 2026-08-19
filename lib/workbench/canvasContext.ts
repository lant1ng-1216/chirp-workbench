import type { CanvasNodeData, CanvasNodeKind, KnowledgeEntry } from '@/lib/canvas'

export type CanvasNodeSnap = {
  id: string
  kind: CanvasNodeKind
  title: string
  status?: string
  hasAngles?: boolean
  hasPlatforms?: boolean
}

export type CanvasContext = {
  summaryText: string
  nodes: CanvasNodeSnap[]
  selectedId: string | null
  knowledgeCount: number
  boardTaskCount: number
  marketingIds: string[]
  knowledgeNodeIds: string[]
}

export function buildCanvasContext(opts: {
  nodes: Array<{ id: string; data: CanvasNodeData | unknown }>
  selectedId: string | null
  knowledgeEntries: KnowledgeEntry[]
  boardTaskCount: number
  zh: boolean
}): CanvasContext {
  const snaps: CanvasNodeSnap[] = opts.nodes.map(n => {
    const d = n.data as CanvasNodeData
    return {
      id: n.id,
      kind: d.kind,
      title: d.title || d.kind,
      status: d.status,
      hasAngles: Boolean(d.angles?.length),
      hasPlatforms: Boolean(d.platforms && Object.values(d.platforms).some(Boolean)),
    }
  })

  const marketingIds = snaps.filter(s => s.kind === 'marketing').map(s => s.id)
  const knowledgeNodeIds = snaps
    .filter(s => s.kind === 'knowledgeCard' || s.kind === 'knowledgeSource')
    .map(s => s.id)

  const lines = snaps.slice(0, 24).map(s => {
    const flags = [
      s.hasAngles ? 'angles' : '',
      s.hasPlatforms ? 'platforms' : '',
      s.status || '',
    ].filter(Boolean).join(',')
    return `- ${s.kind} “${s.title}” (${s.id})${flags ? ` [${flags}]` : ''}`
  })

  const sel = snaps.find(s => s.id === opts.selectedId)
  const head = opts.zh
    ? [
        `画布节点 ${snaps.length} · 知识库条目 ${opts.knowledgeEntries.length} · 排期待办 ${opts.boardTaskCount}`,
        sel ? `当前选中：${sel.kind} “${sel.title}”` : '当前无选中节点',
        '节点列表：',
        ...(lines.length ? lines : ['（空画布）']),
      ]
    : [
        `Canvas nodes ${snaps.length} · knowledge entries ${opts.knowledgeEntries.length} · board tasks ${opts.boardTaskCount}`,
        sel ? `Selected: ${sel.kind} “${sel.title}”` : 'Nothing selected',
        'Nodes:',
        ...(lines.length ? lines : ['(empty canvas)']),
      ]

  return {
    summaryText: head.join('\n'),
    nodes: snaps,
    selectedId: opts.selectedId,
    knowledgeCount: opts.knowledgeEntries.length,
    boardTaskCount: opts.boardTaskCount,
    marketingIds,
    knowledgeNodeIds,
  }
}
