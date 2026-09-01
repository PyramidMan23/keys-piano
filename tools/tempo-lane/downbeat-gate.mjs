// Does the DP tracker earn bar lines? Scored against the same ground truth
// Gate 0 built: score downbeats transferred onto the performance by DTW.
//
//   node downbeat-gate.mjs <perf.mid> <score.mid> <perf.beats.json> <scoreBeatsPerBar>
//
// The pre-committed bar stands: downbeat F1 >= 0.60 at +/-100ms. Counting every
// Pth tracked beat scored 0.190, and 0.190 was the ceiling over ALL phases.
import { readFileSync } from 'node:fs';
import { parseMidi, midiNotes } from 'file:///C:/Users/markh/keys-piano/tools/midi.mjs';
import { inferMeter } from './meter.mjs';
import { trackDownbeats, chooseBar } from './downbeat.mjs';

const [perfPath, scorePath, beatsPath, bpbArg] = process.argv.slice(2);
const trueBpb = +bpbArg;
const perf = midiNotes(parseMidi(readFileSync(perfPath)));
const score = midiNotes(parseMidi(readFileSync(scorePath)));
const sidecar = JSON.parse(readFileSync(beatsPath, 'utf8'));

const ev = (N, f) => {
  const by = new Map();
  for (const x of N) { const k = Math.round(x.b * 96); if (!by.has(k)) by.set(k, { t: f(x.b), ps: new Set() }); by.get(k).ps.add(x.m % 12); }
  return [...by.values()].sort((a, b) => a.t - b.t);
};
const P = ev(perf, (b) => b * 0.5), S = ev(score, (b) => b);
const ratio = P.length / S.length;
if (ratio > 2.2 || ratio < 0.45) { console.log(`REFUSED: ${P.length} vs ${S.length} events - not the same piece`); process.exit(2); }
const cost = (a, b) => { let i = 0; for (const x of a.ps) if (b.ps.has(x)) i++; return 1 - i / Math.max(a.ps.size, b.ps.size); };
const n = P.length, m = S.length, band = Math.max(40, Math.round(m * 0.12));
const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(Infinity)); D[0][0] = 0;
for (let i = 1; i <= n; i++) {
  const c0 = Math.max(1, Math.round((i / n) * m) - band), c1 = Math.min(m, Math.round((i / n) * m) + band);
  for (let j = c0; j <= c1; j++) D[i][j] = cost(P[i - 1], S[j - 1]) + Math.min(D[i - 1][j - 1], D[i - 1][j] + 0.4, D[i][j - 1] + 0.4);
}
const pairs = []; let i = n, j = m;
while (i > 0 && j > 0) { const d = D[i - 1][j - 1], u = D[i - 1][j], l = D[i][j - 1]; if (d <= u && d <= l) { pairs.push([P[i - 1].t, S[j - 1].t]); i--; j--; } else if (u <= l) i--; else j--; }
pairs.reverse();
const times = pairs.map((p) => p[0]), sb = pairs.map((p) => p[1]);
const at = (b) => {
  if (b <= sb[0]) return times[0];
  if (b >= sb[sb.length - 1]) return times[times.length - 1];
  let lo = 0, hi = sb.length - 1;
  while (hi - lo > 1) { const md = (lo + hi) >> 1; if (sb[md] <= b) lo = md; else hi = md; }
  const f = (b - sb[lo]) / Math.max(1e-9, sb[hi] - sb[lo]);
  return times[lo] + f * (times[hi] - times[lo]);
};
const maxB = Math.floor(Math.max(...score.map((x) => x.b)));
const truth = []; for (let b = 0; b <= maxB; b += trueBpb) truth.push(at(b));

// --- rebuild the model's evidence, then run the DP ---
const notes = perf.map((x) => ({ t: x.b * 0.5, m: x.m, vel: x.vel }));
const meta = inferMeter(sidecar, notes);
const B = sidecar.beats, acc = sidecar.beat_accents ?? [];
const N = B.length;
const nearest = (t) => { let lo = 0, hi = N - 1; while (hi - lo > 1) { const md = (lo + hi) >> 1; if (B[md] <= t) lo = md; else hi = md; } const k = (t - B[lo] <= B[hi] - t) ? lo : hi; return Math.abs(B[k] - t) <= 0.09 ? k : -1; };
const bass = new Float64Array(N), pcs = Array.from({ length: N }, () => new Set());
for (const x of notes) { const k = nearest(x.t); if (k < 0) continue; pcs[k].add(x.m % 12); if (x.m < 55) bass[k] += ((55 - x.m) / 24) * ((x.vel ?? 80) / 80); }
const nov = new Float64Array(N);
for (let k = 1; k < N; k++) { const a = pcs[k - 1], b = pcs[k]; if (!b.size) continue; let it = 0; for (const x of b) if (a.has(x)) it++; nov[k] = 1 - it / Math.max(1, Math.max(a.size, b.size)); }
const z = (arr) => { const v = Array.from(arr); const mu = v.reduce((a, c) => a + c, 0) / v.length; const sd = Math.sqrt(v.reduce((a, c) => a + (c - mu) ** 2, 0) / v.length) || 1; return v.map((x) => (x - mu) / sd); };
const zb = z(bass), zn = z(nov), za = z(acc.length === N ? acc : new Float64Array(N));
const barSignal = zn.map((v, k) => v + 0.6 * zb[k] + 0.2 * za[k]);

const f1 = (est, tr, tol) => {
  let hit = 0; const used = new Set();
  for (const e of est) { let best = -1, bd = tol; tr.forEach((t, k) => { const dd = Math.abs(t - e); if (dd <= bd && !used.has(k)) { bd = dd; best = k; } }); if (best >= 0) { used.add(best); hit++; } }
  const p = est.length ? hit / est.length : 0, r = tr.length ? hit / tr.length : 0;
  return { f1: p + r ? (2 * p * r) / (p + r) : 0, prec: p, rec: r };
};

// baseline for comparison: the old counting method, at its very best phase
let bestCount = 0;
for (let ph = 0; ph < meta.barP; ph++) bestCount = Math.max(bestCount, f1(B.filter((_, k) => k % meta.barP === ph), truth, 0.10).f1);

// candidate bar lengths: every plausible multiple of the tracked beat, not just
// the meter model's pick - its bar length was WRONG for Moonlight (8 vs 12)
// even though its meter (4/4) was right
const ivAll = []; for (let k = 1; k < B.length; k++) ivAll.push(B[k] - B[k - 1]);
ivAll.sort((a, b) => a - b);
const beatSec = ivAll[Math.floor(ivAll.length / 2)];
const cands = [2, 3, 4, 6, 8, 9, 12, 16].map((p) => p * beatSec);
const sel = chooseBar(B, barSignal, cands);
const dpr = sel;
const r = f1(dpr.downbeats, truth, 0.10);
console.log('\nbar-length selection by self-consistency:');
for (const a of sel.all.slice(0, 6)) console.log(`   target ${a.target}s -> median ${a.median}s, ${a.bars} bars, cover ${a.cover}, drift ${a.drift}`);
console.log(`   chosen ${sel.target}s (margin ${sel.consistencyMargin})`);
const target = sel.target;

console.log(`truth: ${truth.length} bars | meter model: ${meta.meter}/4, bar ${meta.barP} beats (${target}s)`);
console.log(`counting every ${meta.barP}th beat, BEST phase : F1 ${bestCount.toFixed(3)}`);
console.log(`DP tracker: ${dpr.bars} bars, median ${dpr.medianBarSec}s, steadiness cv ${dpr.barCv}`);
console.log(`   precision ${r.prec.toFixed(3)}  recall ${r.rec.toFixed(3)}  F1 ${r.f1.toFixed(3)}`);
console.log(`\nT3 downbeat F1 ${r.f1.toFixed(3)}  (need >= 0.60)  ${r.f1 >= 0.60 ? 'PASS' : 'FAIL'}`);
