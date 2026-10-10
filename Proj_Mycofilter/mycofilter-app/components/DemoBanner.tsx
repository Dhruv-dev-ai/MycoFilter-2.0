'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react'

interface DemoBannerProps {
  isDemo: boolean
  lastUpdate?: string | null
  deviceId?: string
  onRefresh?: () => void
  isConnected?: boolean
}

export default function DemoBanner({ isDemo, lastUpdate, deviceId, onRefresh, isConnected }: DemoBannerProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const age = lastUpdate ? Math.floor((now.getTime() - new Date(lastUpdate).getTime()) / 1000) : null
  const staleSec = age !== null && age > 120

  if (isDemo) {
    return (
      <div
        role="alert"
        className="demo-banner"
        aria-live="polite"
        style={{
          background: 'linear-gradient(90deg,#7c3aed,#5b21b6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
        }}
      >
        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
        <span style={{ letterSpacing: '0.05em' }}>
          ⚠ SIMULATED DATA — NOT CONNECTED TO HARDWARE — For demonstration and development only
        </span>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div
        role="alert"
        className="demo-banner"
        style={{ background: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        <WifiOff size={14} />
        <span>Hardware telemetry disconnected — displaying last cached readings</span>
        {onRefresh && (
          <button onClick={onRefresh} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, padding: '1px 8px', cursor: 'pointer', color: 'white', fontSize: '0.75rem' }}>
            Reconnect
          </button>
        )}
      </div>
    )
  }

  if (staleSec) {
    return (
      <div
        role="alert"
        className="demo-banner"
        style={{ background: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        <AlertTriangle size={14} />
        <span>No telemetry received for {age}s — check device connectivity for {deviceId}</span>
      </div>
    )
  }

  return (
    <div style={{
      background: '#14532d', color: '#86efac',
      fontSize: '0.75rem', fontWeight: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '0.5rem', padding: '0.3rem 1rem',
    }}>
      <Wifi size={13} />
      <span>Live hardware telemetry · {deviceId} · last reading {age !== null ? `${age}s ago` : '—'}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          aria-label="Refresh"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86efac', display: 'flex' }}
        >
          <RefreshCw size={13} />
        </button>
      )}
    </div>
  )
}
