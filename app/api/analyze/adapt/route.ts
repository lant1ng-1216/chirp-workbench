import { NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import type { BrandProfile } from '@/lib/brand'

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export async function POST(req: NextRequest) {
  const { analysis, originalContent, platform, brand } = await req.json() as {
    analysis: string
    originalContent: string
    platform: string
    brand: BrandProfile
  }

  const platformLabel: Record<string, string> = {
    xiaohongshu: '小红书',
    douyin: '抖音',
    weibo: '微博',
    bilibili: 'B站',
    twitter: 'Twitter/X',
    instagram: 'Instagram',
    wechat: '微信公众号',
    general: '通用',
  }

  const knowledgeSummary = brand.knowledgeDocs?.slice(0, 3)
    .map(d => `【${d.title}】${d.content.slice(0, 300)}`)
    .join('\n') || ''

  const result = streamText({
    model: deepseek.chat('deepseek-chat'),
    system: `你是鸣（Ming），专门帮助品牌把爆款内容的传播逻辑改编为适合自己品牌的内容。你的输出要具体可执行，直接能用。`,
    prompt: `根据以下爆款内容分析报告，为品牌「${brand.name}」生成改编建议和内容草稿。

## 爆款分析报告
${analysis}

## 爆款原始内容（节选）
${originalContent.slice(0, 2000)}

## 品牌信息
- 品牌名：${brand.name}
- 行业：${brand.industry}
- 品牌调性：${brand.tone}
- 目标受众：${brand.audience}
- 核心价值：${brand.values?.join('、') || ''}
- 内容支柱：${brand.contentPillars?.join('、') || ''}

## 品牌知识库摘要
${knowledgeSummary}

请按以下结构输出（Markdown 格式）：

## 对比分析
这条爆款内容与「${brand.name}」品牌有哪些共鸣点和差异点？能借鉴什么？需要调整什么？

## 改编策略
如何把这个爆点逻辑套用到「${brand.name}」？给出 2-3 条具体的改编方向。

## 内容草稿（${platformLabel[platform] || platform}）
直接输出一条适合「${brand.name}」在${platformLabel[platform] || platform}发布的内容草稿，完整可用，符合品牌调性。

---
格式要求：内容草稿要完整，不要省略，不要用"..."代替。`,
  })

  return result.toTextStreamResponse()
}
