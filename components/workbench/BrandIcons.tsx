'use client'
import type { CSSProperties } from 'react'

export type PlatformId = 'youtube' | 'instagram' | 'tiktok' | 'twitter'

export const PLATFORM_ORDER: PlatformId[] = ['youtube', 'instagram', 'tiktok', 'twitter']

const SRC: Record<PlatformId, string> = {
  youtube: '/platforms/youtube.svg',
  instagram: '/platforms/instagram.svg',
  tiktok: '/platforms/tiktok.svg',
  twitter: '/platforms/x.svg',
}

const LABEL: Record<PlatformId, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  twitter: 'X',
}

export function PlatformIcon({
  platform,
  size = 16,
  style,
}: {
  platform: PlatformId
  size?: number
  style?: CSSProperties
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[platform]}
      alt={LABEL[platform]}
      title={LABEL[platform]}
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block', ...style }}
    />
  )
}

export function platformLabel(platform: PlatformId) {
  return LABEL[platform]
}

/** Official Minds mark from hellominds.ai (hosted locally) */
export function MindsLogo({ size = 22, style }: { size?: number; style?: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/agents/minds.svg"
      alt="Minds"
      width={size}
      height={size}
      style={{ objectFit: 'contain', borderRadius: 6, display: 'block', ...style }}
    />
  )
}
