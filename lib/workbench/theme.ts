/** Workbench light/dark tokens — scoped to canvas shell, not marketing site. */

export type WorkbenchTheme = 'dark' | 'light'

export type WorkbenchPalette = {
  bg: string
  panel: string
  panelSolid: string
  border: string
  ink: string
  muted: string
  faint: string
  accent: string
  accentSoft: string
  railBg: string
  wellBg: string
  chipBg: string
  dot: string
  edge: string
  edgeSelected: string
  shellBg: string
  shellBorder: string
  sendBg: string
  sendFg: string
}

export const THEME_DARK: WorkbenchPalette = {
  bg: '#000000',
  panel: 'rgba(26,26,26,0.96)',
  panelSolid: '#141414',
  border: 'rgba(255,255,255,0.12)',
  ink: '#e8eaef',
  muted: 'rgba(255,255,255,0.45)',
  faint: 'rgba(255,255,255,0.28)',
  accent: '#3b82f6',
  accentSoft: 'rgba(59,130,246,0.16)',
  railBg: 'linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(0,0,0,0.94) 100%)',
  wellBg: '#0c0c0c',
  chipBg: 'rgba(255,255,255,0.05)',
  dot: 'rgba(255,255,255,0.16)',
  edge: 'rgba(255,255,255,0.62)',
  edgeSelected: 'rgba(255,255,255,0.95)',
  shellBg: 'rgba(22,22,22,0.96)',
  shellBorder: 'rgba(255,255,255,0.1)',
  sendBg: 'rgba(255,255,255,0.92)',
  sendFg: '#111',
}

export const THEME_LIGHT: WorkbenchPalette = {
  bg: '#f4f4f5',
  panel: 'rgba(255,255,255,0.94)',
  panelSolid: '#ffffff',
  border: 'rgba(0,0,0,0.1)',
  ink: '#18181b',
  muted: 'rgba(0,0,0,0.48)',
  faint: 'rgba(0,0,0,0.32)',
  accent: '#2563eb',
  accentSoft: 'rgba(37,99,235,0.12)',
  railBg: 'linear-gradient(180deg, #fafafa 0%, #f4f4f5 100%)',
  wellBg: '#f4f4f5',
  chipBg: 'rgba(0,0,0,0.04)',
  dot: 'rgba(0,0,0,0.12)',
  edge: 'rgba(0,0,0,0.35)',
  edgeSelected: 'rgba(37,99,235,0.75)',
  shellBg: 'rgba(255,255,255,0.96)',
  shellBorder: 'rgba(0,0,0,0.1)',
  sendBg: '#18181b',
  sendFg: '#fff',
}

export function paletteFor(theme: WorkbenchTheme): WorkbenchPalette {
  return theme === 'light' ? THEME_LIGHT : THEME_DARK
}
