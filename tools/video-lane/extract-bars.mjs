// Video-lane extractor for FILMED keyboards: read the falling bars, not the keys.
//
//   node extract-bars.mjs <video> <geometry.json> --out events.json [--band 40:70] [--lit 80]
//
// On a render (Sheet Music Boss) the drawn keys tint when pressed, which is the
// cleanest signal there is. On a filmed piano the played finger sits ON the key
// it plays (Codex: occlusion is selection bias, not an edge case), so the key
// cannot be read; the bars can, because they fall ABOVE the hands. A bar's
// bottom edge reaches the strike line at the moment the note sounds, so this
// watches a band a little above the strike line, per key column, and takes a
// column going lit as the onset (early by a fixed lane latency, measured once
// per template against the audio and locked, exactly like the SMB latency).
// Particles are the risk: they are sparse and brief, a bar is solid and lasts,
// so the column must be MOSTLY lit for HYST frames. Colour is recorded but
// means pitch position here, never hand.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const [videoPath, geoPath] = args.filter((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1].startsWith('--')));
const outPath = flag('out', 'events.json');
const [bandUp0, bandUp1] = flag('band', '40:70').split(':').map(Number);   // px above the strike line
const LIT = Number(flag('lit', 80));
const ON_FRAC = 0.6, HYST = 3;
let FPS = 60;   // corrected from the first two PTS: Patrik Pietschmann is 25fps, Erik C 60
const geo = JSON.parse(readFileSync(geoPath, 'utf8'));
const W = geo.width;

// crop from well above the band down through the keyboard (even geometry, PTS, size assert: same traps as extract.mjs)
const bandY0 = geo.keyboardTopY - bandUp1, bandY1 = geo.keyboardTopY - bandUp0;
const cropTop = bandY0 - (bandY0 % 2);
const cropH = (geo.height - cropTop) - ((geo.height - cropTop) % 2);
const frameBytes = W * cropH * 3;
const kh = (geo.keyboardBottomY ?? geo.height - 1) - geo.keyboardTopY + 1;   // the keys, not everything under them
const rowBand0 = bandY0 - cropTop, rowBand1 = bandY1 - cropTop;
const yWhite = (geo.keyboardTopY + Math.round(kh * 0.6)) - cropTop;
const yBlack = (geo.keyboardTopY + Math.round(kh * 0.25)) - cropTop;
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const keys = geo.keys;
const cols = keys.map((k) => {
  let x0 = k.x0, x1 = k.x1;
  if (!k.black) for (const b of keys) { if (!b.black) continue; if (b.x0 <= x0 && b.x1 >= x0) x0 = b.x1 + 1; if (b.x1 >= x1 && b.x0 <= x1) x1 = b.x0 - 1; }
  const w = x1 - x0 + 1, inset = Math.max(1, Math.round(w * 0.3));
  return { midi: k.midi, black: k.black, x0: Math.max(0, x0 + inset), x1: Math.min(W - 1, x1 - inset) };
});

const ff = spawn('ffmpeg', ['-v', 'info', '-i', videoPath, '-vf', `crop=${W}:${cropH}:0:${cropTop},showinfo`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { stdio: ['ignore', 'pipe', 'pipe'] });
const pts = []; let saw = false, closed = false;
createInterface({ input: ff.stderr }).on('line', (l) => {
  const sz = l.match(/Parsed_showinfo.*\bs:(\d+)x(\d+)/);
  if (sz && (+sz[1] !== W || +sz[2] !== cropH)) { console.error(`REFUSE: ffmpeg emitted ${sz[1]}x${sz[2]}, asked ${W}x${cropH}`); process.exit(1); }
  const m = l.match(/Parsed_showinfo.*\bn:\s*(\d+).*pts_time:\s*([\d.]+)/);
  if (m) { saw = true; pts.push(+m[2]); if (pts.length === 2 && pts[1] > pts[0]) FPS = Math.round(1 / (pts[1] - pts[0])); drain(); }
});

// scene gate for a filmed keyboard: most black-key centres dark, most white-key centres brighter than them
const whiteC = cols.filter((c) => !c.black).map((c) => (c.x0 + c.x1) >> 1), blackC = cols.filter((c) => c.black).map((c) => (c.x0 + c.x1) >> 1);
// hands cover keys, so this is a share: at least half the white centres must
// read brighter than 1.6x the MEDIAN black centre
const sceneOk = (buf) => {
  const bl = blackC.map((x) => { const i = (yBlack * W + x) * 3; return lum(buf[i], buf[i + 1], buf[i + 2]); }).sort((a, b) => a - b);
  const medB = bl[bl.length >> 1];
  let ok = 0;
  for (const x of whiteC) { const i = (yWhite * W + x) * 3; if (lum(buf[i], buf[i + 1], buf[i + 2]) > medB * 1.6 + 10) ok++; }
  return ok / whiteC.length >= 0.5;
};

const state = cols.map(() => ({ on: false, run: 0, gap: 0, onT: 0, sum: null }));
const events = []; let frameIdx = 0, skipped = 0, settle = 12, pending = Buffer.alloc(0);
const close = (ci, t) => { const s = state[ci]; const n = s.sum[3]; events.push({ midi: cols[ci].midi, on: +s.onT.toFixed(4), off: +t.toFixed(4), rgb: [s.sum[0] / n, s.sum[1] / n, s.sum[2] / n].map(Math.round) }); s.on = false; s.sum = null; };
const processFrame = (buf, t) => {
  if (!sceneOk(buf)) { skipped++; settle = 12; for (const s of state) { s.on = false; s.run = 0; s.gap = 0; s.sum = null; } return; }
  if (settle > 0) { settle--; return; }
  // ☠️ A BAR IS WIDER THAN ITS KEY'S CENTRE STRIP, AND IT GLOWS. At one
  // instant with two keys truly lit the first pass reported five: the bar
  // and its bloom spill into the neighbouring columns. Measure every column
  // first, then keep only the columns that are a LOCAL MAXIMUM of lit share
  // against their immediate neighbours (non-maximum suppression); a spill is
  // always weaker than the bar that caused it.
  const meas = cols.map((c) => {
    let lit = 0, n = 0, r = 0, g = 0, b = 0;
    for (let y = rowBand0; y <= rowBand1; y++) { const row = y * W * 3; for (let x = c.x0; x <= c.x1; x++) { const i = row + x * 3; n++; const L = lum(buf[i], buf[i + 1], buf[i + 2]); if (L > LIT) { lit++; r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; } } }
    return { frac: lit / n, lit, r, g, b };
  });
  // neighbours in pixel order, not midi order
  const order = cols.map((c, i) => i).sort((a, b) => cols[a].x0 - cols[b].x0);
  const pos = new Map(order.map((ci, k) => [ci, k]));
  for (let ci = 0; ci < cols.length; ci++) {
    const m = meas[ci]; const k = pos.get(ci);
    const left = k > 0 ? meas[order[k - 1]].frac : 0, right = k < order.length - 1 ? meas[order[k + 1]].frac : 0;
    const peak = m.frac >= left && m.frac >= right;
    const lit = m.lit, r = m.r, g = m.g, b = m.b;
    const covered = peak && m.frac > ON_FRAC; const s = state[ci];
    if (covered) { s.gap = 0; s.run++; if (!s.on && s.run >= HYST) { s.on = true; s.onT = t - (s.run - 1) / FPS; s.sum = [0, 0, 0, 0]; } if (s.on) { s.sum[0] += r / lit; s.sum[1] += g / lit; s.sum[2] += b / lit; s.sum[3]++; } }
    else { s.run = 0; if (s.on) { s.gap++; if (s.gap >= HYST) close(ci, t - (s.gap - 1) / FPS); } }
  }
};
function drain() {
  while (pending.length >= frameBytes && frameIdx < pts.length) { processFrame(pending.subarray(0, frameBytes), pts[frameIdx]); frameIdx++; pending = pending.subarray(frameBytes); }
  if (pending.length >= frameBytes) ff.stdout.pause(); else ff.stdout.resume();
  if (closed) finish();
}
ff.stdout.on('data', (c) => { pending = pending.length ? Buffer.concat([pending, c]) : c; drain(); });
ff.on('close', (code) => { if (code !== 0) { console.error('ffmpeg exited ' + code); process.exit(1); } closed = true; drain(); });
let done = false;
function finish() {
  if (done) return; done = true;
  if (!saw) { console.error('REFUSE: no PTS'); process.exit(1); }
  for (let ci = 0; ci < cols.length; ci++) if (state[ci].on) close(ci, pts[pts.length - 1]);
  events.sort((a, b) => a.on - b.on || a.midi - b.midi);
  // ten-finger gate
  const byT = new Map(); for (const e of events) { const k = e.on.toFixed(3); byT.set(k, (byT.get(k) ?? 0) + 1); }
  const bad = new Set([...byT.entries()].filter(([, n]) => n > 10).map(([k]) => k));
  const dropped = events.filter((e) => bad.has(e.on.toFixed(3))).length;
  const kept = events.filter((e) => !bad.has(e.on.toFixed(3)));
  writeFileSync(outPath, JSON.stringify({ video: videoPath, frames: frameIdx, nonPianoFrames: skipped, band: [bandY0, bandY1], lit: LIT, droppedTenFinger: dropped, events: kept }, null, 1));
  console.log(`${frameIdx} frames (${skipped} not the piano) -> ${kept.length} events (${dropped} dropped at >10-key instants), wrote ${outPath}`);
}
