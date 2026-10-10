'use client'
import { useApp } from '@/components/AppContext'
import SensorCard from '@/components/SensorCard'
import Link from 'next/link'
import { Activity, BarChart2, Wrench, BellRing, Droplets, Info } from 'lucide-react'
import { DEMO_SENSOR_CONFIGS } from '@/lib/demo-data'
import { calculateReduction, calculatePHShift } from '@/lib/calculations'

const RANGE_MAP: Record<string,{min:number,max:number,wMin?:number,wMax?:number}> = {
  pH:          { min:4,   max:12,  wMin:6.5, wMax:8.5 },
  turbidity:   { min:0,   max:300, wMin:0,   wMax:50  },
  conductivity:{ min:0,   max:3000,wMin:0,   wMax:1500},
  temperature: { min:0,   max:50,  wMin:10,  wMax:40  },
}

export default function OverviewPage() {
  const { latestReadings, alerts, isDemo, deviceId } = useApp()
  const unacked = alerts.filter(a => !a.acknowledged_at)

  const inPH  = latestReadings['S1']?.calibrated_value ?? null
  const outPH = latestReadings['E1']?.calibrated_value ?? null
  const inTurb = latestReadings['S2']?.calibrated_value ?? null
  const outTurb = latestReadings['E2']?.calibrated_value ?? null
  const inEC  = latestReadings['S3']?.calibrated_value ?? null
  const outEC = latestReadings['E3']?.calibrated_value ?? null

  const turbRed = calculateReduction(inTurb, outTurb, 'Turbidity')
  const ecRed   = calculateReduction(inEC,   outEC,   'EC')
  const phShift = calculatePHShift(inPH, outPH)

  const sensorCards = DEMO_SENSOR_CONFIGS.slice(0,8)

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:700, color:'#1a2e1b' }}>Overview — {deviceId}</h1>
        <p style={{ fontSize:'0.85rem', color:'#64748b', marginTop:4 }}>Real-time filter monitoring dashboard · Rev B base configuration</p>
        {isDemo && <p style={{ fontSize:'0.75rem', color:'#7c3aed', marginTop:4, fontWeight:600 }}>⚠ All readings are simulated — no hardware connected</p>}
      </div>

      {/* Quick stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Active Alerts', value: unacked.length, color: unacked.length>0?'#dc2626':'#16a34a', href:'/dashboard/alerts', icon:<BellRing size={18}/> },
          { label:'Turbidity Reduction', value: turbRed.reduction_percent!=null?`${turbRed.reduction_percent.toFixed(1)}%`:'—', color:'#0891b2', href:'/dashboard/compare', icon:<Droplets size={18}/> },
          { label:'EC Reduction', value: ecRed.reduction_percent!=null?`${ecRed.reduction_percent.toFixed(1)}%`:'—', color:'#0891b2', href:'/dashboard/compare', icon:<Activity size={18}/> },
          { label:'pH Shift', value: phShift.shift!=null?`${phShift.shift>0?'+':''}${phShift.shift.toFixed(2)}`:'—', color:'#d97706', href:'/dashboard/compare', icon:<Info size={18}/> },
        ].map(s=>(
          <Link key={s.label} href={s.href} className="card" style={{ padding:'1rem', display:'block', textDecoration:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'#64748b', marginBottom:'0.5rem' }}>
              {s.icon}<span style={{ fontSize:'0.78rem', fontWeight:500 }}>{s.label}</span>
            </div>
            <div style={{ fontSize:'1.75rem', fontWeight:700, color:s.color }}>{s.value}</div>
            {s.label==='pH Shift' && <p style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:4 }}>Not a pollutant-removal %</p>}
            {(s.label==='Turbidity Reduction'||s.label==='EC Reduction') && <p style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:4 }}>Simulated — not validated</p>}
          </Link>
        ))}
      </div>

      {/* Influent sensors */}
      <h2 style={{ fontSize:'1rem', fontWeight:700, color:'#1d4ed8', marginBottom:'0.75rem' }}>Influent Station</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        {sensorCards.filter(s=>s.station==='influent').map(cfg=>{
          const ev = latestReadings[cfg.tag]
          const range = RANGE_MAP[cfg.measurand] ?? { min:0, max:100 }
          return (
            <SensorCard key={cfg.tag}
              tag={cfg.tag} label={cfg.label}
              value={ev?.calibrated_value??null} unit={cfg.unit}
              station="influent"
              quality={ev?.quality_flag??'missing'}
              source={ev?.source_mode??'simulated'}
              timestamp={ev?.observed_at??null}
              commissioningStatus={cfg.commissioning_status}
              rangeMin={range.min} rangeMax={range.max}
              rangeWarnMin={range.wMin} rangeWarnMax={range.wMax}
            />
          )
        })}
      </div>

      {/* Effluent sensors */}
      <h2 style={{ fontSize:'1rem', fontWeight:700, color:'#15803d', marginBottom:'0.75rem' }}>Effluent Station</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
        {sensorCards.filter(s=>s.station==='effluent').map(cfg=>{
          const ev = latestReadings[cfg.tag]
          const range = RANGE_MAP[cfg.measurand] ?? { min:0, max:100 }
          return (
            <SensorCard key={cfg.tag}
              tag={cfg.tag} label={cfg.label}
              value={ev?.calibrated_value??null} unit={cfg.unit}
              station="effluent"
              quality={ev?.quality_flag??'missing'}
              source={ev?.source_mode??'simulated'}
              timestamp={ev?.observed_at??null}
              commissioningStatus={cfg.commissioning_status}
              rangeMin={range.min} rangeMax={range.max}
              rangeWarnMin={range.wMin} rangeWarnMax={range.wMax}
            />
          )
        })}
      </div>

      {/* Nav cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem' }}>
        {[
          { href:'/dashboard/live',    label:'Live Sensors',      desc:'All channels, real-time', icon:<Activity size={20}/>,  color:'#3b82f6' },
          { href:'/dashboard/trends',  label:'Historical Trends', desc:'Charts over time',         icon:<BarChart2 size={20}/>, color:'#8b5cf6' },
          { href:'/dashboard/compare', label:'Influent vs Effluent', desc:'Side-by-side comparison', icon:<Droplets size={20}/>, color:'#0891b2' },
          { href:'/dashboard/maintenance', label:'Maintenance',   desc:'Filter health log',        icon:<Wrench size={20}/>,    color:'#d97706' },
        ].map(n=>(
          <Link key={n.href} href={n.href} className="card" style={{ padding:'1.125rem', display:'block', textDecoration:'none', borderLeft:`3px solid ${n.color}` }}>
            <div style={{ color:n.color, marginBottom:'0.5rem' }}>{n.icon}</div>
            <div style={{ fontWeight:600, fontSize:'0.9rem', color:'#1a2e1b' }}>{n.label}</div>
            <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:4 }}>{n.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
