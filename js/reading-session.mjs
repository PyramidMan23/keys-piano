// The reading session model (package 1, 2026-09-13). DOM-free.
//
// WHY THIS EXISTS. The app had one number for reading: engine accuracy, judged
// at 85. Wait mode freezes the clock, so every accepted press is 'good' and
// that number is pinned at 80 for a FLAWLESS read: levels 1 and 2, which the
// app deliberately runs with help on, could never advance. That was the bug.
// The deeper problem was underneath it: a read with help on, at half tempo, on
// a phrase he had already read twice, scored on the same scale as a first read
// of unseen music at tempo with no help. Those are different activities and
// only one of them is sight reading.
//
// The laws this module keeps.
//  1. GUIDED AND INDEPENDENT ARE DIFFERENT ACTIVITIES. Both are worth doing,
//     both earn practice credit, only one is evidence of reading unseen music.
//     Help stays recoverable; taking it converts the evidence, it never voids
//     the practice.
//  2. NOVELTY IS A FACT ABOUT THE MUSIC, NOT THE SEED AND NOT THE LABELS.
//     Exposure is tracked by notation: the notes, the meter and the key that
//     spells them. The same page relabelled with a different tempo or level is
//     not new music. The pool is finite, enumerable and DEDUPLICATED (108
//     transform combinations at levels 3-5 are only 96 pieces of music), and
//     when it runs out this module says so instead of re-serving old material
//     as fresh assessment.
//  2b. A SETTING CHOSEN BEFORE THE READ IS A CONDITION, NOT CONTAMINATION.
//     Reading slowly and steadily is reading; reading one hand is reading, at
//     that scope. Both are recorded and reported. What voids a read is help,
//     and a control moved DURING it.
//  3. FIRST ATTEMPT ONLY, AND SEEING IS EXPOSURE. Reading unseen music can
//     happen once per piece of music, and the clock on that starts when the
//     score goes ON SCREEN, not when the grading runs. Studying a score for ten
//     seconds and then leaving used the music up. `presentExercise` records the
//     exposure and hands back a one-shot receipt; only the attempt that carries
//     that receipt can be a first reading, and a reload does not bring it back.
//  4. NO GLOBAL ABILITY SCORE. Pitch, rhythm and continuity are reported
//     separately, and anything the run could not measure (timing under wait
//     mode) is reported as not measured rather than as a number. Middle values
//     are called medians, because that is what they are.
//  5. NOTHING IS INVENTED IN MIGRATION. Old progress keeps its level; old
//     reads whose conditions were never recorded stay "mode not recorded".

import { clampLevel, exerciseFromVariant, exerciseKey, judgeSight, mulberry32,
  SIGHT_MAX_LEVEL, variantSpace } from './sight.mjs';
import { notationModel } from './notation.mjs';
import { ContinuityTracker } from './perform.mjs';
import { timingSummary } from './engine.mjs';
import { beatsPerBar } from './meter.mjs';

export const READING_VERSION = 2;
export const READS_KEPT = 60;      // the log is a WINDOW; the counts are not
export const EVIDENCE_KEPT = 60;
export const TEMPO_MIN = 0.25, TEMPO_MAX = 2;

// Every reason a read cannot be evidence of reading unseen music, in the
// words the results panel can print verbatim.
//
// What is NOT here matters as much. A slow steady tempo CHOSEN BEFORE the read
// is not contamination, it is how a beginner reads: the tempo is recorded as a
// condition and reported, never used to void the read. Nor is playing one hand
// or one bar: that is the SCOPE of the read, recorded in the evidence scope so
// a right-hand read never reads back as a whole-exercise read. What voids a
// read is help, and settings moved DURING it.
export const CONTAMINANTS = {
  assisted: 'Help was on: the notes waited for you, so timing was not read.',
  'help-toggled': 'Help was switched on partway through.',
  'tempo-changed': 'The tempo was changed during the read.',
  'hand-changed': 'The hands in play changed during the read.',
  'range-changed': 'The passage in play changed during the read.',
  'heard-audio': 'The exercise was played to you first.',
  retry: 'This was a repeat attempt at the same presentation.',
  'repeat-content': 'You have read this music before.',
  'letter-cues': 'Note-name cues were on screen.',
};

export function emptyReading() {
  return { v: READING_VERSION, level: 1, cleans: 0, flops: 0, done: 0,
    seen: {}, reads: [], evidence: [], counts: {}, legacy: null };
}

// The counters that must NEVER go down. `reads` and `evidence` are a rolling
// 60-row window, so counting proofs out of them meant that practising made
// earned proofs disappear ("alone 20×" became "alone 15×" after 45 practice
// reads). Everything a summary CLAIMS comes from here; the window is only ever
// used for explicitly-bounded "recent" facts.
const emptyCount = () => ({ reads: 0, guidedCleans: 0, independentFull: 0,
  independentPartial: 0, partialReads: 0, lastIndependentAt: 0, slowestIndependentTempoPct: null });
const countFor = (r, lvl) => ({ ...emptyCount(), ...(r.counts?.[lvl] ?? {}) });

// Exposure is keyed on the MUSIC, so the ledger is flat: the same notation
// offered at two levels is one piece of music he has read. An early build
// bucketed it per level; fold that shape in rather than losing the exposure.
function flattenSeen(seen) {
  if (!seen || typeof seen !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(seen)) {
    if (/^[0-9]+$/.test(key) && value && typeof value === 'object' && !('n' in value)) {
      for (const [inner, rec] of Object.entries(value)) {
        const prior = out[inner];
        out[inner] = prior ? { ...rec, n: (prior.n ?? 0) + (rec.n ?? 0),
          lastAt: Math.max(prior.lastAt ?? 0, rec.lastAt ?? 0) } : rec;
      }
    } else out[key] = value;
  }
  return out;
}

// Old shape: {level, cleans, flops, done}. It carries a level and a count of
// reads and NOTHING about how they were played, so it becomes exactly that:
// a level, and a count filed under "mode not recorded". No independent pass is
// back-dated out of it.
const whole = (v, fallback = 0) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback);
// A v2 shape is not to be trusted just because it says v2: it comes out of
// localStorage, where anything can happen. `{v:2, level:9, reads:{}}` used to
// survive as level 9 (which the ladder can only ever decrement) and then throw
// TypeError in the summary.
function cleanCounts(counts) {
  if (!counts || typeof counts !== 'object') return {};
  const out = {};
  for (let lvl = 1; lvl <= SIGHT_MAX_LEVEL; lvl++) {
    const c = counts[lvl];
    if (!c || typeof c !== 'object') continue;
    out[lvl] = { ...emptyCount(),
      reads: whole(c.reads), guidedCleans: whole(c.guidedCleans),
      independentFull: whole(c.independentFull), independentPartial: whole(c.independentPartial),
      partialReads: whole(c.partialReads), lastIndependentAt: whole(c.lastIndependentAt),
      slowestIndependentTempoPct: Number.isFinite(c.slowestIndependentTempoPct)
        ? c.slowestIndependentTempoPct : null };
  }
  return out;
}

export function migrateReading(prior) {
  if (prior && prior.v === READING_VERSION) {
    const reads = Array.isArray(prior.reads) ? prior.reads.filter((x) => x && typeof x === 'object') : [];
    const evidence = Array.isArray(prior.evidence) ? prior.evidence.filter((x) => x && typeof x === 'object') : [];
    const out = { ...emptyReading(), ...prior,
      level: clampLevel(prior.level ?? 1),
      cleans: whole(prior.cleans), flops: whole(prior.flops), done: whole(prior.done),
      seen: flattenSeen(prior.seen), reads, evidence, counts: cleanCounts(prior.counts) };
    // An earlier v2 kept no monotonic counters. Seed them from the rows that
    // survive, which is REAL evidence, under-counted where the window already
    // trimmed. Nothing unrecorded is invented.
    if (!prior.counts && reads.length) {
      for (const row of reads) {
        const lvl = clampLevel(row.level ?? 1);
        const c = (out.counts[lvl] ??= emptyCount());
        c.reads++;
        if (row.scopeFull === false) c.partialReads++;
        if (row.verdict === 'clean' && row.mode === 'guided' && row.scopeFull !== false) c.guidedCleans++;
        if (row.verdict === 'clean' && row.independent) {
          if (row.scopeFull === false) c.independentPartial++;
          else {
            c.independentFull++;
            c.lastIndependentAt = Math.max(c.lastIndependentAt, whole(row.t));
            const pct = Number.isFinite(row.tempoPct) ? row.tempoPct : 100;
            c.slowestIndependentTempoPct = c.slowestIndependentTempoPct == null
              ? pct : Math.min(c.slowestIndependentTempoPct, pct);
          }
        }
      }
      out.countsSeededFrom = 'log';
    }
    return out;
  }
  const base = emptyReading();
  if (!prior || typeof prior !== 'object' || Array.isArray(prior)) return base;
  const done = whole(prior.done);
  return { ...base,
    level: clampLevel(prior.level ?? 1),
    cleans: whole(prior.cleans),
    flops: whole(prior.flops),
    done,
    legacy: done || prior.level ? { reads: done, level: clampLevel(prior.level ?? 1),
      note: 'Read before conditions were recorded: guided or independent is unknown.' } : null };
}

// ---- the finite pool -------------------------------------------------------
// THE MUSIC, not the transform combinations. Two things shrink the raw count:
// duplicates (at levels 3-5 transpose +7 with register r is the same notes as
// transpose -5 with register r+12, which is 12 pairs per level, 108 -> 96) and
// anything the engraver would refuse. Counting raw variants would leave the
// pool reporting material that does not exist, forever.
const CONTENT = new Map(); // level -> Map(contentKey -> {exercise, variants})
export function contentSpace(level) {
  const lvl = clampLevel(level);
  if (CONTENT.has(lvl)) return CONTENT.get(lvl);
  const byContent = new Map();
  for (const variant of variantSpace(lvl)) {
    const exercise = exerciseFromVariant(variant);
    if (!engravable(exercise).ok) continue;
    const existing = byContent.get(exercise.contentKey);
    if (existing) existing.variants.push(variant);
    else byContent.set(exercise.contentKey, { exercise, variants: [variant] });
  }
  CONTENT.set(lvl, byContent);
  return byContent;
}
export const poolSize = (level) => contentSpace(level).size;

export function poolStatus(reading, level) {
  const r = migrateReading(reading);
  const lvl = clampLevel(level ?? r.level);
  const space = contentSpace(lvl);
  let seen = 0;
  for (const key of space.keys()) if (r.seen?.[key]) seen++;
  return { level: lvl, size: space.size, seen,
    remaining: Math.max(0, space.size - seen), exhausted: seen >= space.size,
    variants: variantSpace(lvl).length };
}

// Engraving eligibility, asked of the real model the app draws from. A fresh
// exercise the score view would refuse is not a reading exercise at all.
export function engravable(song) {
  try {
    const model = notationModel(song);
    if (model.reason) return { ok: false, reason: model.reason };
    return { ok: true, bars: model.bars, meter: model.meter, key: model.key ?? null };
  } catch (err) {
    return { ok: false, reason: err?.message ?? String(err) };
  }
}

// Choose the next exercise: least-read content first, oldest first inside
// that, then a deterministic shuffle so the order is not simply the kernel
// list every time. Candidates are checked against the engraver before being
// offered, and the answer says honestly whether the music is new.
export function nextExercise(reading, { level, salt } = {}) {
  const r = migrateReading(reading);
  const lvl = clampLevel(level ?? r.level);
  const mix = salt ?? r.done ?? 0;
  const candidates = [...contentSpace(lvl).entries()].map(([key, { exercise, variants }]) => {
    const rec = r.seen?.[key];
    return { exercise, key, n: rec?.n ?? 0, lastAt: rec?.lastAt ?? 0,
      jitter: mulberry32(((variants[0].index + 1) * 2654435761) ^ mix)() };
  }).sort((a, b) => a.n - b.n || a.lastAt - b.lastAt || a.jitter - b.jitter);

  const status = poolStatus(r, lvl);
  const c = candidates[0];
  if (!c) {
    return { exercise: null, contentKey: null, level: lvl, novel: false, timesRead: 0,
      lastReadAt: null, pool: status, poolExhausted: true,
      engraving: { ok: false, reason: 'No exercise at this level can be engraved.' } };
  }
  return { exercise: c.exercise, contentKey: c.key, level: lvl,
    novel: c.n === 0, timesRead: c.n, lastReadAt: c.lastAt || null,
    pool: status, poolExhausted: !status.remaining, engraving: engravable(c.exercise) };
}

// ---- how a read is presented ----------------------------------------------
// The preview/count-in contract the play surface implements. A first read gets
// a SILENT look at the score, a count-in and a pulse that keeps running: that
// is what reading in time means. A guided read gets no pulse and no count-in,
// because wait mode stops the clock and a metronome over a stopped clock is a
// lie. Neither mode restarts on a wrong note: in reading, recovery is the
// skill being practised.
export const PREVIEW_SECONDS = { 'first-read': 10, practice: 6 };
export function sessionPolicy(level, intent = 'practice', exercise = null, { tempo, hand } = {}) {
  const lvl = clampLevel(level);
  const first = intent === 'first-read';
  // levels 1-2 read at their own pace, from level 3 the clock runs (the app's
  // existing rule); a declared first read is always in time.
  const waitMode = first ? false : lvl < 3;
  const bar = exercise ? beatsPerBar(exercise) : 4;
  return {
    intent, level: lvl,
    mode: waitMode ? 'guided' : 'independent',
    // The tempo is the LEARNER'S, chosen before the read. The exercise bpm is
    // the default, not a floor: reading slowly and steadily is reading.
    waitMode, tempo: clampTempo(tempo), tempoIsLearnerChoice: true,
    hand: hand ?? 'both', section: '', chunk: null,
    restartOnError: false,
    // A looped lap calls Engine.reset(), which wipes stats, verdicts and
    // timing: a graded read would then describe only the final lap.
    repeat: false,
    preview: { kind: 'score', seconds: PREVIEW_SECONDS[intent] ?? PREVIEW_SECONDS.practice, audio: false },
    countIn: { beats: waitMode ? 0 : bar, bpm: (exercise?.bpm ?? null) && exercise.bpm * clampTempo(tempo) },
    pulse: { continuous: !waitMode, bpm: (exercise?.bpm ?? null) && exercise.bpm * clampTempo(tempo), beatsPerBar: bar },
    evidence: waitMode ? 'guided practice' : 'independent, if the music is new and nothing was toggled',
  };
}
// tempo 0 gives msPerBeat() === Infinity, which hangs a read forever.
export function clampTempo(tempo) {
  const t = Number(tempo);
  if (!Number.isFinite(t) || t <= 0) return 1;
  return Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, t));
}

// A PURE GETTER: it looks at the ledger and answers "what is next", and it
// records nothing. Use it to render a card, a count or a preview of what is
// coming. The moment the score is actually put in front of him, call
// `presentExercise` instead: that is the call that spends the music.
export function readingPlan(reading, { intent = 'practice', level, salt, tempo, hand } = {}) {
  const r = migrateReading(reading);
  const chosen = nextExercise(r, { level, salt });
  return { ...chosen, reading: r, intent,
    policy: sessionPolicy(chosen.level, intent, chosen.exercise, { tempo, hand }) };
}

// ---- presentation: the call that spends the music ---------------------------
// THE LIFECYCLE, and the UI must follow it exactly:
//   1. `presentExercise(reading, opts)` when the score goes on screen. SAVE the
//      returned reading immediately: the exposure is banked there, so studying
//      a score and walking away costs the piece, which is the truth.
//   2. Play the read with the returned `policy`, then
//      `readAttempt(exercise, engine, {presentation, ...flags})` and
//      `gradeRead(reading, attempt)`. The receipt is consumed by the first
//      grade and is worth nothing after that.
//   3. If he leaves without playing, `abandonPresentation(presentation)`. The
//      exposure stays spent (he saw it); the receipt dies.
// The receipt lives in THIS MODULE'S MEMORY, keyed by a session id generated on
// load. A page reload therefore invalidates every outstanding receipt, which is
// exactly right: a reload is a new visit to music he has already studied, and
// a persisted-then-replayed token cannot resurrect a first reading.
const SESSION_ID = `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const PENDING = new Map(); // token -> {contentKey, level, firstRead, used, at}
let presentCounter = 0;

export function presentExercise(reading, { intent = 'practice', level, salt, tempo, hand,
  now = Date.now() } = {}) {
  const r = migrateReading(reading);
  const chosen = nextExercise(r, { level, salt });
  const policy = sessionPolicy(chosen.level, intent, chosen.exercise, { tempo, hand });
  if (!chosen.exercise) return { ...chosen, reading: r, intent, policy, presentation: null };
  const key = chosen.contentKey;
  const prior = r.seen[key] ?? null;
  const firstRead = !prior; // never seen before THIS presentation
  const token = `${SESSION_ID}:${++presentCounter}`;
  PENDING.set(token, { contentKey: key, level: chosen.level, firstRead, used: false, at: now });
  const next = { ...r, seen: { ...r.seen, [key]: {
    n: (prior?.n ?? 0) + 1, lastAt: now, firstMode: prior?.firstMode ?? intent,
    firstSeenAt: prior?.firstSeenAt ?? now } } };
  return { ...chosen, reading: next, intent, policy,
    presentation: { token, contentKey: key, level: chosen.level, firstRead, at: now },
    novel: firstRead, timesSeen: (prior?.n ?? 0) + 1 };
}

// He looked and left. The music stays spent; the one first-reading chance dies
// with the presentation, so reopening it later cannot earn independent proof.
export function abandonPresentation(presentation) {
  const token = typeof presentation === 'string' ? presentation : presentation?.token;
  if (token) PENDING.delete(token);
}
export function presentationValid(presentation) {
  const token = typeof presentation === 'string' ? presentation : presentation?.token;
  const rec = token && PENDING.get(token);
  return !!rec && !rec.used;
}

// ---- what actually happened ------------------------------------------------
// `read:L3:whole` is the whole exercise however it was reached; anything less
// says which part, so the two can never be counted together.
function scopeString(level, engine, handsLeftOut, rangeLeftOut) {
  if (!handsLeftOut && !rangeLeftOut) return `read:L${level}:whole`;
  return `read:L${level}` + (handsLeftOut ? `:hand-${engine.hand}` : '') +
    (rangeLeftOut ? `:b${engine.startBeat}-${engine.endBeat}` : '');
}

// Read straight off a real Engine after a run. Nothing here re-implements the
// engine's judging: it reads stats, verdicts and the signed timing the engine
// already records.
export function readAttempt(exercise, engine, session = {}) {
  // Law 1 in code: a repertoire run is repertoire. Familiar music played from
  // the score is a fine thing to do and it is not evidence of reading unseen
  // music, so it cannot enter this ledger by accident.
  if (!exercise?.sightRead) throw Error('Only a sight-reading exercise can be graded as a read.');
  const stats = engine.stats;
  const required = engine.groups.reduce((a, g) => a + g.notes.length, 0);
  const correct = stats.perfect + stats.good + stats.late;
  const completed = !!engine.finished || engine.nextGroupIdx >= engine.groups.length;
  const inRange = (n) => n.b >= engine.startBeat && n.b < engine.endBeat;
  const notes = exercise.notes ?? [];
  const handsLeftOut = notes.some((n) => engine.hand !== 'both' && n.h !== engine.hand);
  const rangeLeftOut = notes.some((n) => !inRange(n));
  // What he chose BEFORE playing. Absent means the caller did not record it,
  // in which case what the engine ran with is taken as the chosen setting: an
  // unrecorded change cannot be detected and must not be invented either.
  const startTempo = session.startTempo ?? engine.tempo;
  const startHand = session.startHand ?? engine.hand;
  const startRange = session.startRange ?? { start: engine.startBeat, end: engine.endBeat };

  const tracker = new ContinuityTracker();
  for (const v of engine.verdicts) tracker.event(v.type, v.beat);
  const continuity = tracker.result();
  const responses = engine.responses ?? [];
  if (responses.length) {
    // the MIDDLE wait from freeze to press, not the mean: one long think must
    // not become the story of the read.
    const sorted = [...responses].sort((a, b) => a - b);
    continuity.hesitationMedianMs = sorted[Math.floor(sorted.length / 2)];
  }

  const timing = engine.timing ?? [];
  const contaminants = [];
  if (engine.waitMode) contaminants.push('assisted');
  // Help switched OFF partway used to be invisible: the engine ends with
  // waitMode false and the caller's sticky flag is the only other witness. But
  // the engine kept the proof all along, a wait-mode press records a
  // responseMs and a timed press records a deltaMs, so BOTH logs having
  // entries means the switch moved during the read.
  if (session.helpToggled || (!engine.waitMode && responses.length > 0) ||
    (engine.waitMode && timing.length > 0)) contaminants.push('help-toggled');
  if (session.tempoChanged || Math.abs(engine.tempo - startTempo) > 1e-9) contaminants.push('tempo-changed');
  if (session.handChanged || engine.hand !== startHand) contaminants.push('hand-changed');
  if (session.rangeChanged || startRange.start !== engine.startBeat ||
    startRange.end !== engine.endBeat) contaminants.push('range-changed');
  if (session.heardAudio) contaminants.push('heard-audio');
  if ((session.restarts ?? 0) > 0) contaminants.push('retry');
  if (session.letterCues) contaminants.push('letter-cues');

  return {
    exerciseId: exercise.id,
    level: clampLevel(exercise.sightLevel ?? 1),
    contentKey: exercise.contentKey ?? exerciseKey(exercise),
    key: exercise.key ?? null,
    meter: exercise.timeSig ?? [4, 4],
    mode: engine.waitMode ? 'guided' : 'independent',
    completed,
    // Recorded, never used to void the read: this is what he chose to do.
    // `scope` travels into the evidence row so a right-hand read of a
    // two-hand exercise can never read back as a read of the exercise.
    conditions: { tempo: engine.tempo, hand: engine.hand,
      start: engine.startBeat, end: engine.endBeat,
      waitMode: engine.waitMode, startTempo, startHand, startRange },
    // Scope is what was actually COVERED, not which button was lit: the right
    // hand of a right-hand-only exercise is the whole exercise, and it is
    // filed under the whole-exercise scope so a consumer keying on it sees it.
    scopeFull: !handsLeftOut && !rangeLeftOut,
    scope: scopeString(clampLevel(exercise.sightLevel ?? 1), engine,
      handsLeftOut, rangeLeftOut),
    presentation: session.presentation ?? session.receipt ?? null,
    accuracy: engine.accuracy(),
    pitch: { required, correct, wrong: stats.wrong, missed: stats.missed,
      unplayed: Math.max(0, required - correct),
      percent: required ? Math.round((correct / required) * 100) : 0 },
    // Timing only exists when the clock ran AND something was played in time.
    // Wait mode says so instead of reporting the 80 that its own freeze
    // produces, and an empty timed run says so instead of "median 0ms behind".
    rhythm: engine.waitMode
      ? { measured: false, reason: CONTAMINANTS.assisted, count: 0 }
      : timing.length === 0
        ? { measured: false, reason: 'No notes were played in time to measure.', count: 0 }
        : { measured: true, onTime: stats.perfect + stats.good, late: stats.late,
            ...timingSummary(timing) },
    continuity,
    contaminants,
  };
}

// Record the read: exposure, ladder, and (only when it earns it) evidence.
// Returns a NEW reading state; the caller assigns and saves it.
export function gradeRead(reading, attempt, now = Date.now()) {
  const r = migrateReading(reading);
  const lvl = clampLevel(attempt.level ?? r.level);
  const key = attempt.contentKey;
  if (!key) throw Error('A read without a content key cannot be recorded.');
  const prior = r.seen[key] ?? null;

  // Novelty comes from the PRESENTATION receipt when there is one: exposure was
  // banked when the score went on screen, so "has he seen this" is already true
  // by the time the read that follows it is graded. The receipt is the only
  // thing that says "this attempt IS that first presentation", it is consumed
  // here, and it cannot be replayed. Without a receipt (legacy callers) fall
  // back to the old question, which is the loophole this replaces.
  const token = typeof attempt.presentation === 'string'
    ? attempt.presentation : attempt.presentation?.token;
  const receipt = token ? PENDING.get(token) : null;
  const receiptValid = !!receipt && !receipt.used && receipt.contentKey === key;
  if (receipt) receipt.used = true;
  const firstAttempt = token ? (receiptValid && receipt.firstRead) : !prior;

  const contaminants = firstAttempt ? [...attempt.contaminants]
    : [...attempt.contaminants, 'repeat-content'];
  const independent = attempt.mode === 'independent' && attempt.completed === true &&
    contaminants.length === 0;

  const ladder = judgeSight(r, attempt.accuracy, attempt.pitch.wrong, attempt);
  const scopeFull = attempt.scopeFull !== false;
  const clean = ladder.verdict === 'clean';
  // An independent CLEAN read of the whole exercise is the only thing that
  // earns the words. A failed read made alone is still made alone, and says so
  // without claiming success.
  const proof = independent && clean && scopeFull;
  const next = { ...ladder.next,
    seen: { ...r.seen, [key]: token && prior
      ? prior                                   // the presentation already counted it
      : { n: (prior?.n ?? 0) + 1, lastAt: now, firstMode: prior?.firstMode ?? attempt.mode,
          firstSeenAt: prior?.firstSeenAt ?? now } },
    reads: [...r.reads], evidence: [...r.evidence], counts: { ...r.counts } };

  const record = { t: now, level: lvl, contentKey: key, mode: attempt.mode,
    verdict: ladder.verdict, completed: attempt.completed, independent, proof,
    ladderMoved: ladder.ladderMoved !== false,
    novel: firstAttempt, contaminants,
    scope: attempt.scope, scopeFull,
    tempoPct: Math.round((attempt.conditions?.tempo ?? 1) * 100),
    pitch: attempt.pitch, rhythm: attempt.rhythm, continuity: attempt.continuity };
  next.reads.push(record);
  if (next.reads.length > READS_KEPT) next.reads.splice(0, next.reads.length - READS_KEPT);

  // The monotonic ledger. Nothing in here is ever trimmed, so no claim the app
  // has already made can be taken back by a later practice session.
  const c = countFor(next, lvl);
  c.reads++;
  if (!scopeFull) c.partialReads++;
  if (clean && attempt.mode === 'guided' && scopeFull) c.guidedCleans++;
  if (proof) {
    c.independentFull++;
    c.lastIndependentAt = Math.max(c.lastIndependentAt, now);
    c.slowestIndependentTempoPct = c.slowestIndependentTempoPct == null
      ? record.tempoPct : Math.min(c.slowestIndependentTempoPct, record.tempoPct);
  } else if (independent && clean) c.independentPartial++;
  next.counts[lvl] = c;

  // Evidence, in the shape teacher.competence() already reads: an assisted
  // pass can never read as 'alone', and an abandoned read is not a pass or a
  // failure, it is nothing.
  if (attempt.completed && ladder.verdict !== 'abandoned') {
    next.evidence.push({ t: now, passed: clean,
      assisted: !independent, novel: firstAttempt,
      scope: attempt.scope ?? `read:L${lvl}:whole`,
      tempoPct: record.tempoPct, scopeFull,
      mode: attempt.mode, contaminants });
    if (next.evidence.length > EVIDENCE_KEPT) next.evidence.splice(0, next.evidence.length - EVIDENCE_KEPT);
  }

  return { reading: next, verdict: ladder.verdict, msg: ladder.msg,
    level: next.level, levelChanged: next.level !== r.level,
    ladderMoved: record.ladderMoved,
    independent, proof, novel: firstAttempt, contaminants,
    scope: record.scope, scopeFull, tempoPct: record.tempoPct,
    credit: creditFor({ completed: attempt.completed, verdict: ladder.verdict,
      independent, clean, scopeFull, proof }),
    pitch: attempt.pitch, rhythm: attempt.rhythm, continuity: attempt.continuity };
}

// Four words, and none of them claims a success that did not happen.
function creditFor({ completed, verdict, independent, clean, scopeFull, proof }) {
  if (!completed || verdict === 'abandoned') return 'none';
  if (proof) return 'independent reading';
  if (independent && clean && !scopeFull) return 'independent reading of a part';
  if (independent) return 'independent attempt';   // alone, but not clean
  return 'guided practice';
}

// ---- what we can honestly say ----------------------------------------------
// Per level, because reading level 2 and reading level 5 are not one number.
// No composite, no percentage of "reading ability".
export function readingSummary(reading) {
  const r = migrateReading(reading);
  const levels = [];
  for (let lvl = 1; lvl <= SIGHT_MAX_LEVEL; lvl++) {
    const count = countFor(r, lvl);
    // The trimmed log is a WINDOW and is labelled as one. Every claim below
    // comes from `counts`, which only ever goes up.
    const recentReads = r.reads.filter((x) => x.level === lvl);
    // competence() takes the LAST pass in whatever array it is handed, so a
    // mixed-scope array would let a right-hand read answer for the exercise.
    // Two arrays, never one.
    const scoped = (e) => (e.scope ?? '').startsWith(`read:L${lvl}`);
    const evidenceFull = r.evidence.filter((e) => scoped(e) && e.scopeFull !== false);
    const evidencePartial = r.evidence.filter((e) => scoped(e) && e.scopeFull === false);
    const pool = poolStatus(r, lvl);
    if (!count.reads && !recentReads.length && !evidenceFull.length && !evidencePartial.length && lvl !== r.level) continue;
    const slowest = count.slowestIndependentTempoPct;
    levels.push({ level: lvl,
      reads: count.reads, guidedCleans: count.guidedCleans,
      independentCleans: count.independentFull, partialScopeCleans: count.independentPartial,
      partialReads: count.partialReads,
      lastIndependentAt: count.lastIndependentAt || null,
      slowestIndependentTempoPct: slowest,
      partialScopes: [...new Set(recentReads.filter((x) => x.scopeFull === false).map((x) => x.scope))],
      evidenceFull, evidencePartial,
      recent: { window: READS_KEPT, reads: recentReads.length,
        note: `the last ${READS_KEPT} reads only; the counts above are lifetime` },
      pool,
      line: count.independentFull
        ? `Read unseen music alone ${count.independentFull}×${slowest != null && slowest < 100 ? ` (slowest ${slowest}% tempo)` : ''}`
        : count.independentPartial ? `Read alone ${count.independentPartial}× at part scope`
        : count.guidedCleans ? `${count.guidedCleans} clean read${count.guidedCleans === 1 ? '' : 's'} with help`
        : count.reads ? 'Read, not yet clean' : 'Not read yet' });
  }
  return { level: r.level, done: r.done, levels,
    legacy: r.legacy, countsSeededFrom: r.countsSeededFrom ?? null,
    pool: poolStatus(r, r.level) };
}

// The results panel's lines. Short, and every one of them is a fact.
export function feedbackLines(result) {
  const out = [result.msg];
  const p = result.pitch;
  out.push(`${p.correct}/${p.required} notes right${p.wrong ? `, ${p.wrong} wrong` : ''}${p.missed ? `, ${p.missed} missed` : ''}`);
  // `median`, and it says median: timingSummary reports the middle value and
  // the half-spread, never a mean, and calling it an average would misdescribe
  // both the number and how a few wild notes do NOT move it.
  out.push(result.rhythm.measured
    ? `Timing: ${result.rhythm.onTime} of ${result.rhythm.count} notes on time, median ${Math.abs(result.rhythm.median ?? 0)}ms ${(result.rhythm.median ?? 0) < 0 ? 'ahead' : 'behind'}`
    : `Timing: ${result.rhythm.reason ?? 'not measured.'}`);
  out.push(`Kept going: longest run ${result.continuity.longestRun}, ${result.continuity.stumbles} stumble${result.continuity.stumbles === 1 ? '' : 's'}`);
  // The mode he played in is not the same fact as whether it went well, and
  // the words must not merge them: a read with nothing played used to be told
  // "this counts as reading new music on your own".
  if (result.credit === 'independent reading') out.push('This counts as reading new music on your own.');
  else if (result.credit === 'independent reading of a part') out.push(`Clean, alone, on the part you chose (${result.scope}). Not a read of the whole exercise.`);
  else if (result.credit === 'independent attempt') out.push('You read that alone, unaided. It did not come off this time, which is what first reads are for.');
  else if (result.credit === 'guided practice') out.push('Practice credit. ' + (result.contaminants.map((c) => CONTAMINANTS[c]).filter(Boolean)[0] ?? ''));
  return out.filter(Boolean);
}
