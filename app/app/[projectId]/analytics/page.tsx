'use client'
import { useState, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import type { PipInsight } from '@/lib/store'
import {
  LineChart, Line,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

const C = {
  bg: '#f2f3f7', bg1: '#ffffff', bg2: '#f7f8fa', bg3: '#eef0f4',
  ink: '#0f1117', ink2: '#2d3142', ink3: '#5c6070', ink4: '#9ea3b0',
  accent: '#3b82f6', green: '#10b981', orange: '#f59e0b', purple: '#8b5cf6', red: '#ef4444',
  border: 'rgba(15,17,23,0.07)', borderS: 'rgba(15,17,23,0.12)',
  shadow: '0 1px 2px rgba(15,17,23,0.05),0 4px 16px rgba(15,17,23,0.05)',
}
const SANS = "'Inter',-apple-system,sans-serif"
const MONO = "'Space Mono',monospace"

const PLATS = [
  { id: 'youtube',   label: 'YouTube',   key: 'yt', color: '#ff0000' },
  { id: 'instagram', label: 'Instagram', key: 'ig', color: '#e1306c' },
  { id: 'tiktok',    label: 'TikTok',    key: 'tt', color: '#111827' },
  { id: 'twitter',   label: 'X',         key: 'x',  color: '#000000' },
]

const INSIGHT_STYLE: Record<PipInsight['type'], { icon: string; color: string }> = {
  growth:  { icon: '📈', color: '#10b981' },
  timing:  { icon: '⏰', color: '#3b82f6' },
  content: { icon: '💡', color: '#8b5cf6' },
  warning: { icon: '⚠️', color: '#f59e0b' },
}

const HOUR_BUCKETS = ['6am', '9am', '12pm', '3pm', '6pm', '9pm'] as const
const BUCKET_HOURS = [6, 9, 12, 15, 18, 21]
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: C.bg1, borderRadius: 12, border: `1px solid ${C.borderS}`, padding: '16px 20px', boxShadow: C.shadow }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      {sub && <div style={{ fontFamily: SANS, fontSize: 11, color: C.ink4, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.borderS}`, borderRadius: 8, padding: '8px 12px', boxShadow: C.shadow }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontFamily: MONO, fontSize: 10, color: p.color, marginBottom: 2 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

/** Monday 00:00 of the week containing `d` */
function weekStart(d: Date): Date {
  const x = new Date(d)
  const dow = (x.getDay() + 6) % 7 // Mon=0
  x.setDate(x.getDate() - dow)
  x.setHours(0, 0, 0, 0)
  return x
}

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const { projects, lang, assets, insights, setInsights } = useMingStore()
  const zh = lang === 'zh'
  const project = projects.find(p => p.id === projectId)

  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState('')

  if (!project) return null
  const posts = project.posts ?? []
  const projectAssets = assets.filter(a => a.projectId === projectId)
  const taggedAssets = projectAssets.filter(a => a.tags.length > 0 || a.pipAnalysis)
  const projectInsights = insights[projectId] ?? []

  /* ── real KPI ── */
  const drafts = posts.filter(p => p.status === 'draft')
  const scheduled = posts.filter(p => p.status === 'scheduled')
  const published = posts.filter(p => p.status === 'published')

  /* ── posting activity: posts per platform per week, last 5 weeks ── */
  const thisWeek = weekStart(new Date())
  const weeklyData = Array.from({ length: 5 }, (_, wi) => {
    const ws = new Date(thisWeek); ws.setDate(ws.getDate() - (4 - wi) * 7)
    const we = new Date(ws); we.setDate(we.getDate() + 7)
    const row: Record<string, number | string> = {
      date: `${ws.getMonth() + 1}/${ws.getDate()}`,
      yt: 0, ig: 0, tt: 0, x: 0,
    }
    posts.forEach(p => {
      const d = new Date(p.createdAt)
      if (d >= ws && d < we) {
        const plat = PLATS.find(pl => pl.id === p.platform)
        if (plat) row[plat.key] = (row[plat.key] as number) + 1
      }
    })
    return row
  })

  /* ── platform distribution (real) ── */
  const distribution = PLATS.map(pl => ({
    name: pl.label,
    posts: posts.filter(p => p.platform === pl.id).length,
    color: pl.color,
  }))

  /* ── posting-time heatmap (real, from scheduledAt / publishedAt / createdAt) ── */
  const heat: Record<string, number> = {}
  posts.forEach(p => {
    const src = p.scheduledAt || p.publishedAt || p.createdAt
    if (!src) return
    const d = new Date(src)
    const day = DAYS[(d.getDay() + 6) % 7]
    let bi = BUCKET_HOURS.length - 1
    for (let i = 0; i < BUCKET_HOURS.length; i++) {
      if (d.getHours() < BUCKET_HOURS[i] + 3) { bi = i; break }
    }
    const k = `${HOUR_BUCKETS[bi]}-${day}`
    heat[k] = (heat[k] ?? 0) + 1
  })
  const heatMax = Math.max(1, ...Object.values(heat))
  const bestSlot = Object.entries(heat).sort((a, b) => b[1] - a[1])[0]

  /* ── stats summary for Pip ── */
  const statsSummary = [
    `Total posts: ${posts.length} (drafts ${drafts.length}, scheduled ${scheduled.length}, published ${published.length})`,
    `By platform: ${distribution.map(d => `${d.name} ${d.posts}`).join(', ')}`,
    `Posts per week (last 5 weeks): ${weeklyData.map(w => `${w.date}: YT${w.yt} IG${w.ig} TT${w.tt} X${w.x}`).join(' | ')}`,
    `Asset library: ${projectAssets.length} assets, ${taggedAssets.length} tagged`,
    bestSlot ? `Most common posting slot: ${bestSlot[0].split('-')[0]} on ${bestSlot[0].split('-')[1]}` : 'No posting-time data yet',
  ].join('\n')

  const generateInsights = async () => {
    const alias = project.brand.mindsConversationAlias
    if (!alias || insightsLoading) return
    setInsightsLoading(true); setInsightsError('')
    try {
      const res = await fetch('/api/minds/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias, profile: project.brand, stats: statsSummary }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'failed')
      setInsights(projectId, data.insights ?? [])
    } catch (e) {
      setInsightsError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setInsightsLoading(false)
    }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, fontFamily: SANS }}>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Header */}
      <div style={{ background: C.bg1, borderBottom: `1px solid ${C.border}`, padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 18, color: C.ink, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
              {zh ? '增长分析' : 'Analytics'}
            </h1>
            <p style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, margin: 0 }}>
              {zh ? '基于你工作区的真实数据 · Pip 给出增长建议' : 'Built on your real workspace data · Pip recommends what to do next'}
            </p>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, background: C.bg2, padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}` }}>
            {zh ? '实时工作区数据' : 'Live workspace data'}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPI row (real) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <StatCard label={zh ? '已发布' : 'PUBLISHED'} value={String(published.length)} sub={zh ? '累计发布内容' : 'posts published'} color={C.green} />
          <StatCard label={zh ? '已排期' : 'SCHEDULED'} value={String(scheduled.length)} sub={zh ? '日历中的待发内容' : 'queued in calendar'} color={C.accent} />
          <StatCard label={zh ? '待审核' : 'INBOX'} value={String(drafts.length)} sub={zh ? '等待你批准的草稿' : 'drafts awaiting review'} color={C.orange} />
          <StatCard label={zh ? '素材库' : 'ASSETS TAGGED'} value={`${taggedAssets.length}/${projectAssets.length}`} sub={zh ? 'Pip 已打标签' : 'tagged by Pip'} color={C.purple} />
        </div>

        {/* Pip insights (on-demand) */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{zh ? 'Pip 增长洞察' : "Pip's Growth Insights"}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              {insightsError && <span style={{ fontFamily: SANS, fontSize: 11, color: C.red }}>{insightsError}</span>}
              <button
                onClick={generateInsights}
                disabled={insightsLoading || !project.brand.mindsConversationAlias}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, border: 'none',
                  background: insightsLoading ? C.bg3 : 'linear-gradient(135deg,#3b82f6,#6366f1)',
                  color: insightsLoading ? C.ink4 : '#fff',
                  fontFamily: SANS, fontWeight: 600, fontSize: 12,
                  cursor: insightsLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {insightsLoading && <div style={{ width: 12, height: 12, borderRadius: 6, border: `2px solid ${C.ink4}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />}
                {insightsLoading
                  ? (zh ? 'Pip 分析中…' : 'Pip analyzing…')
                  : projectInsights.length > 0
                    ? (zh ? '重新生成' : 'Regenerate')
                    : (zh ? '让 Pip 生成洞察' : 'Generate with Pip')}
              </button>
            </div>
          </div>

          {projectInsights.length === 0 && !insightsLoading ? (
            <div style={{ background: C.bg1, borderRadius: 12, border: `1px dashed ${C.borderS}`, padding: '22px 20px', textAlign: 'center' }}>
              <p style={{ fontFamily: SANS, fontSize: 12, color: C.ink4, margin: 0, lineHeight: 1.7 }}>
                {zh
                  ? '点击右上角按钮，Pip 会基于你的创作者档案和上方真实数据，给出 3-4 条可执行的增长建议。'
                  : 'Hit the button above — Pip reads your creator profile plus the real data on this page and returns 3-4 actionable growth insights.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {projectInsights.map((ins, i) => {
                const st = INSIGHT_STYLE[ins.type] ?? INSIGHT_STYLE.growth
                return (
                  <div key={i} style={{ background: C.bg1, borderRadius: 12, border: `1px solid ${C.borderS}`, padding: '14px 16px', boxShadow: C.shadow, borderLeft: `3px solid ${st.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 14 }}>{st.icon}</span>
                      <span style={{ fontFamily: MONO, fontSize: 8, color: st.color, letterSpacing: '0.05em' }}>{ins.type.toUpperCase()}</span>
                    </div>
                    <p style={{ fontFamily: SANS, fontSize: 12, color: C.ink2, lineHeight: 1.75, margin: 0 }}>{ins.text}</p>
                    {ins.action && (
                      <button
                        onClick={() => router.push(`/app/${projectId}/workshop?prefill=${encodeURIComponent(ins.action!)}`)}
                        style={{
                          marginTop: 10, padding: '5px 12px', borderRadius: 7,
                          border: `1px solid ${C.accent}40`, background: 'rgba(59,130,246,0.06)',
                          color: C.accent, fontFamily: MONO, fontSize: 9, cursor: 'pointer',
                        }}
                      >
                        {zh ? '→ 去工坊做这条内容' : '→ Make this in Workshop'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Posting activity (real) */}
        <section>
          <div style={{ background: C.bg1, borderRadius: 14, border: `1px solid ${C.borderS}`, padding: '18px 20px', boxShadow: C.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{zh ? '发布节奏 · 近 5 周' : 'Posting Activity · Last 5 Weeks'}</span>
              <div style={{ display: 'flex', gap: 14 }}>
                {PLATS.map(pl => (
                  <div key={pl.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 18, height: 2, background: pl.color, borderRadius: 1 }} />
                    <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{pl.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fontFamily: MONO, fontSize: 9, fill: C.ink4 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontFamily: MONO, fontSize: 9, fill: C.ink4 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {PLATS.map(pl => (
                  <Line key={pl.key} type="monotone" dataKey={pl.key} name={pl.label} stroke={pl.color} strokeWidth={2} dot={{ r: 2.5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Distribution + heatmap (real) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: C.bg1, borderRadius: 14, border: `1px solid ${C.borderS}`, padding: '18px 20px', boxShadow: C.shadow }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 16 }}>{zh ? '平台内容分布' : 'Content by Platform'}</div>
            {posts.length === 0 ? (
              <p style={{ fontFamily: SANS, fontSize: 12, color: C.ink4, lineHeight: 1.7 }}>
                {zh ? '还没有内容。去工坊生成第一批四平台内容，这里就会出现分布图。' : 'No content yet. Generate your first batch in the Workshop and this chart comes alive.'}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={distribution} layout="vertical">
                  <XAxis type="number" allowDecimals={false} tick={{ fontFamily: MONO, fontSize: 8, fill: C.ink4 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontFamily: SANS, fontSize: 10, fill: C.ink3 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="posts" name={zh ? '内容数' : 'Posts'} fill={C.accent} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ background: C.bg1, borderRadius: 14, border: `1px solid ${C.borderS}`, padding: '18px 20px', boxShadow: C.shadow }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 8 }}>{zh ? '你的发布时段' : 'Your Posting Times'}</div>
            <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, marginBottom: 10 }}>{zh ? '基于排期与发布时间' : 'Based on scheduled & published posts'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(7,1fr)', gap: 3 }}>
              <div />
              {DAY_LABELS.map(d => (
                <div key={d} style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, textAlign: 'center' }}>{d}</div>
              ))}
              {HOUR_BUCKETS.map(hour => (
                <Fragment key={hour}>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, paddingRight: 6, display: 'flex', alignItems: 'center' }}>{hour}</div>
                  {DAYS.map(day => {
                    const v = heat[`${hour}-${day}`] ?? 0
                    return (
                      <div key={day} style={{
                        height: 22, borderRadius: 4,
                        background: v === 0 ? C.bg3 : `rgba(59,130,246,${0.15 + (v / heatMax) * 0.65})`,
                      }} />
                    )
                  })}
                </Fragment>
              ))}
            </div>
            {bestSlot && (
              <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 9, color: C.green }}>
                ★ {zh ? '最常用时段' : 'Most used'}: {bestSlot[0].split('-')[0]} · {bestSlot[0].split('-')[1].toUpperCase()}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
