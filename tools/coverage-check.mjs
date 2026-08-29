// Did the design actually give every control a home, or does it just LOOK
// complete? apply-design Rule 1 applied to the output rather than the brief.
//
// The artboards carry no ids, so coverage is checked by counting: for every
// screen, how many control-shaped elements did the design draw, against how
// many controls the app's JS actually addresses there. A screen with 16
// controls and 5 drawn things has a hole, whatever it looks like.
//
// Run: node tools/coverage-check.mjs
import { launch } from './cdp.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const inv = JSON.parse(readFileSync(join(ROOT, 'design-2026-08', 'control-inventory.json'), 'utf8'));

// prototype screen key -> the app screen it represents
const MAP = {
  library: 'library', play: 'play', keys12: null, path: 'path', lessons: 'lessons',
  lesson: 'lesson', task: 'task', echo: 'echo', rhythm: 'rhythm', improv: 'improv',
  freeplay: 'freeplay', metronome: 'metronome', trophies: 'trophies', takes: 'takes',
  calibrate: 'calibrate', touch: 'touch', overlays: null,
};

const b = await launch({ width: 900, height: 1600, scale: 1, port: 9357 });
const rows = [];
try {
  await b.goto('http://localhost:4180/design-2026-08/keys-prototype.html');
  for (const [key, appScreen] of Object.entries(MAP)) {
    await b.eval(`document.querySelector('.chip[data-go="${key}"]').click(); true`);
    await new Promise((r) => setTimeout(r, 200));
    const drawn = await b.eval(`(() => {
      const p = document.getElementById('pane-${key}');
      let n = 0;
      const seen = new Set();
      for (const e of p.querySelectorAll('*')) {
        const cs = getComputedStyle(e), r = e.getBoundingClientRect();
        const t = e.textContent.trim();
        const painted = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0;
        const control = painted && r.height >= 16 && r.height <= 90 && r.width >= 24 && r.width <= 400
          && e.children.length <= 3 && t.length > 0 && t.length <= 42;
        const isInput = /^(input|select|textarea|canvas)$/i.test(e.tagName);
        if (control || isInput) { n++; if (t) seen.add(t.slice(0, 20)); }
      }
      return { n, inputs: p.querySelectorAll('input,select,textarea').length,
               canvases: p.querySelectorAll('canvas').length,
               height: Math.round(p.getBoundingClientRect().height) };
    })()`);
    const want = appScreen ? (inv.screens[appScreen]?.length ?? 0) : null;
    rows.push({ key, appScreen, want, drawn: drawn.n, inputs: drawn.inputs, canvases: drawn.canvases, h: drawn.height });
  }
} finally { await b.close(); }

console.log('screen          app controls   drawn   inputs  canvas   verdict');
let holes = 0;
for (const r of rows) {
  let verdict = 'n/a';
  if (r.want !== null) {
    if (r.drawn >= r.want) verdict = 'covered';
    else if (r.drawn >= r.want * 0.7) verdict = 'thin';
    else { verdict = 'HOLE'; holes++; }
  }
  console.log(`${r.key.padEnd(15)} ${String(r.want ?? '-').padStart(6)}      ${String(r.drawn).padStart(6)}  ${String(r.inputs).padStart(6)}  ${String(r.canvases).padStart(6)}   ${verdict}`);
}
console.log(`\nscreens with a real hole: ${holes}`);

// the tags that break the app silently if the design changed them
const needTag = Object.values(inv.screens).flat().filter((c) => c.mustSupport?.length);
console.log(`\nload-bearing tags that must exist as real inputs across the design: ${needTag.length}`);
const totalInputs = rows.reduce((a, r) => a + r.inputs, 0);
console.log(`real <input>/<select>/<textarea> elements in the whole prototype: ${totalInputs}`);
console.log(needTag.map((c) => `  ${c.id} <${c.tag}${c.type ? ' ' + c.type : ''}>`).join('\n'));

writeFileSync(join(ROOT, 'design-2026-08', 'coverage.json'), JSON.stringify({ rows, holes }, null, 2));
