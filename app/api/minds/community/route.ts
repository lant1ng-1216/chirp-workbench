import { NextRequest, NextResponse } from 'next/server'
import { generateCommunityDigest } from '@/lib/minds/pip'
import type { CreatorProfile } from '@/lib/brand'

export async function POST(req: NextRequest) {
  try {
    const { alias, profile } = await req.json() as { alias: string; profile: CreatorProfile }
    if (!alias || !profile) {
      return NextResponse.json({ error: 'alias and profile are required' }, { status: 400 })
    }
    const digest = await generateCommunityDigest(alias, profile)
    return NextResponse.json({ digest })
  } catch (e) {
    console.error('[minds/community]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
