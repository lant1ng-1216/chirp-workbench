'use client'
import Link from 'next/link'

const C = {
  ink:    '#1a1916',
  ink4:   '#c8c6c0',
  accent: '#1c3a2e',
  border: 'rgba(255,255,255,0.07)',
}
const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"

export default function Footer() {
  return (
    <footer style={{ background: C.ink, padding: '64px 32px 44px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
              <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.02em' }}>鸣</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.08em' }}>Ming</span>
            </div>
            <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: 'rgba(255,255,255,0.28)', lineHeight: 1.95, maxWidth: 240, margin: 0 }}>
              AI 驱动的社交媒体营销 Agent，帮助独立开发者和出海团队实现全平台内容自动化。
            </p>
          </div>
          {/* Link cols */}
          {[
            { title: '产品', links: ['功能特性', '支持平台', '使用流程', '更新日志'] },
            { title: '资源', links: ['使用文档', '视频教程', '案例研究', '博客'] },
            { title: '公司', links: ['关于我们', '联系我们', '隐私政策', '服务条款'] },
          ].map(col => (
            <div key={col.title}>
              <h4 style={{ fontFamily: MONO, fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, margin: '0 0 18px 0' }}>{col.title}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                  >{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.16)', letterSpacing: '0.06em' }}>© 2026 Ming · 鸣营销 Agent</span>
          <Link href="/onboarding" style={{ textDecoration: 'none' }}>
            <button style={{
              fontFamily: SERIF, padding: '8px 20px', borderRadius: 8,
              fontSize: 13, letterSpacing: '0.03em',
              background: 'rgba(255,255,255,0.95)', color: C.ink,
              border: 'none', cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >免费开始 →</button>
          </Link>
        </div>
      </div>
    </footer>
  )
}
