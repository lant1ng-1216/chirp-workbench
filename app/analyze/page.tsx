'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import LeftSidebar from '@/components/app/layout/LeftSidebar'

const C = {
  bg:      '#faf9f7',
  bg2:     '#f4f2ee',
  bg3:     '#edeae4',
  ink:     '#1a1916',
  ink2:    '#4a4844',
  ink3:    '#9a9894',
  ink4:    '#c8c6c0',
  accent:  '#1c3a2e',
  al:      'rgba(28,58,46,0.08)',
  al2:     'rgba(28,58,46,0.15)',
  gold:    '#7a6020',
  gl:      '#f5f0e8',
  border:  'rgba(26,25,22,0.08)',
  border2: 'rgba(26,25,22,0.14)',
  shadow:  '0 1px 3px rgba(26,25,22,0.06),0 4px 12px rgba(26,25,22,0.04)',
  ming:    '#5b4eb8',
}
const SERIF = "'Noto Serif SC', Georgia, serif"
const MONO  = "'Space Mono', monospace"
const SANS  = "'Noto Sans SC', 'PingFang SC', sans-serif"

const PLATFORMS = [
  { id: 'xiaohongshu', label: '小红书' },
  { id: 'douyin',      label: '抖音' },
  { id: 'weibo',       label: '微博' },
  { id: 'bilibili',    label: 'B站' },
  { id: 'wechat',      label: '微信公众号' },
  { id: 'twitter',     label: 'Twitter/X' },
  { id: 'instagram',   label: 'Instagram' },
  { id: 'general',     label: '其他' },
]

function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div style={{ fontFamily: SERIF, fontSize: 14, color: C.ink2, lineHeight: 2 }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return (
          <div key={i} style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.accent, margin: '20px 0 8px', letterSpacing: '0.01em' }}>{line.replace('## ', '')}</div>
        )
        if (line.startsWith('### ')) return (
          <div key={i} style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.ink, margin: '14px 0 6px' }}>{line.replace('### ', '')}</div>
        )
        if (line.startsWith('- **') || line.startsWith('- ')) {
          const bold = line.replace(/^- \*\*(.+?)\*\*：?/, (_, m) => `<b>${m}</b>：`)
          return <div key={i} style={{ paddingLeft: 16, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: '· ' + bold.replace(/^- /, '') }} />
        }
        if (line.startsWith('**') && line.endsWith('**')) return (
          <div key={i} style={{ fontWeight: 600, color: C.ink, marginBottom: 4 }}>{line.replace(/\*\*/g, '')}</div>
        )
        if (line.trim() === '---') return <div key={i} style={{ height: 1, background: C.border2, margin: '16px 0' }} />
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />
        const withBold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        return <div key={i} dangerouslySetInnerHTML={{ __html: withBold }} style={{ marginBottom: 2 }} />
      })}
    </div>
  )
}

export default function AnalyzePage() {
  const router = useRouter()
  const { projects, addKnowledgeDoc } = useMingStore()

  const [url,      setUrl]      = useState('')
  const [text,     setText]     = useState('')
  const [platform, setPlatform] = useState('xiaohongshu')
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url')

  const [loading,   setLoading]   = useState(false)
  const [analysis,  setAnalysis]  = useState('')
  const [rawContent, setRawContent] = useState('')
  const [fetchError, setFetchError] = useState('')

  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [adapting,  setAdapting]  = useState(false)
  const [adaptation, setAdaptation] = useState('')
  const [saved,     setSaved]     = useState(false)

  const analysisRef = useRef('')
  const adaptationRef = useRef('')

  const activeProject = projects[0]

  useEffect(() => {
    if (projects.length > 0 && !selectedBrand) setSelectedBrand(projects[0].id)
  }, [projects])

  const runAnalysis = async () => {
    if (inputMode === 'url' && !url.trim()) return
    if (inputMode === 'text' && !text.trim()) return
    setLoading(true)
    setAnalysis('')
    setAdaptation('')
    setSaved(false)
    setFetchError('')
    analysisRef.current = ''

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputMode === 'url' ? url.trim() : undefined,
          text: inputMode === 'text' ? text.trim() : undefined,
          platform,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setFetchError(err.error || '分析失败，请检查链接或粘贴正文')
        setLoading(false)
        return
      }

      setRawContent(inputMode === 'text' ? text : url)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        analysisRef.current += chunk
        setAnalysis(analysisRef.current)
      }
    } catch (e) {
      setFetchError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const runAdaptation = async () => {
    if (!analysis || !selectedBrand) return
    setAdapting(true)
    setAdaptation('')
    adaptationRef.current = ''

    const brand = projects.find(p => p.id === selectedBrand)
    if (!brand) return

    try {
      const res = await fetch('/api/analyze/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          originalContent: rawContent,
          platform,
          brand: brand.brand,
        }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let leftover = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = (leftover + chunk).split('\n')
        leftover = lines.pop() ?? ''
        for (const line of lines) {
          adaptationRef.current += line + '\n'
          setAdaptation(adaptationRef.current)
        }
      }
    } catch {}
    finally { setAdapting(false) }
  }

  const saveToKnowledge = () => {
    if (!adaptation || !selectedBrand) return
    const brand = projects.find(p => p.id === selectedBrand)
    if (!brand) return
    addKnowledgeDoc(selectedBrand, {
      id: `analyze-${Date.now()}`,
      title: `爆款参考 · ${url || '手动输入'} → ${brand.brand.name}`,
      content: `## 爆款拆解分析\n${analysis}\n\n## 品牌改编建议\n${adaptation}`,
      type: 'competitor_deep_dive' as const,
      updatedAt: new Date().toISOString(),
    })
    setSaved(true)
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .analyze-btn:hover { opacity: 0.88 !important; transform: translateY(-1px) !important; }
        .platform-chip:hover { border-color: rgba(28,58,46,0.3) !important; background: ${C.al} !important; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
        <LeftSidebar />

        <main style={{ flex: 1, overflow: 'auto', padding: '48px 56px 80px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ marginBottom: 36, animation: 'fadeUp 0.5s both' }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>ANALYZE</div>
              <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: C.ink, margin: 0, letterSpacing: '0.01em', lineHeight: 1.2 }}>爆款拆解</h1>
              <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 14, color: C.ink3, marginTop: 8, lineHeight: 1.8 }}>
                粘贴任意平台的爆款链接或内容，鸣帮你拆解传播逻辑，并生成适合你品牌的改编方案。
              </p>
            </div>

            {/* Input Card */}
            <div style={{ background: '#fff', border: `1px solid ${C.border2}`, borderRadius: 16, padding: '24px 28px', marginBottom: 24, boxShadow: C.shadow, animation: 'fadeUp 0.5s 0.08s both' }}>

              {/* Platform selector */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.1em', marginBottom: 10 }}>平台</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PLATFORMS.map(p => (
                    <button key={p.id} className="platform-chip" onClick={() => setPlatform(p.id)}
                      style={{ padding: '5px 12px', borderRadius: 99, border: `1px solid ${platform === p.id ? C.accent : C.border2}`, background: platform === p.id ? C.al : 'transparent', fontFamily: SANS, fontSize: 11, color: platform === p.id ? C.accent : C.ink3, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input mode toggle */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 12, background: C.bg2, borderRadius: 8, padding: 3, width: 'fit-content' }}>
                {(['url', 'text'] as const).map(mode => (
                  <button key={mode} onClick={() => setInputMode(mode)}
                    style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: inputMode === mode ? '#fff' : 'transparent', color: inputMode === mode ? C.ink : C.ink3, fontFamily: SANS, fontSize: 11, cursor: 'pointer', boxShadow: inputMode === mode ? C.shadow : 'none', transition: 'all 0.15s' }}>
                    {mode === 'url' ? '粘贴链接' : '粘贴正文'}
                  </button>
                ))}
              </div>

              {inputMode === 'url' ? (
                <input value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.xiaohongshu.com/explore/..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border2}`, fontFamily: MONO, fontSize: 12, color: C.ink, background: C.bg, outline: 'none', boxSizing: 'border-box' }} />
              ) : (
                <textarea value={text} onChange={e => setText(e.target.value)}
                  placeholder="粘贴内容正文、标题、评论区文字等..."
                  rows={5}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border2}`, fontFamily: SERIF, fontSize: 13, color: C.ink, background: C.bg, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.8 }} />
              )}

              {fetchError && (
                <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 12, color: '#c0392b' }}>{fetchError}</div>
              )}

              <button className="analyze-btn" onClick={runAnalysis} disabled={loading}
                style={{ marginTop: 14, width: '100%', padding: '13px', borderRadius: 11, border: 'none', background: C.accent, color: '#fff', fontFamily: SERIF, fontSize: 15, letterSpacing: '0.03em', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1, transition: 'all 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                {loading ? '鸣正在拆解...' : '开始拆解 →'}
              </button>
            </div>

            {/* Analysis Result */}
            {analysis && (
              <div style={{ animation: 'fadeUp 0.5s both' }}>
                <div style={{ background: '#fff', border: `1px solid ${C.border2}`, borderRadius: 16, padding: '24px 28px', marginBottom: 20, boxShadow: C.shadow }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.ming, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: '#fff', flexShrink: 0 }}>鸣</div>
                    <div>
                      <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.accent }}>爆款拆解报告</div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4 }}>
                        {PLATFORMS.find(p => p.id === platform)?.label} · {url || '手动输入'}
                      </div>
                    </div>
                    {loading && <div style={{ marginLeft: 'auto', width: 12, height: 12, border: '2px solid rgba(28,58,46,0.2)', borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                  </div>
                  <MarkdownBlock text={analysis} />
                </div>

                {/* Brand linkage */}
                {!loading && (
                  <div style={{ background: C.gl, border: `1px solid rgba(122,96,32,0.2)`, borderRadius: 16, padding: '20px 24px', animation: 'fadeUp 0.4s both' }}>
                    <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.accent, marginBottom: 6 }}>将拆解用于你的品牌</div>
                    <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 12, color: C.ink3, marginBottom: 16, lineHeight: 1.7 }}>
                      选择一个品牌，鸣将基于拆解报告生成品牌改编建议和内容草稿。
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border2}`, fontFamily: SERIF, fontSize: 13, color: C.ink, background: '#fff', outline: 'none', cursor: 'pointer' }}>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.brand.name}</option>
                        ))}
                      </select>

                      <button onClick={runAdaptation} disabled={adapting || !selectedBrand}
                        style={{ padding: '8px 20px', borderRadius: 9, border: 'none', background: adapting ? C.bg3 : C.accent, color: adapting ? C.ink4 : '#fff', fontFamily: SERIF, fontSize: 13, cursor: adapting ? 'not-allowed' : 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {adapting && <div style={{ width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                        {adapting ? '生成中...' : '对比我的品牌，生成改编建议 →'}
                      </button>
                    </div>

                    {/* Adaptation result */}
                    {adaptation && (
                      <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid rgba(122,96,32,0.15)` }}>
                        <MarkdownBlock text={adaptation} />

                        {!adapting && (
                          <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button onClick={saveToKnowledge} disabled={saved}
                              style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${saved ? C.border2 : C.accent}`, background: saved ? C.bg2 : 'transparent', color: saved ? C.ink3 : C.accent, fontFamily: SERIF, fontSize: 12, cursor: saved ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                              {saved ? '✓ 已存入知识库' : '存入知识库'}
                            </button>
                            <span style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.04em' }}>
                              {saved ? `已保存至「${projects.find(p => p.id === selectedBrand)?.brand.name}」知识库` : '保存后可在 Agent 对话中使用'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
