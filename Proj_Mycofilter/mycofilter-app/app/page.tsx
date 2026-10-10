'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MyceliumBackground from '@/components/MyceliumBackground'
import { Leaf, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [filterId, setFilterId] = useState('')
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErr('')
    const normalizedFilterId = filterId.trim().toUpperCase()
    if (normalizedFilterId === 'DEMO' || normalizedFilterId === 'MF-001-DEMO') {
      router.push('/dashboard'); return
    }
    setErr('Filter not found. Enter MF-001-DEMO to access the simulated filter.')
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0c1d0d', position:'relative' }}>
      <MyceliumBackground intensity={0.6} />
      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:400, margin:'0 1rem' }}>
        <div style={{ background:'rgba(255,255,255,0.96)', borderRadius:'1.5rem', padding:'2.5rem', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ width:56, height:56, background:'linear-gradient(135deg,#3d7d3f,#0bbdb6)', borderRadius:'1rem', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
              <Leaf size={28} color="white" />
            </div>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1a2e1b' }}>MycoFilter 2.0</h1>
            <p style={{ fontSize:'0.82rem', color:'#64748b', marginTop:4 }}>Biohybrid Water-Treatment Monitoring</p>
          </div>
          <form onSubmit={login}>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={{ fontSize:'0.82rem', fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Filter ID</label>
              <input type="text" value={filterId} onChange={e=>setFilterId(e.target.value)} className="input-field" placeholder="e.g. MF-001-DEMO" autoFocus />
            </div>
            {err && (
              <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'0.625rem 0.875rem', marginBottom:'1rem', display:'flex', gap:8, alignItems:'flex-start' }}>
                <AlertTriangle size={15} color="#dc2626" style={{ flexShrink:0, marginTop:1 }} />
                <p style={{ fontSize:'0.78rem', color:'#991b1b' }}>{err}</p>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%', marginBottom:'0.75rem' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <button type="button" onClick={()=>router.push('/dashboard')} className="btn-secondary" style={{ width:'100%', fontSize:'0.875rem' }}>
              Enter Demo Mode
            </button>
          </form>
          <p style={{ fontSize:'0.72rem', color:'#94a3b8', textAlign:'center', marginTop:'1.25rem', lineHeight:1.6 }}>
            Demo Filter ID: <code style={{ background:'#f1f5f9', padding:'0 4px', borderRadius:3 }}>MF-001-DEMO</code><br/>
            Demo displays simulated data only — not connected to hardware.
          </p>
        </div>
      </div>
    </div>
  )
}
