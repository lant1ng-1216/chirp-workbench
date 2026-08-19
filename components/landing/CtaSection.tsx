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
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section style={{
      position: 'relative',
      overflow: 'hidden',
      padding: '88px 32px',
      background: '#0c0c12',
    }}>
      {/* Atmosphere — not flat blue slab */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 70% 60% at 20% 30%, rgba(220, 100, 70, 0.18) 0%, transparent 55%),
          radial-gradient(ellipse 55% 50% at 85% 70%, rgba(56, 120, 160, 0.16) 0%, transparent 50%),
          linear-gradient(180deg, #0c0c12 0%, #12121a 100%)
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.35,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`,
        mixBlendMode: 'overlay',
      }} />

      <div
        ref={ref}
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: 720, margin: '0 auto', textAlign: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        <div style={{
          fontFamily: MONO, fontSize: 9,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24,
        }}>
          {t('cta.eyebrow', lang)}
        </div>

        <h2 style={{
          fontFamily: SANS, fontWeight: 700,
          fontSize: 'clamp(28px, 4.2vw, 46px)',
          color: 'rgba(255,255,255,0.94)',
          lineHeight: 1.12, marginBottom: 18, letterSpacing: '-0.03em',
        }}>
          {t('cta.h2a', lang)}
          <br />
          <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.38)' }}>
            {t('cta.h2b', lang)}
          </span>
        </h2>

        <p style={{
          fontFamily: SANS, fontWeight: 400, fontSize: 15,
          color: 'rgba(255,255,255,0.42)', lineHeight: 1.75,
          marginBottom: 36, whiteSpace: 'pre-line',
        }}>
          {t('cta.sub', lang)}
        </p>

        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <button
            style={{
              fontFamily: SANS, fontWeight: 600, padding: '15px 36px', borderRadius: 11,
              background: 'rgba(255,255,255,0.96)', color: '#0c0c12',
              border: 'none', cursor: 'pointer', fontSize: 15, letterSpacing: '-0.01em',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              transition: 'opacity 0.18s, transform 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.9'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'none'
            }}
          >
            {t('cta.button', lang)}
          </button>
        </Link>

        <div style={{
          marginTop: 22, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          {[t('cta.free', lang), t('cta.nosignup', lang), t('cta.setup', lang)].map((text, i) => (
            <span key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {i > 0 && (
                <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.18)' }} />
              )}
              <span style={{
                fontFamily: MONO, fontSize: 9,
                color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em',
              }}>
                {text}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
