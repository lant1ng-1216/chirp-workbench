'use client'
import type { CSSProperties } from 'react'
import type { WorkbenchTheme } from '@/lib/workbench/theme'

/** Sun / moon pill — workbench theme switch */
export function ThemeToggle({
  theme,
  onChange,
  title,
}: {
  theme: WorkbenchTheme
  onChange: (t: WorkbenchTheme) => void
  title?: string
}) {
  const light = theme === 'light'
  return (
    <button
      type="button"
      title={title || (light ? 'Switch to dark' : 'Switch to light')}
      aria-label={title || 'Toggle theme'}
      onClick={() => onChange(light ? 'dark' : 'light')}
      style={{
        position: 'relative',
        width: 52,
        height: 28,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        background: light ? '#e4e4e7' : 'rgba(255,255,255,0.12)',
        boxShadow: light ? 'inset 0 1px 2px rgba(0,0,0,0.08)' : 'inset 0 1px 2px rgba(0,0,0,0.35)',
        flexShrink: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 3,
          left: light ? 3 : 26,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.18s ease',
          color: '#18181b',
        }}
      >
        {light ? <SunIcon /> : <MoonIcon />}
      </span>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 5,
          right: light ? 6 : undefined,
          left: light ? undefined : 6,
          opacity: 0.45,
          display: 'flex',
          color: light ? '#71717a' : 'rgba(255,255,255,0.55)',
        }}
      >
        {light ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
        <line
          key={deg}
          x1="12"
          y1="2.5"
          x2="12"
          y2="5.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.5 14.2A7.8 7.8 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
    </svg>
  )
}

export const themeToggleInline: CSSProperties = { display: 'inline-flex' }
