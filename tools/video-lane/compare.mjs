// Consistency check: the video's note stream against a machine transcription
// of the SAME video's audio.
//
//   node compare.mjs <events.json> <transcribed.mid>
//
// ☠️ THIS IS A CONSISTENCY CHECK, NOT GROUND TRUTH. Two machines agreeing
// proves agreement, not correctness, and these two are not fully independent
// (one render, one performance, possibly one source MIDI). It can only catch
// gross pitch or timing error. Hands it cannot judge at all: audio has none.
//
// The video's onsets are early by a fixed amount - the watched band sits above
// the strike line, so a bar is seen before it lands. That latency is estimated
// here ONCE by scanning offsets for the best match, then reported so it can be
// locked into the template profile and tested unchanged on held-out footage.
import { readFileSync } from 'node:fs';
// this folder lives twice: in the app repo as tools/video-lane (midi.mjs is one
// level up) and in keys-piano-tools (the app copy is a sibling tree). Resolve
// whichever exists rather than hard-coding one and dying in the other.
import { existsSync } from 'node:fs';
const MIDI = [new URL('../midi.mjs', import.meta.url), new URL('../../keys-piano/tools/midi.mjs', import.meta.url)].find((u) => existsSync(u));
if (!MIDI) { console.error('cannot find tools/midi.mjs from ' + import.meta.url); process.exit(2); }
const { parseMidi, midiNotes } = await import(MIDI.href);

const [eventsPath, midPath] = process.argv.slice(2);
const ev = JSON.parse(readFileSync(eventsPath, 'utf8'));
const mid = parseMidi(readFileSync(midPath));

// transcription note beats -> seconds using the file's own tempo map
const q = mid.ticksPerQuarter;
const tempo = mid.tempos[0]?.usPerQuarter ?? 500000;
const secPerTick = tempo / 1e6 / q;
const audio = midiNotes(mid).map((n) => ({ t: n.tick * secPerTick, m: n.m })).sort((a, b) => a.t - b.t);
const video = ev.events.map((e) => ({ t: e.on, m: e.midi })).sort((a, b) => a.t - b.t);

const TOL = 0.08;

// greedy nearest match within tolerance, each note used once
function match(vs, as) {
  const usedA = new Uint8Array(as.length);
  const pairs = [];
  for (const v of vs) {
    let best = -1, bestD = Infinity;
    for (let j = 0; j < as.length; j++) {
      if (usedA[j] || as[j].m !== v.m) continue;
      const d = Math.abs(as[j].t - v.t);
      if (d > TOL) continue;
      if (d < bestD) { bestD = d; best = j; }
    }
    if (best >= 0) { usedA[best] = 1; pairs.push([v, as[best], bestD]); }
  }
  return pairs;
}

const score = (pairs, nv, na) => {
  const p = pairs.length / Math.max(1, nv);
  const r = pairs.length / Math.max(1, na);
  return { p, r, f1: (p + r) ? 2 * p * r / (p + r) : 0 };
};

// ☠️ MOST MATCHES IS NOT BEST ALIGNED. The match count plateaus: with an 80ms
// window, every offset from 35ms to 150ms matched the same 261 notes, and
// taking the first maximum picked 35ms while the true latency was 95ms - which
// is exactly why the residual error read a suspicious 60ms. Find the plateau,
// then centre inside it on the MEDIAN difference of the pairs it matched.
let bestOff = 0, bestN = -1;
for (let off = -0.60; off <= 0.60; off += 0.005) {
  const n = match(video.map((v) => ({ t: v.t + off, m: v.m })), audio).length;
  if (n > bestN) { bestN = n; bestOff = off; }
}
for (let i = 0; i < 3; i++) {
  const ps = match(video.map((v) => ({ t: v.t + bestOff, m: v.m })), audio);
  if (!ps.length) break;
  const ds = ps.map((p) => p[1].t - p[0].t).sort((a, b) => a - b);
  bestOff += ds[Math.floor(ds.length / 2)];
}
const shifted = video.map((v) => ({ t: v.t + bestOff, m: v.m }));
const pairs = match(shifted, audio);
const overall = score(pairs, shifted.length, audio.length);

// worst 30-second window
let worst = { f1: Infinity, at: null };
const end = Math.max(...audio.map((a) => a.t), ...shifted.map((v) => v.t));
for (let w = 0; w + 30 <= end; w += 5) {
  const vs = shifted.filter((v) => v.t >= w && v.t < w + 30);
  const as = audio.filter((a) => a.t >= w && a.t < w + 30);
  if (vs.length < 10 || as.length < 10) continue;
  const s = score(match(vs, as), vs.length, as.length);
  if (s.f1 < worst.f1) worst = { f1: s.f1, at: w, nv: vs.length, na: as.length };
}

const errs = pairs.map((p) => Math.abs(p[2])).sort((a, b) => a - b);
console.log(`video events ${video.length}, audio notes ${audio.length}`);
console.log(`best constant latency ${(bestOff * 1000).toFixed(0)}ms (video seen before it sounds)`);
console.log(`matched ${pairs.length}  precision ${overall.p.toFixed(3)}  recall ${overall.r.toFixed(3)}  F1 ${overall.f1.toFixed(3)}`);
if (errs.length) console.log(`onset error median ${(errs[Math.floor(errs.length / 2)] * 1000).toFixed(0)}ms, p90 ${(errs[Math.floor(errs.length * 0.9)] * 1000).toFixed(0)}ms`);
console.log(worst.at === null ? 'no comparable 30s window' : `worst 30s window at ${worst.at}s: F1 ${worst.f1.toFixed(3)} (${worst.nv} video, ${worst.na} audio)`);

const PASS_F1 = 0.90, PASS_WORST = 0.75;
const ok = overall.f1 >= PASS_F1 && (worst.at === null || worst.f1 >= PASS_WORST);
console.log(ok ? 'PASS against the committed thresholds' : `FAIL: committed F1 >= ${PASS_F1} and worst-window >= ${PASS_WORST}`);
process.exit(ok ? 0 : 1);
