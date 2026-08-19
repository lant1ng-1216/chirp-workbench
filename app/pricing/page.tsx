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

function useReveal(threshold = 0.1) {
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

const FEATURES_LIVE = [
  'pp.feat.canvas',
  'pp.feat.grounded',
  'pp.feat.repurpose',
  'pp.feat.schedule',
  'pp.feat.plan',
  'pp.feat.memory',
] as const

const FEATURES_STUDIO_EXTRA = ['pp.feat.later'] as const

const PLANS = [
  {
    key: 'pp.live' as const,
    live: true,
    href: '/dashboard',
    features: FEATURES_LIVE,
  },
  {
    key: 'pp.creator' as const,
    live: false,
    href: '/dashboard',
    features: FEATURES_LIVE,
  },
  {
    key: 'pp.studio' as const,
    live: false,
    href: '/sponsors',
    features: [...FEATURES_LIVE, ...FEATURES_STUDIO_EXTRA],
  },
]

function PlanCard({
  plan, lang, delay,
}: {
  plan: (typeof PLANS)[number]
  lang: Lang
  delay: number
}) {
  const { ref, vis } = useReveal(0.05)
  const live = plan.live

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        minWidth: 0,
        border: live ? '1.5px solid rgba(17,24,39,0.18)' : '1px solid rgba(17,24,39,0.1)',
        borderRadius: 16,
        background: live ? '#fff' : 'rgba(255,255,255,0.65)',
        padding: '28px 24px 26px',
        boxShadow: live ? '0 12px 40px rgba(17,24,39,0.06)' : 'none',
        opacity: vis ? 1 : 0,
        transform: vis ? 'none' : 'translateY(18px)',
        transition: `opacity 0.55s ${delay}ms ease, transform 0.55s ${delay}ms ease`,
      }}
    >
      <div style={{
        display: 'inline-block',
        fontFamily: MONO, fontSize: 8, letterSpacing: '0.12em',
        color: live ? '#16a34a' : 'rgba(17,24,39,0.4)',
        border: `1px solid ${live ? 'rgba(22,163,74,0.35)' : 'rgba(17,24,39,0.12)'}`,
        padding: '3px 8px', marginBottom: 14,
      }}>
        {t(`${plan.key}.tag`, lang)}
      </div>

      <div style={{
        fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(17,24,39,0.4)', marginBottom: 12,
      }}>
        {t(`${plan.key}.name`, lang)}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
        <span style={{
          fontFamily: SANS, fontWeight: 700, fontSize: 40,
          letterSpacing: '-0.04em', color: '#111827', lineHeight: 1,
        }}>
          {t(`${plan.key}.price`, lang)}
        </span>
        <span style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(17,24,39,0.38)' }}>
          {t(`${plan.key}.period`, lang)}
        </span>
      </div>

      <p style={{
        fontFamily: SANS, fontSize: 13, color: 'rgba(17,24,39,0.48)',
        lineHeight: 1.65, margin: '0 0 22px', minHeight: 62,
      }}>
        {t(`${plan.key}.desc`, lang)}
      </p>

      <Link href={plan.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
        <button
          style={{
            width: '100%', fontFamily: SANS, fontWeight: 600, fontSize: 14,
            padding: '12px 0', borderRadius: 10,
            background: live ? '#111827' : 'transparent',
            color: live ? '#fff' : 'rgba(17,24,39,0.65)',
            border: live ? 'none' : '1.5px solid rgba(17,24,39,0.14)',
            cursor: 'pointer',
          }}
        >
          {t(`${plan.key}.cta`, lang)}
        </button>
      </Link>

      <div style={{ borderTop: '1px solid rgba(17,24,39,0.07)', paddingTop: 18 }}>
        <div style={{
          fontFamily: MONO, fontSize: 8, color: 'rgba(17,24,39,0.28)',
          letterSpacing: '0.12em', marginBottom: 12,
        }}>
          {t('pp.included', lang)}
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plan.features.map(key => (
            <li key={key} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              fontFamily: SANS, fontSize: 13, color: 'rgba(17,24,39,0.55)', lineHeight: 1.4,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: 999, marginTop: 6, flexShrink: 0,
                background: key === 'pp.feat.later' ? 'rgba(17,24,39,0.2)' : '#111827',
              }} />
              {t(key, lang)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const { lang } = useMingStore()
  const L = lang as Lang
  const hero = useReveal(0.1)
  const note = useReveal(0.1)

  return (
    <main style={{ background: '#f7f7f8', minHeight: '100vh' }}>
      <Navbar light />

      <section style={{ padding: '120px 32px 48px', textAlign: 'center' }}>
        <div
          ref={hero.ref}
          style={{
            maxWidth: 640, margin: '0 auto',
            opacity: hero.vis ? 1 : 0,
            transform: hero.vis ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(17,24,39,0.12)', borderRadius: 100,
            padding: '6px 14px', marginBottom: 28, background: '#fff',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#16a34a' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(17,24,39,0.55)', letterSpacing: '0.06em' }}>
              {t('pp.beta.badge', L)}
            </span>
          </div>

          <div style={{
            fontFamily: MONO, fontSize: 9, color: 'rgba(17,24,39,0.32)',
            letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            {t('pp.eyebrow', L)}
          </div>

          <h1 style={{
            fontFamily: SANS, fontWeight: 700,
            fontSize: 'clamp(30px, 4.5vw, 46px)',
            color: '#111827', lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 16px',
          }}>
            {t('pp.h1a', L)}
            <br />
            <span style={{ fontWeight: 300, color: 'rgba(17,24,39,0.4)' }}>{t('pp.h1b', L)}</span>
          </h1>

          <p style={{
            fontFamily: SANS, fontSize: 15, color: 'rgba(17,24,39,0.48)', lineHeight: 1.75, margin: 0,
          }}>
            {t('pp.sub', L)}
          </p>
        </div>
      </section>

      <section style={{ padding: '0 28px 56px' }}>
        <div className="pp-grid" style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'flex', gap: 16, alignItems: 'stretch',
        }}>
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.key} plan={plan} lang={L} delay={i * 70} />
          ))}
        </div>
      </section>

      <section style={{ padding: '0 32px 96px' }}>
        <div
          ref={note.ref}
          style={{
            maxWidth: 520, margin: '0 auto', textAlign: 'center',
            borderTop: '1px solid rgba(17,24,39,0.08)', paddingTop: 40,
            opacity: note.vis ? 1 : 0, transition: 'opacity 0.6s ease',
          }}
        >
          <p style={{
            fontFamily: SANS, fontSize: 13, color: 'rgba(17,24,39,0.4)',
            lineHeight: 1.75, margin: '0 0 20px',
          }}>
            {t('pp.note', L)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/minds-logo.png" alt="" style={{ height: 13, opacity: 0.2 }} />
            <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(17,24,39,0.28)', letterSpacing: '0.1em' }}>
              MINDS BY ANIMOCA BRANDS
            </span>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 12, color: 'rgba(17,24,39,0.32)', lineHeight: 1.7, margin: 0 }}>
            {t('pp.minds.note', L)}
          </p>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          .pp-grid { flex-direction: column !important; }
        }
      `}</style>
    </main>
  )
}
