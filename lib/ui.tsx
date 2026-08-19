'use client'
import React from 'react'

/* ── Chirp design tokens — single source of truth ── */
export const C = {
  bg: '#ffffff',
  bg1: '#f9fafb',
  bg2: '#f3f4f6',
  bg3: '#eef0f4',
  ink: '#111827',
  ink2: '#374151',
  ink3: '#6b7280',
  ink4: '#9ca3af',
  accent: '#3b82f6',
  accentDark: '#2563eb',
  al: 'rgba(59,130,246,0.08)',
  al2: 'rgba(59,130,246,0.15)',
  border: 'rgba(17,24,39,0.08)',
  border2: 'rgba(17,24,39,0.14)',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  shadow: '0 1px 2px rgba(17,24,39,0.04),0 4px 16px rgba(17,24,39,0.05)',
  shadowM: '0 2px 8px rgba(17,24,39,0.07),0 10px 30px rgba(17,24,39,0.08)',
} as const

export const SANS = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif"
export const MONO = "'Space Mono',ui-monospace,monospace"

export const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#ff0000',
  instagram: '#e1306c',
  tiktok: '#111827',
  twitter: '#1d9bf0',
  telegram: '#2aabee',
}

/* ── Primitives ── */

export function Card({ children, style, onClick }: {
  children: React.ReactNode
  style?: React.CSSProperties
  onClick?: () => void
}) {
  return (
    <div onClick={onClick} style={{
      background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
      boxShadow: C.shadow, ...style,
    }}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, right, style }: {
  children: React.ReactNode
  right?: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 12, ...style,
    }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: C.ink, letterSpacing: '-0.01em' }}>
        {children}
      </span>
      {right && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>{right}</div>}
    </div>
  )
}

export function StatPill({ value, label, color = C.accent }: {
  value: React.ReactNode
  label: string
  color?: string
}) {
  return (
    <div style={{
      textAlign: 'center', padding: '5px 12px', borderRadius: 9,
      background: `${color}0d`, border: `1px solid ${color}20`,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color, lineHeight: 1.15 }}>{value}</div>
      <div style={{ fontFamily: SANS, fontSize: 9, color, opacity: 0.85, marginTop: 2, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  )
}

export function PrimaryButton({ children, onClick, disabled, style }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  style?: React.CSSProperties
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 16px', borderRadius: 9, border: 'none',
      background: disabled ? C.bg2 : C.accent,
      color: disabled ? C.ink4 : '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: SANS, fontWeight: 600, fontSize: 12,
      boxShadow: disabled ? 'none' : '0 2px 8px rgba(59,130,246,0.28)',
      transition: 'background 0.15s, transform 0.1s',
      ...style,
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = C.accentDark }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = C.accent }}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, disabled, style, title }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  style?: React.CSSProperties
  title?: string
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '8px 13px', borderRadius: 9,
      background: C.bg, border: `1px solid ${C.border2}`,
      color: C.ink2, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: SANS, fontWeight: 600, fontSize: 12,
      transition: 'border-color 0.15s, color 0.15s',
      ...style,
    }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.ink2 } }}
    >
      {children}
    </button>
  )
}

export function Spinner({ size = 16, color = C.accent }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2, flexShrink: 0,
      border: `2px solid ${color}`, borderTopColor: 'transparent',
      animation: 'chirp-spin 0.8s linear infinite',
    }} />
  )
}

export function PipAvatar({ size = 24 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28),
      background: C.al2, border: `1px solid rgba(59,130,246,0.2)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none">
        <path d="M4 13c0-5 3.6-9 8.5-9 3.5 0 6 2 6.8 4.7l2.2.8-1.8 1.5c.1.6.1 1.3-.1 2 1.5 2.6 1 5.6-1.6 6.9-2.2 1.1-4.6.4-6.2-1.2C9.6 20 7 20.6 5 19.6c-1.4-.7-1-2.4.3-2.6C4.4 15.9 4 14.5 4 13z" fill={C.accent} opacity="0.9" />
        <circle cx="13.4" cy="10.2" r="1.1" fill="#fff" />
      </svg>
    </div>
  )
}

/* Injected once per page that uses spinners/pulse */
export const UI_KEYFRAMES = `@keyframes chirp-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes chirp-pulse{0%,100%{opacity:1}50%{opacity:0.35}}
@keyframes chirp-fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@keyframes chirp-flow{from{background-position:0% 0}to{background-position:200% 0}}
@keyframes chirp-ring{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes chirp-ticker{from{transform:translateY(0)}to{transform:translateY(-50%)}}`

export function relativeTime(ts: number, zh: boolean): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return zh ? '刚刚' : 'just now'
  if (m < 60) return zh ? `${m} 分钟前` : `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return zh ? `${h} 小时前` : `${h}h ago`
  const d = Math.floor(h / 24)
  return zh ? `${d} 天前` : `${d}d ago`
}
