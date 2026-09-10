// Real pointer drags, partial-attempt boundaries, and guide layout at both boards.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {launch} from './cdp.mjs';
const mario = process.argv[3] === 'mario';
const songId = mario ? 'mario' : 'fur-elise';
const songTitle = mario ? 'Super Mario Bros. Theme' : 'Für Elise';

for (const width of process.argv[2] ? [Number(process.argv[2])] : [1418, 1100, 756, 390]) {
  const timeout = setTimeout(() => {throw new Error(`probe timed out at width ${width}`);},120000);
  const b = await launch({width,height:1000,scale:1,port:9900+width});
  const click = async (x,y,count=1) => {
    await b.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:count});
    await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:count});
  };
  const box = id => b.eval(`(() => {const r=document.getElementById('${id}').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
  const tap = async id => {const r=await box(id);await click(r.x+r.w/2,r.y+r.h/2);};
  try {
    await b.goto('http://localhost:4180/index.html?canon=0');
    await b.eval(`localStorage.setItem('keys-v1',JSON.stringify({firstRunDone:true,diagnosticDone:true,days:[],pmin:{},songs:{'${songId}':{plays:1}},lessons:{}}))`);
    await b.goto('http://localhost:4180/index.html?canon=1');
    await b.ready();
    const point=await b.eval(`(() => {
      const matches=[...document.querySelectorAll('*')].filter(e=>!e.children.length && e.textContent.trim()===${JSON.stringify(songTitle)});
      for(const e of matches.reverse()) {const r=e.getBoundingClientRect(); const x=r.x+r.width/2,y=r.y+r.height/2; if(r.width && y<innerHeight && document.elementFromPoint(x,y) === e) return {x,y};}
      return null;
    })()`);
    if(!point) console.log(await b.eval('document.body.innerText.slice(0,3000)'));
    assert.ok(point,'visible Für Elise row'); await click(point.x,point.y);
    await new Promise(r=>setTimeout(r,500));
    if(mario) {
      const tier=await b.eval(`(() => {const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Medium' && e.getBoundingClientRect().width);const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
      await click(tier.x,tier.y);
    }
    assert.equal(await b.eval('__engine.song.id'),songId);
    const before=await box('falls');
    await tap('guide-toggle');
    assert.equal(await b.eval(`document.getElementById('guide-body').hidden`),true);
    const collapsed=await box('falls');
    assert.ok(collapsed.h>=before.h,`${width}: collapsing must not shrink the deck`);
    assert.equal(await b.eval(`document.getElementById('guide-toggle').getAttribute('aria-expanded')`),'false');
    // Drag from one point to another on the canvas's top timeline.
    await b.eval(`document.getElementById('falls').scrollIntoView({block:'center'})`);
    const r=await box('falls');
    const fraction=mario ? await b.eval('41 / (__engine.endBeat * 60 / __engine.song.bpm)') : 0.55;
    const y=r.y+13, x=r.x+12+(r.w-24)*fraction;
    await b.send('Input.dispatchMouseEvent',{type:'mousePressed',x:Math.max(5,r.x+20),y,button:'left',buttons:1,clickCount:1});
    await b.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y,button:'left',buttons:1});
    await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
    const seek=await b.eval(`({start:__engine.startBeat,end:__engine.endBeat,repeat:__engine.repeat,range:__falls.transport,first:__engine.groups[0].beat,guided:!!__engine.__guidedAttempt,stats:__engine.stats})`);
    assert.ok(Math.abs(seek.start/seek.end-fraction)<0.01,JSON.stringify(seek));
    const restartLabel=await b.eval(`document.getElementById('btn-restart').textContent`);
    if(mario) assert.equal(restartLabel,'Restart from 0:41');
    assert.match(restartLabel,/Restart from/);
    assert.equal(seek.repeat,false); assert.equal(seek.range.start,0);
    assert.equal(seek.range.end,seek.end); assert.ok(seek.first>=seek.start);
    assert.equal(seek.guided,false); assert.equal(seek.stats.missed,0);
    await b.eval(`document.getElementById('practice-from-start').click()`);
    assert.equal(await b.eval('__engine.loop'),null,'returning to zero restores a full-song attempt');
    assert.equal(await b.eval(`document.getElementById('btn-restart').textContent`),'Restart');
    await b.eval(`__falls.onSeek(${seek.start/seek.end})`);
    await b.eval(`document.getElementById('tempo').value='50';document.getElementById('tempo').dispatchEvent(new Event('change'))`);
    assert.equal(await b.eval(`document.getElementById('btn-restart').textContent`),restartLabel,'tempo does not rename the song position');
    await b.eval(`document.getElementById('tempo').value='100';document.getElementById('tempo').dispatchEvent(new Event('change'))`);
    await b.eval(`document.getElementById('guide-toggle').scrollIntoView({block:'center'})`);
    await tap('guide-toggle');
    assert.equal(await b.eval(`document.getElementById('guide-body').hidden`),false);
    // Narrow composition lacks the desktop immersion handler; test wherever present.
    if (await b.eval(`typeof window.__deckImmersion === 'function'`)) {
      const deck=await box('falls'); await click(deck.x+deck.w/2,deck.y+deck.h/2,2);
      await new Promise(r=>setTimeout(r,150));
      assert.equal((await box('session-guide')).h,0,`${width}: guide hidden in immersion`);
      assert.equal(await b.eval(`document.getElementById('cp-again').getAttribute('aria-label')`),restartLabel);
      await b.eval(`document.getElementById('cp-again').click()`);
      assert.equal(await b.eval('__engine.startBeat'),seek.start,'fullscreen restart retains the chosen point');
      writeFileSync(join(tmpdir(),`keys-practice-${width}.png`),await b.shot());
      await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
      assert.ok((await box('session-guide')).h>0);
      assert.equal(await b.eval(`document.getElementById('guide-body').hidden`),false);
    } else writeFileSync(join(tmpdir(),`keys-practice-${width}.png`),await b.shot());
    await b.eval(`document.getElementById('btn-restart').click()`);
    assert.equal(await b.eval('__engine.startBeat'),seek.start,'restart retains the chosen point');
    const prior=await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).songs[__engine.song.id]`);
    // Play every remaining note correctly, finish once, and exercise actual result banking.
    assert.equal(await b.eval(`(() => {
      __engine.waitMode=false;
      for(const g of __engine.groups) {__engine.beat=g.beat; for(const n of g.notes) __engine.noteOn(n.m);}
      __engine.tick((__engine.endBeat-__engine.beat+0.01)*__engine.msPerBeat());
      return __engine.finished && !__engine.drainEvents().some(e=>e.type==='lap');
    })()`),true);
    await new Promise(r=>setTimeout(r,250));
    const after=await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).songs[__engine.song.id]`);
    assert.equal(after.best,prior.best,'partial 100% must not replace full-song best');
    assert.equal(after.stars,prior.stars,'partial 100% must not award whole-song stars');
    assert.equal(after.attempts.at(-1).whole,false,'saved attempt is partial');
    assert.equal(after.attempts.at(-1).acc,100,'remaining notes were actually played correctly');
    console.log(`PASS ${width}: collapse ${before.h} -> ${collapsed.h}; seek to ${seek.start.toFixed(1)} / ${seek.end}; finite attempt; immersion restore`);
  } finally {clearTimeout(timeout); await b.close();}
}
