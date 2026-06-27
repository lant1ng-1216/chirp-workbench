import { NextRequest, NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
})

export async function POST(req: NextRequest) {
  const { content } = await req.json()
  if (!content) return NextResponse.json({ cards: [] })

  const { text } = await generateText({
    model: deepseek.chat('deepseek-chat'),
    messages: [
      {
        role: 'system',
        content: `你是一个内容提取助手。从用户提供的 AI 营销助手回复中，提取所有可以直接发布到社交平台的完整营销文案。
只提取完整的、可直接发布的文案内容（包括标题、正文、话题标签等），不要提取分析、建议、排期、说明性文字。
以 JSON 数组返回，格式：[{"platform":"平台名","content":"完整文案内容"}]
平台名只能是：小红书、微博、抖音、B站、微信公众号、知乎、Twitter、Instagram、LinkedIn 之一。
如果没有可提取的营销文案，返回空数组 []。
只返回 JSON，不要其他文字。`,
      },
      { role: 'user', content },
    ],
  })

  try {
    const json = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
    const cards = JSON.parse(json)
    return NextResponse.json({ cards: Array.isArray(cards) ? cards : [] })
  } catch {
    return NextResponse.json({ cards: [] })
  }
}
