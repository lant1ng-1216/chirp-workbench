/**
 * Deliverable vs meta helpers — keep upstream / export free of advice & disclaimers.
 */
import type { CanvasNodeData } from '@/lib/canvas'
import type { MarketingAngle } from '@/lib/workbench/marketing'
import { formatAnglesPlain } from '@/lib/workbench/marketing'

/** Text fed to downstream models (no disclaimer / platform-advice lines). */
export function upstreamDeliverable(data: CanvasNodeData): string {
  if (data.kind === 'asset') {
    const summary = (data.summary || '').trim()
    const body = stripMetaLines(data.body || '')
    const core = summary || body
    const tags = data.tags?.length ? `Tags: ${data.tags.join(', ')}` : ''
    return [core, tags].filter(Boolean).join('\n')
  }
  if (data.kind === 'marketing') {
    if (data.angles?.length) return formatAnglesPlain(data.angles)
    return stripMetaLines(data.body || '')
  }
  if (data.kind === 'repurpose' && data.platforms) {
    const plats = Object.entries(data.platforms)
      .filter(([, t]) => t?.trim())
      .map(([p, t]) => `[${p}]\n${t}`)
      .join('\n\n')
    if (plats) return plats
  }
  return stripMetaLines(data.body || '')
}

/** Markdown/JSON export: deliverable only. */
export function exportNodeText(data: CanvasNodeData): string {
  if (data.kind === 'asset') {
    const parts = [
      (data.summary || '').trim() || stripMetaLines(data.body || ''),
      data.tags?.length ? `Tags: ${data.tags.join(', ')}` : '',
    ]
    return parts.filter(Boolean).join('\n')
  }
  if (data.kind === 'marketing' && data.angles?.length) {
    return formatAnglesPlain(data.angles)
  }
  if (data.kind === 'repurpose') {
    return '' // platforms exported separately
  }
  return stripMetaLines(data.body || '')
}

export function stripMetaLines(text: string): string {
  return text
    .split('\n')
    .filter(line => {
      const t = line.trim()
      if (!t) return true
      if (/^【素材分析/.test(t) || /^\[Asset analysis/i.test(t)) return false
      if (/^建议平台[：:]/i.test(t) || /^Platforms?\s*:/i.test(t)) return false
      if (/元数据\+描述|非逐帧|metadata\+description|not frame-level/i.test(t) && t.length < 80) return false
      return true
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function anglesToBody(angles: MarketingAngle[]): string {
  return formatAnglesPlain(angles)
}
