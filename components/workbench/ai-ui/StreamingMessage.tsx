'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ensureAiUiKeyframes } from './AgentLoading'

/**
 * Simulated streaming text (Beautiful UI Streaming Text vibe) + action row.
 */

export function useSimulatedStream(fullText: string, enabled: boolean, cps = 48) {
  const [visible, setVisible] = useState(enabled ? '' : fullText)
  const [done, setDone] = useState(!enabled)
  const idx = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setVisible(fullText)
      setDone(true)
      return
    }
    idx.current = 0
    setVisible('')
    setDone(false)
    const step = Math.max(1, Math.floor(cps / 20))
    const ms = Math.max(16, Math.floor(1000 / cps))
    const t = setInterval(() => {
      idx.current = Math.min(fullText.length, idx.current + step)
      setVisible(fullText.slice(0, idx.current))
      if (idx.current >= fullText.length) {
        clearInterval(t)
        setDone(true)
      }
    }, ms)
    return () => clearInterval(t)
  }, [fullText, enabled, cps])

  return { visible, done }
}

export function StreamingMessage({
  text,
  streaming = true,
  actions,
}: {
  text: string
  streaming?: boolean
  actions?: ReactNode
}) {
  const { visible, done } = useSimulatedStream(text, streaming, 56)
  useEffect(() => { ensureAiUiKeyframes() }, [])

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minWidth: 0 }}>
      <div style={{
        padding: '10px 12px',
        borderRadius: 14,
        fontSize: 12.5,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        background: 'rgba(255,255,255,0.045)',
        color: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        {visible}
        {!done && (
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 2,
              height: '0.95em',
              marginLeft: 2,
              verticalAlign: '-2px',
              background: 'rgba(255,255,255,0.85)',
              animation: 'chirp-caret 0.9s steps(1) infinite',
            }}
          />
        )}
      </div>
      {done && actions && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {actions}
        </div>
      )}
    </div>
  )
}

export function UserBubble({ text }: { text: string }) {
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 14,
      fontSize: 12.5,
      lineHeight: 1.55,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
      background: 'rgba(59,130,246,0.75)',
      color: '#fff',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {text}
    </div>
  )
}
