/** Tag / text overlap scoring for asset ↔ marketing wiring. */

export type MatchableAsset = {
  id: string
  title: string
  body: string
  tags?: string[]
}

export type AssetMatch = {
  assetId: string
  title: string
  score: number
  reasons: string[]
}

function tokenize(text: string): Set<string> {
  const raw = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s#+_-]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2)
  return new Set(raw)
}

function normalizeTag(t: string): string {
  return t.trim().toLowerCase().replace(/^#/, '')
}

/**
 * Rank canvas assets for a marketing draft / brief.
 * Prefers tag hits; falls back to title/body token overlap.
 */
export function rankAssetsForMarketing(
  marketingText: string,
  assets: MatchableAsset[],
  opts?: { alreadyConnected?: Set<string>; limit?: number },
): AssetMatch[] {
  const connected = opts?.alreadyConnected ?? new Set<string>()
  const limit = opts?.limit ?? 5
  const mTokens = tokenize(marketingText)
  const mTags = new Set(
    [...mTokens].filter(t => t.length >= 3),
  )

  const scored: AssetMatch[] = []
  for (const a of assets) {
    if (connected.has(a.id)) continue
    const tags = (a.tags ?? []).map(normalizeTag).filter(Boolean)
    if (tags.length === 0 && !a.body.trim() && !a.title.trim()) continue

    let score = 0
    const reasons: string[] = []
    for (const tag of tags) {
      if (!tag) continue
      if (mTokens.has(tag) || [...mTokens].some(t => t.includes(tag) || tag.includes(t))) {
        score += 3
        reasons.push(`tag:${tag}`)
      }
    }
    const aTokens = tokenize(`${a.title}\n${a.body}\n${tags.join(' ')}`)
    let overlap = 0
    for (const t of aTokens) {
      if (mTags.has(t)) overlap++
    }
    if (overlap > 0) {
      score += Math.min(overlap, 6)
      if (reasons.length === 0) reasons.push(`overlap:${overlap}`)
    }
    // Soft boost if asset has any tags at all (analyzed) even with weak overlap
    if (tags.length > 0 && score === 0) {
      score = 0.5
      reasons.push('tagged')
    }
    if (score <= 0) continue
    scored.push({
      assetId: a.id,
      title: a.title || a.id,
      score,
      reasons: reasons.slice(0, 4),
    })
  }

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
  return scored.slice(0, limit)
}

/**
 * When Apply leaves knowledge/marketing bodies empty, pull concrete lines
 * from the Plan conversation so the graph is not a hollow scaffold.
 */
export function enrichWorkflowFromConversation(
  nodes: Array<{ kind: string; title?: string; body?: string }>,
  conversation: string,
): Array<{ kind: string; title?: string; body?: string }> {
  const userLines = conversation
    .split(/\n+/)
    .map(l => l.replace(/^(User|Assistant|用户|助手)\s*:\s*/i, '').trim())
    .filter(l => l.length > 8 && !l.startsWith('{'))

  const blob = userLines.join('\n').slice(0, 2400)
  if (!blob.trim()) return nodes

  const looksEmpty = (body?: string) => {
    const b = (body || '').trim()
    if (!b) return true
    return /粘贴|Paste|可选|optional|Fill by|运行「提炼」|补充 brief/i.test(b) && b.length < 80
  }

  return nodes.map(n => {
    if (n.kind === 'knowledgeSource' && looksEmpty(n.body)) {
      return {
        ...n,
        body: blob.slice(0, 1800),
        title: n.title?.trim() || 'Plan brief',
      }
    }
    if (n.kind === 'knowledgeCard' && looksEmpty(n.body)) {
      return {
        ...n,
        body: blob.slice(0, 1200),
      }
    }
    if (n.kind === 'marketing' && looksEmpty(n.body)) {
      const brief = userLines.find(l => /营销|campaign|推广|文案|audience|平台/i.test(l))
        || userLines[0]
      return {
        ...n,
        body: brief ? `Brief from plan:\n${brief.slice(0, 600)}` : n.body,
      }
    }
    if (n.kind === 'note' && looksEmpty(n.body)) {
      return { ...n, body: blob.slice(0, 1400) }
    }
    return n
  })
}
