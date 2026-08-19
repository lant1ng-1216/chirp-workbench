'use client'
import { memo, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Handle, NodeToolbar, Position, type Node, type NodeProps } from '@xyflow/react'
import type { CanvasNodeData, CanvasNodeKind } from '@/lib/canvas'
import { useWorkbench } from './WorkbenchContext'
import AgentDock from './AgentDock'
import { PLATFORM_ORDER, PlatformIcon, type PlatformId } from './BrandIcons'
import { S } from './surface'
import { AgentLoading, ThinkingBlock } from './ai-ui'

type ChirpFlowNode = Node<CanvasNodeData, 'chirp'>


/** LibTV-like single shell — soft edge, no nested box feel */
const CARD = {
  bg: S.shellBg,
  border: S.shellBorder,
  borderSel: 'rgba(255,255,255,0.28)',
  ink: S.ink,
  muted: S.muted,
}

/** LibTV-like: size follows content role */
const KIND_WIDTH: Record<CanvasNodeKind, number> = {
  knowledgeSource: 300,
  knowledgeCard: 250,
  asset: 320,
  marketing: 248,
  repurpose: 340,
  schedule: 320,
  note: 188,
}

function kindLabel(kind: string, zh: boolean): string {
  const map: Record<string, [string, string]> = {
    knowledgeSource: ['知识源', 'Source'],
    knowledgeCard: ['知识卡', 'Knowledge'],
    asset: ['素材', 'Asset'],
    marketing: ['营销', 'Marketing'],
    repurpose: ['复用', 'Repurpose'],
    schedule: ['排期', 'Schedule'],
    note: ['笔记', 'Note'],
  }
  const pair = map[kind]
  return pair ? (zh ? pair[0] : pair[1]) : kind
}

function tryActions(kind: CanvasNodeData['kind'], zh: boolean): { id: string; label: string }[] {
  switch (kind) {
    case 'knowledgeSource':
      return [{ id: 'run', label: zh ? '提炼成知识卡' : 'Refine to card' }]
    case 'knowledgeCard':
      return [{ id: 'run', label: zh ? '再提炼' : 'Re-refine' }]
    case 'asset':
      return [{ id: 'run', label: zh ? '分析打标' : 'Analyze & tag' }]
    case 'marketing':
      return [{ id: 'run', label: zh ? '生成营销' : 'Generate' }]
    case 'repurpose':
      return [{ id: 'run', label: zh ? '拆四平台' : 'Split 4 platforms' }]
    case 'schedule':
      return [{ id: 'anchor', label: zh ? '添加时间锚' : 'Add anchor' }]
    default:
      return []
  }
}

const HANDLE_CSS = `
.chirp-node-shell .chirp-magnet {
  width: 22px !important;
  height: 22px !important;
  min-width: 22px !important;
  min-height: 22px !important;
  background: #f3f3f3 !important;
  border: 1px solid rgba(0,0,0,0.22) !important;
  border-radius: 999px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  display: flex !important;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.82);
  pointer-events: none;
  transition: opacity 0.14s ease, transform 0.14s ease, background 0.14s ease;
  z-index: 5;
}
.chirp-node-shell .chirp-magnet::after {
  content: '+';
  color: #222;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  margin-top: -1px;
  pointer-events: none;
}
.react-flow__node:hover .chirp-node-shell .chirp-magnet,
.react-flow__node.selected .chirp-node-shell .chirp-magnet,
.react-flow.connecting .chirp-node-shell .chirp-magnet {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}
.chirp-node-shell .chirp-magnet:hover {
  background: #fff !important;
  transform: scale(1.08);
}
.chirp-node-shell .chirp-magnet-left {
  left: -11px !important;
}
.chirp-node-shell .chirp-magnet-right {
  right: -11px !important;
}
`

function ChirpNodeInner({ id, data, selected }: NodeProps<ChirpFlowNode>) {
  const { zh, runNode, patchNode, addScheduleSlot, closeDock, draftNodes, marketingUpstream, suggestAssetsForMarketing, connectAssetToMarketing } = useWorkbench()
  const width = KIND_WIDTH[data.kind] ?? 220
  const actions = tryActions(data.kind, zh)
  const [platformTab, setPlatformTab] = useState<PlatformId>('youtube')
  const busy = data.status === 'running'
  const mktUp = data.kind === 'marketing' ? marketingUpstream(id) : null
  const assetMatches = data.kind === 'marketing' && (data.body?.trim().length ?? 0) > 20
    ? suggestAssetsForMarketing(id).slice(0, 3)
    : []
  const stop = (e: MouseEvent) => {
    e.stopPropagation()
  }
  const stopPan = (e: ReactPointerEvent | MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <>
      <style>{HANDLE_CSS}</style>
      {/* Outer shell: no overflow clip so magnets can float outside */}
      <div className="chirp-node-shell" style={{ width, position: 'relative', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{
          width: '100%',
          borderRadius: S.radiusShell,
          border: `1px solid ${selected ? CARD.borderSel : CARD.border}`,
          background: CARD.bg,
          boxShadow: selected
            ? '0 0 0 1px rgba(255,255,255,0.06), 0 14px 36px rgba(0,0,0,0.5)'
            : '0 10px 28px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03) inset',
          overflow: 'hidden',
          fontFamily: S.font,
        }}>
          <div style={{ padding: '9px 12px 0', display: 'flex', alignItems: 'center', gap: 7 }}>
            <KindGlyph kind={data.kind} />
            <span style={{ fontWeight: 650, fontSize: 12, color: CARD.ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {data.title || kindLabel(data.kind, zh)}
            </span>
            {data.status === 'running' && (
              <StatusDot color="#a3a3a3" label={zh ? '…' : '…'} />
            )}
            {data.status === 'error' && <StatusDot color="#fca5a5" label="!" />}
            {data.status === 'done' && <StatusDot color="#86efac" label="ok" />}
          </div>

          <div style={{ padding: '8px 12px 11px' }}>
            <NodeFace data={data} zh={zh} platformTab={platformTab} setPlatformTab={setPlatformTab} stop={stop} />

            {data.status === 'running' && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <AgentLoading
                  label={zh ? '运行中' : 'Running'}
                  variant="Drive"
                  compact
                />
                <ThinkingBlock
                  label={zh ? '节点执行' : 'Node run'}
                  live
                  defaultOpen={false}
                  hint={typeof data.waitHint === 'string' && data.waitHint
                    ? data.waitHint
                    : (zh ? '等待 Agent 回复…' : 'Waiting for Agent…')}
                />
              </div>
            )}

            {data.error && (
              <div style={{ marginTop: 8, fontSize: 10, color: '#fca5a5', lineHeight: 1.4 }}>
                {data.error}
                <button
                  type="button"
                  className="nodrag"
                  onClick={() => runNode(id)}
                  style={{
                    display: 'inline-block', marginLeft: 8, padding: '2px 8px', borderRadius: 6,
                    border: '1px solid rgba(252,165,165,0.45)', background: 'rgba(252,165,165,0.12)',
                    color: '#fecaca', cursor: 'pointer', fontSize: 10, fontWeight: 600,
                  }}
                >{zh ? '重试' : 'Retry'}</button>
              </div>
            )}

            {actions.length > 0 && (
              <div style={{
                marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
              }} onMouseDown={stop}>
                <span style={{
                  fontSize: 10, color: S.faint,
                }}>{zh ? '尝试' : 'Try'}:</span>
                {actions.map(a => (
                  <button
                    key={a.id}
                    className="nodrag"
                    disabled={busy || (data.kind === 'marketing' && a.id === 'run' && mktUp !== null && !mktUp.ok)}
                    onClick={() => {
                      if (a.id === 'anchor') addScheduleSlot(id)
                      else runNode(id)
                    }}
                    style={tryBtn(busy || (data.kind === 'marketing' && a.id === 'run' && mktUp !== null && !mktUp.ok))}
                  >{busy ? (zh ? '运行中…' : 'Running…') : a.label}</button>
                ))}
              </div>
            )}
            {mktUp && (
              <div style={{
                marginTop: 6, fontSize: 10, lineHeight: 1.4,
                color: mktUp.ok ? 'rgba(134,239,172,0.85)' : 'rgba(252,165,165,0.9)',
              }}>
                {mktUp.label}
              </div>
            )}
            {assetMatches.length > 0 && (
              <div style={{ marginTop: 8 }} onMouseDown={stop}>
                <div style={{ fontSize: 10, color: S.faint, marginBottom: 4 }}>
                  {zh ? '建议素材' : 'Suggested assets'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {assetMatches.map(s => (
                    <button
                      key={s.assetId}
                      type="button"
                      className="nodrag"
                      onClick={() => connectAssetToMarketing(s.assetId, id)}
                      style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                        border: '1px solid rgba(147,197,253,0.35)', background: 'rgba(59,130,246,0.12)',
                        color: '#bfdbfe',
                      }}
                    >
                      + {s.title.slice(0, 18)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Handle
          type="target"
          position={Position.Left}
          className="chirp-magnet chirp-magnet-left"
          isConnectable
        />
        <Handle
          type="source"
          position={Position.Right}
          className="chirp-magnet chirp-magnet-right"
          isConnectable
        />
      </div>

      <NodeToolbar isVisible={selected} position={Position.Bottom} offset={14} align="center" style={{ padding: 0 }}>
        <div
          className="nodrag nopan nowheel"
          onMouseDown={stopPan}
          onPointerDown={stopPan}
        >
          <AgentDock
            id={id}
            data={data}
            zh={zh}
            busy={busy}
            draftNodes={draftNodes}
            patchNode={patchNode}
            runNode={runNode}
            closeDock={closeDock}
            addScheduleSlot={addScheduleSlot}
          />
        </div>
      </NodeToolbar>
    </>
  )
}

function NodeFace({ data, zh, platformTab, setPlatformTab, stop }: {
  data: CanvasNodeData
  zh: boolean
  platformTab: PlatformId
  setPlatformTab: (p: PlatformId) => void
  stop: (e: MouseEvent) => void
}) {
  if (data.kind === 'asset') {
    return (
      <div>
        <div style={{
          height: 132, borderRadius: S.radiusWell, border: 'none',
          background: S.wellBg, boxShadow: S.wellInset,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', marginBottom: 8,
        }}>
          {data.previewUrl && data.mimeType?.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : data.fileName ? (
            <div style={{ textAlign: 'center', padding: 12 }}>
              <FileGlyph />
              <div style={{ marginTop: 8, fontSize: 11, color: CARD.muted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {data.fileName}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.28)' }}>
              <MediaGlyph />
              <div style={{ marginTop: 8, fontSize: 11 }}>{zh ? '上传素材预览区' : 'Upload preview'}</div>
            </div>
          )}
        </div>
        {data.tags && data.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            {data.tags.slice(0, 6).map(t => (
              <span key={t} style={tagStyle}>{t}</span>
            ))}
          </div>
        )}
        {data.platformsSuggested && data.platformsSuggested.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            {data.platformsSuggested.slice(0, 4).map(p => (
              <span key={p} style={{ ...tagStyle, opacity: 0.85 }}>{p}</span>
            ))}
          </div>
        )}
        {(data.summary || data.body) ? (
          <div style={previewText}>
            {(data.summary || data.body || '').slice(0, 100)}
            {(data.summary || data.body || '').length > 100 ? '…' : ''}
          </div>
        ) : null}
      </div>
    )
  }

  if (data.kind === 'knowledgeSource') {
    return (
      <div style={{
        minHeight: 88, borderRadius: S.radiusWell, background: S.wellBg,
        boxShadow: S.wellInset, padding: 10,
      }}>
        {data.body ? (
          <div style={{ ...previewText, maxHeight: 100 }}>{data.body.slice(0, 280)}{data.body.length > 280 ? '…' : ''}</div>
        ) : (
          <div style={{ fontSize: 11, color: S.faint, fontStyle: 'italic', lineHeight: 1.5 }}>
            {zh ? '粘贴品牌设定、文档摘录或链接说明…' : 'Paste brand brief, doc excerpt, or link notes…'}
          </div>
        )}
      </div>
    )
  }

  if (data.kind === 'knowledgeCard') {
    return (
      <div style={{ minHeight: 72 }}>
        {data.body ? (
          <div style={{ ...previewText, maxHeight: 110 }}>{data.body.slice(0, 220)}{data.body.length > 220 ? '…' : ''}</div>
        ) : (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
            {zh ? '提炼后的品牌知识会出现在这里' : 'Refined brand knowledge appears here'}
          </div>
        )}
      </div>
    )
  }

  if (data.kind === 'marketing') {
    const preview = data.angles?.length
      ? data.angles.map(a => a.headline).filter(Boolean).join(' · ')
      : data.body
    return (
      <div style={{ minHeight: 96 }}>
        {preview ? (
          <div style={{ ...previewText, maxHeight: 130 }}>{preview.slice(0, 320)}{preview.length > 320 ? '…' : ''}</div>
        ) : (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic', lineHeight: 1.5 }}>
            {zh ? '营销角度 / 文案预览' : 'Marketing angles / draft preview'}
          </div>
        )}
      </div>
    )
  }

  if (data.kind === 'repurpose') {
    return (
      <div onMouseDown={stop}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {PLATFORM_ORDER.map(p => {
            const has = Boolean(data.platforms?.[p]?.trim())
            const active = platformTab === p
            return (
              <button
                key={p}
                className="nodrag"
                title={p === 'twitter' ? 'X' : p}
                onClick={() => setPlatformTab(p)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, cursor: 'pointer',
                  border: 'none',
                  background: active ? 'rgba(255,255,255,0.1)' : S.wellBg,
                  boxShadow: active ? 'none' : S.wellInset,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: has || active ? 1 : 0.45,
                }}
              ><PlatformIcon platform={p} size={15} /></button>
            )
          })}
        </div>
        <div style={{
          ...previewText, maxHeight: 100, minHeight: 56, background: S.wellBg, borderRadius: S.radiusWell,
          padding: 8, boxShadow: S.wellInset,
        }}>
          {data.platforms?.[platformTab]?.trim()
            || (zh ? '尚未生成该平台草稿' : 'No draft for this platform yet')}
        </div>
      </div>
    )
  }

  if (data.kind === 'schedule') {
    const slots = data.slots ?? []
    return (
      <div style={{ minHeight: 72 }}>
        <div style={{ fontSize: 10, color: S.faint, lineHeight: 1.45, marginBottom: 8 }}>
          {zh ? '把成稿挂到时间点 · 本版只排不发' : 'Pin drafts to times · schedule only'}
        </div>
        {slots.length === 0 ? (
          <div style={{
            fontSize: 11, color: S.muted, lineHeight: 1.5,
            padding: '8px 0',
          }}>
            {zh ? '还没有时间锚。选中本节点，在下方选成稿 → 选时间 → 加入。' : 'No anchors yet. Select this node, pick a draft → time → add.'}
          </div>
        ) : (
          slots.slice(0, 5).map((s, i) => (
            <div key={i} style={{
              fontSize: 11, color: CARD.ink, lineHeight: 1.45, marginBottom: 6,
              paddingBottom: 6, borderBottom: i < Math.min(slots.length, 5) - 1 ? `1px solid ${S.hairline}` : 'none',
            }}>
              <div style={{ fontWeight: 650 }}>{s.at.replace('T', ' ')}</div>
              <div style={{ color: CARD.muted, marginTop: 2 }}>
                {s.label}
                {s.contentNodeId ? ` · ${zh ? '已挂成稿' : 'draft attached'}` : ` · ${zh ? '未挂成稿' : 'no draft'}`}
              </div>
            </div>
          ))
        )}
        {slots.length > 5 ? <div style={{ fontSize: 10, color: CARD.muted }}>+{slots.length - 5}</div> : null}
      </div>
    )
  }

  // note
  return (
    <div style={{ minHeight: 48 }}>
      {data.body ? (
        <div style={{ ...previewText, maxHeight: 64 }}>{data.body.slice(0, 120)}{data.body.length > 120 ? '…' : ''}</div>
      ) : (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
          {zh ? '短笔记' : 'Short note'}
        </div>
      )}
    </div>
  )
}



function KindGlyph({ kind }: { kind: string }) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'rgba(255,255,255,0.55)', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (kind === 'asset') {
    return (
      <svg {...common} aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10" r="1.5" />
        <path d="M21 15l-5-5L5 19" />
      </svg>
    )
  }
  if (kind === 'repurpose' || kind === 'marketing') {
    return (
      <svg {...common} aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </svg>
    )
  }
  if (kind === 'schedule') {
    return (
      <svg {...common} aria-hidden>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </svg>
    )
  }
  return (
    <svg {...common} aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function MediaGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="M21 15l-5-5L5 19" />
    </svg>
  )
}

function FileGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  )
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return <span style={{ fontSize: 9, color, fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
}

function tryBtn(busy: boolean): CSSProperties {
  return {
    padding: '4px 9px', borderRadius: S.radiusChip, cursor: busy ? 'wait' : 'pointer',
    border: '1px solid rgba(255,255,255,0.1)',
    background: busy ? 'transparent' : 'rgba(255,255,255,0.06)',
    color: busy ? S.faint : 'rgba(255,255,255,0.85)',
    fontSize: 11, fontWeight: 600,
  }
}

const previewText: CSSProperties = {
  fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55,
  whiteSpace: 'pre-wrap', overflow: 'hidden',
}

const tagStyle: CSSProperties = {
  fontSize: 9, padding: '1px 6px', borderRadius: 4,
  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)',
}

export default memo(ChirpNodeInner)
