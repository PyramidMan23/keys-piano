// Show every unplayable moment in one song, with the fingering, so a fix can be
// judged rather than guessed.  node tools/inspect-song.mjs mario-hard
import { join } from 'node:path';

const id = process.argv[2];
const { SONGS } = await import('file:///' + join(import.meta.dirname, '..', 'js', 'songs.mjs').replace(/\\/g, '/'));
const s = SONGS.find((x) => x.id === id);
if (!s) { console.log('no song ' + id); process.exit(1); }
const bpm = s.bpm || 120;
console.log(`${id}: ${s.notes.length} notes, ${bpm}bpm, authored fingering on ${s.notes.filter((n) => n.f != null).length}`);

for (const h of ['L', 'R']) {
  const hn = s.notes.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
  for (let i = 0; i < hn.length; i++) {
    let lo = hn[i], hi = hn[i];
    for (let j = i + 1; j < hn.length && hn[j].b - hn[i].b <= 1; j++) {
      if (hn[j].m < lo.m) lo = hn[j];
      if (hn[j].m > hi.m) hi = hn[j];
    }
    const span = hi.m - lo.m;
    if (span <= 18) continue;
    const ov = lo.b < hi.b + hi.d - 1e-6 && hi.b < lo.b + lo.d - 1e-6;
    const gap = (Math.abs(hi.b - lo.b) / bpm) * 60;
    const sp = gap > 0 ? span / gap : Infinity;
    console.log(`  ${h} beat ${lo.b}: midi ${lo.m} (dur ${lo.d}, finger ${lo.f ?? '-'}) .. ` +
      `midi ${hi.m} (starts ${hi.b}, dur ${hi.d}, finger ${hi.f ?? '-'})  span ${span}  ` +
      (ov ? 'SOUNDING TOGETHER' : `sequential, ${gap.toFixed(3)}s = ${Math.round(sp)}/s`));
    // what else is in the other hand at that instant?
    const other = h === 'L' ? 'R' : 'L';
    const at = s.notes.filter((n) => n.h === other && n.b < hi.b + hi.d - 1e-6 && hi.b < n.b + n.d - 1e-6);
    console.log(`      the ${other === 'L' ? 'left' : 'right'} hand then holds: ${at.length ? at.map((n) => n.m).sort((a, b) => a - b).join(', ') : 'nothing'}`);
  }
}
