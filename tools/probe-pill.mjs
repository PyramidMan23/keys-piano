// One-off look at the "Play again" pill itself: does its icon draw, does it
// rest quiet, and does it actually wake on hover and on keyboard focus?
// Opacity is the whole point of the control ("semi opaque, but we know it's
// there"), and that is a computed value, not something a screenshot settles.
import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [], pmin: {}, lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: { 'still-dre-easy': { plays: 22, stars: 3, best: 91 } }, lessons: {}, lib: { learning: true },
};

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9686 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1900));
  const pt = await b.eval(`(() => {
    for (const label of ['Still D.R.E.', 'Start']) {
      const m = [...document.querySelectorAll('*')].filter((e) => !e.children.length
        && e.textContent.trim() === label && e.getBoundingClientRect().width > 0);
      for (const el of m.reverse()) {
        const hit = el.closest('button, a, [role="button"]') || el;
        const r = hit.getBoundingClientRect();
        const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);
        const t = document.elementFromPoint(cx, cy);
        if (t && (t === hit || hit.contains(t) || t.contains(hit))) return { x: Math.round(cx), y: Math.round(cy) };
      }
    }
    return null;
  })()`);
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await new Promise((r) => setTimeout(r, 1400));
  await b.eval('window.__deckImmersion(true), true');
  await new Promise((r) => setTimeout(r, 900));

  console.log(await b.eval(`(() => {
    const pill = [...document.querySelectorAll('button')].find((e) => /Play again/.test(e.textContent));
    const svg = pill && pill.querySelector('svg');
    const cs = getComputedStyle(pill);
    const r = pill.getBoundingClientRect(), sr = svg && svg.getBoundingClientRect();
    return 'resting  opacity=' + cs.opacity + '  border=' + cs.borderColor + '  bg=' + cs.backgroundColor
      + '\\nicon     ' + (sr ? Math.round(sr.width) + 'x' + Math.round(sr.height) + ' at ' + Math.round(sr.x) + ',' + Math.round(sr.y) : 'MISSING')
      + '\\npill     ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' at ' + Math.round(r.x) + ',' + Math.round(r.y)
      + '\\nlabel    "' + pill.textContent.trim() + '"  aria="' + pill.getAttribute('aria-label') + '"';
  })()`));

  // RESTING first. This is the state Mark actually asked about - "semi opaque,
  // but we know it's there" - and it is the one a screenshot taken after a
  // hover silently replaces with the awake state.
  {
    const png = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: 1180, y: 0, width: 238, height: 110, scale: 4 } });
    writeFileSync((process.argv[2] || 'pill.png').replace(/\.png$/, '-resting.png'), Buffer.from(png.data, 'base64'));
    console.log('wrote the RESTING crop');
  }

  // wake it the way a finger or a Tab key would, and re-read
  await b.eval(`(() => { const p = [...document.querySelectorAll('button')].find((e) => /Play again/.test(e.textContent));
    p.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true })); return true; })()`);
  await new Promise((r) => setTimeout(r, 400));
  console.log(await b.eval(`(() => {
    const p = [...document.querySelectorAll('button')].find((e) => /Play again/.test(e.textContent));
    const cs = getComputedStyle(p);
    return 'awake    opacity=' + cs.opacity + '  border=' + cs.borderColor + '  bg=' + cs.backgroundColor;
  })()`));

  const png = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: 1180, y: 0, width: 238, height: 110, scale: 4 } });
  writeFileSync(process.argv[2] || 'pill.png', Buffer.from(png.data, 'base64'));
  console.log('\\nwrote a 4x crop of the corner');
} finally { await b.close(); }
