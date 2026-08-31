// WOULD A CONTIGUOUS SPLIT FIX THE CROSSINGS? A cheap experiment before
// committing to a rewrite: for the songs whose tiers are refused, compare the
// incumbent repairHands (+ unpedal + repairSplit) against splitHands, counting
// each fault kind separately so a trade is visible rather than averaged away.
//
//   node tools/split-experiment.mjs jaws overwatch x-files next-episode
import { readFileSync } from 'node:fs';
import { parseMidi, midiNotes, tempoOf } from './midi.mjs';
import { repairHands } from '../js/hands.mjs';
import { unpedal, repairSplit, splitHands, splitHeld, violations } from './handsplit.mjs';

const DIRS = ['C:/Users/markh/keys-piano-tools/workshop', 'C:/Users/markh/keys-piano-tools/workshop/comp', 'C:/Users/markh/keys-piano-tools/workshop/full'];
const tally = (ns, bpm) => {
  const v = violations(ns, bpm);
  const by = {};
  for (const x of v) by[x.kind] = (by[x.kind] || 0) + 1;
  return { total: v.length, ...by };
};
const show = (t) => `total ${String(t.total).padStart(4)}  roam ${String(t.roam || 0).padStart(3)}` +
  `  span ${String(t.span || 0).padStart(3)}  keys ${String(t.keys || 0).padStart(3)}` +
  `  cross ${String(t.cross || 0).padStart(4)}  travel ${String(t.travel || 0).padStart(3)}`;

for (const slug of process.argv.slice(2)) {
  let file = null;
  for (const d of DIRS) { try { readFileSync(d + '/' + slug + '.mid'); file = d + '/' + slug + '.mid'; break; } catch {} }
  if (!file) { console.log(`${slug}: no .mid found`); continue; }
  const mid = parseMidi(readFileSync(file));
  const raw = midiNotes(mid);
  const bpm = tempoOf(mid).bpm;
  const grid = 4, snap = (v) => Math.round(v * grid) / grid;
  for (const n of raw) { n.b = snap(n.b); n.d = Math.max(1 / grid, snap(n.d)); }
  const seen = new Set(); const notes = [];
  for (const n of raw.filter((x) => x.vel > 12).sort((a, b) => a.b - b.b || a.m - b.m)) {
    const k = n.b + ':' + n.m; if (seen.has(k)) continue; seen.add(k); notes.push(n);
  }

  // A: what ships today
  const a = notes.map((n) => ({ ...n }));
  repairHands(a, bpm); unpedal(a, bpm); repairSplit(a, bpm);

  // B: contiguous split instead of repairHands, then the same treatment
  const b = notes.map((n) => ({ ...n }));
  repairHands(b, bpm);              // only to seed hands so unpedal can group by hand
  unpedal(b, bpm);
  const hands = splitHands(b);
  b.forEach((n, i) => { n.h = hands[i]; });
  repairSplit(b, bpm);

  // C: the held-aware beam, deliberately with NO repairSplit after it, so the
  // number is the beam's own work and not the hill-climb's
  const c = notes.map((n) => ({ ...n }));
  repairHands(c, bpm); unpedal(c, bpm);
  const hc = splitHeld(c, bpm);
  c.forEach((n, i) => { n.h = hc[i]; });

  // D: the beam, then the hill-climb, to see whether it still adds anything
  const d = notes.map((n) => ({ ...n }));
  repairHands(d, bpm); unpedal(d, bpm);
  const hd = splitHeld(d, bpm);
  d.forEach((n, i) => { n.h = hd[i]; });
  repairSplit(d, bpm);

  console.log(`\n${slug}  (${notes.length} notes, ${bpm}bpm)`);
  console.log(`  incumbent      ${show(tally(a, bpm))}`);
  console.log(`  contiguous     ${show(tally(b, bpm))}`);
  console.log(`  held-beam      ${show(tally(c, bpm))}`);
  console.log(`  beam + repair  ${show(tally(d, bpm))}`);
}
