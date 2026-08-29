// Rhythm tap training (Yousician's niche, ours now). DOM-free scoring.
// A pattern is tap times in beats within one 4/4 bar. The app plays it,
// then Mark taps it back on any key over the click.

export const PATTERNS = [
  { level: 1, beats: [0, 1, 2, 3] },
  { level: 1, beats: [0, 2] },
  { level: 1, beats: [0, 1, 3] },
  { level: 1, beats: [0, 2, 3] },
  { level: 2, beats: [0, 0.5, 1, 2, 2.5, 3] },
  { level: 2, beats: [0, 1, 1.5, 2, 3] },
  { level: 2, beats: [0, 0.5, 1, 1.5, 2, 3] },
  { level: 2, beats: [0, 1, 2, 2.5, 3, 3.5] },
  { level: 3, beats: [0, 1.5, 2.5, 3] },
  { level: 3, beats: [0.5, 1.5, 2.5, 3.5] },
  { level: 3, beats: [0, 1.5, 3] },
  { level: 3, beats: [0, 0.5, 2, 2.5] },
];

export const TAP_WINDOW_MS = 150;

export class RhythmRound {
  // expected: beats array; msPerBeat at the exercise tempo
  constructor(beats, msPerBeat) {
    this.expected = beats.map((b) => ({ atMs: b * msPerBeat, hit: null }));
    this.extras = 0;
  }
  // relMs: tap time relative to the bar start
  tap(relMs) {
    let best = null, bestD = Infinity;
    for (const e of this.expected) {
      if (e.hit !== null) continue;
      const d = Math.abs(relMs - e.atMs);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best && bestD <= TAP_WINDOW_MS) {
      best.hit = relMs;
      return { result: bestD <= 60 ? 'perfect' : 'good', deltaMs: relMs - best.atMs };
    }
    this.extras++;
    return { result: 'extra' };
  }
  result() {
    const hit = this.expected.filter((e) => e.hit !== null).length;
    return {
      hit,
      missed: this.expected.length - hit,
      extras: this.extras,
      clean: hit === this.expected.length && this.extras === 0,
    };
  }
}

// Count-row cells (council 2026-08-24: teach counting, not just imitation):
// one cell per eighth position, "1 & 2 & 3 & 4 &", marking which counts
// carry a note and which are rests.
export function makeCountCells(beats, perBar = 4) {
  const cells = [];
  for (let i = 0; i < perBar * 2; i++) {
    const pos = i / 2;
    cells.push({
      label: i % 2 === 0 ? String(i / 2 + 1) : '&',
      pos,
      active: beats.includes(pos),
    });
  }
  return cells;
}

export function pickPattern(level, rng = Math.random) {
  const pool = PATTERNS.filter((p) => p.level === Math.max(1, Math.min(3, level)));
  return pool[Math.floor(rng() * pool.length)];
}
