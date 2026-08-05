'use client'
import { useState, Fragment } from 'react'
import { useParams } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import {
  LineChart, Line, AreaChart, Area,
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

const FOLLOWERS = [
  { date: '7/7',  yt: 12400, ig: 8200,  tt: 21000, x: 4300 },
  { date: '7/14', yt: 12850, ig: 8700,  tt: 23400, x: 4500 },
  { date: '7/21', yt: 13200, ig: 9100,  tt: 26800, x: 4700 },
  { date: '7/28', yt: 13900, ig: 9800,  tt: 31200, x: 5100 },
  { date: '8/4',  yt: 14600, ig: 10500, tt: 37500, x: 5600 },
]

const ENGAGEMENT = [
  { date: '7/7',  yt: 4.2, ig: 6.8, tt: 9.1,  x: 2.3 },
  { date: '7/14', yt: 3.9, ig: 7.2, tt: 11.4, x: 2.1 },
  { date: '7/21', yt: 5.1, ig: 6.5, tt: 10.8, x: 2.8 },
  { date: '7/28', yt: 4.7, ig: 8.1, tt: 13.2, x: 3.1 },
  { date: '8/4',  yt: 5.8, ig: 7.9, tt: 14.7, x: 3.4 },
]

const CONTENT_PERF = [
  { type: '教程/How-to', views: 48200 },
  { type: '产品展示',    views: 32100 },
  { type: 'Vlog',       views: 27800 },
  { type: '观点分享',    views: 19400 },
  { type: '幕后花絮',    views: 15600 },
]

const HEATMAP_DATA = [
  { hour: '6am',  mon:1, tue:2, wed:1, thu:1, fri:2, sat:3, sun:2 },
  { hour: '9am',  mon:5, tue:6, wed:5, thu:6, fri:5, sat:4, sun:3 },
  { hour: '12pm', mon:7, tue:8, wed:9, thu:8, fri:7, sat:6, sun:5 },
  { hour: '3pm',  mon:6, tue:7, wed:8, thu:9, fri:8, sat:7, sun:6 },
  { hour: '6pm',  mon:9, tue:10,wed:9, thu:10,fri:9, sat:8, sun:7 },
  { hour: '9pm',  mon:8, tue:9, wed:8, thu:9, fri:10,sat:9, sun:8 },
]

const PLAT_COLORS: Record<string, string> = { yt:'#ff0000', ig:'#e1306c', tt:'#111827', x:'#000000' }

const PIP_INSIGHTS = [
  { type:'growth',  icon:'📈', color:'#10b981',
    zh:'TikTok 粉丝本月增长 79%，远超其他平台。教程类内容互动率 14.7%，建议下周内容计划向 TikTok 倾斜，优先输出 3 条 60 秒以内的教程短片。',
    en:"TikTok followers grew 79% this month. Tutorial content hits 14.7% engagement there. Shift next week's plan toward TikTok — 3 tutorials under 60 seconds." },
  { type:'timing',  icon:'⏰', color:'#3b82f6',
    zh:'数据显示受众在周五和周六晚间 9pm 最为活跃，互动评分达 10/10。建议将最重要的内容安排在周五 21:00 发布。',
    en:'Your audience peaks Friday & Saturday at 9pm — engagement score 10/10. Schedule your highest-priority content for Friday 21:00.' },
  { type:'content', icon:'💡', color:'#8b5cf6',
    zh:'幕后花絮类互动率 9.2%，仅次于教程类，但发布频率最低。建议每两周增加一条幕后内容，低成本高回报。',
    en:'Behind-the-scenes content scores 9.2% engagement — second highest — but you post it least. Add one BTS piece every two weeks: low effort, high return.' },
  { type:'warning', icon:'⚠️', color:'#f59e0b',
    zh:'Instagram 互动率本周从 8.1% 下滑至 7.9%，连续两周下行。建议分析近期 Reels 完播率，考虑缩短前 3 秒开场节奏。',
    en:'Instagram engagement slipped from 8.1% to 7.9% — two weeks declining. Review Reels completion rates and tighten your 3-second hook.' },
]

function StatCard({ label, value, sub, color, delta }: { label:string; value:string; sub?:string; color:string; delta?:string }) {
  const pos = delta?.startsWith('+')
  return (
    <div style={{ background:C.bg1, borderRadius:12, border:`1px solid ${C.borderS}`, padding:'16px 20px', boxShadow:C.shadow }}>
      <div style={{ fontFamily:MONO, fontSize:9, color:C.ink4, letterSpacing:'0.06em', marginBottom:8 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
        <span style={{ fontFamily:MONO, fontSize:24, fontWeight:700, color, lineHeight:1 }}>{value}</span>
        {delta && <span style={{ fontFamily:MONO, fontSize:10, color:pos?C.green:C.red, marginBottom:2 }}>{delta}</span>}
      </div>
      {sub && <div style={{ fontFamily:SANS, fontSize:11, color:C.ink4, marginTop:4 }}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:C.bg1, border:`1px solid ${C.borderS}`, borderRadius:8, padding:'8px 12px', boxShadow:C.shadow }}>
      <div style={{ fontFamily:MONO, fontSize:9, color:C.ink4, marginBottom:6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontFamily:MONO, fontSize:10, color:p.color, marginBottom:2 }}>
          {p.name}: {typeof p.value==='number' && p.value>1000 ? `${(p.value/1000).toFixed(1)}k` : p.value}
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { lang } = useMingStore()
  const zh = lang === 'zh'
  const [activeTab, setActiveTab] = useState<'followers'|'engagement'>('followers')

  return (
    <div style={{ height:'100%', overflowY:'auto', background:C.bg, fontFamily:SANS }}>
      {/* Header */}
      <div style={{ background:C.bg1, borderBottom:`1px solid ${C.border}`, padding:'16px 24px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontWeight:700, fontSize:18, color:C.ink, margin:'0 0 2px', letterSpacing:'-0.02em' }}>
              {zh ? '增长分析' : 'Analytics'}
            </h1>
            <p style={{ fontFamily:MONO, fontSize:10, color:C.ink4, margin:0 }}>
              {zh ? 'Pip 监控数据，给出可执行的增长建议' : 'Pip monitors data and delivers actionable growth insights'}
            </p>
          </div>
          <div style={{ fontFamily:MONO, fontSize:10, color:C.ink4, background:C.bg2, padding:'6px 12px', borderRadius:8, border:`1px solid ${C.border}` }}>
            {zh ? '近 30 天 · 数据模拟' : 'Last 30 days · Simulated data'}
          </div>
        </div>
      </div>

      <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          <StatCard label={zh?'总粉丝数':'TOTAL FOLLOWERS'} value="68.2k" sub={zh?'跨平台合计':'across all platforms'} color={C.accent} delta="+4.1k" />
          <StatCard label={zh?'平均互动率':'AVG ENGAGEMENT'} value="7.9%" sub={zh?'较上周 +0.8%':'+0.8% vs last week'} color={C.green} delta="+0.8%" />
          <StatCard label={zh?'本月发布':'POSTS THIS MONTH'} value="23" sub="YT×3 IG×6 TT×9 X×5" color={C.purple} />
          <StatCard label={zh?'最佳平台':'TOP PLATFORM'} value="TikTok" sub={zh?'互动率 14.7%':'14.7% engagement'} color={C.orange} delta="+79%" />
        </div>

        {/* Pip Insights */}
        <section>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:20, height:20, borderRadius:5, background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <span style={{ fontWeight:700, fontSize:14, color:C.ink }}>{zh?'Pip 本周洞察':"Pip's Weekly Insights"}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {PIP_INSIGHTS.map((ins,i) => (
              <div key={i} style={{ background:C.bg1, borderRadius:12, border:`1px solid ${C.borderS}`, padding:'14px 16px', boxShadow:C.shadow, borderLeft:`3px solid ${ins.color}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                  <span style={{ fontSize:14 }}>{ins.icon}</span>
                  <span style={{ fontFamily:MONO, fontSize:8, color:ins.color, letterSpacing:'0.05em' }}>{ins.type.toUpperCase()}</span>
                </div>
                <p style={{ fontFamily:SANS, fontSize:12, color:C.ink2, lineHeight:1.75, margin:0 }}>{zh?ins.zh:ins.en}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trend chart */}
        <section>
          <div style={{ background:C.bg1, borderRadius:14, border:`1px solid ${C.borderS}`, padding:'18px 20px', boxShadow:C.shadow }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <span style={{ fontWeight:700, fontSize:14, color:C.ink }}>{zh?'平台趋势':'Platform Trends'}</span>
              <div style={{ display:'flex', gap:4 }}>
                {(['followers','engagement'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding:'5px 12px', borderRadius:7, border:'none', cursor:'pointer', fontFamily:MONO, fontSize:9,
                    background: activeTab===tab ? C.accent : C.bg3,
                    color: activeTab===tab ? '#fff' : C.ink4,
                  }}>
                    {tab==='followers' ? (zh?'粉丝增长':'Followers') : (zh?'互动率':'Engagement')}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:16, marginBottom:12 }}>
              {[['YouTube','yt'],['Instagram','ig'],['TikTok','tt'],['X','x']].map(([name,key]) => (
                <div key={key} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:20, height:2, background:PLAT_COLORS[key], borderRadius:1 }} />
                  <span style={{ fontFamily:MONO, fontSize:9, color:C.ink4 }}>{name}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              {activeTab==='followers' ? (
                <AreaChart data={FOLLOWERS}>
                  <defs>
                    {Object.entries(PLAT_COLORS).map(([k,c]) => (
                      <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c} stopOpacity={0.12}/>
                        <stop offset="95%" stopColor={c} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="date" tick={{ fontFamily:MONO, fontSize:9, fill:C.ink4 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily:MONO, fontSize:9, fill:C.ink4 }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  {[['yt','YouTube'],['ig','Instagram'],['tt','TikTok'],['x','X']].map(([k,name]) => (
                    <Area key={k} type="monotone" dataKey={k} name={name} stroke={PLAT_COLORS[k]} fill={`url(#grad-${k})`} strokeWidth={2} dot={false} />
                  ))}
                </AreaChart>
              ) : (
                <LineChart data={ENGAGEMENT}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="date" tick={{ fontFamily:MONO, fontSize:9, fill:C.ink4 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily:MONO, fontSize:9, fill:C.ink4 }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  {[['yt','YouTube'],['ig','Instagram'],['tt','TikTok'],['x','X']].map(([k,name]) => (
                    <Line key={k} type="monotone" dataKey={k} name={name} stroke={PLAT_COLORS[k]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* Content performance + heatmap */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ background:C.bg1, borderRadius:14, border:`1px solid ${C.borderS}`, padding:'18px 20px', boxShadow:C.shadow }}>
            <div style={{ fontWeight:700, fontSize:13, color:C.ink, marginBottom:16 }}>{zh?'内容类型表现':'Content Type Performance'}</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={CONTENT_PERF} layout="vertical">
                <XAxis type="number" tick={{ fontFamily:MONO, fontSize:8, fill:C.ink4 }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="type" width={76} tick={{ fontFamily:SANS, fontSize:10, fill:C.ink3 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="views" name={zh?'播放量':'Views'} fill={C.accent} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:C.bg1, borderRadius:14, border:`1px solid ${C.borderS}`, padding:'18px 20px', boxShadow:C.shadow }}>
            <div style={{ fontWeight:700, fontSize:13, color:C.ink, marginBottom:8 }}>{zh?'最佳发布时段':'Best Posting Times'}</div>
            <div style={{ fontFamily:MONO, fontSize:8, color:C.ink4, marginBottom:10 }}>{zh?'互动热度评分 1–10':'Engagement heat score 1–10'}</div>
            <div style={{ display:'grid', gridTemplateColumns:'auto repeat(7,1fr)', gap:3 }}>
              <div />
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} style={{ fontFamily:MONO, fontSize:8, color:C.ink4, textAlign:'center' }}>{d}</div>
              ))}
              {HEATMAP_DATA.map(row => (
                <Fragment key={row.hour}>
                  <div style={{ fontFamily:MONO, fontSize:8, color:C.ink4, paddingRight:6, display:'flex', alignItems:'center' }}>{row.hour}</div>
                  {(['mon','tue','wed','thu','fri','sat','sun'] as const).map(day => (
                    <div key={day} style={{ height:22, borderRadius:4, background:`rgba(59,130,246,${0.08+(row[day]/10)*0.72})` }} />
                  ))}
                </Fragment>
              ))}
            </div>
            <div style={{ marginTop:10, fontFamily:MONO, fontSize:9, color:C.green }}>★ {zh?'最佳：周五&周六 9pm':'Best: Fri & Sat 9pm'}</div>
          </div>
        </div>

      </div>
    </div>
  )
}
