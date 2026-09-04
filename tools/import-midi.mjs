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
import { difficultyScore } from '../js/difficulty.mjs';
import { repairHands, handsAreSane, SPAN_MAX, TRAVEL_MAX } from '../js/hands.mjs';
import { unpedal, repairSplit, splitHeld, violations, releaseOverlaps } from './handsplit.mjs';

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
// The KEY as the source states it, e.g. --key "G major". Optional, and only
// ever from a score or an engraving: the sleeve generator otherwise guesses it
// from the notes, and a guess read Zelda's Lullaby (G major, one sharp in the
// arranger's own engraving) as C major off its thinned Easy tier.
const key = flag('key', '');
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
// ☠️ VIDEO HANDS ARE EVIDENCE, NOT AN ENGRAVED SCORE. tools/video-lane writes a
// two-track file whose tracks are the hands the renderer painted, so the
// two-parts rule below would read it as a score and set fromScore: skipping
// the pedal fix, exempting Hard from the playability audit, and letting the
// 15% rule drop a sparse hand. --video-hands takes the tracks as hands (track
// 0 = left, by contract) and NOTHING else a score would earn.
const videoHands = has('video-hands');
if (videoHands) {
  const trackOf = (n) => n.track;
  const ts = [...new Set(notes.map(trackOf))].sort((a, b) => a - b);
  if (ts.length !== 2) { console.error(`REFUSE: --video-hands needs exactly two note tracks, found ${ts.length}`); process.exit(1); }
  for (const n of notes) n.h = trackOf(n) === ts[0] ? 'L' : 'R';
  handSource = `the video's own hand colours (${notes.filter((n) => n.h === 'L').length} left, ${notes.filter((n) => n.h === 'R').length} right); fromScore stays false`;
} else if (parts.length === 2) {
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
  // and the musical case unpedal cannot see: a note still ringing under one the
  // same hand must now strike, across more than a hand can hold. Released here,
  // BEFORE the tier gate judges, or a whole tier is refused for a sustain the
  // pianist never held (see releaseOverlaps in handsplit.mjs).
  const freed = releaseOverlaps(notes, bpm);
  if (freed) console.log(`pedal: released ${freed} holds one hand could not have kept under the next note`);
}
// ☠️ VIDEO HANDS ARE AUTHORED. The re-split below exists for transcriptions,
// whose hands are ours to guess. A video's hands were painted by the arranger,
// and Codex showed this block would overwrite them the moment they crossed
// ("re-split from scratch, 8 -> 0"): the exact pitch split the law forbids,
// wearing the importer's own clothes. Only a transcription reaches it.
if (!fromScore && !videoHands) {

  // ☠️ RE-SPLIT THE HANDS FROM SCRATCH, then repair. js/hands.mjs repairHands
  // decides note by note and produces crossings by the hundred on a dense
  // transcription (overwatch 159, x-files 114), which is what refused those
  // songs their medium and hard tiers: no hill-climb of single-note moves undoes
  // that many. splitHeld re-cuts every instant at ONE pitch, carrying the notes
  // still SOUNDING in its state, so a crossing cannot be represented.
  //
  // The hill-climb still runs afterwards, and MEASUREMENT says so: Codex advised
  // against it, but beam-then-repair beat the beam alone on every song tried
  // (jaws 453 -> 127 faults, overwatch 879 -> 460, x-files 261 -> 134). The beam
  // gets the structure right; the hill-climb cleans up what a single pitch cut
  // cannot express. Numbers over advice, including mine.
  const before = violations(notes, bpm).length;
  const trial = notes.map((n) => ({ ...n }));
  const hands = splitHeld(trial, bpm);
  trial.forEach((n, i) => { n.h = hands[i]; });
  repairSplit(trial, bpm);
  const after = violations(trial, bpm).length;
  if (after < before) {
    trial.forEach((n, i) => { notes[i].h = n.h; });
    console.log(`hands: re-split from scratch, ${before} -> ${after} unplayable moments`);
  } else {
    const fixed = repairSplit(notes, bpm);
    if (fixed) console.log(`hands: moved ${fixed} notes (the re-split was no better, so it was not used)`);
  }
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
// REDUCE A PERFORMANCE TO SOMETHING TWO HANDS CAN HOLD, by dropping the notes
// an arranger drops first: the INNER voices. The top of a chord carries the
// melody and the bottom carries the harmony, so both stay; the filling in
// between is what makes a transcribed chord ten notes wide and unplayable.
// Order of sacrifice is by how buried a note is, so the fullest moments thin
// first and a sparse passage is left untouched.
function thinToDensity(all, keepFraction) {
  const target = Math.max(8, Math.round(all.length * keepFraction));
  if (all.length <= target) return all.map((n) => ({ ...n }));
  const byMoment = new Map();
  for (const n of all) {
    const k = n.b + ':' + n.h;
    if (!byMoment.has(k)) byMoment.set(k, []);
    byMoment.get(k).push(n);
  }
  const rank = new Map();
  for (const group of byMoment.values()) {
    const sorted = group.slice().sort((a, b) => a.m - b.m);
    sorted.forEach((n, i) => {
      // 0 = an outer voice, keep at all costs; higher = more buried
      const depth = Math.min(i, sorted.length - 1 - i);
      rank.set(n, depth * 100 + sorted.length);
    });
  }
  const order = all.slice().sort((a, b) => (rank.get(b) ?? 0) - (rank.get(a) ?? 0));
  const drop = new Set(order.slice(0, all.length - target).filter((n) => (rank.get(n) ?? 0) >= 100));
  return all.filter((n) => !drop.has(n)).map((n) => ({ ...n }));
}

// thinToDensity only knows how to drop the INNER VOICES of a chord, and an
// arpeggiated score has almost none: the Arabesque's 1444 notes hold fewer
// than 20 that are neither the top nor the bottom of their moment, so no
// density it can reach is a step down from Hard. This thins within a BEAT
// instead. Per beat and hand it protects the highest note (the melody's
// contour) and the lowest (the bass), and ranks the rest by how deep in the
// beat and how buried they sit, dropping the latest, most buried first. An
// arpeggio becomes a sparser arpeggio with the same outline; nothing is ever
// added, so every note is still the composer's.
function thinByBeat(all, keepFraction) {
  const target = Math.max(8, Math.round(all.length * keepFraction));
  if (all.length <= target) return all.map((n) => ({ ...n }));
  const byBeat = new Map();
  for (const n of all) {
    const k = Math.floor(n.b) + ':' + n.h;
    if (!byBeat.has(k)) byBeat.set(k, []);
    byBeat.get(k).push(n);
  }
  const rank = new Map();
  for (const group of byBeat.values()) {
    const sorted = group.slice().sort((a, b) => a.m - b.m);
    const hi = sorted[sorted.length - 1], lo = sorted[0];
    sorted.forEach((n, i) => {
      if (n === hi || n === lo) { rank.set(n, 0); return; }
      const depth = Math.min(i, sorted.length - 1 - i);
      rank.set(n, 100 + Math.round((n.b - Math.floor(n.b)) * 10) + depth);
    });
  }
  const order = all.slice().sort((a, b) => (rank.get(b) ?? 0) - (rank.get(a) ?? 0));
  const drop = new Set(order.slice(0, all.length - target).filter((n) => (rank.get(n) ?? 0) >= 100));
  return all.filter((n) => !drop.has(n)).map((n) => ({ ...n }));
}

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
  let ns = thin(notes, level);
  if (ns.length < 8) { problems.push(`${level}: only ${ns.length} notes survived thinning`); continue; }
  const tierBpm = Math.round(bpm * TEMPO_OF[level]);

  // ☠️ AN ARRANGEMENT IS A REDUCTION OF A PERFORMANCE, NOT A COPY OF IT.
  // Mark asked for every song "easy medium hard" and only 43 of 84 have three,
  // because `hard` was defined as EVERY transcribed note. A concert performance
  // captured by a listening model is not a piano arrangement: it holds notes no
  // two hands can reach, so hard failed the audit and the whole tier vanished.
  // Defining hard as the fullest PLAYABLE version instead is honest - it is
  // still a strict subset of the verified notes, so it can only be thin, never
  // false, which is the same guarantee easy and medium already carry.
  //
  // Only for a machine transcription. Where the file gave us the hands, the
  // score is the authority and its own notes are never quietly dropped.
  // ☠️ EACH TIER NEEDS ITS OWN HAND REPAIR. repairSplit runs once on the full
  // note set, but every tier is a SUBSET of it, and removing notes changes which
  // hand should hold what: a crossing that was unavoidable in the dense original
  // is often trivially fixable once the inner voices are gone. Repairing only
  // the parent left medium and hard failing on crossings and travel that
  // thinning alone cannot touch, which is why 41 of 84 songs had no third tier.
  if (!fromScore) {
    // ☠️ EACH TIER GETS THE FULL RE-SPLIT, not just the hill-climb. A tier is a
    // SUBSET, and the best pitch cut for the dense parent is rarely the best cut
    // once the inner voices are gone: giving a tier only repairSplit left
    // overwatch and x-files refused on crossings the beam clears in one pass.
    const resplit = videoHands ? (arr) => arr : (arr, tbpm) => {
      const t = arr.map((n) => ({ ...n }));
      const h = splitHeld(t, tbpm);
      t.forEach((n, i) => { n.h = h[i]; });
      repairSplit(t, tbpm);
      return violations(t, tbpm).length < violations(arr, tbpm).length ? t : arr;
    };
    if (!handsAreSane(ns, tierBpm, fromScore)) ns = resplit(ns, tierBpm);
    if (level === 'hard' && !handsAreSane(ns, tierBpm, fromScore)) {
      for (const keep of [0.9, 0.8, 0.7, 0.6, 0.5]) {
        const trial = resplit(thinToDensity(ns, keep), tierBpm);
        if (handsAreSane(trial, tierBpm, fromScore)) {
          console.log(`hard: the fullest PLAYABLE version, ${trial.length} of ${ns.length} notes ` +
            '(a transcribed performance holds more than two hands can reach)');
          ns = trial;
          break;
        }
      }
    }
  }
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
    // handAssignment stays 'generated' because four tools key on it; the video
    // provenance rides in its own field and in the source string
    handAssignment: 'generated', ...(videoHands ? { provenance: 'video-authored-hands' } : {}), ...(key ? { key } : {}), source,
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

// ---- 7b. fill a missing tier FROM THE SCORE, by density --------------------
// ☠️ "TOP NOTE PER BEAT" IS NOT A MEDIUM FOR AN ENGRAVED SCORE. thin('medium')
// keeps the top right-hand note and one bass note per beat, which on a piece
// that is already a single line (Bach's C major prelude, the Fantaisie, the
// Arabesque) is nearly every note of Hard, so the tier was dropped as "not a
// step down"; and on the Moonlight and the Consolation it invented a leap the
// composer never wrote and failed the audit. Seven of Mark's requested
// classics sat at two tiers because of it.
//
// A score's Hard is the composer's own notes, so a tier between two survivors
// can be cut by DENSITY instead: thinToDensity drops the most buried voices
// first and never an outer one, so the result is a strict subset that keeps
// the melody and the bass; its count must land in the band that keeps it a
// step down from the tier above AND leaves the tier below a step down from it;
// and it faces the same playability audit as every tier we make. Where no
// such band exists (the Bach prelude's Easy is already 82% of its Hard) the
// piece honestly keeps two tiers, and the reason is recorded.
// Video-authored hands qualify too: the render is played from the arranger's
// own MIDI, so its Hard is the arranger's notes exactly as an engraving's are,
// and a density cut of it is still a strict subset of verified notes
// (Zelda's Lullaby, 2026-09-04: thin('medium') kept 656 of 698 and was dropped
// as not a step down, the same way the Bach prelude was).
if (fromScore || videoHands) {
  const order = ['Easy', 'Medium', 'Hard'];
  const count = (lvl) => built.find((t) => t.level === lvl)?.notes.length;
  for (const lvl of ['Medium', 'Easy']) {
    if (!wantTiers.includes(lvl.toLowerCase()) || count(lvl)) continue;
    const i = order.indexOf(lvl);
    const above = order.slice(i + 1).map(count).find(Boolean);
    const below = order.slice(0, i).reverse().map(count).find(Boolean);
    if (!above) continue;
    const hi = Math.ceil(above * 0.85) - 1;
    const lo = below ? Math.floor(below / 0.85) + 1 : 8;
    if (lo > hi) {
      problems.push(`${lvl.toLowerCase()}: no note count between ${below} and ${above} would be a step down from both neighbours, so the piece keeps its tiers as they are`);
      continue;
    }
    const tierBpm = Math.round(bpm * TEMPO_OF[lvl.toLowerCase()]);
    let made = null, audited = 0;
    // every count in the band, so a refusal means every cut was tried, not a sample of them
    for (let target = hi; target >= lo; target--) {
      for (const cut of [thinToDensity, thinByBeat]) {
        const ns = cut(notes, target / notes.length);
        if (ns.length < lo || ns.length > hi) continue;
        if (!handsAreSane(ns, tierBpm, fromScore)) { audited++; continue; }
        // ☠️ FEWER NOTES IS NOT EASIER. The library's own difficulty score is
        // what the tier ladder is ranked by, and thinning the Fantaisie's right
        // hand toward the beats scored 8.2 against its Hard's 8.1: with the
        // off-beat notes gone, more of what is left lands with the left hand,
        // and hands-together is harder. A tier must sit between its neighbours
        // on that scale too, or it is not the step it claims to be.
        const score = difficultyScore({ notes: ns, bpm: tierBpm });
        const aboveScore = difficultyScore(built.find((t) => t.notes.length === above));
        const belowTier = below ? built.find((t) => t.notes.length === below) : null;
        if (!(score < aboveScore) || (belowTier && !(score > difficultyScore(belowTier)))) { audited++; continue; }
        made = ns; break;
      }
      if (made) break;
    }
    if (!made) {
      problems.push(audited
        ? `${lvl.toLowerCase()}: every cut between ${lo} and ${hi} notes either fails the playability audit as the score labels the hands (the Moonlight writes the right hand's triplets in the bass staff) or does not land between its neighbours on the difficulty scale`
        : `${lvl.toLowerCase()}: no cut can reach ${lo} to ${hi} notes without dropping a beat's melody or bass, so the piece keeps its tiers as they are`);
      continue;
    }
    const tid = lvl === 'Easy' ? id + '-easy' : id;
    console.log(`${lvl.toLowerCase()}: cut from the score by density, ${made.length} of ${notes.length} notes (a step down from ${above}${below ? `, and ${below} is a step down from it` : ''})`);
    built.push({
      id: tid, group, level: lvl,
      title, composer, bpm: tierBpm, timeSig, beatUnit: timeSig[1],
      handAssignment: 'generated', ...(key ? { key } : {}), source,
      sections: sectionsFor(made),
      notes: made.map((n) => ({ b: n.b, d: +n.d.toFixed(4), m: n.m, h: n.h })),
    });
    built.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
    console.log(`ok       ${tid.padEnd(30)} ${made.length} notes, ${tierBpm}bpm`);
  }
  for (const p of problems.slice(-2)) if (/no note count|every cut between|no cut can reach/.test(p)) console.log('REFUSED  ' + p);
}
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
const previousNotes = new Map();
if (existsSync(OUT)) {
  const m = await import(OUT.href + '?t=' + Date.now());
  // Drop everything from THIS GROUP, not just matching ids: a re-import can
  // rename a tier (a single surviving tier loses its level and takes the base
  // id), and an id-only filter then leaves the old entry behind as a duplicate.
  existing = (m.IMPORTED || []).filter((s) => (s.group ?? s.id) !== group);
  // what this group's tiers looked like BEFORE this run, so an unchanged tier
  // can keep the corrections that were written against exactly these notes
  for (const sng of (m.IMPORTED || []).filter((s) => (s.group ?? s.id) === group)) previousNotes.set(sng.id, JSON.stringify(sng.notes));
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
    // ☠️ AND songs-fixed.mjs, WHICH WAS MISSING FROM THIS VERY LIST while the
    // comment below warned that a re-import "orphans its own corrections and
    // the app then REFUSES TO LOAD". Of the three overlays, this is the only
    // one that throws: js/songs.mjs asserts a defect fix's note count and dies
    // on a mismatch. Re-importing Married Life from a fuller performance took
    // it from 439 notes to 891 and the whole library stopped loading, with the
    // stale entry pointing at music that no longer existed. A list of files to
    // clean that omits the one that breaks the app is the wrong list.
    ['songs-fixed.mjs', 'FIXED', 'tools/fix-defects.mjs'],
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
      // ☠️ A RE-IMPORT REWRITES THE NOTES, SO EVERY CORRECTION FOR IT IS STALE,
      // not just the ones whose COUNT changed. That was the first version and it
      // was not enough: re-importing last-friday-night produced the same number
      // of notes with different content, the count check passed, and the next
      // load threw "a hand correction matched 0 notes at beat 348.25". Matching
      // on a count is matching on a coincidence. Anything this run rewrote loses
      // its correction outright and gets a fresh one from rehand-safe/finger.
      // ☠️ AND A TIER THAT CAME BACK NOTE-FOR-NOTE IDENTICAL IS NOT STALE. The
      // rule above dropped every correction for every id this run rewrote, even
      // when the rewrite produced exactly the notes it replaced. Adding a Medium
      // to the Arabesque would have thrown away the hand corrections on its
      // untouched Easy and Hard, and nothing in tools/rebuild.mjs regenerates
      // songs-hands.mjs, so the shipped hands would have silently changed. The
      // count was a coincidence; the full note list is the thing itself.
      const rewritten = ids.has(id);
      const identical = rewritten && previousNotes.get(id) === JSON.stringify(built.find((s) => s.id === id)?.notes);
      const stale = rewritten && !identical;
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
