/** Canvas workbench types — graph lives per project in Zustand */

import type { MarketingAngle } from '@/lib/workbench/marketing'

export type { MarketingAngle }

export type CanvasNodeKind =
  | 'knowledgeSource'
  | 'knowledgeCard'
  | 'asset'
  | 'marketing'
  | 'repurpose'
  | 'schedule'
  | 'note'

export interface CanvasNodeData {
  kind: CanvasNodeKind
  title: string
  /**
   * Primary editable / display text.
   * Deliverable rules: knowledge card = card text; asset = user notes (not analysis dump);
   * marketing = angles plain text (also stored in `angles`); note = note.
   */
  body: string
  /** Asset analysis one-liner — preferred upstream over body mix */
  summary?: string
  /** Capability note (e.g. not frame-level) — UI only, not upstream/export body */
  disclaimer?: string
  /** Agent advice / schedule hints — never treated as brand knowledge */
  advice?: string
  /** Structured extras */
  tags?: string[]
  /** Suggested platforms from asset analysis (chips) — not pasted into body */
  platformsSuggested?: string[]
  /** Parsed marketing angles (deliverable) */
  angles?: MarketingAngle[]
  platforms?: Partial<Record<'youtube' | 'instagram' | 'tiktok' | 'twitter', string>>
  /** Linked knowledge entry id (sidebar) */
  knowledgeId?: string
  /** Linked asset id */
  assetId?: string
  /** Local upload preview (data URL or blob URL) for asset nodes */
  previewUrl?: string
  fileName?: string
  mimeType?: string
  /** Optional source link for knowledge */
  sourceUrl?: string
  /** Schedule slots: ISO date → node id of content */
  slots?: Array<{ at: string; label: string; contentNodeId?: string }>
  status?: 'idle' | 'running' | 'done' | 'error'
  error?: string
  /** Collapsed analysis preview */
  analysisCollapsed?: boolean
  [key: string]: unknown
}

export interface CanvasNode {
  id: string
  type: 'chirp'
  position: { x: number; y: number }
  data: CanvasNodeData
}

export interface CanvasEdge {
  id: string
  source: string
  target: string
}

export interface CanvasGraph {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  /** Hide starter tiles after first dismiss */
  startersDismissed?: boolean
  updatedAt: string
}

export interface KnowledgeEntry {
  id: string
  projectId: string
  title: string
  content: string
  source: 'upload' | 'link' | 'chat' | 'manual'
  createdAt: string
  updatedAt: string
}

export function emptyGraph(): CanvasGraph {
  return { nodes: [], edges: [], startersDismissed: false, updatedAt: new Date().toISOString() }
}

export function newNodeId(kind: string) {
  return `n-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function makeNode(
  kind: CanvasNodeKind,
  position: { x: number; y: number },
  partial?: Partial<CanvasNodeData>,
): CanvasNode {
  const titles: Record<CanvasNodeKind, string> = {
    knowledgeSource: 'Knowledge source',
    knowledgeCard: 'Brand knowledge',
    asset: 'Asset',
    marketing: 'Marketing draft',
    repurpose: 'Cross-platform reuse',
    schedule: 'Schedule board',
    note: 'Note',
  }
  return {
    id: newNodeId(kind),
    type: 'chirp',
    position,
    data: {
      kind,
      title: titles[kind],
      body: '',
      status: 'idle',
      analysisCollapsed: true,
      ...partial,
    },
  }
}

/** Drop a pre-wired template onto the canvas */
export function templateCrossPlatform(ox = 80, oy = 120): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const src = makeNode('note', { x: ox, y: oy }, { title: 'Source content', body: '' })
  const rep = makeNode('repurpose', { x: ox + 320, y: oy }, { title: 'Cross-platform reuse' })
  return {
    nodes: [src, rep],
    edges: [{ id: `e-${src.id}-${rep.id}`, source: src.id, target: rep.id }],
  }
}

export function templateMarketing(ox = 80, oy = 120): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const know = makeNode('knowledgeCard', { x: ox, y: oy }, { title: 'Brand knowledge', body: '' })
  const mkt = makeNode('marketing', { x: ox + 320, y: oy }, { title: 'Marketing draft' })
  return {
    nodes: [know, mkt],
    edges: [{ id: `e-${know.id}-${mkt.id}`, source: know.id, target: mkt.id }],
  }
}

export function templateAsset(ox = 80, oy = 120): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const asset = makeNode('asset', { x: ox, y: oy }, { title: 'Asset', body: '' })
  return { nodes: [asset], edges: [] }
}
