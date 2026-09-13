// Sight-reading exercise factory (council 2026-08-23): authored kernels ×
// controlled transforms = endless unseen-but-musical material. DOM-free.
//
// 2026-09-13 (package 1). Three things changed and one did not:
//  - the transform space is ENUMERABLE now (`variantSpace`), so "has he read
//    this before" is a question about musical CONTENT, not about a random
//    seed, and the pool's real size is a number instead of a hope.
//  - every exercise carries the key signature its transposition actually
//    produces. The kernels are white-key diatonic, so transposing C material
//    by N semitones lands on the transposed collection: that signature is
//    arithmetic, not a guess. It is a SIGNATURE, not a harmonic analysis
//    (a white-key phrase resting on A is C or Am, and both take 0 sharps).
//  - `judgeSight` can no longer dead-end a guided read. In wait mode the
//    clock freezes, so every accepted press classifies as 'good' and the
//    engine's weighted accuracy tops out at exactly 80 (0.8·g / g). The old
//    rule demanded 85, so a flawless level 1/2 read could never advance.
//    Fixed HERE, by judging a guided read on what wait mode can actually
//    measure (wrong notes and missed notes), not by touching Engine timing.
// `makeExercise(level, seed)` still returns byte-identical note data for the
// same seed; the metadata is additive.

import { KERNELS } from './kernels.mjs';
import { songSignature } from './source-signature.mjs';

// deterministic PRNG so an exercise can be regenerated from its seed
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TRANSPOSES_EASY = [0, 2, -3];       // C, D, A landmarks
const TRANSPOSES_FULL = [0, 2, 5, 7, -3, -5];
const REGISTERS = [0, 12, -12];
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export const SIGHT_MAX_LEVEL = 5;
export const clampLevel = (level) => Math.max(1, Math.min(SIGHT_MAX_LEVEL, Math.round(level) || 1));

// The key SIGNATURE a chromatic transposition of white-key material lands on.
// Not a claim about tonic or mode: a signature is shared by a major key and
// its relative minor, which is exactly the ambiguity these kernels carry.
const KEY_BY_TRANSPOSE = { 0: 'C', 2: 'D', 5: 'F', 7: 'G', '-3': 'A', '-5': 'G' };
export function keyForTranspose(transpose) {
  return KEY_BY_TRANSPOSE[String(transpose)] ?? null;
}

const transposesFor = (lvl) => (lvl <= 2 ? TRANSPOSES_EASY : TRANSPOSES_FULL);
const kernelsFor = (lvl) => KERNELS.map((kernel, i) => ({ kernel, i })).filter((x) => x.kernel.level === lvl);
const canSwap = (lvl, kernel) => lvl >= 2 && kernel.notes.every((n) => n.h === 'R');
const canSlow = (lvl) => lvl <= 2;

// Every transform combination this factory can produce at a level, in a stable
// order. This is the RAW count, and it is not the amount of music: at levels
// 3-5 the transpose list holds both +7 and -5, which differ by an octave, and
// the register list holds 0, +12 and -12. So (+7, r) and (-5, r+12) are the
// same notes, twice: 108 combinations, 96 distinct pieces of music, 12 pairs.
// `contentSpace` in reading-session.mjs is the one that counts music.
export function variantSpace(level) {
  const lvl = clampLevel(level);
  const out = [];
  for (const { kernel, i } of kernelsFor(lvl))
    for (const transpose of transposesFor(lvl))
      for (const register of (lvl >= 3 ? REGISTERS : [0]))
        for (const swap of (canSwap(lvl, kernel) ? [false, true] : [false]))
          for (const slow of (canSlow(lvl) ? [false, true] : [false]))
            out.push({ level: lvl, kernel: i, transpose, register, swap, slow, index: out.length });
  return out;
}
// Deliberately NOT called poolSize: 108 combinations are not 108 exercises.
export const variantCount = (level) => variantSpace(level).length;

// The exact draw order the seeded factory has always used. Kept in one place
// so `makeExercise` and the enumerated space can never drift apart.
export function variantFromSeed(level, seed) {
  const lvl = clampLevel(level);
  const rng = mulberry32(seed);
  const { kernel, i } = pick(rng, kernelsFor(lvl));
  const transpose = pick(rng, transposesFor(lvl));
  const register = lvl >= 3 ? pick(rng, REGISTERS) : 0;
  const swap = canSwap(lvl, kernel) && rng() < 0.25;
  const slow = canSlow(lvl) && rng() < 0.3;
  const space = variantSpace(lvl);
  return space.find((v) => v.kernel === i && v.transpose === transpose &&
    v.register === register && v.swap === swap && v.slow === slow) ?? space[0];
}

export function exerciseFromVariant(variant, { seed = null, id = null } = {}) {
  const lvl = clampLevel(variant.level);
  const kernel = KERNELS[variant.kernel];
  let notes = kernel.notes.map((n) => {
    let m = n.m + variant.transpose + variant.register;
    let h = n.h;
    if (variant.swap) { h = 'L'; m -= 12; }       // an RH kernel becomes bass-clef reading
    let b = n.b, d = n.d;
    if (variant.slow) { b *= 2; d *= 2; }         // augmented rhythm: same shape, longer values
    return { b, d, m, h };
  });
  // keep everything on the 88 keys whatever the transform stack did
  const lo = Math.min(...notes.map((n) => n.m));
  const hi = Math.max(...notes.map((n) => n.m));
  let octaveShift = 0;
  if (lo < 21) { octaveShift = 12; } else if (hi > 108) { octaveShift = -12; }
  if (octaveShift) notes = notes.map((n) => ({ ...n, m: n.m + octaveShift }));

  // engine + score renderer take a song object; sorted per hand like curation
  notes.sort((a, b2) => a.b - b2.b);
  const end = Math.max(...notes.map((n) => n.b + n.d));
  const meter = kernel.timeSig;
  const song = {
    id: id ?? (seed == null ? `sight-${lvl}-v${variant.index}` : `sight-${lvl}-${seed}`),
    sightRead: true,
    title: 'Sight reading',
    composer: `Level ${lvl} exercise`,
    bpm: 60 + lvl * 6,
    timeSig: meter,
    beatUnit: 4,
    // stated, because the transposition produces it; spelling and the drawn
    // key signature both read this (js/notation.mjs). NOT meterVerified and
    // NOT fromScore: this is generated material, and claiming either would be
    // a provenance lie (and meterVerified would refuse engraving outright).
    key: keyForTranspose(variant.transpose),
    keySource: 'kernel-transposition',
    sightLevel: lvl,
    variant: { ...variant, octaveShift },
    barBeatCount: meter[0] * 4 / meter[1],
    bars: Math.max(1, Math.ceil(end / (meter[0] * 4 / meter[1]))),
    endBeat: end,
    sections: [],
    notes,
  };
  song.contentKey = exerciseKey(song);
  return song;
}

export function makeExercise(level, seed) {
  return exerciseFromVariant(variantFromSeed(level, seed), { seed });
}

// Musical identity: what is ON THE PAGE, via the library's existing drift
// signature. The notes, the meter, and the key (which is what decides how
// every one of those notes is spelled). Deliberately NOT the nominal bpm and
// NOT the level label: the same notation at 66bpm called "level 3" and at
// 90bpm called "level 5" is the same music to read, and calling it new because
// a label moved is exactly the repeat-as-fresh-assessment this model exists to
// prevent. `songSignature` reads bpm, so it is pinned to a constant here.
export function exerciseKey(song) {
  return `${song.key ?? '?'}:${songSignature({ ...song, bpm: 0 })}`;
}

// Pass rules (council: concrete events, no composite rating).
//  - legacy / independent (timed) read: clean = no wrong notes and >=85
//    accuracy, which is the timing-weighted engine score.
//  - guided (wait mode) read: the clock waits, so timing is NOT measured and
//    the engine's accuracy is pinned at 80 by construction. A guided read is
//    clean when every required note was played and none was wrong.
// Two cleans move up, two floppy runs move down. `attempt` is optional: three
// argument callers keep the original behaviour exactly.
// Two guards the ladder did not have, both found in the 2026-09-13 cold review
// and both the same shape: the ladder moved on evidence that did not exist.
//  - NOTHING IN RANGE IS NOT A CLEAN READ. `correct >= required` is vacuously
//    true at required === 0, so choosing the left hand on a right-hand-only
//    exercise, or a practice range past the last note, played nothing, was
//    judged clean, and two of them levelled him up.
//  - PART OF AN EXERCISE IS NOT THE EXERCISE. A right-hand read of a two-hand
//    piece is real practice and is recorded as such, but it cannot move the
//    ladder that chooses what he reads next.
// `ladderMoved` says which happened. Three-argument callers are unaffected:
// both guards need the `attempt`.
export function judgeSight(state, accuracy, wrong, attempt = null) {
  const s = { level: 1, cleans: 0, flops: 0, done: 0, ...state };
  const guided = attempt?.mode === 'guided';
  // An abandoned read is not a verdict. It neither banks nor spends a clean.
  if (attempt && attempt.completed === false) {
    s.done++;
    return { next: s, verdict: 'abandoned', ladderMoved: false, msg: 'Stopped before the end. Nothing judged.' };
  }
  const required = attempt?.pitch?.required ?? 0;
  if (attempt && !(required > 0)) {
    s.done++;
    return { next: s, verdict: 'abandoned', ladderMoved: false,
      msg: 'Nothing to read: there was no music in the hands and bars you chose.' };
  }
  s.done++;
  const wrongCount = attempt ? attempt.pitch.wrong : wrong;
  const clean = guided
    ? wrongCount === 0 && attempt.pitch.missed === 0 && attempt.pitch.correct >= required
    : wrongCount === 0 && accuracy >= 85;
  const rough = guided
    ? required > 0 && (wrongCount + attempt.pitch.missed) / required >= 0.34
    : accuracy < 60;
  const helped = guided ? ' (with help)' : '';
  if (attempt && attempt.scopeFull === false) {
    const verdict = clean ? 'clean' : rough ? 'rough' : 'partial';
    return { next: s, verdict, ladderMoved: false,
      msg: clean ? 'Clean read of the part you chose.'
        : rough ? 'Rough one, on part of the exercise.'
        : 'Getting there, on part of the exercise.' };
  }
  if (clean) {
    s.cleans++; s.flops = 0;
    if (s.cleans >= 2 && s.level < SIGHT_MAX_LEVEL) {
      s.cleans = 0; s.level++;
      return { next: s, verdict: 'clean', ladderMoved: true, msg: `LEVEL UP: sight level ${s.level}${helped}` };
    }
    return { next: s, verdict: 'clean', ladderMoved: true, msg: guided ? 'Clean read, help on.' : 'Clean read.' };
  }
  if (rough) {
    s.flops++; s.cleans = 0;
    if (s.flops >= 2 && s.level > 1) {
      s.flops = 0; s.level--;
      return { next: s, verdict: 'rough', ladderMoved: true, msg: `Down a level, no shame, reading is hard.` };
    }
    return { next: s, verdict: 'rough', ladderMoved: true, msg: 'Rough one. Again.' };
  }
  s.cleans = 0;
  return { next: s, verdict: 'partial', ladderMoved: true, msg: 'Getting there.' };
}
