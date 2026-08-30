// IS THE FINGERING THE LEARNER ACTUALLY RECEIVES PLAYABLE BY A HUMAN HAND?
//
// This gate exists for the same reason tools/correction-check.mjs does. On
// 2026-08-30 tools/unroam.mjs reported a clean result while the shipped library
// got something quite different, because the tool read its data off a reordered
// copy and applied it by index. Mark found it by PLAYING. The lesson was not
// "sort more carefully", it was: a tool's own report is an INPUT, and the only
// thing worth checking is the OUTPUT.
//
// js/songs-fingers.mjs is one digit per note, positional, which is exactly the
// shape that failed before. So it is not trusted. This re-imports the SHIPPED
// library and asks the only question that matters: can a hand do this?
//
// ☠️ AND THAT IS PRECISELY WHY A REACHABILITY CHECK IS THE RIGHT ONE. A
// misaligned digit string does not look subtly wrong, it looks like fingers
// scattered at random over the notes, which produces impossible shapes almost
// immediately: a fifth finger below a thumb, or two notes an octave apart under
// fingers 3 and 4. Checking playability catches misalignment as a side effect,
// without ever having to trust the generator.
//
//   node tools/finger-check.mjs
import { SONGS } from '../js/songs.mjs';

// the widest a finger pair can honestly be asked to span, in semitones. These
// are the generous end of tools/finger.mjs's comfort table: this gate is asking
// "is this possible", not "is this comfortable".
const MAX = {
  12: 10, 13: 12, 14: 14, 15: 15,
  23: 6, 24: 8, 25: 10,
  34: 5, 35: 8,
  45: 6,
};
const reach = (fa, fb) => MAX[(fa < fb ? fa : fb) * 10 + (fa < fb ? fb : fa)] ?? 0;

// COULD ANY HAND HOLD THIS CHORD AT ALL? Enumerate every way to put distinct
// fingers on it in pitch order and ask whether one survives.
//
// ☠️ "IS THE OUTER SPAN UNDER 15" IS NOT THE SAME QUESTION, and the difference
// is a whole class of false accusation. A left hand on midi 43, 55, 58 spans 15
// and looks fine by that rule, but the 43-to-55 gap is twelve semitones, which
// only the thumb and the fifth can bridge, and the third note then has nowhere
// to go: no assignment exists. Blaming the fingering for that is blaming it for
// the notes. The enumeration answers the real question and subsumes the width
// rule for free, since a two-note chord spanning 16 fails it automatically.
// ☠️ AND IT MUST KNOW WHICH HAND. The finger reach table is not symmetric under
// the hands: thumb-to-ring spans 14 semitones, pinky-to-index only 10, and they
// are the SAME two fingers seen from opposite ends. In the left hand the thumb
// sits on the TOP note, so ascending pitch takes descending finger numbers.
// Testing a left-hand chord with the right-hand mapping cleared midi 41/53/56
// as holdable (1-4-5 is fine for a right hand) when the left hand must play it
// 5-2-1 and cannot: the 41-to-53 gap is twelve semitones and only the thumb
// reaches that far, but the thumb is already needed on top. Mirroring the
// pitches costs one line and asks the question about the hand that plays it.
const holdable = (pitchesIn, hand) => {
  const pitches = hand === 'L' ? pitchesIn.slice().reverse().map((p) => -p) : pitchesIn;
  const k = pitches.length;
  if (k > 5) return false;
  const walk = (start, acc) => {
    if (acc.length === k) return true;
    for (let f = start; f <= 5 - (k - acc.length - 1); f++) {
      const i = acc.length;
      if (acc.every((g, j) => pitches[i] - pitches[j] <= reach(g, f))) {
        acc.push(f);
        if (walk(f + 1, acc)) return true;
        acc.pop();
      }
    }
    return false;
  };
  return walk(1, []);
};

const bad = [];
const wide = new Set();          // songs whose NOTES no hand can hold, see below
let fingered = 0, total = 0, songsWith = 0;

for (const song of SONGS) {
  if (!song.notes || !song.notes.length) continue;
  const withF = song.notes.filter((n) => n.f).length;
  total += song.notes.length;
  fingered += withF;
  if (withF) songsWith++;
  const say = (msg) => bad.push(`${song.id}: ${msg}`);

  for (const n of song.notes) {
    if (n.f != null && !(Number.isInteger(n.f) && n.f >= 1 && n.f <= 5)) say(`finger ${n.f} is not a finger (beat ${n.b})`);
  }

  for (const hand of ['L', 'R']) {
    const hn = song.notes.filter((n) => n.h === hand && n.f).sort((a, b) => a.b - b.b || a.m - b.m);
    // chords: notes sounding together in one hand
    const chords = [];
    for (const n of hn) {
      const last = chords[chords.length - 1];
      if (last && Math.abs(last[0].b - n.b) < 1e-6) last.push(n);
      else chords.push([n]);
    }
    for (const chord of chords) {
      // ☠️ A CHORD IS CONDEMNED WHOLE, NOT PAIR BY PAIR. Skipping only the one
      // pair that exceeds the hand still blames the fingering for every OTHER
      // pair of the same impossible chord: beat 2 of gangstas-paradise holds
      // midi 68, 72 and 84 in the right hand, 16 semitones. Excusing 68-84 and
      // then reporting "fingers 2 and 5 span 12" for 72-84 is blaming the
      // fingering for a defect in the notes. If no hand can hold the chord,
      // nothing inside it is the fingering's fault.
      if (!holdable(chord.map((n) => n.m), hand)) { wide.add(song.id); continue; }
      for (let i = 0; i < chord.length; i++) for (let j = i + 1; j < chord.length; j++) {
        const lo = chord[i], hi = chord[j];
        if (lo.f === hi.f) { say(`finger ${lo.f} on two notes at once (beat ${lo.b})`); continue; }
        // in one hand the higher note must take the higher-numbered finger in
        // the right hand, and the lower-numbered one in the left. A violation
        // means the hand is crossed over itself, which is the signature of a
        // digit string that has slipped against its notes.
        const ordered = hand === 'R' ? hi.f > lo.f : hi.f < lo.f;
        if (!ordered) say(`fingers cross inside one hand at beat ${lo.b} (${lo.m}=${lo.f}, ${hi.m}=${hi.f})`);
        if (hi.m - lo.m > reach(lo.f, hi.f)) {
          say(`fingers ${lo.f} and ${hi.f} asked to span ${hi.m - lo.m} semitones at beat ${lo.b}`);
        }
      }
    }
  }
}

const pct = total ? Math.round((fingered / total) * 100) : 0;
console.log(`${songsWith} of ${SONGS.filter((s) => s.notes && s.notes.length).length} songs carry fingering`);
console.log(`${fingered} of ${total} notes fingered (${pct}%)`);

// every song the learner can open should be able to teach hand position
const none = SONGS.filter((s) => s.notes && s.notes.length && !s.notes.some((n) => n.f));
if (none.length) {
  console.log(`\n${none.length} songs still carry NO fingering at all:`);
  for (const s of none.slice(0, 20)) console.log(`  ${s.id}`);
}

if (wide.size) {
  console.log(`\n${wide.size} songs ask ONE HAND to hold notes no hand can hold at once.`);
  console.log('No fingering fixes these: the hand assignment is wrong, not the fingers.');
  console.log('This is the fault Mark reported by ear ("the notes were way too far apart"),');
  console.log('and it is a separate job from fingering. Listed so it is not mistaken for one.');
  for (const id of [...wide].slice(0, 12)) console.log(`  ${id}`);
}

if (bad.length) {
  console.log(`\n${bad.length} unplayable fingerings in the SHIPPED library:`);
  for (const b of bad.slice(0, 25)) console.log('  ' + b);
  console.log('\nA hand cannot do this. Re-run tools/finger.mjs and check the digit');
  console.log('string is still aligned to the notes it was generated against.');
  process.exit(1);
}
if (none.length) {
  console.log('\nFingering is missing, not wrong. Mark asked for it in every zone.');
  process.exit(1);
}
console.log('\nevery fingering in the shipped library is reachable by a human hand');
