'use client'
import { useApp } from '@/components/AppContext'
import { CheckCircle, AlertTriangle, Info } from 'lucide-react'

const S: Record<string,{bg:string,border:string,color:string}> = {
  critical:{bg:'#fef2f2',border:'#fca5a5',color:'#991b1b'},
  warning: {bg:'#fffbeb',border:'#fde68a',color:'#92400e'},
  info:    {bg:'#eff6ff',border:'#bfdbfe',color:'#1e40af'},
}

export default function AlertsPage() {
  const { alerts, acknowledgeAlert, isDemo } = useApp()
  const sorted = [...alerts].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime())
  const unacked = sorted.filter(a=>!a.acknowledged_at)
  const acked   = sorted.filter(a=> a.acknowledged_at)

  return (
    <div>
      <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'#1a2e1b',marginBottom:4}}>Alerts</h1>
      <p style={{fontSize:'0.82rem',color:'#64748b',marginBottom:'1.25rem'}}>{unacked.length} active · {acked.length} acknowledged</p>
      {isDemo&&<div style={{background:'#f5f3ff',border:'1px solid #c4b5fd',borderRadius:8,padding:'0.625rem 1rem',marginBottom:'1rem',fontSize:'0.8rem',color:'#6d28d9',fontWeight:600}}>⚠ Demo alerts — not from hardware</div>}

      {unacked.length===0&&(
        <div className="card" style={{padding:'2rem',textAlign:'center',color:'#16a34a'}}>
          <CheckCircle size={32} style={{margin:'0 auto 0.75rem'}}/>
          <div style={{fontWeight:600}}>No active alerts</div>
        </div>
      )}

      {unacked.map(a=>{
        const s=S[a.severity]??S.info
        const Icon=a.severity==='info'?Info:AlertTriangle
        return (
          <div key={a.id} className="card" style={{padding:'1rem',marginBottom:'0.75rem',background:s.bg,border:`1px solid ${s.border}`,display:'flex',gap:'0.875rem',alignItems:'flex-start'}}>
            <Icon size={16} color={s.color} style={{flexShrink:0,marginTop:2}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:'0.875rem',color:s.color}}>{a.title}</div>
              <p style={{fontSize:'0.8rem',color:'#374151',marginTop:4,lineHeight:1.6}}>{a.message}</p>
              {a.observed_value!==undefined&&<p style={{fontSize:'0.72rem',color:'#6b7280',marginTop:4}}>Observed: {a.observed_value} · Threshold: {a.threshold} · {a.sensor_id}</p>}
              <p style={{fontSize:'0.7rem',color:'#9ca3af',marginTop:4}}>{new Date(a.created_at).toLocaleString()}</p>
            </div>
            <button onClick={()=>acknowledgeAlert(a.id)} className="btn-secondary" style={{fontSize:'0.78rem',padding:'0.35rem 0.875rem',flexShrink:0}}>Acknowledge</button>
          </div>
        )
      })}

      {acked.length>0&&(
        <div style={{marginTop:'1.5rem'}}>
          <h2 style={{fontSize:'0.875rem',fontWeight:600,color:'#94a3b8',marginBottom:'0.75rem'}}>Acknowledged</h2>
          {acked.map(a=>(
            <div key={a.id} className="card" style={{padding:'0.75rem 1rem',marginBottom:'0.5rem',opacity:0.65,display:'flex',gap:'0.75rem',alignItems:'center'}}>
              <CheckCircle size={13} color="#16a34a"/>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:'0.82rem',color:'#374151'}}>{a.title}</div>
                <div style={{fontSize:'0.7rem',color:'#9ca3af'}}>{a.acknowledged_at?new Date(a.acknowledged_at).toLocaleString():''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
