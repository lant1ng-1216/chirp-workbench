'use client'
import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import type { RepurposedContent } from '@/lib/store'
import type { PlatformId } from '@/lib/brand'

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
  shadow: '0 1px 3px rgba(17,24,39,0.06),0 3px 10px rgba(17,24,39,0.04)',
}
const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

type Lang = 'en' | 'zh'

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()

const PLATFORMS = (lang: Lang) => [
  { id: 'youtube',   label: 'YouTube',   desc: t('workshop.p.yt.desc', lang) },
  { id: 'instagram', label: 'Instagram', desc: t('workshop.p.ig.desc', lang) },
  { id: 'tiktok',    label: 'TikTok',    desc: t('workshop.p.tt.desc', lang) },
  { id: 'twitter',   label: 'X',         desc: t('workshop.p.x.desc', lang) },
]

function CopyButton({ text, lang }: { text: string; lang: Lang }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text) } catch {
      const el = document.createElement('textarea'); el.value = text
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} style={{
      padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: MONO,
      border: `1px solid ${copied ? C.al2 : C.border2}`,
      background: copied ? C.al : '#fff',
      color: copied ? C.accent : C.ink3,
      transition: 'all 0.15s',
    }}>
      {copied ? `✓ ${t('workshop.copied', lang)}` : t('workshop.copy', lang)}
    </button>
  )
}

function PlatformCard({ platform, content, loading, lang, onAddToDraft }: {
  platform: ReturnType<typeof PLATFORMS>[0]
  content: string
  loading: boolean
  lang: Lang
  onAddToDraft?: (text: string) => void
}) {
  const [editMode, setEditMode] = useState(false)
  const [edited, setEdited] = useState(content)
  const [added, setAdded] = useState(false)

  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${C.border2}`, background: '#fff',
      overflow: 'hidden', boxShadow: C.shadow,
    }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.bg1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, color: C.ink }}>{platform.label}</span>
          <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{platform.desc}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {content && (
            <>
              <button onClick={() => setEditMode(e => !e)} style={{
                padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 10, fontFamily: MONO,
                border: `1px solid ${C.border2}`, background: editMode ? C.al : '#fff',
                color: editMode ? C.accent : C.ink4,
              }}>{editMode ? t('workshop.done', lang) : t('workshop.edit', lang)}</button>
              <CopyButton text={edited || content} lang={lang} />
            </>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 16px', minHeight: 120 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.ink4 }}>{t('workshop.writing', lang)}</span>
          </div>
        ) : !content ? (
          <p style={{ fontFamily: SANS, fontSize: 12, color: C.ink4, margin: 0 }}>
            {t('workshop.enterabove', lang)}
          </p>
        ) : editMode ? (
          <textarea
            value={edited}
            onChange={e => setEdited(e.target.value)}
            style={{
              width: '100%', minHeight: 160, border: `1px solid ${C.border2}`, borderRadius: 8,
              padding: '10px', fontFamily: SANS, fontSize: 12, color: C.ink2, lineHeight: 1.7,
              resize: 'vertical', outline: 'none', background: C.bg1,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
            onBlur={e => (e.currentTarget.style.borderColor = C.border2)}
          />
        ) : (
          <p style={{ fontFamily: SANS, fontSize: 12, color: C.ink2, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
            {content}
          </p>
        )}
      </div>

      {content && (
        <div style={{ padding: '6px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>
            {t('workshop.chars', lang).replace('{n}', String(content.length))}
          </span>
          {onAddToDraft && (
            <button
              onClick={() => {
                onAddToDraft(edited || content)
                setAdded(true)
                setTimeout(() => setAdded(false), 2000)
              }}
              style={{
                padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: MONO,
                border: `1px solid ${added ? C.al2 : C.border2}`,
                background: added ? C.al : '#fff',
                color: added ? C.accent : C.ink3,
                transition: 'all 0.15s',
              }}
            >
              {added ? (lang === 'zh' ? '✓ 已加入' : '✓ Added') : (lang === 'zh' ? '加入草稿箱' : 'Add to Drafts')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function WorkshopPageInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.projectId as string
  const { projects, addRepurposedContent, addPost, lang } = useMingStore()
  const project = projects.find(p => p.id === projectId)

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ youtube: string; instagram: string; tiktok: string; twitter: string } | null>(null)

  // Prefill from other pages (Dashboard "Rewrite", Asset canvas "Send to Workshop")
  useEffect(() => {
    const prefill = searchParams.get('prefill')
    if (prefill) setInput(prefill)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!project) return null

  const { brand } = project
  const platforms = PLATFORMS(lang as Lang)

  const generate = async () => {
    if (!input.trim() || loading) return
    setLoading(true); setError(''); setResult(null)

    try {
      const alias = brand.mindsConversationAlias
      if (!alias) {
        setError(t('workshop.noalias', lang))
        setLoading(false)
        return
      }

      const res = await fetch('/api/minds/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias, profile: brand, input }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const cleaned = {
        youtube:   stripHtml(data.youtube   ?? ''),
        instagram: stripHtml(data.instagram ?? ''),
        tiktok:    stripHtml(data.tiktok    ?? ''),
        twitter:   stripHtml(data.twitter   ?? ''),
      }
      setResult(cleaned)

      const content: RepurposedContent = {
        id: `rep-${Date.now()}`,
        projectId,
        input,
        youtube:   cleaned.youtube,
        instagram: cleaned.instagram,
        tiktok:    cleaned.tiktok,
        twitter:   cleaned.twitter,
        createdAt: new Date().toISOString(),
      }
      addRepurposedContent(content)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg1, fontFamily: SANS }}>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Header */}
      <div style={{ padding: '20px 24px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <h1 style={{ fontFamily: SANS, fontWeight: 700, fontSize: 20, color: C.ink, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>{t('workshop.title', lang)}</h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: C.ink3, margin: 0 }}>{t('workshop.subtitle', lang)}</p>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 900 }}>

        {/* Input area */}
        <div style={{ borderRadius: 14, border: `1px solid ${C.border2}`, background: '#fff', overflow: 'hidden', boxShadow: C.shadow, marginBottom: 24 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('workshop.placeholder', lang)}
            style={{
              width: '100%', minHeight: 160, border: 'none', padding: '16px 18px',
              fontFamily: SANS, fontSize: 13, color: C.ink, lineHeight: 1.75,
              resize: 'vertical', outline: 'none', background: 'transparent',
              boxSizing: 'border-box' as const,
            }}
          />
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg1 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>
              {t('workshop.chars', lang).replace('{n}', String(input.length))}
            </span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {error && <span style={{ fontFamily: SANS, fontSize: 12, color: '#c0392b' }}>{error}</span>}
              <button
                onClick={generate}
                disabled={!input.trim() || loading}
                style={{
                  padding: '9px 22px', borderRadius: 9,
                  background: input.trim() && !loading ? C.accent : C.bg2,
                  color: input.trim() && !loading ? '#fff' : C.ink4,
                  border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  fontFamily: SANS, fontWeight: 600, fontSize: 13,
                  boxShadow: input.trim() && !loading ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {loading && <div style={{ width: 14, height: 14, borderRadius: 7, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />}
                {loading ? t('workshop.generating', lang) : t('workshop.generate', lang)}
              </button>
            </div>
          </div>
        </div>

        {/* Minds setup warning */}
        {!brand.mindsConversationAlias && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <svg width="14" height="14" fill="none" stroke="#92400e" strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ fontFamily: SANS, fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.7 }}>
              {t('workshop.banner', lang)}
            </p>
          </div>
        )}

        {/* Platform results */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {platforms.map(p => (
            <PlatformCard
              key={p.id}
              platform={p}
              content={result?.[p.id as keyof typeof result] ?? ''}
              loading={loading}
              lang={lang as Lang}
              onAddToDraft={(text) => {
                addPost(projectId, {
                  id: `post-${Date.now()}-${p.id}`,
                  projectId,
                  platform: p.id as PlatformId,
                  title: text.slice(0, 80),
                  content: text,
                  hashtags: [],
                  status: 'draft',
                  createdAt: new Date().toISOString(),
                })
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function WorkshopPage() {
  return (
    <Suspense fallback={null}>
      <WorkshopPageInner />
    </Suspense>
  )
}
