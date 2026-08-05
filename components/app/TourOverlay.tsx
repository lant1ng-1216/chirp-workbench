'use client'
import { useState, useEffect, useCallback } from 'react'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"
const ACCENT = '#3b82f6'

interface Step {
  targetId: string | null
  titleKey: string
  descKey: string
}

const STEPS: Step[] = [
  { targetId: null,        titleKey: 'tour.s1.title', descKey: 'tour.s1.desc' },
  { targetId: 'workshop',  titleKey: 'tour.s2.title', descKey: 'tour.s2.desc' },
  { targetId: 'chat',      titleKey: 'tour.s3.title', descKey: 'tour.s3.desc' },
  { targetId: 'community', titleKey: 'tour.s4.title', descKey: 'tour.s4.desc' },
  { targetId: 'platforms', titleKey: 'tour.s5.title', descKey: 'tour.s5.desc' },
]

interface Rect { top: number; left: number; width: number; height: number }

function getTargetRect(tourId: string | null): Rect | null {
  if (!tourId) return null
  const el = document.querySelector(`[data-tour="${tourId}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function Spotlight({ rect, pad = 8 }: { rect: Rect; pad?: number }) {
  return (
    <div style={{
      position: 'fixed',
      top:    rect.top    - pad,
      left:   rect.left   - pad,
      width:  rect.width  + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: 10,
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.58)',
      pointerEvents: 'none',
      zIndex: 201,
      transition: 'top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease',
      border: `1.5px solid rgba(59,130,246,0.6)`,
    }} />
  )
}

function Bubble({
  step, stepIdx, total, rect, onNext, onSkip, lang,
}: {
  step: Step
  stepIdx: number
  total: number
  rect: Rect | null
  onNext: () => void
  onSkip: () => void
  lang: string
}) {
  const isLast = stepIdx === total - 1
  const PAD = 8
  const BUBBLE_W = 300

  let top = 0, left = 0

  if (!rect) {
    // Center of screen
    top  = window.innerHeight / 2 - 110
    left = window.innerWidth  / 2 - BUBBLE_W / 2
  } else {
    // Place to the right of the spotlight; fall back to left if not enough space
    const spaceRight = window.innerWidth - (rect.left + rect.width + PAD)
    if (spaceRight >= BUBBLE_W + 20) {
      left = rect.left + rect.width + PAD + 16
      top  = rect.top  + rect.height / 2 - 80
    } else {
      left = rect.left - BUBBLE_W - 20
      top  = rect.top  + rect.height / 2 - 80
    }
    // Clamp vertically
    top = Math.max(16, Math.min(top, window.innerHeight - 240))
  }

  const stepLabel = t('tour.step', lang as 'en' | 'zh')
    .replace('{n}', String(stepIdx + 1))
    .replace('{total}', String(total))

  return (
    <div style={{
      position: 'fixed', top, left, width: BUBBLE_W, zIndex: 202,
      background: '#fff', borderRadius: 14,
      boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)',
      padding: '20px 20px 16px',
      transition: 'top 0.3s ease, left 0.3s ease',
    }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              width: i === stepIdx ? 16 : 6, height: 6, borderRadius: 3,
              background: i === stepIdx ? ACCENT : 'rgba(59,130,246,0.2)',
              transition: 'width 0.25s ease, background 0.25s ease',
            }} />
          ))}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(0,0,0,0.3)', letterSpacing: '0.06em' }}>
          {stepLabel}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 8, lineHeight: 1.3 }}>
        {t(step.titleKey, lang as 'en' | 'zh')}
      </div>

      {/* Desc */}
      <div style={{ fontFamily: SANS, fontSize: 12, color: '#6b7280', lineHeight: 1.7, marginBottom: 18 }}>
        {t(step.descKey, lang as 'en' | 'zh')}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onSkip} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: SANS, fontSize: 12, color: 'rgba(0,0,0,0.3)',
          padding: 0, transition: 'color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.6)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.3)')}
        >
          {t('tour.skip', lang as 'en' | 'zh')}
        </button>
        <button onClick={onNext} style={{
          background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer',
          fontFamily: SANS, fontWeight: 600, fontSize: 13,
          padding: '8px 18px', borderRadius: 8,
          boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
          transition: 'opacity 0.15s, transform 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
        >
          {isLast ? t('tour.finish', lang as 'en' | 'zh') : t('tour.next', lang as 'en' | 'zh')}
        </button>
      </div>
    </div>
  )
}

export default function TourOverlay({ projectId }: { projectId: string }) {
  const { touredProjects, completeTour, lang } = useMingStore()
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [visible, setVisible] = useState(false)

  const alreadyToured = touredProjects.includes(projectId)

  // Show after a brief delay so layout paints first
  useEffect(() => {
    if (alreadyToured) return
    const timer = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(timer)
  }, [alreadyToured])

  const updateRect = useCallback(() => {
    const step = STEPS[stepIdx]
    setRect(getTargetRect(step.targetId))
  }, [stepIdx])

  useEffect(() => {
    if (!visible) return
    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [visible, updateRect])

  const finish = useCallback(() => {
    completeTour(projectId)
    setVisible(false)
  }, [completeTour, projectId])

  const next = useCallback(() => {
    if (stepIdx >= STEPS.length - 1) { finish(); return }
    setStepIdx(i => i + 1)
  }, [stepIdx, finish])

  if (!visible || alreadyToured) return null

  const step = STEPS[stepIdx]

  return (
    <>
      {/* Dark overlay — only when no spotlight rect (step 1) */}
      {!rect && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.58)', zIndex: 200,
        }} onClick={next} />
      )}

      {/* Spotlight */}
      {rect && <Spotlight rect={rect} />}

      {/* Bubble */}
      <Bubble
        step={step}
        stepIdx={stepIdx}
        total={STEPS.length}
        rect={rect}
        onNext={next}
        onSkip={finish}
        lang={lang}
      />
    </>
  )
}
