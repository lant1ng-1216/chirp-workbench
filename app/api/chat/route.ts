import { NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, stepCountIs } from 'ai'
import { agentTools } from '@/lib/agent/tools'
import { getMingSystemPrompt } from '@/lib/prompts'
import type { BrandProfile } from '@/lib/brand'

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

export async function POST(req: NextRequest) {
  const { messages, brandProfile } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    brandProfile: BrandProfile
  }

  const result = streamText({
    model: deepseek.chat('deepseek-chat'),
    system: getMingSystemPrompt(brandProfile),
    messages,
    tools: agentTools,
    temperature: 0.7,
    stopWhen: stepCountIs(5),
  })

  // Build a custom data stream from fullStream so the client gets
  // text deltas (type 0:), tool calls (type 9:), and tool results (type a:)
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.fullStream) {
          let line = ''
          if (chunk.type === 'text-delta') {
            line = `0:${JSON.stringify(chunk.text)}\n`
          } else if (chunk.type === 'tool-call') {
            const tc = chunk as { type: 'tool-call'; toolCallId: string; toolName: string; input?: unknown; args?: unknown }
            line = `9:${JSON.stringify({ toolCallId: tc.toolCallId, toolName: tc.toolName, args: tc.input ?? tc.args })}\n`
          } else if (chunk.type === 'tool-result') {
            const tr = chunk as { type: 'tool-result'; toolCallId: string; output?: unknown; result?: unknown }
            line = `a:${JSON.stringify({ toolCallId: tr.toolCallId, result: tr.output ?? tr.result })}\n`
          }
          if (line) controller.enqueue(encoder.encode(line))
        }
      } catch (e) {
        console.error('[chat] stream error:', e)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Accel-Buffering': 'no',
    },
  })
}
