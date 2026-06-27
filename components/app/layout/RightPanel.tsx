'use client'
import { useState, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import type { TodoItem, ExtractedCard } from '@/lib/store'

const C = {
  bg: '#faf9f7', bg2: '#f4f2ee', bg3: '#edeae4',
  ink: '#1a1916', ink2: '#4a4844', ink3: '#9a9894', ink4: '#c8c6c0',
  accent: '#1c3a2e', al: 'rgba(28,58,46,0.08)', al2: 'rgba(28,58,46,0.15)',
  gold: '#7a6020', gl: '#f5f0e8',
  border: 'rgba(26,25,22,0.08)', border2: 'rgba(26,25,22,0.14)',
  shadow: '0 1px 3px rgba(26,25,22,0.06),0 3px 10px rgba(26,25,22,0.04)',
  green: '#4a9e6a',
}
const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"
const SANS  = "'Noto Sans SC', 'PingFang SC', sans-serif"

type Tab = 'output' | 'todo' | 'knowledge'

/* On-demand generation items — clicking redirects to chat with pre-filled prompt */
const ON_DEMAND = [
  {
    id: 'strategy',
    label: '内容策略思维导图',
    desc: '可视化品牌内容支柱与话题架构',
    prompt: '帮我梳理品牌内容策略，生成一份内容支柱和话题架构的思维导图文字版，按层级列出',
    svg: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  },
  {
    id: 'calendar',
    label: '本周内容日历',
    desc: '智能排期，按平台最优时间建议',
    prompt: '帮我规划本周的内容日历，每天的发布计划、平台、内容方向，并给出最佳发布时间',
    svg: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    id: 'competitor',
    label: '竞品内容对比报告',
    desc: '分析竞品策略，找差异化机会',
    prompt: '帮我分析竞品的内容策略，与我们品牌做对比，找出差异化切入点和可以借鉴的方向',
    svg: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>,
  },
  {
    id: 'hook',
    label: '爆款标题生成器',
    desc: '基于品牌调性，生成 10 条吸睛标题',
    prompt: '基于我的品牌调性和目标受众，帮我生成 10 条适合小红书和抖音的爆款标题，风格多样',
    svg: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  },
  {
    id: 'weekly',
    label: '本周数据周报',
    desc: '汇总各平台表现，提炼洞察',
    prompt: '帮我生成本周的营销数据周报，总结各平台内容表现，提炼关键洞察和下周行动建议',
    svg: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
]

const DOC_TYPE_LABEL: Record<string, string> = {
  business_profile:     '业务概况',
  brand_guidelines:     '品牌规范',
  audience_persona:     '受众画像',
  social_strategy:      '社媒策略',
  first_week_calendar:  '首周日历',
  competitor_deep_dive: '竞品报告',
  market_research:      '市场调研',
  onboarding_brief:     '入驻简报',
}

const PLATFORM_EMOJI: Record<string, string> = {
  '小红书': '📕', '微博': '🌐', '抖音': '🎬', 'B站': '📺',
  '微信公众号': '💬', '知乎': '📖', 'Twitter': '🐦', 'Instagram': '📸', 'LinkedIn': '💼',
}

function CopyItem({ card, index }: { card: ExtractedCard; index: number }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const copy = async () => {
    try { await navigator.clipboard.writeText(card.content) } catch {
      const el = document.createElement('textarea'); el.value = card.content
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ borderRadius: 8, border: `1px solid ${C.border2}`, overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 9px', background: C.bg2, borderBottom: expanded ? `1px solid ${C.border}` : 'none' }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, minWidth: 14 }}>#{index + 1}</span>
        <span style={{ fontFamily: SANS, fontSize: 10, color: C.ink3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {card.content.slice(0, 24).replace(/\n/g, ' ')}…
        </span>
        <button onClick={() => setExpanded(v => !v)} style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          {expanded ? '收起' : '查看'}
        </button>
        <button onClick={copy} style={{
          display: 'flex', alignItems: 'center', gap: 2, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
          border: `1px solid ${copied ? 'rgba(28,58,46,0.3)' : C.border2}`,
          background: copied ? 'rgba(28,58,46,0.07)' : C.bg,
          color: copied ? C.accent : C.ink4,
          cursor: 'pointer', fontSize: 9, fontFamily: MONO, transition: 'all 0.15s',
        }}>
          {copied ? '✓' : '⎘'}
        </button>
      </div>
      {expanded && (
        <div style={{ padding: '9px 10px', fontFamily: SANS, fontSize: 11, color: C.ink2, lineHeight: 1.75, whiteSpace: 'pre-wrap', maxHeight: 320, overflowY: 'auto' }}>
          {card.content}
        </div>
      )}
    </div>
  )
}

function GeneratedContent({ cards, projectId, threadId, onClear }: {
  cards: ExtractedCard[]
  projectId: string
  threadId: string | null
  onClear: () => void
}) {
  const platforms = useMemo(() => {
    const seen = new Set<string>()
    const order: string[] = []
    cards.forEach(c => { if (!seen.has(c.platform)) { seen.add(c.platform); order.push(c.platform) } })
    return order
  }, [cards])

  const [activePlat, setActivePlat] = useState<string>('')
  const currentPlat = platforms.includes(activePlat) ? activePlat : platforms[0] ?? ''
  const platCards = cards.filter(c => c.platform === currentPlat)

  if (cards.length === 0) {
    return (
      <div style={{ marginTop: 8, padding: '10px 11px', borderRadius: 9, background: C.gl, border: `1px solid rgba(122,96,32,0.14)` }}>
        <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 10, color: C.ink3, lineHeight: 1.8, margin: 0 }}>
          与鸣对话后，生成的各平台营销文案将自动出现在此处，支持一键复制。
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.06em' }}>已生成内容</span>
        <button onClick={onClear} style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, background: 'none', border: 'none', cursor: 'pointer' }}>清空</button>
      </div>

      {/* Platform tabs */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 9 }}>
        {platforms.map(plat => {
          const active = plat === currentPlat
          const count = cards.filter(c => c.platform === plat).length
          return (
            <button key={plat} onClick={() => setActivePlat(plat)} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 99,
              border: `1px solid ${active ? C.accent : C.border2}`,
              background: active ? C.accent : '#fff',
              color: active ? '#fff' : C.ink3,
              cursor: 'pointer', fontSize: 10, fontFamily: SANS, transition: 'all 0.15s',
            }}>
              <span>{PLATFORM_EMOJI[plat] ?? '📄'}</span>
              <span>{plat}</span>
              {count > 1 && <span style={{ fontFamily: MONO, fontSize: 8, opacity: 0.7 }}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Cards for active platform */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {platCards.map((card, i) => <CopyItem key={card.id} card={card} index={i} />)}
      </div>
    </div>
  )
}

export default function RightPanel() {
  const params    = useParams()
  const router    = useRouter()
  const projectId = params?.projectId as string
  const { projects, todos, addTodo, toggleTodo, removeTodo, extractedCards, clearExtractedCards, activeThreadId } = useMingStore()
  const project   = projects.find(p => p.id === projectId)
  const sessionCards = extractedCards.filter(c => c.projectId === projectId && (!activeThreadId || c.threadId === activeThreadId))

  const [tab,         setTab]         = useState<Tab>('output')
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  const [todoInput,   setTodoInput]   = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (!project) return null
  const { brand } = project

  const projectTodos = todos.filter(t => t.projectId === projectId)
  const doneTodos    = projectTodos.filter(t => t.done)
  const pendingTodos = projectTodos.filter(t => !t.done)

  const submitTodo = () => {
    const text = todoInput.trim()
    if (!text) return
    const item: TodoItem = { id: `todo-${Date.now()}`, projectId, text, done: false, createdAt: new Date().toISOString() }
    addTodo(item)
    setTodoInput('')
    inputRef.current?.focus()
  }

  const goChat = (prompt: string) => {
    router.push(`/app/${projectId}?prompt=${encodeURIComponent(prompt)}`)
  }

  return (
    <aside style={{ width: 252, flexShrink: 0, background: C.bg, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: SANS }}>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {(['output', 'todo', 'knowledge'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '11px 0', fontFamily: SERIF, fontSize: 11, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? C.ink : C.ink4, background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: `1.5px solid ${tab === t ? C.accent : 'transparent'}`,
            transition: 'color 0.15s',
          }}>
            {{ output: '内容输出', todo: '待办', knowledge: '知识库' }[t]}
            {t === 'todo' && pendingTodos.length > 0 && (
              <span style={{ marginLeft: 5, fontFamily: MONO, fontSize: 8, background: C.accent, color: '#fff', borderRadius: 99, padding: '1px 5px' }}>{pendingTodos.length}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>

        {/* ── OUTPUT TAB ── */}
        {tab === 'output' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 11, color: C.ink4, margin: '0 0 6px 0', lineHeight: 1.7 }}>
              点击下方按钮，鸣将在聊天室为你生成对应内容
            </p>

            <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '6px 2px 4px' }}>按需生成</div>

            {ON_DEMAND.map(tool => (
              <button key={tool.id} onClick={() => goChat(tool.prompt)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 11px', borderRadius: 9, cursor: 'pointer', textAlign: 'left' as const,
                border: `1px solid ${C.border2}`, background: '#fff', boxShadow: C.shadow,
                transition: 'border-color 0.15s, background 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.al }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.background = '#fff' }}
              >
                <span style={{ color: C.ink4, flexShrink: 0 }}>{tool.svg}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 2 }}>{tool.label}</div>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: C.ink4, lineHeight: 1.5 }}>{tool.desc}</div>
                </div>
                <svg width="9" height="9" fill="none" stroke={C.ink4} strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            ))}

            <GeneratedContent
              cards={sessionCards}
              projectId={projectId}
              threadId={activeThreadId}
              onClear={() => activeThreadId && clearExtractedCards(projectId, activeThreadId)}
            />
          </div>
        )}

        {/* ── TODO TAB ── */}
        {tab === 'todo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Input */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
              <input
                ref={inputRef}
                value={todoInput}
                onChange={e => setTodoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitTodo()}
                placeholder="添加待办…"
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 8,
                  border: `1px solid ${C.border2}`, background: '#fff',
                  fontFamily: SERIF, fontWeight: 300, fontSize: 12, color: C.ink, outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(28,58,46,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = C.border2)}
              />
              <button onClick={submitTodo} style={{
                width: 30, borderRadius: 8, border: 'none',
                background: todoInput.trim() ? C.accent : C.bg3,
                color: todoInput.trim() ? '#fff' : C.ink4,
                cursor: todoInput.trim() ? 'pointer' : 'not-allowed',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}>+</button>
            </div>

            {/* Pending */}
            {pendingTodos.length === 0 && doneTodos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 12px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.al, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontFamily: SERIF, color: C.accent, fontSize: 16 }}>✓</div>
                <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 12, color: C.ink4, lineHeight: 1.8 }}>
                  今日清空！<br />也可以让鸣帮你列待办
                </p>
                <button onClick={() => goChat('帮我列出今天的营销待办清单')} style={{
                  marginTop: 10, padding: '6px 14px', borderRadius: 7, border: `1px solid ${C.border2}`,
                  background: 'transparent', color: C.ink3, fontFamily: SERIF, fontSize: 11, cursor: 'pointer',
                }}>让鸣来列</button>
              </div>
            )}

            {pendingTodos.map(todo => (
              <TodoRow key={todo.id} todo={todo} onToggle={() => toggleTodo(todo.id)} onRemove={() => removeTodo(todo.id)} />
            ))}

            {/* Done section */}
            {doneTodos.length > 0 && (
              <>
                <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, letterSpacing: '0.12em', padding: '10px 2px 4px', textTransform: 'uppercase' as const }}>已完成 · {doneTodos.length}</div>
                {doneTodos.map(todo => (
                  <TodoRow key={todo.id} todo={todo} onToggle={() => toggleTodo(todo.id)} onRemove={() => removeTodo(todo.id)} />
                ))}
              </>
            )}
          </div>
        )}

        {/* ── KNOWLEDGE TAB ── */}
        {tab === 'knowledge' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.08em', margin: '0 0 6px 0' }}>
              知识库 · {brand.knowledgeDocs.length} 份文档
            </p>

            {brand.knowledgeDocs.length === 0 && (
              <div style={{ padding: '24px 12px', textAlign: 'center', borderRadius: 9, border: `1px solid ${C.border}`, background: '#fff' }}>
                <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 12, color: C.ink4, lineHeight: 1.8 }}>
                  知识库为空<br />完成 Lab 评审后文档会自动同步
                </p>
              </div>
            )}

            {brand.knowledgeDocs.map(doc => (
              <div key={doc.id} style={{ borderRadius: 9, border: `1px solid ${C.border2}`, background: '#fff', overflow: 'hidden', boxShadow: C.shadow }}>
                <div onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.al)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="11" height="11" fill="none" stroke={C.ink4} strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: SERIF, fontSize: 11, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                    <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, letterSpacing: '0.04em', marginTop: 1 }}>{DOC_TYPE_LABEL[doc.type] || doc.type}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontFamily: MONO, fontSize: 8, color: C.ink4 }}>{new Date(doc.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</span>
                    <svg width="8" height="8" fill="none" stroke={C.ink4} strokeWidth="2" viewBox="0 0 24 24"><path d={expandedDoc === doc.id ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'}/></svg>
                  </div>
                </div>
                {expandedDoc === doc.id && (
                  <div style={{ padding: '8px 11px 11px', borderTop: `1px solid ${C.border}`, fontFamily: SERIF, fontWeight: 300, fontSize: 11, color: C.ink2, lineHeight: 1.9, maxHeight: 180, overflowY: 'auto' }}>
                    {doc.content}
                  </div>
                )}
              </div>
            ))}

            {/* Brand assets */}
            <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '10px 2px 4px' }}>品牌素材</div>

            <div style={{ borderRadius: 9, border: `1px solid ${C.border2}`, background: '#fff', padding: '12px 12px 10px', boxShadow: C.shadow }}>
              {/* Brand tone */}
              {brand.tone && (
                <div style={{ marginTop: 10, paddingTop: 9, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, letterSpacing: '0.06em', marginBottom: 5 }}>品牌调性</div>
                  <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 11, color: C.ink2, lineHeight: 1.8 }}>{brand.tone}</div>
                </div>
              )}

              {/* Content pillars */}
              {brand.contentPillars?.length > 0 && (
                <div style={{ marginTop: 9, paddingTop: 9, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, letterSpacing: '0.06em', marginBottom: 6 }}>内容支柱</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {brand.contentPillars.map(p => (
                      <span key={p} style={{ fontFamily: SANS, fontSize: 10, padding: '2px 8px', borderRadius: 99, background: C.al, color: C.accent }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ marginTop: 10, paddingTop: 9, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 5 }}>
                <button onClick={() => goChat('帮我检查并更新品牌知识库，看看有什么需要补充的')} style={{
                  flex: 1, padding: '6px 0', fontFamily: MONO, fontSize: 9, color: C.ink3,
                  background: C.bg2, border: 'none', borderRadius: 6, cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}>询问鸣更新</button>
                <button onClick={() => router.push('/onboarding')} style={{
                  flex: 1, padding: '6px 0', fontFamily: MONO, fontSize: 9, color: C.accent,
                  background: C.al, border: 'none', borderRadius: 6, cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}>更新品牌档案</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
  )
}

function TodoRow({ todo, onToggle, onRemove }: { todo: TodoItem; onToggle: () => void; onRemove: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8,
      border: `1px solid ${todo.done ? C.border : C.border2}`,
      background: todo.done ? C.bg2 : '#fff',
      boxShadow: todo.done ? 'none' : C.shadow,
      transition: 'all 0.15s',
    }}>
      {/* Checkbox */}
      <button onClick={onToggle} style={{
        width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${todo.done ? C.green : C.border2}`,
        background: todo.done ? C.green : 'transparent', flexShrink: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        transition: 'all 0.15s',
      }}>
        {todo.done && <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>}
      </button>

      {/* Text */}
      <span style={{
        fontFamily: SERIF, fontWeight: 300, fontSize: 12, color: todo.done ? C.ink4 : C.ink,
        flex: 1, lineHeight: 1.5, textDecoration: todo.done ? 'line-through' : 'none',
        transition: 'all 0.15s',
      }}>{todo.text}</span>

      {/* Delete */}
      {hover && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, padding: '0 2px', flexShrink: 0, lineHeight: 1 }}>
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      )}
    </div>
  )
}

// Export color tokens used in TodoRow
const { border: _b, border2: _b2, bg2: _bg2, green: _g, ink: _i, ink4: _i4 } = C
void _b; void _b2; void _bg2; void _g; void _i; void _i4
