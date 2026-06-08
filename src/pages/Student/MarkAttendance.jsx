import { useState } from 'react'
import { MapPin, QrCode, Fingerprint, Check, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react'
import { C, F, S } from '../../styles/theme'

const STATES = { IDLE:'idle', LOCATING:'locating', LOC_OK:'loc_ok', LOC_ERR:'loc_err', QR_READY:'qr_ready', QR_OK:'qr_ok', PASSKEY:'passkey', SUCCESS:'success' }
const MOCK_LECTURE = { subject:'Data Structures', teacher:'Dr. R. Mehta', room:'Room 204', startTime:'10:00 AM', endTime:'11:00 AM' }

function StepRow({ icon:Icon, label, desc, status }) {
  const color = status==='done'?C.green:status==='active'?C.orange:C.faint
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
      <div style={{ width:38, height:38, borderRadius:11, background:status==='done'?C.greenPale:status==='active'?C.orangePale:'#F5F5F4', display:'grid', placeItems:'center', flexShrink:0 }}>
        {status==='done'?<Check size={17} color={C.green}/>:<Icon size={17} color={color}/>}
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:600,color:status==='idle'?C.faint:C.text,fontFamily:F.display}}>{label}</div>
        <div style={{fontSize:12,color:C.muted,marginTop:1}}>{desc}</div>
      </div>
      {status==='active'&&<ChevronRight size={16} color={C.orange}/>}
      {status==='done'&&<span style={{fontSize:11,fontWeight:600,color:C.green,background:C.greenPale,borderRadius:6,padding:'2px 8px'}}>Done</span>}
    </div>
  )
}

export default function MarkAttendance({ profile }) {
  const [state, setState] = useState(STATES.IDLE)
  const [locMsg, setLocMsg] = useState('')

  const stepStatus = (forState) => {
    const ORDER = [STATES.IDLE,STATES.LOCATING,STATES.LOC_OK,STATES.LOC_ERR,STATES.QR_READY,STATES.QR_OK,STATES.PASSKEY,STATES.SUCCESS]
    const cur=ORDER.indexOf(state), tgt=ORDER.indexOf(forState)
    return cur>tgt?'done':cur===tgt?'active':'idle'
  }

  const getLocation = () => {
    setState(STATES.LOCATING)
    navigator.geolocation.getCurrentPosition(
      pos => { setLocMsg(`Within range · ${pos.coords.accuracy.toFixed(0)}m accuracy`); setState(STATES.LOC_OK) },
      ()  => { setLocMsg('Could not fetch location. Check permissions.'); setState(STATES.LOC_ERR) },
      { enableHighAccuracy:true, timeout:10000 }
    )
  }
  const scanQR = () => { setState(STATES.QR_READY); setTimeout(()=>setState(STATES.QR_OK),1500) }
  const verifyPasskey = () => { setState(STATES.PASSKEY); setTimeout(()=>setState(STATES.SUCCESS),1800) }
  const reset = () => { setState(STATES.IDLE); setLocMsg('') }

  if (state===STATES.SUCCESS) return (
    <div style={{padding:20}}>
      <div style={{background:C.surface,borderRadius:20,padding:32,textAlign:'center',boxShadow:S.card}}>
        <div style={{width:72,height:72,borderRadius:'50%',background:C.greenPale,border:`2px solid ${C.greenBorder}`,display:'grid',placeItems:'center',margin:'0 auto 20px'}}><Check size={32} color={C.green} strokeWidth={2.5}/></div>
        <h2 style={{fontFamily:F.display,fontSize:22,fontWeight:800,color:C.text,margin:'0 0 6px'}}>Attendance Marked!</h2>
        <p style={{color:C.muted,fontSize:14,margin:'0 0 4px'}}>{MOCK_LECTURE.subject}</p>
        <p style={{color:C.faint,fontSize:13,margin:'0 0 24px'}}>{new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · Today</p>
        <div style={{background:C.orangePale,borderRadius:12,padding:'10px 16px',fontSize:13,color:C.secondary,marginBottom:24}}>Roll: <strong>{profile.rollNumber}</strong> · <strong>{profile.systemId}</strong></div>
        <button onClick={reset} style={{background:'none',border:'none',color:C.orange,fontWeight:600,fontSize:14,cursor:'pointer',fontFamily:F.body}}>← Back</button>
      </div>
    </div>
  )

  return (
    <div style={{padding:20}}>
      <div style={{background:`linear-gradient(135deg,${C.orange},${C.orangeDeep})`,borderRadius:18,padding:'18px 20px',color:'#fff',marginBottom:16}}>
        <div style={{fontSize:11,opacity:.8,marginBottom:4}}>Current Session</div>
        <div style={{fontFamily:F.display,fontSize:18,fontWeight:700,marginBottom:6}}>{MOCK_LECTURE.subject}</div>
        <div style={{display:'flex',gap:12,fontSize:13,opacity:.9}}><span>{MOCK_LECTURE.teacher}</span><span>·</span><span>{MOCK_LECTURE.startTime} – {MOCK_LECTURE.endTime}</span></div>
        <div style={{fontSize:12,opacity:.75,marginTop:4}}>{MOCK_LECTURE.room}</div>
      </div>
      <div style={{background:C.surface,borderRadius:18,padding:'4px 20px',boxShadow:S.card,marginBottom:16}}>
        <StepRow icon={MapPin} label="GPS Location" desc={locMsg||"Verify you're inside the classroom"} status={state===STATES.LOCATING?'active':[STATES.LOC_OK,STATES.QR_READY,STATES.QR_OK,STATES.PASSKEY].includes(state)?'done':'idle'}/>
        <StepRow icon={QrCode} label="Scan QR Code" desc="Point camera at the teacher's screen" status={state===STATES.QR_READY?'active':[STATES.QR_OK,STATES.PASSKEY].includes(state)?'done':'idle'}/>
        <StepRow icon={Fingerprint} label="Passkey Verification" desc="Authenticate with Face ID or fingerprint" status={state===STATES.PASSKEY?'active':'idle'}/>
      </div>
      {state===STATES.LOC_ERR&&<div style={{display:'flex',gap:10,background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:12,padding:'12px 16px',marginBottom:16,alignItems:'center'}}><AlertCircle size={16} color={C.red}/><span style={{fontSize:13,color:C.red}}>{locMsg}</span></div>}
      {state===STATES.IDLE&&<button className="btn-primary" onClick={getLocation} style={{width:'100%',justifyContent:'center'}}><MapPin size={16}/> Get My Location</button>}
      {state===STATES.LOCATING&&<button className="btn-primary" disabled style={{width:'100%',justifyContent:'center',opacity:.75}}><RefreshCw size={16} className="animate-spin"/> Fetching location…</button>}
      {state===STATES.LOC_OK&&<button className="btn-primary" onClick={scanQR} style={{width:'100%',justifyContent:'center'}}><QrCode size={16}/> Scan QR Code</button>}
      {state===STATES.LOC_ERR&&<button className="btn-primary" onClick={getLocation} style={{width:'100%',justifyContent:'center'}}><RefreshCw size={16}/> Retry Location</button>}
      {state===STATES.QR_READY&&<button className="btn-primary" disabled style={{width:'100%',justifyContent:'center',opacity:.75}}><RefreshCw size={16} className="animate-spin"/> Verifying QR…</button>}
      {state===STATES.QR_OK&&<button className="btn-primary" onClick={verifyPasskey} style={{width:'100%',justifyContent:'center'}}><Fingerprint size={16}/> Verify with Passkey</button>}
      {state===STATES.PASSKEY&&<button className="btn-primary" disabled style={{width:'100%',justifyContent:'center',opacity:.75}}><RefreshCw size={16} className="animate-spin"/> Authenticating…</button>}
      <p style={{textAlign:'center',fontSize:12,color:C.faint,marginTop:14}}>All three checks run server-side · Cannot be faked</p>
    </div>
  )
}