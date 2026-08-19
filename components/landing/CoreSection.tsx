'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const STATS = [
  { statKey: 'pain.s1.stat' as const, labelKey: 'pain.s1.label' as const },
  { statKey: 'pain.s2.stat' as const, labelKey: 'pain.s2.label' as const },
  { statKey: 'pain.s3.stat' as const, labelKey: 'pain.s3.label' as const },
]

const STEP_KEYS = ['s1', 's2', 's3', 's4'] as const
const STEP_NUMS = ['01', '02', '03', '04']

const PRINCIPLES = [
  { key: 'memory' as const },
  { key: 'autonomy' as const },
  { key: 'community' as const },
]

export default function CoreSection() {
  const { lang } = useMingStore()

  return (
    <>
      {/* C1-① Pain — short typographic band */}
      <section
        id="why-chirp"
        style={{
          background: '#ffffff',
          padding: '72px 32px 56px',
          borderBottom: '1px solid rgba(17,24,39,0.06)',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            custom={0}
            variants={fadeUp}
            style={{
              fontFamily: MONO, fontSize: 9, color: 'rgba(17,24,39,0.38)',
              letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16,
            }}
          >
            {t('core.pain.eyebrow', lang)}
          </motion.div>

          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            custom={1}
            variants={fadeUp}
            style={{
              fontFamily: SANS, fontWeight: 400,
              fontSize: 'clamp(20px, 2.6vw, 28px)',
              color: '#111827', lineHeight: 1.4, letterSpacing: '-0.02em',
              maxWidth: 720, margin: '0 0 40px',
            }}
          >
            {t('pain.lead', lang)}
            <span style={{ color: 'rgba(17,24,39,0.4)' }}>{t('pain.lead2', lang)}</span>
          </motion.p>

          <div className="pain-stats" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 32,
          }}>
            {STATS.map(({ statKey, labelKey }, i) => (
              <motion.div
                key={statKey}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                custom={2 + i}
                variants={fadeUp}
              >
                <div style={{
                  fontFamily: SANS, fontWeight: 700,
                  fontSize: 'clamp(32px, 4.5vw, 48px)',
                  color: '#111827', letterSpacing: '-0.04em',
                  lineHeight: 1, marginBottom: 12,
                }}>
                  {t(statKey, lang)}
                </div>
                <div style={{
                  fontFamily: SANS, fontSize: 13, color: 'rgba(17,24,39,0.48)',
                  lineHeight: 1.6, maxWidth: 280,
                }}>
                  {t(labelKey, lang)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* C1-② How it works — illustration + rail + principles */}
      <section
        id="howitworks"
        style={{
          background: '#fafafa',
          padding: '80px 32px 88px',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            custom={0}
            variants={fadeUp}
            style={{
              fontFamily: MONO, fontSize: 9, color: 'rgba(17,24,39,0.38)',
              letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16,
            }}
          >
            {t('core.hiw.eyebrow', lang)}
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            custom={1}
            variants={fadeUp}
            style={{
              fontFamily: SANS, fontWeight: 700,
              fontSize: 'clamp(26px, 3.8vw, 40px)',
              color: '#111827', lineHeight: 1.15, letterSpacing: '-0.03em',
              margin: '0 0 12px', maxWidth: 640,
            }}
          >
            {t('core.h2a', lang)}{' '}
            <span style={{ fontWeight: 300, color: 'rgba(17,24,39,0.42)' }}>
              {t('core.h2b', lang)}
            </span>
          </motion.h2>

          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            custom={2}
            variants={fadeUp}
            style={{
              fontFamily: SANS, fontSize: 15, color: 'rgba(17,24,39,0.5)',
              lineHeight: 1.75, margin: '0 0 40px', maxWidth: 560,
            }}
          >
            {t('core.sub', lang)}
          </motion.p>

          <div className="hiw-split" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 0.75fr)',
            gap: 40,
            alignItems: 'center',
            marginBottom: 48,
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                border: '1px solid rgba(17,24,39,0.08)',
                background: '#fff',
                boxShadow: '0 16px 48px rgba(17,24,39,0.06)',
              }}
            >
              <Image
                src="/landing/plan-apply-run.png"
                alt=""
                width={1600}
                height={900}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </motion.div>

            <ol style={{
              listStyle: 'none', margin: 0, padding: 0,
              display: 'flex', flexDirection: 'column', gap: 22,
            }}>
              {STEP_KEYS.map((skey, i) => (
                <motion.li
                  key={skey}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  custom={i}
                  variants={fadeUp}
                  style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}
                >
                  <span style={{
                    fontFamily: MONO, fontSize: 11, fontWeight: 700,
                    color: 'rgba(17,24,39,0.28)', letterSpacing: '0.06em',
                    paddingTop: 2, flexShrink: 0, width: 28,
                  }}>
                    {STEP_NUMS[i]}
                  </span>
                  <div>
                    <h3 style={{
                      fontFamily: SANS, fontWeight: 600, fontSize: 15,
                      color: '#111827', margin: '0 0 6px', lineHeight: 1.3,
                      letterSpacing: '-0.01em',
                    }}>
                      {t(`hiw.${skey}.title`, lang)}
                    </h3>
                    <p style={{
                      fontFamily: SANS, fontSize: 13, color: 'rgba(17,24,39,0.5)',
                      lineHeight: 1.65, margin: 0,
                    }}>
                      {t(`hiw.${skey}.desc`, lang)}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>

          <div className="hiw-principles" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 28,
            paddingTop: 8,
            borderTop: '1px solid rgba(17,24,39,0.08)',
          }}>
            {PRINCIPLES.map(({ key }, i) => (
              <motion.div
                key={key}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                custom={i}
                variants={fadeUp}
              >
                <div style={{
                  fontFamily: MONO, fontSize: 9, color: 'rgba(17,24,39,0.35)',
                  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10,
                }}>
                  {t(`feat3.${key}.tag`, lang)}
                </div>
                <h3 style={{
                  fontFamily: SANS, fontWeight: 600, fontSize: 16,
                  color: '#111827', margin: '0 0 8px', letterSpacing: '-0.015em',
                }}>
                  {t(`feat3.${key}.title`, lang)}
                </h3>
                <p style={{
                  fontFamily: SANS, fontSize: 13, color: 'rgba(17,24,39,0.48)',
                  lineHeight: 1.7, margin: 0,
                }}>
                  {t(`feat3.${key}.desc`, lang)}
                </p>
              </motion.div>
            ))}
          </div>

          <p style={{
            marginTop: 40,
            fontFamily: MONO, fontSize: 9,
            color: 'rgba(17,24,39,0.3)',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            textAlign: 'center',
          }}>
            {t('core.credit', lang)}
          </p>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .hiw-split {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .hiw-principles {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 640px) {
          .pain-stats {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </>
  )
}
