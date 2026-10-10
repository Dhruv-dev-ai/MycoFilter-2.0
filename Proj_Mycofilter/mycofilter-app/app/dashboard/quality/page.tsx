'use client'
import { useApp } from '@/components/AppContext'
import { calculateCCMEWQI } from '@/lib/calculations'
import type { CCMEWQIInput } from '@/lib/types'
import { Info } from 'lucide-react'

const C: Record<string,string> = { Excellent:'#16a34a', Good:'#22c55e', Fair:'#ca8a04', Marginal:'#ea580c', Poor:'#dc2626' }

export default function QualityPage() {
  const { latestReadings, isDemo } = useApp()
  const ph  = latestReadings['E1']?.calibrated_value ?? null
  const turb = latestReadings['E2']?.calibrated_value ?? null

  const inputs: CCMEWQIInput[] = [
    { parameter:'pH', objective_min:6.5, objective_max:8.5, unit:'pH',
      observations: ph!==null?[{value:ph,timestamp:new Date().toISOString(),quality:'estimated'}]:[] },
    { parameter:'Turbidity', objective_max:25, unit:'NTU',
      observations: turb!==null?[{value:turb,timestamp:new Date().toISOString(),quality:'estimated'}]:[] },
  ]
  const wqi = calculateCCMEWQI(inputs,[new Date(Date.now()-86400000).toISOString(),new Date().toISOString()],'Illustrative objectives',1)

  return (
    <div>
      <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'#1a2e1b',marginBottom:4}}>Water Quality Assessment</h1>
      <p style={{fontSize:'0.82rem',color:'#64748b',marginBottom:'1.25rem'}}>CCME WQI (illustrative) · Effluent · 2 parameters configured</p>
      {isDemo&&<div style={{background:'#f5f3ff',border:'1px solid #c4b5fd',borderRadius:8,padding:'0.625rem 1rem',marginBottom:'1rem',fontSize:'0.8rem',color:'#6d28d9',fontWeight:600}}>⚠ Simulated — indices are illustrative only</div>}

      <div className="card" style={{padding:'1.5rem',marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:'2rem',flexWrap:'wrap'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'4rem',fontWeight:800,lineHeight:1,color:wqi.category?C[wqi.category]:'#94a3b8'}}>{wqi.WQI!==null?wqi.WQI.toFixed(1):'—'}</div>
          <div style={{fontSize:'0.875rem',fontWeight:700,color:wqi.category?C[wqi.category]:'#94a3b8',marginTop:4}}>{wqi.category??'Insufficient data'}</div>
          <div style={{fontSize:'0.7rem',color:'#94a3b8',marginTop:2}}>CCME WQI (0–100)</div>
        </div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.625rem',marginBottom:'0.75rem'}}>
            {[['F1 Scope',wqi.F1_scope],['F2 Freq.',wqi.F2_frequency],['F3 Amp.',wqi.F3_amplitude]].map(([l,v])=>(
              <div key={l as string} style={{background:'#f8faf8',borderRadius:8,padding:'0.5rem',textAlign:'center'}}>
                <div style={{fontSize:'1.1rem',fontWeight:700,color:'#1a2e1b'}}>{v!==null?(v as number).toFixed(1):'—'}</div>
                <div style={{fontSize:'0.68rem',color:'#64748b'}}>{l}</div>
              </div>
            ))}
          </div>
          <p style={{fontSize:'0.75rem',color:'#475569',lineHeight:1.6}}>{wqi.explanation}</p>
        </div>
      </div>

      {[{param:'pH',val:ph,min:6.5,max:8.5,unit:'pH'},{param:'Turbidity',val:turb,max:25,unit:'NTU'}].map(o=>{
        const fails = o.val!==null&&((o.min!==undefined&&o.val<o.min)||(o.max!==undefined&&o.val>o.max))
        return (
          <div key={o.param} className="card" style={{padding:'1rem',marginBottom:'0.625rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.5rem'}}>
            <div>
              <div style={{fontWeight:600,fontSize:'0.875rem'}}>{o.param}</div>
              <div style={{fontSize:'0.75rem',color:'#64748b'}}>Objective: {o.min!==undefined?`≥${o.min} `:''}{o.max!==undefined?`≤${o.max} `:''}{o.unit}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'1.5rem',fontWeight:700,color:o.val===null?'#94a3b8':fails?'#dc2626':'#16a34a'}}>{o.val!==null?`${o.val.toFixed(2)} ${o.unit}`:'—'}</div>
              <div style={{fontSize:'0.72rem',fontWeight:600,color:o.val===null?'#94a3b8':fails?'#dc2626':'#16a34a'}}>{o.val===null?'No data':fails?'FAILS':'Meets'}</div>
            </div>
          </div>
        )
      })}

      <div className="card" style={{padding:'0.875rem 1rem',marginTop:'1rem',background:'#fffbeb',border:'1px solid #fde68a'}}>
        <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
          <Info size={15} color="#d97706" style={{flexShrink:0,marginTop:2}}/>
          <p style={{fontSize:'0.78rem',color:'#78350f',lineHeight:1.7}}><b>LAS monitoring:</b> pH/turbidity/EC do not quantify LAS. Import lab results (HPLC, MBAS) via Reports. MBAS screens anionic surfactants generally — not LAS-specific.</p>
        </div>
      </div>
    </div>
  )
}
