import { useState } from 'react'
import { BookOpen, Clock } from 'lucide-react'
import { C, F, S } from '../../styles/theme'

const MOCK = [
  {id:'1',subject:'Data Structures',teacher:'Dr. R. Mehta',date:'Today',time:'10:00–11:00 AM',duration:'1 hr'},
  {id:'2',subject:'DBMS',teacher:'Prof. S. Kulkarni',date:'Yesterday',time:'11:00–12:00 PM',duration:'1 hr'},
  {id:'3',subject:'Operating Systems',teacher:'Dr. P. Joshi',date:'Jun 4',time:'09:00–10:00 AM',duration:'1 hr'},
  {id:'4',subject:'Data Structures',teacher:'Dr. R. Mehta',date:'Jun 4',time:'10:00–11:00 AM',duration:'1 hr'},
  {id:'5',subject:'Computer Networks',teacher:'Prof. A. Desai',date:'Jun 3',time:'02:00–03:00 PM',duration:'1 hr'},
]
const SUBJECTS = ['All',...new Set(MOCK.map(l=>l.subject))]
const COLORS = {'Data Structures':{bg:'#EEF2FF',text:'#4338CA'},'DBMS':{bg:'#FDF4FF',text:'#7E22CE'},'Operating Systems':{bg:'#FFF7ED',text:'#C2410C'},'Computer Networks':{bg:'#F0FDF4',text:'#15803D'}}

export default function MyLectures() {
  const [filter,setFilter]=useState('All')
  const shown=filter==='All'?MOCK:MOCK.filter(l=>l.subject===filter)
  return (
    <div style={{padding:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <h2 style={{margin:0,fontFamily:F.display,fontSize:18,fontWeight:700,color:C.text}}>My Lectures</h2>
        <span style={{fontSize:13,color:C.muted}}>{shown.length} lectures</span>
      </div>
      <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,marginBottom:16}}>
        {SUBJECTS.map(s=>(<button key={s} onClick={()=>setFilter(s)} style={{flexShrink:0,padding:'6px 14px',borderRadius:100,border:'none',cursor:'pointer',fontFamily:F.body,fontSize:13,background:filter===s?C.orange:C.surface,color:filter===s?'#fff':C.secondary,fontWeight:filter===s?600:400,boxShadow:filter===s?`0 2px 8px ${C.orangeBorder}`:'0 1px 4px rgba(0,0,0,.07)',transition:'all .18s ease'}}>{s}</button>))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {shown.map(lec=>{const col=COLORS[lec.subject]??{bg:C.orangePale,text:C.orange};return(
          <div key={lec.id} style={{background:C.surface,borderRadius:16,padding:'16px 18px',boxShadow:S.card}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:600,background:col.bg,color:col.text,borderRadius:6,padding:'2px 8px'}}>{lec.subject}</span>
              <span style={{fontSize:11,fontWeight:600,background:C.greenPale,color:C.green,borderRadius:6,padding:'2px 8px'}}>✓ Present</span>
            </div>
            <div style={{fontFamily:F.display,fontSize:15,fontWeight:600,color:C.text,marginBottom:4}}>{lec.teacher}</div>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12.5,color:C.muted}}><Clock size={12}/>{lec.date} · {lec.time} · {lec.duration}</div>
          </div>
        )})}
        {shown.length===0&&<div style={{textAlign:'center',padding:'48px 0',color:C.faint}}><BookOpen size={32} style={{marginBottom:10}}/><p style={{fontSize:14,margin:0}}>No lectures found</p></div>}
      </div>
    </div>
  )
}