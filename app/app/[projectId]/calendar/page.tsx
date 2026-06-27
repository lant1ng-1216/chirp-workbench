'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import { ALL_PLATFORMS } from '@/lib/brand'
import type { Post } from '@/lib/brand'

const C = {
  bg: '#faf9f7', bg2: '#f4f2ee', bg3: '#edeae4',
  ink: '#1a1916', ink2: '#4a4844', ink3: '#9a9894', ink4: '#c8c6c0',
  accent: '#1c3a2e', al: 'rgba(28,58,46,0.08)', al2: 'rgba(28,58,46,0.15)',
  gold: '#7a6020', gl: '#f5f0e8',
  border: 'rgba(26,25,22,0.08)', border2: 'rgba(26,25,22,0.14)',
  shadow: '0 1px 3px rgba(26,25,22,0.06),0 3px 10px rgba(26,25,22,0.04)',
  sfloat: '0 8px 32px rgba(26,25,22,0.14)',
  green: '#4a9e6a',
}
const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"
const SANS  = "'Noto Sans SC', 'PingFang SC', sans-serif"

const STATUS_CFG = {
  draft:     { label: '草稿',  color: C.ink4 },
  scheduled: { label: '排期中', color: C.gold },
  published: { label: '已发布', color: C.green },
}

function getPlatform(id: string) { return ALL_PLATFORMS.find(p => p.id === id) }

export default function CalendarPage() {
  const params    = useParams()
  const router    = useRouter()
  const projectId = params.projectId as string
  const { projects, updatePost } = useMingStore()
  const project = projects.find(p => p.id === projectId)

  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay,   setSelectedDay]   = useState<number | null>(null)
  const [selectedPost,  setSelectedPost]  = useState<Post | null>(null)
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

  const copyContent = async (content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: SANS }}>

      {/* Header */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, fontSize: 16, padding: '0 4px', lineHeight: 1 }}>‹</button>
          <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.ink }}>{year}年{month + 1}月</span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, fontSize: 16, padding: '0 4px', lineHeight: 1 }}>›</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.08em', alignSelf: 'center' }}>本月 {posts.filter(p => (p.scheduledAt || p.createdAt)?.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length} 条</span>
          <button onClick={() => router.push(`/app/${projectId}?prompt=帮我排一下本月内容日历`)} style={{
            padding: '5px 13px', borderRadius: 7, border: `1px solid ${C.accent}`,
            background: C.accent, color: '#fff', fontFamily: SERIF, fontSize: 12, cursor: 'pointer',
          }}>+ 让鸣排期</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Calendar grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {['一', '二', '三', '四', '五', '六', '日'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.08em', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const dp = getPostsForDay(day)
              const isToday   = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const isSelected = day === selectedDay
              return (
                <div key={day} onClick={() => { setSelectedDay(day); setSelectedPost(null) }} style={{
                  minHeight: 76, padding: 7, borderRadius: 9, cursor: 'pointer',
                  border: `1.5px solid ${isSelected ? C.accent : isToday ? 'rgba(28,58,46,0.3)' : C.border}`,
                  background: isSelected ? C.al : isToday ? C.gl : '#fff',
                  boxShadow: isSelected ? `0 0 0 2px ${C.al2}` : C.shadow,
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 11,
                    color: isToday ? C.accent : C.ink3,
                    fontWeight: isToday ? 700 : 400,
                    marginBottom: 4,
                  }}>{day}</div>
                  {dp.slice(0, 3).map(post => {
                    const pl = getPlatform(post.platform)
                    return (
                      <div key={post.id} style={{
                        fontSize: 9, padding: '2px 5px', borderRadius: 4, marginBottom: 2,
                        background: (pl?.color || C.accent) + '18',
                        borderLeft: `2px solid ${pl?.color || C.accent}`,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontFamily: SANS, color: C.ink2,
                      }}>{pl?.icon} {post.title.slice(0, 7)}</div>
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
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.al, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: SERIF, fontSize: 20, color: C.accent }}>历</div>
              <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 14, color: C.ink3, lineHeight: 1.9, marginBottom: 16 }}>日历还没有内容<br />告诉鸣帮你规划本月发布计划</p>
              <button onClick={() => router.push(`/app/${projectId}?prompt=帮我排一下本月内容日历`)} style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: C.accent, color: '#fff', fontFamily: SERIF, fontSize: 13, cursor: 'pointer',
              }}>让鸣来排期 →</button>
            </div>
          )}
        </div>

        {/* Right panel — day detail */}
        {selectedDay && (
          <div style={{ width: 280, borderLeft: `1px solid ${C.border}`, background: C.bg, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.ink }}>{month + 1}月{selectedDay}日</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.06em', marginTop: 2 }}>{dayPosts.length} 条内容</div>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, fontSize: 18, lineHeight: 1 }}>×</button>
            </div>

            {dayPosts.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: C.ink4, lineHeight: 1.8 }}>当天暂无内容</p>
                <button onClick={() => router.push(`/app/${projectId}?prompt=帮我给${month+1}月${selectedDay}日写一篇内容`)} style={{
                  marginTop: 12, padding: '6px 14px', borderRadius: 7, border: `1px solid ${C.accent}`,
                  background: 'transparent', color: C.accent, fontFamily: SERIF, fontSize: 12, cursor: 'pointer',
                }}>让鸣创作</button>
              </div>
            ) : (
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayPosts.map(post => {
                  const pl = getPlatform(post.platform)
                  const sc = STATUS_CFG[post.status]
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
                          <span style={{ fontSize: 13 }}>{pl?.icon}</span>
                          <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: C.ink, flex: 1 }}>{pl?.name}</span>
                          <span style={{ fontFamily: MONO, fontSize: 9, color: sc.color }}>{sc.label}</span>
                        </div>
                        <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 12, color: C.ink2, lineHeight: 1.7, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: isActive ? 999 : 2, WebkitBoxOrient: 'vertical' as const }}>
                          {post.title}
                        </div>
                      </div>

                      {isActive && (
                        <div style={{ padding: '10px 12px', background: C.bg2, borderRadius: '0 0 10px 10px', borderLeft: `1.5px solid ${C.border2}`, borderRight: `1.5px solid ${C.border2}`, borderBottom: `1.5px solid ${C.border2}`, marginTop: -6 }}>
                          <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 12, color: C.ink2, lineHeight: 1.8, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
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
                              letterSpacing: '0.04em',
                            }}>{copied ? '已复制 ✓' : '复制内容'}</button>
                            {post.status === 'draft' && (
                              <button onClick={() => updatePost(projectId, post.id, { status: 'scheduled' })} style={{
                                flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
                                background: C.accent, color: '#fff', fontFamily: MONO, fontSize: 9, cursor: 'pointer',
                                letterSpacing: '0.04em',
                              }}>标为排期</button>
                            )}
                            {post.status === 'scheduled' && (
                              <button onClick={() => updatePost(projectId, post.id, { status: 'published', publishedAt: new Date().toISOString() })} style={{
                                flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
                                background: C.green, color: '#fff', fontFamily: MONO, fontSize: 9, cursor: 'pointer',
                                letterSpacing: '0.04em',
                              }}>标为已发布</button>
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
