'use client'
import { useEffect, useRef, useState } from 'react'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const C = {
  bg:     '#ffffff',
  bg2:    '#f9fafb',
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

const STATS = [
  { statKey: 'pain.s1.stat', labelKey: 'pain.s1.label' },
  { statKey: 'pain.s2.stat', labelKey: 'pain.s2.label' },
  { statKey: 'pain.s3.stat', labelKey: 'pain.s3.label' },
]

const STEP_ICONS = [
  <svg key="s1" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  <svg key="s2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M20 2v4h-4"/><path d="M20 6a6 6 0 0 1-6 6"/></svg>,
  <svg key="s3" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M19 8l2 2-2 2"/></svg>,
  <svg key="s4" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
]
const STEP_KEYS = ['s1', 's2', 's3', 's4'] as const
const STEP_NUMS = ['01', '02', '03', '04']

const FEATURES = [
  {
    key: 'memory',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  },
  {
    key: 'autonomy',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  },
  {
    key: 'community',
    icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
]

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function SubLabel({ text }: { text: string }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.18em', textTransform: 'uppercase' as const, marginBottom: 20 }}>
      {text}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '56px 0' }} />
}

export default function CoreSection() {
  const { lang } = useMingStore()

  const header = useReveal(0.2)
  const pain = useReveal(0.1)
  const steps = useReveal(0.1)
  const feats = useReveal(0.1)

  return (
    <section id="why-chirp" style={{ background: C.bg, padding: '80px 32px 80px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Section header */}
        <div ref={header.ref} style={{
          marginBottom: 52,
          opacity: header.visible ? 1 : 0, transform: header.visible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          {/* Minds badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <img src="/minds-logo.png" alt="Minds by Animoca Brands" style={{ height: 16, opacity: 0.55, filter: 'invert(1)' }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.18em', textTransform: 'uppercase' as const }}>
              {t('core.eyebrow', lang)}
            </span>
          </div>

          <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(26px, 4vw, 42px)', color: C.ink, lineHeight: 1.15, margin: '0 0 18px', letterSpacing: '-0.02em' }}>
            {t('core.h2a', lang)}<br />
            <span style={{ fontWeight: 300, color: C.accent }}>{t('core.h2b', lang)}</span>
          </h2>

          <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 15, color: C.ink3, lineHeight: 1.75, maxWidth: 620, margin: 0 }}>
            {t('core.sub', lang)}
          </p>
        </div>

        {/* A: Pain stats */}
        <div ref={pain.ref}>
          <SubLabel text={t('core.pain.eyebrow', lang)} />

          <p style={{
            fontFamily: SANS, fontWeight: 400,
            fontSize: 'clamp(16px, 2.2vw, 20px)',
            color: C.ink2, lineHeight: 1.55,
            maxWidth: 600, marginBottom: 32,
            letterSpacing: '-0.01em',
            opacity: pain.visible ? 1 : 0, transform: pain.visible ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.55s ease, transform 0.55s ease',
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
                opacity: pain.visible ? 1 : 0,
                transform: pain.visible ? 'none' : 'translateY(16px)',
                transition: `opacity 0.5s ease ${i * 80 + 80}ms, transform 0.5s ease ${i * 80 + 80}ms`,
              }}>
                <div style={{
                  fontFamily: SANS, fontWeight: 700,
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  color: C.ink, letterSpacing: '-0.03em',
                  lineHeight: 1, marginBottom: 10,
                }}>
                  {t(statKey, lang)}
                </div>
                <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14, color: C.ink3, lineHeight: 1.6 }}>
                  {t(labelKey, lang)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* B: How it works — horizontal steps */}
        <div ref={steps.ref}>
          <SubLabel text={t('core.hiw.eyebrow', lang)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr 32px 1fr 32px 1fr', alignItems: 'start', gap: 0 }}>
            {STEP_KEYS.map((skey, i) => (
              <>
                <div key={skey} style={{
                  border: `1px solid ${C.border2}`,
                  borderRadius: 14,
                  padding: '22px 20px',
                  background: '#fff',
                  boxShadow: C.shadow,
                  opacity: steps.visible ? 1 : 0,
                  transform: steps.visible ? 'none' : 'translateY(16px)',
                  transition: `opacity 0.5s ease ${i * 90}ms, transform 0.5s ease ${i * 90}ms`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: C.al, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: C.accent, flexShrink: 0,
                    }}>
                      {STEP_ICONS[i]}
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: '0.06em' }}>
                      {STEP_NUMS[i]}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: C.ink, margin: '0 0 8px', lineHeight: 1.3 }}>
                    {t(`hiw.${skey}.title`, lang)}
                  </h3>
                  <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 12, color: C.ink3, lineHeight: 1.7, margin: 0 }}>
                    {t(`hiw.${skey}.desc`, lang)}
                  </p>
                </div>
                {i < 3 && (
                  <div key={`arrow-${i}`} style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: 28, color: C.ink4,
                  }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M13 6l6 6-6 6"/>
                    </svg>
                  </div>
                )}
              </>
            ))}
          </div>
        </div>

        <Divider />

        {/* C: Features */}
        <div ref={feats.ref}>
          <SubLabel text={t('core.feat.eyebrow', lang)} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map(({ key, icon }, i) => (
              <FeatureCard key={key} fkey={key} icon={icon} index={i} lang={lang} visible={feats.visible} />
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

function FeatureCard({ fkey, icon, index, lang, visible }: { fkey: string; icon: React.ReactNode; index: number; lang: 'en' | 'zh'; visible: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '32px 28px',
        border: `1px solid ${hovered ? 'rgba(59,130,246,0.3)' : C.border2}`,
        borderLeft: `4px solid ${hovered ? C.accent : 'rgba(59,130,246,0.2)'}`,
        boxShadow: hovered ? '0 8px 32px rgba(17,24,39,0.1)' : C.shadow,
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition: 'all 0.22s ease',
        cursor: 'default',
        display: 'flex', flexDirection: 'column', gap: 14,
        opacity: visible ? 1 : 0,
        transitionDelay: visible ? `${index * 90}ms` : '0ms',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: hovered ? C.al2 : C.al,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.accent, transition: 'background 0.2s', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: hovered ? C.accent : C.ink4, letterSpacing: '0.14em', transition: 'color 0.2s' }}>
        {t(`feat3.${fkey}.tag`, lang)}
      </div>
      <h3 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 20, color: C.ink, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
        {t(`feat3.${fkey}.title`, lang)}
      </h3>
      <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14, color: C.ink3, lineHeight: 1.8, margin: 0 }}>
        {t(`feat3.${fkey}.desc`, lang)}
      </p>
      <div style={{
        marginTop: 'auto', paddingTop: 14,
        borderTop: `1px solid ${hovered ? 'rgba(59,130,246,0.15)' : 'rgba(17,24,39,0.06)'}`,
        fontFamily: MONO, fontSize: 9, color: hovered ? C.accent : C.ink4,
        letterSpacing: '0.08em', transition: 'all 0.2s',
      }}>
        {t(`feat3.${fkey}.detail`, lang)}
      </div>
    </div>
  )
}
