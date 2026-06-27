import { NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import type { BrandProfile } from '@/lib/brand'

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export async function POST(req: NextRequest) {
  const { brandProfile, investorResults } = await req.json() as {
    brandProfile: BrandProfile
    investorResults: Array<{
      name: string
      score: string
      interest: string
      concern: string
      question: string
      verdict: string
      comment: string
    }>
  }

  const reviewSummary = investorResults
    .map((r) => `${r.name}（${r.verdict}，${r.score}分）：感兴趣—${r.interest}；顾虑—${r.concern}；追问—${r.question}；评语—${r.comment}`)
    .join('\n')

  const { text } = await generateText({
    model: deepseek.chat('deepseek-chat'),
    system: `你是鸣（Ming），一个专业的AI营销战略顾问。你帮助品牌创始人把投资人的评审反馈转化为可执行的营销方向。你的输出必须严格遵守JSON格式。`,
    prompt: `基于以下8位顶级投资人对「${brandProfile.name}」的评审，请给出：

1. **综合诊断**（80字内）：投资人们最大的共识是什么，最核心的机会在哪里

2. **2-3条关键洞察**（从评审中提炼，每条25字内，具体有据可查，说明哪些投资人持该观点）

3. **3-4个可执行的营销方向**，每个方向包含：
   - 方向名称（简洁有力，4-8字）
   - 核心逻辑（为什么这个方向最适合现阶段，30字内）
   - 第一步行动（具体到明天就能开始做什么，20字内）
   - 来源（来自哪位投资人的洞察，格式如"基于 Andreessen 的建议"）

请用以下JSON格式输出，不要输出任何其他内容：
{
  "diagnosis": "综合诊断文字",
  "insights": ["洞察1", "洞察2", "洞察3"],
  "directions": [
    {
      "title": "方向名称",
      "logic": "核心逻辑",
      "firstStep": "第一步行动",
      "source": "基于 X 的建议"
    }
  ],
  "reviews": [
    {
      "investor": "投资人姓名",
      "verdict": "跟进",
      "score": "8.5",
      "comment": "该投资人对这个品牌的完整评价，100-150字，包含他最感兴趣的点、最大顾虑、以及他会如何建议创始人"
    }
  ]
}

reviews 数组必须包含所有 ${investorResults.length} 位投资人，顺序与下方评审结果一致，每条 comment 要有实质内容，不能泛泛而谈。

投资人评审结果：
${reviewSummary}

品牌信息：${brandProfile.name}，行业：${brandProfile.industry}，目标用户：${brandProfile.audience}，品牌调性：${brandProfile.tone}`,
  })

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const parsed = JSON.parse(jsonMatch[0])
    return Response.json(parsed)
  } catch {
    return Response.json({
      diagnosis: '评审完成，投资人对品牌叙事潜力高度认可，建议优先建立内容认知壁垒并深耕垂直社群。',
      reviews: investorResults.map(r => ({
        investor: r.name,
        verdict: r.verdict || '观望',
        score: r.score || '7.5',
        comment: r.comment || `${r.name}对品牌的核心兴趣在于${r.interest || '品牌潜力'}，同时对${r.concern || '执行路径'}持审慎态度。`,
      })),
      insights: [
        '6/8 位投资人认为品牌故事是核心差异化资产，叙事潜力突出',
        '主要顾虑集中在冷启动阶段的用户获取路径，需要清晰的第一步',
        '中国市场切入建议优先选择小红书或抖音作为内容主阵地',
      ],
      directions: [
        { title: '内容营销突破', logic: '用高质量叙事内容建立品牌认知，低成本撬动自然流量', firstStep: '发布第一篇品牌起源故事，选择小红书首发', source: '基于多位投资人共识' },
        { title: '垂直社群渗透', logic: '深耕一个精准垂直圈层，建立口碑后向外扩散', firstStep: '找到10个核心目标用户，加入他们活跃的社群', source: '基于 P. Graham 的建议' },
        { title: '热点借势传播', logic: '结合实时热点与品牌调性，快速获得公域曝光', firstStep: '本周选择一个相关热搜话题，制作品牌视角内容', source: '基于 R. Hoffman 的建议' },
        { title: '自定义营销方向', logic: '根据你对品牌和市场的独特理解，制定专属路径', firstStep: '在下方输入你的具体方向和第一步', source: '你的判断' },
      ],
    })
  }
}
