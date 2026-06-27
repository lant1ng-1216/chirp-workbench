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

interface MingStore {
  projects: Project[]
  activeProjectId: string | null
  activeThreadId: string | null
  todos: TodoItem[]
  extractedCards: ExtractedCard[]

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

  // Lab actions
  addKnowledgeDoc: (projectId: string, doc: import('./brand').KnowledgeDoc) => void

  // Todo actions
  addTodo: (item: TodoItem) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void

  // Extracted cards actions
  addExtractedCards: (cards: ExtractedCard[]) => void
  clearExtractedCards: (projectId: string, threadId: string) => void
}

export const useMingStore = create<MingStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      activeThreadId: null,
      todos: [],
      extractedCards: [],

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
              ? { ...p, brand: { ...p.brand, knowledgeDocs: [...p.brand.knowledgeDocs, doc] } }
              : p
          ),
        })),
    }),
    {
      name: 'ming-store',
    }
  )
)
