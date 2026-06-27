'use client'
import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMingStore } from '@/lib/store'

/* ─── Design tokens (ELN-inspired warm editorial palette) ─── */
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
  gold:    '#7a6020',
  gl:      '#f5f0e8',
  border:  'rgba(26,25,22,0.08)',
  border2: 'rgba(26,25,22,0.14)',
  shadow:  '0 1px 3px rgba(26,25,22,0.08),0 4px 12px rgba(26,25,22,0.04)',
  sfloat:  '0 8px 32px rgba(26,25,22,0.12),0 2px 8px rgba(26,25,22,0.06)',
  ming:    '#5b4eb8',
}

const SERIF = "'Noto Serif SC', 'Noto Serif', Georgia, serif"
const MONO  = "'Space Mono', 'Courier New', monospace"
const SANS  = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"

/* ─── Investors ─── */
const INVESTORS = [
  { id: 'paul_graham',     name: 'Paul Graham',     nameShort: 'P. Graham',  role: 'Y Combinator 联合创始人',    seed: 'PaulGraham2024',     hue: '#2d6a4f' },
  { id: 'marc_andreessen', name: 'Marc Andreessen', nameShort: 'Andreessen', role: 'a16z 联合创始人',             seed: 'MarcAndreessen2024', hue: '#1d4e89' },
  { id: 'peter_thiel',     name: 'Peter Thiel',     nameShort: 'P. Thiel',   role: 'Founders Fund · 《从0到1》',  seed: 'PeterThiel2024',     hue: '#6d213c' },
  { id: 'reid_hoffman',    name: 'Reid Hoffman',    nameShort: 'R. Hoffman', role: 'Greylock · LinkedIn 创始人', seed: 'ReidHoffman2024',    hue: '#0f4c5c' },
  { id: 'shen_nanpeng',    name: '沈南鹏',           nameShort: '沈南鹏',      role: '红杉中国创始合伙人',           seed: 'ShenNanpeng2024',    hue: '#8b2020' },
  { id: 'zhang_yiming',    name: '张一鸣',           nameShort: '张一鸣',      role: '字节跳动创始人',               seed: 'ZhangYiming2024',    hue: '#2b4162' },
  { id: 'xu_xin',          name: '徐新',             nameShort: '徐新',        role: '今日资本创始人',               seed: 'XuXin2024',          hue: '#6b4c11' },
  { id: 'luo_yonghao',     name: '罗永浩',           nameShort: '罗永浩',      role: '锤子科技 · 连续创业者',        seed: 'LuoYonghao2024',     hue: '#3d2b1f' },
]

const VERDICT_CFG: Record<string, { fg: string; bg: string; border: string }> = {
  'Pass':     { fg: '#9a9894', bg: '#edeae4',       border: 'rgba(26,25,22,0.14)' },
  '观望':     { fg: '#7a6020', bg: '#f5f0e8',       border: 'rgba(122,96,32,0.25)' },
  '跟进':     { fg: '#1d4e89', bg: '#eef3fb',       border: 'rgba(29,78,137,0.22)' },
  '强烈跟进': { fg: '#2d6a4f', bg: '#edf6f0',       border: 'rgba(45,106,79,0.25)' },
}

interface InvResult {
  status: 'idle' | 'streaming' | 'done'
  score: string; interest: string; concern: string; question: string; verdict: string; comment: string
}
interface Direction { title: string; logic: string; firstStep: string; source?: string }
interface ReviewSummary { investor: string; verdict: string; score: string; comment: string }
interface Synthesis { diagnosis: string; insights?: string[]; directions: Direction[]; reviews?: ReviewSummary[] }

function parseFields(raw: string) {
  const get = (key: string) => { const m = raw.match(new RegExp(`${key}\\|\\|\\|([\\s\\S]*?)\\|\\|\\|`)); return m ? m[1].trim() : '' }
  return { score: get('SCORE'), interest: get('INTEREST'), concern: get('CONCERN'), question: get('QUESTION'), verdict: get('VERDICT'), comment: get('COMMENT') }
}

/* ─── Sub-components ─── */
function Avatar({ seed, hue, size = 44 }: { seed: string; hue: string; size?: number }) {
  const r = Math.round(size * 0.22)
  return (
    <div style={{ width: size, height: size, borderRadius: r, overflow: 'hidden', background: hue + '18', border: `1.5px solid ${hue}35`, flexShrink: 0 }}>
      <img src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&backgroundColor=transparent`} alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={e => (e.currentTarget.style.display = 'none')} />
    </div>
  )
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const cfg = VERDICT_CFG[verdict] || { fg: C.ink3, bg: C.bg3, border: C.border2 }
  return (
    <span style={{ fontFamily: MONO, fontSize: 10, padding: '3px 9px', borderRadius: 99, color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.border}`, letterSpacing: '0.04em', flexShrink: 0 }}>
      {verdict}
    </span>
  )
}

function FieldRow({ icon, label, text, italic }: { icon: string; label: string; text: string; italic?: boolean }) {
  if (!text) return null
  return (
    <div style={{ display: 'flex', gap: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.12em', marginBottom: 3 }}>{label}</div>
        <div style={{ fontFamily: SERIF, fontSize: 14, color: C.ink2, lineHeight: 1.85, fontStyle: italic ? 'italic' : 'normal', fontWeight: 300 }}>{text}</div>
      </div>
    </div>
  )
}

/* ─── Main page ─── */
export default function LabPage() {
  const params    = useParams()
  const router    = useRouter()
  const projectId = params?.projectId as string
  const { projects, addKnowledgeDoc } = useMingStore()
  const project   = projects.find(p => p.id === projectId)

  type Phase = 'idle' | 'review' | 'synthesis' | 'direction'
  const [phase,      setPhase]      = useState<Phase>('idle')
  const [results,    setResults]    = useState<Record<string, InvResult>>(
    () => Object.fromEntries(INVESTORS.map(i => [i.id, { status: 'idle', score: '', interest: '', concern: '', question: '', verdict: '', comment: '' }]))
  )
  const [synthesis,  setSynthesis]  = useState<Synthesis | null>(null)
  const [selected,   setSelected]   = useState<number | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customStep,  setCustomStep]  = useState('')
  const [transition,   setTransition]   = useState(false)
  const [activeInv,    setActiveInv]    = useState<string | null>(null)
  const [reviewModal,  setReviewModal]  = useState<string | null>(null) // investor id

  const resultsRef = useRef(results)
  resultsRef.current = results

  const doneCount = Object.values(results).filter(r => r.status === 'done').length
  const allDone   = doneCount === INVESTORS.length

  if (!project) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: SERIF, color: C.ink3 }}>
      项目不存在，请重新创建
    </div>
  )

  const streamOne = async (inv: typeof INVESTORS[0], delay: number) => {
    await new Promise(r => setTimeout(r, delay))
    setActiveInv(inv.id)
    setResults(prev => ({ ...prev, [inv.id]: { ...prev[inv.id], status: 'streaming' } }))
    let raw = ''
    try {
      const res = await fetch('/api/lab', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandProfile: project.brand, investorId: inv.id }),
      })
      if (!res.body) throw new Error('no body')
      const reader = res.body.getReader(); const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          const idx = line.indexOf(':'); if (idx < 1) continue
          if (line.slice(0, idx) === '0') { try { raw += JSON.parse(line.slice(idx + 1)) } catch { /* partial */ } }
        }
        setResults(prev => ({ ...prev, [inv.id]: { status: 'streaming', ...parseFields(raw) } }))
      }
    } catch { /* silent */ }
    setResults(prev => ({ ...prev, [inv.id]: { status: 'done', ...parseFields(raw) } }))
    setTimeout(() => { document.getElementById(`inv-card-${inv.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, 120)
  }

  const startReview = () => {
    setPhase('review')
    INVESTORS.forEach((inv, i) => streamOne(inv, i * 1600))
  }

  useEffect(() => {
    if (!allDone || phase !== 'review') return
    setActiveInv(null)
    setTransition(true)
    setTimeout(() => { setTransition(false); setPhase('synthesis') }, 2200)
    ;(async () => {
      const investorResults = INVESTORS.map(inv => {
        const r = resultsRef.current[inv.id]
        return { name: inv.name, score: r.score || '0', interest: r.interest, concern: r.concern, question: r.question, verdict: r.verdict, comment: r.comment }
      })
      try {
        const res  = await fetch('/api/lab/synthesize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandProfile: project.brand, investorResults }),
        })
        setSynthesis(await res.json())
      } catch {
        setSynthesis({
          diagnosis: '评审完成，投资人对品牌叙事潜力高度认可，建议优先建立内容认知壁垒并深耕垂直社群。',
          insights: [
            '6/8 位投资人认为品牌故事是核心差异化资产，叙事潜力突出',
            '主要顾虑集中在冷启动阶段的用户获取路径，需要清晰的第一步',
            '建议优先选择小红书或抖音作为内容主阵地切入中国市场',
          ],
          directions: [
            { title: '内容营销突破', logic: '用高质量叙事内容建立品牌认知，低成本撬动自然流量', firstStep: '发布第一篇品牌起源故事，选择小红书首发', source: '基于多位投资人共识' },
            { title: '垂直社群渗透', logic: '深耕一个精准垂直圈层，建立口碑后向外扩散', firstStep: '找到 10 个核心目标用户，加入他们活跃的社群', source: '基于 P. Graham 的建议' },
            { title: '热点借势传播', logic: '结合实时热点与品牌调性，快速获得公域曝光', firstStep: '本周选择一个相关热搜话题，制作品牌视角内容', source: '基于 R. Hoffman 的建议' },
          ],
        })
      }
      setTimeout(() => setPhase('direction'), 2500)
    })()
  }, [allDone, phase])

  const avgScore = (() => {
    const scores = INVESTORS.map(i => parseFloat(resultsRef.current[i.id].score || '0')).filter(s => s > 0)
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
  })()

  const isCustomMode = selected === -1
  const canConfirm = selected !== null && (!isCustomMode || (customTitle.trim() && customStep.trim()))

  const confirmDirection = async () => {
    if (!canConfirm || !synthesis) return
    setSaving(true)
    const dir: Direction = isCustomMode
      ? { title: customTitle.trim(), logic: '自定义方向', firstStep: customStep.trim() }
      : synthesis.directions[selected as number]
    addKnowledgeDoc(projectId, {
      id: `lab-${Date.now()}`,
      title: `投资人评审 · ${dir.title}`,
      content: `# 创意实验室报告\n\n## 综合诊断\n${synthesis.diagnosis}\n\n## 选定方向：${dir.title}\n**逻辑：** ${dir.logic}\n**第一步：** ${dir.firstStep}\n\n*生成于 ${new Date().toLocaleDateString('zh-CN')}*`,
      type: 'market_research',
      updatedAt: new Date().toISOString(),
    })
    router.push(`/app/${projectId}?lab_direction=${encodeURIComponent(dir.title)}&lab_step=${encodeURIComponent(dir.firstStep)}`)
  }

  const KF = `
    @keyframes labFadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes labFadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes labBlink    { 50%{opacity:0} }
    @keyframes labPulse    { 0%,100%{opacity:1} 50%{opacity:.28} }
    @keyframes labSpin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes labSlideUp  { from{opacity:0;transform:translateY(18px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    .inv-card:hover { box-shadow: 0 6px 28px rgba(26,25,22,0.1) !important; }
    .dir-card:hover { border-color: rgba(28,58,46,0.35) !important; }
    .inv-sidebar-row:hover { background: ${C.al} !important; }
  `

  return (
    <>
      <style>{KF}</style>

      {/* ── Chapter transition overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100, background: C.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
        opacity: transition ? 1 : 0, pointerEvents: transition ? 'all' : 'none',
        transition: 'opacity 0.55s ease',
      }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, letterSpacing: '0.2em', textTransform: 'uppercase' }}>第二幕</div>
        <div style={{ width: 40, height: 1, background: C.ink4 }} />
        <div style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: C.accent, letterSpacing: '0.03em' }}>鸣 · 综合分析</div>
        <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 300, color: C.ink3 }}>基于 {INVESTORS.length} 位投资人意见，提炼方向</div>
      </div>

      {/* ── Topbar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, height: 52, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, background: 'rgba(250,249,247,0.96)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.accent, letterSpacing: '0.04em' }}>创意实验室</span>
        <span style={{ color: C.ink4, fontWeight: 300 }}>·</span>
        <span style={{ fontFamily: SANS, fontSize: 13, color: C.ink3 }}>{project.brand.name}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {(['投资人评审', '综合分析', '选择方向'] as const).map((label, i) => {
            const active = (i === 0 && ['idle','review'].includes(phase)) || (i === 1 && phase === 'synthesis') || (i === 2 && phase === 'direction')
            const done   = (i === 0 && ['synthesis','direction'].includes(phase)) || (i === 1 && phase === 'direction')
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: C.ink4, fontSize: 8, fontFamily: MONO }}>—</span>}
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', color: active ? C.accent : done ? C.ink3 : C.ink4, fontWeight: active ? 700 : 400 }}>
                  {i + 1}. {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Investor Review Modal ── */}
      {reviewModal && (() => {
        const inv = INVESTORS.find(i => i.id === reviewModal)!
        const r   = results[reviewModal]
        const rev = synthesis?.reviews?.find(rv => rv.investor === inv.name)
        const vcfg = r.verdict ? VERDICT_CFG[r.verdict] : null
        return (
          <div onClick={() => setReviewModal(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(26,25,22,0.42)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'labFadeIn 0.2s both' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ position: 'relative', background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(26,25,22,0.22),0 4px 16px rgba(26,25,22,0.1)', animation: 'labSlideUp 0.28s both', overflow: 'hidden' }}>

              {/* Close button — anchored to card corner, above everything */}
              <button onClick={() => setReviewModal(null)}
                style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, width: 28, height: 28, borderRadius: 14, border: `1px solid ${C.border2}`, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', color: C.ink3, cursor: 'pointer', fontFamily: MONO, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                ×
              </button>

              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px 16px', paddingRight: 52, borderBottom: `1px solid ${C.border}`, background: inv.hue + '08' }}>
                <Avatar seed={inv.seed} hue={inv.hue} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.ink }}>{inv.name}</span>
                    {r.verdict && <VerdictBadge verdict={r.verdict} />}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, letterSpacing: '0.03em' }}>{inv.role}</div>
                </div>
                {r.score && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: inv.hue, lineHeight: 1, letterSpacing: '-1px' }}>{parseFloat(r.score).toFixed(1)}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>/ 10</div>
                  </div>
                )}
              </div>

              {/* Modal body */}
              <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {r.interest && (
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.1em', marginBottom: 6 }}>💡 最感兴趣</div>
                    <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 300, color: C.ink2, lineHeight: 1.9 }}>{r.interest}</div>
                  </div>
                )}
                {r.concern && (
                  <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.1em', marginBottom: 6 }}>⚠ 最大顾虑</div>
                    <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 300, color: C.ink2, lineHeight: 1.9 }}>{r.concern}</div>
                  </div>
                )}
                {r.question && (
                  <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.1em', marginBottom: 6 }}>❓ 想追问创始人</div>
                    <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 300, color: C.ink2, lineHeight: 1.9, fontStyle: 'italic' }}>{r.question}</div>
                  </div>
                )}
                {(rev?.comment || r.comment) && (
                  <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}`, background: inv.hue + '06', borderRadius: 12, padding: '14px 16px', margin: '0 -4px' }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.1em', marginBottom: 8 }}>综合评价</div>
                    <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 300, color: C.ink2, lineHeight: 2, textAlign: 'justify' }}>{rev?.comment || r.comment}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Body ── */}
      <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>

        {/* LEFT SIDEBAR */}
        <aside style={{ width: 236, flexShrink: 0, borderRight: `1px solid ${C.border}`, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>评审团</div>
            {avgScore ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: C.accent, lineHeight: 1 }}>{avgScore}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.ink3 }}>/ 10 综合</span>
              </div>
            ) : phase !== 'idle' && (
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: 2, background: C.ink4, animation: `labPulse 1.2s ${i*0.2}s ease-in-out infinite` }} />)}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
            {INVESTORS.map((inv, idx) => {
              const r = results[inv.id]
              const isStreaming = r.status === 'streaming'
              const isDone = r.status === 'done'
              const isActive = activeInv === inv.id
              const isIdle = r.status === 'idle' && phase !== 'idle'
              const score = r.score ? parseFloat(r.score) : null
              const vcfg = r.verdict ? VERDICT_CFG[r.verdict] : null

              const canClick = isStreaming || isDone
              const handleSidebarClick = () => {
                if (phase === 'direction' && isDone) {
                  setReviewModal(inv.id)
                } else if (canClick) {
                  document.getElementById(`inv-card-${inv.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }
              return (
                <div key={inv.id} className="inv-sidebar-row" onClick={handleSidebarClick}
                  title={phase === 'direction' && isDone ? `查看 ${inv.name} 的完整评审` : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '8px 8px', borderRadius: 9, marginBottom: 2,
                    cursor: canClick ? 'pointer' : 'default',
                    background: isActive ? C.al : 'transparent', border: `1px solid ${isActive ? C.al2 : 'transparent'}`,
                    opacity: isIdle ? 0.38 : 1, transition: 'all 0.25s ease',
                    animation: phase !== 'idle' ? `labFadeIn 0.4s ${idx * 0.07}s both` : 'none',
                  }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar seed={inv.seed} hue={inv.hue} size={33} />
                    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: 4, border: `1.5px solid ${C.bg}`, background: isDone ? '#4a9e6a' : isStreaming ? C.gold : C.ink4, animation: isStreaming ? 'labPulse 1s ease-in-out infinite' : 'none' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: SANS, fontSize: 12, color: C.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: vcfg ? vcfg.fg : C.ink4, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {vcfg ? r.verdict : inv.role.split('·')[0].trim()}
                    </div>
                  </div>
                  {score !== null
                    ? <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: inv.hue, flexShrink: 0 }}>{score.toFixed(1)}</span>
                    : isStreaming && <div style={{ width: 13, height: 13, borderRadius: 7, border: `1.5px solid ${C.ink4}`, borderTopColor: C.accent, animation: 'labSpin 0.75s linear infinite', flexShrink: 0 }} />}
                </div>
              )
            })}
          </div>

          {/* sidebar bottom */}
          <div style={{ padding: '10px 16px 14px', borderTop: `1px solid ${C.border}` }}>
            {phase === 'direction' && (
              <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.06em', lineHeight: 1.7 }}>
                点击评审人<br />查看完整发言
              </div>
            )}
            {phase === 'idle' ? (
              <div style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 300, color: C.ink3, lineHeight: 1.8 }}>召集 8 位顶级投资人，获得最直接的产品评审</div>
            ) : (phase === 'review' || phase === 'synthesis') ? (
              <>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.1em', marginBottom: 7 }}>进度</div>
                <div style={{ height: 2, background: C.bg3, borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: C.accent, borderRadius: 1, width: `${(doneCount / INVESTORS.length) * 100}%`, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink3, marginTop: 5 }}>{doneCount} / {INVESTORS.length} 完成</div>
              </>
            ) : null}
          </div>
        </aside>

        {/* MAIN STAGE */}
        <main style={{ flex: 1, overflowY: 'auto', background: C.bg }}>

          {/* ── IDLE ── */}
          {phase === 'idle' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '60px 48px' }}>
              <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, textAlign: 'center' }}>
                {/* paper texture hint */}
                <div style={{ position: 'absolute', inset: '-60px -48px', backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(26,25,22,0.03) 27px,rgba(26,25,22,0.03) 28px)', pointerEvents: 'none' }} />

                {/* brand chip */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 14px 7px 9px', borderRadius: 99, border: `1px solid ${C.border2}`, background: '#fff', boxShadow: C.shadow, marginBottom: 36, position: 'relative' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: project.brand.colors[0] || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff' }}>
                    {project.brand.name.charAt(0)}
                  </div>
                  <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: C.ink }}>{project.brand.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{project.brand.industry}</span>
                </div>

                <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 600, color: C.ink, lineHeight: 1.35, letterSpacing: '0.015em', marginBottom: 16, position: 'relative' }}>
                  8 位顶级投资人<br />正在等待评审你的产品
                </h1>
                <p style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 300, color: C.ink3, lineHeight: 2, marginBottom: 44, position: 'relative' }}>
                  来自硅谷与中国最具影响力的投资人，<br />将从各自视角出发，给出最真实的判断。
                </p>

                {/* avatar row */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40, position: 'relative' }}>
                  {INVESTORS.map((inv, i) => (
                    <div key={inv.id} title={inv.name} style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', border: `2px solid ${C.bg}`, marginLeft: i === 0 ? 0 : -8, boxShadow: C.shadow, background: inv.hue + '22' }}>
                      <img src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${inv.seed}&backgroundColor=transparent`} alt={inv.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                  ))}
                </div>

                <button onClick={startReview} style={{ fontFamily: SERIF, fontSize: 16, letterSpacing: '0.04em', padding: '14px 48px', borderRadius: 12, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(28,58,46,0.25)', transition: 'all 0.2s', position: 'relative' }}>
                  召集评审团 →
                </button>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginTop: 14, letterSpacing: '0.07em' }}>约 2 分钟完成 · 评审报告自动存入知识库</div>
              </div>
            </div>
          )}

          {/* ── REVIEW / SYNTHESIS ── */}
          {(phase === 'review' || phase === 'synthesis') && (
            <div style={{ maxWidth: 700, margin: '0 auto', padding: '44px 48px 80px' }}>
              {/* chapter heading */}
              <div style={{ textAlign: 'center', paddingBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'labFadeUp 0.6s both' }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, letterSpacing: '0.15em', textTransform: 'uppercase' }}>第一幕</div>
                <div style={{ width: 32, height: 1, background: C.ink4 }} />
                <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.accent }}>投资人评审</div>
                <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: C.ink3 }}>{project.brand.name}</div>
              </div>

              {/* evaluation cards */}
              {INVESTORS.map((inv, idx) => {
                const r = results[inv.id]
                if (r.status === 'idle') return null
                const isStreaming = r.status === 'streaming'
                const score = r.score ? parseFloat(r.score) : null
                return (
                  <div key={inv.id} id={`inv-card-${inv.id}`} className="inv-card"
                    style={{ marginBottom: 22, background: '#fff', border: `1px solid ${isStreaming ? inv.hue + '44' : C.border2}`, borderRadius: 16, overflow: 'hidden', boxShadow: isStreaming ? `0 4px 24px ${inv.hue}14,${C.shadow}` : C.shadow, transition: 'all 0.35s ease', animation: `labFadeUp 0.5s ${idx * 0.04}s both` }}>
                    {/* header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 14px', borderBottom: `1px solid ${C.border}` }}>
                      <Avatar seed={inv.seed} hue={inv.hue} size={46} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.ink }}>{inv.name}</span>
                          {r.verdict && <VerdictBadge verdict={r.verdict} />}
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, letterSpacing: '0.03em' }}>{inv.role}</div>
                      </div>
                      {score !== null ? (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: inv.hue, lineHeight: 1, letterSpacing: '-1px' }}>{score.toFixed(1)}</div>
                          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>/ 10</div>
                        </div>
                      ) : isStreaming ? (
                        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                          {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: 2, background: inv.hue, animation: `labPulse 0.9s ${i*0.15}s ease-in-out infinite` }} />)}
                        </div>
                      ) : null}
                    </div>
                    {/* body */}
                    <div style={{ padding: '12px 20px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {isStreaming && !r.interest && !r.concern && (
                        <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: C.ink4, fontStyle: 'italic', padding: '6px 0', animation: 'labPulse 1.5s ease-in-out infinite' }}>正在思考中…</div>
                      )}
                      <FieldRow icon="💡" label="最感兴趣" text={r.interest} />
                      <FieldRow icon="⚠" label="最大顾虑" text={r.concern} />
                      <FieldRow icon="❓" label="想追问" text={r.question} italic />
                      {r.comment && (
                        <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.12em', marginBottom: 6 }}>综合评价</div>
                          <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 300, color: C.ink2, lineHeight: 2, textAlign: 'justify' }}>{r.comment}</div>
                        </div>
                      )}
                      {isStreaming && !r.comment && (r.interest || r.concern) && (
                        <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}`, fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: C.ink4, fontStyle: 'italic', animation: 'labPulse 1.5s ease-in-out infinite' }}>
                          继续分析中<span style={{ animation: 'labBlink 1s step-end infinite', marginLeft: 2 }}>|</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* synthesis overlay — full main-area cover so user always sees it */}
              {phase === 'synthesis' && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(250,249,247,0.82)', backdropFilter: 'blur(6px)', animation: 'labFadeIn 0.4s both', pointerEvents: 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '36px 48px', borderRadius: 24, background: '#fff', border: `1px solid rgba(122,96,32,0.2)`, boxShadow: '0 16px 48px rgba(26,25,22,0.12),0 4px 16px rgba(26,25,22,0.06)', animation: 'labSlideUp 0.4s both' }}>
                    {/* Ming avatar */}
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: C.ming, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: '#fff', boxShadow: `0 4px 16px rgba(91,78,184,0.3)` }}>鸣</div>
                    {/* Spinner dots */}
                    <div style={{ display: 'flex', gap: 7 }}>
                      {[0,1,2,3,4].map(i => (
                        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.gold, animation: `labPulse 1.1s ${i * 0.15}s ease-in-out infinite` }} />
                      ))}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.accent, marginBottom: 6 }}>鸣正在综合分析</div>
                      <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: C.ink3 }}>基于 {INVESTORS.length} 位投资人意见，提炼营销方向…</div>
                    </div>
                    {/* Score preview */}
                    {avgScore && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, padding: '8px 20px', borderRadius: 99, background: C.gl, border: `1px solid rgba(122,96,32,0.15)` }}>
                        <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: C.accent, lineHeight: 1 }}>{avgScore}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: C.gold }}>/ 10 综合评分</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DIRECTION ── */}
          {phase === 'direction' && synthesis && (
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '44px 48px 80px', animation: 'labFadeUp 0.6s both' }}>
              {/* chapter heading */}
              <div style={{ textAlign: 'center', marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, letterSpacing: '0.15em', textTransform: 'uppercase' }}>第三幕</div>
                <div style={{ width: 32, height: 1, background: C.ink4 }} />
                <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.accent }}>选择方向</div>
              </div>

              {/* score summary row — unchanged */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                {INVESTORS.map(inv => {
                  const r = results[inv.id]; const vcfg = r.verdict ? VERDICT_CFG[r.verdict] : null
                  return (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px 5px 7px', borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg2 }}>
                      <Avatar seed={inv.seed} hue={inv.hue} size={18} />
                      <span style={{ fontFamily: SANS, fontSize: 11, color: C.ink2 }}>{inv.nameShort}</span>
                      {vcfg && <span style={{ fontFamily: MONO, fontSize: 9, color: vcfg.fg }}>{r.verdict}</span>}
                      {r.score && <span style={{ fontFamily: MONO, fontSize: 10, color: inv.hue, fontWeight: 700 }}>{r.score}</span>}
                    </div>
                  )
                })}
              </div>

              {/* Ming diagnosis card — full width */}
              <div style={{ background: C.gl, border: `1px solid rgba(122,96,32,0.22)`, borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: `0 2px 12px rgba(122,96,32,0.08)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: C.ming, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: '#fff', flexShrink: 0 }}>鸣</div>
                  <div>
                    <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.accent }}>综合诊断</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: C.gold }}>基于 {INVESTORS.length} 位投资人意见</div>
                  </div>
                  {avgScore && (
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: C.accent, lineHeight: 1, letterSpacing: '-0.5px' }}>{avgScore}</div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: C.gold }}>综合评分</div>
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 300, color: C.ink2, lineHeight: 2 }}>{synthesis.diagnosis}</div>
                {synthesis.insights && synthesis.insights.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid rgba(122,96,32,0.15)`, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {synthesis.insights.map((ins, i) => (
                      <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', flex: '1 1 200px' }}>
                        <span style={{ color: C.accent, fontFamily: MONO, fontSize: 11, lineHeight: '18px', flexShrink: 0 }}>·</span>
                        <span style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 300, color: C.ink2, lineHeight: 1.75 }}>{ins}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, opacity: 0.5 }}>
                <div style={{ flex: 1, height: 1, background: C.border2 }} />
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.12em' }}>选择一个营销方向</span>
                <div style={{ flex: 1, height: 1, background: C.border2 }} />
              </div>

              {/* Horizontal card row — selected card expands */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'stretch' }}>
                {synthesis.directions.map((dir, i) => {
                  const sel = selected === i
                  return (
                    <div key={i} onClick={() => { setSelected(i); setCustomOpen(false) }}
                      style={{
                        flex: sel ? '2.2 0 0' : '1 0 0',
                        background: sel ? C.accent : '#fff',
                        border: `1.5px solid ${sel ? C.accent : C.border2}`,
                        borderRadius: 14,
                        padding: sel ? '18px 20px' : '16px 14px',
                        cursor: 'pointer',
                        boxShadow: sel ? '0 4px 20px rgba(28,58,46,0.22)' : C.shadow,
                        transition: 'flex 0.35s ease, background 0.2s, border-color 0.2s, padding 0.2s, box-shadow 0.2s',
                        display: 'flex', flexDirection: 'column', gap: sel ? 10 : 8,
                        overflow: 'hidden', minWidth: 0,
                      }}>
                      {/* Number circle */}
                      <div style={{ width: 22, height: 22, borderRadius: 11, border: `1.5px solid ${sel ? 'rgba(255,255,255,0.35)' : C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sel
                          ? <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                          : <span style={{ fontFamily: MONO, fontSize: 8, color: C.ink4 }}>{i + 1}</span>}
                      </div>
                      {/* Title — always visible */}
                      <div style={{ fontFamily: SERIF, fontSize: sel ? 16 : 13, fontWeight: 600, color: sel ? '#fff' : C.ink, lineHeight: 1.35, letterSpacing: '0.01em', transition: 'font-size 0.2s' }}>{dir.title}</div>
                      {/* Logic + step — only expanded when selected */}
                      {sel && (
                        <>
                          <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.85 }}>{dir.logic}</div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', marginTop: 'auto' }}>
                            <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', flexShrink: 0, paddingTop: 2 }}>STEP 1</span>
                            <span style={{ fontFamily: SANS, fontSize: 12, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>{dir.firstStep}</span>
                          </div>
                          {dir.source && (
                            <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>{dir.source}</div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}

                {/* Custom direction card */}
                <div onClick={() => { setCustomOpen(true); setSelected(-1) }}
                  style={{
                    flex: selected === -1 ? '2.2 0 0' : '1 0 0',
                    background: selected === -1 ? C.bg2 : 'transparent',
                    border: `1.5px dashed ${selected === -1 ? C.accent : C.border2}`,
                    borderRadius: 14,
                    padding: selected === -1 ? '18px 20px' : '16px 14px',
                    cursor: 'pointer',
                    transition: 'flex 0.35s ease, background 0.2s, border-color 0.2s, padding 0.2s',
                    display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden', minWidth: 0,
                  }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, border: `1.5px solid ${selected === -1 ? C.accent : C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: selected === -1 ? C.accent : C.ink4 }}>✏</span>
                  </div>
                  <div style={{ fontFamily: SERIF, fontSize: selected === -1 ? 15 : 13, fontWeight: 600, color: selected === -1 ? C.accent : C.ink3, lineHeight: 1.35 }}>自定义方向</div>
                  {selected === -1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <div>
                        <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, letterSpacing: '0.08em', marginBottom: 4 }}>方向名称</div>
                        <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="例：深耕中产女性社群" maxLength={20}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${C.border2}`, fontFamily: SERIF, fontSize: 13, color: C.ink, background: C.bg, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, letterSpacing: '0.08em', marginBottom: 4 }}>第一步行动</div>
                        <input value={customStep} onChange={e => setCustomStep(e.target.value)} placeholder="例：本周在小红书发布第一篇种草内容" maxLength={40}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: `1px solid ${C.border2}`, fontFamily: SERIF, fontSize: 12, color: C.ink, background: C.bg, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* confirm */}
              <button onClick={confirmDirection} disabled={!canConfirm || saving}
                style={{ width: '100%', padding: '16px', borderRadius: 13, border: 'none', cursor: canConfirm ? 'pointer' : 'not-allowed', background: canConfirm ? C.accent : C.bg3, color: canConfirm ? '#fff' : C.ink4, fontFamily: SERIF, fontSize: 16, letterSpacing: '0.04em', boxShadow: canConfirm ? '0 4px 16px rgba(28,58,46,0.2)' : 'none', transition: 'all 0.2s ease' }}>
                {saving ? '保存中…' : canConfirm
                  ? isCustomMode
                    ? `确认「${customTitle || '自定义方向'}」，进入营销 Agent →`
                    : `确认「${synthesis.directions[selected as number].title}」，进入营销 Agent →`
                  : '请先选择一个方向'}
              </button>
              <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, textAlign: 'center', marginTop: 10, letterSpacing: '0.06em' }}>评审报告将自动存入知识库 · Ming Agent 将基于此方向展开工作</div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
