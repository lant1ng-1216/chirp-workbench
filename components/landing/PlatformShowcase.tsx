'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

const ease = [0.22, 1, 0.36, 1] as const

function CoverMotion({
  src,
  alt,
  delay = 0,
}: {
  src: string
  alt: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ scale: 1.1, opacity: 0.35 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 1.15, delay, ease }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 980px) 45vw, 220px"
        style={{ objectFit: 'cover' }}
      />
    </motion.div>
  )
}

function NoteNode({ lang }: { lang: 'en' | 'zh' }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -18 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55, ease }}
      style={{
        width: '100%',
        maxWidth: 300,
        background: '#fff',
        border: '1px solid rgba(17,24,39,0.12)',
        borderRadius: 12,
        boxShadow: '0 10px 36px rgba(17,24,39,0.08)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        borderBottom: '1px solid rgba(17,24,39,0.08)',
        background: 'rgba(17,24,39,0.02)',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: 999, background: '#0EA5E9', flexShrink: 0,
        }} />
        <span style={{
          fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em',
          color: 'rgba(17,24,39,0.55)', textTransform: 'uppercase',
        }}>
          {t('showcase.noteTag', lang)}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: MONO, fontSize: 9, letterSpacing: '0.06em',
          color: '#fff', background: '#111827',
          padding: '3px 8px', borderRadius: 4,
        }}>
          {t('showcase.repurpose', lang)}
        </span>
      </div>
      <div style={{ padding: '14px 14px 16px' }}>
        <div style={{
          fontFamily: SANS, fontWeight: 600, fontSize: 14,
          color: '#111827', marginBottom: 8, letterSpacing: '-0.02em',
        }}>
          {t('showcase.noteTitle', lang)}
        </div>
        <p style={{
          fontFamily: SANS, fontSize: 12, color: 'rgba(17,24,39,0.55)',
          lineHeight: 1.65, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {t('showcase.noteBody', lang)}
        </p>
      </div>
    </motion.div>
  )
}

function OutYouTube({ lang }: { lang: 'en' | 'zh' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <Header name="YouTube" meta={t('showcase.yt.format', lang)} accent="#DC2626" />
      <div style={{
        flex: 1,
        border: '1px solid rgba(17,24,39,0.1)',
        borderRadius: 10,
        overflow: 'hidden',
        background: '#fff',
      }}>
        <div style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          background: '#111',
        }}>
          <CoverMotion src="/landing/yt-thumb.png" alt="" delay={0.05} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.35) 100%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{
              width: 34, height: 34, borderRadius: 999,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}>
              <span style={{
                width: 0, height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderLeft: '10px solid rgba(255,255,255,0.95)',
                marginLeft: 2,
              }} />
            </span>
          </div>
        </div>
        <p style={{
          fontFamily: SANS, fontSize: 11, color: 'rgba(17,24,39,0.58)',
          lineHeight: 1.55, margin: 0, padding: '10px 11px 12px',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {t('showcase.yt.preview', lang)}
        </p>
      </div>
    </div>
  )
}

function Avatar({ size = 18, ring = 'light' }: { size?: number; ring?: 'light' | 'dark' }) {
  return (
    <span style={{
      position: 'relative',
      width: size,
      height: size,
      borderRadius: 999,
      overflow: 'hidden',
      flexShrink: 0,
      background: 'rgba(17,24,39,0.08)',
      border: ring === 'dark'
        ? '1.5px solid rgba(255,255,255,0.9)'
        : '1px solid rgba(17,24,39,0.12)',
      boxSizing: 'border-box',
    }}>
      <Image
        src="/landing/creator-avatar.png"
        alt=""
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </span>
  )
}

function TtSideIcon({ children }: { children: ReactNode }) {
  return (
    <span style={{
      width: 22, height: 22, borderRadius: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)',
      border: '1px solid rgba(255,255,255,0.28)',
      backdropFilter: 'blur(2px)',
      color: '#fff',
    }}>
      {children}
    </span>
  )
}

function OutInstagram({ lang }: { lang: 'en' | 'zh' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <Header name="Instagram" meta={t('showcase.ig.format', lang)} accent="#DB2777" />
      <div style={{
        flex: 1,
        border: '1px solid rgba(17,24,39,0.1)',
        borderRadius: 10,
        overflow: 'hidden',
        background: '#fff',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
          borderBottom: '1px solid rgba(17,24,39,0.06)',
        }}>
          <Avatar size={20} />
          <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: '#111827' }}>
            you
          </span>
        </div>
        <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#e8e4dc' }}>
          <CoverMotion src="/landing/ig-post.png" alt="" delay={0.12} />
        </div>
        <p style={{
          fontFamily: SANS, fontSize: 11, color: 'rgba(17,24,39,0.58)',
          lineHeight: 1.5, margin: 0, padding: '8px 10px 10px',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', whiteSpace: 'pre-line',
        }}>
          {t('showcase.ig.preview', lang)}
        </p>
      </div>
    </div>
  )
}

function OutTikTok({ lang }: { lang: 'en' | 'zh' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <Header name="TikTok" meta={t('showcase.tt.format', lang)} accent="#111827" />
      <div style={{
        flex: 1, display: 'flex', justifyContent: 'center',
      }}>
        <div style={{
          width: 'min(100%, 148px)',
          aspectRatio: '9 / 16',
          borderRadius: 16,
          border: '2px solid #111827',
          background: '#0a0a0c',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 28px rgba(17,24,39,0.18)',
        }}>
          <CoverMotion src="/landing/tt-frame.png" alt="" delay={0.2} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.72) 100%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', left: 10, right: 36, bottom: 28,
            fontFamily: SANS, fontSize: 10, color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.45,
            display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 1px 4px rgba(0,0,0,0.45)',
          }}>
            {t('showcase.tt.preview', lang)}
          </div>
          <div style={{
            position: 'absolute', right: 7, bottom: 32,
            display: 'flex', flexDirection: 'column', gap: 11, alignItems: 'center',
          }}>
            <span style={{
              position: 'relative',
              width: 24, height: 24, borderRadius: 999,
              overflow: 'hidden',
              border: '1.5px solid #fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            }}>
              <Image
                src="/landing/creator-avatar.png"
                alt=""
                width={24}
                height={24}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </span>
            <TtSideIcon>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 21s-7.2-4.35-9.6-8.1C.6 10.05 1.65 6.6 4.8 5.55 6.75 4.9 9.15 6.3 12 9c2.85-2.7 5.25-3.1 7.2-1.45 3.15 1.05 4.2 4.5 2.4 7.35C19.2 16.65 12 21 12 21z" />
              </svg>
            </TtSideIcon>
            <TtSideIcon>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.2 0-2.35-.25-3.4-.7L3 21l1.3-5.7A8.5 8.5 0 1 1 21 12z" strokeLinejoin="round" />
              </svg>
            </TtSideIcon>
            <TtSideIcon>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" strokeLinecap="round" />
                <path d="M12 3v12" strokeLinecap="round" />
                <path d="M7 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </TtSideIcon>
          </div>
        </div>
      </div>
    </div>
  )
}

function OutX({ lang }: { lang: 'en' | 'zh' }) {
  const lines = t('showcase.x.preview', lang).split('\n').filter(Boolean)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <Header name="X" meta={t('showcase.x.format', lang)} accent="#0EA5E9" />
      <div style={{
        flex: 1,
        border: '1px solid rgba(17,24,39,0.1)',
        borderRadius: 10,
        background: '#fff',
        padding: '12px 12px 14px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {lines.slice(0, 3).map((line, i) => (
          <div key={i} style={{
            paddingBottom: i < 2 ? 10 : 0,
            borderBottom: i < 2 ? '1px solid rgba(17,24,39,0.06)' : 'none',
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{
                width: 16, height: 16, borderRadius: 999,
                background: 'rgba(17,24,39,0.12)', flexShrink: 0, marginTop: 1,
              }} />
              <p style={{
                fontFamily: SANS, fontSize: 11,
                color: i === 0 ? '#111827' : 'rgba(17,24,39,0.55)',
                fontWeight: i === 0 ? 500 : 400,
                lineHeight: 1.5, margin: 0,
              }}>
                {line}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Header({ name, meta, accent }: { name: string; meta: string; accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{
        width: 6, height: 6, borderRadius: 999, background: accent, flexShrink: 0,
      }} />
      <span style={{
        fontFamily: SANS, fontWeight: 600, fontSize: 12, color: '#111827',
      }}>
        {name}
      </span>
      <span style={{
        fontFamily: MONO, fontSize: 8, color: 'rgba(17,24,39,0.38)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        {meta}
      </span>
    </div>
  )
}

export default function PlatformShowcase() {
  const { lang } = useMingStore()

  return (
    <section
      id="platforms"
      style={{
        background: '#ffffff',
        padding: '80px 32px 88px',
        borderTop: '1px solid rgba(17,24,39,0.05)',
        borderBottom: '1px solid rgba(17,24,39,0.05)',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease }}
          style={{ maxWidth: 560, marginBottom: 36 }}
        >
          <div style={{
            fontFamily: MONO, fontSize: 9, color: 'rgba(17,24,39,0.38)',
            letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14,
          }}>
            {t('showcase.eyebrow', lang)}
          </div>
          <h2 style={{
            fontFamily: SANS, fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 42px)',
            color: '#111827', lineHeight: 1.15, letterSpacing: '-0.03em',
            margin: '0 0 14px',
          }}>
            {t('showcase.h2a', lang)}
            <br />
            <span style={{ fontWeight: 300, color: 'rgba(17,24,39,0.42)' }}>
              {t('showcase.h2b', lang)}
            </span>
          </h2>
          <p style={{
            fontFamily: SANS, fontSize: 15, color: 'rgba(17,24,39,0.5)',
            lineHeight: 1.7, margin: 0,
          }}>
            {t('showcase.sub', lang)}
          </p>
        </motion.div>

        {/* Product stage: note → split → four native surfaces */}
        <div
          className="showcase-stage"
          style={{
            position: 'relative',
            borderRadius: 20,
            border: '1px solid rgba(17,24,39,0.08)',
            background: `
              radial-gradient(ellipse 80% 60% at 15% 40%, rgba(14,165,233,0.06) 0%, transparent 55%),
              linear-gradient(180deg, #f7f7f8 0%, #eef0f3 100%)
            `,
            padding: '28px 24px 24px',
            overflow: 'hidden',
          }}
        >
          {/* faint canvas dots */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
            backgroundImage: 'radial-gradient(rgba(17,24,39,0.12) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }} />

          <div className="showcase-flow" style={{
            position: 'relative', zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 280px) 36px minmax(0, 1fr)',
            gap: 8,
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <NoteNode lang={lang} />
            </div>

            {/* Split connector */}
            <motion.div
              initial={{ opacity: 0, scaleY: 0.6 }}
              whileInView={{ opacity: 1, scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease }}
              aria-hidden
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '70%', minHeight: 120,
              }}
            >
              <svg width="36" height="160" viewBox="0 0 36 160" fill="none">
                <path
                  d="M2 80 H14 M14 80 C22 80 22 28 34 28 M14 80 C22 80 22 132 34 132 M14 80 C20 80 22 54 34 54 M14 80 C20 80 22 106 34 106"
                  stroke="rgba(17,24,39,0.28)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>

            <div className="showcase-outs" style={{
              display: 'grid',
              gridTemplateColumns: '1.15fr 0.95fr 0.85fr 1.05fr',
              gap: 14,
              alignItems: 'stretch',
              minHeight: 280,
            }}>
              {[OutYouTube, OutInstagram, OutTikTok, OutX].map((Comp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: 0.25 + i * 0.08, ease }}
                  style={{ minWidth: 0 }}
                >
                  <Comp lang={lang} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <p style={{
          marginTop: 28,
          fontFamily: MONO, fontSize: 9,
          color: 'rgba(17,24,39,0.32)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          {t('showcase.credit', lang)}
        </p>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .showcase-flow {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .showcase-flow > div:nth-child(2) {
            display: none !important;
          }
          .showcase-outs {
            grid-template-columns: 1fr 1fr !important;
            min-height: 0 !important;
          }
        }
        @media (max-width: 560px) {
          .showcase-outs {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
