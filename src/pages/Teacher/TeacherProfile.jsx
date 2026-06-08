import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, BookOpen, LogOut, Info } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { C, F, S } from '../../styles/theme'

export default function TeacherProfile({ profile }) {
  const {logout}=useAuth(); const navigate=useNavigate()
  const [phone,setPhone]=useState(profile.phone??''); const [editPhone,setEdit]=useState(false)
  const initials=`${profile.firstName?.[0]??''}${profile.surname?.[0]??''}`.toUpperCase()
  const handleLogout=async()=>{await logout();navigate('/')}
  return(
    <div style={{padding:20}}>
      <div style={{textAlign:'center',marginBottom:20}}>
        <div style={{width:72,height:72,borderRadius:'50%',background:`linear-gradient(135deg,${C.orange},${C.orangeDeep})`,display:'grid',placeItems:'center',margin:'0 auto 12px',boxShadow:`0 6px 20px ${C.orangeBorder}`}}><span style={{color:'#fff',fontWeight:800,fontSize:26,fontFamily:F.display}}>{initials}</span></div>
        <h2 style={{margin:'0 0 4px',fontFamily:F.display,fontSize:19,fontWeight:700,color:C.text}}>{profile.firstName} {profile.surname}</h2>
        <span style={{fontSize:13,fontWeight:600,background:C.orangePale,color:C.orange,borderRadius:8,padding:'3px 10px'}}>{profile.systemId}</span>
      </div>
      <div style={{background:C.surface,borderRadius:16,overflow:'hidden',boxShadow:S.card,marginBottom:14}}>
        <div style={{padding:'12px 18px',background:'#FAFAF9',borderBottom:`1px solid ${C.border}`}}><div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:600,color:C.faint,textTransform:'uppercase',letterSpacing:'0.5px'}}><BookOpen size={12}/> Assigned Subjects</div></div>
        {(profile.subjects??['Data Structures','Algorithms']).map((s,i,arr)=>(<div key={s} style={{padding:'12px 18px',fontSize:14,color:C.text,borderBottom:i<arr.length-1?`1px solid ${C.border}`:'none'}}>{s}</div>))}
        <div style={{padding:'10px 18px',background:'#FAFAF9',display:'flex',gap:7,alignItems:'center'}}><Info size={12} color={C.faint}/><span style={{fontSize:11.5,color:C.faint}}>Name, ID, and subjects can only be changed by an Admin</span></div>
      </div>
      <div style={{background:C.surface,borderRadius:16,overflow:'hidden',boxShadow:S.card,marginBottom:14}}>
        <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:12,borderBottom:`1px solid ${C.border}`}}><Mail size={16} color={C.faint}/><span style={{fontSize:14,color:C.text}}>{profile.email}</span></div>
        <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
          <Phone size={16} color={C.faint}/>
          {editPhone?(<div style={{display:'flex',gap:8,flex:1}}><input className="input-field" value={phone} onChange={e=>setPhone(e.target.value)} style={{padding:'8px 12px',fontSize:13}}/><button className="btn-primary" style={{padding:'8px 14px',fontSize:13}} onClick={()=>setEdit(false)}>Save</button></div>):(<><span style={{flex:1,fontSize:14,color:phone?C.text:C.faint}}>{phone||'Add phone number'}</span><button onClick={()=>setEdit(true)} style={{background:'none',border:'none',fontSize:12,color:C.orange,cursor:'pointer',fontWeight:600}}>{phone?'Edit':'Add'}</button></>)}
        </div>
      </div>
      <button onClick={handleLogout} style={{width:'100%',padding:13,background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:14,fontSize:14,fontWeight:600,color:C.red,cursor:'pointer',fontFamily:F.body,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><LogOut size={15}/> Log Out</button>
    </div>
  )
}