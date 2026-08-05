'use client'
import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState, Handle, Position, useReactFlow,
  type Node, type Edge, type NodeProps, type Connection, type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMingStore } from '@/lib/store'
import type { Asset } from '@/lib/store'
import type { PlatformId } from '@/lib/brand'

const C = {
  bg: '#f2f3f7', bg1: '#ffffff', bg2: '#f7f8fa', bg3: '#eef0f4',
  ink: '#0f1117', ink2: '#2d3142', ink3: '#5c6070', ink4: '#9ea3b0',
  accent: '#3b82f6', green: '#10b981', orange: '#f59e0b', purple: '#8b5cf6',
  border: 'rgba(15,17,23,0.07)', borderS: 'rgba(15,17,23,0.12)',
  shadow: '0 1px 2px rgba(15,17,23,0.05),0 4px 16px rgba(15,17,23,0.05)',
  shadowM: '0 2px 8px rgba(15,17,23,0.07),0 8px 28px rgba(15,17,23,0.07)',
}
const SANS = "'Inter',-apple-system,sans-serif"
const MONO = "'Space Mono',monospace"

const PLAT_COLOR: Record<string, string> = {
  youtube: '#ff0000', YouTube: '#ff0000',
  instagram: '#e1306c', Instagram: '#e1306c',
  tiktok: '#111827', TikTok: '#111827',
  twitter: '#000000', X: '#000000',
}

const VALID_PLATFORMS: PlatformId[] = ['youtube', 'instagram', 'tiktok', 'twitter']

type AssetNodeData = {
  asset: Asset
  zh: boolean
  onAnalyze: (asset: Asset, description: string) => void
  onWorkshop: (asset: Asset) => void
  onDraft: (asset: Asset) => void
  onRemove: (id: string) => void
}
type AssetFlowNode = Node<AssetNodeData, 'asset'>

/* ── Custom canvas node: one asset card ── */
function AssetNode({ data, selected }: NodeProps<AssetFlowNode>) {
  const { asset, zh, onAnalyze, onWorkshop, onDraft, onRemove } = data
  const [desc, setDesc] = useState(asset.description ?? '')
  const analyzed = !asset.analyzing && (asset.tags.length > 0 || !!asset.pipAnalysis)

  return (
    <div style={{
      width: 240, borderRadius: 12, background: C.bg1,
      border: `1.5px solid ${selected ? C.accent : C.borderS}`,
      boxShadow: selected ? C.shadowM : C.shadow,
      overflow: 'hidden', fontFamily: SANS,
    }}>
      <Handle type="target" position={Position.Left} style={{ width: 8, height: 8, background: C.accent, border: '2px solid #fff' }} />
      <Handle type="source" position={Position.Right} style={{ width: 8, height: 8, background: C.accent, border: '2px solid #fff' }} />

      {/* Preview */}
      <div style={{ position: 'relative', width: '100%', height: 120, background: C.bg3, overflow: 'hidden' }}>
        {asset.type === 'image' && asset.previewUrl ? (
          <img src={asset.previewUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : asset.type === 'video' && asset.previewUrl ? (
          <>
            <video src={asset.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 99, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" fill={C.ink} viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              </div>
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" fill="none" stroke={C.ink4} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
          </div>
        )}

        {asset.analyzing && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,17,23,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: MONO, fontSize: 8, color: '#fff' }}>{zh ? 'Pip 解析中…' : 'Pip analyzing…'}</span>
          </div>
        )}

        {!asset.analyzing && (
          <button className="nodrag" onClick={() => onRemove(asset.id)} style={{
            position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 99,
            background: 'rgba(15,17,23,0.65)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.85,
          }}>
            <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '9px 11px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {asset.name}
        </div>

        {/* Description + analyze (before first analysis) */}
        {!asset.analyzing && !analyzed && (
          <div className="nodrag" style={{ marginBottom: 8 }}>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder={zh ? '一句话描述这个素材…' : 'Describe this asset in one line…'}
              rows={2}
              style={{
                width: '100%', border: `1px solid ${C.borderS}`, borderRadius: 7, padding: '6px 8px',
                fontFamily: SANS, fontSize: 11, color: C.ink2, lineHeight: 1.5, resize: 'none',
                outline: 'none', background: C.bg2, boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => onAnalyze(asset, desc)}
              style={{
                width: '100%', marginTop: 6, padding: '6px 0', borderRadius: 7, border: 'none',
                background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff',
                fontFamily: SANS, fontWeight: 600, fontSize: 11, cursor: 'pointer',
              }}
            >
              {zh ? '让 Pip 分析打标签' : 'Analyze with Pip'}
            </button>
          </div>
        )}

        {/* Tags */}
        {analyzed && asset.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {asset.tags.map(tag => (
              <span key={tag} style={{
                fontFamily: MONO, fontSize: 8, padding: '2px 6px', borderRadius: 99,
                background: `${PLAT_COLOR[tag] ?? C.ink3}14`,
                color: PLAT_COLOR[tag] ?? C.ink3,
                border: `1px solid ${PLAT_COLOR[tag] ?? C.ink3}28`,
                whiteSpace: 'nowrap',
              }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Pip analysis */}
        {analyzed && asset.pipAnalysis && (
          <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 7, padding: '6px 8px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }} />
              <span style={{ fontFamily: MONO, fontSize: 8, color: C.accent }}>Pip</span>
            </div>
            <p style={{ fontSize: 10, color: C.ink3, margin: 0, lineHeight: 1.55 }}>{asset.pipAnalysis}</p>
          </div>
        )}

        {/* Flow actions */}
        {!asset.analyzing && (
          <div className="nodrag" style={{ display: 'flex', gap: 5 }}>
            <button
              onClick={() => onWorkshop(asset)}
              title={zh ? '以此为素材去工坊生成内容' : 'Create content from this asset in Workshop'}
              style={{
                flex: 1, padding: '5px 0', borderRadius: 6, border: `1px solid ${C.accent}40`,
                background: 'rgba(59,130,246,0.06)', color: C.accent,
                fontFamily: MONO, fontSize: 9, cursor: 'pointer',
              }}
            >
              {zh ? '→ 工坊' : '→ Workshop'}
            </button>
            <button
              onClick={() => onDraft(asset)}
              title={zh ? '直接生成一条平台草稿' : 'Create a platform draft directly'}
              style={{
                flex: 1, padding: '5px 0', borderRadius: 6, border: `1px solid ${C.borderS}`,
                background: '#fff', color: C.ink3,
                fontFamily: MONO, fontSize: 9, cursor: 'pointer',
              }}
            >
              {zh ? '→ 草稿' : '→ Draft'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const nodeTypes = { asset: AssetNode }

/* ── Canvas ── */
function AssetsCanvas() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const {
    assets, addAsset, updateAsset, removeAsset,
    assetEdges, setAssetEdges, addPost, projects, lang,
  } = useMingStore()
  const zh = lang === 'zh'
  const { screenToFlowPosition } = useReactFlow()

  const project = projects.find(p => p.id === projectId)
  const projectAssets = assets.filter(a => a.projectId === projectId)

  const [nodes, setNodes, onNodesChange] = useNodesState<AssetFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  /* ── node actions ── */
  const handleRemove = useCallback((id: string) => {
    removeAsset(id)
    setEdges(eds => {
      const next = eds.filter(e => e.source !== id && e.target !== id)
      setAssetEdges(projectId, next.map(e => ({ id: e.id, source: e.source, target: e.target })))
      return next
    })
  }, [removeAsset, projectId, setAssetEdges, setEdges])

  const handleAnalyze = useCallback(async (asset: Asset, description: string) => {
    const alias = project?.brand.mindsConversationAlias
    updateAsset(asset.id, { analyzing: true, description })
    if (!alias) {
      updateAsset(asset.id, { analyzing: false, pipAnalysis: zh ? '未连接 Pip — 请先完成创作者设置' : 'Pip is not connected — finish creator setup first' })
      return
    }
    try {
      const res = await fetch('/api/minds/analyze-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias,
          name: asset.name,
          type: asset.type,
          description,
          profile: project?.brand,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'analysis failed')
      updateAsset(asset.id, {
        analyzing: false,
        tags: data.tags ?? [],
        pipAnalysis: data.analysis ?? '',
        platforms: data.platforms ?? [],
      })
    } catch (e) {
      updateAsset(asset.id, {
        analyzing: false,
        pipAnalysis: `${zh ? '分析失败' : 'Analysis failed'}: ${e instanceof Error ? e.message : 'unknown error'}`,
      })
    }
  }, [project, updateAsset, zh])

  const handleWorkshop = useCallback((asset: Asset) => {
    const seed = asset.description
      || [asset.name, asset.pipAnalysis].filter(Boolean).join(' — ')
    router.push(`/app/${projectId}/workshop?prefill=${encodeURIComponent(seed)}`)
  }, [router, projectId])

  const handleDraft = useCallback((asset: Asset) => {
    const platform = VALID_PLATFORMS.includes(asset.platforms[0] as PlatformId)
      ? (asset.platforms[0] as PlatformId)
      : 'instagram'
    const content = asset.description
      || `${asset.name}${asset.pipAnalysis ? `\n\n${asset.pipAnalysis}` : ''}`
    addPost(projectId, {
      id: `post-${Date.now()}-${asset.id.slice(-6)}`,
      projectId,
      platform,
      title: asset.name.slice(0, 80),
      content,
      hashtags: asset.tags.filter(t => !PLAT_COLOR[t]),
      status: 'draft',
      createdAt: new Date().toISOString(),
    })
  }, [addPost, projectId])

  /* ── sync store assets → canvas nodes ── */
  useEffect(() => {
    setNodes(prev => {
      const prevMap = new Map(prev.map(n => [n.id, n]))
      return projectAssets.map((a, i) => {
        const existing = prevMap.get(a.id)
        return {
          id: a.id,
          type: 'asset' as const,
          position: existing?.position ?? {
            x: a.x ?? 60 + (i % 3) * 290,
            y: a.y ?? 40 + Math.floor(i / 3) * 320,
          },
          data: {
            asset: a, zh,
            onAnalyze: handleAnalyze,
            onWorkshop: handleWorkshop,
            onDraft: handleDraft,
            onRemove: handleRemove,
          },
        }
      })
    })
  }, [projectAssets, zh, handleAnalyze, handleWorkshop, handleDraft, handleRemove, setNodes])

  /* ── sync store edges → canvas edges ── */
  useEffect(() => {
    setEdges((assetEdges[projectId] ?? []).map(e => ({
      ...e, animated: true,
      style: { stroke: C.accent, strokeWidth: 1.5 },
    })))
  }, [assetEdges, projectId, setEdges])

  const onConnect = useCallback((conn: Connection) => {
    setEdges(eds => {
      const next = addEdge({ ...conn, animated: true, style: { stroke: C.accent, strokeWidth: 1.5 } }, eds)
      setAssetEdges(projectId, next.map(e => ({ id: e.id, source: e.source, target: e.target })))
      return next
    })
  }, [projectId, setAssetEdges, setEdges])

  const handleNodesChange = useCallback((changes: NodeChange<AssetFlowNode>[]) => {
    onNodesChange(changes)
    // persist final positions when a drag ends
    changes.forEach(ch => {
      if (ch.type === 'position' && ch.dragging === false && ch.position) {
        updateAsset(ch.id, { x: ch.position.x, y: ch.position.y })
      }
    })
  }, [onNodesChange, updateAsset])

  /* ── upload ── */
  const addFiles = useCallback((files: File[]) => {
    files.forEach((file, idx) => {
      const type: Asset['type'] = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'text'
      const id = `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const center = screenToFlowPosition({
        x: window.innerWidth / 2 + (idx % 3) * 40 - 40,
        y: window.innerHeight / 2 + (idx % 3) * 40 - 40,
      })

      const commit = (previewUrl: string) => {
        addAsset({
          id, projectId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          type, previewUrl,
          tags: [], pipAnalysis: '', platforms: [],
          createdAt: new Date().toISOString(),
          analyzing: false,
          x: center.x - 120, y: center.y - 80,
        })
      }

      // Images ≤ 2.5MB are stored as data URLs so they survive page reloads;
      // larger files / videos use session blob URLs
      if (type === 'image' && file.size <= 2.5 * 1024 * 1024) {
        const reader = new FileReader()
        reader.onload = () => commit(reader.result as string)
        reader.readAsDataURL(file)
      } else {
        commit(URL.createObjectURL(file))
      }
    })
  }, [projectId, addAsset, screenToFlowPosition])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: addFiles,
    accept: { 'image/*': [], 'video/*': [] },
    noClick: true,
    noKeyboard: true,
  })

  const addTextNote = useCallback(() => {
    const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    addAsset({
      id: `asset-${Date.now()}-note`,
      projectId,
      name: zh ? `灵感便签 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : `Idea note ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      type: 'text', previewUrl: '',
      tags: [], pipAnalysis: '', platforms: [],
      createdAt: new Date().toISOString(),
      analyzing: false,
      x: center.x - 120, y: center.y - 80,
    })
  }, [projectId, addAsset, screenToFlowPosition, zh])

  const stats = {
    total: projectAssets.length,
    images: projectAssets.filter(a => a.type === 'image').length,
    videos: projectAssets.filter(a => a.type === 'video').length,
    analyzed: projectAssets.filter(a => !a.analyzing && (a.tags.length > 0 || a.pipAnalysis)).length,
  }

  return (
    <div {...getRootProps()} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: SANS, outline: 'none' }}>
      <input {...getInputProps()} />
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Header */}
      <div style={{ background: C.bg1, borderBottom: `1px solid ${C.border}`, padding: '12px 20px', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 17, color: C.ink, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
              {zh ? '素材画布' : 'Asset Canvas'}
            </h1>
            <p style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, margin: 0 }}>
              {zh ? '拖入素材 · Pip 打标签 · 连线分组 · 一键流向创作' : 'Drop assets · Pip tags them · connect to group · flow into content'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[
              { n: stats.total, label: zh ? '素材' : 'Assets', c: C.accent },
              { n: stats.images, label: zh ? '图片' : 'Images', c: C.purple },
              { n: stats.videos, label: zh ? '视频' : 'Videos', c: C.orange },
              { n: stats.analyzed, label: zh ? '已分析' : 'Tagged', c: C.green },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '4px 10px', borderRadius: 8, background: `${s.c}10`, border: `1px solid ${s.c}22` }}>
                <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 8, color: s.c, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}

            <button onClick={addTextNote} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 13px', borderRadius: 9,
              background: '#fff', border: `1px solid ${C.borderS}`,
              color: C.ink2, cursor: 'pointer', fontWeight: 600, fontSize: 12,
            }}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              {zh ? '便签' : 'Note'}
            </button>

            <button onClick={open} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 9, border: 'none',
              background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
              color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12,
              boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
            }}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
              {zh ? '上传素材' : 'Upload'}
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: false }}
        >
          <Background gap={22} size={1.5} color="rgba(15,17,23,0.08)" />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable style={{ width: 120, height: 80 }} />
        </ReactFlow>

        {/* Drop overlay */}
        {isDragActive && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: 'rgba(59,130,246,0.08)',
            border: `2px dashed ${C.accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: C.accent }}>{zh ? '松开以上传素材' : 'Drop to upload assets'}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.ink3, marginTop: 4 }}>{zh ? '素材将落在画布中央，随后可让 Pip 分析' : 'Assets land on the canvas — then let Pip analyze them'}</div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {projectAssets.length === 0 && !isDragActive && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 5,
          }}>
            <div style={{
              border: `2px dashed ${C.borderS}`, borderRadius: 16,
              padding: '44px 48px', textAlign: 'center', background: C.bg1,
              pointerEvents: 'auto',
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="22" height="22" fill="none" stroke={C.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 6 }}>
                {zh ? '把图片或视频拖到画布上' : 'Drag images or videos onto the canvas'}
              </div>
              <div style={{ fontSize: 12, color: C.ink4, lineHeight: 1.7, maxWidth: 340 }}>
                {zh
                  ? '每个素材都是画布上的一个节点。写一句描述，让 Pip 分析打标签；连线分组素材；然后一键送去工坊生成四平台内容。'
                  : 'Every asset is a node on this canvas. Add a one-line description, let Pip tag it, connect nodes to group them, then send them to the Workshop to generate content for four platforms.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AssetsPage() {
  return (
    <ReactFlowProvider>
      <AssetsCanvas />
    </ReactFlowProvider>
  )
}
