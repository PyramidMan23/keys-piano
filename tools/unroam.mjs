// STOP A HAND ROAMING TWO OCTAVES INSIDE A BEAT.
//
// Mark, 2026-08-30, after playing a Hard tier: "the range on the left hand
// seemed like it was very far apart ... on the version that I did it was only
// about eight keys apart." He was right. 113 moments across the library ask one
// hand to cover 15 to 31 semitones between one beat and the next, which happens
// when a bass note and a mid-register figure end up in the SAME hand.
//
// This is deliberately NOT the full re-derivation in rehand.mjs. That rewrites
// every hand in a song and it was stopped twice by verified test pins, once for
// moving Moonlight's opening triplet into the wrong hand. This moves only the
// OUTLYING notes, one at a time, and only when the other hand can take them:
//
//   - the note must be the far end of the offending reach
//   - the receiving hand's own reach must stay inside the limit
//   - the move must not put a right-hand note UNDER a left-hand one
//   - a moved note loses its fingering, because a finger number is authored
//     against a hand and keeping it would make it a lie
//
// Then the suite runs. Any song whose pins break is reverted: the pins encode
// musical truth checked against real sources, and they outrank this tool.
//
//   node tools/unroam.mjs --dry
//   KEYS_RAW_HANDS=1 node tools/unroam.mjs
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SONGS } from '../js/songs.mjs';

const REACH = 18;          // semitones a hand may cover inside one beat
const dry = process.argv.includes('--dry');
const ROOT = join(import.meta.dirname, '..');

// ☠️ A VERIFIED PIN OUTRANKS THIS TOOL. test/check.mjs pins musical facts that
// were checked against real sources, and this tool cannot see them: moving the
// outlying notes out of Lost's left hand broke the octave doubling its chorus
// melody is pinned on. Anything listed here keeps its wide reach, because a
// wide reach is a discomfort and a wrong note is a lie.
// Rather than discover these one at a time (three had already bitten: Lost's
// octave-doubled chorus, Mario's Hard-contains-Medium relationship, and the
// curated-count assertion), read them off the suite itself. If test/check.mjs
// mentions a song at all, it has pinned something about it that this tool
// cannot see, and the song keeps its wide reach: a reach is a discomfort, a
// wrong note is a lie.
const SUITE = readFileSync(join(ROOT, 'test', 'check.mjs'), 'utf8');
const isPinned = (id) => SUITE.includes(`'${id}'`) || SUITE.includes(`"${id}"`);

// the worst reach a hand makes inside any one beat, and where
function roam(notes, hand) {
  const hn = notes.filter((n) => n.h === hand).sort((a, b) => a.b - b.b);
  let worst = 0, at = null;
  for (let i = 0; i < hn.length; i++) {
    let lo = hn[i], hi = hn[i];
    for (let j = i + 1; j < hn.length && hn[j].b - hn[i].b <= 1; j++) {
      if (hn[j].m < lo.m) lo = hn[j];
      if (hn[j].m > hi.m) hi = hn[j];
    }
    if (hi.m - lo.m > worst) { worst = hi.m - lo.m; at = { lo, hi, from: hn[i].b }; }
  }
  return { worst, at };
}

// would giving this note to the other hand be playable?
function canTake(notes, note, to) {
  // ☠️ NEVER CREATE A DUPLICATE. If the receiving hand already sounds this
  // pitch at this instant, the move produces two identical notes at one beat,
  // which validateSong rejects outright: wait mode would deadlock waiting for a
  // key that is already down. The suite caught this on piano-man-hard.
  if (notes.some((n) => n !== note && n.h === to && n.m === note.m && Math.abs(n.b - note.b) < 1e-6)) return false;
  const window = notes.filter((n) => n.h === to && Math.abs(n.b - note.b) <= 1);
  if (!window.length) return true;
  const lo = Math.min(note.m, ...window.map((n) => n.m));
  const hi = Math.max(note.m, ...window.map((n) => n.m));
  if (hi - lo > REACH) return false;
  // never leave a right-hand note under a left-hand one at the same instant
  const together = notes.filter((n) => Math.abs(n.b - note.b) < 1e-6 && n !== note);
  const l = together.filter((n) => (n === note ? to : n.h) === 'L').map((n) => n.m);
  const r = together.filter((n) => (n === note ? to : n.h) === 'R').map((n) => n.m);
  if (to === 'R' && l.length && note.m < Math.max(...l)) return false;
  if (to === 'L' && r.length && note.m > Math.min(...r)) return false;
  return true;
}

const fixes = {};
const report = [];
for (const song of SONGS) {
  // ☠️ THE SCORE IS NOT ON TRIAL. A dry run had this moving 28 notes of a
  // Chopin nocturne and rewriting Beethoven, Schumann and Mozart, because a
  // Romantic left hand genuinely does span wide arpeggios: that IS the piece.
  // Where the hands came off an engraved score the composer is the authority,
  // and the only songs this may touch are the ones where a script decided.
  if (/mutopia|wikimedia|engraved|score/i.test(song.source || '')) continue;
  if (isPinned(song.id)) { report.push([song.id, 'left alone: the suite pins something about it']); continue; }
  const notes = (song.notes || []).map((n) => ({ ...n }));
  if (notes.length < 30) continue;
  let moved = 0, before = 0;
  for (const hand of ['L', 'R']) before = Math.max(before, roam(notes, hand).worst);
  if (before <= REACH) continue;

  for (let pass = 0; pass < 400; pass++) {
    let acted = false;
    for (const hand of ['L', 'R']) {
      const { worst, at } = roam(notes, hand);
      if (worst <= REACH || !at) continue;
      // the outlier is the far end: for the left hand that is the TOP note,
      // for the right hand the bottom one
      const outlier = hand === 'L' ? at.hi : at.lo;
      const to = hand === 'L' ? 'R' : 'L';
      if (!canTake(notes, outlier, to)) continue;
      outlier.h = to;
      delete outlier.f;          // its fingering belonged to the other hand
      moved++; acted = true;
    }
    if (!acted) break;
  }

  let after = 0;
  for (const hand of ['L', 'R']) after = Math.max(after, roam(notes, hand).worst);
  if (!moved || after >= before) { report.push([song.id, `no safe move (${before} semitones)`]); continue; }
  // ☠️ A POSITIONAL STRING IS THE WRONG SHAPE. Reading hands off a reordered
  // copy made every hand land on a different note (Codex: "index-keyed patches
  // against mutable arrays"). A MOVE LIST cannot do that: each move names the
  // note by beat, pitch and the hand it is moving FROM, and songs.mjs refuses
  // unless it matches exactly one authored note. Reordering becomes irrelevant
  // and an edited song fails loudly instead of being silently mis-handed.
  const moves = [];
  song.notes.forEach((orig, i) => {
    if (notes[i].h !== orig.h) moves.push({ b: orig.b, m: orig.m, from: orig.h, to: notes[i].h });
  });
  fixes[song.id] = { moves, notes: song.notes.length };
  report.push([song.id, `${before} -> ${after} semitones, ${moved} notes moved`]);
}

for (const [id, why] of report) console.log(`  ${id.padEnd(26)} ${why}`);
console.log(`\n${Object.keys(fixes).length} songs improved`);
if (dry) { console.log('--dry: nothing written'); process.exit(0); }

// merge into the same committed artifact rehand.mjs writes
const p = join(ROOT, 'js', 'songs-hands.mjs');
let existing = {};
if (existsSync(p)) {
  const m = readFileSync(p, 'utf8').match(/export const REHANDED = ([\s\S]*?);\s*$/);
  if (m) existing = JSON.parse(m[1]);
}
const all = { ...existing, ...fixes };
writeFileSync(p, `// GENERATED by tools/rehand.mjs and tools/unroam.mjs. Do not hand-edit.
//
// Corrected hand assignments, committed as data rather than computed at load,
// so what the learner receives is what is in the file. songs.mjs asserts the
// length matches, so a song edited without re-running these tools fails loudly
// instead of being silently mis-handed.
export const REHANDED = ${JSON.stringify(all, null, 1)};
`);
console.log(`wrote js/songs-hands.mjs with ${Object.keys(all).length} corrected songs`);
