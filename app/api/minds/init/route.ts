import { NextRequest, NextResponse } from 'next/server'
import { ensurePipConversation } from '@/lib/minds/pip'

export async function POST(req: NextRequest) {
  try {
    const { alias } = await req.json() as { alias: string }
    if (!alias) return NextResponse.json({ error: 'alias is required' }, { status: 400 })
    const result = await ensurePipConversation(alias)
    return NextResponse.json(result)
  } catch (e) {
    console.error('[minds/init]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
