/**
 * Offline asserts for node content structure (Q0 harness).
 * Run: npx --yes tsx scripts/assert-node-content.ts
 */
import { parseMarketingAngles, formatAnglesPlain } from '../lib/workbench/marketing'
import { exportNodeText, stripMetaLines, upstreamDeliverable } from '../lib/workbench/nodeContent'
import { isContractMetaReply, isUsableContent } from '../lib/workbench/replyQuality'
import { extractSourceAnchors, isRepurposeGrounded } from '../lib/minds/repurpose'
import { extractPlanSteps, markdownWithoutPlanSteps, normalizePlanMarkdown } from '../lib/workbench/planFormat'
import type { CanvasNodeData } from '../lib/canvas'

let failed = 0
function assert(name: string, cond: boolean, detail?: string) {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failed++
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const looseSample = `Angle 1 - 不替你按发布键 Headline: 排期算到分钟，发布留给你点头 Body: 多平台创作者最怕工具太自动。Chirp 把排期和发布拆开。 CTA: 进画布看节点怎么分开
Angle 2 - 工作流是画布 Headline: 想法、素材、平台全在画布上 Body: 连边自己说话。 CTA: 搭一条工作流
Angle 3 - 一次拍摄 Headline: 五套规格 Body: 按平台拆。 CTA: 选一条素材`

const strictSample = `Angle 1
Headline: Keep publish human
Body: Schedule computes; you confirm.
CTA: Open canvas

Angle 2
Headline: Edges you can run
Body: Knowledge feeds marketing feeds reuse.
CTA: Wire a flow

Angle 3
Headline: One shoot, four posts
Body: Platform templates stay separate.
CTA: Try one asset`

const contaminated = [
  '【素材分析 · 元数据+描述驱动，非逐帧看片】',
  'A desk shot with growth chart.',
  '标签：creator, desk',
  '建议平台：instagram · youtube',
].join('\n')

assert('stripMetaLines drops disclaimer+platforms', !/建议平台|非逐帧/.test(stripMetaLines(contaminated)))
assert('stripMetaLines keeps summary', /desk shot/.test(stripMetaLines(contaminated)))

const assetNode: CanvasNodeData = {
  kind: 'asset',
  title: 'desk',
  body: 'user notes about the shot',
  summary: 'A desk shot best used as lead visual.',
  tags: ['creator desk'],
  platformsSuggested: ['instagram', 'youtube'],
  disclaimer: '素材分析 · 元数据+描述驱动，非逐帧看片',
}
const up = upstreamDeliverable(assetNode)
assert('upstream uses summary not disclaimer', up.includes('lead visual') && !/非逐帧|建议平台/.test(up))
assert('export omits disclaimer', !/非逐帧/.test(exportNodeText(assetNode)))
assert('usable via summary', isUsableContent(assetNode.body, assetNode.tags, { summary: assetNode.summary }))

const p1 = parseMarketingAngles(strictSample)
assert('parse strict angles', p1.ok && p1.ok && p1.angles.length === 3, p1.ok ? undefined : ('reason' in p1 ? p1.reason : ''))
const p2 = parseMarketingAngles(looseSample)
assert('parse loose angles', p2.ok && p2.ok && p2.angles.length >= 2, p2.ok ? String(p2.angles.length) : ('reason' in p2 ? p2.reason : ''))

if (p1.ok) {
  const mkt: CanvasNodeData = {
    kind: 'marketing',
    title: 'm',
    body: formatAnglesPlain(p1.angles),
    angles: p1.angles,
  }
  assert('marketing upstream is deliverable', upstreamDeliverable(mkt).includes('Headline:'))
  assert('usable via anglesCount', isUsableContent('', undefined, { anglesCount: p1.angles.length }))
}

assert('contract meta detected', isContractMetaReply('OK. 16th Chirp TASK-prefix contract confirmation - PIVOT-Ops'))
assert('knowledge not contract', !isContractMetaReply('定位: 画布工作台\n受众: 创作者'))

const voltSrc = 'Angle 1\nHeadline: Volt Runner 2.0 Electric Mint\nBody: 夜光球鞋'
const habitsOut = {
  youtube: 'Three habits separate creators who compound from creators who burn out in their first year. '.repeat(3),
  instagram: 'Post three times a week and reply to comments for growth as a creator.',
  tiktok: 'HOOK: Consistency beats trends\nBEAT: Show up\nCTA: Follow',
  twitter: 'Creators quit before compounding kicks in.',
}
const voltOut = {
  youtube: 'Volt Runner 2.0 Electric Mint shines in low light. Night neon sneaker for Gen-Z street looks.',
  instagram: 'Volt Runner Mint fit pic — no photographer needed under neon.',
  tiktok: 'HOOK: Volt Runner 夜光\nBEAT: 停车场面\nCTA: 扣1',
  twitter: 'Electric Mint is the drop signal — Volt Runner 2.0.',
}
assert('anchors from volt source', extractSourceAnchors(voltSrc).some(a => /volt|mint|runner/i.test(a)))
assert('habits ungrounded vs volt', !isRepurposeGrounded(voltSrc, habitsOut))
assert('volt grounded', isRepurposeGrounded(voltSrc, voltOut))

const withVersion = normalizePlanMarkdown('## 方向\nVolt Runner 2.0 开售。\n## 分步 Plan\n1. 锁知识\n2. 出营销')
assert('2.0 not split into orphan 0', !/\n2\.\s*0\b/.test(withVersion) && withVersion.includes('2.0'))
const jammedPlan = `## 分步 Plan\n锁定知识源：Volt Runner 档案。提炼知识卡：定位受众。生成营销：三角度。四平台复用：YT/IG。`
const jammedSteps = extractPlanSteps(jammedPlan)
assert('jammed plan splits to steps', jammedSteps.length >= 3, String(jammedSteps.length))
const stripped = markdownWithoutPlanSteps(`## 方向\n短结论\n## 分步 Plan\n1. a\n2. b\n## 画布建议\n- 知识→营销`)
assert('strip plan section', !/分步/.test(stripped) && /画布建议/.test(stripped) && /短结论/.test(stripped))

const norm = normalizePlanMarkdown('## 分步 Plan\n1. 锁知识源\n2. 出营销角\n3. 四平台复用')
assert('extract plan steps', extractPlanSteps(norm).length >= 3)

if (failed) {
  console.error(`\n${failed} assertion(s) failed`)
  process.exit(1)
}
console.log('\nAll assertions passed')
