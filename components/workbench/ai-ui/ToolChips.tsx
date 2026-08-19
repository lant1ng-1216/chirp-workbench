'use client'
import type { CSSProperties } from 'react'
import type { MarketingAngle } from '@/lib/workbench/marketing'
import { useSimulatedStream } from './StreamingMessage'
import { ensureAiUiKeyframes } from './AgentLoading'
import { useEffect } from 'react'

/** Beautiful UI–inspired tool chips (compact Codex-style). */
export function ToolChips({
  items,
}: {
  items: Array<{ id: string; label: string; status?: 'done' | 'running' | 'error' | 'pending' }>
}) {
  if (!items.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
      {items.map(it => {
        const st = it.status || 'done'
        const border = st === 'error' ? 'rgba(252,165,165,0.45)'
          : st === 'running' ? 'rgba(147,197,253,0.45)'
          : 'rgba(255,255,255,0.1)'
        const fg = st === 'error' ? '#fecaca'
          : st === 'running' ? '#bfdbfe'
          : 'rgba(255,255,255,0.7)'
        return (
          <span
            key={it.id}
            title={it.label}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 9px', borderRadius: 999,
              border: `1px solid ${border}`,
              background: 'rgba(255,255,255,0.04)',
              color: fg, fontSize: 11, fontWeight: 550,
              maxWidth: '100%',
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: 999, flexShrink: 0,
              background: st === 'done' ? '#86efac'
                : st === 'error' ? '#fca5a5'
                : st === 'running' ? '#93c5fd'
                : 'rgba(255,255,255,0.25)',
            }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {it.label}
            </span>
          </span>
        )
      })}
    </div>
  )
}

/** Deliverable angles as structured blocks (not Plan markdown). */
export function DeliverableAngles({
  angles,
  intro,
  streaming = true,
  zh,
}: {
  angles: MarketingAngle[]
  intro?: string
  streaming?: boolean
  zh?: boolean
}) {
  useEffect(() => { ensureAiUiKeyframes() }, [])
  const plain = angles.map((a, i) => (
    `Angle ${i + 1}\nHeadline: ${a.headline}\nBody: ${a.body}\nCTA: ${a.cta}`
  )).join('\n\n')
  const { visible, done } = useSimulatedStream(
    intro ? `${intro}\n\n${plain}` : plain,
    streaming,
    72,
  )

  // Prefer structured cards once stream finishes; while streaming show plain
  if (!done) {
    return (
      <div style={shell}>
        <pre style={pre}>{visible}<Caret /></pre>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: "'DM Sans', sans-serif" }}>
      {intro && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 1.5 }}>
          {intro}
        </div>
      )}
      {angles.map((a, i) => (
        <div key={i} style={shell}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
          }}>
            <span>{zh ? `角度 ${i + 1}` : `Angle ${i + 1}`}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 650, color: 'rgba(255,255,255,0.92)', marginBottom: 6, lineHeight: 1.4 }}>
            {a.headline}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.68)', lineHeight: 1.55, marginBottom: 8 }}>
            {a.body}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(147,197,253,0.9)', lineHeight: 1.45 }}>
            CTA · {a.cta}
          </div>
        </div>
      ))}
    </div>
  )
}

function Caret() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block', width: 2, height: '0.95em', marginLeft: 2,
        verticalAlign: '-2px', background: 'rgba(255,255,255,0.85)',
        animation: 'chirp-caret 0.9s steps(1) infinite',
      }}
    />
  )
}

const shell: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 14,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.06)',
}

const pre: CSSProperties = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  lineHeight: 1.55,
  color: 'rgba(255,255,255,0.82)',
}
