'use client'
import { useParams } from 'next/navigation'
import AgentChatRoom from '@/components/app/chat/AgentChatRoom'

export default function ThreadPage() {
  const params = useParams()
  return (
    <AgentChatRoom
      projectId={params.projectId as string}
      threadId={params.threadId as string}
    />
  )
}
