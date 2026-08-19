/**
 * Full workbench matrix probe (A-path): every runnable node + chain contamination.
 * Poll history (no EventSource). Logs to stdout; write summary JSON at end.
 *
 * Usage: CHIRP_BASE=http://localhost:3003 node scripts/probe-matrix-full.mjs
 */
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const BASE = process.env.CHIRP_BASE || 'http://localhost:3003'
const ALIAS = process.env.PROBE_ALIAS || `chirp-matrix-${Date.now().toString(36)}`
const OUT = process.env.PROBE_OUT || `/tmp/chirp-matrix-${ALIAS}.json`

const SAMPLE_KNOWLEDGE = `品牌：Chirp 创作者工作台
定位：无限画布内容工作台，把知识/素材/营销/复用/排期连成可跑的图
受众：同时运营 YT/IG/TikTok/X 的独立创作者与小团队
语气：直接、诚实、产品向，不装神秘
支柱：有据生成（拒空上游）、Plan→Apply→Run、只排不发
不要做：静默代发、凭空编造品牌事实、假装能逐帧看视频`

const ASSET_DESC = `一张创作者桌面俯拍，笔记本屏幕显示增长曲线和内容日历，旁边有手机支架和一杯咖啡。氛围冷静、产品向，适合介绍工作流工具。`

const PROFILE = {
  name: 'Chirp',
  contentStyle: 'direct product storytelling',
  audience: 'indie creators running YT/IG/TikTok/X',
  tone: 'honest, product-forward',
  topics: ['content workflow', 'canvas', 'schedule-only'],
}

const CONTRACT_META =
  /TASK-prefix|PIVOT-Ops|contract confirmation|work queue request|Chirp TASK|TASKs executed under contract/i

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function isContract(t) {
  const s = (t || '').trim()
  if (!s) return false
  if (CONTRACT_META.test(s)) return true
  if (/^OK\.\s+/i.test(s) && /TASK|contract|PIVOT/i.test(s)) return true
  return false
}

function isPlausibleKnowledge(t) {
  const s = (t || '').trim()
  if (!s || s.length < 40 || isContract(s)) return false
  return /定位|受众|语气|支柱|Positioning|Audience|Tone|Pillar|不要|禁忌/i.test(s)
    || s.split('\n').filter(l => l.trim()).length >= 4
}

function hasAdviceTone(t) {
  return /(建议|安排|排期|下周|日历|你可以|推荐你|next steps?|schedule|roadmap|90.?day|建议你|不妨)/i.test(t || '')
}

function analyzeText(text) {
  return {
    len: (text || '').length,
    lines: (text || '').split('\n').filter(l => l.trim()).length,
    contractMeta: isContract(text),
    hasAdviceTone: hasAdviceTone(text),
    hasDisclaimer: /元数据\+描述|非逐帧|metadata\+description/i.test(text || ''),
    hasPlatformAdvice: /建议平台|Platforms:/i.test(text || ''),
    hasTagsLine: /标签：|Tags:/i.test(text || ''),
  }
}

async function init() {
  const res = await fetch(`${BASE}/api/minds/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias: ALIAS }),
  })
  const j = await res.json()
  console.log('[init]', res.status, JSON.stringify(j).slice(0, 200))
  if (!res.ok) throw new Error('init failed')
  await sleep(2500)
}

async function pollReply(sentAt, timeoutMs = 280000) {
  const start = Date.now()
  let lastLog = 0
  while (Date.now() - start < timeoutMs) {
    await sleep(4000)
    const elapsed = Date.now() - start
    if (elapsed - lastLog > 25000) {
      console.log(`  …waiting ${Math.round(elapsed / 1000)}s`)
      lastLog = elapsed
    }
    try {
      const h = await fetch(`${BASE}/api/minds/history?alias=${encodeURIComponent(ALIAS)}&limit=12`)
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
          return { ok: true, text, waitMs: elapsed }
        }
      }
    } catch { /* retry */ }
  }
  return { ok: false, error: 'timeout' }
}

async function sendWait(message, label) {
  console.log(`\n=== ${label} ===`)
  const t0 = Date.now()
  const sendRes = await fetch(`${BASE}/api/minds/send-async`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias: ALIAS, message }),
  })
  const sendData = await sendRes.json()
  if (!sendRes.ok || sendData.error) {
    console.log('[send fail]', sendData)
    return { ok: false, error: sendData.error || String(sendRes.status), label }
  }
  console.log('[sentAt]', sendData.sentAt)
  const r = await pollReply(sendData.sentAt)
  console.log(`[${label}]`, r.ok ? `ok wait=${r.waitMs}ms len=${r.text.length}` : r.error)
  return { ...r, label, totalMs: Date.now() - t0 }
}

function parseRepurposeLocal(raw) {
  const clean = (raw || '').replace(/<[^>]+>/g, ' ').trim()
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { ok: false, reason: 'no-json' }
  let parsed
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return { ok: false, reason: 'bad-json' }
  }
  const keys = ['youtube', 'instagram', 'tiktok', 'twitter']
  const result = {}
  for (const k of keys) result[k] = typeof parsed[k] === 'string' ? parsed[k].trim() : ''
  if (keys.every(k => !result[k])) return { ok: false, reason: 'empty' }
  const filled = keys.filter(k => result[k].length > 40)
  const adviceInPlatform = keys.some(k => hasAdviceTone(result[k]) && /90.?day|calendar|下周排期/i.test(result[k]))
  return {
    ok: filled.length >= 3,
    reason: filled.length >= 3 ? 'ok' : `sparse:${filled.length}`,
    result,
    filled: filled.length,
    adviceInPlatform,
    lens: Object.fromEntries(keys.map(k => [k, result[k].length])),
  }
}

/** Mirror WorkbenchCanvas.suggestScheduleFromRepurpose slot builder */
function suggestScheduleSlots(platforms, zh = true) {
  const labels = [
    { key: 'tiktok', label: zh ? 'TikTok 发布' : 'TikTok post' },
    { key: 'instagram', label: zh ? 'IG 发布' : 'IG post' },
    { key: 'youtube', label: zh ? 'YouTube 发布' : 'YouTube post' },
    { key: 'twitter', label: zh ? 'X 发布' : 'X post' },
  ].filter(x => platforms[x.key]?.trim())
  const base = new Date()
  base.setMinutes(0, 0, 0)
  return labels.map((l, i) => {
    const at = new Date(base)
    at.setDate(at.getDate() + i + 1)
    at.setHours(12 + (i % 3) * 3, 0, 0, 0)
    return { at: at.toISOString().slice(0, 16), label: l.label }
  })
}

/** Mirror exportPack contamination: body dumped as-is */
function simulateExportMd(nodes) {
  const lines = ['# Chirp export pack', '']
  for (const n of nodes) {
    lines.push(`## ${n.kind}: ${n.title}`)
    lines.push(n.body || '')
    if (n.platforms) {
      for (const [p, t] of Object.entries(n.platforms)) {
        lines.push(`### ${p}`, t, '')
      }
    }
    if (n.slots) lines.push('### slots', JSON.stringify(n.slots), '')
    lines.push('')
  }
  return lines.join('\n')
}

async function analyzeAssetApi() {
  console.log('\n=== asset-analyze-api ===')
  const t0 = Date.now()
  const res = await fetch(`${BASE}/api/minds/analyze-asset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alias: ALIAS,
      name: 'desk-growth-shot',
      type: 'image',
      description: ASSET_DESC,
      profile: PROFILE,
    }),
  })
  const data = await res.json()
  const ms = Date.now() - t0
  if (!res.ok || data.error) {
    console.log('[asset api fail]', res.status, data)
    return { ok: false, error: data.error || String(res.status), ms }
  }
  console.log('[asset api ok]', ms, 'ms', JSON.stringify({
    tags: data.tags,
    platforms: data.platforms,
    analysisLen: (data.analysis || '').length,
  }))
  // Same body mix as WorkbenchCanvas
  const body = [
    '【素材分析 · 元数据+描述驱动，非逐帧看片】',
    data.analysis,
    data.tags?.length ? `标签：${data.tags.join(', ')}` : '',
    data.platforms?.length ? `建议平台：${data.platforms.join(' · ')}` : '',
  ].filter(Boolean).join('\n')
  return {
    ok: true,
    ms,
    tags: data.tags,
    platforms: data.platforms,
    analysis: data.analysis,
    bodyAsStored: body,
    bodyMeta: analyzeText(body),
  }
}

async function main() {
  const report = {
    base: BASE,
    alias: ALIAS,
    startedAt: new Date().toISOString(),
    cases: {},
  }
  console.log('BASE', BASE, 'ALIAS', ALIAS)
  await init()

  // ── 1. Knowledge (with repair mirror) ──
  const knowPrompt = `TASK: Distill the following into a concise brand/knowledge card for a content creator workbench.
Return plain text ONLY with short sections: 定位 / 受众 / 语气 / 内容支柱 / 可做 / 不要做.
No HTML. No JSON. No TASK-prefix. No contract IDs. No PIVOT-Ops. No ops acknowledgements.
INPUT:
"""
${SAMPLE_KNOWLEDGE}
"""`
  let know = await sendWait(knowPrompt, 'knowledge-first')
  report.cases.knowledgeFirst = {
    ok: know.ok,
    waitMs: know.waitMs,
    meta: know.ok ? analyzeText(know.text) : null,
    plausible: know.ok ? isPlausibleKnowledge(know.text) : false,
    preview: know.ok ? know.text.slice(0, 400) : know.error,
  }
  if (know.ok) console.log('---KNOWLEDGE FIRST---\n' + know.text + '\n---END---')

  let knowledgeCard = know.ok && isPlausibleKnowledge(know.text) && !isContract(know.text) ? know.text : null
  if (know.ok && !knowledgeCard) {
    const repair = await sendWait(
      knowPrompt + `\n\nYour previous reply was NOT usable (ops/contract meta, or not a knowledge card).
Rewrite now as a concise brand knowledge card ONLY.
Use short sections: Positioning, Audience, Tone, Pillars, Do/Don't.
No TASK-prefix, no contract IDs, no PIVOT-Ops, no HTML, no JSON.

PREVIOUS UNUSABLE REPLY:
${know.text.slice(0, 800)}`,
      'knowledge-repair',
    )
    report.cases.knowledgeRepair = {
      ok: repair.ok,
      waitMs: repair.waitMs,
      meta: repair.ok ? analyzeText(repair.text) : null,
      plausible: repair.ok ? isPlausibleKnowledge(repair.text) : false,
      preview: repair.ok ? repair.text.slice(0, 400) : repair.error,
    }
    if (repair.ok) {
      console.log('---KNOWLEDGE REPAIR---\n' + repair.text + '\n---END---')
      if (isPlausibleKnowledge(repair.text) && !isContract(repair.text)) knowledgeCard = repair.text
    }
  }
  if (!knowledgeCard) knowledgeCard = SAMPLE_KNOWLEDGE
  report.cases.knowledgeFinal = { usedRepair: !!report.cases.knowledgeRepair, len: knowledgeCard.length }

  // ── 2. Asset analyze API ──
  const asset = await analyzeAssetApi()
  report.cases.assetApi = asset.ok
    ? {
        ok: true,
        ms: asset.ms,
        tags: asset.tags,
        platforms: asset.platforms,
        analysis: asset.analysis,
        bodyMeta: asset.bodyMeta,
        bodyPreview: asset.bodyAsStored.slice(0, 500),
      }
    : { ok: false, error: asset.error, ms: asset.ms }

  const cleanAssetSummary = asset.ok ? asset.analysis : ASSET_DESC
  const contaminatedAssetBody = asset.ok
    ? asset.bodyAsStored
    : [
        '【素材分析 · 元数据+描述驱动，非逐帧看片】',
        ASSET_DESC,
        '标签：creator, growth, desk',
        '建议平台：instagram · youtube',
      ].join('\n')

  // ── 3. Marketing: clean knowledge + contaminated asset (production path) ──
  const mktContamPrompt = `TASK: Write marketing content angles for a creator workbench.
You MUST ground every claim in UPSTREAM_KNOWLEDGE and/or UPSTREAM_ASSETS below.
If upstream knowledge is missing, empty, OR is ops/contract meta (TASK-prefix, PIVOT-Ops, contract IDs) rather than real brand facts, reply exactly: INSUFFICIENT_UPSTREAM
Do NOT invent a brand, product, or audience that is not supported by upstream.
Do NOT treat "OK. TASK-prefix contract…" style text as knowledge.
Do NOT reuse or continue any previous marketing draft that appears in BRIEF — BRIEF is optional direction only.

UPSTREAM_KNOWLEDGE:
"""
${knowledgeCard}
"""
UPSTREAM_ASSETS:
"""
${contaminatedAssetBody}
"""
BRIEF (optional direction only — not a knowledge source):
"""
面向独立创作者，突出「画布可跑、只排不发」
"""

If upstream is sufficient: return plain text with 3 angles (headline + short body + CTA each). No HTML.`

  const mktContam = await sendWait(mktContamPrompt, 'marketing-contaminated-asset')
  report.cases.marketingContaminated = {
    ok: mktContam.ok,
    waitMs: mktContam.waitMs,
    meta: mktContam.ok ? analyzeText(mktContam.text) : null,
    insufficient: mktContam.ok ? /INSUFFICIENT_UPSTREAM/i.test(mktContam.text) : false,
    looksLikeKnowledgeRewrite: mktContam.ok
      ? /定位|受众|内容支柱/.test(mktContam.text) && !/Angle|Headline|CTA|角度/i.test(mktContam.text)
      : false,
    angleHints: mktContam.ok ? ((mktContam.text.match(/Angle|Headline|CTA|角度|标题/gi) || []).length) : 0,
    preview: mktContam.ok ? mktContam.text.slice(0, 600) : mktContam.error,
  }
  if (mktContam.ok) console.log('---MKT CONTAM---\n' + mktContam.text + '\n---END---')

  // ── 4. Marketing: clean knowledge + clean asset summary only ──
  const mktCleanPrompt = `TASK: Write marketing content angles for a creator workbench.
You MUST ground every claim in UPSTREAM_KNOWLEDGE and/or UPSTREAM_ASSETS below.
If upstream is insufficient, reply exactly: INSUFFICIENT_UPSTREAM

UPSTREAM_KNOWLEDGE:
"""
${knowledgeCard}
"""
UPSTREAM_ASSETS:
"""
${cleanAssetSummary}
"""
BRIEF:
"""
面向独立创作者，突出画布可跑、只排不发
"""

Return EXACTLY 3 angles in this template (plain text, no HTML):
Angle 1
Headline: ...
Body: ...
CTA: ...
Angle 2
Headline: ...
Body: ...
CTA: ...
Angle 3
Headline: ...
Body: ...
CTA: ...`

  const mktClean = await sendWait(mktCleanPrompt, 'marketing-clean-strict-template')
  report.cases.marketingCleanStrict = {
    ok: mktClean.ok,
    waitMs: mktClean.waitMs,
    meta: mktClean.ok ? analyzeText(mktClean.text) : null,
    angleHints: mktClean.ok ? ((mktClean.text.match(/Angle|Headline|CTA/gi) || []).length) : 0,
    preview: mktClean.ok ? mktClean.text.slice(0, 600) : mktClean.error,
  }
  if (mktClean.ok) console.log('---MKT CLEAN---\n' + mktClean.text + '\n---END---')

  const marketingDraft = (mktClean.ok && (report.cases.marketingCleanStrict.angleHints >= 6))
    ? mktClean.text
    : (mktContam.ok && !report.cases.marketingContaminated.looksLikeKnowledgeRewrite
      ? mktContam.text
      : knowledgeCard)

  // ── 5. Repurpose from marketing draft ──
  const repPrompt = `TASK: Repurpose content into four platform-native posts (work queue request from the Chirp app — execute the task and return only the requested format).

CREATOR PROFILE ("Chirp")
- Content style: direct product storytelling
- Audience: indie creators running YT/IG/TikTok/X
- Tone of voice: honest, product-forward
- Content topics: content workflow, canvas, schedule-only

SOURCE CONTENT
"""
${marketingDraft.slice(0, 3500)}
"""

TASK
Adapt the source content into four platform-native posts. Each version must be genuinely different — written for that platform's audience, culture and format rules. Write everything in English unless the source is explicitly in another language.

PLATFORM REQUIREMENTS
- "youtube": Video description, 150–250 words. SEO-first: keyword-rich opening line, short paragraphs, 3–5 hashtag-less keywords at the end, one call-to-action to subscribe.
- "instagram": Caption, 80–120 words, storytelling first line that works as a hook, then value, then a question to drive comments. After the caption add exactly 10 hashtags on a new line.
- "tiktok": A spoken script outline. Start with "HOOK:" — one sentence for the first 3 seconds. Then 3–4 short beats prefixed with "BEAT:". End with "CTA:" one line.
- "twitter": A single tweet, strictly under 260 characters. Punchy, no hashtags, no em-dash chains, one clear idea.

OUTPUT RULES — READ CAREFULLY
- Return ONLY a single valid JSON object. No markdown fences, no commentary, no explanation.
- Keys exactly: "youtube", "instagram", "tiktok", "twitter". Values are plain strings = ready-to-post copy ONLY.
- Do NOT put weekly plans, calendars, "90-day" roadmaps, or schedule advice inside any platform value.
- Never repeat the same text across platforms. Never output random characters or placeholder text.`

  let rep = await sendWait(repPrompt, 'repurpose-first')
  let parsed = rep.ok ? parseRepurposeLocal(rep.text) : { ok: false, reason: 'send-fail' }
  report.cases.repurposeFirst = {
    ok: rep.ok,
    waitMs: rep.waitMs,
    parse: parsed.ok ? { ok: true, filled: parsed.filled, lens: parsed.lens, adviceInPlatform: parsed.adviceInPlatform } : { ok: false, reason: parsed.reason },
    preview: rep.ok ? rep.text.slice(0, 500) : rep.error,
  }
  if (rep.ok) console.log('---REPURPOSE FIRST---\n' + rep.text.slice(0, 1200) + '\n---END---')

  let platforms = parsed.ok ? parsed.result : null
  if (rep.ok && !parsed.ok) {
    const repair = await sendWait(
      repPrompt + `\n\nYour previous reply was not usable (invalid JSON, garbled text, or identical platform versions). Try again and strictly follow the OUTPUT RULES: one valid JSON object only, genuinely different text per platform, English only.\n\nPREVIOUS UNUSABLE REPLY:\n${rep.text.slice(0, 1200)}`,
      'repurpose-repair',
    )
    parsed = repair.ok ? parseRepurposeLocal(repair.text) : { ok: false, reason: 'repair-fail' }
    report.cases.repurposeRepair = {
      ok: repair.ok,
      waitMs: repair.waitMs,
      parse: parsed.ok ? { ok: true, filled: parsed.filled, lens: parsed.lens, adviceInPlatform: parsed.adviceInPlatform } : { ok: false, reason: parsed.reason },
      preview: repair.ok ? repair.text.slice(0, 500) : repair.error,
    }
    if (repair.ok) console.log('---REPURPOSE REPAIR---\n' + repair.text.slice(0, 1200) + '\n---END---')
    if (parsed.ok) platforms = parsed.result
  }

  // ── 6. Schedule suggest (local mirror — no Minds) ──
  const slots = platforms ? suggestScheduleSlots(platforms, true) : []
  report.cases.scheduleSuggest = {
    ok: slots.length > 0,
    slotCount: slots.length,
    slots,
    note: 'local deterministic — no Minds call; mirrors WorkbenchCanvas.suggestScheduleFromRepurpose',
  }
  console.log('\n=== schedule-suggest (local) ===', JSON.stringify(slots, null, 2))

  // ── 7. Plan chat ──
  const planPrompt = `你是 Chirp 内容策划助手（Plan 模式）。用户在画布工作流里规划内容。
请用简洁中文给出：
1) 方向建议
2) 分步 Plan（3～6 步）
3) 建议的画布节点组合（知识/素材/营销/复用/排期）
规则：按用户目标定制，不要套固定模板。
禁止输出 youtube/instagram/tiktok/twitter 的 JSON。禁止 TASK-prefix / PIVOT-Ops。
用户说：
我想为 Chirp 做一周内容：突出「有据生成」和「只排不发」，面向独立创作者`

  const plan = await sendWait(planPrompt, 'plan-chat')
  const planLooksJson = plan.ok && /"youtube"\s*:/.test(plan.text) && /"tiktok"\s*:/.test(plan.text)
  report.cases.planChat = {
    ok: plan.ok,
    waitMs: plan.waitMs,
    meta: plan.ok ? analyzeText(plan.text) : null,
    looksLikeRepurposeJson: planLooksJson,
    contractMeta: plan.ok ? isContract(plan.text) : false,
    hasSteps: plan.ok ? /(1\)|1\.|步骤|Plan)/i.test(plan.text) : false,
    preview: plan.ok ? plan.text.slice(0, 600) : plan.error,
  }
  if (plan.ok) console.log('---PLAN---\n' + plan.text + '\n---END---')

  // ── 8. Export contamination check (simulate) ──
  const exportMd = simulateExportMd([
    { kind: 'knowledgeCard', title: 'Brand', body: knowledgeCard },
    { kind: 'asset', title: 'desk', body: contaminatedAssetBody },
    { kind: 'marketing', title: 'Angles', body: marketingDraft },
    {
      kind: 'repurpose',
      title: 'Four platforms',
      body: 'YT / IG / TikTok / X drafts ready',
      platforms: platforms || undefined,
    },
    { kind: 'schedule', title: 'Board', body: '', slots },
  ])
  report.cases.exportContamination = {
    mdLen: exportMd.length,
    disclaimerLeaks: /非逐帧|元数据\+描述/.test(exportMd),
    platformAdviceLeaks: /建议平台/.test(exportMd),
    scheduleAdviceInDraft: /90.?day|下周排期建议/.test(exportMd),
    previewTail: exportMd.slice(0, 800),
  }
  console.log('\n=== export contamination ===', JSON.stringify(report.cases.exportContamination))

  // ── Verdict table ──
  report.finishedAt = new Date().toISOString()
  report.verdict = {
    knowledge: report.cases.knowledgeFirst?.plausible || report.cases.knowledgeRepair?.plausible ? 'PASS*' : 'FAIL',
    assetApi: report.cases.assetApi?.ok ? 'PASS' : 'FAIL',
    marketingContam: report.cases.marketingContaminated?.ok && !report.cases.marketingContaminated?.looksLikeKnowledgeRewrite ? 'PASS*' : 'WEAK/FAIL',
    marketingClean: (report.cases.marketingCleanStrict?.angleHints || 0) >= 6 ? 'PASS' : 'WEAK',
    repurpose: (report.cases.repurposeFirst?.parse?.ok || report.cases.repurposeRepair?.parse?.ok) ? 'PASS' : 'FAIL',
    schedule: report.cases.scheduleSuggest?.ok ? 'PASS (local)' : 'FAIL',
    plan: report.cases.planChat?.ok && !report.cases.planChat?.looksLikeRepurposeJson ? 'PASS*' : 'WEAK/FAIL',
    exportMix: report.cases.exportContamination?.disclaimerLeaks || report.cases.exportContamination?.platformAdviceLeaks ? 'LEAK' : 'CLEAN',
  }

  writeFileSync(OUT, JSON.stringify(report, null, 2))
  console.log('\n========== VERDICT ==========')
  console.log(JSON.stringify(report.verdict, null, 2))
  console.log('Wrote', OUT)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
