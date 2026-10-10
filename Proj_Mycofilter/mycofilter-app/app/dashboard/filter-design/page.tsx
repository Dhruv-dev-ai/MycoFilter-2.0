'use client'
import FilterVisualization from '@/components/FilterVisualization'

export default function FilterDesignPage() {
  return (
    <div>
      <h1 style={{fontSize:'1.5rem',fontWeight:700,color:'#1a2e1b',marginBottom:4}}>Filter Design — Rev B</h1>
      <p style={{fontSize:'0.82rem',color:'#64748b',marginBottom:'1.5rem'}}>Preliminary CAD configuration · Click each layer for details · Not a commissioned or certified system</p>
      <FilterVisualization />
    </div>
  )
}
