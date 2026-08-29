// Does the canon actually have a HOME for every control the app addresses?
//
// apply-design Rule 1, learned on Mailroom: a design tool draws SURFACES, an
// app is made of CONTROLS. Thirteen beautiful screens covered ~40% of the real
// controls there, and the gap only surfaced after the port had failed twice.
//
// The canon carries no ids, so the match is by LABEL TEXT: the words a person
// would point at. A control whose label appears nowhere in any artboard has no
// home, and that is a design gap to take BACK to Claude Design, never something
// to invent in the port.
//
// Run: node tools/canon-coverage.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EX = join(ROOT, 'design', 'extracted');

// every text the canon shows, anywhere, normalised
const canonText = new Set();
const screens = readdirSync(EX).filter((f) => f.endsWith('.json'));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
for (const f of screens) {
  const d = JSON.parse(readFileSync(join(EX, f), 'utf8'));
  for (const n of d.nodes) if (n.text) canonText.add(norm(n.text));
}

// every control in the app, with the label a person sees
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const controls = [];
const tagRe = /<(button|input|select|textarea|a)\b([^>]*)>([\s\S]*?)<\/\1>|<(input|select)\b([^>]*)\/?>/gi;
let m;
while ((m = tagRe.exec(html))) {
  const attrs = (m[2] ?? m[5] ?? '');
  const id = /\bid="([^"]+)"/.exec(attrs)?.[1];
  if (!id) continue;
  const inner = (m[3] ?? '').replace(/<[^>]*>/g, ' ');
  const aria = /aria-label="([^"]+)"/.exec(attrs)?.[1] ?? '';
  const ph = /placeholder="([^"]+)"/.exec(attrs)?.[1] ?? '';
  controls.push({ id, tag: (m[1] ?? m[4]).toLowerCase(), label: (inner || aria || ph).trim() });
}

const covered = [], missing = [];
for (const c of controls) {
  const l = norm(c.label);
  if (!l) { missing.push({ ...c, why: 'no label to match on' }); continue; }
  let hit = canonText.has(l);
  if (!hit) for (const t of canonText) { if (t && (t.includes(l) || l.includes(t)) && Math.min(t.length, l.length) >= 4) { hit = true; break; } }
  (hit ? covered : missing).push(c);
}

console.log(`${screens.length} artboards, ${canonText.size} distinct texts`);
console.log(`${controls.length} labelled controls in index.html`);
console.log(`  covered by the canon: ${covered.length}`);
console.log(`  NO HOME IN THE CANON: ${missing.length}\n`);
for (const c of missing) console.log(`  ${c.id.padEnd(22)} <${c.tag}>  ${c.why ?? JSON.stringify(c.label.slice(0, 48))}`);
