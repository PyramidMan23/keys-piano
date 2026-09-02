// Video-lane geometry gate: locate the drawn keyboard in falling-note frames and
// map every key to an x-range. REFUSES unless it finds exactly 52 white + 36 black
// keys with the black keys in the true 88-key pattern anchored at A0.
//
//   node calibrate.mjs <frame1.png> [frame2.png ...] --out geometry.json
//
// Uses the MEDIAN across the given frames so a key pressed (tinted) in one frame
// is clean in the others. Thresholds live in THRESHOLDS.md; a refusal names its
// reason and exits 1.
import { writeFileSync } from 'node:fs';
import { decodeImage, lum } from './rawframe.mjs';

const args = process.argv.slice(2);
const outIx = args.indexOf('--out');
const outPath = outIx >= 0 ? args[outIx + 1] : 'geometry.json';
const frames = args.filter((a, i) => a.endsWith('.png') && i !== outIx + 1);
if (!frames.length) { console.error('no frames given'); process.exit(1); }

const bufs = frames.map(decodeImage);
const W = 1920, H = Math.round(bufs[0].length / 3 / W);
if (H * W * 3 !== bufs[0].length) { console.error(`REFUSE: frame is not ${W}px wide (got ${bufs[0].length / 3} px total)`); process.exit(1); }

// A pressed key is tinted in a frame, so no single frame (and not even the
// median) shows every key at rest. But every key is at rest in SOME frame:
// whites take the per-pixel MAX across frames (rest = bright), blacks the MIN
// (rest = dark), and the tinted frames simply lose.
const aggRow = (y, mode) => {
  const row = Buffer.alloc(W * 3);
  for (let x = 0; x < W * 3; x++) {
    let v = bufs[0][y * W * 3 + x];
    for (let f = 1; f < bufs.length; f++) {
      const c = bufs[f][y * W * 3 + x];
      if (mode === 'max' ? c > v : c < v) v = c;
    }
    row[x] = v;
  }
  return row;
};
const medRow = (y) => {
  const row = Buffer.alloc(W * 3);
  const vals = new Array(bufs.length);
  for (let x = 0; x < W * 3; x++) {
    for (let f = 0; f < bufs.length; f++) vals[f] = bufs[f][y * W * 3 + x];
    vals.sort((a, b) => a - b);
    row[x] = vals[Math.floor(vals.length / 2)];
  }
  return row;
};
const rowMeanLum = (row) => {
  let s = 0;
  for (let x = 0; x < W; x++) s += lum(row[x * 3], row[x * 3 + 1], row[x * 3 + 2]);
  return s / W;
};

// ---- 1. keyboard top: topmost row of the contiguous bright bottom block ----
const means = [];
for (let y = H - 1; y >= 0; y--) means[y] = rowMeanLum(medRow(y));
let yK = -1;
// the encoder leaves a 1-2px dark border on the bottom edge, so probe above it
if (means[H - 8] < 60) { console.error(`REFUSE: bottom of frame is not a bright keyboard (mean ${means[H - 8].toFixed(0)})`); process.exit(1); }
for (let y = H - 8; y >= 0; y--) {
  if (means[y] < 60) { yK = y + 1; break; }
}
if (yK < 0 || yK > H - 60) { console.error(`REFUSE: no keyboard band found (yK=${yK})`); process.exit(1); }
const kh = H - yK;

// ---- 2. white keys: bright runs on a row below the black keys ----
const yW = yK + Math.round(kh * 0.85);
const rowW = medRow(yW);
const runs = [];
let start = -1;
for (let x = 0; x < W; x++) {
  // white keys sit at ~210, the separator dips reach ~100-118: break at 140
  const bright = lum(rowW[x * 3], rowW[x * 3 + 1], rowW[x * 3 + 2]) > 140;
  if (bright && start < 0) start = x;
  if (!bright && start >= 0) { if (x - start >= 6) runs.push([start, x - 1]); start = -1; }
}
if (start >= 0 && W - start >= 6) runs.push([start, W - 1]);

// ---- 3. black keys: dark runs on a row through the black-key region ----
const yB = yK + Math.round(kh * 0.30);
const rowB = medRow(yB);
const blacks = [];
start = -1;
for (let x = 0; x < W; x++) {
  const dark = lum(rowB[x * 3], rowB[x * 3 + 1], rowB[x * 3 + 2]) < 70;
  if (dark && start < 0) start = x;
  if (!dark && start >= 0) { if (x - start >= 8) blacks.push([start, x - 1]); start = -1; }
}
if (start >= 0 && W - start >= 8) blacks.push([start, W - 1]);

console.log(`keyboard top y=${yK} (height ${kh}), white runs=${runs.length} at y=${yW}, black runs=${blacks.length} at y=${yB}`);
if (blacks.length !== 36) { console.error(`REFUSE: expected 36 black keys, found ${blacks.length}`); process.exit(1); }

// ☠️ DO NOT PATCH A MISSING KEY FROM ITS NEIGHBOUR'S WIDTH. A key held down
// through most of the sampled frames is tinted in the median and its bright
// run simply is not there, so the detected runs have holes. An earlier version
// filled each hole by stepping one median pitch off the previous run; that put
// a "white key" at x=924, squarely on top of black key 63 (x 916-935), and the
// extractor then sampled a black key every time it looked for E4.
//
// White keys in this renderer are uniformly spaced by construction (measured
// widths 34-36 across the board), so the honest reconstruction is to FIT the
// grid to every run that WAS found and generate all 52 from the fit. Each
// detected run must then land on its predicted slot, or the layout is not a
// uniform 88-key keyboard and we refuse.
{
  // A run touching the frame edge is CLIPPED, so its start is the edge, not
  // the key. Slot 0 read x=0 for a key the fit puts at -4.8, and that single
  // clipped key was the only residual over 1px in the whole keyboard. Judge
  // the grid on the keys the frame actually shows in full.
  const clipped = new Set();
  runs.forEach((r, i) => { if (r[0] <= 0 || r[1] >= W - 1) clipped.add(i); });
  const fitRuns = runs.filter((_, i) => !clipped.has(i));
  const starts = fitRuns.map((r) => r[0]);
  // the pitch is the MEDIAN step between consecutive detected runs, not the
  // span over the count: a missing key inflates the latter and every index
  // after the hole then walks off the grid (it read a 21px residual).
  const steps = [];
  for (let i = 1; i < starts.length; i++) steps.push(starts[i] - starts[i - 1]);
  steps.sort((x, y) => x - y);
  const pitch0 = steps[Math.floor(steps.length / 2)];
  const idx = [0];
  for (let i = 1; i < starts.length; i++) idx.push(idx[i - 1] + Math.max(1, Math.round((starts[i] - starts[i - 1]) / pitch0)));
  // least squares x0 = a + b*i over the detected runs
  const n = idx.length;
  const si = idx.reduce((a, c) => a + c, 0), sx = starts.reduce((a, c) => a + c, 0);
  const sii = idx.reduce((a, c) => a + c * c, 0), six = idx.reduce((a, c, k) => a + c * starts[k], 0);
  const b = (n * six - si * sx) / (n * sii - si * si);
  const a = (sx - b * si) / n;
  const widths = fitRuns.map((r) => r[1] - r[0] + 1).sort((x, y) => x - y);
  const wMed = widths[Math.floor(widths.length / 2)];
  let worst = 0;
  for (let k = 0; k < n; k++) worst = Math.max(worst, Math.abs(starts[k] - (a + b * idx[k])));
  if (worst > 4) { console.error(`REFUSE: white keys are not uniformly spaced (worst residual ${worst.toFixed(1)}px); this is not the expected keyboard`); process.exit(1); }
  // idx counts slots from the first UNCLIPPED run, so shift it back over the
  // clipped runs at the left edge to get absolute slots, and require the whole
  // keyboard - clipped, detected and tinted-away keys together - to be 52.
  const firstFit = runs.findIndex((_, i) => !clipped.has(i));
  const lastFit = runs.length - 1 - [...runs].reverse().findIndex((_, i) => !clipped.has(runs.length - 1 - i));
  let leftClipped = 0;
  for (let i = 0; i < firstFit; i++) if (clipped.has(i)) leftClipped++;
  let rightClipped = 0;
  for (let i = lastFit + 1; i < runs.length; i++) if (clipped.has(i)) rightClipped++;
  const lastSlot = idx[idx.length - 1] + leftClipped + rightClipped;
  if (lastSlot !== 51) { console.error(`REFUSE: the white keys span ${lastSlot + 1} slots, not 52`); process.exit(1); }
  const abs = idx.map((v) => v + leftClipped);
  const missing = [];
  for (let i = 0; i <= 51; i++) if (!abs.includes(i)) missing.push(i);
  runs.length = 0;
  for (let i = 0; i <= 51; i++) { const x0 = Math.round(a + b * (i - leftClipped)); runs.push([x0, x0 + wMed - 1]); }
  console.log(`white grid fitted: pitch ${b.toFixed(2)}px, width ${wMed}px, worst residual ${worst.toFixed(1)}px` +
    (missing.length ? `; ${missing.length} key(s) were tinted in every sampled frame and came from the fit (slots ${missing.join(',')})` : ''));
}
if (runs.length !== 52) { console.error(`REFUSE: expected 52 white keys, built ${runs.length}`); process.exit(1); }

// ---- 4. anchor: leftmost white = A0 (21); verify the black pattern ----------
// white letter sequence from A: A B C D E F G A ...
const whiteSemis = { A: 0, B: 2, C: 3, D: 5, E: 7, F: 8, G: 10 }; // offset from A within the octave walk
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const whiteMidi = [];
{
  let midi = 21; // A0
  let li = 0;
  for (let i = 0; i < 52; i++) {
    whiteMidi.push(midi);
    const cur = letters[li], next = letters[(li + 1) % 7];
    // semitone step to the next white key: E->F and B->C are 1, everything else 2
    midi += (cur === 'E' || cur === 'B') ? 1 : 2;
    li = (li + 1) % 7;
  }
  if (whiteMidi[51] !== 108) { console.error(`internal: white walk ended at ${whiteMidi[51]}, expected 108`); process.exit(1); }
}
// expected black key between white i and i+1 wherever the step is 2
const expectedBlacks = [];
for (let i = 0; i < 51; i++) if (whiteMidi[i + 1] - whiteMidi[i] === 2) expectedBlacks.push({ midi: whiteMidi[i] + 1, between: i });
if (expectedBlacks.length !== 36) { console.error('internal: expected-black count wrong'); process.exit(1); }
// each detected black run's centre must fall between its white pair's centres
const centre = ([a, b]) => (a + b) / 2;
const blackMidi = [];
for (let bi = 0; bi < 36; bi++) {
  const exp = expectedBlacks[bi];
  const c = centre(blacks[bi]);
  const lo = centre(runs[exp.between]), hi = centre(runs[exp.between + 1]);
  if (!(c > lo && c < hi)) {
    console.error(`REFUSE: black key ${bi} centre x=${c.toFixed(0)} not between white ${exp.between} (${lo.toFixed(0)}) and ${exp.between + 1} (${hi.toFixed(0)}) - layout does not match an 88-key A0-anchored keyboard`);
    process.exit(1);
  }
  blackMidi.push(exp.midi);
}

// ---- 5. emit ---------------------------------------------------------------
const keys = [];
for (let i = 0; i < 52; i++) keys.push({ midi: whiteMidi[i], x0: runs[i][0], x1: runs[i][1], black: false });
for (let i = 0; i < 36; i++) keys.push({ midi: blackMidi[i], x0: blacks[i][0], x1: blacks[i][1], black: true });
keys.sort((a, b) => a.midi - b.midi);
const geometry = {
  width: W, height: H, keyboardTopY: yK,
  // the occupancy band the extractor watches: just above the keyboard, clear of
  // the glow line that sits on the boundary itself
  bandY0: yK - 16, bandY1: yK - 6,
  keys,
  frames: frames.map(String),
};
writeFileSync(outPath, JSON.stringify(geometry, null, 1));
console.log(`OK: 52 white + 36 black, A0 at x=${runs[0][0]}-${runs[0][1]}, C8 at x=${runs[51][0]}-${runs[51][1]}; wrote ${outPath}`);
