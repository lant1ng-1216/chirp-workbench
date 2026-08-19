'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

export default function Navbar({ light = false }: { light?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const { lang, setLang } = useMingStore()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const dashboardHref = '/dashboard'

  const ink        = light ? 'rgba(0,0,0,0.75)'  : 'rgba(255,255,255,0.95)'
  const inkMuted   = light ? 'rgba(0,0,0,0.38)'  : 'rgba(255,255,255,0.45)'
  const inkHover   = light ? 'rgba(0,0,0,0.82)'  : 'rgba(255,255,255,0.88)'
  const toggleBg   = light ? 'rgba(0,0,0,0.04)'  : 'rgba(255,255,255,0.06)'
  const toggleBgHv = light ? 'rgba(0,0,0,0.08)'  : 'rgba(255,255,255,0.12)'
  const toggleBd   = light ? 'rgba(0,0,0,0.1)'   : 'rgba(255,255,255,0.1)'
  const toggleClr  = light ? 'rgba(0,0,0,0.38)'  : 'rgba(255,255,255,0.4)'
  const toggleClrH = light ? 'rgba(0,0,0,0.7)'   : 'rgba(255,255,255,0.7)'

  const navBg = scrolled
    ? light
      ? 'rgba(255,255,255,0.94)'
      : 'rgba(8,8,16,0.92)'
    : 'transparent'
  const navBorder = scrolled
    ? light
      ? '1px solid rgba(0,0,0,0.07)'
      : '1px solid rgba(255,255,255,0.07)'
    : 'none'

  const ctaBg  = light ? '#080810'              : 'rgba(255,255,255,0.96)'
  const ctaClr = light ? 'rgba(255,255,255,0.95)' : '#080810'

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64,
      background: navBg,
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: navBorder,
      transition: 'background 0.35s, border-color 0.35s',
      display: 'flex', alignItems: 'center', padding: '0 32px', gap: 24,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <img src="/logo.png" alt="Chirp" style={{ width: 100, height: 100, objectFit: 'contain', marginRight: -30 }} />
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 20, color: ink, letterSpacing: '-0.3px' }}>Chirp</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {([
          { key: 'nav.dashboard', href: dashboardHref },
          { key: 'nav.pricing',   href: '/pricing' },
          { key: 'nav.about',     href: '/about' },
          { key: 'nav.sponsors',  href: '/sponsors' },
        ] as { key: string; href: string }[]).map(link => (
          <Link key={link.key} href={link.href} style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: SANS, fontWeight: 500, fontSize: 13,
              color: inkMuted, padding: '6px 12px', borderRadius: 8,
              transition: 'color 0.15s', display: 'block',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { e.currentTarget.style.color = inkHover }}
            onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { e.currentTarget.style.color = inkMuted }}
            >{t(link.key, lang)}</span>
          </Link>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right: lang toggle + CTA */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          style={{
            fontFamily: MONO, fontSize: 10, padding: '5px 10px', borderRadius: 6,
            background: toggleBg, border: `1px solid ${toggleBd}`,
            color: toggleClr, cursor: 'pointer', letterSpacing: '0.06em',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = toggleBgHv; e.currentTarget.style.color = toggleClrH }}
          onMouseLeave={e => { e.currentTarget.style.background = toggleBg;   e.currentTarget.style.color = toggleClr }}
        >
          {lang === 'en' ? 'EN | 中' : '中 | EN'}
        </button>

        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <button style={{
            fontFamily: SANS, fontWeight: 600, padding: '8px 18px', borderRadius: 8,
            fontSize: 13, background: ctaBg, color: ctaClr,
            border: 'none', cursor: 'pointer',
            boxShadow: light ? '0 2px 12px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.25)',
            transition: 'opacity 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
          >{t('nav.getstarted', lang)}</button>
        </Link>
      </div>
    </nav>
  )
}
