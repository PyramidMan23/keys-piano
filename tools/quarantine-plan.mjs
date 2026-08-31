// WHAT WOULD QUARANTINING THE REAL DEFECTS ACTUALLY COST?
//
// The council's recommendation is to pull only the tiers holding an unambiguous
// defect: a SIMULTANEOUS reach no hand makes, or a move faster than 120
// semitones a second. Everything else stays playable.
//
// Before doing that to Mark's library, show him exactly what disappears. A plan
// that says "42 defects" tells him nothing; a plan that says "Pirates loses its
// Hard tier and keeps Easy and Medium" is a decision he can actually make.
//
//   node tools/quarantine-plan.mjs
import { join } from 'node:path';

const ROAM_MAX = 18, TRAVEL_MAX = 120;
const { SONGS } = await import('file:///' + join(import.meta.dirname, '..', 'js', 'songs.mjs').replace(/\\/g, '/'));

const hits = [];
for (const song of SONGS) {
  if (!song.notes || song.notes.length < 20) continue;
  if (/mutopia|wikimedia|engraved|score/i.test(song.source || '')) continue;
  const bpm = song.bpm || 120;
  for (const h of ['L', 'R']) {
    const hn = song.notes.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
    let worst = 0, lo = null, hi = null;
    for (let i = 0; i < hn.length; i++) {
      let a = hn[i], b = hn[i];
      for (let j = i + 1; j < hn.length && hn[j].b - hn[i].b <= 1; j++) {
        if (hn[j].m < a.m) a = hn[j];
        if (hn[j].m > b.m) b = hn[j];
      }
      if (b.m - a.m > worst) { worst = b.m - a.m; lo = a; hi = b; }
    }
    if (worst <= ROAM_MAX) continue;
    const overlap = lo.b < hi.b + hi.d - 1e-6 && hi.b < lo.b + lo.d - 1e-6;
    const gapSec = (Math.abs(hi.b - lo.b) / bpm) * 60;
    const speed = gapSec > 0 ? worst / gapSec : Infinity;
    if (overlap || speed > TRAVEL_MAX) {
      hits.push({ id: song.id, group: song.group ?? song.id, why: overlap ? 'a reach' : 'too fast', worst });
    }
  }
}

const all = new Map();
for (const s of SONGS) { const g = s.group ?? s.id; if (!all.has(g)) all.set(g, []); all.get(g).push(s.id); }
const byGroup = new Map();
for (const x of hits) { if (!byGroup.has(x.group)) byGroup.set(x.group, new Map()); byGroup.get(x.group).set(x.id, x); }

console.log(`${hits.length} unambiguous defects across ${byGroup.size} songs.\n`);
let pulled = 0, wiped = [];
for (const [g, ids] of [...byGroup].sort()) {
  const total = all.get(g).length;
  const kept = all.get(g).filter((id) => !ids.has(id));
  pulled += ids.size;
  if (!kept.length) wiped.push(g);
  const why = [...ids.values()].map((x) => `${x.id.replace(g, '').replace(/^-/, '') || 'base'} (${x.why}, ${x.worst} semitones)`).join('; ');
  console.log(`  ${g.padEnd(24)} pull ${ids.size}/${total}: ${why}`);
  console.log(`  ${' '.repeat(24)} ${kept.length ? 'KEEPS ' + kept.join(', ') : '*** NOTHING LEFT, the whole song goes ***'}`);
}
console.log(`\n${pulled} tiers pulled. ${wiped.length} songs would disappear entirely${wiped.length ? ': ' + wiped.join(', ') : ''}.`);
console.log(`${all.size - wiped.length} of ${all.size} songs survive.`);
