// THE OVERLAY GATE. apply-design Rule 12.
//
// "Property gates were all green on Mailroom for a week while the app was
// visibly the wrong design. Only pixels caught it."
//
// Both sides render in the SAME pinned headless Chrome at the same device pixel
// ratio, with motion frozen, and are clipped to the same measured box. The
// output is a percentage AND a diff image, because the number ranks and only
// the picture diagnoses.
//
// The gate splits the difference in two, and this is the part that matters:
//
//   CHROME  - every pixel outside the artwork boxes, split by SHAPE, not by
//             magnitude. A difference that forms a CONNECTED RUN is structural:
//             a missing border, a moved edge, the wrong glyph. A difference
//             that is a scattering of isolated pixels is antialiasing along an
//             edge both sides agree on.
//
// The first version of this split on magnitude, at a channel delta of 60.
// Codex broke it in one line: the design's hairline is #253129 on #000000, a
// maximum channel delta of 49, so REMOVING EVERY BORDER ON A SCREEN scored as
// antialiasing and passed with zero structural pixels. On a design whose own
// stylesheet says "structure carried by hairlines", that is the whole screen.
//
// Magnitude cannot separate the two, because a hairline and an antialiased
// glyph edge differ by similar amounts. Shape can: a missing 1px border is a
// run hundreds of pixels long, and antialiasing is specks. So differing pixels
// are grouped into connected components and a component of MIN_RUN or more is
// structural, whatever its contrast.
//
// Run: node tools/overlay.mjs            all screens, table + verdict
//      node tools/overlay.mjs library    one screen, keeps its diff images
import { launch } from './cdp.mjs';
import { decode, diff, encode } from './png.mjs';
import { writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'design-2026-08', 'overlay');
mkdirSync(OUT, { recursive: true });

const ALL = readdirSync(join(ROOT, 'design', 'extracted')).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''));
const want = process.argv.slice(2);
const SCREENS = want.length ? want : ALL;
const DSF = 2;
const MIN_RUN = 12;         // connected differing pixels that make a difference structural
const STRUCTURAL_BUDGET = 0;// and there is no honest reason for even one

// ?raw=1 stands the prototype scaffolding down, so the design side of the
// comparison is the CANON and not the deck animation, which hides the canon own
// resting deck layer while it runs.
const DESIGN = 'http://localhost:4180/design-2026-08/keys-prototype.html?raw=1';
const BUILD = 'http://localhost:4180/design-2026-08/canon-harness.html';

async function shotOf(b, url, isDesign, prep) {
  await b.goto(url);
  await b.freezeMotion();
  if (prep) await b.eval(prep);
  await new Promise((r) => setTimeout(r, 450));
  const data = await b.eval(`(() => {
    const el = ${isDesign ? `(document.querySelector('.pane.on').querySelector('.dv-card') || document.querySelector('.pane.on').firstElementChild)` : `document.querySelector('#host').firstElementChild`};
    if (!el) return null;
    window.scrollTo(0, 0);
    const r = el.getBoundingClientRect();
    // Document coordinates snapped to a whole DEVICE pixel, not a whole CSS
    // pixel. Rounding to CSS pixels at dsf 2 let the two sides land on opposite
    // halves of a device pixel: the whole page then differed by one device row
    // and the gate read 5.45% when a dy=+1 shift scored 0.63%. A percentage
    // that is really a sampling phase is exactly what gets waved through.
    const dsf = ${DSF};
    const snap = (v) => Math.round(v * dsf) / dsf;
    const box = { x: snap(r.x + scrollX), y: snap(r.y + scrollY),
                  width: Math.round(r.width), height: Math.round(r.height) };
    const art = [...el.querySelectorAll('img')].map((i) => {
      const b = i.getBoundingClientRect();
      return { x: b.x - r.x, y: b.y - r.y, w: b.width, h: b.height };
    });
    return { box, art };
  })()`);
  if (!data) throw new Error('nothing to clip on ' + url);
  return { png: await b.shot(data.box), box: data.box, art: data.art };
}

async function compare(b, screen, keepImages) {
  const design = await shotOf(b, DESIGN, true, `document.querySelector('.chip[data-go="${screen}"]').click(); true`);
  const build = await shotOf(b, `${BUILD}?screen=${screen}`, false, null);
  const sizeOk = design.box.width === build.box.width && design.box.height === build.box.height;

  const a = decode(design.png), c = decode(build.png);
  if (keepImages) {
    writeFileSync(join(OUT, 'design.png'), design.png);
    writeFileSync(join(OUT, 'build.png'), build.png);
    writeFileSync(join(OUT, 'diff.png'), encode(diff(a, c, { threshold: 8 })));
  }

  // artwork boxes from BOTH sides, padded, so an edge-antialiased sleeve pixel
  // is never miscounted as chrome
  const pad = 2 * DSF;
  const boxes = [...design.art, ...build.art];
  const inArt = (x, y) => boxes.some((bx) =>
    x >= bx.x * DSF - pad && x <= (bx.x + bx.w) * DSF + pad &&
    y >= bx.y * DSF - pad && y <= (bx.y + bx.h) * DSF + pad);

  // mark every differing pixel outside the artwork
  const h = Math.min(a.height, c.height), w = Math.min(a.width, c.width);
  const diffMask = new Uint8Array(w * h);
  let art = 0, differing = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * a.width + x) * 4, j = (y * c.width + x) * 4;
    const d = Math.max(Math.abs(a.data[i] - c.data[j]), Math.abs(a.data[i + 1] - c.data[j + 1]),
                       Math.abs(a.data[i + 2] - c.data[j + 2]));
    if (d <= 8) continue;
    if (inArt(x, y)) { art++; continue; }
    diffMask[y * w + x] = 1;
    differing++;
  }

  // group them into connected components (4-connected, iterative flood fill so a
  // long border run cannot blow the stack)
  let structural = 0, scattered = 0;
  const stray = [];
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let p = 0; p < diffMask.length; p++) {
    if (!diffMask[p] || seen[p]) continue;
    stack.length = 0;
    stack.push(p);
    seen[p] = 1;
    const component = [];
    while (stack.length) {
      const q = stack.pop();
      component.push(q);
      const qx = q % w, qy = (q / w) | 0;
      if (qx > 0 && diffMask[q - 1] && !seen[q - 1]) { seen[q - 1] = 1; stack.push(q - 1); }
      if (qx < w - 1 && diffMask[q + 1] && !seen[q + 1]) { seen[q + 1] = 1; stack.push(q + 1); }
      if (qy > 0 && diffMask[q - w] && !seen[q - w]) { seen[q - w] = 1; stack.push(q - w); }
      if (qy < h - 1 && diffMask[q + w] && !seen[q + w]) { seen[q + w] = 1; stack.push(q + w); }
    }
    if (component.length >= MIN_RUN) {
      structural += component.length;
      for (const q of component) {
        if (stray.length >= 40000) break;
        stray.push([Math.round((q % w) / DSF), Math.round(((q / w) | 0) / DSF)]);
      }
    } else scattered += component.length;
  }

  const clusters = {};
  for (const [x, y] of stray) { const k = Math.floor(x / 30) * 30 + ',' + Math.floor(y / 30) * 30; clusters[k] = (clusters[k] ?? 0) + 1; }
  return {
    screen, sizeOk, art, weak: scattered, strong: structural, differing,
    design: `${design.box.width}x${design.box.height}`, build: `${build.box.width}x${build.box.height}`,
    sleeves: design.art.length,
    clusters: Object.entries(clusters).sort((p, q) => q[1] - p[1]).slice(0, 6),
    pass: sizeOk && structural <= STRUCTURAL_BUDGET,
  };
}

const b = await launch({ width: 900, height: 2000, scale: DSF, port: 9471 });
const results = [];
try {
  for (const s of SCREENS) {
    try { results.push(await compare(b, s, SCREENS.length === 1)); }
    catch (e) { results.push({ screen: s, error: String(e.message ?? e), pass: false }); }
  }
} finally { await b.close(); }

console.log('screen        design      build       sleeves   art px  specks  STRUCTURAL   verdict');
console.log('-'.repeat(80));
for (const r of results) {
  if (r.error) { console.log(`${r.screen.padEnd(13)} ERROR  ${r.error}`); continue; }
  console.log(`${r.screen.padEnd(13)} ${r.design.padEnd(11)} ${r.build.padEnd(11)} ${String(r.sleeves).padStart(4)}   ` +
    `${String(r.art).padStart(8)}  ${String(r.weak).padStart(6)}  ${String(r.strong).padStart(10)}   ${r.pass ? 'PASS' : (r.sizeOk ? 'FAIL structural' : 'FAIL size')}`);
}
const bad = results.filter((r) => !r.pass);
console.log('-'.repeat(80));
console.log(`${results.length - bad.length}/${results.length} screens structurally identical (zero strong-difference pixels outside artwork)`);
for (const r of bad.filter((x) => x.clusters?.length)) {
  console.log(`\n${r.screen}: chrome defects by cluster - crop these and LOOK:`);
  for (const [k, n] of r.clusters) {
    const [x, y] = k.split(',');
    console.log(`  node tools/overlay.mjs ${r.screen} && node tools/crop.mjs design-2026-08/overlay/diff.png /tmp/d.png ${x} ${y} 160 80   (${n} px)`);
  }
}
process.exit(bad.length ? 1 : 0);
