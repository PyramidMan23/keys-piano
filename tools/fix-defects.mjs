// FIX THE 42 MOMENTS A HAND CANNOT PLAY.
//
// Mark: "can you make it perfect now please." These are the last real defects:
// 24 songs each carrying at least one moment where one hand is asked either to
// SPAN more than it can (a reach) or to MOVE further than it can in the time
// (too fast). Everything else in the audit is ordinary piano.
//
// ☠️ THE FIRST FIX IS A RELEASE, NOT A REHAND, and that ordering matters. Most
// "reaches" are not two notes struck together: they are one note still SOUNDING
// from earlier while the hand plays something far away. A pianist's finger has
// already left that key. Shortening it changes no pitch, no hand and no
// fingering, so it cannot violate CLAUDE.md law 3 and cannot make an authored
// arrangement wrong. Moving a note between hands is the heavier tool and is only
// reached for when a release cannot help.
//
//   node tools/fix-defects.mjs --dry
//   node tools/fix-defects.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { holdable } from './handsplit.mjs';
import { SPAN_MAX } from '../js/hands.mjs';

const ROAM_MAX = 18, TRAVEL_MAX = 120, MIN_DUR = 0.25;
const ROOT = join(import.meta.dirname, '..');
const dry = process.argv.includes('--dry');
const { execFileSync } = await import('node:child_process');

// the AUTHORED library: corrections are emitted against these notes
const raw = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `
  import { SONGS } from ${JSON.stringify('file:///' + join(ROOT, 'js', 'songs.mjs').replace(/\\\\/g, '/'))};
  console.log(JSON.stringify(SONGS.map((s) => ({ id: s.id, bpm: s.bpm, source: s.source || '',
    hasAuthoredF: s.notes.some((n) => n.f != null), notes: s.notes }))));
`], { encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, KEYS_RAW_HANDS: '1', KEYS_RAW_FINGERS: '1' } }));

// ☠️ THE SHIPPED STATE MINUS THIS TOOL'S OWN OUTPUT, read in a subprocess.
// Importing songs.mjs directly deadlocks the moment this tool writes a bad fix
// file: the library throws on load, so the only tool that could replace that
// file can no longer read the library. Every generated artifact needs a way to
// be read around, which is what KEYS_RAW_FIXED exists for.
const liveRows = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `
  import { SONGS } from ${JSON.stringify('file:///' + join(ROOT, 'js', 'songs.mjs').replace(/\\\\/g, '/'))};
  console.log(JSON.stringify(SONGS.map((s) => ({ id: s.id, notes: s.notes }))));
`], { encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, KEYS_RAW_FIXED: '1' } }));
const shipped = new Map(liveRows.map((s) => [s.id, s]));


// every moment one hand genuinely cannot play: a real simultaneous reach, or a
// jump with no time for it. Deliberately NOT the whole roam category, which is
// 80% ordinary repositioning.
function defects(notes, bpm) {
  const out = [];
  for (const h of ['L', 'R']) {
    const hn = notes.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
    for (let i = 0; i < hn.length; i++) {
      let lo = hn[i], hi = hn[i];
      for (let j = i + 1; j < hn.length && hn[j].b - hn[i].b <= 1; j++) {
        if (hn[j].m < lo.m) lo = hn[j];
        if (hn[j].m > hi.m) hi = hn[j];
      }
      const span = hi.m - lo.m;
      const overlap = lo.b < hi.b + hi.d - 1e-6 && hi.b < lo.b + lo.d - 1e-6;
      // ☠️ TWO TOOLS, TWO RULERS, AND A CRACK BETWEEN THEM. This skipped any
      // span up to ROAM_MAX (18) while the hand audit condemns a HELD span over
      // SPAN_MAX (14, js/hands.mjs). Fur Elise's bass ringing under the left
      // hand's G#3 is span 16: too small for this tool to repair, big enough
      // for the audit to condemn - nothing could ever clear it, and the 08-31
      // wave "resolved" the deadlock by exiling G#3 to the right hand, which
      // changed the music Mark had already learned. A held-together span is
      // judged by what a hand can HOLD; only a sequential sweep gets the
      // looser roaming allowance.
      if (span <= (overlap ? SPAN_MAX : ROAM_MAX)) continue;
      const gapSec = (Math.abs(hi.b - lo.b) / bpm) * 60;
      const speed = gapSec > 0 ? span / gapSec : Infinity;
      if (overlap || speed > TRAVEL_MAX) out.push({ h, lo, hi, span, overlap });
    }
  }
  return out;
}

const changes = {};
let fixedTotal = 0, releases = 0, moves = 0, stuck = [];

for (const song of raw) {
  const live = shipped.get(song.id);
  if (!live || !song.notes || song.notes.length < 20) continue;
  if (/mutopia|wikimedia|engraved|score/i.test(song.source)) continue;  // the score is the authority
  const bpm = song.bpm || 120;

  // work on the SHIPPED hands so a fix improves what he actually plays
  const work = live.notes.map((n) => ({ ...n }));
  const before = defects(work, bpm).length;
  if (!before) continue;

  // ☠️ WORK THROUGH ALL OF THEM, AND DO NOT STOP AT THE FIRST IMMOVABLE ONE.
  // The first version took bad[0] each pass and broke as soon as it could not
  // act, so one stubborn moment near the start shielded every defect behind it:
  // stairway-hard reported 154 left having genuinely attempted one. Skip what
  // cannot be fixed, keep going, and size the budget to the actual damage.
  const budget = defects(work, bpm).length * 3 + 60;
  const immovable = new Set();
  for (let pass = 0; pass < budget; pass++) {
    const bad = defects(work, bpm).filter((x) => !immovable.has(x.lo.b + ':' + x.lo.m + ':' + x.hi.m));
    if (!bad.length) break;
    const d = bad[0];
    const key = d.lo.b + ':' + d.lo.m + ':' + d.hi.m;
    let acted = false;

    // 1. RELEASE. If one note began earlier and is merely still ringing, let the
    // finger leave the key before the far one is struck. No pitch, hand or
    // finger changes, so this is safe even where fingering is authored.
    if (d.overlap) {
      const early = d.lo.b <= d.hi.b ? d.lo : d.hi;
      const late = early === d.lo ? d.hi : d.lo;
      if (early.b < late.b - 1e-6) {
        const nd = +(late.b - early.b).toFixed(4);
        if (nd >= MIN_DUR && nd < early.d) { early.d = nd; releases++; acted = true; }
      }
    }
    // 2. REHAND, only if a release could not help and no fingering is authored
    // against these notes (law 3: a finger number is written against a hand).
    // ☠️ TRY BOTH ENDS, AND JUDGE THE MOMENT, NOT THE TOTAL. The first version
    // moved only the outlier and kept the move only if the WHOLE song's count
    // dropped. Both were too strict: on a two-octave reach struck together
    // either note may be the one in the wrong hand, and clearing one moment
    // while another elsewhere is untouched leaves the total flat, so a genuine
    // fix was being rejected for not being a net win. Accept a move that clears
    // THIS defect and creates no new one.
    if (!acted && !song.hasAuthoredF) {
      const before2 = defects(work, bpm).length;
      for (const note of [d.h === 'L' ? d.hi : d.lo, d.h === 'L' ? d.lo : d.hi]) {
        const to = note.h === 'L' ? 'R' : 'L';
        const together = work.filter((n) => n !== note && n.h === to && n.b < note.b + note.d - 1e-6 && note.b < n.b + n.d - 1e-6);
        const dup = work.some((n) => n !== note && n.h === to && n.m === note.m && Math.abs(n.b - note.b) < 1e-6);
        const pitches = [...new Set([note.m, ...together.map((n) => n.m)])].sort((a, b) => a - b);
        if (dup || !holdable(pitches, to)) continue;
        const was = note.h;
        note.h = to;
        const now = defects(work, bpm);
        const cleared = !now.some((x) => x.lo.b === d.lo.b && x.lo.m === d.lo.m && x.hi.m === d.hi.m);
        if (cleared && now.length <= before2) { moves++; acted = true; break; }
        note.h = was;
      }
    }
    if (!acted) immovable.add(key);
  }

  const after = defects(work, bpm).length;
  if (after >= before) { stuck.push(`${song.id} (${before} left)`); continue; }

  // ☠️ EMIT AGAINST THE SHIPPED NOTES, WHICH IS WHAT `work` WAS COPIED FROM.
  // The first version walked the AUTHORED array while indexing into the shipped
  // one. Those are different orders (the correction block re-sorts) and the
  // authored hand is not the shipped hand, so every move named a note that no
  // longer existed: "in-the-end-hard: a defect fix matched 0 notes at beat 66".
  // This runs AFTER the hand corrections in songs.mjs, so the shipped state is
  // the only correct frame of reference.
  const moveList = [];
  const durList = [];
  live.notes.forEach((base, i) => {
    const w = work[i];
    if (!w) return;
    if (w.h !== base.h) moveList.push({ b: base.b, m: base.m, from: base.h, to: w.h });
    if (Math.abs(w.d - base.d) > 1e-6) durList.push({ b: base.b, m: base.m, d: +w.d.toFixed(4) });
  });
  if (!moveList.length && !durList.length) continue;
  changes[song.id] = { notes: live.notes.length, moves: moveList, durations: durList };
  fixedTotal += before - after;
  console.log(`  ${song.id.padEnd(26)} ${before} -> ${after}   ${durList.length} released, ${moveList.length} rehanded`);
}

console.log(`\n${Object.keys(changes).length} songs fixed, ${fixedTotal} defects cleared ` +
  `(${releases} by releasing a held note, ${moves} by moving one)`);
if (stuck.length) console.log(`could not fix: ${stuck.join(', ')}`);
if (dry) { console.log('--dry: nothing written'); process.exit(0); }
if (!Object.keys(changes).length) process.exit(0);

writeFileSync(join(ROOT, 'js', 'songs-fixed.mjs'), `// GENERATED by tools/fix-defects.mjs. Do not hand-edit.
//
// The last moments a hand could not play: a note sounding while the same hand
// reaches far away, or a jump with no time for it. Most are fixed by RELEASING a
// held note early (the finger had already left the key), which changes no pitch,
// no hand and no fingering. A few needed the note moving to the other hand, and
// those are never applied to a song with authored fingering.
export const FIXED = ${JSON.stringify(changes, null, 1)};
`);
console.log(`wrote js/songs-fixed.mjs with ${Object.keys(changes).length} songs`);

