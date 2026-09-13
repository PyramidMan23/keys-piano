// The learning lab: authored playable curriculum + activity runner + a
// truthful progress model for written rhythm, notation, applied theory and
// expression. DOM-free and node-testable, like every other brain module here.
//
// WHY THIS FILE EXISTS (brief 2026-09-13, packages 2-6). The app already
// teaches staff notes, landmarks, intervals, triads, chords from symbols,
// inversions and technique. It does NOT teach written rhythm, rests, dots,
// ties, flats, accidental carry, key signatures, compound metre, vertical
// two-hand reading, or applied harmony inside real music. This module adds
// exactly those, and nothing that already exists is duplicated or replaced:
// it reuses rhythm.mjs's onset matcher, teacher.mjs's triads/inversions and
// evidence vocabulary, lessons.mjs's miss explainer and evenness rule,
// artic/voicing/pedal for measured expression, and game.mjs's XP ledger.
//
// THE LAWS THIS FILE OBEYS
//  1. A multiple-choice label never certifies reading or playing. Every card's
//     independent and transfer stages take PHYSICAL input (notes or taps).
//  2. Assistance decides what an attempt is worth, never the input device.
//     A hint converts an attempt to practice credit, for MIDI and clicks alike.
//  3. Wrong durations and violated rests are their own failures. Correct
//     onsets with wrong note lengths is a FAIL, not a near-miss: that is the
//     whole point of teaching written rhythm.
//  4. Delayed recall is keyed to the real calendar and to CHANGED CONTENT.
//     A clock that moves backwards forfeits delay credit; it never forfeits
//     evidence already earned.
//  5. Harmony is never guessed on catalogue songs. An applied card carries an
//     authored expectation and REFUSES itself if the shipped song data does
//     not match it (resolveAppliedCards).
//  6. Study pieces are original exercises, labelled so, and never enter the
//     repertoire shelves.
//  7. Subjective intent (musicality, phrasing taste) is a listening self
//     check, recorded as a self report, and can never become competence.

import { mulberry32 } from './sight.mjs';
import { RhythmRound, TAP_WINDOW_MS, makeCountCells } from './rhythm.mjs';
import {
  triadMidis, inversions, nearestVoicing, recordAttempt, competence,
  competenceLine, evidenceDate, RETENTION_MIN_DELAY,
} from './teacher.mjs';
import { grantXp, recordBlock } from './game.mjs';
import { explainMiss, evenEnough } from './lessons.mjs';
import { analyzeArticulation } from './artic.mjs';
import { analyzeVoicing } from './voicing.mjs';
import { analyzePedal } from './pedal.mjs';
import { spellPitch } from './notation.mjs';

export const LAB_VERSION = 1;
const DAY = 86400000;

// ---------------------------------------------------------------------------
// 1. Tolerances. Every one of these is a teaching tolerance, exported so the
// tests pin them and the docs can quote them. They are deliberately looser
// than the analyzers' thresholds: this is a beginner reading a rhythm for the
// first time, not a performance measurement.
// ---------------------------------------------------------------------------
export const TOL = {
  onsetMs: TAP_WINDOW_MS,       // 150, reused from rhythm.mjs (independent)
  onsetGuidedMs: 240,           // guided stages give a wider door
  captureFactor: 2.5,           // how far out a press is still ATTRIBUTED to a cell
  durMin: 0.6,                  // held / written, below this = too short
  durMax: 1.45,                 // above this = too long (a half played as a whole)
  restGraceMs: 130,             // a release may lag this far into a rest
  handGapMs: 120,               // the two-hand skill's own published rule
  legatoJoinMs: 80,             // a slur's two notes must join within this
  staccatoMaxFrac: 0.5,         // a staccato note held under half its value
  velContrastMin: 18,           // same-key loud vs soft, of 127
  tieHoldMin: 0.75,             // a tied pair must be held this much of the total
};

// ---------------------------------------------------------------------------
// 2. Written pitch: spelling in, MIDI out. notation.mjs goes the other way
// (spellPitch: MIDI -> a VexFlow key), which is what the engraver needs. A
// reading drill is written FIRST and sounded second, so it needs this
// direction, and the accidental rules live here because they are the thing
// being taught.
// ---------------------------------------------------------------------------
const STEP_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
// fifths count per key name, same vocabulary notation.mjs accepts
const FIFTHS = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
  Am: 0, Em: 1, Bm: 2, 'F#m': 3, 'C#m': 4, 'G#m': 5, 'D#m': 6, 'A#m': 7,
  Dm: -1, Gm: -2, Cm: -3, Fm: -4, Bbm: -5, Ebm: -6, Abm: -7,
};

// 'Bb4' | 'F#5' | 'Bn4' (explicit natural) | 'B4' (nothing written)
export function written(token) {
  const m = /^([A-G])(bb|##|b|#|n)?(-?\d)$/.exec(String(token).trim());
  if (!m) throw new Error('unreadable written note: ' + token);
  return { step: m[1], acc: m[2] ?? null, octave: +m[3] };
}
export const ALTER = { '#': 1, '##': 2, b: -1, bb: -2, n: 0 };

export function keyAlterations(key) {
  const count = FIFTHS[key];
  if (count == null) throw new Error('unknown key signature: ' + key);
  const out = {};
  const order = count < 0 ? FLAT_ORDER : SHARP_ORDER;
  for (let i = 0; i < Math.abs(count); i++) out[order[i]] = count < 0 ? -1 : 1;
  return out;
}

// ☠️ THE RULE BEING TAUGHT, IMPLEMENTED ONCE. An accidental applies to its own
// letter AND octave for the rest of the bar, and the barline resets everything
// back to the key signature. A natural sign is an accidental too: it cancels
// for the rest of the bar and is itself cancelled by the next barline. Getting
// this wrong is the single most common beginner reading error, so the drill
// that teaches it cannot be scored by a model that fudges it.
export class BarAccidentals {
  constructor(key) { this.alt = keyAlterations(key); this.bar = new Map(); }
  barline() { this.bar.clear(); }
  midiOf(spec) {
    const w = typeof spec === 'string' ? written(spec) : spec;
    const slot = w.step + w.octave;
    let alteration;
    if (w.acc != null) { alteration = ALTER[w.acc]; this.bar.set(slot, alteration); }
    else if (this.bar.has(slot)) alteration = this.bar.get(slot);
    else alteration = this.alt[w.step] ?? 0;
    return (w.octave + 1) * 12 + STEP_SEMI[w.step] + alteration;
  }
}
// One shot: resolve a list of bars of written notes to MIDI, applying carry
// and reset. bars: [[ 'Bb4', 'B4', 'Bn4' ], [ 'B4' ]] -> [[70,70,71],[71]]
export function resolveWritten(bars, key = 'C') {
  const state = new BarAccidentals(key);
  return bars.map((bar) => { state.barline(); return bar.map((n) => state.midiOf(n)); });
}
// VexFlow key string for a written note, plus the accidental the engraver must
// draw (VexFlow does not infer a courtesy or a carry: we tell it).
export function vexKeyOf(spec) {
  const w = typeof spec === 'string' ? written(spec) : spec;
  const suffix = w.acc === 'n' ? '' : (w.acc ?? '');
  return { key: `${w.step.toLowerCase()}${suffix}/${w.octave}`, accidental: w.acc ?? null };
}

// ---------------------------------------------------------------------------
// 3. Written rhythm. Cells are in QUARTER-NOTE units, the same unit
// notation.mjs models everything in, so a cell hands straight to the engraver.
// ---------------------------------------------------------------------------
// code -> quarter length. 'hd' is a dotted half, the same vocabulary
// engraving.mjs already renders (duration + VF.Dot).
export const CODE_Q = {
  w: 4, hd: 3, h: 2, qd: 1.5, q: 1, '8d': 0.75, '8': 0.5, '16d': 0.375, '16': 0.25,
  t4: 2 / 3, t8: 1 / 3, t16: 1 / 6,
};
const TUPLET_OF = { t4: { base: 'q', n: 3, of: 2 }, t8: { base: '8', n: 3, of: 2 }, t16: { base: '16', n: 3, of: 2 } };

// 'q q h | 8 8 q~ | q h.' -- token = code, optional 'r' (rest), optional '~'
// (tied into the next cell of the same pitch). '|' is a barline.
// Throws when a bar does not add up: an exercise that is not musically correct
// must fail at authoring time, never reach a learner.
export const snap48 = (v) => { const g = Math.round(v * 48); return Math.abs(v * 48 - g) < 1e-6 ? g / 48 : v; };
export function parseRhythm(pattern, meter = [4, 4]) {
  const barLength = meter[0] * 4 / meter[1];
  const cells = [];
  // ☠️ A TUPLET GROUP ID MUST BE MONOTONIC WITHIN ITS BAR. A sequence counter
  // reset by the next plain note restarted the numbering, so two triplet
  // groups in one bar ("t8 t8 t8 q t8 t8 t8 q", the independent rung of the
  // triplets card) shared the id `0:0`. VexFlow would have drawn ONE six-note
  // bracket across a plain quarter instead of two 3:2 brackets, on the rung
  // that certifies triplets (cold review finding 6, 2026-09-13).
  let at = 0, bar = 0, inBar = 0, inGroup = 0, group = -1;
  for (const raw of String(pattern).trim().split(/\s+/)) {
    if (raw === '|') {
      if (Math.abs(inBar - barLength) > 1e-6) throw new Error(`bar ${bar + 1} of "${pattern}" holds ${inBar}, needs ${barLength}`);
      if (inGroup !== 0) throw new Error(`bar ${bar + 1} of "${pattern}" ends mid-tuplet`);
      bar++; inBar = 0; inGroup = 0; group = -1; continue;
    }
    const m = /^([a-z0-9]+?)(r?)(~?)$/.exec(raw);
    if (!m || CODE_Q[m[1]] == null) throw new Error('unreadable rhythm token: ' + raw);
    const [, code, rest, tie] = m;
    const q = CODE_Q[code];
    let tuplet = null;
    if (TUPLET_OF[code]) {
      if (inGroup === 0) group++;
      tuplet = { ...TUPLET_OF[code], id: `${bar}:${group}` };
      inGroup = (inGroup + 1) % TUPLET_OF[code].n;
    } else if (inGroup !== 0) {
      throw new Error(`"${pattern}" breaks a tuplet group at "${raw}": a group needs all of its notes`);
    }
    cells.push({
      at, q, code, bar, rest: rest === 'r', tie: tie === '~' ? 'start' : null,
      dots: code.endsWith('d') ? 1 : 0,
      duration: tuplet ? tuplet.base : code.replace(/d$/, ''),
      tuplet,
    });
    // ☠️ Triplet thirds accumulate float dust, and three of them must add to
    // exactly one beat or the bar refuses to balance. Snap to the 48th-note
    // grid notation.mjs already quantises to: it is fine enough for triplets
    // and sixteenths, and it makes 1/3 + 1/3 + 1/3 land on 1.
    at = snap48(at + q);
    inBar = snap48(inBar + q);
  }
  if (Math.abs(inBar - barLength) > 1e-6) throw new Error(`last bar of "${pattern}" holds ${inBar}, needs ${barLength}`);
  if (inGroup !== 0) throw new Error(`"${pattern}" ends mid-tuplet`);
  // mark the receiving half of each tie, so the renderer can draw it and the
  // scorer knows that cell must NOT be struck again. A cell in the middle of a
  // chain (h~ | h~ h) both receives and continues: 'both', or a three-bar tie
  // would read as two separate attacks.
  for (let i = 0; i < cells.length - 1; i++) {
    if (cells[i].tie !== 'start' && cells[i].tie !== 'both') continue;
    cells[i + 1].tie = cells[i + 1].tie === 'start' ? 'both' : 'stop';
  }
  return { cells, bars: bar + 1, barLength, meter };
}
export const isTieStop = (c) => c.tie === 'stop' || c.tie === 'both';

// A tie is one sounded note: fold tied cells into a single sounding event,
// which is exactly what the learner's hands have to do.
export function soundingEvents(cells) {
  const out = [];
  for (const c of cells) {
    if (isTieStop(c) && out.length && !c.rest) { const prev = out[out.length - 1]; prev.q += c.q; prev.cells.push(c); continue; }
    out.push({ at: c.at, q: c.q, rest: c.rest, bar: c.bar, cells: [c] });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 4. An EXERCISE: one authored musical object with three faces.
//    .song   a rendering-compatible song object (ScoreView / EngravedScore /
//            Engine all accept it unchanged)
//    .render the supplemental symbol spec the integrator draws for the things
//            a song object cannot carry: rests, ties, slurs, dynamics,
//            articulation, tuplet brackets, count rows
//    .target what the runner scores against
// One authored source, so the page, the sound and the marking can never drift.
// ---------------------------------------------------------------------------
const fnv = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };

// voices: { R: {pattern, notes:[written...]}, L: {...} }. notes align with the
// NON-REST, non-tie-stop cells of that voice, in order. A note may be an array
// for a chord. Anything else is an authoring error and throws here.
export function exercise(spec) {
  const { id, key = 'C', meter = [4, 4], bpm = 72, name = '', marks = [], countIn = 2, teachingTempo = null } = spec;
  const voices = {};
  const targets = [];
  for (const hand of ['R', 'L']) {
    const v = spec.voices?.[hand] ?? (hand === (spec.hand ?? 'R') && spec.pattern ? { pattern: spec.pattern, notes: spec.notes } : null);
    if (!v) continue;
    const parsed = parseRhythm(v.pattern, meter);
    const state = new BarAccidentals(key);
    let barSeen = 0, ni = 0;
    const cells = [];
    for (const c of parsed.cells) {
      if (c.bar !== barSeen) { barSeen = c.bar; state.barline(); }
      if (c.rest) { cells.push({ ...c, hand, midis: [], written: [] }); continue; }
      if (isTieStop(c)) {
        const prev = cells[cells.length - 1];
        cells.push({ ...c, hand, midis: prev ? [...prev.midis] : [], written: prev ? [...prev.written] : [], tied: true });
        continue;
      }
      const entry = v.notes?.[ni++];
      if (entry == null) throw new Error(`${id}: voice ${hand} has more sounding cells than notes`);
      const list = Array.isArray(entry) ? entry : [entry];
      cells.push({ ...c, hand, midis: list.map((w) => state.midiOf(w)), written: list.map((w) => (typeof w === 'string' ? w : `${w.step}${w.acc ?? ''}${w.octave}`)) });
    }
    if (v.notes && ni !== v.notes.length) throw new Error(`${id}: voice ${hand} has ${v.notes.length} notes for ${ni} sounding cells`);
    voices[hand] = { ...parsed, cells };
    for (const ev of soundingEvents(cells)) if (!ev.rest) targets.push({ hand, at: ev.at, q: ev.q, midis: ev.cells[0].midis, written: ev.cells[0].written, bar: ev.bar });
  }
  if (!Object.keys(voices).length) throw new Error(id + ': an exercise needs at least one voice');
  targets.sort((a, b) => a.at - b.at || a.hand.localeCompare(b.hand));

  const barLength = meter[0] * 4 / meter[1];
  const bars = Math.max(...Object.values(voices).map((v) => v.bars));
  const beatUnit = meter[1];
  // notes carry b/d in the song's OWN beat unit (fur-elise and the 6/8 imports
  // established the convention); quarter units * (beatUnit/4) converts.
  const toUnits = (q) => +(q * beatUnit / 4).toFixed(6);
  const notes = [];
  for (const hand of ['R', 'L']) {
    for (const ev of soundingEvents(voices[hand]?.cells ?? [])) {
      if (ev.rest) continue;
      for (const m of ev.cells[0].midis) notes.push({ b: toUnits(ev.at), d: toUnits(ev.q), m, h: hand });
    }
  }
  notes.sort((a, b) => (a.h === b.h ? a.b - b.b : a.h.localeCompare(b.h)));
  const song = {
    id: 'lab-' + id,
    title: name || 'Study exercise',
    composer: 'Keys study exercise · original, not repertoire',
    labStudy: true,               // ☠️ never push one of these into SONGS
    notRepertoire: true,
    // ☠️ THIS OBJECT IS FOR THE ENGINE AND THE AUDIO, NOT FOR THE PAGE.
    // It carries MIDI numbers and a key name, and engraving.mjs re-derives
    // every note head from those with spellPitch(), which returns the SHARP
    // for a flat-spelled note: a different staff line, not just a different
    // sign. "Flats, spelled as flats" would print sharps. The authored
    // spelling lives in `render`, which is the only notation authority here
    // (cold review finding 5, 2026-09-13).
    labNotation: 'render',
    // song.bpm counts the song's OWN stored beat unit (fur-elise established
    // it: 3/8, beatUnit 8, bpm in eighths). ex.bpm is always the quarter-note
    // tempo, so 6/8 at ♩=60 ships as bpm 120 eighths and the engine's clock,
    // the engraver's bars and the scorer's milliseconds all agree.
    bpm: +(bpm * beatUnit / 4).toFixed(4), timeSig: meter, beatUnit,
    key: FIFTHS[key] != null ? key : undefined,
    sections: [{ name: name || 'Exercise', startBeat: 0, endBeat: toUnits(bars * barLength) }],
    notes,
  };
  // ☠️ CONTENT IDENTITY IS THE MUSIC, NOT THE LABELS. It is built from the
  // meter, the onsets, the written values, the pitches and their SPELLINGS.
  // The id, the name and the tempo are deliberately excluded: the same notation
  // played at a different bpm, or authored under a different exercise id, is
  // the same material and must not be able to pose as fresh evidence.
  const contentId = fnv(['m' + meter.join('/'),
    ...targets.map((t) => `${t.hand}${t.at}:${t.q}:${t.midis.join('.')}:${t.written.join('.')}`),
    // the marks are part of what is on the page: a bar marked f against p is
    // not the same material as the same notes with nothing printed on them
    ...marks.map((k) => `k${k.kind}:${k.value ?? ''}:${k.at ?? ''}:${k.from ?? ''}:${k.to ?? ''}`)].join('|'));
  const ex = {
    id, key, meter, bpm, bars, barLength, name, countIn, teachingTempo,
    voices, targets, song, marks, contentId,
    msPerBeat: 60000 / bpm,                       // one QUARTER note at bpm
    render: renderSpec({ id, key, meter, bars, voices, marks, bpm, countIn, name }),
  };
  ex.countRow = labCountCells(ex);
  return ex;
}

// ☠️ THE COUNT ROW MUST HAVE A CELL FOR EVERY NOTE THE PAGE ASKS FOR.
// It used to be hard-nulled in 6/8 (so the one scaffold the 6/8 guided rung
// declares did not exist) and locked to an eighth grid (so the triplet guided
// rung, whose instruction is "1, 2, tri-pl-et, 4", showed four cells for a bar
// tapped six times). Cold review finding 8, 2026-09-13. The grid is now taken
// from the authored onsets themselves: eighths, thirds or sixteenths.
export function labCountCells(ex) {
  const perBar = ex.barLength;
  const voice = ex.voices.R ?? ex.voices.L;
  const onsets = [...new Set(voice.cells.filter((c) => !c.rest && !isTieStop(c)).map((c) => snap48(c.at % perBar)))].sort((a, b) => a - b);
  const compound = ex.meter[1] === 8 && ex.meter[0] % 3 === 0;
  // the finest division any authored onset actually needs
  const div = [1, 2, 3, 4, 6].find((d) => onsets.every((p) => Math.abs(p * d - Math.round(p * d)) < 1e-6)) ?? 4;
  const active = (pos) => onsets.some((p) => Math.abs(p - pos) < 1e-6);
  const cells = [];
  if (compound) {
    // 6/8 counts its six eighths, with the weight on 1 and 4
    const eighths = ex.meter[0];
    const sub = Math.max(1, Math.round(div / 2));          // extra divisions inside an eighth
    for (let i = 0; i < eighths * sub; i++) {
      const pos = snap48(i / (2 * sub));
      const whole = i % sub === 0;
      cells.push({ label: whole ? String(i / sub + 1) : '+', pos, active: active(pos), beat: i % (3 * sub) === 0, strong: i === 0 });
    }
    return cells;
  }
  if (div === 2) {
    // the ordinary case: reuse rhythm.mjs's own count strip
    return makeCountCells(onsets.filter((p) => Math.abs(p * 2 - Math.round(p * 2)) < 1e-6), ex.meter[0])
      .map((c) => ({ ...c, beat: Number.isInteger(c.pos), strong: c.pos === 0 }));
  }
  const words = { 3: ['', 'trip', 'let'], 4: ['', 'e', '&', 'a'], 6: ['', 'trip', 'let', '&', 'trip', 'let'], 1: [''] };
  for (let i = 0; i < ex.meter[0] * div; i++) {
    const pos = snap48(i / div);
    const slot = i % div;
    cells.push({
      label: slot === 0 ? String(Math.floor(i / div) + 1) : (words[div] ?? [])[slot] ?? '.',
      pos, active: active(pos), beat: slot === 0, strong: i === 0,
    });
  }
  return cells;
}

// ---------------------------------------------------------------------------
// 5. Scoring. Pure functions over an event log, exported so the tests drive
// them directly without a session. Event: {kind:'on'|'off', midi, at, velocity}
// where `at` is milliseconds from the exercise's beat 0 (after the count-in).
// ---------------------------------------------------------------------------

// Pair the sounded notes out of an on/off log: [{midi, onAt, offAt|null}]
export function soundedNotes(events) {
  const open = new Map(), out = [];
  for (const e of [...events].sort((a, b) => a.at - b.at)) {
    if (e.kind === 'on') {
      const rec = { midi: e.midi, onAt: e.at, offAt: null, velocity: e.velocity ?? null, hand: e.hand ?? null, source: e.source ?? null };
      out.push(rec);
      (open.get(e.midi) ?? open.set(e.midi, []).get(e.midi)).push(rec);
    } else {
      const q = open.get(e.midi);
      const rec = q && q.shift();
      if (rec) rec.offAt = e.at;
    }
  }
  return out;
}

// ☠️ ONSETS AND DURATIONS ARE SCORED SEPARATELY, AND BOTH MUST PASS.
// Four quarter notes played where four half notes are written has PERFECT
// onsets. If the model only matched onsets it would call that a clean read of
// a rhythm the learner did not read at all. Durations are checked against the
// written value of the SOUNDING event (a tie is one note, not two), rests are
// checked as silence, and each produces its own fault so the feedback can say
// which of the three things went wrong.
export function scoreRhythm(ex, events, opts = {}) {
  const { hand = null, onsetMs = TOL.onsetMs, checkDurations = true, checkRests = true } = opts;
  const mpb = opts.msPerBeat ?? ex.msPerBeat;
  const sounded = soundedNotes(events);
  const wanted = ex.targets.filter((t) => !hand || t.hand === hand);
  // ☠️ EVERY SOUNDED NOTE IS ATTRIBUTED TO THE HAND OF THE TARGET IT SATISFIED,
  // never to a hand inferred from its pitch. The rest check below reads this
  // map, because a left-hand note sounding through a RIGHT-hand rest is a
  // perfectly correct performance and used to be reported as three rest
  // errors (supervisor repro, 2026-09-13). Pitch cannot tell you the hand;
  // only the authored target can.
  const owner = new Map();   // sounded index -> { hands:Set, at, midi }
  const onsets = [], durations = [], faults = [];

  for (const t of wanted) {
    const idealMs = t.at * mpb;
    // A target can be a CHORD. Every note of it has to be found, or the
    // chord's other notes read as stray extras and a correct performance
    // fails (caught by the whole-curriculum walkthrough, 2026-09-13).
    const picks = [];
    for (const midi of t.midis) {
      let best = null, bestD = Infinity;
      sounded.forEach((s, i) => {
        if (s.midi !== midi) return;
        const held = owner.get(i);
        // A press may be SHARED only by a cross-hand unison on the same beat:
        // one physical key satisfying both staves, the same law Engine's
        // buildGroups applies when it dedupes a unison.
        if (held && !(!held.hands.has(t.hand) && held.at === t.at && held.midi === midi)) return;
        const d = Math.abs(s.onAt - idealMs);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best != null && bestD <= onsetMs * TOL.captureFactor) picks.push({ index: best, note: sounded[best], shared: owner.has(best) });
    }
    if (picks.length < t.midis.length) {
      onsets.push({ target: t, status: 'missing', partial: picks.length });
      faults.push({ kind: 'onset-missing', bar: t.bar, beat: t.at,
        text: picks.length ? `Only ${picks.length} of ${t.midis.length} notes sounded on beat ${beatLabel(t.at, ex)}.` : `Nothing sounded on beat ${beatLabel(t.at, ex)}.` });
      continue;   // a partial chord claims nothing: its picks stay unowned
    }
    for (const p of picks) {
      const rec = owner.get(p.index) ?? { hands: new Set(), at: t.at, midi: p.note.midi };
      rec.hands.add(t.hand);
      owner.set(p.index, rec);
    }
    // the chord's onset is its FIRST note; the hold is its SHORTEST
    const notes = picks.map((p) => p.note);
    const s = notes.reduce((a, b) => (a.onAt <= b.onAt ? a : b));
    const shortest = notes.reduce((a, b) => ((a.offAt ?? Infinity) - a.onAt <= (b.offAt ?? Infinity) - b.onAt ? a : b));
    const delta = s.onAt - idealMs;
    const status = Math.abs(delta) <= onsetMs ? 'on-time' : delta < 0 ? 'early' : 'late';
    onsets.push({ target: t, status, deltaMs: Math.round(delta), sounded: s });
    if (status !== 'on-time') faults.push({ kind: 'onset-' + status, bar: t.bar, beat: t.at, deltaMs: Math.round(delta), text: `Beat ${beatLabel(t.at, ex)} was ${Math.abs(Math.round(delta))}ms ${status === 'late' ? 'late' : 'early'}.` });
    if (!checkDurations) continue;
    const expectedMs = t.q * mpb;
    if (shortest.offAt == null) {
      durations.push({ target: t, status: 'held-on', expectedMs });
      faults.push({ kind: 'duration-held', bar: t.bar, beat: t.at, text: `The note on beat ${beatLabel(t.at, ex)} was never released, so its length cannot be read.` });
      continue;
    }
    const heldMs = shortest.offAt - shortest.onAt;
    const ratio = heldMs / expectedMs;
    const dStatus = ratio < TOL.durMin ? 'short' : ratio > TOL.durMax ? 'long' : 'ok';
    durations.push({ target: t, status: dStatus, heldMs: Math.round(heldMs), expectedMs: Math.round(expectedMs), ratio: +ratio.toFixed(2) });
    if (dStatus !== 'ok') faults.push({
      kind: 'duration-' + dStatus, bar: t.bar, beat: t.at,
      text: `${valueName(t.q)} on beat ${beatLabel(t.at, ex)} held ${Math.round(heldMs)}ms; it is written for ${Math.round(expectedMs)}ms.`,
    });
  }

  // extras: anything sounded that no written note asked for
  const extras = sounded.filter((_, i) => !owner.has(i));
  for (const s of extras) faults.push({ kind: 'onset-extra', beat: +(s.onAt / mpb).toFixed(2), midi: s.midi, text: `An extra note sounded at beat ${(s.onAt / mpb + 1).toFixed(1)}.` });

  // rests: silence is written too. A key still down more than the release
  // grace into a rest is a REST VIOLATION, which is its own fault kind.
  const rests = [];
  if (checkRests) {
    for (const hnd of ['R', 'L']) {
      if (hand && hnd !== hand) continue;
      // ONLY notes this hand was asked to play can violate this hand's rest.
      // The other staff's notes are somebody else's job, and a stray note that
      // matched no target at all is already reported as an extra above.
      const mine = sounded.filter((_, i) => owner.get(i)?.hands.has(hnd));
      for (const ev of soundingEvents(ex.voices[hnd]?.cells ?? [])) {
        if (!ev.rest) continue;
        const from = ev.at * mpb + TOL.restGraceMs, to = (ev.at + ev.q) * mpb - TOL.restGraceMs;
        const offender = mine.find((s) => s.onAt < to && (s.offAt == null || s.offAt > from));
        rests.push({ at: ev.at, q: ev.q, bar: ev.bar, hand: hnd, status: offender ? 'sounded' : 'clean', midi: offender?.midi ?? null });
        if (offender) faults.push({ kind: 'rest-sounded', bar: ev.bar, beat: ev.at, midi: offender.midi, hand: hnd, text: `The ${valueName(ev.q)} rest on beat ${beatLabel(ev.at, ex)} was not silent: the ${hnd === 'R' ? 'right' : 'left'} hand was still holding a key.` });
      }
    }
  }

  const counts = {
    onTime: onsets.filter((o) => o.status === 'on-time').length,
    onsets: onsets.length,
    durationOk: durations.filter((d) => d.status === 'ok').length,
    durations: durations.length,
    restsClean: rests.filter((r) => r.status === 'clean').length,
    rests: rests.length,
    extras: extras.length,
  };
  return {
    onsets, durations, rests, extras, faults, counts,
    passed: counts.onTime === counts.onsets && counts.durationOk === counts.durations &&
      counts.restsClean === counts.rests && counts.extras === 0 && counts.onsets > 0,
  };
}

// Counting and tapping: onsets ONLY, and it says so. Reuses rhythm.mjs's
// matcher rather than growing a second one; the exercise's sounding events
// (ties already folded) become the expected beats.
export function scoreTaps(ex, taps, opts = {}) {
  const mpb = opts.msPerBeat ?? ex.msPerBeat;
  const hand = opts.hand ?? (ex.voices.R ? 'R' : 'L');
  const beats = soundingEvents(ex.voices[hand].cells).filter((e) => !e.rest).map((e) => e.at);
  const round = new RhythmRound(beats, mpb);
  const marks = taps.map((t) => round.tap(typeof t === 'number' ? t : t.at));
  const res = round.result();
  const faults = [];
  if (res.missed) faults.push({ kind: 'onset-missing', text: `${res.missed} written note${res.missed === 1 ? '' : 's'} had no tap.` });
  if (res.extras) faults.push({ kind: 'onset-extra', text: `${res.extras} extra tap${res.extras === 1 ? '' : 's'}.` });
  return { ...res, marks, faults, measures: 'onsets only', passed: res.clean };
}

// Reading pitches in order, untimed. ☠️ A WRONG NOTE DOES NOT RESTART THE
// PHRASE. Reading continuously and repairing a passage are different skills;
// the phrase drill in lessons.mjs restarts on purpose, and this one carries on
// on purpose, because stopping dead at every error is the habit first-reading
// practice is trying to break. The fault is recorded and the recovery span is
// offered afterwards.
export function scoreSequence(ex, presses, opts = {}) {
  const wanted = ex.targets.filter((t) => !opts.hand || t.hand === opts.hand);
  const faults = [];
  let idx = 0, firstTry = 0, wrong = 0, missedCurrent = false;
  const marks = [];
  for (const p of presses) {
    const midi = typeof p === 'number' ? p : p.midi;
    const t = wanted[idx];
    if (!t) { marks.push({ midi, status: 'after-end' }); continue; }
    if (t.midis.includes(midi)) {
      marks.push({ midi, status: missedCurrent ? 'recovered' : 'correct', at: t.at });
      if (!missedCurrent) firstTry++;
      idx++; missedCurrent = false;
    } else {
      wrong++; missedCurrent = true;
      marks.push({ midi, status: 'wrong', expected: t.midis, at: t.at });
      faults.push({ kind: 'wrong-pitch', bar: t.bar, beat: t.at, midi, expected: t.midis, text: `Beat ${beatLabel(t.at, ex)} wanted ${t.written.join(' + ')}.` });
    }
  }
  const missCounts = {};
  for (const f of faults) if (f.expected) for (const m of f.expected) missCounts[m] = (missCounts[m] ?? 0) + 1;
  return {
    marks, faults, wrong, firstTry, done: idx, total: wanted.length,
    explain: explainMiss(missCounts),
    passed: idx >= wanted.length && wrong === 0,
  };
}

// Simultaneous notes (an interval, a triad, an inversion). A released key
// stays evidence for 1.5s so rolled and staccato chords land: the same window
// TogetherDrill and CardTask already use, kept identical on purpose.
// ☠️ THE GROUP GROWS ONLY UNTIL THE CHORD IS COMPLETE. It used to swallow
// everything within 1.5 SECONDS of the first note, so a learner who played two
// inversions correctly at any natural pace (under 1.5s apart) was told the
// first chord "had notes that do not belong to it" and the second "was not
// played". A play-together rung is UNTIMED: nothing on screen asks for a gap,
// so no gap may be required. Cold review finding 2, 2026-09-13.
export const CHORD_WINDOW_MS = 1500;
export function scoreChords(targets, events, opts = {}) {
  const window = opts.windowMs ?? CHORD_WINDOW_MS;
  const sounded = soundedNotes(events);
  const results = [], faults = [];
  const claimed = new Set();
  let cursor = 0;
  for (const t of targets) {
    const want = [...t.midis].sort((a, b) => a - b);
    let hit = null;
    for (let i = cursor; i < sounded.length; i++) {
      const anchor = sounded[i];
      if (!want.includes(anchor.midi)) continue;
      // grow note by note, and STOP the instant every wanted note is present
      const played = new Set();
      let last = i, complete = false;
      for (let j = i; j < sounded.length && sounded[j].onAt - anchor.onAt <= window; j++) {
        played.add(sounded[j].midi);
        last = j;
        if (want.every((m) => played.has(m))) { complete = true; break; }
      }
      if (!complete) continue;
      const strays = [...played].filter((m) => !want.includes(m)).sort((a, b) => a - b);
      hit = { at: anchor.onAt, played: [...played].sort((a, b) => a - b), strays,
        spreadMs: Math.round(sounded[last].onAt - anchor.onAt), from: i, to: last };
      for (let j = i; j <= last; j++) claimed.add(j);
      cursor = last + 1;
      break;
    }
    if (!hit) { results.push({ target: t, status: 'missing' }); faults.push({ kind: 'chord-missing', text: `${t.label ?? t.midis.join(' + ')} was not played.` }); continue; }
    const status = hit.strays.length ? 'extra-notes' : 'ok';
    results.push({ target: t, status, ...hit });
    if (hit.strays.length) faults.push({ kind: 'chord-extra', midis: hit.strays,
      text: `${t.label ?? 'That chord'} had ${hit.strays.length} note(s) that do not belong to it.` });
  }
  // Notes that belong to no chord are real mistakes wherever they fall:
  // stopping the group early must not make a stray key free, before, between
  // or after the chords.
  const loose = sounded.filter((_, i) => !claimed.has(i));
  for (const s of loose) faults.push({ kind: 'chord-extra', midis: [s.midi],
    text: `An extra note was played that belongs to none of the chords asked for.` });
  return { results, faults, loose: loose.length,
    passed: results.length > 0 && results.every((r) => r.status === 'ok') && loose.length === 0 };
}

// Two hands on one grid: the vertical question. Whether the hands ARRIVE
// TOGETHER is the measurement, and it is the two-hand skill's published rule
// (120ms), reused rather than reinvented.
export function scoreVertical(ex, events, opts = {}) {
  const mpb = opts.msPerBeat ?? ex.msPerBeat;
  const maxGap = opts.handGapMs ?? TOL.handGapMs;
  const rhythm = scoreRhythm(ex, events, { ...opts, checkDurations: opts.checkDurations ?? false });
  const byBeat = new Map();
  for (const o of rhythm.onsets) {
    if (o.status === 'missing') continue;
    const slot = byBeat.get(o.target.at) ?? byBeat.set(o.target.at, {}).get(o.target.at);
    slot[o.target.hand] = Math.min(slot[o.target.hand] ?? Infinity, o.sounded.onAt);
  }
  const joins = [], faults = [];
  for (const [at, slot] of [...byBeat].sort((a, b) => a[0] - b[0])) {
    if (slot.R == null || slot.L == null) continue;
    const gapMs = Math.round(Math.abs(slot.R - slot.L));
    joins.push({ at, gapMs, together: gapMs <= maxGap, lead: slot.R < slot.L ? 'R' : 'L' });
    if (gapMs > maxGap) faults.push({ kind: 'hands-apart', beat: at, gapMs, text: `Beat ${beatLabel(at, ex)}: the hands were ${gapMs}ms apart (${slot.R < slot.L ? 'right' : 'left'} first).` });
  }
  return {
    rhythm, joins, faults: [...rhythm.faults, ...faults],
    together: joins.filter((j) => j.together).length, chords: joins.length,
    passed: rhythm.passed && joins.length > 0 && joins.every((j) => j.together),
  };
}

// ---------------------------------------------------------------------------
// 6. Expression. ☠️ MEASURE ONLY WHAT THE DATA SUPPORTS. A keyboard reports
// keys, velocities, releases and a pedal. It cannot see fingers, gaze, posture,
// tension or intent, and a velocity comparison across registers is false
// precision without touch calibration (voicing.mjs refuses it, and so do we).
// Where a card's dimension is not measurable with the data in hand it becomes
// an honest LISTENING SELF CHECK, whose answer is stored as a self report and
// can never become competence.
// ---------------------------------------------------------------------------
export const EXPRESSION_SUPPORT = {
  'note-off': 'Key release times: legato, detached and staccato are measurable.',
  velocity: 'Key velocity: loud-versus-soft ON THE SAME KEY is measurable; comparing different registers needs touch calibration.',
  'velocity-calibrated': 'Touch calibration present: melody-versus-accompaniment balance is measurable across hands.',
  pedal: 'Sustain pedal transitions: pedal changes against harmony changes are measurable.',
  listening: 'Not measurable from MIDI. This one is your ears and your own verdict.',
};

// Convert a lab event log into the engine's playLog shape, so the existing
// analyzers work unchanged.
export function toPlayLog(ex, events, opts = {}) {
  const mpb = opts.msPerBeat ?? ex.msPerBeat;
  const scored = scoreRhythm(ex, events, { checkDurations: false, checkRests: false, ...opts });
  const log = [];
  for (const o of scored.onsets) {
    if (o.status === 'missing') continue;
    log.push({ m: o.sounded.midi, h: o.target.hand, b: o.target.at, d: o.target.q, onMs: o.sounded.onAt, offMs: o.sounded.offAt, vel: o.sounded.velocity });
  }
  return { log, mpb, scored };
}

// Joined or separated, measured from real releases (artic.mjs does the work).
export function scoreTouch(ex, events, goal /* 'legato' | 'staccato' */, opts = {}) {
  const { log: full, mpb, scored } = toPlayLog(ex, events, opts);
  // A touch goal can cover PART of an exercise: the tie-versus-slur card asks
  // for legato only over the slurred bar, and judging the tied bar by the same
  // rule would fail a correct read of it.
  const from = opts.fromBeat ?? -Infinity, to = opts.toBeat ?? Infinity;
  const log = full.filter((e) => e.b >= from && e.b < to);
  const released = log.filter((e) => e.offMs != null);
  if (released.length < 3) return { supported: false, why: 'Not enough released notes to judge how they joined.', scored };
  const analysis = analyzeArticulation(log, mpb);
  const faults = [];
  if (goal === 'legato') {
    const choppy = analysis.joins.filter((j) => j.kind === 'choppy');
    for (const j of choppy) faults.push({ kind: 'not-legato', beat: j.beat, text: `Beat ${beatLabel(j.beat, ex)}: ${Math.round(j.gapMs)}ms of daylight before the next note.` });
    const joined = analysis.joins.filter((j) => j.kind === 'legato' || (j.kind === 'detached' && j.gapMs <= TOL.legatoJoinMs)).length;
    return { supported: true, goal, analysis, faults, joined, joins: analysis.joins.length, scored,
      passed: analysis.joins.length > 0 && joined >= analysis.joins.length - 1 && scored.passed };
  }
  const shorts = log.filter((e) => e.offMs != null && (e.offMs - e.onMs) <= TOL.staccatoMaxFrac * e.d * mpb).length;
  for (const e of log) {
    if (e.offMs != null && (e.offMs - e.onMs) > TOL.staccatoMaxFrac * e.d * mpb)
      faults.push({ kind: 'not-staccato', beat: e.b, text: `Beat ${beatLabel(e.b, ex)}: held ${Math.round(e.offMs - e.onMs)}ms, over half its written length.` });
  }
  return { supported: true, goal, analysis, faults, shorts, notes: log.length, scored,
    passed: log.length > 0 && shorts === log.length && scored.passed };
}

// Loud against soft ON THE SAME KEY. Supported without calibration precisely
// because it is the same physical key: no cross-register inference is made.
export function scoreDynamicContrast(ex, events, plan, opts = {}) {
  const { log, scored } = toPlayLog(ex, events, opts);
  const withVel = log.filter((e) => e.vel != null);
  if (withVel.length < log.length || !log.length) return { supported: false, why: 'This input did not report how hard the keys were pressed.', scored };
  const groups = {};
  for (const e of withVel) {
    const mark = plan.find((p) => Math.abs(p.at - e.b) < 1e-6 || (p.from <= e.b && e.b < p.to));
    if (!mark) continue;
    (groups[mark.level] ??= []).push({ midi: e.m, vel: e.vel });
  }
  const levels = Object.keys(groups);
  if (levels.length < 2) return { supported: false, why: 'Both dynamic levels are needed before they can be compared.', scored };
  // same-key comparison only: pitches present in both groups
  const shared = [...new Set(groups[levels[0]].map((g) => g.midi))].filter((m) => levels.every((l) => groups[l].some((g) => g.midi === m)));
  if (!shared.length) return { supported: false, why: 'The two levels share no common key, so the comparison would cross registers.', scored };
  const mean = (xs) => xs.reduce((a, v) => a + v, 0) / xs.length;
  const loud = mean(groups.f?.filter((g) => shared.includes(g.midi)).map((g) => g.vel) ?? []);
  const soft = mean(groups.p?.filter((g) => shared.includes(g.midi)).map((g) => g.vel) ?? []);
  const contrast = Math.round(loud - soft);
  return {
    supported: true, contrast, loud: Math.round(loud), soft: Math.round(soft), shared, scored,
    faults: contrast >= TOL.velContrastMin ? [] : [{ kind: 'no-contrast', text: `Loud and soft were only ${contrast} apart on the same key; aim for at least ${TOL.velContrastMin}.` }],
    passed: contrast >= TOL.velContrastMin && scored.passed,
  };
}

// Melody over accompaniment: refuses without touch calibration, by design.
export function scoreBalance(ex, events, cal, opts = {}) {
  const { log, scored } = toPlayLog(ex, events, opts);
  if (!cal?.zones) return { supported: false, why: 'Balance across two hands compares different registers, which needs touch calibration first.', scored };
  const res = analyzeVoicing(log, cal, opts);
  if (!res) return { supported: false, why: 'Not enough two-hand velocity data in this passage to judge balance.', scored };
  return { supported: true, voicing: res, scored,
    faults: res.abovePct >= 70 ? [] : [{ kind: 'buried-melody', text: `The melody stood above the accompaniment in ${res.abovePct}% of windows.` }],
    passed: res.abovePct >= 70 && scored.passed };
}

// Pedal changes against the harmony changes the LEFT HAND actually played.
export function scorePedal(ex, events, pedalLog, opts = {}) {
  if (!pedalLog?.length) return { supported: false, why: 'No sustain pedal was connected or used, so pedalling cannot be judged.' };
  const { log, scored } = toPlayLog(ex, events, opts);
  const findings = analyzePedal(pedalLog, log, { sections: opts.sections ?? [] });
  const faults = findings.map((f) => ({ kind: 'pedal-' + f.type, beat: f.beat,
    text: f.type === 'late' ? `The pedal held through the harmony change at beat ${beatLabel(f.beat, ex)}.`
      : f.type === 'blur' ? `${f.pcs} different notes rang under one pedal from beat ${beatLabel(f.beat, ex)}.`
      : `"${f.section}" asks for pedal and none was used.` }));
  return { supported: true, findings, faults, scored, passed: findings.length === 0 && scored.passed };
}

// ---------------------------------------------------------------------------
// 7. The authored curriculum. Every card is a FIVE-RUNG ladder:
//    worked example -> guided attempt -> independent challenge -> later recall
//    -> transfer to different material.
// Every rung names the input it takes and what that input actually measures.
// The exercises below are built at module load, so a bar that does not add up
// throws here and can never reach a learner.
// ---------------------------------------------------------------------------
export const LAB_SKILLS = {
  'rhythm-pulse': 'Keeping a written pulse',
  'rhythm-duration': 'Playing written note lengths',
  'rhythm-rests': 'Reading rests as silence',
  'rhythm-subdivision': 'Reading eighths and their rests',
  'rhythm-dots-ties': 'Dots and ties',
  'rhythm-meter': 'Reading in 3/4 and 6/8',
  'rhythm-tuplets': 'Triplets',
  'read-accidentals': 'Flats, naturals and how long an accidental lasts',
  'read-key-signatures': 'Key signatures and the pitches they produce',
  'read-symbols': 'Dynamics, articulation, ties and slurs',
  'read-range': 'Ledger lines and the outer registers',
  'read-position': 'Reading notes independently of hand position',
  'read-intervals': 'Landmark-then-interval reading',
  'read-vertical': 'Reading two staves together',
  'applied-harmony': 'Hearing and playing the harmony of a passage',
  'expression-touch': 'Legato and staccato',
  'expression-dynamics': 'Loud and soft under control',
  'expression-pedal': 'Pedalling with the harmony',
};

const E = (spec) => exercise(spec);
const say = (...lines) => lines;
// a stage. `measures` is the honest sentence about what the rung can see.
const rung = (kind, input, ex, extra = {}) => ({ kind, input, ex, ...extra });

// ---- track 1: written rhythm (brief package 2) -----------------------------
const RHYTHM_CARDS = [
  {
    id: 'rh-pulse', track: 'rhythm', skill: 'rhythm-pulse',
    title: 'The pulse, and quarter notes',
    teaches: say(
      'A quarter note is one beat. Four of them fill a 4/4 bar, and the bar lines are just the fence around each group of four.',
      'Count out loud: 1, 2, 3, 4. The written notes tell you WHERE in that count something happens.',
      'This first card is about arriving on the beat. It does not yet care how long you hold anything.',
    ),
    measures: 'Onset timing against the written beat, within 150ms. Nothing else.',
    stages: [
      rung('worked', 'listen', E({ id: 'rh-pulse-w', bpm: 60, pattern: 'q q q q', notes: ['C4', 'C4', 'C4', 'C4'], name: 'Four quarter notes' }),
        { title: 'Watch and listen', say: say('Four quarter notes, one per count. The app plays them; follow the count row underneath.') }),
      rung('guided', 'tap-rhythm', E({ id: 'rh-pulse-g', bpm: 60, pattern: 'q q q q | q q q q', notes: Array(8).fill('C4'), name: 'Tap the pulse' }),
        { title: 'Tap it with the count showing', help: 'countRow', say: say('Tap any key, or click, on each written note. The count row lights as it goes.') }),
      rung('independent', 'tap-rhythm', E({ id: 'rh-pulse-i', bpm: 76, pattern: 'q q q q | q q q q | q q q q', notes: Array(12).fill('C4'), name: 'Three bars, no count row' }),
        { title: 'Now without the count row', say: say('Same job, a little quicker, and the count row is off.') }),
      rung('recall', 'tap-rhythm', E({ id: 'rh-pulse-r', bpm: 84, pattern: 'q q q q | q q q q', notes: ['E4', 'E4', 'G4', 'G4', 'E4', 'E4', 'C4', 'C4'], name: 'Come back to it' }),
        { title: 'A day later', say: say('Same skill, a different tempo. This one only counts if a day has passed.') }),
      rung('transfer', 'play-rhythm', E({ id: 'rh-pulse-t', bpm: 72, pattern: 'q q q q', notes: ['G4', 'G4', 'G4', 'G4'], name: 'The pulse, on the keys' }),
        { title: 'Take it to the keyboard', say: say('Same pulse, now played as G above middle C, held for its full beat each time.') }),
    ],
  },
  {
    id: 'rh-values', track: 'rhythm', skill: 'rhythm-duration',
    title: 'Whole, half and quarter notes',
    teaches: say(
      'A hollow note head with no stem is a WHOLE note: four beats. Hollow with a stem is a HALF note: two beats. Filled with a stem is a QUARTER note: one beat.',
      'Length is not decoration. A half note that you let go after one beat is a different rhythm from the one on the page.',
      'So this card watches the key going DOWN and the key coming UP.',
    ),
    measures: 'Onset timing AND how long each key was actually held, against the written value. Right onsets with wrong lengths is a fail, not a near miss.',
    stages: [
      rung('worked', 'listen', E({ id: 'rh-values-w', bpm: 60, pattern: 'w | h h | q q q q', notes: Array(7).fill('C4'), name: 'The three values' }),
        { title: 'One bar each', say: say('A whole bar, then two halves, then four quarters. Listen for how long each one rings.') }),
      rung('guided', 'play-rhythm', E({ id: 'rh-values-g', bpm: 60, pattern: 'h h | q q q q', notes: Array(6).fill('C4'), name: 'Hold the halves' }),
        { title: 'Hold each note for its written value', help: 'holdBar', say: say('Middle C throughout. Keep the key down for the whole value, then release cleanly.') }),
      rung('independent', 'play-rhythm', E({ id: 'rh-values-i', bpm: 66, pattern: 'q q h | w', notes: ['G4', 'F4', 'E4', 'C4'], name: 'Mixed values' }),
        { title: 'Mixed values, no hold bar', say: say('Two quarters, a half, then a whole note. Read the shapes, not the pattern you just played.') }),
      rung('recall', 'play-rhythm', E({ id: 'rh-values-r', bpm: 66, pattern: 'h q q | w', notes: ['E4', 'F4', 'G4', 'C4'], name: 'A day later' }),
        { title: 'Different order, same values', say: say('The values are in a new order, so this cannot be played from memory of the last one.') }),
      rung('transfer', 'play-rhythm', E({ id: 'rh-values-t', bpm: 64, hand: 'L', pattern: 'h h | q q h', notes: ['C3', 'E3', 'G3', 'E3', 'C3'], name: 'Left hand, bass clef' }),
        { title: 'The same values, bass clef', say: say('Left hand now. The note values mean exactly the same thing on the bottom staff.') }),
    ],
  },
  {
    id: 'rh-rests', track: 'rhythm', skill: 'rhythm-rests',
    title: 'Rests: the silence is written too',
    teaches: say(
      'A quarter rest fills one beat with silence. A half rest is a small block sitting ON the middle line; a whole rest hangs UNDER the line above it.',
      'A rest is not a pause in the music. The pulse keeps going: you are playing the silence.',
      'On the piano that means the key has to come UP. A held note through a rest is the most common way a beginner rhythm goes wrong.',
    ),
    measures: 'Onsets, held lengths, and whether any key was still sounding during a written rest.',
    stages: [
      rung('worked', 'listen', E({ id: 'rh-rests-w', bpm: 60, pattern: 'q qr q qr', notes: ['C4', 'C4'], name: 'Note, rest, note, rest' }),
        { title: 'Listen to the gaps', say: say('Count 1 2 3 4 out loud. You play on 1 and 3, and you are silent on 2 and 4.') }),
      rung('guided', 'play-rhythm', E({ id: 'rh-rests-g', bpm: 60, pattern: 'q qr q qr | q qr h', notes: ['C4', 'E4', 'G4', 'E4'], name: 'Lift on the rests' }),
        { title: 'Lift your hand on every rest', help: 'restMarkers', say: say('The rest cells are marked. Release as the rest arrives, not after it.') }),
      rung('independent', 'play-rhythm', E({ id: 'rh-rests-i', bpm: 66, pattern: 'q q hr | qr q q q', notes: ['G4', 'F4', 'E4', 'D4', 'C4'], name: 'Rests in the middle' }),
        { title: 'No rest markers', say: say('A half rest ends bar one, and bar two starts with silence. Keep counting through both.') }),
      rung('recall', 'play-rhythm', E({ id: 'rh-rests-r', bpm: 66, pattern: 'hr h | q qr q qr', notes: ['E4', 'C4', 'E4'], name: 'Starting on silence' }),
        { title: 'Start on a rest', say: say('Bar one begins with a half rest: count 1 and 2 before you play anything.') }),
      rung('transfer', 'play-rhythm', E({ id: 'rh-rests-t', bpm: 63, hand: 'L', pattern: 'q qr q qr | hr h', notes: ['C3', 'G3', 'C3'], name: 'Rests, left hand' }),
        { title: 'Rests in the bass', say: say('Left hand. Same rests, different staff and a different key to lift.') }),
    ],
  },
  {
    id: 'rh-eighths', track: 'rhythm', skill: 'rhythm-subdivision',
    title: 'Eighth notes and the "and"',
    teaches: say(
      'Two eighth notes fill one beat. Written alone each has a flag; written in pairs they are joined by a beam, which is there to show you the beat they share.',
      'Count them "1 and 2 and 3 and 4 and". The eighths land on the numbers and on the ands.',
      'Beaming is a reading aid: beams group by beat, so a beam tells you where one beat starts and ends.',
    ),
    measures: 'Onsets at half-beat positions, and on the played rungs the held length of each eighth.',
    stages: [
      rung('worked', 'listen', E({ id: 'rh-8-w', bpm: 60, pattern: '8 8 q 8 8 q', notes: Array(6).fill('C4'), name: 'Eighths and quarters' }),
        { title: 'Two per beat', say: say('The beamed pairs are twice the speed of the single quarters beside them.') }),
      rung('guided', 'tap-rhythm', E({ id: 'rh-8-g', bpm: 60, pattern: '8 8 q q q | q 8 8 q q', notes: Array(10).fill('C4'), name: 'Tap the ands' }),
        { title: 'Tap it with the count row', help: 'countRow', say: say('The count row shows every "and". Tap the lit cells.') }),
      rung('independent', 'play-rhythm', E({ id: 'rh-8-i', bpm: 66, pattern: '8 8 8 8 h | q 8 8 h', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4'], name: 'A run of eighths' }),
        { title: 'Play the eighths', say: say('Four eighths climb, then a half note. Keep the eighths even and let the half notes ring.') }),
      rung('recall', 'play-rhythm', E({ id: 'rh-8-r', bpm: 66, pattern: '8 8 q 8 8 q | 8 8 8 8 h', notes: ['G4', 'F4', 'E4', 'D4', 'C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4'], name: 'A day later' }),
        { title: 'Different shape, same subdivision', say: say('New notes, so the eighths have to be read rather than remembered.') }),
      rung('transfer', 'play-rhythm', E({ id: 'rh-8-t', bpm: 63, hand: 'L', pattern: '8 8 q q q | h h', notes: ['C3', 'D3', 'E3', 'D3', 'C3', 'G2', 'C3'], name: 'Eighths, left hand' }),
        { title: 'Eighths in the bass', say: say('The left hand reads the same beams on the bottom staff.') }),
    ],
  },
  {
    id: 'rh-eighth-rests', track: 'rhythm', skill: 'rhythm-subdivision',
    title: 'Eighth rests',
    teaches: say(
      'An eighth rest is half a beat of silence. It is the squiggle with one hook, the mirror of the eighth note flag.',
      'Off-beat playing is usually an eighth rest doing its job: silence on the number, sound on the "and".',
      'Release exactly on the rest. On a piano the release is the rhythm.',
    ),
    measures: 'Half-beat onsets, held lengths, and silence through every eighth rest.',
    stages: [
      rung('worked', 'listen', E({ id: 'rh-8r-w', bpm: 60, pattern: '8 8r 8 8r q q', notes: ['C4', 'E4', 'G4', 'E4'], name: 'Short and gone' }),
        { title: 'Sound, gap, sound, gap', say: say('Each eighth is followed by an eighth of silence. Count "1 and 2 and".') }),
      rung('guided', 'play-rhythm', E({ id: 'rh-8r-g', bpm: 58, pattern: '8 8r 8 8r q q | 8 8r 8 8r h', notes: ['C4', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4'], name: 'Lift on every off-beat' }),
        { title: 'Release on each rest', help: 'restMarkers', say: say('The rests are marked. The key must be up before the next count.') }),
      rung('independent', 'play-rhythm', E({ id: 'rh-8r-i', bpm: 63, pattern: '8r 8 8r 8 q q | q 8r 8 h', notes: ['D4', 'F4', 'A4', 'G4', 'F4', 'E4', 'D4'], name: 'Starting off the beat' }),
        { title: 'Play on the "and"', say: say('Bar one begins with an eighth rest, so your first note lands on the first "and".') }),
      rung('recall', 'play-rhythm', E({ id: 'rh-8r-r', bpm: 63, pattern: '8 8r q 8 8r q | h h', notes: ['E4', 'D4', 'C4', 'D4', 'E4', 'G4'], name: 'A day later' }),
        { title: 'Off-beats again', say: say('Different notes, same rest. Count the silences out loud if it helps.') }),
      rung('transfer', 'play-rhythm', E({ id: 'rh-8r-t', bpm: 60, hand: 'L', pattern: '8 8r 8 8r h | q q h', notes: ['C3', 'G3', 'C3', 'E3', 'G3', 'C3'], name: 'Off-beats, left hand' }),
        { title: 'The same rests, bass clef', say: say('Left hand. Bass accompaniments live on these off-beats.') }),
    ],
  },
  {
    id: 'rh-dots', track: 'rhythm', skill: 'rhythm-dots-ties',
    title: 'The dot adds half again',
    teaches: say(
      'A dot after a note head adds HALF of that note\'s value back on. A dotted half is 2 + 1 = 3 beats. A dotted quarter is 1 + a half = one and a half beats.',
      'A dotted quarter is almost always followed by a lone eighth: together they make two beats, and that pair is everywhere in real music.',
      'The dot sits to the RIGHT of the note head, in a space, never on a line.',
    ),
    measures: 'Onsets and held lengths, where the length is the thing the dot changes.',
    stages: [
      rung('worked', 'listen', E({ id: 'rh-dot-w', bpm: 60, pattern: 'hd q | qd 8 h', notes: ['C4', 'D4', 'E4', 'D4', 'C4'], name: 'Dotted half, dotted quarter' }),
        { title: 'Hear the extra half', say: say('Bar one: three beats then one. Bar two: the long-short pair, then a half note.') }),
      rung('guided', 'play-rhythm', E({ id: 'rh-dot-g', bpm: 58, pattern: 'hd q | qd 8 h', notes: ['C4', 'D4', 'E4', 'D4', 'C4'], name: 'Hold the dot' }),
        { title: 'Hold through the dot', help: 'holdBar', say: say('The hold bar shows the full dotted length. Do not clip the dot off.') }),
      rung('independent', 'play-rhythm', E({ id: 'rh-dot-i', bpm: 63, pattern: 'qd 8 q q | hd q', notes: ['G4', 'F4', 'E4', 'D4', 'C4', 'E4'], name: 'Long-short' }),
        { title: 'Read the dots', say: say('The dotted quarter and its eighth are one beat-and-a-half plus a half.') }),
      rung('recall', 'play-rhythm', E({ id: 'rh-dot-r', bpm: 63, pattern: 'qd 8 h | q qd 8 q', notes: ['E4', 'F4', 'G4', 'C4', 'D4', 'E4', 'D4'], name: 'A day later' }),
        { title: 'Dots in a new place', say: say('The dotted pair moves inside the bar, so its position has to be read.') }),
      rung('transfer', 'play-rhythm', E({ id: 'rh-dot-t', bpm: 60, hand: 'L', pattern: 'hd q | qd 8 h', notes: ['C3', 'G2', 'C3', 'D3', 'E3'], name: 'Dots, left hand' }),
        { title: 'Dotted values in the bass', say: say('Left hand, bass clef, the same arithmetic.') }),
    ],
  },
  {
    id: 'rh-ties', track: 'rhythm', skill: 'rhythm-dots-ties',
    title: 'Ties across beats and bar lines',
    teaches: say(
      'A tie is a curved line joining two notes of the SAME pitch. It means one sound, held for both values added together. You press once.',
      'Ties exist because a bar line cannot be crossed by a single note head. A note that needs to ring past the bar line is written as two notes tied.',
      'Count the beats underneath the tie anyway. The count keeps going; only the attack disappears.',
    ),
    measures: 'Exactly one onset per tied pair, and a hold that covers the combined value. A second attack on the tied note is an extra onset and fails.',
    stages: [
      rung('worked', 'listen', E({ id: 'rh-tie-w', bpm: 60, pattern: 'h q~ q | w', notes: ['C4', 'E4', 'G4'], name: 'One sound, two note heads' }),
        { title: 'Two heads, one press', say: say('The tied quarter pair is one two-beat sound. Watch: the key goes down once.') }),
      rung('guided', 'play-rhythm', E({ id: 'rh-tie-g', bpm: 58, pattern: 'h q~ q | w', notes: ['C4', 'E4', 'G4'], name: 'Hold the tie' }),
        { title: 'Press once, hold through', help: 'holdBar', say: say('The hold bar spans both tied heads. Keep the key down for all of it.') }),
      rung('independent', 'play-rhythm', E({ id: 'rh-tie-i', bpm: 63, pattern: 'q q h~ | h h', notes: ['C4', 'D4', 'E4', 'G4'], name: 'A tie over the bar line' }),
        { title: 'Across the bar line', say: say('The half note at the end of bar one rings into bar two. Do not re-strike it on beat one.') }),
      rung('recall', 'play-rhythm', E({ id: 'rh-tie-r', bpm: 63, pattern: 'h h~ | h q q', notes: ['E4', 'G4', 'F4', 'E4'], name: 'A day later' }),
        { title: 'Another tie over the line', say: say('Different notes, same job: one attack, four beats of sound.') }),
      rung('transfer', 'play-rhythm', E({ id: 'rh-tie-t', bpm: 60, hand: 'L', pattern: 'h q~ q | w', notes: ['C3', 'G2', 'C3'], name: 'Ties, left hand' }),
        { title: 'A tied bass note', say: say('Left hand. A held bass note under a moving right hand is what this is for.') }),
    ],
  },
  {
    id: 'rh-tie-vs-slur', track: 'rhythm', skill: 'read-symbols',
    title: 'A tie is not a slur',
    teaches: say(
      'They look the same: a curved line between two notes. The difference is what is under it.',
      'SAME pitch = a TIE: one press, held through both. DIFFERENT pitches = a SLUR: press both, joined smoothly with no gap between them.',
      'So the curve never tells you on its own. Look at the note heads first, then read the curve.',
    ),
    measures: 'For the tie: one onset and a full-length hold. For the slur: two onsets joined within 80ms of each other. Both are played evidence, not a label.',
    stages: [
      rung('worked', 'listen', E({ id: 'rh-ts-w', bpm: 60, pattern: 'q~ q h | q q h', notes: ['C4', 'E4', 'C4', 'D4', 'E4'], name: 'Tie, then slur', marks: [{ kind: 'slur', from: 4, to: 5, text: 'slur' }] }),
        { title: 'Same curve, two meanings', say: say('Bar one ties C to C: one sound. Bar two slurs C to D: two sounds, joined.') }),
      rung('guided', 'play-rhythm', E({ id: 'rh-ts-g', bpm: 58, pattern: 'q~ q h', notes: ['C4', 'E4'], name: 'Play the tie' }),
        { title: 'The tie: press once', help: 'holdBar', say: say('Two quarter heads tied. One press, held for two beats.') }),
      rung('independent', 'play-rhythm', E({ id: 'rh-ts-i', bpm: 60, pattern: 'q~ q h | q q h', notes: ['G4', 'E4', 'C4', 'D4', 'E4'], name: 'Tell them apart', marks: [{ kind: 'slur', from: 4, to: 5, text: 'slur' }] }),
        { title: 'One bar of each', say: say('Bar one is tied: one attack. Bar two is slurred: two attacks, joined with no daylight.'),
          touchGoal: { goal: 'legato', fromBeat: 4 } }),
      rung('recall', 'play-rhythm', E({ id: 'rh-ts-r', bpm: 60, pattern: 'h h~ | h q q', notes: ['G4', 'F4', 'E4', 'D4'], name: 'A day later' }),
        { title: 'Which curve is this?', say: say('Read the pitches under the curve before you decide how many times to press.') }),
      rung('transfer', 'play-rhythm', E({ id: 'rh-ts-t', bpm: 58, hand: 'L', pattern: 'q~ q h | q q h', notes: ['C3', 'G3', 'C3', 'D3', 'E3'], name: 'Tie and slur, left hand', marks: [{ kind: 'slur', from: 4, to: 5, text: 'slur' }] }),
        { title: 'Both, in the bass', say: say('Left hand. The tie is still one press; the slur is still two, joined.') }),
    ],
  },
  {
    id: 'rh-three-four', track: 'rhythm', skill: 'rhythm-meter',
    title: 'Three-four time',
    teaches: say(
      'The top number of the time signature counts the beats in a bar; the bottom number says which note value gets one beat. 3/4 is three quarter-note beats per bar.',
      'Count 1 2 3, 1 2 3. Beat one is the strong one, and the bar line always arrives after three.',
      'A dotted half note fills a whole 3/4 bar. That is the value to expect at the end of a phrase.',
    ),
    measures: 'Onsets and held lengths against a three-beat bar. Waltzes fail here if you keep counting four.',
    stages: [
      rung('worked', 'listen', E({ id: 'rh-34-w', meter: [3, 4], bpm: 66, pattern: 'q q q | hd', notes: ['C4', 'D4', 'E4', 'C4'], name: 'One, two, three' }),
        { title: 'Three per bar', say: say('Three quarters, then one dotted half that fills a whole bar on its own.') }),
      rung('guided', 'tap-rhythm', E({ id: 'rh-34-g', meter: [3, 4], bpm: 66, pattern: 'q q q | hd | q q q | hd', notes: ['C4', 'D4', 'E4', 'C4', 'C4', 'D4', 'E4', 'C4'], name: 'Tap a waltz' }),
        { title: 'Tap the three-count', help: 'countRow', say: say('Say "1 2 3" aloud with the count row. The first beat of each bar is the heavy one.') }),
      rung('independent', 'play-rhythm', E({ id: 'rh-34-i', meter: [3, 4], bpm: 69, pattern: 'q q q | h q | qd 8 q | hd', notes: ['G4', 'F4', 'E4', 'D4', 'E4', 'F4', 'E4', 'D4', 'C4'], name: 'A waltz phrase' }),
        { title: 'Play it in three', say: say('Four bars of 3/4, including a dotted-quarter pair. Keep the count at three.') }),
      rung('recall', 'play-rhythm', E({ id: 'rh-34-r', meter: [3, 4], bpm: 69, pattern: 'h q | q q q | hd', notes: ['E4', 'D4', 'C4', 'D4', 'E4', 'G4'], name: 'A day later' }),
        { title: 'Three again', say: say('A new phrase in 3/4 so the bar length has to be read, not remembered.') }),
      rung('transfer', 'play-rhythm', E({ id: 'rh-34-t', meter: [3, 4], bpm: 66, pattern: 'q qr q | hd', notes: ['C4', 'G4', 'E4'], name: 'Three-four with a rest' }),
        { title: 'A rest inside three', say: say('The middle beat is silent. Counting three keeps the rest in its place.') }),
    ],
  },
  {
    id: 'rh-six-eight', track: 'rhythm', skill: 'rhythm-meter',
    title: 'Six-eight: two big beats',
    teaches: say(
      'In 6/8 there are six eighth notes in a bar, and they group in TWO threes. The beat you feel is the dotted quarter, not the eighth.',
      'Count it "1 2 3 4 5 6" while you are learning, then "ONE-two-three TWO-two-three" once it moves.',
      'The beams say it out loud: eighths beam in threes, one beam group per big beat.',
    ),
    measures: 'Onsets and lengths against a compound bar whose beat unit is the dotted quarter. The tempo mark is printed as a dotted quarter for exactly that reason.',
    stages: [
      rung('worked', 'listen', E({ id: 'rh-68-w', meter: [6, 8], bpm: 90, pattern: '8 8 8 8 8 8 | qd qd', notes: ['C4', 'D4', 'E4', 'F4', 'E4', 'D4', 'C4', 'G4'], name: 'Six eighths, two beats' }),
        { title: 'Two groups of three', say: say('Six eighths beamed in two groups, then one dotted quarter per group.') }),
      rung('guided', 'tap-rhythm', E({ id: 'rh-68-g', meter: [6, 8], bpm: 90, pattern: '8 8 8 8 8 8 | qd qd', notes: ['C4', 'D4', 'E4', 'F4', 'E4', 'D4', 'C4', 'G4'], name: 'Tap the sixes' }),
        { title: 'Tap the six', help: 'countRow', say: say('Tap every eighth, and feel the weight arrive on 1 and on 4.') }),
      rung('independent', 'play-rhythm', E({ id: 'rh-68-i', meter: [6, 8], bpm: 96, pattern: 'q 8 q 8 | 8 8 8 8 8 8', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4', 'D4'], name: 'Long-short in six' }),
        { title: 'The lilt', say: say('A quarter plus an eighth fills one dotted-quarter beat. That lilt is what 6/8 is for.') }),
      rung('recall', 'play-rhythm', E({ id: 'rh-68-r', meter: [6, 8], bpm: 96, pattern: 'qd 8 8 8 | qd qd', notes: ['G4', 'F4', 'E4', 'D4', 'C4', 'G4'], name: 'A day later' }),
        { title: 'Six again', say: say('A dotted quarter fills a whole beat; then three eighths fill the next.') }),
      rung('transfer', 'play-rhythm', E({ id: 'rh-68-t', meter: [6, 8], bpm: 90, hand: 'L', pattern: '8 8 8 8 8 8 | qd qd', notes: ['C3', 'E3', 'G3', 'C3', 'E3', 'G3', 'C3', 'G2'], name: 'Six-eight, left hand' }),
        { title: 'Compound time in the bass', say: say('Left hand. Broken chords in 6/8 are the classic accompaniment shape.') }),
    ],
  },
  {
    id: 'rh-triplets', track: 'rhythm', skill: 'rhythm-tuplets',
    title: 'Triplets: three in the time of two',
    teaches: say(
      'A triplet is three notes squeezed into the time two of them would normally take. It is written with a small 3 and usually a bracket.',
      'An eighth-note triplet fills ONE quarter-note beat with three even notes. Say "tri-pl-et" or "straw-ber-ry" on the beat.',
      'They are not the same as three eighths: three eighths would take a beat and a half.',
    ),
    measures: 'Onsets on the one-third grid inside the beat, and the evenness of the three notes in each group.',
    stages: [
      rung('worked', 'listen', E({ id: 'rh-tri-w', bpm: 60, pattern: 'q q t8 t8 t8 q', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'C4'], name: 'One triplet group' }),
        { title: 'Three inside one beat', say: say('Beats one and two are plain quarters. Beat three holds three even notes.') }),
      rung('guided', 'tap-rhythm', E({ id: 'rh-tri-g', bpm: 60, pattern: 'q q t8 t8 t8 q | q q q q', notes: Array(10).fill('C4'), name: 'Tap the triplet' }),
        { title: 'Say it as you tap', help: 'countRow', say: say('"1, 2, tri-pl-et, 4". Three taps inside one count.') }),
      rung('independent', 'play-rhythm', E({ id: 'rh-tri-i', bpm: 63, pattern: 't8 t8 t8 q t8 t8 t8 q', notes: ['C4', 'D4', 'E4', 'G4', 'E4', 'D4', 'C4', 'G4'], name: 'Two triplet groups' }),
        { title: 'Triplets on beats 1 and 3', say: say('Two triplet groups with a plain quarter after each. Keep the three notes even.') }),
      rung('recall', 'play-rhythm', E({ id: 'rh-tri-r', bpm: 63, pattern: 'q t8 t8 t8 q q | h h', notes: ['G4', 'F4', 'E4', 'D4', 'C4', 'D4', 'E4', 'C4'], name: 'A day later' }),
        { title: 'The triplet moves', say: say('This time the triplet is on beat two, so its position has to be read.') }),
      rung('transfer', 'play-rhythm', E({ id: 'rh-tri-t', bpm: 60, hand: 'L', pattern: 't8 t8 t8 q h', notes: ['C3', 'E3', 'G3', 'E3', 'C3'], name: 'Triplets, left hand' }),
        { title: 'A triplet in the bass', say: say('Left hand. A broken-chord triplet is a common accompaniment figure.') }),
    ],
  },
];

// ---- track 2: notation and independent reading (brief package 3) -----------
// The existing lessons already teach staff notes, landmarks, intervals,
// triads, phrases and sharps. These EXTEND that: the flat side of the
// keyboard, the rules an accidental obeys, key signatures, symbols, the outer
// registers, position independence, look-ahead, and the vertical read.
const READING_CARDS = [
  {
    id: 'nt-flats', track: 'reading', skill: 'read-accidentals',
    title: 'Flats, spelled as flats',
    teaches: say(
      'A flat sign lowers a note by one key, which is usually the black key immediately to its LEFT. B flat is the black key just left of B.',
      'The existing sharps lesson taught the same five black keys from the other side. This card reads them as flats, because that is how most real music spells them.',
      'The flat sign is printed BEFORE the note head, at the same height as it.',
    ),
    measures: 'The actual key pressed for a flat-spelled note. Reading the shape of the sign is not enough; the hand has to find the key.',
    stages: [
      rung('worked', 'listen', E({ id: 'nt-flats-w', bpm: 60, pattern: 'w', notes: ['Bb4'], name: 'B flat' }),
        { title: 'This is B flat', say: say('The note head sits on the B line with a flat in front of it. The key is the black one just to the left of B.') }),
      rung('guided', 'play-notes', E({ id: 'nt-flats-g', bpm: 60, pattern: 'q q q q', notes: ['Bb4', 'Eb4', 'Ab4', 'Db5'], name: 'Four flats, lit' }),
        { title: 'Four flats, with the keys lit', help: 'litKeys', say: say('B flat, E flat, A flat, D flat. The target key is lit for this rung.') }),
      rung('independent', 'play-notes', E({ id: 'nt-flats-i', bpm: 60, pattern: 'q q q q', notes: ['Gb4', 'Bb4', 'Eb5', 'Db5'], name: 'Flats, nothing lit' }),
        { title: 'No lights', say: say('G flat, B flat, E flat, D flat. Find each from the white key it is named after.') }),
      rung('recall', 'play-notes', E({ id: 'nt-flats-r', bpm: 60, hand: 'L', pattern: 'q q q q', notes: ['Bb2', 'Eb3', 'Ab2', 'Db3'], name: 'Flats in the bass' }),
        { title: 'A day later, bass clef', say: say('The same five black keys, read from the bottom staff with the left hand.') }),
      rung('transfer', 'play-rhythm', E({ id: 'nt-flats-t', bpm: 63, pattern: 'q 8 8 h | q q h', notes: ['Bb4', 'Ab4', 'G4', 'F4', 'Eb4', 'D4', 'C4'], name: 'A flat-side melody' }),
        { title: 'Flats inside a melody', say: say('A descending line with flats in it, now with rhythm to read as well.') }),
    ],
  },
  {
    id: 'nt-naturals', track: 'reading', skill: 'read-accidentals',
    title: 'Naturals, and how long an accidental lasts',
    teaches: say(
      'A natural sign cancels a sharp or a flat and gives you the plain white key of that letter.',
      'THE RULE: an accidental applies to that letter in that octave for the REST OF THE BAR. Every following note on the same line or space is altered too, even with nothing printed in front of it.',
      'THE OTHER HALF OF THE RULE: the bar line cancels everything. In the next bar the key signature is back in charge.',
    ),
    measures: 'The exact key pressed for every note head, including the ones with no sign in front of them. This is the only way to see whether the carry rule was actually read.',
    stages: [
      rung('worked', 'listen', E({ id: 'nt-nat-w', bpm: 60, pattern: 'q q q q', notes: ['Bb4', 'B4', 'Bn4', 'B4'], name: 'One bar, four B heads' }),
        { title: 'Four Bs, two of them flat', say: say('Note 1 is written flat. Note 2 has no sign and is STILL flat: the accidental carries. Note 3 is naturalled, and note 4 stays natural to the end of the bar.') }),
      rung('guided', 'play-notes', E({ id: 'nt-nat-g', bpm: 60, pattern: 'q q q q | q q q q', notes: ['Bb4', 'B4', 'Bn4', 'B4', 'B4', 'Bb4', 'B4', 'Bn4'], name: 'Carry, then reset' }),
        { title: 'Watch the bar line', help: 'litKeys', say: say('Bar two starts with a plain B: the bar line cancelled the flat. Then the flat returns and carries again.') }),
      rung('independent', 'play-notes', E({ id: 'nt-nat-i', bpm: 60, pattern: 'q q q q | q q q q', notes: ['F#4', 'F4', 'Fn4', 'F4', 'F4', 'F#4', 'F4', 'Fn4'], name: 'The same rule on F' }),
        { title: 'No lights, sharp side', say: say('Same rule, a sharp this time. Two of these heads have no sign and are still sharp.') }),
      rung('recall', 'play-notes', E({ id: 'nt-nat-r', bpm: 60, hand: 'L', pattern: 'q q q q | q q q q', notes: ['Eb3', 'E3', 'En3', 'E3', 'E3', 'Eb3', 'E3', 'E3'], name: 'A day later, on E' }),
        { title: 'Bass clef, on E', say: say('Left hand. Read the carry and the reset without the earlier example in front of you.') }),
      rung('transfer', 'play-notes', E({ id: 'nt-nat-t', key: 'F', bpm: 60, pattern: 'q q q q | q q q q', notes: ['B4', 'Bn4', 'B4', 'A4', 'B4', 'A4', 'B4', 'C5'], name: 'Inside a key signature' }),
        { title: 'A natural inside a key signature', say: say('The key signature makes every B flat. The natural in bar one cancels it for that bar only, and bar two is flat again.') }),
    ],
  },
  {
    id: 'nt-key-signatures', track: 'reading', skill: 'read-key-signatures',
    title: 'Key signatures: F, G, B flat, D',
    teaches: say(
      'The signs printed straight after the clef are the KEY SIGNATURE. They apply to every bar of the piece, in every octave, until the piece says otherwise.',
      'One flat (on the B line) is F major: every B is a B flat. One sharp (on the F line) is G major: every F is an F sharp.',
      'Nothing is printed in front of the notes themselves, so the key signature is something you have to keep in your head while you read.',
    ),
    measures: 'The pitches actually played under a signature, with no accidental printed on the note heads.',
    stages: [
      rung('worked', 'listen', E({ id: 'nt-ks-w', key: 'F', bpm: 60, pattern: 'q q q q', notes: ['F4', 'G4', 'A4', 'B4'], name: 'F major, one flat' }),
        { title: 'One flat: every B is B flat', say: say('The fourth note is written on the B line with nothing in front of it, and the signature makes it a B flat.') }),
      rung('guided', 'play-notes', E({ id: 'nt-ks-g', key: 'F', bpm: 60, pattern: 'q q q q | q q q q', notes: ['F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'], name: 'The F major scale' }),
        { title: 'Play the scale of F', help: 'litKeys', say: say('One flat, so the fourth degree is B flat. The lights confirm it for this rung only.') }),
      rung('independent', 'play-notes', E({ id: 'nt-ks-i', key: 'G', bpm: 60, pattern: '8 8 8 8 8 8 8 8', notes: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'], name: 'G major, one sharp' }),
        { title: 'One sharp, no lights', say: say('The seventh note is written on the F line. The signature says F sharp.') }),
      rung('recall', 'play-notes', E({ id: 'nt-ks-r', key: 'Bb', bpm: 60, pattern: '8 8 8 8 8 8 8 8', notes: ['B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'], name: 'B flat major, two flats' }),
        { title: 'A day later: two flats', say: say('Two flats means B and E are both flat, wherever they appear.') }),
      rung('transfer', 'play-notes', E({ id: 'nt-ks-t', key: 'D', bpm: 60, pattern: '8 8 8 8 8 8 8 8', notes: ['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'], name: 'D major, two sharps' }),
        { title: 'Two sharps, a signature you have not drilled', say: say('F and C are both sharp. Nothing is printed on the notes: it is all in the signature.') }),
    ],
  },
  {
    id: 'nt-enharmonics', track: 'reading', skill: 'read-key-signatures',
    title: 'Two names, one key',
    teaches: say(
      'F sharp and G flat are the same black key. So are C sharp and D flat, and every other black key: two names, one place to put your finger.',
      'Which name is correct depends on the key you are in, not on the sound. In G major that key is F sharp; in D flat major the same key is G flat.',
      'HONEST LIMIT: the piano cannot tell you which spelling is meant, and neither can this app from what you play. The page tells you, through the key signature and the notes around it.',
    ),
    measures: 'The key pressed for each spelling, plus a naming question about the context. The naming question alone proves nothing and never stands on its own here.',
    stages: [
      rung('worked', 'listen', E({ id: 'nt-en-w', bpm: 60, pattern: 'h h', notes: ['F#4', 'Gb4'], name: 'F sharp, then G flat' }),
        { title: 'The same key, twice', say: say('Two different note heads, two different signs, and one black key. Listen: they are the same pitch.') }),
      rung('guided', 'play-notes', E({ id: 'nt-en-g', bpm: 60, pattern: 'q q q q', notes: ['F#4', 'Gb4', 'A#4', 'Bb4'], name: 'Both spellings' }),
        { title: 'Play each spelling', help: 'litKeys', say: say('Pairs: F sharp and G flat, then A sharp and B flat. Each pair is one key played twice.') },
      ),
      rung('independent', 'play-notes', E({ id: 'nt-en-i', bpm: 60, pattern: 'q q q q', notes: ['C#5', 'Db5', 'D#4', 'Eb4'], name: 'No lights' }),
        { title: 'Find them yourself', say: say('C sharp and D flat, then D sharp and E flat.'),
          ask: { prompt: 'Which spelling would a piece in D flat major use for that first black key?', options: [{ id: 'db', label: 'D flat', correct: true }, { id: 'cs', label: 'C sharp' }], why: 'A flat key signature spells its black keys as flats, so the letters run without a gap.' } }),
      rung('recall', 'play-notes', E({ id: 'nt-en-r', key: 'G', bpm: 60, pattern: 'q q q q', notes: ['F4', 'G4', 'A4', 'F4'], name: 'F sharp, from the signature' }),
        { title: 'A day later, in context', say: say('In G major the F is sharp because the signature says so, and nobody prints a sign on it.') }),
      rung('transfer', 'play-notes', E({ id: 'nt-en-t', key: 'Db', bpm: 60, pattern: '8 8 8 8 8 8 8 8', notes: ['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'], name: 'The same black keys, spelled flat' }),
        { title: 'D flat major', say: say('Five flats. Every black key here is spelled as a flat, and the G you play is the F sharp key from the other card.') }),
    ],
  },
  {
    id: 'nt-symbols', track: 'reading', skill: 'read-symbols',
    title: 'Dynamics and articulation marks',
    teaches: say(
      'p is soft, mf is medium, f is loud. They are printed under the staff and they stay in force until the next one.',
      'A dot ABOVE or BELOW a note head means staccato: short, with air after it. A curved line over several different notes is a slur: joined, no gap.',
      'A dot after a note head is a dotted rhythm; a dot above it is staccato. Same shape, different place, completely different job.',
    ),
    measures: 'Staccato and legato from real key releases. Loud against soft ON THE SAME KEY from velocity. Neither needs calibration; neither claims anything about musicality.',
    requires: 'note-off',
    stages: [
      rung('worked', 'listen', E({ id: 'nt-sym-w', bpm: 60, pattern: 'q q q q', notes: ['C4', 'D4', 'E4', 'F4'], name: 'Staccato and slurred', marks: [{ kind: 'articulation', value: 'staccato', from: 0, to: 1 }, { kind: 'slur', from: 2, to: 3 }, { kind: 'dynamic', value: 'mf', at: 0 }] }),
        { title: 'Short, then joined', say: say('The first two notes wear dots: short. The last two sit under a slur: joined.') }),
      rung('guided', 'play-rhythm', E({ id: 'nt-sym-g', bpm: 60, pattern: 'q q q q', notes: ['C4', 'D4', 'E4', 'F4'], name: 'Four staccato quarters', marks: [{ kind: 'articulation', value: 'staccato', from: 0, to: 3 }] }),
        { title: 'Play them all short', help: 'holdBar', touchGoal: { goal: 'staccato' }, say: say('Each note off well before its beat ends. The hold bar shows how short.') }),
      rung('independent', 'play-rhythm', E({ id: 'nt-sym-i', bpm: 60, pattern: 'q q q q | q q q q', notes: Array(8).fill('A4'), name: 'Loud bar, soft bar', marks: [{ kind: 'dynamic', value: 'f', at: 0 }, { kind: 'dynamic', value: 'p', at: 4 }] }),
        { title: 'One bar loud, one bar soft', say: say('The same key eight times. Bar one loud, bar two soft, so the comparison is fair.'),
          dynamicPlan: [{ level: 'f', from: 0, to: 4 }, { level: 'p', from: 4, to: 8 }] }),
      rung('recall', 'play-rhythm', E({ id: 'nt-sym-r', bpm: 60, pattern: 'q q q q | q q q q', notes: ['E4', 'F4', 'G4', 'A4', 'G4', 'F4', 'E4', 'D4'], name: 'Staccato bar, legato bar', marks: [{ kind: 'articulation', value: 'staccato', from: 0, to: 3 }, { kind: 'slur', from: 4, to: 7 }] }),
        { title: 'A day later: both touches', say: say('Bar one short, bar two joined. The difference has to come from your hand, not the tempo.'),
          touchGoal: { goal: 'legato', fromBeat: 4 } }),
      rung('transfer', 'play-rhythm', E({ id: 'nt-sym-t', bpm: 63, hand: 'L', pattern: 'q q h | q q h', notes: ['C3', 'E3', 'G3', 'G3', 'E3', 'C3'], name: 'Marks in the bass', marks: [{ kind: 'articulation', value: 'staccato', from: 0, to: 1 }, { kind: 'slur', from: 4, to: 5 }, { kind: 'dynamic', value: 'mf', at: 0 }] }),
        { title: 'The same marks, left hand', say: say('Left hand. Articulation marks mean exactly the same thing on the bottom staff.') }),
    ],
  },
  {
    id: 'nt-ledger', track: 'reading', skill: 'read-range',
    title: 'Ledger lines and the far registers',
    teaches: say(
      'A ledger line is a short piece of staff added for one note that has run off the end. Count them like extra staff lines: line, space, line, space.',
      'Two ledger lines above the treble staff is C6, two octaves above middle C. Two below the bass staff is C2, two octaves below it.',
      'Do not count from the bottom of the staff every time. Count from the nearest landmark: the top line, or the C you already know.',
    ),
    measures: 'The key pressed for notes above and below the staves, where the octave is the thing that goes wrong.',
    stages: [
      rung('worked', 'listen', E({ id: 'nt-led-w', bpm: 60, pattern: 'h h', notes: ['A5', 'C6'], name: 'Above the treble staff' }),
        { title: 'Up the ladder', say: say('A5 sits above the top line; C6 is two ledger lines up, two octaves above middle C.') }),
      rung('guided', 'play-notes', E({ id: 'nt-led-g', bpm: 60, pattern: 'q q q q', notes: ['G5', 'A5', 'B5', 'C6'], name: 'Climbing above the staff' }),
        { title: 'Climb, with the keys lit', help: 'litKeys', say: say('Step up from the top line, one ledger position at a time.') }),
      rung('independent', 'play-notes', E({ id: 'nt-led-i', bpm: 60, pattern: 'q q q q', notes: ['C6', 'A5', 'F5', 'D5'], name: 'Coming back down' }),
        { title: 'No lights', say: say('Down in thirds from C6. Count from the top line, not from the bottom.') }),
      rung('recall', 'play-notes', E({ id: 'nt-led-r', bpm: 60, hand: 'L', pattern: 'q q q q', notes: ['C2', 'E2', 'G2', 'B2'], name: 'Below the bass staff' }),
        { title: 'A day later, the bottom end', say: say('Two ledger lines below the bass staff is C2. Climb from there.') }),
      rung('transfer', 'play-rhythm', E({ id: 'nt-led-t', bpm: 60, voices: { R: { pattern: 'h h', notes: ['C6', 'A5'] }, L: { pattern: 'h h', notes: ['C2', 'E2'] } }, name: 'Both extremes at once' }),
        { title: 'Both ends of the keyboard', say: say('High ledger lines in the right hand, low ones in the left, on the same two beats.') }),
    ],
  },
  {
    id: 'nt-position', track: 'reading', skill: 'read-position',
    title: 'The same notes, a different place',
    teaches: say(
      'A note name is a PLACE ON THE KEYBOARD, not a finger. If every drill starts with the thumb on middle C, "third line B" quietly becomes "finger 4" and the reading never happens.',
      'So this card moves the starting note, the register and the hand around underneath the same reading job.',
      'Read the note, find the key, then work out which finger is comfortable. In that order.',
    ),
    measures: 'The keys pressed when the same melodic shape starts somewhere new. The shape is identical; the position is not.',
    variants: { count: 5 },       // deterministic per calendar date, see positionVariant
    stages: [
      rung('worked', 'listen', E({ id: 'nt-pos-w', bpm: 60, pattern: 'q q q q', notes: ['C4', 'D4', 'F4', 'E4'], name: 'The shape, from C' }),
        { title: 'Up a step, up a third, down a step', say: say('That is the shape. Learn the SHAPE, not the four key names.') }),
      rung('guided', 'play-notes', E({ id: 'nt-pos-g', bpm: 60, pattern: 'q q q q', notes: ['F4', 'G4', 'Bb4', 'A4'], name: 'The same shape, from F' }),
        { title: 'Same shape, new home', help: 'litKeys', say: say('The intervals are identical; the hand is somewhere else, and a black key appears.') }),
      rung('independent', 'play-notes', null,
        { title: 'A starting note chosen for today', variant: 'position', say: say('The same shape from a starting note picked for today. Read the first note, then follow the intervals.') }),
      rung('recall', 'play-notes', null,
        { title: 'A day later, another position', variant: 'position', say: say('A different start again. If this is easy, the shape is being read rather than the fingering recalled.') }),
      rung('transfer', 'play-notes', null,
        { title: 'The left hand, two octaves down', variant: 'position-left', say: say('Left hand, bass clef, and a start you have not used. Same shape.') }),
    ],
  },
  {
    id: 'nt-intervals-ahead', track: 'reading', skill: 'read-intervals',
    title: 'Landmark, then interval, then look ahead',
    teaches: say(
      'Fluent readers do not name every note. They find ONE landmark, then read the distances from it: step, step, skip, back a step.',
      'Line to the very next line is a third. Line to the space just above is a second. Those two shapes carry most of a beginner melody.',
      'Then the real trick: while your hand plays this note, your eyes are already on the next one. The app shows what is coming next so you can practise that.',
    ),
    measures: 'The notes played, in order, from a phrase you have not seen, with a look-ahead preview of the next note.',
    stages: [
      rung('worked', 'listen', E({ id: 'nt-int-w', bpm: 60, pattern: 'q q q q', notes: ['C5', 'A4', 'B4', 'G4'], name: 'From the landmark C5' }),
        { title: 'Start at a landmark', say: say('C5 is the third space. From there: down a third, up a second, down a third.') }),
      rung('guided', 'play-notes', E({ id: 'nt-int-g', bpm: 60, pattern: 'q q q q | q q q q', notes: ['C5', 'A4', 'B4', 'G4', 'A4', 'F4', 'G4', 'E4'], name: 'A falling sequence' }),
        { title: 'Read the distances', help: 'intervalLabels', say: say('The interval between each pair is printed for this rung: 3rd down, 2nd up, all the way.') }),
      rung('independent', 'play-notes', E({ id: 'nt-int-i', bpm: 60, pattern: 'q q q q | q q q q', notes: ['G4', 'B4', 'A4', 'C5', 'B4', 'D5', 'C5', 'E5'], name: 'A rising sequence' }),
        { title: 'No interval labels', say: say('Find G4, then follow the shape: up a third, down a second, up a third.'), lookAhead: 1 }),
      rung('recall', 'play-notes', E({ id: 'nt-int-r', bpm: 60, pattern: 'q q q q | q q q q', notes: ['E5', 'C5', 'D5', 'B4', 'C5', 'A4', 'B4', 'G4'], name: 'A day later' }),
        { title: 'A new phrase', say: say('Same interval vocabulary, a phrase you have not played.'), lookAhead: 1 }),
      rung('transfer', 'play-notes', E({ id: 'nt-int-t', bpm: 60, hand: 'L', pattern: 'q q q q | q q q q', notes: ['C3', 'E3', 'D3', 'F3', 'E3', 'G3', 'F3', 'A3' ], name: 'Bass landmarks' }),
        { title: 'The same reading, bass clef', say: say('Left hand, starting from C3 in the second space. The intervals look identical on this staff.'), lookAhead: 1 }),
    ],
  },
  {
    id: 'nt-vertical', track: 'reading', skill: 'read-vertical',
    title: 'Two hands, one grid',
    teaches: say(
      'On a grand staff the two staves are read DOWN as well as across. Notes stacked vertically happen together, whichever staff they are on.',
      'Find the moments where both hands move at once: those are the anchors. Between the anchors, one hand is usually waiting.',
      'Hands-separate practice is still worth doing. This card is the thing hands-separate practice never teaches: the vertical alignment.',
    ),
    measures: 'Whether the two hands ARRIVE TOGETHER on shared onsets, inside 120ms, on a grid you are reading rather than remembering.',
    stages: [
      rung('worked', 'listen', E({ id: 'nt-vert-w', bpm: 60, voices: { R: { pattern: 'h h', notes: ['E4', 'G4'] }, L: { pattern: 'w', notes: ['C3'] } }, name: 'Two over one' }),
        { title: 'Read down the page', say: say('The left hand holds one whole note while the right plays two halves. They start together on beat one.') }),
      rung('guided', 'play-notes', E({ id: 'nt-vert-gr', bpm: 60, pattern: 'q q h | q q h', notes: ['E4', 'F4', 'G4', 'G4', 'F4', 'E4'], name: 'Right hand alone' }),
        { title: 'Right hand alone first', help: 'litKeys', say: say('The top line by itself. Keep the shared grid in mind: this is one half of it.') }),
      rung('guided', 'play-notes', E({ id: 'nt-vert-gl', bpm: 60, hand: 'L', pattern: 'h h | w', notes: ['C3', 'G3', 'C3'], name: 'Left hand alone' }),
        { title: 'Now the left hand alone', help: 'litKeys', say: say('The bottom line by itself. Notice where it lands relative to the right hand.') }),
      rung('independent', 'play-grid', E({ id: 'nt-vert-i', bpm: 56, voices: { R: { pattern: 'q q h | q q h', notes: ['E4', 'F4', 'G4', 'G4', 'F4', 'E4'] }, L: { pattern: 'h h | w', notes: ['C3', 'G3', 'C3'] } }, name: 'Both hands together' }),
        { title: 'Both hands, one grid', say: say('The same two lines at once. Beats one and three are the moments both hands move.') }),
      rung('recall', 'play-grid', E({ id: 'nt-vert-r', bpm: 56, voices: { R: { pattern: 'q q q q | h h', notes: ['G4', 'F4', 'E4', 'D4', 'C4', 'E4'] }, L: { pattern: 'h h | w', notes: ['C3', 'B2', 'C3'] } }, name: 'A day later' }),
        { title: 'A new grid', say: say('Different notes, same vertical question. Find the shared onsets first.') }),
      rung('transfer', 'play-grid', E({ id: 'nt-vert-t', meter: [3, 4], bpm: 60, voices: { R: { pattern: 'q q q | hd', notes: ['G4', 'A4', 'G4', 'E4'] }, L: { pattern: 'hd | hd', notes: ['C3', 'C3'] } }, name: 'Vertical reading in 3/4' }),
        { title: 'A different metre', say: say('Three-four now, so the anchors fall in a new place.') }),
    ],
  },
];

// ---- track 3: applied theory, "understand this passage" (package 4) --------
// ☠️ HARMONY IS NEVER GUESSED ON A CATALOGUE SONG. Each card carries an
// authored expectation about the shipped note data (which bass pitch classes
// land on which bars, which pitch classes the melody uses, the meter). At
// resolve time that expectation is CHECKED against songs.mjs, and a card whose
// song has changed refuses itself with a reason rather than annotating music
// it can no longer vouch for. The chord spellings are checked against
// teacher.mjs's own triad and inversion functions by the test, so there is one
// definition of a triad in this app, not two.
const APPLIED_CARDS = [
  {
    id: 'ap-am-still-dre', track: 'applied', skill: 'applied-harmony',
    title: 'A minor, in Still D.R.E.',
    teaches: say(
      'A minor is A, C and E. Minor because the middle note sits three semitones above the root instead of four.',
      'In this arrangement the left hand plays A under bar one and E under bar two, and the right hand only ever uses A and G. That is A minor with its natural seventh: no G sharp anywhere.',
      'Once you can see that, the riff stops being eight separate notes and becomes two chords.',
    ),
    measures: 'The keys held for each voicing, then the passage itself played on its own settings. The app never claims you "understand" the harmony; it records what you played.',
    chord: { sym: 'Am', label: 'A minor', blocked: ['A3', 'C4', 'E4'], inversion1: ['C4', 'E4', 'A4'], inversion2: ['E4', 'A4', 'C5'] },
    technique: { scaleId: 'scale-a-minor', label: 'A minor scale', why: 'The riff lives inside this scale; playing the scale puts the same notes under your hand.' },
    expressionGoal: { text: 'Keep the left-hand bass under the melody, not on top of it.', kind: 'balance' },
    passage: {
      songId: 'still-dre-easy', section: 'Loop 1', startBeat: 0, endBeat: 8,
      hand: 'both', tempo: 100, wait: true, key: 'Am', tonicPc: 9,
      expect: { meter: [4, 4], bassPcsAtBar: [9, 4], melodyPcs: [9, 7], barBeats: 4 },
      why: 'Bass A under bar one and E under bar two; the melody uses only A and G.',
    },
  },
  {
    id: 'ap-c-ode-to-joy', track: 'applied', skill: 'applied-harmony',
    title: 'C major, in Ode to Joy',
    teaches: say(
      'C major is C, E and G: root, a major third (four semitones), then a fifth.',
      'The first phrase of Ode to Joy sits over a C in the left hand for three bars, then moves to G for the fourth. C is home; G is the chord that pulls back to it.',
      'Every note of the melody comes from the C major scale, which is why it can be played entirely on white keys.',
    ),
    measures: 'The keys held for each voicing, and then the real phrase at its own settings.',
    chord: { sym: 'C', label: 'C major', blocked: ['C4', 'E4', 'G4'], inversion1: ['E4', 'G4', 'C5'], inversion2: ['G4', 'C5', 'E5'] },
    technique: { scaleId: 'scale-c-major', label: 'C major scale', why: 'The whole phrase is inside this scale, and the scale fingering is the one the app already teaches.' },
    expressionGoal: { text: 'Let the last note of each four-bar phrase settle rather than stopping dead.', kind: 'listening' },
    passage: {
      songId: 'ode-to-joy', section: 'Phrase A', startBeat: 0, endBeat: 16,
      hand: 'both', tempo: 100, wait: true, key: 'C', tonicPc: 0,
      expect: { meter: [4, 4], bassPcsAtBar: [0, 0, 0, 7], melodyPcs: [0, 2, 4, 5, 7], barBeats: 4 },
      why: 'Bass C for three bars then G; the melody uses only C, D, E, F and G.',
    },
  },
  {
    id: 'ap-g-happy-birthday', track: 'applied', skill: 'applied-harmony',
    title: 'The five chord, in Happy Birthday',
    teaches: say(
      'G major is G, B and D. In the key of C it is the FIVE chord: the one that leans hardest back towards home.',
      'This arrangement is in 3/4 with one bass note per bar: C, then G for two bars, then C again. You can hear the pull on the G bars and the arrival when C returns.',
      'Play G then C and feel the landing. That single move is most of what a cadence is.',
    ),
    measures: 'The voicings played, then the real phrase in 3/4 on its own settings.',
    chord: { sym: 'G', label: 'G major', blocked: ['G3', 'B3', 'D4'], inversion1: ['B3', 'D4', 'G4'], inversion2: ['D4', 'G4', 'B4'] },
    technique: { scaleId: 'scale-g-major', label: 'G major scale', why: 'One sharp, and the same hand shape as C moved up: the ladder already ships this scale with verified fingering.' },
    expressionGoal: { text: 'The pickup notes are quieter than the downbeat they lead into.', kind: 'listening' },
    passage: {
      songId: 'happy-birthday', section: 'Lines 1-2', startBeat: 0, endBeat: 12,
      hand: 'both', tempo: 100, wait: true, key: 'C', tonicPc: 0,
      expect: { meter: [3, 4], bassPcsAtBar: [0, 7, 7, 0], melodyPcs: [7, 9, 11, 0, 2], barBeats: 3 },
      why: 'One bass note per bar: C, G, G, C, under a melody built from G, A, B, C and D.',
    },
  },
  {
    id: 'ap-cm-game-of-thrones', track: 'applied', skill: 'applied-harmony',
    title: 'C minor and its flats, in Game of Thrones',
    teaches: say(
      'C minor is C, E flat and G. Take C major and move the middle note down one key onto the black E flat: one semitone, the whole mood.',
      'This arrangement puts the bass on C for the first half and B flat for the second. B flat is the flat seventh, and it is what gives the theme its modal, older sound.',
      'Both of those flats are the flats you read in the flats card. This is where they turn up in real music.',
    ),
    measures: 'The voicings played, then the real theme in 3/4 at its own settings.',
    // chordKey 'C': the E flat is PRINTED on the chord cards, because the flat
    // is the thing being taught. Inside the C minor study below the key
    // signature carries it, which is how the music actually looks.
    chord: { sym: null, key: 'C', label: 'C minor', blocked: ['C4', 'Eb4', 'G4'], inversion1: ['Eb4', 'G4', 'C5'], inversion2: ['G4', 'C5', 'Eb5'] },
    technique: { scaleId: 'scale-c-minor', label: 'C minor scale', why: 'The scale carries the same E flat and B flat, with the ladder\'s verified fingering.' },
    expressionGoal: { text: 'The repeated cell should not get louder each time by accident.', kind: 'dynamics' },
    passage: {
      songId: 'game-of-thrones-easy', section: 'Theme', startBeat: 0, endBeat: 24,
      hand: 'both', tempo: 100, wait: true, key: 'Cm', tonicPc: 0,
      expect: { meter: [3, 4], bassPcsAtBar: [0, 0, 0, 0, 10, 10, 10, 10], melodyPcs: [7, 0, 3, 5, 10, 2], barBeats: 3 },
      why: 'Bass C for four bars then B flat for four; the melody uses E flat and B flat.',
    },
  },
  {
    id: 'ap-cadence-study', track: 'applied', skill: 'applied-harmony',
    title: 'I, IV, V, I: the four-chord walk',
    teaches: say(
      'Number the chords of a key by which scale degree they start on. In C: C is I, F is IV, G is V, and back to C is I again.',
      'Those four cover a startling amount of music. You already play all four as shapes; this card is about hearing which one you are on.',
      'This one is an original study piece, written for the exercise. It is not repertoire and it does not appear on your shelves.',
    ),
    measures: 'The voicings played, and then a written four-bar study with the chords underneath a melody.',
    chord: { sym: 'F', label: 'F major', blocked: ['F3', 'A3', 'C4'], inversion1: ['A3', 'C4', 'F4'], inversion2: ['C4', 'F4', 'A4'] },
    technique: { scaleId: 'scale-c-major', label: 'C major scale', why: 'All four chords live in this one scale.' },
    expressionGoal: { text: 'The last chord is the arrival: let it be the longest sound in the phrase.', kind: 'listening' },
    passage: null,        // no catalogue song is claimed for this one, by design
  },
];

// The study piece behind every applied card's transfer rung: authored here,
// labelled an exercise, and never inserted into the library.
const APPLIED_STUDY = {
  'ap-am-still-dre': E({
    id: 'ap-am-study', key: 'Am', bpm: 72, name: 'A minor study',
    voices: { R: { pattern: 'q q h | q q h', notes: ['A4', 'C5', 'E5', 'E5', 'C5', 'A4'] }, L: { pattern: 'w | w', notes: ['A2', 'E2'] } },
  }),
  'ap-c-ode-to-joy': E({
    id: 'ap-c-study', key: 'C', bpm: 72, name: 'C major study',
    voices: { R: { pattern: 'q q q q | h h', notes: ['E4', 'F4', 'G4', 'E4', 'D4', 'C4'] }, L: { pattern: 'w | h h', notes: ['C3', 'G2', 'C3'] } },
  }),
  'ap-g-happy-birthday': E({
    id: 'ap-g-study', key: 'C', meter: [3, 4], bpm: 72, name: 'Home and away study',
    voices: { R: { pattern: 'q q q | hd | q q q | hd', notes: ['G4', 'B4', 'D5', 'D5', 'D5', 'B4', 'G4', 'C5'] }, L: { pattern: 'hd | hd | hd | hd', notes: ['C3', 'G2', 'G2', 'C3'] } },
  }),
  'ap-cm-game-of-thrones': E({
    id: 'ap-cm-study', key: 'Cm', meter: [3, 4], bpm: 69, name: 'C minor study',
    voices: { R: { pattern: 'q q q | hd | q q q | hd', notes: ['G4', 'C5', 'E5', 'D5', 'F4', 'B4', 'D5', 'C5'] }, L: { pattern: 'hd | hd | hd | hd', notes: ['C3', 'C3', 'B2', 'C3'] } },
  }),
  'ap-cadence-study': E({
    id: 'ap-cadence', key: 'C', bpm: 69, name: 'I IV V I study',
    voices: { R: { pattern: 'h h | h h | h h | w', notes: [['C4', 'E4', 'G4'], ['C4', 'E4', 'G4'], ['C4', 'F4', 'A4'], ['C4', 'F4', 'A4'], ['B3', 'D4', 'G4'], ['B3', 'D4', 'G4'], ['C4', 'E4', 'G4']] }, L: { pattern: 'w | w | w | w', notes: ['C3', 'F2', 'G2', 'C3'] } },
  }),
};

// Every applied card's five rungs are built from its chord + passage, because
// the sequence is the same every time and authoring it five times by hand is
// how the fifth one ends up different from the other four.
function appliedStages(card) {
  const c = card.chord, study = APPLIED_STUDY[card.id];
  const key = c.key ?? card.passage?.key ?? 'C';
  const blockedEx = E({ id: card.id + '-blocked', key, bpm: 60, pattern: 'w', notes: [c.blocked], name: c.label + ', blocked' });
  const brokenEx = E({ id: card.id + '-broken', key, bpm: 66, pattern: 'q q q q | q q h', notes: [...c.blocked, c.blocked[2], c.blocked[1], c.blocked[0], c.blocked[0]], name: c.label + ', broken' });
  const invEx = E({ id: card.id + '-inv', key, bpm: 60, pattern: 'h h', notes: [c.inversion1, c.inversion2], name: c.label + ', two inversions' });
  return [
    rung('worked', 'listen', blockedEx, {
      title: 'See it on the staff', say: say(`${c.label} written as a stack of thirds: three note heads on three lines, or three spaces.`),
      ask: { prompt: `What is this chord?`, options: [{ id: 'right', label: c.label, correct: true }, { id: 'wrong', label: 'Three unrelated notes' }], why: 'A label is a start. The next rungs make you play it.' },
    }),
    rung('guided', 'play-together', blockedEx, {
      title: 'Play it blocked', help: 'litKeys', say: say('All three keys together, once. The lights show the target on this rung, which makes the attempt assisted.'),
      chords: [{ midis: blockedEx.targets[0].midis, label: c.label + ' root position' }],
    }),
    rung('independent', 'play-rhythm', brokenEx, {
      title: 'Play it broken, as written', say: say('The same three notes one at a time, in the rhythm on the page. This is how the chord usually appears in real music.'),
    }),
    rung('recall', 'play-together', invEx, {
      title: 'A day later: the inversions', say: say('Same chord, the notes stacked in a different order. Read the lowest note first, then the shape.'),
      chords: [{ midis: invEx.targets[0].midis, label: c.label + ', first inversion' }, { midis: invEx.targets[1].midis, label: c.label + ', second inversion' }],
    }),
    card.passage
      ? rung('transfer', 'play-passage', study, {
        title: 'Back to the music', passage: card.passage,
        say: say(`Now the real thing: ${card.passage.section}, both hands, at the settings this passage is practised with.`),
      })
      : rung('transfer', 'play-rhythm', study, {
        title: 'The study piece', say: say('Four bars: I, IV, V, I, with the chords written out. An original exercise, not repertoire.'),
      }),
  ];
}

// ---- track 4: expression tied to repertoire (brief package 5) --------------
const EXPRESSION_CARDS = [
  {
    id: 'ex-touch', track: 'expression', skill: 'expression-touch',
    title: 'Joined, or separated',
    teaches: say(
      'Legato means the sound of one note runs into the next with no gap: the old key comes up as the new one goes down, not before.',
      'Staccato means short: the key comes up well before the next beat, leaving air.',
      'This is the one expression control a keyboard can actually see, because it reports exactly when each key goes down and comes up.',
    ),
    measures: 'The real gap between one note\'s release and the next note\'s press (artic.mjs does the measuring). It cannot see your fingers, your pedal foot or your intention.',
    requires: 'note-off',
    technique: { scaleId: 'scale-c-major', label: 'C major scale', why: 'A scale is where legato either works or does not: the thumb crossing is exactly where the gap appears.' },
    stages: [
      rung('worked', 'listen', E({ id: 'ex-touch-w', bpm: 63, pattern: 'q q q q | q q q q', notes: ['C4', 'D4', 'E4', 'F4', 'F4', 'E4', 'D4', 'C4'], name: 'The same notes, two touches', marks: [{ kind: 'slur', from: 0, to: 3 }, { kind: 'articulation', value: 'staccato', from: 4, to: 7 }] }),
        { title: 'Hear them side by side', say: say('Bar one joined, bar two short. Same notes, same tempo, completely different character.') }),
      rung('guided', 'play-rhythm', E({ id: 'ex-touch-g', bpm: 60, pattern: 'q q q q', notes: ['C4', 'D4', 'E4', 'F4'], name: 'Legato, four notes', marks: [{ kind: 'slur', from: 0, to: 3 }] }),
        { title: 'Join them', help: 'holdBar', touchGoal: { goal: 'legato' }, say: say('Hold each key until the next one is down. The hold bars overlap slightly on purpose.') }),
      rung('independent', 'play-rhythm', E({ id: 'ex-touch-i', bpm: 63, pattern: 'q q q q', notes: ['G4', 'F4', 'E4', 'D4'], name: 'Staccato, four notes', marks: [{ kind: 'articulation', value: 'staccato', from: 0, to: 3 }] }),
        { title: 'Now separate them', touchGoal: { goal: 'staccato' }, say: say('Each note off before half its beat is gone. No hold bars this time.') }),
      rung('recall', 'play-rhythm', E({ id: 'ex-touch-r', bpm: 63, pattern: 'q q q q | q q q q', notes: ['E4', 'F4', 'G4', 'A4', 'A4', 'G4', 'F4', 'E4'], name: 'A day later: both', marks: [{ kind: 'slur', from: 0, to: 3 }, { kind: 'articulation', value: 'staccato', from: 4, to: 7 }] }),
        { title: 'Both in one go', touchGoal: { goal: 'legato', toBeat: 4 }, say: say('Bar one joined, bar two short, with no pause to change gear between them.') }),
      rung('transfer', 'play-rhythm', E({ id: 'ex-touch-t', bpm: 60, hand: 'L', pattern: 'q q q q | h h', notes: ['C3', 'E3', 'G3', 'E3', 'D3', 'C3'], name: 'Legato in the left hand', marks: [{ kind: 'slur', from: 0, to: 6 }] }),
        { title: 'The hand that usually forgets', touchGoal: { goal: 'legato' }, say: say('Left hand. Accompaniments go choppy here first, and it is the easiest thing to fix.') }),
    ],
  },
  {
    id: 'ex-dynamics', track: 'expression', skill: 'expression-dynamics',
    title: 'Loud and soft, on purpose',
    teaches: say(
      'Dynamics are relative: f only means anything next to a p. What matters is the DIFFERENCE you can produce, not a number.',
      'On a weighted keyboard, loud comes from speed into the key, not from force at the bottom of it. Pressing harder once the key has landed does nothing.',
      'A crescendo is a gradual change, not a step. Repeat one note and grow it evenly, and you own the control.',
    ),
    measures: 'Velocity on the SAME key, compared with itself. That comparison needs no calibration because it never crosses registers. Comparing two different hands does, and that is the balance card.',
    requires: 'velocity',
    stages: [
      rung('worked', 'listen', E({ id: 'ex-dyn-w', bpm: 60, pattern: 'q q q q | q q q q', notes: Array(8).fill('G4'), name: 'One key, loud then soft', marks: [{ kind: 'dynamic', value: 'f', at: 0 }, { kind: 'dynamic', value: 'p', at: 4 }] }),
        { title: 'The same key, two levels', say: say('Eight presses of one key: four loud, four soft. Listen to the size of the difference.') }),
      rung('guided', 'play-rhythm', E({ id: 'ex-dyn-g', bpm: 60, pattern: 'q q q q | q q q q', notes: Array(8).fill('G4'), name: 'Loud bar, soft bar', marks: [{ kind: 'dynamic', value: 'f', at: 0 }, { kind: 'dynamic', value: 'p', at: 4 }] }),
        { title: 'Try it with the meter showing', help: 'velocityMeter', dynamicPlan: [{ level: 'f', from: 0, to: 4 }, { level: 'p', from: 4, to: 8 }],
          say: say('The meter shows how hard each press landed. Aim for a clear gap between the bars.') }),
      rung('independent', 'play-rhythm', E({ id: 'ex-dyn-i', bpm: 60, pattern: 'q q q q | q q q q', notes: Array(8).fill('E4'), name: 'No meter', marks: [{ kind: 'dynamic', value: 'p', at: 0 }, { kind: 'dynamic', value: 'f', at: 4 }] }),
        { title: 'Soft first this time', dynamicPlan: [{ level: 'p', from: 0, to: 4 }, { level: 'f', from: 4, to: 8 }],
          say: say('Soft bar first, then loud. The order is reversed so it cannot be played on autopilot.') }),
      rung('recall', 'play-rhythm', E({ id: 'ex-dyn-r', bpm: 60, pattern: 'q q q q | q q q q', notes: Array(8).fill('C4'), name: 'A day later', marks: [{ kind: 'dynamic', value: 'f', at: 0 }, { kind: 'dynamic', value: 'p', at: 4 }] }),
        { title: 'Another key', dynamicPlan: [{ level: 'f', from: 0, to: 4 }, { level: 'p', from: 4, to: 8 }],
          say: say('Middle C this time. Same control, and still the same key compared with itself.') }),
      rung('transfer', 'self-check', E({ id: 'ex-dyn-t', bpm: 66, pattern: 'q q q q | h h', notes: ['C4', 'E4', 'G4', 'E4', 'D4', 'C4'], name: 'Shape a phrase', marks: [{ kind: 'text', value: 'grow to the top note, then ease off', at: 0 }] }),
        { title: 'Now a phrase, and your own ears',
          say: say('Grow towards the highest note, then ease away. This one crosses registers, so the app will not score it: play it, listen back, and answer honestly.'),
          selfCheck: { prompt: 'Did the phrase grow towards the top note and settle after it?', options: [{ id: 'yes', label: 'Yes, clearly' }, { id: 'some', label: 'A bit, not much' }, { id: 'no', label: 'No, it came out flat' }] } }),
    ],
  },
  {
    id: 'ex-balance', track: 'expression', skill: 'expression-dynamics',
    title: 'Melody over accompaniment',
    teaches: say(
      'When one hand has the tune and the other has the accompaniment, the tune has to sit on top. Two hands playing equally loudly sounds like mud.',
      'The usual fix is not a louder right hand: it is a quieter left. Take the left hand down and the melody appears.',
      'MEASURING this across two hands means comparing different registers, and that is only honest once your touch is calibrated. Without calibration this card still teaches; it just does not score.',
    ),
    measures: 'With touch calibration: the calibrated level of each hand across the passage (voicing.mjs). Without it: nothing is scored, and you answer the listening check yourself.',
    requires: 'velocity-calibrated',
    stages: [
      rung('worked', 'listen', E({ id: 'ex-bal-w', bpm: 63, voices: { R: { pattern: 'q q h | q q h', notes: ['E4', 'G4', 'C5', 'B4', 'A4', 'G4'] }, L: { pattern: 'h h | h h', notes: ['C3', 'G2', 'A2', 'G2'] } }, name: 'Melody and accompaniment' }),
        { title: 'Listen for the layers', say: say('The right hand has the tune, the left has the support. The app plays it balanced.') }),
      rung('guided', 'play-grid', E({ id: 'ex-bal-g', bpm: 60, voices: { R: { pattern: 'q q h | q q h', notes: ['E4', 'G4', 'C5', 'B4', 'A4', 'G4'] }, L: { pattern: 'h h | h h', notes: ['C3', 'G2', 'A2', 'G2'] } }, name: 'Play both, left hand quieter' }),
        { title: 'Left hand down', help: 'velocityMeter', balance: true, say: say('Play it through with the left hand deliberately softer than feels natural.') }),
      rung('independent', 'play-grid', E({ id: 'ex-bal-i', bpm: 63, voices: { R: { pattern: 'q q q q | h h', notes: ['G4', 'A4', 'B4', 'C5', 'B4', 'G4'] }, L: { pattern: 'h h | h h', notes: ['C3', 'E3', 'D3', 'G2'] } }, name: 'A new passage' }),
        { title: 'No meter', balance: true, say: say('Different notes. The tune should still be the thing you hear first.') }),
      rung('recall', 'play-grid', E({ id: 'ex-bal-r', bpm: 63, voices: { R: { pattern: 'h h | q q h', notes: ['C5', 'B4', 'A4', 'G4', 'E4'] }, L: { pattern: 'h h | h h', notes: ['A2', 'E3', 'F2', 'C3'] } }, name: 'A day later' }),
        { title: 'Again, later', balance: true, say: say('Same job on new material, on a different day.') }),
      rung('transfer', 'self-check', E({ id: 'ex-bal-t', bpm: 63, voices: { R: { pattern: 'q q h | q q h', notes: ['E4', 'F4', 'G4', 'G4', 'F4', 'E4'] }, L: { pattern: 'w | w', notes: ['C3', 'G2'] } }, name: 'Your own piece' }),
        { title: 'Take it to your own music',
          say: say('Play a passage of something you are learning and listen for the balance. This one is your ears: no meter, no score.'),
          selfCheck: { prompt: 'Could you hear the melody clearly above the accompaniment?', options: [{ id: 'yes', label: 'Yes' }, { id: 'sometimes', label: 'In places' }, { id: 'no', label: 'No, they were level' }] } }),
    ],
  },
  {
    id: 'ex-pedal', track: 'expression', skill: 'expression-pedal',
    title: 'Changing the pedal with the harmony',
    teaches: say(
      'The sustain pedal keeps strings ringing after the keys come up. That is why it blurs: everything you played is still sounding.',
      'The usual habit is to change the pedal AS the new chord lands: lift and catch, in one motion, on the beat.',
      'THIS IS NOT A UNIVERSAL RULE. Plenty of music asks for a held pedal, or none, or half. The app only flags a pedal still down through a harmony change it can actually see in your left hand.',
    ),
    measures: 'Pedal transitions against the harmony changes your left hand actually played (pedal.mjs). No pedal connected means no judgement, not a fail.',
    requires: 'pedal',
    stages: [
      rung('worked', 'listen', E({ id: 'ex-ped-w', bpm: 60, voices: { R: { pattern: 'h h | h h', notes: [['E4', 'G4'], ['E4', 'G4'], ['D4', 'G4'], ['D4', 'G4']] }, L: { pattern: 'w | w', notes: ['C3', 'G2'] } }, name: 'Two chords, one change', marks: [{ kind: 'pedal', from: 0, to: 4 }, { kind: 'pedal', from: 4, to: 8 }] }),
        { title: 'Listen to the change', say: say('Two bars, two bass notes. The pedal lifts and catches again exactly where the bass moves.') }),
      rung('guided', 'play-grid', E({ id: 'ex-ped-g', bpm: 56, voices: { R: { pattern: 'h h | h h', notes: [['E4', 'G4'], ['E4', 'G4'], ['D4', 'G4'], ['D4', 'G4']] }, L: { pattern: 'w | w', notes: ['C3', 'G2'] } }, name: 'Change on the bass note', marks: [{ kind: 'pedal', from: 0, to: 4 }, { kind: 'pedal', from: 4, to: 8 }] }),
        { title: 'Lift and catch', help: 'pedalMarks', pedal: true, say: say('The pedal marks under the staff show where to lift. Change as the left hand lands, not before it.') }),
      rung('independent', 'play-grid', E({ id: 'ex-ped-i', bpm: 60, voices: { R: { pattern: 'h h | h h', notes: [['C4', 'E4'], ['C4', 'E4'], ['B3', 'D4'], ['B3', 'D4']] }, L: { pattern: 'w | w', notes: ['A2', 'G2'] } }, name: 'No pedal marks' }),
        { title: 'Your own pedalling', pedal: true, say: say('The bass moves once. Decide where the change belongs and do it.') }),
      rung('recall', 'play-grid', E({ id: 'ex-ped-r', bpm: 60, voices: { R: { pattern: 'h h | h h', notes: [['F4', 'A4'], ['F4', 'A4'], ['E4', 'G4'], ['E4', 'G4']] }, L: { pattern: 'w | w', notes: ['F2', 'C3'] } }, name: 'A day later' }),
        { title: 'Again, new harmony', pedal: true, say: say('Two different chords, the same lift-and-catch.') }),
      rung('transfer', 'self-check', E({ id: 'ex-ped-t', bpm: 60, voices: { R: { pattern: 'q q h | q q h', notes: ['E4', 'G4', 'C5', 'B4', 'A4', 'G4'] }, L: { pattern: 'h h | w', notes: ['C3', 'E3', 'G2'] } }, name: 'Pedal in your own music' }),
        { title: 'Listen for mud',
          say: say('Take this to a passage you are learning. The only real test is whether it sounds clear, and that is your ears, not a meter.'),
          selfCheck: { prompt: 'Did any chord change blur into the one before it?', options: [{ id: 'clean', label: 'No, each change was clean' }, { id: 'some', label: 'One or two blurred' }, { id: 'muddy', label: 'It was muddy throughout' }] } }),
    ],
  },
];

// ---------------------------------------------------------------------------
// 8. The roster, and the applied cards' honesty gate.
// ---------------------------------------------------------------------------
// ---- the transfer pool -----------------------------------------------------
// ☠️ WHY THIS EXISTS. Exposure is banked on EVERY attempt, pass or fail, helped
// or not, because that is the truth about what the learner has met. The cost of
// that honesty is that a single fumbled or hinted transfer would otherwise bar
// the transfer rung for ever, since its material is now known. So every
// transfer rung carries TWO further authored pieces of comparable material:
// same skill, same difficulty, genuinely different music. Not a transposition
// of the same exercise wearing a new id.
// The pool is finite and the module says so out loud when it runs out.
const TRANSFER_ALTS = {
  // -- written rhythm --------------------------------------------------------
  'rh-pulse': [
    E({ id: 'rh-pulse-t2', bpm: 69, pattern: 'q q q q | q q q q', notes: ['C4', 'G4', 'C4', 'G4', 'E4', 'E4', 'G4', 'C4'], name: 'The pulse, two bars' }),
    E({ id: 'rh-pulse-t3', bpm: 80, pattern: 'q q q q | q q q q | q q q q', notes: Array(12).fill('A4'), name: 'The pulse, three bars' }),
  ],
  'rh-values': [
    E({ id: 'rh-values-t2', bpm: 63, hand: 'L', pattern: 'w | h h', notes: ['G2', 'C3', 'E3'], name: 'Whole then halves, bass' }),
    E({ id: 'rh-values-t3', bpm: 66, hand: 'L', pattern: 'q q h | w', notes: ['C3', 'D3', 'E3', 'C3'], name: 'Quarters into a whole, bass' }),
  ],
  'rh-rests': [
    E({ id: 'rh-rests-t2', bpm: 63, hand: 'L', pattern: 'hr h | q qr q qr', notes: ['G2', 'C3', 'E3'], name: 'Rests first, bass' }),
    E({ id: 'rh-rests-t3', bpm: 66, hand: 'L', pattern: 'q q hr | qr q q q', notes: ['C3', 'E3', 'G3', 'E3', 'C3'], name: 'Rests in the middle, bass' }),
  ],
  'rh-eighths': [
    E({ id: 'rh-8-t2', bpm: 66, hand: 'L', pattern: 'q 8 8 q q | 8 8 8 8 h', notes: ['C3', 'D3', 'E3', 'F3', 'E3', 'D3', 'C3', 'D3', 'E3', 'C3'], name: 'Eighths on beat two, bass' }),
    E({ id: 'rh-8-t3', bpm: 63, hand: 'L', pattern: '8 8 8 8 h | q q h', notes: ['G2', 'A2', 'B2', 'C3', 'E3', 'D3', 'C3', 'C3'], name: 'A run of eighths, bass' }),
  ],
  'rh-eighth-rests': [
    E({ id: 'rh-8r-t2', bpm: 60, hand: 'L', pattern: '8r 8 8r 8 h | h h', notes: ['C3', 'E3', 'G3', 'C3', 'G2'], name: 'Off the beat, bass' }),
    E({ id: 'rh-8r-t3', bpm: 63, hand: 'L', pattern: 'q 8r 8 h | 8 8r 8 8r h', notes: ['C3', 'G3', 'E3', 'C3', 'E3', 'C3'], name: 'Mixed eighth rests, bass' }),
  ],
  'rh-dots': [
    E({ id: 'rh-dot-t2', bpm: 63, hand: 'L', pattern: 'qd 8 h | hd q', notes: ['C3', 'D3', 'E3', 'G2', 'C3'], name: 'Long-short first, bass' }),
    E({ id: 'rh-dot-t3', bpm: 60, hand: 'L', pattern: 'q qd 8 q | hd q', notes: ['C3', 'E3', 'D3', 'C3', 'G2', 'C3'], name: 'The dotted pair inside the bar, bass' }),
  ],
  'rh-ties': [
    E({ id: 'rh-tie-t2', bpm: 63, hand: 'L', pattern: 'h h~ | h q q', notes: ['C3', 'G2', 'E3', 'C3'], name: 'Tied over the bar line, bass' }),
    E({ id: 'rh-tie-t3', bpm: 60, hand: 'L', pattern: 'q q h~ | w', notes: ['C3', 'D3', 'E3'], name: 'A tie into a whole bar, bass' }),
  ],
  'rh-tie-vs-slur': [
    E({ id: 'rh-ts-t2', bpm: 58, hand: 'L', pattern: 'h~ h | q q h', notes: ['C3', 'E3', 'F3', 'G3'], name: 'Tie then slur, bass', marks: [{ kind: 'slur', from: 4, to: 5, text: 'slur' }] }),
    E({ id: 'rh-ts-t3', bpm: 60, pattern: 'q q h | q~ q h', notes: ['C4', 'D4', 'E4', 'G4', 'E4'], name: 'Slur then tie', marks: [{ kind: 'slur', from: 0, to: 1, text: 'slur' }] }),
  ],
  'rh-three-four': [
    E({ id: 'rh-34-t2', meter: [3, 4], bpm: 66, pattern: 'q q qr | hd', notes: ['C4', 'E4', 'G4'], name: 'A rest to end the bar' }),
    E({ id: 'rh-34-t3', meter: [3, 4], bpm: 69, hand: 'L', pattern: 'hr q | q q q', notes: ['C3', 'E3', 'D3', 'C3'], name: 'Three-four in the bass' }),
  ],
  'rh-six-eight': [
    E({ id: 'rh-68-t2', meter: [6, 8], bpm: 90, hand: 'L', pattern: 'qd 8 8 8 | qd qd', notes: ['C3', 'E3', 'G3', 'E3', 'C3', 'G2'], name: 'Compound, dotted beat first, bass' }),
    E({ id: 'rh-68-t3', meter: [6, 8], bpm: 96, hand: 'L', pattern: 'q 8 q 8 | 8 8 8 8 8 8', notes: ['C3', 'D3', 'E3', 'F3', 'G3', 'F3', 'E3', 'D3', 'C3', 'G2'], name: 'The 6/8 lilt, bass' }),
  ],
  'rh-triplets': [
    E({ id: 'rh-tri-t2', bpm: 63, hand: 'L', pattern: 'q t8 t8 t8 h', notes: ['C3', 'E3', 'G3', 'E3', 'C3'], name: 'A triplet on beat two, bass' }),
    E({ id: 'rh-tri-t3', bpm: 60, hand: 'L', pattern: 't8 t8 t8 t8 t8 t8 h', notes: ['C3', 'E3', 'G3', 'G3', 'E3', 'C3', 'C3'], name: 'Two triplet groups, bass' }),
  ],
  // -- notation --------------------------------------------------------------
  'nt-flats': [
    E({ id: 'nt-flats-t2', bpm: 63, pattern: 'q q h | 8 8 q h', notes: ['Ab4', 'Gb4', 'F4', 'Eb4', 'Db4', 'C4', 'Bb3'], name: 'A flat-side descent' }),
    E({ id: 'nt-flats-t3', bpm: 60, hand: 'L', pattern: 'q q h | q q h', notes: ['Bb2', 'Db3', 'Eb3', 'Gb3', 'Ab3', 'Bb3'], name: 'Flats in the bass' }),
  ],
  'nt-naturals': [
    E({ id: 'nt-nat-t2', key: 'Bb', bpm: 60, pattern: 'q q q q | q q q q', notes: ['B4', 'Bn4', 'B4', 'A4', 'B4', 'E4', 'En4', 'E4'], name: 'Naturals in two flats' }),
    E({ id: 'nt-nat-t3', key: 'G', bpm: 60, hand: 'L', pattern: 'q q q q | q q q q', notes: ['F3', 'Fn3', 'F3', 'G3', 'F3', 'E3', 'F3', 'G3'], name: 'A natural in one sharp, bass' }),
  ],
  'nt-key-signatures': [
    E({ id: 'nt-ks-t2', key: 'A', bpm: 60, pattern: '8 8 8 8 8 8 8 8', notes: ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'], name: 'A major, three sharps' }),
    E({ id: 'nt-ks-t3', key: 'Eb', bpm: 60, pattern: '8 8 8 8 8 8 8 8', notes: ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'], name: 'E flat major, three flats' }),
  ],
  'nt-enharmonics': [
    E({ id: 'nt-en-t2', key: 'B', bpm: 60, pattern: '8 8 8 8 8 8 8 8', notes: ['B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'], name: 'B major, spelled with sharps' }),
    E({ id: 'nt-en-t3', key: 'Gb', bpm: 60, pattern: '8 8 8 8 8 8 8 8', notes: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'], name: 'G flat major, the same keys spelled flat' }),
  ],
  'nt-symbols': [
    E({ id: 'nt-sym-t2', bpm: 63, pattern: 'q q q q | h h', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'E4'], name: 'Short bar, joined bar', marks: [{ kind: 'articulation', value: 'staccato', from: 0, to: 3 }, { kind: 'slur', from: 4, to: 6 }, { kind: 'dynamic', value: 'mf', at: 0 }] }),
    E({ id: 'nt-sym-t3', bpm: 60, hand: 'L', pattern: 'q q q q | h h', notes: ['G2', 'B2', 'D3', 'B2', 'C3', 'E3'], name: 'Marks in the bass', marks: [{ kind: 'articulation', value: 'staccato', from: 0, to: 3 }, { kind: 'slur', from: 4, to: 6 }, { kind: 'dynamic', value: 'p', at: 0 }] }),
  ],
  'nt-ledger': [
    E({ id: 'nt-led-t2', bpm: 60, voices: { R: { pattern: 'h h', notes: ['B5', 'G5'] }, L: { pattern: 'h h', notes: ['D2', 'F2'] } }, name: 'Both ends again' }),
    E({ id: 'nt-led-t3', bpm: 60, voices: { R: { pattern: 'q q h', notes: ['C6', 'A5', 'F5'] }, L: { pattern: 'q q h', notes: ['E2', 'G2', 'C3'] } }, name: 'Climbing out of both staves' }),
  ],
  'nt-intervals-ahead': [
    E({ id: 'nt-int-t2', bpm: 60, hand: 'L', pattern: 'q q q q | q q q q', notes: ['G3', 'E3', 'F3', 'D3', 'E3', 'C3', 'D3', 'B2'], name: 'Falling thirds, bass' }),
    E({ id: 'nt-int-t3', bpm: 60, pattern: 'q q q q | q q q q', notes: ['F4', 'A4', 'G4', 'B4', 'A4', 'C5', 'B4', 'D5'], name: 'Rising thirds from F' }),
  ],
  'nt-vertical': [
    E({ id: 'nt-vert-t2', bpm: 56, voices: { R: { pattern: 'q q h | q q h', notes: ['G4', 'A4', 'B4', 'B4', 'A4', 'G4'] }, L: { pattern: 'h h | w', notes: ['G2', 'D3', 'G2'] } }, name: 'A new grid in four' }),
    E({ id: 'nt-vert-t3', meter: [3, 4], bpm: 60, voices: { R: { pattern: 'q q q | hd', notes: ['E4', 'F4', 'G4', 'C4'] }, L: { pattern: 'hd | hd', notes: ['C3', 'G2'] } }, name: 'A new grid in three' }),
  ],
  // -- expression ------------------------------------------------------------
  'ex-touch': [
    E({ id: 'ex-touch-t2', bpm: 60, hand: 'L', pattern: 'q q q q | h h', notes: ['G2', 'B2', 'D3', 'B2', 'C3', 'G2'], name: 'Joined in the bass', marks: [{ kind: 'slur', from: 0, to: 6 }] }),
    E({ id: 'ex-touch-t3', bpm: 63, pattern: 'q q q q | h h', notes: ['G4', 'A4', 'B4', 'C5', 'B4', 'G4'], name: 'Joined, right hand, higher', marks: [{ kind: 'slur', from: 0, to: 6 }] }),
  ],
};

// The applied cards' alternates are ORIGINAL STUDY TRANSFERS: new authored
// exercises in the same key, not another catalogue song. Guessing harmony on a
// second piece to keep a rung alive would be exactly the thing this module
// refuses to do.
const APPLIED_TRANSFER_ALTS = {
  'ap-am-still-dre': [
    E({ id: 'ap-am-t2', key: 'Am', bpm: 69, name: 'A minor study, second transfer',
      voices: { R: { pattern: 'q q q q | h h', notes: ['E5', 'C5', 'A4', 'C5', 'E5', 'A4'] }, L: { pattern: 'h h | w', notes: ['A2', 'E3', 'A2'] } } }),
    E({ id: 'ap-am-t3', key: 'Am', bpm: 66, name: 'A minor study, third transfer',
      voices: { R: { pattern: 'h q q | w', notes: ['A4', 'B4', 'C5', 'A4'] }, L: { pattern: 'w | h h', notes: ['A2', 'E2', 'A2'] } } }),
  ],
  'ap-c-ode-to-joy': [
    E({ id: 'ap-c-t2', key: 'C', bpm: 69, name: 'C major study, second transfer',
      voices: { R: { pattern: 'q q q q | h h', notes: ['G4', 'F4', 'E4', 'D4', 'C4', 'E4'] }, L: { pattern: 'h h | w', notes: ['C3', 'G2', 'C3'] } } }),
    E({ id: 'ap-c-t3', key: 'C', bpm: 66, name: 'C major study, third transfer',
      voices: { R: { pattern: 'h h | q q h', notes: ['E4', 'G4', 'F4', 'E4', 'C4'] }, L: { pattern: 'w | h h', notes: ['C3', 'F2', 'G2'] } } }),
  ],
  'ap-g-happy-birthday': [
    E({ id: 'ap-g-t2', key: 'C', meter: [3, 4], bpm: 69, name: 'Five-chord study, second transfer',
      voices: { R: { pattern: 'q q q | hd | q q q | hd', notes: ['D5', 'B4', 'G4', 'G4', 'C5', 'B4', 'G4', 'E4'] }, L: { pattern: 'hd | hd | hd | hd', notes: ['G2', 'G2', 'C3', 'C3'] } } }),
    E({ id: 'ap-g-t3', key: 'C', meter: [3, 4], bpm: 66, name: 'Five-chord study, third transfer',
      voices: { R: { pattern: 'h q | hd | h q | hd', notes: ['G4', 'A4', 'B4', 'D5', 'C5', 'C5'] }, L: { pattern: 'hd | hd | hd | hd', notes: ['C3', 'G2', 'G2', 'C3'] } } }),
  ],
  'ap-cm-game-of-thrones': [
    E({ id: 'ap-cm-t2', key: 'Cm', meter: [3, 4], bpm: 66, name: 'C minor study, second transfer',
      voices: { R: { pattern: 'q q q | hd | q q q | hd', notes: ['C5', 'B4', 'G4', 'G4', 'E5', 'D5', 'C5', 'C5'] }, L: { pattern: 'hd | hd | hd | hd', notes: ['C3', 'B2', 'C3', 'C3'] } } }),
    E({ id: 'ap-cm-t3', key: 'Cm', meter: [3, 4], bpm: 63, name: 'C minor study, third transfer',
      voices: { R: { pattern: 'h q | hd | h q | hd', notes: ['G4', 'E4', 'F4', 'D4', 'C4', 'C4'] }, L: { pattern: 'hd | hd | hd | hd', notes: ['C3', 'C3', 'B2', 'C3'] } } }),
  ],
  'ap-cadence-study': [
    E({ id: 'ap-cadence-t2', key: 'C', bpm: 66, name: 'I IV V I study, second transfer',
      voices: { R: { pattern: 'h h | h h | h h | w', notes: [['C4', 'E4', 'G4'], ['C4', 'F4', 'A4'], ['B3', 'D4', 'G4'], ['C4', 'E4', 'G4'], ['C4', 'F4', 'A4'], ['B3', 'D4', 'G4'], ['C4', 'E4', 'G4']] }, L: { pattern: 'w | w | w | w', notes: ['C3', 'F2', 'G2', 'C3'] } } }),
    E({ id: 'ap-cadence-t3', key: 'C', bpm: 63, name: 'I IV V I study, third transfer',
      voices: { R: { pattern: 'q q h | q q h | q q h | w', notes: ['E4', 'G4', ['C4', 'E4', 'G4'], 'F4', 'A4', ['C4', 'F4', 'A4'], 'D4', 'G4', ['B3', 'D4', 'G4'], ['C4', 'E4', 'G4']] }, L: { pattern: 'w | w | w | w', notes: ['C3', 'F2', 'G2', 'C3'] } } }),
  ],
};

const withAlts = (card) => {
  const alts = TRANSFER_ALTS[card.id] ?? APPLIED_TRANSFER_ALTS[card.id];
  if (!alts) return card;
  return { ...card, stages: card.stages.map((s) => (s.kind === 'transfer' ? { ...s, alts } : s)) };
};

export const LAB_CARDS = [
  ...RHYTHM_CARDS,
  ...READING_CARDS,
  ...APPLIED_CARDS.map((c) => ({ ...c, stages: appliedStages(c) })),
  ...EXPRESSION_CARDS,
].map(withAlts);
export const CARD_BY_ID = Object.fromEntries(LAB_CARDS.map((c) => [c.id, c]));
export const cardById = (id) => CARD_BY_ID[id] ?? null;
export const TRACKS = [
  { id: 'rhythm', name: 'Written rhythm', why: 'Reading time, not copying it by ear.' },
  { id: 'reading', name: 'Notation', why: 'The rules the page obeys.' },
  { id: 'applied', name: 'This passage', why: 'Theory, inside music you are actually playing.' },
  { id: 'expression', name: 'Expression', why: 'The part of playing that is not the notes.' },
];

// One line per card, for a roster screen or a document. Every entry says what
// the card MEASURES, because a lesson that will not say that is a claim.
export function labRoster() {
  return LAB_CARDS.map((c) => ({
    id: c.id, track: c.track, title: c.title, skill: c.skill, skillName: LAB_SKILLS[c.skill],
    measures: c.measures, requires: c.requires ?? null,
    support: c.requires ? EXPRESSION_SUPPORT[c.requires] : null,
    songId: c.passage?.songId ?? null, section: c.passage?.section ?? null,
    scaleId: c.technique?.scaleId ?? null,
    stages: c.stages.map((s) => ({ kind: s.kind, input: s.input, title: s.title, variant: s.variant ?? null })),
  }));
}

// ☠️ THE GATE. An applied card may only show its passage claims if the shipped
// song still matches what was authored against it. Anything else prints its
// reason and falls back to the study piece, which is ours and cannot drift.
export function verifyPassage(song, passage) {
  const reasons = [];
  if (!song) return { ok: false, reasons: ['That song is not in this library.'] };
  const x = passage.expect;
  if (String(song.timeSig) !== String(x.meter)) reasons.push(`meter is ${song.timeSig?.join('/')}, expected ${x.meter.join('/')}`);
  const sec = (song.sections ?? []).find((s) => s.name === passage.section);
  if (!sec) reasons.push(`section "${passage.section}" no longer exists`);
  else if (sec.startBeat !== passage.startBeat || sec.endBeat !== passage.endBeat) reasons.push(`section "${passage.section}" now covers ${sec.startBeat}-${sec.endBeat}`);
  const inRange = (song.notes ?? []).filter((n) => n.b >= passage.startBeat && n.b < passage.endBeat);
  x.bassPcsAtBar.forEach((pc, i) => {
    const at = passage.startBeat + i * x.barBeats;
    const bass = inRange.filter((n) => n.h === 'L' && n.b >= at && n.b < at + x.barBeats).sort((a, b) => a.b - b.b || a.m - b.m)[0];
    if (!bass) reasons.push(`bar ${i + 1} has no left-hand note`);
    else if (bass.m % 12 !== pc) reasons.push(`bar ${i + 1} bass is pitch class ${bass.m % 12}, expected ${pc}`);
  });
  const melody = [...new Set(inRange.filter((n) => n.h === 'R').map((n) => n.m % 12))].sort((a, b) => a - b);
  const wanted = [...new Set(x.melodyPcs)].sort((a, b) => a - b);
  if (String(melody) !== String(wanted)) reasons.push(`melody uses pitch classes [${melody}], expected [${wanted}]`);
  return { ok: reasons.length === 0, reasons };
}

// songs = the app's SONGS array, injected (this module never imports the
// library: it is 9MB and none of it belongs in a curriculum file).
export function resolveAppliedCards(songs = []) {
  return LAB_CARDS.filter((c) => c.track === 'applied').map((card) => {
    if (!card.passage) return { cardId: card.id, ok: true, passage: null, note: 'This card claims no catalogue song: its transfer rung is an original study piece.' };
    const song = songs.find((s) => s.id === card.passage.songId);
    const check = verifyPassage(song, card.passage);
    return {
      cardId: card.id, ok: check.ok, reasons: check.reasons,
      passage: check.ok ? { ...card.passage, title: song.title, level: song.level ?? null, bpm: song.bpm } : null,
      fallback: check.ok ? null : 'study-piece',
      note: check.ok ? card.passage.why
        : `This card will not annotate ${card.passage.songId}: ${check.reasons.join('; ')}. The study piece is used instead.`,
    };
  });
}

// The exact settings a passage rung hands back to the practice surface, so
// "back to the music" returns to the SAME passage, hands, tempo and help.
export function passageContext(card, resolved) {
  const p = resolved?.passage ?? null;
  if (!p) return null;
  return {
    songId: p.songId, section: p.section, startBeat: p.startBeat, endBeat: p.endBeat,
    hand: p.hand, tempo: p.tempo, wait: p.wait, title: p.title,
    returnTo: { cardId: card.id, stage: 'transfer' },
    // ☠️ SAY WHAT THIS RUN CAN EARN, BEFORE IT IS PLAYED. The authored settings
    // have the help on, which is the right way to meet a passage and is worth
    // practice credit. The transfer is earned by the same passage with the help
    // off, and the learner should not have to discover that afterwards.
    practiceOnly: p.wait === true,
    earns: p.wait === true
      ? 'With the help on this is practice credit. Turn the help off, at full tempo, for it to count as taking the skill somewhere new.'
      : 'Help off at full tempo: this one counts as taking the skill somewhere new.',
    gradedOn: p.wait === true
      ? 'The notes: every required note played, none wrong, none missed. With the help on the app holds the music for you, so timing is not graded.'
      : `Accuracy, ${PASSAGE_INDEPENDENT_MIN_ACC}% with no wrong notes.`,
    technique: card.technique ?? null,
    expressionGoal: card.expressionGoal ?? null,
    line: `${p.title}, ${p.section}, ${p.hand === 'both' ? 'both hands' : p.hand === 'R' ? 'right hand' : 'left hand'}, help ${p.wait ? 'on' : 'off'}, ${p.tempo}% tempo.`,
  };
}

// ---------------------------------------------------------------------------
// 9. Deterministic variants. Content identity is the CONTENT, never the seed:
// two different seeds that produce the same notes are the same exercise, and
// a card cannot claim fresh evidence for material already played.
// ---------------------------------------------------------------------------
export function tokenFromMidi(midi, key = 'C') {
  const [letters, octave] = spellPitch(midi, key).split('/');
  return letters[0].toUpperCase() + letters.slice(1) + octave;
}
const POSITION_STARTS_R = [60, 62, 64, 65, 67, 69, 59, 57];
const POSITION_STARTS_L = [45, 47, 48, 50, 52, 53];
export const POSITION_SHAPE = [0, 2, 5, 4];    // up a step, up a third, down a step

// seedKey should be a stable string for "this card, this rung, this day", so
// the same day gives the same exercise and a new day gives a new one.
export function positionVariant(kind, seedKey, taken = []) {
  const rng = mulberry32(fnvInt(seedKey));
  const left = kind === 'position-left';
  const pool = left ? POSITION_STARTS_L : POSITION_STARTS_R;
  for (let attempt = 0; attempt < pool.length * 3; attempt++) {
    const start = pool[Math.floor(rng() * pool.length)];
    const ex = E({
      id: `nt-pos-${kind}-${start}`, bpm: 60, hand: left ? 'L' : 'R',
      pattern: 'q q q q', name: 'The shape, from ' + tokenFromMidi(start),
      notes: POSITION_SHAPE.map((iv) => tokenFromMidi(start + iv)),
    });
    if (!taken.includes(ex.contentId)) return ex;
  }
  return null;  // every position already used: the caller says so rather than repeating one silently
}
const fnvInt = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// ---------------------------------------------------------------------------
// 10. The runner. DOM-free, deterministic: every input takes an explicit `at`
// in milliseconds from beat zero, so a whole session can be played in a test
// in microseconds. A UI routes MIDI, a computer keyboard or a click into the
// SAME three methods; nothing here knows or cares which device it was.
// ☠️ THE DEVICE NEVER CHANGES THE SCORE. Assistance does. A hint, lit keys, a
// hold bar or an interval label makes the attempt assisted, on a P-45 and on a
// trackpad alike.
// ---------------------------------------------------------------------------
export const HELP_LABELS = {
  countRow: 'The count row lights each beat as it passes.',
  litKeys: 'The target keys are lit on the keyboard.',
  holdBar: 'A bar under each note shows how long to hold it.',
  restMarkers: 'The rests are marked, with a lift cue on each one.',
  intervalLabels: 'The distance between each pair of notes is printed.',
  velocityMeter: 'A meter shows how hard each key was struck.',
  pedalMarks: 'Pedal lift-and-catch marks are printed under the staff.',
};
export const MAX_RETRIES = 3;

export function stageOf(card, kind, index = 0) {
  const matches = card.stages.filter((s) => s.kind === kind);
  return matches[Math.min(index, Math.max(0, matches.length - 1))] ?? null;
}

// Availability: a rung that cannot honestly be attempted says why.
// ☠️ RECALL IS A CALENDAR FACT. It needs a real day to have passed AND a
// different calendar date, measured from the independent pass this card
// already banked. Offering it sooner would manufacture the evidence.
// ☠️ WHICH RUNG DOES AN ATTEMPT ACTUALLY COMPLETE? Exactly one answer, used by
// the ledger, by progress, by the due dates, by the summary and by the badges.
// A physical pass is not a qualification: a helped pass is practice, a recall
// that could not prove a delay is an independent pass, and a repeat of known
// material is not a transfer. `null` means the attempt completed no rung.
// The content a recall must NOT be: the independent rung's authored exercise.
// A slot filled by an attempt on some other rung (`via`) carries that other
// rung's content, which is not what the rule is about.
export function independentContentId(card, slot) {
  if (slot && !slot.via && slot.contentId) return slot.contentId;
  return card.stages.find((s) => s.kind === 'independent')?.ex?.contentId ?? null;
}

export function qualifiedSlot(stage, outcome) {
  if (outcome === 'retained') return 'recall';
  if (outcome === 'transferred') return 'transfer';
  if (outcome === 'independent') return 'independent';
  if (outcome === 'practice') return stage === 'guided' ? 'guided' : null;
  return null;
}

export function stageAvailable(st, cardId, kind, now = Date.now()) {
  const card = cardById(cardId);
  if (!card) return { ok: false, why: 'No such card.' };
  const rec = st?.lab?.cards?.[cardId];
  const ind = rec?.stages?.independent;
  // A card whose measurement this device cannot support progresses on honest
  // SELF REPORTS instead of passes. That is not competence and never becomes
  // competence, but it must not be a dead end either.
  const anchor = ind?.passedAt ?? ind?.selfReportedAt ?? null;
  if (kind === 'recall') {
    if (!anchor) return { ok: false, why: 'Pass the independent rung first; recall checks that it stuck.', blocked: 'needs-independent', playableAsPractice: true };
    const clock = st?.lab?.clock;
    // ☠️ A ROLLED-BACK CLOCK DEFERS RETENTION, IT DOES NOT BAN IT. The guard
    // lifts as soon as the clock passes the last time we trusted.
    if (clock?.suspect && now < (clock.suspectUntil ?? 0)) return {
      ok: false, blocked: 'clock',
      why: `The device clock moved backwards, so a day cannot be proven yet. Retention opens again once the clock passes ${evidenceDate(clock.suspectUntil)}.`,
      earliest: clock.suspectUntil, playableAsPractice: true,
    };
    const waited = now - anchor >= RETENTION_MIN_DELAY && evidenceDate(now) !== (ind.date ?? evidenceDate(anchor));
    return waited ? { ok: true } : {
      ok: false, blocked: 'too-soon',
      why: `Recall is a check on a later day. You passed this on ${ind.date}; come back tomorrow.`,
      earliest: anchor + RETENTION_MIN_DELAY,
      // it can still be PLAYED, it just cannot claim retention
      playableAsPractice: true,
    };
  }
  if (kind === 'transfer') {
    if (!anchor) return { ok: false, why: 'The transfer rung takes this to new material; pass the independent rung first.', blocked: 'needs-independent', playableAsPractice: true };
  }
  return { ok: true };
}

export class LabSession {
  // ctx: { now, capabilities:{velocity,noteOff,pedal}, cal, resolvedApplied, taken:[contentIds] }
  constructor(card, stage, ctx = {}) {
    this.card = card;
    this.stage = stage;
    this.ctx = ctx;
    this.startedAt = ctx.now ?? Date.now();
    this.assisted = !!stage.help || stage.kind === 'guided' || stage.kind === 'worked';
    this.assistReasons = stage.help ? [HELP_LABELS[stage.help] ?? stage.help] : [];
    if (stage.kind === 'guided') this.assistReasons.push('Guided rung: help is on by design.');
    this.hintsUsed = 0;
    this.retries = ctx.retries ?? 0;
    this.events = [];        // {kind:'on'|'off', midi, at, velocity, source}
    this.taps = [];
    this.pedalLog = [];
    this.answers = {};
    this.selfReport = null;
    this.finished = null;
    this.passageResult = null;
    this.began = false;
    // a variant rung builds its exercise now, from the calendar day
    // A generated rung asks for material this card has not used. When the pool
    // of fresh positions runs out it REPEATS one and says so, rather than
    // handing back nothing and leaving the rung unplayable forever: a failed
    // independent attempt has to stay finishable (supervisor point 4).
    this.repeatedContent = false;
    this.poolExhausted = false;
    this.usingAlt = false;
    const taken = ctx.taken ?? [];
    if (stage.variant) {
      const seed = `${card.id}|${stage.kind}|${evidenceDate(this.startedAt)}|${this.retries}`;
      this.ex = positionVariant(stage.variant, seed, taken);
      if (!this.ex) { this.ex = positionVariant(stage.variant, seed, []); this.repeatedContent = true; this.poolExhausted = true; }
    } else if (stage.kind === 'transfer' && stage.alts?.length) {
      // ☠️ A FAILED OR HELPED TRANSFER MUST NOT BAR THE RUNG FOR EVER, AND THE
      // FIX IS NOT TO PRETEND THE MATERIAL IS FRESH. Exposure is banked
      // honestly on EVERY attempt, so the way back is genuinely different
      // material: each transfer rung carries authored alternates, and the rung
      // deals the first one this card has not used. When the pool runs out it
      // says so, and the rung stops being offered as earnable (cold review
      // finding 1, and the supervisor's explicit ruling on it, 2026-09-13).
      const pool = [stage.ex, ...stage.alts].filter(Boolean);
      const fresh = pool.find((candidate) => !taken.includes(candidate.contentId));
      this.pool = { size: pool.length, used: pool.filter((c) => taken.includes(c.contentId)).length };
      this.ex = fresh ?? stage.ex;
      this.usingAlt = !!fresh && fresh !== stage.ex;
      this.poolExhausted = !fresh;
      this.repeatedContent = !fresh;
    } else this.ex = stage.ex ?? null;
    // ☠️ THE RUNG'S OWN MEASUREMENT COUNTS, NOT JUST THE CARD'S. nt-symbols
    // declares `requires:'note-off'` but its independent rung is "one bar loud,
    // one bar soft", which needs VELOCITY. With no velocity that rung used to
    // score the rhythm, ignore the dynamics entirely and pay full independent
    // credit for a measurement it never made (cold review finding 7).
    // stageRequires() gives every rung its own requirement, and an unmet one
    // degrades the rung to an authored self assessment instead.
    this.support = supportFor(card, ctx.capabilities ?? {}, ctx.cal, stage);
    this.degraded = !this.support.ok;
    this.input = this.degraded && stage.input !== 'listen' ? 'self-check' : stage.input;
    // Every degraded rung gets a REAL QUESTION. A "self check" with nothing to
    // answer, advancing on a press of Next, was the honest-degradation path
    // quietly becoming a clicker (cold review finding 3).
    this.selfCheckQuestion = this.input === 'self-check'
      ? (stage.selfCheck ?? fallbackSelfCheck(card, stage, this.support.need))
      : (stage.selfCheck ?? null);
    this.stageIndex = ctx.stageIndex ?? 0;
    // ☠️ A REFUSED PASSAGE FALLS BACK TO THE STUDY PIECE. If the song data
    // moved under an applied card, the rung must still be playable: it plays
    // OUR exercise, which cannot drift, and says that is what happened.
    this.resolved = stage.passage ? (ctx.resolvedApplied ?? []).find((r) => r.cardId === card.id) ?? null : null;
    this.fellBack = !!stage.passage && !(this.resolved?.ok && this.resolved.passage);
    if (this.fellBack && this.input === 'play-passage') this.input = 'play-rhythm';
    // An applied transfer rung's content is THE PASSAGE, not the study piece
    // that sits behind it. When the passage has already been used, the rung
    // deals an authored NEW study transfer instead: never another catalogue
    // song, because this module does not guess harmony it has not verified.
    if (this.input === 'play-passage') {
      const p = this.resolved?.passage;
      this.passageContentId = fnv(`passage|${p.songId}|${p.section}|${p.startBeat}|${p.endBeat}`);
      if (taken.includes(this.passageContentId) && stage.alts?.length) {
        const fresh = stage.alts.find((a) => !taken.includes(a.contentId));
        if (fresh) { this.ex = fresh; this.input = 'play-rhythm'; this.usingAlt = true; this.passageContentId = null; }
        else { this.poolExhausted = true; this.repeatedContent = true; }
      }
    }
  }

  get contentId() { return this.passageContentId ?? this.ex?.contentId ?? null; }
  get msPerBeat() { return this.ex?.msPerBeat ?? 1000; }

  begin(atMs = 0) { this.began = true; this.beganAt = atMs; return this.state(); }

  noteOn(midi, opts = {}) {
    const at = opts.at ?? 0;
    this.events.push({ kind: 'on', midi, at, velocity: opts.velocity ?? null, source: opts.source ?? 'unknown' });
    return this._live(midi, true, at);
  }
  noteOff(midi, opts = {}) {
    this.events.push({ kind: 'off', midi, at: opts.at ?? 0 });
    return this._live(midi, false, opts.at ?? 0);
  }
  // any key, any device: the rhythm rungs care WHEN, not WHICH
  tap(opts = {}) { this.taps.push({ at: opts.at ?? 0 }); return { taps: this.taps.length }; }
  pedal(down, opts = {}) {
    if (this.pedalLog.at(-1)?.down === down) return null;      // collapse a continuous pedal
    this.pedalLog.push({ down, timeMs: opts.at ?? 0, beat: (opts.at ?? 0) / this.msPerBeat });
    return { pedal: down };
  }
  // the label question on a worked rung, and the self check on a listening rung
  // ☠️ AN INVALID ANSWER IS NOT AN ANSWER. It is not stored, it does not count
  // as a verdict, and it cannot move the card along. Neither can no answer at
  // all: finish() refuses to record a self report that is empty.
  answer(optionId) {
    const ask = this.input === 'self-check' ? this.selfCheckQuestion : (this.stage.ask ?? this.selfCheckQuestion);
    if (!ask) return { recorded: false, invalid: true, why: 'This rung has no question to answer.' };
    const opt = ask.options.find((o) => o.id === optionId) ?? null;
    if (!opt) return { recorded: false, invalid: true, why: `"${optionId}" is not one of the answers offered.`, options: ask.options.map((o) => o.id) };
    this.answers[this.stage.kind] = optionId;
    if (this.input === 'self-check') this.selfReport = { prompt: ask.prompt, answer: optionId, label: opt.label, unmeasured: ask.unmeasured ?? this.support.need ?? null };
    return { correct: opt.correct ?? null, why: ask.why ?? null, recorded: this.input === 'self-check' };
  }
  // ☠️ A HINT IS NOT FREE AND IT IS NOT PUNISHED. It converts this attempt to
  // practice credit and says so out loud, once, before it is used.
  hint() {
    this.hintsUsed++;
    this.assisted = true;
    this.assistReasons.push('A hint was used, so this attempt counts as practice.');
    const t = this._nextTarget();
    return {
      used: this.hintsUsed, assisted: true,
      keys: t ? t.midis : [],
      text: t ? `Next: ${t.written.join(' + ')} on beat ${beatLabel(t.at, this.ex)}.` : 'Nothing left to play on this rung.',
    };
  }
  // the app hands back what its own engine measured for a passage rung
  // The app hands back what its OWN engine measured for a passage rung.
  // ☠️ EVERY AUTHORED PASSAGE DEFAULTS TO HELP ON, AND A HELPED RUN CANNOT BE
  // GRADED ON ACCURACY. In wait mode the engine freezes until the right keys
  // arrive, so every accepted press classifies as `good`, and a flawless run
  // scores exactly 80. Requiring 85 failed a learner who played every note of
  // the passage correctly (root, from the real UI: 97/97 notes, 0 wrong,
  // 0 missed, outcome "not yet"). A guided run is graded on PITCH EVIDENCE
  // instead, separately from timing, and it earns practice credit only.
  //
  // Required: acc, wrong. Everything else is optional and backward compatible;
  // an older caller that sends only the original fields still works, and still
  // cannot fabricate a helped pass, because without pitch evidence a guided run
  // is refused rather than assumed.
  //   assisted, hand, tempo, wait, section     the conditions it was played under
  //   stats      Engine.stats verbatim: {perfect, good, late, wrong, missed}
  //   required   number of required note events in the passage
  //   played     number of accepted note events (engine.playLog.length)
  //   missed     engine.stats.missed, when stats itself is not sent
  //   songId, startBeat, endBeat, title        identity, preserved verbatim
  recordPassage(payload = {}) {
    const { assisted, wait, tempo } = payload;
    // the same law recordSongAttempt applies: help on, or under tempo, is help
    const helped = !!assisted || wait === true || (Number.isFinite(tempo) && tempo < 100);
    this.passageResult = { ...payload, acc: payload.acc, wrong: payload.wrong, assisted: helped };
    if (helped) {
      this.assisted = true;
      this.assistReasons.push(wait === true
        ? 'The passage was played with the help on, so it is practice credit.'
        : 'The passage was played with help, so it is practice credit.');
    }
    return this.passageResult;
  }

  _nextTarget() {
    const done = this._livePlayed();
    const list = this.ex?.targets ?? [];
    return list[Math.min(done, list.length - 1)] ?? null;
  }
  _livePlayed() {
    if (this.input === 'play-notes' || this.input === 'play-together') return this._seqIdx ?? 0;
    return this.events.filter((e) => e.kind === 'on').length;
  }
  // live judgement, so the UI can colour a press the moment it lands. The
  // AUTHORITY is still finish(): this is feedback, not the mark.
  _live(midi, isDown, at) {
    if (!isDown || !this.ex) return null;
    if (this.input === 'play-notes') {
      this._seqIdx ??= 0;
      const t = this.ex.targets.filter((x) => !this.stage.hand || x.hand === this.stage.hand)[this._seqIdx];
      if (!t) return { status: 'after-end' };
      if (t.midis.includes(midi)) { this._seqIdx++; return { status: 'correct', at: t.at, remaining: this.ex.targets.length - this._seqIdx }; }
      return { status: 'wrong', expected: t.midis, hint: 'Keep going: the rung continues and the repair comes after.' };
    }
    if (this.input === 'play-together') {
      const chords = this.stage.chords ?? this.ex.targets.map((t) => ({ midis: t.midis }));
      const res = scoreChords(chords, this.events, {});
      this._seqIdx = res.results.filter((r) => r.status === 'ok').length;
      return { status: res.results.every((r) => r.status === 'ok') ? 'complete' : 'progress', done: this._seqIdx, of: chords.length };
    }
    return { status: 'recorded', at };
  }

  // What a UI needs to draw the rung: preview, targets, help, progress, hints.
  state() {
    const ex = this.ex;
    const targets = ex?.targets ?? [];
    const showTargets = this.stage.help === 'litKeys' || this.stage.kind === 'worked';
    return {
      cardId: this.card.id, cardTitle: this.card.title, track: this.card.track,
      skill: this.card.skill, skillName: LAB_SKILLS[this.card.skill],
      stage: this.stage.kind, input: this.input, title: this.stage.title,
      say: this.stage.say ?? [], teaches: this.stage.kind === 'worked' ? this.card.teaches : [],
      measures: this.card.measures,
      render: ex?.render ?? null, song: ex?.song ?? null, countRow: ex?.countRow ?? null,
      marks: ex?.marks ?? [], meter: ex?.meter ?? null, bpm: ex?.bpm ?? null,
      msPerBeat: this.msPerBeat, countIn: ex?.countIn ?? 2,
      lookAhead: this.stage.lookAhead ?? 0,
      targets: showTargets ? targets.map((t) => ({ at: t.at, hand: t.hand, midis: t.midis, written: t.written })) : [],
      nextTarget: this._nextTarget(),
      help: this.stage.help ? { id: this.stage.help, text: HELP_LABELS[this.stage.help] } : null,
      ask: this.stage.ask ?? null,
      // the question this rung actually asks: authored on the rung, or the
      // fallback for the measurement this device cannot make
      selfCheck: this.input === 'self-check' ? this.selfCheckQuestion : (this.stage.selfCheck ?? null),
      answered: this.answers[this.stage.kind] ?? null,
      // only the rung that actually opens the passage carries passage context:
      // once it has dealt an authored study transfer instead, it claims nothing
      // about any catalogue song
      passage: this.input === 'play-passage' ? passageContext(this.card, this.resolved) : null,
      fellBack: this.fellBack, fellBackNote: this.fellBack ? (this.resolved?.note ?? 'This card has no verified passage in this library, so it uses its own study piece.') : null,
      technique: this.card.technique ?? null,
      expressionGoal: this.card.expressionGoal ?? null,
      support: this.support, degraded: this.degraded,
      assisted: this.assisted, assistReasons: [...this.assistReasons],
      hints: { used: this.hintsUsed, text: this.hintsUsed ? 'This attempt counts as practice.' : 'A hint is available; using one makes this practice, not independent evidence.' },
      retries: { used: this.retries, max: MAX_RETRIES, left: Math.max(0, MAX_RETRIES - this.retries) },
      progress: { played: this._livePlayed(), of: targets.length, taps: this.taps.length },
      contentId: this.contentId, repeatedContent: this.repeatedContent,
      usingAlt: this.usingAlt, pool: this.pool ?? null, poolExhausted: this.poolExhausted,
      repeatedNote: !this.repeatedContent ? null
        : this.stage.kind === 'transfer'
          ? 'Every piece of fresh material this card carries has now been used, so this one comes round again. Play it as much as you like: it can no longer earn a transfer, because transfer means material you have not met.'
          : 'Every fresh position for this card has been used, so this one comes round again. It still counts as an independent pass; it cannot count as transfer.',
      altNote: this.usingAlt ? 'Different material this time, so the transfer still means something.' : null,
      finished: this.finished,
    };
  }

  // Mark the attempt. Everything above this line is collection; this is the
  // only place a verdict is formed.
  finish(opts = {}) {
    const now = opts.now ?? this.ctx.now ?? Date.now();
    const ex = this.ex;
    const onsetMs = this.stage.kind === 'guided' ? TOL.onsetGuidedMs : TOL.onsetMs;
    const hand = this.stage.hand ?? null;
    let report = null, passed = false, measured = this.input;

    switch (this.input) {
      case 'listen':
        report = { answered: this.answers.worked ?? null, correct: this.stage.ask ? this.stage.ask.options.find((o) => o.id === this.answers.worked)?.correct === true : null };
        passed = true;                       // watching is not a test, and never claims to be
        measured = 'nothing: this rung is a demonstration';
        break;
      case 'tap-rhythm':
        report = scoreTaps(ex, this.taps.map((t) => t.at), { msPerBeat: this.msPerBeat, hand });
        passed = report.passed;
        break;
      case 'play-rhythm': {
        // ☠️ A STACCATO DOT CHANGES WHAT THE NOTE VALUE MEANS. Under a dot the
        // written value is the SLOT, not the hold, so checking the hold against
        // it would fail a correct staccato read for being too short. Where dots
        // are printed (or the rung's goal is staccato) the hold is judged by
        // the articulation rule instead, over exactly the marked span.
        const dots = (ex.marks ?? []).filter((m) => m.kind === 'articulation' && m.value === 'staccato');
        const goalStaccato = this.stage.touchGoal?.goal === 'staccato';
        report = scoreRhythm(ex, this.events, { msPerBeat: this.msPerBeat, onsetMs, hand, checkDurations: !dots.length && !goalStaccato });
        passed = report.passed;
        for (const m of dots) {
          const short = scoreTouch(ex, this.events, 'staccato', { msPerBeat: this.msPerBeat, hand, fromBeat: m.from, toBeat: m.to + 1e-6 });
          (report.staccato ??= []).push(short);
          if (short.supported === false) continue;
          const own = (short.faults ?? []).filter((f) => f.kind === 'not-staccato');
          if (own.length) { passed = false; report.faults = [...report.faults, ...own]; }
        }
        if (this.stage.touchGoal && passed) {
          const touch = scoreTouch(ex, this.events, this.stage.touchGoal.goal, { msPerBeat: this.msPerBeat, hand, fromBeat: this.stage.touchGoal.fromBeat, toBeat: this.stage.touchGoal.toBeat });
          report.touch = touch;
          if (touch.supported) { passed = passed && touch.passed; report.faults = [...report.faults, ...(touch.faults ?? [])]; }
        }
        if (this.stage.dynamicPlan) {
          const dyn = scoreDynamicContrast(ex, this.events, this.stage.dynamicPlan, { msPerBeat: this.msPerBeat, hand });
          report.dynamics = dyn;
          if (dyn.supported) { passed = passed && dyn.passed; report.faults = [...report.faults, ...(dyn.faults ?? [])]; }
          else { this.degraded = true; report.unsupported = dyn.why; }
        }
        break;
      }
      case 'play-notes':
        report = scoreSequence(ex, this.events.filter((e) => e.kind === 'on').map((e) => ({ midi: e.midi, at: e.at })), { hand });
        passed = report.passed;
        break;
      case 'play-together':
        report = scoreChords(this.stage.chords ?? ex.targets.map((t) => ({ midis: t.midis, label: t.written.join(' + ') })), this.events, {});
        passed = report.passed;
        break;
      case 'play-grid': {
        report = scoreVertical(ex, this.events, { msPerBeat: this.msPerBeat, onsetMs, checkDurations: false });
        passed = report.passed;
        if (this.stage.pedal) {
          const ped = scorePedal(ex, this.events, this.pedalLog, { msPerBeat: this.msPerBeat });
          report.pedal = ped;
          if (ped.supported) { passed = passed && ped.passed; report.faults = [...report.faults, ...(ped.faults ?? [])]; }
          else { this.degraded = true; report.unsupported = ped.why; }
        }
        if (this.stage.balance) {
          const bal = scoreBalance(ex, this.events, this.ctx.cal, { msPerBeat: this.msPerBeat });
          report.balance = bal;
          if (bal.supported) { passed = passed && bal.passed; report.faults = [...report.faults, ...(bal.faults ?? [])]; }
          else { this.degraded = true; report.unsupported = bal.why; }
        }
        break;
      }
      case 'play-passage': {
        if (!this.passageResult) { report = { why: 'No passage result was handed back.', faults: [{ kind: 'no-result', text: 'The practice surface reported nothing for this passage.' }] }; passed = false; measured = 'nothing'; break; }
        const graded = gradePassage(this.passageResult, { authored: this.stage.passage });
        report = { ...this.passageResult, grade: graded, faults: graded.faults };
        passed = graded.passed;
        measured = graded.basis === 'pitch-evidence'
          ? 'the notes of the passage, from the practice surface: every required note played, none wrong, none missed. Timing is not graded with the help on.'
          : 'the practice surface\'s own accuracy on the real passage, with the help off';
        break;
      }
      case 'self-check':
        report = { selfReport: this.selfReport, question: this.selfCheckQuestion, faults: [] };
        // ☠️ A SELF REPORT IS NOT A PASS. It is recorded as the learner's own
        // verdict and can never become competence, whatever they answered.
        // AND A SELF REPORT WITH NO ANSWER IS NOT A SELF REPORT: pressing Next
        // on a question you did not answer records nothing and advances
        // nothing (cold review finding 3).
        passed = this.selfReport ? null : false;
        measured = 'your own listening: nothing here is measured by the app';
        if (!this.selfReport) report.faults = [{ kind: 'no-answer', text: 'Answer the question to record your own verdict; nothing was recorded.' }];
        break;
      default:
        report = { why: 'unknown input kind: ' + this.input };
        passed = false;
    }

    const faults = report?.faults ?? [];
    // ☠️ WHAT WAS DECLARED BUT NOT MEASURED. A rung that asked for loud against
    // soft and got no velocity has not tested the thing it exists to test, so
    // it cannot pay independent credit for it (cold review finding 7).
    const unmeasured = [];
    for (const [name, res] of [['articulation', report?.touch], ['dynamics', report?.dynamics],
      ['balance', report?.balance], ['pedal', report?.pedal]]) {
      if (res && res.supported === false) unmeasured.push({ what: name, why: res.why ?? null });
    }
    for (const st of report?.staccato ?? []) if (st.supported === false && !unmeasured.some((u) => u.what === 'articulation')) unmeasured.push({ what: 'articulation', why: st.why ?? null });
    const outcome = passed === null ? 'self-report'
      : !passed ? 'not-yet'
      : this.assisted ? 'practice'
      : ({ recall: 'retained', transfer: 'transferred' }[this.stage.kind] ?? 'independent');
    this.finished = {
      cardId: this.card.id, skill: this.card.skill, stage: this.stage.kind, stageIndex: this.stageIndex, input: this.input,
      contentId: this.contentId, at: now, assisted: this.assisted, assistReasons: [...this.assistReasons],
      hintsUsed: this.hintsUsed, retries: this.retries, passed, outcomeClaim: outcome,
      report, faults, measured, degraded: this.degraded, unmeasured,
      support: this.support,
      recovery: recoveryFor(ex, faults),
      selfReport: this.selfReport,
      headline: headlineFor(this.card, this.stage, passed, outcome, faults),
      detail: faults.slice(0, 3).map((f) => f.text),
    };
    return this.finished;
  }

  // Bounded retry: the same rung again, retry count carried, nothing lost.
  retry() {
    if (this.retries >= MAX_RETRIES) return { ok: false, why: `That is ${MAX_RETRIES} goes. Take the guided rung again, or come back to this tomorrow.`, suggest: 'guided' };
    return { ok: true, session: new LabSession(this.card, this.stage, { ...this.ctx, stageIndex: this.stageIndex, retries: this.retries + 1 }) };
  }
}

// ☠️ EVERY DEGRADED RUNG ASKS A REAL QUESTION. When a measurement is not
// available the rung becomes an honest self assessment, and a self assessment
// with nothing to answer is a Next button wearing a lab coat. These are
// authored per requirement and per rung, they name the thing the app could not
// measure, and the learner's answer is the whole of what gets stored.
const SELF_CHECK_BANK = {
  'note-off': {
    prompt: 'This device does not report when you RELEASE a key, so the app cannot hear how your notes joined. Listen back: how did they come out?',
    options: [{ id: 'as-written', label: 'As written: joined where slurred, short where dotted' },
      { id: 'mixed', label: 'Mixed, some of each' },
      { id: 'not-yet', label: 'All the same length, no difference' }],
  },
  velocity: {
    prompt: 'This device does not report how HARD you pressed, so the app cannot measure loud against soft. Listen back: was there a clear difference?',
    options: [{ id: 'clear', label: 'Yes, a clear difference' },
      { id: 'slight', label: 'A slight one' },
      { id: 'none', label: 'No, everything came out the same' }],
  },
  'velocity-calibrated': {
    prompt: 'Balancing two hands compares different registers, which needs your touch calibrated first, so the app is not scoring this. Listen back: could you hear the melody above the accompaniment?',
    options: [{ id: 'clear', label: 'Yes, the melody led' },
      { id: 'sometimes', label: 'In places' },
      { id: 'buried', label: 'No, they were level or the left hand was on top' }],
  },
  pedal: {
    prompt: 'No sustain pedal is connected, so the app cannot see your pedal changes. Listen back (or play it without pedal): did the harmony stay clear?',
    options: [{ id: 'clean', label: 'Clean: each chord change was separate' },
      { id: 'some', label: 'One or two blurred together' },
      { id: 'muddy', label: 'Muddy throughout' }],
  },
};
// Per rung, so the question fits what that rung was actually asking for.
const SELF_CHECK_BY_STAGE = {
  worked: 'What did you notice in the demonstration?',
  guided: 'You had the scaffold on for that one. How did it go?',
  independent: 'That was the independent go, without the scaffold. How did it go?',
  recall: 'Coming back to it a day later, how did it go?',
  transfer: 'On new material now. How did it go?',
};
export function fallbackSelfCheck(card, stage, need) {
  const base = SELF_CHECK_BANK[need] ?? SELF_CHECK_BANK.velocity;
  return {
    prompt: `${SELF_CHECK_BY_STAGE[stage?.kind] ?? ''} ${base.prompt}`.trim(),
    options: base.options.map((o) => ({ ...o })),
    unmeasured: need,
    why: 'Your answer is stored as your own verdict. It is not evidence of playing and never becomes competence.',
  };
}

// What a RUNG measures beyond the notes, and therefore what it needs from the
// hardware. A card-level `requires` covers the whole card; these cover the
// individual rung, which is where nt-symbols' dynamics live.
export function stageRequires(stage) {
  if (!stage) return null;
  if (stage.balance) return 'velocity-calibrated';
  if (stage.dynamicPlan) return 'velocity';
  if (stage.pedal) return 'pedal';
  if (stage.touchGoal) return 'note-off';
  const dots = (stage.ex?.marks ?? []).some((m) => m.kind === 'articulation' && m.value === 'staccato');
  return dots ? 'note-off' : null;
}
const NEED_RANK = { 'note-off': 1, velocity: 2, pedal: 2, 'velocity-calibrated': 3 };

// What the card and the rung need from the hardware, and whether it is there.
export function supportFor(card, capabilities = {}, cal = null, stage = null) {
  const needs = [...new Set([card?.requires, stageRequires(stage)].filter(Boolean))];
  const met = (need) => need === 'note-off' ? capabilities.noteOff !== false
    : need === 'velocity' ? !!capabilities.velocity
    : need === 'velocity-calibrated' ? !!capabilities.velocity && !!cal?.zones
    : need === 'pedal' ? !!capabilities.pedal : true;
  // every requirement is checked; the one REPORTED is the hardest unmet one,
  // so "calibrate your touch" never hides "this device sends no velocity"
  const unmet = needs.filter((n) => !met(n)).sort((a, b) => (NEED_RANK[b] ?? 0) - (NEED_RANK[a] ?? 0));
  if (!needs.length) return { ok: true, need: null, needs, note: null };
  const need = unmet[0] ?? needs[0];
  return {
    ok: unmet.length === 0, need, needs, unmet, note: EXPRESSION_SUPPORT[need],
    why: unmet.length === 0 ? null : need === 'velocity-calibrated' && capabilities.velocity
      ? 'Your touch is not calibrated yet, so comparing the two hands would be a guess. Calibrate, or play this as a listening check.'
      : 'This input does not report ' + need.replace('-', ' ') + ', so this rung runs as a listening check instead.',
  };
}

// ---------------------------------------------------------------------------
// Grading a real passage. Two different questions, and the conditions decide
// which one is being asked.
//
//   HELP OFF  -> the practice surface's accuracy, at the threshold the rest of
//                the app uses: 85% with no wrong notes. Unchanged.
//   HELP ON   -> the NOTES. In wait mode the engine holds the music until the
//                right keys arrive, so timing is not the learner's to control
//                and accuracy tops out at 80. The question becomes: was every
//                required note played, with none wrong and none missed?
//
// ☠️ AND A GUIDED RUN CANNOT BE PASSED ON FAITH. Without pitch evidence in the
// payload the answer is "cannot tell", not "yes": a legacy or partial payload
// must never be able to manufacture a helped pass. It says exactly which field
// would settle it.
// ---------------------------------------------------------------------------
export const PASSAGE_INDEPENDENT_MIN_ACC = 85;
export function gradePassage(payload = {}, { authored = null } = {}) {
  const faults = [];
  const wrong = payload.stats?.wrong ?? payload.wrong ?? null;
  const missed = payload.stats?.missed ?? payload.missed ?? null;
  const guided = payload.assisted === true || payload.wait === true ||
    (Number.isFinite(payload.tempo) && payload.tempo < 100);

  // Identity, preserved and reported. The integrator enforces attribution; the
  // model refuses only a payload that openly names a different passage.
  const identity = { supplied: null, authored: null, matches: null };
  if (authored) {
    identity.authored = { songId: authored.songId, section: authored.section, startBeat: authored.startBeat, endBeat: authored.endBeat };
    const named = ['songId', 'section', 'startBeat', 'endBeat'].filter((k) => payload[k] != null);
    if (named.length) {
      identity.supplied = Object.fromEntries(named.map((k) => [k, payload[k]]));
      identity.matches = named.every((k) => payload[k] === authored[k]);
      if (!identity.matches) faults.push({ kind: 'wrong-passage', text: `That result is from ${payload.songId ?? 'another song'}${payload.section ? ', ' + payload.section : ''}, not ${authored.songId}, ${authored.section}.` });
    }
  }

  if (!guided) {
    const acc = Number.isFinite(payload.acc) ? payload.acc : null;
    if (acc == null) faults.push({ kind: 'no-accuracy', text: 'The practice surface reported no accuracy for this run.' });
    else if (acc < PASSAGE_INDEPENDENT_MIN_ACC) faults.push({ kind: 'below-threshold', text: `${Math.round(acc)}% with the help off; this check wants ${PASSAGE_INDEPENDENT_MIN_ACC}%.` });
    if ((wrong ?? 0) > 0) faults.push({ kind: 'wrong-notes', text: `${wrong} wrong note${wrong === 1 ? '' : 's'}.` });
    return { passed: faults.length === 0, guided, basis: 'accuracy', assisted: false, acc, faults, identity };
  }

  // guided: pitch evidence, and only pitch evidence
  const stats = payload.stats ?? null;
  const sounded = stats ? (stats.perfect ?? 0) + (stats.good ?? 0) + (stats.late ?? 0) : null;
  const required = Number.isFinite(payload.required) ? payload.required : null;
  const played = Number.isFinite(payload.played) ? payload.played : sounded;
  const haveProof = (wrong != null && missed != null) && (required != null || sounded != null);
  if (!haveProof) {
    faults.push({ kind: 'no-pitch-evidence',
      text: 'The help was on, so accuracy cannot grade this run, and the note counts needed to grade it were not reported. Send stats plus required and played, or play it again with the help off.' });
    return { passed: false, guided, basis: 'pitch-evidence', assisted: true, faults, identity,
      needs: ['stats', 'required', 'played'] };
  }
  if (wrong > 0) faults.push({ kind: 'wrong-notes', text: `${wrong} wrong note${wrong === 1 ? '' : 's'} in the passage.` });
  if (missed > 0) faults.push({ kind: 'missed-notes', text: `${missed} note${missed === 1 ? '' : 's'} went past unplayed.` });
  if (required != null && played != null && played < required) faults.push({ kind: 'incomplete', text: `${played} of ${required} notes played: the passage was not finished.` });
  if ((required ?? played ?? 0) <= 0) faults.push({ kind: 'empty', text: 'No notes were played in the passage.' });
  return {
    passed: faults.length === 0, guided, basis: 'pitch-evidence', assisted: true,
    proof: { required, played, wrong, missed }, faults, identity,
    // a guided run is worth practice credit, whatever else was true of it
    ceiling: 'practice',
  };
}

// ☠️ NO RESTART ON ERROR. After a fault the rung offers the smallest span that
// contains it, so the repair is practised deliberately instead of the whole
// thing being played again from the top and the error being rehearsed.
export function recoveryFor(ex, faults) {
  if (!ex || !faults?.length) return null;
  const located = faults.filter((f) => Number.isFinite(f.bar));
  if (!located.length) return null;
  const counts = new Map();
  for (const f of located) counts.set(f.bar, (counts.get(f.bar) ?? 0) + 1);
  const bar = [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  return {
    bar, startBeat: bar * ex.barLength, endBeat: Math.min((bar + 1) * ex.barLength, ex.bars * ex.barLength),
    label: `Bar ${bar + 1}`, faults: located.filter((f) => f.bar === bar).map((f) => f.text),
    say: 'Play just this bar, slowly, until it is right. Then run the rung again.',
  };
}

function headlineFor(card, stage, passed, outcome, faults) {
  if (passed === null) return 'Noted. Your own verdict, kept as your own verdict.';
  if (!passed) {
    const kinds = new Set(faults.map((f) => f.kind.split('-')[0]));
    if (kinds.has('rest')) return 'The rests need to be silent. Everything else can wait.';
    if (kinds.has('duration')) return 'Right notes, wrong lengths. The lengths are the lesson here.';
    if (kinds.has('hands')) return 'The hands did not land together.';
    if (kinds.has('onset')) return 'Not quite in time yet.';
    if (kinds.has('wrong')) return 'A few wrong notes. Nothing is lost.';
    return 'Not yet.';
  }
  return {
    practice: 'Done, with help. That is practice credit.',
    independent: 'Clean, on your own.',
    retained: 'Still there a day later.',
    transferred: 'You took it somewhere new.',
  }[outcome] ?? 'Done.';
}

// ---------------------------------------------------------------------------
// 11. Progress and rewards. The lab keeps its OWN ledger under st.lab and
// leaves teacher.mjs's five skills, the playable ledger and the journey state
// exactly where they are. It reuses their vocabulary (recordAttempt,
// competence) and game.mjs's XP ledger, so there is one currency and one way
// of saying how well something is known.
// ---------------------------------------------------------------------------
export const LAB_DAILY_XP_EVENTS = 4;   // a soft cap: farming easy rungs stops paying
// XP SOURCES ARE THE EXISTING ONES. No second currency, and every ref is
// stable, so game.mjs's own once-only ledger does the deduping for us.
export const LAB_XP = {
  independent: { src: 'lessonCleared', ref: (r) => `lab:${r.cardId}` },
  retained: { src: 'passageRetention', ref: (r, day) => `lab:${r.cardId}:${day}` },
  transferred: { src: 'transfer', ref: (r) => `lab:${r.cardId}` },
};

// ☠️ MIGRATION FABRICATES NOTHING. A state with no lab has no lab evidence;
// missing evidence stays unknown and is never back-filled from anything.
export function migrateLab(st) {
  const lab = (st.lab ??= { v: LAB_VERSION, cards: {}, skills: {}, days: {}, clock: { lastNow: 0, suspect: false }, route: {} });
  lab.cards ??= {}; lab.skills ??= {}; lab.days ??= {}; lab.route ??= {};
  lab.clock ??= { lastNow: 0, suspect: false };
  if (lab.v == null) lab.v = LAB_VERSION;
  if (lab.v !== LAB_VERSION) { lab.legacyVersion ??= lab.v; lab.v = LAB_VERSION; }
  // Cards that no longer exist keep their history; they are simply not offered.
  for (const [id, rec] of Object.entries(lab.cards)) if (!CARD_BY_ID[id]) rec.retired = true;
  return lab;
}

// The clock guard. A real calendar is the only thing a local device can offer,
// and it cannot prove server time: all this does is refuse DELAY-BASED credit
// while the clock sits behind a moment this app has already seen. Nothing
// already earned is ever touched.
// TRAP: suspicion used to be permanent, so a single rollback could ban
// retention for good on a device whose clock was later corrected (supervisor
// finding, 2026-09-13). The guard now defers only until the clock passes the
// high-water mark it was last trusted at, then clears itself and says so.
export const CLOCK_TOLERANCE_MS = 60000;
function clockCheck(lab, now) {
  const c = lab.clock;
  const highWater = c.lastNow ?? 0;
  const behind = now + CLOCK_TOLERANCE_MS < highWater;
  let recovered = false;
  if (behind) {
    c.suspect = true;
    c.suspectUntil = Math.max(c.suspectUntil ?? 0, highWater);
    c.suspectSince ??= now;
  } else if (c.suspect && now >= (c.suspectUntil ?? 0)) {
    c.suspect = false;
    c.recoveredAt = now;
    c.rollbacks = (c.rollbacks ?? 0) + 1;   // the history is kept, the block is not
    delete c.suspectSince;
    recovered = true;
  }
  c.lastNow = Math.max(highWater, now);
  return {
    behind, recovered, suspect: !!c.suspect, until: c.suspectUntil ?? 0, highWater: c.lastNow,
    note: c.suspect
      ? `The device clock is behind a time this app has already seen, so a day cannot be proven yet. Later-day checks count again once it passes ${evidenceDate(c.suspectUntil ?? 0)}, and nothing you have earned is affected.`
      : recovered ? 'The clock has caught up, so later-day checks count again.' : null,
  };
}
// What a screen can say about the clock, without accusing anybody.
export function clockStatus(st) {
  const c = st?.lab?.clock;
  if (!c) return { suspect: false, note: null };
  return {
    suspect: !!c.suspect, until: c.suspectUntil ?? 0, rollbacks: c.rollbacks ?? 0,
    note: c.suspect
      ? `Later-day checks are paused until this device clock passes ${evidenceDate(c.suspectUntil ?? 0)}. Everything already earned is untouched.`
      : null,
  };
}

export function startCard(st, cardId, opts = {}) {
  const card = cardById(cardId);
  if (!card) return null;
  const lab = migrateLab(st);
  const now = opts.now ?? Date.now();
  const kind = opts.stage ?? nextStageKind(st, cardId, now);
  const index = opts.stageIndex ?? nextStageIndex(st, cardId, kind);
  const stage = stageOf(card, kind, index);
  if (!stage) return null;
  const rec = lab.cards[cardId];
  return new LabSession(card, stage, {
    now, capabilities: opts.capabilities ?? {}, cal: opts.cal ?? null,
    resolvedApplied: opts.resolvedApplied ?? null,
    taken: rec?.seenContent ?? [],
    stageIndex: index, retries: 0,
  });
}

// Which rung is next: unfinished rungs in order, a due recall jumps the queue.
// ☠️ A KIND CAN HAVE MORE THAN ONE RUNG. The grand-staff card has two guided
// rungs (right hand alone, then left hand alone), and treating "guided" as one
// thing skipped the second one entirely.
export function stageCount(cardId, kind) {
  return (cardById(cardId)?.stages ?? []).filter((s) => s.kind === kind).length;
}
// Indices of the rungs of this kind that are SETTLED: a qualified pass, a
// watched demonstration, or, on a card this device cannot measure, an honest
// self report. A physical pass that qualified for nothing is not settled.
export function passedIndices(st, cardId, kind) {
  const slot = st?.lab?.cards?.[cardId]?.stages?.[kind];
  if (!slot) return [];
  const settled = slot.passedAt || slot.at || slot.selfReportedAt;
  return slot.indices ?? (settled ? [0] : []);
}
// ☠️ CAN THIS RUNG STILL BE EARNED AT ALL? A transfer rung whose whole pool of
// authored material has been met can never again be a transfer, because
// transfer means material you have not met. Saying so is the honest answer;
// pointing the learner at it for ever is not.
export function transferPool(st, cardId) {
  const stage = cardById(cardId)?.stages.find((s) => s.kind === 'transfer');
  if (!stage) return null;
  const taken = st?.lab?.cards?.[cardId]?.seenContent ?? [];
  if (stage.variant) return { kind: 'generated', size: POSITION_STARTS_L.length, exhausted: false, remaining: null };
  if (stage.input === 'self-check') return { kind: 'self-assessed', size: 0, exhausted: false, remaining: 0,
    note: 'This rung is a listening check by design: it records your own verdict and never claims competence.' };
  const pool = [stage.ex, ...(stage.alts ?? [])].filter(Boolean).map((e) => e.contentId);
  const passageId = stage.passage ? 'passage' : null;
  const used = pool.filter((id) => taken.includes(id)).length + (passageId && taken.some((t) => t.length) && stage.passage && (st?.lab?.cards?.[cardId]?.stages?.transfer?.passedAt) ? 0 : 0);
  const remaining = pool.length - used;
  return { kind: 'authored', size: pool.length, used, remaining, exhausted: remaining <= 0 };
}
export function transferEarnable(st, cardId) {
  const stage = cardById(cardId)?.stages.find((s) => s.kind === 'transfer');
  if (!stage) return false;
  if (rungEarned(st, cardId, 'transfer')) return false;        // already earned
  if (stage.input === 'self-check') return false;              // subjective by design
  const pool = transferPool(st, cardId);
  return !pool?.exhausted;
}

// EARNED, which is a stricter question than settled: what this rung can claim.
export function rungEarned(st, cardId, kind) {
  const slot = st?.lab?.cards?.[cardId]?.stages?.[kind];
  if (!slot) return false;
  return kind === 'worked' ? !!(slot.at || slot.passedAt) : !!slot.passedAt;
}
export function nextStageIndex(st, cardId, kind) {
  const done = passedIndices(st, cardId, kind);
  for (let i = 0; i < stageCount(cardId, kind); i++) if (!done.includes(i)) return i;
  return 0;
}
const kindComplete = (st, cardId, kind) => passedIndices(st, cardId, kind).length >= stageCount(cardId, kind);

export function nextStageKind(st, cardId, now = Date.now()) {
  const rec = st?.lab?.cards?.[cardId];
  const done = rec?.stages ?? {};
  const settled = (k) => !!(done[k]?.passedAt || done[k]?.selfReportedAt);
  if (!kindComplete(st, cardId, 'worked')) return 'worked';
  if (!kindComplete(st, cardId, 'guided')) return 'guided';
  if (!settled('independent')) return 'independent';
  if (stageAvailable(st, cardId, 'recall', now).ok && !settled('recall')) return 'recall';
  // A transfer with nothing new left to deal is not offered as the next thing.
  // A transfer that is unearnable BY DESIGN (a listening self assessment) still
  // is: it has a question to answer, and skipping it would strand the last
  // rung of every expression card.
  if (!settled('transfer') && !transferPool(st, cardId)?.exhausted) return 'transfer';
  if (stageAvailable(st, cardId, 'recall', now).ok) return 'recall';   // retention is re-tested, never assumed
  return 'independent';
}

// Record one finished attempt. Returns exactly what happened and, when a claim
// was refused, why. Pure apart from mutating `st`.
export function recordLabResult(st, result, opts = {}) {
  const lab = migrateLab(st);
  const now = opts.now ?? result.at ?? Date.now();
  const day = opts.day ?? evidenceDate(now);
  const card = cardById(result.cardId);
  if (!card) return { outcome: 'unknown-card', xp: [], refused: ['That card is not in this build.'] };
  const clock = clockCheck(lab, now);
  const rec = (lab.cards[result.cardId] ??= { evidence: [], selfChecks: [], stages: {}, seenContent: [], attempts: 0, recoveries: 0 });
  rec.attempts++;
  rec.lastAt = now;
  const refused = [];

  // self reports are kept, and kept apart
  if (result.outcomeClaim === 'self-report') {
    // ☠️ NO ANSWER, NO RECORD, NO MILESTONE. An unanswered question advances
    // nothing: it is not a verdict, so it cannot stand in for one.
    if (!result.selfReport?.answer) {
      rec.attemptsWithoutAnswer = (rec.attemptsWithoutAnswer ?? 0) + 1;
      return { outcome: 'not-yet', xp: [], blocks: 0,
        refused: [...refused, 'No answer was given, so nothing was recorded and the rung is unchanged.'],
        note: 'Answer the question to record your own verdict.' };
    }
    rec.selfChecks.push({ t: now, stage: result.stage, ...(result.selfReport ?? {}) });
    if (rec.selfChecks.length > 40) rec.selfChecks.shift();
    // A SELF REPORT MOVES THE CARD ALONG WITHOUT CLAIMING ANYTHING. It is
    // stored under its own key, so the rung is never "done" and never earns
    // competence, but a card this device cannot measure must not be a dead end
    // that offers the same rung forever.
    const priorSelf = rec.stages[result.stage];
    rec.stages[result.stage] = {
      ...(priorSelf ?? {}), selfReportedAt: now, date: day, unsupported: true,
      indices: [...new Set([...(priorSelf?.indices ?? []), result.stageIndex ?? 0])],
    };
    // ☠️ A LISTENING VERDICT IS NOT A PERFORMED PRACTICE BLOCK. game.mjs's
    // isPerformedBlock excludes the kind 'listening' and nothing else, so
    // 'lab-listening' counted radio buttons as practice in the evidence
    // cabinet and the seven-day practice line (cold review finding 4).
    recordBlock(st, 'listening', `${result.cardId}|${result.stage}|self-check`, now);
    return { outcome: 'self-report', xp: [], blocks: 1, refused,
      note: 'Recorded as your own listening verdict. It moves you on; it is not evidence of playing and never becomes competence.' };
  }
  // a demonstration rung is progress through the card, never evidence
  if (result.input === 'listen') {
    const priorWorked = rec.stages.worked;
    rec.stages.worked = { at: now, date: day, indices: [...new Set([...(priorWorked?.indices ?? []), result.stageIndex ?? 0])] };
    recordBlock(st, 'listening', `${result.cardId}|worked`, now);
    return { outcome: 'introduced', xp: [], blocks: 1, refused };
  }

  let outcome = result.outcomeClaim;
  // ☠️ A RUNG THAT COULD NOT MEASURE ITS OWN SUBJECT EARNS PRACTICE, NOT
  // INDEPENDENCE. "One bar loud, one bar soft" on a device with no velocity is
  // a rhythm read, not a dynamics pass, and the sentence says which.
  if (result.passed === true && result.unmeasured?.length && outcome !== 'practice') {
    const what = result.unmeasured.map((u) => u.what).join(' and ');
    outcome = 'practice';
    refused.push(`The ${what} this rung asks for could not be measured on this device, so it counts as practice, not independent evidence.`);
  }
  const novelContent = !rec.seenContent.includes(result.contentId);
  if (outcome === 'transferred' && !novelContent) { outcome = 'independent'; refused.push('This is material you have already played here, so it is an independent pass, not a transfer.'); }
  if (outcome === 'retained') {
    const ind = rec.stages.independent;
    if (!ind?.passedAt) { outcome = 'independent'; refused.push('No independent pass to remember: recorded as an independent pass instead.'); }
    else if (now - ind.passedAt < RETENTION_MIN_DELAY || day === ind.date) { outcome = 'independent'; refused.push(`Retention needs a later day. Your independent pass was ${ind.date}.`); }
    // ☠️ CHANGED CONTENT MEANS "NOT THE INDEPENDENT RUNG'S OWN EXERCISE". It
    // is compared against the AUTHORED independent exercise, not against
    // whatever content happened to fill the independent slot: when that slot
    // was filled via an early recall attempt, comparing to it made the real
    // recall a day later permanently impossible.
    else if (result.contentId && result.contentId === independentContentId(card, ind)) {
      outcome = 'independent';
      refused.push('Recall re-used the independent rung\'s own exercise, so it checks repetition rather than memory.');
    }
    else if (clock.behind || clock.suspect) { outcome = 'independent'; refused.push(clock.note ?? 'The device clock moved backwards, so a delay cannot be proven. The pass still counts.'); }
  }
  if (result.passed === false) outcome = 'not-yet';

  // teacher.mjs's own evidence shape and rules, on the lab's own ledger
  recordAttempt(lab.skills, card.skill, {
    passed: result.passed === true, assisted: !!result.assisted,
    novel: outcome === 'transferred', now, note: `${card.id}/${result.stage}`,
  });
  rec.evidence.push({
    t: now, date: day, stage: result.stage, contentId: result.contentId,
    passed: result.passed === true, assisted: !!result.assisted,
    novel: outcome === 'transferred', outcome, hintsUsed: result.hintsUsed ?? 0,
    scope: card.skill,
  });
  if (rec.evidence.length > 60) rec.evidence.shift();
  if (result.contentId && novelContent) { rec.seenContent.push(result.contentId); if (rec.seenContent.length > 40) rec.seenContent.shift(); }

  const blocks = [];
  if (result.passed === true) {
    // ☠️ THE RUNG IS MARKED BY WHAT THE ATTEMPT ACTUALLY EARNED, NOT BY WHICH
    // RUNG WAS OPENED. Writing passedAt on the played rung meant a recall
    // attempt downgraded to "independent" (no prior independent pass to
    // remember) still lit the recall rung as done, and an assisted transfer
    // lit the transfer rung. The label said one thing and the stored
    // progression said another (supervisor repro, 2026-09-13). One function
    // decides, and progress, due dates, summaries and badges all read it.
    const slot = qualifiedSlot(result.stage, outcome);
    const prior = slot ? rec.stages[slot] : null;
    if (slot) {
      const sameRung = slot === result.stage;
      const indices = sameRung
        ? [...new Set([...(prior?.indices ?? []), result.stageIndex ?? 0])]
        : (prior?.indices ?? [0]);
      rec.stages[slot] = {
        passedAt: now, date: day, contentId: result.contentId, assisted: !!result.assisted,
        outcome, count: (prior?.count ?? 0) + 1, indices,
        ...(sameRung ? {} : { via: result.stage }),
      };
    }
    if (slot !== result.stage) {
      // the attempt still happened: it is practice on that rung, recorded and
      // visible, and it never fills the rung it did not earn
      const p = ((rec.practice ??= {})[result.stage] ??= { attempts: 0 });
      p.attempts++; p.lastAt = now; p.date = day; p.lastOutcome = outcome;
      refused.push(result.assisted
        ? `That pass used help, so it is practice on the ${result.stage} rung, not ${result.stage} evidence.`
        : `Recorded as ${outcome}. The ${result.stage} rung is still open.`);
    }
    blocks.push(recordBlock(st, 'lab', `${card.id}|${result.stage}|${outcome}`, now));
  } else {
    const p = ((rec.practice ??= {})[result.stage] ??= { attempts: 0 });
    p.attempts++; p.lastAt = now; p.date = day; p.lastOutcome = 'not-yet';
    blocks.push(recordBlock(st, 'lab-attempt', `${card.id}|${result.stage}`, now));
  }

  // XP: existing sources, stable refs, once by ref, plus a daily event cap so
  // replaying easy rungs stops paying while still earning practice credit.
  const dayRec = (lab.days[day] ??= { xpEvents: 0, blocks: 0 });
  dayRec.blocks++;
  const xp = [];
  const rule = LAB_XP[outcome];
  const eligible = result.passed === true && !result.assisted && rule;
  if (eligible && dayRec.xpEvents >= LAB_DAILY_XP_EVENTS) refused.push('That is today\'s reward cap for lab work. The practice still counts.');
  else if (eligible) {
    const entry = grantXp(st, rule.src, rule.ref(result, day), now);
    if (entry) { xp.push(entry); dayRec.xpEvents++; }
  }
  return { outcome, xp, blocks: blocks.length, refused, competence: competenceLine(rec.evidence), day };
}

// A repair attempt on the bar a fault landed in. Useful recovery earns
// practice credit, never a competence claim: fixing one bar is not a pass.
export function recordRecovery(st, cardId, { fixed, now = Date.now() }) {
  const lab = migrateLab(st);
  const rec = (lab.cards[cardId] ??= { evidence: [], selfChecks: [], stages: {}, seenContent: [], attempts: 0, recoveries: 0 });
  if (!fixed) return { credited: false, note: 'Not yet. The bar is still the bar.' };
  rec.recoveries++;
  recordBlock(st, 'lab-recovery', cardId, now);
  return { credited: true, recoveries: rec.recoveries, note: 'Repair banked. Run the rung again when you are ready.' };
}

export function labProgress(st, cardId) {
  const card = cardById(cardId);
  const rec = st?.lab?.cards?.[cardId];
  if (!card) return null;
  const stages = rec?.stages ?? {};
  const evidence = rec?.evidence ?? [];
  return {
    cardId, title: card.title, track: card.track, skill: card.skill,
    measures: card.measures,
    rungs: ['worked', 'guided', 'independent', 'recall', 'transfer'].map((kind) => ({
      kind,
      // `done` means EARNED. A helped pass, a recall with no proven delay
      // behind it and a repeated transfer all leave their rung open, and the
      // row says which of those happened.
      done: rungEarned(st, cardId, kind),
      selfReported: !!stages[kind]?.selfReportedAt,
      practiced: (rec?.practice?.[kind]?.attempts ?? 0) > 0,
      at: stages[kind]?.passedAt ?? stages[kind]?.at ?? stages[kind]?.selfReportedAt ?? null,
      date: stages[kind]?.date ?? null,
      assisted: stages[kind]?.assisted ?? null,
      via: stages[kind]?.via ?? null,
      outcome: stages[kind]?.outcome ?? (stages[kind]?.selfReportedAt ? 'self-report' : null),
      ...(kind === 'transfer' ? { pool: transferPool(st, cardId), earnable: transferEarnable(st, cardId) } : {}),
    })),
    competence: competence(evidence),
    line: competenceLine(evidence),
    attempts: rec?.attempts ?? 0, recoveries: rec?.recoveries ?? 0,
    selfChecks: (rec?.selfChecks ?? []).length,
    next: nextStageKind(st, cardId),
  };
}

export function labSummary(st, now = Date.now()) {
  const cards = LAB_CARDS.map((c) => labProgress(st, c.id));
  const count = (kind) => cards.filter((p) => p.rungs.find((r) => r.kind === kind)?.done).length;
  const selfReported = cards.filter((p) => p.rungs.some((r) => r.selfReported)).length;
  return {
    cards: cards.length,
    started: cards.filter((p) => p.attempts > 0).length,
    independent: count('independent'), retained: count('recall'), transferred: count('transfer'),
    selfReported,
    // rungs attempted and passed that qualified for nothing (helped, or a
    // delay that could not be proven). Practice, counted as practice.
    practiceOnly: cards.reduce((a, p) => a + p.rungs.filter((r) => r.practiced && !r.done).length, 0),
    byTrack: TRACKS.map((t) => ({ ...t, done: cards.filter((p) => p.track === t.id && p.rungs.find((r) => r.kind === 'independent')?.done).length, of: cards.filter((p) => p.track === t.id).length })),
    dueRecall: cards.filter((p) => stageAvailable(st, p.cardId, 'recall', now).ok && !p.rungs.find((r) => r.kind === 'recall')?.done).map((p) => p.cardId),
    // ☠️ never a percentage of "mastery": these are counts of things that happened
    note: 'Counts of rungs actually passed. Nothing here is a score out of anything.',
  };
}

// Evidence-cabinet rows in game.mjs's own badge shape, so the integrator can
// append them to the existing cabinet instead of building a second one.
export function labBadges(st) {
  const out = [];
  for (const card of LAB_CARDS) {
    const p = labProgress(st, card.id);
    if (!p?.competence) continue;
    out.push({
      id: 'lab:' + card.id, word: card.title + ' · ' + p.competence.word,
      shape: p.competence.word === 'with help' ? '◑' : p.competence.word === 'alone' ? '●' : '★',
      evidence: { at: p.competence.at, line: p.line, measures: card.measures },
    });
  }
  const transferred = out.length && LAB_CARDS.filter((c) => labProgress(st, c.id)?.rungs.find((r) => r.kind === 'transfer')?.done).length;
  if (transferred >= 3) out.push({ id: 'lab:transfers', word: transferred + ' skills taken to new material', shape: '▮', evidence: { count: transferred } });
  return out;
}

// A restrained celebration. No overlay, no sound, nothing during playing: one
// line and one optional mark, and it honours reduced motion by never needing
// motion in the first place.
export function celebrationFor(record) {
  if (!record || record.outcome === 'not-yet' || record.outcome === 'self-report') return null;
  const map = {
    independent: { tone: 'mark', line: 'On your own.', mark: '●' },
    retained: { tone: 'mark', line: 'Still there, a day later.', mark: '★' },
    transferred: { tone: 'mark', line: 'Carried to new material.', mark: '★' },
    practice: { tone: 'quiet', line: 'Practice banked.', mark: null },
    introduced: { tone: 'quiet', line: null, mark: null },
  };
  const c = map[record.outcome] ?? { tone: 'quiet', line: null, mark: null };
  return { ...c, xp: record.xp?.[0]?.xp ?? 0, duringPlay: false, reducedMotionSafe: true, announce: c.line };
}

// ---------------------------------------------------------------------------
// 12. The daily route. A SUGGESTION. It is configurable, reorderable and every
// segment is skippable with no penalty of any kind, because a compulsory daily
// quota is the thing that makes people quit.
// ---------------------------------------------------------------------------
export const ROUTE_DEFAULT = [
  // ☠️ NOT "reading only improves on music you have not memorised". Reading
  // familiar music is useful practice too; what unfamiliar material adds is a
  // test of reading INDEPENDENTLY, which memory can otherwise stand in for.
  { id: 'reading', label: 'Something fresh to read', minutes: 5, why: 'Reading familiar music is useful; new material is what tests whether you are reading independently.' },
  { id: 'skill', label: 'One connected skill', minutes: 5, why: 'A rhythm, a symbol or a chord, small enough to finish.' },
  { id: 'passage', label: 'Passage work', minutes: 15, why: 'The piece you are actually learning.' },
  { id: 'fun', label: 'Something you enjoy', minutes: 5, why: 'Playing for the pleasure of it is not a reward for the rest. It is the point.' },
];
export const ROUTE_NOTE = 'These lengths are a starting suggestion, not a prescription, and nobody has shown they are optimal. Reorder them, shorten them, or skip any of them: none of that costs you anything.';

export function configureRoute(st, { order, minutes } = {}) {
  const lab = migrateLab(st);
  const route = (lab.route ??= {});
  if (order) route.order = order.filter((id) => ROUTE_DEFAULT.some((s) => s.id === id));
  if (minutes) route.minutes = { ...(route.minutes ?? {}), ...minutes };
  return route;
}
export function skipSegment(st, id, day = evidenceDate(Date.now())) {
  const lab = migrateLab(st);
  const skipped = ((lab.route.skipped ??= {})[day] ??= []);
  if (!skipped.includes(id)) skipped.push(id);
  return { skipped: [...skipped], penalty: null, note: 'Skipped. Nothing lost.' };
}

// The easiest unfinished reading rung, ALWAYS reachable: a hard piece
// dominating the practice history must never bury a five-minute read.
const settledRung = (st, cardId, kind) => {
  const slot = st?.lab?.cards?.[cardId]?.stages?.[kind];
  return !!(slot?.passedAt || slot?.selfReportedAt);
};
export function easyReadingNext(st, now = Date.now()) {
  const order = ['rhythm', 'reading'];
  const candidates = LAB_CARDS.filter((c) => order.includes(c.track));
  const due = candidates.find((c) => stageAvailable(st, c.id, 'recall', now).ok && !settledRung(st, c.id, 'recall'));
  if (due) return { cardId: due.id, stage: 'recall', why: 'A short recall check that is due.' };
  const unfinished = candidates.find((c) => !settledRung(st, c.id, 'independent'));
  if (unfinished) return { cardId: unfinished.id, stage: nextStageKind(st, unfinished.id, now), why: 'The next rung of the reading ladder.' };
  const transfer = candidates.find((c) => !settledRung(st, c.id, 'transfer'));
  if (transfer) return { cardId: transfer.id, stage: 'transfer', why: 'Take one of these to new material.' };
  return { cardId: candidates[0].id, stage: 'recall', why: 'Keep one reading skill warm.' };
}

export function nextLabCard(st, now = Date.now(), { track = null } = {}) {
  const pool = LAB_CARDS.filter((c) => !track || c.track === track);
  const dueRecall = pool.find((c) => stageAvailable(st, c.id, 'recall', now).ok && !settledRung(st, c.id, 'recall'));
  if (dueRecall) return { cardId: dueRecall.id, stage: 'recall', why: 'Due: a check that it stuck.' };
  const started = pool.find((c) => st?.lab?.cards?.[c.id]?.attempts && !settledRung(st, c.id, 'transfer'));
  if (started) return { cardId: started.id, stage: nextStageKind(st, started.id, now), why: 'You are part-way through this one.' };
  const fresh = pool.find((c) => !st?.lab?.cards?.[c.id]?.attempts);
  if (fresh) return { cardId: fresh.id, stage: 'worked', why: 'Next in the ladder.' };
  return null;
}

// prescription: whatever teacher.prescribe() returned, passed straight through
// so the lab never becomes a second "do this next" voice.
export function dailyRoute(st, opts = {}) {
  const now = opts.now ?? Date.now();
  const day = opts.day ?? evidenceDate(now);
  const lab = migrateLab(st);
  const minutes = lab.route.minutes ?? {};
  const order = lab.route.order ?? ROUTE_DEFAULT.map((s) => s.id);
  const skipped = lab.route.skipped?.[day] ?? [];
  const blocksToday = (st.blocks ?? []).filter((b) => b.t >= Date.parse(day + 'T00:00:00') && String(b.kind).startsWith('lab'));
  const segments = order.map((id) => {
    const base = ROUTE_DEFAULT.find((s) => s.id === id);
    const suggestion = id === 'reading' ? easyReadingNext(st, now)
      : id === 'skill' ? nextLabCard(st, now, { track: opts.skillTrack ?? null })
      // ☠️ the existing prescription is PASSED THROUGH WHOLE, never merged or
      // rewritten: teacher.prescribe() stays the one "do this next" voice
      : id === 'passage' ? (opts.prescription ? { kind: 'prescription', from: 'teacher', prescription: opts.prescription } : null)
      : { kind: 'free', why: 'Anything you like: a proven song, free play, the improv loops.' };
    return {
      ...base, minutes: minutes[id] ?? base.minutes,
      optional: true, skipped: skipped.includes(id),
      done: id === 'reading' || id === 'skill' ? blocksToday.some((b) => String(b.ref ?? '').includes(suggestion?.cardId ?? ' ')) : false,
      suggestion,
    };
  });
  return {
    day, segments, configurable: true, note: ROUTE_NOTE,
    totalMinutes: segments.filter((s) => !s.skipped).reduce((a, s) => a + s.minutes, 0),
    shortVersion: 'No time? The reading segment alone is a real session.',
  };
}

// Concise labels in the app's existing voice: lower case after the first word,
// no exclamation marks, no second currency, never a percentage of mastery.
export function labLabel(progress) {
  if (!progress) return 'Not started';
  if (!progress.attempts) return 'Not started';
  const done = progress.rungs.filter((r) => r.done).length;
  return progress.competence ? `${progress.competence.word} · ${progress.competence.date}` : `${done} of 5 rungs`;
}
export function labNextLine(st, now = Date.now()) {
  const n = nextLabCard(st, now);
  if (!n) return null;
  const card = cardById(n.cardId);
  const stage = { worked: 'Watch it', guided: 'Try it with help', independent: 'On your own', recall: 'Check it stuck', transfer: 'Somewhere new' }[n.stage];
  return { cardId: n.cardId, line: `${card.title} · ${stage}`, why: n.why };
}

// Human names, used in every fault line so the feedback reads like a teacher.
export function valueName(q) {
  return { 4: 'whole note', 3: 'dotted half', 2: 'half note', 1.5: 'dotted quarter', 1: 'quarter note', 0.75: 'dotted eighth', 0.5: 'eighth note', 0.25: 'sixteenth' }[q]
    ?? (Math.abs(q - 1 / 3) < 1e-6 ? 'triplet eighth' : `${q}-beat note`);
}
export function beatLabel(at, ex) {
  const perBar = ex.barLength;
  const bar = Math.floor(at / perBar + 1e-9);
  const beat = at - bar * perBar;
  const unit = ex.meter[1] === 8 ? 2 : 1;         // 6/8 counts in eighths
  return `${(beat * unit + 1).toFixed(beat * unit % 1 ? 1 : 0)} of bar ${bar + 1}`;
}

// The supplemental symbol spec. Every field is something the integrator feeds
// straight to VexFlow; the vocabulary is deliberately the SAME vocabulary
// engraving.mjs already uses, so one renderer can serve both.
export function renderSpec({ id, key, meter, bars, voices, marks, bpm, countIn, name }) {
  const hands = Object.keys(voices);
  const out = {
    id, kind: hands.length > 1 ? 'grand-staff' : voices.R ? 'treble-staff' : 'bass-staff',
    keySignature: key, meter, bars, title: name,
    // In 6/8 the beat is the DOTTED quarter, not the quarter: printing ♩ = 60
    // over a compound bar teaches the wrong beat unit before a note is played.
    tempoText: meter[1] === 8 && meter[0] % 3 === 0 ? `♩. = ${Math.round(bpm / 1.5)}` : `♩ = ${bpm}`,
    beatUnitName: meter[1] === 8 && meter[0] % 3 === 0 ? 'dotted quarter' : 'quarter',
    countInBeats: countIn,
    staves: hands.map((hand) => ({
      hand, clef: hand === 'R' ? 'treble' : 'bass',
      bars: Array.from({ length: bars }, (_, b) => ({
        index: b,
        cells: voices[hand].cells.filter((c) => c.bar === b).map((c) => ({
          duration: c.duration, dots: c.dots, rest: c.rest, at: c.at,
          keys: c.rest ? [hand === 'R' ? 'b/4' : 'd/3'] : c.written.map((w) => vexKeyOf(w).key),
          accidentals: c.rest ? [] : c.written.map((w) => vexKeyOf(w).accidental),
          tie: c.tie, tuplet: c.tuplet,
        })),
      })),
    })),
    marks: marks.map((m) => ({ ...m })),
  };
  return out;
}
