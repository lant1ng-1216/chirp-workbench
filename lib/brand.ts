export interface BrandProfile {
  id: string
  name: string
  industry: string
  websiteUrl: string
  logoUrl?: string
  colors: string[]
  tone: string
  audience: string
  values: string[]
  forbiddenWords: string[]
  preferredExpressions: string[]
  contentPillars: string[]
  competitors: string[]
  knowledgeDocs: KnowledgeDoc[]
  createdAt: string
}

export interface KnowledgeDoc {
  id: string
  title: string
  content: string
  type: 'business_profile' | 'brand_guidelines' | 'audience_persona' | 'social_strategy' | 'first_week_calendar' | 'competitor_deep_dive' | 'market_research' | 'onboarding_brief'
  updatedAt: string
}

export interface Project {
  id: string
  brand: BrandProfile
  threads: Thread[]
  posts: Post[]
  createdAt: string
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

export interface Post {
  id: string
  projectId: string
  platform: PlatformId
  title: string
  content: string
  hashtags: string[]
  status: 'draft' | 'scheduled' | 'published'
  scheduledAt?: string
  publishedAt?: string
  createdAt: string
}

export type PlatformId =
  | 'xiaohongshu' | 'douyin' | 'weibo' | 'wechat' | 'bilibili' | 'zhihu'
  | 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'tiktok' | 'youtube'

export const PLATFORMS = {
  domestic: [
    { id: 'xiaohongshu' as PlatformId, name: '小红书', icon: '📕', color: '#FF2442', contentTypes: ['图文笔记', '短视频'] },
    { id: 'douyin' as PlatformId, name: '抖音', icon: '🎵', color: '#161823', contentTypes: ['短视频', '图文', '直播预告'] },
    { id: 'weibo' as PlatformId, name: '微博', icon: '🌐', color: '#E6162D', contentTypes: ['文字', '长文', '话题'] },
    { id: 'wechat' as PlatformId, name: '微信公众号', icon: '💚', color: '#07C160', contentTypes: ['图文推送'] },
    { id: 'bilibili' as PlatformId, name: 'B站', icon: '📺', color: '#00A1D6', contentTypes: ['视频', '专栏文章'] },
    { id: 'zhihu' as PlatformId, name: '知乎', icon: '📝', color: '#0084FF', contentTypes: ['回答', '文章'] },
  ],
  international: [
    { id: 'twitter' as PlatformId, name: 'Twitter/X', icon: '✖️', color: '#1D9BF0', contentTypes: ['推文', '长文'] },
    { id: 'instagram' as PlatformId, name: 'Instagram', icon: '📸', color: '#E1306C', contentTypes: ['图片', 'Reels'] },
    { id: 'linkedin' as PlatformId, name: 'LinkedIn', icon: '💼', color: '#0A66C2', contentTypes: ['职场内容'] },
    { id: 'facebook' as PlatformId, name: 'Facebook', icon: '👍', color: '#1877F2', contentTypes: ['帖子', '页面'] },
    { id: 'tiktok' as PlatformId, name: 'TikTok', icon: '🎵', color: '#010101', contentTypes: ['短视频'] },
    { id: 'youtube' as PlatformId, name: 'YouTube', icon: '▶️', color: '#FF0000', contentTypes: ['视频描述', '社区帖'] },
  ],
}

export const ALL_PLATFORMS = [...PLATFORMS.domestic, ...PLATFORMS.international]
