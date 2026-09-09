// Independent diagnostic witness. Read two thin rows well above particle
// spray, with source presentation timestamps (PTS), retaining every run.
// This is not an import source. Every disagreement requires frame review.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
const [video, geometry, family, out] = process.argv.slice(2);
const geo = JSON.parse(readFileSync(geometry));
const W = geo.width, top = 200, H = 104;
const rows = [2, 98];
const columns = geo.keys.map(k => ({midi:k.midi, x:(k.x0+k.x1)/2}));
function classify(r,g,b) {
  if (family === 'embers') {
    if (r > 80 && (r-b)/r > .3) return 'red';
    if (Math.min(r,g,b) > 65 && Math.max(r,g,b)-Math.min(r,g,b)<65) return 'white';
  } else {
    if (g > 50 && g > b*1.35 && g>r*1.2) return 'green';
    if (b > 60 && b > g*1.15 && b>r*1.2) return 'blue';
  }
  return null;
}
const events = rows.map(()=>[]), states = rows.map(()=>columns.map(()=>null));
const pts = []; let count=0,pending=Buffer.alloc(0),closed=false,done=false;
const bytes=W*H*3;
function frame(buf,t) {
  for(let ri=0;ri<rows.length;ri++) {
   // Connected horizontal colour runs identify the centre of a bar. Sampling
   // a black-key centre alone also sees its neighbour's wider white-key bar.
   const segments=[]; let segment=null;
   for(let x=0;x<=W;x++) {
    let r=0,g=0,b=0;
    if(x<W)for(let y=rows[ri]-1;y<=rows[ri]+1;y++) {const i=(y*W+x)*3;r+=buf[i];g+=buf[i+1];b+=buf[i+2];}
    const colour=x<W?classify(r/3,g/3,b/3):null;
    if(segment&&segment.colour!==colour){segments.push(segment);segment=null;}
    if(colour){if(!segment)segment={colour,x0:x,x1:x};segment.x1=x;}
   }
   const hits=new Map();
   for(const s of segments){
    if(s.x1-s.x0+1<8)continue;
    const cx=(s.x0+s.x1)/2;
    const ci=columns.reduce((best,c,i)=>Math.abs(c.x-cx)<Math.abs(columns[best].x-cx)?i:best,0);
    if(Math.abs(columns[ci].x-cx)<=9)hits.set(ci,s.colour);
   }
   for(let ci=0;ci<columns.length;ci++) {
    const c=columns[ci], colour=hits.get(ci)??null, old=states[ri][ci];
    if(old && old.colour!==colour) {events[ri].push(old);states[ri][ci]=null;}
    if(colour) {
      if(!states[ri][ci]) states[ri][ci]={midi:c.midi,colour,on:t,off:t,frames:0};
      states[ri][ci].off=t;states[ri][ci].frames++;
    }
   }
  }
}
function drain(){
 while(pending.length>=bytes && count<pts.length){frame(pending.subarray(0,bytes),pts[count++]);pending=pending.subarray(bytes);}
 if(pending.length>=bytes)ff.stdout.pause();else ff.stdout.resume();
 if(closed&&!done){
  done=true;
  if(pending.length || count!==pts.length)throw Error('REFUSE: unpaired frame bytes / timestamps');
  for(let i=0;i<rows.length;i++){events[i].push(...states[i].filter(Boolean));events[i].sort((a,b)=>a.on-b.on||a.midi-b.midi);}
  writeFileSync(out,JSON.stringify({video,frames:count,rows:rows.map(x=>x+top),columns,events},null,1));
  console.log(JSON.stringify({frames:count,rows:events.map(x=>x.length),out}));
 }
}
const ff=spawn('ffmpeg',['-v','info','-i',video,'-vf',`crop=${W}:${H}:0:${top},showinfo`,'-f','rawvideo','-pix_fmt','rgb24','-']);
createInterface({input:ff.stderr}).on('line',l=>{
 const size=l.match(/Parsed_showinfo.*\bs:(\d+)x(\d+)/);
 if(size && (+size[1]!==W || +size[2]!==H))throw Error('REFUSE: crop dimensions changed');
 const p=l.match(/Parsed_showinfo.*\bn:\s*\d+.*pts_time:\s*([\d.]+)/);
 if(p){pts.push(+p[1]);drain();}
});
ff.stdout.on('data',b=>{pending=pending.length?Buffer.concat([pending,b]):b;drain();});
ff.on('error',e=>{throw e;});
ff.on('close',code=>{if(code!==0)throw Error('ffmpeg failed '+code);closed=true;drain();});


