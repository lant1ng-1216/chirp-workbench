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
  border: 'rgba(17,24,39,0.08)',
  border2:'rgba(17,24,39,0.14)',
}
const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

const STATS = [
  { statKey: 'pain.s1.stat', labelKey: 'pain.s1.label' },
  { statKey: 'pain.s2.stat', labelKey: 'pain.s2.label' },
  { statKey: 'pain.s3.stat', labelKey: 'pain.s3.label' },
]

export default function PainPoints() {
  const { lang } = useMingStore()
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section style={{ background: C.bg, padding: '80px 32px 72px', borderBottom: `1px solid ${C.border}` }}>
      <div
        ref={ref}
        style={{
          maxWidth: 900, margin: '0 auto',
          opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <p style={{
          fontFamily: SANS, fontWeight: 400,
          fontSize: 'clamp(17px, 2.5vw, 22px)',
          color: C.ink2, lineHeight: 1.55,
          maxWidth: 620, marginBottom: 48,
          letterSpacing: '-0.01em',
        }}>
          {t('pain.lead', lang)}
          <span style={{ color: C.ink4 }}>{t('pain.lead2', lang)}</span>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {STATS.map(({ statKey, labelKey }, i) => (
            <div key={i} style={{
              padding: '28px 28px 24px',
              border: `1px solid ${C.border2}`,
              borderRadius: 14,
              borderTop: `3px solid ${C.accent}`,
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(16px)',
              transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms`,
            }}>
              <div style={{
                fontFamily: SANS, fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 40px)',
                color: C.ink, letterSpacing: '-0.03em',
                lineHeight: 1, marginBottom: 10,
              }}>
                {t(statKey, lang)}
              </div>
              <div style={{
                fontFamily: SANS, fontWeight: 400,
                fontSize: 14, color: C.ink3, lineHeight: 1.6,
              }}>
                {t(labelKey, lang)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
