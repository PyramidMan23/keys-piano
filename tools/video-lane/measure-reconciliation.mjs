// Read-only, whole-stream comparison to the actual imported tiers. A match
// against extracted events does not establish extraction completeness.
import {readFileSync,writeFileSync} from 'node:fs';
import {IMPORTED} from '../../js/songs-imported.mjs';
const base='tools/video-lane/reconciliation-2026-09-09';
const configs=[['silksong',70,'embers'],['gerudo-valley',120,'3d-blue-green'],['zeldas-lullaby',110,'synthesia-2019']];
const summary=[];
const reviewed=process.argv.includes('--reviewed');
const suffix=reviewed?'reviewed-measurements':'measurements';
for(const [id,bpm,temp] of configs){
 const raw=JSON.parse(readFileSync(`${base}/${id}.${reviewed?'reviewed':'raw'}.json`));
 const ev=raw.events.filter(e=>e.colour!=='ambiguous');
 const T=JSON.parse(readFileSync(`tools/video-lane/templates/sheet-music-boss-${temp}.json`));
 const beat=60/bpm,latency=T.onsetLatencyMs/1000;
 let phase=0,best=Infinity;
 for(let p=0;p<beat;p+=beat/200){
  let error=0;for(const e of ev){const b=(e.on+latency-p)/beat;error+=Math.abs(b-Math.round(b*4)/4);}
  if(error<best){best=error;phase=p;}
 }
 const first=Math.min(...ev.map(e=>Math.round((e.on+latency-phase)/beat*4)/4));
 const ref=ev.map((e,i)=>({...e,index:i,b:Math.round((e.on+latency-phase)/beat*4)/4-first,h:T.handMapping[e.colour]}));
 const tiers=[];
 for(const s of IMPORTED.filter(s=>s.group===id)){
  const used=new Set(),moves=[],missing=[],hands=[];
  for(const e of ref){const i=s.notes.findIndex((n,i)=>!used.has(i)&&n.m===e.midi&&Math.abs(n.b-e.b)<.001);
   if(i<0){missing.push(e);continue;}
   used.add(i);const n=s.notes[i];if(n.h!==e.h)hands.push({event:e,note:n});
   moves.push(Math.abs((e.on+latency)-(phase+(n.b+first)*beat))*1000);
  }
  moves.sort((a,b)=>a-b);
  tiers.push({id:s.id,level:s.level,shipped:s.notes.length,matched:used.size,missing:missing.length,
   extra:s.notes.length-used.size,handDisagreements:hands.length,onsetMedianMs:moves[Math.floor(moves.length/2)],
   onsetWorstMs:moves.at(-1),onsetMedianBeats:moves[Math.floor(moves.length/2)]/1000/beat,
   onsetWorstBeats:moves.at(-1)/1000/beat,
   releaseChanges:s.notes.filter(n=>{const e=ref.find(e=>e.midi===n.m&&e.h===n.h&&e.b===n.b);return e&&Math.abs(n.d-Math.max(.25,Math.round((e.off-e.on)/beat*4)/4))>.001;}).length});
 }
 const heldWide=[],heldCross=[],strikeWide=[];
 for(const t of [...new Set(ev.map(e=>e.on))]){
  const active=ref.filter(e=>e.on<=t&&e.off>t),at=ref.filter(e=>e.on===t);
  for(const h of ['L','R']){
   const a=active.filter(e=>e.h===h);if(a.length&&Math.max(...a.map(e=>e.midi))-Math.min(...a.map(e=>e.midi))>16)heldWide.push({t,h,events:a});
   const b=at.filter(e=>e.h===h);if(b.length&&Math.max(...b.map(e=>e.midi))-Math.min(...b.map(e=>e.midi))>16)strikeWide.push({t,h,events:b});
  }
  const l=active.filter(e=>e.h==='L'),r=active.filter(e=>e.h==='R');
  if(l.length&&r.length&&Math.max(...l.map(e=>e.midi))>Math.min(...r.map(e=>e.midi)))heldCross.push({t,left:l,right:r});
 }
 const result={id,status:'UNVERIFIED whole-video completeness',frames:raw.frames,acceptedEvents:ev.length,
  ambiguous:raw.ambiguous,rejectedTenFinger:raw.rejected.tenFinger.length,rejectedShort:raw.rejected.shortPresses.length,
  bpm,latencyMs:T.onsetLatencyMs,phaseSeconds:phase,firstGridBeat:first,tiers,
  heldWideCount:heldWide.length,heldCrossCount:heldCross.length,strikeWideCount:strikeWide.length,heldWide,heldCross,strikeWide};
 writeFileSync(`${base}/${id}.${suffix}.json`,JSON.stringify(result,null,1));
 summary.push({...result,heldWide:undefined,heldCross:undefined,strikeWide:undefined});
}
writeFileSync(`${base}/${suffix}.json`,JSON.stringify(summary,null,1));
console.log(JSON.stringify(summary,null,1));
