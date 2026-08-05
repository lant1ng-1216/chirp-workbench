'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { SiGmail } from 'react-icons/si'

const MIN_W    = 220
const MAX_W    = 560
const DEFAULT_W = 288

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
  al2:    'rgba(59,130,246,0.14)',
  border: 'rgba(17,24,39,0.08)',
  border2:'rgba(17,24,39,0.13)',
  green:  '#10b981',
  red:    '#ea4335',
}
const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

interface Msg { role: 'user' | 'pip'; text: string; ts: number }

function PipAvatar({ size = 24 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28),
      background: C.al2, border: '1px solid rgba(59,130,246,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width={size * 0.48} height={size * 0.48} fill="none" stroke={C.accent} strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    </div>
  )
}

function GmailIcon({ size = 18 }: { size?: number }) {
  return <SiGmail size={size} color="#EA4335" />
}

function makeDailyReport(zh: boolean, projectName: string): string {
  const today = new Date()
  const dateStr = today.toLocaleDateString(zh ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric' })
  if (zh) {
    return `今日日报 — ${dateStr}\n\n1. YouTube 视频描述已就绪，等待发布\n2. Instagram 文案已起草，建议今日审核\n3. TikTok 脚本草稿 × 1，可直接使用\n4. X 帖子创意 × 2，等待你批准\n5. 内容日历本周节奏：YT×1 / IG×2 / TT×3 / X×5\n\n有什么需要我跟进的吗？`
  }
  return `Daily Report — ${dateStr}\n\n1. YouTube description ready — waiting to publish\n2. Instagram caption drafted — review today\n3. TikTok script × 1 ready to use\n4. X post ideas × 2 — awaiting your approval\n5. This week's cadence: YT×1 / IG×2 / TT×3 / X×5\n\nAnything you'd like me to follow up on?`
}

export default function RightPanel() {
  const params    = useParams()
  const projectId = params?.projectId as string
  const { projects, lang } = useMingStore()
  const project   = projects.find(p => p.id === projectId)

  const zh = lang === 'zh'

  // ── Resize ──
  const [panelW, setPanelW]   = useState(DEFAULT_W)
  const dragging  = useRef(false)
  const startX    = useRef(0)
  const startW    = useRef(DEFAULT_W)

  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current   = e.clientX
    startW.current   = panelW
    document.body.style.cursor    = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [panelW])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const delta = startX.current - e.clientX  // drag left → wider
      setPanelW(Math.max(MIN_W, Math.min(MAX_W, startW.current + delta)))
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor    = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  // ── Email / Chat ──
  const CHAT_KEY = `pip-chat-${projectId}`
  const [msgs,       setMsgs]       = useState<Msg[]>([])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [loadingSec, setLoadingSec] = useState(0)
  const loadingTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [emailMode,  setEmailMode]  = useState(false)
  const [emailDismissed, setEmailDismissed] = useState(false)
  const [hydrated,   setHydrated]   = useState(false)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_KEY)
      const parsed: Msg[] = saved ? JSON.parse(saved) : []
      setMsgs(parsed.length > 0 ? parsed : [{ role: 'pip', text: t('chat.greeting', lang), ts: Date.now() }])
    } catch {
      setMsgs([{ role: 'pip', text: t('chat.greeting', lang), ts: Date.now() }])
    }
    setHydrated(true)
  }, [projectId])

  // Persist chat to localStorage whenever msgs change
  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs)) } catch { /* ignore */ }
  }, [msgs, hydrated])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  if (!project) return null
  const { brand } = project

  const STARTERS = [
    t('chat.starter.3', lang),
    t('chat.starter.1', lang),
    t('chat.starter.4', lang),
  ]

  const loadEmail = () => {
    const report = makeDailyReport(zh, brand.name)
    setMsgs(prev => [...prev.filter(m => m.role !== 'pip' || prev.indexOf(m) !== 0),
      { role: 'pip', text: report, ts: Date.now() }
    ])
    setEmailMode(true)
    setEmailDismissed(true)
  }

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const alias = brand.mindsConversationAlias
    setMsgs(prev => [...prev, { role: 'user', text: text.trim(), ts: Date.now() }])
    setInput('')
    setLoading(true)
    setLoadingSec(0)
    loadingTimer.current = setInterval(() => setLoadingSec(s => s + 1), 1000)

    const stopLoading = () => {
      if (loadingTimer.current) { clearInterval(loadingTimer.current); loadingTimer.current = null }
      setLoading(false)
      setLoadingSec(0)
    }

    if (!alias) {
      setMsgs(prev => [...prev, { role: 'pip', text: t('chat.noalias', lang), ts: Date.now() }])
      stopLoading()
      return
    }

    try {
      // 1. Fire-and-forget send — returns sentAt timestamp
      const sendRes = await fetch('/api/minds/send-async', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias, message: text.trim() }),
      })
      const { sentAt, error } = await sendRes.json()
      if (error) throw new Error(error)

      // 2. Poll history every 3s until a Mind reply after sentAt appears
      const POLL_INTERVAL = 3000
      const POLL_TIMEOUT  = 5 * 60 * 1000 // 5 min
      const started = Date.now()

      const poll = async (): Promise<void> => {
        if (Date.now() - started > POLL_TIMEOUT) {
          setMsgs(prev => [...prev, { role: 'pip', text: t('chat.error', lang), ts: Date.now() }])
          stopLoading()
          return
        }
        try {
          const histRes = await fetch(`/api/minds/history?alias=${encodeURIComponent(alias)}&limit=10`)
          const { history } = await histRes.json() as {
            history: Array<{ senderType: number; messageText: string; createdAt: string }>
          }
          // senderType 0 = Mind reply; createdAt is ISO string
          const reply = history.find(m =>
            m.senderType === 0 && new Date(m.createdAt).getTime() >= sentAt
          )
          if (reply) {
            const clean = reply.messageText.replace(/<[^>]+>/g, '').trim()
            setMsgs(prev => [...prev, { role: 'pip', text: clean, ts: Date.now() }])
            stopLoading()
            return
          }
        } catch { /* keep polling */ }
        setTimeout(poll, POLL_INTERVAL)
      }

      setTimeout(poll, POLL_INTERVAL)
    } catch {
      setMsgs(prev => [...prev, { role: 'pip', text: t('chat.error', lang), ts: Date.now() }])
      stopLoading()
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  return (
    <aside style={{
      width: panelW, flexShrink: 0, position: 'relative',
      background: C.bg, borderLeft: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: SANS,
      transition: dragging.current ? 'none' : 'width 0.05s',
    }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>

      {/* ── Drag handle ── */}
      <div
        onMouseDown={onDragStart}
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, zIndex: 20,
          cursor: 'col-resize', background: 'transparent',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      />

      {/* ── Header ── */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <PipAvatar size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: C.ink }}>Pip</div>
          <div style={{ fontFamily: MONO, fontSize: 8, color: brand.mindsConversationAlias ? C.accent : C.ink4, letterSpacing: '0.04em', marginTop: 1 }}>
            {brand.mindsConversationAlias
              ? `● ${zh ? '已连接 · 由 Minds 驱动' : 'CONNECTED · Powered by Minds'}`
              : `○ ${zh ? '未连接' : 'NOT CONNECTED'}`}
          </div>
        </div>
        {emailMode && (
          <div style={{ fontFamily: MONO, fontSize: 8, color: C.accent, background: C.al, padding: '2px 6px', borderRadius: 5, flexShrink: 0 }}>
            {zh ? '邮件模式' : 'EMAIL'}
          </div>
        )}
      </div>


      {/* ── Email anchor card (shown until dismissed) ── */}
      {!emailDismissed && (
        <div style={{
          margin: '10px 10px 0',
          background: C.bg1, borderRadius: 10, border: `1px solid ${C.border2}`,
          overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: `1px solid ${C.border}` }}>
            <GmailIcon size={18} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.ink }}>{zh ? 'Pip 已发送今日日报' : "Pip sent today's report"}</div>
              <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, marginTop: 1 }}>{zh ? '刚刚 · pip@chirpai.com' : 'just now · pip@chirpai.com'}</div>
            </div>
            <button
              onClick={() => setEmailDismissed(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, padding: 2, fontSize: 14, lineHeight: 1 }}
            >×</button>
          </div>
          <div style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
            <button
              onClick={loadEmail}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 7,
                background: C.accent, color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: SANS,
              }}
            >
              {zh ? '按邮件内容继续对话 →' : 'Continue from email →'}
            </button>
            <button
              onClick={() => setEmailDismissed(true)}
              style={{
                padding: '7px 10px', borderRadius: 7,
                background: C.bg2, color: C.ink3, border: 'none', cursor: 'pointer',
                fontSize: 11, fontFamily: SANS,
              }}
            >
              {zh ? '独立对话' : 'Skip'}
            </button>
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>

        {/* Starter prompts (only before user sends anything) */}
        {msgs.length <= 1 && !emailMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
            {STARTERS.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border2}`,
                background: C.bg1, fontFamily: SANS, fontSize: 11, color: C.ink3,
                cursor: 'pointer', textAlign: 'left', lineHeight: 1.4,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.ink3 }}
              >{s}</button>
            ))}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{
            display: 'flex', gap: 7, marginBottom: 12,
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
          }}>
            {m.role === 'pip' && <PipAvatar size={22} />}
            <div style={{
              maxWidth: '84%', padding: '8px 11px',
              borderRadius: m.role === 'user' ? '10px 10px 3px 10px' : '10px 10px 10px 3px',
              background: m.role === 'user' ? C.accent : '#fff',
              color: m.role === 'user' ? '#fff' : C.ink2,
              fontSize: 12, lineHeight: 1.65,
              border: m.role === 'pip' ? `1px solid ${C.border2}` : 'none',
              boxShadow: '0 1px 3px rgba(17,24,39,0.05)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>{m.text}</div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 7, marginBottom: 12, alignItems: 'flex-start' }}>
            <PipAvatar size={22} />
            <div style={{ padding: '9px 12px', borderRadius: '10px 10px 10px 3px', background: '#fff', border: `1px solid ${C.border2}`, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 0.15, 0.3].map((d, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: C.accent, animation: `pulse 1.2s ${d}s infinite` }} />
                ))}
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginLeft: 4 }}>{loadingSec}s</span>
              </div>
              {loadingSec >= 10 && (
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, lineHeight: 1.5 }}>
                  {zh ? 'Pip 正在思考，通常需要 1-3 分钟…' : 'Pip is thinking, usually 1–3 min…'}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ padding: '8px 10px 12px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{
          display: 'flex', gap: 7, alignItems: 'flex-end',
          background: C.bg1, borderRadius: 10, border: `1px solid ${C.border2}`, padding: '6px 8px',
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = C.border2)}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={zh ? '和 Pip 说任何事…' : 'Ask Pip anything…'}
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: SANS, fontSize: 12, color: C.ink,
              lineHeight: 1.5, resize: 'none', maxHeight: 100, overflowY: 'auto',
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 28, height: 28, borderRadius: 7, border: 'none', flexShrink: 0,
              background: input.trim() && !loading ? C.accent : C.bg2,
              color:      input.trim() && !loading ? '#fff'    : C.ink4,
              cursor:     input.trim() && !loading ? 'pointer'  : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
            }}
          >↑</button>
        </div>
      </div>
    </aside>
  )
}
