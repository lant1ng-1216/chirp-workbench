'use client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ScrollReveal from './ScrollReveal'
import VideoBackground from './VideoBackground'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const ASCIIText = dynamic(() => import('./ASCIIText'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700,
      fontSize: 'clamp(40px, 7vw, 72px)', color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.04em',
    }}>
      Chirp
    </div>
  ),
})

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

export default function Hero() {
  const { lang } = useMingStore()

  return (
    <section style={{
      position: 'relative',
      height: '62vh',
      minHeight: 460,
      maxHeight: 720,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '72px 28px 36px',
      background: '#080810',
    }}>
      <VideoBackground />

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(8,8,16,0.18) 0%, rgba(8,8,16,0.35) 45%, rgba(8,8,16,0.82) 100%)',
      }} />

      <div
        className="hero-split"
        style={{
          position: 'relative', zIndex: 2,
          width: '100%', maxWidth: 1120, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)',
          gap: 28,
          alignItems: 'center',
          minHeight: 0,
          height: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Left: copy */}
        <ScrollReveal delay={60}>
          <div style={{ textAlign: 'left', paddingRight: 8 }}>
            <p style={{
              fontFamily: SANS, fontWeight: 500,
              fontSize: 'clamp(22px, 3.2vw, 34px)',
              lineHeight: 1.2, letterSpacing: '-0.03em',
              color: 'rgba(255,255,255,0.92)',
              margin: '0 0 14px',
            }}>
              {t('hero.h1b', lang)}
            </p>
            <p style={{
              fontFamily: SANS, fontWeight: 400,
              fontSize: 14, color: 'rgba(255,255,255,0.48)',
              lineHeight: 1.75, margin: '0 0 22px', maxWidth: 420,
            }}>
              {t('hero.sub', lang)}
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <button style={{
                  fontFamily: SANS, fontWeight: 600, padding: '12px 26px', borderRadius: 11,
                  background: 'rgba(255,255,255,0.97)', color: '#080810',
                  border: 'none', cursor: 'pointer', fontSize: 14, letterSpacing: '-0.01em',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}>
                  {t('hero.cta', lang)}
                </button>
              </Link>
              <a href="#product" style={{ textDecoration: 'none' }}>
                <button style={{
                  fontFamily: SANS, fontWeight: 400,
                  padding: '11px 20px', borderRadius: 11,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 13,
                  backdropFilter: 'blur(8px)',
                }}>
                  {t('hero.cta2', lang)}
                </button>
              </a>
            </div>

            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {[t('hero.free', lang), t('hero.nosignup', lang), t('hero.setup', lang)].map((text, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {i > 0 && <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.14)' }} />}
                  <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em' }}>{text}</span>
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Right: ASCII Chirp on dark stage — no ScrollReveal (avoid opacity:0 race) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'min(340px, 48vh)',
            minHeight: 220,
            borderRadius: 18,
            overflow: 'hidden',
            background: '#000',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          }}
        >
          <h1 style={{ position: 'absolute', inset: 0, margin: 0 }}>
            <span className="sr-only">{t('hero.h1a', lang)}</span>
            <div style={{ position: 'absolute', inset: 0 }}>
              <ASCIIText
                text="Chirp"
                asciiFontSize={8}
                textFontSize={200}
                planeBaseHeight={8}
                enableWaves
                textColor="#fdf9f3"
              />
            </div>
          </h1>
        </div>
      </div>

      <style>{`
        .sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }
        @media (max-width: 860px) {
          .hero-split {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
            align-content: center !important;
          }
          .hero-split > div:last-child > div {
            height: min(220px, 36vh) !important;
            min-height: 180px !important;
          }
        }
      `}</style>
    </section>
  )
}
