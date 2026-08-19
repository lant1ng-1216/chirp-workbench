'use client'
import { useMemo } from 'react'
import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: true })

/** Safe-ish markdown → HTML for Agent replies (no raw HTML passthrough). */
export function renderAgentMarkdown(md: string): string {
  const src = (md || '').trim()
  if (!src) return ''
  const html = marked.parse(src, { async: false }) as string
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
}

const MD_CSS = `
.chirp-md h1,.chirp-md h2,.chirp-md h3{margin:0.85em 0 0.35em;font-weight:700;color:#fff;line-height:1.35}
.chirp-md h1{font-size:15px}
.chirp-md h2{font-size:13.5px;letter-spacing:0.01em}
.chirp-md h3{font-size:12.5px}
.chirp-md p{margin:0.45em 0}
.chirp-md ul,.chirp-md ol{margin:0.4em 0;padding-left:1.25em}
.chirp-md li{margin:0.25em 0}
.chirp-md strong{color:#fff;font-weight:650}
.chirp-md a{color:#93c5fd}
.chirp-md code{font-family:ui-monospace,monospace;font-size:11px;background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px}
.chirp-md pre{background:rgba(0,0,0,0.35);padding:8px 10px;border-radius:8px;overflow:auto;margin:0.5em 0}
.chirp-md pre code{background:transparent;padding:0}
.chirp-md hr{border:none;border-top:1px solid rgba(255,255,255,0.1);margin:0.75em 0}
.chirp-md > :first-child{margin-top:0}
.chirp-md > :last-child{margin-bottom:0}
`

export function MarkdownBody({ text }: { text: string }) {
  const html = useMemo(() => renderAgentMarkdown(text), [text])
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MD_CSS }} />
      <div
        className="chirp-md"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          fontSize: 12.5,
          lineHeight: 1.6,
          color: 'rgba(255,255,255,0.88)',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      />
    </>
  )
}
