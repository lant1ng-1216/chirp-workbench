import LeftSidebar from '@/components/app/layout/LeftSidebar'
import RightPanel from '@/components/app/layout/RightPanel'
import TourDriver from '@/components/app/TourDriver'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f5f7' }}>
      <LeftSidebar />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <RightPanel />
      <TourDriver />
    </div>
  )
}
