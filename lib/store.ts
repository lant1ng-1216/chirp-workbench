'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Thread, Message, Post, PlatformAccount } from './brand'
import type { CanvasGraph, KnowledgeEntry } from './canvas'
import { emptyGraph } from './canvas'
import type { BoardTask } from './workbench/boardTasks'
import type { WorkbenchTheme } from './workbench/theme'

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
  /** Member id this task is assigned to (undefined = unassigned) */
  assignee?: string
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

export type ActivityType =
  | 'repurpose' | 'analyze' | 'draft' | 'schedule' | 'publish'
  | 'digest' | 'chat' | 'insight' | 'connect' | 'comment'

export interface ActivityEvent {
  id: string
  projectId: string
  ts: number
  type: ActivityType
  /** Short headline, written in the UI language active at creation time */
  title: string
  /** Optional detail line */
  detail?: string
  platform?: string
  /** 'sample' marks demo events shown before Pip is connected */
  source?: 'real' | 'sample'
  /** Member id who performed the action ('pip' for the agent, undefined = you) */
  actor?: string
}

/** A live Pip job, e.g. a workshop generation run — drives cross-page "working" animations */
export interface PipJob {
  id: string
  projectId: string
  kind: 'repurpose' | 'analyze'
  /** Platform ids this job is producing for */
  platforms: string[]
  /** Free-form stage label, e.g. 'sense' | 'draft' | 'format' */
  stage: number
  startedAt: number
}

/** A teammate in the workspace (or Pip itself) */
export interface Member {
  id: string
  projectId: string
  name: string
  role: 'owner' | 'editor' | 'agent'
  /** DiceBear seed + style */
  avatarSeed: string
  avatarStyle: string
  status: 'online' | 'away'
  /** What they're currently doing, shown under their name */
  focus?: string
  joinedAt: string
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
  /** Platform-native object id (e.g. X tweet id) — needed to send real replies */
  externalId?: string
  /** Canonical URL of the original comment/tweet */
  externalUrl?: string
}

interface MingStore {
  projects: Project[]
  activeProjectId: string | null
  activeThreadId: string | null
  todos: TodoItem[]
  extractedCards: ExtractedCard[]
  repurposedContent: RepurposedContent[]
  communityState: Record<string, CommunityState>
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
  /** Connected publishing accounts, keyed by projectId then platformId */
  platformAccounts: Record<string, Record<string, PlatformAccount>>
  /** Pip activity feed, keyed by projectId (newest first, capped at 100) */
  activityLog: Record<string, ActivityEvent[]>
  /** Currently running Pip jobs (ephemeral — not persisted) */
  jobs: PipJob[]
  /** Workspace members, keyed by projectId */
  members: Record<string, Member[]>
  /** Active invite codes, keyed by projectId */
  inviteCodes: Record<string, string>
  /** Ephemeral: member filter applied to activity feeds (not persisted) */
  activityActorFilter: string | null
  setActivityActorFilter: (memberId: string | null) => void
  /** Demo mode: when ON, sample content (mock comments, sample activity, sample teammates,
   *  GitHub sample card) is shown for presentation. OFF by default — real usage shows real data only. */
  demoMode: boolean
  setDemoMode: (on: boolean) => void

  /** Workbench canvas graphs, keyed by projectId */
  canvases: Record<string, CanvasGraph>
  setCanvas: (projectId: string, graph: CanvasGraph) => void
  patchCanvas: (projectId: string, patch: Partial<CanvasGraph>) => void
  ensureCanvas: (projectId: string) => CanvasGraph

  /** Project knowledge library (sidebar + pin-to-canvas) */
  knowledgeEntries: Record<string, KnowledgeEntry[]>
  addKnowledgeEntry: (entry: KnowledgeEntry) => void
  updateKnowledgeEntry: (projectId: string, id: string, updates: Partial<KnowledgeEntry>) => void
  removeKnowledgeEntry: (projectId: string, id: string) => void

  /** Schedule + todo board (Filter Table), keyed by projectId */
  boardTasks: Record<string, BoardTask[]>
  addBoardTask: (task: BoardTask) => void
  updateBoardTask: (projectId: string, id: string, updates: Partial<BoardTask>) => void
  removeBoardTask: (projectId: string, id: string) => void

  /** Workbench chrome theme (canvas shell only) */
  workbenchTheme: WorkbenchTheme
  setWorkbenchTheme: (theme: WorkbenchTheme) => void

  // Project actions
  addProject: (project: Project) => void
  removeProject: (id: string) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  setActiveProject: (id: string) => void
  getActiveProject: () => Project | null
  /** Create local canvas project only — no Agent/Minds binding */
  createWorkbenchProject: (name: string) => Promise<{ projectId: string; error?: string }>
  /** Lazy-init Minds conversation on first node Run / chat */
  ensureMindsForProject: (projectId: string) => Promise<{ ok: true; alias: string } | { ok: false; error: string }>

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
  connectPlatform: (projectId: string, account: PlatformAccount) => void
  disconnectPlatform: (projectId: string, platformId: string) => void
  toggleAutoPlatform: (projectId: string, platformId: string) => void
  setAssetEdges: (projectId: string, edges: AssetEdge[]) => void
  setInsights: (projectId: string, insights: PipInsight[]) => void

  // Activity feed
  logActivity: (projectId: string, event: Omit<ActivityEvent, 'id' | 'projectId' | 'ts'>) => void

  // Live jobs (not persisted)
  startJob: (job: Omit<PipJob, 'id' | 'startedAt' | 'stage'>) => string
  setJobStage: (id: string, stage: number) => void
  finishJob: (id: string) => void

  // Workspace members & invites
  addMember: (member: Member) => void
  removeMember: (projectId: string, memberId: string) => void
  setMemberStatus: (projectId: string, memberId: string, status: Member['status'], focus?: string) => void
  ensureInviteCode: (projectId: string) => string
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
      lang: 'en',
      assets: [],
      comments: [],
      pipMessages: {},
      activePlatforms: {},
      autoPlatforms: {},
      assetEdges: {},
      insights: {},
      platformHandles: {},
      platformAccounts: {},
      activityLog: {},
      jobs: [],
      members: {},
      inviteCodes: {},
      activityActorFilter: null,
      setActivityActorFilter: (memberId) => set({ activityActorFilter: memberId }),
      demoMode: false,
      setDemoMode: (on) => set({ demoMode: on }),

      canvases: {},
      knowledgeEntries: {},
      boardTasks: {},
      workbenchTheme: 'dark',
      setWorkbenchTheme: (theme) => set({ workbenchTheme: theme }),

      setCanvas: (projectId, graph) =>
        set(s => ({
          canvases: {
            ...s.canvases,
            [projectId]: { ...graph, updatedAt: new Date().toISOString() },
          },
        })),
      patchCanvas: (projectId, patch) =>
        set(s => {
          const prev = s.canvases[projectId] ?? emptyGraph()
          return {
            canvases: {
              ...s.canvases,
              [projectId]: { ...prev, ...patch, updatedAt: new Date().toISOString() },
            },
          }
        }),
      ensureCanvas: (projectId) => {
        const existing = get().canvases[projectId]
        if (existing) return existing
        const g = emptyGraph()
        set(s => ({ canvases: { ...s.canvases, [projectId]: g } }))
        return g
      },

      addKnowledgeEntry: (entry) =>
        set(s => ({
          knowledgeEntries: {
            ...s.knowledgeEntries,
            [entry.projectId]: [...(s.knowledgeEntries[entry.projectId] ?? []), entry],
          },
        })),
      updateKnowledgeEntry: (projectId, id, updates) =>
        set(s => ({
          knowledgeEntries: {
            ...s.knowledgeEntries,
            [projectId]: (s.knowledgeEntries[projectId] ?? []).map(e =>
              e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
            ),
          },
        })),
      removeKnowledgeEntry: (projectId, id) =>
        set(s => ({
          knowledgeEntries: {
            ...s.knowledgeEntries,
            [projectId]: (s.knowledgeEntries[projectId] ?? []).filter(e => e.id !== id),
          },
        })),

      addBoardTask: (task) =>
        set(s => ({
          boardTasks: {
            ...s.boardTasks,
            [task.projectId]: [...(s.boardTasks[task.projectId] ?? []), task],
          },
        })),
      updateBoardTask: (projectId, id, updates) =>
        set(s => ({
          boardTasks: {
            ...s.boardTasks,
            [projectId]: (s.boardTasks[projectId] ?? []).map(t =>
              t.id === id ? { ...t, ...updates } : t
            ),
          },
        })),
      removeBoardTask: (projectId, id) =>
        set(s => ({
          boardTasks: {
            ...s.boardTasks,
            [projectId]: (s.boardTasks[projectId] ?? []).filter(t => t.id !== id),
          },
        })),

      addProject: (project) =>
        set((s) => ({
          projects: [...s.projects, project],
          activeProjectId: project.id,
          canvases: { ...s.canvases, [project.id]: s.canvases[project.id] ?? emptyGraph() },
          knowledgeEntries: { ...s.knowledgeEntries, [project.id]: s.knowledgeEntries[project.id] ?? [] },
          boardTasks: { ...s.boardTasks, [project.id]: s.boardTasks[project.id] ?? [] },
        })),

      removeProject: (id) =>
        set((s) => {
          const remaining = s.projects.filter((p) => p.id !== id)
          const { [id]: _c, ...canvases } = s.canvases
          const { [id]: _k, ...knowledgeEntries } = s.knowledgeEntries
          const { [id]: _b, ...boardTasks } = s.boardTasks
          return {
            projects: remaining,
            activeProjectId: s.activeProjectId === id ? (remaining[0]?.id ?? null) : s.activeProjectId,
            activeThreadId: s.activeProjectId === id ? null : s.activeThreadId,
            canvases,
            knowledgeEntries,
            boardTasks,
          }
        }),

      updateProject: (id, updates) =>
        set(s => ({
          projects: s.projects.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      setActiveProject: (id) => set({ activeProjectId: id, activeThreadId: null }),

      getActiveProject: () => {
        const { projects, activeProjectId } = get()
        return projects.find((p) => p.id === activeProjectId) ?? null
      },

      createWorkbenchProject: async (name) => {
        const ts = Date.now()
        const projectId = `proj-${ts}`
        const display = name.trim() || 'Untitled'
        const project: Project = {
          id: projectId,
          name: display,
          brand: {
            id: `brand-${ts}`,
            name: display,
            description: '',
            audience: '',
            tone: 'friendly',
            contentStyle: '',
            topics: [],
            platforms: [],
            knowledgeDocs: [],
            mindsConversationAlias: '',
            mindId: '',
            createdAt: new Date().toISOString(),
          },
          threads: [],
          posts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        get().addProject(project)
        get().ensureCanvas(projectId)
        return { projectId }
      },

      ensureMindsForProject: async (projectId) => {
        const project = get().projects.find(p => p.id === projectId)
        if (!project) return { ok: false, error: 'Project not found' }
        const existing = project.brand.mindsConversationAlias?.trim()
        if (existing) return { ok: true, alias: existing }

        const slug = (project.name || project.brand.name || 'project')
          .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || 'project'
        const alias = `chirp-${slug}-${Date.now()}`
        try {
          const res = await fetch('/api/minds/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alias }),
          })
          const data = await res.json()
          if (!res.ok || !data.alias) {
            return { ok: false, error: data.error ?? `HTTP ${res.status}` }
          }
          set(s => ({
            projects: s.projects.map(p =>
              p.id === projectId
                ? {
                    ...p,
                    updatedAt: new Date().toISOString(),
                    brand: { ...p.brand, mindsConversationAlias: data.alias as string },
                  }
                : p
            ),
          }))
          return { ok: true, alias: data.alias as string }
        } catch (e) {
          return { ok: false, error: String(e) }
        }
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
        set((s) => {
          const before = s.projects.find(p => p.id === projectId)?.posts.find(p => p.id === postId)
          const next: Partial<MingStore> = {
            projects: s.projects.map((p) =>
              p.id === projectId
                ? { ...p, posts: p.posts.map((post) => (post.id === postId ? { ...post, ...updates } : post)) }
                : p
            ),
          }
          // Auto-log schedule / publish transitions into the activity feed
          if (before && updates.status && updates.status !== before.status) {
            const type = updates.status === 'scheduled' ? 'schedule' : updates.status === 'published' ? 'publish' : null
            if (type) {
              const evt: ActivityEvent = {
                id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                projectId, ts: Date.now(), type, source: 'real',
                title: type === 'schedule' ? `Scheduled "${before.title}"` : `Published "${before.title}"`,
                platform: before.platform,
              }
              next.activityLog = { ...s.activityLog, [projectId]: [evt, ...(s.activityLog[projectId] ?? [])].slice(0, 100) }
            }
          }
          return next
        }),

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
      connectPlatform: (projectId, account) =>
        set(s => ({
          platformAccounts: {
            ...s.platformAccounts,
            [projectId]: { ...(s.platformAccounts[projectId] ?? {}), [account.platformId]: account },
          },
          platformHandles: {
            ...s.platformHandles,
            [projectId]: { ...(s.platformHandles[projectId] ?? {}), [account.platformId]: account.handle },
          },
        })),
      disconnectPlatform: (projectId, platformId) =>
        set(s => {
          const acc = { ...(s.platformAccounts[projectId] ?? {}) }
          delete acc[platformId]
          return { platformAccounts: { ...s.platformAccounts, [projectId]: acc } }
        }),
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

      logActivity: (projectId, event) =>
        set(s => ({
          activityLog: {
            ...s.activityLog,
            [projectId]: [
              { ...event, id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, projectId, ts: Date.now(), source: event.source ?? 'real' },
              ...(s.activityLog[projectId] ?? []),
            ].slice(0, 100),
          },
        })),

      startJob: (job) => {
        const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        set(s => ({ jobs: [...s.jobs, { ...job, id, stage: 0, startedAt: Date.now() }] }))
        return id
      },
      setJobStage: (id, stage) =>
        set(s => ({ jobs: s.jobs.map(j => (j.id === id ? { ...j, stage } : j)) })),
      finishJob: (id) =>
        set(s => ({ jobs: s.jobs.filter(j => j.id !== id) })),

      addMember: (member) =>
        set(s => {
          const list = s.members[member.projectId] ?? []
          if (list.some(m => m.id === member.id)) return s
          return { members: { ...s.members, [member.projectId]: [...list, member] } }
        }),
      removeMember: (projectId, memberId) =>
        set(s => ({
          members: {
            ...s.members,
            [projectId]: (s.members[projectId] ?? []).filter(m => m.id !== memberId),
          },
        })),
      setMemberStatus: (projectId, memberId, status, focus) =>
        set(s => ({
          members: {
            ...s.members,
            [projectId]: (s.members[projectId] ?? []).map(m =>
              m.id === memberId ? { ...m, status, ...(focus !== undefined ? { focus } : {}) } : m
            ),
          },
        })),
      ensureInviteCode: (projectId) => {
        const existing = get().inviteCodes[projectId]
        if (existing) return existing
        const code = Math.random().toString(36).slice(2, 8).toUpperCase()
        set(s => ({ inviteCodes: { ...s.inviteCodes, [projectId]: code } }))
        return code
      },
    }),
    {
      name: 'chirp-store',
      partialize: (s) => {
        const { jobs, activityActorFilter, ...rest } = s
        return rest
      },
    }
  )
)
