'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { TelemetryEvent, Alert } from '@/lib/types'
import { generateSimulatedReadings, DEMO_DEVICE, DEMO_ALERTS } from '@/lib/demo-data'
import { DEMO_MODE } from '@/lib/supabase-client'

interface AppContextValue {
  isDemo: boolean
  deviceId: string
  deviceName: string
  latestReadings: Record<string, TelemetryEvent>
  alerts: Alert[]
  isConnected: boolean
  lastUpdateAt: string | null
  acknowledgeAlert: (id: string) => void
  refresh: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [latestReadings, setLatestReadings] = useState<Record<string, TelemetryEvent>>({})
  const [alerts, setAlerts] = useState<Alert[]>(DEMO_MODE ? DEMO_ALERTS : [])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdateAt, setLastUpdateAt] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const deviceId   = DEMO_DEVICE.id
  const deviceName = DEMO_DEVICE.name

  const applyReadings = useCallback((events: TelemetryEvent[]) => {
    setLatestReadings(prev => {
      const next = { ...prev }
      for (const ev of events) {
        next[ev.sensor_id] = ev
      }
      return next
    })
    setLastUpdateAt(new Date().toISOString())
    setIsConnected(true)
  }, [])

  // Demo simulation loop
  useEffect(() => {
    if (!DEMO_MODE) return

    const run = () => {
      const readings = generateSimulatedReadings(deviceId)
      applyReadings(readings)
    }

    run() // initial
    intervalRef.current = setInterval(run, 30000) // 30s interval

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [deviceId, applyReadings])

  // TODO: When Supabase is configured, replace the demo loop with
  // supabase.channel('telemetry').on('postgres_changes', ...) subscriptions.
  // See lib/supabase-client.ts and the backend ingestion route.

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, acknowledged_at: new Date().toISOString() } : a)
    )
  }, [])

  const refresh = useCallback(() => {
    if (DEMO_MODE) {
      const readings = generateSimulatedReadings(deviceId)
      applyReadings(readings)
    }
    // Hardware: trigger a manual fetch / re-subscribe
  }, [deviceId, applyReadings])

  return (
    <AppContext.Provider value={{
      isDemo: DEMO_MODE,
      deviceId,
      deviceName,
      latestReadings,
      alerts,
      isConnected,
      lastUpdateAt,
      acknowledgeAlert,
      refresh,
    }}>
      {children}
    </AppContext.Provider>
  )
}
