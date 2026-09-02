// Smallest thing that fails if the logic breaks: song data validity +
// engine wait mode, scoring windows, hands filter, looping, calibration.
import assert from 'node:assert/strict';
import { SONGS, validateSong, songEndBeat } from '../js/songs.mjs';
import { Engine, classifyTiming, medianOffset, buildGroups, PERFECT_MS, GOOD_MS } from '../js/engine.mjs';

let n = 0;
const ok = (msg) => console.log(`  ok ${++n}. ${msg}`);

// --- song data ---
for (const s of SONGS) {
  const errs = validateSong(s);
  assert.deepEqual(errs, [], `${s.id}: ${errs.join('; ')}`);
  ok(`${s.id} valid (${s.notes.length} notes, ends beat ${songEndBeat(s)})`);
}
// The CURATED count is pinned; the imported count is not, because importing a
// song is a normal thing to do and should not fail a build. What IS pinned is
// that every imported song declares where it came from, so a generated
// arrangement can never be mistaken for a hand-curated one.
{
  const imported = SONGS.filter((s) => s.handAssignment === 'generated');
  const curated = SONGS.filter((s) => s.handAssignment !== 'generated');
  // 2026-09-01: 128 -> 125. The three hand-authored Moonlight streams (the
  // Law-1 era: typed against a video, all condemned by the hand audit) were
  // replaced by an IMPORT from the engraved score, so they left the curated
  // count and re-entered as generated-with-provenance.
  assert.equal(curated.length, 125); // 99 + Fur Elise full (2 tiers) + 24 arpeggio drills
  for (const s of imported) assert.ok(s.source, `${s.id} is generated but names no source`);
  ok(`${curated.length} curated songs, ${imported.length} imported, all with provenance`);
}

// --- Hard tier: denser than Medium, octave/arpeggio figuration present ---
for (const grp of ['gangstas-paradise', 'faded', 'river', 'still-dre', 'game-of-thrones', 'runaway', 'pirates', 'piano-man', 'empire', 'fray-save-a-life', 'lost', 'numb', 'mario', /* moonlight-sonata left this list 2026-09-01: its Medium tier was REFUSED by the playability audit (recorded in js/tiers-refused.mjs), so there is no Medium to compare against; its own pins live in the transcription block */ 'bella-ciao', 'see-you-again', 'interstellar', 'in-the-end', 'what-ive-done', 'work-this-time', 'in-a-gadda-da-vida', 'stairway', 'bohemian-rhapsody', 'hotel-california']) {
  const med = SONGS.find((s) => s.group === grp && s.level === 'Medium');
  const hard = SONGS.find((s) => s.group === grp && s.level === 'Hard');
  assert.ok(hard, `${grp} has a Hard tier`);
  const density = (s) => s.notes.length / songEndBeat(s);
  assert.ok(density(hard) > density(med), `${grp} Hard is denser per beat than Medium`);
}
const gpHard = SONGS.find((s) => s.id === 'gangstas-paradise-hard');
// gp-hard is PERFORMANCE-CURATED since 2026-08-28 (PianoX cover through the
// 16th-council listening lane): pin the curation gates, not authored bars
assert.ok(gpHard.composer.includes('after PianoX'), 'gp-hard is labelled performance-curated');
assert.ok(gpHard.notes.length > 1500, 'the reconstructed cover is dense (' + gpHard.notes.length + ' notes)');
const CMF = new Set([0, 2, 3, 5, 7, 8, 10]);
const inKey = gpHard.notes.filter((n) => CMF.has(n.m % 12)).length / gpHard.notes.length;
assert.ok(inKey >= 0.9, 'stays in the verified C-minor family (' + inKey.toFixed(3) + ')');
assert.equal(Math.min(...gpHard.notes.map((n) => n.b)), 0, 'no silent lead-in (rebased to beat 0)');
ok('Hard tier exists, is denser, and gp-hard passes its performance-curation gates');

// --- Faded: hook tops verified (the 4th group's leading tone proves the V chord) ---
const fad = SONGS.find((s) => s.id === 'faded');
const fadR = fad.notes.filter((n) => n.h === 'R').sort((a, b) => a.b - b.b);
assert.deepEqual(fadR.slice(0, 4).map((n) => n.m), [60, 60, 60, 64], 'bar 1 hook is C-C-C-E over Am');
assert.deepEqual(fadR.slice(4, 8).map((n) => n.m), [69, 69, 69, 67], 'bar 2 hook is A-A-A-G over F');
assert.deepEqual([...new Set(fad.notes.filter((n) => n.h === 'L' && n.b < 16).map((n) => n.m))], [45, 41, 48, 43], 'bass loop is Am-F-C-G');
assert.equal(fadR.filter((n) => n.b >= 16 && n.b < 20).length, 8, 'pulse section runs driving eighths');
ok('Faded hook matches the verified arpeggio tops and chord loop');

// --- How to Save a Life: riff + melody verified (letter lines + noobnotes + UG) ---
const fray = SONGS.find((s) => s.id === 'fray-save-a-life');
const frayR = fray.notes.filter((n) => n.h === 'R').sort((a, b) => a.b - b.b);
assert.deepEqual(frayR.slice(0, 3).map((n) => n.m), [72, 67, 64], 'bar 1 opens top C5 over the G-E cell');
// the fix Craig's ear demanded: the RISING top voice on successive downbeats
assert.deepEqual([0, 4, 8, 12].map((b) => frayR.find((n) => n.b === b).m), [72, 74, 76, 71], 'downbeat tops rise C5-D5-E5 then B4');
assert.equal(frayR.find((n) => n.b === 14).m, 74, 'bar 4 pushes up to D5 per Hooktheory');
const frayBass = fray.notes.filter((n) => n.h === 'L' && n.b < 16).map((n) => n.m);
assert.deepEqual(frayBass, [48, 47, 48, 47], 'whole-bar bass alternates C to B (the Bb-to-A move)');
const frayChorus = fray.notes.filter((n) => n.h === 'R' && n.b >= 48 && n.b < 50).map((n) => n.m);
assert.ok(frayChorus.every((m) => m === 72), 'chorus opens on repeated C5 ("where did I go...")');
ok('How to Save a Life matches the verified riff, bass move, and chorus letters');

// --- Empire State of Mind: triple-source verified (Hooktheory API + Piano
// Letters PDF + UG), transposed F#->C; degrees 2,3,5 = D,E,G ---
const emp = SONGS.find((s) => s.id === 'empire');
const empMel = emp.notes.filter((n) => n.h === 'R' && n.b >= 56 && n.b < 72).sort((a, b) => a.b - b.b);
assert.deepEqual(empMel.slice(0, 3).map((n) => n.m), [55, 62, 64], 'chorus pickup G3 then D4, E4 ("In New York")');
assert.equal(empMel[2].d, 2.5, 'the "York" E holds 2.5 beats per Hooktheory');
const empStab = emp.notes.filter((n) => n.h === 'R' && n.b === 16).map((n) => n.m).sort((a, b) => a - b);
assert.deepEqual(empStab, [64, 67, 72], 'verse stab is the C triad voicing (E-G-C)');
const empF = emp.notes.filter((n) => n.h === 'R' && n.b === 20).map((n) => n.m).sort((a, b) => a - b);
assert.deepEqual(empF, [69, 72, 76], 'second stab is Fmaj7 no-root (A-C-E)');
ok('Empire State of Mind matches the triple-verified transcription');

// --- 08-23 song wave spot checks against verified letter notes ---
const pir = SONGS.find((s) => s.id === 'pirates');
const pirR = pir.notes.filter((n) => n.h === 'R');
assert.deepEqual(pirR.slice(0, 6).map((n) => n.m), [57, 60, 62, 62, 62, 64], 'Pirates opens A-C then D D D E');
assert.ok(pirR.some((n) => n.m === 70), 'Pirates turn section reaches Bb');
const riv = SONGS.find((s) => s.id === 'river');
const rivL = riv.notes.filter((n) => n.h === 'L');
assert.deepEqual(rivL.slice(0, 4).map((n) => n.m), [45, 52, 57, 52], 'River bass is the Am arpeggio');
assert.deepEqual(riv.notes.filter((n) => n.h === 'R').slice(0, 4).map((n) => n.m), [72, 71, 72, 71], 'River motif C5-B4 alternation');
const pm = SONGS.find((s) => s.id === 'piano-man');
assert.deepEqual(pm.notes.filter((n) => n.h === 'R').slice(0, 4).map((n) => n.m), [67, 67, 67, 67], 'Piano Man opens on repeated G4');
assert.deepEqual(pm.notes.filter((n) => n.h === 'L').slice(0, 5).map((n) => n.m), [48, 47, 45, 43, 41], 'Piano Man descending bass C-B-A-G-F');
const gp = SONGS.find((s) => s.id === 'gangstas-paradise');
const gpChorus = gp.notes.filter((n) => n.h === 'R' && n.b === 48).map((n) => n.m).sort((a, b) => a - b);
assert.deepEqual(gpChorus, [60, 63, 67], 'Gangsta chorus opens on a Cm triad');
// 26 -> 25 on 2026-09-01: moonlight-sonata-easy moved from the curated
// streams to a score-sourced import, so it counts as generated now.
assert.ok(SONGS.filter((s) => s.level === 'Easy' && s.handAssignment !== 'generated').length === 25, 'all multi-level curated groups have Easy variants');
ok('new songs match their verified transcriptions (Pirates, River, Piano Man, Gangsta)');

// --- signed timing feedback (council 08-24) ---
{
  const { timingSummary, biasText } = await import('../js/engine.mjs');
  const { tickOffset } = await import('../js/falls.mjs');
  const { dynGain } = await import('../js/audio.mjs');
  const ode = SONGS.find((s) => s.id === 'ode-to-joy');
  // timed mode: accepted press events carry signed deltaMs (late = positive)
  const eT = new Engine(ode, { waitMode: false });
  eT.tick(100); // beat has advanced a touch; press the first note now
  const g0 = eT.currentGroup();
  eT.noteOn(g0.notes[0].m);
  const evT = eT.drainEvents().find((ev) => ['perfect', 'good', 'late'].includes(ev.type));
  assert.ok(evT && typeof evT.deltaMs === 'number', 'timed accepted press carries deltaMs');
  assert.ok(evT.responseMs === undefined, 'timed press carries no responseMs');
  assert.ok(evT.hand === 'R' || evT.hand === 'L', 'event carries the hand');
  assert.equal(eT.timing.length, 1, 'engine collects signed deltas');
  // wait mode: responseMs measured from the freeze, no deltaMs
  const eW = new Engine(ode, { waitMode: true });
  eW.tick(5000); // clock freezes at the first group
  assert.ok(eW.waiting, 'frozen at the first group');
  eW.tick(300);  // waiting 300ms more
  const gW = eW.currentGroup();
  eW.noteOn(gW.notes[0].m);
  const evW = eW.drainEvents().find((ev) => ev.type === 'good');
  assert.ok(evW && typeof evW.responseMs === 'number' && evW.responseMs >= 300, `wait press carries responseMs (${evW?.responseMs})`);
  assert.ok(evW.deltaMs === undefined, 'wait press carries no deltaMs (no tempo while frozen)');
  // summary: signed median + spread
  const ts = timingSummary([-40, -30, -20, 10, 60]);
  assert.equal(ts.median, -20, 'summary median is signed');
  assert.ok(ts.spread >= 0 && ts.count === 5, 'summary carries spread + count');
  assert.equal(timingSummary([]), null, 'no presses -> no summary');
  // bias line: persistent lean only, rate of text controlled by caller
  assert.equal(biasText([-50, -45, -60, -40, -55, -48]), 'Mostly 48ms ahead', 'consistent early lean reads ahead');
  assert.equal(biasText([50, 45, 60, 40, 55, 48]), 'Mostly 50ms behind', 'consistent late lean reads behind');
  assert.equal(biasText([-5, 5, -10, 10, 0, 5]), null, 'centred play stays silent');
  assert.equal(biasText([-50, -45]), null, 'too few presses stays silent');
  // tick strip mapping: capped at the good window
  assert.equal(tickOffset(-300), -1, 'early cap');
  assert.equal(tickOffset(75), 0.5, 'linear inside the window');
  assert.equal(tickOffset(300), 1, 'late cap');
  // authored dynamics: conservative gain curve, absent = neutral
  assert.equal(dynGain(undefined), 1, 'no v -> unity gain');
  assert.equal(dynGain(1), 1, 'full v -> unity');
  assert.ok(Math.abs(dynGain(0) - 0.55) < 1e-9, 'soft floor at 0.55');
  ok('signed timing: deltaMs/responseMs events, summary, bias line, tick map, dyn gain');
}

// --- Linkin Park wave: shape checks against the verified transcriptions ---
const lostMed = SONGS.find((s) => s.id === 'lost');
const lostHookR = lostMed.notes.filter((n) => n.h === 'R' && n.b < 4).map((n) => n.m);
assert.deepEqual(lostHookR, [69, 72, 69], 'Lost hook opens A4-C5-A4 (pianoletternotes bar 1)');
const lostChorusR = lostMed.notes.filter((n) => n.h === 'R' && n.b >= 64 && n.b < 68).map((n) => n.m);
assert.deepEqual(lostChorusR, [81, 81, 72, 79], 'Lost chorus opens A5-A5 then C5-G5 (Hooktheory degrees 1-1-3-7)');
const lostVerseBass = new Set(lostMed.notes.filter((n) => n.h === 'L' && n.b >= 32 && n.b < 48).map((n) => n.m));
for (const root of [45, 48, 43, 50]) assert.ok(lostVerseBass.has(root), `Lost verse bass carries root ${root} (Am-C-G-Dm)`);
assert.ok(lostMed.notes.every((n) => [0, 2, 4, 5, 7, 9, 11].includes(n.m % 12)), 'Lost is all-natural (A natural minor)');
const numbMed = SONGS.find((s) => s.id === 'numb');
const numbCh1 = numbMed.notes.filter((n) => n.h === 'R' && n.b >= 48 && n.b < 52).map((n) => n.m);
assert.deepEqual(numbCh1, [76, 76, 81, 81, 79, 76], 'Numb chorus opens E-E-A-A-G-E (the +3 transposition of C#-C#-F#-F#-E-C#)');
assert.ok(numbMed.notes.every((n) => [0, 2, 4, 5, 7, 9, 11].includes(n.m % 12)), 'Numb easy-key arrangement stays all-natural in Am');
const numbHard = SONGS.find((s) => s.id === 'numb-hard');
assert.ok(numbHard.notes.some((n) => n.d === 0.25), 'Numb hard carries a 16th-note run');
const lostHard = SONGS.find((s) => s.id === 'lost-hard');
const lostHardCh = lostHard.notes.filter((n) => n.h === 'R' && n.b === 64).map((n) => n.m).sort((a, b) => a - b);
assert.deepEqual(lostHardCh, [69, 81], 'Lost hard chorus melody is octave-doubled');
ok('Linkin Park wave matches its verified transcriptions (Lost, Numb)');

// --- scale drills: correct standard fingering, mirrored descent ---
const cScale = SONGS.find((s) => s.id === 'scale-c-major');
const cR = cScale.notes.filter((n) => n.h === 'R');
assert.deepEqual(cR.slice(0, 8).map((n) => n.m), [60, 62, 64, 65, 67, 69, 71, 72], 'C major up is C4..C5');
assert.deepEqual(cR.slice(0, 8).map((n) => n.f), [1, 2, 3, 1, 2, 3, 4, 5], 'RH ascending fingering 123-12345');
assert.equal(cR.length, 15, 'up 8 + down 7');
assert.equal(cR[14].m, 60, 'ends back on C4');
const aScale = SONGS.find((s) => s.id === 'scale-a-minor');
assert.deepEqual(aScale.notes.filter((n) => n.h === 'R').slice(0, 8).map((n) => n.m), [57, 59, 60, 62, 64, 65, 67, 69], 'A natural minor up');
ok('scale drills carry standard fingering and mirror down');

// --- difficulty levels: every easy variant maps to a real full song ---
for (const s of SONGS.filter((x) => x.level === 'Easy')) {
  const sib = SONGS.find((x) => x.group === s.group && x.level !== 'Easy');
  assert.ok(sib, `${s.id} has a harder sibling`);
  assert.ok(s.notes.length < sib.notes.length, `${s.id} is simpler than ${sib.id}`);
}
const dreEasy = SONGS.find((s) => s.id === 'still-dre-easy');
const dreEasyR = buildGroups(dreEasy, 'R', null);
assert.ok(dreEasyR.groups.every((g) => g.notes.length === 1), 'easy DRE is single notes, no chords');
ok('easy variants exist, are simpler, and pair with their full versions');

// --- Mark's requested songs: shape checks against the verified transcriptions ---
const dre = SONGS.find((s) => s.id === 'still-dre');
const dreR = buildGroups(dre, 'R', null);
assert.ok(dreR.groups.every((g) => g.notes.length === 3), 'Still DRE: every RH hit is a 3-note chord');
assert.equal(dreR.groups.length, 8 * 2 * 32, 'Still DRE: 8 quaver hits per bar, 2 bars, 32 loops (full song)');
assert.deepEqual(dreR.groups[0].notes.map((n) => n.m).sort((a, b) => a - b), [72, 76, 81], 'first chord is C-E-A');
assert.deepEqual(dreR.groups[11].notes.map((n) => n.m).sort((a, b) => a - b), [71, 76, 79], 'Em voicing is B-E-G');
ok('Still D.R.E. riff structure matches the Skoove transcription');

const got = SONGS.find((s) => s.id === 'game-of-thrones');
const gotL = got.notes.filter((n) => n.h === 'L');
assert.deepEqual(gotL.slice(0, 4).map((n) => n.m), [55, 48, 51, 53], 'GoT ostinato cell is G3-C3-Eb3-F3');
const gotR = got.notes.filter((n) => n.h === 'R');
assert.deepEqual(gotR.slice(0, 4).map((n) => n.m), [67, 60, 63, 65], 'GoT melody cell is G4-C4-Eb4-F4');
assert.equal(songEndBeat(got), 105, 'GoT full arrangement runs 35 bars');
// low-turn figure present: Ab4 F4 C4 at beat 60
const lowTurn = gotR.filter((n) => n.b >= 60 && n.b < 63).map((n) => n.m);
assert.deepEqual(lowTurn, [68, 65, 60], 'low turn opens Ab-F-C');
ok('Game of Thrones cells + full structure match the verified letter notes');

const run = SONGS.find((s) => s.id === 'runaway');
const runR = run.notes.filter((n) => n.h === 'R');
assert.ok(runR.slice(0, 16).every((n) => n.m === 76), 'Runaway opens with 16 repeated E5s');
const descent = runR.slice(16, 16 + 15).map((n) => n.m);
assert.deepEqual([...new Set(descent)], [76, 75, 73, 69, 68, 64], 'descent is E5-D#5-C#5-A4-G#4-E4');
// chorus figure: E4 + G#4 chord on beat 49, B4 arrives in the bar tail
const chorusBar = run.notes.filter((n) => n.h === 'R' && n.b >= 48 && n.b < 52).map((n) => n.m);
assert.deepEqual(chorusBar, [64, 64, 68, 64, 68, 71], 'chorus figure is E, E+G#, E, G#-B');
assert.equal(songEndBeat(run), 124, 'Runaway full arrangement runs 31 bars');
ok('Runaway plink + descent + chorus figure match the verified letter notes');

// --- duplicate chord notes are rejected by validation (audit #12) ---
const dupSong = { id: 'x', title: 'x', bpm: 100, timeSig: [4, 4], beatUnit: 4, notes: [
  { b: 0, d: 1, m: 60, h: 'R' }, { b: 0, d: 1, m: 60, h: 'R' },
] };
assert.ok(validateSong(dupSong).some((e) => e.includes('duplicate')), 'duplicate note flagged');
ok('curation gate rejects wait-mode-deadlocking duplicates');

// --- timing classification ---
assert.equal(classifyTiming(0), 'perfect');
assert.equal(classifyTiming(-PERFECT_MS), 'perfect');
assert.equal(classifyTiming(PERFECT_MS + 1), 'good');
assert.equal(classifyTiming(GOOD_MS), 'good');
assert.equal(classifyTiming(GOOD_MS + 1), 'late');
ok('timing windows classify at the boundaries');

// --- hands filter ---
const ode = SONGS.find((s) => s.id === 'ode-to-joy');
const both = buildGroups(ode, 'both', null);
const right = buildGroups(ode, 'R', null);
assert.equal(right.passive.length, ode.notes.filter((x) => x.h === 'L').length);
const notesIn = (r) => r.groups.reduce((a, g) => a + g.notes.length, 0);
assert.equal(notesIn(both), ode.notes.length, 'both-hands requires every note');
assert.equal(notesIn(right), ode.notes.filter((x) => x.h === 'R').length, 'right-only requires only RH notes');
ok('hands-separate filters required vs passive notes');

// --- wait mode gates the clock ---
const e = new Engine(ode, { waitMode: true });
const first = e.currentGroup();
e.tick(60000); // a full minute: without wait mode we would be far past beat 0
assert.equal(e.beat, first.beat, 'clock frozen at first group');
assert.equal(e.waiting, true);
const res = e.noteOn(first.notes[0].m);
assert.notEqual(res.result, 'wrong');
ok('wait mode freezes until the required note is played');

// wrong note does not advance
const g2 = e.currentGroup();
const wrong = e.noteOn(108);
assert.equal(wrong.result, 'wrong');
assert.equal(e.currentGroup(), g2, 'wrong note must not advance the group');
assert.equal(e.stats.wrong, 1);
ok('wrong notes flagged and non-advancing');

// full playthrough: play every group correctly, engine must finish
const e2 = new Engine(ode, { waitMode: true });
let guard = 10000;
while (!e2.finished && guard-- > 0) {
  e2.tick(50);
  const g = e2.currentGroup();
  if (g && e2.waiting) for (const note of [...g.notes]) e2.noteOn(note.m);
}
assert.ok(e2.finished, 'engine reaches the end when every note is played');
assert.equal(e2.stats.wrong, 0);
assert.ok(e2.accuracy() >= 80, `accuracy sane, got ${e2.accuracy()}`);
ok(`full wait-mode playthrough finishes (accuracy ${e2.accuracy()}%)`);

// --- looping a section restarts instead of finishing, and reports laps ---
const sec = ode.sections[0];
const e3 = new Engine(ode, { waitMode: false, loop: { start: sec.startBeat, end: sec.endBeat } });
e3.tick(10 * 60000); // way past the section end at 100bpm
assert.equal(e3.finished, false, 'looped section never finishes');
assert.ok(e3.beat < sec.endBeat, 'beat wrapped back into the loop');
const lapEvents = e3.drainEvents().filter((ev) => ev.type === 'lap');
assert.ok(lapEvents.length >= 1, 'wrap emits a lap event');
assert.ok(lapEvents[0].accuracy === 0, 'unplayed lap scores 0');
// a played lap reports its own accuracy: complete one full lap correctly
const e3b = new Engine(ode, { waitMode: false, loop: { start: sec.startBeat, end: sec.endBeat } });
let lapDone = null, guard3 = 5000;
while (!lapDone && guard3-- > 0) {
  e3b.tick(20);
  const g = e3b.currentGroup();
  // press on the beat, like a human playing in time
  if (g && Math.abs(g.beat - e3b.beat) * e3b.msPerBeat() <= PERFECT_MS) {
    for (const note of [...g.notes]) if (!g.done.has(note.m)) e3b.noteOn(note.m);
  }
  lapDone = e3b.drainEvents().find((ev) => ev.type === 'lap');
}
assert.ok(lapDone, 'lap event fires after a played lap');
assert.ok(lapDone.accuracy >= 85, `clean lap scores high, got ${lapDone.accuracy}`);
assert.equal(lapDone.wrong, 0);
ok(`section looping wraps and reports per-lap accuracy (${lapDone.accuracy}%)`);

// --- double-tap of an already-satisfied chord note is ignored ---
const eDup = new Engine(ode, { waitMode: true });
const gDup = eDup.currentGroup();
assert.ok(gDup.notes.length >= 2, 'first Ode group is a two-note chord');
eDup.noteOn(gDup.notes[0].m);
const dup = eDup.noteOn(gDup.notes[0].m);
assert.equal(dup.result, 'duplicate');
assert.equal(eDup.stats.wrong, 0, 'double-tap must not count as wrong');
// final-note retap AFTER the group advances (Codex's DO-NOT-SHIP edge)
const lastNote = gDup.notes[gDup.notes.length - 1].m;
eDup.noteOn(lastNote); // completes the group, advances
assert.notEqual(eDup.currentGroup(), gDup, 'group advanced');
const retap = eDup.noteOn(lastNote);
assert.equal(retap.result, 'duplicate', 'final-note retap after advance is forgiven');
assert.equal(eDup.stats.wrong, 0);
// but the forgiveness window closes: after 500ms of wall time it is wrong again
eDup.tick(500);
const stale = eDup.noteOn(lastNote);
assert.notEqual(stale.result, 'duplicate', 'stale retap is not forgiven forever');
ok('chord double-taps ignored, not punished (incl. final note after advance)');

// --- cross-hand unison must not deadlock wait mode (found live in faded-hard) ---
const uniSong = { id: 'u', title: 'u', bpm: 100, timeSig: [4, 4], beatUnit: 4, notes: [
  { b: 0, d: 1, m: 55, h: 'R' }, { b: 0, d: 1, m: 55, h: 'L' }, { b: 1, d: 1, m: 60, h: 'R' },
] };
const eUni = new Engine(uniSong, { waitMode: true });
eUni.tick(5000);
assert.equal(eUni.waiting, true);
eUni.noteOn(55); // ONE press of the one physical key
assert.notEqual(eUni.currentGroup()?.beat, 0, 'unison group satisfied by a single press');
ok('cross-hand unisons collapse to one required press (deadlock class fixed)');

// --- early hits rejected (the sprint-through exploit) ---
const e5 = new Engine(ode, { waitMode: false });
e5.tick(1); // beat ~0, first group live
const g1 = e5.currentGroup();
for (const note of [...g1.notes]) e5.noteOn(note.m); // complete group 1 on time
const g2now = e5.currentGroup();
assert.notEqual(g2now, g1, 'advanced to group 2');
const early = e5.noteOn(g2now.notes[0].m); // group 2 is a full beat away
assert.equal(early.result, 'early', 'premature correct note rejected');
assert.equal(e5.currentGroup(), g2now, 'early hit must not consume the note');
assert.equal(g2now.done.size, 0);
ok('early correct notes are rejected, no sprint-through');

// --- timed mode counts misses ---
const e4 = new Engine(ode, { waitMode: false });
for (let i = 0; i < 100; i++) e4.tick(100); // 10s, no keys pressed
assert.ok(e4.stats.missed > 0, 'unplayed notes counted as missed in timed mode');
ok(`timed mode counts misses (${e4.stats.missed} so far)`);

// --- learning chunks: bar-pair windows with clean edges ---
const { chunkRange } = await import('../js/engine.mjs');
const pmSong = SONGS.find((s) => s.id === 'piano-man'); // 3/4, ends beat 27
let cr = chunkRange(pmSong, 0, 2);
assert.deepEqual([cr.start, cr.end, cr.count, cr.chunkBeats], [0, 6, 5, 6], '2-bar chunks in 3/4 are 6 beats, five of them');
cr = chunkRange(pmSong, 4, 2);
assert.deepEqual([cr.start, cr.end], [24, 27], 'last chunk clips to the song end');
cr = chunkRange(pmSong, 99, 2);
assert.equal(cr.idx, 4, 'out-of-range index clamps to the last chunk');
cr = chunkRange(SONGS.find((s) => s.id === 'faded'), 1, 4);
assert.deepEqual([cr.start, cr.end, cr.chunkBeats], [16, 32, 16], '4-bar chunks in 4/4 are 16 beats');
// a chunk window drives the engine loop like any section
const eChunk = new Engine(pmSong, { waitMode: false, loop: { start: 6, end: 12 } });
eChunk.tick(10 * 60000);
assert.equal(eChunk.finished, false, 'chunk loop wraps like a section loop');
ok('learning chunks slice cleanly and loop in the engine');

// --- pace events: playing at song tempo reads ~100%, half speed reads ~50% ---
const ePace = new Engine(ode, { waitMode: true });
// hesitateTicks: how many frozen frames pass before the player finds the note
const playGroupsAtSpeed = (eng, count, hesitateTicks) => {
  const ratios = [];
  let done = 0, hesitate = 0, guardP = 50000;
  while (done < count && guardP-- > 0) {
    eng.tick(20);
    const g = eng.currentGroup();
    if (g && eng.waiting) {
      if (hesitate++ >= hesitateTicks) {
        for (const note of [...g.notes]) eng.noteOn(note.m);
        done++;
        hesitate = 0;
      }
    }
    for (const ev of eng.drainEvents()) if (ev.type === 'pace') ratios.push(ev.ratio);
  }
  return ratios;
};
const onTempo = playGroupsAtSpeed(ePace, 8, 0);
assert.ok(onTempo.length >= 4, 'pace events emitted');
const meanOn = onTempo.reduce((a, v) => a + v, 0) / onTempo.length;
assert.ok(meanOn > 0.85 && meanOn <= 1.05, `on-tempo play reads ~1.0, got ${meanOn.toFixed(2)}`);
const eSlow2 = new Engine(ode, { waitMode: true });
const slowRatios = playGroupsAtSpeed(eSlow2, 8, 30); // ~600ms of hesitation per note
const meanSlow = slowRatios.reduce((a, v) => a + v, 0) / slowRatios.length;
assert.ok(meanSlow < meanOn * 0.7, `half-speed play reads clearly slower (${meanSlow.toFixed(2)} vs ${meanOn.toFixed(2)})`);
ok(`pace metric tracks real playing speed (on-tempo ${meanOn.toFixed(2)}, slow ${meanSlow.toFixed(2)})`);

// --- one giant tick expires EVERY overdue group ---
const eBig = new Engine(ode, { waitMode: false });
eBig.tick(60 * 60000);
assert.ok(eBig.finished, 'giant tick reaches the end');
assert.equal(eBig.stats.missed, ode.notes.length, 'every unplayed note counted missed');
ok('lag spikes cannot swallow misses');

// --- tempo scaling ---
const eSlow = new Engine(ode, { waitMode: false, tempo: 0.5 });
const eFast = new Engine(ode, { waitMode: false, tempo: 1 });
eSlow.tick(5000); eFast.tick(5000);
assert.ok(Math.abs(eSlow.beat * 2 - eFast.beat) < 1e-6, 'half tempo = half the beats');
ok('tempo scaling halves the clock');

// --- melody echo (council 08-23) ---
const { pickPhrase, EchoRound } = await import('../js/echo.mjs');
const seq = [0.1, 0.5, 0.9];
let si = 0;
const phrase = pickPhrase(SONGS, 4, () => seq[si++ % seq.length]);
assert.ok(phrase, 'a 4-note phrase exists');
assert.equal(phrase.midis.length, 4);
assert.ok(phrase.songTitle, 'phrase names its source song');
assert.ok(new Set(phrase.midis).size >= 2, 'phrase is not a single repeated note');
assert.ok(phrase.playNotes.every((n, i) => n.b === i && n.m === phrase.midis[i]), 'playback notes are steady rhythm');
const round = new EchoRound([60, 62, 64]);
assert.equal(round.noteOn(60).status, 'progress');
assert.equal(round.noteOn(99).status, 'wrong');
assert.equal(round.idx, 0, 'wrong note restarts the phrase');
assert.equal(round.noteOn(60).status, 'progress');
assert.equal(round.noteOn(62).status, 'progress');
assert.equal(round.noteOn(64).status, 'done');
assert.equal(round.mistakes, 1);
ok('melody echo picks real phrases and judges the echo');

// --- sight reading: kernels + transforms (council 08-23) ---
const { KERNELS } = await import('../js/kernels.mjs');
const { makeExercise, judgeSight, mulberry32 } = await import('../js/sight.mjs');
assert.equal(KERNELS.length, 30, '30 authored kernels');
for (const [i, kn] of KERNELS.entries()) {
  assert.ok([1, 2, 3, 4, 5].includes(kn.level), `kernel ${i} level`);
  for (const n2 of kn.notes) {
    assert.ok(n2.b >= 0 && n2.b + n2.d <= 8.001, `kernel ${i} fits 8 beats (note at b=${n2.b})`);
    assert.ok(n2.m >= 40 && n2.m <= 84, `kernel ${i} in C-position range`);
  }
  // per-bar duration sums must not overflow the bar
  for (const bar of [0, 1]) {
    const inBar = kn.notes.filter((n2) => n2.h === 'R' && n2.b >= bar * 4 && n2.b < (bar + 1) * 4);
    for (const n2 of inBar) assert.ok(n2.b + n2.d <= (bar + 1) * 4 + 0.001, `kernel ${i} RH note crosses barline`);
  }
}
assert.equal([1, 2, 3, 4, 5].map((l) => KERNELS.filter((x) => x.level === l).length).join(','), '6,6,6,6,6', 'six kernels per level');
// deterministic: same seed -> same exercise; different seed -> (usually) different
const exA = makeExercise(3, 12345), exB = makeExercise(3, 12345), exC = makeExercise(3, 54321);
assert.deepEqual(exA.notes, exB.notes, 'same seed reproduces the exercise');
assert.ok(JSON.stringify(exA.notes) !== JSON.stringify(exC.notes), 'different seed varies it');
assert.deepEqual(validateSong(exA), [], 'generated exercise passes song validation');
for (let seed = 1; seed <= 40; seed++) {
  for (let lvl = 1; lvl <= 5; lvl++) {
    const ex = makeExercise(lvl, seed);
    for (const n2 of ex.notes) assert.ok(n2.m >= 21 && n2.m <= 108, 'transforms stay on the 88 keys');
  }
}
// level judging
let sj = { level: 1, cleans: 1, flops: 0, done: 0 };
sj = judgeSight(sj, 92, 0).next;
assert.equal(sj.level, 2, 'two cleans level up');
sj = judgeSight(judgeSight(sj, 40, 5).next, 30, 8).next;
assert.equal(sj.level, 1, 'two flops level down');
assert.ok(Math.abs(mulberry32(7)() - mulberry32(7)()) < 1, 'rng callable');
ok('sight reading: 30 valid kernels, deterministic in-range transforms, level ladder');

// --- theory cards ---
const { nameChord, matchCard, CardTask } = await import('../js/theory.mjs');
assert.equal(nameChord([60, 64, 67]), 'C', 'C major named');
assert.equal(nameChord([57, 60, 64]), 'Am', 'A minor named (inversion-proof)');
assert.equal(nameChord([71, 76, 81]), 'Esus4', 'the DRE sus voicing named');
const card = matchCard([72, 76, 81]); // C5-E5-A5 = Am first inversion
assert.ok(card.title.includes('A minor'), 'authored DRE card matched');
const gen = matchCard([62, 66, 69]);
assert.ok(gen.title.includes('D'), 'generic card names the chord');
// every authored key must be in canonical sorted form or it can never match
const { CARDS } = await import('../js/theory.mjs');
for (const c2 of CARDS) {
  const canonical = c2.match.split(',').map(Number).sort((a, b) => a - b).join(',');
  assert.equal(c2.match, canonical, `card "${c2.title}" key is canonical`);
}
assert.ok(matchCard([65, 69, 72]).title.includes('F major'), 'F major authored card triggers (was dead)');
assert.ok(matchCard([67, 71, 74]).title.includes('G major'), 'G major authored card triggers (was dead)');
const ct = new CardTask([60, 64, 67]);
ct.note(60, true); ct.note(64, true);
assert.equal(ct.note(67, true), 'again', 'first full chord = again');
ct.note(60, false); ct.note(64, false); ct.note(67, false);
ct.note(60, true); ct.note(64, true);
assert.equal(ct.note(67, true), 'done', 'second full chord = done');
ok('theory: chords named, cards matched, answer-by-playing works');

// --- rhythm tap ---
const { PATTERNS, RhythmRound, pickPattern } = await import('../js/rhythm.mjs');
assert.equal(PATTERNS.length, 12);
const rr = new RhythmRound([0, 1, 2, 3], 750);
assert.equal(rr.tap(10).result, 'perfect');
assert.equal(rr.tap(760 + 80).result, 'good');
assert.equal(rr.tap(1200).result, 'extra', 'a tap 300ms off nothing is extra');
rr.tap(2250); rr.tap(3000 * 0.75 + 0); // beat 3 at 2250 already taken; tap 2250 again? use fresh values
const rr2 = new RhythmRound([0, 2], 750);
rr2.tap(5); rr2.tap(1505);
assert.deepEqual(rr2.result(), { hit: 2, missed: 0, extras: 0, clean: true }, 'clean round detected');
assert.ok(pickPattern(2, () => 0).level === 2, 'pattern picked by level');
ok('rhythm: tap windows, extras, clean detection');

// --- lessons curriculum ---
const { LESSONS, StaffDrill, TogetherDrill } = await import('../js/lessons.mjs');
assert.equal(LESSONS.length, 11, 'eleven lessons');
for (const les of LESSONS) {
  assert.ok(les.title && Array.isArray(les.steps) && les.steps.length >= 2, `${les.id} teaches in micro-steps`);
  assert.ok(les.steps.join(' ').length > 120, `${les.id} has real teaching text`);
  if (les.drill.type === 'staff') for (const p of les.drill.pool) assert.ok(p.m >= 21 && p.m <= 108 && (p.h === 'R' || p.h === 'L'), `${les.id} pool valid`);
  if (les.drill.type === 'together') for (const it of les.drill.items) assert.ok(Array.isArray(it) && it.length >= 2, `${les.id} items valid`);
}
// treble lines lesson really is EGBDF
assert.deepEqual(LESSONS.find((l2) => l2.id === 'treble-lines').drill.pool.map((p) => p.m), [64, 67, 71, 74, 77]);
// staff drill: right answers advance, wrongs hint after 2
const sd = new StaffDrill([{ m: 64, h: 'R' }], 2, () => 0);
assert.equal(sd.answer(99).ok, false);
assert.equal(sd.answer(99).hint, true, 'hint after two misses');
assert.equal(sd.answer(64).ok, true);
assert.equal(sd.answer(64).done, true, 'done at need');
// together drill: chord must be complete, wrong note flagged
const td = new TogetherDrill([[60, 64]], 1, () => 0.4);
assert.equal(td.note(61, true).ok, false, 'foreign note rejected');
td.note(60, true);
assert.equal(td.note(64, true).done, true, 'chord completes the drill');
ok('lessons: 10-step curriculum, EGBDF verified, drills judge by playing');

// --- learning engine (council 08-24): mastery signals + review + phrase bridge ---
const { PhraseDrill, PHRASES, pickReviewItems } = await import('../js/lessons.mjs');
assert.equal(LESSONS.findIndex((l2) => l2.id === 'phrases'), 6, 'phrase bridge sits after the ledger-line lesson');
assert.ok(PHRASES.length >= 10 && PHRASES.some((p) => p.h === 'L'), 'phrase pool covers both clefs');
const pd = new PhraseDrill([{ h: 'R', ms: [60, 62, 64] }], 1, () => 0);
assert.equal(pd.answer(60).ok, true);
assert.equal(pd.answer(99).ok, false);
assert.equal(pd.idx, 0, 'wrong note restarts the phrase');
pd.answer(60); pd.answer(62);
const pdone = pd.answer(64);
assert.equal(pdone.done, true);
assert.equal(pdone.firstAttempt, false, 'a restarted phrase is not a first-attempt success');
// first-attempt semantics on the other drills
const sd2 = new StaffDrill([{ m: 64, h: 'R' }], 1, () => 0);
assert.equal(sd2.answer(64).firstAttempt, true, 'clean staff answer is first-attempt');
const sd3 = new StaffDrill([{ m: 64, h: 'R' }], 1, () => 0);
assert.equal(sd3.answer(99).firstMiss, true, 'first wrong flagged exactly once');
assert.equal(sd3.answer(99).firstMiss, false);
assert.equal(sd3.answer(64).firstAttempt, false);
const td2 = new TogetherDrill([[60, 64]], 1, () => 0.4);
td2.note(61, true);
td2.note(60, true);
assert.equal(td2.note(64, true).firstAttempt, false, 'chord after a wrong note is not first-attempt');
// review selection: error-weighted first, then least-recently-passed
const cands = [
  { key: 'a', lessonId: 'l1' }, { key: 'b', lessonId: 'l2' }, { key: 'c', lessonId: 'l3' },
];
const picked = pickReviewItems(cands, { b: { n: 4, fm: 3 }, a: { n: 4, fm: 0 } }, { l1: 100, l2: 200, l3: 50 }, 3, () => 0.5);
assert.equal(picked[0].key, 'b', 'highest error rate reviews first');
assert.equal(picked[1].key, 'c', 'no-data item falls back to least-recently-passed');
// rhythm count cells: counts labelled, rests explicit
const { makeCountCells } = await import('../js/rhythm.mjs');
const cells = makeCountCells([0, 1.5, 2]);
assert.equal(cells.length, 8);
assert.deepEqual(cells.map((c2) => c2.label), ['1', '&', '2', '&', '3', '&', '4', '&']);
assert.deepEqual(cells.map((c2) => c2.active), [true, false, false, true, true, false, false, false], 'active counts match the pattern, the rest are rests');
ok('learning engine: first-attempt mastery signals, weighted review, phrase bridge, count row');

// --- calibration ---
assert.equal(medianOffset([]), 0);
assert.equal(medianOffset([10, 20, 30]), 20);
assert.equal(medianOffset([10, 20, 30, 100]), 25);
ok('median offset');

// ================= mastery wave 1 (council 08-24) =================

// --- touch diagnostic: zones, flow, medians, classification ---
const { TOUCH_KEYS, ZONES, DYNAMICS, STRIKES_PER, zoneOf, TouchDiagnostic, buildCalibration, classifyDynamic, calibratedLevel } =
  await import('../js/touch.mjs');
assert.equal(TOUCH_KEYS.length, 8, 'eight sampled keys');
assert.equal(zoneOf(21), 0); assert.equal(zoneOf(47), 0);
assert.equal(zoneOf(48), 1); assert.equal(zoneOf(59), 1);
assert.equal(zoneOf(60), 2); assert.equal(zoneOf(71), 2);
assert.equal(zoneOf(72), 3); assert.equal(zoneOf(108), 3);
for (const k of TOUCH_KEYS) assert.ok(zoneOf(k) >= 0 && zoneOf(k) <= 3);
assert.equal(new Set(TOUCH_KEYS.map(zoneOf)).size, 4, 'sampled keys cover every zone');
const diag = new TouchDiagnostic();
// wrong key ignored, never recorded
const firstAsk = diag.current();
assert.equal(firstAsk.dyn, 'soft');
assert.equal(diag.strike(firstAsk.key + 1, 80).accepted, false);
assert.equal(diag.samples.length, 0, 'wrong key leaves no sample');
// drive the whole diagnostic with synthetic velocities per dynamic + a zone tilt
const VEL = { soft: 30, medium: 62, strong: 96 };
while (!diag.done) {
  const cur = diag.current();
  const r = diag.strike(cur.key, VEL[cur.dyn] + zoneOf(cur.key)); // higher zones read slightly hotter
  assert.ok(r.accepted);
}
assert.equal(diag.samples.length, DYNAMICS.length * TOUCH_KEYS.length * STRIKES_PER);
const { cal, problems } = buildCalibration(diag.samples, '2026-08-24');
assert.deepEqual(problems, [], 'monotonic zones pass');
assert.equal(cal.date, '2026-08-24', 'baseline records its date');
assert.equal(cal.zones.length, 4);
assert.equal(cal.zones[0].soft, 30, 'zone 0 soft median');
assert.equal(cal.zones[3].strong, 99, 'zone 3 strong median carries the tilt');
assert.equal(classifyDynamic(cal, 60, VEL.soft + 2), 'soft');
assert.equal(classifyDynamic(cal, 60, VEL.medium + 2), 'medium');
assert.equal(classifyDynamic(cal, 60, 120), 'strong');
// continuous level: medians land on 0.25 / 0.5 / 0.75, clamped at the rails
assert.ok(Math.abs(calibratedLevel(cal, 60, cal.zones[2].soft) - 0.25) < 1e-9);
assert.ok(Math.abs(calibratedLevel(cal, 60, cal.zones[2].medium) - 0.5) < 1e-9);
assert.ok(Math.abs(calibratedLevel(cal, 60, cal.zones[2].strong) - 0.75) < 1e-9);
assert.equal(calibratedLevel(cal, 60, 127), 1, 'max velocity clamps to 1');
assert.ok(calibratedLevel(cal, 60, 5) < 0.25 && calibratedLevel(cal, 60, 5) >= 0);
// a zone that cannot separate dynamics is flagged for redo, not stored
const flat = diag.samples.map((s) => (s.zone === 1 ? { ...s, vel: 60 } : s));
assert.deepEqual(buildCalibration(flat).problems, [1], 'non-monotonic zone flagged');
ok('touch diagnostic: zones, guided flow, medians, classification, level mapping');

// --- engine play log + pedal timeline ---
const eLog = new Engine(ode, { waitMode: true });
eLog.tick(100);
eLog.noteOn(eLog.currentGroup().notes[0].m, 77);
eLog.tick(400);
eLog.noteOff(eLog.playLog[0].m);
assert.equal(eLog.playLog.length, 1);
assert.equal(eLog.playLog[0].vel, 77, 'velocity recorded');
assert.ok(eLog.playLog[0].offMs - eLog.playLog[0].onMs >= 400, 'release time measured');
eLog.pedal(true);
eLog.pedal(true); // continuous CC values collapse to one transition
eLog.tick(200);
eLog.pedal(false);
assert.equal(eLog.pedalLog.length, 2, 'same-state pedal values deduped');
assert.equal(eLog.pedalLog[0].down, true);
assert.ok(eLog.pedalLog[1].timeMs > eLog.pedalLog[0].timeMs);
ok('engine records the play log (on/off/velocity) and pedal transitions');

// --- pedal analyzer ---
const { analyzePedal, harmonyChanges, pedalNotes } = await import('../js/pedal.mjs');
// harmony change = LH bass pitch class moves
const pl = [
  { m: 48, h: 'L', b: 0, d: 4, onMs: 0, offMs: 900, vel: 60 },
  { m: 60, h: 'R', b: 0, d: 1, onMs: 10, offMs: 400, vel: 70 },
  { m: 43, h: 'L', b: 4, d: 4, onMs: 2000, offMs: 2900, vel: 60 },
];
assert.deepEqual(harmonyChanges(pl).map((h2) => h2.timeMs), [2000], 'C to G bass move detected');
// (a) pedal held across the change > 150ms = late
let pf = analyzePedal([{ down: true, timeMs: 500, beat: 1 }], pl, {});
assert.ok(pf.some((f) => f.type === 'late'), 'held pedal across harmony change flagged');
// lifted within 150ms of the change = clean
pf = analyzePedal([
  { down: true, timeMs: 500, beat: 1 },
  { down: false, timeMs: 2100, beat: 4.2 },
], pl, {});
assert.ok(!pf.some((f) => f.type === 'late'), 'pedal lifted with the change is clean');
// (b) blur: 6 distinct pitch classes under one held pedal
const blurNotes = [60, 62, 64, 65, 67, 69].map((m, i) => ({ m, h: 'R', b: i, d: 1, onMs: 600 + i * 100, offMs: 700 + i * 100, vel: 70 }));
pf = analyzePedal([{ down: true, timeMs: 500, beat: 0 }], blurNotes, {});
assert.equal(pf.filter((f) => f.type === 'blur').length, 1, 'blur flagged once per hold');
pf = analyzePedal([{ down: true, timeMs: 500, beat: 0 }], blurNotes.slice(0, 4), {});
assert.ok(!pf.some((f) => f.type === 'blur'), 'four pitch classes is not blur');
// (c) gaps only where a section opted in
const legatoSecs = [{ name: 'Legato bit', startBeat: 0, endBeat: 8, pedal: true }, { name: 'Plain bit', startBeat: 8, endBeat: 16 }];
pf = analyzePedal([{ down: true, timeMs: 9000, beat: 10 }], pl, { sections: legatoSecs });
assert.ok(pf.some((f) => f.type === 'gap' && f.section === 'Legato bit'), 'opted-in section with no pedal flagged');
assert.ok(!pf.some((f) => f.type === 'gap' && f.section === 'Plain bit'), 'no invented pedal markings');
pf = analyzePedal([{ down: true, timeMs: 100, beat: 2 }], pl, { sections: legatoSecs });
assert.ok(!pf.some((f) => f.type === 'gap'), 'pedal used inside the section clears the gap');
assert.ok(pedalNotes([{ type: 'late', beat: 4 }]).some((t) => t.includes('bar 2')), 'notes name the bar');
ok('pedal analyzer: late changes, blur risk, opt-in gaps only');

// --- articulation analyzer ---
const { analyzeArticulation, articulationSummary, LEGATO_MAX_GAP_MS } = await import('../js/artic.mjs');
const MSB = 600; // 100bpm
const mkNote = (m, b, d, onMs, offMs) => ({ m, h: 'R', b, d, onMs, offMs, vel: 70 });
// legato: next note starts before this one releases (overlap)
let aa = analyzeArticulation([mkNote(60, 0, 1, 0, 620), mkNote(62, 1, 1, 600, 1200)], MSB);
assert.equal(aa.joins[0].kind, 'legato', 'overlap is legato');
// boundary: exactly LEGATO_MAX_GAP_MS of daylight still counts as joined
aa = analyzeArticulation([mkNote(60, 0, 1, 0, 600), mkNote(62, 1, 1, 600 + LEGATO_MAX_GAP_MS, 1200)], MSB);
assert.equal(aa.joins[0].kind, 'legato');
// detached: a small gap
aa = analyzeArticulation([mkNote(60, 0, 1, 0, 480), mkNote(62, 1, 1, 600, 1200)], MSB);
assert.equal(aa.joins[0].kind, 'detached', '120ms gap on a 600ms note is detached');
// choppy: a large gap on a note written long
aa = analyzeArticulation([mkNote(60, 0, 2, 0, 300), mkNote(62, 2, 1, 1200, 1800)], MSB);
assert.equal(aa.joins[0].kind, 'choppy', '900ms of daylight on a written half note is choppy');
assert.equal(aa.clipped.length, 1, 'the same note held 300 of 1200ms is a clipped ending');
// hands analyzed separately: an LH note between RH notes is not an RH junction
aa = analyzeArticulation([
  mkNote(60, 0, 1, 0, 620), { m: 48, h: 'L', b: 0.5, d: 1, onMs: 300, offMs: 500, vel: 60 }, mkNote(62, 1, 1, 600, 1200),
], MSB);
assert.equal(aa.joins.filter((j) => j.hand === 'R').length, 1, 'RH joins skip LH notes');
// summary needs enough joins to be fair
assert.equal(articulationSummary({ joins: [{ kind: 'legato' }], clipped: [] }), null, 'too little data stays silent');
const manyJoins = Array.from({ length: 10 }, (_, i) => ({ hand: 'R', beat: i, kind: i < 7 ? 'legato' : 'choppy', gapMs: 0, writtenMs: 600 }));
const summ = articulationSummary({ joins: manyJoins, clipped: [{ hand: 'R', beat: 8, midi: 60, heldMs: 100, writtenMs: 1200 }] },
  [{ name: 'A', startBeat: 0, endBeat: 5 }, { name: 'B', startBeat: 5, endBeat: 10 }], 4);
assert.equal(summ.legatoPct, 70);
assert.equal(summ.worst.name, 'B', 'worst section carries the choppy joins and clips');
assert.ok(summ.text.includes('legato 70%'), 'summary text is concrete');
ok('articulation: legato/detached/choppy boundaries, clipped endings, per-section worst');

// --- voicing analyzer (calibrated only, never raw) ---
const { analyzeVoicing, voicingText, VOICING_MARGIN } = await import('../js/voicing.mjs');
assert.equal(analyzeVoicing([mkNote(60, 0, 1, 0, 100)], null), null, 'no calibration = no verdict');
const mkVoiced = (rhVel, lhVel) => {
  const log = [];
  for (let b = 0; b < 32; b++) {
    log.push({ m: 72, h: 'R', b, d: 1, onMs: b * 600, offMs: b * 600 + 500, vel: rhVel });
    log.push({ m: 48, h: 'L', b, d: 1, onMs: b * 600, offMs: b * 600 + 500, vel: lhVel });
  }
  return log;
};
const balanced = analyzeVoicing(mkVoiced(VEL.strong, VEL.soft), cal);
assert.ok(balanced.abovePct === 100, `strong melody over soft bass reads 100%, got ${balanced.abovePct}`);
const buried = analyzeVoicing(mkVoiced(VEL.soft, VEL.strong), cal);
assert.equal(buried.abovePct, 0, 'buried melody reads 0%');
assert.ok(buried.worst.diff < -VOICING_MARGIN, 'worst window points at the burial');
assert.ok(voicingText(buried, 4).includes('buried'), 'buried verdict is blunt');
assert.equal(voicingText(null), null);
// velocity-less entries (old logs) are excluded, not misread
assert.equal(analyzeVoicing([mkNote(60, 0, 1, 0, 100)].map((e2) => ({ ...e2, vel: null })), cal), null);
ok('voicing: calibrated melody-over-accompaniment judgement, honest refusals');

// ================= mastery wave 2 (council 08-24) =================

// --- take shelf: index, cap eviction, usage, replay conversion ---
const { addTake, removeTake, takeUsage, newTakeId, eventsToNotes, TAKE_CAP } = await import('../js/takes.mjs');
assert.equal(TAKE_CAP, 20);
let shelf = [];
for (let i = 1; i <= 23; i++) {
  const r = addTake(shelf, { id: `t${i}`, at: i * 1000, bytes: 100, songId: 'x', title: 'X', durMs: 5000, hasAudio: true, events: 10 });
  shelf = r.index;
  if (i <= 20) assert.equal(r.evicted.length, 0, `no eviction at ${i}`);
  else {
    assert.equal(r.evicted.length, 1, `one eviction at ${i}`);
    assert.equal(r.evicted[0].id, `t${i - 20}`, 'oldest take falls off');
  }
}
assert.equal(shelf.length, 20, 'shelf capped at 20');
assert.equal(shelf[0].id, 't4', 'survivors are the newest 20');
assert.equal(shelf[19].id, 't23');
assert.deepEqual(takeUsage(shelf), { count: 20, bytes: 2000, mb: 0 });
assert.equal(takeUsage([{ bytes: 3 * 1048576 }]).mb, 3, 'usage reports MB');
shelf = removeTake(shelf, 't10');
assert.equal(shelf.length, 19);
assert.ok(!shelf.some((t) => t.id === 't10'));
// re-adding the same id replaces, never duplicates
const dupR = addTake(shelf, { ...shelf[0], bytes: 999 });
assert.equal(dupR.index.length, 19, 'same id replaces');
assert.ok(newTakeId(5) !== newTakeId(5), 'ids do not collide trivially');
// replay conversion: down/up pairs become notes, cc events are skipped
const evs = [
  { t: 0, m: 60, vel: 90, down: true, h: 'R' },
  { kind: 'cc', t: 100, cc: 64, val: 127 },
  { t: 500, m: 60, vel: 0, down: false },
  { t: 500, m: 64, vel: 80, down: true, h: 'L' },
  { t: 900, m: 64, vel: 0, down: false },
  { t: 1000, m: 67, vel: 70, down: true, h: 'R' }, // never released
];
const rnotes = eventsToNotes(evs, 500);
assert.equal(rnotes.length, 3, 'three notes, cc skipped');
assert.deepEqual(rnotes[0], { b: 0, d: 1, m: 60, h: 'R' }, '500ms at msPerBeat 500 = 1 beat');
assert.equal(rnotes[1].h, 'L', 'hand preserved for replay colouring');
assert.ok(rnotes[2].d > 0, 'unreleased note still gets a duration');
ok('takes: cap eviction, usage, id, MIDI events to replayable notes');

// --- filmed self-review checkpoint scheduling ---
const { formDue, FORM_CHECKS, FORM_TEACHER_LINE } = await import('../js/form.mjs');
assert.equal(FORM_CHECKS.length, 5, 'five form checks');
assert.equal(FORM_TEACHER_LINE, 'recurring pain or uncertainty means show a human teacher', 'standing copy verbatim');
const mkDays = (n2, from = 1) => Array.from({ length: n2 }, (_, i) => `2026-08-${String(from + i).padStart(2, '0')}`);
assert.equal(formDue(null, mkDays(6)), false, 'not due at 6 practice days');
assert.equal(formDue(null, mkDays(7)), true, 'due at 7 practice days');
assert.equal(formDue('2026-08-07', mkDays(7)), false, 'done resets the counter');
assert.equal(formDue('2026-08-07', mkDays(14)), true, 'due again 7 practice days later');
assert.equal(formDue('2026-08-07', ['2026-08-01', '2026-08-08', '2026-08-09']), false, 'only days AFTER the last done count');
ok('form checkpoint: due every 7 practice days, resets on done');

// ================= mastery wave 3 (council 08-24) =================

// --- staged memory transfer: stage machine, cues, random start ---
const { MEM_STAGES, memCues, memAdvance, randomStartBar } = await import('../js/memory.mjs');
assert.equal(MEM_STAGES.length, 5, 'five stages');
assert.deepEqual(MEM_STAGES.map((s) => s.key), ['score', 'reduced', 'landmarks', 'blank', 'recall']);
let mrec = { stage: 0, passes: 0 };
let adv = memAdvance(mrec, 92, 0);
assert.deepEqual([adv.rec.stage, adv.rec.passes, adv.stageUp], [0, 1, false], 'one clean lap = one pass');
adv = memAdvance(adv.rec, 88, 0);
assert.deepEqual([adv.rec.stage, adv.rec.passes, adv.stageUp], [1, 0, true], 'two cleans move a stage up');
adv = memAdvance(adv.rec, 95, 0);
adv = memAdvance(adv.rec, 95, 2);
assert.deepEqual([adv.rec.stage, adv.rec.passes, adv.cleared], [1, 0, false], 'a wrong note resets the pass count');
adv = memAdvance(adv.rec, 84, 0);
assert.equal(adv.cleared, false, '84% is not clean');
// climb to done
mrec = { stage: 4, passes: 1 };
adv = memAdvance(mrec, 90, 0);
assert.equal(adv.done, true, 'two cleans at recall = memorized');
assert.equal(adv.stageUp, false);
// cues per stage
assert.deepEqual(memCues(0), { letters: true, dimScore: false, noteFilter: null, hints: true, targets: true, metronome: false, randomStart: false });
assert.deepEqual(memCues(1), { letters: false, dimScore: true, noteFilter: null, hints: false, targets: true, metronome: false, randomStart: false });
assert.equal(memCues(2).noteFilter, 'landmarks');
assert.equal(memCues(2).targets, false, 'landmark stage strips the due-key pulse');
assert.deepEqual([memCues(3).noteFilter, memCues(3).metronome], ['none', true], 'blank stage: no notes, metronome on');
assert.deepEqual([memCues(4).noteFilter, memCues(4).randomStart], ['none', true]);
// random start: always inside the section, bar number named in song terms
const memSec = { name: 'S', startBeat: 16, endBeat: 32 };
for (let i = 0; i < 20; i++) {
  const rs = randomStartBar(memSec, 4, () => i / 20);
  assert.ok(rs.startBeat >= 16 && rs.startBeat < 32, 'start inside the section');
  assert.equal((rs.startBeat - 16) % 4, 0, 'starts on a bar line');
  assert.equal(rs.bar, rs.startBeat / 4 + 1, 'bar number is 1-based from the song top');
}
assert.equal(randomStartBar(memSec, 4, () => 0.99).startBeat, 28, 'last bar reachable');
assert.equal(randomStartBar({ name: 'x', startBeat: 0, endBeat: 3 }, 4, () => 0.5).startBeat, 0, 'tiny section clamps to one bar');
ok('memory ladder: two-clean stage climbing, cue schedule, random-start recall');

// --- transposition round: octave-agnostic start, exact intervals after ---
const { TransposeRound } = await import('../js/echo.mjs');
let tr2 = new TransposeRound([60, 62, 64], 2); // C D E up a tone = D E F#
assert.equal(tr2.noteOn(62).status, 'progress', 'D starts it');
assert.equal(tr2.noteOn(64).status, 'progress');
assert.equal(tr2.noteOn(66).status, 'done', 'D E F# completes');
assert.equal(tr2.mistakes, 0);
// starting an octave lower is fine, intervals then follow from THAT start
tr2 = new TransposeRound([60, 62, 64], 2);
assert.equal(tr2.noteOn(50).status, 'progress', 'D3 also starts it (octave-agnostic)');
assert.equal(tr2.noteOn(52).status, 'progress');
assert.equal(tr2.noteOn(54).status, 'done', 'contour preserved from the played start');
// wrong start counted, phrase not consumed
tr2 = new TransposeRound([60, 62, 64], 2);
assert.equal(tr2.noteOn(60).status, 'wrong', 'playing the ORIGINAL start is wrong now');
assert.equal(tr2.mistakes, 1);
assert.equal(tr2.noteOn(62).status, 'progress', 'still answerable after the miss');
// wrong interval mid-phrase restarts it
tr2 = new TransposeRound([60, 62, 64], 5);
assert.equal(tr2.noteOn(65).status, 'progress', 'F starts the fourth-up version');
assert.equal(tr2.noteOn(66).status, 'wrong', 'wrong interval restarts');
assert.equal(tr2.noteOn(65).status, 'progress', 'restart accepts the start again');
assert.equal(tr2.noteOn(67).status, 'progress');
assert.equal(tr2.noteOn(69).status, 'done');
assert.equal(tr2.mistakes, 1);
ok('transposition: octave-agnostic start, exact interval sequence, honest restarts');

// ================= mastery wave 4 (council 08-24) =================

// --- continuity tracker: longest run, recovery, kept-going rating ---
const { ContinuityTracker, keptGoingRating } = await import('../js/perform.mjs');
let ctk = new ContinuityTracker();
for (const [t2, b] of [['good', 0], ['perfect', 1], ['good', 2], ['wrong', 3], ['wrong', 3.1], ['good', 5], ['perfect', 6]]) ctk.event(t2, b);
let cres = ctk.result();
assert.equal(cres.longestRun, 3, 'longest unbroken run of sounded notes');
assert.equal(cres.errors, 2, 'both wrongs counted as errors');
assert.equal(cres.stumbles, 1, 'an error pile-up is ONE stumble');
assert.equal(cres.avgRecoveryBeats, 2, 'recovery measured from the FIRST error (beat 3 to beat 5)');
assert.equal(cres.rating, 'SOLID. You kept the music moving.');
ctk = new ContinuityTracker();
for (let i = 0; i < 10; i++) ctk.event('good', i);
cres = ctk.result();
assert.equal(cres.rating, 'FLAWLESS. Never needed to recover.');
assert.equal(cres.longestRun, 10);
ctk = new ContinuityTracker();
ctk.event('good', 0); ctk.event('missed', 1); ctk.event('good', 1.5);
assert.equal(ctk.result().avgRecoveryBeats, 0.5, 'missed notes count as stumbles too');
assert.ok(keptGoingRating(0.8, 3).startsWith('UNSHAKEABLE'));
assert.ok(keptGoingRating(3.5, 3).startsWith('THE SHOW STOPPED'));
// early and duplicate are neutral: no run break, no error
ctk = new ContinuityTracker();
ctk.event('good', 0); ctk.event('early', 1); ctk.event('duplicate', 1); ctk.event('good', 2);
assert.deepEqual([ctk.result().longestRun, ctk.result().errors], [2, 0], 'early/duplicate neither break nor count');
ok('continuity: longest run, one stumble per pile-up, recovery beats, honest ratings');

// --- improv loops: chord/scale tone sets, cycling, comp ---
const { LOOPS, chordAt, compNotes } = await import('../js/improv.mjs');
assert.equal(LOOPS.length, 3);
const amloop = LOOPS.find((l2) => l2.id === 'am-f-c-g');
assert.deepEqual(amloop.bars.map((b) => b.name), ['Am', 'F', 'C', 'G']);
assert.deepEqual(amloop.bars[0].pcs, [9, 0, 4], 'Am = A C E');
assert.deepEqual(amloop.bars[1].pcs, [5, 9, 0], 'F = F A C');
assert.deepEqual(amloop.bars[3].pcs, [7, 11, 2], 'G = G B D');
assert.deepEqual(amloop.scale, [0, 2, 4, 5, 7, 9, 11], 'white-key scale layer');
const slash = LOOPS.find((l2) => l2.id === 'c-gb-am-g');
assert.equal(slash.bars[1].root, 47, 'G/B comp walks the B bass');
const blues = LOOPS.find((l2) => l2.id === 'blues-c');
assert.equal(blues.bars.length, 12, 'blues is 12 bars');
assert.deepEqual(blues.bars[0].pcs, [0, 4, 7, 10], 'C7 = C E G Bb');
assert.deepEqual(blues.bars[8].pcs, [7, 11, 2, 5], 'bar 9 is G7');
assert.deepEqual(blues.scale, [0, 3, 5, 6, 7, 10], 'C blues scale layer');
assert.equal(chordAt(amloop, 0).name, 'Am');
assert.equal(chordAt(amloop, 7.9).name, 'F');
assert.equal(chordAt(amloop, 16).name, 'Am', 'loop cycles');
assert.equal(chordAt(blues, 47.5).name, 'G7', 'blues bar 12');
const comp = compNotes(amloop);
assert.equal(comp.length, 8, 'root + fifth per bar');
assert.deepEqual([comp[0].m, comp[1].m], [45, 52], 'Am bar comps A2 then E3');
assert.ok(comp.every((n2) => n2.h === 'L'), 'comp is a left hand');
ok('improv: authored chord data, current-chord cycling, LH comp');

// --- 12-key ladder: all 24 scales, verified fingering spot checks ---
const { LADDER } = await import('../js/songs.mjs');
assert.equal(LADDER.length, 48, '24 scales + 24 arpeggios (2026-08-28)');
assert.equal(LADDER.filter((l2) => l2.mode === 'major').length, 12);
assert.equal(LADDER.filter((l2) => l2.mode === 'majarp').length, 12, '12 major arpeggios');
for (const entry of LADDER.filter((l2) => l2.mode === l2.mode.slice(0, 5) && !l2.mode.endsWith('arp'))) {
  const s = SONGS.find((x) => x.id === entry.id);
  assert.ok(s, `${entry.id} exists`);
  const rh = s.notes.filter((n2) => n2.h === 'R');
  assert.equal(rh.length, 15, `${entry.id} runs up 8 and down 7`);
  assert.equal(rh[0].m, rh[14].m, `${entry.id} ends where it starts`);
  assert.equal(rh[7].m, rh[0].m + 12, `${entry.id} peaks at the octave`);
  // descent mirrors ascent: same finger stays on the same note
  for (let i = 0; i < 7; i++) {
    assert.equal(rh[14 - i].m, rh[i].m, `${entry.id} descent mirrors`);
    assert.equal(rh[14 - i].f, rh[i].f, `${entry.id} finger stays with its note`);
  }
  const lh = s.notes.filter((n2) => n2.h === 'L');
  assert.equal(lh[0].m, rh[0].m - 12, `${entry.id} LH one octave under RH`);
}
// interval shapes: every major = WWHWWWH, every natural minor = WHWWHWW
const shape = (s) => { const rh = s.notes.filter((n2) => n2.h === 'R').slice(0, 8).map((n2) => n2.m); return rh.slice(1).map((m, i) => m - rh[i]).join(''); };
for (const entry of LADDER.filter((l2) => l2.mode === 'major' || l2.mode === 'minor')) {
  const s = SONGS.find((x) => x.id === entry.id);
  assert.equal(shape(s), entry.mode === 'major' ? '2212221' : '2122122', `${entry.id} interval shape`);
}
// arpeggio ladder (2026-08-28): triad theory through two octaves, up + down,
// both hands parallel.
//
// FINGERING (2026-08-30). This pin used to assert the OPPOSITE: that the
// arpeggios carried no fingering, because no verified source was reachable the
// day they were written and the law here is "notes yes, guessed fingers never".
// Mark then asked for fingering in every zone, so he can build correct hand
// placement. Changing it deliberately rather than deleting it: the standard
// two-octave root-position arpeggio is thumb-under-after-the-third, fifth on
// top, hands mirrored, and the descent puts the SAME finger back on the SAME
// note, exactly as the scale pins already assert. That last property is what is
// pinned, because it is the thing a transposition slip would break.
for (const entry of LADDER.filter((l2) => l2.mode === 'majarp' || l2.mode === 'minarp')) {
  const s = SONGS.find((x) => x.id === entry.id);
  assert.ok(s, entry.id + ' exists');
  const rh = s.notes.filter((n2) => n2.h === 'R').map((n2) => n2.m);
  assert.equal(rh.length, 13, entry.id + ' = 7 up + 6 down');
  assert.equal(rh[6] - rh[0], 24, entry.id + ' spans two octaves');
  assert.equal(rh[12], rh[0], entry.id + ' lands home');
  assert.equal(rh[1] - rh[0], entry.mode === 'majarp' ? 4 : 3, entry.id + ' third quality');
  const rhF = s.notes.filter((n2) => n2.h === 'R').map((n2) => n2.f);
  const lhF = s.notes.filter((n2) => n2.h === 'L').map((n2) => n2.f);
  assert.deepEqual(rhF, [1, 2, 3, 1, 2, 3, 5, 3, 2, 1, 3, 2, 1], entry.id + ' RH arpeggio fingering');
  assert.deepEqual(lhF, [5, 3, 2, 1, 3, 2, 1, 2, 3, 1, 2, 3, 5], entry.id + ' LH arpeggio fingering');
  for (let i = 0; i < 6; i++) {
    assert.equal(rhF[12 - i], rhF[i], entry.id + ' RH finger stays with its note');
    assert.equal(lhF[12 - i], lhF[i], entry.id + ' LH finger stays with its note');
  }
  assert.equal(s.notes.filter((n2) => n2.h === 'L').length, 13, entry.id + ' both hands');
}
// fingering spot checks against the verified references (pianoscales.org,
// Bb major RH per the ABRSM 4-start cross-checked on masterpiano/piano.org)
const fingsOf = (id, hand2) => SONGS.find((x) => x.id === id).notes.filter((n2) => n2.h === hand2).slice(0, 8).map((n2) => n2.f);
assert.deepEqual(fingsOf('scale-c-major', 'R'), [1, 2, 3, 1, 2, 3, 4, 5], 'C major RH');
assert.deepEqual(fingsOf('scale-c-major', 'L'), [5, 4, 3, 2, 1, 3, 2, 1], 'C major LH');
assert.deepEqual(fingsOf('scale-g-major', 'R'), [1, 2, 3, 1, 2, 3, 4, 5], 'G major RH');
assert.deepEqual(fingsOf('scale-f-major', 'R'), [1, 2, 3, 4, 1, 2, 3, 4], 'F major RH: thumb passes after 4');
assert.deepEqual(fingsOf('scale-f-major', 'L'), [5, 4, 3, 2, 1, 3, 2, 1], 'F major LH');
assert.deepEqual(fingsOf('scale-bb-major', 'R'), [4, 1, 2, 3, 1, 2, 3, 4], 'Bb major RH: ABRSM 4-start');
assert.deepEqual(fingsOf('scale-bb-major', 'L'), [3, 2, 1, 4, 3, 2, 1, 3], 'Bb major LH');
assert.deepEqual(fingsOf('scale-e-major', 'R'), [1, 2, 3, 1, 2, 3, 4, 5], 'E major RH');
assert.deepEqual(fingsOf('scale-b-major', 'L'), [4, 3, 2, 1, 4, 3, 2, 1], 'B major LH starts 4');
assert.deepEqual(fingsOf('scale-eb-major', 'R'), [3, 1, 2, 3, 4, 1, 2, 3], 'Eb major RH');
assert.deepEqual(fingsOf('scale-fs-minor', 'R'), [2, 3, 1, 2, 3, 1, 2, 3], 'F# minor RH');
assert.deepEqual(fingsOf('scale-a-minor', 'R'), [1, 2, 3, 1, 2, 3, 4, 5], 'A minor RH (original drill)');
// roots: correct pitch classes for every key name
const PC = { C: 0, Db: 1, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, 'G#': 8, A: 9, Bb: 10, B: 11 };
for (const entry of LADDER) {
  const s = SONGS.find((x) => x.id === entry.id);
  assert.equal(s.notes[0].m % 12, PC[entry.key], `${entry.id} root pitch class`);
}
ok('12-key ladder: 24 verified scales, mirrored fingering, correct shapes and roots');

// --- grand piano samples: map + on-disk manifest (Mark 08-24: "sound like an
// actual grand"). Every mapped sample must exist and be a real MP3, because a
// missing file silently drops that register to the synth fallback. ---
const { SAMPLE_NOTES, sampleName, nearestSample, rateFor } = await import('../js/audio.mjs');
const { readFileSync } = await import('node:fs');
const { fileURLToPath } = await import('node:url');
assert.equal(SAMPLE_NOTES.length, 30, '30 samples, A0 to C8 at minor thirds');
assert.equal(SAMPLE_NOTES[0], 21); assert.equal(SAMPLE_NOTES[29], 108);
assert.equal(sampleName(21), 'A0');
assert.equal(sampleName(27), 'Ds1');
assert.equal(sampleName(66), 'Fs4');
assert.equal(sampleName(60), 'C4');
assert.equal(sampleName(108), 'C8');
// nearest sample is never more than 1 semitone away on the 88 keys
for (let m = 21; m <= 108; m++) {
  const s = nearestSample(m);
  assert.ok(Math.abs(s - m) <= 1, `midi ${m} shifts at most 1 semitone (got ${s})`);
}
assert.equal(nearestSample(22), 21);
assert.equal(nearestSample(26), 27);
assert.ok(Math.abs(rateFor(62, 60) - Math.pow(2, 2 / 12)) < 1e-12, 'pitch shift ratio');
assert.equal(rateFor(60, 60), 1, 'exact sample plays at unity');
for (const sm of SAMPLE_NOTES) {
  const p = fileURLToPath(new URL(`../samples/${sampleName(sm)}.mp3`, import.meta.url));
  const bytes = readFileSync(p);
  // top-octave notes decay fast and compress small; 10KB still rules out an
  // error page or truncated download
  assert.ok(bytes.length > 10000, `${sampleName(sm)}.mp3 is a real file (${bytes.length}b)`);
  const isMp3 = (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) // ID3
    || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0); // MPEG sync
  assert.ok(isMp3, `${sampleName(sm)}.mp3 has an MP3 header`);
}
ok('grand samples: 30-note map, <=1 semitone shift, all files present and valid');

// ============ lessons as a game (9th council 2026-08-25) ============

const { buildLevels, LevelRunner, lessonItemKeyOf } = await import('../js/lessons.mjs');

// --- game metadata: every non-rhythm lesson carries a valid level plan ---
for (const les of LESSONS) {
  if (les.drill.type === 'rhythm-gate') { assert.ok(!les.game, `${les.id} needs no game block`); continue; }
  const g = les.game;
  assert.ok(g && g.intro.length >= 2 && g.mixed.length >= 2 && g.melody.length >= 1 && g.capability,
    `${les.id} has intro levels, a mix pool, a melody and a capability line`);
  for (const iv of g.intro) {
    assert.ok(iv.pool.length <= 4, `${les.id} "${iv.name}": active pool capped at 4 (council)`);
    assert.ok(iv.pool.some((it) => lessonItemKeyOf(it) === lessonItemKeyOf(iv.focus)),
      `${les.id} "${iv.name}": the focus item is in its own pool`);
  }
  // every drill-pool item is teachable: present in mixed (review continuity)
  const items = les.drill.type === 'staff' ? les.drill.pool : les.drill.items ?? [];
  for (const it of items) {
    assert.ok(g.mixed.some((mx) => lessonItemKeyOf(mx) === lessonItemKeyOf(it)),
      `${les.id}: drill item ${lessonItemKeyOf(it)} appears in the mix round`);
  }
  const levels = buildLevels(les);
  assert.equal(levels.length, g.intro.length + 2, `${les.id}: intro + mix + melody`);
  assert.ok(levels.every((lv, i) => i < levels.length - 1 ? lv.prompts >= 3 : true), `${les.id}: short fixed levels`);
  assert.ok(levels[levels.length - 1].melody, `${les.id}: ends in the melody payoff`);
  assert.ok(levels.slice(0, g.intro.length).every((lv) => lv.labels), `${les.id}: intro levels keep names on`);
  assert.ok(levels.slice(g.intro.length).every((lv) => lv.labels === false), `${les.id}: mix + melody are names-off`);
}
ok('game metadata: capped pools, focus in pool, mix covers the drill, melody payoff');

// --- LevelRunner: fixed prompts, 4/5 pass, resurfacing, monotonic levels ---
const tl = LESSONS.find((l2) => l2.id === 'treble-lines');
let runr = new LevelRunner(buildLevels(tl), () => 0.01);
assert.equal(runr.progress().level, 1);
assert.equal(lessonItemKeyOf(runr.current), lessonItemKeyOf(runr.level.focus), 'the focus opens its level');
// clean run through level 1: 5 prompts, all first-try
for (let i = 0; i < 5; i++) {
  const r = runr.note(runr.current.m, true);
  assert.equal(r.ok, true);
  if (i === 4) assert.equal(r.levelPassed, true, '5 first-try prompts pass the level');
}
assert.equal(runr.progress().level, 2, 'levels advance monotonically');
// a miss resurfaces the item two prompts later and never resets progress
const missedKey = lessonItemKeyOf(runr.current);
let r2 = runr.note(1, true); // certainly wrong
assert.deepEqual([r2.ok, r2.firstMiss], [false, true]);
assert.equal(runr.queue.length, 6, 'missed prompt is queued to resurface');
assert.equal(lessonItemKeyOf(runr.queue[runr.qi + 2]), missedKey, 'resurfaces exactly two prompts later');
r2 = runr.note(runr.current.m, true); // recover the same prompt
assert.deepEqual([r2.ok, r2.firstAttempt], [true, false], 'recovered prompt is not first-try');
// fixed slot ledger (10th council): the visible row NEVER grows on a miss
assert.equal(runr.slots.length, 5, 'ledger stays at the authored 5 slots despite the resurface');
assert.equal(runr.slots[0], 'recov', 'the missed-then-recovered slot reads recovered');
assert.ok(runr.slots.every((s) => ['clean', 'recov', 'todo'].includes(s)), 'slot states are the shape+word triple');
assert.ok(runr.progress().activeSlot >= 0 && runr.progress().slots.length === 5, 'progress exposes the fixed ledger');
// fail the level (three more misses) -> instant retry, earlier levels kept
while (runr.progress().level === 2 && !runr.done) {
  const cur3 = runr.current;
  const before = runr.qi;
  runr.note(1, true); runr.note(cur3.m, true);
  if (runr.qi === 0 && before > 0) break; // level restarted
}
assert.equal(runr.progress().level, 2, 'failed level retries itself; completed levels stay');
assert.equal(runr.qi, 0, 'retry starts a fresh 5-prompt run');
// drive the whole lesson home
let hardStop = 0;
while (!runr.done && ++hardStop < 500) runr.note(runr.current.ms ? runr.current.ms[runr.seqIdx] : Array.isArray(runr.current) ? runr.current.find((mm) => !runr.down.has(mm)) : runr.current.m, true);
assert.ok(runr.done, 'perfect play always finishes the lesson');
assert.ok(runr.misses > 0, 'the misses ledger survived to the end');
// melody level always completes and never fails
const runm = new LevelRunner([{ melody: [{ m: 60, h: 'R' }, { m: 64, h: 'R' }], name: 'The melody', labels: false }]);
runm.note(62, true); // wrong: stays, no resurface growth
assert.equal(runm.queue.length, 2, 'melody misses never grow the queue');
runm.note(60, true);
const rEnd = runm.note(64, true);
assert.equal(rEnd.lessonDone, true, 'melody payoff completes the lesson regardless of misses');
// chord + phrase judging through the same runner
const runc = new LevelRunner([{ pool: [[60, 64]], focus: [60, 64], name: 'c', labels: true, prompts: 3, pass: 2 }, { melody: [[60, 64]], labels: false }]);
assert.equal(runc.note(60, true).ok, null, 'partial chord judges nothing');
assert.equal(runc.note(64, true).ok, true, 'completed chord scores');
const runp = new LevelRunner([{ pool: [{ h: 'R', ms: [60, 62] }], focus: { h: 'R', ms: [60, 62] }, name: 'p', labels: true, prompts: 3, pass: 2 }, { melody: [{ m: 60, h: 'R' }], labels: false }]);
assert.equal(runp.note(60, true).part, true, 'phrase steps report progress');
assert.equal(runp.note(62, true).promptDone, true, 'finished phrase completes the prompt');
// finite together drills (review path) still complete as before
const tFin = new TogetherDrill([[60, 64]], 1, () => 0.4);
tFin.note(60, true);
assert.equal(tFin.note(64, true).done, true, 'finite review drill still completes');
ok('LevelRunner: pass rule, resurfacing, retry keeps levels, melody always finishes, all item shapes');

// --- keyboard hit-testing (the tappable lesson keyboard) ---
const { layoutKeys, keyAtPoint } = await import('../js/falls.mjs');
const lay = layoutKeys(520); // 10px white keys
const white60 = lay.get(60), black61 = lay.get(61);
assert.ok(white60.white && !black61.white);
assert.equal(keyAtPoint(lay, white60.x + 1, 95, 0, 100), 60, 'low tap inside C4 hits C4');
assert.equal(keyAtPoint(lay, black61.x + black61.w / 2, 30, 0, 100), 61, 'high tap on the black key hits C#4');
assert.ok([60, 62].includes(keyAtPoint(lay, black61.x + black61.w / 2, 90, 0, 100)), 'below black-key reach the tap falls through to a white key');
assert.equal(keyAtPoint(lay, 10, 200, 0, 100), null, 'outside the keyboard hits nothing');
assert.equal(keyAtPoint(lay, lay.get(21).x + 1, 50, 0, 100), 21, 'lowest A reachable');
assert.equal(keyAtPoint(lay, lay.get(108).x + 1, 95, 0, 100), 108, 'top C reachable');
ok('keyboard hit-test: whites, blacks-on-top, edges, misses');

// --- lesson teach data: worked examples + verified videos ---
for (const les of LESSONS) {
  assert.ok(les.video?.url?.startsWith('https://www.youtube.com/watch?v='), `${les.id} carries a video link`);
  assert.ok(les.video.title.length > 5, `${les.id} video is titled`);
  if (les.drill.type === 'rhythm-gate') { assert.equal(les.ex, null); continue; }
  assert.ok(les.ex && les.ex.m >= 21 && les.ex.m <= 108, `${les.id} has a worked example`);
  if (les.drill.type === 'staff') {
    assert.ok(les.drill.pool.some((p) => p.m === les.ex.m), `${les.id} example comes from its own pool`);
  }
  if (les.exChord) for (const mm of les.exChord) assert.ok(mm >= 21 && mm <= 108, `${les.id} exChord in range`);
}
// the worked 3rd and triad match their step text (C4+E4, C major triad)
assert.deepEqual(LESSONS.find((l2) => l2.id === 'intervals').exChord, [60, 64]);
assert.deepEqual(LESSONS.find((l2) => l2.id === 'triads').exChord, [60, 64, 67]);
ok('lessons: micro-steps, in-pool worked examples, verified video links');


// --- Super Mario Bros. theme: the notes the three sources agree on ---
// (robsoncouto/arduino-songs off MuseScore 2145, the canonical mario RTTTL,
// and the noobnotes/latouchemusicale letter transcriptions)
const mar = SONGS.find((s2) => s2.id === 'mario');
const marR = mar.notes.filter((x) => x.h === 'R').sort((a, b) => a.b - b.b);
assert.deepEqual(marR.slice(0, 7).map((x) => x.m), [76, 76, 76, 72, 76, 79, 67],
  'opening is E5 E5 E5 C5 E5 then G5 and the low G4');
assert.deepEqual(marR.slice(0, 7).map((x) => x.b), [0, 0.5, 1.5, 2.5, 3, 4, 6],
  'opening rhythm: the gaps after the 2nd and 3rd E are what makes it Mario');
assert.deepEqual(marR.filter((x) => x.b >= 8 && x.b < 12).map((x) => [x.m, x.d]),
  [[72, 1.5], [67, 1.5], [64, 1]], 'main phrase opens C5 G4 E4, dotted-dotted-quarter');
assert.deepEqual(marR.filter((x) => x.b >= 12 && x.b < 16).map((x) => x.m), [69, 71, 70, 69],
  'the A-B-Bb-A chromatic turn is intact (Bb = midi 70)');
const trip = marR.filter((x) => x.b >= 16 && x.b < 18);
assert.deepEqual(trip.map((x) => x.m), [67, 76, 79], 'G4-E5-G5 lift');
assert.ok(trip.every((x) => Math.abs(x.d - 2 / 3) < 1e-9), 'and it is a quarter-note triplet');
assert.deepEqual(marR.filter((x) => x.b >= 40 && x.b < 44).map((x) => x.m), [79, 78, 77, 75, 76],
  'bridge descends G5 F#5 F5 D#5 to E5');
assert.deepEqual(marR.filter((x) => x.b >= 44 && x.b < 48).map((x) => x.m), [68, 69, 72, 69, 72, 74],
  'bridge rises G#4 A4 C5, A4 C5 D5 (C5 not C4: two of three sources)');
assert.deepEqual(marR.filter((x) => x.b >= 48 && x.b < 56).map((x) => x.m), [75, 74, 72],
  'bridge resolves D#5 D5 C5');
assert.deepEqual(marR.filter((x) => x.b >= 136 && x.b < 140).map((x) => x.m), [76, 72, 67, 68],
  'coda opens E5 C5 G4 with the G#4 approach');
assert.equal(marR.filter((x) => x.b >= 144 && x.b < 148)[0].m, 74, 'coda run starts on D5, not B4');
const marL = mar.notes.filter((x) => x.h === 'L');
assert.deepEqual([8, 12, 16, 20].map((b) => marL.find((x) => x.b === b).m), [48, 41, 48, 43],
  'left hand follows the published C | F | C | G reading');
assert.ok(marR.every((x) => x.m >= 60 && x.m <= 81), 'melody stays inside the C4-A5 range all sources give');
ok('Super Mario theme: opening, chromatic turn, triplet, bridge, coda and chords');

// Easy tier is playable-slow and drops the triplet; Hard keeps every melody note
const marE = SONGS.find((s2) => s2.id === 'mario-easy');
assert.ok(marE.bpm < mar.bpm, 'Easy Mario runs slower than the record tempo');
assert.ok(marE.notes.filter((x) => x.h === 'R').every((x) => x.d % 0.5 === 0), 'Easy Mario has no triplets');
const marH = SONGS.find((s2) => s2.id === 'mario-hard');
const marHmel = new Set(marH.notes.filter((x) => x.h === 'R').map((x) => x.b + ':' + x.m));
assert.ok(marR.every((x) => marHmel.has(x.b + ':' + x.m)), 'Hard Mario contains the whole Medium melody');
ok('Mario tiers: Easy simplifies, Hard is a superset of the melody');

// --- Star Wars Main Title: the notes all three sources agree on ---
// (pianoletternotes 2015 C-major grid, latouchemusicale letters, arduino-songs
// durations at -5; LH roots from the pianoletternotes 2022 Hard Version at -5)
const sw = SONGS.find((s2) => s2.id === 'star-wars');
const swR = sw.notes.filter((x) => x.h === 'R').sort((a, b) => a.b - b.b || a.m - b.m);
const T3 = 1 / 3;
assert.deepEqual(swR.slice(0, 3).map((x) => [x.m, x.d]), [[67, T3], [67, T3], [67, T3]],
  'the fanfare pickup is a G4 triplet in one beat');
assert.ok(Math.abs(swR[2].b + T3 - 4) < 1e-9, 'the triplet fills beat 3 and resolves on the barline');
assert.deepEqual(swR.filter((x) => x.b >= 4 && x.b < 8).map((x) => [x.b, x.m]), [[4, 72], [6, 79]],
  'G4 pickup leaps a 4th to C5 then a 5th to G5 (the shape arduino alone got wrong)');
assert.deepEqual(swR.filter((x) => x.b >= 8 && x.b < 9).map((x) => x.m), [77, 76, 74],
  'the F-E-D triplet answers');
assert.equal(swR.find((x) => x.b === 9).m, 84, 'and peaks on C6');
assert.deepEqual(swR.filter((x) => x.b >= 36 && x.b < 40).map((x) => x.m), [69, 69, 77, 76, 74, 72],
  'bridge phrase: A4 dotted figure then F-E-D-C eighths');
assert.deepEqual(swR.filter((x) => x.b >= 62 && x.b < 68).map((x) => x.m), [84, 82, 80, 79, 77, 75, 74, 72],
  'the descent is C-Bb-Ab-G-F-Eb-D-C (all three sources)');
assert.deepEqual(swR.filter((x) => x.b >= 84).map((x) => x.m), [84, 84, 84, 84], 'ending: four C6 hits');
const swL = sw.notes.filter((x) => x.h === 'L');
assert.deepEqual([4, 16, 49].map((b) => swL.find((x) => x.b === b).m), [48, 51, 53],
  'LH: C root, the Eb colour bar, the F-E-D-C cadence walk (hard-version bass at -5)');
const swE = SONGS.find((s2) => s2.id === 'star-wars-easy');
assert.ok(swE.notes.every((x) => Math.abs(x.d - Math.round(x.d * 2) / 2) < 1e-9), 'Easy flattens the triplet');
const swH = SONGS.find((s2) => s2.id === 'star-wars-hard');
const swHm = new Set(swH.notes.filter((x) => x.h === 'R').map((x) => x.b.toFixed(3) + ':' + x.m));
assert.ok(swR.every((x) => swHm.has(x.b.toFixed(3) + ':' + x.m)), 'Hard contains the whole Medium melody');
const dens = (s2) => s2.notes.length / songEndBeat(s2);
assert.ok(dens(swH) > 2 * dens(sw), 'Hard is at least twice as dense (octaves + arpeggio LH)');
ok('Star Wars: triplet fanfare, bridge, chromatic descent, tiers verified');

// --- zoomed lesson keyboard (2026-08-25: octave confusion fix) ---
const { lessonKeyRange } = await import('../js/lessons.mjs');
// treble-lines pool (E4..F5) zooms to exactly C4..B5, middle C included
assert.deepEqual(lessonKeyRange([64, 67, 71, 74, 77]), { lo: 60, hi: 83 });
// bass lessons reach down but still keep middle C on screen
assert.deepEqual(lessonKeyRange([43, 47, 50, 53, 57]), { lo: 36, hi: 71 });
// range always octave-snapped: lo is a C, hi is a B
for (const r of [lessonKeyRange([60]), lessonKeyRange([21, 108])]) {
  assert.equal(r.lo % 12, 0, 'range starts on a C');
  assert.equal(r.hi % 12, 11, 'range ends on a B');
}
// ranged layout: 14 white keys across 2 octaves, and a tap near the middle
// finds E4 (there is no E5 to mistake it for on the zoomed keyboard)
const zoom = layoutKeys(700, 60, 83);
assert.equal([...zoom.values()].filter((k) => k.white).length, 14, '2 octaves = 14 white keys');
assert.equal(zoom.size, 24, 'and 24 keys total');
const zoomE4 = zoom.get(64);
assert.ok(zoomE4.w === 50, 'white keys are 700/14 = 50px wide zoomed');
assert.equal(keyAtPoint(zoom, zoomE4.x + 25, 95, 0, 100), 64, 'tap lands on E4');
assert.equal(zoom.get(59), undefined, 'keys below the range do not exist');
// full-range default unchanged (the play views must not shift)
assert.equal(layoutKeys(520).get(60).x, lay.get(60).x, 'default layout is untouched');
ok('lesson keyboard zooms to the octaves in play, octave-snapped, hit-test intact');

// the curriculum now teaches octaves before asking "which E"
assert.ok(LESSONS.find((l2) => l2.id === 'middle-c').steps.some((s2) => s2.includes('OCTAVE')),
  'lesson 1 explains octave numbering');
assert.ok(LESSONS.find((l2) => l2.id === 'treble-lines').steps.some((s2) => s2.includes('TIME signature')),
  'lesson 2 disarms the 4/4-as-octave misread');
ok('octave teaching is in the curriculum text');

// ============ Teacher Loop v1 (11th council 2026-08-25) ============
const T = await import('../js/teacher.mjs');
const P = await import('../js/path.mjs');

// --- chord maths: the app must compute voice leading the way it TEACHES it ---
assert.deepEqual(T.triadMidis('C'), [60, 64, 67], 'C major is C E G');
assert.deepEqual(T.triadMidis('Am'), [69, 72, 76], 'A minor is A C E');
assert.deepEqual(T.triadMidis('F'), [65, 69, 72], 'F major is F A C');
assert.deepEqual(T.triadMidis('G'), [67, 71, 74], 'G major is G B D');
assert.deepEqual(T.inversions('C'), [[60, 64, 67], [64, 67, 72], [67, 72, 76]], 'three voicings of C');
// the lesson's whole claim: "C to Am can be one finger". Prove it.
const cVoice = T.triadMidis('C');
const amNear = T.nearestVoicing('Am', cVoice);
assert.deepEqual(amNear, [60, 64, 69], 'nearest Am from C moves ONE voice (G to A)');
const movedVoices = amNear.filter((m, i) => m !== cVoice[i]).length;
assert.equal(movedVoices, 1, 'and that is literally one finger');
const fNear = T.nearestVoicing('F', amNear);
assert.deepEqual(fNear, [60, 65, 69], 'nearest F then moves one voice again (E to F)');
for (const sym of ['C', 'Am', 'F', 'G']) {
  const v = T.nearestVoicing(sym, [60, 64, 67]);
  assert.ok(Math.min(...v) >= 55 && Math.max(...v) <= 84, sym + ' voicing stays under the hand');
}
ok('teacher chords: triads, inversions, one-finger voice leading');

// --- chord matching is voicing- and octave-agnostic ---
assert.ok(P.chordMatches([60, 64, 67], [0, 4, 7]), 'root position C matches');
assert.ok(P.chordMatches([64, 67, 72], [0, 4, 7]), 'first inversion C still matches');
assert.ok(P.chordMatches([48, 76, 91], [0, 4, 7]), 'spread across octaves still matches');
assert.ok(!P.chordMatches([60, 64], [0, 4, 7]), 'two notes is not a triad');
assert.ok(!P.chordMatches([60, 64, 67, 69], [0, 4, 7]), 'an extra note fails');
assert.ok(!P.chordMatches([60, 63, 67], [0, 4, 7]), 'C minor is not C major');
assert.ok(P.usedNearest([60, 64, 69], 'Am', [60, 64, 67]), 'the nearest voicing is accepted');
assert.ok(!P.usedNearest([69, 72, 76], 'Am', [60, 64, 67]), 'jumping to root position is not nearest');
ok('chord judging: any voicing, any octave, exact set only');

// --- pulse scoring is evidence, and it reports DIRECTION ---
const swClicks = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500];
assert.equal(P.pulseScore(swClicks.map((c) => c + 10), swClicks).passed, true, 'tight play passes');
assert.equal(P.pulseScore(swClicks.map((c) => c + 300), swClicks).passed, false, 'consistently late fails');
assert.ok(P.pulseScore(swClicks.map((c) => c + 80), swClicks).medianMs >= 70, 'median reports BEHIND as positive');
assert.ok(P.pulseScore(swClicks.map((c) => c - 80), swClicks).medianMs <= -70, 'and AHEAD as negative');
assert.equal(P.pulseScore(swClicks.slice(0, 3), swClicks).passed, false, 'stopping early cannot pass');
assert.equal(P.togetherGap(1000, 1080), 80, 'hand gap is absolute');
assert.equal(P.togetherGap(null, 1000), null, 'a missing hand is not a gap of zero');
ok('pulse + coordination scoring: evidence with direction, never a verdict');

// --- mastery: ASSISTED attempts can never reach independent ---
let mm = T.emptyMastery();
const tt0 = 1750000000000;
T.markIntroduced(mm, 'pulse', tt0);
assert.equal(mm.pulse.stage, 'introduced', 'being TAUGHT it is what introduces a skill');
T.recordAttempt(mm, 'pulse', { passed: true, assisted: true, now: tt0 + 1000 });
assert.equal(mm.pulse.stage, 'guided', 'an assisted pass is worth guided immediately');
// the bug this replaced: one-stage-per-attempt meant a lesson could never
// reach independent, so the app claimed it while the ledger disagreed
const mmFast = T.emptyMastery();
T.recordAttempt(mmFast, 'pulse', { passed: true, assisted: true, now: tt0 });
T.recordAttempt(mmFast, 'pulse', { passed: true, assisted: false, now: tt0 + 1 });
assert.equal(mmFast.pulse.stage, 'independent', 'guided + unaided transfer DOES reach independent');
for (let i = 0; i < 5; i++) T.recordAttempt(mm, 'pulse', { passed: true, assisted: true, now: tt0 + 2000 + i });
assert.equal(mm.pulse.stage, 'guided', 'ASSISTED practice is capped at guided forever (council law)');
T.recordAttempt(mm, 'pulse', { passed: true, assisted: false, now: tt0 + 9000 });
assert.equal(mm.pulse.stage, 'independent', 'an unaided pass promotes to independent');
T.recordAttempt(mm, 'pulse', { passed: true, assisted: false, novel: true, now: tt0 + 10000 });
assert.equal(mm.pulse.stage, 'retained', 'and NOVEL material is what earns retained');
const evBefore = mm.pulse.evidence.length;
T.recordAttempt(mm, 'pulse', { passed: false, now: tt0 + 11000 });
assert.equal(mm.pulse.stage, 'guided', 'a miss drops back to guided, not to zero');
assert.equal(mm.pulse.evidence.length, evBefore + 1, 'and the evidence trail is kept');
assert.ok(mm.pulse.dueAt <= tt0 + 11000, 'a failed skill is due immediately');
ok('mastery stages: assistance caps promotion, novelty earns retention, failure re-opens');

// --- prerequisites gate the graph ---
mm = T.emptyMastery();
assert.ok(T.isPrereqMet(mm, 'pulse'), 'pulse has no prerequisites');
assert.ok(!T.isPrereqMet(mm, 'lead-sheet'), 'lead sheet is gated');
for (const sid of ['chord-symbol', 'inversion', 'two-hand']) {
  T.recordAttempt(mm, sid, { passed: true, assisted: false, now: tt0 });
  T.recordAttempt(mm, sid, { passed: true, assisted: false, now: tt0 + 1 });
  T.recordAttempt(mm, sid, { passed: true, assisted: false, now: tt0 + 2 });
}
assert.ok(T.isPrereqMet(mm, 'lead-sheet'), 'once inversion + two-hand are independent it opens');
ok('skill graph: prerequisites actually gate');

// --- the prescription engine follows the council's strict order ---
const DAYMS = 86400000;
assert.equal(T.prescribe({}, tt0).kind, 'diagnostic', 'a cold app runs the check-in first');
let pst = { diagnosticDone: tt0, mastery: T.emptyMastery(), teacherLessons: {} };
let pp = T.prescribe(pst, tt0 + 1000);
assert.deepEqual([pp.kind, pp.lessonId], ['lesson', 'tl-pulse'], 'then the first lesson');
assert.ok(pp.evidence, 'and a prescription always carries its evidence');
pst.teacherStep = { 'tl-pulse': 'transfer' };
pp = T.prescribe(pst, tt0 + 2000);
assert.deepEqual([pp.kind, pp.step], ['lesson', 'transfer'], 'an unfinished step is resumed');
pst.teacherLessons = { 'tl-pulse': tt0, 'tl-symbols': tt0 };
pst.teacherStep = { 'tl-inversions': 'guided' };
pst.mastery['chord-symbol'].stage = 'guided';
pp = T.prescribe(pst, tt0 + 3000);
assert.equal(pp.kind, 'skill', 'a missing prerequisite is prescribed before the lesson needing it');
assert.equal(pp.skillId, 'chord-symbol');
assert.ok(pp.reason.includes('Chords from a symbol'), 'and it names WHICH skill is blocking');
pst.mastery['pulse'] = { stage: 'independent', evidence: [{ t: tt0, passed: true }], lastTested: tt0, dueAt: tt0 + 100 };
pp = T.prescribe(pst, tt0 + 4 * DAYMS);
assert.deepEqual([pp.kind, pp.skillId], ['review', 'pulse'], 'an overdue skill is reviewed before new work');
assert.ok(pp.evidence.includes('day(s) ago'), 'the review states how stale it is');
pst = { diagnosticDone: tt0, mastery: T.emptyMastery(), teacherLessons: Object.fromEntries(T.TEACHER_LESSONS.map((l) => [l.id, tt0])) };
// v2: a done lesson without its SONG PROOF is prescribed the proof first
pp = T.prescribe(pst, tt0 + 1000);
assert.equal(pp.kind, 'proof', 'a cleared lesson owes its song proof');
assert.equal(pp.lessonId, 'tl-pulse');
assert.ok(pp.songId && pp.section, 'the proof names a real song section');
pst.pathProofs = Object.fromEntries(T.TEACHER_LESSONS.map((l) => [l.id, { songId: 'x', section: 'y', at: tt0 }]));
pst.mastery['inversion'] = { stage: 'guided', lastTested: tt0, dueAt: tt0 + 10 * DAYMS,
  evidence: [{ t: tt0, passed: false }, { t: tt0, passed: false }, { t: tt0, passed: true }] };
pp = T.prescribe(pst, tt0 + 1000);
assert.deepEqual([pp.kind, pp.skillId], ['skill', 'inversion'], 'the shakiest met skill is picked');
assert.ok(pp.evidence.includes('2 miss'), 'with the miss count as evidence');
pst.mastery['inversion'].stage = 'independent';
pst.mastery['inversion'].evidence = [{ t: tt0, passed: true }];
assert.equal(T.prescribe(pst, tt0 + 1000).kind, 'assessment', 'all lessons done -> the novel assessment');
pst.teacherAssessed = tt0;
assert.equal(T.prescribe(pst, tt0 + 1000).kind, 'repertoire', 'after the assessment the path becomes the repertoire loop');
ok('prescription order: review > prerequisite > unfinished > proof > weakest > next lesson');

// --- the curriculum itself is honest and complete ---
assert.equal(T.TEACHER_LESSONS.length, 5, 'five ordered lessons');
for (const l of T.TEACHER_LESSONS) {
  assert.ok(l.teach.length >= 3, l.id + ' explains before it tests');
  assert.ok(l.guided && l.transfer, l.id + ' has BOTH a guided and an independent transfer task');
  assert.equal(l.guided.help, true, l.id + ' guided task shows help');
  assert.equal(l.transfer.help, false, l.id + ' transfer task withdraws help');
  const gKey = JSON.stringify(l.guided.pool ?? l.guided.seq ?? l.guided.bars ?? l.guided.bpm);
  const tKey = JSON.stringify(l.transfer.pool ?? l.transfer.seq ?? l.transfer.bars ?? l.transfer.bpm);
  assert.notEqual(gKey, tKey, l.id + ' transfer uses DIFFERENT material (or it proves nothing)');
  assert.ok(l.passRule && l.skillIds.length, l.id + ' states an explicit pass rule');
}
const drilledSeqs = new Set(T.TEACHER_LESSONS.flatMap((l) => [l.guided, l.transfer])
  .filter((t2) => t2.bars || t2.seq).map((t2) => (t2.bars ?? t2.seq).join('-')));
assert.ok(!drilledSeqs.has(T.ASSESSMENT.bars.join('-')), 'the assessment sequence is genuinely unseen');
assert.equal(T.ASSESSMENT.bars.length, 8, 'eight bars');
assert.ok(T.TECHNIQUE_RUBRIC.some((r) => r.stop), 'the rubric has an explicit stop rule');
assert.ok(T.TECHNIQUE_STOP_RULE.includes('teacher or a doctor'), 'pain routes to a human, never to the app');
ok('curriculum: teach-then-test, transfer on new material, novel assessment, honest rubric');


// --- note styles (2026-08-25): moon = Rousseau white; identity stays SHAPE ---
const { handPalette } = await import('../js/falls.mjs');
{
  const duoR = handPalette('duo', 'R'), duoL = handPalette('duo', 'L');
  const moonR = handPalette('moon', 'R'), moonL = handPalette('moon', 'L');
  for (const p2 of [duoR, duoL, moonR, moonL]) {
    assert.ok(p2.main && p2.bright && p2.glow && p2.deep && p2.fillDim && p2.triplet, 'palette is complete');
  }
  assert.notEqual(duoR.main, duoL.main, 'duo keeps the amber/cyan split');
  // moon: near-white cores both hands — hue may not carry identity anyway
  const lum2 = (hex) => { const v = parseInt(hex.slice(1), 16); return ((v >> 16) & 255) + ((v >> 8) & 255) + (v & 255); };
  assert.ok(lum2(moonR.main) > 600 && lum2(moonL.main) > 600, 'moon cores are near-white');
  assert.ok(lum2(moonR.bright) >= 740 && lum2(moonL.bright) >= 740, 'moon near-line cores go hot');
  assert.equal(handPalette('nonsense', 'R').main, handPalette('duo', 'R').main, 'unknown style falls back to duo');
}
ok('note styles: duo split kept, moon goes white-hot, fallback safe');

// --- 2026-08-29: the sustained-note scanline tail, 8a panel 06 -------------
// The board says "1px scanline every 6px, scrolls". Pin the spacing and the
// scroll against the board's OWN text, and derive the speed from the board's
// pulse (one spacing per 2.2Hz period), so no number in the tail is invented.
{
  const { FallsView } = await import('../js/falls.mjs');
  const fs2 = await import('node:fs');
  const { fileURLToPath: fup2 } = await import('node:url');
  const { join: j2, dirname: dn2 } = await import('node:path');
  const spec = JSON.parse(fs2.readFileSync(j2(dn2(fup2(import.meta.url)), '..', 'design', 'extracted', 'deck-spec.json'), 'utf8'));
  assert.equal(spec['06'].pairs['tail texture'], '1px scanline every 6px, scrolls',
    'the board still specifies the 6px scrolling scanline; if this moved, falls.mjs must move with it');
  const at0 = FallsView.scanlineRows(100, 0);
  assert.ok(at0.length >= 16 && at0.length <= 17, 'a 100px tail carries one line per 6px');
  assert.equal(at0[0].h, 0, 'phase starts at the hit line');
  for (let i = 1; i < at0.length; i++) {
    assert.ok(Math.abs((at0[i].h - at0[i - 1].h) - 6) < 1e-9, 'lines are exactly 6px apart');
  }
  const at100 = FallsView.scanlineRows(100, 100);
  assert.ok(Math.abs(at100[0].h - 1.32) < 1e-9, 'the tail SCROLLS: 6px per 2.2Hz pulse = 1.32px in 100ms');
  const period = 1000 / 2.2;
  const wrapped = FallsView.scanlineRows(100, period);
  assert.ok(Math.abs(wrapped[0].h) < 1e-6 || Math.abs(wrapped[0].h - 6) < 1e-6, 'phase wraps after one pulse period');
  assert.ok(at0.every((r) => r.k >= 0 && r.k <= 1), 'k is the taper fraction, 0..1');
}
ok('deck tail: 6px scrolling scanlines pinned to the 8a board, speed derived from its pulse');


// --- Guitar-Hero verdicts (2026-08-25): word + chevron + position, no hue ---
const { verdictOf } = await import('../js/falls.mjs');
assert.deepEqual(verdictOf('perfect', 4), { word: 'PERFECT', glyph: '◎', dx: 0, heavy: false });
assert.deepEqual(verdictOf('good', -80), { word: 'EARLY', glyph: '◀', dx: -1, heavy: false });
assert.deepEqual(verdictOf('good', 80), { word: 'LATE', glyph: '▶', dx: 1, heavy: false });
assert.deepEqual(verdictOf('good', -140).glyph, '◀◀', 'past 120ms the chevron doubles');
assert.deepEqual(verdictOf('late', 200), { word: 'LATE', glyph: '▶▶', dx: 1, heavy: true });
ok('verdicts: perfect centred, early left, late right, heavy doubles');

// --- 2026-08-28 wave: transcription pins (sources in songs.mjs header) ---
{
  // Moonlight, re-sourced 2026-09-01 on Mark's word ("rework moonlight sonata
  // so i can play it"). The old hand-authored A-minor streams asked the right
  // hand to HOLD 15-semitone chords and all three tiers were condemned by the
  // hand audit; these tiers come from the engraved score (Mutopia,
  // BeethovenLv/O27 No.2 mvt 1) with the hands read off the staves themselves,
  // so every pin below is a fact of Beethoven's text, not of an arrangement.
  // The Medium tier is deliberately ABSENT: the playability audit refused it
  // (5 chords wider than 14 semitones) and js/tiers-refused.mjs records why.
  const moonHard = SONGS.find((s) => s.id === 'moonlight-sonata-hard');
  assert.ok(/Mutopia/.test(moonHard.source), 'Moonlight cites its engraved source');
  const hardR = moonHard.notes.filter((x) => x.h === 'R').sort((a, b) => a.b - b.b || a.m - b.m);
  assert.deepEqual(hardR.slice(0, 3).map((x) => x.m), [56, 61, 64], 'opens on G#3-C#4-E4 — Beethoven\'s own triplet');
  assert.deepEqual(moonHard.notes.filter((x) => x.h === 'L' && x.b === 0).map((x) => x.m).sort((a, b) => a - b), [37, 49], 'bass = C#2+C#3 octave, as engraved');
  const lows = moonHard.notes.filter((x) => x.h === 'L');
  const octavePairs = lows.filter((x) => lows.some((y) => y.b === x.b && y.m === x.m - 12)).length;
  assert.ok(octavePairs >= 100, `Hard LH plays the score's octaves (${octavePairs} pairs)`);
  const moonEasy = SONGS.find((s) => s.id === 'moonlight-sonata-easy');
  const easyR = moonEasy.notes.filter((x) => x.h === 'R').sort((a, b) => a.b - b.b || a.m - b.m);
  assert.deepEqual(easyR.slice(0, 3).map((x) => x.m), [56, 61, 64], 'Easy keeps the real opening: thinned, never transposed');
  assert.ok(songEndBeat(moonEasy) > 270 && moonEasy.notes.length > 500, 'Easy is the whole movement, thinned');

  const bella = SONGS.find((s) => s.id === 'bella-ciao-easy');
  const bellaR = bella.notes.filter((x) => x.h === 'R').sort((a, b) => a.b - b.b);
  assert.deepEqual(bellaR.slice(0, 5).map((x) => x.m), [59, 64, 66, 67, 64], 'Bella Ciao verse: B-E-F#-G-E (Em)');
  assert.ok(!bella.notes.some((x) => x.m % 12 === 5), 'no F natural anywhere — E minor holds');
  const bellaHard = SONGS.find((s) => s.id === 'bella-ciao-hard');
  assert.ok(bellaHard.notes.filter((x) => x.h === 'L').length > 400, 'Hard carries the oom-pah left hand');

  const syu = SONGS.find((s) => s.id === 'see-you-again');
  const syuR = syu.notes.filter((x) => x.h === 'R').sort((a, b) => a.b - b.b);
  assert.deepEqual(syuR.slice(0, 4).map((x) => x.m), [62, 69, 67, 62], 'SYU riff: D-A-G-D (degrees 5-2-1-5 per Hooktheory)');
  assert.deepEqual(syuR.slice(4, 10).map((x) => x.m), [67, 69, 71, 69, 67, 69], 'riff 16th run G-A-B-A-G-A (1-2-3-2-1-2)');
  assert.ok(syuR.slice(4, 10).every((x, i, a) => i === 0 || Math.abs(x.b - a[i - 1].b - 0.25) < 1e-9), 'the run is straight 16ths');
  const syuHard = SONGS.find((s) => s.id === 'see-you-again-hard');
  const chorusR = (s) => s.notes.filter((x) => x.h === 'R' && x.b >= 16 && x.b < 52);
  assert.ok(chorusR(syuHard).length >= chorusR(syu).length + 30, 'Hard chorus carries the octave doubling');
  assert.equal(Math.max(...chorusR(syuHard).map((x) => x.m)), Math.max(...chorusR(syu).map((x) => x.m)) + 12, 'top voice doubled an octave up');
}
ok('2026-08-28 wave: Moonlight / Bella Ciao / See You Again pinned to their sources');

// --- 2026-08-28 wave 2: Interstellar / In the End / What I've Done pins ---
{
  const int = SONGS.find((s) => s.id === 'interstellar');
  const intR = int.notes.filter((x) => x.h === 'R').sort((a, b) => a.b - b.b);
  assert.deepEqual(intR.slice(0, 4).map((x) => x.m), [64, 60, 64, 60], 'Interstellar opens on the E-C tick');
  assert.deepEqual(int.timeSig, [3, 4], 'Interstellar is the 3/4 waltz reading (12-unit harmonic period)');
  assert.ok(!int.notes.some((x) => [1, 3, 6, 8, 10].includes(x.m % 12)), 'Interstellar is all white keys');
  const ite = SONGS.find((s) => s.id === 'in-the-end');
  const iteR = ite.notes.filter((x) => x.h === 'R').sort((a, b) => a.b - b.b);
  assert.deepEqual(iteR.slice(0, 6).map((x) => x.m), [52, 59, 59, 55, 54, 54], 'ITE riff = Hooktheory degrees 1-5-5-3-2-2 in Em');
  const iteEasyL = SONGS.find((s) => s.id === 'in-the-end-easy').notes.filter((x) => x.h === 'L').slice(0, 4);
  assert.deepEqual(iteEasyL.map((x) => x.m), [40, 50, 48, 50], 'ITE easy roots walk i-VII-VI-VII (Em-D-C-D)');
  const wid = SONGS.find((s) => s.id === 'what-ive-done');
  const widR = wid.notes.filter((x) => x.h === 'R').sort((a, b) => a.b - b.b);
  assert.deepEqual(widR.slice(0, 5).map((x) => x.m), [69, 76, 69, 76, 77], 'WID ostinato = Hooktheory 1-5-1-5-6 in Am');
  const widEasyL = SONGS.find((s) => s.id === 'what-ive-done-easy').notes.filter((x) => x.h === 'L').slice(0, 4);
  assert.deepEqual(widEasyL.map((x) => x.m), [45, 48, 43, 50], 'WID easy roots walk i-III-VII-iv (Am-C-G-Dm)');
}
ok('wave 2: Interstellar / In the End / What I\'ve Done pinned to their sources');

// --- wave 3: Work This Time (KGLW) pinned to Hooktheory × the UG tab ---
{
  const wtt = SONGS.find((s) => s.id === 'work-this-time');
  const L = wtt.notes.filter((x) => x.h === 'L').sort((a, b) => a.b - b.b);
  assert.deepEqual(L.slice(0, 4).map((x) => x.m), [45, 47, 48, 50], 'loop = Am Bm C D (F#m G#m A B +3, both sources agree)');
  // the intro riff's first phrase, decoded from the UG tab, +3
  const riff = wtt.notes.filter((x) => x.h === 'R' && x.b >= 16 && x.b < 21).sort((a, b) => a.b - b.b).map((x) => x.m);
  assert.deepEqual(riff.slice(0, 10), [71, 69, 69, 67, 66, 67, 66, 64, 66, 67], 'intro riff matches the tab');
  // Hooktheory's verse melody sits at its exact beats (verse starts beat 32)
  assert.ok(wtt.notes.some((x) => x.h === 'R' && x.b === 33 && x.m === 69), 'verse melody entry A4 at HT beat 2');
  // A dorian discipline: naturals + F# only
  const pcs3 = new Set(wtt.notes.map((x) => x.m % 12));
  for (const bad of [1, 3, 5, 8, 10]) assert.ok(!pcs3.has(bad), 'no pc ' + bad);
  assert.equal(wtt.bpm, 140, 'Hooktheory tempo kept');
}
ok('wave 3: Work This Time pinned — loop, tab riff, Hooktheory melody beats, dorian discipline');

// --- wave 4: In-A-Gadda-Da-Vida pinned to Hooktheory × the UG tab ---
{
  const ia = SONGS.find((s) => s.id === 'in-a-gadda-da-vida');
  // the organ climb opens on the mechanically-converted 5-1-3 dorian cells
  const climb = ia.notes.filter((x) => x.h === 'R' && x.b < 4).sort((a, b) => a.b - b.b).map((x) => x.m);
  assert.deepEqual(climb.slice(0, 6), [57, 62, 65, 57, 62, 65], 'climb = A3 D4 F4 cells');
  assert.ok(ia.notes.some((x) => x.m === 81), 'the held A5 peak is there');
  // the riff, agreed by both sources: D F E D D D D G
  const riffL = ia.notes.filter((x) => x.h === 'L' && x.b >= 16 && x.b < 24).sort((a, b) => a.b - b.b).map((x) => x.m);
  assert.deepEqual(riffL.slice(0, 8), [50, 53, 52, 50, 50, 50, 50, 55], 'riff = D F E D D D D G');
  // the vocal chant: six As then the D-F-G dip
  const voc = ia.notes.filter((x) => x.h === 'R' && x.b >= 32 && x.b < 41 && x.m >= 62).sort((a, b) => a.b - b.b).map((x) => x.m);
  assert.deepEqual(voc.slice(0, 9), [69, 69, 69, 69, 69, 69, 62, 65, 67], 'In-a-gadda-da-vida, honey');
  // the Hard tier carries the UG chromatic turn (G#); Medium stays clean dorian
  const hard = SONGS.find((s) => s.id === 'in-a-gadda-da-vida-hard');
  assert.ok(hard.notes.some((x) => x.m % 12 === 8), 'chromatic A-G#-G turn present in Hard');
  assert.ok(!ia.notes.some((x) => x.m % 12 === 8), 'and absent from Medium');
}
ok('wave 4: In-A-Gadda-Da-Vida pinned — climb, riff, vocal chant, chromatic placement');

// --- wave 5: Stairway to Heaven / Bohemian Rhapsody pinned ---
{
  const sth = SONGS.find((s) => s.id === 'stairway');
  const sthE = SONGS.find((s) => s.id === 'stairway-easy');
  const first4 = (song) => song.notes.filter((x) => x.h === 'R').sort((a, b) => a.b - b.b || a.m - b.m).slice(0, 4).map((x) => x.m);
  assert.deepEqual(first4(sth), [57, 60, 64, 69], 'Stairway opens A3-C4-E4-A4');
  assert.deepEqual(first4(sthE), first4(sth), 'both arrangers agree on the opening (Easy = 2017 post, Hard = 2020 post)');
  for (const m of [56, 55, 54, 53]) assert.ok(sth.notes.some((x) => x.m === m && x.b <= 8), 'chromatic descent carries midi ' + m);
  const brh = SONGS.find((s) => s.id === 'bohemian-rhapsody-hard');
  const open = brh.notes.filter((x) => x.b === 0).map((x) => x.m).sort((a, b) => a - b);
  assert.deepEqual(open, [59, 62, 64, 67], 'BoRhap opens on the block chord, -3 into C');
  const brhE = SONGS.find((s) => s.id === 'bohemian-rhapsody-easy');
  assert.deepEqual(brhE.notes.sort((a, b) => a.b - b.b).slice(0, 4).map((x) => x.m), [74, 74, 74, 74], 'the chant sits on D5 after -3');
  // medium = hard with octave doublings thinned to the top voice
  const med = SONGS.find((s) => s.id === 'bohemian-rhapsody');
  assert.ok(med.notes.length < brh.notes.length, 'BoRhap Medium is the thinned Hard chart');
}
ok('wave 5: Stairway + Bohemian Rhapsody pinned — dual-arranger agreement, descent, -3 block');

// --- wave 6: Hotel California pinned ---
{
  const hc = SONGS.find((s) => s.id === 'hotel-california');
  const hcH = SONGS.find((s) => s.id === 'hotel-california-hard');
  // both arrangers open on the Am arpeggio with E4 on top (-2 from Bm)
  assert.ok(hc.notes.some((x) => x.b === 0 && x.m === 45 && x.h === 'L'), 'Medium opens on the A bass');
  assert.ok(hcH.notes.some((x) => x.b === 0 && x.m === 45 && x.h === 'L'), 'Hard agrees');
  assert.ok(hc.notes.some((x) => x.b === 0 && x.m === 64) && hcH.notes.some((x) => x.b === 0 && x.m === 64), 'E4 on top in both');
  // the loop bass walk A-E-G (Bm-F#-A shifted -2, per Hooktheory)
  const bass = hc.notes.filter((x) => x.h === 'L').sort((a, b) => a.b - b.b).slice(0, 3).map((x) => x.m % 12);
  assert.deepEqual(bass, [9, 4, 7], 'bass walks the canonical loop');
  assert.equal(hc.bpm, 147, 'Hooktheory tempo kept');
}
ok('wave 6: Hotel California pinned — dual-arranger opening, canonical loop, tempo');

// --- library organization (council 2026-08-28): derived states, one action ---
const { groupSongs, classifyGroups, filterExplore } = await import('../js/library.mjs');
{
  const groups = groupSongs(SONGS);
  assert.ok(groups.size >= 22, 'ladder drills stay off the shelf, groups = ' + groups.size);
  // fresh stats: everything is Explore, nothing Learning
  const zero = () => ({ plays: 0, stars: 0, best: 0 });
  const fresh = classifyGroups(groups, zero);
  assert.equal(fresh.learning.length, 0, 'fresh state: nothing in Learning');
  assert.equal(fresh.repertoire.length, 0, 'fresh state: nothing in Repertoire');
  assert.equal(fresh.explore.length, groups.size, 'fresh state: everything in Explore');
  // a finished run promotes to Learning; 3 stars on the TOP tier -> Repertoire
  const statsA = (id) => (id === 'fur-elise' ? { plays: 3, stars: 1, best: 70 } : zero());
  const a = classifyGroups(groups, statsA);
  assert.ok(a.learning.some((v) => v[0].id === 'fur-elise'), 'a finished run puts the song in Learning');
  const topOf = (grp) => { const v = [...groups.values()].find((x) => (x[0].group ?? x[0].id) === grp); return v[v.length - 1].id; };
  const marioTop = topOf('mario');
  const statsB = (id) => (id === marioTop ? { plays: 5, stars: 3, best: 95 } : zero());
  const b = classifyGroups(groups, statsB);
  assert.ok(b.repertoire.some((v) => v.some((s) => s.id === marioTop)), '3-starred top tier lands in Repertoire');
  assert.ok(!b.learning.some((v) => v.some((s) => s.id === marioTop)), 'and leaves Learning');
  // learning sorts weakest first
  const statsC = (id) => id === 'fur-elise' ? { plays: 1, stars: 2, best: 90 } : id === 'ode-to-joy' ? { plays: 1, stars: 0, best: 40 } : zero();
  const c = classifyGroups(groups, statsC);
  const ids = c.learning.map((v) => v[0].id);
  assert.ok(ids.indexOf('ode-to-joy') < ids.indexOf('fur-elise'), 'weakest song leads the Learning section');
  // explore search filters by title and composer
  const ex = fresh.explore;
  assert.ok(filterExplore(ex, 'moonlight').length === 1, 'search finds Moonlight by title');
  assert.ok(filterExplore(ex, 'beethoven').length >= 2, 'search finds by composer');
  assert.equal(filterExplore(ex, '').length, ex.length, 'empty query filters nothing');
}
ok('library: derived Learning/Repertoire/Explore, weakest-first, one next action');

// --- Teacher Loop v2 (13th council 2026-08-28): repertoire proof ---
{
  // the skill→song map references only real songs and real section names
  for (const [skillId, map] of Object.entries(T.SKILL_REPERTOIRE)) {
    assert.ok(T.SKILL_BY_ID[skillId], skillId + ' is a real skill');
    const refs = [map.payoff, ...map.proof];
    assert.ok(map.payoff && map.proof.length >= 2, skillId + ' has a payoff and ≥2 proofs');
    for (const r of refs) {
      const s = SONGS.find((x) => x.id === r.songId);
      assert.ok(s, skillId + ' → ' + r.songId + ' exists');
      assert.ok(s.sections.some((x) => x.name === r.section), skillId + ' → ' + r.songId + ' has section "' + r.section + '"');
    }
  }
  // playable qualification: only uncarryable runs count
  const base = { secIdx: '', wait: false, tempo: '100', hand: 'both', acc: 90, sight: false };
  assert.ok(T.qualifiesPlayable(base), 'a clean full run qualifies');
  assert.ok(!T.qualifiesPlayable({ ...base, wait: true }), 'wait mode is help — never qualifies');
  assert.ok(!T.qualifiesPlayable({ ...base, secIdx: '2' }), 'a section is not the song');
  assert.ok(!T.qualifiesPlayable({ ...base, tempo: '80' }), 'slowed down does not qualify');
  assert.ok(!T.qualifiesPlayable({ ...base, hand: 'R' }), 'one hand does not qualify');
  assert.ok(!T.qualifiesPlayable({ ...base, acc: 84 }), 'below 85% does not qualify');
  // two different days prove it; the same day never double-counts
  const st2 = {};
  assert.equal(T.recordPlayableRun(st2, 'faded-easy', { day: '2026-08-28', now: 1000 }), 'day-banked');
  assert.equal(T.recordPlayableRun(st2, 'faded-easy', { day: '2026-08-28', now: 2000 }), 'already-today');
  assert.equal(T.recordPlayableRun(st2, 'faded-easy', { day: '2026-08-29', now: 3000 }), 'proven');
  assert.ok(st2.playable['faded-easy'].provenAt && st2.playable['faded-easy'].dueAt > 3000, 'proven starts a retention clock');
  assert.equal(T.recordPlayableRun(st2, 'faded-easy', { day: '2026-08-30', now: 4000 }), 'refreshed');
  assert.equal(T.playableGroups(st2, SONGS).length, 1, 'one group playable');
  // the one brain: resume candidate wins when fresh, decays at 48h
  const done5 = Object.fromEntries(T.TEACHER_LESSONS.map((l) => [l.id, 1]));
  const proofs5 = Object.fromEntries(T.TEACHER_LESSONS.map((l) => [l.id, { songId: 'x', section: 'y', at: 1 }]));
  const full = { diagnosticDone: 1, mastery: T.emptyMastery(), teacherLessons: done5, pathProofs: proofs5, teacherAssessed: 1 };
  const nw = 100 * DAYMS;
  const fresh = T.prescribe(full, nw, { songs: SONGS, resume: { songId: 'fur-elise', title: 'Für Elise', at: nw - 3600000 } });
  assert.equal(fresh.kind, 'resume', 'a fresh session resumes');
  const stale = T.prescribe(full, nw, { songs: SONGS, resume: { songId: 'fur-elise', title: 'Für Elise', at: nw - 49 * 3600000 } });
  assert.notEqual(stale.kind, 'resume', 'a 49h-old session no longer hijacks the card');
  // repertoire loop order: weak section > earn playable > tier up > done
  const statsWeak = (id) => (id === 'bella-ciao-easy' ? { sectionAcc: { Verse: { best: 60, last: 60 } } } : {});
  const weak = T.prescribe(full, nw, { songs: SONGS, statsOf: statsWeak });
  assert.deepEqual([weak.kind, weak.sub, weak.songId], ['repertoire', 'weak-section', 'bella-ciao-easy'], 'weakest section first');
  const earn = T.prescribe(full, nw, { songs: SONGS, statsOf: () => ({}) });
  assert.deepEqual([earn.kind, earn.sub], ['repertoire', 'earn-playable'], 'then earning the next playable song');
  const allProven = { ...full, playable: Object.fromEntries([...new Set(Object.values(T.SKILL_REPERTOIRE).flatMap((m) => m.proof.map((p) => p.songId)))].map((id) => [id, { days: ['a', 'b'], provenAt: 1, dueAt: nw + DAYMS }])) };
  const tier = T.prescribe(allProven, nw, { songs: SONGS, statsOf: () => ({}) });
  assert.deepEqual([tier.kind, tier.sub], ['repertoire', 'tier-up'], 'then laddering a proven song up a tier');
  // retention: an overdue playable song is re-tested before anything else
  const due = { ...allProven, playable: { ...allProven.playable, 'faded-easy': { days: ['a', 'b'], provenAt: 1, dueAt: nw - 1 } } };
  const rev = T.prescribe(due, nw, { songs: SONGS, statsOf: () => ({}) });
  assert.deepEqual([rev.kind, rev.songId], ['song-review', 'faded-easy'], 'retention is tested, never assumed');
  // done shows the honest headline
  const everything = { ...allProven, playable: Object.fromEntries(SONGS.filter((s) => !s.ladder).map((s) => [s.id, { days: ['a', 'b'], provenAt: 1, dueAt: nw + DAYMS }])) };
  const fin = T.prescribe(everything, nw, { songs: SONGS, statsOf: () => ({}) });
  assert.equal(fin.kind, 'done');
  assert.ok(fin.reason.includes('independently playable'), 'done states N songs independently playable');
}
ok('teacher v2: repertoire map pinned, playable ledger honest, one brain ordered');

// --- gamification (14th council): XP from value, chosen quests, humane rhythm ---
const G = await import('../js/game.mjs');
{
  // XP: one-time sources dedupe; the ledger keeps every source
  const gs = {};
  assert.ok(G.grantXp(gs, 'proof', 'tl-pulse', 1000), 'proof pays once');
  assert.equal(G.grantXp(gs, 'proof', 'tl-pulse', 2000), null, 'and never twice for the same ref');
  assert.ok(G.grantXp(gs, 'proof', 'tl-symbols', 3000), 'a different ref pays');
  assert.ok(G.grantXp(gs, 'songReview', 'x:day1', 4000) && G.grantXp(gs, 'songReview', 'x:day2', 5000), 'reviews repeat by design');
  assert.equal(G.totalXp(gs), 50 + 50 + 40 + 40);
  assert.ok(gs.xpLog.every((e) => e.src && e.t), 'every entry keeps its source event');
  // level curve is triangular and labelled game-level by the UI
  assert.deepEqual(G.gameLevel(0), { level: 1, into: 0, next: 100 });
  assert.deepEqual(G.gameLevel(100), { level: 2, into: 0, next: 200 });
  assert.equal(G.gameLevel(299).level, 2);
  assert.equal(G.gameLevel(300).level, 3);
  // quests: deterministic per day, three offered, choosing + settling pays once
  const qs = { dayStats: { '2026-08-28': { cleanRuns: 1 } } };
  const q1 = G.questsFor(qs, '2026-08-28');
  assert.equal(q1.length, 3, 'three quests offered');
  assert.deepEqual(q1.map((q) => q.id), G.questsFor(qs, '2026-08-28').map((q) => q.id), 'same day, same quests');
  const clean = q1.find((q) => q.id === 'clean-run');
  assert.ok(clean?.done, 'counters drive completion');
  G.chooseQuest(qs, '2026-08-28', 'clean-run');
  assert.ok(G.settleQuest(qs, '2026-08-28', 1), 'the chosen quest settles');
  assert.equal(G.settleQuest(qs, '2026-08-28', 2), null, 'and only settles once');
  // a pending proof adds the proof quest to the pool
  const qp = { teacherLessons: { 'tl-pulse': 1 }, pathProofs: {}, dayStats: {} };
  const pool = G.questsFor(qp, '2026-08-29');
  assert.ok(pool.length === 3, 'still three offered');
  // weekly: chosen, resumable, detectors read concrete state
  const wk = G.isoWeek(new Date('2026-08-28T12:00:00'));
  const ws = { playable: { x: { provenAt: new Date('2026-08-27T12:00:00').getTime(), days: ['a', 'b'] } } };
  const opts = G.weeklyOptions(ws, wk, Date.now());
  assert.ok(opts.find((m) => m.id === 'playable1').done, 'a song proven this week completes the mission');
  G.chooseWeekly(ws, wk, 'playable1');
  assert.ok(G.settleWeekly(ws, wk, 1), 'weekly pays');
  assert.equal(G.settleWeekly(ws, wk, 2), null, 'once');
  // rhythm: consecutive days, unbroken until a whole day passes; freezes manual
  const rs = { days: ['2026-08-25', '2026-08-26', '2026-08-27'] };
  assert.equal(G.rhythmOf(rs, '2026-08-28').current, 3, 'yesterday-ending run still counts today');
  rs.days.push('2026-08-28');
  assert.equal(G.rhythmOf(rs, '2026-08-28').current, 4);
  const fs2 = { days: ['2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26'], freezeTokens: 1 };
  const offer = G.freezeOffer(fs2, '2026-08-28');
  assert.ok(offer && offer.yesterday === '2026-08-27' && offer.wouldKeep === 5, 'a broken ≥3 rhythm earns an OFFER');
  assert.ok(G.useFreeze(fs2, offer.yesterday), 'freeze is manual');
  assert.equal(G.rhythmOf(fs2, '2026-08-28').current, 5, 'and keeps the rhythm');
  assert.equal(G.freezeOffer({ days: ['2026-08-26'], freezeTokens: 1 }, '2026-08-28'), null, 'short runs get fresh-start language, not a freeze');
  // verdict vocabulary: one voice
  assert.equal(G.verdictWord({}, 'x'), 'Not yet assessed');
  assert.equal(G.verdictWord({ songs: { x: { plays: 2, best: 70 } } }, 'x'), 'Needs work');
  assert.equal(G.verdictWord({ songs: { x: { plays: 2, best: 90 } } }, 'x'), 'One clean day banked');
  assert.equal(G.verdictWord({ playable: { x: { provenAt: 1 } } }, 'x'), 'Playable independently');
  // journeys: the pilot references only real sections of the real song
  for (const [songId, steps] of Object.entries(G.JOURNEYS)) {
    const s = SONGS.find((x) => x.id === songId);
    assert.ok(s, songId + ' exists');
    for (const st2 of steps) if (st2.section) assert.ok(s.sections.some((x) => x.name === st2.section), songId + ' has section ' + st2.section);
  }
  const js2 = {};
  assert.equal(G.journeyState(js2, 'see-you-again-easy').step, 0);
  G.journeyAdvance(js2, 'see-you-again-easy');
  assert.equal(G.journeyState(js2, 'see-you-again-easy').step, 1, 'milestones advance one at a time');
  // badges are an evidence cabinet; arcade entries are labelled
  const bs = G.badges({ pathProofs: { 'tl-pulse': { songId: 's', section: 'x', at: 1, acc: 100 } }, playable: { 'faded-easy': { provenAt: 2 } }, calibratedAt: 3, bestRhythm: 8, songs: { y: { bestCombo: 60 } } }, SONGS);
  assert.ok(bs.find((b) => b.id === 'first-proof')?.evidence, 'badges carry evidence');
  assert.ok(bs.find((b) => b.id === 'combo50')?.arcade, 'combo badge is labelled arcade');
  assert.ok(bs.every((b) => b.word && b.shape), 'shape + word, never hue alone');
}
ok('gamification: value XP, chosen quests, humane rhythm, evidence badges, journey pilot');

// --- Codex review regressions (2026-08-28 final bug check) ---
{
  // P1: re-choosing after completion can never double-pay (ref = day / week)
  const st = { dayStats: { d1: { cleanRuns: 1, minutes: 20 } } };
  G.chooseQuest(st, 'd1', 'clean-run');
  assert.ok(G.settleQuest(st, 'd1', 1), 'first settle pays');
  G.chooseQuest(st, 'd1', 'minutes10'); // try to re-arm another completed quest
  assert.ok(st.activeQuest.done, 'a paid day cannot re-arm');
  assert.equal(G.settleQuest(st, 'd1', 2), null, 'no second payment that day');
  const wk2 = G.isoWeek(new Date('2026-08-28T12:00:00'));
  const ws2 = { playable: { a: { provenAt: new Date('2026-08-27T12:00:00').getTime() } }, pathProofs: { l1: { at: new Date('2026-08-27T12:00:00').getTime() }, l2: { at: new Date('2026-08-27T13:00:00').getTime() } } };
  G.chooseWeekly(ws2, wk2, 'playable1');
  assert.ok(G.settleWeekly(ws2, wk2, 1), 'weekly pays');
  G.chooseWeekly(ws2, wk2, 'proofs2'); // switch after payment
  assert.ok(ws2.weekly.done, 'a paid week cannot re-arm');
  assert.equal(G.settleWeekly(ws2, wk2, 2), null, 'no second weekly payment');
  // P1: the XP balance and dedupe survive the display-log cap
  const big = {};
  for (let i = 0; i < 260; i++) G.grantXp(big, 'songReview', 'r' + i, i);
  assert.equal(G.totalXp(big), 260 * 40, 'balance survives the log cap');
  assert.ok(big.xpLog.length <= 200, 'display log stays capped');
  G.grantXp(big, 'proof', 'tl-x', 999);
  big.xpLog.length = 0; // even a wiped display log cannot reopen one-time XP
  assert.equal(G.grantXp(big, 'proof', 'tl-x', 1000), null, 'dedupe survives log loss');
  // P1: a freeze keeps the rhythm but is never a real practice day
  const fz = { days: ['2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26'], freezeTokens: 1 };
  const off2 = G.freezeOffer(fz, '2026-08-28');
  G.useFreeze(fz, off2.yesterday);
  assert.ok(!fz.days.includes('2026-08-27'), 'frozen day is NOT in st.days');
  assert.equal(G.rhythmOf(fz, '2026-08-28').current, 5, 'but the rhythm holds');
  const wkF = G.isoWeek(new Date('2026-08-27T12:00:00'));
  const d3 = G.weeklyOptions({ days: ['2026-08-25', '2026-08-26'], frozenDays: ['2026-08-27'] }, wkF, 1).find((m) => m.id === 'days3');
  assert.ok(!d3.done, 'a frozen day cannot complete the three-practice-days mission');
  // P2: a stale unfinished weekly re-bases to the current week
  const stale = { weekly: { week: '2026-W30', id: 'days3', done: false } };
  G.rebaseWeekly(stale, '2026-W35');
  assert.equal(stale.weekly.week, '2026-W35', 'unfinished mission resumes in the new week');
}
ok('review regressions: no double-pay, durable XP ledger, honest freeze days, weekly re-base');

// --- difficulty ranking + hall of fame (Mark's ask 2026-08-28) ---
const D = await import('../js/difficulty.mjs');
{
  const ranked = D.rankSongs(SONGS);
  assert.ok(ranked.every((r) => r.score >= 1 && r.score <= 10), 'scores stay on the 1-10 scale');
  assert.ok(ranked.length >= 60, 'ladder drills and sight exercises stay out of the ranking');
  // every group is monotonic: Easy < Medium < Hard by MEASURED difficulty
  const byGroup = new Map();
  for (const r of ranked) {
    const g = r.song.group ?? r.song.id;
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(r);
  }
  const RANKL = { Easy: 0, Medium: 1, Full: 1, Hard: 2 };
  for (const [g, rs] of byGroup) {
    if (rs.length < 2) continue;
    const sorted = [...rs].sort((a, b) => (RANKL[a.song.level] ?? 1) - (RANKL[b.song.level] ?? 1));
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i].score > sorted[i - 1].score, `${g}: ${sorted[i].song.level} (${sorted[i].score}) harder than ${sorted[i - 1].song.level} (${sorted[i - 1].score})`);
    }
  }
  // anchors: beginner pieces low, the dense hards top the table
  const score = (id) => ranked.find((r) => r.song.id === id).score;
  assert.ok(score('ode-to-joy') < 3, 'Ode to Joy sits in the beginner bands');
  assert.ok(score('happy-birthday') < 3.2, 'Happy Birthday too');
  assert.ok(score('interstellar-hard') >= 7 && score('bella-ciao-hard') >= 7, 'the dense hards top the table');
  assert.equal(D.difficultyBand(2.0), 'Beginner');
  assert.equal(D.difficultyBand(9.9), 'Expert');
  // hall of fame references only real groups, each with a named screen source
  for (const h of D.HALL_OF_FAME) {
    assert.ok(SONGS.some((s) => (s.group ?? s.id) === h.group), 'HOF group exists: ' + h.group);
    assert.ok(h.from && h.from.length > 4, h.group + ' names its screen source');
  }
}
ok('difficulty: measured 1-10, every group monotonic, hall of fame pinned');

// --- generative covers (15th council): honest art, distinct, dark, hue-safe ---
const C = await import('../js/covers.mjs');
{
  const groups2 = new Map();
  for (const s of SONGS) { if (s.ladder) continue; const k = s.group ?? s.id; if (!groups2.has(k)) groups2.set(k, s); }
  const specs = [...groups2.values()].map((s) => C.coverSpec(s));
  // deterministic
  const a1 = C.coverSpec(SONGS.find((s) => s.id === 'fur-elise'));
  const a2 = C.coverSpec(SONGS.find((s) => s.id === 'fur-elise'));
  assert.equal(C.coverFingerprint(a1), C.coverFingerprint(a2), 'covers are deterministic');
  // every song group gets a DISTINCT cover (council fingerprint guarantee)
  const fps = specs.map((sp) => C.coverFingerprint(sp));
  assert.equal(new Set(fps).size, fps.length, 'all ' + fps.length + ' covers are distinct');
  // at least 3 composition families in use across the library
  assert.ok(new Set(specs.map((sp) => sp.family)).size >= 3, 'families vary with the music');
  // palette law: composited luminance under the ceiling, and NO amber hues
  const lum = (r, g, b) => { const f2 = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f2(r) + 0.7152 * f2(g) + 0.0722 * f2(b); };
  for (const pair of C.COVER_HUES) for (const rgb of pair) {
    const comp = rgb.map((v) => v * 0.6); // max artwork alpha is 0.6 over black
    assert.ok(lum(...comp) <= 0.03, 'hue ' + rgb.join(',') + ' stays under the dark-glass ceiling');
    // amber exclusion: reject the amber band (hue 30-55° with real saturation)
    const [r, g, b] = rgb; const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx !== mn) {
      let hdeg; if (mx === r) hdeg = 60 * (((g - b) / (mx - mn)) % 6); else if (mx === g) hdeg = 60 * ((b - r) / (mx - mn) + 2); else hdeg = 60 * ((r - g) / (mx - mn) + 4);
      if (hdeg < 0) hdeg += 360;
      assert.ok(!(hdeg >= 30 && hdeg <= 52 && (mx - mn) > 24), 'no amber inside artwork (hue ' + Math.round(hdeg) + ')');
    }
  }
  // the plotted points are the song's own notes, normalized into [0,1]
  const sp2 = C.coverSpec(SONGS.find((s) => s.id === 'ode-to-joy'));
  assert.ok(sp2.pts.length > 20 && sp2.pts.every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1), 'notes are the artwork');
  assert.equal(sp2.notches.length, 3, 'perimeter notch signature present (identity without hue)');
}
ok('covers: deterministic, all distinct, dark-glass palette, notes-as-art, notch identity');

// --- real album art (2026-08-28, Mark: "the ACTUAL album art, not some random
// picture"): a sleeve claimed in the manifest must exist on disk at both sizes,
// and a song with no honest recording must still get a plate rather than a hole ---
{
  const { existsSync } = await import('node:fs');
  const { join, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { ART } = await import('../js/art-manifest.mjs');
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
  const NO_SLEEVE = ['happy-birthday', 'bella-ciao', 'scale-c-major', 'scale-a-minor'];

  assert.ok(Object.keys(ART).length >= 26, 'the manifest still carries the fetched sleeves');
  for (const g of Object.keys(ART)) {
    for (const size of [512, 128]) {
      assert.ok(existsSync(join(ROOT, 'art', String(size), `${g}.jpg`)), `art/${size}/${g}.jpg is on disk`);
    }
    // Two kinds of entry, and each must be honest about which it is. A fetched
    // sleeve names the real record it is a photograph of. A GENERATED sleeve
    // was drawn from the piece's own notes, so it carries no artist/album/year
    // at all: inventing a record for Bach would put a lie in the one file whose
    // whole job is provenance.
    if (ART[g].generated) {
      assert.ok(ART[g].drawnFrom, `${g} is a generated sleeve but does not say what it was drawn from`);
      assert.ok(!ART[g].album && !ART[g].artist, `${g} is generated and must not claim a record`);
    } else {
      assert.ok(ART[g].album && ART[g].artist, `${g} names the record its sleeve came from`);
    }
  }
  // size bucket: row plates take the thumb, anything bigger takes the 512
  const withArt = SONGS.find((s) => (s.group ?? s.id) === 'hotel-california');
  assert.equal(C.sleeveUrl(withArt, 40), 'art/128/hotel-california.jpg');
  assert.equal(C.sleeveUrl(withArt, 128), 'art/128/hotel-california.jpg');
  assert.equal(C.sleeveUrl(withArt, 256), 'art/512/hotel-california.jpg');
  // no honest recording: no sleeve, but the generated plate still has to work
  // These never had a record. Mark asked for art on everything (2026-08-30:
  // "make sure every song has a cover art"), so they now carry a sleeve DRAWN
  // FROM THEIR OWN NOTES. What they must never carry is a fabricated release.
  for (const g of NO_SLEEVE) {
    const song = SONGS.find((s) => (s.group ?? s.id) === g);
    assert.ok(song, `${g} is still in the library`);
    assert.ok(!ART[g] || ART[g].generated === true, `${g} never had a record and must not claim one`);
    assert.ok(C.coverSpec(song).pts.length > 0, `${g} can still fall back to the note-derived plate`);
  }
  // nothing may fall between the two: a new song either gets a real sleeve or
  // is a declared no-recording case. This is the check that catches curation
  // adding a song and nobody fetching its art.
  // A score-derived piece has no album sleeve and never will: Bach did not
  // release a record. Those fall back to the engraved plate on purpose, so they
  // are not "uncovered", they are covered the way they should be. What this
  // check is really for is a RECORDED song being added with nobody fetching its
  // art, so it still applies to everything curated.
  const generated = new Set(SONGS.filter((s) => s.handAssignment === 'generated').map((s) => s.group ?? s.id));
  for (const g of generated) {
    const song = SONGS.find((s) => (s.group ?? s.id) === g);
    assert.ok(C.coverSpec(song).pts.length > 0, `${g} must fall back to the note-derived plate`);
  }
  const uncovered = [...new Set(SONGS.filter((s) => !s.ladder).map((s) => s.group ?? s.id))]
    .filter((g) => !ART[g] && !NO_SLEEVE.includes(g) && !generated.has(g));
  assert.deepEqual(uncovered, [], `these groups have no sleeve and are not declared no-recording: ${uncovered.join(', ')}`);
}
ok('real art: every claimed sleeve on disk at both sizes, no-recording songs fall back, no group uncovered');

// --- the contrast guard (2026-08-29 token port). This reads the REAL tokens out
// of style.css and recomputes WCAG contrast, so the palette cannot drift back
// silently. It also pins the two carve-outs that a future "tidy the colours"
// pass would otherwise destroy: the hand colours, and the cream score page. ---
{
  const { readFileSync } = await import('node:fs');
  const { join, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'style.css'), 'utf8');

  const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
  const tok = {};
  for (const m of root.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) tok[m[1]] = m[2].toLowerCase();

  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

  assert.equal(tok.bg, '#000000', 'the ground is true black; Mark asked for it and his panel is OLED');
  assert.equal(tok.panel, '#000000', 'panels are not fills any more, structure comes from --line');

  // every ink that lands on the two real surfaces must clear AA
  for (const surface of ['bg', 'panel-2']) {
    for (const ink of ['ink', 'muted', 'accent', 'urgent', 'wrong', 'good']) {
      const r = ratio(tok[ink], tok[surface]);
      assert.ok(r >= 4.5, `--${ink} on --${surface} is ${r.toFixed(2)}:1, below AA 4.5`);
    }
  }
  assert.ok(ratio('#ffffff', tok['accent-fill']) >= 4.5, 'white on the filled accent button must clear AA');
  // the hairline is the only thing separating a black sleeve from a black page,
  // so it has to stay meaningfully above the ground
  assert.ok(lum(tok.line) > lum(tok.bg) * 4 + 0.002, '--line must stay visibly above the ground; it is the sleeve edge');

  // CARVE-OUT 1: the hands. Swapping these to the chrome accent would recolour
  // every right-hand note in the falls and the score, and would replace the
  // colour-blind-safe amber/cyan pair with a green/cyan one that is worse.
  assert.equal(tok.right, '#f0a832', '--right is the RIGHT HAND, not chrome; do not retint it');
  assert.equal(tok.left, '#5ec8f2', '--left is the LEFT HAND, not chrome; do not retint it');
  const falls = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'js', 'falls.mjs'), 'utf8');
  assert.ok(/right:\s*'#f0a832'/.test(falls), 'the falls deck still paints the right hand amber');
  assert.ok(!/var\(--right\)/.test(css), 'chrome must use --accent; --right is reserved for the hands');

  // CARVE-OUT 2: score mode is a printed page, so its tokens invert. Its own
  // amber failed AA on the cream (3.39:1) before this port; that is now fixed
  // and pinned so nobody "restores" it.
  const scoreBlock = css.slice(css.indexOf('.score-wrap'), css.indexOf('}', css.indexOf('.score-wrap')));
  const sTok = {};
  for (const m of scoreBlock.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) sTok[m[1]] = m[2].toLowerCase();
  const CREAM = '#f5f1e6';
  assert.ok(/background:\s*#f5f1e6/.test(scoreBlock), 'score mode stays a cream printed page');
  for (const k of ['right', 'left', 'accent']) {
    const r = ratio(sTok[k], CREAM);
    assert.ok(r >= 4.5, `score-mode --${k} is ${r.toFixed(2)}:1 on the cream page, below AA`);
  }
}
ok('contrast guard: tokens read from style.css clear AA on both surfaces, hands and cream score page pinned');

// --- tap-sound law (2026-08-28): taps hear the grand, the P-45 speaks for itself ---
{
  const { soundModeNext, tapSoundActive } = await import('../js/audio.mjs');
  assert.equal(soundModeNext('auto'), 'on');
  assert.equal(soundModeNext('on'), 'off');
  assert.equal(soundModeNext('off'), 'auto');
  assert.equal(soundModeNext(undefined), 'on', 'junk mode cycles from auto');
  assert.ok(tapSoundActive('auto', false), 'screen taps sound by default');
  assert.ok(!tapSoundActive('auto', true), 'the P-45 stays silent by default (council law)');
  assert.ok(tapSoundActive('on', true), 'On overrides even with MIDI');
  assert.ok(!tapSoundActive('off', false), 'Off is silent everywhere');
  assert.ok(tapSoundActive(undefined, false), 'old saved state behaves as auto');
}
ok('tap-sound: auto follows the input, overrides honest, old state safe');

// --- the rejected-G-chord class (Mark live 2026-08-28): rolled + staccato
// chords must count everywhere a chord is judged ---
{
  const { TogetherDrill, LevelRunner } = await import('../js/lessons.mjs');
  const { CardTask } = await import('../js/theory.mjs');
  // TogetherDrill: STACCATO — press+release each note of the chord in turn
  const td = new TogetherDrill([[55, 59, 62]], 1, () => 0.4); // G major
  td.note(55, true, 0); td.note(55, false, 60);
  td.note(59, true, 300); td.note(59, false, 360);
  const r1 = td.note(62, true, 600);
  assert.equal(r1.ok, true, 'staccato G chord accepted (window keeps released keys)');
  // TogetherDrill: the window EXPIRES — notes 2s apart are not one chord
  const td2 = new TogetherDrill([[55, 59, 62]], 1, () => 0.4);
  td2.note(55, true, 0); td2.note(55, false, 50);
  td2.note(59, true, 2000); td2.note(59, false, 2050);
  const r2 = td2.note(62, true, 4000);
  assert.notEqual(r2.ok, true, 'stale presses do not add up to a chord');
  // TogetherDrill: a wrong note resets the attempt
  const td3 = new TogetherDrill([[55, 59, 62]], 1, () => 0.4);
  td3.note(55, true, 0); td3.note(55, false, 50);
  td3.note(50, true, 100); // wrong
  td3.note(59, true, 200); td3.note(59, false, 250);
  const r4 = td3.note(62, true, 400);
  assert.notEqual(r4.ok, true, 'after a wrong note the try restarts (old evidence cleared)');
  // CardTask: rolled chord with early releases still passes
  const ct = new CardTask([55, 59, 62], 1);
  ct.note(55, true, 0); ct.note(55, false, 80);
  ct.note(59, true, 200);
  assert.equal(ct.note(62, true, 400), 'done', 'CardTask accepts the rolled G');
  // LevelRunner chord prompt: staccato accepted via the _judge window
  const lr = Object.create(LevelRunner.prototype);
  lr.down = new Set();
  lr._judge(55, true, [55, 59, 62], 0); lr._judge(55, false, [55, 59, 62], 60);
  lr._judge(59, true, [55, 59, 62], 300); lr._judge(59, false, [55, 59, 62], 350);
  assert.equal(lr._judge(62, true, [55, 59, 62], 600), true, 'LevelRunner accepts the staccato chord');
}
ok('chord acceptance: rolled + staccato land, stale evidence expires, wrong notes reset');

// Mark's hard rule, 2026-07-26, in his words: "Never use the em dash character
// in ANYTHING written for or as Mark ... It is the single biggest tell that an
// AI wrote the text." It had drifted back to 159 occurrences, 64 of them in
// copy a user reads, so it is a gate now rather than a memory.
{
  const { readdirSync } = await import('node:fs');
  const { join, dirname } = await import('node:path');
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
  const EM = '\u2014';
  const offenders = [];
  for (const dir of ['js', '.']) {
    for (const f of readdirSync(join(ROOT, dir))) {
      if (!/\.(mjs|html|css)$/.test(f)) continue;
      const rel = dir === '.' ? f : dir + '/' + f;
      const count = readFileSync(join(ROOT, rel), 'utf8').split(EM).length - 1;
      if (count) offenders.push(rel + ' (' + count + ')');
    }
  }
  assert.equal(offenders.length, 0, 'em dash found in: ' + offenders.join(', '));
}
ok('no em dashes anywhere in the app, copy or comments (Mark, hard rule)');

// DECOY MODULES. There is a 2330-line app.mjs in the repo root that nothing
// loads: index.html and sw.js both point at js/app.mjs, which is 2857 lines.
// Edit the wrong one and the app does not change, and every explanation you
// reach for will be wrong. Flag any root module that shadows a shipped one.
{
  const { readdirSync } = await import('node:fs');
  const { join, dirname } = await import('node:path');
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
  const shipped = new Set(readdirSync(join(ROOT, 'js')).filter((f) => f.endsWith('.mjs')));
  const shadows = readdirSync(ROOT).filter((f) => f.endsWith('.mjs') && shipped.has(f));
  assert.deepEqual(shadows, [],
    'root modules shadowing js/: ' + shadows.join(', ') + ' - nothing loads these, delete them');
}
ok('no decoy modules in the repo root shadowing a shipped js/ module');

// The canon templates are GENERATED from design/extracted/. A hand-edit there is
// the exact drift the apply-design method exists to prevent, and design-tool
// chrome leaking into the product is how an artboard ruler ended up rendering
// inside the app itself.
{
  const { readdirSync } = await import('node:fs');
  const { join, dirname } = await import('node:path');
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
  const canon = readFileSync(join(ROOT, 'js', 'canon-templates.mjs'), 'utf8');
  assert.ok(canon.startsWith('// GENERATED by tools/build-canon-templates.mjs'),
    'canon-templates.mjs must carry its generated banner');
  // 8a "Deck states" is a specification board, not a surface: the app reads its
  // values and never renders it, so it is extracted but not shipped.
  const SPEC_BOARDS = new Set(['deck']);
  const screens = readdirSync(join(ROOT, 'design', 'extracted'))
    .filter((f) => f.endsWith('.html') && !SPEC_BOARDS.has(f.replace('.html', '')));
  assert.ok(screens.length >= 18, 'expected the full artboard set, found ' + screens.length);
  for (const f of screens) {
    assert.ok(canon.includes('"' + f.replace('.html', '') + '":'), 'canon is missing screen ' + f);
  }
  assert.ok(!canon.includes('data-box='), 'extraction bookkeeping must be stripped from shipped markup');
  assert.ok(!canon.includes('393PX FOLD'), 'the artboard fold annotation must never ship');
  assert.ok(!canon.includes('dv-opt'), 'the design-tool export wrapper must never ship');
  assert.ok(!canon.includes('data:image/'), 'sleeves must be bound from art/, never inlined into the shell');
  // onchange="{{ noop }}" shipped and threw ReferenceError on every toggle of
  // Wait for me (165 journal errors); checked="{{ boxOff }}" rendered ticked.
  assert.ok(!/{{[^}]*}}/.test(canon), 'design binding tokens ({{ noop }}, {{ boxOn }}) must be resolved before the canon ships');
  ok('canon: ' + screens.length + ' screens generated, no design-tool chrome, no inlined artwork');
}

console.log(`\nALL GREEN: ${n} checks passed`);
