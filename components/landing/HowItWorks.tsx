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
  al2:    'rgba(28,58,46,0.15)',
  border: 'rgba(26,25,22,0.08)',
  border2:'rgba(26,25,22,0.14)',
  shadow: '0 2px 8px rgba(26,25,22,0.06),0 8px 24px rgba(26,25,22,0.04)',
}
const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"
const SANS  = "'Noto Sans SC', 'PingFang SC', sans-serif"

const STEPS = [
  {
    num: '01',
    title: '粘贴产品链接',
    desc: '输入官网 URL，无需注册，无需配置。30 秒内开始工作。',
    detail: '支持中英文网站 · 自动识别语言',
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  },
  {
    num: '02',
    title: 'AI 提取品牌基因',
    desc: '自动解析定位、调性、受众，生成专属品牌知识库。',
    detail: '8 份知识文档 · 竞品分析 · 受众画像',
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M20 2v4h-4"/><path d="M20 6a6 6 0 0 1-6 6"/></svg>,
  },
  {
    num: '03',
    title: '投资人视角评审',
    desc: '8 位顶级投资人对你的产品进行全方位诊断，提炼营销方向。',
    detail: '红杉 · IDG · 高瓴 · GGV 等风格投资人',
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M19 8l2 2-2 2"/></svg>,
  },
  {
    num: '04',
    title: '全平台内容生成',
    desc: '12 个平台独立风格，不是粗暴搬运，排期 · 发布 · 迭代。',
    detail: '国内 6 + 海外 6 · 自动适配字数格式',
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  },
]

function StepItem({ step, index, isLast }: { step: typeof STEPS[0]; index: number; isLast: boolean }) {
  const ref  = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const delay = index * 120

  return (
    <div ref={ref} style={{ display: 'flex', gap: 0 }}>
      {/* Left — number + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 72, flexShrink: 0 }}>
        {/* Circle */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: `1.5px solid ${visible ? C.accent : C.border2}`,
          background: visible ? C.accent : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: `all 0.5s ease ${delay}ms`,
          flexShrink: 0,
          boxShadow: visible ? `0 0 0 6px ${C.al}` : 'none',
        }}>
          <span style={{
            fontFamily: MONO, fontSize: 11, fontWeight: 700,
            color: visible ? '#fff' : C.ink4,
            transition: `color 0.5s ease ${delay}ms`,
            letterSpacing: '0.04em',
          }}>{step.num}</span>
        </div>
        {/* Connecting line */}
        {!isLast && (
          <div ref={lineRef} style={{ width: 1, flex: 1, marginTop: 6, background: C.border, position: 'relative', overflow: 'hidden', minHeight: 48 }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              background: C.accent,
              height: visible ? '100%' : '0%',
              transition: `height 0.7s ease ${delay + 300}ms`,
            }} />
          </div>
        )}
      </div>

      {/* Right — content card */}
      <div style={{
        flex: 1, paddingBottom: isLast ? 0 : 48, paddingLeft: 28, paddingTop: 6,
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateX(20px)',
        transition: `opacity 0.55s ease ${delay + 80}ms, transform 0.55s ease ${delay + 80}ms`,
      }}>
        <div style={{
          background: '#fff', borderRadius: 14, padding: '22px 26px',
          border: `1px solid ${C.border2}`,
          boxShadow: C.shadow,
          transition: 'box-shadow 0.2s, transform 0.2s',
          cursor: 'default',
        }}
          onMouseEnter={e => {
            const d = e.currentTarget as HTMLDivElement
            d.style.boxShadow = '0 4px 20px rgba(26,25,22,0.1),0 12px 40px rgba(26,25,22,0.06)'
            d.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            const d = e.currentTarget as HTMLDivElement
            d.style.boxShadow = C.shadow
            d.style.transform = 'none'
          }}
        >
          {/* Icon + title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ color: C.accent, flexShrink: 0 }}>{step.icon}</div>
            <h3 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: C.ink, margin: 0, letterSpacing: '0.01em' }}>{step.title}</h3>
          </div>
          <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 14, color: C.ink3, lineHeight: 1.9, margin: '0 0 12px 0' }}>{step.desc}</p>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.accent, letterSpacing: '0.08em', opacity: 0.75 }}>{step.detail}</div>
        </div>
      </div>
    </div>
  )
}

export default function HowItWorks() {
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
    <section id="howitworks" style={{ background: C.bg, padding: '120px 32px 100px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* Header */}
        <div ref={headerRef} style={{ marginBottom: 72,
          opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.18em', marginBottom: 16, textTransform: 'uppercase' as const }}>HOW IT WORKS</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 600, color: C.ink, lineHeight: 1.2, margin: 0 }}>
            四步，从产品链接<br />
            <span style={{ fontWeight: 300, color: C.ink4 }}>到全平台覆盖</span>
          </h2>
        </div>

        {/* Timeline */}
        <div>
          {STEPS.map((step, i) => (
            <StepItem key={step.num} step={step} index={i} isLast={i === STEPS.length - 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
