// Video lane -> importer bridge. Turns extracted key-tint events into a
// two-track MIDI the importer can read, with the hands the TEMPLATE says the
// colours mean, at the tempo the onsets themselves prove.
//
//   node to-import.mjs <events.json> <template.json> --bpm 70 --meter 4 --out song.mid
//
// ☠️ NO handMapping IN THE TEMPLATE, NO IMPORT. Colour -> hand must come from
// evidence outside pitch (for Sheet Music Boss: the arranger's own published
// score, whose staves carry the dyads in the treble). This tool refuses to
// guess and says which file to fill in.
//
// ☠️ SECONDS ARE NOT BEATS. A falling-note render is played from a MIDI at a
// fixed tempo, so its onsets lie on a metronomic grid; that is a hypothesis to
// TEST, not assume. The bpm you pass is fitted here for phase, every onset is
// snapped to the grid, and the mean and worst move are printed and enforced
// against the committed thresholds (mean < 0.12 beat, worst < 0.45): a render
// that does not sit on the grid is refused, not quantised into something else.
import { readFileSync, writeFileSync } from 'node:fs';
// this folder lives twice: in the app repo as tools/video-lane (midi.mjs is one
// level up) and in keys-piano-tools (the app copy is a sibling tree). Resolve
// whichever exists rather than hard-coding one and dying in the other.
import { existsSync } from 'node:fs';
const MIDI = [new URL('../midi.mjs', import.meta.url), new URL('../../keys-piano/tools/midi.mjs', import.meta.url)].find((u) => existsSync(u));
if (!MIDI) { console.error('cannot find tools/midi.mjs from ' + import.meta.url); process.exit(2); }
const { writeMidi } = await import(MIDI.href);

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const [eventsPath, templatePath] = args.filter((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1].startsWith('--')));
const bpm = Number(flag('bpm'));
const meter = Number(flag('meter', 4));
const outPath = flag('out', 'song.mid');
const bpmSource = flag('bpm-source');
if (!eventsPath || !templatePath || !bpm || !bpmSource) { console.error('usage: to-import.mjs <events.json> <template.json> --bpm N --bpm-source "where the tempo comes from" [--meter 4] --out song.mid'); process.exit(2); }

const T = JSON.parse(readFileSync(templatePath, 'utf8'));
if (!T.handMapping || !T.handMapping.red || !T.handMapping.white) {
  console.error(`REFUSE: ${templatePath} has no handMapping. Which colour is the left hand must be established from evidence outside pitch and written there, with its source.`);
  process.exit(1);
}
const ev = JSON.parse(readFileSync(eventsPath, 'utf8')).events;
// ☠️ A COLOUR THE TEMPLATE DOES NOT NAME IS NOT A HAND. Anything but a mapped
// colour used to fall through to the right hand; it is refused instead.
const unknown = ev.filter((e) => !(e.colour in T.handMapping));
if (unknown.length) { console.error(`REFUSE: ${unknown.length} event(s) carry a colour the template does not map (${[...new Set(unknown.map((e) => e.colour))].join(', ')})`); process.exit(1); }
const latency = (T.onsetLatencyMs ?? 0) / 1000;
const beat = 60 / bpm;

// ☠️ THE GRID FIT CANNOT PROVE THE TEMPO. Onsets that sit on a quarter-beat
// grid at 70 sit on one at 35, 140 and 210 just as well (Codex checked).
// The bpm is a FACT SUPPLIED FROM OUTSIDE - the arranger's marking - and
// --bpm-source says where; this fit only tests that the render is
// metronomic at that tempo and finds the phase.
// fit the grid PHASE: the offset that minimises the summed snap error
let bestPhase = 0, bestErr = Infinity;
for (let ph = 0; ph < beat; ph += beat / 200) {
  let err = 0;
  for (const e of ev) { const b = (e.on + latency - ph) / beat; err += Math.abs(b - Math.round(b * 4) / 4); }
  if (err < bestErr) { bestErr = err; bestPhase = ph; }
}
const moves = [];
const notes = ev.map((e) => {
  const raw = (e.on + latency - bestPhase) / beat;
  const b = Math.round(raw * 4) / 4;             // the importer's own 1/4-beat grid
  moves.push(Math.abs(raw - b));
  const d = Math.max(0.25, Math.round(((e.off - e.on) / beat) * 4) / 4);
  const hand = T.handMapping[e.colour];         // 'L' | 'R'
  return { b, d, m: e.midi, track: hand === 'L' ? 0 : 1, hand };
});
const mean = moves.reduce((a, c) => a + c, 0) / moves.length;
const worst = Math.max(...moves);
console.log(`${ev.length} events at ${bpm}bpm (${bpmSource}), grid phase ${(bestPhase * 1000).toFixed(0)}ms: mean move ${mean.toFixed(3)} beats, worst ${worst.toFixed(3)}`);
const MEAN_MAX = 0.12, WORST_MAX = 0.45;
if (mean >= MEAN_MAX || worst >= WORST_MAX) {
  console.error(`REFUSE: the onsets do not sit on a ${bpm}bpm grid (committed: mean < ${MEAN_MAX}, worst < ${WORST_MAX}). Either the tempo is wrong or the render is not metronomic; a song that is not on a grid stays in seconds.`);
  process.exit(1);
}
const first = Math.min(...notes.map((n) => n.b));
for (const n of notes) n.b = +(n.b - first).toFixed(4);
const L = notes.filter((n) => n.hand === 'L').length, R = notes.length - L;
writeFileSync(outPath, writeMidi({ notes, bpm, timeSig: [meter, 4], tracks: 2 }));
console.log(`wrote ${outPath}: track 0 = left hand (${L} notes, colour ${Object.entries(T.handMapping).find(([, h]) => h === 'L')[0]}), track 1 = right hand (${R} notes)`);
