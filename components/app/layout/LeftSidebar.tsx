'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

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

function NavItem({ icon, label, href, active, tourId }: { icon: React.ReactNode; label: string; href: string; active: boolean; tourId?: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }} {...(tourId ? { 'data-tour': tourId } : {})}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
        background: active ? C.al : 'transparent',
        color: active ? C.accent : C.ink3,
        transition: 'background 0.15s, color 0.15s',
        marginBottom: 1,
      }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = C.al }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        <span style={{ flexShrink: 0, color: active ? C.accent : C.ink4 }}>{icon}</span>
        <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: active ? 500 : 400 }}>{label}</span>
      </div>
    </Link>
  )
}

export default function LeftSidebar() {
  const params   = useParams()
  const router   = useRouter()
  const pathname = usePathname()
  const { projects, setActiveProject, removeProject, lang, setLang } = useMingStore()

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const projectId = (params?.projectId as string) || (mounted ? useMingStore.getState().activeProjectId : null)
  const project   = projects.find(p => p.id === projectId)
  const otherProjects = projects.filter(p => p.id !== projectId)

  const isActive = (path: string) => pathname.includes(path)

  return (
    <aside style={{ width: 216, flexShrink: 0, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${C.border}`, fontFamily: SANS }}>

      {/* Logo + lang */}
      <div style={{ padding: '4px 14px 4px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <img src="/logo.png" alt="Chirp" style={{ width: 100, height: 100, objectFit: 'contain', marginRight: -30 }} />
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: C.ink }}>Chirp</span>
        </Link>
        <button
          onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          style={{
            fontFamily: MONO, fontSize: 9, padding: '3px 7px', borderRadius: 5,
            background: C.bg2, border: `1px solid ${C.border2}`,
            color: C.ink4, cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >{lang === 'en' ? 'EN | 中' : '中 | EN'}</button>
      </div>

      {/* Creator switcher */}
      <div style={{ padding: '10px 10px 6px', borderBottom: `1px solid ${C.border}` }}>
        {confirmDelete !== null && confirmDelete === projectId ? (
          <div style={{ borderRadius: 8, background: '#fff5f5', border: '1px solid rgba(192,57,43,0.2)', padding: '8px 10px', marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: C.ink2, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Remove &ldquo;{project?.brand.name}&rdquo;?
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => {
                const next = otherProjects[0]
                removeProject(projectId!)
                setConfirmDelete(null)
                if (next) { setActiveProject(next.id); router.push(`/app/${next.id}`) }
                else router.push('/app')
              }} style={{ flex: 1, fontSize: 11, padding: '5px 0', borderRadius: 6, background: '#fee2e2', color: '#c0392b', border: 'none', cursor: 'pointer' }}>Remove</button>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, fontSize: 11, padding: '5px 0', borderRadius: 6, background: C.bg2, color: C.ink3, border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}
            onMouseEnter={e => { const b = e.currentTarget.querySelector('.del-active-btn') as HTMLElement; if (b) b.style.opacity = '1' }}
            onMouseLeave={e => { const b = e.currentTarget.querySelector('.del-active-btn') as HTMLElement; if (b) b.style.opacity = '0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, background: C.bg1, border: `1px solid ${C.border}` }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                {project?.brand.name?.charAt(0) ?? '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project?.brand.name ?? 'Select creator'}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.03em', marginTop: 1 }}>youtube creator</div>
              </div>
            </div>
            <button className="del-active-btn" onClick={() => setConfirmDelete(projectId!)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0, transition: 'opacity 0.15s', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <svg width="11" height="11" fill="none" stroke={C.ink4} strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        )}

        {otherProjects.map(p => (
          confirmDelete === p.id ? (
            <div key={p.id} style={{ borderRadius: 8, background: '#fff5f5', border: '1px solid rgba(192,57,43,0.2)', padding: '8px 10px', marginTop: 2 }}>
              <div style={{ fontSize: 11, color: C.ink2, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Remove &ldquo;{p.brand.name}&rdquo;?
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => {
                  const remaining = projects.filter(x => x.id !== p.id)
                  removeProject(p.id)
                  setConfirmDelete(null)
                  if (remaining.length === 0) router.push('/app')
                }} style={{ flex: 1, fontSize: 11, padding: '5px 0', borderRadius: 6, background: '#fee2e2', color: '#c0392b', border: 'none', cursor: 'pointer' }}>Remove</button>
                <button onClick={() => setConfirmDelete(null)}
                  style={{ flex: 1, fontSize: 11, padding: '5px 0', borderRadius: 6, background: C.bg2, color: C.ink3, border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div key={p.id} style={{ position: 'relative', marginTop: 2 }}
              onMouseEnter={e => { const b = e.currentTarget.querySelector('.del-other-btn') as HTMLElement; if (b) b.style.opacity = '1' }}
              onMouseLeave={e => { const b = e.currentTarget.querySelector('.del-other-btn') as HTMLElement; if (b) b.style.opacity = '0' }}
            >
              <button onClick={() => { setActiveProject(p.id); router.push(`/app/${p.id}`) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 9px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: C.accent, flexShrink: 0, opacity: 0.5 }} />
                <span style={{ fontSize: 11, color: C.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{p.brand.name}</span>
              </button>
              <button className="del-other-btn" onClick={() => setConfirmDelete(p.id)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0, transition: 'opacity 0.15s', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <svg width="11" height="11" fill="none" stroke={C.ink4} strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              </button>
            </div>
          )
        ))}

        <Link href="/onboarding" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 7, marginTop: 4, fontSize: 11, color: C.ink4, textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = C.ink4)}
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.04em' }}>{t('sidebar.addcreator', lang)}</span>
        </Link>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {/* Section label */}
        <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, letterSpacing: '0.08em', padding: '2px 10px 6px', textTransform: 'uppercase' }}>
          {lang === 'zh' ? '工作台' : 'Workspace'}
        </div>
        <NavItem
          icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>}
          label={lang === 'zh' ? '总览' : 'Overview'}
          href={projectId ? `/app/${projectId}` : '#'}
          active={pathname === `/app/${projectId}`}
        />
        <NavItem
          icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h4M7 11h2"/><rect x="13" y="7" width="5" height="5" rx="1"/></svg>}
          label={lang === 'zh' ? '素材库' : 'Asset Library'}
          href={projectId ? `/app/${projectId}/assets` : '#'}
          active={isActive('/assets')}
        />
        <NavItem
          icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
          label={lang === 'zh' ? '内容工坊' : 'Workshop'}
          href={projectId ? `/app/${projectId}/workshop` : '#'}
          active={isActive('/workshop')}
        />
        <NavItem
          icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
          label={lang === 'zh' ? '排期日历' : 'Calendar'}
          href={projectId ? `/app/${projectId}/calendar` : '#'}
          active={isActive('/calendar')}
        />

        <div style={{ fontFamily: MONO, fontSize: 8, color: C.ink4, letterSpacing: '0.08em', padding: '10px 10px 6px', textTransform: 'uppercase' }}>
          {lang === 'zh' ? '分析与社区' : 'Growth'}
        </div>
        <NavItem
          icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          label={lang === 'zh' ? '增长分析' : 'Analytics'}
          href={projectId ? `/app/${projectId}/analytics` : '#'}
          active={isActive('/analytics')}
        />
        <NavItem
          icon={<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          label={lang === 'zh' ? '社区助手' : 'Community'}
          href={projectId ? `/app/${projectId}/community` : '#'}
          active={isActive('/community')}
        />
      </div>

      {/* User chip */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>
            {project?.brand.name?.charAt(0) ?? 'C'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project?.brand.name ?? 'Creator'}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>{t('sidebar.creator', lang)}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
