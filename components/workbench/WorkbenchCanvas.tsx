'use client'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode, type DragEvent as ReactDragEvent } from 'react'
import {
  ReactFlow, ReactFlowProvider, Background,
  addEdge, useNodesState, useEdgesState, BackgroundVariant,
  type Connection, type Node, type Edge, type OnSelectionChangeParams,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import { useMingStore } from '@/lib/store'
import type { Project } from '@/lib/brand'
import {
  type CanvasNode, type CanvasNodeData, type CanvasNodeKind, type KnowledgeEntry,
  makeNode,
} from '@/lib/canvas'
import {
  analyzeAssetViaApi,
  analyzeAssetViaSse,
  generateMarketing,
  planApplyViaMinds,
  planChatViaMinds,
  agentChatViaMinds,
  refineKnowledge,
  runRepurpose,
} from '@/lib/workbench/mindsRun'
import { classifyMindsError, mindsErrorMessage } from '@/lib/workbench/errors'
import { isContractMetaReply, isUsableContent } from '@/lib/workbench/replyQuality'
import { exportNodeText, upstreamDeliverable } from '@/lib/workbench/nodeContent'
import { materializeWorkflow, parsePlanApplyReply, prepareWorkflowSpec, type WorkflowSpec } from '@/lib/workbench/workflowBuild'
import { rankAssetsForMarketing } from '@/lib/workbench/assetMatch'
import {
  classifyAgentIntent,
  helpText,
  parseSlashCommand,
  type AgentTurnResult,
} from '@/lib/workbench/agentIntent'
import { buildCanvasContext } from '@/lib/workbench/canvasContext'
import {
  ASSET_MAX_IMAGE, ASSET_MAX_VIDEO, putAssetBlob,
} from '@/lib/workbench/assetStore'
import { getTemplate, type TemplateId } from '@/lib/templates/catalog'
import ChirpNode from './ChirpNode'
import { WorkbenchProvider } from './WorkbenchContext'
import TemplateMarket, { ShopGlyph } from './TemplateMarket'
import AgentSidebar from './AgentSidebar'
import WorkbenchRail from './WorkbenchRail'
import ScheduleBoardPanel from './ScheduleBoardPanel'
import { paletteFor, THEME_DARK, type WorkbenchPalette } from '@/lib/workbench/theme'
import { newBoardTaskId } from '@/lib/workbench/boardTasks'

const nodeTypes = { chirp: ChirpNode }

const SANS = "'DM Sans', sans-serif"
const MONO = "'JetBrains Mono', monospace"
const EMPTY_BOARD_TASKS: import('@/lib/workbench/boardTasks').BoardTask[] = []
const EMPTY_KNOWLEDGE: KnowledgeEntry[] = []

function toFlowNodes(nodes: CanvasNode[]): Node[] {
  return nodes.map(n => ({ ...n, type: 'chirp', data: { ...n.data } }))
}

function edgePair(P: WorkbenchPalette) {
  return {
    def: { stroke: P.edge, strokeWidth: 2.75 },
    sel: {
      stroke: P.edgeSelected,
      strokeWidth: 3.75,
      filter: P === THEME_DARK
        ? 'drop-shadow(0 0 4px rgba(255,255,255,0.35))'
        : 'drop-shadow(0 0 3px rgba(37,99,235,0.25))',
    },
  }
}

function toFlowEdges(edges: { id: string; source: string; target: string }[]): Edge[] {
  const { def } = edgePair(THEME_DARK)
  return edges.map(e => ({
    ...e,
    style: { ...def },
    animated: false,
  }))
}

function styleEdges(edges: Edge[], P: WorkbenchPalette): Edge[] {
  const { def, sel } = edgePair(P)
  return edges.map(e => ({
    ...e,
    animated: false,
    style: e.selected ? { ...sel } : { ...def },
  }))
}

type AddMenuGroup = {
  title: string
  items: [CanvasNodeKind, string][]
}

export default function WorkbenchCanvas({ project }: { project: Project }) {
  const zh = useMingStore(s => s.lang) === 'zh'
  const ensureCanvas = useMingStore(s => s.ensureCanvas)
  const setCanvas = useMingStore(s => s.setCanvas)
  const knowledgeEntries = useMingStore(s => s.knowledgeEntries[project.id] ?? EMPTY_KNOWLEDGE)
  const addKnowledgeEntry = useMingStore(s => s.addKnowledgeEntry)
  const updateProject = useMingStore(s => s.updateProject)
  const ensureMindsForProject = useMingStore(s => s.ensureMindsForProject)
  const liveProject = useMingStore(s => s.projects.find(p => p.id === project.id) ?? project)
  const boardTasks = useMingStore(s => s.boardTasks[project.id] ?? EMPTY_BOARD_TASKS)
  const addBoardTask = useMingStore(s => s.addBoardTask)
  const updateBoardTask = useMingStore(s => s.updateBoardTask)
  const removeBoardTask = useMingStore(s => s.removeBoardTask)
  const workbenchTheme = useMingStore(s => s.workbenchTheme)
  const setWorkbenchTheme = useMingStore(s => s.setWorkbenchTheme)
  const W = paletteFor(workbenchTheme)
  const { def: EDGE_DEFAULT } = edgePair(W)

  const graph = ensureCanvas(project.id)
  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(graph.nodes))
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(graph.edges))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null)
  const [starters, setStarters] = useState(!graph.startersDismissed)
  const [persistReady, setPersistReady] = useState(false)
  const [knowledgeOpen, setKnowledgeOpen] = useState(false)
  const [assetsOpen, setAssetsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [marketOpen, setMarketOpen] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [railExpanded, setRailExpanded] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [agentBusy, setAgentBusy] = useState(false)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
  const [pipelineBusy, setPipelineBusy] = useState(false)
  const [agentPipelineTasks, setAgentPipelineTasks] = useState<AgentTurnResult['pipelineTasks']>()
  const lastAppliedIdsRef = useRef<string[] | undefined>(undefined)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { edgesRef.current = edges }, [edges])

  // Page waits for zustand hydration; re-sync when switching projects
  useEffect(() => {
    const g = ensureCanvas(project.id)
    setNodes(toFlowNodes(g.nodes))
    setEdges(toFlowEdges(g.edges))
    setStarters(!g.startersDismissed)
    setSelectedId(null)
    setPersistReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])

  // Bring saved nodes into view after load (default viewport alone can miss them)
  useEffect(() => {
    if (!persistReady || !rfInstance) return
    if (nodes.length === 0) return
    const t = window.setTimeout(() => {
      rfInstance.fitView({ padding: 0.22, maxZoom: 0.85, duration: 200 })
    }, 50)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistReady, rfInstance, project.id])

  const assetNodes = useMemo(
    () => nodes.filter(n => (n.data as CanvasNodeData).kind === 'asset'),
    [nodes],
  )

  const draftNodes = useMemo(
    () => nodes
      .filter(n => ['marketing', 'repurpose', 'note'].includes((n.data as CanvasNodeData).kind))
      .map(n => ({ id: n.id, title: (n.data as CanvasNodeData).title || n.id })),
    [nodes],
  )

  const resolveAlias = useCallback(async () => {
    const r = await ensureMindsForProject(project.id)
    if (!r.ok) return { ok: false as const, error: r.error }
    return { ok: true as const, alias: r.alias }
  }, [ensureMindsForProject, project.id])

  useEffect(() => {
    if (!persistReady) return
    const canvasNodes: CanvasNode[] = nodes.map(n => ({
      id: n.id,
      type: 'chirp',
      position: n.position,
      data: n.data as CanvasNodeData,
    }))
    setCanvas(project.id, {
      nodes: canvasNodes,
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
      startersDismissed: !starters,
      updatedAt: new Date().toISOString(),
    })
    updateProject(project.id, {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, starters, persistReady])

  const onConnect = useCallback((c: Connection) => {
    setEdges(eds => {
      const next = addEdge({ ...c, style: { ...EDGE_DEFAULT } }, eds)
      edgesRef.current = next
      return next
    })
  }, [setEdges])

  const paintedEdges = useMemo(() => styleEdges(edges, W), [edges, W])

  const onSelectionChange = useCallback((p: OnSelectionChangeParams) => {
    setSelectedId(p.nodes[0]?.id ?? null)
  }, [])

  const openAddMenuAt = (clientX: number, clientY: number, flowX: number, flowY: number) => {
    setMenu({ x: clientX, y: clientY, flowX, flowY })
  }

  /** Prefer pane-closest so Background SVG dots still count as blank canvas */
  const onPaneOrBgDoubleClick = useCallback((e: ReactMouseEvent) => {
    const t = e.target as Element | null
    if (!t?.closest) return
    if (!t.closest('.react-flow__pane')) return
    if (t.closest('.react-flow__node') || t.closest('.react-flow__edge')) return
    e.preventDefault()
    const point = rfInstance?.screenToFlowPosition({ x: e.clientX, y: e.clientY })
      ?? { x: e.clientX - 200, y: e.clientY - 100 }
    openAddMenuAt(e.clientX, e.clientY, point.x, point.y)
  }, [rfInstance])

  const addKind = (kind: CanvasNodeKind, pos?: { x: number; y: number }) => {
    const position = pos ?? { x: 120 + Math.random() * 80, y: 100 + Math.random() * 80 }
    const n = makeNode(kind, position)
    setNodes(nds => [...nds, { ...n, type: 'chirp' }])
    setSelectedId(n.id)
    setMenu(null)
  }

  const applyTemplate = useCallback((id: TemplateId) => {
    const tpl = getTemplate(id)
    if (!tpl) return
    const center = rfInstance?.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }) ?? { x: 200, y: 160 }
    const ox = center.x - 160
    const oy = center.y - 40
    const t = tpl.build(ox, oy, zh)
    setNodes(nds => [...nds, ...toFlowNodes(t.nodes)])
    setEdges(eds => [...eds, ...toFlowEdges(t.edges)])
    setStarters(false)
    setMarketOpen(false)
  }, [rfInstance, setNodes, setEdges, zh])

  const dropTemplate = (which: 'repurpose' | 'marketing' | 'asset') => {
    const id: TemplateId = which === 'repurpose'
      ? 'cross-platform'
      : which === 'marketing'
        ? 'knowledge-marketing'
        : 'asset-campaign'
    applyTemplate(id)
  }

  function patchNode(nodeId: string, partial: Partial<CanvasNodeData>) {
    setNodes(nds => {
      const next = nds.map(n =>
        n.id === nodeId ? { ...n, data: { ...(n.data as CanvasNodeData), ...partial } } : n
      )
      nodesRef.current = next
      return next
    })
  }

  const closeDock = useCallback(() => {
    setSelectedId(null)
    setNodes(nds => nds.map(n => (n.selected ? { ...n, selected: false } : n)))
  }, [setNodes])

  const upstreamBodies = useCallback((nodeId: string) => {
    const eds = edgesRef.current
    const nds = nodesRef.current
    const incoming = eds.filter(e => e.target === nodeId).map(e => e.source)
    return nds.filter(n => incoming.includes(n.id)).map(n => n.data as CanvasNodeData)
  }, [])

  const runNode = async (nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId)
    if (!node) return
    const data = node.data as CanvasNodeData
    const setWait = (hint: string) => patchNode(nodeId, { status: 'running', error: undefined, waitHint: hint })
    setWait(zh ? '连接 Agent…' : 'Connecting Agent…')

    const bound = await resolveAlias()
    if (!bound.ok) {
      patchNode(nodeId, {
        status: 'error',
        waitHint: undefined,
        error: zh ? `Agent 连接失败：${bound.error}` : `Agent connect failed: ${bound.error}`,
      })
      return
    }
    const alias = bound.alias

    const ups = upstreamBodies(nodeId)
    const knowledgeCtx = [
      ...knowledgeEntries.map(k => `## ${k.title}\n${k.content}`),
      ...ups.filter(u => u.kind === 'knowledgeCard' || u.kind === 'knowledgeSource').map(u =>
        `## ${u.title}\n${upstreamDeliverable(u)}`
      ),
    ].filter(Boolean).join('\n\n')
    const assetCtx = ups
      .filter(u => u.kind === 'asset')
      .map(u => `## ${u.title}\n${upstreamDeliverable(u)}`)
      .join('\n\n')
    const sourceText = [
      data.body,
      ...ups.map(u => upstreamDeliverable(u)),
    ].filter(Boolean).join('\n\n')

    const onProgress = (p: { phase: string; elapsedMs: number }) => {
      const sec = Math.max(1, Math.round(p.elapsedMs / 1000))
      if (p.phase === 'polling') {
        setWait(zh ? `核对回复中… ${sec}s` : `Checking reply… ${sec}s`)
      } else if (p.phase === 'sending') {
        setWait(zh ? '已发送，等待回复…' : 'Sent, waiting…')
      } else {
        setWait(zh ? `等待 Agent 回复… ${sec}s` : `Waiting for Agent… ${sec}s`)
      }
    }

    const timeoutMsg = (raw?: string) => {
      const kind = classifyMindsError(raw)
      return mindsErrorMessage(kind, zh, raw && kind === 'other' ? raw : undefined)
    }
    const refineFailMsg = (err?: string) =>
      err === 'knowledge-unusable'
        ? (zh
          ? '知识提炼失败：模型返回了无效/运维话术，未写入知识卡。可点重试。'
          : 'Knowledge refine failed: unusable/ops reply — not written. Retry.')
        : timeoutMsg(err)

    try {
      if (data.kind === 'knowledgeSource') {
        const input = sourceText || data.body
        if (!input.trim()) throw new Error(zh ? '知识源为空' : 'Knowledge source is empty')
        const r = await refineKnowledge(alias, input, onProgress, zh)
        if (!r.ok || !r.text) throw new Error(refineFailMsg(r.error))

        const cardTitle = zh ? '品牌知识' : 'Brand knowledge'
        const entry: KnowledgeEntry = {
          id: `know-${Date.now()}`,
          projectId: project.id,
          title: (data.title && data.title !== 'Knowledge source' && data.title !== '知识源')
            ? data.title
            : cardTitle,
          content: r.text,
          source: 'upload',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        addKnowledgeEntry(entry)
        patchNode(nodeId, { status: 'done', knowledgeId: entry.id, waitHint: undefined, error: undefined })

        const downstreamIds = edges.filter(e => e.source === nodeId).map(e => e.target)
        const existingCard = nodes.find(n =>
          downstreamIds.includes(n.id) && (n.data as CanvasNodeData).kind === 'knowledgeCard'
        )
        if (existingCard) {
          patchNode(existingCard.id, {
            body: r.text,
            title: entry.title,
            knowledgeId: entry.id,
            status: 'done',
            kind: 'knowledgeCard',
            waitHint: undefined,
            error: undefined,
          })
        } else {
          const card = makeNode('knowledgeCard', {
            x: node.position.x + 320,
            y: node.position.y,
          }, {
            title: entry.title,
            body: r.text,
            knowledgeId: entry.id,
            status: 'done',
          })
          setNodes(nds => {
            const next = [...nds, { ...card, type: 'chirp' as const }]
            nodesRef.current = next
            return next
          })
          setEdges(eds => {
            const next = [...eds, {
              id: `e-${nodeId}-${card.id}`,
              source: nodeId,
              target: card.id,
              style: { ...EDGE_DEFAULT },
            }]
            edgesRef.current = next
            return next
          })
        }
      } else if (data.kind === 'knowledgeCard') {
        const input = sourceText || data.body
        if (!input.trim()) throw new Error(zh ? '知识卡为空' : 'Knowledge card is empty')
        const r = await refineKnowledge(alias, input, onProgress, zh)
        if (!r.ok || !r.text) throw new Error(refineFailMsg(r.error))
        const entry: KnowledgeEntry = {
          id: data.knowledgeId || `know-${Date.now()}`,
          projectId: project.id,
          title: (data.title && data.title !== 'Knowledge source' && data.title !== '知识源')
            ? data.title
            : (zh ? '品牌知识' : 'Brand knowledge'),
          content: r.text,
          source: 'manual',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        addKnowledgeEntry(entry)
        patchNode(nodeId, {
          body: r.text,
          title: entry.title,
          status: 'done',
          knowledgeId: entry.id,
          waitHint: undefined,
          error: undefined,
        })
      } else if (data.kind === 'asset') {
        if (!data.body.trim() && !data.title.trim() && !data.fileName) {
          throw new Error(zh ? '素材为空' : 'Asset is empty')
        }
        let tags: string[] = []
        let summary = ''
        setWait(zh ? '分析素材中…' : 'Analyzing asset…')
        const api = await analyzeAssetViaApi({
          alias,
          name: data.title || data.fileName || 'Asset',
          type: data.mimeType?.startsWith('image/')
            ? 'image'
            : data.mimeType?.startsWith('video/')
              ? 'video'
              : 'text',
          description: [
            data.fileName ? `File: ${data.fileName}` : '',
            data.mimeType ? `MIME: ${data.mimeType}` : '',
            data.body,
          ].filter(Boolean).join('\n'),
          profile: liveProject.brand,
        })
        if (api.ok) {
          tags = api.tags
          summary = api.summary
          patchNode(nodeId, {
            // Keep user notes in body — do not dump disclaimer/tags/platforms into body
            summary,
            tags,
            platformsSuggested: api.platforms,
            disclaimer: zh
              ? '素材分析 · 元数据+描述驱动，非逐帧看片'
              : 'Asset analysis · metadata+description, not frame-level vision',
            status: 'done',
            waitHint: undefined,
            error: undefined,
          })
        } else {
          const sse = await analyzeAssetViaSse(alias, data.title || 'Asset', data.body, onProgress)
          if (!sse.ok || !sse.text) throw new Error(timeoutMsg(api.error || sse.error || 'analyze-failed'))
          if (isContractMetaReply(sse.text)) {
            throw new Error(zh ? '素材分析返回无效运维话术，请重试' : 'Asset analysis returned ops meta — retry')
          }
          try {
            const m = sse.text.match(/\{[\s\S]*\}/)
            if (m) {
              const j = JSON.parse(m[0]) as { tags?: string[]; summary?: string; analysis?: string; platforms?: string[] }
              tags = j.tags ?? []
              summary = j.summary ?? j.analysis ?? ''
              const plats = Array.isArray(j.platforms) ? j.platforms.map(String) : []
              patchNode(nodeId, {
                summary,
                tags,
                platformsSuggested: plats,
                disclaimer: zh
                  ? '素材分析 · 元数据+描述驱动，非逐帧看片'
                  : 'Asset analysis · metadata+description, not frame-level vision',
                status: 'done',
                waitHint: undefined,
                error: undefined,
              })
            } else {
              patchNode(nodeId, {
                summary: sse.text,
                disclaimer: zh
                  ? '素材分析 · 元数据+描述驱动，非逐帧看片'
                  : 'Asset analysis · metadata+description, not frame-level vision',
                status: 'done',
                waitHint: undefined,
                error: undefined,
              })
            }
          } catch {
            patchNode(nodeId, {
              summary: sse.text,
              status: 'done',
              waitHint: undefined,
              error: undefined,
            })
          }
        }
        if (isContractMetaReply(summary)) {
          throw new Error(zh ? '素材分析返回无效运维话术，请重试' : 'Asset analysis returned ops meta — retry')
        }
      } else if (data.kind === 'marketing') {
        const upKnowledge = ups.filter(u =>
          (u.kind === 'knowledgeCard' || u.kind === 'knowledgeSource')
          && isUsableContent(u.body, undefined, { summary: u.summary, anglesCount: u.angles?.length }),
        )
        const upAssets = ups.filter(u =>
          u.kind === 'asset'
          && isUsableContent(u.body, u.tags, { summary: u.summary }),
        )
        if (upKnowledge.length === 0 && upAssets.length === 0) {
          const dirty = ups.some(u =>
            (u.kind === 'knowledgeCard' || u.kind === 'knowledgeSource') && isContractMetaReply(u.body),
          )
          throw new Error(
            dirty
              ? (zh
                ? '上游知识无效（含运维/契约话术）。请重提炼知识卡后再生成营销。'
                : 'Upstream knowledge is invalid (ops/contract meta). Re-refine the knowledge card first.')
              : (zh
                ? '请先连接有内容的知识卡/知识源或已分析的素材作为上游'
                : 'Connect a knowledge card/source or analyzed asset upstream first'),
          )
        }
        const mktKnowledge = upKnowledge.map(u => `## ${u.title}\n${upstreamDeliverable(u)}`).join('\n\n')
        const mktAssets = upAssets
          .map(u => `## ${u.title}\n${upstreamDeliverable(u)}`)
          .join('\n\n')
        // Brief only: short optional direction — never feed prior marketing draft back as knowledge
        const priorIsDraft = /Angle\s*\d|Headline:|卖点|CTA:/i.test(data.body || '') || Boolean(data.angles?.length)
        const mktBrief = priorIsDraft ? '' : (data.body || '').trim()
        const r = await generateMarketing(alias, mktKnowledge, mktBrief, mktAssets, onProgress)
        if (!r.ok) {
          if (r.error === 'insufficient-upstream') {
            throw new Error(zh ? '上游知识不足或无效，无法生成营销（未编造）' : 'Insufficient/invalid upstream — refused to invent')
          }
          throw new Error(timeoutMsg(r.error))
        }
        patchNode(nodeId, {
          body: r.text,
          angles: r.angles,
          advice: undefined,
          status: 'done',
          waitHint: undefined,
          error: undefined,
        })
      } else if (data.kind === 'repurpose') {
        const upText = ups.map(u => upstreamDeliverable(u)).filter(Boolean).join('\n\n')
        // Prefer upstream only — do not mix in leftover source-tab body (causes cross-run contamination)
        const input = upText
          || (data.body && data.body !== 'YT / IG / TikTok / X drafts ready' ? data.body : '')
          || sourceText
        if (!input.trim()) throw new Error(zh ? '复用源内容为空' : 'Repurpose source is empty')
        patchNode(nodeId, { platforms: undefined, status: 'running' })
        const result = await runRepurpose(alias, liveProject.brand, input, onProgress)
        if (!result.ok) {
          const err = result.error || ''
          if (/ungrounded/i.test(err)) {
            throw new Error(zh
              ? '复用结果未贴合当前上游（疑似沿用旧会话稿）。请重试；若仍失败可新开项目会话。'
              : 'Repurpose output did not match upstream (likely stale conversation). Retry or start a fresh project session.')
          }
          throw new Error(timeoutMsg(result.error))
        }
        patchNode(nodeId, {
          status: 'done',
          platforms: result.result,
          body: 'YT / IG / TikTok / X drafts ready',
          waitHint: undefined,
          error: undefined,
        })
      } else {
        patchNode(nodeId, { status: 'idle', waitHint: undefined })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      patchNode(nodeId, {
        status: 'error',
        waitHint: undefined,
        error: msg === 'timeout' ? timeoutMsg('timeout') : msg,
      })
    }
  }

  const addScheduleSlot = (nodeId: string) => {
    const node = nodesRef.current.find(n => n.id === nodeId)
    if (!node) return
    const data = node.data as CanvasNodeData
    const slots = data.slots ?? []
    const nextHour = new Date()
    nextHour.setMinutes(0, 0, 0)
    nextHour.setHours(nextHour.getHours() + 1)
    const at = nextHour.toISOString().slice(0, 16)
    patchNode(nodeId, {
      slots: [...slots, { at, label: zh ? '时间锚' : 'Anchor' }],
      status: 'done',
    })
    setSelectedId(nodeId)
  }

  const applyWorkflowSpec = useCallback((spec: WorkflowSpec) => {
    const center = rfInstance?.screenToFlowPosition({
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 - 40,
    }) ?? { x: 120, y: 120 }
    const built = materializeWorkflow(spec, center, zh)
    setNodes(nds => {
      const next = [...nds, ...toFlowNodes(built.nodes)]
      nodesRef.current = next
      return next
    })
    setEdges(eds => {
      const next = [...eds, ...toFlowEdges(built.edges)]
      edgesRef.current = next
      return next
    })
    setStarters(false)
    setAgentOpen(true)
    return built.nodes.map(n => n.id)
  }, [rfInstance, setNodes, setEdges, zh])

  const topoRunnable = (seedIds?: string[]) => {
    const nds = nodesRef.current
    const eds = edgesRef.current
    const runnable = new Set(['knowledgeSource', 'knowledgeCard', 'asset', 'marketing', 'repurpose'])
    let ids = seedIds?.length
      ? seedIds.filter(id => runnable.has((nds.find(n => n.id === id)?.data as CanvasNodeData | undefined)?.kind || ''))
      : nds.filter(n => runnable.has((n.data as CanvasNodeData).kind)).map(n => n.id)
    if (seedIds?.length) {
      // include ancestors in seed set for ordering
      const set = new Set(ids)
      let grew = true
      while (grew) {
        grew = false
        for (const e of eds) {
          if (set.has(e.target) && !set.has(e.source)) {
            const k = (nds.find(n => n.id === e.source)?.data as CanvasNodeData | undefined)?.kind
            if (k && runnable.has(k)) { set.add(e.source); grew = true }
          }
        }
      }
      ids = [...set]
    }
    const remaining = new Set(ids)
    const ordered: string[] = []
    while (remaining.size) {
      const ready = [...remaining].filter(id => {
        const preds = eds.filter(e => e.target === id && remaining.has(e.source))
        return preds.length === 0
      })
      if (ready.length === 0) {
        ordered.push(...remaining)
        break
      }
      ready.sort()
      for (const id of ready) {
        ordered.push(id)
        remaining.delete(id)
      }
    }
    return ordered
  }

  const runPipeline = async (seedIds?: string[]) => {
    if (pipelineBusy) return
    setPipelineBusy(true)
    const order = topoRunnable(seedIds)
    try {
      for (const id of order) {
        await runNode(id)
        const st = (nodesRef.current.find(n => n.id === id)?.data as CanvasNodeData | undefined)?.status
        if (st === 'error') break
      }
    } finally {
      setPipelineBusy(false)
    }
  }

  const ingestFilesAt = async (files: FileList | File[], flowPos: { x: number; y: number }) => {
    const list = [...files].filter(f => f.type.startsWith('image/') || f.type.startsWith('video/') || f.type.startsWith('audio/'))
    if (list.length === 0) return
    let i = 0
    for (const file of list) {
      const isVideo = file.type.startsWith('video/')
      const max = isVideo ? ASSET_MAX_VIDEO : ASSET_MAX_IMAGE
      if (file.size > max) {
        window.alert(zh
          ? `${file.name} 过大（>${Math.round(max / 1024 / 1024)}MB），请压缩后重试`
          : `${file.name} too large (>${Math.round(max / 1024 / 1024)}MB)`)
        continue
      }
      const node = makeNode('asset', {
        x: flowPos.x + i * 40,
        y: flowPos.y + i * 40,
      }, {
        title: file.name.replace(/\.[^.]+$/, '') || file.name,
        body: zh
          ? `已导入：${file.name}（${file.type || 'file'} · ${(file.size / 1024 / 1024).toFixed(2)} MB）\n可补充画面说明后点「分析打标」。当前按元数据+描述识别（非逐帧看片）。`
          : `Imported: ${file.name} (${file.type} · ${(file.size / 1024 / 1024).toFixed(2)} MB)\nAdd a short description, then Analyze. Metadata+description driven (not frame-level vision).`,
        fileName: file.name,
        mimeType: file.type,
        status: 'idle',
      })
      try {
        await putAssetBlob(node.id, file, { name: file.name, type: file.type })
        if (file.type.startsWith('image/') && file.size <= 3 * 1024 * 1024) {
          node.data.previewUrl = URL.createObjectURL(file)
        }
      } catch {
        /* IDB optional — still keep node */
      }
      setNodes(nds => {
        const next = [...nds, { ...node, type: 'chirp' as const }]
        nodesRef.current = next
        return next
      })
      i++
    }
    setStarters(false)
  }

  const onPaneDragOver = (e: ReactDragEvent) => {
    if ([...e.dataTransfer.types].includes('Files')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const onPaneDrop = (e: ReactDragEvent) => {
    if (![...e.dataTransfer.types].includes('Files')) return
    e.preventDefault()
    const point = rfInstance?.screenToFlowPosition({ x: e.clientX, y: e.clientY })
      ?? { x: e.clientX - 200, y: e.clientY - 100 }
    void ingestFilesAt(e.dataTransfer.files, point)
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPack = (format: 'json' | 'md') => {
    const pack = {
      project: project.name || project.brand.name,
      exportedAt: new Date().toISOString(),
      knowledge: knowledgeEntries,
      nodes: nodes.map(n => {
        const d = n.data as CanvasNodeData
        return {
          id: n.id,
          kind: d.kind,
          title: d.title,
          body: exportNodeText(d),
          summary: d.summary,
          tags: d.tags,
          platformsSuggested: d.platformsSuggested,
          angles: d.angles,
          platforms: d.platforms,
          slots: d.slots,
          status: d.status,
          position: n.position,
        }
      }),
      edges: edges.map(e => ({ source: e.source, target: e.target })),
      boardTasks: boardTasks.map(t => ({
        id: t.id,
        title: t.title,
        at: t.at,
        status: t.status,
        contentNodeId: t.contentNodeId,
        contentTitle: t.contentNodeId
          ? (nodes.find(c => c.id === t.contentNodeId)?.data as CanvasNodeData | undefined)?.title
          : undefined,
        source: t.source,
      })),
      scheduleLegacy: nodes
        .filter(n => (n.data as CanvasNodeData).kind === 'schedule')
        .flatMap(n => ((n.data as CanvasNodeData).slots ?? []).map(s => ({
          board: (n.data as CanvasNodeData).title,
          ...s,
          contentTitle: nodes.find(c => c.id === s.contentNodeId)
            ? (nodes.find(c => c.id === s.contentNodeId)!.data as CanvasNodeData).title
            : undefined,
        }))),
    }
    if (format === 'json') {
      downloadBlob(new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' }), `chirp-${project.id}-pack.json`)
    } else {
      const lines: string[] = [
        `# ${pack.project}`,
        ``,
        `Exported: ${pack.exportedAt}`,
        ``,
        `## Knowledge`,
        ...knowledgeEntries.flatMap(k => [`### ${k.title}`, ``, k.content, ``]),
        `## Canvas nodes`,
      ]
      for (const n of nodes) {
        const d = n.data as CanvasNodeData
        lines.push(`### ${d.kind}: ${d.title}`, ``)
        const text = exportNodeText(d)
        if (text) lines.push(text, ``)
        if (d.platformsSuggested?.length) {
          lines.push(`Suggested platforms: ${d.platformsSuggested.join(', ')}`, ``)
        }
        if (d.platforms) {
          for (const [p, ptext] of Object.entries(d.platforms)) {
            if (ptext) lines.push(`#### ${p}`, ``, ptext, ``)
          }
        }
        if (d.slots?.length) {
          lines.push(`#### Schedule anchors`, ``)
          for (const s of d.slots) {
            const attached = s.contentNodeId
              ? (nodes.find(c => c.id === s.contentNodeId)?.data as CanvasNodeData | undefined)?.title
              : undefined
            lines.push(`- ${s.at} — ${s.label}${attached ? ` → ${attached}` : ''}`)
          }
          lines.push(``)
        }
      }
      if (boardTasks.length) {
        lines.push(`## Schedule · Tasks`, ``)
        for (const t of boardTasks) {
          const attached = t.contentNodeId
            ? (nodes.find(c => c.id === t.contentNodeId)?.data as CanvasNodeData | undefined)?.title
            : undefined
          lines.push(`- [${t.status}] ${t.at || '—'} — ${t.title}${attached ? ` → ${attached}` : ''}`)
        }
        lines.push(``)
      }
      downloadBlob(new Blob([lines.join('\n')], { type: 'text/markdown' }), `chirp-${project.id}-pack.md`)
    }
    setExportOpen(false)
  }

  const marketingUpstream = useCallback((nodeId: string) => {
    const ups = upstreamBodies(nodeId)
    const dirty = ups.filter(u =>
      (u.kind === 'knowledgeCard' || u.kind === 'knowledgeSource') && isContractMetaReply(u.body),
    )
    const names = ups
      .filter(u =>
        ((u.kind === 'knowledgeCard' || u.kind === 'knowledgeSource')
          && isUsableContent(u.body, undefined, { summary: u.summary, anglesCount: u.angles?.length }))
        || (u.kind === 'asset' && isUsableContent(u.body, u.tags, { summary: u.summary })),
      )
      .map(u => u.title || u.kind)
    if (names.length === 0) {
      return {
        ok: false,
        label: dirty.length
          ? (zh ? '上游知识无效（需重提炼）' : 'Upstream invalid — re-refine knowledge')
          : (zh ? '未连接可用上游（需知识卡/源或已分析素材）' : 'No usable upstream (need knowledge or analyzed asset)'),
      }
    }
    return {
      ok: true,
      label: zh ? `将使用上游：${names.join(' · ')}` : `Using upstream: ${names.join(' · ')}`,
    }
  }, [upstreamBodies, zh])

  const pinChatToKnowledge = (text: string) => {
    const entry: KnowledgeEntry = {
      id: `know-${Date.now()}`,
      projectId: project.id,
      title: zh ? '会话摘录' : 'Chat pin',
      content: text,
      source: 'chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addKnowledgeEntry(entry)
    const n = makeNode('knowledgeCard', { x: 100, y: 100 }, { title: entry.title, body: text, knowledgeId: entry.id, status: 'done' })
    setNodes(nds => [...nds, { ...n, type: 'chirp' }])
  }

  const applyPlanFromConversation = async (conversation: string) => {
    const bound = await resolveAlias()
    if (!bound.ok) {
      return {
        kind: 'error' as const,
        text: zh ? `Agent 连接失败：${bound.error}` : `Agent connect failed: ${bound.error}`,
      }
    }
    const r = await planApplyViaMinds(bound.alias, conversation, zh)
    if (!r.ok || !r.text) {
      const kind = classifyMindsError(r.error)
      return { kind: 'error' as const, text: mindsErrorMessage(kind, zh, r.error) }
    }
    const parsed = parsePlanApplyReply(r.text)
    if (parsed.status === 'need_clarification') {
      const q = parsed.questions.map((x, i) => `${i + 1}. ${x}`).join('\n')
      return {
        kind: 'clarify' as const,
        text: (parsed.note ? `${parsed.note}\n\n` : '') + (zh ? `还需要确认：\n${q}` : `Need a bit more:\n${q}`),
      }
    }
    if (parsed.status === 'error') {
      return {
        kind: 'error' as const,
        text: zh
          ? `无法从对话生成工作流（${parsed.error}）。可再补充目标后重试「应用到画布」。`
          : `Could not build workflow (${parsed.error}). Clarify goals and retry Apply.`,
      }
    }
    const ids = applyWorkflowSpec(prepareWorkflowSpec(parsed.workflow, conversation))
    return {
      kind: 'applied' as const,
      text: zh
        ? `已根据对话生成工作流「${parsed.summary || parsed.workflow.title || 'Plan'}」（${parsed.workflow.nodes.length} 个节点）。可点「一键运行」按上游顺序执行。`
        : `Applied workflow “${parsed.summary || parsed.workflow.title || 'Plan'}” (${parsed.workflow.nodes.length} nodes). Use Run pipeline to execute in order.`,
      nodeIds: ids,
    }
  }

  const menuGroups: AddMenuGroup[] = zh
    ? [
        { title: '知识', items: [['knowledgeSource', '知识源'], ['knowledgeCard', '品牌知识卡'], ['note', '笔记']] },
        { title: '素材', items: [['asset', '素材']] },
        { title: '成稿', items: [['marketing', '营销草稿'], ['repurpose', '跨平台复用']] },
      ]
    : [
        { title: 'Knowledge', items: [['knowledgeSource', 'Knowledge source'], ['knowledgeCard', 'Brand knowledge'], ['note', 'Note']] },
        { title: 'Assets', items: [['asset', 'Asset']] },
        { title: 'Drafts', items: [['marketing', 'Marketing'], ['repurpose', 'Cross-platform']] },
      ]

  const suggestAssetsForMarketing = useCallback((marketingNodeId: string) => {
    const eds = edgesRef.current
    const connected = new Set(
      eds.filter(e => e.target === marketingNodeId).map(e => e.source),
    )
    const mkt = nodesRef.current.find(n => n.id === marketingNodeId)
    const mktData = mkt?.data as CanvasNodeData | undefined
    const text = `${mktData?.title || ''}\n${mktData?.body || ''}`
    const assets = nodesRef.current
      .filter(n => (n.data as CanvasNodeData).kind === 'asset')
      .map(n => {
        const d = n.data as CanvasNodeData
        return { id: n.id, title: d.title || '', body: d.body || '', tags: d.tags }
      })
    return rankAssetsForMarketing(text, assets, { alreadyConnected: connected, limit: 5 })
  }, [])

  const connectAssetToMarketing = useCallback((assetId: string, marketingNodeId: string) => {
    setEdges(eds => {
      if (eds.some(e => e.source === assetId && e.target === marketingNodeId)) {
        edgesRef.current = eds
        return eds
      }
      const next = [
        ...eds,
        {
          id: `e-match-${assetId}-${marketingNodeId}-${Date.now()}`,
          source: assetId,
          target: marketingNodeId,
          style: { ...EDGE_DEFAULT },
        },
      ]
      edgesRef.current = next
      return next
    })
  }, [setEdges])

  /** Land schedule suggestions into the Filter Table board (not a canvas node). */
  const suggestScheduleFromRepurpose = useCallback((repurposeNodeId: string) => {
    const rep = nodesRef.current.find(n => n.id === repurposeNodeId)
    const data = rep?.data as CanvasNodeData | undefined
    if (!rep || data?.kind !== 'repurpose' || !data.platforms) return

    const platforms = data.platforms
    const labels: Array<{ key: string; label: string }> = [
      { key: 'tiktok', label: zh ? 'TikTok 发布' : 'TikTok post' },
      { key: 'instagram', label: zh ? 'IG 发布' : 'IG post' },
      { key: 'youtube', label: zh ? 'YouTube 发布' : 'YouTube post' },
      { key: 'twitter', label: zh ? 'X 发布' : 'X post' },
    ].filter(x => platforms[x.key as keyof typeof platforms]?.trim())

    if (labels.length === 0) return

    const base = new Date()
    base.setMinutes(0, 0, 0)
    labels.forEach((l, i) => {
      const at = new Date(base)
      at.setDate(at.getDate() + i + 1)
      at.setHours(12 + (i % 3) * 3, 0, 0, 0)
      addBoardTask({
        id: newBoardTaskId(),
        projectId: project.id,
        title: l.label,
        at: at.toISOString().slice(0, 16),
        status: 'todo',
        contentNodeId: repurposeNodeId,
        source: 'suggest',
        createdAt: new Date().toISOString(),
      })
    })
    setKnowledgeOpen(false)
    setAssetsOpen(false)
    setHistoryOpen(false)
    setScheduleOpen(true)
  }, [addBoardTask, project.id, zh])

  const repurposeSourcePreview = useCallback((nodeId: string) => {
    const ups = upstreamBodies(nodeId)
    const upText = ups.map(u => upstreamDeliverable(u)).filter(Boolean).join('\n\n')
    if (upText.trim()) {
      return { hasUpstream: true, preview: upText.replace(/\s+/g, ' ').trim().slice(0, 140) }
    }
    const node = nodesRef.current.find(n => n.id === nodeId)
    const body = ((node?.data as CanvasNodeData | undefined)?.body || '').trim()
    const preview = body && body !== 'YT / IG / TikTok / X drafts ready'
      ? body.replace(/\s+/g, ' ').slice(0, 140)
      : ''
    return { hasUpstream: false, preview }
  }, [upstreamBodies])

  const gatherMarketingKnowledge = () => {
    const nds = nodesRef.current
    const fromNodes = nds
      .filter(n => {
        const d = n.data as CanvasNodeData
        return (d.kind === 'knowledgeCard' || d.kind === 'knowledgeSource')
          && isUsableContent(d.body, undefined, { summary: d.summary })
      })
      .map(n => {
        const d = n.data as CanvasNodeData
        return `## ${d.title}\n${upstreamDeliverable(d)}`
      })
    const fromLib = knowledgeEntries
      .filter(e => e.content.trim().length > 40)
      .map(e => `## ${e.title}\n${e.content}`)
    return [...fromNodes, ...fromLib].join('\n\n')
  }

  const ensureMarketingNodeForAngles = () => {
    const nds = nodesRef.current
    const sel = selectedId
      ? nds.find(n => n.id === selectedId && (n.data as CanvasNodeData).kind === 'marketing')
      : undefined
    if (sel) return sel.id
    const existing = nds.filter(n => (n.data as CanvasNodeData).kind === 'marketing')
    if (existing.length >= 1) return existing[0].id

    const knowNodes = nds.filter(n => {
      const k = (n.data as CanvasNodeData).kind
      return k === 'knowledgeCard' || k === 'knowledgeSource'
    })
    const mkt = makeNode('marketing', { x: 420, y: 160 }, {
      title: zh ? '营销草稿' : 'Marketing',
      body: '',
      status: 'idle',
    })
    setNodes(prev => {
      const next = [...prev, { ...mkt, type: 'chirp' as const }]
      nodesRef.current = next
      return next
    })
    if (knowNodes.length) {
      setEdges(eds => {
        const next = [
          ...eds,
          ...knowNodes.slice(0, 3).map(k => ({
            id: `e-agent-${k.id}-${mkt.id}`,
            source: k.id,
            target: mkt.id,
            style: { ...EDGE_DEFAULT },
          })),
        ]
        edgesRef.current = next
        return next
      })
    }
    setSelectedId(mkt.id)
    return mkt.id
  }

  const writeMarketingAnglesFromAgent = async (brief: string): Promise<AgentTurnResult> => {
    const bound = await resolveAlias()
    if (!bound.ok) {
      return {
        kind: 'error',
        text: zh ? `Agent 连接失败：${bound.error}` : `Agent connect failed: ${bound.error}`,
        detectedIntent: 'deliverable_angles',
      }
    }
    const knowledgeCtx = gatherMarketingKnowledge()
    if (!knowledgeCtx.trim()) {
      return {
        kind: 'clarify',
        text: zh
          ? '还没有可用的品牌知识上游。请先在知识库添加设定，或在画布放一张知识卡后再让我写角度。'
          : 'No usable brand knowledge yet. Add a knowledge entry or knowledge card, then ask again.',
        clarifyQuestions: zh
          ? ['品牌定位与受众是什么？', '主推产品 / 配色？', '主战场平台？']
          : ['Brand positioning & audience?', 'Hero product / colorway?', 'Primary platforms?'],
        clarifyNote: zh ? '写角度需要先吃上游知识' : 'Angles need upstream knowledge',
        detectedIntent: 'deliverable_angles',
        offerApply: true,
      }
    }
    const nodeId = ensureMarketingNodeForAngles()
    const assetCtx = nodesRef.current
      .filter(n => {
        const d = n.data as CanvasNodeData
        return d.kind === 'asset' && isUsableContent(d.body, d.tags, { summary: d.summary })
      })
      .map(n => {
        const d = n.data as CanvasNodeData
        return `## ${d.title}\n${upstreamDeliverable(d)}`
      })
      .join('\n\n')

    const r = await generateMarketing(bound.alias, knowledgeCtx, brief, assetCtx)
    if (!r.ok) {
      if (r.error === 'insufficient-upstream') {
        return {
          kind: 'clarify',
          text: zh ? '上游知识不足或无效，无法生成营销（未编造）。' : 'Insufficient upstream — refused to invent.',
          detectedIntent: 'deliverable_angles',
          offerApply: true,
        }
      }
      return {
        kind: 'error',
        text: mindsErrorMessage(classifyMindsError(r.error), zh, r.error),
        detectedIntent: 'deliverable_angles',
      }
    }
    patchNode(nodeId, {
      body: r.text,
      angles: r.angles,
      status: 'done',
      error: undefined,
      waitHint: undefined,
    })
    setSelectedId(nodeId)
    const title = (nodesRef.current.find(n => n.id === nodeId)?.data as CanvasNodeData | undefined)?.title
    return {
      kind: 'deliverable',
      text: zh
        ? `已写入营销节点「${title || 'Marketing'}」· ${r.angles.length} 个角度。`
        : `Wrote “${title || 'Marketing'}” · ${r.angles.length} angles.`,
      angles: r.angles,
      tools: [
        { id: 'read', label: zh ? '读取上游知识' : 'Read upstream knowledge', status: 'done' },
        { id: 'write', label: zh ? '写入 marketing.angles' : 'Write marketing.angles', status: 'done' },
      ],
      detectedIntent: 'deliverable_angles',
    }
  }

  const handleAgentTurn = async (msg: string): Promise<AgentTurnResult> => {
    setAgentBusy(true)
    setAgentPipelineTasks(undefined)
    const slash = parseSlashCommand(msg)
    const intent = classifyAgentIntent(msg)
    const userPayload = slash.rest || msg.trim()
    const ctx = buildCanvasContext({
      nodes: nodesRef.current.map(n => ({ id: n.id, data: n.data as CanvasNodeData })),
      selectedId,
      knowledgeEntries,
      boardTaskCount: boardTasks.length,
      zh,
    })

    try {
      if (intent === 'help') {
        return { kind: 'chat', text: helpText(zh), detectedIntent: intent }
      }

      if (intent === 'canvas_schedule') {
        setKnowledgeOpen(false)
        setAssetsOpen(false)
        setHistoryOpen(false)
        setScheduleOpen(true)
        const sel = selectedId
          ? nodesRef.current.find(n => n.id === selectedId)
          : undefined
        if (sel && (sel.data as CanvasNodeData).kind === 'repurpose') {
          suggestScheduleFromRepurpose(sel.id)
        }
        return {
          kind: 'canvas',
          text: zh
            ? '已打开「排期 · 待办」板。只排不发；可把成稿挂到时间锚点。'
            : 'Opened Schedule · Tasks. Schedule only — pin drafts to times.',
          tools: [{ id: 'board', label: zh ? '打开排期板' : 'Open schedule board', status: 'done' }],
          detectedIntent: intent,
          openSchedule: true,
        }
      }

      if (intent === 'canvas_apply') {
        const r = await applyPlanFromConversation(userPayload || msg)
        if (r.kind === 'clarify') {
          const qs = r.text
            .split('\n')
            .map(l => l.trim())
            .filter(l => /^\d+[\.)、]\s*/.test(l))
            .map(l => l.replace(/^\d+[\.)、]\s*/, ''))
          return {
            kind: 'clarify',
            text: r.text,
            clarifyQuestions: qs.length ? qs : undefined,
            detectedIntent: intent,
            offerApply: true,
          }
        }
        if (r.kind === 'error') {
          return { kind: 'error', text: r.text, detectedIntent: intent, offerApply: true }
        }
        lastAppliedIdsRef.current = r.nodeIds
        return {
          kind: 'canvas',
          text: r.text,
          lastAppliedIds: r.nodeIds,
          tools: [
            { id: 'apply', label: zh ? '应用到画布' : 'Apply to canvas', status: 'done' },
            { id: 'nodes', label: zh ? `${r.nodeIds?.length ?? 0} 个节点` : `${r.nodeIds?.length ?? 0} nodes`, status: 'done' },
          ],
          detectedIntent: intent,
        }
      }

      if (intent === 'canvas_run') {
        const order = topoRunnable(lastAppliedIdsRef.current)
        if (order.length === 0) {
          return {
            kind: 'clarify',
            text: zh ? '画布上还没有可运行的节点。可以先 /apply 或手动添加知识→营销。' : 'Nothing runnable yet. /apply or add knowledge → marketing first.',
            detectedIntent: intent,
            offerApply: true,
          }
        }
        const live: Array<{ id: string; title: string; status: 'pending' | 'running' | 'done' | 'error' }> = order.map(id => {
          const d = nodesRef.current.find(n => n.id === id)?.data as CanvasNodeData | undefined
          return {
            id,
            title: `${d?.kind || '?'} · ${d?.title || id}`,
            status: 'pending',
          }
        })
        setPipelineBusy(true)
        try {
          for (let i = 0; i < order.length; i++) {
            live[i] = { ...live[i], status: 'running' }
            setAgentPipelineTasks([...live])
            await runNode(order[i])
            const st = (nodesRef.current.find(n => n.id === order[i])?.data as CanvasNodeData | undefined)?.status
            live[i] = { ...live[i], status: st === 'error' ? 'error' : 'done' }
            setAgentPipelineTasks([...live])
            if (st === 'error') break
          }
        } finally {
          setPipelineBusy(false)
        }
        const failed = live.some(t => t.status === 'error')
        return {
          kind: failed ? 'error' : 'canvas',
          text: failed
            ? (zh ? '管线中途失败，请查看出错节点后重试。' : 'Pipeline stopped on an error — check the node and retry.')
            : (zh ? `已按依赖运行 ${live.filter(t => t.status === 'done').length} 个节点。` : `Ran ${live.filter(t => t.status === 'done').length} nodes by deps.`),
          tools: [{ id: 'run', label: 'run_pipeline', status: failed ? 'error' : 'done' }],
          pipelineTasks: [...live],
          detectedIntent: intent,
        }
      }

      if (intent === 'deliverable_angles') {
        return await writeMarketingAnglesFromAgent(userPayload)
      }

      const bound = await resolveAlias()
      if (!bound.ok) {
        return {
          kind: 'error',
          text: zh ? `Agent 连接失败：${bound.error}` : `Agent connect failed: ${bound.error}`,
          detectedIntent: intent,
        }
      }

      if (intent === 'plan') {
        const r = await planChatViaMinds(bound.alias, userPayload, zh, undefined, ctx.summaryText)
        if (!r.ok || !r.text) {
          return {
            kind: 'error',
            text: mindsErrorMessage(classifyMindsError(r.error), zh, r.error),
            detectedIntent: intent,
            offerApply: true,
          }
        }
        return {
          kind: 'plan',
          text: r.text,
          detectedIntent: intent,
          offerApply: true,
          tools: [{ id: 'plan', label: 'plan_chat', status: 'done' }],
        }
      }

      const r = await agentChatViaMinds(bound.alias, userPayload, zh, undefined, ctx.summaryText)
      if (!r.ok || !r.text) {
        return {
          kind: 'error',
          text: mindsErrorMessage(classifyMindsError(r.error), zh, r.error),
          detectedIntent: intent,
        }
      }
      return {
        kind: 'chat',
        text: r.text,
        detectedIntent: intent,
        offerApply: true,
      }
    } finally {
      setAgentBusy(false)
    }
  }

  const workbenchActions = useMemo(() => ({
    zh,
    runNode,
    patchNode,
    addScheduleSlot,
    closeDock,
    draftNodes,
    marketingUpstream,
    runPipeline,
    pipelineBusy,
    suggestAssetsForMarketing,
    connectAssetToMarketing,
    suggestScheduleFromRepurpose,
    repurposeSourcePreview,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [zh, nodes, edges, knowledgeEntries, draftNodes, project.id, liveProject.brand.mindsConversationAlias, closeDock, marketingUpstream, pipelineBusy, suggestAssetsForMarketing, connectAssetToMarketing, suggestScheduleFromRepurpose, repurposeSourcePreview])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: W.bg, color: W.ink, fontFamily: SANS }}>
      {/* Top identity bar */}
      <header style={{
        height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px 0 8px',
        borderBottom: `1px solid ${W.border}`, background: W.shellBg, zIndex: 30,
      }}>
        <Link href="/dashboard" style={{
          textDecoration: 'none', display: 'flex', alignItems: 'center', color: W.ink, flexShrink: 0,
        }}>
          <img src="/logo.png" alt="Chirp" style={{ width: 100, height: 100, objectFit: 'contain', marginRight: -30 }} />
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>Chirp</span>
        </Link>
        <div style={{ width: 1, height: 22, background: W.border, margin: '0 4px' }} />
        <div style={{ fontWeight: 600, fontSize: 14, color: W.ink, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.name || project.brand.name}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <button onClick={() => setExportOpen(v => !v)} style={{
            padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: W.accent, color: '#fff', fontWeight: 650, fontSize: 12,
          }}>{zh ? '导出内容包' : 'Export pack'}</button>
          {exportOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)', minWidth: 140,
              background: W.panel, border: `1px solid ${W.border}`, borderRadius: 10,
              padding: 4, boxShadow: '0 12px 36px rgba(0,0,0,0.5)', zIndex: 40,
            }}>
              <button onClick={() => exportPack('json')} style={menuItem(W)}>{zh ? '导出 JSON' : 'Export JSON'}</button>
              <button onClick={() => exportPack('md')} style={menuItem(W)}>{zh ? '导出 Markdown' : 'Export Markdown'}</button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setMarketOpen(true); setAgentOpen(false) }}
          title={zh ? '模板市场' : 'Template market'}
          style={{
            width: 36, height: 36, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer', color: '#fff',
            background: marketOpen ? '#2563eb' : W.accent,
          }}
        >
          <ShopGlyph size={18} />
        </button>
        <button
          type="button"
          onClick={() => setAgentOpen(v => !v)}
          title="Agent"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            height: 36, padding: '0 12px', borderRadius: 10, cursor: 'pointer',
            border: `1px solid ${agentOpen ? W.border : W.border}`,
            background: agentOpen ? W.accentSoft : W.chipBg,
            color: W.ink, fontWeight: 650, fontSize: 12,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H8l-4 2.5V15.5A8.5 8.5 0 1 1 21 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <circle cx="9" cy="12" r="1" fill="currentColor" />
            <circle cx="12.5" cy="12" r="1" fill="currentColor" />
            <circle cx="16" cy="12" r="1" fill="currentColor" />
          </svg>
          Agent
        </button>
      </header>

      <div style={{ flex: 1, position: 'relative', minHeight: 0, display: 'flex' }}>
        <WorkbenchRail
          zh={zh}
          expanded={railExpanded}
          onToggleExpand={() => setRailExpanded(v => !v)}
          palette={W}
          theme={workbenchTheme}
          onThemeChange={setWorkbenchTheme}
          onAddNode={() => {
            const cx = window.innerWidth / 2
            const cy = window.innerHeight / 2
            const point = rfInstance?.screenToFlowPosition({ x: cx, y: cy }) ?? { x: 200, y: 180 }
            openAddMenuAt(70, 120, point.x, point.y)
          }}
          workspace={[
            {
              id: 'knowledge',
              title: zh ? '知识库' : 'Knowledge',
              active: knowledgeOpen,
              onClick: () => {
                const next = !knowledgeOpen
                setAssetsOpen(false); setHistoryOpen(false); setScheduleOpen(false); setKnowledgeOpen(next)
              },
              icon: <RailIcon path="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" path2="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />,
            },
            {
              id: 'assets',
              title: zh ? '素材' : 'Assets',
              active: assetsOpen,
              onClick: () => {
                const next = !assetsOpen
                setKnowledgeOpen(false); setHistoryOpen(false); setScheduleOpen(false); setAssetsOpen(next)
              },
              icon: <RailIcon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" path2="M14 14l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
            },
            {
              id: 'history',
              title: zh ? '历史' : 'History',
              active: historyOpen,
              onClick: () => {
                const next = !historyOpen
                setKnowledgeOpen(false); setAssetsOpen(false); setScheduleOpen(false); setHistoryOpen(next)
              },
              icon: <RailIcon path="M12 8v4l3 3" path2="M3.05 11a9 9 0 1 1 .5 4" />,
            },
          ]}
          objects={[
            {
              id: 'schedule',
              title: zh ? '排期 · 待办' : 'Schedule · Tasks',
              active: scheduleOpen,
              onClick: () => {
                const next = !scheduleOpen
                setKnowledgeOpen(false); setAssetsOpen(false); setHistoryOpen(false); setScheduleOpen(next)
              },
              icon: <RailIcon path="M8 7V3M16 7V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />,
            },
          ]}
        />

        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <WorkbenchProvider value={workbenchActions}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={paintedEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onSelectionChange={onSelectionChange}
                nodeTypes={nodeTypes}
                defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
                defaultEdgeOptions={{
                  style: { ...EDGE_DEFAULT },
                  animated: false,
                }}
                edgesFocusable
                elementsSelectable
                onInit={inst => setRfInstance(inst)}
                onDoubleClick={onPaneOrBgDoubleClick}
                onPaneClick={() => { setMenu(null); setExportOpen(false) }}
                onDragOver={onPaneDragOver}
                onDrop={onPaneDrop}
                proOptions={{ hideAttribution: true }}
                style={{ background: W.bg }}
                minZoom={0.25}
                maxZoom={1.75}
                zoomOnScroll
                zoomOnPinch
                zoomOnDoubleClick={false}
                panOnScroll={false}
                noPanClassName="nopan"
                noDragClassName="nodrag"
                noWheelClassName="nowheel"
              >
                <Background
                  id="dots"
                  variant={BackgroundVariant.Dots}
                  gap={22}
                  size={1.35}
                  color={W.dot}
                />
              </ReactFlow>
            </ReactFlowProvider>
          </WorkbenchProvider>

          {/* Task-first empty state — magnets sized to grid scale */}
          {/* Empty canvas: always offer task magnets when there are no nodes */}
          {nodes.length === 0 && (
            <div style={{
              position: 'absolute', left: '50%', top: '44%', transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, zIndex: 40, pointerEvents: 'none',
            }}>
              <div style={{ color: W.muted, fontSize: 12, textAlign: 'center', maxWidth: 360, lineHeight: 1.55 }}>
                {zh
                  ? '① 选任务加节点 → ② 点节点在下方编辑并选 Agent 运行 → ③ 导出内容包'
                  : '① Pick a task → ② Edit under the node, pick Agent, Run → ③ Export pack'}
              </div>
              <div style={{ display: 'flex', gap: 10, pointerEvents: 'auto', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { key: 'marketing' as const, label: zh ? '从知识做营销' : 'Knowledge → marketing' },
                  { key: 'repurpose' as const, label: zh ? '一条内容拆四平台' : 'One piece → 4 platforms' },
                  { key: 'asset' as const, label: zh ? '先丢素材' : 'Drop assets first' },
                ].map(t => (
                  <button key={t.key} onClick={() => dropTemplate(t.key)} style={{
                    padding: '11px 14px', borderRadius: 10,
                    border: `1px solid ${W.border}`,
                    background: W.chipBg, color: W.ink,
                    fontWeight: 600, fontSize: 12, cursor: 'pointer', minWidth: 128,
                  }}>{t.label}</button>
                ))}
              </div>
              <div style={{ color: W.faint, fontSize: 11, pointerEvents: 'auto' }}>
                {zh ? '或双击空白处添加节点' : 'Or double-click the canvas to add a node'}
              </div>
            </div>
          )}

          {/* Grouped add-node menu */}
          {menu && (
            <div style={{
              position: 'fixed', left: Math.min(menu.x, window.innerWidth - 220), top: Math.min(menu.y, window.innerHeight - 320),
              zIndex: 40, background: W.panel, border: `1px solid ${W.border}`, borderRadius: 12,
              padding: 8, minWidth: 188, boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
            }}>
              {menuGroups.map(g => (
                <div key={g.title} style={{ marginBottom: 6 }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 9, color: W.muted, letterSpacing: '0.06em',
                    padding: '4px 8px 2px', textTransform: 'uppercase',
                  }}>{g.title}</div>
                  {g.items.map(([k, label]) => (
                    <button key={k} onClick={() => addKind(k, { x: menu.flowX, y: menu.flowY })} style={menuItem(W)}>{label}</button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Knowledge panel (from rail) */}
          {knowledgeOpen && (
            <aside style={sidePanelStyle(W)}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <strong style={{ fontSize: 13 }}>{zh ? '知识库' : 'Knowledge'}</strong>
                <button onClick={() => setKnowledgeOpen(false)} style={{ marginLeft: 'auto', ...ghostBtn(W) }}>×</button>
              </div>
              <KnowledgeAdd zh={zh} projectId={project.id} palette={W} onAdded={(entry) => {
                addKnowledgeEntry(entry)
                const n = makeNode('knowledgeCard', { x: 80, y: 80 }, { title: entry.title, body: entry.content, knowledgeId: entry.id, status: 'done' })
                setNodes(nds => [...nds, { ...n, type: 'chirp' }])
              }} />
              {knowledgeEntries.length === 0 && (
                <div style={{ fontSize: 12, color: W.muted, marginTop: 12 }}>{zh ? '暂无条目' : 'No entries yet'}</div>
              )}
              {knowledgeEntries.map(e => (
                <button key={e.id} onClick={() => {
                  const n = makeNode('knowledgeCard', { x: 100 + Math.random() * 40, y: 100 }, { title: e.title, body: e.content, knowledgeId: e.id, status: 'done' })
                  setNodes(nds => [...nds, { ...n, type: 'chirp' }])
                }} style={listCard(W)}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{e.title}</div>
                  <div style={{ fontSize: 10, color: W.muted, marginTop: 4 }}>{e.source} · {e.content.slice(0, 60)}…</div>
                </button>
              ))}
            </aside>
          )}

          {/* Assets panel (simplified) */}
          {assetsOpen && (
            <aside style={sidePanelStyle(W)}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <strong style={{ fontSize: 13 }}>{zh ? '素材' : 'Assets'}</strong>
                <button onClick={() => setAssetsOpen(false)} style={{ marginLeft: 'auto', ...ghostBtn(W) }}>×</button>
              </div>
              <p style={{ fontSize: 11, color: W.muted, lineHeight: 1.5, margin: '0 0 10px' }}>
                {zh ? '把素材丢到画布上，再 Try「分析打标」。' : 'Drop assets onto the canvas, then Try “Analyze & tag”.'}
              </p>
              <button onClick={() => { addKind('asset'); setAssetsOpen(false) }} style={{
                width: '100%', padding: 10, borderRadius: 8, border: 'none', background: W.accent, color: '#fff',
                fontWeight: 650, cursor: 'pointer', fontSize: 12, marginBottom: 10,
              }}>{zh ? '+ 添加素材节点' : '+ Add asset node'}</button>
              {assetNodes.length === 0 && (
                <div style={{ fontSize: 12, color: W.muted }}>{zh ? '画布上还没有素材' : 'No assets on canvas yet'}</div>
              )}
              {assetNodes.map(n => {
                const d = n.data as CanvasNodeData
                return (
                  <button key={n.id} onClick={() => setSelectedId(n.id)} style={listCard(W)}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{d.title}</div>
                    <div style={{ fontSize: 10, color: W.muted, marginTop: 4 }}>
                      {d.tags?.length ? d.tags.join(', ') : (d.body.slice(0, 50) || (zh ? '未分析' : 'Not analyzed'))}
                    </div>
                  </button>
                )
              })}
            </aside>
          )}

          {/* History */}
          {historyOpen && (
            <aside style={{ ...sidePanelStyle(W), maxHeight: 320 }}>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <strong style={{ fontSize: 12 }}>{zh ? '节点历史' : 'Nodes'}</strong>
                <button onClick={() => setHistoryOpen(false)} style={{ marginLeft: 'auto', ...ghostBtn(W) }}>×</button>
              </div>
              {nodes.length === 0 && <div style={{ fontSize: 12, color: W.muted }}>{zh ? '暂无节点' : 'No nodes yet'}</div>}
              {nodes.map(n => {
                const d = n.data as CanvasNodeData
                return (
                  <button key={n.id} onClick={() => setSelectedId(n.id)} style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '7px 0',
                    background: 'none', border: 'none', borderBottom: `1px solid ${W.border}`,
                    color: W.ink, cursor: 'pointer', fontSize: 11,
                  }}>{d.kind} · {d.title} · {d.status ?? 'idle'}</button>
                )
              })}
            </aside>
          )}

          <AgentSidebar
            zh={zh}
            open={agentOpen}
            onClose={() => setAgentOpen(false)}
            busy={agentBusy || pipelineBusy}
            canvasHint={{
              nodeCount: nodes.length,
              selectedLabel: selectedId
                ? (() => {
                    const d = nodes.find(n => n.id === selectedId)?.data as CanvasNodeData | undefined
                    return d ? `${d.kind} · ${d.title}` : undefined
                  })()
                : undefined,
              knowledgeCount: knowledgeEntries.length,
              boardTaskCount: boardTasks.length,
            }}
            pipelineLive={agentPipelineTasks}
            onAgentTurn={async (message) => {
              const r = await handleAgentTurn(message)
              if (r.lastAppliedIds) lastAppliedIdsRef.current = r.lastAppliedIds
              return r
            }}
            onPinKnowledge={pinChatToKnowledge}
            onApplyPlan={async (conversation) => {
              setAgentBusy(true)
              try {
                return await applyPlanFromConversation(conversation)
              } finally {
                setAgentBusy(false)
              }
            }}
            onRunPipeline={(ids) => {
              if (ids?.length) lastAppliedIdsRef.current = ids
            }}
          />

          {scheduleOpen && (
            <ScheduleBoardPanel
              zh={zh}
              projectId={project.id}
              tasks={boardTasks}
              draftNodes={draftNodes}
              palette={W}
              onClose={() => setScheduleOpen(false)}
              onAdd={addBoardTask}
              onUpdate={(id, updates) => updateBoardTask(project.id, id, updates)}
              onRemove={(id) => removeBoardTask(project.id, id)}
            />
          )}

          {/* Bottom-center glass capsule — LibTV texture, stroke icons only */}
          <div style={{
            position: 'absolute', left: '50%', bottom: 28, transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px', borderRadius: 999,
            background: workbenchTheme === 'light' ? 'rgba(255,255,255,0.88)' : 'rgba(18,18,18,0.82)',
            border: `1px solid ${W.border}`,
            boxShadow: workbenchTheme === 'light'
              ? '0 10px 28px rgba(0,0,0,0.12)'
              : '0 10px 32px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.05) inset',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 20,
          }}>
            <CapsuleBtn
              title={zh ? '添加节点' : 'Add node'}
              primary
              light={workbenchTheme === 'light'}
              onClick={() => {
                const cx = window.innerWidth / 2
                const cy = window.innerHeight - 140
                const point = rfInstance?.screenToFlowPosition({ x: cx, y: cy }) ?? { x: 200, y: 200 }
                openAddMenuAt(cx - 40, cy - 20, point.x, point.y)
              }}
            >
              <IconPlus />
            </CapsuleBtn>
            <CapsuleBtn
              title={zh ? '运行选中' : 'Run selected'}
              light={workbenchTheme === 'light'}
              onClick={() => selectedId && runNode(selectedId)}
              disabled={!selectedId || pipelineBusy}
            >
              <IconPlay />
            </CapsuleBtn>
            <CapsuleBtn
              title={zh ? '一键按依赖运行画布' : 'Run pipeline by deps'}
              light={workbenchTheme === 'light'}
              onClick={() => { void runPipeline() }}
              disabled={pipelineBusy || nodes.length === 0}
            >
              <IconPipeline />
            </CapsuleBtn>
            <div style={{ width: 1, height: 18, background: W.border, margin: '0 4px' }} />
            <CapsuleBtn
              title={zh ? '知识库' : 'Knowledge'}
              light={workbenchTheme === 'light'}
              active={knowledgeOpen}
              onClick={() => { setKnowledgeOpen(v => !v); setAssetsOpen(false); setHistoryOpen(false); setScheduleOpen(false) }}
            >
              <IconBook />
            </CapsuleBtn>
            <CapsuleBtn
              title={zh ? '排期 · 待办' : 'Schedule · Tasks'}
              light={workbenchTheme === 'light'}
              active={scheduleOpen}
              onClick={() => {
                setScheduleOpen(v => !v)
                setKnowledgeOpen(false); setAssetsOpen(false); setHistoryOpen(false)
              }}
            >
              <IconCalendar />
            </CapsuleBtn>
          </div>
        </div>
      </div>

      {marketOpen && (
        <TemplateMarket
          zh={zh}
          onClose={() => setMarketOpen(false)}
          onUse={applyTemplate}
        />
      )}
    </div>
  )
}

function RailIcon({ path, path2 }: { path: string; path2?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
      {path2 ? <path d={path2} /> : null}
    </svg>
  )
}

function CapsuleBtn({ title, onClick, children, disabled, primary, active, light }: {
  title: string
  onClick: () => void
  children: ReactNode
  disabled?: boolean
  primary?: boolean
  active?: boolean
  light?: boolean
}) {
  const [hover, setHover] = useState(false)
  const dimmed = Boolean(disabled)
  const bg = primary
    ? (hover && !dimmed
      ? (light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.18)')
      : (light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)'))
    : active
      ? 'rgba(59,130,246,0.22)'
      : (hover && !dimmed
        ? (light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)')
        : 'transparent')
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 38, height: 38, borderRadius: primary ? 10 : 999, border: 'none',
        background: bg,
        color: dimmed
          ? (light ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.22)')
          : (hover || active || primary
            ? (light ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.95)')
            : (light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.72)')),
        cursor: dimmed ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 120ms ease, color 120ms ease',
      }}
    >{children}</button>
  )
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  )
}

function IconPipeline() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.5 7.5L15.5 11M8.5 16.5L15.5 13" />
    </svg>
  )
}

function IconBook() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  )
}

function KnowledgeAdd({ zh, projectId, palette: P, onAdded }: {
  zh: boolean
  projectId: string
  palette: WorkbenchPalette
  onAdded: (e: KnowledgeEntry) => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder={zh ? '标题' : 'Title'} style={inputStyle(P)} />
      <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder={zh ? '粘贴设定 / PDF 文本' : 'Paste brief / PDF text'} style={{ ...inputStyle(P), resize: 'vertical' }} />
      <input value={link} onChange={e => setLink(e.target.value)} placeholder={zh ? '或粘贴链接（记为来源）' : 'Or paste a link (stored as source)'} style={inputStyle(P)} />
      <button
        onClick={() => {
          const content = [body, link ? `Source: ${link}` : ''].filter(Boolean).join('\n\n')
          if (!content.trim()) return
          onAdded({
            id: `know-${Date.now()}`,
            projectId,
            title: title.trim() || (zh ? '知识条目' : 'Knowledge entry'),
            content,
            source: link ? 'link' : 'manual',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          setTitle(''); setBody(''); setLink('')
        }}
        style={{ padding: 8, borderRadius: 8, border: 'none', background: P.accent, color: '#fff', cursor: 'pointer', fontSize: 12 }}
      >{zh ? '添加并放到画布' : 'Add & drop on canvas'}</button>
    </div>
  )
}

function ghostBtn(P: WorkbenchPalette): CSSProperties {
  return {
    background: P.chipBg, border: `1px solid ${P.border}`,
    color: P.muted, borderRadius: 8, padding: '4px 10px',
    cursor: 'pointer', fontSize: 12,
  }
}
function menuItem(P: WorkbenchPalette): CSSProperties {
  return {
    display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px',
    background: 'transparent', border: 'none', color: P.ink, cursor: 'pointer',
    borderRadius: 8, fontSize: 12,
  }
}
function inputStyle(P: WorkbenchPalette): CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8,
    border: `1px solid ${P.border}`, background: P.chipBg,
    color: P.ink, fontSize: 12, outline: 'none', fontFamily: SANS,
  }
}
function sidePanelStyle(P: WorkbenchPalette): CSSProperties {
  return {
    position: 'absolute', top: 12, left: 12, width: 280, maxHeight: 'calc(100% - 100px)',
    overflowY: 'auto', background: P.panel, border: `1px solid ${P.border}`, borderRadius: 14,
    padding: 14, zIndex: 15, boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
  }
}
function listCard(P: WorkbenchPalette): CSSProperties {
  return {
    display: 'block', width: '100%', textAlign: 'left', marginTop: 8, padding: 10,
    borderRadius: 10, border: `1px solid ${P.border}`, background: P.chipBg,
    color: P.ink, cursor: 'pointer',
  }
}
