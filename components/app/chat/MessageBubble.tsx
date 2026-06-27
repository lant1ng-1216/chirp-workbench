'use client'
import { useState } from 'react'
import ToolCallCard from './ToolCallCard'
import type { Message } from '@/lib/brand'

interface Props {
  message: Message
  isStreaming?: boolean
}

/* ── Detect platform section header lines ── */
const PLATFORM_KEYWORDS = ['小红书', '微博', '抖音', 'B站', 'b站', 'bilibili', 'Bilibili', 'Twitter', 'Instagram', '微信', 'LinkedIn', '知乎', 'YouTube', 'TikTok']

function isPlatformHeader(line: string) {
  const t = line.trim()
  if (!t || t.length > 40) return false
  // Must contain a platform keyword
  if (!PLATFORM_KEYWORDS.some(kw => t.includes(kw))) return false
  // Must not end with a sentence-ending punctuation (not a sentence, just a label)
  if (/[。，！？,.!?：:]\s*$/.test(t)) return false
  return true
}

/* Strip markdown for clean copy text */
function stripMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`(.+?)`/g, '$1')
    .trim()
}

/* Split AI content into platform blocks + a preamble */
interface ContentBlock {
  header: string   // e.g. "📕 小红书·种草科普"
  body: string     // text of this section
}

function parseContentBlocks(content: string): { preamble: string; blocks: ContentBlock[] } {
  const lines = content.split('\n')
  const blocks: ContentBlock[] = []
  let preamble = ''
  let currentHeader = ''
  let currentLines: string[] = []
  let inBlock = false

  for (const line of lines) {
    if (isPlatformHeader(line)) {
      if (inBlock) {
        blocks.push({ header: currentHeader, body: currentLines.join('\n').trim() })
      } else {
        preamble = currentLines.join('\n').trim()
      }
      currentHeader = line.trim()
      currentLines = []
      inBlock = true
    } else {
      currentLines.push(line)
    }
  }

  if (inBlock) {
    blocks.push({ header: currentHeader, body: currentLines.join('\n').trim() })
  } else {
    preamble = currentLines.join('\n').trim()
  }

  return { preamble, blocks }
}

/* ── Copy button ── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(stripMarkdown(text))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea')
      el.value = stripMarkdown(text)
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <button onClick={handleCopy} title={copied ? '已复制' : '复制此平台文案'}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 9px', borderRadius: 7,
        border: `1px solid ${copied ? 'rgba(28,58,46,0.25)' : 'rgba(26,25,22,0.12)'}`,
        background: copied ? 'rgba(28,58,46,0.08)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(4px)',
        color: copied ? '#1c3a2e' : '#9a9894',
        cursor: 'pointer',
        fontSize: 11,
        fontFamily: "'Space Mono', monospace",
        letterSpacing: '0.03em',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}>
      {copied
        ? <><span style={{ fontSize: 11 }}>✓</span> 已复制</>
        : <><span style={{ fontSize: 11 }}>⎘</span> 复制</>
      }
    </button>
  )
}

/* ── Inline text renderer (bold / newlines) ── */
function RenderText({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
      {isStreaming && <span className="streaming-cursor" />}
    </>
  )
}

/* ── Platform block card ── */
function PlatformBlock({ header, body, isStreaming }: ContentBlock & { isStreaming?: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        marginTop: 14,
        borderRadius: 12,
        border: '1px solid rgba(26,25,22,0.1)',
        background: 'white',
        overflow: 'hidden',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        borderColor: hovered ? 'rgba(28,58,46,0.28)' : 'rgba(26,25,22,0.12)',
        boxShadow: hovered ? '0 2px 10px rgba(26,25,22,0.06)' : 'none',
      }}>

      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 14px',
        background: 'rgba(26,25,22,0.04)',
        borderBottom: '1px solid rgba(26,25,22,0.07)',
      }}>
        <span style={{
          fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif",
          fontSize: 12, fontWeight: 600, color: '#4a4844',
        }}>
          {header}
        </span>
        <div style={{
          opacity: hovered ? 1 : 0.45,
          transition: 'opacity 0.15s',
        }}>
          <CopyButton text={`${header}\n${body}`} />
        </div>
      </div>

      {/* Section body */}
      <div style={{
        padding: '12px 14px',
        fontSize: 13.5,
        lineHeight: 1.85,
        color: '#1a1916',
        fontFamily: "'Noto Serif SC', Georgia, serif",
        fontWeight: 300,
        whiteSpace: 'pre-wrap',
      }}>
        <RenderText text={body} isStreaming={isStreaming} />
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, paddingLeft: 40 }}>
        <div style={{
          padding: '10px 16px', borderRadius: '16px 4px 16px 16px',
          background: 'var(--color-primary)', color: 'white',
          fontSize: 14, lineHeight: 1.6, maxWidth: '75%',
        }}>
          {message.content}
        </div>
      </div>
    )
  }

  const { preamble, blocks } = parseContentBlocks(message.content || '')
  const hasBlocks = blocks.length > 0

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, paddingRight: 40 }}>
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #6C63FF, #FF6B6B)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>🤖</div>
      </div>

      <div style={{ flex: 1 }}>
        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {message.toolCalls.map((tc, i) => (
              <ToolCallCard key={i} toolName={tc.toolName} args={tc.args} result={tc.result} status={tc.status} />
            ))}
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <div style={{
            padding: '12px 16px', borderRadius: '4px 16px 16px 16px',
            background: 'white', border: '1px solid var(--color-border)',
            fontSize: 14, lineHeight: 1.75, color: 'var(--color-text-main)',
            boxShadow: '0 1px 4px rgba(108,99,255,0.06)',
          }}>

            {/* Preamble (text before any platform block) */}
            {preamble && (
              <div style={{
                borderLeft: '3px solid var(--color-primary)', paddingLeft: 10,
                whiteSpace: 'pre-wrap',
                marginBottom: hasBlocks ? 4 : 0,
                fontFamily: "'Noto Serif SC', Georgia, serif",
                fontWeight: 300,
              }}>
                <RenderText text={preamble} isStreaming={isStreaming && !hasBlocks} />
              </div>
            )}

            {/* Platform blocks */}
            {blocks.map((block, i) => (
              <PlatformBlock
                key={i}
                header={block.header}
                body={block.body}
                isStreaming={isStreaming && i === blocks.length - 1}
              />
            ))}

            {/* Streaming cursor when no content yet */}
            {isStreaming && !message.content.trim() && (
              <span className="streaming-cursor" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
