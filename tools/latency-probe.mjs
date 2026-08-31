// WHERE IS THE LAG? Measure, do not theorise.
//
// Mark: "can we get rid off the lag when we press a button?" Two very different
// things feel like lag and the fix for one does nothing for the other:
//   (a) the VISUAL answer is slow - the transition takes too long to show;
//   (b) the HANDLER is slow - JS blocks the main thread after the click, so the
//       whole app freezes for a moment regardless of what CSS says.
// This separates them.
import { launch } from './cdp.mjs';

const SEED = { firstRunDone: true, diagnosticDone: true, days: [], pmin: {}, songs: {}, lessons: {}, lib: { learning: true } };
const b = await launch({ width: 1600, height: 950, scale: 1, port: 9691 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1900));

  // record every long task: anything over 50ms blocks the frame and IS the lag
  await b.eval(`(() => {
    window.__long = [];
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(Math.round(e.duration)); })
        .observe({ entryTypes: ['longtask'] });
    } catch { window.__long.push(-1); }
    return true;
  })()`);

  const t = await b.eval(`(() => {
    const el = [...document.querySelectorAll('*')].find((e) => !e.children.length
      && e.textContent.trim() === 'Metronome' && e.getBoundingClientRect().width > 0);
    if (!el) return null;
    const hit = el.closest('button, a, [role="button"]') || el;
    const r = hit.getBoundingClientRect();
    window.__t = hit;
    // how long does the browser say the answer should take?
    const cs = getComputedStyle(hit);
    window.__css = cs.transitionProperty + ' / ' + cs.transitionDuration;
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + Math.min(r.height / 2, 20)) };
  })()`);
  if (!t) { console.log('no control found'); process.exit(1); }
  console.log('resting transition : ' + await b.eval('window.__css'));

  // time the HANDLER: from click dispatch to the JS being done
  const handler = await b.eval(`(() => new Promise((res) => {
    const t0 = performance.now();
    window.__t.click();
    // a task queued now runs after the handler and any sync work it did
    setTimeout(() => res(Math.round(performance.now() - t0)), 0);
  }))()`);
  console.log('click handler took : ' + handler + 'ms   (over ~50ms is felt as lag)');

  // ☠️ THE NUMBER A PERSON ACTUALLY FEELS is click -> next PAINTED frame, not
  // how long the handler ran. A 24ms handler followed by a slow re-render still
  // feels slow, and the handler timing alone would call that fast.
  const painted = await b.eval(`(() => new Promise((res) => {
    const t0 = performance.now();
    window.__t.click();
    requestAnimationFrame(() => requestAnimationFrame(() => res(Math.round(performance.now() - t0))));
  }))()`);
  console.log('click -> painted    : ' + painted + 'ms   (under ~100ms feels instant)');

  await new Promise((r) => setTimeout(r, 1200));
  const long = JSON.parse(await b.eval('JSON.stringify(window.__long)'));
  console.log('long tasks (>50ms) : ' + (long.length ? long.join(', ') + ' ms' : 'none'));

  // and how much work is on screen at once, which is what makes a repaint dear
  console.log(await b.eval(`(() => {
    const all = document.querySelectorAll('*').length;
    let withTransition = 0, withFilter = 0, withShadow = 0;
    for (const e of document.querySelectorAll('*')) {
      const s = getComputedStyle(e);
      if (s.transitionDuration !== '0s') withTransition++;
      if (s.filter !== 'none') withFilter++;
      if (s.boxShadow !== 'none') withShadow++;
    }
    return 'elements ' + all + ' | animating ' + withTransition + ' | filtered ' + withFilter + ' | shadowed ' + withShadow;
  })()`));
} finally { await b.close(); }
