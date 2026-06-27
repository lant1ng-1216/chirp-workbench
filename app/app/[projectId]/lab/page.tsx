'use client'
import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMingStore } from '@/lib/store'

const INVESTORS = [
  { id: 'paul_graham', name: 'Paul Graham', role: 'YC 联合创始人', initials: 'PG', color: '#f97316' },
  { id: 'naval', name: 'Naval Ravikant', role: 'AngelList 创始人', initials: 'NR', color: '#8b5cf6' },
  { id: 'peter_thiel', name: 'Peter Thiel', role: 'Founders Fund', initials: 'PT', color: '#3b82f6' },
  { id: 'ben_horowitz', name: 'Ben Horowitz', role: 'a16z 联合创始人', initials: 'BH', color: '#10b981' },
  { id: 'shen_nanpeng', name: '沈南鹏', role: '红杉中国创始合伙人', initials: '沈', color: '#ef4444' },
  { id: 'zhang_yiming', name: '张一鸣', role: '字节跳动创始人', initials: '张', color: '#06b6d4' },
  { id: 'xu_xin', name: '徐新', role: '今日资本创始人', initials: '徐', color: '#f59e0b' },
  { id: 'luo_yonghao', name: '罗永浩', role: '连续创业者 · 产品理想主义者', initials: '罗', color: '#ec4899' },
]

const VERDICT_COLOR: Record<string, string> = {
  'Pass': '#6b7280',
  '观望': '#f59e0b',
  '跟进': '#3b82f6',
  '强烈跟进': '#10b981',
}

interface InvestorResult {
  status: 'idle' | 'loading' | 'done'
  raw: string
  score?: string
  interest?: string
  concern?: string
  question?: string
  verdict?: string
  comment?: string
}

function parseResult(raw: string) {
  const get = (key: string) => {
    const match = raw.match(new RegExp(`${key}\\|\\|\\|([^|]+)\\|\\|\\|`))
    return match ? match[1].trim() : undefined
  }
  return {
    score: get('SCORE'),
    interest: get('INTEREST'),
    concern: get('CONCERN'),
    question: get('QUESTION'),
    verdict: get('VERDICT'),
    comment: get('COMMENT'),
  }
}

export default function LabPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.projectId as string
  const projects = useMingStore((s) => s.projects)
  const project = projects.find((p) => p.id === projectId)

  const [phase, setPhase] = useState<'start' | 'review' | 'report'>('start')
  const [extraContext, setExtraContext] = useState('')
  const [results, setResults] = useState<Record<string, InvestorResult>>(
    () => Object.fromEntries(INVESTORS.map((inv) => [inv.id, { status: 'idle', raw: '' }]))
  )
  const [chatTarget, setChatTarget] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const abortRefs = useRef<Record<string, AbortController>>({})

  if (!project) return null

  const doneCount = Object.values(results).filter((r) => r.status === 'done').length
  const allDone = doneCount === INVESTORS.length

  const streamInvestor = async (investorId: string, delayMs: number) => {
    await new Promise((r) => setTimeout(r, delayMs))
    setResults((prev) => ({ ...prev, [investorId]: { status: 'loading', raw: '' } }))

    const ctrl = new AbortController()
    abortRefs.current[investorId] = ctrl

    try {
      const res = await fetch('/api/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandProfile: project.brand, investorId, extraContext }),
        signal: ctrl.signal,
      })
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.trim()) continue
          const idx = line.indexOf(':')
          if (idx === -1) continue
          if (line.slice(0, idx) === '0') {
            try { accumulated += JSON.parse(line.slice(idx + 1)) } catch { /* partial */ }
          }
        }
        setResults((prev) => ({ ...prev, [investorId]: { status: 'loading', raw: accumulated } }))
      }

      const parsed = parseResult(accumulated)
      setResults((prev) => ({ ...prev, [investorId]: { status: 'done', raw: accumulated, ...parsed } }))
    } catch {
      setResults((prev) => ({ ...prev, [investorId]: { status: 'done', raw: '', comment: '评审中断' } }))
    }
  }

  const startReview = () => {
    setPhase('review')
    INVESTORS.forEach((inv, i) => streamInvestor(inv.id, i * 1800))
  }

  const chatWithInvestor = async () => {
    if (!chatTarget || !chatInput.trim() || chatLoading) return
    const investor = INVESTORS.find((i) => i.id === chatTarget)
    if (!investor) return
    const userMsg = { role: 'user', content: chatInput }
    const newMsgs = [...chatMessages, userMsg]
    setChatMessages(newMsgs)
    setChatInput('')
    setChatLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: newMsgs,
        brandProfile: project.brand,
        systemOverride: `你是${investor.name}，${investor.role}。用你的真实风格和口吻与创业者对话，针对他们的产品给出真实的投资人视角反馈。`,
      }),
    })
    if (!res.body) { setChatLoading(false); return }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let reply = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.trim()) continue
        const idx = line.indexOf(':')
        if (idx === -1) continue
        if (line.slice(0, idx) === '0') {
          try { reply += JSON.parse(line.slice(idx + 1)) } catch { /* partial */ }
        }
      }
      setChatMessages([...newMsgs, { role: 'assistant', content: reply }])
    }
    setChatLoading(false)
  }

  const avgScore = (() => {
    const scores = Object.values(results).map((r) => parseFloat(r.score || '0')).filter((s) => s > 0)
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
  })()

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#07070f', color: '#fff', position: 'relative' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(7,7,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push(`/app/${projectId}`)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>←</button>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.3px' }}>创意实验室</div>
            <div style={{ fontSize: 11, color: '#555' }}>{project.brand.name} · 投资人评审沙盘</div>
          </div>
        </div>
        {phase === 'review' && allDone && (
          <button onClick={() => setPhase('report')} style={{ padding: '7px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #7c6dfa, #a78bfa)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            生成综合报告 →
          </button>
        )}
        {phase === 'review' && !allDone && (
          <div style={{ fontSize: 11, color: '#555' }}>{doneCount} / {INVESTORS.length} 评审完成</div>
        )}
      </div>

      <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>

        {/* PHASE: START */}
        {phase === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, paddingTop: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#7c6dfa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>Ming · 创意实验室</div>
              <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', marginBottom: 12, lineHeight: 1.2 }}>
                召集 8 位顶级投资人<br />评审你的产品
              </h1>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, maxWidth: 480 }}>
                基于品牌档案，从 Paul Graham 到罗永浩，<br />
                获得最真实的投资人视角反馈
              </p>
            </div>

            {/* Brand card */}
            <div style={{ width: '100%', maxWidth: 520, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: '1px', marginBottom: 10 }}>已加载品牌档案</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: project.brand.colors[0] || '#7c6dfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {project.brand.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{project.brand.name}</div>
                  <div style={{ fontSize: 11, color: '#555' }}>{project.brand.industry}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#444', lineHeight: 1.7 }}>
                {[project.brand.tone, project.brand.audience].filter(Boolean).join(' · ')}
              </div>
            </div>

            {/* Extra context */}
            <div style={{ width: '100%', maxWidth: 520 }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>补充产品说明（可选）— 粘贴 URL、产品描述或任何补充信息</div>
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                placeholder="例：https://yourproduct.com 或粘贴产品简介..."
                rows={4}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#ccc', fontSize: 13, padding: '12px 14px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {/* Investor preview */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 520 }}>
              {INVESTORS.map((inv) => (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 99, border: `1px solid ${inv.color}33`, background: `${inv.color}11` }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: inv.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{inv.initials}</div>
                  <span style={{ fontSize: 11, color: '#888' }}>{inv.name}</span>
                </div>
              ))}
            </div>

            <button onClick={startReview} style={{ padding: '14px 40px', borderRadius: 12, background: 'linear-gradient(135deg, #7c6dfa, #a78bfa)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.3px' }}>
              召集评审团 →
            </button>
          </div>
        )}

        {/* PHASE: REVIEW */}
        {phase === 'review' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {INVESTORS.map((inv) => {
              const r = results[inv.id]
              const parsed = r.status === 'done' ? r : parseResult(r.raw)
              const score = parsed.score ? parseFloat(parsed.score) : null

              return (
                <div key={inv.id} style={{
                  border: `1px solid ${r.status === 'idle' ? 'rgba(255,255,255,0.06)' : inv.color + '44'}`,
                  borderRadius: 14,
                  padding: '18px 18px 16px',
                  background: r.status === 'idle' ? 'rgba(255,255,255,0.02)' : `${inv.color}0a`,
                  transition: 'all 0.4s',
                  opacity: r.status === 'idle' ? 0.4 : 1,
                }}>
                  {/* Investor header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: inv.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {inv.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.name}</div>
                      <div style={{ fontSize: 10, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.role}</div>
                    </div>
                    {score !== null && (
                      <div style={{ fontSize: 20, fontWeight: 700, color: inv.color, flexShrink: 0 }}>{score.toFixed(1)}</div>
                    )}
                    {r.status === 'loading' && (
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: 2, background: inv.color, animation: `fadeUp 0.9s ${i*0.15}s infinite` }} />)}
                      </div>
                    )}
                  </div>

                  {r.status === 'idle' && (
                    <div style={{ fontSize: 12, color: '#333', textAlign: 'center', padding: '16px 0' }}>等待评审…</div>
                  )}

                  {(r.status === 'loading' || r.status === 'done') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {parsed.verdict && (
                        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '3px 10px', borderRadius: 99, background: `${VERDICT_COLOR[parsed.verdict] || '#555'}22`, border: `1px solid ${VERDICT_COLOR[parsed.verdict] || '#555'}55`, fontSize: 11, fontWeight: 600, color: VERDICT_COLOR[parsed.verdict] || '#888' }}>
                          {parsed.verdict}
                        </div>
                      )}
                      {parsed.interest && (
                        <div>
                          <div style={{ fontSize: 10, color: '#555', marginBottom: 3 }}>💡 最感兴趣</div>
                          <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.6 }}>{parsed.interest}</div>
                        </div>
                      )}
                      {parsed.concern && (
                        <div>
                          <div style={{ fontSize: 10, color: '#555', marginBottom: 3 }}>⚠️ 最大顾虑</div>
                          <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.6 }}>{parsed.concern}</div>
                        </div>
                      )}
                      {parsed.question && (
                        <div>
                          <div style={{ fontSize: 10, color: '#555', marginBottom: 3 }}>❓ 会追问</div>
                          <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.6, fontStyle: 'italic' }}>{parsed.question}</div>
                        </div>
                      )}
                      {parsed.comment && (
                        <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#888', lineHeight: 1.7 }}>
                          {parsed.comment}
                        </div>
                      )}
                      {r.status === 'loading' && !parsed.comment && (
                        <div style={{ fontSize: 12, color: '#444', lineHeight: 1.7 }}>{r.raw.slice(-200)}</div>
                      )}
                    </div>
                  )}

                  {r.status === 'done' && (
                    <button onClick={() => { setChatTarget(inv.id); setChatMessages([]) }} style={{ marginTop: 12, width: '100%', padding: '7px 0', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${inv.color}33`, color: inv.color, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                      和 {inv.name} 深聊 →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* PHASE: REPORT */}
        {phase === 'report' && (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 11, color: '#7c6dfa', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>综合评审报告</div>
              <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 8 }}>{project.brand.name}</h2>
              {avgScore && <div style={{ fontSize: 40, fontWeight: 800, background: 'linear-gradient(135deg, #7c6dfa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{avgScore} <span style={{ fontSize: 16, fontWeight: 400, WebkitTextFillColor: '#555' }}>/ 10</span></div>}
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>8 位投资人综合评分</div>
            </div>

            {/* Verdict distribution */}
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px', marginBottom: 20, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 14 }}>评审结果分布</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {INVESTORS.map((inv) => {
                  const r = results[inv.id]
                  const verdict = r.verdict || '—'
                  return (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, background: inv.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{inv.initials}</div>
                      <span style={{ fontSize: 11, color: '#888' }}>{inv.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: VERDICT_COLOR[verdict] || '#555' }}>{verdict}</span>
                      {r.score && <span style={{ fontSize: 11, color: inv.color }}>{r.score}</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Individual summaries */}
            {INVESTORS.map((inv) => {
              const r = results[inv.id]
              if (!r.comment && !r.concern) return null
              return (
                <div key={inv.id} style={{ border: `1px solid ${inv.color}33`, borderRadius: 12, padding: '16px 18px', marginBottom: 12, background: `${inv.color}08` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: inv.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{inv.initials}</div>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{inv.name}</span>
                      <span style={{ fontSize: 10, color: '#555', marginLeft: 8 }}>{inv.role}</span>
                    </div>
                    {r.verdict && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: VERDICT_COLOR[r.verdict] || '#555', padding: '2px 8px', borderRadius: 99, background: `${VERDICT_COLOR[r.verdict] || '#555'}22` }}>{r.verdict}</span>}
                  </div>
                  {r.comment && <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.75, margin: 0 }}>{r.comment}</p>}
                </div>
              )
            })}

            <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
              <button onClick={() => setPhase('review')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                ← 返回评审
              </button>
              <button onClick={() => router.push(`/app/${projectId}`)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'linear-gradient(135deg, #7c6dfa, #a78bfa)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                存入知识库并继续 →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deep chat panel */}
      {chatTarget && (() => {
        const inv = INVESTORS.find((i) => i.id === chatTarget)!
        return (
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 360, background: '#0d0d18', borderLeft: `1px solid ${inv.color}44`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${inv.color}33`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: inv.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{inv.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.name}</div>
                <div style={{ fontSize: 10, color: '#555' }}>{inv.role}</div>
              </div>
              <button onClick={() => setChatTarget(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMessages.length === 0 && (
                <div style={{ fontSize: 12, color: '#444', textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
                  你可以直接追问 {inv.name}<br />关于你的产品的任何问题
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '85%', padding: '9px 13px', borderRadius: m.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px', background: m.role === 'user' ? inv.color : 'rgba(255,255,255,0.06)', fontSize: 13, color: '#ddd', lineHeight: 1.65 }}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${inv.color}22` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', padding: '8px 10px' }}>
                <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatWithInvestor() } }}
                  placeholder={`问 ${inv.name}…`} rows={2}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#ccc', fontSize: 13, resize: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={chatWithInvestor} disabled={chatLoading || !chatInput.trim()}
                  style={{ width: 28, height: 28, borderRadius: 7, background: chatInput.trim() ? inv.color : 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, flexShrink: 0 }}>
                  ↑
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
