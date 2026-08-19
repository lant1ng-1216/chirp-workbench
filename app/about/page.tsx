'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"
const INK1 = 'rgba(0,0,0,0.82)'
const INK3 = 'rgba(0,0,0,0.38)'
const INK4 = 'rgba(0,0,0,0.22)'
const RULE = 'rgba(0,0,0,0.07)'

const BASE_IMG = 'https://soft-zoom-63098134.figma.site/_assets/v11/5c9f982199fde1d9b85a20e5396f0fa7bacaf9a3.png?w=2560'
const REVEAL_IMG = 'https://soft-zoom-63098134.figma.site/_assets/v11/6be2165e31648955b4e071f4cf2a50bc572b9bfd.png?w=1536'
const SPOTLIGHT_R = 260

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect() }
    }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, vis }
}

function SpotlightHero({ lang }: { lang: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const revealRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const reveal = revealRef.current
    if (!canvas || !reveal) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const mouse = { x: -999, y: -999 }
    const smooth = { x: -999, y: -999 }
    let rafId: number

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    window.addEventListener('mousemove', onMove)

    function loop() {
      smooth.x += (mouse.x - smooth.x) * 0.1
      smooth.y += (mouse.y - smooth.y) * 0.1
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      const g = ctx!.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, SPOTLIGHT_R)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.4, 'rgba(255,255,255,1)')
      g.addColorStop(0.6, 'rgba(255,255,255,0.75)')
      g.addColorStop(0.75, 'rgba(255,255,255,0.4)')
      g.addColorStop(0.88, 'rgba(255,255,255,0.12)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx!.beginPath()
      ctx!.arc(smooth.x, smooth.y, SPOTLIGHT_R, 0, Math.PI * 2)
      ctx!.fillStyle = g
      ctx!.fill()
      const url = canvas!.toDataURL()
      reveal!.style.webkitMaskImage = `url(${url})`
      reveal!.style.maskImage = `url(${url})`
      reveal!.style.webkitMaskSize = '100% 100%'
      reveal!.style.maskSize = '100% 100%'
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <section style={{ position: 'relative', height: '100vh', minHeight: 700, overflow: 'hidden', background: '#E4E4E4' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${BASE_IMG})`, backgroundSize: 'cover', backgroundPosition: '60% center', zIndex: 1 }} />
      <div ref={revealRef} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${REVEAL_IMG})`, backgroundSize: 'cover', backgroundPosition: '60% center', zIndex: 2, pointerEvents: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, left: 0, right: 0, textAlign: 'center', zIndex: 3, pointerEvents: 'none', overflow: 'hidden' }}>
        <span style={{
          fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(140px, 22vw, 420px)',
          color: '#F4F1E8', letterSpacing: '-0.04em', lineHeight: 0.85, display: 'block', opacity: 0.55,
          animation: 'bigTextUp 1s cubic-bezier(0.16,1,0.3,1) 0.5s both',
        }}>
          Chirp
        </span>
      </div>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 4,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '160px 40px 80px', pointerEvents: 'none',
      }}>
        <div style={{
          maxWidth: 460, pointerEvents: 'auto',
          opacity: ready ? 1 : 0, transform: ready ? 'none' : 'translateY(16px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div style={{
            fontFamily: MONO, fontSize: 9, color: '#111111', opacity: 0.45,
            letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20,
          }}>
            {t('ap.eyebrow', lang as 'en' | 'zh')}
          </div>
          <h1 style={{
            fontFamily: SANS, fontWeight: 500, fontSize: 'clamp(24px, 3vw, 34px)',
            color: '#111111', lineHeight: 1.25, letterSpacing: '-0.02em',
          }}>
            {t('ap.h1a', lang as 'en' | 'zh')}{' '}
            <span style={{ opacity: 0.5 }}>{t('ap.h1b', lang as 'en' | 'zh')}</span>
          </h1>
        </div>
        <div style={{
          opacity: ready ? 0.35 : 0, transition: 'opacity 1s ease 0.8s',
          fontFamily: MONO, fontSize: 9, color: '#111111', letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          SCROLL TO READ ↓
        </div>
      </div>
      <style>{`
        @keyframes bigTextUp {
          from { transform: translateY(220px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 0.55; }
        }
      `}</style>
    </section>
  )
}

function AboutSection({
  eyebrowKey, h2Key, p1Key, p2Key, lang,
}: {
  eyebrowKey: string
  h2Key: string
  p1Key: string
  p2Key?: string
  lang: string
}) {
  const { ref, vis } = useScrollReveal()
  return (
    <div
      ref={ref}
      style={{
        maxWidth: 720, margin: '0 auto 96px',
        opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(24px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      <div style={{
        fontFamily: MONO, fontSize: 9, color: INK4, letterSpacing: '0.18em',
        textTransform: 'uppercase', marginBottom: 20,
      }}>
        {t(eyebrowKey, lang as 'en' | 'zh')}
      </div>
      <h2 style={{
        fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(24px, 3vw, 36px)',
        color: INK1, lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: 24,
      }}>
        {t(h2Key, lang as 'en' | 'zh')}
      </h2>
      <p style={{ fontFamily: SANS, fontSize: 15, color: INK3, lineHeight: 1.9, marginBottom: p2Key ? 18 : 0 }}>
        {t(p1Key, lang as 'en' | 'zh')}
      </p>
      {p2Key && (
        <p style={{ fontFamily: SANS, fontSize: 15, color: INK3, lineHeight: 1.9, margin: 0 }}>
          {t(p2Key, lang as 'en' | 'zh')}
        </p>
      )}
    </div>
  )
}

function BuildAndFit({ lang }: { lang: string }) {
  const L = lang as 'en' | 'zh'
  const build = useScrollReveal()
  const fit = useScrollReveal()
  const nextKeys = ['ap.build.n1', 'ap.build.n2', 'ap.build.n3'] as const
  const yesKeys = ['ap.fit.yes.1', 'ap.fit.yes.2', 'ap.fit.yes.3'] as const
  const noKeys = ['ap.fit.no.1', 'ap.fit.no.2', 'ap.fit.no.3'] as const

  return (
    <section style={{ background: '#f7f7f4', padding: '88px 32px 100px', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* A2 */}
        <div
          ref={build.ref}
          style={{
            marginBottom: 72,
            opacity: build.vis ? 1 : 0,
            transform: build.vis ? 'none' : 'translateY(18px)',
            transition: 'opacity 0.65s ease, transform 0.65s ease',
          }}
        >
          <div style={{
            fontFamily: MONO, fontSize: 9, color: INK4, letterSpacing: '0.18em',
            textTransform: 'uppercase', marginBottom: 16,
          }}>
            {t('ap.build.eyebrow', L)}
          </div>
          <h2 style={{
            fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(26px, 3.6vw, 38px)',
            color: INK1, lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 18px', maxWidth: 640,
          }}>
            {t('ap.build.h2', L)}
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 15, color: INK3, lineHeight: 1.85, margin: '0 0 14px', maxWidth: 680 }}>
            {t('ap.build.p1', L)}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 15, color: INK3, lineHeight: 1.85, margin: '0 0 32px', maxWidth: 680 }}>
            {t('ap.build.p2', L)}
          </p>

          <div style={{
            fontFamily: MONO, fontSize: 9, color: INK4, letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 14,
          }}>
            {t('ap.build.next', L)}
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 680 }}>
            {nextKeys.map((key, i) => (
              <li key={key} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily: MONO, fontSize: 11, color: INK4, width: 24, flexShrink: 0, paddingTop: 2,
                }}>
                  0{i + 1}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 14, color: INK1, lineHeight: 1.55 }}>
                  {t(key, L)}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* A3 */}
        <div
          ref={fit.ref}
          style={{
            opacity: fit.vis ? 1 : 0,
            transform: fit.vis ? 'none' : 'translateY(18px)',
            transition: 'opacity 0.65s ease 0.05s, transform 0.65s ease 0.05s',
          }}
        >
          <div style={{
            fontFamily: MONO, fontSize: 9, color: INK4, letterSpacing: '0.18em',
            textTransform: 'uppercase', marginBottom: 16,
          }}>
            {t('ap.fit.eyebrow', L)}
          </div>
          <h2 style={{
            fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(26px, 3.6vw, 38px)',
            color: INK1, lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 28px', maxWidth: 640,
          }}>
            {t('ap.fit.h2', L)}
          </h2>

          <div className="fit-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 40,
          }}>
            <div>
              <div style={{
                fontFamily: MONO, fontSize: 10, color: '#16a34a', letterSpacing: '0.1em',
                marginBottom: 14, textTransform: 'uppercase',
              }}>
                {t('ap.fit.yes.title', L)}
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {yesKeys.map(key => (
                  <li key={key} style={{
                    fontFamily: SANS, fontSize: 14, color: INK1, lineHeight: 1.55,
                    paddingLeft: 14, borderLeft: '2px solid rgba(22,163,74,0.45)',
                  }}>
                    {t(key, L)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{
                fontFamily: MONO, fontSize: 10, color: INK4, letterSpacing: '0.1em',
                marginBottom: 14, textTransform: 'uppercase',
              }}>
                {t('ap.fit.no.title', L)}
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {noKeys.map(key => (
                  <li key={key} style={{
                    fontFamily: SANS, fontSize: 14, color: INK3, lineHeight: 1.55,
                    paddingLeft: 14, borderLeft: `2px solid ${RULE}`,
                  }}>
                    {t(key, L)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
            paddingTop: 8, borderTop: `1px solid ${RULE}`,
          }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <button style={{
                fontFamily: SANS, fontWeight: 600, fontSize: 14,
                padding: '12px 22px', borderRadius: 10, border: 'none',
                background: '#111827', color: '#fff', cursor: 'pointer',
              }}>
                {t('ap.fit.cta.work', L)}
              </button>
            </Link>
            <Link href="/sponsors" style={{ textDecoration: 'none' }}>
              <button style={{
                fontFamily: SANS, fontWeight: 500, fontSize: 14,
                padding: '11px 20px', borderRadius: 10,
                border: '1.5px solid rgba(17,24,39,0.14)',
                background: 'transparent', color: 'rgba(17,24,39,0.65)', cursor: 'pointer',
              }}>
                {t('ap.fit.cta.sp', L)}
              </button>
            </Link>
            <Link
              href="/#product"
              style={{
                fontFamily: MONO, fontSize: 10, color: INK4, letterSpacing: '0.06em',
                marginLeft: 'auto', textDecoration: 'none',
              }}
            >
              {t('ap.fit.see', L)} →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .fit-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

export default function AboutPage() {
  const { lang } = useMingStore()

  return (
    <main style={{ background: '#ffffff' }}>
      <Navbar light />
      <SpotlightHero lang={lang} />
      <section style={{ padding: '96px 32px 0', background: '#ffffff' }}>
        <AboutSection eyebrowKey="ap.mission.eyebrow" h2Key="ap.mission.h2" p1Key="ap.mission.p1" p2Key="ap.mission.p2" lang={lang} />
        <div style={{ maxWidth: 720, margin: '0 auto 96px', borderTop: `1px solid ${RULE}` }} />
        <AboutSection eyebrowKey="ap.minds.eyebrow" h2Key="ap.minds.h2" p1Key="ap.minds.p1" p2Key="ap.minds.p2" lang={lang} />
        <div style={{ maxWidth: 720, margin: '-60px auto 96px', display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/minds-logo.png" alt="Minds by Animoca Brands" style={{ height: 18, opacity: 0.18 }} />
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(0,0,0,0.18)', letterSpacing: '0.12em' }}>
            MINDS BY ANIMOCA BRANDS
          </span>
        </div>
        <div style={{ maxWidth: 720, margin: '0 auto 96px', borderTop: `1px solid ${RULE}` }} />
        <AboutSection eyebrowKey="ap.jam.eyebrow" h2Key="ap.jam.h2" p1Key="ap.jam.p1" lang={lang} />
      </section>
      <BuildAndFit lang={lang} />
      <Footer />
    </main>
  )
}
