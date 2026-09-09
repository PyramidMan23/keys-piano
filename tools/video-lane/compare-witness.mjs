// Compare an independent bar-row witness to key events. Diagnostics only.
import {readFileSync,writeFileSync} from 'node:fs';
const [base,id]=process.argv.slice(2);
const a=JSON.parse(readFileSync(`${base}/${id}.raw.json`)).events.filter(e=>e.colour!=='ambiguous');
const w=JSON.parse(readFileSync(`${base}/${id}.witness.json`));
const lo=Math.min(...a.map(e=>e.on)),hi=Math.max(...a.map(e=>e.on));
function match(vs,as,off,tol=.06){
 const used=new Set(),pairs=[],missing=[];
 for(const v of vs){let at=-1,err=tol;
  for(let i=0;i<as.length;i++){const b=as[i];if(used.has(i)||v.midi!==b.midi)continue;
   const d=Math.abs(v.on+off-b.on);if(d<err){at=i;err=d;}}
  if(at<0)missing.push(v);else{used.add(at);pairs.push({w:v,key:as[at],error:err});}
 }
 return {pairs,missing,unmatchedKeys:as.filter((_,i)=>!used.has(i))};
}
const results=[];
for(const row of w.events){
 const v=row.filter(e=>e.frames>=2 && e.on>lo-4 && e.on<hi);
 let off=0,n=-1;
 for(let t=0;t<3.5;t+=.005){const count=match(v,a,t).pairs.length;if(count>n){n=count;off=t;}}
 const ps=match(v,a,off).pairs;
 const ds=ps.map(p=>p.key.on-p.w.on).sort((a,b)=>a-b);off=ds[ds.length>>1];
 const r=match(v,a,off);
 const validMissing=r.missing.filter(e=>e.on+off>=lo-.06 && e.on+off<=hi+.06);
 results.push({offset:off,matched:r.pairs.length,missing:validMissing,unmatchedKeys:r.unmatchedKeys,handDisagreements:r.pairs.filter(p=>p.w.colour!==p.key.colour)});
}
writeFileSync(`${base}/${id}.witness-diff.json`,JSON.stringify(results,null,1));
console.log(id,JSON.stringify(results.map(r=>({...r,missing:r.missing.length,unmatchedKeys:r.unmatchedKeys.length,handDisagreements:r.handDisagreements.length,examples:r.missing.slice(0,12)}))));

