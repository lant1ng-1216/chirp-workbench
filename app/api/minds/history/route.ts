import { NextRequest, NextResponse } from 'next/server'
import { getPipHistory } from '@/lib/minds/pip'

export async function GET(req: NextRequest) {
  try {
    const alias = req.nextUrl.searchParams.get('alias')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10)
    if (!alias) return NextResponse.json({ error: 'alias is required' }, { status: 400 })
    const history = await getPipHistory(alias, limit)
    return NextResponse.json({ history })
  } catch (e) {
    console.error('[minds/history]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
