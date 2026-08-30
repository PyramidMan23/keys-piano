// Compare the DOM geometry of ONE horizontal band on both sides of the overlay.
// The overlay says WHERE pixels differ; this says WHICH ELEMENT is at fault.
// Usage: node tools/band-probe.mjs library-desktop 490 738
import { launch } from './cdp.mjs';

const screen = process.argv[2] ?? 'library-desktop';
const y0 = Number(process.argv[3] ?? 0), y1 = Number(process.argv[4] ?? 9999);
const DESIGN = 'http://localhost:4180/design-2026-08/keys-prototype.html?raw=1';
const BUILD = 'http://localhost:4180/design-2026-08/canon-harness.html';

const dump = (y0, y1) => `(() => {
  const el = document.querySelector('.pane.on')
    ? (document.querySelector('.pane.on').querySelector('.dv-card') || document.querySelector('.pane.on').firstElementChild)
    : document.querySelector('#host').firstElementChild;
  const r = el.getBoundingClientRect();
  const out = [];
  for (const e of el.querySelectorAll('*')) {
    const b = e.getBoundingClientRect();
    const y = Math.round(b.y - r.y), x = Math.round(b.x - r.x);
    if (b.height < 1 || b.width < 1) continue;
    if (y + b.height < ${y0} || y > ${y1}) continue;
    const cs = getComputedStyle(e);
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').slice(0, 26);
    out.push([x, y, Math.round(b.width), Math.round(b.height), e.tagName.toLowerCase(),
      cs.backgroundColor, cs.borderTopWidth + '/' + cs.borderTopColor, cs.color, own].join(' | '));
  }
  return out.join('\\n');
})()`;

const b = await launch({ width: 1700, height: 2000, scale: 2, port: 9473 });
let D, B;
try {
  await b.goto(DESIGN);
  await b.freezeMotion();
  await b.eval(`document.querySelector('.chip[data-go="${screen}"]').click(); true`);
  await new Promise((r) => setTimeout(r, 450));
  D = (await b.eval(dump(y0, y1))).split('\n');
  await b.goto(`${BUILD}?screen=${screen}`);
  await b.freezeMotion();
  await new Promise((r) => setTimeout(r, 450));
  B = (await b.eval(dump(y0, y1))).split('\n');
} finally { await b.close(); }

console.log(`design ${D.length} elements, build ${B.length} elements in y ${y0}..${y1}\n`);
const key = (l) => l.split(' | ').slice(0, 5).join('|');   // position + size + tag
const dk = new Map(D.map((l) => [key(l), l])), bk = new Map(B.map((l) => [key(l), l]));
const only = (a, b2, label) => {
  const rows = [...a].filter(([k]) => !b2.has(k));
  console.log(`--- ${label} only (${rows.length}) ---`);
  for (const [, l] of rows.slice(0, 30)) console.log('  ' + l);
};
only(dk, bk, 'DESIGN');
only(bk, dk, 'BUILD');
console.log('\n--- same box, different paint ---');
let n = 0;
for (const [k, l] of dk) {
  const m = bk.get(k);
  if (m && m !== l) { console.log('  D ' + l + '\n  B ' + m); if (++n >= 12) break; }
}
if (!n) console.log('  none');
