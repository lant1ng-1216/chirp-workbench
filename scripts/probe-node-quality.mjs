/**
 * Workbench node output probe — poll history (no EventSource).
 */
const BASE = process.env.CHIRP_BASE || 'http://localhost:3003'
const ALIAS = process.env.PROBE_ALIAS || `chirp-probe-${Date.now().toString(36)}`

const SAMPLE_KNOWLEDGE = `品牌：Chirp 创作者工作台
定位：无限画布内容工作台，把知识/素材/营销/复用/排期连成可跑的图
受众：同时运营 YT/IG/TikTok/X 的独立创作者与小团队
语气：直接、诚实、产品向，不装神秘
支柱：有据生成（拒空上游）、Plan→Apply→Run、只排不发
不要做：静默代发、凭空编造品牌事实、假装能逐帧看视频`

async function init() {
  const res = await fetch(`${BASE}/api/minds/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias: ALIAS }),
  })
  const j = await res.json()
  console.log('[init]', res.status, JSON.stringify(j).slice(0, 240))
  if (!res.ok) throw new Error('init failed: ' + JSON.stringify(j))
  await sleep(3000)
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function pollReply(sentAt, timeoutMs = 280000) {
  const start = Date.now()
  let lastLog = 0
  while (Date.now() - start < timeoutMs) {
    await sleep(4000)
    const elapsed = Date.now() - start
    if (elapsed - lastLog > 20000) {
      console.log(`  …waiting ${Math.round(elapsed / 1000)}s`)
      lastLog = elapsed
    }
    try {
      const h = await fetch(`${BASE}/api/minds/history?alias=${encodeURIComponent(ALIAS)}&limit=10`)
      if (!h.ok) continue
      const data = await h.json()
      const list = data.history ?? data.messages ?? []
      for (let i = list.length - 1; i >= 0; i--) {
        const m = list[i]
        const raw = String(m.createdAt ?? '')
        const normalized = raw && !raw.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(raw) ? `${raw}Z` : raw
        const t = normalized ? new Date(normalized).getTime() : 0
        if (t && t < sentAt - 2000) continue
        const isMind = m.senderType === 0 || m.senderType === 2
        const text = (m.messageText ?? m.text ?? '').replace(/<[^>]+>/g, ' ').trim()
        if (isMind && text && text.length > 20 && !/^OK\.?\s*$/i.test(text)) {
          return { ok: true, text }
        }
      }
    } catch {}
  }
  return { ok: false, error: 'timeout' }
}

async function sendWait(message, label) {
  console.log(`\n=== ${label} ===`)
  const sendRes = await fetch(`${BASE}/api/minds/send-async`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias: ALIAS, message }),
  })
  const sendData = await sendRes.json()
  if (!sendRes.ok || sendData.error) {
    console.log('[send fail]', sendData)
    return { ok: false, error: sendData.error || String(sendRes.status) }
  }
  console.log('[sentAt]', sendData.sentAt)
  return pollReply(sendData.sentAt)
}

function analyzeMix(text) {
  const advice = /(建议|安排|排期|下周|日历|你可以|推荐你|next steps?|schedule|roadmap|90.?day|建议你|不妨|可选操作)/i.test(text)
  const sections = (text.match(/定位|受众|语气|支柱|Angle|Headline|CTA|Positioning|Audience|可做|不要做/gi) || []).length
  const contract = /TASK-prefix|PIVOT-Ops|contract confirmation/i.test(text)
  return {
    len: text.length,
    lines: text.split('\n').filter(l => l.trim()).length,
    hasAdviceTone: advice,
    sectionHints: sections,
    contractMeta: contract,
  }
}

async function main() {
  console.log('BASE', BASE, 'ALIAS', ALIAS)
  await init()

  const knowPrompt = `TASK: Distill the following into a concise brand/knowledge card for a content creator workbench.
Return plain text ONLY with short sections: 定位 / 受众 / 语气 / 内容支柱 / 可做 / 不要做.
No HTML. No JSON. No TASK-prefix. No contract IDs. No PIVOT-Ops. No ops acknowledgements.
INPUT:
"""
${SAMPLE_KNOWLEDGE}
"""`

  const know = await sendWait(knowPrompt, 'knowledge-refine')
  if (!know.ok) console.log('KNOWLEDGE FAIL', know)
  else {
    console.log('KNOWLEDGE META', JSON.stringify(analyzeMix(know.text)))
    console.log('---KNOWLEDGE---\n' + know.text + '\n---END---')
  }

  const knowledgeCtx = know.ok ? know.text : SAMPLE_KNOWLEDGE

  // Simulate contaminated asset upstream as code does today
  const contaminatedAsset = [
    '【素材分析 · 元数据+描述驱动，非逐帧看片】',
    '一张创作者桌面俯拍，笔记本显示增长曲线。',
    '标签：creator, growth, desk',
    '建议平台：instagram · youtube',
  ].join('\n')

  const mktPrompt = `TASK: Write marketing content angles for a creator workbench.
You MUST ground every claim in UPSTREAM_KNOWLEDGE and/or UPSTREAM_ASSETS below.
If upstream knowledge is missing, empty, OR is ops/contract meta (TASK-prefix, PIVOT-Ops, contract IDs) rather than real brand facts, reply exactly: INSUFFICIENT_UPSTREAM
Do NOT invent a brand, product, or audience that is not supported by upstream.
Do NOT treat "OK. TASK-prefix contract…" style text as knowledge.
Do NOT reuse or continue any previous marketing draft that appears in BRIEF — BRIEF is optional direction only.

UPSTREAM_KNOWLEDGE:
"""
${knowledgeCtx}
"""
UPSTREAM_ASSETS:
"""
${contaminatedAsset}
"""
BRIEF (optional direction only — not a knowledge source):
"""
面向独立创作者，突出「画布可跑、只排不发」
"""

If upstream is sufficient: return plain text with 3 angles (headline + short body + CTA each). No HTML.`

  const mkt = await sendWait(mktPrompt, 'marketing-with-contaminated-asset')
  if (!mkt.ok) console.log('MARKETING FAIL', mkt)
  else {
    console.log('MARKETING META', JSON.stringify(analyzeMix(mkt.text)))
    console.log('---MARKETING---\n' + mkt.text + '\n---END---')
  }

  // Repurpose quick parse test with a synthetic good/bad payload (unit)
  const { parseRepurposeReply } = await import('../lib/minds/repurpose.ts').catch(() => ({ parseRepurposeReply: null }))
  if (!parseRepurposeReply) {
    console.log('\n(skip TS import of parseRepurposeReply in plain node)')
  }

  console.log('\nCODE SHAPE: asset body always mixes disclaimer+summary+tags+platformAdvice')
  console.log(contaminatedAsset)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
