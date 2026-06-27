'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Features from '@/components/landing/Features'
import PlatformGrid from '@/components/landing/PlatformGrid'
import Footer from '@/components/landing/Footer'

const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"

export default function LandingPage() {
  return (
    <main style={{ background: '#faf9f7', position: 'relative' }}>
      <style>{`
        @keyframes floatY { 0%,100%{transform:translate(-50%,0)} 50%{transform:translate(-50%,-8px)} }
        @keyframes ctaGlow { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0)} 50%{box-shadow:0 0 40px 8px rgba(255,255,255,0.06)} }
      `}</style>

      <Navbar />

      {/* Hero — dark, video inside */}
      <Hero />

      {/* Transition: dark → warm */}
      <div style={{ height: 80, background: 'linear-gradient(to bottom, #080810, #faf9f7)', flexShrink: 0 }} />

      {/* Warm content area */}
      <HowItWorks />
      <Features />
      <PlatformGrid />
      <CtaSection />
      <Footer />
    </main>
  )
}

function CtaSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section style={{ background: '#1c3a2e', padding: '100px 32px 110px' }}>
      <div
        ref={ref}
        style={{
          maxWidth: 720, margin: '0 auto', textAlign: 'center',
          opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        {/* Eyebrow */}
        <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: 28 }}>GET STARTED</div>

        {/* Heading */}
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1.15, marginBottom: 20, letterSpacing: '0.01em' }}>
          你的产品，<br />
          <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.32)' }}>值得被全世界看见</span>
        </h2>

        {/* Sub */}
        <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 15, color: 'rgba(255,255,255,0.38)', lineHeight: 1.9, marginBottom: 44 }}>
          现在粘贴产品链接。30 秒后，鸣开始为你工作。<br />
          完全免费，无需注册。
        </p>

        {/* CTA */}
        <Link href="/onboarding" style={{ textDecoration: 'none' }}>
          <button
            style={{
              fontFamily: SERIF, padding: '16px 44px', borderRadius: 12,
              background: 'rgba(255,255,255,0.97)', color: '#1c3a2e',
              border: 'none', cursor: 'pointer', fontSize: 16,
              letterSpacing: '0.03em', fontWeight: 600,
              boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
              transition: 'opacity 0.18s, transform 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
          >立即免费使用 →</button>
        </Link>

        {/* Fine print */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          {['免费开始', '无需注册', '30 秒建立品牌档案'].map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {i > 0 && <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.12)', display: 'inline-block' }} />}
              <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
