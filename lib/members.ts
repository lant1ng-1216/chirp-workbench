import type { Member } from './store'

export const AVATAR_STYLES = [
  { id: 'micah', label: 'Micah' },
] as const

export const DEFAULT_AVATAR_STYLE = 'micah'

export function avatarUrl(seed: string, style: string = DEFAULT_AVATAR_STYLE): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

/** Members every workspace starts with: the owner and Pip.
 *  Sample teammates (Maya/Leo) are only included in demo mode. */
export function seedMembers(projectId: string, ownerName: string, zh: boolean, demo = false): Member[] {
  const now = new Date().toISOString()
  const base: Member[] = [
    {
      id: 'pip', projectId, name: 'Pip', role: 'agent',
      avatarSeed: 'pip-agent', avatarStyle: 'bottts-neutral',
      status: 'online',
      focus: zh ? '待命 · 随时可以开始工作' : 'Standing by',
      joinedAt: now,
    },
    {
      id: 'owner', projectId, name: ownerName || (zh ? '你' : 'You'), role: 'owner',
      avatarSeed: ownerName || 'owner', avatarStyle: DEFAULT_AVATAR_STYLE,
      status: 'online',
      focus: zh ? '正在查看总览' : 'Viewing overview',
      joinedAt: now,
    },
  ]
  if (!demo) return base
  return [
    ...base,
    {
      id: 'm-sample-1', projectId, name: 'Maya', role: 'editor',
      avatarSeed: 'maya-chen', avatarStyle: DEFAULT_AVATAR_STYLE,
      status: 'online',
      focus: zh ? '正在审核 Instagram 草稿' : 'Reviewing Instagram drafts',
      joinedAt: now,
    },
    {
      id: 'm-sample-2', projectId, name: 'Leo', role: 'editor',
      avatarSeed: 'leo-wang', avatarStyle: DEFAULT_AVATAR_STYLE,
      status: 'away',
      focus: zh ? '离开 · 刚才在整理素材库' : 'Away · was organizing the asset library',
      joinedAt: now,
    },
  ]
}
