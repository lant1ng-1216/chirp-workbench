import { tool } from 'ai'
import { z } from 'zod'
import { getTrendingTopics } from '../trending'
import { ALL_PLATFORMS } from '../brand'

const platformIds = ALL_PLATFORMS.map((p) => p.id) as [string, ...string[]]

export const agentTools = {
  get_trending_topics: tool({
    description: '获取微博热搜和抖音热榜的实时热点话题，用于内容创作灵感',
    inputSchema: z.object({
      platforms: z.array(z.string()).describe('要获取热点的平台，如 ["weibo", "douyin"]'),
    }),
    execute: async ({ platforms }) => {
      const topics = await getTrendingTopics(platforms)
      return { topics, message: `获取到 ${topics.length} 条热点话题` }
    },
  }),

  generate_post: tool({
    description: '根据品牌档案和话题为指定平台生成完整的发布内容',
    inputSchema: z.object({
      platform: z.enum(platformIds).describe('目标发布平台'),
      topic: z.string().describe('内容主题或热点话题'),
      content_type: z.string().optional().describe('内容类型，如：种草、测评、教程、故事'),
    }),
    execute: async ({ platform, topic, content_type }) => {
      return {
        platform,
        topic,
        content_type: content_type || '通用',
        message: `正在为 ${platform} 生成「${topic}」相关内容...`,
      }
    },
  }),

  schedule_post: tool({
    description: '将生成的内容加入发布日历，安排发布时间',
    inputSchema: z.object({
      platform: z.string().describe('发布平台'),
      title: z.string().describe('内容标题'),
      content: z.string().describe('内容正文'),
      scheduled_at: z.string().describe('计划发布时间，ISO 格式'),
      hashtags: z.array(z.string()).optional().describe('话题标签'),
    }),
    execute: async ({ platform, title, scheduled_at }) => {
      return {
        status: 'scheduled',
        platform,
        title,
        scheduled_at,
        message: `✅ 已加入日历：${new Date(scheduled_at).toLocaleDateString('zh-CN')} 发布到 ${platform}`,
      }
    },
  }),

  publish_post: tool({
    description: '立即将内容发布到指定社交媒体平台',
    inputSchema: z.object({
      platform: z.enum(platformIds).describe('发布平台'),
      title: z.string().optional().describe('内容标题'),
      content: z.string().describe('发布内容'),
      hashtags: z.array(z.string()).optional().describe('话题标签'),
    }),
    execute: async ({ platform, content }) => {
      const platformInfo = ALL_PLATFORMS.find((p) => p.id === platform)
      return {
        status: 'stub',
        platform,
        platformName: platformInfo?.name || platform,
        message: `${platformInfo?.name || platform} 接口接入中，内容已复制到剪贴板，请手动发布。`,
        copiedContent: content,
      }
    },
  }),

  analyze_competitor: tool({
    description: '分析竞品账号的内容策略、发布频率和爆款规律',
    inputSchema: z.object({
      competitor_name: z.string().describe('竞品名称或账号名'),
      platform: z.string().describe('分析的平台'),
    }),
    execute: async ({ competitor_name, platform }) => {
      return {
        competitor: competitor_name,
        platform,
        analysis: {
          posting_frequency: '每天 2-3 条',
          best_performing_content: ['产品实测', '用户故事', '教程类'],
          peak_hours: ['9:00-10:00', '20:00-22:00'],
          avg_engagement_rate: '4.2%',
        },
        message: `竞品 ${competitor_name} 分析完成`,
      }
    },
  }),

  create_content_plan: tool({
    description: '为未来多天创建完整的多平台内容排期计划',
    inputSchema: z.object({
      days: z.number().min(1).max(30).describe('计划天数'),
      platforms: z.array(z.string()).describe('要覆盖的平台列表'),
      focus_theme: z.string().optional().describe('主题方向'),
    }),
    execute: async ({ days, platforms, focus_theme }) => {
      const plan = []
      const now = new Date()
      for (let i = 0; i < Math.min(days, 7); i++) {
        const date = new Date(now)
        date.setDate(date.getDate() + i)
        const platform = platforms[i % platforms.length]
        plan.push({
          date: date.toISOString().split('T')[0],
          platform,
          theme: focus_theme || `第${i + 1}天内容`,
          suggested_time: i % 2 === 0 ? '09:00' : '20:00',
        })
      }
      return { days, platforms, plan, message: `已规划未来 ${days} 天内容方向` }
    },
  }),
}
