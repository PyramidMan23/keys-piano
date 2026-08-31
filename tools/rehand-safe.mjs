// FIX THE HANDS ON THE SONGS IT IS SAFE TO FIX.
//
// Mark has reported this fault by ear three times, most sharply on the Linkin
// Park songs and Interstellar: "the left and right hand were switched and the
// notes were way too far apart." tools/hand-audit.mjs currently flags 38 songs.
//
// Three guards decide what may be touched, and each exists because ignoring it
// has already cost something:
//
//   1. AUTHORED FINGERING IS UNTOUCHABLE (CLAUDE.md law 3). A finger number is
//      written against a hand; move the note and the number becomes a lie. Nine
//      flagged songs carry authored fingering and are left exactly alone.
//      Fingering DERIVED by tools/finger.mjs does not protect a song, because
//      it is regenerated from the hands afterwards.
//   2. A VERIFIED TEST PIN OUTRANKS THIS TOOL. test/check.mjs pins musical facts
//      checked against real sources and this cannot see them: moving notes out
//      of Lost's left hand broke the octave doubling its chorus is pinned on.
//      If the suite mentions a song at all, the song keeps its hands.
//   3. THE OUTPUT IS MEASURED, NOT THE REPORT. tools/unroam.mjs once reported
//      "40 -> 18 semitones" while the library received 40 -> 31, because it read
//      its hands off a reordered copy. Every change here is re-counted against
//      the real fault list and dropped unless the song genuinely improves.
//
//   node tools/rehand-safe.mjs --dry
//   node tools/rehand-safe.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repairSplit, violations } from './handsplit.mjs';

const ROOT = join(import.meta.dirname, '..');
const dry = process.argv.includes('--dry');
const SUITE = readFileSync(join(ROOT, 'test', 'check.mjs'), 'utf8');
const pinned = (id) => SUITE.includes(`'${id}'`) || SUITE.includes(`"${id}"`);

// the library BEFORE any derived fingering is applied, so "does this song carry
// authored fingering" is answerable at all
const raw = JSON.parse(await import('node:child_process').then(({ execFileSync }) =>
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { SONGS } from ${JSON.stringify('file:///' + join(ROOT, 'js', 'songs.mjs').replace(/\\\\/g, '/'))};
    console.log(JSON.stringify(SONGS.filter((s) => s.notes && s.notes.some((n) => n.f)).map((s) => s.id)));
  `], { encoding: 'utf8', env: { ...process.env, KEYS_RAW_FINGERS: '1' } })));
const authored = new Set(raw);

// ☠️ READ THE LIBRARY RAW, THEN RE-APPLY THE EXISTING CORRECTION BY HAND.
// songs.mjs applies REHANDED and then RE-SORTS song.notes, so a tool that reads
// the finished library sees an order the authored data does not have; move lists
// computed against it broke the app on load ("interstellar-easy: a hand
// correction matched 0 notes at beat 18.75"). The first fix was to SKIP any song
// that already carried a correction, which was safe but far too blunt: once the
// roam fault was added to the objective it blocked 79 songs from improving at
// all, including the ones Mark actually complains about.
//
// So compose instead of skip. Read the AUTHORED notes, apply the existing moves
// in memory exactly as songs.mjs does (and deliberately WITHOUT its sort), run
// the repair on top, then emit ONE move list from authored to final. Matching is
// by beat, pitch and origin hand rather than by index, so the sort is irrelevant
// and a stale entry still fails loudly instead of silently mis-handing.
const { SONGS } = JSON.parse(await import('node:child_process').then(({ execFileSync }) =>
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { SONGS } from ${JSON.stringify('file:///' + join(ROOT, 'js', 'songs.mjs').replace(/\\\\/g, '/'))};
    console.log(JSON.stringify({ SONGS: SONGS.map((s) => ({ id: s.id, bpm: s.bpm, notes: s.notes })) }));
  `], { encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, KEYS_RAW_HANDS: '1', KEYS_RAW_FINGERS: '1' } })));

// the corrections already shipping, re-applied above so this pass improves on
// them rather than ignoring or clobbering them
const { REHANDED } = await import('file:///' + join(ROOT, 'js', 'songs-hands.mjs').replace(/\\/g, '/'));

const fixes = {};
let better = 0, skipped = 0;
for (const song of SONGS) {
  if (!song.notes || song.notes.length < 20) continue;
  const work = song.notes.map((n) => ({ ...n }));
  // re-apply the existing correction on top of the AUTHORED hands, the same way
  // songs.mjs does, so the repair below starts from the shipped state
  const prior = REHANDED[song.id];
  if (prior) {
    if (song.notes.length !== prior.notes) {
      console.log(`  ${song.id.padEnd(26)} left alone: its correction expects ${prior.notes} notes, song has ${song.notes.length}`);
      skipped++; continue;
    }
    let ok = true;
    for (const mv of prior.moves || []) {
      const hits = work.filter((n) => n.b === mv.b && n.m === mv.m && n.h === mv.from);
      if (hits.length !== 1) { ok = false; break; }
      hits[0].h = mv.to;
    }
    if (!ok) { console.log(`  ${song.id.padEnd(26)} left alone: its existing correction no longer matches`); skipped++; continue; }
  }
  // ☠️ MEASURED AGAINST THE SHIPPED STATE, not the authored one. `work` now
  // holds what the learner actually receives; comparing the repair against raw
  // authored hands would credit this tool with the previous correction's work
  // and could let a change through that is worse than what already ships.
  const shipped = work.map((n) => ({ ...n }));
  const before = violations(shipped, song.bpm || 120).length;
  if (!before) continue;
  if (authored.has(song.id)) { console.log(`  ${song.id.padEnd(26)} left alone: authored fingering`); skipped++; continue; }
  if (pinned(song.id)) { console.log(`  ${song.id.padEnd(26)} left alone: the suite pins something about it`); skipped++; continue; }
  repairSplit(work, song.bpm || 120);
  const after = violations(work, song.bpm || 120).length;
  if (after >= before) { console.log(`  ${song.id.padEnd(26)} no safe move (${before} moments)`); continue; }

  // ☠️ AND IT MUST NOT LOSE GROUND ON THE OTHER GATE'S MEASURE. repairSplit
  // minimises ITS metric (held shapes, crossings, travel), while
  // tools/correction-check.mjs judges the widest reach a hand makes inside one
  // beat. Optimising one silently cost the other: consolation-3-hard went 31 ->
  // 36 and liebestraum-3-easy 21 -> 37 on the roam measure while "improving",
  // and correction-check failed the build. A correction has to be better on
  // both, or it is a trade nobody asked for.
  const roam = (ns) => {
    let w = 0;
    for (const h of ['L', 'R']) {
      const hn = ns.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
      for (let i = 0; i < hn.length; i++) {
        let lo = hn[i].m, hi = hn[i].m;
        for (let j = i + 1; j < hn.length && hn[j].b - hn[i].b <= 1; j++) { lo = Math.min(lo, hn[j].m); hi = Math.max(hi, hn[j].m); }
        w = Math.max(w, hi - lo);
      }
    }
    return w;
  };
  const roamBefore = roam(shipped), roamAfter = roam(work);
  if (roamAfter > roamBefore) {
    console.log(`  ${song.id.padEnd(26)} refused: reach would go ${roamBefore} -> ${roamAfter} semitones`);
    continue;
  }

  // ☠️ A MOVE LIST, NEVER A POSITIONAL STRING. Each move names its note by beat,
  // pitch and the hand it leaves, and songs.mjs refuses unless it matches
  // exactly one authored note, so a reordered array fails loudly instead of
  // silently mis-handing every note in the song.
  const moves = [];
  song.notes.forEach((orig, i) => {
    if (work[i].h !== orig.h) moves.push({ b: orig.b, m: orig.m, from: orig.h, to: work[i].h });
  });
  if (!moves.length) continue;
  fixes[song.id] = { moves, notes: song.notes.length };
  console.log(`  ${song.id.padEnd(26)} ${before} -> ${after} unplayable moments, ${moves.length} notes moved`);
  better++;
}

console.log(`\n${better} songs improved, ${skipped} left alone by the guards`);
if (dry) { console.log('--dry: nothing written'); process.exit(0); }
if (!better) process.exit(0);

const p = join(ROOT, 'js', 'songs-hands.mjs');
let existing = {};
const m = readFileSync(p, 'utf8').match(/export const REHANDED = ([\s\S]*?);\s*$/);
if (m) existing = JSON.parse(m[1]);
const all = { ...existing, ...fixes };
writeFileSync(p, `// GENERATED by tools/rehand.mjs, tools/unroam.mjs and tools/rehand-safe.mjs.
// Do not hand-edit.
//
// Corrected hand assignments, committed as data rather than computed at load,
// so what the learner receives is what is in the file. songs.mjs asserts the
// length matches, so a song edited without re-running these tools fails loudly
// instead of being silently mis-handed.
export const REHANDED = ${JSON.stringify(all, null, 1)};
`);
console.log(`wrote js/songs-hands.mjs with ${Object.keys(all).length} corrected songs`);
console.log('NOW RE-RUN tools/finger.mjs: the hands moved, so the derived fingering must follow.');
