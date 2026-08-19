'use client'
import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode, type RefObject } from 'react'
import type { CanvasNodeData } from '@/lib/canvas'
import { MindsLogo, PLATFORM_ORDER, PlatformIcon, type PlatformId } from './BrandIcons'
import { S, chipStyle, shellStyle, wellStyle } from './surface'
import { ImeInput, ImeTextarea } from './ImeFields'
import { ASSET_MAX_IMAGE, ASSET_MAX_VIDEO, putAssetBlob } from '@/lib/workbench/assetStore'
import { AgentLoading } from './ai-ui'
import { useWorkbench } from './WorkbenchContext'


type DraftRef = { id: string; title: string }

export function agentDockWidth(kind: CanvasNodeData['kind']): number {
  switch (kind) {
    case 'repurpose': return 440
    case 'asset': return 420
    case 'schedule': return 400
    case 'knowledgeSource': return 400
    case 'marketing': return 400
    case 'knowledgeCard': return 380
    case 'note': return 320
    default: return 400
  }
}

/** LibTV-style long agent input bar — kind-specific chips + footer */
export default function AgentDock({
  id, data, zh, busy, draftNodes, patchNode, runNode, closeDock, addScheduleSlot,
}: {
  id: string
  data: CanvasNodeData
  zh: boolean
  busy: boolean
  draftNodes: DraftRef[]
  patchNode: (id: string, partial: Partial<CanvasNodeData>) => void
  runNode: (id: string) => void
  closeDock: () => void
  addScheduleSlot: (id: string) => void
}) {
  const {
    marketingUpstream,
    suggestAssetsForMarketing,
    connectAssetToMarketing,
    suggestScheduleFromRepurpose,
    repurposeSourcePreview,
  } = useWorkbench()
  const runnable = ['knowledgeSource', 'knowledgeCard', 'asset', 'marketing', 'repurpose'].includes(data.kind)
  const mktGate = data.kind === 'marketing' ? marketingUpstream(id) : null
  const repSrc = data.kind === 'repurpose' ? repurposeSourcePreview(id) : null
  const platformsReady = Boolean(
    data.kind === 'repurpose'
    && data.platforms
    && Object.values(data.platforms).some(v => Boolean(v?.trim())),
  )
  const [agentOpen, setAgentOpen] = useState(false)
  const [showLink, setShowLink] = useState(Boolean(data.sourceUrl))
  const [repurposeTab, setRepurposeTab] = useState<'source' | PlatformId>('source')
  const [angleTab, setAngleTab] = useState(0)
  const [adviceOpen, setAdviceOpen] = useState(false)
  const [assetMatchOpen, setAssetMatchOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const assetSuggestions = data.kind === 'marketing' && assetMatchOpen
    ? suggestAssetsForMarketing(id)
    : []

  useEffect(() => {
    if (!agentOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!shellRef.current?.contains(e.target as Node)) setAgentOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [agentOpen])

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    const maxBytes = isVideo ? ASSET_MAX_VIDEO : ASSET_MAX_IMAGE
    if (file.size > maxBytes) {
      patchNode(id, {
        status: 'error',
        error: zh
          ? `文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB，上限 ${Math.round(maxBytes / 1024 / 1024)}MB）。请压缩后重试。`
          : `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB; max ${Math.round(maxBytes / 1024 / 1024)}MB).`,
      })
      e.target.value = ''
      return
    }

    const note = zh
      ? `已上传：${file.name}（${file.type || 'unknown'} · ${(file.size / 1024 / 1024).toFixed(2)} MB）\n可补充画面说明后分析打标。识别为元数据+描述驱动（非逐帧看片）。`
      : `Uploaded: ${file.name} (${file.type || 'unknown'} · ${(file.size / 1024 / 1024).toFixed(2)} MB)\nAdd a short description, then analyze. Metadata+description driven.`

    let previewUrl: string | undefined
    try {
      await putAssetBlob(id, file, { name: file.name, type: file.type || 'application/octet-stream' })
      if (isImage) previewUrl = URL.createObjectURL(file)
    } catch (err) {
      patchNode(id, {
        status: 'error',
        error: zh
          ? `本地存储失败：${err instanceof Error ? err.message : String(err)}。仍可仅用文件名+描述分析。`
          : `Local store failed: ${String(err)}. You can still analyze via name+description.`,
        fileName: file.name,
        mimeType: file.type,
        body: data.body?.trim() ? `${data.body.trim()}\n\n${note}` : note,
      })
      e.target.value = ''
      return
    }

    patchNode(id, {
      title: data.title?.trim() && data.title !== 'Asset' && data.title !== '素材'
        ? data.title
        : file.name.replace(/\.[^.]+$/, '') || file.name,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      previewUrl,
      body: data.body?.trim() ? `${data.body.trim()}\n\n${note}` : note,
      status: 'idle',
      error: undefined,
    })
    e.target.value = ''
  }

  const midHint = (() => {
    switch (data.kind) {
      case 'knowledgeSource':
        return zh ? '提炼成知识卡' : 'Refine to knowledge card'
      case 'knowledgeCard':
        return zh ? '更新知识' : 'Update knowledge'
      case 'asset':
        return data.fileName
          ? `${data.fileName}${data.mimeType ? ` · ${data.mimeType.split('/')[0]}` : ''}`
          : (zh ? '分析打标' : 'Analyze & tag')
      case 'marketing':
        return mktGate?.ok
          ? mktGate.label
          : (zh ? '未连接可用上游 — 无法生成' : 'No usable upstream — cannot generate')
      case 'repurpose':
        return platformsReady
          ? (zh ? '四平台已有草稿 · 可点「建议排期」' : 'Platform drafts ready · Suggest schedule available')
          : repSrc?.hasUpstream
            ? (zh ? '将复用上游成稿' : 'Will reuse upstream draft')
            : (zh ? '拆成四平台' : 'Split to 4 platforms')
      default:
        return ''
    }
  })()

  /* —— Schedule: long bar without Agent —— */
  if (data.kind === 'schedule') {
    return (
      <LongShell width={agentDockWidth('schedule')} onClose={closeDock} zh={zh} shellRef={shellRef}>
        <ScheduleRow zh={zh} data={data} draftNodes={draftNodes} onChange={slots => patchNode(id, { slots, status: 'done' })} />
        <FooterBar>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', flex: 1 }}>
            {zh ? '只排不发 · 锚点会写入导出包' : 'Schedule only · anchors export with the pack'}
          </span>
        </FooterBar>
      </LongShell>
    )
  }

  /* —— Note: compact bar, no Agent —— */
  if (data.kind === 'note') {
    return (
      <LongShell
        width={agentDockWidth('note')}
        onClose={closeDock}
        zh={zh}
        shellRef={shellRef}
        closeInHeader
      >
        <ImeTextarea
          className="nodrag nowheel"
          value={data.body}
          onValueChange={v => patchNode(id, { body: v })}
          rows={3}
          placeholder={zh ? '短笔记…' : 'Short note…'}
          style={inputArea}
        />
        <FooterBar>
          <ImeInput
            className="nodrag"
            value={data.title}
            onValueChange={v => patchNode(id, { title: v })}
            placeholder={zh ? '标题' : 'Title'}
            style={{ ...ghostInput, flex: 1 }}
          />
        </FooterBar>
      </LongShell>
    )
  }

  /* —— Runnable kinds —— */
  const topChips = (() => {
    if (data.kind === 'knowledgeSource') {
      return (
        <>
          <Chip onClick={() => { /* focus handled by click into textarea */ }}>{zh ? '+ 粘贴' : '+ Paste'}</Chip>
          <Chip active={showLink} onClick={() => setShowLink(v => !v)}>{zh ? '链接' : 'Link'}</Chip>
        </>
      )
    }
    if (data.kind === 'knowledgeCard') {
      return <Chip onClick={() => runNode(id)} disabled={busy}>{zh ? '再提炼' : 'Re-refine'}</Chip>
    }
    if (data.kind === 'asset') {
      return (
        <>
          <Chip onClick={() => fileRef.current?.click()}>{zh ? '+ 上传' : '+ Upload'}</Chip>
          {(data.fileName || data.previewUrl) && (
            <Chip onClick={() => patchNode(id, { previewUrl: undefined, fileName: undefined, mimeType: undefined })}>
              {zh ? '清除' : 'Clear'}
            </Chip>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.pdf,.txt,.md" hidden onChange={e => { void onFile(e) }} />
        </>
      )
    }
    if (data.kind === 'marketing') {
      return (
        <>
          <Chip muted>{zh ? '用上游知识' : 'Uses upstream'}</Chip>
          <Chip active={assetMatchOpen} onClick={() => setAssetMatchOpen(v => !v)}>
            {zh ? '匹配素材' : 'Match assets'}
          </Chip>
          {data.angles && data.angles.length > 0 && (
            <Chip onClick={() => {
              const text = data.body || data.angles!.map((a, i) =>
                `Angle ${i + 1}\nHeadline: ${a.headline}\nBody: ${a.body}\nCTA: ${a.cta}`
              ).join('\n\n')
              void navigator.clipboard?.writeText(text)
            }}>
              {zh ? '复制成稿' : 'Copy draft'}
            </Chip>
          )}
        </>
      )
    }
    if (data.kind === 'repurpose') {
      return (
        <>
          <Chip active={repurposeTab === 'source'} onClick={() => setRepurposeTab('source')}>
            {zh ? '源内容' : 'Source'}
          </Chip>
          {PLATFORM_ORDER.map(p => (
            <Chip key={p} active={repurposeTab === p} onClick={() => setRepurposeTab(p)} title={p === 'twitter' ? 'X' : p}>
              <PlatformIcon platform={p} size={14} />
            </Chip>
          ))}
          {platformsReady && (
            <Chip onClick={() => suggestScheduleFromRepurpose(id)}>
              {zh ? '建议排期' : 'Suggest schedule'}
            </Chip>
          )}
        </>
      )
    }
    return null
  })()

  const placeholder = (() => {
    switch (data.kind) {
      case 'knowledgeSource':
        return zh ? '粘贴品牌设定、文档摘录…' : 'Paste brand brief, document excerpt…'
      case 'knowledgeCard':
        return zh ? '校对 / 编辑品牌知识…' : 'Edit brand knowledge…'
      case 'asset':
        return zh ? '素材说明 / 希望分析的重点…' : 'Asset notes / what to analyze…'
      case 'marketing':
        return zh ? '写 brief 或补充角度；主要吃上游知识/素材' : 'Write a brief; mainly uses upstream knowledge/assets'
      case 'repurpose':
        return repurposeTab === 'source'
          ? (zh ? '源内容（或连上游成稿）…' : 'Source content (or wire upstream)…')
          : (zh ? `${repurposeTab} 成稿…` : `${repurposeTab} draft…`)
      default:
        return ''
    }
  })()

  const inputValue = (() => {
    if (data.kind === 'repurpose' && repurposeTab !== 'source') {
      return data.platforms?.[repurposeTab] ?? ''
    }
    if (data.kind === 'marketing' && data.angles?.length) {
      const a = data.angles[Math.min(angleTab, data.angles.length - 1)]
      return `Headline: ${a.headline}\nBody: ${a.body}\nCTA: ${a.cta}`
    }
    return data.body
  })()

  const onInputChange = (value: string) => {
    if (data.kind === 'repurpose' && repurposeTab !== 'source') {
      patchNode(id, { platforms: { ...data.platforms, [repurposeTab]: value } })
      return
    }
    if (data.kind === 'marketing' && data.angles?.length) {
      const idx = Math.min(angleTab, data.angles.length - 1)
      const headline = value.match(/(?:Headline|标题)\s*[:：]\s*(.+)/i)?.[1]?.trim()
        || data.angles[idx].headline
      const body = value.match(/(?:Body|正文|文案)\s*[:：]\s*(.+)/i)?.[1]?.trim()
        || data.angles[idx].body
      const cta = value.match(/(?:CTA|行动号召|号召)\s*[:：]\s*(.+)/i)?.[1]?.trim()
        || data.angles[idx].cta
      const next = data.angles.map((a, i) => (i === idx ? { headline, body, cta } : a))
      const plain = next.map((a, i) => (
        `Angle ${i + 1}\nHeadline: ${a.headline}\nBody: ${a.body}\nCTA: ${a.cta}`
      )).join('\n\n')
      patchNode(id, { angles: next, body: plain })
      return
    }
    patchNode(id, { body: value, angles: data.kind === 'marketing' ? undefined : data.angles })
  }

  return (
    <LongShell width={agentDockWidth(data.kind)} onClose={closeDock} zh={zh} shellRef={shellRef}>
      {topChips && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {topChips}
        </div>
      )}

      {data.kind === 'repurpose' && repSrc && (repSrc.preview || repSrc.hasUpstream) && (
        <div style={{
          marginBottom: 8, padding: '7px 9px', borderRadius: 8,
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)',
          fontSize: 11, color: 'rgba(191,219,254,0.9)', lineHeight: 1.45,
        }}>
          <div style={{ fontWeight: 650, marginBottom: 3, fontSize: 10, letterSpacing: '0.03em', opacity: 0.85 }}>
            {repSrc.hasUpstream
              ? (zh ? '本次将复用 · 上游成稿' : 'This run · upstream draft')
              : (zh ? '本次将复用 · 节点源内容' : 'This run · node source')}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.62)' }}>
            {repSrc.preview || (zh ? '（上游已连接）' : '(upstream connected)')}
            {repSrc.preview.length >= 140 ? '…' : ''}
          </div>
        </div>
      )}

      {data.kind === 'asset' && (data.tags?.length || data.platformsSuggested?.length || data.summary || data.status === 'done') && (
        <div style={{
          marginBottom: 8, padding: '6px 8px', borderRadius: 8,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45,
        }}>
          {data.summary ? (
            <div style={{ color: 'rgba(255,255,255,0.78)', marginBottom: 6 }}>{data.summary}</div>
          ) : null}
          {data.tags && data.tags.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
              {data.tags.map(t => (
                <span key={t} style={{
                  padding: '2px 7px', borderRadius: 6, fontSize: 10,
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)',
                }}>{t}</span>
              ))}
            </div>
          ) : null}
          {data.platformsSuggested && data.platformsSuggested.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
              {data.platformsSuggested.map(p => (
                <span key={p} style={{
                  padding: '2px 7px', borderRadius: 6, fontSize: 10,
                  background: 'rgba(59,130,246,0.15)', color: 'rgba(147,197,253,0.95)',
                }}>{p}</span>
              ))}
            </div>
          ) : null}
          <div style={{ opacity: 0.7 }}>
            {data.disclaimer
              || (zh
                ? '识别为元数据+描述驱动（非逐帧看片）。标签/平台建议在上方，不写入正文。'
                : 'Metadata+description driven (not frame-level). Tags/platforms above — not in body.')}
          </div>
        </div>
      )}

      {data.kind === 'marketing' && data.angles && data.angles.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {data.angles.map((_, i) => (
            <Chip key={i} active={angleTab === i} onClick={() => setAngleTab(i)}>
              {zh ? `角度 ${i + 1}` : `Angle ${i + 1}`}
            </Chip>
          ))}
        </div>
      )}

      {Boolean(data.advice) && (
        <div style={{ marginBottom: 8 }}>
          <Chip active={adviceOpen} onClick={() => setAdviceOpen(v => !v)}>
            {zh ? (adviceOpen ? '收起建议' : '查看建议') : (adviceOpen ? 'Hide advice' : 'Show advice')}
          </Chip>
          {adviceOpen && (
            <div style={{
              marginTop: 6, padding: '8px 10px', borderRadius: 8, fontSize: 11, lineHeight: 1.45,
              color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {String(data.advice)}
            </div>
          )}
        </div>
      )}

      {data.kind === 'marketing' && assetMatchOpen && (
        <div style={{
          marginBottom: 10, padding: '8px 10px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
            {zh
              ? '按 tags / 文案重合排序（本地匹配，非编造）。点选连到本营销节点。'
              : 'Ranked by tags / text overlap (local match). Click to wire as upstream.'}
          </div>
          {assetSuggestions.length === 0 ? (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {zh ? '暂无可用素材（先上传并分析打标）' : 'No assets yet — upload & analyze first'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {assetSuggestions.map(s => (
                <button
                  key={s.assetId}
                  type="button"
                  className="nodrag"
                  onClick={() => {
                    connectAssetToMarketing(s.assetId, id)
                    setAssetMatchOpen(false)
                  }}
                  style={{
                    textAlign: 'left', padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
                    color: '#e5e5e5', fontSize: 11,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{s.title}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
                    {s.reasons.slice(0, 2).join(' · ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {data.kind === 'knowledgeSource' && showLink && (
        <input
          className="nodrag"
          value={(data.sourceUrl as string) || ''}
          onChange={e => patchNode(id, { sourceUrl: e.target.value })}
          placeholder={zh ? '来源链接…' : 'Source URL…'}
          style={{ ...ghostInput, width: '100%', marginBottom: 8 }}
        />
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        {data.kind === 'asset' && data.previewUrl && data.mimeType?.startsWith('image/') && (
          <div style={{
            height: 72, width: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <ImeTextarea
          className="nodrag nowheel"
          value={inputValue}
          onValueChange={onInputChange}
          rows={data.kind === 'repurpose' ? 3 : 4}
          placeholder={placeholder}
          style={{ ...inputArea, marginBottom: 0, flex: 1 }}
        />
      </div>

      <FooterBar>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="nodrag"
            onClick={() => setAgentOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
              borderRadius: 10, border: 'none',
              background: agentOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <MindsLogo size={22} />
            <span>Minds</span>
            <span style={{ opacity: 0.45, fontSize: 10 }}>{agentOpen ? '▴' : '▾'}</span>
          </button>

          {agentOpen && (
            <div style={{
              position: 'absolute', left: 0, bottom: 'calc(100% + 8px)', width: 300,
              borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(28,28,28,0.98)', boxShadow: '0 16px 48px rgba(0,0,0,0.65)',
              padding: 6, zIndex: 50,
            }}>
              <button
                type="button"
                className="nodrag"
                onClick={() => setAgentOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <MindsLogo size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Minds</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 1.35 }}>
                    {zh ? '内容创作 Agent（知识 / 营销 / 复用）' : 'Creator Agent (knowledge / marketing / reuse)'}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{zh ? '已选' : 'On'}</span>
              </button>
            </div>
          )}
        </div>

        <div style={{
          flex: 1, minWidth: 0, fontSize: 11, color: 'rgba(255,255,255,0.38)',
          overflow: 'hidden', padding: '0 8px',
          display: 'flex', alignItems: 'center',
        }}>
          {busy ? (
            <AgentLoading
              label={typeof data.waitHint === 'string' && data.waitHint
                ? data.waitHint.slice(0, 28)
                : (zh ? '运行中' : 'Running')}
              variant="Drive"
              compact
            />
          ) : midHint}
        </div>

        {runnable && (
          <button
            type="button"
            className="nodrag"
            title={zh ? '运行' : 'Run'}
            disabled={busy || (data.kind === 'marketing' && !!mktGate && !mktGate.ok)}
            onClick={() => runNode(id)}
            style={{
              width: 40, height: 40, borderRadius: 999, border: 'none', flexShrink: 0,
              background: busy || (data.kind === 'marketing' && !!mktGate && !mktGate.ok) ? '#333' : 'rgba(255,255,255,0.92)',
              color: busy || (data.kind === 'marketing' && !!mktGate && !mktGate.ok) ? '#888' : '#111',
              cursor: busy || (data.kind === 'marketing' && !!mktGate && !mktGate.ok) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
            }}
          >
            {busy ? (
              <AgentLoading label="" variant="Dots" showTimer={false} compact />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}
      </FooterBar>
    </LongShell>
  )
}

function LongShell({
  width, children, onClose, zh, shellRef, closeInHeader = false,
}: {
  width: number
  children: ReactNode
  onClose: () => void
  zh: boolean
  shellRef: RefObject<HTMLDivElement | null>
  /** Note: reserve a top row so × does not overlap the textarea */
  closeInHeader?: boolean
}) {
  const closeBtn = (
    <button
      type="button"
      className="nodrag"
      onClick={onClose}
      title={zh ? '关闭功能区' : 'Close panel'}
      style={{
        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
        border: 'none', background: 'transparent',
        color: S.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1,
        ...(closeInHeader ? {} : { position: 'absolute' as const, top: 8, right: 8, zIndex: 2 }),
      }}
    >×</button>
  )

  return (
    <div
      ref={shellRef}
      style={{
        ...shellStyle,
        width,
        padding: '12px 14px 10px',
        position: 'relative',
      }}
      className="nodrag nopan nowheel"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {closeInHeader ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          marginBottom: 6, minHeight: 24,
        }}>
          {closeBtn}
        </div>
      ) : closeBtn}
      {children}
    </div>
  )
}

function FooterBar({ children }: { children: ReactNode }) {
  return (
    <div style={{
      marginTop: 8, paddingTop: 8,
      display: 'flex', alignItems: 'center', gap: 8, minHeight: 44,
    }}>
      {children}
    </div>
  )
}

function Chip({
  children, onClick, active, muted, disabled, title,
}: {
  children: ReactNode
  onClick?: () => void
  active?: boolean
  muted?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      className="nodrag"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...chipStyle(active, muted),
        borderRadius: 999,
        cursor: disabled ? 'not-allowed' : (onClick ? 'pointer' : 'default'),
        opacity: disabled ? 0.5 : 1,
      }}
    >{children}</button>
  )
}

function ScheduleRow({ zh, data, onChange, draftNodes }: {
  zh: boolean
  data: CanvasNodeData
  onChange: (slots: NonNullable<CanvasNodeData['slots']>) => void
  draftNodes: DraftRef[]
}) {
  const slots = data.slots ?? []
  const [step, setStep] = useState<1 | 2>(1)
  const [contentNodeId, setContentNodeId] = useState('')
  const [at, setAt] = useState('')
  const [label, setLabel] = useState(zh ? '发布锚点' : 'Publish anchor')

  const selectedDraft = draftNodes.find(n => n.id === contentNodeId)

  const addSlot = () => {
    if (!at || !contentNodeId) return
    onChange([...slots, {
      at,
      label: label || (zh ? '发布锚点' : 'Publish anchor'),
      contentNodeId,
    }])
    setAt('')
    setContentNodeId('')
    setLabel(zh ? '发布锚点' : 'Publish anchor')
    setStep(1)
  }

  return (
    <div>
      <p style={{ margin: '0 0 10px', fontSize: 11, lineHeight: 1.5, color: S.muted }}>
        {zh
          ? '排期板：把营销/复用成稿挂到具体时间。本版只排不发，导出内容包可见。'
          : 'Schedule board: pin marketing/repurpose drafts to times. Schedule only — visible in export.'}
      </p>

      {slots.length > 0 && (
        <div style={{ marginBottom: 12, maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slots.map((s, i) => {
            const draft = draftNodes.find(d => d.id === s.contentNodeId)
            return (
              <div
                key={`${s.at}-${i}`}
                style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  padding: '8px 10px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 650 }}>{s.at.replace('T', ' ')}</div>
                  <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>
                    {s.label}
                    {' · '}
                    {draft?.title || (zh ? '成稿已移除' : 'draft missing')}
                  </div>
                </div>
                <button
                  type="button"
                  className="nodrag"
                  onClick={() => onChange(slots.filter((_, j) => j !== i))}
                  style={{ border: 'none', background: 'transparent', color: S.faint, cursor: 'pointer', fontSize: 14 }}
                >×</button>
              </div>
            )
          })}
        </div>
      )}

      <div style={{
        borderRadius: 12, padding: 10,
        background: S.wellBg, boxShadow: S.wellInset,
      }}>
        <div style={{ fontSize: 11, fontWeight: 650, marginBottom: 8, color: 'rgba(255,255,255,0.75)' }}>
          {step === 1
            ? (zh ? '① 选择要挂的成稿' : '① Pick a draft')
            : (zh ? '② 选择时间并加入' : '② Pick time & add')}
        </div>

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {draftNodes.length === 0 && (
              <div style={{ fontSize: 11, color: S.faint, lineHeight: 1.45 }}>
                {zh
                  ? '画布上还没有营销/复用/笔记成稿。先生成一篇，再回来挂锚点。'
                  : 'No marketing/repurpose/note drafts yet. Generate one, then come back.'}
              </div>
            )}
            {draftNodes.map(n => (
              <button
                key={n.id}
                type="button"
                className="nodrag"
                onClick={() => { setContentNodeId(n.id); setStep(2) }}
                style={{
                  textAlign: 'left', padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                  border: contentNodeId === n.id ? '1px solid rgba(59,130,246,0.45)' : '1px solid transparent',
                  background: contentNodeId === n.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                  color: '#fff', fontSize: 12,
                }}
              >{n.title || n.id}</button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: S.muted }}>
              {zh ? '成稿：' : 'Draft: '}
              <span style={{ color: '#fff', fontWeight: 600 }}>{selectedDraft?.title}</span>
              <button
                type="button"
                className="nodrag"
                onClick={() => setStep(1)}
                style={{ marginLeft: 8, border: 'none', background: 'none', color: '#93c5fd', cursor: 'pointer', fontSize: 11 }}
              >{zh ? '重选' : 'Change'}</button>
            </div>
            <input
              type="datetime-local"
              className="nodrag"
              value={at}
              onChange={e => setAt(e.target.value)}
              style={{ ...ghostInput, width: '100%' }}
            />
            <ImeInput
              className="nodrag"
              value={label}
              onValueChange={setLabel}
              placeholder={zh ? '标签（可选）' : 'Label (optional)'}
              style={{ ...ghostInput, width: '100%' }}
            />
            <button
              type="button"
              className="nodrag"
              disabled={!at}
              onClick={addSlot}
              style={{ ...primaryPill, opacity: at ? 1 : 0.45, cursor: at ? 'pointer' : 'not-allowed' }}
            >{zh ? '加入时间锚' : 'Add time anchor'}</button>
          </div>
        )}
      </div>
    </div>
  )
}

const inputArea: CSSProperties = {
  ...wellStyle,
  minHeight: 72, padding: '10px 12px',
  fontSize: 13, lineHeight: 1.5, resize: 'vertical',
}

const ghostInput: CSSProperties = {
  ...wellStyle,
  width: 'auto', padding: '7px 10px',
  fontSize: 12,
}

const primaryPill: CSSProperties = {
  padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
  background: S.sendBg, color: S.sendFg, fontWeight: 700, fontSize: 12, flexShrink: 0,
}
