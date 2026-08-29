// Which addressed controls does the canon nest INSIDE a container the app
// rebuilds with innerHTML?
//
// This killed the path screen: the canon puts #path-go inside #path-skills, and
// renderPath() sets $('path-skills').innerHTML = ..., so the button the very
// next line writes to has just been destroyed. The id existed at boot, resolved
// fine, and was null by the time it mattered - which is why an existence check
// at startup proves nothing.
//
// Run: node tools/canon-nesting.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EX = join(ROOT, 'design', 'extracted');

// every id whose innerHTML the app assigns
const src = ['app.mjs', 'path.mjs', 'lessons.mjs', 'takes.mjs']
  .map((f) => { try { return readFileSync(join(ROOT, 'js', f), 'utf8'); } catch { return ''; } }).join('\n');
// BOTH forms wipe children. textContent is the one that is easy to miss: it
// reads like "set some text" and it deletes every element inside. That is
// exactly how #path-go died - the canon nests it inside #path-reason, and
// renderPath's very first line sets that element's textContent, so the button
// the next line writes to had already been destroyed.
const rebuilt = new Set();
for (const prop of ['innerHTML', 'textContent', 'innerText']) {
  const direct = new RegExp(String.raw`\$\('([^']+)'\)\.` + prop + String.raw`\s*=`, 'g');
  for (const m of src.matchAll(direct)) rebuilt.add(m[1]);
  const viaConst = new RegExp(String.raw`const\s+(\w+)\s*=\s*\$\('([^']+)'\);[\s\S]{0,400}?\1\.` + prop + String.raw`\s*=`, 'g');
  for (const m of src.matchAll(viaConst)) rebuilt.add(m[2]);
}

const problems = [];
for (const f of readdirSync(EX).filter((x) => x.endsWith('.html'))) {
  const html = readFileSync(join(EX, f), 'utf8');
  // walk the tag stream keeping a stack of open ids
  const stack = [];
  const re = /<(\/?)([a-z][a-z0-9-]*)\b([^>]*?)(\/?)>/gi;
  const VOID = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'i-void']);
  let m;
  while ((m = re.exec(html))) {
    const [, close, tag, attrs, selfClose] = m;
    if (close) { const top = stack.pop(); void top; continue; }
    const id = /\bid="([^"]+)"/.exec(attrs)?.[1] ?? null;
    if (id) {
      const owner = stack.find((s) => s && rebuilt.has(s));
      if (owner) problems.push({ screen: f.replace('.html', ''), id, owner });
    }
    if (!selfClose && !VOID.has(tag.toLowerCase())) stack.push(id);
  }
}

console.log(`${rebuilt.size} containers the app rebuilds with innerHTML: ${[...rebuilt].join(' ')}\n`);
if (!problems.length) { console.log('no addressed control is nested inside a rebuilt container'); process.exit(0); }
console.log('ADDRESSED CONTROLS THAT GET DESTROYED ON RE-RENDER:');
for (const p of problems) console.log(`  ${p.screen.padEnd(10)} #${p.id.padEnd(20)} lives inside #${p.owner}`);
process.exit(1);
