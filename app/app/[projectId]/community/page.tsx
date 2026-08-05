'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import type { Comment } from '@/lib/store'
import { SiYoutube, SiInstagram, SiTiktok, SiX } from 'react-icons/si'

const C = {
  bg:'#f2f3f7', bg1:'#ffffff', bg2:'#f7f8fa', bg3:'#eef0f4',
  ink:'#0f1117', ink2:'#2d3142', ink3:'#5c6070', ink4:'#9ea3b0',
  accent:'#3b82f6', green:'#10b981', orange:'#f59e0b', purple:'#8b5cf6', red:'#ef4444',
  border:'rgba(15,17,23,0.07)', borderS:'rgba(15,17,23,0.12)',
  shadow:'0 1px 2px rgba(15,17,23,0.05),0 4px 16px rgba(15,17,23,0.05)',
  shadowM:'0 2px 8px rgba(15,17,23,0.07),0 8px 28px rgba(15,17,23,0.07)',
}
const SANS = "'Inter',-apple-system,sans-serif"
const MONO = "'Space Mono',monospace"

const PLAT_META: Record<string, { Icon: any; color: string; bg: string }> = {
  youtube:   { Icon: SiYoutube,   color:'#ff0000', bg:'rgba(255,0,0,0.08)' },
  instagram: { Icon: SiInstagram, color:'#e1306c', bg:'rgba(225,48,108,0.08)' },
  tiktok:    { Icon: SiTiktok,    color:'#111827', bg:'rgba(0,0,0,0.07)' },
  twitter:   { Icon: SiX,         color:'#000000', bg:'rgba(0,0,0,0.07)' },
}

const SENTIMENT_META = {
  positive: { label: '正面', en: 'Positive', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  negative: { label: '负面', en: 'Negative', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  question: { label: '提问', en: 'Question',  color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  spam:     { label: '垃圾', en: 'Spam',      color: '#9ea3b0', bg: 'rgba(158,163,176,0.08)' },
  pending:  { label: '待分类', en: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
}

function CommentCard({ comment, zh, onApprove, onIgnore }: {
  comment: Comment; zh: boolean
  onApprove: (reply: string) => void
  onIgnore: () => void
}) {
  const plat = PLAT_META[comment.platform] ?? PLAT_META.youtube
  const PlatIcon = plat.Icon
  const sent = SENTIMENT_META[comment.sentiment]
  const [editedReply, setEditedReply] = useState(comment.pipReply)
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (comment.status !== 'pending') return null

  return (
    <div style={{ background:C.bg1, borderRadius:12, border:`1px solid ${C.borderS}`, overflow:'hidden', boxShadow:C.shadow }}>
      {/* Comment header */}
      <div style={{ padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }} onClick={() => setExpanded(e => !e)}>
        {/* Platform icon */}
        <div style={{ width:28, height:28, borderRadius:7, background:plat.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <PlatIcon size={13} color={plat.color} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontWeight:600, fontSize:12, color:C.ink }}>{comment.author}</span>
            <span style={{ fontFamily:MONO, fontSize:8, padding:'2px 7px', borderRadius:99, background:sent.bg, color:sent.color }}>
              {zh ? sent.label : sent.en}
            </span>
            <span style={{ fontFamily:MONO, fontSize:8, color:C.ink4, marginLeft:'auto' }}>
              {new Date(comment.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
            </span>
          </div>
          <p style={{ fontFamily:SANS, fontSize:12, color:C.ink2, margin:0, lineHeight:1.6,
            ...(expanded ? {} : { overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' })
          }}>
            {comment.text}
          </p>
        </div>
        <svg width="12" height="12" fill="none" stroke={C.ink4} strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink:0, transform: expanded ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Pip reply suggestion */}
      {expanded && comment.sentiment !== 'spam' && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'12px 14px', background:'rgba(59,130,246,0.02)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            <div style={{ width:16, height:16, borderRadius:4, background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="8" height="8" fill="#fff" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <span style={{ fontFamily:MONO, fontSize:8, color:C.accent }}>Pip {zh?'回复建议':'SUGGESTED REPLY'}</span>
            <button onClick={() => setEditing(e=>!e)} style={{ marginLeft:'auto', fontFamily:MONO, fontSize:8, padding:'2px 8px', borderRadius:5, border:`1px solid ${C.borderS}`, background:editing?C.accent:'transparent', color:editing?'#fff':C.ink4, cursor:'pointer' }}>
              {editing ? (zh?'完成':'Done') : (zh?'编辑':'Edit')}
            </button>
          </div>
          {editing ? (
            <textarea value={editedReply} onChange={e=>setEditedReply(e.target.value)} style={{ width:'100%', minHeight:80, border:`1px solid rgba(59,130,246,0.3)`, borderRadius:8, padding:'10px 12px', fontFamily:SANS, fontSize:12, color:C.ink2, lineHeight:1.6, resize:'vertical', outline:'none', background:C.bg2, boxSizing:'border-box' as const }} />
          ) : (
            <p style={{ fontFamily:SANS, fontSize:12, color:C.ink3, margin:0, lineHeight:1.7, background:C.bg2, borderRadius:8, padding:'10px 12px', border:`1px solid ${C.border}` }}>
              {editedReply}
            </p>
          )}

          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <button onClick={() => onApprove(editedReply)} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:C.green, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
              ✓ {zh?'批准回复':'Approve Reply'}
            </button>
            <button onClick={onIgnore} style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${C.borderS}`, background:'transparent', color:C.ink4, fontSize:12, cursor:'pointer' }}>
              {zh?'忽略':'Ignore'}
            </button>
          </div>
        </div>
      )}

      {/* Spam quick action */}
      {expanded && comment.sentiment === 'spam' && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:MONO, fontSize:9, color:C.ink4, flex:1 }}>{zh?'Pip 识别为垃圾信息':'Pip flagged as spam'}</span>
          <button onClick={onIgnore} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:'rgba(239,68,68,0.1)', color:C.red, fontWeight:600, fontSize:11, cursor:'pointer' }}>
            {zh?'删除':'Delete'}
          </button>
          <button onClick={() => onApprove('')} style={{ padding:'6px 14px', borderRadius:7, border:`1px solid ${C.borderS}`, background:'transparent', color:C.ink4, fontSize:11, cursor:'pointer' }}>
            {zh?'误判，保留':'Keep'}
          </button>
        </div>
      )}
    </div>
  )
}

/* Local fallback classifier — used only if the Pip API call fails */
function fallbackClassify(text: string): { sentiment: Comment['sentiment']; reply: string } {
  const t = text.toLowerCase()
  if (/buy followers|dm me|crypto|whatsapp|promote|check my page|免费领|加vx/i.test(t))
    return { sentiment: 'spam', reply: '' }
  if (/\?|what|how|which|when|where|can you|could you|什么|怎么|如何|哪|吗/i.test(t))
    return { sentiment: 'question', reply: 'Great question! Let me get back to you with the details shortly — thanks for asking! 🙌' }
  if (/hate|worst|bad|boring|trash|disappoint|awful|差|烂|无聊|失望/i.test(t))
    return { sentiment: 'negative', reply: 'Thanks for the honest feedback — we hear you and will do better on the next one.' }
  return { sentiment: 'positive', reply: 'Thank you so much for the support — it means a lot! 🙌' }
}

export default function CommunityPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { projects, comments, addMockComments, updateComment, lang, communityState, setCommunityState } = useMingStore()
  const zh = lang === 'zh'
  const [filter, setFilter] = useState<'all'|'positive'|'negative'|'question'|'spam'>('all')
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [digestLoading, setDigestLoading] = useState(false)

  useEffect(() => { addMockComments(projectId) }, [projectId])

  const project = projects.find(p => p.id === projectId)
  const alias = project?.brand.mindsConversationAlias
  const digest = communityState[projectId]?.lastDigest
  const digestAt = communityState[projectId]?.digestUpdatedAt

  const projectComments = comments.filter(c => c.projectId === projectId)
  const pending = projectComments.filter(c => c.status === 'pending')
  const filtered = filter === 'all' ? pending : pending.filter(c => c.sentiment === filter)

  const stats = {
    total: pending.length,
    positive: pending.filter(c=>c.sentiment==='positive').length,
    negative: pending.filter(c=>c.sentiment==='negative').length,
    question: pending.filter(c=>c.sentiment==='question').length,
    spam: pending.filter(c=>c.sentiment==='spam').length,
  }

  const handlePaste = async () => {
    if (!pasteText.trim() || analyzing) return
    const lines = pasteText.split('\n').filter(l=>l.trim())
    const newComments: Comment[] = lines.map((line, i) => {
      const parts = line.split(':')
      const author = parts.length > 1 ? parts[0].trim() : `User${i+1}`
      const text = parts.length > 1 ? parts.slice(1).join(':').trim() : line.trim()
      return {
        id: `c-paste-${Date.now()}-${i}`,
        projectId, platform: 'youtube', author, text,
        sentiment: 'pending' as const, pipReply: '',
        status: 'pending' as const, createdAt: new Date().toISOString(),
      }
    })
    const { addComment } = useMingStore.getState()
    newComments.forEach(c => addComment(c))
    setPasteText(''); setPasteMode(false)

    // Classify with Pip (real Minds call, user-triggered); fall back to local heuristic
    setAnalyzing(true)
    try {
      if (!alias) throw new Error('no alias')
      const res = await fetch('/api/minds/classify-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias,
          profile: project?.brand,
          comments: newComments.map(c => ({ id: c.id, author: c.author, text: c.text, platform: c.platform })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'failed')
      ;(data.results ?? []).forEach((r: { id: string; sentiment: Comment['sentiment']; reply: string }) => {
        updateComment(r.id, { sentiment: r.sentiment, pipReply: r.reply })
      })
    } catch {
      newComments.forEach(c => {
        const fb = fallbackClassify(c.text)
        updateComment(c.id, { sentiment: fb.sentiment, pipReply: fb.reply })
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const generateDigest = async () => {
    if (!alias || digestLoading) return
    setDigestLoading(true)
    try {
      const res = await fetch('/api/minds/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias, profile: project?.brand }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'failed')
      setCommunityState(projectId, { lastDigest: data.digest, digestUpdatedAt: new Date().toISOString() })
    } catch (e) {
      setCommunityState(projectId, {
        lastDigest: `${zh ? '日报生成失败' : 'Digest failed'}: ${e instanceof Error ? e.message : 'unknown'}`,
        digestUpdatedAt: new Date().toISOString(),
      })
    } finally {
      setDigestLoading(false)
    }
  }

  return (
    <div style={{ height:'100%', overflowY:'auto', background:C.bg, fontFamily:SANS }}>
      {/* Header */}
      <div style={{ background:C.bg1, borderBottom:`1px solid ${C.border}`, padding:'16px 24px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontWeight:700, fontSize:18, color:C.ink, margin:'0 0 2px', letterSpacing:'-0.02em' }}>
              {zh?'社区助手':'Community'}
            </h1>
            <p style={{ fontFamily:MONO, fontSize:10, color:C.ink4, margin:0 }}>
              {zh?'Pip 自动分类评论，起草回复建议':'Pip auto-classifies comments and drafts replies'}
            </p>
          </div>
          <button onClick={() => setPasteMode(m=>!m)} disabled={analyzing} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, background:pasteMode?C.bg3:'linear-gradient(135deg,#3b82f6,#6366f1)', color:pasteMode?C.ink2:'#fff', border:pasteMode?`1px solid ${C.borderS}`:'none', cursor:'pointer', fontWeight:700, fontSize:12, boxShadow:pasteMode?'none':'0 2px 8px rgba(99,102,241,0.25)', opacity:analyzing?0.6:1 }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            {analyzing ? (zh?'Pip 分类中…':'Pip classifying…') : (zh?'粘贴评论':'Paste Comments')}
          </button>
        </div>
      </div>

      <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

        {/* Paste panel */}
        {pasteMode && (
          <div style={{ background:C.bg1, borderRadius:14, border:`1px solid ${C.borderS}`, padding:'16px 18px', boxShadow:C.shadow }}>
            <div style={{ fontFamily:MONO, fontSize:9, color:C.ink4, marginBottom:8 }}>
              {zh?'粘贴评论内容（每行一条，格式：作者: 内容）':'Paste comments below (one per line, format: Author: text)'}
            </div>
            <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)} placeholder={zh?'TechViewer88: 这个视频太有用了！\ncreative_luna: 音质能改善一下吗':'TechViewer88: This video is so useful!\ncreative_luna: Could the audio quality be better?'} style={{ width:'100%', minHeight:100, border:`1px solid ${C.borderS}`, borderRadius:8, padding:'10px 12px', fontFamily:SANS, fontSize:12, color:C.ink2, resize:'vertical', outline:'none', boxSizing:'border-box' as const }} />
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              <button onClick={handlePaste} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:C.accent, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                {zh?'让 Pip 分析':'Analyze with Pip'}
              </button>
              <button onClick={()=>{setPasteMode(false);setPasteText('')}} style={{ padding:'8px 14px', borderRadius:8, border:`1px solid ${C.borderS}`, background:'transparent', color:C.ink4, fontSize:12, cursor:'pointer' }}>
                {zh?'取消':'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display:'flex', gap:8 }}>
          {[
            { key:'all',      label:zh?'全部':'All',       n:stats.total,    color:C.ink3 },
            { key:'positive', label:zh?'正面':'Positive',  n:stats.positive, color:C.green },
            { key:'negative', label:zh?'负面':'Negative',  n:stats.negative, color:C.red },
            { key:'question', label:zh?'提问':'Questions', n:stats.question, color:C.accent },
            { key:'spam',     label:zh?'垃圾':'Spam',      n:stats.spam,     color:C.ink4 },
          ].map(s => (
            <button key={s.key} onClick={() => setFilter(s.key as any)} style={{
              display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9,
              border:`1px solid ${filter===s.key ? s.color+'44' : C.borderS}`,
              background: filter===s.key ? `${s.color}10` : C.bg1,
              color: filter===s.key ? s.color : C.ink3,
              cursor:'pointer', fontFamily:MONO, fontSize:10,
              boxShadow: filter===s.key ? C.shadow : 'none',
              transition:'all 0.15s',
            }}>
              <span style={{ fontWeight:700 }}>{s.n}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Sentiment summary */}
        <div style={{ background:C.bg1, borderRadius:12, border:`1px solid ${C.borderS}`, padding:'14px 18px', boxShadow:C.shadow }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:16, height:16, borderRadius:4, background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="8" height="8" fill="#fff" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <span style={{ fontFamily:MONO, fontSize:9, color:C.accent }}>{zh?'Pip 社区情绪摘要':'PIP COMMUNITY SENTIMENT'}</span>
          </div>
          {/* Sentiment bar */}
          <div style={{ display:'flex', height:8, borderRadius:99, overflow:'hidden', marginBottom:8 }}>
            {stats.total > 0 && [
              { n:stats.positive, color:C.green },
              { n:stats.question, color:C.accent },
              { n:stats.negative, color:C.red },
              { n:stats.spam,     color:C.ink4 },
            ].map((s,i) => s.n > 0 && (
              <div key={i} style={{ flex:s.n, background:s.color, opacity:0.8 }} />
            ))}
          </div>
          <p style={{ fontFamily:SANS, fontSize:12, color:C.ink3, margin:0, lineHeight:1.7 }}>
            {zh
              ? `本批 ${stats.total} 条评论中，正面互动占比 ${stats.total?Math.round(stats.positive/stats.total*100):0}%，社区情绪整体积极。${stats.spam>0?`发现 ${stats.spam} 条垃圾信息已标记。`:''}建议优先回复提问类评论以提升互动率。`
              : `Of ${stats.total} comments, ${stats.total?Math.round(stats.positive/stats.total*100):0}% are positive — overall community sentiment is healthy. ${stats.spam>0?`${stats.spam} spam flagged. `:''}Prioritize replying to questions to boost engagement.`
            }
          </p>
        </div>

        {/* Pip daily digest (on-demand, wired to CommunityState) */}
        <div style={{ background:C.bg1, borderRadius:12, border:`1px solid ${C.borderS}`, padding:'14px 18px', boxShadow:C.shadow }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: digest ? 10 : 0 }}>
            <div style={{ width:16, height:16, borderRadius:4, background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="8" height="8" fill="#fff" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <span style={{ fontFamily:MONO, fontSize:9, color:C.accent }}>{zh?'Pip 社区日报':'PIP DAILY DIGEST'}</span>
            {digestAt && <span style={{ fontFamily:MONO, fontSize:8, color:C.ink4 }}>{digestAt.slice(0,10)} {digestAt.slice(11,16)}</span>}
            <button onClick={generateDigest} disabled={digestLoading || !alias} style={{
              marginLeft:'auto', padding:'5px 12px', borderRadius:7, border:'none',
              background: digestLoading ? C.bg3 : C.accent, color: digestLoading ? C.ink4 : '#fff',
              fontFamily:MONO, fontSize:9, cursor: digestLoading ? 'not-allowed' : 'pointer',
            }}>
              {digestLoading ? (zh?'生成中…':'Generating…') : digest ? (zh?'重新生成':'Regenerate') : (zh?'生成日报':'Generate digest')}
            </button>
          </div>
          {digest ? (
            <p style={{ fontFamily:SANS, fontSize:12, color:C.ink2, margin:0, lineHeight:1.8, whiteSpace:'pre-wrap' }}>{digest}</p>
          ) : (
            <p style={{ fontFamily:SANS, fontSize:11, color:C.ink4, margin:'8px 0 0', lineHeight:1.6 }}>
              {zh ? '点击生成，Pip 会汇总今日社区动态（消息量、回复数、热点话题），日报可推送到 Telegram / Email。' : 'Click generate — Pip summarizes today\'s community activity (messages, replies, hot topics). The digest can be pushed to Telegram / Email.'}
            </p>
          )}
        </div>

        {/* Comment list */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontFamily:MONO, fontSize:8, color:C.ink4, letterSpacing:'0.04em' }}>
            {zh ? '示例收件箱 · 接入平台 API 后显示真实评论' : 'Sample inbox · live comments appear once a platform API is connected'}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px', color:C.ink4, fontFamily:SANS, fontSize:13 }}>
              {zh?'没有待处理的评论 ✓':'No pending comments ✓'}
            </div>
          )}
          {filtered.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              zh={zh}
              onApprove={(reply) => updateComment(comment.id, { status:'replied', pipReply:reply })}
              onIgnore={() => updateComment(comment.id, { status:'ignored' })}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
