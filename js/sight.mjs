// Sight-reading exercise factory (council 2026-08-23): authored kernels ×
// controlled transforms = endless unseen-but-musical material. DOM-free.

import { KERNELS } from './kernels.mjs';

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
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export function makeExercise(level, seed) {
  const rng = mulberry32(seed);
  const lvl = Math.max(1, Math.min(5, level));
  const pool = KERNELS.filter((x) => x.level === lvl);
  const kernel = pick(rng, pool);
  const transpose = pick(rng, lvl <= 2 ? TRANSPOSES_EASY : TRANSPOSES_FULL);
  const register = lvl >= 3 ? pick(rng, [0, 12, -12]) : 0;
  // hand swap turns an RH kernel into bass-clef reading practice
  const swap = lvl >= 2 && kernel.notes.every((n) => n.h === 'R') && rng() < 0.25;
  const slow = lvl <= 2 && rng() < 0.3; // augmented rhythm: same shape, longer values

  let notes = kernel.notes.map((n) => {
    let m = n.m + transpose + register;
    let h = n.h;
    if (swap) { h = 'L'; m -= 12; }
    let b = n.b, d = n.d;
    if (slow) { b *= 2; d *= 2; }
    return { b, d, m, h };
  });
  // keep everything on the 88 keys whatever the transform stack did
  const lo = Math.min(...notes.map((n) => n.m));
  const hi = Math.max(...notes.map((n) => n.m));
  if (lo < 21) notes = notes.map((n) => ({ ...n, m: n.m + 12 }));
  else if (hi > 108) notes = notes.map((n) => ({ ...n, m: n.m - 12 }));

  // engine + score renderer take a song object; sorted per hand like curation
  notes.sort((a, b2) => a.b - b2.b);
  return {
    id: `sight-${lvl}-${seed}`,
    sightRead: true,
    title: 'Sight reading',
    composer: `Level ${lvl} exercise`,
    bpm: 60 + lvl * 6,
    timeSig: kernel.timeSig,
    beatUnit: 4,
    sections: [],
    notes,
  };
}

// Pass rules (council: concrete events, no composite rating):
// clean = no wrong notes and >=85 accuracy. Two cleans move up, two floppy
// runs move down.
export function judgeSight(state, accuracy, wrong) {
  const s = { level: 1, cleans: 0, flops: 0, done: 0, ...state };
  s.done++;
  if (wrong === 0 && accuracy >= 85) {
    s.cleans++; s.flops = 0;
    if (s.cleans >= 2 && s.level < 5) { s.level++; s.cleans = 0; return { next: s, msg: `LEVEL UP: sight level ${s.level}` }; }
    return { next: s, msg: 'Clean read.' };
  }
  if (accuracy < 60) {
    s.flops++; s.cleans = 0;
    if (s.flops >= 2 && s.level > 1) { s.level--; s.flops = 0; return { next: s, msg: `Down a level, no shame, reading is hard.` }; }
    return { next: s, msg: 'Rough one. Again.' };
  }
  s.cleans = 0;
  return { next: s, msg: 'Getting there.' };
}
