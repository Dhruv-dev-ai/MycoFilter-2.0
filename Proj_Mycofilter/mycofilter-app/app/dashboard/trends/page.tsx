'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { generateHistoricalData } from '@/lib/demo-data'
import type { TelemetryEvent } from '@/lib/types'

const PARAMS = [
  { key:'pH',          label:'pH',          i:'S1',   o:'E1',  unit:'pH',    domain:[4,12]   as [number,number] },
  { key:'turbidity',   label:'Turbidity',   i:'S2',   o:'E2',  unit:'NTU',   domain:[0,300]  as [number,number] },
  { key:'conductivity',label:'EC',          i:'S3',   o:'E3',  unit:'µS/cm', domain:[0,2000] as [number,number] },
  { key:'temperature', label:'Temperature', i:'T_in', o:'E5',  unit:'°C',    domain:[0,50]   as [number,number] },
]

function buildData(evs: TelemetryEvent[], iS: string, oS: string) {
  const m: Record<string,{time:string,influent?:number,effluent?:number}> = {}
  for (const ev of evs) {
    const t=ev.observed_at.slice(0,16)
    if (!m[t]) m[t]={time:new Date(ev.observed_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
    if (ev.sensor_id===iS && ev.calibrated_value!==null) m[t].influent=ev.calibrated_value
    if (ev.sensor_id===oS && ev.calibrated_value!==null) m[t].effluent=ev.calibrated_value
  }
  return Object.values(m).slice(-60)
}

export default function TrendsPage() {
  const [data, setData] = useState<TelemetryEvent[]>([])
  const [hours, setHours] = useState(24)
  const [p, setP] = useState(PARAMS[0])

  useEffect(()=>{ setData(generateHistoricalData('MF-001-DEMO',hours,10)) },[hours])

  const cd = buildData(data, p.i, p.o)

  return (
    <div>
      <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'#1a2e1b',marginBottom:4}}>Historical Trends</h1>
      <p style={{fontSize:'0.8rem',color:'#64748b',marginBottom:'1.25rem'}}>Simulated data — not from hardware sensors</p>
      <div style={{display:'flex',gap:'0.625rem',flexWrap:'wrap',marginBottom:'1.25rem',alignItems:'center'}}>
        {PARAMS.map(q=><button key={q.key} onClick={()=>setP(q)} className={p.key===q.key?'btn-primary':'btn-secondary'} style={{padding:'0.375rem 0.875rem',fontSize:'0.82rem'}}>{q.label}</button>)}
        <div style={{marginLeft:'auto',display:'flex',gap:'0.375rem'}}>
          {[6,24,72].map(h=><button key={h} onClick={()=>setHours(h)} style={{padding:'0.3rem 0.625rem',borderRadius:6,border:'1px solid #cbd5e1',background:hours===h?'#2d6330':'white',color:hours===h?'white':'#475569',fontSize:'0.8rem',cursor:'pointer'}}>{h}h</button>)}
        </div>
      </div>
      <div className="card" style={{padding:'1.25rem'}}>
        <h2 style={{fontSize:'0.95rem',fontWeight:600,marginBottom:'1rem',color:'#1a2e1b'}}>{p.label} ({p.unit}) — Influent vs Effluent</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cd}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f1" />
            <XAxis dataKey="time" tick={{fontSize:11}} interval="preserveStartEnd" />
            <YAxis domain={p.domain} tick={{fontSize:11}} />
            <Tooltip formatter={(value) => {
              const numericValue = typeof value === 'number' ? value : Number(value)
              return Number.isFinite(numericValue)
                ? [`${numericValue.toFixed(2)} ${p.unit}`, '']
                : [String(value ?? '—'), '']
            }} />
            <Legend />
            <Line type="monotone" dataKey="influent" stroke="#3b82f6" strokeWidth={2} dot={false} name="Influent" />
            <Line type="monotone" dataKey="effluent" stroke="#22c55e" strokeWidth={2} dot={false} name="Effluent" />
          </LineChart>
        </ResponsiveContainer>
        <p style={{fontSize:'0.7rem',color:'#94a3b8',marginTop:'0.75rem'}}>⚠ Simulated data for demonstration only.</p>
      </div>
    </div>
  )
}
