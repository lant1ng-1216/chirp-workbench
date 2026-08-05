'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

export default function CtaSection() {
  const { lang } = useMingStore()
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section style={{ background: '#3b82f6', padding: '64px 32px' }}>
      <div
        ref={ref}
        style={{
          maxWidth: 720, margin: '0 auto', textAlign: 'center',
          opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 28 }}>
          {t('cta.eyebrow', lang)}
        </div>

        <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 48px)', color: 'rgba(255,255,255,0.95)', lineHeight: 1.12, marginBottom: 20, letterSpacing: '-0.02em' }}>
          {t('cta.h2a', lang)}<br />
          <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.35)' }}>{t('cta.h2b', lang)}</span>
        </h2>

        <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginBottom: 44, whiteSpace: 'pre-line' as const }}>
          {t('cta.sub', lang)}
        </p>

        <Link href="/onboarding" style={{ textDecoration: 'none' }}>
          <button
            style={{
              fontFamily: SANS, fontWeight: 600, padding: '16px 44px', borderRadius: 12,
              background: 'rgba(255,255,255,0.97)', color: '#3b82f6',
              border: 'none', cursor: 'pointer', fontSize: 16,
              boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
              transition: 'opacity 0.18s, transform 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
          >{t('cta.button', lang)}</button>
        </Link>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          {[t('cta.free', lang), t('cta.nosignup', lang), t('cta.setup', lang)].map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {i > 0 && <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />}
              <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
