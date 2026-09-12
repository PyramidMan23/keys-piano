import '../vendor/vexflow-4.2.5.js';
import { notationModel, spellPitch } from './notation.mjs';

// VexFlow is vendored, including its bundled fonts, for offline practice.
const VF=globalThis.Vex.Flow;
export class EngravedScore {
  constructor(container){this.container=container;this.noteEls=new Map();this.window=-1;}
  build(song,engine){
    this.song=song;this.model=notationModel(song);this.window=-1;
    if(this.model.reason)return false;
    this.drawWindow(Math.max(0,Math.floor((engine.startBeat||0)*this.model.factor/this.model.barLength)));
    return true;
  }
  drawWindow(first){
    const m=this.model;this.window=first;this.noteEls.clear();this.container.replaceChildren();
    const host=document.createElement('div');host.className='engraved-score';this.container.append(host);
    const count=Math.min(4,m.bars-first),leading=110;
    const widths=Array.from({length:count},(_,i)=>{
      const onsets=new Set(Object.values(m.tracks).flatMap(voices=>voices.flatMap(v=>v[first+i].map(e=>e.at))));
      return Math.max(340,90+onsets.size*28)+(i===0?leading:0);
    });
    const renderer=new VF.Renderer(host,VF.Renderer.Backends.SVG);
    renderer.resize(widths.reduce((a,b)=>a+b,0),290);
    const ctx=renderer.getContext();ctx.setFillStyle('#23282f');ctx.setStrokeStyle('#23282f');
    const ties=new Map();
    for(let bar=first;bar<first+count;bar++){
      const width=widths[bar-first],bx=widths.slice(0,bar-first).reduce((a,b)=>a+b,0);
      const staves={},voices=[],entries=[],tuplets=[];
      for(const hand of ['R','L']){
        const clef=hand==='R'?'treble':'bass';
        const stave=new VF.Stave(bx,hand==='R'?15:145,width);
        stave.setStyle({strokeStyle:'#837c69',fillStyle:'#23282f'});
        if(bar===first){stave.addClef(clef);if(m.key)stave.addKeySignature(m.key);stave.addTimeSignature(m.meter.join('/'));}
        stave.setMeasure(bar+1);stave.setContext(ctx).draw();staves[hand]=stave;
        for(const [vi,voice] of m.tracks[hand].entries()){
          const tupleGroups=new Map();
          const tickables=voice[bar].map(event=>{
            const rest=!event.notes.length;
            const note=new VF.StaveNote({clef,keys:rest?[hand==='R'?'b/4':'d/3']:event.notes.map(n=>spellPitch(n.m,m.key??'C')),
              duration:event.duration+(rest?'r':''),auto_stem:m.tracks[hand].length===1,
              stem_direction:m.tracks[hand].length>1?(vi%2===0?1:-1):undefined});
            if(event.duration.endsWith('d'))VF.Dot.buildAndAttach([note],{all:true});
            // Secondary-voice padding is spacing, not an extra rest to learn.
            if(rest&&vi>0)note.setStyle({fillStyle:'transparent',strokeStyle:'transparent'});
            if(!rest)event.notes.forEach((n,index)=>{if(n.f&&!event.tieFrom)note.addModifier(new VF.FretHandFinger(String(n.f)).setPosition(hand==='R'?VF.Modifier.Position.ABOVE:VF.Modifier.Position.BELOW),index);});
            if(event.tuplet){if(!tupleGroups.has(event.tuplet))tupleGroups.set(event.tuplet,[]);tupleGroups.get(event.tuplet).push(note);}
            entries.push({note,event,hand,vi});return note;
          });
          for(const notes of tupleGroups.values())tuplets.push(new VF.Tuplet(notes,{num_notes:3,notes_occupied:2,bracketed:true}));
          const v=new VF.Voice({num_beats:m.meter[0],beat_value:m.meter[1]}).addTickables(tickables);
          v.setStave(stave);voices.push(v);
        }
      }
      // Format both hands together, so simultaneous onsets share one x.
      VF.Accidental.applyAccidentals(voices.slice(0,m.tracks.R.length),m.key??'C');
      VF.Accidental.applyAccidentals(voices.slice(m.tracks.R.length),m.key??'C');
      const start=Math.max(staves.R.getNoteStartX(),staves.L.getNoteStartX());
      staves.R.setNoteStartX(start);staves.L.setNoteStartX(start);
      new VF.Formatter().joinVoices(voices).format(voices,width-(start-bx)-30);
      for(const voice of voices){
        const beams=VF.Beam.generateBeams(voice.getTickables(),{groups:[new VF.Fraction(m.meter[0]>3&&m.meter[0]%3===0&&m.meter[1]===8?3:1,m.meter[1]===8?8:4)]});
        voice.draw(ctx,voice.getStave());beams.forEach(beam=>beam.setContext(ctx).draw());}
      tuplets.forEach(tuplet=>tuplet.setContext(ctx).draw());
      for(const {note,event,hand,vi} of entries){
        const el=note.getSVGElement();
        if(el){el.dataset.hand=hand;el.dataset.beat=event.at/m.factor;}
        for(const n of event.notes){if(!this.noteEls.has(n))this.noteEls.set(n,[]);this.noteEls.get(n).push(el);}
        if(event.notes.length){
          const key=`${hand}:${vi}:${event.notes.map(n=>n.m).join(',')}`;
          if(event.tieFrom)new VF.StaveTie({first_note:ties.get(key),last_note:note,
            first_indices:event.notes.map((_,i)=>i),last_indices:event.notes.map((_,i)=>i)}).setContext(ctx).draw();
          if(event.tieTo&&bar===first+count-1)new VF.StaveTie({first_note:note,
            first_indices:event.notes.map((_,i)=>i),last_indices:event.notes.map((_,i)=>i)}).setContext(ctx).draw();
          if(event.tieTo)ties.set(key,note);else ties.delete(key);
        }
      }
      new VF.StaveConnector(staves.R,staves.L).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
    }
    this.svg=host.querySelector('svg');this.svg.setAttribute('role','img');
    this.svg.setAttribute('aria-label',`${this.song.title??'Practice score'}, bars ${first+1} to ${first+count}`);
    this.container.scrollLeft=0;
  }
  update(engine,hand){
    const beat=engine.currentGroup()?.beat??engine.beat;
    const bar=Math.max(0,Math.min(this.model.bars-1,Math.floor(beat*this.model.factor/this.model.barLength)));
    if(bar<this.window||bar>=this.window+4)this.drawWindow(bar);
    for(const [n,els] of this.noteEls){const passive=hand!=='both'&&n.h!==hand;
      const current=n.b===engine.currentGroup()?.beat&&!passive;
      for(const el of els){if(!el)continue;
        const state=current?'current':passive?'passive':n.b<beat?'played':'ready';
        if(el.dataset.state!==state){el.dataset.state=state;el.style.opacity=passive?'.45':'1';}
      }
    }
    const el=this.svg?.querySelector('[data-state="current"]');
    if(el){const rect=el.getBoundingClientRect(),box=this.container.getBoundingClientRect();
      if(rect.right>box.right-50||rect.left<box.left+20)this.container.scrollLeft+=rect.left-box.left-this.container.clientWidth*.3;}
  }
}
