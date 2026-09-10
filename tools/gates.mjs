// RUN THE GATES. All of them, at the same time, with one number at the end.
//
// Written 2026-09-06, after Mark asked why adding a song takes so long. The
// answer was measured, not guessed: the nineteen gates take 400 seconds of
// wall clock when run one after another, and two of them own 255 of it
// (canon-journeys 185s, overlay 70s). Everything else finishes in under 25.
// Running them one at a time meant every verification cycle cost seven
// minutes, and a session that verifies eight times spends an hour watching
// a queue rather than a suite.
//
// They are separate processes that share nothing but the serving copy, which
// they only READ, so they can run together. The one thing that used to stop
// that was the fixed debugging port each gate hardcoded; cdp.mjs now treats
// that number as a starting point and steps past anything already answering,
// so two gates asking for 9595 no longer fight, and neither can attach to a
// stale browser left by a killed run.
//
//   node tools/gates.mjs              every gate, in parallel        (~3 min)
//   node tools/gates.mjs songs        only what a song change breaks (~30 s)
//   node tools/gates.mjs --serial     one at a time, the old way
//   node tools/gates.mjs --list       what is in each lane
//
// ☠️ THE LANE IS FOR ITERATING, THE FULL RUN IS FOR SHIPPING. `songs` skips
// the design gates because song DATA cannot reach the artboard comparison or
// the drawn-control probes. That is a claim about this repo today, not a law:
// run the full suite before you push, which is what the ship rule already says.
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

// every gate, slowest first so the long pole starts immediately and the short
// ones fill in behind it
const ALL = [
  'tools/canon-journeys.mjs',
  'tools/overlay.mjs',
  'tools/surface-check.mjs',
  'tools/canon-samples.mjs',
  'tools/void-check.mjs',
  'tools/seek-probe.mjs',
  'tools/canon-geometry.mjs',
  'tools/responsive-probe.mjs',
  'tools/canon-runtime.mjs',
  'tools/canon-clickable.mjs',
  'tools/press-probe.mjs',
  'tools/restart-probe.mjs',
  'tools/bars-probe.mjs',
  'tools/finger-probe.mjs',
  'test/check.mjs',
  'test/import-roundtrip.mjs',
  'tools/score-render-check.mjs',
  'tools/hand-audit.mjs',
  'tools/finger-check.mjs',
  'tools/shell-check.mjs',
  'tools/leave-probe.mjs',
  'tools/phone-library-probe.mjs',
  'tools/trial-probe.mjs',
  'tools/lesson-walk-probe.mjs',
  'tools/teacher-walk-probe.mjs',
  'tools/learning-order-probe.mjs',
];

// What a change to the SONG DATA (songs-imported, songs-fingers, tiers-refused,
// art) can actually break. Each of these reads songs; the ones left out draw
// the design's own screens from fixtures and never see the library's contents.
const LANES = {
  all: ALL,
  songs: [
    'tools/canon-journeys.mjs',   // opens a song from the library and plays it
    'tools/void-check.mjs',       // the library screens render song tiles
    'tools/canon-samples.mjs',    // real data must replace every drawn sample
    'test/check.mjs',             // song shape, ids, counts, tier ladder
    'test/import-roundtrip.mjs',  // the importer itself
    'tools/score-render-check.mjs',
    'tools/hand-audit.mjs',       // every shipped song is playable
    'tools/finger-check.mjs',     // fingering still matches its hand
  ],
};

const args = process.argv.slice(2);
const serial = args.includes('--serial');
const lane = args.find((a) => !a.startsWith('--')) ?? 'all';
if (args.includes('--list')) {
  for (const [name, list] of Object.entries(LANES)) console.log(`${name.padEnd(6)} ${list.length} gates\n  ${list.join('\n  ')}`);
  process.exit(0);
}
const gates = LANES[lane];
if (!gates) { console.error(`no lane called ${lane}; try: ${Object.keys(LANES).join(', ')}`); process.exit(2); }

const run = (gate) => new Promise((res) => {
  const started = Date.now();
  const out = [];
  const p = spawn(process.execPath, [join(ROOT, gate)], { cwd: ROOT });
  p.stdout.on('data', (d) => out.push(d));
  p.stderr.on('data', (d) => out.push(d));
  p.on('close', (code) => res({ gate, code, secs: Math.round((Date.now() - started) / 1000), text: Buffer.concat(out).toString() }));
});

// Five at a time. Each gate drives its own headless Chrome, and nineteen of
// those at once turns a measurement into a benchmark of the scheduler.
const LIMIT = serial ? 1 : 5;
const started = Date.now();
console.log(`${gates.length} gates, ${serial ? 'one at a time' : LIMIT + ' at a time'}\n`);

const queue = [...gates];
const results = [];
await Promise.all(Array.from({ length: Math.min(LIMIT, queue.length) }, async () => {
  while (queue.length) {
    const r = await run(queue.shift());
    results.push(r);
    console.log(`${r.code === 0 ? 'PASS' : 'FAIL'}  ${r.gate.replace(/^tools\/|^test\//, '').padEnd(24)} ${String(r.secs).padStart(4)}s`);
  }
}));

// A gate that measures TIME (seek-probe's picture-versus-sound drift) can fail
// only because five browsers were sharing the machine: it read 1.13 and 1.04
// beats under the parallel run on 2026-09-06 and 0.21 alone, twice. A failure
// gets ONE solo re-run before it is called red; a real defect fails again.
for (const r of results.filter((x) => x.code !== 0)) {
  console.log(`
retrying ${r.gate} alone (it may have lost a timing race under load)`);
  const again = await run(r.gate);
  console.log(`${again.code === 0 ? 'PASS' : 'FAIL'}  ${again.gate.replace(/^tools\/|^test\//, '').padEnd(24)} ${String(again.secs).padStart(4)}s  (solo re-run)`);
  if (again.code === 0) { r.code = 0; r.text = again.text; r.retried = true; }
}
const failed = results.filter((r) => r.code !== 0);
const wall = Math.round((Date.now() - started) / 1000);
const cpu = results.reduce((a, r) => a + r.secs, 0);
console.log(`\n${results.length - failed.length}/${results.length} green in ${wall}s wall clock (${cpu}s of work)`);
for (const f of failed) {
  console.log(`\n---- ${f.gate} (exit ${f.code}) ----`);
  console.log(f.text.split('\n').slice(-25).join('\n'));
}
if (lane !== 'all') console.log(`\nthis is the ${lane} lane, not the whole suite: run 'node tools/gates.mjs' before you push`);
process.exit(failed.length ? 1 : 0);
