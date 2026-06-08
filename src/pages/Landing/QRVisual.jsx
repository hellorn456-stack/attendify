function seededRng(seed){let s=seed;return()=>{s^=s<<13;s^=s>>17;s^=s<<5;return(s>>>0)%2}}
const finder=(r,c)=>{if(r===0||r===6||c===0||c===6)return 1;if(r>=2&&r<=4&&c>=2&&c<=4)return 1;return 0}
export default function QRVisual({size=9}){
  const N=15,rng=seededRng(0xDEADBEEF)
  const grid=Array.from({length:N},(_,r)=>Array.from({length:N},(_,c)=>{
    if(r<7&&c<7)return finder(r,c)
    if(r<7&&c>=N-7)return finder(r,c-(N-7))
    if(r>=N-7&&c<7)return finder(r-(N-7),c)
    if((r===7||c===7)&&r<N-7&&c<N-7)return(r+c)%2
    return rng()
  }))
  return(<div style={{display:"inline-flex",flexDirection:"column",gap:2}}>
    {grid.map((row,r)=>(<div key={r} style={{display:"flex",gap:2}}>
      {row.map((cell,c)=>(<div key={c} style={{width:size,height:size,borderRadius:2,background:cell?"#18181B":"#fff"}}/>))}
    </div>))}
  </div>)
}