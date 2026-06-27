import { NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { multiScrape, isLoginWallUrl } from '@/lib/scraper'

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

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

export async function POST(req: NextRequest) {
  const { url, text, platform } = await req.json() as {
    url?: string
    text?: string
    platform: string
  }

  let content = text || ''
  let fetchedUrl = url || ''
  let scrapeSource = ''

  if (url && !text) {
    // Check login-wall domains upfront
    if (isLoginWallUrl(url)) {
      return new Response(JSON.stringify({
        error: `${platformLabel[platform] || platform} 需要登录才能读取，请切换到「粘贴正文」模式，把帖子内容复制过来`,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    const result = await multiScrape(normalizedUrl)
    if (result.content) {
      content = result.content
      fetchedUrl = normalizedUrl
      scrapeSource = result.source
    }
  }

  if (!content.trim()) {
    return new Response(JSON.stringify({ error: '无法读取链接内容，请切换到「粘贴正文」模式' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const sourceLabel = scrapeSource === 'firecrawl' ? '（Firecrawl 渲染抓取）' : scrapeSource === 'jina' ? '（Jina Reader）' : scrapeSource === 'direct' ? '（直接抓取）' : ''

  const result = streamText({
    model: deepseek.chat('deepseek-chat'),
    system: `你是鸣（Ming），一个专业的内容营销策略师，擅长分析爆款内容背后的传播逻辑。你的分析要具体、有洞察、可执行。`,
    prompt: `请对以下${platformLabel[platform] || platform}内容进行深度爆款拆解分析。

内容来源：${fetchedUrl || '用户粘贴'}${sourceLabel}
平台：${platformLabel[platform] || platform}

---内容开始---
${content}
---内容结束---

请按以下结构输出分析报告（使用 Markdown 格式）：

## 内容概览
简述这条内容的核心主题和形式（2-3句话）。

## 标题 / 钩子分析
这条内容的开头或标题用了什么技巧来吸引注意力？具体分析钩子类型（好奇心缺口 / 利益承诺 / 情绪触发 / 争议设置 / 共鸣场景等）。

## 情绪触发点
内容触发了哪种情绪？（共鸣 / 焦虑 / 好奇 / 愤怒 / 感动等）为什么这种情绪能推动转发？

## 传播结构
内容是如何组织的？开头如何勾住读者，中间如何留住，结尾如何促成行动或分享？

## 爆点核心
用一句话总结这条内容能爆的最核心原因。

## 可复用的内容模式
提炼出 2-3 个可以被其他品牌复用的内容公式或模板，格式如：
- **公式名称**：[具体结构描述]

---
注意：分析要具体，引用内容中的实际文字，不要泛泛而谈。`,
  })

  return result.toTextStreamResponse()
}
