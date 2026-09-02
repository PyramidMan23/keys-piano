// Hand assignment for a FILMED keyboard: which of the performer's two hands was
// over the key when the note struck.
//
//   node assign-hands.mjs <bar-events.json> <hands.json> <geometry.json> --latency 0.25 --out assigned.json
//
// Identity comes from TRACKING, not from the model's per-frame label: the two
// hands are followed through time by wrist continuity, and each track is named
// left or right once, from the majority of the model's labels AND the majority
// of its position in the frame (an overhead camera behind the player sees the
// left hand on the left). If those two witnesses disagree the video is refused.
// A note is assigned to a hand only when ONE hand has a fingertip within
// NEAR key-widths of the key's centre, over the keys, in the strike frame or
// its neighbours, and the other hand has none within FAR; anything else is
// UNRESOLVED and stays unresolved - it never goes to a hand, and it blocks
// import. Every assignment carries its evidence.
import { readFileSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const [evPath, handsPath, geoPath] = args.filter((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1].startsWith('--')));
const latency = Number(flag('latency', 0));
const outPath = flag('out', 'assigned.json');
const NEAR = Number(flag('near', 0.8)), FAR = Number(flag('far', 1.6)), WIN = Number(flag('window', 2));
const ev = JSON.parse(readFileSync(evPath, 'utf8')).events;
const H = JSON.parse(readFileSync(handsPath, 'utf8'));
const geo = JSON.parse(readFileSync(geoPath, 'utf8'));
const keyOf = Object.fromEntries(geo.keys.map((k) => [k.midi, k]));
const kw = (geo.keys.filter((k) => !k.black).reduce((s, k) => s + (k.x1 - k.x0 + 1), 0) / 52);
const yTop = geo.keyboardTopY - 20, yBot = (geo.keyboardBottomY ?? geo.height) + 40;

// ---- 1. track the two hands by wrist continuity -----------------------------
// each frame's hands are matched to the previous frame's tracks by nearest wrist
const tracks = [[], []];   // per frame: index of the hand in that frame or -1
let prev = [null, null];
for (const f of H.frames) {
  const hs = f.h;
  const assign = [-1, -1];
  if (hs.length === 2) {
    const d = (a, b) => (a && b) ? Math.hypot(a.w[0] - b.w[0], a.w[1] - b.w[1]) : 0;
    const straight = d(prev[0], hs[0]) + d(prev[1], hs[1]), crossed = d(prev[0], hs[1]) + d(prev[1], hs[0]);
    if (prev[0] && prev[1] && crossed < straight) { assign[0] = 1; assign[1] = 0; } else { assign[0] = 0; assign[1] = 1; }
  } else if (hs.length === 1) {
    const d0 = prev[0] ? Math.hypot(prev[0].w[0] - hs[0].w[0], prev[0].w[1] - hs[0].w[1]) : Infinity;
    const d1 = prev[1] ? Math.hypot(prev[1].w[0] - hs[0].w[0], prev[1].w[1] - hs[0].w[1]) : Infinity;
    if (d0 === Infinity && d1 === Infinity) assign[hs[0].w[0] < H.w / 2 ? 0 : 1] = 0; else assign[d0 <= d1 ? 0 : 1] = 0;
  }
  tracks[0].push(assign[0]); tracks[1].push(assign[1]);
  prev = [assign[0] >= 0 ? hs[assign[0]] : prev[0], assign[1] >= 0 ? hs[assign[1]] : prev[1]];
}
// ---- 2. name the tracks from two independent witnesses ----------------------
const name = [null, null];
for (const ti of [0, 1]) {
  let lab = { L: 0, R: 0 }, leftOf = 0, n = 0;
  H.frames.forEach((f, i) => {
    const hi = tracks[ti][i]; if (hi < 0) return; const h = f.h[hi]; lab[h.lab]++; n++;
    const oi = tracks[1 - ti][i]; if (oi >= 0) leftOf += h.w[0] < f.h[oi].w[0] ? 1 : 0;
  });
  const byLabel = lab.L > lab.R ? 'L' : 'R';
  const byPlace = leftOf / Math.max(1, n) > 0.5 ? 'L' : 'R';
  name[ti] = { byLabel, byPlace, labelShare: +(Math.max(lab.L, lab.R) / Math.max(1, n)).toFixed(2), leftShare: +(leftOf / Math.max(1, n)).toFixed(2), frames: n };
}
console.log('track 0:', JSON.stringify(name[0]), '| track 1:', JSON.stringify(name[1]));
if (name[0].byLabel === name[1].byLabel || name[0].byPlace === name[1].byPlace || name[0].byLabel !== name[0].byPlace) {
  console.error('REFUSE: the two witnesses (model label, position in frame) do not agree on which track is which hand');
  process.exit(1);
}
const handOf = [name[0].byLabel, name[1].byLabel];

// ---- 3. assign each note ----------------------------------------------------
const fps = H.fps;
const out = []; const why = { assigned: 0, unresolved: 0, noHands: 0, both: 0, neither: 0 };
for (const e of ev) {
  const t = e.on + latency;
  const fi = Math.round(t * fps);
  const k = keyOf[e.midi]; const cx = (k.x0 + k.x1) / 2;
  const best = [Infinity, Infinity];
  for (let f = fi - WIN; f <= fi + WIN; f++) {
    const fr = H.frames[f]; if (!fr) continue;
    for (const ti of [0, 1]) {
      const hi = tracks[ti][f]; if (hi < 0) continue;
      for (const [x, y] of fr.h[hi].tips) { if (y < yTop || y > yBot) continue; const d = Math.abs(x - cx) / kw; if (d < best[ti]) best[ti] = d; }
    }
  }
  let hand = null, reason;
  if (best[0] === Infinity && best[1] === Infinity) { reason = 'no hand over the keys in the window'; why.noHands++; }
  else if (best[0] <= NEAR && best[1] > FAR) { hand = handOf[0]; reason = `track0 tip ${best[0].toFixed(2)} keys away, other ${best[1] === Infinity ? 'absent' : best[1].toFixed(2)}`; }
  else if (best[1] <= NEAR && best[0] > FAR) { hand = handOf[1]; reason = `track1 tip ${best[1].toFixed(2)} keys away, other ${best[0] === Infinity ? 'absent' : best[0].toFixed(2)}`; }
  else if (best[0] <= NEAR && best[1] <= NEAR) { reason = `both hands within reach (${best[0].toFixed(2)}, ${best[1].toFixed(2)})`; why.both++; }
  else { reason = `no fingertip close enough (${best[0] === Infinity ? '-' : best[0].toFixed(2)}, ${best[1] === Infinity ? '-' : best[1].toFixed(2)})`; why.neither++; }
  if (hand) why.assigned++; else why.unresolved++;
  out.push({ ...e, strikeT: +t.toFixed(3), hand, reason });
}
const L = out.filter((o) => o.hand === 'L').length, R = out.filter((o) => o.hand === 'R').length;
writeFileSync(outPath, JSON.stringify({ latency, near: NEAR, far: FAR, window: WIN, tracks: name, counts: { ...why, L, R }, notes: out }, null, 1));
console.log(`${out.length} notes: assigned ${why.assigned} (L ${L}, R ${R}), unresolved ${why.unresolved} (${why.noHands} no hand, ${why.both} both near, ${why.neither} none near) -> ${(100 * why.unresolved / out.length).toFixed(1)}% unresolved`);
