export default function Logo({ size = 34 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:Math.round(size*.265), background:'linear-gradient(135deg,#F97316,#EA580C)', display:'grid', placeItems:'center', boxShadow:'0 4px 12px rgba(249,115,22,.3)', flexShrink:0 }}>
      <span style={{ color:'#fff', fontWeight:800, fontSize:size*.46, fontFamily:'Bricolage Grotesque,sans-serif', lineHeight:1 }}>A</span>
    </div>
  )
}
