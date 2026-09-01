// GATE 1 SCORING: does the downbeat model beat 0.60 on ground truth?
//
//   node meter-gate.mjs <perf.mid> <score.mid> <perf.beats.json> <trueBeatsPerBar>
//
// Truth comes the same way Gate 0 built it: DTW-align the performance's
// transcription to its engraved score, then read the score's real downbeats
// off the alignment. The model never sees the score - it only gets the audio
// sidecar and the transcribed notes, exactly what a real song has.
//
// ☠️ VERIFY BOTH SIDES ARE THE SAME PIECE FIRST. Gate 0's first run scored
// 0.187 and the failure was the fixture's: a 17-minute recording of the whole
// sonata aligned against a score of movement 1. The note counts screamed it
// (8571 vs 821) and the harness aligned happily anyway. Now it refuses.
import { readFileSync } from 'node:fs';
import { parseMidi, midiNotes } from 'file:///C:/Users/markh/keys-piano/tools/midi.mjs';
import { inferMeter } from './meter.mjs';

const [perfPath, scorePath, beatsPath, bpbArg] = process.argv.slice(2);
const trueBpb = +bpbArg;
const perf = midiNotes(parseMidi(readFileSync(perfPath)));
const score = midiNotes(parseMidi(readFileSync(scorePath)));
const sidecar = JSON.parse(readFileSync(beatsPath, 'utf8'));

const events = (notes, toSec) => {
  const by = new Map();
  for (const x of notes) {
    const k = Math.round(x.b * 96);
    if (!by.has(k)) by.set(k, { t: toSec(x.b), ps: new Set() });
    by.get(k).ps.add(x.m % 12);
  }
  return [...by.values()].sort((a, b) => a.t - b.t);
};
const P = events(perf, (b) => b * 0.5), S = events(score, (b) => b);
const ratio = P.length / S.length;
if (ratio > 2.2 || ratio < 0.45) {
  console.log(`REFUSED: ${P.length} performance events vs ${S.length} score events (ratio ${ratio.toFixed(2)}).`);
  console.log('These are not the same piece. Cut the recording to match the score before calibrating.');
  process.exit(2);
}

// --- DTW truth transfer (same as Gate 0) ---
const cost = (a, b) => { let i = 0; for (const x of a.ps) if (b.ps.has(x)) i++; return 1 - i / Math.max(a.ps.size, b.ps.size); };
const n = P.length, m = S.length, band = Math.max(40, Math.round(m * 0.12));
const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(Infinity));
D[0][0] = 0;
for (let i = 1; i <= n; i++) {
  const c0 = Math.max(1, Math.round((i / n) * m) - band), c1 = Math.min(m, Math.round((i / n) * m) + band);
  for (let j = c0; j <= c1; j++) D[i][j] = cost(P[i - 1], S[j - 1]) + Math.min(D[i - 1][j - 1], D[i - 1][j] + 0.4, D[i][j - 1] + 0.4);
}
const pairs = [];
let i = n, j = m;
while (i > 0 && j > 0) {
  const d = D[i - 1][j - 1], u = D[i - 1][j], l = D[i][j - 1];
  if (d <= u && d <= l) { pairs.push([P[i - 1].t, S[j - 1].t]); i--; j--; } else if (u <= l) i--; else j--;
}
pairs.reverse();
const times = pairs.map((p) => p[0]), sb = pairs.map((p) => p[1]);
const at = (beat) => {
  if (beat <= sb[0]) return times[0];
  if (beat >= sb[sb.length - 1]) return times[times.length - 1];
  let lo = 0, hi = sb.length - 1;
  while (hi - lo > 1) { const md = (lo + hi) >> 1; if (sb[md] <= beat) lo = md; else hi = md; }
  const f = (beat - sb[lo]) / Math.max(1e-9, sb[hi] - sb[lo]);
  return times[lo] + f * (times[hi] - times[lo]);
};
const maxBeat = Math.floor(Math.max(...score.map((x) => x.b)));
const truthDown = [];
for (let b = 0; b <= maxBeat; b += trueBpb) truthDown.push(at(b));

// --- the model, seeing only what a real song offers ---
const notesForModel = perf.map((x) => ({ t: x.b * 0.5, m: x.m, vel: x.vel }));
const got = inferMeter(sidecar, notesForModel);

const f1 = (est, truth, tol) => {
  let hit = 0; const used = new Set();
  for (const e of est) {
    let best = -1, bd = tol;
    truth.forEach((t, k) => { const dd = Math.abs(t - e); if (dd <= bd && !used.has(k)) { bd = dd; best = k; } });
    if (best >= 0) { used.add(best); hit++; }
  }
  const p = est.length ? hit / est.length : 0, r = truth.length ? hit / truth.length : 0;
  return p + r ? (2 * p * r) / (p + r) : 0;
};
const F = +f1(got.downbeats, truthDown, 0.10).toFixed(3);

console.log(`aligned ${pairs.length} pairs; truth has ${truthDown.length} downbeats (${trueBpb} score-beats/bar)`);
console.log('\nmeter candidates (tracked beats per bar, phase-locked contrast):');
for (const c of got.candidates) console.log(`   P=${String(c.P).padStart(2)} phase ${c.phase}   score ${c.score}${c.P === got.P ? '   <- chosen' : ''}`);
console.log(`\nchosen: bar = ${got.P} tracked beats, phase ${got.phase}, margin ${got.margin} over the best non-harmonic rival`);
console.log(`T3 downbeat F1 ${F}  (need >= 0.60)  ${F >= 0.60 ? 'PASS' : 'FAIL'}`);
