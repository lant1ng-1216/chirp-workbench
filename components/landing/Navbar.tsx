'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: scrolled ? 'rgba(8,8,16,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'background 0.35s, border-color 0.35s',
        display: 'flex', alignItems: 'center', padding: '0 32px',
        overflow: 'visible',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
          <div style={{ width: 120, height: 120, position: 'relative', flexShrink: 0, marginRight: -28 }}>
            <Image src="/logo.png" alt="Ming" fill style={{ objectFit: 'contain', objectPosition: 'center' }} />
          </div>
          <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.02em' }}>鸣</span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(255,255,255,0.28)', marginLeft: 6, letterSpacing: '0.06em', marginTop: 2 }}>Ming</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
          {[['功能', '#features'], ['平台', '#platforms'], ['流程', '#howitworks']].map(([label, href]) => (
            <a key={label} href={href} style={{
              fontFamily: SERIF, fontWeight: 300, padding: '5px 16px', borderRadius: 7,
              fontSize: 14, color: 'rgba(255,255,255,0.42)', textDecoration: 'none',
              transition: 'color 0.15s, background 0.15s', letterSpacing: '0.02em',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.88)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.42)'; e.currentTarget.style.background = 'transparent' }}
            >{label}</a>
          ))}
        </div>

        {/* CTA */}
        <Link href="/onboarding" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <button style={{
            fontFamily: SERIF, padding: '8px 20px', borderRadius: 8,
            fontSize: 13, letterSpacing: '0.03em',
            background: 'rgba(255,255,255,0.96)', color: '#080810',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            transition: 'opacity 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
          >开始使用</button>
        </Link>
      </nav>
    </>
  )
}
