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

export type PlatformId = 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'telegram'

export const PLATFORMS = {
  international: [
    { id: 'youtube' as PlatformId, name: 'YouTube', color: '#FF0000', contentTypes: ['Video description', 'Community post'] },
    { id: 'instagram' as PlatformId, name: 'Instagram', color: '#E1306C', contentTypes: ['Caption', 'Reels', 'Story'] },
    { id: 'tiktok' as PlatformId, name: 'TikTok', color: '#010101', contentTypes: ['Script', 'Hook', 'Caption'] },
    { id: 'twitter' as PlatformId, name: 'X (Twitter)', color: '#1D9BF0', contentTypes: ['Tweet', 'Thread'] },
    { id: 'telegram' as PlatformId, name: 'Telegram', color: '#2AABEE', contentTypes: ['Community message', 'Digest'] },
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
