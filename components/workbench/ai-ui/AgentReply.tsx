'use client'
import { useEffect, useMemo, type ReactNode } from 'react'
import { ensureAiUiKeyframes } from './AgentLoading'
import { MarkdownBody } from './MarkdownBody'
import { TaskRows } from './ThinkingBlock'
import { useSimulatedStream } from './StreamingMessage'
import { markdownWithoutPlanSteps } from '@/lib/workbench/planFormat'
import type { AgentReplyKind } from '@/lib/workbench/agentIntent'
import type { MarketingAngle } from '@/lib/workbench/marketing'
import { DeliverableAngles, ToolChips } from './ToolChips'

/**
 * Agent reply by kind — Claude/Codex timeline piece + Beautiful UI primitives.
 */
export function AgentReply({
  text,
  streaming = true,
  kind = 'chat',
  planSteps,
  planTaskStatus,
  followUps,
  tools,
  angles,
  zh,
  onFollowUp,
  actions,
  thinking,
}: {
  text: string
  streaming?: boolean
  kind?: AgentReplyKind
  planSteps?: Array<{ id: string; title: string }>
  /** When set, TaskRows use live statuses (P2 pipeline). */
  planTaskStatus?: Array<{ id: string; title: string; status: 'running' | 'done' | 'error' | 'pending'; meta?: string }>
  followUps?: string[]
  tools?: Array<{ id: string; label: string; status?: 'done' | 'running' | 'error' | 'pending' }>
  angles?: MarketingAngle[]
  zh?: boolean
  onFollowUp?: (q: string) => void
  actions?: ReactNode
  thinking?: ReactNode
}) {
  const structuredPlan = kind === 'plan' && (planSteps?.length ?? 0) >= 2
  const displaySrc = useMemo(
    () => (structuredPlan ? markdownWithoutPlanSteps(text) : text),
    [structuredPlan, text],
  )
  const showAngles = kind === 'deliverable' && (angles?.length ?? 0) >= 2
  const { visible, done } = useSimulatedStream(
    showAngles ? '' : displaySrc,
    streaming && !showAngles,
    64,
  )
  useEffect(() => { ensureAiUiKeyframes() }, [])

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {thinking}

      {tools && tools.length > 0 && <ToolChips items={tools} />}

      {showAngles ? (
        <DeliverableAngles
          angles={angles!}
          intro={text && !text.includes('Headline:') ? text : undefined}
          streaming={streaming}
          zh={zh}
        />
      ) : (
        <div style={{
          padding: '12px 14px',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.045)',
          border: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
        }}>
          <MarkdownBody text={visible} />
          {!done && (
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 2,
                height: '0.95em',
                marginLeft: 2,
                verticalAlign: '-2px',
                background: 'rgba(255,255,255,0.85)',
                animation: 'chirp-caret 0.9s steps(1) infinite',
              }}
            />
          )}
        </div>
      )}

      {done && structuredPlan && (
        <div style={{
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.025)',
          padding: '8px 10px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 650, letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase',
          }}>
            {zh ? '分步 Plan' : 'Plan steps'}
          </div>
          <TaskRows items={planSteps!.map((s, i) => ({
            id: s.id,
            title: `${i + 1}. ${s.title}`,
            status: 'pending' as const,
          }))} />
        </div>
      )}

      {planTaskStatus && planTaskStatus.length > 0 && (
        <div style={{
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.025)',
          padding: '8px 10px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 650, letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase',
          }}>
            {zh ? '管线' : 'Pipeline'}
          </div>
          <TaskRows items={planTaskStatus} />
        </div>
      )}

      {actions && (
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
          paddingTop: 2,
        }}>
          {actions}
        </div>
      )}

      {((showAngles && true) || done) && followUps && followUps.length > 0 && onFollowUp && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {followUps.map(q => (
            <button
              key={q}
              type="button"
              onClick={() => onFollowUp(q)}
              style={{
                padding: '6px 10px', borderRadius: 999, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.72)', fontSize: 11, lineHeight: 1.35,
                maxWidth: '100%', textAlign: 'left',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
