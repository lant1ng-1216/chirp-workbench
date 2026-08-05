'use client'
import { useState, Suspense, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import type { CreatorProfile } from '@/lib/brand'

const C = {
  bg:     '#ffffff',
  bg1:    '#f9fafb',
  bg2:    '#f3f4f6',
  ink:    '#111827',
  ink2:   '#374151',
  ink3:   '#6b7280',
  ink4:   '#9ca3af',
  accent: '#3b82f6',
  al:     'rgba(59,130,246,0.08)',
  al2:    'rgba(59,130,246,0.15)',
  border: 'rgba(17,24,39,0.08)',
  border2:'rgba(17,24,39,0.14)',
}
const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

const STICKERS = ['🐦', '📱', '✨', '🎬', '📸', '🎵', '🔁', '💬', '🚀', '🎯', '📊', '⚡']

const AVATAR_SEEDS = ['pip', 'chirp', 'minds', 'creator', 'nova', 'byte', 'flux', 'echo', 'zara', 'kibo']

const AVATAR_STYLES = `
@keyframes fall {
  0%   { transform: translateY(-80px) rotate(var(--r0)); opacity: 0; }
  8%   { opacity: var(--op); }
  92%  { opacity: var(--op); }
  100% { transform: translateY(calc(100vh + 80px)) rotate(var(--r1)); opacity: 0; }
}
`

function FallingAvatars() {
  const avatars = AVATAR_SEEDS.map((seed, i) => {
    const size = 28 + Math.floor(Math.random() * 24)
    const left = 5 + Math.floor(Math.random() * 88)
    const duration = 8 + Math.random() * 10
    const delay = -Math.random() * 14
    const opacity = 0.12 + Math.random() * 0.22
    const r0 = Math.floor(Math.random() * 40 - 20)
    const r1 = Math.floor(Math.random() * 40 - 20)
    return { seed, size, left, duration, delay, opacity, r0, r1, i }
  })

  return (
    <>
      <style>{AVATAR_STYLES}</style>
      {avatars.map(a => (
        <img
          key={a.seed}
          src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${a.seed}`}
          alt=""
          style={{
            position: 'absolute',
            left: `${a.left}%`,
            top: 0,
            width: a.size,
            height: a.size,
            pointerEvents: 'none',
            animation: `fall ${a.duration}s linear ${a.delay}s infinite`,
            '--r0': `${a.r0}deg`,
            '--r1': `${a.r1}deg`,
            '--op': a.opacity,
          } as React.CSSProperties}
        />
      ))}
    </>
  )
}

function FallingStickers() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    type Particle = { x: number; y: number; size: number; speed: number; opacity: number; rotation: number; rotSpeed: number; emoji: string }

    const particles: Particle[] = Array.from({ length: 22 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 14 + Math.random() * 18,
      speed: 0.4 + Math.random() * 0.7,
      opacity: 0.08 + Math.random() * 0.18,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.012,
      emoji: STICKERS[Math.floor(Math.random() * STICKERS.length)],
    }))

    let raf: number
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.font = `${p.size}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(p.emoji, 0, 0)
        ctx.restore()
        p.y += p.speed
        p.rotation += p.rotSpeed
        if (p.y > canvas.height + p.size) {
          p.y = -p.size
          p.x = Math.random() * canvas.width
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

const TONES = ['Casual & friendly', 'Professional', 'Educational', 'Inspirational', 'Witty & humorous', 'Bold & direct']
const TOPICS_DEFAULT = ['productivity', 'tech', 'marketing', 'finance', 'fitness', 'travel', 'food', 'gaming', 'fashion', 'science']

function OnboardingContent() {
  const router = useRouter()
  const { addProject, lang, setLang } = useMingStore()
  const [step, setStep] = useState(0)

  const [name, setName] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('')
  const [contentStyle, setContentStyle] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [customTopic, setCustomTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingText, setLoadingText] = useState('')

  const toggleTopic = (top: string) =>
    setSelectedTopics(prev => prev.includes(top) ? prev.filter(x => x !== top) : [...prev, top])

  const canNext0 = name.trim().length > 0 && niche.trim().length > 0
  const canNext1 = tone.length > 0 && selectedTopics.length > 0

  const activate = async () => {
    setLoading(true); setError('')
    const topics = [...selectedTopics, ...(customTopic.trim() ? [customTopic.trim()] : [])]
    const alias = `chirp-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`
    const loadingSteps = [t('ob.loading.1', lang), t('ob.loading.2', lang), t('ob.loading.3', lang), t('ob.loading.4', lang)]
    let si = 0
    const timer = setInterval(() => { si = Math.min(si + 1, loadingSteps.length - 1); setLoadingText(loadingSteps[si]) }, 900)
    setLoadingText(loadingSteps[0])
    try {
      const res = await fetch('/api/minds/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alias }) })
      clearInterval(timer)
      const data = res.ok ? await res.json() : { alias: null }
      const profile: CreatorProfile = {
        id: `creator-${Date.now()}`, name: name.trim(), description: niche.trim(),
        audience: audience.trim() || 'general audience', tone,
        contentStyle: contentStyle.trim() || 'storytelling, educational',
        topics, platforms: [], knowledgeDocs: [],
        mindsConversationAlias: data.alias ?? alias, mindId: '',
      }
      const projectId = `proj-${Date.now()}`
      addProject({ id: projectId, name: name.trim(), createdAt: new Date().toISOString(), brand: profile, posts: [], threads: [] } as any)
      router.push(`/app/${projectId}`)
    } catch {
      clearInterval(timer)
      setError(t('ob.s2.error', lang))
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${C.border2}`,
    fontFamily: SANS, fontSize: 13, color: C.ink, background: C.bg1, outline: 'none',
    boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
  }

  const STEPS = ['01', '02', '03']

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: SANS, overflow: 'hidden' }}>

      {/* LEFT — branding panel */}
      <div style={{
        width: '38%', flexShrink: 0,
        background: '#13131f',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
        position: 'relative',
      }}>
        {/* subtle grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        <FallingAvatars />
        <FallingStickers />

        <div style={{ position: 'relative', textAlign: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28, cursor: 'pointer' }}>
            <img src="/logo.png" alt="Chirp" style={{ width: 100, height: 100, objectFit: 'contain', marginRight: -30 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em' }}>Chirp</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3, letterSpacing: '0.1em' }}>{t('ob.powered', lang)}</div>
            </div>
          </Link>

          <p style={{ fontFamily: SANS, fontWeight: 400, fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.8, maxWidth: 240, margin: '0 auto 40px' }}>
            {t('hero.sub', lang)}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {['Persistent memory across sessions', 'Four-platform content in one click', 'Autonomous — works while you sleep'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="8" height="8" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                </div>
                <span style={{ fontFamily: SANS, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* bottom copy */}
        <div style={{ position: 'absolute', bottom: 28, fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.08em' }}>
          {t('ob.footer', lang)}
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div style={{
        flex: 1, background: C.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px',
        overflowY: 'auto',
        position: 'relative',
      }}>

        {/* lang toggle */}
        <div style={{ position: 'absolute', top: 20, right: 24 }}>
          <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} style={{
            fontFamily: MONO, fontSize: 10, padding: '5px 10px', borderRadius: 6,
            background: 'rgba(17,24,39,0.05)', border: '1px solid rgba(17,24,39,0.12)',
            color: C.ink3, cursor: 'pointer', letterSpacing: '0.06em',
          }}>{lang === 'en' ? 'EN | 中' : '中 | EN'}</button>
        </div>

        <div style={{ width: '100%', maxWidth: 460 }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 32 }}>
            {STEPS.map((num, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: MONO, fontSize: 9,
                  background: i === step ? C.accent : i < step ? C.al2 : C.bg2,
                  color: i === step ? '#fff' : i < step ? C.accent : C.ink4,
                }}>{i < step ? '✓' : num}</div>
                {i < STEPS.length - 1 && <div style={{ width: 24, height: 1, background: i < step ? C.accent : C.border2 }} />}
              </div>
            ))}
          </div>

          {/* STEP 0 */}
          {step === 0 && (
            <div>
              <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, color: C.ink, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{t('ob.s0.title', lang)}</h2>
              <p style={{ fontFamily: SANS, fontSize: 13, color: C.ink3, margin: '0 0 24px', lineHeight: 1.7 }}>{t('ob.s0.sub', lang)}</p>
              {[
                { labelKey: 'ob.s0.name.label',     value: name,         set: setName,         ph: 'e.g. Alex Chen', required: true },
                { labelKey: 'ob.s0.niche.label',    value: niche,        set: setNiche,        ph: t('ob.s0.niche.ph', lang), required: true },
                { labelKey: 'ob.s0.audience.label', value: audience,     set: setAudience,     ph: t('ob.s0.audience.ph', lang), required: false },
                { labelKey: 'ob.s0.yt.label',       value: youtubeUrl,   set: setYoutubeUrl,   ph: 'https://youtube.com/@yourchannel', required: false },
                { labelKey: 'ob.s0.ig.label',       value: instagramUrl, set: setInstagramUrl, ph: 'https://instagram.com/yourhandle', required: false },
              ].map(field => (
                <div key={field.labelKey} style={{ marginBottom: 14 }}>
                  <label style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, display: 'block', marginBottom: 5, letterSpacing: '0.06em' }}>
                    {t(field.labelKey, lang)}{field.required && <span style={{ color: C.accent }}> *</span>}
                  </label>
                  <input value={field.value} onChange={e => field.set(e.target.value)} placeholder={field.ph} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border2)}
                  />
                </div>
              ))}
              <button onClick={() => canNext0 && setStep(1)} disabled={!canNext0} style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none', marginTop: 8,
                background: canNext0 ? C.accent : C.bg2, color: canNext0 ? '#fff' : C.ink4,
                fontFamily: SANS, fontWeight: 600, fontSize: 14, cursor: canNext0 ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
              }}>{t('ob.continue', lang)}</button>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, color: C.ink, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{t('ob.s1.title', lang)}</h2>
              <p style={{ fontFamily: SANS, fontSize: 13, color: C.ink3, margin: '0 0 24px', lineHeight: 1.7 }}>{t('ob.s1.sub', lang)}</p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, display: 'block', marginBottom: 10, letterSpacing: '0.06em' }}>{t('ob.s1.tone.label', lang)} <span style={{ color: C.accent }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TONES.map(tp => (
                    <button key={tp} onClick={() => setTone(tp)} style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: `1.5px solid ${tone === tp ? C.accent : C.border2}`,
                      background: tone === tp ? C.al : '#fff', color: tone === tp ? C.accent : C.ink3,
                      fontFamily: SANS, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                    }}>{tp}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, display: 'block', marginBottom: 10, letterSpacing: '0.06em' }}>{t('ob.s1.topics.label', lang)} <span style={{ color: C.accent }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {TOPICS_DEFAULT.map(tp => (
                    <button key={tp} onClick={() => toggleTopic(tp)} style={{
                      padding: '6px 12px', borderRadius: 20,
                      border: `1.5px solid ${selectedTopics.includes(tp) ? C.accent : C.border2}`,
                      background: selectedTopics.includes(tp) ? C.al : '#fff', color: selectedTopics.includes(tp) ? C.accent : C.ink3,
                      fontFamily: SANS, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                    }}>{tp}</button>
                  ))}
                </div>
                <input value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder={t('ob.s1.custom.ph', lang)}
                  style={{ ...inputStyle, padding: '8px 12px', fontSize: 12, borderRadius: 8 }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border2)}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>{t('ob.s1.style.label', lang)}</label>
                <input value={contentStyle} onChange={e => setContentStyle(e.target.value)} placeholder={t('ob.s1.style.ph', lang)} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border2)}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(0)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${C.border2}`, background: '#fff', color: C.ink3, fontFamily: SANS, fontSize: 13, cursor: 'pointer' }}>{t('ob.back', lang)}</button>
                <button onClick={() => canNext1 && setStep(2)} disabled={!canNext1} style={{
                  flex: 2, padding: '11px', borderRadius: 10, border: 'none',
                  background: canNext1 ? C.accent : C.bg2, color: canNext1 ? '#fff' : C.ink4,
                  fontFamily: SANS, fontWeight: 600, fontSize: 14, cursor: canNext1 ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
                }}>{t('ob.continue', lang)}</button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, color: C.ink, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{t('ob.s2.title', lang)}</h2>
              <p style={{ fontFamily: SANS, fontSize: 13, color: C.ink3, margin: '0 0 24px', lineHeight: 1.7 }}>{t('ob.s2.sub', lang)}</p>
              <div style={{ borderRadius: 10, border: `1px solid ${C.border2}`, background: C.bg1, padding: '14px 16px', marginBottom: 20 }}>
                {[
                  { labelKey: 'ob.s2.creator', value: name },
                  { labelKey: 'ob.s2.niche',   value: niche },
                  { labelKey: 'ob.s2.tone',    value: tone },
                  { labelKey: 'ob.s2.topics',  value: [...selectedTopics, ...(customTopic ? [customTopic] : [])].join(', ') || '—' },
                ].map(row => (
                  <div key={row.labelKey} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, minWidth: 56, flexShrink: 0, paddingTop: 3 }}>{t(row.labelKey, lang)}</span>
                    <span style={{ fontFamily: SANS, fontSize: 13, color: C.ink2 }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 9, background: C.al, border: `1px solid ${C.al2}`, marginBottom: 20 }}>
                <p style={{ fontFamily: SANS, fontSize: 12, color: C.ink2, lineHeight: 1.7, margin: 0 }}>{t('ob.s2.notice', lang)}</p>
              </div>
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 16 }}>
                  <p style={{ fontFamily: SANS, fontSize: 12, color: '#dc2626', margin: 0, lineHeight: 1.7 }}>{error}</p>
                </div>
              )}
              {loading && (
                <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, border: `2.5px solid ${C.al2}`, borderTopColor: C.accent, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                  <div style={{ fontFamily: MONO, fontSize: 10, color: C.ink4 }}>{loadingText}</div>
                </div>
              )}
              <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
              <div style={{ display: 'flex', gap: 10 }}>
                {!loading && <button onClick={() => setStep(1)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${C.border2}`, background: '#fff', color: C.ink3, fontFamily: SANS, fontSize: 13, cursor: 'pointer' }}>{t('ob.back', lang)}</button>}
                <button onClick={activate} disabled={loading} style={{
                  flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                  background: loading ? C.bg2 : C.accent, color: loading ? C.ink4 : '#fff',
                  fontFamily: SANS, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(59,130,246,0.35)', transition: 'all 0.15s',
                }}>{loading ? t('ob.s2.activating', lang) : t('ob.s2.activate', lang)}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  )
}
