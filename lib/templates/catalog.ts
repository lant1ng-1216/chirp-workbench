import type { CanvasEdge, CanvasNode } from '@/lib/canvas'
import { materializeWorkflow, type WorkflowSpec } from '@/lib/workbench/workflowBuild'

export type TemplateId =
  | 'campaign-pipeline'
  | 'cross-platform'
  | 'knowledge-marketing'
  | 'asset-campaign'
  /** @deprecated alias → cross-platform */
  | 'marketing'
  /** @deprecated alias → asset-campaign */
  | 'asset'

export type WorkflowTemplate = {
  id: TemplateId
  authorType: 'official' | 'creator'
  authorName: string
  title: { en: string; zh: string }
  description: { en: string; zh: string }
  tags: { en: string[]; zh: string[] }
  accent: string
  /** Engineered graph via shared materializeWorkflow */
  spec: (zh: boolean) => WorkflowSpec
  build: (ox: number, oy: number, zh: boolean) => { nodes: CanvasNode[]; edges: CanvasEdge[] }
}

function withBuild(specFn: (zh: boolean) => WorkflowSpec): WorkflowTemplate['build'] {
  return (ox, oy, zh) => materializeWorkflow(specFn(zh), { x: ox, y: oy }, zh)
}

function campaignPipelineSpec(zh: boolean): WorkflowSpec {
  return {
    title: zh ? '营销全链路' : 'Full campaign pipeline',
    nodes: [
      {
        tempId: 'src',
        kind: 'knowledgeSource',
        title: zh ? '品牌 / 产品设定' : 'Brand / product brief',
        body: zh
          ? '粘贴品牌定位、产品卖点、受众、禁忌语…\n（Apply / 手填后点提炼）'
          : 'Paste positioning, product points, audience, taboos…\n(Refine after fill)',
      },
      {
        tempId: 'card',
        kind: 'knowledgeCard',
        title: zh ? '品牌知识卡' : 'Brand knowledge',
        body: zh ? '（运行「提炼」后填充）' : '(Fill by running refine)',
      },
      {
        tempId: 'mkt',
        kind: 'marketing',
        title: zh ? '营销草稿' : 'Marketing draft',
        body: zh
          ? '可选 brief。生成时必须吃上游知识；无上游不可生成。'
          : 'Optional brief. Generation requires upstream knowledge.',
      },
      {
        tempId: 'rep',
        kind: 'repurpose',
        title: zh ? '跨平台复用' : 'Cross-platform reuse',
        body: '',
      },
      {
        tempId: 'sch',
        kind: 'schedule',
        title: zh ? '排期板' : 'Schedule board',
        body: '',
      },
    ],
    edges: [
      { source: 'src', target: 'card' },
      { source: 'card', target: 'mkt' },
      { source: 'mkt', target: 'rep' },
      { source: 'rep', target: 'sch' },
    ],
  }
}

function crossPlatformSpec(zh: boolean): WorkflowSpec {
  return {
    title: zh ? '跨平台内容复用' : 'Cross-platform reuse',
    nodes: [
      {
        tempId: 'note',
        kind: 'note',
        title: zh ? '源内容' : 'Source content',
        body: zh ? '粘贴一条成稿…' : 'Paste a source draft…',
      },
      {
        tempId: 'rep',
        kind: 'repurpose',
        title: zh ? '跨平台复用' : 'Cross-platform reuse',
        body: '',
      },
      {
        tempId: 'sch',
        kind: 'schedule',
        title: zh ? '排期板' : 'Schedule board',
        body: '',
      },
    ],
    edges: [
      { source: 'note', target: 'rep' },
      { source: 'rep', target: 'sch' },
    ],
  }
}

function knowledgeMarketingSpec(zh: boolean): WorkflowSpec {
  return {
    title: zh ? '知识驱动营销' : 'Knowledge → marketing',
    nodes: [
      {
        tempId: 'card',
        kind: 'knowledgeCard',
        title: zh ? '品牌知识' : 'Brand knowledge',
        body: zh ? '写入或粘贴已整理的品牌知识…' : 'Paste curated brand knowledge…',
      },
      {
        tempId: 'mkt',
        kind: 'marketing',
        title: zh ? '营销草稿' : 'Marketing draft',
        body: zh ? '补充活动角度（可选）' : 'Optional campaign angle',
      },
      {
        tempId: 'sch',
        kind: 'schedule',
        title: zh ? '排期板' : 'Schedule board',
        body: '',
      },
    ],
    edges: [
      { source: 'card', target: 'mkt' },
      { source: 'mkt', target: 'sch' },
    ],
  }
}

function assetCampaignSpec(zh: boolean): WorkflowSpec {
  return {
    title: zh ? '素材驱动营销' : 'Asset-led campaign',
    nodes: [
      {
        tempId: 'asset',
        kind: 'asset',
        title: zh ? '素材' : 'Asset',
        body: zh
          ? '上传图片/视频，补充画面说明后「分析打标」。\n识别为元数据+描述驱动（非逐帧看片）。'
          : 'Upload media, add a short description, then Analyze.\nMetadata+description driven (not frame-level vision).',
      },
      {
        tempId: 'card',
        kind: 'knowledgeCard',
        title: zh ? '配套知识' : 'Supporting knowledge',
        body: zh ? '补充品牌事实，避免营销空编…' : 'Add brand facts so marketing stays grounded…',
      },
      {
        tempId: 'mkt',
        kind: 'marketing',
        title: zh ? '营销草稿' : 'Marketing draft',
        body: zh
          ? '生成后可用「匹配素材」把打标素材连回来。'
          : 'After draft, use Match assets to wire tagged media.',
      },
      {
        tempId: 'sch',
        kind: 'schedule',
        title: zh ? '排期板' : 'Schedule board',
        body: '',
      },
    ],
    edges: [
      { source: 'asset', target: 'mkt' },
      { source: 'card', target: 'mkt' },
      { source: 'mkt', target: 'sch' },
    ],
  }
}

function entry(
  id: TemplateId,
  meta: Omit<WorkflowTemplate, 'id' | 'authorType' | 'authorName' | 'spec' | 'build'>,
  specFn: (zh: boolean) => WorkflowSpec,
): WorkflowTemplate {
  return {
    id,
    authorType: 'official',
    authorName: 'Chirp',
    ...meta,
    spec: specFn,
    build: withBuild(specFn),
  }
}

/** Official templates — engineered scaffolds sharing Apply's materializeWorkflow */
export const OFFICIAL_TEMPLATES: WorkflowTemplate[] = [
  entry('campaign-pipeline', {
    title: { zh: '营销全链路', en: 'Full campaign pipeline' },
    description: {
      zh: '知识源 → 知识卡 → 营销 → 四平台复用 → 排期。可一键按依赖顺序跑。',
      en: 'Source → knowledge → marketing → repurpose → schedule. Pipeline-runnable.',
    },
    tags: { zh: ['全链路', '营销', '复用'], en: ['Pipeline', 'Marketing', 'Repurpose'] },
    accent: '#3b82f6',
  }, campaignPipelineSpec),
  entry('cross-platform', {
    title: { zh: '跨平台内容复用', en: 'Cross-platform reuse' },
    description: {
      zh: '粘贴成稿 → 复用节点 → 排期。快速拆 YouTube / IG / TikTok / X。',
      en: 'Paste a draft → repurpose → schedule for YT / IG / TikTok / X.',
    },
    tags: { zh: ['复用', '四平台'], en: ['Repurpose', '4 platforms'] },
    accent: '#22c55e',
  }, crossPlatformSpec),
  entry('knowledge-marketing', {
    title: { zh: '知识驱动营销', en: 'Knowledge → marketing' },
    description: {
      zh: '品牌知识卡喂营销节点，再挂排期。无知识则不能空编。',
      en: 'Knowledge card into marketing, then schedule. No inventing without upstream.',
    },
    tags: { zh: ['营销', '知识'], en: ['Marketing', 'Knowledge'] },
    accent: '#f59e0b',
  }, knowledgeMarketingSpec),
  entry('asset-campaign', {
    title: { zh: '素材驱动营销', en: 'Asset-led campaign' },
    description: {
      zh: '素材打标 + 配套知识 → 营销 → 排期；可用「匹配素材」回连。',
      en: 'Tagged asset + knowledge → marketing → schedule; Match assets to rewire.',
    },
    tags: { zh: ['素材', '打标', '营销'], en: ['Asset', 'Tags', 'Marketing'] },
    accent: '#a78bfa',
  }, assetCampaignSpec),
]

export const CREATOR_TEMPLATES: WorkflowTemplate[] = []

const ALIAS: Partial<Record<TemplateId, TemplateId>> = {
  marketing: 'knowledge-marketing',
  asset: 'asset-campaign',
}

export function getTemplate(id: TemplateId): WorkflowTemplate | undefined {
  const resolved = ALIAS[id] ?? id
  return OFFICIAL_TEMPLATES.find(t => t.id === resolved)
}

/**
 * Soft intent hint for starter chips only — Plan Apply must NOT use this.
 * Prefer Minds planApplyViaMinds for real Apply.
 */
export function matchTemplateIntent(text: string): TemplateId | null {
  const t = text.toLowerCase()
  if (/全链路|campaign pipeline|知识源.*营销|marketing.*pipeline/.test(t)) return 'campaign-pipeline'
  if (/复用|跨平台|repurpose|cross[- ]?platform|四平台/.test(t)) return 'cross-platform'
  if (/素材|资产|asset|打标|analyze/.test(t)) return 'asset-campaign'
  if (/营销|文案|campaign|marketing|推广|brief|知识/.test(t)) return 'knowledge-marketing'
  return null
}
