// Prove the falls deck actually animates, by sampling the canvas twice and
// comparing. "I added an animation" is a claim; changed pixels are evidence.
// Motion is NOT frozen here on purpose, unlike the overlay harness.
import { launch } from './cdp.mjs';
import { decode, diff } from './png.mjs';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const b = await launch({ width: 900, height: 1200, scale: 1, port: 9367 });
try {
  await b.goto('http://localhost:4180/design-2026-08/keys-prototype.html');
  await b.eval(`document.querySelector('.chip[data-go="play"]').click(); true`);
  await new Promise((r) => setTimeout(r, 700));

  const box = await b.eval(`(() => {
    const c = document.querySelector('#pane-play canvas');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY),
             width: Math.round(r.width), height: Math.round(r.height),
             pixels: c.width + 'x' + c.height };
  })()`);
  if (!box) { console.log('FAIL  no canvas on the play screen'); process.exit(1); }
  console.log(`canvas on screen: ${box.width}x${box.height} css, backing store ${box.pixels}`);

  const a = decode(await b.shot({ x: box.x, y: box.y, width: box.width, height: box.height }));
  await new Promise((r) => setTimeout(r, 900));
  const c = decode(await b.shot({ x: box.x, y: box.y, width: box.width, height: box.height }));

  const d = diff(a, c, { threshold: 8 });
  writeFileSync(join(ROOT, 'design-2026-08', 'proto-shots', 'falls-motion-diff.png'),
    (await import('./png.mjs')).encode(d));

  // is anything drawn at all, and do the app's real hand colours appear?
  const painted = await b.eval(`(() => {
    const c = document.querySelector('#pane-play canvas');
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let lit = 0, amber = 0, cyan = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] + d[i+1] + d[i+2] > 40) lit++;
      if (d[i] > 180 && d[i+1] > 120 && d[i+1] < 200 && d[i+2] < 110) amber++;
      if (d[i] < 140 && d[i+1] > 170 && d[i+2] > 190) cyan++;
    }
    return { lit, amber, cyan, total: d.length / 4 };
  })()`);

  console.log(`pixels differing between two frames 0.9s apart: ${d.pct}%  (${d.differing} of ${d.total})`);
  console.log(`lit pixels: ${painted.lit}  right-hand amber: ${painted.amber}  left-hand cyan: ${painted.cyan}`);
  const movingOk = d.pct > 1.5;
  const paintedOk = painted.lit > 500 && painted.amber > 100 && painted.cyan > 50;
  console.log(`\n${movingOk ? 'PASS' : 'FAIL'}  the deck is genuinely animating`);
  console.log(`${paintedOk ? 'PASS' : 'FAIL'}  it is drawing both hands in the app's real colours`);
  process.exit(movingOk && paintedOk ? 0 : 1);
} finally { await b.close(); }
