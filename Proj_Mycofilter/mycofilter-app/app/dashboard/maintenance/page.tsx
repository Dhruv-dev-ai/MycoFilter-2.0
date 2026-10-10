'use client'
import { useState } from 'react'
import { DEMO_MAINTENANCE } from '@/lib/demo-data'
import type { MaintenanceEvent } from '@/lib/types'
import { Wrench, Plus, Calendar } from 'lucide-react'

const CL: Record<string,string> = {
  mycelium_media:'Mycelium Media',biochar_media:'Biochar Media',support_media:'Support Media',
  separator_plates:'Separator Plates',probe_cleaning:'Probe Cleaning',probe_calibration:'Probe Calibration',
  housing_seals:'Housing Seals',cartridge_inspection:'Cartridge Inspection',effluent_cell:'Effluent Cell',general:'General'
}

export default function MaintenancePage() {
  const [evs, setEvs] = useState<MaintenanceEvent[]>(DEMO_MAINTENANCE)
  const [show, setShow] = useState(false)
  const [f, setF] = useState({component:'general',action:'',observation:'',performed_by:'',performed_at:new Date().toISOString().slice(0,16)})

  const save = () => {
    if (!f.action||!f.performed_by) return
    setEvs(p=>[{...f,id:`m-${Date.now()}`,device_id:'MF-001-DEMO',performed_at:new Date(f.performed_at).toISOString(),component:f.component as MaintenanceEvent['component']},...p])
    setShow(false)
    setF({component:'general',action:'',observation:'',performed_by:'',performed_at:new Date().toISOString().slice(0,16)})
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <div><h1 style={{fontSize:'1.5rem',fontWeight:700,color:'#1a2e1b'}}>Maintenance Log</h1>
          <p style={{fontSize:'0.82rem',color:'#64748b',marginTop:4}}>Filter health and servicing records</p></div>
        <button onClick={()=>setShow(s=>!s)} className="btn-primary" style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.875rem',padding:'0.625rem 1.25rem'}}><Plus size={15}/>Log Event</button>
      </div>

      {show&&(
        <div className="card" style={{padding:'1.25rem',marginBottom:'1.5rem',border:'2px solid #3d7d3f'}}>
          <h2 style={{fontWeight:700,fontSize:'1rem',marginBottom:'1rem',color:'#1a2e1b'}}>New Maintenance Event</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            {[['action','Action *'],['performed_by','Performed by *'],['observation','Observation']].map(([k,l])=>(
              <div key={k}><label style={{fontSize:'0.78rem',fontWeight:500,display:'block',marginBottom:4}}>{l}</label>
                <input value={(f as Record<string,string>)[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} className="input-field"/></div>
            ))}
            <div><label style={{fontSize:'0.78rem',fontWeight:500,display:'block',marginBottom:4}}>Date/Time</label>
              <input type="datetime-local" value={f.performed_at} onChange={e=>setF(p=>({...p,performed_at:e.target.value}))} className="input-field"/></div>
            <div><label style={{fontSize:'0.78rem',fontWeight:500,display:'block',marginBottom:4}}>Component</label>
              <select value={f.component} onChange={e=>setF(p=>({...p,component:e.target.value}))} className="input-field">
                {Object.entries(CL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <div style={{display:'flex',gap:'0.75rem',marginTop:'1rem'}}>
            <button onClick={save} className="btn-primary" style={{fontSize:'0.875rem'}}>Save</button>
            <button onClick={()=>setShow(false)} className="btn-secondary" style={{fontSize:'0.875rem'}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {[...evs].sort((a,b)=>new Date(b.performed_at).getTime()-new Date(a.performed_at).getTime()).map(ev=>(
          <div key={ev.id} className="card" style={{padding:'1rem',display:'flex',gap:'1rem',alignItems:'flex-start'}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:'#f0fdf4',border:'2px solid #bbf7d0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Wrench size={16} color="#16a34a"/></div>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'0.5rem'}}>
                <b style={{fontSize:'0.875rem',color:'#1a2e1b'}}>{ev.action}</b>
                <span style={{fontSize:'0.72rem',color:'#94a3b8',display:'flex',alignItems:'center',gap:4}}><Calendar size={12}/>{new Date(ev.performed_at).toLocaleDateString()}</span>
              </div>
              <div style={{fontSize:'0.75rem',color:'#64748b',marginTop:2}}>{CL[ev.component]} · {ev.performed_by}</div>
              {ev.observation&&<p style={{fontSize:'0.8rem',color:'#374151',marginTop:6,lineHeight:1.6}}>{ev.observation}</p>}
              {ev.next_inspection_at&&<div style={{fontSize:'0.72rem',color:'#0891b2',marginTop:4,fontWeight:500}}>Next: {new Date(ev.next_inspection_at).toLocaleDateString()}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
