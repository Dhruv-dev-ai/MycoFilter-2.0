'use client'
import { AppProvider, useApp } from '@/components/AppContext'
import Sidebar from '@/components/Sidebar'
import DemoBanner from '@/components/DemoBanner'
import MyceliumBackground from '@/components/MyceliumBackground'
import CustomCursor from '@/components/CustomCursor'

function Shell({ children }: { children: React.ReactNode }) {
  const { isDemo, deviceName, deviceId, lastUpdateAt, isConnected, refresh } = useApp()
  return (
    <div style={{ cursor: 'none' }}>
      <CustomCursor />
      <MyceliumBackground intensity={0.7} />
      {!isDemo && <DemoBanner isDemo={isDemo} deviceId={deviceId} lastUpdate={lastUpdateAt} isConnected={isConnected} onRefresh={refresh} />}
      <div className="app-shell">
        <Sidebar deviceName={deviceName} deviceId={deviceId} isDemo={isDemo} />
        <main className="main-content">
          <div className="page-content" style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppProvider><Shell>{children}</Shell></AppProvider>
}
