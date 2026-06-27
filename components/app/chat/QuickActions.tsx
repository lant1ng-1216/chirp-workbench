'use client'

const QUICK_ACTIONS = [
  '今天发什么',
  '下周每天 2 帖',
  '下个月内容安排',
  '看看接下来要发什么',
  '本周战报',
  '帮我写一条小红书',
]

interface Props {
  onSelect: (text: string) => void
}

export default function QuickActions({ onSelect }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          style={{
            padding: '7px 14px', borderRadius: 20,
            border: '1.5px solid var(--color-border)',
            background: 'white', cursor: 'pointer',
            fontSize: 12, color: 'var(--color-text-main)',
            fontWeight: 500, transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary-light)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-main)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'white'
          }}
        >
          {action}
        </button>
      ))}
    </div>
  )
}
