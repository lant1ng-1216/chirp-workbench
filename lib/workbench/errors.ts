/** Classify Minds / workbench failures for honest UI. */
export type MindsFailKind = 'timeout' | 'empty-reply' | 'parse-failed' | 'other'

export function classifyMindsError(raw?: string | null): MindsFailKind {
  const s = (raw || '').toLowerCase()
  if (!s || s === 'empty' || s.includes('empty-reply')) return 'empty-reply'
  if (s === 'timeout' || s.includes('timed out') || s.includes('超时')) return 'timeout'
  if (
    s.includes('parse')
    || s.includes('repurpose-failed')
    || s.includes('json')
    || s.includes('unusable')
  ) return 'parse-failed'
  return 'other'
}

export function mindsErrorMessage(kind: MindsFailKind, zh: boolean, detail?: string): string {
  switch (kind) {
    case 'timeout':
      return zh
        ? '等待超时（可能回复较慢或通道丢事件）。可点重试。'
        : 'Timed out (slow reply or missed event). You can retry.'
    case 'empty-reply':
      return zh
        ? 'Agent 没有返回可用内容。可点重试或换个说法。'
        : 'Agent returned no usable content. Retry or rephrase.'
    case 'parse-failed':
      return zh
        ? `结果格式无法解析${detail ? `：${detail}` : ''}。可点重试。`
        : `Could not parse result${detail ? `: ${detail}` : ''}. Retry.`
    default:
      return detail || (zh ? '运行失败' : 'Run failed')
  }
}
