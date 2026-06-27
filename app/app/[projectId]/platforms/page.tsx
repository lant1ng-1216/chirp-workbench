'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import { PLATFORMS } from '@/lib/brand'
import type { PlatformId } from '@/lib/brand'

const C = {
  bg: '#faf9f7', bg2: '#f4f2ee', bg3: '#edeae4',
  ink: '#1a1916', ink2: '#4a4844', ink3: '#9a9894', ink4: '#c8c6c0',
  accent: '#1c3a2e', al: 'rgba(28,58,46,0.08)', al2: 'rgba(28,58,46,0.15)',
  gold: '#7a6020', gl: '#f5f0e8',
  border: 'rgba(26,25,22,0.08)', border2: 'rgba(26,25,22,0.14)',
  shadow: '0 1px 3px rgba(26,25,22,0.06),0 3px 10px rgba(26,25,22,0.04)',
  sfloat: '0 8px 32px rgba(26,25,22,0.14)',
  green: '#4a9e6a',
}
const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"
const SANS  = "'Noto Sans SC', 'PingFang SC', sans-serif"

/* Logo sources: Simple Icons CDN for most, Google Favicon as fallback */
const LOGO_URL: Record<string, string> = {
  xiaohongshu: 'https://cdn.simpleicons.org/xiaohongshu',
  douyin:      'https://cdn.simpleicons.org/tiktok',
  weibo:       'https://cdn.simpleicons.org/sinaweibo',
  wechat:      'https://cdn.simpleicons.org/wechat',
  bilibili:    'https://cdn.simpleicons.org/bilibili',
  zhihu:       'https://cdn.simpleicons.org/zhihu',
  twitter:     'https://cdn.simpleicons.org/x',
  instagram:   'https://cdn.simpleicons.org/instagram',
  linkedin:    'https://www.google.com/s2/favicons?domain=linkedin.com&sz=64',
  facebook:    'https://cdn.simpleicons.org/facebook',
  tiktok:      'https://cdn.simpleicons.org/tiktok',
  youtube:     'https://cdn.simpleicons.org/youtube',
}

function PlatformLogo({ id, size = 20 }: { id: string; size?: number }) {
  const src = LOGO_URL[id]
  if (!src) return null
  return (
    <img
      src={src}
      alt={id}
      width={size}
      height={size}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}

/* Per-platform publishing tips and limits */
const PLATFORM_META: Record<string, { charLimit: string; bestTime: string; tip: string; frequency: string }> = {
  xiaohongshu: { charLimit: '≤1000 字', bestTime: '18:00–22:00', tip: '图文并茂效果最好，封面图决定点击率', frequency: '每周 3–5 篇' },
  douyin:      { charLimit: '视频为主', bestTime: '20:00–23:00', tip: '前 3 秒留住用户，完播率影响推流', frequency: '每周 3–7 条' },
  weibo:       { charLimit: '≤2000 字', bestTime: '07:00–09:00 / 20:00–22:00', tip: '话题标签最多 2 个，蹭热搜提效', frequency: '每天 1–2 条' },
  wechat:      { charLimit: '≤10万 字', bestTime: '08:00–09:00 / 12:00', tip: '标题决定打开率，二维码引导关注', frequency: '每周 2–4 篇' },
  bilibili:    { charLimit: '视频 + 专栏', bestTime: '12:00 / 19:00–21:00', tip: '封面+标题决定推荐，弹幕互动很重要', frequency: '每周 1–3 条' },
  zhihu:       { charLimit: '无严格限制', bestTime: '09:00–11:00 / 20:00–22:00', tip: '先回答问题再引流，知识型内容转化高', frequency: '每周 1–2 篇' },
  twitter:     { charLimit: '≤280 字符', bestTime: '09:00–10:00 / 20:00 (UTC+8)', tip: 'Thread 形式增加深度，图/视频提升曝光', frequency: '每天 1–3 条' },
  instagram:   { charLimit: '≤2200 字符', bestTime: '11:00–13:00 / 19:00–21:00', tip: 'Reels 算法倾斜，首帧要有冲击力', frequency: '每周 4–6 条' },
  linkedin:    { charLimit: '≤3000 字', bestTime: '周二–周四 09:00–10:00', tip: '职场故事和数据分析表现最好', frequency: '每周 2–3 篇' },
  facebook:    { charLimit: '≤63206 字', bestTime: '13:00–16:00 / 20:00', tip: '视频和直播触达率更高，避免纯文字', frequency: '每天 1–2 条' },
  tiktok:      { charLimit: '视频为主', bestTime: '19:00–22:00', tip: '音乐选择影响推流，跟热门 BGM', frequency: '每天 1–2 条' },
  youtube:     { charLimit: '视频描述 ≤5000 字', bestTime: '15:00–18:00', tip: '前 30 秒决定留存，标题 SEO 很重要', frequency: '每周 1–2 条' },
}

/* Local state for "followed" platforms — stored in Zustand via project metadata would need type changes,
   so we use a simple localStorage key scoped to projectId */
function useFollowedPlatforms(projectId: string) {
  const key = `ming-platforms-${projectId}`
  const [followed, setFollowed] = useState<Set<PlatformId>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]') as PlatformId[]) }
    catch { return new Set() }
  })

  const toggle = (id: PlatformId) => {
    setFollowed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem(key, JSON.stringify([...next]))
      return next
    })
  }

  return { followed, toggle }
}

/* Account handle stored locally per platform */
function useHandles(projectId: string) {
  const key = `ming-handles-${projectId}`
  const [handles, setHandles] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(key) || '{}') }
    catch { return {} }
  })
  const setHandle = (platformId: string, value: string) => {
    setHandles(prev => {
      const next = { ...prev, [platformId]: value }
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }
  return { handles, setHandle }
}

interface PlatformCardProps {
  id: PlatformId; name: string; color: string; contentTypes: string[]
  followed: boolean; onToggle: () => void; handle: string; onHandle: (v: string) => void
}

function PlatformCard({ id, name, color, contentTypes, followed, onToggle, handle, onHandle }: PlatformCardProps) {
  const [expanded, setExpanded] = useState(false)
  const meta = PLATFORM_META[id]

  return (
    <div style={{
      borderRadius: 12, border: `1.5px solid ${followed ? color + '40' : C.border2}`,
      background: followed ? (color + '06') : '#fff',
      boxShadow: C.shadow, overflow: 'hidden', transition: 'border-color 0.2s, background 0.2s',
    }}>
      {/* Card top */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {/* Platform color dot + icon */}
          <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PlatformLogo id={id} size={20} />
            </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.ink }}>{name}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
              {contentTypes.map(t => (
                <span key={t} style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, padding: '1px 6px', borderRadius: 99, background: C.bg3, letterSpacing: '0.03em' }}>{t}</span>
              ))}
            </div>
          </div>
          {/* Toggle */}
          <button onClick={onToggle} style={{
            padding: '5px 12px', borderRadius: 7, border: `1px solid ${followed ? color : C.border2}`,
            background: followed ? color : 'transparent', color: followed ? '#fff' : C.ink4,
            fontFamily: MONO, fontSize: 9, cursor: 'pointer', letterSpacing: '0.04em',
            flexShrink: 0, transition: 'all 0.2s',
          }}>{followed ? '已关注 ✓' : '标记关注'}</button>
        </div>

        {/* Handle input */}
        {followed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, alignSelf: 'center', whiteSpace: 'nowrap' }}>账号名 @</div>
            <input
              value={handle} onChange={e => onHandle(e.target.value)}
              placeholder={`${name} 账号 ID`}
              style={{
                flex: 1, padding: '5px 9px', borderRadius: 7, border: `1px solid ${C.border2}`,
                fontFamily: MONO, fontSize: 10, color: C.ink, background: C.bg2, outline: 'none',
              }}
            />
          </div>
        )}

        {/* Expand toggle */}
        <button onClick={() => setExpanded(e => !e)} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: C.ink4,
          fontFamily: MONO, fontSize: 9, display: 'flex', alignItems: 'center', gap: 4, padding: 0,
          letterSpacing: '0.06em',
        }}>
          发布指南
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>

      {/* Expanded tips */}
      {expanded && meta && (
        <div style={{ padding: '10px 16px 14px', borderTop: `1px solid ${C.border}`, background: C.bg2 }}>
          {[
            { label: '字数上限', value: meta.charLimit },
            { label: '最佳时间', value: meta.bestTime },
            { label: '建议频率', value: meta.frequency },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', gap: 10, marginBottom: 7 }}>
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.06em', minWidth: 56, flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontFamily: SANS, fontSize: 11, color: C.ink2 }}>{row.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: C.gl, border: `1px solid rgba(122,96,32,0.14)` }}>
            <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 11, color: C.ink2, lineHeight: 1.8 }}>💡 {meta.tip}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlatformsPage() {
  const params    = useParams()
  const projectId = params.projectId as string
  const project   = useMingStore(s => s.projects.find(p => p.id === projectId))
  const { followed, toggle } = useFollowedPlatforms(projectId)
  const { handles, setHandle } = useHandles(projectId)

  const followedCount = followed.size

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, fontFamily: SANS }}>

      {/* Header */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${C.border}`, background: C.bg, position: 'sticky', top: 0, zIndex: 10, gap: 12 }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.ink, margin: 0 }}>平台连接</h1>
        <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.08em' }}>{project?.brand.name}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: followedCount > 0 ? C.accent : C.ink4, alignSelf: 'center' }}>
            {followedCount}/12 已关注
          </span>
        </div>
      </div>

      <div style={{ padding: '16px 20px 40px', maxWidth: 860 }}>

        {/* Notice banner */}
        <div style={{ padding: '12px 16px', borderRadius: 10, background: C.gl, border: `1px solid rgba(122,96,32,0.18)`, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 10, color: '#fff', fontWeight: 600, flexShrink: 0, marginTop: 1 }}>鸣</div>
          <div>
            <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 12, color: C.ink2, lineHeight: 1.8, margin: 0 }}>
              标记你正在运营的平台账号，并填写账号名称。鸣在生成内容时会自动适配各平台的格式、调性和字数要求。
              <br />
              <span style={{ color: C.ink4, fontSize: 11 }}>目前为本地配置，不需要登录平台账号。真实 OAuth 连接和一键发布功能将在后续版本上线。</span>
            </p>
          </div>
        </div>

        {/* Domestic platforms */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ height: 1, width: 20, background: C.border2 }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>国内平台</span>
            <div style={{ height: 1, flex: 1, background: C.border2 }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{PLATFORMS.domestic.filter(p => followed.has(p.id)).length}/{PLATFORMS.domestic.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {PLATFORMS.domestic.map(p => (
              <PlatformCard
                key={p.id} id={p.id} name={p.name} color={p.color} contentTypes={p.contentTypes}
                followed={followed.has(p.id)} onToggle={() => toggle(p.id)}
                handle={handles[p.id] || ''} onHandle={v => setHandle(p.id, v)}
              />
            ))}
          </div>
        </div>

        {/* International platforms */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ height: 1, width: 20, background: C.border2 }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>海外平台</span>
            <div style={{ height: 1, flex: 1, background: C.border2 }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{PLATFORMS.international.filter(p => followed.has(p.id)).length}/{PLATFORMS.international.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {PLATFORMS.international.map(p => (
              <PlatformCard
                key={p.id} id={p.id} name={p.name} color={p.color} contentTypes={p.contentTypes}
                followed={followed.has(p.id)} onToggle={() => toggle(p.id)}
                handle={handles[p.id] || ''} onHandle={v => setHandle(p.id, v)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
