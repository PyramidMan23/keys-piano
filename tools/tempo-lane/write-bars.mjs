// Run the DP downbeat tracker over every song with a pulse sidecar and write
// the bar maps the app draws lines from.
//
//   node write-bars.mjs [--dry]
//
// ☠️ THE MAP IS IN SECONDS OF THE RECORDING, AND THE APP PLAYS IN BEATS.
// Every song's notes carry beat positions from the transcriber's fixed 120bpm
// grid, where one beat is exactly 0.5s of the source audio. So a downbeat at
// t seconds is at beat t/0.5 - the same conversion the whole tempo lane uses.
// Written as BEATS here so the app never has to know about the audio.
//
// Gate 1 passed at F1 0.632 against its pre-committed 0.60 (Rousseau's rubato
// Moonlight, truth transferred from the engraved score). Counting every Pth
// tracked beat scored 0.187, and that was its ceiling over all phases.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parseMidi, midiNotes } from 'file:///C:/Users/markh/keys-piano/tools/midi.mjs';
import { chooseBar, unfoldPhrase } from './downbeat.mjs';

const W = 'C:/Users/markh/keys-piano-tools/workshop';
const OUT = 'C:/Users/markh/keys-piano/js/songs-bars.mjs';
const dry = process.argv.includes('--dry');

// ☠️ ONLY SONGS WHOSE METER WAS HEARD. Bar lines drawn without a known meter
// would be lines with no counting attached - worse than none, because they
// look authoritative. Free-time songs stay free.
const { METER } = await import('file:///C:/Users/markh/keys-piano/js/songs-meter.mjs');

const out = {};
const rows = [];
for (const [g, m] of Object.entries(METER)) {
  const stem = m.from;
  if (!existsSync(`${W}/${stem}.beats.json`) || !existsSync(`${W}/${stem}.mid`)) { rows.push([g, 'no source']); continue; }
  const sc = JSON.parse(readFileSync(`${W}/${stem}.beats.json`, 'utf8'));
  const notes = midiNotes(parseMidi(readFileSync(`${W}/${stem}.mid`))).map((x) => ({ t: x.b * 0.5, m: x.m, vel: x.vel }));
  const B = sc.beats, n = B.length;
  const nearest = (t) => {
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const md = (lo + hi) >> 1; if (B[md] <= t) lo = md; else hi = md; }
    const k = (t - B[lo] <= B[hi] - t) ? lo : hi;
    return Math.abs(B[k] - t) <= 0.09 ? k : -1;
  };
  const bass = new Float64Array(n), pcs = Array.from({ length: n }, () => new Set());
  for (const x of notes) { const k = nearest(x.t); if (k < 0) continue; pcs[k].add(x.m % 12); if (x.m < 55) bass[k] += ((55 - x.m) / 24) * ((x.vel ?? 80) / 80); }
  const nov = new Float64Array(n);
  for (let k = 1; k < n; k++) {
    const a = pcs[k - 1], b = pcs[k];
    if (!b.size) continue;
    let it = 0; for (const x of b) if (a.has(x)) it++;
    nov[k] = 1 - it / Math.max(1, Math.max(a.size, b.size));
  }
  const z = (arr) => { const v = Array.from(arr); const mu = v.reduce((a, c) => a + c, 0) / v.length; const sd = Math.sqrt(v.reduce((a, c) => a + (c - mu) ** 2, 0) / v.length) || 1; return v.map((x) => (x - mu) / sd); };
  const zb = z(bass), zn = z(nov), za = z((sc.beat_accents ?? []).length === n ? sc.beat_accents : new Float64Array(n));
  const barSignal = zn.map((v, k) => v + 0.6 * zb[k] + 0.2 * za[k]);

  const iv = []; for (let k = 1; k < n; k++) iv.push(B[k] - B[k - 1]);
  iv.sort((a, b) => a - b);
  const beatSec = iv[Math.floor(iv.length / 2)];
  const cands = [2, 3, 4, 6, 8, 9, 12, 16].map((p) => p * beatSec);
  const sel = chooseBar(B, barSignal, cands);
  if (!sel.ok) { rows.push([g, sel.why]); continue; }

  // a "bar" whose midpoints also carry bass is two bars: split it
  const un = unfoldPhrase(B, zb, sel);
  const downbeats = un.downbeats;
  const ivd = [];
  for (let i = 1; i < downbeats.length; i++) ivd.push(downbeats[i] - downbeats[i - 1]);
  ivd.sort((a, b) => a - b);
  const barSec = ivd[Math.floor(ivd.length / 2)];

  // ☠️ THE TWO HALVES OF THE LANE MUST AGREE, AND THE TEST IS AN INTEGER.
  // A bar of `meter` beats, laid over beats the tracker actually found, has to
  // divide into a WHOLE number of tracked beats - anything else means the bar
  // length and the meter came from different readings of the music and one of
  // them is wrong. Comparing against the meter model's own tempo instead was
  // circular: that tempo was wrong for Moonlight in exactly the way this is
  // meant to catch.
  const perBeat = barSec / m.meter / beatSec;
  const err = Math.abs(perBeat - Math.round(perBeat));
  if (Math.round(perBeat) < 1 || err > 0.12) {
    rows.push([g, `bar ${barSec.toFixed(2)}s / ${m.meter} = ${perBeat.toFixed(2)} tracked beats per beat, not whole - refusing`]);
    continue;
  }

  // ☠️ AND AN INTEGER IS NOT ENOUGH: AN N-BAR PHRASE DIVIDES EVENLY TOO.
  // Splitting phrases in half fixed Married Life but left Last Friday Night at
  // 5.74s per "bar" - three real bars - which passes the whole-number test
  // happily and implies a 42bpm beat for a 123bpm dance track. The tempo the
  // BAR MAP implies must agree with the tempo the METER MODEL heard. They are
  // separate readings of the music: the meter model works from periodicity in
  // the tracked beats, the bar map from where a dynamic program anchored. When
  // two independent estimates agree the answer is probably real; when one says
  // 42 and the other 123, nothing gets drawn.
  const impliedBpm = 60 / (barSec / m.meter);
  const disagree = Math.abs(Math.log(impliedBpm / m.beatBpm));
  if (disagree > 0.15) {
    rows.push([g, `bar map implies ${impliedBpm.toFixed(0)}bpm, meter model heard ${m.beatBpm}bpm - refusing (likely a ${(m.beatBpm / impliedBpm).toFixed(1)}-bar phrase)`]);
    continue;
  }

  // ☠️ THE IMPORTER REBASES EVERY SONG TO BEAT 0, THE RECORDING DOES NOT.
  // import-midi.mjs subtracts the first note's beat so a song starts at 0, so a
  // bar map in RECORDING beats sits ahead of the notes by however much silence
  // or count-in the recording began with. Subtract the same offset or every bar
  // line is drawn early by a constant, which looks like a tracker that missed
  // rather than an origin that moved.
  const firstBeat = Math.min(...notes.map((x) => x.t)) / 0.5;
  out[g] = {
    meter: m.meter,
    // seconds -> transcriber beats, then rebased exactly as the importer did
    bars: downbeats.map((t) => +(t / 0.5 - firstBeat).toFixed(3)).filter((b) => b >= -0.5),
    medianBarSec: +barSec.toFixed(3),
    cover: sel.cover,
    steadiness: sel.barCv,
    halvedFromPhrase: un.halved,
    impliedBpm: +impliedBpm.toFixed(1),
  };
  rows.push([g, `${downbeats.length} bars, ${barSec.toFixed(2)}s each, ${Math.round(perBeat)} tracked beat(s)/beat, meter ${m.meter}${un.halved ? `, split from phrases (bass ratio ${un.bassRatio})` : ''}`]);
}

for (const [g, why] of rows.sort()) console.log(`${g.padEnd(22)} ${why}`);
console.log(`\n${Object.keys(out).length} songs have a bar map, of ${rows.length} with a heard meter`);

const body = `// GENERATED by keys-piano-tools/write-bars.mjs. Do not hand-edit.
//
// Bar lines, tracked by dynamic programming over the source recording and
// stored in the transcriber's beat units (1 beat = 0.5s of audio).
//
// Counting every Pth tracked beat CANNOT work and the numbers are in the tool:
// librosa inserts and drops beats where audio is ambiguous, so a modulo count
// slides off the music and never recovers (best possible F1 0.187, over every
// phase). This tracker re-anchors on bass and harmonic change at every bar and
// scored 0.632 against beats transferred from an engraved score.
//
// Only songs whose meter was HEARD appear here. Keyed by song group.
export const BARS = ${JSON.stringify(out, null, 1)};
`;
if (dry) console.log('\n--dry: nothing written');
else { writeFileSync(OUT, body); console.log(`\nwrote ${OUT}`); }
