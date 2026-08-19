'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { useMingStore } from '@/lib/store'
import { avatarUrl, DEFAULT_AVATAR_STYLE } from '@/lib/members'

const C = {
  bg: '#f5f5f7', bg1: '#ffffff',
  ink: '#111827', ink2: '#374151', ink3: '#6b7280', ink4: '#9ca3af',
  accent: '#3b82f6', al: 'rgba(59,130,246,0.08)',
  border: 'rgba(17,24,39,0.08)', border2: 'rgba(17,24,39,0.14)',
  shadow: '0 1px 3px rgba(17,24,39,0.06),0 3px 10px rgba(17,24,39,0.04)',
}
const SANS = "'Inter',-apple-system,sans-serif"
const MONO = "'Space Mono',monospace"

function JoinPageInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const code = searchParams.get('code') ?? ''

  const { projects, inviteCodes, members, addMember, lang } = useMingStore()
  const project = projects.find(p => p.id === projectId)
  const zh = lang === 'zh'

  const [name, setName] = useState('')
  const style = DEFAULT_AVATAR_STYLE
  const [joined, setJoined] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    const unsub = useMingStore.persist.onFinishHydration(() => setHydrated(true))
    setHydrated(useMingStore.persist.hasHydrated())
    return unsub
  }, [])

  if (!hydrated) return null

  const valid = !!project && !!code && inviteCodes[projectId] === code
  const existingMembers = members[projectId] ?? []

  const join = () => {
    if (!name.trim() || !valid) return
    addMember({
      id: `m-${Date.now()}`,
      projectId,
      name: name.trim(),
      role: 'editor',
      avatarSeed: name.trim(),
      avatarStyle: style,
      status: 'online',
      focus: zh ? '刚刚加入工作区' : 'Just joined the workspace',
      joinedAt: new Date().toISOString(),
    })
    setJoined(true)
    setTimeout(() => router.push(`/workbench/${projectId}`), 1200)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, background: C.bg1, borderRadius: 18, border: `1px solid ${C.border}`, boxShadow: '0 8px 40px rgba(17,24,39,0.1)', padding: '32px 28px' }}>

        {!project || !valid ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔗</div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: '0 0 8px' }}>
              {zh ? '邀请链接无效' : 'Invalid invite link'}
            </h1>
            <p style={{ fontSize: 13, color: C.ink3, lineHeight: 1.7, margin: 0 }}>
              {zh ? '链接可能已过期，请向工作区创建者索取新的邀请。' : 'This link may have expired. Ask the workspace owner for a new invite.'}
            </p>
          </div>
        ) : joined ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px',
              border: `2px solid ${C.accent}`, overflow: 'hidden', background: C.al,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl(name, style)} alt="" width={64} height={64} />
            </div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>
              {zh ? `欢迎加入，${name}！` : `Welcome aboard, ${name}!`}
            </h1>
            <p style={{ fontFamily: MONO, fontSize: 10, color: C.ink4, margin: 0 }}>
              {zh ? '正在进入工作区…' : 'Entering workspace…'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
                background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 13c0-5 3.6-9 8.5-9 3.5 0 6 2 6.8 4.7l2.2.8-1.8 1.5c.1.6.1 1.3-.1 2 1.5 2.6 1 5.6-1.6 6.9-2.2 1.1-4.6.4-6.2-1.2C9.6 20 7 20.6 5 19.6c-1.4-.7-1-2.4.3-2.6C4.4 15.9 4 14.5 4 13z" fill="#fff"/></svg>
              </div>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>
                {zh ? '你被邀请加入工作区' : "You're invited to collaborate"}
              </h1>
              <p style={{ fontSize: 13, color: C.ink3, margin: 0 }}>
                <strong style={{ color: C.ink }}>{project.brand.name}</strong>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.ink4 }}> · {existingMembers.length} {zh ? '位成员' : 'members'}</span>
              </p>
            </div>

            {/* Live avatar preview */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.border2}`, background: C.bg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl(name || 'new-member', style)} alt="" width={72} height={72} />
              </div>
            </div>

            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={zh ? '输入你的名字' : 'Your name'}
              autoFocus
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box',
                border: `1.5px solid ${name ? C.accent : C.border2}`, outline: 'none',
                fontFamily: SANS, fontSize: 14, color: C.ink, marginBottom: 12,
              }}
            />

            <div style={{ marginBottom: 18 }} />

            <button
              onClick={join}
              disabled={!name.trim()}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                background: name.trim() ? C.accent : C.border,
                color: name.trim() ? '#fff' : C.ink4,
                fontFamily: SANS, fontWeight: 600, fontSize: 14,
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                boxShadow: name.trim() ? '0 2px 10px rgba(59,130,246,0.3)' : 'none',
              }}
            >
              {zh ? '加入工作区' : 'Join workspace'}
            </button>
            <p style={{ fontFamily: MONO, fontSize: 8.5, color: C.ink4, textAlign: 'center', margin: '12px 0 0' }}>
              {zh ? '演示环境 · 成员数据保存在本机' : 'Demo environment · membership is stored locally'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinPageInner />
    </Suspense>
  )
}
