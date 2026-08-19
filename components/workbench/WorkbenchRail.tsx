'use client'
import type { ReactNode } from 'react'
import type { WorkbenchPalette } from '@/lib/workbench/theme'
import { ThemeToggle } from './ThemeToggle'
import type { WorkbenchTheme } from '@/lib/workbench/theme'

type RailItem = {
  id: string
  title: string
  active?: boolean
  onClick: () => void
  icon: ReactNode
}

/**
 * Beautiful UI–inspired Sidebar Nav: collapse / expand with groups.
 */
export default function WorkbenchRail({
  zh,
  expanded,
  onToggleExpand,
  palette: P,
  theme,
  onThemeChange,
  workspace,
  objects,
  onAddNode,
}: {
  zh: boolean
  expanded: boolean
  onToggleExpand: () => void
  palette: WorkbenchPalette
  theme: WorkbenchTheme
  onThemeChange: (t: WorkbenchTheme) => void
  workspace: RailItem[]
  objects: RailItem[]
  onAddNode: () => void
}) {
  const w = expanded ? 200 : 56

  return (
    <nav style={{
      width: w, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${P.border}`,
      background: P.railBg,
      zIndex: 20,
      transition: 'width 0.18s ease',
      fontFamily: "'DM Sans', sans-serif",
      color: P.ink,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: expanded ? '14px 12px 10px' : '14px 0 10px',
        justifyContent: expanded ? 'flex-start' : 'center',
      }}>
        {expanded && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            color: P.faint, textTransform: 'uppercase', flex: 1,
          }}>
            {zh ? '工作区' : 'Workspace'}
          </span>
        )}
        <button
          type="button"
          title={expanded ? (zh ? '收起' : 'Collapse') : (zh ? '展开' : 'Expand')}
          onClick={onToggleExpand}
          style={iconBtn(P)}
        >
          {expanded ? '‹' : '›'}
        </button>
      </div>

      <RailBtn
        expanded={expanded}
        title={zh ? '添加节点' : 'Add node'}
        active={false}
        onClick={onAddNode}
        palette={P}
      >
        <span style={{ fontSize: 18, fontWeight: 600 }}>+</span>
        {expanded && <span>{zh ? '添加节点' : 'Add node'}</span>}
      </RailBtn>

      <SectionLabel expanded={expanded} label={zh ? '工作区' : 'Workspace'} color={P.faint} />
      {workspace.map(it => (
        <RailBtn
          key={it.id}
          expanded={expanded}
          title={it.title}
          active={it.active}
          onClick={it.onClick}
          palette={P}
        >
          {it.icon}
          {expanded && <span>{it.title}</span>}
        </RailBtn>
      ))}

      <div style={{ height: 1, background: P.border, margin: '8px 12px' }} />

      <SectionLabel expanded={expanded} label={zh ? '对象' : 'Objects'} color={P.faint} />
      {objects.map(it => (
        <RailBtn
          key={it.id}
          expanded={expanded}
          title={it.title}
          active={it.active}
          onClick={it.onClick}
          palette={P}
        >
          {it.icon}
          {expanded && <span>{it.title}</span>}
        </RailBtn>
      ))}

      <div style={{ flex: 1 }} />

      <div style={{
        padding: expanded ? '12px' : '12px 0',
        display: 'flex',
        justifyContent: expanded ? 'space-between' : 'center',
        alignItems: 'center',
        borderTop: `1px solid ${P.border}`,
        gap: 8,
      }}>
        {expanded && (
          <span style={{ fontSize: 11, color: P.muted }}>
            {zh ? '风格' : 'Style'}
          </span>
        )}
        <ThemeToggle
          theme={theme}
          onChange={onThemeChange}
          title={zh ? '切换画布风格' : 'Toggle canvas style'}
        />
      </div>
    </nav>
  )
}

function SectionLabel({ expanded, label, color }: { expanded: boolean; label: string; color: string }) {
  if (!expanded) return <div style={{ height: 6 }} />
  return (
    <div style={{
      padding: '8px 14px 4px', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.06em', color, textTransform: 'uppercase',
    }}>
      {label}
    </div>
  )
}

function RailBtn({
  expanded, title, active, onClick, children, palette: P,
}: {
  expanded: boolean
  title: string
  active?: boolean
  onClick: () => void
  children: ReactNode
  palette: WorkbenchPalette
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        margin: expanded ? '2px 8px' : '2px auto',
        width: expanded ? 'calc(100% - 16px)' : 38,
        height: 38,
        padding: expanded ? '0 10px' : 0,
        borderRadius: 12,
        border: `1px solid ${active ? P.accent : 'transparent'}`,
        background: active ? P.accentSoft : 'transparent',
        color: active ? P.ink : P.muted,
        cursor: 'pointer',
        justifyContent: expanded ? 'flex-start' : 'center',
        fontSize: 12, fontWeight: 600,
        boxShadow: active ? `0 0 0 3px ${P.accentSoft}` : 'none',
        transition: 'background 0.15s ease, border-color 0.15s ease',
        boxSizing: 'border-box',
        overflow: 'hidden', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function iconBtn(P: WorkbenchPalette) {
  return {
    width: 28, height: 28, borderRadius: 8, border: `1px solid ${P.border}`,
    background: 'transparent', color: P.muted, cursor: 'pointer', fontSize: 16,
  } as const
}
