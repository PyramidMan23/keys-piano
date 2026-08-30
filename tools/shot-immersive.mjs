// Screenshot the immersed play deck, so the Play again button and the finger
// numbers can be LOOKED AT rather than inferred from measurements.
import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const OUT = process.argv[2] || 'immersive.png';
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [], pmin: {}, lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: { 'still-dre-easy': { plays: 22, stars: 3, best: 91 } }, lessons: {}, lib: { learning: true },
};

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9680 });
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
  if (process.argv.includes('--no-letters')) {
    await b.eval(`(() => { window.__falls.cueLetters = false; return true; })()`);
  }
  await b.eval('window.__deckImmersion(true), true');
  await new Promise((r) => setTimeout(r, 900));
  const png = await b.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(OUT, Buffer.from(png.data, 'base64'));
  console.log('wrote ' + OUT);
} finally { await b.close(); }
