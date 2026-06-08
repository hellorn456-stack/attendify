import { useState } from 'react'
import { Plus, Clock, User } from 'lucide-react'
import { useAuth }       from '../../contexts/AuthContext'
import { C, F, S }       from '../../styles/theme'
import CreateLecture     from './CreateLecture'
import LectureHistory    from './LectureHistory'
import TeacherProfile    from './TeacherProfile'

const TABS=[{id:0,label:'New Lecture',icon:Plus},{id:1,label:'History',icon:Clock},{id:2,label:'Profile',icon:User}]

export default function TeacherDashboard() {
  const {userProfile}=useAuth(); const [tab,setTab]=useState(0)
  const profile=userProfile??{firstName:'Ramesh',surname:'Mehta',systemId:'TCH-00015',email:'r.mehta@college.edu',phone:'',subjects:['Data Structures','Algorithms']}
  const initials=`${profile.firstName?.[0]??''}${profile.surname?.[0]??''}`.toUpperCase()
  return(
    <div style={{background:C.bg,minHeight:'100vh',maxWidth:480,margin:'0 auto',display:'flex',flexDirection:'column'}}>
      <header style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:30}}>
        <div><p style={{margin:0,fontSize:12,color:C.muted}}>Teacher Dashboard</p><h1 style={{margin:0,fontSize:17,fontWeight:700,fontFamily:F.display,color:C.text}}>{profile.firstName} {profile.surname}</h1></div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:11,fontWeight:600,background:C.orangePale,color:C.orange,borderRadius:6,padding:'3px 8px'}}>{profile.systemId}</span>
          <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${C.orange},${C.orangeDeep})`,display:'grid',placeItems:'center',color:'#fff',fontWeight:700,fontSize:13,fontFamily:F.display}}>{initials}</div>
        </div>
      </header>
      <main style={{flex:1,overflowY:'auto',paddingBottom:80}}>
        {tab===0&&<CreateLecture profile={profile}/>}
        {tab===1&&<LectureHistory profile={profile}/>}
        {tab===2&&<TeacherProfile profile={profile}/>}
      </main>
      <nav style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:C.surface,boxShadow:S.nav,display:'flex',zIndex:30}}>
        {TABS.map(({id,label,icon:Icon})=>{const active=tab===id;return(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,padding:'10px 0 12px',background:'none',border:'none',cursor:'pointer',position:'relative'}}>
            {active&&<span style={{position:'absolute',top:6,width:20,height:3,borderRadius:2,background:C.orange}}/>}
            <Icon size={20} color={active?C.orange:C.faint} strokeWidth={active?2.2:1.8}/>
            <span style={{fontSize:10.5,fontWeight:active?600:400,color:active?C.orange:C.faint,fontFamily:F.body}}>{label}</span>
          </button>
        )})}
      </nav>
    </div>
  )
}