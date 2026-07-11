'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import type { BrandProfile, Project, Thread } from '@/lib/brand'
import Image from 'next/image'
import Link from 'next/link'

/* ── ELN-style warm tokens (matches Lab page) ── */
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

const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"
const SANS  = "'Noto Sans SC', 'PingFang SC', sans-serif"

const FLOW = [
  { num: '01', label: '输入产品链接', sub: '30 秒品牌学习' },
  { num: '02', label: '投资人评审',   sub: '8 位顶级视角' },
  { num: '03', label: '选择营销方向', sub: 'Ming 综合诊断' },
  { num: '04', label: '开始营销',     sub: '12 个平台覆盖' },
]

function OnboardingContent() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const addProject  = useMingStore(s => s.addProject)

  const [url,        setUrl]        = useState(searchParams.get('url') || '')
  const [step,       setStep]       = useState<'input' | 'learning' | 'preview'>('input')
  const [progress,   setProgress]   = useState(0)
  const [statusText, setStatusText] = useState('')
  const [profile,    setProfile]    = useState<BrandProfile | null>(null)
  const [error,      setError]      = useState('')

  const startLearning = async () => {
    if (!url.trim()) return
    setStep('learning'); setError('')
    const steps = [
      { text: '正在读取官网内容…', pct: 20 },
      { text: '分析品牌信息结构…', pct: 40 },
      { text: '提取品牌调性与受众画像…', pct: 60 },
      { text: '生成品牌知识库文档…', pct: 80 },
      { text: '完成品牌档案构建…', pct: 95 },
    ]
    let si = 0
    const iv = setInterval(() => {
      if (si < steps.length) { setStatusText(steps[si].text); setProgress(steps[si].pct); si++ }
    }, 800)
    try {
      const res = await fetch('/api/brand-learn', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      clearInterval(iv)
      if (!res.ok) throw new Error('学习失败，请检查 URL 后重试')
      const data = await res.json()
      setProgress(100); setStatusText('品牌学习完成')
      setProfile(data.profile)
      setTimeout(() => setStep('preview'), 700)
    } catch (e) {
      clearInterval(iv)
      setError(e instanceof Error ? e.message : '网络错误，请重试')
      setStep('input'); setProgress(0)
    }
  }

  const handleConfirm = () => {
    if (!profile) return
    const projectId = `proj-${Date.now()}`
    const threadId  = `thread-${Date.now()}`
    const thread: Thread = {
      id: threadId, projectId, title: '私聊 · 鸣', messages: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    const project: Project = {
      id: projectId, brand: { ...profile, id: projectId },
      threads: [thread], posts: [], createdAt: new Date().toISOString(),
    }
    addProject(project)
    router.push(`/lab/${projectId}`)
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.ink,
      display: 'flex', fontFamily: SANS, position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes obUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes obFade { from{opacity:0} to{opacity:1} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes obSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes obPulse{ 0%,100%{opacity:1} 50%{opacity:.25} }
        /* paper texture */
        .ob-paper::before {
          content:''; position:absolute; inset:0; pointer-events:none;
          background-image: repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(26,25,22,0.03) 27px,rgba(26,25,22,0.03) 28px);
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="ob-paper" style={{
        width: 320, flexShrink: 0, position: 'relative',
        background: C.bg2, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', padding: '40px 32px',
      }}>
        {/* Logo / back */}
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0, marginBottom: 52, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 120, height: 120, position: 'relative', flexShrink: 0, marginRight: -28 }}>
            <Image src="/logo.png" alt="Ming" fill style={{ objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: C.accent, letterSpacing: '0.04em' }}>鸣</span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, marginLeft: 6, letterSpacing: '0.07em' }}>Ming</span>
        </Link>

        {/* Flow steps */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>使用流程</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FLOW.map((f, i) => {
              const isActive = i === 0
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 0',
                  borderTop: i === 0 ? `1px solid ${C.border}` : 'none',
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: isActive ? C.accent : C.ink4, fontWeight: 700, width: 22, flexShrink: 0, letterSpacing: '-0.3px' }}>{f.num}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? C.ink : C.ink3 }}>{f.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginTop: 2, letterSpacing: '0.05em' }}>{f.sub}</div>
                  </div>
                  {isActive && <div style={{ width: 6, height: 6, borderRadius: 3, background: '#4a9e6a', flexShrink: 0 }} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom note */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, lineHeight: 1.8, letterSpacing: '0.04em' }}>
            免费开始 · 无需注册<br />数据仅用于生成品牌档案
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 64px', position: 'relative' }}>
        {/* subtle paper lines */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(26,25,22,0.025) 27px,rgba(26,25,22,0.025) 28px)' }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

          {/* ── INPUT ── */}
          {step === 'input' && (
            <div style={{ animation: 'obUp 0.5s both' }}>
              {/* Heading */}
              <div style={{ marginBottom: 36 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: 14 }}>第一步</div>
                <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(26px,3vw,34px)', fontWeight: 600, color: C.ink, lineHeight: 1.3, letterSpacing: '0.01em', marginBottom: 10 }}>
                  告诉鸣你的产品
                </h1>
                <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 14, color: C.ink3, lineHeight: 1.9 }}>
                  输入产品官网链接，AI 自动学习品牌基因，<br />30 秒建立专属营销知识库。
                </p>
              </div>

              {/* Input card */}
              <div style={{
                background: '#fff', borderRadius: 16,
                border: `1px solid ${C.border2}`,
                padding: '24px', boxShadow: C.sfloat,
                marginBottom: 16,
              }}>
                <label style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, display: 'block', marginBottom: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
                  产品官网 URL
                </label>
                <input
                  type="url" value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && startLearning()}
                  placeholder="https://your-product.com"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 9,
                    border: `1.5px solid ${C.border2}`, fontSize: 14,
                    fontFamily: SANS, background: C.bg,
                    color: C.ink, outline: 'none',
                    transition: 'border-color 0.18s',
                    boxSizing: 'border-box' as const, marginBottom: 14,
                  }}
                  onFocus={e => (e.target.style.borderColor = `rgba(28,58,46,0.45)`)}
                  onBlur={e => (e.target.style.borderColor = C.border2)}
                />
                {error && <p style={{ fontFamily: SANS, fontSize: 12, color: '#c0392b', marginBottom: 10 }}>{error}</p>}
                <button
                  onClick={startLearning} disabled={!url.trim()}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 10,
                    background: url.trim() ? C.accent : C.bg3,
                    color: url.trim() ? '#fff' : C.ink4,
                    border: 'none', cursor: url.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: SERIF, fontSize: 15, letterSpacing: '0.03em',
                    boxShadow: url.trim() ? '0 4px 14px rgba(28,58,46,0.2)' : 'none',
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { if (url.trim()) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  开始品牌学习 →
                </button>
              </div>

              {/* Quick demo links */}
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
                <p style={{ fontFamily: MONO, fontSize: 10, color: C.ink2, letterSpacing: '0.08em', marginBottom: 12, fontWeight: 600 }}>
                  或者快速体验这些品牌 →
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' as const }}>
                  {[
                    { label: 'ELN World', url: 'https://elnworld.xyz/' },
                    { label: 'Notion', url: 'https://notion.so' },
                    { label: 'Linear', url: 'https://linear.app' },
                  ].map(d => (
                    <button key={d.label} onClick={() => setUrl(d.url)}
                      style={{
                        padding: '7px 18px', borderRadius: 99, cursor: 'pointer',
                        border: `1.5px solid ${url === d.url ? C.accent : 'rgba(28,58,46,0.3)'}`,
                        background: url === d.url ? C.accent : C.al,
                        color: url === d.url ? '#fff' : C.accent,
                        fontFamily: MONO, fontSize: 12, letterSpacing: '0.05em',
                        fontWeight: 600, transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (url !== d.url) { e.currentTarget.style.background = C.al2; e.currentTarget.style.borderColor = C.accent }}}
                      onMouseLeave={e => { if (url !== d.url) { e.currentTarget.style.background = C.al; e.currentTarget.style.borderColor = 'rgba(28,58,46,0.3)' }}}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <p style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, textAlign: 'center', letterSpacing: '0.07em', marginTop: 14 }}>
                支持任意网站 · 数据仅用于生成品牌档案
              </p>
            </div>
          )}

          {/* ── LEARNING ── */}
          {step === 'learning' && (
            <div style={{ textAlign: 'center', animation: 'obFade 0.4s both' }}>
              {/* Spinner icon */}
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: C.gl, border: `1px solid rgba(122,96,32,0.2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, margin: '0 auto 28px',
                animation: 'floatY 2s ease-in-out infinite',
              }}>🧠</div>

              <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.ink, marginBottom: 8, letterSpacing: '0.01em' }}>
                鸣正在学习你的品牌
              </h2>
              <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 14, color: C.ink3, marginBottom: 44, minHeight: 22 }}>
                {statusText || '初始化中…'}
              </p>

              {/* Progress */}
              <div style={{ height: 2, background: C.bg3, borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', borderRadius: 99, background: C.accent, width: `${progress}%`, transition: 'width 0.65s ease' }} />
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, letterSpacing: '0.06em' }}>{progress}%</span>
            </div>
          )}

          {/* ── PREVIEW ── */}
          {step === 'preview' && profile && (
            <div style={{ animation: 'obUp 0.5s both' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: 14 }}>品牌档案已生成</div>
                <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 6, letterSpacing: '0.01em' }}>
                  确认品牌信息
                </h2>
                <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 14, color: C.ink3 }}>确认无误后进入投资人评审</p>
              </div>

              {/* Profile card */}
              <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border2}`, padding: '22px', marginBottom: 14, boxShadow: C.sfloat }}>
                {/* Brand header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: profile.colors[0] || C.ming, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                    {profile.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 15, color: C.ink }}>{profile.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginTop: 2, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.industry}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {profile.colors.slice(0, 4).map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c, border: `1.5px solid ${C.border2}` }} />)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <InfoRow label="品牌调性" value={profile.tone} />
                  <InfoRow label="目标受众" value={profile.audience} />
                  <InfoRow label="核心价值" value={profile.values.join(' · ')} />
                </div>

                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginBottom: 8, letterSpacing: '0.1em' }}>知识库 · {profile.knowledgeDocs.length} 份文档</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {profile.knowledgeDocs.map(doc => (
                      <span key={doc.id} style={{ fontFamily: MONO, fontSize: 9, padding: '3px 9px', borderRadius: 99, background: C.al, color: C.accent, border: `1px solid ${C.al2}`, letterSpacing: '0.02em' }}>
                        {doc.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                style={{
                  width: '100%', padding: '14px', borderRadius: 11, border: 'none',
                  background: C.accent, color: '#fff', cursor: 'pointer',
                  fontFamily: SERIF, fontSize: 15, letterSpacing: '0.03em',
                  boxShadow: '0 4px 14px rgba(28,58,46,0.2)',
                  transition: 'all 0.18s', marginBottom: 10,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                确认，进入投资人评审 →
              </button>
              <button
                onClick={() => setStep('input')}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  background: 'transparent', color: C.ink4,
                  border: 'none', cursor: 'pointer',
                  fontFamily: SERIF, fontWeight: 300, fontSize: 13,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = C.ink3)}
                onMouseLeave={e => (e.currentTarget.style.color = C.ink4)}
              >← 重新输入</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, minWidth: 52, flexShrink: 0, paddingTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{label}</span>
      <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 13, color: C.ink2, lineHeight: 1.65 }}>{value}</span>
    </div>
  )
}

export default function OnboardingPage() {
  return <Suspense><OnboardingContent /></Suspense>
}
