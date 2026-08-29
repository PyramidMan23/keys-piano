// Which ELEMENT is the wrong size?
//
// The overlay says a screen differs and roughly where; this says which node.
// Both sides render the same markup, so the DOMs walk in parallel by index and
// the first divergence is the cause - everything after it is displacement.
//
// Run: node tools/box-diff.mjs <screen> [limit]
import { launch } from './cdp.mjs';

const screen = process.argv[2] ?? 'library';
const LIMIT = +(process.argv[3] ?? 12);
const probe = `(() => {
  const pane = document.querySelector('.pane.on');
  const el = pane ? (pane.querySelector('.dv-card') || pane.firstElementChild)
                  : document.querySelector('#host').firstElementChild;
  const r0 = el.getBoundingClientRect();
  return [...el.querySelectorAll('*')].map((e, i) => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    return { i, tag: e.tagName,
             x: +(r.x - r0.x).toFixed(2), y: +(r.y - r0.y).toFixed(2),
             w: +r.width.toFixed(2), h: +r.height.toFixed(2),
             text: (e.children.length ? '' : (e.textContent || '').trim()).slice(0, 28),
             styleW: e.style.width || '', styleH: e.style.height || '',
             attrW: e.getAttribute('width') || '', attrH: e.getAttribute('height') || '',
             disp: cs.display, font: cs.fontSize + '/' + cs.lineHeight, ar: cs.aspectRatio };
  });
})()`;

const b = await launch({ width: 900, height: 2000, scale: 1, port: 9492 });
try {
  await b.goto(`http://localhost:4180/design-2026-08/keys-prototype.html?raw=1`);
  await b.freezeMotion();
  await b.eval(`document.querySelector('.chip[data-go="${screen}"]').click(); true`);
  await new Promise((r) => setTimeout(r, 450));
  const d = await b.eval(probe);

  await b.goto(`http://localhost:4180/design-2026-08/canon-harness.html?screen=${screen}`);
  await b.freezeMotion();
  await new Promise((r) => setTimeout(r, 450));
  const c = await b.eval(probe);

  console.log(`${screen}: design ${d.length} nodes, build ${c.length} nodes`);
  if (d.length !== c.length) console.log('NODE COUNT DIFFERS - the markup is not the same, stop and fix that first');
  let shown = 0;
  for (let i = 0; i < Math.min(d.length, c.length) && shown < LIMIT; i++) {
    const a = d[i], e = c[i];
    const dh = +(e.h - a.h).toFixed(2), dw = +(e.w - a.w).toFixed(2), dy = +(e.y - a.y).toFixed(2);
    if (Math.abs(dh) < 0.5 && Math.abs(dw) < 0.5) continue;
    shown++;
    console.log(`\n[${i}] <${a.tag}> ${a.text ? JSON.stringify(a.text) : ''}`);
    console.log(`   design  ${a.w}x${a.h} at y=${a.y}   style(${a.styleW},${a.styleH}) attr(${a.attrW},${a.attrH}) ${a.disp} ${a.font} ar=${a.ar}`);
    console.log(`   build   ${e.w}x${e.h} at y=${e.y}   style(${e.styleW},${e.styleH}) attr(${e.attrW},${e.attrH}) ${e.disp} ${e.font} ar=${e.ar}`);
    console.log(`   DELTA   w${dw >= 0 ? '+' : ''}${dw}  h${dh >= 0 ? '+' : ''}${dh}  y${dy >= 0 ? '+' : ''}${dy}`);
  }
  if (!shown) console.log('every element matches within half a pixel');
} finally { await b.close(); }
