import { NextRequest, NextResponse } from 'next/server'
import { publishToPlatform } from '@/lib/platforms'
import type { PlatformId } from '@/lib/brand'

export async function POST(req: NextRequest) {
  const { platform, content, title } = await req.json()
  const result = await publishToPlatform(platform as PlatformId, content, title)
  return NextResponse.json(result)
}
