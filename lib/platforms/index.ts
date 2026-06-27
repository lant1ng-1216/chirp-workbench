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
  // All platforms are stubs for now
  // Each returns a consistent "接入中" message
  const platformNames: Record<PlatformId, string> = {
    xiaohongshu: '小红书',
    douyin: '抖音',
    weibo: '微博',
    wechat: '微信公众号',
    bilibili: 'B站',
    zhihu: '知乎',
    twitter: 'Twitter/X',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    youtube: 'YouTube',
  }

  return {
    status: 'stub',
    message: `${platformNames[platform]} 平台接口接入中，内容已复制到剪贴板，请手动发布。`,
    copiedContent: title ? `${title}\n\n${content}` : content,
  }
}
