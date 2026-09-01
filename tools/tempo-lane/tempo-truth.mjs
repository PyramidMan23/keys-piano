// GATE 0: CAN WE HEAR THE BEAT? Measured against ground truth we already own.
//
// Council 2026-09-01 (brain/decisions/2026-09-01-council-keys-tempo-meter-detection.md):
// every transcribed song wears a fake 120bpm 4/4 grid because the transcriber
// emits no tempo and no meter. Before ANY song gets real bars, the detector
// must prove itself against real rubato piano with KNOWN beats. We own that
// truth without buying anything: engraved Mutopia scores (exact beats, exact
// meter) for pieces we also hold performances of. Aligning the performance's
// transcription to the score transfers the score's beats onto the audio.
//
//   node tempo-truth.mjs <performance.mid> <score.mid> <beats.json> [beatsPerBar]
//
//   performance.mid  ByteDance transcription of the performance audio
//   score.mjs        engraved score MIDI (beats are TRUE musical beats)
//   beats.json       librosa's tracked beats for the same audio ({beats:[sec...]})
//
// ☠️ THRESHOLDS FIXED BEFORE FIRST RESULTS (Codex's condition, adopted in the
// council verdict: "accepts the DTW corpus only if its thresholds are fixed
// before results are seen"). Committed 2026-09-01 BEFORE this ever ran:
//   T1  beat F1 >= 0.75 at +/-70ms, at the best metrical level in {1/3,1/2,1,2,3}
//   T2  that level must beat the runner-up by >= 0.15 (tempo octave decidable)
//   T3  downbeat F1 >= 0.60 at +/-100ms once T1's level is chosen
// A detector that misses these on the corpus does NOT ship bars; the buy-a-score
// option returns to the table with evidence.
import { readFileSync } from 'node:fs';
import { parseMidi, midiNotes } from 'file:///C:/Users/markh/keys-piano/tools/midi.mjs';

const [perfPath, scorePath, beatsPath, bpbArg] = process.argv.slice(2);
const perf = midiNotes(parseMidi(readFileSync(perfPath)));   // b in fake beats: 1 fake beat = 0.5s (fixed 120bpm)
const score = midiNotes(parseMidi(readFileSync(scorePath))); // b in TRUE musical beats
const tracked = JSON.parse(readFileSync(beatsPath, 'utf8')).beats; // seconds
const beatsPerBar = +(bpbArg ?? 4);

// ---- 1. align performance to score by pitch-sequence DTW --------------------
// Onset events: (time, pitch-set). Cost = how unlike two onsets' pitch sets are.
const events = (notes, toSec) => {
  const by = new Map();
  for (const n of notes) {
    const k = Math.round(n.b * 96);
    if (!by.has(k)) by.set(k, { t: toSec(n.b), ps: new Set() });
    by.get(k).ps.add(n.m % 12);
  }
  return [...by.values()].sort((a, b) => a.t - b.t);
};
const P = events(perf, (b) => b * 0.5);       // transcriber's fixed grid: beat = 500ms
const S = events(score, (b) => b);            // "time" = true beat number
const cost = (a, b) => {
  let inter = 0;
  for (const x of a.ps) if (b.ps.has(x)) inter++;
  return 1 - inter / Math.max(a.ps.size, b.ps.size);
};
// banded DTW keeps it O(n*band)
const n = P.length, m = S.length, band = Math.max(40, Math.round(m * 0.12));
const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(Infinity));
D[0][0] = 0;
for (let i = 1; i <= n; i++) {
  const c0 = Math.max(1, Math.round((i / n) * m) - band), c1 = Math.min(m, Math.round((i / n) * m) + band);
  for (let j = c0; j <= c1; j++) {
    const c = cost(P[i - 1], S[j - 1]);
    D[i][j] = c + Math.min(D[i - 1][j - 1], D[i - 1][j] + 0.4, D[i][j - 1] + 0.4);
  }
}
// backtrack -> matched pairs (perf seconds, score beat)
const pairs = [];
let i = n, j = m;
while (i > 0 && j > 0) {
  const diag = D[i - 1][j - 1], up = D[i - 1][j], left = D[i][j - 1];
  if (diag <= up && diag <= left) { pairs.push([P[i - 1].t, S[j - 1].t]); i--; j--; }
  else if (up <= left) i--;
  else j--;
}
pairs.reverse();
console.log(`aligned ${pairs.length} onset pairs (perf ${n} events, score ${m} events)`);

// ---- 2. truth beats: score beat k -> performance seconds, by interpolation --
const times = [], sb = [];
for (const [t, b] of pairs) { times.push(t); sb.push(b); }
const perfTimeOfBeat = (beat) => {
  let lo = 0, hi = sb.length - 1;
  if (beat <= sb[0]) return times[0];
  if (beat >= sb[hi]) return times[hi];
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (sb[mid] <= beat) lo = mid; else hi = mid; }
  const f = (beat - sb[lo]) / Math.max(1e-9, sb[hi] - sb[lo]);
  return times[lo] + f * (times[hi] - times[lo]);
};
const maxBeat = Math.floor(Math.max(...score.map((x) => x.b)));
const truthBeats = [], truthDown = [];
for (let b = 0; b <= maxBeat; b++) {
  const t = perfTimeOfBeat(b);
  truthBeats.push(t);
  if (b % beatsPerBar === 0) truthDown.push(t);
}

// ---- 3. score librosa's beats against the truth, per metrical level ---------
const f1 = (est, truth, tol) => {
  let hit = 0;
  const used = new Set();
  for (const e of est) {
    let best = -1, bd = tol;
    truth.forEach((t, k) => { const d = Math.abs(t - e); if (d <= bd && !used.has(k)) { bd = d; best = k; } });
    if (best >= 0) { used.add(best); hit++; }
  }
  const prec = est.length ? hit / est.length : 0, rec = truth.length ? hit / truth.length : 0;
  return prec + rec ? (2 * prec * rec) / (prec + rec) : 0;
};
const levels = { '1/3': 3, '1/2': 2, '1': 1, '2': 0.5, '3': 1 / 3 };
const scores = {};
for (const [name, mult] of Object.entries(levels)) {
  // resample truth at this metrical level
  const t2 = [];
  for (let b = 0; b <= maxBeat; b += 1 / mult) t2.push(perfTimeOfBeat(b));
  scores[name] = +f1(tracked, t2, 0.07).toFixed(3);
}
const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
console.log('\nbeat F1 vs truth, +/-70ms, per metrical level:');
for (const [k, v] of ranked) console.log(`   level ${k.padEnd(4)} ${v}`);
const [bestL, bestF] = ranked[0], runnerF = ranked[1][1];

// downbeats: does an accent/period model on the TRACKED beats find the bar?
const downF = +f1(tracked.filter((_, k) => k % beatsPerBar === 0), truthDown, 0.10).toFixed(3);

console.log(`\nT1 beat F1 ${bestF} at level ${bestL}  (need >= 0.75)  ${bestF >= 0.75 ? 'PASS' : 'FAIL'}`);
console.log(`T2 octave margin ${(bestF - runnerF).toFixed(3)}  (need >= 0.15)  ${bestF - runnerF >= 0.15 ? 'PASS' : 'FAIL'}`);
console.log(`T3 naive downbeat F1 ${downF}  (need >= 0.60)  ${downF >= 0.60 ? 'PASS' : 'FAIL - downbeat phase needs its own model, as Codex predicted'}`);
