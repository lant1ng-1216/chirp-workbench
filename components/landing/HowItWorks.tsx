'use client'
import { useEffect, useRef, useState } from 'react'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const C = {
  bg:     '#ffffff',
  ink:    '#111827',
  ink2:   '#374151',
  ink3:   '#6b7280',
  ink4:   '#9ca3af',
  accent: '#3b82f6',
  al:     'rgba(59,130,246,0.08)',
  al2:    'rgba(59,130,246,0.15)',
  border: 'rgba(17,24,39,0.08)',
  border2:'rgba(17,24,39,0.14)',
  shadow: '0 2px 8px rgba(17,24,39,0.06),0 8px 24px rgba(17,24,39,0.04)',
}
const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

const STEP_ICONS = [
  <svg key="s1" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  <svg key="s2" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M20 2v4h-4"/><path d="M20 6a6 6 0 0 1-6 6"/></svg>,
  <svg key="s3" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M19 8l2 2-2 2"/></svg>,
  <svg key="s4" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
]

const STEP_KEYS = ['s1', 's2', 's3', 's4'] as const
const STEP_NUMS = ['01', '02', '03', '04']

function StepItem({ skey, num, icon, index, isLast, lang }: { skey: string; num: string; icon: React.ReactNode; index: number; isLast: boolean; lang: 'en' | 'zh' }) {
  const ref = useRef<HTMLDivElement>(null)
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 72, flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: `1.5px solid ${visible ? C.accent : C.border2}`,
          background: visible ? C.accent : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: `all 0.5s ease ${delay}ms`, flexShrink: 0,
          boxShadow: visible ? `0 0 0 6px ${C.al}` : 'none',
        }}>
          <span style={{
            fontFamily: MONO, fontSize: 11, fontWeight: 700,
            color: visible ? '#fff' : C.ink4,
            transition: `color 0.5s ease ${delay}ms`, letterSpacing: '0.04em',
          }}>{num}</span>
        </div>
        {!isLast && (
          <div style={{ width: 1, flex: 1, marginTop: 6, background: C.border, position: 'relative', overflow: 'hidden', minHeight: 48 }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, background: C.accent,
              height: visible ? '100%' : '0%', transition: `height 0.7s ease ${delay + 300}ms`,
            }} />
          </div>
        )}
      </div>

      <div style={{
        flex: 1, paddingBottom: isLast ? 0 : 48, paddingLeft: 28, paddingTop: 6,
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateX(20px)',
        transition: `opacity 0.55s ease ${delay + 80}ms, transform 0.55s ease ${delay + 80}ms`,
      }}>
        <div style={{
          background: '#fff', borderRadius: 14, padding: '22px 26px',
          border: `1px solid ${C.border2}`, boxShadow: C.shadow,
          transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default',
        }}
          onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.boxShadow = '0 4px 20px rgba(17,24,39,0.1),0 12px 40px rgba(17,24,39,0.06)'; d.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.boxShadow = C.shadow; d.style.transform = 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ color: C.accent, flexShrink: 0 }}>{icon}</div>
            <h3 style={{ fontFamily: SANS, fontWeight: 600, fontSize: 17, color: C.ink, margin: 0 }}>{t(`hiw.${skey}.title`, lang)}</h3>
          </div>
          <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14, color: C.ink3, lineHeight: 1.75, margin: '0 0 12px 0' }}>{t(`hiw.${skey}.desc`, lang)}</p>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.accent, letterSpacing: '0.08em', opacity: 0.75 }}>{t(`hiw.${skey}.detail`, lang)}</div>
        </div>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  const { lang } = useMingStore()
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
        <div ref={headerRef} style={{ marginBottom: 72,
          opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.18em', marginBottom: 16, textTransform: 'uppercase' as const }}>{t('hiw.eyebrow', lang)}</div>
          <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(26px, 4vw, 42px)', color: C.ink, lineHeight: 1.15, margin: 0, letterSpacing: '-0.02em' }}>
            {t('hiw.h2a', lang)}<br />
            <span style={{ fontWeight: 300, color: C.ink4 }}>{t('hiw.h2b', lang)}</span>
          </h2>
        </div>
        <div>
          {STEP_KEYS.map((skey, i) => (
            <StepItem key={skey} skey={skey} num={STEP_NUMS[i]} icon={STEP_ICONS[i]} index={i} isLast={i === STEP_KEYS.length - 1} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  )
}
