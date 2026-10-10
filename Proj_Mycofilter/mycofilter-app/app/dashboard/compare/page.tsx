'use client'
import { useApp } from '@/components/AppContext'
import { calculateReduction, calculatePHShift, calculateEC, calculateTDS, TDS_K_PROVISIONAL } from '@/lib/calculations'
import type { ECCalibrationProfile } from '@/lib/types'
import { AlertTriangle } from 'lucide-react'

const EC_PROF: ECCalibrationProfile = {
  id:'demo',device_id:'MF-001-DEMO',sensor_id:'S3',created_at:new Date().toISOString(),
  cell_constant_per_cm:1,alpha_per_degC:0.021,solution_uS_cm:1413,
  temperature_c_at_cal:25,compensation_applied_by_probe:false,
}

function Row({label,inf,eff,unit,note}:{label:string,inf:number|null,eff:number|null,unit:string,note?:string}) {
  const isPH = unit==='pH'
  const res  = isPH ? calculatePHShift(inf,eff) : calculateReduction(inf,eff,label)
  const shift = isPH ? (res as ReturnType<typeof calculatePHShift>).shift : null
  const pct   = !isPH ? (res as ReturnType<typeof calculateReduction>).reduction_percent : null
  const fmt=(v:number|null)=>v===null?'—':unit==='pH'?v.toFixed(2):v.toFixed(1)
  return (
    <div className="card" style={{padding:'0.875rem 1rem',display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1.2fr',gap:'0.5rem',alignItems:'center'}}>
      <b style={{fontSize:'0.875rem'}}>{label}</b>
      <span style={{fontFamily:'monospace',color:'#3b82f6',fontWeight:700}}>{fmt(inf)} <small style={{fontWeight:400,color:'#94a3b8'}}>{unit}</small></span>
      <span style={{fontFamily:'monospace',color:'#22c55e',fontWeight:700}}>{fmt(eff)} <small style={{fontWeight:400,color:'#94a3b8'}}>{unit}</small></span>
      <div>
        {isPH
          ? <b style={{color:shift===null?'#94a3b8':'#d97706'}}>{shift===null?'—':`Δ${shift>0?'+':''}${shift.toFixed(2)}`}</b>
          : <b style={{color:pct===null?'#94a3b8':pct>0?'#16a34a':'#dc2626'}}>{pct===null?'—':`${pct.toFixed(1)}%`}</b>}
        {note&&<p style={{fontSize:'0.65rem',color:'#94a3b8',marginTop:2}}>{note}</p>}
      </div>
    </div>
  )
}

export default function ComparePage() {
  const { latestReadings, isDemo } = useApp()
  const r = latestReadings
  const inT=r['T_in']?.calibrated_value??null, outT=r['E5']?.calibrated_value??null
  const inEC=r['S3']?.calibrated_value??null,  outEC=r['E3']?.calibrated_value??null
  const inECr=calculateEC(inEC,inT,EC_PROF), outECr=calculateEC(outEC,outT,EC_PROF)
  const inTDS=calculateTDS(inECr), outTDS=calculateTDS(outECr)

  return (
    <div>
      <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'#1a2e1b',marginBottom:4}}>Influent vs Effluent</h1>
      <p style={{fontSize:'0.82rem',color:'#64748b',marginBottom:'1.25rem'}}>Side-by-side matched pairs · pH shown as shift (Δ), not removal %</p>
      {isDemo&&<div style={{background:'#f5f3ff',border:'1px solid #c4b5fd',borderRadius:8,padding:'0.625rem 1rem',marginBottom:'1rem',fontSize:'0.8rem',color:'#6d28d9',fontWeight:600}}>⚠ Simulated data</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1.2fr',gap:'0.5rem',padding:'0 1rem',marginBottom:'0.375rem'}}>
        {['Parameter','Influent','Effluent','Change'].map(h=><span key={h} style={{fontSize:'0.7rem',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</span>)}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginBottom:'1.25rem'}}>
        <Row label="pH" inf={r['S1']?.calibrated_value??null} eff={r['E1']?.calibrated_value??null} unit="pH" note="Shift not removal %" />
        <Row label="Turbidity" inf={r['S2']?.calibrated_value??null} eff={r['E2']?.calibrated_value??null} unit="NTU" note="Simulated only" />
        <Row label="EC" inf={inEC} eff={outEC} unit="µS/cm" note="Not a proxy for LAS" />
        <Row label="Temperature" inf={inT} eff={outT} unit="°C" />
        <Row label="Est. TDS" inf={inTDS.TDS_est_mg_L} eff={outTDS.TDS_est_mg_L} unit="mg/L" note={`k=${TDS_K_PROVISIONAL} provisional`} />
      </div>
      <div className="card" style={{padding:'0.875rem 1rem',background:'#fff7ed',border:'1px solid #fed7aa'}}>
        <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
          <AlertTriangle size={15} color="#ea580c" style={{flexShrink:0,marginTop:2}}/>
          <p style={{fontSize:'0.78rem',color:'#7c2d12',lineHeight:1.7}}>
            <b>Scientific limits:</b> These are simulated illustrations only. LAS is not measured by these sensors — use HPLC or MBAS screening. Do not report these as certified treatment removal rates.
          </p>
        </div>
      </div>
    </div>
  )
}
