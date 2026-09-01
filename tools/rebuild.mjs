// REBUILD THE DERIVED LAYERS, IN THE ONE ORDER THAT WORKS.
//
// Every generated file downstream of the songs is keyed to the state above it,
// so an import invalidates all of them and they must be regenerated in order:
//
//   import  ->  fix-defects  ->  finger  ->  record-tier-reasons  ->  quarantine
//
// Miss a step and the failure is silent or misleading, never obvious:
//
//   - skip fix-defects  : js/songs.mjs THROWS on load ("a defect fix matched 0
//                         notes at beat 323.5"), because the move lists are
//                         keyed to hands that just changed.
//   - skip finger       : fingering is written against hands that no longer
//                         hold those notes. Nothing errors. It is just wrong.
//   - skip quarantine   : the song you just fixed stays shelved, or the song
//                         you just imported is judged by a stale verdict.
//
// ☠️ AND ORDER IS NOT THE ONLY TRAP: A RE-IMPORT ORPHANS ITS OWN CORRECTIONS.
// On 2026-09-01 fix-defects ran, THEN married-life was re-imported, which
// dropped the corrections fix-defects had just written. The next quarantine run
// judged the song unfixed and took every tier of it off the shelf, including
// the Easy tier Mark plays. Nothing failed. The song simply vanished. That is
// why this exists: run the chain AFTER the last import, never around it.
//
//   node tools/rebuild.mjs           run the chain
//   node tools/rebuild.mjs --check   verify the library composes, change nothing
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const check = process.argv.includes('--check');

// ☠️ KEYS_RAW_QUARANTINE ON EVERY STEP. The audit skips quarantined songs, so a
// quarantine-aware tool regenerating the quarantine sees nothing to condemn and
// writes an EMPTY list, releasing every shelved tier in one silent step. Each
// generator must read the RAW library, upstream of the filter it feeds.
const env = { ...process.env, KEYS_RAW_QUARANTINE: '1' };
const STEPS = [
  ['fix-defects', 'tools/fix-defects.mjs', /(\d+) songs fixed/],
  ['finger', 'tools/finger.mjs', /(\d+) songs, ([\d,]+) notes fingered/],
  ['tier-reasons', 'tools/record-tier-reasons.mjs', /(\d+) recorded reasons/],
  ['quarantine', 'tools/quarantine.mjs', /(\d+) tiers quarantined/],
];

// ☠️ AND THIS MUST SURVIVE A LIBRARY THAT DOES NOT LOAD, because that is
// precisely when a rebuild is needed: an import has just orphaned a correction
// and js/songs.mjs throws on the count assertion. The first version called this
// before the chain and crashed on the broken state it existed to repair.
const compose = () => {
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { SONGS, SHELF } from ${JSON.stringify('file:///' + join(ROOT, 'js', 'songs.mjs').replace(/\\/g, '/'))};
    console.log(JSON.stringify({ songs: SONGS.length, shelf: SHELF.length,
      pieces: new Set(SHELF.map((s) => s.group ?? s.id)).size }));
  `], { encoding: 'utf8', maxBuffer: 1 << 28 });
  return JSON.parse(out);
};
const composeSafe = () => { try { return compose(); } catch { return null; } };
const say = (s) => (s ? `${s.shelf} tiers on the shelf across ${s.pieces} pieces` : 'THE LIBRARY DOES NOT LOAD (this is what the rebuild is for)');

if (check) {
  const s = compose();
  console.log(`library composes: ${s.songs} entries, ${s.shelf} on the shelf, ${s.pieces} pieces`);
  process.exit(0);
}

const before = composeSafe();
console.log(`before: ${say(before)}\n`);
for (const [label, script, pick] of STEPS) {
  const t0 = Date.now();
  let out = '';
  try {
    out = execFileSync(process.execPath, [join(ROOT, script)], { encoding: 'utf8', env, maxBuffer: 1 << 28 });
  } catch (e) {
    // several of these exit non-zero BY DESIGN when they find something
    out = e.stdout ?? '';
    if (!out) { console.log(`${label}: FAILED with no output`); process.exit(1); }
  }
  const m = out.match(pick);
  console.log(`${label.padEnd(14)} ${((Date.now() - t0) / 1000).toFixed(0)}s   ${m ? m[0] : '(no summary line - check by hand)'}`);
}

const after = composeSafe();
console.log(`\nafter:  ${say(after)}`);
if (!after) {
  console.log('\nThe library STILL does not load. The chain did not repair it: read the error above.');
  process.exit(1);
}
const delta = before ? after.shelf - before.shelf : 0;
if (delta) console.log(`        ${delta > 0 ? '+' : ''}${delta} tiers`);
// ☠️ SAY WHEN THE SHELF SHRANK. A rebuild that quietly removes songs is the
// exact accident this file documents, and a number nobody reads is not a guard.
if (delta < 0) {
  console.log('\n⚠ THE SHELF SHRANK. Songs a learner could reach are now unreachable.');
  console.log('  If that was not the intent, check js/songs-quarantine.mjs for what was added,');
  console.log('  and whether an import ran AFTER fix-defects and orphaned its corrections.');
}
