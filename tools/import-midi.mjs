// MIDI -> a Keys song, with the hands checked before anything is written.
//
// Mark, 2026-08-30: "if this is wrong this will teach me the songs wrong ... we
// can't make the same mistake we did with Fur Elise and with interstellar."
//
// The mistake he means was a script splitting hands at a fixed pitch, so this
// importer refuses to do that. It takes the hand evidence the FILE carries
// (a properly exported piano file says which staff a note is on), and only
// falls back to the reviewed algorithm in js/hands.mjs when the file has none.
// Whatever it produces then has to survive the same audit that condemned the
// existing library, or it is not written at all.
//
// Three tiers come out, and every one of them is a strict SUBSET of the notes
// that were verified. Easy is not an easier arrangement invented here, it is
// the same piece with voices removed, so it can be wrong only by being thin,
// never by being false.
//
//   node tools/import-midi.mjs <file.mid> --id river-x --title "..." \
//        --composer "..." [--group g] [--bpm 96] [--grid 4] [--source "..."]
//        [--tiers easy,medium,hard] [--dry]
//
// Writes js/songs-imported.mjs, which js/songs.mjs concatenates. Generated data
// stays in its own file on purpose: curated songs must never be silently
// rewritten by a tool, and provenance must survive.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parseMidi, midiNotes, tempoOf } from './midi.mjs';
import { repairHands, handsAreSane, SPAN_MAX, TRAVEL_MAX } from '../js/hands.mjs';
import { unpedal, repairSplit } from './handsplit.mjs';

const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : dflt;
};
const has = (name) => argv.includes('--' + name);
const file = argv.find((a) => !a.startsWith('--') && /\.midi?$/i.test(a));
if (!file) { console.error('usage: node tools/import-midi.mjs <file.mid> --id <id> --title "..." --composer "..."'); process.exit(2); }

const id = flag('id');
const title = flag('title');
const composer = flag('composer', '');
if (!id || !title) { console.error('--id and --title are required'); process.exit(2); }
const group = flag('group', id);
const grid = Number(flag('grid', 4));           // subdivisions per quarter beat
const source = flag('source', 'imported MIDI');
const wantTiers = flag('tiers', 'easy,medium,hard').split(',');

// ---- 1. read ---------------------------------------------------------------
const mid = parseMidi(readFileSync(file));
const raw = midiNotes(mid);
if (!raw.length) { console.error('no notes in ' + file); process.exit(1); }
const tempo = tempoOf(mid);
const bpm = Number(flag('bpm', tempo.bpm));
const timeSig = mid.timeSig;
console.log(`read ${raw.length} notes, ${mid.tracks.length} tracks, ${timeSig[0]}/${timeSig[1]}, ` +
  `tempo ${tempo.bpm}bpm` + (tempo.changes ? ` (${tempo.changes} changes, ${tempo.min}-${tempo.max})` : ''));

// ---- 2. quantise, and say how far it moved things --------------------------
const snap = (v) => Math.round(v * grid) / grid;
let moved = 0, worst = 0;
for (const n of raw) {
  const b = snap(n.b);
  const err = Math.abs(b - n.b);
  moved += err; worst = Math.max(worst, err);
  n.b = b;
  n.d = Math.max(1 / grid, snap(n.d));
}
console.log(`quantised to 1/${grid} beat: mean move ${(moved / raw.length).toFixed(3)} beats, worst ${worst.toFixed(3)}`);
if (worst > 0.5) console.log('  !! something moved more than half a beat. Check the tempo map before trusting this.');

// ---- 3. drop ghosts --------------------------------------------------------
const GHOST_VEL = 12;
const kept = raw.filter((n) => n.vel > GHOST_VEL);
if (kept.length !== raw.length) console.log(`dropped ${raw.length - kept.length} ghost notes under velocity ${GHOST_VEL}`);
// de-duplicate: the same pitch struck twice at the same quantised instant
const seen = new Set();
const notes = [];
for (const n of kept.sort((a, b) => a.b - b.b || a.m - b.m)) {
  const k = n.b + ':' + n.m;
  if (seen.has(k)) continue;
  seen.add(k);
  notes.push(n);
}
if (notes.length !== kept.length) console.log(`merged ${kept.length - notes.length} duplicate strikes`);

// rebase to beat 0
const first = Math.min(...notes.map((n) => n.b));
for (const n of notes) n.b = +(n.b - first).toFixed(4);

// ---- 4. hands: the file's own evidence first --------------------------------
let handSource = 'derived';
let fromScore = false;   // did the FILE tell us the hands, or did we work them out
const byTrack = new Map();
for (const n of notes) {
  const k = n.track + ':' + n.channel;
  if (!byTrack.has(k)) byTrack.set(k, []);
  byTrack.get(k).push(n);
}
const parts = [...byTrack.entries()].filter(([, v]) => v.length >= notes.length * 0.15);
if (parts.length === 2) {
  // two real parts: the lower one is the left hand. This is the file telling us,
  // not us guessing, and it is the only evidence worth more than the algorithm.
  const mean = (v) => v.reduce((a, c) => a + c.m, 0) / v.length;
  const [lo, hi] = parts.sort((a, b) => mean(a[1]) - mean(b[1]));
  for (const n of lo[1]) n.h = 'L';
  for (const n of hi[1]) n.h = 'R';
  handSource = `the file's own two parts (${lo[1].length} low, ${hi[1].length} high)`;
  fromScore = true;
} else {
  repairHands(notes, bpm);
  handSource = 'derived by js/hands.mjs (the file carried no staff information)';
}
console.log('hands: ' + handSource);

// ---- 4b. the pedal is not a finger -----------------------------------------
// A machine transcription reports what it HEARD, and with the sustain pedal
// down that is far longer than any finger held the key: Codex measured 15.6% to
// 75.8% of note offsets in these files landing while the pedal was down, with
// every file topping out at the model's own ~6 second ceiling. Handed straight
// to the tier audit that reads as one hand holding six and seven keys at once,
// which is why Imperial March arrived with 70 unplayable moments and why its
// medium and hard tiers were both refused.
//
// Only when the FILE did not tell us the hands: a properly engraved score has
// real durations and must never be touched by this.
if (!fromScore) {
  const cut = unpedal(notes, bpm);
  if (cut) console.log(`pedal: shortened ${cut} notes the transcriber only heard because the pedal was down`);
  const fixed = repairSplit(notes, bpm);
  if (fixed) console.log(`hands: moved ${fixed} notes to clear crossings, wide chords and impossible travel`);
}

// ---- 5. tiers, each a strict SUBSET -----------------------------------------
const beatsPerBar = timeSig[0] * (4 / timeSig[1]);
const groupBy = (arr, key) => { const m = new Map(); for (const x of arr) { const k = key(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; };

// FOLLOW THE LINE, DON'T JUST TAKE THE TOP. The melody is usually the top
// voice, so that was the first rule, and it broke on every Romantic piece:
// where the right hand arpeggiates ABOVE the tune (Clair de Lune, Liebestraum,
// the Fantaisie-Impromptu), blindly taking the highest note each time hands the
// learner a line that leaps about, a line the composer never wrote. The audit
// caught it and refused five tiers, correctly. So prefer the top note, but if
// it would leap more than an octave from the note just kept and something else
// in the chord is nearer, follow the nearer one: that is what a simplification
// is meant to do.
function thin(all, level) {
  if (level === 'hard') return all.map((n) => ({ ...n }));
  const byBeat = groupBy(all, (n) => n.b);
  const out = [];
  let lastR = null;
  for (const [b, g] of [...byBeat.entries()].sort((x, y) => x[0] - y[0])) {
    const R = g.filter((n) => n.h === 'R').sort((x, y) => y.m - x.m);
    const L = g.filter((n) => n.h === 'L').sort((x, y) => x.m - y.m);
    if (R.length) {
      let pick = R[0];
      if (lastR !== null && Math.abs(pick.m - lastR) > 12) {
        const nearer = R.reduce((best, n) => Math.abs(n.m - lastR) < Math.abs(best.m - lastR) ? n : best, R[0]);
        if (Math.abs(nearer.m - lastR) <= 12) pick = nearer;
      }
      out.push({ ...pick });
      lastR = pick.m;
    }
    if (L.length && (level === 'medium' || Math.abs(b % beatsPerBar) < 1e-6)) out.push({ ...L[0] });
  }
  return out.sort((a, b) => a.b - b.b || a.m - b.m);
}
const TEMPO_OF = { easy: 0.7, medium: 0.85, hard: 1 };

// ---- 6. sections ------------------------------------------------------------
function sectionsFor(ns) {
  const end = Math.max(...ns.map((n) => n.b + n.d));
  const bars = Math.max(1, Math.ceil(end / beatsPerBar));
  const per = bars > 32 ? 16 : bars > 12 ? 8 : 4;
  const out = [];
  for (let bar = 0, i = 0; bar < bars; bar += per, i++) {
    out.push({ name: String.fromCharCode(65 + (i % 26)) + ', bars ' + (bar + 1) + ' to ' + Math.min(bars, bar + per),
      startBeat: bar * beatsPerBar, endBeat: Math.min(end, (bar + per) * beatsPerBar) });
  }
  out[out.length - 1].endBeat = end;
  return out;
}

// ---- 7. the gate: nothing unplayable is written -----------------------------
const built = [];
const problems = [];
for (const level of wantTiers) {
  const ns = thin(notes, level);
  if (ns.length < 8) { problems.push(`${level}: only ${ns.length} notes survived thinning`); continue; }
  const tierBpm = Math.round(bpm * TEMPO_OF[level]);
  // WHOSE WORK IS BEING JUDGED. When the hands came off an engraved score and
  // the notes are the score's own (hard = everything), there is nothing of ours
  // left to check: it is a published piece that pianists play, and refusing it
  // means the tool is grading Chopin. Easy and Medium are OURS, though. Thinning
  // to the top voice can invent a leap the composer never wrote, so those tiers
  // are still checked, and so is anything whose hands we had to derive.
  const oursToJudge = !fromScore || level !== 'hard';
  if (oursToJudge && !handsAreSane(ns, tierBpm, fromScore)) {
    problems.push(`${level}: FAILS the playability audit (chord over ${SPAN_MAX} semitones, crossed hands, or a hand asked to travel over ${TRAVEL_MAX} semitones a second)`);
    continue;
  }
  {
    const wide = [];
    const byB = groupBy(ns, (n) => n.b);
    for (const [b, g] of byB) for (const h of ['L', 'R']) {
      const v = g.filter((n) => n.h === h).map((n) => n.m).sort((x, y) => x - y);
      if (v.length > 1 && v[v.length - 1] - v[0] > SPAN_MAX) wide.push(b);
    }
    if (wide.length) console.log(`  note: ${level} has ${wide.length} chords wider than ${SPAN_MAX} semitones. ` +
      'The score says so, so they are rolled under the pedal, not grabbed.');
  }
  built.push({
    id: level === 'hard' ? id + '-hard' : level === 'easy' ? id + '-easy' : id,
    group, level: level[0].toUpperCase() + level.slice(1),
    title, composer, bpm: tierBpm, timeSig, beatUnit: timeSig[1],
    handAssignment: 'generated', source,
    sections: sectionsFor(ns),
    notes: ns.map((n) => ({ b: n.b, d: +n.d.toFixed(4), m: n.m, h: n.h })),
  });
}

console.log('');
for (const p of problems) console.log('REFUSED  ' + p);
// A TIER THAT IS NOT EASIER IS NOT A TIER. Thinning a very dense piece can
// remove almost nothing: the Fantaisie-Impromptu is essentially one fast line,
// so its Medium came out exactly as hard as its Hard and the difficulty gate
// said so. Shipping both would put two identical arrangements on the ladder and
// tell the learner one of them is a step down.
{
  // Walk DOWN from Hard: each easier tier must be meaningfully lighter than the
  // one above it. (Walking up and comparing against the easier tier is the same
  // test inverted, and it drops everything, because Medium always has more
  // notes than Easy.)
  const keep = [];
  for (const level of ['Hard', 'Medium', 'Easy']) {
    const t = built.find((x) => x.level === level);
    if (!t) continue;
    const above = keep[keep.length - 1];
    if (above && t.notes.length >= above.notes.length * 0.85) {
      problems.push(`${level}: ${t.notes.length} notes against ${above.level}'s ${above.notes.length} is not a step down, so it is not a tier`);
      continue;
    }
    keep.push(t);
  }
  keep.reverse();
  built.length = 0;
  built.push(...keep);
}
for (const p of problems.slice(-3)) if (/not a step down/.test(p)) console.log('DROPPED  ' + p);
for (const s of built) console.log(`ok       ${s.id.padEnd(28)} ${String(s.notes.length).padStart(5)} notes, ${s.bpm}bpm, ${s.sections.length} sections`);
if (!built.length) { console.log('\nnothing written: no tier passed the audit'); process.exit(1); }
// ONE SURVIVING TIER IS NOT AN "EASY" TIER. If the audit refuses the fuller
// arrangements, what is left is not an easy version OF anything: it is simply
// the arrangement we have, and calling it Easy leaves the learner on a rung
// with nothing above it. The library's own convention for a single-arrangement
// song (Ode to Joy, Happy Birthday) is no level at all, so follow it.
if (built.length === 1) {
  built[0].id = id;
  delete built[0].level;
  console.log(`only one tier survived the audit, so it is the arrangement, not a tier: ${id}`);
}
if (has('dry')) { console.log('\n--dry: nothing written'); process.exit(0); }

// ---- 8. write, merging by id ------------------------------------------------
const OUT = new URL('../js/songs-imported.mjs', import.meta.url);
let existing = [];
if (existsSync(OUT)) {
  const m = await import(OUT.href + '?t=' + Date.now());
  // Drop everything from THIS GROUP, not just matching ids: a re-import can
  // rename a tier (a single surviving tier loses its level and takes the base
  // id), and an id-only filter then leaves the old entry behind as a duplicate.
  existing = (m.IMPORTED || []).filter((s) => (s.group ?? s.id) !== group);
}
const all = [...existing, ...built].sort((a, b) => a.id.localeCompare(b.id));
const body = `// GENERATED by tools/import-midi.mjs. Do not hand-edit: re-import instead.
//
// These songs came out of MIDI, had their hands taken from the file where the
// file said, and passed the playability audit before being written. Curated
// songs live in songs.mjs and are never touched by the importer.
export const IMPORTED = ${JSON.stringify(all, null, 1)};
`;
writeFileSync(OUT, body);
console.log(`\nwrote js/songs-imported.mjs: ${all.length} songs (${built.length} from this file)`);

// ☠️ A RE-IMPORT ORPHANS ITS OWN CORRECTIONS, AND THE APP THEN REFUSES TO LOAD.
// js/songs-hands.mjs and js/songs-fingers.mjs are keyed to a song's exact note
// count, deliberately, so an edited song fails loudly instead of being silently
// mis-handed. Re-importing x-files through the corrected importer changed it
// from 968 notes to 601, and the very next load threw "x-files has 601 notes but
// its correction expects 968". The assertion did its job; the importer should
// not have created the situation. Anything this run rewrote gets its stale
// entries dropped here, and the tools that regenerate them are named.
{
  const ids = new Set(built.map((s) => s.id));
  const touched = [];
  for (const [file, key, tool] of [
    ['songs-hands.mjs', 'REHANDED', 'tools/rehand-safe.mjs'],
    ['songs-fingers.mjs', 'FINGERS', 'tools/finger.mjs'],
  ]) {
    const p = new URL('../js/' + file, import.meta.url);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, 'utf8');
    const at = src.indexOf(`export const ${key}`);
    if (at < 0) continue;
    let obj;
    try { obj = JSON.parse(src.slice(src.indexOf('=', at) + 1).trim().replace(/;$/, '')); } catch { continue; }
    const keep = {}; let dropped = 0;
    for (const [id, fix] of Object.entries(obj)) {
      const song = built.find((s) => s.id === id);
      const stale = ids.has(id) && song && song.notes.length !== (fix.notes ?? fix.n);
      // ☠️ ONLY THIS IMPORT'S OWN GROUP. `all` holds the IMPORTED songs, so
      // "not in all" is true of every CURATED song too, and the first version of
      // this check quietly deleted 39 fingering entries and 11 hand corrections
      // for songs this import never touched. A cleanup that reaches outside what
      // it just rewrote is not a cleanup. Confined to ids belonging to this
      // group, which is exactly what a re-import can orphan (a group that came
      // back with fewer tiers leaves entries for tiers that no longer exist).
      const mine = id === group || id.startsWith(group + '-');
      const orphan = mine && !all.some((s) => s.id === id);
      if (stale || orphan) { dropped++; continue; }
      keep[id] = fix;
    }
    if (dropped) {
      writeFileSync(p, src.slice(0, at) + `export const ${key} = ${JSON.stringify(keep, null, 1)};\n`);
      touched.push(`${file}: dropped ${dropped} stale (re-run ${tool})`);
    }
  }
  for (const t of touched) console.log('  ' + t);
}
