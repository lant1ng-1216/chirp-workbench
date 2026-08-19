'use client'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
import { MindsLogo } from './BrandIcons'
import { S, iconGhost, wellStyle } from './surface'
import { ImeTextarea } from './ImeFields'
import { AgentLoading, ApprovalCard, AgentReply, ThinkingBlock, UserBubble } from './ai-ui'
import { extractPlanSteps } from '@/lib/workbench/planFormat'
import {
  classifyAgentIntent,
  followUpsForKind,
  intentLabel,
  type AgentReplyKind,
  type AgentTurnResult,
} from '@/lib/workbench/agentIntent'
import type { MarketingAngle } from '@/lib/workbench/marketing'

type Msg = {
  role: 'user' | 'assistant'
  text: string
  offerApply?: boolean
  lastAppliedIds?: string[]
  stream?: boolean
  kind?: AgentReplyKind
  clarifyQuestions?: string[]
  clarifyNote?: string
  angles?: MarketingAngle[]
  tools?: AgentTurnResult['tools']
  pipelineTasks?: AgentTurnResult['pipelineTasks']
  thinkingDone?: boolean
}

type ApplyPlanResult =
  | { kind: 'applied'; text: string; nodeIds?: string[] }
  | { kind: 'clarify'; text: string }
  | { kind: 'error'; text: string }

type SkillItem = {
  skillId: string
  name: string
  description: string
  equippedCount: number
  accent: string
  equipped: boolean
}

const WIDTH_KEY = 'chirp.agentSidebarWidth'
const DEFAULT_WIDTH = 380
const MIN_WIDTH = 320
const MAX_WIDTH_CAP = 560

function clampSidebarWidth(w: number) {
  if (typeof window === 'undefined') {
    return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH_CAP, Math.round(w)))
  }
  const max = Math.min(MAX_WIDTH_CAP, Math.floor(window.innerWidth * 0.55))
  return Math.max(MIN_WIDTH, Math.min(max, Math.round(w)))
}

function readStoredWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_WIDTH
  try {
    const raw = localStorage.getItem(WIDTH_KEY)
    const n = raw != null ? Number(raw) : DEFAULT_WIDTH
    return Number.isFinite(n) ? clampSidebarWidth(n) : DEFAULT_WIDTH
  } catch {
    return DEFAULT_WIDTH
  }
}

export default function AgentSidebar({
  zh,
  open,
  onClose,
  busy,
  canvasHint,
  pipelineLive,
  onAgentTurn,
  onPinKnowledge,
  onApplyPlan,
  onRunPipeline,
}: {
  zh: boolean
  open: boolean
  onClose: () => void
  busy: boolean
  canvasHint?: {
    nodeCount: number
    selectedLabel?: string
    knowledgeCount: number
    boardTaskCount: number
  }
  pipelineLive?: AgentTurnResult['pipelineTasks']
  onAgentTurn: (message: string) => Promise<AgentTurnResult>
  onPinKnowledge: (text: string) => void
  onApplyPlan: (conversation: string) => Promise<ApplyPlanResult>
  onRunPipeline: (ids?: string[]) => void
}) {
  const [agentOpen, setAgentOpen] = useState(false)
  const [skillsOpen, setSkillsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [log, setLog] = useState<Msg[]>([])
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [skillsOffset, setSkillsOffset] = useState(0)
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [equippingId, setEquippingId] = useState<string | null>(null)
  const [skillNote, setSkillNote] = useState<string | null>(null)
  const [applyBusy, setApplyBusy] = useState(false)
  const [lastAppliedIds, setLastAppliedIds] = useState<string[] | undefined>()
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [resizing, setResizing] = useState(false)
  const [routeHint, setRouteHint] = useState<string | null>(null)
  const [ctxCanvas, setCtxCanvas] = useState(true)
  const [ctxSelected, setCtxSelected] = useState(true)
  const [ctxKnowledge, setCtxKnowledge] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startW: number } | null>(null)

  useEffect(() => {
    setWidth(readStoredWidth())
  }, [])

  useEffect(() => {
    if (!resizing) return
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      setWidth(clampSidebarWidth(d.startW + (d.startX - e.clientX)))
    }
    const onUp = () => {
      setResizing(false)
      dragRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setWidth(w => {
        const clamped = clampSidebarWidth(w)
        try { localStorage.setItem(WIDTH_KEY, String(clamped)) } catch { /* ignore */ }
        return clamped
      })
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [resizing])

  useEffect(() => {
    const onWinResize = () => setWidth(w => clampSidebarWidth(w))
    window.addEventListener('resize', onWinResize)
    return () => window.removeEventListener('resize', onWinResize)
  }, [])

  const loadSkills = useCallback(async (offset = 0) => {
    setSkillsLoading(true)
    setSkillNote(zh ? '正在换一批 Skill…' : 'Refreshing skills…')
    try {
      const res = await fetch(`/api/minds/bazaar/skills?offset=${offset}&limit=4`)
      const data = await res.json() as {
        items?: SkillItem[]
        nextOffset?: number
        error?: string
      }
      if (!res.ok) throw new Error(data.error || 'failed')
      setSkills(data.items ?? [])
      setSkillsOffset(data.nextOffset ?? 0)
      setSkillNote(zh ? '已换一批' : 'Refreshed')
      window.setTimeout(() => setSkillNote(null), 1600)
    } catch (e) {
      setSkills([])
      setSkillNote(zh ? `Skill 加载失败：${e instanceof Error ? e.message : String(e)}` : `Skills failed: ${String(e)}`)
    } finally {
      setSkillsLoading(false)
    }
  }, [zh])

  useEffect(() => {
    if (!open || !skillsOpen) return
    void loadSkills(0)
  }, [open, skillsOpen, loadSkills])

  useEffect(() => {
    if (!open) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log, open, busy, pipelineLive])

  useEffect(() => {
    if (!agentOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setAgentOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [agentOpen])

  useEffect(() => {
    const intent = classifyAgentIntent(input || ' ')
    if (!input.trim()) {
      setRouteHint(null)
      return
    }
    setRouteHint(intentLabel(intent, zh))
  }, [input, zh])

  if (!open) return null

  const equip = async (skill: SkillItem) => {
    if (equippingId) return
    setEquippingId(skill.skillId)
    setSkillNote(null)
    const action = skill.equipped ? 'unequip' : 'equip'
    try {
      const res = await fetch('/api/minds/skills/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: skill.skillId, action }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error || 'equip failed')
      setSkills(list => list.map(s =>
        s.skillId === skill.skillId ? { ...s, equipped: action === 'equip' } : s
      ))
      setSkillNote(
        action === 'equip'
          ? (zh ? `已装配「${skill.name}」到工作区 Agent` : `Equipped “${skill.name}” on workspace Agent`)
          : (zh ? `已卸下「${skill.name}」` : `Unequipped “${skill.name}”`),
      )
      if (action === 'equip') {
        setInput(zh
          ? `我想使用已装配的 Skill「${skill.name}」：${skill.description.slice(0, 120)}`
          : `I want to use equipped skill “${skill.name}”: ${skill.description.slice(0, 120)}`)
      }
    } catch (e) {
      setSkillNote(zh
        ? `装配失败：${e instanceof Error ? e.message : String(e)}`
        : `Equip failed: ${String(e)}`)
    } finally {
      setEquippingId(null)
    }
  }

  const conversationText = () =>
    log.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n\n')

  const parseClarifyQuestions = (text: string) =>
    text
      .split('\n')
      .map(l => l.trim())
      .filter(l => /^\d+[\.)、]\s*/.test(l))
      .map(l => l.replace(/^\d+[\.)、]\s*/, ''))

  const applyFromChat = async () => {
    if (applyBusy || busy) return
    setApplyBusy(true)
    try {
      const r = await onApplyPlan(conversationText() || input)
      if (r.kind === 'clarify') {
        const qs = parseClarifyQuestions(r.text)
        setLog(l => [...l, {
          role: 'assistant',
          text: r.text,
          kind: 'clarify',
          stream: true,
          offerApply: true,
          clarifyQuestions: qs.length ? qs : [zh ? '请再具体一点你的目标与平台' : 'Please clarify goals and platforms'],
          clarifyNote: zh ? 'Apply 前需要补充信息' : 'More detail needed before Apply',
        }])
        return
      }
      setLog(l => [...l, {
        role: 'assistant',
        text: r.text,
        stream: true,
        kind: r.kind === 'applied' ? 'canvas' : 'error',
        offerApply: r.kind !== 'applied',
        lastAppliedIds: r.kind === 'applied' ? r.nodeIds : undefined,
        tools: r.kind === 'applied'
          ? [{ id: 'apply', label: zh ? '应用到画布' : 'Apply to canvas', status: 'done' as const }]
          : undefined,
      }])
      if (r.kind === 'applied') setLastAppliedIds(r.nodeIds)
    } finally {
      setApplyBusy(false)
    }
  }

  const send = async (override?: string) => {
    const msg = (override ?? input).trim()
    if (!msg || busy) return
    setInput('')
    setSkillNote(null)
    setLog(l => [...l, { role: 'user', text: msg }])

    try {
      const reply = await onAgentTurn(msg)
      setLog(l => [...l, {
        role: 'assistant',
        text: reply.text,
        offerApply: reply.offerApply,
        stream: true,
        kind: reply.kind,
        angles: reply.angles,
        tools: reply.tools,
        pipelineTasks: reply.pipelineTasks,
        lastAppliedIds: reply.lastAppliedIds,
        clarifyQuestions: reply.clarifyQuestions,
        clarifyNote: reply.clarifyNote,
        thinkingDone: true,
      }])
      if (reply.lastAppliedIds) setLastAppliedIds(reply.lastAppliedIds)
    } finally {
      /* busy cleared by parent */
    }
  }

  const startResize = (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { startX: e.clientX, startW: width }
    setResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const insertCtx = (kind: 'canvas' | 'selected' | 'knowledge') => {
    const chip =
      kind === 'canvas' ? '@画布 '
        : kind === 'selected' ? '@选中 '
          : '@知识库 '
    setInput(prev => (prev.includes(chip.trim()) ? prev : chip + prev))
  }

  return (
    <aside
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width,
        maxWidth: '100%',
        minWidth: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(14,14,14,0.97)',
        borderLeft: `1px solid ${S.shellBorder}`,
        boxShadow: '-16px 0 40px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        fontFamily: S.font,
        color: S.ink,
        overflowX: 'visible',
        overflowY: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={zh ? '拖动调整 Agent 栏宽度' : 'Drag to resize Agent panel'}
        onMouseDown={startResize}
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
          cursor: 'col-resize', zIndex: 50,
          background: resizing ? 'rgba(147,197,253,0.35)' : 'transparent',
        }}
      />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '14px 14px 10px', minWidth: 0,
      }}>
        <strong style={{ fontSize: 15, fontWeight: 700, flex: 1, letterSpacing: '-0.2px' }}>
          {zh ? 'Agent' : 'Agent'}
        </strong>
        <button type="button" onClick={() => setLog([])} style={iconGhost} title={zh ? '新对话' : 'New'}>
          <IconPlus />
        </button>
        <button type="button" onClick={onClose} style={iconGhost} title={zh ? '关闭' : 'Close'}>
          <IconSidebarClose />
        </button>
      </div>

      <p style={{ margin: '0 14px 8px', fontSize: 11, lineHeight: 1.5, color: S.muted }}>
        {zh
          ? '聊天 · Plan · 写文案 · 驱动画布。可用 /plan /angles /apply /run /schedule'
          : 'Chat · Plan · write · drive canvas. Try /plan /angles /apply /run /schedule'}
      </p>

      <div style={{
        flex: 1, minHeight: 0, minWidth: 0, overflowX: 'hidden', overflowY: 'auto',
        padding: '8px 14px 8px',
        display: 'flex', flexDirection: 'column', gap: 12,
        width: '100%', boxSizing: 'border-box',
      }}>
        {/* Skills — collapsed by default (P1) */}
        <section style={{ minWidth: 0, width: '100%' }}>
          <button
            type="button"
            onClick={() => setSkillsOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '6px 2px', border: 'none', background: 'transparent',
              color: S.muted, cursor: 'pointer', fontSize: 11, fontWeight: 650,
            }}
          >
            <span style={{ flex: 1, textAlign: 'left' }}>
              {zh ? 'Skills（可选）' : 'Skills (optional)'}
            </span>
            <span style={{ opacity: 0.45 }}>{skillsOpen ? '▴' : '▾'}</span>
          </button>
          {skillsOpen && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => void loadSkills(skillsOffset)}
                  disabled={skillsLoading}
                  style={{
                    marginLeft: 'auto', ...iconGhost, width: 'auto', height: 'auto',
                    gap: 4, fontSize: 11, color: S.muted, padding: '2px 4px',
                  }}
                >
                  <IconRefresh />
                  {skillsLoading ? (zh ? '加载中…' : 'Loading…') : (zh ? '换一批' : 'Refresh')}
                </button>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: 8,
              }}>
                {skillsLoading && skills.length === 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <AgentLoading label={zh ? '拉取 Skill' : 'Loading skills'} variant="Dots" compact />
                  </div>
                )}
                {skills.map(sk => (
                  <button
                    key={sk.skillId}
                    type="button"
                    disabled={equippingId === sk.skillId}
                    onClick={() => void equip(sk)}
                    style={{
                      display: 'flex', gap: 8, alignItems: 'flex-start',
                      textAlign: 'left', padding: 8, borderRadius: 12, cursor: 'pointer',
                      border: sk.equipped
                        ? '1px solid rgba(59,130,246,0.4)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: sk.equipped ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.025)',
                      color: S.ink, minWidth: 0, overflow: 'hidden', boxSizing: 'border-box',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: `linear-gradient(145deg, ${sk.accent}55, rgba(255,255,255,0.06))`,
                    }} />
                    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: 11, fontWeight: 700,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {prettyName(sk.name)}
                      </div>
                      <div style={{
                        fontSize: 10, color: S.muted, marginTop: 2, lineHeight: 1.35,
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {sk.description.slice(0, 48)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {skillNote && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(147,197,253,0.9)' }}>{skillNote}</div>
              )}
            </div>
          )}
        </section>

        {log.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: S.faint }}>{zh ? '试试' : 'Try'}</span>
            {(zh
              ? ['规划知识→营销→复用→排期', '/angles 写 3 个营销角度', '/apply 应用到画布']
              : ['Plan knowledge→marketing→reuse', '/angles draft 3 angles', '/apply to canvas']
            ).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s.startsWith('/') ? s : s)}
                style={{
                  textAlign: 'left', padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.78)', fontSize: 12,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {log.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '92%',
            minWidth: 0,
            width: m.role === 'assistant' ? '100%' : 'fit-content',
            boxSizing: 'border-box',
          }}>
            {m.role === 'user' ? (
              <UserBubble text={m.text} />
            ) : m.kind === 'clarify' && m.clarifyQuestions?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AgentReply text={m.text} streaming={!!m.stream} kind="clarify" zh={zh} tools={m.tools} />
                <ApprovalCard
                  zh={zh}
                  questions={m.clarifyQuestions}
                  note={m.clarifyNote}
                  onReply={(prefix) => setInput(prev => (prev ? `${prev}\n${prefix}` : prefix))}
                />
              </div>
            ) : (
              <AgentReply
                text={m.text}
                streaming={!!m.stream}
                zh={zh}
                kind={m.kind || 'chat'}
                angles={m.angles}
                tools={m.tools}
                planSteps={m.kind === 'plan' ? extractPlanSteps(m.text) : undefined}
                planTaskStatus={
                  i === log.length - 1 && pipelineLive?.length
                    ? pipelineLive
                    : m.pipelineTasks
                }
                followUps={followUpsForKind(m.kind || 'chat', zh)}
                onFollowUp={(q) => {
                  if (/应用到画布|Apply to canvas/i.test(q)) void applyFromChat()
                  else if (/一键|Run pipeline|运行营销|运行/i.test(q)) {
                    onRunPipeline(m.lastAppliedIds || lastAppliedIds)
                    void send('/run')
                  }
                  else if (/排期|schedule/i.test(q)) void send('/schedule')
                  else if (/角度|angles/i.test(q)) void send(zh ? '/angles 写 3 个营销角度' : '/angles draft 3 angles')
                  else setInput(q)
                }}
                actions={(
                  <>
                    <button type="button" onClick={() => onPinKnowledge(m.text)} style={miniAction}>
                      {zh ? '钉成知识卡' : 'Pin knowledge'}
                    </button>
                    {(m.offerApply || m.kind === 'plan') && (
                      <button
                        type="button"
                        disabled={busy || applyBusy}
                        onClick={() => void applyFromChat()}
                        style={{ ...miniAction, color: '#93c5fd' }}
                      >
                        {applyBusy ? (zh ? '生成工作流…' : 'Building…') : (zh ? '应用到画布' : 'Apply to canvas')}
                      </button>
                    )}
                    {(m.lastAppliedIds?.length || lastAppliedIds?.length) ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          onRunPipeline(m.lastAppliedIds || lastAppliedIds)
                          void send('/run')
                        }}
                        style={{ ...miniAction, color: '#86efac' }}
                      >
                        {zh ? '一键运行' : 'Run pipeline'}
                      </button>
                    ) : null}
                  </>
                )}
              />
            )}
          </div>
        ))}

        {(busy || applyBusy) && (
          <div style={{ alignSelf: 'flex-start', width: '100%', maxWidth: '92%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AgentLoading
              label={applyBusy
                ? (zh ? '生成工作流' : 'Building workflow')
                : (zh ? '思考中' : 'Thinking')}
              variant={applyBusy ? 'Orbit' : 'Drive'}
            />
            <ThinkingBlock
              label={applyBusy
                ? (zh ? '正在按意图搭建画布' : 'Materializing canvas')
                : (zh ? '思考中' : 'Thinking')}
              defaultOpen
              live
              collapseWhenDone
              hint={zh ? 'Minds 正在处理…' : 'Minds is working…'}
              steps={applyBusy
                ? [
                    { id: '1', label: zh ? '解析意图' : 'Parse intent', status: 'done' },
                    { id: '2', label: zh ? '生成节点与连线' : 'Build nodes & edges', status: 'active' },
                  ]
                : [
                    { id: '1', label: zh ? '理解目标' : 'Understand', status: 'active' },
                    { id: '2', label: zh ? '选择动作' : 'Pick action', status: 'pending' },
                  ]}
            />
            {pipelineLive && pipelineLive.length > 0 && (
              <AgentReply
                text={zh ? '管线执行中' : 'Pipeline running'}
                streaming={false}
                kind="canvas"
                planTaskStatus={pipelineLive}
                zh={zh}
              />
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Prompt bar */}
      <div style={{ padding: '8px 12px 14px', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        <div style={{
          ...wellStyle,
          padding: '8px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 0,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }} ref={pickerRef}>
              <button
                type="button"
                onClick={() => setAgentOpen(v => !v)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 8px', borderRadius: 999, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: agentOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  color: '#fff', fontSize: 11, fontWeight: 600,
                }}
              >
                <MindsLogo size={16} />
                Minds
                <span style={{ opacity: 0.35, fontSize: 9 }}>{agentOpen ? '▴' : '▾'}</span>
              </button>
              {agentOpen && (
                <div style={{
                  position: 'absolute', left: 0, bottom: 'calc(100% + 8px)',
                  width: 280, borderRadius: 14,
                  border: `1px solid ${S.shellBorder}`,
                  background: 'rgba(22,22,22,0.98)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
                  padding: 6, zIndex: 60,
                }}>
                  <button
                    type="button"
                    onClick={() => setAgentOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 12px', borderRadius: 12, border: 'none',
                      background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <MindsLogo size={26} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Minds</div>
                      <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>
                        {zh ? '工作区 Agent' : 'Workspace Agent'}
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* @ context chips */}
            <CtxChip
              active={ctxCanvas}
              label={zh ? `@画布 ${canvasHint?.nodeCount ?? 0}` : `@canvas ${canvasHint?.nodeCount ?? 0}`}
              onClick={() => { setCtxCanvas(v => !v); insertCtx('canvas') }}
            />
            <CtxChip
              active={ctxSelected && !!canvasHint?.selectedLabel}
              label={zh ? '@选中' : '@sel'}
              title={canvasHint?.selectedLabel}
              onClick={() => { setCtxSelected(v => !v); insertCtx('selected') }}
            />
            <CtxChip
              active={ctxKnowledge}
              label={zh ? `@知识 ${canvasHint?.knowledgeCount ?? 0}` : `@know ${canvasHint?.knowledgeCount ?? 0}`}
              onClick={() => { setCtxKnowledge(v => !v); insertCtx('knowledge') }}
            />

            {routeHint && (
              <span style={{
                fontSize: 10, color: S.faint, padding: '3px 8px', borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
              }}>
                {routeHint}
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 10, color: S.faint }}>
              ⏎ {zh ? '发送' : 'send'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <ImeTextarea
              value={input}
              onValueChange={setInput}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  void send()
                }
              }}
              rows={2}
              placeholder={zh
                ? '聊天、/plan、/angles、/apply、/run…'
                : 'Chat, /plan, /angles, /apply, /run…'}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none',
                background: 'transparent', color: '#fff', fontSize: 13, lineHeight: 1.45,
                fontFamily: 'inherit', minHeight: 44,
              }}
            />
            <button
              type="button"
              disabled={busy || !input.trim()}
              onClick={() => void send()}
              style={{
                width: 38, height: 38, borderRadius: 999, border: 'none', flexShrink: 0,
                background: busy || !input.trim() ? 'rgba(255,255,255,0.08)' : S.sendBg,
                color: busy || !input.trim() ? S.faint : S.sendFg,
                cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

function CtxChip({
  active, label, title, onClick,
}: {
  active?: boolean
  label: string
  title?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      style={{
        padding: '3px 8px', borderRadius: 999, cursor: 'pointer', fontSize: 10, fontWeight: 600,
        border: `1px solid ${active ? 'rgba(147,197,253,0.35)' : 'rgba(255,255,255,0.08)'}`,
        background: active ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
        color: active ? '#bfdbfe' : S.faint,
        maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function prettyName(name: string) {
  return name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

const miniAction: CSSProperties = {
  padding: '3px 2px', borderRadius: 0, fontSize: 10, cursor: 'pointer',
  border: 'none', background: 'transparent',
  color: S.muted, textDecoration: 'underline', textUnderlineOffset: 2,
}

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconSidebarClose() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconRefresh() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.6-6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
