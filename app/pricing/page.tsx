'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"
const BLUE = '#3b82f6'

type Lang = 'en' | 'zh'

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return { ref, vis }
}

function CheckIcon({ active }: { active: boolean }) {
  if (!active) return (
    <span style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(0,0,0,0.15)', lineHeight: 1 }}>—</span>
  )
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7.5" cy="7.5" r="7.5" fill={BLUE} fillOpacity="0.12" />
      <path d="M4.5 8l2 2 4-4" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PLANS = [
  {
    key: 'pp.free' as const,
    popular: false,
    origPrice: null,
    features: [
      { key: 'pp.feat.memory',    has: true  },
      { key: 'pp.feat.platforms', has: true  },
      { key: 'pp.feat.workshop',  has: true  },
      { key: 'pp.feat.calendar',  has: true  },
      { key: 'pp.feat.telegram',  has: true,  note: '1 group' },
      { key: 'pp.feat.analytics', has: true  },
      { key: 'pp.feat.priority',  has: false },
      { key: 'pp.feat.advanced',  has: false },
      { key: 'pp.feat.team',      has: false },
      { key: 'pp.feat.roles',     has: false },
    ],
  },
  {
    key: 'pp.pro' as const,
    popular: true,
    origPrice: '$19',
    features: [
      { key: 'pp.feat.memory',    has: true  },
      { key: 'pp.feat.platforms', has: true  },
      { key: 'pp.feat.workshop',  has: true  },
      { key: 'pp.feat.calendar',  has: true  },
      { key: 'pp.feat.telegram',  has: true,  note: '5 groups' },
      { key: 'pp.feat.analytics', has: true  },
      { key: 'pp.feat.priority',  has: true  },
      { key: 'pp.feat.advanced',  has: true  },
      { key: 'pp.feat.team',      has: false },
      { key: 'pp.feat.roles',     has: false },
    ],
  },
  {
    key: 'pp.team' as const,
    popular: false,
    origPrice: '$199',
    features: [
      { key: 'pp.feat.memory',    has: true  },
      { key: 'pp.feat.platforms', has: true  },
      { key: 'pp.feat.workshop',  has: true  },
      { key: 'pp.feat.calendar',  has: true  },
      { key: 'pp.feat.telegram',  has: true,  note: 'Unlimited' },
      { key: 'pp.feat.analytics', has: true  },
      { key: 'pp.feat.priority',  has: true  },
      { key: 'pp.feat.advanced',  has: true  },
      { key: 'pp.feat.team',      has: true  },
      { key: 'pp.feat.roles',     has: true  },
    ],
  },
]

function PlanCard({ plan, lang, delay }: { plan: typeof PLANS[number]; lang: Lang; delay: number }) {
  const { ref, vis } = useReveal(0.05)
  const isPopular = plan.popular

  return (
    <div ref={ref} style={{
      flex: 1,
      border: isPopular ? `1.5px solid ${BLUE}40` : '1.5px solid rgba(0,0,0,0.08)',
      borderTop: isPopular ? `3px solid ${BLUE}` : '1.5px solid rgba(0,0,0,0.08)',
      borderRadius: 16,
      background: isPopular ? `linear-gradient(160deg, ${BLUE}06 0%, #fff 60%)` : '#fff',
      padding: '32px 28px 28px',
      boxShadow: isPopular
        ? `0 8px 40px ${BLUE}18, 0 1px 3px rgba(0,0,0,0.04)`
        : '0 1px 3px rgba(0,0,0,0.04)',
      position: 'relative',
      opacity: vis ? 1 : 0,
      transform: vis ? 'none' : 'translateY(20px)',
      transition: `opacity 0.6s ${delay}ms ease, transform 0.6s ${delay}ms ease`,
    }}>
      {isPopular && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: BLUE, borderRadius: 100, padding: '3px 14px',
          fontFamily: MONO, fontSize: 8, color: '#fff', letterSpacing: '0.12em',
          whiteSpace: 'nowrap', boxShadow: `0 2px 12px ${BLUE}40`,
        }}>
          MOST POPULAR
        </div>
      )}

      {/* Plan name */}
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: isPopular ? BLUE : 'rgba(0,0,0,0.3)', marginBottom: 16 }}>
        {t(`${plan.key}.name`, lang)}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 10 }}>
        {plan.origPrice && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 18, letterSpacing: '-0.02em', color: 'rgba(0,0,0,0.2)', textDecoration: 'line-through', lineHeight: 1 }}>
              {plan.origPrice}
            </span>
            <span style={{ fontFamily: SANS, fontSize: 12, color: 'rgba(0,0,0,0.18)', textDecoration: 'line-through' }}>
              {t(`${plan.key}.period`, lang)}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, letterSpacing: '-0.04em', color: isPopular ? BLUE : 'rgba(0,0,0,0.85)', lineHeight: 1 }}>
            {plan.origPrice ? '$0' : t(`${plan.key}.price`, lang)}
          </span>
          <span style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(0,0,0,0.3)' }}>
            {plan.origPrice ? 'during beta' : t(`${plan.key}.period`, lang)}
          </span>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(0,0,0,0.42)', lineHeight: 1.65, marginBottom: 24, minHeight: 44 }}>
        {t(`${plan.key}.desc`, lang)}
      </p>

      {/* CTA */}
      <Link href="/onboarding" style={{ textDecoration: 'none', display: 'block', marginBottom: 28 }}>
        <button style={{
          width: '100%', fontFamily: SANS, fontWeight: 600, fontSize: 14,
          padding: '12px 0', borderRadius: 10,
          background: isPopular ? BLUE : 'transparent',
          color: isPopular ? '#fff' : 'rgba(0,0,0,0.65)',
          border: isPopular ? 'none' : '1.5px solid rgba(0,0,0,0.14)',
          cursor: 'pointer', transition: 'opacity 0.15s, transform 0.15s',
          boxShadow: isPopular ? `0 4px 20px ${BLUE}35` : 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'none' }}
        >{t(`${plan.key}.cta`, lang)}</button>
      </Link>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 24 }}>
        <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(0,0,0,0.2)', letterSpacing: '0.12em', marginBottom: 14 }}>
          INCLUDED
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {plan.features.map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckIcon active={f.has} />
              <span style={{ fontFamily: SANS, fontSize: 13, color: f.has ? 'rgba(0,0,0,0.58)' : 'rgba(0,0,0,0.2)', lineHeight: 1.3, flex: 1 }}>
                {t(f.key, lang)}
              </span>
              {'note' in f && f.note && f.has && (
                <span style={{ fontFamily: MONO, fontSize: 9, color: isPopular ? BLUE : 'rgba(0,0,0,0.3)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {f.note}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const { lang } = useMingStore()
  const hero = useReveal(0.1)
  const note = useReveal(0.1)

  return (
    <main style={{ background: '#ffffff', minHeight: '100vh' }}>
      <Navbar light />

      {/* Hero */}
      <section style={{ padding: '128px 32px 64px', textAlign: 'center' }}>
        <div ref={hero.ref} style={{ maxWidth: 600, margin: '0 auto', opacity: hero.vis ? 1 : 0, transform: hero.vis ? 'none' : 'translateY(20px)', transition: 'opacity 0.65s ease, transform 0.65s ease' }}>

          {/* Beta badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${BLUE}0d`, border: `1px solid ${BLUE}30`, borderRadius: 100, padding: '6px 16px', marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: BLUE, display: 'inline-block' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: BLUE, letterSpacing: '0.06em' }}>
              {t('pp.beta.badge', lang as Lang)}
            </span>
          </div>

          <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(0,0,0,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
            {t('pp.eyebrow', lang as Lang)}
          </div>

          <h1 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(34px, 5vw, 52px)', color: 'rgba(0,0,0,0.88)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            {t('pp.h1a', lang as Lang)}<br />
            <span style={{ fontWeight: 300, color: 'rgba(0,0,0,0.25)' }}>{t('pp.h1b', lang as Lang)}</span>
          </h1>

          <p style={{ fontFamily: SANS, fontSize: 15, color: 'rgba(0,0,0,0.38)', lineHeight: 1.8 }}>
            {t('pp.sub', lang as Lang)}
          </p>
        </div>
      </section>

      {/* Cards */}
      <section style={{ padding: '0 40px 100px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.key} plan={plan} lang={lang as Lang} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* Minds note */}
      <section style={{ padding: '0 32px 100px' }}>
        <div ref={note.ref} style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 48, opacity: note.vis ? 1 : 0, transition: 'opacity 0.7s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
            <img src="/minds-logo.png" alt="Minds" style={{ height: 14, opacity: 0.18 }} />
            <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(0,0,0,0.18)', letterSpacing: '0.12em' }}>MINDS BY ANIMOCA BRANDS</span>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(0,0,0,0.28)', lineHeight: 1.8 }}>
            {t('pp.minds.note', lang as Lang)}
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
