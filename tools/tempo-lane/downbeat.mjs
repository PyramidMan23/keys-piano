// GATE 1, TIMING ARM: WHERE IS EACH BAR LINE?
//
// Knowing a song is in 3/4 is one number. Drawing bar lines is a POSITION for
// every bar across minutes of music, and the obvious method - take the meter
// model's phase and step every P tracked beats - fails, measured:
//
//   best possible F1 at the true period, over ALL 12 phases:  0.190
//
// Even the best phase caps there, so phase choice was never the problem.
// librosa's beat COUNT between real bars is not constant: it inserts and drops
// beats where the audio is ambiguous, so "every Pth beat" slides off the music
// and never comes back. Counting cannot work. The tracker has to RE-ANCHOR on
// evidence at every bar, and that is a dynamic program.
//
// dp[k] = the best-scoring sequence of bar lines that ends with a bar at
// tracked beat k. Moving from bar j to bar k earns the evidence at k and pays
// for how far the bar length strays:
//
//   - from the song's own bar length (loose: songs change tempo)
//   - from the PREVIOUS bar length (tight: they do not change it abruptly)
//
// ☠️ PENALISE THE RATIO, NOT THE DIFFERENCE. A 200ms error means nothing in a
// 6-second Moonlight bar and is a quarter of a Married Life bar. log(dt/target)
// squared is scale-free, so one weight works for both without tuning per song.
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function trackDownbeats(beats, barSignal, targetSec, opts = {}) {
  const n = beats.length;
  const LO = opts.lo ?? 0.55, HI = opts.hi ?? 1.8;       // allowed bar length, x target
  const W_GLOBAL = opts.wGlobal ?? 1.1;                  // pull toward the song's bar length
  const W_LOCAL = opts.wLocal ?? 3.0;                    // pull toward the previous bar
  // ☠️ CHARGE FOR EVERY BAR, OR THE DP ALWAYS PREFERS MORE OF THEM. Each bar
  // line adds its own evidence to the total, so without a fixed cost the best
  // scoring sequence is the one that cuts the music into the most pieces: given
  // the TRUE bar length for Moonlight the tracker still returned 76 bars where
  // there are 69, and at shorter targets it happily found 229. This is the
  // model-selection term that makes "fewer, better-justified bar lines" win.
  const BAR_COST = opts.barCost ?? 1.0;
  if (n < 8 || !(targetSec > 0)) return { ok: false, why: 'not enough beats or no bar length' };

  // candidate predecessors for k: beats whose gap to k is a plausible bar
  const span = [];
  for (let k = 0; k < n; k++) {
    let lo = k, hi = k;
    while (lo > 0 && beats[k] - beats[lo - 1] <= targetSec * HI) lo--;
    while (hi > 0 && beats[k] - beats[hi] < targetSec * LO) hi--;
    span.push([lo, hi]);
  }

  // second order: the state carries the PREVIOUS bar length, so tempo
  // continuity can be judged. Stored as dp[k] = best over predecessors, with
  // the winning predecessor's own interval remembered for the next hop.
  const dp = new Float64Array(n).fill(-Infinity);
  const prev = new Int32Array(n).fill(-1);
  const lastIv = new Float64Array(n).fill(targetSec);
  for (let k = 0; k < n; k++) {
    // a bar line may simply start here (no predecessor), paying a small entry cost
    dp[k] = barSignal[k] - 1.5;
    const [lo, hi] = span[k];
    for (let j = lo; j <= hi; j++) {
      if (dp[j] === -Infinity) continue;
      const dt = beats[k] - beats[j];
      if (dt <= 0) continue;
      const gGlobal = Math.log(dt / targetSec);
      const gLocal = Math.log(dt / lastIv[j]);
      const score = dp[j] + barSignal[k] - BAR_COST - W_GLOBAL * gGlobal * gGlobal - W_LOCAL * gLocal * gLocal;
      if (score > dp[k]) { dp[k] = score; prev[k] = j; lastIv[k] = dt; }
    }
  }

  // best ending, then walk back
  let end = 0;
  for (let k = 1; k < n; k++) if (dp[k] > dp[end]) end = k;
  const idx = [];
  for (let k = end; k >= 0; k = prev[k]) { idx.push(k); if (prev[k] < 0) break; }
  idx.reverse();
  const times = idx.map((k) => beats[k]);
  const ivs = [];
  for (let i = 1; i < times.length; i++) ivs.push(times[i] - times[i - 1]);
  ivs.sort((a, b) => a - b);
  return {
    ok: true,
    downbeats: times,
    beatIndex: idx,
    bars: times.length,
    medianBarSec: ivs.length ? +ivs[Math.floor(ivs.length / 2)].toFixed(3) : null,
    // how steady the result is: a tracker that keeps changing its mind about
    // bar length is guessing, and this number says so out loud
    barCv: ivs.length > 3 ? +(Math.sqrt(ivs.reduce((a, c) => a + (c - ivs.reduce((x, y) => x + y, 0) / ivs.length) ** 2, 0) / ivs.length) / (ivs.reduce((x, y) => x + y, 0) / ivs.length)).toFixed(3) : null,
  };
}


// WHICH BAR LENGTH IS THE RIGHT ONE? Ask the tracker, not the evidence total.
//
// ☠️ MEAN EVIDENCE PER BAR CANNOT CHOOSE: it rises monotonically with longer
// bars (1.07 -> 1.97 across the sweep on Moonlight) because fewer bar lines are
// always individually better justified. Total score cannot choose either - it
// rises with MORE bars. Both are degenerate.
//
// What does discriminate is SELF-CONSISTENCY. Run the tracker at a candidate
// bar length and see where it settles: given the truth it stays put, given a
// wrong length the evidence drags it away. Moonlight, truth 12 tracked beats:
//
//   target  8 (3.90s) -> median 3.46s   ratio 0.89
//   target 12 (5.86s) -> median 6.01s   ratio 1.03   <- the fixed point, and the truth
//   target 16 (7.81s) -> median 6.18s   ratio 0.79
//
// The right bar length is the one the tracker agrees with.
export function chooseBar(beats, barSignal, candidateSecs, opts = {}) {
  // ☠️ AND IT MUST COVER THE MUSIC. Self-consistency alone picked a bar length
  // of 1.46s on Moonlight with the lowest drift of all - by finding FOURTEEN
  // bars spanning 21 seconds of a seven-minute piece and stopping. A short
  // stretch of music that happens to be very regular is the easiest thing in
  // the world to agree with, and it is not a bar map. Any candidate that does
  // not span most of the recording is not in the running.
  const audioSpan = beats[beats.length - 1] - beats[0];
  const MIN_COVER = opts.minCover ?? 0.75;
  const runs = [];
  for (const target of candidateSecs) {
    const r = trackDownbeats(beats, barSignal, target, opts);
    if (!r.ok || !r.medianBarSec || r.bars < 6) continue;
    const cover = (r.downbeats[r.downbeats.length - 1] - r.downbeats[0]) / audioSpan;
    if (cover < MIN_COVER) continue;
    runs.push({ target: +target.toFixed(3), ...r, cover: +cover.toFixed(3), drift: Math.abs(Math.log(r.medianBarSec / target)) });
  }
  if (!runs.length) return { ok: false, why: 'no candidate bar length produced a usable segmentation' };
  runs.sort((a, b) => a.drift - b.drift);
  const win = runs[0];
  return {
    ok: true,
    ...win,
    // how much better the winner agrees with itself than the runner-up: a
    // small gap means the piece does not commit to one bar length, and the
    // caller should refuse rather than draw lines it cannot justify
    consistencyMargin: +((runs[1] ? runs[1].drift : 1) - win.drift).toFixed(4),
    all: runs.map((r) => ({ target: r.target, median: r.medianBarSec, bars: r.bars, cover: r.cover, drift: +r.drift.toFixed(3) })),
  };
}


// ☠️ A REGULAR PHRASE LOOKS EXACTLY LIKE A LONG BAR. Pop harmony usually moves
// every TWO bars, so the steadiest period in the music is often the phrase, not
// the bar: the tracker returned 6.00 tracked beats for Married Life where the
// meter is 3, and 2 bars of Coffin Dance as one. Self-consistency cannot see
// the difference - a two-bar phrase is exactly as self-consistent as a bar.
//
// The BASS can. If the midpoint between two "bar lines" carries nearly as much
// bass as the lines themselves, those midpoints are bar lines too. Measured:
//
//   Married Life  midpoint bass / downbeat bass = 0.68  -> really two bars
//   Coffin Dance                                  0.78  -> really two bars
//   Moonlight                                     0.28  -> a real bar
//
// Halving Married Life gives 0.975s, which is the 0.98s I measured directly
// from the spacing of Kyle's bass roots - an independent check that agrees.
export function unfoldPhrase(beats, bassZ, chosen, opts = {}) {
  const RATIO = opts.ratio ?? 0.5;
  const dn = chosen.downbeats;
  if (dn.length < 6) return { halved: false, downbeats: dn, bassRatio: null };
  const at = (t) => {
    let lo = 0, hi = beats.length - 1;
    while (hi - lo > 1) { const md = (lo + hi) >> 1; if (beats[md] <= t) lo = md; else hi = md; }
    const k = (t - beats[lo] <= beats[hi] - t) ? lo : hi;
    return Math.abs(beats[k] - t) <= 0.12 ? k : -1;
  };
  const mean = (ts) => {
    const v = ts.map(at).filter((k) => k >= 0).map((k) => bassZ[k]);
    return v.length ? v.reduce((a, c) => a + c, 0) / v.length : 0;
  };
  const mids = [];
  for (let i = 0; i < dn.length - 1; i++) mids.push((dn[i] + dn[i + 1]) / 2);
  const dB = mean(dn), mB = mean(mids);
  const ratio = dB > 0 ? mB / dB : 0;
  if (ratio < RATIO) return { halved: false, downbeats: dn, bassRatio: +ratio.toFixed(3) };
  const merged = [];
  for (let i = 0; i < dn.length - 1; i++) { merged.push(dn[i]); merged.push(mids[i]); }
  merged.push(dn[dn.length - 1]);
  return { halved: true, downbeats: merged, bassRatio: +ratio.toFixed(3) };
}

// Bar lines every learner sees are BEATS too: given bar lines and a meter,
// place the intermediate beats by even division in TIME, which is what a
// listener hears through rubato.
export function beatsWithinBars(downbeats, meter) {
  const out = [];
  for (let i = 0; i < downbeats.length - 1; i++) {
    const a = downbeats[i], b = downbeats[i + 1];
    for (let m = 0; m < meter; m++) out.push({ t: a + ((b - a) * m) / meter, beat: m + 1, bar: i + 1 });
  }
  return out;
}
