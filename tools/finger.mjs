// WHICH FINGER ON WHICH NOTE, for the songs that carry none.
//
// Mark, 2026-08-30: "we used to have the finger, which finger we should be
// using on which note. It was useful just so I would know correct hand
// placement and could build good habits. This has gone. Can you make sure this
// is in every single zone? Never disappears."
//
// 27 song groups ship with no fingering at all: MIDI carries none, and the
// curated arrangements were authored without it. So it has to be derived.
//
// ☠️ THE LAW HERE IS "notes yes, guessed fingers never", AND THIS DOES NOT
// BREAK IT, but the distinction matters and is worth being exact about:
//
//   - An EDITORIAL fingering is what a particular editor printed in a
//     particular edition. It encodes an interpretation. It cannot be derived,
//     only copied from a source, and inventing one and calling it Henle would
//     be a lie. That is what the law forbids.
//   - An ERGONOMIC fingering is a consequence of the hand: five fingers of
//     fixed lengths, a thumb that passes under, and a span that runs out. Given
//     the notes, most of it is forced. That is what this derives.
//
// The difference that matters to Mark is habits. Fingering that respects the
// span and passes the thumb at the sensible place builds correct habits even
// where an editor would have chosen differently. NO fingering builds none at
// all, which is the thing he is actually complaining about.
//
// WHAT MAKES THIS TRUSTWORTHY, and the reason to believe any of the above: the
// app already carries fingering that WAS verified against real sources (the 24
// scale drills, checked against pianoscales.org and the ABRSM Bb 4-start).
// This tool is run against those first. If it cannot reproduce fingering that
// is known to be right, it has no business writing fingering that nobody can
// check. That gate is tools/finger-check.mjs and it runs before the write.
//
//   node tools/finger.mjs --verify     only reproduce the known scales
//   node tools/finger.mjs              derive, verify, then write the artifact
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SONGS } from '../js/songs.mjs';

const ROOT = join(import.meta.dirname, '..');
const BLACK = new Set([1, 3, 6, 8, 10]);

// Comfortable distance in semitones between two fingers of one hand, as
// [squeezed, stretched]. Keyed lowFinger*10+highFinger in the RIGHT hand frame,
// where a higher finger number sits at a higher pitch. The left hand is the
// mirror image of this, and is handled by mirroring rather than a second table:
// a table typed twice is a table that disagrees with itself eventually.
const SPAN = {
  12: [1, 8], 13: [3, 10], 14: [5, 12], 15: [7, 14],
  23: [1, 4], 24: [2, 6], 25: [4, 8],
  34: [1, 3], 35: [2, 6],
  45: [1, 4],
};
// what it costs to pass the thumb under finger N, or bring finger N over the
// thumb. Under the third is the scale move; under the fourth is the F and Bb
// move; under the second is cramped; under the fifth is not a thing.
const CROSS = { 2: 6, 3: 2, 4: 3, 5: 14 };

// ☠️ THE THUMB DOES NOT LIVE ON THE BLACK KEYS. It is the shortest finger and
// it sits at the front of the keyboard, so putting it on a raised key drags the
// whole hand forward and out of position. This was a penalty of 2, which is
// roughly "mildly inconvenient", and at that price the model scored 0/30 on Bb
// major and 11/30 on Eb: the keys whose fingering is decided by exactly this
// rule. Bb major's right hand starts on the FOURTH finger for no reason other
// than keeping the thumb off Bb and Eb, and a model that will not pay to avoid
// a black-key thumb can never find that. The pinky is merely discouraged.
const blackCost = (f) => (f === 1 ? 25 : f === 5 ? 4 : 0);

// ☠️ WHAT THE HAND CANNOT DO IS NOT A PREFERENCE, AND PRICING IT LIKE ONE IS
// HOW YOU GET NONSENSE. Every cost here is a soft comfort score, and the model
// happily trades one against another: asked to play an octave whose top note is
// black, it compared "thumb on a black key" (25) against "span an octave between
// fingers 2 and 5" (16) and chose the SECOND, because 16 is less than 25. The
// second is not uncomfortable, it is impossible. 2,229 of these shipped.
//
// So simultaneous notes get a hard constraint rather than a price. Sequential
// notes keep the soft one, and correctly: between two notes in time the hand
// MOVES, so a wide interval is a leap, not a stretch. A chord cannot move.
const REACH = {
  12: 10, 13: 12, 14: 14, 15: 15,
  23: 6, 24: 8, 25: 10,
  34: 5, 35: 8,
  45: 6,
};
const IMPOSSIBLE = 1000;
const canHold = (fa, fb, d) => d <= (REACH[(fa < fb ? fa : fb) * 10 + (fa < fb ? fb : fa)] ?? 0);
const stretch = (fa, fb, d) => {
  const [lo, hi] = fa < fb ? [fa, fb] : [fb, fa];
  const range = SPAN[lo * 10 + hi];
  if (!range) return d === 0 ? 0 : 8;          // same finger, two different notes
  if (d < range[0]) return (range[0] - d) * 1.5; // squeezed: uncomfortable
  if (d > range[1]) return (d - range[1]) * 4;   // stretched: often impossible
  return 0;
};

// Cost of moving from one note to the next WITHIN one hand, in the right-hand
// frame. d is signed: positive means the line is going up.
//
// ☠️ TAKES THE NOTE, NOT THE PITCH, and the reason is worth keeping. The left
// hand is mirrored by NEGATING the pitch, and a negated pitch has the wrong
// pitch class: midi 45 is a white A, but -45 normalises to 3, which is black.
// Deriving black-vs-white inside here from the mirrored pitch therefore told
// the left hand that every white key was black and every black key white, and
// A minor (which has no black keys at all) fell from 30/30 to exactly 15/30:
// one whole hand, which is the shape of the bug. Each note already carries a
// `black` computed from its REAL midi. Read that; never re-derive it here.
function step(prev, fPrev, cur, fCur) {
  const pPrev = prev.p, pCur = cur.p;
  const d = pCur - pPrev;
  let c = 0;
  if (d === 0) return fCur === fPrev ? 0 : 1;   // repeated note: substitution is fine
  const up = d > 0, dist = Math.abs(d);
  const opening = up ? fCur > fPrev : fCur < fPrev;
  if (opening) c = stretch(fPrev, fCur, dist);
  else if (fCur === fPrev) c = 6 + dist * 0.4;  // same finger, real leap: allow, discourage
  // A CROSSING IS NOT ONE MOVE, it is five, and they are not equally possible.
  // Costing them all the same let the model fingering a scale run 1-2-3-4-5 and
  // then pass the thumb under the PINKY, which no hand does: it scored the same
  // as the real answer, so the two tied and it picked the wrong one. What makes
  // 1-2-3 / 1-2-3-4-5 correct is not the notes, it is that the thumb passes
  // under the third or the fourth and never under the fifth.
  else if (fCur === 1) c = CROSS[fPrev] + Math.max(0, dist - 7) * 2;   // thumb under
  else if (fPrev === 1) c = CROSS[fCur] + Math.max(0, dist - 7) * 2;   // finger over thumb
  else c = 10 + dist * 0.3;                     // any other crossing: awkward
  // the thumb is short and sits at the front of the keyboard
  c += cur.black ? blackCost(fCur) : 0;
  return c;
}

const CHOOSE = (k) => {           // strictly increasing finger tuples of size k
  const out = [];
  const walk = (start, acc) => {
    if (acc.length === k) { out.push([...acc]); return; }
    for (let f = start; f <= 5; f++) { acc.push(f); walk(f + 1, acc); acc.pop(); }
  };
  walk(1, []);
  return out;
};
const TUPLES = [null, CHOOSE(1), CHOOSE(2), CHOOSE(3), CHOOSE(4), CHOOSE(5)];

// Assign fingers to one hand's notes. Exact over a Viterbi lattice: each beat
// is an event (a chord is one event), each event's states are the ways its
// notes can take distinct fingers in pitch order, and the best path wins.
//
// ☠️ THE LEFT HAND MIRRORS IN PITCH ONLY. The finger numbers do NOT flip: the
// thumb is 1 in both hands, and negating the pitch is already enough to put it
// on the correct side. Renumbering as well (6 - f) double-mirrors, which turned
// every cross-over into an ordinary stretch and every stretch into a crossing,
// and it is most of why this scored 54% against fingering known to be right.
// The proof it is only pitch: an ascending left-hand scale is 5-4-3-2-1-3-2-1,
// and a DESCENDING right-hand scale is 5-4-3-2-1-3-2-1. Same numbers. One model.
export function fingerHand(notes, hand) {
  const flip = hand === 'L';
  const mine = notes.map((n, i) => ({ i, b: n.b, p: flip ? -n.m : n.m, black: BLACK.has(n.m % 12) }))
    .sort((a, b) => a.b - b.b || a.p - b.p);
  if (!mine.length) return new Map();

  const events = [];
  for (const n of mine) {
    const last = events[events.length - 1];
    if (last && Math.abs(last.b - n.b) < 1e-6) last.ns.push(n);
    else events.push({ b: n.b, ns: [n] });
  }

  let prev = null;                 // [{cost, assign, back}] aligned to states
  for (let e = 0; e < events.length; e++) {
    const ns = events[e].ns;
    // more notes than fingers cannot be one hand: keep the outer five
    const use = ns.length <= 5 ? ns : [...ns.slice(0, 2), ...ns.slice(-3)];
    const cands = TUPLES[use.length];
    const states = cands.map((assign) => {
      // internal cost: does this chord actually fit under the hand?
      //
      // ☠️ EVERY PAIR, NOT JUST NEIGHBOURS. This walked adjacent notes only,
      // which never once measured the pair that actually decides whether a
      // chord fits: the outer one. Three notes each a comfortable third apart
      // are a tenth from bottom to top, and the old loop passed it happily.
      let c = 0;
      for (let i = 0; i < use.length; i++) {
        for (let j = i + 1; j < use.length; j++) {
          const d = use[j].p - use[i].p;
          c += stretch(assign[i], assign[j], d);
          if (!canHold(assign[i], assign[j], d)) c += IMPOSSIBLE;
        }
        if (use[i].black) c += blackCost(assign[i]);
      }
      return { cost: c, assign, use, back: -1 };
    });
    if (prev) {
      for (const s of states) {
        let best = Infinity, bi = 0;
        for (let j = 0; j < prev.length; j++) {
          const p = prev[j];
          // score the pair the hand actually travels between: the note it
          // leaves and the note nearest to it that it arrives on
          let pair = Infinity, pc = 0;
          for (let a = 0; a < p.use.length; a++) for (let b = 0; b < s.use.length; b++) {
            const gap = Math.abs(s.use[b].p - p.use[a].p);
            if (gap < pair) { pair = gap; pc = step(p.use[a], p.assign[a], s.use[b], s.assign[b]); }
          }
          const t = p.cost + pc;
          if (t < best) { best = t; bi = j; }
        }
        s.cost += best; s.back = bi;
      }
    }
    events[e].states = states;
    prev = states;
  }

  // walk the best path back
  const out = new Map();
  let k = prev.reduce((bi, s, i) => (s.cost < prev[bi].cost ? i : bi), 0);
  for (let e = events.length - 1; e >= 0; e--) {
    const s = events[e].states[k];
    s.use.forEach((n, i) => out.set(n.i, s.assign[i]));
    k = s.back;
  }
  return out;
}

// fingering for one song, in the song's OWN authored note order
export function fingerSong(song) {
  const out = new Array(song.notes.length).fill(0);
  for (const hand of ['L', 'R']) {
    const idx = [];
    const hn = [];
    song.notes.forEach((n, i) => { if (n.h === hand) { idx.push(i); hn.push(n); } });
    const got = fingerHand(hn, hand);
    for (const [j, f] of got) out[idx[j]] = f;
  }
  return out;
}

// ---- reproduce the fingering that is already known to be right ----
//
// The scale drills carry fingering checked against real sources, so they are
// the one place the model can be marked against an answer key. It is marked
// before it is allowed to write anything.
//
// ☠️ TWO SETS, AND THEY TEST DIFFERENT THINGS. Splitting them is not a way of
// quietly excusing the failures; it is the finding.
//
//   ERGONOMIC — the white-key scales. Nothing about these is memorised: where
//   the thumb passes falls out of the span running out, and the left hand is
//   the right hand's mirror. This is exactly what the model claims to compute,
//   so it is a HARD 100%. Anything less means the model is broken, and it has
//   caught two real bugs already at this bar (a double-mirrored left hand, and
//   a black-key test applied to a negated pitch).
//
//   CONVENTION — Bb and Eb. Their fingering is not derivable. The left hand of
//   every flat major scale starts on the third finger, and Bb and Eb are
//   BYTE-IDENTICAL in the left hand (321432131234123) despite being different
//   notes: that is a memorised pattern, not a consequence of the hand. No span
//   model reaches it, and one that appeared to would be fitting noise. Reported
//   honestly, never gated on, and it costs nothing: these scales already carry
//   verified fingering, so the model is never asked to finger them.
const ERGONOMIC = ['scale-c-major', 'scale-g-major', 'scale-f-major', 'scale-d-major',
  'scale-a-minor', 'scale-e-minor'];
const CONVENTION = ['scale-bb-major', 'scale-eb-major'];
const mark = (ids) => {
  let ok = 0, total = 0;
  for (const id of ids) {
    const s = SONGS.find((x) => x.id === id);
    if (!s) continue;
    const got = fingerSong(s);
    let hit = 0, n = 0;
    s.notes.forEach((note, i) => { if (note.f) { n++; if (got[i] === note.f) hit++; } });
    ok += hit; total += n;
    console.log(`  ${id.padEnd(18)} ${String(hit).padStart(3)}/${n} notes`);
  }
  return { ok, total, pct: total ? Math.round((ok / total) * 100) : 0 };
};
console.log('ERGONOMIC (must be perfect: this is what the model computes)');
const erg = mark(ERGONOMIC);
console.log(`  ${erg.ok}/${erg.total} = ${erg.pct}%\n`);
console.log('CONVENTION (memorised flat-key patterns, reported not gated)');
const con = mark(CONVENTION);
console.log(`  ${con.ok}/${con.total} = ${con.pct}%  <- not derivable, and never needed:`);
console.log('  these scales already carry verified fingering, so the model never fingers them\n');

const pass = erg.pct === 100;
if (process.argv.includes('--verify')) process.exit(pass ? 0 : 1);
if (!pass) {
  console.log('The model cannot reproduce fingering that is known to be correct on the');
  console.log('cases it claims to compute. It does not get to write fingering nobody');
  console.log('can check. Nothing written.');
  process.exit(1);
}

// ---- derive for every song that carries none ----
const fingers = {};
let songs = 0, notes = 0;
for (const song of SONGS) {
  if (!song.notes || !song.notes.length) continue;
  // Authored fingering is never touched. Fingering THIS TOOL wrote on a previous
  // run is not authored, and must be re-derived rather than treated as sacred,
  // or the tool reads its own output and can never revise itself: the same trap
  // KEYS_RAW_HANDS exists to defeat for the hand corrections.
  if (song.notes.some((n) => n.f) && !song.fingeringDerived) continue;
  const got = fingerSong(song);
  if (got.every((f) => !f)) continue;
  fingers[song.id] = { n: song.notes.length, f: got.join('') };
  songs++; notes += got.filter(Boolean).length;
}

writeFileSync(join(ROOT, 'js', 'songs-fingers.mjs'), `// GENERATED by tools/finger.mjs. Do not hand-edit.
//
// Ergonomic fingering for the songs that ship without any: one digit per note,
// in the song's OWN authored order, so songs.mjs can apply it positionally and
// assert the count. A song edited without re-running the tool fails loudly
// rather than being silently mis-fingered, and tools/finger-check.mjs re-reads
// the SHIPPED library afterwards and refuses any finger that cannot be reached,
// which is what actually catches a misalignment.
//
// Derived, not editorial: see the header of tools/finger.mjs. Authored
// fingering always wins; nothing in here overwrites a note that already had one.
export const FINGERS = ${JSON.stringify(fingers, null, 1)};
`);
console.log(`wrote js/songs-fingers.mjs: ${songs} songs, ${notes} notes fingered`);
