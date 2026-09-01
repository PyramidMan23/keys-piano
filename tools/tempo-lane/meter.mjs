// GATE 1: WHERE IS THE BAR? The downbeat/meter model the council demanded.
//
// Input: the pulse sidecar (tracked beat times + onset accents) and the
// transcription's notes. Everything is judged in the TRACKED-BEAT domain, never
// in seconds, so rubato is absorbed by the beat map before any evidence is read
// (council 2026-09-01: "infer meter in BEAT units").
//
// ☠️ FIND THE BAR FIRST, THEN THE BEAT INSIDE IT. Ordering it the other way
// round - beat level first, bar as a multiple - got Moonlight right and Married
// Life WRONG (2/4 for a waltz), because "strong period-3 structure" is
// ambiguous: in Moonlight it is the triplet SUBDIVISION, in a waltz it is the
// BAR. Nothing at the beat level can tell those apart. Measuring Kyle's bass
// settled it: his bass roots sit 0.98s apart and the tracked beat is 325ms, so
// the bar is 3.05 tracked beats and the tracked beat IS the musical beat.
// Bars are found from harmony and bass, then the beat is whichever division of
// that bar the pulse actually accents.
//
// ☠️ TWO STAGES, BECAUSE ACCENT FINDS THE PULSE AND HARMONY FINDS THE BAR.
// The first version scored every period with one blended signal and chose P=8
// over the true P=12 by 0.02 on Moonlight. Diagnosing per-feature showed why,
// and the numbers are worth keeping (t-statistic, Rousseau mvt1, truth = 12):
//
//     period |  bass  accent  novelty  density
//          3 |  3.65    3.30     1.11     3.43   <- the musical BEAT (triplets)
//          6 |  3.19    2.79     0.81     2.64
//         12 |  2.21    2.26     1.81     1.95   <- the BAR
//
// Bass, accent and density all shout the BEAT and are quieter at the bar - of
// course they are, every beat is played. Only NOVELTY (harmonic change) rises
// at 12: chords change at bar lines far more often than inside bars. Blending
// them lets the loud beat-level evidence drown the quiet bar-level evidence.
// So: find the beat level with accent-type evidence, then find the bar among
// its multiples with harmony-type evidence.
//
// ☠️ AND THE CANDIDATE LIST MUST INCLUDE 3/4. The first version tested
// {2,3,4,6,8,12} and never tested 9 - the bar of a WALTZ at a triplet beat
// level - while being written specifically to make Married Life count in three.
// Meters come from beats-per-bar {2,3,4}, times the level, so a waltz cannot be
// unrepresentable.
//
// Deliberate limit: simple meters only. 6/8 and 12/8 read as their simple
// cousins, and phrase-level periods (2 bars) are excluded by construction -
// Moonlight's novelty peaks hard at 24, which is its two-bar harmonic phrase,
// and admitting M=8 would have handed it that instead of the bar.
const METERS = [2, 3, 4];          // musical beats per bar
const BEAT_BPM = [40, 200];        // a musical beat is not slower or faster than this

const zscore = (arr) => {
  const v = Array.from(arr);
  const mu = v.reduce((a, c) => a + c, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, c) => a + (c - mu) ** 2, 0) / v.length) || 1;
  return v.map((x) => (x - mu) / sd);
};

// Welch t: how much stronger is E on beats congruent to phase than off them?
// ☠️ A t-STATISTIC, NOT A MEAN GAP. A long period has few downbeats, so its
// mean is noisy and a raw difference flatters whichever period sampled fewest
// beats. Without this, a spurious P=8 beat the true P=12 on Moonlight by 0.02.
function contrast(E, P, phases) {
  let best = -Infinity, bestPhase = 0;
  for (const ph of phases) {
    const on = [], off = [];
    for (let k = 0; k < E.length; k++) (k % P === ph % P ? on : off).push(E[k]);
    if (on.length < 4 || off.length < 4) continue;
    const mu = (a) => a.reduce((x, c) => x + c, 0) / a.length;
    const vr = (a) => { const m = mu(a); return a.reduce((x, c) => x + (c - m) ** 2, 0) / Math.max(1, a.length - 1); };
    const t = (mu(on) - mu(off)) / Math.sqrt(vr(on) / on.length + vr(off) / off.length);
    if (t > best) { best = t; bestPhase = ph % P; }
  }
  return { t: best === -Infinity ? 0 : +best.toFixed(3), phase: bestPhase };
}

export function inferMeter(sidecar, notes) {
  const B = sidecar.beats, acc = sidecar.beat_accents ?? [];
  const n = B.length;
  if (n < 24) return { ok: false, why: 'too few tracked beats to judge meter' };
  const iv = [];
  for (let k = 1; k < n; k++) iv.push(B[k] - B[k - 1]);
  iv.sort((a, b) => a - b);
  const beatSec = iv[Math.floor(iv.length / 2)];   // median tracked-beat length

  const nearest = (t) => {
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (B[m] <= t) lo = m; else hi = m; }
    const k = (t - B[lo] <= B[hi] - t) ? lo : hi;
    return Math.abs(B[k] - t) <= 0.09 ? k : -1;
  };

  const bass = new Float64Array(n), density = new Float64Array(n);
  const pcs = Array.from({ length: n }, () => new Set());
  for (const x of notes) {
    const k = nearest(x.t);
    if (k < 0) continue;
    pcs[k].add(x.m % 12);
    density[k] += 1;
    if (x.m < 55) bass[k] += ((55 - x.m) / 24) * ((x.vel ?? 80) / 80);
  }
  const nov = new Float64Array(n);
  for (let k = 1; k < n; k++) {
    const a = pcs[k - 1], b = pcs[k];
    if (!b.size) continue;
    let inter = 0;
    for (const x of b) if (a.has(x)) inter++;
    nov[k] = 1 - inter / Math.max(1, Math.max(a.size, b.size));
  }
  const zb = zscore(bass), za = zscore(acc.length === n ? acc : new Float64Array(n));
  const zd = zscore(density), zn = zscore(nov);
  const barSignal = zn.map((v, k) => v + 0.6 * zb[k]);       // harmony change + bass
  const pulseSignal = zb.map((v, k) => v + za[k] + zd[k]);   // what is played and accented

  // beat divisions of a candidate bar that a human could actually feel
  const legalBeats = (P) => METERS
    .filter((M) => P % M === 0)
    .map((M) => ({ M, L: P / M }))
    .filter(({ L }) => { const bpm = 60 / (L * beatSec); return bpm >= BEAT_BPM[0] && bpm <= BEAT_BPM[1]; });

  // ---- stage A: the BAR, from harmony and bass ----------------------------
  // ☠️ A CANDIDATE WITH NO FEELABLE BEAT IS NOT A BAR. Moonlight's novelty
  // peaks at 24 tracked beats - its two-bar harmonic phrase - and every way of
  // dividing 24 into 2, 3 or 4 beats implies a beat of 10 to 20 bpm, which no
  // one counts. Requiring a legal beat rejects phrase-level periods without a
  // hand-tuned bar-length prior, which would have wrongly rejected Moonlight's
  // real 5.9-second bar.
  const barCands = [];
  for (let P = 2; P <= 16; P++) {
    const beats = legalBeats(P);
    if (!beats.length) continue;
    const c = contrast(barSignal, P, [...Array(P).keys()]);
    barCands.push({ P, ...c, beats });
  }
  if (!barCands.length) return { ok: false, why: 'no candidate bar has a beat anyone could count' };
  barCands.sort((a, b) => b.t - a.t);
  const bar = barCands[0];

  // ---- stage B: the BEAT inside that bar ----------------------------------
  // ☠️ TAKE THE FINEST COUNTABLE BEAT, DO NOT LET THE PULSE VOTE. Choosing the
  // division with the strongest pulse contrast called SEVEN 4/4 songs "2/4":
  // a backbeat accents beats 2 and 4, so period-2 always looks strongest, and
  // the model kept reporting the half-bar as the beat. The bar period itself
  // was right every time (4 tracked beats for all of them) - only the label was
  // wrong. A four-beat bar is 4/4 by convention, not 2/4, and the finest legal
  // division is the one a learner counts. The pulse ranking is kept as evidence
  // and reported when it disagrees, but it does not choose.
  const scored = bar.beats.map(({ M, L }) => {
    const phases = [];
    for (let ph = 0; ph < L; ph++) phases.push((bar.phase + ph) % L);
    return { M, L, ...contrast(pulseSignal, L, phases) };
  });
  const pick = [...scored].sort((a, b) => b.M - a.M)[0];
  const pulsePick = [...scored].sort((a, b) => b.t - a.t)[0];

  return {
    ok: true,
    meter: pick.M,                       // musical beats per bar: 2, 3 or 4
    level: pick.L,                       // tracked beats per musical beat
    barP: bar.P,                         // tracked beats per bar
    phase: bar.phase,
    barStrength: bar.t,
    barMargin: +(bar.t - (barCands[1]?.t ?? 0)).toFixed(3),
    beatBpm: +(60 / (pick.L * beatSec)).toFixed(1),
    barSec: +(bar.P * beatSec).toFixed(2),
    pulsePrefers: pulsePick.M,           // evidence, not the decision (see stage B)
    candidates: barCands.slice(0, 5).map((c) => ({ P: c.P, t: c.t })),
    downbeats: B.filter((_, k) => k % bar.P === bar.phase),
  };
}
