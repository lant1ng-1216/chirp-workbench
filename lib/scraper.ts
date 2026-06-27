export interface ScrapedData {
  title: string
  description: string
  bodyText: string
  logoUrl: string | null
  themeColor: string | null
  ogImage: string | null
  scrapedLength: number
  scrapedSource: 'firecrawl' | 'jina' | 'direct' | 'fallback'
}

// Known login-wall domains — skip URL scraping, tell user to paste text
const LOGIN_WALL_DOMAINS = [
  'twitter.com', 'x.com',
  'instagram.com',
  'linkedin.com',
  'facebook.com',
]

export function isLoginWallUrl(url: string): boolean {
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '')
    return LOGIN_WALL_DOMAINS.some(d => host === d || host.endsWith('.' + d))
  } catch { return false }
}

async function tryFirecrawl(url: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 20000,
      }),
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const md: string = data?.data?.markdown || data?.markdown || ''
    return md.trim().length > 150 ? md.slice(0, 20000) : null
  } catch (e) {
    console.warn('[scraper] Firecrawl failed:', e instanceof Error ? e.message : e)
    return null
  }
}

async function tryJina(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown',
        'X-Timeout': '18',
        'X-Remove-Selector': 'nav,footer,aside,.sidebar,.ad,.advertisement',
        'X-Target-Selector': 'main,article,.content,.post,body',
      },
      signal: AbortSignal.timeout(22000),
    })
    if (!res.ok) return null
    const md = await res.text()
    return md.trim().length > 150 ? md.slice(0, 20000) : null
  } catch (e) {
    console.warn('[scraper] Jina failed:', e instanceof Error ? e.message : e)
    return null
  }
}

async function tryDirect(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    })
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000)
    return text.length > 100 ? text : null
  } catch (e) {
    console.warn('[scraper] Direct fetch failed:', e instanceof Error ? e.message : e)
    return null
  }
}

// Best-of-N: run all engines concurrently, pick the longest result
export async function multiScrape(url: string): Promise<{ content: string; source: 'firecrawl' | 'jina' | 'direct' | 'fallback' }> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

  const [firecrawlResult, jinaResult, directResult] = await Promise.allSettled([
    tryFirecrawl(normalizedUrl),
    tryJina(normalizedUrl),
    tryDirect(normalizedUrl),
  ])

  const candidates: { content: string; source: 'firecrawl' | 'jina' | 'direct' }[] = []

  if (firecrawlResult.status === 'fulfilled' && firecrawlResult.value) {
    candidates.push({ content: firecrawlResult.value, source: 'firecrawl' })
  }
  if (jinaResult.status === 'fulfilled' && jinaResult.value) {
    candidates.push({ content: jinaResult.value, source: 'jina' })
  }
  if (directResult.status === 'fulfilled' && directResult.value) {
    candidates.push({ content: directResult.value, source: 'direct' })
  }

  if (candidates.length === 0) {
    return { content: '', source: 'fallback' }
  }

  // Pick the richest result
  candidates.sort((a, b) => b.content.length - a.content.length)
  return candidates[0]
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

  const { content, source } = await multiScrape(normalizedUrl)
  const bodyText = content

  if (!bodyText) {
    const host = normalizedUrl.replace(/https?:\/\//, '').split('/')[0]
    return { title: host, description: '', bodyText: '', logoUrl: null, themeColor: null, ogImage: null, scrapedLength: 0, scrapedSource: 'fallback' }
  }

  const titleMatch = bodyText.match(/^#\s+(.+)$/m)
  const title = titleMatch?.[1]?.trim() || normalizedUrl.replace(/https?:\/\//, '').split('/')[0]
  const lines = bodyText.split('\n').filter(l => l.trim() && !l.startsWith('#'))
  const description = lines[0]?.slice(0, 400) || ''

  return { title, description, bodyText, logoUrl: null, themeColor: null, ogImage: null, scrapedLength: bodyText.length, scrapedSource: source }
}

export function extractColors(text: string): string[] {
  const colorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g
  const matches = text.match(colorRegex) || []
  const unique = [...new Set(matches)]
    .filter((c) => {
      const hex = c.replace('#', '').padEnd(6, '0')
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness > 30 && brightness < 230
    })
    .slice(0, 5)
  return unique.length > 0 ? unique : ['#6C63FF']
}
