'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

type Lang = 'en' | 'zh'

const TG_URL = 'https://t.me/lant1ng'
const EMAIL = 'zfu9751@gmail.com'

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, vis }
}

function TelegramIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        d="M17.6 7.2c.2-.1.4 0 .4.2l-1.7 9.1c-.1.5-.5.6-.9.4l-2.7-2-1.3 1.3c-.1.1-.3.2-.5.1l.2-3 5.1-4.6c.2-.2 0-.3-.2-.1l-6.3 4-2.7-.8c-.6-.2-.6-.6.1-.9l10.5-4z"
        fill="#fff"
      />
    </svg>
  )
}

const TIERS = [
  { key: 'sp.tier1', bullets: ['sp.tier1.b1', 'sp.tier1.b2', 'sp.tier1.b3'] as const },
  { key: 'sp.tier2', bullets: ['sp.tier2.b1', 'sp.tier2.b2', 'sp.tier2.b3'] as const },
  { key: 'sp.tier3', bullets: ['sp.tier3.b1', 'sp.tier3.b2', 'sp.tier3.b3'] as const },
] as const

const JOIN = [
  { t: 'sp.join.1.t', d: 'sp.join.1.d' },
  { t: 'sp.join.2.t', d: 'sp.join.2.d' },
  { t: 'sp.join.3.t', d: 'sp.join.3.d' },
] as const

export default function SponsorsPage() {
  const { lang } = useMingStore()
  const L = lang as Lang
  const hero = useReveal()
  const tiers = useReveal()
  const founder = useReveal()
  const join = useReveal()
  const mail = `mailto:${EMAIL}?subject=${encodeURIComponent('Chirp sponsorship')}`

  return (
    <main style={{ background: '#0c0c12', minHeight: '100vh', color: '#fff' }}>
      <Navbar />

      {/* Hero — sponsor-first */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '140px 32px 64px' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 60% 50% at 15% 20%, rgba(220,100,70,0.16) 0%, transparent 55%),
            radial-gradient(ellipse 50% 45% at 90% 70%, rgba(56,120,160,0.14) 0%, transparent 50%)
          `,
        }} />
        <div
          ref={hero.ref}
          style={{
            position: 'relative', maxWidth: 720, margin: '0 auto',
            opacity: hero.vis ? 1 : 0,
            transform: hero.vis ? 'none' : 'translateY(18px)',
            transition: 'opacity 0.65s ease, transform 0.65s ease',
          }}
        >
          <div style={{
            display: 'inline-block',
            fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em',
            color: 'rgba(255,255,255,0.35)',
            border: '1px solid rgba(255,255,255,0.14)',
            padding: '5px 12px', marginBottom: 22, textTransform: 'uppercase',
          }}>
            {t('sp.open', L)}
          </div>
          <div style={{
            fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.32)',
            letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 18,
          }}>
            {t('sp.eyebrow', L)}
          </div>
          <h1 style={{
            fontFamily: SANS, fontWeight: 700,
            fontSize: 'clamp(32px, 5vw, 48px)',
            lineHeight: 1.12, letterSpacing: '-0.03em', margin: '0 0 18px',
            color: 'rgba(255,255,255,0.94)',
          }}>
            {t('sp.h1a', L)}
            <br />
            <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.38)' }}>
              {t('sp.h1b', L)}
            </span>
          </h1>
          <p style={{
            fontFamily: SANS, fontSize: 15, color: 'rgba(255,255,255,0.42)',
            lineHeight: 1.8, margin: '0 0 14px', maxWidth: 560,
          }}>
            {t('sp.sub', L)}
          </p>
          <p style={{
            fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.28)',
            letterSpacing: '0.04em', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 480,
          }}>
            {t('sp.solo.note', L)}
          </p>
          <a
            href="#sponsorship-options"
            style={{
              fontFamily: SANS, fontWeight: 600, fontSize: 14,
              color: '#0c0c12', textDecoration: 'none',
              display: 'inline-block',
              padding: '13px 24px', borderRadius: 11,
              background: 'rgba(255,255,255,0.96)',
            }}
          >
            {t('sp.cta.scroll', L)}
          </a>
        </div>
      </section>

      {/* Main: sponsorship tiers */}
      <section id="sponsorship-options" style={{ padding: '32px 32px 72px', scrollMarginTop: 80 }}>
        <div
          ref={tiers.ref}
          style={{
            maxWidth: 1000, margin: '0 auto',
            opacity: tiers.vis ? 1 : 0,
            transform: tiers.vis ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div style={{
            fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)',
            letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 28,
          }}>
            {t('sp.tiers.eyebrow', L)}
          </div>
          <div className="sp-tiers" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {TIERS.map(({ key, bullets }) => (
              <div key={key} style={{
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 14, padding: '26px 22px',
                background: 'rgba(255,255,255,0.04)',
              }}>
                <h3 style={{
                  fontFamily: SANS, fontWeight: 600, fontSize: 18,
                  color: 'rgba(255,255,255,0.92)', margin: '0 0 12px', letterSpacing: '-0.02em',
                }}>
                  {t(`${key}.name`, L)}
                </h3>
                <p style={{
                  fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.4)',
                  lineHeight: 1.65, margin: '0 0 18px', minHeight: 72,
                }}>
                  {t(`${key}.desc`, L)}
                </p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {bullets.map(b => (
                    <li key={b} style={{
                      fontFamily: SANS, fontSize: 12, color: 'rgba(255,255,255,0.55)',
                      display: 'flex', gap: 8, alignItems: 'center',
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.45)' }} />
                      {t(b, L)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder — trust only + small TG */}
      <section style={{ padding: '8px 32px 56px' }}>
        <div
          ref={founder.ref}
          style={{
            maxWidth: 640, margin: '0 auto',
            opacity: founder.vis ? 1 : 0,
            transform: founder.vis ? 'none' : 'translateY(14px)',
            transition: 'opacity 0.55s ease, transform 0.55s ease',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 40,
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 16, marginBottom: 14,
          }}>
            <div style={{
              fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
              {t('sp.founder.eyebrow', L)}
            </div>
            <a
              href={TG_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('sp.tg.handle', L)}
              title={t('sp.tg.handle', L)}
              style={{
                display: 'inline-flex', flexShrink: 0,
                opacity: 0.9, transition: 'opacity 0.15s',
              }}
            >
              <TelegramIcon size={26} />
            </a>
          </div>
          <h2 style={{
            fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(22px, 3vw, 28px)',
            color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.02em',
            margin: '0 0 14px', lineHeight: 1.25,
          }}>
            {t('sp.founder.h2', L)}
          </h2>
          <p style={{
            fontFamily: SANS, fontSize: 14, color: 'rgba(255,255,255,0.42)',
            lineHeight: 1.8, margin: '0 0 12px',
          }}>
            {t('sp.founder.p1', L)}
          </p>
          <p style={{
            fontFamily: SANS, fontSize: 14, color: 'rgba(255,255,255,0.38)',
            lineHeight: 1.8, margin: 0,
          }}>
            {t('sp.founder.p2', L)}
          </p>
        </div>
      </section>

      {/* Join — secondary, compact */}
      <section style={{ padding: '8px 32px 64px' }}>
        <div
          ref={join.ref}
          style={{
            maxWidth: 1000, margin: '0 auto',
            opacity: join.vis ? 1 : 0,
            transform: join.vis ? 'none' : 'translateY(12px)',
            transition: 'opacity 0.55s ease, transform 0.55s ease',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '22px 24px 20px',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{
            fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            {t('sp.join.eyebrow', L)}
          </div>
          <p style={{
            fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.38)',
            lineHeight: 1.6, margin: '0 0 18px', maxWidth: 560,
          }}>
            {t('sp.join.lead', L)}
          </p>
          <div className="sp-join" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 14,
          }}>
            {JOIN.map(item => (
              <div key={item.t}>
                <div style={{
                  fontFamily: SANS, fontWeight: 600, fontSize: 13,
                  color: 'rgba(255,255,255,0.7)', marginBottom: 6,
                }}>
                  {t(item.t, L)}
                </div>
                <p style={{
                  fontFamily: SANS, fontSize: 12, color: 'rgba(255,255,255,0.32)',
                  lineHeight: 1.55, margin: 0,
                }}>
                  {t(item.d, L)}
                </p>
              </div>
            ))}
          </div>
          <p style={{
            fontFamily: SANS, fontSize: 12, color: 'rgba(255,255,255,0.3)',
            lineHeight: 1.55, margin: 0, fontStyle: 'italic',
          }}>
            {t('sp.join.open', L)}
          </p>
        </div>
      </section>

      {/* Contact — sole full CTA */}
      <section style={{
        padding: '48px 32px 100px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)',
            letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            {t('sp.contact.eyebrow', L)}
          </div>
          <h2 style={{
            fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(24px, 3.5vw, 32px)',
            color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', margin: '0 0 14px',
          }}>
            {t('sp.contact.h2', L)}
          </h2>
          <p style={{
            fontFamily: SANS, fontSize: 14, color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.75, margin: '0 0 28px',
          }}>
            {t('sp.contact.sub', L)}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <a href={mail} style={{ textDecoration: 'none' }}>
              <button style={{
                fontFamily: SANS, fontWeight: 600, fontSize: 14,
                padding: '13px 22px', borderRadius: 11, border: 'none',
                background: 'rgba(255,255,255,0.96)', color: '#0c0c12', cursor: 'pointer',
              }}>
                {t('sp.contact.btn', L)}
              </button>
            </a>
            <a
              href={TG_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 10,
                fontFamily: SANS, fontWeight: 500, fontSize: 14,
                padding: '11px 18px', borderRadius: 11,
                border: '1px solid rgba(34,158,217,0.45)',
                color: 'rgba(255,255,255,0.9)',
                background: 'rgba(34,158,217,0.12)',
              }}
            >
              <TelegramIcon size={22} />
              {t('sp.contact.tg', L)}
            </a>
          </div>
          <div style={{ marginTop: 28 }}>
            <Link href="/about" style={{
              fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.28)',
              letterSpacing: '0.08em', textDecoration: 'none',
            }}>
              ← About Chirp
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 860px) {
          .sp-tiers, .sp-join { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}
