'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import AgentChatRoom from '@/components/app/chat/AgentChatRoom'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const { projects, setActiveProject } = useMingStore()

  useEffect(() => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) {
      router.replace('/onboarding')
      return
    }
    setActiveProject(projectId)
  }, [projectId, projects, router, setActiveProject])

  const project = projects.find((p) => p.id === projectId)
  if (!project) return null

  const mainThread = project.threads[0]
  if (!mainThread) return null

  return <AgentChatRoom projectId={projectId} threadId={mainThread.id} />
}
