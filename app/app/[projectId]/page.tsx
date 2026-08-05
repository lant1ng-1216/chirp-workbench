'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SiYoutube, SiInstagram, SiTiktok, SiX } from 'react-icons/si'
import { useMingStore } from '@/lib/store'
import type { Post } from '@/lib/brand'

/* ── design tokens ── */
const C = {
  bg:     '#f2f3f7',
  bg1:    '#ffffff',
  bg2:    '#f7f8fa',
  bg3:    '#eef0f4',
  ink:    '#0f1117',
  ink2:   '#2d3142',
  ink3:   '#5c6070',
  ink4:   '#9ea3b0',
  accent: '#3b82f6',
  border: 'rgba(15,17,23,0.07)',
  borderS:'rgba(15,17,23,0.12)',
  shadow: '0 1px 2px rgba(15,17,23,0.05),0 4px 16px rgba(15,17,23,0.05)',
  shadowM:'0 2px 8px rgba(15,17,23,0.07),0 8px 28px rgba(15,17,23,0.07)',
  green:  '#10b981',
  orange: '#f59e0b',
  red:    '#ef4444',
  purple: '#8b5cf6',
}
const SANS = "'Inter',-apple-system,sans-serif"
const MONO = "'Space Mono',monospace"

/* ── platform map ── */
const PLATS = [
  { id: 'youtube',   label: 'YouTube',   color: '#ff0000', bg: 'rgba(255,0,0,0.08)',     Icon: SiYoutube   },
  { id: 'instagram', label: 'Instagram', color: '#e1306c', bg: 'rgba(225,48,108,0.08)',  Icon: SiInstagram },
  { id: 'tiktok',    label: 'TikTok',    color: '#111827', bg: 'rgba(0,0,0,0.07)',        Icon: SiTiktok    },
  { id: 'twitter',   label: 'X',         color: '#000000', bg: 'rgba(0,0,0,0.07)',        Icon: SiX         },
]

/* ── activity log derived from real store data ── */
interface ActEntry { time: string; type: 'gen' | 'sched' | 'publish'; zh: string; en: string; ts: number }
const LOG_COLORS: Record<string, string> = { gen: C.accent, sched: C.green, publish: C.purple }

function fmtActTime(iso: string, zh: boolean): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return zh ? '昨天' : 'Yest.'
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

/** Next best local slot: tomorrow 09:00 (or sequential days for batch scheduling) */
function nextSlotISO(daysAhead = 1): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T09:00:00`
}

/* ── Content Drawer ── */
function ContentDrawer({
  post, plat, zh, projectId, onClose, onApprove,
}: {
  post: Post
  plat: typeof PLATS[0]
  zh: boolean
  projectId: string
  onClose: () => void
  onApprove: () => void
}) {
  const PlatIcon = plat.Icon
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(post.content)

  const saveEdit = () => {
    useMingStore.getState().updatePost(projectId, post.id, { content: text, title: text.slice(0, 60) })
    setEditing(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.15)' }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 288, bottom: 0, zIndex: 50,
        width: 420, background: C.bg1,
        borderLeft: `1px solid ${C.borderS}`,
        boxShadow: '-4px 0 32px rgba(15,17,23,0.12)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.bg1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: plat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlatIcon size={16} color={plat.color} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{plat.label} {zh ? '内容' : 'Content'}</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{zh ? 'Pip 起草' : 'drafted by Pip'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px', borderRadius: 7, border: `1px solid ${C.borderS}`,
                background: 'transparent', color: C.ink3, fontSize: 12, cursor: 'pointer',
              }}
            >
              {zh ? '跳过' : 'Skip'}
            </button>
            <button
              onClick={onApprove}
              style={{
                padding: '6px 14px', borderRadius: 7, border: 'none',
                background: C.green, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ✓ {zh ? '批准排期' : 'Approve'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.ink4 }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Content body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>
          {/* Content preview / edit */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.06em' }}>
                {zh ? '草稿内容' : 'DRAFT CONTENT'}
              </span>
              <button
                onClick={() => (editing ? saveEdit() : setEditing(true))}
                style={{
                  fontFamily: MONO, fontSize: 9, padding: '3px 9px', borderRadius: 5,
                  border: `1px solid ${C.borderS}`, background: editing ? C.accent : 'transparent',
                  color: editing ? '#fff' : C.ink4, cursor: 'pointer',
                }}
              >
                {editing ? (zh ? '保存' : 'Save') : (zh ? '编辑' : 'Edit')}
              </button>
            </div>
            {editing ? (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                style={{
                  width: '100%', minHeight: 200, border: `1px solid rgba(59,130,246,0.3)`, borderRadius: 10,
                  padding: '14px 16px', fontFamily: SANS, fontSize: 13, color: C.ink2,
                  lineHeight: 1.75, resize: 'vertical', outline: 'none', background: C.bg2,
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <div style={{
                background: C.bg2, borderRadius: 10, padding: '14px 16px',
                border: `1px solid ${C.border}`,
              }}>
                <p style={{ fontFamily: SANS, fontSize: 13, color: C.ink2, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {text}
                </p>
              </div>
            )}
            <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginTop: 8 }}>
              {text.length} {zh ? '字符' : 'chars'}
            </div>
          </div>

          {/* "为何这样写" */}
          <div style={{
            borderRadius: 10, background: 'rgba(59,130,246,0.04)',
            border: `1px solid rgba(59,130,246,0.12)`, padding: '14px 16px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <svg width="12" height="12" fill="none" stroke={C.accent} strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.accent, letterSpacing: '0.05em' }}>
                {zh ? '为何这样写' : 'WHY THIS WORKS'}
              </span>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 12, color: C.ink3, lineHeight: 1.75, margin: 0 }}>
              {zh
                ? `此内容针对 ${plat.label} 平台受众进行了优化，格式符合平台规范，用词贴合你的品牌声音，有助于提升互动率。`
                : `This content is optimized for ${plat.label}'s audience format and your brand voice, designed to drive engagement based on your content pillars.`
              }
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: zh ? '改写' : 'Rewrite', icon: 'M1 4v6h6M23 20v-6h-6', desc: zh ? '去工坊让 Pip 重写' : 'Rework in Workshop' },
              { label: zh ? '复制' : 'Copy', icon: 'M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2M16 4h2a2 2 0 0 0 2 2v4', desc: zh ? '复制到剪贴板' : 'Copy to clipboard' },
            ].map(btn => (
              <button key={btn.label} style={{
                padding: '10px 14px', borderRadius: 9, border: `1px solid ${C.borderS}`,
                background: C.bg2, cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = C.bg3)}
                onMouseLeave={e => (e.currentTarget.style.background = C.bg2)}
                onClick={
                  btn.label === (zh ? '复制' : 'Copy')
                    ? () => navigator.clipboard?.writeText(text)
                    : () => router.push(`/app/${projectId}/workshop?prefill=${encodeURIComponent(text)}&platform=${plat.id}`)
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <svg width="11" height="11" fill="none" stroke={C.ink3} strokeWidth="1.8" viewBox="0 0 24 24"><path d={btn.icon}/></svg>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.ink2 }}>{btn.label}</span>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{btn.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
    </>
  )
}

/* ── Platform Agent Card ── */
function AgentCard({
  plat, drafts, zh, projectId, auto, onToggleAuto, onSelect,
}: {
  plat: typeof PLATS[0]
  drafts: Post[]
  zh: boolean
  projectId: string
  auto: boolean
  onToggleAuto: () => void
  onSelect: (post: Post) => void
}) {
  const PlatIcon = plat.Icon
  const router = useRouter()

  return (
    <div style={{
      background: C.bg1, borderRadius: 14, border: `1px solid ${C.border}`,
      boxShadow: C.shadow, overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        padding: '12px 14px 10px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 9,
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: plat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <PlatIcon size={14} color={plat.color} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, color: C.ink, flex: 1 }}>{plat.label}</span>

        {/* Auto toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          title={zh ? '开启后 Pip 自动把该平台草稿排入日历' : 'Pip auto-schedules drafts for this platform'}>
          <span style={{ fontFamily: MONO, fontSize: 8, color: auto ? C.green : C.ink4 }}>{zh ? '自动' : 'Auto'}</span>
          <button
            onClick={onToggleAuto}
            style={{
              width: 32, height: 18, borderRadius: 99, border: 'none', cursor: 'pointer',
              background: auto ? C.green : C.bg3,
              transition: 'background 0.2s', position: 'relative', padding: 0,
            }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: 99, background: '#fff',
              position: 'absolute', top: 2, left: auto ? 16 : 2,
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>

        {/* Count badge */}
        {drafts.length > 0 && (
          <div style={{
            minWidth: 20, height: 20, borderRadius: 99, background: C.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: MONO, fontSize: 10, fontWeight: 700, color: '#fff', padding: '0 6px',
          }}>
            {drafts.length}
          </div>
        )}
      </div>

      {/* Draft rows */}
      <div style={{ padding: '4px 0' }}>
        {drafts.length === 0 ? (
          <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(16,185,129,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" fill="none" stroke={C.green} strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ink3 }}>{zh ? '暂无草稿' : 'All clear'}</div>
              <button
                onClick={() => router.push(`/app/${projectId}/workshop`)}
                style={{ fontFamily: MONO, fontSize: 9, color: C.accent, background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 2 }}
              >
                {zh ? '手动创建 →' : 'Create manually →'}
              </button>
            </div>
          </div>
        ) : (
          drafts.slice(0, 3).map((post, i) => (
            <div key={post.id} style={{
              padding: '9px 14px',
              borderBottom: i < Math.min(drafts.length, 3) - 1 ? `1px solid ${C.border}` : 'none',
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer',
              transition: 'background 0.12s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bg2)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => onSelect(post)}
            >
              {/* Text preview */}
              <span style={{
                flex: 1, fontSize: 12, color: C.ink2, lineHeight: 1.4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {post.content}
              </span>
              {/* Inline action buttons */}
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => useMingStore.getState().updatePost(projectId, post.id, { status: 'published', publishedAt: new Date().toISOString() })}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: plat.bg, color: plat.color,
                    fontSize: 11, fontWeight: 700,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {zh ? '发布' : 'Publish'}
                </button>
                <button
                  onClick={() => useMingStore.getState().updatePost(projectId, post.id, { status: 'scheduled', scheduledAt: nextSlotISO(1) })}
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.borderS}`,
                    cursor: 'pointer', background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="11" height="11" fill="none" stroke={C.ink3} strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            </div>
          ))
        )}
        {auto && drafts.length > 0 && (
          <div style={{ padding: '4px 14px 8px', fontFamily: MONO, fontSize: 8, color: C.green }}>
            {zh ? '● 自动排期已开启 · 草稿将自动进入日历' : '● Auto-scheduling on · drafts go to calendar'}
          </div>
        )}
        {drafts.length > 3 && (
          <div style={{ padding: '6px 14px 10px' }}>
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>
              +{drafts.length - 3} {zh ? '更多…' : 'more…'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main ── */
export default function OverviewPage() {
  const params    = useParams()
  const projectId = params.projectId as string
  const { projects, setActiveProject, lang, activePlatforms, autoPlatforms, toggleAutoPlatform, repurposedContent } = useMingStore()
  const zh = lang === 'zh'

  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [todoOpen, setTodoOpen] = useState(false)
  const todoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projects.find(p => p.id === projectId)) setActiveProject(projectId)
  }, [projectId])

  // Close todo dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (todoRef.current && !todoRef.current.contains(e.target as Node)) setTodoOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const project = projects.find(p => p.id === projectId)
  if (!project) return null

  const posts          = project.posts ?? []
  const draftPosts     = posts.filter(p => p.status === 'draft')
  const scheduledPosts = posts
    .filter(p => p.status === 'scheduled')
    .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
  const publishedPosts = posts.filter(p => p.status === 'published')

  // Only show platforms the creator activated (all four if none chosen yet)
  const activated = activePlatforms[projectId] ?? []
  const visiblePlats = activated.length > 0 ? PLATS.filter(pl => activated.includes(pl.id)) : PLATS

  const getDraftsByPlatform = (platId: string) =>
    draftPosts.filter(p => p.platform === platId)

  // Auto toggle: ON → Pip schedules all current drafts of that platform onto upcoming days
  const handleToggleAuto = (platId: string) => {
    const isOn = (autoPlatforms[projectId] ?? []).includes(platId)
    toggleAutoPlatform(projectId, platId)
    if (!isOn) {
      getDraftsByPlatform(platId).forEach((post, i) => {
        useMingStore.getState().updatePost(projectId, post.id, { status: 'scheduled', scheduledAt: nextSlotISO(i + 1) })
      })
    }
  }

  // Real activity feed derived from store data (newest first, top 6)
  const activity: ActEntry[] = []
  posts.forEach(p => {
    const platName = PLATS.find(pl => pl.id === p.platform)?.label ?? p.platform
    activity.push({
      ts: Date.parse(p.createdAt) || 0, type: 'gen', time: fmtActTime(p.createdAt, zh),
      zh: `为 ${platName} 起草了新内容`, en: `Drafted new ${platName} content`,
    })
    if (p.status === 'scheduled' && p.scheduledAt) {
      activity.push({
        ts: (Date.parse(p.scheduledAt) || 0) - 1, type: 'sched', time: fmtActTime(p.createdAt, zh),
        zh: `${platName} 帖子已排期至 ${p.scheduledAt.slice(0, 10)} ${p.scheduledAt.slice(11, 16)}`,
        en: `${platName} post scheduled for ${p.scheduledAt.slice(0, 10)} ${p.scheduledAt.slice(11, 16)}`,
      })
    }
    if (p.status === 'published' && p.publishedAt) {
      activity.push({
        ts: Date.parse(p.publishedAt) || 0, type: 'publish', time: fmtActTime(p.publishedAt, zh),
        zh: `${platName} 内容已发布`, en: `${platName} content published`,
      })
    }
  })
  repurposedContent
    .filter(r => r.projectId === projectId)
    .forEach(r => activity.push({
      ts: Date.parse(r.createdAt) || 0, type: 'gen', time: fmtActTime(r.createdAt, zh),
      zh: '完成了一次四平台内容改写', en: 'Repurposed content for 4 platforms',
    }))
  activity.sort((a, b) => b.ts - a.ts)
  const activityLog = activity.slice(0, 6)

  const selectedPlat = selectedPost
    ? PLATS.find(pl => pl.id === selectedPost.platform) ?? PLATS[0]
    : null

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, fontFamily: SANS }}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>

      {/* ── Top status bar ── */}
      <div style={{
        background: C.bg1, borderBottom: `1px solid ${C.border}`,
        padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Pip avatar + status */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
        }}>
          <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M12 8v4l3 3"/>
          </svg>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>Pip</span>
            <span style={{
              fontFamily: MONO, fontSize: 8, padding: '2px 7px', borderRadius: 99,
              background: 'rgba(16,185,129,0.1)', color: C.green,
              border: '1px solid rgba(16,185,129,0.2)',
            }}>● {zh ? '每日运行中' : 'Running Daily'}</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginTop: 1 }}>
            {new Date().toLocaleDateString(zh ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Stat chips */}
        {[
          { n: draftPosts.length,     label: zh ? '待审核' : 'Inbox',     c: C.orange, bg: 'rgba(245,158,11,0.1)'  },
          { n: scheduledPosts.length, label: zh ? '已排期' : 'Scheduled', c: C.accent, bg: 'rgba(59,130,246,0.08)' },
          { n: publishedPosts.length, label: zh ? '已发布' : 'Published', c: C.green,  bg: 'rgba(16,185,129,0.08)' },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '4px 12px', borderRadius: 8, background: s.bg,
            border: `1px solid ${s.c}22`,
          }}>
            <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.n}</span>
            <span style={{ fontSize: 9, color: s.c, marginTop: 1, opacity: 0.85 }}>{s.label}</span>
          </div>
        ))}

        {/* 待办事项 dropdown */}
        <div ref={todoRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setTodoOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9,
              background: todoOpen ? C.bg3 : C.bg2,
              border: `1px solid ${C.borderS}`,
              color: C.ink2, cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: 600,
              transition: 'background 0.15s',
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            {zh ? '待办事项' : 'To-do'}
            {draftPosts.length > 0 && (
              <span style={{
                minWidth: 18, height: 18, borderRadius: 99, background: C.orange,
                fontFamily: MONO, fontSize: 10, color: '#fff', fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
              }}>{draftPosts.length}</span>
            )}
          </button>

          {todoOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              minWidth: 260, background: C.bg1,
              border: `1px solid ${C.borderS}`, borderRadius: 12,
              boxShadow: C.shadowM, overflow: 'hidden', zIndex: 20,
            }}>
              <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: C.ink }}>{zh ? '待办事项' : 'To-do'}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{draftPosts.length}</span>
              </div>
              {draftPosts.length === 0 ? (
                <div style={{ padding: '16px 14px', fontSize: 12, color: C.ink4, textAlign: 'center' }}>
                  {zh ? '全部处理完毕 ✓' : 'All done ✓'}
                </div>
              ) : (
                draftPosts.slice(0, 6).map(post => {
                  const pl = PLATS.find(p => p.id === post.platform) ?? PLATS[0]
                  const PlatIcon = pl.Icon
                  return (
                    <button
                      key={post.id}
                      onClick={() => { setSelectedPost(post); setTodoOpen(false) }}
                      style={{
                        width: '100%', padding: '9px 14px', border: 'none', background: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        borderBottom: `1px solid ${C.border}`, textAlign: 'left',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.bg2)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: pl.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PlatIcon size={11} color={pl.color} />
                      </div>
                      <span style={{ flex: 1, fontSize: 12, color: C.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.content.slice(0, 40)}…
                      </span>
                      <svg width="10" height="10" fill="none" stroke={C.ink4} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M7 17L17 7M7 7h10v10"/></svg>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* New content button */}
        <Link href={`/app/${projectId}/workshop`} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', borderRadius: 9,
          background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
          color: '#fff', textDecoration: 'none',
          fontWeight: 700, fontSize: 12, flexShrink: 0,
          boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
        }}>
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          {zh ? '新建内容' : 'New Content'}
        </Link>
      </div>

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Section 1: Platform Agent Cards ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{zh ? '智能体动态' : 'Agent Activity'}</span>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: C.green, display: 'inline-block', boxShadow: `0 0 0 3px rgba(16,185,129,0.15)` }} />
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{zh ? 'Pip 每日自动生成' : 'daily by Pip'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {visiblePlats.map(plat => (
              <AgentCard
                key={plat.id}
                plat={plat}
                drafts={getDraftsByPlatform(plat.id)}
                zh={zh}
                projectId={projectId}
                auto={(autoPlatforms[projectId] ?? []).includes(plat.id)}
                onToggleAuto={() => handleToggleAuto(plat.id)}
                onSelect={setSelectedPost}
              />
            ))}
          </div>
        </section>

        {/* ── Section 2: Today's Schedule ── */}
        {scheduledPosts.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{zh ? '今日排期' : "Today's Queue"}</span>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: C.accent, display: 'inline-block' }} />
              </div>
              <Link href={`/app/${projectId}/calendar`} style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, textDecoration: 'none' }}>
                {zh ? '查看完整日历 →' : 'Full calendar →'}
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {scheduledPosts.map((post) => {
                const plat = PLATS.find(pl => pl.id === post.platform) ?? PLATS[0]
                const PlatIcon = plat.Icon
                const when = post.scheduledAt
                  ? `${post.scheduledAt.slice(5, 10)} ${post.scheduledAt.slice(11, 16)}`
                  : '—'
                return (
                  <div key={post.id} style={{
                    background: C.bg1, borderRadius: 10, border: `1px solid ${C.border}`,
                    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: C.shadow,
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.accent, width: 76, flexShrink: 0 }}>
                      {when}
                    </span>
                    <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: plat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <PlatIcon size={13} color={plat.color} />
                    </div>
                    <p style={{ flex: 1, fontSize: 12, color: C.ink2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.content}
                    </p>
                    <span style={{ fontFamily: MONO, fontSize: 8, color: C.green, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 7px', borderRadius: 99, flexShrink: 0 }}>
                      {zh ? '已排期' : 'SCHEDULED'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Section 3: Pip Terminal ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{zh ? 'Pip 动态' : 'Pip Activity'}</span>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: C.purple, display: 'inline-block' }} />
          </div>
          <div style={{ background: '#0f1117', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {['#ef4444', '#f59e0b', '#10b981'].map(c => (
                <div key={c} style={{ width: 9, height: 9, borderRadius: 99, background: c, opacity: 0.7 }} />
              ))}
              <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>
                pip.terminal — {zh ? '最近活动' : 'recent activity'}
              </span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activityLog.length === 0 && (
                <div style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  {zh ? '还没有活动记录 — 去内容工坊生成第一批内容吧' : 'No activity yet — generate your first content in the Workshop'}
                </div>
              )}
              {activityLog.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.25)', flexShrink: 0, width: 40 }}>{entry.time}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: LOG_COLORS[entry.type], flexShrink: 0 }}>
                    {entry.type === 'gen' ? '>' : entry.type === 'sched' ? '●' : '✓'}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                    {zh ? entry.zh : entry.en}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.25)', width: 40 }} />
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.green }}>_</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.green, animation: 'blink 1.2s step-end infinite' }}>
                  {zh ? 'Pip 待命中，随时为你生成内容' : 'Pip is standing by — ready to generate'}
                </span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ── Content Drawer ── */}
      {selectedPost && selectedPlat && (
        <ContentDrawer
          post={selectedPost}
          plat={selectedPlat}
          zh={zh}
          projectId={projectId}
          onClose={() => setSelectedPost(null)}
          onApprove={() => {
            useMingStore.getState().updatePost(projectId, selectedPost.id, { status: 'scheduled', scheduledAt: nextSlotISO(1) })
            setSelectedPost(null)
          }}
        />
      )}
    </div>
  )
}
