// The smallest things that fail if the learning lab's logic breaks.
// Every check here is a FAILURE SCENARIO a learner could actually produce:
// right onsets with wrong lengths, a key still down through a rest, an
// accidental that should have reset at the bar line, a helped pass trying to
// become independent evidence, a clock pushed backwards to fake a day's delay,
// a reward claimed twice. Node only, no DOM, no fixtures.
import assert from 'node:assert/strict';
import { SONGS } from '../js/songs.mjs';
import { triadMidis, inversions, competence, RETENTION_MIN_DELAY, evidenceDate } from '../js/teacher.mjs';
import { totalXp, isPerformedBlock, blockCount } from '../js/game.mjs';
import { spellPitch } from '../js/notation.mjs';
import { Engine } from '../js/engine.mjs';
import {
  LAB_CARDS, LAB_SKILLS, TRACKS, cardById, labRoster, exercise, parseRhythm, resolveWritten,
  BarAccidentals, scoreRhythm, scoreTaps, scoreSequence, scoreChords, scoreVertical, scoreTouch,
  scoreDynamicContrast, scoreBalance, verifyPassage, resolveAppliedCards, passageContext,
  positionVariant, POSITION_SHAPE, startCard, recordLabResult, recordRecovery, stageAvailable,
  nextStageKind, labProgress, labSummary, labBadges, migrateLab, dailyRoute, skipSegment,
  configureRoute, easyReadingNext, celebrationFor, labLabel, TOL, LAB_DAILY_XP_EVENTS,
  soundedNotes, recoveryFor, supportFor, valueName, tokenFromMidi, LAB_VERSION,
  qualifiedSlot, rungEarned, clockStatus, independentContentId, CLOCK_TOLERANCE_MS,
  transferPool, transferEarnable, stageRequires, fallbackSelfCheck, labCountCells,
  gradePassage, PASSAGE_INDEPENDENT_MIN_ACC,
  parseRhythm as parseR, ROUTE_DEFAULT,
} from '../js/learning-lab.mjs';

let n = 0;
const ok = (msg) => console.log(`  ok ${++n}. ${msg}`);
const DAY = 86400000;
const T0 = Date.parse('2026-09-13T10:00:00');

// Play an exercise exactly as written: every onset on its beat, every note
// held for its written value, silence through every rest.
function perfectEvents(ex, { hand = null, offsetMs = 0, holdFactor = 1 } = {}) {
  const out = [];
  for (const t of ex.targets) {
    if (hand && t.hand !== hand) continue;
    const on = t.at * ex.msPerBeat + offsetMs;
    for (const m of t.midis) {
      out.push({ kind: 'on', midi: m, at: on, velocity: 70 });
      out.push({ kind: 'off', midi: m, at: on + t.q * ex.msPerBeat * holdFactor - 30 });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}
const play = (session, events) => { for (const e of events) e.kind === 'on' ? session.noteOn(e.midi, e) : session.noteOff(e.midi, e); };

// --- 1. the authored content is musically correct and complete -------------
{
  assert.ok(LAB_CARDS.length >= 25, 'the roster is the deliverable');
  const ids = LAB_CARDS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'card ids are unique');
  for (const card of LAB_CARDS) {
    assert.ok(LAB_SKILLS[card.skill], `${card.id} names a real lab skill`);
    assert.ok(TRACKS.some((t) => t.id === card.track), `${card.id} sits in a real track`);
    assert.ok(card.measures && card.measures.length > 20, `${card.id} says what it measures`);
    assert.ok(card.teaches?.length >= 2, `${card.id} teaches before it tests`);
    const kinds = card.stages.map((s) => s.kind);
    for (const need of ['worked', 'guided', 'independent', 'recall', 'transfer']) {
      assert.ok(kinds.includes(need), `${card.id} has a ${need} rung`);
    }
    // ☠️ THE LAW: a label can never certify playing. Every rung that claims
    // independence or transfer takes physical input.
    for (const stage of card.stages) {
      if (!['independent', 'recall', 'transfer'].includes(stage.kind)) continue;
      assert.ok(['play-notes', 'play-rhythm', 'play-together', 'play-grid', 'play-passage', 'tap-rhythm', 'self-check'].includes(stage.input),
        `${card.id}/${stage.kind} takes physical input, not a multiple choice`);
      if (stage.input === 'self-check') assert.ok(card.requires, `${card.id}/${stage.kind} may only be a self check because its measurement is unsupported`);
    }
  }
  ok(`${LAB_CARDS.length} cards, five rungs each, every scoring rung takes physical input`);
}
{
  // every study song is an exercise, not repertoire, and none of them leaked
  // into the library
  const libIds = new Set(SONGS.map((s) => s.id));
  let songs = 0;
  for (const card of LAB_CARDS) for (const stage of card.stages) {
    if (!stage.ex) continue;
    songs++;
    assert.equal(stage.ex.song.labStudy, true, `${stage.ex.id} is labelled a study piece`);
    assert.equal(stage.ex.song.notRepertoire, true, `${stage.ex.id} is labelled not-repertoire`);
    assert.ok(!libIds.has(stage.ex.song.id), `${stage.ex.song.id} is not in the library`);
    assert.match(stage.ex.song.composer, /original/i, 'the composer line says it is an original exercise');
  }
  ok(`${songs} authored exercises, all marked original and none of them in the library`);
}
{
  // a bar that does not add up cannot be authored
  assert.throws(() => parseRhythm('q q q', [4, 4]), /needs 4/, 'a short bar throws');
  assert.throws(() => parseRhythm('q q q q q', [4, 4]), /needs 4/, 'a long bar throws');
  assert.throws(() => exercise({ id: 'x', pattern: 'q q h', notes: ['C4'] }), /sounding cells/, 'too few notes for the written cells throws');
  assert.throws(() => exercise({ id: 'x', pattern: 'q q h', notes: ['C4', 'D4', 'E4', 'F4'] }), /sounding cells/, 'too many notes throws');
  // triplet thirds still balance a bar
  const tri = parseRhythm('q q t8 t8 t8 q', [4, 4]);
  assert.equal(tri.cells.length, 6);
  assert.equal(tri.cells.at(-1).at, 3, 'three triplet eighths fill exactly one beat');
  ok('authoring guards: unbalanced bars and missing notes throw, triplets balance');
}

// --- 2. the thing this module exists for: durations and rests -------------
{
  const ex = exercise({ id: 'dur', bpm: 60, pattern: 'h h | q q q q', notes: Array(6).fill('C4') });
  const clean = scoreRhythm(ex, perfectEvents(ex), {});
  assert.equal(clean.passed, true, 'a correct read passes');

  // ☠️ SAME ONSETS, WRONG DURATIONS. Two half notes struck on beats 0 and 2
  // but released after one beat each: every onset perfect, the rhythm wrong.
  const shortHolds = perfectEvents(ex).map((e) => (e.kind === 'off' && e.at > 900 && e.at < 2100 ? { ...e, at: e.at - 1000 } : e));
  const wrongDur = scoreRhythm(ex, [
    { kind: 'on', midi: 60, at: 0 }, { kind: 'off', midi: 60, at: 950 },
    { kind: 'on', midi: 60, at: 2000 }, { kind: 'off', midi: 60, at: 2950 },
    { kind: 'on', midi: 60, at: 4000 }, { kind: 'off', midi: 60, at: 4900 },
    { kind: 'on', midi: 60, at: 5000 }, { kind: 'off', midi: 60, at: 5900 },
    { kind: 'on', midi: 60, at: 6000 }, { kind: 'off', midi: 60, at: 6900 },
    { kind: 'on', midi: 60, at: 7000 }, { kind: 'off', midi: 60, at: 7900 },
  ], {});
  assert.equal(wrongDur.counts.onTime, wrongDur.counts.onsets, 'every onset was on time');
  assert.equal(wrongDur.passed, false, 'and it still fails, because the half notes were played as quarters');
  assert.ok(wrongDur.faults.some((f) => f.kind === 'duration-short'), 'the fault names the duration');
  assert.ok(shortHolds.length, 'held-short variant constructed');
  ok('same onsets, wrong durations: every onset on time and the read still fails');
}
{
  // ☠️ A REST IS SILENCE. Holding through it fails, on its own fault kind.
  const ex = exercise({ id: 'rest', bpm: 60, pattern: 'q qr q qr', notes: ['C4', 'E4'] });
  assert.equal(scoreRhythm(ex, perfectEvents(ex), {}).passed, true, 'lifting on the rests passes');
  const held = [
    { kind: 'on', midi: 60, at: 0 }, { kind: 'off', midi: 60, at: 1900 },   // held through the quarter rest
    { kind: 'on', midi: 64, at: 2000 }, { kind: 'off', midi: 64, at: 2900 },
  ];
  const res = scoreRhythm(ex, held, {});
  assert.equal(res.passed, false, 'sustaining through a rest fails');
  assert.ok(res.faults.some((f) => f.kind === 'rest-sounded'), 'the fault says the rest was not silent');
  assert.ok(res.faults.some((f) => f.kind === 'duration-long'), 'and the note was too long');
  // and an extra note inside a rest is caught too
  const extra = scoreRhythm(ex, [...perfectEvents(ex), { kind: 'on', midi: 67, at: 1100 }, { kind: 'off', midi: 67, at: 1300 }], {});
  assert.equal(extra.passed, false);
  assert.ok(extra.faults.some((f) => f.kind === 'onset-extra' || f.kind === 'rest-sounded'), 'an extra note in a rest is a fault');
  ok('rest violations fail: a key held through a rest, and a note played inside one');
}
{
  // a tie is ONE sound. Re-striking the tied note is an extra onset.
  const ex = exercise({ id: 'tie', bpm: 60, pattern: 'q q h~ | h h', notes: ['C4', 'D4', 'E4', 'G4'] });
  assert.deepEqual(ex.targets.map((t) => [t.at, t.q]), [[0, 1], [1, 1], [2, 4], [6, 2]], 'the tied pair is one four-beat event');
  assert.equal(scoreRhythm(ex, perfectEvents(ex), {}).passed, true);
  const restruck = perfectEvents(ex).concat([{ kind: 'on', midi: 64, at: 4000 }, { kind: 'off', midi: 64, at: 4900 }]);
  const res = scoreRhythm(ex, restruck, {});
  assert.equal(res.passed, false, 'striking the tied note again fails');
  ok('ties: one press across the bar line, a second attack fails');
}
{
  // tap rungs measure ONSETS ONLY, and say so
  const ex = exercise({ id: 'tap', bpm: 60, pattern: 'q q q q', notes: Array(4).fill('C4') });
  const good = scoreTaps(ex, [0, 1000, 2000, 3000], {});
  assert.equal(good.passed, true);
  assert.equal(good.measures, 'onsets only');
  assert.equal(scoreTaps(ex, [0, 1000, 2000], {}).passed, false, 'a missing tap fails');
  assert.equal(scoreTaps(ex, [0, 1000, 2000, 2400, 3000], {}).passed, false, 'an extra tap fails');
  ok('tap rungs score onsets only, and miss/extra both fail');
}
{
  // two hands on one grid: the vertical question, at the published 120ms
  const ex = exercise({ id: 'grid', bpm: 60, voices: { R: { pattern: 'q q h', notes: ['E4', 'F4', 'G4'] }, L: { pattern: 'h h', notes: ['C3', 'G2'] } } });
  assert.equal(scoreVertical(ex, perfectEvents(ex), {}).passed, true, 'together passes');
  const late = perfectEvents(ex).map((e) => (e.midi < 60 ? { ...e, at: e.at + 200 } : e));
  const res = scoreVertical(ex, late, {});
  assert.equal(res.passed, false, '200ms apart fails');
  assert.ok(res.faults.some((f) => f.kind === 'hands-apart' && f.gapMs >= TOL.handGapMs));
  ok('two-hand grid: hands more than 120ms apart is its own failure');
}
{
  // 6/8 keeps its own beat unit end to end
  const ex = exercise({ id: 'six', meter: [6, 8], bpm: 90, pattern: '8 8 8 8 8 8 | qd qd', notes: ['C4', 'D4', 'E4', 'F4', 'E4', 'D4', 'C4', 'G4'] });
  assert.equal(ex.song.beatUnit, 8);
  assert.equal(ex.song.bpm, 180, 'the song object counts eighths, as fur-elise does');
  assert.equal(ex.song.notes[0].d, 1, 'an eighth is one stored beat in 6/8');
  assert.match(ex.render.tempoText, /♩\. = 60/, 'the printed beat is the dotted quarter');
  assert.equal(ex.render.beatUnitName, 'dotted quarter');
  assert.equal(scoreRhythm(ex, perfectEvents(ex), {}).passed, true);
  ok('6/8: stored in eighths, counted in dotted quarters, scored correctly');
}

// --- 3. notation: accidentals, carry, reset, key signatures ---------------
{
  // ☠️ CARRY THEN RESET. This is the rule the card teaches and the only
  // reason its drill can be marked at all.
  assert.deepEqual(resolveWritten([['Bb4', 'B4', 'Bn4', 'B4'], ['B4', 'Bb4', 'B4', 'Bn4']], 'C'),
    [[70, 70, 71, 71], [71, 70, 70, 71]],
    'an accidental carries to the end of its bar and the bar line resets it');
  // octave-specific: a flat on B4 does not flatten B3
  const state = new BarAccidentals('C');
  assert.equal(state.midiOf('Bb4'), 70);
  assert.equal(state.midiOf('B3'), 59, 'the carry is per letter AND octave');
  // key signatures produce the right pitches with nothing printed
  assert.deepEqual(resolveWritten([['F4', 'G4', 'A4', 'B4']], 'F'), [[65, 67, 69, 70]], 'F major: B is flat');
  assert.deepEqual(resolveWritten([['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5']], 'G'), [[67, 69, 71, 72, 74, 76, 78, 79]], 'G major: F is sharp');
  assert.deepEqual(resolveWritten([['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5']], 'D'), [[62, 64, 66, 67, 69, 71, 73, 74]], 'D major: F and C sharp');
  assert.deepEqual(resolveWritten([['B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']], 'Bb'), [[58, 60, 62, 63, 65, 67, 69, 70]], 'B flat major: B and E flat');
  // a natural inside a key signature lasts the bar, then the signature returns
  assert.deepEqual(resolveWritten([['B4', 'Bn4', 'B4'], ['B4']], 'F'), [[70, 71, 71], [70]], 'a natural cancels for its bar only');
  ok('accidental carry, octave scope, bar-line reset, and four key signatures');
}
{
  // enharmonics: two spellings, one key, and the app says so rather than
  // pretending it can tell them apart from what you played
  assert.deepEqual(resolveWritten([['F#4', 'Gb4']], 'C'), [[66, 66]]);
  const card = cardById('nt-enharmonics');
  assert.match(card.teaches.join(' '), /cannot tell you which spelling/i, 'the limit is stated in the teaching');
  ok('enharmonic spellings resolve to one key, with the limitation stated');
}
{
  // flats are spelled as flats, not as sharps wearing a disguise
  const flats = cardById('nt-flats').stages.find((s) => s.kind === 'independent').ex;
  for (const t of flats.targets) assert.ok(t.written.every((w) => /b\d$/.test(w)), `${t.written} is flat-spelled`);
  ok('the flats card actually contains flat spellings');
}

// --- 4. position independence and look-ahead ------------------------------
{
  // ☠️ THE SAME SHAPE, A DIFFERENT PLACE. The intervals must be identical and
  // the starting key must not be, or the drill is teaching finger numbers.
  const a = positionVariant('position', 'card|independent|2026-09-13');
  const b = positionVariant('position', 'card|recall|2026-09-14', [a.contentId]);
  const iv = (ex) => ex.targets.map((t) => t.midis[0] - ex.targets[0].midis[0]);
  assert.deepEqual(iv(a), POSITION_SHAPE, 'variant a is the authored shape');
  assert.deepEqual(iv(b), POSITION_SHAPE, 'variant b is the same shape');
  assert.notEqual(a.targets[0].midis[0], b.targets[0].midis[0], 'and it starts somewhere else');
  assert.notEqual(a.contentId, b.contentId, 'so its content identity differs');
  // determinism: the same key gives the same exercise
  assert.equal(positionVariant('position', 'card|independent|2026-09-13').contentId, a.contentId);
  // left hand variants live in the bass
  const l = positionVariant('position-left', 'card|transfer|2026-09-15');
  assert.ok(l.targets.every((t) => t.hand === 'L' && t.midis[0] < 60), 'the transfer variant is a left-hand bass exercise');
  // and the pool is finite and says so rather than silently repeating
  const all = [];
  let ex = positionVariant('position-left', 'seed', all);
  while (ex) { all.push(ex.contentId); ex = positionVariant('position-left', 'seed' + all.length, all); }
  assert.equal(positionVariant('position-left', 'anything', all), null, 'an exhausted pool returns null, never a repeat');
  ok('varied-position exercises: same intervals, different starts, deterministic, finite and honest about it');
}

// --- 5. chords, inversions and voicing transfer ---------------------------
{
  // the lab's authored triads ARE teacher.mjs's triads: one definition of a
  // chord in this app, not two
  for (const [cardId, sym] of [['ap-am-still-dre', 'Am'], ['ap-c-ode-to-joy', 'C'], ['ap-g-happy-birthday', 'G'], ['ap-cadence-study', 'F']]) {
    const card = cardById(cardId);
    const blocked = card.stages.find((s) => s.kind === 'guided').ex.targets[0].midis;
    const pcs = (ms) => [...new Set(ms.map((m) => m % 12))].sort((a, b) => a - b);
    assert.deepEqual(pcs(blocked), pcs(triadMidis(sym, 60)), `${cardId} blocked voicing is ${sym}`);
    const invs = card.stages.find((s) => s.kind === 'recall').ex.targets.map((t) => t.midis);
    for (const v of invs) assert.deepEqual(pcs(v), pcs(triadMidis(sym, 60)), 'each inversion holds the same three pitch classes');
    assert.ok(inversions(sym, 60).some((v) => pcs(v).join() === pcs(invs[0]).join()), 'and matches an inversion teacher.mjs would produce');
    // an inversion is a DIFFERENT voicing, not the same notes in the same order
    assert.notDeepEqual(invs[0], blocked, 'the recall rung asks for a different voicing');
  }
  // the C minor card has no TRIADS entry, so its chord is authored and checked here
  const cm = cardById('ap-cm-game-of-thrones').stages.find((s) => s.kind === 'guided').ex.targets[0].midis;
  assert.deepEqual(cm.map((m) => m - cm[0]), [0, 3, 7], 'C minor is root, minor third, fifth');
  ok('chord voicings: blocked, broken and both inversions agree with teacher.mjs');
}
{
  // a rolled chord still counts; a wrong note in it does not
  const targets = [{ midis: [60, 64, 67], label: 'C' }];
  const rolled = [
    { kind: 'on', midi: 60, at: 0 }, { kind: 'off', midi: 60, at: 100 },
    { kind: 'on', midi: 64, at: 150 }, { kind: 'on', midi: 67, at: 300 },
  ];
  assert.equal(scoreChords(targets, rolled).passed, true, 'a rolled chord lands inside the 1.5s window');
  const wrong = [...rolled, { kind: 'on', midi: 66, at: 320 }];
  assert.equal(scoreChords(targets, wrong).passed, false, 'a stray note in the chord fails');
  assert.equal(scoreChords(targets, [{ kind: 'on', midi: 60, at: 0 }]).passed, false, 'an incomplete chord fails');
  ok('chord scoring: rolled counts, stray notes and missing notes do not');
}

// --- 6. applied cards are grounded in the real library --------------------
{
  const resolved = resolveAppliedCards(SONGS);
  const withSong = resolved.filter((r) => cardById(r.cardId).passage);
  for (const r of withSong) assert.equal(r.ok, true, `${r.cardId} verifies against songs.mjs: ${(r.reasons ?? []).join('; ')}`);
  assert.ok(withSong.length >= 4, 'several real songs carry authored harmony');
  // the return-to-passage context is exact
  const ctx = passageContext(cardById('ap-am-still-dre'), resolved.find((r) => r.cardId === 'ap-am-still-dre'));
  assert.deepEqual([ctx.songId, ctx.section, ctx.startBeat, ctx.endBeat, ctx.hand, ctx.tempo, ctx.wait],
    ['still-dre-easy', 'Loop 1', 0, 8, 'both', 100, true]);
  assert.equal(ctx.technique.scaleId, 'scale-a-minor');
  assert.ok(SONGS.some((s) => s.id === ctx.technique.scaleId), 'the technique link points at a real scale in the ladder');
  for (const card of LAB_CARDS) if (card.technique) assert.ok(SONGS.some((s) => s.id === card.technique.scaleId), `${card.id} links to a real scale`);
  ok('every applied card verifies against the shipped song data and links to a real scale');
}
{
  // ☠️ AND IT REFUSES WHEN THE DATA MOVES. Harmony is never guessed.
  const card = cardById('ap-c-ode-to-joy');
  const moved = SONGS.map((s) => (s.id !== 'ode-to-joy' ? s : { ...s, notes: s.notes.map((nn) => (nn.h === 'L' && nn.b === 0 ? { ...nn, m: nn.m + 2 } : nn)) }));
  const res = resolveAppliedCards(moved).find((r) => r.cardId === card.id);
  assert.equal(res.ok, false, 'a changed bass refuses the card');
  assert.equal(res.passage, null, 'and no passage claim is offered');
  assert.equal(res.fallback, 'study-piece');
  assert.match(res.note, /will not annotate/, 'the refusal says so in words');
  assert.equal(verifyPassage(undefined, card.passage).ok, false, 'a missing song refuses too');
  ok('an applied card refuses itself rather than annotating music it cannot vouch for');
}

// --- 7. the evidence rules: assistance, repetition, delay, duplication ----
function run(st, cardId, stageKind, { now, assisted = false, hand = null, capabilities = { velocity: true, noteOff: true, pedal: true }, cal = null, resolvedApplied = null } = {}) {
  const s = startCard(st, cardId, { now, stage: stageKind, capabilities, cal, resolvedApplied });
  if (assisted) s.hint();
  if (s.input === 'listen') return recordLabResult(st, s.finish({ now }), { now });
  if (s.input === 'self-check') { s.answer(s.stage.selfCheck.options[0].id); return recordLabResult(st, s.finish({ now }), { now }); }
  if (s.input === 'play-passage') { s.recordPassage({ acc: 96, wrong: 0, assisted: false }); return recordLabResult(st, s.finish({ now }), { now }); }
  if (s.input === 'tap-rhythm') {
    for (const t of s.ex.targets) if (!hand || t.hand === hand) s.tap({ at: t.at * s.msPerBeat });
    return recordLabResult(st, s.finish({ now }), { now });
  }
  play(s, perfectEvents(s.ex, { hand }));
  return recordLabResult(st, s.finish({ now }), { now });
}
{
  const st = {};
  migrateLab(st);
  run(st, 'rh-values', 'worked', { now: T0 });
  const guided = run(st, 'rh-values', 'guided', { now: T0 + 60000 });
  assert.equal(guided.outcome, 'practice', 'a guided rung is practice credit, however well it went');
  assert.equal(guided.xp.length, 0, 'and it pays no XP');

  // ☠️ A HELPED PASS CANNOT FILL THE INDEPENDENT SLOT.
  const helped = run(st, 'rh-values', 'independent', { now: T0 + 120000, assisted: true });
  assert.equal(helped.outcome, 'practice');
  assert.ok(helped.refused.some((r) => /help/i.test(r)), 'and it says why');
  assert.equal(st.lab.cards['rh-values'].stages.independent?.passedAt, undefined, 'the independent rung is still open');
  assert.equal(stageAvailable(st, 'rh-values', 'recall', T0 + 200000).ok, false, 'so recall is not offered yet');

  const alone = run(st, 'rh-values', 'independent', { now: T0 + 180000 });
  assert.equal(alone.outcome, 'independent');
  assert.equal(alone.xp.length, 1, 'the first independent pass pays once');
  const xpAfterFirst = totalXp(st);

  // ☠️ AND REPEATING IT PAYS NOTHING AND PROVES NOTHING NEW.
  const again = run(st, 'rh-values', 'independent', { now: T0 + 240000 });
  assert.equal(again.outcome, 'independent');
  assert.equal(again.xp.length, 0, 'a repeat of the same rung on the same day is not a second reward');
  assert.equal(totalXp(st), xpAfterFirst, 'the balance did not move');
  ok('assisted passes stay practice, and repeating an easy rung earns no new XP');
}
{
  // ☠️ A DAY IS A CALENDAR FACT. Same day, no retention, whatever the clock says.
  const st = {};
  run(st, 'rh-rests', 'worked', { now: T0 });
  run(st, 'rh-rests', 'guided', { now: T0 + 1000 });
  run(st, 'rh-rests', 'independent', { now: T0 + 2000 });
  const sameDay = stageAvailable(st, 'rh-rests', 'recall', T0 + 3 * 3600000);
  assert.equal(sameDay.ok, false, 'recall is not available three hours later');
  assert.equal(sameDay.blocked, 'too-soon');
  assert.equal(sameDay.playableAsPractice, true, 'but it can still be played for practice');
  const early = run(st, 'rh-rests', 'recall', { now: T0 + 3 * 3600000 });
  assert.equal(early.outcome, 'independent', 'playing it early is an independent pass, not retention');
  assert.ok(early.refused.some((r) => /later day/i.test(r)));
  // ☠️ AND THE STORED PROGRESSION AGREES WITH THE LABEL. The recall rung stays
  // open; the pass lands where it was actually earned.
  assert.equal(labProgress(st, 'rh-rests').rungs.find((r) => r.kind === 'recall').done, false, 'the recall rung is not marked done by a downgraded attempt');
  assert.equal(labProgress(st, 'rh-rests').rungs.find((r) => r.kind === 'recall').practiced, true, 'it is recorded as practice on that rung');
  assert.equal(labProgress(st, 'rh-rests').rungs.find((r) => r.kind === 'independent').done, true, 'and it counts as the independent pass it was');
  assert.equal(st.lab.cards['rh-rests'].stages.independent.via, 'recall', 'the stored record says which rung it came from');

  // a fresh unassisted pass moves the retention clock with it: you cannot
  // claim you remembered something you played three hours ago
  const nextDay = T0 + DAY + 4 * 3600000;
  assert.equal(stageAvailable(st, 'rh-rests', 'recall', nextDay).ok, true, 'a real day later it is available');
  const retained = run(st, 'rh-rests', 'recall', { now: nextDay });
  assert.equal(retained.outcome, 'retained');
  assert.equal(retained.xp.length, 1);

  // ☠️ CLOCK PUSHED BACKWARDS: no delay credit, and nothing already earned is lost.
  const banked = totalXp(st);
  const st2 = JSON.parse(JSON.stringify(st));
  const rolledBack = run(st2, 'rh-rests', 'recall', { now: T0 - DAY });
  assert.notEqual(rolledBack.outcome, 'retained', 'a backwards clock cannot claim retention');
  assert.ok(st2.lab.clock.suspect, 'and the lab remembers that it happened');
  assert.ok(totalXp(st2) >= banked, 'earned XP survives the rollback');
  assert.equal(competence(st2.lab.cards['rh-rests'].evidence).word !== undefined, true, 'evidence is intact');
  ok('delayed recall is keyed to the calendar; a rolled-back clock forfeits the claim, not the history');
}
{
  // ☠️ TRANSFER MEANS NEW MATERIAL, AND THE POOL IS FINITE AND HONEST.
  // Each go deals the next unmet piece of authored material; when they have
  // all been met, the rung says so and stops claiming to be a transfer.
  const st = {};
  run(st, 'rh-eighths', 'worked', { now: T0 });
  run(st, 'rh-eighths', 'guided', { now: T0 + 1000 });
  run(st, 'rh-eighths', 'independent', { now: T0 + 2000 });
  const pool0 = labProgress(st, 'rh-eighths').rungs.find((r) => r.kind === 'transfer').pool;
  assert.equal(pool0.size, 3, 'the transfer rung carries three pieces of material');
  assert.equal(pool0.exhausted, false);

  const seenIds = new Set();
  const outcomes = [];
  for (let i = 0; i < 3; i++) {
    const s = startCard(st, 'rh-eighths', { now: T0 + (i + 1) * DAY, stage: 'transfer' });
    assert.equal(seenIds.has(s.contentId), false, `go ${i + 1} deals material not used before`);
    seenIds.add(s.contentId);
    play(s, perfectEvents(s.ex));
    outcomes.push(recordLabResult(st, s.finish({ now: T0 + (i + 1) * DAY }), { now: T0 + (i + 1) * DAY }));
  }
  assert.deepEqual(outcomes.map((o) => o.outcome), ['transferred', 'transferred', 'transferred'], 'each genuinely new piece is a transfer');
  assert.equal(outcomes.reduce((a, o) => a + o.xp.length, 0), 1, 'but the transfer reward is paid exactly once');

  // now the pool is empty and the module says so rather than pretending
  const after = startCard(st, 'rh-eighths', { now: T0 + 4 * DAY, stage: 'transfer' });
  assert.equal(after.poolExhausted, true);
  assert.equal(after.repeatedContent, true);
  assert.ok(after.ex, 'the rung is still playable');
  assert.match(after.state().repeatedNote, /can no longer earn a transfer/);
  play(after, perfectEvents(after.ex));
  const repeat = recordLabResult(st, after.finish({ now: T0 + 4 * DAY }), { now: T0 + 4 * DAY });
  assert.equal(repeat.outcome, 'independent', 'a repeat of known material is an independent pass, never a transfer');
  assert.ok(repeat.refused.some((r) => /already played/i.test(r)));
  assert.equal(repeat.xp.length, 0);
  const poolEnd = labProgress(st, 'rh-eighths').rungs.find((r) => r.kind === 'transfer').pool;
  assert.equal(poolEnd.exhausted, true);
  assert.equal(poolEnd.remaining, 0);
  assert.notEqual(nextStageKind(st, 'rh-eighths', T0 + 4 * DAY), 'transfer', 'and it is no longer offered as the next thing to do');
  ok('the transfer pool deals genuinely new material, pays once, and says honestly when it is spent');
}
{
  // duplicate rewards, three ways: the same result twice, the same ref twice,
  // and a day's worth of easy rungs
  const st = {};
  run(st, 'rh-pulse', 'worked', { now: T0 });
  run(st, 'rh-pulse', 'guided', { now: T0 + 1000 });
  const s = startCard(st, 'rh-pulse', { now: T0 + 2000, stage: 'independent' });
  for (const t of s.ex.targets) s.tap({ at: t.at * s.msPerBeat });
  const result = s.finish({ now: T0 + 2000 });
  const a = recordLabResult(st, result, { now: T0 + 2000 });
  const b = recordLabResult(st, result, { now: T0 + 2000 });
  assert.equal(a.xp.length, 1);
  assert.equal(b.xp.length, 0, 'submitting the identical result twice pays once');

  // the daily cap
  const st2 = {};
  let paid = 0;
  const cards = ['rh-pulse', 'rh-values', 'rh-rests', 'rh-eighths', 'rh-dots', 'rh-ties'];
  for (const id of cards) {
    run(st2, id, 'worked', { now: T0 });
    run(st2, id, 'guided', { now: T0 + 1000 });
    paid += run(st2, id, 'independent', { now: T0 + 2000 }).xp.length;
  }
  assert.equal(paid, LAB_DAILY_XP_EVENTS, `the daily reward cap holds at ${LAB_DAILY_XP_EVENTS}`);
  const blocked = (st2.blocks ?? []).filter((bl) => String(bl.kind).startsWith('lab')).length;
  assert.ok(blocked >= cards.length, 'but every completed rung still banks a practice block');
  ok('rewards never duplicate: same result, same ref, and a daily cap that still credits practice');
}
{
  // ☠️ A FAILED ATTEMPT IS NOT A PASS, and the feedback says which of the
  // three things went wrong rather than "try again".
  const st = {};
  run(st, 'rh-rests', 'worked', { now: T0 });
  run(st, 'rh-rests', 'guided', { now: T0 + 1000 });
  const s = startCard(st, 'rh-rests', { now: T0 + 2000, stage: 'independent' });
  const events = perfectEvents(s.ex).map((e) => (e.kind === 'off' ? { ...e, at: e.at + 1400 } : e));
  play(s, events);
  const res = s.finish({ now: T0 + 2000 });
  assert.equal(res.passed, false);
  assert.ok(res.faults.some((f) => f.kind.startsWith('rest') || f.kind.startsWith('duration')));
  assert.ok(res.recovery?.label?.startsWith('Bar'), 'a recovery span is offered');
  assert.match(res.recovery.say, /just this bar/i, 'and it is a repair, not a restart');
  const rec = recordLabResult(st, res, { now: T0 + 2000 });
  assert.equal(rec.outcome, 'not-yet');
  assert.equal(rec.xp.length, 0);
  const fix = recordRecovery(st, 'rh-rests', { fixed: true, now: T0 + 3000 });
  assert.equal(fix.credited, true, 'a useful repair earns practice credit');
  assert.equal(st.lab.cards['rh-rests'].stages.independent?.passedAt, undefined, 'but never a pass');
  ok('a failed rung names the fault, offers one bar to repair, and credits the repair only as practice');
}

// --- 8. expression: measured where supported, honest where not ------------
{
  const card = cardById('ex-touch');
  const stage = card.stages.find((s) => s.kind === 'independent');
  const ex = stage.ex;
  const staccato = [];
  for (const t of ex.targets) {
    const on = t.at * ex.msPerBeat;
    staccato.push({ kind: 'on', midi: t.midis[0], at: on, velocity: 70 }, { kind: 'off', midi: t.midis[0], at: on + 200 });
  }
  assert.equal(scoreTouch(ex, staccato, 'staccato', {}).passed, true, 'short notes pass a staccato goal');
  assert.equal(scoreTouch(ex, perfectEvents(ex), 'staccato', {}).passed, false, 'full-length notes do not');
  ok('articulation is measured from real key releases');
}
{
  // same-key dynamics are supported; cross-register balance is not, without
  // calibration, and it refuses instead of guessing
  const ex = cardById('ex-dynamics').stages.find((s) => s.kind === 'independent').ex;
  const plan = cardById('ex-dynamics').stages.find((s) => s.kind === 'independent').dynamicPlan;
  const mk = (velFor) => ex.targets.map((t) => {
    const on = t.at * ex.msPerBeat;
    return [{ kind: 'on', midi: t.midis[0], at: on, velocity: velFor(t.at) }, { kind: 'off', midi: t.midis[0], at: on + t.q * ex.msPerBeat - 30 }];
  }).flat();
  assert.equal(scoreDynamicContrast(ex, mk((at) => (at < 4 ? 40 : 95)), plan, {}).passed, true, 'a clear contrast passes');
  assert.equal(scoreDynamicContrast(ex, mk(() => 70), plan, {}).passed, false, 'no contrast fails');
  const noVel = mk(() => 70).map((e) => (e.kind === 'on' ? { ...e, velocity: null } : e));
  const un = scoreDynamicContrast(ex, noVel, plan, {});
  assert.equal(un.supported, false, 'an input with no velocity is refused, not failed');
  const bal = cardById('ex-balance').stages.find((s) => s.kind === 'independent').ex;
  const noCal = scoreBalance(bal, perfectEvents(bal), null, {});
  assert.equal(noCal.supported, false);
  assert.match(noCal.why, /calibration/i, 'and it says calibration is what is missing');
  ok('dynamics: same-key contrast is measured, cross-register balance refuses without calibration');
}
{
  // an unsupported card degrades to a listening self check, and a self report
  // can never become competence
  const st = {};
  const s = startCard(st, 'ex-pedal', { now: T0, stage: 'independent', capabilities: { velocity: true, noteOff: true, pedal: false } });
  assert.equal(s.degraded, true);
  assert.equal(s.input, 'self-check');
  assert.equal(s.support.ok, false);
  // ☠️ THERE IS A REAL QUESTION, AND IT MUST BE ANSWERED. No optional chaining
  // here: if the question is missing this line throws, which is the point.
  const q = s.state().selfCheck;
  assert.ok(q.prompt.length > 20 && q.options.length >= 2, 'the degraded rung asks a real question');
  assert.equal(s.finish({ now: T0 }).passed, false, 'pressing next without answering is not a verdict');
  assert.equal(recordLabResult(st, s.finish({ now: T0 }), { now: T0 }).outcome, 'not-yet', 'and records nothing');
  s.answer(q.options[0].id);
  const res = s.finish({ now: T0 });
  assert.equal(res.passed, null, 'an answered self check has no pass either');
  const rec = recordLabResult(st, res, { now: T0 });
  assert.equal(rec.outcome, 'self-report');
  assert.equal(rec.xp.length, 0);
  assert.equal(labProgress(st, 'ex-pedal').competence, null, 'and it produces no competence claim at all');
  assert.equal(supportFor(cardById('ex-balance'), { velocity: true }, null).ok, false, 'balance needs calibration');
  assert.equal(supportFor(cardById('ex-balance'), { velocity: true }, { zones: [1] }).ok, true);
  ok('unsupported measurements become listening checks, and a self report is never competence');
}

// --- 9. migration, state and the daily route -----------------------------
{
  // ☠️ MIGRATION FABRICATES NOTHING.
  const empty = {};
  migrateLab(empty);
  assert.equal(empty.lab.v, LAB_VERSION);
  assert.deepEqual(empty.lab.cards, {});
  assert.equal(labSummary(empty).independent, 0);
  for (const p of LAB_CARDS.map((c) => labProgress(empty, c.id))) {
    assert.equal(p.competence, null, `${p.cardId} claims nothing`);
    assert.equal(p.line, 'Not checked yet');
    assert.equal(labLabel(p), 'Not started');
  }
  // existing earned data survives a migration untouched
  const st = { xpTotal: 260, xpKeys: { 'playable|x': 1 }, blocks: [{ t: 1, kind: 'journey', ref: 'a' }], lab: { v: 0, cards: { 'gone-card': { attempts: 3, evidence: [] } } } };
  migrateLab(st);
  assert.equal(st.xpTotal, 260, 'XP untouched');
  assert.equal(st.lab.legacyVersion, 0, 'the old version is remembered');
  assert.equal(st.lab.cards['gone-card'].retired, true, 'a card that no longer exists keeps its history and is retired');
  assert.equal(st.lab.cards['gone-card'].attempts, 3);
  ok('migration: nothing invented for a fresh state, nothing lost from an old one');
}
{
  const st = {};
  const route = dailyRoute(st, { now: T0, prescription: { kind: 'repertoire', songId: 'ode-to-joy' } });
  assert.equal(route.segments.length, 4);
  assert.equal(route.totalMinutes, 30);
  assert.match(route.note, /not a prescription/i, 'the route never claims to be optimal');
  assert.ok(route.segments.every((s) => s.optional), 'every segment is optional');
  const passageSeg = route.segments.find((s) => s.id === 'passage');
  assert.equal(passageSeg.suggestion.kind, 'prescription');
  assert.deepEqual(passageSeg.suggestion.prescription, { kind: 'repertoire', songId: 'ode-to-joy' }, 'the existing prescription is passed through whole, not rewritten');
  assert.ok(route.segments.find((s) => s.id === 'reading').suggestion.cardId, 'and reading always has something short to offer');
  const skip = skipSegment(st, 'passage', route.day);
  assert.equal(skip.penalty, null, 'skipping costs nothing');
  assert.equal(dailyRoute(st, { now: T0 }).segments.find((s) => s.id === 'passage').skipped, true);
  assert.equal(dailyRoute(st, { now: T0 }).totalMinutes, 15, 'and the day gets shorter, not worse');
  configureRoute(st, { order: ['reading', 'passage'], minutes: { reading: 3 } });
  const custom = dailyRoute(st, { now: T0 });
  assert.deepEqual(custom.segments.map((s) => s.id), ['reading', 'passage']);
  assert.equal(custom.segments[0].minutes, 3);
  ok('the daily route is a suggestion: reorderable, shortenable, skippable, no penalty');
}
{
  // a hard piece dominating the history must never bury a five-minute read
  const st = { songs: { 'clair-de-lune': { plays: 40 } }, blocks: Array.from({ length: 30 }, (_, i) => ({ t: T0 - i * 1000, kind: 'journey', ref: 'clair-de-lune|Full run' })) };
  const reading = easyReadingNext(st, T0);
  assert.ok(reading.cardId, 'there is always a fresh reading rung reachable');
  assert.ok(['rhythm', 'reading'].includes(cardById(reading.cardId).track));
  ok('a short fresh read stays reachable however much hard repertoire is in the history');
}
{
  // the roster is documentable: every card says what it measures, and the
  // badges are evidence rows, not scores
  const roster = labRoster();
  assert.equal(roster.length, LAB_CARDS.length);
  for (const r of roster) {
    assert.ok(r.measures && r.skillName, `${r.id} documents itself`);
    if (r.requires) assert.ok(r.support, `${r.id} says what hardware its measurement needs`);
  }
  const st = {};
  run(st, 'rh-values', 'worked', { now: T0 });
  run(st, 'rh-values', 'guided', { now: T0 + 1000 });
  run(st, 'rh-values', 'independent', { now: T0 + 2000 });
  const badges = labBadges(st);
  assert.ok(badges.some((b) => b.id === 'lab:rh-values' && /alone/.test(b.word)), 'a badge is a dated evidence row');
  assert.ok(badges.every((b) => b.evidence), 'every badge carries its evidence');
  const cel = celebrationFor({ outcome: 'independent', xp: [{ xp: 40 }] });
  assert.equal(cel.duringPlay, false, 'nothing celebrates while you are playing');
  assert.equal(cel.reducedMotionSafe, true);
  assert.equal(celebrationFor({ outcome: 'not-yet' }), null, 'and a miss is not celebrated at you');
  ok('roster documents itself; badges are dated evidence; celebrations are restrained and never mid-play');
}
{
  // ☠️ A KIND CAN HAVE MORE THAN ONE RUNG. The grand-staff card teaches right
  // hand alone and left hand alone before both, and both of those must be
  // reachable: treating "guided" as a single thing skipped the left hand.
  const st = {};
  assert.equal(cardById('nt-vertical').stages.filter((s) => s.kind === 'guided').length, 2);
  run(st, 'nt-vertical', 'worked', { now: T0 });
  const s1 = startCard(st, 'nt-vertical', { now: T0 + 1000 });
  assert.equal(s1.stage.title, 'Right hand alone first');
  play(s1, perfectEvents(s1.ex));
  recordLabResult(st, s1.finish({ now: T0 + 1000 }), { now: T0 + 1000 });
  const s2 = startCard(st, 'nt-vertical', { now: T0 + 2000 });
  assert.equal(s2.stage.title, 'Now the left hand alone', 'the second guided rung is reachable');
  assert.equal(s2.stageIndex, 1);
  play(s2, perfectEvents(s2.ex));
  recordLabResult(st, s2.finish({ now: T0 + 2000 }), { now: T0 + 2000 });
  assert.equal(nextStageKind(st, 'nt-vertical', T0 + 3000), 'independent', 'only then does it move on');
  ok('both hands-separate rungs of the grand-staff card are reachable before the vertical one');
}
{
  // a touch goal that covers part of an exercise judges only that part: the
  // tied bar of the tie-versus-slur card must not fail a legato test aimed at
  // the slurred bar
  const st = {};
  run(st, 'rh-tie-vs-slur', 'worked', { now: T0 });
  run(st, 'rh-tie-vs-slur', 'guided', { now: T0 + 1000 });
  const s = startCard(st, 'rh-tie-vs-slur', { now: T0 + 2000, stage: 'independent' });
  const ev = [];
  for (const t of s.ex.targets) {                       // legato: each note held into the next
    const on = t.at * s.msPerBeat;
    ev.push({ kind: 'on', midi: t.midis[0], at: on, velocity: 70 }, { kind: 'off', midi: t.midis[0], at: on + t.q * s.msPerBeat + 5 });
  }
  play(s, ev.sort((a, b) => a.at - b.at));
  const res = s.finish({ now: T0 + 2000 });
  assert.equal(res.report.touch.supported, true);
  assert.equal(res.passed, true, 'a tie played once and a slur joined smoothly passes');
  ok('a touch goal scoped to part of an exercise judges only that part');
}
{
  // ☠️ A REFUSED PASSAGE STILL LEAVES A PLAYABLE RUNG. The study piece is ours
  // and cannot drift, so the card degrades instead of breaking.
  const moved = SONGS.map((s) => (s.id !== 'still-dre-easy' ? s : { ...s, sections: [{ name: 'Renamed', startBeat: 0, endBeat: 8 }, ...s.sections.slice(1)] }));
  const resolvedApplied = resolveAppliedCards(moved);
  const st = {};
  run(st, 'ap-am-still-dre', 'worked', { now: T0, resolvedApplied });
  run(st, 'ap-am-still-dre', 'guided', { now: T0 + 1000, resolvedApplied });
  run(st, 'ap-am-still-dre', 'independent', { now: T0 + 2000, resolvedApplied });
  const s = startCard(st, 'ap-am-still-dre', { now: T0 + DAY, stage: 'transfer', resolvedApplied });
  assert.equal(s.fellBack, true);
  assert.equal(s.input, 'play-rhythm', 'the rung plays the study piece instead');
  assert.equal(s.state().passage, null, 'and makes no passage claim');
  assert.match(s.state().fellBackNote, /will not annotate/);
  play(s, perfectEvents(s.ex));
  const rec = recordLabResult(st, s.finish({ now: T0 + DAY }), { now: T0 + DAY });
  assert.equal(rec.outcome, 'transferred', 'and it is still a real, playable transfer rung');
  // with the real library it opens the real passage instead
  const good = startCard(st, 'ap-am-still-dre', { now: T0 + DAY, stage: 'transfer', resolvedApplied: resolveAppliedCards(SONGS) });
  assert.equal(good.fellBack, false);
  assert.equal(good.input, 'play-passage');
  assert.equal(good.state().passage.songId, 'still-dre-easy');
  ok('a refused passage falls back to the study piece rather than leaving a dead rung');
}
{
  // ☠️ THE WHOLE CURRICULUM, PLAYED CORRECTLY, MUST PASS. Every authored rung
  // of every card, performed exactly as written, with the articulation and
  // dynamics its marks ask for. This is the check that catches an exercise
  // nobody could actually pass, which is the worst possible defect here: a
  // learner doing everything right and being told they failed.
  const CAL = { v: 1, date: null, zones: [0, 1, 2, 3].map(() => ({ soft: 40, medium: 64, strong: 96 })) };
  const resolvedApplied = resolveAppliedCards(SONGS);
  // Exact coverage, reported rather than glossed: every rung is accounted for
  // in one of these buckets and the buckets are asserted to add up.
  const cover = { played: 0, demonstration: 0, passage: 0, selfCheck: 0 };
  let rungs = 0, played = 0;
  for (const card of LAB_CARDS) {
    for (let i = 0; i < card.stages.length; i++) {
      const stage = card.stages[i];
      rungs++;
      const st = {};
      const s = startCard(st, card.id, {
        now: T0, stage: stage.kind, stageIndex: card.stages.filter((x, j) => x.kind === stage.kind && j < i).length,
        capabilities: { velocity: true, noteOff: true, pedal: true }, cal: CAL, resolvedApplied,
      });
      assert.ok(s, `${card.id}/${stage.kind} opens`);
      if (s.input === 'listen') { if (stage.ask) s.answer(stage.ask.options.find((o) => o.correct).id); assert.equal(s.finish({ now: T0 }).passed, true); cover.demonstration++; continue; }
      if (s.input === 'self-check') { s.answer(stage.selfCheck.options[0].id); assert.equal(s.finish({ now: T0 }).passed, null); cover.selfCheck++; continue; }
      if (s.input === 'play-passage') { s.recordPassage({ acc: 92, wrong: 0, assisted: false }); assert.equal(s.finish({ now: T0 }).passed, true); cover.passage++; continue; }
      const ex = s.ex;
      assert.ok(ex, `${card.id}/${stage.kind} has an exercise`);
      if (s.input === 'tap-rhythm') {
        for (const t of ex.targets) if (!stage.hand || t.hand === stage.hand) s.tap({ at: t.at * s.msPerBeat });
        const r = s.finish({ now: T0 });
        assert.equal(r.passed, true, `${card.id}/${stage.kind}: a correct tap read passes`);
        played++; cover.played++; continue;
      }
      // build a performance that honours the marks on the page
      const dots = (ex.marks ?? []).filter((m) => m.kind === 'articulation' && m.value === 'staccato');
      const inSpan = (at, m) => at >= m.from && at <= m.to;
      const plan = stage.dynamicPlan ?? null;
      const events = [];
      for (const t of ex.targets) {
        const on = t.at * ex.msPerBeat;
        const staccato = dots.some((m) => inSpan(t.at, m)) || stage.touchGoal?.goal === 'staccato';
        const legato = stage.touchGoal?.goal === 'legato' && t.at >= (stage.touchGoal.fromBeat ?? -Infinity) && t.at < (stage.touchGoal.toBeat ?? Infinity);
        const hold = staccato ? Math.min(200, t.q * ex.msPerBeat * 0.3) : t.q * ex.msPerBeat + (legato ? 6 : -30);
        const level = plan?.find((p) => t.at >= p.from && t.at < p.to)?.level;
        const vel = level === 'f' ? 104 : level === 'p' ? 38 : stage.balance ? (t.hand === 'R' ? 100 : 42) : 70;
        for (const m of t.midis) events.push({ kind: 'on', midi: m, at: on, velocity: vel }, { kind: 'off', midi: m, at: on + hold });
      }
      events.sort((a, b) => a.at - b.at);
      if (stage.pedal) {                       // lift and catch on every bass change
        const bass = ex.targets.filter((t) => t.hand === 'L').map((t) => t.at * ex.msPerBeat);
        s.pedal(true, { at: 40 });
        for (const at of bass.slice(1)) { s.pedal(false, { at: at + 20 }); s.pedal(true, { at: at + 70 }); }
      }
      play(s, events);
      const r = s.finish({ now: T0 });
      assert.equal(r.passed, true,
        `${card.id}/${stage.kind} (${s.input}): a correct performance must pass. Faults: ${JSON.stringify(r.faults?.map((f) => f.text))}`);
      played++; cover.played++;
    }
  }
  // ☠️ NOTHING IS QUIETLY OMITTED. Every rung is in exactly one bucket, and
  // the three non-played buckets are named for what they are.
  assert.equal(cover.played + cover.demonstration + cover.passage + cover.selfCheck, rungs, 'every rung is accounted for');
  assert.equal(cover.played, 110);
  assert.equal(cover.demonstration, 29, 'one watch-and-listen rung per card, which is not scored and says so');
  assert.equal(cover.passage, 4, 'four rungs hand back to the practice surface of the app itself');
  assert.equal(cover.selfCheck, 3, 'three rungs are listening self checks by design');
  ok(`${rungs} rungs across ${LAB_CARDS.length} cards, all accounted for: ${cover.played} played and passed, ${cover.demonstration} demonstrations, ${cover.passage} handed to the practice surface, ${cover.selfCheck} listening self checks`);
}
// --- 10. supervisor-reproduced defects, fixed and pinned here -------------
{
  // ☠️ SUPERVISOR REPRO #5, VERBATIM. A perfect alternating two-hand read used
  // to fail with three rest errors, because the rest check treated the OTHER
  // hand's legitimate notes as a violation. Hands come from the authored
  // target the press satisfied; they are never inferred from pitch.
  const ex = exercise({ id: 'audit', bpm: 60, voices: {
    R: { pattern: 'q qr q qr', notes: ['C4', 'E4'] },
    L: { pattern: 'q q qr q', notes: ['C3', 'D3', 'F3'] },
  } });
  const perfect = perfectEvents(ex);
  const v = scoreVertical(ex, perfect, {});
  assert.equal(v.rhythm.counts.onsets, 5, 'five authored onsets');
  assert.equal(v.rhythm.counts.onTime, 5, 'all five on time');
  assert.equal(v.rhythm.counts.rests, 3, 'three written rests are examined');
  assert.equal(v.rhythm.counts.restsClean, 3, 'and all three are clean');
  assert.deepEqual(v.faults, [], 'a perfect alternating two-hand read has no faults at all');
  assert.equal(v.passed, true);
  assert.equal(v.joins.length, 1, 'beat 0 is the one moment both hands move');
  assert.equal(v.joins[0].together, true);

  // ☠️ AND THE OWN-HAND CASE STILL FAILS. C4 is a right-hand note held through
  // the right hand's own quarter rest.
  const held = perfect.map((e) => (e.kind === 'off' && e.midi === 60 ? { ...e, at: e.at + 1000 } : e));
  const bad = scoreRhythm(ex, held, {});
  assert.equal(bad.passed, false);
  const restFaults = bad.faults.filter((f) => f.kind === 'rest-sounded');
  assert.equal(restFaults.length, 1, 'exactly one rest violation, the real one');
  assert.equal(restFaults[0].hand, 'R', 'attributed to the hand that actually held the key');
  assert.match(restFaults[0].text, /right hand/);

  // cross-hand unison: one physical key satisfying both staves, the same law
  // Engine.buildGroups applies when it dedupes a unison
  const uni = exercise({ id: 'uni', bpm: 60, voices: {
    R: { pattern: 'w', notes: ['C4'] }, L: { pattern: 'w', notes: ['C4'] },
  } });
  const onePress = [{ kind: 'on', midi: 60, at: 0, velocity: 70 }, { kind: 'off', midi: 60, at: 3900 }];
  const uniRes = scoreRhythm(uni, onePress, {});
  assert.equal(uniRes.counts.onsets, 2, 'both staves asked for the note');
  assert.equal(uniRes.counts.onTime, 2, 'and one press satisfied both');
  assert.equal(uniRes.counts.extras, 0, 'the shared press is not an extra');
  assert.equal(uniRes.passed, true);

  // chord targets: all notes required, and the other chord members are never
  // rejected as extras
  const ch = exercise({ id: 'ch', bpm: 60, pattern: 'w', notes: [['C4', 'E4', 'G4']] });
  assert.equal(scoreRhythm(ch, perfectEvents(ch), {}).passed, true, 'a full chord passes');
  const partial = perfectEvents(ch).filter((e) => e.midi !== 67);
  const pr = scoreRhythm(ch, partial, {});
  assert.equal(pr.passed, false, 'a two-note chord fails');
  assert.match(pr.faults[0].text, /Only 2 of 3/, 'and says which notes were missing');
  assert.equal(pr.counts.extras, 2, 'the two notes played are reported as unclaimed, not as a pass');
  ok('two-hand rests use authored hands: opposite-hand notes are legal, own-hand holds fail, unisons share, chords need every note');
}
{
  // ☠️ SUPERVISOR REPRO #10, VERBATIM. The downgrade label and the STORED
  // progression must agree. A recall claim with no independent pass behind it
  // is an independent pass, and the recall rung stays open everywhere: in the
  // stored record, in labProgress, in the summary, in the badges and in what
  // is offered next.
  const st = {};
  const res = recordLabResult(st, {
    cardId: 'rh-values', stage: 'recall', input: 'play-grid', contentId: 'x',
    outcomeClaim: 'retained', passed: true, assisted: false, at: T0,
  }, { now: T0 });
  assert.equal(res.outcome, 'independent');
  assert.ok(res.refused.some((r) => /No independent pass to remember/i.test(r)));
  const p = labProgress(st, 'rh-values');
  assert.equal(p.rungs.find((r) => r.kind === 'recall').done, false, 'the recall rung is NOT done');
  assert.equal(p.rungs.find((r) => r.kind === 'recall').practiced, true, 'it is recorded as practice');
  assert.equal(st.lab.cards['rh-values'].stages.recall, undefined, 'and nothing was written into the recall slot');
  assert.equal(rungEarned(st, 'rh-values', 'recall'), false);
  assert.equal(labSummary(st).retained, 0, 'the summary does not count it as retained');
  assert.ok(!labBadges(st).some((b) => /still remembered/.test(b.word)), 'no badge claims retention');

  // ☠️ AND AN ASSISTED TRANSFER DOES NOT FILL THE TRANSFER RUNG.
  const st2 = {};
  recordLabResult(st2, { cardId: 'rh-values', stage: 'worked', input: 'listen', outcomeClaim: 'practice', passed: true, at: T0 }, { now: T0 });
  recordLabResult(st2, { cardId: 'rh-values', stage: 'guided', input: 'play-rhythm', contentId: 'g', outcomeClaim: 'practice', passed: true, assisted: true, at: T0 }, { now: T0 });
  recordLabResult(st2, { cardId: 'rh-values', stage: 'independent', input: 'play-rhythm', contentId: 'a', outcomeClaim: 'independent', passed: true, assisted: false, at: T0 }, { now: T0 });
  const t = recordLabResult(st2, { cardId: 'rh-values', stage: 'transfer', input: 'play-rhythm', contentId: 'b', outcomeClaim: 'practice', passed: true, assisted: true, at: T0 + DAY }, { now: T0 + DAY });
  assert.equal(t.outcome, 'practice');
  assert.equal(st2.lab.cards['rh-values'].stages.transfer, undefined, 'an assisted transfer writes nothing to the transfer slot');
  assert.equal(labProgress(st2, 'rh-values').rungs.find((r) => r.kind === 'transfer').done, false);
  assert.equal(labSummary(st2).transferred, 0);
  // still the next thing to do (checked before the recall check comes due,
  // which legitimately jumps the queue on a later day)
  assert.equal(nextStageKind(st2, 'rh-values', T0 + 3600000), 'transfer', 'so the transfer rung is still what comes next');
  // the earlier independent record is untouched by the failed claim
  assert.equal(st2.lab.cards['rh-values'].stages.independent.passedAt, T0, 'old earned records are preserved');
  assert.equal(labSummary(st2).practiceOnly >= 1, true, 'and the practice is counted as practice');

  // ☠️ A REPEATED TRANSFER, DOWNGRADED TO INDEPENDENT, CANNOT COMPLETE TRANSFER.
  const st3 = {};
  recordLabResult(st3, { cardId: 'rh-values', stage: 'independent', input: 'play-rhythm', contentId: 'a', outcomeClaim: 'independent', passed: true, assisted: false, at: T0 }, { now: T0 });
  recordLabResult(st3, { cardId: 'rh-values', stage: 'transfer', input: 'play-rhythm', contentId: 'b', outcomeClaim: 'transferred', passed: true, assisted: false, at: T0 + DAY }, { now: T0 + DAY });
  assert.equal(rungEarned(st3, 'rh-values', 'transfer'), true, 'the first, novel transfer is earned');
  const before = JSON.stringify(st3.lab.cards['rh-values'].stages.transfer);
  const again = recordLabResult(st3, { cardId: 'rh-values', stage: 'transfer', input: 'play-rhythm', contentId: 'b', outcomeClaim: 'transferred', passed: true, assisted: false, at: T0 + 2 * DAY }, { now: T0 + 2 * DAY });
  assert.equal(again.outcome, 'independent', 'the repeat is an independent pass');
  assert.equal(JSON.stringify(st3.lab.cards['rh-values'].stages.transfer), before, 'and it neither re-fills nor overwrites the transfer record');
  // qualifiedSlot is the single rule all of that comes from
  assert.equal(qualifiedSlot('recall', 'independent'), 'independent');
  assert.equal(qualifiedSlot('transfer', 'practice'), null);
  assert.equal(qualifiedSlot('independent', 'practice'), null);
  assert.equal(qualifiedSlot('guided', 'practice'), 'guided');
  assert.equal(qualifiedSlot('recall', 'retained'), 'recall');
  assert.equal(qualifiedSlot('transfer', 'transferred'), 'transfer');
  assert.equal(qualifiedSlot('independent', 'not-yet'), null);
  ok('stored progression follows the qualified outcome: recall, transfer and independent slots only fill when earned');
}
{
  // ☠️ SUPERVISOR FINDING #11. A rolled-back clock must DEFER retention, not
  // ban it forever. rollback -> refused -> clock catches up -> a legitimate
  // later recall counts again, with every earned record intact.
  const st = {};
  run(st, 'rh-dots', 'worked', { now: T0 });
  run(st, 'rh-dots', 'guided', { now: T0 + 1000 });
  run(st, 'rh-dots', 'independent', { now: T0 + 2000 });
  const earned = totalXp(st);

  // the clock jumps back a week
  const back = T0 - 7 * DAY;
  const rolled = run(st, 'rh-dots', 'recall', { now: back });
  assert.notEqual(rolled.outcome, 'retained', 'no retention while the clock is behind');
  assert.equal(st.lab.clock.suspect, true);
  assert.equal(st.lab.clock.suspectUntil, T0 + 2000, 'the guard remembers the last time it trusted');
  assert.ok(clockStatus(st).note.includes('paused'), 'and can explain itself');
  const blocked = stageAvailable(st, 'rh-dots', 'recall', back + 2 * DAY);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.blocked, 'clock', 'a fake future inside the rolled-back window is still refused');
  assert.equal(blocked.playableAsPractice, true, 'but the rung remains playable as practice');
  assert.ok(totalXp(st) >= earned, 'nothing earned was lost');

  // the clock is corrected: a real later day now counts
  const later = T0 + 2 * DAY;
  assert.equal(stageAvailable(st, 'rh-dots', 'recall', later).ok, true, 'once past the trusted high-water mark, retention reopens');
  const good = run(st, 'rh-dots', 'recall', { now: later });
  assert.equal(good.outcome, 'retained', 'and a legitimate later recall counts again');
  assert.equal(st.lab.clock.suspect, false, 'suspicion clears');
  assert.equal(st.lab.clock.rollbacks, 1, 'the rollback is remembered as history, not as a punishment');
  assert.equal(rungEarned(st, 'rh-dots', 'recall'), true);
  assert.equal(clockStatus(st).note, null);
  ok('a rolled-back clock defers retention and recovers: refused while behind, legitimate again once caught up');
}
{
  // ☠️ A FAILED INDEPENDENT ATTEMPT MUST STAY FINISHABLE, honestly, as an
  // independent pass rather than as anything grander.
  const st = {};
  run(st, 'rh-eighths', 'worked', { now: T0 });
  run(st, 'rh-eighths', 'guided', { now: T0 + 1000 });
  // a genuinely bad attempt
  const bad = startCard(st, 'rh-eighths', { now: T0 + 2000, stage: 'independent' });
  play(bad, perfectEvents(bad.ex).map((e) => ({ ...e, at: e.at + (e.kind === 'on' ? 600 : 900) })));
  const failed = recordLabResult(st, bad.finish({ now: T0 + 2000 }), { now: T0 + 2000 });
  assert.equal(failed.outcome, 'not-yet');
  assert.equal(rungEarned(st, 'rh-eighths', 'independent'), false);
  // practice with help, which must not qualify
  const helped = run(st, 'rh-eighths', 'independent', { now: T0 + 3000, assisted: true });
  assert.equal(helped.outcome, 'practice');
  assert.equal(rungEarned(st, 'rh-eighths', 'independent'), false, 'help never qualifies the independent rung');
  // then a clean one, same exercise: this is an honest independent pass
  const clean = run(st, 'rh-eighths', 'independent', { now: T0 + 4000 });
  assert.equal(clean.outcome, 'independent', 'the same exercise played clean is an independent pass');
  assert.equal(rungEarned(st, 'rh-eighths', 'independent'), true);
  assert.equal(labProgress(st, 'rh-eighths').attempts >= 4, true, 'every attempt is still on the record');
  assert.equal(nextStageKind(st, 'rh-eighths', T0 + 5000), 'transfer', 'and the card moves on');

  // a generated-variant rung cannot run out of material and strand the learner
  const st2 = {};
  st2.lab = { v: LAB_VERSION, cards: { 'nt-position': { evidence: [], selfChecks: [], stages: {}, seenContent: [], attempts: 0 } }, skills: {}, days: {}, clock: { lastNow: 0 }, route: {} };
  const taken = st2.lab.cards['nt-position'].seenContent;
  for (let i = 0; i < 40; i++) {          // exhaust every fresh position
    const v = positionVariant('position', 'seed' + i, taken);
    if (!v) break;
    taken.push(v.contentId);
  }
  const stranded = startCard(st2, 'nt-position', { now: T0, stage: 'independent' });
  assert.ok(stranded.ex, 'the rung still has an exercise when every position has been used');
  assert.equal(stranded.repeatedContent, true, 'and it says the material has come round again');
  assert.match(stranded.state().repeatedNote, /counts as an independent pass/);
  ok('a failed independent rung stays honestly finishable, and a generated rung never runs out of material');
}
{
  // ☠️ AN UNSUPPORTED MEASUREMENT MUST NOT BE A DEAD END. The card progresses
  // on honest self reports, which are visible, never competence, and never
  // stop the learner moving through the ladder.
  const st = {};
  const caps = { velocity: true, noteOff: true, pedal: false };
  const step = (stage, now) => {
    const s = startCard(st, 'ex-pedal', { now, stage, capabilities: caps });
    if (s.input === 'listen') return recordLabResult(st, s.finish({ now }), { now });
    assert.equal(s.input, 'self-check', `${stage} degrades to a listening check`);
    assert.equal(s.support.ok, false);
    assert.ok(s.state().support.why, 'and says what is missing');
    // ☠️ NO OPTIONAL CHAINING PAST A MISSING QUESTION. Every degraded rung
    // must ASK something, and only one of its own options is an answer.
    const q = s.state().selfCheck;
    assert.ok(q && q.prompt && q.options.length >= 2, `${stage} asks a real question`);
    assert.equal(s.answer('not-an-option').recorded, false, 'an invalid answer is refused');
    assert.equal(s.answer('not-an-option').invalid, true);
    s.answer(q.options[0].id);
    return recordLabResult(st, s.finish({ now }), { now });
  };
  assert.equal(step('worked', T0).outcome, 'introduced');
  assert.equal(nextStageKind(st, 'ex-pedal', T0 + 1000), 'guided');
  assert.equal(step('guided', T0 + 1000).outcome, 'self-report');
  assert.equal(nextStageKind(st, 'ex-pedal', T0 + 2000), 'independent', 'a self report moves the card on');
  assert.equal(step('independent', T0 + 2000).outcome, 'self-report');
  const p = labProgress(st, 'ex-pedal');
  assert.equal(p.rungs.find((r) => r.kind === 'independent').done, false, 'but it never marks the rung earned');
  assert.equal(p.rungs.find((r) => r.kind === 'independent').selfReported, true, 'it shows as self-reported');
  assert.equal(p.competence, null, 'and the card claims no competence at all');
  assert.equal(labSummary(st).independent, 0);
  assert.equal(labSummary(st).selfReported, 1, 'the summary counts it honestly, in its own column');
  assert.equal(stageAvailable(st, 'ex-pedal', 'recall', T0 + 3000).ok, false, 'recall still waits a day');
  assert.equal(stageAvailable(st, 'ex-pedal', 'recall', T0 + DAY + 3600000).ok, true, 'and then opens');
  assert.equal(nextStageKind(st, 'ex-pedal', T0 + DAY + 3600000), 'recall');
  assert.equal(step('recall', T0 + DAY + 3600000).outcome, 'self-report');
  assert.equal(nextStageKind(st, 'ex-pedal', T0 + DAY + 7200000), 'transfer', 'the ladder keeps moving to the end');
  assert.equal(st.lab.cards['ex-pedal'].selfChecks.length, 3, 'and every answer is kept as the learner\'s own verdict');
  // with a pedal connected, the same card measures for real
  const s = startCard({}, 'ex-pedal', { now: T0, stage: 'independent', capabilities: { velocity: true, noteOff: true, pedal: true } });
  assert.equal(s.input, 'play-grid');
  assert.equal(s.degraded, false);
  ok('an unsupported card progresses on self reports: visible, never competence, never a dead end');
}
{
  // ☠️ AND EVERY ALTERNATE MUST BE PLAYABLE TOO. The transfer pool is only
  // honest if the material in it can actually be performed and scored; an
  // alternate nobody can pass would be a dead end with extra steps.
  let alts = 0;
  for (const card of LAB_CARDS) for (const stage of card.stages) {
    for (const ex of stage.alts ?? []) {
      alts++;
      const dots = (ex.marks ?? []).filter((m) => m.kind === 'articulation' && m.value === 'staccato');
      const events = [];
      for (const t of ex.targets) {
        const on = t.at * ex.msPerBeat;
        const staccato = dots.some((m) => t.at >= m.from && t.at <= m.to);
        const hold = staccato ? Math.min(200, t.q * ex.msPerBeat * 0.3) : t.q * ex.msPerBeat - 30;
        for (const midi of t.midis) events.push({ kind: 'on', midi, at: on, velocity: 70 }, { kind: 'off', midi, at: on + hold });
      }
      events.sort((a, b) => a.at - b.at);
      const twoHands = Object.keys(ex.voices).length > 1;
      const r = twoHands ? scoreVertical(ex, events, {}) : scoreRhythm(ex, events, { checkDurations: !dots.length });
      assert.equal(r.passed, true, `${card.id}/${stage.kind} alternate ${ex.id}: a correct performance must pass. ${JSON.stringify((r.faults ?? []).map((f) => f.text))}`);
      // the material shown is the material scored
      const shown = ex.render.staves.flatMap((s) => s.bars.flatMap((b) => b.cells.filter((c) => !c.rest && c.tie !== 'stop' && c.tie !== 'both').length));
      assert.equal(shown.reduce((a, b) => a + b, 0), ex.targets.length, `${ex.id} scores exactly the note heads it draws`);
    }
  }
  assert.equal(alts, 50, 'fifty authored alternates back the transfer pools');
  ok(`${alts} alternate transfer exercises, every one playable and scoring exactly the note heads it draws`);
}

// --- 11. cold-review findings, fixed and pinned ---------------------------
{
  // ☠️ COLD REVIEW FINDING 1, AND THE RULING ON IT. One fumble or one hint on
  // a transfer rung used to bar that rung for ever, because exposure is banked
  // on every attempt. Exposure stays honest; the way back is GENUINELY
  // DIFFERENT material, not a pretence that known music is fresh.
  for (const spoil of ['fail', 'hint']) {
    const st = {};
    run(st, 'rh-values', 'worked', { now: T0 });
    run(st, 'rh-values', 'guided', { now: T0 + 1000 });
    run(st, 'rh-values', 'independent', { now: T0 + 2000 });

    const first = startCard(st, 'rh-values', { now: T0 + DAY, stage: 'transfer' });
    const firstId = first.contentId;
    if (spoil === 'hint') { first.hint(); play(first, perfectEvents(first.ex)); }
    else play(first, perfectEvents(first.ex).map((e) => ({ ...e, at: e.at + (e.kind === 'on' ? 700 : 0) })));
    const spoiled = recordLabResult(st, first.finish({ now: T0 + DAY }), { now: T0 + DAY });
    assert.notEqual(spoiled.outcome, 'transferred', `a ${spoil} does not earn transfer`);
    assert.equal(rungEarned(st, 'rh-values', 'transfer'), false);
    assert.ok(st.lab.cards['rh-values'].seenContent.includes(firstId), 'and the exposure is banked honestly, pass or fail');

    // the retry deals different material, and it can be earned
    const second = startCard(st, 'rh-values', { now: T0 + 2 * DAY, stage: 'transfer' });
    assert.notEqual(second.contentId, firstId, 'the retry is not the music that was just spoiled');
    assert.equal(second.usingAlt, true);
    assert.equal(second.poolExhausted, false);
    play(second, perfectEvents(second.ex));
    const earned = recordLabResult(st, second.finish({ now: T0 + 2 * DAY }), { now: T0 + 2 * DAY });
    assert.equal(earned.outcome, 'transferred', `after a ${spoil}, the transfer rung is still winnable on new material`);
    assert.equal(rungEarned(st, 'rh-values', 'transfer'), true);
    assert.equal(earned.xp.length, 1, 'and it pays, because it was earned');
  }
  ok('a failed or hinted transfer is recoverable on genuinely new material, with exposure still banked honestly');
}
{
  // every card must be recoverable, and no card may point at a rung it can
  // never complete
  const bad = [];
  for (const card of LAB_CARDS) {
    const st = {};
    const stage = card.stages.find((s) => s.kind === 'transfer');
    const pool = transferPool(st, card.id);
    if (!pool) { bad.push(`${card.id}: no transfer pool`); continue; }
    if (pool.kind === 'authored' && pool.size < 3) bad.push(`${card.id}: only ${pool.size} piece(s) of transfer material`);
    if (pool.kind === 'self-assessed' && stage.input !== 'self-check') bad.push(`${card.id}: self-assessed pool on a scored rung`);
    // a fresh card always has something to do, and the last rung is reachable
    assert.ok(nextStageKind(st, card.id, T0), `${card.id} offers a first rung`);
    const s = startCard(st, card.id, { now: T0, stage: 'transfer', capabilities: { velocity: true, noteOff: true, pedal: true }, cal: { zones: [0, 1, 2, 3].map(() => ({ soft: 40, medium: 64, strong: 96 })) }, resolvedApplied: resolveAppliedCards(SONGS) });
    if (!s) bad.push(`${card.id}: transfer rung will not open`);
    else if (s.input !== 'play-passage' && !s.ex) bad.push(`${card.id}: transfer rung has no material`);
  }
  assert.deepEqual(bad, [], 'every card is recoverable and its transfer rung is honest');
  // the three subjective transfer rungs are marked as such, not left looking broken
  const subjective = LAB_CARDS.filter((c) => c.stages.find((s) => s.kind === 'transfer').input === 'self-check');
  assert.equal(subjective.length, 3);
  for (const c of subjective) {
    assert.equal(transferEarnable({}, c.id), false, `${c.id} says its transfer cannot be "earned"`);
    assert.match(transferPool({}, c.id).note, /listening check by design/);
    assert.equal(nextStageKind({ lab: { cards: { [c.id]: { stages: { worked: { at: 1 }, guided: { selfReportedAt: 1 }, independent: { selfReportedAt: 1 }, recall: { selfReportedAt: 1 } } } } } }, c.id, T0), 'transfer',
      'but it is still offered, so the last rung is reachable');
  }
  ok(`${LAB_CARDS.length} cards: every transfer rung carries three pieces of material or is honestly self-assessed`);
}
{
  // ☠️ AN APPLIED CARD'S SECOND TRANSFER IS AN AUTHORED STUDY PIECE, NOT A
  // GUESS AT ANOTHER CATALOGUE SONG'S HARMONY.
  const resolvedApplied = resolveAppliedCards(SONGS);
  const st = {};
  for (const stage of ['worked', 'guided', 'independent']) run(st, 'ap-c-ode-to-joy', stage, { now: T0, resolvedApplied });
  const first = startCard(st, 'ap-c-ode-to-joy', { now: T0 + DAY, stage: 'transfer', resolvedApplied });
  assert.equal(first.input, 'play-passage');
  assert.equal(first.state().passage.songId, 'ode-to-joy', 'the first go is the real passage');
  first.recordPassage({ acc: 91, wrong: 0, assisted: false });
  assert.equal(recordLabResult(st, first.finish({ now: T0 + DAY }), { now: T0 + DAY }).outcome, 'transferred');

  const second = startCard(st, 'ap-c-ode-to-joy', { now: T0 + 2 * DAY, stage: 'transfer', resolvedApplied });
  assert.equal(second.input, 'play-rhythm', 'the passage has been met, so the rung deals an authored study transfer');
  assert.equal(second.usingAlt, true);
  assert.equal(second.ex.song.labStudy, true, 'and it is an original exercise');
  assert.match(second.ex.song.composer, /original/i);
  assert.equal(second.state().passage, null, 'no second catalogue song is claimed');
  play(second, perfectEvents(second.ex));
  assert.equal(recordLabResult(st, second.finish({ now: T0 + 2 * DAY }), { now: T0 + 2 * DAY }).outcome, 'transferred');
  ok('an applied card falls forward to authored study transfers, never to guessed harmony on another song');
}
{
  // ☠️ FINDING 2. A play-together rung is UNTIMED, so no gap between the two
  // chords may be required. Every one of these is a correct performance.
  const chords = cardById('ap-c-ode-to-joy').stages.find((s) => s.kind === 'recall').chords;
  for (const gap of [2000, 1600, 1400, 900, 600, 250]) {
    const ev = [];
    chords.forEach((c, i) => { for (const midi of c.midis) ev.push({ kind: 'on', midi, at: i * gap }, { kind: 'off', midi, at: i * gap + 200 }); });
    const r = scoreChords(chords, ev.sort((a, b) => a.at - b.at));
    assert.equal(r.passed, true, `two inversions ${gap}ms apart is a correct performance`);
    assert.equal(r.faults.length, 0);
  }
  // and the real mistakes still fail
  const at = (list, t) => list.flatMap((midi) => [{ kind: 'on', midi, at: t }, { kind: 'off', midi, at: t + 150 }]);
  assert.equal(scoreChords(chords, [...at([...chords[0].midis, 66], 0), ...at(chords[1].midis, 700)].sort((a, b) => a.at - b.at)).passed, false, 'a stray tone inside the chord fails');
  assert.equal(scoreChords(chords, [...at(chords[0].midis.slice(0, 2), 0), ...at(chords[1].midis, 700)].sort((a, b) => a.at - b.at)).passed, false, 'a missing tone fails');
  assert.equal(scoreChords(chords, [...at(chords[0].midis, 0), ...at([61], 350), ...at(chords[1].midis, 700)].sort((a, b) => a.at - b.at)).passed, false, 'a wrong key between the chords fails');
  assert.equal(scoreChords(chords, at(chords[0].midis, 0)).passed, false, 'a missing chord fails');
  ok('chords are grouped until complete: any natural pace passes, strays and missing tones still fail');
}
{
  // ☠️ FINDING 6. Two triplet groups in one bar are two brackets, not one.
  const ex = cardById('rh-triplets').stages.find((s) => s.kind === 'independent').ex;
  const tuplets = ex.voices.R.cells.filter((c) => c.tuplet);
  assert.equal(tuplets.length, 6);
  const ids = tuplets.map((c) => c.tuplet.id);
  assert.equal(new Set(ids).size, 2, 'six triplet cells in one bar form TWO groups');
  assert.deepEqual(ids, ['0:0', '0:0', '0:0', '0:1', '0:1', '0:1'], 'and the ids are monotonic within the bar');
  for (const id of new Set(ids)) assert.equal(ids.filter((x) => x === id).length, 3, 'every group holds all three of its notes');
  // every tuplet group anywhere in the curriculum is complete and contiguous
  for (const card of LAB_CARDS) for (const stage of card.stages) for (const e of [stage.ex, ...(stage.alts ?? [])]) {
    if (!e) continue;
    for (const voice of Object.values(e.voices)) {
      const groups = new Map();
      voice.cells.forEach((c, i) => { if (c.tuplet) (groups.get(c.tuplet.id) ?? groups.set(c.tuplet.id, []).get(c.tuplet.id)).push(i); });
      for (const [id, idx] of groups) {
        assert.equal(idx.length, 3, `${e.id} group ${id} holds ${idx.length} notes`);
        assert.equal(idx[2] - idx[0], 2, `${e.id} group ${id} is contiguous`);
      }
    }
  }
  assert.throws(() => parseR('t8 t8 q q q', [4, 4]), /needs all of its notes/, 'a broken tuplet group cannot be authored');
  ok('tuplet groups are monotonic, complete and contiguous; a broken group throws at authoring time');
}
{
  // ☠️ FINDING 8. A count row must exist where it is promised, and have a cell
  // for every note the page asks for.
  const missing = [];
  for (const card of LAB_CARDS) for (const stage of card.stages) {
    if (stage.help !== 'countRow') continue;
    const ex = stage.ex;
    assert.ok(ex.countRow?.length, `${card.id}/${stage.kind} promises a count row and must have one`);
    const onsets = [...new Set(ex.targets.map((t) => +(t.at % ex.barLength).toFixed(6)))];
    for (const pos of onsets) {
      const cell = ex.countRow.find((c) => Math.abs(c.pos - pos) < 1e-6);
      if (!cell) missing.push(`${card.id}/${stage.kind}: no cell at ${pos}`);
      else if (!cell.active) missing.push(`${card.id}/${stage.kind}: cell at ${pos} is not lit`);
    }
  }
  assert.deepEqual(missing, [], 'every promised count row covers every authored onset');
  const six = cardById('rh-six-eight').stages.find((s) => s.kind === 'guided').ex;
  assert.equal(six.countRow.length, 6, '6/8 counts its six eighths');
  assert.deepEqual(six.countRow.map((c) => c.label), ['1', '2', '3', '4', '5', '6']);
  assert.deepEqual(six.countRow.filter((c) => c.beat).map((c) => c.pos), [0, 1.5], 'with the weight on the two dotted-quarter beats');
  const tri = cardById('rh-triplets').stages.find((s) => s.kind === 'guided').ex;
  assert.equal(tri.countRow.length, 12, 'a triplet bar counts in thirds');
  assert.deepEqual(tri.countRow.slice(0, 3).map((c) => c.label), ['1', 'trip', 'let']);
  assert.equal(tri.countRow.filter((c) => c.active).length, tri.targets.filter((t) => t.at < tri.barLength).length, 'and lights exactly the notes in the bar');
  ok('count rows exist where promised and align with the authored onsets, in 6/8 and in triplets');
}
{
  // ☠️ FINDING 7. A rung cannot pay independent credit for a measurement it
  // never made, and it must stay finishable honestly.
  const st = {};
  const noVel = { velocity: false, noteOff: true, pedal: true };
  assert.equal(stageRequires(cardById('nt-symbols').stages.find((s) => s.kind === 'independent')), 'velocity',
    'the "loud bar, soft bar" rung declares that it needs velocity');
  const s = startCard(st, 'nt-symbols', { now: T0, stage: 'independent', capabilities: noVel });
  assert.equal(s.degraded, true, 'so with no velocity it degrades');
  assert.equal(s.input, 'self-check');
  const q = s.state().selfCheck;
  assert.ok(q.prompt.includes('HARD') || /hard/i.test(q.prompt), 'and asks about the thing it could not measure');
  s.answer(q.options[0].id);
  const rec = recordLabResult(st, s.finish({ now: T0 }), { now: T0 });
  assert.equal(rec.outcome, 'self-report');
  assert.equal(rungEarned(st, 'nt-symbols', 'independent'), false, 'no independent credit for an unmeasured rung');
  assert.equal(labProgress(st, 'nt-symbols').competence, null);

  // and if the plan somehow runs unsupported inside a scored rung, the result
  // is downgraded with the reason, not paid in full
  const st2 = {};
  const forced = recordLabResult(st2, { cardId: 'nt-symbols', stage: 'independent', input: 'play-rhythm', contentId: 'z',
    outcomeClaim: 'independent', passed: true, assisted: false, at: T0, unmeasured: [{ what: 'dynamics' }] }, { now: T0 });
  assert.equal(forced.outcome, 'practice', 'an unmeasured dimension downgrades the claim');
  assert.ok(forced.refused.some((r) => /could not be measured/i.test(r)));
  assert.equal(forced.xp.length, 0, 'and pays nothing');
  assert.equal(rungEarned(st2, 'nt-symbols', 'independent'), false);
  ok('a rung that could not measure its own subject earns practice, not independence, and stays finishable');
}
{
  // ☠️ FINDING 3, SWEPT. Every rung that can degrade asks a real question, and
  // only its own options are answers.
  const caps = { velocity: false, noteOff: false, pedal: false };
  let degraded = 0;
  for (const card of LAB_CARDS) for (let i = 0; i < card.stages.length; i++) {
    const stage = card.stages[i];
    const s = startCard({}, card.id, { now: T0, stage: stage.kind, stageIndex: card.stages.filter((x, j) => x.kind === stage.kind && j < i).length, capabilities: caps });
    if (s.input !== 'self-check') continue;
    degraded++;
    const q = s.state().selfCheck;
    assert.ok(q, `${card.id}/${stage.kind} degrades and must ask something`);
    assert.ok(q.prompt.length > 30, `${card.id}/${stage.kind} asks a real question`);
    assert.ok(q.options.length >= 2, `${card.id}/${stage.kind} offers real answers`);
    assert.equal(s.answer('nope').recorded, false, `${card.id}/${stage.kind} refuses an answer it never offered`);
    assert.equal(s.finish({ now: T0 }).passed, false, `${card.id}/${stage.kind} is not satisfied by silence`);
  }
  assert.ok(degraded > 20, `a device with no velocity, releases or pedal degrades ${degraded} rungs, and every one asks something`);
  assert.equal(fallbackSelfCheck(cardById('ex-pedal'), { kind: 'independent' }, 'pedal').options.length, 3);
  ok(`${degraded} degradable rungs across the curriculum, every one with a real question and no free pass`);
}
{
  // ☠️ FINDING 4. A listening verdict is not a performed practice block.
  const st = {};
  const caps = { velocity: true, noteOff: true, pedal: false };
  for (const stage of ['guided', 'independent']) {
    const s = startCard(st, 'ex-pedal', { now: T0, stage, capabilities: caps });
    s.answer(s.state().selfCheck.options[0].id);
    recordLabResult(st, s.finish({ now: T0 }), { now: T0 });
  }
  const blocks = st.blocks ?? [];
  assert.equal(blocks.length, 2, 'the verdicts are recorded');
  assert.equal(blocks.filter(isPerformedBlock).length, 0, 'but none of them counts as performed practice');
  assert.equal(blockCount(st, 0, 'practice'), 0, 'so the practice line does not move');
  assert.equal(blockCount(st, 0, 'listening'), 2, 'and the listening ledger does');
  ok('self-reported listening banks listening credit, never performed practice blocks');
}
{
  // content identity is the MUSIC. Same notation at another tempo, or under
  // another exercise id, is the same material; different marks are not.
  const a = exercise({ id: 'one', bpm: 60, pattern: 'q q h', notes: ['C4', 'D4', 'E4'] });
  const b = exercise({ id: 'two-different-id', bpm: 132, pattern: 'q q h', notes: ['C4', 'D4', 'E4'] });
  assert.equal(a.contentId, b.contentId, 'tempo and id are labels, not music');
  const marked = exercise({ id: 'three', bpm: 60, pattern: 'q q h', notes: ['C4', 'D4', 'E4'], marks: [{ kind: 'articulation', value: 'staccato', from: 0, to: 2 }] });
  assert.notEqual(a.contentId, marked.contentId, 'what is printed on the page is part of the material');
  const spelled = exercise({ id: 'four', key: 'F', bpm: 60, pattern: 'q q h', notes: ['C4', 'D4', 'E4'] });
  assert.equal(a.contentId, spelled.contentId, 'the same notes spelled the same way are the same material');
  const flat = exercise({ id: 'five', bpm: 60, pattern: 'q q h', notes: ['C4', 'D4', 'Fb4'] });
  assert.notEqual(a.contentId, flat.contentId, 'a different spelling is a different page');
  // across the whole curriculum, the only repeated material is a card showing
  // you something and then asking you to play that same thing
  const seen = new Map(); const dupes = [];
  for (const card of LAB_CARDS) for (const stage of card.stages) for (const ex of [stage.ex, ...(stage.alts ?? [])]) {
    if (!ex) continue;
    const key = ex.contentId;
    if (seen.has(key)) dupes.push([seen.get(key), `${card.id}/${stage.kind}`]);
    else seen.set(key, `${card.id}/${stage.kind}`);
  }
  for (const [first, second] of dupes) {
    const [c1, k1] = first.split('/'), [c2, k2] = second.split('/');
    assert.equal(c1, c2, `${first} and ${second} are different cards sharing material`);
    assert.deepEqual([k1, k2], ['worked', 'guided'], `${first} and ${second} are not a demonstrate-then-play pair`);
  }
  ok(`content identity is the music itself: ${dupes.length} repeats, all of them a card demonstrating what it then asks for`);
}
{
  // ☠️ FINDING 5. `render` is the ONLY notation authority. The song object
  // carries MIDI for the engine; asking an engraver to re-derive spelling from
  // it prints A# where the page says Bb, which is a different staff line.
  let heads = 0, diverge = 0;
  for (const card of LAB_CARDS) for (const stage of card.stages) for (const ex of [stage.ex, ...(stage.alts ?? [])]) {
    if (!ex) continue;
    assert.equal(ex.song.labNotation, 'render', `${ex.id} names render as its notation authority`);
    for (const stave of ex.render.staves) for (const bar of stave.bars) for (const cell of bar.cells) {
      if (cell.rest) continue;
      cell.keys.forEach((key, i) => {
        heads++;
        // the render carries the AUTHORED spelling, letter for letter
        const token = ex.targets.find((t) => t.at === cell.at && t.hand === stave.hand)?.written?.[i];
        if (token) assert.equal(key[0], token[0].toLowerCase(), `${ex.id} draws ${token} as ${key}`);
        const midi = ex.targets.find((t) => t.at === cell.at && t.hand === stave.hand)?.midis?.[i];
        if (midi != null && spellPitch(midi, ex.song.key ?? 'C')[0] !== key[0]) diverge++;
      });
    }
  }
  assert.ok(heads > 400, `${heads} note heads checked`);
  assert.ok(diverge > 0, 'and the divergence from a MIDI-derived spelling is real, which is why render is the authority');
  ok(`${heads} note heads: render carries the authored spelling, and ${diverge} of them would be drawn on the wrong line from MIDI alone`);
}
{
  // the route's reading line must not overstate the case
  const reading = ROUTE_DEFAULT.find((s) => s.id === 'reading');
  assert.ok(!/only improves/i.test(reading.why), 'reading does not ONLY improve on unmemorised music');
  assert.match(reading.why, /familiar/i);
  assert.match(reading.why, /new material|unfamiliar/i);
  ok('the daily route describes reading accurately: familiar music helps, new material tests independence');
}
// --- 12. the real guided-passage flow, driven by the real Engine ----------
// ☠️ THE BUG THIS EXISTS FOR. Every authored passage defaults to help ON. In
// wait mode the Engine holds the music until the right keys arrive, so every
// accepted press classifies as `good` and a FLAWLESS run scores exactly 80.
// The rung wanted 85, so a learner who played every note of the passage
// correctly was told "not yet" (root, observed in the real UI: 97 of 97 notes,
// 0 wrong, 0 missed, refused). Graded on the notes instead, it passes, and it
// is worth practice credit, never transfer.
{
  // Drive the real Engine over a real catalogue passage, the way the practice
  // surface does: tick until it freezes, then play the notes it is waiting for.
  const playPassage = (song, p, { skip = 0, wrongNotes = 0, silent = false } = {}) => {
    const engine = new Engine(song, { hand: p.hand, waitMode: p.wait, tempo: 1, loop: { start: p.startBeat, end: p.endBeat }, repeat: false });
    const required = engine.groups.reduce((a, g) => a + g.notes.length, 0);
    let guard = 0, skipped = 0, played = 0;
    while (!engine.finished && guard++ < 20000) {
      const g = engine.currentGroup();
      engine.tick(25);
      if (!g || !engine.waiting) continue;
      if (skipped < skip) { skipped++; engine.nextGroupIdx++; engine.waiting = false; continue; }  // walk past a chord
      if (silent) break;
      if (wrongNotes > 0 && played === 0) { engine.noteOn(g.notes[0].m === 60 ? 61 : 60, 64); }
      for (const n of g.notes) { engine.noteOn(n.m, 64); played++; }
    }
    return { engine, required, played: engine.playLog.length,
      payload: { acc: engine.accuracy(), wrong: engine.stats.wrong, wait: p.wait, hand: p.hand, tempo: 100,
        section: p.section, songId: p.songId, startBeat: p.startBeat, endBeat: p.endBeat,
        stats: { ...engine.stats }, required, played: engine.playLog.length, missed: engine.stats.missed } };
  };

  const resolvedApplied = resolveAppliedCards(SONGS);
  const withPassage = resolvedApplied.filter((r) => r.passage);
  assert.equal(withPassage.length, 4, 'four authored catalogue passages');
  let checked = 0;
  for (const r of withPassage) {
    const p = r.passage;
    assert.equal(p.wait, true, `${p.songId} defaults to help on, which is why this matters`);
    const song = SONGS.find((s) => s.id === p.songId);
    const attempt = playPassage(song, p);

    // the exact shape of the bug, still true of the raw numbers
    assert.equal(attempt.payload.stats.wrong, 0, `${p.songId}: no wrong notes`);
    assert.equal(attempt.payload.stats.missed, 0, `${p.songId}: nothing missed`);
    assert.equal(attempt.payload.played, attempt.required, `${p.songId}: every one of the ${attempt.required} required notes played`);
    assert.equal(attempt.payload.acc, 80, `${p.songId}: a flawless guided run still scores 80, which is the wait-mode ceiling`);

    // and the rung now grades it on the notes
    const st = {};
    for (const stage of ['worked', 'guided', 'independent']) run(st, r.cardId, stage, { now: T0, resolvedApplied });
    const s = startCard(st, r.cardId, { now: T0 + DAY, stage: 'transfer', resolvedApplied });
    assert.equal(s.input, 'play-passage');
    s.recordPassage(attempt.payload);
    const res = s.finish({ now: T0 + DAY });
    assert.equal(res.passed, true, `${p.songId}: a correct guided run passes`);
    assert.equal(res.report.grade.basis, 'pitch-evidence', 'graded on the notes, not the clock');
    assert.equal(res.assisted, true, 'the help is recorded');
    assert.equal(res.outcomeClaim, 'practice');
    const rec = recordLabResult(st, res, { now: T0 + DAY });
    assert.equal(rec.outcome, 'practice', `${p.songId}: a guided pass is practice credit`);
    assert.equal(rungEarned(st, r.cardId, 'transfer'), false, 'and never a transfer');
    assert.equal(rec.xp.length, 0, 'and pays no transfer reward');
    checked++;
  }
  assert.equal(checked, 4);

  // the same passage with the help OFF is still graded at 85, unchanged, and
  // that is how the rung is actually earned
  const r = withPassage[1];
  const st = {};
  for (const stage of ['worked', 'guided', 'independent']) run(st, r.cardId, stage, { now: T0, resolvedApplied });
  const open = startCard(st, r.cardId, { now: T0 + DAY, stage: 'transfer', resolvedApplied });
  open.recordPassage({ ...r.passage, wait: false, acc: 93, wrong: 0, tempo: 100 });
  const off = open.finish({ now: T0 + DAY });
  assert.equal(off.report.grade.basis, 'accuracy', 'help off is still graded on accuracy');
  assert.equal(off.passed, true);
  assert.equal(recordLabResult(st, off, { now: T0 + DAY }).outcome, 'transferred', 'and that is what earns the transfer');
  ok('a flawless guided run of all four catalogue passages now passes, on the notes, as practice and never as transfer');
}
{
  // the ways a guided passage must still FAIL, driven by the same real Engine
  const p = resolveAppliedCards(SONGS).find((r) => r.cardId === 'ap-c-ode-to-joy').passage;
  const song = SONGS.find((s) => s.id === p.songId);
  const base = () => {
    const engine = new Engine(song, { hand: p.hand, waitMode: true, tempo: 1, loop: { start: p.startBeat, end: p.endBeat }, repeat: false });
    return { engine, required: engine.groups.reduce((a, g) => a + g.notes.length, 0) };
  };
  const grade = (payload) => gradePassage(payload, { authored: p });

  // skipped notes: the learner walked out part way
  {
    const { engine, required } = base();
    let guard = 0, done = 0;
    while (!engine.finished && guard++ < 20000) {
      const g = engine.currentGroup();
      engine.tick(25);
      if (!g || !engine.waiting) continue;
      if (done >= Math.floor(required / 2)) break;              // stop half way
      for (const n of g.notes) { engine.noteOn(n.m, 64); done++; }
    }
    const res = grade({ acc: engine.accuracy(), wrong: engine.stats.wrong, wait: true, stats: { ...engine.stats }, required, played: engine.playLog.length });
    assert.equal(res.passed, false, 'half a passage is not a pass');
    assert.ok(res.faults.some((f) => f.kind === 'incomplete'));
  }
  // wrong notes
  {
    const { engine, required } = base();
    let guard = 0, struck = false;
    while (!engine.finished && guard++ < 20000) {
      const g = engine.currentGroup();
      engine.tick(25);
      if (!g || !engine.waiting) continue;
      if (!struck) { engine.noteOn(g.notes[0].m + 1, 64); struck = true; }   // a semitone out
      for (const n of g.notes) engine.noteOn(n.m, 64);
    }
    assert.ok(engine.stats.wrong > 0, 'the engine saw the wrong note');
    const res = grade({ acc: engine.accuracy(), wrong: engine.stats.wrong, wait: true, stats: { ...engine.stats }, required, played: engine.playLog.length });
    assert.equal(res.passed, false, 'wrong notes fail a guided run');
    assert.ok(res.faults.some((f) => f.kind === 'wrong-notes'));
  }
  // nothing played at all
  {
    const { engine, required } = base();
    engine.tick(25);
    const res = grade({ acc: engine.accuracy(), wrong: 0, wait: true, stats: { ...engine.stats }, required, played: 0 });
    assert.equal(res.passed, false, 'an empty run is not a pass');
    assert.ok(res.faults.some((f) => f.kind === 'incomplete' || f.kind === 'empty'));
  }
  // missed notes reported by a timed engine
  assert.equal(grade({ acc: 80, wrong: 0, wait: true, stats: { perfect: 0, good: 90, late: 0, wrong: 0, missed: 7 }, required: 97, played: 90 }).passed, false, 'missed notes fail');
  // ☠️ AND A PAYLOAD WITH NO PITCH EVIDENCE CANNOT FABRICATE A HELPED PASS.
  const legacy = grade({ acc: 80, wrong: 0, wait: true });
  assert.equal(legacy.passed, false, 'the old payload shape cannot pass a guided run');
  assert.ok(legacy.faults.some((f) => f.kind === 'no-pitch-evidence'));
  assert.deepEqual(legacy.needs, ['stats', 'required', 'played'], 'and it names the fields that would settle it');
  assert.equal(grade({ acc: 100, wrong: 0, wait: true, required: 97 }).passed, false, 'a partial payload cannot either');
  // a result openly from another passage is refused
  const elsewhere = grade({ acc: 80, wrong: 0, wait: true, stats: { perfect: 0, good: 97, late: 0, wrong: 0, missed: 0 }, required: 97, played: 97, songId: 'happy-birthday', section: 'Lines 1-2' });
  assert.equal(elsewhere.passed, false, 'a result from a different passage is refused');
  assert.ok(elsewhere.faults.some((f) => f.kind === 'wrong-passage'));
  assert.equal(elsewhere.identity.matches, false);
  // the honest one carries its identity through
  const good = grade({ acc: 80, wrong: 0, wait: true, stats: { perfect: 0, good: 97, late: 0, wrong: 0, missed: 0 }, required: 97, played: 97, songId: p.songId, section: p.section, startBeat: p.startBeat, endBeat: p.endBeat });
  assert.equal(good.passed, true);
  assert.equal(good.identity.matches, true);
  assert.equal(good.ceiling, 'practice', 'a guided pass is capped at practice, whatever else was true');
  ok('a guided passage still fails on skipped, missed, empty and wrong notes, and cannot pass without pitch evidence');
}
{
  // helpers used in the feedback lines
  assert.equal(valueName(2), 'half note');
  assert.equal(valueName(1.5), 'dotted quarter');
  assert.equal(tokenFromMidi(70, 'F'), 'Bb4');
  assert.equal(tokenFromMidi(66, 'G'), 'F#4');
  const pairs = soundedNotes([{ kind: 'on', midi: 60, at: 0 }, { kind: 'on', midi: 60, at: 500 }, { kind: 'off', midi: 60, at: 800 }]);
  assert.equal(pairs.length, 2);
  assert.equal(pairs[0].offAt, 800, 'overlapping presses of one key close oldest-first');
  assert.equal(pairs[1].offAt, null);
  assert.equal(recoveryFor(null, []), null);
  assert.equal(nextStageKind({}, 'rh-pulse'), 'worked');
  ok('feedback helpers: value names, spellings, note pairing, recovery span');
}

console.log(`\n${n} learning-lab checks passed`);
