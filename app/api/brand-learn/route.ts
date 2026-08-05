import { NextResponse } from 'next/server'

// Deprecated — use /api/minds/init instead
export async function POST() {
  return NextResponse.json({ error: 'Use /api/minds/init' }, { status: 410 })
}
