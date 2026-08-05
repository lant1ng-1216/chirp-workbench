'use client'
import Link from 'next/link'
import ScrollReveal from './ScrollReveal'
import VideoBackground from './VideoBackground'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

export default function Hero() {
  const { lang } = useMingStore()

  return (
    <section style={{
      position: 'relative',
      height: '56vh',
      minHeight: 400,
      maxHeight: 620,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '80px 32px 48px',
      background: '#080810',
    }}>
      <VideoBackground />

      {/* gradient overlay — bottom fades harder so content below is visible */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(8,8,16,0.10) 0%, rgba(8,8,16,0.04) 25%, rgba(8,8,16,0.45) 70%, rgba(8,8,16,0.88) 100%)',
      }} />

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 820 }}>

        <ScrollReveal delay={80}>
          <h1 style={{
            fontFamily: SANS, fontWeight: 700,
            fontSize: 'clamp(32px, 5vw, 62px)',
            lineHeight: 1.1, letterSpacing: '-0.03em',
            color: 'rgba(255,255,255,0.95)',
            marginBottom: 20,
          }}>
            {t('hero.h1a', lang)}
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={160}>
          <p style={{
            fontFamily: SANS, fontWeight: 400,
            fontSize: 15, color: 'rgba(255,255,255,0.42)',
            lineHeight: 1.75, maxWidth: 440, margin: '0 auto 32px',
          }}>
            {t('hero.sub', lang)}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={240}>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/onboarding" style={{ textDecoration: 'none' }}>
              <button style={{
                fontFamily: SANS, fontWeight: 600, padding: '13px 32px', borderRadius: 11,
                background: 'rgba(255,255,255,0.97)', color: '#080810',
                border: 'none', cursor: 'pointer',
                fontSize: 14, letterSpacing: '-0.01em',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                transition: 'opacity 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >{t('hero.cta', lang)}</button>
            </Link>
            <a href="#howitworks" style={{ textDecoration: 'none' }}>
              <button style={{
                fontFamily: SANS, fontWeight: 400,
                padding: '12px 24px', borderRadius: 11,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                fontSize: 13,
                backdropFilter: 'blur(8px)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >{t('hero.cta2', lang)}</button>
            </a>
          </div>

          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            {[t('hero.free', lang), t('hero.nosignup', lang), t('hero.setup', lang)].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {i > 0 && <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.12)', display: 'inline-block' }} />}
                <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>{text}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
