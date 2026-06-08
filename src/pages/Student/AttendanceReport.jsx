import { C, F, S } from '../../styles/theme'

const MOCK = {
  overall:{attended:22,total:30},
  subjects:[
    {name:'Data Structures',attended:8,total:10},{name:'DBMS',attended:6,total:9},
    {name:'Operating Systems',attended:5,total:7},{name:'Computer Networks',attended:3,total:4},
  ]
}
const pct=(a,t)=>t===0?0:Math.round((a/t)*100)
const color=(p)=>p>=75?'#16A34A':p>=60?'#F97316':'#DC2626'

function Ring({p}){
  const r=54,circ=2*Math.PI*r,dash=(p/100)*circ
  return(<svg width={130} height={130} viewBox="0 0 130 130">
    <circle cx={65} cy={65} r={r} fill="none" stroke="#F0EEE8" strokeWidth={14}/>
    <circle cx={65} cy={65} r={r} fill="none" stroke={color(p)} strokeWidth={14} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"/>
  </svg>)
}

export default function AttendanceReport() {
  const {attended,total}=MOCK.overall, overall=pct(attended,total)
  return(
    <div style={{padding:20}}>
      <h2 style={{margin:'0 0 16px',fontFamily:F.display,fontSize:18,fontWeight:700,color:C.text}}>Attendance Report</h2>
      <div style={{background:C.surface,borderRadius:20,padding:'24px 20px',boxShadow:S.card,textAlign:'center',marginBottom:16}}>
        <div style={{position:'relative',display:'inline-block'}}>
          <Ring p={overall}/>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontFamily:F.display,fontSize:28,fontWeight:800,color:color(overall)}}>{overall}%</span>
            <span style={{fontSize:11,color:C.muted}}>overall</span>
          </div>
        </div>
        <p style={{margin:'10px 0 0',fontSize:14,color:C.secondary}}><strong style={{color:C.text}}>{attended}</strong> of <strong style={{color:C.text}}>{total}</strong> lectures attended</p>
        {overall<75&&<div style={{marginTop:12,padding:'8px 14px',background:'#FEF9EC',border:'1px solid #FDE68A',borderRadius:10,fontSize:12.5,color:'#92400E'}}>⚠️ Below 75% — {Math.ceil(total*.75)-attended} more lectures needed</div>}
      </div>
      <div style={{background:C.surface,borderRadius:20,padding:'18px 20px',boxShadow:S.card}}>
        <h3 style={{margin:'0 0 16px',fontFamily:F.display,fontSize:15,fontWeight:700,color:C.text}}>By Subject</h3>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {MOCK.subjects.map(s=>{const p=pct(s.attended,s.total),c=color(p);return(
            <div key={s.name}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:13.5,fontWeight:500,color:C.text}}>{s.name}</span>
                <span style={{fontSize:13,color:C.muted}}>{s.attended}/{s.total} <strong style={{color:c}}>{p}%</strong></span>
              </div>
              <div style={{height:7,background:'#F0EEE8',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:`${p}%`,background:c,borderRadius:4}}/></div>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}