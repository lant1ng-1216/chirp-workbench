import type { Post, PublishReceipt, XCredentials, YouTubeCredentials } from '@/lib/brand'
import { postTweet } from './x'

/**
 * Publishing adapter registry — provider pattern modeled on Postiz's
 * integrations layer (github.com/gitroomhq/postiz-app, AGPL — we reference
 * its architecture, not its code).
 *
 * Each adapter declares:
 *  - envReady(): whether real API credentials are configured server-side
 *  - publishLive(): the REAL platform API call (used when envReady && account is live)
 *
 * When credentials are absent or the connected account is simulated,
 * the dispatcher falls back to a simulated receipt — demo and production
 * share the exact same call path.
 */

export interface PublishContext {
  /** Connected account handle, e.g. '@mychannel' */
  handle?: string
  /** OAuth access token (live accounts only, resolved server-side) */
  accessToken?: string
  /** BYOK credentials for OAuth 1.0a platforms (X) */
  credentials?: XCredentials
  /** BYOK YouTube OAuth refresh credentials */
  youtubeCredentials?: YouTubeCredentials
}

export interface AdapterResult {
  ok: boolean
  url?: string
  error?: string
}

export interface PlatformAdapter {
  id: string
  envReady: () => boolean
  publishLive: (post: Post, ctx: PublishContext) => Promise<AdapterResult>
}

/* ── X (Twitter) — POST https://api.x.com/2/tweets (OAuth 1.0a user context, BYOK) ── */
const xAdapter: PlatformAdapter = {
  id: 'twitter',
  envReady: () => true,
  publishLive: async (post, ctx) => {
    if (!ctx.credentials) return { ok: false, error: 'missing X credentials — reconnect the account' }
    const result = await postTweet(ctx.credentials, post.content)
    if (!result.ok) return { ok: false, error: result.error }
    return { ok: true, url: result.url }
  },
}

/* ── YouTube — Data API v3 (BYOK OAuth refresh). Text-only community posts
   are not writable via the public API; live publish requires a video asset. ── */
const youtubeAdapter: PlatformAdapter = {
  id: 'youtube',
  envReady: () => true,
  publishLive: async (_post, ctx) => {
    if (!ctx.youtubeCredentials) {
      return { ok: false, error: 'missing YouTube credentials — reconnect the account' }
    }
    // YouTube Data API has no third-party write endpoint for community posts /
    // text-only status. Video upload needs a binary asset from the library.
    return {
      ok: false,
      error: 'YouTube text-only publish is not supported by the public API. Attach a video asset, or use X for text posts.',
    }
  },
}

/* ── Instagram — Meta Graph: /media → /media_publish ── */
const instagramAdapter: PlatformAdapter = {
  id: 'instagram',
  envReady: () => !!process.env.META_APP_ID && !!process.env.META_APP_SECRET,
  publishLive: async (post, ctx) => {
    if (!ctx.accessToken) return { ok: false, error: 'missing access token' }
    // Instagram requires a media container — image URL comes from the asset
    // library. Caption-only posts are not supported by the Graph API.
    return { ok: false, error: 'Instagram publishing requires an image asset (media container). Attach an asset first.' }
  },
}

/* ── TikTok — Content Posting API: /v2/post/publish/video/init/ ── */
const tiktokAdapter: PlatformAdapter = {
  id: 'tiktok',
  envReady: () => !!process.env.TIKTOK_CLIENT_KEY && !!process.env.TIKTOK_CLIENT_SECRET,
  publishLive: async (post, ctx) => {
    if (!ctx.accessToken) return { ok: false, error: 'missing access token' }
    // TikTok Content Posting API requires a video file; text-only is unsupported.
    return { ok: false, error: 'TikTok publishing requires a video asset. Attach an asset first.' }
  },
}

const ADAPTERS: Record<string, PlatformAdapter> = {
  twitter: xAdapter,
  youtube: youtubeAdapter,
  instagram: instagramAdapter,
  tiktok: tiktokAdapter,
}

export function getAdapter(platformId: string): PlatformAdapter | undefined {
  return ADAPTERS[platformId]
}

/** Simulated publish — deterministic success with a demo URL */
export async function publishSimulated(post: Post, ctx: PublishContext): Promise<PublishReceipt> {
  await new Promise(r => setTimeout(r, 500))
  const slug = post.id.replace(/[^a-z0-9]/gi, '').slice(-8) || 'demo'
  const base: Record<string, string> = {
    twitter: `https://x.com/${(ctx.handle || 'demo').replace('@', '')}/status/${slug}`,
    youtube: `https://youtube.com/watch?v=${slug}`,
    instagram: `https://instagram.com/p/${slug}`,
    tiktok: `https://tiktok.com/@${(ctx.handle || 'demo').replace('@', '')}/video/${slug}`,
  }
  return { via: 'simulated', url: base[post.platform], at: new Date().toISOString() }
}
