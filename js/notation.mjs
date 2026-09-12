// A notation model in quarter-note units. Playback data is never rewritten.
import { SOURCE_CHECKS } from './source-checks.mjs';
import { songSignature } from './source-signature.mjs';
const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const LETTERS = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
const KEYS = {C:0,G:1,D:2,A:3,E:4,B:5,'F#':6,'C#':7,F:-1,Bb:-2,Eb:-3,Ab:-4,Db:-5,Gb:-6,Cb:-7,
  Am:0,Em:1,Bm:2,'F#m':3,'C#m':4,'G#m':5,'D#m':6,'A#m':7,Dm:-1,Gm:-2,Cm:-3,Fm:-4,Bbm:-5,Ebm:-6,Abm:-7};
export function notationKey(value) {
  if (typeof value !== 'string') return null;
  const key = value.trim().replace(/♯/g,'#').replace(/♭/g,'b').replace(/\s+major$/i,'').replace(/\s+minor$/i,'m');
  return Object.hasOwn(KEYS,key) ? key : null;
}
export function spellPitch(midi, key = 'C') {
  const count = KEYS[key] ?? 0;
  const altered = (count < 0 ? [6,2,5,1,4,0,3] : [3,0,4,1,5,2,6]).slice(0,Math.abs(count));
  const candidates = [];
  for (let oct = Math.floor(midi/12)-2; oct <= Math.floor(midi/12); oct++) for (let l=0;l<7;l++) {
    const acc = midi - ((oct+1)*12+NATURAL[l]);
    if (Math.abs(acc)>1) continue;
    const signature = altered.includes(l) ? Math.sign(count) : 0;
    candidates.push({key:`${LETTERS[l]}${acc===1?'#':acc===-1?'b':''}/${oct}`,
      cost:acc===signature ? 0 : acc===0 ? 1 : (count<0 ? acc===-1 : acc===1) ? 2 : 3});
  }
  return candidates.sort((a,b)=>a.cost-b.cost)[0].key;
}

const VALUES = [{q:4,d:'w'},{q:3,d:'hd'},{q:2,d:'h'},{q:1.5,d:'qd'},
  {q:1,d:'q'},{q:.75,d:'8d'},{q:.5,d:'8'},{q:.375,d:'16d'},
  {q:.25,d:'16'},{q:.125,d:'32'},{q:.0625,d:'64'}];
export function splitDuration(start, length, barLength) {
  const pieces=[]; let at=start, left=length;
  while(left>1e-7) {
    const room=barLength-(at%barLength || 0);
    // Split syncopation at beat boundaries so a bar's pulse remains readable.
    const beatRoom = at%1 > 1e-7 ? 1-at%1 : Infinity;
    const max=Math.min(left,room,beatRoom);
    const value=VALUES.find(v=>v.q<=max+1e-7);
    if(!value) throw Error('This timing needs tuplets or finer notation.');
    pieces.push({at,q:value.q,duration:value.d}); at+=value.q;left-=value.q;
  }
  return pieces;
}

// Engrave thirds on their own beat, retaining ordinary note values elsewhere.
// The imported 1/12 grid is rounded to four decimals; playback notes stay intact.
function voiceMeasures(events,bars,barLength) {
  const total=bars*barLength, timeline=[];let cursor=0;
  for(const e of events){if(e.at>cursor+1e-7)timeline.push({at:cursor,q:e.at-cursor,notes:[]});timeline.push(e);cursor=e.at+e.q;}
  if(cursor<total-1e-7)timeline.push({at:cursor,q:total-cursor,notes:[]});
  const tupleBeats=new Map();
  for(const e of timeline)for(const t of [e.at,e.at+e.q])if(Math.abs(t*16-Math.round(t*16))>1e-6)tupleBeats.set(Math.floor(t),0);
  for(const beat of tupleBeats.keys()){
    const points=[0,1,...timeline.flatMap(e=>[e.at-beat,e.at+e.q-beat]).filter(t=>t>0&&t<1)];
    for(let bar=1;bar<bars;bar++){const t=bar*barLength-beat;if(t>0&&t<1)points.push(t);}
    const cells=[3,6,12,24,48].find(n=>points.every(t=>Math.abs(t*n-Math.round(t*n))<1e-6));
    if(!cells)throw Error('Unsupported tuplet subdivision');tupleBeats.set(beat,cells);
  }
  const perBar=Array.from({length:bars},()=>[]);
  for(const e of timeline){
    const pieces=[];let at=e.at,end=e.at+e.q;
    while(at<end-1e-7){
      at=Math.round(at*48)/48;
      const beat=Math.floor(at+1e-7), cells=tupleBeats.get(beat);
      if(cells){
        const index=Math.round((at-beat)*cells),q=1/cells;
        pieces.push({at,q,duration:String(cells*8/3),tuplet:`${beat}:${Math.floor(index/3)}`});at+=q;
      }else{
        const next=[...tupleBeats.keys()].filter(b=>b>at+1e-7).sort((a,b)=>a-b)[0]??end;
        const until=Math.min(end,next);pieces.push(...splitDuration(at,until-at,barLength));at=until;
      }
    }
    pieces.forEach((p,i)=>perBar[Math.floor((p.at+1e-7)/barLength)].push({...p,notes:e.notes,
      tieFrom:e.notes.length>0&&i>0,tieTo:e.notes.length>0&&i<pieces.length-1}));
  }
  return perBar;
}

export function notationModel(song) {
  if(song.freeTime || song.barBeats || song.meterVerified) return {reason:'The recording’s bar timing is not a regular score grid. Use falling notes for this arrangement.'};
  const factor=4/(song.noteBeatUnit||song.beatUnit||4);
  const meter=song.timeSig??[4,4], barLength=meter[0]*4/meter[1];
  if(!(barLength>0) || ![2,4,8,16].includes(meter[1])) return {reason:'This meter is not supported for engraving yet.'};
  if(song.notes.some(n=>![n.b*factor,n.d*factor].every(v=>Number.isFinite(v)&&Math.abs(v*48-Math.round(v*48))<.005)||n.d<=0||n.b<0))
    return {reason:'This arrangement contains timing that needs a verified tuplet score. Falling notes preserve its timing.'};
  const snap=v=>Math.round(v*48)/48;
  const end=Math.max(0,...song.notes.map(n=>snap((n.b+n.d)*factor)));
  const bars=Math.max(1,Math.ceil(end/barLength));
  const tracks={L:[],R:[]};
  for(const hand of ['R','L']) {
    const groups=new Map();
    for(const n of song.notes.filter(n=>n.h===hand)) {
      const k=`${n.b}:${n.d}`; if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(n);
    }
    const voices=[];
    for(const notes of [...groups.values()].sort((a,b)=>a[0].b-b[0].b||b[0].d-a[0].d)) {
      const at=snap(notes[0].b*factor), duration=snap(notes[0].d*factor);
      let voice=voices.find(v=>v.end<=at+1e-7);
      if(!voice) {voice={end:0,events:[]};voices.push(voice);}
      voice.events.push({at,q:duration,notes:notes.slice().sort((a,b)=>a.m-b.m)}); voice.end=at+duration;
    }
    if(!voices.length) voices.push({end:0,events:[]});
    if(voices.length>4) return {reason:'This arrangement needs more than four independent voices per hand. Use falling notes while its score is reviewed.'};
    for(const voice of voices) {
      tracks[hand].push(voiceMeasures(voice.events,bars,barLength));
    }
  }
  const source=SOURCE_CHECKS[song.id];
  const sourceKey=source&&source.songSignature===songSignature(song)&&source.matched===source.notes?source.sourceKey:null;
  const scaleKey=/^([A-G][b#]?) (Major|Minor) (Scale|Arpeggio)$/.exec(song.title??'');
  const key=notationKey(song.key)||notationKey(sourceKey)||(scaleKey?notationKey(scaleKey[1]+(scaleKey[2]==='Minor'?'m':'')):null);
  return {factor,meter,barLength,bars,tracks,key,end};
}
