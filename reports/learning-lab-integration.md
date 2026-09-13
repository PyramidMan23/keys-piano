# The learning lab: what it is, how to wire it, and what it will not claim

`js/learning-lab.mjs` (new, DOM-free) + `test/learning-lab.mjs` (54 checks, node
only). Built 2026-09-13 for packages 2 to 6 of the supervised learning brief.
Nothing outside those two files and this report was touched: package 1
(sight-reading progression) belongs to `js/sight.mjs` / `js/reading-session.mjs`
and their owner, the notation renderer for `render` belongs to
`js/lab-score.mjs` and its author, and the shared UI belongs to the integrator.

It is not wired into the app. Nothing imports it yet. That is the integrator's
job and this document is the spec for it.

---

## 1. What it adds

The app already teaches staff notes, landmarks, intervals, triads, chords from
symbols, inversions, phrases, technique and ear-copy rhythm. It did **not**
teach written rhythm, rests, dots, ties, flats, the accidental carry rule, key
signatures, compound metre, triplets, vertical two-hand reading, applied
harmony inside real music, or expression with measured evidence.

29 authored cards across four tracks add exactly those, and nothing that
already exists was duplicated or replaced:

| reused from | used for |
| --- | --- |
| `rhythm.mjs` `RhythmRound`, `TAP_WINDOW_MS`, `makeCountCells` | the onset matcher and count row on every tap rung |
| `teacher.mjs` `triadMidis`, `inversions`, `nearestVoicing` | every chord and inversion in the applied track (the test asserts agreement, so there is one definition of a triad in this app) |
| `teacher.mjs` `recordAttempt`, `competence`, `competenceLine`, `evidenceDate`, `RETENTION_MIN_DELAY` | the evidence shape and the assisted/independent/retained vocabulary |
| `game.mjs` `grantXp`, `recordBlock` | rewards and practice blocks: one currency, existing sources, existing once-only ledger |
| `lessons.mjs` `explainMiss`, `evenEnough` | the miss explanation after a wrong-pitch rung |
| `artic.mjs`, `voicing.mjs`, `pedal.mjs` | every measured expression verdict |
| `sight.mjs` `mulberry32` | deterministic variant generation |
| `notation.mjs` `spellPitch` | MIDI back to a written token for generated variants |

Every card is a five-rung ladder: **worked example → guided attempt →
independent challenge → later recall → transfer to different material.**

---

## 2. The roster, and what each card actually measures

### Written rhythm (`track: 'rhythm'`)
| id | title | what it measures |
| --- | --- | --- |
| `rh-pulse` | The pulse, and quarter notes | Onset timing against the written beat, within 150ms. Nothing else. |
| `rh-values` | Whole, half and quarter notes | Onset timing AND how long each key was actually held. Right onsets with wrong lengths is a fail, not a near miss. |
| `rh-rests` | Rests: the silence is written too | Onsets, held lengths, and whether any key was still sounding during a written rest. |
| `rh-eighths` | Eighth notes and the "and" | Onsets at half-beat positions, and held lengths on the played rungs. |
| `rh-eighth-rests` | Eighth rests | Half-beat onsets, held lengths, silence through every eighth rest. |
| `rh-dots` | The dot adds half again | Onsets and held lengths, where the length is the thing the dot changes. |
| `rh-ties` | Ties across beats and bar lines | Exactly one onset per tied pair and a hold covering the combined value. A second attack fails. |
| `rh-tie-vs-slur` | A tie is not a slur | Tie: one onset, full hold. Slur: two onsets joined within 80ms. Played evidence, not a label. |
| `rh-three-four` | Three-four time | Onsets and lengths against a three-beat bar. |
| `rh-six-eight` | Six-eight: two big beats | Onsets and lengths against a compound bar whose beat unit is the dotted quarter. |
| `rh-triplets` | Triplets: three in the time of two | Onsets on the one-third grid inside the beat. |

### Notation (`track: 'reading'`)
| id | title | what it measures |
| --- | --- | --- |
| `nt-flats` | Flats, spelled as flats | The actual key pressed for a flat-spelled note. |
| `nt-naturals` | Naturals, and how long an accidental lasts | The key pressed for every note head, **including the ones with no sign in front of them**. The only way to see whether the carry rule was read. |
| `nt-key-signatures` | Key signatures: F, G, B flat, D | The pitches played under a signature, with nothing printed on the note heads. |
| `nt-enharmonics` | Two names, one key | The key pressed for each spelling, plus a context question that never stands alone. |
| `nt-symbols` | Dynamics and articulation marks | Staccato/legato from real releases; loud against soft on the same key from velocity. |
| `nt-ledger` | Ledger lines and the far registers | The key pressed above and below the staves, where the octave is what goes wrong. |
| `nt-position` | The same notes, a different place | The keys pressed when the same shape starts somewhere new. Kills note-to-finger association. |
| `nt-intervals-ahead` | Landmark, then interval, then look ahead | Notes played in order from an unseen phrase, with a look-ahead preview. |
| `nt-vertical` | Two hands, one grid | Whether the hands **arrive together** on shared onsets, inside 120ms. |

### This passage (`track: 'applied'`)
| id | title | song it is grounded in |
| --- | --- | --- |
| `ap-am-still-dre` | A minor, in Still D.R.E. | `still-dre-easy` / Loop 1 (beats 0-8) |
| `ap-c-ode-to-joy` | C major, in Ode to Joy | `ode-to-joy` / Phrase A (0-16) |
| `ap-g-happy-birthday` | The five chord, in Happy Birthday | `happy-birthday` / Lines 1-2 (0-12, 3/4) |
| `ap-cm-game-of-thrones` | C minor and its flats | `game-of-thrones-easy` / Theme (0-24, 3/4) |
| `ap-cadence-study` | I, IV, V, I | no catalogue song claimed; an original study piece |

Each runs the brief's sequence: recognise the chord on the staff → play it
blocked → play the written broken pattern → play two inversions → back to the
real passage at its exact settings, with a technique link to the shipped scale
(`scale-a-minor`, `scale-c-major`, `scale-g-major`, `scale-c-minor`) and one
short expression goal.

### Expression (`track: 'expression'`)
| id | title | needs | behaviour without it |
| --- | --- | --- | --- |
| `ex-touch` | Joined, or separated | note-off times | degrades to a listening check |
| `ex-dynamics` | Loud and soft, on purpose | velocity | degrades to a listening check |
| `ex-balance` | Melody over accompaniment | velocity **and** touch calibration | refuses to score, teaches anyway, says calibration is what is missing |
| `ex-pedal` | Changing the pedal with the harmony | a sustain pedal | no pedal is "no judgement", never a fail |

---

## 3. The API

```js
import {
  LAB_CARDS, cardById, labRoster, TRACKS,          // content
  resolveAppliedCards, passageContext,             // the real-song gate
  startCard, LabSession,                           // the runner
  recordLabResult, recordRecovery,                 // the ledger
  labProgress, labSummary, labBadges, labLabel, labNextLine, celebrationFor,
  dailyRoute, configureRoute, skipSegment, easyReadingNext, nextLabCard,
  migrateLab, stageAvailable, nextStageKind,
} from './learning-lab.mjs';
```

### Opening a card

```js
const session = startCard(state, 'rh-values', {
  now: Date.now(),
  stage: 'independent',                 // optional; omitted = nextStageKind()
  capabilities: { velocity: true, noteOff: true, pedal: false },
  cal: state.touchCal ?? null,          // touch.mjs calibration, or null
  resolvedApplied,                      // from resolveAppliedCards(SONGS)
});
```

`session.state()` returns everything a screen needs, and nothing it does not:

| field | use |
| --- | --- |
| `title`, `say[]`, `teaches[]`, `measures` | the copy. `teaches` is only populated on the worked rung. |
| `render` | the symbol spec (section 4) |
| `song` | a **rendering-compatible song object**: hand it straight to `ScoreView`, `EngravedScore` or `Engine` |
| `countRow` | `makeCountCells` output for the count strip (null in 6/8) |
| `msPerBeat`, `bpm`, `meter`, `countIn` | the clock for the count-in and the playhead |
| `targets[]` | lit keys — **only populated when the rung allows help**; empty otherwise |
| `nextTarget` | for a hint button's preview |
| `help` | `{id, text}` of the scaffold this rung shows |
| `ask` / `selfCheck` | a multiple choice, when there is one |
| `passage` | the return-to-passage context on an applied transfer rung |
| `technique`, `expressionGoal` | the routes out of the card |
| `support`, `degraded` | whether the measurement is possible on this hardware |
| `assisted`, `assistReasons[]`, `hints` | why this attempt is worth what it is worth |
| `retries` | `{used, max: 3, left}` |
| `progress` | `{played, of, taps}` |
| `contentId` | content identity, for novelty |

### Feeding input

Every input method takes an explicit `at` in **milliseconds from beat zero**
(after the count-in), so the whole thing is deterministic and testable.

```js
session.begin(0);
session.noteOn(60, { at: 0, velocity: 74, source: 'midi' });   // or 'key' / 'click'
session.noteOff(60, { at: 950, source: 'midi' });
session.tap({ at: 1000 });              // tap rungs: any key, any device
session.pedal(true, { at: 0 });         // CC64 as a boolean, transitions only
session.answer('right');                // a multiple choice or a self check
session.hint();                         // → {keys, text}; makes the attempt assisted
session.recordPassage({ acc, wrong, assisted, hand, tempo, wait, section });
const result = session.finish({ now: Date.now() });
```

**The device never changes the score.** A computer-keyboard or click player is
scored identically to the P-45. The only thing a device changes is whether a
measurement is *possible at all* (velocity, note-off, pedal), and where it is
not, the rung becomes an honest listening check rather than a fake pass.

### Recording

```js
const record = recordLabResult(state, result, { now });
// → { outcome, xp: [...], blocks, refused: [...], competence, day }
```

`outcome` is one of `practice` · `independent` · `retained` · `transferred` ·
`not-yet` · `self-report` · `introduced`. `refused[]` carries the sentence for
every claim that was downgraded, and it is meant to be shown.

**The outcome decides what gets STORED, not just what gets said.** One function,
`qualifiedSlot(stage, outcome)`, decides which rung an attempt actually
completes, and progress, due dates, the summary and the badges all read it:

| outcome | rung it completes |
| --- | --- |
| `retained` | `recall` |
| `transferred` | `transfer` |
| `independent` | `independent` (whichever rung was played; the record carries `via`) |
| `practice` | `guided`, and only when the guided rung was the one played |
| `not-yet` / `self-report` | none |

Anything that completes no rung is still recorded, under
`state.lab.cards[id].practice[stage]` and in the evidence array, and surfaces as
`labProgress(...).rungs[].practiced`. A helped pass, a recall with no provable
delay behind it and a repeated transfer therefore leave their rung **open** in
the stored state, not merely in the label.

Then `recordRecovery(state, cardId, { fixed: true })` after a repair attempt on
`result.recovery` (a single bar, never a restart of the rung).

### State shape

Everything lives under `state.lab`, a new namespace. `state.mastery`,
`state.playable`, `state.journeys`, `state.teacherLessons`, `state.lessons`
and every other existing ledger are **untouched**.

```
state.lab = {
  v: 1,
  cards:  { [cardId]: {
    evidence[], selfChecks[], seenContent[], attempts, recoveries,
    stages:   { [rung]: { passedAt?, selfReportedAt?, at?, date, contentId, assisted, outcome, indices[], via? } },
    practice: { [rung]: { attempts, lastAt, date, lastOutcome } },   // attempts that qualified for nothing
  } },
  skills: { [labSkillId]: <teacher.mjs recordAttempt record> },
  days:   { 'YYYY-MM-DD': { xpEvents, blocks } },
  clock:  { lastNow, suspect, suspectUntil, recoveredAt, rollbacks },
  route:  { order[], minutes{}, skipped{} },
}
```

Read it through the helpers rather than by hand: `rungEarned(st, cardId, kind)`
for "has this been earned", `labProgress(...).rungs[]` for the display row
(`done` · `selfReported` · `practiced` · `via` · `outcome`), and
`clockStatus(st)` for the one sentence to show if the device clock is behind.

XP goes through `game.mjs`'s own ledger with existing sources and stable refs:

| outcome | source | ref | frequency |
| --- | --- | --- | --- |
| first independent pass | `lessonCleared` | `lab:<cardId>` | once, ever |
| retained (delayed recall) | `passageRetention` | `lab:<cardId>:<YYYY-MM-DD>` | at most once per card per day, and only when a real delay is proven |
| transferred | `transfer` | `lab:<cardId>` | once, ever |
| practice / assisted / repeat | none | — | practice **blocks** only |

Plus a soft cap of **4 lab XP events per day**. Past the cap the practice still
banks blocks and evidence; it just stops paying. No second currency exists.

---

## 4. Rendering requirements (exact)

Two representations, from one authored source, with a **hard split of
authority**:

| artifact | authority for | never used for |
| --- | --- | --- |
| `state().song` | the **engine and the audio**: playback, the clock, wait mode, the practice surface | notation of any kind |
| `state().render` | the **page**: every note head, accidental, rest, tie, beam group, tuplet bracket and mark | playback |

> ☠️ **CORRECTION (cold review finding 5).** An earlier version of this document
> told the integrator that the song object was "already valid for …
> `EngravedScore`, `ScoreView`". It is valid in the sense that nothing refuses
> it — and that is exactly the danger. The song object carries MIDI numbers and
> a key name, and `engraving.mjs:39` re-derives every head with
> `spellPitch(n.m, key)`, which returns the SHARP for a flat-spelled note: a
> different staff line, not merely a different sign. "Flats, spelled as flats"
> would have printed sharps, and "C minor and its flats", whose teaching says
> "down one key onto the black E flat", would have printed D♯. Across the
> curriculum **50 of 1282 note heads** would be drawn on the wrong line that
> way (check 50 measures it). `render` carries the authored spelling and is the
> only notation authority. Every lab song object now says so in a field:
> `song.labNotation === 'render'`.
>
> The renderer that consumes `render` is `js/lab-score.mjs`, owned by a
> separate author. This module does not draw anything.

**(a) The song object** — `state().song`. Valid for `validateSong`,
`notationModel` and `Engine`, and intended for `Engine` and playback. Notes
carry `b`/`d` in the song's own beat unit (6/8 ships `beatUnit: 8` and a bpm
counted in eighths, exactly as `fur-elise` does), and it is flagged
`labStudy: true`, `notRepertoire: true` and `labNotation: 'render'`.

> ☠️ **Never push a lab song into `SONGS`, a shelf, a collection or a
> recommendation.** They are original exercises. The test asserts none of their
> ids exist in the library.

**(b) The symbol spec** — `state().render`, the page itself. Deliberately the
same vocabulary `engraving.mjs` already feeds VexFlow:

```js
{
  kind: 'grand-staff' | 'treble-staff' | 'bass-staff',
  keySignature: 'C' | 'F' | 'G' | 'Bb' | 'D' | 'Db' | 'Am' | 'Cm' | ...,  // VF Stave.addKeySignature
  meter: [4, 4], bars: 2, title,
  tempoText: '♩ = 72' | '♩. = 60',       // compound metres print the dotted beat
  beatUnitName: 'quarter' | 'dotted quarter',
  countInBeats: 2,
  staves: [{
    hand: 'R' | 'L', clef: 'treble' | 'bass',
    bars: [{ index, cells: [{
      duration: 'w'|'h'|'q'|'8'|'16',    // VF StaveNote duration, dots separate
      dots: 0 | 1,                        // VF.Dot.buildAndAttach when 1
      rest: true | false,                 // append 'r' to duration for VexFlow
      at,                                 // beats from bar 0 beat 0, quarter units
      keys: ['bb/4'],                     // VF key strings, already spelled
      accidentals: ['b' | '#' | 'n' | null],   // what the PAGE prints, per key
      tie: null | 'start' | 'stop' | 'both',   // VF.StaveTie between adjacent cells
      tuplet: null | { base: '8', n: 3, of: 2, id: 'bar:group' },  // VF.Tuplet, group by id
    }] }],
  }],
  marks: [{ kind, value, at | from, to, text }],
}
```

`marks` is the supplemental symbol layer, and the integrator implements these
five kinds:

| `kind` | `value` | how to draw it |
| --- | --- | --- |
| `dynamic` | `'p' \| 'mf' \| 'f'` | under the staff at beat `at`, VexFlow `TextDynamics` or the app's own type |
| `articulation` | `'staccato'` | a dot above/below every note head from beat `from` to `to` (VF `Articulation('a.')`) |
| `slur` | — | a curve from beat `from` to beat `to` (VF `Curve`) |
| `tie` | — | already on the cells; `marks` never carries a tie |
| `pedal` | — | a pedal bracket from `from` to `to` |
| `text` | free text | a direction above the staff at `at` |

Rests: cells with `rest: true` carry a placeholder key (`b/4` treble, `d/3`
bass) exactly as `engraving.mjs` does. Accidentals: the `accidentals` array is
what the *written token declared*, so a courtesy accidental is preserved. If
you would rather let VexFlow decide, `VF.Accidental.applyAccidentals(voices,
keySignature)` gives the conventional result; do not do both.

**Tuplet brackets.** Group cells by `tuplet.id` and build one `VF.Tuplet` per
group. Ids are monotonic within a bar (`0:0`, `0:1`, …), every group holds
exactly its `n` cells and they are contiguous; the module throws at authoring
time if a pattern breaks a group, and check 43 asserts it for the whole
curriculum. Two triplet groups in one bar are two `3:2` brackets, never one.

**The count row.** `state().countRow` is a list of
`{ label, pos, active, beat, strong }` in quarter-note units from the bar start.
The grid is taken from the authored onsets, not assumed: eighths for ordinary
bars (`1 & 2 &`), thirds for triplet bars (`1 trip let`), sixteenths where the
music needs them, and the six eighths of a 6/8 bar with `beat: true` on the two
dotted-quarter beats. `pos` is directly comparable with a target's `at % barLength`.
Check 44 asserts that every rung declaring `help: 'countRow'` has a row, and
that the row has a lit cell for every note the page asks for.

**Scaffolds the UI must implement** (the `help` id on a rung, and the reason an
attempt is assisted):

| id | what it shows |
| --- | --- |
| `countRow` | the count strip lighting each beat (`state().countRow`) |
| `litKeys` | the target keys lit (`state().targets`) |
| `holdBar` | a bar under each note showing its written length |
| `restMarkers` | rests marked with a lift cue |
| `intervalLabels` | the distance between each pair of notes printed |
| `velocityMeter` | how hard each press landed |
| `pedalMarks` | lift-and-catch marks under the staff |

Visual contract: the existing dark green chrome, Fraunces titles, mint actions,
cream notation page, hand colours that are never colour-only (Mark is colour
blind), 44px targets, 390px layouts, reduced motion honoured. The lab produces
no colour, size or spacing of its own, and `celebrationFor()` returns
`{ tone, line, mark, duringPlay: false, reducedMotionSafe: true }` — one line
and one glyph, never an overlay, never during playing.

---

## 5. The laws it enforces, and the tests that hold them

| law | where | test |
| --- | --- | --- |
| A multiple-choice label can never certify playing | every `independent`/`recall`/`transfer` rung takes physical input | check 1 |
| Right onsets with wrong lengths is a **fail** | `scoreRhythm` scores onsets and durations separately | check 4 |
| A rest is silence; a key held through it fails on its own fault kind | `scoreRhythm` rest pass | check 5 |
| A tie is one press | `soundingEvents` folds ties before scoring | check 6 |
| An accidental carries to the bar line, per letter *and* octave, and the bar line resets it | `BarAccidentals` | check 10 |
| Harmony is never guessed on a catalogue song | `verifyPassage` / `resolveAppliedCards` | checks 16, 17 |
| Assistance decides worth, not the device | `LabSession.assisted`, `recordLabResult` | check 18 |
| A helped pass cannot fill the independent slot | `recordLabResult` | check 18 |
| Repeating an easy rung earns no new competence or XP | once-by-ref + daily cap | checks 18, 21 |
| Delayed recall is a calendar fact and needs changed content | `stageAvailable`, `recordLabResult` | check 19 |
| A clock moved backwards forfeits the claim, never the history | `clockCheck` | check 19 |
| Transfer means material not played here before | `seenContent` | check 20 |
| No restart on error: repair one bar | `recoveryFor` | check 22 |
| Unmeasurable dimensions become listening checks, and a self report is never competence | `supportFor`, `recordLabResult` | checks 24, 25 |
| Migration fabricates nothing and loses nothing | `migrateLab` | check 26 |
| The daily route is a suggestion, skippable, no penalty | `dailyRoute`, `skipSegment` | check 27 |
| A short fresh read stays reachable under any history | `easyReadingNext` | check 28 |
| A rest belongs to ONE hand: the other staff's notes are legal through it | `scoreRhythm` hand attribution | check 34 |
| The stored progression matches the qualified outcome, everywhere | `qualifiedSlot`, `rungEarned` | check 35 |
| A rolled-back clock defers retention and then recovers | `clockCheck`, `clockStatus` | check 36 |
| A failed rung stays finishable; a generated rung never runs dry | `LabSession` variant fallback | check 37 |
| An unmeasurable card progresses on self reports, never a dead end | `stageAvailable`, self-report slot | check 38 |

| A transfer stays winnable after a fumble, without faking novelty | transfer pool | check 39 |
| A chord rung is untimed: no gap may be required | `scoreChords` | check 42 |
| Every degraded rung asks a real question; silence records nothing | `fallbackSelfCheck`, `answer` | checks 46, 25, 38 |
| A listening verdict is not performed practice | `recordBlock('listening')` | check 47 |
| Tuplet groups are complete, contiguous and separately identified | `parseRhythm` | check 43 |
| A count row exists where promised and covers every onset | `labCountCells` | check 44 |
| A rung cannot be paid for a measurement it did not make | `stageRequires`, `unmeasured` | check 45 |
| `render` is the only notation authority | `labNotation` | check 50 |
| A flawless guided passage passes, on the notes, as practice | `gradePassage` | check 52 |
| A guided passage cannot pass without pitch evidence | `gradePassage` | check 53 |

Run: `node test/learning-lab.mjs` → **54 checks passed**, including a
whole-curriculum walkthrough that opens every rung and plays every playable one.

### Coverage of the walkthrough (check 33), exactly

146 rungs across 29 cards, every one opened, and the buckets are asserted to add
up so nothing can be quietly omitted:

The 50 alternate transfer exercises are walked separately (check 39): each is
played as written, asserted to pass, and asserted to score exactly the note
heads its `render` draws.

| bucket | count | what happened |
| --- | --- | --- |
| played and passed | 110 | performed as written, honouring each rung's marks (staccato dots, slurs, dynamics, pedal), and asserted to pass |
| demonstrations | 29 | the `listen` rung of each card: watched, not scored, and it claims nothing |
| handed to the practice surface | 4 | `play-passage` rungs; the app's own engine measures those, so the walkthrough supplies a result rather than inventing one |
| listening self checks | 3 | authored as self checks by design (`ex-dynamics`, `ex-balance`, `ex-pedal` transfer rungs); they return `passed: null` |

Of the 110 played rungs, all were exercised with velocity, note-off and pedal
available and a synthetic touch calibration, so the measured expression paths
(articulation, same-key dynamics, cross-hand balance, pedal changes) were
actually run rather than skipped. The degraded paths are covered separately by
checks 25 and 38.

---

## 6. Suggested wiring (integrator)

1. `migrateLab(state)` once at boot, beside the other migrations.
2. `const resolvedApplied = resolveAppliedCards(SONGS)` once; pass it into
   `startCard`. Show `resolved.note` on any card that refused itself.
3. Surface the cards **inside the existing lesson and teacher surfaces**, not a
   new dashboard. Suggested homes: the rhythm and reading tracks beside the 13
   reading lessons; the applied track on the practice surface's "understand this
   passage" disclosure; the expression track beside the existing results panel.
4. `dailyRoute(state, { now, prescription: prescribe(state, now, ctx) })` for the
   route strip. The passage segment carries the **existing** prescription whole
   under `suggestion.prescription`; do not replace it.
5. On an applied transfer rung, `state().passage` gives the exact
   `{songId, section, startBeat, endBeat, hand, tempo, wait}` to open, and
   `returnTo` to come back to.
6. `labBadges(state)` appends to the existing evidence cabinet; `labNextLine`
   and `labLabel` give short strings in the app's voice.
7. ☠️ Everything the lab starts must stop when the screen is left: it owns no
   audio, but a count-in, a click or a playback the UI starts on its behalf is
   the UI's to kill in `leave()` (see `tools/leave-probe.mjs`).

---

## 6b. Three things the UI must render honestly

**The transfer pool.** Every transfer rung carries three pieces of comparable
authored material (the original plus two alternates); `nt-position`'s is
generated instead, and the three subjective expression rungs are self-assessed.
The session deals the first piece this card has not met.

```js
state().pool            // { size, used } on a transfer rung
state().usingAlt        // true when it dealt an alternate; show state().altNote
state().poolExhausted   // every piece has been met
state().repeatedNote    // the sentence to show when it has
labProgress(st, id).rungs.find(r => r.kind === 'transfer')  // { pool, earnable, ... }
transferPool(st, cardId)      // { kind:'authored'|'generated'|'self-assessed', size, used, remaining, exhausted }
transferEarnable(st, cardId)  // false once earned, exhausted, or subjective by design
```

Once a pool is exhausted the rung stays **playable** but stops being offered as
the next thing to do, and says plainly that it can no longer be a transfer.
For the three expression cards whose transfer rung is a listening self
assessment, `earnable` is false from the start and the pool note says why — it
is still offered until it has been answered, so the last rung is reachable.

**Degraded rungs.** `state().selfCheck` is never null on a rung that degraded:
it is the rung's own authored question, or the fallback for the measurement
this device cannot make. `session.answer(id)` returns
`{ recorded, invalid, why }` and refuses anything that is not one of the
offered options. Pressing "next" without answering returns `passed: false` and
`recordLabResult` stores nothing and returns `outcome: 'not-yet'`.

**What could not be measured.** `finish()` returns `unmeasured: [{ what, why }]`
whenever a declared measurement came back unsupported, and `recordLabResult`
downgrades such a pass to `practice` with the reason in `refused[]`. Show it:
the learner should know that the rhythm was read but the dynamics were not.

---

## 7. Supervisor-reproduced defects, fixed

Four defects were reproduced by the supervisor against this module and are
fixed. Each has a regression test that inspects the **persisted state**, not
just the returned label.

**(1) A perfect two-hand read failed on the other hand's notes** (notes #5).
`scoreRhythm`'s rest check treated ANY sounding note as a violation of a rest
in EITHER hand, so a correct left-hand note during a right-hand rest was
reported as a rest error. The supervisor's fixture (five perfect onsets) scored
three false rest errors.
*Fix:* every sounded note is now attributed to the hand of the **authored
target it satisfied** (`owner` map in `scoreRhythm`), and a rest is only
violated by notes belonging to that hand. Nothing is inferred from pitch.
Two further things came with it: a cross-hand unison may be **shared** by both
staves from one press (the same dedupe law `Engine.buildGroups` applies), and a
chord target requires **every** note of the chord, with its other members never
counted as strays. Verified against the supervisor's exact fixture: 5/5 onsets
on time, 3/3 rests clean, 0 faults. Own-hand hold through its own rest still
fails, with the hand named in the message. Check 34.

**(2) The label said one thing and the stored progression said another**
(notes #10). `recordLabResult` wrote `passedAt` on whichever rung was opened,
so a recall attempt downgraded to `independent` still lit the recall rung, and
an assisted transfer lit the transfer rung.
*Fix:* `qualifiedSlot(stage, outcome)` is now the single rule for which rung an
attempt completes, and `labProgress`, `rungEarned`, `nextStageKind`,
`stageAvailable`, `labSummary` and `labBadges` all read it. An attempt that
qualifies for nothing is recorded under `cards[id].practice[stage]` and shown
as `practiced`, never as `done`. A pass earned on a different rung stores `via`
so the record says where it came from. Old earned records are untouched by a
later failed claim. Check 35.
One consequence worth knowing: a fresh unassisted pass moves the retention
clock with it, because you cannot claim to have remembered something you played
three hours ago. `independentContentId()` compares a recall against the
**authored** independent exercise rather than whatever content last filled the
slot, so filling the independent slot via an early recall attempt can no longer
make the real recall permanently impossible.

**(3) A rolled-back clock banned retention forever** (notes #11).
`lab.clock.suspect` was set and never cleared.
*Fix:* the guard now records `suspectUntil` (the last time it trusted) and
defers delay-based credit only while the clock is behind that mark; once the
clock passes it, suspicion clears, `rollbacks` is incremented as history, and
later-day checks count again. The rung stays playable as practice throughout,
and nothing earned is ever touched. `clockStatus(st)` gives the one sentence to
show. This is a local clock: it cannot prove server time and does not claim to.
Check 36.

**(4) Dead ends.** Three were checked and two needed fixing.
A failed independent attempt was already finishable (only `transfer` requires
novel content), and check 37 pins it: fail, practise with help, then pass clean
as `independent`. A **generated** rung could strand the learner once every
fresh position had been used (`positionVariant` returned `null`); it now
repeats a position and flags `repeatedContent`, which still counts as an
independent pass and still cannot count as transfer. An **unsupported**
expression card looped forever on the same self check, because a self report
settled nothing; self reports now advance the ladder under their own key
(`selfReportedAt`), which is visible as `selfReported`, is counted in its own
`labSummary.selfReported` column, and never becomes competence. Check 38.

---

## 7a. The guided-passage payload (UI owner: this one is yours)

**The bug root observed in the real UI.** All four authored catalogue passages
default to `wait: true`. In wait mode the Engine holds the music until the right
keys arrive, so every accepted press classifies as `good` and the weighted
accuracy tops out at exactly **80**. The rung asked for 85. A learner who played
**97 of 97 notes, 0 wrong, 0 missed** was told "not yet". Check 52 reproduces
that 80 against the real `Engine` on all four passages.

**The fix.** A passage is graded by the conditions it was played under:

| conditions | graded on | can earn |
| --- | --- | --- |
| help on (`wait: true`), or tempo under 100, or `assisted: true` | **the notes**: every required note played, none wrong, none missed. Timing is not graded, because in wait mode it is not the learner's to control. | practice credit only |
| help off, full tempo | accuracy, `PASSAGE_INDEPENDENT_MIN_ACC` (85) with no wrong notes — **unchanged** | independent / retained / transferred |

`gradePassage(payload, { authored })` is exported and is the whole rule.

**The payload.** `session.recordPassage(payload)` — `acc` and `wrong` are the
only required fields and the old three-field call still works.

```js
session.recordPassage({
  // required
  acc,                   // the practice surface's own accuracy
  wrong,                 // wrong-note count

  // conditions: these decide WHICH grading applies
  wait,                  // true = the help was on  → graded on notes, practice only
  assisted,              // true = help of any other kind
  tempo,                 // percent; under 100 counts as help
  hand,

  // pitch evidence, REQUIRED for a guided run to pass
  stats,                 // Engine.stats verbatim {perfect, good, late, wrong, missed}
  required,              // engine.groups.reduce((a, g) => a + g.notes.length, 0)
  played,                // engine.playLog.length
  missed,                // only if `stats` is not sent

  // identity, preserved verbatim and echoed back
  songId, section, startBeat, endBeat, title,
});
```

☠️ **A guided run with no pitch evidence does not pass.** It returns
`passed: false` with `faults[0].kind === 'no-pitch-evidence'` and
`grade.needs === ['stats', 'required', 'played']`. A legacy or partial payload
can never manufacture a helped pass — that is deliberate, and check 53 pins it.

**Identity.** Supplied `songId`/`section`/`startBeat`/`endBeat` are compared
against the authored passage and echoed as `grade.identity
{ supplied, authored, matches }`. A payload that openly names a *different*
passage is refused (`wrong-passage`). This is a backstop, not attribution:
**the UI owner implements strict attribution**, and the model cannot tell a
mislabelled result from an honest one.

**Copy the UI can use.** `state().passage` now carries `practiceOnly`, `earns`
and `gradedOn`, so the learner is told before playing that a helped run is
practice and that the help-off run is what earns the transfer.

---

## 7b. Cold-review findings, fixed

An independent cold review reproduced eight further defects against the green
39-check build. Seven were fixed; one (finding 5) was a documentation defect and
is corrected in §4 above. Each fix has a counterexample test.

**(1) A failed or hinted transfer barred the rung for ever.** Exposure is banked
on every attempt, so the fixed transfer material was "already met" after one
fumble and every later perfect attempt was downgraded, with `nextStageKind`
still pointing at it.
*Fix, and the shape of it matters:* exposure stays honest — it is still banked
on failures and helped passes, because that is the truth about what the learner
has met. Novelty is **not** manufactured by only banking on a pass; that would
make known music count as transfer. Instead every transfer rung now carries two
further pieces of **genuinely different authored material** of the same skill
and difficulty (50 new exercises, all verified playable by check 39), and the
rung deals the first one not yet met. When the pool is spent the module says so,
keeps the rung playable, and stops offering it as earnable. Applied cards fall
forward to **authored original study transfers**, never to a second catalogue
song whose harmony this module has not verified. Checks 39, 40, 41, and 20
rewritten.

**(2) A correct two-inversion recall failed unless the chords were 1.5s apart.**
`scoreChords` swallowed everything within the 1.5s window and called the next
chord's notes strays.
*Fix:* the group grows note by note and stops the instant the chord is complete;
`cursor` lands just past it. Every gap from 250ms to 2000ms now passes, and
strays inside the chord, missing tones, missing chords and stray keys *between*
the chords all still fail (notes claimed by no chord are reported wherever they
fall). Check 42.

**(3) Degraded rungs were "self checks" with no question.** Only the transfer
rung of each expression card had one authored, so guided/independent/recall
showed nothing to answer and advanced on a press of Next.
*Fix:* `fallbackSelfCheck(card, stage, need)` authors a real question per
requirement and per rung, naming the thing the app could not measure;
`answer()` validates against the offered options; an unanswered rung is not a
verdict and records nothing. Checks 25, 38 and 46 (which sweeps 21 degradable
rungs on a device with no velocity, releases or pedal). The test no longer
optional-chains past a missing question — it throws if one is absent.

**(4) Self-report rungs banked performed practice blocks.** `'lab-listening'`
is not in `game.mjs`'s exclusion, so radio buttons inflated the evidence
cabinet and the seven-day practice line.
*Fix:* the kind is now `'listening'`, which `isPerformedBlock` excludes, matching
the worked rung. Check 47 asserts `blockCount(st, 0, 'practice') === 0` and
`blockCount(st, 0, 'listening') === 2` after two self reports.

**(5) Song-object spelling contradicts the page.** Confirmed, and it is a
documentation defect, not a code one: see the correction in §4. `render` is the
notation authority, the song object is for the engine, every song object now
carries `labNotation: 'render'`, and check 50 measures the divergence (50 of
1282 heads) so it cannot be forgotten.

**(6) Two triplet groups in one bar shared a tuplet id.** A sequence counter was
reset by the next plain note.
*Fix:* a monotonic per-bar group counter, plus authoring-time validation that a
group holds all of its notes and is contiguous. Check 43.

**(7) A rung paid full credit for a measurement it never made.** `nt-symbols`
declares `requires: 'note-off'` but its independent rung is "one bar loud, one
bar soft", which needs velocity; with none it scored the rhythm and paid
independent XP.
*Fix:* `stageRequires(stage)` gives each rung its own requirement (dynamics →
velocity, balance → calibrated velocity, pedal → pedal, articulation or printed
staccato → note-off) and `supportFor` checks card and rung requirements
together, reporting the hardest unmet one. An unmet requirement degrades that
rung to its authored self assessment; a plan that comes back unsupported inside
a scored rung downgrades the outcome to `practice` with the reason. Check 45.

**(8) The 6/8 guided rung's only scaffold was always null**, and the triplet
rung's count row showed four cells for a bar tapped six times.
*Fix:* `labCountCells` builds the grid from the authored onsets (eighths,
thirds or sixteenths; six labelled eighths with the weight on 1 and 4 in 6/8),
and check 44 asserts that every rung promising a count row has one with a lit
cell for every authored onset.

### API changes from this round

Additions: `transferPool`, `transferEarnable`, `stageRequires`,
`fallbackSelfCheck`, `labCountCells`, `independentContentId`, and on a session
`pool`, `usingAlt`, `poolExhausted`, `altNote`, `selfCheckQuestion`.
Changed behaviour, all backward compatible in shape:

- `supportFor(card, capabilities, cal, stage)` takes an optional fourth
  argument and returns `needs`/`unmet` alongside `need`.
- `session.answer()` returns `{ recorded, invalid, why }` instead of `null` for
  an unknown question, and refuses options it never offered.
- `finish()` returns `unmeasured[]` and `support`; a self-check with no answer
  returns `passed: false` rather than `null`.
- `state().selfCheck` is the rung's effective question (authored or fallback)
  rather than only the authored one; `state().passage` is non-null only on a
  rung that is actually opening the passage.
- `exercise().contentId` is now computed from meter, onsets, written values,
  pitches, spellings and printed marks — never from the id, the name or the
  tempo. Stored `seenContent` from an earlier build would not match; nothing
  has shipped, so nothing to migrate.
- `countRow` is present in compound metres and on third-beat grids (it was
  `null` in 6/8).

---

## 8. Testing status, and what is NOT acceptance evidence

Run in this package, and nothing else:

- `node test/learning-lab.mjs` → **54 checks passed**, including the
  whole-curriculum walkthrough with the exact coverage table above and a
  second walkthrough of all 50 transfer alternates.

☠️ **A premature `node tools/worklist.mjs` was started and interrupted by the
supervisor. It provides no acceptance evidence of any kind.** It launches the
full browser gate suite, which requires the served copy and finished UI
integration; neither applies to this package, and no result from that run is
quoted anywhere in this report. The full core suite, the worklist and the
browser gates are the supervisor's to run once the UI integration lands.

At the time this module was written `node test/check.mjs` was green at 503
checks with the module present, which shows only that adding these files broke
nothing existing. It is not evidence about this module, because nothing imports
it yet.

---

## 9. Limitations, stated plainly

- **Not wired in.** No UI, no route, no gate covers it yet. A module with 54
  green checks and no screen is not a feature; it is a foundation.
- **No browser gate, core suite or worklist run belongs to this package.** See
  section 8: the one worklist run that started was premature and interrupted,
  and is not evidence.
- **No browser or hardware validation.** Everything here was exercised in node
  with synthetic events. Nothing has been played on the P-45, nothing has been
  rendered by VexFlow, and no learner has used it. The symbol spec is designed
  against `engraving.mjs`'s vocabulary but has never been handed to VexFlow.
- **The passage rungs are only as honest as the payload they are handed.** The
  model grades what the practice surface reports; it cannot see the keyboard
  itself. Strict attribution of a result to the passage it came from is the UI
  owner's, and the identity check here is a backstop, not a guarantee.
- **Nothing in this package is UI-wired or UI-tested.** Checks 52 and 53 drive
  the real `Engine` over the real catalogue passages in node; they do not prove
  that the app sends this payload, because the app does not send it yet.
- **Every "correct performance" in the suite is synthesised.** Onsets at
  `t.at * msPerBeat`, releases at a fixed offset. Cold review finding 2 was the
  first proof that this can hide a rung no learner could pass; the chord fix
  closes that particular hole and check 42 now varies the spacing, but the
  synthesis is still the suite's largest blind spot.
- **The transfer pool is three deep.** Three genuinely different pieces of
  material per card. A learner who fumbles all three has run out, and the
  module says so rather than pretending; more material is authored one entry at
  a time in `TRANSFER_ALTS` / `APPLIED_TRANSFER_ALTS`.
- **The timing tolerances are untested on a human.** 150ms onsets, a 0.6-1.45
  duration band and a 130ms rest grace are reasoned starting points from the
  existing thresholds, not calibrated ones. They will need a real session.
- **A staccato dot suspends the duration check for its whole exercise.** Under
  a dot the written value is the slot, not the hold, so the hold is judged by
  the articulation rule over the marked span instead. Where a marked span holds
  fewer than three released notes, `artic.mjs` declines to judge it and that
  span's articulation is simply not scored (it reports `supported: false`).
  `nt-symbols`'s transfer rung is the one authored rung in that position.
- **The clock guard is local.** It can see its own clock moving backwards; it
  cannot see a clock moved forwards, and it cannot prove server time. It is a
  guard against accidental drift and casual fiddling, not against a determined
  effort, and it never punishes either.
- **The 6/8 and triplet rungs are the least proven.** They parse, balance and
  score correctly in tests; how they *read* on a rendered stave is unknown.
- **`nt-position` variants can produce sharps in odd keys.** The shape is
  transposed in semitones and spelled by `spellPitch` in C, so a start on A
  yields A-B-D-C#. That is deliberate (position independence), but a teacher
  might spell it differently in context.
- **Expression is thin by design.** MIDI cannot see fingers, gaze, posture,
  tension or artistic intent, and nothing here pretends otherwise. Phrase
  shaping across registers is a listening check, not a score.
- **The applied track covers four catalogue songs.** Those are the ones whose
  harmony could be verified from the shipped data. More can be added, one
  authored expectation at a time; guessing at the rest is the thing this file
  refuses to do.
- **No claim about retention or learning.** The lab records what was played and
  when. That is evidence of attempts, not evidence that anything was learned.
