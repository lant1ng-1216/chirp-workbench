'use client'

interface ToolCallCardProps {
  toolName: string
  args?: Record<string, unknown>
  result?: unknown
  status: 'running' | 'done' | 'error'
}

const TOOL_LABELS: Record<string, { icon: string; label: string }> = {
  get_trending_topics: { icon: '🔍', label: '获取热点话题' },
  generate_post: { icon: '✍️', label: '生成内容草稿' },
  schedule_post: { icon: '📅', label: '加入发布日历' },
  publish_post: { icon: '📤', label: '发布到平台' },
  analyze_competitor: { icon: '🕵️', label: '分析竞品数据' },
  create_content_plan: { icon: '🗓️', label: '创建内容计划' },
}

export default function ToolCallCard({ toolName, args, result, status }: ToolCallCardProps) {
  const info = TOOL_LABELS[toolName] || { icon: '🔧', label: toolName }

  return (
    <div className="tool-call-enter" style={{
      padding: '10px 14px', borderRadius: 10, marginBottom: 6,
      background: status === 'running' ? 'rgba(108,99,255,0.04)' : status === 'done' ? 'rgba(16,185,129,0.04)' : 'rgba(255,107,107,0.04)',
      border: `1px solid ${status === 'running' ? 'rgba(108,99,255,0.15)' : status === 'done' ? 'rgba(16,185,129,0.2)' : 'rgba(255,107,107,0.2)'}`,
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span>{info.icon}</span>
        <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{info.label}</span>
        {status === 'running' && (
          <span style={{ color: 'var(--color-primary)', animation: 'pulse-soft 1.5s infinite', fontSize: 10 }}>进行中...</span>
        )}
        {status === 'done' && <span style={{ color: '#10b981', fontSize: 11 }}>✅ 完成</span>}
        {status === 'error' && <span style={{ color: 'var(--color-accent)', fontSize: 11 }}>❌ 失败</span>}
      </div>

      {args && (
        <div style={{ marginTop: 5, color: 'var(--color-text-muted)', fontSize: 11 }}>
          {Object.entries(args).map(([k, v]) => (
            <span key={k} style={{ marginRight: 10 }}>
              <span style={{ opacity: 0.6 }}>{k}:</span>{' '}
              <span style={{ fontFamily: 'monospace' }}>
                {typeof v === 'string' ? v : JSON.stringify(v)}
              </span>
            </span>
          ))}
        </div>
      )}

      {result !== undefined && status === 'done' && (
        <div style={{ marginTop: 5, color: 'var(--color-text-muted)', fontSize: 11 }}>
          {typeof result === 'object' && result !== null && 'message' in result
            ? String((result as { message: string }).message)
            : String(JSON.stringify(result)).slice(0, 120) + '...'}
        </div>
      )}
    </div>
  )
}
