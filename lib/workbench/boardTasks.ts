/** Project-level schedule + todo board (Filter Table), not canvas nodes. */

export type BoardTaskStatus = 'todo' | 'doing' | 'done'

export type BoardTask = {
  id: string
  projectId: string
  title: string
  /** ISO datetime-local style when scheduled */
  at?: string
  status: BoardTaskStatus
  /** Linked marketing / repurpose / note node */
  contentNodeId?: string
  source?: 'manual' | 'suggest' | 'migrate'
  createdAt: string
}

export function newBoardTaskId() {
  return `bt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}
