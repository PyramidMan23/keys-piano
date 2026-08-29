// Pull the deck's numbers out of artboard 8a and write them as source.
//
// The falling-notes deck is a canvas painted at 60fps, so a still artboard can
// never be pixel-diffed against it. What the artboard CAN carry is the values,
// and 8a was commissioned that way: every panel is label/value pairs. So the
// implementation reads them from here instead of from a number somebody typed
// while looking at a picture, and `node tools/deck-spec.mjs --check` fails if
// the design changes a value the code still hardcodes.
//
// Run: node tools/deck-spec.mjs
import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'design', 'extracted', 'deck-spec.json');

const b = await launch({ width: 1700, height: 1200, scale: 1, port: 9580 });
let spec;
try {
  await b.goto('http://localhost:4180/design-2026-08/keys-prototype.html?raw=1');
  await b.eval(`document.querySelector('.chip[data-go="deck"]').click(); true`);
  await new Promise((r) => setTimeout(r, 600));
  spec = await b.eval(`(() => {
    const pane = document.querySelector('.pane.on');
    const card = pane.querySelector('.dv-card') || pane.firstElementChild;
    // Each panel is a numbered block; inside it the values are laid out as a
    // label followed by its value. Walk the leaves in document order and pair
    // them, which is exactly how the board reads on screen.
    const panels = {};
    let current = null;
    const leaves = [...card.querySelectorAll('*')]
      .filter((e) => !e.children.length && e.textContent.trim())
      .map((e) => e.textContent.trim());
    for (let i = 0; i < leaves.length; i++) {
      const t = leaves[i];
      if (/^0\\d$/.test(t)) { current = { n: t, title: leaves[i + 1] ?? '', pairs: {} }; panels[t] = current; i++; continue; }
      if (!current) continue;
      const next = leaves[i + 1];
      // a value looks like it carries a number, a colour or a keyword list
      if (next && /[0-9#]|none|hidden|shared/i.test(next) && !/^0\\d$/.test(next)) {
        current.pairs[t] = next;
        i++;
      } else if (t.length > 40) {
        current.note = t;
      }
    }
    return panels;
  })()`);
} finally { await b.close(); }

writeFileSync(OUT, JSON.stringify(spec, null, 1));
const panels = Object.values(spec);
console.log(`${panels.length} panels`);
for (const p of panels) {
  console.log(`\n${p.n} ${p.title}  (${Object.keys(p.pairs).length} values)`);
  for (const [k, v] of Object.entries(p.pairs)) console.log(`   ${k.padEnd(22)} ${v}`);
}
console.log(`\nwrote ${OUT}`);
