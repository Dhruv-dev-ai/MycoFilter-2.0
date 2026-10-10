'use client'
import { DEMO_SENSOR_CONFIGS, DEMO_DEVICE } from '@/lib/demo-data'
import { Info } from 'lucide-react'

const SL: Record<string,string> = {
  proposed_cad:'Proposed in Rev B CAD',selected_awaiting_install:'Selected — awaiting install',
  installed_uncalibrated:'Installed — uncalibrated',installed_calibrated:'Installed & calibrated',
  optional_unconfigured:'Optional — blanked',not_modelled:'Not modelled',
}
const SC: Record<string,string> = {
  proposed_cad:'#d97706',selected_awaiting_install:'#7c3aed',
  installed_uncalibrated:'#dc2626',installed_calibrated:'#16a34a',
  optional_unconfigured:'#94a3b8',not_modelled:'#94a3b8',
}

export default function SettingsPage() {
  return (
    <div>
      <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'#1a2e1b',marginBottom:4}}>Device Settings & Status</h1>
      <p style={{fontSize:'0.82rem',color:'#64748b',marginBottom:'1.5rem'}}>Configuration and commissioning status for {DEMO_DEVICE.id}</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'0.875rem',marginBottom:'1.5rem'}}>
        {[['Device ID',DEMO_DEVICE.id],['Name',DEMO_DEVICE.name],['Connectivity',DEMO_DEVICE.connectivity_method],['Interval',`${DEMO_DEVICE.reporting_interval_s}s`],['Firmware',DEMO_DEVICE.firmware_version??'—'],['Location',DEMO_DEVICE.location_description??'—']].map(([l,v])=>(
          <div key={l} className="card" style={{padding:'0.875rem 1rem'}}>
            <div style={{fontSize:'0.7rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{l}</div>
            <div style={{fontWeight:600,fontSize:'0.9rem',color:'#1a2e1b'}}>{v}</div>
          </div>
        ))}
      </div>

      <h2 style={{fontSize:'1rem',fontWeight:700,color:'#1a2e1b',marginBottom:'0.75rem'}}>Sensor Commissioning Status</h2>
      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginBottom:'1.5rem'}}>
        {DEMO_SENSOR_CONFIGS.map(cfg=>(
          <div key={cfg.tag} className="card" style={{padding:'0.875rem 1rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.5rem'}}>
            <div>
              <span style={{fontFamily:'monospace',fontWeight:700,fontSize:'0.85rem',color:'#1a2e1b'}}>{cfg.tag}</span>
              <span style={{marginLeft:10,fontSize:'0.82rem',color:'#374151'}}>{cfg.label}</span>
              {cfg.port&&<div style={{fontSize:'0.68rem',color:'#94a3b8',marginTop:2}}>{cfg.port}</div>}
            </div>
            <span style={{fontSize:'0.73rem',fontWeight:700,color:SC[cfg.commissioning_status],background:SC[cfg.commissioning_status]+'1a',padding:'3px 10px',borderRadius:999}}>
              {SL[cfg.commissioning_status]}
            </span>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:'1rem',background:'#fffbeb',border:'1px solid #fde68a'}}>
        <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
          <Info size={15} color="#d97706" style={{flexShrink:0,marginTop:2}}/>
          <p style={{fontSize:'0.78rem',color:'#78350f',lineHeight:1.7}}>
            <b>Open Rev B decisions:</b> Probe models undecided. Interface electronics (BOM 301, ≥8 isolated channels) undecided — one ADS1115 insufficient. LoRa gateway and data store not specified. Flowmeter and ISE optional, not installed. Dashboard switches from SIMULATED to LIVE once probes are selected, installed, calibrated, and firmware is commissioned.
          </p>
        </div>
      </div>
    </div>
  )
}
