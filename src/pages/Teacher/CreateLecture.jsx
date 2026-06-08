import { useState } from 'react'
import { MapPin, RefreshCw, Users, X } from 'lucide-react'
import { C, F, S } from '../../styles/theme'
import QRVisual from '../Landing/QRVisual'

const MOCK_SUBJECTS=['Data Structures','Algorithms']
const DEFAULT={subject:'',name:'',date:'',startTime:'',endTime:'',radius:50}

export default function CreateLecture({ profile }) {
  const [form,setForm]=useState(DEFAULT); const [session,setSession]=useState(null)
  const [seconds,setSeconds]=useState(30)
  const upd=(k,v)=>setForm(p=>({...p,[k]:v}))
  const generate=()=>{
    if(!form.subject||!form.name||!form.startTime||!form.endTime)return
    setSession({...form,id:`LEC-${Date.now()}`})
    const t=setInterval(()=>setSeconds(s=>s<=1?30:s-1),1000)
    return()=>clearInterval(t)
  }
  const endSession=()=>{setSession(null);setForm(DEFAULT);setSeconds(30)}

  if(session) return(
    <div style={{padding:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><div style={{fontSize:11,color:C.muted,marginBottom:2}}>LIVE SESSION</div><h2 style={{margin:0,fontFamily:F.display,fontSize:17,fontWeight:700,color:C.text}}>{session.subject}</h2><p style={{margin:0,fontSize:13,color:C.muted}}>{session.name}</p></div>
        <div style={{width:10,height:10,borderRadius:'50%',background:C.green,boxShadow:`0 0 0 4px ${C.greenPale}`}}/>
      </div>
      <div style={{background:C.surface,borderRadius:20,padding:24,boxShadow:S.card,textAlign:'center',marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{textAlign:'left'}}><div style={{fontFamily:F.display,fontWeight:700,color:C.text,fontSize:14}}>Scan to mark attendance</div><div style={{fontSize:11,color:C.faint}}>{session.startTime} – {session.endTime}</div></div>
          <div style={{background:seconds<=5?'#FEE2E2':C.orangePale,color:seconds<=5?C.red:C.orange,fontSize:12,fontWeight:700,borderRadius:8,padding:'5px 10px',display:'flex',alignItems:'center',gap:4,transition:'background .3s'}}><RefreshCw size={11}/> {seconds}s</div>
        </div>
        <QRVisual/><p style={{margin:'12px 0 0',fontSize:11,color:C.faint}}>Token refreshes every 30 seconds</p>
      </div>
      <div style={{background:C.surface,borderRadius:16,padding:'16px 20px',boxShadow:S.card,display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
        <div style={{width:42,height:42,borderRadius:12,background:C.greenPale,display:'grid',placeItems:'center',flexShrink:0}}><Users size={20} color={C.green}/></div>
        <div><div style={{fontFamily:F.display,fontSize:22,fontWeight:800,color:C.text}}>0</div><div style={{fontSize:12,color:C.muted}}>students marked present</div></div>
      </div>
      <button onClick={endSession} style={{width:'100%',padding:14,background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:14,fontSize:14,fontWeight:600,color:C.red,cursor:'pointer',fontFamily:F.body,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><X size={15}/> End Session</button>
    </div>
  )

  return(
    <div style={{padding:20}}>
      <h2 style={{margin:'0 0 18px',fontFamily:F.display,fontSize:18,fontWeight:700,color:C.text}}>New Lecture</h2>
      <div style={{background:C.surface,borderRadius:18,padding:20,boxShadow:S.card}}>
        <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:500,color:C.secondary,display:'block',marginBottom:6}}>Subject *</label><select className="select-field" value={form.subject} onChange={e=>upd('subject',e.target.value)}><option value="">Select subject</option>{MOCK_SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:500,color:C.secondary,display:'block',marginBottom:6}}>Lecture Name *</label><input className="input-field" placeholder="e.g. Lecture 04 — Binary Trees" value={form.name} onChange={e=>upd('name',e.target.value)}/></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,fontWeight:500,color:C.secondary,display:'block',marginBottom:6}}>Date *</label><input className="input-field" type="date" value={form.date} onChange={e=>upd('date',e.target.value)}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <div><label style={{fontSize:13,fontWeight:500,color:C.secondary,display:'block',marginBottom:6}}>Start Time *</label><input className="input-field" type="time" value={form.startTime} onChange={e=>upd('startTime',e.target.value)}/></div>
          <div><label style={{fontSize:13,fontWeight:500,color:C.secondary,display:'block',marginBottom:6}}>End Time *</label><input className="input-field" type="time" value={form.endTime} onChange={e=>upd('endTime',e.target.value)}/></div>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:13,fontWeight:500,color:C.secondary,display:'block',marginBottom:6}}>Attendance Radius * <span style={{fontWeight:400,color:C.faint}}>— students must be within this distance</span></label>
          <div style={{display:'flex',gap:10,alignItems:'center'}}><input type="range" min={10} max={200} step={5} value={form.radius} onChange={e=>upd('radius',Number(e.target.value))} style={{flex:1}}/><span style={{minWidth:52,textAlign:'right',fontFamily:F.display,fontWeight:700,color:C.orange,fontSize:15}}>{form.radius}m</span></div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8,fontSize:12,color:C.muted}}><MapPin size={12}/> Location captured when you generate QR</div>
        </div>
        <button className="btn-primary" onClick={generate} style={{width:'100%',justifyContent:'center'}}>Generate QR Code</button>
      </div>
    </div>
  )
}