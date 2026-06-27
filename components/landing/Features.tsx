'use client'
import { useEffect, useRef, useState } from 'react'

const C = {
  bg2:    '#f4f2ee',
  ink:    '#1a1916',
  ink2:   '#4a4844',
  ink3:   '#9a9894',
  ink4:   '#c8c6c0',
  accent: '#1c3a2e',
  al:     'rgba(28,58,46,0.08)',
  al2:    'rgba(28,58,46,0.15)',
  border: 'rgba(26,25,22,0.08)',
  border2:'rgba(26,25,22,0.14)',
  shadow: '0 2px 8px rgba(26,25,22,0.06),0 8px 24px rgba(26,25,22,0.04)',
  gold:   '#7a6020',
  gl:     '#f5f0e8',
}
const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"
const SANS  = "'Noto Sans SC', 'PingFang SC', sans-serif"

const FEATURES = [
  {
    title: '品牌基因提取',
    desc: '自动解析官网，提取品牌调性、受众画像、内容支柱，生成专属知识库。',
    tag: 'BRAND DNA',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  },
  {
    title: '真实 Agent 架构',
    desc: '内置工具调用循环，主动抓热点、调竞品数据、自动排期，不只是聊天机器人。',
    tag: 'AGENT LOOP',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  },
  {
    title: '12 平台风格适配',
    desc: '小红书种草体、抖音脚本、LinkedIn 白皮书——各平台独立模板，不是粗暴搬运。',
    tag: '12 PLATFORMS',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  },
  {
    title: '内容排期日历',
    desc: '智能分析最佳发布时间，规划周 / 月内容计划，可一键让鸣重新安排。',
    tag: 'CALENDAR',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    title: '实时热点接入',
    desc: '微博热搜、抖音热榜，趋势刚出就能结合你的产品生成蹭热点内容。',
    tag: 'TRENDING',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  },
  {
    title: '中英双语输出',
    desc: '国内外市场同步覆盖，品牌信息精准传递，无需额外翻译工具。',
    tag: 'BILINGUAL',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>,
  },
]

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const delay = (index % 3) * 80 + Math.floor(index / 3) * 60

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(18px)',
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
    }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff', borderRadius: 14, padding: '26px 28px', height: '100%',
          border: `1px solid ${hovered ? 'rgba(28,58,46,0.2)' : C.border2}`,
          borderLeft: `3px solid ${hovered ? C.accent : C.border}`,
          boxShadow: hovered
            ? '0 6px 28px rgba(26,25,22,0.1),0 2px 8px rgba(26,25,22,0.06)'
            : C.shadow,
          transform: hovered ? 'translateY(-3px)' : 'none',
          transition: 'all 0.22s ease',
          cursor: 'default', display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: hovered ? C.al2 : C.al,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.accent, transition: 'background 0.2s',
          flexShrink: 0,
        }}>
          {feature.icon}
        </div>
        {/* Tag */}
        <div style={{ fontFamily: MONO, fontSize: 8, color: hovered ? C.accent : C.ink4, letterSpacing: '0.12em', transition: 'color 0.2s' }}>{feature.tag}</div>
        {/* Title */}
        <h3 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.ink, margin: 0, lineHeight: 1.4, letterSpacing: '0.01em' }}>{feature.title}</h3>
        {/* Desc */}
        <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: C.ink3, lineHeight: 1.9, margin: 0 }}>{feature.desc}</p>
      </div>
    </div>
  )
}

export default function Features() {
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
    <section id="features" style={{ background: C.bg2, padding: '120px 32px 100px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div ref={headerRef} style={{ marginBottom: 64,
          opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.18em', marginBottom: 16, textTransform: 'uppercase' as const }}>FEATURES</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 600, color: C.ink, lineHeight: 1.2, margin: 0 }}>
            不只是内容生成，<br />
            <span style={{ fontWeight: 300, color: C.ink4 }}>是你的营销大脑</span>
          </h2>
        </div>

        {/* 3-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  )
}
