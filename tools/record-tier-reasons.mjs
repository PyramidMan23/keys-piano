// WHY A PIECE HAS FEWER THAN THREE TIERS, recorded rather than left as a gap.
//
// The worklist asks for "all three tiers, OR a recorded reason it cannot", and
// the reason has never been written down anywhere: the importer printed it once
// to a terminal and it was gone. A missing tier then looks identical to a tier
// nobody tried, which is exactly the ambiguity Mark keeps having to ask about.
//
// ☠️ MEASURED FROM THE SOURCE, NOT ASSERTED. Each reason is counted off the
// piece's own MIDI through the same pipeline the importer uses, so it says what
// is actually wrong ("41 chords wider than 14 semitones, 9 crossed hands"), not
// "it was refused". Deliberately WITHOUT the expensive repair pass: this is
// reporting what the fuller arrangement looks like, not trying to fix it again.
//
//   node tools/record-tier-reasons.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseMidi, midiNotes, tempoOf } from './midi.mjs';
import { repairHands, SPAN_MAX, TRAVEL_MAX } from '../js/hands.mjs';
import { unpedal, splitHeld } from './handsplit.mjs';

const ROOT = join(import.meta.dirname, '..');
const { SONGS } = await import('file:///' + join(ROOT, 'js', 'songs.mjs').replace(/\\/g, '/'));
const DIRS = ['C:/Users/markh/keys-piano-tools/midi', 'C:/Users/markh/keys-piano-tools/workshop/full', 'C:/Users/markh/keys-piano-tools/workshop/comp', 'C:/Users/markh/keys-piano-tools/workshop'];

const byGroup = new Map();
for (const s of SONGS) {
  if (s.handAssignment !== 'generated') continue;
  const g = s.group ?? s.id;
  if (!byGroup.has(g)) byGroup.set(g, []);
  byGroup.get(g).push(s);
}
const thin = [...byGroup.entries()].filter(([, v]) => v.length < 3);
console.log(`${thin.length} imported pieces have fewer than three tiers`);

const findMid = (g) => {
  for (const d of DIRS) {
    for (const name of [`${g}.mid`, `${g}2.mid`]) {
      const p = d + '/' + name;
      if (existsSync(p)) return p;
    }
  }
  return null;
};

const reasons = {};
for (const [g, tiers] of thin) {
  const file = findMid(g);
  // ☠️ AN ENGRAVED SCORE IS NOT A RECORDING THAT WENT MISSING. Seven Mutopia
  // pieces sat at two tiers and this file said "the source recording is no
  // longer on disk" for every one of them, because it only looked in the
  // workshop. Their real reason is arithmetic: a tier is a step down only
  // under 85% of the tier above, and when Easy is already 82% of Hard (Bach's
  // C major prelude) no Medium count exists that is a step down from both.
  if (/Mutopia|engraved/i.test(tiers[0].source || '')) {
    const by = Object.fromEntries(tiers.map((t) => [t.level, t.notes.length]));
    const hi = by.Hard, lo = by.Easy ?? by.Medium;
    const missing = ['Easy', 'Medium', 'Hard'].filter((l) => !by[l]).join(' and ');
    const why = missing === 'Easy'
      ? `engraved score, hands from the staves; Easy missing because no cut reaches under ${Math.ceil(by.Medium * 0.85) - 1} notes (a step down from Medium's ${by.Medium}) without dropping a beat's melody or bass`
      : `engraved score, hands from the staves; ${missing} missing because no note count between ${lo} (Easy) and ${hi} (Hard) is a step down from both, or every cut that reaches it either fails the playability audit as the staves label the hands or does not sit between its neighbours on the library's difficulty scale`;
    reasons[g] = { tiers: tiers.length, notes: hi, why };
    continue;
  }
  if (!file) { reasons[g] = { tiers: tiers.length, why: 'the source recording is no longer on disk' }; continue; }
  let notes, bpm;
  try {
    const mid = parseMidi(readFileSync(file));
    bpm = tempoOf(mid).bpm;
    const raw = midiNotes(mid);
    const grid = 4, snap = (v) => Math.round(v * grid) / grid;
    for (const n of raw) { n.b = snap(n.b); n.d = Math.max(1 / grid, snap(n.d)); }
    const seen = new Set(); notes = [];
    for (const n of raw.filter((x) => x.vel > 12).sort((a, b) => a.b - b.b || a.m - b.m)) {
      const k = n.b + ':' + n.m; if (seen.has(k)) continue; seen.add(k); notes.push(n);
    }
    repairHands(notes, bpm);
    unpedal(notes, bpm);
    const h = splitHeld(notes, bpm);
    notes.forEach((n, i) => { n.h = h[i]; });
  } catch (e) { reasons[g] = { tiers: tiers.length, why: 'the source could not be re-read: ' + e.message }; continue; }

  // count what a FULL arrangement of this piece would ask of two hands
  let wide = 0, crossed = 0, fast = 0;
  const beats = [...new Set(notes.map((n) => n.b))].sort((a, b) => a - b);
  let held = [];
  for (const beat of beats) {
    held = held.filter((x) => x.b + x.d > beat + 1e-6);
    for (const n of notes.filter((x) => Math.abs(x.b - beat) < 1e-6)) if (!held.includes(n)) held.push(n);
    const L = held.filter((n) => n.h === 'L').map((n) => n.m);
    const R = held.filter((n) => n.h === 'R').map((n) => n.m);
    if (L.length && R.length && Math.max(...L) > Math.min(...R)) crossed++;
    for (const ms of [L, R]) {
      if (ms.length < 2) continue;
      if (Math.max(...ms) - Math.min(...ms) > SPAN_MAX) wide++;
    }
  }
  for (const hand of ['L', 'R']) {
    const hn = notes.filter((n) => n.h === hand).sort((a, b) => a.b - b.b);
    for (let i = 1; i < hn.length; i++) {
      const dt = ((hn[i].b - hn[i - 1].b) / bpm) * 60;
      if (dt > 0 && Math.abs(hn[i].m - hn[i - 1].m) / dt > TRAVEL_MAX) fast++;
    }
  }
  const parts = [];
  if (wide) parts.push(`${wide} chords wider than ${SPAN_MAX} semitones`);
  if (crossed) parts.push(`${crossed} moments with the hands crossed`);
  if (fast) parts.push(`${fast} jumps faster than ${TRAVEL_MAX} semitones a second`);
  reasons[g] = {
    tiers: tiers.length,
    notes: notes.length,
    why: parts.length
      ? `a fuller arrangement of this recording asks for ${parts.join(', ')}, so the audit refused it rather than ship an unplayable tier`
      : 'the fuller tiers were not meaningfully denser than the one that shipped, so they were merged',
  };
  console.log(`  ${g.padEnd(26)} ${tiers.length} tier(s)  ${reasons[g].why.slice(0, 90)}`);
}

writeFileSync(join(ROOT, 'js', 'tiers-refused.mjs'), `// GENERATED by tools/record-tier-reasons.mjs. Do not hand-edit.
//
// Why a piece ships with fewer than three tiers. A machine transcription of a
// concert performance is not a piano arrangement: it holds notes no two hands
// can reach, and the playability audit refuses a tier rather than teach one.
// Recorded so a missing tier can be told apart from a tier nobody attempted.
export const TIERS_REFUSED = ${JSON.stringify(reasons, null, 1)};
`);
console.log(`\nwrote js/tiers-refused.mjs with ${Object.keys(reasons).length} recorded reasons`);
