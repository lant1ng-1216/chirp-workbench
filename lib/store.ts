'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Thread, Message, Post } from './brand'

export interface ExtractedCard {
  id: string
  projectId: string
  threadId: string
  platform: string
  content: string
  createdAt: string
}

export interface TodoItem {
  id: string
  projectId: string
  text: string
  done: boolean
  createdAt: string
}

export interface RepurposedContent {
  id: string
  projectId: string
  input: string
  youtube: string
  instagram: string
  tiktok: string
  twitter: string
  createdAt: string
}

export interface CommunityState {
  telegramBotToken: string
  telegramGroupId: string
  connected: boolean
  lastDigest: string | null
  digestUpdatedAt: string | null
}

export interface Asset {
  id: string
  projectId: string
  name: string
  type: 'image' | 'video' | 'text'
  previewUrl: string
  tags: string[]
  pipAnalysis: string
  platforms: string[]
  createdAt: string
  analyzing: boolean
  /** Canvas position (React Flow node coords) */
  x?: number
  y?: number
  /** User-provided description used for Pip analysis */
  description?: string
}

export interface PipMessage {
  id: string
  role: 'user' | 'pip'
  text: string
  ts: number
}

export interface AssetEdge {
  id: string
  source: string
  target: string
}

export interface PipInsight {
  type: 'growth' | 'timing' | 'content' | 'warning'
  text: string
  action?: string
}

export interface Comment {
  id: string
  projectId: string
  platform: string
  author: string
  text: string
  sentiment: 'positive' | 'negative' | 'question' | 'spam' | 'pending'
  pipReply: string
  status: 'pending' | 'replied' | 'ignored'
  createdAt: string
}

interface MingStore {
  projects: Project[]
  activeProjectId: string | null
  activeThreadId: string | null
  todos: TodoItem[]
  extractedCards: ExtractedCard[]
  repurposedContent: RepurposedContent[]
  communityState: Record<string, CommunityState>
  touredProjects: string[]
  lang: 'en' | 'zh'
  assets: Asset[]
  comments: Comment[]
  /** Talk-to-Pip chat history, keyed by projectId */
  pipMessages: Record<string, PipMessage[]>
  /** Activated platform ids, keyed by projectId */
  activePlatforms: Record<string, string[]>
  /** Canvas edges between asset nodes, keyed by projectId */
  assetEdges: Record<string, AssetEdge[]>
  /** Latest Pip growth insights, keyed by projectId */
  insights: Record<string, PipInsight[]>
  /** Platforms with Pip auto-scheduling enabled, keyed by projectId */
  autoPlatforms: Record<string, string[]>
  /** Platform account handles, keyed by projectId then platformId */
  platformHandles: Record<string, Record<string, string>>

  // Project actions
  addProject: (project: Project) => void
  removeProject: (id: string) => void
  setActiveProject: (id: string) => void
  getActiveProject: () => Project | null

  // Thread actions
  setActiveThread: (id: string | null) => void
  addThread: (projectId: string, thread: Thread) => void
  removeThread: (projectId: string, threadId: string) => void
  getActiveThread: () => Thread | null

  // Message actions
  addMessage: (projectId: string, threadId: string, message: Message) => void
  updateLastMessage: (projectId: string, threadId: string, content: string) => void

  // Post actions
  addPost: (projectId: string, post: Post) => void
  updatePost: (projectId: string, postId: string, updates: Partial<Post>) => void

  // Knowledge doc actions
  addKnowledgeDoc: (projectId: string, doc: import('./brand').KnowledgeDoc) => void

  // Todo actions
  addTodo: (item: TodoItem) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void

  // Extracted cards actions
  addExtractedCards: (cards: ExtractedCard[]) => void
  clearExtractedCards: (projectId: string, threadId: string) => void

  // Repurposed content actions
  addRepurposedContent: (content: RepurposedContent) => void

  // Community actions
  setCommunityState: (projectId: string, state: Partial<CommunityState>) => void

  // Tour
  completeTour: (projectId: string) => void

  // Language
  setLang: (lang: 'en' | 'zh') => void

  // Asset actions
  addAsset: (asset: Asset) => void
  updateAsset: (id: string, updates: Partial<Asset>) => void
  removeAsset: (id: string) => void

  // Comment actions
  addComment: (comment: Comment) => void
  updateComment: (id: string, updates: Partial<Comment>) => void
  addMockComments: (projectId: string) => void

  // Pip chat actions
  addPipMessage: (projectId: string, msg: PipMessage) => void
  clearPipMessages: (projectId: string) => void

  // Platform activation actions
  togglePlatform: (projectId: string, platformId: string) => void
  setPlatformHandle: (projectId: string, platformId: string, handle: string) => void
  toggleAutoPlatform: (projectId: string, platformId: string) => void
  setAssetEdges: (projectId: string, edges: AssetEdge[]) => void
  setInsights: (projectId: string, insights: PipInsight[]) => void
}

export const useMingStore = create<MingStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      activeThreadId: null,
      todos: [],
      extractedCards: [],
      repurposedContent: [],
      communityState: {},
      touredProjects: [],
      lang: 'en',
      assets: [],
      comments: [],
      pipMessages: {},
      activePlatforms: {},
      autoPlatforms: {},
      assetEdges: {},
      insights: {},
      platformHandles: {},

      addProject: (project) =>
        set((s) => ({
          projects: [...s.projects, project],
          activeProjectId: project.id,
        })),

      removeProject: (id) =>
        set((s) => {
          const remaining = s.projects.filter((p) => p.id !== id)
          return {
            projects: remaining,
            activeProjectId: s.activeProjectId === id ? (remaining[0]?.id ?? null) : s.activeProjectId,
            activeThreadId: s.activeProjectId === id ? null : s.activeThreadId,
          }
        }),

      setActiveProject: (id) => set({ activeProjectId: id, activeThreadId: null }),

      getActiveProject: () => {
        const { projects, activeProjectId } = get()
        return projects.find((p) => p.id === activeProjectId) ?? null
      },

      setActiveThread: (id) => set({ activeThreadId: id }),

      addThread: (projectId, thread) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, threads: [...p.threads, thread] } : p
          ),
          activeThreadId: thread.id,
        })),

      removeThread: (projectId, threadId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, threads: p.threads.filter((t) => t.id !== threadId) }
              : p
          ),
          activeThreadId: s.activeThreadId === threadId ? null : s.activeThreadId,
        })),

      getActiveThread: () => {
        const { projects, activeProjectId, activeThreadId } = get()
        if (!activeProjectId || !activeThreadId) return null
        const project = projects.find((p) => p.id === activeProjectId)
        return project?.threads.find((t) => t.id === activeThreadId) ?? null
      },

      addMessage: (projectId, threadId, message) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  threads: p.threads.map((t) =>
                    t.id === threadId
                      ? { ...t, messages: [...t.messages, message], updatedAt: new Date().toISOString() }
                      : t
                  ),
                }
              : p
          ),
        })),

      updateLastMessage: (projectId, threadId, content) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  threads: p.threads.map((t) => {
                    if (t.id !== threadId) return t
                    const msgs = [...t.messages]
                    if (msgs.length === 0) return t
                    msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
                    return { ...t, messages: msgs }
                  }),
                }
              : p
          ),
        })),

      addPost: (projectId, post) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, posts: [...p.posts, post] } : p
          ),
        })),

      updatePost: (projectId, postId, updates) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, posts: p.posts.map((post) => (post.id === postId ? { ...post, ...updates } : post)) }
              : p
          ),
        })),

      addTodo: (item) => set(s => ({ todos: [...s.todos, item] })),
      toggleTodo: (id) => set(s => ({ todos: s.todos.map(t => t.id === id ? { ...t, done: !t.done } : t) })),
      removeTodo: (id) => set(s => ({ todos: s.todos.filter(t => t.id !== id) })),

      addExtractedCards: (cards) => set(s => ({ extractedCards: [...s.extractedCards, ...cards] })),
      clearExtractedCards: (projectId, threadId) => set(s => ({
        extractedCards: s.extractedCards.filter(c => !(c.projectId === projectId && c.threadId === threadId))
      })),

      addKnowledgeDoc: (projectId, doc) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, brand: { ...p.brand, knowledgeDocs: [...(p.brand.knowledgeDocs ?? []), doc] } }
              : p
          ),
        })),

      addRepurposedContent: (content) =>
        set(s => ({ repurposedContent: [content, ...s.repurposedContent].slice(0, 50) })),

      setCommunityState: (projectId, state) =>
        set(s => ({
          communityState: {
            ...s.communityState,
            [projectId]: { ...s.communityState[projectId], ...state },
          }
        })),

      completeTour: (projectId) =>
        set(s => ({ touredProjects: s.touredProjects.includes(projectId) ? s.touredProjects : [...s.touredProjects, projectId] })),

      setLang: (lang) => set({ lang }),

      addAsset: (asset) => set(s => ({ assets: [asset, ...s.assets] })),
      updateAsset: (id, updates) => set(s => ({ assets: s.assets.map(a => a.id === id ? { ...a, ...updates } : a) })),
      removeAsset: (id) => set(s => ({ assets: s.assets.filter(a => a.id !== id) })),

      addComment: (comment) => set(s => ({ comments: [comment, ...s.comments] })),
      updateComment: (id, updates) => set(s => ({ comments: s.comments.map(c => c.id === id ? { ...c, ...updates } : c) })),
      addMockComments: (projectId) => set(s => {
        const mock: Comment[] = [
          { id: `c-${Date.now()}-1`, projectId, platform: 'youtube', author: 'TechViewer88', text: 'This video changed my entire workflow! Can you do a follow-up on advanced settings?', sentiment: 'positive', pipReply: 'Thank you so much! A follow-up on advanced settings is actually in the works — stay tuned! 🙌', status: 'pending', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: `c-${Date.now()}-2`, projectId, platform: 'instagram', author: 'creative_luna', text: 'Love the aesthetic but the audio quality could be better 🙏', sentiment: 'negative', pipReply: 'Thanks for the honest feedback, Luna! We\'re upgrading our audio setup for the next shoot. Appreciate you letting us know!', status: 'pending', createdAt: new Date(Date.now() - 7200000).toISOString() },
          { id: `c-${Date.now()}-3`, projectId, platform: 'tiktok', author: 'user_k9x2', text: 'BUY FOLLOWERS CHEAP DM ME', sentiment: 'spam', pipReply: '', status: 'pending', createdAt: new Date(Date.now() - 1800000).toISOString() },
          { id: `c-${Date.now()}-4`, projectId, platform: 'twitter', author: 'designmind_', text: 'What software do you use for the animations in your videos?', sentiment: 'question', pipReply: 'Great question! We use After Effects for complex animations and CapCut for quick mobile edits. Happy to do a full tutorial if there\'s interest!', status: 'pending', createdAt: new Date(Date.now() - 5400000).toISOString() },
          { id: `c-${Date.now()}-5`, projectId, platform: 'youtube', author: 'maria_creates', text: 'Been following you for 2 years and every video gets better. Keep it up!!', sentiment: 'positive', pipReply: 'Two years — you\'re basically family at this point 😄 Thank you so much for the continued support, Maria!', status: 'pending', createdAt: new Date(Date.now() - 10800000).toISOString() },
          { id: `c-${Date.now()}-6`, projectId, platform: 'instagram', author: 'skeptic_404', text: 'This is just recycled content from your last post tbh', sentiment: 'negative', pipReply: 'Fair point — we explored a similar theme but dug deeper this time. Would love to hear what topics you\'d like us to cover fresh!', status: 'pending', createdAt: new Date(Date.now() - 14400000).toISOString() },
        ]
        const existing = s.comments.filter(c => c.projectId === projectId)
        if (existing.length > 0) return {}
        return { comments: [...mock, ...s.comments] }
      }),

      addPipMessage: (projectId, msg) =>
        set(s => ({
          pipMessages: {
            ...s.pipMessages,
            [projectId]: [...(s.pipMessages[projectId] ?? []), msg].slice(-200),
          },
        })),
      clearPipMessages: (projectId) =>
        set(s => ({ pipMessages: { ...s.pipMessages, [projectId]: [] } })),

      togglePlatform: (projectId, platformId) =>
        set(s => {
          const current = s.activePlatforms[projectId] ?? []
          const next = current.includes(platformId)
            ? current.filter(id => id !== platformId)
            : [...current, platformId]
          return { activePlatforms: { ...s.activePlatforms, [projectId]: next } }
        }),
      setPlatformHandle: (projectId, platformId, handle) =>
        set(s => ({
          platformHandles: {
            ...s.platformHandles,
            [projectId]: { ...(s.platformHandles[projectId] ?? {}), [platformId]: handle },
          },
        })),
      toggleAutoPlatform: (projectId, platformId) =>
        set(s => {
          const current = s.autoPlatforms[projectId] ?? []
          const next = current.includes(platformId)
            ? current.filter(id => id !== platformId)
            : [...current, platformId]
          return { autoPlatforms: { ...s.autoPlatforms, [projectId]: next } }
        }),
      setAssetEdges: (projectId, edges) =>
        set(s => ({ assetEdges: { ...s.assetEdges, [projectId]: edges } })),
      setInsights: (projectId, insights) =>
        set(s => ({ insights: { ...s.insights, [projectId]: insights } })),
    }),
    {
      name: 'chirp-store',
    }
  )
)
