'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { ALL_PLATFORMS, PLATFORM_META } from '@/lib/brand'
import type { PlatformId } from '@/lib/brand'

const C = {
  bg: '#ffffff', bg1: '#f9fafb', bg2: '#f3f4f6',
  ink: '#111827', ink2: '#374151', ink3: '#6b7280', ink4: '#9ca3af',
  accent: '#3b82f6', al: 'rgba(59,130,246,0.08)', al2: 'rgba(59,130,246,0.15)',
  border: 'rgba(17,24,39,0.08)', border2: 'rgba(17,24,39,0.14)',
  shadow: '0 1px 3px rgba(17,24,39,0.06),0 3px 10px rgba(17,24,39,0.04)',
}
const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

const LOGO_URL: Record<PlatformId, string> = {
  youtube:   'https://cdn.simpleicons.org/youtube',
  instagram: 'https://cdn.simpleicons.org/instagram',
  tiktok:    'https://cdn.simpleicons.org/tiktok',
  twitter:   'https://cdn.simpleicons.org/x',
  telegram:  'https://cdn.simpleicons.org/telegram',
}

function useActivePlatforms(projectId: string) {
  const activePlatforms = useMingStore(s => s.activePlatforms)
  const togglePlatform = useMingStore(s => s.togglePlatform)
  const active = new Set((activePlatforms[projectId] ?? []) as PlatformId[])
  const toggle = (id: PlatformId) => togglePlatform(projectId, id)
  return { active, toggle }
}

function useHandles(projectId: string) {
  const platformHandles = useMingStore(s => s.platformHandles)
  const setPlatformHandle = useMingStore(s => s.setPlatformHandle)
  const handles = platformHandles[projectId] ?? {}
  const setHandle = (platformId: string, value: string) => setPlatformHandle(projectId, platformId, value)
  return { handles, setHandle }
}

type Lang = 'en' | 'zh'

function PlatformCard({ id, name, color, contentTypes, isActive, onToggle, handle, onHandle, lang }: {
  id: PlatformId; name: string; color: string; contentTypes: string[]
  isActive: boolean; onToggle: () => void; handle: string; onHandle: (v: string) => void
  lang: Lang
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = PLATFORM_META[id]

  return (
    <div style={{
      borderRadius: 12, border: `1.5px solid ${isActive ? color + '40' : C.border2}`,
      background: isActive ? (color + '05') : '#fff',
      boxShadow: C.shadow, overflow: 'hidden', transition: 'border-color 0.2s, background 0.2s',
    }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={LOGO_URL[id]} alt={name} width={20} height={20} style={{ display: 'block' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, color: C.ink }}>{name}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
              {contentTypes.map(ct => (
                <span key={ct} style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, padding: '1px 6px', borderRadius: 99, background: C.bg2 }}>{ct}</span>
              ))}
            </div>
          </div>
          <button onClick={onToggle} style={{
            padding: '5px 12px', borderRadius: 7, border: `1px solid ${isActive ? color : C.border2}`,
            background: isActive ? color : 'transparent', color: isActive ? '#fff' : C.ink4,
            fontFamily: MONO, fontSize: 9, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
          }}>{isActive ? t('platforms.active.check', lang) : t('platforms.markactive', lang)}</button>
        </div>

        {isActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, whiteSpace: 'nowrap' }}>{t('platforms.handle', lang)}</div>
            <input
              value={handle} onChange={e => onHandle(e.target.value)}
              placeholder={`${name} username`}
              style={{ flex: 1, padding: '5px 9px', borderRadius: 7, border: `1px solid ${C.border2}`, fontFamily: MONO, fontSize: 10, color: C.ink, background: C.bg1, outline: 'none' }}
            />
          </div>
        )}

        <button onClick={() => setExpanded(e => !e)} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: C.ink4,
          fontFamily: MONO, fontSize: 9, display: 'flex', alignItems: 'center', gap: 4, padding: 0, letterSpacing: '0.06em',
        }}>
          {t('platforms.guide', lang)}
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>

      {expanded && meta && (
        <div style={{ padding: '10px 16px 14px', borderTop: `1px solid ${C.border}`, background: C.bg1 }}>
          {[
            { labelKey: 'platforms.charlimit', value: meta.charLimit },
            { labelKey: 'platforms.besttime',  value: meta.bestTime  },
            { labelKey: 'platforms.frequency', value: meta.frequency },
          ].map(row => (
            <div key={row.labelKey} style={{ display: 'flex', gap: 10, marginBottom: 7 }}>
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, minWidth: 64, flexShrink: 0 }}>{t(row.labelKey, lang)}</span>
              <span style={{ fontFamily: SANS, fontSize: 11, color: C.ink2 }}>{row.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: C.al, border: `1px solid ${C.al2}` }}>
            <span style={{ fontFamily: SANS, fontSize: 11, color: C.ink2, lineHeight: 1.7 }}>{t('platforms.tip', lang)}: {meta.tip}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlatformsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { projects, lang } = useMingStore()
  const project = projects.find(p => p.id === projectId)
  const { active, toggle } = useActivePlatforms(projectId)
  const { handles, setHandle } = useHandles(projectId)

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: C.bg, fontFamily: SANS }}>

      <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${C.border}`, background: C.bg, position: 'sticky', top: 0, zIndex: 10, gap: 12 }}>
        <h1 style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: C.ink, margin: 0 }}>{t('platforms.title', lang)}</h1>
        <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{project?.brand.name}</div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: active.size > 0 ? C.accent : C.ink4 }}>
            {t('platforms.active.count', lang).replace('{n}', String(active.size)).replace('{t}', String(ALL_PLATFORMS.length))}
          </span>
        </div>
      </div>

      <div style={{ padding: '16px 20px 40px', maxWidth: 860 }}>

        <div style={{ padding: '12px 16px', borderRadius: 10, background: C.al, border: `1px solid ${C.al2}`, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width="14" height="14" fill="none" stroke={C.accent} strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <p style={{ fontFamily: SANS, fontSize: 12, color: C.ink2, lineHeight: 1.75, margin: '0 0 4px 0' }}>
              {t('platforms.banner', lang)}
            </p>
            <p style={{ fontFamily: SANS, fontSize: 11, color: C.ink4, margin: 0 }}>
              {t('platforms.banner.sub', lang)}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {ALL_PLATFORMS.map(p => (
            <PlatformCard
              key={p.id} id={p.id} name={p.name} color={p.color} contentTypes={p.contentTypes}
              isActive={active.has(p.id)} onToggle={() => toggle(p.id)}
              handle={handles[p.id] || ''} onHandle={v => setHandle(p.id, v)}
              lang={lang as Lang}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
