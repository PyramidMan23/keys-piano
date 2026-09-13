# Package 1: guided vs independent reading — integration report

Date: 2026-09-13. Branch `library-collections`, on top of `cd4e5a6`. Nothing
committed, nothing deployed, no browser storage touched.

## What was wrong, in one paragraph

`Engine` freezes the clock in wait mode, so every accepted press classifies as
`good` and never `perfect`. `accuracy()` weights `good` at 0.8, so a FLAWLESS
guided read scores exactly **80** — measured, not argued: `test/reading-session.mjs`
plays levels 1 and 2 correctly after every freeze and asserts `engine.accuracy()
=== 80`, zero wrong, zero missed, every group satisfied. `judgeSight` required
`accuracy >= 85`, and `startSong` runs sight levels 1-2 with help on by design
(`js/app.mjs:1508`). A beginner reading perfectly could therefore never leave
level 1. Underneath that: a helped, half-tempo, third-time-through read was
scored on the same scale as a first read of unseen music at tempo. Those are two
activities and only one of them is sight reading.

## Changed files (all four are mine; no other file was touched)

| File | What |
| --- | --- |
| `js/sight.mjs` | rewritten: enumerable variant space, real key/beat metadata, guided-aware `judgeSight` |
| `js/reading-session.mjs` | new: the session model (novelty, contamination, evidence, migration, presentation contract) |
| `test/reading-session.mjs` | new: 9 checks, all driving the real `Engine` and the real notation model |
| `reports/reading-session-integration.md` | this file |

`js/engine.mjs` was NOT touched: timing semantics are unchanged, which is why
the 80 is still 80 and the fix is in how a guided read is judged, not in what
the engine measures.

**Ownership, stated precisely.** I own and wrote only the four files above. The
working tree contains other authorized concurrent changes by other agents
(`index.html`, `js/app.mjs`, `js/game.mjs`, `js/lessons.mjs`, `js/teacher.mjs`,
`js/theory.mjs`, `style.css`, `js/learning-ui.css` at the time of writing, and
that list will move). This report makes no claim about the state or content of
any file outside my four, and an earlier draft's statement that `git status`
held only my files was wrong. Line numbers quoted below were read from the live
working copy and will drift: anchor on the function names (`sightState`,
`newSightExercise`, `finishSightRead`, `startArmCountIn`, `memMetronomeTick`,
`songSub`), not on the numbers.

### Backward compatibility, proved not assumed

- `makeExercise(level, seed)` returns **byte-identical** `notes`, `id`,
  `bpm`, `timeSig`, `beatUnit`, `title`, `composer`, `sections` to the old
  implementation for all 15,000 (level, seed) pairs with levels 1-5 and seeds
  1-3000. Verified by diffing against `git show cd4e5a6:js/sight.mjs` in a
  scratch script, and four of those note arrays are now pinned inside
  `test/reading-session.mjs` as a standing regression guard. New fields are
  additive (`key`, `keySource`, `sightLevel`, `variant`, `contentKey`, `bars`,
  `endBeat`, `barBeatCount`).
- `judgeSight(state, accuracy, wrong)` with three arguments behaves exactly as
  before (the guided rule only engages when a fourth `attempt` argument is
  passed). `test/check.mjs` is green, including its existing sight assertions.

## Exported API

### `js/sight.mjs`

| Export | Purpose |
| --- | --- |
| `makeExercise(level, seed)` | unchanged; now carries metadata |
| `variantSpace(level)` | every transform combination at a level, stable order |
| `variantCount(level)` | 36 / 72 / **108 / 108 / 108** raw combinations — NOT the amount of music |
| `exerciseFromVariant(variant, {seed, id})` | build one exercise from a variant |
| `variantFromSeed(level, seed)` | the exact historical draw order, in one place |
| `exerciseKey(song)` | musical identity: notes + meter + key, never the seed, bpm or level label |
| `keyForTranspose(t)` | the key signature a transposition lands on |
| `judgeSight(state, accuracy, wrong, attempt?)` | the level ladder; `attempt` enables the guided rule |
| `clampLevel`, `SIGHT_MAX_LEVEL`, `mulberry32` | unchanged helpers |

### `js/reading-session.mjs` (DOM-free; imports only sight/notation/perform/engine/meter)

| Export | Purpose |
| --- | --- |
| `emptyReading()` | a fresh reading ledger |
| `migrateReading(prior)` | old `{level,cleans,flops,done}` → v2, idempotent |
| `READING_VERSION` | `2` |
| `presentExercise(reading, {intent, level, salt, tempo, hand, now})` | **the call integration uses**: picks the music, BANKS THE EXPOSURE, returns `{reading, presentation, exercise, policy, novel, pool}` |
| `abandonPresentation(presentation)` | he looked and left: kills the receipt, exposure stays spent |
| `presentationValid(presentation)` | is this receipt still good for one first read |
| `readingPlan(reading, {intent, level, salt, tempo, hand})` | **PURE GETTER**, records nothing: for rendering a card or a count |
| `nextExercise(reading, {level, salt})` | the chooser alone, over deduplicated music |
| `contentSpace(level)` | `Map(contentKey → {exercise, variants})`: the actual distinct music |
| `poolSize(level)` | **36 / 72 / 96 / 96 / 96** — distinct engravable music |
| `sessionPolicy(level, intent, exercise, {tempo, hand})` | wait mode, learner tempo, preview, count-in, pulse, restart rule |
| `PREVIEW_SECONDS` | `{'first-read': 10, practice: 6}` |
| `readAttempt(exercise, engine, session)` | reads a finished run off the real engine |
| `gradeRead(reading, attempt, now)` | records exposure, ladder, evidence; returns a NEW ledger |
| `readingSummary(reading)` | per-level honest report; there is no global score |
| `feedbackLines(result)` | the results-panel lines, each one a fact |
| `poolStatus(reading, level)` | `{size, seen, remaining, exhausted, variants}` |
| `engravable(song)` | `notationModel` eligibility, exceptions caught |
| `clampTempo(t)` | bounds a learner tempo to 0.25-2 (tempo 0 makes `msPerBeat()` Infinity) |
| `READS_KEPT` / `EVIDENCE_KEPT` | `60` — the size of the ROLLING WINDOW, not of the counts |
| `CONTAMINANTS` | flag → the sentence the UI prints |

### The presentation lifecycle — the UI must follow this exactly

Exposure is spent when the score goes ON SCREEN, not when the grade runs.
Studying a fresh exercise for ten seconds and then leaving used that music up,
and the old flow let him come back, see it again, and bank "read unseen music
alone 1×" on music he had already studied.

```
 1. score on screen   →  const shown = presentExercise(state.sight, {intent, level, tempo});
                         state.sight = shown.reading;  store.save(state);   // BANK IT NOW
                         render shown.exercise with shown.policy
 2a. he plays          →  const att = readAttempt(shown.exercise, engine,
                                { presentation: shown.presentation, ...flags });
                         const res = gradeRead(state.sight, att);
                         state.sight = res.reading;  store.save(state);
 2b. he leaves / the   →  abandonPresentation(shown.presentation);
     screen changes       (the exposure stays spent; the first-read chance dies)
```

- `shown.presentation` is a one-shot receipt: `{token, contentKey, level, firstRead, at}`.
- **Only the attempt carrying that receipt can be a first reading.** The receipt
  is consumed by the first `gradeRead`; a second grade with it is a repeat.
- The receipt lives in the module's memory, keyed to a session id made at load,
  so **a page reload invalidates every outstanding receipt**. Persisting the
  token and replaying it after a reload earns nothing. That is intended: a
  reload is a second visit to music he has already studied.
- `presentExercise` does not mutate the ledger you pass in; it returns a new one.
  If you do not save it, the exposure is lost, so save it at step 1, not later.
- A repeat presentation of music already seen returns `novel: false` and a
  receipt with `firstRead: false`. Show the "you have read this before" line.

### The `session` argument — what the integrator must pass

Third argument of `readAttempt(exercise, engine, session)`. Everything else is
read off the engine (`waitMode`, `tempo`, `hand`, `startBeat`, `endBeat`,
`stats`, `verdicts`, `timing`, `responses`).

| Field | Type | Meaning |
| --- | --- | --- |
| `presentation` | receipt (or its `token`) | **required for a first read**: the receipt from `presentExercise` |
| `startTempo` | number, 1 = exercise bpm | the tempo **chosen before** the read began |
| `startHand` | `'both' \| 'R' \| 'L'` | the hands chosen before the read began |
| `startRange` | `{start, end}` beats | the passage chosen before the read began |
| `tempoChanged` | bool | the tempo control was moved **during** the read |
| `handChanged` | bool | the hand control was changed during the read |
| `rangeChanged` | bool | the section/chunk/passage was changed during the read |
| `helpToggled` | bool | wait mode was switched on during the read |
| `restarts` | number | restarts of this presentation |
| `heardAudio` | bool | the exercise was played to him before/during |
| `letterCues` | bool | note-name cues were on screen |

A start setting that is absent is taken to be whatever the engine ran with —
i.e. assumed chosen, never assumed changed. The `*Changed` flags exist because
the app rebuilds the engine on a settings change, so the final engine state can
look untouched even though the setting moved mid-read: **pass the flags**, the
end-state comparison alone is not sufficient.

`helpToggled` is the one exception, and it is belt and braces: the module also
infers it from the engine itself. A wait-mode press records a `responseMs` and a
timed press records a `deltaMs`, so if both logs have entries the switch moved
during the read, flag or no flag. Pass the flag anyway; it costs nothing and
covers the case where the app rebuilt the engine.

`gradeRead` returns `{reading, verdict, msg, level, levelChanged, ladderMoved,
independent, proof, novel, contaminants, scope, scopeFull, tempoPct, credit,
pitch, rhythm, continuity}`.

| `credit` | means | UI should |
| --- | --- | --- |
| `'independent reading'` | clean, alone, whole exercise, first read | celebrate; this is the only reading proof |
| `'independent reading of a part'` | clean and alone, but one hand or one passage | credit the part, name the scope, no whole-exercise claim |
| `'independent attempt'` | alone and unaided, did NOT come off | say so plainly; never "this counts as reading new music" |
| `'guided practice'` | help, a repeat, or a setting moved mid-read | practice credit |
| `'none'` | abandoned, or nothing was in range | no reward, no evidence, no ladder movement |

`proof === true` is the ONLY flag a reward or badge may key on.
`ladderMoved === false` means the reading level did not move and the UI should
not announce one.

## The model, in five rules

1. **Guided and independent are different activities.** A guided read is clean
   when every required note was played and none was wrong — the only things a
   frozen clock can measure. An independent read is clean at `wrong === 0` and
   `accuracy >= 85`, the existing timed rule, untouched. Both climb the level
   ladder (levels 1-2 are guided *by design*); only one produces independent
   evidence. **Two things can never move the ladder**: a read with nothing in
   range (an empty hand or an empty passage is not a clean read, it is nothing),
   and a read of part of the exercise.
2. **Novelty is a fact about the music.** Exposure is keyed on `contentKey` =
   the notes, the meter and the key signature (which decides the spelling of
   every note). Deliberately **not** the seed, **not** the nominal bpm and
   **not** the level label: the same notation relabelled is not new music. The
   ledger is flat, so one piece of music is one exposure wherever it is offered.
3. **The pool counts music, not combinations.** At levels 3-5 the transpose list
   holds +7 and -5 (an octave apart) and the register list holds 0 and ±12, so
   `(+7, r)` and `(-5, r+12)` are the same notes — 12 duplicated combinations
   per level. Raw combinations are 36/72/**108/108/108**; actual distinct
   engravable music is 36/72/**96/96/96**, and `poolStatus` reports the latter.
   Counting raw variants would leave the pool claiming material that does not
   exist, forever.
4. **First attempt only, and seeing is exposure.** The clock on "unseen" starts
   when the score goes on screen, so `presentExercise` banks the exposure and
   hands out the single receipt that can turn into a first reading. Attempt two
   on the same content carries `repeat-content` forever.
5. **A setting chosen before the read is a condition, not contamination.** A
   beginner who picks 60% and reads steadily at it is reading: the tempo is
   recorded (`tempoPct`, and the summary prints "slowest 60% tempo"), never used
   to void the read. Likewise hands and passage: those set the evidence
   **scope**, so a right-hand read can never read back as a read of the whole
   exercise. Scope is what was COVERED, not which button was lit: the right hand
   of a right-hand-only exercise is `read:L1:whole`; the right hand of a
   two-hand exercise is `read:L3:hand-R`. What voids a read is help, and a
   setting moved **during** it.
5b. **Counts that a person earned never go down.** `counts[level]` is monotonic
   and is where every claim comes from; `reads`/`evidence` are a 60-row window
   and the summary labels anything derived from them `recent: {window: 60}`.
   Practising used to trim earned proofs out of "read unseen music alone N×".
6. **Pitch, rhythm and continuity are separate**, and anything the run could not
   measure says so: wait mode reports `rhythm.measured === false`, and so does a
   timed run where nothing was played in time (it used to print "median 0ms
   behind" from an empty sample). No composite "reading ability" figure exists
   anywhere. Where a middle value is reported it is called a **median**
   (`timingSummary` returns median and half-spread, never a mean), with the
   on-time count printed beside it in plain numbers.
6b. **The mode he played in is not whether it went well.** `independent` says
   he was unaided; `proof` says it also came off, clean, over the whole
   exercise. Only `proof` earns the words and the reward.
7. **Migration invents nothing, and trusts nothing.** An old ledger keeps its
   level and its read count under `legacy: {reads, level, note: 'Read before
   conditions were recorded…'}`; `evidence` starts empty. A v2 shape out of
   localStorage is clamped and type-checked (`level` to 1-5, `reads`/`evidence`
   must be arrays, counters must be finite): `{v:2, level:9, reads:{}}` used to
   survive as a stuck level 9 and then throw in the summary.

Contamination flags: `assisted`, `help-toggled`, `tempo-changed`,
`hand-changed`, `range-changed`, `heard-audio`, `retry`, `repeat-content`,
`letter-cues`.
`independent === (mode === 'independent' && completed && contaminants.length === 0)`;
`proof === independent && verdict === 'clean' && scopeFull`.
Evidence rows are written in the shape `teacher.competence()` already reads
(`{t, passed, assisted, novel, scope: 'read:L3:whole', tempoPct, scopeFull}`), so
a guided or contaminated pass reads back as **with help** and a clean first read
of new music reads back as **alone**, in the app's existing vocabulary. Nothing
new was invented for it. `readingSummary` hands back **two** arrays per level,
`evidenceFull` and `evidencePartial`: `competence()` takes the last pass in
whatever array it is given, so a mixed one would let a right-hand read answer
for the whole exercise.

## Exact app integration steps

Nothing below is applied: `js/app.mjs`, `sw.js` and `index.html` belong to the
integrator.

**1. `sw.js` — required the moment app.mjs imports the module.**
Add `'js/reading-session.mjs',` next to `'js/sight.mjs'` in `SHELL`, and bump
`VERSION`. Every other module it imports (sight, notation, perform, engine,
meter, source-signature) is already listed. `node tools/shell-check.mjs` is
green today and stays green only if this line is added.

**2. `js/app.mjs:28` — the import.**
```js
// was: import { makeExercise, judgeSight } from './sight.mjs';
import { presentExercise, abandonPresentation, readAttempt, gradeRead, feedbackLines,
         migrateReading, readingSummary, READING_VERSION } from './reading-session.mjs';
```

**3. `js/app.mjs:1926` — the state accessor.**
```js
const sightState = () => (state.sight =
  state.sight?.v === READING_VERSION ? state.sight : migrateReading(state.sight));
```

**4. `newSightExercise` — present the music, bank the exposure, record what he
chose.** This is the step that changed most: `presentExercise` replaces
`readingPlan`, and its returned ledger **must be saved immediately**.
```js
let sightPlan = null, sightSession = null;
function newSightExercise(intent = 'practice', tempo = 1) {
  endSightPresentation();                        // any previous receipt dies here
  const plan = presentExercise(sightState(), { intent, tempo });  // tempo: 1 = exercise bpm
  state.sight = plan.reading;                    // EXPOSURE IS IN HERE
  store.save(state);                             // save it NOW, not after the read
  sightPlan = plan;
  sightSession = {
    presentation: plan.presentation,
    startTempo: plan.policy.tempo, startHand: plan.policy.hand,
    startRange: { start: 0, end: plan.exercise.endBeat },
    tempoChanged: false, handChanged: false, rangeChanged: false,
    helpToggled: false, restarts: 0, heardAudio: false, letterCues: false,
  };
  startSong(plan.exercise);
  if (!plan.novel) falls?.biasNote(plan.poolExhausted
    ? 'You have read every exercise at this level. This one is practice, not a fresh test.'
    : 'You have read this one before: practice, not a fresh test.');
}
// Leaving the screen ends what the screen started (the app's own law). A
// preview he walked away from has still spent the music; only the receipt dies.
function endSightPresentation() {
  if (sightSession?.presentation) abandonPresentation(sightSession.presentation);
  sightPlan = null; sightSession = null;
}
```
Call `endSightPresentation()` from `show()`'s leave path for the play screen
(alongside the existing `leave()` work) and after `finishSightRead` has graded.

If a tempo control is offered before the read (it should be: a beginner reading
at 60% is reading), pass it as `tempo` and it flows into `policy.tempo`,
`policy.pulse.bpm`, `policy.countIn.bpm` and `startTempo`; it is clamped to
0.25-2. Set `$('tempo').value = Math.round(plan.policy.tempo * 100)` in
`startSong` for sight mode instead of the hardcoded `100`, and build the engine
with `repeat: false`.
`plan.exercise` is a valid song (`validateSong` returns `[]` for all 432
variants) and engraves (`engravable` is checked before it is offered).

**5. `startSong` — the help default comes from the policy.**
```js
$('wait-mode').checked = sightMode ? (sightPlan?.policy.waitMode ?? true) : true;
```
Same rule as today (levels 1-2 guided, 3+ in time) plus `intent: 'first-read'`,
which is always in time.

**6. Settings moved DURING a read have to be observed where they happen.** This
is the part the module cannot see for itself: the app rebuilds the engine on a
settings change, so the finished engine can look untouched.
- `$('wait-mode')` change handler: `if (sightMode && sightSession) sightSession.helpToggled = true;`
- `$('tempo')` input/change handler: `if (sightMode && sightSession) sightSession.tempoChanged = true;`
- the hand buttons (`.hand-btn`): `if (sightMode && sightSession) sightSession.handChanged = true;`
- `$('section-select')` / chunk / passage-drag handlers: `sightSession.rangeChanged = true;`
- `$('btn-restart')` and `results-again`: `if (sightMode && sightSession) sightSession.restarts++;`
- `heardAudio` stays false today because `$('btn-hear')` is disabled in sight
  mode. If a "hear it first" affordance is ever added to reading, set it there.
- `letterCues` stays false: the letter cues live on the falls deck and sight
  mode is score-only.

**7. `finishSightRead`.**
```js
function finishSightRead() {
  const ex = sightPlan?.exercise ?? song;
  const res = gradeRead(sightState(), readAttempt(ex, engine, sightSession ?? {}));
  state.sight = res.reading;
  store.save(state);
  const [head, ...lines] = feedbackLines(res);
  $('results-title').textContent = `📖 ${head}`;
  $('results-stats').innerHTML = `
    <span><b>${res.pitch.correct}/${res.pitch.required}</b>notes read</span>
    <span><b>${res.pitch.wrong}</b>wrong</span>
    <span><b>${res.rhythm.measured ? Math.abs(res.rhythm.median) + 'ms' : '—'}</b>median timing</span>
    <span><b>${res.continuity.longestRun}</b>longest run</span>
    <span><b>L${res.level}</b>reading level</span>`;
  $('results-nudge').textContent = lines.slice(1).join(' ');
  $('results-score-pass').style.display = '';
  $('results-score-pass').textContent = 'Next exercise →';
  $('results-theory').hidden = true;
  $('results').hidden = false;
  if (res.credit !== 'none') bankBlock('reading', `${ex.contentKey}|${res.credit}`);
  if (res.proof) comboFlash('READ IT ALONE ★');      // ONLY on proof
  sightSession = null;                               // the receipt is spent
}
```
The `—` in the timing cell is deliberate: help on (or nothing played in time)
means timing was not measured, and the old panel printed `80%` there for a
flawless read. Three rules for this panel:
- **reward only on `res.proof`.** `res.independent` alone includes failed reads
  made unaided, and `credit: 'independent attempt'` must not be celebrated.
- **announce a level change only on `res.levelChanged`**, and note that
  `res.ladderMoved === false` for an empty-scope or part-scope read.
- `bankBlock` is optional but it is how a completed read joins the existing
  practice-block ledger; the ref carries the credit kind so guided practice and
  independent reading never merge. `credit: 'none'` banks nothing.

**8. Preview, count-in and pulse — three existing mechanisms, one new flag.**
- *Preview*: the timed path already waits for a key press before starting
  (`armed` at the end of `rebuildEngine`), which IS the score preview. Use
  `plan.policy.preview.seconds` only to word the banner: "Take 10 seconds to
  look it over, then press any key."
- *Count-in*: `startArmCountIn()` already plays one bar of clicks before a timed
  run. It hardcodes 4 beats and the engine's current `msPerBeat()`, which
  already follows the chosen tempo; `policy.countIn` carries the exercise's real
  bar length and the tempo-adjusted bpm, and is the value to read if a 3/4 or
  6/8 kernel is ever authored.
- *Pulse*: copy the `memMetronomeTick()` pattern, gated on
  `sightPlan?.policy.pulse.continuous`. It is beat-driven off `engine.beat`, so
  it stops by itself in wait mode and follows a slower chosen tempo for free;
  and because it goes through `metClick()`, the leave-a-screen law is already
  satisfied.
- *No restart on error*: sight mode has no restart-on-error path today. Keep it
  that way; `policy.restartOnError` is `false` for both intents and is there so
  the rule is explicit rather than accidental.

**9. Where `readingSummary()` belongs.** The trophies/evidence surface, as one
row per level ("Read unseen music alone 3× (slowest 60% tempo)" / "Read alone 2×
at part scope" / "4 clean reads with help" / "Not read yet") plus the pool line
("28 of 36 exercises at this level seen"; levels 3-5 have 96, not 108). Do not
sum them into a single number. Every number on that row is lifetime; anything
under `level.recent` is the last 60 reads only and must be labelled that way if
it is shown at all. Use `level.evidenceFull` for any whole-exercise claim and
`level.evidencePartial` for part-scope work; never concatenate them.

## Supervisor findings 1-4 (2026-09-13), each fixed and each with a test

1. **The pool counted combinations, not music.** Confirmed by direct
   enumeration: levels 3/4/5 have 108 variants and **96** distinct contents,
   because `+7` and `-5` are an octave apart and the register list holds `±12`.
   `poolStatus` compared distinct seen keys to the raw count, so it would have
   reported remaining material forever after all real music was exposed. Fixed:
   `contentSpace(level)` deduplicates and drops anything the engraver refuses,
   `poolSize` is that size, and selection walks the deduplicated set. The test
   *derives* the 12 duplicate pairs per level by building both variants and
   comparing notes, then exhausts levels 1 and 3 by visiting 36 and 96 unique
   pieces of music with real reads — no dummy keys inserted.
2. **A slow tempo chosen before a first read is legitimate.** `slow-tempo` is
   gone. The chosen tempo, hands and range are recorded as conditions
   (`tempoPct`, `scope`, `scopeFull`) and only `tempo-changed`, `hand-changed`,
   `range-changed`, `help-toggled` (all DURING the read) void it. `sessionPolicy`
   and `readingPlan` take the learner's tempo and feed it to the pulse and
   count-in. Tested both ways: 60% chosen before → independent, recorded, and
   the summary prints "slowest 60% tempo"; 60% reached by moving the slider
   mid-read → `tempo-changed`, not independent; and a change that was reverted
   is caught by the explicit flag.
3. **Identity is the notation, not the labels.** `exerciseKey` is now
   `key + songSignature(notes, meter)` with bpm pinned to a constant, and the
   exposure ledger is flat rather than per level. Tested: the same notes with a
   doubled bpm and a different `sightLevel` give the same key; different notes,
   a different key signature (different spelling) or a different meter give
   different keys. (There are no cross-level identical note sets in the current
   kernel catalogue — enumerated, zero — so this changes no existing count.)
4. **Median was called an average.** `feedbackLines` now reads "12 of 14 notes
   on time, median 23ms behind", and `continuity.hesitationMs` was renamed
   `hesitationMedianMs`. Tested by regex, including a negative assertion that
   the word "average" does not appear in the timing line.

## Cold review (Codex, 2026-09-13): nine findings, all fixed, all with tests

Reproduced on a green suite; the pool arithmetic, `exerciseKey`, the wait-mode
fix and the migration honesty were re-checked and stood.

1. **A read with ZERO notes in scope was judged clean and levelled him up.**
   `correct >= required` is vacuously true at `required === 0`, so choosing the
   left hand on a right-hand-only exercise (or a practice range past the last
   note) and pressing nothing read as a flawless guided read; twice was a level
   up. Fixed in `judgeSight`: an empty scope is `abandoned`, `ladderMoved:
   false`, `credit: 'none'`, no evidence. Both routes are in the test.
2. **The score preview was free.** Exposure was recorded at grade time, so
   studying a fresh exercise for ten seconds and leaving (or reloading) handed
   the same `contentKey` back as novel, and a read of studied music banked "read
   unseen music alone 1×". Fixed with the presentation lifecycle above:
   `presentExercise` banks the exposure and issues a one-shot receipt, and only
   the attempt carrying it can be a first read. Six cases tested: preview→play
   (valid once), duplicate grade, preview→leave→reopen, preview→reload with a
   replayed token, abandoned run, and help/retry inside a valid presentation.
3. **"Read unseen music alone N×" went DOWN.** It was counted out of the 60-row
   rolling log, so 45 practice reads erased 5 earned proofs. Fixed with
   monotonic `counts[level]`; the test earns 3 proofs, then does 65 practice
   reads, then asserts the log trimmed to 60 and the 3 proofs are still there.
4. **The summary handed `competence()` a mixed-scope array**, so two right-hand
   reads read back as "alone" for the exercise. Fixed: `evidenceFull` and
   `evidencePartial`, with no mixed array present to grab by mistake.
5. **Part-scope reads advanced the ladder.** `judgeSight` ran before `scopeFull`
   existed. Fixed by passing the attempt's scope into the ladder: a part-scope
   read keeps its honest verdict and its own evidence line, and moves nothing.
   `guidedCleans` is scope-filtered too. Scope is now what was COVERED, so the
   right hand of a right-hand-only exercise is `read:L1:whole`.
6. **A failed read was told it counts.** `credit` came from `independent` alone,
   so a timed read where nothing was played printed "This counts as reading new
   music on your own". Fixed with four credit words; `proof` is the only one a
   reward may key on, and "independent attempt" keeps the mode information
   without claiming the success.
7. **Help switched OFF mid-read was invisible.** Fixed by inferring it from the
   engine's own two logs: wait-mode presses record `responseMs`, timed presses
   record `deltaMs`, and both being non-empty means the switch moved. The test
   drives two groups in wait mode, flips `waitMode`, finishes in time, and
   passes NO sticky flag.
8. **A median was reported when nothing was timed** ("median 0ms behind" from an
   empty sample). Fixed: `rhythm.measured === false` with "No notes were played
   in time to measure."
9. **Corrupt v2 state passed through unvalidated** (`{v:2, level:9, reads:{}}`
   survived as a stuck level 9 and threw `TypeError` in the summary). Fixed with
   clamping and type checks, plus tempo bounds (0.25-2; `tempo: 0` gave
   `msPerBeat() === Infinity`) and `policy.repeat === false` so a looped lap
   cannot wipe the evidence mid-read.

## Tests

Per the supervisor's instruction, only the two node suites were run for this
round:

```
node test/reading-session.mjs     18 checks passed
node test/check.mjs               ALL GREEN: 503 checks passed
```
Run 2026-09-13 in `C:\Users\markh\keys-piano-astra` against this checkout, with
the other agents' concurrent changes present in the tree. (`check.mjs` reads 503
rather than the 440 of the previous round because other workers have added
songs and checks to it; none of those are mine.)

Earlier in the package (before the supervisor round) these also passed here:
`node test/import-roundtrip.mjs`, `node test/five-improvements.mjs`,
`node tools/shell-check.mjs`, `node tools/hand-audit.mjs`,
`node tools/finger-check.mjs`.

The eleven checks:
1. **the dead end, reproduced** — correct wait-mode responses at levels 1 and 2
   score exactly 80 with zero wrong and zero missed, and the old three-argument
   rule refuses to advance them twice.
2. **the fix** — two clean guided reads move 1→2, two more move 2→3, level 3
   turns the clock on, and a declared first read is always in time.
3. **contamination** — helped, retried, abandoned, hand-changed-mid-read,
   range-changed-mid-read, pre-heard and repeated reads are each refused as
   unseen-reading evidence; a clean timed first read of new music reads back as
   `alone` through `teacher.competence()`, the helped one as `with help`. A
   non-sight song throws rather than entering the ledger.
4. **chosen conditions** (finding 2) — a 60% tempo or a one-hand scope chosen
   before the read counts, is recorded, and lands in the right ledger line;
   the same values reached by moving a control mid-read do not.
5. **rough reads** — a guided read full of wrong notes is `rough`, and two of
   them step the level back down.
6. **identity** (finding 3) — four note arrays pinned from `js/sight.mjs` **at
   commit cd4e5a6** still come out of `makeExercise` unchanged; real seed
   collisions are found; a relabelled bpm/level is the same music; different
   notes, key or meter are not.
7. **the real pool** (finding 1) — the 12 duplicate pairs per level are built
   and compared, 108 raw vs 96 real is derived, and levels 1 and 3 are
   exhausted by visiting every unique piece of music, after which the pool
   reports `remaining: 0` and the next read is honestly not novel.
8. **432 exercises** (every variant at every level) — `validateSong` clean,
   stated key matches the transposition, every note belongs to that key, every
   note is spelled by the key signature alone (F major really prints B flat, D
   and A really print sharps), `notationModel` agrees on key, meter and bar
   count, stated duration is the real duration, and every one engraves.
9. **the presentation contract** — preview is score-only and silent, one bar of
   count-in and a continuous pulse for a first read, neither for a guided read,
   never a restart on error.
10. **migration and persistence** — an old ledger keeps its level and read
    count, invents no evidence, migrates idempotently, folds an early per-level
    exposure map into the flat one, survives a JSON round trip, and the summary
    exposes no global ability number.
11. **median wording** (finding 4).

And the seven cold-review blocks:

12. **nothing in range** — an empty hand and an empty passage, twice each: never
    clean, never a level up, no evidence, no credit.
13. **part scope** — two right-hand reads of a two-hand exercise: honest clean
    verdicts, no ladder movement, `independentCleans` 0, split evidence arrays,
    and the right hand of a right-hand-only exercise filed as `whole`.
14. **the presentation lifecycle** — preview→play valid exactly once; duplicate
    grade; preview→leave→reopen; preview→reload with a replayed token; an
    abandoned run banking exposure once and evidence never; help and retry
    inside a valid presentation; and `readingPlan` proven to mutate nothing.
15. **monotonic counts** — 3 proofs, then 65 practice reads, then the log has
    trimmed to 60 and the 3 proofs are still there and labelled lifetime.
16. **failed reads and empty timing** — a timed read where nothing was played is
    `independent attempt`, never celebrated, and reports no median.
17. **help off mid-read** — inferred from `engine.responses` + `engine.timing`
    with no UI flag passed.
18. **corrupt state and bounds** — `{v:2, level:9, reads:{}, evidence:'nope'}`
    is clamped and type-checked instead of crashing or sticking; `tempo` 0, -2,
    0.05 and 99 all clamp; `policy.repeat === false`.

Not run, deliberately: the browser gates (`tools/gates.mjs`), `tools/worklist.mjs`,
Chrome, any deploy or commit. **A full `tools/worklist.mjs` run was started
prematurely by this worker and was interrupted by the supervisor; it produced no
results and provides NO acceptance evidence for anything in this package.**
Acceptance, including the browser gates after app.mjs is wired, is Codex's.

## What the UI worker MUST do (nothing below is optional)

1. Add `'js/reading-session.mjs'` to `SHELL` in `sw.js` and bump `VERSION`.
2. Use `presentExercise`, not `readingPlan`, when the score goes on screen, and
   **save the returned ledger immediately**. `readingPlan` records nothing.
3. Pass `session.presentation` into `readAttempt`. Without it, a read can never
   be a first reading under the new rules (the legacy fallback only helps
   callers that never present).
4. Call `abandonPresentation(presentation)` on every path that leaves the read:
   screen change, Home, Back, starting a different exercise. The app's
   leave-a-screen law already has the hook.
5. Record the before-the-read settings (`startTempo`, `startHand`,
   `startRange`) and set `tempoChanged` / `handChanged` / `rangeChanged` /
   `helpToggled` / `restarts` in the controls' own handlers.
6. Build the reading engine with `repeat: false` and a clamped tempo
   (`policy.tempo`), and set `$('tempo')` from the policy rather than 100.
7. Gate every reward, celebration and badge on `res.proof`. Announce a level
   change only on `res.levelChanged`.
8. Render `readingSummary` per level using the lifetime counts and the two
   evidence arrays; label anything from `level.recent` as the last 60 reads.
9. Sight exercises are score-only: keep `heardAudio` and `letterCues` false
   unless the surface actually offers those things.

## Limitations, honestly

- **Not wired.** No app surface calls any of this yet. Nothing in the running
  app has changed behaviour except that a sight exercise now carries a real key
  signature, so the engraved score prints one and spells by it. That is a
  visible change and it has not been looked at in a browser.
- **The receipt is in-memory, by design.** It dies on reload, which is the
  intended semantics for "you already studied this". The consequence to know:
  if the page reloads between the preview and the read (a service-worker update,
  a crash), the learner loses that piece's first-read chance. The exposure is
  real either way, so this is the honest side of the trade.
- **A preview he never plays still spends the music.** That is the point, and it
  means an idle tap on "new exercise" costs a piece of the finite pool. If that
  proves annoying in use, the fix is a confirm-before-showing step in the UI,
  not a change to when exposure is banked.
- **`songSub` will now label a sight exercise "Easy tier · D · 4/4 · 66 bpm"**
  because the key is present and `level` is undefined (`s.level ?? 'easy'` in
  `songSub`). The tier word is wrong for an exercise. It was wrong
  before too; the key metadata just makes the line longer. One-line fix in the
  integrator's file.
- **The pool is 36 at level 1 and 96 at levels 3-5** (not 108: 12 of each
  level's combinations are duplicate music). Honest, and small. Once exhausted,
  a level offers practice, never fresh assessment. More kernels is the only real
  fix; `variantSpace` and `contentSpace` will pick them up automatically.
- **`contentSpace` is memoised per level** for the life of the page. It is pure
  and deterministic, so that is safe, but a change to `KERNELS` needs a reload
  to be seen.
- **Scope strings are honest but ugly** (`read:L3:both:b0-4`). They are keys,
  not UI copy; the summary already renders them, and a nicer label is the
  integrator's call.
- **`gradeRead` records exposure even for an abandoned read.** He saw the music,
  so it is no longer unseen. That is deliberate, and it means leaving the screen
  mid-read spends a fresh exercise.
- **The reading ledger grows with exposure**: up to 396 content keys
  (36+72+96+96+96), roughly 18KB of `localStorage` at full exhaustion of every
  level. Reads and evidence
  are capped at 60 each; the exposure map is not, because pruning it would
  re-manufacture novelty.
- **Nothing here has been played on the P-45.** Every result above comes from a
  simulator driving the real `Engine`. Response latencies, count-in feel and
  whether 10 seconds of preview is the right number need a real learner.
- **Packages 2-6 of the brief are untouched** and belong to other owners.
