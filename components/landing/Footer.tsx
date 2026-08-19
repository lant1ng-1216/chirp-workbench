'use client'
import Link from 'next/link'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

export default function Footer() {
  const { lang } = useMingStore()

  const COLS = [
    {
      titleKey: 'footer.col1',
      links: [
        { key: 'footer.l.features',   href: '/about' },
        { key: 'footer.l.pricing',    href: '/pricing' },
        { key: 'footer.l.howitworks', href: '/#howitworks' },
        { key: 'footer.l.sponsors',   href: '/sponsors' },
      ],
    },
    {
      titleKey: 'footer.col2',
      links: [
        { key: 'footer.l.docs',        href: '#' },
        { key: 'footer.l.videotour',   href: '#' },
        { key: 'footer.l.casestudies', href: '#' },
        { key: 'footer.l.blog',        href: '#' },
      ],
    },
    {
      titleKey: 'footer.col3',
      links: [
        { key: 'footer.l.about',   href: '/about' },
        { key: 'footer.l.sponsors', href: '/sponsors' },
        { key: 'footer.l.contact', href: 'mailto:zfu9751@gmail.com' },
        { key: 'footer.l.privacy', href: '#' },
      ],
    },
  ]

  return (
    <footer style={{ background: '#111827', padding: '64px 32px 44px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <img src="/logo.png" alt="Chirp" style={{ width: 100, height: 100, objectFit: 'contain', marginRight: -30 }} />
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,0.88)' }}>Chirp</span>
            </div>
            <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 13, color: 'rgba(255,255,255,0.28)', lineHeight: 1.75, maxWidth: 240, margin: 0 }}>
              {t('footer.tagline', lang)}
            </p>
          </div>
          {COLS.map(col => (
            <div key={col.titleKey}>
              <h4 style={{ fontFamily: MONO, fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, margin: '0 0 18px 0' }}>{t(col.titleKey, lang)}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {col.links.map(l => (
                  <a key={l.key} href={l.href} style={{ fontFamily: SANS, fontWeight: 400, fontSize: 13, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                  >{t(l.key, lang)}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.16)', letterSpacing: '0.06em' }}>{t('footer.copy', lang)}</span>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <button style={{
              fontFamily: SANS, fontWeight: 600, padding: '8px 20px', borderRadius: 8,
              fontSize: 13, background: 'rgba(255,255,255,0.95)', color: '#111827',
              border: 'none', cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >{t('footer.cta', lang)}</button>
          </Link>
        </div>
      </div>
    </footer>
  )
}
