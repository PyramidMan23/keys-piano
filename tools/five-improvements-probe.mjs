import assert from 'node:assert/strict';
import {launch} from './cdp.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync(new URL('../.impeccable/review/',import.meta.url),{recursive:true});
if(!process.argv.includes('--narrow')){
const b=await launch({width:1400,height:900,scale:1,port:9820});
try{
  await b.goto('http://localhost:4180');await b.ready();
  const report=await b.eval(`(async()=>{
    const {SHELF}=await import('/js/songs.mjs');
    const {EngravedScore}=await import('/js/engraving.mjs');
    const errors=[];let engraved=0,fallback=0;
    const host=document.createElement('div');host.className='score-wrap';document.body.append(host);
    for(const song of SHELF){
      try {const score=new EngravedScore(host);
        if(score.build(song,{startBeat:0})){engraved++;if(!host.querySelector('.vf-notehead'))throw Error('No visible note heads');
          for(let first=4;first<score.model.bars;first+=4)score.drawWindow(first);}
        else fallback++;
      }catch(e){errors.push({id:song.id,error:e.message});}
    }
    host.remove();return {engraved,fallback,errors};
  })()`);
  console.log(JSON.stringify(report));assert.equal(report.errors.length,0,'Every eligible score renders');
  const controls=await b.eval(`(()=>{
    document.getElementById('firstrun-skip')?.click();
    const search=document.getElementById('lib-search');search.value='Ode';search.dispatchEvent(new Event('input',{bubbles:true}));
    const leaf=[...document.querySelectorAll('*')].find(e=>!e.children.length&&e.textContent.trim()==='Ode to Joy');
    leaf?.click();return !!leaf;
  })()`);
  assert.equal(controls,true,'Song opens from search');
  const loop=await b.eval(`(()=>{
    const from=document.getElementById('passage-from'),to=document.getElementById('passage-to');
    from.value='1.2';to.value='4.8';document.getElementById('passage-apply').click();
    return {start:__engine.startBeat,end:__engine.endBeat,repeat:__engine.repeat,label:document.getElementById('btn-restart').textContent};
  })()`);
  assert.equal(loop.start,2);assert.equal(loop.end,8);assert.equal(loop.label,'Restart passage');
  // Reset and drive the lap in one task: a delayed CDP round trip can otherwise
  // let the first note enter wait mode before this perfect-timing fixture starts.
  await b.eval(`(()=>{const e=__engine;e.reset();for(const g of e.groups){e.beat=g.beat;for(const n of g.notes)e.noteOn(n.m);}
    e.tick((e.endBeat-e.beat+.01)*e.msPerBeat());})()`);
  await new Promise(r=>setTimeout(r,250));
  const evidence=await b.eval(`(()=>{const s=JSON.parse(localStorage.getItem('keys-v1'));return {attempt:s.songs['ode-to-joy'].attempts.at(-1),proven:s.playable?.['ode-to-joy']?.provenAt};})()`);
  assert.equal(evidence.attempt.whole,false);assert.equal(evidence.attempt.acc,100);assert.equal(evidence.proven,undefined);
  await b.eval(`document.getElementById('btn-restart').click();document.getElementById('tempo').value='50';document.getElementById('tempo').dispatchEvent(new Event('change'));`);
  assert.deepEqual(await b.eval(`({start:__engine.startBeat,end:__engine.endBeat})`),{start:2,end:8});
  await b.eval(`document.getElementById('passage-clear').click();`);
  assert.equal(await b.eval('__engine.loop'),null);
  await b.eval(`(document.querySelector('[data-proxy-for="mode-score"]')??document.getElementById('mode-score')).click();`);
  assert.equal(await b.eval(`(document.querySelector('[data-proxy-for="mode-score"]')??document.getElementById('mode-score')).getAttribute('aria-pressed')`),'true');
  await b.eval(`document.querySelectorAll('#session-guide details').forEach(d=>d.open=false);`);
  mkdirSync(new URL('../.impeccable/review/',import.meta.url),{recursive:true});
  await b.freezeMotion();
  await b.eval('document.fonts.ready');await new Promise(r=>setTimeout(r,350));
  writeFileSync(new URL('../.impeccable/review/desktop.png',import.meta.url),await b.shot());
  await b.eval(`window.__show('library');const search=document.getElementById('lib-search');search.value='The Legend of Zelda';search.dispatchEvent(new Event('input',{bubbles:true}));[...document.querySelectorAll('#screen-library *')].find(e=>!e.children.length&&e.textContent.trim()==='The Legend of Zelda (Main Theme)')?.click();(document.querySelector('[data-proxy-for="mode-score"]')??document.getElementById('mode-score')).click();`);
  assert.ok(await b.eval(`document.querySelector('#score-wrap .engraved-score svg')`)!==null,'Triplet song opens its engraved score');
  assert.equal(await b.eval(`document.querySelector('[data-tier-cell][data-on="true"]')?.dataset.tierCell===window.__tierInfo().current`),true,'Tier selection matches the open arrangement');
  await b.eval(`document.getElementById('guide-toggle').click();`);
  writeFileSync(new URL('../.impeccable/review/triplets.png',import.meta.url),await b.shot());
  console.log('PASS custom loop, restart, tempo, whole-song reset and score route');
}finally{await b.close();}
}

const narrow=await launch({width:390,height:844,scale:1,port:9821});
try{
  await narrow.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await narrow.goto('http://localhost:4180');await narrow.ready();
  await narrow.eval(`document.getElementById('firstrun-skip')?.click();const search=document.getElementById('lib-search');search.value='Ode';search.dispatchEvent(new Event('input',{bubbles:true}));[...document.querySelectorAll('*')].find(e=>!e.children.length&&e.textContent.trim()==='Ode to Joy')?.click();document.getElementById('mode-score').click();`);
  await narrow.freezeMotion();await narrow.eval('document.fonts.ready');await new Promise(r=>setTimeout(r,350));
  writeFileSync(new URL('../.impeccable/review/mobile.png',import.meta.url),await narrow.shot());
  assert.ok(await narrow.eval(`document.getElementById('session-guide').getBoundingClientRect().width<=innerWidth`));
  await narrow.eval(`document.getElementById('guide-toggle').click();document.getElementById('source-details').open=true;document.querySelector('#evidence-details summary').focus();`);
  await narrow.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await narrow.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  assert.equal(await narrow.eval(`document.activeElement===document.querySelector('#source-details summary')&&document.activeElement.matches(':focus-visible')`),true,'Tab reaches the source disclosure with visible focus');
  await narrow.eval(`document.getElementById('source-details').scrollIntoView({block:'center'});`);
  writeFileSync(new URL('../.impeccable/review/mobile-source.png',import.meta.url),await narrow.shot());
  assert.ok(await narrow.eval(`document.documentElement.scrollWidth<=innerWidth`),'Expanded mobile source stays within viewport');
}finally{await narrow.close();}
