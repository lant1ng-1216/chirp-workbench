'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { marked } from 'marked'
import { useSearchParams } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import type { Message } from '@/lib/brand'

marked.setOptions({ gfm: true, breaks: true })

/* ── ELN warm tokens ── */
const C = {
  bg:      '#faf9f7',
  bg2:     '#f4f2ee',
  bg3:     '#edeae4',
  ink:     '#1a1916',
  ink2:    '#4a4844',
  ink3:    '#9a9894',
  ink4:    '#c8c6c0',
  accent:  '#1c3a2e',
  al:      'rgba(28,58,46,0.08)',
  al2:     'rgba(28,58,46,0.15)',
  border:  'rgba(26,25,22,0.08)',
  border2: 'rgba(26,25,22,0.14)',
  shadow:  '0 1px 3px rgba(26,25,22,0.06),0 3px 10px rgba(26,25,22,0.04)',
  sfloat:  '0 4px 20px rgba(26,25,22,0.1)',
  gold:    '#7a6020',
  gl:      '#f5f0e8',
}
const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"
const SANS  = "'Noto Sans SC', 'PingFang SC', sans-serif"

function MarkdownContent({ content, isUser }: { content: string; isUser: boolean }) {
  const html = marked.parse(content) as string
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ fontFamily: SERIF, fontWeight: isUser ? 400 : 300, fontSize: 14, lineHeight: 1.9, color: isUser ? 'rgba(255,255,255,0.92)' : C.ink2 }}
      className={isUser ? 'md-user' : 'md-agent'}
    />
  )
}

interface ToolCall {
  id: string; toolName: string; args: Record<string, unknown>; result?: unknown; status: 'running' | 'done'
}
interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string; toolCalls?: ToolCall[]
}
interface Props { projectId: string; threadId: string }

const TOOL_LABELS: Record<string, string> = {
  get_trending_topics:  '搜索今日热点榜',
  generate_post:        '生成平台内容',
  schedule_post:        '写入内容日历',
  publish_post:         '准备发布',
  analyze_competitor:   '分析竞品账号',
  create_content_plan:  '规划内容方案',
}

const QUICK = ['今天发什么', '下周每天 2 帖', '帮我写一条小红书', '本周战报', '竞品分析']

export default function AgentChatRoom({ projectId, threadId }: Props) {
  const searchParams = useSearchParams()
  const labDirection = searchParams?.get('lab_direction')
  const labStep      = searchParams?.get('lab_step')
  const { projects, addMessage, addExtractedCards } = useMingStore()
  const project = projects.find(p => p.id === projectId)
  const thread  = project?.threads.find(t => t.id === threadId)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const hasSentRef  = useRef(false)
  const [inputValue,      setInputValue]      = useState('')
  const [isLoading,       setIsLoading]       = useState(false)
  const [messages,        setMessages]        = useState<ChatMessage[]>(
    () => thread?.messages.map(m => ({
      id: m.id, role: m.role, content: m.content,
      toolCalls: m.toolCalls?.map((tc, i) => ({ id: `${tc.toolName}-${i}`, toolName: tc.toolName, args: tc.args, result: tc.result, status: tc.status as 'running' | 'done' })),
    })) || []
  )
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingTools,   setStreamingTools]   = useState<ToolCall[]>([])

  // Refs for stable closure in async stream loop
  const accRef       = useRef('')
  const rafRef       = useRef<number | null>(null)
  const activeToolsRef = useRef<ToolCall[]>([])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !project) return

    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInputValue('')
    setIsLoading(true)
    setStreamingContent('')
    setStreamingTools([])
    accRef.current = ''
    activeToolsRef.current = []

    addMessage(projectId, threadId, {
      id: userMsg.id, role: 'user', content: text,
      createdAt: new Date().toISOString(),
    })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          brandProfile: project.brand,
        }),
      })
      if (!res.ok || !res.body) throw new Error('请求失败')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let leftover  = ''   // ← buffer for incomplete lines across chunks

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = (leftover + chunk).split('\n')
        leftover = lines.pop() ?? ''   // last element may be incomplete

        for (const line of lines) {
          if (!line.trim()) continue
          const colonIdx = line.indexOf(':')
          if (colonIdx === -1) continue
          const type    = line.slice(0, colonIdx)
          const payload = line.slice(colonIdx + 1)

          try {
            if (type === '0') {
              // Text delta — accumulate in ref, batch UI update via RAF
              accRef.current += JSON.parse(payload)
              if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(() => {
                  setStreamingContent(accRef.current)
                  rafRef.current = null
                })
              }
            } else if (type === '9') {
              const tc = JSON.parse(payload)
              const newTool: ToolCall = { id: tc.toolCallId, toolName: tc.toolName, args: tc.args || {}, status: 'running' }
              activeToolsRef.current = [...activeToolsRef.current, newTool]
              setStreamingTools([...activeToolsRef.current])
            } else if (type === 'a') {
              const tr = JSON.parse(payload)
              activeToolsRef.current = activeToolsRef.current.map(t =>
                t.id === tr.toolCallId ? { ...t, result: tr.result, status: 'done' as const } : t
              )
              setStreamingTools([...activeToolsRef.current])
            }
          } catch { /* ignore partial / malformed lines */ }
        }
      }

      // Flush any remaining RAF update
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        setStreamingContent(accRef.current)
      }

      const assistantId  = `msg-${Date.now()}`
      const assistantMsg: ChatMessage = {
        id: assistantId, role: 'assistant', content: accRef.current,
        toolCalls: activeToolsRef.current.length > 0 ? activeToolsRef.current : undefined,
      }
      setMessages(prev => [...prev, assistantMsg])
      setStreamingContent('')
      setStreamingTools([])
      scrollToBottom()

      addMessage(projectId, threadId, {
        id: assistantId, role: 'assistant', content: accRef.current,
        toolCalls: activeToolsRef.current.length > 0
          ? activeToolsRef.current.map(tc => ({ toolName: tc.toolName, args: tc.args, result: tc.result, status: tc.status }))
          : undefined,
        createdAt: new Date().toISOString(),
      })

      // Extract platform copy cards in background
      const replyContent = accRef.current
      fetch('/api/xcopy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      }).then(r => r.json()).then(({ cards }) => {
        if (Array.isArray(cards) && cards.length > 0) {
          addExtractedCards(cards.map((c: { platform: string; content: string }) => ({
            id: `card-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            projectId,
            threadId,
            platform: c.platform,
            content: c.content,
            createdAt: new Date().toISOString(),
          })))
        }
      }).catch(() => {})
    } catch (e) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: `出错了：${e instanceof Error ? e.message : '请重试'}` }])
      setStreamingContent('')
      setStreamingTools([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-send from Lab
  const isEmpty = messages.length === 0 && !streamingContent
  useEffect(() => {
    if (labDirection && labStep && isEmpty && !isLoading && !hasSentRef.current) {
      hasSentRef.current = true
      const prompt = `我刚完成了创意实验室的投资人评审，选择了「${labDirection}」作为接下来的营销方向。第一步行动是：${labStep}。请基于我的品牌档案，帮我制定具体的执行计划，并直接开始第一步。`
      setTimeout(() => sendMessage(prompt), 800)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, fontFamily: SANS, position: 'relative' }}>
      <style>{`
        @keyframes agPulse { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes agSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes agBlink { 50%{opacity:0} }
        /* paper texture */
        .ag-paper { background-image: repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(26,25,22,0.025) 27px,rgba(26,25,22,0.025) 28px); }
        .ag-md p  { margin: 0 0 8px 0; }
        .ag-md ul { margin: 4px 0 8px 16px; }
        .ag-md ol { margin: 4px 0 8px 16px; }
        .ag-md li { margin-bottom: 3px; }
        .ag-md strong { font-weight: 600; color: ${C.ink}; }
        .ag-md code { font-family: ${MONO}; font-size: 12px; background: ${C.bg3}; padding: 1px 5px; border-radius: 4px; }
        .ag-quick:hover { background: ${C.al} !important; color: ${C.accent} !important; border-color: ${C.al2} !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 18px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.bg, gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: '#fff' }}>鸣</span>
        </div>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.ink }}>鸣 · 营销助手</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.04em' }}>{project?.brand.name} 专属 Agent</div>
        </div>
        {isLoading && (
          <div style={{ marginLeft: 6, display: 'flex', gap: 3, alignItems: 'center' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: 2, background: C.accent, animation: `agPulse 1s ${i*0.2}s ease-in-out infinite` }} />)}
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="ag-paper" style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {isEmpty ? (
          /* Empty state */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: '#fff' }}>鸣</span>
            </div>
            <div>
              <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 8, letterSpacing: '0.01em' }}>你好，这里是鸣</h2>
              <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 14, color: C.ink3, lineHeight: 1.9, maxWidth: 320 }}>
                基于 {project?.brand.name} 的品牌档案，<br />随时为你生成内容、排期计划、竞品分析。
              </p>
            </div>
            {/* Quick actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', maxWidth: 380 }}>
              {QUICK.map(q => (
                <button key={q} className="ag-quick" onClick={() => sendMessage(q)} style={{
                  padding: '7px 14px', borderRadius: 99, fontFamily: SERIF, fontWeight: 300, fontSize: 13,
                  border: `1px solid ${C.border2}`, color: C.ink3, background: '#fff',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{q}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => <MessageRow key={msg.id} msg={msg} />)}

            {/* Streaming */}
            {(isLoading || streamingContent || streamingTools.length > 0) && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                <MingAvatar />
                <div style={{ flex: 1, maxWidth: '82%' }}>
                  {streamingTools.map(tc => <ToolCallCard key={tc.id} tc={tc} />)}
                  {streamingContent ? (
                    <div style={{ background: '#fff', border: `1px solid ${C.border2}`, borderRadius: '4px 14px 14px 14px', padding: '13px 16px', boxShadow: C.shadow }}>
                      <div className="ag-md"><MarkdownContent content={streamingContent} isUser={false} /></div>
                      <span style={{ display: 'inline-block', width: 2, height: 13, background: C.accent, marginLeft: 2, animation: 'agBlink 1s step-end infinite', verticalAlign: 'middle' }} />
                    </div>
                  ) : isLoading && streamingTools.length === 0 ? (
                    <div style={{ display: 'inline-flex', gap: 4, padding: '12px 16px', borderRadius: '4px 14px 14px 14px', background: '#fff', border: `1px solid ${C.border2}`, boxShadow: C.shadow }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: 2, background: C.ink4, animation: `agPulse 1s ${i*0.18}s ease-in-out infinite` }} />)}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ padding: '10px 16px 16px', borderTop: `1px solid ${C.border}`, background: C.bg, flexShrink: 0 }}>
        {/* Quick chips */}
        {!isEmpty && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 9 }}>
            {QUICK.map(q => (
              <button key={q} className="ag-quick" onClick={() => sendMessage(q)} style={{
                padding: '4px 10px', borderRadius: 99, fontFamily: MONO, fontSize: 10,
                border: `1px solid ${C.border}`, color: C.ink4, background: 'transparent',
                cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.03em',
              }}>{q}</button>
            ))}
          </div>
        )}

        {/* Textarea row */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: '#fff', borderRadius: 13,
          border: `1.5px solid ${C.border2}`,
          padding: '10px 12px',
          boxShadow: C.shadow,
          transition: 'border-color 0.18s',
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(28,58,46,0.4)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = C.border2)}
        >
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue) } }}
            placeholder="告诉鸣你想做什么… (Enter 发送，Shift+Enter 换行)"
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              resize: 'none', fontFamily: SERIF, fontWeight: 300, fontSize: 14, color: C.ink,
              lineHeight: 1.6, maxHeight: 120, overflowY: 'auto',
            }}
          />
          <button onClick={() => sendMessage(inputValue)} disabled={!inputValue.trim() || isLoading}
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0, border: 'none',
              background: inputValue.trim() && !isLoading ? C.accent : C.bg3,
              color: inputValue.trim() && !isLoading ? '#fff' : C.ink4,
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, transition: 'background 0.15s',
            }}>↑</button>
        </div>
        <p style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, textAlign: 'center', marginTop: 7, letterSpacing: '0.06em' }}>
          {project?.brand.name} · 鸣正在基于品牌档案回复
        </p>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function MingAvatar() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
      <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: '#fff' }}>鸣</span>
    </div>
  )
}

function MessageRow({ msg }: { msg: ChatMessage }) {
  const isUser  = msg.role === 'user'
  const [expanded, setExpanded] = useState(false)
  const hasTools = msg.toolCalls && msg.toolCalls.length > 0

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
      {!isUser && <MingAvatar />}
      <div style={{ maxWidth: '82%' }}>
        {/* Tool calls (collapsed by default) */}
        {hasTools && (
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => setExpanded(!expanded)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 11px', borderRadius: 99,
              border: `1px solid ${C.border2}`, background: C.bg2,
              cursor: 'pointer', fontFamily: MONO, fontSize: 10, color: C.ink3,
              letterSpacing: '0.04em', marginBottom: expanded ? 6 : 0, transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 11 }}>⚙</span>
              思考过程 · {msg.toolCalls!.length} 步
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={C.ink4} strokeWidth="2.5" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {expanded && (
              <div style={{ borderLeft: `2px solid ${C.border2}`, marginLeft: 8, paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {msg.toolCalls!.map((tc, i) => (
                  <div key={tc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 9, background: '#fff', border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                    {/* Left accent line */}
                    <div style={{ width: 2, height: 28, borderRadius: 1, background: tc.status === 'done' ? '#4a9e6a' : C.gold, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: C.ink2, letterSpacing: '0.03em' }}>{TOOL_LABELS[tc.toolName] || tc.toolName}</div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginTop: 1 }}>步骤 {i + 1}</div>
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: tc.status === 'done' ? '#4a9e6a' : C.gold, letterSpacing: '0.04em' }}>
                      {tc.status === 'done' ? 'DONE' : 'RUNNING'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message bubble */}
        {msg.content && (
          isUser ? (
            <div style={{ padding:'13px 16px', borderRadius:'14px 4px 14px 14px', background:C.accent, boxShadow:C.shadow }}>
              <div className="ag-md"><MarkdownContent content={msg.content} isUser={true} /></div>
            </div>
          ) : (
            <div style={{ padding:'13px 16px', borderRadius:'4px 14px 14px 14px', background:'#fff', border:`1px solid ${C.border2}`, boxShadow:C.shadow }}>
              <div className="ag-md"><MarkdownContent content={msg.content} isUser={false} /></div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function ToolCallCard({ tc }: { tc: ToolCall }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', marginBottom: 5, borderRadius: 9, background: '#fff', border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
      <div style={{ width: 2, height: 26, borderRadius: 1, background: tc.status === 'done' ? '#4a9e6a' : C.gold, flexShrink: 0 }} />
      <span style={{ fontFamily: MONO, fontSize: 10, color: C.ink2, flex: 1, letterSpacing: '0.03em' }}>{TOOL_LABELS[tc.toolName] || tc.toolName}</span>
      {tc.status === 'running'
        ? <div style={{ width: 12, height: 12, borderRadius: 6, border: `1.5px solid ${C.ink4}`, borderTopColor: C.gold, animation: 'agSpin 0.75s linear infinite', flexShrink: 0 }} />
        : <span style={{ fontFamily: MONO, fontSize: 9, color: '#4a9e6a', letterSpacing: '0.04em' }}>DONE</span>
      }
    </div>
  )
}
