'use client'
import { useApp } from '@/components/AppContext'
import { generateHistoricalData } from '@/lib/demo-data'
import { useState } from 'react'
import { Download, FileText } from 'lucide-react'

export default function ReportsPage() {
  const { deviceId, isDemo, latestReadings } = useApp()
  const [done, setDone] = useState(false)

  const exportCSV = () => {
    const evs = generateHistoricalData(deviceId,24,10)
    const rows = [['timestamp','device_id','sensor_id','station','value','unit','quality','source'].join(','),
      ...evs.map(e=>[e.observed_at,e.device_id,e.sensor_id,e.measurement_point,e.calibrated_value,e.unit,e.quality_flag,e.source_mode].join(','))]
    const blob = new Blob([rows.join('\n')],{type:'text/csv'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob)
    a.download=`mycofilter_${deviceId}_${new Date().toISOString().slice(0,10)}.csv`; a.click()
    setDone(true); setTimeout(()=>setDone(false),3000)
  }

  const readings = Object.values(latestReadings)

  return (
    <div>
      <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'#1a2e1b',marginBottom:4}}>Reports & Export</h1>
      <p style={{fontSize:'0.82rem',color:'#64748b',marginBottom:'1.25rem'}}>Export data · Import lab results</p>
      {isDemo&&<div style={{background:'#f5f3ff',border:'1px solid #c4b5fd',borderRadius:8,padding:'0.625rem 1rem',marginBottom:'1rem',fontSize:'0.8rem',color:'#6d28d9',fontWeight:600}}>⚠ Exported data is simulated</div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'1rem',marginBottom:'1.5rem'}}>
        <div className="card" style={{padding:'1.25rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem'}}><Download size={18} color="#3d7d3f"/><b style={{fontSize:'0.95rem',color:'#1a2e1b'}}>Sensor Data CSV</b></div>
          <p style={{fontSize:'0.8rem',color:'#64748b',marginBottom:'1rem',lineHeight:1.6}}>Last 24h · timestamps · quality flags · source modes</p>
          <button onClick={exportCSV} className="btn-primary" style={{width:'100%',fontSize:'0.875rem'}}>{done?'✓ Downloaded':'Export CSV'}</button>
        </div>
        <div className="card" style={{padding:'1.25rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem'}}><FileText size={18} color="#3d7d3f"/><b style={{fontSize:'0.95rem',color:'#1a2e1b'}}>Import Lab Results</b></div>
          <p style={{fontSize:'0.8rem',color:'#64748b',marginBottom:'1rem',lineHeight:1.6}}>Upload LAS/MBAS/TDS analytical results. MBAS ≠ LAS-specific — label correctly.</p>
          <button className="btn-secondary" style={{width:'100%',fontSize:'0.875rem'}} disabled>Upload CSV (coming soon)</button>
        </div>
      </div>

      <div className="card" style={{padding:'1.25rem'}}>
        <h2 style={{fontWeight:700,fontSize:'0.95rem',color:'#1a2e1b',marginBottom:'0.75rem'}}>Current Snapshot — {readings.length} readings</h2>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.8rem'}}>
            <thead><tr style={{borderBottom:'2px solid #f1f5f1'}}>
              {['Sensor','Station','Value','Unit','Quality','Source','Time'].map(h=><th key={h} style={{padding:'0.5rem 0.625rem',textAlign:'left',color:'#64748b',fontWeight:600,fontSize:'0.75rem'}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {readings.sort((a,b)=>a.sensor_id.localeCompare(b.sensor_id)).map(ev=>(
                <tr key={ev.sensor_id} style={{borderBottom:'1px solid #f8faf8'}}>
                  <td style={{padding:'0.45rem 0.625rem',fontFamily:'monospace',fontWeight:700}}>{ev.sensor_id}</td>
                  <td style={{padding:'0.45rem 0.625rem',color:'#64748b'}}>{ev.measurement_point}</td>
                  <td style={{padding:'0.45rem 0.625rem',fontWeight:600}}>{ev.calibrated_value?.toFixed(2)??'—'}</td>
                  <td style={{padding:'0.45rem 0.625rem',color:'#64748b'}}>{ev.unit}</td>
                  <td style={{padding:'0.45rem 0.625rem'}}><span style={{fontSize:'0.68rem',fontWeight:600,color:ev.quality_flag==='valid'?'#16a34a':ev.quality_flag==='estimated'?'#0891b2':'#d97706'}}>{ev.quality_flag}</span></td>
                  <td style={{padding:'0.45rem 0.625rem',color:'#64748b'}}>{ev.source_mode}</td>
                  <td style={{padding:'0.45rem 0.625rem',color:'#94a3b8',fontFamily:'monospace',fontSize:'0.7rem'}}>{ev.observed_at?new Date(ev.observed_at).toLocaleTimeString():'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
