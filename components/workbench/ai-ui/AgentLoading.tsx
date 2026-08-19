'use client'
import { useEffect, useState } from 'react'

/**
 * Adapted from Beautiful UI Loading State (beautifului.dev)
 * Pixel-grid loader + shimmer label + elapsed timer — Chirp tokens.
 */

const chevron = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3)
  const c = i % 3
  return (c + Math.abs(r - 1)) * 90
})

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3]
const orbit = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i)
  return k === -1 ? null : k * 110
})

export type LoaderVariant = 'Drive' | 'Dots' | 'Orbit'

const PATTERNS: Record<LoaderVariant, { delays: (number | null)[]; dur: number; round: boolean }> = {
  Drive: { delays: chevron, dur: 650, round: false },
  Dots: { delays: chevron, dur: 650, round: true },
  Orbit: { delays: orbit, dur: 950, round: false },
}

export const AI_UI_STYLE_ID = 'chirp-ai-ui-keyframes'

export function ensureAiUiKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(AI_UI_STYLE_ID)) return
  const el = document.createElement('style')
  el.id = AI_UI_STYLE_ID
  el.textContent = `
    @keyframes chirp-pixel-on {
      0%, 100% { opacity: 0.15; }
      40%, 60% { opacity: 0.95; }
    }
    @keyframes chirp-shimmer-text {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    @keyframes chirp-caret {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .chirp-pixel-cell { animation: none !important; opacity: 0.35 !important; }
      .chirp-shimmer-label {
        animation: none !important;
        color: rgba(255,255,255,0.55) !important;
        background: none !important;
        -webkit-text-fill-color: unset !important;
      }
    }
  `
  document.head.appendChild(el)
}

function useElapsed(active = true) {
  const [ds, setDs] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setDs(d => d + 1), 100)
    return () => clearInterval(t)
  }, [active])
  const total = ds / 10
  if (total < 60) return `${total.toFixed(1)}s`
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`
}

export function AgentLoading({
  label = 'Thinking',
  variant = 'Drive',
  showTimer = true,
  compact = false,
}: {
  label?: string
  variant?: LoaderVariant
  showTimer?: boolean
  compact?: boolean
}) {
  const elapsed = useElapsed(true)
  const { delays, dur, round } = PATTERNS[variant] ?? PATTERNS.Drive

  useEffect(() => { ensureAiUiKeyframes() }, [])

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 8 : 10,
        fontFamily: "'DM Sans', sans-serif",
      }}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 4px)',
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        {delays.map((d, i) => (
          <span
            key={i}
            className="chirp-pixel-cell"
            style={{
              width: 4,
              height: 4,
              background: 'rgba(255,255,255,0.92)',
              borderRadius: round ? 999 : 1,
              opacity: d === null ? 0.07 : 0.15,
              animation: d === null ? 'none' : `chirp-pixel-on ${dur}ms ease-in-out ${d}ms infinite`,
            }}
          />
        ))}
      </span>
      {label ? (
        <span
          className="chirp-shimmer-label"
          style={{
            fontSize: compact ? 12 : 13,
            fontWeight: 550,
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.35) 35%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.35) 65%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: 'chirp-shimmer-text 1.4s linear infinite',
          }}
        >
          {label}
        </span>
      ) : null}
      {showTimer && label ? (
        <span style={{
          fontFamily: "'Space Mono', ui-monospace, monospace",
          fontSize: compact ? 11 : 12,
          color: 'rgba(255,255,255,0.35)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {elapsed}
        </span>
      ) : null}
    </div>
  )
}
