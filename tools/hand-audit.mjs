// IS THE HAND SPLIT PLAYABLE, AND WAS IT ARRANGED OR GUESSED?
//
// Mark, 2026-08-30: "if this is wrong this will teach me the songs wrong ... we
// can't make the same mistake we did with Fur Elise and with interstellar."
//
// Rules corrected by a Codex council the same day. The first draft of this file
// was too generous in one place and plain wrong in two others:
//   - it allowed a 17-semitone chord. A tenth is 16 and is NOT generally
//     playable. Over 14 simultaneously depressed is a hard failure.
//   - it measured leaps between arbitrary consecutive notes and in BEATS, so it
//     condemned a two-octave move at 63bpm (950ms, entirely playable) and let a
//     fast one through. Movement is now measured between hand CLUSTERS in real
//     SECONDS.
//   - it ignored sustained notes. 10,821 of the library's 21,770 onset groups
//     begin while earlier notes are still sounding, and a hand holding a bass
//     octave cannot also collect an inner voice. Reach now counts what the hand
//     is still holding down.
// And a one-handed EASY arrangement is deliberate, not a defect.
//
// The last check is the one that matters most for the future: THRESHOLD SPLIT.
// If a song's hands separate almost perfectly at a fixed pitch, nobody arranged
// it, a script cut it in half, and that is how the right hand ended up with the
// melody and the inner voices and 29-semitone chords.
//
// Usage: node tools/hand-audit.mjs [--all] [--id <songId>]
import { SONGS } from '../js/songs.mjs';

const NAME = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const name = (m) => NAME[m % 12] + (Math.floor(m / 12) - 1);
const SPAN_MAX = 14;      // simultaneously depressed, including held notes
const FINGERS = 5;
const TRAVEL_MAX = 120;   // semitones per second, hand cluster to hand cluster
const showAll = process.argv.includes('--all');
const onlyId = process.argv[process.argv.indexOf('--id') + 1];

const findings = [];
const list = onlyId && process.argv.includes('--id') ? SONGS.filter((s) => s.id === onlyId) : SONGS;

for (const song of list) {
  const notes = (song.notes || []).slice().sort((a, b) => a.b - b.b);
  if (notes.length < 12) continue;
  const bpm = song.bpm || 100;
  const add = (kind, detail) => findings.push({ song: song.id, kind, detail });
  // hands taken off an engraved score: the composer is the authority there
  const fromScore = /mutopia|wikimedia/i.test(song.source || '');

  const byBeat = new Map();
  for (const n of notes) {
    const k = Math.round(n.b * 1000) / 1000;
    if (!byBeat.has(k)) byBeat.set(k, []);
    byBeat.get(k).push(n);
  }
  const beats = [...byBeat.keys()].sort((a, b) => a - b);

  // sweep line: what is each hand still holding at this moment
  let held = [];
  let last = { L: null, R: null, beat: null };
  let crossed = 0, crossedEg = null, over = 0, overEg = null, fingers = 0, fingerEg = null;
  let travel = 0, travelEg = null;

  for (const beat of beats) {
    held = held.filter((x) => x.until > beat + 1e-6);
    const group = byBeat.get(beat);
    for (const h of ['L', 'R']) {
      const now = group.filter((n) => n.h === h).map((n) => n.m);
      if (!now.length) continue;
      const active = [...now, ...held.filter((x) => x.h === h).map((x) => x.m)].sort((a, b) => a - b);
      const span = active[active.length - 1] - active[0];
      if (span > SPAN_MAX) {
        over++;
        if (!overEg) overEg = `beat ${beat}: ${h === 'L' ? 'left' : 'right'} hand holding ${name(active[0])} to ${name(active[active.length - 1])}, ${span} semitones`;
      }
      if (new Set(active).size > FINGERS) {
        fingers++;
        if (!fingerEg) fingerEg = `beat ${beat}: ${new Set(active).size} keys down in one hand`;
      }
      // movement between hand CLUSTERS, in real seconds
      const centre = (active[0] + active[active.length - 1]) / 2;
      if (last[h] !== null && last.beat !== null) {
        const secs = (beat - last.beat) * 60 / bpm;
        if (secs > 0) {
          const rate = Math.abs(centre - last[h]) / secs;
          if (rate > TRAVEL_MAX) {
            travel++;
            if (!travelEg) travelEg = `beat ${last.beat} to ${beat}: ${h === 'L' ? 'left' : 'right'} hand must cover ${Math.round(Math.abs(centre - last[h]))} semitones in ${Math.round(secs * 1000)}ms`;
          }
        }
      }
      last[h] = centre;
    }
    const l = group.filter((n) => n.h === 'L').map((n) => n.m);
    const r = group.filter((n) => n.h === 'R').map((n) => n.m);
    if (l.length && r.length && Math.min(...r) < Math.max(...l)) {
      crossed++;
      if (!crossedEg) crossedEg = `beat ${beat}: right hand on ${name(Math.min(...r))} under left hand on ${name(Math.max(...l))}`;
    }
    for (const n of group) held.push({ m: n.m, until: n.b + (n.d || 0), h: n.h });
    last.beat = beat;
  }

  // ☠️ REACH WITHIN A BEAT. Mark found this by PLAYING, after every check here
  // passed the song: "the range on the left hand seemed like it was very far
  // apart ... on the version that I did it was only about eight keys apart."
  // He was right, and nothing here saw it. The simultaneous-span rule only
  // looks at notes struck together, and the travel rule is a RATE: 22 semitones
  // across a beat at 105bpm is 38 a second, comfortably under a threshold set
  // at what a trained pianist can do. But a learner's hand does not roam two
  // octaves between one beat and the next, and an arrangement that asks it to
  // has put the bass and a mid-register figure in the same hand.
  {
    const line = notes.filter((n) => n.h === 'L' || n.h === 'R');
    for (const h of ['L', 'R']) {
      const hn = line.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
      let worst = 0, eg = null;
      for (let i = 0; i < hn.length; i++) {
        let lo = hn[i].m, hi = hn[i].m;
        for (let j = i + 1; j < hn.length && hn[j].b - hn[i].b <= 1; j++) {
          lo = Math.min(lo, hn[j].m); hi = Math.max(hi, hn[j].m);
        }
        if (hi - lo > worst) { worst = hi - lo; eg = `beat ${hn[i].b}: ${name(lo)} up to ${name(hi)}`; }
      }
      // ☠️ AND NOT WHEN THE COMPOSER WROTE IT. A Romantic left hand genuinely
      // sweeps two octaves inside a beat: Clair de Lune does 38 semitones,
      // Liebestraum 50, the Op.9 nocturne 26. Where the hands came off an
      // ENGRAVED SCORE that is the piece, not a defect, and flagging it is the
      // tool marking Chopin's homework. This rule is for arrangements a script
      // made, where a wide reach means the bass and an inner voice landed in
      // the same hand by accident.
      if (worst > 18 && !fromScore) add('hand roams too far in one beat',
        `${h === 'L' ? 'left' : 'right'} hand covers ${worst} semitones inside a beat; ${eg}`);
    }
  }
  if (over) add('chord no hand can hold', `${over} moments; e.g. ${overEg}`);
  if (fingers) add('more than five keys in one hand', `${fingers} moments; e.g. ${fingerEg}`);
  if (crossed) add('crossed hands', `${crossed} moments; e.g. ${crossedEg}`);
  if (travel) add('hand cannot travel that fast', `${travel} moments; e.g. ${travelEg}`);

  // THRESHOLD SPLIT: do the hands separate almost perfectly at a fixed pitch?
  const L = notes.filter((n) => n.h === 'L').map((n) => n.m);
  const R = notes.filter((n) => n.h === 'R').map((n) => n.m);
  if (L.length > 20 && R.length > 20) {
    let bestCut = 0, bestPurity = 0;
    for (let cut = 24; cut <= 96; cut++) {
      const ok = L.filter((m) => m < cut).length + R.filter((m) => m >= cut).length;
      const purity = ok / (L.length + R.length);
      if (purity > bestPurity) { bestPurity = purity; bestCut = cut; }
    }
    // ☠️ A CLEAN SPLIT IS NOT ITSELF A DEFECT. The first version of this rule
    // said "no arranger splits hands that cleanly, a script did", and it was
    // wrong: most simple piano writing puts the hands in separate registers, so
    // it fired on the Gymnopedie, the Op.9 nocturne and the Rondo alla Turca,
    // all of which take their hands straight off an engraved score. 36 songs
    // were accused on that basis alone. What actually identifies a script is a
    // clean split that is ALSO unplayable: a real arranger's hands separate
    // neatly AND stay within reach, a threshold does the first and not the
    // second. Both, or it is not evidence.
    if (bestPurity > 0.985 && (over || travel || fingers || crossed)) {
      add('threshold split', `${(bestPurity * 100).toFixed(1)}% of notes fall on one side of ${name(bestCut)}, ` +
        'and the result is unplayable: a script cut this by pitch');
    }
  }

  // fingering that no longer matches its hand is worse than no fingering
  //
  // ☠️ WHAT THIS RULE MEANS IS "THE FINGERING PREDATES A HAND CHANGE", not "the
  // song has fingering". Fingering derived by tools/finger.mjs is computed FROM
  // the shipped hands, after the corrections and the re-sort songs.mjs applies,
  // so it cannot predate them: it is the one kind that is stale-proof by
  // construction. Without this distinction, filling in the missing fingering
  // that Mark asked for lit up 40 songs as suspect purely for having any, which
  // would have buried the 62 real hand defects under noise of my own making.
  const fingered = notes.filter((n) => n.f != null);
  if (fingered.length && song.handAssignment === 'generated' && !song.fingeringDerived) {
    add('fingering may be stale', `${fingered.length} notes carry a finger number but the hands were generated`);
  }
}

const byKind = new Map();
for (const f of findings) {
  if (!byKind.has(f.kind)) byKind.set(f.kind, []);
  byKind.get(f.kind).push(f);
}
console.log(`${list.length} songs audited\n`);
for (const [kind, l] of [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`### ${kind.toUpperCase()}  (${l.length})`);
  for (const f of (showAll ? l : l.slice(0, 10))) console.log(`  ${f.song.padEnd(26)} ${f.detail}`);
  if (!showAll && l.length > 10) console.log(`  ... and ${l.length - 10} more, run with --all`);
  console.log('');
}
const songsAffected = new Set(findings.map((f) => f.song));
console.log(`${songsAffected.size} of ${list.length} songs have at least one problem`);
process.exit(findings.length ? 1 : 0);
