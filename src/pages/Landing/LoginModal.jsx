import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import Logo       from '../../components/ui/Logo'
import Divider    from '../../components/ui/Divider'
import GoogleIcon from '../../components/ui/GoogleIcon'
import { useAuth } from '../../contexts/AuthContext'

const ERRORS = {
  'auth/user-not-found':'No account found with this email.',
  'auth/wrong-password':'Incorrect password.',
  'auth/invalid-email':'Enter a valid email address.',
  'auth/invalid-credential':'Wrong email or password.',
  'auth/too-many-requests':'Too many attempts. Try again later.',
  'auth/popup-closed-by-user':'Sign-in was cancelled.',
}
const friendly = c => ERRORS[c] || 'Something went wrong. Please try again.'
const ROUTE = { student:'/student', teacher:'/teacher', admin:'/admin' }

export default function LoginModal({ onClose, onSignup }) {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email,setEmail]=useState(''); const [pw,setPw]=useState('')
  const [showPw,setShowPw]=useState(false); const [role,setRole]=useState('student')
  const [loading,setLoading]=useState(false); const [error,setError]=useState('')

  const redirect = p => {
    if (!p) { setError('Account not set up. Contact your admin.'); return }
    const r = ROUTE[p.role]
    if (r) navigate(r); else setError('Unknown role. Contact your administrator.')
  }
  const go = async fn => {
    setLoading(true); setError('')
    try { redirect(await fn()) } catch(e){ setError(friendly(e.code)) } finally { setLoading(false) }
  }

  return (
    <div style={{padding:32}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:28}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:7}}>
            <Logo size={28}/><span style={{fontFamily:'Bricolage Grotesque,sans-serif',fontWeight:700,fontSize:15}}>Attendify</span>
          </div>
          <h2 style={{fontFamily:'Bricolage Grotesque,sans-serif',fontSize:23,fontWeight:800,color:'#1C1917',margin:'0 0 4px'}}>Welcome back</h2>
          <p style={{color:'#78716C',fontSize:13,margin:0}}>Sign in to continue</p>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#A8A29E',lineHeight:0,padding:4}}><X size={20}/></button>
      </div>

      <div style={{display:'flex',background:'#F5F5F4',borderRadius:12,padding:4,marginBottom:24,gap:4}}>
        {['student','teacher','admin'].map(r=>(
          <button key={r} onClick={()=>setRole(r)} style={{flex:1,padding:'8px 0',border:'none',borderRadius:9,cursor:'pointer',textTransform:'capitalize',fontFamily:'DM Sans,sans-serif',background:role===r?'#fff':'transparent',color:role===r?'#1C1917':'#78716C',fontWeight:role===r?600:400,fontSize:13,boxShadow:role===r?'0 1px 4px rgba(0,0,0,.1)':'none',transition:'all .2s'}}>{r}</button>
        ))}
      </div>

      <button className="google-btn" onClick={()=>go(loginWithGoogle)} disabled={loading} style={{marginBottom:14,opacity:loading?.7:1}}>
        <GoogleIcon/> Continue with Google
      </button>
      <Divider/>

      <div style={{marginBottom:12}}>
        <label style={{fontSize:13,fontWeight:500,color:'#57534E',display:'block',marginBottom:6}}>Email address</label>
        <input className="input-field" type="email" placeholder="you@college.edu" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go(()=>login(email,pw))}/>
      </div>
      <div style={{marginBottom:8}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
          <label style={{fontSize:13,fontWeight:500,color:'#57534E'}}>Password</label>
          <button style={{background:'none',border:'none',fontSize:12,color:'#F97316',cursor:'pointer',fontFamily:'DM Sans,sans-serif',padding:0}}>Forgot?</button>
        </div>
        <div style={{position:'relative'}}>
          <input className="input-field" type={showPw?'text':'password'} placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)} style={{paddingRight:44}} onKeyDown={e=>e.key==='Enter'&&go(()=>login(email,pw))}/>
          <button onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#A8A29E',lineHeight:0}}>
            {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
          </button>
        </div>
      </div>

      {error&&<div style={{marginTop:10,padding:'10px 14px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626'}}>{error}</div>}

      <button className="btn-primary" onClick={()=>go(()=>login(email,pw))} disabled={loading} style={{width:'100%',justifyContent:'center',marginTop:20,marginBottom:16}}>
        {loading?<Loader2 size={16} className="animate-spin"/>:<><span>Sign In</span><ArrowRight size={15}/></>}
      </button>
      <p style={{textAlign:'center',fontSize:13,color:'#78716C'}}>
        Don't have an account?{' '}
        <button onClick={onSignup} style={{background:'none',border:'none',color:'#F97316',fontWeight:600,cursor:'pointer',fontSize:13,fontFamily:'DM Sans,sans-serif'}}>Create one</button>
      </p>
    </div>
  )
}