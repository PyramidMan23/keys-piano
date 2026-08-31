// IS A "ROAM" FLAG A DEFECT, OR IS IT JUST PIANO?
//
// hand-audit's largest category says things like "left hand covers 19 semitones
// inside a beat; beat 20: G2 up to D4". That is the shape of an ORDINARY
// accompaniment: strike the bass, then the chord above it. The hand MOVES; it
// never spans nineteen semitones at once.
//
// ☠️ RECONCILED TO THE AUDIT'S OWN BASIS, and the first version was not.
// Codex, in council: "the target category contains 159 flagged moments, yet the
// classification totals 240. Until every original flag maps one-to-one into
// those buckets, the 90% claim is unsupported." Correct, and the mismatch was
// three separate mistakes: hand-audit's threshold is 18 semitones (not 14), it
// reports the WORST roam per song per hand as ONE finding (not one per note),
// and it skips songs whose hands came off an engraved score. This now counts
// exactly what the audit counts, so the two numbers must agree or the tool is
// wrong.
import { join } from 'node:path';

const ROAM_MAX = 18;      // hand-audit.mjs: `if (worst > 18 && !fromScore)`
const { SONGS } = await import('file:///' + join(import.meta.dirname, '..', 'js', 'songs.mjs').replace(/\\/g, '/'));

const rows = [];
for (const song of SONGS) {
  if (!song.notes || song.notes.length < 20) continue;
  // the audit exempts hands that came off a real score: those wide reaches ARE
  // the piece, and flagging them is marking Chopin's homework
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
    // the audit's exact finding. Now: is it a REACH or a MOVE?
    const overlap = lo.b < hi.b + hi.d - 1e-6 && hi.b < lo.b + lo.d - 1e-6;
    const gapBeats = Math.abs(hi.b - lo.b);
    const gapSec = (gapBeats / bpm) * 60;
    const speed = gapSec > 0 ? worst / gapSec : Infinity;
    rows.push({ id: song.id, h, worst, overlap, gapBeats, gapSec, speed, lo: lo.m, hi: hi.m, beat: lo.b });
  }
}

const sim = rows.filter((r) => r.overlap);
const seq = rows.filter((r) => !r.overlap);
console.log(`${rows.length} roam findings, counted exactly as hand-audit counts them`);
console.log(`  SIMULTANEOUS (both notes sounding, a real reach) : ${sim.length}`);
console.log(`  sequential   (the hand strikes, then moves)      : ${seq.length}`);
console.log(`  => ${rows.length ? Math.round((seq.length / rows.length) * 100) : 0}% are the hand MOVING\n`);

// Codex asked for travel TIME, not just distance: a leap is only hard if there
// is no time for it. The travel rule's own ceiling is 120 semitones/second.
const rushed = seq.filter((r) => r.speed > 120);
const comfy = seq.filter((r) => r.speed <= 120);
console.log(`of the ${seq.length} sequential ones:`);
console.log(`  faster than the 120 semitone/second ceiling : ${rushed.length}  (genuinely hard)`);
console.log(`  slower, i.e. there is time to move the hand : ${comfy.length}`);
const beginner = seq.filter((r) => r.speed > 40 && r.speed <= 120);
console.log(`  of those, above 40/s (a beginner's blind leap): ${beginner.length}\n`);

console.log('the simultaneous ones, which are real defects:');
for (const r of sim.slice(0, 10)) console.log(`  ${r.id.padEnd(26)} ${r.h} ${r.worst} semitones at beat ${r.beat}, midi ${r.lo}+${r.hi} sounding together`);
console.log('\na sample of the sequential ones:');
for (const r of seq.slice(0, 8)) console.log(`  ${r.id.padEnd(26)} ${r.h} ${r.worst} semitones, ${r.gapSec.toFixed(2)}s apart = ${Math.round(r.speed)}/s`);
