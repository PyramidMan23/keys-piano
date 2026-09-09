// Apply frame-reviewed decisions to extractor events. Never infer hands from pitch.
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const base='tools/video-lane/reconciliation-2026-09-09';
for(const id of ['silksong','gerudo-valley','zeldas-lullaby']){
 const raw=JSON.parse(readFileSync(`${base}/${id}.raw.json`));
 const signal=JSON.parse(gunzipSync(readFileSync(`${base}/${id}.signal.json.gz`)));
 const additions=id==='gerudo-valley'?['','-single'].flatMap(s=>JSON.parse(readFileSync(`${base}/${id}${s}.decisions.json`)).filter(d=>d.decision==='confirmed missing strike')):[];
 const events=[];
 for(const event of raw.events.filter(e=>e.colour!=='ambiguous')){
  const splits=additions.filter(d=>d.midi===event.midi&&d.strike>event.on&&d.strike<event.off).map(d=>{
   // Select a real decoded presentation timestamp, never frame number / rate.
   const on=signal.times.reduce((best,t)=>Math.abs(t-d.strike)<Math.abs(best-d.strike)?t:best,signal.times[0]);
   return {on,colour:d.colour,review:{sheet:d.sheet,cell:d.cell,bracket:d.frames.map(f=>f.presentationSeconds),alignedSeconds:d.strike}};
  }).sort((a,b)=>a.on-b.on);
  const segment={...event};
  if(splits.length)delete segment.metricMedian;
  let prior={...segment};
  for(const s of splits){events.push({...prior,off:s.on});prior={...segment,on:s.on,colour:s.colour,flags:['Frame-reviewed separate bar strike inside continuous key tint'],review:s.review};}
  events.push(prior);
 }
 events.sort((a,b)=>a.on-b.on||a.midi-b.midi);
 if(events.length!==raw.events.filter(e=>e.colour!=='ambiguous').length+additions.length)throw Error('A reviewed addition did not belong to exactly one tint run');
 const counts={ambiguous:0};for(const e of events)counts[e.colour]=(counts[e.colour]??0)+1;
 const result={...raw,events,counts,ambiguous:0,ambiguousShare:0,reviewedAdditions:additions.length,
  reviewStatus:'Note-onset reconciliation; held release semantics and complete engraved hand proof remain UNVERIFIED',
  durationSemantics:'Key tint is not a proven physical finger hold. Split merged strikes at their reviewed next onset.'};
 writeFileSync(`${base}/${id}.reviewed.json`,JSON.stringify(result,null,1));
 console.log(id,events.length,'events;',additions.length,'reviewed additions');
}
