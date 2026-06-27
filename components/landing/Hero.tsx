'use client'
import Link from 'next/link'
import ScrollReveal from './ScrollReveal'
import VideoBackground from './VideoBackground'

const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"

export default function Hero() {
  return (
    <section style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', padding: '100px 32px 80px',
      background: '#080810',
    }}>
      {/* Video lives here only */}
      <VideoBackground />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(8,8,16,0.08) 0%, rgba(8,8,16,0.02) 30%, rgba(8,8,16,0.32) 72%, rgba(8,8,16,0.97) 100%)',
      }} />

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 860 }}>

        <ScrollReveal delay={0}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 40,
            fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.38)',
            border: '1px solid rgba(255,255,255,0.1)', padding: '6px 16px',
            borderRadius: 99, background: 'rgba(8,8,16,0.3)', backdropFilter: 'blur(8px)',
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80', display: 'inline-block', flexShrink: 0 }} />
            专为独立开发者 &amp; 出海团队打造
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <h1 style={{
            fontFamily: SERIF,
            fontSize: 'clamp(44px, 7vw, 80px)',
            fontWeight: 600, lineHeight: 1.1,
            letterSpacing: '-0.01em',
            color: 'rgba(255,255,255,0.95)',
            marginBottom: 24,
          }}>
            你的产品，<br />
            <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.28)' }}>值得被全世界看见</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={160}>
          <p style={{
            fontFamily: SERIF, fontWeight: 300,
            fontSize: 17, color: 'rgba(255,255,255,0.4)',
            lineHeight: 2, maxWidth: 500, margin: '0 auto 52px',
            letterSpacing: '0.01em',
          }}>
            粘贴产品链接，鸣自动学习你的品牌基因，<br />
            在 12 个主流平台同步生成、排期、发布内容。
          </p>
        </ScrollReveal>

        <ScrollReveal delay={240}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/onboarding" style={{ textDecoration: 'none' }}>
              <button style={{
                fontFamily: SERIF, padding: '14px 36px', borderRadius: 11,
                background: 'rgba(255,255,255,0.97)', color: '#080810',
                border: 'none', cursor: 'pointer',
                fontSize: 15, letterSpacing: '0.03em',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                transition: 'opacity 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >输入产品链接 →</button>
            </Link>
            <button style={{
              fontFamily: SERIF, fontWeight: 300,
              padding: '13px 28px', borderRadius: 11,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              fontSize: 14, letterSpacing: '0.02em',
              backdropFilter: 'blur(8px)',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >查看演示</button>
          </div>

          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            {['免费开始', '无需注册', '30 秒建立品牌档案'].map((t, i) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {i > 0 && <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.12)', display: 'inline-block' }} />}
                <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>{t}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* Scroll hint */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        opacity: 0.2, animation: 'floatY 2.5s ease-in-out infinite', zIndex: 2,
      }}>
        <div style={{ fontFamily: MONO, fontSize: 8, color: '#fff', letterSpacing: '0.2em' }}>SCROLL</div>
        <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, #fff, transparent)' }} />
      </div>
    </section>
  )
}
