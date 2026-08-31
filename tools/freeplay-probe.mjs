// HOW BIG ARE THE KEYS ON FREE PLAY, AND CAN YOU TAP THEM?
//
// Mark's first complaint of the session: "whys the free play screen still
// really small?" and, separately, that tapping a drawn key does nothing.
//
// ☠️ REACHED THE WAY A PERSON REACHES IT. tools/void-check.mjs calls
// window.__show('freeplay'), which skips the button handler that builds the
// view, so it measures a screen the user never sees. This clicks the real
// control, then reads the geometry off the live FallsView and fires a real
// pointer event at a real key.
import { launch } from './cdp.mjs';

const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5,
  days: [], pmin: {}, songs: {}, lessons: {}, lib: { learning: true },
};
const b = await launch({ width: 1600, height: 950, scale: 1, port: 9681 });
const fails = [];
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1900));

  const pt = await b.eval(`(() => {
    const m = [...document.querySelectorAll('*')].filter((e) => !e.children.length
      && e.textContent.trim() === 'Free play' && e.getBoundingClientRect().width > 0);
    for (const el of m.reverse()) {
      const hit = el.closest('button, a, [role="button"]') || el;
      const r = hit.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);
      const t = document.elementFromPoint(cx, cy);
      if (t && (t === hit || hit.contains(t) || t.contains(hit))) return { x: Math.round(cx), y: Math.round(cy) };
    }
    return null;
  })()`);
  if (!pt) { console.log('no Free play control found'); process.exit(1); }
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await new Promise((r) => setTimeout(r, 1200));

  const geo = await b.eval(`(() => {
    const c = document.getElementById('freeplay-canvas');
    if (!c) return { err: 'no freeplay canvas' };
    const r = c.getBoundingClientRect();
    const v = window.__fpView;
    return {
      canvas: Math.round(r.width) + 'x' + Math.round(r.height),
      kbH: v ? Math.round(v.kbH) : null,
      kbFraction: v ? v.kbFraction : null,
      share: v ? Math.round((v.kbH / v.h) * 100) : null,
      hasOnKey: v ? typeof v.onKey === 'function' : null,
      keys: v && v.keyX ? v.keyX.size : null,
    };
  })()`);
  if (geo.err) { console.log(geo.err); process.exit(1); }
  console.log(`free play canvas ${geo.canvas}, keyboard ${geo.kbH}px = ${geo.share}% of it ` +
    `(fraction ${geo.kbFraction}), ${geo.keys} keys, tap wired: ${geo.hasOnKey}`);
  if (!geo.kbH) fails.push('no live FallsView on free play');
  if (geo.share !== null && geo.share < 40) fails.push(`keyboard is only ${geo.share}% of the screen: Mark called this "really small"`);
  if (!geo.hasOnKey) fails.push('tapping a key is not wired');

  // TAP A REAL KEY and prove a note actually sounded, by watching the same
  // entry point the P-45 uses rather than trusting that the click landed.
  const tapped = await b.eval(`(() => {
    const c = document.getElementById('freeplay-canvas');
    const v = window.__fpView;
    if (!v) return { err: 'no view' };
    window.__tapLog = [];
    const inner = v.onKey;
    v.onKey = (m, down) => { window.__tapLog.push(m + (down ? '+' : '-')); return inner?.(m, down); };
    const r = c.getBoundingClientRect();
    // middle of the keyboard band, a third of the way across
    const x = r.x + r.width * 0.34;
    const y = r.y + (v.h - v.kbH / 2) * (r.height / v.h);
    return { x: Math.round(x), y: Math.round(y) };
  })()`);
  if (tapped.err) fails.push(tapped.err);
  else {
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: tapped.x, y: tapped.y, button: 'left', clickCount: 1, pointerType: 'mouse' });
    await new Promise((r) => setTimeout(r, 180));
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tapped.x, y: tapped.y, button: 'left', clickCount: 1, pointerType: 'mouse' });
    await new Promise((r) => setTimeout(r, 260));
    const log = await b.eval('JSON.stringify(window.__tapLog || [])');
    console.log(`tap at ${tapped.x},${tapped.y} produced: ${log}`);
    if (JSON.parse(log).length < 2) fails.push('tapping a key produced no note-on and note-off');
  }
} finally { await b.close(); }

if (fails.length) { console.log('\nFAIL'); for (const f of fails) console.log('  ' + f); process.exit(1); }
console.log('\nfree play: the keys fill the screen and tapping one plays it');
