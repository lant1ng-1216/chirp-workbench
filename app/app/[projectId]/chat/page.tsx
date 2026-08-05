'use client'
import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const C = {
  bg:     '#ffffff',
  bg1:    '#f9fafb',
  bg2:    '#f3f4f6',
  ink:    '#111827',
  ink2:   '#374151',
  ink3:   '#6b7280',
  ink4:   '#9ca3af',
  accent: '#3b82f6',
  al:     'rgba(59,130,246,0.08)',
  al2:    'rgba(59,130,246,0.15)',
  border: 'rgba(17,24,39,0.08)',
  border2:'rgba(17,24,39,0.14)',
}
const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

interface Msg {
  role: 'user' | 'pip'
  text: string
  ts: number
}

function PipAvatar({ size = 28 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28),
      background: C.al2, border: `1px solid rgba(59,130,246,0.2)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.5} height={size * 0.5} fill="none" stroke={C.accent} strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    </div>
  )
}

export default function ChatPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { projects, lang } = useMingStore()
  const project = projects.find(p => p.id === projectId)

  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { role: 'pip', text: '', ts: Date.now() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // greeting is language-dependent, set it on mount and lang change
  useEffect(() => {
    setMsgs([{ role: 'pip', text: t('chat.greeting', lang), ts: Date.now() }])
  }, [lang])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  if (!project) return null
  const { brand } = project

  const STARTERS = [
    t('chat.starter.1', lang),
    t('chat.starter.2', lang),
    t('chat.starter.3', lang),
    t('chat.starter.4', lang),
  ]

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = { role: 'user', text: text.trim(), ts: Date.now() }
    setMsgs(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const alias = brand.mindsConversationAlias
      if (!alias) {
        setMsgs(prev => [...prev, { role: 'pip', text: t('chat.noalias', lang), ts: Date.now() }])
        setLoading(false)
        return
      }

      const res = await fetch('/api/minds/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias, message: text.trim() }),
      })
      const data = await res.json()
      setMsgs(prev => [...prev, { role: 'pip', text: data.reply ?? '…', ts: Date.now() }])
    } catch {
      setMsgs(prev => [...prev, { role: 'pip', text: t('chat.error', lang), ts: Date.now() }])
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg1, fontFamily: SANS }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{ padding: '14px 20px', background: C.bg, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <PipAvatar size={36} />
        <div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: C.ink }}>Pip</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: brand.mindsConversationAlias ? C.accent : C.ink4 }}>
            {brand.mindsConversationAlias ? `● ${t('chat.connected', lang)}` : `○ ${t('chat.notconnected', lang)}`}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{t('chat.title', lang)}</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {msgs.length === 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {STARTERS.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                padding: '7px 14px', borderRadius: 20, border: `1px solid ${C.border2}`, background: '#fff',
                fontFamily: SANS, fontSize: 12, color: C.ink3, cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.ink3 }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            {m.role === 'pip' && <PipAvatar size={28} />}
            <div style={{
              maxWidth: '72%', padding: '10px 14px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              background: m.role === 'user' ? C.accent : '#fff',
              color: m.role === 'user' ? '#fff' : C.ink,
              fontFamily: SANS, fontSize: 13, lineHeight: 1.75,
              border: m.role === 'pip' ? `1px solid ${C.border2}` : 'none',
              boxShadow: '0 1px 3px rgba(17,24,39,0.06)',
              whiteSpace: 'pre-wrap',
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <PipAvatar size={28} />
            <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: '#fff', border: `1px solid ${C.border2}`, display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 0.15, 0.3].map((d, i) => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: 4, background: C.accent, animation: `pulse 1.2s ${d}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px 20px', background: C.bg, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: C.bg1, borderRadius: 12, border: `1px solid ${C.border2}`, padding: '8px 12px', transition: 'border-color 0.15s' }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = C.border2)}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={t('chat.placeholder', lang)}
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: SANS, fontSize: 13, color: C.ink, lineHeight: 1.6, resize: 'none',
              maxHeight: 140, overflowY: 'auto',
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: input.trim() && !loading ? C.accent : C.bg2,
              color: input.trim() && !loading ? '#fff' : C.ink4,
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'all 0.15s', fontSize: 14,
            }}
          >↑</button>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginTop: 6, textAlign: 'center' }}>
          {t('chat.footer', lang)}
        </div>
      </div>
    </div>
  )
}
