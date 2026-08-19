'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMingStore } from '@/lib/store'
import WorkbenchCanvas from '@/components/workbench/WorkbenchCanvas'

export default function WorkbenchPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const project = useMingStore(s => s.projects.find(p => p.id === projectId))
  const lang = useMingStore(s => s.lang)
  const zh = lang === 'zh'

  // Wait for zustand persist — otherwise empty canvas init can wipe saved nodes
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(useMingStore.persist.hasHydrated())
    return useMingStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  if (!hydrated) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000', color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
      }}>
        {zh ? '加载画布…' : 'Loading canvas…'}
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        background: '#000', color: '#e8eaef', fontFamily: "'DM Sans', sans-serif",
      }}>
        <div>{zh ? '找不到项目' : 'Project not found'}</div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}
        >{zh ? '返回项目' : 'Back to projects'}</button>
      </div>
    )
  }

  return <WorkbenchCanvas project={project} />
}
