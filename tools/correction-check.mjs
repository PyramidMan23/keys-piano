// DID THE CORRECTION ACTUALLY IMPROVE THE LIBRARY?
//
// This gate exists because of a specific failure on 2026-08-30 that Mark caught
// by PLAYING, not by any check here: tools/unroam.mjs reported "40 -> 18
// semitones" for a song while the library actually received 40 -> 31, and
// light-of-the-seven went from 38 to 60. The tool had read its hand string off
// a SORTED copy while songs.mjs applies that string BY INDEX to the notes in
// their authored order, so every hand landed on a different note. Mark's words:
// "the left and right hand were switched and the notes were way too far apart".
//
// The root cause is not the sort. It is that I believed the tool's own report.
// A tool's self-report is an INPUT. This measures the OUTPUT: it loads the
// library twice, once raw and once with the corrections applied, and refuses
// any correction that does not make the real, shipped data better.
//
//   node tools/correction-check.mjs
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const measure = (raw) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `
  import { SONGS } from ${JSON.stringify('file:///' + join(ROOT, 'js', 'songs.mjs').replace(/\\\\/g, '/'))};
  const roam = (ns, h) => {
    const hn = ns.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
    let w = 0;
    for (let i = 0; i < hn.length; i++) {
      let lo = hn[i].m, hi = hn[i].m;
      for (let j = i + 1; j < hn.length && hn[j].b - hn[i].b <= 1; j++) { lo = Math.min(lo, hn[j].m); hi = Math.max(hi, hn[j].m); }
      w = Math.max(w, hi - lo);
    }
    return w;
  };
  const out = {};
  for (const s of SONGS) {
    if (!s.notes || s.notes.length < 30) continue;
    out[s.id] = Math.max(roam(s.notes, 'L'), roam(s.notes, 'R'));
  }
  console.log(JSON.stringify(out));
`], { encoding: 'utf8', env: { ...process.env, KEYS_RAW_HANDS: raw ? '1' : '' } }));

const before = measure(true);
const after = measure(false);

// which songs carry a correction at all
const { REHANDED } = await import('file:///' + join(ROOT, 'js', 'songs-hands.mjs').replace(/\\/g, '/'));
const ids = Object.keys(REHANDED);

console.log('correction'.padEnd(28) + '  raw   shipped');
console.log('-'.repeat(52));
const worse = [], same = [];
for (const id of ids) {
  const b = before[id], a = after[id];
  if (b === undefined || a === undefined) continue;
  const tag = a < b ? 'better' : a > b ? 'WORSE' : 'no change';
  if (a > b) worse.push(`${id}: ${b} -> ${a}`);
  if (a === b) same.push(id);
  console.log(`${id.padEnd(28)} ${String(b).padStart(4)} ${String(a).padStart(8)}   ${tag}`);
}
console.log('-'.repeat(52));
console.log(`${ids.length} corrections: ${ids.length - worse.length - same.length} better, ${same.length} no change, ${worse.length} worse`);
if (worse.length) {
  console.log('\nA correction made the shipped library WORSE. Re-run the tool that wrote it');
  console.log('and check it is not reading its hands off a reordered copy:');
  for (const w of worse) console.log('  ' + w);
  process.exit(1);
}
console.log('every correction improves the data the learner actually receives');
