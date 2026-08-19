import { NextRequest, NextResponse } from 'next/server'
import { fetchCreatorSkills, listEquippedSkillIds } from '@/lib/minds/bazaarSkills'

/**
 * GET /api/minds/bazaar/skills?offset=0&limit=4
 * Creator-filtered Bazaar skills + equipped flags for the platform Mind.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const offset = Math.max(0, Number(searchParams.get('offset') ?? 0) || 0)
    const limit = Math.min(12, Math.max(1, Number(searchParams.get('limit') ?? 4) || 4))

    const all = await fetchCreatorSkills(32)
    const slice = all.slice(offset, offset + limit)
    const nextOffset = offset + limit >= all.length ? 0 : offset + limit

    let equipped = new Set<string>()
    try {
      equipped = await listEquippedSkillIds()
    } catch {
      /* listing equipped needs builder key — still return catalog */
    }

    return NextResponse.json({
        items: slice.map(s => ({
          ...s,
          equipped: equipped.has(String(s.skillId).toLowerCase()),
        })),
      total: all.length,
      offset,
      nextOffset,
    })
  } catch (e) {
    console.error('[minds/bazaar/skills]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
