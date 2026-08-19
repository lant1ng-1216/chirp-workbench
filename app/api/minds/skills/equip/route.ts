import { NextRequest, NextResponse } from 'next/server'
import { equipSkill, unequipSkill } from '@/lib/minds/bazaarSkills'

/**
 * POST /api/minds/skills/equip
 * Body: { skillId: string, action?: 'equip' | 'unequip' }
 * Equips / unequips on the platform Mind (MINDS_MIND_ID).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { skillId?: string; action?: 'equip' | 'unequip' }
    const skillId = body.skillId?.trim().toLowerCase()
    if (!skillId) {
      return NextResponse.json({ error: 'skillId is required' }, { status: 400 })
    }
    const action = body.action === 'unequip' ? 'unequip' : 'equip'
    const result = action === 'unequip'
      ? await unequipSkill(skillId)
      : await equipSkill(skillId)

    return NextResponse.json({ ok: true, action, result })
  } catch (e) {
    console.error('[minds/skills/equip]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
