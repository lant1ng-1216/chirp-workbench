'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import CardAtmosphere, { StickerCanvasBg } from '@/components/dashboard/CardAtmosphere'

const SANS = "'DM Sans', 'Segoe UI', sans-serif"
const MONO = "'JetBrains Mono', 'Space Mono', monospace"

export default function DashboardPage() {
  const router = useRouter()
  const { projects, lang, createWorkbenchProject, removeProject, canvases } = useMingStore()
  const zh = lang === 'zh'
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [showNew, setShowNew] = useState(false)

  const create = async () => {
    if (creating) return
    setCreating(true)
    setError('')
    const result = await createWorkbenchProject(name.trim() || (zh ? '未命名项目' : 'Untitled project'))
    setCreating(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push(`/workbench/${result.projectId}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(165deg, #0c0e14 0%, #141824 45%, #0f1219 100%)',
      fontFamily: SANS,
      color: '#e8eaef',
    }}>
      <header style={{
        height: 64, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', flexShrink: 0 }}>
          <img src="/logo.png" alt="Chirp" style={{ width: 100, height: 100, objectFit: 'contain', marginRight: -30 }} />
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.3px' }}>Chirp</span>
        </Link>
        <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
          {zh ? '工作台' : 'WORKBENCH'}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { setShowNew(true); setError(''); setName('') }}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 13,
          }}
        >
          {zh ? '+ 新建项目' : '+ New project'}
        </button>
      </header>

      <main style={{ padding: '36px 28px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.03em' }}>
          {zh ? '你的项目' : 'Your projects'}
        </h1>
        <p style={{ margin: '0 0 28px', color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6 }}>
          {zh
            ? '进入画布工作台，用 Minds 编排知识、素材与跨平台内容。'
            : 'Open a canvas workbench and orchestrate knowledge, assets, and cross-platform content with Minds.'}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 18,
        }}>
          {/* Create card */}
          <button
            onClick={() => { setShowNew(true); setError(''); setName('') }}
            style={{
              minHeight: 180, borderRadius: 16, border: '1.5px dashed rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.03)', cursor: 'pointer', color: 'rgba(255,255,255,0.55)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: SANS, fontSize: 14, fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>+</span>
            {zh ? '创建项目' : 'Create project'}
          </button>

          {projects.map(p => {
            const title = p.name || p.brand?.name || 'Untitled'
            const nodeCount = canvases[p.id]?.nodes?.length ?? 0
            const updated = p.updatedAt || p.createdAt
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/workbench/${p.id}`)}
                onKeyDown={e => { if (e.key === 'Enter') router.push(`/workbench/${p.id}`) }}
                style={{
                  minHeight: 180, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)', overflow: 'hidden', cursor: 'pointer',
                  position: 'relative', textAlign: 'left',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                  transition: 'border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.9 }}>
                  <StickerCanvasBg />
                  <CardAtmosphere density={6} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, transparent 20%, rgba(12,14,20,0.92) 78%)',
                  }} />
                </div>
                <div style={{ position: 'relative', padding: '18px 16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 9, padding: '2px 7px', borderRadius: 99,
                      background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)',
                    }}>Minds</span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                      {nodeCount} {zh ? '节点' : 'nodes'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                    {updated ? new Date(updated).toLocaleString() : '—'}
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      if (confirm(zh ? `删除「${title}」？` : `Delete “${title}”?`)) removeProject(p.id)
                    }}
                    style={{
                      position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)',
                      borderRadius: 6, padding: '3px 8px', fontSize: 10, cursor: 'pointer', fontFamily: MONO,
                    }}
                  >{zh ? '删除' : 'Del'}</button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {showNew && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
          onClick={() => !creating && setShowNew(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 420, borderRadius: 16, padding: 24,
              background: '#161922', border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
            }}
          >
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>
              {zh ? '新建画布' : 'New canvas'}
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              {zh
                ? '给画布起个名字，然后进入工作台。'
                : 'Name your canvas, then open the workbench.'}
            </p>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') create() }}
              placeholder={zh ? '项目名称' : 'Project name'}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
                color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12,
              }}
            />
            {error && (
              <div style={{
                fontSize: 12, color: '#fca5a5', background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 10px', marginBottom: 12, lineHeight: 1.5,
              }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                disabled={creating}
                onClick={() => setShowNew(false)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
              >{zh ? '取消' : 'Cancel'}</button>
              <button
                disabled={creating}
                onClick={create}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: creating ? '#374151' : '#3b82f6', color: '#fff',
                  fontWeight: 600, cursor: creating ? 'wait' : 'pointer',
                }}
              >{creating ? (zh ? '创建中…' : 'Creating…') : (zh ? '创建并进入' : 'Create & open')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
