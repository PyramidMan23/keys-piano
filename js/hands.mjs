// WHICH HAND PLAYS WHICH NOTE.
//
// Mark, 2026-08-30: "if this is wrong this will teach me the songs wrong."
// He is right, and a lot of the library was wrong. An audit of all 128 songs
// found 24 where one hand leaps more than two octaves inside a single beat and
// 20 where one hand is asked to span up to 29 semitones AT ONCE. The per-hand
// pitch ranges give the cause away: `interstellar` had left F1-B2 and right
// C3-E7, and `in-the-end` left C2-E3 and right D3-B5. That is a PITCH
// THRESHOLD, not an arrangement. Everything above a fixed line was called
// "right hand", so the right hand inherited the melody AND the inner voices and
// became unplayable by any human.
//
// This module re-derives the hand for a song that fails that test. It does NOT
// touch a song that passes: Fur Elise is correctly arranged and stays exactly
// as curated. The repair is only ever applied to data that is already broken,
// so it can only be an improvement.
//
// The model: a real pianist keeps each hand roughly where it was and takes the
// notes nearest it. So we walk the song in time, hold a running position for
// each hand, and for every group of simultaneous notes choose the split that is
// cheapest to actually play.

export const SPAN_OK = 12;        // an octave: comfortable for an adult hand
export const SPAN_STRETCH = 14;   // a ninth: reachable, penalised
export const SPAN_MAX = 16;       // a tenth. An eleventh is not a chord, it is two hands.
// TRAVEL, NOT LEAP SIZE. The first version of this rule said "more than two
// octaves inside one beat", which ignores tempo: at 63bpm a beat is 950ms and a
// hand crosses two octaves in that comfortably, so the rule condemned playable
// music. What no hand does is COVER GROUND FAST. 120 semitones per second is
// two octaves in 200ms, which is already at the limit of a trained player.
export const TRAVEL_MAX = 120;    // semitones per second

const centre = (sorted) => (sorted[0] + sorted[sorted.length - 1]) / 2;
const span = (sorted) => (sorted.length ? sorted[sorted.length - 1] - sorted[0] : 0);

// Is this song's hand assignment physically playable? The same test the audit
// tool uses, so "repaired" and "passes the gate" cannot drift apart.
// `fromScore` matters. When the hands came off an engraved score's own staves,
// the score is ground truth and a wide span is not a defect: Romantic piano is
// full of chords wider than a hand, written to be ROLLED under the pedal, and
// Chopin's left hand in the Op.9 nocturne does exactly that. Refusing Clair de
// Lune because Debussy wrote a tenth is the tool overruling the composer. What
// still fails even from a score is a physical impossibility: crossed hands
// (which would mean we mis-read the staves) and a hand asked to cover ground
// faster than a hand moves. Derived hands get the strict rule, because there we
// ARE guessing and a wide span is the signature of guessing wrong.
export function handsAreSane(notes, bpm = 100, fromScore = false) {
  const byBeat = new Map();
  for (const n of notes) {
    const k = Math.round(n.b * 1000) / 1000;
    if (!byBeat.has(k)) byBeat.set(k, []);
    byBeat.get(k).push(n);
  }
  for (const group of byBeat.values()) {
    const l = group.filter((n) => n.h === 'L').map((n) => n.m).sort((a, b) => a - b);
    const r = group.filter((n) => n.h === 'R').map((n) => n.m).sort((a, b) => a - b);
    if (l.length && r.length && r[0] < l[l.length - 1]) return false;   // crossed
    if (!fromScore && (span(l) > SPAN_MAX || span(r) > SPAN_MAX)) return false;   // unreachable chord
  }
  for (const h of ['L', 'R']) {
    const line = notes.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
    for (let i = 1; i < line.length; i++) {
      const secs = (line[i].b - line[i - 1].b) * 60 / bpm;
      if (secs <= 0) continue;
      if (Math.abs(line[i].m - line[i - 1].m) / secs > TRAVEL_MAX) return false;
    }
  }
  return true;
}

// Re-derive `h` for every note, in place. Returns the notes.
export function repairHands(notes, bpm = 100) {
  if (!notes.length) return notes;

  const byBeat = new Map();
  for (const n of notes) {
    const k = Math.round(n.b * 1000) / 1000;
    if (!byBeat.has(k)) byBeat.set(k, []);
    byBeat.get(k).push(n);
  }
  const beats = [...byBeat.keys()].sort((a, b) => a - b);

  // Seed each hand in the register it will actually live in, or the first group
  // decides everything by a coin toss and the whole song inherits it.
  const all = notes.map((n) => n.m).sort((a, b) => a - b);
  let lPos = all[Math.floor(all.length * 0.15)];
  let rPos = all[Math.floor(all.length * 0.85)];
  if (rPos - lPos < 6) { lPos -= 6; rPos += 6; }   // a one-register song still has two hands

  // Notes still SOUNDING occupy the hand that struck them, so they count
  // towards its reach. This is the cheap half of voice tracking: it stops a
  // hand being handed a chord it is already holding something outside of.
  let held = [];   // { m, until, h }
  let lastBeat = null;

  for (const beat of beats) {
    held = held.filter((x) => x.until > beat + 1e-6);
    const group = byBeat.get(beat).slice().sort((a, b) => a.m - b.m);
    const pitches = group.map((n) => n.m);
    const dt = lastBeat === null ? Infinity : beat - lastBeat;
    const heldOf = (h) => held.filter((x) => x.h === h).map((x) => x.m);

    let best = null;
    for (let k = 0; k <= group.length; k++) {
      const L = pitches.slice(0, k), R = pitches.slice(k);
      let cost = 0;
      for (const [arr, pos, hand] of [[L, lPos, 'L'], [R, rPos, 'R']]) {
        if (!arr.length) continue;
        // reach, counting anything this hand is still holding down
        const reach = [...arr, ...heldOf(hand)].sort((a, b) => a - b);
        const sp = span(reach);
        if (sp > SPAN_MAX) cost += 4000 + (sp - SPAN_MAX) * 200;
        else if (sp > SPAN_STRETCH) cost += 400 + (sp - SPAN_STRETCH) * 60;
        else if (sp > SPAN_OK) cost += (sp - SPAN_OK) * 10;
        // stay where you are
        const move = Math.abs(centre(arr) - pos);
        cost += move;
        const secs = dt * 60 / bpm;
        if (secs > 0 && secs < 9 && move / secs > TRAVEL_MAX) cost += 3000 + (move / secs - TRAVEL_MAX) * 20;
      }
      // one idle hand is a single line and perfectly normal; both idle is not
      if (!L.length && !R.length) cost += 1e9;
      if (best === null || cost < best.cost) best = { k, cost };
    }

    group.forEach((n, i) => { n.h = i < best.k ? 'L' : 'R'; });
    const L = pitches.slice(0, best.k), R = pitches.slice(best.k);
    if (L.length) lPos = centre(L);
    if (R.length) rPos = centre(R);
    for (const n of group) held.push({ m: n.m, until: n.b + (n.d || 0), h: n.h });
    lastBeat = beat;
  }
  return notes;
}

// Repair a whole library, but ONLY the songs that are already broken.
// Returns the ids it had to touch, so a build can report them rather than
// quietly laundering bad data.
export function repairLibrary(songs) {
  const repaired = [];
  for (const song of songs) {
    if (!song?.notes?.length) continue;
    if (handsAreSane(song.notes, song.bpm || 100)) continue;
    repairHands(song.notes, song.bpm || 100);
    repaired.push(song.id);
  }
  return repaired;
}
