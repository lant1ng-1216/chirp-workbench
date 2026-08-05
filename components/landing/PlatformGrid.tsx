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
  border2:'rgba(17,24,39,0.14)',
  shadow: '0 1px 3px rgba(17,24,39,0.06),0 4px 12px rgba(17,24,39,0.04)',
}
const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

const PLATFORMS = [
  { id: 'youtube',   name: 'YouTube',     tagKey: 'platforms.yt.tag', color: '#FF0000', slug: 'youtube' },
  { id: 'instagram', name: 'Instagram',   tagKey: 'platforms.ig.tag', color: '#E1306C', slug: 'instagram' },
  { id: 'tiktok',    name: 'TikTok',      tagKey: 'platforms.tt.tag', color: '#010101', slug: 'tiktok' },
  { id: 'twitter',   name: 'X (Twitter)', tagKey: 'platforms.x.tag',  color: '#1D9BF0', slug: 'x' },
  { id: 'telegram',  name: 'Telegram',    tagKey: 'platforms.tg.tag', color: '#2AABEE', slug: 'telegram' },
]

type Platform = typeof PLATFORMS[0]

function PlatformCell({ p, delay, lang }: { p: Platform; delay: number; lang: 'en' | 'zh' }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '24px 22px 22px',
        background: hovered ? `${p.color}0f` : '#fff',
        border: `1px solid ${hovered ? p.color + '40' : C.border2}`,
        borderRadius: 14,
        cursor: 'default',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? `0 4px 20px ${p.color}18` : C.shadow,
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-3px)' : 'none') : 'translateY(14px)',
        transitionDelay: visible ? '0ms' : `${delay}ms`,
      }}
    >
      <div style={{ width: 36, height: 36, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={`https://cdn.simpleicons.org/${p.slug}`}
          alt={p.name}
          width={30} height={30}
          style={{
            display: 'block',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.2s ease',
          }}
        />
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 6 }}>{p.name}</div>
      <div style={{ fontFamily: MONO, fontSize: 9, color: hovered ? p.color : C.ink4, letterSpacing: '0.07em', transition: 'color 0.2s' }}>{t(p.tagKey, lang)}</div>
    </div>
  )
}

export default function PlatformGrid() {
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
    <section id="platforms" style={{ background: C.bg, padding: '120px 32px 100px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div ref={headerRef} style={{ marginBottom: 56,
          opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.18em', marginBottom: 16, textTransform: 'uppercase' as const }}>{t('platforms.eyebrow', lang)}</div>
          <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(26px, 4vw, 42px)', color: C.ink, lineHeight: 1.15, margin: 0, letterSpacing: '-0.02em' }}>
            {t('platforms.h2a', lang)}<span style={{ fontWeight: 300, color: C.ink4 }}>{t('platforms.h2b', lang)}</span>
          </h2>
          <p style={{ fontFamily: SANS, fontWeight: 400, marginTop: 14, fontSize: 15, color: C.ink3, lineHeight: 1.75 }}>
            {t('platforms.sub', lang)}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {PLATFORMS.map((p, i) => (
            <PlatformCell key={p.id} p={p} delay={i * 60} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  )
}
