'use client'
import { useState, type CSSProperties, type ReactNode } from 'react'
import {
  CREATOR_TEMPLATES,
  OFFICIAL_TEMPLATES,
  type TemplateId,
  type WorkflowTemplate,
} from '@/lib/templates/catalog'

type Tab = 'official' | 'creator'

export default function TemplateMarket({
  zh,
  onClose,
  onUse,
}: {
  zh: boolean
  onClose: () => void
  onUse: (id: TemplateId) => void
}) {
  const [tab, setTab] = useState<Tab>('official')
  const list = tab === 'official' ? OFFICIAL_TEMPLATES : CREATOR_TEMPLATES

  return (
    <div
      role="dialog"
      aria-modal
      aria-label={zh ? '模板市场' : 'Template market'}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        background: 'rgba(0,0,0,0.62)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(920px, 100%)',
          maxHeight: 'min(720px, 90vh)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #121212 100%)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
          overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
          color: '#e8eaef',
        }}
      >
        <header style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <ShopGlyph size={22} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.2px' }}>
              {zh ? '模板市场' : 'Template market'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', marginTop: 2 }}>
              {zh ? '一键落到画布，填入素材即可使用' : 'Drop onto the canvas, fill in your assets, go'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={iconBtn}
            title={zh ? '关闭' : 'Close'}
          >×</button>
        </header>

        <div style={{ display: 'flex', gap: 6, padding: '12px 22px 0' }}>
          <TabBtn active={tab === 'official'} onClick={() => setTab('official')}>
            {zh ? '官方模板' : 'Official'}
          </TabBtn>
          <TabBtn active={tab === 'creator'} onClick={() => setTab('creator')}>
            {zh ? '创作者精选' : 'Creators'}
          </TabBtn>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 22px 22px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 14, alignContent: 'start',
        }}>
          {list.length === 0 && (
            <div style={{
              gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center',
              color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6,
            }}>
              {zh
                ? '创作者上传即将开放。优秀工作流上架后会出现在这里。'
                : 'Creator uploads coming soon. Standout workflows will show up here.'}
            </div>
          )}
          {list.map(t => (
            <TemplateCard key={t.id} t={t} zh={zh} onUse={() => onUse(t.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TemplateCard({
  t, zh, onUse,
}: {
  t: WorkflowTemplate
  zh: boolean
  onUse: () => void
}) {
  const tags = zh ? t.tags.zh : t.tags.en
  return (
    <article style={{
      display: 'flex', flexDirection: 'column',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.03)',
      overflow: 'hidden',
      minHeight: 210,
    }}>
      <div style={{
        height: 72,
        background: `linear-gradient(135deg, ${t.accent}33 0%, rgba(255,255,255,0.04) 70%)`,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'flex-end', padding: '10px 14px',
        gap: 6, flexWrap: 'wrap',
      }}>
        {tags.map(tag => (
          <span key={tag} style={{
            fontSize: 10, padding: '3px 7px', borderRadius: 6,
            background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.7)',
          }}>{tag}</span>
        ))}
      </div>
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{zh ? t.title.zh : t.title.en}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 3 }}>
            {t.authorType === 'official' ? (zh ? '官方 · ' : 'Official · ') : ''}{t.authorName}
          </div>
        </div>
        <p style={{
          margin: 0, fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.52)', flex: 1,
        }}>
          {zh ? t.description.zh : t.description.en}
        </p>
        <button
          type="button"
          onClick={onUse}
          style={{
            marginTop: 4, width: '100%', padding: '9px 12px', borderRadius: 10,
            border: 'none', cursor: 'pointer', fontWeight: 650, fontSize: 12,
            background: t.accent, color: '#fff',
          }}
        >
          {zh ? '使用模板' : 'Use template'}
        </button>
      </div>
    </article>
  )
}

function TabBtn({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 600,
        border: `1px solid ${active ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.1)'}`,
        background: active ? 'rgba(59,130,246,0.18)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.55)',
      }}
    >
      {children}
    </button>
  )
}

const iconBtn: CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)',
  cursor: 'pointer', fontSize: 18, lineHeight: 1,
}

export function ShopGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9h16l-1.2 10.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 9Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
      />
      <path
        d="M8 9V7a4 4 0 0 1 8 0v2"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      />
    </svg>
  )
}
