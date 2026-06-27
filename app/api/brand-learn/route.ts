import { NextRequest, NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { scrapeWebsite, extractColors } from '@/lib/scraper'
import { getBrandExtractPrompt, getKnowledgeDocsPrompt } from '@/lib/prompts'
import type { BrandProfile, KnowledgeDoc } from '@/lib/brand'

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    // Step 1: Scrape the website
    let scraped
    try {
      scraped = await scrapeWebsite(url)
    } catch {
      // If scraping fails, use minimal data
      scraped = {
        title: url.replace(/https?:\/\//, '').split('/')[0],
        description: '',
        bodyText: `这是 ${url} 的品牌网站`,
        logoUrl: null,
        themeColor: null,
        ogImage: null,
      }
    }

    // Step 2: Extract brand info with DeepSeek
    const extractResult = await generateText({
      model: deepseek.chat('deepseek-chat'),
      prompt: getBrandExtractPrompt(scraped.bodyText || scraped.description),
      temperature: 0.3,
    })

    let brandData: Partial<BrandProfile> = {}
    try {
      const jsonMatch = extractResult.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) brandData = JSON.parse(jsonMatch[0])
    } catch {
      brandData = {
        name: scraped.title || 'My Brand',
        industry: '科技',
        tone: '专业、友好、创新',
        audience: '对科技感兴趣的年轻用户',
        values: ['创新', '品质', '用户至上'],
        forbiddenWords: [],
        preferredExpressions: [],
        contentPillars: ['产品功能', '用户故事', '行业洞察', '品牌文化'],
      }
    }

    // Step 3: Generate knowledge docs
    const docsResult = await generateText({
      model: deepseek.chat('deepseek-chat'),
      prompt: getKnowledgeDocsPrompt({
        name: brandData.name || scraped.title || 'Brand',
        industry: brandData.industry || '科技',
        tone: brandData.tone || '专业友好',
        audience: brandData.audience || '年轻用户',
        values: brandData.values || ['创新', '品质'],
        websiteContent: scraped.bodyText,
      }),
      temperature: 0.4,
    })

    let knowledgeDocs: KnowledgeDoc[] = []
    try {
      const jsonMatch = docsResult.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const rawDocs = JSON.parse(jsonMatch[0])
        knowledgeDocs = rawDocs.map((d: { type: string; title: string; content: string }, i: number) => ({
          id: `doc-${Date.now()}-${i}`,
          title: d.title,
          content: d.content,
          type: d.type,
          updatedAt: new Date().toISOString(),
        }))
      }
    } catch {
      knowledgeDocs = []
    }

    // Step 4: Extract colors
    const colors = scraped.themeColor
      ? [scraped.themeColor]
      : extractColors(scraped.bodyText).slice(0, 5)

    const profile: BrandProfile = {
      id: `brand-${Date.now()}`,
      name: brandData.name || scraped.title || 'My Brand',
      industry: brandData.industry || '科技',
      websiteUrl: url,
      logoUrl: scraped.logoUrl ?? undefined,
      colors: colors.length > 0 ? colors : ['#6C63FF'],
      tone: brandData.tone || '专业、友好',
      audience: brandData.audience || '目标用户',
      values: brandData.values || ['创新', '品质'],
      forbiddenWords: brandData.forbiddenWords || [],
      preferredExpressions: brandData.preferredExpressions || [],
      contentPillars: brandData.contentPillars || ['产品', '用户', '品牌', '行业'],
      competitors: [],
      knowledgeDocs,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Brand learn error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to learn brand' },
      { status: 500 }
    )
  }
}
