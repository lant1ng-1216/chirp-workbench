import { createMindsClient, type BazaarSkill } from '@animocabrands/minds-client-lib'
import { getMindId, getMindsClient } from '@/lib/minds/client'

/** Creator-oriented search seeds — merge & rank for Chirp sidebar */
const CREATOR_QUERIES = [
  'content',
  'repurpose',
  'youtube',
  'tiktok',
  'social',
  'marketing',
  'writing',
  'copywriting',
  'brand',
  'creator',
] as const

const NAME_BOOST = /repurpose|content|youtube|tiktok|instagram|social|marketing|copy|brand|writer|humanizer|caption|viral|trend/i

export type SkillCard = {
  skillId: string
  name: string
  description: string
  equippedCount: number
  accent: string
}

const ACCENTS = ['#3b82f6', '#22c55e', '#a78bfa', '#f59e0b', '#ec4899', '#06b6d4']

function accentFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * 17) % ACCENTS.length
  return ACCENTS[h]
}

function score(s: BazaarSkill) {
  const name = s.name || ''
  const desc = s.description || ''
  let n = s.equippedCount ?? 0
  if (NAME_BOOST.test(name)) n += 500
  if (NAME_BOOST.test(desc)) n += 120
  return n
}

function toCard(s: BazaarSkill): SkillCard {
  return {
    skillId: String(s.skillId).toLowerCase(),
    name: s.name,
    description: (s.description || '').trim(),
    equippedCount: s.equippedCount ?? 0,
    accent: accentFor(String(s.skillId).toLowerCase()),
  }
}

/** Public catalog — no builder key required */
function bazaarClient() {
  return createMindsClient({})
}

export async function fetchCreatorSkills(limit = 24): Promise<SkillCard[]> {
  const client = bazaarClient()
  const map = new Map<string, BazaarSkill>()

  await Promise.all(
    CREATOR_QUERIES.map(async q => {
      try {
        const res = await client.bazaar.listSkills({ search: q, page: 1, pageSize: 12 })
        for (const item of res.items ?? []) {
          if (item?.skillId) map.set(item.skillId, item)
        }
      } catch {
        /* ignore single query failure */
      }
    }),
  )

  if (map.size === 0) {
    const res = await client.bazaar.listSkills({ page: 1, pageSize: 40 })
    for (const item of res.items ?? []) {
      if (item?.skillId) map.set(item.skillId, item)
    }
  }

  return [...map.values()]
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit)
    .map(toCard)
}

export async function listEquippedSkillIds(): Promise<Set<string>> {
  const client = getMindsClient()
  const mindId = getMindId()
  const list = await client.listEquippedSkills(mindId)
  return new Set((list ?? []).map(s => String(s.skillId).toLowerCase()).filter(Boolean))
}

export async function equipSkill(skillId: string) {
  const client = getMindsClient()
  const mindId = getMindId()
  return client.equipSkills(mindId, { ids: [skillId] })
}

export async function unequipSkill(skillId: string) {
  const client = getMindsClient()
  const mindId = getMindId()
  return client.unequipSkills(mindId, { ids: [skillId] })
}
