import type { ActivityEvent, ActivityType } from './store'

export interface ActivityMeta {
  icon: string
  color: string
  labelEn: string
  labelZh: string
}

export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  repurpose: { icon: 'M4 4h16v16H4z M4 9h16 M9 9v11', color: '#3b82f6', labelEn: 'Repurposed', labelZh: '内容适配' },
  analyze:   { icon: 'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.2 2.2m8.4 8.4 2.2 2.2m0-12.8-2.2 2.2M7.8 16.2l-2.2 2.2', color: '#8b5cf6', labelEn: 'Analyzed', labelZh: '素材分析' },
  draft:     { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6', color: '#f59e0b', labelEn: 'Drafted', labelZh: '生成草稿' },
  schedule:  { icon: 'M5 4h14a2 2 0 0 1 2 2v14l-4-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', color: '#10b981', labelEn: 'Scheduled', labelZh: '已排期' },
  publish:   { icon: 'M22 2 11 13 M22 2l-7 20-4-9-9-4z', color: '#10b981', labelEn: 'Published', labelZh: '已发布' },
  digest:    { icon: 'M4 4h16v16H4z M8 9h8 M8 13h8 M8 17h5', color: '#2aabee', labelEn: 'Digest', labelZh: '日报' },
  chat:      { icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', color: '#6b7280', labelEn: 'Conversation', labelZh: '对话' },
  insight:   { icon: 'M12 2v4m0 12v4M2 12h4m12 0h4 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', color: '#f59e0b', labelEn: 'Insight', labelZh: '增长洞察' },
  connect:   { icon: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7 M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7', color: '#3b82f6', labelEn: 'Connected', labelZh: '已连接' },
  comment:   { icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z M8 9h8 M8 13h5', color: '#0ea5e9', labelEn: 'Community', labelZh: '社区回复' },
}

/* Sample feed shown before Pip is connected / no real events exist yet.
   Timestamps are generated relative to "now" so the demo always looks alive. */
export function sampleActivity(projectId: string, zh: boolean): ActivityEvent[] {
  const now = Date.now()
  const mk = (
    minAgo: number,
    type: ActivityType,
    title: string,
    detail?: string,
    platform?: string,
  ): ActivityEvent => ({
    id: `sample-${type}-${minAgo}`,
    projectId,
    ts: now - minAgo * 60000,
    type, title, detail, platform,
    source: 'sample',
  })

  return zh ? [
    mk(12, 'repurpose', '把最新视频脚本适配为四平台版本', 'YouTube 描述 · Instagram 文案 · TikTok 钩子 · X 开场推', 'youtube'),
    mk(38, 'analyze', '分析了 3 个新素材并打好标签', '识别出「教程」「幕后」两类主题', undefined),
    mk(64, 'draft', '起草了 TikTok 口播脚本', '前 3 秒钩子：「99% 的创作者都忽略了这一点」', 'tiktok'),
    mk(125, 'schedule', '把 Instagram 文案排期到今晚 8 点', '根据你的受众活跃时段自动选择', 'instagram'),
    mk(180, 'digest', '生成今日社群日报', '消息 142 · 自动回复 31 · 待人工跟进 3', 'telegram'),
    mk(320, 'insight', '发现增长机会', 'TikTok 教程类内容完播率比均值高 42%，建议本周加更', 'tiktok'),
    mk(480, 'publish', '昨日 X 帖已发布', '首日互动率 4.8%，高于账号均值', 'twitter'),
  ] : [
    mk(12, 'repurpose', 'Repurposed your latest script for 4 platforms', 'YouTube description · Instagram caption · TikTok hook · X opener', 'youtube'),
    mk(38, 'analyze', 'Analyzed 3 new assets and applied tags', 'Detected themes: "tutorial", "behind-the-scenes"', undefined),
    mk(64, 'draft', 'Drafted a TikTok voiceover script', 'Hook: "99% of creators overlook this one thing"', 'tiktok'),
    mk(125, 'schedule', 'Scheduled the Instagram caption for 8 PM tonight', 'Timed to your audience\'s peak activity window', 'instagram'),
    mk(180, 'digest', 'Generated today\'s community digest', '142 messages · 31 auto-replies · 3 need your attention', 'telegram'),
    mk(320, 'insight', 'Spotted a growth opportunity', 'TikTok tutorials are retaining 42% above your average — post more this week', 'tiktok'),
    mk(480, 'publish', 'Yesterday\'s X post is live', '4.8% engagement on day one — above your account average', 'twitter'),
  ]
}

/** Real events win; samples only appear in demo mode for an empty, unconnected project. */
export function resolveActivity(
  events: ActivityEvent[] | undefined,
  projectId: string,
  zh: boolean,
  pipConnected: boolean,
  demoMode = false,
): { events: ActivityEvent[]; isSample: boolean } {
  const real = (events ?? []).filter(e => e.source !== 'sample')
  if (real.length > 0) return { events: real, isSample: false }
  if (pipConnected || !demoMode) return { events: [], isSample: false }
  return { events: sampleActivity(projectId, zh), isSample: true }
}
