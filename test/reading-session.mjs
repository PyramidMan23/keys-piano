// Reading session gate (package 1, 2026-09-13).
// Every test here drives the REAL Engine and the REAL notation model. Nothing
// mirrors a function that only exists in this file: the point is to reproduce
// what a person's hands do, then check what the app would conclude from it.
//   node test/reading-session.mjs
import assert from 'node:assert/strict';
import { Engine } from '../js/engine.mjs';
import { notationModel, spellPitch } from '../js/notation.mjs';
import { competence } from '../js/teacher.mjs';
import { validateSong } from '../js/songs.mjs';
import { beatsPerBar } from '../js/meter.mjs';
import { makeExercise, exerciseFromVariant, exerciseKey, judgeSight, variantSpace,
  variantCount, keyForTranspose } from '../js/sight.mjs';
import { abandonPresentation, CONTAMINANTS, contentSpace, emptyReading, engravable, feedbackLines,
  gradeRead, migrateReading, nextExercise, poolSize, presentExercise, presentationValid,
  readAttempt, readingPlan, readingSummary, poolStatus, READS_KEPT,
  sessionPolicy } from '../js/reading-session.mjs';

let passes = 0;
const ok = (m) => { passes++; console.log('  ok  ' + m); };

// ---- the simulator: one pair of honest hands -------------------------------
// Wait mode: press every note of a group once the clock has frozen on it.
// Timed mode: tick exactly onto the group's beat, then press. Either way the
// engine does all the judging.
function playRead(exercise, { waitMode = true, hand = 'both', tempo = 1, stopAfterNotes = Infinity,
  wrongEvery = 0, calOffsetMs = 0 } = {}) {
  const engine = new Engine(exercise, { waitMode, hand, tempo, calOffsetMs });
  let played = 0, guard = 0;
  while (!engine.finished && guard++ < 50000) {
    const g = engine.currentGroup();
    if (!g) { engine.tick(20); continue; }
    if (waitMode && !engine.waiting) { engine.tick(20); continue; }
    if (!waitMode && engine.beat < g.beat - 1e-9) {
      engine.tick(Math.max(1, (g.beat - engine.beat) * engine.msPerBeat()));
      continue;
    }
    for (const n of g.notes) {
      if (played >= stopAfterNotes) return { engine, played };
      if (wrongEvery && played % wrongEvery === 0) engine.noteOn(wrongNote(g));
      engine.noteOn(n.m);
      engine.noteOff(n.m);
      played++;
    }
  }
  return { engine, played };
}
function wrongNote(group) {
  const taken = new Set(group.notes.map((n) => n.m));
  let m = group.notes[0].m + 1;
  while (taken.has(m)) m++;
  return m;
}

// ---- 1. the reported dead end, reproduced then fixed ------------------------
{
  for (const level of [1, 2]) {
    const ex = makeExercise(level, 4242);
    const { engine } = playRead(ex, { waitMode: true });
    assert.equal(engine.stats.wrong, 0, `level ${level}: no wrong notes`);
    assert.equal(engine.stats.missed, 0, `level ${level}: nothing missed`);
    assert.equal(engine.nextGroupIdx, engine.groups.length, `level ${level}: every group satisfied`);
    // THE BUG: wait mode freezes the clock, so every press is 'good' and the
    // weighted accuracy is pinned at exactly 80 for a flawless read.
    assert.equal(engine.accuracy(), 80, `level ${level}: a flawless guided read reads 80`);
    // and the old three-argument rule therefore refuses to advance it, twice.
    let legacy = { level, cleans: 0, flops: 0, done: 0 };
    legacy = judgeSight(legacy, 80, 0).next;
    legacy = judgeSight(legacy, 80, 0).next;
    assert.equal(legacy.level, level, `level ${level}: the old rule dead-ends a perfect guided read`);
  }
  ok('reproduced: correct wait-mode responses at levels 1 and 2 score exactly 80 and could never advance');
}

{
  // The fix: judged on what wait mode can measure. Two clean guided reads
  // advance the level, and Engine timing semantics were not touched to do it.
  let reading = emptyReading();
  const keys = [];
  for (let i = 0; i < 2; i++) {
    const plan = readingPlan(reading, { intent: 'practice' });
    assert.equal(plan.policy.waitMode, true, 'level 1 practice is guided');
    assert.equal(plan.policy.mode, 'guided');
    assert.equal(plan.novel, true, 'fresh content offered');
    keys.push(plan.contentKey);
    const { engine } = playRead(plan.exercise, { waitMode: plan.policy.waitMode, tempo: plan.policy.tempo });
    const attempt = readAttempt(plan.exercise, engine, {});
    assert.equal(attempt.mode, 'guided');
    assert.equal(attempt.completed, true);
    assert.equal(attempt.rhythm.measured, false, 'timing is reported as not measured, never as 80');
    const res = gradeRead(reading, attempt);
    reading = res.reading;
    assert.equal(res.verdict, 'clean', 'a flawless guided read is clean');
    assert.equal(res.credit, 'guided practice');
    assert.equal(res.independent, false, 'help on is never independent evidence');
  }
  assert.equal(reading.level, 2, 'two clean guided reads move up a level');
  assert.notEqual(keys[0], keys[1], 'the second read was different music');

  // level 2 the same way, and then level 3 turns the clock on by itself.
  for (let i = 0; i < 2; i++) {
    const plan = readingPlan(reading, { intent: 'practice' });
    assert.equal(plan.level, 2);
    const { engine } = playRead(plan.exercise, { waitMode: plan.policy.waitMode });
    reading = gradeRead(reading, readAttempt(plan.exercise, engine, {})).reading;
  }
  assert.equal(reading.level, 3, 'the ladder keeps climbing from guided evidence');
  assert.equal(sessionPolicy(3, 'practice').waitMode, false, 'from level 3 practice runs in time');
  assert.equal(sessionPolicy(1, 'first-read').waitMode, false, 'a declared first read is always in time');
  ok('guided reads are judged on wrong/missed notes and now progress 1 -> 2 -> 3');
}

// ---- 2. what may and may not count as reading unseen music ------------------
{
  const base = emptyReading();
  const plan = readingPlan(base, { intent: 'first-read', level: 3 });
  const ex = plan.exercise;
  assert.equal(plan.policy.waitMode, false);

  // (a) the real thing: timed, both hands, full tempo, new music, first try
  const clean = playRead(ex, { waitMode: false });
  assert.equal(clean.engine.stats.wrong, 0);
  const attempt = readAttempt(ex, clean.engine, {});
  assert.equal(attempt.mode, 'independent');
  assert.equal(attempt.rhythm.measured, true, 'the clock ran, so timing exists');
  assert.ok(attempt.accuracy >= 85, `a timed clean read scores ${attempt.accuracy}`);
  const good = gradeRead(base, attempt);
  assert.equal(good.independent, true);
  assert.deepEqual(good.contaminants, []);
  assert.equal(good.credit, 'independent reading');
  assert.equal(good.scope, 'read:L3:whole', 'the evidence records what was actually read');
  const word = competence(good.reading.evidence.filter((e) => e.scope === 'read:L3:whole'));
  assert.equal(word.word, 'alone', 'the evidence reads as ALONE in the app\'s own vocabulary');

  // (b) same notes, help on: practice, never unseen-reading proof
  const helped = playRead(ex, { waitMode: true });
  const helpedRes = gradeRead(base, readAttempt(ex, helped.engine, {}));
  assert.equal(helpedRes.independent, false);
  assert.ok(helpedRes.contaminants.includes('assisted'));
  assert.equal(competence(helpedRes.reading.evidence).word, 'with help');

  // (c) a retry of the same presentation
  const retry = gradeRead(base, readAttempt(ex, playRead(ex, { waitMode: false }).engine, { restarts: 1 }));
  assert.equal(retry.independent, false);
  assert.ok(retry.contaminants.includes('retry'));

  // (d) partial: he stopped halfway. Not a pass, not a failure, no evidence.
  const half = playRead(ex, { waitMode: false, stopAfterNotes: 2 });
  const partial = gradeRead(base, readAttempt(ex, half.engine, {}));
  assert.equal(partial.verdict, 'abandoned');
  assert.equal(partial.credit, 'none');
  assert.equal(partial.reading.evidence.length, 0, 'an abandoned read banks no evidence');
  assert.equal(partial.reading.cleans, 0, 'and spends no clean');

  // (e) wrongly scoped: one hand only, while the exercise has both
  assert.ok(ex.notes.some((n) => n.h === 'L') && ex.notes.some((n) => n.h === 'R'), 'level 3 uses both hands');
  const oneHand = playRead(ex, { waitMode: false, hand: 'R' });
  const scoped = gradeRead(base, readAttempt(ex, oneHand.engine, { startHand: 'both' }));
  assert.equal(scoped.independent, false, 'dropping to one hand mid-assessment voids it');
  assert.ok(scoped.contaminants.includes('hand-changed'));
  assert.ok(!scoped.contaminants.includes('range-changed'), 'the whole length was still in play');

  // (e2) wrongly scoped the other way: the first bar only, both hands
  const loop = new Engine(ex, { waitMode: false, loop: { start: 0, end: 4 } , repeat: false });
  for (let guard = 0; !loop.finished && guard < 5000; guard++) {
    const g = loop.currentGroup();
    if (!g) { loop.tick(20); continue; }
    if (loop.beat < g.beat - 1e-9) { loop.tick(Math.max(1, (g.beat - loop.beat) * loop.msPerBeat())); continue; }
    for (const n of g.notes) loop.noteOn(n.m);
  }
  const ranged = gradeRead(base, readAttempt(ex, loop, { startRange: { start: 0, end: ex.endBeat } }));
  assert.ok(ranged.contaminants.includes('range-changed'), 'shrinking the passage after choosing the whole thing');
  assert.equal(ranged.independent, false);

  // (e3) and repertoire cannot enter this ledger at all
  assert.throws(() => readAttempt({ id: 'ode-to-joy', notes: ex.notes }, clean.engine, {}),
    /sight-reading exercise/, 'a familiar song played from the score is repertoire, not reading proof');

  // (g) having heard it played first
  const heard = gradeRead(base, readAttempt(ex, playRead(ex, { waitMode: false }).engine, { heardAudio: true }));
  assert.ok(heard.contaminants.includes('heard-audio'));
  assert.equal(heard.independent, false);

  // (h) reading the same music again is practice, forever
  const again = gradeRead(good.reading, readAttempt(ex, playRead(ex, { waitMode: false }).engine, {}));
  assert.equal(again.novel, false);
  assert.equal(again.independent, false);
  assert.ok(again.contaminants.includes('repeat-content'));
  assert.equal(competence(again.reading.evidence.filter((e) => e.scope === 'read:L3:whole')).word, 'with help',
    'a repeat cannot upgrade the claim');
  assert.ok(Object.keys(CONTAMINANTS).every((k) => typeof CONTAMINANTS[k] === 'string'));
  ok('helped, retried, abandoned, scope-changed, pre-heard and repeated reads are all refused as unseen-reading evidence');
}

// ---- 2b. a tempo CHOSEN before the read is not contamination ----------------
// Supervisor finding 2: a beginner who sets 60% and reads steadily at it is
// reading. Only a setting moved DURING the assessment, or help, voids it.
{
  const base = emptyReading();
  const plan = readingPlan(base, { intent: 'first-read', level: 3, tempo: 0.6 });
  assert.equal(plan.policy.tempo, 0.6, 'the policy carries the learner\'s chosen tempo');
  assert.equal(plan.policy.tempoIsLearnerChoice, true);
  assert.equal(plan.policy.pulse.bpm, plan.exercise.bpm * 0.6, 'the pulse follows the chosen tempo');
  const ex = plan.exercise;

  const chosenSlow = gradeRead(base, readAttempt(ex,
    playRead(ex, { waitMode: false, tempo: 0.6 }).engine, { startTempo: 0.6, startHand: 'both' }));
  assert.deepEqual(chosenSlow.contaminants, [], 'a chosen slow tempo is not a contaminant');
  assert.equal(chosenSlow.independent, true, 'and the read counts as independent');
  assert.equal(chosenSlow.tempoPct, 60, 'the tempo is RECORDED, not hidden');
  assert.equal(chosenSlow.scopeFull, true);
  const ev = chosenSlow.reading.evidence.at(-1);
  assert.equal(ev.assisted, false);
  assert.equal(ev.tempoPct, 60);
  assert.equal(competence([ev]).word, 'alone');
  assert.match(readingSummary(chosenSlow.reading).levels.find((l) => l.level === 3).line,
    /alone 1× \(slowest 60% tempo\)/, 'and the summary says at what tempo');

  // the counterexample: same 60%, but he started at full tempo and slowed down
  const changed = gradeRead(base, readAttempt(ex,
    playRead(ex, { waitMode: false, tempo: 0.6 }).engine, { startTempo: 1, startHand: 'both' }));
  assert.ok(changed.contaminants.includes('tempo-changed'));
  assert.equal(changed.independent, false);
  // and the explicit flag works even when the end state looks untouched
  const flagged = gradeRead(base, readAttempt(ex,
    playRead(ex, { waitMode: false }).engine, { startTempo: 1, tempoChanged: true }));
  assert.ok(flagged.contaminants.includes('tempo-changed'), 'a change that was reverted still counts');
  assert.equal(flagged.independent, false);

  // a deliberate one-hand read is evidence AT ITS OWN SCOPE, not contamination
  const rh = gradeRead(base, readAttempt(ex,
    playRead(ex, { waitMode: false, hand: 'R' }).engine, { startHand: 'R', startTempo: 1 }));
  assert.deepEqual(rh.contaminants, [], 'choosing one hand before the read is a scope, not a fault');
  assert.equal(rh.independent, true);
  assert.equal(rh.scopeFull, false);
  assert.equal(rh.scope, 'read:L3:hand-R');
  const sum = readingSummary(rh.reading).levels.find((l) => l.level === 3);
  assert.equal(sum.independentCleans, 0, 'a right-hand read is not a whole-exercise read');
  assert.equal(sum.partialScopeCleans, 1);
  assert.deepEqual(sum.partialScopes, ['read:L3:hand-R']);
  assert.equal(competence(rh.reading.evidence.filter((e) => e.scope === 'read:L3:whole')), null,
    'and it leaves the both-hands ledger empty');
  ok('a tempo or scope chosen before the read counts and is recorded; only changes during it, and help, void the read');
}

// ---- 3. a rough read, and the way back down --------------------------------
{
  let reading = { ...emptyReading(), level: 2 };
  for (let i = 0; i < 2; i++) {
    const plan = readingPlan(reading, { intent: 'practice' });
    const { engine } = playRead(plan.exercise, { waitMode: true, wrongEvery: 1 });
    const attempt = readAttempt(plan.exercise, engine, {});
    assert.ok(attempt.pitch.wrong > 0, 'wrong notes were recorded');
    const res = gradeRead(reading, attempt);
    assert.equal(res.verdict, 'rough');
    reading = res.reading;
  }
  assert.equal(reading.level, 1, 'two rough reads step back down a level');
  ok('a guided read full of wrong notes is rough, and two of them step down');
}

// ---- 4. novelty is a property of the music, not the seed --------------------
{
  // First: the seeded factory still makes exactly the music it always made.
  // These four note arrays were printed from js/sight.mjs AT COMMIT cd4e5a6,
  // before any of this package's changes, so they are a real regression guard
  // and not this file agreeing with itself.
  const PINNED = [
    [1, 7, [{"b":0,"d":1,"m":60,"h":"R"},{"b":1,"d":1,"m":62,"h":"R"},{"b":2,"d":1,"m":64,"h":"R"},{"b":3,"d":1,"m":65,"h":"R"},{"b":4,"d":2,"m":67,"h":"R"},{"b":6,"d":2,"m":64,"h":"R"}]],
    [2, 99, [{"b":0,"d":0.5,"m":57,"h":"R"},{"b":0.5,"d":0.5,"m":59,"h":"R"},{"b":1,"d":0.5,"m":61,"h":"R"},{"b":1.5,"d":0.5,"m":59,"h":"R"},{"b":2,"d":1,"m":57,"h":"R"},{"b":3,"d":1,"m":64,"h":"R"},{"b":4,"d":0.5,"m":62,"h":"R"},{"b":4.5,"d":0.5,"m":61,"h":"R"},{"b":5,"d":0.5,"m":59,"h":"R"},{"b":5.5,"d":0.5,"m":57,"h":"R"},{"b":6,"d":2,"m":57,"h":"R"}]],
    [3, 12345, [{"b":0,"d":1,"m":79,"h":"R"},{"b":0,"d":4,"m":69,"h":"L"},{"b":1,"d":1,"m":78,"h":"R"},{"b":2,"d":1,"m":76,"h":"R"},{"b":3,"d":1,"m":78,"h":"R"},{"b":4,"d":2,"m":74,"h":"R"},{"b":4,"d":4,"m":62,"h":"L"},{"b":6,"d":2,"m":74,"h":"R"}]],
    [5, 2026, [{"b":0,"d":1,"m":81,"h":"R"},{"b":0,"d":4,"m":62,"h":"L"},{"b":1.5,"d":0.5,"m":81,"h":"R"},{"b":2,"d":1,"m":83,"h":"R"},{"b":3,"d":1,"m":81,"h":"R"},{"b":4,"d":1.5,"m":79,"h":"R"},{"b":4,"d":4,"m":57,"h":"L"},{"b":5.5,"d":0.5,"m":78,"h":"R"},{"b":6,"d":2,"m":74,"h":"R"}]],
  ];
  for (const [lvl, seed, notes] of PINNED) {
    const ex = makeExercise(lvl, seed);
    assert.deepEqual(ex.notes, notes, `seed ${seed} at level ${lvl} still makes its original music`);
    assert.equal(ex.id, `sight-${lvl}-${seed}`, 'and keeps its original id');
  }

  const byKey = new Map();
  for (let seed = 1; seed <= 400; seed++) {
    const ex = makeExercise(1, seed);
    if (!byKey.has(ex.contentKey)) byKey.set(ex.contentKey, []);
    byKey.get(ex.contentKey).push(seed);
  }
  const collided = [...byKey.values()].find((seeds) => seeds.length > 1);
  assert.ok(collided, 'different seeds do produce identical music');
  const a = makeExercise(1, collided[0]), b = makeExercise(1, collided[1]);
  assert.notEqual(a.id, b.id, 'different ids');
  assert.deepEqual(a.notes, b.notes, 'identical notes');
  assert.equal(exerciseKey(a), exerciseKey(b), 'and therefore one content key: a seed is not evidence of novelty');
  assert.ok(byKey.size <= poolSize(1), '400 seeds cannot exceed the real pool');

  // Supervisor finding 3: identity is the NOTATION, not the labels around it.
  // Same notes, same meter, same key, a different nominal bpm and a different
  // level label: that is the same music to read.
  const relabelled = { ...a, bpm: a.bpm * 2, sightLevel: 5, id: 'sight-5-relabelled' };
  assert.equal(exerciseKey(relabelled), exerciseKey(a),
    'a tempo label and a level label do not make music new');
  const transposed = { ...a, key: 'D', notes: a.notes.map((n) => ({ ...n, m: n.m + 2 })) };
  assert.notEqual(exerciseKey(transposed), exerciseKey(a), 'different notes are different music');
  const respelled = { ...a, key: 'F' };
  assert.notEqual(exerciseKey(respelled), exerciseKey(a),
    'the same midi notes under a different key signature are spelled differently, so they read differently');
  const remetered = { ...a, timeSig: [3, 4] };
  assert.notEqual(exerciseKey(remetered), exerciseKey(a), 'and the meter is part of what is read');
  ok('content identity is the notation (notes, meter, key), never the seed, the bpm label or the level label');
}

{
  // Supervisor finding 1, derived not asserted: at levels 3-5 the transpose
  // list holds +7 and -5 (an octave apart) and the register list holds 0, ±12,
  // so (+7, r) and (-5, r+12) are the SAME NOTES. Prove the duplicates exist
  // by building them, then prove the pool counts music and not combinations.
  for (const level of [3, 4, 5]) {
    const dupes = [];
    for (const v of variantSpace(level)) {
      if (v.transpose !== 7 || v.register === 12) continue; // +24 is not in the register list
      const twin = variantSpace(level).find((w) => w.kernel === v.kernel && w.transpose === -5 &&
        w.register === v.register + 12 && w.swap === v.swap && w.slow === v.slow);
      if (!twin) continue;
      const a = exerciseFromVariant(v), b = exerciseFromVariant(twin);
      assert.deepEqual(a.notes, b.notes, `level ${level}: +7/${v.register} and -5/${twin.register} are the same notes`);
      assert.equal(a.contentKey, b.contentKey, 'so they are one piece of music');
      dupes.push(a.contentKey);
    }
    assert.equal(dupes.length, 12, `level ${level}: 12 duplicated combinations`);
    assert.equal(variantCount(level), 108, 'raw combinations');
    assert.equal(poolSize(level), 96, 'actual distinct engravable music');
    assert.equal(contentSpace(level).size, 96);
  }
  assert.deepEqual([1, 2, 3, 4, 5].map(poolSize), [36, 72, 96, 96, 96], 'the real pool, deduplicated');
  assert.deepEqual([1, 2, 3, 4, 5].map(variantCount), [36, 72, 108, 108, 108], 'the raw combinations, for contrast');
}

for (const level of [1, 3]) {
  // Exhaust a level by VISITING the unique music, one real read at a time.
  const size = poolSize(level);
  let reading = emptyReading();
  const seen = new Set();
  for (let i = 0; i < size; i++) {
    const chosen = nextExercise(reading, { level });
    assert.equal(chosen.novel, true, `level ${level} read ${i + 1} is still fresh music`);
    assert.ok(!seen.has(chosen.contentKey), `level ${level} read ${i + 1} is not a repeat`);
    seen.add(chosen.contentKey);
    reading = gradeRead(reading, readAttempt(chosen.exercise,
      playRead(chosen.exercise, { waitMode: true }).engine, {})).reading;
    reading.level = level; // hold the level so the pool under test stays put
  }
  assert.equal(seen.size, size, `level ${level}: every distinct exercise was offered before any repeat`);
  const status = poolStatus(reading, level);
  assert.equal(status.exhausted, true);
  assert.equal(status.remaining, 0, 'no phantom material is left over');
  assert.equal(status.seen, size);
  if (level >= 3) assert.equal(status.variants, 108, 'and 12 of the 108 combinations were duplicates');
  const after = nextExercise(reading, { level });
  assert.equal(after.novel, false, `the ${size + 1}th read is honestly not new`);
  assert.equal(after.poolExhausted, true);
  assert.equal(after.timesRead, 1, 'and it is the least-read piece of music, not a random repeat');
  const graded = gradeRead(reading, readAttempt(after.exercise,
    playRead(after.exercise, { waitMode: false }).engine, {}));
  assert.equal(graded.independent, false, 'an exhausted pool cannot manufacture fresh assessment');
  ok(`level ${level}: all ${size} distinct exercises visited, then reported exhausted instead of faking novelty`);
}

// ---- 5. metadata: key, meter, duration, and a score that actually engraves ---
{
  const SCALE = { C: [0, 2, 4, 5, 7, 9, 11], D: [2, 4, 6, 7, 9, 11, 1], F: [5, 7, 9, 10, 0, 2, 4],
    G: [7, 9, 11, 0, 2, 4, 6], A: [9, 11, 1, 2, 4, 6, 8] };
  const SHARPS = { C: '', D: 'fc', F: '', G: 'f', A: 'fcg' };
  const FLATS = { C: '', D: '', F: 'b', G: '', A: '' };
  let checked = 0;
  const spellings = new Set();
  for (let level = 1; level <= 5; level++) {
    for (const variant of variantSpace(level)) {
      const ex = exerciseFromVariant(variant);
      assert.deepEqual(validateSong(ex), [], `variant ${level}/${variant.index} is a valid song`);
      assert.equal(ex.key, keyForTranspose(variant.transpose), 'key follows the transposition');
      const scale = SCALE[ex.key];
      for (const n of ex.notes) assert.ok(scale.includes(((n.m % 12) + 12) % 12),
        `${ex.key}: midi ${n.m} belongs to the stated key`);
      const eng = engravable(ex);
      assert.equal(eng.ok, true, `variant ${level}/${variant.index} engraves: ${eng.reason ?? ''}`);
      const model = notationModel(ex);
      assert.equal(model.key, ex.key, 'the engraver reads the stated key signature');
      assert.deepEqual(model.meter, ex.timeSig, 'meter survives into the score model');
      assert.equal(model.bars, ex.bars, 'the stated bar count is the engraved bar count');
      assert.equal(ex.endBeat, Math.max(...ex.notes.map((n) => n.b + n.d)), 'stated duration is the real duration');
      assert.equal(ex.endBeat, variant.slow ? 16 : 8, 'an augmented rhythm really is twice as long');
      assert.equal(ex.beatUnit, 4);
      assert.equal(beatsPerBar(ex), 4, 'stored beats are quarter notes, so a 4/4 bar is 4 of them');
      assert.equal(ex.barBeatCount, 4);
      assert.ok(!ex.meterVerified && !ex.fromScore, 'generated material claims no score provenance');
      // Spelling: the material is diatonic, so in its own key every note is
      // spelled by the key signature alone. A wrong key claim would force a
      // flat into a sharp key, or an accidental the signature does not carry.
      for (const n of ex.notes) {
        const spelled = spellPitch(n.m, ex.key);
        const [letter, acc] = [spelled[0], spelled.slice(1, spelled.indexOf('/'))];
        const expected = SHARPS[ex.key].includes(letter) ? '#' : FLATS[ex.key].includes(letter) ? 'b' : '';
        assert.equal(acc, expected, `${ex.key}: ${spelled} should be spelled by the key signature alone`);
        spellings.add(`${ex.key}:${letter}${acc}`);
      }
      checked++;
    }
  }
  assert.equal(checked, 36 + 72 + 108 + 108 + 108);
  assert.ok(spellings.has('D:f#') && spellings.has('A:g#'), 'sharp keys really are spelled with sharps');
  assert.ok(spellings.has('F:bb'), 'and F major really is spelled with a B flat, not an A sharp');
  ok(`${checked} exercises: key, meter, duration and spelling are correct and every one engraves`);
}

// ---- 6. the presentation contract ------------------------------------------
{
  const plan = readingPlan(emptyReading(), { intent: 'first-read', level: 4 });
  const p = plan.policy;
  assert.equal(p.preview.kind, 'score');
  assert.equal(p.preview.audio, false, 'the preview is a look at the score, never a playthrough');
  assert.equal(p.preview.seconds, 10);
  assert.equal(p.countIn.beats, 4, 'one bar of count-in before a first read');
  assert.equal(p.countIn.bpm, plan.exercise.bpm);
  assert.equal(p.pulse.continuous, true, 'the pulse keeps running through the read');
  assert.equal(p.restartOnError, false, 'reading never restarts on a wrong note');
  const guided = sessionPolicy(1, 'practice', plan.exercise);
  assert.equal(guided.countIn.beats, 0, 'no count-in into a frozen clock');
  assert.equal(guided.pulse.continuous, false, 'and no metronome over a clock that waits');
  ok('preview, count-in and pulse contract is explicit and mode-aware');
}

// ---- 7. migration, persistence, and the summary ----------------------------
{
  const legacy = { level: 3, cleans: 1, flops: 0, done: 12 };
  const migrated = migrateReading(legacy);
  assert.equal(migrated.v, 2);
  assert.equal(migrated.level, 3, 'the earned level survives');
  assert.equal(migrated.cleans, 1);
  assert.equal(migrated.done, 12);
  assert.deepEqual(migrated.evidence, [], 'no evidence is invented for reads nobody recorded');
  assert.equal(migrated.legacy.reads, 12);
  assert.deepEqual(migrateReading(migrated), migrated, 'migration is idempotent');
  const summary = readingSummary(legacy);
  assert.equal(summary.level, 3);
  assert.equal(summary.legacy.reads, 12);
  assert.ok(!('score' in summary) && !('ability' in summary), 'no global ability number exists');
  assert.equal(summary.levels.every((l) => l.independentCleans === 0), true, 'and no independent claim appears from nowhere');

  // a real independent pass, then a reload
  const plan = readingPlan(migrated, { intent: 'first-read', level: 3 });
  const res = gradeRead(migrated, readAttempt(plan.exercise, playRead(plan.exercise, { waitMode: false }).engine, {}));
  const reloaded = migrateReading(JSON.parse(JSON.stringify(res.reading)));
  assert.deepEqual(reloaded, res.reading, 'the whole ledger survives a save/load round trip');
  const after = readingSummary(reloaded);
  const l3 = after.levels.find((l) => l.level === 3);
  assert.equal(l3.independentCleans, 1);
  assert.equal(l3.pool.seen, 1);
  assert.equal(l3.pool.size, 96, 'the pool reports real music, not raw combinations');
  assert.match(l3.line, /alone/);
  assert.equal(after.legacy.reads, 12, 'the old count is still labelled, not merged in');

  // an early per-level exposure map folds into the flat one, keeping exposure
  const nested = { ...migrated, seen: { 3: { 'C:1:2:abc': { n: 2, lastAt: 5 } } } };
  assert.deepEqual(migrateReading(nested).seen, { 'C:1:2:abc': { n: 2, lastAt: 5 } },
    'a per-level exposure map is flattened, never dropped');

  // finding 4: the timing line names the median as a median
  const lines = feedbackLines(res);
  const timing = lines.find((l) => /^Timing/.test(l));
  assert.ok(lines.some((l) => /notes right/.test(l)) && timing);
  assert.match(timing, /median \d+ms (ahead|behind)/, 'the middle value is called a median');
  assert.doesNotMatch(timing, /average|mean/, 'and never an average, which it is not');
  assert.match(timing, /\d+ of \d+ notes on time/, 'with a plain on-time count beside it');
  ok('migration preserves the level and invents nothing; the ledger survives reload; timing says median');
}

// ============================================================================
// Cold review, 2026-09-13. Every block below is a reproduction of a finding
// that was live on a green suite, then the fix.
// ============================================================================

// ---- finding 1: nothing in range is not a clean read -----------------------
{
  // Level 1 kernels are right-hand only. Choose the LEFT hand and press
  // nothing: the engine builds zero groups, the run "finishes", and
  // `correct >= required` was vacuously true at required 0. Twice = LEVEL UP.
  const ex = makeExercise(1, 4242);
  assert.ok(ex.notes.every((n) => n.h === 'R'), 'level 1 is right-hand music');
  let reading = emptyReading();
  for (let i = 0; i < 2; i++) {
    const engine = new Engine(ex, { waitMode: true, hand: 'L' });
    for (let guard = 0; !engine.finished && guard < 5000; guard++) engine.tick(20);
    const attempt = readAttempt(ex, engine, { startHand: 'L' });
    assert.equal(attempt.pitch.required, 0, 'nothing was in range');
    assert.equal(attempt.completed, true, 'and the engine still calls it finished');
    const res = gradeRead(reading, attempt);
    assert.equal(res.verdict, 'abandoned', 'an empty scope is never clean');
    assert.equal(res.ladderMoved, false);
    assert.equal(res.credit, 'none');
    assert.equal(res.reading.evidence.length, 0, 'and banks no evidence');
    reading = res.reading;
  }
  assert.equal(reading.level, 1, 'two empty reads cannot level him up');
  assert.equal(reading.cleans, 0, 'and bank no cleans');
  assert.equal(readingSummary(reading).levels[0].guidedCleans, 0, 'the summary claims nothing');

  // the same hole by the other route: a practice range past the last note
  let r3 = { ...emptyReading(), level: 3 };
  const ex3 = makeExercise(3, 7);
  for (let i = 0; i < 2; i++) {
    const engine = new Engine(ex3, { waitMode: false, loop: { start: 12, end: 16 }, repeat: false });
    for (let guard = 0; !engine.finished && guard < 5000; guard++) engine.tick(50);
    const res = gradeRead(r3, readAttempt(ex3, engine, { startRange: { start: 12, end: 16 } }));
    assert.equal(res.verdict, 'abandoned', 'an empty range is never clean');
    r3 = res.reading;
  }
  assert.equal(r3.level, 3, 'an empty range cannot level him up either');
  ok('finding 1: a read with nothing in range is never clean, never levels up and never pays');
}

// ---- finding 5: part of an exercise is not the exercise --------------------
{
  const ex = exerciseFromVariant(variantSpace(3)[0]);
  assert.ok(ex.notes.some((n) => n.h === 'L') && ex.notes.some((n) => n.h === 'R'));
  let reading = { ...emptyReading(), level: 3 };
  for (let i = 0; i < 2; i++) {
    const { engine } = playRead(ex, { waitMode: false, hand: 'R' });
    const res = gradeRead(reading, readAttempt(ex, engine, { startHand: 'R', startTempo: 1 }));
    assert.equal(res.verdict, 'clean', 'it was a clean read of the right hand');
    assert.equal(res.scopeFull, false);
    assert.equal(res.ladderMoved, false, 'but the ladder that picks his next music does not move');
    // the second time through is the same music again, so it is practice
    assert.equal(res.credit, i === 0 ? 'independent reading of a part' : 'guided practice');
    reading = res.reading;
  }
  assert.equal(reading.level, 3, 'two right-hand reads do not advance the whole-exercise level');
  assert.equal(reading.cleans, 0);
  const lvl3 = readingSummary(reading).levels.find((l) => l.level === 3);
  assert.equal(lvl3.independentCleans, 0, 'and claim no whole-exercise reading');
  assert.equal(lvl3.partialScopeCleans, 1, 'the second read of the same music is a repeat');
  assert.equal(lvl3.guidedCleans, 0, 'guided cleans are scope-filtered too');

  // finding 4: the summary must not hand competence() a mixed-scope array
  assert.equal(competence(lvl3.evidenceFull), null, 'nothing claims the whole exercise');
  assert.equal(lvl3.evidencePartial.length, 2, 'both part-scope reads are filed there');
  assert.equal(competence([lvl3.evidencePartial[0]]).word, 'alone', 'the part he read is recorded as his');
  assert.equal(competence(lvl3.evidencePartial).word, 'with help',
    'and the repeat, being a repeat, is the last word on it');
  assert.ok(!('evidence' in lvl3), 'there is no mixed array to hand over by mistake');

  // and the right hand of a RIGHT-HAND-ONLY exercise IS the whole exercise
  const rhOnly = makeExercise(1, 4242);
  const { engine } = playRead(rhOnly, { waitMode: false, hand: 'R' });
  const att = readAttempt(rhOnly, engine, { startHand: 'R', startTempo: 1 });
  assert.equal(att.scopeFull, true, 'nothing was left out');
  assert.equal(att.scope, 'read:L1:whole', 'so it files under the whole-exercise scope');
  ok('finding 5/4: a part-scope read is real practice at its own scope, moves no ladder, and never answers for the exercise');
}

// ---- finding 2: the presentation lifecycle ---------------------------------
{
  // preview -> play: valid exactly once
  const start = emptyReading();
  const shown = presentExercise(start, { intent: 'first-read', level: 3 });
  assert.ok(shown.presentation.token, 'a receipt comes back with the score');
  assert.equal(shown.novel, true);
  assert.equal(shown.reading.seen[shown.contentKey].n, 1, 'exposure is banked the moment it is shown');
  assert.equal(start.seen[shown.contentKey], undefined, 'and the caller\'s old state is not mutated');
  assert.equal(presentationValid(shown.presentation), true);
  const played = gradeRead(shown.reading, readAttempt(shown.exercise,
    playRead(shown.exercise, { waitMode: false }).engine,
    { presentation: shown.presentation, startTempo: 1, startHand: 'both' }));
  assert.equal(played.novel, true, 'the read that follows the first presentation IS the first read');
  assert.equal(played.proof, true);
  assert.equal(played.credit, 'independent reading');
  assert.equal(played.reading.seen[shown.contentKey].n, 1, 'and the presentation is not counted twice');
  assert.equal(presentationValid(shown.presentation), false, 'the receipt is spent');

  // duplicate grade: the same receipt cannot pay twice
  const twice = gradeRead(played.reading, readAttempt(shown.exercise,
    playRead(shown.exercise, { waitMode: false }).engine,
    { presentation: shown.presentation, startTempo: 1, startHand: 'both' }));
  assert.equal(twice.novel, false);
  assert.equal(twice.proof, false);
  assert.notEqual(twice.credit, 'independent reading');
  assert.ok(twice.contaminants.includes('repeat-content'));

  // preview -> leave -> reopen: the ten seconds spent the music
  const s2 = presentExercise(emptyReading(), { intent: 'first-read', level: 3 });
  abandonPresentation(s2.presentation);
  assert.equal(presentationValid(s2.presentation), false);
  const reopened = presentExercise(s2.reading, { intent: 'first-read', level: 3 });
  assert.notEqual(reopened.contentKey, s2.contentKey, 'he is given fresh music, not the piece he studied');
  const backToIt = gradeRead(s2.reading, readAttempt(s2.exercise,
    playRead(s2.exercise, { waitMode: false }).engine,
    { presentation: s2.presentation, startTempo: 1, startHand: 'both' }));
  assert.equal(backToIt.novel, false, 'and the studied piece can never be a first read again');
  assert.equal(backToIt.proof, false);
  assert.equal(backToIt.credit, 'guided practice', 'it is practice now');
  assert.ok(backToIt.contaminants.includes('repeat-content'));

  // preview -> reload: a receipt from a previous page session is worthless,
  // even if the app persisted the token string and replayed it
  const s3 = presentExercise(emptyReading(), { intent: 'first-read', level: 3 });
  const afterReload = migrateReading(JSON.parse(JSON.stringify(s3.reading)));
  assert.equal(afterReload.seen[s3.contentKey].n, 1, 'exposure survived the reload');
  const stale = { token: 'pSTALESESSION:1', contentKey: s3.contentKey, firstRead: true };
  assert.equal(presentationValid(stale), false);
  const replayed = gradeRead(afterReload, readAttempt(s3.exercise,
    playRead(s3.exercise, { waitMode: false }).engine,
    { presentation: stale, startTempo: 1, startHand: 'both' }));
  assert.equal(replayed.novel, false, 'a reloaded page cannot resurrect a first reading');
  assert.equal(replayed.proof, false);

  // abandoned run after a presentation: exposure once, no evidence, no proof
  const s4 = presentExercise(emptyReading(), { intent: 'first-read', level: 3 });
  const stopped = gradeRead(s4.reading, readAttempt(s4.exercise,
    playRead(s4.exercise, { waitMode: false, stopAfterNotes: 2 }).engine,
    { presentation: s4.presentation, startTempo: 1, startHand: 'both' }));
  assert.equal(stopped.verdict, 'abandoned');
  assert.equal(stopped.credit, 'none');
  assert.equal(stopped.reading.seen[s4.contentKey].n, 1, 'seen once, because it was shown once');
  assert.equal(stopped.reading.evidence.length, 0);

  // help or a retry inside a valid presentation still voids the proof
  const s5 = presentExercise(emptyReading(), { intent: 'first-read', level: 3 });
  const helped = gradeRead(s5.reading, readAttempt(s5.exercise,
    playRead(s5.exercise, { waitMode: true }).engine,
    { presentation: s5.presentation, startTempo: 1, startHand: 'both' }));
  assert.equal(helped.novel, true, 'it was still the first reading of this music');
  assert.equal(helped.proof, false, 'but help means it proves nothing about reading alone');
  assert.equal(helped.credit, 'guided practice');
  const s6 = presentExercise(emptyReading(), { intent: 'first-read', level: 3 });
  const retried = gradeRead(s6.reading, readAttempt(s6.exercise,
    playRead(s6.exercise, { waitMode: false }).engine,
    { presentation: s6.presentation, restarts: 1, startTempo: 1, startHand: 'both' }));
  assert.equal(retried.proof, false);
  assert.ok(retried.contaminants.includes('retry'));

  // readingPlan stays a pure getter
  const before = JSON.stringify(start);
  readingPlan(start, { intent: 'first-read', level: 3 });
  assert.equal(JSON.stringify(start), before, 'readingPlan records nothing');
  ok('finding 2: exposure is spent when the score is shown; one receipt, one first read, and no reload brings it back');
}

// ---- finding 3: earned proofs cannot be trimmed away -----------------------
{
  let reading = emptyReading();
  for (let i = 0; i < 3; i++) {
    const shown = presentExercise(reading, { intent: 'first-read', level: 1 });
    const res = gradeRead(shown.reading, readAttempt(shown.exercise,
      playRead(shown.exercise, { waitMode: false }).engine,
      { presentation: shown.presentation, startTempo: 1, startHand: 'both' }));
    assert.equal(res.proof, true, `first read ${i + 1} earned it`);
    reading = { ...res.reading, level: 1 };
  }
  assert.equal(readingSummary(reading).levels[0].independentCleans, 3);
  // now practise a lot, which used to push the proofs out of the 60-row window
  for (let i = 0; i < READS_KEPT + 5; i++) {
    const shown = presentExercise(reading, { intent: 'practice', level: 1 });
    const res = gradeRead(shown.reading, readAttempt(shown.exercise,
      playRead(shown.exercise, { waitMode: true }).engine,
      { presentation: shown.presentation, startTempo: 1, startHand: 'both' }));
    reading = { ...res.reading, level: 1 };
  }
  assert.equal(reading.reads.length, READS_KEPT, 'the log really did trim');
  const lvl = readingSummary(reading).levels[0];
  assert.equal(lvl.independentCleans, 3, 'and the three proofs he earned are still his');
  assert.equal(lvl.reads, 3 + READS_KEPT + 5, 'the lifetime read count is lifetime');
  assert.equal(lvl.recent.window, READS_KEPT, 'the windowed number is labelled as windowed');
  assert.equal(lvl.recent.reads, READS_KEPT);
  assert.match(lvl.line, /alone 3×/);
  ok('finding 3: practising cannot take back a proof, and the windowed number says it is windowed');
}

// ---- finding 6: a failed read is not told it counts -------------------------
{
  const shown = presentExercise(emptyReading(), { intent: 'first-read', level: 3 });
  const engine = new Engine(shown.exercise, { waitMode: false });
  for (let guard = 0; !engine.finished && guard < 20000; guard++) engine.tick(50); // play nothing
  const attempt = readAttempt(shown.exercise, engine, { presentation: shown.presentation, startTempo: 1, startHand: 'both' });
  assert.ok(attempt.pitch.required > 0 && attempt.pitch.correct === 0, 'notes existed and none were played');
  assert.equal(attempt.completed, true);
  const res = gradeRead(shown.reading, attempt);
  assert.equal(res.verdict, 'rough');
  assert.equal(res.independent, true, 'he was unaided, which stays true');
  assert.equal(res.proof, false, 'and he did not read it, which also stays true');
  assert.equal(res.credit, 'independent attempt');
  const lines = feedbackLines(res);
  assert.ok(!lines.some((l) => /counts as reading new music/.test(l)), 'no success wording for a failed read');
  assert.ok(lines.some((l) => /did not come off/.test(l)));
  // finding 8: and no median out of nothing
  assert.equal(res.rhythm.measured, false);
  assert.match(lines.find((l) => /^Timing/.test(l)), /no notes were played in time/i);
  assert.equal(readingSummary(res.reading).levels.find((l) => l.level === 3).independentCleans, 0);
  ok('finding 6/8: a failed unaided read is called an attempt, not a success, and reports no timing it did not measure');
}

// ---- finding 7: help switched OFF mid-read is not invisible ----------------
{
  const ex = exerciseFromVariant(variantSpace(3)[0]);
  const engine = new Engine(ex, { waitMode: true });
  let guard = 0;
  while (engine.nextGroupIdx < 2 && guard++ < 5000) {
    const g = engine.currentGroup();
    if (!engine.waiting) { engine.tick(20); continue; }
    for (const n of g.notes) engine.noteOn(n.m);
  }
  assert.ok(engine.responses.length > 0, 'those presses were made with the notes waiting');
  engine.waitMode = false;                       // he turns help off and carries on
  while (!engine.finished && guard++ < 50000) {
    const g = engine.currentGroup();
    if (!g) { engine.tick(20); continue; }
    if (engine.beat < g.beat - 1e-9) { engine.tick(Math.max(1, (g.beat - engine.beat) * engine.msPerBeat())); continue; }
    for (const n of g.notes) engine.noteOn(n.m);
  }
  assert.ok(engine.timing.length > 0, 'and these were made against the clock');
  const attempt = readAttempt(ex, engine, { startTempo: 1, startHand: 'both' }); // no sticky flag passed
  assert.equal(attempt.mode, 'independent', 'the run ENDED with help off');
  assert.ok(attempt.contaminants.includes('help-toggled'), 'but the engine kept the proof that it was on');
  const res = gradeRead(emptyReading(), attempt);
  assert.equal(res.proof, false);
  assert.notEqual(res.credit, 'independent reading');
  ok('finding 7: help used partway is inferred from the engine\'s own two logs, with or without a UI flag');
}

// ---- finding 9 + tempo bounds: corrupt state cannot crash or stick ---------
{
  const corrupt = { v: 2, level: 9, cleans: -4, flops: 'x', done: null,
    reads: {}, evidence: 'nope', seen: null, counts: { 3: { independentFull: 'lots', reads: 2.7 } } };
  const fixed = migrateReading(corrupt);
  assert.equal(fixed.level, 5, 'a level past the top is clamped, not left stuck');
  assert.equal(fixed.cleans, 0);
  assert.equal(fixed.flops, 0);
  assert.equal(fixed.done, 0);
  assert.deepEqual(fixed.reads, []);
  assert.deepEqual(fixed.evidence, []);
  assert.deepEqual(fixed.seen, {});
  assert.equal(fixed.counts[3].independentFull, 0, 'a nonsense counter becomes zero, not a claim');
  assert.equal(fixed.counts[3].reads, 2);
  const summary = readingSummary(corrupt);           // used to throw TypeError
  assert.equal(summary.level, 5);
  assert.ok(Array.isArray(summary.levels));
  assert.deepEqual(migrateReading([]), emptyReading(), 'an array is not a reading ledger');
  assert.deepEqual(migrateReading('nonsense'), emptyReading());

  const ex = exerciseFromVariant(variantSpace(3)[0]);
  assert.equal(sessionPolicy(3, 'first-read', ex, { tempo: 0 }).tempo, 1, 'tempo 0 would hang the read forever');
  assert.equal(sessionPolicy(3, 'first-read', ex, { tempo: -2 }).tempo, 1);
  assert.equal(sessionPolicy(3, 'first-read', ex, { tempo: 0.05 }).tempo, 0.25, 'clamped to a tempo a person can read at');
  assert.equal(sessionPolicy(3, 'first-read', ex, { tempo: 99 }).tempo, 2);
  assert.equal(sessionPolicy(3, 'first-read', ex).repeat, false, 'a looped lap would wipe the evidence mid-read');
  ok('finding 9: malformed state is clamped and type-checked instead of crashing or sticking; tempo is bounded');
}

console.log(`\nreading-session: ${passes} checks passed`);
