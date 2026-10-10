'use client'

import { useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'

interface Layer {
  id: string
  label: string
  sublabel?: string
  height: number   // relative height units
  color: string
  hatch?: string
  description: string
  sensorTags?: string[]
}

const LAYERS: Layer[] = [
  {
    id: 'inlet',
    label: 'Raw Water Inlet',
    sublabel: 'G1/4, Ø12 OD',
    height: 18,
    color: '#bfdbfe',
    description: 'Raw water enters via the top side port (G1/4). Flow travels down into the flooded influent headspace.',
  },
  {
    id: 'headspace',
    label: 'Influent Headspace',
    sublabel: 'Flooded distributor · S1 pH · S2 Turbidity · S3 EC · T-in',
    height: 60,
    color: '#dbeafe',
    description: 'The flooded influent headspace distributes water evenly across the cartridge cross-section. Four sensors (S1 pH, S2 turbidity, S3 EC, T-in temperature) measure raw-water quality here. S4 (ISE) is blanked in the base configuration. The air-bleed valve at the crown purges trapped air. Representative readings require a full headspace.',
    sensorTags: ['S1', 'S2', 'S3', 'T-in', 'S4 ⊘'],
  },
  {
    id: 'mycelium',
    label: '① Mycelium Module',
    sublabel: '60 mm · Phanerochaete chrysosporium (proposed)',
    height: 80,
    color: '#fef9c3',
    description: 'The uppermost treatment layer. Fungal mycelium colonises the substrate. The proposed species is Phanerochaete chrysosporium BKM-F-1767 (ATCC 24725) — subject to strain sourcing and suitability confirmation. The mycelium produces ligninolytic enzymes that may degrade recalcitrant organic compounds including surfactants. No treatment efficacy is claimed for the base build.',
  },
  {
    id: 'biochar',
    label: '② Biochar Module',
    sublabel: '60 mm · Agricultural-waste biochar',
    height: 80,
    color: '#d4d4d8',
    description: 'Agricultural-waste biochar provides a high surface-area adsorbent for organic pollutants including LAS surfactant and other contaminants. Biochar also provides a structural habitat for the mycelium and may moderate pH. Adsorption capacity is finite and will reach exhaustion — schedule periodic replacement per the maintenance log.',
  },
  {
    id: 'support',
    label: '③ Support / Gravel Layer',
    sublabel: '30 mm · Gravel / ceramic',
    height: 45,
    color: '#e7e5e4',
    description: 'The gravel/ceramic support layer provides mechanical filtration, underdrain drainage, and physical support for the treatment media above. Gravel/ceramic media are not expected to significantly adsorb dissolved organics.',
  },
  {
    id: 'chamber',
    label: 'Collection / Under-drain Chamber',
    sublabel: 'Treated water collects here',
    height: 35,
    color: '#d1fae5',
    description: 'Treated water from all three media layers collects in the under-drain chamber at the base of the housing. From here it exits via the side port to the downstream effluent measurement train.',
  },
  {
    id: 'effluent-cell',
    label: 'Effluent Flow-Through Sensor Cell',
    sublabel: '130×46×42mm · E1 pH · E2 Turbidity · E3 EC · E5 Temp',
    height: 55,
    color: '#ecfdf5',
    description: 'A separate downstream flow-through cell (PP/PVDF/PMMA block) with a Ø22mm central channel holds the effluent sensors. Probes are at 22mm pitch: E1 pH (x=88mm), E2 turbidity (x=110mm), E3 EC (x=132mm), E5 temperature (x=154mm), E4 ISE (x=176mm, blanked). A G1/4 drain is at the invert. The outlet ball valve downstream keeps the cell flooded.',
    sensorTags: ['E1', 'E2', 'E3', 'E5', 'E4 ⊘'],
  },
  {
    id: 'flowmeter',
    label: 'Flowmeter Position',
    sublabel: '60 mm envelope · Blank spool in base build',
    height: 28,
    color: '#f3f4f6',
    description: 'The 60mm envelope downstream of the effluent cell is occupied by a blank spool in the base configuration. An optional inline flowmeter can replace the spool when selected (verify model, flow range, port size, straight-run, orientation, output type — all TBD). Flow rate, processed volume, and hydraulic residence time are NOT reported unless a real flowmeter is installed.',
  },
  {
    id: 'valve',
    label: 'Outlet Ball Valve',
    sublabel: 'Throttle downstream — keeps cell + meter flooded',
    height: 22,
    color: '#fde68a',
    description: 'The outlet ball valve is positioned downstream of both the effluent cell and the flowmeter position. Throttling downstream keeps both the effluent cell and any installed flowmeter fully flooded, ensuring representative sensor immersion and consistent flow conditions.',
  },
  {
    id: 'outlet',
    label: 'Treated Water Outlet',
    sublabel: 'G1/4, Ø12 OD',
    height: 18,
    color: '#bbf7d0',
    description: 'The treated water exits the system at the outlet. The base configuration does not claim any specific effluent quality standard or treatment certification.',
  },
]

export default function FilterVisualization() {
  const [active, setActive] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const totalH = LAYERS.reduce((s, l) => s + l.height, 0) + (LAYERS.length - 1) * 4

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* ── SVG cutaway ── */}
      <div style={{ flexShrink: 0, position: 'sticky', top: '80px' }}>
        <svg
          width={200}
          height={totalH + 40}
          viewBox={`0 0 200 ${totalH + 40}`}
          aria-label="Rev B filter cutaway schematic"
          role="img"
        >
          {/* Housing walls */}
          <rect x={12} y={0} width={8}  height={totalH + 10} fill="#2d4030" rx={2} />
          <rect x={180} y={0} width={8} height={totalH + 10} fill="#2d4030" rx={2} />

          {/* Inlet arrow */}
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" />
            </marker>
            <marker id="arrow-green" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#22c55e" />
            </marker>
            {/* Hatching patterns */}
            <pattern id="hatch-mycelium" patternUnits="userSpaceOnUse" width="8" height="8">
              <path d="M0,8 L8,0" stroke="#a16207" strokeWidth="1" opacity="0.4" />
            </pattern>
            <pattern id="hatch-biochar" patternUnits="userSpaceOnUse" width="6" height="6">
              <circle cx="3" cy="3" r="1.5" fill="#52525b" opacity="0.5" />
            </pattern>
            <pattern id="hatch-gravel" patternUnits="userSpaceOnUse" width="8" height="8">
              <path d="M0,4 Q4,0 8,4 Q4,8 0,4" stroke="#78716c" strokeWidth="1" fill="none" opacity="0.4" />
            </pattern>
          </defs>

          {/* Inlet line */}
          <line x1={0} y1={18} x2={22} y2={18} stroke="#3b82f6" strokeWidth={3} markerEnd="url(#arrow)" />
          <text x={2} y={13} fontSize={7} fill="#3b82f6" fontWeight={600}>IN</text>

          {/* Layers */}
          {(() => {
            let y = 0
            return LAYERS.map((layer, i) => {
              const top = y
              y += layer.height + 4
              const isActive = active === layer.id

              // Pick hatch pattern
              let hatchFill = layer.color
              let hatchOverlay: JSX.Element | null = null
              if (layer.id === 'mycelium') {
                hatchOverlay = <rect x={22} y={top} width={156} height={layer.height} fill="url(#hatch-mycelium)" opacity={0.7} />
              } else if (layer.id === 'biochar') {
                hatchOverlay = <rect x={22} y={top} width={156} height={layer.height} fill="url(#hatch-biochar)" opacity={0.7} />
              } else if (layer.id === 'support') {
                hatchOverlay = <rect x={22} y={top} width={156} height={layer.height} fill="url(#hatch-gravel)" opacity={0.7} />
              }

              return (
                <g key={layer.id}>
                  <rect
                    x={22} y={top} width={156} height={layer.height}
                    fill={hatchFill}
                    stroke={isActive ? '#0bbdb6' : '#ccc'}
                    strokeWidth={isActive ? 2 : 0.5}
                    rx={2}
                    className="filter-layer"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActive(active === layer.id ? null : layer.id)}
                  />
                  {hatchOverlay && <g style={{ pointerEvents: 'none' }}>{hatchOverlay}</g>}

                  {/* Label */}
                  <text
                    x={100} y={top + layer.height / 2 - 2}
                    textAnchor="middle" fontSize={7.5} fill="#374151" fontWeight={600}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {layer.label.replace(/^[①②③]/, '').trim()}
                  </text>

                  {/* Flow arrows for liquid layers */}
                  {(layer.id === 'headspace' || layer.id === 'mycelium' || layer.id === 'biochar' || layer.id === 'support') && (
                    <>
                      <line
                        x1={80} y1={top + layer.height * 0.35}
                        x2={80} y2={top + layer.height * 0.7}
                        stroke="#3b82f6" strokeWidth={1.5} opacity={0.4}
                        markerEnd="url(#arrow)"
                        style={{ pointerEvents: 'none' }}
                      />
                      <line
                        x1={120} y1={top + layer.height * 0.35}
                        x2={120} y2={top + layer.height * 0.7}
                        stroke="#3b82f6" strokeWidth={1.5} opacity={0.4}
                        markerEnd="url(#arrow)"
                        style={{ pointerEvents: 'none' }}
                      />
                    </>
                  )}

                  {/* Sensor dots for headspace and effluent-cell */}
                  {layer.sensorTags && layer.sensorTags.filter(t => !t.includes('⊘')).map((tag, ti) => (
                    <circle
                      key={tag}
                      cx={30 + ti * 24}
                      cy={top + layer.height - 8}
                      r={5}
                      fill={layer.id === 'headspace' ? '#3b82f6' : '#22c55e'}
                      opacity={0.85}
                    />
                  ))}
                </g>
              )
            })
          })()}

          {/* Outlet arrow */}
          <line x1={178} y1={totalH - 20} x2={200} y2={totalH - 20} stroke="#22c55e" strokeWidth={3} markerEnd="url(#arrow-green)" />
          <text x={158} y={totalH - 25} fontSize={7} fill="#22c55e" fontWeight={600}>OUT</text>
        </svg>

        {/* Legend */}
        <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
            <span>Influent sensors (S1–T-in)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
            <span>Effluent sensors (E1–E5)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, border: '1.5px solid #0bbdb6' }} />
            <span>Click layer for details</span>
          </div>
        </div>
      </div>

      {/* ── Layer details panel ── */}
      <div style={{ flex: 1, minWidth: 260 }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1a2e1b', marginBottom: '0.5rem' }}>
          Filter Design — Rev B
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          MycoFilter 2.0 is a modular biohybrid water-treatment prototype. This drawing reflects the{' '}
          <strong>preliminary Rev B CAD configuration</strong> — not a commissioned or certified system.
          Sensor channels shown as proposed in the CAD; not all are installed or calibrated.
        </p>

        {LAYERS.map(layer => (
          <div
            key={layer.id}
            className="card"
            style={{
              marginBottom: '0.625rem',
              border: active === layer.id ? '2px solid #0bbdb6' : undefined,
              padding: '0.875rem 1rem',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onClick={() => setActive(active === layer.id ? null : layer.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a2e1b' }}>{layer.label}</div>
                {layer.sublabel && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{layer.sublabel}</div>
                )}
              </div>
              <ChevronDown
                size={16}
                color="#94a3b8"
                style={{ transform: active === layer.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}
              />
            </div>
            {active === layer.id && (
              <p style={{ marginTop: '0.625rem', fontSize: '0.8rem', color: '#374151', lineHeight: 1.7, borderTop: '1px solid #f1f5f1', paddingTop: '0.625rem' }}>
                {layer.description}
              </p>
            )}
            {layer.sensorTags && (
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {layer.sensorTags.map(t => (
                  <span key={t} style={{
                    fontSize: '0.68rem', fontWeight: 700, fontFamily: 'monospace',
                    padding: '2px 7px', borderRadius: 4,
                    background: t.includes('⊘') ? '#f1f5f9' : (layer.id === 'headspace' ? '#dbeafe' : '#dcfce7'),
                    color: t.includes('⊘') ? '#94a3b8' : (layer.id === 'headspace' ? '#1d4ed8' : '#15803d'),
                    border: `1px solid ${t.includes('⊘') ? '#e2e8f0' : (layer.id === 'headspace' ? '#bfdbfe' : '#bbf7d0')}`,
                    textDecoration: t.includes('⊘') ? 'line-through' : 'none',
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Electronics note */}
        <div className="card" style={{ padding: '0.875rem 1rem', marginTop: '1rem', background: '#fffbeb', border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <Info size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#92400e', marginBottom: 4 }}>
                Electronics — Proposed / Conceptual (Rev B)
              </div>
              <p style={{ fontSize: '0.75rem', color: '#78350f', lineHeight: 1.6 }}>
                ESP32-WROOM-32E MCU, SX1276 LoRa radio, and ADS1115 ADC are shown as <em>conceptual</em> electronics
                in the Rev B CAD. The ADS1115 has only 4 single-ended channels — insufficient for 8 sensor channels.
                Probe-interface electronics (BOM item 301) are undecided. The SX1276 is not an internet gateway.
                LoRa gateway / data store not yet specified.
              </p>
            </div>
          </div>
        </div>

        {/* Research note */}
        <div className="card" style={{ padding: '0.875rem 1rem', marginTop: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <Info size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#166534', marginBottom: 4 }}>
                Research Context
              </div>
              <p style={{ fontSize: '0.75rem', color: '#14532d', lineHeight: 1.6 }}>
                Initial research application: <strong>domestic laundry greywater</strong> with linear alkylbenzene sulfonate (LAS)
                as the proposed primary pollutant. Proposed fungal candidate:{' '}
                <em>Phanerochaete chrysosporium</em> BKM-F-1767 (ATCC 24725) — subject to strain sourcing and
                suitability checks. pH, turbidity, and EC sensors do NOT directly measure LAS concentration.
                LAS quantification requires specific analytical methods (HPLC, etc.). MBAS screens for anionic
                surfactants generally and is not LAS-specific.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
