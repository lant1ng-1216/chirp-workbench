import { NextRequest } from 'next/server'
import { getMindsClient } from '@/lib/minds/client'
import { isReplyEvent } from '@animocabrands/minds-client-lib'

export const dynamic = 'force-dynamic'

// Server-Sent Events: streams Mind replies for a conversation as they arrive,
// replacing client-side history polling. Client opens this right after send-async.
export async function GET(req: NextRequest) {
  const alias = req.nextUrl.searchParams.get('alias')
  const since = Number(req.nextUrl.searchParams.get('since') ?? '0')
  if (!alias) return new Response('alias is required', { status: 400 })

  const client = getMindsClient()
  const encoder = new TextEncoder()
  let subscription: { close(): void } | null = null
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch { closed = true }
      }

      // Keepalive comment every 20s so proxies don't kill the stream
      const keepalive = setInterval(() => send('ping', {}), 20_000)

      try {
        subscription = client.subscribeEvents({
          alias,
          onEvent: (event) => {
            // Only forward Mind replies that arrived after the client's send.
            // Minds timestamps are UTC but may lack the trailing "Z" — normalize.
            const raw = String(event.createdAt ?? '')
            const normalized = raw && !raw.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(raw) ? `${raw}Z` : raw
            const createdAt = normalized ? new Date(normalized).getTime() : Date.now()
            if (!Number.isNaN(createdAt) && createdAt < since) return
            if (!isReplyEvent(event, { alias })) return
            send('reply', { messageText: event.messageText ?? '', createdAt })
          },
          onError: (err) => {
            send('error', { message: String(err) })
            clearInterval(keepalive)
            try { controller.close() } catch { /* noop */ }
          },
        })
      } catch (e) {
        send('error', { message: String(e) })
        clearInterval(keepalive)
        try { controller.close() } catch { /* noop */ }
      }

      req.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(keepalive)
        try { subscription?.close() } catch { /* noop */ }
        try { controller.close() } catch { /* noop */ }
      })
    },
    cancel() {
      closed = true
      try { subscription?.close() } catch { /* noop */ }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
