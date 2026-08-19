'use client'
import { createContext, useContext, type ReactNode } from 'react'
import type { CanvasNodeData } from '@/lib/canvas'
import type { AssetMatch } from '@/lib/workbench/assetMatch'

export type DraftNodeRef = { id: string; title: string }

export type WorkbenchActions = {
  zh: boolean
  runNode: (nodeId: string) => void
  patchNode: (nodeId: string, partial: Partial<CanvasNodeData>) => void
  addScheduleSlot: (nodeId: string) => void
  /** Close Agent dock only (deselect) — does not delete the node */
  closeDock: () => void
  /** Draft nodes that can be attached to schedule anchors */
  draftNodes: DraftNodeRef[]
  /** Marketing upstream readiness for UI gate */
  marketingUpstream: (nodeId: string) => { ok: boolean; label: string }
  runPipeline: (seedIds?: string[]) => void
  pipelineBusy: boolean
  /** Rank tagged assets for a marketing node (not already connected) */
  suggestAssetsForMarketing: (marketingNodeId: string) => AssetMatch[]
  connectAssetToMarketing: (assetId: string, marketingNodeId: string) => void
  /** From a finished repurpose node: create/update schedule board rows */
  suggestScheduleFromRepurpose: (repurposeNodeId: string) => void
  /** Preview of text that will be fed into repurpose (upstream preferred) */
  repurposeSourcePreview: (nodeId: string) => { hasUpstream: boolean; preview: string }
}

const WorkbenchCtx = createContext<WorkbenchActions | null>(null)

export function WorkbenchProvider({
  value,
  children,
}: {
  value: WorkbenchActions
  children: ReactNode
}) {
  return <WorkbenchCtx.Provider value={value}>{children}</WorkbenchCtx.Provider>
}

export function useWorkbench(): WorkbenchActions {
  const ctx = useContext(WorkbenchCtx)
  if (!ctx) throw new Error('useWorkbench must be used within WorkbenchProvider')
  return ctx
}
