'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useMingStore } from '@/lib/store'
import { t } from '@/lib/i18n'

const C = {
  bg:     '#f5f5f7',
  ink:    '#111827',
  ink3:   '#6b7280',
  accent: '#3b82f6',
  border: 'rgba(17,24,39,0.08)',
}
const SANS = "'Inter', -apple-system, sans-serif"
const MONO = "'Space Mono', monospace"

export default function AppIndexPage() {
  const { lang, projects } = useMingStore()
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  // If there are projects, redirect to first one
  useEffect(() => {
    if (!hydrated) return
    if (projects.length > 0) {
      window.location.replace(`/app/${projects[0].id}`)
    }
  }, [hydrated, projects])

  if (!hydrated || projects.length > 0) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: C.bg, fontFamily: SANS,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: 'rgba(59,130,246,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="28" height="28" fill="none" stroke={C.accent} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>
          {lang === 'zh' ? '还没有创作者' : 'No creators yet'}
        </div>
        <div style={{ fontSize: 13, color: C.ink3, lineHeight: 1.7, marginBottom: 28 }}>
          {lang === 'zh'
            ? '创建你的第一个创作者档案，开始用 AI 管理内容。'
            : 'Create your first creator profile to start managing content with AI.'}
        </div>

        <Link href="/onboarding" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: C.accent, color: '#fff', textDecoration: 'none',
          fontWeight: 600, fontSize: 14, padding: '11px 24px', borderRadius: 10,
          boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
          transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          {lang === 'zh' ? '新建创作者' : 'New Creator'}
        </Link>
      </div>
    </div>
  )
}
