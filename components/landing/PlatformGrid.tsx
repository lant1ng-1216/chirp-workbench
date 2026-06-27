'use client'
import { useEffect, useRef, useState } from 'react'

const C = {
  bg:     '#faf9f7',
  ink:    '#1a1916',
  ink2:   '#4a4844',
  ink3:   '#9a9894',
  ink4:   '#c8c6c0',
  accent: '#1c3a2e',
  al:     'rgba(28,58,46,0.08)',
  border: 'rgba(26,25,22,0.08)',
  border2:'rgba(26,25,22,0.14)',
  shadow: '0 1px 3px rgba(26,25,22,0.06),0 4px 12px rgba(26,25,22,0.04)',
}
const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"

const DOMESTIC = [
  { id: 'xiaohongshu', name: '小红书', tag: '种草笔记', color: '#FF2442', slug: 'xiaohongshu' },
  { id: 'douyin',      name: '抖音',   tag: '视频脚本', color: '#161823', slug: 'tiktok' },
  { id: 'weibo',       name: '微博',   tag: '热点蹭流', color: '#E6162D', slug: 'sinaweibo' },
  { id: 'wechat',      name: '微信公众号', tag: '长文推送', color: '#07C160', slug: 'wechat' },
  { id: 'bilibili',    name: 'B 站',  tag: '视频稿',   color: '#FB7299', slug: 'bilibili' },
  { id: 'zhihu',       name: '知乎',   tag: '专业问答', color: '#0084FF', slug: 'zhihu' },
]
const INTERNATIONAL = [
  { id: 'twitter',   name: 'Twitter/X',  tag: 'Thread',   color: '#1D9BF0', slug: 'x' },
  { id: 'instagram', name: 'Instagram',  tag: '图文描述',  color: '#E1306C', slug: 'instagram' },
  { id: 'linkedin',  name: 'LinkedIn',   tag: 'B2B 内容', color: '#0A66C2', slug: 'linkedin' },
  { id: 'facebook',  name: 'Facebook',   tag: '社群内容', color: '#1877F2', slug: 'facebook' },
  { id: 'tiktok',    name: 'TikTok',     tag: '短视频',   color: '#010101', slug: 'tiktok' },
  { id: 'youtube',   name: 'YouTube',    tag: '视频描述',  color: '#FF0000', slug: 'youtube' },
]

type Platform = typeof DOMESTIC[0]

function PlatformCell({ p, delay }: { p: Platform; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible]   = useState(false)
  const [hovered, setHovered]   = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const logoSrc = p.id === 'linkedin'
    ? 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=64'
    : `https://cdn.simpleicons.org/${p.slug}`

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px 18px 18px',
        background: hovered ? `${p.color}0f` : '#fff',
        border: `1px solid ${hovered ? p.color + '40' : C.border2}`,
        borderRadius: 12,
        cursor: 'default',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? `0 4px 20px ${p.color}18` : C.shadow,
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-3px)' : 'none') : 'translateY(14px)',
        transitionDelay: visible ? '0ms' : `${delay}ms`,
      }}
    >
      {/* Logo */}
      <div style={{ width: 32, height: 32, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={logoSrc}
          alt={p.name}
          width={28} height={28}
          style={{
            display: 'block',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.2s ease',
          }}
        />
      </div>
      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 5, letterSpacing: '0.01em' }}>{p.name}</div>
      <div style={{ fontFamily: MONO, fontSize: 9, color: hovered ? p.color : C.ink4, letterSpacing: '0.07em', transition: 'color 0.2s' }}>{p.tag}</div>
    </div>
  )
}

export default function PlatformGrid() {
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerVisible, setHeaderVisible] = useState(false)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHeaderVisible(true); obs.disconnect() } }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="platforms" style={{ background: C.bg, padding: '120px 32px 100px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div ref={headerRef} style={{ marginBottom: 64,
          opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.18em', marginBottom: 16, textTransform: 'uppercase' as const }}>PLATFORMS</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 600, color: C.ink, lineHeight: 1.2, margin: 0 }}>
            12 个平台，<span style={{ fontWeight: 300, color: C.ink4 }}>一个 Agent</span>
          </h2>
          <p style={{ fontFamily: SERIF, fontWeight: 300, marginTop: 14, fontSize: 15, color: C.ink3, lineHeight: 1.8 }}>
            国内 6 + 海外 6，每个平台独立风格模板，自动适配字数与格式。
          </p>
        </div>

        {/* Groups */}
        {[{ label: '国内平台', items: DOMESTIC }, { label: '海外平台', items: INTERNATIONAL }].map((group, gi) => (
          <div key={group.label} style={{ marginBottom: gi === 0 ? 32 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ height: 1, width: 16, background: C.border2 }} />
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>{group.label}</span>
              <div style={{ height: 1, flex: 1, background: C.border2 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
              {group.items.map((p, i) => (
                <PlatformCell key={p.id} p={p} delay={i * 50 + gi * 100} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
