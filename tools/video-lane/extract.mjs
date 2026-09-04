// Video-lane extractor: read the DRAWN KEYBOARD, not the falling bars.
//
//   node extract.mjs <video> <geometry.json> <template.json> --out events.json
//
// ☠️ THE FALLING LANE IS THE WRONG PLACE TO READ. The first version watched a
// band just above the strike line and scored F1 0.383 against the audio, and
// the reason was visible once the pixels were zoomed: this renderer throws a
// bright PARTICLE SPRAY sideways and upward from every strike, as bright as
// the bars themselves (225-254), and the bars carry a bloom about 10px wide -
// comparable to a whole black key. One real note therefore lit five key
// columns, and a moment with two white notes and one red read as ten white
// and three red - more notes at once than two hands have.
//
// The keyboard itself carries the same information without any of that: a
// pressed key is TINTED, the tint is exactly one key wide by construction, it
// appears at the true strike time rather than a lane-height latency earlier,
// and it is nowhere near the particles. Measured deviation from a key's own
// rest colour: 120-314 when pressed, at most 23 when not. That is not a
// threshold to tune, it is a gap to fall into.
//
// Colour -> hand is NOT decided here. That is the template profile's job and
// it must come from evidence outside pitch.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const args = process.argv.slice(2);
const outIx = args.indexOf('--out');
const outPath = outIx >= 0 ? args[outIx + 1] : 'events.json';
const rest_ = args.filter((_, i) => i !== outIx && i !== outIx + 1);
const [videoPath, geoPath, templatePath] = rest_;
if (!templatePath) { console.error('usage: extract.mjs <video> <geometry.json> <template.json> --out events.json'); process.exit(1); }
const geo = JSON.parse(readFileSync(geoPath, 'utf8'));
const T = JSON.parse(readFileSync(templatePath, 'utf8'));

const W = geo.width;
const kh = geo.height - geo.keyboardTopY;
// ☠️ THE CROP MUST BE EVEN. A yuv420p source cannot be cropped to an odd
// height or offset and ffmpeg does not say no: it silently rounds down. A
// 231-row request produced 230-row frames, so every frame slipped one row
// against the next and the keyboard walked out of the scene check on a
// 230-frame cycle. Even geometry, then verify the size ffmpeg reports.
const cropTop = geo.keyboardTopY - (geo.keyboardTopY % 2);
const cropH = (geo.height - cropTop) - ((geo.height - cropTop) % 2);
const frameBytes = W * cropH * 3;
const yWhite = (geo.keyboardTopY + Math.round(kh * 0.85)) - cropTop;   // below the black keys
const yBlack = (geo.keyboardTopY + Math.round(kh * 0.30)) - cropTop;   // inside the black keys
const HALF = 4;                                                        // rows sampled either side
for (const [name, r] of [['white row', yWhite], ['black row', yBlack]]) {
  if (r - HALF < 0 || r + HALF >= cropH) { console.error(`REFUSE: ${name} row ${r} falls outside the ${cropH}-row crop`); process.exit(1); }
}

const keys = geo.keys;
// central half of each key, clear of its edges and of any neighbour's outline
const cols = keys.map((k) => {
  const w = k.x1 - k.x0 + 1, inset = Math.round(w * 0.25);
  return { midi: k.midi, black: k.black, x0: Math.max(0, k.x0 + inset), x1: Math.min(W - 1, k.x1 - inset), y: k.black ? yBlack : yWhite };
});
for (const c of cols) if (c.x1 < c.x0) { console.error(`REFUSE: key ${c.midi} has no sampleable width`); process.exit(1); }

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// ☠️ THE DISCRIMINATOR IS REDNESS, AND IT WAS MEASURED. Earlier attempts:
// "min/max > 0.55 means white" calls a saturating red under glow, (255,180,170),
// white; symmetric chroma cannot see these greys at all because their max
// channel is BLUE - (172,175,185) is a COOL grey. (R-B)/R separates the two
// classes with real empty space between them, and the thresholds live in the
// TEMPLATE profile rather than in this file.
const classify = (r, g, b) => {
  if (r <= 0) return 'ambiguous';
  const redness = (r - b) / r;
  if (redness >= T.rednessRed) return 'red';
  if (redness <= T.rednessGrey) return 'white';
  return 'ambiguous';
};
// A renderer that paints hands in two BLUES (Sheet Music Boss 2020-2022, a 3D
// keyboard) lights each key as a vertical GRADIENT with a white strike flare
// in the first frames, so the run-mean tint smears the two classes into one
// continuum (measured 2026-09-04: g/b ran 0.2 to 0.8 with no gap). Such a
// template names its metric and its class ranges PER KEY TYPE (the gradient
// differs between the white row and the black row), and the event is judged on
// the MEDIAN per-frame metric over its run, which the flare cannot move.
// Without T.metric the redness path above runs unchanged (Silksong).
const METRICS = {
  redness: (r, g, b) => r <= 0 ? null : (r - b) / r,
  gb: (r, g, b) => g / Math.max(1, b),
  gmb: (r, g, b) => (g - b) / Math.max(1, r, g, b),
};
const metricFn = T.metric ? METRICS[T.metric] : null;
if (T.metric && !metricFn) { console.error(`REFUSE: template metric '${T.metric}' is not one of ${Object.keys(METRICS).join(', ')}`); process.exit(1); }
const classifyMedian = (vals, black) => {
  const v = vals.filter((x) => x !== null).sort((a, b) => a - b);
  if (!v.length) return 'ambiguous';
  const m = v[Math.floor(v.length / 2)];
  const classes = (black ? T.classesBlack : T.classesWhite) ?? T.classes;
  for (const c of classes) if ((c.min === undefined || m >= c.min) && (c.max === undefined || m <= c.max)) return c.name;
  return 'ambiguous';
};

const ff = spawn('ffmpeg', ['-v', 'info', '-i', videoPath,
  '-vf', `crop=${W}:${cropH}:0:${cropTop},showinfo`,
  '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
  { stdio: ['ignore', 'pipe', 'pipe'] });

const ptsQueue = [];
let sawShowinfo = false, ffClosed = false;
createInterface({ input: ff.stderr }).on('line', (l) => {
  const sz = l.match(/Parsed_showinfo.*\bs:(\d+)x(\d+)/);
  if (sz && (+sz[1] !== W || +sz[2] !== cropH)) {
    console.error(`REFUSE: ffmpeg emitted ${sz[1]}x${sz[2]} but the crop asked for ${W}x${cropH}; it adjusted the geometry and the byte stream would be misaligned`);
    process.exit(1);
  }
  const m = l.match(/Parsed_showinfo.*\bn:\s*(\d+).*pts_time:\s*([\d.]+)/);
  if (m) { sawShowinfo = true; ptsQueue.push(+m[2]); drain(); }
});

// Is the calibrated keyboard on screen? White key centres bright, black dark.
// A handful of pressed keys are tinted, so this is a share, not unanimity; a
// title card or a cut fails it outright.
const whiteCols = cols.filter((c) => !c.black), blackCols = cols.filter((c) => c.black);
const sceneOk = (buf) => {
  let w = 0;
  for (const c of whiteCols) { const i = (c.y * W + ((c.x0 + c.x1) >> 1)) * 3; if (lum(buf[i], buf[i + 1], buf[i + 2]) > 120) w++; }
  let b = 0;
  for (const c of blackCols) { const i = (c.y * W + ((c.x0 + c.x1) >> 1)) * 3; if (lum(buf[i], buf[i + 1], buf[i + 2]) < 90) b++; }
  return w / whiteCols.length >= T.sceneMinShare && b / blackCols.length >= T.sceneMinShare;
};

// per key, its sampled colour on every usable frame (null on unusable ones)
const series = cols.map(() => []);
const times = [];
let frameIdx = 0, skippedFrames = 0, settlingFrames = 0;
let settle = T.settleFramesAfterSceneBreak;
let pending = Buffer.alloc(0);

const processFrame = (buf, pts) => {
  const usable = sceneOk(buf);
  if (!usable) { skippedFrames++; settle = T.settleFramesAfterSceneBreak; }
  else if (settle > 0) { settle--; settlingFrames++; }
  times.push(pts);
  const good = usable && settle === 0;
  for (let ci = 0; ci < cols.length; ci++) {
    if (!good) { series[ci].push(null); continue; }
    const c = cols[ci];
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -HALF; dy <= HALF; dy++) {
      const row = (c.y + dy) * W * 3;
      for (let x = c.x0; x <= c.x1; x++) { const i = row + x * 3; r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; n++; }
    }
    series[ci].push([r / n, g / n, b / n]);
  }
};

function drain() {
  while (pending.length >= frameBytes && frameIdx < ptsQueue.length) {
    processFrame(pending.subarray(0, frameBytes), ptsQueue[frameIdx]);
    frameIdx++;
    pending = pending.subarray(frameBytes);
  }
  if (pending.length >= frameBytes) ff.stdout.pause(); else ff.stdout.resume();
  if (ffClosed) finish();
}

ff.stdout.on('data', (chunk) => { pending = pending.length ? Buffer.concat([pending, chunk]) : chunk; drain(); });
ff.on('close', (code) => { if (code !== 0) { console.error(`ffmpeg exited ${code}`); process.exit(1); } ffClosed = true; drain(); });

let finished = false;
function finish() {
  if (finished) return;
  if (pending.length >= frameBytes) { console.error(`REFUSE: ${Math.floor(pending.length / frameBytes)} frames never received a showinfo PTS`); process.exit(1); }
  finished = true;
  if (!sawShowinfo) { console.error('REFUSE: no showinfo PTS seen'); process.exit(1); }

  // ☠️ A KEY'S OWN MEDIAN IS NOT ITS REST COLOUR IF IT IS MOSTLY DOWN.
  // A3 in this piece is a repeated tenor note held about 88% of the time, so
  // its median WAS the pressed tint and the detector inverted: it reported the
  // brief RELEASE gaps as notes. Same 33 events as the audio, zero of them at
  // the same moment. Every key of a type shares one rest colour here (all white
  // keys measure ~(216,220,228), all black ~(40,37,65)), and keys that are
  // mostly down are a minority, so the median ACROSS keys of a type survives
  // them. A key keeps its own median only when it agrees with its type.
  const perKey = cols.map((c, ci) => {
    const obs = series[ci].filter(Boolean);
    if (obs.length < 30) return null;
    const med = (k) => { const v = obs.map((o) => o[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
    return [med(0), med(1), med(2)];
  });
  const typeRest = (black) => {
    const ms = perKey.filter((m, i) => m && cols[i].black === black);
    if (!ms.length) return null;
    const med = (k) => { const v = ms.map((o) => o[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
    return [med(0), med(1), med(2)];
  };
  const restWhite = typeRest(false), restBlack = typeRest(true);
  const mostlyDown = [];

  const events = [];
  let unresolved = 0;
  for (let ci = 0; ci < cols.length; ci++) {
    const s = series[ci];
    if (!perKey[ci]) continue;
    const typical = cols[ci].black ? restBlack : restWhite;
    const own = perKey[ci];
    const offType = Math.hypot(own[0] - typical[0], own[1] - typical[1], own[2] - typical[2]);
    const rest = offType < T.pressDeviation ? own : typical;
    if (offType >= T.pressDeviation) mostlyDown.push(cols[ci].midi);
    const dev = s.map((o) => o === null ? null : Math.hypot(o[0] - rest[0], o[1] - rest[1], o[2] - rest[2]));

    let on = false, run = 0, gap = 0, startI = 0, sum = null;
    let metricVals = [];
    const close = (endI) => {
      const colour = metricFn ? classifyMedian(metricVals, cols[ci].black) : classify(sum[0] / sum[3], sum[1] / sum[3], sum[2] / sum[3]);
      const flags = [];
      const mv = metricFn ? metricVals.filter((x) => x !== null).sort((a, b) => a - b) : null;
      const metricMedian = mv && mv.length ? +mv[Math.floor(mv.length / 2)].toFixed(3) : undefined;
      if (colour === 'ambiguous') { flags.push(`tint (${(sum[0] / sum[3]).toFixed(0)},${(sum[1] / sum[3]).toFixed(0)},${(sum[2] / sum[3]).toFixed(0)})${metricFn ? ` ${T.metric} median ${metricMedian}` : ''} matches no template class`); unresolved++; }
      events.push({ midi: cols[ci].midi, on: +times[startI].toFixed(4), off: +times[endI].toFixed(4), colour, ...(metricFn ? { metricMedian } : {}), flags });
      on = false; sum = null; metricVals = [];
    };
    for (let i = 0; i < s.length; i++) {
      const d = dev[i];
      if (d === null) { if (on) { close(i - gap - 1); } run = 0; gap = 0; continue; }
      if (d > T.pressDeviation) {
        gap = 0; run++;
        if (!on && run >= T.hysteresisFrames) { on = true; startI = i - run + 1; sum = [0, 0, 0, 0]; }
        if (on) { sum[0] += s[i][0]; sum[1] += s[i][1]; sum[2] += s[i][2]; sum[3]++; if (metricFn) metricVals.push(metricFn(s[i][0], s[i][1], s[i][2])); }
      } else {
        run = 0;
        if (on) { gap++; if (gap >= T.hysteresisFrames) close(i - gap); }
      }
    }
    if (on) close(s.length - 1);
  }

  events.sort((a, b) => a.on - b.on || a.midi - b.midi);

  // ☠️ TWO HANDS HAVE TEN FINGERS. The scene settle window is a guess about how
  // long a dissolve takes, and it was wrong by one frame: the title card fading
  // IN lit all 52 white keys at t=2.12 for 70ms, and the fade OUT did 20 more
  // at 86.39, which is 72 of the 75 events the audio could not account for.
  // Rather than lengthen a magic number until those two happen to fall inside
  // it, refuse the thing that is physically impossible: no performance strikes
  // more than ten keys in a single frame.
  const MAX_SIMULTANEOUS = 10;
  const frames_ = new Map();
  for (const e of events) { const k = e.on.toFixed(3); frames_.set(k, (frames_.get(k) ?? 0) + 1); }
  const impossible = [...frames_.entries()].filter(([, n]) => n > MAX_SIMULTANEOUS);
  const dropped = impossible.reduce((s, [, n]) => s + n, 0);
  if (dropped) {
    const bad = new Set(impossible.map(([k]) => k));
    for (let i = events.length - 1; i >= 0; i--) if (bad.has(events[i].on.toFixed(3))) events.splice(i, 1);
    console.log(`dropped ${dropped} events at ${impossible.length} instant(s) where more than ${MAX_SIMULTANEOUS} keys lit at once (${impossible.map(([k, n]) => `${(+k).toFixed(2)}s: ${n}`).join(', ')}) - a scene transition, not a performance`);
  }

  // ☠️ COUNT THE AMBIGUOUS EVENTS THAT SURVIVED THE DROP. unresolved++ ran in
  // close(), before the ten-finger rule removed the title-card events, so a
  // 3-minute video with two dissolves reported 99 unresolved of 698 (14.2%)
  // when every one of the 698 kept events had a class. Recount on what ships.
  unresolved = events.filter((e) => e.colour === 'ambiguous').length;
  const byColour = { ambiguous: 0 };
  for (const c of ((T.classesWhite ?? T.classes) ?? [{ name: 'red' }, { name: 'white' }])) byColour[c.name] = 0;
  for (const e of events) byColour[e.colour] = (byColour[e.colour] ?? 0) + 1;
  const out = {
    video: videoPath, frames: frameIdx,
    nonPianoFrames: skippedFrames, settlingFrames,
    keysHeldMoreThanHalfTheTime: mostlyDown,
    signal: 'key tint on the drawn keyboard',
    counts: byColour,
    ambiguous: unresolved,
    ambiguousShare: +(unresolved / Math.max(1, events.length)).toFixed(4),
    events,
  };
  writeFileSync(outPath, JSON.stringify(out, null, 1));
  console.log(`${frameIdx} frames (${skippedFrames} not the piano, ${settlingFrames} settling) -> ${events.length} events (${Object.entries(byColour).filter(([k]) => k !== 'ambiguous').map(([k, n]) => `${n} ${k}`).join(', ')}), ${unresolved} unresolved (${(out.ambiguousShare * 100).toFixed(1)}%)`);
  console.log(`wrote ${outPath}`);
}
