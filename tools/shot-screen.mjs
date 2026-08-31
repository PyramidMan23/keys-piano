// Screenshot any screen, reached the way a PERSON reaches it (clicking the
// control), not via window.__show which skips the handlers that build the view.
//   node tools/shot-screen.mjs "Free play" out.png [w] [h]
import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const label = process.argv[2] || 'Free play';
const out = process.argv[3] || 'screen.png';
const W = Number(process.argv[4] || 1600), H = Number(process.argv[5] || 950);
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: ['2026-08-29', '2026-08-30', '2026-08-31'], pmin: { '2026-08-31': 24 },
  songs: { 'fur-elise': { plays: 79, stars: 3, best: 96 }, 'still-dre-easy': { plays: 22, stars: 3, best: 91 } },
  lessons: {}, lib: { learning: true },
};
const b = await launch({ width: W, height: H, scale: 1, port: 9682 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 2000));
  const pt = await b.eval(`(() => {
    const m = [...document.querySelectorAll('*')].filter((e) => !e.children.length
      && e.textContent.trim() === ${JSON.stringify(label)} && e.getBoundingClientRect().width > 0);
    for (const el of m.reverse()) {
      const hit = el.closest('button, a, [role="button"]') || el;
      const r = hit.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);
      const t = document.elementFromPoint(cx, cy);
      if (t && (t === hit || hit.contains(t) || t.contains(hit))) return { x: Math.round(cx), y: Math.round(cy) };
    }
    return null;
  })()`);
  if (!pt) { console.log('control not found: ' + label); process.exit(1); }
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await new Promise((r) => setTimeout(r, 1500));
  const png = await b.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(out, Buffer.from(png.data, 'base64'));
  console.log('wrote ' + out);
} finally { await b.close(); }
