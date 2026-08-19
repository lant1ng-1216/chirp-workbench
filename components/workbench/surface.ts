import type { CSSProperties } from 'react'

/** Shared LibTV-like material — one shell, inset wells, soft chips */
export const S = {
  shellBg: 'rgba(22,22,22,0.96)',
  shellBorder: 'rgba(255,255,255,0.1)',
  wellBg: '#0c0c0c',
  wellInset: 'inset 0 1px 2px rgba(0,0,0,0.55)',
  ink: '#e8eaef',
  muted: 'rgba(255,255,255,0.42)',
  faint: 'rgba(255,255,255,0.28)',
  hairline: 'rgba(255,255,255,0.06)',
  chipBg: 'rgba(255,255,255,0.05)',
  chipBorder: 'rgba(255,255,255,0.1)',
  chipActiveBg: 'rgba(255,255,255,0.1)',
  chipActiveBorder: 'rgba(255,255,255,0.22)',
  sendBg: 'rgba(255,255,255,0.92)',
  sendFg: '#111',
  accent: '#3b82f6',
  radiusShell: 16,
  radiusWell: 12,
  radiusChip: 10,
  font: "'DM Sans', sans-serif",
} as const

export const shellStyle: CSSProperties = {
  borderRadius: S.radiusShell,
  border: `1px solid ${S.shellBorder}`,
  background: S.shellBg,
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset',
  fontFamily: S.font,
  color: S.ink,
}

export const wellStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: S.radiusWell,
  border: 'none',
  background: S.wellBg,
  boxShadow: S.wellInset,
  color: S.ink,
  outline: 'none',
  fontFamily: S.font,
}

export const chipStyle = (active?: boolean, muted?: boolean): CSSProperties => ({
  padding: '5px 10px',
  borderRadius: S.radiusChip,
  cursor: 'pointer',
  border: `1px solid ${active ? S.chipActiveBorder : S.chipBorder}`,
  background: active ? S.chipActiveBg : S.chipBg,
  color: muted ? S.faint : 'rgba(255,255,255,0.82)',
  fontSize: 11,
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
})

export const iconGhost: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: S.muted,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}
