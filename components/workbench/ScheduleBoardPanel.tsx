'use client'
import { useMemo, useState, type CSSProperties } from 'react'
import type { BoardTask, BoardTaskStatus } from '@/lib/workbench/boardTasks'
import { newBoardTaskId } from '@/lib/workbench/boardTasks'
import type { WorkbenchPalette } from '@/lib/workbench/theme'
import { ImeInput } from './ImeFields'

type DraftRef = { id: string; title: string }
type Filter = 'all' | BoardTaskStatus

/**
 * Beautiful UI–inspired Filter Table: schedule anchors + todos in one board.
 */
export default function ScheduleBoardPanel({
  zh,
  projectId,
  tasks,
  draftNodes,
  palette: P,
  onClose,
  onAdd,
  onUpdate,
  onRemove,
}: {
  zh: boolean
  projectId: string
  tasks: BoardTask[]
  draftNodes: DraftRef[]
  palette: WorkbenchPalette
  onClose: () => void
  onAdd: (task: BoardTask) => void
  onUpdate: (id: string, updates: Partial<BoardTask>) => void
  onRemove: (id: string) => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [title, setTitle] = useState('')
  const [at, setAt] = useState('')
  const [contentNodeId, setContentNodeId] = useState('')

  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    doing: tasks.filter(t => t.status === 'doing').length,
    done: tasks.filter(t => t.status === 'done').length,
  }), [tasks])

  const rows = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter(t => t.status === filter))
      .slice()
      .sort((a, b) => (a.at || a.createdAt).localeCompare(b.at || b.createdAt)),
    [tasks, filter],
  )

  const add = () => {
    const t = title.trim()
    if (!t) return
    onAdd({
      id: newBoardTaskId(),
      projectId,
      title: t,
      at: at || undefined,
      status: 'todo',
      contentNodeId: contentNodeId || undefined,
      source: 'manual',
      createdAt: new Date().toISOString(),
    })
    setTitle('')
    setAt('')
    setContentNodeId('')
  }

  const chips: Array<{ id: Filter; label: string; n: number }> = [
    { id: 'all', label: zh ? '全部' : 'All', n: counts.all },
    { id: 'todo', label: zh ? '待办' : 'To do', n: counts.todo },
    { id: 'doing', label: zh ? '进行中' : 'In progress', n: counts.doing },
    { id: 'done', label: zh ? '已完成' : 'Completed', n: counts.done },
  ]

  return (
    <div
      className="nopan nodrag nowheel"
      style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: Math.min(440, typeof window !== 'undefined' ? window.innerWidth * 0.92 : 440),
        zIndex: 28,
        background: P.panel,
        borderRight: `1px solid ${P.border}`,
        boxShadow: '8px 0 32px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
        color: P.ink,
      }}
      onPointerDown={e => e.stopPropagation()}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 16px 10px', borderBottom: `1px solid ${P.border}`,
      }}>
        <strong style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>
          {zh ? '排期 · 待办' : 'Schedule · Tasks'}
        </strong>
        <button type="button" onClick={onClose} style={iconBtn(P)}>×</button>
      </div>

      <p style={{ margin: '10px 16px 0', fontSize: 11, lineHeight: 1.5, color: P.muted }}>
        {zh
          ? '只排不发。把成稿挂到时间，并用状态跟踪待办。'
          : 'Schedule only — pin drafts to times and track todos.'}
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '12px 16px' }}>
        {chips.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            style={{
              padding: '5px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 11, fontWeight: 600,
              border: `1px solid ${filter === c.id ? P.accent : P.border}`,
              background: filter === c.id ? P.accentSoft : 'transparent',
              color: filter === c.id ? P.ink : P.muted,
            }}
          >
            {c.label}
            <span style={{ marginLeft: 6, opacity: 0.65 }}>{c.n}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 88px 72px 28px',
          gap: 6,
          padding: '6px 8px',
          fontSize: 10,
          color: P.faint,
          fontWeight: 650,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          <span>{zh ? '任务' : 'Task'}</span>
          <span>{zh ? '时间' : 'Date'}</span>
          <span>{zh ? '状态' : 'Status'}</span>
          <span />
        </div>
        {rows.length === 0 && (
          <div style={{ padding: '20px 8px', fontSize: 12, color: P.faint, lineHeight: 1.5 }}>
            {zh ? '还没有条目。下方添加，或从复用节点点「建议排期」。' : 'No rows yet. Add below, or use Suggest schedule on a repurpose node.'}
          </div>
        )}
        {rows.map(row => {
          const draft = draftNodes.find(d => d.id === row.contentNodeId)
          return (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 88px 72px 28px',
                gap: 6,
                alignItems: 'center',
                padding: '10px 8px',
                borderRadius: 10,
                border: `1px solid ${P.border}`,
                background: P.wellBg,
                marginBottom: 6,
                fontSize: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.title}
                </div>
                {draft && (
                  <div style={{ fontSize: 10, color: P.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    → {draft.title}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: P.muted }}>
                {row.at ? row.at.replace('T', ' ').slice(0, 16) : '—'}
              </div>
              <select
                className="nodrag nopan"
                value={row.status}
                onChange={e => onUpdate(row.id, { status: e.target.value as BoardTaskStatus })}
                style={{
                  fontSize: 11, borderRadius: 6, border: `1px solid ${P.border}`,
                  background: P.panelSolid, color: P.ink, padding: '4px 4px',
                }}
              >
                <option value="todo">{zh ? '待办' : 'To do'}</option>
                <option value="doing">{zh ? '进行中' : 'Doing'}</option>
                <option value="done">{zh ? '完成' : 'Done'}</option>
              </select>
              <button type="button" onClick={() => onRemove(row.id)} style={{ ...iconBtn(P), fontSize: 14 }}>×</button>
            </div>
          )
        })}
      </div>

      <div style={{
        padding: '12px 16px 16px', borderTop: `1px solid ${P.border}`,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 11, fontWeight: 650, color: P.muted }}>
          {zh ? '添加条目' : 'Add row'}
        </div>
        <ImeInput
          className="nodrag nopan"
          value={title}
          onValueChange={setTitle}
          placeholder={zh ? '任务名 / 发布锚点…' : 'Task / publish anchor…'}
          style={field(P)}
        />
        <input
          type="datetime-local"
          className="nodrag nopan"
          value={at}
          onChange={e => setAt(e.target.value)}
          style={field(P)}
        />
        <select
          className="nodrag nopan"
          value={contentNodeId}
          onChange={e => setContentNodeId(e.target.value)}
          style={field(P)}
        >
          <option value="">{zh ? '关联成稿（可选）' : 'Link draft (optional)'}</option>
          {draftNodes.map(d => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={!title.trim()}
          onClick={add}
          style={{
            padding: '10px 14px', borderRadius: 999, border: 'none', cursor: title.trim() ? 'pointer' : 'not-allowed',
            background: title.trim() ? P.accent : P.chipBg,
            color: title.trim() ? '#fff' : P.faint,
            fontWeight: 700, fontSize: 12,
          }}
        >
          {zh ? '加入看板' : 'Add to board'}
        </button>
      </div>
    </div>
  )
}

function field(P: WorkbenchPalette): CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box',
    padding: '8px 10px', borderRadius: 10,
    border: `1px solid ${P.border}`,
    background: P.wellBg, color: P.ink, fontSize: 12,
  }
}

function iconBtn(P: WorkbenchPalette): CSSProperties {
  return {
    width: 28, height: 28, borderRadius: 8, border: 'none',
    background: 'transparent', color: P.muted, cursor: 'pointer', fontSize: 18,
  }
}
