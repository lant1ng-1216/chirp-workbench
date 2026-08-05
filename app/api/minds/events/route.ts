import { NextRequest } from 'next/server'
import { getMindsClient } from '@/lib/minds/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const alias = req.nextUrl.searchParams.get('alias')
  if (!alias) {
    return new Response('alias is required', { status: 400 })
  }

  const encoder = new TextEncoder()
  const client = getMindsClient()

  const stream = new ReadableStream({
    start(controller) {
      const sub = client.subscribeEvents({
        alias,
        onEvent: (event) => {
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        },
        onError: (err) => {
          console.error('[minds/events] SSE error:', err)
          controller.close()
        },
        signal: req.signal,
      })

      req.signal.addEventListener('abort', () => {
        sub.close()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
