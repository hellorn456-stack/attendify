import { useState } from 'react'
import { Download, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { C, F, S } from '../../styles/theme'

const MOCK=[
  {id:'l1',subject:'Data Structures',name:'Lecture 03 — Stacks',date:'Today',time:'10:00–11:00 AM',attended:38,total:42},
  {id:'l2',subject:'Data Structures',name:'Lecture 02 — Arrays',date:'Jun 4',time:'10:00–11:00 AM',attended:40,total:42},
  {id:'l3',subject:'Algorithms',name:'Lecture 06 — Sorting',date:'Jun 3',time:'02:00–03:00 PM',attended:35,total:40},
  {id:'l4',subject:'Data Structures',name:'Lecture 01 — Intro',date:'Jun 2',time:'10:00–11:00 AM',attended:41,total:42},
]
const pct=(a,t)=>Math.round((a/t)*100)
const color=(p)=>p>=80?'#16A34A':p>=60?'#F97316':'#DC2626'

export default function LectureHistory() {
  const [expanded,setExpanded]=useState(null)
  return(
    <div style={{padding:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h2 style={{margin:0,fontFamily:F.display,fontSize:18,fontWeight:700,color:C.text}}>Lecture History</h2>
        <span style={{fontSize:13,color:C.muted}}>{MOCK.length} lectures</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {MOCK.map(lec=>{const open=expanded===lec.id,p=pct(lec.attended,lec.total),c=color(p);return(
          <div key={lec.id} style={{background:C.surface,borderRadius:16,overflow:'hidden',boxShadow:S.card}}>
            <button onClick={()=>setExpanded(open?null:lec.id)} style={{width:'100%',padding:'16px 18px',background:'none',border:'none',cursor:'pointer',textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <span style={{fontSize:11,fontWeight:600,background:C.orangePale,color:C.orange,borderRadius:6,padding:'2px 8px'}}>{lec.subject}</span>
                <div style={{fontFamily:F.display,fontSize:14,fontWeight:700,color:C.text,margin:'6px 0 2px'}}>{lec.name}</div>
                <div style={{display:'flex',gap:8,fontSize:12,color:C.muted,marginBottom:10}}><span>{lec.date}</span><span>·</span><span><Clock size={11} style={{verticalAlign:'middle'}}/> {lec.time}</span></div>
                <div style={{fontSize:12,color:C.muted,marginBottom:5}}>{lec.attended} / {lec.total} students <strong style={{color:c}}>{p}%</strong></div>
                <div style={{height:6,background:'#F0EEE8',borderRadius:3,overflow:'hidden',width:200}}><div style={{height:'100%',width:`${p}%`,background:c,borderRadius:3}}/></div>
              </div>
              {open?<ChevronUp size={16} color={C.faint} style={{flexShrink:0,marginLeft:10}}/>:<ChevronDown size={16} color={C.faint} style={{flexShrink:0,marginLeft:10}}/>}
            </button>
            {open&&<div style={{padding:'0 18px 16px',borderTop:`1px solid ${C.border}`}}>
              <button style={{marginTop:14,display:'flex',alignItems:'center',gap:8,background:C.orangePale,border:`1px solid ${C.orangeBorder}`,borderRadius:10,padding:'9px 16px',fontSize:13,fontWeight:600,color:C.orange,cursor:'pointer',fontFamily:F.body}}><Download size={14}/> Export Attendance CSV</button>
            </div>}
          </div>
        )})}
      </div>
    </div>
  )
}