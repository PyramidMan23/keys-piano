// Theory cards (council 2026-08-23): triggered by a mistake Mark is actually
// making, answered by PLAYING, never abstract lessons. DOM-free.

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const noteName = (m) => NAMES[m % 12] + (Math.floor(m / 12) - 1);

// name a pitch-class set as a chord where possible
export function nameChord(midis) {
  const pcs = [...new Set(midis.map((m) => m % 12))].sort((a, b) => a - b);
  if (pcs.length === 1) return `${NAMES[pcs[0]]} (single note)`;
  const shapes = [
    { iv: [0, 4, 7], label: '' },        // major
    { iv: [0, 3, 7], label: 'm' },       // minor
    { iv: [0, 5, 7], label: 'sus4' },
    { iv: [0, 2, 7], label: 'sus2' },
    { iv: [0, 3, 6], label: 'dim' },
  ];
  for (const root of pcs) {
    const rel = pcs.map((p) => (p - root + 12) % 12).sort((a, b) => a - b);
    for (const s of shapes) {
      if (rel.length === s.iv.length && rel.every((v, i) => v === s.iv[i])) return NAMES[root] + s.label;
    }
  }
  return pcs.map((p) => NAMES[p]).join('-');
}

// Authored cards, matched by pitch-class set of the group Mark keeps missing.
const pcKey = (midis) => [...new Set(midis.map((m) => m % 12))].sort((a, b) => a - b).join(',');
export const CARDS = [
  { match: '0,4,9', title: 'A minor, first inversion', body: 'The Still D.R.E. chord: A minor is A-C-E. Here it is stacked C-E-A (the A moved up top), which is called first inversion. Same chord, different order, silkier sound. Minor = the middle note sits 3 semitones up instead of 4, which is what makes it moody.' },
  { match: '4,9,11', title: 'E suspended 4th', body: 'B-E-A is Esus4: the chord E would use a G#, but the A "suspends" above where the G# wants to be. Suspensions create tension that wants to resolve, which is exactly why the D.R.E. riff pulls forward.' },
  { match: '4,7,11', title: 'E minor', body: 'E minor is E-G-B. In the riff it lands as B-E-G. Notice the whole riff only ever moves ONE note at a time between its three chords. That is voice leading, and it is why it sounds smooth.' },
  { match: '0,4,7', title: 'C major', body: 'C-E-G, the home chord of the white keys. Root, a major third up (4 semitones), then a fifth. Every major chord is this exact shape starting somewhere else.' },
  { match: '0,3,7', title: 'C minor', body: 'C-Eb-G: the Game of Thrones sound. Take C major and pull the middle finger down one key onto the black Eb. One semitone of difference is the whole mood.' },
  { match: '4,8,11', title: 'E major', body: 'E-G#-B, the home chord of Runaway. The G# (black key) is what makes it major; with plain G it would be E minor.' },
  { match: '0,5,9', title: 'F major', body: 'F-A-C. Same major shape as C, moved to start on F. Learn the shape, not the letters, and every major chord is one hand position.' },
  { match: '2,7,11', title: 'G major', body: 'G-B-D. In the key of C this is "the five chord", the one that pulls you back home to C. Play G then C and feel the landing.' },
];

export function matchCard(midis) {
  const key = pcKey(midis);
  const found = CARDS.find((c) => c.match === key);
  if (found) return { ...found, task: [...new Set(midis)].sort((a, b) => a - b) };
  const sorted = [...new Set(midis)].sort((a, b) => a - b);
  return {
    title: `The ${nameChord(midis)} you keep missing`,
    body: `These notes together are ${sorted.map(noteName).join(' + ')}. Find them slowly, place all fingers, THEN press together. Twice proves it.`,
    task: sorted,
  };
}

// Answer-by-playing checker: all task notes down at once, twice.
export class CardTask {
  constructor(midis, passesNeeded = 2) {
    this.midis = new Set(midis);
    this.down = new Set();
    this.passes = 0;
    this.needed = passesNeeded;
  }
  // attempt window: rolled/staccato chords count (the rejected-G class,
  // Mark live 2026-08-28); a stray note resets the try
  note(midi, isDown, now = Date.now()) {
    if (isDown) { this.down.add(midi); (this.win ??= new Map()).set(midi, now); }
    else this.down.delete(midi);
    if (isDown && !this.midis.has(midi)) this.win.clear();
    const live = (m) => this.down.has(m) || (this.win?.has(m) && now - this.win.get(m) <= 1500);
    const allDown = [...this.midis].every(live);
    if (isDown && allDown) {
      this.passes++;
      this.down.clear();
      this.win?.clear();
      return this.passes >= this.needed ? 'done' : 'again';
    }
    return 'progress';
  }
}
