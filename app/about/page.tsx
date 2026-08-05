'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"
const BLUE = '#3b82f6'

const BASE_IMG   = 'https://soft-zoom-63098134.figma.site/_assets/v11/5c9f982199fde1d9b85a20e5396f0fa7bacaf9a3.png?w=2560'
const REVEAL_IMG = 'https://soft-zoom-63098134.figma.site/_assets/v11/6be2165e31648955b4e071f4cf2a50bc572b9bfd.png?w=1536'
const SPOTLIGHT_R = 260

// Light-mode ink tokens (for white content sections)
const INK1 = 'rgba(0,0,0,0.82)'
const INK2 = 'rgba(0,0,0,0.55)'
const INK3 = 'rgba(0,0,0,0.38)'
const INK4 = 'rgba(0,0,0,0.22)'
const RULE  = 'rgba(0,0,0,0.07)'

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return { ref, vis }
}

// ── Spotlight Hero ────────────────────────────────────────────────────────────
function SpotlightHero({ lang }: { lang: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const revealRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const reveal = revealRef.current
    if (!canvas || !reveal) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() { canvas!.width = window.innerWidth; canvas!.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const mouse = { x: -999, y: -999 }
    const smooth = { x: -999, y: -999 }
    let rafId: number

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    window.addEventListener('mousemove', onMove)

    function loop() {
      smooth.x += (mouse.x - smooth.x) * 0.1
      smooth.y += (mouse.y - smooth.y) * 0.1
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      const g = ctx!.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, SPOTLIGHT_R)
      g.addColorStop(0,    'rgba(255,255,255,1)')
      g.addColorStop(0.4,  'rgba(255,255,255,1)')
      g.addColorStop(0.6,  'rgba(255,255,255,0.75)')
      g.addColorStop(0.75, 'rgba(255,255,255,0.4)')
      g.addColorStop(0.88, 'rgba(255,255,255,0.12)')
      g.addColorStop(1,    'rgba(255,255,255,0)')
      ctx!.beginPath()
      ctx!.arc(smooth.x, smooth.y, SPOTLIGHT_R, 0, Math.PI * 2)
      ctx!.fillStyle = g
      ctx!.fill()
      const url = canvas!.toDataURL()
      reveal!.style.webkitMaskImage = `url(${url})`
      reveal!.style.maskImage       = `url(${url})`
      reveal!.style.webkitMaskSize  = '100% 100%'
      reveal!.style.maskSize        = '100% 100%'
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', onMove) }
  }, [])

  return (
    <section style={{ position: 'relative', height: '100vh', minHeight: 700, overflow: 'hidden', background: '#E4E4E4' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${BASE_IMG})`, backgroundSize: 'cover', backgroundPosition: '60% center', zIndex: 1 }} />
      <div ref={revealRef} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${REVEAL_IMG})`, backgroundSize: 'cover', backgroundPosition: '60% center', zIndex: 2, pointerEvents: 'none', WebkitMaskImage: 'none', maskImage: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, left: 0, right: 0, textAlign: 'center', zIndex: 3, pointerEvents: 'none', overflow: 'hidden' }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(140px, 22vw, 420px)', color: '#F4F1E8', letterSpacing: '-0.04em', lineHeight: 0.85, display: 'block', opacity: 0.55, animation: 'bigTextUp 1s cubic-bezier(0.16,1,0.3,1) 0.5s both' }}>Chirp</span>
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '160px 40px 80px', pointerEvents: 'none' }}>
        <div style={{ maxWidth: 460, pointerEvents: 'auto', opacity: ready ? 1 : 0, transform: ready ? 'none' : 'translateY(16px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#111111', opacity: 0.45, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>{t('ap.eyebrow', lang as 'en' | 'zh')}</div>
          <h1 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 'clamp(24px, 3vw, 34px)', color: '#111111', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
            {t('ap.h1a', lang as 'en' | 'zh')}{' '}
            <span style={{ opacity: 0.5 }}>{t('ap.h1b', lang as 'en' | 'zh')}</span>
          </h1>
        </div>
        <div style={{ opacity: ready ? 0.35 : 0, transition: 'opacity 1s ease 0.8s', fontFamily: MONO, fontSize: 9, color: '#111111', letterSpacing: '0.12em', textTransform: 'uppercase' }}>SCROLL TO READ ↓</div>
      </div>
      <style>{`
        @keyframes bigTextUp {
          from { transform: translateY(220px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 0.55; }
        }
      `}</style>
    </section>
  )
}

// ── About text section ────────────────────────────────────────────────────────
function AboutSection({ eyebrowKey, h2Key, p1Key, p2Key, lang }: { eyebrowKey: string; h2Key: string; p1Key: string; p2Key?: string; lang: string }) {
  const { ref, vis } = useScrollReveal()
  return (
    <div ref={ref} style={{ maxWidth: 720, margin: '0 auto 96px', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: INK4, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 20 }}>{t(eyebrowKey, lang as 'en' | 'zh')}</div>
      <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(24px, 3vw, 36px)', color: INK1, lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: 24 }}>{t(h2Key, lang as 'en' | 'zh')}</h2>
      <p style={{ fontFamily: SANS, fontSize: 15, color: INK3, lineHeight: 1.9, marginBottom: p2Key ? 18 : 0 }}>{t(p1Key, lang as 'en' | 'zh')}</p>
      {p2Key && <p style={{ fontFamily: SANS, fontSize: 15, color: INK3, lineHeight: 1.9, margin: 0 }}>{t(p2Key, lang as 'en' | 'zh')}</p>}
    </div>
  )
}

// ── Features spec sheet (merged from features page) ───────────────────────────
type Spec  = { label: string; value: string }
type Badge = { text: string; color: string }
interface FeatureDef { id: string; tagKey: string; titleKey: string; descKey: string; mechKey: string; specs: Spec[]; badges: Badge[]; mindsApi: string | null }

const LIVE_B  = { text: 'LIVE',      color: '#16a34a' }
const BETA_B  = { text: 'BETA',      color: '#d97706' }
const MINDS_B = { text: 'MINDS API', color: BLUE }

const FEATURES: FeatureDef[] = [
  { id: 'F-001', tagKey: 'features.f1.tag', titleKey: 'features.f1.title', descKey: 'features.f1.desc', mechKey: 'f1', specs: [{ label: 'PERSISTENCE', value: 'Indefinite' }, { label: 'SCOPE', value: 'Cross-session' }, { label: 'STORAGE', value: 'Minds Tenet API' }, { label: 'RECALL LATENCY', value: '<200 ms' }, { label: 'DATA MODEL', value: 'Structured JSON Tenet' }], badges: [LIVE_B, MINDS_B], mindsApi: 'minds.tenets.create / minds.tenets.get' },
  { id: 'F-002', tagKey: 'features.f2.tag', titleKey: 'features.f2.title', descKey: 'features.f2.desc', mechKey: 'f2', specs: [{ label: 'TRIGGER', value: 'Schedule / event-driven' }, { label: 'MODE', value: 'Background async' }, { label: 'OUTPUTS', value: 'Draft · Report · Digest' }, { label: 'RETRY POLICY', value: '3× exponential backoff' }, { label: 'FRAMEWORK', value: 'Minds Continuity' }], badges: [LIVE_B, MINDS_B], mindsApi: 'minds.continuity.schedule / minds.agent.run' },
  { id: 'F-003', tagKey: 'features.f3.tag', titleKey: 'features.f3.title', descKey: 'features.f3.desc', mechKey: 'f3', specs: [{ label: 'INPUT', value: 'Text / transcript / URL' }, { label: 'OUTPUTS', value: 'YT · IG · TT · X' }, { label: 'ADAPTATION', value: 'Format · tone · length' }, { label: 'STYLE SOURCE', value: 'Minds Tenet (F-001)' }, { label: 'THROUGHPUT', value: '4 variants per call' }], badges: [LIVE_B], mindsApi: null },
  { id: 'F-004', tagKey: 'features.f4.tag', titleKey: 'features.f4.title', descKey: 'features.f4.desc', mechKey: 'f4', specs: [{ label: 'VIEW', value: 'Weekly / monthly grid' }, { label: 'FILL MODE', value: 'Pip auto-schedules drafts' }, { label: 'PLATFORMS', value: 'YT · IG · TT · X · TG' }, { label: 'EDIT', value: 'Drag-to-reschedule (roadmap)' }, { label: 'EXPORT', value: 'JSON / iCal (roadmap)' }], badges: [BETA_B], mindsApi: null },
  { id: 'F-005', tagKey: 'features.f5.tag', titleKey: 'features.f5.title', descKey: 'features.f5.desc', mechKey: 'f5', specs: [{ label: 'PROTOCOL', value: 'Telegram Bot API' }, { label: 'AUTO-REPLY', value: 'FAQ + tone-matched' }, { label: 'DIGEST', value: 'Daily 08:00 local time' }, { label: 'VOICE SOURCE', value: 'Minds Tenet (F-001)' }, { label: 'GROUPS', value: '1 (Free) · Unlimited (Team)' }], badges: [LIVE_B], mindsApi: null },
  { id: 'F-006', tagKey: 'features.f6.tag', titleKey: 'features.f6.title', descKey: 'features.f6.desc', mechKey: 'f6', specs: [{ label: 'METRICS', value: 'Drafts · Scheduled · Replies' }, { label: 'ENGAGEMENT', value: 'Avg across active platforms' }, { label: 'REFRESH', value: 'Real-time (WebSocket)' }, { label: 'HISTORY', value: '30-day rolling window' }, { label: 'EXPORT', value: 'CSV (Pro+)' }], badges: [BETA_B], mindsApi: null },
]

const MECH: Record<string, { en: string; zh: string }> = {
  f1: { en: 'On first onboarding, Pip serialises your style profile — tone, niche, audience demographics, and content pillars — into a Minds Tenet object. Every subsequent inference call retrieves this Tenet and injects it as a system-level context prefix, ensuring style consistency without requiring the user to re-specify preferences.', zh: '在首次引导时，Pip 将用户的风格档案——语气、领域、受众画像和内容支柱——序列化为 Minds Tenet 对象。此后每次推理调用都会检索该 Tenet 并将其注入为系统级上下文前缀，无需用户重复指定偏好即可保持风格一致性。' },
  f2: { en: 'Pip registers scheduled tasks via the Minds Continuity layer. At trigger time, the agent wakes, loads the creator Tenet (F-001), executes the target action (draft · digest · report), and writes results to the dashboard queue. No user interaction is required at any stage of the pipeline.', zh: 'Pip 通过 Minds Continuity 层注册定时任务。在触发时刻，智能体唤醒、加载创作者 Tenet（F-001）、执行目标动作（起草/日报/分析报告），并将结果写入仪表盘队列，全程无需用户介入。' },
  f3: { en: 'A single normalised input is passed to a four-branch inference pipeline. Each branch receives the platform schema (character limit, hashtag convention, tone register) plus the creator Tenet. Outputs are produced in parallel and returned as a structured object keyed by platform identifier.', zh: '单一标准化输入被传入四路并行推理管道。每路分支接收平台 schema（字数上限、话题标签规范、语气寄存器）加上创作者 Tenet，并行输出结果，以平台标识符为键返回结构化对象。' },
  f4: { en: 'Drafts produced by F-003 are tagged with a suggested publish window derived from historical engagement heuristics per platform. Pip fills open calendar slots autonomously; the user retains final approval before any content is marked as scheduled.', zh: 'F-003 生成的草稿会被标注建议发布窗口（基于各平台历史互动启发式规则）。Pip 自主填充空闲日历槽位，用户保留最终审批权，内容确认后才标记为已排期。' },
  f5: { en: "A Telegram webhook is bound to Pip's agent endpoint. Inbound messages are classified (FAQ / general / escalate). FAQ responses are generated using the creator Tenet to match voice. A daily digest is compiled from community activity signals and pushed at a configurable time each morning.", zh: 'Telegram Webhook 绑定至 Pip 智能体端点。入站消息被分类为 FAQ / 通用 / 升级处理。FAQ 回复使用创作者 Tenet 生成以匹配语气。每日日报从社群活跃信号汇总，并在每天可配置时间推送。' },
  f6: { en: 'Dashboard metrics are aggregated from internal event streams: draft creation, schedule confirmations, Telegram reply counts, and workshop usage. Engagement estimates are derived from platform-reported data where API access is granted; otherwise calculated from internal proxies.', zh: '仪表盘指标从内部事件流汇总：草稿创建、排期确认、Telegram 回复数量和工坊使用情况。互动率在获得 API 授权时来自平台上报数据，否则由内部代理指标估算。' },
}

function SpecRow({ label, value }: Spec) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, padding: '6px 0', borderBottom: `1px solid ${RULE}` }}>
      <span style={{ fontFamily: MONO, fontSize: 9, color: INK4, letterSpacing: '0.1em', alignSelf: 'center' }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 10, color: INK2, letterSpacing: '0.04em' }}>{value}</span>
    </div>
  )
}

function BadgeTag({ text, color }: Badge) {
  return <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.12em', color, border: `1px solid ${color}60`, padding: '3px 7px', borderRadius: 2 }}>{text}</span>
}

function FeatureRow({ feat, lang, index }: { feat: FeatureDef; lang: string; index: number }) {
  const { ref, vis } = useScrollReveal()
  const mech = MECH[feat.mechKey]?.[lang as 'en' | 'zh'] ?? MECH[feat.mechKey]?.en ?? ''
  return (
    <div ref={ref} style={{ borderTop: `1px solid ${RULE}`, padding: '52px 0', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(16px)', transition: `opacity 0.55s ${index * 60}ms ease, transform 0.55s ${index * 60}ms ease` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 300px', gap: 40, alignItems: 'start' }}>
        <div style={{ paddingTop: 4 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: INK4, letterSpacing: '0.06em' }}>{feat.id}</div>
          <div style={{ width: 2, height: 48, background: RULE, marginTop: 12 }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: MONO, fontSize: 8, color: BLUE, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{t(feat.tagKey, lang as 'en' | 'zh')}</span>
            <span style={{ width: 1, height: 10, background: 'rgba(0,0,0,0.1)', display: 'inline-block' }} />
            {feat.badges.map(b => <BadgeTag key={b.text} {...b} />)}
          </div>
          <h3 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, color: INK1, marginBottom: 14, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{t(feat.titleKey, lang as 'en' | 'zh')}</h3>
          <p style={{ fontFamily: SANS, fontSize: 13.5, color: INK3, lineHeight: 1.85, marginBottom: 22, maxWidth: 540 }}>{t(feat.descKey, lang as 'en' | 'zh')}</p>
          <div style={{ borderLeft: `2px solid ${RULE}`, paddingLeft: 16 }}>
            <div style={{ fontFamily: MONO, fontSize: 8, color: INK4, letterSpacing: '0.12em', marginBottom: 8 }}>MECHANISM</div>
            <p style={{ fontFamily: MONO, fontSize: 10.5, color: INK3, lineHeight: 1.95, margin: 0 }}>{mech}</p>
          </div>
          {feat.mindsApi && (
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 8, color: INK4, letterSpacing: '0.1em' }}>MINDS API</span>
              <code style={{ fontFamily: MONO, fontSize: 9.5, color: BLUE, background: `${BLUE}10`, padding: '3px 8px', borderRadius: 3, border: `1px solid ${BLUE}20` }}>{feat.mindsApi}</code>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 8, color: INK4, letterSpacing: '0.12em', marginBottom: 12 }}>SPECIFICATION</div>
          {feat.specs.map(s => <SpecRow key={s.label} {...s} />)}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const { lang } = useMingStore()
  const now = new Date()
  const docDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const specHeader = useScrollReveal()

  return (
    <main style={{ background: '#ffffff' }}>
      <Navbar light />

      {/* ① Hero — demo background + spotlight */}
      <SpotlightHero lang={lang} />

      {/* ② About narrative sections */}
      <section style={{ padding: '96px 32px 0', background: '#ffffff' }}>
        <AboutSection eyebrowKey="ap.mission.eyebrow" h2Key="ap.mission.h2" p1Key="ap.mission.p1" p2Key="ap.mission.p2" lang={lang} />
        <div style={{ maxWidth: 720, margin: '0 auto 96px', borderTop: `1px solid ${RULE}` }} />
        <AboutSection eyebrowKey="ap.minds.eyebrow" h2Key="ap.minds.h2" p1Key="ap.minds.p1" p2Key="ap.minds.p2" lang={lang} />
        <div style={{ maxWidth: 720, margin: '-60px auto 96px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/minds-logo.png" alt="Minds by Animoca Brands" style={{ height: 18, opacity: 0.18 }} />
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(0,0,0,0.18)', letterSpacing: '0.12em' }}>MINDS BY ANIMOCA BRANDS</span>
        </div>
        <div style={{ maxWidth: 720, margin: '0 auto 96px', borderTop: `1px solid ${RULE}` }} />
        <AboutSection eyebrowKey="ap.jam.eyebrow" h2Key="ap.jam.h2" p1Key="ap.jam.p1" lang={lang} />
      </section>

      {/* ③ Features spec sheet */}
      <section style={{ background: '#fafaf8', backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)`, backgroundSize: '28px 28px', padding: '80px 64px 120px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Spec document header */}
          <div ref={specHeader.ref} style={{ opacity: specHeader.vis ? 1 : 0, transition: 'opacity 0.7s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 44, paddingBottom: 20, borderBottom: `1px solid ${RULE}` }}>
              <div style={{ display: 'flex', gap: 32 }}>
                {[{ l: 'DOCUMENT', v: 'CHIRP-SPEC-001' }, { l: 'REVISION', v: '1.0' }, { l: 'DATE', v: docDate }, { l: 'STATUS', v: 'DRAFT · PUBLIC' }].map(m => (
                  <div key={m.l}>
                    <div style={{ fontFamily: MONO, fontSize: 8, color: INK4, letterSpacing: '0.1em', marginBottom: 4 }}>{m.l}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: INK2, letterSpacing: '0.06em' }}>{m.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/minds-logo.png" alt="Minds" style={{ height: 14, opacity: 0.2 }} />
                <span style={{ fontFamily: MONO, fontSize: 8, color: INK4, letterSpacing: '0.1em' }}>MINDS BY ANIMOCA BRANDS</span>
              </div>
            </div>

            <div style={{ marginBottom: 48 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: INK4, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
                {t('fp.eyebrow', lang as 'en' | 'zh')} · TECHNICAL SPECIFICATION
              </div>
              <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 'clamp(32px, 4vw, 48px)', color: INK1, lineHeight: 1.08, letterSpacing: '-0.03em' }}>
                {t('fp.h1a', lang as 'en' | 'zh')}{' '}
                <span style={{ fontWeight: 300, color: INK3 }}>{t('fp.h1b', lang as 'en' | 'zh')}</span>
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 300px', gap: 40, marginBottom: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, color: INK4, letterSpacing: '0.1em', paddingTop: 3 }}>ABSTRACT</div>
              <p style={{ fontFamily: SANS, fontSize: 14, color: INK3, lineHeight: 1.9, maxWidth: 620, margin: 0 }}>{t('fp.sub', lang as 'en' | 'zh')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ k: 'TOTAL FEATURES', v: '6' }, { k: 'LIVE', v: '4' }, { k: 'BETA', v: '2' }, { k: 'MINDS API CALLS', v: '2' }].map(s => (
                  <div key={s.k} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, borderBottom: `1px solid ${RULE}`, paddingBottom: 6 }}>
                    <span style={{ fontFamily: MONO, fontSize: 8, color: INK4, letterSpacing: '0.08em' }}>{s.k}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: INK1 }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature rows */}
          {FEATURES.map((feat, i) => <FeatureRow key={feat.id} feat={feat} lang={lang} index={i} />)}

          <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: MONO, fontSize: 8, color: INK4, letterSpacing: '0.1em' }}>END OF SPECIFICATION · CHIRP-SPEC-001</span>
            <span style={{ fontFamily: MONO, fontSize: 8, color: INK4, letterSpacing: '0.08em' }}>POWERED BY MINDS BY ANIMOCA BRANDS</span>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
