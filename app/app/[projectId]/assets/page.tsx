'use client'
import { useCallback, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { useMingStore } from '@/lib/store'
import type { Asset } from '@/lib/store'

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

const PLATFORM_TAGS: Record<string, string[]> = {
  youtube: ['YouTube'],
  instagram: ['Instagram'],
  tiktok: ['TikTok'],
  twitter: ['X'],
}

const PIP_ANALYSES = [
  { tags: ['高互动潜力', '教程类', 'YouTube', 'TikTok'], analysis: '素材风格清晰、步骤感强，适合教程类内容。YouTube 长视频和 TikTok 短片均可复用。', platforms: ['youtube', 'tiktok'] },
  { tags: ['品牌调性', '视觉吸引', 'Instagram', 'TikTok'], analysis: '视觉构图优质，色调统一，强烈推荐用于 Instagram 图文帖和 TikTok 封面。', platforms: ['instagram', 'tiktok'] },
  { tags: ['产品展示', '电商风格', 'Instagram', 'YouTube'], analysis: '产品细节突出，光线处理专业。适合 Instagram 产品贴和 YouTube 开箱视频片段。', platforms: ['instagram', 'youtube'] },
  { tags: ['生活方式', 'Vlog', 'YouTube', 'Instagram'], analysis: '氛围感强，生活化场景能引发受众共鸣。建议用于 Vlog 系列和 Instagram 故事。', platforms: ['youtube', 'instagram'] },
  { tags: ['幽默风格', '病毒传播', 'TikTok', 'X'], analysis: '内容节奏感强，具备病毒传播潜力。最适合 TikTok 和 X 平台的高频互动内容。', platforms: ['tiktok', 'twitter'] },
]

function TagChip({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 9, padding: '2px 7px', borderRadius: 99,
      background: color ? `${color}18` : C.bg3,
      color: color ?? C.ink3,
      border: `1px solid ${color ? `${color}30` : C.border}`,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function AssetCard({ asset, onRemove, lang }: { asset: Asset; onRemove: () => void; lang: string }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 12, background: C.bg1, border: `1px solid ${C.borderS}`,
        boxShadow: hover ? C.shadowM : C.shadow,
        overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s',
        transform: hover ? 'translateY(-2px)' : 'none',
        cursor: 'default',
      }}
    >
      {/* Preview */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '66%', background: C.bg3, overflow: 'hidden' }}>
        {asset.type === 'image' ? (
          <img
            src={asset.previewUrl}
            alt={asset.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : asset.type === 'video' ? (
          <>
            <video
              src={asset.previewUrl}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              muted
            />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" fill={C.ink} viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" fill="none" stroke={C.ink4} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
        )}

        {asset.analyzing && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,17,23,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: '#fff' }}>{lang === 'zh' ? 'Pip 解析中…' : 'Pip analyzing…'}</span>
          </div>
        )}

        {/* Remove button */}
        {hover && !asset.analyzing && (
          <button onClick={onRemove} style={{
            position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 99,
            background: 'rgba(15,17,23,0.7)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {asset.name}
        </div>

        {!asset.analyzing && asset.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {asset.tags.map(tag => (
              <TagChip key={tag} label={tag} color={
                tag === 'YouTube' ? '#ff0000' :
                tag === 'Instagram' ? '#e1306c' :
                tag === 'TikTok' ? '#111827' :
                tag === 'X' ? '#000000' :
                tag === '高互动潜力' || tag === '病毒传播' ? C.green :
                undefined
              } />
            ))}
          </div>
        )}

        {!asset.analyzing && asset.pipAnalysis && (
          <div style={{ background: 'rgba(59,130,246,0.04)', border: `1px solid rgba(59,130,246,0.1)`, borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="6" height="6" fill="#fff" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 8, color: C.accent }}>Pip</span>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 11, color: C.ink3, margin: 0, lineHeight: 1.6 }}>{asset.pipAnalysis}</p>
          </div>
        )}

        {asset.analyzing && (
          <div style={{ height: 60, background: C.bg3, borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
        )}
      </div>
    </div>
  )
}

export default function AssetsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { assets, addAsset, updateAsset, removeAsset, lang } = useMingStore()
  const zh = lang === 'zh'
  const objectUrls = useRef<Set<string>>(new Set())

  const projectAssets = assets.filter(a => a.projectId === projectId)

  const onDrop = useCallback((files: File[]) => {
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      objectUrls.current.add(url)
      const type: Asset['type'] = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'text'
      const id = `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const asset: Asset = {
        id, projectId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type, previewUrl: url,
        tags: [], pipAnalysis: '', platforms: [],
        createdAt: new Date().toISOString(),
        analyzing: true,
      }
      addAsset(asset)

      // Simulate Pip analysis (1.5–2.5s)
      setTimeout(() => {
        const pick = PIP_ANALYSES[Math.floor(Math.random() * PIP_ANALYSES.length)]
        updateAsset(id, {
          analyzing: false,
          tags: pick.tags,
          pipAnalysis: zh ? pick.analysis : pick.analysis,
          platforms: pick.platforms,
        })
      }, 1500 + Math.random() * 1000)
    })
  }, [projectId, addAsset, updateAsset, zh])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    noClick: projectAssets.length > 0,
  })

  const stats = {
    total: projectAssets.length,
    images: projectAssets.filter(a => a.type === 'image').length,
    videos: projectAssets.filter(a => a.type === 'video').length,
    analyzed: projectAssets.filter(a => !a.analyzing).length,
  }

  return (
    <div {...getRootProps()} style={{ height: '100%', overflowY: 'auto', background: C.bg, fontFamily: SANS, outline: 'none' }}>
      <input {...getInputProps()} />
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {/* Header */}
      <div style={{ background: C.bg1, borderBottom: `1px solid ${C.border}`, padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 18, color: C.ink, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
              {zh ? '素材库' : 'Asset Library'}
            </h1>
            <p style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, margin: 0 }}>
              {zh ? 'Pip 自动解析素材，匹配最佳平台' : 'Pip analyzes assets and matches them to platforms'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[
              { n: stats.total, label: zh ? '素材' : 'Assets', c: C.accent },
              { n: stats.images, label: zh ? '图片' : 'Images', c: C.purple },
              { n: stats.videos, label: zh ? '视频' : 'Videos', c: C.orange },
              { n: stats.analyzed, label: zh ? '已分析' : 'Analyzed', c: C.green },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '6px 12px', borderRadius: 8, background: `${s.c}10`, border: `1px solid ${s.c}22` }}>
                <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 9, color: s.c, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}

            <label style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 9,
              background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
              color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12,
              boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
            }}>
              <input {...getInputProps()} style={{ display: 'none' }} />
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              {zh ? '上传素材' : 'Upload'}
            </label>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Drop zone overlay when dragging */}
        {isDragActive && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(59,130,246,0.08)',
            border: `2px dashed ${C.accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
              <div style={{ fontWeight: 700, fontSize: 20, color: C.accent }}>{zh ? '松开以上传素材' : 'Drop to upload assets'}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.ink3, marginTop: 4 }}>{zh ? 'Pip 将自动解析并打标签' : 'Pip will analyze and tag them automatically'}</div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {projectAssets.length === 0 && (
          <div style={{
            border: `2px dashed ${C.borderS}`, borderRadius: 16,
            padding: '60px 40px', textAlign: 'center',
            background: C.bg1, cursor: 'pointer',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" fill="none" stroke={C.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.ink, marginBottom: 6 }}>
              {zh ? '拖入图片或视频素材' : 'Drop images or videos here'}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.ink4, lineHeight: 1.6 }}>
              {zh
                ? 'Pip 会自动解析你的素材，分析内容类型、情绪风格，\n并推荐最适合的发布平台和使用场景'
                : 'Pip will analyze your assets, identify content type and style,\nand recommend the best platforms and use cases'}
            </div>
          </div>
        )}

        {/* Asset grid */}
        {projectAssets.length > 0 && (
          <>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.ink4 }}>
                {zh ? `${projectAssets.length} 个素材` : `${projectAssets.length} assets`}
                {stats.analyzed < stats.total && ` · ${stats.total - stats.analyzed} ${zh ? '解析中' : 'analyzing'}`}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>
                {zh ? '拖入更多素材即可上传' : 'Drag more files to upload'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {projectAssets.map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  lang={lang}
                  onRemove={() => removeAsset(asset.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
