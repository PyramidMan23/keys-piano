// GENERATED control inventory. Never hand-type this (apply-design Rule 6: a
// hand-written contract invented a control that did not exist and cost a whole
// round). This reads the real app and reports, per screen:
//   - every id the JS actually addresses, with the ELEMENT TYPE it must be
//   - every data-* attribute and class the JS depends on
//   - which ids the JS writes .value / .checked / .href / .src to, because those
//     are the ones that break silently if the design changes the tag
//
// apply-design Rule 2: a contract that only checks "the id exists" passes a
// broken app. Mailroom shipped with 57 elements whose TAG had changed: a
// textarea became a div while the JS called .value on it ten times.
//
// Run: node tools/control-inventory.mjs [--json]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const jsFiles = readdirSync(join(ROOT, 'js')).filter((f) => f.endsWith('.mjs'));
const js = Object.fromEntries(jsFiles.map((f) => [f, readFileSync(join(ROOT, 'js', f), 'utf8')]));
const allJs = Object.values(js).join('\n');

// ---- what the markup actually declares ----
// crude but honest tag+attr scan; we only need id -> tag and its data-*
const declared = new Map();
for (const m of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
  const [, tag, attrs] = m;
  const id = /\bid="([^"]+)"/.exec(attrs)?.[1];
  if (!id) continue;
  const data = [...attrs.matchAll(/\b(data-[\w-]+)=/g)].map((d) => d[1]);
  const type = /\btype="([^"]+)"/.exec(attrs)?.[1] ?? null;
  declared.set(id, { tag: tag.toLowerCase(), type, data });
}

// which screen each id sits in
const screens = [...html.matchAll(/<main id="(screen-[a-z0-9-]+)"([\s\S]*?)<\/main>/g)]
  .map(([, id, body]) => ({ screen: id.replace('screen-', ''), body }));
const screenOf = (id) => screens.find((s) => new RegExp(`id="${id}"`).test(s.body))?.screen ?? '(outside a screen)';

// ---- what the JS addresses ----
// $('x') is this app's helper, plus getElementById and querySelector('#x').
//
// ☠️ THIS ALONE IS NOT ENOUGH, and Codex caught it: the app also addresses ids
// through variables and template literals, which no literal scan can see.
//   for (const id of ['sec-learning', ...]) $(id)      4 ids
//   fill('list-learning', ...) -> const el = $(id)      3 ids
//   const id = 'rail-' + btn.dataset.rail; $(id)        3 ids
//   $(`keys12-${mode}`)                                 4 grids
// That was 10 real controls missing from a "complete" inventory, so the count
// went from a confident 170 to an actual 180. The fix is to stop trusting the
// JS scan as the source of truth: EVERY id in the markup is a control the
// design must account for, however the script reaches it.
const addressed = new Set();
for (const re of [/\$\('([\w-]+)'\)/g, /getElementById\('([\w-]+)'\)/g, /querySelector\('#([\w-]+)'\)/g]) {
  for (const m of allJs.matchAll(re)) addressed.add(m[1]);
}
// string literals anywhere in the JS that match an id declared in the markup:
// catches the array-loop and fill() patterns above
for (const m of allJs.matchAll(/['"`]([\w-]{3,})['"`]/g)) {
  if (declared.has(m[1])) addressed.add(m[1]);
}
// and every id in the markup, because a control that exists must be designed
// even if the script never names it (the 12-keys grids are built by a renderer)
for (const id of declared.keys()) addressed.add(id);

// ---- which properties the JS demands of each id (this is what makes tag matter) ----
const PROPS = ['value', 'checked', 'href', 'src', 'selectedIndex', 'files', 'play', 'pause', 'getContext'];
const demands = new Map();
for (const id of addressed) {
  const hits = new Set();
  for (const p of PROPS) {
    // $('id').prop  or  const x = $('id'); ... x.prop  (first form only: honest and cheap)
    if (new RegExp(`\\$\\('${id}'\\)\\.${p}\\b`).test(allJs)) hits.add(p);
    if (new RegExp(`getElementById\\('${id}'\\)\\.${p}\\b`).test(allJs)) hits.add(p);
  }
  if (hits.size) demands.set(id, [...hits]);
}

// ---- data-* the JS reads, anywhere ----
const dataUsed = new Set();
for (const m of allJs.matchAll(/dataset\.([\w]+)/g)) dataUsed.add('data-' + m[1].replace(/([A-Z])/g, '-$1').toLowerCase());
for (const m of allJs.matchAll(/\[data-([\w-]+)/g)) dataUsed.add('data-' + m[1]);
for (const m of allJs.matchAll(/getAttribute\('(data-[\w-]+)'\)/g)) dataUsed.add(m[1]);

// ---- report ----
const rows = [...addressed].sort().map((id) => {
  const d = declared.get(id);
  return {
    id,
    screen: d ? screenOf(id) : '(NOT IN MARKUP - built by JS)',
    tag: d?.tag ?? null,
    type: d?.type ?? null,
    data: d?.data ?? [],
    mustSupport: demands.get(id) ?? [],
  };
});

const byScreen = {};
for (const r of rows) (byScreen[r.screen] ??= []).push(r);

if (process.argv.includes('--json')) {
  writeFileSync(join(ROOT, 'design-2026-08', 'control-inventory.json'),
    JSON.stringify({ generated: 'tools/control-inventory.mjs', screens: byScreen, dataAttributesJsReads: [...dataUsed].sort() }, null, 2));
  console.log('wrote design-2026-08/control-inventory.json');
}

console.log(`ids the JS addresses: ${addressed.size}`);
console.log(`of those, declared in index.html: ${rows.filter((r) => r.tag).length}`);
console.log(`built by JS at runtime (no static markup): ${rows.filter((r) => !r.tag).length}`);
console.log(`ids whose TAG is load-bearing (JS reads .value/.checked/.href/...): ${rows.filter((r) => r.mustSupport.length).length}\n`);

for (const [screen, list] of Object.entries(byScreen).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${screen}  (${list.length})`);
  for (const r of list) {
    const bits = [r.tag ? `<${r.tag}${r.type ? ' type=' + r.type : ''}>` : 'RUNTIME'];
    if (r.mustSupport.length) bits.push(`NEEDS .${r.mustSupport.join(' .')}`);
    if (r.data.length) bits.push(r.data.join(' '));
    console.log(`   ${r.id.padEnd(22)} ${bits.join('  ')}`);
  }
}
console.log(`\ndata-* attributes the JS reads: ${[...dataUsed].sort().join(' ')}`);
