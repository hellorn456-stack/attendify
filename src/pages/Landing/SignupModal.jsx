import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eye, EyeOff, ChevronRight, Check, UserPlus, Fingerprint, Loader2 } from 'lucide-react'
import Logo       from '../../components/ui/Logo'
import Divider    from '../../components/ui/Divider'
import GoogleIcon from '../../components/ui/GoogleIcon'
import { useAuth } from '../../contexts/AuthContext'

const YEARS=['FE','SE','TE','BE']
const YEAR_LABELS={FE:'First Year',SE:'Second Year',TE:'Third Year',BE:'Final Year'}
const BRANCHES=['CSE','IT','AIDS','CE','EE','ME']
const BRANCH_LABELS={CSE:'Computer Science',IT:'Info. Technology',AIDS:'AI & Data Science',CE:'Civil',EE:'Electrical',ME:'Mechanical'}
const TITLES=[['Join Attendify',"Choose how you'd like to register"],['Personal details','Tell us about yourself'],['Academic details','Almost there']]

function Dots({step}){
  return(<div style={{display:'flex',gap:6,marginBottom:26}}>
    {[1,2,3].map(s=>(<div key={s} style={{height:7,borderRadius:4,width:s===step?28:7,background:s<step?'#22C55E':s===step?'#F97316':'#E7E5E4',transition:'all .3s cubic-bezier(.16,1,.3,1)'}}/>))}
  </div>)
}

export default function SignupModal({ onClose, onLogin }) {
  const { signupStudent, signupStudentWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [step,setStep]=useState(1); const [method,setMethod]=useState('')
  const [showPw,setShowPw]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState('')
  const [f,setF]=useState({firstName:'',middleName:'',surname:'',email:'',password:'',year:'',branch:'',roll:''})
  const upd=(k,v)=>setF(p=>({...p,[k]:v}))
  const previewRoll=f.year&&f.branch&&f.roll?`${f.year}-${f.branch}${String(f.roll).padStart(3,'0')}`:null

  const handleCreate=async()=>{
    if(!f.year||!f.branch||!f.roll){setError('Please fill in all academic fields.');return}
    setLoading(true);setError('')
    try{
      if(method==='google')await signupStudentWithGoogle({...f})
      else await signupStudent({...f})
      navigate('/student')
    }catch(e){setError(e.message||'Registration failed.')}
    finally{setLoading(false)}
  }

  const hdr=(title,sub)=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22}}>
      <div>
        <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:7}}>
          <Logo size={28}/><span style={{fontFamily:'Bricolage Grotesque,sans-serif',fontWeight:700,fontSize:15}}>Attendify</span>
        </div>
        <h2 style={{fontFamily:'Bricolage Grotesque,sans-serif',fontSize:22,fontWeight:800,color:'#1C1917',margin:'0 0 3px'}}>{title}</h2>
        <p style={{color:'#78716C',fontSize:13,margin:0}}>{sub}</p>
      </div>
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#A8A29E',lineHeight:0,padding:4}}><X size={20}/></button>
    </div>
  )

  return(
    <div style={{padding:32}}>
      {hdr(TITLES[step-1][0],TITLES[step-1][1])}
      <Dots step={step}/>

      {step===1&&(
        <div>
          <button className="google-btn" onClick={()=>{setMethod('google');setStep(2)}} style={{marginBottom:12}}><GoogleIcon/> Sign up with Google</button>
          <Divider/>
          <button className="btn-outline" onClick={()=>{setMethod('email');setStep(2)}} style={{width:'100%',justifyContent:'center'}}><UserPlus size={15}/> Sign up with Email & Password</button>
          <p style={{textAlign:'center',fontSize:13,color:'#78716C',marginTop:22}}>Already registered?{' '}<button onClick={onLogin} style={{background:'none',border:'none',color:'#F97316',fontWeight:600,cursor:'pointer',fontSize:13,fontFamily:'DM Sans,sans-serif'}}>Log in</button></p>
        </div>
      )}

      {step===2&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            <div><label style={{fontSize:13,fontWeight:500,color:'#57534E',display:'block',marginBottom:6}}>First Name *</label><input className="input-field" placeholder="John" value={f.firstName} onChange={e=>upd('firstName',e.target.value)}/></div>
            <div><label style={{fontSize:13,fontWeight:500,color:'#57534E',display:'block',marginBottom:6}}>Middle Name <span style={{fontWeight:400,color:'#A8A29E'}}>(opt.)</span></label><input className="input-field" placeholder="—" value={f.middleName} onChange={e=>upd('middleName',e.target.value)}/></div>
          </div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:500,color:'#57534E',display:'block',marginBottom:6}}>Surname *</label><input className="input-field" placeholder="Doe" value={f.surname} onChange={e=>upd('surname',e.target.value)}/></div>
          {method==='email'&&<>
            <div style={{marginBottom:12}}><label style={{fontSize:13,fontWeight:500,color:'#57534E',display:'block',marginBottom:6}}>Email *</label><input className="input-field" type="email" placeholder="you@college.edu" value={f.email} onChange={e=>upd('email',e.target.value)}/></div>
            <div style={{marginBottom:12}}><label style={{fontSize:13,fontWeight:500,color:'#57534E',display:'block',marginBottom:6}}>Password *</label>
              <div style={{position:'relative'}}><input className="input-field" type={showPw?'text':'password'} placeholder="Min. 8 characters" value={f.password} onChange={e=>upd('password',e.target.value)} style={{paddingRight:44}}/>
                <button onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#A8A29E',lineHeight:0}}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </div>
          </>}
          <div style={{display:'flex',gap:10,marginTop:18}}>
            <button className="btn-ghost" style={{flexShrink:0,padding:'12px 18px'}} onClick={()=>setStep(1)}>Back</button>
            <button className="btn-primary" style={{flex:1,justifyContent:'center'}} onClick={()=>setStep(3)}>Continue <ChevronRight size={15}/></button>
          </div>
        </div>
      )}

      {step===3&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            <div><label style={{fontSize:13,fontWeight:500,color:'#57534E',display:'block',marginBottom:6}}>Academic Year *</label>
              <select className="select-field" value={f.year} onChange={e=>upd('year',e.target.value)}><option value="">Select year</option>{YEARS.map(y=><option key={y} value={y}>{y} — {YEAR_LABELS[y]}</option>)}</select>
            </div>
            <div><label style={{fontSize:13,fontWeight:500,color:'#57534E',display:'block',marginBottom:6}}>Branch *</label>
              <select className="select-field" value={f.branch} onChange={e=>upd('branch',e.target.value)}><option value="">Select branch</option>{BRANCHES.map(b=><option key={b} value={b}>{b} — {BRANCH_LABELS[b]}</option>)}</select>
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:13,fontWeight:500,color:'#57534E',display:'block',marginBottom:6}}>Roll Number * <span style={{fontWeight:400,color:'#A8A29E',fontSize:12}}>(1–300)</span></label>
            <input className="input-field" type="number" placeholder="e.g. 29" min={1} max={300} value={f.roll} onChange={e=>upd('roll',e.target.value)}/>
            {previewRoll&&<div style={{marginTop:8,padding:'10px 14px',background:'#FFF7ED',borderRadius:10,border:'1px solid #FED7AA',fontSize:13,color:'#92400E',display:'flex',alignItems:'center',gap:8}}>Your roll number: <code style={{fontWeight:700}}>{previewRoll}</code></div>}
          </div>
          <div style={{padding:'12px 16px',background:'#F0FDF4',borderRadius:12,border:'1px solid #BBF7D0',marginBottom:16,display:'flex',gap:10,alignItems:'flex-start'}}>
            <Fingerprint size={15} color="#15803D" style={{marginTop:1,flexShrink:0}}/>
            <p style={{margin:0,fontSize:12.5,color:'#15803D',lineHeight:1.55}}>After registration you'll set up a <strong>WebAuthn passkey</strong> — required to mark attendance.</p>
          </div>
          {error&&<div style={{padding:'10px 14px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',marginBottom:14}}>{error}</div>}
          <div style={{display:'flex',gap:10}}>
            <button className="btn-ghost" style={{flexShrink:0,padding:'12px 18px'}} onClick={()=>setStep(2)} disabled={loading}>Back</button>
            <button className="btn-primary" style={{flex:1,justifyContent:'center'}} onClick={handleCreate} disabled={loading}>
              {loading?<Loader2 size={16} className="animate-spin"/>:<><Check size={15}/> Create Account</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}