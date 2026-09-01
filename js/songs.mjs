// Curated song library. Every song is hand-prepared (hand split, sections,
// fingering) per the 2026-08-22 council: no generic MIDI import.
// Note fields: b = start beat, d = duration in beats, m = midi number,
// h = hand 'L'|'R', f = finger 1..5 (optional).
// beatUnit: which note value one beat represents (4 = quarter, 8 = eighth).

import { IMPORTED } from './songs-imported.mjs';
import { REHANDED } from './songs-hands.mjs';
import { FINGERS } from './songs-fingers.mjs';
import { FIXED } from './songs-fixed.mjs';
import { QUARANTINE } from './songs-quarantine.mjs';
import { METER } from './songs-meter.mjs';

export const SONGS = [
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    composer: 'Beethoven',
    bpm: 100,
    timeSig: [4, 4],
    beatUnit: 4,
    sections: [
      { name: 'Phrase A', startBeat: 0, endBeat: 16 },
      { name: 'Phrase B', startBeat: 16, endBeat: 32 },
      { name: 'Bridge', startBeat: 32, endBeat: 48 },
      { name: 'Phrase A2', startBeat: 48, endBeat: 64 },
    ],
    notes: [
      // Phrase A  (E E F G | G F E D | C C D E | E. D D)
      { b: 0, d: 1, m: 64, h: 'R', f: 3 }, { b: 1, d: 1, m: 64, h: 'R', f: 3 },
      { b: 2, d: 1, m: 65, h: 'R', f: 4 }, { b: 3, d: 1, m: 67, h: 'R', f: 5 },
      { b: 4, d: 1, m: 67, h: 'R', f: 5 }, { b: 5, d: 1, m: 65, h: 'R', f: 4 },
      { b: 6, d: 1, m: 64, h: 'R', f: 3 }, { b: 7, d: 1, m: 62, h: 'R', f: 2 },
      { b: 8, d: 1, m: 60, h: 'R', f: 1 }, { b: 9, d: 1, m: 60, h: 'R', f: 1 },
      { b: 10, d: 1, m: 62, h: 'R', f: 2 }, { b: 11, d: 1, m: 64, h: 'R', f: 3 },
      { b: 12, d: 1.5, m: 64, h: 'R', f: 3 }, { b: 13.5, d: 0.5, m: 62, h: 'R', f: 2 },
      { b: 14, d: 2, m: 62, h: 'R', f: 2 },
      // Phrase B  (E E F G | G F E D | C C D E | D. C C)
      { b: 16, d: 1, m: 64, h: 'R', f: 3 }, { b: 17, d: 1, m: 64, h: 'R', f: 3 },
      { b: 18, d: 1, m: 65, h: 'R', f: 4 }, { b: 19, d: 1, m: 67, h: 'R', f: 5 },
      { b: 20, d: 1, m: 67, h: 'R', f: 5 }, { b: 21, d: 1, m: 65, h: 'R', f: 4 },
      { b: 22, d: 1, m: 64, h: 'R', f: 3 }, { b: 23, d: 1, m: 62, h: 'R', f: 2 },
      { b: 24, d: 1, m: 60, h: 'R', f: 1 }, { b: 25, d: 1, m: 60, h: 'R', f: 1 },
      { b: 26, d: 1, m: 62, h: 'R', f: 2 }, { b: 27, d: 1, m: 64, h: 'R', f: 3 },
      { b: 28, d: 1.5, m: 62, h: 'R', f: 2 }, { b: 29.5, d: 0.5, m: 60, h: 'R', f: 1 },
      { b: 30, d: 2, m: 60, h: 'R', f: 1 },
      // Bridge  (D D E C | D E-F E C | D E-F E D | C D G,)
      { b: 32, d: 1, m: 62, h: 'R', f: 2 }, { b: 33, d: 1, m: 62, h: 'R', f: 2 },
      { b: 34, d: 1, m: 64, h: 'R', f: 3 }, { b: 35, d: 1, m: 60, h: 'R', f: 1 },
      { b: 36, d: 1, m: 62, h: 'R', f: 2 },
      { b: 37, d: 0.5, m: 64, h: 'R', f: 3 }, { b: 37.5, d: 0.5, m: 65, h: 'R', f: 4 },
      { b: 38, d: 1, m: 64, h: 'R', f: 3 }, { b: 39, d: 1, m: 60, h: 'R', f: 1 },
      { b: 40, d: 1, m: 62, h: 'R', f: 2 },
      { b: 41, d: 0.5, m: 64, h: 'R', f: 3 }, { b: 41.5, d: 0.5, m: 65, h: 'R', f: 4 },
      { b: 42, d: 1, m: 64, h: 'R', f: 3 }, { b: 43, d: 1, m: 62, h: 'R', f: 2 },
      { b: 44, d: 1, m: 60, h: 'R', f: 1 }, { b: 45, d: 1, m: 62, h: 'R', f: 2 },
      { b: 46, d: 2, m: 55, h: 'R', f: 1 },
      // Phrase A2  (E E F G | G F E D | C C D E | D. C C)
      { b: 48, d: 1, m: 64, h: 'R', f: 3 }, { b: 49, d: 1, m: 64, h: 'R', f: 3 },
      { b: 50, d: 1, m: 65, h: 'R', f: 4 }, { b: 51, d: 1, m: 67, h: 'R', f: 5 },
      { b: 52, d: 1, m: 67, h: 'R', f: 5 }, { b: 53, d: 1, m: 65, h: 'R', f: 4 },
      { b: 54, d: 1, m: 64, h: 'R', f: 3 }, { b: 55, d: 1, m: 62, h: 'R', f: 2 },
      { b: 56, d: 1, m: 60, h: 'R', f: 1 }, { b: 57, d: 1, m: 60, h: 'R', f: 1 },
      { b: 58, d: 1, m: 62, h: 'R', f: 2 }, { b: 59, d: 1, m: 64, h: 'R', f: 3 },
      { b: 60, d: 1.5, m: 62, h: 'R', f: 2 }, { b: 61.5, d: 0.5, m: 60, h: 'R', f: 1 },
      { b: 62, d: 2, m: 60, h: 'R', f: 1 },
      // Left hand: root whole notes per bar (beginner arrangement)
      { b: 0, d: 4, m: 48, h: 'L', f: 5 }, { b: 4, d: 4, m: 48, h: 'L', f: 5 },
      { b: 8, d: 4, m: 48, h: 'L', f: 5 }, { b: 12, d: 4, m: 43, h: 'L', f: 5 },
      { b: 16, d: 4, m: 48, h: 'L', f: 5 }, { b: 20, d: 4, m: 48, h: 'L', f: 5 },
      { b: 24, d: 4, m: 48, h: 'L', f: 5 }, { b: 28, d: 4, m: 43, h: 'L', f: 5 },
      { b: 32, d: 4, m: 43, h: 'L', f: 5 }, { b: 36, d: 4, m: 48, h: 'L', f: 5 },
      { b: 40, d: 4, m: 43, h: 'L', f: 5 }, { b: 44, d: 4, m: 48, h: 'L', f: 5 },
      { b: 48, d: 4, m: 48, h: 'L', f: 5 }, { b: 52, d: 4, m: 48, h: 'L', f: 5 },
      { b: 56, d: 4, m: 48, h: 'L', f: 5 }, { b: 60, d: 4, m: 43, h: 'L', f: 5 },
    ],
  },
  {
    id: 'happy-birthday',
    title: 'Happy Birthday',
    composer: 'Traditional',
    bpm: 90,
    timeSig: [3, 4],
    beatUnit: 4,
    sections: [
      { name: 'Lines 1-2', startBeat: 0, endBeat: 12 },
      { name: 'Lines 3-4', startBeat: 12, endBeat: 24 },
    ],
    notes: [
      // Pickup written on beat 0 of bar 1 for simplicity (two eighths)
      { b: 0, d: 0.5, m: 67, h: 'R', f: 2 }, { b: 0.5, d: 0.5, m: 67, h: 'R', f: 2 },
      { b: 1, d: 1, m: 69, h: 'R', f: 3 }, { b: 2, d: 1, m: 67, h: 'R', f: 2 },
      { b: 3, d: 1, m: 72, h: 'R', f: 5 }, { b: 4, d: 2, m: 71, h: 'R', f: 4 },
      { b: 6, d: 0.5, m: 67, h: 'R', f: 2 }, { b: 6.5, d: 0.5, m: 67, h: 'R', f: 2 },
      { b: 7, d: 1, m: 69, h: 'R', f: 3 }, { b: 8, d: 1, m: 67, h: 'R', f: 2 },
      { b: 9, d: 1, m: 74, h: 'R', f: 5 }, { b: 10, d: 2, m: 72, h: 'R', f: 4 },
      { b: 12, d: 0.5, m: 67, h: 'R', f: 1 }, { b: 12.5, d: 0.5, m: 67, h: 'R', f: 1 },
      { b: 13, d: 1, m: 79, h: 'R', f: 5 }, { b: 14, d: 1, m: 76, h: 'R', f: 3 },
      { b: 15, d: 1, m: 72, h: 'R', f: 1 }, { b: 16, d: 1, m: 71, h: 'R', f: 2 },
      { b: 17, d: 1, m: 69, h: 'R', f: 1 },
      { b: 18, d: 0.5, m: 77, h: 'R', f: 4 }, { b: 18.5, d: 0.5, m: 77, h: 'R', f: 4 },
      { b: 19, d: 1, m: 76, h: 'R', f: 3 }, { b: 20, d: 1, m: 72, h: 'R', f: 1 },
      { b: 21, d: 1, m: 74, h: 'R', f: 2 }, { b: 22, d: 2, m: 72, h: 'R', f: 1 },
      // Left hand: one root per bar (C F G harmony)
      { b: 0, d: 3, m: 48, h: 'L', f: 5 }, { b: 3, d: 3, m: 43, h: 'L', f: 5 },
      { b: 6, d: 3, m: 43, h: 'L', f: 5 }, { b: 9, d: 3, m: 48, h: 'L', f: 5 },
      { b: 12, d: 3, m: 48, h: 'L', f: 5 }, { b: 15, d: 3, m: 53, h: 'L', f: 5 },
      { b: 18, d: 3, m: 53, h: 'L', f: 5 }, { b: 21, d: 3, m: 48, h: 'L', f: 5 },
    ],
  },
  {
    id: 'fur-elise', group: 'fur-elise', level: 'Easy',
    title: 'Für Elise',
    composer: 'Beethoven',
    bpm: 116,
    timeSig: [3, 8],
    beatUnit: 8,
    sections: [
      { name: 'Theme 1st time', startBeat: 0, endBeat: 12 },
      { name: 'Answer', startBeat: 12, endBeat: 24 },
    ],
    notes: [
      // Right hand, beat = eighth note. E D# E D# E B D C | A ... C E A | B ... E G# B | C ...
      { b: 0, d: 0.5, m: 76, h: 'R', f: 4 }, { b: 0.5, d: 0.5, m: 75, h: 'R', f: 3 },
      { b: 1, d: 0.5, m: 76, h: 'R', f: 4 }, { b: 1.5, d: 0.5, m: 75, h: 'R', f: 3 },
      { b: 2, d: 0.5, m: 76, h: 'R', f: 4 }, { b: 2.5, d: 0.5, m: 71, h: 'R', f: 2 },
      { b: 3, d: 0.5, m: 74, h: 'R', f: 3 }, { b: 3.5, d: 0.5, m: 72, h: 'R', f: 2 },
      { b: 4, d: 1, m: 69, h: 'R', f: 1 },
      { b: 5, d: 0.5, m: 60, h: 'R', f: 1 }, { b: 5.5, d: 0.5, m: 64, h: 'R', f: 2 },
      { b: 6, d: 0.5, m: 69, h: 'R', f: 3 }, { b: 6.5, d: 1, m: 71, h: 'R', f: 4 },
      { b: 7.5, d: 0.5, m: 64, h: 'R', f: 1 },
      { b: 8, d: 0.5, m: 68, h: 'R', f: 2 }, { b: 8.5, d: 0.5, m: 71, h: 'R', f: 3 },
      { b: 9, d: 1.5, m: 72, h: 'R', f: 4 },
      { b: 10.5, d: 0.5, m: 64, h: 'R', f: 1 },
      // repeat of theme
      { b: 11, d: 0.5, m: 76, h: 'R', f: 4 }, { b: 11.5, d: 0.5, m: 75, h: 'R', f: 3 },
      { b: 12, d: 0.5, m: 76, h: 'R', f: 4 }, { b: 12.5, d: 0.5, m: 75, h: 'R', f: 3 },
      { b: 13, d: 0.5, m: 76, h: 'R', f: 4 }, { b: 13.5, d: 0.5, m: 71, h: 'R', f: 2 },
      { b: 14, d: 0.5, m: 74, h: 'R', f: 3 }, { b: 14.5, d: 0.5, m: 72, h: 'R', f: 2 },
      { b: 15, d: 1, m: 69, h: 'R', f: 1 },
      { b: 16, d: 0.5, m: 60, h: 'R', f: 1 }, { b: 16.5, d: 0.5, m: 64, h: 'R', f: 2 },
      { b: 17, d: 0.5, m: 69, h: 'R', f: 3 }, { b: 17.5, d: 1, m: 71, h: 'R', f: 4 },
      { b: 18.5, d: 0.5, m: 64, h: 'R', f: 1 },
      { b: 19, d: 0.5, m: 72, h: 'R', f: 2 }, { b: 19.5, d: 0.5, m: 71, h: 'R', f: 3 },
      { b: 20, d: 2, m: 69, h: 'R', f: 1 },
      // Left hand arpeggio anchors
      { b: 4, d: 0.5, m: 45, h: 'L', f: 5 }, { b: 4.5, d: 0.5, m: 52, h: 'L', f: 2 },
      { b: 5, d: 0.5, m: 57, h: 'L', f: 1 },
      { b: 6.5, d: 0.5, m: 40, h: 'L', f: 5 }, { b: 7, d: 0.5, m: 52, h: 'L', f: 2 },
      { b: 7.5, d: 0.5, m: 56, h: 'L', f: 1 },
      { b: 9, d: 0.5, m: 45, h: 'L', f: 5 }, { b: 9.5, d: 0.5, m: 52, h: 'L', f: 2 },
      { b: 10, d: 0.5, m: 57, h: 'L', f: 1 },
      { b: 15, d: 0.5, m: 45, h: 'L', f: 5 }, { b: 15.5, d: 0.5, m: 52, h: 'L', f: 2 },
      { b: 16, d: 0.5, m: 57, h: 'L', f: 1 },
      { b: 17.5, d: 0.5, m: 40, h: 'L', f: 5 }, { b: 18, d: 0.5, m: 52, h: 'L', f: 2 },
      { b: 18.5, d: 0.5, m: 56, h: 'L', f: 1 },
      { b: 20, d: 0.5, m: 45, h: 'L', f: 5 }, { b: 20.5, d: 0.5, m: 52, h: 'L', f: 2 },
      { b: 21, d: 0.5, m: 57, h: 'L', f: 1 },
    ],
  },
];

// ---- Mark's requested songs (curated 2026-08-22, transcriptions verified
// against Skoove / mypianonotes / La Touche Musicale letter-note sources) ----

// Still D.R.E.: the Scott Storch riff. Three RH voicings, one note moving:
// Am/C (C-E-A), Esus4 (B-E-A), Em (B-E-G), staccato quavers, 2-bar loop.
function stillDreNotes() {
  const AM = [[72, 1], [76, 2], [81, 5]];   // C5 E5 A5
  const ESUS = [[71, 1], [76, 2], [81, 5]]; // B4 E5 A5
  const EM = [[71, 1], [76, 2], [79, 4]];   // B4 E5 G5
  const notes = [];
  // Full-length: the riff IS the whole song. 32 loops ≈ 4min 35s at 93bpm,
  // matching the track's runtime; sections name the song structure.
  for (let loop = 0; loop < 32; loop++) {
    const o = loop * 8;
    // bar 1: Am on every quaver
    for (let i = 0; i < 8; i++) for (const [m, f] of AM) notes.push({ b: o + i * 0.5, d: 0.5, m, h: 'R', f });
    // bar 2: Esus4 on "1 & 2", Em from the "&" of 2 to the end
    for (const t of [0, 0.5, 1]) for (const [m, f] of ESUS) notes.push({ b: o + 4 + t, d: 0.5, m, h: 'R', f });
    for (const t of [1.5, 2, 2.5, 3, 3.5]) for (const [m, f] of EM) notes.push({ b: o + 4 + t, d: 0.5, m, h: 'R', f });
    // bass: A under bar 1; E under bar 2 with B on beat four leading back
    notes.push({ b: o, d: 4, m: 45, h: 'L', f: 5 });
    notes.push({ b: o + 4, d: 3, m: 40, h: 'L', f: 5 });
    notes.push({ b: o + 7, d: 1, m: 47, h: 'L', f: 2 });
  }
  return notes;
}

// Game of Thrones: C-minor cells. G-C-Eb-F (Cm), then F-Bb-Eb-D, in 3/4:
// quarter, quarter, two quavers per cell. Theme stated mid, then high octave.
function gotNotes() {
  const R = [], L = [];
  const cell = (arr, out, b, h) => {
    out.push({ b, d: 1, m: arr[0][0], h, f: arr[0][1] });
    out.push({ b: b + 1, d: 1, m: arr[1][0], h, f: arr[1][1] });
    out.push({ b: b + 2, d: 0.5, m: arr[2][0], h, f: arr[2][1] });
    out.push({ b: b + 2.5, d: 0.5, m: arr[3][0], h, f: arr[3][1] });
  };
  const gL = [[55, 1], [48, 5], [51, 3], [53, 2]]; // G3 C3 Eb3 F3
  const fL = [[53, 1], [46, 5], [51, 2], [50, 3]]; // F3 Bb2 Eb3 D3
  const gR = [[67, 5], [60, 1], [63, 2], [65, 3]]; // G4 C4 Eb4 F4
  const fR = [[65, 4], [58, 1], [63, 3], [62, 2]]; // F4 Bb3 Eb4 D4
  const up = (a) => a.map(([m, f]) => [m + 12, f]);
  // intro: ostinato alone, LH
  for (const b of [0, 3, 6, 9]) cell(gL, L, b, 'L');
  // main theme (octave 4)
  for (const b of [12, 15, 18]) cell(gR, R, b, 'R');
  R.push({ b: 21, d: 3, m: 62, h: 'R', f: 2 }); // D4 held
  for (const b of [24, 27, 30]) cell(fR, R, b, 'R');
  R.push({ b: 33, d: 3, m: 60, h: 'R', f: 1 }); // C4 held
  for (const b of [12, 15, 18, 21]) cell(gL, L, b, 'L');
  for (const b of [24, 27, 30, 33]) cell(fL, L, b, 'L');
  // high theme (octave 5): reusable so the reprise stays identical
  const highTheme = (o) => {
    for (const b of [o, o + 3, o + 6]) cell(up(gR), R, b, 'R');
    R.push({ b: o + 9, d: 3, m: 74, h: 'R', f: 2 }); // D5 held
    for (const b of [o + 12, o + 15, o + 18]) cell(up(fR), R, b, 'R');
    R.push({ b: o + 21, d: 3, m: 72, h: 'R', f: 1 }); // C5 held
    for (const b of [o, o + 3, o + 6, o + 9]) cell(gL, L, b, 'L');
    for (const b of [o + 12, o + 15, o + 18, o + 21]) cell(fL, L, b, 'L');
  };
  highTheme(36);
  // low turn: the Ab-F-C answer figure over F and C roots (bars 21-24)
  for (const o of [60, 66]) {
    R.push({ b: o, d: 1, m: 68, h: 'R', f: 4 }, { b: o + 1, d: 1, m: 65, h: 'R', f: 2 }, { b: o + 2, d: 1, m: 60, h: 'R', f: 1 });
    R.push({ b: o + 3, d: 1, m: 65, h: 'R', f: 2 }, { b: o + 4, d: 1, m: 67, h: 'R', f: 3 }, { b: o + 5, d: 1, m: 60, h: 'R', f: 1 });
    L.push({ b: o, d: 3, m: 53, h: 'L', f: 5 }, { b: o + 3, d: 3, m: 48, h: 'L', f: 5 });
  }
  // development rise back into the theme (bars 25-26)
  R.push({ b: 72, d: 0.5, m: 60, h: 'R', f: 1 }, { b: 72.5, d: 0.5, m: 62, h: 'R', f: 2 });
  R.push({ b: 73, d: 0.5, m: 63, h: 'R', f: 3 }, { b: 73.5, d: 0.5, m: 65, h: 'R', f: 4 });
  R.push({ b: 74, d: 1, m: 67, h: 'R', f: 5 });
  cell(gR, R, 75, 'R');
  cell(gL, L, 72, 'L'); cell(gL, L, 75, 'L');
  // high theme reprise (bars 27-34), then the final C
  highTheme(78);
  R.push({ b: 102, d: 3, m: 72, h: 'R', f: 1 });
  L.push({ b: 102, d: 3, m: 36, h: 'L', f: 5 });
  return [...R, ...L];
}

// Runaway: the naked repeated E5 plink, then the E / D# / C# / A descent
// over E - D#(B/D#) - C#m - A roots, stated twice.
function runawayNotes() {
  const R = [], L = [];
  for (let i = 0; i < 16; i++) R.push({ b: i, d: 1, m: 76, h: 'R', f: 3 }); // the plink
  const phrase = (o) => {
    for (const t of [0, 1, 2]) R.push({ b: o + t, d: 1, m: 76, h: 'R', f: 5 });      // E5
    for (const t of [4, 5, 6, 7]) R.push({ b: o + t, d: 1, m: 75, h: 'R', f: 4 });   // D#5
    for (const t of [8, 9, 10, 11]) R.push({ b: o + t, d: 1, m: 73, h: 'R', f: 3 }); // C#5
    R.push({ b: o + 12, d: 1, m: 69, h: 'R', f: 2 });  // A4
    R.push({ b: o + 13, d: 1, m: 69, h: 'R', f: 2 });
    R.push({ b: o + 14, d: 1, m: 68, h: 'R', f: 1 });  // G#4
    R.push({ b: o + 15, d: 1, m: 64, h: 'R' });        // E4
    L.push({ b: o, d: 4, m: 52, h: 'L', f: 5 });       // E3
    L.push({ b: o + 4, d: 4, m: 51, h: 'L', f: 5 });   // D#3
    L.push({ b: o + 8, d: 4, m: 49, h: 'L', f: 5 });   // C#3
    L.push({ b: o + 12, d: 4, m: 45, h: 'L', f: 5 });  // A2
  };
  phrase(16);
  phrase(32);
  // chorus comp figure from the letter notes: E, E+G#, E, G#-B (8 bars)
  for (let bar = 0; bar < 8; bar++) {
    const o = 48 + bar * 4;
    R.push({ b: o, d: 1, m: 64, h: 'R', f: 1 });
    R.push({ b: o + 1, d: 1, m: 64, h: 'R', f: 1 }, { b: o + 1, d: 1, m: 68, h: 'R', f: 3 });
    R.push({ b: o + 2, d: 1, m: 64, h: 'R', f: 1 });
    R.push({ b: o + 3, d: 0.5, m: 68, h: 'R', f: 3 }, { b: o + 3.5, d: 0.5, m: 71, h: 'R', f: 5 });
    L.push({ b: o, d: 4, m: 52, h: 'L', f: 5 });
  }
  // descent reprise, then the plink fades the song out
  phrase(80);
  phrase(96);
  for (let i = 0; i < 8; i++) R.push({ b: 112 + i, d: 1, m: 76, h: 'R', f: 3 });
  R.push({ b: 120, d: 4, m: 76, h: 'R', f: 3 });
  L.push({ b: 120, d: 4, m: 52, h: 'L', f: 5 });
  return [...R, ...L];
}

// ---- Easy variants (Flowkey-style difficulty levels) ----
// Same songs, radically simpler: single notes instead of chords, quarters
// instead of quavers, whole-note bass, shorter forms. Same recognizable tune.

// Still D.R.E. easy: the riff's top voice (A A / A G) in quarters, 8 loops.
function stillDreEasyNotes() {
  const notes = [];
  for (let loop = 0; loop < 8; loop++) {
    const o = loop * 8;
    for (const t of [0, 1, 2, 3]) notes.push({ b: o + t, d: 1, m: 69, h: 'R', f: 5 });
    notes.push({ b: o + 4, d: 1, m: 69, h: 'R', f: 5 }, { b: o + 5, d: 1, m: 69, h: 'R', f: 5 });
    notes.push({ b: o + 6, d: 1, m: 67, h: 'R', f: 4 }, { b: o + 7, d: 1, m: 67, h: 'R', f: 4 });
    notes.push({ b: o, d: 4, m: 45, h: 'L', f: 5 });
    notes.push({ b: o + 4, d: 4, m: 40, h: 'L', f: 5 });
  }
  return notes;
}

// GoT easy: melody cells only, single whole-bar bass roots, theme twice.
function gotEasyNotes() {
  const R = [], L = [];
  const themePass = (o) => {
    const gCell = [[67, 5], [60, 1], [63, 2], [65, 3]];
    const fCell = [[65, 4], [58, 1], [63, 3], [62, 2]];
    const cell = (arr, b) => {
      R.push({ b, d: 1, m: arr[0][0], h: 'R', f: arr[0][1] });
      R.push({ b: b + 1, d: 1, m: arr[1][0], h: 'R', f: arr[1][1] });
      R.push({ b: b + 2, d: 0.5, m: arr[2][0], h: 'R', f: arr[2][1] });
      R.push({ b: b + 2.5, d: 0.5, m: arr[3][0], h: 'R', f: arr[3][1] });
    };
    for (const b of [o, o + 3, o + 6]) cell(gCell, b);
    R.push({ b: o + 9, d: 3, m: 62, h: 'R', f: 2 });
    for (const b of [o + 12, o + 15, o + 18]) cell(fCell, b);
    R.push({ b: o + 21, d: 3, m: 60, h: 'R', f: 1 });
    for (const b of [o, o + 3, o + 6, o + 9]) L.push({ b, d: 3, m: 48, h: 'L', f: 5 });
    for (const b of [o + 12, o + 15, o + 18, o + 21]) L.push({ b, d: 3, m: 46, h: 'L', f: 5 });
  };
  themePass(0);
  themePass(24);
  return [...R, ...L];
}

// Runaway easy: short plink, one descent, done.
function runawayEasyNotes() {
  const R = [], L = [];
  for (let i = 0; i < 8; i++) R.push({ b: i, d: 1, m: 76, h: 'R', f: 3 });
  for (const t of [8, 9, 10]) R.push({ b: t, d: 1, m: 76, h: 'R', f: 5 });
  for (const t of [12, 13, 14, 15]) R.push({ b: t, d: 1, m: 75, h: 'R', f: 4 });
  for (const t of [16, 17, 18, 19]) R.push({ b: t, d: 1, m: 73, h: 'R', f: 3 });
  R.push({ b: 20, d: 1, m: 69, h: 'R', f: 2 }, { b: 21, d: 1, m: 69, h: 'R', f: 2 });
  R.push({ b: 22, d: 1, m: 68, h: 'R', f: 1 }, { b: 23, d: 1, m: 64, h: 'R' });
  L.push({ b: 8, d: 4, m: 52, h: 'L', f: 5 }, { b: 12, d: 4, m: 51, h: 'L', f: 5 });
  L.push({ b: 16, d: 4, m: 49, h: 'L', f: 5 }, { b: 20, d: 4, m: 45, h: 'L', f: 5 });
  R.push({ b: 24, d: 4, m: 76, h: 'R', f: 3 });
  L.push({ b: 24, d: 4, m: 52, h: 'L', f: 5 });
  return [...R, ...L];
}

SONGS.push(
  {
    id: 'still-dre-easy',
    group: 'still-dre',
    level: 'Easy',
    title: 'Still D.R.E.',
    composer: 'Dr. Dre · easy arrangement',
    bpm: 93,
    timeSig: [4, 4],
    beatUnit: 4,
    sections: [
      { name: 'Loop 1', startBeat: 0, endBeat: 8 },
      { name: 'Loops 2-8', startBeat: 8, endBeat: 64 },
    ],
    notes: stillDreEasyNotes(),
  },
  {
    id: 'game-of-thrones-easy',
    group: 'game-of-thrones',
    level: 'Easy',
    title: 'Game of Thrones (Main Theme)',
    composer: 'Ramin Djawadi · easy arrangement',
    bpm: 75,
    timeSig: [3, 4],
    beatUnit: 4,
    sections: [
      { name: 'Theme', startBeat: 0, endBeat: 24 },
      { name: 'Theme again', startBeat: 24, endBeat: 48 },
    ],
    notes: gotEasyNotes(),
  },
  {
    id: 'runaway-easy',
    group: 'runaway',
    level: 'Easy',
    title: 'Runaway',
    composer: 'Kanye West · easy arrangement',
    bpm: 80,
    timeSig: [4, 4],
    beatUnit: 4,
    sections: [
      { name: 'The plink', startBeat: 0, endBeat: 8 },
      { name: 'Descent', startBeat: 8, endBeat: 24 },
    ],
    notes: runawayEasyNotes(),
  },
  {
    id: 'still-dre',
    group: 'still-dre',
    level: 'Medium',
    title: 'Still D.R.E.',
    composer: 'Dr. Dre · Scott Storch riff',
    bpm: 93,
    timeSig: [4, 4],
    beatUnit: 4,
    sections: [
      { name: 'Bar 1 (Am)', startBeat: 0, endBeat: 4 },
      { name: 'Bar 2 (Esus4 to Em)', startBeat: 4, endBeat: 8 },
      { name: 'Intro (loops 1-2)', startBeat: 0, endBeat: 16 },
      { name: 'Verse 1', startBeat: 16, endBeat: 80 },
      { name: 'Hook', startBeat: 80, endBeat: 112 },
      { name: 'Verse 2', startBeat: 112, endBeat: 176 },
      { name: 'Hook 2', startBeat: 176, endBeat: 208 },
      { name: 'Outro', startBeat: 208, endBeat: 256 },
    ],
    notes: stillDreNotes(),
  },
  {
    id: 'game-of-thrones',
    group: 'game-of-thrones',
    level: 'Medium',
    title: 'Game of Thrones (Main Theme)',
    composer: 'Ramin Djawadi',
    bpm: 85,
    timeSig: [3, 4],
    beatUnit: 4,
    sections: [
      { name: 'Ostinato intro (LH)', startBeat: 0, endBeat: 12 },
      { name: 'Main theme', startBeat: 12, endBeat: 36 },
      { name: 'High theme', startBeat: 36, endBeat: 60 },
      { name: 'Low turn', startBeat: 60, endBeat: 72 },
      { name: 'Rise', startBeat: 72, endBeat: 78 },
      { name: 'Reprise + end', startBeat: 78, endBeat: 105 },
    ],
    notes: gotNotes(),
  },
  {
    id: 'runaway',
    group: 'runaway',
    level: 'Medium',
    title: 'Runaway',
    composer: 'Kanye West',
    bpm: 87,
    timeSig: [4, 4],
    beatUnit: 4,
    sections: [
      { name: 'The plink', startBeat: 0, endBeat: 16 },
      { name: 'Descent', startBeat: 16, endBeat: 32 },
      { name: 'Descent again', startBeat: 32, endBeat: 48 },
      { name: 'Chorus figure', startBeat: 48, endBeat: 80 },
      { name: 'Descent reprise', startBeat: 80, endBeat: 112 },
      { name: 'Outro plink', startBeat: 112, endBeat: 124 },
    ],
    notes: runawayNotes(),
  },
);

// ---- 2026-08-23 song wave (transcriptions verified: pianoletternotes /
// La Touche / Hooktheory / piano-keyboard-guide; Empire State of Mind PARKED,
// no verifiable note source found) ----

// He's a Pirate: D minor 3/4, the famous eighth-note theme.
function piratesNotes() {
  const R = [], L = [];
  const run = (o, seq) => { let b = o; for (const [m, d] of seq) { if (m) R.push({ b, d, m, h: 'R' }); b += d; } };
  const A3 = 57, C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, Bb4 = 70, D5 = 74;
  const phraseA = [[A3, 0.5], [C4, 0.5], [D4, 0.5], [D4, 0.5], [D4, 0.5], [E4, 0.5], [F4, 0.5], [F4, 0.5], [F4, 0.5], [G4, 0.5], [E4, 0.5], [E4, 0.5], [D4, 0.5], [C4, 0.5], [C4, 0.5], [D4, 1.5]];
  run(0, phraseA);
  run(9, phraseA);
  run(18, [[A3, 0.5], [C4, 0.5], [D4, 0.5], [D4, 0.5], [D4, 0.5], [F4, 0.5], [G4, 0.5], [G4, 0.5], [G4, 0.5], [A4, 0.5], [Bb4, 0.5], [Bb4, 0.5], [A4, 0.5], [G4, 0.5], [A4, 0.5], [D4, 1.5]]);
  run(27, [[D4, 0.5], [E4, 0.5], [F4, 1], [F4, 0.5], [G4, 0.5], [A4, 1], [A4, 0.5], [G4, 0.5], [A4, 0.5], [D5, 1.5]]);
  L.push({ b: 33, d: 3, m: 38, h: 'L', f: 5 });
  R.push({ b: 33, d: 3, m: D5, h: 'R', f: 5 });
  const bass = [[0, 50], [3, 50], [6, 48], [9, 50], [12, 50], [15, 48], [18, 50], [21, 43], [24, 46], [27, 50], [30, 45]];
  for (const [b, m] of bass) L.push({ b, d: 3, m, h: 'L', f: 5 });
  L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

// River Flows in You: verified simplified arrangement (Am-F-C-G loop),
// deliberately no accidentals so it reads cleanly in score mode.
function riverNotes() {
  const R = [], L = [];
  const mel = { 45: [72, 71, 72, 71], 41: [72, 67, 72, 67], 48: [72, 71, 72, 71], 43: [72, 67, 72, 71] };
  const arp = { 45: [45, 52, 57, 52], 41: [41, 48, 53, 48], 48: [48, 55, 60, 55], 43: [43, 50, 55, 50] };
  const fL = [5, 3, 1, 3];
  const fMel = (m) => (m === 72 ? 3 : m === 71 ? 2 : 1);
  for (let loop = 0; loop < 4; loop++) {
    [45, 41, 48, 43].forEach((root, bar) => {
      const o = loop * 16 + bar * 4;
      mel[root].forEach((m, i) => R.push({ b: o + i, d: 1, m, h: 'R', f: fMel(m) }));
      arp[root].forEach((m, i) => L.push({ b: o + i, d: 1, m, h: 'L', f: fL[i] }));
    });
  }
  for (const m of [69, 72, 76]) R.push({ b: 64, d: 4, m, h: 'R' });
  L.push({ b: 64, d: 4, m: 45, h: 'L', f: 5 });
  return [...R, ...L];
}

// Piano Man: C major waltz, the instrumental melody + descending bass line.
function pianoManNotes() {
  const R = [], L = [];
  const put = (b, d, m, f) => R.push({ b, d, m, h: 'R', f });
  const G4 = 67, F4 = 65, E4 = 64, D4 = 62, C4 = 60;
  const phrase = (o, tail) => {
    put(o, 1, G4, 5); put(o + 1, 1, G4, 5); put(o + 2, 0.5, G4, 5); put(o + 2.5, 0.5, G4, 5);
    put(o + 3, 0.5, F4, 4); put(o + 3.5, 0.5, E4, 3); put(o + 4, 0.5, F4, 4); put(o + 4.5, 0.5, E4, 3);
    put(o + 5, 1, C4, 1);
    for (const t of [6, 6.5, 7, 7.5]) put(o + t, 0.5, C4, 1);
    put(o + 8, 1, C4, 1);
    tail(o);
  };
  phrase(0, (o) => {
    put(o + 9, 0.5, D4, 2); put(o + 9.5, 0.5, E4, 3); put(o + 10, 0.5, D4, 2); put(o + 10.5, 0.5, E4, 3);
    put(o + 11, 1, F4, 4);
  });
  phrase(12, (o) => {
    put(o + 9, 1, F4, 4); put(o + 10, 1, E4, 3); put(o + 11, 1, C4, 1);
  });
  put(24, 3, C4, 1);
  const bass = [48, 47, 45, 43, 41, 50, 43, 43, 48];
  bass.forEach((m, i) => L.push({ b: i * 3, d: 3, m, h: 'L', f: 5 }));
  return [...R, ...L];
}

// Gangsta's Paradise: C minor, the verified Cm-Ab-Fm-G loop; verse melody
// per the letter-note contour (C monotone, B/G dips over the G chord).
function gangstasNotes() {
  const R = [], L = [];
  const C5 = 72, B4 = 71, G4 = 67, Ab4 = 68;
  const introBarPair = (o) => {
    for (const t of [0, 1, 2, 3]) R.push({ b: o + t, d: 1, m: C5, h: 'R', f: 3 });
    R.push({ b: o + 4, d: 1, m: B4, h: 'R', f: 2 }, { b: o + 5, d: 1, m: B4, h: 'R', f: 2 }, { b: o + 6, d: 2, m: C5, h: 'R', f: 3 });
    L.push({ b: o, d: 4, m: 48, h: 'L', f: 5 }, { b: o + 4, d: 4, m: 48, h: 'L', f: 5 });
  };
  introBarPair(0); introBarPair(8);
  const LOOP_L = [[48, 55], [44, 51], [41, 48], [43, 50]]; // Cm Ab Fm G root+fifth halves
  const verseLoop = (o) => {
    LOOP_L.forEach(([r, f5], bar) => {
      const ob = o + bar * 4;
      L.push({ b: ob, d: 2, m: r, h: 'L', f: 5 }, { b: ob + 2, d: 2, m: f5, h: 'L', f: 1 });
      if (bar <= 1) { for (const t of [0, 0.5, 1, 1.5]) R.push({ b: ob + t, d: 0.5, m: C5, h: 'R', f: 3 }); R.push({ b: ob + 2.5, d: 0.5, m: C5, h: 'R', f: 3 }, { b: ob + 3, d: 1, m: C5, h: 'R', f: 3 }); }
      else if (bar === 2) { for (const t of [0, 1]) R.push({ b: ob + t, d: 1, m: C5, h: 'R', f: 3 }); R.push({ b: ob + 2, d: 1, m: Ab4, h: 'R', f: 2 }, { b: ob + 3, d: 1, m: G4, h: 'R', f: 1 }); }
      else { R.push({ b: ob, d: 1, m: B4, h: 'R', f: 2 }, { b: ob + 1, d: 1, m: B4, h: 'R', f: 2 }, { b: ob + 2, d: 1, m: C5, h: 'R', f: 3 }, { b: ob + 3, d: 1, m: G4, h: 'R', f: 1 }); }
    });
  };
  const CHORDS_R = [[60, 63, 67], [56, 60, 63], [53, 56, 60], [55, 59, 62]];
  const chorusLoop = (o) => {
    CHORDS_R.forEach((chord, bar) => {
      const ob = o + bar * 4;
      for (const m of chord) R.push({ b: ob, d: 4, m, h: 'R' });
      L.push({ b: ob, d: 4, m: [48, 44, 41, 43][bar], h: 'L', f: 5 });
    });
  };
  verseLoop(16); verseLoop(32);
  chorusLoop(48); chorusLoop(64);
  verseLoop(80); verseLoop(96);
  chorusLoop(112); chorusLoop(128);
  R.push({ b: 144, d: 4, m: C5, h: 'R', f: 3 });
  L.push({ b: 144, d: 4, m: 36, h: 'L', f: 5 });
  return [...R, ...L];
}

// Empire State of Mind: verified via Hooktheory API (F# major event data),
// Piano Letters PDF (chorus letters, note-for-note match), UG chords (capo
// cross-check) and UG note tab (riff voicings). Transposed to C for reading.
function empireNotes() {
  const R = [], L = [];
  const stabBar = (o, chord, root) => {
    for (const t of [0, 1, 1.5, 2.5, 3, 3.5]) {
      const d = t === 1.5 ? 1 : t === 0 ? 1 : 0.5;
      for (const m of chord) R.push({ b: o + t, d, m, h: 'R' });
    }
    L.push({ b: o, d: 4, m: root, h: 'L', f: 5 });
  };
  const C_TRIAD = [64, 67, 72], FMAJ7 = [69, 72, 76], E_TRIAD = [68, 71, 76], G_TRIAD = [67, 71, 74];
  // intro: the high-plink figure (HT instrumental, octave placed for hands)
  const plinkPair = (o) => {
    for (const [t, d] of [[0, 0.5], [0.5, 0.5], [1, 1], [2, 1], [3, 1]]) R.push({ b: o + t, d, m: 72, h: 'R', f: 3 });
    L.push({ b: o, d: 4, m: 53, h: 'L', f: 5 });
    for (const [t, d] of [[0, 0.5], [0.5, 0.5], [1, 1]]) R.push({ b: o + 4 + t, d, m: 72, h: 'R', f: 3 });
    L.push({ b: o + 4, d: 2, m: 48, h: 'L', f: 5 });
    L.push({ b: o + 6, d: 0.5, m: 48, h: 'L', f: 5 });
    L.push({ b: o + 6.5, d: 0.5, m: 47, h: 'L', f: 1 });
    L.push({ b: o + 7, d: 1, m: 41, h: 'L', f: 5 });
  };
  plinkPair(0); plinkPair(8);
  // verse: the staccato stab riff, C to Fmaj7 (UG tab voicing, transposed)
  for (let bar = 0; bar < 8; bar++) {
    stabBar(16 + bar * 4, bar % 2 ? FMAJ7 : C_TRIAD, bar % 2 ? 53 : 48);
  }
  // pre-chorus turn: III then V (chart's G# and B passing chords, in C)
  stabBar(48, E_TRIAD, 40);
  stabBar(52, G_TRIAD, 43);
  // chorus: verified melody over F G Am E, two 4-bar phrases
  const mel = (b, d, m, f) => R.push({ b, d, m, h: 'R', f });
  const CH = 56;
  mel(CH + 2.5, 0.5, 55, 1); mel(CH + 3, 1, 62, 2); mel(CH + 4.5, 2.5, 64, 3);
  mel(CH + 8, 0.5, 62, 2); mel(CH + 8.5, 0.5, 64, 3); mel(CH + 9, 0.5, 64, 3); mel(CH + 9.5, 0.5, 64, 3);
  mel(CH + 10, 0.5, 64, 3); mel(CH + 10.5, 0.5, 64, 3); mel(CH + 11, 0.5, 62, 2); mel(CH + 11.5, 1, 67, 5);
  mel(CH + 12.5, 1, 64, 3);
  mel(CH + 16, 1, 64, 3); mel(CH + 17, 0.5, 64, 3); mel(CH + 17.5, 0.5, 64, 3); mel(CH + 18, 0.5, 64, 3);
  mel(CH + 18.5, 0.5, 62, 2); mel(CH + 19, 1.5, 67, 5);
  mel(CH + 21, 0.5, 60, 1); mel(CH + 21.5, 0.5, 60, 1); mel(CH + 22, 0.5, 60, 1); mel(CH + 22.5, 0.5, 62, 2);
  mel(CH + 23, 2, 64, 3);
  mel(CH + 26, 1, 62, 2); mel(CH + 27, 2, 60, 1);
  const chorusBass = [[41, 48], [43, 50], [45, 52], [40, 47]];
  for (let loop = 0; loop < 2; loop++) {
    chorusBass.forEach(([r, f5], bar) => {
      const o = CH + loop * 16 + bar * 4;
      L.push({ b: o, d: 2, m: r, h: 'L', f: 5 }, { b: o + 2, d: 2, m: f5, h: 'L', f: 1 });
    });
  }
  // riff outro + final chord
  stabBar(88, C_TRIAD, 48);
  stabBar(92, FMAJ7, 53);
  for (const m of C_TRIAD) R.push({ b: 96, d: 4, m, h: 'R' });
  L.push({ b: 96, d: 4, m: 36, h: 'L', f: 5 });
  L.sort((a, b2) => a.b - b2.b);
  R.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

function empireEasyNotes() {
  const R = [], L = [];
  const plink = (o) => {
    for (const [t, d] of [[0, 0.5], [0.5, 0.5], [1, 1], [2, 1], [3, 1]]) R.push({ b: o + t, d, m: 72, h: 'R', f: 3 });
    L.push({ b: o, d: 4, m: 53, h: 'L', f: 5 });
  };
  plink(0); plink(4);
  for (let bar = 0; bar < 4; bar++) {
    const o = 8 + bar * 4;
    const top = bar % 2 ? 69 : 72; // single top note of each stab chord
    for (const t of [0, 1, 1.5, 2.5, 3]) R.push({ b: o + t, d: t === 0 ? 1 : 0.5, m: top, h: 'R', f: top === 72 ? 5 : 3 });
    L.push({ b: o, d: 4, m: bar % 2 ? 53 : 48, h: 'L', f: 5 });
  }
  return [...R, ...L];
}

// Faded: verified via letter-note line notation (hook arpeggio tops over the
// D#m-B-F#-C# loop; the fourth group's E# confirms the C# chord) + UG/Hooktheory
// key cross-checks. Transposed to Am: hook C-C-C-E / A-A-A-G / E×4 / B×4
// over Am-F-C-G, all white keys.
function fadedNotes() {
  const R = [], L = [];
  const HOOK = [
    { root: [45, 52], notes: [60, 60, 60, 64], f: [1, 1, 1, 3] }, // Am: C C C E
    { root: [41, 48], notes: [69, 69, 69, 67], f: [5, 5, 5, 4] }, // F:  A A A G
    { root: [48, 55], notes: [64, 64, 64, 64], f: [3, 3, 3, 3] }, // C:  E E E E
    { root: [43, 50], notes: [59, 59, 59, 59], f: [1, 1, 1, 1] }, // G:  B B B B
  ];
  // sparse intro: quarters, whole-note bass
  HOOK.forEach((bar, i) => {
    const o = i * 4;
    bar.notes.forEach((m, j) => R.push({ b: o + j, d: 1, m, h: 'R', f: bar.f[j] }));
    L.push({ b: o, d: 4, m: bar.root[0], h: 'L', f: 5 });
  });
  // pulsing hook: driving eighths, root+fifth halves, twice through
  const pulse = (o) => {
    HOOK.forEach((bar, i) => {
      const ob = o + i * 4;
      for (let k = 0; k < 8; k++) {
        const m = k < 5 ? bar.notes[0] : bar.notes[3];
        R.push({ b: ob + k * 0.5, d: 0.5, m, h: 'R', f: k < 5 ? bar.f[0] : bar.f[3] });
      }
      L.push({ b: ob, d: 2, m: bar.root[0], h: 'L', f: 5 });
      L.push({ b: ob + 2, d: 2, m: bar.root[1], h: 'L', f: 1 });
    });
  };
  pulse(16);
  pulse(32);
  // sparse reprise + final Am
  HOOK.forEach((bar, i) => {
    const o = 48 + i * 4;
    bar.notes.forEach((m, j) => R.push({ b: o + j, d: 1, m, h: 'R', f: bar.f[j] }));
    L.push({ b: o, d: 4, m: bar.root[0], h: 'L', f: 5 });
  });
  for (const m of [60, 64, 69]) R.push({ b: 64, d: 4, m, h: 'R' });
  L.push({ b: 64, d: 4, m: 45, h: 'L', f: 5 });
  return [...R, ...L];
}

// How to Save a Life: verified via pianoletternotes line notation (the F-D-F
// riff over Bb->A bass), noobnotes vocal letters, UG chords (I-V/7-vi-V loop).
// Transposed Bb->C: riff G-E-G with D5 color over C->B bass.
function fraySaveNotes() {
  const R = [], L = [];
  // The intro per Hooktheory's event data (transposed Bb->C): constant G-E-G
  // background cells with a RISING top voice on the downbeats (C5, D5, E5,
  // then B4 pushing to D5) over C | Em7/B harmony. The rising line is the
  // hook Craig correctly heard missing.
  const riffBar = (o, top, bass, push) => {
    R.push({ b: o, d: 0.5, m: top, h: 'R', f: 5 });
    R.push({ b: o + 0.5, d: 0.5, m: 67, h: 'R', f: 3 }, { b: o + 1, d: 0.5, m: 64, h: 'R', f: 1 });
    if (push) {
      R.push({ b: o + 1.5, d: 0.5, m: 67, h: 'R', f: 3 }, { b: o + 2, d: 0.5, m: 74, h: 'R', f: 5 });
      R.push({ b: o + 2.5, d: 0.5, m: 67, h: 'R', f: 3 });
    } else {
      R.push({ b: o + 1.5, d: 1, m: 67, h: 'R', f: 3 }, { b: o + 2.5, d: 0.5, m: 67, h: 'R', f: 3 });
    }
    R.push({ b: o + 3, d: 0.5, m: 64, h: 'R', f: 1 }, { b: o + 3.5, d: 0.5, m: 67, h: 'R', f: 3 });
    L.push({ b: o, d: 4, m: bass, h: 'L', f: bass === 47 ? 4 : 5 });
  };
  riffBar(0, 72, 48); riffBar(4, 74, 47); riffBar(8, 76, 48); riffBar(12, 71, 47, true);
  // verse: vocal melody (noobnotes, transposed) over C - G/B - Am - G
  const VERSE_L = [[48, 55], [47, 50], [45, 52], [43, 50]];
  const verseLoop = (o, second) => {
    VERSE_L.forEach(([r, f5], bar) => {
      const ob = o + bar * 4;
      L.push({ b: ob, d: 2, m: r, h: 'L', f: 5 }, { b: ob + 2, d: 2, m: f5, h: 'L', f: 1 });
    });
    const m8 = (ob, ms) => ms.forEach((m, i) => { if (m) R.push({ b: ob + i * 0.5, d: 0.5, m, h: 'R' }); });
    m8(o, [62, 64, 67, 67, 67, 67, 65, 65]);            // step one you say we need to talk
    m8(o + 4, [64, 64, 67, 0, 67, 0, 0, 0]);            // he walks, you say
    m8(o + 8, [67, 67, 65, 65, 64, 0, 60, 0]);          // sit down it's just a talk
    if (!second) m8(o + 12, [60, 0, 67, 67, 65, 65, 64, 64]); // smile politely back at you
    else m8(o + 12, [64, 64, 62, 62, 60, 0, 60, 0]);    // window to your right
  };
  verseLoop(16, false); verseLoop(32, true);
  // chorus: "where did I go wrong..." (noobnotes letters, transposed) over F-G-Am-G
  const CHORUS_L = [[41, 48], [43, 50], [45, 52], [43, 50]];
  const chorusLoop = (o, second) => {
    CHORUS_L.forEach(([r, f5], bar) => {
      const ob = o + bar * 4;
      L.push({ b: ob, d: 2, m: r, h: 'L', f: 5 }, { b: ob + 2, d: 2, m: f5, h: 'L', f: 1 });
    });
    const m8 = (ob, ms) => ms.forEach((m, i) => { if (m) R.push({ b: ob + i * 0.5, d: 0.5, m, h: 'R' }); });
    m8(o, [72, 72, 72, 72, 74, 74, 72, 72]);            // where did I go wrong, I
    m8(o + 4, [72, 72, 74, 74, 76, 74, 71, 72]);        // lost a friend somewhere along
    m8(o + 8, [74, 74, 72, 74, 72, 74, 76, 72]);        // in the bitterness
    if (!second) m8(o + 12, [76, 74, 76, 79, 76, 74, 71, 72]); // and I would have stayed up
    else { R.push({ b: o + 12, d: 1, m: 72, h: 'R', f: 3 }, { b: o + 13, d: 1, m: 79, h: 'R', f: 5 }, { b: o + 14, d: 1, m: 74, h: 'R', f: 2 }, { b: o + 15, d: 1, m: 72, h: 'R', f: 1 }); }
  };
  chorusLoop(48, false); chorusLoop(64, true);
  riffBar(80, 72, 48); riffBar(84, 74, 47);
  for (const m of [64, 67, 72]) R.push({ b: 88, d: 4, m, h: 'R' });
  L.push({ b: 88, d: 4, m: 36, h: 'L', f: 5 });
  R.sort((a, b2) => a.b - b2.b);
  L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

SONGS.push(
  {
    id: 'faded', group: 'faded', level: 'Medium',
    title: 'Faded', composer: 'Alan Walker · easy-key arrangement (Am)',
    bpm: 90, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Sparse hook', startBeat: 0, endBeat: 16 },
      { name: 'Pulse', startBeat: 16, endBeat: 32 },
      { name: 'Pulse 2', startBeat: 32, endBeat: 48 },
      { name: 'Reprise + end', startBeat: 48, endBeat: 68 },
    ],
    notes: fadedNotes(),
  },
  {
    id: 'faded-easy', group: 'faded', level: 'Easy',
    title: 'Faded', composer: 'Alan Walker · easy arrangement',
    bpm: 78, timeSig: [4, 4], beatUnit: 4,
    sections: [{ name: 'The hook', startBeat: 0, endBeat: 16 }],
    notes: fadedNotes().filter((n) => n.b < 16),
  },
  {
    id: 'fray-save-a-life', group: 'fray-save-a-life', level: 'Medium',
    title: 'How to Save a Life', composer: 'The Fray · easy-key arrangement (C)',
    bpm: 110, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Intro riff', startBeat: 0, endBeat: 16 },
      { name: 'Verse', startBeat: 16, endBeat: 48 },
      { name: 'Chorus (Where did I go wrong…)', startBeat: 48, endBeat: 80 },
      { name: 'Outro', startBeat: 80, endBeat: 92 },
    ],
    notes: fraySaveNotes(),
  },
  {
    id: 'fray-save-a-life-easy', group: 'fray-save-a-life', level: 'Easy',
    title: 'How to Save a Life', composer: 'The Fray · easy arrangement',
    bpm: 90, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'The riff', startBeat: 0, endBeat: 8 },
      { name: 'Verse melody', startBeat: 8, endBeat: 24 },
    ],
    notes: (() => {
      const full = fraySaveNotes();
      const R = [
        ...full.filter((n) => n.h === 'R' && n.b < 8),
        ...full.filter((n) => n.h === 'R' && n.b >= 16 && n.b < 32).map((n) => ({ ...n, b: n.b - 8 })),
      ];
      const L = [
        ...full.filter((n) => n.h === 'L' && n.b < 8),
        ...[48, 47, 45, 43].map((m, i) => ({ b: 8 + i * 4, d: 4, m, h: 'L', f: 5 })),
      ];
      return [...R, ...L];
    })(),
  },
  {
    id: 'empire', group: 'empire', level: 'Medium',
    title: 'Empire State of Mind', composer: 'Alicia Keys / Jay-Z · easy-key arrangement (C)',
    bpm: 87, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Intro plinks', startBeat: 0, endBeat: 16 },
      { name: 'Verse riff', startBeat: 16, endBeat: 48 },
      { name: 'The turn', startBeat: 48, endBeat: 56 },
      { name: 'Chorus (New York…)', startBeat: 56, endBeat: 88 },
      { name: 'Outro', startBeat: 88, endBeat: 100 },
    ],
    notes: empireNotes(),
  },
  {
    id: 'empire-easy', group: 'empire', level: 'Easy',
    title: 'Empire State of Mind', composer: 'Alicia Keys · easy arrangement',
    bpm: 80, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Intro plinks', startBeat: 0, endBeat: 8 },
      { name: 'The riff', startBeat: 8, endBeat: 24 },
    ],
    notes: empireEasyNotes(),
  },
  {
    id: 'pirates', group: 'pirates', level: 'Medium',
    title: "He's a Pirate (Pirates of the Caribbean)", composer: 'Klaus Badelt / Hans Zimmer',
    bpm: 150, timeSig: [3, 4], beatUnit: 4,
    sections: [
      { name: 'Theme', startBeat: 0, endBeat: 9 },
      { name: 'Theme again', startBeat: 9, endBeat: 18 },
      { name: 'The turn', startBeat: 18, endBeat: 27 },
      { name: 'The climb', startBeat: 27, endBeat: 36 },
    ],
    notes: piratesNotes(),
  },
  {
    id: 'pirates-easy', group: 'pirates', level: 'Easy',
    title: "He's a Pirate (Pirates of the Caribbean)", composer: 'Klaus Badelt · easy arrangement',
    bpm: 110, timeSig: [3, 4], beatUnit: 4,
    sections: [
      { name: 'Theme', startBeat: 0, endBeat: 9 },
      { name: 'Theme again', startBeat: 9, endBeat: 18 },
    ],
    notes: piratesNotes().filter((n) => n.h === 'R' && n.b < 18),
  },
  {
    id: 'river', group: 'river', level: 'Medium',
    title: 'River Flows in You', composer: 'Yiruma · simplified arrangement',
    bpm: 68, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Loop 1', startBeat: 0, endBeat: 16 },
      { name: 'Loop 2', startBeat: 16, endBeat: 32 },
      { name: 'Loop 3', startBeat: 32, endBeat: 48 },
      { name: 'Loop 4 + end', startBeat: 48, endBeat: 68 },
    ],
    notes: riverNotes(),
  },
  {
    id: 'river-easy', group: 'river', level: 'Easy',
    title: 'River Flows in You', composer: 'Yiruma · easy arrangement',
    bpm: 60, timeSig: [4, 4], beatUnit: 4,
    sections: [{ name: 'The loop', startBeat: 0, endBeat: 16 }],
    notes: riverNotes().filter((n) => n.b < 16 && (n.h === 'R' || n.b % 4 === 0)),
  },
  {
    id: 'piano-man', group: 'piano-man', level: 'Medium',
    title: 'Piano Man', composer: 'Billy Joel',
    bpm: 130, timeSig: [3, 4], beatUnit: 4,
    sections: [
      { name: 'First phrase', startBeat: 0, endBeat: 12 },
      { name: 'Answer phrase', startBeat: 12, endBeat: 27 },
    ],
    notes: pianoManNotes(),
  },
  {
    id: 'piano-man-easy', group: 'piano-man', level: 'Easy',
    title: 'Piano Man', composer: 'Billy Joel · easy arrangement',
    bpm: 110, timeSig: [3, 4], beatUnit: 4,
    sections: [{ name: 'First phrase', startBeat: 0, endBeat: 12 }],
    notes: pianoManNotes().filter((n) => n.h === 'R' && n.b < 12),
  },
  {
    id: 'gangstas-paradise', group: 'gangstas-paradise', level: 'Medium',
    title: "Gangsta's Paradise", composer: 'Coolio / Stevie Wonder',
    bpm: 80, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Intro', startBeat: 0, endBeat: 16 },
      { name: 'Verse', startBeat: 16, endBeat: 48 },
      { name: 'Chorus (chords)', startBeat: 48, endBeat: 80 },
      { name: 'Verse 2', startBeat: 80, endBeat: 112 },
      { name: 'Chorus 2 + end', startBeat: 112, endBeat: 148 },
    ],
    notes: gangstasNotes(),
  },
  {
    id: 'gangstas-paradise-easy', group: 'gangstas-paradise', level: 'Easy',
    title: "Gangsta's Paradise", composer: 'Coolio · easy arrangement',
    bpm: 75, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Intro', startBeat: 0, endBeat: 16 },
      { name: 'One verse loop', startBeat: 16, endBeat: 32 },
    ],
    notes: gangstasNotes().filter((n) => n.b < 32 && (n.h === 'R' || n.d >= 2)),
  },
);

// ---- Technique drills: scales with correct fingering, trainer-compatible ----
function scaleFromSteps(rootR, rootL, steps, fUpR, fUpL) {
  const notes = [];
  const up = steps.map((s, i) => ({ off: s, fr: fUpR[i], fl: fUpL[i] }));
  const down = [...up].reverse().slice(1);
  [...up, ...down].forEach((x, i) => {
    notes.push({ b: i, d: 1, m: rootR + x.off, h: 'R', f: x.fr });
    notes.push({ b: i, d: 1, m: rootL + x.off, h: 'L', f: x.fl });
  });
  return notes;
}
const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12];
const NAT_MINOR = [0, 2, 3, 5, 7, 8, 10, 12];
const R_FING = [1, 2, 3, 1, 2, 3, 4, 5];
const L_FING = [5, 4, 3, 2, 1, 3, 2, 1];

SONGS.push(
  {
    id: 'scale-c-major',
    title: 'C Major Scale',
    composer: 'Technique drill · one octave, both hands',
    bpm: 70,
    timeSig: [4, 4],
    beatUnit: 4,
    sections: [
      { name: 'Going up', startBeat: 0, endBeat: 8 },
      { name: 'Coming down', startBeat: 8, endBeat: 15 },
    ],
    notes: scaleFromSteps(60, 48, MAJOR, R_FING, L_FING),
  },
  {
    id: 'scale-a-minor',
    title: 'A Minor Scale',
    composer: 'Technique drill · one octave, both hands',
    bpm: 70,
    timeSig: [4, 4],
    beatUnit: 4,
    sections: [
      { name: 'Going up', startBeat: 0, endBeat: 8 },
      { name: 'Coming down', startBeat: 8, endBeat: 15 },
    ],
    notes: scaleFromSteps(57, 45, NAT_MINOR, R_FING, L_FING),
  },
);

// ---- 12-key fluency ladder (mastery item 10b, council 08-24) ----
// All 12 major + 12 natural-minor scales as trainer-compatible drills.
// Fingerings VERIFIED 2026-08-24 against pianoscales.org's per-key charts
// (majors + natural minors), with Bb major RH resolved to the ABRSM 4-start
// (cross-checked masterpiano.com and piano.org). Descent mirrors ascent:
// each finger stays attached to its note, which scaleFromSteps already does.
// C major and A minor stay the two original drill entries above (their
// practice history lives on those ids); LADDER maps every key to its song id.
const LADDER_DEFS = [
  // [displayName, mode, slug, rootR, RH ascent, LH ascent]
  ['C', 'major', 'c', 60, [1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['Db', 'major', 'db', 61, [2, 3, 1, 2, 3, 4, 1, 2], [3, 2, 1, 4, 3, 2, 1, 3]],
  ['D', 'major', 'd', 62, [1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['Eb', 'major', 'eb', 63, [3, 1, 2, 3, 4, 1, 2, 3], [3, 2, 1, 4, 3, 2, 1, 3]],
  ['E', 'major', 'e', 64, [1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['F', 'major', 'f', 65, [1, 2, 3, 4, 1, 2, 3, 4], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['F#', 'major', 'fs', 66, [2, 3, 4, 1, 2, 3, 1, 2], [4, 3, 2, 1, 3, 2, 1, 4]],
  ['G', 'major', 'g', 55, [1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['Ab', 'major', 'ab', 56, [3, 4, 1, 2, 3, 1, 2, 3], [3, 2, 1, 4, 3, 2, 1, 3]],
  ['A', 'major', 'a', 57, [1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['Bb', 'major', 'bb', 58, [4, 1, 2, 3, 1, 2, 3, 4], [3, 2, 1, 4, 3, 2, 1, 3]],
  ['B', 'major', 'b', 59, [1, 2, 3, 1, 2, 3, 4, 5], [4, 3, 2, 1, 4, 3, 2, 1]],
  ['A', 'minor', 'a', 57, [1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['Bb', 'minor', 'bb', 58, [2, 1, 2, 3, 1, 2, 3, 4], [2, 1, 3, 2, 1, 4, 3, 2]],
  ['B', 'minor', 'b', 59, [1, 2, 3, 1, 2, 3, 4, 5], [4, 3, 2, 1, 4, 3, 2, 1]],
  ['C', 'minor', 'c', 60, [1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['C#', 'minor', 'cs', 61, [3, 4, 1, 2, 3, 1, 2, 3], [3, 2, 1, 4, 3, 2, 1, 3]],
  ['D', 'minor', 'd', 62, [1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['Eb', 'minor', 'eb', 63, [3, 1, 2, 3, 4, 1, 2, 3], [2, 1, 4, 3, 2, 1, 3, 2]],
  ['E', 'minor', 'e', 64, [1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['F', 'minor', 'f', 65, [1, 2, 3, 4, 1, 2, 3, 4], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['F#', 'minor', 'fs', 66, [2, 3, 1, 2, 3, 1, 2, 3], [4, 3, 2, 1, 3, 2, 1, 4]],
  ['G', 'minor', 'g', 55, [1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]],
  ['G#', 'minor', 'gs', 56, [3, 4, 1, 2, 3, 1, 2, 3], [3, 2, 1, 3, 2, 1, 4, 3]],
];

export const LADDER = []; // {key, mode, id} for every one of the 24
for (const [keyName, mode, slug, rootR, rh, lh] of LADDER_DEFS) {
  const id = `scale-${slug}-${mode}`;
  const existingId = (mode === 'major' && slug === 'c') ? 'scale-c-major'
    : (mode === 'minor' && slug === 'a') ? 'scale-a-minor' : null;
  LADDER.push({ key: keyName, mode, id: existingId ?? id });
  if (existingId) continue; // C major + A minor already exist above
  SONGS.push({
    id,
    title: `${keyName} ${mode === 'major' ? 'Major' : 'Minor'} Scale`,
    composer: 'Technique drill · one octave, both hands',
    bpm: 70,
    timeSig: [4, 4],
    beatUnit: 4,
    ladder: true, // ladder-only: surfaced on the 12-keys grid, not the library
    sections: [
      { name: 'Going up', startBeat: 0, endBeat: 8 },
      { name: 'Coming down', startBeat: 8, endBeat: 15 },
    ],
    notes: scaleFromSteps(rootR, rootR - 12, mode === 'major' ? MAJOR : NAT_MINOR, rh, lh),
  });
}

// ---- arpeggio ladder (Mark 2026-08-28: "exercises for arpeggios moving up
// and down the keyboard"). Two octaves up and down, both hands in parallel,
// all 12 keys × major/minor. The note patterns are plain triad theory
// (root-3rd-5th through two octaves); FINGERING IS DELIBERATELY OMITTED: 
// the scale ladder's fingerings were source-verified and no equally
// verifiable arpeggio-fingering source was reachable today. Notes yes,
// guessed fingers never.
const MAJ_ARP = [0, 4, 7, 12, 16, 19, 24];
const MIN_ARP = [0, 3, 7, 12, 15, 19, 24];
// FINGERING RESTORED (Mark, 2026-08-30: "we used to have which finger we should
// be using on which note ... it was useful just so I would know correct hand
// placement and could build good habits. Can you make sure this is in every
// single zone").
//
// The note above says no verifiable source was reachable the day these drills
// were written, and "notes yes, guessed fingers never" still stands. This is
// not a guess. A two-octave root-position arpeggio has ONE standard fingering,
// the same textbook pedagogy as the scale fingering already verified and
// shipped in this file (RH 1-2-3-1-2-3-4-5, thumb under after the third).
// Thumb under after the third, fifth on the top, and the hands mirror:
//
//   right hand   up  1 2 3 1 2 3 5     coming down  3 2 1 3 2 1
//   left hand    up  5 3 2 1 3 2 1     coming down  2 3 1 2 3 5
//
// Written from the SHAPE rather than typed per key, so it transposes to all 24
// drills with no chance of a slip.
const ARP_FINGERS = {
  R: [1, 2, 3, 1, 2, 3, 5, 3, 2, 1, 3, 2, 1],
  L: [5, 3, 2, 1, 3, 2, 1, 2, 3, 1, 2, 3, 5],
};
function arpNotes(rootR, rootL, steps) {
  const seq = [...steps, ...steps.slice(0, -1).reverse()]; // up then down
  const notes = [];
  seq.forEach((st, i) => {
    notes.push({ b: i, d: 1, m: rootR + st, h: 'R', f: ARP_FINGERS.R[i] });
    notes.push({ b: i, d: 1, m: rootL + st, h: 'L', f: ARP_FINGERS.L[i] });
  });
  return notes;
}
for (const [keyName, mode, slug, rootR] of LADDER_DEFS) {
  const arpMode = mode === 'major' ? 'majarp' : 'minarp';
  const id = `arp-${slug}-${arpMode}`;
  LADDER.push({ key: keyName, mode: arpMode, id });
  SONGS.push({
    id,
    title: `${keyName} ${mode === 'major' ? 'Major' : 'Minor'} Arpeggio`,
    composer: 'Technique drill · two octaves, both hands',
    bpm: 66,
    timeSig: [4, 4],
    beatUnit: 4,
    ladder: true,
    sections: [
      { name: 'Going up', startBeat: 0, endBeat: 7 },
      { name: 'Coming down', startBeat: 7, endBeat: 13 },
    ],
    notes: arpNotes(rootR, rootR - 12, mode === 'major' ? MAJ_ARP : MIN_ARP),
  });
}

// ---- Hard tier (2026-08-24): cover-style arrangements. Same chord loops and
// melodic material already in the app, denser figuration: arpeggiated LH,
// octave-doubled melody, fuller voicings. My own arrangements.

// LH eighth-note arpeggio bar: root-fifth-octave-fifth, twice
function arpHalfL(o, root) {
  const pat = [root, root + 7, root + 12, root + 7];
  return pat.map((m, k) => ({ b: o + k * 0.5, d: 0.5, m, h: 'L', f: [5, 2, 1, 2][k] }));
}
function arpBarL(o, root) {
  return [...arpHalfL(o, root), ...arpHalfL(o + 2, root)];
}

function gangstasHardNotes() {
  const R = [], L = [];
  const introPair = (o) => {
    for (const t of [0, 1, 2, 3]) { R.push({ b: o + t, d: 1, m: 72, h: 'R', f: 1 }, { b: o + t, d: 1, m: 84, h: 'R', f: 5 }); }
    R.push({ b: o + 4, d: 1, m: 71, h: 'R', f: 1 }, { b: o + 4, d: 1, m: 83, h: 'R', f: 5 });
    R.push({ b: o + 5, d: 1, m: 71, h: 'R', f: 1 }, { b: o + 5, d: 1, m: 83, h: 'R', f: 5 });
    R.push({ b: o + 6, d: 2, m: 72, h: 'R', f: 1 }, { b: o + 6, d: 2, m: 84, h: 'R', f: 5 });
    L.push({ b: o, d: 4, m: 36, h: 'L', f: 5 }, { b: o, d: 4, m: 48, h: 'L', f: 1 });
    L.push({ b: o + 4, d: 4, m: 36, h: 'L', f: 5 }, { b: o + 4, d: 4, m: 48, h: 'L', f: 1 });
  };
  introPair(0); introPair(8);
  const LOOP_ROOTS = [48, 44, 41, 43];
  const verseLoop = (o) => {
    LOOP_ROOTS.forEach((root, bar) => {
      const ob = o + bar * 4;
      L.push(...arpBarL(ob, root));
      const mel = bar <= 1 ? [[0, 0.5, 72], [0.5, 0.5, 72], [1, 0.5, 72], [1.5, 0.5, 72], [2.5, 0.5, 72], [3, 1, 72]]
        : bar === 2 ? [[0, 1, 72], [1, 1, 72], [2, 1, 68], [3, 1, 67]]
        : [[0, 1, 71], [1, 1, 71], [2, 1, 72], [3, 1, 67]];
      for (const [t, d, m] of mel) { R.push({ b: ob + t, d, m, h: 'R', f: 2 }, { b: ob + t, d, m: m + 12, h: 'R', f: 5 }); }
    });
  };
  // Chorus: the choir melody itself, octave-doubled (verified against the
  // pianoletternotes hard-version transcription, 2026-08-24, was chord stabs).
  const CHOIR = [
    [[0.5, 0.5, 75], [1, 0.5, 77], [1.5, 0.5, 75], [2, 0.5, 74], [2.5, 0.5, 72], [3, 1, 72]],
    [[0, 0.5, 72], [0.5, 0.5, 72], [1, 0.5, 74], [1.5, 0.5, 72], [2, 0.5, 71], [2.5, 1.5, 67]],
    [[0, 0.5, 67], [1, 1, 74], [2, 1, 75], [3, 1, 74]],
    [[0, 1, 70], [1, 3, 72]],
  ];
  const chorusLoop = (o) => {
    CHOIR.forEach((bar, i) => {
      const ob = o + i * 4;
      melBarOct(R, ob, bar, 12);
      L.push(...arpBarL(ob, LOOP_ROOTS[i]));
    });
  };
  verseLoop(16); verseLoop(32);
  chorusLoop(48); chorusLoop(64);
  verseLoop(80);
  chorusLoop(96);
  introPair(112);
  for (const m of [60, 63, 67, 72]) R.push({ b: 120, d: 4, m, h: 'R' });
  L.push({ b: 120, d: 4, m: 36, h: 'L', f: 5 }, { b: 120, d: 4, m: 43, h: 'L', f: 2 });
  return [...R, ...L];
}

function fadedHardNotes() {
  const R = [], L = [];
  const BARS = [
    { root: 45, chord: [60, 64, 69], top: [72, 72, 72, 76] }, // voicings sit an octave
    { root: 41, chord: [57, 60, 65], top: [81, 81, 81, 79] }, // clear of the LH pattern
    { root: 48, chord: [60, 64, 67], top: [76, 76, 76, 76] },
    { root: 43, chord: [59, 62, 67], top: [71, 71, 71, 71] },
  ];
  const broken = (o) => {
    BARS.forEach((bar, i) => {
      const ob = o + i * 4;
      const [a, b2, c] = bar.chord;
      const pat = [a, c, b2, c, a, c, b2, c];
      pat.forEach((m, k) => R.push({ b: ob + k * 0.5, d: 0.5, m, h: 'R', f: [1, 5, 3, 5][k % 4] }));
      L.push({ b: ob, d: 2, m: bar.root, h: 'L', f: 5 });
      L.push({ b: ob + 2, d: 2, m: bar.root + 7, h: 'L', f: 1 });
    });
  };
  const bigHook = (o) => {
    BARS.forEach((bar, i) => {
      const ob = o + i * 4;
      bar.top.forEach((m, j) => { R.push({ b: ob + j, d: 1, m: m - 12, h: 'R', f: 1 }, { b: ob + j, d: 1, m, h: 'R', f: 5 }); });
      L.push(...arpBarL(ob, bar.root));
    });
  };
  broken(0); broken(16);
  bigHook(32); bigHook(48);
  broken(64);
  for (const m of [57, 60, 64, 69]) R.push({ b: 80, d: 4, m, h: 'R' });
  L.push({ b: 80, d: 4, m: 33, h: 'L', f: 5 }, { b: 80, d: 4, m: 45, h: 'L', f: 1 });
  return [...R, ...L];
}

function riverHardNotes() {
  const R = [], L = [];
  const BARS = [
    { root: 45, mel: [72, 71, 72, 71], third: [69, 67, 69, 67] },
    { root: 41, mel: [72, 67, 72, 67], third: [69, 64, 69, 64] },
    { root: 48, mel: [72, 71, 72, 71], third: [67, 67, 67, 67] },
    { root: 43, mel: [72, 67, 72, 71], third: [67, 62, 67, 67] },
  ];
  for (let loop = 0; loop < 4; loop++) {
    BARS.forEach((bar, i) => {
      const o = loop * 16 + i * 4;
      bar.mel.forEach((m, j) => {
        R.push({ b: o + j, d: 1, m, h: 'R', f: 4 });
        R.push({ b: o + j, d: 1, m: bar.third[j], h: 'R', f: 1 });
      });
      L.push(...arpBarL(o, bar.root));
    });
  }
  for (const m of [69, 72, 76, 81]) R.push({ b: 64, d: 4, m, h: 'R' });
  L.push({ b: 64, d: 4, m: 33, h: 'L', f: 5 }, { b: 64, d: 4, m: 45, h: 'L', f: 1 });
  return [...R, ...L];
}

function stillDreHardNotes() {
  const R = [], L = [];
  const AM = [[72, 1], [76, 2], [81, 5]], ESUS = [[71, 1], [76, 2], [81, 5]], EM = [[71, 1], [76, 2], [79, 4]];
  for (let loop = 0; loop < 8; loop++) {
    const o = loop * 8;
    for (let i = 0; i < 8; i++) for (const [m, f] of AM) R.push({ b: o + i * 0.5, d: 0.5, m, h: 'R', f });
    for (const t of [0, 0.5, 1]) for (const [m, f] of ESUS) R.push({ b: o + 4 + t, d: 0.5, m, h: 'R', f });
    for (const t of [1.5, 2, 2.5, 3, 3.5]) for (const [m, f] of EM) R.push({ b: o + 4 + t, d: 0.5, m, h: 'R', f });
    // the cover move: octave-bounce bass in eighths
    for (let i = 0; i < 8; i++) L.push({ b: o + i * 0.5, d: 0.5, m: i % 2 ? 57 : 45, h: 'L', f: i % 2 ? 1 : 5 });
    for (let i = 0; i < 6; i++) L.push({ b: o + 4 + i * 0.5, d: 0.5, m: i % 2 ? 52 : 40, h: 'L', f: i % 2 ? 1 : 5 });
    L.push({ b: o + 7, d: 0.5, m: 47, h: 'L', f: 5 }, { b: o + 7.5, d: 0.5, m: 59, h: 'L', f: 1 });
  }
  for (const m of [57, 60, 64, 69]) R.push({ b: 64, d: 4, m, h: 'R' });
  L.push({ b: 64, d: 4, m: 33, h: 'L', f: 5 }, { b: 64, d: 4, m: 45, h: 'L', f: 1 });
  return [...R, ...L];
}

function gotHardNotes() {
  const R = [], L = [];
  const cell = (arr, out, b, h, up = 0) => {
    out.push({ b, d: 1, m: arr[0] + up, h });
    out.push({ b: b + 1, d: 1, m: arr[1] + up, h });
    out.push({ b: b + 2, d: 0.5, m: arr[2] + up, h });
    out.push({ b: b + 2.5, d: 0.5, m: arr[3] + up, h });
  };
  const gL = [55, 48, 51, 53], fL = [53, 46, 51, 50];
  const gR = [67, 60, 63, 65], fR = [65, 58, 63, 62];
  const octaveMel = (arr, b, up) => {
    cell(arr, R, b, 'R', up);
    cell(arr, R, b, 'R', up + 12);
  };
  for (const b of [0, 3, 6, 9]) cell(gL, L, b, 'L');
  const themePass = (o, up) => {
    for (const b of [o, o + 3, o + 6]) octaveMel(gR, b, up);
    R.push({ b: o + 9, d: 3, m: 62 + up, h: 'R' }, { b: o + 9, d: 3, m: 74 + up, h: 'R' });
    for (const b of [o + 12, o + 15, o + 18]) octaveMel(fR, b, up);
    R.push({ b: o + 21, d: 3, m: 60 + up, h: 'R' }, { b: o + 21, d: 3, m: 72 + up, h: 'R' });
    for (const b of [o, o + 3, o + 6, o + 9]) cell(gL, L, b, 'L');
    for (const b of [o + 12, o + 15, o + 18, o + 21]) cell(fL, L, b, 'L');
  };
  themePass(12, 0);
  themePass(36, 12);
  // low turn in octaves over root+fifth halves
  for (const o of [60, 66]) {
    [[68, 65, 60], [65, 67, 60]].forEach((seq, half) => {
      seq.forEach((m, j) => {
        R.push({ b: o + half * 3 + j, d: 1, m, h: 'R' }, { b: o + half * 3 + j, d: 1, m: m + 12, h: 'R' });
      });
    });
    L.push({ b: o, d: 1.5, m: 41, h: 'L', f: 5 }, { b: o + 1.5, d: 1.5, m: 48, h: 'L', f: 1 });
    L.push({ b: o + 3, d: 1.5, m: 48, h: 'L', f: 5 }, { b: o + 4.5, d: 1.5, m: 55, h: 'L', f: 1 });
  }
  themePass(72, 12);
  for (const m of [60, 63, 67, 72]) R.push({ b: 96, d: 3, m, h: 'R' });
  L.push({ b: 96, d: 3, m: 36, h: 'L', f: 5 }, { b: 96, d: 3, m: 43, h: 'L', f: 1 });
  R.sort((a, b2) => a.b - b2.b);
  L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

function runawayHardNotes() {
  const R = [], L = [];
  for (let i = 0; i < 8; i++) { R.push({ b: i, d: 1, m: 76, h: 'R', f: 1 }, { b: i, d: 1, m: 88, h: 'R', f: 5 }); }
  const phrase = (o) => {
    const seq = [[0, 76], [1, 76], [2, 76], [4, 75], [5, 75], [6, 75], [7, 75], [8, 73], [9, 73], [10, 73], [11, 73], [12, 69], [13, 69], [14, 68], [15, 64]];
    for (const [t, m] of seq) { R.push({ b: o + t, d: 1, m, h: 'R' }, { b: o + t, d: 1, m: m - 12, h: 'R' }); }
    [[0, 40], [4, 39], [8, 37], [12, 33]].forEach(([t, root]) => L.push(...arpBarL(o + t, root)));
  };
  phrase(8);
  phrase(24);
  // chorus figure over octave-bounce bass
  for (let bar = 0; bar < 4; bar++) {
    const o = 40 + bar * 4;
    R.push({ b: o, d: 1, m: 64, h: 'R', f: 1 });
    R.push({ b: o + 1, d: 1, m: 64, h: 'R', f: 1 }, { b: o + 1, d: 1, m: 68, h: 'R', f: 3 });
    R.push({ b: o + 2, d: 1, m: 64, h: 'R', f: 1 });
    R.push({ b: o + 3, d: 0.5, m: 68, h: 'R', f: 3 }, { b: o + 3.5, d: 0.5, m: 71, h: 'R', f: 5 });
    for (let i = 0; i < 8; i++) L.push({ b: o + i * 0.5, d: 0.5, m: i % 2 ? 52 : 40, h: 'L', f: i % 2 ? 1 : 5 });
  }
  for (const m of [64, 68, 71, 76]) R.push({ b: 56, d: 4, m, h: 'R' });
  L.push({ b: 56, d: 4, m: 28, h: 'L', f: 5 }, { b: 56, d: 4, m: 40, h: 'L', f: 1 });
  R.sort((a, b2) => a.b - b2.b);
  L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

// 3/4 arpeggio bar for the waltz-time hards: six flowing eighths
function arpBar3(o, root) {
  const L = [];
  const pat = [root, root + 7, root + 12, root + 7, root + 12, root + 7];
  pat.forEach((m, k) => L.push({ b: o + k * 0.5, d: 0.5, m, h: 'L', f: [5, 2, 1, 2, 1, 2][k] }));
  return L;
}

function piratesHardNotes() {
  const R = [], L = [];
  const run = (o, seq) => { let b = o; for (const [m, d] of seq) { if (m) { R.push({ b, d, m, h: 'R' }); R.push({ b, d, m: m + 12, h: 'R' }); } b += d; } };
  const A3 = 57, C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, Bb4 = 70, D5 = 74;
  const phraseA = [[A3, 0.5], [C4, 0.5], [D4, 0.5], [D4, 0.5], [D4, 0.5], [E4, 0.5], [F4, 0.5], [F4, 0.5], [F4, 0.5], [G4, 0.5], [E4, 0.5], [E4, 0.5], [D4, 0.5], [C4, 0.5], [C4, 0.5], [D4, 1.5]];
  run(0, phraseA);
  run(9, phraseA);
  run(18, [[A3, 0.5], [C4, 0.5], [D4, 0.5], [D4, 0.5], [D4, 0.5], [F4, 0.5], [G4, 0.5], [G4, 0.5], [G4, 0.5], [A4, 0.5], [Bb4, 0.5], [Bb4, 0.5], [A4, 0.5], [G4, 0.5], [A4, 0.5], [D4, 1.5]]);
  run(27, [[D4, 0.5], [E4, 0.5], [F4, 1], [F4, 0.5], [G4, 0.5], [A4, 1], [A4, 0.5], [G4, 0.5], [A4, 0.5], [D5, 1.5]]);
  const bass = [[0, 50], [3, 50], [6, 48], [9, 50], [12, 50], [15, 48], [18, 50], [21, 43], [24, 46], [27, 50], [30, 45]];
  for (const [b, root] of bass) L.push(...arpBar3(b, root));
  for (const m of [62, 65, 69, 74]) R.push({ b: 33, d: 3, m, h: 'R' });
  L.push({ b: 33, d: 3, m: 38, h: 'L', f: 5 }, { b: 33, d: 3, m: 50, h: 'L', f: 1 });
  R.sort((a, b2) => a.b - b2.b);
  L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

function pianoManHardNotes() {
  const R = [], L = [];
  const put = (b, d, m, f) => R.push({ b, d, m, h: 'R', f });
  const G4 = 67, F4 = 65, E4 = 64, D4 = 62, C4 = 60;
  const phrase = (o, tail) => {
    put(o, 1, G4, 5); put(o + 1, 1, G4, 5); put(o + 2, 0.5, G4, 5); put(o + 2.5, 0.5, G4, 5);
    put(o + 3, 0.5, F4, 4); put(o + 3.5, 0.5, E4, 3); put(o + 4, 0.5, F4, 4); put(o + 4.5, 0.5, E4, 3);
    put(o + 5, 1, C4, 1);
    for (const t of [6, 6.5, 7, 7.5]) put(o + t, 0.5, C4, 1);
    put(o + 8, 1, C4, 1);
    tail(o);
  };
  phrase(0, (o) => {
    put(o + 9, 0.5, D4, 2); put(o + 9.5, 0.5, E4, 3); put(o + 10, 0.5, D4, 2); put(o + 10.5, 0.5, E4, 3);
    put(o + 11, 1, F4, 4);
  });
  phrase(12, (o) => {
    put(o + 9, 1, F4, 4); put(o + 10, 1, E4, 3); put(o + 11, 1, C4, 1);
  });
  put(24, 3, C4, 1);
  // the waltz oom-pah-pah: bass root on 1, chord dyad on 2 and 3
  const bars = [[48, [64, 67]], [47, [62, 67]], [45, [60, 64]], [43, [59, 62]], [41, [60, 65]], [50, [60, 66]], [43, [59, 62]], [43, [59, 65]], [48, [64, 67]]];
  bars.forEach(([root, dyad], i) => {
    const o = i * 3;
    L.push({ b: o, d: 1, m: root, h: 'L', f: 5 });
    for (const t of [1, 2]) for (const m of dyad) L.push({ b: o + t, d: 1, m, h: 'L' });
  });
  R.sort((a, b2) => a.b - b2.b);
  L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

function empireHardNotes() {
  const R = [], L = [];
  const C_TRIAD = [64, 67, 72], FMAJ7 = [69, 72, 76], E_TRIAD = [68, 71, 76], G_TRIAD = [67, 71, 74];
  const stabBarOct = (o, chord, root) => {
    for (const t of [0, 1, 1.5, 2.5, 3, 3.5]) {
      const d = t === 1.5 || t === 0 ? 1 : 0.5;
      for (const m of chord) R.push({ b: o + t, d, m, h: 'R' });
    }
    for (let i = 0; i < 8; i++) L.push({ b: o + i * 0.5, d: 0.5, m: i % 2 ? root + 12 : root, h: 'L', f: i % 2 ? 1 : 5 });
  };
  const plinkPairOct = (o) => {
    for (const [t, d] of [[0, 0.5], [0.5, 0.5], [1, 1], [2, 1], [3, 1]]) { R.push({ b: o + t, d, m: 72, h: 'R' }, { b: o + t, d, m: 84, h: 'R' }); }
    L.push({ b: o, d: 4, m: 41, h: 'L', f: 5 }, { b: o, d: 4, m: 53, h: 'L', f: 1 });
    for (const [t, d] of [[0, 0.5], [0.5, 0.5], [1, 1]]) { R.push({ b: o + 4 + t, d, m: 72, h: 'R' }, { b: o + 4 + t, d, m: 84, h: 'R' }); }
    L.push({ b: o + 4, d: 2, m: 48, h: 'L', f: 5 });
    L.push({ b: o + 6, d: 0.5, m: 48, h: 'L', f: 5 }, { b: o + 6.5, d: 0.5, m: 47, h: 'L', f: 1 }, { b: o + 7, d: 1, m: 41, h: 'L', f: 5 });
  };
  plinkPairOct(0); plinkPairOct(8);
  for (let bar = 0; bar < 8; bar++) stabBarOct(16 + bar * 4, bar % 2 ? FMAJ7 : C_TRIAD, bar % 2 ? 41 : 36);
  stabBarOct(48, E_TRIAD, 40);
  stabBarOct(52, G_TRIAD, 43);
  // chorus melody in octaves over rolling arpeggios
  const mel = (b, d, m) => { R.push({ b, d, m, h: 'R' }, { b, d, m: m + 12, h: 'R' }); };
  const CH = 56;
  mel(CH + 2.5, 0.5, 55); mel(CH + 3, 1, 62); mel(CH + 4.5, 2.5, 64);
  mel(CH + 8, 0.5, 62); mel(CH + 8.5, 0.5, 64); mel(CH + 9, 0.5, 64); mel(CH + 9.5, 0.5, 64);
  mel(CH + 10, 0.5, 64); mel(CH + 10.5, 0.5, 64); mel(CH + 11, 0.5, 62); mel(CH + 11.5, 1, 67);
  mel(CH + 12.5, 1, 64);
  mel(CH + 16, 1, 64); mel(CH + 17, 0.5, 64); mel(CH + 17.5, 0.5, 64); mel(CH + 18, 0.5, 64);
  mel(CH + 18.5, 0.5, 62); mel(CH + 19, 1.5, 67);
  mel(CH + 21, 0.5, 60); mel(CH + 21.5, 0.5, 60); mel(CH + 22, 0.5, 60); mel(CH + 22.5, 0.5, 62);
  mel(CH + 23, 2, 64);
  mel(CH + 26, 1, 62); mel(CH + 27, 2, 60);
  [[41], [43], [45], [40]].forEach(([root], bar) => {
    L.push(...arpBarL(CH + bar * 4, root));
    L.push(...arpBarL(CH + 16 + bar * 4, root));
  });
  stabBarOct(88, C_TRIAD, 36);
  stabBarOct(92, FMAJ7, 41);
  for (const m of [60, 64, 67, 72]) R.push({ b: 96, d: 4, m, h: 'R' });
  L.push({ b: 96, d: 4, m: 24, h: 'L', f: 5 }, { b: 96, d: 4, m: 36, h: 'L', f: 1 });
  R.sort((a, b2) => a.b - b2.b);
  L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

function frayHardNotes() {
  const R = [], L = [];
  // Em/B needs its own arpeggio: B-E-G, not root+7 (F# is the wrong colour)
  const emOverB = (o) => {
    const pat = [47, 52, 55, 52];
    const out = [];
    for (let k = 0; k < 8; k++) out.push({ b: o + k * 0.5, d: 0.5, m: pat[k % 4], h: 'L', f: [5, 2, 1, 2][k % 4] });
    return out;
  };
  const riffBar = (o, top, cBass, push) => {
    R.push({ b: o, d: 0.5, m: top, h: 'R', f: 5 });
    R.push({ b: o + 0.5, d: 0.5, m: 67, h: 'R', f: 3 }, { b: o + 1, d: 0.5, m: 64, h: 'R', f: 1 });
    if (push) {
      R.push({ b: o + 1.5, d: 0.5, m: 67, h: 'R', f: 3 }, { b: o + 2, d: 0.5, m: 74, h: 'R', f: 5 });
      R.push({ b: o + 2.5, d: 0.5, m: 67, h: 'R', f: 3 });
    } else {
      R.push({ b: o + 1.5, d: 1, m: 67, h: 'R', f: 3 }, { b: o + 2.5, d: 0.5, m: 67, h: 'R', f: 3 });
    }
    R.push({ b: o + 3, d: 0.5, m: 64, h: 'R', f: 1 }, { b: o + 3.5, d: 0.5, m: 67, h: 'R', f: 3 });
    L.push(...(cBass ? arpBarL(o, 48) : emOverB(o)));
  };
  riffBar(0, 72, true); riffBar(4, 74, false); riffBar(8, 76, true); riffBar(12, 71, false, true);
  // verse melody in octaves over the arpeggio loop
  const VERSE_L = [(o) => arpBarL(o, 48), emOverB, (o) => arpBarL(o, 45), (o) => arpBarL(o, 43)];
  const m8 = (ob, ms) => ms.forEach((m, i) => { if (m) { R.push({ b: ob + i * 0.5, d: 0.5, m, h: 'R' }, { b: ob + i * 0.5, d: 0.5, m: m + 12, h: 'R' }); } });
  const verseLoop = (o, second) => {
    VERSE_L.forEach((arp, bar) => L.push(...arp(o + bar * 4)));
    m8(o, [62, 64, 67, 67, 67, 67, 65, 65]);
    m8(o + 4, [64, 64, 67, 0, 67, 0, 0, 0]);
    m8(o + 8, [67, 67, 65, 65, 64, 0, 60, 0]);
    if (!second) m8(o + 12, [60, 0, 67, 67, 65, 65, 64, 64]);
    else m8(o + 12, [64, 64, 62, 62, 60, 0, 60, 0]);
  };
  verseLoop(16, false); verseLoop(32, true);
  const CHORUS_L = [(o) => arpBarL(o, 41), (o) => arpBarL(o, 43), (o) => arpBarL(o, 45), (o) => arpBarL(o, 43)];
  const chorusLoop = (o, second) => {
    CHORUS_L.forEach((arp, bar) => L.push(...arp(o + bar * 4)));
    m8(o, [72, 72, 72, 72, 74, 74, 72, 72]);
    m8(o + 4, [72, 72, 74, 74, 76, 74, 71, 72]);
    m8(o + 8, [74, 74, 72, 74, 72, 74, 76, 72]);
    if (!second) m8(o + 12, [76, 74, 76, 79, 76, 74, 71, 72]);
    else { for (const [t, d, m] of [[12, 1, 72], [13, 1, 79], [14, 1, 74], [15, 1, 72]]) { R.push({ b: o + t, d, m, h: 'R' }, { b: o + t, d, m: m + 12, h: 'R' }); } }
  };
  chorusLoop(48, false); chorusLoop(64, true);
  riffBar(80, 72, true); riffBar(84, 74, false);
  for (const m of [64, 67, 72, 76]) R.push({ b: 88, d: 4, m, h: 'R' });
  L.push({ b: 88, d: 4, m: 24, h: 'L', f: 5 }, { b: 88, d: 4, m: 36, h: 'L', f: 1 });
  R.sort((a, b2) => a.b - b2.b);
  L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

SONGS.push(
  {
    id: 'pirates-hard', group: 'pirates', level: 'Hard',
    title: "He's a Pirate (Pirates of the Caribbean)", composer: 'Klaus Badelt · cover-style arrangement',
    bpm: 150, timeSig: [3, 4], beatUnit: 4,
    sections: [
      { name: 'Theme (octaves)', startBeat: 0, endBeat: 18 },
      { name: 'The turn', startBeat: 18, endBeat: 27 },
      { name: 'The climb + end', startBeat: 27, endBeat: 36 },
    ],
    notes: piratesHardNotes(),
  },
  {
    id: 'piano-man-hard', group: 'piano-man', level: 'Hard',
    title: 'Piano Man', composer: 'Billy Joel · cover-style arrangement',
    bpm: 130, timeSig: [3, 4], beatUnit: 4,
    sections: [
      { name: 'First phrase (waltz LH)', startBeat: 0, endBeat: 12 },
      { name: 'Answer phrase', startBeat: 12, endBeat: 27 },
    ],
    notes: pianoManHardNotes(),
  },
  {
    id: 'empire-hard', group: 'empire', level: 'Hard',
    title: 'Empire State of Mind', composer: 'Alicia Keys · cover-style arrangement',
    bpm: 87, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Bell plinks (octaves)', startBeat: 0, endBeat: 16 },
      { name: 'Verse stabs + octave bass', startBeat: 16, endBeat: 48 },
      { name: 'The turn', startBeat: 48, endBeat: 56 },
      { name: 'Chorus (octaves + arps)', startBeat: 56, endBeat: 88 },
      { name: 'Outro', startBeat: 88, endBeat: 100 },
    ],
    notes: empireHardNotes(),
  },
  {
    id: 'fray-save-a-life-hard', group: 'fray-save-a-life', level: 'Hard',
    title: 'How to Save a Life', composer: 'The Fray · cover-style arrangement',
    bpm: 110, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Intro riff + arps', startBeat: 0, endBeat: 16 },
      { name: 'Verse (octaves)', startBeat: 16, endBeat: 48 },
      { name: 'Chorus (octaves)', startBeat: 48, endBeat: 80 },
      { name: 'Outro', startBeat: 80, endBeat: 92 },
    ],
    notes: frayHardNotes(),
  },
  {
    id: 'still-dre-hard', group: 'still-dre', level: 'Hard',
    title: 'Still D.R.E.', composer: 'Dr. Dre · cover-style arrangement',
    bpm: 93, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Loop 1', startBeat: 0, endBeat: 8 },
      { name: 'Loops 2-4', startBeat: 8, endBeat: 32 },
      { name: 'Loops 5-8 + end', startBeat: 32, endBeat: 68 },
    ],
    notes: stillDreHardNotes(),
  },
  {
    id: 'game-of-thrones-hard', group: 'game-of-thrones', level: 'Hard',
    title: 'Game of Thrones (Main Theme)', composer: 'Ramin Djawadi · cover-style arrangement',
    bpm: 85, timeSig: [3, 4], beatUnit: 4,
    sections: [
      { name: 'Ostinato intro', startBeat: 0, endBeat: 12 },
      { name: 'Theme (octaves)', startBeat: 12, endBeat: 36 },
      { name: 'High theme', startBeat: 36, endBeat: 60 },
      { name: 'Low turn', startBeat: 60, endBeat: 72 },
      { name: 'Reprise + end', startBeat: 72, endBeat: 99 },
    ],
    notes: gotHardNotes(),
  },
  {
    id: 'runaway-hard', group: 'runaway', level: 'Hard',
    title: 'Runaway', composer: 'Kanye West · cover-style arrangement',
    bpm: 87, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Plink (octaves)', startBeat: 0, endBeat: 8 },
      { name: 'Descent (octaves + arps)', startBeat: 8, endBeat: 40 },
      { name: 'Chorus figure + end', startBeat: 40, endBeat: 60 },
    ],
    notes: runawayHardNotes(),
  },
  {
    id: 'gangstas-paradise-hard', group: 'gangstas-paradise', level: 'Hard',
    title: "Gangsta's Paradise", composer: 'Coolio · cover-style arrangement',
    // A VERIFIED PERFORMANCE IS AN AUTHORITY, like an engraved score. Mark,
    // 2026-09-01: "I looked at Gangsta's Paradise... there was one that matched
    // the YouTube video perfectly" - the PianoX cover this was curated against
    // (16th-council listening lane, 2026-08-28). Its 53 "chords no hand can
    // hold" are wide voicings a real pianist demonstrably PLAYED on camera,
    // rolled - and our 1/4-beat quantisation collapses a roll into a fake
    // struck-together chord. The audit already accepts exactly this from a
    // score ("the score says so, so they are rolled, not grabbed"); a checked
    // performance earns the same. This field grants that exemption, and it is
    // set ONLY on Mark's word per song, never by a tool.
    performanceVerified: 'PianoX cover on video; match confirmed by Mark 2026-09-01',
    bpm: 80, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Bell intro (octaves)', startBeat: 0, endBeat: 16 },
      { name: 'Verse (octave melody + arps)', startBeat: 16, endBeat: 48 },
      { name: 'Chorus', startBeat: 48, endBeat: 80 },
      { name: 'Verse 2', startBeat: 80, endBeat: 96 },
      { name: 'Chorus 2 + outro', startBeat: 96, endBeat: 124 },
    ],
    notes: gangstasHardNotes(),
  },
  {
    id: 'faded-hard', group: 'faded', level: 'Hard',
    title: 'Faded', composer: 'Alan Walker · cover-style arrangement',
    bpm: 90, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Broken chords', startBeat: 0, endBeat: 32 },
      { name: 'Big hook (octaves)', startBeat: 32, endBeat: 64 },
      { name: 'Wind down + end', startBeat: 64, endBeat: 84 },
    ],
    notes: fadedHardNotes(),
  },
  {
    id: 'river-hard', group: 'river', level: 'Hard',
    title: 'River Flows in You', composer: 'Yiruma · cover-style arrangement',
    bpm: 68, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Loop 1-2 (thirds + arps)', startBeat: 0, endBeat: 32 },
      { name: 'Loop 3-4 + end', startBeat: 32, endBeat: 68 },
    ],
    notes: riverHardNotes(),
  },
);

// ---- Linkin Park wave (2026-08-24): Lost + Numb, three tiers each.
// Sources (verified, never guessed): Lost = pianoletternotes line transcription
// (all naturals; verse roots A-C-G-D, chorus roots D-F-C-G) cross-checked against
// the Hooktheory public API (key A MINOR 105bpm confirmed, verse i-III-VII-iv,
// chorus iv-VI-III-VII, chorus hook degrees A-A-C-G-G-F-E-D-D-E-D-C-D-E-E-C =
// note-for-note match with the transcription). Numb = noobnotes vocal letters
// (F# minor, loop F#m-D-A-E) cross-checked against Hooktheory (F#m + loop
// confirmed, 110bpm) and the pianoletternotes hard-version figuration (octave
// doubling + wide broken LH). Numb is authored +3 into A minor so the loop
// becomes Am-F-C-G on white keys; Lost is already all-white in A minor.

// Push [t, d, m] bar-relative melody events at bar offset o.
function melBar(arr, o, events, hand = 'R') {
  for (const [t, d, m] of events) arr.push({ b: o + t, d, m, h: hand });
}
// Same, doubled at +/-12 (cover-style octave melody).
function melBarOct(arr, o, events, delta) {
  for (const [t, d, m] of events) {
    arr.push({ b: o + t, d, m, h: 'R' }, { b: o + t, d, m: m + delta, h: 'R' });
  }
}
// LH octave-bounce eighths (root, root+12 alternating), driving chorus bass.
function bounceHalfL(o, root) {
  const L = [];
  for (let k = 0; k < 4; k++) L.push({ b: o + k * 0.5, d: 0.5, m: root + (k % 2 ? 12 : 0), h: 'L', f: k % 2 ? 1 : 5 });
  return L;
}
function bounceBarL(o, root) {
  return [...bounceHalfL(o, root), ...bounceHalfL(o + 2, root)];
}

// Lost bar-melodies (bar-relative [beat, dur, midi]) straight off the sources.
const LOST = {
  hook1: [
    [[0, 2, 69], [2, 0.5, 72], [2.5, 1.5, 69]],
    [[0.5, 2, 74], [3, 1, 72]],
    [[0, 1, 69], [2, 1, 69], [3.5, 0.5, 72]],
    [[1, 1, 69], [2, 1, 74], [3, 1, 76]],
  ],
  hook2: [
    [[0, 0.5, 74], [0.5, 0.5, 69], [1, 0.5, 74], [1.5, 0.5, 76], [2, 1, 74], [3, 0.5, 69], [3.5, 0.5, 72]],
    [[0, 1, 74], [1, 1, 72], [2, 1.5, 69], [3.5, 0.5, 72]],
    [[0, 1, 69], [2, 0.5, 74], [2.5, 0.5, 76], [3, 1, 74]],
    [[0, 0.5, 76], [0.5, 0.5, 74], [1, 1, 69], [2, 1, 74], [3, 1, 76]],
  ],
  verse1: [
    [[2, 0.5, 67], [2.5, 1.5, 69]],
    [[0, 0.5, 69], [0.5, 0.5, 71], [1, 1.5, 72], [2.5, 0.5, 74], [3, 1, 71]],
    [[0, 0.5, 67], [0.5, 1.5, 69], [2.5, 0.5, 69], [3, 0.5, 71], [3.5, 0.5, 72]],
    [[0, 0.5, 74], [0.5, 1, 76], [2, 0.5, 74], [2.5, 1.5, 76]],
  ],
  verse2End: [[0, 0.5, 74], [0.5, 1, 76], [2, 1, 77], [3, 1, 76]],
  chorus: [
    [[0, 1, 81], [1, 2, 81], [3, 0.5, 72], [3.5, 0.5, 79]],
    [[0, 1.5, 79], [1.5, 0.5, 77], [2, 1.5, 76], [3.5, 0.5, 74]],
    [[0, 0.5, 74], [0.5, 0.5, 76], [1, 1.5, 74], [2.5, 0.5, 72], [3, 1, 74]],
    [[0, 1, 76], [1, 1, 76], [2, 1, 72], [3, 1, 74]],
  ],
  chorusEnd: [[0, 1, 76], [1, 1, 74], [2, 2, 69]],
  bridge: [
    [[0, 0.5, 69], [0.5, 0.5, 72], [1, 0.5, 72], [1.5, 0.5, 71], [2, 1, 72], [3, 0.5, 76], [3.5, 0.5, 74]],
    [[0, 0.5, 74], [0.5, 0.5, 71], [1, 0.5, 71], [1.5, 1.5, 72], [3, 1, 72]],
    [[0, 0.5, 72], [0.5, 0.5, 72], [1, 1, 72], [2, 0.5, 76], [2.5, 0.5, 74], [3, 1, 74]],
    [[0, 0.5, 71], [0.5, 0.5, 71], [1, 3, 72]],
  ],
};
const LOST_HOOK_ROOTS = [50, 53, 48, 43];   // D F C G
const LOST_VERSE_ROOTS = [45, 48, 43, 50];  // A C G D

function lostEasyNotes() {
  const R = [], L = [];
  const hookQ = [
    [[0, 2, 69], [2, 1, 72], [3, 1, 69]],
    [[0, 2, 74], [2, 2, 72]],
    [[0, 1, 69], [1, 1, 69], [2, 2, 72]],
    [[0, 1, 69], [1, 1, 74], [2, 2, 76]],
  ];
  const chorusQ = [
    [[0, 1, 81], [1, 2, 81], [3, 1, 79]],
    [[0, 2, 79], [2, 2, 76]],
    [[0, 1, 74], [1, 1, 76], [2, 1, 74], [3, 1, 72]],
    [[0, 1, 76], [1, 1, 76], [2, 2, 74]],
  ];
  [hookQ, chorusQ].forEach((phase, p) => phase.forEach((bar, i) => {
    const o = p * 16 + i * 4;
    melBar(R, o, bar);
    L.push({ b: o, d: 4, m: LOST_HOOK_ROOTS[i], h: 'L', f: 5 });
  }));
  R.sort((a, b2) => a.b - b2.b); L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

function lostMediumNotes() {
  const R = [], L = [];
  const halfBarL = (o, root) => L.push(
    { b: o, d: 2, m: root, h: 'L', f: 5 }, { b: o + 2, d: 2, m: root + 7, h: 'L', f: 2 });
  let o = 0;
  for (const phase of [LOST.hook1, LOST.hook2]) {
    phase.forEach((bar, i) => { melBar(R, o, bar); halfBarL(o, LOST_HOOK_ROOTS[i]); o += 4; });
  }
  for (let pass = 0; pass < 2; pass++) {
    LOST.verse1.forEach((bar, i) => {
      melBar(R, o, pass === 1 && i === 3 ? LOST.verse2End : bar);
      halfBarL(o, LOST_VERSE_ROOTS[i]); o += 4;
    });
  }
  for (let pass = 0; pass < 2; pass++) {
    LOST.chorus.forEach((bar, i) => {
      melBar(R, o, pass === 1 && i === 3 ? LOST.chorusEnd : bar);
      halfBarL(o, LOST_HOOK_ROOTS[i]); o += 4;
    });
  }
  melBar(R, o, [[0, 1, 74], [1, 1, 76], [2, 2, 72]]); halfBarL(o, 43); o += 4;
  R.push({ b: o, d: 4, m: 69, h: 'R' });
  L.push({ b: o, d: 4, m: 45, h: 'L', f: 5 }, { b: o, d: 4, m: 52, h: 'L', f: 2 });
  R.sort((a, b2) => a.b - b2.b); L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

function lostHardNotes() {
  const R = [], L = [];
  let o = 0;
  for (const phase of [LOST.hook1, LOST.hook2]) {
    phase.forEach((bar, i) => { melBar(R, o, bar); L.push(...arpBarL(o, LOST_HOOK_ROOTS[i])); o += 4; });
  }
  const versePass = (pass) => LOST.verse1.forEach((bar, i) => {
    if (pass === 1 && i === 3) {
      // 16th pickup run lifting into the chorus
      melBar(R, o, [[0, 0.5, 74], [0.5, 1, 76], [2, 0.5, 77], [2.5, 0.5, 76],
        [3, 0.25, 67], [3.25, 0.25, 69], [3.5, 0.25, 71], [3.75, 0.25, 72]]);
    } else melBar(R, o, bar);
    L.push(...arpBarL(o, LOST_VERSE_ROOTS[i])); o += 4;
  });
  const chorusPass = (final) => LOST.chorus.forEach((bar, i) => {
    melBarOct(R, o, final && i === 3 ? LOST.chorusEnd : bar, -12);
    L.push(...bounceBarL(o, LOST_HOOK_ROOTS[i])); o += 4;
  });
  versePass(0); versePass(1);
  chorusPass(false); chorusPass(false);
  LOST.bridge.forEach((bar) => { melBar(R, o, bar); L.push(...arpBarL(o, 45)); o += 4; });
  chorusPass(false); chorusPass(true);
  melBarOct(R, o, [[0, 1, 74], [1, 1, 76], [2, 2, 72]], -12); L.push(...arpBarL(o, 43)); o += 4;
  R.push({ b: o, d: 4, m: 69, h: 'R' }, { b: o, d: 4, m: 57, h: 'R' });
  L.push({ b: o, d: 4, m: 33, h: 'L', f: 5 }, { b: o, d: 4, m: 45, h: 'L', f: 1 });
  R.sort((a, b2) => a.b - b2.b); L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

// Numb bar-melodies (authored +3 from the F#m letters into Am).
const NUMB = {
  introTones: [[76, 72, 69], [77, 72, 69], [76, 72, 67], [74, 71, 67]], // top/mid/low per chord
  verse: [
    [[0, 1, 69], [2, 0.5, 76], [2.5, 0.5, 76], [3, 1, 76]],
    [[0, 0.5, 76], [0.5, 0.5, 77], [1, 0.5, 76], [1.5, 0.5, 76], [2, 0.5, 74], [2.5, 1.5, 72]],
    [[0, 0.5, 76], [0.5, 0.5, 76], [1, 0.5, 74], [1.5, 1, 72], [3, 1, 74]],
    [[0, 1, 67], [1.5, 0.5, 76], [2, 0.5, 76], [2.5, 0.5, 74], [3, 0.5, 72], [3.5, 0.5, 74]],
    [[0, 1, 76], [1, 0.5, 76], [1.5, 0.5, 76], [2, 1, 76], [3, 0.5, 77], [3.5, 0.5, 76]],
    [[0, 0.5, 76], [0.5, 0.5, 74], [1, 1, 72], [2, 0.5, 72], [2.5, 0.5, 76], [3, 0.5, 74], [3.5, 0.5, 72]],
    [[0, 1, 74], [2, 0.5, 76], [2.5, 0.5, 74], [3, 1, 72]],
    [[0, 0.5, 67], [0.5, 1, 76], [1.5, 0.5, 74], [2, 0.5, 72], [2.5, 0.5, 74], [3, 0.5, 74], [3.5, 0.5, 76]],
  ],
  chorus: [
    [[0, 0.5, 76], [0.5, 0.5, 76], [1, 1, 81], [2, 1, 81], [3, 0.5, 79], [3.5, 0.5, 76]],
    [[0, 0.5, 76], [0.5, 0.5, 81], [1, 0.5, 79], [1.5, 0.5, 76], [2, 1, 77], [3, 0.5, 77], [3.5, 0.5, 79]],
    [[0, 1, 81], [1, 0.5, 81], [1.5, 0.5, 81], [2, 1, 79], [3, 1, 81]],
    [[0, 0.5, 81], [0.5, 0.5, 81], [1, 0.5, 81], [1.5, 1, 83], [2.5, 1.5, 79]],
    [[0, 0.5, 81], [0.5, 0.5, 81], [1, 1, 79], [2, 1, 81], [3, 1, 81]],
    [[0, 0.5, 81], [0.5, 0.5, 81], [1, 0.5, 81], [1.5, 1, 83], [2.5, 1.5, 79]],
    [[0, 0.5, 81], [0.5, 0.5, 81], [1, 1, 79], [2, 0.5, 81], [2.5, 1.5, 81]],
    [[0, 0.5, 81], [0.5, 0.5, 79], [1, 1, 79], [2, 0.5, 79], [2.5, 1.5, 76]],
  ],
  bridge: [
    [[0, 1, 81], [1.5, 1, 84], [2.5, 1.5, 83]],
    [[0, 1, 83], [1, 1, 81], [2, 1, 83], [3, 1, 83]],
    [[0, 0.5, 83], [0.5, 0.5, 83], [1, 1, 83], [2, 1, 81], [3, 1, 79]],
    [[0, 1, 84], [1, 3, 83]],
  ],
};
const NUMB_ROOTS = [45, 41, 48, 43];         // Am F C G
const NUMB_BRIDGE_ROOTS = [41, 48, 43, 45];  // F C G Am

// The synth ostinato as eighths on the bar's chord tones (top-mid-low-mid).
function numbIntroBarR(R, o, [top, mid, low]) {
  const pat = [top, mid, low, mid, top, mid, low, mid];
  pat.forEach((m, k) => R.push({ b: o + k * 0.5, d: 0.5, m, h: 'R' }));
}

function numbEasyNotes() {
  const R = [], L = [];
  const introQ = [
    [[0, 1, 76], [1, 1, 72], [2, 1, 69], [3, 1, 72]],
    [[0, 1, 77], [1, 1, 72], [2, 1, 69], [3, 1, 72]],
  ];
  const chorusQ = [
    [[0, 1, 76], [1, 1, 81], [2, 1, 81], [3, 1, 79]],
    [[0, 1, 76], [1, 1, 77], [2, 2, 79]],
    [[0, 1, 81], [1, 1, 81], [2, 1, 79], [3, 1, 81]],
    [[0, 1, 81], [1, 1, 83], [2, 2, 79]],
  ];
  introQ.forEach((bar, i) => {
    melBar(R, i * 4, bar);
    L.push({ b: i * 4, d: 4, m: [45, 41][i], h: 'L', f: 5 });
  });
  chorusQ.forEach((bar, i) => {
    const o = 8 + i * 4;
    melBar(R, o, bar);
    L.push({ b: o, d: 4, m: NUMB_ROOTS[i], h: 'L', f: 5 });
  });
  R.sort((a, b2) => a.b - b2.b); L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

function numbMediumNotes() {
  const R = [], L = [];
  const halfBarL = (o, root) => L.push(
    { b: o, d: 2, m: root, h: 'L', f: 5 }, { b: o + 2, d: 2, m: root + 7, h: 'L', f: 2 });
  let o = 0;
  NUMB.introTones.forEach((tones, i) => {
    numbIntroBarR(R, o, tones);
    L.push({ b: o, d: 4, m: NUMB_ROOTS[i], h: 'L', f: 5 }); o += 4;
  });
  NUMB.verse.forEach((bar, i) => { melBar(R, o, bar); halfBarL(o, NUMB_ROOTS[i % 4]); o += 4; });
  NUMB.chorus.forEach((bar, i) => { melBar(R, o, bar); halfBarL(o, NUMB_ROOTS[i % 4]); o += 4; });
  melBar(R, o, [[0, 1, 69], [1, 1, 72], [2, 2, 76]]); halfBarL(o, 45); o += 4;
  R.push({ b: o, d: 4, m: 69, h: 'R' });
  L.push({ b: o, d: 4, m: 45, h: 'L', f: 5 }, { b: o, d: 4, m: 52, h: 'L', f: 2 });
  R.sort((a, b2) => a.b - b2.b); L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

function numbHardNotes() {
  const R = [], L = [];
  let o = 0;
  NUMB.introTones.forEach((tones, i) => {
    numbIntroBarR(R, o, tones);
    L.push(...arpBarL(o, NUMB_ROOTS[i])); o += 4;
  });
  NUMB.verse.forEach((bar, i) => {
    if (i === 7) {
      // verse tail becomes a 16th run lifting into the chorus
      melBarOct(R, o, [[0, 0.5, 67], [0.5, 1, 76], [1.5, 0.5, 74], [2, 0.5, 72], [2.5, 0.5, 74]], 12);
      melBar(R, o, [[3, 0.25, 72], [3.25, 0.25, 74], [3.5, 0.25, 76], [3.75, 0.25, 79]]);
    } else melBarOct(R, o, bar, 12);
    L.push(...arpBarL(o, NUMB_ROOTS[i % 4])); o += 4;
  });
  const chorusPass = () => NUMB.chorus.forEach((bar, i) => {
    melBarOct(R, o, bar, -12);
    L.push(...bounceBarL(o, NUMB_ROOTS[i % 4])); o += 4;
  });
  chorusPass();
  NUMB.bridge.forEach((bar, i) => {
    melBarOct(R, o, bar, -12);
    L.push(...arpBarL(o, NUMB_BRIDGE_ROOTS[i])); o += 4;
  });
  chorusPass();
  melBarOct(R, o, [[0, 1, 69], [1, 1, 72], [2, 2, 76]], 12); L.push(...arpBarL(o, 45)); o += 4;
  R.push({ b: o, d: 4, m: 69, h: 'R' }, { b: o, d: 4, m: 76, h: 'R' }, { b: o, d: 4, m: 81, h: 'R' });
  L.push({ b: o, d: 4, m: 33, h: 'L', f: 5 }, { b: o, d: 4, m: 45, h: 'L', f: 1 });
  R.sort((a, b2) => a.b - b2.b); L.sort((a, b2) => a.b - b2.b);
  return [...R, ...L];
}

SONGS.push(
  {
    id: 'lost-easy', group: 'lost', level: 'Easy',
    title: 'Lost', composer: 'Linkin Park',
    bpm: 90, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'The hook', startBeat: 0, endBeat: 16 },
      { name: 'Chorus', startBeat: 16, endBeat: 32 },
    ],
    notes: lostEasyNotes(),
  },
  {
    id: 'lost', group: 'lost', level: 'Medium',
    title: 'Lost', composer: 'Linkin Park',
    bpm: 105, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Intro hook', startBeat: 0, endBeat: 32 },
      { name: 'Verse', startBeat: 32, endBeat: 64 },
      { name: 'Chorus', startBeat: 64, endBeat: 96 },
      { name: 'Outro', startBeat: 96, endBeat: 104 },
    ],
    notes: lostMediumNotes(),
  },
  {
    id: 'lost-hard', group: 'lost', level: 'Hard',
    title: 'Lost', composer: 'Linkin Park · cover-style arrangement',
    bpm: 105, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Intro hook (arps)', startBeat: 0, endBeat: 32 },
      { name: 'Verse', startBeat: 32, endBeat: 64 },
      { name: 'Chorus (octaves)', startBeat: 64, endBeat: 96 },
      { name: 'Bridge', startBeat: 96, endBeat: 112 },
      { name: 'Final chorus + outro', startBeat: 112, endBeat: 152 },
    ],
    notes: lostHardNotes(),
  },
  {
    id: 'numb-easy', group: 'numb', level: 'Easy',
    title: 'Numb', composer: 'Linkin Park · easy-key arrangement (Am)',
    bpm: 95, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Synth intro', startBeat: 0, endBeat: 8 },
      { name: 'Chorus', startBeat: 8, endBeat: 24 },
    ],
    notes: numbEasyNotes(),
  },
  {
    id: 'numb', group: 'numb', level: 'Medium',
    title: 'Numb', composer: 'Linkin Park · easy-key arrangement (Am)',
    bpm: 110, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Synth intro', startBeat: 0, endBeat: 16 },
      { name: 'Verse', startBeat: 16, endBeat: 48 },
      { name: 'Chorus', startBeat: 48, endBeat: 80 },
      { name: 'Outro', startBeat: 80, endBeat: 88 },
    ],
    notes: numbMediumNotes(),
  },
  {
    id: 'numb-hard', group: 'numb', level: 'Hard',
    title: 'Numb', composer: 'Linkin Park · cover-style arrangement (Am)',
    bpm: 110, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Synth intro (arps)', startBeat: 0, endBeat: 16 },
      { name: 'Verse (octaves)', startBeat: 16, endBeat: 48 },
      { name: 'Chorus', startBeat: 48, endBeat: 80 },
      { name: 'Bridge', startBeat: 80, endBeat: 96 },
      { name: 'Final chorus + outro', startBeat: 96, endBeat: 136 },
    ],
    notes: numbHardNotes(),
  },
);

// --- Super Mario Bros. "Ground Theme" (Koji Kondo, 1985) --------------------
// TRIPLE-verified melody, zero guessed notes:
//   (1) robsoncouto/arduino-songs supermariobros.ino, whose note VALUES are
//       transcribed off MuseScore score 2145 (bar numbers in its comments);
//   (2) the canonical `mario` RTTTL string (d=4,o=5,b=100);
//   (3) letter-note transcriptions at noobnotes.net and latouchemusicale.com.
// All three agree on pitch and octave (melody sits E4-A5). Key C major and
// tempo 100 in cut time per Wikipedia, so it is written here as 4/4 at 200bpm
// and the eighths land at the record's speed.
// Two source disagreements, both resolved and recorded:
//   - the coda run: (3) starts it on B4, (1) starts it on D5. D5 kept: it is
//     the parallel of the answering B4-F5-F5-F5 phrase, which all three share.
//   - the bridge rise: (1) prints C4, (2) and (3) both print C5 and the line
//     is ascending G#4-A4-C5. C5 kept.
// The LEFT HAND is my own arrangement over the published chord reading
// (C | F | C | G through the main phrase). The melody is not arranged.
const T = 2 / 3; // quarter-note triplet: three even notes across two beats
const MARIO = {
  intro1: [[0, 0.5, 76], [0.5, 0.5, 76], [1.5, 0.5, 76], [2.5, 0.5, 72], [3, 1, 76]],
  intro2: [[0, 1, 79], [2, 1, 67]],
  a1: [[0, 1.5, 72], [1.5, 1.5, 67], [3, 1, 64]],
  a2: [[0.5, 1, 69], [1.5, 1, 71], [2.5, 0.5, 70], [3, 1, 69]],
  a3: [[0, T, 67], [T, T, 76], [2 * T, T, 79], [2, 1, 81], [3, 0.5, 77], [3.5, 0.5, 79]],
  a3e: [[0, 0.5, 67], [0.5, 0.5, 76], [1, 1, 79], [2, 1, 81], [3, 0.5, 77], [3.5, 0.5, 79]],
  a4: [[0.5, 1, 76], [1.5, 0.5, 72], [2, 0.5, 74], [2.5, 1.5, 71]],
  b1: [[1, 0.5, 79], [1.5, 0.5, 78], [2, 0.5, 77], [2.5, 1, 75], [3.5, 0.5, 76]],
  b2: [[0.5, 0.5, 68], [1, 0.5, 69], [1.5, 0.5, 72], [2.5, 0.5, 69], [3, 0.5, 72], [3.5, 0.5, 74]],
  b3: [[1, 1, 75], [2.5, 1.5, 74]],
  b4: [[0, 2, 72]],
  c1: [[0, 0.5, 72], [0.5, 1, 72], [1.5, 0.5, 72], [2.5, 0.5, 72], [3, 1, 74]],
  c2: [[0, 0.5, 76], [0.5, 1, 72], [1.5, 0.5, 69], [2, 2, 67]],
  c3: [[0, 0.5, 72], [0.5, 1, 72], [1.5, 0.5, 72], [2.5, 0.5, 72], [3, 0.5, 74], [3.5, 0.5, 76]],
  c4: [], // the written whole-bar rest: left hand holds it alone
  d1: [[0, 0.5, 76], [0.5, 1, 72], [1.5, 0.5, 67], [3, 1, 68]],
  d2: [[0, 0.5, 69], [0.5, 1, 77], [1.5, 0.5, 77], [2, 2, 69]],
  d3: [[0, T, 74], [T, T, 81], [2 * T, T, 81], [2, T, 81], [2 + T, T, 79], [2 + 2 * T, T, 77]],
  d4: [[0, 0.5, 76], [0.5, 1, 72], [1.5, 0.5, 69], [2, 2, 67]],
  d7: [[0, 0.5, 71], [0.5, 1, 77], [1.5, 0.5, 77], [2, T, 77], [2 + T, T, 76], [2 + 2 * T, T, 74]],
  d8: [[0, 0.5, 72], [0.5, 1, 64], [1.5, 0.5, 64], [2, 2, 60]],
};
// [bar key, LH root, optional second root taking the back half of the bar]
const MARIO_A = [['a1', 48], ['a2', 41], ['a3', 48], ['a4', 43]];
const MARIO_B = [['b1', 48], ['b2', 45], ['b3', 43], ['b4', 48]];
const MARIO_CODA = [
  ['d1', 48], ['d2', 41], ['d3', 50], ['d4', 48, 43],
  ['d1', 48], ['d2', 41], ['d7', 43], ['d8', 48],
];
// 42 bars: intro(2) theme(8) bridge(8) break(6) intro+theme(10) coda(8)
const MARIO_PLAN = [
  ['intro1', 48], ['intro2', 43],
  ...MARIO_A, ...MARIO_A,
  ...MARIO_B, ...MARIO_B,
  ['c1', 48], ['c2', 48, 43], ['c3', 48], ['c4', 48], ['c1', 48], ['c2', 48, 43],
  ['intro1', 48], ['intro2', 43],
  ...MARIO_A, ...MARIO_A,
  ...MARIO_CODA,
];
const MARIO_EASY_PLAN = [
  ['intro1', 48], ['intro2', 43],
  ['a1', 48], ['a2', 41], ['a3e', 48], ['a4', 43],
  ['b1', 48], ['b2', 45], ['b3', 43], ['b4', 48],
];

// lh: 'block' = one root per bar (Easy/Medium), 'arp' = eighth-note figuration.
// octBars/bounceBars are bar indexes that get the cover-style treatment.
function marioNotes(plan, { lh = 'block', octBars = new Set(), bounceBars = new Set() } = {}) {
  const R = [], L = [];
  plan.forEach(([key, r1, r2], i) => {
    const o = i * 4, bar = MARIO[key], back = r2 ?? r1;
    if (octBars.has(i)) melBarOct(R, o, bar, -12); else melBar(R, o, bar);
    if (lh === 'block') {
      if (r2) L.push({ b: o, d: 2, m: r1, h: 'L', f: 5 }, { b: o + 2, d: 2, m: back, h: 'L', f: 5 });
      else L.push({ b: o, d: 4, m: r1, h: 'L', f: 5 });
    } else if (bounceBars.has(i)) {
      L.push(...bounceHalfL(o, r1), ...bounceHalfL(o + 2, back));
    } else {
      L.push(...arpHalfL(o, r1), ...arpHalfL(o + 2, back));
    }
  });
  R.sort((a, b) => a.b - b.b); L.sort((a, b) => a.b - b.b);
  return [...R, ...L];
}
const marioRange = (from, to) => new Set(Array.from({ length: to - from }, (_, k) => from + k));

const MARIO_SECTIONS = [
  { name: 'Intro', startBeat: 0, endBeat: 8 },
  { name: 'Main theme', startBeat: 8, endBeat: 40 },
  { name: 'Bridge', startBeat: 40, endBeat: 72 },
  { name: 'Break', startBeat: 72, endBeat: 96 },
  { name: 'Theme again', startBeat: 96, endBeat: 136 },
  { name: 'Coda', startBeat: 136, endBeat: 168 },
];

SONGS.push(
  {
    id: 'mario-easy', group: 'mario', level: 'Easy',
    title: 'Super Mario Bros. Theme', composer: 'Koji Kondo · easy arrangement',
    bpm: 120, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Intro', startBeat: 0, endBeat: 8 },
      { name: 'Main theme', startBeat: 8, endBeat: 24 },
      { name: 'Bridge', startBeat: 24, endBeat: 40 },
    ],
    notes: marioNotes(MARIO_EASY_PLAN),
  },
  {
    id: 'mario', group: 'mario', level: 'Medium',
    title: 'Super Mario Bros. Theme', composer: 'Koji Kondo',
    bpm: 200, timeSig: [4, 4], beatUnit: 4,
    sections: MARIO_SECTIONS,
    notes: marioNotes(MARIO_PLAN),
  },
  {
    id: 'mario-hard', group: 'mario', level: 'Hard',
    title: 'Super Mario Bros. Theme', composer: 'Koji Kondo · cover-style arrangement',
    bpm: 200, timeSig: [4, 4], beatUnit: 4,
    sections: MARIO_SECTIONS,
    // theme return in octaves (bars 27-34), driving octave bass under the coda
    notes: marioNotes(MARIO_PLAN, { lh: 'arp', octBars: marioRange(26, 34), bounceBars: marioRange(34, 42) }),
  },
);

// ---- Star Wars Main Title (John Williams), 2026-08-25 ----
// TRIPLE-verified, zero guessed notes:
//  (1) pianoletternotes 2015 "Star Wars (Main Theme)" grid, C major, full
//      melody with octaves, decoded system-by-system (scratchpad decoder);
//  (2) latouchemusicale letter notes, C major RH sequence, matches (1)
//      note-for-note including the C-Bb-Ab-G-F-Eb-D-C chromatic descent;
//  (3) robsoncouto/arduino-songs starwars.ino, durations + structure
//      (transposes onto (1) exactly at -5; its straight-8th pickup is read as
//      the famous TRIPLET, which is also the only reading that fills 4/4).
// LH is MY arrangement on the bass roots of the pianoletternotes 2022
// "Hard Version" grid transposed F->C (C root, F neighbour, the Eb colour bar,
// F-E-D walkdowns). That page's long dominant-pedal ostinato middle section is
// deliberately NOT ported (parked; the classic A-A-B-A form ships).
const SW = { T: 1 / 3 }; // fanfare triplet: three notes in one beat
function swNotes(tier) {
  const R = [], L = [];
  const mel = (b, d, m) => R.push({ b, d, m, h: 'R' });
  const melD = (b, d, m) => { mel(b, d, m); if (tier === 'hard') mel(b, d, m + 12); };
  const pickup3 = (b) => { for (let k = 0; k < 3; k++) melD(b + k * SW.T, SW.T, 67); };
  // one fanfare statement starting at S (C lands on the barline)
  const fanfare = (S, close) => {
    melD(S, 2, 72); melD(S + 2, 2, 79);
    for (const o of [4, 8]) {
      melD(S + o, SW.T, 77); melD(S + o + SW.T, SW.T, 76); melD(S + o + 2 * SW.T, SW.T, 74);
      melD(S + o + 1, 2, 84); melD(S + o + 3, 1, 79);
    }
    if (close === 'fef') { // F-E-F-D close (statements 1 and 2)
      melD(S + 12, SW.T, 77); melD(S + 12 + SW.T, SW.T, 76); melD(S + 12 + 2 * SW.T, SW.T, 77);
      melD(S + 13, 2, 74);
    }
  };
  const bridgeA = (S) => { // A4. A4 | F5 E5 D5 C5 (8ths)
    mel(S, 1.5, 69); mel(S + 1.5, 0.5, 69);
    mel(S + 2, 0.5, 77); mel(S + 2.5, 0.5, 76); mel(S + 3, 0.5, 74); mel(S + 3.5, 0.5, 72);
  };
  const bridgeB = (S, pickupHigh) => { // C D E D A B + G(.75)+G(.25) pickup
    mel(S, 0.5, 72); mel(S + 0.5, 0.5, 74); mel(S + 1, 0.5, 76); mel(S + 1.5, 1, 74);
    mel(S + 2.5, 0.5, 69); mel(S + 3, 1, 71);
    const g = pickupHigh ? 79 : 67;
    mel(S + 4, 0.75, g); mel(S + 4.75, 0.25, g);
  };
  const cadence = (S, tail) => { // G5. D5 D5(held) [+ rest G4 / pickup]
    mel(S, 0.75, 79); mel(S + 0.75, 0.25, 74); mel(S + 1, 2, 74);
    if (tail === 'g4') mel(S + 3.5, 0.5, 67);
  };

  if (tier === 'easy') {
    // triplets flattened to straight eighths (beginner-method idiom, like Mario Easy)
    for (let k = 0; k < 3; k++) mel(1 + k, 1, 67);
    mel(4, 2, 72); mel(6, 2, 79);
    for (const o of [8, 12]) {
      mel(o, 0.5, 77); mel(o + 0.5, 0.5, 76); mel(o + 1, 0.5, 74);
      mel(o + 1.5, 1.5, 84); mel(o + 3, 1, 79);
    }
    mel(16, 0.5, 77); mel(16.5, 0.5, 76); mel(17, 0.5, 77); mel(17.5, 2.5, 74);
    mel(20, 4, 72);
    for (const [b, d, m] of [[4, 4, 48], [8, 4, 48], [12, 4, 48], [16, 4, 51], [20, 4, 48]]) L.push({ b, d, m, h: 'L' });
    return [...R, ...L];
  }

  // ---- Medium/Hard melody ----
  pickup3(3);
  fanfare(4, 'fef'); pickup3(19);
  fanfare(20, 'fef');
  mel(35, 0.75, 67); mel(35.75, 0.25, 67); // dotted pickup into the bridge
  bridgeA(36); bridgeB(40, false);
  bridgeA(45); cadence(49, 'g4');
  bridgeA(53); bridgeB(57, true);
  // the descent: C Bb Ab G F Eb D C (all three sources agree)
  const DESC = [[62, 1, 84], [63, 0.5, 82], [63.5, 1, 80], [64.5, 0.5, 79], [65, 1, 77], [66, 0.5, 75], [66.5, 1, 74], [67.5, 0.5, 72]];
  for (const [b, d, m] of DESC) melD(b, d, m);
  cadence(68); pickup3(71);
  // reprise: two F-E-D bars, then the closing C hits (2015 grid's ending)
  melD(72, 2, 72); melD(74, 2, 79);
  for (const o of [76, 80]) {
    melD(o, SW.T, 77); melD(o + SW.T, SW.T, 76); melD(o + 2 * SW.T, SW.T, 74);
    melD(o + 1, 2, 84); melD(o + 3, 1, 79);
  }
  for (let k = 0; k < 4; k++) {
    if (tier === 'hard') for (const m of [72, 76, 79, 84]) mel(84 + k, 1, m);
    else mel(84 + k, 1, 84);
  }

  // ---- LH: hard-version bass roots transposed F->C ----
  const half = (b, m) => L.push({ b, d: 2, m, h: 'L' });
  const quart = (b, m) => L.push({ b, d: 1, m, h: 'L' });
  const whole = (b, m) => L.push({ b, d: 4, m, h: 'L' });
  const walkOct = (b, ms) => ms.forEach((m, k) => {
    L.push({ b: b + k, d: 1, m, h: 'L' });
    if (tier === 'hard') L.push({ b: b + k, d: 1, m: m - 12, h: 'L' });
  });
  const fanfareL = (S) => {
    if (tier === 'hard') {
      L.push(...arpBarL(S, 48));
      for (const o of [4, 8]) L.push(...arpHalfL(S + o, 48), ...arpHalfL(S + o + 2, 53));
      walkOct(S + 12, [51, 53, 52, 50]); // Eb then F-E-D walk (grid colour)
    } else {
      whole(S, 48);
      for (const o of [4, 8]) { half(S + o, 48); half(S + o + 2, 53); }
      quart(S + 12, 51); quart(S + 13, 53); quart(S + 14, 52); quart(S + 15, 50);
    }
  };
  const compL = (b, root, d = 2) => {
    if (tier === 'hard') { for (let t = 0; t < d; t += 0.5) L.push({ b: b + t, d: 0.5, m: root + (Math.round(t * 2) % 2 ? 7 : 0), h: 'L' }); }
    else L.push({ b, d, m: root, h: 'L' });
  };
  fanfareL(4); fanfareL(20);
  compL(36, 48); compL(38, 53);                       // bridge phrase 1: C F
  compL(40, 48); compL(42, 53, 1); compL(43, 51, 2);  // phrase 2: C F Eb
  compL(45, 48); compL(47, 53);
  walkOct(49, [53, 52, 50, 48]);                      // cadence walkdown F E D C
  compL(53, 48); compL(55, 53);
  compL(57, 48); compL(59, 53, 1); compL(60, 51, 2);
  compL(62, 48); compL(64, 53); compL(66, 51);        // under the descent
  walkOct(68, [53, 52, 50]); quart(71, 43);           // walk + G under the pickup
  fanfareL(72);
  for (let k = 0; k < 4; k++) {
    quart(84 + k, 48);
    if (tier === 'hard') quart(84 + k, 36);
  }
  return [...R.sort((a, b) => a.b - b.b), ...L.sort((a, b) => a.b - b.b)];
}

const SW_SECTIONS = [
  { name: 'Fanfare', startBeat: 0, endBeat: 20 },
  { name: 'Fanfare again', startBeat: 20, endBeat: 36 },
  { name: 'Bridge', startBeat: 36, endBeat: 53 },
  { name: 'Bridge + the fall', startBeat: 53, endBeat: 72 },
  { name: 'Reprise & finale', startBeat: 72, endBeat: 88 },
];
SONGS.push(
  {
    id: 'star-wars-easy', group: 'star-wars', level: 'Easy',
    title: 'Star Wars Main Title', composer: 'John Williams · easy arrangement',
    bpm: 80, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Pickup + fanfare', startBeat: 0, endBeat: 20 },
      { name: 'Finish', startBeat: 20, endBeat: 24 },
    ],
    notes: swNotes('easy'),
  },
  {
    id: 'star-wars', group: 'star-wars', level: 'Medium',
    title: 'Star Wars Main Title', composer: 'John Williams',
    bpm: 108, timeSig: [4, 4], beatUnit: 4,
    sections: SW_SECTIONS,
    notes: swNotes('medium'),
  },
  {
    id: 'star-wars-hard', group: 'star-wars', level: 'Hard',
    title: 'Star Wars Main Title', composer: 'John Williams · cover-style arrangement',
    bpm: 108, timeSig: [4, 4], beatUnit: 4,
    sections: SW_SECTIONS,
    notes: swNotes('hard'),
  },
);

// Validation used by both the app (dev) and the node test.



// ---- 2026-08-28 wave: Moonlight Sonata / Bella Ciao / See You Again ----
// Sources (all cross-checked, zero guessed notes):
// Moonlight: pianoletternotes 2017-10 full-movement grid (Am transposition of
//   the C#m original, triplet unit = 3 chars), corroborated by the 2017-02 PLN
//   arrangement (different arranger, D#m, identical +5/+3 triplet voicing) and
//   the canonical score's harmonic skeleton (bar 5 = V7 with G#, dotted melody
//   pairs, bVI at bar 3). LH octaves in Hard are the score's own texture.
// Bella Ciao: PLN 2019-03 (melody) × PLN 2019-08 Hard Version (different
//   arranger; verse melody agrees note-for-note, one "ciao" phrased an eighth
//   apart). E minor as published.
// See You Again: PLN 2017-11 grid (G) × Hooktheory API (4 records, Bb major,
//   76-80bpm): intro riff degrees 5-2-1-5 + 16th run 1-2-3-2-1-2 match note for
//   note; chorus hook 6-7-6-5. "arr. in G" = easy-key arrangement of the Bb
//   original. Easy LH roots follow Hooktheory's vi7-I-IVsus2-I-V / vi-I-IV-I.
// Streams are '(t).(midi).(dt).(hand)' packed at div units per beat.
function fromStream(str, div) {
  return str.trim().split(/\s+/).map((tok) => {
    const [t, m, dt, h] = tok.split('.');
    return { b: +t / div, d: +dt / div, m: +m, h };
  }).sort((a, b) => (a.h === b.h ? a.b - b.b || a.m - b.m : a.h < b.h ? -1 : 1));
}
const BELLA_EASY = '0.59.2.R 2.64.2.R 4.66.2.R 6.40.2.L 6.67.2.R 8.64.8.R 10.35.8.L 14.40.2.L 16.59.2.R 18.35.8.L 18.64.2.R 20.66.2.R 22.40.2.L 22.67.2.R 24.64.8.R 26.35.8.L 30.40.2.L 32.59.2.R 34.35.8.L 34.64.2.R 36.66.2.R 38.40.2.L 38.67.4.R 42.35.16.L 42.66.2.R 44.64.2.R 46.38.2.L 46.67.4.R 50.38.2.L 50.66.2.R 52.64.2.R 54.36.2.L 54.71.4.R 58.36.2.L 58.71.4.R 62.35.4.L 62.71.2.R 64.47.2.L 64.71.2.R 66.35.4.L 66.69.2.R 68.47.2.L 68.71.2.R 70.33.8.L 70.72.2.R 72.72.8.R 74.40.2.L 78.33.12.L 80.72.2.R 82.36.2.L 82.71.2.R 84.69.2.R 86.40.2.L 86.72.2.R 88.71.8.R 90.35.8.L 94.40.2.L 96.71.2.R 98.35.8.L 98.69.2.R 100.67.2.R 102.42.2.L 102.66.4.R 104.47.2.L 106.35.8.L 106.71.4.R 108.47.2.L 110.42.2.L 110.66.4.R 112.47.2.L 114.35.8.L 114.67.4.R 116.47.2.L 118.40.2.L 118.64.8.R 122.35.8.L 126.40.2.L';
const BELLA_MED = '0.59.2.R 2.64.2.R 4.66.2.R 6.40.2.L 6.67.2.R 8.64.4.R 10.35.8.L 14.40.2.L 16.59.2.R 18.35.8.L 18.64.2.R 20.66.2.R 22.40.2.L 22.67.2.R 24.64.4.R 26.35.8.L 30.40.2.L 32.59.2.R 34.35.8.L 34.64.2.R 36.66.2.R 38.40.2.L 38.64.2.R 38.67.2.R 42.35.16.L 42.66.2.R 44.64.2.R 46.38.2.L 46.62.2.R 46.67.2.R 50.38.2.L 50.66.2.R 52.64.2.R 54.36.2.L 54.60.2.R 54.64.2.R 54.71.2.R 58.36.2.L 58.60.2.R 58.64.2.R 58.71.2.R 62.35.4.L 62.59.2.R 62.63.2.R 62.71.2.R 64.47.2.L 66.35.4.L 66.66.2.R 66.69.2.R 68.47.2.L 68.67.2.R 68.71.2.R 70.33.8.L 70.64.2.R 70.72.2.R 72.64.2.R 72.72.2.R 74.40.2.L 78.33.12.L 80.67.2.R 80.72.2.R 80.76.2.R 82.36.2.L 82.66.2.R 82.71.2.R 82.74.2.R 84.64.2.R 84.69.2.R 84.72.2.R 86.40.2.L 86.66.2.R 86.72.2.R 86.76.2.R 88.64.4.R 88.71.4.R 88.74.4.R 90.35.8.L 94.40.2.L 98.35.8.L 98.66.2.R 98.69.2.R 100.64.2.R 100.67.2.R 102.42.2.L 102.63.2.R 102.66.2.R 104.47.2.L 106.35.8.L 106.66.2.R 106.71.2.R 108.47.2.L 110.42.2.L 110.63.2.R 110.66.2.R 112.47.2.L 114.35.8.L 114.64.2.R 114.67.2.R 116.47.2.L 118.40.2.L 118.59.2.R 118.64.2.R 122.35.8.L 126.40.2.L 128.59.2.R 130.35.8.L 130.64.2.R 132.66.2.R 134.40.2.L 134.67.2.R 136.64.4.R 138.35.8.L 142.40.2.L 144.59.2.R 146.35.8.L 146.64.2.R 148.66.2.R 150.40.2.L 150.67.2.R 152.64.4.R 154.35.8.L 158.40.2.L 160.59.2.R 162.35.8.L 162.64.2.R 164.66.2.R 166.40.2.L 166.64.2.R 166.67.2.R 170.35.16.L 170.66.2.R 172.64.2.R 174.38.2.L 174.62.2.R 174.67.2.R 178.38.2.L 178.66.2.R 180.64.2.R 182.36.2.L 182.60.2.R 182.64.2.R 182.71.2.R 186.36.2.L 186.60.2.R 186.64.2.R 186.71.2.R 190.35.4.L 190.59.2.R 190.63.2.R 190.71.2.R 192.47.2.L 194.35.4.L 194.66.2.R 194.69.2.R 196.47.2.L 196.67.2.R 196.71.2.R 198.33.8.L 198.64.2.R 198.72.2.R 200.64.2.R 200.72.2.R 202.40.2.L 206.33.12.L 208.67.2.R 208.72.2.R 208.76.2.R 210.36.2.L 210.66.2.R 210.71.2.R 210.74.2.R 212.64.2.R 212.69.2.R 212.72.2.R 214.40.2.L 214.66.2.R 214.72.2.R 214.76.2.R 216.64.4.R 216.71.4.R 216.74.4.R 218.35.8.L 222.40.2.L 226.35.8.L 226.66.2.R 226.69.2.R 228.64.2.R 228.67.2.R 230.42.2.L 230.63.2.R 230.66.2.R 232.47.2.L 234.35.8.L 234.66.2.R 234.71.2.R 236.47.2.L 238.42.2.L 238.63.2.R 238.66.2.R 240.47.2.L 242.35.8.L 242.64.2.R 242.67.2.R 244.47.2.L 246.40.2.L 246.59.2.R 246.64.2.R 250.35.8.L 254.40.2.L 258.35.16.L 258.71.2.R 258.76.2.R 262.41.2.L 262.72.2.R 262.77.2.R 266.36.2.L 270.41.2.L 272.60.2.R 274.36.2.L 274.65.2.R 276.67.2.R 278.41.2.L 278.68.2.R 280.65.2.R 282.36.2.L 286.41.2.L 288.60.2.R 290.36.2.L 290.65.2.R 292.67.2.R 294.41.2.L 294.68.2.R 296.65.2.R 298.36.2.L 302.41.2.L 304.60.2.R 306.36.2.L 306.65.2.R 308.67.2.R 310.41.2.L 310.65.2.R 310.68.2.R 314.36.2.L 314.67.2.R 316.65.2.R 318.39.2.L 318.63.2.R 318.68.2.R 322.39.2.L 322.67.2.R 324.65.2.R 326.37.2.L 326.61.2.R 326.65.2.R 326.72.2.R 330.37.2.L 330.61.2.R 330.65.2.R 330.72.2.R 334.36.2.L 334.60.2.R 334.64.2.R 334.72.2.R 338.36.2.L 338.67.2.R 338.70.2.R 340.68.2.R 340.72.2.R 342.34.8.L 342.65.2.R 342.73.2.R 344.65.2.R 344.73.2.R 346.41.2.L 350.34.16.L 352.68.2.R 352.73.2.R 352.77.2.R 354.37.2.L 354.67.2.R 354.72.2.R 354.75.2.R 356.65.2.R 356.70.2.R 356.73.2.R 358.41.2.L 358.67.2.R 358.73.2.R 358.77.2.R 360.65.2.R 360.72.2.R 360.75.2.R 362.36.2.L 366.41.2.L 370.36.2.L 370.67.2.R 370.70.2.R 372.65.2.R 372.68.2.R 374.43.2.L 374.64.2.R 374.67.2.R 378.36.2.L 378.67.2.R 378.72.2.R 382.43.2.L 382.64.2.R 382.67.2.R 386.36.2.L 386.65.2.R 386.68.2.R 390.41.2.L 390.60.2.R 390.65.2.R 394.36.2.L 398.41.2.L 400.60.2.R 402.36.2.L 402.65.2.R 404.67.2.R 406.41.2.L 406.68.2.R 408.65.2.R 410.36.2.L 414.41.2.L 416.60.2.R 418.36.2.L 418.65.2.R 420.67.2.R 422.41.2.L 422.68.2.R 424.65.2.R 426.36.2.L 430.41.2.L 432.60.2.R 434.36.2.L 434.65.2.R 436.67.2.R 438.41.2.L 438.65.2.R 438.68.2.R 442.36.2.L 442.67.2.R 444.65.2.R 446.39.2.L 446.63.2.R 446.68.2.R 450.39.2.L 450.67.2.R 452.65.2.R 454.37.2.L 454.61.2.R 454.65.2.R 454.72.2.R 458.37.2.L 458.61.2.R 458.65.2.R 458.72.2.R 462.36.2.L 462.60.2.R 462.64.2.R 462.72.2.R 466.36.2.L 466.67.2.R 466.70.2.R 468.68.2.R 468.72.2.R 470.34.8.L 470.65.2.R 470.73.2.R 472.65.2.R 472.73.2.R 474.41.2.L 478.34.16.L 480.68.2.R 480.73.2.R 480.77.2.R 482.37.2.L 482.67.2.R 482.72.2.R 482.75.2.R 484.65.2.R 484.70.2.R 484.73.2.R 486.41.2.L 486.67.2.R 486.73.2.R 486.77.2.R 488.65.2.R 488.72.2.R 488.75.2.R 490.36.2.L 494.41.2.L 498.36.2.L 498.67.2.R 498.70.2.R 500.65.2.R 500.68.2.R 502.43.2.L 502.64.2.R 502.67.2.R 506.36.2.L 506.67.2.R 506.72.2.R 510.43.2.L 510.64.2.R 510.67.2.R 514.36.2.L 514.65.2.R 514.68.2.R 518.41.2.L 518.60.2.R 518.65.2.R 522.36.2.L 526.41.2.L 530.36.2.L 530.72.2.R 530.77.2.R 534.42.2.L 534.73.2.R 534.78.2.R 538.37.2.L 542.42.2.L 544.61.2.R 546.37.2.L 546.66.2.R 548.68.2.R 550.42.2.L 550.69.2.R 552.66.2.R 554.37.2.L 558.42.2.L 560.61.2.R 562.37.2.L 562.66.2.R 564.68.2.R 566.42.2.L 566.69.2.R 568.66.2.R 570.37.2.L 574.42.2.L 576.61.2.R 578.37.2.L 578.66.2.R 580.68.2.R 582.42.2.L 582.66.2.R 582.69.2.R 586.37.2.L 586.68.2.R 588.66.2.R 590.40.2.L 590.64.2.R 590.69.2.R 594.40.2.L 594.68.2.R 596.66.2.R 598.38.2.L 598.62.2.R 598.66.2.R 598.73.2.R 602.38.2.L 602.62.2.R 602.66.2.R 602.73.2.R 606.37.2.L 606.61.2.R 606.65.2.R 606.73.2.R 610.37.2.L 610.68.2.R 610.71.2.R 612.69.2.R 612.73.2.R 614.35.8.L 614.66.2.R 614.74.2.R 616.66.2.R 616.74.2.R 618.42.2.L 622.35.16.L 624.69.2.R 624.74.2.R 624.78.2.R 626.38.2.L 626.68.2.R 626.73.2.R 626.76.2.R 628.66.2.R 628.71.2.R 628.74.2.R 630.42.2.L 630.68.2.R 630.74.2.R 630.78.2.R 632.66.2.R 632.73.2.R 632.76.2.R 634.37.2.L 638.42.2.L 642.37.2.L 642.68.2.R 642.71.2.R 644.66.2.R 644.69.2.R 646.44.2.L 646.65.2.R 646.68.2.R 648.59.2.R 650.37.2.L 650.68.2.R 650.73.2.R 652.59.2.R 654.44.2.L 654.65.2.R 654.68.2.R 656.59.2.R 658.37.2.L 658.66.2.R 658.69.2.R 660.59.2.R 662.42.2.L 662.61.2.R 662.66.2.R 666.37.2.L 670.42.2.L 672.61.2.R 674.37.2.L 674.66.2.R 676.68.2.R 678.42.2.L 678.69.2.R 680.66.2.R 682.37.2.L 686.42.2.L 688.61.2.R 690.37.2.L 690.66.2.R 692.68.2.R 694.42.2.L 694.69.2.R 696.66.2.R 698.37.2.L 702.42.2.L 704.61.2.R 706.37.2.L 706.66.2.R 708.68.2.R 710.42.2.L 710.66.2.R 710.69.2.R 714.37.2.L 714.68.2.R 716.66.2.R 718.40.2.L 718.64.2.R 718.69.2.R 722.40.2.L 722.68.2.R 724.66.2.R 726.38.2.L 726.62.2.R 726.66.2.R 726.73.2.R 730.38.2.L 730.62.2.R 730.66.2.R 730.73.2.R 734.37.2.L 734.61.2.R 734.65.2.R 734.73.2.R 738.37.2.L 738.68.2.R 738.71.2.R 740.69.2.R 740.73.2.R 742.35.8.L 742.66.2.R 742.74.2.R 744.66.2.R 744.74.2.R 746.42.2.L 750.35.16.L 752.69.2.R 752.74.2.R 752.78.2.R 754.38.2.L 754.68.2.R 754.73.2.R 754.76.2.R 756.66.2.R 756.71.2.R 756.74.2.R 758.42.2.L 758.68.2.R 758.74.2.R 758.78.2.R 760.66.2.R 760.73.2.R 760.76.2.R 762.37.2.L 766.42.2.L 770.37.2.L 770.68.2.R 770.71.2.R 772.66.2.R 772.69.2.R 774.44.2.L 774.65.2.R 774.68.2.R 776.59.2.R 778.37.2.L 778.68.2.R 778.73.2.R 780.59.2.R 782.44.2.L 782.65.2.R 782.68.2.R 784.59.2.R 786.37.2.L 786.66.2.R 786.69.2.R 788.59.2.R 790.42.2.L 790.61.2.R 790.66.2.R 794.37.2.L 798.42.2.L 802.37.2.L 802.68.2.R 802.71.2.R 804.69.2.R 804.73.2.R 806.35.8.L 806.66.2.R 806.74.2.R 808.66.2.R 808.74.2.R 810.42.2.L 814.35.16.L 816.69.2.R 816.74.2.R 816.78.2.R 818.38.2.L 818.68.2.R 818.73.2.R 818.76.2.R 820.66.2.R 820.71.2.R 820.74.2.R 822.42.2.L 822.68.2.R 822.74.2.R 822.78.2.R 824.66.2.R 824.73.2.R 824.76.2.R 826.37.2.L 830.42.2.L 834.37.2.L 834.68.2.R 834.71.2.R 836.66.2.R 836.69.2.R 838.44.2.L 838.65.2.R 838.68.2.R 840.59.2.R 842.37.2.L 842.68.2.R 842.73.2.R 844.59.2.R 846.44.2.L 846.65.2.R 846.68.2.R 848.59.2.R 850.37.2.L 850.66.2.R 850.69.2.R 852.59.2.R 854.42.2.L 854.61.2.R 854.66.2.R 858.37.2.L 862.42.2.L 866.37.2.L 866.68.2.R 866.71.2.R 868.69.2.R 868.73.2.R 870.35.8.L 870.66.2.R 870.74.2.R 872.66.2.R 872.74.2.R 874.42.2.L 878.35.16.L 880.69.2.R 880.74.2.R 880.78.2.R 882.38.2.L 882.68.2.R 882.73.2.R 882.76.2.R 884.66.2.R 884.71.2.R 884.74.2.R 886.42.2.L 886.68.2.R 886.74.2.R 886.78.2.R 888.66.2.R 888.73.2.R 888.76.2.R 890.37.2.L 894.42.2.L 898.37.2.L 898.68.2.R 898.71.2.R 900.66.2.R 900.69.2.R 902.44.2.L 902.65.2.R 902.68.2.R 904.59.2.R 906.37.2.L 906.68.2.R 906.73.2.R 908.59.2.R 910.44.2.L 910.65.2.R 910.68.2.R 912.59.2.R 914.37.2.L 914.66.2.R 914.69.2.R 916.59.2.R 918.42.8.L 918.61.8.R 918.66.8.R';
const BELLA_HARD = '0.59.2.R 2.64.2.R 4.66.2.R 6.40.2.L 6.67.2.R 8.52.4.L 8.55.4.L 8.64.4.R 10.35.8.L 12.52.2.L 12.55.2.L 14.40.2.L 16.52.2.L 16.55.2.L 16.59.2.R 18.35.8.L 18.64.2.R 20.52.2.L 20.55.2.L 20.66.2.R 22.40.2.L 22.67.2.R 24.52.4.L 24.55.4.L 24.64.4.R 26.35.8.L 28.52.2.L 28.55.2.L 30.40.2.L 32.52.2.L 32.55.2.L 32.59.2.R 34.35.8.L 34.64.2.R 36.52.2.L 36.55.2.L 36.66.2.R 38.40.2.L 38.64.2.R 38.67.2.R 40.52.2.L 40.55.2.L 42.35.16.L 42.66.2.R 44.52.2.L 44.55.2.L 44.64.2.R 46.38.2.L 46.62.2.R 46.67.2.R 48.50.2.L 48.54.2.L 50.38.2.L 50.66.2.R 52.50.2.L 52.54.2.L 52.64.2.R 54.36.2.L 54.60.2.R 54.64.2.R 54.71.2.R 56.48.2.L 56.52.2.L 58.36.2.L 58.60.2.R 58.64.2.R 58.71.2.R 60.48.2.L 60.52.2.L 62.35.4.L 62.59.2.R 62.63.2.R 62.71.2.R 64.47.2.L 64.51.2.L 66.35.4.L 66.66.2.R 66.69.2.R 68.47.2.L 68.51.2.L 68.67.2.R 68.71.2.R 70.33.8.L 70.64.2.R 70.72.2.R 72.48.2.L 72.52.2.L 72.64.2.R 72.72.2.R 74.40.2.L 76.48.4.L 76.52.4.L 78.33.12.L 80.48.2.L 80.52.2.L 80.67.2.R 80.72.2.R 80.76.2.R 82.36.2.L 82.66.2.R 82.71.2.R 82.74.2.R 84.48.2.L 84.52.2.L 84.64.2.R 84.69.2.R 84.72.2.R 86.40.2.L 86.66.2.R 86.72.2.R 86.76.2.R 88.52.4.L 88.55.4.L 88.64.4.R 88.71.4.R 88.74.4.R 90.35.8.L 92.52.2.L 92.55.2.L 94.40.2.L 96.52.2.L 96.55.2.L 98.35.8.L 98.66.2.R 98.69.2.R 100.52.2.L 100.55.2.L 100.64.2.R 100.67.2.R 102.42.2.L 102.63.2.R 102.66.2.R 104.47.2.L 104.51.2.L 104.57.2.L 106.35.8.L 106.66.2.R 106.71.2.R 108.47.2.L 108.51.2.L 108.57.2.L 110.42.2.L 110.63.2.R 110.66.2.R 112.47.2.L 112.51.2.L 112.57.2.L 114.35.8.L 114.64.2.R 114.67.2.R 116.47.2.L 116.51.2.L 116.57.2.L 118.40.2.L 118.59.2.R 118.64.2.R 120.52.4.L 120.55.4.L 122.35.8.L 124.52.2.L 124.55.2.L 126.40.2.L 128.52.2.L 128.55.2.L 128.59.2.R 130.35.8.L 130.64.2.R 132.52.2.L 132.55.2.L 132.66.2.R 134.40.2.L 134.67.2.R 136.52.4.L 136.55.4.L 136.64.4.R 138.35.8.L 140.52.2.L 140.55.2.L 142.40.2.L 144.52.2.L 144.55.2.L 144.59.2.R 146.35.8.L 146.64.2.R 148.52.2.L 148.55.2.L 148.66.2.R 150.40.2.L 150.67.2.R 152.52.4.L 152.55.4.L 152.64.4.R 154.35.8.L 156.52.2.L 156.55.2.L 158.40.2.L 160.52.2.L 160.55.2.L 160.59.2.R 162.35.8.L 162.64.2.R 164.52.2.L 164.55.2.L 164.66.2.R 166.40.2.L 166.64.2.R 166.67.2.R 168.52.2.L 168.55.2.L 170.35.16.L 170.66.2.R 172.52.2.L 172.55.2.L 172.64.2.R 174.38.2.L 174.62.2.R 174.67.2.R 176.50.2.L 176.54.2.L 178.38.2.L 178.66.2.R 180.50.2.L 180.54.2.L 180.64.2.R 182.36.2.L 182.60.2.R 182.64.2.R 182.71.2.R 184.48.2.L 184.52.2.L 186.36.2.L 186.60.2.R 186.64.2.R 186.71.2.R 188.48.2.L 188.52.2.L 190.35.4.L 190.59.2.R 190.63.2.R 190.71.2.R 192.47.2.L 192.51.2.L 194.35.4.L 194.66.2.R 194.69.2.R 196.47.2.L 196.51.2.L 196.67.2.R 196.71.2.R 198.33.8.L 198.64.2.R 198.72.2.R 200.48.2.L 200.52.2.L 200.64.2.R 200.72.2.R 202.40.2.L 204.48.4.L 204.52.4.L 206.33.12.L 208.48.2.L 208.52.2.L 208.67.2.R 208.72.2.R 208.76.2.R 210.36.2.L 210.66.2.R 210.71.2.R 210.74.2.R 212.48.2.L 212.52.2.L 212.64.2.R 212.69.2.R 212.72.2.R 214.40.2.L 214.66.2.R 214.72.2.R 214.76.2.R 216.52.4.L 216.55.4.L 216.64.4.R 216.71.4.R 216.74.4.R 218.35.8.L 220.52.2.L 220.55.2.L 222.40.2.L 224.52.2.L 224.55.2.L 226.35.8.L 226.66.2.R 226.69.2.R 228.52.2.L 228.55.2.L 228.64.2.R 228.67.2.R 230.42.2.L 230.63.2.R 230.66.2.R 232.47.2.L 232.51.2.L 232.57.2.L 234.35.8.L 234.66.2.R 234.71.2.R 236.47.2.L 236.51.2.L 236.57.2.L 238.42.2.L 238.63.2.R 238.66.2.R 240.47.2.L 240.51.2.L 240.57.2.L 242.35.8.L 242.64.2.R 242.67.2.R 244.47.2.L 244.51.2.L 244.57.2.L 246.40.2.L 246.59.2.R 246.64.2.R 248.52.4.L 248.55.4.L 250.35.8.L 252.52.2.L 252.55.2.L 254.40.2.L 256.52.2.L 256.55.2.L 258.35.16.L 258.71.2.R 258.76.2.R 260.52.2.L 260.55.2.L 262.41.2.L 262.72.2.R 262.77.2.R 264.53.2.L 264.56.2.L 266.36.2.L 268.53.2.L 268.56.2.L 270.41.2.L 272.53.2.L 272.56.2.L 272.60.2.R 274.36.2.L 274.65.2.R 276.53.2.L 276.56.2.L 276.67.2.R 278.41.2.L 278.68.2.R 280.53.2.L 280.56.2.L 280.65.2.R 282.36.2.L 284.53.2.L 284.56.2.L 286.41.2.L 288.53.2.L 288.56.2.L 288.60.2.R 290.36.2.L 290.65.2.R 292.53.2.L 292.56.2.L 292.67.2.R 294.41.2.L 294.68.2.R 296.53.2.L 296.56.2.L 296.65.2.R 298.36.2.L 300.53.2.L 300.56.2.L 302.41.2.L 304.53.2.L 304.56.2.L 304.60.2.R 306.36.2.L 306.65.2.R 308.53.2.L 308.56.2.L 308.67.2.R 310.41.2.L 310.65.2.R 310.68.2.R 312.53.2.L 312.56.2.L 314.36.2.L 314.67.2.R 316.53.2.L 316.56.2.L 316.65.2.R 318.39.2.L 318.63.2.R 318.68.2.R 320.51.2.L 320.55.2.L 322.39.2.L 322.67.2.R 324.51.2.L 324.55.2.L 324.65.2.R 326.37.2.L 326.61.2.R 326.65.2.R 326.72.2.R 328.49.2.L 328.53.2.L 330.37.2.L 330.61.2.R 330.65.2.R 330.72.2.R 332.49.2.L 332.53.2.L 334.36.2.L 334.60.2.R 334.64.2.R 334.72.2.R 336.48.2.L 336.52.2.L 338.36.2.L 338.67.2.R 338.70.2.R 340.48.2.L 340.52.2.L 340.68.2.R 340.72.2.R 342.34.8.L 342.65.2.R 342.73.2.R 344.49.2.L 344.53.2.L 344.65.2.R 344.73.2.R 346.41.2.L 348.49.4.L 348.53.4.L 350.34.16.L 352.49.2.L 352.53.2.L 352.68.2.R 352.73.2.R 352.77.2.R 354.37.2.L 354.67.2.R 354.72.2.R 354.75.2.R 356.49.2.L 356.53.2.L 356.65.2.R 356.70.2.R 356.73.2.R 358.41.2.L 358.67.2.R 358.73.2.R 358.77.2.R 360.53.2.L 360.56.2.L 360.65.2.R 360.72.2.R 360.75.2.R 362.36.2.L 364.53.2.L 364.56.2.L 366.41.2.L 368.53.2.L 368.56.2.L 370.36.2.L 370.67.2.R 370.70.2.R 372.53.2.L 372.56.2.L 372.65.2.R 372.68.2.R 374.43.2.L 374.64.2.R 374.67.2.R 376.48.2.L 376.52.2.L 376.58.2.R 378.36.2.L 378.67.2.R 378.72.2.R 380.48.2.L 380.52.2.L 380.58.2.R 382.43.2.L 382.64.2.R 382.67.2.R 384.48.2.L 384.52.2.L 384.58.2.R 386.36.2.L 386.65.2.R 386.68.2.R 388.48.2.L 388.52.2.L 388.58.2.R 390.41.2.L 390.60.2.R 390.65.2.R 392.53.2.L 392.56.2.L 394.36.2.L 396.53.2.L 396.56.2.L 398.41.2.L 400.53.2.L 400.56.2.L 400.60.2.R 402.36.2.L 402.65.2.R 404.53.2.L 404.56.2.L 404.67.2.R 406.41.2.L 406.68.2.R 408.53.2.L 408.56.2.L 408.65.2.R 410.36.2.L 412.53.2.L 412.56.2.L 414.41.2.L 416.53.2.L 416.56.2.L 416.60.2.R 418.36.2.L 418.65.2.R 420.53.2.L 420.56.2.L 420.67.2.R 422.41.2.L 422.68.2.R 424.53.2.L 424.56.2.L 424.65.2.R 426.36.2.L 428.53.2.L 428.56.2.L 430.41.2.L 432.53.2.L 432.56.2.L 432.60.2.R 434.36.2.L 434.65.2.R 436.53.2.L 436.56.2.L 436.67.2.R 438.41.2.L 438.65.2.R 438.68.2.R 440.53.2.L 440.56.2.L 442.36.2.L 442.67.2.R 444.53.2.L 444.56.2.L 444.65.2.R 446.39.2.L 446.63.2.R 446.68.2.R 448.51.2.L 448.55.2.L 450.39.2.L 450.67.2.R 452.51.2.L 452.55.2.L 452.65.2.R 454.37.2.L 454.61.2.R 454.65.2.R 454.72.2.R 456.49.2.L 456.53.2.L 458.37.2.L 458.61.2.R 458.65.2.R 458.72.2.R 460.49.2.L 460.53.2.L 462.36.2.L 462.60.2.R 462.64.2.R 462.72.2.R 464.48.2.L 464.52.2.L 466.36.2.L 466.67.2.R 466.70.2.R 468.48.2.L 468.52.2.L 468.68.2.R 468.72.2.R 470.34.8.L 470.65.2.R 470.73.2.R 472.49.2.L 472.53.2.L 472.65.2.R 472.73.2.R 474.41.2.L 476.49.4.L 476.53.4.L 478.34.16.L 480.49.2.L 480.53.2.L 480.68.2.R 480.73.2.R 480.77.2.R 482.37.2.L 482.67.2.R 482.72.2.R 482.75.2.R 484.49.2.L 484.53.2.L 484.65.2.R 484.70.2.R 484.73.2.R 486.41.2.L 486.67.2.R 486.73.2.R 486.77.2.R 488.53.2.L 488.56.2.L 488.65.2.R 488.72.2.R 488.75.2.R 490.36.2.L 492.53.2.L 492.56.2.L 494.41.2.L 496.53.2.L 496.56.2.L 498.36.2.L 498.67.2.R 498.70.2.R 500.53.2.L 500.56.2.L 500.65.2.R 500.68.2.R 502.43.2.L 502.64.2.R 502.67.2.R 504.48.2.L 504.52.2.L 504.58.2.R 506.36.2.L 506.67.2.R 506.72.2.R 508.48.2.L 508.52.2.L 508.58.2.R 510.43.2.L 510.64.2.R 510.67.2.R 512.48.2.L 512.52.2.L 512.58.2.R 514.36.2.L 514.65.2.R 514.68.2.R 516.48.2.L 516.52.2.L 516.58.2.R 518.41.2.L 518.60.2.R 518.65.2.R 520.53.2.L 520.56.2.L 522.36.2.L 524.53.2.L 524.56.2.L 526.41.2.L 528.53.2.L 528.56.2.L 530.36.2.L 530.72.2.R 530.77.2.R 532.53.2.L 532.56.2.L 534.42.2.L 534.73.2.R 534.78.2.R 536.54.2.L 536.57.2.L 538.37.2.L 540.54.2.L 540.57.2.L 542.42.2.L 544.54.2.L 544.57.2.L 544.61.2.R 546.37.2.L 546.66.2.R 548.54.2.L 548.57.2.L 548.68.2.R 550.42.2.L 550.69.2.R 552.54.2.L 552.57.2.L 552.66.2.R 554.37.2.L 556.54.2.L 556.57.2.L 558.42.2.L 560.54.2.L 560.57.2.L 560.61.2.R 562.37.2.L 562.66.2.R 564.54.2.L 564.57.2.L 564.68.2.R 566.42.2.L 566.69.2.R 568.54.2.L 568.57.2.L 568.66.2.R 570.37.2.L 572.54.2.L 572.57.2.L 574.42.2.L 576.54.2.L 576.57.2.L 576.61.2.R 578.37.2.L 578.66.2.R 580.54.2.L 580.57.2.L 580.68.2.R 582.42.2.L 582.66.2.R 582.69.2.R 584.54.2.L 584.57.2.L 586.37.2.L 586.68.2.R 588.54.2.L 588.57.2.L 588.66.2.R 590.40.2.L 590.64.2.R 590.69.2.R 592.52.2.L 592.56.2.L 594.40.2.L 594.68.2.R 596.52.2.L 596.56.2.L 596.66.2.R 598.38.2.L 598.62.2.R 598.66.2.R 598.73.2.R 600.50.2.L 600.54.2.L 602.38.2.L 602.62.2.R 602.66.2.R 602.73.2.R 604.50.2.L 604.54.2.L 606.37.2.L 606.61.2.R 606.65.2.R 606.73.2.R 608.49.2.L 608.53.2.L 610.37.2.L 610.68.2.R 610.71.2.R 612.49.2.L 612.53.2.L 612.69.2.R 612.73.2.R 614.35.8.L 614.66.2.R 614.74.2.R 616.50.2.L 616.54.2.L 616.66.2.R 616.74.2.R 618.42.2.L 620.50.4.L 620.54.4.L 622.35.16.L 624.50.2.L 624.54.2.L 624.69.2.R 624.74.2.R 624.78.2.R 626.38.2.L 626.68.2.R 626.73.2.R 626.76.2.R 628.50.2.L 628.54.2.L 628.66.2.R 628.71.2.R 628.74.2.R 630.42.2.L 630.68.2.R 630.74.2.R 630.78.2.R 632.54.2.L 632.57.2.L 632.66.2.R 632.73.2.R 632.76.2.R 634.37.2.L 636.54.2.L 636.57.2.L 638.42.2.L 640.54.2.L 640.57.2.L 642.37.2.L 642.68.2.R 642.71.2.R 644.54.2.L 644.57.2.L 644.66.2.R 644.69.2.R 646.44.2.L 646.65.2.R 646.68.2.R 648.49.2.L 648.53.2.L 648.59.2.R 650.37.2.L 650.68.2.R 650.73.2.R 652.49.2.L 652.53.2.L 652.59.2.R 654.44.2.L 654.65.2.R 654.68.2.R 656.49.2.L 656.53.2.L 656.59.2.R 658.37.2.L 658.66.2.R 658.69.2.R 660.49.2.L 660.53.2.L 660.59.2.R 662.42.2.L 662.61.2.R 662.66.2.R 664.54.2.L 664.57.2.L 666.37.2.L 668.54.2.L 668.57.2.L 670.42.2.L 672.54.2.L 672.57.2.L 672.61.2.R 674.37.2.L 674.66.2.R 676.54.2.L 676.57.2.L 676.68.2.R 678.42.2.L 678.69.2.R 680.54.2.L 680.57.2.L 680.66.2.R 682.37.2.L 684.54.2.L 684.57.2.L 686.42.2.L 688.54.2.L 688.57.2.L 688.61.2.R 690.37.2.L 690.66.2.R 692.54.2.L 692.57.2.L 692.68.2.R 694.42.2.L 694.69.2.R 696.54.2.L 696.57.2.L 696.66.2.R 698.37.2.L 700.54.2.L 700.57.2.L 702.42.2.L 704.54.2.L 704.57.2.L 704.61.2.R 706.37.2.L 706.66.2.R 708.54.2.L 708.57.2.L 708.68.2.R 710.42.2.L 710.66.2.R 710.69.2.R 712.54.2.L 712.57.2.L 714.37.2.L 714.68.2.R 716.54.2.L 716.57.2.L 716.66.2.R 718.40.2.L 718.64.2.R 718.69.2.R 720.52.2.L 720.56.2.L 722.40.2.L 722.68.2.R 724.52.2.L 724.56.2.L 724.66.2.R 726.38.2.L 726.62.2.R 726.66.2.R 726.73.2.R 728.50.2.L 728.54.2.L 730.38.2.L 730.62.2.R 730.66.2.R 730.73.2.R 732.50.2.L 732.54.2.L 734.37.2.L 734.61.2.R 734.65.2.R 734.73.2.R 736.49.2.L 736.53.2.L 738.37.2.L 738.68.2.R 738.71.2.R 740.49.2.L 740.53.2.L 740.69.2.R 740.73.2.R 742.35.8.L 742.66.2.R 742.74.2.R 744.50.2.L 744.54.2.L 744.66.2.R 744.74.2.R 746.42.2.L 748.50.4.L 748.54.4.L 750.35.16.L 752.50.2.L 752.54.2.L 752.69.2.R 752.74.2.R 752.78.2.R 754.38.2.L 754.68.2.R 754.73.2.R 754.76.2.R 756.50.2.L 756.54.2.L 756.66.2.R 756.71.2.R 756.74.2.R 758.42.2.L 758.68.2.R 758.74.2.R 758.78.2.R 760.54.2.L 760.57.2.L 760.66.2.R 760.73.2.R 760.76.2.R 762.37.2.L 764.54.2.L 764.57.2.L 766.42.2.L 768.54.2.L 768.57.2.L 770.37.2.L 770.68.2.R 770.71.2.R 772.54.2.L 772.57.2.L 772.66.2.R 772.69.2.R 774.44.2.L 774.65.2.R 774.68.2.R 776.49.2.L 776.53.2.L 776.59.2.R 778.37.2.L 778.68.2.R 778.73.2.R 780.49.2.L 780.53.2.L 780.59.2.R 782.44.2.L 782.65.2.R 782.68.2.R 784.49.2.L 784.53.2.L 784.59.2.R 786.37.2.L 786.66.2.R 786.69.2.R 788.49.2.L 788.53.2.L 788.59.2.R 790.42.2.L 790.61.2.R 790.66.2.R 792.54.2.L 792.57.2.L 794.37.2.L 796.54.2.L 796.57.2.L 798.42.2.L 800.54.2.L 800.57.2.L 802.37.2.L 802.68.2.R 802.71.2.R 804.54.2.L 804.57.2.L 804.69.2.R 804.73.2.R 806.35.8.L 806.66.2.R 806.74.2.R 808.50.2.L 808.54.2.L 808.66.2.R 808.74.2.R 810.42.2.L 812.50.4.L 812.54.4.L 814.35.16.L 816.50.2.L 816.54.2.L 816.69.2.R 816.74.2.R 816.78.2.R 818.38.2.L 818.68.2.R 818.73.2.R 818.76.2.R 820.50.2.L 820.54.2.L 820.66.2.R 820.71.2.R 820.74.2.R 822.42.2.L 822.68.2.R 822.74.2.R 822.78.2.R 824.54.2.L 824.57.2.L 824.66.2.R 824.73.2.R 824.76.2.R 826.37.2.L 828.54.2.L 828.57.2.L 830.42.2.L 832.54.2.L 832.57.2.L 834.37.2.L 834.68.2.R 834.71.2.R 836.54.2.L 836.57.2.L 836.66.2.R 836.69.2.R 838.44.2.L 838.65.2.R 838.68.2.R 840.49.2.L 840.53.2.L 840.59.2.R 842.37.2.L 842.68.2.R 842.73.2.R 844.49.2.L 844.53.2.L 844.59.2.R 846.44.2.L 846.65.2.R 846.68.2.R 848.49.2.L 848.53.2.L 848.59.2.R 850.37.2.L 850.66.2.R 850.69.2.R 852.49.2.L 852.53.2.L 852.59.2.R 854.42.2.L 854.61.2.R 854.66.2.R 856.54.2.L 856.57.2.L 858.37.2.L 860.54.2.L 860.57.2.L 862.42.2.L 864.54.2.L 864.57.2.L 866.37.2.L 866.68.2.R 866.71.2.R 868.54.2.L 868.57.2.L 868.69.2.R 868.73.2.R 870.35.8.L 870.66.2.R 870.74.2.R 872.50.2.L 872.54.2.L 872.66.2.R 872.74.2.R 874.42.2.L 876.50.4.L 876.54.4.L 878.35.16.L 880.50.2.L 880.54.2.L 880.69.2.R 880.74.2.R 880.78.2.R 882.38.2.L 882.68.2.R 882.73.2.R 882.76.2.R 884.50.2.L 884.54.2.L 884.66.2.R 884.71.2.R 884.74.2.R 886.42.2.L 886.68.2.R 886.74.2.R 886.78.2.R 888.54.2.L 888.57.2.L 888.66.2.R 888.73.2.R 888.76.2.R 890.37.2.L 892.54.2.L 892.57.2.L 894.42.2.L 896.54.2.L 896.57.2.L 898.37.2.L 898.68.2.R 898.71.2.R 900.54.2.L 900.57.2.L 900.66.2.R 900.69.2.R 902.44.2.L 902.65.2.R 902.68.2.R 904.49.2.L 904.53.2.L 904.59.2.R 906.37.2.L 906.68.2.R 906.73.2.R 908.49.2.L 908.53.2.L 908.59.2.R 910.44.2.L 910.65.2.R 910.68.2.R 912.49.2.L 912.53.2.L 912.59.2.R 914.37.2.L 914.66.2.R 914.69.2.R 916.49.2.L 916.53.2.L 916.59.2.R 918.42.8.L 918.49.8.L 918.57.8.L 918.61.8.R 918.66.8.R';
const SYU_EASY = '0.40.8.L 0.62.2.R 2.69.2.R 4.67.2.R 6.62.4.R 8.43.8.L 10.67.1.R 11.69.1.R 12.71.1.R 13.69.1.R 14.67.1.R 15.69.1.R 16.48.8.L 16.62.2.R 18.69.2.R 20.67.2.R 22.59.4.R 24.43.4.L 26.67.1.R 27.69.1.R 28.50.4.L 28.71.1.R 29.69.1.R 30.67.1.R 31.69.1.R 32.40.8.L 32.62.2.R 34.69.2.R 36.67.2.R 38.62.4.R 40.43.8.L 42.67.1.R 43.69.1.R 44.71.1.R 45.69.1.R 46.67.1.R 47.69.1.R 48.48.8.L 48.62.2.R 50.69.2.R 52.67.2.R 54.62.8.R 56.43.4.L 60.50.4.L 62.50.2.R 64.40.16.L 64.52.6.R 70.50.8.R 80.43.16.L 94.50.2.R 96.48.16.L 96.52.2.R 98.54.2.R 100.52.2.R 102.50.8.R 112.43.16.L 127.50.1.R';
const SYU_MED = '0.62.2.R 2.69.2.R 4.67.2.R 6.62.4.R 10.67.1.R 11.69.1.R 12.71.1.R 13.69.1.R 14.67.1.R 15.69.1.R 16.62.2.R 18.69.2.R 20.67.2.R 22.59.4.R 26.67.1.R 27.69.1.R 28.71.1.R 29.69.1.R 30.67.1.R 31.69.1.R 32.62.2.R 34.69.2.R 36.67.2.R 38.62.4.R 42.67.1.R 43.69.1.R 44.71.1.R 45.69.1.R 46.67.1.R 47.69.1.R 48.62.2.R 50.69.2.R 52.67.2.R 54.62.8.R 58.43.2.L 60.47.16.L 62.50.2.R 64.52.6.R 70.50.8.R 78.43.2.L 80.45.2.L 82.45.2.L 84.43.2.L 86.47.6.L 92.47.12.L 94.50.2.R 96.52.2.R 98.54.2.R 100.52.2.R 102.50.8.R 104.47.2.L 106.45.2.L 108.45.2.L 110.43.2.L 112.45.2.L 114.45.2.L 116.47.2.L 118.43.7.L 125.45.1.L 126.47.16.L 127.50.1.R 128.52.2.R 130.54.1.R 131.52.2.R 133.50.8.R 142.43.2.L 144.45.2.L 146.45.2.L 148.43.2.L 150.47.6.L 156.47.16.L 158.50.2.R 160.52.2.R 162.55.2.R 164.57.2.R 166.59.2.R 168.57.2.R 170.55.2.R 172.52.2.R 174.55.2.R 176.57.2.R 178.57.2.R 180.55.2.R 182.55.6.R 188.52.2.R 190.55.2.R 192.57.2.R 194.57.2.R 196.55.2.R 198.55.8.R 208.59.3.R 211.57.1.R 212.59.3.R 215.57.1.R 216.59.3.R 219.57.1.R 220.59.1.R 221.62.1.R 222.59.1.R 223.57.1.R 224.55.3.R 227.54.1.R 228.55.2.R 230.57.1.R 231.59.7.R 238.52.1.R 239.54.1.R 240.55.3.R 243.54.1.R 244.55.2.R 246.57.1.R 247.59.8.R 256.55.3.R 259.54.1.R 260.55.2.R 262.57.1.R 263.55.6.R 269.54.1.R 270.55.1.R 271.57.1.R 272.59.3.R 275.57.1.R 276.59.3.R 279.57.1.R 280.59.3.R 283.57.1.R 284.59.1.R 285.62.1.R 286.59.1.R 287.57.1.R 288.55.3.R 291.54.1.R 292.55.2.R 294.57.1.R 295.59.7.R 302.52.1.R 303.54.1.R 304.55.3.R 307.54.1.R 308.55.2.R 310.57.1.R 311.59.8.R 320.55.3.R 323.54.1.R 324.55.2.R 326.57.1.R 327.55.8.R 342.54.6.R 348.55.1.R 349.55.1.R 350.55.1.R 351.59.2.R 353.55.1.R 354.55.1.R 355.55.1.R 356.55.1.R 357.55.1.R 358.55.1.R 359.55.1.R 360.55.1.R 361.55.1.R 362.55.1.R 363.55.1.R 364.52.3.R 367.59.1.R 368.55.1.R 369.55.1.R 370.55.1.R 371.55.1.R 372.55.1.R 373.55.1.R 374.55.1.R 375.55.1.R 376.55.1.R 377.55.1.R 378.55.1.R 379.55.1.R 380.52.3.R 383.52.1.R 384.59.1.R 385.55.1.R 386.55.1.R 387.55.1.R 388.55.1.R 389.55.1.R 390.55.1.R 391.55.1.R 392.55.6.R 394.43.2.L 396.47.16.L 398.50.2.R 400.52.6.R 406.50.8.R 414.43.2.L 416.45.2.L 418.45.2.L 420.43.2.L 422.47.6.L 428.47.12.L 430.50.2.R 432.52.2.R 434.54.2.R 436.52.2.R 438.50.8.R 440.47.2.L 442.45.2.L 444.45.2.L 446.43.2.L 448.45.2.L 450.45.2.L 452.47.2.L 454.43.7.L 461.45.1.L 462.47.16.L 463.50.1.R 464.52.2.R 466.54.1.R 467.52.2.R 469.50.8.R 478.43.2.L 480.45.2.L 482.45.2.L 484.43.2.L 486.47.6.L 492.47.16.L 494.50.2.R 496.52.2.R 498.55.2.R 500.57.2.R 502.59.2.R 504.57.2.R 506.55.2.R 508.52.2.R 510.55.2.R 512.57.2.R 514.57.2.R 516.55.2.R 518.55.6.R 524.52.2.R 526.55.2.R 528.57.2.R 530.57.2.R 532.55.2.R 534.55.6.R 540.55.2.R 542.54.2.R 544.52.6.R 550.50.6.R 556.55.2.R 558.54.2.R 560.52.3.R 563.54.1.R 564.52.2.R 566.50.6.R 568.47.16.L 572.50.1.R 573.52.1.R 574.55.1.R 575.57.2.R 577.59.2.R 579.57.1.R 580.59.3.R 583.57.1.R 584.59.3.R 587.57.1.R 588.59.1.R 589.62.1.R 590.59.1.R 591.57.1.R 592.55.3.R 595.52.1.R 596.55.2.R 598.57.1.R 599.55.8.R 621.52.1.R 622.52.1.R 623.55.2.R 625.52.1.R 626.52.1.R 627.52.1.R 628.52.1.R 629.52.1.R 630.52.1.R 631.55.2.R 633.52.1.R 634.52.1.R 635.52.1.R 636.52.1.R 637.52.1.R 638.52.1.R 639.55.1.R 640.55.1.R 641.52.1.R 642.52.1.R 643.52.1.R 644.52.1.R 645.52.1.R 646.52.1.R 647.55.1.R 648.52.1.R 649.52.1.R 650.52.1.R 651.52.1.R 652.52.1.R 653.52.1.R 654.52.1.R 655.55.1.R 656.52.1.R 657.52.1.R 658.52.1.R 659.52.1.R 660.55.1.R 661.52.1.R 662.52.1.R 663.55.1.R 664.52.1.R 665.52.1.R 666.52.1.R 667.52.1.R 668.52.8.R 685.52.1.R 686.52.1.R 687.55.1.R 688.52.1.R 689.52.1.R 690.52.2.R 692.52.1.R 693.52.1.R 694.52.1.R 695.55.1.R 696.52.1.R 697.52.1.R 698.52.1.R 699.52.1.R 700.52.2.R 702.52.1.R 703.55.1.R 704.52.1.R 705.52.1.R 706.52.1.R 707.52.1.R 708.52.1.R 709.52.1.R 710.52.1.R 711.55.2.R 713.52.1.R 714.52.1.R 715.52.1.R 716.52.1.R 717.52.1.R 718.52.1.R 719.55.2.R 721.52.1.R 722.52.1.R 723.52.1.R 724.52.1.R 725.52.1.R 726.52.1.R 727.55.1.R 728.52.1.R 729.52.1.R 730.52.1.R 731.52.1.R 732.52.8.R 748.55.1.R 749.55.1.R 750.55.1.R 751.59.2.R 753.55.1.R 754.55.1.R 755.55.1.R 756.55.1.R 757.55.1.R 758.55.1.R 759.59.1.R 760.55.1.R 761.55.1.R 762.55.1.R 763.55.1.R 764.52.3.R 767.59.1.R 768.55.1.R 769.55.1.R 770.55.1.R 771.55.1.R 772.55.1.R 773.55.1.R 774.55.1.R 775.55.1.R 776.55.1.R 777.55.1.R 778.55.1.R 779.55.1.R 780.52.3.R 783.52.1.R 784.59.1.R 785.55.1.R 786.55.1.R 787.55.1.R 788.55.1.R 789.55.1.R 790.55.1.R 791.55.1.R 792.55.6.R 794.43.2.L 796.47.16.L 798.50.2.R 800.52.6.R 806.50.8.R 812.43.2.L 814.45.4.L 818.47.8.L 826.43.16.L 834.52.2.R 836.52.2.R 838.52.1.R 839.52.3.R 842.50.2.R 844.50.3.R 846.47.15.L 847.50.3.R 850.52.8.R 861.45.1.L 862.45.1.L 863.47.16.L 864.48.2.R 866.57.2.R 868.55.3.R 871.52.8.R 880.59.2.R 882.57.2.R 884.57.2.R 886.59.1.R 887.57.1.R 888.55.4.R 892.54.2.R 894.55.1.R 895.54.1.R 896.52.6.R 902.54.8.R 910.55.1.R 911.57.1.R 912.55.8.R 922.43.2.L 924.47.16.L 926.50.2.R 928.52.6.R 934.50.8.R 942.43.2.L 944.45.2.L 946.45.2.L 948.43.2.L 950.47.6.L 956.47.12.L 958.50.2.R 960.52.2.R 962.54.2.R 964.52.2.R 966.50.8.R 968.47.2.L 970.45.2.L 972.45.2.L 974.43.2.L 976.45.2.L 978.45.2.L 980.47.2.L 982.43.7.L 989.45.1.L 990.47.16.L 991.50.1.R 992.52.2.R 994.54.1.R 995.52.2.R 997.50.8.R 1006.43.2.L 1008.45.2.L 1010.45.2.L 1012.43.2.L 1014.47.6.L 1020.47.16.L 1022.50.2.R 1024.52.2.R 1026.55.2.R 1028.57.2.R 1030.59.2.R 1032.57.2.R 1034.55.2.R 1036.52.2.R 1038.55.2.R 1040.57.2.R 1042.57.2.R 1044.55.2.R 1046.55.6.R 1052.52.2.R 1054.55.2.R 1056.57.2.R 1058.57.2.R 1060.55.2.R 1062.59.6.R 1068.55.2.R 1070.54.2.R 1072.52.6.R 1078.50.6.R 1084.55.2.R 1086.54.2.R 1088.52.3.R 1091.54.1.R 1092.52.2.R 1094.50.6.R 1096.47.16.L 1100.50.1.R 1101.52.1.R 1102.55.1.R 1103.57.2.R 1105.59.2.R 1107.57.1.R 1108.59.3.R 1111.57.1.R 1112.59.3.R 1115.57.1.R 1116.59.1.R 1117.62.1.R 1118.59.1.R 1119.55.1.R 1120.55.3.R 1123.52.1.R 1124.55.2.R 1126.57.1.R 1127.55.5.R 1132.55.2.R 1134.54.2.R 1136.52.6.R 1142.50.6.R 1148.55.2.R 1150.54.2.R 1152.52.3.R 1155.54.1.R 1156.52.2.R 1158.50.6.R 1160.47.16.L 1164.50.1.R 1165.52.1.R 1166.55.1.R 1167.57.2.R 1169.59.2.R 1171.57.1.R 1172.59.3.R 1175.57.1.R 1176.59.2.R 1178.57.2.R 1180.52.2.R 1182.55.2.R 1184.57.2.R 1186.57.2.R 1188.55.2.R 1190.55.8.R';
const SYU_HARD = '0.62.2.R 2.69.2.R 4.67.2.R 6.62.4.R 10.67.1.R 11.69.1.R 12.71.1.R 13.69.1.R 14.67.1.R 15.69.1.R 16.62.2.R 18.69.2.R 20.67.2.R 22.59.4.R 26.67.1.R 27.69.1.R 28.71.1.R 29.69.1.R 30.67.1.R 31.69.1.R 32.62.2.R 34.69.2.R 36.67.2.R 38.62.4.R 42.67.1.R 43.69.1.R 44.71.1.R 45.69.1.R 46.67.1.R 47.69.1.R 48.62.2.R 50.69.2.R 52.67.2.R 54.62.8.R 58.43.2.L 60.47.2.L 62.50.2.R 62.59.2.L 64.47.2.L 64.52.6.R 64.64.6.R 66.59.2.L 68.47.2.L 70.50.8.R 70.59.2.L 70.62.8.R 72.47.2.L 74.59.2.L 78.43.2.L 80.45.2.L 82.45.2.L 84.43.2.L 86.47.6.L 92.47.2.L 94.50.2.R 94.59.2.L 94.62.2.R 96.47.2.L 96.52.2.R 96.64.2.R 98.54.2.R 98.59.2.L 98.66.2.R 100.47.2.L 100.52.2.R 100.64.2.R 102.50.8.R 102.59.2.L 102.62.8.R 104.47.2.L 106.45.2.L 108.45.2.L 110.43.2.L 112.45.2.L 114.45.2.L 116.47.2.L 118.43.7.L 125.45.1.L 126.47.2.L 127.50.1.R 127.62.1.R 128.52.2.R 128.59.2.L 128.64.2.R 130.47.2.L 130.54.1.R 130.66.1.R 131.52.2.R 131.64.2.R 132.59.2.L 133.50.8.R 133.62.8.R 134.47.2.L 136.59.2.L 138.47.2.L 140.59.2.L 142.43.2.L 144.45.2.L 146.45.2.L 148.43.2.L 150.47.6.L 156.47.2.L 158.50.2.R 158.59.2.L 158.62.2.R 160.47.2.L 160.52.2.R 160.64.2.R 162.55.2.R 162.59.2.L 162.67.2.R 164.47.2.L 164.57.2.R 164.69.2.R 166.59.2.L 166.59.2.R 166.71.2.R 168.47.2.L 168.57.2.R 168.69.2.R 170.55.2.R 170.59.2.L 170.67.2.R 172.52.2.R 172.64.2.R 174.55.2.R 174.67.2.R 176.57.2.R 176.69.2.R 178.57.2.R 178.69.2.R 180.55.2.R 180.67.2.R 182.55.6.R 182.67.6.R 188.52.2.R 188.64.2.R 190.55.2.R 190.67.2.R 192.57.2.R 192.69.2.R 194.57.2.R 194.69.2.R 196.55.2.R 196.67.2.R 198.55.8.R 198.67.8.R 208.59.3.R 211.57.1.R 212.59.3.R 215.57.1.R 216.59.3.R 219.57.1.R 220.59.1.R 221.62.1.R 222.59.1.R 223.57.1.R 224.55.3.R 227.54.1.R 228.55.2.R 230.57.1.R 231.59.7.R 238.52.1.R 239.54.1.R 240.55.3.R 243.54.1.R 244.55.2.R 246.57.1.R 247.59.8.R 256.55.3.R 259.54.1.R 260.55.2.R 262.57.1.R 263.55.6.R 269.54.1.R 270.55.1.R 271.57.1.R 272.59.3.R 275.57.1.R 276.59.3.R 279.57.1.R 280.59.3.R 283.57.1.R 284.59.1.R 285.62.1.R 286.59.1.R 287.57.1.R 288.55.3.R 291.54.1.R 292.55.2.R 294.57.1.R 295.59.7.R 302.52.1.R 303.54.1.R 304.55.3.R 307.54.1.R 308.55.2.R 310.57.1.R 311.59.8.R 320.55.3.R 323.54.1.R 324.55.2.R 326.57.1.R 327.55.8.R 342.54.6.R 348.55.1.R 349.55.1.R 350.55.1.R 351.59.2.R 353.55.1.R 354.55.1.R 355.55.1.R 356.55.1.R 357.55.1.R 358.55.1.R 359.55.1.R 360.55.1.R 361.55.1.R 362.55.1.R 363.55.1.R 364.52.3.R 367.59.1.R 368.55.1.R 369.55.1.R 370.55.1.R 371.55.1.R 372.55.1.R 373.55.1.R 374.55.1.R 375.55.1.R 376.55.1.R 377.55.1.R 378.55.1.R 379.55.1.R 380.52.3.R 383.52.1.R 384.59.1.R 385.55.1.R 386.55.1.R 387.55.1.R 388.55.1.R 389.55.1.R 390.55.1.R 391.55.1.R 392.55.6.R 394.43.2.L 396.47.2.L 398.50.2.R 398.59.2.L 400.47.2.L 400.52.6.R 402.59.2.L 404.47.2.L 406.50.8.R 406.59.2.L 408.47.2.L 410.59.2.L 414.43.2.L 416.45.2.L 418.45.2.L 420.43.2.L 422.47.6.L 428.47.2.L 430.50.2.R 430.59.2.L 430.62.2.R 432.47.2.L 432.52.2.R 432.64.2.R 434.54.2.R 434.59.2.L 434.66.2.R 436.47.2.L 436.52.2.R 436.64.2.R 438.50.8.R 438.59.2.L 438.62.8.R 440.47.2.L 442.45.2.L 444.45.2.L 446.43.2.L 448.45.2.L 450.45.2.L 452.47.2.L 454.43.7.L 461.45.1.L 462.47.2.L 463.50.1.R 463.62.1.R 464.52.2.R 464.59.2.L 464.64.2.R 466.47.2.L 466.54.1.R 466.66.1.R 467.52.2.R 467.64.2.R 468.59.2.L 469.50.8.R 469.62.8.R 470.47.2.L 472.59.2.L 474.47.2.L 476.59.2.L 478.43.2.L 480.45.2.L 482.45.2.L 484.43.2.L 486.47.6.L 492.47.2.L 494.50.2.R 494.59.2.L 494.62.2.R 496.47.2.L 496.52.2.R 496.64.2.R 498.55.2.R 498.59.2.L 498.67.2.R 500.47.2.L 500.57.2.R 500.69.2.R 502.59.2.L 502.59.2.R 502.71.2.R 504.47.2.L 504.57.2.R 504.69.2.R 506.55.2.R 506.59.2.L 506.67.2.R 508.52.2.R 508.64.2.R 510.55.2.R 510.67.2.R 512.57.2.R 512.69.2.R 514.57.2.R 514.69.2.R 516.55.2.R 516.67.2.R 518.55.6.R 518.67.6.R 524.52.2.R 524.64.2.R 526.55.2.R 526.67.2.R 528.57.2.R 528.69.2.R 530.57.2.R 530.69.2.R 532.55.2.R 532.67.2.R 534.55.6.R 534.67.6.R 540.55.2.R 540.67.2.R 542.54.2.R 542.66.2.R 544.52.6.R 544.64.6.R 550.50.6.R 550.62.6.R 556.55.2.R 556.67.2.R 558.54.2.R 558.66.2.R 560.52.3.R 560.64.3.R 563.54.1.R 563.66.1.R 564.52.2.R 564.64.2.R 566.50.6.R 566.62.6.R 568.47.2.L 570.59.2.L 572.47.2.L 572.50.1.R 572.62.1.R 573.52.1.R 573.64.1.R 574.55.1.R 574.59.2.L 574.67.1.R 575.57.2.R 575.69.2.R 576.47.2.L 577.59.2.R 577.71.2.R 578.59.2.L 579.57.1.R 579.69.1.R 580.47.2.L 580.59.3.R 580.71.3.R 582.59.2.L 583.57.1.R 583.69.1.R 584.59.3.R 584.71.3.R 587.57.1.R 587.69.1.R 588.59.1.R 588.71.1.R 589.62.1.R 589.74.1.R 590.59.1.R 590.71.1.R 591.57.1.R 591.69.1.R 592.55.3.R 592.67.3.R 595.52.1.R 595.64.1.R 596.55.2.R 596.67.2.R 598.57.1.R 598.69.1.R 599.55.8.R 599.67.8.R 621.52.1.R 621.64.1.R 622.52.1.R 622.64.1.R 623.55.2.R 623.67.2.R 625.52.1.R 626.52.1.R 627.52.1.R 628.52.1.R 629.52.1.R 630.52.1.R 631.55.2.R 633.52.1.R 634.52.1.R 635.52.1.R 636.52.1.R 637.52.1.R 638.52.1.R 639.55.1.R 640.55.1.R 641.52.1.R 642.52.1.R 643.52.1.R 644.52.1.R 645.52.1.R 646.52.1.R 647.55.1.R 648.52.1.R 649.52.1.R 650.52.1.R 651.52.1.R 652.52.1.R 653.52.1.R 654.52.1.R 655.55.1.R 656.52.1.R 657.52.1.R 658.52.1.R 659.52.1.R 660.55.1.R 661.52.1.R 662.52.1.R 663.55.1.R 664.52.1.R 665.52.1.R 666.52.1.R 667.52.1.R 668.52.8.R 685.52.1.R 686.52.1.R 687.55.1.R 688.52.1.R 689.52.1.R 690.52.2.R 692.52.1.R 693.52.1.R 694.52.1.R 695.55.1.R 696.52.1.R 697.52.1.R 698.52.1.R 699.52.1.R 700.52.2.R 702.52.1.R 703.55.1.R 704.52.1.R 705.52.1.R 706.52.1.R 707.52.1.R 708.52.1.R 709.52.1.R 710.52.1.R 711.55.2.R 713.52.1.R 714.52.1.R 715.52.1.R 716.52.1.R 717.52.1.R 718.52.1.R 719.55.2.R 721.52.1.R 722.52.1.R 723.52.1.R 724.52.1.R 725.52.1.R 726.52.1.R 727.55.1.R 728.52.1.R 729.52.1.R 730.52.1.R 731.52.1.R 732.52.8.R 748.55.1.R 749.55.1.R 750.55.1.R 751.59.2.R 753.55.1.R 754.55.1.R 755.55.1.R 756.55.1.R 757.55.1.R 758.55.1.R 759.59.1.R 760.55.1.R 761.55.1.R 762.55.1.R 763.55.1.R 764.52.3.R 767.59.1.R 768.55.1.R 769.55.1.R 770.55.1.R 771.55.1.R 772.55.1.R 773.55.1.R 774.55.1.R 775.55.1.R 776.55.1.R 777.55.1.R 778.55.1.R 779.55.1.R 780.52.3.R 783.52.1.R 784.59.1.R 785.55.1.R 786.55.1.R 787.55.1.R 788.55.1.R 789.55.1.R 790.55.1.R 791.55.1.R 792.55.6.R 794.43.2.L 796.47.2.L 798.50.2.R 798.59.2.L 800.47.2.L 800.52.6.R 802.59.2.L 804.47.2.L 806.50.8.R 806.59.2.L 808.47.2.L 810.59.2.L 812.43.2.L 814.45.4.L 818.47.2.L 820.59.2.L 822.47.2.L 824.59.2.L 826.43.2.L 828.55.2.L 830.43.2.L 832.55.2.L 834.43.2.L 834.52.2.R 836.52.2.R 836.55.2.L 838.43.2.L 838.52.1.R 839.52.3.R 840.55.2.L 842.50.2.R 844.50.3.R 846.47.2.L 847.50.3.R 848.59.2.L 850.47.2.L 850.52.8.R 852.59.2.L 854.47.2.L 856.59.2.L 858.47.2.L 860.59.2.L 861.45.1.L 862.45.1.L 863.47.2.L 864.48.2.R 865.59.2.L 866.57.2.R 867.47.2.L 868.55.3.R 869.59.2.L 871.47.2.L 871.52.8.R 873.59.2.L 875.47.2.L 877.59.2.L 880.59.2.R 882.57.2.R 884.57.2.R 886.59.1.R 887.57.1.R 888.55.4.R 892.54.2.R 894.55.1.R 895.54.1.R 896.52.6.R 902.54.8.R 910.55.1.R 911.57.1.R 912.55.8.R 922.43.2.L 924.47.2.L 926.50.2.R 926.59.2.L 928.47.2.L 928.52.6.R 930.59.2.L 932.47.2.L 934.50.8.R 934.59.2.L 936.47.2.L 938.59.2.L 942.43.2.L 944.45.2.L 946.45.2.L 948.43.2.L 950.47.6.L 956.47.2.L 958.50.2.R 958.59.2.L 960.47.2.L 960.52.2.R 962.54.2.R 962.59.2.L 964.47.2.L 964.52.2.R 966.50.8.R 966.59.2.L 968.47.2.L 970.45.2.L 972.45.2.L 974.43.2.L 976.45.2.L 978.45.2.L 980.47.2.L 982.43.7.L 989.45.1.L 990.47.2.L 991.50.1.R 992.52.2.R 992.59.2.L 994.47.2.L 994.54.1.R 995.52.2.R 996.59.2.L 997.50.8.R 998.47.2.L 1000.59.2.L 1002.47.2.L 1004.59.2.L 1006.43.2.L 1008.45.2.L 1010.45.2.L 1012.43.2.L 1014.47.6.L 1020.47.2.L 1022.50.2.R 1022.59.2.L 1024.47.2.L 1024.52.2.R 1026.55.2.R 1026.59.2.L 1028.47.2.L 1028.57.2.R 1030.59.2.L 1030.59.2.R 1032.47.2.L 1032.57.2.R 1034.55.2.R 1034.59.2.L 1036.52.2.R 1038.55.2.R 1040.57.2.R 1042.57.2.R 1044.55.2.R 1046.55.6.R 1052.52.2.R 1054.55.2.R 1056.57.2.R 1058.57.2.R 1060.55.2.R 1062.59.6.R 1068.55.2.R 1070.54.2.R 1072.52.6.R 1078.50.6.R 1084.55.2.R 1086.54.2.R 1088.52.3.R 1091.54.1.R 1092.52.2.R 1094.50.6.R 1096.47.2.L 1098.59.2.L 1100.47.2.L 1100.50.1.R 1101.52.1.R 1102.55.1.R 1102.59.2.L 1103.57.2.R 1104.47.2.L 1105.59.2.R 1106.59.2.L 1107.57.1.R 1108.47.2.L 1108.59.3.R 1110.59.2.L 1111.57.1.R 1112.59.3.R 1115.57.1.R 1116.59.1.R 1117.62.1.R 1118.59.1.R 1119.55.1.R 1120.55.3.R 1123.52.1.R 1124.55.2.R 1126.57.1.R 1127.55.5.R 1132.55.2.R 1134.54.2.R 1136.52.6.R 1142.50.6.R 1148.55.2.R 1150.54.2.R 1152.52.3.R 1155.54.1.R 1156.52.2.R 1158.50.6.R 1160.47.2.L 1162.59.2.L 1164.47.2.L 1164.50.1.R 1165.52.1.R 1166.55.1.R 1166.59.2.L 1167.57.2.R 1168.47.2.L 1169.59.2.R 1170.59.2.L 1171.57.1.R 1172.47.2.L 1172.59.3.R 1174.59.2.L 1175.57.1.R 1176.59.2.R 1178.57.2.R 1180.52.2.R 1182.55.2.R 1184.57.2.R 1186.57.2.R 1188.55.2.R 1190.55.8.R';
const BELLA_SECTIONS = [
  { name: 'Verse 1', startBeat: 0, endBeat: 32 },
  { name: 'Verse 2', startBeat: 32, endBeat: 64 },
  { name: 'Verse 3', startBeat: 64, endBeat: 96 },
  { name: 'Verse 4', startBeat: 96, endBeat: 128 },
  { name: 'Verse 5', startBeat: 128, endBeat: 160 },
  { name: 'Verse 6', startBeat: 160, endBeat: 192 },
  { name: 'Finale', startBeat: 192, endBeat: 232 },
];
const SYU_SECTIONS = [
  { name: 'Intro riff', startBeat: 0, endBeat: 16 },
  { name: 'Chorus', startBeat: 16, endBeat: 52 },
  { name: 'Rap verse', startBeat: 52, endBeat: 104 },
  { name: 'Chorus 2', startBeat: 104, endBeat: 156 },
  { name: 'Verse + lift', startBeat: 156, endBeat: 204 },
  { name: 'Outro', startBeat: 204, endBeat: 300 },
];
SONGS.push(
  {
    id: 'bella-ciao-easy', group: 'bella-ciao', level: 'Easy',
    title: 'Bella Ciao', composer: 'Italian traditional',
    bpm: 100, timeSig: [4, 4], beatUnit: 4,
    sections: [{ name: 'Verse', startBeat: 0, endBeat: 33 }],
    notes: fromStream(BELLA_EASY, 4),
  },
  {
    id: 'bella-ciao', group: 'bella-ciao', level: 'Medium',
    title: 'Bella Ciao', composer: 'Italian traditional',
    bpm: 118, timeSig: [4, 4], beatUnit: 4,
    sections: BELLA_SECTIONS,
    notes: fromStream(BELLA_MED, 4),
  },
  {
    id: 'bella-ciao-hard', group: 'bella-ciao', level: 'Hard',
    title: 'Bella Ciao', composer: 'Italian traditional',
    bpm: 118, timeSig: [4, 4], beatUnit: 4,
    sections: BELLA_SECTIONS,
    notes: fromStream(BELLA_HARD, 4),
  },
  {
    id: 'see-you-again-easy', group: 'see-you-again', level: 'Easy',
    title: 'See You Again', composer: 'Wiz Khalifa ft. Charlie Puth (arr. in G)',
    bpm: 80, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Riff', startBeat: 0, endBeat: 16 },
      { name: 'Chorus', startBeat: 16, endBeat: 32 },
    ],
    notes: fromStream(SYU_EASY, 4),
  },
  {
    id: 'see-you-again', group: 'see-you-again', level: 'Medium',
    title: 'See You Again', composer: 'Wiz Khalifa ft. Charlie Puth (arr. in G)',
    bpm: 80, timeSig: [4, 4], beatUnit: 4,
    sections: SYU_SECTIONS,
    notes: fromStream(SYU_MED, 4),
  },
  {
    id: 'see-you-again-hard', group: 'see-you-again', level: 'Hard',
    title: 'See You Again', composer: 'Wiz Khalifa ft. Charlie Puth (arr. in G)',
    bpm: 80, timeSig: [4, 4], beatUnit: 4,
    sections: SYU_SECTIONS,
    notes: fromStream(SYU_HARD, 4),
  },
);


// ---- 2026-08-28 wave 2: Interstellar / In the End / What I've Done ----
// Sources (zero guessed notes):
// Interstellar Main Theme: PLN 2019-06 grid (C/Am as published, 3-char unit;
//   12-unit harmonic period = 3/4 waltz) × PLN 2017-10 "Day One" (different
//   arranger, same E-pedal tick + stepwise A-B-C5 theme). All white keys.
// In the End: PLN 2017-10 grid (Ebm original) × Hooktheory API song 365 (D#m,
//   105bpm; intro riff degrees 1-5-5-3-2-2-2-2-3 match the grid note for
//   note; loop i-VII-VI-VII, chorus i-III-VII-VI). Authored +1 in E minor.
// What I've Done: PLN 2018-05 grid (Gm) × Hooktheory API song 3298 (G minor
//   IS the original key, 120bpm; intro ostinato 1-5-1-5-6-5-1-5 matches the
//   grid exactly; loop i-III-VII-iv). Authored +2 in A minor.
// Easy-tier LH roots follow the Hooktheory progressions and say so.
const INT_EASY = '75.41.12.L 87.43.12.L 100.45.12.L 112.43.12.L 124.29.1.L 125.41.12.L 137.31.12.L 137.43.12.L 149.33.1.L 150.45.12.L 162.31.12.L 162.43.12.L 0.64.1.R 1.60.1.R 2.64.1.R 3.60.1.R 4.64.1.R 5.60.1.R 6.64.1.R 7.60.1.R 8.64.1.R 9.60.1.R 10.64.1.R 11.60.1.R 12.64.1.R 13.60.1.R 14.64.1.R 15.60.1.R 16.64.1.R 17.60.2.R 19.64.1.R 20.60.1.R 21.64.1.R 22.60.1.R 23.64.1.R 24.60.1.R 25.64.1.R 26.60.1.R 27.64.1.R 28.60.1.R 29.57.1.R 29.64.1.R 29.69.1.R 30.60.1.R 31.64.1.R 32.60.1.R 33.64.1.R 34.60.1.R 35.64.1.R 36.60.1.R 37.59.1.R 37.64.1.R 37.71.1.R 38.62.1.R 39.64.1.R 40.62.1.R 41.64.1.R 42.62.1.R 43.64.1.R 44.62.2.R 46.64.1.R 47.62.1.R 48.64.1.R 49.62.1.R 50.57.1.R 50.64.1.R 50.69.1.R 51.60.1.R 52.59.1.R 52.64.1.R 52.71.1.R 53.62.1.R 54.60.1.R 54.64.1.R 54.72.1.R 55.62.1.R 56.59.1.R 56.64.1.R 56.71.1.R 57.62.1.R 58.57.1.R 58.64.1.R 58.69.1.R 59.62.1.R 60.59.1.R 60.64.1.R 60.71.1.R 61.62.1.R 62.60.1.R 62.64.1.R 62.72.1.R 63.62.1.R 64.64.1.R 65.62.1.R 66.64.1.R 67.62.1.R 68.59.1.R 68.64.1.R 68.71.1.R 69.62.1.R 70.64.1.R 71.62.2.R 73.64.1.R 74.62.1.R 75.53.1.R 75.57.1.R 75.60.1.R 76.64.1.R 77.76.3.R 81.57.1.R 81.60.1.R 82.64.1.R 83.76.3.R 87.55.1.R 87.59.1.R 87.62.1.R 88.64.1.R 89.76.3.R 93.59.1.R 94.62.1.R 95.64.3.R 95.76.3.R 100.57.1.R 100.60.1.R 101.62.1.R 102.64.3.R 102.76.3.R 106.60.1.R 107.62.1.R 108.64.3.R 108.76.3.R 112.55.1.R 112.59.1.R 112.62.1.R 113.64.1.R 114.76.3.R 118.59.1.R 119.62.1.R 120.64.3.R 120.76.3.R 124.57.1.R 125.57.1.R 125.60.1.R 126.69.1.R 127.64.1.R 127.76.1.R 128.57.1.R 129.60.1.R 130.57.1.R 131.57.1.R 131.60.1.R 131.69.1.R 132.57.1.R 133.64.1.R 133.76.1.R 134.57.1.R 135.60.1.R 136.57.1.R 137.59.1.R 137.62.1.R 138.59.1.R 138.71.1.R 139.64.1.R 139.76.1.R 140.59.1.R 141.62.1.R 142.59.1.R 143.59.1.R 143.62.1.R 143.71.1.R 144.59.1.R 145.64.1.R 145.76.1.R 146.59.1.R 147.62.1.R 148.59.1.R 149.60.1.R 150.60.1.R 150.64.1.R 150.72.1.R 151.64.1.R 151.76.1.R 152.60.2.R 154.64.1.R 155.60.1.R 156.60.1.R 156.64.1.R 156.72.1.R 157.60.1.R 158.64.1.R 158.76.1.R 159.60.1.R 160.64.1.R 161.60.1.R 162.62.1.R 163.62.1.R 163.64.1.R 163.74.1.R 164.64.1.R 164.76.1.R 165.62.1.R 166.64.1.R 167.62.1.R';
const INT_MED = '75.41.12.L 87.43.12.L 100.45.12.L 112.43.12.L 124.29.1.L 125.41.12.L 137.31.12.L 137.43.12.L 149.33.1.L 150.45.12.L 162.31.12.L 162.43.12.L 174.29.1.L 174.36.1.L 175.41.1.L 176.45.9.L 185.45.1.L 186.41.1.L 187.31.1.L 187.38.1.L 188.43.1.L 189.47.8.L 197.47.1.L 198.43.1.L 199.33.1.L 199.40.1.L 200.45.11.L 211.45.1.L 212.31.1.L 212.38.1.L 213.43.1.L 214.47.8.L 222.47.1.L 223.43.1.L 224.41.12.L 237.43.12.L 249.45.12.L 262.43.12.L 274.41.6.L 280.41.6.L 286.43.7.L 293.43.6.L 299.45.6.L 305.45.6.L 311.43.7.L 318.43.5.L 323.47.1.L 324.29.1.L 324.41.1.L 325.36.1.L 326.41.1.L 327.45.8.L 335.45.1.L 336.31.1.L 336.43.1.L 337.38.1.L 338.43.1.L 339.47.9.L 348.47.1.L 349.33.1.L 349.45.1.L 350.40.1.L 351.45.10.L 361.31.1.L 361.43.1.L 362.38.1.L 363.43.1.L 364.47.8.L 372.43.1.L 372.47.1.L 373.35.1.L 373.38.1.L 374.29.2.L 374.36.2.L 376.41.7.L 376.45.7.L 383.45.1.L 384.29.2.L 384.41.2.L 386.31.2.L 386.38.2.L 388.43.1.L 389.47.7.L 396.47.1.L 397.31.2.L 397.43.2.L 399.33.2.L 399.40.2.L 401.45.8.L 409.33.2.L 409.45.2.L 411.31.2.L 411.38.2.L 413.43.1.L 414.47.7.L 421.31.3.L 421.43.3.L 421.47.3.L 424.41.12.L 436.43.12.L 448.45.12.L 461.31.12.L 461.43.12.L 473.29.7.L 473.41.7.L 480.29.6.L 480.41.6.L 486.31.6.L 486.43.6.L 492.31.12.L 492.43.12.L 505.33.6.L 505.45.6.L 511.33.12.L 0.64.1.R 1.60.1.R 2.64.1.R 3.60.1.R 4.64.1.R 5.60.1.R 6.64.1.R 7.60.1.R 8.64.1.R 9.60.1.R 10.64.1.R 11.60.1.R 12.64.1.R 13.60.1.R 14.64.1.R 15.60.1.R 16.64.1.R 17.60.2.R 19.64.1.R 20.60.1.R 21.64.1.R 22.60.1.R 23.64.1.R 24.60.1.R 25.64.1.R 26.60.1.R 27.64.1.R 28.60.1.R 29.57.1.R 29.64.1.R 29.69.1.R 30.60.1.R 31.64.1.R 32.60.1.R 33.64.1.R 34.60.1.R 35.64.1.R 36.60.1.R 37.59.1.R 37.64.1.R 37.71.1.R 38.62.1.R 39.64.1.R 40.62.1.R 41.64.1.R 42.62.1.R 43.64.1.R 44.62.2.R 46.64.1.R 47.62.1.R 48.64.1.R 49.62.1.R 50.57.1.R 50.64.1.R 50.69.1.R 51.60.1.R 52.59.1.R 52.64.1.R 52.71.1.R 53.62.1.R 54.60.1.R 54.64.1.R 54.72.1.R 55.62.1.R 56.59.1.R 56.64.1.R 56.71.1.R 57.62.1.R 58.57.1.R 58.64.1.R 58.69.1.R 59.62.1.R 60.59.1.R 60.64.1.R 60.71.1.R 61.62.1.R 62.60.1.R 62.64.1.R 62.72.1.R 63.62.1.R 64.64.1.R 65.62.1.R 66.64.1.R 67.62.1.R 68.59.1.R 68.64.1.R 68.71.1.R 69.62.1.R 70.64.1.R 71.62.2.R 73.64.1.R 74.62.1.R 75.53.1.R 75.57.1.R 75.60.1.R 76.64.1.R 77.76.3.R 81.57.1.R 81.60.1.R 82.64.1.R 83.76.3.R 87.55.1.R 87.59.1.R 87.62.1.R 88.64.1.R 89.76.3.R 93.59.1.R 94.62.1.R 95.64.3.R 95.76.3.R 100.57.1.R 100.60.1.R 101.62.1.R 102.64.3.R 102.76.3.R 106.60.1.R 107.62.1.R 108.64.3.R 108.76.3.R 112.55.1.R 112.59.1.R 112.62.1.R 113.64.1.R 114.76.3.R 118.59.1.R 119.62.1.R 120.64.3.R 120.76.3.R 124.57.1.R 125.57.1.R 125.60.1.R 126.69.1.R 127.64.1.R 127.76.1.R 128.57.1.R 129.60.1.R 130.57.1.R 131.57.1.R 131.60.1.R 131.69.1.R 132.57.1.R 133.64.1.R 133.76.1.R 134.57.1.R 135.60.1.R 136.57.1.R 137.59.1.R 137.62.1.R 138.59.1.R 138.71.1.R 139.64.1.R 139.76.1.R 140.59.1.R 141.62.1.R 142.59.1.R 143.59.1.R 143.62.1.R 143.71.1.R 144.59.1.R 145.64.1.R 145.76.1.R 146.59.1.R 147.62.1.R 148.59.1.R 149.60.1.R 150.60.1.R 150.64.1.R 150.72.1.R 151.64.1.R 151.76.1.R 152.60.2.R 154.64.1.R 155.60.1.R 156.60.1.R 156.64.1.R 156.72.1.R 157.60.1.R 158.64.1.R 158.76.1.R 159.60.1.R 160.64.1.R 161.60.1.R 162.62.1.R 163.62.1.R 163.64.1.R 163.74.1.R 164.64.1.R 164.76.1.R 165.62.1.R 166.64.1.R 167.62.1.R 168.62.1.R 168.64.1.R 168.74.1.R 169.62.1.R 170.64.1.R 170.76.1.R 171.62.1.R 172.64.1.R 173.62.1.R 174.57.1.R 175.60.1.R 175.69.1.R 176.57.1.R 176.65.1.R 177.48.1.R 177.60.1.R 178.53.1.R 178.57.1.R 179.57.2.R 179.60.2.R 181.60.1.R 181.64.1.R 181.76.1.R 182.57.1.R 182.60.1.R 183.53.1.R 183.57.1.R 184.48.1.R 184.60.1.R 185.57.1.R 186.60.1.R 187.59.1.R 187.62.1.R 187.71.1.R 188.67.1.R 189.59.1.R 189.62.1.R 190.50.1.R 190.62.1.R 191.55.1.R 191.59.1.R 192.59.1.R 192.62.1.R 193.62.1.R 193.64.1.R 193.76.1.R 194.59.1.R 194.62.1.R 195.55.1.R 195.59.1.R 196.50.1.R 196.62.1.R 197.59.1.R 198.62.1.R 199.60.1.R 200.64.1.R 200.72.1.R 201.48.1.R 201.60.1.R 201.69.1.R 202.52.1.R 202.64.1.R 203.57.1.R 203.60.1.R 204.60.1.R 204.64.1.R 205.64.1.R 205.76.1.R 206.60.2.R 206.64.2.R 208.57.1.R 208.60.1.R 209.52.1.R 209.64.1.R 210.48.1.R 210.60.1.R 211.64.1.R 212.59.1.R 212.62.1.R 212.71.1.R 213.67.1.R 214.59.1.R 214.62.1.R 215.50.1.R 215.62.1.R 216.55.1.R 216.59.1.R 217.59.1.R 217.62.1.R 218.62.1.R 218.64.1.R 218.76.1.R 219.59.1.R 219.62.1.R 220.55.1.R 220.59.1.R 221.50.1.R 221.62.1.R 222.59.1.R 223.62.1.R 224.53.1.R 224.57.1.R 224.60.1.R 225.64.1.R 226.76.3.R 230.57.1.R 231.60.1.R 232.64.3.R 232.76.3.R 237.55.1.R 237.59.1.R 237.62.1.R 238.64.1.R 239.76.3.R 243.59.1.R 243.62.1.R 244.64.1.R 245.76.3.R 249.57.1.R 249.60.1.R 250.62.1.R 251.64.3.R 251.76.3.R 255.60.1.R 256.62.1.R 257.64.3.R 257.76.3.R 262.55.1.R 262.59.1.R 262.62.1.R 263.64.1.R 264.76.3.R 268.59.1.R 268.62.1.R 269.64.1.R 270.76.3.R 274.48.1.R 274.55.1.R 275.57.1.R 276.57.1.R 276.76.1.R 277.57.1.R 278.57.1.R 279.57.1.R 280.48.1.R 280.57.1.R 281.57.1.R 282.57.1.R 282.76.1.R 283.57.1.R 284.57.1.R 285.57.1.R 286.50.1.R 286.57.1.R 287.59.2.R 289.59.1.R 289.76.1.R 290.59.1.R 291.59.1.R 292.59.1.R 293.50.1.R 293.59.1.R 294.59.1.R 295.59.1.R 295.76.1.R 296.59.1.R 297.59.1.R 298.59.1.R 299.52.1.R 299.59.1.R 299.60.1.R 300.60.1.R 301.60.1.R 301.76.1.R 302.60.1.R 303.60.1.R 304.60.1.R 305.52.1.R 305.60.1.R 306.60.1.R 307.60.1.R 307.76.1.R 308.60.1.R 309.60.1.R 310.60.1.R 311.50.1.R 311.60.1.R 312.62.1.R 313.62.1.R 313.76.1.R 314.62.2.R 316.62.1.R 317.62.1.R 318.50.1.R 318.62.1.R 319.62.1.R 320.62.1.R 320.76.1.R 321.62.1.R 322.55.1.R 322.59.1.R 322.62.1.R 323.50.1.R 323.62.1.R 324.57.1.R 324.60.1.R 325.57.1.R 325.64.1.R 325.69.1.R 326.64.1.R 326.76.1.R 327.57.1.R 328.48.1.R 328.57.1.R 329.53.1.R 329.57.1.R 330.57.1.R 330.60.1.R 330.64.1.R 330.69.1.R 331.57.1.R 331.60.1.R 332.57.1.R 332.64.1.R 332.76.1.R 333.53.1.R 333.57.1.R 334.48.1.R 334.57.1.R 335.57.1.R 336.59.1.R 337.59.1.R 337.62.1.R 338.64.1.R 338.71.1.R 338.76.1.R 339.59.1.R 340.50.1.R 340.59.1.R 341.55.2.R 341.59.2.R 343.59.1.R 343.62.1.R 343.71.1.R 344.59.1.R 344.62.1.R 345.59.1.R 345.64.1.R 345.76.1.R 346.55.1.R 346.59.1.R 347.50.1.R 347.59.1.R 348.59.1.R 349.60.1.R 349.72.1.R 350.64.1.R 351.64.1.R 351.69.1.R 351.76.1.R 352.48.1.R 352.60.1.R 353.52.1.R 353.60.1.R 354.57.1.R 354.60.1.R 355.60.1.R 355.64.1.R 355.69.1.R 355.72.1.R 356.60.1.R 356.64.1.R 357.60.1.R 357.64.1.R 357.76.1.R 358.57.1.R 358.60.1.R 359.52.1.R 359.60.1.R 360.48.1.R 360.60.1.R 361.62.1.R 361.74.1.R 362.62.1.R 363.64.1.R 363.76.1.R 364.62.1.R 365.50.1.R 365.62.1.R 366.55.1.R 366.62.1.R 367.59.1.R 367.62.1.R 367.74.1.R 368.62.2.R 370.59.1.R 370.64.1.R 370.76.1.R 371.55.1.R 371.62.1.R 372.71.1.R 372.74.1.R 373.79.1.R 373.83.1.R 374.81.1.R 374.84.1.R 374.93.1.R 375.88.1.R 376.88.1.R 376.100.1.R 377.48.1.R 378.53.1.R 378.81.1.R 378.93.1.R 379.81.1.R 379.93.1.R 380.60.2.R 380.81.2.R 380.84.2.R 380.88.2.R 380.93.2.R 382.53.1.R 382.88.1.R 382.100.1.R 383.48.1.R 384.93.1.R 385.88.1.R 386.81.1.R 386.84.1.R 386.86.1.R 387.83.1.R 387.95.1.R 388.88.2.R 388.100.2.R 390.50.1.R 390.55.1.R 390.83.1.R 390.95.1.R 391.83.1.R 391.95.1.R 392.62.2.R 392.83.2.R 392.86.2.R 392.95.2.R 394.55.1.R 394.88.1.R 394.100.1.R 395.50.2.R 397.91.1.R 397.95.1.R 398.83.1.R 398.86.1.R 399.84.1.R 399.96.1.R 400.88.1.R 401.48.1.R 401.88.1.R 401.100.1.R 402.52.1.R 403.57.1.R 403.84.1.R 403.96.1.R 404.84.1.R 404.96.1.R 405.64.2.R 405.84.2.R 405.88.2.R 405.96.2.R 407.57.1.R 407.88.1.R 407.100.1.R 408.48.1.R 408.52.1.R 409.96.1.R 410.93.1.R 411.84.1.R 411.88.1.R 412.86.1.R 412.98.1.R 413.88.2.R 413.100.2.R 415.50.1.R 415.55.1.R 415.86.1.R 415.98.1.R 416.86.1.R 416.98.1.R 417.62.2.R 417.86.2.R 417.88.2.R 417.98.2.R 419.55.1.R 419.88.1.R 419.100.1.R 420.50.1.R 421.93.1.R 422.86.1.R 423.81.1.R 423.84.1.R 424.48.1.R 424.53.1.R 424.69.1.R 425.69.1.R 426.76.1.R 427.69.1.R 428.69.1.R 429.69.1.R 430.76.1.R 431.69.1.R 432.69.1.R 433.69.1.R 434.76.1.R 435.69.1.R 436.50.1.R 436.55.1.R 436.71.1.R 437.71.1.R 438.76.1.R 439.71.1.R 440.71.1.R 441.71.1.R 442.76.1.R 443.71.1.R 444.71.1.R 445.71.1.R 446.76.1.R 447.71.1.R 448.52.1.R 448.57.1.R 448.72.1.R 449.72.2.R 451.76.1.R 452.72.1.R 453.72.1.R 454.72.1.R 455.76.1.R 456.72.1.R 457.72.1.R 458.72.1.R 459.76.1.R 460.72.1.R 461.74.1.R 462.74.1.R 463.76.1.R 464.74.1.R 465.74.1.R 466.74.1.R 467.76.1.R 468.74.1.R 469.74.1.R 470.74.1.R 471.69.1.R 471.76.1.R 472.74.1.R 473.57.1.R 473.71.1.R 473.72.1.R 474.48.1.R 474.57.1.R 475.53.3.R 475.60.3.R 475.64.3.R 478.48.2.R 478.57.2.R 480.57.1.R 481.48.1.R 481.57.1.R 482.53.2.R 482.60.2.R 482.64.2.R 484.48.2.R 484.57.2.R 486.59.1.R 487.50.1.R 487.59.1.R 488.55.2.R 488.62.2.R 488.64.2.R 490.50.2.R 490.59.2.R 492.59.1.R 493.50.1.R 493.59.1.R 494.55.3.R 494.59.3.R 494.64.3.R 498.62.2.R 500.60.2.R 502.59.3.R 505.52.1.R 506.57.1.R 507.59.3.R 511.52.1.R 512.57.3.R';
const INT_HARD = '75.29.12.L 75.41.12.L 87.31.12.L 87.43.12.L 100.33.12.L 100.45.12.L 112.31.12.L 112.43.12.L 124.29.1.L 125.29.12.L 125.41.12.L 137.31.12.L 137.43.12.L 149.33.1.L 150.33.12.L 150.45.12.L 162.31.12.L 162.43.12.L 174.24.1.L 174.29.1.L 174.36.1.L 175.29.1.L 175.41.1.L 176.33.9.L 176.45.9.L 185.33.1.L 185.45.1.L 186.29.1.L 186.41.1.L 187.26.1.L 187.31.1.L 187.38.1.L 188.31.1.L 188.43.1.L 189.35.8.L 189.47.8.L 197.35.1.L 197.47.1.L 198.31.1.L 198.43.1.L 199.28.1.L 199.33.1.L 199.40.1.L 200.33.11.L 200.45.11.L 211.33.1.L 211.45.1.L 212.26.1.L 212.31.1.L 212.38.1.L 213.31.1.L 213.43.1.L 214.35.8.L 214.47.8.L 222.35.1.L 222.47.1.L 223.31.1.L 223.43.1.L 224.29.12.L 224.41.12.L 237.31.12.L 237.43.12.L 249.33.12.L 249.45.12.L 262.31.12.L 262.43.12.L 274.29.6.L 274.41.6.L 280.29.6.L 280.41.6.L 286.31.7.L 286.43.7.L 293.31.6.L 293.43.6.L 299.33.6.L 299.45.6.L 305.33.6.L 305.45.6.L 311.31.7.L 311.43.7.L 318.31.5.L 318.43.5.L 323.35.1.L 323.47.1.L 324.29.1.L 324.41.1.L 325.24.1.L 325.36.1.L 326.29.1.L 326.41.1.L 327.33.8.L 327.45.8.L 335.33.1.L 335.45.1.L 336.31.1.L 336.43.1.L 337.26.1.L 337.38.1.L 338.31.1.L 338.43.1.L 339.35.9.L 339.47.9.L 348.35.1.L 348.47.1.L 349.33.1.L 349.45.1.L 350.28.1.L 350.40.1.L 351.33.10.L 351.45.10.L 361.31.1.L 361.43.1.L 362.26.1.L 362.38.1.L 363.31.1.L 363.43.1.L 364.35.8.L 364.47.8.L 372.31.1.L 372.35.1.L 372.43.1.L 372.47.1.L 373.26.1.L 373.35.1.L 373.38.1.L 374.24.2.L 374.29.2.L 374.36.2.L 376.29.7.L 376.33.7.L 376.41.7.L 376.45.7.L 383.33.1.L 383.45.1.L 384.29.2.L 384.41.2.L 386.26.2.L 386.31.2.L 386.38.2.L 388.31.1.L 388.43.1.L 389.35.7.L 389.47.7.L 396.35.1.L 396.47.1.L 397.31.2.L 397.43.2.L 399.28.2.L 399.33.2.L 399.40.2.L 401.33.8.L 401.45.8.L 409.33.2.L 409.45.2.L 411.26.2.L 411.31.2.L 411.38.2.L 413.31.1.L 413.43.1.L 414.35.7.L 414.47.7.L 421.31.3.L 421.35.3.L 421.43.3.L 421.47.3.L 424.29.12.L 424.41.12.L 436.31.12.L 436.43.12.L 448.33.12.L 448.45.12.L 461.31.12.L 461.43.12.L 473.29.7.L 473.41.7.L 480.29.6.L 480.41.6.L 486.31.6.L 486.43.6.L 492.31.12.L 492.43.12.L 505.33.6.L 505.45.6.L 511.33.12.L 0.64.1.R 1.60.1.R 2.64.1.R 3.60.1.R 4.64.1.R 5.60.1.R 6.64.1.R 7.60.1.R 8.64.1.R 9.60.1.R 10.64.1.R 11.60.1.R 12.64.1.R 13.60.1.R 14.64.1.R 15.60.1.R 16.64.1.R 17.60.2.R 19.64.1.R 20.60.1.R 21.64.1.R 22.60.1.R 23.64.1.R 24.60.1.R 25.64.1.R 26.60.1.R 27.64.1.R 28.60.1.R 29.57.1.R 29.64.1.R 29.69.1.R 30.60.1.R 31.64.1.R 32.60.1.R 33.64.1.R 34.60.1.R 35.64.1.R 36.60.1.R 37.59.1.R 37.64.1.R 37.71.1.R 38.62.1.R 39.64.1.R 40.62.1.R 41.64.1.R 42.62.1.R 43.64.1.R 44.62.2.R 46.64.1.R 47.62.1.R 48.64.1.R 49.62.1.R 50.57.1.R 50.64.1.R 50.69.1.R 51.60.1.R 52.59.1.R 52.64.1.R 52.71.1.R 53.62.1.R 54.60.1.R 54.64.1.R 54.72.1.R 55.62.1.R 56.59.1.R 56.64.1.R 56.71.1.R 57.62.1.R 58.57.1.R 58.64.1.R 58.69.1.R 59.62.1.R 60.59.1.R 60.64.1.R 60.71.1.R 61.62.1.R 62.60.1.R 62.64.1.R 62.72.1.R 63.62.1.R 64.64.1.R 65.62.1.R 66.64.1.R 67.62.1.R 68.59.1.R 68.64.1.R 68.71.1.R 69.62.1.R 70.64.1.R 71.62.2.R 73.64.1.R 74.62.1.R 75.53.1.R 75.57.1.R 75.60.1.R 76.64.1.R 77.76.3.R 81.57.1.R 81.60.1.R 82.64.1.R 83.76.3.R 87.55.1.R 87.59.1.R 87.62.1.R 88.64.1.R 89.76.3.R 93.59.1.R 94.62.1.R 95.64.3.R 95.76.3.R 100.57.1.R 100.60.1.R 101.62.1.R 102.64.3.R 102.76.3.R 106.60.1.R 107.62.1.R 108.64.3.R 108.76.3.R 112.55.1.R 112.59.1.R 112.62.1.R 113.64.1.R 114.76.3.R 118.59.1.R 119.62.1.R 120.64.3.R 120.76.3.R 124.57.1.R 125.57.1.R 125.60.1.R 126.69.1.R 127.64.1.R 127.76.1.R 128.57.1.R 129.60.1.R 130.57.1.R 131.57.1.R 131.60.1.R 131.69.1.R 132.57.1.R 133.64.1.R 133.76.1.R 134.57.1.R 135.60.1.R 136.57.1.R 137.59.1.R 137.62.1.R 138.59.1.R 138.71.1.R 139.64.1.R 139.76.1.R 140.59.1.R 141.62.1.R 142.59.1.R 143.59.1.R 143.62.1.R 143.71.1.R 144.59.1.R 145.64.1.R 145.76.1.R 146.59.1.R 147.62.1.R 148.59.1.R 149.60.1.R 150.60.1.R 150.64.1.R 150.72.1.R 151.64.1.R 151.76.1.R 152.60.2.R 154.64.1.R 155.60.1.R 156.60.1.R 156.64.1.R 156.72.1.R 157.60.1.R 158.64.1.R 158.76.1.R 159.60.1.R 160.64.1.R 161.60.1.R 162.62.1.R 163.62.1.R 163.64.1.R 163.74.1.R 164.64.1.R 164.76.1.R 165.62.1.R 166.64.1.R 167.62.1.R 168.62.1.R 168.64.1.R 168.74.1.R 169.62.1.R 170.64.1.R 170.76.1.R 171.62.1.R 172.64.1.R 173.62.1.R 174.57.1.R 175.60.1.R 175.69.1.R 176.57.1.R 176.65.1.R 177.48.1.R 177.60.1.R 178.53.1.R 178.57.1.R 179.57.2.R 179.60.2.R 181.60.1.R 181.64.1.R 181.76.1.R 182.57.1.R 182.60.1.R 183.53.1.R 183.57.1.R 184.48.1.R 184.60.1.R 185.57.1.R 186.60.1.R 187.59.1.R 187.62.1.R 187.71.1.R 188.67.1.R 189.59.1.R 189.62.1.R 190.50.1.R 190.62.1.R 191.55.1.R 191.59.1.R 192.59.1.R 192.62.1.R 193.62.1.R 193.64.1.R 193.76.1.R 194.59.1.R 194.62.1.R 195.55.1.R 195.59.1.R 196.50.1.R 196.62.1.R 197.59.1.R 198.62.1.R 199.60.1.R 200.64.1.R 200.72.1.R 201.48.1.R 201.60.1.R 201.69.1.R 202.52.1.R 202.64.1.R 203.57.1.R 203.60.1.R 204.60.1.R 204.64.1.R 205.64.1.R 205.76.1.R 206.60.2.R 206.64.2.R 208.57.1.R 208.60.1.R 209.52.1.R 209.64.1.R 210.48.1.R 210.60.1.R 211.64.1.R 212.59.1.R 212.62.1.R 212.71.1.R 213.67.1.R 214.59.1.R 214.62.1.R 215.50.1.R 215.62.1.R 216.55.1.R 216.59.1.R 217.59.1.R 217.62.1.R 218.62.1.R 218.64.1.R 218.76.1.R 219.59.1.R 219.62.1.R 220.55.1.R 220.59.1.R 221.50.1.R 221.62.1.R 222.59.1.R 223.62.1.R 224.53.1.R 224.57.1.R 224.60.1.R 225.64.1.R 226.76.3.R 230.57.1.R 231.60.1.R 232.64.3.R 232.76.3.R 237.55.1.R 237.59.1.R 237.62.1.R 238.64.1.R 239.76.3.R 243.59.1.R 243.62.1.R 244.64.1.R 245.76.3.R 249.57.1.R 249.60.1.R 250.62.1.R 251.64.3.R 251.76.3.R 255.60.1.R 255.72.1.R 256.62.1.R 256.74.1.R 257.64.3.R 257.76.3.R 257.88.3.R 262.55.1.R 262.59.1.R 262.62.1.R 262.74.1.R 263.64.1.R 263.76.1.R 264.76.3.R 264.88.3.R 268.59.1.R 268.62.1.R 268.74.1.R 269.64.1.R 269.76.1.R 270.76.3.R 270.88.3.R 274.48.1.R 274.55.1.R 274.67.1.R 275.57.1.R 275.69.1.R 276.57.1.R 276.76.1.R 276.88.1.R 277.57.1.R 277.69.1.R 278.57.1.R 278.69.1.R 279.57.1.R 279.69.1.R 280.48.1.R 280.57.1.R 280.69.1.R 281.57.1.R 281.69.1.R 282.57.1.R 282.76.1.R 282.88.1.R 283.57.1.R 283.69.1.R 284.57.1.R 284.69.1.R 285.57.1.R 285.69.1.R 286.50.1.R 286.57.1.R 286.69.1.R 287.59.2.R 287.71.2.R 289.59.1.R 289.76.1.R 289.88.1.R 290.59.1.R 290.71.1.R 291.59.1.R 291.71.1.R 292.59.1.R 292.71.1.R 293.50.1.R 293.59.1.R 293.71.1.R 294.59.1.R 294.71.1.R 295.59.1.R 295.76.1.R 295.88.1.R 296.59.1.R 296.71.1.R 297.59.1.R 297.71.1.R 298.59.1.R 298.71.1.R 299.52.1.R 299.59.1.R 299.60.1.R 299.72.1.R 300.60.1.R 300.72.1.R 301.60.1.R 301.76.1.R 301.88.1.R 302.60.1.R 302.72.1.R 303.60.1.R 303.72.1.R 304.60.1.R 304.72.1.R 305.52.1.R 305.60.1.R 305.72.1.R 306.60.1.R 306.72.1.R 307.60.1.R 307.76.1.R 307.88.1.R 308.60.1.R 308.72.1.R 309.60.1.R 309.72.1.R 310.60.1.R 310.72.1.R 311.50.1.R 311.60.1.R 311.72.1.R 312.62.1.R 312.74.1.R 313.62.1.R 313.76.1.R 313.88.1.R 314.62.2.R 314.74.2.R 316.62.1.R 316.74.1.R 317.62.1.R 317.74.1.R 318.50.1.R 318.62.1.R 318.74.1.R 319.62.1.R 319.74.1.R 320.62.1.R 320.76.1.R 320.88.1.R 321.62.1.R 321.74.1.R 322.55.1.R 322.59.1.R 322.62.1.R 322.74.1.R 323.50.1.R 323.62.1.R 323.74.1.R 324.57.1.R 324.60.1.R 324.72.1.R 325.57.1.R 325.64.1.R 325.69.1.R 325.81.1.R 326.64.1.R 326.76.1.R 326.88.1.R 327.57.1.R 327.69.1.R 328.48.1.R 328.57.1.R 328.69.1.R 329.53.1.R 329.57.1.R 329.69.1.R 330.57.1.R 330.60.1.R 330.64.1.R 330.69.1.R 330.81.1.R 331.57.1.R 331.60.1.R 331.72.1.R 332.57.1.R 332.64.1.R 332.76.1.R 332.88.1.R 333.53.1.R 333.57.1.R 333.69.1.R 334.48.1.R 334.57.1.R 334.69.1.R 335.57.1.R 335.69.1.R 336.59.1.R 336.71.1.R 337.59.1.R 337.62.1.R 337.74.1.R 338.64.1.R 338.71.1.R 338.76.1.R 338.88.1.R 339.59.1.R 339.71.1.R 340.50.1.R 340.59.1.R 340.71.1.R 341.55.2.R 341.59.2.R 341.71.2.R 343.59.1.R 343.62.1.R 343.71.1.R 343.83.1.R 344.59.1.R 344.62.1.R 344.74.1.R 345.59.1.R 345.64.1.R 345.76.1.R 345.88.1.R 346.55.1.R 346.59.1.R 346.71.1.R 347.50.1.R 347.59.1.R 347.71.1.R 348.59.1.R 348.71.1.R 349.60.1.R 349.72.1.R 349.84.1.R 350.64.1.R 350.76.1.R 351.64.1.R 351.69.1.R 351.76.1.R 351.88.1.R 352.48.1.R 352.60.1.R 352.72.1.R 353.52.1.R 353.60.1.R 353.72.1.R 354.57.1.R 354.60.1.R 354.72.1.R 355.60.1.R 355.64.1.R 355.69.1.R 355.72.1.R 355.84.1.R 356.60.1.R 356.64.1.R 356.76.1.R 357.60.1.R 357.64.1.R 357.76.1.R 357.88.1.R 358.57.1.R 358.60.1.R 358.72.1.R 359.52.1.R 359.60.1.R 359.72.1.R 360.48.1.R 360.60.1.R 360.72.1.R 361.62.1.R 361.74.1.R 361.86.1.R 362.62.1.R 362.74.1.R 363.64.1.R 363.76.1.R 363.88.1.R 364.62.1.R 364.74.1.R 365.50.1.R 365.62.1.R 365.74.1.R 366.55.1.R 366.62.1.R 366.74.1.R 367.59.1.R 367.62.1.R 367.74.1.R 367.86.1.R 368.62.2.R 368.74.2.R 370.59.1.R 370.64.1.R 370.76.1.R 370.88.1.R 371.55.1.R 371.62.1.R 371.74.1.R 372.71.1.R 372.74.1.R 372.86.1.R 373.79.1.R 373.83.1.R 373.95.1.R 374.81.1.R 374.84.1.R 374.93.1.R 374.105.1.R 375.88.1.R 375.100.1.R 376.88.1.R 376.100.1.R 377.48.1.R 377.60.1.R 378.53.1.R 378.81.1.R 378.93.1.R 378.105.1.R 379.81.1.R 379.93.1.R 379.105.1.R 380.60.2.R 380.81.2.R 380.84.2.R 380.88.2.R 380.93.2.R 380.105.2.R 382.53.1.R 382.88.1.R 382.100.1.R 383.48.1.R 383.60.1.R 384.93.1.R 384.105.1.R 385.88.1.R 385.100.1.R 386.81.1.R 386.84.1.R 386.86.1.R 386.98.1.R 387.83.1.R 387.95.1.R 387.107.1.R 388.88.2.R 388.100.2.R 390.50.1.R 390.55.1.R 390.83.1.R 390.95.1.R 390.107.1.R 391.83.1.R 391.95.1.R 391.107.1.R 392.62.2.R 392.83.2.R 392.86.2.R 392.95.2.R 392.107.2.R 394.55.1.R 394.88.1.R 394.100.1.R 395.50.2.R 395.62.2.R 397.91.1.R 397.95.1.R 397.107.1.R 398.83.1.R 398.86.1.R 398.98.1.R 399.84.1.R 399.96.1.R 399.108.1.R 400.88.1.R 400.100.1.R 401.48.1.R 401.88.1.R 401.100.1.R 402.52.1.R 402.64.1.R 403.57.1.R 403.84.1.R 403.96.1.R 403.108.1.R 404.84.1.R 404.96.1.R 404.108.1.R 405.64.2.R 405.84.2.R 405.88.2.R 405.96.2.R 405.108.2.R 407.57.1.R 407.88.1.R 407.100.1.R 408.48.1.R 408.52.1.R 408.64.1.R 409.96.1.R 409.108.1.R 410.93.1.R 410.105.1.R 411.84.1.R 411.88.1.R 411.100.1.R 412.86.1.R 412.98.1.R 413.88.2.R 413.100.2.R 415.50.1.R 415.55.1.R 415.86.1.R 415.98.1.R 416.86.1.R 416.98.1.R 417.62.2.R 417.86.2.R 417.88.2.R 417.98.2.R 419.55.1.R 419.88.1.R 419.100.1.R 420.50.1.R 420.62.1.R 421.93.1.R 421.105.1.R 422.86.1.R 422.98.1.R 423.81.1.R 423.84.1.R 423.96.1.R 424.48.1.R 424.53.1.R 424.69.1.R 424.81.1.R 425.69.1.R 425.81.1.R 426.76.1.R 426.88.1.R 427.69.1.R 427.81.1.R 428.69.1.R 428.81.1.R 429.69.1.R 429.81.1.R 430.76.1.R 430.88.1.R 431.69.1.R 431.81.1.R 432.69.1.R 432.81.1.R 433.69.1.R 433.81.1.R 434.76.1.R 434.88.1.R 435.69.1.R 435.81.1.R 436.50.1.R 436.55.1.R 436.71.1.R 436.83.1.R 437.71.1.R 437.83.1.R 438.76.1.R 438.88.1.R 439.71.1.R 439.83.1.R 440.71.1.R 440.83.1.R 441.71.1.R 441.83.1.R 442.76.1.R 442.88.1.R 443.71.1.R 443.83.1.R 444.71.1.R 444.83.1.R 445.71.1.R 445.83.1.R 446.76.1.R 446.88.1.R 447.71.1.R 447.83.1.R 448.52.1.R 448.57.1.R 448.72.1.R 448.84.1.R 449.72.2.R 449.84.2.R 451.76.1.R 451.88.1.R 452.72.1.R 452.84.1.R 453.72.1.R 453.84.1.R 454.72.1.R 454.84.1.R 455.76.1.R 455.88.1.R 456.72.1.R 456.84.1.R 457.72.1.R 457.84.1.R 458.72.1.R 458.84.1.R 459.76.1.R 459.88.1.R 460.72.1.R 460.84.1.R 461.74.1.R 461.86.1.R 462.74.1.R 462.86.1.R 463.76.1.R 463.88.1.R 464.74.1.R 464.86.1.R 465.74.1.R 465.86.1.R 466.74.1.R 466.86.1.R 467.76.1.R 467.88.1.R 468.74.1.R 468.86.1.R 469.74.1.R 469.86.1.R 470.74.1.R 470.86.1.R 471.69.1.R 471.76.1.R 471.88.1.R 472.74.1.R 472.86.1.R 473.57.1.R 473.71.1.R 473.72.1.R 473.84.1.R 474.48.1.R 474.57.1.R 474.69.1.R 475.53.3.R 475.60.3.R 475.64.3.R 475.76.3.R 478.48.2.R 478.57.2.R 478.69.2.R 480.57.1.R 480.69.1.R 481.48.1.R 481.57.1.R 481.69.1.R 482.53.2.R 482.60.2.R 482.64.2.R 482.76.2.R 484.48.2.R 484.57.2.R 484.69.2.R 486.59.1.R 486.71.1.R 487.50.1.R 487.59.1.R 487.71.1.R 488.55.2.R 488.62.2.R 488.64.2.R 488.76.2.R 490.50.2.R 490.59.2.R 490.71.2.R 492.59.1.R 492.71.1.R 493.50.1.R 493.59.1.R 493.71.1.R 494.55.3.R 494.59.3.R 494.64.3.R 494.76.3.R 498.62.2.R 498.74.2.R 500.60.2.R 500.72.2.R 502.59.3.R 502.71.3.R 505.52.1.R 505.64.1.R 506.57.1.R 506.69.1.R 507.59.3.R 507.71.3.R 511.52.1.R 511.64.1.R 512.57.3.R 512.69.3.R';
const ITE_EASY = '0.40.16.L 16.50.16.L 32.48.16.L 48.50.16.L 64.40.16.L 80.50.16.L 96.48.16.L 112.50.16.L 128.40.16.L 144.43.16.L 160.50.16.L 176.48.16.L 192.40.16.L 208.43.16.L 224.50.16.L 240.48.16.L 0.52.4.R 4.59.4.R 8.59.4.R 12.55.4.R 16.54.4.R 20.54.4.R 24.54.4.R 28.54.2.R 30.55.2.R 32.52.4.R 36.59.4.R 40.59.4.R 44.55.4.R 48.54.4.R 52.54.4.R 56.54.4.R 60.54.2.R 62.55.2.R 64.52.4.R 64.64.4.R 64.71.4.R 68.59.4.R 72.59.4.R 76.55.4.R 80.54.4.R 80.62.4.R 80.66.4.R 84.54.4.R 88.54.4.R 92.54.2.R 94.55.2.R 96.52.4.R 96.64.4.R 96.71.4.R 100.59.4.R 104.59.4.R 108.55.4.R 112.54.6.R 118.71.2.R 120.71.4.R 124.72.4.R 128.71.6.R 128.78.6.R 134.52.2.R 134.71.2.R 134.78.2.R 136.55.2.R 136.78.2.R 138.52.1.R 139.74.3.R 142.74.6.R 148.50.2.R 150.55.2.R 152.59.2.R 154.55.2.R 154.74.2.R 156.50.2.R 156.76.2.R 158.74.6.R 158.78.6.R 164.50.2.R 166.52.2.R 166.76.2.R 168.50.1.R 168.54.1.R 168.78.1.R 169.76.1.R 170.78.2.R 172.79.2.R 174.78.4.R 178.76.4.R 182.52.2.R 182.71.2.R 184.74.4.R 188.50.4.R 188.54.4.R 188.76.4.R 192.71.6.R 192.78.6.R 198.52.2.R 198.71.2.R 198.78.2.R 200.55.2.R 200.78.2.R 202.52.1.R 203.74.3.R 206.74.6.R 212.50.2.R 214.55.2.R 216.59.2.R 218.55.2.R 218.74.2.R 220.50.2.R 220.76.2.R 222.74.6.R 222.78.6.R 228.50.2.R 230.52.2.R 230.76.2.R 232.50.1.R 232.54.1.R 232.78.1.R 233.76.1.R 234.78.2.R 236.76.2.R 238.79.4.R 242.78.2.R 244.76.2.R 246.52.4.R 246.74.4.R 250.76.1.R 251.74.1.R 252.50.4.R 252.54.4.R 252.71.4.R';
const ITE_MED = '128.40.2.L 130.47.14.L 144.38.2.L 146.43.14.L 160.36.2.L 162.43.14.L 176.48.8.L 184.47.8.L 192.40.2.L 194.47.14.L 208.38.2.L 210.43.14.L 224.36.2.L 226.43.14.L 240.38.2.L 242.43.14.L 256.40.2.L 258.47.14.L 272.38.2.L 274.43.14.L 288.36.2.L 290.43.14.L 304.38.2.L 306.43.14.L 320.40.2.L 322.47.14.L 336.38.2.L 338.43.14.L 352.36.2.L 354.43.14.L 368.38.2.L 370.45.16.L 386.40.2.L 388.47.8.L 396.47.2.L 398.43.4.L 402.43.12.L 414.47.2.L 416.38.2.L 418.45.10.L 428.45.4.L 432.36.2.L 434.43.2.L 436.48.4.L 440.38.2.L 442.45.8.L 450.40.2.L 452.47.8.L 460.47.2.L 462.43.4.L 466.43.12.L 478.47.2.L 480.38.2.L 482.45.10.L 492.45.4.L 496.36.2.L 498.43.2.L 500.48.4.L 504.38.2.L 506.45.6.L 512.40.2.L 514.47.14.L 528.38.2.L 530.43.14.L 544.36.2.L 546.43.14.L 560.48.8.L 568.47.8.L 576.40.2.L 578.47.14.L 592.38.2.L 594.43.14.L 608.36.2.L 610.43.14.L 624.38.2.L 626.43.14.L 640.40.2.L 642.47.14.L 656.38.2.L 658.43.14.L 672.36.2.L 674.43.14.L 688.38.2.L 690.43.14.L 704.40.2.L 706.47.14.L 720.38.2.L 722.43.14.L 736.36.2.L 738.43.14.L 752.38.2.L 754.45.16.L 770.40.2.L 772.47.8.L 780.47.2.L 782.43.4.L 786.43.12.L 798.47.2.L 800.38.2.L 802.45.10.L 812.45.4.L 816.36.2.L 818.43.2.L 820.48.4.L 824.38.2.L 826.45.8.L 834.40.2.L 836.47.8.L 844.47.2.L 846.43.4.L 850.43.12.L 862.47.2.L 864.38.2.L 866.45.10.L 876.45.4.L 880.36.2.L 882.43.2.L 884.48.4.L 888.38.2.L 890.45.6.L 896.38.4.L 900.45.12.L 912.40.2.L 914.47.4.L 918.47.4.L 922.47.6.L 928.38.2.L 930.45.4.L 934.45.4.L 938.45.6.L 944.36.2.L 946.43.2.L 948.48.2.L 950.43.4.L 954.43.2.L 956.48.4.L 960.38.4.L 964.45.12.L 976.40.2.L 978.47.4.L 982.47.4.L 986.47.6.L 992.38.2.L 994.45.4.L 998.45.4.L 1002.45.6.L 1008.36.2.L 1010.43.2.L 1012.48.2.L 1014.43.4.L 1018.43.2.L 1020.48.4.L 1024.38.16.L 1040.40.16.L 1040.52.16.L 1056.38.16.L 1056.50.16.L 1072.36.4.L 1072.48.4.L 1076.47.12.L 1088.38.16.L 1088.50.16.L 1104.40.16.L 1104.52.16.L 1120.38.16.L 1120.50.16.L 1136.36.4.L 1136.48.4.L 1140.47.12.L 1152.38.2.L 1152.50.2.L 1154.45.10.L 1164.45.6.L 1170.40.2.L 1172.47.8.L 1180.47.2.L 1182.43.4.L 1186.43.12.L 1198.47.2.L 1200.38.2.L 1202.45.10.L 1212.45.4.L 1216.36.2.L 1218.43.2.L 1220.48.4.L 1224.38.2.L 1226.45.8.L 1234.40.2.L 1236.47.8.L 1244.47.2.L 1246.43.4.L 1250.43.12.L 1262.47.2.L 1264.38.2.L 1266.45.10.L 1276.45.4.L 1280.36.2.L 1282.43.2.L 1284.48.4.L 1288.38.2.L 1290.45.16.L 0.52.4.R 4.59.4.R 8.59.4.R 12.55.4.R 16.54.4.R 20.54.4.R 24.54.4.R 28.54.2.R 30.55.2.R 32.52.4.R 36.59.4.R 40.59.4.R 44.55.4.R 48.54.4.R 52.54.4.R 56.54.4.R 60.54.2.R 62.55.2.R 64.52.4.R 64.64.4.R 64.71.4.R 68.59.4.R 72.59.4.R 76.55.4.R 80.54.4.R 80.62.4.R 80.66.4.R 84.54.4.R 88.54.4.R 92.54.2.R 94.55.2.R 96.52.4.R 96.64.4.R 96.71.4.R 100.59.4.R 104.59.4.R 108.55.4.R 112.54.6.R 118.71.2.R 120.71.4.R 124.72.4.R 128.83.2.R 130.83.2.R 132.54.3.R 135.76.1.R 136.55.2.R 136.83.2.R 138.83.2.R 140.76.3.R 143.74.1.R 144.76.1.R 145.76.1.R 146.76.1.R 147.76.1.R 148.52.2.R 148.76.2.R 150.76.1.R 151.74.1.R 152.54.2.R 152.76.2.R 154.76.2.R 156.83.4.R 160.83.2.R 162.72.1.R 163.72.1.R 164.50.1.R 165.81.2.R 167.79.1.R 168.52.2.R 168.81.2.R 170.79.2.R 172.72.4.R 176.71.2.R 178.55.1.R 178.71.1.R 179.71.1.R 180.62.1.R 181.72.2.R 183.74.1.R 184.72.2.R 186.54.2.R 186.71.2.R 188.63.4.R 188.71.4.R 192.71.4.R 192.76.4.R 196.54.2.R 196.71.2.R 196.76.2.R 198.76.1.R 199.74.1.R 200.55.2.R 200.76.2.R 202.76.2.R 204.71.2.R 206.69.2.R 208.71.2.R 210.71.2.R 212.52.2.R 212.74.2.R 214.76.2.R 216.54.2.R 216.79.2.R 218.81.1.R 219.79.1.R 220.83.4.R 224.81.1.R 225.79.1.R 226.81.1.R 227.79.1.R 228.50.2.R 228.81.2.R 230.81.1.R 231.79.1.R 232.52.2.R 232.81.2.R 234.79.2.R 236.76.2.R 238.74.2.R 240.74.4.R 240.76.4.R 244.52.4.R 244.74.4.R 244.76.4.R 248.54.4.R 248.71.4.R 252.72.4.R 256.64.4.R 260.54.4.R 260.71.4.R 264.55.1.R 264.76.1.R 265.71.1.R 266.69.1.R 267.71.1.R 268.69.2.R 270.67.2.R 272.66.4.R 276.52.4.R 276.66.4.R 280.54.1.R 280.66.1.R 281.67.1.R 282.66.1.R 283.64.1.R 284.66.2.R 286.67.2.R 288.64.4.R 292.50.4.R 292.71.4.R 296.52.1.R 296.76.1.R 297.71.1.R 298.69.1.R 299.71.1.R 300.69.2.R 302.67.2.R 304.66.4.R 308.52.4.R 308.66.4.R 312.54.4.R 312.74.4.R 316.76.4.R 320.64.4.R 324.54.4.R 324.71.4.R 328.55.1.R 328.76.1.R 329.76.1.R 330.76.1.R 331.78.1.R 332.76.2.R 334.67.2.R 336.66.4.R 340.52.4.R 340.66.4.R 344.54.1.R 344.62.1.R 345.64.1.R 346.66.1.R 347.64.1.R 348.66.2.R 350.67.2.R 352.64.4.R 356.50.4.R 356.71.4.R 360.52.4.R 360.71.4.R 364.67.4.R 368.66.4.R 372.50.2.R 374.52.2.R 374.71.2.R 376.57.4.R 376.74.4.R 380.76.4.R 384.71.6.R 384.78.6.R 390.52.2.R 390.71.2.R 390.78.2.R 392.55.2.R 392.78.2.R 394.52.1.R 395.74.3.R 398.74.6.R 404.50.2.R 406.55.2.R 408.59.2.R 410.55.2.R 410.74.2.R 412.50.2.R 412.76.2.R 414.74.6.R 414.78.6.R 420.50.2.R 422.52.2.R 422.76.2.R 424.50.1.R 424.54.1.R 424.78.1.R 425.76.1.R 426.78.2.R 428.79.2.R 430.78.4.R 434.76.4.R 438.52.2.R 438.71.2.R 440.74.4.R 444.50.4.R 444.54.4.R 444.76.4.R 448.71.6.R 448.78.6.R 454.52.2.R 454.71.2.R 454.78.2.R 456.55.2.R 456.78.2.R 458.52.1.R 459.74.3.R 462.74.6.R 468.50.2.R 470.55.2.R 472.59.2.R 474.55.2.R 474.74.2.R 476.50.2.R 476.76.2.R 478.74.6.R 478.78.6.R 484.50.2.R 486.52.2.R 486.76.2.R 488.50.1.R 488.54.1.R 488.78.1.R 489.76.1.R 490.78.2.R 492.76.2.R 494.79.4.R 498.78.2.R 500.76.2.R 502.52.4.R 502.74.4.R 506.76.1.R 507.74.1.R 508.50.4.R 508.54.4.R 508.71.4.R 512.83.2.R 514.83.2.R 516.54.3.R 519.76.1.R 520.55.2.R 520.83.2.R 522.83.2.R 524.76.3.R 527.74.1.R 528.76.1.R 529.76.1.R 530.76.1.R 531.76.1.R 532.52.2.R 532.76.2.R 534.76.1.R 535.74.1.R 536.54.2.R 536.76.2.R 538.76.2.R 540.83.4.R 544.83.2.R 546.72.1.R 547.72.1.R 548.50.1.R 549.81.2.R 551.79.1.R 552.52.2.R 552.81.2.R 554.79.2.R 556.72.4.R 560.71.2.R 562.55.1.R 562.71.1.R 563.71.1.R 564.62.1.R 565.72.2.R 567.74.1.R 568.72.2.R 570.54.2.R 570.71.2.R 572.63.4.R 572.71.4.R 576.71.4.R 576.76.4.R 580.54.2.R 580.71.2.R 580.76.2.R 582.76.1.R 583.74.1.R 584.55.2.R 584.76.2.R 586.76.2.R 588.71.2.R 590.69.2.R 592.71.2.R 594.71.2.R 596.52.2.R 596.74.2.R 598.76.2.R 600.54.2.R 600.79.2.R 602.81.1.R 603.79.1.R 604.83.4.R 608.81.1.R 609.79.1.R 610.81.1.R 611.79.1.R 612.50.2.R 612.81.2.R 614.81.1.R 615.79.1.R 616.52.2.R 616.81.2.R 618.79.2.R 620.76.2.R 622.74.2.R 624.74.4.R 624.76.4.R 628.52.4.R 628.74.4.R 628.76.4.R 632.54.4.R 632.71.4.R 636.72.4.R 640.64.4.R 644.54.4.R 644.71.4.R 648.55.1.R 648.76.1.R 649.71.1.R 650.69.1.R 651.71.1.R 652.69.2.R 654.67.2.R 656.66.4.R 660.52.4.R 660.66.4.R 664.54.1.R 664.66.1.R 665.67.1.R 666.66.1.R 667.64.1.R 668.66.2.R 670.67.2.R 672.64.4.R 676.50.4.R 676.71.4.R 680.52.1.R 680.76.1.R 681.71.1.R 682.69.1.R 683.71.1.R 684.69.2.R 686.67.2.R 688.66.4.R 692.52.4.R 692.66.4.R 696.54.4.R 696.74.4.R 700.76.4.R 704.64.4.R 708.54.4.R 708.71.4.R 712.55.1.R 712.76.1.R 713.76.1.R 714.76.1.R 715.78.1.R 716.76.2.R 718.67.2.R 720.66.4.R 724.52.4.R 724.66.4.R 728.54.1.R 728.62.1.R 729.64.1.R 730.66.1.R 731.64.1.R 732.66.2.R 734.67.2.R 736.64.4.R 740.50.4.R 740.71.4.R 744.52.4.R 744.71.4.R 748.67.4.R 752.66.4.R 756.50.2.R 758.52.2.R 758.71.2.R 760.57.4.R 760.74.4.R 764.76.4.R 768.71.6.R 768.78.6.R 774.52.2.R 774.71.2.R 774.78.2.R 776.55.2.R 776.78.2.R 778.52.1.R 779.74.3.R 782.74.6.R 788.50.2.R 790.55.2.R 792.59.2.R 794.55.2.R 794.74.2.R 796.50.2.R 796.76.2.R 798.74.6.R 798.78.6.R 804.50.2.R 806.52.2.R 806.76.2.R 808.50.1.R 808.54.1.R 808.78.1.R 809.76.1.R 810.78.2.R 812.79.2.R 814.78.4.R 818.76.4.R 822.52.2.R 822.71.2.R 824.74.4.R 828.50.4.R 828.54.4.R 828.76.4.R 832.71.6.R 832.78.6.R 838.52.2.R 838.71.2.R 838.78.2.R 840.55.2.R 840.78.2.R 842.52.1.R 843.74.3.R 846.74.6.R 852.50.2.R 854.55.2.R 856.59.2.R 858.55.2.R 858.74.2.R 860.50.2.R 860.76.2.R 862.74.6.R 862.78.6.R 868.50.2.R 870.52.2.R 870.76.2.R 872.50.1.R 872.54.1.R 872.78.1.R 873.76.1.R 874.78.2.R 876.76.2.R 878.79.4.R 882.78.2.R 884.76.2.R 886.52.4.R 886.74.4.R 890.76.1.R 891.74.1.R 892.50.8.R 892.54.8.R 892.71.8.R 902.64.2.R 904.50.2.R 904.74.2.R 906.74.4.R 910.74.6.R 916.52.4.R 920.55.4.R 920.64.4.R 924.52.2.R 926.69.4.R 930.71.2.R 932.50.4.R 936.54.2.R 936.74.2.R 938.74.2.R 940.50.2.R 942.74.4.R 946.67.4.R 950.67.2.R 952.52.2.R 954.71.4.R 958.69.8.R 968.50.2.R 968.74.2.R 970.74.2.R 972.54.2.R 974.74.6.R 980.52.2.R 982.67.2.R 984.55.2.R 984.67.2.R 986.67.2.R 988.52.2.R 990.71.4.R 994.69.2.R 996.50.2.R 998.67.2.R 1000.54.2.R 1002.71.2.R 1004.50.2.R 1006.69.8.R 1016.52.6.R 1022.71.1.R 1023.69.1.R 1024.67.6.R 1030.71.2.R 1032.79.2.R 1034.79.4.R 1038.79.6.R 1044.52.4.R 1044.55.4.R 1048.55.4.R 1048.59.4.R 1048.76.4.R 1052.59.2.R 1052.64.2.R 1054.78.6.R 1060.50.4.R 1060.54.4.R 1064.54.2.R 1064.57.2.R 1064.79.2.R 1066.79.2.R 1068.57.2.R 1068.62.2.R 1070.79.4.R 1074.76.2.R 1076.50.2.R 1078.76.2.R 1080.52.2.R 1080.55.2.R 1082.79.2.R 1084.55.2.R 1084.60.2.R 1086.78.6.R 1092.50.4.R 1092.54.4.R 1096.54.2.R 1096.57.2.R 1096.79.2.R 1098.79.2.R 1100.57.2.R 1100.62.2.R 1102.79.6.R 1108.52.2.R 1108.55.2.R 1110.76.2.R 1112.55.2.R 1112.59.2.R 1112.76.2.R 1114.76.2.R 1116.59.2.R 1116.64.2.R 1118.79.4.R 1122.78.2.R 1124.50.2.R 1124.54.2.R 1126.76.2.R 1128.54.2.R 1128.57.2.R 1130.79.2.R 1132.57.2.R 1132.62.2.R 1134.78.6.R 1140.50.4.R 1144.52.4.R 1144.55.4.R 1148.55.2.R 1148.60.2.R 1150.79.1.R 1151.78.1.R 1152.76.4.R 1156.52.2.R 1158.71.2.R 1160.50.4.R 1160.54.4.R 1160.74.4.R 1164.76.4.R 1168.71.6.R 1168.78.6.R 1174.52.2.R 1174.71.2.R 1174.78.2.R 1176.55.2.R 1176.78.2.R 1178.52.1.R 1179.74.3.R 1182.74.6.R 1188.50.2.R 1190.55.2.R 1192.59.2.R 1194.55.2.R 1194.74.2.R 1196.50.2.R 1196.76.2.R 1198.74.6.R 1198.78.6.R 1204.50.2.R 1206.52.2.R 1206.76.2.R 1208.50.1.R 1208.54.1.R 1208.78.1.R 1209.76.1.R 1210.78.2.R 1212.79.2.R 1214.78.4.R 1218.76.4.R 1222.52.2.R 1222.71.2.R 1224.74.4.R 1228.50.4.R 1228.54.4.R 1228.76.4.R 1232.71.6.R 1232.78.6.R 1238.52.2.R 1238.71.2.R 1238.78.2.R 1240.55.2.R 1240.78.2.R 1242.52.1.R 1243.74.3.R 1246.74.6.R 1252.50.2.R 1254.55.2.R 1256.59.2.R 1258.55.2.R 1258.74.2.R 1260.50.2.R 1260.76.2.R 1262.74.6.R 1262.78.6.R 1268.50.2.R 1270.52.2.R 1270.76.2.R 1272.50.1.R 1272.54.1.R 1272.78.1.R 1273.76.1.R 1274.78.2.R 1276.76.2.R 1278.79.4.R 1282.78.2.R 1284.76.2.R 1286.52.4.R 1286.74.4.R 1290.76.1.R 1291.74.1.R 1292.50.4.R 1292.54.4.R 1292.71.4.R 1296.52.4.R 1296.64.4.R 1296.71.4.R 1300.59.4.R 1304.59.4.R 1308.55.4.R 1312.54.4.R 1312.62.4.R 1312.66.4.R 1316.54.4.R 1320.54.4.R 1324.54.2.R 1326.55.2.R 1328.52.4.R 1328.64.4.R 1328.71.4.R 1332.59.4.R 1336.59.4.R 1340.55.4.R 1344.54.4.R 1344.62.4.R 1344.66.4.R 1348.54.4.R 1352.54.4.R 1356.54.2.R 1358.55.2.R 1360.52.4.R 1364.59.4.R 1368.59.4.R 1372.55.4.R 1376.54.4.R 1380.54.4.R 1384.54.4.R 1388.54.2.R 1390.55.2.R 1392.52.4.R 1396.59.4.R 1400.59.4.R 1404.55.4.R 1408.54.4.R 1412.54.4.R 1416.54.4.R 1420.54.2.R 1422.55.2.R 1424.52.2.R 1426.55.2.R 1428.59.2.R 1430.64.2.R 1432.66.2.R 1434.67.2.R 1436.66.8.R';
const ITE_HARD = '128.40.2.L 130.47.2.L 132.59.2.L 134.47.2.L 136.59.2.L 138.47.2.L 140.59.2.L 142.47.2.L 144.38.2.L 146.43.2.L 148.55.2.L 150.43.2.L 152.55.2.L 154.43.2.L 156.55.2.L 158.43.2.L 160.36.2.L 162.43.2.L 164.55.2.L 166.43.2.L 168.55.2.L 170.43.2.L 172.55.2.L 174.43.2.L 176.48.2.L 178.60.2.L 180.48.2.L 182.60.2.L 184.47.2.L 186.59.2.L 188.47.2.L 190.59.2.L 192.40.2.L 194.47.2.L 196.59.2.L 198.47.2.L 200.59.2.L 202.47.2.L 204.59.2.L 206.47.2.L 208.38.2.L 210.43.2.L 212.55.2.L 214.43.2.L 216.55.2.L 218.43.2.L 220.55.2.L 222.43.2.L 224.36.2.L 226.43.2.L 228.55.2.L 230.43.2.L 232.55.2.L 234.43.2.L 236.55.2.L 238.43.2.L 240.38.2.L 242.43.2.L 244.55.2.L 246.43.2.L 248.55.2.L 250.43.2.L 252.55.2.L 254.43.2.L 256.40.2.L 258.47.2.L 260.59.2.L 262.47.2.L 264.59.2.L 266.47.2.L 268.59.2.L 270.47.2.L 272.38.2.L 274.43.2.L 276.55.2.L 278.43.2.L 280.55.2.L 282.43.2.L 284.55.2.L 286.43.2.L 288.36.2.L 290.43.2.L 292.55.2.L 294.43.2.L 296.55.2.L 298.43.2.L 300.55.2.L 302.43.2.L 304.38.2.L 306.43.2.L 308.55.2.L 310.43.2.L 312.55.2.L 314.43.2.L 316.55.2.L 318.43.2.L 320.40.2.L 322.47.2.L 324.59.2.L 326.47.2.L 328.59.2.L 330.47.2.L 332.59.2.L 334.47.2.L 336.38.2.L 338.43.2.L 340.55.2.L 342.43.2.L 344.55.2.L 346.43.2.L 348.55.2.L 350.43.2.L 352.36.2.L 354.43.2.L 356.55.2.L 358.43.2.L 360.55.2.L 362.43.2.L 364.55.2.L 366.43.2.L 368.38.2.L 370.45.2.L 372.57.2.L 374.45.2.L 376.57.2.L 378.45.2.L 380.57.2.L 382.45.2.L 384.57.2.L 386.40.2.L 388.47.2.L 390.59.2.L 392.47.2.L 394.59.2.L 396.47.2.L 398.43.4.L 402.43.2.L 404.55.2.L 406.43.2.L 408.55.2.L 410.43.2.L 412.55.2.L 414.47.2.L 416.38.2.L 418.45.2.L 420.57.2.L 422.45.2.L 424.57.2.L 426.45.2.L 428.45.4.L 432.36.2.L 434.43.2.L 436.48.4.L 440.38.2.L 442.45.2.L 444.57.2.L 446.45.2.L 448.57.2.L 450.40.2.L 452.47.2.L 454.59.2.L 456.47.2.L 458.59.2.L 460.47.2.L 462.43.4.L 466.43.2.L 468.55.2.L 470.43.2.L 472.55.2.L 474.43.2.L 476.55.2.L 478.47.2.L 480.38.2.L 482.45.2.L 484.57.2.L 486.45.2.L 488.57.2.L 490.45.2.L 492.45.4.L 496.36.2.L 498.43.2.L 500.48.4.L 504.38.2.L 506.45.6.L 512.40.2.L 514.47.2.L 516.59.2.L 518.47.2.L 520.59.2.L 522.47.2.L 524.59.2.L 526.47.2.L 528.38.2.L 530.43.2.L 532.55.2.L 534.43.2.L 536.55.2.L 538.43.2.L 540.55.2.L 542.43.2.L 544.36.2.L 546.43.2.L 548.55.2.L 550.43.2.L 552.55.2.L 554.43.2.L 556.55.2.L 558.43.2.L 560.48.2.L 562.60.2.L 564.48.2.L 566.60.2.L 568.47.2.L 570.59.2.L 572.47.2.L 574.59.2.L 576.40.2.L 578.47.2.L 580.59.2.L 582.47.2.L 584.59.2.L 586.47.2.L 588.59.2.L 590.47.2.L 592.38.2.L 594.43.2.L 596.55.2.L 598.43.2.L 600.55.2.L 602.43.2.L 604.55.2.L 606.43.2.L 608.36.2.L 610.43.2.L 612.55.2.L 614.43.2.L 616.55.2.L 618.43.2.L 620.55.2.L 622.43.2.L 624.38.2.L 626.43.2.L 628.55.2.L 630.43.2.L 632.55.2.L 634.43.2.L 636.55.2.L 638.43.2.L 640.40.2.L 642.47.2.L 644.59.2.L 646.47.2.L 648.59.2.L 650.47.2.L 652.59.2.L 654.47.2.L 656.38.2.L 658.43.2.L 660.55.2.L 662.43.2.L 664.55.2.L 666.43.2.L 668.55.2.L 670.43.2.L 672.36.2.L 674.43.2.L 676.55.2.L 678.43.2.L 680.55.2.L 682.43.2.L 684.55.2.L 686.43.2.L 688.38.2.L 690.43.2.L 692.55.2.L 694.43.2.L 696.55.2.L 698.43.2.L 700.55.2.L 702.43.2.L 704.40.2.L 706.47.2.L 708.59.2.L 710.47.2.L 712.59.2.L 714.47.2.L 716.59.2.L 718.47.2.L 720.38.2.L 722.43.2.L 724.55.2.L 726.43.2.L 728.55.2.L 730.43.2.L 732.55.2.L 734.43.2.L 736.36.2.L 738.43.2.L 740.55.2.L 742.43.2.L 744.55.2.L 746.43.2.L 748.55.2.L 750.43.2.L 752.38.2.L 754.45.2.L 756.57.2.L 758.45.2.L 760.57.2.L 762.45.2.L 764.57.2.L 766.45.2.L 768.57.2.L 770.40.2.L 772.47.2.L 774.59.2.L 776.47.2.L 778.59.2.L 780.47.2.L 782.43.4.L 786.43.2.L 788.55.2.L 790.43.2.L 792.55.2.L 794.43.2.L 796.55.2.L 798.47.2.L 800.38.2.L 802.45.2.L 804.57.2.L 806.45.2.L 808.57.2.L 810.45.2.L 812.45.4.L 816.36.2.L 818.43.2.L 820.48.4.L 824.38.2.L 826.45.2.L 828.57.2.L 830.45.2.L 832.57.2.L 834.40.2.L 836.47.2.L 838.59.2.L 840.47.2.L 842.59.2.L 844.47.2.L 846.43.4.L 850.43.2.L 852.55.2.L 854.43.2.L 856.55.2.L 858.43.2.L 860.55.2.L 862.47.2.L 864.38.2.L 866.45.2.L 868.57.2.L 870.45.2.L 872.57.2.L 874.45.2.L 876.45.4.L 880.36.2.L 882.43.2.L 884.48.4.L 888.38.2.L 890.45.6.L 896.38.4.L 900.45.2.L 902.57.2.L 904.45.2.L 906.57.2.L 908.45.2.L 910.57.2.L 912.40.2.L 914.47.4.L 918.47.4.L 922.47.6.L 928.38.2.L 930.45.4.L 934.45.4.L 938.45.6.L 944.36.2.L 946.43.2.L 948.48.2.L 950.43.4.L 954.43.2.L 956.48.4.L 960.38.4.L 964.45.2.L 966.57.2.L 968.45.2.L 970.57.2.L 972.45.2.L 974.57.2.L 976.40.2.L 978.47.4.L 982.47.4.L 986.47.6.L 992.38.2.L 994.45.4.L 998.45.4.L 1002.45.6.L 1008.36.2.L 1010.43.2.L 1012.48.2.L 1014.43.4.L 1018.43.2.L 1020.48.4.L 1024.38.2.L 1026.50.2.L 1028.38.2.L 1030.50.2.L 1032.38.2.L 1034.50.2.L 1036.38.2.L 1038.50.2.L 1040.40.2.L 1040.52.2.L 1042.52.2.L 1042.64.2.L 1044.40.2.L 1044.52.2.L 1046.52.2.L 1046.64.2.L 1048.40.2.L 1048.52.2.L 1050.52.2.L 1050.64.2.L 1052.40.2.L 1052.52.2.L 1054.52.2.L 1054.64.2.L 1056.38.2.L 1056.50.2.L 1058.50.2.L 1058.62.2.L 1060.38.2.L 1060.50.2.L 1062.50.2.L 1062.62.2.L 1064.38.2.L 1064.50.2.L 1066.50.2.L 1066.62.2.L 1068.38.2.L 1068.50.2.L 1070.50.2.L 1070.62.2.L 1072.36.4.L 1072.48.4.L 1076.47.2.L 1078.59.2.L 1080.47.2.L 1082.59.2.L 1084.47.2.L 1086.59.2.L 1088.38.2.L 1088.50.2.L 1090.50.2.L 1090.62.2.L 1092.38.2.L 1092.50.2.L 1094.50.2.L 1094.62.2.L 1096.38.2.L 1096.50.2.L 1098.50.2.L 1098.62.2.L 1100.38.2.L 1100.50.2.L 1102.50.2.L 1102.62.2.L 1104.40.2.L 1104.52.2.L 1106.52.2.L 1106.64.2.L 1108.40.2.L 1108.52.2.L 1110.52.2.L 1110.64.2.L 1112.40.2.L 1112.52.2.L 1114.52.2.L 1114.64.2.L 1116.40.2.L 1116.52.2.L 1118.52.2.L 1118.64.2.L 1120.38.2.L 1120.50.2.L 1122.50.2.L 1122.62.2.L 1124.38.2.L 1124.50.2.L 1126.50.2.L 1126.62.2.L 1128.38.2.L 1128.50.2.L 1130.50.2.L 1130.62.2.L 1132.38.2.L 1132.50.2.L 1134.50.2.L 1134.62.2.L 1136.36.4.L 1136.48.4.L 1140.47.2.L 1142.59.2.L 1144.47.2.L 1146.59.2.L 1148.47.2.L 1150.59.2.L 1152.38.2.L 1152.50.2.L 1154.45.2.L 1156.57.2.L 1158.45.2.L 1160.57.2.L 1162.45.2.L 1164.45.6.L 1170.40.2.L 1172.47.2.L 1174.59.2.L 1176.47.2.L 1178.59.2.L 1180.47.2.L 1182.43.4.L 1186.43.2.L 1188.55.2.L 1190.43.2.L 1192.55.2.L 1194.43.2.L 1196.55.2.L 1198.47.2.L 1200.38.2.L 1202.45.2.L 1204.57.2.L 1206.45.2.L 1208.57.2.L 1210.45.2.L 1212.45.4.L 1216.36.2.L 1218.43.2.L 1220.48.4.L 1224.38.2.L 1226.45.2.L 1228.57.2.L 1230.45.2.L 1232.57.2.L 1234.40.2.L 1236.47.2.L 1238.59.2.L 1240.47.2.L 1242.59.2.L 1244.47.2.L 1246.43.4.L 1250.43.2.L 1252.55.2.L 1254.43.2.L 1256.55.2.L 1258.43.2.L 1260.55.2.L 1262.47.2.L 1264.38.2.L 1266.45.2.L 1268.57.2.L 1270.45.2.L 1272.57.2.L 1274.45.2.L 1276.45.4.L 1280.36.2.L 1282.43.2.L 1284.48.4.L 1288.38.2.L 1290.45.2.L 1292.57.2.L 1294.45.2.L 1296.57.2.L 1298.45.2.L 1300.57.2.L 1302.45.2.L 1304.57.2.L 0.52.4.R 4.59.4.R 8.59.4.R 12.55.4.R 16.54.4.R 20.54.4.R 24.54.4.R 28.54.2.R 30.55.2.R 32.52.4.R 36.59.4.R 40.59.4.R 44.55.4.R 48.54.4.R 52.54.4.R 56.54.4.R 60.54.2.R 62.55.2.R 64.52.4.R 64.64.4.R 64.71.4.R 68.59.4.R 72.59.4.R 76.55.4.R 80.54.4.R 80.62.4.R 80.66.4.R 84.54.4.R 88.54.4.R 92.54.2.R 94.55.2.R 96.52.4.R 96.64.4.R 96.71.4.R 100.59.4.R 104.59.4.R 108.55.4.R 112.54.6.R 118.71.2.R 120.71.4.R 124.72.4.R 128.83.2.R 130.83.2.R 132.54.3.R 135.76.1.R 136.55.2.R 136.83.2.R 138.83.2.R 140.76.3.R 143.74.1.R 144.76.1.R 145.76.1.R 146.76.1.R 147.76.1.R 148.52.2.R 148.76.2.R 150.76.1.R 151.74.1.R 152.54.2.R 152.76.2.R 154.76.2.R 156.83.4.R 160.83.2.R 162.72.1.R 163.72.1.R 164.50.1.R 165.81.2.R 167.79.1.R 168.52.2.R 168.81.2.R 170.79.2.R 172.72.4.R 176.71.2.R 178.55.1.R 178.71.1.R 179.71.1.R 180.62.1.R 181.72.2.R 183.74.1.R 184.72.2.R 186.54.2.R 186.71.2.R 188.63.4.R 188.71.4.R 192.71.4.R 192.76.4.R 196.54.2.R 196.71.2.R 196.76.2.R 198.76.1.R 199.74.1.R 200.55.2.R 200.76.2.R 202.76.2.R 204.71.2.R 206.69.2.R 208.71.2.R 210.71.2.R 212.52.2.R 212.74.2.R 214.76.2.R 216.54.2.R 216.79.2.R 218.81.1.R 219.79.1.R 220.83.4.R 224.81.1.R 225.79.1.R 226.81.1.R 227.79.1.R 228.50.2.R 228.81.2.R 230.81.1.R 231.79.1.R 232.52.2.R 232.81.2.R 234.79.2.R 236.76.2.R 238.74.2.R 240.74.4.R 240.76.4.R 244.52.4.R 244.74.4.R 244.76.4.R 248.54.4.R 248.71.4.R 252.72.4.R 256.64.4.R 260.54.4.R 260.71.4.R 264.55.1.R 264.76.1.R 265.71.1.R 266.69.1.R 267.71.1.R 268.69.2.R 270.67.2.R 272.66.4.R 276.52.4.R 276.66.4.R 280.54.1.R 280.66.1.R 281.67.1.R 282.66.1.R 283.64.1.R 284.66.2.R 286.67.2.R 288.64.4.R 292.50.4.R 292.71.4.R 296.52.1.R 296.76.1.R 297.71.1.R 298.69.1.R 299.71.1.R 300.69.2.R 302.67.2.R 304.66.4.R 308.52.4.R 308.66.4.R 312.54.4.R 312.74.4.R 316.76.4.R 320.64.4.R 324.54.4.R 324.71.4.R 328.55.1.R 328.76.1.R 329.76.1.R 330.76.1.R 331.78.1.R 332.76.2.R 334.67.2.R 336.66.4.R 340.52.4.R 340.66.4.R 344.54.1.R 344.62.1.R 345.64.1.R 346.66.1.R 347.64.1.R 348.66.2.R 350.67.2.R 352.64.4.R 356.50.4.R 356.71.4.R 360.52.4.R 360.71.4.R 364.67.4.R 368.66.4.R 372.50.2.R 374.52.2.R 374.71.2.R 376.57.4.R 376.74.4.R 380.76.4.R 384.71.6.R 384.78.6.R 384.90.6.R 390.52.2.R 390.71.2.R 390.78.2.R 390.90.2.R 392.55.2.R 392.78.2.R 392.90.2.R 394.52.1.R 394.64.1.R 395.74.3.R 395.86.3.R 398.74.6.R 398.86.6.R 404.50.2.R 404.62.2.R 406.55.2.R 406.67.2.R 408.59.2.R 408.71.2.R 410.55.2.R 410.74.2.R 410.86.2.R 412.50.2.R 412.76.2.R 412.88.2.R 414.74.6.R 414.78.6.R 414.90.6.R 420.50.2.R 420.62.2.R 422.52.2.R 422.76.2.R 422.88.2.R 424.50.1.R 424.54.1.R 424.78.1.R 424.90.1.R 425.76.1.R 425.88.1.R 426.78.2.R 426.90.2.R 428.79.2.R 428.91.2.R 430.78.4.R 430.90.4.R 434.76.4.R 434.88.4.R 438.52.2.R 438.71.2.R 438.83.2.R 440.74.4.R 440.86.4.R 444.50.4.R 444.54.4.R 444.76.4.R 444.88.4.R 448.71.6.R 448.78.6.R 448.90.6.R 454.52.2.R 454.71.2.R 454.78.2.R 454.90.2.R 456.55.2.R 456.78.2.R 456.90.2.R 458.52.1.R 458.64.1.R 459.74.3.R 459.86.3.R 462.74.6.R 462.86.6.R 468.50.2.R 468.62.2.R 470.55.2.R 470.67.2.R 472.59.2.R 472.71.2.R 474.55.2.R 474.74.2.R 474.86.2.R 476.50.2.R 476.76.2.R 476.88.2.R 478.74.6.R 478.78.6.R 478.90.6.R 484.50.2.R 484.62.2.R 486.52.2.R 486.76.2.R 486.88.2.R 488.50.1.R 488.54.1.R 488.78.1.R 488.90.1.R 489.76.1.R 489.88.1.R 490.78.2.R 490.90.2.R 492.76.2.R 492.88.2.R 494.79.4.R 494.91.4.R 498.78.2.R 498.90.2.R 500.76.2.R 500.88.2.R 502.52.4.R 502.74.4.R 502.86.4.R 506.76.1.R 506.88.1.R 507.74.1.R 507.86.1.R 508.50.4.R 508.54.4.R 508.71.4.R 508.83.4.R 512.83.2.R 514.83.2.R 516.54.3.R 519.76.1.R 520.55.2.R 520.83.2.R 522.83.2.R 524.76.3.R 527.74.1.R 528.76.1.R 529.76.1.R 530.76.1.R 531.76.1.R 532.52.2.R 532.76.2.R 534.76.1.R 535.74.1.R 536.54.2.R 536.76.2.R 538.76.2.R 540.83.4.R 544.83.2.R 546.72.1.R 547.72.1.R 548.50.1.R 549.81.2.R 551.79.1.R 552.52.2.R 552.81.2.R 554.79.2.R 556.72.4.R 560.71.2.R 562.55.1.R 562.71.1.R 563.71.1.R 564.62.1.R 565.72.2.R 567.74.1.R 568.72.2.R 570.54.2.R 570.71.2.R 572.63.4.R 572.71.4.R 576.71.4.R 576.76.4.R 580.54.2.R 580.71.2.R 580.76.2.R 582.76.1.R 583.74.1.R 584.55.2.R 584.76.2.R 586.76.2.R 588.71.2.R 590.69.2.R 592.71.2.R 594.71.2.R 596.52.2.R 596.74.2.R 598.76.2.R 600.54.2.R 600.79.2.R 602.81.1.R 603.79.1.R 604.83.4.R 608.81.1.R 609.79.1.R 610.81.1.R 611.79.1.R 612.50.2.R 612.81.2.R 614.81.1.R 615.79.1.R 616.52.2.R 616.81.2.R 618.79.2.R 620.76.2.R 622.74.2.R 624.74.4.R 624.76.4.R 628.52.4.R 628.74.4.R 628.76.4.R 632.54.4.R 632.71.4.R 636.72.4.R 640.64.4.R 644.54.4.R 644.71.4.R 648.55.1.R 648.76.1.R 649.71.1.R 650.69.1.R 651.71.1.R 652.69.2.R 654.67.2.R 656.66.4.R 660.52.4.R 660.66.4.R 664.54.1.R 664.66.1.R 665.67.1.R 666.66.1.R 667.64.1.R 668.66.2.R 670.67.2.R 672.64.4.R 676.50.4.R 676.71.4.R 680.52.1.R 680.76.1.R 681.71.1.R 682.69.1.R 683.71.1.R 684.69.2.R 686.67.2.R 688.66.4.R 692.52.4.R 692.66.4.R 696.54.4.R 696.74.4.R 700.76.4.R 704.64.4.R 708.54.4.R 708.71.4.R 712.55.1.R 712.76.1.R 713.76.1.R 714.76.1.R 715.78.1.R 716.76.2.R 718.67.2.R 720.66.4.R 724.52.4.R 724.66.4.R 728.54.1.R 728.62.1.R 729.64.1.R 730.66.1.R 731.64.1.R 732.66.2.R 734.67.2.R 736.64.4.R 740.50.4.R 740.71.4.R 744.52.4.R 744.71.4.R 748.67.4.R 752.66.4.R 756.50.2.R 758.52.2.R 758.71.2.R 760.57.4.R 760.74.4.R 764.76.4.R 768.71.6.R 768.78.6.R 768.90.6.R 774.52.2.R 774.71.2.R 774.78.2.R 774.90.2.R 776.55.2.R 776.78.2.R 776.90.2.R 778.52.1.R 778.64.1.R 779.74.3.R 779.86.3.R 782.74.6.R 782.86.6.R 788.50.2.R 788.62.2.R 790.55.2.R 790.67.2.R 792.59.2.R 792.71.2.R 794.55.2.R 794.74.2.R 794.86.2.R 796.50.2.R 796.76.2.R 796.88.2.R 798.74.6.R 798.78.6.R 798.90.6.R 804.50.2.R 804.62.2.R 806.52.2.R 806.76.2.R 806.88.2.R 808.50.1.R 808.54.1.R 808.78.1.R 808.90.1.R 809.76.1.R 809.88.1.R 810.78.2.R 810.90.2.R 812.79.2.R 812.91.2.R 814.78.4.R 814.90.4.R 818.76.4.R 818.88.4.R 822.52.2.R 822.71.2.R 822.83.2.R 824.74.4.R 824.86.4.R 828.50.4.R 828.54.4.R 828.76.4.R 828.88.4.R 832.71.6.R 832.78.6.R 832.90.6.R 838.52.2.R 838.71.2.R 838.78.2.R 838.90.2.R 840.55.2.R 840.78.2.R 840.90.2.R 842.52.1.R 842.64.1.R 843.74.3.R 843.86.3.R 846.74.6.R 846.86.6.R 852.50.2.R 852.62.2.R 854.55.2.R 854.67.2.R 856.59.2.R 856.71.2.R 858.55.2.R 858.74.2.R 858.86.2.R 860.50.2.R 860.76.2.R 860.88.2.R 862.74.6.R 862.78.6.R 862.90.6.R 868.50.2.R 868.62.2.R 870.52.2.R 870.76.2.R 870.88.2.R 872.50.1.R 872.54.1.R 872.78.1.R 872.90.1.R 873.76.1.R 873.88.1.R 874.78.2.R 874.90.2.R 876.76.2.R 876.88.2.R 878.79.4.R 878.91.4.R 882.78.2.R 882.90.2.R 884.76.2.R 884.88.2.R 886.52.4.R 886.74.4.R 886.86.4.R 890.76.1.R 890.88.1.R 891.74.1.R 891.86.1.R 892.50.8.R 892.54.8.R 892.71.8.R 892.83.8.R 902.64.2.R 904.50.2.R 904.74.2.R 906.74.4.R 910.74.6.R 916.52.4.R 920.55.4.R 920.64.4.R 924.52.2.R 926.69.4.R 930.71.2.R 932.50.4.R 936.54.2.R 936.74.2.R 938.74.2.R 940.50.2.R 942.74.4.R 946.67.4.R 950.67.2.R 952.52.2.R 954.71.4.R 958.69.8.R 968.50.2.R 968.74.2.R 970.74.2.R 972.54.2.R 974.74.6.R 980.52.2.R 982.67.2.R 984.55.2.R 984.67.2.R 986.67.2.R 988.52.2.R 990.71.4.R 994.69.2.R 996.50.2.R 998.67.2.R 1000.54.2.R 1002.71.2.R 1004.50.2.R 1006.69.8.R 1016.52.6.R 1022.71.1.R 1023.69.1.R 1024.67.6.R 1024.79.6.R 1030.71.2.R 1030.83.2.R 1032.79.2.R 1032.91.2.R 1034.79.4.R 1034.91.4.R 1038.79.6.R 1038.91.6.R 1044.52.4.R 1044.55.4.R 1044.67.4.R 1048.55.4.R 1048.59.4.R 1048.76.4.R 1048.88.4.R 1052.59.2.R 1052.64.2.R 1052.76.2.R 1054.78.6.R 1054.90.6.R 1060.50.4.R 1060.54.4.R 1060.66.4.R 1064.54.2.R 1064.57.2.R 1064.79.2.R 1064.91.2.R 1066.79.2.R 1066.91.2.R 1068.57.2.R 1068.62.2.R 1068.74.2.R 1070.79.4.R 1070.91.4.R 1074.76.2.R 1074.88.2.R 1076.50.2.R 1076.62.2.R 1078.76.2.R 1078.88.2.R 1080.52.2.R 1080.55.2.R 1080.67.2.R 1082.79.2.R 1082.91.2.R 1084.55.2.R 1084.60.2.R 1084.72.2.R 1086.78.6.R 1086.90.6.R 1092.50.4.R 1092.54.4.R 1092.66.4.R 1096.54.2.R 1096.57.2.R 1096.79.2.R 1096.91.2.R 1098.79.2.R 1098.91.2.R 1100.57.2.R 1100.62.2.R 1100.74.2.R 1102.79.6.R 1102.91.6.R 1108.52.2.R 1108.55.2.R 1108.67.2.R 1110.76.2.R 1110.88.2.R 1112.55.2.R 1112.59.2.R 1112.76.2.R 1112.88.2.R 1114.76.2.R 1114.88.2.R 1116.59.2.R 1116.64.2.R 1116.76.2.R 1118.79.4.R 1118.91.4.R 1122.78.2.R 1122.90.2.R 1124.50.2.R 1124.54.2.R 1124.66.2.R 1126.76.2.R 1126.88.2.R 1128.54.2.R 1128.57.2.R 1128.69.2.R 1130.79.2.R 1130.91.2.R 1132.57.2.R 1132.62.2.R 1132.74.2.R 1134.78.6.R 1134.90.6.R 1140.50.4.R 1140.62.4.R 1144.52.4.R 1144.55.4.R 1144.67.4.R 1148.55.2.R 1148.60.2.R 1148.72.2.R 1150.79.1.R 1150.91.1.R 1151.78.1.R 1151.90.1.R 1152.76.4.R 1152.88.4.R 1156.52.2.R 1156.64.2.R 1158.71.2.R 1158.83.2.R 1160.50.4.R 1160.54.4.R 1160.74.4.R 1160.86.4.R 1164.76.4.R 1164.88.4.R 1168.71.6.R 1168.78.6.R 1168.90.6.R 1174.52.2.R 1174.71.2.R 1174.78.2.R 1174.90.2.R 1176.55.2.R 1176.78.2.R 1176.90.2.R 1178.52.1.R 1178.64.1.R 1179.74.3.R 1179.86.3.R 1182.74.6.R 1182.86.6.R 1188.50.2.R 1188.62.2.R 1190.55.2.R 1190.67.2.R 1192.59.2.R 1192.71.2.R 1194.55.2.R 1194.74.2.R 1194.86.2.R 1196.50.2.R 1196.76.2.R 1196.88.2.R 1198.74.6.R 1198.78.6.R 1198.90.6.R 1204.50.2.R 1204.62.2.R 1206.52.2.R 1206.76.2.R 1206.88.2.R 1208.50.1.R 1208.54.1.R 1208.78.1.R 1208.90.1.R 1209.76.1.R 1209.88.1.R 1210.78.2.R 1210.90.2.R 1212.79.2.R 1212.91.2.R 1214.78.4.R 1214.90.4.R 1218.76.4.R 1218.88.4.R 1222.52.2.R 1222.71.2.R 1222.83.2.R 1224.74.4.R 1224.86.4.R 1228.50.4.R 1228.54.4.R 1228.76.4.R 1228.88.4.R 1232.71.6.R 1232.78.6.R 1232.90.6.R 1238.52.2.R 1238.71.2.R 1238.78.2.R 1238.90.2.R 1240.55.2.R 1240.78.2.R 1240.90.2.R 1242.52.1.R 1242.64.1.R 1243.74.3.R 1243.86.3.R 1246.74.6.R 1246.86.6.R 1252.50.2.R 1252.62.2.R 1254.55.2.R 1254.67.2.R 1256.59.2.R 1256.71.2.R 1258.55.2.R 1258.74.2.R 1258.86.2.R 1260.50.2.R 1260.76.2.R 1260.88.2.R 1262.74.6.R 1262.78.6.R 1262.90.6.R 1268.50.2.R 1268.62.2.R 1270.52.2.R 1270.76.2.R 1270.88.2.R 1272.50.1.R 1272.54.1.R 1272.78.1.R 1272.90.1.R 1273.76.1.R 1273.88.1.R 1274.78.2.R 1274.90.2.R 1276.76.2.R 1276.88.2.R 1278.79.4.R 1278.91.4.R 1282.78.2.R 1282.90.2.R 1284.76.2.R 1284.88.2.R 1286.52.4.R 1286.74.4.R 1286.86.4.R 1290.76.1.R 1290.88.1.R 1291.74.1.R 1291.86.1.R 1292.50.4.R 1292.54.4.R 1292.71.4.R 1292.83.4.R 1296.52.4.R 1296.64.4.R 1296.71.4.R 1300.59.4.R 1304.59.4.R 1308.55.4.R 1312.54.4.R 1312.62.4.R 1312.66.4.R 1316.54.4.R 1320.54.4.R 1324.54.2.R 1326.55.2.R 1328.52.4.R 1328.64.4.R 1328.71.4.R 1332.59.4.R 1336.59.4.R 1340.55.4.R 1344.54.4.R 1344.62.4.R 1344.66.4.R 1348.54.4.R 1352.54.4.R 1356.54.2.R 1358.55.2.R 1360.52.4.R 1364.59.4.R 1368.59.4.R 1372.55.4.R 1376.54.4.R 1380.54.4.R 1384.54.4.R 1388.54.2.R 1390.55.2.R 1392.52.4.R 1396.59.4.R 1400.59.4.R 1404.55.4.R 1408.54.4.R 1412.54.4.R 1416.54.4.R 1420.54.2.R 1422.55.2.R 1424.52.2.R 1426.55.2.R 1428.59.2.R 1430.64.2.R 1432.66.2.R 1434.67.2.R 1436.66.8.R';
const WID_EASY = '0.45.16.L 16.48.16.L 32.43.16.L 48.50.16.L 64.45.16.L 80.48.16.L 96.43.16.L 112.50.16.L 128.45.16.L 144.48.16.L 160.43.16.L 176.50.16.L 192.45.16.L 208.48.16.L 224.43.16.L 240.50.16.L 0.69.2.R 2.76.2.R 4.69.2.R 6.76.2.R 8.77.2.R 10.76.2.R 12.69.2.R 14.76.2.R 16.69.2.R 18.76.2.R 20.69.2.R 22.76.2.R 24.77.2.R 26.76.2.R 28.69.2.R 30.76.2.R 32.69.2.R 34.76.2.R 36.69.2.R 38.76.2.R 40.77.2.R 42.76.2.R 44.69.2.R 46.76.2.R 48.69.2.R 50.76.2.R 52.69.2.R 54.76.2.R 56.77.2.R 58.76.2.R 60.69.2.R 62.76.2.R 64.55.2.R 64.69.2.R 66.76.2.R 68.69.2.R 70.76.2.R 72.77.2.R 74.76.2.R 76.69.2.R 78.76.2.R 80.69.2.R 82.76.2.R 84.69.2.R 86.76.2.R 88.77.2.R 90.76.2.R 92.69.2.R 94.76.2.R 96.69.2.R 98.76.2.R 100.69.2.R 102.76.2.R 104.77.2.R 106.76.2.R 108.69.2.R 110.76.2.R 112.69.2.R 114.76.2.R 116.69.2.R 118.76.2.R 120.77.2.R 122.76.2.R 124.69.2.R 126.76.2.R 130.67.2.R 130.72.2.R 130.77.2.R 132.55.2.R 134.67.2.R 134.72.2.R 134.76.2.R 136.50.2.R 136.60.2.R 136.64.2.R 136.67.2.R 138.55.4.R 142.55.4.R 142.59.4.R 142.62.4.R 142.67.4.R 146.71.8.R 146.74.8.R 146.79.8.R 154.71.4.R 154.74.4.R 154.79.4.R 158.50.2.R 158.71.2.R 158.76.2.R 158.79.2.R 160.55.4.R 164.69.6.R 164.74.6.R 164.81.6.R 170.50.2.R 172.69.4.R 172.79.4.R 176.50.4.R 180.72.2.R 180.76.2.R 182.69.2.R 184.76.2.R 186.57.2.R 186.69.2.R 188.77.2.R 190.69.2.R 192.57.2.R 192.71.2.R 194.67.2.R 194.72.2.R 196.67.6.R 196.72.6.R 202.55.2.R 202.60.2.R 202.64.2.R 204.55.4.R 208.69.2.R 210.55.2.R 210.71.2.R 212.72.2.R 214.55.2.R 216.62.4.R 216.69.4.R 220.55.6.R 220.62.6.R 220.69.6.R 226.55.2.R 228.57.2.R 230.62.4.R 234.72.2.R 236.50.2.R 236.57.2.R 238.72.2.R 240.50.2.R 242.57.2.R 242.71.2.R 244.50.2.R 246.69.4.R 246.72.4.R 250.57.4.R 250.60.4.R 254.57.2.R 254.64.2.R';
const WID_MED = '32.45.16.L 48.48.16.L 64.43.16.L 80.38.16.L 80.50.16.L 96.33.16.L 96.45.16.L 112.48.16.L 128.43.16.L 144.38.6.L 144.50.6.L 150.38.4.L 150.50.4.L 154.38.6.L 160.33.2.L 160.45.2.L 162.45.2.L 164.45.2.L 166.33.2.L 166.45.2.L 168.45.2.L 170.45.2.L 172.33.2.L 172.45.2.L 174.45.2.L 176.36.2.L 176.48.2.L 178.48.2.L 180.48.2.L 182.36.2.L 182.48.2.L 184.36.2.L 184.48.2.L 186.36.2.L 186.48.2.L 188.36.2.L 188.48.2.L 190.36.2.L 190.48.2.L 192.31.2.L 192.43.2.L 194.43.2.L 196.43.2.L 198.43.4.L 202.43.2.L 204.43.4.L 208.38.6.L 208.50.6.L 214.38.2.L 214.50.2.L 216.38.2.L 216.50.2.L 218.38.2.L 218.50.2.L 220.38.2.L 220.50.2.L 222.38.2.L 222.50.2.L 224.33.2.L 224.45.2.L 226.45.2.L 228.45.2.L 230.33.2.L 230.45.2.L 232.45.2.L 234.45.2.L 236.33.2.L 236.45.2.L 238.45.2.L 240.33.16.L 240.45.16.L 256.33.6.L 256.45.6.L 262.45.6.L 268.45.12.L 280.36.10.L 280.48.10.L 290.48.4.L 294.48.4.L 298.48.6.L 304.43.4.L 308.43.4.L 312.43.12.L 324.38.16.L 324.50.16.L 358.48.16.L 406.41.6.L 406.53.6.L 412.29.4.L 412.41.4.L 416.41.8.L 424.41.8.L 432.41.6.L 438.43.6.L 444.31.4.L 444.43.4.L 448.43.4.L 452.43.6.L 458.43.6.L 464.43.4.L 468.43.16.L 494.36.6.L 494.48.6.L 500.48.4.L 504.48.4.L 508.48.2.L 510.43.8.L 518.31.8.L 518.43.8.L 526.43.6.L 532.38.4.L 532.50.4.L 536.38.6.L 536.45.6.L 542.38.6.L 542.45.6.L 548.33.6.L 548.45.6.L 554.45.4.L 558.45.6.L 564.36.8.L 564.48.8.L 572.48.4.L 576.48.4.L 580.48.2.L 582.43.6.L 588.43.4.L 592.43.6.L 598.38.16.L 598.50.16.L 632.36.8.L 632.48.8.L 640.48.4.L 644.48.4.L 648.48.2.L 650.43.6.L 656.43.4.L 660.43.6.L 666.38.16.L 666.50.16.L 682.41.6.L 682.53.6.L 688.29.4.L 688.41.4.L 692.41.8.L 700.42.8.L 708.42.6.L 714.43.6.L 720.31.4.L 720.43.4.L 724.43.4.L 728.43.6.L 734.43.6.L 740.31.2.L 740.43.2.L 742.31.4.L 742.43.4.L 746.33.4.L 746.45.4.L 750.45.14.L 750.47.14.L 764.45.6.L 770.36.6.L 770.48.6.L 776.48.4.L 780.48.4.L 784.48.2.L 786.43.8.L 794.31.8.L 794.43.8.L 802.43.6.L 808.38.4.L 808.50.4.L 812.38.6.L 812.45.6.L 818.38.6.L 818.45.6.L 824.38.2.L 824.50.2.L 826.38.2.L 826.50.2.L 828.38.2.L 828.50.2.L 830.38.6.L 830.50.6.L 836.40.2.L 836.52.2.L 838.40.2.L 838.52.2.L 840.40.2.L 840.52.2.L 842.41.4.L 842.53.4.L 846.41.2.L 846.53.2.L 848.41.2.L 848.53.2.L 850.41.2.L 850.53.2.L 852.43.2.L 854.43.2.L 856.43.4.L 860.33.2.L 860.45.2.L 862.45.2.L 864.45.2.L 866.33.2.L 866.45.2.L 868.45.2.L 870.45.2.L 872.33.2.L 872.45.2.L 874.45.2.L 876.48.4.L 880.48.2.L 882.48.2.L 884.48.2.L 886.36.2.L 886.48.2.L 888.36.2.L 888.48.2.L 890.36.4.L 890.48.4.L 894.31.2.L 894.43.2.L 896.43.2.L 898.43.8.L 906.41.4.L 906.45.4.L 910.43.8.L 918.38.8.L 918.43.8.L 918.50.8.L 926.38.2.L 926.50.2.L 928.38.2.L 928.50.2.L 930.38.4.L 930.50.4.L 934.38.6.L 934.50.6.L 940.38.4.L 940.50.4.L 944.38.4.L 944.50.4.L 948.40.6.L 948.52.6.L 954.40.4.L 954.52.4.L 958.41.2.L 958.53.2.L 960.41.4.L 960.53.4.L 964.41.4.L 964.53.4.L 968.41.4.L 968.53.4.L 972.43.2.L 974.43.4.L 978.43.4.L 982.43.4.L 986.33.16.L 986.45.16.L 1114.38.2.L 1114.50.2.L 1116.38.2.L 1116.50.2.L 1118.38.2.L 1118.50.2.L 1120.38.2.L 1120.50.2.L 1122.38.2.L 1122.50.2.L 1124.38.2.L 1124.50.2.L 1126.38.4.L 1126.50.4.L 1130.33.4.L 1130.45.4.L 1134.45.14.L 1148.45.6.L 1154.36.6.L 1154.48.6.L 1160.48.4.L 1164.48.4.L 1168.48.2.L 1170.43.8.L 1178.31.8.L 1178.43.8.L 1186.43.6.L 1192.38.4.L 1192.50.4.L 1196.38.6.L 1196.45.6.L 1202.38.6.L 1202.45.6.L 1208.33.6.L 1208.45.6.L 1214.45.6.L 1220.45.4.L 1224.36.6.L 1224.48.6.L 1230.48.4.L 1234.48.4.L 1238.48.2.L 1240.43.6.L 1246.31.4.L 1246.43.4.L 1250.43.6.L 1256.38.16.L 1256.50.16.L 1272.33.6.L 1272.45.6.L 1278.45.6.L 1284.45.4.L 1288.36.6.L 1288.48.6.L 1294.48.4.L 1298.48.4.L 1302.48.2.L 1304.43.6.L 1310.31.4.L 1310.43.4.L 1314.43.6.L 1320.38.4.L 1320.50.4.L 1324.38.6.L 1330.26.2.L 1332.38.2.L 1332.50.2.L 1334.38.2.L 1336.33.16.L 1336.45.16.L 0.69.2.R 2.76.2.R 4.69.2.R 6.76.2.R 8.77.2.R 10.76.2.R 12.69.2.R 14.76.2.R 16.69.2.R 18.76.2.R 20.69.2.R 22.76.2.R 24.77.2.R 26.76.2.R 28.69.2.R 30.76.2.R 32.69.2.R 34.76.2.R 36.69.2.R 38.76.2.R 40.77.2.R 42.76.2.R 44.69.2.R 46.76.2.R 48.69.2.R 50.76.2.R 52.69.2.R 54.76.2.R 56.77.2.R 58.76.2.R 60.69.2.R 62.76.2.R 64.55.2.R 64.69.2.R 66.76.2.R 68.69.2.R 70.76.2.R 72.77.2.R 74.76.2.R 76.69.2.R 78.76.2.R 80.69.2.R 82.76.2.R 84.69.2.R 86.76.2.R 88.77.2.R 90.76.2.R 92.69.2.R 94.76.2.R 96.69.2.R 98.76.2.R 100.69.2.R 102.76.2.R 104.77.2.R 106.76.2.R 108.69.2.R 110.76.2.R 112.69.2.R 114.76.2.R 116.69.2.R 118.76.2.R 120.77.2.R 122.76.2.R 124.69.2.R 126.76.2.R 128.55.2.R 128.69.2.R 130.76.2.R 132.69.2.R 134.76.2.R 136.77.2.R 138.76.2.R 140.69.2.R 142.76.2.R 144.69.2.R 146.76.2.R 148.69.2.R 150.76.2.R 152.77.2.R 154.76.2.R 156.50.4.R 156.69.4.R 160.60.2.R 160.64.2.R 160.72.2.R 162.60.2.R 162.64.2.R 162.72.2.R 164.60.2.R 164.64.2.R 164.72.2.R 166.60.2.R 166.64.2.R 166.72.2.R 168.60.2.R 168.64.2.R 168.72.2.R 170.60.2.R 170.64.2.R 170.72.2.R 172.59.2.R 172.64.2.R 172.71.2.R 174.59.2.R 174.64.2.R 174.71.2.R 176.60.2.R 176.64.2.R 176.72.2.R 178.60.2.R 178.64.2.R 178.72.2.R 180.60.2.R 180.64.2.R 180.72.2.R 182.60.2.R 182.64.2.R 182.72.2.R 184.60.2.R 184.64.2.R 184.72.2.R 186.60.2.R 186.64.2.R 186.72.2.R 188.62.2.R 188.74.2.R 190.62.2.R 190.74.2.R 192.59.2.R 192.62.2.R 192.71.2.R 194.59.2.R 194.62.2.R 194.71.2.R 196.59.2.R 196.62.2.R 196.71.2.R 198.55.2.R 198.59.2.R 198.62.2.R 198.71.2.R 200.55.2.R 200.59.2.R 200.62.2.R 200.71.2.R 202.55.2.R 202.59.2.R 202.62.2.R 202.71.2.R 204.55.2.R 204.59.2.R 204.62.2.R 204.71.2.R 206.55.2.R 206.59.2.R 206.62.2.R 206.71.2.R 208.57.2.R 208.62.2.R 208.69.2.R 210.50.2.R 210.57.2.R 210.62.2.R 210.69.2.R 212.50.2.R 212.57.2.R 212.62.2.R 212.69.2.R 214.57.2.R 214.62.2.R 214.69.2.R 216.57.2.R 216.62.2.R 216.69.2.R 218.57.2.R 218.62.2.R 218.69.2.R 220.59.2.R 220.71.2.R 222.59.2.R 222.71.2.R 224.69.2.R 226.76.2.R 228.69.2.R 230.76.2.R 232.77.2.R 234.76.2.R 236.69.2.R 238.76.2.R 240.69.2.R 242.76.2.R 244.72.4.R 248.72.4.R 252.71.4.R 256.69.4.R 256.72.4.R 260.57.4.R 260.60.4.R 264.57.2.R 266.69.2.R 268.71.2.R 270.67.2.R 270.72.2.R 272.67.8.R 286.55.4.R 286.60.4.R 290.55.4.R 294.69.2.R 296.55.2.R 296.71.2.R 298.72.2.R 300.72.4.R 304.55.4.R 308.55.2.R 310.62.4.R 310.69.4.R 314.55.8.R 314.62.8.R 314.69.8.R 322.57.2.R 324.62.4.R 328.72.2.R 330.50.2.R 330.57.2.R 332.72.2.R 334.50.2.R 336.57.2.R 336.71.2.R 338.50.2.R 340.69.4.R 340.72.4.R 344.57.4.R 344.60.4.R 348.57.2.R 348.64.2.R 350.69.2.R 352.69.2.R 354.57.2.R 354.64.2.R 354.71.2.R 356.67.2.R 356.72.2.R 358.60.4.R 362.55.2.R 362.60.2.R 364.60.4.R 364.67.4.R 368.60.2.R 368.69.2.R 370.67.2.R 370.71.2.R 372.60.2.R 372.72.2.R 374.55.2.R 374.67.2.R 376.62.4.R 376.69.4.R 380.55.4.R 380.62.4.R 380.67.4.R 380.69.4.R 384.55.2.R 386.67.2.R 388.57.2.R 390.50.4.R 390.62.4.R 394.69.2.R 394.76.2.R 396.62.2.R 396.69.2.R 398.69.2.R 398.76.2.R 400.62.2.R 402.67.2.R 402.69.2.R 402.74.2.R 404.62.2.R 406.65.4.R 406.72.4.R 410.57.2.R 412.60.4.R 412.65.4.R 416.57.2.R 418.53.2.R 418.60.2.R 418.65.2.R 420.57.2.R 422.62.2.R 422.74.2.R 424.57.2.R 426.53.2.R 426.60.2.R 426.65.2.R 428.57.2.R 430.64.2.R 430.76.2.R 432.57.2.R 434.53.2.R 434.60.2.R 434.65.2.R 436.57.2.R 438.50.4.R 438.55.4.R 438.62.4.R 438.67.4.R 438.74.4.R 442.59.2.R 444.62.4.R 444.67.4.R 448.50.2.R 448.59.2.R 450.55.2.R 450.62.2.R 452.50.2.R 452.59.2.R 454.69.4.R 454.81.4.R 458.50.2.R 460.55.2.R 462.67.2.R 462.79.2.R 464.50.2.R 466.55.2.R 468.50.2.R 470.54.4.R 470.66.4.R 470.69.4.R 470.73.4.R 470.81.4.R 474.57.4.R 474.61.4.R 474.66.4.R 474.67.4.R 474.69.4.R 474.78.4.R 478.73.6.R 478.78.6.R 484.57.4.R 484.61.4.R 484.69.4.R 488.66.4.R 492.73.2.R 494.67.4.R 494.72.4.R 494.79.4.R 498.67.2.R 498.72.2.R 498.77.2.R 500.55.2.R 502.67.2.R 502.72.2.R 502.76.2.R 504.50.2.R 504.60.2.R 504.64.2.R 504.67.2.R 506.55.4.R 510.55.4.R 510.59.4.R 510.62.4.R 510.67.4.R 514.71.8.R 514.74.8.R 514.79.8.R 522.71.4.R 522.74.4.R 522.79.4.R 526.50.2.R 526.71.2.R 526.76.2.R 526.79.2.R 528.55.4.R 532.69.6.R 532.74.6.R 532.81.6.R 538.50.2.R 540.69.4.R 540.79.4.R 544.50.4.R 548.72.2.R 548.76.2.R 550.69.2.R 552.76.2.R 554.57.2.R 554.69.2.R 556.77.2.R 558.69.2.R 560.57.2.R 560.71.2.R 562.67.2.R 562.72.2.R 564.67.6.R 564.72.6.R 570.55.2.R 570.60.2.R 570.64.2.R 572.55.4.R 576.69.2.R 578.55.2.R 578.71.2.R 580.72.2.R 582.55.2.R 584.62.4.R 584.69.4.R 588.55.6.R 588.62.6.R 588.69.6.R 594.55.2.R 596.57.2.R 598.62.4.R 602.72.2.R 604.50.2.R 604.57.2.R 606.72.2.R 608.50.2.R 610.57.2.R 610.71.2.R 612.50.2.R 614.69.4.R 614.72.4.R 618.57.4.R 618.60.4.R 622.57.2.R 622.64.2.R 624.69.2.R 626.69.2.R 628.57.2.R 628.64.2.R 628.71.2.R 630.67.2.R 630.72.2.R 632.67.6.R 632.72.6.R 638.55.2.R 638.60.2.R 640.55.4.R 644.69.2.R 646.55.2.R 646.71.2.R 648.72.2.R 650.55.2.R 652.67.4.R 652.74.4.R 656.55.6.R 656.67.6.R 656.74.6.R 662.55.2.R 664.57.2.R 666.62.4.R 670.69.2.R 670.76.2.R 672.50.2.R 672.57.2.R 674.69.2.R 674.76.2.R 676.50.2.R 678.57.2.R 678.67.2.R 678.74.2.R 680.50.2.R 682.65.4.R 682.72.4.R 686.57.2.R 688.60.4.R 688.65.4.R 692.57.2.R 694.53.2.R 694.60.2.R 694.65.2.R 696.57.2.R 698.54.2.R 698.62.2.R 698.74.2.R 700.57.2.R 702.54.2.R 702.60.2.R 702.65.2.R 704.57.2.R 706.64.2.R 706.76.2.R 708.57.2.R 710.54.2.R 710.60.2.R 710.65.2.R 712.57.2.R 714.50.4.R 714.55.4.R 714.62.4.R 714.67.4.R 714.74.4.R 718.59.2.R 720.62.4.R 720.67.4.R 724.50.2.R 724.59.2.R 726.55.2.R 726.62.2.R 728.50.2.R 728.59.2.R 730.69.4.R 730.81.4.R 734.55.2.R 736.55.2.R 738.67.8.R 738.79.8.R 746.69.4.R 746.72.4.R 746.81.4.R 750.57.4.R 750.60.4.R 750.69.4.R 754.52.6.R 754.57.6.R 760.57.8.R 760.60.8.R 760.69.8.R 768.72.2.R 770.67.4.R 770.72.4.R 770.79.4.R 774.67.2.R 774.72.2.R 774.77.2.R 776.55.2.R 778.67.2.R 778.72.2.R 778.76.2.R 780.50.2.R 780.60.2.R 780.64.2.R 780.67.2.R 782.55.4.R 786.55.4.R 786.59.4.R 786.62.4.R 786.67.4.R 790.71.8.R 790.74.8.R 790.79.8.R 798.71.6.R 798.74.6.R 798.79.6.R 804.55.4.R 804.71.4.R 804.76.4.R 804.79.4.R 808.69.6.R 808.74.6.R 808.81.6.R 814.50.2.R 816.69.4.R 816.79.4.R 820.50.4.R 824.69.8.R 824.74.8.R 824.81.8.R 832.52.8.R 832.59.8.R 832.64.8.R 832.67.8.R 842.57.2.R 842.60.2.R 842.65.2.R 844.57.2.R 846.60.2.R 848.65.4.R 852.55.2.R 852.59.2.R 852.67.2.R 854.55.2.R 854.59.2.R 854.67.2.R 856.55.4.R 856.59.4.R 856.67.4.R 860.60.2.R 860.64.2.R 860.72.2.R 862.60.2.R 862.64.2.R 862.72.2.R 864.60.2.R 864.64.2.R 864.72.2.R 866.60.2.R 866.64.2.R 866.72.2.R 868.60.2.R 868.64.2.R 868.72.2.R 870.60.2.R 870.64.2.R 870.72.2.R 872.59.2.R 872.64.2.R 872.71.2.R 874.59.2.R 874.64.2.R 874.71.2.R 876.60.2.R 876.64.2.R 876.72.2.R 878.60.2.R 878.64.2.R 878.72.2.R 880.60.2.R 880.64.2.R 880.72.2.R 882.60.2.R 882.64.2.R 882.72.2.R 884.60.2.R 886.60.2.R 886.64.2.R 886.72.2.R 888.60.2.R 888.64.2.R 888.72.2.R 890.62.2.R 890.74.2.R 892.62.2.R 892.74.2.R 894.59.2.R 894.62.2.R 894.71.2.R 896.59.2.R 896.62.2.R 896.71.2.R 898.59.1.R 898.62.1.R 898.71.1.R 899.55.1.R 900.59.2.R 900.62.2.R 900.71.2.R 902.55.2.R 902.59.2.R 902.62.2.R 902.71.2.R 904.59.2.R 904.62.2.R 904.71.2.R 906.55.2.R 906.59.2.R 906.62.2.R 906.71.2.R 908.59.2.R 908.62.2.R 908.71.2.R 910.55.4.R 910.59.4.R 914.55.4.R 914.59.4.R 918.57.2.R 918.62.2.R 918.69.2.R 920.50.2.R 920.57.2.R 920.62.2.R 920.69.2.R 922.50.2.R 922.57.2.R 922.62.2.R 922.69.2.R 924.50.2.R 924.57.2.R 924.62.2.R 924.69.2.R 926.57.2.R 926.62.2.R 926.69.2.R 928.57.2.R 928.62.2.R 928.69.2.R 930.59.2.R 930.71.2.R 932.59.2.R 932.71.2.R 934.57.2.R 934.62.2.R 934.69.2.R 936.50.2.R 936.57.2.R 936.62.2.R 936.69.2.R 938.57.2.R 938.62.2.R 938.69.2.R 940.57.4.R 940.62.4.R 940.69.4.R 944.57.4.R 948.57.4.R 948.62.4.R 948.69.4.R 952.52.2.R 954.69.2.R 954.72.2.R 954.76.2.R 956.52.2.R 958.69.2.R 958.72.2.R 958.77.2.R 960.57.2.R 960.60.2.R 960.65.2.R 962.57.2.R 962.60.2.R 962.65.2.R 964.57.4.R 964.60.4.R 964.65.4.R 968.57.4.R 972.55.2.R 972.71.2.R 972.79.2.R 974.55.2.R 974.59.2.R 974.62.2.R 974.67.2.R 976.59.2.R 976.62.2.R 976.67.2.R 978.55.4.R 978.59.4.R 978.62.4.R 978.67.4.R 982.55.4.R 982.59.4.R 986.69.4.R 986.72.4.R 986.81.4.R 990.57.2.R 990.64.2.R 992.57.2.R 992.64.2.R 994.57.2.R 994.64.2.R 996.57.2.R 996.64.2.R 998.57.2.R 998.64.2.R 1000.57.2.R 1000.64.2.R 1000.72.2.R 1002.60.2.R 1002.64.2.R 1002.67.2.R 1002.79.2.R 1004.60.2.R 1004.64.2.R 1006.60.2.R 1006.64.2.R 1006.77.2.R 1008.60.2.R 1008.64.2.R 1010.60.2.R 1010.64.2.R 1010.67.2.R 1010.76.2.R 1012.60.2.R 1012.64.2.R 1014.60.2.R 1014.64.2.R 1016.60.2.R 1016.64.2.R 1018.55.2.R 1018.62.2.R 1020.55.2.R 1020.62.2.R 1022.55.2.R 1022.62.2.R 1022.74.2.R 1022.79.2.R 1024.55.2.R 1024.62.2.R 1026.55.2.R 1026.62.2.R 1026.74.2.R 1026.79.2.R 1028.55.2.R 1028.62.2.R 1030.55.2.R 1030.62.2.R 1030.76.2.R 1030.79.2.R 1032.55.2.R 1032.62.2.R 1034.50.2.R 1034.62.2.R 1034.69.2.R 1034.74.2.R 1034.81.2.R 1036.50.2.R 1036.62.2.R 1038.50.2.R 1038.62.2.R 1040.50.2.R 1040.62.2.R 1042.50.2.R 1042.62.2.R 1042.69.2.R 1042.74.2.R 1042.79.2.R 1044.52.2.R 1044.62.2.R 1046.52.2.R 1046.62.2.R 1048.52.2.R 1048.62.2.R 1050.57.2.R 1050.64.2.R 1050.69.2.R 1050.72.2.R 1050.81.2.R 1052.57.2.R 1052.64.2.R 1054.57.2.R 1054.64.2.R 1056.57.2.R 1056.64.2.R 1058.57.2.R 1058.64.2.R 1060.57.2.R 1060.64.2.R 1062.57.2.R 1062.64.2.R 1064.57.2.R 1064.64.2.R 1064.72.2.R 1066.60.2.R 1066.64.2.R 1066.67.2.R 1066.79.2.R 1068.60.2.R 1068.64.2.R 1070.60.2.R 1070.64.2.R 1070.77.2.R 1072.60.2.R 1072.64.2.R 1074.60.2.R 1074.64.2.R 1074.67.2.R 1074.76.2.R 1076.60.2.R 1076.64.2.R 1078.60.2.R 1078.64.2.R 1078.72.2.R 1078.76.2.R 1080.60.2.R 1080.64.2.R 1082.55.2.R 1082.62.2.R 1084.55.2.R 1084.62.2.R 1086.55.2.R 1086.62.2.R 1086.74.2.R 1086.79.2.R 1088.55.2.R 1088.62.2.R 1090.55.2.R 1090.62.2.R 1090.74.2.R 1090.79.2.R 1092.55.2.R 1092.62.2.R 1094.55.2.R 1094.62.2.R 1094.76.2.R 1094.79.2.R 1096.55.2.R 1096.62.2.R 1098.50.2.R 1098.62.2.R 1098.69.2.R 1098.74.2.R 1098.81.2.R 1100.50.2.R 1100.62.2.R 1102.50.2.R 1102.62.2.R 1104.50.2.R 1104.62.2.R 1106.50.2.R 1106.62.2.R 1108.50.2.R 1108.62.2.R 1110.50.4.R 1110.62.4.R 1114.69.8.R 1114.74.8.R 1114.79.8.R 1130.69.4.R 1130.72.4.R 1130.81.4.R 1134.57.4.R 1134.60.4.R 1134.69.4.R 1138.52.6.R 1138.57.6.R 1144.57.8.R 1144.60.8.R 1144.69.8.R 1152.72.2.R 1154.67.4.R 1154.72.4.R 1154.79.4.R 1158.67.2.R 1158.72.2.R 1158.77.2.R 1160.55.2.R 1162.67.4.R 1162.72.4.R 1162.76.4.R 1166.55.4.R 1166.60.4.R 1166.64.4.R 1166.67.4.R 1170.55.4.R 1170.59.4.R 1170.62.4.R 1170.67.4.R 1174.71.8.R 1174.74.8.R 1174.79.8.R 1182.71.6.R 1182.74.6.R 1182.79.6.R 1188.55.4.R 1188.71.4.R 1188.76.4.R 1188.79.4.R 1192.69.6.R 1192.74.6.R 1192.81.6.R 1198.50.2.R 1200.69.4.R 1200.79.4.R 1204.50.4.R 1208.72.2.R 1208.76.2.R 1208.81.2.R 1210.69.2.R 1212.72.2.R 1212.76.2.R 1214.69.2.R 1216.57.2.R 1216.72.2.R 1216.76.2.R 1218.69.2.R 1220.74.2.R 1222.69.2.R 1224.72.2.R 1224.76.2.R 1226.64.2.R 1228.72.2.R 1228.76.2.R 1230.55.2.R 1230.64.2.R 1232.72.2.R 1232.76.2.R 1234.67.2.R 1236.55.2.R 1236.72.2.R 1236.77.2.R 1238.67.2.R 1240.55.2.R 1240.71.2.R 1240.74.2.R 1242.62.2.R 1244.67.2.R 1244.71.2.R 1246.62.2.R 1248.67.2.R 1248.74.2.R 1250.62.2.R 1252.55.2.R 1252.67.2.R 1252.72.2.R 1254.62.2.R 1256.66.2.R 1256.69.2.R 1256.74.2.R 1258.62.2.R 1260.66.2.R 1260.69.2.R 1262.50.2.R 1262.62.2.R 1264.67.2.R 1264.74.2.R 1266.50.2.R 1266.66.2.R 1268.62.4.R 1268.69.4.R 1268.76.4.R 1272.69.2.R 1272.72.2.R 1274.64.2.R 1276.69.2.R 1276.72.2.R 1278.64.2.R 1280.57.2.R 1280.69.2.R 1280.72.2.R 1280.76.2.R 1282.64.2.R 1284.69.2.R 1284.74.2.R 1286.64.2.R 1288.67.2.R 1288.72.2.R 1288.76.2.R 1290.64.2.R 1292.67.2.R 1292.72.2.R 1294.55.2.R 1294.64.2.R 1296.72.2.R 1296.76.2.R 1298.67.2.R 1300.55.2.R 1300.72.2.R 1300.77.2.R 1302.69.2.R 1304.55.4.R 1304.71.4.R 1304.74.4.R 1308.71.4.R 1308.74.4.R 1308.79.4.R 1312.71.4.R 1312.74.4.R 1312.79.4.R 1316.55.4.R 1316.71.4.R 1316.76.4.R 1320.69.6.R 1320.74.6.R 1320.81.6.R 1326.50.2.R 1328.69.8.R 1328.74.8.R 1328.79.8.R 1336.72.2.R 1336.76.2.R 1336.81.2.R 1338.69.2.R 1340.76.2.R 1342.69.2.R 1344.77.2.R 1346.76.2.R 1348.69.2.R 1350.76.2.R 1352.69.2.R 1354.76.2.R 1356.69.2.R 1358.76.2.R 1360.77.2.R 1362.76.2.R 1364.69.2.R 1366.76.2.R 1368.69.2.R 1370.76.2.R 1372.69.2.R 1374.76.2.R 1376.77.2.R 1378.76.2.R 1380.69.2.R 1382.76.2.R 1384.69.2.R 1386.76.2.R 1388.69.2.R 1390.76.2.R 1392.77.2.R 1394.76.2.R 1396.69.2.R 1398.76.8.R';
const WID_HARD = '32.45.2.L 34.57.2.L 36.45.2.L 38.57.2.L 40.45.2.L 42.57.2.L 44.45.2.L 46.57.2.L 48.48.2.L 50.60.2.L 52.48.2.L 54.60.2.L 56.48.2.L 58.60.2.L 60.48.2.L 62.60.2.L 64.43.2.L 66.55.2.L 68.43.2.L 70.55.2.L 72.43.2.L 74.55.2.L 76.43.2.L 78.55.2.L 80.38.2.L 80.50.2.L 82.50.2.L 82.62.2.L 84.38.2.L 84.50.2.L 86.50.2.L 86.62.2.L 88.38.2.L 88.50.2.L 90.50.2.L 90.62.2.L 92.38.2.L 92.50.2.L 94.50.2.L 94.62.2.L 96.33.2.L 96.45.2.L 98.45.2.L 98.57.2.L 100.33.2.L 100.45.2.L 102.45.2.L 102.57.2.L 104.33.2.L 104.45.2.L 106.45.2.L 106.57.2.L 108.33.2.L 108.45.2.L 110.45.2.L 110.57.2.L 112.48.2.L 114.60.2.L 116.48.2.L 118.60.2.L 120.48.2.L 122.60.2.L 124.48.2.L 126.60.2.L 128.43.2.L 130.55.2.L 132.43.2.L 134.55.2.L 136.43.2.L 138.55.2.L 140.43.2.L 142.55.2.L 144.38.6.L 144.50.6.L 150.38.4.L 150.50.4.L 154.38.6.L 160.33.2.L 160.45.2.L 162.45.2.L 164.45.2.L 166.33.2.L 166.45.2.L 168.45.2.L 170.45.2.L 172.33.2.L 172.45.2.L 174.45.2.L 176.36.2.L 176.48.2.L 178.48.2.L 180.48.2.L 182.36.2.L 182.48.2.L 184.36.2.L 184.48.2.L 186.36.2.L 186.48.2.L 188.36.2.L 188.48.2.L 190.36.2.L 190.48.2.L 192.31.2.L 192.43.2.L 194.43.2.L 196.43.2.L 198.43.4.L 202.43.2.L 204.43.4.L 208.38.6.L 208.50.6.L 214.38.2.L 214.50.2.L 216.38.2.L 216.50.2.L 218.38.2.L 218.50.2.L 220.38.2.L 220.50.2.L 222.38.2.L 222.50.2.L 224.33.2.L 224.45.2.L 226.45.2.L 228.45.2.L 230.33.2.L 230.45.2.L 232.45.2.L 234.45.2.L 236.33.2.L 236.45.2.L 238.45.2.L 240.33.2.L 240.45.2.L 242.45.2.L 242.57.2.L 244.33.2.L 244.45.2.L 246.45.2.L 246.57.2.L 248.33.2.L 248.45.2.L 250.45.2.L 250.57.2.L 252.33.2.L 252.45.2.L 254.45.2.L 254.57.2.L 256.33.6.L 256.45.6.L 262.45.6.L 268.45.2.L 270.57.2.L 272.45.2.L 274.57.2.L 276.45.2.L 278.57.2.L 280.36.2.L 280.48.2.L 282.48.2.L 282.60.2.L 284.36.2.L 284.48.2.L 286.48.2.L 286.60.2.L 288.36.2.L 288.48.2.L 290.48.4.L 294.48.4.L 298.48.6.L 304.43.4.L 308.43.4.L 312.43.2.L 314.55.2.L 316.43.2.L 318.55.2.L 320.43.2.L 322.55.2.L 324.38.2.L 324.50.2.L 326.50.2.L 326.62.2.L 328.38.2.L 328.50.2.L 330.50.2.L 330.62.2.L 332.38.2.L 332.50.2.L 334.50.2.L 334.62.2.L 336.38.2.L 336.50.2.L 338.50.2.L 338.62.2.L 358.48.2.L 360.60.2.L 362.48.2.L 364.60.2.L 366.48.2.L 368.60.2.L 370.48.2.L 372.60.2.L 406.41.6.L 406.53.6.L 412.29.4.L 412.41.4.L 416.41.2.L 418.53.2.L 420.41.2.L 422.53.2.L 424.41.2.L 426.53.2.L 428.41.2.L 430.53.2.L 432.41.6.L 438.43.6.L 444.31.4.L 444.43.4.L 448.43.4.L 452.43.6.L 458.43.6.L 464.43.4.L 468.43.2.L 470.55.2.L 472.43.2.L 474.55.2.L 476.43.2.L 478.55.2.L 480.43.2.L 482.55.2.L 494.36.6.L 494.48.6.L 500.48.4.L 504.48.4.L 508.48.2.L 510.43.2.L 512.55.2.L 514.43.2.L 516.55.2.L 518.31.2.L 518.43.2.L 520.43.2.L 520.55.2.L 522.31.2.L 522.43.2.L 524.43.2.L 524.55.2.L 526.43.6.L 532.38.4.L 532.50.4.L 536.38.6.L 536.45.6.L 542.38.6.L 542.45.6.L 548.33.6.L 548.45.6.L 554.45.4.L 558.45.6.L 564.36.2.L 564.48.2.L 566.48.2.L 566.60.2.L 568.36.2.L 568.48.2.L 570.48.2.L 570.60.2.L 572.48.4.L 576.48.4.L 580.48.2.L 582.43.6.L 588.43.4.L 592.43.6.L 598.38.2.L 598.50.2.L 600.50.2.L 600.62.2.L 602.38.2.L 602.50.2.L 604.50.2.L 604.62.2.L 606.38.2.L 606.50.2.L 608.50.2.L 608.62.2.L 610.38.2.L 610.50.2.L 612.50.2.L 612.62.2.L 632.36.2.L 632.48.2.L 634.48.2.L 634.60.2.L 636.36.2.L 636.48.2.L 638.48.2.L 638.60.2.L 640.48.4.L 644.48.4.L 648.48.2.L 650.43.6.L 656.43.4.L 660.43.6.L 666.38.2.L 666.50.2.L 668.50.2.L 668.62.2.L 670.38.2.L 670.50.2.L 672.50.2.L 672.62.2.L 674.38.2.L 674.50.2.L 676.50.2.L 676.62.2.L 678.38.2.L 678.50.2.L 680.50.2.L 680.62.2.L 682.41.6.L 682.53.6.L 688.29.4.L 688.41.4.L 692.41.2.L 694.53.2.L 696.41.2.L 698.53.2.L 700.42.2.L 702.54.2.L 704.42.2.L 706.54.2.L 708.42.6.L 714.43.6.L 720.31.4.L 720.43.4.L 724.43.4.L 728.43.6.L 734.43.6.L 740.31.2.L 740.43.2.L 742.31.4.L 742.43.4.L 746.33.4.L 746.45.4.L 750.45.2.L 750.47.2.L 752.57.2.L 752.59.2.L 754.45.2.L 754.47.2.L 756.57.2.L 756.59.2.L 758.45.2.L 758.47.2.L 760.57.2.L 760.59.2.L 762.45.2.L 762.47.2.L 764.45.6.L 770.36.6.L 770.48.6.L 776.48.4.L 780.48.4.L 784.48.2.L 786.43.2.L 788.55.2.L 790.43.2.L 792.55.2.L 794.31.2.L 794.43.2.L 796.43.2.L 796.55.2.L 798.31.2.L 798.43.2.L 800.43.2.L 800.55.2.L 802.43.6.L 808.38.4.L 808.50.4.L 812.38.6.L 812.45.6.L 818.38.6.L 818.45.6.L 824.38.2.L 824.50.2.L 826.38.2.L 826.50.2.L 828.38.2.L 828.50.2.L 830.38.6.L 830.50.6.L 836.40.2.L 836.52.2.L 838.40.2.L 838.52.2.L 840.40.2.L 840.52.2.L 842.41.4.L 842.53.4.L 846.41.2.L 846.53.2.L 848.41.2.L 848.53.2.L 850.41.2.L 850.53.2.L 852.43.2.L 854.43.2.L 856.43.4.L 860.33.2.L 860.45.2.L 862.45.2.L 864.45.2.L 866.33.2.L 866.45.2.L 868.45.2.L 870.45.2.L 872.33.2.L 872.45.2.L 874.45.2.L 876.48.4.L 880.48.2.L 882.48.2.L 884.48.2.L 886.36.2.L 886.48.2.L 888.36.2.L 888.48.2.L 890.36.4.L 890.48.4.L 894.31.2.L 894.43.2.L 896.43.2.L 898.43.2.L 900.55.2.L 902.43.2.L 904.55.2.L 906.41.4.L 906.45.4.L 910.43.2.L 912.55.2.L 914.43.2.L 916.55.2.L 918.38.2.L 918.43.2.L 918.50.2.L 920.50.2.L 920.55.2.L 920.62.2.L 922.38.2.L 922.43.2.L 922.50.2.L 924.50.2.L 924.55.2.L 924.62.2.L 926.38.2.L 926.50.2.L 928.38.2.L 928.50.2.L 930.38.4.L 930.50.4.L 934.38.6.L 934.50.6.L 940.38.4.L 940.50.4.L 944.38.4.L 944.50.4.L 948.40.6.L 948.52.6.L 954.40.4.L 954.52.4.L 958.41.2.L 958.53.2.L 960.41.4.L 960.53.4.L 964.41.4.L 964.53.4.L 968.41.4.L 968.53.4.L 972.43.2.L 974.43.4.L 978.43.4.L 982.43.4.L 986.33.2.L 986.45.2.L 988.45.2.L 988.57.2.L 990.33.2.L 990.45.2.L 992.45.2.L 992.57.2.L 994.33.2.L 994.45.2.L 996.45.2.L 996.57.2.L 998.33.2.L 998.45.2.L 1000.45.2.L 1000.57.2.L 1114.38.2.L 1114.50.2.L 1116.38.2.L 1116.50.2.L 1118.38.2.L 1118.50.2.L 1120.38.2.L 1120.50.2.L 1122.38.2.L 1122.50.2.L 1124.38.2.L 1124.50.2.L 1126.38.4.L 1126.50.4.L 1130.33.4.L 1130.45.4.L 1134.45.2.L 1136.57.2.L 1138.45.2.L 1140.57.2.L 1142.45.2.L 1144.57.2.L 1146.45.2.L 1148.45.6.L 1154.36.6.L 1154.48.6.L 1160.48.4.L 1164.48.4.L 1168.48.2.L 1170.43.2.L 1172.55.2.L 1174.43.2.L 1176.55.2.L 1178.31.2.L 1178.43.2.L 1180.43.2.L 1180.55.2.L 1182.31.2.L 1182.43.2.L 1184.43.2.L 1184.55.2.L 1186.43.6.L 1192.38.4.L 1192.50.4.L 1196.38.6.L 1196.45.6.L 1202.38.6.L 1202.45.6.L 1208.33.6.L 1208.45.6.L 1214.45.6.L 1220.45.4.L 1224.36.6.L 1224.48.6.L 1230.48.4.L 1234.48.4.L 1238.48.2.L 1240.43.6.L 1246.31.4.L 1246.43.4.L 1250.43.6.L 1256.38.2.L 1256.50.2.L 1258.50.2.L 1258.62.2.L 1260.38.2.L 1260.50.2.L 1262.50.2.L 1262.62.2.L 1264.38.2.L 1264.50.2.L 1266.50.2.L 1266.62.2.L 1268.38.2.L 1268.50.2.L 1270.50.2.L 1270.62.2.L 1272.33.6.L 1272.45.6.L 1278.45.6.L 1284.45.4.L 1288.36.6.L 1288.48.6.L 1294.48.4.L 1298.48.4.L 1302.48.2.L 1304.43.6.L 1310.31.4.L 1310.43.4.L 1314.43.6.L 1320.38.4.L 1320.50.4.L 1324.38.6.L 1330.26.2.L 1332.38.2.L 1332.50.2.L 1334.38.2.L 1336.33.2.L 1336.45.2.L 1338.45.2.L 1338.57.2.L 1340.33.2.L 1340.45.2.L 1342.45.2.L 1342.57.2.L 1344.33.2.L 1344.45.2.L 1346.45.2.L 1346.57.2.L 1348.33.2.L 1348.45.2.L 1350.45.2.L 1350.57.2.L 0.69.2.R 2.76.2.R 4.69.2.R 6.76.2.R 8.77.2.R 10.76.2.R 12.69.2.R 14.76.2.R 16.69.2.R 18.76.2.R 20.69.2.R 22.76.2.R 24.77.2.R 26.76.2.R 28.69.2.R 30.76.2.R 32.69.2.R 34.76.2.R 36.69.2.R 38.76.2.R 40.77.2.R 42.76.2.R 44.69.2.R 46.76.2.R 48.69.2.R 50.76.2.R 52.69.2.R 54.76.2.R 56.77.2.R 58.76.2.R 60.69.2.R 62.76.2.R 64.55.2.R 64.69.2.R 66.76.2.R 68.69.2.R 70.76.2.R 72.77.2.R 74.76.2.R 76.69.2.R 78.76.2.R 80.69.2.R 82.76.2.R 84.69.2.R 86.76.2.R 88.77.2.R 90.76.2.R 92.69.2.R 94.76.2.R 96.69.2.R 98.76.2.R 100.69.2.R 102.76.2.R 104.77.2.R 106.76.2.R 108.69.2.R 110.76.2.R 112.69.2.R 114.76.2.R 116.69.2.R 118.76.2.R 120.77.2.R 122.76.2.R 124.69.2.R 126.76.2.R 128.55.2.R 128.69.2.R 130.76.2.R 132.69.2.R 134.76.2.R 136.77.2.R 138.76.2.R 140.69.2.R 142.76.2.R 144.69.2.R 146.76.2.R 148.69.2.R 150.76.2.R 152.77.2.R 154.76.2.R 156.50.4.R 156.69.4.R 160.60.2.R 160.64.2.R 160.72.2.R 160.84.2.R 162.60.2.R 162.64.2.R 162.72.2.R 162.84.2.R 164.60.2.R 164.64.2.R 164.72.2.R 164.84.2.R 166.60.2.R 166.64.2.R 166.72.2.R 166.84.2.R 168.60.2.R 168.64.2.R 168.72.2.R 168.84.2.R 170.60.2.R 170.64.2.R 170.72.2.R 170.84.2.R 172.59.2.R 172.64.2.R 172.71.2.R 172.83.2.R 174.59.2.R 174.64.2.R 174.71.2.R 174.83.2.R 176.60.2.R 176.64.2.R 176.72.2.R 176.84.2.R 178.60.2.R 178.64.2.R 178.72.2.R 178.84.2.R 180.60.2.R 180.64.2.R 180.72.2.R 180.84.2.R 182.60.2.R 182.64.2.R 182.72.2.R 182.84.2.R 184.60.2.R 184.64.2.R 184.72.2.R 184.84.2.R 186.60.2.R 186.64.2.R 186.72.2.R 186.84.2.R 188.62.2.R 188.74.2.R 188.86.2.R 190.62.2.R 190.74.2.R 190.86.2.R 192.59.2.R 192.62.2.R 192.71.2.R 192.83.2.R 194.59.2.R 194.62.2.R 194.71.2.R 194.83.2.R 196.59.2.R 196.62.2.R 196.71.2.R 196.83.2.R 198.55.2.R 198.59.2.R 198.62.2.R 198.71.2.R 198.83.2.R 200.55.2.R 200.59.2.R 200.62.2.R 200.71.2.R 200.83.2.R 202.55.2.R 202.59.2.R 202.62.2.R 202.71.2.R 202.83.2.R 204.55.2.R 204.59.2.R 204.62.2.R 204.71.2.R 204.83.2.R 206.55.2.R 206.59.2.R 206.62.2.R 206.71.2.R 206.83.2.R 208.57.2.R 208.62.2.R 208.69.2.R 208.81.2.R 210.50.2.R 210.57.2.R 210.62.2.R 210.69.2.R 210.81.2.R 212.50.2.R 212.57.2.R 212.62.2.R 212.69.2.R 212.81.2.R 214.57.2.R 214.62.2.R 214.69.2.R 214.81.2.R 216.57.2.R 216.62.2.R 216.69.2.R 216.81.2.R 218.57.2.R 218.62.2.R 218.69.2.R 218.81.2.R 220.59.2.R 220.71.2.R 220.83.2.R 222.59.2.R 222.71.2.R 222.83.2.R 224.69.2.R 224.81.2.R 226.76.2.R 226.88.2.R 228.69.2.R 228.81.2.R 230.76.2.R 230.88.2.R 232.77.2.R 232.89.2.R 234.76.2.R 234.88.2.R 236.69.2.R 236.81.2.R 238.76.2.R 238.88.2.R 240.69.2.R 242.76.2.R 244.72.4.R 248.72.4.R 252.71.4.R 256.69.4.R 256.72.4.R 260.57.4.R 260.60.4.R 264.57.2.R 266.69.2.R 268.71.2.R 270.67.2.R 270.72.2.R 272.67.8.R 286.55.4.R 286.60.4.R 290.55.4.R 294.69.2.R 296.55.2.R 296.71.2.R 298.72.2.R 300.72.4.R 304.55.4.R 308.55.2.R 310.62.4.R 310.69.4.R 314.55.8.R 314.62.8.R 314.69.8.R 322.57.2.R 324.62.4.R 328.72.2.R 330.50.2.R 330.57.2.R 332.72.2.R 334.50.2.R 336.57.2.R 336.71.2.R 338.50.2.R 340.69.4.R 340.72.4.R 344.57.4.R 344.60.4.R 348.57.2.R 348.64.2.R 350.69.2.R 352.69.2.R 354.57.2.R 354.64.2.R 354.71.2.R 356.67.2.R 356.72.2.R 358.60.4.R 362.55.2.R 362.60.2.R 364.60.4.R 364.67.4.R 368.60.2.R 368.69.2.R 370.67.2.R 370.71.2.R 372.60.2.R 372.72.2.R 374.55.2.R 374.67.2.R 376.62.4.R 376.69.4.R 380.55.4.R 380.62.4.R 380.67.4.R 380.69.4.R 384.55.2.R 386.67.2.R 388.57.2.R 390.50.4.R 390.62.4.R 394.69.2.R 394.76.2.R 396.62.2.R 396.69.2.R 398.69.2.R 398.76.2.R 400.62.2.R 402.67.2.R 402.69.2.R 402.74.2.R 404.62.2.R 406.65.4.R 406.72.4.R 410.57.2.R 412.60.4.R 412.65.4.R 416.57.2.R 418.53.2.R 418.60.2.R 418.65.2.R 420.57.2.R 422.62.2.R 422.74.2.R 424.57.2.R 426.53.2.R 426.60.2.R 426.65.2.R 428.57.2.R 430.64.2.R 430.76.2.R 432.57.2.R 434.53.2.R 434.60.2.R 434.65.2.R 436.57.2.R 438.50.4.R 438.55.4.R 438.62.4.R 438.67.4.R 438.74.4.R 442.59.2.R 444.62.4.R 444.67.4.R 448.50.2.R 448.59.2.R 450.55.2.R 450.62.2.R 452.50.2.R 452.59.2.R 454.69.4.R 454.81.4.R 458.50.2.R 460.55.2.R 462.67.2.R 462.79.2.R 464.50.2.R 466.55.2.R 468.50.2.R 470.54.4.R 470.66.4.R 470.69.4.R 470.73.4.R 470.81.4.R 474.57.4.R 474.61.4.R 474.66.4.R 474.67.4.R 474.69.4.R 474.78.4.R 478.73.6.R 478.78.6.R 484.57.4.R 484.61.4.R 484.69.4.R 488.66.4.R 492.73.2.R 494.67.4.R 494.72.4.R 494.79.4.R 498.67.2.R 498.72.2.R 498.77.2.R 500.55.2.R 502.67.2.R 502.72.2.R 502.76.2.R 504.50.2.R 504.60.2.R 504.64.2.R 504.67.2.R 506.55.4.R 510.55.4.R 510.59.4.R 510.62.4.R 510.67.4.R 514.71.8.R 514.74.8.R 514.79.8.R 522.71.4.R 522.74.4.R 522.79.4.R 526.50.2.R 526.71.2.R 526.76.2.R 526.79.2.R 528.55.4.R 532.69.6.R 532.74.6.R 532.81.6.R 538.50.2.R 540.69.4.R 540.79.4.R 544.50.4.R 548.72.2.R 548.76.2.R 550.69.2.R 552.76.2.R 554.57.2.R 554.69.2.R 556.77.2.R 558.69.2.R 560.57.2.R 560.71.2.R 562.67.2.R 562.72.2.R 564.67.6.R 564.72.6.R 570.55.2.R 570.60.2.R 570.64.2.R 572.55.4.R 576.69.2.R 578.55.2.R 578.71.2.R 580.72.2.R 582.55.2.R 584.62.4.R 584.69.4.R 588.55.6.R 588.62.6.R 588.69.6.R 594.55.2.R 596.57.2.R 598.62.4.R 602.72.2.R 604.50.2.R 604.57.2.R 606.72.2.R 608.50.2.R 610.57.2.R 610.71.2.R 612.50.2.R 614.69.4.R 614.72.4.R 618.57.4.R 618.60.4.R 622.57.2.R 622.64.2.R 624.69.2.R 626.69.2.R 628.57.2.R 628.64.2.R 628.71.2.R 630.67.2.R 630.72.2.R 632.67.6.R 632.72.6.R 638.55.2.R 638.60.2.R 640.55.4.R 644.69.2.R 646.55.2.R 646.71.2.R 648.72.2.R 650.55.2.R 652.67.4.R 652.74.4.R 656.55.6.R 656.67.6.R 656.74.6.R 662.55.2.R 664.57.2.R 666.62.4.R 670.69.2.R 670.76.2.R 672.50.2.R 672.57.2.R 674.69.2.R 674.76.2.R 676.50.2.R 678.57.2.R 678.67.2.R 678.74.2.R 680.50.2.R 682.65.4.R 682.72.4.R 686.57.2.R 688.60.4.R 688.65.4.R 692.57.2.R 694.53.2.R 694.60.2.R 694.65.2.R 696.57.2.R 698.54.2.R 698.62.2.R 698.74.2.R 700.57.2.R 702.54.2.R 702.60.2.R 702.65.2.R 704.57.2.R 706.64.2.R 706.76.2.R 708.57.2.R 710.54.2.R 710.60.2.R 710.65.2.R 712.57.2.R 714.50.4.R 714.55.4.R 714.62.4.R 714.67.4.R 714.74.4.R 718.59.2.R 720.62.4.R 720.67.4.R 724.50.2.R 724.59.2.R 726.55.2.R 726.62.2.R 728.50.2.R 728.59.2.R 730.69.4.R 730.81.4.R 734.55.2.R 736.55.2.R 738.67.8.R 738.79.8.R 746.69.4.R 746.72.4.R 746.81.4.R 750.57.4.R 750.60.4.R 750.69.4.R 754.52.6.R 754.57.6.R 760.57.8.R 760.60.8.R 760.69.8.R 768.72.2.R 770.67.4.R 770.72.4.R 770.79.4.R 774.67.2.R 774.72.2.R 774.77.2.R 776.55.2.R 778.67.2.R 778.72.2.R 778.76.2.R 780.50.2.R 780.60.2.R 780.64.2.R 780.67.2.R 782.55.4.R 786.55.4.R 786.59.4.R 786.62.4.R 786.67.4.R 790.71.8.R 790.74.8.R 790.79.8.R 798.71.6.R 798.74.6.R 798.79.6.R 804.55.4.R 804.71.4.R 804.76.4.R 804.79.4.R 808.69.6.R 808.74.6.R 808.81.6.R 814.50.2.R 816.69.4.R 816.79.4.R 820.50.4.R 824.69.8.R 824.74.8.R 824.81.8.R 832.52.8.R 832.59.8.R 832.64.8.R 832.67.8.R 842.57.2.R 842.60.2.R 842.65.2.R 844.57.2.R 846.60.2.R 848.65.4.R 848.77.4.R 852.55.2.R 852.59.2.R 852.67.2.R 852.79.2.R 854.55.2.R 854.59.2.R 854.67.2.R 854.79.2.R 856.55.4.R 856.59.4.R 856.67.4.R 856.79.4.R 860.60.2.R 860.64.2.R 860.72.2.R 860.84.2.R 862.60.2.R 862.64.2.R 862.72.2.R 862.84.2.R 864.60.2.R 864.64.2.R 864.72.2.R 864.84.2.R 866.60.2.R 866.64.2.R 866.72.2.R 866.84.2.R 868.60.2.R 868.64.2.R 868.72.2.R 868.84.2.R 870.60.2.R 870.64.2.R 870.72.2.R 870.84.2.R 872.59.2.R 872.64.2.R 872.71.2.R 872.83.2.R 874.59.2.R 874.64.2.R 874.71.2.R 874.83.2.R 876.60.2.R 876.64.2.R 876.72.2.R 876.84.2.R 878.60.2.R 878.64.2.R 878.72.2.R 878.84.2.R 880.60.2.R 880.64.2.R 880.72.2.R 880.84.2.R 882.60.2.R 882.64.2.R 882.72.2.R 882.84.2.R 884.60.2.R 884.72.2.R 886.60.2.R 886.64.2.R 886.72.2.R 886.84.2.R 888.60.2.R 888.64.2.R 888.72.2.R 888.84.2.R 890.62.2.R 890.74.2.R 890.86.2.R 892.62.2.R 892.74.2.R 892.86.2.R 894.59.2.R 894.62.2.R 894.71.2.R 894.83.2.R 896.59.2.R 896.62.2.R 896.71.2.R 896.83.2.R 898.59.1.R 898.62.1.R 898.71.1.R 898.83.1.R 899.55.1.R 899.67.1.R 900.59.2.R 900.62.2.R 900.71.2.R 900.83.2.R 902.55.2.R 902.59.2.R 902.62.2.R 902.71.2.R 902.83.2.R 904.59.2.R 904.62.2.R 904.71.2.R 904.83.2.R 906.55.2.R 906.59.2.R 906.62.2.R 906.71.2.R 906.83.2.R 908.59.2.R 908.62.2.R 908.71.2.R 908.83.2.R 910.55.4.R 910.59.4.R 910.71.4.R 914.55.4.R 914.59.4.R 914.71.4.R 918.57.2.R 918.62.2.R 918.69.2.R 918.81.2.R 920.50.2.R 920.57.2.R 920.62.2.R 920.69.2.R 920.81.2.R 922.50.2.R 922.57.2.R 922.62.2.R 922.69.2.R 922.81.2.R 924.50.2.R 924.57.2.R 924.62.2.R 924.69.2.R 924.81.2.R 926.57.2.R 926.62.2.R 926.69.2.R 926.81.2.R 928.57.2.R 928.62.2.R 928.69.2.R 928.81.2.R 930.59.2.R 930.71.2.R 930.83.2.R 932.59.2.R 932.71.2.R 932.83.2.R 934.57.2.R 934.62.2.R 934.69.2.R 934.81.2.R 936.50.2.R 936.57.2.R 936.62.2.R 936.69.2.R 936.81.2.R 938.57.2.R 938.62.2.R 938.69.2.R 938.81.2.R 940.57.4.R 940.62.4.R 940.69.4.R 940.81.4.R 944.57.4.R 944.69.4.R 948.57.4.R 948.62.4.R 948.69.4.R 948.81.4.R 952.52.2.R 952.64.2.R 954.69.2.R 954.72.2.R 954.76.2.R 954.88.2.R 956.52.2.R 956.64.2.R 958.69.2.R 958.72.2.R 958.77.2.R 958.89.2.R 960.57.2.R 960.60.2.R 960.65.2.R 960.77.2.R 962.57.2.R 962.60.2.R 962.65.2.R 962.77.2.R 964.57.4.R 964.60.4.R 964.65.4.R 964.77.4.R 968.57.4.R 968.69.4.R 972.55.2.R 972.71.2.R 972.79.2.R 972.91.2.R 974.55.2.R 974.59.2.R 974.62.2.R 974.67.2.R 974.79.2.R 976.59.2.R 976.62.2.R 976.67.2.R 976.79.2.R 978.55.4.R 978.59.4.R 978.62.4.R 978.67.4.R 978.79.4.R 982.55.4.R 982.59.4.R 982.71.4.R 986.69.4.R 986.72.4.R 986.81.4.R 986.93.4.R 990.57.2.R 990.64.2.R 990.76.2.R 992.57.2.R 992.64.2.R 992.76.2.R 994.57.2.R 994.64.2.R 994.76.2.R 996.57.2.R 996.64.2.R 996.76.2.R 998.57.2.R 998.64.2.R 998.76.2.R 1000.57.2.R 1000.64.2.R 1000.72.2.R 1000.84.2.R 1002.60.2.R 1002.64.2.R 1002.67.2.R 1002.79.2.R 1002.91.2.R 1004.60.2.R 1004.64.2.R 1004.76.2.R 1006.60.2.R 1006.64.2.R 1006.77.2.R 1006.89.2.R 1008.60.2.R 1008.64.2.R 1008.76.2.R 1010.60.2.R 1010.64.2.R 1010.67.2.R 1010.76.2.R 1010.88.2.R 1012.60.2.R 1012.64.2.R 1012.76.2.R 1014.60.2.R 1014.64.2.R 1014.76.2.R 1016.60.2.R 1016.64.2.R 1016.76.2.R 1018.55.2.R 1018.62.2.R 1018.74.2.R 1020.55.2.R 1020.62.2.R 1020.74.2.R 1022.55.2.R 1022.62.2.R 1022.74.2.R 1022.79.2.R 1022.91.2.R 1024.55.2.R 1024.62.2.R 1024.74.2.R 1026.55.2.R 1026.62.2.R 1026.74.2.R 1026.79.2.R 1026.91.2.R 1028.55.2.R 1028.62.2.R 1028.74.2.R 1030.55.2.R 1030.62.2.R 1030.76.2.R 1030.79.2.R 1030.91.2.R 1032.55.2.R 1032.62.2.R 1032.74.2.R 1034.50.2.R 1034.62.2.R 1034.69.2.R 1034.74.2.R 1034.81.2.R 1034.93.2.R 1036.50.2.R 1036.62.2.R 1036.74.2.R 1038.50.2.R 1038.62.2.R 1038.74.2.R 1040.50.2.R 1040.62.2.R 1040.74.2.R 1042.50.2.R 1042.62.2.R 1042.69.2.R 1042.74.2.R 1042.79.2.R 1042.91.2.R 1044.52.2.R 1044.62.2.R 1044.74.2.R 1046.52.2.R 1046.62.2.R 1046.74.2.R 1048.52.2.R 1048.62.2.R 1048.74.2.R 1050.57.2.R 1050.64.2.R 1050.69.2.R 1050.72.2.R 1050.81.2.R 1050.93.2.R 1052.57.2.R 1052.64.2.R 1052.76.2.R 1054.57.2.R 1054.64.2.R 1054.76.2.R 1056.57.2.R 1056.64.2.R 1056.76.2.R 1058.57.2.R 1058.64.2.R 1058.76.2.R 1060.57.2.R 1060.64.2.R 1060.76.2.R 1062.57.2.R 1062.64.2.R 1062.76.2.R 1064.57.2.R 1064.64.2.R 1064.72.2.R 1064.84.2.R 1066.60.2.R 1066.64.2.R 1066.67.2.R 1066.79.2.R 1066.91.2.R 1068.60.2.R 1068.64.2.R 1068.76.2.R 1070.60.2.R 1070.64.2.R 1070.77.2.R 1070.89.2.R 1072.60.2.R 1072.64.2.R 1072.76.2.R 1074.60.2.R 1074.64.2.R 1074.67.2.R 1074.76.2.R 1074.88.2.R 1076.60.2.R 1076.64.2.R 1076.76.2.R 1078.60.2.R 1078.64.2.R 1078.72.2.R 1078.76.2.R 1078.88.2.R 1080.60.2.R 1080.64.2.R 1080.76.2.R 1082.55.2.R 1082.62.2.R 1082.74.2.R 1084.55.2.R 1084.62.2.R 1084.74.2.R 1086.55.2.R 1086.62.2.R 1086.74.2.R 1086.79.2.R 1086.91.2.R 1088.55.2.R 1088.62.2.R 1088.74.2.R 1090.55.2.R 1090.62.2.R 1090.74.2.R 1090.79.2.R 1090.91.2.R 1092.55.2.R 1092.62.2.R 1092.74.2.R 1094.55.2.R 1094.62.2.R 1094.76.2.R 1094.79.2.R 1094.91.2.R 1096.55.2.R 1096.62.2.R 1096.74.2.R 1098.50.2.R 1098.62.2.R 1098.69.2.R 1098.74.2.R 1098.81.2.R 1098.93.2.R 1100.50.2.R 1100.62.2.R 1100.74.2.R 1102.50.2.R 1102.62.2.R 1102.74.2.R 1104.50.2.R 1104.62.2.R 1104.74.2.R 1106.50.2.R 1106.62.2.R 1106.74.2.R 1108.50.2.R 1108.62.2.R 1108.74.2.R 1110.50.4.R 1110.62.4.R 1110.74.4.R 1114.69.8.R 1114.74.8.R 1114.79.8.R 1114.91.8.R 1130.69.4.R 1130.72.4.R 1130.81.4.R 1130.93.4.R 1134.57.4.R 1134.60.4.R 1134.69.4.R 1134.81.4.R 1138.52.6.R 1138.57.6.R 1144.57.8.R 1144.60.8.R 1144.69.8.R 1152.72.2.R 1154.67.4.R 1154.72.4.R 1154.79.4.R 1158.67.2.R 1158.72.2.R 1158.77.2.R 1160.55.2.R 1162.67.4.R 1162.72.4.R 1162.76.4.R 1166.55.4.R 1166.60.4.R 1166.64.4.R 1166.67.4.R 1170.55.4.R 1170.59.4.R 1170.62.4.R 1170.67.4.R 1174.71.8.R 1174.74.8.R 1174.79.8.R 1182.71.6.R 1182.74.6.R 1182.79.6.R 1188.55.4.R 1188.71.4.R 1188.76.4.R 1188.79.4.R 1192.69.6.R 1192.74.6.R 1192.81.6.R 1198.50.2.R 1200.69.4.R 1200.79.4.R 1204.50.4.R 1208.72.2.R 1208.76.2.R 1208.81.2.R 1210.69.2.R 1212.72.2.R 1212.76.2.R 1214.69.2.R 1216.57.2.R 1216.72.2.R 1216.76.2.R 1218.69.2.R 1220.74.2.R 1222.69.2.R 1224.72.2.R 1224.76.2.R 1226.64.2.R 1228.72.2.R 1228.76.2.R 1230.55.2.R 1230.64.2.R 1232.72.2.R 1232.76.2.R 1234.67.2.R 1236.55.2.R 1236.72.2.R 1236.77.2.R 1238.67.2.R 1240.55.2.R 1240.71.2.R 1240.74.2.R 1242.62.2.R 1244.67.2.R 1244.71.2.R 1246.62.2.R 1248.67.2.R 1248.74.2.R 1250.62.2.R 1252.55.2.R 1252.67.2.R 1252.72.2.R 1254.62.2.R 1256.66.2.R 1256.69.2.R 1256.74.2.R 1258.62.2.R 1260.66.2.R 1260.69.2.R 1262.50.2.R 1262.62.2.R 1264.67.2.R 1264.74.2.R 1266.50.2.R 1266.66.2.R 1268.62.4.R 1268.69.4.R 1268.76.4.R 1272.69.2.R 1272.72.2.R 1274.64.2.R 1276.69.2.R 1276.72.2.R 1278.64.2.R 1280.57.2.R 1280.69.2.R 1280.72.2.R 1280.76.2.R 1282.64.2.R 1284.69.2.R 1284.74.2.R 1286.64.2.R 1288.67.2.R 1288.72.2.R 1288.76.2.R 1290.64.2.R 1292.67.2.R 1292.72.2.R 1294.55.2.R 1294.64.2.R 1296.72.2.R 1296.76.2.R 1298.67.2.R 1300.55.2.R 1300.72.2.R 1300.77.2.R 1302.69.2.R 1304.55.4.R 1304.71.4.R 1304.74.4.R 1308.71.4.R 1308.74.4.R 1308.79.4.R 1312.71.4.R 1312.74.4.R 1312.79.4.R 1316.55.4.R 1316.71.4.R 1316.76.4.R 1320.69.6.R 1320.74.6.R 1320.81.6.R 1326.50.2.R 1328.69.8.R 1328.74.8.R 1328.79.8.R 1336.72.2.R 1336.76.2.R 1336.81.2.R 1338.69.2.R 1340.76.2.R 1342.69.2.R 1344.77.2.R 1346.76.2.R 1348.69.2.R 1350.76.2.R 1352.69.2.R 1354.76.2.R 1356.69.2.R 1358.76.2.R 1360.77.2.R 1362.76.2.R 1364.69.2.R 1366.76.2.R 1368.69.2.R 1370.76.2.R 1372.69.2.R 1374.76.2.R 1376.77.2.R 1378.76.2.R 1380.69.2.R 1382.76.2.R 1384.69.2.R 1386.76.2.R 1388.69.2.R 1390.76.2.R 1392.77.2.R 1394.76.2.R 1396.69.2.R 1398.76.8.R';
const INT_SECTIONS = [
  { name: 'Opening tick', startBeat: 0, endBeat: 24 },
  { name: 'First theme', startBeat: 24, endBeat: 48 },
  { name: 'Build', startBeat: 48, endBeat: 78 },
  { name: 'Climb', startBeat: 78, endBeat: 105 },
  { name: 'Finale', startBeat: 105, endBeat: 131 },
];
const ITE_SECTIONS = [
  { name: 'Intro riff', startBeat: 0, endBeat: 32 },
  { name: 'Verse 1', startBeat: 32, endBeat: 96 },
  { name: 'Chorus', startBeat: 96, endBeat: 128 },
  { name: 'Verse 2', startBeat: 128, endBeat: 192 },
  { name: 'Chorus 2', startBeat: 192, endBeat: 224 },
  { name: 'Bridge', startBeat: 224, endBeat: 256 },
  { name: 'Final chorus', startBeat: 256, endBeat: 324 },
  { name: 'Outro', startBeat: 324, endBeat: 361 },
];
const WID_SECTIONS = [
  { name: 'Intro riff', startBeat: 0, endBeat: 40 },
  { name: 'Full riff', startBeat: 40, endBeat: 60 },
  { name: 'Verse', startBeat: 60, endBeat: 124 },
  { name: 'Chorus', startBeat: 124, endBeat: 188 },
  { name: 'Verse 2', startBeat: 188, endBeat: 212 },
  { name: 'Big chorus', startBeat: 212, endBeat: 284 },
  { name: 'Chorus out', startBeat: 284, endBeat: 336 },
  { name: 'Outro', startBeat: 336, endBeat: 352 },
];
SONGS.push(
  {
    id: 'interstellar-easy', group: 'interstellar', level: 'Easy',
    title: 'Interstellar (Main Theme)', composer: 'Hans Zimmer',
    bpm: 60, timeSig: [3, 4], beatUnit: 4,
    sections: [
      { name: 'The tick', startBeat: 0, endBeat: 21 },
      { name: 'First theme', startBeat: 21, endBeat: 44 },
    ],
    notes: fromStream(INT_EASY, 4),
  },
  {
    id: 'interstellar', group: 'interstellar', level: 'Medium',
    title: 'Interstellar (Main Theme)', composer: 'Hans Zimmer',
    bpm: 63, timeSig: [3, 4], beatUnit: 4,
    sections: INT_SECTIONS,
    notes: fromStream(INT_MED, 4),
  },
  {
    id: 'interstellar-hard', group: 'interstellar', level: 'Hard',
    title: 'Interstellar (Main Theme)', composer: 'Hans Zimmer',
    bpm: 63, timeSig: [3, 4], beatUnit: 4,
    sections: INT_SECTIONS,
    notes: fromStream(INT_HARD, 4),
  },
  {
    id: 'in-the-end-easy', group: 'in-the-end', level: 'Easy',
    title: 'In the End', composer: 'Linkin Park (arr. in E minor)',
    bpm: 105, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Riff', startBeat: 0, endBeat: 32 },
      { name: 'Chorus', startBeat: 32, endBeat: 64 },
    ],
    notes: fromStream(ITE_EASY, 4),
  },
  {
    id: 'in-the-end', group: 'in-the-end', level: 'Medium',
    title: 'In the End', composer: 'Linkin Park (arr. in E minor)',
    bpm: 105, timeSig: [4, 4], beatUnit: 4,
    sections: ITE_SECTIONS,
    notes: fromStream(ITE_MED, 4),
  },
  {
    id: 'in-the-end-hard', group: 'in-the-end', level: 'Hard',
    title: 'In the End', composer: 'Linkin Park (arr. in E minor)',
    bpm: 105, timeSig: [4, 4], beatUnit: 4,
    sections: ITE_SECTIONS,
    notes: fromStream(ITE_HARD, 4),
  },
  {
    id: 'what-ive-done-easy', group: 'what-ive-done', level: 'Easy',
    title: "What I've Done", composer: 'Linkin Park (arr. in A minor)',
    bpm: 120, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Riff', startBeat: 0, endBeat: 32 },
      { name: 'Chorus', startBeat: 32, endBeat: 64 },
    ],
    notes: fromStream(WID_EASY, 4),
  },
  {
    id: 'what-ive-done', group: 'what-ive-done', level: 'Medium',
    title: "What I've Done", composer: 'Linkin Park (arr. in A minor)',
    bpm: 120, timeSig: [4, 4], beatUnit: 4,
    sections: WID_SECTIONS,
    notes: fromStream(WID_MED, 4),
  },
  {
    id: 'what-ive-done-hard', group: 'what-ive-done', level: 'Hard',
    title: "What I've Done", composer: 'Linkin Park (arr. in A minor)',
    bpm: 120, timeSig: [4, 4], beatUnit: 4,
    sections: WID_SECTIONS,
    notes: fromStream(WID_HARD, 4),
  },
);



// ---- 2026-08-28 wave 3: Work This Time (King Gizzard & the Lizard Wizard) --
// Sources (two, agreeing): Hooktheory zngRLLQeoJj (F# DORIAN, 140bpm, 4/4,
// chord roots 1-2-3-4 = F#m G#m A B, verse vocal melody with exact beats) ×
// UG chords tab 1909689 (4.9★/126 votes: same loop, turnaround F#m-B-C#m-B,
// chorus A-F#m ×3 + A-E-B, intro riff in tab, pitch sequence decoded
// string-by-string). Authored +3 in A dorian (naturals + F#), labelled.
// The chorus/turnaround VOCAL lines have no verified note source, so those
// sections are CHORDS-ONLY on the verified progressions (the Gangsta's
// Paradise precedent); riff rhythm-setting and all LH parts are my
// arrangement on the verified pitches, and say so.
const WTT_EASY = '0.45.8.L 8.47.8.L 16.48.8.L 24.50.8.L 32.45.8.L 40.47.8.L 48.48.8.L 56.50.8.L 64.48.8.L 72.45.8.L 80.48.8.L 88.45.8.L 96.48.8.L 104.43.8.L 112.50.8.L 120.50.8.L 32.71.2.R 34.69.2.R 36.67.2.R 38.66.2.R 40.67.2.R 42.66.2.R 44.64.2.R 46.62.2.R 48.64.2.R 50.62.2.R 52.60.2.R 54.59.2.R 56.59.2.R 58.57.2.R 60.57.2.R 62.57.2.R 64.67.4.R 68.60.4.R 72.64.4.R 76.57.4.R 80.67.4.R 84.60.4.R 88.64.4.R 92.57.4.R 96.67.4.R 100.60.4.R 104.62.4.R 108.55.4.R 112.69.4.R 116.62.4.R 120.69.4.R 124.62.4.R';
const WTT_MED = '0.45.8.L 8.47.8.L 16.48.8.L 24.50.8.L 32.45.8.L 40.47.8.L 48.48.8.L 56.50.8.L 64.45.8.L 72.47.8.L 80.48.8.L 88.50.8.L 96.45.8.L 104.47.8.L 112.48.8.L 120.50.8.L 128.45.8.L 136.50.8.L 144.52.8.L 152.50.8.L 160.45.8.L 168.50.8.L 176.52.8.L 184.50.8.L 192.48.8.L 200.45.8.L 208.48.8.L 216.45.8.L 224.48.8.L 232.45.8.L 240.48.8.L 248.43.8.L 256.50.8.L 264.50.8.L 272.45.8.L 280.47.8.L 288.48.8.L 296.50.8.L 304.45.8.L 312.47.8.L 320.48.8.L 328.50.8.L 336.45.8.L 32.71.1.R 33.69.1.R 34.69.1.R 35.67.1.R 36.66.1.R 37.67.1.R 38.66.1.R 39.64.1.R 40.66.1.R 41.67.1.R 42.71.1.R 43.69.1.R 44.67.1.R 45.66.1.R 46.64.1.R 47.62.1.R 50.71.1.R 51.69.1.R 52.69.1.R 53.67.1.R 54.66.1.R 55.67.1.R 56.66.1.R 57.64.1.R 58.66.1.R 59.64.1.R 60.62.1.R 61.60.1.R 62.59.1.R 63.57.1.R 66.69.2.R 68.69.2.R 70.67.1.R 71.66.5.R 76.62.1.R 77.62.3.R 80.60.4.R 84.60.2.R 86.64.1.R 87.66.3.R 90.57.4.R 94.57.1.R 95.59.3.R 98.57.4.R 102.52.4.R 128.57.4.R 128.60.4.R 128.64.4.R 132.57.4.R 132.60.4.R 132.64.4.R 136.62.4.R 136.66.4.R 136.69.4.R 140.62.4.R 140.66.4.R 140.69.4.R 144.64.4.R 144.67.4.R 144.71.4.R 148.64.4.R 148.67.4.R 148.71.4.R 152.62.4.R 152.66.4.R 152.69.4.R 156.62.4.R 156.66.4.R 156.69.4.R 160.57.4.R 160.60.4.R 160.64.4.R 164.57.4.R 164.60.4.R 164.64.4.R 168.62.4.R 168.66.4.R 168.69.4.R 172.62.4.R 172.66.4.R 172.69.4.R 176.64.4.R 176.67.4.R 176.71.4.R 180.64.4.R 180.67.4.R 180.71.4.R 184.62.4.R 184.66.4.R 184.69.4.R 188.62.4.R 188.66.4.R 188.69.4.R 192.60.4.R 192.64.4.R 192.67.4.R 196.60.4.R 196.64.4.R 196.67.4.R 200.57.4.R 200.60.4.R 200.64.4.R 204.57.4.R 204.60.4.R 204.64.4.R 208.60.4.R 208.64.4.R 208.67.4.R 212.60.4.R 212.64.4.R 212.67.4.R 216.57.4.R 216.60.4.R 216.64.4.R 220.57.4.R 220.60.4.R 220.64.4.R 224.60.4.R 224.64.4.R 224.67.4.R 228.60.4.R 228.64.4.R 228.67.4.R 232.57.4.R 232.60.4.R 232.64.4.R 236.57.4.R 236.60.4.R 236.64.4.R 240.60.4.R 240.64.4.R 240.67.4.R 244.60.4.R 244.64.4.R 244.67.4.R 248.55.4.R 248.59.4.R 248.62.4.R 252.55.4.R 252.59.4.R 252.62.4.R 256.62.4.R 256.66.4.R 256.69.4.R 260.62.4.R 260.66.4.R 260.69.4.R 264.62.4.R 264.66.4.R 264.69.4.R 268.62.4.R 268.66.4.R 268.69.4.R 304.71.1.R 305.69.1.R 306.69.1.R 307.67.1.R 308.66.1.R 309.67.1.R 310.66.1.R 311.64.1.R 312.66.1.R 313.67.1.R 314.71.1.R 315.69.1.R 316.67.1.R 317.66.1.R 318.64.1.R 319.62.1.R 320.71.1.R 321.69.1.R 322.69.1.R 323.67.1.R 324.66.1.R 325.67.1.R 326.66.1.R 327.64.1.R 328.66.1.R 329.64.1.R 330.62.1.R 331.60.1.R 332.59.1.R 333.57.1.R 336.57.8.R';
const WTT_HARD = '0.45.1.L 1.52.1.L 2.57.1.L 3.52.1.L 4.45.1.L 5.52.1.L 6.57.1.L 7.52.1.L 8.47.1.L 9.54.1.L 10.59.1.L 11.54.1.L 12.47.1.L 13.54.1.L 14.59.1.L 15.54.1.L 16.48.1.L 17.55.1.L 18.60.1.L 19.55.1.L 20.48.1.L 21.55.1.L 22.60.1.L 23.55.1.L 24.50.1.L 25.57.1.L 26.62.1.L 27.57.1.L 28.50.1.L 29.57.1.L 30.62.1.L 31.57.1.L 32.45.1.L 33.52.1.L 34.57.1.L 35.52.1.L 36.45.1.L 37.52.1.L 38.57.1.L 39.52.1.L 40.47.1.L 41.54.1.L 42.59.1.L 43.54.1.L 44.47.1.L 45.54.1.L 46.59.1.L 47.54.1.L 48.48.1.L 49.55.1.L 50.60.1.L 51.55.1.L 52.48.1.L 53.55.1.L 54.60.1.L 55.55.1.L 56.50.1.L 57.57.1.L 58.62.1.L 59.57.1.L 60.50.1.L 61.57.1.L 62.62.1.L 63.57.1.L 64.45.1.L 65.52.1.L 66.57.1.L 67.52.1.L 68.45.1.L 69.52.1.L 70.57.1.L 71.52.1.L 72.47.1.L 73.54.1.L 74.59.1.L 75.54.1.L 76.47.1.L 77.54.1.L 78.59.1.L 79.54.1.L 80.48.1.L 81.55.1.L 82.60.1.L 83.55.1.L 84.48.1.L 85.55.1.L 86.60.1.L 87.55.1.L 88.50.1.L 89.57.1.L 90.62.1.L 91.57.1.L 92.50.1.L 93.57.1.L 94.62.1.L 95.57.1.L 96.45.1.L 97.52.1.L 98.57.1.L 99.52.1.L 100.45.1.L 101.52.1.L 102.57.1.L 103.52.1.L 104.47.1.L 105.54.1.L 106.59.1.L 107.54.1.L 108.47.1.L 109.54.1.L 110.59.1.L 111.54.1.L 112.48.1.L 113.55.1.L 114.60.1.L 115.55.1.L 116.48.1.L 117.55.1.L 118.60.1.L 119.55.1.L 120.50.1.L 121.57.1.L 122.62.1.L 123.57.1.L 124.50.1.L 125.57.1.L 126.62.1.L 127.57.1.L 128.45.4.L 132.57.4.L 136.50.4.L 140.62.4.L 144.52.4.L 148.64.4.L 152.50.4.L 156.62.4.L 160.45.4.L 164.57.4.L 168.50.4.L 172.62.4.L 176.52.4.L 180.64.4.L 184.50.4.L 188.62.4.L 192.48.4.L 196.60.4.L 200.45.4.L 204.57.4.L 208.48.4.L 212.60.4.L 216.45.4.L 220.57.4.L 224.48.4.L 228.60.4.L 232.45.4.L 236.57.4.L 240.48.4.L 244.60.4.L 248.43.4.L 252.55.4.L 256.50.4.L 260.62.4.L 264.50.4.L 268.62.4.L 272.45.1.L 273.52.1.L 274.57.1.L 275.52.1.L 276.45.1.L 277.52.1.L 278.57.1.L 279.52.1.L 280.47.1.L 281.54.1.L 282.59.1.L 283.54.1.L 284.47.1.L 285.54.1.L 286.59.1.L 287.54.1.L 288.48.1.L 289.55.1.L 290.60.1.L 291.55.1.L 292.48.1.L 293.55.1.L 294.60.1.L 295.55.1.L 296.50.1.L 297.57.1.L 298.62.1.L 299.57.1.L 300.50.1.L 301.57.1.L 302.62.1.L 303.57.1.L 304.45.1.L 305.52.1.L 306.57.1.L 307.52.1.L 308.45.1.L 309.52.1.L 310.57.1.L 311.52.1.L 312.47.1.L 313.54.1.L 314.59.1.L 315.54.1.L 316.47.1.L 317.54.1.L 318.59.1.L 319.54.1.L 320.48.1.L 321.55.1.L 322.60.1.L 323.55.1.L 324.48.1.L 325.55.1.L 326.60.1.L 327.55.1.L 328.50.1.L 329.57.1.L 330.62.1.L 331.57.1.L 332.50.1.L 333.57.1.L 334.62.1.L 335.57.1.L 336.33.8.L 336.45.8.L 32.71.1.R 33.69.1.R 34.69.1.R 35.67.1.R 36.66.1.R 37.67.1.R 38.66.1.R 39.64.1.R 40.66.1.R 41.67.1.R 42.71.1.R 43.69.1.R 44.67.1.R 45.66.1.R 46.64.1.R 47.62.1.R 50.71.1.R 51.69.1.R 52.69.1.R 53.67.1.R 54.66.1.R 55.67.1.R 56.66.1.R 57.64.1.R 58.66.1.R 59.64.1.R 60.62.1.R 61.60.1.R 62.59.1.R 63.57.1.R 66.69.2.R 66.81.2.R 68.69.2.R 68.81.2.R 70.67.1.R 70.79.1.R 71.66.5.R 71.78.5.R 76.62.1.R 76.74.1.R 77.62.3.R 77.74.3.R 80.60.4.R 80.72.4.R 84.60.2.R 84.72.2.R 86.64.1.R 86.76.1.R 87.66.3.R 87.78.3.R 90.57.4.R 90.69.4.R 94.57.1.R 94.69.1.R 95.59.3.R 95.71.3.R 98.57.4.R 98.69.4.R 102.52.4.R 102.64.4.R 128.57.4.R 128.60.4.R 128.64.4.R 132.57.4.R 132.60.4.R 132.64.4.R 136.62.4.R 136.66.4.R 136.69.4.R 140.62.4.R 140.66.4.R 140.69.4.R 144.64.4.R 144.67.4.R 144.71.4.R 148.64.4.R 148.67.4.R 148.71.4.R 152.62.4.R 152.66.4.R 152.69.4.R 156.62.4.R 156.66.4.R 156.69.4.R 160.57.4.R 160.60.4.R 160.64.4.R 164.57.4.R 164.60.4.R 164.64.4.R 168.62.4.R 168.66.4.R 168.69.4.R 172.62.4.R 172.66.4.R 172.69.4.R 176.64.4.R 176.67.4.R 176.71.4.R 180.64.4.R 180.67.4.R 180.71.4.R 184.62.4.R 184.66.4.R 184.69.4.R 188.62.4.R 188.66.4.R 188.69.4.R 192.60.4.R 192.64.4.R 192.67.4.R 196.60.4.R 196.64.4.R 196.67.4.R 200.57.4.R 200.60.4.R 200.64.4.R 204.57.4.R 204.60.4.R 204.64.4.R 208.60.4.R 208.64.4.R 208.67.4.R 212.60.4.R 212.64.4.R 212.67.4.R 216.57.4.R 216.60.4.R 216.64.4.R 220.57.4.R 220.60.4.R 220.64.4.R 224.60.4.R 224.64.4.R 224.67.4.R 228.60.4.R 228.64.4.R 228.67.4.R 232.57.4.R 232.60.4.R 232.64.4.R 236.57.4.R 236.60.4.R 236.64.4.R 240.60.4.R 240.64.4.R 240.67.4.R 244.60.4.R 244.64.4.R 244.67.4.R 248.55.4.R 248.59.4.R 248.62.4.R 252.55.4.R 252.59.4.R 252.62.4.R 256.62.4.R 256.66.4.R 256.69.4.R 260.62.4.R 260.66.4.R 260.69.4.R 264.62.4.R 264.66.4.R 264.69.4.R 268.62.4.R 268.66.4.R 268.69.4.R 304.71.1.R 304.83.1.R 305.69.1.R 305.81.1.R 306.69.1.R 306.81.1.R 307.67.1.R 307.79.1.R 308.66.1.R 308.78.1.R 309.67.1.R 309.79.1.R 310.66.1.R 310.78.1.R 311.64.1.R 311.76.1.R 312.66.1.R 312.78.1.R 313.67.1.R 313.79.1.R 314.71.1.R 314.83.1.R 315.69.1.R 315.81.1.R 316.67.1.R 316.79.1.R 317.66.1.R 317.78.1.R 318.64.1.R 318.76.1.R 319.62.1.R 319.74.1.R 320.71.1.R 320.83.1.R 321.69.1.R 321.81.1.R 322.69.1.R 322.81.1.R 323.67.1.R 323.79.1.R 324.66.1.R 324.78.1.R 325.67.1.R 325.79.1.R 326.66.1.R 326.78.1.R 327.64.1.R 327.76.1.R 328.66.1.R 328.78.1.R 329.64.1.R 329.76.1.R 330.62.1.R 330.74.1.R 331.60.1.R 331.72.1.R 332.59.1.R 332.71.1.R 333.57.1.R 333.69.1.R 336.57.8.R 336.69.8.R';
const WTT_SECTIONS = [
  { name: 'Intro + riff', startBeat: 0, endBeat: 32 },
  { name: 'Verse', startBeat: 32, endBeat: 64 },
  { name: 'Turnaround', startBeat: 64, endBeat: 96 },
  { name: 'Chorus', startBeat: 96, endBeat: 136 },
  { name: 'Outro riff', startBeat: 136, endBeat: 172 },
];
SONGS.push(
  {
    id: 'work-this-time-easy', group: 'work-this-time', level: 'Easy',
    title: 'Work This Time', composer: 'King Gizzard & the Lizard Wizard (arr. in A dorian)',
    bpm: 140, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Riff', startBeat: 0, endBeat: 32 },
      { name: 'Chorus', startBeat: 32, endBeat: 64 },
    ],
    notes: fromStream(WTT_EASY, 2),
  },
  {
    id: 'work-this-time', group: 'work-this-time', level: 'Medium',
    title: 'Work This Time', composer: 'King Gizzard & the Lizard Wizard (arr. in A dorian)',
    bpm: 140, timeSig: [4, 4], beatUnit: 4,
    sections: WTT_SECTIONS,
    notes: fromStream(WTT_MED, 2),
  },
  {
    id: 'work-this-time-hard', group: 'work-this-time', level: 'Hard',
    title: 'Work This Time', composer: 'King Gizzard & the Lizard Wizard (arr. in A dorian)',
    bpm: 140, timeSig: [4, 4], beatUnit: 4,
    sections: WTT_SECTIONS,
    notes: fromStream(WTT_HARD, 2),
  },
);



// ---- 2026-08-28 wave 4: In-A-Gadda-Da-Vida (Iron Butterfly, 1968) ----
// The Simpsons' "In the Garden of Eden, by I. Ron Butterfly" (Bart Sells His
// Soul), Mark's ask. Two agreeing sources: Hooktheory bWgMWWrLXol (Intro:
// D dorian organ climb, mechanically converted from jsonData; 232bpm 3/4
// halved onto the 118 grid) + d_gw_QK_VgG (Verse: riff rhythm as chord roots,
// vocal "In-a-gadda-da-vida, honey" with exact beats, the A chant dipping
// D-F-G) × UG tab 34785 (4.5★/108: bass riff pitches with the lyric printed
// under them, incl. the chromatic A-G#-G turn, used in the Hard tier).
// Kept in D dorian (naturals). The 17-minute solo sections are PARKED, not
// guessed. Riff-rhythm merge and all voicing/octave choices are my
// arrangement on the two sources' pitches and beats, and say so.
const IAGDV_EASY = '0.50.8.L 8.53.4.L 12.52.4.L 16.50.8.L 24.55.4.L 28.50.4.L 32.50.8.L 40.53.4.L 44.52.4.L 48.50.8.L 56.55.4.L 60.50.4.L 64.50.8.L 72.53.4.L 76.52.4.L 80.50.8.L 88.55.4.L 92.50.4.L 96.50.8.L 104.53.4.L 108.52.4.L 112.50.8.L 120.55.4.L 124.50.4.L 128.50.16.L 68.69.2.R 70.69.2.R 72.69.2.R 74.69.2.R 76.69.2.R 78.69.4.R 82.62.4.R 86.65.4.R 90.67.4.R 100.69.2.R 102.69.2.R 104.69.2.R 106.67.2.R 108.65.2.R 110.67.4.R 114.62.4.R 118.65.4.R 122.67.4.R 128.62.16.R';
const IAGDV_MED = '0.38.32.L 32.38.32.L 64.50.8.L 72.53.2.L 74.52.2.L 76.50.2.L 78.50.4.L 82.50.4.L 86.50.4.L 90.55.4.L 94.50.2.L 96.50.8.L 104.53.2.L 106.52.2.L 108.50.2.L 110.50.4.L 114.50.4.L 118.50.4.L 122.55.4.L 126.50.2.L 128.50.8.L 136.53.2.L 138.52.2.L 140.50.2.L 142.50.4.L 146.50.4.L 150.50.4.L 154.55.4.L 158.50.2.L 160.50.8.L 168.53.2.L 170.52.2.L 172.50.2.L 174.50.4.L 178.50.4.L 182.50.4.L 186.55.4.L 190.50.2.L 192.50.8.L 200.53.2.L 202.52.2.L 204.50.2.L 206.50.4.L 210.50.4.L 214.50.4.L 218.55.4.L 222.50.2.L 224.50.8.L 232.53.2.L 234.52.2.L 236.50.2.L 238.50.4.L 242.50.4.L 246.50.4.L 250.55.4.L 254.50.2.L 256.50.8.L 264.53.2.L 266.52.2.L 268.50.2.L 270.50.4.L 274.50.4.L 278.50.4.L 282.55.4.L 286.50.2.L 288.50.8.L 296.53.2.L 298.52.2.L 300.50.2.L 302.50.4.L 306.50.4.L 310.50.4.L 314.55.4.L 318.50.2.L 320.38.16.L 320.50.16.L 0.57.1.R 1.62.1.R 2.65.1.R 3.57.1.R 4.62.1.R 5.65.1.R 6.57.1.R 7.62.1.R 8.65.1.R 9.57.1.R 10.62.1.R 11.65.1.R 12.69.1.R 13.62.1.R 14.65.1.R 15.69.1.R 16.74.1.R 17.65.1.R 18.69.1.R 19.74.1.R 20.77.1.R 21.69.1.R 22.74.1.R 23.77.1.R 24.81.10.R 34.79.2.R 36.81.2.R 38.77.4.R 42.79.4.R 46.76.4.R 50.76.2.R 52.74.2.R 54.72.4.R 132.69.2.R 134.69.2.R 136.69.2.R 138.69.2.R 140.69.2.R 142.69.4.R 146.62.4.R 150.65.4.R 154.67.4.R 164.69.2.R 166.69.2.R 168.69.2.R 170.67.2.R 172.65.2.R 174.67.4.R 178.62.4.R 182.65.4.R 186.67.4.R 196.69.2.R 198.69.2.R 200.69.2.R 202.69.2.R 204.69.2.R 206.69.4.R 210.62.4.R 214.65.4.R 218.67.4.R 228.69.2.R 230.69.2.R 232.69.2.R 234.67.2.R 236.65.2.R 238.67.4.R 242.62.4.R 246.65.4.R 250.67.4.R 256.81.10.R 266.79.2.R 268.81.2.R 270.77.4.R 274.79.4.R 278.76.4.R 282.76.2.R 284.74.2.R 286.72.4.R 320.62.16.R 320.65.16.R 320.69.16.R';
const IAGDV_HARD = '0.26.32.L 0.38.32.L 32.26.32.L 32.38.32.L 64.38.8.L 64.50.8.L 72.41.2.L 72.53.2.L 74.40.2.L 74.52.2.L 76.38.2.L 76.50.2.L 78.38.4.L 78.50.4.L 82.38.4.L 82.50.4.L 86.38.4.L 86.50.4.L 90.43.4.L 90.55.4.L 94.38.2.L 94.50.2.L 96.38.8.L 96.50.8.L 104.41.2.L 104.53.2.L 106.40.2.L 106.52.2.L 108.38.2.L 108.50.2.L 110.38.4.L 110.50.4.L 114.38.4.L 114.50.4.L 118.38.4.L 118.50.4.L 122.43.4.L 122.55.4.L 126.38.2.L 126.50.2.L 128.38.8.L 128.50.8.L 136.41.2.L 136.53.2.L 138.40.2.L 138.52.2.L 140.38.2.L 140.50.2.L 142.38.4.L 142.50.4.L 146.38.4.L 146.50.4.L 150.38.4.L 150.50.4.L 154.43.4.L 154.55.4.L 158.38.2.L 158.50.2.L 160.38.8.L 160.50.8.L 168.41.2.L 168.53.2.L 170.40.2.L 170.52.2.L 172.38.2.L 172.50.2.L 174.38.4.L 174.50.4.L 178.38.4.L 178.50.4.L 182.38.4.L 182.50.4.L 186.43.4.L 186.55.4.L 190.38.2.L 190.50.2.L 192.38.8.L 192.50.8.L 200.41.2.L 200.53.2.L 202.40.2.L 202.52.2.L 204.38.2.L 204.50.2.L 206.38.4.L 206.50.4.L 210.38.4.L 210.50.4.L 214.38.4.L 214.50.4.L 218.43.4.L 218.55.4.L 222.38.2.L 222.50.2.L 224.38.8.L 224.50.8.L 232.41.2.L 232.53.2.L 234.40.2.L 234.52.2.L 236.38.2.L 236.50.2.L 238.38.4.L 238.50.4.L 242.38.4.L 242.50.4.L 246.38.4.L 246.50.4.L 250.43.4.L 250.55.4.L 254.38.2.L 254.50.2.L 256.38.8.L 256.50.8.L 264.41.2.L 264.53.2.L 266.40.2.L 266.52.2.L 268.38.2.L 268.50.2.L 270.38.4.L 270.50.4.L 274.38.4.L 274.50.4.L 278.38.4.L 278.50.4.L 282.43.4.L 282.55.4.L 286.38.2.L 286.50.2.L 288.38.8.L 288.50.8.L 296.41.2.L 296.53.2.L 298.40.2.L 298.52.2.L 300.38.2.L 300.50.2.L 302.38.4.L 302.50.4.L 306.38.4.L 306.50.4.L 310.38.4.L 310.50.4.L 314.43.4.L 314.55.4.L 318.38.2.L 318.50.2.L 320.26.16.L 320.38.16.L 320.50.16.L 0.57.1.R 1.62.1.R 2.65.1.R 3.57.1.R 4.62.1.R 5.65.1.R 6.57.1.R 7.62.1.R 8.65.1.R 9.57.1.R 10.62.1.R 11.65.1.R 12.57.1.R 12.69.1.R 13.62.1.R 14.65.1.R 15.57.1.R 15.69.1.R 16.62.1.R 16.74.1.R 17.65.1.R 18.57.1.R 18.69.1.R 19.62.1.R 19.74.1.R 20.65.1.R 20.77.1.R 21.57.1.R 21.69.1.R 22.62.1.R 22.74.1.R 23.65.1.R 23.77.1.R 24.69.10.R 24.81.10.R 34.67.2.R 34.79.2.R 36.69.2.R 36.81.2.R 38.65.4.R 38.77.4.R 42.67.4.R 42.79.4.R 46.64.4.R 46.76.4.R 50.64.2.R 50.76.2.R 52.62.2.R 52.74.2.R 54.60.4.R 54.72.4.R 118.69.2.R 120.68.2.R 122.67.2.R 124.60.2.R 126.62.2.R 132.69.2.R 132.81.2.R 134.69.2.R 134.81.2.R 136.69.2.R 136.81.2.R 138.69.2.R 138.81.2.R 140.69.2.R 140.81.2.R 142.69.4.R 142.81.4.R 146.62.4.R 146.74.4.R 150.65.4.R 150.77.4.R 154.67.4.R 154.79.4.R 164.69.2.R 164.81.2.R 166.69.2.R 166.81.2.R 168.69.2.R 168.81.2.R 170.67.2.R 170.79.2.R 172.65.2.R 172.77.2.R 174.67.4.R 174.79.4.R 178.62.4.R 178.74.4.R 182.65.4.R 182.69.2.R 182.77.4.R 184.68.2.R 186.67.2.R 186.79.4.R 188.60.2.R 190.62.2.R 196.69.2.R 196.81.2.R 198.69.2.R 198.81.2.R 200.69.2.R 200.81.2.R 202.69.2.R 202.81.2.R 204.69.2.R 204.81.2.R 206.69.4.R 206.81.4.R 210.62.4.R 210.74.4.R 214.65.4.R 214.77.4.R 218.67.4.R 218.79.4.R 228.69.2.R 228.81.2.R 230.69.2.R 230.81.2.R 232.69.2.R 232.81.2.R 234.67.2.R 234.79.2.R 236.65.2.R 236.77.2.R 238.67.4.R 238.79.4.R 242.62.4.R 242.74.4.R 246.65.4.R 246.69.2.R 246.77.4.R 248.68.2.R 250.67.2.R 250.79.4.R 252.60.2.R 254.62.2.R 256.69.10.R 256.81.10.R 266.67.2.R 266.79.2.R 268.69.2.R 268.81.2.R 270.65.4.R 270.77.4.R 274.67.4.R 274.79.4.R 278.64.4.R 278.76.4.R 282.64.2.R 282.76.2.R 284.62.2.R 284.74.2.R 286.60.4.R 286.72.4.R 310.69.2.R 312.68.2.R 314.67.2.R 316.60.2.R 318.62.2.R 320.62.16.R 320.65.16.R 320.69.16.R 320.74.16.R';
const IAGDV_SECTIONS = [
  { name: 'Organ climb', startBeat: 0, endBeat: 16 },
  { name: 'The riff', startBeat: 16, endBeat: 32 },
  { name: 'Verse', startBeat: 32, endBeat: 64 },
  { name: 'Reprise', startBeat: 64, endBeat: 84 },
];
SONGS.push(
  {
    id: 'in-a-gadda-da-vida-easy', group: 'in-a-gadda-da-vida', level: 'Easy',
    title: 'In-A-Gadda-Da-Vida', composer: 'Iron Butterfly',
    bpm: 108, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'The riff', startBeat: 0, endBeat: 16 },
      { name: 'Vida, honey', startBeat: 16, endBeat: 36 },
    ],
    notes: fromStream(IAGDV_EASY, 4),
  },
  {
    id: 'in-a-gadda-da-vida', group: 'in-a-gadda-da-vida', level: 'Medium',
    title: 'In-A-Gadda-Da-Vida', composer: 'Iron Butterfly',
    bpm: 118, timeSig: [4, 4], beatUnit: 4,
    sections: IAGDV_SECTIONS,
    notes: fromStream(IAGDV_MED, 4),
  },
  {
    id: 'in-a-gadda-da-vida-hard', group: 'in-a-gadda-da-vida', level: 'Hard',
    title: 'In-A-Gadda-Da-Vida', composer: 'Iron Butterfly',
    bpm: 118, timeSig: [4, 4], beatUnit: 4,
    sections: IAGDV_SECTIONS,
    notes: fromStream(IAGDV_HARD, 4),
  },
);



// ---- 2026-08-28 wave 5: Stairway to Heaven / Bohemian Rhapsody ----
// Sources: TWO independent pianoletternotes arrangers per song (2017 regular
// + Hard Version 2020/2019), the Stairway pair opens IDENTICALLY for 25
// events, × Hooktheory (Stairway sections in the C-major family confirming
// the Am grid; Bohemian Rhapsody = Eb major, 72bpm ballad, swing outro).
// Stairway kept in A minor (the chromatic A-G#-G-F#-F descent pinned).
// Bohemian Rhapsody authored -3 in C (the Eb original's flats vanish; the
// opera/rock modulations keep their real accidentals). Medium tiers = the
// Hard arranger's chart with same-hand octave doublings thinned to the top
// voice. Tempi are the ballad/intro tempi, the engine is single-bpm, so the
// fast endings run at learning tempo (the trainer ladder owes the rest).
const STH_EASY = '25.47.1.L 26.45.1.L 27.45.3.L 30.45.3.L 33.45.12.L 58.47.1.L 59.45.1.L 60.45.4.L 64.45.1.L 65.47.12.L 81.45.1.L 82.47.12.L 97.45.1.L 98.47.12.L 114.45.1.L 115.47.12.L 197.45.1.L 198.47.12.L 0.57.1.R 1.60.1.R 2.64.1.R 3.69.1.R 4.56.1.R 4.71.1.R 5.64.1.R 6.60.1.R 7.71.1.R 8.55.1.R 8.72.1.R 9.64.1.R 10.60.1.R 11.72.1.R 12.54.1.R 12.66.1.R 13.62.1.R 14.57.1.R 15.66.1.R 16.53.1.R 16.64.1.R 17.60.2.R 19.57.1.R 20.60.2.R 22.64.1.R 23.60.1.R 24.57.1.R 25.55.1.R 26.57.1.R 27.57.3.R 31.52.1.R 31.53.1.R 32.52.2.R 34.57.1.R 35.60.1.R 36.64.1.R 37.56.1.R 37.71.1.R 38.64.1.R 39.60.1.R 40.71.1.R 41.55.1.R 41.72.1.R 42.64.1.R 43.60.1.R 44.72.2.R 46.54.1.R 46.66.1.R 47.62.1.R 48.57.1.R 49.66.1.R 50.53.1.R 50.64.1.R 51.60.1.R 52.57.1.R 53.60.2.R 55.64.1.R 56.60.1.R 57.57.1.R 58.55.1.R 59.57.1.R 60.57.3.R 66.48.1.R 66.67.1.R 66.72.1.R 66.76.1.R 67.52.1.R 68.55.1.R 69.64.1.R 70.66.1.R 70.69.1.R 70.74.1.R 70.78.1.R 71.62.2.R 73.57.1.R 74.66.1.R 75.64.1.R 75.72.1.R 75.77.1.R 75.81.1.R 76.60.1.R 77.57.1.R 77.76.1.R 77.79.1.R 78.64.1.R 78.71.1.R 78.74.1.R 78.77.1.R 79.59.1.R 79.69.1.R 79.72.1.R 79.76.1.R 80.57.2.R 82.71.1.R 82.74.1.R 82.79.1.R 83.60.1.R 83.72.1.R 83.76.1.R 83.79.1.R 84.55.1.R 85.52.1.R 86.60.1.R 87.67.1.R 87.71.1.R 87.74.1.R 87.79.1.R 88.59.1.R 89.55.1.R 90.67.1.R 91.62.1.R 91.67.1.R 91.69.1.R 91.74.1.R 91.79.1.R 92.66.1.R 92.69.1.R 92.78.1.R 93.62.3.R 93.66.3.R 93.69.3.R 93.74.3.R 93.78.3.R 100.48.1.R 100.67.1.R 100.72.1.R 100.76.1.R 101.52.1.R 102.55.1.R 102.72.1.R 102.76.1.R 102.81.1.R 103.60.1.R 103.71.1.R 103.76.1.R 103.79.1.R 104.66.1.R 104.71.1.R 104.76.1.R 104.79.1.R 105.62.1.R 105.69.1.R 105.74.1.R 105.78.1.R 106.59.1.R 106.69.1.R 106.76.1.R 107.66.1.R 107.69.1.R 107.74.1.R 108.64.1.R 108.71.1.R 108.77.1.R 108.81.1.R 109.60.1.R 110.57.1.R 110.84.1.R 110.88.1.R 111.64.1.R 111.74.1.R 111.79.1.R 111.83.1.R 112.65.1.R 112.76.1.R 112.84.1.R 112.88.1.R 113.57.3.R 116.48.1.R 116.79.1.R 116.84.1.R 116.88.1.R 117.52.1.R 118.55.1.R 119.60.1.R 120.50.1.R 120.78.1.R 120.81.1.R 120.86.1.R 121.57.1.R 122.62.1.R 123.66.1.R 124.53.1.R 124.64.1.R 124.72.1.R 124.76.1.R 124.79.1.R 125.53.2.R 125.64.2.R 125.81.2.R 127.53.3.R 127.64.3.R 127.72.3.R 127.76.3.R 127.81.3.R 131.69.1.R 132.71.1.R 133.57.2.R 133.64.2.R 133.72.2.R 135.71.1.R 136.69.1.R 137.56.2.R 137.64.2.R 137.71.2.R 139.69.1.R 140.71.1.R 141.55.2.R 141.64.2.R 141.72.2.R 143.74.1.R 144.72.1.R 145.54.2.R 145.62.2.R 145.71.2.R 147.72.1.R 148.74.1.R 149.53.2.R 149.60.2.R 149.76.2.R 151.74.1.R 152.72.2.R 154.71.1.R 155.69.2.R 157.67.1.R 158.59.2.R 158.62.2.R 158.67.2.R 160.57.3.R 160.60.3.R 160.64.3.R 160.69.3.R 164.69.1.R 165.71.1.R 166.57.2.R 166.64.2.R 166.72.2.R 168.71.1.R 169.69.1.R 170.56.2.R 170.64.2.R 170.71.2.R 172.69.1.R 173.71.1.R 174.55.2.R 174.64.2.R 174.72.2.R 176.74.1.R 177.72.1.R 178.54.1.R 178.62.1.R 178.71.1.R 179.69.2.R 181.72.1.R 182.74.1.R 183.53.2.R 183.60.2.R 183.76.2.R 185.74.1.R 186.72.1.R 187.71.2.R 189.69.1.R 190.67.1.R 191.59.2.R 191.62.2.R 191.67.2.R 193.57.3.R 193.60.3.R 193.64.3.R 193.69.3.R 199.48.2.R 201.72.1.R 202.76.1.R 203.50.3.R 203.66.3.R 203.74.3.R 208.53.2.R 208.69.2.R 208.74.2.R 210.72.1.R 211.71.1.R 212.57.1.R 212.72.1.R 213.69.1.R 214.69.1.R 215.71.3.R';
const STH_MED = '25.47.1.L 26.45.1.L 27.45.3.L 30.45.3.L 33.45.12.L 58.47.1.L 59.45.1.L 60.45.4.L 64.45.1.L 65.47.12.L 81.45.1.L 82.47.12.L 97.45.1.L 98.47.12.L 114.45.1.L 115.47.12.L 133.45.4.L 137.44.1.L 138.47.3.L 141.43.1.L 142.47.3.L 145.42.4.L 149.41.5.L 154.41.4.L 158.47.1.L 159.45.1.L 160.45.6.L 166.45.4.L 170.44.1.L 171.47.3.L 174.43.1.L 175.47.3.L 178.42.5.L 183.41.4.L 187.41.4.L 191.47.1.L 192.45.1.L 193.45.4.L 197.45.1.L 198.47.10.L 208.41.4.L 212.45.8.L 220.43.1.L 221.47.3.L 224.43.1.L 225.45.1.L 226.45.6.L 232.45.5.L 237.44.1.L 238.47.3.L 241.43.1.L 242.47.3.L 245.42.4.L 249.41.4.L 253.41.4.L 257.47.1.L 258.45.1.L 259.45.7.L 266.45.4.L 270.44.1.L 271.47.3.L 274.43.1.L 275.47.3.L 278.42.4.L 282.41.4.L 286.41.5.L 291.47.1.L 292.45.1.L 293.45.12.L 332.45.1.L 333.45.1.L 334.45.1.L 335.45.2.L 337.45.1.L 338.45.1.L 339.45.10.L 349.45.1.L 350.45.1.L 351.45.1.L 352.45.1.L 353.45.2.L 355.45.2.L 357.40.2.L 359.38.2.L 361.36.2.L 363.38.2.L 365.45.1.L 366.45.1.L 367.45.1.L 368.45.3.L 371.45.1.L 372.45.1.L 373.45.9.L 382.45.1.L 383.45.1.L 384.45.1.L 385.45.1.L 386.45.2.L 388.45.2.L 390.40.2.L 392.38.2.L 394.36.3.L 397.38.6.L 403.43.1.L 404.47.3.L 407.45.7.L 414.45.5.L 419.43.1.L 420.47.4.L 424.43.1.L 425.45.1.L 426.45.10.L 436.43.1.L 437.47.3.L 440.45.7.L 447.45.10.L 457.43.1.L 458.45.1.L 459.45.4.L 463.45.1.L 464.47.5.L 469.47.3.L 472.47.1.L 473.45.1.L 474.45.1.L 475.45.1.L 476.45.3.L 479.45.1.L 480.45.1.L 481.45.9.L 490.45.1.L 491.45.1.L 492.45.1.L 493.45.1.L 494.45.2.L 496.45.2.L 498.40.2.L 500.38.2.L 502.36.3.L 505.38.2.L 507.45.1.L 508.45.1.L 509.45.1.L 510.45.2.L 512.45.1.L 513.45.1.L 514.45.9.L 523.45.1.L 524.45.1.L 525.45.1.L 526.45.1.L 527.45.2.L 529.45.3.L 532.40.2.L 534.38.2.L 536.36.2.L 538.38.6.L 544.43.1.L 545.47.3.L 548.45.7.L 555.45.6.L 561.43.1.L 562.47.3.L 565.43.1.L 566.45.1.L 567.45.10.L 577.43.1.L 578.47.3.L 581.45.8.L 589.45.9.L 598.43.1.L 599.45.1.L 600.45.4.L 604.45.1.L 605.47.5.L 610.47.4.L 614.47.1.L 615.45.1.L 616.45.1.L 617.45.1.L 618.45.2.L 620.45.1.L 621.45.1.L 622.45.9.L 631.45.1.L 632.45.1.L 633.45.1.L 634.45.1.L 635.45.2.L 637.45.3.L 640.40.2.L 642.38.2.L 644.36.2.L 646.38.2.L 648.45.1.L 649.45.1.L 650.45.1.L 651.45.2.L 653.45.1.L 654.45.1.L 655.45.9.L 664.45.1.L 665.45.2.L 667.45.1.L 668.45.1.L 669.45.2.L 671.45.2.L 673.40.2.L 675.38.2.L 677.36.2.L 679.38.6.L 685.43.1.L 686.47.3.L 689.45.5.L 694.45.8.L 702.43.1.L 703.47.3.L 706.41.2.L 708.45.4.L 712.45.1.L 713.47.5.L 718.43.1.L 719.47.4.L 723.45.4.L 727.45.8.L 735.43.1.L 736.47.3.L 739.41.2.L 741.45.4.L 745.45.1.L 746.47.6.L 752.47.3.L 755.47.1.L 756.45.1.L 757.45.1.L 758.45.1.L 759.45.2.L 761.45.1.L 762.45.1.L 763.45.9.L 772.45.1.L 773.45.2.L 775.45.1.L 776.45.1.L 777.45.2.L 779.45.2.L 781.40.2.L 783.38.2.L 785.36.2.L 787.38.2.L 789.45.1.L 790.45.1.L 791.45.1.L 792.45.2.L 794.45.1.L 795.45.1.L 796.45.10.L 806.45.1.L 807.45.1.L 808.45.1.L 809.45.1.L 810.45.2.L 812.45.2.L 814.40.2.L 816.38.2.L 818.36.2.L 820.38.6.L 826.43.1.L 827.47.4.L 831.45.4.L 835.45.8.L 843.43.1.L 844.47.3.L 847.41.2.L 849.45.4.L 853.45.1.L 854.47.6.L 860.43.1.L 861.47.3.L 864.45.4.L 868.45.8.L 876.43.1.L 877.47.3.L 880.41.3.L 883.45.4.L 887.45.1.L 888.47.5.L 893.47.3.L 896.47.1.L 897.38.7.L 897.45.7.L 904.38.1.L 905.38.1.L 905.45.1.L 906.38.1.L 906.45.1.L 907.38.3.L 907.45.3.L 910.38.1.L 910.45.1.L 911.38.3.L 911.45.3.L 914.38.1.L 914.45.1.L 915.38.2.L 915.45.2.L 917.38.2.L 917.45.2.L 919.38.3.L 919.45.3.L 922.36.4.L 922.43.4.L 926.36.2.L 926.43.2.L 928.36.1.L 929.36.1.L 930.36.4.L 930.43.4.L 934.36.3.L 934.43.3.L 937.36.1.L 938.36.1.L 939.38.1.L 939.45.1.L 940.38.3.L 940.45.3.L 943.38.1.L 943.45.1.L 944.38.3.L 944.45.3.L 947.38.1.L 947.45.1.L 948.38.1.L 948.45.1.L 949.38.1.L 949.45.1.L 950.38.2.L 950.45.2.L 952.38.3.L 952.45.3.L 955.36.4.L 955.43.4.L 959.36.1.L 959.43.1.L 960.36.1.L 960.43.1.L 961.36.1.L 962.36.2.L 964.36.4.L 964.43.4.L 968.36.1.L 968.43.1.L 969.36.1.L 969.43.1.L 970.36.1.L 971.36.1.L 972.33.1.L 973.45.3.L 976.43.1.L 977.43.3.L 980.41.3.L 983.41.2.L 985.41.2.L 987.43.1.L 988.45.1.L 989.45.3.L 992.45.1.L 993.43.1.L 994.43.2.L 996.43.1.L 997.41.1.L 998.41.4.L 1002.41.2.L 1004.43.1.L 1005.33.1.L 1006.45.3.L 1009.43.1.L 1010.43.3.L 1013.41.3.L 1016.41.3.L 1019.41.2.L 1021.43.1.L 1022.45.1.L 1023.45.2.L 1025.45.1.L 1026.43.1.L 1027.43.2.L 1029.43.1.L 1030.41.1.L 1031.41.4.L 1035.41.2.L 1037.43.1.L 1038.33.1.L 1039.45.3.L 1042.43.1.L 1043.43.4.L 1047.41.3.L 1050.41.2.L 1052.41.2.L 1054.43.1.L 1055.45.1.L 1056.45.2.L 1058.45.1.L 1059.43.1.L 1060.43.2.L 1062.43.1.L 1063.41.1.L 1064.41.4.L 1068.41.2.L 1070.43.2.L 1072.33.1.L 1073.45.2.L 1075.45.1.L 1076.43.1.L 1077.43.2.L 1079.43.1.L 1080.41.1.L 1081.41.2.L 1083.41.2.L 1085.41.2.L 1087.31.1.L 1088.33.1.L 1089.45.2.L 1091.45.1.L 1092.43.1.L 1093.43.2.L 1095.43.1.L 1096.41.1.L 1097.41.3.L 1100.41.2.L 1102.41.2.L 1104.31.1.L 1105.33.1.L 1106.45.2.L 1108.45.1.L 1109.43.1.L 1110.43.2.L 1112.43.1.L 1113.41.1.L 1114.41.2.L 1116.41.2.L 1118.41.2.L 1120.31.1.L 1121.33.1.L 1122.45.2.L 1124.45.2.L 1126.43.1.L 1127.43.2.L 1129.43.1.L 1130.41.1.L 1131.41.1.L 1132.41.1.L 1133.41.1.L 1134.41.1.L 1135.41.1.L 1136.41.1.L 1137.43.1.L 1138.33.1.L 1139.45.3.L 1142.43.1.L 1143.43.3.L 1146.41.1.L 1147.41.1.L 1148.41.1.L 1149.41.1.L 1150.41.1.L 1151.41.1.L 1152.41.1.L 1153.41.1.L 1154.31.1.L 1155.33.1.L 1156.45.3.L 1159.43.1.L 1160.43.3.L 1163.41.1.L 1164.41.1.L 1165.41.1.L 1166.41.1.L 1167.41.1.L 1168.41.1.L 1169.41.1.L 1170.31.1.L 1170.41.1.L 1171.33.1.L 1172.45.3.L 1175.43.1.L 1176.43.4.L 1180.41.1.L 1181.41.1.L 1182.41.1.L 1183.41.1.L 1184.41.1.L 1185.41.1.L 1186.41.1.L 1187.31.1.L 1188.33.1.L 1189.45.1.L 1190.45.1.L 1191.45.1.L 1192.31.1.L 1193.43.1.L 1194.43.2.L 1196.41.1.L 1197.41.1.L 1198.41.1.L 1199.41.1.L 1200.41.1.L 1201.41.1.L 1202.41.1.L 1203.31.1.L 1203.41.1.L 1204.33.1.L 1205.45.2.L 1207.45.1.L 1208.45.1.L 1209.31.1.L 1210.43.1.L 1211.43.2.L 1213.41.1.L 1214.41.1.L 1215.41.1.L 1216.41.1.L 1217.41.1.L 1218.41.1.L 1219.41.1.L 1220.31.1.L 1220.41.1.L 1221.33.1.L 1222.45.1.L 1223.45.1.L 1224.45.1.L 1225.31.1.L 1226.43.1.L 1227.43.2.L 1229.41.1.L 1230.41.1.L 1231.41.1.L 1232.41.1.L 1233.41.1.L 1234.41.1.L 1235.41.1.L 1236.41.1.L 1237.31.1.L 1238.33.1.L 1239.45.1.L 1240.45.1.L 1241.45.1.L 1242.31.1.L 1243.43.1.L 1244.43.2.L 1246.41.1.L 1247.41.1.L 1248.41.1.L 1249.41.1.L 1250.41.1.L 1251.41.1.L 1252.41.1.L 1253.31.1.L 1253.41.1.L 1254.33.1.L 1255.45.1.L 1256.45.1.L 1257.45.1.L 1258.31.1.L 1259.43.2.L 1261.43.1.L 1262.29.2.L 1264.41.2.L 1266.41.2.L 1268.41.2.L 1270.31.1.L 1271.33.1.L 1272.45.3.L 1275.31.1.L 1276.43.3.L 1279.29.1.L 1280.41.2.L 1282.41.2.L 1284.41.2.L 1286.31.2.L 1288.33.1.L 1289.45.2.L 1291.45.1.L 1292.43.1.L 1293.43.1.L 1294.43.1.L 1295.43.1.L 1296.41.1.L 1297.41.2.L 1299.41.2.L 1301.41.1.L 1302.41.1.L 1303.43.1.L 1304.45.1.L 1305.45.2.L 1307.45.1.L 1308.43.1.L 1309.43.1.L 1310.43.1.L 1311.43.1.L 1312.41.1.L 1313.41.3.L 1316.41.2.L 1318.41.1.L 1319.41.1.L 1320.43.1.L 1321.45.1.L 1322.45.2.L 1324.45.1.L 1325.43.1.L 1326.43.1.L 1327.43.1.L 1328.43.1.L 1329.41.1.L 1330.41.2.L 1332.41.2.L 1334.41.1.L 1335.41.1.L 1336.43.1.L 1337.45.1.L 1338.45.2.L 1340.45.2.L 1342.43.1.L 1343.43.2.L 1345.43.1.L 1346.41.12.L 0.57.1.R 1.60.1.R 2.64.1.R 3.69.1.R 4.56.1.R 4.71.1.R 5.64.1.R 6.60.1.R 7.71.1.R 8.55.1.R 8.72.1.R 9.64.1.R 10.60.1.R 11.72.1.R 12.54.1.R 13.62.1.R 14.57.1.R 15.66.1.R 16.53.1.R 16.64.1.R 17.60.2.R 19.57.1.R 20.60.2.R 22.64.1.R 23.60.1.R 24.57.1.R 25.55.1.R 25.59.1.R 25.62.1.R 26.57.1.R 26.60.1.R 26.64.1.R 27.57.3.R 27.60.3.R 27.64.3.R 31.53.1.R 32.52.2.R 34.57.1.R 35.60.1.R 36.64.1.R 37.56.1.R 37.71.1.R 38.64.1.R 39.60.1.R 40.71.1.R 41.55.1.R 41.72.1.R 42.64.1.R 43.60.1.R 44.72.2.R 46.54.1.R 47.62.1.R 48.57.1.R 49.66.1.R 50.53.1.R 50.64.1.R 51.60.1.R 52.57.1.R 53.60.2.R 55.64.1.R 56.60.1.R 57.57.1.R 58.55.1.R 58.59.1.R 58.62.1.R 59.57.1.R 59.60.1.R 59.64.1.R 60.57.3.R 60.60.3.R 60.64.3.R 66.48.1.R 66.67.1.R 66.72.1.R 66.76.1.R 67.52.1.R 68.55.1.R 69.64.1.R 70.69.1.R 70.74.1.R 70.78.1.R 71.62.2.R 73.57.1.R 74.66.1.R 75.64.1.R 75.72.1.R 75.77.1.R 75.81.1.R 76.60.1.R 77.57.1.R 77.76.1.R 77.79.1.R 78.64.1.R 78.71.1.R 78.74.1.R 78.77.1.R 79.59.1.R 79.69.1.R 79.72.1.R 79.76.1.R 80.57.2.R 82.71.1.R 82.74.1.R 82.79.1.R 83.72.1.R 83.76.1.R 83.79.1.R 84.55.1.R 85.52.1.R 86.60.1.R 87.71.1.R 87.74.1.R 87.79.1.R 88.59.1.R 89.55.1.R 90.67.1.R 91.69.1.R 91.74.1.R 91.79.1.R 92.69.1.R 92.78.1.R 93.69.3.R 93.74.3.R 93.78.3.R 100.48.1.R 100.67.1.R 100.72.1.R 100.76.1.R 101.52.1.R 102.55.1.R 102.72.1.R 102.76.1.R 102.81.1.R 103.60.1.R 103.71.1.R 103.76.1.R 103.79.1.R 104.66.1.R 104.71.1.R 104.76.1.R 104.79.1.R 105.69.1.R 105.74.1.R 105.78.1.R 106.59.1.R 106.69.1.R 106.76.1.R 107.66.1.R 107.69.1.R 107.74.1.R 108.64.1.R 108.71.1.R 108.77.1.R 108.81.1.R 109.60.1.R 110.57.1.R 110.81.1.R 110.84.1.R 111.64.1.R 111.74.1.R 111.79.1.R 111.83.1.R 112.76.1.R 112.81.1.R 112.84.1.R 113.57.3.R 116.48.1.R 116.79.1.R 116.84.1.R 116.88.1.R 117.52.1.R 118.55.1.R 119.60.1.R 120.50.1.R 120.78.1.R 120.81.1.R 120.86.1.R 121.57.1.R 122.62.1.R 123.66.1.R 124.53.1.R 124.72.1.R 124.76.1.R 124.79.1.R 125.53.2.R 125.64.2.R 125.81.2.R 127.53.3.R 127.72.3.R 127.76.3.R 127.81.3.R 131.69.1.R 132.71.1.R 133.64.1.R 133.72.1.R 134.48.1.R 135.52.1.R 135.71.1.R 136.57.1.R 137.64.2.R 137.71.2.R 139.50.1.R 139.69.1.R 140.56.1.R 140.71.1.R 141.67.2.R 141.72.2.R 143.50.1.R 143.74.1.R 144.55.1.R 144.72.1.R 145.71.1.R 146.50.1.R 146.69.1.R 147.54.1.R 147.72.1.R 148.57.1.R 148.74.1.R 149.65.1.R 149.76.1.R 150.48.1.R 151.53.1.R 151.74.1.R 152.48.2.R 152.72.2.R 154.71.1.R 155.48.1.R 155.69.1.R 156.53.1.R 157.48.1.R 157.67.1.R 158.55.1.R 158.59.1.R 158.62.1.R 159.57.1.R 159.60.1.R 159.64.1.R 160.57.3.R 160.60.3.R 160.64.3.R 164.69.1.R 165.71.1.R 166.72.1.R 167.48.1.R 168.52.1.R 168.71.1.R 169.57.1.R 170.71.2.R 172.50.1.R 172.69.1.R 173.56.1.R 173.71.1.R 174.72.2.R 176.50.1.R 176.74.1.R 177.55.1.R 177.72.1.R 178.71.1.R 179.50.2.R 179.69.2.R 181.54.1.R 181.72.1.R 182.57.1.R 182.74.1.R 183.76.1.R 184.48.1.R 185.53.1.R 185.74.1.R 186.48.1.R 186.72.1.R 187.71.1.R 188.48.1.R 189.53.1.R 189.69.1.R 190.48.1.R 190.67.1.R 191.55.1.R 191.59.1.R 191.62.1.R 192.57.1.R 192.60.1.R 192.64.1.R 193.57.3.R 193.60.3.R 193.64.3.R 199.48.1.R 200.52.1.R 201.55.1.R 201.72.1.R 202.60.1.R 202.76.1.R 203.50.1.R 203.66.1.R 203.69.1.R 203.74.1.R 204.54.1.R 205.57.1.R 206.62.2.R 208.69.1.R 208.74.1.R 209.48.1.R 210.53.1.R 210.72.1.R 211.57.1.R 211.71.1.R 212.72.1.R 213.48.1.R 213.69.1.R 214.52.1.R 214.69.1.R 215.57.1.R 215.71.1.R 216.48.1.R 216.72.1.R 217.52.1.R 217.74.1.R 218.55.1.R 218.76.1.R 219.60.1.R 219.74.1.R 220.74.1.R 221.72.1.R 222.50.1.R 222.71.1.R 223.55.1.R 224.59.1.R 224.62.1.R 224.67.1.R 225.62.1.R 225.66.1.R 225.69.1.R 226.62.3.R 226.66.3.R 226.69.3.R 230.69.1.R 231.71.1.R 232.64.1.R 232.72.1.R 233.48.2.R 235.52.1.R 235.71.1.R 236.57.1.R 237.64.2.R 237.71.2.R 239.50.1.R 239.69.1.R 240.56.1.R 240.71.1.R 241.67.2.R 241.72.2.R 243.50.1.R 243.74.1.R 244.55.1.R 244.72.1.R 245.71.1.R 246.50.1.R 246.69.1.R 247.54.1.R 247.72.1.R 248.57.1.R 248.74.1.R 249.65.1.R 249.76.1.R 250.48.1.R 251.53.1.R 251.74.1.R 252.48.1.R 252.72.1.R 253.71.1.R 254.48.1.R 254.69.1.R 255.53.1.R 256.48.1.R 256.67.1.R 257.55.1.R 257.59.1.R 257.62.1.R 258.57.1.R 258.60.1.R 258.64.1.R 259.57.3.R 259.60.3.R 259.64.3.R 264.69.1.R 265.71.1.R 266.72.1.R 267.48.1.R 268.52.1.R 268.71.1.R 269.57.1.R 270.71.2.R 272.50.1.R 272.69.1.R 273.56.1.R 273.71.1.R 274.72.2.R 276.50.1.R 276.74.1.R 277.55.1.R 277.72.1.R 278.71.1.R 279.50.1.R 279.69.1.R 280.54.1.R 280.72.1.R 281.57.1.R 281.74.1.R 282.76.1.R 283.48.1.R 284.53.1.R 284.74.1.R 285.48.1.R 285.72.1.R 286.71.1.R 287.48.2.R 289.53.1.R 289.69.1.R 290.48.1.R 290.67.1.R 291.55.1.R 291.59.1.R 291.62.1.R 292.57.1.R 292.60.1.R 292.64.1.R 293.57.3.R 293.60.3.R 293.64.3.R 299.57.1.R 299.72.1.R 299.76.1.R 300.60.1.R 301.64.1.R 302.69.1.R 303.56.1.R 304.60.1.R 305.64.1.R 305.71.1.R 306.60.1.R 306.64.1.R 307.55.1.R 307.60.1.R 307.71.1.R 308.57.1.R 308.60.1.R 309.64.1.R 310.55.1.R 310.57.1.R 310.60.1.R 311.54.1.R 311.57.1.R 312.57.1.R 312.62.1.R 313.66.1.R 314.54.1.R 314.57.1.R 314.62.1.R 315.57.1.R 316.53.1.R 316.57.1.R 317.60.1.R 317.64.1.R 318.57.1.R 318.60.1.R 319.53.1.R 319.57.1.R 320.53.1.R 321.57.1.R 321.60.1.R 322.60.1.R 322.64.1.R 323.53.1.R 323.57.1.R 324.55.1.R 324.59.1.R 324.62.1.R 325.57.1.R 325.60.1.R 325.64.1.R 326.57.3.R 326.60.3.R 326.64.3.R 330.55.2.R 330.62.2.R 332.60.1.R 332.64.1.R 332.67.1.R 333.60.1.R 333.64.1.R 333.67.1.R 334.60.1.R 334.64.1.R 334.67.1.R 335.60.2.R 335.64.2.R 335.67.2.R 337.60.1.R 337.64.1.R 337.67.1.R 338.64.1.R 338.72.1.R 339.60.1.R 339.64.1.R 339.67.1.R 340.50.3.R 340.57.3.R 340.66.3.R 343.50.2.R 343.66.2.R 343.69.2.R 345.50.1.R 346.72.1.R 347.71.1.R 348.72.1.R 349.64.1.R 349.67.1.R 349.71.1.R 350.64.1.R 350.67.1.R 350.69.1.R 351.60.1.R 351.64.1.R 351.67.1.R 352.60.1.R 352.64.1.R 352.67.1.R 353.60.2.R 353.64.2.R 353.67.2.R 355.60.2.R 355.64.2.R 355.67.2.R 357.64.2.R 357.67.2.R 357.71.2.R 359.62.2.R 359.66.2.R 359.69.2.R 361.60.2.R 361.64.2.R 361.67.2.R 363.62.2.R 363.66.2.R 363.69.2.R 365.64.1.R 365.67.1.R 365.72.1.R 366.60.1.R 366.64.1.R 366.67.1.R 367.60.1.R 367.64.1.R 367.67.1.R 368.60.3.R 368.64.3.R 368.67.3.R 371.60.1.R 371.64.1.R 371.67.1.R 372.64.1.R 372.72.1.R 373.60.1.R 373.64.1.R 373.67.1.R 374.50.2.R 374.57.2.R 374.66.2.R 376.50.2.R 376.66.2.R 376.69.2.R 378.50.1.R 379.72.1.R 380.71.1.R 380.72.1.R 381.72.1.R 382.64.1.R 382.67.1.R 382.71.1.R 383.64.1.R 383.67.1.R 383.69.1.R 384.60.1.R 384.64.1.R 384.67.1.R 385.60.1.R 385.64.1.R 385.67.1.R 386.60.2.R 386.64.2.R 386.67.2.R 388.60.2.R 388.64.2.R 388.67.2.R 390.64.2.R 390.67.2.R 390.71.2.R 392.62.2.R 392.66.2.R 392.69.2.R 394.60.3.R 394.64.3.R 394.67.3.R 397.69.1.R 398.71.1.R 399.48.1.R 399.64.1.R 399.72.1.R 400.52.1.R 401.55.1.R 401.71.1.R 402.60.1.R 402.69.1.R 403.62.2.R 403.71.2.R 405.50.1.R 405.69.1.R 406.55.1.R 406.71.1.R 407.64.1.R 407.72.1.R 408.48.1.R 409.52.1.R 409.74.1.R 410.57.1.R 410.72.1.R 411.57.1.R 411.71.1.R 412.52.1.R 412.69.1.R 413.48.1.R 413.72.1.R 414.74.1.R 415.48.1.R 415.67.1.R 415.76.1.R 416.52.1.R 417.55.1.R 417.74.1.R 418.72.1.R 419.71.1.R 420.69.1.R 421.50.1.R 421.67.1.R 422.55.2.R 424.59.1.R 424.62.1.R 424.67.1.R 425.60.1.R 425.64.1.R 425.69.1.R 426.60.3.R 426.64.3.R 426.69.3.R 430.69.1.R 431.71.1.R 432.48.1.R 432.64.1.R 432.72.1.R 433.52.1.R 434.55.1.R 434.74.1.R 435.72.1.R 436.64.1.R 436.71.1.R 437.69.1.R 438.50.1.R 438.69.1.R 439.55.1.R 439.71.1.R 440.64.1.R 440.72.1.R 441.48.1.R 442.52.1.R 442.74.1.R 443.57.1.R 443.72.1.R 444.57.1.R 444.71.1.R 445.52.1.R 445.69.1.R 446.48.1.R 446.72.1.R 447.74.1.R 448.48.1.R 448.67.1.R 448.76.1.R 449.52.2.R 451.55.1.R 451.74.1.R 452.72.1.R 453.48.1.R 453.71.1.R 454.52.1.R 454.69.1.R 455.55.1.R 456.60.1.R 457.59.1.R 457.62.1.R 457.67.1.R 458.60.1.R 458.64.1.R 458.69.1.R 459.60.3.R 459.64.3.R 459.69.3.R 463.57.1.R 464.59.1.R 465.48.1.R 466.52.1.R 467.55.1.R 468.48.1.R 469.59.1.R 470.50.1.R 471.55.1.R 472.59.1.R 473.60.1.R 473.64.1.R 473.67.1.R 474.60.1.R 474.64.1.R 474.67.1.R 475.60.1.R 475.64.1.R 475.67.1.R 476.60.3.R 476.64.3.R 476.67.3.R 479.60.1.R 479.64.1.R 479.67.1.R 480.64.1.R 480.72.1.R 481.60.1.R 481.64.1.R 481.67.1.R 482.50.2.R 482.57.2.R 482.66.2.R 484.50.2.R 484.66.2.R 484.69.2.R 486.50.1.R 487.72.1.R 488.71.1.R 488.72.1.R 489.72.1.R 490.64.1.R 490.67.1.R 490.71.1.R 491.64.1.R 491.67.1.R 491.69.1.R 492.60.1.R 492.64.1.R 492.67.1.R 493.60.1.R 493.64.1.R 493.67.1.R 494.60.2.R 494.64.2.R 494.67.2.R 496.60.2.R 496.64.2.R 496.67.2.R 498.64.2.R 498.67.2.R 498.71.2.R 500.62.2.R 500.66.2.R 500.69.2.R 502.60.3.R 502.64.3.R 502.67.3.R 505.62.2.R 505.66.2.R 505.69.2.R 507.64.1.R 507.67.1.R 507.72.1.R 508.60.1.R 508.64.1.R 508.67.1.R 509.60.1.R 509.64.1.R 509.67.1.R 510.60.2.R 510.64.2.R 510.67.2.R 512.60.1.R 512.64.1.R 512.67.1.R 513.64.1.R 513.72.1.R 514.60.1.R 514.64.1.R 514.67.1.R 515.50.2.R 515.57.2.R 515.66.2.R 517.50.2.R 517.66.2.R 517.69.2.R 519.50.1.R 520.72.1.R 521.71.1.R 521.72.1.R 522.72.1.R 523.64.1.R 523.67.1.R 523.71.1.R 524.64.1.R 524.67.1.R 524.69.1.R 525.60.1.R 525.64.1.R 525.67.1.R 526.60.1.R 526.64.1.R 526.67.1.R 527.60.2.R 527.64.2.R 527.67.2.R 529.60.3.R 529.64.3.R 529.67.3.R 532.64.2.R 532.67.2.R 532.71.2.R 534.62.2.R 534.66.2.R 534.69.2.R 536.60.2.R 536.64.2.R 536.67.2.R 538.69.1.R 539.71.1.R 540.48.1.R 540.64.1.R 540.72.1.R 541.52.1.R 542.55.1.R 542.71.1.R 543.60.1.R 543.69.1.R 544.62.2.R 544.71.2.R 546.50.1.R 546.69.1.R 547.55.1.R 547.71.1.R 548.64.1.R 548.72.1.R 549.48.1.R 550.52.1.R 550.74.1.R 551.57.1.R 551.72.1.R 552.57.1.R 552.71.1.R 553.52.1.R 553.69.1.R 554.48.1.R 554.72.1.R 555.74.1.R 556.48.1.R 556.67.1.R 556.76.1.R 557.52.2.R 559.55.1.R 559.74.1.R 560.72.1.R 561.71.1.R 562.69.1.R 563.50.1.R 563.67.1.R 564.55.1.R 565.59.1.R 565.62.1.R 565.67.1.R 566.60.1.R 566.64.1.R 566.69.1.R 567.60.3.R 567.64.3.R 567.69.3.R 571.69.1.R 572.71.1.R 573.48.1.R 573.64.1.R 573.72.1.R 574.52.1.R 575.55.1.R 575.74.1.R 576.72.1.R 577.64.1.R 577.71.1.R 578.69.1.R 579.50.1.R 579.69.1.R 580.55.1.R 580.71.1.R 581.64.1.R 581.72.1.R 582.48.1.R 583.52.1.R 583.74.1.R 584.57.2.R 584.72.2.R 586.57.1.R 586.71.1.R 587.52.1.R 587.69.1.R 588.48.1.R 588.72.1.R 589.74.1.R 590.48.1.R 590.67.1.R 590.76.1.R 591.52.1.R 592.55.1.R 592.74.1.R 593.72.1.R 594.48.1.R 594.71.1.R 595.52.1.R 595.69.1.R 596.55.1.R 597.60.1.R 598.59.1.R 598.62.1.R 598.67.1.R 599.60.1.R 599.64.1.R 599.69.1.R 600.60.3.R 600.64.3.R 600.69.3.R 604.57.1.R 605.59.1.R 606.48.1.R 607.52.1.R 608.55.1.R 609.48.1.R 610.59.1.R 611.50.2.R 613.55.1.R 614.59.1.R 615.60.1.R 615.64.1.R 615.67.1.R 616.60.1.R 616.64.1.R 616.67.1.R 617.60.1.R 617.64.1.R 617.67.1.R 618.60.2.R 618.64.2.R 618.67.2.R 620.60.1.R 620.64.1.R 620.67.1.R 621.64.1.R 621.72.1.R 622.60.1.R 622.64.1.R 622.67.1.R 623.50.2.R 623.57.2.R 623.66.2.R 625.50.2.R 625.66.2.R 625.69.2.R 627.50.2.R 627.66.2.R 627.69.2.R 629.62.2.R 629.66.2.R 629.69.2.R 631.60.1.R 631.64.1.R 631.67.1.R 632.60.1.R 632.64.1.R 632.67.1.R 633.60.1.R 633.64.1.R 633.67.1.R 634.60.2.R 634.64.2.R 634.67.2.R 636.60.1.R 636.64.1.R 636.67.1.R 637.60.3.R 637.64.3.R 637.67.3.R 640.64.2.R 640.67.2.R 640.71.2.R 642.62.2.R 642.66.2.R 642.69.2.R 644.60.2.R 644.64.2.R 644.67.2.R 646.62.2.R 646.66.2.R 646.69.2.R 648.64.1.R 648.67.1.R 648.72.1.R 649.60.1.R 649.64.1.R 649.67.1.R 650.60.1.R 650.64.1.R 650.67.1.R 651.60.2.R 651.64.2.R 651.67.2.R 653.60.1.R 653.64.1.R 653.67.1.R 654.64.1.R 654.72.1.R 655.60.1.R 655.64.1.R 655.67.1.R 656.50.2.R 656.57.2.R 656.66.2.R 658.50.2.R 658.66.2.R 658.69.2.R 660.50.2.R 660.66.2.R 660.69.2.R 662.62.2.R 662.66.2.R 662.69.2.R 664.60.1.R 664.64.1.R 664.67.1.R 665.60.1.R 665.64.1.R 665.67.1.R 666.60.1.R 666.64.1.R 666.67.1.R 667.60.1.R 667.64.1.R 667.67.1.R 668.60.2.R 668.64.2.R 668.67.2.R 670.60.1.R 670.64.1.R 670.67.1.R 671.60.2.R 671.64.2.R 671.67.2.R 673.64.2.R 673.67.2.R 673.71.2.R 675.62.2.R 675.66.2.R 675.69.2.R 677.60.2.R 677.64.2.R 677.67.2.R 679.62.2.R 679.66.2.R 679.69.2.R 681.48.1.R 682.52.1.R 682.76.1.R 683.55.1.R 683.74.1.R 684.72.1.R 685.74.1.R 686.72.1.R 687.50.1.R 687.69.1.R 688.55.1.R 689.69.1.R 690.48.1.R 690.72.1.R 691.52.1.R 692.57.1.R 693.67.1.R 693.69.1.R 694.69.1.R 695.48.1.R 695.64.1.R 696.52.1.R 697.57.1.R 698.48.1.R 699.52.1.R 699.71.1.R 700.55.1.R 700.72.1.R 701.60.1.R 701.76.1.R 702.74.1.R 703.72.1.R 704.50.1.R 704.69.1.R 705.55.1.R 706.72.2.R 708.60.3.R 708.64.3.R 708.69.3.R 714.48.1.R 715.52.1.R 715.76.1.R 716.55.1.R 716.74.1.R 717.72.1.R 718.74.1.R 719.72.2.R 721.50.1.R 721.69.1.R 722.55.1.R 723.69.1.R 724.48.1.R 724.72.1.R 725.52.1.R 725.69.1.R 726.57.1.R 726.67.1.R 727.69.1.R 728.48.1.R 728.64.1.R 729.52.1.R 730.57.1.R 731.48.1.R 732.52.1.R 732.72.1.R 733.55.1.R 733.72.1.R 734.60.1.R 734.76.1.R 735.74.1.R 736.71.1.R 737.50.1.R 737.72.1.R 738.55.1.R 738.69.1.R 739.72.1.R 740.72.1.R 741.60.3.R 741.64.3.R 741.69.3.R 745.57.1.R 746.59.2.R 748.48.1.R 749.52.1.R 750.55.1.R 751.48.1.R 752.59.1.R 753.50.1.R 754.55.1.R 755.59.1.R 756.60.1.R 756.64.1.R 756.67.1.R 757.60.1.R 757.64.1.R 757.67.1.R 758.60.1.R 758.64.1.R 758.67.1.R 759.60.2.R 759.64.2.R 759.67.2.R 761.60.1.R 761.64.1.R 761.67.1.R 762.64.1.R 762.72.1.R 763.60.1.R 763.64.1.R 763.67.1.R 764.50.2.R 764.57.2.R 764.66.2.R 766.50.2.R 766.66.2.R 766.69.2.R 768.50.1.R 769.72.1.R 770.71.1.R 770.72.1.R 771.72.1.R 772.64.1.R 772.67.1.R 772.71.1.R 773.64.2.R 773.67.2.R 773.69.2.R 775.60.1.R 775.64.1.R 775.67.1.R 776.60.1.R 776.64.1.R 776.67.1.R 777.60.2.R 777.64.2.R 777.67.2.R 779.60.2.R 779.64.2.R 779.67.2.R 781.64.2.R 781.67.2.R 781.71.2.R 783.62.2.R 783.66.2.R 783.69.2.R 785.60.2.R 785.64.2.R 785.67.2.R 787.62.2.R 787.66.2.R 787.69.2.R 789.64.1.R 789.67.1.R 789.72.1.R 790.60.1.R 790.64.1.R 790.67.1.R 791.60.1.R 791.64.1.R 791.67.1.R 792.60.2.R 792.64.2.R 792.67.2.R 794.60.1.R 794.64.1.R 794.67.1.R 795.64.1.R 795.72.1.R 796.60.1.R 796.64.1.R 796.67.1.R 797.50.2.R 797.57.2.R 797.66.2.R 799.50.3.R 799.66.3.R 799.69.3.R 802.50.1.R 803.72.1.R 804.71.1.R 805.72.1.R 806.64.1.R 806.67.1.R 806.71.1.R 807.64.1.R 807.67.1.R 807.69.1.R 808.60.1.R 808.64.1.R 808.67.1.R 809.60.1.R 809.64.1.R 809.67.1.R 810.60.2.R 810.64.2.R 810.67.2.R 812.60.2.R 812.64.2.R 812.67.2.R 814.64.2.R 814.67.2.R 814.71.2.R 816.62.2.R 816.66.2.R 816.69.2.R 818.60.2.R 818.64.2.R 818.67.2.R 820.62.2.R 820.66.2.R 820.69.2.R 822.48.1.R 823.52.1.R 823.76.1.R 824.55.1.R 824.74.1.R 825.72.1.R 826.74.1.R 827.72.2.R 829.50.1.R 829.69.1.R 830.55.1.R 831.69.1.R 832.48.1.R 832.72.1.R 833.52.1.R 833.69.1.R 834.57.1.R 834.67.1.R 835.69.1.R 836.48.1.R 836.64.1.R 837.52.1.R 838.57.1.R 839.48.1.R 840.52.1.R 840.71.1.R 841.55.1.R 841.72.1.R 842.60.1.R 842.76.1.R 843.74.1.R 844.72.1.R 845.50.1.R 845.69.1.R 846.55.1.R 847.72.2.R 849.60.3.R 849.64.3.R 849.69.3.R 856.48.1.R 857.52.1.R 857.76.1.R 858.55.1.R 858.74.1.R 859.72.1.R 860.74.1.R 861.72.1.R 862.50.1.R 862.69.1.R 863.55.1.R 864.69.1.R 865.48.1.R 865.72.1.R 866.52.1.R 867.57.1.R 868.67.1.R 868.69.1.R 869.48.1.R 869.64.1.R 869.69.1.R 870.52.1.R 871.57.1.R 872.48.1.R 873.52.1.R 873.72.1.R 874.55.1.R 874.72.1.R 875.60.1.R 875.76.1.R 876.74.1.R 877.71.1.R 878.50.1.R 878.72.1.R 879.55.1.R 879.69.1.R 880.72.1.R 881.72.2.R 883.60.3.R 883.64.3.R 883.69.3.R 887.57.1.R 888.59.1.R 889.48.1.R 890.52.1.R 891.55.1.R 892.48.1.R 893.59.1.R 894.50.1.R 895.55.1.R 896.59.1.R 897.54.3.R 897.57.3.R 897.62.3.R 905.52.1.R 905.57.1.R 905.62.1.R 906.54.1.R 906.57.1.R 906.62.1.R 907.55.3.R 907.62.3.R 910.52.1.R 910.54.1.R 910.57.1.R 910.62.1.R 911.55.3.R 911.62.3.R 914.52.1.R 914.54.1.R 914.57.1.R 914.62.1.R 915.55.2.R 915.62.2.R 917.55.2.R 917.62.2.R 919.54.3.R 919.57.3.R 919.62.3.R 922.55.1.R 922.60.1.R 922.64.1.R 923.48.1.R 924.48.1.R 924.55.1.R 925.60.3.R 925.62.3.R 925.66.3.R 928.60.2.R 928.64.2.R 930.60.1.R 930.64.1.R 931.48.1.R 932.48.1.R 932.55.1.R 933.60.3.R 933.62.3.R 933.66.3.R 939.52.1.R 939.54.1.R 939.57.1.R 939.62.1.R 940.55.3.R 940.62.3.R 943.52.1.R 943.54.1.R 943.57.1.R 943.62.1.R 944.55.3.R 944.62.3.R 947.52.1.R 947.57.1.R 948.54.1.R 948.57.1.R 948.62.1.R 949.55.1.R 949.62.1.R 950.55.2.R 950.62.2.R 952.54.3.R 952.57.3.R 952.62.3.R 955.55.1.R 955.60.1.R 955.64.1.R 956.48.1.R 957.48.1.R 957.55.1.R 958.48.3.R 958.55.3.R 958.62.3.R 958.66.3.R 961.60.3.R 961.64.3.R 964.55.1.R 964.60.1.R 964.64.1.R 965.48.1.R 966.48.1.R 966.55.1.R 967.48.3.R 967.55.3.R 967.62.3.R 967.66.3.R 970.57.1.R 970.59.1.R 970.62.1.R 971.55.1.R 972.57.2.R 972.64.2.R 974.52.2.R 974.57.2.R 976.52.1.R 976.57.1.R 977.67.1.R 978.50.1.R 978.55.1.R 978.64.1.R 979.57.1.R 979.60.1.R 979.62.1.R 980.50.1.R 980.55.1.R 980.57.1.R 980.60.1.R 981.48.1.R 981.53.1.R 981.55.1.R 982.48.2.R 982.53.2.R 984.48.1.R 984.53.1.R 985.48.1.R 985.53.1.R 985.69.1.R 986.48.1.R 986.53.1.R 986.72.1.R 987.72.1.R 988.74.3.R 991.52.1.R 991.72.1.R 992.52.1.R 992.60.1.R 992.69.1.R 993.67.1.R 994.69.1.R 995.50.1.R 995.59.1.R 995.72.1.R 996.50.1.R 996.59.1.R 996.74.1.R 997.69.1.R 997.72.1.R 998.65.1.R 998.67.1.R 999.48.2.R 999.57.2.R 1001.48.1.R 1001.57.1.R 1002.48.1.R 1002.57.1.R 1002.63.1.R 1003.48.1.R 1003.57.1.R 1003.64.1.R 1004.67.1.R 1004.69.1.R 1005.63.1.R 1005.64.1.R 1006.57.1.R 1006.60.1.R 1006.62.1.R 1007.52.1.R 1007.57.1.R 1007.60.1.R 1008.55.1.R 1009.52.1.R 1009.55.1.R 1009.57.1.R 1010.57.1.R 1010.60.1.R 1011.50.1.R 1011.55.1.R 1011.57.1.R 1011.60.1.R 1012.60.1.R 1013.50.1.R 1013.55.1.R 1014.48.1.R 1014.53.1.R 1014.69.1.R 1015.48.1.R 1015.53.1.R 1015.67.1.R 1016.62.1.R 1016.64.1.R 1017.48.1.R 1017.53.1.R 1017.57.1.R 1018.48.1.R 1018.53.1.R 1018.62.1.R 1019.55.1.R 1019.57.1.R 1020.48.2.R 1020.53.2.R 1020.55.2.R 1022.57.1.R 1023.60.1.R 1023.65.1.R 1024.52.1.R 1024.60.1.R 1024.62.1.R 1025.52.1.R 1025.57.1.R 1025.60.1.R 1026.62.1.R 1027.64.1.R 1028.50.1.R 1028.59.1.R 1028.67.1.R 1029.69.1.R 1029.72.1.R 1030.50.1.R 1030.59.1.R 1030.76.1.R 1031.74.1.R 1032.48.1.R 1032.57.1.R 1032.72.1.R 1033.72.1.R 1033.74.1.R 1034.48.1.R 1034.57.1.R 1034.81.1.R 1035.48.1.R 1035.57.1.R 1035.79.1.R 1036.48.1.R 1036.57.1.R 1036.77.1.R 1037.74.1.R 1037.76.1.R 1038.69.1.R 1038.72.1.R 1039.76.1.R 1040.52.1.R 1040.57.1.R 1040.72.1.R 1040.74.1.R 1041.72.1.R 1041.76.1.R 1042.52.1.R 1042.57.1.R 1042.72.1.R 1042.74.1.R 1043.72.1.R 1043.76.1.R 1044.69.1.R 1044.72.1.R 1044.74.1.R 1045.50.1.R 1045.55.1.R 1045.72.1.R 1045.76.1.R 1046.50.1.R 1046.55.1.R 1046.69.1.R 1046.74.1.R 1047.48.1.R 1047.53.1.R 1047.72.1.R 1047.76.1.R 1048.69.1.R 1048.74.1.R 1049.48.1.R 1049.53.1.R 1049.72.1.R 1049.76.1.R 1050.48.1.R 1050.53.1.R 1050.69.1.R 1050.74.1.R 1051.48.1.R 1051.53.1.R 1051.72.1.R 1051.76.1.R 1052.69.1.R 1052.74.1.R 1053.48.1.R 1053.53.1.R 1053.72.1.R 1054.76.1.R 1055.69.1.R 1055.72.1.R 1055.74.1.R 1056.72.1.R 1056.76.1.R 1057.52.1.R 1057.69.1.R 1057.72.1.R 1057.74.1.R 1058.72.1.R 1058.81.1.R 1059.52.2.R 1059.60.2.R 1061.50.2.R 1061.59.2.R 1063.50.1.R 1063.59.1.R 1064.79.1.R 1065.48.1.R 1065.57.1.R 1065.76.1.R 1065.79.1.R 1066.74.1.R 1066.77.1.R 1067.48.1.R 1067.57.1.R 1067.72.1.R 1068.48.1.R 1068.57.1.R 1068.74.1.R 1069.48.1.R 1069.57.1.R 1069.72.1.R 1069.76.1.R 1070.79.1.R 1071.74.1.R 1071.76.1.R 1072.69.2.R 1072.72.2.R 1074.52.1.R 1074.57.1.R 1074.72.1.R 1075.52.3.R 1075.57.3.R 1075.59.3.R 1078.50.1.R 1078.55.1.R 1078.64.1.R 1078.72.1.R 1079.50.2.R 1079.55.2.R 1079.57.2.R 1081.76.1.R 1082.48.1.R 1082.52.1.R 1082.57.1.R 1082.79.1.R 1083.81.1.R 1084.48.1.R 1084.52.1.R 1084.57.1.R 1084.79.1.R 1085.48.1.R 1085.52.1.R 1085.57.1.R 1085.76.1.R 1086.48.1.R 1086.52.1.R 1086.57.1.R 1086.72.1.R 1087.69.1.R 1087.72.1.R 1087.74.1.R 1088.72.1.R 1089.76.1.R 1090.52.1.R 1090.57.1.R 1090.72.1.R 1091.59.1.R 1092.52.2.R 1092.57.2.R 1094.50.1.R 1094.55.1.R 1094.64.1.R 1094.72.1.R 1095.57.1.R 1096.50.1.R 1096.55.1.R 1097.64.2.R 1097.72.2.R 1099.48.1.R 1099.52.1.R 1099.57.1.R 1100.48.1.R 1100.52.1.R 1100.57.1.R 1101.48.1.R 1101.52.1.R 1101.57.1.R 1101.59.1.R 1101.62.1.R 1102.57.1.R 1102.60.1.R 1103.48.1.R 1103.52.1.R 1103.55.1.R 1103.57.1.R 1103.59.1.R 1104.55.3.R 1104.57.3.R 1104.59.3.R 1104.60.3.R 1107.52.1.R 1107.57.1.R 1107.72.1.R 1108.59.1.R 1109.52.2.R 1109.57.2.R 1111.50.1.R 1111.55.1.R 1111.64.1.R 1111.72.1.R 1112.57.1.R 1113.50.1.R 1113.55.1.R 1114.65.1.R 1115.48.1.R 1115.52.1.R 1115.57.1.R 1115.66.1.R 1115.68.1.R 1116.67.1.R 1117.48.1.R 1117.52.1.R 1117.57.1.R 1118.48.1.R 1118.52.1.R 1118.57.1.R 1118.62.1.R 1119.48.1.R 1119.52.1.R 1119.57.1.R 1120.60.1.R 1120.62.1.R 1121.60.1.R 1121.62.1.R 1122.57.1.R 1122.60.1.R 1122.62.1.R 1123.52.1.R 1123.57.1.R 1123.72.1.R 1124.59.1.R 1125.52.3.R 1125.57.3.R 1128.50.1.R 1128.55.1.R 1128.64.1.R 1128.72.1.R 1129.50.1.R 1129.55.1.R 1129.57.1.R 1130.48.1.R 1130.53.1.R 1130.76.1.R 1131.48.1.R 1131.53.1.R 1131.84.1.R 1132.76.1.R 1132.81.1.R 1133.48.1.R 1133.53.1.R 1133.76.1.R 1133.81.1.R 1133.84.1.R 1134.81.1.R 1134.84.1.R 1135.48.1.R 1135.53.1.R 1135.76.1.R 1135.81.1.R 1135.84.1.R 1136.48.1.R 1136.53.1.R 1136.76.1.R 1136.86.1.R 1137.50.2.R 1137.55.2.R 1139.57.1.R 1139.60.1.R 1140.52.1.R 1140.57.1.R 1140.60.1.R 1141.57.1.R 1141.60.1.R 1142.64.1.R 1142.72.1.R 1143.59.1.R 1143.62.1.R 1144.50.1.R 1144.55.1.R 1144.57.1.R 1144.60.1.R 1145.55.1.R 1145.59.1.R 1146.48.1.R 1146.53.1.R 1146.57.1.R 1147.57.1.R 1147.60.1.R 1147.65.1.R 1148.48.1.R 1148.53.1.R 1148.57.1.R 1149.48.2.R 1149.53.2.R 1149.57.2.R 1151.48.2.R 1151.53.2.R 1151.57.2.R 1153.48.1.R 1153.53.1.R 1153.57.1.R 1154.59.2.R 1154.62.2.R 1154.67.2.R 1156.57.1.R 1156.60.1.R 1157.52.1.R 1157.57.1.R 1157.60.1.R 1158.57.1.R 1158.60.1.R 1159.59.1.R 1159.62.1.R 1159.64.1.R 1159.72.1.R 1160.57.1.R 1160.60.1.R 1161.50.1.R 1161.55.1.R 1161.59.1.R 1162.59.1.R 1162.62.1.R 1163.48.1.R 1163.53.1.R 1164.57.1.R 1164.60.1.R 1165.48.1.R 1165.53.1.R 1166.48.2.R 1166.53.2.R 1166.57.2.R 1168.48.1.R 1168.53.1.R 1168.57.1.R 1169.48.1.R 1169.53.1.R 1169.57.1.R 1170.59.2.R 1170.62.2.R 1170.67.2.R 1172.57.1.R 1172.60.1.R 1173.52.1.R 1173.57.1.R 1173.60.1.R 1174.57.1.R 1174.60.1.R 1175.72.1.R 1175.76.1.R 1176.71.1.R 1176.74.1.R 1177.50.1.R 1177.55.1.R 1177.69.1.R 1177.72.1.R 1178.59.1.R 1178.67.1.R 1179.62.1.R 1179.67.1.R 1179.71.1.R 1180.48.1.R 1180.53.1.R 1181.48.2.R 1181.53.2.R 1181.57.2.R 1183.48.1.R 1183.53.1.R 1183.57.1.R 1184.48.2.R 1184.53.2.R 1184.57.2.R 1186.48.1.R 1186.53.1.R 1186.57.1.R 1187.59.2.R 1187.62.2.R 1187.67.2.R 1189.57.1.R 1189.60.1.R 1190.52.1.R 1190.57.1.R 1190.60.1.R 1191.57.1.R 1191.60.1.R 1192.72.1.R 1192.76.1.R 1193.71.1.R 1193.74.1.R 1194.50.1.R 1194.69.1.R 1194.72.1.R 1195.59.1.R 1195.67.1.R 1196.48.1.R 1196.53.1.R 1196.59.1.R 1196.67.1.R 1197.57.1.R 1197.65.1.R 1198.48.1.R 1198.53.1.R 1199.48.2.R 1199.53.2.R 1199.57.2.R 1201.48.1.R 1201.53.1.R 1201.57.1.R 1202.48.1.R 1202.53.1.R 1202.57.1.R 1203.59.2.R 1203.62.2.R 1203.67.2.R 1205.72.2.R 1205.81.2.R 1207.52.1.R 1207.72.1.R 1207.81.1.R 1208.76.2.R 1208.81.2.R 1208.84.2.R 1210.74.1.R 1210.83.1.R 1211.50.1.R 1211.72.1.R 1211.81.1.R 1212.71.1.R 1212.72.1.R 1212.79.1.R 1212.81.1.R 1213.48.1.R 1213.53.1.R 1214.48.2.R 1214.53.2.R 1214.69.2.R 1216.48.1.R 1216.53.1.R 1216.72.1.R 1217.65.1.R 1218.48.1.R 1218.53.1.R 1218.76.1.R 1219.48.1.R 1219.53.1.R 1219.74.1.R 1220.65.2.R 1220.72.2.R 1222.72.1.R 1222.81.1.R 1223.52.1.R 1223.72.1.R 1223.81.1.R 1224.72.1.R 1224.81.1.R 1225.76.1.R 1225.84.1.R 1226.74.1.R 1226.83.1.R 1227.50.1.R 1227.72.1.R 1227.81.1.R 1228.74.1.R 1228.83.1.R 1229.48.1.R 1229.53.1.R 1230.72.1.R 1230.81.1.R 1231.48.1.R 1231.53.1.R 1231.69.1.R 1232.48.1.R 1232.53.1.R 1232.72.1.R 1233.65.1.R 1234.48.1.R 1234.53.1.R 1234.76.1.R 1235.65.1.R 1236.48.1.R 1236.53.1.R 1236.74.1.R 1237.65.2.R 1237.72.2.R 1239.72.1.R 1239.81.1.R 1240.52.1.R 1240.72.1.R 1240.81.1.R 1241.81.2.R 1241.84.2.R 1241.88.2.R 1243.83.1.R 1243.86.1.R 1244.50.1.R 1244.81.1.R 1244.84.1.R 1245.79.1.R 1245.83.1.R 1246.48.1.R 1246.53.1.R 1246.79.1.R 1246.83.1.R 1247.65.1.R 1248.48.1.R 1248.53.1.R 1248.69.1.R 1249.48.1.R 1249.53.1.R 1249.72.1.R 1250.65.1.R 1251.48.1.R 1251.53.1.R 1251.76.1.R 1252.48.1.R 1252.53.1.R 1252.74.1.R 1253.65.2.R 1253.72.2.R 1255.72.1.R 1255.81.1.R 1256.52.1.R 1256.57.1.R 1256.72.1.R 1256.81.1.R 1257.72.1.R 1257.81.1.R 1258.84.1.R 1258.88.1.R 1259.83.2.R 1259.86.2.R 1261.50.1.R 1261.55.1.R 1261.81.1.R 1261.84.1.R 1262.83.1.R 1262.84.1.R 1262.86.1.R 1262.88.1.R 1263.83.1.R 1263.86.1.R 1264.48.1.R 1264.79.1.R 1264.81.1.R 1264.83.1.R 1264.84.1.R 1265.48.1.R 1265.57.1.R 1266.48.1.R 1266.57.1.R 1267.48.2.R 1267.57.2.R 1269.48.3.R 1269.57.3.R 1272.72.1.R 1272.81.1.R 1273.52.1.R 1273.57.1.R 1273.72.1.R 1273.81.1.R 1274.52.1.R 1274.57.1.R 1274.72.1.R 1274.81.1.R 1275.52.1.R 1275.57.1.R 1275.76.1.R 1275.84.1.R 1276.74.1.R 1276.83.1.R 1277.50.1.R 1277.55.1.R 1277.72.1.R 1277.81.1.R 1278.50.1.R 1278.55.1.R 1278.74.1.R 1278.83.1.R 1279.50.1.R 1279.55.1.R 1279.76.1.R 1279.84.1.R 1280.48.1.R 1281.48.2.R 1281.57.2.R 1283.48.1.R 1283.57.1.R 1284.48.1.R 1284.57.1.R 1285.48.3.R 1285.57.3.R 1288.52.2.R 1290.52.1.R 1290.57.1.R 1290.60.1.R 1291.52.1.R 1292.55.2.R 1294.52.1.R 1294.57.1.R 1295.52.2.R 1295.57.2.R 1297.48.1.R 1298.48.2.R 1298.57.2.R 1298.64.2.R 1300.48.1.R 1300.57.1.R 1300.64.1.R 1301.48.1.R 1301.57.1.R 1301.64.1.R 1302.48.2.R 1302.50.2.R 1304.52.2.R 1306.52.2.R 1306.57.2.R 1306.60.2.R 1308.52.2.R 1308.55.2.R 1310.52.2.R 1310.57.2.R 1312.52.1.R 1312.72.1.R 1313.48.2.R 1315.48.1.R 1315.57.1.R 1315.64.1.R 1316.48.1.R 1316.57.1.R 1316.64.1.R 1317.48.2.R 1317.57.2.R 1317.64.2.R 1319.48.3.R 1319.59.3.R 1322.72.1.R 1323.52.2.R 1325.52.2.R 1325.59.2.R 1327.52.1.R 1328.72.1.R 1329.52.2.R 1331.48.2.R 1331.57.2.R 1331.59.2.R 1333.48.1.R 1333.57.1.R 1334.48.1.R 1334.57.1.R 1334.72.1.R 1335.48.2.R 1337.59.2.R 1337.74.2.R 1339.52.3.R 1339.57.3.R 1339.72.3.R 1342.59.2.R 1342.62.2.R 1344.50.2.R 1344.55.2.R 1344.65.2.R 1344.74.2.R 1346.48.3.R 1346.57.3.R 1346.64.3.R 1346.72.3.R 1354.60.2.R 1356.62.2.R 1358.64.2.R 1360.62.2.R 1362.60.2.R 1364.59.2.R 1366.60.1.R 1367.59.2.R 1369.57.1.R 1370.55.3.R 1374.55.1.R 1375.60.1.R 1376.55.1.R 1377.57.3.R';
const STH_HARD = '25.47.1.L 26.45.1.L 27.45.3.L 30.45.3.L 33.45.12.L 58.47.1.L 59.45.1.L 60.45.4.L 64.45.1.L 65.47.12.L 81.45.1.L 82.47.12.L 97.45.1.L 98.47.12.L 114.45.1.L 115.47.12.L 133.45.4.L 137.44.1.L 138.47.3.L 141.43.1.L 142.47.3.L 145.42.4.L 149.41.5.L 154.41.4.L 158.47.1.L 159.45.1.L 160.45.6.L 166.45.4.L 170.44.1.L 171.47.3.L 174.43.1.L 175.47.3.L 178.42.5.L 183.41.4.L 187.41.4.L 191.47.1.L 192.45.1.L 193.45.4.L 197.45.1.L 198.47.10.L 208.41.4.L 212.45.8.L 220.43.1.L 221.47.3.L 224.43.1.L 225.45.1.L 226.45.6.L 232.45.5.L 237.44.1.L 238.47.3.L 241.43.1.L 242.47.3.L 245.42.4.L 249.41.4.L 253.41.4.L 257.47.1.L 258.45.1.L 259.45.7.L 266.45.4.L 270.44.1.L 271.47.3.L 274.43.1.L 275.47.3.L 278.42.4.L 282.41.4.L 286.41.5.L 291.47.1.L 292.45.1.L 293.45.12.L 332.45.1.L 333.45.1.L 334.45.1.L 335.45.2.L 337.45.1.L 338.45.1.L 339.45.10.L 349.45.1.L 350.45.1.L 351.45.1.L 352.45.1.L 353.45.2.L 355.45.2.L 357.40.2.L 357.52.2.L 359.38.2.L 359.50.2.L 361.36.2.L 361.48.2.L 363.38.2.L 363.50.2.L 365.45.1.L 366.45.1.L 367.45.1.L 368.45.3.L 371.45.1.L 372.45.1.L 373.45.9.L 382.45.1.L 383.45.1.L 384.45.1.L 385.45.1.L 386.45.2.L 388.45.2.L 390.40.2.L 390.52.2.L 392.38.2.L 392.50.2.L 394.36.3.L 394.48.3.L 397.38.6.L 397.50.6.L 403.43.1.L 404.47.3.L 407.45.7.L 414.45.5.L 419.43.1.L 420.47.4.L 424.43.1.L 425.45.1.L 426.45.10.L 436.43.1.L 437.47.3.L 440.45.7.L 447.45.10.L 457.43.1.L 458.45.1.L 459.45.4.L 463.45.1.L 464.47.5.L 469.47.3.L 472.47.1.L 473.45.1.L 474.45.1.L 475.45.1.L 476.45.3.L 479.45.1.L 480.45.1.L 481.45.9.L 490.45.1.L 491.45.1.L 492.45.1.L 493.45.1.L 494.45.2.L 496.45.2.L 498.40.2.L 498.52.2.L 500.38.2.L 500.50.2.L 502.36.3.L 502.48.3.L 505.38.2.L 505.50.2.L 507.45.1.L 508.45.1.L 509.45.1.L 510.45.2.L 512.45.1.L 513.45.1.L 514.45.9.L 523.45.1.L 524.45.1.L 525.45.1.L 526.45.1.L 527.45.2.L 529.45.3.L 532.40.2.L 532.52.2.L 534.38.2.L 534.50.2.L 536.36.2.L 536.48.2.L 538.38.6.L 538.50.6.L 544.43.1.L 545.47.3.L 548.45.7.L 555.45.6.L 561.43.1.L 562.47.3.L 565.43.1.L 566.45.1.L 567.45.10.L 577.43.1.L 578.47.3.L 581.45.8.L 589.45.9.L 598.43.1.L 599.45.1.L 600.45.4.L 604.45.1.L 605.47.5.L 610.47.4.L 614.47.1.L 615.45.1.L 616.45.1.L 617.45.1.L 618.45.2.L 620.45.1.L 621.45.1.L 622.45.9.L 631.45.1.L 632.45.1.L 633.45.1.L 634.45.1.L 635.45.2.L 637.45.3.L 640.40.2.L 640.52.2.L 642.38.2.L 642.50.2.L 644.36.2.L 644.48.2.L 646.38.2.L 646.50.2.L 648.45.1.L 649.45.1.L 650.45.1.L 651.45.2.L 653.45.1.L 654.45.1.L 655.45.9.L 664.45.1.L 665.45.2.L 667.45.1.L 668.45.1.L 669.45.2.L 671.45.2.L 673.40.2.L 673.52.2.L 675.38.2.L 675.50.2.L 677.36.2.L 677.48.2.L 679.38.6.L 679.50.6.L 685.43.1.L 686.47.3.L 689.45.5.L 694.45.8.L 702.43.1.L 703.47.3.L 706.41.2.L 708.45.4.L 712.45.1.L 713.47.5.L 718.43.1.L 719.47.4.L 723.45.4.L 727.45.8.L 735.43.1.L 736.47.3.L 739.41.2.L 741.45.4.L 745.45.1.L 746.47.6.L 752.47.3.L 755.47.1.L 756.45.1.L 757.45.1.L 758.45.1.L 759.45.2.L 761.45.1.L 762.45.1.L 763.45.9.L 772.45.1.L 773.45.2.L 775.45.1.L 776.45.1.L 777.45.2.L 779.45.2.L 781.40.2.L 781.52.2.L 783.38.2.L 783.50.2.L 785.36.2.L 785.48.2.L 787.38.2.L 787.50.2.L 789.45.1.L 790.45.1.L 791.45.1.L 792.45.2.L 794.45.1.L 795.45.1.L 796.45.10.L 806.45.1.L 807.45.1.L 808.45.1.L 809.45.1.L 810.45.2.L 812.45.2.L 814.40.2.L 814.52.2.L 816.38.2.L 816.50.2.L 818.36.2.L 818.48.2.L 820.38.6.L 820.50.6.L 826.43.1.L 827.47.4.L 831.45.4.L 835.45.8.L 843.43.1.L 844.47.3.L 847.41.2.L 849.45.4.L 853.45.1.L 854.47.6.L 860.43.1.L 861.47.3.L 864.45.4.L 868.45.8.L 876.43.1.L 877.47.3.L 880.41.3.L 883.45.4.L 887.45.1.L 888.47.5.L 893.47.3.L 896.47.1.L 897.38.7.L 897.45.7.L 904.38.1.L 905.38.1.L 905.45.1.L 905.50.1.L 906.38.1.L 906.45.1.L 906.50.1.L 907.38.3.L 907.45.3.L 907.50.3.L 910.38.1.L 910.45.1.L 910.50.1.L 911.38.3.L 911.45.3.L 911.50.3.L 914.38.1.L 914.45.1.L 914.50.1.L 915.38.2.L 915.45.2.L 915.50.2.L 917.38.2.L 917.45.2.L 917.50.2.L 919.38.3.L 919.45.3.L 919.50.3.L 922.36.4.L 922.43.4.L 922.48.4.L 926.36.2.L 926.43.2.L 926.48.2.L 928.36.1.L 928.48.1.L 929.36.1.L 930.36.4.L 930.43.4.L 930.48.4.L 934.36.3.L 934.43.3.L 934.48.3.L 937.36.1.L 937.48.1.L 938.36.1.L 939.38.1.L 939.45.1.L 939.50.1.L 940.38.3.L 940.45.3.L 940.50.3.L 943.38.1.L 943.45.1.L 943.50.1.L 944.38.3.L 944.45.3.L 944.50.3.L 947.38.1.L 947.45.1.L 947.50.1.L 948.38.1.L 948.45.1.L 948.50.1.L 949.38.1.L 949.45.1.L 949.50.1.L 950.38.2.L 950.45.2.L 950.50.2.L 952.38.3.L 952.45.3.L 952.50.3.L 955.36.4.L 955.43.4.L 955.48.4.L 959.36.1.L 959.43.1.L 959.48.1.L 960.36.1.L 960.43.1.L 960.48.1.L 961.36.1.L 961.48.1.L 962.36.2.L 964.36.4.L 964.43.4.L 964.48.4.L 968.36.1.L 968.43.1.L 968.48.1.L 969.36.1.L 969.43.1.L 969.48.1.L 970.36.1.L 970.48.1.L 971.36.1.L 972.33.1.L 972.45.1.L 973.45.3.L 976.43.1.L 977.43.3.L 980.41.3.L 983.41.2.L 985.41.2.L 987.43.1.L 988.45.1.L 989.45.3.L 992.45.1.L 993.43.1.L 994.43.2.L 996.43.1.L 997.41.1.L 998.41.4.L 1002.41.2.L 1004.43.1.L 1005.33.1.L 1005.45.1.L 1006.45.3.L 1009.43.1.L 1010.43.3.L 1013.41.3.L 1016.41.3.L 1019.41.2.L 1021.43.1.L 1022.45.1.L 1023.45.2.L 1025.45.1.L 1026.43.1.L 1027.43.2.L 1029.43.1.L 1030.41.1.L 1031.41.4.L 1035.41.2.L 1037.43.1.L 1038.33.1.L 1038.45.1.L 1039.45.3.L 1042.43.1.L 1043.43.4.L 1047.41.3.L 1050.41.2.L 1052.41.2.L 1054.43.1.L 1055.45.1.L 1056.45.2.L 1058.45.1.L 1059.43.1.L 1060.43.2.L 1062.43.1.L 1063.41.1.L 1064.41.4.L 1068.41.2.L 1070.43.2.L 1072.33.1.L 1072.45.1.L 1073.45.2.L 1075.45.1.L 1076.43.1.L 1077.43.2.L 1079.43.1.L 1080.41.1.L 1081.41.2.L 1083.41.2.L 1085.41.2.L 1087.31.1.L 1087.43.1.L 1088.33.1.L 1088.45.1.L 1089.45.2.L 1091.45.1.L 1092.43.1.L 1093.43.2.L 1095.43.1.L 1096.41.1.L 1097.41.3.L 1100.41.2.L 1102.41.2.L 1104.31.1.L 1104.43.1.L 1105.33.1.L 1105.45.1.L 1106.45.2.L 1108.45.1.L 1109.43.1.L 1110.43.2.L 1112.43.1.L 1113.41.1.L 1114.41.2.L 1116.41.2.L 1118.41.2.L 1120.31.1.L 1120.43.1.L 1121.33.1.L 1121.45.1.L 1122.45.2.L 1124.45.2.L 1126.43.1.L 1127.43.2.L 1129.43.1.L 1130.41.1.L 1131.41.1.L 1132.41.1.L 1133.41.1.L 1134.41.1.L 1135.41.1.L 1136.41.1.L 1137.43.1.L 1138.33.1.L 1138.45.1.L 1139.45.3.L 1142.43.1.L 1143.43.3.L 1146.41.1.L 1147.41.1.L 1148.41.1.L 1149.41.1.L 1150.41.1.L 1151.41.1.L 1152.41.1.L 1153.41.1.L 1154.31.1.L 1154.43.1.L 1155.33.1.L 1155.45.1.L 1156.45.3.L 1159.43.1.L 1160.43.3.L 1163.41.1.L 1164.41.1.L 1165.41.1.L 1166.41.1.L 1167.41.1.L 1168.41.1.L 1169.41.1.L 1170.31.1.L 1170.41.1.L 1170.43.1.L 1171.33.1.L 1171.45.1.L 1172.45.3.L 1175.43.1.L 1176.43.4.L 1180.41.1.L 1181.41.1.L 1182.41.1.L 1183.41.1.L 1184.41.1.L 1185.41.1.L 1186.41.1.L 1187.31.1.L 1187.43.1.L 1188.33.1.L 1188.45.1.L 1189.45.1.L 1190.45.1.L 1191.45.1.L 1192.31.1.L 1192.43.1.L 1193.43.1.L 1194.43.2.L 1196.41.1.L 1197.41.1.L 1198.41.1.L 1199.41.1.L 1200.41.1.L 1201.41.1.L 1202.41.1.L 1203.31.1.L 1203.41.1.L 1203.43.1.L 1204.33.1.L 1204.45.1.L 1205.45.2.L 1207.45.1.L 1208.45.1.L 1209.31.1.L 1209.43.1.L 1210.43.1.L 1211.43.2.L 1213.41.1.L 1214.41.1.L 1215.41.1.L 1216.41.1.L 1217.41.1.L 1218.41.1.L 1219.41.1.L 1220.31.1.L 1220.41.1.L 1220.43.1.L 1221.33.1.L 1221.45.1.L 1222.45.1.L 1223.45.1.L 1224.45.1.L 1225.31.1.L 1225.43.1.L 1226.43.1.L 1227.43.2.L 1229.41.1.L 1230.41.1.L 1231.41.1.L 1232.41.1.L 1233.41.1.L 1234.41.1.L 1235.41.1.L 1236.41.1.L 1237.31.1.L 1237.43.1.L 1238.33.1.L 1238.45.1.L 1239.45.1.L 1240.45.1.L 1241.45.1.L 1242.31.1.L 1242.43.1.L 1243.43.1.L 1244.43.2.L 1246.41.1.L 1247.41.1.L 1248.41.1.L 1249.41.1.L 1250.41.1.L 1251.41.1.L 1252.41.1.L 1253.31.1.L 1253.41.1.L 1253.43.1.L 1254.33.1.L 1254.45.1.L 1255.45.1.L 1256.45.1.L 1257.45.1.L 1258.31.1.L 1258.43.1.L 1259.43.2.L 1261.43.1.L 1262.29.2.L 1262.41.2.L 1264.41.2.L 1266.41.2.L 1268.41.2.L 1270.31.1.L 1270.43.1.L 1271.33.1.L 1271.45.1.L 1272.45.3.L 1275.31.1.L 1275.43.1.L 1276.43.3.L 1279.29.1.L 1279.41.1.L 1280.41.2.L 1282.41.2.L 1284.41.2.L 1286.31.2.L 1286.43.2.L 1288.33.1.L 1288.45.1.L 1289.45.2.L 1291.45.1.L 1292.43.1.L 1293.43.1.L 1294.43.1.L 1295.43.1.L 1296.41.1.L 1297.41.2.L 1299.41.2.L 1301.41.1.L 1302.41.1.L 1303.43.1.L 1304.45.1.L 1305.45.2.L 1307.45.1.L 1308.43.1.L 1309.43.1.L 1310.43.1.L 1311.43.1.L 1312.41.1.L 1313.41.3.L 1316.41.2.L 1318.41.1.L 1319.41.1.L 1320.43.1.L 1321.45.1.L 1322.45.2.L 1324.45.1.L 1325.43.1.L 1326.43.1.L 1327.43.1.L 1328.43.1.L 1329.41.1.L 1330.41.2.L 1332.41.2.L 1334.41.1.L 1335.41.1.L 1336.43.1.L 1337.45.1.L 1338.45.2.L 1340.45.2.L 1342.43.1.L 1343.43.2.L 1345.43.1.L 1346.41.12.L 0.57.1.R 1.60.1.R 2.64.1.R 3.69.1.R 4.56.1.R 4.71.1.R 5.64.1.R 6.60.1.R 7.71.1.R 8.55.1.R 8.72.1.R 9.64.1.R 10.60.1.R 11.72.1.R 12.54.1.R 12.66.1.R 13.62.1.R 14.57.1.R 15.66.1.R 16.53.1.R 16.64.1.R 17.60.2.R 19.57.1.R 20.60.2.R 22.64.1.R 23.60.1.R 24.57.1.R 25.55.1.R 25.59.1.R 25.62.1.R 26.57.1.R 26.60.1.R 26.64.1.R 27.57.3.R 27.60.3.R 27.64.3.R 31.53.1.R 32.52.2.R 34.57.1.R 35.60.1.R 36.64.1.R 37.56.1.R 37.71.1.R 38.64.1.R 39.60.1.R 40.71.1.R 41.55.1.R 41.72.1.R 42.64.1.R 43.60.1.R 44.72.2.R 46.54.1.R 46.66.1.R 47.62.1.R 48.57.1.R 49.66.1.R 50.53.1.R 50.64.1.R 51.60.1.R 52.57.1.R 53.60.2.R 55.64.1.R 56.60.1.R 57.57.1.R 58.55.1.R 58.59.1.R 58.62.1.R 59.57.1.R 59.60.1.R 59.64.1.R 60.57.3.R 60.60.3.R 60.64.3.R 66.48.1.R 66.67.1.R 66.72.1.R 66.76.1.R 67.52.1.R 68.55.1.R 69.64.1.R 70.66.1.R 70.69.1.R 70.74.1.R 70.78.1.R 71.62.2.R 73.57.1.R 74.66.1.R 75.64.1.R 75.72.1.R 75.77.1.R 75.81.1.R 76.60.1.R 77.57.1.R 77.76.1.R 77.79.1.R 78.64.1.R 78.71.1.R 78.74.1.R 78.77.1.R 79.59.1.R 79.69.1.R 79.72.1.R 79.76.1.R 80.57.2.R 82.71.1.R 82.74.1.R 82.79.1.R 83.60.1.R 83.72.1.R 83.76.1.R 83.79.1.R 84.55.1.R 85.52.1.R 86.60.1.R 87.67.1.R 87.71.1.R 87.74.1.R 87.79.1.R 88.59.1.R 89.55.1.R 90.67.1.R 91.62.1.R 91.67.1.R 91.69.1.R 91.74.1.R 91.79.1.R 92.66.1.R 92.69.1.R 92.78.1.R 93.62.3.R 93.66.3.R 93.69.3.R 93.74.3.R 93.78.3.R 100.48.1.R 100.67.1.R 100.72.1.R 100.76.1.R 101.52.1.R 102.55.1.R 102.72.1.R 102.76.1.R 102.81.1.R 103.60.1.R 103.71.1.R 103.76.1.R 103.79.1.R 104.66.1.R 104.71.1.R 104.76.1.R 104.79.1.R 105.62.1.R 105.69.1.R 105.74.1.R 105.78.1.R 106.59.1.R 106.69.1.R 106.76.1.R 107.66.1.R 107.69.1.R 107.74.1.R 108.64.1.R 108.71.1.R 108.77.1.R 108.81.1.R 109.60.1.R 110.57.1.R 110.81.1.R 110.84.1.R 111.64.1.R 111.74.1.R 111.79.1.R 111.83.1.R 112.64.1.R 112.76.1.R 112.81.1.R 112.84.1.R 113.57.3.R 116.48.1.R 116.79.1.R 116.84.1.R 116.88.1.R 117.52.1.R 118.55.1.R 119.60.1.R 120.50.1.R 120.78.1.R 120.81.1.R 120.86.1.R 121.57.1.R 122.62.1.R 123.66.1.R 124.53.1.R 124.64.1.R 124.72.1.R 124.76.1.R 124.79.1.R 125.53.2.R 125.64.2.R 125.81.2.R 127.53.3.R 127.64.3.R 127.72.3.R 127.76.3.R 127.81.3.R 131.69.1.R 132.71.1.R 133.64.1.R 133.72.1.R 134.48.1.R 135.52.1.R 135.71.1.R 136.57.1.R 136.69.1.R 137.64.2.R 137.71.2.R 139.50.1.R 139.69.1.R 140.56.1.R 140.71.1.R 141.67.2.R 141.72.2.R 143.50.1.R 143.74.1.R 144.55.1.R 144.72.1.R 145.71.1.R 146.50.1.R 146.69.1.R 147.54.1.R 147.72.1.R 148.57.1.R 148.74.1.R 149.65.1.R 149.76.1.R 150.48.1.R 151.53.1.R 151.74.1.R 152.48.2.R 152.72.2.R 154.71.1.R 155.48.1.R 155.69.1.R 156.53.1.R 157.48.1.R 157.67.1.R 158.55.1.R 158.59.1.R 158.62.1.R 159.57.1.R 159.60.1.R 159.64.1.R 160.57.3.R 160.60.3.R 160.64.3.R 164.69.1.R 165.71.1.R 166.72.1.R 167.48.1.R 168.52.1.R 168.71.1.R 169.57.1.R 169.69.1.R 170.71.2.R 172.50.1.R 172.69.1.R 173.56.1.R 173.71.1.R 174.72.2.R 176.50.1.R 176.74.1.R 177.55.1.R 177.72.1.R 178.71.1.R 179.50.2.R 179.69.2.R 181.54.1.R 181.72.1.R 182.57.1.R 182.74.1.R 183.76.1.R 184.48.1.R 185.53.1.R 185.74.1.R 186.48.1.R 186.72.1.R 187.71.1.R 188.48.1.R 189.53.1.R 189.69.1.R 190.48.1.R 190.67.1.R 191.55.1.R 191.59.1.R 191.62.1.R 192.57.1.R 192.60.1.R 192.64.1.R 193.57.3.R 193.60.3.R 193.64.3.R 199.48.1.R 200.52.1.R 201.55.1.R 201.72.1.R 202.60.1.R 202.76.1.R 203.50.1.R 203.66.1.R 203.69.1.R 203.74.1.R 204.54.1.R 205.57.1.R 206.62.2.R 208.69.1.R 208.74.1.R 209.48.1.R 210.53.1.R 210.72.1.R 211.57.1.R 211.71.1.R 212.72.1.R 213.48.1.R 213.69.1.R 214.52.1.R 214.69.1.R 215.57.1.R 215.71.1.R 216.48.1.R 216.72.1.R 217.52.1.R 217.74.1.R 218.55.1.R 218.76.1.R 219.60.1.R 219.74.1.R 220.74.1.R 221.72.1.R 222.50.1.R 222.71.1.R 223.55.1.R 223.67.1.R 224.59.1.R 224.62.1.R 224.67.1.R 225.62.1.R 225.66.1.R 225.69.1.R 226.62.3.R 226.66.3.R 226.69.3.R 230.69.1.R 231.71.1.R 232.64.1.R 232.72.1.R 233.48.2.R 235.52.1.R 235.71.1.R 236.57.1.R 236.69.1.R 237.64.2.R 237.71.2.R 239.50.1.R 239.69.1.R 240.56.1.R 240.71.1.R 241.67.2.R 241.72.2.R 243.50.1.R 243.74.1.R 244.55.1.R 244.72.1.R 245.71.1.R 246.50.1.R 246.69.1.R 247.54.1.R 247.72.1.R 248.57.1.R 248.74.1.R 249.65.1.R 249.76.1.R 250.48.1.R 251.53.1.R 251.74.1.R 252.48.1.R 252.72.1.R 253.71.1.R 254.48.1.R 254.69.1.R 255.53.1.R 256.48.1.R 256.67.1.R 257.55.1.R 257.59.1.R 257.62.1.R 258.57.1.R 258.60.1.R 258.64.1.R 259.57.3.R 259.60.3.R 259.64.3.R 264.69.1.R 265.71.1.R 266.72.1.R 267.48.1.R 268.52.1.R 268.71.1.R 269.57.1.R 269.69.1.R 270.71.2.R 272.50.1.R 272.69.1.R 273.56.1.R 273.71.1.R 274.72.2.R 276.50.1.R 276.74.1.R 277.55.1.R 277.72.1.R 278.71.1.R 279.50.1.R 279.69.1.R 280.54.1.R 280.72.1.R 281.57.1.R 281.74.1.R 282.76.1.R 283.48.1.R 284.53.1.R 284.74.1.R 285.48.1.R 285.72.1.R 286.71.1.R 287.48.2.R 289.53.1.R 289.69.1.R 290.48.1.R 290.67.1.R 291.55.1.R 291.59.1.R 291.62.1.R 292.57.1.R 292.60.1.R 292.64.1.R 293.57.3.R 293.60.3.R 293.64.3.R 299.57.1.R 299.69.1.R 299.72.1.R 299.76.1.R 300.60.1.R 301.64.1.R 302.69.1.R 303.56.1.R 304.60.1.R 305.64.1.R 305.71.1.R 306.60.1.R 306.64.1.R 307.55.1.R 307.60.1.R 307.71.1.R 308.57.1.R 308.60.1.R 309.64.1.R 310.55.1.R 310.57.1.R 310.60.1.R 311.54.1.R 311.57.1.R 312.57.1.R 312.62.1.R 313.66.1.R 314.54.1.R 314.57.1.R 314.62.1.R 315.57.1.R 316.53.1.R 316.57.1.R 317.60.1.R 317.64.1.R 318.57.1.R 318.60.1.R 319.53.1.R 319.57.1.R 320.53.1.R 321.57.1.R 321.60.1.R 322.60.1.R 322.64.1.R 323.53.1.R 323.57.1.R 324.55.1.R 324.59.1.R 324.62.1.R 325.57.1.R 325.60.1.R 325.64.1.R 326.57.3.R 326.60.3.R 326.64.3.R 330.55.2.R 330.62.2.R 332.60.1.R 332.64.1.R 332.67.1.R 333.60.1.R 333.64.1.R 333.67.1.R 334.60.1.R 334.64.1.R 334.67.1.R 335.60.2.R 335.64.2.R 335.67.2.R 337.60.1.R 337.64.1.R 337.67.1.R 338.60.1.R 338.64.1.R 338.72.1.R 339.60.1.R 339.64.1.R 339.67.1.R 340.50.3.R 340.57.3.R 340.62.3.R 340.66.3.R 340.69.3.R 343.50.2.R 343.62.2.R 343.66.2.R 343.69.2.R 345.50.1.R 346.72.1.R 347.71.1.R 348.72.1.R 349.64.1.R 349.67.1.R 349.71.1.R 350.64.1.R 350.67.1.R 350.69.1.R 351.60.1.R 351.64.1.R 351.67.1.R 352.60.1.R 352.64.1.R 352.67.1.R 353.60.2.R 353.64.2.R 353.67.2.R 355.60.2.R 355.64.2.R 355.67.2.R 357.64.2.R 357.67.2.R 357.71.2.R 359.62.2.R 359.66.2.R 359.69.2.R 361.60.2.R 361.64.2.R 361.67.2.R 363.62.2.R 363.66.2.R 363.69.2.R 365.60.1.R 365.64.1.R 365.67.1.R 365.72.1.R 366.60.1.R 366.64.1.R 366.67.1.R 367.60.1.R 367.64.1.R 367.67.1.R 368.60.3.R 368.64.3.R 368.67.3.R 371.60.1.R 371.64.1.R 371.67.1.R 372.60.1.R 372.64.1.R 372.72.1.R 373.60.1.R 373.64.1.R 373.67.1.R 374.50.2.R 374.57.2.R 374.62.2.R 374.66.2.R 374.69.2.R 376.50.2.R 376.62.2.R 376.66.2.R 376.69.2.R 378.50.1.R 379.72.1.R 380.71.1.R 380.72.1.R 381.72.1.R 382.64.1.R 382.67.1.R 382.71.1.R 383.64.1.R 383.67.1.R 383.69.1.R 384.60.1.R 384.64.1.R 384.67.1.R 385.60.1.R 385.64.1.R 385.67.1.R 386.60.2.R 386.64.2.R 386.67.2.R 388.60.2.R 388.64.2.R 388.67.2.R 390.64.2.R 390.67.2.R 390.71.2.R 392.62.2.R 392.66.2.R 392.69.2.R 394.60.3.R 394.64.3.R 394.67.3.R 397.69.1.R 398.71.1.R 399.48.1.R 399.64.1.R 399.72.1.R 400.52.1.R 401.55.1.R 401.71.1.R 402.60.1.R 402.69.1.R 403.62.2.R 403.71.2.R 405.50.1.R 405.69.1.R 406.55.1.R 406.71.1.R 407.64.1.R 407.72.1.R 408.48.1.R 409.52.1.R 409.74.1.R 410.57.1.R 410.72.1.R 411.57.1.R 411.71.1.R 412.52.1.R 412.69.1.R 413.48.1.R 413.72.1.R 414.74.1.R 415.48.1.R 415.67.1.R 415.76.1.R 416.52.1.R 417.55.1.R 417.74.1.R 418.60.1.R 418.72.1.R 419.71.1.R 420.69.1.R 421.50.1.R 421.67.1.R 422.55.2.R 424.59.1.R 424.62.1.R 424.67.1.R 425.60.1.R 425.64.1.R 425.69.1.R 426.60.3.R 426.64.3.R 426.69.3.R 430.69.1.R 431.71.1.R 432.48.1.R 432.64.1.R 432.72.1.R 433.52.1.R 434.55.1.R 434.74.1.R 435.60.1.R 435.72.1.R 436.64.1.R 436.71.1.R 437.69.1.R 438.50.1.R 438.69.1.R 439.55.1.R 439.71.1.R 440.64.1.R 440.72.1.R 441.48.1.R 442.52.1.R 442.74.1.R 443.57.1.R 443.72.1.R 444.57.1.R 444.71.1.R 445.52.1.R 445.69.1.R 446.48.1.R 446.72.1.R 447.74.1.R 448.48.1.R 448.67.1.R 448.76.1.R 449.52.2.R 451.55.1.R 451.74.1.R 452.60.1.R 452.72.1.R 453.48.1.R 453.71.1.R 454.52.1.R 454.69.1.R 455.55.1.R 455.67.1.R 456.60.1.R 457.59.1.R 457.62.1.R 457.67.1.R 458.60.1.R 458.64.1.R 458.69.1.R 459.60.3.R 459.64.3.R 459.69.3.R 463.57.1.R 464.59.1.R 465.48.1.R 465.60.1.R 466.52.1.R 466.64.1.R 467.55.1.R 467.67.1.R 468.48.1.R 468.60.1.R 469.59.1.R 470.50.1.R 470.62.1.R 471.55.1.R 471.67.1.R 472.59.1.R 473.60.1.R 473.64.1.R 473.67.1.R 474.60.1.R 474.64.1.R 474.67.1.R 475.60.1.R 475.64.1.R 475.67.1.R 476.60.3.R 476.64.3.R 476.67.3.R 479.60.1.R 479.64.1.R 479.67.1.R 480.60.1.R 480.64.1.R 480.72.1.R 481.60.1.R 481.64.1.R 481.67.1.R 482.50.2.R 482.57.2.R 482.62.2.R 482.66.2.R 482.69.2.R 484.50.2.R 484.62.2.R 484.66.2.R 484.69.2.R 486.50.1.R 487.72.1.R 488.71.1.R 488.72.1.R 489.72.1.R 490.64.1.R 490.67.1.R 490.71.1.R 491.64.1.R 491.67.1.R 491.69.1.R 492.60.1.R 492.64.1.R 492.67.1.R 493.60.1.R 493.64.1.R 493.67.1.R 494.60.2.R 494.64.2.R 494.67.2.R 496.60.2.R 496.64.2.R 496.67.2.R 498.64.2.R 498.67.2.R 498.71.2.R 500.62.2.R 500.66.2.R 500.69.2.R 502.60.3.R 502.64.3.R 502.67.3.R 505.62.2.R 505.66.2.R 505.69.2.R 507.60.1.R 507.64.1.R 507.67.1.R 507.72.1.R 508.60.1.R 508.64.1.R 508.67.1.R 509.60.1.R 509.64.1.R 509.67.1.R 510.60.2.R 510.64.2.R 510.67.2.R 512.60.1.R 512.64.1.R 512.67.1.R 513.60.1.R 513.64.1.R 513.72.1.R 514.60.1.R 514.64.1.R 514.67.1.R 515.50.2.R 515.57.2.R 515.62.2.R 515.66.2.R 515.69.2.R 517.50.2.R 517.62.2.R 517.66.2.R 517.69.2.R 519.50.1.R 520.72.1.R 521.71.1.R 521.72.1.R 522.72.1.R 523.64.1.R 523.67.1.R 523.71.1.R 524.64.1.R 524.67.1.R 524.69.1.R 525.60.1.R 525.64.1.R 525.67.1.R 526.60.1.R 526.64.1.R 526.67.1.R 527.60.2.R 527.64.2.R 527.67.2.R 529.60.3.R 529.64.3.R 529.67.3.R 532.64.2.R 532.67.2.R 532.71.2.R 534.62.2.R 534.66.2.R 534.69.2.R 536.60.2.R 536.64.2.R 536.67.2.R 538.69.1.R 539.71.1.R 540.48.1.R 540.64.1.R 540.72.1.R 541.52.1.R 542.55.1.R 542.71.1.R 543.60.1.R 543.69.1.R 544.62.2.R 544.71.2.R 546.50.1.R 546.69.1.R 547.55.1.R 547.71.1.R 548.64.1.R 548.72.1.R 549.48.1.R 550.52.1.R 550.74.1.R 551.57.1.R 551.72.1.R 552.57.1.R 552.71.1.R 553.52.1.R 553.69.1.R 554.48.1.R 554.72.1.R 555.74.1.R 556.48.1.R 556.67.1.R 556.76.1.R 557.52.2.R 559.55.1.R 559.74.1.R 560.60.1.R 560.72.1.R 561.71.1.R 562.69.1.R 563.50.1.R 563.67.1.R 564.55.1.R 565.59.1.R 565.62.1.R 565.67.1.R 566.60.1.R 566.64.1.R 566.69.1.R 567.60.3.R 567.64.3.R 567.69.3.R 571.69.1.R 572.71.1.R 573.48.1.R 573.64.1.R 573.72.1.R 574.52.1.R 575.55.1.R 575.74.1.R 576.60.1.R 576.72.1.R 577.64.1.R 577.71.1.R 578.69.1.R 579.50.1.R 579.69.1.R 580.55.1.R 580.71.1.R 581.64.1.R 581.72.1.R 582.48.1.R 583.52.1.R 583.74.1.R 584.57.2.R 584.72.2.R 586.57.1.R 586.71.1.R 587.52.1.R 587.69.1.R 588.48.1.R 588.72.1.R 589.74.1.R 590.48.1.R 590.67.1.R 590.76.1.R 591.52.1.R 592.55.1.R 592.74.1.R 593.60.1.R 593.72.1.R 594.48.1.R 594.71.1.R 595.52.1.R 595.69.1.R 596.55.1.R 596.67.1.R 597.60.1.R 598.59.1.R 598.62.1.R 598.67.1.R 599.60.1.R 599.64.1.R 599.69.1.R 600.60.3.R 600.64.3.R 600.69.3.R 604.57.1.R 605.59.1.R 606.48.1.R 606.60.1.R 607.52.1.R 607.64.1.R 608.55.1.R 608.67.1.R 609.48.1.R 609.60.1.R 610.59.1.R 611.50.2.R 611.62.2.R 613.55.1.R 613.67.1.R 614.59.1.R 615.60.1.R 615.64.1.R 615.67.1.R 616.60.1.R 616.64.1.R 616.67.1.R 617.60.1.R 617.64.1.R 617.67.1.R 618.60.2.R 618.64.2.R 618.67.2.R 620.60.1.R 620.64.1.R 620.67.1.R 621.60.1.R 621.64.1.R 621.72.1.R 622.60.1.R 622.64.1.R 622.67.1.R 623.50.2.R 623.57.2.R 623.62.2.R 623.66.2.R 623.69.2.R 625.50.2.R 625.62.2.R 625.66.2.R 625.69.2.R 627.50.2.R 627.62.2.R 627.66.2.R 627.69.2.R 629.62.2.R 629.66.2.R 629.69.2.R 631.60.1.R 631.64.1.R 631.67.1.R 632.60.1.R 632.64.1.R 632.67.1.R 633.60.1.R 633.64.1.R 633.67.1.R 634.60.2.R 634.64.2.R 634.67.2.R 636.60.1.R 636.64.1.R 636.67.1.R 637.60.3.R 637.64.3.R 637.67.3.R 640.64.2.R 640.67.2.R 640.71.2.R 642.62.2.R 642.66.2.R 642.69.2.R 644.60.2.R 644.64.2.R 644.67.2.R 646.62.2.R 646.66.2.R 646.69.2.R 648.60.1.R 648.64.1.R 648.67.1.R 648.72.1.R 649.60.1.R 649.64.1.R 649.67.1.R 650.60.1.R 650.64.1.R 650.67.1.R 651.60.2.R 651.64.2.R 651.67.2.R 653.60.1.R 653.64.1.R 653.67.1.R 654.60.1.R 654.64.1.R 654.72.1.R 655.60.1.R 655.64.1.R 655.67.1.R 656.50.2.R 656.57.2.R 656.62.2.R 656.66.2.R 656.69.2.R 658.50.2.R 658.62.2.R 658.66.2.R 658.69.2.R 660.50.2.R 660.62.2.R 660.66.2.R 660.69.2.R 662.62.2.R 662.66.2.R 662.69.2.R 664.60.1.R 664.64.1.R 664.67.1.R 665.60.1.R 665.64.1.R 665.67.1.R 666.60.1.R 666.64.1.R 666.67.1.R 667.60.1.R 667.64.1.R 667.67.1.R 668.60.2.R 668.64.2.R 668.67.2.R 670.60.1.R 670.64.1.R 670.67.1.R 671.60.2.R 671.64.2.R 671.67.2.R 673.64.2.R 673.67.2.R 673.71.2.R 675.62.2.R 675.66.2.R 675.69.2.R 677.60.2.R 677.64.2.R 677.67.2.R 679.62.2.R 679.66.2.R 679.69.2.R 681.48.1.R 682.52.1.R 682.76.1.R 683.55.1.R 683.74.1.R 684.60.1.R 684.72.1.R 685.74.1.R 686.72.1.R 687.50.1.R 687.69.1.R 688.55.1.R 688.67.1.R 689.69.1.R 690.48.1.R 690.72.1.R 691.52.1.R 692.57.1.R 692.69.1.R 693.67.1.R 693.69.1.R 694.69.1.R 695.48.1.R 695.64.1.R 696.52.1.R 697.57.1.R 698.48.1.R 699.52.1.R 699.71.1.R 700.55.1.R 700.72.1.R 701.60.1.R 701.76.1.R 702.74.1.R 703.72.1.R 704.50.1.R 704.69.1.R 705.55.1.R 705.67.1.R 706.72.2.R 708.60.3.R 708.64.3.R 708.69.3.R 714.48.1.R 715.52.1.R 715.76.1.R 716.55.1.R 716.74.1.R 717.60.1.R 717.72.1.R 718.74.1.R 719.72.2.R 721.50.1.R 721.69.1.R 722.55.1.R 722.67.1.R 723.69.1.R 724.48.1.R 724.72.1.R 725.52.1.R 725.69.1.R 726.57.1.R 726.67.1.R 726.69.1.R 727.69.1.R 728.48.1.R 728.64.1.R 729.52.1.R 730.57.1.R 731.48.1.R 732.52.1.R 732.72.1.R 733.55.1.R 733.72.1.R 734.60.1.R 734.76.1.R 735.74.1.R 736.71.1.R 737.50.1.R 737.72.1.R 738.55.1.R 738.69.1.R 739.72.1.R 740.72.1.R 741.60.3.R 741.64.3.R 741.69.3.R 745.57.1.R 746.59.2.R 748.48.1.R 748.60.1.R 749.52.1.R 749.64.1.R 750.55.1.R 750.67.1.R 751.48.1.R 751.60.1.R 752.59.1.R 753.50.1.R 753.62.1.R 754.55.1.R 754.67.1.R 755.59.1.R 756.60.1.R 756.64.1.R 756.67.1.R 757.60.1.R 757.64.1.R 757.67.1.R 758.60.1.R 758.64.1.R 758.67.1.R 759.60.2.R 759.64.2.R 759.67.2.R 761.60.1.R 761.64.1.R 761.67.1.R 762.60.1.R 762.64.1.R 762.72.1.R 763.60.1.R 763.64.1.R 763.67.1.R 764.50.2.R 764.57.2.R 764.62.2.R 764.66.2.R 764.69.2.R 766.50.2.R 766.62.2.R 766.66.2.R 766.69.2.R 768.50.1.R 769.72.1.R 770.71.1.R 770.72.1.R 771.72.1.R 772.64.1.R 772.67.1.R 772.71.1.R 773.64.2.R 773.67.2.R 773.69.2.R 775.60.1.R 775.64.1.R 775.67.1.R 776.60.1.R 776.64.1.R 776.67.1.R 777.60.2.R 777.64.2.R 777.67.2.R 779.60.2.R 779.64.2.R 779.67.2.R 781.64.2.R 781.67.2.R 781.71.2.R 783.62.2.R 783.66.2.R 783.69.2.R 785.60.2.R 785.64.2.R 785.67.2.R 787.62.2.R 787.66.2.R 787.69.2.R 789.60.1.R 789.64.1.R 789.67.1.R 789.72.1.R 790.60.1.R 790.64.1.R 790.67.1.R 791.60.1.R 791.64.1.R 791.67.1.R 792.60.2.R 792.64.2.R 792.67.2.R 794.60.1.R 794.64.1.R 794.67.1.R 795.60.1.R 795.64.1.R 795.72.1.R 796.60.1.R 796.64.1.R 796.67.1.R 797.50.2.R 797.57.2.R 797.62.2.R 797.66.2.R 797.69.2.R 799.50.3.R 799.62.3.R 799.66.3.R 799.69.3.R 802.50.1.R 803.72.1.R 804.71.1.R 805.72.1.R 806.64.1.R 806.67.1.R 806.71.1.R 807.64.1.R 807.67.1.R 807.69.1.R 808.60.1.R 808.64.1.R 808.67.1.R 809.60.1.R 809.64.1.R 809.67.1.R 810.60.2.R 810.64.2.R 810.67.2.R 812.60.2.R 812.64.2.R 812.67.2.R 814.64.2.R 814.67.2.R 814.71.2.R 816.62.2.R 816.66.2.R 816.69.2.R 818.60.2.R 818.64.2.R 818.67.2.R 820.62.2.R 820.66.2.R 820.69.2.R 822.48.1.R 823.52.1.R 823.76.1.R 824.55.1.R 824.74.1.R 825.60.1.R 825.72.1.R 826.74.1.R 827.72.2.R 829.50.1.R 829.69.1.R 830.55.1.R 830.67.1.R 831.69.1.R 832.48.1.R 832.72.1.R 833.52.1.R 833.69.1.R 834.57.1.R 834.67.1.R 834.69.1.R 835.69.1.R 836.48.1.R 836.64.1.R 837.52.1.R 838.57.1.R 839.48.1.R 840.52.1.R 840.71.1.R 841.55.1.R 841.72.1.R 842.60.1.R 842.76.1.R 843.74.1.R 844.72.1.R 845.50.1.R 845.69.1.R 846.55.1.R 846.67.1.R 847.72.2.R 849.60.3.R 849.64.3.R 849.69.3.R 856.48.1.R 857.52.1.R 857.76.1.R 858.55.1.R 858.74.1.R 859.60.1.R 859.72.1.R 860.74.1.R 861.72.1.R 862.50.1.R 862.69.1.R 863.55.1.R 863.67.1.R 864.69.1.R 865.48.1.R 865.72.1.R 866.52.1.R 867.57.1.R 867.69.1.R 868.67.1.R 868.69.1.R 869.48.1.R 869.64.1.R 869.69.1.R 870.52.1.R 871.57.1.R 872.48.1.R 873.52.1.R 873.72.1.R 874.55.1.R 874.72.1.R 875.60.1.R 875.76.1.R 876.74.1.R 877.71.1.R 878.50.1.R 878.72.1.R 879.55.1.R 879.69.1.R 880.72.1.R 881.72.2.R 883.60.3.R 883.64.3.R 883.69.3.R 887.57.1.R 888.59.1.R 889.48.1.R 889.60.1.R 890.52.1.R 890.64.1.R 891.55.1.R 891.67.1.R 892.48.1.R 892.60.1.R 893.59.1.R 894.50.1.R 894.62.1.R 895.55.1.R 895.67.1.R 896.59.1.R 897.54.3.R 897.57.3.R 897.62.3.R 897.69.3.R 905.52.1.R 905.57.1.R 905.62.1.R 906.54.1.R 906.57.1.R 906.62.1.R 906.66.1.R 907.55.3.R 907.62.3.R 907.67.3.R 910.52.1.R 910.54.1.R 910.57.1.R 910.62.1.R 910.66.1.R 911.55.3.R 911.62.3.R 911.67.3.R 914.52.1.R 914.54.1.R 914.57.1.R 914.62.1.R 914.64.1.R 914.66.1.R 915.55.2.R 915.62.2.R 915.67.2.R 917.55.2.R 917.62.2.R 917.67.2.R 919.54.3.R 919.57.3.R 919.62.3.R 919.66.3.R 922.55.1.R 922.60.1.R 922.64.1.R 923.48.1.R 924.48.1.R 924.55.1.R 925.60.3.R 925.62.3.R 925.66.3.R 928.60.2.R 928.64.2.R 930.60.1.R 930.64.1.R 931.48.1.R 932.48.1.R 932.55.1.R 933.60.3.R 933.62.3.R 933.66.3.R 939.52.1.R 939.54.1.R 939.57.1.R 939.62.1.R 939.66.1.R 940.55.3.R 940.62.3.R 940.67.3.R 943.52.1.R 943.54.1.R 943.57.1.R 943.62.1.R 943.66.1.R 944.55.3.R 944.62.3.R 944.67.3.R 947.52.1.R 947.57.1.R 947.64.1.R 948.54.1.R 948.57.1.R 948.62.1.R 948.66.1.R 949.55.1.R 949.62.1.R 949.67.1.R 950.55.2.R 950.62.2.R 950.67.2.R 952.54.3.R 952.57.3.R 952.62.3.R 952.66.3.R 955.55.1.R 955.60.1.R 955.64.1.R 956.48.1.R 957.48.1.R 957.55.1.R 958.48.3.R 958.55.3.R 958.60.3.R 958.62.3.R 958.66.3.R 961.60.3.R 961.64.3.R 964.55.1.R 964.60.1.R 964.64.1.R 965.48.1.R 966.48.1.R 966.55.1.R 967.48.3.R 967.55.3.R 967.60.3.R 967.62.3.R 967.66.3.R 970.57.1.R 970.59.1.R 970.62.1.R 971.55.1.R 972.57.2.R 972.64.2.R 974.52.2.R 974.57.2.R 976.52.1.R 976.57.1.R 976.69.1.R 977.67.1.R 978.50.1.R 978.55.1.R 978.62.1.R 978.64.1.R 979.57.1.R 979.60.1.R 979.62.1.R 980.50.1.R 980.55.1.R 980.57.1.R 980.60.1.R 981.48.1.R 981.53.1.R 981.55.1.R 982.48.2.R 982.53.2.R 984.48.1.R 984.53.1.R 985.48.1.R 985.53.1.R 985.69.1.R 986.48.1.R 986.53.1.R 986.72.1.R 987.72.1.R 988.74.3.R 991.52.1.R 991.60.1.R 991.72.1.R 992.52.1.R 992.60.1.R 992.69.1.R 993.67.1.R 994.69.1.R 995.50.1.R 995.59.1.R 995.72.1.R 996.50.1.R 996.59.1.R 996.74.1.R 997.69.1.R 997.72.1.R 998.65.1.R 998.67.1.R 999.48.2.R 999.57.2.R 999.69.2.R 1001.48.1.R 1001.57.1.R 1002.48.1.R 1002.57.1.R 1002.63.1.R 1003.48.1.R 1003.57.1.R 1003.64.1.R 1004.67.1.R 1004.69.1.R 1005.63.1.R 1005.64.1.R 1006.57.1.R 1006.60.1.R 1006.62.1.R 1007.52.1.R 1007.57.1.R 1007.60.1.R 1008.55.1.R 1009.52.1.R 1009.55.1.R 1009.57.1.R 1010.57.1.R 1010.60.1.R 1011.50.1.R 1011.55.1.R 1011.57.1.R 1011.60.1.R 1012.60.1.R 1013.50.1.R 1013.55.1.R 1014.48.1.R 1014.53.1.R 1014.69.1.R 1015.48.1.R 1015.53.1.R 1015.67.1.R 1016.62.1.R 1016.64.1.R 1017.48.1.R 1017.53.1.R 1017.57.1.R 1017.60.1.R 1018.48.1.R 1018.53.1.R 1018.60.1.R 1018.62.1.R 1019.55.1.R 1019.57.1.R 1020.48.2.R 1020.53.2.R 1020.55.2.R 1022.57.1.R 1023.60.1.R 1023.65.1.R 1024.52.1.R 1024.60.1.R 1024.62.1.R 1025.52.1.R 1025.57.1.R 1025.60.1.R 1026.62.1.R 1027.64.1.R 1028.50.1.R 1028.59.1.R 1028.67.1.R 1029.69.1.R 1029.72.1.R 1030.50.1.R 1030.59.1.R 1030.76.1.R 1031.74.1.R 1032.48.1.R 1032.57.1.R 1032.72.1.R 1033.72.1.R 1033.74.1.R 1034.48.1.R 1034.57.1.R 1034.81.1.R 1035.48.1.R 1035.57.1.R 1035.79.1.R 1036.48.1.R 1036.57.1.R 1036.77.1.R 1037.74.1.R 1037.76.1.R 1038.69.1.R 1038.72.1.R 1039.76.1.R 1040.52.1.R 1040.57.1.R 1040.69.1.R 1040.72.1.R 1040.74.1.R 1041.72.1.R 1041.76.1.R 1042.52.1.R 1042.57.1.R 1042.69.1.R 1042.72.1.R 1042.74.1.R 1043.72.1.R 1043.76.1.R 1044.69.1.R 1044.72.1.R 1044.74.1.R 1045.50.1.R 1045.55.1.R 1045.72.1.R 1045.76.1.R 1046.50.1.R 1046.55.1.R 1046.69.1.R 1046.74.1.R 1047.48.1.R 1047.53.1.R 1047.72.1.R 1047.76.1.R 1048.69.1.R 1048.74.1.R 1049.48.1.R 1049.53.1.R 1049.72.1.R 1049.76.1.R 1050.48.1.R 1050.53.1.R 1050.69.1.R 1050.74.1.R 1051.48.1.R 1051.53.1.R 1051.72.1.R 1051.76.1.R 1052.69.1.R 1052.74.1.R 1053.48.1.R 1053.53.1.R 1053.72.1.R 1054.76.1.R 1055.69.1.R 1055.72.1.R 1055.74.1.R 1056.72.1.R 1056.76.1.R 1057.52.1.R 1057.60.1.R 1057.69.1.R 1057.72.1.R 1057.74.1.R 1058.69.1.R 1058.72.1.R 1058.81.1.R 1059.52.2.R 1059.60.2.R 1061.50.2.R 1061.59.2.R 1063.50.1.R 1063.59.1.R 1064.79.1.R 1065.48.1.R 1065.57.1.R 1065.76.1.R 1065.79.1.R 1066.74.1.R 1066.77.1.R 1067.48.1.R 1067.57.1.R 1067.69.1.R 1067.72.1.R 1068.48.1.R 1068.57.1.R 1068.74.1.R 1069.48.1.R 1069.57.1.R 1069.72.1.R 1069.76.1.R 1070.79.1.R 1071.74.1.R 1071.76.1.R 1072.69.2.R 1072.72.2.R 1074.52.1.R 1074.57.1.R 1074.60.1.R 1074.64.1.R 1074.72.1.R 1075.52.3.R 1075.57.3.R 1075.59.3.R 1075.71.3.R 1078.50.1.R 1078.55.1.R 1078.60.1.R 1078.64.1.R 1078.72.1.R 1079.50.2.R 1079.55.2.R 1079.57.2.R 1079.69.2.R 1081.76.1.R 1082.48.1.R 1082.52.1.R 1082.57.1.R 1082.79.1.R 1083.81.1.R 1084.48.1.R 1084.52.1.R 1084.57.1.R 1084.79.1.R 1085.48.1.R 1085.52.1.R 1085.57.1.R 1085.69.1.R 1085.76.1.R 1086.48.1.R 1086.52.1.R 1086.57.1.R 1086.72.1.R 1087.69.1.R 1087.72.1.R 1087.74.1.R 1088.72.1.R 1089.76.1.R 1090.52.1.R 1090.57.1.R 1090.60.1.R 1090.64.1.R 1090.72.1.R 1091.59.1.R 1091.71.1.R 1092.52.2.R 1092.57.2.R 1094.50.1.R 1094.55.1.R 1094.60.1.R 1094.64.1.R 1094.72.1.R 1095.57.1.R 1095.69.1.R 1096.50.1.R 1096.55.1.R 1097.60.2.R 1097.64.2.R 1097.72.2.R 1099.48.1.R 1099.52.1.R 1099.57.1.R 1100.48.1.R 1100.52.1.R 1100.57.1.R 1101.48.1.R 1101.52.1.R 1101.57.1.R 1101.59.1.R 1101.62.1.R 1101.71.1.R 1102.57.1.R 1102.60.1.R 1102.69.1.R 1103.48.1.R 1103.52.1.R 1103.55.1.R 1103.57.1.R 1103.59.1.R 1103.60.1.R 1103.67.1.R 1103.69.1.R 1104.55.3.R 1104.57.3.R 1104.59.3.R 1104.60.3.R 1104.67.3.R 1104.69.3.R 1107.52.1.R 1107.57.1.R 1107.60.1.R 1107.64.1.R 1107.72.1.R 1108.59.1.R 1108.71.1.R 1109.52.2.R 1109.57.2.R 1111.50.1.R 1111.55.1.R 1111.60.1.R 1111.64.1.R 1111.72.1.R 1112.57.1.R 1112.69.1.R 1113.50.1.R 1113.55.1.R 1114.65.1.R 1115.48.1.R 1115.52.1.R 1115.57.1.R 1115.66.1.R 1115.68.1.R 1116.67.1.R 1117.48.1.R 1117.52.1.R 1117.57.1.R 1117.69.1.R 1118.48.1.R 1118.52.1.R 1118.57.1.R 1118.62.1.R 1119.48.1.R 1119.52.1.R 1119.57.1.R 1119.60.1.R 1120.60.1.R 1120.62.1.R 1121.60.1.R 1121.62.1.R 1122.57.1.R 1122.60.1.R 1122.62.1.R 1123.52.1.R 1123.57.1.R 1123.60.1.R 1123.64.1.R 1123.72.1.R 1124.59.1.R 1124.71.1.R 1125.52.3.R 1125.57.3.R 1128.50.1.R 1128.55.1.R 1128.60.1.R 1128.64.1.R 1128.72.1.R 1129.50.1.R 1129.55.1.R 1129.57.1.R 1129.69.1.R 1130.48.1.R 1130.53.1.R 1130.76.1.R 1131.48.1.R 1131.53.1.R 1131.84.1.R 1132.76.1.R 1132.81.1.R 1133.48.1.R 1133.53.1.R 1133.76.1.R 1133.81.1.R 1133.84.1.R 1134.81.1.R 1134.84.1.R 1135.48.1.R 1135.53.1.R 1135.76.1.R 1135.81.1.R 1135.84.1.R 1136.48.1.R 1136.53.1.R 1136.76.1.R 1136.86.1.R 1137.50.2.R 1137.55.2.R 1139.57.1.R 1139.60.1.R 1139.69.1.R 1140.52.1.R 1140.57.1.R 1140.60.1.R 1140.69.1.R 1141.57.1.R 1141.60.1.R 1141.69.1.R 1142.60.1.R 1142.64.1.R 1142.72.1.R 1143.59.1.R 1143.62.1.R 1143.71.1.R 1144.50.1.R 1144.55.1.R 1144.57.1.R 1144.60.1.R 1144.69.1.R 1145.55.1.R 1145.59.1.R 1145.67.1.R 1146.48.1.R 1146.53.1.R 1146.57.1.R 1146.60.1.R 1146.69.1.R 1147.57.1.R 1147.60.1.R 1147.65.1.R 1148.48.1.R 1148.53.1.R 1148.57.1.R 1148.60.1.R 1148.65.1.R 1149.48.2.R 1149.53.2.R 1149.57.2.R 1149.60.2.R 1149.65.2.R 1151.48.2.R 1151.53.2.R 1151.57.2.R 1151.60.2.R 1151.65.2.R 1153.48.1.R 1153.53.1.R 1153.57.1.R 1153.60.1.R 1153.65.1.R 1154.59.2.R 1154.62.2.R 1154.67.2.R 1156.57.1.R 1156.60.1.R 1156.69.1.R 1157.52.1.R 1157.57.1.R 1157.60.1.R 1157.69.1.R 1158.57.1.R 1158.60.1.R 1158.69.1.R 1159.59.1.R 1159.60.1.R 1159.62.1.R 1159.64.1.R 1159.71.1.R 1159.72.1.R 1160.57.1.R 1160.60.1.R 1160.69.1.R 1161.50.1.R 1161.55.1.R 1161.59.1.R 1161.62.1.R 1161.71.1.R 1162.59.1.R 1162.62.1.R 1162.71.1.R 1163.48.1.R 1163.53.1.R 1164.57.1.R 1164.60.1.R 1164.69.1.R 1165.48.1.R 1165.53.1.R 1166.48.2.R 1166.53.2.R 1166.57.2.R 1166.60.2.R 1166.65.2.R 1168.48.1.R 1168.53.1.R 1168.57.1.R 1168.60.1.R 1168.65.1.R 1169.48.1.R 1169.53.1.R 1169.57.1.R 1169.60.1.R 1169.65.1.R 1170.59.2.R 1170.62.2.R 1170.67.2.R 1172.57.1.R 1172.60.1.R 1172.69.1.R 1173.52.1.R 1173.57.1.R 1173.60.1.R 1173.69.1.R 1174.57.1.R 1174.60.1.R 1174.69.1.R 1175.64.1.R 1175.72.1.R 1175.76.1.R 1176.62.1.R 1176.71.1.R 1176.74.1.R 1177.50.1.R 1177.55.1.R 1177.60.1.R 1177.69.1.R 1177.72.1.R 1178.59.1.R 1178.67.1.R 1178.71.1.R 1179.62.1.R 1179.67.1.R 1179.71.1.R 1180.48.1.R 1180.53.1.R 1181.48.2.R 1181.53.2.R 1181.57.2.R 1181.65.2.R 1181.69.2.R 1183.48.1.R 1183.53.1.R 1183.57.1.R 1183.60.1.R 1183.65.1.R 1184.48.2.R 1184.53.2.R 1184.57.2.R 1184.60.2.R 1184.65.2.R 1186.48.1.R 1186.53.1.R 1186.57.1.R 1186.60.1.R 1186.65.1.R 1187.59.2.R 1187.62.2.R 1187.67.2.R 1189.57.1.R 1189.60.1.R 1189.69.1.R 1190.52.1.R 1190.57.1.R 1190.60.1.R 1190.69.1.R 1191.57.1.R 1191.60.1.R 1191.69.1.R 1192.64.1.R 1192.72.1.R 1192.76.1.R 1193.62.1.R 1193.71.1.R 1193.74.1.R 1194.50.1.R 1194.60.1.R 1194.69.1.R 1194.72.1.R 1195.59.1.R 1195.67.1.R 1195.71.1.R 1196.48.1.R 1196.53.1.R 1196.59.1.R 1196.67.1.R 1196.71.1.R 1197.57.1.R 1197.65.1.R 1197.69.1.R 1198.48.1.R 1198.53.1.R 1199.48.2.R 1199.53.2.R 1199.57.2.R 1199.60.2.R 1199.65.2.R 1201.48.1.R 1201.53.1.R 1201.57.1.R 1201.60.1.R 1201.65.1.R 1202.48.1.R 1202.53.1.R 1202.57.1.R 1202.60.1.R 1202.65.1.R 1203.59.2.R 1203.62.2.R 1203.67.2.R 1205.69.2.R 1205.72.2.R 1205.81.2.R 1207.52.1.R 1207.69.1.R 1207.72.1.R 1207.81.1.R 1208.69.2.R 1208.72.2.R 1208.76.2.R 1208.81.2.R 1208.84.2.R 1210.71.1.R 1210.74.1.R 1210.83.1.R 1211.50.1.R 1211.69.1.R 1211.72.1.R 1211.81.1.R 1212.67.1.R 1212.69.1.R 1212.71.1.R 1212.72.1.R 1212.79.1.R 1212.81.1.R 1213.48.1.R 1213.53.1.R 1213.65.1.R 1214.48.2.R 1214.53.2.R 1214.65.2.R 1214.69.2.R 1216.48.1.R 1216.53.1.R 1216.65.1.R 1216.72.1.R 1217.65.1.R 1218.48.1.R 1218.53.1.R 1218.65.1.R 1218.76.1.R 1219.48.1.R 1219.53.1.R 1219.65.1.R 1219.74.1.R 1220.65.2.R 1220.72.2.R 1222.69.1.R 1222.72.1.R 1222.81.1.R 1223.52.1.R 1223.69.1.R 1223.72.1.R 1223.81.1.R 1224.69.1.R 1224.72.1.R 1224.81.1.R 1225.72.1.R 1225.76.1.R 1225.84.1.R 1226.71.1.R 1226.74.1.R 1226.83.1.R 1227.50.1.R 1227.69.1.R 1227.72.1.R 1227.81.1.R 1228.71.1.R 1228.74.1.R 1228.83.1.R 1229.48.1.R 1229.53.1.R 1230.69.1.R 1230.72.1.R 1230.81.1.R 1231.48.1.R 1231.53.1.R 1231.65.1.R 1231.69.1.R 1232.48.1.R 1232.53.1.R 1232.65.1.R 1232.72.1.R 1233.65.1.R 1234.48.1.R 1234.53.1.R 1234.65.1.R 1234.76.1.R 1235.65.1.R 1236.48.1.R 1236.53.1.R 1236.65.1.R 1236.74.1.R 1237.65.2.R 1237.72.2.R 1239.69.1.R 1239.72.1.R 1239.81.1.R 1240.52.1.R 1240.69.1.R 1240.72.1.R 1240.81.1.R 1241.69.2.R 1241.72.2.R 1241.76.2.R 1241.81.2.R 1241.84.2.R 1241.88.2.R 1243.74.1.R 1243.83.1.R 1243.86.1.R 1244.50.1.R 1244.72.1.R 1244.81.1.R 1244.84.1.R 1245.71.1.R 1245.79.1.R 1245.83.1.R 1246.48.1.R 1246.53.1.R 1246.71.1.R 1246.79.1.R 1246.83.1.R 1247.65.1.R 1248.48.1.R 1248.53.1.R 1248.65.1.R 1248.69.1.R 1249.48.1.R 1249.53.1.R 1249.65.1.R 1249.72.1.R 1250.65.1.R 1251.48.1.R 1251.53.1.R 1251.65.1.R 1251.76.1.R 1252.48.1.R 1252.53.1.R 1252.65.1.R 1252.74.1.R 1253.65.2.R 1253.72.2.R 1255.69.1.R 1255.72.1.R 1255.81.1.R 1256.52.1.R 1256.57.1.R 1256.69.1.R 1256.72.1.R 1256.81.1.R 1257.69.1.R 1257.72.1.R 1257.81.1.R 1258.76.1.R 1258.84.1.R 1258.88.1.R 1259.74.2.R 1259.83.2.R 1259.86.2.R 1261.50.1.R 1261.55.1.R 1261.72.1.R 1261.81.1.R 1261.84.1.R 1262.74.1.R 1262.76.1.R 1262.83.1.R 1262.84.1.R 1262.86.1.R 1262.88.1.R 1263.74.1.R 1263.83.1.R 1263.86.1.R 1264.48.1.R 1264.71.1.R 1264.72.1.R 1264.79.1.R 1264.81.1.R 1264.83.1.R 1264.84.1.R 1265.48.1.R 1265.57.1.R 1266.48.1.R 1266.57.1.R 1267.48.2.R 1267.57.2.R 1269.48.3.R 1269.57.3.R 1272.69.1.R 1272.72.1.R 1272.81.1.R 1273.52.1.R 1273.57.1.R 1273.69.1.R 1273.72.1.R 1273.81.1.R 1274.52.1.R 1274.57.1.R 1274.69.1.R 1274.72.1.R 1274.81.1.R 1275.52.1.R 1275.57.1.R 1275.72.1.R 1275.76.1.R 1275.84.1.R 1276.71.1.R 1276.74.1.R 1276.83.1.R 1277.50.1.R 1277.55.1.R 1277.69.1.R 1277.72.1.R 1277.81.1.R 1278.50.1.R 1278.55.1.R 1278.71.1.R 1278.74.1.R 1278.83.1.R 1279.50.1.R 1279.55.1.R 1279.72.1.R 1279.76.1.R 1279.84.1.R 1280.48.1.R 1281.48.2.R 1281.57.2.R 1283.48.1.R 1283.57.1.R 1284.48.1.R 1284.57.1.R 1285.48.3.R 1285.57.3.R 1288.52.2.R 1288.64.2.R 1290.52.1.R 1290.57.1.R 1290.60.1.R 1291.52.1.R 1292.55.2.R 1292.67.2.R 1294.52.1.R 1294.57.1.R 1294.69.1.R 1295.52.2.R 1295.57.2.R 1295.69.2.R 1297.48.1.R 1298.48.2.R 1298.57.2.R 1298.60.2.R 1298.64.2.R 1300.48.1.R 1300.57.1.R 1300.60.1.R 1300.64.1.R 1301.48.1.R 1301.57.1.R 1301.60.1.R 1301.64.1.R 1302.48.2.R 1302.50.2.R 1302.62.2.R 1304.52.2.R 1304.64.2.R 1306.52.2.R 1306.57.2.R 1306.60.2.R 1308.52.2.R 1308.55.2.R 1308.67.2.R 1310.52.2.R 1310.57.2.R 1310.69.2.R 1312.52.1.R 1312.60.1.R 1312.72.1.R 1313.48.2.R 1315.48.1.R 1315.57.1.R 1315.60.1.R 1315.64.1.R 1316.48.1.R 1316.57.1.R 1316.60.1.R 1316.64.1.R 1317.48.2.R 1317.57.2.R 1317.60.2.R 1317.64.2.R 1319.48.3.R 1319.59.3.R 1319.71.3.R 1322.60.1.R 1322.72.1.R 1323.52.2.R 1325.52.2.R 1325.59.2.R 1325.71.2.R 1327.52.1.R 1328.60.1.R 1328.72.1.R 1329.52.2.R 1331.48.2.R 1331.57.2.R 1331.59.2.R 1331.71.2.R 1333.48.1.R 1333.57.1.R 1334.48.1.R 1334.57.1.R 1334.60.1.R 1334.72.1.R 1335.48.2.R 1337.59.2.R 1337.62.2.R 1337.74.2.R 1339.52.3.R 1339.57.3.R 1339.60.3.R 1339.64.3.R 1339.72.3.R 1342.59.2.R 1342.62.2.R 1342.71.2.R 1344.50.2.R 1344.55.2.R 1344.62.2.R 1344.65.2.R 1344.74.2.R 1346.48.3.R 1346.57.3.R 1346.60.3.R 1346.64.3.R 1346.72.3.R 1354.60.2.R 1356.62.2.R 1358.64.2.R 1360.62.2.R 1362.60.2.R 1364.59.2.R 1366.60.1.R 1367.59.2.R 1369.57.1.R 1370.55.3.R 1374.55.1.R 1375.60.1.R 1376.55.1.R 1377.57.3.R';
const BRH_EASY = '0.74.1.R 1.74.1.R 2.74.1.R 3.74.2.R 5.74.3.R 8.73.1.R 9.73.1.R 10.74.1.R 11.73.1.R 12.71.1.R 13.69.3.R 16.74.1.R 17.74.2.R 19.74.1.R 20.76.2.R 22.74.2.R 24.62.1.R 25.62.1.R 26.71.1.R 27.71.1.R 28.72.1.R 29.71.1.R 30.69.1.R 31.67.3.R 34.71.1.R 35.71.1.R 36.71.1.R 37.71.3.R 41.71.1.R 42.71.1.R 43.71.1.R 44.72.2.R 46.74.2.R 48.67.2.R 50.76.3.R 59.76.1.R 60.76.1.R 61.76.1.R 62.76.2.R 64.76.3.R 67.74.1.R 68.74.1.R 69.76.1.R 70.74.1.R 71.72.1.R 72.69.2.R 74.74.1.R 75.76.1.R 76.80.1.R 77.80.1.R 78.79.2.R 80.78.1.R 81.78.1.R 82.79.2.R 84.80.1.R 85.80.1.R 86.79.2.R 88.78.1.R 89.78.1.R 90.79.2.R 92.76.1.R 93.76.1.R 94.76.1.R 95.76.1.R 96.74.2.R 98.79.3.R 101.73.1.R 102.73.1.R 103.73.1.R 104.74.1.R 105.74.1.R 106.62.1.R 107.62.1.R 108.62.1.R 109.69.3.R 115.66.1.R 116.67.1.R 117.67.3.R 134.71.3.R 141.67.1.R 142.69.1.R 143.71.1.R 144.71.3.R 149.71.1.R 150.71.1.R 151.72.1.R 151.74.1.R 152.72.2.R 154.69.3.R 154.71.3.R 157.69.1.R 158.71.1.R 159.72.1.R 159.74.1.R 160.72.1.R 161.71.2.R 163.69.3.R 167.71.1.R 168.71.3.R 173.71.1.R 174.74.1.R 175.78.2.R 177.76.1.R 178.76.3.R 183.76.1.R 184.79.1.R 185.79.1.R 186.79.1.R 187.79.1.R 188.79.1.R 189.76.1.R 190.72.1.R 191.71.1.R 192.69.1.R 193.69.3.R 200.76.1.R 201.76.3.R 206.74.2.R 208.76.1.R 208.77.1.R 209.76.3.R 216.76.1.R 217.76.1.R 218.77.1.R 219.76.1.R 220.74.1.R 220.76.1.R 221.74.3.R 224.67.1.R 225.67.1.R 226.74.1.R 227.74.1.R 228.76.1.R 229.76.1.R 230.77.1.R 231.77.1.R 232.79.1.R 233.77.1.R 234.76.1.R 235.76.2.R 237.74.1.R 237.76.1.R 238.79.3.R 241.74.1.R 241.76.1.R 242.72.3.R 245.67.1.R 246.67.1.R 247.68.1.R 247.70.1.R 248.68.1.R 249.68.1.R 249.70.1.R 250.67.3.R';
const BRH_MED = '34.28.8.L 42.31.9.L 51.36.8.L 59.33.8.L 67.38.12.L 92.36.4.L 96.35.5.L 101.34.4.L 105.33.12.L 117.31.8.L 125.31.9.L 134.31.8.L 142.28.8.L 150.33.9.L 159.33.4.L 163.38.4.L 167.31.8.L 175.28.9.L 184.33.4.L 188.32.2.L 190.31.2.L 192.30.4.L 196.29.2.L 198.28.2.L 200.36.6.L 206.35.3.L 209.33.8.L 217.38.3.L 220.37.1.L 221.36.2.L 223.35.2.L 225.43.1.L 226.31.1.L 227.31.1.L 228.31.1.L 229.31.1.L 230.31.1.L 231.31.1.L 232.31.1.L 233.31.5.L 233.36.5.L 238.35.4.L 242.33.4.L 246.29.4.L 250.36.12.L 263.31.8.L 271.31.8.L 279.31.8.L 287.28.9.L 296.33.8.L 304.33.4.L 308.38.4.L 312.31.9.L 321.28.8.L 329.33.4.L 333.32.2.L 335.31.2.L 337.30.4.L 341.29.3.L 344.28.2.L 346.36.6.L 352.35.2.L 354.33.8.L 362.38.3.L 365.37.1.L 366.36.2.L 368.35.3.L 371.43.1.L 372.43.1.L 373.43.1.L 374.43.1.L 375.43.1.L 376.43.1.L 377.43.1.L 378.43.1.L 379.43.1.L 380.36.3.L 383.35.4.L 387.33.8.L 395.38.4.L 399.37.1.L 400.36.2.L 402.35.2.L 404.31.1.L 405.31.1.L 406.43.1.L 407.31.1.L 408.31.1.L 409.31.1.L 410.31.1.L 411.31.1.L 412.31.4.L 412.36.4.L 416.35.4.L 420.33.9.L 429.38.3.L 432.37.1.L 433.36.2.L 435.35.2.L 437.34.3.L 440.33.1.L 440.34.1.L 441.32.2.L 443.31.2.L 445.30.12.L 470.29.2.L 472.29.1.L 473.29.1.L 474.29.1.L 475.28.1.L 476.28.1.L 477.25.2.L 479.30.9.L 488.42.1.L 489.42.1.L 490.42.1.L 490.43.1.L 491.38.1.L 491.40.1.L 492.37.5.L 497.43.9.L 506.36.1.L 507.36.1.L 508.36.1.L 509.36.1.L 510.36.1.L 511.36.1.L 512.36.1.L 513.36.1.L 514.41.2.L 516.41.1.L 517.40.1.L 518.40.1.L 519.36.1.L 519.38.1.L 520.31.1.L 520.33.1.L 520.35.1.L 521.43.12.L 534.31.1.L 535.36.1.L 536.31.1.L 537.36.1.L 538.31.1.L 539.31.1.L 540.31.1.L 541.31.1.L 542.31.2.L 544.31.1.L 545.36.1.L 546.31.1.L 547.31.1.L 548.31.1.L 549.31.1.L 550.31.2.L 552.31.1.L 553.36.1.L 554.31.1.L 555.31.1.L 556.31.1.L 557.31.1.L 558.31.2.L 560.31.1.L 561.31.1.L 562.31.2.L 564.31.1.L 565.31.1.L 566.31.6.L 572.32.1.L 573.30.1.L 574.35.1.L 575.34.1.L 576.39.1.L 577.31.1.L 578.36.5.L 583.36.1.L 584.36.1.L 585.36.1.L 585.41.1.L 586.33.1.L 586.35.1.L 587.31.2.L 589.36.1.L 590.36.1.L 591.29.1.L 592.29.1.L 593.33.1.L 593.35.1.L 594.31.1.L 595.30.1.L 596.28.1.L 597.31.1.L 598.31.1.L 599.31.1.L 600.31.1.L 601.31.1.L 602.31.1.L 603.31.1.L 604.31.1.L 605.31.1.L 606.31.1.L 607.31.1.L 608.31.1.L 609.31.1.L 610.31.1.L 611.31.2.L 613.31.1.L 614.36.3.L 617.36.3.L 620.36.3.L 623.36.3.L 626.36.3.L 629.36.3.L 632.36.3.L 635.36.3.L 638.36.4.L 642.36.3.L 645.36.3.L 648.36.3.L 651.26.3.L 654.26.3.L 657.26.3.L 660.26.3.L 663.43.2.L 665.31.3.L 668.43.2.L 670.43.2.L 672.31.2.L 674.43.2.L 676.43.2.L 678.31.2.L 680.43.4.L 684.36.4.L 688.43.2.L 690.31.2.L 692.43.3.L 695.43.2.L 697.41.1.L 698.43.1.L 699.41.1.L 700.38.1.L 701.34.6.L 707.43.2.L 709.31.2.L 711.43.2.L 713.43.2.L 715.31.2.L 717.43.2.L 719.43.3.L 722.31.2.L 724.43.2.L 726.36.2.L 728.24.2.L 730.36.2.L 732.41.2.L 734.29.2.L 736.41.4.L 740.29.2.L 742.28.2.L 744.38.2.L 746.26.3.L 749.38.2.L 751.38.2.L 753.26.2.L 755.38.2.L 757.43.2.L 759.31.2.L 761.43.2.L 763.43.2.L 765.31.2.L 767.43.2.L 769.38.2.L 771.26.2.L 773.38.3.L 776.38.2.L 778.26.2.L 780.38.2.L 782.43.2.L 784.31.2.L 786.43.2.L 788.43.2.L 790.31.2.L 792.43.2.L 794.26.2.L 796.26.2.L 798.26.2.L 800.43.3.L 803.31.2.L 805.43.2.L 807.26.2.L 809.26.2.L 811.26.2.L 813.43.2.L 815.31.2.L 817.43.2.L 819.36.3.L 822.36.3.L 825.36.4.L 829.36.3.L 832.36.3.L 835.36.3.L 838.36.3.L 841.36.3.L 844.36.3.L 847.36.3.L 850.36.3.L 853.36.4.L 857.38.3.L 860.38.3.L 863.38.3.L 866.38.3.L 869.27.6.L 875.29.4.L 879.30.2.L 881.32.12.L 894.29.12.L 906.31.12.L 919.31.12.L 931.31.1.L 932.33.1.L 933.35.1.L 934.33.1.L 935.35.2.L 937.36.1.L 938.38.1.L 939.36.1.L 940.38.1.L 941.40.1.L 942.41.1.L 943.40.1.L 944.41.1.L 945.43.2.L 947.43.2.L 949.43.2.L 951.43.1.L 952.36.2.L 954.43.1.L 955.43.1.L 956.36.1.L 957.35.2.L 959.35.1.L 960.33.2.L 962.33.3.L 965.32.2.L 967.33.2.L 969.32.2.L 971.33.2.L 973.31.1.L 974.29.1.L 975.26.1.L 975.28.1.L 976.24.1.L 977.35.4.L 981.40.4.L 985.41.3.L 988.41.1.L 989.36.4.L 993.35.1.L 993.36.1.L 994.33.4.L 998.28.4.L 1002.33.4.L 1006.28.4.L 1010.33.4.L 1014.29.5.L 1019.31.8.L 1027.36.8.L 1035.36.4.L 1039.36.4.L 1043.35.5.L 1048.34.4.L 1052.33.8.L 1060.33.4.L 1064.38.12.L 1077.38.12.L 0.59.1.R 0.62.1.R 0.64.1.R 0.67.1.R 1.59.1.R 1.62.1.R 1.64.1.R 1.67.1.R 2.59.1.R 2.62.1.R 2.64.1.R 2.67.1.R 3.59.2.R 3.62.2.R 3.64.2.R 3.67.2.R 5.59.3.R 5.62.3.R 5.64.3.R 5.67.3.R 8.57.1.R 8.61.1.R 8.64.1.R 8.67.1.R 9.57.1.R 9.61.1.R 9.64.1.R 9.67.1.R 10.59.1.R 10.62.1.R 10.64.1.R 10.67.1.R 11.57.1.R 11.61.1.R 11.64.1.R 11.67.1.R 12.55.1.R 12.61.1.R 12.64.1.R 13.55.3.R 13.61.3.R 13.64.3.R 16.57.1.R 16.60.1.R 16.62.1.R 16.66.1.R 17.57.2.R 17.60.2.R 17.62.2.R 17.66.2.R 19.57.1.R 19.60.1.R 19.62.1.R 19.66.1.R 20.57.2.R 20.60.2.R 20.64.2.R 20.67.2.R 22.57.2.R 22.60.2.R 22.62.2.R 22.66.2.R 24.50.1.R 25.50.1.R 26.55.1.R 26.59.1.R 26.62.1.R 27.55.1.R 27.59.1.R 27.62.1.R 28.57.1.R 28.60.1.R 28.64.1.R 28.67.1.R 29.55.1.R 29.59.1.R 29.62.1.R 30.54.1.R 30.57.1.R 30.60.1.R 30.62.1.R 31.50.3.R 31.55.3.R 31.59.3.R 34.55.1.R 34.59.1.R 35.52.1.R 36.55.1.R 37.59.1.R 38.64.1.R 39.59.1.R 40.55.1.R 41.52.1.R 42.47.1.R 43.50.1.R 43.55.1.R 44.53.3.R 51.64.1.R 51.67.1.R 52.60.1.R 53.64.1.R 54.67.1.R 55.65.1.R 55.69.1.R 56.72.1.R 57.64.1.R 57.67.1.R 58.72.1.R 59.60.1.R 59.64.1.R 60.57.1.R 61.57.1.R 61.60.1.R 62.57.1.R 62.60.1.R 62.64.1.R 63.45.1.R 64.57.1.R 64.60.1.R 64.64.1.R 65.45.1.R 66.57.1.R 67.50.1.R 67.66.1.R 68.57.1.R 69.57.1.R 69.62.1.R 69.66.1.R 70.57.3.R 70.62.3.R 70.66.3.R 76.60.2.R 76.63.2.R 76.68.2.R 78.59.2.R 78.62.2.R 78.67.2.R 80.58.2.R 80.61.2.R 80.66.2.R 82.59.2.R 82.62.2.R 82.67.2.R 84.60.2.R 84.63.2.R 84.68.2.R 86.59.2.R 86.62.2.R 86.67.2.R 88.58.2.R 88.61.2.R 88.66.2.R 90.59.2.R 90.62.2.R 90.67.2.R 92.64.1.R 92.67.1.R 93.60.1.R 94.64.1.R 94.67.1.R 94.72.1.R 95.60.1.R 96.62.1.R 96.67.1.R 97.59.1.R 98.62.2.R 98.67.2.R 100.59.1.R 101.61.1.R 101.64.1.R 101.67.1.R 102.58.1.R 103.61.1.R 103.64.1.R 103.67.1.R 104.58.1.R 105.60.1.R 105.62.1.R 105.66.1.R 106.57.1.R 107.60.3.R 107.62.3.R 107.66.3.R 110.57.1.R 111.60.1.R 112.62.1.R 113.62.1.R 114.66.3.R 114.69.3.R 114.72.3.R 117.55.1.R 117.59.1.R 118.50.1.R 119.55.1.R 120.59.1.R 121.76.1.R 122.50.1.R 123.74.1.R 124.50.1.R 125.55.2.R 125.59.2.R 127.50.1.R 128.55.1.R 129.59.1.R 130.76.1.R 131.50.1.R 132.74.1.R 133.50.1.R 134.55.1.R 134.59.1.R 135.50.1.R 136.55.1.R 137.59.1.R 138.76.1.R 139.50.1.R 140.74.1.R 141.50.1.R 142.55.1.R 142.59.1.R 143.52.1.R 144.55.1.R 145.59.1.R 146.78.1.R 147.52.1.R 148.76.1.R 149.52.1.R 150.60.1.R 150.64.1.R 151.57.1.R 152.60.2.R 154.64.1.R 155.83.1.R 156.57.1.R 157.81.1.R 158.57.1.R 159.57.1.R 159.60.1.R 159.67.1.R 160.57.1.R 161.60.1.R 162.64.1.R 163.50.1.R 163.66.1.R 164.60.1.R 165.62.1.R 166.69.1.R 167.55.1.R 167.59.1.R 168.50.1.R 169.55.1.R 170.59.1.R 171.76.1.R 172.50.1.R 173.74.1.R 174.50.1.R 175.55.1.R 175.59.1.R 176.52.1.R 177.55.1.R 178.59.1.R 179.78.2.R 181.52.1.R 182.76.1.R 183.52.1.R 184.57.1.R 184.60.1.R 185.57.1.R 186.60.1.R 187.64.1.R 188.56.1.R 188.60.1.R 189.64.1.R 190.55.1.R 190.60.1.R 191.64.1.R 192.54.1.R 192.60.1.R 193.54.1.R 194.60.1.R 195.64.1.R 196.53.1.R 196.60.1.R 197.64.1.R 198.52.1.R 198.60.1.R 199.64.1.R 200.64.1.R 200.67.1.R 201.60.1.R 202.64.1.R 202.67.1.R 202.72.1.R 203.60.1.R 204.64.1.R 204.67.1.R 205.60.1.R 206.59.2.R 206.62.2.R 208.67.1.R 209.60.1.R 209.64.1.R 210.57.1.R 211.60.1.R 212.64.1.R 213.83.1.R 214.57.1.R 215.81.1.R 216.57.1.R 217.50.1.R 217.65.1.R 218.62.1.R 219.62.1.R 219.65.1.R 220.61.1.R 220.65.1.R 221.60.1.R 221.65.1.R 222.60.1.R 223.59.1.R 223.65.1.R 224.59.1.R 225.55.2.R 225.59.2.R 227.59.2.R 227.62.2.R 229.59.2.R 229.64.2.R 231.59.2.R 231.65.2.R 233.64.2.R 233.67.2.R 235.60.1.R 236.64.1.R 236.67.1.R 236.72.1.R 237.60.1.R 238.62.1.R 238.67.1.R 239.59.1.R 240.62.1.R 240.67.1.R 241.59.1.R 242.60.1.R 242.64.1.R 243.57.1.R 244.60.1.R 244.64.1.R 245.57.1.R 246.53.1.R 247.56.3.R 247.60.3.R 250.64.1.R 250.67.1.R 251.60.1.R 252.64.1.R 253.67.1.R 254.65.1.R 254.69.1.R 255.72.1.R 256.64.1.R 256.67.1.R 257.72.1.R 258.63.1.R 258.66.1.R 259.72.1.R 260.62.2.R 260.65.2.R 262.72.1.R 263.55.1.R 263.59.1.R 264.50.1.R 265.55.1.R 266.59.1.R 267.76.1.R 268.50.1.R 269.74.1.R 270.50.1.R 271.55.1.R 271.59.1.R 272.50.1.R 273.55.1.R 274.59.1.R 275.76.1.R 276.50.1.R 277.74.1.R 278.50.1.R 279.55.1.R 279.59.1.R 280.50.1.R 281.55.1.R 282.59.1.R 283.76.1.R 284.50.1.R 285.74.1.R 286.50.1.R 287.55.2.R 287.59.2.R 289.52.1.R 290.55.1.R 291.59.1.R 292.78.1.R 293.52.1.R 294.76.1.R 295.52.1.R 296.60.1.R 296.64.1.R 297.57.1.R 298.60.1.R 299.64.1.R 300.83.1.R 301.57.1.R 302.81.1.R 303.57.1.R 304.57.1.R 304.60.1.R 304.67.1.R 305.57.1.R 306.60.1.R 307.64.1.R 308.50.1.R 308.66.1.R 309.60.1.R 310.62.1.R 311.69.1.R 312.55.1.R 312.59.1.R 313.50.1.R 314.55.2.R 316.59.1.R 317.76.1.R 318.50.1.R 319.74.1.R 320.50.1.R 321.55.1.R 321.59.1.R 322.52.1.R 323.55.1.R 324.59.1.R 325.78.1.R 326.52.1.R 327.76.1.R 328.52.1.R 329.57.1.R 329.60.1.R 330.57.1.R 331.60.1.R 332.64.1.R 333.56.1.R 333.60.1.R 334.64.1.R 335.55.1.R 335.60.1.R 336.64.1.R 337.54.1.R 337.60.1.R 338.54.1.R 339.60.1.R 340.64.1.R 341.53.2.R 341.60.2.R 343.64.1.R 344.52.1.R 344.60.1.R 345.64.1.R 346.64.1.R 346.67.1.R 347.60.1.R 348.64.1.R 348.67.1.R 348.72.1.R 349.60.1.R 350.64.1.R 350.67.1.R 351.60.1.R 352.59.1.R 352.62.1.R 353.67.1.R 354.60.1.R 354.64.1.R 355.57.1.R 356.60.1.R 357.64.1.R 358.83.1.R 359.57.1.R 360.81.1.R 361.57.1.R 362.50.1.R 362.65.1.R 363.62.1.R 364.62.1.R 364.65.1.R 365.61.1.R 365.65.1.R 366.60.1.R 366.65.1.R 367.60.1.R 368.59.2.R 368.65.2.R 370.59.1.R 371.55.1.R 371.59.1.R 372.55.1.R 372.59.1.R 372.62.1.R 373.55.1.R 373.59.1.R 373.62.1.R 374.55.1.R 374.59.1.R 374.64.1.R 375.55.1.R 375.59.1.R 375.64.1.R 376.55.1.R 376.59.1.R 376.65.1.R 377.55.2.R 377.59.2.R 377.65.2.R 379.48.1.R 379.64.1.R 379.67.1.R 380.60.1.R 381.48.1.R 381.64.1.R 381.67.1.R 381.72.1.R 382.62.1.R 383.48.1.R 383.67.1.R 384.47.1.R 384.62.1.R 385.47.1.R 385.62.1.R 385.67.1.R 386.64.1.R 387.47.1.R 387.60.1.R 387.64.1.R 387.69.1.R 388.45.1.R 389.60.1.R 390.64.1.R 391.69.1.R 391.83.1.R 392.71.1.R 393.72.1.R 393.81.1.R 394.69.1.R 394.71.1.R 395.50.1.R 395.65.1.R 395.72.1.R 395.74.1.R 396.69.1.R 397.62.1.R 398.62.2.R 398.65.2.R 400.74.1.R 400.76.1.R 401.77.1.R 401.79.1.R 402.81.2.R 404.77.1.R 404.79.1.R 405.76.1.R 406.77.1.R 407.74.1.R 407.76.1.R 408.71.1.R 408.76.1.R 409.76.1.R 410.67.1.R 410.74.1.R 411.72.1.R 412.71.1.R 413.67.1.R 413.69.1.R 413.72.1.R 414.48.1.R 414.71.1.R 415.72.1.R 416.48.1.R 416.69.1.R 416.74.1.R 417.47.1.R 417.67.1.R 417.69.1.R 417.71.1.R 417.76.1.R 418.47.1.R 418.69.1.R 418.71.1.R 418.74.1.R 418.77.1.R 419.72.1.R 419.79.1.R 419.81.1.R 420.47.1.R 420.76.1.R 421.45.1.R 421.77.1.R 422.60.2.R 422.79.2.R 424.64.1.R 424.71.1.R 424.72.1.R 425.69.1.R 425.83.1.R 426.71.1.R 426.72.1.R 427.81.1.R 428.71.1.R 428.72.1.R 429.50.1.R 429.65.1.R 429.74.1.R 430.62.1.R 431.62.1.R 431.65.1.R 432.64.1.R 433.60.1.R 433.65.1.R 434.60.1.R 435.65.1.R 435.74.1.R 436.59.1.R 437.62.1.R 437.65.1.R 438.58.1.R 439.62.1.R 439.65.1.R 439.70.1.R 440.62.2.R 440.65.2.R 440.70.2.R 442.58.1.R 443.62.1.R 444.58.1.R 444.65.1.R 445.54.1.R 445.61.1.R 445.62.1.R 446.54.1.R 446.58.1.R 446.61.1.R 446.65.1.R 447.54.1.R 447.58.1.R 447.61.1.R 447.62.1.R 448.54.1.R 448.58.1.R 448.61.1.R 449.54.2.R 449.58.2.R 449.61.2.R 451.54.1.R 451.58.1.R 451.61.1.R 452.54.1.R 452.58.1.R 452.61.1.R 453.54.1.R 453.58.1.R 453.61.1.R 454.54.1.R 454.59.1.R 454.63.1.R 455.54.1.R 455.58.1.R 455.61.1.R 456.54.1.R 456.57.1.R 456.60.1.R 457.54.1.R 457.58.1.R 457.61.1.R 458.54.1.R 458.59.1.R 458.63.1.R 459.54.1.R 459.58.1.R 459.61.1.R 460.54.1.R 460.58.1.R 460.61.1.R 461.54.1.R 461.57.1.R 461.58.1.R 461.60.1.R 461.61.1.R 462.54.1.R 462.58.1.R 462.61.1.R 463.54.1.R 463.58.1.R 463.59.1.R 463.61.1.R 463.63.1.R 464.54.1.R 464.58.1.R 464.61.1.R 465.54.1.R 465.58.1.R 465.59.1.R 465.61.1.R 465.63.1.R 466.54.1.R 466.58.1.R 466.61.1.R 467.54.1.R 467.57.1.R 467.60.1.R 468.54.1.R 468.58.1.R 468.59.1.R 468.61.1.R 468.63.1.R 469.54.1.R 469.58.1.R 469.61.1.R 470.53.1.R 470.58.1.R 470.62.1.R 471.53.1.R 471.58.1.R 471.62.1.R 472.53.1.R 472.57.1.R 472.60.1.R 473.53.1.R 473.57.1.R 473.60.1.R 474.57.1.R 474.61.1.R 474.64.1.R 475.57.1.R 475.61.1.R 475.64.1.R 476.56.2.R 476.59.2.R 476.65.2.R 478.56.1.R 478.59.1.R 478.65.1.R 479.58.1.R 479.61.1.R 479.66.1.R 480.73.1.R 481.73.1.R 481.74.1.R 482.54.1.R 483.54.1.R 483.55.1.R 484.73.1.R 485.73.1.R 485.74.1.R 486.54.1.R 487.54.1.R 488.54.1.R 488.55.1.R 489.54.1.R 490.54.1.R 490.55.1.R 491.50.1.R 491.52.1.R 492.55.1.R 493.55.1.R 494.52.1.R 494.67.1.R 495.48.2.R 497.55.1.R 497.60.1.R 497.63.1.R 497.68.1.R 498.59.1.R 498.62.1.R 498.67.1.R 499.58.1.R 499.61.1.R 499.66.1.R 500.59.1.R 500.62.1.R 500.67.1.R 501.60.1.R 501.63.1.R 501.68.1.R 502.59.1.R 502.62.1.R 502.67.1.R 503.58.2.R 503.61.2.R 503.66.2.R 505.59.1.R 505.62.1.R 505.67.1.R 506.60.1.R 506.65.1.R 506.69.1.R 507.60.1.R 507.64.1.R 507.67.1.R 508.60.1.R 508.63.1.R 508.66.1.R 509.60.1.R 509.64.1.R 509.67.1.R 510.60.1.R 510.65.1.R 510.69.1.R 511.60.1.R 511.64.1.R 511.67.1.R 512.60.1.R 512.63.1.R 512.66.1.R 513.60.1.R 513.64.1.R 513.67.1.R 514.53.1.R 514.60.1.R 514.69.1.R 515.60.1.R 515.65.1.R 515.69.1.R 516.53.1.R 516.60.1.R 516.67.1.R 516.71.1.R 517.52.1.R 517.60.1.R 518.52.1.R 518.60.1.R 518.62.1.R 518.66.1.R 519.50.1.R 519.59.1.R 519.60.1.R 519.66.1.R 520.59.1.R 520.62.1.R 520.67.1.R 521.67.1.R 522.67.1.R 522.69.1.R 523.64.1.R 523.65.1.R 523.67.1.R 523.72.1.R 524.63.1.R 524.66.1.R 524.72.1.R 525.62.1.R 525.65.1.R 525.72.1.R 526.63.1.R 526.68.1.R 526.72.1.R 527.59.1.R 527.62.1.R 527.67.1.R 528.58.1.R 528.61.1.R 528.66.1.R 529.59.1.R 529.62.1.R 529.67.1.R 530.60.2.R 530.63.2.R 530.68.2.R 532.59.1.R 532.62.1.R 532.67.1.R 533.58.1.R 533.61.1.R 533.66.1.R 534.50.1.R 534.55.1.R 534.59.1.R 535.52.1.R 535.55.1.R 535.60.1.R 536.50.1.R 536.55.1.R 536.59.1.R 537.60.1.R 537.64.1.R 537.67.1.R 538.55.1.R 538.59.1.R 539.55.1.R 539.59.1.R 539.60.1.R 540.55.1.R 540.62.1.R 541.55.1.R 541.60.1.R 542.55.2.R 542.59.2.R 544.50.1.R 544.55.1.R 544.59.1.R 545.52.1.R 545.55.1.R 545.60.1.R 546.50.1.R 546.55.1.R 546.59.1.R 547.55.1.R 547.59.1.R 548.55.1.R 548.59.1.R 548.60.1.R 549.55.1.R 549.60.1.R 549.62.1.R 550.55.2.R 550.59.2.R 552.50.1.R 552.55.1.R 552.59.1.R 553.52.1.R 553.55.1.R 553.60.1.R 554.50.1.R 554.55.1.R 554.59.1.R 555.55.1.R 555.59.1.R 556.55.1.R 556.59.1.R 556.60.1.R 557.55.1.R 557.60.1.R 557.62.1.R 558.55.2.R 558.59.2.R 560.55.1.R 560.59.1.R 560.60.1.R 561.55.1.R 561.60.1.R 561.62.1.R 562.55.2.R 562.59.2.R 564.55.1.R 564.59.1.R 564.60.1.R 565.55.1.R 565.60.1.R 565.62.1.R 566.55.1.R 566.59.1.R 567.59.1.R 568.59.1.R 569.58.1.R 569.67.1.R 570.63.1.R 571.73.1.R 572.59.1.R 572.63.1.R 572.68.1.R 573.61.1.R 573.64.1.R 573.66.1.R 574.63.1.R 574.66.1.R 574.71.1.R 575.65.1.R 575.68.1.R 575.70.1.R 576.51.1.R 576.61.1.R 576.67.1.R 576.75.1.R 577.62.1.R 577.67.1.R 577.71.1.R 578.64.3.R 578.72.3.R 583.60.1.R 583.64.1.R 583.67.1.R 584.60.1.R 584.64.1.R 584.67.1.R 584.69.1.R 585.53.1.R 585.60.1.R 585.64.1.R 585.67.1.R 586.57.1.R 586.59.1.R 587.47.2.R 587.50.2.R 587.53.2.R 587.55.2.R 589.60.1.R 589.64.1.R 589.67.1.R 590.60.1.R 590.64.1.R 590.67.1.R 591.60.1.R 591.65.1.R 591.69.1.R 592.60.1.R 592.65.1.R 592.69.1.R 593.59.1.R 593.63.1.R 593.65.1.R 594.59.1.R 594.63.1.R 594.65.1.R 595.59.1.R 595.63.1.R 595.65.1.R 596.59.1.R 596.64.1.R 596.67.1.R 597.50.3.R 597.53.3.R 597.55.3.R 597.59.3.R 601.50.3.R 601.53.3.R 601.55.3.R 601.59.3.R 605.50.3.R 605.53.3.R 605.55.3.R 605.59.3.R 609.50.1.R 609.53.1.R 609.55.1.R 609.59.1.R 610.50.1.R 610.53.1.R 610.55.1.R 610.59.1.R 611.50.2.R 611.53.2.R 611.55.2.R 611.59.2.R 613.50.1.R 613.53.1.R 613.55.1.R 613.59.1.R 614.72.2.R 616.52.2.R 618.53.2.R 620.55.2.R 622.57.1.R 623.59.2.R 625.72.1.R 626.72.2.R 628.52.2.R 630.53.2.R 632.55.1.R 633.57.1.R 634.55.3.R 638.72.3.R 641.52.2.R 643.53.2.R 645.55.2.R 647.57.1.R 648.59.2.R 650.72.1.R 651.74.2.R 653.54.2.R 655.55.2.R 657.57.1.R 658.59.1.R 659.57.3.R 663.50.3.R 663.53.3.R 663.55.3.R 663.59.3.R 667.50.3.R 667.53.3.R 667.55.3.R 667.59.3.R 670.50.3.R 670.53.3.R 670.55.3.R 670.59.3.R 673.50.3.R 673.53.3.R 673.55.3.R 673.59.3.R 676.50.3.R 676.53.3.R 676.55.3.R 676.59.3.R 679.50.3.R 679.53.3.R 679.55.3.R 679.59.3.R 682.48.3.R 682.52.3.R 682.55.3.R 685.52.1.R 685.55.1.R 685.60.1.R 686.48.2.R 688.50.3.R 688.53.3.R 688.55.3.R 688.59.3.R 691.50.3.R 691.53.3.R 691.55.3.R 691.59.3.R 695.67.2.R 697.65.1.R 698.67.1.R 699.65.1.R 700.62.1.R 701.58.2.R 703.46.3.R 703.70.3.R 707.50.3.R 707.53.3.R 707.55.3.R 707.59.3.R 710.50.3.R 710.53.3.R 710.55.3.R 710.59.3.R 713.50.3.R 713.53.3.R 713.55.3.R 713.59.3.R 716.50.3.R 716.53.3.R 716.55.3.R 716.59.3.R 719.50.3.R 719.53.3.R 719.55.3.R 719.59.3.R 723.50.3.R 723.53.3.R 723.55.3.R 723.59.3.R 726.52.3.R 726.55.3.R 726.58.3.R 726.60.3.R 729.52.3.R 729.55.3.R 729.58.3.R 729.60.3.R 732.53.3.R 732.57.3.R 732.60.3.R 735.53.3.R 735.57.3.R 735.60.3.R 738.53.3.R 738.57.3.R 738.60.3.R 744.50.3.R 744.53.3.R 744.57.3.R 748.50.3.R 748.53.3.R 748.57.3.R 751.50.3.R 751.53.3.R 751.57.3.R 754.50.3.R 754.53.3.R 754.57.3.R 757.50.3.R 757.55.3.R 757.59.3.R 760.50.3.R 760.55.3.R 760.59.3.R 763.64.2.R 765.62.2.R 767.59.1.R 768.57.1.R 769.53.3.R 769.57.3.R 772.53.3.R 772.57.3.R 772.60.3.R 776.53.3.R 776.57.3.R 776.60.3.R 779.53.3.R 779.57.3.R 779.60.3.R 782.50.3.R 782.55.3.R 782.59.3.R 785.50.3.R 785.55.3.R 785.59.3.R 788.59.2.R 790.62.1.R 791.64.1.R 792.62.1.R 793.59.1.R 794.50.2.R 794.53.2.R 794.57.2.R 796.50.2.R 796.53.2.R 796.57.2.R 798.50.2.R 798.53.2.R 798.57.2.R 800.50.3.R 800.55.3.R 800.59.3.R 804.50.3.R 804.55.3.R 804.59.3.R 807.50.2.R 807.53.2.R 807.57.2.R 809.50.2.R 809.53.2.R 809.57.2.R 811.50.2.R 811.53.2.R 811.57.2.R 813.50.3.R 813.55.3.R 813.59.3.R 816.50.3.R 816.55.3.R 816.59.3.R 819.72.2.R 821.52.2.R 823.53.2.R 825.55.2.R 827.57.2.R 829.59.2.R 831.72.1.R 832.72.2.R 834.52.2.R 836.53.2.R 838.55.1.R 839.57.1.R 840.55.3.R 844.72.2.R 846.52.2.R 848.53.2.R 850.55.2.R 852.57.1.R 853.59.3.R 856.72.1.R 857.50.2.R 857.74.2.R 859.54.1.R 860.50.1.R 861.55.2.R 863.50.2.R 863.57.2.R 865.59.1.R 866.50.1.R 866.72.1.R 867.74.2.R 869.51.1.R 870.53.1.R 871.55.2.R 873.53.1.R 874.55.1.R 875.57.2.R 877.55.1.R 878.57.1.R 879.58.2.R 881.60.2.R 883.61.1.R 884.63.1.R 885.65.1.R 886.66.1.R 887.68.1.R 888.70.1.R 889.68.1.R 890.70.1.R 891.72.1.R 892.73.2.R 894.53.1.R 895.55.1.R 896.57.1.R 897.58.1.R 898.60.1.R 899.62.1.R 900.63.1.R 901.62.1.R 902.63.1.R 903.65.1.R 904.67.2.R 906.55.1.R 907.57.1.R 908.59.2.R 910.57.1.R 911.59.1.R 912.72.1.R 913.74.1.R 914.72.1.R 915.74.1.R 916.76.1.R 917.77.2.R 919.55.3.R 919.62.3.R 938.50.2.R 940.50.1.R 941.52.1.R 942.53.1.R 943.52.1.R 944.53.1.R 945.55.1.R 946.45.1.R 947.55.1.R 948.47.1.R 949.55.1.R 950.50.1.R 951.55.1.R 952.60.1.R 952.64.1.R 953.55.1.R 953.60.1.R 954.48.1.R 954.64.1.R 955.67.1.R 956.59.1.R 956.62.1.R 957.55.1.R 957.59.1.R 958.47.1.R 958.62.1.R 959.67.1.R 960.60.1.R 960.64.1.R 961.57.1.R 962.60.3.R 962.64.3.R 962.69.3.R 965.52.2.R 965.56.2.R 965.59.2.R 967.52.2.R 967.57.2.R 967.60.2.R 969.52.2.R 969.56.2.R 969.59.2.R 971.52.2.R 971.57.2.R 971.60.2.R 973.55.2.R 973.59.2.R 973.62.2.R 975.64.1.R 975.65.1.R 976.60.1.R 976.64.1.R 976.67.1.R 977.63.1.R 977.66.1.R 978.59.1.R 979.64.1.R 979.67.1.R 980.66.1.R 980.69.1.R 981.52.1.R 981.67.1.R 981.71.1.R 982.59.1.R 983.64.1.R 984.67.1.R 985.53.1.R 985.69.1.R 986.67.1.R 987.65.1.R 988.53.1.R 988.60.1.R 989.60.2.R 989.64.2.R 991.60.1.R 992.72.1.R 993.60.1.R 994.60.1.R 994.64.1.R 995.57.1.R 996.60.1.R 996.64.1.R 997.57.1.R 998.55.1.R 998.59.1.R 999.52.1.R 1000.64.1.R 1001.52.1.R 1002.57.1.R 1002.60.1.R 1003.57.1.R 1004.60.1.R 1005.64.1.R 1006.55.1.R 1006.59.1.R 1007.52.1.R 1008.55.1.R 1009.59.1.R 1010.57.1.R 1011.60.1.R 1012.60.1.R 1012.64.1.R 1013.57.1.R 1013.64.1.R 1014.53.1.R 1015.56.3.R 1015.60.3.R 1019.53.1.R 1019.57.1.R 1020.60.3.R 1023.53.3.R 1023.57.3.R 1023.60.3.R 1027.64.1.R 1027.67.1.R 1028.60.1.R 1029.64.1.R 1030.67.1.R 1031.65.1.R 1031.69.1.R 1032.71.1.R 1033.65.1.R 1033.69.1.R 1034.71.1.R 1035.64.1.R 1035.67.1.R 1036.60.1.R 1037.64.1.R 1038.67.1.R 1039.60.1.R 1039.63.1.R 1039.66.1.R 1039.69.1.R 1040.71.1.R 1041.60.1.R 1041.63.1.R 1041.66.1.R 1041.69.1.R 1042.71.1.R 1043.59.2.R 1043.62.2.R 1043.67.2.R 1045.59.1.R 1046.62.1.R 1047.67.1.R 1048.58.1.R 1048.62.1.R 1048.67.1.R 1049.69.1.R 1050.58.1.R 1050.62.1.R 1050.67.1.R 1051.69.1.R 1052.57.1.R 1052.61.1.R 1052.64.1.R 1053.57.1.R 1054.61.1.R 1055.64.1.R 1056.58.1.R 1056.67.1.R 1057.65.1.R 1058.65.1.R 1059.64.1.R 1060.57.1.R 1060.64.1.R 1061.61.1.R 1062.57.1.R 1063.55.1.R 1064.50.1.R 1065.66.1.R 1066.74.1.R 1067.62.1.R 1068.67.1.R 1068.71.1.R 1069.74.1.R 1070.66.2.R 1070.69.2.R 1072.74.1.R 1073.65.1.R 1073.68.1.R 1074.74.1.R 1075.64.1.R 1075.67.1.R 1076.74.1.R 1077.50.3.R 1077.57.3.R 1077.66.3.R';
const BRH_HARD = '34.28.8.L 34.40.8.L 42.31.9.L 42.43.9.L 51.36.8.L 51.48.8.L 59.33.8.L 59.45.8.L 67.38.12.L 92.36.4.L 92.48.4.L 96.35.5.L 96.47.5.L 101.34.4.L 101.46.4.L 105.33.12.L 105.45.12.L 117.31.8.L 117.43.8.L 125.31.9.L 125.43.9.L 134.31.8.L 134.43.8.L 142.28.8.L 142.40.8.L 150.33.9.L 150.45.9.L 159.33.4.L 159.45.4.L 163.38.4.L 167.31.8.L 167.43.8.L 175.28.9.L 175.40.9.L 184.33.4.L 184.45.4.L 188.32.2.L 188.44.2.L 190.31.2.L 190.43.2.L 192.30.4.L 192.42.4.L 196.29.2.L 196.41.2.L 198.28.2.L 198.40.2.L 200.36.6.L 200.48.6.L 206.35.3.L 206.47.3.L 209.33.8.L 209.45.8.L 217.38.3.L 220.37.1.L 220.49.1.L 221.36.2.L 221.48.2.L 223.35.2.L 223.47.2.L 225.43.1.L 226.31.1.L 227.31.1.L 227.43.1.L 228.31.1.L 229.31.1.L 229.43.1.L 230.31.1.L 231.31.1.L 232.31.1.L 233.31.5.L 233.36.5.L 233.48.5.L 238.35.4.L 238.47.4.L 242.33.4.L 242.45.4.L 246.29.4.L 246.41.4.L 250.36.12.L 250.48.12.L 263.31.8.L 263.43.8.L 271.31.8.L 271.43.8.L 279.31.8.L 279.43.8.L 287.28.9.L 287.40.9.L 296.33.8.L 296.45.8.L 304.33.4.L 304.45.4.L 308.38.4.L 312.31.9.L 312.43.9.L 321.28.8.L 321.40.8.L 329.33.4.L 329.45.4.L 333.32.2.L 333.44.2.L 335.31.2.L 335.43.2.L 337.30.4.L 337.42.4.L 341.29.3.L 341.41.3.L 344.28.2.L 344.40.2.L 346.36.6.L 346.48.6.L 352.35.2.L 352.47.2.L 354.33.8.L 354.45.8.L 362.38.3.L 365.37.1.L 365.49.1.L 366.36.2.L 366.48.2.L 368.35.3.L 368.47.3.L 371.43.1.L 372.43.1.L 373.43.1.L 374.43.1.L 375.43.1.L 376.43.1.L 377.43.1.L 378.43.1.L 379.43.1.L 380.36.3.L 383.35.4.L 387.33.8.L 395.38.4.L 399.37.1.L 399.49.1.L 400.36.2.L 400.48.2.L 402.35.2.L 402.47.2.L 404.31.1.L 404.43.1.L 405.31.1.L 406.43.1.L 407.31.1.L 407.43.1.L 408.31.1.L 408.43.1.L 409.31.1.L 409.43.1.L 410.31.1.L 410.43.1.L 411.31.1.L 411.43.1.L 412.31.4.L 412.36.4.L 412.48.4.L 416.35.4.L 420.33.9.L 429.38.3.L 432.37.1.L 432.49.1.L 433.36.2.L 433.48.2.L 435.35.2.L 435.47.2.L 437.34.3.L 437.46.3.L 440.33.1.L 440.34.1.L 440.45.1.L 440.46.1.L 441.32.2.L 441.44.2.L 443.31.2.L 443.43.2.L 445.30.12.L 445.42.12.L 470.29.2.L 470.41.2.L 472.29.1.L 472.41.1.L 473.29.1.L 473.41.1.L 474.29.1.L 474.41.1.L 475.28.1.L 475.40.1.L 476.28.1.L 476.40.1.L 477.25.2.L 477.37.2.L 479.30.9.L 479.42.9.L 488.42.1.L 489.42.1.L 490.42.1.L 490.43.1.L 491.38.1.L 491.40.1.L 492.37.5.L 492.49.5.L 497.43.9.L 506.36.1.L 506.48.1.L 507.36.1.L 507.48.1.L 508.36.1.L 508.48.1.L 509.36.1.L 509.48.1.L 510.36.1.L 510.48.1.L 511.36.1.L 511.48.1.L 512.36.1.L 512.48.1.L 513.36.1.L 513.48.1.L 514.41.2.L 516.41.1.L 517.40.1.L 518.40.1.L 519.36.1.L 519.38.1.L 519.48.1.L 520.31.1.L 520.33.1.L 520.35.1.L 520.45.1.L 520.47.1.L 521.43.12.L 534.31.1.L 534.43.1.L 535.36.1.L 535.48.1.L 536.31.1.L 536.43.1.L 537.36.1.L 537.48.1.L 538.31.1.L 538.43.1.L 539.31.1.L 539.43.1.L 540.31.1.L 540.43.1.L 541.31.1.L 541.43.1.L 542.31.2.L 542.43.2.L 544.31.1.L 544.43.1.L 545.36.1.L 545.48.1.L 546.31.1.L 546.43.1.L 547.31.1.L 547.43.1.L 548.31.1.L 548.43.1.L 549.31.1.L 549.43.1.L 550.31.2.L 550.43.2.L 552.31.1.L 552.43.1.L 553.36.1.L 553.48.1.L 554.31.1.L 554.43.1.L 555.31.1.L 555.43.1.L 556.31.1.L 556.43.1.L 557.31.1.L 557.43.1.L 558.31.2.L 558.43.2.L 560.31.1.L 560.43.1.L 561.31.1.L 561.43.1.L 562.31.2.L 562.43.2.L 564.31.1.L 564.43.1.L 565.31.1.L 565.43.1.L 566.31.6.L 566.43.6.L 572.32.1.L 572.44.1.L 573.30.1.L 573.42.1.L 574.35.1.L 574.47.1.L 575.34.1.L 575.46.1.L 576.39.1.L 577.31.1.L 577.43.1.L 578.36.5.L 578.48.5.L 583.36.1.L 583.48.1.L 584.36.1.L 584.48.1.L 585.36.1.L 585.41.1.L 585.48.1.L 586.33.1.L 586.35.1.L 586.45.1.L 586.47.1.L 587.31.2.L 587.43.2.L 589.36.1.L 589.48.1.L 590.36.1.L 590.48.1.L 591.29.1.L 591.41.1.L 592.29.1.L 592.41.1.L 593.33.1.L 593.35.1.L 593.45.1.L 593.47.1.L 594.31.1.L 594.43.1.L 595.30.1.L 595.42.1.L 596.28.1.L 596.40.1.L 597.31.1.L 597.43.1.L 598.31.1.L 598.43.1.L 599.31.1.L 599.43.1.L 600.31.1.L 600.43.1.L 601.31.1.L 601.43.1.L 602.31.1.L 602.43.1.L 603.31.1.L 603.43.1.L 604.31.1.L 604.43.1.L 605.31.1.L 605.43.1.L 606.31.1.L 606.43.1.L 607.31.1.L 607.43.1.L 608.31.1.L 608.43.1.L 609.31.1.L 609.43.1.L 610.31.1.L 610.43.1.L 611.31.2.L 611.43.2.L 613.31.1.L 613.43.1.L 614.36.3.L 614.48.3.L 617.36.3.L 617.48.3.L 620.36.3.L 620.48.3.L 623.36.3.L 623.48.3.L 626.36.3.L 626.48.3.L 629.36.3.L 629.48.3.L 632.36.3.L 632.48.3.L 635.36.3.L 635.48.3.L 638.36.4.L 638.48.4.L 642.36.3.L 642.48.3.L 645.36.3.L 645.48.3.L 648.36.3.L 648.48.3.L 651.26.3.L 651.38.3.L 654.26.3.L 654.38.3.L 657.26.3.L 657.38.3.L 660.26.3.L 660.38.3.L 663.43.2.L 665.31.3.L 668.43.2.L 670.43.2.L 672.31.2.L 674.43.2.L 676.43.2.L 678.31.2.L 680.43.4.L 684.36.4.L 688.43.2.L 690.31.2.L 692.43.3.L 695.43.2.L 697.41.1.L 698.43.1.L 699.41.1.L 700.38.1.L 701.34.6.L 707.43.2.L 709.31.2.L 711.43.2.L 713.43.2.L 715.31.2.L 717.43.2.L 719.43.3.L 722.31.2.L 724.43.2.L 726.36.2.L 728.24.2.L 730.36.2.L 732.41.2.L 734.29.2.L 736.41.4.L 740.29.2.L 740.41.2.L 742.28.2.L 742.40.2.L 744.38.2.L 746.26.3.L 749.38.2.L 751.38.2.L 753.26.2.L 755.38.2.L 757.43.2.L 759.31.2.L 761.43.2.L 763.43.2.L 765.31.2.L 767.43.2.L 769.38.2.L 771.26.2.L 773.38.3.L 776.38.2.L 778.26.2.L 780.38.2.L 782.43.2.L 784.31.2.L 786.43.2.L 788.43.2.L 790.31.2.L 792.43.2.L 794.26.2.L 794.38.2.L 796.26.2.L 796.38.2.L 798.26.2.L 798.38.2.L 800.43.3.L 803.31.2.L 805.43.2.L 807.26.2.L 807.38.2.L 809.26.2.L 809.38.2.L 811.26.2.L 811.38.2.L 813.43.2.L 815.31.2.L 817.43.2.L 819.36.3.L 819.48.3.L 822.36.3.L 822.48.3.L 825.36.4.L 825.48.4.L 829.36.3.L 829.48.3.L 832.36.3.L 832.48.3.L 835.36.3.L 835.48.3.L 838.36.3.L 838.48.3.L 841.36.3.L 841.48.3.L 844.36.3.L 844.48.3.L 847.36.3.L 847.48.3.L 850.36.3.L 850.48.3.L 853.36.4.L 853.48.4.L 857.38.3.L 860.38.3.L 863.38.3.L 866.38.3.L 869.27.6.L 869.39.6.L 875.29.4.L 875.41.4.L 879.30.2.L 879.42.2.L 881.32.12.L 881.44.12.L 894.29.12.L 894.41.12.L 906.31.12.L 906.43.12.L 919.31.12.L 919.43.12.L 931.31.1.L 931.43.1.L 932.33.1.L 932.45.1.L 933.35.1.L 933.47.1.L 934.33.1.L 934.45.1.L 935.35.2.L 935.47.2.L 937.36.1.L 937.48.1.L 938.38.1.L 939.36.1.L 939.48.1.L 940.38.1.L 941.40.1.L 942.41.1.L 943.40.1.L 944.41.1.L 945.43.2.L 947.43.2.L 949.43.2.L 951.43.1.L 952.36.2.L 954.43.1.L 955.43.1.L 956.36.1.L 957.35.2.L 959.35.1.L 960.33.2.L 960.45.2.L 962.33.3.L 962.45.3.L 965.32.2.L 965.44.2.L 967.33.2.L 967.45.2.L 969.32.2.L 969.44.2.L 971.33.2.L 971.45.2.L 973.31.1.L 973.43.1.L 974.29.1.L 974.41.1.L 975.26.1.L 975.28.1.L 975.38.1.L 975.40.1.L 976.24.1.L 976.36.1.L 977.35.4.L 977.47.4.L 981.40.4.L 985.41.3.L 988.41.1.L 989.36.4.L 989.48.4.L 993.35.1.L 993.36.1.L 994.33.4.L 994.45.4.L 998.28.4.L 998.40.4.L 1002.33.4.L 1002.45.4.L 1006.28.4.L 1006.40.4.L 1010.33.4.L 1010.45.4.L 1014.29.5.L 1014.41.5.L 1019.31.8.L 1019.43.8.L 1027.36.8.L 1027.48.8.L 1035.36.4.L 1035.48.4.L 1039.36.4.L 1039.48.4.L 1043.35.5.L 1043.47.5.L 1048.34.4.L 1048.46.4.L 1052.33.8.L 1052.45.8.L 1060.33.4.L 1060.45.4.L 1064.38.12.L 1077.38.12.L 0.59.1.R 0.62.1.R 0.64.1.R 0.67.1.R 1.59.1.R 1.62.1.R 1.64.1.R 1.67.1.R 2.59.1.R 2.62.1.R 2.64.1.R 2.67.1.R 3.59.2.R 3.62.2.R 3.64.2.R 3.67.2.R 5.59.3.R 5.62.3.R 5.64.3.R 5.67.3.R 8.57.1.R 8.61.1.R 8.64.1.R 8.67.1.R 9.57.1.R 9.61.1.R 9.64.1.R 9.67.1.R 10.59.1.R 10.62.1.R 10.64.1.R 10.67.1.R 11.57.1.R 11.61.1.R 11.64.1.R 11.67.1.R 12.55.1.R 12.61.1.R 12.64.1.R 13.55.3.R 13.61.3.R 13.64.3.R 16.57.1.R 16.60.1.R 16.62.1.R 16.66.1.R 17.57.2.R 17.60.2.R 17.62.2.R 17.66.2.R 19.57.1.R 19.60.1.R 19.62.1.R 19.66.1.R 20.57.2.R 20.60.2.R 20.64.2.R 20.67.2.R 22.57.2.R 22.60.2.R 22.62.2.R 22.66.2.R 24.50.1.R 24.62.1.R 25.50.1.R 25.62.1.R 26.55.1.R 26.59.1.R 26.62.1.R 26.67.1.R 27.55.1.R 27.59.1.R 27.62.1.R 27.67.1.R 28.57.1.R 28.60.1.R 28.64.1.R 28.67.1.R 29.55.1.R 29.59.1.R 29.62.1.R 29.67.1.R 30.54.1.R 30.57.1.R 30.60.1.R 30.62.1.R 31.50.3.R 31.55.3.R 31.59.3.R 31.62.3.R 34.55.1.R 34.59.1.R 35.52.1.R 36.55.1.R 37.59.1.R 38.64.1.R 39.59.1.R 40.55.1.R 41.52.1.R 42.47.1.R 43.50.1.R 43.55.1.R 44.53.3.R 51.64.1.R 51.67.1.R 52.60.1.R 53.64.1.R 54.67.1.R 55.65.1.R 55.69.1.R 56.72.1.R 57.64.1.R 57.67.1.R 58.72.1.R 59.60.1.R 59.64.1.R 60.57.1.R 61.57.1.R 61.60.1.R 61.69.1.R 62.57.1.R 62.60.1.R 62.64.1.R 63.45.1.R 64.57.1.R 64.60.1.R 64.64.1.R 65.45.1.R 66.57.1.R 67.50.1.R 67.62.1.R 67.66.1.R 68.57.1.R 69.57.1.R 69.62.1.R 69.66.1.R 70.57.3.R 70.62.3.R 70.66.3.R 76.60.2.R 76.63.2.R 76.68.2.R 78.59.2.R 78.62.2.R 78.67.2.R 80.58.2.R 80.61.2.R 80.66.2.R 82.59.2.R 82.62.2.R 82.67.2.R 84.60.2.R 84.63.2.R 84.68.2.R 86.59.2.R 86.62.2.R 86.67.2.R 88.58.2.R 88.61.2.R 88.66.2.R 90.59.2.R 90.62.2.R 90.67.2.R 92.64.1.R 92.67.1.R 93.60.1.R 94.64.1.R 94.67.1.R 94.72.1.R 95.60.1.R 96.62.1.R 96.67.1.R 97.59.1.R 98.62.2.R 98.67.2.R 100.59.1.R 101.61.1.R 101.64.1.R 101.67.1.R 102.58.1.R 103.61.1.R 103.64.1.R 103.67.1.R 104.58.1.R 105.60.1.R 105.62.1.R 105.66.1.R 106.57.1.R 107.60.3.R 107.62.3.R 107.66.3.R 110.57.1.R 111.60.1.R 112.62.1.R 113.62.1.R 114.66.3.R 114.69.3.R 114.72.3.R 117.55.1.R 117.59.1.R 118.50.1.R 119.55.1.R 120.59.1.R 121.64.1.R 121.76.1.R 122.50.1.R 123.62.1.R 123.74.1.R 124.50.1.R 125.55.2.R 125.59.2.R 127.50.1.R 128.55.1.R 129.59.1.R 130.64.1.R 130.76.1.R 131.50.1.R 132.62.1.R 132.74.1.R 133.50.1.R 134.55.1.R 134.59.1.R 135.50.1.R 136.55.1.R 137.59.1.R 138.64.1.R 138.76.1.R 139.50.1.R 140.62.1.R 140.74.1.R 141.50.1.R 142.55.1.R 142.59.1.R 143.52.1.R 144.55.1.R 145.59.1.R 146.66.1.R 146.78.1.R 147.52.1.R 148.64.1.R 148.76.1.R 149.52.1.R 150.60.1.R 150.64.1.R 151.57.1.R 152.60.2.R 154.64.1.R 155.71.1.R 155.83.1.R 156.57.1.R 157.69.1.R 157.81.1.R 158.57.1.R 159.57.1.R 159.60.1.R 159.67.1.R 160.57.1.R 161.60.1.R 162.64.1.R 163.50.1.R 163.62.1.R 163.66.1.R 164.60.1.R 165.62.1.R 166.69.1.R 167.55.1.R 167.59.1.R 168.50.1.R 169.55.1.R 170.59.1.R 171.64.1.R 171.76.1.R 172.50.1.R 173.62.1.R 173.74.1.R 174.50.1.R 175.55.1.R 175.59.1.R 176.52.1.R 177.55.1.R 178.59.1.R 179.66.2.R 179.78.2.R 181.52.1.R 182.64.1.R 182.76.1.R 183.52.1.R 184.57.1.R 184.60.1.R 185.57.1.R 186.60.1.R 187.64.1.R 188.56.1.R 188.60.1.R 189.64.1.R 190.55.1.R 190.60.1.R 191.64.1.R 192.54.1.R 192.60.1.R 193.54.1.R 194.60.1.R 195.64.1.R 196.53.1.R 196.60.1.R 197.64.1.R 198.52.1.R 198.60.1.R 199.64.1.R 200.64.1.R 200.67.1.R 201.60.1.R 202.64.1.R 202.67.1.R 202.72.1.R 203.60.1.R 204.64.1.R 204.67.1.R 205.60.1.R 206.59.2.R 206.62.2.R 208.67.1.R 209.60.1.R 209.64.1.R 210.57.1.R 211.60.1.R 212.64.1.R 213.71.1.R 213.83.1.R 214.57.1.R 215.69.1.R 215.81.1.R 216.57.1.R 217.50.1.R 217.62.1.R 217.65.1.R 218.62.1.R 219.62.1.R 219.65.1.R 220.61.1.R 220.65.1.R 221.60.1.R 221.65.1.R 222.60.1.R 223.59.1.R 223.65.1.R 224.59.1.R 225.55.2.R 225.59.2.R 227.59.2.R 227.62.2.R 229.59.2.R 229.64.2.R 231.59.2.R 231.65.2.R 233.64.2.R 233.67.2.R 235.60.1.R 236.64.1.R 236.67.1.R 236.72.1.R 237.60.1.R 238.62.1.R 238.67.1.R 239.59.1.R 240.62.1.R 240.67.1.R 241.59.1.R 242.60.1.R 242.64.1.R 243.57.1.R 244.60.1.R 244.64.1.R 245.57.1.R 246.53.1.R 247.56.3.R 247.60.3.R 250.64.1.R 250.67.1.R 251.60.1.R 252.64.1.R 253.67.1.R 254.65.1.R 254.69.1.R 255.72.1.R 256.64.1.R 256.67.1.R 257.72.1.R 258.63.1.R 258.66.1.R 259.72.1.R 260.62.2.R 260.65.2.R 262.72.1.R 263.55.1.R 263.59.1.R 264.50.1.R 265.55.1.R 266.59.1.R 267.64.1.R 267.76.1.R 268.50.1.R 269.62.1.R 269.74.1.R 270.50.1.R 271.55.1.R 271.59.1.R 272.50.1.R 273.55.1.R 274.59.1.R 275.64.1.R 275.76.1.R 276.50.1.R 277.62.1.R 277.74.1.R 278.50.1.R 279.55.1.R 279.59.1.R 280.50.1.R 281.55.1.R 282.59.1.R 283.64.1.R 283.76.1.R 284.50.1.R 285.62.1.R 285.74.1.R 286.50.1.R 287.55.2.R 287.59.2.R 289.52.1.R 290.55.1.R 291.59.1.R 292.66.1.R 292.78.1.R 293.52.1.R 294.64.1.R 294.76.1.R 295.52.1.R 296.60.1.R 296.64.1.R 297.57.1.R 298.60.1.R 299.64.1.R 300.71.1.R 300.83.1.R 301.57.1.R 302.69.1.R 302.81.1.R 303.57.1.R 304.57.1.R 304.60.1.R 304.67.1.R 305.57.1.R 306.60.1.R 307.64.1.R 308.50.1.R 308.62.1.R 308.66.1.R 309.60.1.R 310.62.1.R 311.69.1.R 312.55.1.R 312.59.1.R 313.50.1.R 314.55.2.R 316.59.1.R 317.64.1.R 317.76.1.R 318.50.1.R 319.62.1.R 319.74.1.R 320.50.1.R 321.55.1.R 321.59.1.R 322.52.1.R 323.55.1.R 324.59.1.R 325.66.1.R 325.78.1.R 326.52.1.R 327.64.1.R 327.76.1.R 328.52.1.R 329.57.1.R 329.60.1.R 330.57.1.R 331.60.1.R 332.64.1.R 333.56.1.R 333.60.1.R 334.64.1.R 335.55.1.R 335.60.1.R 336.64.1.R 337.54.1.R 337.60.1.R 338.54.1.R 339.60.1.R 340.64.1.R 341.53.2.R 341.60.2.R 343.64.1.R 344.52.1.R 344.60.1.R 345.64.1.R 346.64.1.R 346.67.1.R 347.60.1.R 348.64.1.R 348.67.1.R 348.72.1.R 349.60.1.R 350.64.1.R 350.67.1.R 351.60.1.R 352.59.1.R 352.62.1.R 353.67.1.R 354.60.1.R 354.64.1.R 355.57.1.R 356.60.1.R 357.64.1.R 358.71.1.R 358.83.1.R 359.57.1.R 360.69.1.R 360.81.1.R 361.57.1.R 362.50.1.R 362.62.1.R 362.65.1.R 363.62.1.R 364.62.1.R 364.65.1.R 365.61.1.R 365.65.1.R 366.60.1.R 366.65.1.R 367.60.1.R 368.59.2.R 368.65.2.R 370.59.1.R 371.55.1.R 371.59.1.R 372.55.1.R 372.59.1.R 372.62.1.R 373.55.1.R 373.59.1.R 373.62.1.R 374.55.1.R 374.59.1.R 374.64.1.R 375.55.1.R 375.59.1.R 375.64.1.R 376.55.1.R 376.59.1.R 376.65.1.R 377.55.2.R 377.59.2.R 377.65.2.R 379.48.1.R 379.64.1.R 379.67.1.R 380.60.1.R 381.48.1.R 381.64.1.R 381.67.1.R 381.72.1.R 382.62.1.R 383.48.1.R 383.60.1.R 383.67.1.R 384.47.1.R 384.59.1.R 384.62.1.R 385.47.1.R 385.62.1.R 385.67.1.R 386.64.1.R 387.47.1.R 387.60.1.R 387.64.1.R 387.69.1.R 388.45.1.R 388.57.1.R 389.60.1.R 390.64.1.R 391.69.1.R 391.83.1.R 392.71.1.R 393.72.1.R 393.81.1.R 394.69.1.R 394.71.1.R 395.50.1.R 395.62.1.R 395.65.1.R 395.72.1.R 395.74.1.R 396.69.1.R 397.62.1.R 398.62.2.R 398.65.2.R 400.74.1.R 400.76.1.R 401.77.1.R 401.79.1.R 402.81.2.R 404.77.1.R 404.79.1.R 405.76.1.R 406.77.1.R 407.74.1.R 407.76.1.R 408.71.1.R 408.76.1.R 409.76.1.R 410.67.1.R 410.74.1.R 411.72.1.R 412.71.1.R 413.67.1.R 413.69.1.R 413.72.1.R 414.48.1.R 414.71.1.R 415.72.1.R 416.48.1.R 416.69.1.R 416.74.1.R 417.47.1.R 417.67.1.R 417.69.1.R 417.71.1.R 417.76.1.R 418.47.1.R 418.69.1.R 418.71.1.R 418.74.1.R 418.77.1.R 419.72.1.R 419.79.1.R 419.81.1.R 420.47.1.R 420.76.1.R 421.45.1.R 421.57.1.R 421.77.1.R 422.60.2.R 422.79.2.R 424.64.1.R 424.71.1.R 424.72.1.R 425.69.1.R 425.83.1.R 426.71.1.R 426.72.1.R 427.69.1.R 427.81.1.R 428.71.1.R 428.72.1.R 429.50.1.R 429.62.1.R 429.65.1.R 429.74.1.R 430.62.1.R 431.62.1.R 431.65.1.R 432.64.1.R 433.60.1.R 433.65.1.R 434.60.1.R 435.62.1.R 435.65.1.R 435.74.1.R 436.59.1.R 437.62.1.R 437.65.1.R 438.58.1.R 439.62.1.R 439.65.1.R 439.70.1.R 440.62.2.R 440.65.2.R 440.70.2.R 442.58.1.R 443.62.1.R 444.58.1.R 444.65.1.R 445.54.1.R 445.61.1.R 445.62.1.R 446.54.1.R 446.58.1.R 446.61.1.R 446.65.1.R 447.54.1.R 447.58.1.R 447.61.1.R 447.62.1.R 448.54.1.R 448.58.1.R 448.61.1.R 449.54.2.R 449.58.2.R 449.61.2.R 451.54.1.R 451.58.1.R 451.61.1.R 452.54.1.R 452.58.1.R 452.61.1.R 453.54.1.R 453.58.1.R 453.61.1.R 454.54.1.R 454.59.1.R 454.63.1.R 455.54.1.R 455.58.1.R 455.61.1.R 456.54.1.R 456.57.1.R 456.60.1.R 457.54.1.R 457.58.1.R 457.61.1.R 458.54.1.R 458.59.1.R 458.63.1.R 459.54.1.R 459.58.1.R 459.61.1.R 460.54.1.R 460.58.1.R 460.61.1.R 461.54.1.R 461.57.1.R 461.58.1.R 461.60.1.R 461.61.1.R 462.54.1.R 462.58.1.R 462.61.1.R 463.54.1.R 463.58.1.R 463.59.1.R 463.61.1.R 463.63.1.R 464.54.1.R 464.58.1.R 464.61.1.R 465.54.1.R 465.58.1.R 465.59.1.R 465.61.1.R 465.63.1.R 466.54.1.R 466.58.1.R 466.61.1.R 467.54.1.R 467.57.1.R 467.60.1.R 468.54.1.R 468.58.1.R 468.59.1.R 468.61.1.R 468.63.1.R 469.54.1.R 469.58.1.R 469.61.1.R 470.53.1.R 470.58.1.R 470.62.1.R 471.53.1.R 471.58.1.R 471.62.1.R 472.53.1.R 472.57.1.R 472.60.1.R 473.53.1.R 473.57.1.R 473.60.1.R 474.57.1.R 474.61.1.R 474.64.1.R 475.57.1.R 475.61.1.R 475.64.1.R 476.56.2.R 476.59.2.R 476.65.2.R 478.56.1.R 478.59.1.R 478.65.1.R 479.58.1.R 479.61.1.R 479.66.1.R 480.73.1.R 481.73.1.R 481.74.1.R 482.54.1.R 483.54.1.R 483.55.1.R 484.73.1.R 485.73.1.R 485.74.1.R 486.54.1.R 487.54.1.R 488.54.1.R 488.55.1.R 489.54.1.R 490.54.1.R 490.55.1.R 491.50.1.R 491.52.1.R 492.55.1.R 492.67.1.R 493.55.1.R 493.67.1.R 494.52.1.R 494.64.1.R 494.67.1.R 495.48.2.R 495.60.2.R 497.55.1.R 497.60.1.R 497.63.1.R 497.68.1.R 498.59.1.R 498.62.1.R 498.67.1.R 499.58.1.R 499.61.1.R 499.66.1.R 500.59.1.R 500.62.1.R 500.67.1.R 501.60.1.R 501.63.1.R 501.68.1.R 502.59.1.R 502.62.1.R 502.67.1.R 503.58.2.R 503.61.2.R 503.66.2.R 505.59.1.R 505.62.1.R 505.67.1.R 506.60.1.R 506.65.1.R 506.69.1.R 507.60.1.R 507.64.1.R 507.67.1.R 508.60.1.R 508.63.1.R 508.66.1.R 509.60.1.R 509.64.1.R 509.67.1.R 510.60.1.R 510.65.1.R 510.69.1.R 511.60.1.R 511.64.1.R 511.67.1.R 512.60.1.R 512.63.1.R 512.66.1.R 513.60.1.R 513.64.1.R 513.67.1.R 514.53.1.R 514.60.1.R 514.65.1.R 514.69.1.R 515.60.1.R 515.65.1.R 515.69.1.R 516.53.1.R 516.60.1.R 516.67.1.R 516.71.1.R 517.52.1.R 517.60.1.R 517.64.1.R 518.52.1.R 518.60.1.R 518.62.1.R 518.66.1.R 519.50.1.R 519.59.1.R 519.60.1.R 519.66.1.R 520.59.1.R 520.62.1.R 520.67.1.R 521.67.1.R 522.67.1.R 522.69.1.R 523.64.1.R 523.65.1.R 523.67.1.R 523.72.1.R 524.63.1.R 524.66.1.R 524.72.1.R 525.62.1.R 525.65.1.R 525.72.1.R 526.60.1.R 526.63.1.R 526.68.1.R 526.72.1.R 527.59.1.R 527.62.1.R 527.67.1.R 528.58.1.R 528.61.1.R 528.66.1.R 529.59.1.R 529.62.1.R 529.67.1.R 530.60.2.R 530.63.2.R 530.68.2.R 532.59.1.R 532.62.1.R 532.67.1.R 533.58.1.R 533.61.1.R 533.66.1.R 534.50.1.R 534.55.1.R 534.59.1.R 535.52.1.R 535.55.1.R 535.60.1.R 536.50.1.R 536.55.1.R 536.59.1.R 537.60.1.R 537.64.1.R 537.67.1.R 538.55.1.R 538.59.1.R 539.55.1.R 539.59.1.R 539.60.1.R 540.55.1.R 540.62.1.R 541.55.1.R 541.60.1.R 542.55.2.R 542.59.2.R 544.50.1.R 544.55.1.R 544.59.1.R 545.52.1.R 545.55.1.R 545.60.1.R 546.50.1.R 546.55.1.R 546.59.1.R 547.55.1.R 547.59.1.R 548.55.1.R 548.59.1.R 548.60.1.R 549.55.1.R 549.60.1.R 549.62.1.R 550.55.2.R 550.59.2.R 552.50.1.R 552.55.1.R 552.59.1.R 553.52.1.R 553.55.1.R 553.60.1.R 554.50.1.R 554.55.1.R 554.59.1.R 555.55.1.R 555.59.1.R 556.55.1.R 556.59.1.R 556.60.1.R 557.55.1.R 557.60.1.R 557.62.1.R 558.55.2.R 558.59.2.R 560.55.1.R 560.59.1.R 560.60.1.R 561.55.1.R 561.60.1.R 561.62.1.R 562.55.2.R 562.59.2.R 564.55.1.R 564.59.1.R 564.60.1.R 565.55.1.R 565.60.1.R 565.62.1.R 566.55.1.R 566.59.1.R 567.59.1.R 568.59.1.R 569.58.1.R 569.67.1.R 570.63.1.R 571.73.1.R 572.59.1.R 572.63.1.R 572.68.1.R 573.61.1.R 573.64.1.R 573.66.1.R 574.63.1.R 574.66.1.R 574.71.1.R 575.65.1.R 575.68.1.R 575.70.1.R 576.51.1.R 576.61.1.R 576.67.1.R 576.75.1.R 577.62.1.R 577.67.1.R 577.71.1.R 578.64.3.R 578.72.3.R 583.60.1.R 583.64.1.R 583.67.1.R 584.60.1.R 584.64.1.R 584.67.1.R 584.69.1.R 585.53.1.R 585.60.1.R 585.64.1.R 585.65.1.R 585.67.1.R 586.57.1.R 586.59.1.R 587.47.2.R 587.50.2.R 587.53.2.R 587.55.2.R 589.60.1.R 589.64.1.R 589.67.1.R 590.60.1.R 590.64.1.R 590.67.1.R 591.60.1.R 591.65.1.R 591.69.1.R 592.60.1.R 592.65.1.R 592.69.1.R 593.59.1.R 593.63.1.R 593.65.1.R 594.59.1.R 594.63.1.R 594.65.1.R 595.59.1.R 595.63.1.R 595.65.1.R 596.59.1.R 596.64.1.R 596.67.1.R 597.50.3.R 597.53.3.R 597.55.3.R 597.59.3.R 601.50.3.R 601.53.3.R 601.55.3.R 601.59.3.R 605.50.3.R 605.53.3.R 605.55.3.R 605.59.3.R 609.50.1.R 609.53.1.R 609.55.1.R 609.59.1.R 610.50.1.R 610.53.1.R 610.55.1.R 610.59.1.R 611.50.2.R 611.53.2.R 611.55.2.R 611.59.2.R 613.50.1.R 613.53.1.R 613.55.1.R 613.59.1.R 614.60.2.R 614.72.2.R 616.52.2.R 616.64.2.R 618.53.2.R 618.65.2.R 620.55.2.R 620.67.2.R 622.57.1.R 622.69.1.R 623.59.2.R 623.71.2.R 625.60.1.R 625.72.1.R 626.60.2.R 626.72.2.R 628.52.2.R 628.64.2.R 630.53.2.R 630.65.2.R 632.55.1.R 632.67.1.R 633.57.1.R 633.69.1.R 634.55.3.R 634.67.3.R 638.60.3.R 638.72.3.R 641.52.2.R 641.64.2.R 643.53.2.R 643.65.2.R 645.55.2.R 645.67.2.R 647.57.1.R 647.69.1.R 648.59.2.R 648.71.2.R 650.60.1.R 650.72.1.R 651.62.2.R 651.74.2.R 653.54.2.R 653.66.2.R 655.55.2.R 655.67.2.R 657.57.1.R 657.69.1.R 658.59.1.R 658.71.1.R 659.57.3.R 659.69.3.R 663.50.3.R 663.53.3.R 663.55.3.R 663.59.3.R 667.50.3.R 667.53.3.R 667.55.3.R 667.59.3.R 670.50.3.R 670.53.3.R 670.55.3.R 670.59.3.R 673.50.3.R 673.53.3.R 673.55.3.R 673.59.3.R 676.50.3.R 676.53.3.R 676.55.3.R 676.59.3.R 679.50.3.R 679.53.3.R 679.55.3.R 679.59.3.R 682.48.3.R 682.52.3.R 682.55.3.R 682.60.3.R 685.52.1.R 685.55.1.R 685.60.1.R 686.48.2.R 688.50.3.R 688.53.3.R 688.55.3.R 688.59.3.R 691.50.3.R 691.53.3.R 691.55.3.R 691.59.3.R 695.67.2.R 697.65.1.R 698.67.1.R 699.65.1.R 700.62.1.R 701.58.2.R 703.46.3.R 703.70.3.R 707.50.3.R 707.53.3.R 707.55.3.R 707.59.3.R 710.50.3.R 710.53.3.R 710.55.3.R 710.59.3.R 713.50.3.R 713.53.3.R 713.55.3.R 713.59.3.R 716.50.3.R 716.53.3.R 716.55.3.R 716.59.3.R 719.50.3.R 719.53.3.R 719.55.3.R 719.59.3.R 723.50.3.R 723.53.3.R 723.55.3.R 723.59.3.R 726.52.3.R 726.55.3.R 726.58.3.R 726.60.3.R 729.52.3.R 729.55.3.R 729.58.3.R 729.60.3.R 732.53.3.R 732.57.3.R 732.60.3.R 732.65.3.R 735.53.3.R 735.57.3.R 735.60.3.R 735.65.3.R 738.53.3.R 738.57.3.R 738.60.3.R 738.65.3.R 744.50.3.R 744.53.3.R 744.57.3.R 748.50.3.R 748.53.3.R 748.57.3.R 751.50.3.R 751.53.3.R 751.57.3.R 754.50.3.R 754.53.3.R 754.57.3.R 757.50.3.R 757.55.3.R 757.59.3.R 760.50.3.R 760.55.3.R 760.59.3.R 763.64.2.R 765.62.2.R 767.59.1.R 768.57.1.R 769.53.3.R 769.57.3.R 772.53.3.R 772.57.3.R 772.60.3.R 776.53.3.R 776.57.3.R 776.60.3.R 779.53.3.R 779.57.3.R 779.60.3.R 782.50.3.R 782.55.3.R 782.59.3.R 785.50.3.R 785.55.3.R 785.59.3.R 788.59.2.R 790.62.1.R 791.64.1.R 792.62.1.R 793.59.1.R 794.50.2.R 794.53.2.R 794.57.2.R 796.50.2.R 796.53.2.R 796.57.2.R 798.50.2.R 798.53.2.R 798.57.2.R 800.50.3.R 800.55.3.R 800.59.3.R 804.50.3.R 804.55.3.R 804.59.3.R 807.50.2.R 807.53.2.R 807.57.2.R 809.50.2.R 809.53.2.R 809.57.2.R 811.50.2.R 811.53.2.R 811.57.2.R 813.50.3.R 813.55.3.R 813.59.3.R 816.50.3.R 816.55.3.R 816.59.3.R 819.60.2.R 819.72.2.R 821.52.2.R 821.64.2.R 823.53.2.R 823.65.2.R 825.55.2.R 825.67.2.R 827.57.2.R 827.69.2.R 829.59.2.R 829.71.2.R 831.60.1.R 831.72.1.R 832.60.2.R 832.72.2.R 834.52.2.R 834.64.2.R 836.53.2.R 836.65.2.R 838.55.1.R 838.67.1.R 839.57.1.R 839.69.1.R 840.55.3.R 840.67.3.R 844.60.2.R 844.72.2.R 846.52.2.R 846.64.2.R 848.53.2.R 848.65.2.R 850.55.2.R 850.67.2.R 852.57.1.R 852.69.1.R 853.59.3.R 853.71.3.R 856.60.1.R 856.72.1.R 857.50.2.R 857.62.2.R 857.74.2.R 859.54.1.R 859.66.1.R 860.50.1.R 861.55.2.R 861.67.2.R 863.50.2.R 863.57.2.R 863.69.2.R 865.59.1.R 865.71.1.R 866.50.1.R 866.60.1.R 866.72.1.R 867.62.2.R 867.74.2.R 869.51.1.R 870.53.1.R 871.55.2.R 873.53.1.R 874.55.1.R 875.57.2.R 877.55.1.R 878.57.1.R 879.58.2.R 881.60.2.R 883.61.1.R 884.63.1.R 885.65.1.R 886.66.1.R 887.68.1.R 888.70.1.R 889.68.1.R 890.70.1.R 891.72.1.R 892.73.2.R 894.53.1.R 895.55.1.R 896.57.1.R 897.58.1.R 898.60.1.R 899.62.1.R 900.63.1.R 901.62.1.R 902.63.1.R 903.65.1.R 904.67.2.R 906.55.1.R 906.67.1.R 907.57.1.R 907.69.1.R 908.59.2.R 908.71.2.R 910.57.1.R 910.69.1.R 911.59.1.R 911.71.1.R 912.60.1.R 912.72.1.R 913.62.1.R 913.74.1.R 914.60.1.R 914.72.1.R 915.62.1.R 915.74.1.R 916.64.1.R 916.76.1.R 917.65.2.R 917.77.2.R 919.55.3.R 919.62.3.R 919.67.3.R 938.50.2.R 940.50.1.R 941.52.1.R 942.53.1.R 943.52.1.R 944.53.1.R 945.55.1.R 946.45.1.R 946.57.1.R 947.55.1.R 948.47.1.R 948.59.1.R 949.55.1.R 950.50.1.R 950.62.1.R 951.55.1.R 952.60.1.R 952.64.1.R 953.55.1.R 953.60.1.R 954.48.1.R 954.64.1.R 955.67.1.R 956.59.1.R 956.62.1.R 957.55.1.R 957.59.1.R 958.47.1.R 958.62.1.R 959.67.1.R 960.60.1.R 960.64.1.R 961.57.1.R 962.60.3.R 962.64.3.R 962.69.3.R 965.52.2.R 965.56.2.R 965.59.2.R 967.52.2.R 967.57.2.R 967.60.2.R 969.52.2.R 969.56.2.R 969.59.2.R 971.52.2.R 971.57.2.R 971.60.2.R 973.55.2.R 973.59.2.R 973.62.2.R 975.64.1.R 975.65.1.R 976.60.1.R 976.64.1.R 976.67.1.R 977.63.1.R 977.66.1.R 978.59.1.R 979.64.1.R 979.67.1.R 980.66.1.R 980.69.1.R 981.52.1.R 981.67.1.R 981.71.1.R 982.59.1.R 983.64.1.R 984.67.1.R 985.53.1.R 985.65.1.R 985.69.1.R 986.67.1.R 987.65.1.R 988.53.1.R 988.60.1.R 989.60.2.R 989.64.2.R 991.60.1.R 992.72.1.R 993.60.1.R 994.60.1.R 994.64.1.R 995.57.1.R 996.60.1.R 996.64.1.R 997.57.1.R 998.55.1.R 998.59.1.R 999.52.1.R 1000.64.1.R 1001.52.1.R 1002.57.1.R 1002.60.1.R 1003.57.1.R 1004.60.1.R 1005.64.1.R 1006.55.1.R 1006.59.1.R 1007.52.1.R 1008.55.1.R 1009.59.1.R 1010.57.1.R 1011.60.1.R 1012.60.1.R 1012.64.1.R 1013.57.1.R 1013.64.1.R 1014.53.1.R 1015.56.3.R 1015.60.3.R 1019.53.1.R 1019.57.1.R 1020.60.3.R 1023.53.3.R 1023.57.3.R 1023.60.3.R 1027.64.1.R 1027.67.1.R 1028.60.1.R 1029.64.1.R 1030.67.1.R 1031.65.1.R 1031.69.1.R 1032.71.1.R 1033.65.1.R 1033.69.1.R 1034.71.1.R 1035.64.1.R 1035.67.1.R 1036.60.1.R 1037.64.1.R 1038.67.1.R 1039.60.1.R 1039.63.1.R 1039.66.1.R 1039.69.1.R 1040.71.1.R 1041.60.1.R 1041.63.1.R 1041.66.1.R 1041.69.1.R 1042.71.1.R 1043.59.2.R 1043.62.2.R 1043.67.2.R 1045.59.1.R 1046.62.1.R 1047.67.1.R 1048.58.1.R 1048.62.1.R 1048.67.1.R 1049.69.1.R 1050.58.1.R 1050.62.1.R 1050.67.1.R 1051.69.1.R 1052.57.1.R 1052.61.1.R 1052.64.1.R 1053.57.1.R 1054.61.1.R 1055.64.1.R 1056.58.1.R 1056.67.1.R 1057.65.1.R 1058.65.1.R 1059.64.1.R 1060.57.1.R 1060.64.1.R 1061.61.1.R 1062.57.1.R 1063.55.1.R 1064.50.1.R 1064.62.1.R 1065.66.1.R 1066.74.1.R 1067.62.1.R 1068.67.1.R 1068.71.1.R 1069.74.1.R 1070.66.2.R 1070.69.2.R 1072.74.1.R 1073.65.1.R 1073.68.1.R 1074.74.1.R 1075.64.1.R 1075.67.1.R 1076.74.1.R 1077.50.3.R 1077.57.3.R 1077.62.3.R 1077.66.3.R';
const STH_SECTIONS = [
  { name: 'Intro', startBeat: 0, endBeat: 32 },
  { name: 'Verse 1', startBeat: 32, endBeat: 96 },
  { name: 'Verse 2', startBeat: 96, endBeat: 160 },
  { name: 'Interlude', startBeat: 160, endBeat: 256 },
  { name: 'Verse 3', startBeat: 256, endBeat: 352 },
  { name: 'Fanfare', startBeat: 352, endBeat: 424 },
  { name: 'Solo', startBeat: 424, endBeat: 560 },
  { name: 'Finale', startBeat: 560, endBeat: 690 },
];
const BRH_SECTIONS = [
  { name: 'Intro chords', startBeat: 0, endBeat: 40 },
  { name: 'Ballad', startBeat: 40, endBeat: 200 },
  { name: 'Piano solo', startBeat: 200, endBeat: 264 },
  { name: 'Opera', startBeat: 264, endBeat: 384 },
  { name: 'Rock', startBeat: 384, endBeat: 472 },
  { name: 'Outro', startBeat: 472, endBeat: 545 },
];
SONGS.push(
  {
    id: 'stairway-easy', group: 'stairway', level: 'Easy',
    title: 'Stairway to Heaven', composer: 'Led Zeppelin',
    bpm: 72, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Intro', startBeat: 0, endBeat: 16 },
      { name: 'Verse 1', startBeat: 16, endBeat: 56 },
      { name: 'Verse 2', startBeat: 56, endBeat: 96 },
      { name: 'Close', startBeat: 96, endBeat: 109 },
    ],
    notes: fromStream(STH_EASY, 2),
  },
  {
    id: 'stairway', group: 'stairway', level: 'Medium',
    title: 'Stairway to Heaven', composer: 'Led Zeppelin',
    bpm: 76, timeSig: [4, 4], beatUnit: 4,
    sections: STH_SECTIONS,
    notes: fromStream(STH_MED, 2),
  },
  {
    id: 'stairway-hard', group: 'stairway', level: 'Hard',
    title: 'Stairway to Heaven', composer: 'Led Zeppelin',
    bpm: 76, timeSig: [4, 4], beatUnit: 4,
    sections: STH_SECTIONS,
    notes: fromStream(STH_HARD, 2),
  },
  {
    id: 'bohemian-rhapsody-easy', group: 'bohemian-rhapsody', level: 'Easy',
    title: 'Bohemian Rhapsody', composer: 'Queen (arr. in C)',
    bpm: 72, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Opening', startBeat: 0, endBeat: 64 },
      { name: 'Ballad line', startBeat: 64, endBeat: 127 },
    ],
    notes: fromStream(BRH_EASY, 2),
  },
  {
    id: 'bohemian-rhapsody', group: 'bohemian-rhapsody', level: 'Medium',
    title: 'Bohemian Rhapsody', composer: 'Queen (arr. in C)',
    bpm: 72, timeSig: [4, 4], beatUnit: 4,
    sections: BRH_SECTIONS,
    notes: fromStream(BRH_MED, 2),
  },
  {
    id: 'bohemian-rhapsody-hard', group: 'bohemian-rhapsody', level: 'Hard',
    title: 'Bohemian Rhapsody', composer: 'Queen (arr. in C)',
    bpm: 72, timeSig: [4, 4], beatUnit: 4,
    sections: BRH_SECTIONS,
    notes: fromStream(BRH_HARD, 2),
  },
);


// ---- 2026-08-28 wave 6: Hotel California (Eagles) ----
// Sources: PLN 2017 full fingerpicked chart × PLN 2022 Hard Version (two
// independent arrangers, identical opening) × Hooktheory (B minor, 147bpm,
// the canonical Bm-F#-A-E-G-D-Em-F# loop). Authored -2 in A minor
// (loop = Am-E-G-D-F-C-Dm-E). Medium = the 2017 full chart; Hard = the
// denser 2022 chart; Easy = first-half slice thinned to bass + top voice.
const HC_EASY = '0.45.8.L 8.40.8.L 16.43.9.L 25.38.8.L 33.41.8.L 41.36.9.L 50.38.8.L 58.40.8.L 66.45.9.L 75.40.8.L 83.43.8.L 91.38.9.L 91.45.9.L 100.41.8.L 100.45.8.L 108.36.8.L 108.43.8.L 116.38.8.L 116.45.8.L 124.40.7.L 131.40.1.L 132.40.1.L 133.33.1.L 134.33.1.L 135.45.1.L 136.33.1.L 137.33.1.L 138.33.1.L 139.33.1.L 139.45.1.L 140.33.1.L 141.33.1.L 141.40.1.L 142.40.1.L 143.40.1.L 144.40.1.L 145.40.1.L 146.40.1.L 147.40.1.L 148.40.1.L 149.31.1.L 149.40.1.L 150.31.1.L 151.31.1.L 151.43.1.L 152.31.1.L 153.31.1.L 154.31.1.L 155.31.1.L 156.43.1.L 157.31.1.L 158.38.1.L 159.38.2.L 161.38.1.L 162.38.1.L 163.38.1.L 164.38.1.L 164.50.1.L 165.38.1.L 166.38.1.L 167.41.1.L 168.41.1.L 169.41.1.L 170.41.1.L 171.41.1.L 172.41.1.L 173.41.1.L 174.41.1.L 175.36.1.L 176.36.1.L 176.48.1.L 177.36.1.L 178.36.1.L 179.36.1.L 180.36.2.L 182.36.1.L 183.38.1.L 184.38.2.L 186.38.1.L 187.38.1.L 188.38.2.L 190.38.1.L 191.38.1.L 192.40.1.L 193.40.1.L 194.40.1.L 195.40.1.L 196.40.1.L 197.40.1.L 198.40.1.L 199.33.1.L 199.40.1.L 200.33.1.L 201.33.1.L 201.45.1.L 202.33.1.L 203.33.1.L 204.33.1.L 205.33.1.L 205.45.1.L 206.33.1.L 207.33.1.L 208.40.1.L 209.40.2.L 211.40.1.L 212.40.1.L 213.40.2.L 215.40.1.L 216.31.1.L 217.31.1.L 218.31.1.L 218.43.1.L 219.31.1.L 220.31.1.L 221.31.1.L 222.31.1.L 222.43.1.L 223.31.1.L 224.31.1.L 224.38.1.L 225.38.1.L 226.38.1.L 226.50.1.L 227.38.1.L 228.38.1.L 229.38.1.L 230.38.1.L 230.50.1.L 231.38.1.L 232.38.1.L 233.41.1.L 234.41.2.L 236.41.1.L 237.41.1.L 238.41.2.L 240.41.1.L 241.36.1.L 242.36.2.L 244.36.1.L 245.36.1.L 246.36.1.L 247.36.1.L 247.48.1.L 248.36.1.L 249.36.1.L 250.38.1.L 251.38.1.L 251.50.1.L 252.38.1.L 253.38.1.L 254.38.1.L 255.38.1.L 255.50.1.L 256.38.1.L 257.38.1.L 258.40.1.L 259.40.1.L 260.40.1.L 261.40.1.L 262.40.1.L 263.40.2.L 265.28.1.L 265.40.1.L 266.29.1.L 266.41.1.L 267.41.3.L 270.41.1.L 271.41.3.L 274.41.1.L 275.36.1.L 276.43.2.L 278.43.1.L 279.36.1.L 280.43.1.L 281.43.1.L 282.28.1.L 282.36.1.L 283.40.3.L 286.40.1.L 287.40.3.L 290.40.1.L 291.33.1.L 292.33.1.L 292.45.1.L 293.35.1.L 294.35.1.L 294.47.1.L 295.36.1.L 296.36.1.L 296.48.1.L 297.38.1.L 298.40.1.L 299.29.1.L 299.41.1.L 300.41.3.L 303.41.1.L 304.41.3.L 307.41.1.L 308.36.1.L 309.43.2.L 311.43.1.L 312.36.1.L 313.43.1.L 314.43.1.L 315.36.1.L 316.38.1.L 317.38.2.L 317.45.2.L 319.45.1.L 320.38.1.L 321.38.2.L 321.45.2.L 323.38.1.L 323.45.1.L 324.40.1.L 325.40.3.L 328.40.1.L 329.40.3.L 332.33.1.L 332.40.1.L 333.33.1.L 334.33.1.L 334.45.1.L 335.33.1.L 336.33.1.L 337.33.1.L 338.33.1.L 338.45.1.L 339.33.1.L 340.33.1.L 340.40.1.L 341.40.1.L 342.40.2.L 344.40.1.L 345.40.1.L 346.40.2.L 348.40.1.L 349.31.1.L 350.31.1.L 351.43.1.L 352.31.1.L 353.31.1.L 354.31.1.L 355.31.1.L 355.43.1.L 356.31.1.L 357.31.1.L 357.38.1.L 358.38.1.L 359.38.1.L 359.50.1.L 360.38.1.L 361.38.1.L 362.38.1.L 363.38.1.L 363.50.1.L 364.38.1.L 365.38.1.L 366.41.1.L 367.41.1.L 368.41.1.L 369.41.1.L 370.41.1.L 371.41.2.L 373.41.1.L 374.36.1.L 375.36.2.L 377.36.1.L 378.36.1.L 379.36.1.L 380.36.1.L 380.48.1.L 381.36.1.L 382.36.1.L 383.38.1.L 384.38.1.L 384.50.1.L 385.38.1.L 386.38.1.L 387.38.1.L 388.38.1.L 388.50.1.L 389.38.1.L 390.38.1.L 391.40.1.L 392.40.1.L 393.40.1.L 394.40.1.L 395.40.1.L 396.40.2.L 398.40.1.L 399.33.1.L 400.33.1.L 401.45.1.L 402.33.1.L 403.33.1.L 404.33.1.L 405.45.1.L 406.33.1.L 407.33.1.L 407.40.1.L 408.40.1.L 409.40.1.L 410.40.1.L 411.40.1.L 412.40.1.L 413.40.1.L 414.40.1.L 415.31.1.L 415.40.1.L 416.31.1.L 417.31.1.L 417.43.1.L 418.31.1.L 419.31.1.L 420.31.1.L 421.31.1.L 421.43.1.L 422.31.1.L 423.31.1.L 424.38.1.L 425.38.2.L 427.38.1.L 428.38.1.L 429.38.2.L 431.38.1.L 432.41.1.L 433.41.1.L 434.41.1.L 435.41.1.L 436.41.1.L 437.41.1.L 438.41.1.L 439.41.1.L 440.41.1.L 441.36.1.L 442.36.1.L 442.48.1.L 443.36.1.L 444.36.1.L 445.36.1.L 446.36.1.L 446.48.1.L 447.36.1.L 448.36.1.L 449.38.1.L 450.38.2.L 452.38.1.L 453.38.1.L 454.38.2.L 456.38.1.L 457.40.1.L 458.40.2.L 460.40.1.L 461.40.1.L 462.40.1.L 463.40.1.L 464.40.1.L 465.28.1.L 465.40.1.L 466.29.3.L 466.41.3.L 469.41.1.L 470.41.3.L 473.41.1.L 474.36.1.L 475.43.2.L 477.43.1.L 478.36.1.L 479.36.2.L 479.43.2.L 481.36.1.L 481.43.1.L 482.28.1.L 482.40.1.L 483.40.3.L 486.40.1.L 487.40.3.L 490.33.1.L 490.40.1.L 491.45.1.L 492.33.2.L 492.35.2.L 494.35.1.L 495.36.1.L 495.48.1.L 496.36.1.L 497.38.1.L 497.40.1.L 498.29.1.L 498.41.1.L 499.41.3.L 502.41.1.L 503.41.3.L 506.41.1.L 507.36.1.L 508.36.2.L 508.43.2.L 510.43.1.L 511.36.1.L 0.64.1.R 1.57.1.R 2.60.1.R 3.64.1.R 4.69.2.R 6.60.1.R 7.62.1.R 8.68.1.R 9.62.1.R 10.64.1.R 11.71.1.R 12.62.1.R 13.68.3.R 16.67.1.R 17.62.1.R 18.67.1.R 19.69.1.R 20.67.1.R 21.55.1.R 22.67.1.R 23.62.1.R 24.64.1.R 25.54.1.R 26.69.1.R 27.69.1.R 28.64.1.R 29.69.3.R 33.53.1.R 34.69.1.R 35.60.1.R 36.69.1.R 37.69.1.R 38.60.1.R 39.65.1.R 40.72.1.R 41.67.1.R 42.72.1.R 43.64.1.R 44.72.1.R 45.67.1.R 46.64.1.R 47.67.1.R 48.60.1.R 49.64.1.R 50.62.1.R 51.69.1.R 52.69.1.R 53.65.1.R 54.69.1.R 55.69.1.R 56.64.2.R 58.64.1.R 59.64.1.R 60.74.1.R 61.64.1.R 62.71.3.R 66.64.1.R 67.57.1.R 68.60.1.R 69.64.1.R 70.69.3.R 73.60.1.R 74.62.1.R 75.68.1.R 76.64.1.R 77.71.1.R 78.64.1.R 79.68.3.R 83.67.1.R 84.62.1.R 85.67.1.R 86.69.1.R 87.67.1.R 88.62.1.R 89.67.1.R 90.62.1.R 91.64.1.R 92.69.1.R 93.64.1.R 94.69.1.R 95.69.3.R 100.53.1.R 101.69.1.R 102.69.1.R 103.60.1.R 104.69.1.R 105.65.1.R 106.69.1.R 107.72.1.R 108.67.1.R 109.72.1.R 110.64.1.R 111.72.1.R 112.67.1.R 113.67.1.R 114.64.1.R 115.64.1.R 116.60.1.R 117.69.1.R 118.60.1.R 119.69.1.R 120.65.1.R 121.69.1.R 122.64.2.R 124.64.1.R 125.64.1.R 126.62.1.R 127.74.1.R 128.62.1.R 129.71.3.R 134.64.1.R 135.64.1.R 136.62.1.R 137.62.1.R 138.64.3.R 142.64.1.R 143.64.1.R 144.62.1.R 145.62.2.R 147.52.3.R 150.64.1.R 151.64.1.R 152.62.1.R 153.62.1.R 154.62.1.R 155.64.3.R 158.64.1.R 159.64.1.R 160.64.1.R 161.62.1.R 162.62.1.R 163.60.3.R 167.64.1.R 168.64.1.R 169.64.1.R 170.60.1.R 171.64.1.R 172.53.3.R 175.64.1.R 176.64.1.R 177.64.1.R 178.60.1.R 179.60.2.R 181.48.2.R 183.62.1.R 184.62.1.R 185.62.1.R 186.62.1.R 187.62.1.R 188.64.1.R 189.50.3.R 192.64.1.R 193.64.1.R 194.64.1.R 195.64.2.R 197.52.3.R 200.64.1.R 201.64.1.R 202.65.1.R 203.64.1.R 204.65.3.R 209.62.1.R 210.64.1.R 211.62.3.R 214.52.3.R 218.62.1.R 219.62.1.R 220.62.1.R 221.62.1.R 222.64.1.R 223.64.1.R 224.64.1.R 225.64.1.R 226.64.1.R 227.62.1.R 228.62.1.R 229.62.1.R 230.57.3.R 233.64.1.R 234.64.1.R 235.64.1.R 236.60.1.R 237.60.1.R 238.64.1.R 239.53.3.R 242.60.1.R 243.64.1.R 244.62.1.R 245.60.1.R 246.60.3.R 250.62.1.R 251.62.1.R 252.62.1.R 253.62.1.R 254.62.1.R 255.64.3.R 258.62.1.R 259.64.1.R 260.68.2.R 262.62.2.R 264.52.3.R 267.77.1.R 268.77.1.R 269.77.2.R 271.77.1.R 272.79.1.R 273.77.1.R 274.77.1.R 275.76.1.R 276.67.1.R 277.69.1.R 278.71.1.R 279.69.1.R 280.67.1.R 281.64.1.R 282.64.1.R 283.64.1.R 284.62.1.R 285.76.1.R 286.76.1.R 287.74.1.R 288.74.1.R 289.52.1.R 290.62.1.R 291.62.1.R 292.60.3.R 299.77.1.R 300.77.1.R 301.77.1.R 302.77.1.R 303.77.1.R 304.77.1.R 305.79.1.R 306.77.1.R 307.77.1.R 308.76.1.R 309.72.1.R 310.72.1.R 311.55.1.R 312.60.1.R 313.69.1.R 314.64.1.R 315.64.1.R 316.64.1.R 317.62.1.R 318.62.1.R 319.67.1.R 320.67.1.R 321.65.1.R 322.50.1.R 323.65.1.R 324.65.1.R 325.64.1.R 326.64.1.R 327.52.1.R 328.47.2.R 330.47.1.R 331.52.2.R 333.64.1.R 334.64.1.R 335.65.1.R 336.65.1.R 337.64.3.R 341.64.1.R 342.64.1.R 343.64.1.R 344.62.1.R 345.64.2.R 347.52.2.R 349.62.1.R 350.62.1.R 351.62.1.R 352.62.1.R 353.64.1.R 354.64.1.R 355.64.3.R 359.64.1.R 360.62.1.R 361.62.1.R 362.60.3.R 366.62.1.R 367.64.1.R 368.64.1.R 369.60.1.R 370.60.1.R 371.64.1.R 372.53.2.R 374.64.2.R 376.62.1.R 377.60.1.R 378.60.3.R 383.62.1.R 384.62.1.R 385.62.1.R 386.60.1.R 387.64.3.R 391.64.1.R 392.64.1.R 393.62.1.R 394.62.1.R 395.64.2.R 397.52.3.R 400.64.1.R 401.64.1.R 402.64.1.R 403.65.1.R 404.64.3.R 408.64.1.R 409.64.1.R 410.62.1.R 411.64.2.R 413.52.1.R 414.62.1.R 415.62.1.R 416.62.1.R 417.62.1.R 418.62.1.R 419.62.1.R 420.62.1.R 421.64.1.R 422.62.3.R 425.64.1.R 426.64.1.R 427.62.1.R 428.62.1.R 429.60.1.R 430.50.3.R 433.67.1.R 434.67.1.R 435.67.1.R 436.67.1.R 437.65.1.R 438.64.1.R 439.65.1.R 440.67.3.R 443.65.1.R 444.64.3.R 447.60.2.R 449.62.1.R 450.62.1.R 451.62.1.R 452.62.1.R 453.62.1.R 454.62.1.R 455.64.3.R 458.64.1.R 459.64.1.R 460.68.1.R 461.62.2.R 463.64.3.R 466.77.1.R 467.77.1.R 468.77.1.R 469.77.1.R 470.77.1.R 471.79.1.R 472.77.1.R 473.77.1.R 474.76.1.R 475.67.1.R 476.64.1.R 477.60.1.R 478.64.1.R 479.67.1.R 480.72.1.R 481.64.1.R 482.64.1.R 483.62.1.R 484.76.1.R 485.76.2.R 487.74.1.R 488.74.1.R 489.62.1.R 490.62.1.R 491.62.1.R 492.60.1.R 493.47.3.R 498.72.1.R 499.77.1.R 500.77.1.R 501.77.1.R 502.77.1.R 503.77.1.R 504.48.1.R 505.79.1.R 506.77.1.R 507.76.1.R 508.81.1.R 509.84.1.R 510.84.1.R 511.79.1.R';
const HC_MED = '0.45.8.L 8.40.8.L 16.43.9.L 25.38.8.L 33.41.8.L 41.36.9.L 50.38.8.L 58.40.8.L 66.45.9.L 75.40.8.L 83.43.8.L 91.38.9.L 91.45.9.L 100.41.8.L 100.45.8.L 108.36.8.L 108.43.8.L 116.38.8.L 116.45.8.L 124.40.7.L 131.40.1.L 132.40.1.L 133.33.1.L 134.33.1.L 135.45.1.L 136.33.1.L 137.33.1.L 138.33.1.L 139.33.1.L 139.45.1.L 140.33.1.L 141.33.1.L 141.40.1.L 142.40.1.L 143.40.1.L 144.40.1.L 145.40.1.L 146.40.1.L 147.40.1.L 148.40.1.L 149.31.1.L 149.40.1.L 150.31.1.L 151.31.1.L 151.43.1.L 152.31.1.L 153.31.1.L 154.31.1.L 155.31.1.L 156.43.1.L 157.31.1.L 158.38.1.L 159.38.2.L 161.38.1.L 162.38.1.L 163.38.1.L 164.38.1.L 164.50.1.L 165.38.1.L 166.38.1.L 167.41.1.L 168.41.1.L 169.41.1.L 170.41.1.L 171.41.1.L 172.41.1.L 173.41.1.L 174.41.1.L 175.36.1.L 176.36.1.L 176.48.1.L 177.36.1.L 178.36.1.L 179.36.1.L 180.36.2.L 182.36.1.L 183.38.1.L 184.38.2.L 186.38.1.L 187.38.1.L 188.38.2.L 190.38.1.L 191.38.1.L 192.40.1.L 193.40.1.L 194.40.1.L 195.40.1.L 196.40.1.L 197.40.1.L 198.40.1.L 199.33.1.L 199.40.1.L 200.33.1.L 201.33.1.L 201.45.1.L 202.33.1.L 203.33.1.L 204.33.1.L 205.33.1.L 205.45.1.L 206.33.1.L 207.33.1.L 208.40.1.L 209.40.2.L 211.40.1.L 212.40.1.L 213.40.2.L 215.40.1.L 216.31.1.L 217.31.1.L 218.31.1.L 218.43.1.L 219.31.1.L 220.31.1.L 221.31.1.L 222.31.1.L 222.43.1.L 223.31.1.L 224.31.1.L 224.38.1.L 225.38.1.L 226.38.1.L 226.50.1.L 227.38.1.L 228.38.1.L 229.38.1.L 230.38.1.L 230.50.1.L 231.38.1.L 232.38.1.L 233.41.1.L 234.41.2.L 236.41.1.L 237.41.1.L 238.41.2.L 240.41.1.L 241.36.1.L 242.36.2.L 244.36.1.L 245.36.1.L 246.36.1.L 247.36.1.L 247.48.1.L 248.36.1.L 249.36.1.L 250.38.1.L 251.38.1.L 251.50.1.L 252.38.1.L 253.38.1.L 254.38.1.L 255.38.1.L 255.50.1.L 256.38.1.L 257.38.1.L 258.40.1.L 259.40.1.L 260.40.1.L 261.40.1.L 262.40.1.L 263.40.2.L 265.28.1.L 265.40.1.L 266.29.1.L 266.41.1.L 267.41.3.L 270.41.1.L 271.41.3.L 274.41.1.L 275.36.1.L 276.43.2.L 278.43.1.L 279.36.1.L 280.43.1.L 281.43.1.L 282.28.1.L 282.36.1.L 283.40.3.L 286.40.1.L 287.40.3.L 290.40.1.L 291.33.1.L 292.33.1.L 292.45.1.L 293.35.1.L 294.35.1.L 294.47.1.L 295.36.1.L 296.36.1.L 296.48.1.L 297.38.1.L 298.40.1.L 299.29.1.L 299.41.1.L 300.41.3.L 303.41.1.L 304.41.3.L 307.41.1.L 308.36.1.L 309.43.2.L 311.43.1.L 312.36.1.L 313.43.1.L 314.43.1.L 315.36.1.L 316.38.1.L 317.38.2.L 317.45.2.L 319.45.1.L 320.38.1.L 321.38.2.L 321.45.2.L 323.38.1.L 323.45.1.L 324.40.1.L 325.40.3.L 328.40.1.L 329.40.3.L 332.33.1.L 332.40.1.L 333.33.1.L 334.33.1.L 334.45.1.L 335.33.1.L 336.33.1.L 337.33.1.L 338.33.1.L 338.45.1.L 339.33.1.L 340.33.1.L 340.40.1.L 341.40.1.L 342.40.2.L 344.40.1.L 345.40.1.L 346.40.2.L 348.40.1.L 349.31.1.L 350.31.1.L 351.43.1.L 352.31.1.L 353.31.1.L 354.31.1.L 355.31.1.L 355.43.1.L 356.31.1.L 357.31.1.L 357.38.1.L 358.38.1.L 359.38.1.L 359.50.1.L 360.38.1.L 361.38.1.L 362.38.1.L 363.38.1.L 363.50.1.L 364.38.1.L 365.38.1.L 366.41.1.L 367.41.1.L 368.41.1.L 369.41.1.L 370.41.1.L 371.41.2.L 373.41.1.L 374.36.1.L 375.36.2.L 377.36.1.L 378.36.1.L 379.36.1.L 380.36.1.L 380.48.1.L 381.36.1.L 382.36.1.L 383.38.1.L 384.38.1.L 384.50.1.L 385.38.1.L 386.38.1.L 387.38.1.L 388.38.1.L 388.50.1.L 389.38.1.L 390.38.1.L 391.40.1.L 392.40.1.L 393.40.1.L 394.40.1.L 395.40.1.L 396.40.2.L 398.40.1.L 399.33.1.L 400.33.1.L 401.45.1.L 402.33.1.L 403.33.1.L 404.33.1.L 405.45.1.L 406.33.1.L 407.33.1.L 407.40.1.L 408.40.1.L 409.40.1.L 410.40.1.L 411.40.1.L 412.40.1.L 413.40.1.L 414.40.1.L 415.31.1.L 415.40.1.L 416.31.1.L 417.31.1.L 417.43.1.L 418.31.1.L 419.31.1.L 420.31.1.L 421.31.1.L 421.43.1.L 422.31.1.L 423.31.1.L 424.38.1.L 425.38.2.L 427.38.1.L 428.38.1.L 429.38.2.L 431.38.1.L 432.41.1.L 433.41.1.L 434.41.1.L 435.41.1.L 436.41.1.L 437.41.1.L 438.41.1.L 439.41.1.L 440.41.1.L 441.36.1.L 442.36.1.L 442.48.1.L 443.36.1.L 444.36.1.L 445.36.1.L 446.36.1.L 446.48.1.L 447.36.1.L 448.36.1.L 449.38.1.L 450.38.2.L 452.38.1.L 453.38.1.L 454.38.2.L 456.38.1.L 457.40.1.L 458.40.2.L 460.40.1.L 461.40.1.L 462.40.1.L 463.40.1.L 464.40.1.L 465.28.1.L 465.40.1.L 466.29.3.L 466.41.3.L 469.41.1.L 470.41.3.L 473.41.1.L 474.36.1.L 475.43.2.L 477.43.1.L 478.36.1.L 479.36.2.L 479.43.2.L 481.36.1.L 481.43.1.L 482.28.1.L 482.40.1.L 483.40.3.L 486.40.1.L 487.40.3.L 490.33.1.L 490.40.1.L 491.45.1.L 492.33.2.L 492.35.2.L 494.35.1.L 495.36.1.L 495.48.1.L 496.36.1.L 497.38.1.L 497.40.1.L 498.29.1.L 498.41.1.L 499.41.3.L 502.41.1.L 503.41.3.L 506.41.1.L 507.36.1.L 508.36.2.L 508.43.2.L 510.43.1.L 511.36.1.L 512.36.2.L 512.43.2.L 514.43.1.L 515.36.1.L 516.38.1.L 517.45.2.L 519.45.1.L 520.38.1.L 521.45.1.L 522.45.1.L 523.38.1.L 524.40.3.L 527.40.1.L 528.40.3.L 531.40.1.L 532.33.1.L 533.33.1.L 534.45.1.L 535.33.1.L 536.33.1.L 537.33.1.L 538.45.1.L 539.33.1.L 540.40.1.L 541.40.1.L 542.40.1.L 543.40.1.L 544.40.1.L 545.40.1.L 546.40.1.L 547.40.1.L 548.31.1.L 548.40.1.L 549.31.1.L 550.31.1.L 550.43.1.L 551.31.1.L 552.31.1.L 553.31.1.L 554.31.1.L 554.43.1.L 555.31.1.L 556.31.1.L 556.38.1.L 557.38.1.L 558.38.2.L 560.38.1.L 561.38.1.L 562.38.2.L 564.38.1.L 565.41.1.L 566.41.2.L 568.41.1.L 569.41.1.L 570.41.1.L 571.41.1.L 572.41.1.L 573.41.1.L 574.36.1.L 575.36.1.L 575.48.1.L 576.36.1.L 577.36.1.L 578.36.1.L 579.36.1.L 579.48.1.L 580.36.1.L 581.36.1.L 582.38.1.L 583.38.1.L 583.50.1.L 584.38.1.L 585.38.1.L 586.38.1.L 587.38.2.L 589.38.1.L 590.40.1.L 591.40.2.L 593.40.1.L 594.40.1.L 595.40.1.L 596.40.1.L 597.40.1.L 598.33.1.L 598.40.1.L 599.33.1.L 600.40.1.L 601.45.1.L 602.33.1.L 602.40.1.L 603.45.1.L 604.33.1.L 604.45.1.L 605.33.1.L 605.40.1.L 606.40.1.L 607.40.3.L 610.40.2.L 612.40.2.L 614.40.1.L 615.31.1.L 616.31.1.L 616.38.1.L 617.43.1.L 618.38.1.L 618.43.1.L 619.31.1.L 619.43.1.L 620.31.1.L 621.43.1.L 622.31.1.L 622.38.1.L 623.38.1.L 624.38.1.L 625.45.2.L 627.45.1.L 628.38.1.L 628.50.1.L 629.38.1.L 629.50.1.L 630.45.1.L 631.38.1.L 631.40.1.L 632.41.3.L 635.41.2.L 637.41.1.L 638.41.2.L 640.36.1.L 641.36.2.L 641.43.2.L 643.43.1.L 644.36.1.L 644.48.1.L 645.36.1.L 646.43.1.L 647.36.1.L 648.38.1.L 649.38.1.L 650.45.2.L 652.45.1.L 653.38.1.L 653.50.1.L 654.38.1.L 654.50.1.L 655.45.1.L 656.38.1.L 656.40.1.L 657.40.3.L 660.40.2.L 662.40.1.L 663.40.1.L 664.33.1.L 665.33.1.L 666.33.1.L 667.45.1.L 668.33.1.L 669.33.1.L 670.33.1.L 671.45.1.L 672.33.1.L 673.40.1.L 674.40.2.L 676.40.1.L 677.40.1.L 678.40.1.L 679.40.1.L 680.40.1.L 681.31.1.L 681.40.1.L 682.31.1.L 683.31.1.L 683.43.1.L 684.31.1.L 685.31.1.L 686.31.1.L 687.31.1.L 687.43.1.L 688.31.1.L 689.31.1.L 689.38.1.L 690.38.1.L 691.38.1.L 691.50.1.L 692.38.1.L 693.38.1.L 694.38.1.L 695.38.2.L 697.38.1.L 698.41.1.L 699.41.2.L 701.41.1.L 702.41.1.L 703.41.1.L 704.41.1.L 705.41.1.L 706.41.1.L 707.36.1.L 708.36.1.L 708.48.1.L 709.36.1.L 710.36.1.L 711.36.1.L 712.36.1.L 712.48.1.L 713.36.1.L 714.36.1.L 715.38.1.L 716.38.1.L 716.50.1.L 717.38.1.L 718.38.1.L 719.38.1.L 720.38.2.L 722.38.1.L 723.40.1.L 724.40.2.L 726.40.1.L 727.40.1.L 728.40.2.L 730.40.1.L 731.33.1.L 731.40.1.L 732.33.1.L 733.33.1.L 733.45.1.L 734.33.1.L 735.33.1.L 736.33.1.L 737.33.1.L 737.45.1.L 738.33.1.L 739.33.1.L 739.40.1.L 740.40.1.L 741.40.1.L 742.40.1.L 743.40.1.L 744.40.1.L 745.40.1.L 746.40.1.L 747.40.1.L 748.31.1.L 749.31.1.L 750.43.1.L 751.31.1.L 752.31.1.L 753.31.1.L 754.43.1.L 755.31.1.L 756.38.1.L 757.38.1.L 758.38.1.L 758.50.1.L 759.38.1.L 760.38.1.L 761.38.1.L 762.38.1.L 762.50.1.L 763.38.1.L 764.38.1.L 765.41.1.L 766.41.1.L 767.41.1.L 768.41.1.L 769.41.1.L 770.41.1.L 771.41.1.L 772.41.1.L 773.36.1.L 774.36.2.L 776.36.1.L 777.36.1.L 778.36.2.L 780.36.1.L 781.38.1.L 782.38.2.L 784.38.1.L 785.38.1.L 786.38.1.L 787.38.1.L 787.50.1.L 788.38.1.L 789.38.1.L 790.40.1.L 791.40.1.L 792.40.1.L 793.40.1.L 794.40.1.L 795.40.1.L 796.40.1.L 797.33.1.L 797.40.1.L 798.33.1.L 799.33.1.L 799.45.1.L 800.33.1.L 801.33.1.L 802.33.1.L 803.33.1.L 804.45.1.L 805.33.1.L 806.40.1.L 807.40.2.L 809.40.1.L 810.40.1.L 811.40.1.L 812.40.1.L 813.40.1.L 814.31.1.L 814.40.1.L 815.31.1.L 816.31.1.L 816.43.1.L 817.31.1.L 818.31.1.L 819.31.1.L 820.31.1.L 820.43.1.L 821.31.1.L 822.31.1.L 822.38.1.L 823.38.1.L 824.38.1.L 824.50.1.L 825.38.1.L 826.38.1.L 827.38.1.L 828.38.2.L 830.38.1.L 831.41.1.L 832.41.2.L 834.41.1.L 835.41.1.L 836.41.1.L 837.41.1.L 838.41.1.L 839.41.1.L 840.36.1.L 841.36.1.L 841.48.1.L 842.36.1.L 843.36.1.L 844.36.1.L 845.36.1.L 845.48.1.L 846.36.1.L 847.36.1.L 848.38.1.L 849.38.1.L 849.50.1.L 850.38.1.L 851.38.1.L 852.38.1.L 853.38.1.L 853.50.1.L 854.38.1.L 855.38.1.L 856.40.1.L 857.40.2.L 859.40.1.L 860.40.1.L 861.40.2.L 863.40.1.L 864.33.1.L 865.33.1.L 866.33.1.L 866.45.1.L 867.33.1.L 868.33.1.L 869.33.1.L 870.33.1.L 870.45.1.L 871.33.1.L 872.33.1.L 872.40.1.L 873.40.1.L 874.40.1.L 875.40.1.L 876.40.1.L 877.40.1.L 878.40.1.L 879.40.1.L 880.31.1.L 880.40.1.L 881.31.1.L 882.31.1.L 883.43.1.L 884.31.1.L 885.31.1.L 886.31.1.L 887.43.1.L 888.31.1.L 889.38.1.L 890.38.2.L 892.38.1.L 893.38.1.L 894.38.1.L 895.38.1.L 895.50.1.L 896.38.1.L 897.38.1.L 898.41.1.L 899.41.1.L 900.41.1.L 901.41.1.L 902.41.1.L 903.41.1.L 904.41.1.L 905.41.1.L 906.36.1.L 907.36.1.L 907.48.1.L 908.36.1.L 909.36.1.L 910.36.1.L 911.36.2.L 913.36.1.L 914.38.1.L 915.38.2.L 917.38.1.L 918.38.1.L 919.38.1.L 920.38.1.L 920.50.1.L 921.38.1.L 922.38.1.L 923.40.1.L 924.40.1.L 925.40.1.L 926.40.1.L 927.40.1.L 928.40.1.L 929.40.1.L 930.33.1.L 930.40.1.L 931.33.1.L 932.33.1.L 932.45.1.L 933.33.1.L 934.33.1.L 935.33.1.L 936.33.1.L 937.45.1.L 938.33.1.L 939.40.1.L 940.40.2.L 942.40.1.L 943.40.1.L 944.40.2.L 946.40.1.L 947.31.1.L 947.40.1.L 948.31.1.L 949.31.1.L 949.43.1.L 950.31.1.L 951.31.1.L 952.31.1.L 953.31.1.L 953.43.1.L 954.31.1.L 955.31.1.L 955.38.1.L 956.38.1.L 957.38.1.L 957.50.1.L 958.38.1.L 959.38.1.L 960.38.1.L 961.38.1.L 961.50.1.L 962.38.1.L 963.38.1.L 964.41.1.L 965.41.2.L 967.41.1.L 968.41.1.L 969.41.1.L 970.41.1.L 971.41.1.L 972.36.1.L 973.36.1.L 974.36.1.L 974.48.1.L 975.36.1.L 976.36.1.L 977.36.1.L 978.36.1.L 978.48.1.L 979.36.1.L 980.36.1.L 981.38.1.L 982.38.1.L 982.50.1.L 983.38.1.L 984.38.1.L 985.38.1.L 986.38.1.L 986.50.1.L 987.38.1.L 988.38.1.L 989.40.1.L 990.40.2.L 992.40.1.L 993.40.1.L 994.40.2.L 996.40.1.L 997.41.8.L 1005.36.8.L 1013.38.9.L 1022.40.6.L 1028.40.2.L 1030.33.12.L 1030.45.12.L 0.64.1.R 1.57.1.R 2.57.1.R 2.60.1.R 3.64.1.R 4.57.2.R 4.60.2.R 4.69.2.R 6.60.1.R 7.62.1.R 8.68.1.R 9.62.1.R 10.64.1.R 11.62.1.R 11.64.1.R 11.71.1.R 12.62.1.R 13.68.3.R 16.67.1.R 17.62.1.R 18.67.1.R 19.62.1.R 19.69.1.R 20.67.1.R 21.55.1.R 22.62.1.R 22.67.1.R 23.62.1.R 24.64.1.R 25.54.1.R 26.64.1.R 26.69.1.R 27.69.1.R 28.64.1.R 29.57.3.R 29.60.3.R 29.69.3.R 33.53.1.R 34.69.1.R 35.60.1.R 36.65.1.R 36.69.1.R 37.57.1.R 37.60.1.R 37.69.1.R 38.60.1.R 39.65.1.R 40.67.1.R 40.69.1.R 40.72.1.R 41.67.1.R 42.72.1.R 43.64.1.R 44.64.1.R 44.67.1.R 44.72.1.R 45.67.1.R 46.64.1.R 47.64.1.R 47.67.1.R 48.60.1.R 49.60.1.R 49.64.1.R 50.62.1.R 51.60.1.R 51.69.1.R 52.65.1.R 52.69.1.R 53.57.1.R 53.65.1.R 54.69.1.R 55.69.1.R 56.57.2.R 56.64.2.R 58.64.1.R 59.56.1.R 59.64.1.R 60.62.1.R 60.74.1.R 61.64.1.R 62.62.3.R 62.71.3.R 66.48.1.R 66.64.1.R 67.57.1.R 68.57.1.R 68.60.1.R 69.64.1.R 70.50.3.R 70.57.3.R 70.60.3.R 70.69.3.R 73.52.1.R 73.60.1.R 74.62.1.R 75.50.1.R 75.68.1.R 76.62.1.R 76.64.1.R 77.62.1.R 77.71.1.R 78.48.1.R 78.62.1.R 78.64.1.R 79.47.3.R 79.68.3.R 83.47.1.R 83.67.1.R 84.62.1.R 85.67.1.R 86.62.1.R 86.69.1.R 87.48.1.R 87.55.1.R 87.67.1.R 88.62.1.R 89.50.1.R 89.67.1.R 90.62.1.R 91.54.1.R 91.64.1.R 92.69.1.R 93.64.1.R 94.64.1.R 94.69.1.R 95.57.3.R 95.60.3.R 95.69.3.R 100.53.1.R 101.60.1.R 101.69.1.R 102.65.1.R 102.69.1.R 103.57.1.R 103.60.1.R 104.47.1.R 104.69.1.R 105.60.1.R 105.65.1.R 106.48.1.R 106.67.1.R 106.69.1.R 107.72.1.R 108.67.1.R 109.72.1.R 110.64.1.R 111.64.1.R 111.67.1.R 111.72.1.R 112.67.1.R 113.64.1.R 113.67.1.R 114.64.1.R 115.60.1.R 115.64.1.R 116.60.1.R 117.62.1.R 117.69.1.R 118.60.1.R 119.57.1.R 119.65.1.R 119.69.1.R 120.52.1.R 120.65.1.R 121.69.1.R 122.53.2.R 122.57.2.R 122.64.2.R 124.52.1.R 124.64.1.R 125.56.1.R 125.64.1.R 126.62.1.R 127.64.1.R 127.74.1.R 128.62.1.R 129.71.3.R 134.60.1.R 134.64.1.R 135.60.1.R 135.64.1.R 136.59.1.R 136.62.1.R 137.59.1.R 137.62.1.R 138.59.3.R 138.60.3.R 138.62.3.R 138.64.3.R 142.56.1.R 142.64.1.R 143.52.1.R 143.56.1.R 143.64.1.R 144.56.1.R 144.62.1.R 145.56.2.R 145.62.2.R 147.52.3.R 150.59.1.R 150.64.1.R 151.59.1.R 151.64.1.R 152.59.1.R 152.62.1.R 153.59.1.R 153.62.1.R 154.59.1.R 154.62.1.R 155.59.3.R 155.64.3.R 158.54.1.R 158.64.1.R 159.54.1.R 159.64.1.R 160.50.1.R 160.54.1.R 160.62.1.R 160.64.1.R 161.54.1.R 161.62.1.R 162.54.1.R 162.62.1.R 163.57.3.R 163.60.3.R 167.57.1.R 167.64.1.R 168.53.1.R 168.57.1.R 168.64.1.R 169.57.1.R 169.62.1.R 169.64.1.R 170.57.1.R 170.60.1.R 171.57.1.R 171.60.1.R 171.64.1.R 172.53.3.R 175.55.1.R 175.64.1.R 176.55.1.R 176.64.1.R 177.53.1.R 177.55.1.R 177.62.1.R 177.64.1.R 178.52.1.R 178.60.1.R 179.52.2.R 179.60.2.R 181.48.2.R 183.53.1.R 183.62.1.R 184.53.1.R 184.62.1.R 185.50.1.R 185.53.1.R 185.62.1.R 186.53.1.R 186.60.1.R 186.62.1.R 187.53.1.R 187.62.1.R 188.53.1.R 188.60.1.R 188.64.1.R 189.50.3.R 192.56.1.R 192.64.1.R 193.52.1.R 193.56.1.R 193.64.1.R 194.56.1.R 194.62.1.R 194.64.1.R 195.56.2.R 195.64.2.R 197.52.3.R 200.60.1.R 200.64.1.R 201.60.1.R 201.64.1.R 202.62.1.R 202.65.1.R 203.60.1.R 203.64.1.R 204.60.3.R 204.62.3.R 204.64.3.R 204.65.3.R 209.56.1.R 209.62.1.R 210.52.1.R 210.56.1.R 210.62.1.R 210.64.1.R 211.56.3.R 211.62.3.R 214.52.3.R 218.59.1.R 218.62.1.R 219.59.1.R 219.62.1.R 220.59.1.R 220.62.1.R 221.59.1.R 221.62.1.R 222.59.1.R 222.64.1.R 223.59.1.R 223.64.1.R 224.54.1.R 224.59.1.R 224.64.1.R 225.54.1.R 225.64.1.R 226.54.1.R 226.64.1.R 227.54.1.R 227.62.1.R 228.54.1.R 228.62.1.R 229.54.1.R 229.60.1.R 229.62.1.R 230.57.3.R 233.57.1.R 233.64.1.R 234.57.1.R 234.64.1.R 235.53.1.R 235.57.1.R 235.62.1.R 235.64.1.R 236.57.1.R 236.60.1.R 237.57.1.R 237.60.1.R 238.57.1.R 238.64.1.R 239.53.3.R 242.55.1.R 242.60.1.R 243.48.1.R 243.55.1.R 243.64.1.R 244.53.1.R 244.62.1.R 245.60.1.R 246.60.3.R 250.53.1.R 250.62.1.R 251.53.1.R 251.62.1.R 252.53.1.R 252.62.1.R 253.53.1.R 253.60.1.R 253.62.1.R 254.53.1.R 254.60.1.R 254.62.1.R 255.53.3.R 255.64.3.R 258.56.1.R 258.62.1.R 259.52.1.R 259.56.1.R 259.62.1.R 259.64.1.R 260.62.2.R 260.64.2.R 260.68.2.R 262.56.2.R 262.62.2.R 264.52.3.R 267.48.1.R 267.65.1.R 267.69.1.R 267.77.1.R 268.53.1.R 268.65.1.R 268.69.1.R 268.77.1.R 269.48.2.R 269.53.2.R 269.65.2.R 269.69.2.R 269.77.2.R 271.65.1.R 271.69.1.R 271.77.1.R 272.48.1.R 272.67.1.R 272.71.1.R 272.79.1.R 273.48.1.R 273.53.1.R 273.65.1.R 273.69.1.R 273.77.1.R 274.65.1.R 274.69.1.R 274.77.1.R 275.64.1.R 275.67.1.R 275.76.1.R 276.48.1.R 276.67.1.R 277.48.1.R 277.69.1.R 278.67.1.R 278.71.1.R 279.65.1.R 279.67.1.R 279.69.1.R 280.48.1.R 280.64.1.R 280.67.1.R 281.64.1.R 282.56.1.R 282.64.1.R 283.56.1.R 283.62.1.R 283.64.1.R 284.47.1.R 284.56.1.R 284.62.1.R 285.52.1.R 285.68.1.R 285.76.1.R 286.47.1.R 286.68.1.R 286.76.1.R 287.66.1.R 287.74.1.R 288.47.1.R 288.66.1.R 288.74.1.R 289.52.1.R 290.47.1.R 290.62.1.R 291.57.1.R 291.62.1.R 292.57.3.R 292.60.3.R 299.65.1.R 299.69.1.R 299.77.1.R 300.65.1.R 300.69.1.R 300.77.1.R 301.48.1.R 301.65.1.R 301.69.1.R 301.77.1.R 302.53.1.R 302.65.1.R 302.69.1.R 302.77.1.R 303.48.1.R 303.65.1.R 303.69.1.R 303.77.1.R 304.65.1.R 304.69.1.R 304.77.1.R 305.48.1.R 305.67.1.R 305.71.1.R 305.79.1.R 306.48.1.R 306.53.1.R 306.65.1.R 306.69.1.R 306.77.1.R 307.65.1.R 307.69.1.R 307.77.1.R 308.64.1.R 308.67.1.R 308.76.1.R 309.48.1.R 309.69.1.R 309.72.1.R 310.48.1.R 310.67.1.R 310.72.1.R 311.55.1.R 312.60.1.R 313.48.1.R 313.65.1.R 313.69.1.R 314.60.1.R 314.64.1.R 315.64.1.R 316.53.1.R 316.64.1.R 317.62.1.R 318.50.1.R 318.53.1.R 318.62.1.R 319.50.1.R 319.64.1.R 319.67.1.R 320.64.1.R 320.67.1.R 321.62.1.R 321.65.1.R 322.50.1.R 323.65.1.R 324.56.1.R 324.59.1.R 324.65.1.R 325.64.1.R 326.47.1.R 326.56.1.R 326.59.1.R 326.64.1.R 327.52.1.R 328.47.2.R 330.47.1.R 331.47.2.R 331.52.2.R 333.60.1.R 333.64.1.R 334.60.1.R 334.64.1.R 335.60.1.R 335.62.1.R 335.64.1.R 335.65.1.R 336.60.1.R 336.62.1.R 336.64.1.R 336.65.1.R 337.60.3.R 337.64.3.R 341.56.1.R 341.64.1.R 342.56.1.R 342.64.1.R 343.52.1.R 343.56.1.R 343.62.1.R 343.64.1.R 344.56.1.R 344.62.1.R 345.56.2.R 345.64.2.R 347.52.2.R 349.59.1.R 349.62.1.R 350.59.1.R 350.62.1.R 351.59.1.R 351.62.1.R 352.59.1.R 352.62.1.R 353.59.1.R 353.62.1.R 353.64.1.R 354.59.1.R 354.64.1.R 355.59.3.R 355.62.3.R 355.64.3.R 359.54.1.R 359.64.1.R 360.54.1.R 360.62.1.R 361.54.1.R 361.62.1.R 362.57.3.R 362.60.3.R 366.59.1.R 366.62.1.R 367.53.1.R 367.60.1.R 367.64.1.R 368.59.1.R 368.60.1.R 368.62.1.R 368.64.1.R 369.57.1.R 369.60.1.R 370.57.1.R 370.60.1.R 371.60.1.R 371.64.1.R 372.53.2.R 374.55.2.R 374.64.2.R 376.48.1.R 376.54.1.R 376.62.1.R 377.52.1.R 377.60.1.R 378.52.3.R 378.60.3.R 383.53.1.R 383.62.1.R 384.53.1.R 384.62.1.R 385.53.1.R 385.62.1.R 386.53.1.R 386.60.1.R 387.53.3.R 387.62.3.R 387.64.3.R 391.56.1.R 391.64.1.R 392.52.1.R 392.56.1.R 392.64.1.R 393.56.1.R 393.62.1.R 394.56.1.R 394.62.1.R 395.56.2.R 395.64.2.R 397.52.3.R 400.60.1.R 400.64.1.R 401.60.1.R 401.64.1.R 402.60.1.R 402.64.1.R 403.62.1.R 403.65.1.R 404.60.3.R 404.64.3.R 408.56.1.R 408.64.1.R 409.52.1.R 409.56.1.R 409.64.1.R 410.56.1.R 410.62.1.R 411.56.2.R 411.64.2.R 413.52.1.R 414.62.1.R 415.62.1.R 416.59.1.R 416.62.1.R 417.59.1.R 417.62.1.R 418.59.1.R 418.62.1.R 419.59.1.R 419.62.1.R 420.59.1.R 420.62.1.R 421.59.1.R 421.64.1.R 422.59.3.R 422.62.3.R 425.54.1.R 425.64.1.R 426.50.1.R 426.54.1.R 426.62.1.R 426.64.1.R 427.54.1.R 427.62.1.R 428.54.1.R 428.62.1.R 429.57.1.R 429.60.1.R 430.50.3.R 433.64.1.R 433.67.1.R 434.53.1.R 434.64.1.R 434.67.1.R 435.64.1.R 435.67.1.R 436.64.1.R 436.67.1.R 437.62.1.R 437.65.1.R 438.53.1.R 438.60.1.R 438.64.1.R 439.62.1.R 439.65.1.R 440.64.3.R 440.67.3.R 443.62.1.R 443.65.1.R 444.60.3.R 444.64.3.R 447.55.2.R 447.60.2.R 449.53.1.R 449.62.1.R 450.53.1.R 450.62.1.R 451.50.1.R 451.53.1.R 451.62.1.R 452.53.1.R 452.60.1.R 452.62.1.R 453.53.1.R 453.62.1.R 454.53.1.R 454.60.1.R 454.62.1.R 455.50.3.R 455.53.3.R 455.64.3.R 458.56.1.R 458.62.1.R 458.64.1.R 459.52.1.R 459.56.1.R 459.64.1.R 460.62.1.R 460.68.1.R 461.56.2.R 461.62.2.R 463.52.3.R 463.56.3.R 463.64.3.R 466.65.1.R 466.69.1.R 466.77.1.R 467.48.1.R 467.65.1.R 467.69.1.R 467.77.1.R 468.53.1.R 468.65.1.R 468.69.1.R 468.77.1.R 469.48.1.R 469.65.1.R 469.69.1.R 469.77.1.R 470.65.1.R 470.69.1.R 470.77.1.R 471.48.1.R 471.67.1.R 471.71.1.R 471.79.1.R 472.48.1.R 472.53.1.R 472.65.1.R 472.69.1.R 472.77.1.R 473.65.1.R 473.69.1.R 473.77.1.R 474.64.1.R 474.67.1.R 474.76.1.R 475.48.1.R 475.67.1.R 476.48.1.R 476.62.1.R 476.64.1.R 477.60.1.R 478.64.1.R 479.67.1.R 480.48.1.R 480.72.1.R 481.64.1.R 482.56.1.R 482.64.1.R 483.47.1.R 483.56.1.R 483.62.1.R 484.52.1.R 484.68.1.R 484.76.1.R 485.47.2.R 485.52.2.R 485.68.2.R 485.76.2.R 487.66.1.R 487.74.1.R 488.47.1.R 488.66.1.R 488.74.1.R 489.47.1.R 489.52.1.R 489.62.1.R 490.57.1.R 490.62.1.R 491.60.1.R 491.62.1.R 492.57.1.R 492.60.1.R 493.47.3.R 498.65.1.R 498.69.1.R 498.72.1.R 499.65.1.R 499.69.1.R 499.77.1.R 500.48.1.R 500.65.1.R 500.69.1.R 500.77.1.R 501.53.1.R 501.65.1.R 501.69.1.R 501.77.1.R 502.48.1.R 502.65.1.R 502.69.1.R 502.77.1.R 503.65.1.R 503.69.1.R 503.77.1.R 504.48.1.R 505.53.1.R 505.67.1.R 505.71.1.R 505.79.1.R 506.48.1.R 506.65.1.R 506.69.1.R 506.77.1.R 507.64.1.R 507.67.1.R 507.76.1.R 508.81.1.R 509.48.1.R 509.84.1.R 510.48.1.R 510.81.1.R 510.84.1.R 511.79.1.R 512.76.1.R 513.48.1.R 514.64.1.R 515.53.1.R 515.64.1.R 516.62.1.R 516.64.1.R 517.50.1.R 517.53.1.R 517.62.1.R 518.50.1.R 518.62.1.R 518.64.1.R 518.67.1.R 519.64.1.R 519.67.1.R 520.62.1.R 520.64.1.R 520.65.1.R 520.67.1.R 521.50.2.R 521.62.2.R 521.65.2.R 523.56.1.R 523.65.1.R 524.59.1.R 524.64.1.R 525.47.1.R 525.56.1.R 525.59.1.R 525.64.1.R 526.52.1.R 527.47.2.R 529.47.1.R 530.47.3.R 530.52.3.R 533.76.1.R 534.76.1.R 535.76.1.R 536.77.1.R 537.76.3.R 541.76.1.R 542.52.1.R 542.76.1.R 543.74.1.R 544.76.2.R 546.52.1.R 546.71.1.R 547.64.2.R 549.76.1.R 550.74.1.R 551.74.1.R 552.76.1.R 553.74.1.R 554.74.3.R 554.76.3.R 557.74.1.R 558.76.1.R 559.50.1.R 559.76.1.R 560.74.1.R 561.72.1.R 561.74.1.R 562.72.1.R 563.50.2.R 565.65.1.R 566.76.1.R 567.53.1.R 567.76.1.R 568.72.1.R 568.74.1.R 569.72.1.R 570.76.1.R 571.53.3.R 574.64.1.R 574.76.1.R 575.76.1.R 576.74.1.R 577.72.3.R 582.62.1.R 582.74.1.R 583.74.1.R 584.74.1.R 585.72.1.R 586.74.1.R 587.72.1.R 588.50.1.R 588.76.1.R 589.72.1.R 589.74.1.R 590.76.1.R 591.76.1.R 592.52.1.R 592.68.1.R 592.76.1.R 593.66.1.R 593.74.1.R 594.68.2.R 594.76.2.R 596.52.3.R 599.60.1.R 599.64.1.R 600.60.1.R 600.64.1.R 601.62.1.R 601.65.1.R 602.60.1.R 602.64.1.R 603.60.2.R 603.62.2.R 603.64.2.R 603.65.2.R 605.62.1.R 606.60.1.R 607.56.1.R 607.64.1.R 608.47.1.R 608.56.1.R 608.64.1.R 609.52.1.R 609.56.1.R 609.64.1.R 610.47.1.R 610.56.1.R 610.62.1.R 611.52.2.R 611.64.2.R 613.47.3.R 613.52.3.R 616.59.1.R 616.62.1.R 617.59.1.R 617.62.1.R 618.59.1.R 618.62.1.R 619.59.1.R 619.62.1.R 620.59.2.R 620.64.2.R 622.64.1.R 623.54.1.R 623.64.1.R 624.54.1.R 624.64.1.R 625.50.1.R 625.54.1.R 625.64.1.R 626.50.1.R 626.62.1.R 627.54.1.R 627.60.1.R 627.64.1.R 628.57.3.R 628.60.3.R 632.60.1.R 633.48.1.R 633.57.1.R 633.64.1.R 634.53.1.R 634.62.1.R 635.48.1.R 635.57.1.R 635.60.1.R 636.53.1.R 636.57.1.R 636.60.1.R 636.64.1.R 637.53.1.R 638.48.1.R 638.57.1.R 639.55.2.R 641.60.1.R 642.48.1.R 642.57.1.R 643.48.1.R 643.55.1.R 644.60.2.R 646.48.3.R 649.53.1.R 649.62.1.R 650.50.1.R 650.53.1.R 650.62.1.R 651.50.1.R 651.53.1.R 651.62.1.R 652.53.1.R 652.60.1.R 652.62.1.R 653.53.1.R 653.60.1.R 653.62.1.R 654.64.3.R 657.56.1.R 657.62.1.R 658.47.1.R 658.56.1.R 658.64.1.R 659.52.1.R 659.67.1.R 660.47.1.R 660.56.1.R 660.64.1.R 661.52.1.R 661.56.1.R 661.62.1.R 662.52.1.R 662.64.1.R 662.74.1.R 663.47.1.R 663.76.1.R 664.79.3.R 664.81.3.R 664.84.3.R 668.79.1.R 668.81.1.R 669.74.2.R 671.72.1.R 671.74.1.R 672.72.1.R 672.76.1.R 673.68.2.R 675.52.1.R 675.69.1.R 675.72.1.R 676.69.1.R 677.68.2.R 679.52.2.R 681.72.1.R 682.74.1.R 683.69.1.R 683.72.1.R 683.76.1.R 684.68.1.R 685.69.1.R 685.72.1.R 686.74.1.R 687.69.1.R 687.72.1.R 687.76.1.R 688.68.1.R 689.68.1.R 689.69.1.R 690.69.1.R 690.72.1.R 691.69.1.R 692.64.1.R 692.67.1.R 693.66.1.R 693.67.1.R 694.66.2.R 696.50.1.R 696.64.1.R 696.69.1.R 697.74.2.R 699.72.1.R 700.53.1.R 700.72.1.R 700.74.1.R 701.69.2.R 703.69.1.R 703.74.1.R 704.53.1.R 704.67.1.R 705.65.1.R 705.67.1.R 706.55.1.R 706.64.1.R 707.72.1.R 708.64.1.R 709.62.1.R 710.52.1.R 710.60.1.R 711.52.1.R 711.59.1.R 712.60.1.R 713.60.1.R 714.60.1.R 715.60.1.R 715.62.1.R 716.64.1.R 716.65.1.R 717.64.1.R 718.60.1.R 718.62.1.R 719.62.1.R 719.65.1.R 720.65.1.R 721.50.1.R 721.64.1.R 721.65.1.R 722.60.1.R 722.62.1.R 723.64.1.R 724.64.1.R 724.67.1.R 725.52.1.R 725.62.1.R 725.69.1.R 726.60.1.R 726.62.1.R 726.64.1.R 727.64.2.R 729.52.2.R 731.64.1.R 732.64.1.R 733.64.1.R 733.67.1.R 734.64.1.R 734.69.1.R 735.64.1.R 735.69.1.R 736.64.1.R 736.69.1.R 737.64.1.R 737.69.1.R 738.60.1.R 738.62.1.R 738.64.1.R 739.60.1.R 739.62.1.R 740.64.1.R 741.52.3.R 745.52.3.R 748.67.2.R 750.62.1.R 750.64.1.R 751.60.1.R 752.57.1.R 752.60.1.R 753.67.1.R 753.69.1.R 754.69.1.R 755.64.1.R 755.67.1.R 756.67.1.R 757.69.1.R 757.72.1.R 758.67.1.R 759.68.1.R 759.69.1.R 760.66.3.R 760.67.3.R 763.69.2.R 765.69.1.R 766.53.1.R 766.72.1.R 767.74.1.R 768.72.1.R 769.76.1.R 769.77.1.R 770.53.1.R 770.76.1.R 771.72.1.R 771.74.1.R 772.72.1.R 772.74.1.R 773.76.1.R 773.77.1.R 774.78.1.R 774.79.1.R 775.48.1.R 775.76.1.R 775.81.1.R 776.74.1.R 777.72.2.R 779.48.1.R 779.74.1.R 780.72.1.R 780.74.1.R 781.76.1.R 782.79.1.R 783.50.1.R 784.79.1.R 785.74.1.R 785.76.1.R 786.76.1.R 787.76.1.R 788.74.1.R 789.72.1.R 789.76.1.R 790.76.1.R 791.52.1.R 791.79.1.R 792.79.1.R 793.74.1.R 793.76.1.R 794.76.1.R 795.52.1.R 795.72.1.R 795.76.1.R 796.71.1.R 796.74.1.R 797.69.1.R 797.71.1.R 797.72.1.R 797.74.1.R 797.81.1.R 798.72.3.R 802.72.1.R 803.72.1.R 804.60.1.R 804.64.1.R 805.56.1.R 805.57.1.R 805.63.1.R 806.62.2.R 806.68.2.R 808.52.3.R 812.52.2.R 814.76.2.R 816.76.1.R 817.76.1.R 818.76.1.R 819.75.1.R 819.76.1.R 820.74.1.R 820.75.1.R 821.69.1.R 821.74.1.R 822.69.2.R 822.72.2.R 824.67.1.R 825.64.1.R 826.60.1.R 827.62.1.R 827.64.1.R 828.67.1.R 829.50.1.R 829.60.1.R 830.62.1.R 830.64.1.R 831.60.1.R 831.69.1.R 831.72.1.R 832.60.1.R 832.67.1.R 832.71.1.R 833.53.1.R 833.60.1.R 833.65.1.R 833.69.1.R 834.60.1.R 834.64.1.R 834.67.1.R 835.57.1.R 835.62.1.R 835.65.1.R 836.52.1.R 836.55.1.R 837.50.1.R 838.48.1.R 839.50.1.R 839.52.1.R 840.55.1.R 840.57.1.R 841.67.1.R 842.64.1.R 843.62.1.R 844.64.1.R 845.62.1.R 846.60.1.R 846.64.1.R 847.62.3.R 847.65.3.R 850.62.1.R 850.65.1.R 851.64.2.R 851.67.2.R 853.65.3.R 853.69.3.R 856.64.2.R 856.67.2.R 858.52.1.R 859.67.1.R 859.71.1.R 860.69.2.R 860.72.2.R 862.52.2.R 862.71.2.R 862.74.2.R 864.76.1.R 865.69.1.R 865.72.1.R 866.76.1.R 867.69.1.R 867.72.1.R 867.76.1.R 868.69.1.R 868.72.1.R 869.76.1.R 870.69.1.R 870.72.1.R 870.76.1.R 871.69.1.R 871.72.1.R 872.74.1.R 873.68.1.R 873.71.1.R 874.52.1.R 874.74.1.R 875.68.1.R 875.71.1.R 875.74.1.R 876.71.1.R 876.80.1.R 877.76.1.R 878.52.2.R 880.74.1.R 881.67.1.R 881.71.1.R 882.74.1.R 883.67.1.R 883.71.1.R 884.71.1.R 884.74.1.R 885.67.1.R 885.74.1.R 886.67.1.R 886.71.1.R 887.71.1.R 887.74.1.R 888.67.1.R 889.69.1.R 889.72.1.R 890.66.1.R 890.72.1.R 891.50.1.R 891.69.1.R 892.66.1.R 892.72.1.R 893.69.3.R 893.74.3.R 893.78.3.R 897.72.1.R 898.69.1.R 899.53.1.R 899.65.1.R 899.69.1.R 899.72.1.R 900.65.1.R 900.72.1.R 901.69.1.R 902.65.1.R 902.69.1.R 902.72.1.R 903.65.1.R 903.72.1.R 904.69.1.R 905.65.1.R 905.72.1.R 906.67.1.R 907.64.1.R 907.67.1.R 907.72.1.R 908.64.1.R 908.72.1.R 909.67.1.R 910.72.2.R 910.76.2.R 912.48.2.R 914.65.1.R 914.69.1.R 915.62.1.R 915.69.1.R 916.50.1.R 916.62.1.R 916.65.1.R 917.65.1.R 917.69.1.R 918.62.1.R 919.69.1.R 920.62.1.R 920.65.1.R 921.65.1.R 921.69.1.R 922.62.1.R 922.71.1.R 923.68.1.R 924.52.1.R 924.64.1.R 924.68.1.R 924.71.1.R 925.64.1.R 925.71.1.R 926.68.2.R 926.71.2.R 926.76.2.R 928.52.2.R 930.76.1.R 931.69.1.R 931.72.1.R 932.76.1.R 933.69.1.R 933.72.1.R 933.76.1.R 934.69.1.R 934.72.1.R 935.76.1.R 936.69.1.R 936.72.1.R 937.72.1.R 937.76.1.R 938.69.1.R 939.71.1.R 939.74.1.R 940.68.1.R 940.74.1.R 941.52.1.R 941.68.1.R 941.71.1.R 942.71.1.R 942.74.1.R 943.76.2.R 943.80.2.R 945.52.2.R 947.74.1.R 948.67.1.R 948.71.1.R 949.74.1.R 950.67.1.R 950.71.1.R 950.74.1.R 951.67.1.R 951.71.1.R 952.74.1.R 953.67.1.R 953.71.1.R 953.74.1.R 954.67.1.R 954.71.1.R 955.72.1.R 956.69.1.R 957.66.1.R 957.69.1.R 957.72.1.R 958.66.1.R 958.72.1.R 959.69.3.R 959.74.3.R 959.78.3.R 964.69.1.R 964.72.1.R 965.65.1.R 965.72.1.R 966.53.1.R 966.65.1.R 966.69.1.R 967.69.1.R 967.72.1.R 968.65.1.R 968.72.1.R 969.65.1.R 969.69.1.R 970.69.1.R 970.72.1.R 971.65.1.R 972.72.1.R 973.67.1.R 974.64.1.R 974.67.1.R 974.72.1.R 975.64.1.R 975.72.1.R 976.67.3.R 976.72.3.R 976.76.3.R 980.69.1.R 981.65.1.R 982.62.1.R 982.69.1.R 983.62.1.R 983.65.1.R 984.65.1.R 984.69.1.R 985.62.1.R 985.69.1.R 986.62.1.R 986.65.1.R 987.65.1.R 987.69.1.R 988.62.1.R 988.71.1.R 989.68.1.R 990.64.1.R 990.71.1.R 991.52.1.R 991.64.1.R 991.68.1.R 992.68.1.R 992.71.1.R 993.71.2.R 993.76.2.R 995.52.3.R 998.57.2.R 998.65.2.R 1000.57.1.R 1000.65.1.R 1001.57.1.R 1001.65.1.R 1002.57.1.R 1002.65.1.R 1003.59.1.R 1003.67.1.R 1004.57.1.R 1004.65.1.R 1005.57.1.R 1005.65.1.R 1006.55.3.R 1006.64.3.R 1012.64.1.R 1013.53.1.R 1013.64.1.R 1014.62.1.R 1015.53.3.R 1015.60.3.R 1021.65.1.R 1022.56.1.R 1022.65.1.R 1023.56.3.R 1023.64.3.R 1026.52.1.R 1026.56.1.R 1026.64.1.R 1027.47.1.R 1028.62.2.R 1030.57.3.R 1030.60.3.R';
const HC_HARD = '0.45.5.L 5.40.6.L 11.43.5.L 16.38.6.L 16.50.6.L 22.41.6.L 28.36.5.L 28.48.5.L 33.38.6.L 33.50.6.L 39.40.5.L 44.45.6.L 50.40.5.L 55.43.6.L 61.38.5.L 61.45.5.L 66.41.6.L 66.45.6.L 72.36.5.L 72.43.5.L 77.38.6.L 77.50.6.L 83.40.4.L 87.28.1.L 87.40.1.L 88.28.1.L 88.33.1.L 88.40.1.L 89.33.1.L 90.33.1.L 90.45.1.L 91.33.1.L 92.33.1.L 93.33.1.L 93.45.1.L 94.33.1.L 94.40.1.L 95.40.1.L 96.40.1.L 97.40.1.L 98.40.1.L 99.40.1.L 100.31.1.L 100.40.1.L 101.31.1.L 101.43.1.L 102.31.1.L 103.31.1.L 104.31.1.L 104.43.1.L 105.31.1.L 105.38.1.L 106.38.1.L 106.50.1.L 107.38.1.L 108.38.1.L 109.38.1.L 109.50.1.L 110.38.1.L 111.38.1.L 111.41.1.L 112.41.1.L 113.41.1.L 114.41.1.L 115.41.1.L 116.41.1.L 117.36.1.L 118.36.1.L 118.48.1.L 119.36.1.L 120.36.1.L 120.48.1.L 121.36.1.L 122.36.1.L 122.38.1.L 123.38.1.L 123.50.1.L 124.38.1.L 125.38.1.L 126.38.1.L 126.50.1.L 127.38.1.L 128.35.1.L 128.38.1.L 129.35.1.L 129.47.1.L 130.35.1.L 131.35.1.L 131.47.1.L 132.35.1.L 133.33.1.L 133.35.1.L 134.33.1.L 134.45.1.L 135.33.1.L 136.33.1.L 137.33.1.L 137.45.1.L 138.33.1.L 138.40.1.L 139.40.1.L 140.40.1.L 141.40.1.L 142.40.1.L 143.40.1.L 144.31.1.L 144.40.1.L 145.31.1.L 145.43.1.L 146.31.1.L 147.31.1.L 148.31.1.L 148.43.1.L 149.31.1.L 149.38.1.L 150.31.1.L 150.38.1.L 151.38.1.L 151.50.1.L 152.38.1.L 153.38.1.L 154.38.1.L 154.50.1.L 155.38.1.L 156.41.1.L 157.41.1.L 158.41.1.L 159.41.1.L 160.41.1.L 161.36.1.L 161.41.1.L 162.36.1.L 162.48.1.L 163.36.1.L 164.36.1.L 165.36.1.L 165.48.1.L 166.36.1.L 167.38.1.L 167.50.1.L 168.38.1.L 169.38.1.L 170.38.1.L 170.50.1.L 171.38.1.L 172.38.1.L 172.40.1.L 173.40.1.L 174.40.1.L 175.40.1.L 176.28.1.L 176.40.1.L 177.29.1.L 177.41.1.L 178.41.2.L 180.41.1.L 181.41.1.L 182.41.1.L 183.36.1.L 184.43.1.L 185.43.1.L 186.36.1.L 187.43.1.L 188.43.1.L 189.40.2.L 191.40.1.L 192.40.2.L 194.33.1.L 194.45.1.L 195.33.1.L 195.35.1.L 196.35.1.L 196.47.1.L 197.36.1.L 197.48.1.L 198.38.1.L 199.29.1.L 199.40.1.L 199.41.1.L 200.41.2.L 202.41.1.L 203.41.1.L 204.41.1.L 205.36.1.L 206.43.1.L 207.43.1.L 208.36.1.L 209.41.1.L 210.43.1.L 211.38.1.L 212.45.1.L 213.45.1.L 214.38.1.L 214.50.1.L 215.45.1.L 216.40.1.L 217.40.2.L 219.40.2.L 221.33.1.L 221.40.1.L 222.33.1.L 223.33.1.L 223.45.1.L 224.33.1.L 225.33.1.L 226.33.1.L 226.45.1.L 227.33.1.L 227.40.1.L 228.40.1.L 229.40.1.L 230.40.1.L 231.40.1.L 232.31.1.L 232.40.1.L 233.31.1.L 233.40.1.L 234.31.1.L 234.43.1.L 235.31.1.L 236.31.1.L 237.31.1.L 237.43.1.L 238.31.1.L 238.38.1.L 239.38.1.L 239.50.1.L 240.38.1.L 241.38.1.L 242.38.1.L 242.50.1.L 243.38.1.L 244.38.1.L 244.41.1.L 245.41.1.L 246.41.1.L 247.41.1.L 248.41.1.L 249.41.1.L 250.36.1.L 250.48.1.L 251.36.1.L 252.36.1.L 253.36.1.L 253.48.1.L 254.36.1.L 255.36.1.L 255.38.1.L 256.38.1.L 256.50.1.L 257.38.1.L 258.38.1.L 259.38.1.L 259.50.1.L 260.38.1.L 261.40.1.L 262.40.1.L 263.40.1.L 264.40.1.L 265.40.1.L 266.33.1.L 267.33.1.L 267.45.1.L 268.33.1.L 269.33.1.L 270.33.1.L 270.45.1.L 271.33.1.L 271.40.1.L 272.40.1.L 273.40.1.L 274.40.1.L 275.40.1.L 276.40.1.L 277.31.1.L 277.40.1.L 278.31.1.L 278.43.1.L 279.31.1.L 280.31.1.L 281.31.1.L 281.43.1.L 282.31.1.L 282.38.1.L 283.31.1.L 283.38.1.L 284.38.1.L 284.50.1.L 285.38.1.L 286.38.1.L 286.50.1.L 287.38.1.L 288.38.1.L 288.41.1.L 289.41.1.L 290.41.1.L 291.41.1.L 292.41.1.L 293.41.1.L 294.36.1.L 294.41.1.L 295.36.1.L 295.48.1.L 296.36.1.L 297.36.1.L 298.36.1.L 298.48.1.L 299.36.1.L 300.38.1.L 300.50.1.L 301.38.1.L 302.38.1.L 303.38.1.L 303.50.1.L 304.38.1.L 305.38.1.L 305.40.1.L 306.40.1.L 307.40.1.L 308.40.1.L 309.28.1.L 309.40.1.L 310.29.1.L 310.41.1.L 311.41.2.L 313.41.3.L 316.36.1.L 317.43.1.L 318.43.1.L 319.36.1.L 320.43.1.L 321.43.1.L 322.40.2.L 324.40.1.L 325.40.2.L 327.33.1.L 327.45.1.L 328.33.1.L 328.35.1.L 329.35.1.L 329.47.1.L 330.36.1.L 330.48.1.L 331.38.1.L 331.40.1.L 332.29.1.L 332.41.1.L 333.41.2.L 335.41.1.L 336.41.1.L 337.41.1.L 338.36.1.L 339.43.1.L 340.43.1.L 341.36.1.L 342.43.1.L 343.43.1.L 344.38.1.L 345.45.1.L 346.45.1.L 347.38.1.L 347.50.1.L 348.45.1.L 349.40.5.L 354.33.2.L 356.33.1.L 357.40.1.L 358.33.2.L 358.40.2.L 358.45.2.L 360.40.2.L 362.40.2.L 364.40.1.L 365.43.2.L 367.43.3.L 370.43.1.L 371.38.2.L 373.38.1.L 374.45.2.L 376.41.3.L 379.41.2.L 381.41.1.L 382.36.2.L 384.36.1.L 385.43.3.L 388.38.2.L 390.38.1.L 390.50.1.L 391.45.1.L 392.38.1.L 393.40.2.L 395.40.2.L 397.40.1.L 398.40.1.L 399.33.1.L 400.40.1.L 401.33.1.L 401.45.1.L 402.33.1.L 402.40.1.L 402.45.1.L 403.33.1.L 403.45.1.L 404.40.1.L 405.40.2.L 407.40.1.L 408.40.1.L 409.40.1.L 410.43.2.L 412.43.1.L 413.43.2.L 415.38.1.L 415.43.1.L 415.50.1.L 416.38.1.L 417.45.1.L 418.45.1.L 419.38.1.L 419.50.1.L 420.45.1.L 421.38.1.L 421.41.1.L 422.40.1.L 423.41.1.L 424.41.1.L 425.41.1.L 426.36.1.L 426.41.1.L 426.48.1.L 427.36.1.L 428.43.1.L 429.43.1.L 430.36.1.L 430.48.1.L 431.43.1.L 432.36.1.L 432.38.1.L 433.38.1.L 433.50.1.L 434.45.1.L 435.38.1.L 435.50.1.L 436.38.1.L 436.45.1.L 436.50.1.L 437.38.1.L 437.40.1.L 438.40.2.L 440.40.1.L 441.40.1.L 442.40.1.L 443.33.1.L 444.33.1.L 444.45.1.L 445.33.1.L 446.33.1.L 447.33.1.L 447.45.1.L 448.33.1.L 448.40.1.L 449.33.1.L 449.40.1.L 450.40.1.L 451.40.1.L 452.40.1.L 453.40.1.L 454.31.1.L 454.40.1.L 455.31.1.L 455.43.1.L 456.31.1.L 457.31.1.L 458.31.1.L 458.43.1.L 459.31.1.L 460.31.1.L 460.38.1.L 461.38.1.L 461.50.1.L 462.38.1.L 463.38.1.L 464.38.1.L 464.50.1.L 465.38.1.L 466.41.1.L 467.41.1.L 468.41.1.L 469.41.1.L 470.41.1.L 471.36.1.L 471.41.1.L 472.36.1.L 472.48.1.L 473.36.1.L 474.36.1.L 475.36.1.L 475.48.1.L 476.36.1.L 477.38.1.L 478.38.1.L 478.50.1.L 479.38.1.L 480.38.1.L 480.50.1.L 481.38.1.L 482.38.1.L 482.40.1.L 483.40.1.L 484.40.1.L 485.40.1.L 486.40.1.L 487.40.6.L 487.41.6.L 493.36.5.L 498.38.6.L 504.40.4.L 508.40.1.L 509.33.12.L 509.45.12.L 0.52.1.R 0.64.1.R 1.57.1.R 1.60.1.R 2.57.1.R 2.64.1.R 3.60.1.R 3.69.1.R 4.60.1.R 5.52.1.R 5.62.1.R 5.68.1.R 6.62.1.R 7.64.1.R 7.71.1.R 8.62.1.R 9.68.2.R 11.55.1.R 11.67.1.R 12.62.1.R 12.67.1.R 12.74.1.R 13.67.1.R 13.69.1.R 14.55.1.R 14.62.1.R 15.67.1.R 16.54.1.R 16.62.1.R 16.64.1.R 17.69.1.R 18.64.1.R 18.69.1.R 19.57.1.R 19.64.1.R 19.69.1.R 20.60.2.R 22.53.1.R 22.57.1.R 23.69.1.R 24.57.1.R 24.60.1.R 25.60.1.R 25.69.1.R 26.65.1.R 27.60.1.R 27.67.1.R 27.72.1.R 28.67.1.R 28.69.1.R 28.72.1.R 29.64.1.R 29.72.1.R 30.64.1.R 30.67.1.R 31.67.1.R 32.64.1.R 33.60.1.R 34.62.1.R 34.69.1.R 35.57.1.R 35.60.1.R 35.65.1.R 36.69.1.R 37.57.1.R 37.65.1.R 37.69.1.R 38.64.1.R 39.52.1.R 39.56.1.R 39.64.1.R 40.62.1.R 40.64.1.R 40.74.1.R 41.62.1.R 41.71.1.R 42.68.2.R 44.52.1.R 44.64.1.R 45.57.1.R 45.60.1.R 46.57.1.R 46.64.1.R 47.50.1.R 47.57.1.R 47.60.1.R 47.69.1.R 48.52.1.R 48.60.1.R 49.62.1.R 50.50.1.R 50.62.1.R 50.68.1.R 51.64.1.R 51.71.1.R 52.47.1.R 52.48.1.R 52.62.1.R 52.64.1.R 53.62.1.R 54.68.1.R 55.55.1.R 55.59.1.R 55.67.1.R 56.62.1.R 56.74.1.R 57.67.1.R 58.48.1.R 58.55.1.R 58.67.1.R 58.69.1.R 59.50.1.R 59.62.1.R 60.64.1.R 60.67.1.R 61.54.1.R 61.62.1.R 61.69.1.R 62.64.1.R 63.57.1.R 63.60.1.R 63.69.1.R 64.64.2.R 64.69.2.R 66.53.1.R 67.69.1.R 68.60.1.R 69.47.1.R 69.57.1.R 69.69.1.R 70.48.1.R 70.60.1.R 70.65.1.R 71.60.1.R 71.65.1.R 71.72.1.R 72.64.1.R 72.67.1.R 73.64.1.R 73.69.1.R 73.72.1.R 74.64.1.R 74.67.1.R 74.72.1.R 75.67.1.R 76.64.1.R 77.53.1.R 77.60.1.R 77.64.1.R 78.60.1.R 78.69.1.R 79.57.1.R 79.60.1.R 79.62.1.R 80.52.1.R 80.65.1.R 80.69.1.R 81.65.1.R 81.69.1.R 82.53.1.R 82.57.1.R 82.64.1.R 83.52.1.R 83.56.1.R 83.64.1.R 84.56.1.R 84.62.1.R 84.64.1.R 84.74.1.R 85.62.1.R 85.64.1.R 86.68.3.R 86.71.3.R 89.60.1.R 89.64.1.R 90.60.1.R 90.64.1.R 91.59.1.R 91.62.1.R 92.59.1.R 92.60.1.R 92.62.1.R 92.64.1.R 93.59.2.R 93.62.2.R 95.52.1.R 95.56.1.R 95.64.1.R 96.56.1.R 96.62.1.R 97.56.1.R 97.62.1.R 98.52.2.R 100.59.1.R 100.64.1.R 101.59.1.R 101.64.1.R 102.59.1.R 102.62.1.R 103.59.1.R 103.62.1.R 103.64.1.R 104.59.1.R 104.62.1.R 105.54.1.R 105.64.1.R 106.54.1.R 106.64.1.R 107.54.1.R 107.62.1.R 107.64.1.R 108.54.1.R 108.62.1.R 109.57.2.R 109.60.2.R 111.57.1.R 111.64.1.R 112.53.1.R 112.57.1.R 112.64.1.R 113.57.1.R 113.62.1.R 113.64.1.R 114.57.1.R 114.60.1.R 114.64.1.R 115.53.1.R 115.57.1.R 115.60.1.R 116.55.1.R 116.60.1.R 117.55.1.R 117.64.1.R 118.55.1.R 118.64.1.R 119.52.1.R 119.55.1.R 119.60.1.R 119.64.1.R 120.52.2.R 120.53.2.R 120.60.2.R 120.62.2.R 122.53.1.R 122.62.1.R 123.53.1.R 123.62.1.R 124.53.1.R 124.62.1.R 125.53.1.R 125.60.1.R 125.62.1.R 126.53.1.R 126.62.1.R 126.64.1.R 127.53.1.R 127.62.1.R 128.53.1.R 128.56.1.R 128.60.1.R 128.64.1.R 129.53.1.R 129.56.1.R 129.62.1.R 129.64.1.R 130.56.1.R 130.62.1.R 130.64.1.R 131.56.1.R 131.64.1.R 132.56.1.R 132.62.1.R 133.60.1.R 133.64.1.R 134.60.1.R 134.62.1.R 134.64.1.R 134.65.1.R 135.60.1.R 135.64.1.R 136.60.1.R 136.64.1.R 137.62.2.R 137.65.2.R 139.56.1.R 139.64.1.R 140.52.1.R 140.56.1.R 140.64.1.R 141.56.1.R 141.62.1.R 141.64.1.R 142.52.1.R 142.64.1.R 143.62.2.R 145.62.1.R 146.59.1.R 146.62.1.R 147.59.1.R 147.62.1.R 148.59.1.R 148.62.1.R 148.64.1.R 149.54.1.R 149.59.1.R 149.60.1.R 149.64.1.R 150.54.1.R 150.59.1.R 150.64.1.R 151.54.1.R 151.59.1.R 151.64.1.R 152.54.1.R 152.62.1.R 152.64.1.R 153.54.1.R 153.57.1.R 153.62.1.R 154.60.2.R 156.53.1.R 156.57.1.R 156.64.1.R 157.57.1.R 157.60.1.R 157.64.1.R 158.57.1.R 158.60.1.R 158.64.1.R 159.53.2.R 159.57.2.R 159.62.2.R 161.55.1.R 161.60.1.R 162.55.1.R 162.64.1.R 163.53.1.R 163.62.1.R 164.60.1.R 165.60.2.R 167.53.1.R 167.62.1.R 168.53.1.R 168.62.1.R 169.53.1.R 169.60.1.R 169.62.1.R 170.53.1.R 170.62.1.R 170.64.1.R 171.53.1.R 171.62.1.R 172.56.1.R 172.60.1.R 172.62.1.R 173.56.1.R 173.62.1.R 173.64.1.R 174.56.1.R 174.62.1.R 174.64.1.R 174.68.1.R 175.62.1.R 175.64.1.R 176.52.2.R 178.48.1.R 178.65.1.R 178.69.1.R 178.77.1.R 179.53.1.R 179.65.1.R 179.69.1.R 179.77.1.R 180.48.1.R 180.65.1.R 180.69.1.R 180.77.1.R 181.48.1.R 181.65.1.R 181.67.1.R 181.69.1.R 181.71.1.R 181.77.1.R 181.79.1.R 182.48.1.R 182.53.1.R 182.65.1.R 182.69.1.R 182.77.1.R 183.64.1.R 183.65.1.R 183.67.1.R 183.69.1.R 183.76.1.R 183.77.1.R 184.48.1.R 184.67.1.R 185.48.1.R 185.67.1.R 185.69.1.R 185.71.1.R 186.65.1.R 186.67.1.R 186.69.1.R 187.48.1.R 187.64.1.R 187.67.1.R 187.71.1.R 188.56.1.R 188.64.1.R 189.47.1.R 189.56.1.R 189.62.1.R 189.64.1.R 190.52.1.R 190.56.1.R 190.62.1.R 190.68.1.R 190.76.1.R 191.47.1.R 191.68.1.R 191.76.1.R 192.47.1.R 192.66.1.R 192.68.1.R 192.74.1.R 192.76.1.R 193.52.1.R 193.62.1.R 193.66.1.R 193.74.1.R 194.47.1.R 194.57.1.R 194.60.1.R 194.62.1.R 195.57.3.R 195.60.3.R 195.62.3.R 199.65.1.R 199.69.1.R 199.77.1.R 200.48.1.R 200.65.1.R 200.69.1.R 200.77.1.R 201.53.1.R 201.65.1.R 201.69.1.R 201.77.1.R 202.48.1.R 202.65.1.R 202.69.1.R 202.77.1.R 203.48.1.R 203.65.1.R 203.67.1.R 203.69.1.R 203.71.1.R 203.77.1.R 203.79.1.R 204.48.1.R 204.53.1.R 204.65.1.R 204.69.1.R 204.77.1.R 205.64.1.R 205.65.1.R 205.67.1.R 205.69.1.R 205.76.1.R 205.77.1.R 206.48.1.R 206.67.1.R 206.69.1.R 206.72.1.R 207.48.1.R 208.55.1.R 208.60.1.R 209.48.1.R 209.65.1.R 209.69.1.R 210.48.1.R 210.53.1.R 210.60.1.R 210.64.1.R 211.53.1.R 211.64.1.R 212.50.1.R 212.64.1.R 212.67.1.R 213.62.1.R 213.64.1.R 213.67.1.R 214.62.1.R 214.64.1.R 214.65.1.R 214.67.1.R 215.50.1.R 215.62.1.R 215.64.1.R 215.65.1.R 216.56.1.R 216.59.1.R 216.65.1.R 217.47.1.R 217.56.1.R 217.64.1.R 218.52.1.R 218.64.1.R 219.47.1.R 219.59.1.R 220.47.1.R 221.52.1.R 222.60.1.R 222.64.1.R 223.60.1.R 223.64.1.R 224.60.1.R 224.64.1.R 225.60.1.R 225.62.1.R 225.64.1.R 225.65.1.R 226.60.1.R 226.64.1.R 227.56.1.R 227.64.1.R 228.52.1.R 228.56.1.R 228.64.1.R 229.56.1.R 229.62.1.R 229.64.1.R 230.56.1.R 230.64.1.R 231.52.2.R 231.56.2.R 231.62.2.R 233.59.1.R 233.62.1.R 234.59.1.R 234.62.1.R 234.64.1.R 235.59.1.R 235.64.1.R 236.59.1.R 236.62.1.R 237.59.1.R 237.62.1.R 238.59.1.R 238.62.1.R 239.54.1.R 239.59.1.R 239.62.1.R 239.64.1.R 240.54.1.R 240.59.1.R 240.62.1.R 241.54.1.R 241.59.1.R 241.62.1.R 241.64.1.R 242.57.2.R 242.60.2.R 244.60.1.R 244.64.1.R 245.53.1.R 245.60.1.R 245.64.1.R 246.57.1.R 246.59.1.R 246.60.1.R 246.62.1.R 246.64.1.R 247.57.1.R 247.60.1.R 247.64.1.R 248.53.2.R 248.60.2.R 250.55.1.R 250.64.1.R 251.52.1.R 251.53.1.R 251.60.1.R 251.62.1.R 252.52.3.R 252.60.3.R 255.53.1.R 255.62.1.R 256.53.1.R 256.62.1.R 257.53.1.R 257.62.1.R 258.53.1.R 258.60.1.R 258.62.1.R 259.53.2.R 259.64.2.R 261.56.1.R 261.64.1.R 262.52.1.R 262.56.1.R 262.62.1.R 262.64.1.R 263.52.1.R 263.56.1.R 263.62.1.R 264.52.2.R 264.56.2.R 264.64.2.R 266.60.1.R 266.64.1.R 267.60.1.R 267.64.1.R 268.60.1.R 268.64.1.R 269.60.1.R 269.64.1.R 270.62.2.R 270.65.2.R 272.56.1.R 272.64.1.R 273.52.1.R 273.56.1.R 273.64.1.R 274.56.1.R 274.62.1.R 275.52.1.R 275.56.1.R 275.64.1.R 276.62.1.R 277.59.1.R 277.62.1.R 278.59.1.R 278.62.1.R 279.59.1.R 279.62.1.R 280.59.1.R 280.62.1.R 281.59.1.R 281.62.1.R 281.64.1.R 282.54.1.R 282.59.1.R 282.62.1.R 282.64.1.R 283.54.1.R 283.64.1.R 284.54.1.R 284.64.1.R 285.54.1.R 285.62.1.R 286.54.1.R 286.57.1.R 286.62.1.R 287.60.2.R 289.53.1.R 289.64.1.R 289.67.1.R 290.64.1.R 290.67.1.R 291.64.1.R 291.67.1.R 292.53.1.R 292.62.1.R 292.65.1.R 293.60.1.R 293.64.1.R 293.67.1.R 294.60.1.R 294.64.1.R 295.62.1.R 295.65.1.R 296.60.1.R 296.64.1.R 297.60.1.R 297.64.1.R 298.55.2.R 298.60.2.R 300.53.1.R 300.62.1.R 301.53.1.R 301.62.1.R 302.53.1.R 302.60.1.R 302.62.1.R 303.53.1.R 303.62.1.R 304.53.1.R 304.62.1.R 305.53.1.R 305.56.1.R 305.60.1.R 305.64.1.R 306.52.1.R 306.53.1.R 306.56.1.R 306.62.1.R 306.64.1.R 307.53.2.R 307.56.2.R 307.62.2.R 307.64.2.R 307.68.2.R 309.56.2.R 309.64.2.R 311.48.1.R 311.65.1.R 311.69.1.R 311.77.1.R 312.53.1.R 312.65.1.R 312.69.1.R 312.77.1.R 313.48.1.R 313.65.1.R 313.69.1.R 313.77.1.R 314.48.1.R 314.65.1.R 314.69.1.R 314.77.1.R 315.48.1.R 315.53.1.R 315.77.1.R 316.65.1.R 316.69.1.R 316.77.1.R 317.48.1.R 317.64.1.R 317.67.1.R 317.76.1.R 318.48.1.R 318.64.1.R 319.62.1.R 319.67.1.R 320.48.1.R 320.60.1.R 320.64.1.R 320.72.1.R 321.56.1.R 321.64.1.R 322.47.1.R 322.56.1.R 322.62.1.R 322.64.1.R 323.52.1.R 323.56.1.R 323.62.1.R 323.68.1.R 323.76.1.R 324.47.1.R 324.68.1.R 324.76.1.R 325.47.1.R 325.66.1.R 325.74.1.R 326.52.1.R 326.62.1.R 326.66.1.R 326.74.1.R 327.47.1.R 327.57.1.R 327.60.1.R 327.62.1.R 328.57.3.R 328.60.3.R 328.62.3.R 332.65.1.R 332.69.1.R 332.72.1.R 333.48.1.R 333.65.1.R 333.69.1.R 333.77.1.R 334.53.1.R 334.65.1.R 334.69.1.R 334.77.1.R 335.48.1.R 335.65.1.R 335.69.1.R 335.77.1.R 336.48.1.R 336.65.1.R 336.67.1.R 336.69.1.R 336.71.1.R 336.77.1.R 336.79.1.R 337.48.1.R 337.53.1.R 337.65.1.R 337.69.1.R 337.77.1.R 338.65.1.R 338.69.1.R 338.77.1.R 339.48.1.R 339.65.1.R 339.69.1.R 339.77.1.R 339.81.1.R 340.48.1.R 340.64.1.R 340.67.1.R 340.76.1.R 340.81.1.R 340.84.1.R 341.79.1.R 341.84.1.R 342.48.1.R 342.76.1.R 343.48.1.R 343.64.1.R 344.64.1.R 345.50.1.R 345.62.1.R 345.64.1.R 345.65.1.R 346.62.1.R 346.64.1.R 346.67.1.R 347.62.1.R 347.64.1.R 347.65.1.R 347.67.1.R 348.62.1.R 348.64.1.R 348.65.1.R 349.56.1.R 349.65.1.R 350.56.1.R 350.59.1.R 350.64.1.R 351.64.1.R 352.64.1.R 353.59.2.R 355.76.1.R 356.76.1.R 356.77.1.R 357.76.1.R 358.76.2.R 358.77.2.R 360.76.1.R 361.76.1.R 362.47.1.R 362.74.1.R 362.76.1.R 363.52.1.R 363.74.1.R 363.76.1.R 364.47.1.R 364.64.1.R 365.64.1.R 366.76.1.R 367.74.1.R 368.50.1.R 368.74.1.R 368.76.1.R 369.50.1.R 369.55.1.R 369.74.1.R 370.74.2.R 370.76.2.R 372.74.1.R 373.72.1.R 373.76.1.R 374.50.1.R 374.72.1.R 374.76.1.R 375.74.2.R 377.65.1.R 377.76.1.R 378.74.1.R 378.76.1.R 379.48.1.R 379.74.1.R 380.48.1.R 380.53.1.R 380.72.1.R 380.74.1.R 381.72.1.R 381.76.1.R 382.76.1.R 383.76.1.R 384.72.1.R 384.74.1.R 385.48.3.R 385.72.3.R 385.74.3.R 388.74.1.R 389.74.1.R 390.72.1.R 390.74.1.R 391.76.1.R 392.72.1.R 392.74.1.R 393.72.1.R 394.76.1.R 395.47.1.R 395.66.1.R 395.68.1.R 395.74.1.R 395.76.1.R 396.52.1.R 396.68.1.R 396.76.1.R 397.52.1.R 398.47.1.R 399.60.1.R 399.64.1.R 400.60.1.R 400.62.1.R 400.64.1.R 400.65.1.R 401.60.1.R 401.64.1.R 402.60.1.R 402.62.1.R 402.64.1.R 402.65.1.R 403.62.1.R 404.60.1.R 405.47.1.R 405.56.1.R 405.64.1.R 406.52.1.R 406.56.1.R 406.64.1.R 407.47.1.R 407.52.1.R 407.56.1.R 407.62.1.R 408.52.1.R 408.64.1.R 409.47.2.R 411.50.1.R 411.59.1.R 411.62.1.R 412.55.1.R 412.59.1.R 412.62.1.R 413.50.1.R 413.55.1.R 413.59.1.R 413.62.1.R 413.64.1.R 414.55.1.R 414.59.1.R 414.62.1.R 415.54.1.R 415.59.1.R 415.62.1.R 415.64.1.R 416.54.1.R 416.59.1.R 416.62.1.R 416.64.1.R 417.50.1.R 417.54.1.R 417.59.1.R 417.62.1.R 417.64.1.R 418.50.1.R 418.54.1.R 418.60.1.R 418.62.1.R 419.57.1.R 419.60.1.R 420.62.1.R 421.60.1.R 422.48.1.R 422.57.1.R 422.64.1.R 423.53.1.R 423.62.1.R 424.48.1.R 424.53.1.R 424.57.1.R 424.60.1.R 424.62.1.R 425.53.1.R 425.60.1.R 425.64.1.R 426.60.1.R 427.60.1.R 427.64.1.R 428.48.1.R 428.62.1.R 428.64.1.R 429.48.1.R 429.62.1.R 430.60.3.R 433.53.1.R 433.62.1.R 434.50.1.R 434.53.1.R 434.62.1.R 435.53.1.R 435.62.1.R 436.53.1.R 436.60.1.R 436.62.1.R 437.53.1.R 437.56.1.R 437.60.1.R 437.62.1.R 437.64.1.R 438.47.1.R 438.56.1.R 438.60.1.R 438.64.1.R 439.52.1.R 439.64.1.R 440.47.1.R 440.52.1.R 440.56.1.R 440.62.1.R 441.64.1.R 442.52.1.R 442.62.1.R 443.64.1.R 443.71.1.R 444.68.1.R 444.69.1.R 444.76.1.R 445.69.1.R 445.72.1.R 445.76.1.R 446.69.1.R 446.72.1.R 446.76.1.R 447.69.1.R 447.72.1.R 447.76.1.R 448.69.1.R 448.72.1.R 448.74.1.R 449.68.1.R 449.71.1.R 449.74.1.R 450.52.1.R 450.68.1.R 450.71.1.R 451.74.1.R 451.80.1.R 452.71.1.R 453.52.1.R 453.76.1.R 454.74.1.R 455.67.1.R 455.71.1.R 455.74.1.R 456.67.1.R 456.71.1.R 456.74.1.R 457.67.1.R 457.71.1.R 457.74.1.R 458.67.1.R 458.71.1.R 458.74.1.R 459.67.1.R 459.71.1.R 460.69.1.R 460.74.1.R 461.66.1.R 461.69.1.R 461.74.1.R 462.66.3.R 462.69.3.R 462.74.3.R 462.78.3.R 465.69.1.R 465.72.1.R 466.53.1.R 466.65.1.R 466.69.1.R 466.72.1.R 467.65.1.R 467.69.1.R 467.72.1.R 468.65.1.R 468.72.1.R 469.53.1.R 469.69.1.R 469.72.1.R 470.65.1.R 470.69.1.R 471.65.1.R 471.67.1.R 471.72.1.R 472.64.1.R 472.67.1.R 472.72.1.R 473.64.3.R 473.67.3.R 473.72.3.R 473.76.3.R 476.69.1.R 477.62.1.R 477.65.1.R 478.69.1.R 479.65.1.R 480.62.1.R 481.69.1.R 482.65.1.R 482.68.1.R 482.71.1.R 483.52.1.R 483.62.1.R 483.64.1.R 483.68.1.R 483.71.1.R 484.64.1.R 484.68.1.R 484.69.1.R 484.71.1.R 484.76.1.R 485.65.1.R 486.52.1.R 486.62.1.R 487.69.1.R 488.57.1.R 488.65.1.R 489.57.1.R 489.62.1.R 489.65.1.R 490.57.1.R 490.65.1.R 491.57.1.R 491.59.1.R 491.65.1.R 491.67.1.R 492.57.1.R 492.65.1.R 493.55.3.R 493.57.3.R 493.64.3.R 493.65.3.R 498.53.1.R 498.64.1.R 499.53.1.R 499.62.1.R 500.62.2.R 502.65.2.R 504.56.1.R 504.65.1.R 505.56.1.R 505.64.1.R 506.64.1.R 507.47.1.R 507.52.1.R 507.56.1.R 507.64.1.R 508.62.1.R 509.57.3.R 509.60.3.R';
const HC_SECTIONS_MED = [
  { name: 'Intro', startBeat: 0, endBeat: 64 },
  { name: 'Verse 1', startBeat: 64, endBeat: 160 },
  { name: 'Chorus', startBeat: 160, endBeat: 224 },
  { name: 'Verse 2', startBeat: 224, endBeat: 320 },
  { name: 'Chorus 2', startBeat: 320, endBeat: 384 },
  { name: 'Solo', startBeat: 384, endBeat: 480 },
  { name: 'Outro', startBeat: 480, endBeat: 522 },
];
const HC_SECTIONS_HARD = [
  { name: 'Intro', startBeat: 0, endBeat: 64 },
  { name: 'Verse', startBeat: 64, endBeat: 128 },
  { name: 'Chorus', startBeat: 128, endBeat: 192 },
  { name: 'Outro', startBeat: 192, endBeat: 261 },
];
SONGS.push(
  {
    id: 'hotel-california-easy', group: 'hotel-california', level: 'Easy',
    title: 'Hotel California', composer: 'Eagles (arr. in A minor)',
    bpm: 147, timeSig: [4, 4], beatUnit: 4,
    sections: [
      { name: 'Intro', startBeat: 0, endBeat: 64 },
      { name: 'Verse', startBeat: 64, endBeat: 160 },
      { name: 'Chorus', startBeat: 160, endBeat: 256 },
    ],
    notes: fromStream(HC_EASY, 2),
  },
  {
    id: 'hotel-california', group: 'hotel-california', level: 'Medium',
    title: 'Hotel California', composer: 'Eagles (arr. in A minor)',
    bpm: 147, timeSig: [4, 4], beatUnit: 4,
    sections: HC_SECTIONS_MED,
    notes: fromStream(HC_MED, 2),
  },
  {
    id: 'hotel-california-hard', group: 'hotel-california', level: 'Hard',
    title: 'Hotel California', composer: 'Eagles (arr. in A minor)',
    bpm: 147, timeSig: [4, 4], beatUnit: 4,
    sections: HC_SECTIONS_HARD,
    notes: fromStream(HC_HARD, 2),
  },
);


// ---- 2026-08-28 wave 7: Für Elise, the full piece ----
// Sources (four): PLN 2021 Hard Version (the full rondo at the original
// register) × PLN 2015 chart (independent arranger, same themes -12) × the
// app's own hand-fingered opening excerpt (theme sequence identical, now the
// Easy tier) × bitmidi 27978 score MIDI: Mark's own source suggestion, 
// agreeing at 98.6% pitch-class overlap with the 2021 chart. A minor as
// written. Hands on the Hard chart split at the score's register seam
// (LH figures live at/below A3); grid unit = 16th (div 2 against the
// eighth-note beat of 3/8).
const FE_MED = '5.33.1.L 6.40.1.L 7.45.3.L 10.28.1.L 10.40.1.L 11.44.3.L 14.33.1.L 14.40.1.L 15.45.7.L 22.33.1.L 23.40.1.L 24.45.2.L 26.28.1.L 27.40.1.L 28.44.3.L 31.33.1.L 31.40.1.L 32.45.4.L 36.36.1.L 37.43.3.L 40.31.1.L 41.43.3.L 41.47.3.L 44.33.1.L 45.40.1.L 46.45.3.L 49.28.1.L 50.40.12.L 50.52.12.L 67.33.1.L 68.40.1.L 69.45.2.L 71.28.1.L 72.40.1.L 73.44.3.L 76.33.1.L 76.40.1.L 77.45.7.L 84.33.1.L 85.40.1.L 86.45.2.L 88.28.1.L 89.40.1.L 90.44.3.L 93.33.1.L 93.40.1.L 94.45.2.L 96.46.1.L 97.45.1.L 98.43.2.L 98.46.2.L 100.41.1.L 101.45.1.L 102.45.1.L 103.45.1.L 104.41.1.L 105.46.1.L 106.46.2.L 108.46.1.L 109.41.1.L 110.29.2.L 110.43.2.L 110.46.2.L 112.29.1.L 112.43.1.L 112.46.1.L 113.41.1.L 114.45.1.L 115.45.2.L 117.45.1.L 118.41.1.L 119.45.1.L 120.45.1.L 121.45.1.L 122.40.1.L 123.45.1.L 124.45.1.L 125.38.1.L 125.41.1.L 125.50.1.L 126.43.2.L 128.43.1.L 129.43.12.L 148.44.12.L 148.47.12.L 167.33.1.L 168.40.3.L 168.45.3.L 171.28.1.L 172.40.1.L 173.44.2.L 175.33.1.L 176.40.1.L 177.45.7.L 184.33.1.L 185.40.3.L 185.45.3.L 188.28.1.L 189.40.1.L 190.44.2.L 192.33.1.L 193.40.1.L 194.45.12.L 0.64.1.R 1.63.1.R 1.64.1.R 2.63.1.R 3.59.1.R 3.64.1.R 4.62.1.R 5.57.2.R 5.60.2.R 7.48.1.R 8.52.1.R 9.57.1.R 10.59.2.R 12.52.1.R 12.56.1.R 13.59.1.R 14.60.2.R 16.52.1.R 17.63.1.R 17.64.1.R 18.64.1.R 19.63.1.R 20.59.1.R 20.64.1.R 21.62.1.R 22.57.2.R 22.60.2.R 24.48.1.R 25.52.1.R 26.57.3.R 26.59.3.R 29.52.1.R 29.60.1.R 30.59.1.R 31.57.3.R 34.59.1.R 34.60.1.R 35.62.1.R 36.64.1.R 37.48.1.R 38.55.1.R 39.64.1.R 39.65.1.R 40.62.2.R 42.53.1.R 43.62.1.R 43.64.1.R 44.60.2.R 46.52.1.R 47.62.1.R 48.59.3.R 48.60.3.R 51.52.1.R 52.52.1.R 52.64.1.R 53.64.1.R 54.64.1.R 55.76.1.R 56.64.1.R 57.63.1.R 58.63.1.R 58.64.1.R 59.64.1.R 60.63.1.R 60.64.1.R 61.63.1.R 62.63.1.R 62.64.1.R 63.64.1.R 64.63.1.R 65.59.1.R 65.64.1.R 66.62.1.R 67.57.2.R 67.60.2.R 69.48.1.R 70.52.1.R 71.57.3.R 71.59.3.R 74.52.1.R 74.56.1.R 75.59.1.R 76.60.2.R 78.52.1.R 79.63.1.R 79.64.1.R 80.64.1.R 81.63.1.R 82.59.1.R 82.64.1.R 83.62.1.R 84.57.2.R 84.60.2.R 86.48.1.R 87.52.1.R 88.57.3.R 88.59.3.R 91.52.1.R 91.60.1.R 92.59.1.R 93.57.3.R 96.48.1.R 96.52.1.R 96.60.1.R 97.48.1.R 97.53.1.R 97.60.1.R 98.48.1.R 98.52.1.R 98.55.1.R 98.60.1.R 99.53.1.R 100.57.1.R 100.60.1.R 101.48.2.R 103.48.1.R 103.65.1.R 104.64.1.R 105.64.1.R 106.50.1.R 106.62.1.R 107.50.2.R 107.70.2.R 109.69.1.R 110.52.1.R 110.65.1.R 110.67.1.R 110.69.1.R 111.52.1.R 111.64.1.R 112.52.1.R 112.60.1.R 112.62.1.R 113.58.2.R 115.48.1.R 115.57.1.R 116.48.1.R 116.58.1.R 117.57.1.R 118.55.1.R 118.58.1.R 118.60.1.R 119.48.2.R 121.48.1.R 121.62.1.R 121.63.1.R 122.64.1.R 123.48.1.R 124.64.1.R 125.57.1.R 125.65.1.R 126.60.1.R 127.52.1.R 128.52.1.R 128.59.1.R 128.62.1.R 129.60.1.R 130.53.1.R 130.62.1.R 131.48.1.R 131.52.1.R 131.59.1.R 131.60.1.R 132.55.1.R 132.57.1.R 132.67.1.R 133.53.1.R 133.55.1.R 133.59.1.R 133.67.1.R 134.48.1.R 134.50.1.R 134.52.1.R 134.53.1.R 134.55.1.R 134.67.1.R 135.48.1.R 135.52.1.R 135.55.1.R 135.67.1.R 136.64.1.R 136.71.1.R 136.72.1.R 137.53.1.R 137.57.1.R 137.67.1.R 137.69.1.R 138.55.1.R 138.59.1.R 138.67.1.R 139.48.1.R 139.52.1.R 139.65.1.R 140.55.1.R 140.64.1.R 140.67.1.R 141.53.1.R 141.55.1.R 141.57.1.R 141.59.1.R 141.62.1.R 141.67.1.R 142.48.1.R 142.52.1.R 142.55.1.R 142.67.1.R 143.48.1.R 143.50.1.R 143.52.1.R 143.53.1.R 143.55.1.R 143.65.1.R 143.67.1.R 144.62.1.R 144.64.1.R 144.67.1.R 144.72.1.R 145.53.1.R 145.57.1.R 145.60.1.R 145.71.1.R 146.55.1.R 146.59.1.R 146.67.1.R 146.69.1.R 147.67.1.R 148.64.1.R 148.65.1.R 149.64.1.R 149.65.1.R 150.59.1.R 150.62.1.R 150.64.1.R 151.59.1.R 151.63.1.R 151.64.1.R 151.67.1.R 152.63.1.R 152.64.1.R 152.65.1.R 153.62.2.R 153.64.2.R 155.59.1.R 155.64.1.R 156.63.1.R 157.64.2.R 159.59.1.R 160.64.1.R 161.63.1.R 161.64.1.R 162.63.1.R 163.64.1.R 164.63.1.R 164.64.1.R 165.59.1.R 166.60.1.R 166.62.1.R 167.57.2.R 169.48.1.R 170.52.1.R 170.57.1.R 171.59.2.R 173.52.1.R 174.56.1.R 175.59.2.R 175.60.2.R 177.52.1.R 178.64.1.R 179.63.1.R 180.64.1.R 181.63.1.R 181.64.1.R 182.59.1.R 183.60.1.R 183.62.1.R 184.57.2.R 186.48.1.R 187.52.1.R 187.57.1.R 188.59.2.R 190.52.1.R 191.60.1.R 192.57.3.R 192.59.3.R';
const FE_HARD = '8.45.6.L 9.52.1.L 10.57.1.L 14.40.7.L 15.52.1.L 16.56.1.L 21.45.12.L 22.52.1.L 23.57.1.L 33.45.6.L 34.52.1.L 35.57.1.L 39.40.7.L 40.52.1.L 41.56.1.L 46.45.12.L 47.52.1.L 48.57.2.L 58.45.6.L 59.52.1.L 60.57.1.L 64.40.6.L 65.52.1.L 66.56.1.L 70.45.12.L 71.52.2.L 73.57.1.L 83.45.6.L 84.52.1.L 85.57.1.L 89.40.6.L 90.52.1.L 91.56.1.L 95.45.12.L 96.52.1.L 97.57.1.L 102.48.1.L 103.55.1.L 108.43.6.L 109.55.1.L 114.45.6.L 115.52.1.L 116.57.1.L 120.40.12.L 121.52.1.L 145.45.6.L 146.52.1.L 147.57.1.L 151.40.7.L 152.52.2.L 154.56.1.L 158.45.12.L 159.52.1.L 160.57.1.L 170.45.6.L 171.52.1.L 172.57.1.L 176.40.7.L 177.52.1.L 178.56.1.L 183.45.12.L 184.52.1.L 185.57.1.L 189.48.1.L 190.55.1.L 195.43.6.L 196.55.1.L 201.45.7.L 202.52.1.L 203.57.1.L 208.40.12.L 209.52.1.L 232.45.7.L 233.52.2.L 235.57.1.L 239.40.6.L 240.52.1.L 241.56.1.L 245.45.12.L 246.52.1.L 247.57.1.L 257.45.7.L 258.52.1.L 259.57.1.L 264.40.6.L 265.52.1.L 266.56.1.L 270.45.12.L 271.52.1.L 272.57.1.L 274.57.1.L 275.55.1.L 276.53.1.L 277.57.1.L 279.57.1.L 281.57.1.L 282.53.1.L 289.53.1.L 291.53.1.L 291.55.1.L 293.53.1.L 293.55.1.L 295.53.1.L 296.57.1.L 298.57.1.L 300.57.1.L 301.53.1.L 302.57.1.L 304.57.1.L 306.57.1.L 307.52.1.L 308.57.1.L 310.57.1.L 311.50.1.L 312.53.1.L 313.55.1.L 316.55.1.L 318.55.1.L 328.53.1.L 328.57.1.L 330.55.1.L 340.53.1.L 340.57.1.L 343.55.1.L 345.56.1.L 376.45.6.L 377.52.1.L 378.57.1.L 382.40.6.L 383.52.1.L 384.56.1.L 388.45.12.L 389.52.1.L 390.57.1.L 401.45.6.L 402.52.1.L 403.57.1.L 407.40.6.L 408.52.1.L 409.56.1.L 413.45.12.L 414.52.1.L 415.57.1.L 419.48.1.L 420.55.1.L 426.43.6.L 427.55.1.L 432.45.6.L 433.52.1.L 434.57.1.L 438.40.12.L 439.52.1.L 463.45.6.L 464.52.1.L 465.57.1.L 469.40.6.L 470.52.1.L 471.56.1.L 475.45.12.L 476.52.2.L 478.57.1.L 488.45.6.L 489.52.1.L 490.57.1.L 494.40.6.L 495.52.1.L 496.56.1.L 500.45.1.L 501.45.1.L 502.45.1.L 503.45.2.L 505.45.1.L 506.45.1.L 507.45.1.L 508.45.1.L 509.45.1.L 510.45.1.L 511.45.1.L 512.45.1.L 513.45.1.L 514.45.1.L 515.45.1.L 516.45.1.L 517.45.1.L 518.45.1.L 519.45.1.L 520.45.1.L 521.45.1.L 522.45.1.L 523.45.1.L 524.45.1.L 525.45.1.L 526.45.1.L 527.45.1.L 528.45.1.L 529.45.1.L 530.45.2.L 532.38.1.L 532.45.1.L 533.38.1.L 533.45.1.L 534.38.1.L 534.45.1.L 535.38.1.L 535.45.1.L 536.38.1.L 536.45.1.L 537.38.1.L 537.45.1.L 538.39.1.L 538.45.1.L 539.39.1.L 539.45.1.L 540.39.1.L 540.45.1.L 541.39.1.L 541.45.1.L 542.39.1.L 542.45.1.L 543.39.1.L 543.45.1.L 544.40.1.L 544.45.1.L 545.40.1.L 545.45.1.L 546.40.1.L 546.45.1.L 547.40.1.L 547.45.1.L 548.40.1.L 548.44.1.L 549.40.1.L 549.44.1.L 550.33.1.L 550.45.1.L 551.45.1.L 552.45.1.L 553.45.1.L 554.45.1.L 555.45.1.L 556.45.1.L 557.45.2.L 559.45.1.L 560.45.1.L 561.45.1.L 562.45.1.L 563.45.1.L 564.45.1.L 565.45.1.L 566.45.1.L 567.45.1.L 568.45.1.L 569.45.1.L 570.45.1.L 571.45.1.L 572.45.1.L 573.45.1.L 574.45.1.L 575.46.1.L 576.46.1.L 577.46.1.L 578.46.1.L 579.46.1.L 580.46.1.L 581.46.1.L 582.46.1.L 583.46.1.L 584.46.2.L 586.46.1.L 587.46.1.L 588.46.1.L 589.46.1.L 590.46.1.L 591.46.1.L 592.46.1.L 593.46.1.L 594.47.1.L 595.47.1.L 596.47.1.L 597.47.1.L 598.47.1.L 599.47.12.L 600.48.3.L 606.52.3.L 606.56.3.L 613.33.12.L 613.57.1.L 617.57.1.L 619.57.1.L 623.57.1.L 625.57.1.L 629.57.1.L 631.57.1.L 650.45.6.L 651.52.1.L 652.57.1.L 656.40.6.L 657.52.1.L 658.56.1.L 662.45.12.L 663.52.1.L 664.57.1.L 675.45.6.L 676.52.1.L 677.57.1.L 681.40.6.L 682.52.1.L 683.56.1.L 687.45.12.L 688.52.1.L 689.57.1.L 694.48.1.L 695.55.1.L 700.43.6.L 701.55.1.L 706.45.6.L 707.52.1.L 708.57.1.L 712.40.12.L 713.52.1.L 737.45.6.L 738.52.1.L 739.57.1.L 743.40.7.L 744.52.1.L 745.56.1.L 750.45.12.L 751.52.1.L 752.57.1.L 762.45.6.L 763.52.1.L 764.57.1.L 768.40.7.L 769.52.1.L 770.56.1.L 775.33.12.L 775.45.12.L 0.76.1.R 1.75.1.R 2.76.1.R 3.75.1.R 4.76.1.R 5.71.1.R 6.74.1.R 7.72.1.R 8.69.1.R 11.60.1.R 12.64.1.R 13.69.1.R 14.71.1.R 17.64.2.R 19.68.1.R 20.71.1.R 21.72.1.R 24.64.1.R 25.76.1.R 26.75.1.R 27.76.1.R 28.75.1.R 29.76.1.R 30.71.1.R 31.74.1.R 32.72.1.R 33.69.1.R 36.60.1.R 37.64.1.R 38.69.1.R 39.71.1.R 42.62.1.R 43.72.1.R 44.71.2.R 46.69.1.R 50.76.1.R 51.75.1.R 52.76.1.R 53.75.1.R 54.76.1.R 55.71.1.R 56.74.1.R 57.72.1.R 58.69.1.R 61.60.1.R 62.64.1.R 63.69.1.R 64.71.1.R 67.64.1.R 68.68.1.R 69.71.1.R 70.72.1.R 74.64.1.R 75.76.1.R 76.75.1.R 77.76.1.R 78.75.1.R 79.76.1.R 80.71.1.R 81.74.1.R 82.72.1.R 83.69.1.R 86.60.1.R 87.64.1.R 88.69.1.R 89.71.1.R 92.62.1.R 93.72.1.R 94.71.1.R 95.69.1.R 98.71.2.R 100.72.1.R 101.74.1.R 102.76.1.R 104.60.1.R 105.67.1.R 106.77.1.R 107.76.1.R 108.74.1.R 110.59.1.R 111.65.1.R 112.76.1.R 113.74.1.R 114.72.1.R 117.64.1.R 118.74.1.R 119.72.1.R 120.71.1.R 122.64.1.R 123.64.1.R 124.76.1.R 125.64.2.R 127.76.1.R 128.76.1.R 129.88.1.R 130.75.1.R 131.76.1.R 132.75.1.R 133.76.1.R 134.75.1.R 135.76.1.R 136.75.1.R 137.76.1.R 138.75.1.R 139.76.1.R 140.75.1.R 141.76.1.R 142.71.1.R 143.74.1.R 144.72.1.R 145.69.1.R 148.60.1.R 149.64.1.R 150.69.1.R 151.71.1.R 155.64.1.R 156.68.1.R 157.71.1.R 158.72.1.R 161.64.1.R 162.76.1.R 163.75.1.R 164.76.1.R 165.75.1.R 166.76.1.R 167.71.1.R 168.74.1.R 169.72.1.R 170.69.1.R 173.60.1.R 174.64.1.R 175.69.1.R 176.71.1.R 179.62.2.R 181.72.1.R 182.71.1.R 183.69.1.R 186.71.1.R 187.72.1.R 188.74.1.R 189.76.1.R 191.60.1.R 192.67.1.R 193.77.1.R 194.76.1.R 195.74.1.R 197.59.1.R 198.65.1.R 199.76.1.R 200.74.1.R 201.72.1.R 204.64.1.R 205.74.1.R 206.72.2.R 208.71.1.R 210.64.1.R 211.64.1.R 212.76.1.R 213.64.1.R 214.76.1.R 215.76.1.R 216.88.1.R 217.75.1.R 218.76.1.R 219.75.1.R 220.76.1.R 221.75.1.R 222.76.1.R 223.75.1.R 224.76.1.R 225.75.1.R 226.76.1.R 227.75.1.R 228.76.1.R 229.71.1.R 230.74.1.R 231.72.1.R 232.69.1.R 236.60.1.R 237.64.1.R 238.69.1.R 239.71.1.R 242.64.1.R 243.68.1.R 244.71.1.R 245.72.1.R 248.64.1.R 249.76.1.R 250.75.1.R 251.76.1.R 252.75.1.R 253.76.1.R 254.71.1.R 255.74.1.R 256.72.1.R 257.69.1.R 260.60.2.R 262.64.1.R 263.69.1.R 264.71.1.R 267.62.1.R 268.72.1.R 269.71.1.R 270.69.1.R 273.58.1.R 273.60.1.R 273.64.1.R 273.72.1.R 274.60.1.R 274.65.1.R 274.72.1.R 275.58.1.R 275.60.1.R 275.64.1.R 275.67.1.R 275.72.1.R 276.65.1.R 277.69.1.R 277.72.1.R 278.60.1.R 280.60.1.R 280.77.1.R 282.76.1.R 283.58.1.R 283.76.1.R 284.62.1.R 284.74.1.R 285.58.1.R 286.62.1.R 286.82.1.R 287.58.1.R 288.81.1.R 289.81.1.R 290.64.1.R 290.79.1.R 291.58.1.R 291.77.1.R 292.64.1.R 292.76.1.R 293.58.1.R 293.74.1.R 294.64.1.R 294.72.1.R 295.70.1.R 297.60.1.R 297.69.1.R 299.60.1.R 299.70.1.R 300.69.1.R 301.67.1.R 301.70.1.R 301.72.1.R 302.69.1.R 303.60.1.R 305.60.1.R 305.74.1.R 306.75.1.R 307.76.1.R 309.60.1.R 310.76.1.R 311.62.1.R 311.77.1.R 312.69.1.R 313.72.1.R 314.64.2.R 317.65.1.R 318.74.1.R 319.65.1.R 319.71.1.R 320.60.1.R 320.64.1.R 320.72.1.R 320.79.1.R 321.67.1.R 321.79.1.R 322.69.1.R 322.79.1.R 323.65.1.R 323.67.1.R 323.71.1.R 323.79.1.R 324.64.1.R 324.67.1.R 324.72.1.R 325.62.1.R 325.65.1.R 325.67.1.R 325.79.1.R 326.60.1.R 326.64.1.R 326.67.1.R 326.74.1.R 326.79.1.R 327.76.1.R 327.79.1.R 327.84.1.R 328.83.1.R 329.79.1.R 329.81.1.R 330.59.1.R 330.76.1.R 330.77.1.R 331.74.1.R 331.79.1.R 332.60.1.R 332.74.1.R 332.77.1.R 333.67.1.R 333.72.1.R 333.79.1.R 334.69.1.R 334.79.1.R 335.65.1.R 335.67.1.R 335.71.1.R 335.79.1.R 336.64.1.R 336.67.1.R 336.79.1.R 337.62.1.R 337.65.1.R 337.67.1.R 337.72.1.R 337.79.1.R 338.60.1.R 338.64.1.R 338.74.1.R 338.79.1.R 339.76.1.R 339.79.1.R 339.84.1.R 340.83.1.R 341.79.1.R 341.81.1.R 342.76.1.R 342.77.1.R 343.59.1.R 343.74.1.R 343.79.1.R 344.74.1.R 344.77.1.R 345.59.1.R 345.76.1.R 345.77.1.R 346.75.1.R 346.76.1.R 347.71.1.R 347.76.1.R 348.75.1.R 348.76.1.R 349.71.1.R 349.76.1.R 350.75.1.R 350.76.1.R 351.76.3.R 354.71.1.R 355.76.1.R 356.75.1.R 357.76.3.R 360.71.1.R 361.76.1.R 362.75.1.R 363.76.1.R 364.75.1.R 365.76.1.R 366.75.1.R 367.76.1.R 368.75.2.R 370.76.1.R 371.75.1.R 372.76.1.R 373.71.1.R 374.74.1.R 375.72.1.R 376.69.1.R 379.60.1.R 380.64.1.R 381.69.1.R 382.71.1.R 385.64.1.R 386.68.1.R 387.71.1.R 388.72.1.R 391.64.1.R 392.76.1.R 393.75.1.R 394.76.1.R 395.75.2.R 397.76.1.R 398.71.1.R 399.74.1.R 400.72.1.R 401.69.1.R 404.60.1.R 405.64.1.R 406.69.1.R 407.71.1.R 410.62.1.R 411.72.1.R 412.71.1.R 413.69.1.R 416.71.1.R 417.72.1.R 418.74.1.R 419.76.1.R 421.60.1.R 422.67.2.R 424.77.1.R 425.76.1.R 426.74.1.R 428.59.1.R 429.65.1.R 430.76.1.R 431.74.1.R 432.72.1.R 435.64.1.R 436.74.1.R 437.72.1.R 438.71.1.R 440.64.1.R 441.64.1.R 442.76.1.R 443.64.1.R 444.76.1.R 445.76.1.R 446.88.1.R 447.75.1.R 448.76.1.R 449.75.2.R 451.76.1.R 452.75.1.R 453.76.1.R 454.75.1.R 455.76.1.R 456.75.1.R 457.76.1.R 458.75.1.R 459.76.1.R 460.71.1.R 461.74.1.R 462.72.1.R 463.69.1.R 466.60.1.R 467.64.1.R 468.69.1.R 469.71.1.R 472.64.1.R 473.68.1.R 474.71.1.R 475.72.1.R 479.64.1.R 480.76.1.R 481.75.1.R 482.76.1.R 483.75.1.R 484.76.1.R 485.71.1.R 486.74.1.R 487.72.1.R 488.69.1.R 491.60.1.R 492.64.1.R 493.69.1.R 494.71.1.R 497.62.1.R 498.72.1.R 499.71.1.R 500.69.3.R 507.64.3.R 507.67.3.R 507.70.3.R 507.73.3.R 513.65.3.R 513.69.3.R 513.74.3.R 517.73.1.R 517.76.1.R 518.74.1.R 518.77.1.R 519.68.3.R 519.74.3.R 519.77.3.R 523.68.2.R 523.74.2.R 523.77.2.R 525.69.3.R 525.72.3.R 525.76.3.R 532.65.3.R 532.74.3.R 536.64.1.R 536.72.1.R 537.62.1.R 537.71.1.R 538.60.3.R 538.66.3.R 538.69.3.R 542.60.2.R 542.69.2.R 544.60.2.R 544.69.2.R 546.64.2.R 546.72.2.R 548.62.2.R 548.71.2.R 550.60.3.R 550.69.3.R 556.64.3.R 556.67.3.R 556.70.3.R 556.73.3.R 563.65.3.R 563.69.3.R 563.74.3.R 567.73.1.R 567.76.1.R 568.74.1.R 568.77.1.R 569.74.3.R 569.77.3.R 573.74.2.R 573.77.2.R 575.74.3.R 575.77.3.R 581.67.3.R 581.75.3.R 586.65.1.R 586.74.1.R 587.63.1.R 587.72.1.R 588.62.3.R 588.65.3.R 588.70.3.R 592.62.2.R 592.65.2.R 592.69.2.R 594.62.3.R 594.65.3.R 594.68.3.R 598.62.2.R 598.65.2.R 598.68.2.R 600.60.3.R 600.64.3.R 600.69.3.R 606.64.3.R 606.71.3.R 613.60.1.R 614.64.1.R 615.69.1.R 615.72.1.R 616.76.1.R 617.60.1.R 617.64.1.R 617.72.1.R 617.74.1.R 618.71.1.R 619.60.1.R 619.64.1.R 619.69.1.R 619.72.1.R 620.76.1.R 621.81.1.R 622.84.1.R 622.88.1.R 623.60.1.R 623.64.1.R 623.86.1.R 624.83.1.R 624.84.1.R 625.60.1.R 625.64.1.R 625.81.1.R 626.84.1.R 626.88.1.R 627.93.1.R 628.96.1.R 628.100.1.R 629.60.1.R 629.64.1.R 629.98.1.R 630.96.1.R 631.60.1.R 631.64.1.R 631.94.1.R 631.95.1.R 632.93.1.R 633.91.1.R 633.92.1.R 634.90.1.R 635.88.1.R 635.89.1.R 636.87.1.R 637.85.1.R 637.86.1.R 638.84.1.R 639.83.1.R 640.81.1.R 640.82.1.R 641.80.1.R 642.78.1.R 642.79.1.R 643.77.1.R 644.76.1.R 645.75.1.R 646.76.1.R 647.71.1.R 648.74.1.R 649.72.1.R 650.69.1.R 653.60.1.R 654.64.1.R 655.69.1.R 656.71.1.R 659.64.1.R 660.68.1.R 661.71.1.R 662.72.1.R 665.64.2.R 667.76.1.R 668.75.1.R 669.76.1.R 670.75.1.R 671.76.1.R 672.71.1.R 673.74.1.R 674.72.1.R 675.69.1.R 678.60.1.R 679.64.1.R 680.69.1.R 681.71.1.R 684.62.1.R 685.72.1.R 686.71.1.R 687.69.1.R 690.71.1.R 691.72.1.R 692.74.2.R 694.76.1.R 696.60.1.R 697.67.1.R 698.77.1.R 699.76.1.R 700.74.1.R 702.59.1.R 703.65.1.R 704.76.1.R 705.74.1.R 706.72.1.R 709.64.1.R 710.74.1.R 711.72.1.R 712.71.1.R 714.64.1.R 715.64.1.R 716.76.1.R 717.64.1.R 718.76.1.R 719.76.2.R 721.88.1.R 722.75.1.R 723.76.1.R 724.75.1.R 725.76.1.R 726.75.1.R 727.76.1.R 728.75.1.R 729.76.1.R 730.75.1.R 731.76.1.R 732.75.1.R 733.76.1.R 734.71.1.R 735.74.1.R 736.72.1.R 737.69.1.R 740.60.1.R 741.64.1.R 742.69.1.R 743.71.1.R 746.64.2.R 748.68.1.R 749.71.1.R 750.72.1.R 753.64.1.R 754.76.1.R 755.75.1.R 756.76.1.R 757.75.1.R 758.76.1.R 759.71.1.R 760.74.1.R 761.72.1.R 762.69.1.R 765.60.1.R 766.64.1.R 767.69.1.R 768.71.1.R 771.62.1.R 772.72.1.R 773.71.2.R 775.69.3.R';
SONGS.push(
  {
    id: 'fur-elise-full', group: 'fur-elise', level: 'Medium',
    // the rondo's A section from the SAME verified full chart, the 2015
    // simplified chart measured HARDER than the full piece (density), so it
    // stays as cross-verification evidence only
    title: 'Für Elise', composer: 'Beethoven (theme section)',
    bpm: 126, timeSig: [3, 8], beatUnit: 8,
    sections: [
      { name: 'Theme', startBeat: 0, endBeat: 48 },
      { name: 'Theme again', startBeat: 48, endBeat: 96 },
    ],
    notes: fromStream(FE_HARD, 2).filter((n) => n.b < 96),
  },
  {
    id: 'fur-elise-hard', group: 'fur-elise', level: 'Hard',
    title: 'Für Elise', composer: 'Beethoven · the full rondo',
    bpm: 140, timeSig: [3, 8], beatUnit: 8,
    sections: [
      { name: 'Theme', startBeat: 0, endBeat: 96 },
      { name: 'Episode in F', startBeat: 96, endBeat: 176 },
      { name: 'Theme returns', startBeat: 176, endBeat: 232 },
      { name: 'Storm episode', startBeat: 232, endBeat: 312 },
      { name: 'Final theme', startBeat: 312, endBeat: 392 },
    ],
    notes: fromStream(FE_HARD, 2),
  },
);


// ---- 2026-08-28 wave 8: Gangsta's Paradise Hard, performance-curated ----
// Mark's ask: "make this the hard version". PianoX's piano cover
// (youtube XNMRfoJyIxE), transcribed through the 16th-council listening lane
// and manually reconstructed: 80bpm grid quantize (mean error 0.21 16ths),
// 92.3% in the app's triple-verified C-minor skeleton, chromatic ghosts
// below the 1% floor dropped (1 note), hands split at the register seam.
// The first performance-curated tier; the old cover-style hard retires.
const GP_PIANOX = '32.44.2.L 32.56.2.L 40.53.2.L 48.55.2.L 48.59.2.L 64.44.2.L 65.51.2.L 66.56.2.L 70.56.2.L 71.51.2.L 72.41.2.L 73.48.2.L 74.53.2.L 75.56.2.L 79.53.2.L 80.43.2.L 81.50.2.L 82.43.2.L 82.55.2.L 83.59.2.L 86.59.2.L 87.55.2.L 88.36.2.L 89.43.2.L 90.48.2.L 91.51.2.L 93.55.2.L 94.51.2.L 95.48.2.L 96.44.2.L 97.51.2.L 98.56.2.L 102.56.2.L 103.51.2.L 104.44.2.L 105.51.2.L 106.56.2.L 110.56.2.L 111.51.2.L 112.41.2.L 113.48.2.L 114.53.2.L 115.56.2.L 118.56.2.L 119.53.2.L 120.41.2.L 121.48.2.L 122.53.2.L 123.56.2.L 124.48.2.L 126.56.2.L 127.53.2.L 128.43.2.L 129.50.2.L 130.55.2.L 131.59.2.L 133.50.2.L 134.55.2.L 135.50.2.L 136.43.2.L 137.50.2.L 138.55.2.L 139.59.2.L 142.59.2.L 143.43.2.L 143.55.2.L 144.36.2.L 145.43.2.L 146.48.2.L 147.51.2.L 148.36.2.L 148.48.2.L 149.55.2.L 150.48.2.L 150.51.2.L 151.48.2.L 152.36.2.L 153.43.2.L 154.48.2.L 155.51.2.L 156.36.2.L 156.48.2.L 157.55.2.L 158.51.2.L 159.48.2.L 160.32.2.L 160.44.2.L 167.56.2.L 171.56.2.L 174.56.2.L 176.29.2.L 176.41.2.L 183.56.2.L 185.53.2.L 187.56.2.L 190.56.2.L 192.31.2.L 192.43.2.L 198.59.2.L 199.55.2.L 202.59.2.L 203.55.2.L 206.59.2.L 207.55.2.L 208.36.2.L 208.48.2.L 215.55.2.L 219.55.2.L 222.55.2.L 223.51.2.L 224.44.2.L 225.51.2.L 226.56.2.L 230.56.2.L 231.51.2.L 232.41.2.L 233.48.2.L 234.53.2.L 235.56.2.L 238.56.2.L 239.53.2.L 240.43.2.L 241.50.2.L 242.55.2.L 243.59.2.L 246.59.2.L 247.55.2.L 248.36.2.L 249.43.2.L 250.48.2.L 251.51.2.L 253.43.2.L 253.48.2.L 254.55.2.L 255.51.2.L 256.48.2.L 258.32.2.L 258.44.2.L 267.53.2.L 275.55.2.L 284.48.2.L 284.55.2.L 292.44.2.L 292.51.2.L 300.41.2.L 300.48.2.L 307.48.2.L 309.43.2.L 309.50.2.L 309.59.2.L 317.36.2.L 317.48.2.L 325.32.2.L 325.44.2.L 327.56.2.L 328.51.2.L 329.56.2.L 331.31.2.L 331.43.2.L 333.29.2.L 333.41.2.L 337.41.2.L 337.53.2.L 337.56.2.L 339.48.2.L 341.31.2.L 341.43.2.L 341.59.2.L 345.43.2.L 345.55.2.L 345.59.2.L 347.50.2.L 347.59.2.L 349.39.2.L 349.51.2.L 351.55.2.L 353.38.2.L 353.50.2.L 355.36.2.L 355.48.2.L 357.32.2.L 357.44.2.L 359.44.2.L 360.51.2.L 361.56.2.L 363.31.2.L 363.43.2.L 365.29.2.L 365.41.2.L 369.53.2.L 369.56.2.L 371.48.2.L 373.31.2.L 373.43.2.L 373.59.2.L 375.59.2.L 377.55.2.L 377.59.2.L 379.50.2.L 381.36.2.L 381.48.2.L 384.36.2.L 384.48.2.L 385.55.2.L 387.48.2.L 389.32.2.L 389.44.2.L 392.51.2.L 393.56.2.L 395.31.2.L 395.43.2.L 397.29.2.L 397.41.2.L 401.53.2.L 401.56.2.L 403.48.2.L 405.31.2.L 405.43.2.L 405.59.2.L 407.55.2.L 407.59.2.L 409.55.2.L 409.59.2.L 410.47.2.L 411.50.2.L 413.39.2.L 413.51.2.L 415.55.2.L 417.38.2.L 417.50.2.L 419.36.2.L 419.48.2.L 421.32.2.L 421.44.2.L 424.51.2.L 425.56.2.L 427.31.2.L 427.43.2.L 429.29.2.L 429.41.2.L 433.53.2.L 433.56.2.L 435.48.2.L 437.31.2.L 437.43.2.L 437.59.2.L 439.55.2.L 439.59.2.L 441.55.2.L 441.59.2.L 443.50.2.L 445.36.2.L 445.48.2.L 447.48.2.L 448.36.2.L 449.48.2.L 449.55.2.L 451.48.2.L 453.32.2.L 453.44.2.L 455.32.2.L 457.51.2.L 457.56.2.L 459.32.2.L 460.43.2.L 461.29.2.L 463.29.2.L 465.48.2.L 465.53.2.L 467.29.2.L 468.41.2.L 469.31.2.L 469.43.2.L 469.59.2.L 471.31.2.L 473.50.2.L 473.55.2.L 473.59.2.L 475.31.2.L 476.43.2.L 477.36.2.L 477.43.2.L 479.36.2.L 481.51.2.L 481.55.2.L 483.36.2.L 483.48.2.L 484.34.2.L 484.46.2.L 485.32.2.L 485.44.2.L 486.32.2.L 489.44.2.L 489.51.2.L 489.56.2.L 490.32.2.L 491.43.2.L 492.29.2.L 492.41.2.L 494.29.2.L 496.48.2.L 496.53.2.L 498.29.2.L 499.41.2.L 500.31.2.L 500.43.2.L 500.59.2.L 502.31.2.L 502.43.2.L 504.50.2.L 504.55.2.L 504.59.2.L 506.31.2.L 507.43.2.L 508.36.2.L 510.36.2.L 512.51.2.L 512.55.2.L 514.36.2.L 514.48.2.L 515.34.2.L 515.46.2.L 516.32.2.L 516.44.2.L 518.32.2.L 518.44.2.L 520.44.2.L 520.51.2.L 520.56.2.L 522.32.2.L 523.43.2.L 524.32.2.L 526.29.2.L 528.41.2.L 528.48.2.L 530.29.2.L 531.41.2.L 532.31.2.L 532.43.2.L 534.31.2.L 536.43.2.L 536.50.2.L 536.55.2.L 538.31.2.L 539.43.2.L 540.36.2.L 542.36.2.L 544.51.2.L 544.55.2.L 546.34.2.L 546.46.2.L 548.32.2.L 548.44.2.L 550.32.2.L 552.51.2.L 552.56.2.L 554.32.2.L 555.43.2.L 556.29.2.L 558.29.2.L 560.41.2.L 560.48.2.L 560.53.2.L 562.29.2.L 563.41.2.L 564.31.2.L 564.43.2.L 566.31.2.L 568.43.2.L 568.50.2.L 568.55.2.L 570.31.2.L 571.43.2.L 572.36.2.L 574.36.2.L 576.51.2.L 576.55.2.L 578.36.2.L 578.48.2.L 580.32.2.L 580.44.2.L 582.44.2.L 583.51.2.L 584.44.2.L 584.56.2.L 586.31.2.L 586.43.2.L 588.29.2.L 588.41.2.L 592.41.2.L 592.53.2.L 592.56.2.L 594.48.2.L 596.31.2.L 596.43.2.L 596.59.2.L 598.43.2.L 600.47.2.L 600.55.2.L 600.59.2.L 602.50.2.L 604.39.2.L 604.51.2.L 606.55.2.L 608.38.2.L 608.50.2.L 610.36.2.L 610.48.2.L 612.32.2.L 612.44.2.L 614.44.2.L 614.56.2.L 615.51.2.L 616.56.2.L 618.31.2.L 618.34.2.L 618.43.2.L 620.29.2.L 620.41.2.L 624.53.2.L 624.56.2.L 626.48.2.L 628.31.2.L 628.43.2.L 628.59.2.L 630.55.2.L 630.59.2.L 632.55.2.L 632.59.2.L 634.50.2.L 634.59.2.L 636.36.2.L 636.48.2.L 639.36.2.L 639.48.2.L 640.55.2.L 642.48.2.L 644.32.2.L 644.44.2.L 646.44.2.L 647.51.2.L 648.44.2.L 648.56.2.L 650.31.2.L 650.43.2.L 652.29.2.L 652.41.2.L 656.41.2.L 656.53.2.L 656.56.2.L 658.48.2.L 660.31.2.L 660.43.2.L 660.59.2.L 664.55.2.L 664.59.2.L 666.50.2.L 668.39.2.L 668.51.2.L 670.55.2.L 672.38.2.L 672.50.2.L 674.36.2.L 674.48.2.L 676.32.2.L 676.44.2.L 678.44.2.L 679.51.2.L 680.56.2.L 682.31.2.L 682.43.2.L 684.29.2.L 684.41.2.L 687.53.2.L 687.56.2.L 689.48.2.L 691.43.2.L 691.50.2.L 691.59.2.L 695.55.2.L 695.59.2.L 697.50.2.L 699.36.2.L 699.48.2.L 702.36.2.L 702.48.2.L 703.55.2.L 705.36.2.L 705.48.2.L 707.44.2.L 709.44.2.L 709.51.2.L 713.51.2.L 715.41.2.L 717.56.2.L 721.56.2.L 723.43.2.L 725.59.2.L 729.59.2.L 731.36.2.L 733.51.2.L 735.51.2.L 737.51.2.L 739.44.2.L 741.51.2.L 745.51.2.L 747.41.2.L 749.56.2.L 753.56.2.L 755.43.2.L 757.59.2.L 761.59.2.L 763.36.2.L 765.48.2.L 765.51.2.L 769.51.2.L 771.44.2.L 772.51.2.L 773.56.2.L 777.56.2.L 779.41.2.L 780.48.2.L 781.53.2.L 782.56.2.L 784.56.2.L 785.53.2.L 787.43.2.L 788.50.2.L 789.55.2.L 790.59.2.L 792.59.2.L 793.55.2.L 794.50.2.L 795.36.2.L 796.43.2.L 797.48.2.L 798.51.2.L 799.43.2.L 799.55.2.L 801.43.2.L 802.51.2.L 803.44.2.L 804.51.2.L 805.44.2.L 805.56.2.L 809.56.2.L 810.51.2.L 811.41.2.L 812.48.2.L 813.53.2.L 814.56.2.L 816.56.2.L 817.53.2.L 818.48.2.L 819.43.2.L 820.50.2.L 821.55.2.L 822.59.2.L 824.47.2.L 824.59.2.L 825.55.2.L 826.50.2.L 827.36.2.L 828.43.2.L 829.48.2.L 830.51.2.L 831.55.2.L 833.55.2.L 834.51.2.L 835.44.2.L 836.51.2.L 837.56.2.L 841.56.2.L 842.51.2.L 843.41.2.L 844.48.2.L 845.53.2.L 846.56.2.L 848.56.2.L 849.53.2.L 850.48.2.L 851.43.2.L 852.50.2.L 853.55.2.L 854.59.2.L 856.59.2.L 857.55.2.L 858.50.2.L 859.36.2.L 860.43.2.L 861.48.2.L 862.51.2.L 863.55.2.L 865.55.2.L 866.51.2.L 867.44.2.L 868.51.2.L 869.56.2.L 873.56.2.L 874.51.2.L 875.41.2.L 876.48.2.L 877.53.2.L 878.56.2.L 879.56.2.L 881.48.2.L 881.53.2.L 882.43.2.L 883.50.2.L 884.55.2.L 885.59.2.L 887.43.2.L 887.59.2.L 888.55.2.L 889.50.2.L 890.36.2.L 891.43.2.L 892.48.2.L 893.51.2.L 894.43.2.L 894.55.2.L 896.55.2.L 898.44.2.L 898.56.2.L 906.53.2.L 914.55.2.L 922.48.2.L 922.55.2.L 930.44.2.L 930.51.2.L 938.41.2.L 938.48.2.L 946.43.2.L 946.50.2.L 946.59.2.L 954.36.2.L 954.48.2.L 1026.56.2.L 1034.53.2.L 1042.55.2.L 1042.59.2.L 0.72.2.R 0.75.2.R 2.87.2.R 4.75.2.R 4.87.2.R 6.87.2.R 7.86.2.R 8.68.2.R 8.72.2.R 8.84.2.R 9.84.2.R 11.84.2.R 12.75.2.R 14.84.2.R 16.67.2.R 16.71.2.R 16.83.2.R 18.79.2.R 19.86.2.R 20.71.2.R 20.74.2.R 21.87.2.R 24.72.2.R 24.75.2.R 24.86.2.R 25.84.2.R 26.72.2.R 26.83.2.R 27.72.2.R 27.84.2.R 28.74.2.R 28.79.2.R 30.75.2.R 32.60.2.R 32.63.2.R 34.75.2.R 36.63.2.R 36.68.2.R 36.72.2.R 36.77.2.R 38.75.2.R 39.74.2.R 40.60.2.R 40.68.2.R 40.72.2.R 41.72.2.R 43.72.2.R 44.60.2.R 44.68.2.R 44.72.2.R 44.77.2.R 44.80.2.R 46.72.2.R 47.72.2.R 48.67.2.R 48.71.2.R 50.67.2.R 51.71.2.R 52.74.2.R 52.79.2.R 52.83.2.R 52.86.2.R 54.75.2.R 56.60.2.R 56.63.2.R 56.74.2.R 57.72.2.R 58.71.2.R 59.72.2.R 60.67.2.R 61.60.2.R 62.62.2.R 63.63.2.R 66.75.2.R 66.87.2.R 67.60.2.R 68.63.2.R 68.77.2.R 68.89.2.R 69.60.2.R 70.75.2.R 70.87.2.R 71.74.2.R 71.86.2.R 72.72.2.R 72.84.2.R 73.72.2.R 73.84.2.R 75.72.2.R 75.84.2.R 76.65.2.R 77.60.2.R 78.60.2.R 78.72.2.R 78.84.2.R 80.71.2.R 80.83.2.R 82.67.2.R 82.79.2.R 83.74.2.R 83.86.2.R 84.67.2.R 85.62.2.R 85.75.2.R 85.87.2.R 88.74.2.R 88.86.2.R 89.72.2.R 89.84.2.R 90.71.2.R 90.83.2.R 91.72.2.R 91.84.2.R 92.60.2.R 96.72.2.R 96.75.2.R 96.84.2.R 99.60.2.R 100.63.2.R 100.72.2.R 100.75.2.R 100.84.2.R 101.60.2.R 104.74.2.R 104.80.2.R 104.86.2.R 107.60.2.R 108.63.2.R 108.75.2.R 108.80.2.R 108.87.2.R 109.60.2.R 112.74.2.R 112.80.2.R 112.86.2.R 116.65.2.R 116.72.2.R 116.80.2.R 116.84.2.R 117.60.2.R 120.74.2.R 120.80.2.R 120.86.2.R 124.65.2.R 124.75.2.R 124.80.2.R 124.87.2.R 125.60.2.R 128.71.2.R 128.74.2.R 128.79.2.R 128.83.2.R 132.62.2.R 132.67.2.R 132.71.2.R 132.74.2.R 132.79.2.R 136.74.2.R 136.77.2.R 136.86.2.R 140.67.2.R 140.75.2.R 140.79.2.R 140.87.2.R 141.62.2.R 143.87.2.R 144.74.2.R 144.79.2.R 144.86.2.R 148.72.2.R 148.75.2.R 148.84.2.R 152.74.2.R 152.83.2.R 152.86.2.R 156.60.2.R 156.75.2.R 156.79.2.R 156.87.2.R 160.84.2.R 161.80.2.R 162.75.2.R 163.72.2.R 164.68.2.R 164.84.2.R 165.63.2.R 165.80.2.R 166.60.2.R 166.75.2.R 167.72.2.R 168.67.2.R 168.86.2.R 169.63.2.R 169.80.2.R 170.60.2.R 170.75.2.R 171.72.2.R 172.65.2.R 172.87.2.R 173.60.2.R 173.80.2.R 174.75.2.R 175.72.2.R 176.84.2.R 177.80.2.R 178.77.2.R 179.72.2.R 180.68.2.R 180.84.2.R 181.65.2.R 181.80.2.R 182.60.2.R 182.77.2.R 183.72.2.R 184.67.2.R 184.86.2.R 185.65.2.R 185.80.2.R 186.60.2.R 186.77.2.R 187.72.2.R 188.65.2.R 188.87.2.R 189.60.2.R 189.80.2.R 190.77.2.R 191.72.2.R 192.83.2.R 193.79.2.R 194.74.2.R 195.71.2.R 196.67.2.R 196.83.2.R 197.62.2.R 197.79.2.R 198.74.2.R 199.71.2.R 200.65.2.R 200.84.2.R 201.62.2.R 201.79.2.R 202.74.2.R 203.71.2.R 204.63.2.R 204.86.2.R 205.62.2.R 205.79.2.R 206.74.2.R 207.71.2.R 208.86.2.R 209.79.2.R 210.75.2.R 211.72.2.R 212.67.2.R 212.84.2.R 213.63.2.R 213.79.2.R 214.60.2.R 214.75.2.R 215.72.2.R 216.65.2.R 216.86.2.R 217.63.2.R 217.79.2.R 218.60.2.R 218.75.2.R 219.72.2.R 220.63.2.R 220.87.2.R 221.60.2.R 221.79.2.R 222.75.2.R 223.72.2.R 224.84.2.R 225.80.2.R 226.72.2.R 226.75.2.R 227.60.2.R 227.72.2.R 228.63.2.R 228.84.2.R 229.60.2.R 229.80.2.R 230.75.2.R 231.72.2.R 232.84.2.R 233.80.2.R 234.77.2.R 235.72.2.R 236.65.2.R 236.84.2.R 237.60.2.R 237.80.2.R 238.77.2.R 239.72.2.R 240.83.2.R 241.79.2.R 242.74.2.R 243.71.2.R 244.67.2.R 244.83.2.R 245.62.2.R 245.79.2.R 246.74.2.R 247.71.2.R 248.72.2.R 248.75.2.R 248.84.2.R 253.67.2.R 253.72.2.R 253.75.2.R 253.79.2.R 255.60.2.R 258.72.2.R 258.75.2.R 258.80.2.R 258.84.2.R 267.60.2.R 267.68.2.R 267.72.2.R 271.74.2.R 273.72.2.R 275.67.2.R 275.71.2.R 276.62.2.R 284.63.2.R 284.72.2.R 288.74.2.R 290.75.2.R 292.60.2.R 292.63.2.R 292.72.2.R 300.63.2.R 300.68.2.R 300.75.2.R 305.62.2.R 305.74.2.R 307.60.2.R 307.72.2.R 309.71.2.R 317.60.2.R 317.63.2.R 317.72.2.R 327.63.2.R 327.68.2.R 327.75.2.R 329.60.2.R 329.63.2.R 329.68.2.R 329.72.2.R 329.75.2.R 331.63.2.R 331.68.2.R 331.75.2.R 332.63.2.R 332.68.2.R 332.75.2.R 334.60.2.R 334.63.2.R 334.72.2.R 336.60.2.R 336.63.2.R 336.72.2.R 339.60.2.R 339.63.2.R 339.72.2.R 340.72.2.R 341.67.2.R 341.71.2.R 343.67.2.R 343.71.2.R 344.62.2.R 344.67.2.R 344.74.2.R 346.63.2.R 346.67.2.R 346.75.2.R 347.62.2.R 349.63.2.R 349.67.2.R 349.74.2.R 350.72.2.R 351.60.2.R 351.70.2.R 352.72.2.R 353.63.2.R 353.74.2.R 355.75.2.R 359.63.2.R 359.68.2.R 359.75.2.R 361.60.2.R 361.65.2.R 361.77.2.R 363.63.2.R 363.70.2.R 363.75.2.R 364.62.2.R 364.68.2.R 364.74.2.R 366.60.2.R 366.68.2.R 366.72.2.R 368.60.2.R 368.68.2.R 368.72.2.R 371.60.2.R 371.68.2.R 371.72.2.R 372.60.2.R 372.68.2.R 372.72.2.R 373.67.2.R 373.71.2.R 375.67.2.R 375.71.2.R 376.62.2.R 376.71.2.R 376.74.2.R 378.63.2.R 378.67.2.R 378.75.2.R 379.62.2.R 381.63.2.R 381.67.2.R 381.74.2.R 382.72.2.R 383.70.2.R 384.63.2.R 384.67.2.R 384.72.2.R 385.60.2.R 391.63.2.R 391.68.2.R 391.75.2.R 393.60.2.R 393.63.2.R 393.68.2.R 393.72.2.R 393.75.2.R 395.63.2.R 395.68.2.R 395.75.2.R 396.63.2.R 396.68.2.R 396.75.2.R 398.60.2.R 398.63.2.R 398.72.2.R 400.60.2.R 400.63.2.R 400.72.2.R 403.60.2.R 403.63.2.R 403.72.2.R 404.60.2.R 404.63.2.R 404.72.2.R 405.67.2.R 405.71.2.R 407.67.2.R 408.62.2.R 408.67.2.R 408.74.2.R 410.63.2.R 410.67.2.R 410.75.2.R 411.62.2.R 413.63.2.R 413.67.2.R 413.74.2.R 414.72.2.R 415.60.2.R 415.70.2.R 416.72.2.R 417.63.2.R 417.67.2.R 417.74.2.R 419.63.2.R 419.67.2.R 419.75.2.R 423.63.2.R 423.68.2.R 423.75.2.R 425.60.2.R 425.65.2.R 425.68.2.R 425.72.2.R 425.77.2.R 427.63.2.R 427.72.2.R 427.75.2.R 428.62.2.R 428.68.2.R 428.74.2.R 430.60.2.R 430.68.2.R 432.60.2.R 432.68.2.R 432.72.2.R 435.60.2.R 435.68.2.R 435.72.2.R 436.60.2.R 436.68.2.R 436.72.2.R 437.67.2.R 437.71.2.R 439.67.2.R 440.62.2.R 440.67.2.R 440.74.2.R 441.67.2.R 441.71.2.R 442.63.2.R 442.67.2.R 442.75.2.R 445.63.2.R 445.67.2.R 445.74.2.R 446.72.2.R 447.70.2.R 448.63.2.R 448.67.2.R 448.72.2.R 449.60.2.R 450.72.2.R 453.60.2.R 453.63.2.R 453.72.2.R 455.72.2.R 457.60.2.R 457.63.2.R 457.72.2.R 461.60.2.R 461.63.2.R 461.72.2.R 465.60.2.R 465.63.2.R 465.72.2.R 467.72.2.R 469.62.2.R 469.67.2.R 469.71.2.R 473.62.2.R 473.67.2.R 473.71.2.R 477.60.2.R 477.63.2.R 477.72.2.R 481.60.2.R 481.63.2.R 481.67.2.R 485.60.2.R 485.63.2.R 485.72.2.R 489.60.2.R 489.63.2.R 489.68.2.R 489.72.2.R 492.60.2.R 492.63.2.R 492.72.2.R 496.60.2.R 496.63.2.R 496.65.2.R 496.72.2.R 500.62.2.R 500.67.2.R 500.71.2.R 504.62.2.R 504.67.2.R 504.71.2.R 508.60.2.R 508.63.2.R 508.72.2.R 510.60.2.R 512.60.2.R 512.63.2.R 512.67.2.R 516.72.2.R 516.75.2.R 516.84.2.R 519.72.2.R 520.72.2.R 520.75.2.R 520.84.2.R 524.75.2.R 524.80.2.R 524.87.2.R 528.74.2.R 528.80.2.R 528.86.2.R 530.72.2.R 530.84.2.R 532.71.2.R 532.74.2.R 532.79.2.R 532.83.2.R 534.74.2.R 536.71.2.R 536.74.2.R 536.79.2.R 536.83.2.R 540.72.2.R 540.75.2.R 540.84.2.R 544.74.2.R 544.79.2.R 544.86.2.R 546.75.2.R 546.79.2.R 546.87.2.R 548.72.2.R 548.75.2.R 548.84.2.R 552.72.2.R 552.75.2.R 552.84.2.R 556.75.2.R 556.80.2.R 556.87.2.R 560.74.2.R 560.80.2.R 560.86.2.R 562.72.2.R 562.84.2.R 564.71.2.R 564.74.2.R 564.79.2.R 564.83.2.R 568.71.2.R 568.74.2.R 568.79.2.R 568.83.2.R 572.72.2.R 572.75.2.R 572.84.2.R 576.72.2.R 576.75.2.R 576.79.2.R 582.63.2.R 582.68.2.R 582.75.2.R 584.60.2.R 584.63.2.R 584.68.2.R 584.72.2.R 584.75.2.R 586.63.2.R 586.68.2.R 586.75.2.R 587.68.2.R 587.75.2.R 589.60.2.R 589.63.2.R 589.72.2.R 591.60.2.R 591.63.2.R 591.72.2.R 592.68.2.R 594.60.2.R 594.63.2.R 594.72.2.R 595.60.2.R 595.72.2.R 596.67.2.R 596.71.2.R 598.67.2.R 598.71.2.R 599.62.2.R 599.67.2.R 599.74.2.R 601.63.2.R 601.67.2.R 601.75.2.R 604.63.2.R 604.67.2.R 604.74.2.R 605.72.2.R 606.60.2.R 606.70.2.R 607.67.2.R 607.72.2.R 608.63.2.R 608.67.2.R 608.74.2.R 610.72.2.R 610.75.2.R 614.63.2.R 614.68.2.R 614.75.2.R 616.60.2.R 616.65.2.R 616.68.2.R 616.75.2.R 616.77.2.R 618.63.2.R 618.70.2.R 618.75.2.R 619.62.2.R 619.74.2.R 621.60.2.R 621.68.2.R 621.72.2.R 623.60.2.R 623.68.2.R 623.72.2.R 626.60.2.R 626.68.2.R 626.72.2.R 627.60.2.R 627.68.2.R 627.72.2.R 628.67.2.R 628.71.2.R 630.67.2.R 631.62.2.R 631.67.2.R 631.74.2.R 632.67.2.R 632.71.2.R 633.63.2.R 633.67.2.R 633.75.2.R 634.62.2.R 636.63.2.R 636.67.2.R 636.74.2.R 637.72.2.R 638.70.2.R 639.63.2.R 639.67.2.R 639.72.2.R 640.60.2.R 640.67.2.R 641.72.2.R 646.63.2.R 646.68.2.R 646.75.2.R 648.60.2.R 648.63.2.R 648.68.2.R 648.75.2.R 650.63.2.R 650.68.2.R 650.70.2.R 650.75.2.R 651.63.2.R 651.68.2.R 651.75.2.R 653.60.2.R 653.63.2.R 653.72.2.R 655.60.2.R 655.63.2.R 655.68.2.R 655.72.2.R 658.60.2.R 658.63.2.R 658.72.2.R 659.60.2.R 659.63.2.R 659.72.2.R 660.67.2.R 660.71.2.R 662.67.2.R 662.71.2.R 663.62.2.R 663.67.2.R 663.74.2.R 665.63.2.R 665.67.2.R 665.75.2.R 668.63.2.R 668.67.2.R 668.74.2.R 669.72.2.R 670.60.2.R 670.70.2.R 671.72.2.R 672.63.2.R 672.67.2.R 672.74.2.R 674.75.2.R 678.63.2.R 678.68.2.R 678.75.2.R 680.60.2.R 680.65.2.R 680.68.2.R 680.72.2.R 680.77.2.R 682.62.2.R 682.63.2.R 682.68.2.R 682.75.2.R 683.68.2.R 683.74.2.R 684.60.2.R 684.72.2.R 685.68.2.R 686.60.2.R 686.68.2.R 686.72.2.R 689.60.2.R 689.68.2.R 689.72.2.R 690.60.2.R 690.72.2.R 691.67.2.R 691.71.2.R 693.67.2.R 694.62.2.R 694.67.2.R 694.74.2.R 696.63.2.R 696.67.2.R 696.75.2.R 699.63.2.R 699.67.2.R 699.74.2.R 700.72.2.R 701.70.2.R 702.72.2.R 703.60.2.R 703.67.2.R 703.72.2.R 705.72.2.R 707.63.2.R 707.68.2.R 707.72.2.R 707.75.2.R 709.60.2.R 712.68.2.R 712.77.2.R 713.60.2.R 713.75.2.R 714.65.2.R 714.74.2.R 717.60.2.R 717.65.2.R 717.72.2.R 717.75.2.R 719.72.2.R 720.65.2.R 720.72.2.R 721.60.2.R 721.72.2.R 722.67.2.R 722.71.2.R 722.74.2.R 725.62.2.R 725.71.2.R 725.74.2.R 728.71.2.R 728.74.2.R 729.62.2.R 729.71.2.R 729.74.2.R 730.72.2.R 730.75.2.R 733.60.2.R 735.67.2.R 735.72.2.R 737.60.2.R 737.67.2.R 737.72.2.R 739.68.2.R 739.72.2.R 739.75.2.R 741.60.2.R 744.68.2.R 744.77.2.R 745.60.2.R 745.68.2.R 745.75.2.R 746.65.2.R 746.74.2.R 749.60.2.R 749.65.2.R 749.72.2.R 751.65.2.R 751.72.2.R 752.65.2.R 752.72.2.R 753.60.2.R 753.68.2.R 753.72.2.R 754.67.2.R 754.71.2.R 754.74.2.R 755.71.2.R 755.72.2.R 757.62.2.R 757.67.2.R 757.71.2.R 757.74.2.R 760.71.2.R 760.74.2.R 761.62.2.R 761.71.2.R 761.74.2.R 762.72.2.R 762.75.2.R 764.72.2.R 765.60.2.R 767.72.2.R 767.84.2.R 769.60.2.R 769.72.2.R 769.84.2.R 771.75.2.R 771.80.2.R 771.87.2.R 774.60.2.R 775.63.2.R 776.60.2.R 776.77.2.R 776.89.2.R 777.75.2.R 777.87.2.R 778.74.2.R 778.80.2.R 778.86.2.R 781.72.2.R 781.84.2.R 783.60.2.R 784.72.2.R 784.84.2.R 785.72.2.R 785.84.2.R 786.74.2.R 786.79.2.R 786.83.2.R 786.86.2.R 791.62.2.R 792.75.2.R 792.79.2.R 792.87.2.R 793.74.2.R 793.79.2.R 793.86.2.R 794.75.2.R 794.79.2.R 794.87.2.R 799.72.2.R 799.75.2.R 799.84.2.R 800.60.2.R 801.72.2.R 801.75.2.R 801.84.2.R 803.75.2.R 803.80.2.R 803.87.2.R 806.60.2.R 807.63.2.R 808.60.2.R 808.77.2.R 808.89.2.R 809.75.2.R 809.87.2.R 810.74.2.R 810.80.2.R 810.86.2.R 813.72.2.R 813.84.2.R 815.60.2.R 816.72.2.R 816.84.2.R 817.72.2.R 817.84.2.R 818.74.2.R 818.79.2.R 818.83.2.R 818.86.2.R 823.62.2.R 824.75.2.R 824.79.2.R 824.87.2.R 825.74.2.R 825.79.2.R 825.86.2.R 826.75.2.R 826.79.2.R 826.87.2.R 831.72.2.R 831.84.2.R 832.60.2.R 835.72.2.R 835.75.2.R 835.84.2.R 838.60.2.R 839.63.2.R 839.72.2.R 839.75.2.R 839.84.2.R 840.60.2.R 843.75.2.R 843.80.2.R 843.87.2.R 847.60.2.R 847.74.2.R 847.80.2.R 847.86.2.R 849.72.2.R 849.84.2.R 851.71.2.R 851.74.2.R 851.79.2.R 851.83.2.R 855.62.2.R 855.71.2.R 855.74.2.R 855.79.2.R 855.83.2.R 859.72.2.R 859.75.2.R 859.79.2.R 859.84.2.R 863.74.2.R 863.79.2.R 863.86.2.R 864.60.2.R 865.75.2.R 865.87.2.R 867.72.2.R 867.75.2.R 867.84.2.R 870.60.2.R 871.63.2.R 871.72.2.R 871.75.2.R 871.84.2.R 872.60.2.R 875.75.2.R 875.80.2.R 875.87.2.R 879.60.2.R 879.74.2.R 879.80.2.R 879.86.2.R 881.72.2.R 881.84.2.R 882.71.2.R 882.74.2.R 882.83.2.R 883.79.2.R 886.62.2.R 886.71.2.R 886.74.2.R 886.79.2.R 886.83.2.R 890.72.2.R 890.75.2.R 890.79.2.R 890.84.2.R 894.67.2.R 894.72.2.R 894.79.2.R 895.60.2.R 898.63.2.R 898.68.2.R 898.72.2.R 906.60.2.R 906.68.2.R 906.75.2.R 910.74.2.R 912.72.2.R 914.62.2.R 914.67.2.R 914.71.2.R 922.63.2.R 922.72.2.R 926.74.2.R 928.75.2.R 930.60.2.R 930.63.2.R 930.68.2.R 930.72.2.R 938.63.2.R 938.68.2.R 938.75.2.R 942.62.2.R 942.74.2.R 944.60.2.R 944.72.2.R 946.67.2.R 946.71.2.R 954.60.2.R 954.63.2.R 954.72.2.R 994.72.2.R 994.75.2.R 996.87.2.R 997.75.2.R 998.75.2.R 998.87.2.R 1000.87.2.R 1001.86.2.R 1002.68.2.R 1002.72.2.R 1002.84.2.R 1003.84.2.R 1005.84.2.R 1006.75.2.R 1008.84.2.R 1010.67.2.R 1010.71.2.R 1010.83.2.R 1012.79.2.R 1013.86.2.R 1014.71.2.R 1014.74.2.R 1015.87.2.R 1018.72.2.R 1018.75.2.R 1018.86.2.R 1019.84.2.R 1020.83.2.R 1021.84.2.R 1022.74.2.R 1022.79.2.R 1024.75.2.R 1026.60.2.R 1026.63.2.R 1028.75.2.R 1030.63.2.R 1030.68.2.R 1030.72.2.R 1030.77.2.R 1032.75.2.R 1033.74.2.R 1034.60.2.R 1034.68.2.R 1034.72.2.R 1035.72.2.R 1037.72.2.R 1038.60.2.R 1038.68.2.R 1038.72.2.R 1038.77.2.R 1038.80.2.R 1040.72.2.R 1041.72.2.R 1042.71.2.R 1044.67.2.R 1045.71.2.R 1046.74.2.R 1046.79.2.R 1046.83.2.R 1046.86.2.R 1048.75.2.R 1050.60.2.R 1050.63.2.R 1050.74.2.R 1051.72.2.R 1052.71.2.R 1053.72.2.R 1054.67.2.R 1055.60.2.R 1056.62.2.R 1057.63.2.R';
{
  const gph = SONGS.find((s) => s.id === 'gangstas-paradise-hard');
  const raw = fromStream(GP_PIANOX, 4);
  const minB = Math.min(...raw.map((n) => n.b));
  gph.notes = raw.map((n) => ({ ...n, b: n.b - minB }));
  gph.composer = "Coolio · after PianoX (performance-curated)";
  gph.bpm = 80;
  gph.timeSig = [4, 4];
  gph.sections = [
    { name: 'Intro', startBeat: 0, endBeat: 32 },
    { name: 'Verse', startBeat: 32, endBeat: 96 },
    { name: 'Chorus', startBeat: 96, endBeat: 128 },
    { name: 'Verse 2', startBeat: 128, endBeat: 192 },
    { name: 'Chorus 2', startBeat: 192, endBeat: 226 },
    { name: 'Outro', startBeat: 226, endBeat: 266 },
  ];
}

export function validateSong(song) {
  const errors = [];
  if (!song.id || !song.title) errors.push('missing id/title');
  if (!(song.bpm > 0)) errors.push('bad bpm');
  if (!Array.isArray(song.notes) || song.notes.length === 0) errors.push('no notes');
  let lastB = -Infinity;
  const byHandSorted = { L: -Infinity, R: -Infinity };
  const seen = new Set();
  for (const n of song.notes) {
    // duplicate midi at the same beat+hand deadlocks wait mode (audit #12)
    const key = `${n.b}|${n.m}|${n.h}`;
    if (seen.has(key)) errors.push(`duplicate note ${n.m} at b=${n.b}`);
    seen.add(key);
  }
  for (const n of song.notes) {
    if (!(n.b >= 0) || !(n.d > 0)) errors.push(`bad timing at b=${n.b}`);
    if (!(n.m >= 21 && n.m <= 108)) errors.push(`midi ${n.m} outside 88 keys`);
    if (n.h !== 'L' && n.h !== 'R') errors.push(`bad hand at b=${n.b}`);
    if (n.f != null && !(n.f >= 1 && n.f <= 5)) errors.push(`bad finger at b=${n.b}`);
    if (n.h && n.b < byHandSorted[n.h]) errors.push(`notes not sorted for hand ${n.h} at b=${n.b}`);
    if (n.h) byHandSorted[n.h] = n.b;
    lastB = Math.max(lastB, n.b + n.d);
  }
  if (song.sections?.length) {
    const end = song.sections[song.sections.length - 1].endBeat;
    if (end < lastB - 4) errors.push('sections do not cover the song');
  }
  return errors;
}

// Imported songs live in their own generated file so the importer can never
// rewrite a curated one, and so provenance survives: every one of them carries
// handAssignment: 'generated' and the source it came from.
SONGS.push(...IMPORTED);

// THE HANDS A SCRIPT GOT WRONG, corrected offline and committed. See
// tools/rehand.mjs: these songs were cut by a pitch threshold rather than
// arranged, and the result was physically unplayable. The correction is DATA,
// not a repair that runs here, and the length assertion means a song edited
// without re-running the tool fails loudly rather than being silently
// mis-handed.
// KEYS_RAW_HANDS lets the repair tool read the library BEFORE its own
// corrections are applied. Without it tools/rehand.mjs analyses its own output,
// concludes everything is fine, and can never revise a correction it has
// already made.
const applyRehand = !(typeof process !== 'undefined' && process.env && process.env.KEYS_RAW_HANDS);
for (const song of applyRehand ? SONGS : []) {
  const fix = REHANDED[song.id];
  if (!fix) continue;
  if (song.notes.length !== fix.notes) {
    throw new Error(`${song.id} has ${song.notes.length} notes but its correction expects ${fix.notes}: re-run tools/unroam.mjs`);
  }
  if (fix.hands) {                       // the older positional form
    song.notes.forEach((n, i) => { n.h = fix.hands[i]; });
  } else {
    // Each move must match EXACTLY ONE authored note, by beat, pitch and the
    // hand it is leaving. Anything else is a stale correction and must shout.
    for (const mv of fix.moves) {
      const hits = song.notes.filter((n) => n.b === mv.b && n.m === mv.m && n.h === mv.from);
      if (hits.length !== 1) {
        throw new Error(`${song.id}: a hand correction matched ${hits.length} notes at beat ${mv.b}, expected exactly 1: re-run tools/unroam.mjs`);
      }
      hits[0].h = mv.to;
      // ☠️ AND ITS FINGERING GOES WITH IT. A finger number is authored against a
      // hand; moving the note and keeping the number teaches the wrong finger,
      // which is worse than teaching none. Codex caught this shipping live.
      delete hits[0].f;
    }
  }
  song.notes.sort((a, b) => (a.h === b.h ? a.b - b.b || a.m - b.m : a.h < b.h ? -1 : 1));
  song.handsRepaired = true;
}

// THE LAST MOMENTS A HAND COULD NOT PLAY. See tools/fix-defects.mjs.
//
// Two kinds, and the first is most of them: a note still SOUNDING from earlier
// while the same hand plays something far away. The pianist's finger left that
// key long ago; only the data said otherwise. Shortening it changes no pitch, no
// hand and no fingering, which is why it is tried first and why it is safe even
// on an arrangement with authored fingering. The rest needed a note moved to the
// other hand, and that is never applied where fingering is authored (law 3).
//
// ☠️ RUNS BEFORE THE FINGERING BELOW. A moved note's finger number belonged to
// the hand it left, so the fingering has to be derived after this, not before.
// KEYS_RAW_FIXED lets tools/fix-defects.mjs read the library WITHOUT its own
// output applied. Without it the tool cannot run once it has written a bad
// file: the library throws on load, so the tool that would correct it cannot
// read the library. Every generated artifact here needs that escape hatch.
const applyFixed = !(typeof process !== 'undefined' && process.env
  && (process.env.KEYS_RAW_HANDS || process.env.KEYS_RAW_FIXED));
for (const song of applyFixed ? SONGS : []) {
  const fix = FIXED[song.id];
  if (!fix) continue;
  if (song.notes.length !== fix.notes) {
    throw new Error(`${song.id} has ${song.notes.length} notes but its defect fix expects ${fix.notes}: re-run tools/fix-defects.mjs`);
  }
  for (const mv of fix.moves ?? []) {
    const hits = song.notes.filter((n) => n.b === mv.b && n.m === mv.m && n.h === mv.from);
    if (hits.length !== 1) throw new Error(`${song.id}: a defect fix matched ${hits.length} notes at beat ${mv.b}, expected exactly 1: re-run tools/fix-defects.mjs`);
    hits[0].h = mv.to;
    delete hits[0].f;              // its finger number belonged to the other hand
  }
  for (const du of fix.durations ?? []) {
    const hits = song.notes.filter((n) => n.b === du.b && n.m === du.m);
    if (hits.length !== 1) throw new Error(`${song.id}: a release matched ${hits.length} notes at beat ${du.b}, expected exactly 1: re-run tools/fix-defects.mjs`);
    hits[0].d = du.d;
  }
  // ☠️ RE-SORT, exactly as the hand-correction block above does. Moving a note
  // between hands breaks the per-hand ordering the app relies on, and the
  // suite caught it immediately: 'gangstas-paradise-hard: notes not sorted for
  // hand R at b=0'. Any pass that changes `h` owes the library this line.
  song.notes.sort((a, b) => (a.h === b.h ? a.b - b.b || a.m - b.m : a.h < b.h ? -1 : 1));
  song.defectsFixed = true;
}

// WHICH FINGER ON WHICH NOTE, for the songs that shipped without any. See
// tools/finger.mjs: derived from the span of the hand, not copied from an
// edition, and gated on re-deriving the scale fingering that WAS verified
// against real sources before it is allowed to write a thing.
//
// ☠️ RUNS LAST, AFTER THE HAND CORRECTIONS AND THEIR RE-SORT. The block above
// re-sorts song.notes, so the authored order a correction sees is NOT the order
// that ships. This artifact is one digit per note in the SHIPPED order, which
// is the order tools/finger.mjs read when it generated them, so it has to be
// applied on the same side of that sort. Moving this above the sort silently
// puts every finger on the wrong note.
//
// Authored fingering always wins: a note that already has one is never touched,
// so this can only ever fill gaps.
const applyFingers = !(typeof process !== 'undefined' && process.env && process.env.KEYS_RAW_FINGERS);
for (const song of applyFingers ? SONGS : []) {
  const fix = FINGERS[song.id];
  if (!fix) continue;
  if (song.notes.length !== fix.n) {
    throw new Error(`${song.id} has ${song.notes.length} notes but its fingering expects ${fix.n}: re-run tools/finger.mjs`);
  }
  song.notes.forEach((n, i) => {
    if (n.f) return;                       // authored fingering is never overwritten
    const f = fix.f.charCodeAt(i) - 48;
    if (f >= 1 && f <= 5) n.f = f;
  });
  song.fingeringDerived = true;
}

// ---- quarantine (Mark, 2026-09-01: "quarantine the unplayable tiers") ------
// The hand audit condemned these tiers as unplayable and their measured reasons
// live in js/songs-quarantine.mjs. They stay in SONGS - tests pin musical facts
// about them, tools regenerate against them, and the data is the recoverable
// artifact - but they are stamped so nothing shows them to a learner.
//
// KEYS_RAW_QUARANTINE lets tools/quarantine.mjs audit the raw library when
// regenerating the list; without it, a quarantine-aware audit would see zero
// findings and regenerate an empty quarantine, silently releasing every tier.
const applyQuarantine = !(typeof process !== 'undefined' && process.env && process.env.KEYS_RAW_QUARANTINE);
for (const song of applyQuarantine ? SONGS : []) {
  const q = QUARANTINE[song.id];
  if (q) song.quarantined = q.why;
}

// ---- free time (council 2026-09-01: tempo/meter gates) ---------------------
// The transcriber emits NO tempo and NO meter, so every machine-transcribed
// song wears an arbitrary 120bpm 4/4 grid. Mark caught it by ear: Married Life
// is a 3/4 waltz shown in fours. Until a song's pulse is confirmed against the
// tempo lane's thresholds (keys-piano-tools/tempo-truth.mjs), its grid must
// not present itself as meter: it is labelled FREE TIME in the app. Relative
// note timing is real (it came from the performance); only the bar-and-count
// story is unearned. Engraved scores and hand-set meters are exempt - their
// meter is a fact, not a default.
// Meter HEARD from the recording (keys-piano-tools/write-meter.mjs) outranks the
// transcriber's 4/4 default. Only songs whose evidence separated clearly appear
// in METER; everything else stays free time, which is the honest state.
for (const song of SONGS) {
  const m = METER[song.group ?? song.id];
  if (m) {
    song.timeSig = [m.meter, 4];
    song.meterVerified = `heard from the recording: ${m.meter}/4, margin ${m.margin}`;
    song.heardBeatBpm = m.beatBpm;
  }
  if (/machine transcription/i.test(song.source || '') && !song.meterVerified) song.freeTime = true;
}

// THE SHELF: what a learner may be offered. The app imports this as its SONGS
// (`import { SHELF as SONGS }`), so every read site - library, tier chips,
// continue cards, paths - inherits the filter from one line. Tools and tests
// keep the full SONGS export on purpose: a quarantined tier is a decision with
// evidence, not deleted music.
export const SHELF = SONGS.filter((s) => !s.quarantined);

export function songEndBeat(song) {
  return Math.max(...song.notes.map((n) => n.b + n.d));
}
