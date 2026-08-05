'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { ALL_PLATFORMS } from '@/lib/brand'
import type { Post } from '@/lib/brand'

const C = {
  bg: '#ffffff', bg1: '#f9fafb', bg2: '#f3f4f6',
  ink: '#111827', ink2: '#374151', ink3: '#6b7280', ink4: '#9ca3af',
  accent: '#3b82f6', al: 'rgba(59,130,246,0.08)', al2: 'rgba(59,130,246,0.15)',
  border: 'rgba(17,24,39,0.08)', border2: 'rgba(17,24,39,0.14)',
  shadow: '0 1px 3px rgba(17,24,39,0.06),0 3px 10px rgba(17,24,39,0.04)',
  green: '#10b981',
}
const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

type Lang = 'en' | 'zh'

const STATUS_CFG = (lang: Lang) => ({
  draft:     { labelKey: 'calendar.status.draft', color: C.ink4  },
  scheduled: { labelKey: 'calendar.status.sched', color: '#f59e0b' },
  published: { labelKey: 'calendar.status.pub',   color: C.green  },
})

function getPlatform(id: string) { return ALL_PLATFORMS.find(p => p.id === id) }

function getMonthName(month: number, lang: Lang) {
  return new Date(2024, month, 1).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'long' })
}

function getWeekdays(lang: Lang) {
  if (lang === 'zh') return ['一', '二', '三', '四', '五', '六', '日']
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
}

export default function CalendarPage() {
  const params    = useParams()
  const projectId = params.projectId as string
  const { projects, updatePost, lang } = useMingStore()
  const project = projects.find(p => p.id === projectId)

  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay,  setSelectedDay]  = useState<number | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [copied, setCopied] = useState(false)

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const posts = project?.posts || []
  const getPostsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return posts.filter(p => (p.scheduledAt || p.createdAt)?.startsWith(dateStr))
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1); setSelectedDay(null); setSelectedPost(null) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1); setSelectedDay(null); setSelectedPost(null) }

  const dayPosts = selectedDay ? getPostsForDay(selectedDay) : []
  const monthPostCount = posts.filter(p => (p.scheduledAt || p.createdAt)?.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length

  const copyContent = async (content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const statusCfg = STATUS_CFG(lang as Lang)
  const weekdays  = getWeekdays(lang as Lang)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg1, fontFamily: SANS }}>

      {/* Header */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, fontSize: 18, padding: '0 4px', lineHeight: 1 }}>‹</button>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: C.ink }}>{getMonthName(month, lang as Lang)} {year}</span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, fontSize: 18, padding: '0 4px', lineHeight: 1 }}>›</button>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>
          {t('calendar.posts.month', lang).replace('{n}', String(monthPostCount))}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Calendar grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {weekdays.map(d => (
              <div key={d} style={{ textAlign: 'center', fontFamily: MONO, fontSize: 9, color: C.ink4, padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const dp = getPostsForDay(day)
              const isToday    = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const isSelected = day === selectedDay
              return (
                <div key={day} onClick={() => { setSelectedDay(day); setSelectedPost(null) }} style={{
                  minHeight: 76, padding: 7, borderRadius: 9, cursor: 'pointer',
                  border: `1.5px solid ${isSelected ? C.accent : isToday ? C.al2 : C.border}`,
                  background: isSelected ? C.al : isToday ? 'rgba(59,130,246,0.03)' : '#fff',
                  boxShadow: isSelected ? `0 0 0 2px ${C.al2}` : C.shadow,
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: isToday ? C.accent : C.ink3, fontWeight: isToday ? 700 : 400, marginBottom: 4 }}>{day}</div>
                  {dp.slice(0, 3).map(post => {
                    const pl = getPlatform(post.platform)
                    return (
                      <div key={post.id} style={{
                        fontSize: 9, padding: '2px 5px', borderRadius: 4, marginBottom: 2,
                        background: (pl?.color || C.accent) + '18',
                        borderLeft: `2px solid ${pl?.color || C.accent}`,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontFamily: SANS, color: C.ink2,
                      }}>● {post.title.slice(0, 7)}</div>
                    )
                  })}
                  {dp.length > 3 && <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4 }}>+{dp.length - 3}</div>}
                </div>
              )
            })}
          </div>

          {/* Empty state */}
          {posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ color: C.ink4, display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
              <p style={{ fontFamily: SANS, fontSize: 14, color: C.ink3, lineHeight: 1.8 }}>
                {t('calendar.empty', lang).split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
              </p>
            </div>
          )}
        </div>

        {/* Right panel — day detail */}
        {selectedDay && (
          <div style={{ width: 280, borderLeft: `1px solid ${C.border}`, background: C.bg, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: C.ink }}>{getMonthName(month, lang as Lang)} {selectedDay}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginTop: 2 }}>{dayPosts.length} {lang === 'zh' ? '篇内容' : `post${dayPosts.length !== 1 ? 's' : ''}`}</div>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            {dayPosts.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ fontFamily: SANS, fontSize: 13, color: C.ink4, lineHeight: 1.8 }}>{t('calendar.noday', lang)}</p>
              </div>
            ) : (
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayPosts.map(post => {
                  const pl = getPlatform(post.platform)
                  const sc = statusCfg[post.status]
                  const isActive = selectedPost?.id === post.id
                  return (
                    <div key={post.id}>
                      <div onClick={() => setSelectedPost(isActive ? null : post)} style={{
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        border: `1.5px solid ${isActive ? C.accent : C.border2}`,
                        background: isActive ? C.al : '#fff',
                        boxShadow: C.shadow, transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                          <span style={{ fontSize: 13, color: pl?.color || C.accent }}>●</span>
                          <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: C.ink, flex: 1 }}>{pl?.name}</span>
                          <span style={{ fontFamily: MONO, fontSize: 9, color: sc.color }}>{t(sc.labelKey, lang)}</span>
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: 12, color: C.ink2, lineHeight: 1.7, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: isActive ? 999 : 2, WebkitBoxOrient: 'vertical' as const }}>
                          {post.title}
                        </div>
                      </div>

                      {isActive && (
                        <div style={{ padding: '10px 12px', background: C.bg1, borderRadius: '0 0 10px 10px', borderLeft: `1.5px solid ${C.border2}`, borderRight: `1.5px solid ${C.border2}`, borderBottom: `1.5px solid ${C.border2}`, marginTop: -6 }}>
                          {post.status === 'scheduled' && post.scheduledAt && (
                            <div style={{ fontFamily: MONO, fontSize: 9, color: '#f59e0b', marginBottom: 8 }}>
                              {lang === 'zh' ? '排期于' : 'Scheduled for'} {post.scheduledAt.slice(0, 10)} {post.scheduledAt.slice(11, 16)}
                            </div>
                          )}
                          <div style={{ fontFamily: SANS, fontSize: 12, color: C.ink2, lineHeight: 1.8, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
                            {post.content || post.title}
                          </div>
                          {post.hashtags?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                              {post.hashtags.map(tag => (
                                <span key={tag} style={{ fontFamily: MONO, fontSize: 9, padding: '2px 7px', borderRadius: 99, background: C.al, color: C.accent }}>{tag}</span>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => copyContent(post.content || post.title)} style={{
                              flex: 1, padding: '6px 0', borderRadius: 7, border: `1px solid ${C.border2}`,
                              background: '#fff', color: C.ink3, fontFamily: MONO, fontSize: 9, cursor: 'pointer',
                            }}>{copied ? t('calendar.copied', lang) : t('calendar.copy', lang)}</button>
                            {post.status === 'draft' && selectedDay && (
                              <button onClick={() => {
                                // Schedule onto the currently-viewed day at 09:00 local time
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T09:00:00`
                                updatePost(projectId, post.id, { status: 'scheduled', scheduledAt: dateStr })
                              }} style={{
                                flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
                                background: '#f59e0b', color: '#fff', fontFamily: MONO, fontSize: 9, cursor: 'pointer',
                              }}>{t('calendar.schedule', lang)}</button>
                            )}
                            {post.status === 'scheduled' && selectedDay && (
                              <>
                                <button onClick={() => {
                                  // Reschedule: move to the currently-viewed day, keep time
                                  const time = post.scheduledAt?.slice(11) || '09:00:00'
                                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T${time}`
                                  updatePost(projectId, post.id, { scheduledAt: dateStr })
                                }} style={{
                                  flex: 1, padding: '6px 0', borderRadius: 7, border: `1px solid #f59e0b`,
                                  background: '#fff', color: '#f59e0b', fontFamily: MONO, fontSize: 9, cursor: 'pointer',
                                }}>{lang === 'zh' ? '改期' : 'Move'}</button>
                                <button onClick={() => updatePost(projectId, post.id, { status: 'published', publishedAt: new Date().toISOString() })} style={{
                                  flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
                                  background: C.green, color: '#fff', fontFamily: MONO, fontSize: 9, cursor: 'pointer',
                                }}>{t('calendar.markpub', lang)}</button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
