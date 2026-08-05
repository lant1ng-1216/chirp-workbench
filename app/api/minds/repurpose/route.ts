import { NextRequest, NextResponse } from 'next/server'
import { repurposeContent } from '@/lib/minds/pip'
import type { CreatorProfile } from '@/lib/brand'

export async function POST(req: NextRequest) {
  try {
    const { alias, profile, input } = await req.json() as {
      alias: string
      profile: CreatorProfile
      input: string
    }
    if (!alias || !profile || !input) {
      return NextResponse.json({ error: 'alias, profile, and input are required' }, { status: 400 })
    }
    const result = await repurposeContent(alias, profile, input)
    // Strip any HTML tags that Minds may return
    const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    return NextResponse.json({
      youtube:   strip(result.youtube),
      instagram: strip(result.instagram),
      tiktok:    strip(result.tiktok),
      twitter:   strip(result.twitter),
    })
  } catch (e) {
    console.error('[minds/repurpose]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
