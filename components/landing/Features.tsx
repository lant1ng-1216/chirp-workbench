'use client'
import { useEffect, useRef, useState } from 'react'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const C = {
  bg:     '#ffffff',
  ink:    '#111827',
  ink3:   '#6b7280',
  ink4:   '#9ca3af',
  accent: '#3b82f6',
  al:     'rgba(59,130,246,0.08)',
  al2:    'rgba(59,130,246,0.15)',
  border2:'rgba(17,24,39,0.14)',
  shadow: '0 2px 8px rgba(17,24,39,0.06),0 8px 24px rgba(17,24,39,0.04)',
}
const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

const FEATURES = [
  {
    key: 'memory',
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    key: 'autonomy',
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    ),
  },
  {
    key: 'community',
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

function FeatureCard({ fkey, icon, index }: { fkey: string; icon: React.ReactNode; index: number }) {
  const { lang } = useMingStore()
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

  const delay = index * 100

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(20px)',
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
    }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '36px 32px',
          height: '100%',
          border: `1px solid ${hovered ? 'rgba(59,130,246,0.3)' : C.border2}`,
          borderLeft: `4px solid ${hovered ? C.accent : 'rgba(59,130,246,0.2)'}`,
          boxShadow: hovered ? '0 8px 32px rgba(17,24,39,0.1)' : C.shadow,
          transform: hovered ? 'translateY(-4px)' : 'none',
          transition: 'all 0.22s ease',
          cursor: 'default',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: hovered ? C.al2 : C.al,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.accent, transition: 'background 0.2s', flexShrink: 0,
        }}>
          {icon}
        </div>

        <div style={{ fontFamily: MONO, fontSize: 8, color: hovered ? C.accent : C.ink4, letterSpacing: '0.14em', transition: 'color 0.2s' }}>
          {t(`feat3.${fkey}.tag`, lang)}
        </div>

        <h3 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, color: C.ink, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          {t(`feat3.${fkey}.title`, lang)}
        </h3>

        <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14, color: C.ink3, lineHeight: 1.8, margin: 0 }}>
          {t(`feat3.${fkey}.desc`, lang)}
        </p>

        <div style={{
          marginTop: 'auto', paddingTop: 16,
          borderTop: `1px solid ${hovered ? 'rgba(59,130,246,0.15)' : 'rgba(17,24,39,0.06)'}`,
          fontFamily: MONO, fontSize: 9, color: hovered ? C.accent : C.ink4,
          letterSpacing: '0.08em', transition: 'all 0.2s',
        }}>
          {t(`feat3.${fkey}.detail`, lang)}
        </div>
      </div>
    </div>
  )
}

export default function Features() {
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
    <section id="features" style={{ background: C.bg, padding: '80px 32px 72px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div ref={headerRef} style={{
          marginBottom: 52,
          opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.18em', marginBottom: 16, textTransform: 'uppercase' as const }}>
            {t('feat3.eyebrow', lang)}
          </div>
          <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(26px, 4vw, 42px)', color: C.ink, lineHeight: 1.15, margin: 0, letterSpacing: '-0.02em' }}>
            {t('feat3.h2a', lang)}<br />
            <span style={{ fontWeight: 300, color: C.ink4 }}>{t('feat3.h2b', lang)}</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.key} fkey={f.key} icon={f.icon} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
