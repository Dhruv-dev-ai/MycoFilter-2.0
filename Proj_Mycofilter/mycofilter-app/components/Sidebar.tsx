'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Activity, BarChart2, Droplets, Wrench,
  FlaskConical, BellRing, FileText, Cpu, Settings2,
  ChevronLeft, ChevronRight, Leaf, LogOut, Info,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const NAV_SECTIONS = [
  {
    label: 'Monitoring',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/live', label: 'Live Sensors', icon: Activity },
      { href: '/dashboard/compare', label: 'In vs Effluent', icon: Droplets },
      { href: '/dashboard/trends', label: 'Historical Trends', icon: BarChart2 },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { href: '/dashboard/quality', label: 'Water Quality', icon: FlaskConical },
      { href: '/dashboard/alerts', label: 'Alerts', icon: BellRing },
      { href: '/dashboard/reports', label: 'Reports & Export', icon: FileText },
    ],
  },
  {
    label: 'Device',
    items: [
      { href: '/dashboard/filter-design', label: 'Filter Design', icon: Cpu },
      { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench },
      { href: '/dashboard/calibration', label: 'Calibration', icon: Settings2 },
      { href: '/dashboard/settings', label: 'Device Settings', icon: Info },
    ],
  },
]

interface SidebarProps {
  deviceName?: string
  deviceId?: string
  isDemo?: boolean
  onSignOut?: () => void
}

export default function Sidebar({ deviceName = 'MycoFilter 2.0', deviceId = '—', isDemo, onSignOut }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className="sidebar"
      style={{ width: collapsed ? '64px' : 'var(--sidebar-width)', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}
      aria-label="Primary navigation"
    >
      {/* ── Logo / device header ─── */}
      <div style={{
        padding: collapsed ? '1rem 0.75rem' : '1.25rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
      }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          background: 'linear-gradient(135deg,#3d7d3f,#0bbdb6)',
          borderRadius: '0.625rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Leaf size={20} color="white" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {deviceName}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontFamily: 'monospace', marginTop: 1 }}>
              {deviceId}
            </div>
            {isDemo && (
              <div style={{
                marginTop: 4, fontSize: '0.65rem', fontWeight: 700,
                color: '#c4b5fd', letterSpacing: '0.06em',
              }}>
                DEMO
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Collapse toggle ─── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute', top: '4.5rem', right: '-12px',
          width: 24, height: 24,
          background: '#2d6330', border: '1.5px solid rgba(255,255,255,0.12)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 50, color: 'rgba(255,255,255,0.8)',
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ── Navigation ─── */}
      <nav style={{ padding: '0.75rem 0.625rem', flex: 1 }} aria-label="App sections">
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: '0.75rem' }}>
            {!collapsed && (
              <div style={{
                color: 'rgba(255,255,255,0.25)',
                fontSize: '0.65rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '0.25rem 0.75rem', marginBottom: '0.25rem',
              }}>
                {section.label}
              </div>
            )}
            {section.items.map(item => {
              const Icon = item.icon
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onMouseEnter={() => router.prefetch(item.href)}
                  className={`nav-item${active ? ' active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  style={{ justifyContent: collapsed ? 'center' : undefined }}
                >
                  <Icon size={18} className="nav-icon" style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Sign out ─── */}
      {onSignOut && (
        <div style={{ padding: '0.75rem 0.625rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={onSignOut}
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', justifyContent: collapsed ? 'center' : undefined }}
          >
            <LogOut size={18} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      )}
    </aside>
  )
}
