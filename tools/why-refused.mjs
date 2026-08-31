// WHY is a tier refused? The importer prints one message covering three very
// different faults, which is not enough to act on.
import { readFileSync } from 'node:fs';
import { parseMidi, midiNotes, tempoOf } from './midi.mjs';
import { repairHands, SPAN_MAX, TRAVEL_MAX } from '../js/hands.mjs';
import { unpedal, repairSplit } from './handsplit.mjs';

const file = process.argv[2];
const mid = parseMidi(readFileSync(file));
const raw = midiNotes(mid);
const bpm = tempoOf(mid).bpm;
const grid = 4, snap = (v) => Math.round(v * grid) / grid;
for (const n of raw) { n.b = snap(n.b); n.d = Math.max(1 / grid, snap(n.d)); }
const seen = new Set(); const notes = [];
for (const n of raw.filter((x) => x.vel > 12).sort((a, b) => a.b - b.b || a.m - b.m)) {
  const k = n.b + ':' + n.m; if (seen.has(k)) continue; seen.add(k); notes.push(n);
}
repairHands(notes, bpm);
const cut = unpedal(notes, bpm);
const fixed = repairSplit(notes, bpm);
console.log('repair moved ' + fixed + ' notes');
console.log(`${notes.length} notes, ${cut} shortened by the pedal pass, bpm ${bpm}`);
console.log(`limits: span ${SPAN_MAX} semitones, travel ${TRAVEL_MAX} semitones/sec\n`);

const beats = [...new Set(notes.map((n) => n.b))].sort((a, b) => a - b);
let over = 0, crossed = 0, fast = 0, fastEg = '', crossEg = '', overEg = '';
let held = [];
for (const beat of beats) {
  held = held.filter((x) => x.b + x.d > beat + 1e-6);
  const now = notes.filter((n) => Math.abs(n.b - beat) < 1e-6);
  for (const n of now) if (!held.includes(n)) held.push(n);
  const L = held.filter((n) => n.h === 'L').map((n) => n.m);
  const R = held.filter((n) => n.h === 'R').map((n) => n.m);
  if (L.length && R.length && Math.max(...L) > Math.min(...R)) {
    crossed++; if (!crossEg) crossEg = `beat ${beat}: L up to ${Math.max(...L)}, R down to ${Math.min(...R)}`;
  }
  for (const [h, ms] of [['L', L], ['R', R]]) {
    if (ms.length < 2) continue;
    const s = Math.max(...ms) - Math.min(...ms);
    if (s > SPAN_MAX) { over++; if (!overEg) overEg = `beat ${beat}: ${h} spans ${s}`; }
  }
}
for (const h of ['L', 'R']) {
  const hn = notes.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
  for (let i = 1; i < hn.length; i++) {
    const dt = ((hn[i].b - hn[i - 1].b) / bpm) * 60;
    if (dt <= 0) continue;
    const v = Math.abs(hn[i].m - hn[i - 1].m) / dt;
    if (v > TRAVEL_MAX) { fast++; if (!fastEg) fastEg = `beat ${hn[i].b}: ${h} moves ${Math.abs(hn[i].m - hn[i - 1].m)} semitones in ${dt.toFixed(3)}s = ${Math.round(v)}/s`; }
  }
}
console.log(`chords over ${SPAN_MAX} semitones : ${over}   ${overEg}`);
console.log(`crossed hands                : ${crossed}   ${crossEg}`);
console.log(`travel over ${TRAVEL_MAX}/s        : ${fast}   ${fastEg}`);
