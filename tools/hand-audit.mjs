// IS THE HAND SPLIT PLAYABLE? Mark, 2026-08-30, watching someone play:
// "they're using their left hand early on for some keys ... are you sure we've
// got this right with our songs?"
//
// This does not judge taste (two editions can legitimately split a figure
// differently). It only reports things that are wrong on their own terms:
//   1. a two-handed song with a hand that never plays at all
//   2. CROSSED HANDS: a right-hand note sounding BELOW a left-hand note at the
//      same moment
//   3. AN IMPOSSIBLE REACH: notes struck together by one hand spanning more
//      than an octave and a fourth (17 semitones is already a stretch)
//   4. a hand asked to jump more than two octaves between consecutive notes
//      inside a beat, which no hand can do
//
// Usage: node tools/hand-audit.mjs [--all]
import { SONGS } from '../js/songs.mjs';

const NAME = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const name = (m) => NAME[m % 12] + (Math.floor(m / 12) - 1);
const SPAN_MAX = 17;     // an octave and a fourth, already a stretch
const JUMP_MAX = 24;     // two octaves inside one beat
const showAll = process.argv.includes('--all');

const findings = [];
for (const song of SONGS) {
  const notes = [...song.notes].sort((a, b) => a.b - b.b);
  const L = notes.filter((n) => n.h === 'L');
  const R = notes.filter((n) => n.h === 'R');
  const add = (kind, detail) => findings.push({ song: song.id, kind, detail });

  // 1. a silent hand
  if (notes.length > 12 && (!L.length || !R.length)) {
    add('silent hand', `${!L.length ? 'LEFT' : 'RIGHT'} hand never plays (${notes.length} notes, all one hand)`);
  }

  // group by onset beat for the simultaneity checks
  const byBeat = new Map();
  for (const n of notes) {
    const k = Math.round(n.b * 1000) / 1000;
    if (!byBeat.has(k)) byBeat.set(k, []);
    byBeat.get(k).push(n);
  }
  let crossed = 0, crossedEg = null, reach = 0, reachEg = null;
  for (const [beat, group] of byBeat) {
    const l = group.filter((n) => n.h === 'L'), r = group.filter((n) => n.h === 'R');
    // 2. crossed hands
    if (l.length && r.length) {
      const lo = Math.min(...r.map((n) => n.m)), hi = Math.max(...l.map((n) => n.m));
      if (lo < hi) { crossed++; if (!crossedEg) crossedEg = `beat ${beat}: right hand on ${name(lo)} under left hand on ${name(hi)}`; }
    }
    // 3. an impossible reach within one hand
    for (const [h, arr] of [['left', l], ['right', r]]) {
      if (arr.length < 2) continue;
      const span = Math.max(...arr.map((n) => n.m)) - Math.min(...arr.map((n) => n.m));
      if (span > SPAN_MAX) {
        reach++;
        if (!reachEg) reachEg = `beat ${beat}: ${h} hand asked for ${span} semitones at once (${name(Math.min(...arr.map((n) => n.m)))} to ${name(Math.max(...arr.map((n) => n.m)))})`;
      }
    }
  }
  if (crossed) add('crossed hands', `${crossed} moment${crossed > 1 ? 's' : ''}; e.g. ${crossedEg}`);
  if (reach) add('impossible reach', `${reach} chord${reach > 1 ? 's' : ''}; e.g. ${reachEg}`);

  // 4. a leap no hand can make inside a beat
  for (const [h, arr] of [['left', L], ['right', R]]) {
    let jumps = 0, eg = null;
    for (let i = 1; i < arr.length; i++) {
      const dt = arr[i].b - arr[i - 1].b;
      const d = Math.abs(arr[i].m - arr[i - 1].m);
      if (dt > 0 && dt <= 1 && d > JUMP_MAX) {
        jumps++;
        if (!eg) eg = `beat ${arr[i - 1].b} to ${arr[i].b}: ${name(arr[i - 1].m)} to ${name(arr[i].m)}, ${d} semitones`;
      }
    }
    if (jumps) add('impossible leap', `${h} hand, ${jumps} time${jumps > 1 ? 's' : ''}; e.g. ${eg}`);
  }
}

const byKind = new Map();
for (const f of findings) {
  if (!byKind.has(f.kind)) byKind.set(f.kind, []);
  byKind.get(f.kind).push(f);
}
console.log(`${SONGS.length} songs audited\n`);
for (const [kind, list] of byKind) {
  console.log(`### ${kind.toUpperCase()}  (${list.length} song${list.length > 1 ? 's' : ''})`);
  for (const f of (showAll ? list : list.slice(0, 12))) console.log(`  ${f.song.padEnd(26)} ${f.detail}`);
  if (!showAll && list.length > 12) console.log(`  ... and ${list.length - 12} more, run with --all`);
  console.log('');
}
if (!findings.length) console.log('no unplayable hand assignments found');
process.exit(findings.length ? 1 : 0);
