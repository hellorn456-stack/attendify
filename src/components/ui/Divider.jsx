export default function Divider() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'14px 0' }}>
      <div style={{ flex:1, height:1, background:'#E7E5E4' }} />
      <span style={{ fontSize:12, color:'#A8A29E' }}>or</span>
      <div style={{ flex:1, height:1, background:'#E7E5E4' }} />
    </div>
  )
}
