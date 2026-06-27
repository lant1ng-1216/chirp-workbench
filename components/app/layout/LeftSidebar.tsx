'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useMingStore } from '@/lib/store'

const C = {
  bg:     '#faf9f7',
  bg2:    '#f4f2ee',
  bg3:    '#edeae4',
  ink:    '#1a1916',
  ink2:   '#4a4844',
  ink3:   '#9a9894',
  ink4:   '#c8c6c0',
  accent: '#1c3a2e',
  al:     'rgba(28,58,46,0.08)',
  al2:    'rgba(28,58,46,0.15)',
  border: 'rgba(26,25,22,0.08)',
  border2:'rgba(26,25,22,0.14)',
  shadow: '0 1px 3px rgba(26,25,22,0.06)',
}
const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"
const SANS  = "'Noto Sans SC', 'PingFang SC', sans-serif"

export default function LeftSidebar() {
  const params   = useParams()
  const router   = useRouter()
  const pathname = usePathname()
  const { projects, setActiveProject, addThread, removeProject, removeThread } = useMingStore()

  const [confirmDelete,       setConfirmDelete]       = useState<string | null>(null)
  const [confirmDeleteThread, setConfirmDeleteThread] = useState<string | null>(null)

  const projectId = (params?.projectId as string) || useMingStore.getState().activeProjectId
  const project   = projects.find(p => p.id === projectId)
  const otherProjects = projects.filter(p => p.id !== projectId)

  const addNewThread = () => {
    if (!projectId) return
    const threadId = `thread-${Date.now()}`
    addThread(projectId, { id: threadId, projectId, title: '新话题', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    router.push(`/app/${projectId}/thread/${threadId}`)
  }

  const navItemStyle = (active: boolean) => ({
    display: 'flex' as const, alignItems: 'center' as const, gap: 8,
    padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
    background: active ? C.al : 'transparent',
    color: active ? C.accent : C.ink3,
    transition: 'background 0.15s, color 0.15s',
  })

  const NAV = [
    {
      label: '创意实验室', path: '__lab__',
      svg: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>,
      badge: 'LAB',
    },
    {
      label: '内容日历', path: 'calendar',
      svg: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    },
    {
      label: '数据分析', path: 'analytics',
      svg: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>,
    },
    {
      label: '平台连接', path: 'platforms',
      svg: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>,
      badge: '2/12',
    },
    {
      label: '爆款拆解', path: '__analyze__',
      svg: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
      badge: 'NEW',
    },
  ]

  return (
    <aside style={{ width: 210, flexShrink: 0, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${C.border}`, fontFamily: SANS }}>

      {/* Brand switcher */}
      <div style={{ padding: '14px 12px 10px', borderBottom: `1px solid ${C.border}` }}>
        {/* Active brand */}
        {confirmDelete === projectId ? (
          <div style={{ borderRadius: 9, background: '#fff5f5', border: `1px solid rgba(192,57,43,0.2)`, padding: '8px 10px', marginBottom: 4 }}>
            <div style={{ fontFamily: SERIF, fontSize: 11, color: C.ink2, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              确认删除「{project?.brand.name}」？
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => {
                const next = otherProjects[0]
                removeProject(projectId!)
                setConfirmDelete(null)
                if (next) { setActiveProject(next.id); router.push(`/app/${next.id}`) }
                else router.push('/onboarding')
              }} style={{ flex: 1, fontSize: 11, padding: '5px 0', borderRadius: 6, background: '#fee2e2', color: '#c0392b', border: 'none', cursor: 'pointer', fontFamily: SANS }}>删除</button>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, fontSize: 11, padding: '5px 0', borderRadius: 6, background: C.bg3, color: C.ink3, border: 'none', cursor: 'pointer', fontFamily: SANS }}>取消</button>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', marginBottom: 4 }}
            onMouseEnter={e => { const b = e.currentTarget.querySelector('.del-active-btn') as HTMLElement; if (b) b.style.opacity = '1' }}
            onMouseLeave={e => { const b = e.currentTarget.querySelector('.del-active-btn') as HTMLElement; if (b) b.style.opacity = '0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, background: C.bg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: project?.brand.colors[0] || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 11, fontWeight: 600, color: '#fff' }}>
                {project?.brand.name.charAt(0) || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project?.brand.name || '选择品牌'}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.04em' }}>{project?.brand.industry || ''}</div>
              </div>
              <svg width="9" height="9" fill="none" stroke={C.ink4} strokeWidth="1.5" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <button className="del-active-btn" onClick={() => setConfirmDelete(projectId!)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0, transition: 'opacity 0.15s', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <svg width="11" height="11" fill="none" stroke={C.ink4} strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        )}

        {/* Other brands */}
        {otherProjects.map(p => (
          <div key={p.id} style={{ position: 'relative', marginTop: 2 }}
            onMouseEnter={e => { const b = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (b) b.style.opacity = '1' }}
            onMouseLeave={e => { const b = e.currentTarget.querySelector('.del-btn') as HTMLElement; if (b) b.style.opacity = '0' }}
          >
            <button onClick={() => { setActiveProject(p.id); router.push(`/app/${p.id}`) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', paddingRight: 28 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: p.brand.colors[0] || C.ink3, flexShrink: 0 }} />
              <span style={{ fontFamily: SANS, fontSize: 11, color: C.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{p.brand.name}</span>
            </button>
            {confirmDelete === p.id ? (
              <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3 }}>
                <button onClick={() => { const rem = projects.filter(x => x.id !== p.id); removeProject(p.id); setConfirmDelete(null); router.push(rem.length > 0 ? `/app/${rem[0].id}` : '/onboarding') }}
                  style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: '#fee2e2', color: '#c0392b', border: 'none', cursor: 'pointer' }}>删除</button>
                <button onClick={() => setConfirmDelete(null)}
                  style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: C.bg3, color: C.ink3, border: 'none', cursor: 'pointer' }}>取消</button>
              </div>
            ) : (
              <button className="del-btn" onClick={() => setConfirmDelete(p.id)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0, transition: 'opacity 0.15s', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <svg width="11" height="11" fill="none" stroke={C.ink4} strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              </button>
            )}
          </div>
        ))}

        <Link href="/onboarding" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, marginTop: 4, fontSize: 11, color: C.ink4, textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = C.ink4)}
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.04em' }}>新建品牌</span>
        </Link>
      </div>

      {/* Private chat entry */}
      <div style={{ padding: '10px 10px 4px' }}>
        <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.12em', padding: '0 6px', marginBottom: 5, textTransform: 'uppercase' as const }}>私聊</div>
        <Link href={projectId ? `/app/${projectId}` : '#'} style={{ textDecoration: 'none' }}>
          <div style={navItemStyle(pathname === `/app/${projectId}`)}
            onMouseEnter={e => { if (pathname !== `/app/${projectId}`) (e.currentTarget as HTMLDivElement).style.background = C.al }}
            onMouseLeave={e => { if (pathname !== `/app/${projectId}`) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: '#fff', letterSpacing: '-0.3px' }}>鸣</span>
            </div>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.ink }}>鸣</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.04em' }}>你的营销搭档</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Thread list */}
      <div style={{ padding: '8px 10px 0', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px', marginBottom: 5 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>话题对话</div>
          <button onClick={addNewThread} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.ink4, fontSize: 16, lineHeight: 1, padding: '0 2px', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = C.ink4)}
          >+</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {project?.threads.slice(1).map(thread => (
            <div key={thread.id} style={{ position: 'relative', marginBottom: 1 }}
              onMouseEnter={e => { const b = e.currentTarget.querySelector('.del-thread-btn') as HTMLElement; if (b) b.style.opacity = '1' }}
              onMouseLeave={e => { const b = e.currentTarget.querySelector('.del-thread-btn') as HTMLElement; if (b) b.style.opacity = '0' }}
            >
              <Link href={`/app/${projectId}/thread/${thread.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ ...navItemStyle(pathname.includes(thread.id)), fontSize: 12, fontFamily: SANS, color: pathname.includes(thread.id) ? C.accent : C.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 24 }}
                  onMouseEnter={e => { if (!pathname.includes(thread.id)) (e.currentTarget as HTMLDivElement).style.background = C.al }}
                  onMouseLeave={e => { if (!pathname.includes(thread.id)) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, marginRight: 4 }}>#</span>
                  {thread.title}
                </div>
              </Link>
              {confirmDeleteThread === thread.id ? (
                <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 3 }}>
                  <button onClick={() => { removeThread(projectId!, thread.id); if (pathname.includes(thread.id)) router.push(`/app/${projectId}`); setConfirmDeleteThread(null) }}
                    style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: '#fee2e2', color: '#c0392b', border: 'none', cursor: 'pointer' }}>删除</button>
                  <button onClick={() => setConfirmDeleteThread(null)}
                    style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: C.bg3, color: C.ink3, border: 'none', cursor: 'pointer' }}>取消</button>
                </div>
              ) : (
                <button className="del-thread-btn" onClick={() => setConfirmDeleteThread(thread.id)}
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', opacity: 0, transition: 'opacity 0.15s', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <svg width="10" height="10" fill="none" stroke={C.ink4} strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ marginTop: 'auto', borderTop: `1px solid ${C.border}`, padding: '8px 10px' }}>
        {NAV.map(item => {
          const href = item.path === '__lab__' ? (projectId ? `/lab/${projectId}` : '#') : item.path === '__analyze__' ? '/analyze' : (projectId ? `/app/${projectId}/${item.path}` : '#')
          const isActive = item.path === '__lab__' ? pathname.startsWith('/lab') : item.path === '__analyze__' ? pathname.startsWith('/analyze') : pathname.includes(item.path)
          return (
            <Link key={item.path} href={href} style={{ textDecoration: 'none' }}>
              <div style={{ ...navItemStyle(isActive), marginBottom: 1 }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = C.al }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <span style={{ flexShrink: 0 }}>{item.svg}</span>
                <span style={{ fontFamily: SANS, fontSize: 12, flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ fontFamily: MONO, fontSize: 8, padding: '2px 6px', borderRadius: 99, background: item.badge === 'LAB' ? C.al2 : item.badge === 'NEW' ? 'rgba(91,78,184,0.1)' : C.bg3, color: item.badge === 'LAB' ? C.accent : item.badge === 'NEW' ? '#5b4eb8' : C.ink3, letterSpacing: '0.04em' }}>
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          )
        })}

        {/* User chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginTop: 4, borderTop: `1px solid ${C.border}` }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 10, color: '#fff', fontWeight: 600 }}>U</div>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 11, color: C.ink }}>用户</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>成长版</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
