'use client'
import { useState } from 'react'
import { phLinearCalibration, nernstSlopeMvPerPH, NERNST_SLOPE_25C_MV } from '@/lib/calculations'

export default function CalibrationPage() {
  const [f, setF] = useState({pH1:'4.00',V1:'200',pH2:'7.00',V2:'23',temp:'25'})
  const s=(k:string)=>(e:React.ChangeEvent<HTMLInputElement>)=>setF(p=>({...p,[k]:e.target.value}))
  const cal = phLinearCalibration(+f.pH1,+f.V1,+f.pH2,+f.V2)
  const th  = nernstSlopeMvPerPH(+f.temp)
  const dev = cal.slope_mV_per_pH ? ((Math.abs(cal.slope_mV_per_pH)-NERNST_SLOPE_25C_MV)/NERNST_SLOPE_25C_MV)*100 : null
  const ok  = dev!==null && Math.abs(dev)<10

  return (
    <div>
      <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'#1a2e1b',marginBottom:4}}>Sensor Calibration</h1>
      <p style={{fontSize:'0.82rem',color:'#64748b',marginBottom:'1.5rem'}}>Two-point pH calibration calculator</p>

      <div className="card" style={{padding:'1.5rem',maxWidth:540,marginBottom:'1.5rem'}}>
        <h2 style={{fontWeight:700,fontSize:'1rem',color:'#1a2e1b',marginBottom:'1rem'}}>pH Probe — Two-Point Linear</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
          {[['Buffer pH 1','pH1'],['Voltage P1 (mV)','V1'],['Buffer pH 2','pH2'],['Voltage P2 (mV)','V2'],['Temperature (°C)','temp']].map(([l,k])=>(
            <div key={k}><label style={{fontSize:'0.78rem',fontWeight:500,display:'block',marginBottom:4}}>{l}</label>
              <input type="number" value={(f as Record<string,string>)[k]} onChange={s(k)} className="input-field" step="0.01"/></div>
          ))}
        </div>
        <div style={{background:'#f8faf8',borderRadius:8,padding:'1rem'}}>
          {cal.error
            ? <p style={{color:'#dc2626',fontSize:'0.85rem'}}>⚠ {cal.error}</p>
            : <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.625rem',marginBottom:'0.75rem'}}>
                  {[['Slope',`${(cal.slope_mV_per_pH||0).toFixed(2)} mV/pH`],['Offset',`${(cal.offset_mV||0).toFixed(2)} mV`],[`Theoretical (${f.temp}°C)`,`${th.toFixed(2)} mV/pH`],['Deviation',dev!==null?`${dev.toFixed(1)}%`:'—']].map(([l,v])=>(
                    <div key={l as string}><div style={{fontSize:'0.7rem',color:'#64748b'}}>{l}</div><div style={{fontWeight:700,fontSize:'1rem',color:'#1a2e1b'}}>{v}</div></div>
                  ))}
                </div>
                <div style={{padding:'0.625rem',borderRadius:6,background:ok?'#dcfce7':'#fef3c7',border:`1px solid ${ok?'#bbf7d0':'#fde68a'}`}}>
                  <p style={{fontSize:'0.8rem',fontWeight:600,color:ok?'#15803d':'#92400e'}}>
                    {ok?'✓ Slope within ±10% of Nernst — acceptable':'⚠ Slope deviates >10% from Nernst — check electrode'}
                  </p>
                </div>
              </>
          }
        </div>
        <p style={{fontSize:'0.7rem',color:'#94a3b8',marginTop:'0.75rem',lineHeight:1.6}}>Nernst ideal at 25°C: ±59.16 mV/pH. This calculator does not write to hardware — record results in maintenance log.</p>
      </div>

      <div className="card" style={{padding:'0.875rem 1rem',background:'#fffbeb',border:'1px solid #fde68a'}}>
        <p style={{fontSize:'0.78rem',color:'#92400e',lineHeight:1.7}}><b>EC, turbidity, temperature calibration</b> must follow probe-specific procedures. Use certified standards. Document date, standards, and coefficients in the maintenance log.</p>
      </div>
    </div>
  )
}
