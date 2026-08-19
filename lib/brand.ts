export interface CreatorProfile {
  id: string
  name: string
  description?: string
  profileUrl?: string
  platforms: PlatformId[]
  contentStyle: string
  audience: string
  tone: string
  topics: string[]
  mindsConversationAlias: string
  mindId: string
  createdAt?: string
  // Legacy BrandProfile fields kept for store compatibility
  industry?: string
  websiteUrl?: string
  colors?: string[]
  values?: string[]
  forbiddenWords?: string[]
  preferredExpressions?: string[]
  contentPillars?: string[]
  competitors?: string[]
  knowledgeDocs?: KnowledgeDoc[]
}

export type BrandProfile = CreatorProfile

export interface KnowledgeDoc {
  id: string
  title: string
  content: string
  type: 'business_profile' | 'brand_guidelines' | 'audience_persona' | 'social_strategy' | 'first_week_calendar' | 'competitor_deep_dive' | 'market_research' | 'onboarding_brief'
  updatedAt: string
}

export interface Project {
  id: string
  /** Display name (falls back to brand.name) */
  name?: string
  brand: BrandProfile
  threads: Thread[]
  posts: Post[]
  createdAt: string
  updatedAt?: string
}

export interface Thread {
  id: string
  projectId: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCallStep[]
  createdAt: string
}

export interface ToolCallStep {
  toolName: string
  args: Record<string, unknown>
  result?: unknown
  status: 'running' | 'done' | 'error'
}

export interface PublishReceipt {
  /** 'live' = real platform API, 'simulated' = demo adapter */
  via: 'live' | 'simulated'
  /** Canonical URL of the published post (live adapters only) */
  url?: string
  at: string
}

export interface Post {
  id: string
  projectId: string
  platform: PlatformId
  title: string
  content: string
  hashtags: string[]
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduledAt?: string
  publishedAt?: string
  publishReceipt?: PublishReceipt
  /** Last publish error message (status 'failed') */
  publishError?: string
  createdAt: string
}

/** X API credentials — BYOK: user applies at developer.x.com, stored in their browser only */
export interface XCredentials {
  apiKey: string
  apiSecret: string
  accessToken: string
  accessSecret: string
}

/** YouTube Data API credentials — BYOK via Google OAuth refresh token */
export interface YouTubeCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
}

/** A social account the creator connected (OAuth or simulated) */
export interface PlatformAccount {
  platformId: string
  status: 'connected' | 'disconnected'
  /** 'live' = real API credentials (BYOK, stored client-side), 'simulated' = demo */
  via: 'live' | 'simulated'
  handle: string
  connectedAt: string
  /** BYOK X credentials — never leave the browser except via our X API routes */
  credentials?: XCredentials
  /** BYOK YouTube credentials */
  youtubeCredentials?: YouTubeCredentials
}

export type PlatformId = 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'telegram'

export const PLATFORMS = {
  international: [
    { id: 'youtube' as PlatformId, name: 'YouTube', color: '#FF0000', contentTypes: ['Video description', 'Community post'], contentTypesZh: ['视频简介', '社区帖'] },
    { id: 'instagram' as PlatformId, name: 'Instagram', color: '#E1306C', contentTypes: ['Caption', 'Reels', 'Story'], contentTypesZh: ['配文', 'Reels', '快拍'] },
    { id: 'tiktok' as PlatformId, name: 'TikTok', color: '#010101', contentTypes: ['Script', 'Hook', 'Caption'], contentTypesZh: ['脚本', '开场钩子', '配文'] },
    { id: 'twitter' as PlatformId, name: 'X (Twitter)', color: '#1D9BF0', contentTypes: ['Tweet', 'Thread'], contentTypesZh: ['推文', '长推串'] },
    { id: 'telegram' as PlatformId, name: 'Telegram', color: '#2AABEE', contentTypes: ['Community message', 'Digest'], contentTypesZh: ['社区消息', '每日摘要'] },
  ],
}

export const ALL_PLATFORMS = PLATFORMS.international

export const PLATFORM_META: Record<PlatformId, { charLimit: string; bestTime: string; tip: string; frequency: string }> = {
  youtube:   { charLimit: '≤5000 chars (description)', bestTime: '3–6 PM local time', tip: 'Hook viewers in the first 30s. SEO-optimised title and tags matter most.', frequency: '1–2 videos/week' },
  instagram: { charLimit: '≤2200 chars', bestTime: '11 AM–1 PM / 7–9 PM', tip: 'Reels get priority in the algorithm. Strong first frame is essential.', frequency: '4–6 posts/week' },
  tiktok:    { charLimit: 'Video-first', bestTime: '7–10 PM', tip: 'First 3 seconds determine watch rate. Trending audio boosts reach.', frequency: '1–2 videos/day' },
  twitter:   { charLimit: '≤280 chars', bestTime: '9–10 AM / 8 PM', tip: 'Thread format increases depth. Images/video outperform text-only.', frequency: '1–3 tweets/day' },
  telegram:  { charLimit: 'No limit', bestTime: 'Anytime', tip: 'Consistent daily digests keep community engaged. Pin key announcements.', frequency: 'Daily digest recommended' },
}

export const PLATFORM_META_ZH: Record<PlatformId, { charLimit: string; bestTime: string; tip: string; frequency: string }> = {
  youtube:   { charLimit: '≤5000 字符（简介）', bestTime: '本地时间 15:00–18:00', tip: '前 30 秒抓住观众。标题和标签的 SEO 最关键。', frequency: '每周 1–2 条视频' },
  instagram: { charLimit: '≤2200 字符', bestTime: '11:00–13:00 / 19:00–21:00', tip: 'Reels 有算法优先权。首帧必须抓眼。', frequency: '每周 4–6 帖' },
  tiktok:    { charLimit: '以视频为主', bestTime: '19:00–22:00', tip: '前 3 秒决定完播率。热门音乐能显著提升曝光。', frequency: '每天 1–2 条视频' },
  twitter:   { charLimit: '≤280 字符', bestTime: '9:00–10:00 / 20:00', tip: '长推串更有深度。图文/视频优于纯文字。', frequency: '每天 1–3 条推文' },
  telegram:  { charLimit: '无限制', bestTime: '任意时间', tip: '稳定的每日摘要保持社区活跃。重要公告要置顶。', frequency: '建议每日摘要' },
}
