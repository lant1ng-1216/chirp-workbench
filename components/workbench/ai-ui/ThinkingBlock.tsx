'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { ensureAiUiKeyframes } from './AgentLoading'

/**
 * Beautiful UI–inspired Thinking block: expandable traces + elapsed.
 */

export type ThinkStep = {
  id: string
  label: string
  detail?: string
  status?: 'pending' | 'active' | 'done'
}

export function ThinkingBlock({
  label = 'Thinking',
  steps,
  hint,
  defaultOpen = false,
  live = true,
  /** When live flips false, collapse (Claude-style). */
  collapseWhenDone = true,
}: {
  label?: string
  steps?: ThinkStep[]
  hint?: string
  defaultOpen?: boolean
  live?: boolean
  collapseWhenDone?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [sec, setSec] = useState(0)

  useEffect(() => {
    ensureAiUiKeyframes()
  }, [])

  useEffect(() => {
    if (!live) return
    const t = setInterval(() => setSec(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [live])

  useEffect(() => {
    if (live) {
      setOpen(true)
      return
    }
    if (collapseWhenDone) setOpen(false)
  }, [live, collapseWhenDone])

  const title = live
    ? `${label}`
    : (sec > 0 ? `Thought for ${sec}s` : label)

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.03)',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', border: 'none', background: 'transparent',
          color: 'rgba(255,255,255,0.72)', cursor: 'pointer', textAlign: 'left',
          fontSize: 12, fontWeight: 550,
        }}
      >
        <span aria-hidden style={{
          width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(147,197,253,0.9)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.8 5.4L19 9.2l-5.2 1.8L12 16.4l-1.8-5.4L5 9.2l5.2-1.8L12 2z" />
          </svg>
        </span>
        <span style={{ flex: 1 }}>
          {live ? (
            <span style={{
              backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.4) 35%, #fff 50%, rgba(255,255,255,0.4) 65%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              animation: 'chirp-shimmer-text 1.4s linear infinite',
            }}>{title}</span>
          ) : title}
          {live && (
            <span style={{
              marginLeft: 8, fontFamily: "'Space Mono', monospace",
              fontSize: 11, color: 'rgba(255,255,255,0.32)',
            }}>{sec}s</span>
          )}
        </span>
        <span style={{ opacity: 0.4, fontSize: 10 }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={{
          padding: '0 10px 10px 32px',
          display: 'flex', flexDirection: 'column', gap: 6,
          fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45,
        }}>
          {hint && <div>{hint}</div>}
          {(steps ?? []).map(s => (
            <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{
                marginTop: 4, width: 6, height: 6, borderRadius: 999, flexShrink: 0,
                background: s.status === 'done' ? '#86efac'
                  : s.status === 'active' ? '#93c5fd'
                  : 'rgba(255,255,255,0.2)',
              }} />
              <div>
                <div style={{ color: 'rgba(255,255,255,0.72)' }}>{s.label}</div>
                {s.detail && <div style={{ color: 'rgba(255,255,255,0.38)' }}>{s.detail}</div>}
              </div>
            </div>
          ))}
          {!hint && (!steps || steps.length === 0) && (
            <div style={{ color: 'rgba(255,255,255,0.38)' }}>Working…</div>
          )}
        </div>
      )}
    </div>
  )
}

export function TaskRows({
  items,
}: {
  items: Array<{ id: string; title: string; meta?: string; status: 'running' | 'done' | 'error' | 'pending' }>
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: "'DM Sans', sans-serif" }}>
      {items.map(it => (
        <div key={it.id} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 8px', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11,
        }}>
          <StatusDot status={it.status} />
          <span style={{ flex: 1, color: 'rgba(255,255,255,0.78)', fontWeight: 550 }}>{it.title}</span>
          {it.meta && <span style={{ color: 'rgba(255,255,255,0.35)' }}>{it.meta}</span>}
        </div>
      ))}
    </div>
  )
}

function StatusDot({ status }: { status: 'running' | 'done' | 'error' | 'pending' }) {
  const color = status === 'done' ? '#86efac'
    : status === 'error' ? '#fca5a5'
    : status === 'running' ? '#93c5fd'
    : 'rgba(255,255,255,0.25)'
  return (
    <span style={{
      width: 7, height: 7, borderRadius: 999, background: color, flexShrink: 0,
      boxShadow: status === 'running' ? `0 0 0 3px ${color}33` : undefined,
    }} />
  )
}

export function ApprovalCard({
  title,
  questions,
  note,
  zh,
  onReply,
}: {
  title?: string
  questions: string[]
  note?: string
  zh: boolean
  onReply: (text: string) => void
}): ReactNode {
  return (
    <div style={{
      borderRadius: 14,
      border: '1px solid rgba(147,197,253,0.28)',
      background: 'rgba(59,130,246,0.08)',
      padding: 12,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: 12, fontWeight: 650, color: '#bfdbfe', marginBottom: 6 }}>
        {title || (zh ? '需要你确认后再继续' : 'Needs your confirmation')}
      </div>
      {note && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 8, lineHeight: 1.45 }}>
          {note}
        </div>
      )}
      <ol style={{ margin: '0 0 10px', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {questions.map((q, i) => (
          <li key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45 }}>
            {q}
          </li>
        ))}
      </ol>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {questions.slice(0, 3).map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onReply(zh ? `关于「${q}」：` : `Re: “${q}”: `)}
            style={{
              padding: '6px 10px', borderRadius: 999, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 550,
            }}
          >
            {zh ? `回答 ${i + 1}` : `Answer ${i + 1}`}
          </button>
        ))}
      </div>
    </div>
  )
}
