'use client'
import { useApp } from '@/components/AppContext'
import SensorCard from '@/components/SensorCard'
import { DEMO_SENSOR_CONFIGS } from '@/lib/demo-data'
import { RefreshCw } from 'lucide-react'

const R: Record<string,{min:number,max:number,wMin?:number,wMax?:number}> = {
  pH:{min:4,max:12,wMin:6.5,wMax:8.5}, turbidity:{min:0,max:300,wMin:0,wMax:50},
  conductivity:{min:0,max:3000,wMin:0,wMax:1500}, temperature:{min:0,max:50,wMin:10,wMax:40},
}

export default function LivePage() {
  const { latestReadings, isDemo, refresh, lastUpdateAt } = useApp()
  const age = lastUpdateAt ? Math.floor((Date.now()-new Date(lastUpdateAt).getTime())/1000) : null

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <div>
          <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'#1a2e1b'}}>Live Sensor Readings</h1>
          <p style={{fontSize:'0.8rem',color:'#64748b',marginTop:4}}>8 base channels + 2 simulated LAS readings · auto-refresh 30s{age!==null?` · ${age}s ago`:''}</p>
          {isDemo&&<p style={{fontSize:'0.72rem',color:'#7c3aed',fontWeight:600}}>SIMULATED — not hardware</p>}
        </div>
        <button onClick={refresh} className="btn-secondary" style={{display:'flex',alignItems:'center',gap:6}}>
          <RefreshCw size={15}/> Refresh
        </button>
      </div>
      {(['influent','effluent'] as const).map(st=>(
        <div key={st} style={{marginBottom:'1.75rem'}}>
          <h2 style={{fontSize:'0.85rem',fontWeight:700,color:st==='influent'?'#1d4ed8':'#15803d',marginBottom:'0.75rem',textTransform:'uppercase',letterSpacing:'0.06em'}}>
            {st==='influent'?'Influent Station — Headspace':'Effluent Station — Flow-Through Cell'}
          </h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:'1rem'}}>
            {DEMO_SENSOR_CONFIGS.filter(c=>c.station===st).map(cfg=>{
              const ev=latestReadings[cfg.tag]; const r=R[cfg.measurand]??{min:0,max:100}
              return <SensorCard key={cfg.tag} tag={cfg.tag} label={cfg.label} displayTag={cfg.display_tag}
                secondaryLabel={cfg.secondary_label} badgeLabel={cfg.badge_label}
                methodLabel={cfg.method_label} statusLabel={cfg.status_label}
                value={ev?.calibrated_value??null} unit={cfg.unit} station={st}
                quality={ev?.quality_flag??'missing'} source={ev?.source_mode??'simulated'}
                timestamp={ev?.observed_at??null} commissioningStatus={cfg.commissioning_status}
                rangeMin={r.min} rangeMax={r.max} rangeWarnMin={r.wMin} rangeWarnMax={r.wMax}
                footnote={cfg.placeholder_note} />
            })}
          </div>
        </div>
      ))}
      <div className="card" style={{padding:'0.875rem 1rem',background:'#fffbeb',border:'1px solid #fde68a'}}>
        <p style={{fontSize:'0.78rem',color:'#92400e',lineHeight:1.7}}>pH/turbidity/EC/temperature do <em>not</em> quantify LAS or other specific pollutants. EC reduction ≠ LAS removal.</p>
      </div>
    </div>
  )
}
