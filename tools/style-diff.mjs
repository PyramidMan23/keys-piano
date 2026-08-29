// Every computed property that differs on one node, design vs build.
// The last resort when two nodes look identical and measure differently.
// Run: node tools/style-diff.mjs <screen> <nodeIndex>
import { launch } from './cdp.mjs';
const screen = process.argv[2] ?? 'library';
const idx = +(process.argv[3] ?? 0);
const probe = `(() => {
  const pane = document.querySelector('.pane.on');
  const el = pane ? (pane.querySelector('.dv-card') || pane.firstElementChild)
                  : document.querySelector('#host').firstElementChild;
  const n = [...el.querySelectorAll('*')][${idx}];
  if (!n) return null;
  const cs = getComputedStyle(n), out = {};
  for (const p of cs) out[p] = cs.getPropertyValue(p);
  out['__rect'] = JSON.stringify(n.getBoundingClientRect().toJSON());
  out['__childNodes'] = [...n.childNodes].map((c) => c.nodeType === 3 ? 'text:' + JSON.stringify(c.data.slice(0, 12)) : c.nodeName).join(' ');
  return out;
})()`;
const b = await launch({ width: 900, height: 2000, scale: 1, port: 9497 });
try {
  await b.goto('http://localhost:4180/design-2026-08/keys-prototype.html?raw=1');
  await b.eval(`document.querySelector('.chip[data-go="${screen}"]').click(); true`);
  await new Promise((r) => setTimeout(r, 700));
  const d = await b.eval(probe);
  await b.goto(`http://localhost:4180/design-2026-08/canon-harness.html?screen=${screen}`);
  await new Promise((r) => setTimeout(r, 700));
  const c = await b.eval(probe);
  if (!d || !c) { console.log('node not found'); process.exit(1); }
  let n = 0;
  for (const k of Object.keys(d)) {
    if (d[k] === c[k]) continue;
    if (k === '__rect') continue;
    n++;
    console.log(`${k}\n   design ${d[k]}\n   build  ${c[k]}`);
  }
  console.log(`\n${n} properties differ`);
  console.log('design rect ' + d.__rect + '\nbuild  rect ' + c.__rect);
} finally { await b.close(); }
