import type { PlatformId } from '../brand'

export interface PublishResult {
  status: 'success' | 'stub' | 'error'
  platformPostId?: string
  message: string
  copiedContent?: string
}

export async function publishToPlatform(
  platform: PlatformId,
  content: string,
  title?: string
): Promise<PublishResult> {
  const platformNames: Record<PlatformId, string> = {
    youtube:   'YouTube',
    instagram: 'Instagram',
    tiktok:    'TikTok',
    twitter:   'X (Twitter)',
    telegram:  'Telegram',
  }

  const name = platformNames[platform] ?? platform
  return {
    status: 'stub',
    message: `${name} publishing API is not connected yet. Content copied — paste it manually.`,
    copiedContent: title ? `${title}\n\n${content}` : content,
  }
}
