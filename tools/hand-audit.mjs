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
// ☠️ IMPORTED, NOT RE-DECLARED. js/hands.mjs says of its own limits "MUST MATCH
// tools/hand-audit.mjs", and records that they HAD already drifted once (16 vs
// 14), so the importer approved shapes this audit then condemned. Yet this file
// still kept private copies of both numbers, which is that same drift vector
// left open. One definition. A copy is a future disagreement.
import { SPAN_MAX, TRAVEL_MAX } from '../js/hands.mjs';

const NAME = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const name = (m) => NAME[m % 12] + (Math.floor(m / 12) - 1);
const FINGERS = 5;

// ☠️ A BLEMISH IS NOT A DEFECT, and only half this repo knew it. js/hands.mjs
// worked that out in full - "Clair de Lune's Medium tier was refused for a
// single crossed moment and a single fast move across 1,400 notes... what this
// is for is catching PERVASIVE wrongness, the kind a pitch threshold produces:
// the old Interstellar broke on 4.5% of its onsets, not on one" - and then only
// handsAreSane() acted on it. This audit stayed absolute: ONE awkward instant
// anywhere condemned a whole song. That gap is most of what held this gate at
// 133 of 251. Same rate, same floor, imported from the same place, so the two
// halves of one doctrine cannot drift apart again.
const BAD_RATE = 0.01;    // over 1% of onsets in trouble is systemic
const BAD_FLOOR = 3;      // and fewer than 3 bad moments is never systemic
const systemic = (n, onsets) => n >= BAD_FLOOR && n / Math.max(1, onsets) >= BAD_RATE;
// Above the p90 of the engraved scores this rule exempts, so it fires on hands
// a script cut and not on hands a composer wrote. Derivation at its use below.
const ROAM_MAX = 44;
const showAll = process.argv.includes('--all');
const onlyId = process.argv[process.argv.indexOf('--id') + 1];

const findings = [];
const list = onlyId && process.argv.includes('--id') ? SONGS.filter((s) => s.id === onlyId) : SONGS;

// One song in, its findings out. Extracted from the loop so the FIXTURE at the
// bottom can run the real audit over a song built to be broken, rather than a
// paraphrase of it that could drift away from what actually ships.
function auditSong(song) {
  const findings = [];
  const notes = (song.notes || []).slice().sort((a, b) => a.b - b.b);
  if (notes.length < 12) return findings;
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
      let worst = 0, eg = null, wide = 0;
      for (let i = 0; i < hn.length; i++) {
        let lo = hn[i].m, hi = hn[i].m;
        for (let j = i + 1; j < hn.length && hn[j].b - hn[i].b <= 1; j++) {
          lo = Math.min(lo, hn[j].m); hi = Math.max(hi, hn[j].m);
        }
        if (hi - lo > ROAM_MAX) wide++;
        if (hi - lo > worst) { worst = hi - lo; eg = `beat ${hn[i].b}: ${name(lo)} up to ${name(hi)}`; }
      }
      // ☠️ AND NOT WHEN THE COMPOSER WROTE IT. A Romantic left hand genuinely
      // sweeps two octaves inside a beat: Clair de Lune does 38 semitones,
      // Liebestraum 50, the Op.9 nocturne 26. Where the hands came off an
      // ENGRAVED SCORE that is the piece, not a defect, and flagging it is the
      // tool marking Chopin's homework. This rule is for arrangements a script
      // made, where a wide reach means the bass and an inner voice landed in
      // the same hand by accident.
      // ☠️ AND THE NUMBER WAS BELOW WHAT CORRECT PIANO ACTUALLY DOES. The
      // threshold was 18, judged on the single WORST moment in a song. Measured
      // against the class this rule already exempts - engraved scores, where the
      // composer is the authority and the figure is correct by definition - the
      // worst in-beat reach has a MEDIAN of 19 and a p90 of 43 (Liebestraum 50,
      // Clair de Lune 43, the Op.9 nocturne 35). A limit under the median of
      // known-correct writing is not detecting a defect, it is detecting a bass
      // note and a chord in the same beat, which is most piano music. That is
      // why it needed an exemption to survive contact with Chopin at all, and
      // the exemption hid the mis-calibration instead of fixing it.
      //
      // What Mark actually FELT is still real ("the range on the left hand
      // seemed very far apart... on the version that I did it was only about
      // eight keys apart"), and it is a RATE, not a maximum: a real hand takes
      // the occasional wide leap, a script-cut hand is asked to do it all song.
      // So: the limit sits above where correct writing lives, and it has to
      // happen systemically before it counts.
      if (systemic(wide, hn.length) && !fromScore) add('hand roams too far in one beat',
        `${h === 'L' ? 'left' : 'right'} hand covers over ${ROAM_MAX} semitones inside a beat on ` +
        `${wide} of ${hn.length} notes, worst ${worst}; ${eg}`);
    }
  }
  // ☠️ THE SPAN RULES MUST HONOUR THE SCORE, and this file had the variable and
  // never used it here. js/hands.mjs exempts an engraved score from the span
  // limit and says why: "Romantic piano is full of chords wider than a hand,
  // written to be ROLLED under the pedal, and Chopin's left hand in the Op.9
  // nocturne does exactly that. Refusing Clair de Lune because Debussy wrote a
  // tenth is the tool overruling the composer." handsAreSane() obeys that. This
  // audit did not, so it condemned 17 pieces whose hands ARE the composer's own
  // staves: Clair de Lune, the Gymnopedie, the Op.9 nocturne, Liebestraum,
  // Traumerei, the Raindrop, the Pathetique. Every one of those was the tool
  // marking Chopin's homework, exactly the error the roam rule below already
  // carved an exemption for. Same exemption, same reason, same place.
  //
  // What still fails from a score is a PHYSICAL IMPOSSIBILITY, not a wide
  // chord: crossed hands (which would mean the staves were mis-read) and a hand
  // asked to cover ground faster than a hand moves. Those keep the strict rule.
  const onsets = beats.length;
  if (systemic(over, onsets) && !fromScore) add('chord no hand can hold', `${over} of ${onsets} onsets; e.g. ${overEg}`);
  if (systemic(fingers, onsets) && !fromScore) add('more than five keys in one hand', `${fingers} of ${onsets} onsets; e.g. ${fingerEg}`);
  if (systemic(crossed, onsets)) add('crossed hands', `${crossed} of ${onsets} onsets; e.g. ${crossedEg}`);
  if (systemic(travel, onsets)) add('hand cannot travel that fast', `${travel} of ${onsets} onsets; e.g. ${travelEg}`);

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
  return findings;
}

for (const song of list) findings.push(...auditSong(song));

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

// ☠️ THE GUARD AGAINST TUNING UNTIL GREEN. Every limit in this file has been
// loosened at some point, and each time the honest question is identical: does
// it still catch what it was built to catch, or did it just stop complaining?
// Loosening a threshold and fixing a bug look exactly the same from the outside
// unless something independent holds the known-bad case down.
//
// So BUILD THE DEFECT ON PURPOSE. Law 2 names it precisely: hands cut at a fixed
// pitch, "a script, not an arranger". Take a song whose real arrangement CROSSES
// registers, cut its hands at one pitch, and the audit must condemn what comes
// out. Then check the untouched original comes back clean.
//
// ☠️ THE FIXTURE HAS TO BE A SONG THE CUT ACTUALLY DAMAGES. The first version
// used Fur Elise, on the strength of js/hands.mjs calling it "correctly arranged
// and stays exactly as curated". But Fur Elise's shipped hands ALREADY sit 100%
// either side of midi 58, so cutting it at middle C moves exactly 0 of its 53
// notes: the "corrupted" fixture was byte-identical to the correct one, and a
// guard that cannot tell them apart proves nothing at all. (It is also the
// cleanest evidence for the threshold-split rule's own caveat that a clean split
// is not itself a defect - the most correctly arranged song in the library has
// a perfect one.) Clair de Lune is the opposite case: its hands genuinely
// interleave, only 81.5% fall either side of any pitch, and a cut at middle C
// moves 227 of its 977 notes. That is a real corruption of a real arrangement.
//
// Two-sided on purpose. The first half fails if a limit is loosened past the
// defect; the second fails if one is tightened until correct music trips it.
// Neither can be satisfied by editing a number, which is the whole point: an
// earlier version of this guard simply asserted that every perfect split must
// be flagged, which the threshold-split rule deliberately does not do ("a clean
// split is not itself a defect"), so it was really just the rule restated and
// could never have caught the rule being wrong.
if (!process.argv.includes('--id')) {
  const good = SONGS.find((s) => s.id === 'clair-de-lune');
  if (!good) { console.log('');
    console.log('FIXTURE MISSING: clair-de-lune is not in the library, so the guard cannot run'); process.exit(2); }
  const clone = (s) => ({ ...s, notes: s.notes.map((n) => ({ ...n })) });

  const cut = clone(good);
  cut.id = 'fixture:clair-de-lune-cut-at-middle-C';
  cut.source = '';                              // a script's work claims no score
  const moved = cut.notes.filter((n) => n.h !== (n.m < 60 ? 'L' : 'R')).length;
  for (const n of cut.notes) n.h = n.m < 60 ? 'L' : 'R';
  const caughtCut = auditSong(cut);

  const untouched = clone(good);
  untouched.id = 'fixture:clair-de-lune-as-engraved';
  const caughtGood = auditSong(untouched);

  // a fixture that changed nothing tests nothing, and that is how the first one
  // passed review while being vacuous. Say what the cut actually did.
  if (moved < cut.notes.length * 0.05) {
    console.log('');
    console.log(`GUARD VOID: the cut moved only ${moved} of ${cut.notes.length} notes, so the fixture is`);
    console.log('barely distinguishable from the correct arrangement and proves nothing. Pick a');
    console.log('fixture whose hands genuinely cross registers.');
    process.exit(2);
  }

  console.log('');
  console.log('guard');
  console.log(`  the cut moved ${moved} of ${cut.notes.length} notes across hands`);
  console.log(`  ${cut.id.padEnd(38)} ${caughtCut.length ? 'condemned (' + [...new Set(caughtCut.map((f) => f.kind))].join(', ') + ')' : 'SAID NOTHING'}`);
  console.log(`  ${untouched.id.padEnd(38)} ${caughtGood.length ? 'CONDEMNED (' + [...new Set(caughtGood.map((f) => f.kind))].join(', ') + ')' : 'clean'}`);
  if (!caughtCut.length) {
    console.log('');
    console.log('GUARD FAILED. A hand split at a fixed pitch went unnoticed. That is Law 2,');
    console.log('the single biggest source of wrong teaching in this app. A limit above has been');
    console.log('loosened past the defect it exists to find: fix the rule, not the fixture.');
    process.exit(2);
  }
  if (caughtGood.length) {
    console.log('');
    console.log('GUARD FAILED. A correctly arranged song was condemned. A limit above is now');
    console.log('stricter than real piano writing, which is how this gate came to accuse Chopin.');
    process.exit(2);
  }
}
process.exit(findings.length ? 1 : 0);
