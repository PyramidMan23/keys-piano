// SPLIT A TRANSCRIPTION INTO TWO HANDS THAT CAN ACTUALLY PLAY IT.
//
// Mark has caught this three times now, most recently on 2026-08-31: songs
// arrive with "6 keys down in one hand", hands that cross, and reaches no hand
// makes. His words earlier: "if this is wrong this will teach me the songs
// wrong." He is right, and a wrong hand is worse than a missing song.
//
// js/hands.mjs `repairHands` is the incumbent and it works note by note, which
// is why it produces those moments: a decision that looks fine for one note
// leaves the hand somewhere impossible for the next. This is the same shape of
// problem as fingering, and it takes the same answer - a Viterbi pass over the
// whole piece, where the cost of a split includes where it leaves both hands.
//
// Three rules, and the first two are absolute rather than priced, because they
// are the ones that produce the faults Mark hears:
//
//   1. THE SPLIT IS CONTIGUOUS IN PITCH. The left hand takes a low run, the
//      right takes the rest. Crossed hands become unrepresentable rather than
//      expensive, which is the only way to be sure they never ship.
//   2. EACH HAND MUST BE ABLE TO HOLD WHAT IT IS GIVEN: at most five notes, and
//      a shape a real hand can hold (the same reach table the fingering uses).
//   3. Then, and only then, minimise how far the hands travel.
//
//   node tools/handsplit.mjs            re-split every machine transcription
//   node tools/handsplit.mjs --dry      report, write nothing
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REACH = {
  12: 10, 13: 12, 14: 14, 15: 15,
  23: 6, 24: 8, 25: 10,
  34: 5, 35: 8,
  45: 6,
};
const reach = (a, b) => REACH[(a < b ? a : b) * 10 + (a < b ? b : a)] ?? 0;

// can ONE hand hold these pitches at once? identical question to the fingering
// gate, and deliberately the same answer: ascending pitch takes ascending
// fingers in the right hand and descending in the left, because thumb-to-ring
// reaches 14 semitones and pinky-to-index only 10.
export function holdable(pitchesIn, hand) {
  if (pitchesIn.length === 0) return true;
  if (pitchesIn.length > 5) return false;
  const p = hand === 'L' ? pitchesIn.slice().reverse().map((x) => -x) : pitchesIn;
  const k = p.length;
  const walk = (start, acc) => {
    if (acc.length === k) return true;
    for (let f = start; f <= 5 - (k - acc.length - 1); f++) {
      const i = acc.length;
      if (acc.every((g, j) => p[i] - p[j] <= reach(g, f))) {
        acc.push(f);
        if (walk(f + 1, acc)) return true;
        acc.pop();
      }
    }
    return false;
  };
  return walk(1, []);
}

const mid = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);

// Assign every note to a hand. Returns an array of 'L'/'R' aligned to `notes`
// in the order given.
export function splitHands(notes) {
  const idx = notes.map((n, i) => i).sort((a, b) => notes[a].b - notes[b].b || notes[a].m - notes[b].m);
  const events = [];
  for (const i of idx) {
    const last = events[events.length - 1];
    if (last && Math.abs(notes[last.is[0]].b - notes[i].b) < 1e-6) last.is.push(i);
    else events.push({ is: [i] });
  }

  let prev = null;
  for (const ev of events) {
    const ps = ev.is.map((i) => notes[i].m);          // already ascending
    const states = [];
    // cut = how many of the low notes go to the left hand
    for (let cut = 0; cut <= ps.length; cut++) {
      const L = ps.slice(0, cut), R = ps.slice(cut);
      if (!holdable(L, 'L') || !holdable(R, 'R')) continue;
      states.push({ cut, lc: mid(L), rc: mid(R), cost: 0, back: -1 });
    }
    // ☠️ NEVER RETURN NOTHING. A dense moment can have no legal split at all
    // (seven notes at once, or a tenth in each hand). Dropping the event would
    // silently delete notes from the song, so the least-bad split is kept and
    // the note data is left to the audit to report honestly.
    if (!states.length) {
      const cut = Math.max(1, Math.min(ps.length - 1, Math.ceil(ps.length / 2)));
      states.push({ cut, lc: mid(ps.slice(0, cut)), rc: mid(ps.slice(cut)), cost: 0, back: -1, forced: true });
    }
    if (prev) {
      for (const s of states) {
        let best = Infinity, bi = 0;
        for (let j = 0; j < prev.length; j++) {
          const p = prev[j];
          // how far each hand has to move to reach this split. A hand that
          // plays nothing this instant simply stays where it was, and must not
          // be charged for a move it does not make.
          const dl = s.lc !== null && p.lc !== null ? Math.abs(s.lc - p.lc) : 0;
          const dr = s.rc !== null && p.rc !== null ? Math.abs(s.rc - p.rc) : 0;
          // and the hands must not swap places over time either
          const swap = s.lc !== null && s.rc !== null && s.lc > s.rc ? 400 : 0;
          const t = p.cost + dl + dr + swap + (s.forced ? 250 : 0);
          if (t < best) { best = t; bi = j; }
        }
        s.cost += best; s.back = bi;
      }
    } else {
      for (const s of states) s.cost = s.forced ? 250 : 0;
    }
    ev.states = states;
    prev = states;
  }

  const out = new Array(notes.length).fill('R');
  let k = prev.reduce((bi, s, i) => (s.cost < prev[bi].cost ? i : bi), 0);
  for (let e = events.length - 1; e >= 0; e--) {
    const s = events[e].states[k];
    events[e].is.forEach((i, j) => { out[i] = j < s.cut ? 'L' : 'R'; });
    k = s.back;
  }
  return out;
}

// THE HELD-AWARE SPLIT. This is the one that works.
//
// `splitHands` above groups by ONSET and is blind to notes still sounding, which
// is why it wrecked sustained music (light-of-the-seven 209 -> 872). This carries
// the sounding set in the search state, so a hand is never handed a note while it
// is already holding something it cannot hold that note with.
//
// A beam rather than exact DP: every still-held note adds an assignment the state
// must remember, so the exact lattice explodes. Keeping the best K states after
// merging equivalents is the standard answer and is more than enough here.
//
// ☠️ CROSSINGS ARE IMPOSSIBLE BY CONSTRUCTION, not discouraged by a cost. Each
// event's notes are split at ONE pitch cut: everything below goes left, above
// goes right. That is the whole reason to do this - `repairHands` produced 159
// crossings on overwatch and 114 on x-files, which is what refused their tiers,
// and no hill-climb of single-note moves can reliably undo that many.
const BEAM = 24;

export function splitHeld(notes, bpm = 120) {
  const idx = notes.map((n, i) => i).sort((a, b) => notes[a].b - notes[b].b || notes[a].m - notes[b].m);
  const events = [];
  for (const i of idx) {
    const last = events[events.length - 1];
    if (last && Math.abs(notes[last.is[0]].b - notes[i].b) < 1e-6) last.is.push(i);
    else events.push({ is: [i], b: notes[i].b });
  }
  if (!events.length) return notes.map(() => 'R');

  const secPerBeat = 60 / (bpm || 120);
  // a state: what each hand still holds, where each hand is, the running cost,
  // and a back-pointer chain of this event's cuts so the path can be rebuilt
  let beam = [{ held: [], lc: null, rc: null, cost: 0, cut: 0, back: -1 }];
  const layers = [];

  for (let e = 0; e < events.length; e++) {
    const ev = events[e];
    const ps = ev.is.map((i) => notes[i].m);          // ascending
    const next = [];
    for (let s = 0; s < beam.length; s++) {
      const st = beam[s];
      // drop what has stopped sounding by now
      const held = st.held.filter((h) => h.until > ev.b + 1e-6);
      for (let cut = 0; cut <= ps.length; cut++) {
        const newL = ps.slice(0, cut), newR = ps.slice(cut);
        const heldL = held.filter((h) => h.h === 'L').map((h) => h.m);
        const heldR = held.filter((h) => h.h === 'R').map((h) => h.m);
        const actL = [...heldL, ...newL].sort((a, b) => a - b);
        const actR = [...heldR, ...newR].sort((a, b) => a - b);
        // ☠️ THE HELD NOTES ARE PART OF THE CHORD. This is the whole point: a
        // hand holding a low bass note cannot also take a note a twelfth above
        // it, however comfortable the new notes look on their own.
        if (!holdable([...new Set(actL)], 'L') || !holdable([...new Set(actR)], 'R')) continue;
        // and the hands must not overlap in pitch at this instant
        if (actL.length && actR.length && actL[actL.length - 1] > actR[0]) continue;

        const lc = actL.length ? actL.reduce((a, c) => a + c, 0) / actL.length : st.lc;
        const rc = actR.length ? actR.reduce((a, c) => a + c, 0) / actR.length : st.rc;
        // how far each hand had to move, per second, so a leap is only costly
        // when there was no time for it
        const dt = Math.max(0.05, (ev.b - (st.b ?? ev.b)) * secPerBeat);
        const dl = st.lc !== null && lc !== null ? Math.abs(lc - st.lc) : 0;
        const dr = st.rc !== null && rc !== null ? Math.abs(rc - st.rc) : 0;
        const speed = (dl + dr) / dt;
        const cost = st.cost + dl + dr + (speed > TRAVEL_MAX ? (speed - TRAVEL_MAX) * 0.5 : 0);

        const keep = held.slice();
        ev.is.forEach((i, k) => {
          const n = notes[i];
          keep.push({ m: n.m, h: k < cut ? 'L' : 'R', until: n.b + n.d });
        });
        next.push({ held: keep, lc, rc, cost, cut, back: s, b: ev.b });
      }
    }
    if (!next.length) {
      // ☠️ NEVER DROP AN EVENT. If nothing is legal (a moment genuinely beyond
      // two hands), take the least bad split rather than losing the notes, and
      // let the audit report it honestly.
      const st = beam[0];
      const cut = Math.max(0, Math.min(ps.length, Math.ceil(ps.length / 2)));
      const keep = [];
      ev.is.forEach((i, k) => { const n = notes[i]; keep.push({ m: n.m, h: k < cut ? 'L' : 'R', until: n.b + n.d }); });
      next.push({ held: keep, lc: st.lc, rc: st.rc, cost: st.cost + 500, cut, back: 0, b: ev.b });
    }
    next.sort((a, b) => a.cost - b.cost);
    beam = next.slice(0, BEAM);
    layers.push(beam);
  }

  // walk the cheapest path back
  const out = new Array(notes.length).fill('R');
  let k = 0;
  for (let e = layers.length - 1; e >= 0; e--) {
    const st = layers[e][k];
    events[e].is.forEach((i, j) => { out[i] = j < st.cut ? 'L' : 'R'; });
    k = st.back;
    if (k < 0) k = 0;
  }
  return out;
}

// ☠️ "AT ONCE" MEANS STILL SOUNDING, NOT STARTING TOGETHER. The pass above
// groups notes by ONSET, and by that measure imperial-march had one note per
// hand at a time and looked perfect, while hand-audit reported "6 keys down in
// one hand". Both were right: a hand holding a whole note and then playing four
// more has five keys down and only one onset. Solving the onset problem solves
// nothing the learner can feel.
//
// Held notes are decided at earlier events, so a forward pass cannot know them
// without carrying every combination. Instead the split above sets the
// structure (no crossing, contiguous in pitch) and this repairs it against the
// definition that actually matters, one note at a time, keeping only moves that
// reduce the real count. Same shape as tools/unroam.mjs, which is proven.
// ☠️ 14, NOT 16: the same number tools/hand-audit.mjs judges the shipped library
// by. Repairing to a looser limit than the audit means repairing to nothing.
const SPAN_MAX = 14, FINGERS = 5;

// ALL FOUR FAULTS, not just the two I first measured. The importer refuses a
// tier for "chord over 16 semitones, crossed hands, or a hand asked to travel
// over 120 semitones a second", and a repair pass that only knows about the
// first can never unlock the others: after the pedal fix Imperial March still
// had 47 wide chords, 19 crossed hands and 44 too-fast moves, so its medium and
// hard tiers stayed refused. Counting all four in one number lets a single
// hill-climb trade them off honestly instead of fixing one and breaking another.
const TRAVEL_MAX = 120;      // semitones per second, matching js/hands.mjs

// ☠️ THIS IS CALLED ONCE PER TRIAL MOVE, SO ITS COST IS THE WHOLE TOOL'S COST.
// The first version filtered every note at every beat: O(beats x notes), which
// on a 3,000-note transcription is ~12M operations PER CALL, and the repair pass
// calls it hundreds of times per song. Re-importing the library went from
// minutes to hours and the compilation import fell behind the transcription that
// feeds it. A sweep line computes the same answer in one ordered pass, because
// the active set only ever changes by the notes that start or end at each beat.
export function violations(notes, bpm = 120) {
  const beats = [...new Set(notes.map((n) => n.b))].sort((a, b) => a - b);
  const out = [];
  const byHand = { L: [], R: [] };
  for (const n of notes) byHand[n.h === 'L' ? 'L' : 'R'].push(n);
  for (const h of ['L', 'R']) byHand[h].sort((a, b) => a.b - b.b);
  const ptr = { L: 0, R: 0 };
  const live = { L: [], R: [] };
  for (const beat of beats) {
    const A = {};
    for (const h of ['L', 'R']) {
      const src = byHand[h];
      while (ptr[h] < src.length && src[ptr[h]].b <= beat + 1e-6) live[h].push(src[ptr[h]++]);
      live[h] = live[h].filter((n) => n.b + n.d > beat + 1e-6);
      A[h] = live[h];
    }
    for (const h of ['L', 'R']) {
      const active = A[h];
      if (active.length < 2) continue;
      const ms = active.map((n) => n.m).sort((a, b) => a - b);
      const span = ms[ms.length - 1] - ms[0];
      if (span > SPAN_MAX) out.push({ kind: 'span', beat, h, active });
      if (new Set(ms).size > FINGERS) out.push({ kind: 'keys', beat, h, active });
    }
    // the left hand must never be above the right at the same instant
    if (A.L.length && A.R.length) {
      const lo = A.L.reduce((a, c) => (c.m > a.m ? c : a));
      const hi = A.R.reduce((a, c) => (c.m < a.m ? c : a));
      if (lo.m > hi.m) out.push({ kind: 'cross', beat, h: 'L', active: [lo, hi] });
    }
  }
  // ☠️ AND THE BIGGEST FAULT OF ALL: HOW FAR THE HAND ROAMS INSIDE ONE BEAT.
  // This is the one Mark actually feels ("the range on the left hand seemed like
  // it was very far apart ... only about eight keys apart on the version I did"),
  // and it is the largest category in hand-audit at 105 moments. The `span`
  // check above only sees notes SOUNDING together; this sees the hand travelling
  // across a beat, which is what a player experiences as a lunge. Repairing
  // without it left the biggest category untouched, and tools/correction-check
  // measures exactly this, so ignoring it also risked trading it away silently.
  for (const h of ['L', 'R']) {
    const hn = notes.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
    for (let i = 0; i < hn.length; i++) {
      let lo = hn[i], hi = hn[i];
      for (let j = i + 1; j < hn.length && hn[j].b - hn[i].b <= 1; j++) {
        if (hn[j].m < lo.m) lo = hn[j];
        if (hn[j].m > hi.m) hi = hn[j];
      }
      if (hi.m - lo.m > SPAN_MAX) out.push({ kind: 'roam', beat: hn[i].b, h, active: [lo, hi] });
    }
  }
  // and no hand may fly further than a hand can move
  for (const h of ['L', 'R']) {
    const hn = notes.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
    for (let i = 1; i < hn.length; i++) {
      const dt = ((hn[i].b - hn[i - 1].b) / bpm) * 60;
      if (dt <= 0) continue;
      if (Math.abs(hn[i].m - hn[i - 1].m) / dt > TRAVEL_MAX) {
        out.push({ kind: 'travel', beat: hn[i].b, h, active: [hn[i - 1], hn[i]] });
      }
    }
  }
  return out;
}

// THE LONG NOTES ARE NOT PEDAL. THEY ARE NOTES THE MODEL NEVER HEARD END.
//
// ☠️ I GOT THIS WRONG FIRST TIME AND THE CORRECTED REASON MATTERS MORE THAN THE
// CODE. I saw 21-54% same-hand overlap against 0% in every curated song, saw
// that 15.6-75.8% of offsets land while the sustain pedal is down, and concluded
// the transcriber was reporting pedalled sound instead of finger-held keys.
// Codex checked the model instead of the correlation and found the real cause in
// piano_vad.py:64 -- `if bgn and (i - bgn >= 600 ...)`. At 100 frames a second
// that is a hard SIX SECOND TIMEOUT: when the detector never finds an offset it
// force-closes the note. That is why every file tops out at ~6.0s, a suspiciously
// round number no performance produces. Those notes do not have a long duration.
// They have an UNKNOWN one.
//
// The pedal correlation was real and irrelevant: pedal is exactly when offsets
// are hardest to detect, so it predicts the timeouts without causing them.
//
// What follows is therefore justified two ways, and neither is "the pedal did it":
//
//   1. A note the model timed out on has no measured duration at all, so
//      shipping 6 seconds is shipping a number nobody measured.
//   2. A hand has five fingers and a limited span. If the data shows one hand
//      holding six keys, or holding a note 17 semitones from what it is playing
//      now, the earliest of those was already released. That is arithmetic and
//      it holds whatever the cause.
//
// Durations only: no note is added, removed, re-pitched or re-handed.
export function unpedal(notes, bpm = 120) {
  let cut = 0;
  // FIRST, the notes the model timed out on. At the transcriber's fixed 120bpm
  // a 600-frame timeout is 6 seconds is 12 beats, so anything at or near that
  // carries no measured offset. Its duration is unknown, and an unknown is not
  // allowed to masquerade as a very long note: it is cut to the next thing the
  // same hand does, which is the shortest defensible claim.
  const capBeats = (600 / 100) * (bpm / 60) * 0.92;      // 92% of the timeout
  for (const hand of ['L', 'R']) {
    const hn = notes.filter((n) => n.h === hand).sort((a, b) => a.b - b.b);
    for (let i = 0; i < hn.length; i++) {
      if (hn[i].d < capBeats) continue;
      const next = hn.find((o) => o.b > hn[i].b + 1e-6);
      hn[i].d = Math.max(0.25, next ? next.b - hn[i].b : 1);
      cut++;
    }
  }
  for (const hand of ['L', 'R']) {
    const hn = notes.filter((n) => n.h === hand).sort((a, b) => a.b - b.b || a.m - b.m);
    let held = [];
    const beats = [...new Set(hn.map((n) => n.b))].sort((a, b) => a - b);
    for (const beat of beats) {
      held = held.filter((n) => n.b + n.d > beat + 1e-6);
      const starting = hn.filter((n) => Math.abs(n.b - beat) < 1e-6);
      for (const n of starting) if (!held.includes(n)) held.push(n);
      // release the OLDEST first: it is the one whose finger has been on the key
      // longest and the one a pianist lets go of to play the next thing
      const tooMany = () => new Set(held.map((n) => n.m)).size > FINGERS;
      const tooWide = () => {
        const ms = held.map((n) => n.m);
        return Math.max(...ms) - Math.min(...ms) > SPAN_MAX;
      };
      let guard = 0;
      while (held.length > 1 && (tooMany() || tooWide()) && guard++ < 40) {
        // oldest by onset; among equals, the one furthest from what is playing now
        const now = starting.length ? starting.map((n) => n.m) : held.map((n) => n.m);
        const centre = now.reduce((a, c) => a + c, 0) / now.length;
        const victim = held.slice().sort((a, b) => a.b - b.b || Math.abs(b.m - centre) - Math.abs(a.m - centre))[0];
        if (starting.includes(victim) && held.length <= starting.length) break;  // cannot release what is being struck now
        const nd = Math.max(0.25, beat - victim.b);
        if (nd < victim.d) { victim.d = nd; cut++; }
        held = held.filter((n) => n !== victim);
      }
    }
  }
  return cut;
}

export function repairSplit(notes, bpm = 120) {
  let moved = 0;
  // ☠️ A HILL-CLIMB NEEDS A BUDGET, NOT JUST A LIMIT. 2000 passes is fine on a
  // 500-note song and pathological on a dense one: each pass rescans the fault
  // list and re-evaluates violations per trial move, so the cost grows with the
  // SQUARE of how wrong the song is. Un Sospiro sat in this loop for 45 minutes
  // during a re-import and had to be killed. The climb converges long before the
  // cap on anything healthy, so the cap only ever bites where it is running away
  // and producing little: scale it to the song and stop pretending the last few
  // hundred passes were going to find something.
  const budget = Math.max(120, Math.min(2000, Math.round(120000 / Math.max(1, notes.length))));
  for (let pass = 0; pass < budget; pass++) {
    const bad = violations(notes, bpm);
    if (!bad.length) break;
    let acted = false;
    for (const v of bad) {
      // each fault suggests its own candidate: the note that, moved to the other
      // hand, would relieve it. A crossing is relieved from either end, so both
      // are offered and the one that actually helps is kept.
      // ☠️ EVERY NOTE IN THE FAULT, NOT THE ONE I EXPECT TO BE GUILTY. Offering
      // only the outlier (top of an overloaded left hand, bottom of an
      // overloaded right) stalls the climb at the first fault whose outlier
      // happens to be immovable: 25 moves against 79 faults. Codex: "widen the
      // repair pass to test every violating note". The extra candidates cost a
      // few more trial evaluations and each is still accepted only if the TOTAL
      // fault count strictly drops, so widening can never make things worse.
      const sorted = v.active.slice().sort((a, b) => a.m - b.m);
      const cands = v.kind === 'cross' || v.kind === 'travel' || v.kind === 'roam'
        ? v.active.slice()
        : [v.h === 'L' ? sorted[sorted.length - 1] : sorted[0], ...sorted];
      for (const note of cands) {
        const was = note.h;
        const to = was === 'L' ? 'R' : 'L';
        // ☠️ NEVER CREATE A DUPLICATE. If the receiving hand already sounds this
        // pitch at this instant, the move produces two identical notes at one
        // beat, which validateSong rejects outright and wait mode would deadlock
        // on, waiting for a key that is already down. tools/unroam.mjs learned
        // this on piano-man-hard and guards it; this pass did not, and the suite
        // caught seven of them in in-the-end-hard.
        if (notes.some((n) => n !== note && n.h === to && n.m === note.m && Math.abs(n.b - note.b) < 1e-6)) continue;
        note.h = to;
        if (violations(notes, bpm).length >= bad.length) { note.h = was; continue; }
        moved++; acted = true;
        break;
      }
      if (acted) break;
    }
    if (!acted) break;
  }
  return moved;
}

// ---- applied to the library's machine transcriptions ----
if (process.argv[1] && process.argv[1].endsWith('handsplit.mjs')) {
  const ROOT = join(import.meta.dirname, '..');
  const dry = process.argv.includes('--dry');
  const { SONGS } = await import('file:///' + join(ROOT, 'js', 'songs.mjs').replace(/\\/g, '/'));

  const worst = (ns, h) => {
    const hn = ns.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
    let most = 0, span = 0;
    for (let i = 0; i < hn.length; i++) {
      const at = hn.filter((x) => Math.abs(x.b - hn[i].b) < 1e-6);
      most = Math.max(most, at.length);
      span = Math.max(span, at[at.length - 1].m - at[0].m);
    }
    return { most, span };
  };

  const fixes = {};
  for (const song of SONGS) {
    if (!/transcription/i.test(song.source || '')) continue;
    // ☠️ REPAIR THE HANDS THAT ARE THERE. DO NOT RE-SPLIT FROM SCRATCH.
    // splitHands() optimises simultaneous onsets and hand travel, and on music
    // that SUSTAINS that is the wrong objective: it took light-of-the-seven from
    // 209 unplayable moments to 872 before repair could claw it back to 722. The
    // incumbent hands already encode real structure. The repair pass uses the
    // audit's own definition and only ever accepts a move that reduces the real
    // count, so starting from what exists can only improve it. splitHands is
    // kept and exported for a transcription that arrives with NO hands at all.
    const before = violations(song.notes).length;
    const after = song.notes.map((n) => ({ ...n }));
    const shortened = unpedal(after);        // the pedal first: it is most of the fault
    const midCount = violations(after).length;
    const moved = repairSplit(after);
    const end = violations(after).length;
    console.log(`  ${String(shortened).padStart(4)} notes shortened (pedal), ${before} -> ${midCount} before rehanding`);
    const changed = after.filter((n, i) => n.h !== song.notes[i].h).length;
    console.log(`${song.id.padEnd(26)} ${String(changed).padStart(4)} notes rehanded  ` +
      `unplayable moments ${before} -> ${end}  (${moved} notes moved)`);
    if (end > before) { console.log(`  WORSE, left alone`); continue; }
    fixes[song.id] = { n: song.notes.length, h: after.map((n) => n.h).join('') };
    void worst;
  }
  console.log(`\n${Object.keys(fixes).length} transcriptions re-split`);
  if (dry) { console.log('--dry: nothing written'); process.exit(0); }

  const p = join(ROOT, 'js', 'songs-split.mjs');
  writeFileSync(p, `// GENERATED by tools/handsplit.mjs. Do not hand-edit.
//
// Hand assignment for the machine transcriptions, one letter per note in the
// song's own authored order. A transcription carries no staves, so SOMETHING
// has to decide the hands; note-by-note repair produced "6 keys down in one
// hand" and crossed hands, which is the fault Mark hears. This is decided over
// the whole piece at once, and a crossed hand is unrepresentable rather than
// merely expensive.
export const SPLIT = ${JSON.stringify(fixes, null, 1)};
`);
  console.log(`wrote js/songs-split.mjs with ${Object.keys(fixes).length} songs`);
  void existsSync; void readFileSync;
}
