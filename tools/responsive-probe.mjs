// Chrome DevTools Protocol (CDP) geometry gate. Run on the serving copy.
// No screenshots or arbitrary long sleeps. A hard deadline keeps this below
// three minutes, including browser startup and cleanup on failure.
import { launch } from './cdp.mjs';
import { pathToFileURL } from 'node:url';

export const SIZES = [
  [1024, 738], [1024, 900], [1280, 738], [1280, 900],
  [1600, 738], [1600, 900], [1920, 738], [1920, 900], [1400, 756],
];
export const SCREENS = ['library', 'play', 'path', 'lesson'];

// Same intersection and containment rule as canon-geometry.mjs. Kept pure so
// the gate itself can be tested without opening a browser.
export function overlap(a, b, nested = false) {
  return !nested && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2
    && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
}

// This function runs in the page. Return measurements as well as failures so
// the reviewer can report real minima rather than just a green assertion.
export function measure(screen, baseline = null, intersects = overlap) {
  const host = document.getElementById('screen-' + screen);
  const card = host?.firstElementChild;
  const problems = [];
  if (!card || host.hidden || !card.getBoundingClientRect().width) return { problems: ['screen not visible'] };
  const name = el => el.id || el.tagName + ' ' + el.textContent.trim().slice(0, 40);
  const shown = el => {
    if (el.closest('[hidden], [data-legacy-screen]')) return false;
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  // Clip each axis independently, as in canon-geometry. The viewport itself
  // clips controls scrolled below the fold; scrollable content is still tested
  // for intrinsic width and target size separately.
  const clip = el => {
    const r = el.getBoundingClientRect();
    let left = Math.max(0, r.left), top = Math.max(0, r.top);
    let right = Math.min(innerWidth, r.right), bottom = Math.min(innerHeight, r.bottom);
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p), q = p.getBoundingClientRect();
      if (s.overflowX !== 'visible') { left = Math.max(left,q.left); right = Math.min(right,q.right); }
      if (s.overflowY !== 'visible') { top = Math.max(top,q.top); bottom = Math.min(bottom,q.bottom); }
    }
    return {left,top,right,bottom,width:Math.max(0,right-left),height:Math.max(0,bottom-top)};
  };
  if (document.documentElement.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1)
    problems.push('horizontal document scrollbar');
  let widest = 0;
  for (const el of [card,...card.querySelectorAll('*')]) {
    if (!shown(el)) continue;
    // The score is a deliberately scrolling printed strip. Its wrapper must
    // fit; its vector primitives are ink, not page layout boxes.
    if (el instanceof SVGElement || el.closest('#score-wrap svg')) continue;
    const r = el.getBoundingClientRect(); widest = Math.max(widest,r.width);
    if (r.width > innerWidth + 1) problems.push('wider than viewport: '+name(el)+' '+r.width.toFixed(1));
    if (innerWidth >= 1024) {
      const s = getComputedStyle(el), z = parseFloat(s.zoom) || 1;
      const m = s.transform === 'none' ? null : new DOMMatrixReadOnly(s.transform);
      if (z < .999 || (m && (Math.hypot(m.a,m.b) < .999 || Math.hypot(m.c,m.d) < .999)))
        problems.push('reduced ancestor scale: '+name(el));
    }
  }
  // Also inspect the host and page ancestors, outside the composition.
  for (let el = host; el; el = el.parentElement) {
    const s = getComputedStyle(el), z = parseFloat(s.zoom) || 1;
    const m = s.transform === 'none' ? null : new DOMMatrixReadOnly(s.transform);
    if (innerWidth >= 1024 && (z < .999 || (m && (Math.hypot(m.a,m.b) < .999 || Math.hypot(m.c,m.d) < .999))))
      problems.push('reduced page scale: '+name(el));
  }
  const controls = [...card.querySelectorAll('button, a, input, select, summary, [role="button"], [style*="cursor: pointer"], [style*="cursor:pointer"]')].filter(shown);
  const buttons = controls.filter(el => el.matches('button, [role="button"], summary'));
  if (!buttons.length) problems.push('no visible buttons');
  for (const el of buttons) {
    const r = el.getBoundingClientRect();
    if (r.width < 43.99 || r.height < 43.99) problems.push('small target: '+name(el)+' '+r.width.toFixed(1)+'x'+r.height.toFixed(1));
    if (clip(el).width < r.width - 1) problems.push('horizontally clipped target: '+name(el));
  }
  const rects = controls.map(el=>({el,r:clip(el)})).filter(x=>x.r.width>2 && x.r.height>2);
  for (let i=0;i<rects.length;i++) for(let j=i+1;j<rects.length;j++) {
    const a=rects[i], b=rects[j];
    if (intersects(a.r,b.r,a.el.contains(b.el)||b.el.contains(a.el))) problems.push('overlap: '+name(a.el)+' / '+name(b.el));
  }
  const selectors = {
    library: ['.practice-prescription', '[data-lib-grid]'],
    play: ['#cp-title', '.session-guide .session-goal', '#j-instruction'],
    path: ['#path-reason'],
    lesson: ['#lesson-title', '#lesson-steps', '#lesson-msg'],
  };
  const fonts = {};
  for (const selector of selectors[screen]) {
    const roots = [...card.querySelectorAll(selector)];
    let targets = roots.flatMap(root=>[root,...root.querySelectorAll('*')])
      .filter(el=>shown(el) && !el.children.length && el.textContent.trim());
    if (selector === '[data-lib-grid]') targets = targets.filter(el=>getComputedStyle(el).fontFamily.includes('Fraunces'));
    // An empty probe is not a passing typography check.
    if (!targets.length) problems.push('missing text: '+selector);
    if (targets.length) fonts[selector] = Math.min(...targets.map(el=>parseFloat(getComputedStyle(el).fontSize)));
    if (baseline?.[selector] && fonts[selector] + .01 < baseline[selector]) problems.push('smaller type: '+selector+' '+fonts[selector]+' < '+baseline[selector]);
    // Two leaves can share one text (a hero title and a grid tile of the same
    // song). The baseline recorded the LARGEST instance, so compare the largest
    // (Fable, 2026-09-10: a 17px tile was read as a 24px title shrinking).
    const byKey = new Map();
    for (const el of targets) {
      const key=selector+'|'+el.textContent.trim();
      const size=parseFloat(getComputedStyle(el).fontSize);
      const cur=byKey.get(key);
      if(!cur || size>cur.size) byKey.set(key,{size,el});
    }
    for (const [key,{size,el}] of byKey) {
      fonts[key]=size;
      const drawn=baseline?.[key] ?? (parseFloat(el.style.fontSize) || baseline?.[selector]);
      if(drawn && size+.01<drawn) problems.push('smaller type: '+name(el)+' '+size+' < '+drawn);
    }
  }
  const surface = card.querySelector(screen === 'lesson' ? '#lesson-stave' : '#score-wrap');
  const falls = card.querySelector('#falls');
  const scoreInk = card.querySelector('#score-wrap > svg');
  const fallsHeight = falls && shown(falls) ? falls.getBoundingClientRect().height : null;
  const scoreInkHeight = scoreInk && shown(scoreInk) ? scoreInk.getBoundingClientRect().height : null;
  if (screen==='play' && fallsHeight!==null && fallsHeight<240) problems.push('falling-notes area below 240: '+fallsHeight);
  if (screen==='play' && surface && shown(surface) && !(scoreInkHeight>=210)) problems.push('score ink below its drawn 210: '+scoreInkHeight);
  return {problems:[...new Set(problems)],fonts,widest:+widest.toFixed(1),
    buttons:buttons.length,minButton:buttons.length ? [Math.min(...buttons.map(el=>el.getBoundingClientRect().width)),Math.min(...buttons.map(el=>el.getBoundingClientRect().height))].map(n=>+n.toFixed(1)):null,
    fallsHeight,scoreInkHeight,
    surfaceHeight:surface && shown(surface) ? +surface.getBoundingClientRect().height.toFixed(1):null};
}

async function main() {
  const deadline = setTimeout(()=>{console.error('FAIL responsive probe exceeded 170 seconds');process.exit(1);},170000);
  let b, failed=0;
  try {
    b = await launch({width:1418,height:900,scale:1});
    const seed = {firstRunDone:true,diagnosticDone:true,calibratedAt:Date.now(),
      lastSession:{songId:'still-dre-easy',at:Date.now()},lib:{learning:true},
      songs:Object.fromEntries(['still-dre-easy','fur-elise','faded-easy','river','mario-easy','runaway-easy','interstellar-easy','piano-man-easy','numb-easy','lost-easy','game-of-thrones-easy','pirates-easy','hotel-california-easy','empire-easy'].map((id,i)=>[id,{plays:i+1,practiceMs:120000+i*10000}]))};
    await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('keys-v1',${JSON.stringify(JSON.stringify(seed))});`});
    const settle = () => b.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(r,180))))');
    const click = async (text, scope='body') => {
      const found = await b.eval(`(() => {
        const root=document.querySelector(${JSON.stringify(scope)});
        const leaves=[...(root?.querySelectorAll('*')||[])].filter(e=>!e.children.length && e.textContent.trim()===${JSON.stringify(text)} && e.getBoundingClientRect().width>0 && !e.closest('[hidden]'));
        for(const leaf of leaves){let el=leaf;while(el && !el.matches('button,a,summary,[role="button"],[style*="cursor: pointer"],[style*="cursor:pointer"]'))el=el.parentElement;
          if(el){el.scrollIntoView({block:'nearest'});el.click();return true;}}
        return false;
      })()`);
      if(!found) throw new Error('missing control: '+text);
      await settle();
    };
    const open = async screen => {
      await b.goto('http://localhost:4180/index.html'); await b.ready(6000); await settle();
      if(screen==='play') await click('Resume the session','#screen-library');
      if(screen==='path' || screen==='lesson') {
        await click('All tools','#screen-library'); await click(screen==='path'?'My path':'Lessons');
        // the phone lessons board has no "Continue here" control; a lesson title opens it there
        if(screen==='lesson') { try { await click('Continue here','#screen-lessons'); } catch { await click('Middle C and the grand staff','#screen-lessons'); } }
      }
      await b.eval('window.scrollTo(0,0); true'); await settle();
    };
    const read = (screen,baseline) => b.eval(`(${measure.toString()})(${JSON.stringify(screen)},${JSON.stringify(baseline)},${overlap.toString()})`);
    const baselines={};
    for(const screen of SCREENS){await open(screen);const r=await read(screen,null);baselines[screen]=r.fonts;
      if(!r.fonts || !Object.keys(r.fonts).length || r.problems.some(p=>p.startsWith('missing text:'))) throw new Error('missing drawn typography baseline: '+screen+' '+JSON.stringify(r.problems));}
    for(const [width,height] of SIZES) {
      await b.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
      for(const screen of SCREENS) {
        try {
          await open(screen);
          const r=await read(screen,baselines[screen]);
          // Expanded controls and the independently sized score are part of
          // Play's layout, not optional exclusions from the gate.
          if(screen==='play') {
            await b.eval(`document.querySelector('#screen-play .practice-adjust')?.setAttribute('open',''); true`); await settle();
            const expanded=await read(screen,baselines[screen]); r.problems.push(...expanded.problems.map(p=>'expanded: '+p));
            await click('Score','#screen-play');
            const score=await read(screen,baselines[screen]); r.problems.push(...score.problems.map(p=>'score: '+p));
            if(!(score.surfaceHeight>=238)) r.problems.push('score height below 238: '+score.surfaceHeight);
            r.scoreHeight=score.surfaceHeight;
          }
          const bad=r.problems.length>0;if(bad)failed++;
          console.log(`${bad?'FAIL':'PASS'} ${width}x${height} ${screen} ${JSON.stringify(r)}`);
        } catch(e){failed++;console.log(`FAIL ${width}x${height} ${screen}: ${e.message}`);}
      }
    }
    // Start in the phone composition, then rotate the SAME open screen.
    // In Play the engine identity must survive, proving this was adoption
    // rather than a hidden restart or navigation masquerading as reflow.
    for (const screen of SCREENS) {
      try {
        await b.send('Emulation.setDeviceMetricsOverride',{width:756,height:1400,deviceScaleFactor:1,mobile:false});
        await open(screen);
        await b.eval('window.__responsiveEngine=window.__engine; true');
        await b.send('Emulation.setDeviceMetricsOverride',{width:1400,height:756,deviceScaleFactor:1,mobile:false});
        // Crossing the desktop width while idling on the library reloads the shell on purpose
        // (app.mjs, the composition swap). Wait on the Node side so a page eval is never in
        // flight during that navigation, then let the app come back up.
        await new Promise(r=>setTimeout(r,1500)); await b.ready(8000); await settle();
        if(screen==='library') { await b.eval('window.scrollTo(0,0); true'); await settle(); }
        const r=await read(screen,baselines[screen]);
        if(screen==='play' && !(await b.eval('!!window.__engine && window.__responsiveEngine===window.__engine'))) r.problems.push('rotation replaced the live engine');
        if(r.problems.length)failed++;
        console.log(`${r.problems.length?'FAIL':'PASS'} 756x1400 to 1400x756 ${screen} ${JSON.stringify(r)}`);
      } catch(e){failed++;console.log(`FAIL rotation ${screen}: ${e.message}`);}
    }
  } finally {if(b)await b.close();clearTimeout(deadline);}
  process.exitCode=failed?1:0;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  main().catch(e=>{console.error('FAIL responsive probe: '+e.stack);process.exitCode=1;});
}
