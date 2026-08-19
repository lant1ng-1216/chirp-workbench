'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export default function ProductIntro() {
  const { lang } = useMingStore()
  const bullets = ['intro.bullet1', 'intro.bullet2', 'intro.bullet3'] as const

  return (
    <section
      id="product"
      style={{
        background: '#ffffff',
        padding: '88px 32px 72px',
        borderBottom: '1px solid rgba(17,24,39,0.06)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
          gap: 48,
          alignItems: 'center',
        }}>
          <div>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              custom={0}
              variants={fadeUp}
              style={{
                fontFamily: MONO, fontSize: 9, color: 'rgba(17,24,39,0.35)',
                letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 18,
              }}
            >
              {t('intro.eyebrow', lang)}
            </motion.div>

            <motion.h2
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              custom={1}
              variants={fadeUp}
              style={{
                fontFamily: SANS, fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 42px)',
                color: '#111827', lineHeight: 1.15, letterSpacing: '-0.03em',
                margin: '0 0 20px',
              }}
            >
              {t('intro.h2a', lang)}
              <br />
              <span style={{ fontWeight: 300, color: 'rgba(17,24,39,0.42)' }}>
                {t('intro.h2b', lang)}
              </span>
            </motion.h2>

            <motion.p
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              custom={2}
              variants={fadeUp}
              style={{
                fontFamily: SANS, fontSize: 15, color: 'rgba(17,24,39,0.55)',
                lineHeight: 1.85, margin: '0 0 14px', maxWidth: 520,
              }}
            >
              {t('intro.p1', lang)}
            </motion.p>

            <motion.p
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              custom={3}
              variants={fadeUp}
              style={{
                fontFamily: SANS, fontSize: 15, color: 'rgba(17,24,39,0.45)',
                lineHeight: 1.85, margin: '0 0 28px', maxWidth: 520,
              }}
            >
              {t('intro.p2', lang)}
            </motion.p>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bullets.map((key, i) => (
                <motion.li
                  key={key}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.4 }}
                  custom={4 + i}
                  variants={fadeUp}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    fontFamily: SANS, fontSize: 14, color: '#111827', lineHeight: 1.5,
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: 999, marginTop: 7, flexShrink: 0,
                    background: '#3b82f6',
                  }} />
                  {t(key, lang)}
                </motion.li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'relative' }}
          >
            <div style={{
              borderRadius: 18,
              overflow: 'hidden',
              border: '1px solid rgba(17,24,39,0.08)',
              background: '#fff',
              boxShadow: '0 12px 40px rgba(17,24,39,0.06)',
            }}>
              <Image
                src="/landing/canvas-graph.png"
                alt={t('intro.caption', lang)}
                width={1600}
                height={900}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                priority={false}
              />
            </div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35, duration: 0.45 }}
              style={{
                fontFamily: MONO, fontSize: 10, color: 'rgba(17,24,39,0.35)',
                letterSpacing: '0.08em', marginTop: 14, textAlign: 'center',
              }}
            >
              {t('intro.caption', lang)}
            </motion.p>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          #product > div > div {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
        }
      `}</style>
    </section>
  )
}
