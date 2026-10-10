'use client'

import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react'
import type { QualityFlag, SourceMode } from '@/lib/types'

interface SensorCardProps {
  tag: string
  label: string
  value: number | null
  unit: string
  station: 'influent' | 'effluent'
  quality: QualityFlag
  source: SourceMode
  trend?: 'up' | 'down' | 'stable' | null
  trendValue?: number | null
  timestamp?: string | null
  commissioningStatus?: string
  onClick?: () => void
  rangeMin?: number
  rangeMax?: number
  rangeWarnMin?: number
  rangeWarnMax?: number
  footnote?: string
}

const STATION_COLOURS = {
  influent: { bg: '#eff6ff', accent: '#3b82f6', label: '#1d4ed8' },
  effluent: { bg: '#f0fdf4', accent: '#22c55e', label: '#15803d' },
}

const QUALITY_COLOURS: Record<QualityFlag, string> = {
  valid:           '#16a34a',
  uncalibrated:    '#d97706',
  stale:           '#f97316',
  out_of_range:    '#dc2626',
  sensor_error:    '#dc2626',
  duplicate:       '#9333ea',
  out_of_order:    '#9333ea',
  missing:         '#64748b',
  estimated:       '#0891b2',
  not_configured:  '#64748b',
}

const QUALITY_LABEL: Record<QualityFlag, string> = {
  valid:           'Valid',
  uncalibrated:    'Uncalibrated',
  stale:           'Stale',
  out_of_range:    'Out of Range',
  sensor_error:    'Sensor Error',
  duplicate:       'Duplicate',
  out_of_order:    'Out of Order',
  missing:         'Missing',
  estimated:       'Estimated',
  not_configured:  'Not Configured',
}

function formatValue(v: number | null, unit: string): string {
  if (v === null) return '—'
  if (unit === 'pH') return v.toFixed(2)
  if (unit === 'NTU') return v.toFixed(1)
  if (unit === 'µS/cm') return v.toFixed(0)
  if (unit === '°C') return v.toFixed(1)
  return v.toFixed(2)
}

function rangeFraction(v: number | null, min: number, max: number): number {
  if (v === null) return 0
  return Math.max(0, Math.min(1, (v - min) / (max - min)))
}

export default function SensorCard({
  tag, label, value, unit, station, quality, source,
  trend, timestamp, commissioningStatus,
  onClick, rangeMin, rangeMax, rangeWarnMin, rangeWarnMax, footnote,
}: SensorCardProps) {
  const col = STATION_COLOURS[station]
  const qc  = QUALITY_COLOURS[quality]
  const isUnconfigured = quality === 'not_configured' || commissioningStatus === 'optional_unconfigured'
  const isEstimate = source === 'simulated' || quality === 'estimated' || quality === 'uncalibrated'

  const showBar = rangeMin !== undefined && rangeMax !== undefined && value !== null
  const frac = showBar ? rangeFraction(value, rangeMin!, rangeMax!) : 0
  const warnFracMin = (showBar && rangeWarnMin !== undefined) ? rangeFraction(rangeWarnMin!, rangeMin!, rangeMax!) : 0
  const warnFracMax = (showBar && rangeWarnMax !== undefined) ? rangeFraction(rangeWarnMax!, rangeMin!, rangeMax!) : 1

  return (
    <div
      className="card sensor-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      aria-label={`${label}: ${formatValue(value, unit)} ${unit}`}
      style={{
        padding: '1.25rem',
        cursor: onClick ? 'pointer' : 'default',
        borderTop: `3px solid ${col.accent}`,
        minWidth: 160,
      }}
    >
      {/* Station badge + tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase',
          background: col.bg, color: col.label,
          padding: '2px 8px', borderRadius: '999px',
          border: `1px solid ${col.accent}22`,
        }}>
          {station}
        </span>
        <span style={{
          fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700,
          color: 'rgba(0,0,0,0.3)',
        }}>
          {tag}
        </span>
      </div>

      {/* Label */}
      <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>
        {label}
      </div>

      {/* Value */}
      {isUnconfigured ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', margin: '0.5rem 0' }}>
          <Info size={16} />
          <span style={{ fontSize: '0.85rem' }}>Not configured</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', margin: '0.5rem 0' }}>
          <span style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1, color: '#1a2e1b' }}>
            {formatValue(value, unit)}
          </span>
          <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{unit}</span>
          {trend && (
            <span style={{ marginLeft: 4, color: trend === 'up' ? '#dc2626' : trend === 'down' ? '#16a34a' : '#94a3b8' }}>
              {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
            </span>
          )}
        </div>
      )}

      {/* Range bar */}
      {showBar && (
        <div style={{ height: 4, background: '#f1f5f1', borderRadius: 2, margin: '0.625rem 0', position: 'relative', overflow: 'hidden' }}>
          {/* Warning zone */}
          {rangeWarnMin !== undefined && rangeWarnMax !== undefined && (
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${warnFracMin * 100}%`,
              width: `${(warnFracMax - warnFracMin) * 100}%`,
              background: 'rgba(34,197,94,0.2)',
            }} />
          )}
          {/* Value indicator */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${Math.max(0, frac * 100 - 1.5)}%`,
            width: 3,
            background: qc,
            borderRadius: 1,
          }} />
        </div>
      )}

      {/* Footer: quality + timestamp */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {quality === 'out_of_range' || quality === 'sensor_error' ? (
            <AlertTriangle size={11} color={qc} />
          ) : null}
          <span style={{
            fontSize: '0.68rem', fontWeight: 600,
            color: qc,
            letterSpacing: '0.04em',
          }}>
            {QUALITY_LABEL[quality]}
          </span>
          {isEstimate && quality !== 'not_configured' && (
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: 2 }}>~</span>
          )}
        </div>
        {timestamp && (
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {/* Commissioning note */}
      {commissioningStatus && commissioningStatus !== 'installed_calibrated' && (
        <div style={{
          marginTop: '0.5rem', padding: '0.25rem 0.5rem',
          background: '#fffbeb', borderRadius: '0.375rem',
          border: '1px solid #fde68a',
          fontSize: '0.68rem', color: '#92400e', lineHeight: 1.4,
        }}>
          {commissioningStatus === 'proposed_cad' && '📐 Proposed in Rev B CAD — not yet installed'}
          {commissioningStatus === 'optional_unconfigured' && '⊘ Optional — blanked in base configuration'}
          {commissioningStatus === 'installed_uncalibrated' && '⚠ Installed — calibration required'}
          {commissioningStatus === 'selected_awaiting_install' && '📦 Selected — awaiting installation'}
        </div>
      )}

      {footnote && (
        <div style={{ marginTop: '0.375rem', fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic' }}>
          {footnote}
        </div>
      )}
    </div>
  )
}
