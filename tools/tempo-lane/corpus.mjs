// THE GROUND-TRUTH CORPUS, RUN IN ONE GO.
//
//   node corpus.mjs [--verbose]
//
// For every piece where we hold BOTH an engraved score and a recording of
// someone playing it, this transfers the score's true bar lines onto the
// performance and scores the tempo lane against them.
//
// ☠️ THE SCORE IS ALREADY IN THE LIBRARY. Its notes were imported FROM Mutopia
// with the staves as hands, so their beat positions are the printed text's own
// beats and its timeSig is the printed meter. Downloading the score MIDIs again
// to serve as truth would be re-fetching what we already hold - and would risk
// grading the lane against a DIFFERENT edition from the one the app teaches.
//
// Thresholds are the ones committed before Gate 0 ever ran:
//   beat F1   >= 0.75 at +/-70ms      (Gate 0)
//   downbeat  >= 0.60 at +/-100ms     (Gate 1 timing arm)
import { readFileSync, existsSync } from 'node:fs';
import { parseMidi, midiNotes } from 'file:///C:/Users/markh/keys-piano/tools/midi.mjs';
import { inferMeter } from './meter.mjs';
import { chooseBar, unfoldPhrase } from './downbeat.mjs';

const W = 'C:/Users/markh/keys-piano-tools/workshop';
const verbose = process.argv.includes('--verbose');
const { SONGS } = await import('file:///C:/Users/markh/keys-piano/js/songs.mjs');

// group -> the recording of it that we hold
// [group, recording, score MIDI, quarter-beats per bar from the printed meter]
//
// ☠️ GRADE AGAINST THE ENGRAVED SCORE, NOT THE LIBRARY'S COPY OF IT. The first
// version used the imported song as truth, which is the same music AFTER
// quantisation to a 1/4-beat grid, rebasing and hand repair. Truth that has
// been through the pipeline is not truth: it dragged Moonlight's beat F1 from
// 0.872 down to 0.442 and made the model look broken when the yardstick had
// moved. The scores are small and free; fetch them.
const PAIRS = [
  ['moonlight-sonata', 'mvt1', 'moonlight1.mid', 4],
  ['gymnopedie-1', 'perf-gymnopedie-1', 'score-gymnopedie_1.mid', 3],
  ['arabesque-1', 'perf-arabesque-1', 'score-debussy_Arabesque_1.mid', 4],
  ['bach-prelude-c', 'perf-bach-prelude-c', 'score-wtk1-prelude1.mid', 4],
  ['rondo-alla-turca', 'perf-rondo-alla-turca', 'score-KV331_3_RondoAllaTurca.mid', 2],
  ['traumerei', 'perf-traumerei', 'score-SchumannOp15No07.mid', 4],
  ['goldberg-aria', 'perf-goldberg-aria', 'score-bwv-988-aria.mid', 3],
];

const events = (list, toSec) => {
  const by = new Map();
  for (const x of list) {
    const k = Math.round(x.b * 96);
    if (!by.has(k)) by.set(k, { t: toSec(x.b), ps: new Set() });
    by.get(k).ps.add(x.m % 12);
  }
  return [...by.values()].sort((a, b) => a.t - b.t);
};
const cost = (a, b) => { let i = 0; for (const x of a.ps) if (b.ps.has(x)) i++; return 1 - i / Math.max(a.ps.size, b.ps.size); };
const f1 = (est, truth, tol) => {
  let hit = 0; const used = new Set();
  for (const e of est) {
    let best = -1, bd = tol;
    truth.forEach((t, k) => { const d = Math.abs(t - e); if (d <= bd && !used.has(k)) { bd = d; best = k; } });
    if (best >= 0) { used.add(best); hit++; }
  }
  const p = est.length ? hit / est.length : 0, r = truth.length ? hit / truth.length : 0;
  return p + r ? (2 * p * r) / (p + r) : 0;
};

const rows = [];
for (const [group, stem, scoreFile, meterTrue] of PAIRS) {
  if (!existsSync(`${W}/${stem}.mid`) || !existsSync(`${W}/${stem}.beats.json`)) { rows.push({ group, note: 'no recording yet' }); continue; }
  if (!existsSync(`${W}/${scoreFile}`)) { rows.push({ group, note: 'no score midi' }); continue; }
  const scoreNotes = midiNotes(parseMidi(readFileSync(`${W}/${scoreFile}`)));
  const perf = midiNotes(parseMidi(readFileSync(`${W}/${stem}.mid`)));
  const sidecar = JSON.parse(readFileSync(`${W}/${stem}.beats.json`, 'utf8'));
  const P = events(perf, (b) => b * 0.5);
  const S = events(scoreNotes, (b) => b);
  const ratio = P.length / S.length;
  // ☠️ SAME PIECE, OR THE TRUTH IS FICTION. Gate 0's first run scored 0.187
  // because a 17-minute recording of a whole sonata was aligned to a score of
  // one movement, and the harness aligned it happily.
  if (ratio > 2.4 || ratio < 0.4) { rows.push({ group, note: `not the same piece (${P.length} vs ${S.length} events)` }); continue; }

  // DTW
  const n = P.length, m = S.length, band = Math.max(40, Math.round(m * 0.14));
  const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(Infinity)); D[0][0] = 0;
  for (let i = 1; i <= n; i++) {
    const c0 = Math.max(1, Math.round((i / n) * m) - band), c1 = Math.min(m, Math.round((i / n) * m) + band);
    for (let j = c0; j <= c1; j++) D[i][j] = cost(P[i - 1], S[j - 1]) + Math.min(D[i - 1][j - 1], D[i - 1][j] + 0.4, D[i][j - 1] + 0.4);
  }
  const pairs = []; let i = n, j = m;
  while (i > 0 && j > 0) { const d = D[i - 1][j - 1], u = D[i - 1][j], l = D[i][j - 1]; if (d <= u && d <= l) { pairs.push([P[i - 1].t, S[j - 1].t]); i--; j--; } else if (u <= l) i--; else j--; }
  pairs.reverse();
  const tt = pairs.map((p) => p[0]), sb = pairs.map((p) => p[1]);
  const at = (beat) => {
    if (beat <= sb[0]) return tt[0];
    if (beat >= sb[sb.length - 1]) return tt[tt.length - 1];
    let lo = 0, hi = sb.length - 1;
    while (hi - lo > 1) { const md = (lo + hi) >> 1; if (sb[md] <= beat) lo = md; else hi = md; }
    const f = (beat - sb[lo]) / Math.max(1e-9, sb[hi] - sb[lo]);
    return tt[lo] + f * (tt[hi] - tt[lo]);
  };
  const maxB = Math.floor(Math.max(...scoreNotes.map((x) => x.b)));
  const truthBars = []; for (let b = 0; b <= maxB; b += meterTrue) truthBars.push(at(b));
  const truthBeats = []; for (let b = 0; b <= maxB; b++) truthBeats.push(at(b));

  // --- the lane, seeing only the recording ---
  const notes = perf.map((x) => ({ t: x.b * 0.5, m: x.m, vel: x.vel }));
  const meta = inferMeter(sidecar, notes);
  const B = sidecar.beats, N = B.length;
  const nearest = (t) => { let lo = 0, hi = N - 1; while (hi - lo > 1) { const md = (lo + hi) >> 1; if (B[md] <= t) lo = md; else hi = md; } const k = (t - B[lo] <= B[hi] - t) ? lo : hi; return Math.abs(B[k] - t) <= 0.09 ? k : -1; };
  const bass = new Float64Array(N), pcs = Array.from({ length: N }, () => new Set());
  for (const x of notes) { const k = nearest(x.t); if (k < 0) continue; pcs[k].add(x.m % 12); if (x.m < 55) bass[k] += ((55 - x.m) / 24) * ((x.vel ?? 80) / 80); }
  const nov = new Float64Array(N);
  for (let k = 1; k < N; k++) { const a = pcs[k - 1], b = pcs[k]; if (!b.size) continue; let it = 0; for (const x of b) if (a.has(x)) it++; nov[k] = 1 - it / Math.max(1, Math.max(a.size, b.size)); }
  const z = (arr) => { const v = Array.from(arr); const mu = v.reduce((a, c) => a + c, 0) / v.length; const sd = Math.sqrt(v.reduce((a, c) => a + (c - mu) ** 2, 0) / v.length) || 1; return v.map((x) => (x - mu) / sd); };
  const zb = z(bass), zn = z(nov), za = z((sidecar.beat_accents ?? []).length === N ? sidecar.beat_accents : new Float64Array(N));
  const barSignal = zn.map((v, k) => v + 0.6 * zb[k] + 0.2 * za[k]);
  const iv = []; for (let k = 1; k < N; k++) iv.push(B[k] - B[k - 1]); iv.sort((a, b) => a - b);
  const beatSec = iv[Math.floor(iv.length / 2)];
  const sel = chooseBar(B, barSignal, [2, 3, 4, 6, 8, 9, 12, 16].map((p) => p * beatSec));
  let dn = [], halved = null, barSec = null;
  if (sel.ok) {
    const un = unfoldPhrase(B, zb, sel);
    dn = un.downbeats; halved = un.halved;
    const g = []; for (let k = 1; k < dn.length; k++) g.push(dn[k] - dn[k - 1]);
    g.sort((a, b) => a - b); barSec = g[Math.floor(g.length / 2)];
  }
  rows.push({
    group,
    meterTrue,
    meterGot: meta.ok ? meta.meter : null,
    meterOk: meta.ok && meta.meter === meterTrue,
    // ☠️ SCORE THE BEAT AT ITS OWN METRICAL LEVEL. librosa tracks whatever
    // pulse the music actually projects - for Moonlight that is the TRIPLET,
    // three per printed quarter. Comparing those to quarter-note truth scored
    // 0.442 for a tracker that is right; Gate 0 scanned levels and got 0.872.
    beatF1: +Math.max(...[3, 2, 1, 0.5, 1 / 3].map((mult) => {
      const t2 = []; for (let b = 0; b <= maxB; b += 1 / mult) t2.push(at(b));
      return f1(B, t2, 0.07);
    })).toFixed(3),
    barF1: dn.length ? +f1(dn, truthBars, 0.10).toFixed(3) : 0,
    truthBars: truthBars.length,
    gotBars: dn.length,
    halved,
    barSec: barSec ? +barSec.toFixed(2) : null,
    impliedBpm: barSec && meta.ok ? +(60 / (barSec / meterTrue)).toFixed(0) : null,
    heardBpm: meta.ok ? meta.beatBpm : null,
  });
}

console.log('piece                 meter        beatF1  barF1   bars(got/true)  bar-tempo vs heard');
for (const r of rows) {
  if (r.note) { console.log(`${r.group.padEnd(21)} ${r.note}`); continue; }
  const mk = r.meterOk ? '✓' : '✗';
  console.log(`${r.group.padEnd(21)} ${String(r.meterGot ?? '?')}/4 vs ${r.meterTrue}/4 ${mk}  ${String(r.beatF1).padStart(6)}  ${String(r.barF1).padStart(5)}   ${String(r.gotBars).padStart(4)}/${String(r.truthBars).padEnd(4)}${r.halved ? ' halved' : '       '}  ${r.impliedBpm}bpm vs ${r.heardBpm}bpm`);
}
const scored = rows.filter((r) => !r.note);
if (scored.length) {
  const mOk = scored.filter((r) => r.meterOk).length;
  const bOk = scored.filter((r) => r.barF1 >= 0.60).length;
  const beatOk = scored.filter((r) => r.beatF1 >= 0.75).length;
  console.log(`\nCORPUS: ${scored.length} pieces with score + performance`);
  console.log(`  meter correct        ${mOk}/${scored.length}`);
  console.log(`  beat F1 >= 0.75      ${beatOk}/${scored.length}`);
  console.log(`  downbeat F1 >= 0.60  ${bOk}/${scored.length}`);
}
