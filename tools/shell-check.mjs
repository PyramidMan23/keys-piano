// DOES THE APP SHELL CACHE EVERYTHING THE APP IMPORTS?
//
// sw.js precaches a hand-written list. songs.mjs imports songs-hands.mjs and
// songs-fingers.mjs and NEITHER was on it, so the shell installed a build that
// could not boot offline. That failure is invisible on the first visit (the
// network fills the gap) and only appears on the second, which is the worst
// possible place for it to appear.
//
// A hand-written list of imports goes stale the moment anyone adds a module, so
// this walks the imports from the shell's own entries and reports what is
// missing. Fix the class, not the instance.
//
//   node tools/shell-check.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const block = sw.slice(sw.indexOf('const SHELL'), sw.indexOf('];', sw.indexOf('const SHELL')));
const listed = new Set([...block.matchAll(/'([^']+)'/g)].map((m) => m[1]));

const seen = new Set();
const missing = new Map();
const walk = (rel) => {
  if (seen.has(rel)) return;
  seen.add(rel);
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return;
  const src = readFileSync(abs, 'utf8');
  for (const m of src.matchAll(/(?:^|\n)\s*(?:import|export)[^'"\n]*from\s*['"](\.[^'"]+)['"]/g)) {
    const dep = normalize(join(dirname(rel), m[1])).replace(/\\/g, '/');
    if (!listed.has(dep)) {
      if (!missing.has(dep)) missing.set(dep, []);
      missing.get(dep).push(rel);
    }
    walk(dep);
  }
};
for (const entry of listed) if (entry.endsWith('.mjs') || entry.endsWith('.js')) walk(entry);

console.log(`${listed.size} entries in the shell, ${seen.size} modules reachable from them`);
if (missing.size) {
  console.log(`\n${missing.size} imported modules are NOT precached:`);
  for (const [dep, by] of missing) console.log(`  ${dep}   imported by ${[...new Set(by)].join(', ')}`);
  console.log('\nThe app cannot boot offline without these. Add them to SHELL in sw.js.');
  process.exit(1);
}
console.log('every module the app imports is in the shell');
