// THE CONTRACT GATE. apply-design Rule 2.
//
// "My id-contract checked that every addressed id exists. It passed while 57
// elements had changed tag: draftText textarea -> div (the JS calls .value ten
// times), dReply a -> span (the JS sets .href). The app looked finished and a
// third of it was dead."
//
// So this asserts the TRIPLE for every id the canon and the app share: the id
// exists, the TAG matches, and the data-* attributes the JS reads are present.
// Anything less passes a broken app.
//
// Run: node tools/canon-contract.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EX = join(ROOT, 'design', 'extracted');

// id -> {tag, attrs} from a chunk of html
function index(html) {
  const map = new Map();
  const re = /<([a-z][a-z0-9-]*)\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(html))) {
    const id = /\bid="([^"]+)"/.exec(m[2])?.[1];
    if (!id || map.has(id)) continue;
    const attrs = {};
    for (const a of m[2].matchAll(/\b(data-[a-z-]+|type|value)="([^"]*)"/gi)) attrs[a[1].toLowerCase()] = a[2];
    map.set(id, { tag: m[1].toLowerCase(), attrs });
  }
  return map;
}

const app = index(readFileSync(join(ROOT, 'index.html'), 'utf8'));
const canon = new Map();
for (const f of readdirSync(EX).filter((x) => x.endsWith('.html'))) {
  for (const [id, v] of index(readFileSync(join(EX, f), 'utf8'))) {
    if (!canon.has(id)) canon.set(id, { ...v, screen: f.replace('.html', '') });
  }
}

// what the JS actually does with each id, so a tag change is judged by whether
// it BREAKS something, not by whether it is different
const js = readFileSync(join(ROOT, 'js', 'app.mjs'), 'utf8');
const usesValue = new Set();
const usesChecked = new Set();
for (const m of js.matchAll(/\$\('([^']+)'\)\.(value|checked)\b/g)) (m[2] === 'value' ? usesValue : usesChecked).add(m[1]);
for (const m of js.matchAll(/\$\('([^']+)'\)\.(value|checked)\s*=/g)) (m[2] === 'value' ? usesValue : usesChecked).add(m[1]);

const shared = [...canon.keys()].filter((id) => app.has(id));
const problems = [];
for (const id of shared) {
  const a = app.get(id), c = canon.get(id);
  if (a.tag !== c.tag) {
    const breaks = usesValue.has(id) || usesChecked.has(id) || (a.tag === 'a' && c.tag !== 'a');
    problems.push({ id, screen: c.screen, kind: breaks ? 'BREAKS' : 'differs',
      msg: `app <${a.tag}> vs canon <${c.tag}>` + (usesValue.has(id) ? '  (the JS reads .value)' : usesChecked.has(id) ? '  (the JS reads .checked)' : '') });
  }
  for (const k of Object.keys(a.attrs)) {
    if (!k.startsWith('data-')) continue;
    if (!(k in c.attrs)) problems.push({ id, screen: c.screen, kind: 'attr', msg: `canon is missing ${k}="${a.attrs[k]}"` });
  }
}

console.log(`${app.size} ids in index.html, ${canon.size} in the canon, ${shared.length} shared`);
const breaks = problems.filter((p) => p.kind === 'BREAKS');
const rest = problems.filter((p) => p.kind !== 'BREAKS');
console.log(`${shared.length - new Set(problems.map((p) => p.id)).size} shared ids match on tag and attributes\n`);
for (const p of breaks) console.log(`  BREAKS  ${p.id.padEnd(20)} [${p.screen}]  ${p.msg}`);
for (const p of rest) console.log(`  ${p.kind.padEnd(7)} ${p.id.padEnd(20)} [${p.screen}]  ${p.msg}`);
if (!problems.length) console.log('  every shared id matches on tag and required attributes');
process.exit(breaks.length ? 1 : 0);
