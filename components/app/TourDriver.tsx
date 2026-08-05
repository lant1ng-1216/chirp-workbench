'use client'
import { useMingStore } from '@/lib/store'
import TourOverlay from './TourOverlay'

export default function TourDriver() {
  const activeProjectId = useMingStore(s => s.activeProjectId)
  if (!activeProjectId) return null
  return <TourOverlay projectId={activeProjectId} />
}
