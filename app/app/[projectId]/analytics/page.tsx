'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import { PLATFORMS } from '@/lib/brand'

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

const PERIOD_DATA = {
  '7天': {
    bars: [42, 58, 71, 55, 83, 67, 90],
    days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    metrics: { views: '63,780', likes: '4,069', fans: '+456', rate: '6.4%' },
    changes: ['+12%', '+18%', '+23%', '+0.8%'],
    platforms: [
      { platform: 'xiaohongshu', views: 12480, likes: 986, comments: 124, growth: '+12%' },
      { platform: 'douyin',      views: 38200, likes: 2340, comments: 312, growth: '+24%' },
      { platform: 'weibo',       views: 8900,  likes: 432,  comments: 67,  growth: '+8%' },
      { platform: 'twitter',     views: 4200,  likes: 187,  comments: 43,  growth: '+5%' },
    ],
    report: { posts: 12, best: '抖音', rate: '8.2%', peak: '周四', next: '重点发力抖音短视频，建议周四晚 20:00 发布，话题可结合品牌起源故事切入。' },
  },
  '30天': {
    bars: [38, 52, 61, 70, 65, 80, 74, 88, 76, 90, 83, 95, 79, 88, 92, 85, 76, 88, 94, 98, 82, 90, 96, 88, 94, 100, 92, 87, 95, 98],
    days: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
    metrics: { views: '248,320', likes: '15,480', fans: '+1,820', rate: '6.2%' },
    changes: ['+19%', '+22%', '+31%', '+1.1%'],
    platforms: [
      { platform: 'xiaohongshu', views: 48600, likes: 3820, comments: 512, growth: '+19%' },
      { platform: 'douyin',      views: 142000, likes: 8940, comments: 1240, growth: '+31%' },
      { platform: 'weibo',       views: 38200, likes: 1820, comments: 287,  growth: '+14%' },
      { platform: 'twitter',     views: 19520, likes: 900,  comments: 198,  growth: '+8%' },
    ],
    report: { posts: 48, best: '抖音', rate: '7.9%', peak: '周四/周五', next: '本月抖音增粉最显著，建议下月继续保持视频频次，小红书可增加互动型内容比例。' },
  },
  '本月': {
    bars: [55, 62, 70, 68, 75, 80, 88, 76, 82, 90, 85, 94, 78, 86, 92, 88, 76, 84, 96, 90, 82, 88, 94, 100, 88, 92, 96, 90, 94, 98],
    days: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
    metrics: { views: '201,540', likes: '12,760', fans: '+1,340', rate: '6.3%' },
    changes: ['+15%', '+20%', '+28%', '+0.9%'],
    platforms: [
      { platform: 'xiaohongshu', views: 38400, likes: 3020, comments: 410, growth: '+15%' },
      { platform: 'douyin',      views: 118000, likes: 7340, comments: 980, growth: '+28%' },
      { platform: 'weibo',       views: 31200, likes: 1480, comments: 230, growth: '+11%' },
      { platform: 'twitter',     views: 13940, likes: 920,  comments: 160, growth: '+6%' },
    ],
    report: { posts: 38, best: '抖音', rate: '8.0%', peak: '周四/周日', next: '本月整体数据稳健，建议聚焦爆款内容复盘，抖音视频可做二次剪辑投放小红书。' },
  },
}

type Period = keyof typeof PERIOD_DATA

export default function AnalyticsPage() {
  const params    = useParams()
  const router    = useRouter()
  const projectId = params.projectId as string
  const project   = useMingStore(s => s.projects.find(p => p.id === projectId))

  const [period, setPeriod] = useState<Period>('7天')
  const d = PERIOD_DATA[period]
  const allP = [...PLATFORMS.domestic, ...PLATFORMS.international]
  const maxViews = Math.max(...d.platforms.map(p => p.views))
  const maxBar   = Math.max(...d.bars)

  const METRIC_LABELS = ['总曝光量', '总互动量', '粉丝净增', '平均互动率']
  const METRIC_VALS   = [d.metrics.views, d.metrics.likes, d.metrics.fans, d.metrics.rate]
  const METRIC_ICONS  = ['曝', '互', '粉', '率']

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, fontFamily: SANS }}>
      <style>{`
        @keyframes barGrow { from { height: 0 } to { height: var(--h) } }
        .bar-col { animation: barGrow 0.5s ease forwards; }
      `}</style>

      {/* Header */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${C.border}`, background: C.bg, position: 'sticky', top: 0, zIndex: 10, gap: 14 }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.ink, margin: 0 }}>数据分析</h1>
        <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.08em' }}>{project?.brand.name}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['7天', '30天', '本月'] as Period[]).map(t => (
            <button key={t} onClick={() => setPeriod(t)} style={{
              padding: '5px 13px', borderRadius: 7,
              border: `1px solid ${period === t ? C.accent : C.border}`,
              background: period === t ? C.accent : 'transparent',
              color: period === t ? '#fff' : C.ink3,
              fontFamily: MONO, fontSize: 10, cursor: 'pointer', letterSpacing: '0.04em',
              transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 20px 40px', maxWidth: 860 }}>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {METRIC_LABELS.map((label, i) => (
            <div key={label} style={{ padding: '16px 16px 14px', borderRadius: 12, background: '#fff', border: `1px solid ${C.border2}`, boxShadow: C.shadow }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: C.al, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 11, color: C.accent, fontWeight: 600, marginBottom: 10 }}>
                {METRIC_ICONS[i]}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.ink, letterSpacing: '-0.5px', marginBottom: 2 }}>{METRIC_VALS[i]}</div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: C.ink4, marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.green }}>{d.changes[i]} 较上期</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ padding: '18px 20px', background: '#fff', borderRadius: 12, border: `1px solid ${C.border2}`, boxShadow: C.shadow, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.ink }}>曝光趋势</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.08em' }}>近{period}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: period === '7天' ? 10 : 3, height: 100, overflowX: period !== '7天' ? 'auto' : 'visible' }}>
            {d.bars.map((h, i) => (
              <div key={i} style={{ flex: period === '7天' ? '1 1 0' : '0 0 22px', width: period !== '7天' ? 22 : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: period === '7天' ? 0 : 22 }}>
                <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4 }}>{Math.round(h * maxBar / 100)}</div>
                <div className="bar-col" style={{
                  ['--h' as string]: `${(h / maxBar) * 76}px`,
                  width: '100%', borderRadius: '3px 3px 0 0',
                  background: i === d.bars.length - 1 ? C.accent : C.al2,
                  height: `${(h / maxBar) * 76}px`,
                }} />
                {period === '7天' && <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4 }}>{d.days[i]}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Platform breakdown */}
        <div style={{ padding: '18px 20px', background: '#fff', borderRadius: 12, border: `1px solid ${C.border2}`, boxShadow: C.shadow, marginBottom: 16 }}>
          <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 14 }}>平台表现对比</div>
          {d.platforms.map(metric => {
            const pl = allP.find(p => p.id === metric.platform)
            return (
              <div key={metric.platform} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{pl?.icon}</div>
                <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: C.ink, minWidth: 72 }}>{pl?.name}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 5, background: C.bg3, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: pl?.color || C.accent, width: `${(metric.views / maxViews) * 100}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.ink3, minWidth: 54, textAlign: 'right' }}>{metric.views.toLocaleString()}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.green, minWidth: 36, textAlign: 'right' }}>{metric.growth}</div>
              </div>
            )
          })}
        </div>

        {/* Real posts count */}
        {project && project.posts.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {['draft', 'scheduled', 'published'].map(status => {
              const count = project.posts.filter(p => p.status === status).length
              const label = status === 'draft' ? '草稿' : status === 'scheduled' ? '已排期' : '已发布'
              const color = status === 'draft' ? C.ink4 : status === 'scheduled' ? C.gold : C.green
              return (
                <div key={status} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#fff', border: `1px solid ${C.border2}`, boxShadow: C.shadow, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color }}>{count}</div>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: C.ink3 }}>{label}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* AI report */}
        <div style={{ padding: '18px 20px', background: C.gl, borderRadius: 12, border: `1px solid rgba(122,96,32,0.18)`, boxShadow: C.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 11, color: '#fff', fontWeight: 600 }}>鸣</div>
            <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.ink }}>AI 分析摘要 · {period}</span>
          </div>
          <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: C.ink2, lineHeight: 1.9, margin: '0 0 8px 0' }}>
            {period} 内 <strong style={{ fontWeight: 600 }}>{project?.brand.name || '你的品牌'}</strong> 共发布 <strong style={{ fontWeight: 600 }}>{d.report.posts} 条</strong>内容。
            {d.report.best}互动率最高达 <strong style={{ fontWeight: 600 }}>{d.report.rate}</strong>，单条最高曝光出现在{d.report.peak}。
          </p>
          <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: C.ink2, lineHeight: 1.9, margin: '0 0 14px 0' }}>
            <strong style={{ fontWeight: 600, color: C.accent }}>建议：</strong>{d.report.next}
          </p>
          <button onClick={() => router.push(`/app/${projectId}?prompt=帮我生成${period}数据详细分析报告`)} style={{
            padding: '7px 16px', borderRadius: 8, border: `1px solid ${C.accent}`,
            background: C.accent, color: '#fff', fontFamily: SERIF, fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            让鸣生成完整周报 →
          </button>
        </div>

      </div>
    </div>
  )
}
