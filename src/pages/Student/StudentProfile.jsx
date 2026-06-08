import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, Plus, Trash2, LogOut, Mail, Phone, Copy, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { C, F, S } from '../../styles/theme'

const MOCK_PASSKEYS=[{id:'pk1',name:'iPhone 14 Pro',addedAt:'Today'},{id:'pk2',name:'MacBook Air M2',addedAt:'3 days ago'}]

function CopyBadge({value}){
  const [copied,setCopied]=useState(false)
  const copy=()=>{navigator.clipboard.writeText(value);setCopied(true);setTimeout(()=>setCopied(false),1500)}
  return(<button onClick={copy} style={{display:'inline-flex',alignItems:'center',gap:5,background:C.orangePale,color:C.orange,border:'none',borderRadius:8,padding:'4px 10px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'monospace'}}>{value}{copied?<Check size={11}/>:<Copy size={11}/>}</button>)
}

export default function StudentProfile({ profile }) {
  const {logout}=useAuth(); const navigate=useNavigate()
  const [phone,setPhone]=useState(profile.phone??''); const [editPhone,setEditPhone]=useState(false)
  const initials=`${profile.firstName?.[0]??''}${profile.surname?.[0]??''}`.toUpperCase()
  const handleLogout=async()=>{await logout();navigate('/')}
  return(
    <div style={{padding:20}}>
      <div style={{textAlign:'center',marginBottom:20}}>
        <div style={{width:72,height:72,borderRadius:'50%',background:`linear-gradient(135deg,${C.orange},${C.orangeDeep})`,display:'grid',placeItems:'center',margin:'0 auto 12px',boxShadow:`0 6px 20px ${C.orangeBorder}`}}><span style={{color:'#fff',fontWeight:800,fontSize:26,fontFamily:F.display}}>{initials}</span></div>
        <h2 style={{margin:'0 0 8px',fontFamily:F.display,fontSize:19,fontWeight:700,color:C.text}}>{profile.firstName} {profile.middleName?`${profile.middleName} `:''}{profile.surname}</h2>
        <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}><CopyBadge value={profile.systemId}/><CopyBadge value={profile.rollNumber}/></div>
      </div>
      <div style={{background:C.surface,borderRadius:16,overflow:'hidden',boxShadow:S.card,marginBottom:14}}>
        <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:12,borderBottom:`1px solid ${C.border}`}}><Mail size={16} color={C.faint}/><span style={{fontSize:14,color:C.text}}>{profile.email}</span></div>
        <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
          <Phone size={16} color={C.faint}/>
          {editPhone?(<div style={{display:'flex',gap:8,flex:1}}><input className="input-field" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" style={{padding:'8px 12px',fontSize:13}}/><button className="btn-primary" style={{padding:'8px 14px',fontSize:13}} onClick={()=>setEditPhone(false)}>Save</button></div>):(<><span style={{flex:1,fontSize:14,color:phone?C.text:C.faint}}>{phone||'Add phone number'}</span><button onClick={()=>setEditPhone(true)} style={{background:'none',border:'none',fontSize:12,color:C.orange,cursor:'pointer',fontWeight:600}}>{phone?'Edit':'Add'}</button></>)}
        </div>
      </div>
      <div style={{background:C.surface,borderRadius:16,overflow:'hidden',boxShadow:S.card,marginBottom:14}}>
        <div style={{padding:'14px 18px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}><Fingerprint size={16} color={C.orange}/><span style={{fontFamily:F.display,fontSize:14,fontWeight:700,color:C.text}}>Passkeys</span></div>
          <button style={{display:'flex',alignItems:'center',gap:4,background:'none',border:'none',color:C.orange,fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:F.body}}><Plus size={14}/> Add</button>
        </div>
        {MOCK_PASSKEYS.map((pk,i)=>(<div key={pk.id} style={{padding:'12px 18px',display:'flex',alignItems:'center',gap:12,borderBottom:i<MOCK_PASSKEYS.length-1?`1px solid ${C.border}`:'none'}}>
          <div style={{width:34,height:34,borderRadius:10,background:C.orangePale,display:'grid',placeItems:'center',flexShrink:0}}><Fingerprint size={16} color={C.orange}/></div>
          <div style={{flex:1}}><div style={{fontSize:13.5,fontWeight:600,color:C.text}}>{pk.name}</div><div style={{fontSize:12,color:C.faint}}>Added {pk.addedAt}</div></div>
          <button style={{background:'none',border:'none',cursor:'pointer',color:C.faint,lineHeight:0}}><Trash2 size={15}/></button>
        </div>))}
      </div>
      <button style={{width:'100%',padding:13,background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,fontSize:14,fontWeight:600,color:C.text,cursor:'pointer',fontFamily:F.body,marginBottom:10}}>Change Password</button>
      <button onClick={handleLogout} style={{width:'100%',padding:13,background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:14,fontSize:14,fontWeight:600,color:C.red,cursor:'pointer',fontFamily:F.body,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><LogOut size={15}/> Log Out</button>
    </div>
  )
}