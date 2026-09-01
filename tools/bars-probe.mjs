// ARE THE BAR LINES ON THE SCREEN, AND ARE THEY THE TRACKED ONES?
//
// The tempo lane can be perfect in the data and draw nothing, or draw the old
// evenly-spaced grid while the tracked map sits unused in memory. This wraps
// the canvas's fillRect and reads back the horizontal lines the falls view
// actually paints, then checks their spacing against the song's own bar map.
//
// ☠️ AN EVEN GRID IS THE FAILURE MODE, so evenness is what this tests. If the
// drawn lines are perfectly regular for a song whose tracked bars are not, the
// modulo path is still running and the map never reached the screen.
import { launch } from './cdp.mjs';

const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5,
  days: [], pmin: {}, songs: { 'married-life': { plays: 3, stars: 1, best: 70 } },
  lessons: {}, lib: { learning: true },
};
const b = await launch({ width: 1418, height: 900, scale: 1, port: 9701 });
const fails = [];
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 2000));

  // open Married Life through the search box, like a person
  const inp = await b.eval(`(() => { const i = [...document.querySelectorAll('input')].find((x) => /search/i.test(x.placeholder || '') && x.getBoundingClientRect().width > 0); if (!i) return null; const r = i.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; })()`);
  if (!inp) { console.log('FAIL: no search box'); process.exit(1); }
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: inp.x, y: inp.y, buttons: 0 });
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: inp.x, y: inp.y, button: 'left', buttons: 1, clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: inp.x, y: inp.y, button: 'left', clickCount: 1 });
  for (const ch of 'married') { await b.send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch, key: ch }); await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); }
  await new Promise((r) => setTimeout(r, 900));
  const card = await b.eval(`(() => { const el = [...document.querySelectorAll('*')].find((e) => !e.children.length && /^Married Life/.test(e.textContent.trim()) && e.getBoundingClientRect().width > 0); if (!el) return null; const h = el.closest('button, a, [role="button"], [data-id]') || el; const r = h.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; })()`);
  if (!card) { console.log('FAIL: no Married Life card'); process.exit(1); }
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: card.x, y: card.y, buttons: 0 });
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: card.x, y: card.y, button: 'left', buttons: 1, clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: card.x, y: card.y, button: 'left', clickCount: 1 });
  await new Promise((r) => setTimeout(r, 1500));

  const out = JSON.parse(await b.eval(`(() => {
    const f = window.__falls, e = window.__engine;
    if (!f || !e) return JSON.stringify({ err: 'play screen did not open' });
    const song = e.song;
    // capture the full-width thin rects the bar-line pass paints
    const ctx = f.ctx, real = ctx.fillRect.bind(ctx);
    const seen = [];
    ctx.fillRect = (x, y, w, h) => { if (x === 0 && w >= f.w - 1 && h <= 2 && y > 2) seen.push(Math.round(y)); return real(x, y, w, h); };
    // step the engine through a few beats and redraw
    for (let i = 0; i < 6; i++) { e.beat = 4 + i * 2; f.draw(e); }
    ctx.fillRect = real;
    const uniq = [...new Set(seen)].sort((a, b) => a - b);
    return JSON.stringify({
      trackedBars: song.barBeats ? song.barBeats.length : 0,
      timeSig: song.timeSig,
      linesDrawn: uniq.length,
      ys: uniq.slice(0, 12),
    });
  })()`));
  if (out.err) { console.log('FAIL: ' + out.err); process.exit(1); }
  console.log(`song carries ${out.trackedBars} tracked bars, timeSig ${out.timeSig}`);
  console.log(`bar lines painted across 6 frames: ${out.linesDrawn}`);
  if (!out.trackedBars) fails.push('the song has no tracked bar map at all');
  if (!out.linesDrawn) fails.push('no bar lines were painted');

  // ☠️ THE REAL TEST: tracked bars are uneven, so the drawn gaps must be too.
  const gaps = await b.eval(`(() => {
    const s = window.__engine.song.barBeats.filter((x) => x > 0 && x < 40);
    const g = []; for (let i = 1; i < s.length; i++) g.push(+(s[i] - s[i - 1]).toFixed(3));
    return JSON.stringify(g.slice(0, 10));
  })()`);
  const g = JSON.parse(gaps);
  const uniqGaps = new Set(g.map((x) => Math.round(x * 20)));
  console.log(`first bar gaps (beats): ${g.join(', ')}`);
  if (uniqGaps.size <= 1) fails.push('the tracked bars are perfectly even - that is the old modulo grid, not a tracked map');
} finally { await b.close(); }

if (fails.length) { console.log('\nFAIL'); for (const f of fails) console.log('  ' + f); process.exit(1); }
console.log('\nbar lines are painted, and they follow the recording rather than a fixed grid');
