// Melody Echo ear trainer (council 2026-08-23): the synth plays a short
// phrase drawn from Mark's OWN songs, he plays it back on the P-45.
// DOM-free logic so the node test can drive it.

// Pick a run of `len` consecutive single RH notes (no chords) from a song.
// rng: () => [0,1) so tests can be deterministic.
export function pickPhrase(songs, len, rng = Math.random) {
  const candidates = [];
  for (const song of songs) {
    const rh = song.notes.filter((n) => n.h === 'R').sort((a, b) => a.b - b.b);
    // windows of consecutive notes with strictly increasing beats = melodic runs
    for (let i = 0; i + len <= rh.length; i++) {
      const win = rh.slice(i, i + len);
      let ok = true;
      for (let j = 1; j < win.length; j++) if (win[j].b <= win[j - 1].b) { ok = false; break; }
      // reject static runs (the Runaway plink is a bad ear exercise)
      if (ok && new Set(win.map((n) => n.m)).size < Math.min(2, len)) ok = false;
      if (ok) candidates.push({ songTitle: song.title, notes: win });
    }
  }
  if (!candidates.length) return null;
  const pick = candidates[Math.floor(rng() * candidates.length)];
  // normalize to a steady rhythm: the ear exercise is pitch, not rhythm
  return {
    songTitle: pick.songTitle,
    midis: pick.notes.map((n) => n.m),
    playNotes: pick.notes.map((n, i) => ({ b: i, d: 0.9, m: n.m, h: 'R' })),
  };
}

// Transposition round (mastery item 8): play the phrase back starting on a
// DIFFERENT named note. The start is octave-agnostic (any octave of the named
// pitch class); after that the interval sequence must match exactly from the
// note actually played, so the contour is preserved wherever he starts.
export class TransposeRound {
  constructor(midis, shift) {
    this.midis = midis;
    this.shift = shift;
    this.played = [];
    this.mistakes = 0;
  }
  get targetPc() { return ((this.midis[0] + this.shift) % 12 + 12) % 12; }
  noteOn(midi) {
    if (this.played.length >= this.midis.length) return { status: 'done', idx: this.played.length };
    if (this.played.length === 0) {
      if (midi % 12 !== this.targetPc) { this.mistakes++; return { status: 'wrong', idx: 0 }; }
      this.played.push(midi);
      return this.midis.length === 1 ? { status: 'done', idx: 1 } : { status: 'progress', idx: 1 };
    }
    const expected = this.played[0] + (this.midis[this.played.length] - this.midis[0]);
    if (midi !== expected) { this.mistakes++; this.played = []; return { status: 'wrong', idx: 0 }; }
    this.played.push(midi);
    return this.played.length >= this.midis.length
      ? { status: 'done', idx: this.played.length }
      : { status: 'progress', idx: this.played.length };
  }
}

export class EchoRound {
  constructor(midis) {
    this.midis = midis;
    this.idx = 0;
    this.mistakes = 0;
  }
  noteOn(midi) {
    if (this.idx >= this.midis.length) return { status: 'done', idx: this.idx };
    if (midi === this.midis[this.idx]) {
      this.idx++;
      return this.idx >= this.midis.length
        ? { status: 'done', idx: this.idx }
        : { status: 'progress', idx: this.idx };
    }
    this.mistakes++;
    this.idx = 0; // wrong note restarts the phrase, like real echo practice
    return { status: 'wrong', idx: 0 };
  }
}
