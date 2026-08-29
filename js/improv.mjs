// Improvisation playground data (mastery item 10a, council 08-24). DOM-free.
// Three generic loops, chord data authored inline. This screen is an explicit
// no-judgement zone: nothing here is ever scored, the journal logs minutes only.

// pcs are pitch classes (0 = C). Roots are LH comp midi notes.
const C7 = { name: 'C7', pcs: [0, 4, 7, 10], root: 48 };
const F7 = { name: 'F7', pcs: [5, 9, 0, 3], root: 41 };
const G7 = { name: 'G7', pcs: [7, 11, 2, 5], root: 43 };
const MAJOR_SCALE_C = [0, 2, 4, 5, 7, 9, 11]; // C major / A minor, all white keys
const BLUES_SCALE_C = [0, 3, 5, 6, 7, 10];    // C blues

export const LOOPS = [
  {
    id: 'am-f-c-g', name: 'Am · F · C · G', scale: MAJOR_SCALE_C,
    bars: [
      { name: 'Am', pcs: [9, 0, 4], root: 45 },
      { name: 'F', pcs: [5, 9, 0], root: 41 },
      { name: 'C', pcs: [0, 4, 7], root: 48 },
      { name: 'G', pcs: [7, 11, 2], root: 43 },
    ],
  },
  {
    id: 'c-gb-am-g', name: 'C · G/B · Am · G', scale: MAJOR_SCALE_C,
    bars: [
      { name: 'C', pcs: [0, 4, 7], root: 48 },
      { name: 'G/B', pcs: [7, 11, 2], root: 47 },
      { name: 'Am', pcs: [9, 0, 4], root: 45 },
      { name: 'G', pcs: [7, 11, 2], root: 43 },
    ],
  },
  {
    id: 'blues-c', name: '12-bar blues in C', scale: BLUES_SCALE_C,
    bars: [C7, C7, C7, C7, F7, F7, C7, C7, G7, F7, C7, G7],
  },
];

export function chordAt(loop, beat, beatsPerBar = 4) {
  const total = loop.bars.length * beatsPerBar;
  const inLoop = ((beat % total) + total) % total;
  const bar = Math.floor(inLoop / beatsPerBar);
  return { ...loop.bars[bar], bar };
}

// One full pass of the LH auto-comp: root for two beats, fifth for two.
export function compNotes(loop, beatsPerBar = 4) {
  const out = [];
  loop.bars.forEach((c, i) => {
    const o = i * beatsPerBar;
    out.push({ b: o, d: 2, m: c.root, h: 'L' });
    out.push({ b: o + 2, d: 2, m: c.root + 7, h: 'L' });
  });
  return out;
}
