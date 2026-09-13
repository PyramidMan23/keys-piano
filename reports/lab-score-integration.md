# LabScore: the learning lab's own engraver

**What it fixes.** A lab exercise is AUTHORED as written notation in
`js/learning-lab.mjs` (`renderSpec`): a spelling, an accidental the engraver
must print, a rest, a tie, a tuplet bracket, a dynamic. `drawQuestStave` renders
`s.song` through the generic `ScoreView`, and a song is MIDI numbers, so
`spellPitch` re-derives the spelling from pitch and key. In C major that prints
**A# where the author wrote Bb**, which is the exact reading error the flats card
is teaching, and it loses every rest, tie, slur, tuplet bracket and dynamic
except the ones `learning-ui.drawMarks` paints back on by hand.

`js/lab-score.mjs` engraves `s.render` instead: the authored page, nothing
derived. Nothing else changed. `score.mjs`, `engraving.mjs` and `notation.mjs`
are untouched, so the 128-song catalogue renders exactly as before.

---

## The API

```js
import { LabScore } from './lab-score.mjs';

const score = new LabScore(host);        // host: any element LabScore may own
const drawn = score.build(input);        // input: an exercise OR its .render
```

### `new LabScore(host, opts = {})`
`host` is emptied and dressed by the renderer: cream page, rounded corner,
`overflow-x: auto`, `width: fit-content`, `max-width: 100%`, all written
**inline**. `opts` is accepted and unused today. Throws only if `host` is falsy.

### `build(renderSpecOrExercise) -> boolean`
Accepts either shape; `specOf()` picks `input.render` when it is there and
`input` when it is already a page. Returns `true` when the page was engraved.

On **any** failure it prints a visible refusal into the host
(`<p data-lab-score="error" role="alert">This exercise could not be engraved: …`),
sets `.error`, and returns `false`. **It never falls back to a pitch guide.**
An assessment is scored against what is written, so a page showing something
else is worse than a page that says it cannot be drawn.

After a successful build:

| property | is |
| --- | --- |
| `.ok` | `true` |
| `.error` | `null`, else the refusal message |
| `.warnings` | `[]` (non-fatal notes; empty for all 204 exercises today) |
| `.spec` | the render spec that was drawn |
| `.svg` | the `<svg>`, `role="img"` with a full `aria-label` |
| `.notes` | `[{ hand, at, cell, note, el }]` in written order, `at` in quarter notes |

### `update({ beat = 0, hand = 'both' })`
Optional play-time state, in the vocabulary `EngravedScore` already uses:
`data-state="current|played|passive|ready"` on each note element, and
`opacity: .45` on the hand that is not playing.
**`beat` is in QUARTER NOTES.** The lab's songs store beats in the song's own
beat unit (6/8 ships as eighths), so a caller driving this from the Engine
converts: `beat = engine.beat * 4 / song.beatUnit`.

### `scrollToBeat(beat)` · `refreshOverflow()` · `destroy()`
`scrollToBeat` puts a beat 30% in from the left, as the score view does during a
run. `refreshOverflow()` re-measures and shows or hides the
"Scroll for the rest of the line →" hint; a `ResizeObserver` already calls it, so
the integrator only needs it if the host is revealed without a resize.
`destroy()` empties the host, disconnects the observer and clears `.ok`.

### Also exported
`validateSpec(spec)` (throws with the bar and stave named), `specOf(input)`,
`tupletGroups(items)`, `harden(svg)`.

---

## Wiring it in (for whoever owns `learning-ui.mjs`)

```js
function drawQuestStave(s) {
  const host = $('quest-stave');
  questScore?.destroy();
  if (!s.render) { host.replaceChildren(); return; }   // a rung with no exercise
  questScore = new ctx.LabScore(host);
  questScore.build(s.render);      // false: the refusal is already printed in the host
}
```

Three things to carry across:

1. **Drop `drawMarks`.** LabScore draws the dynamics, staccato, slurs, pedal and
   text marks itself, from the same `marks` array. Leaving the old pass in place
   would print every one of them twice.
2. **`s.render` is already on the session step** (`learning-lab.mjs`, the object
   that carries `render`, `song`, `countRow`, `marks`, `meter`, `bpm`). No new
   plumbing is needed. `s.song` stays where it is: the Engine and the audio still
   want it.
3. **The count row is not mine.** `drawCountRow` is unchanged and still owns
   `#quest-counts`.

`update()` during a run and `refreshOverflow()` when the screen is shown are
both optional; the still page is correct without either.

---

## What was verified, and how

`node tools/lab-score-probe.mjs` runs a real Chrome on a disposable profile
(`tools/cdp.mjs`), the real app on `KEYS_TEST_ORIGIN` (`http://localhost:4193`,
this working copy served by `node serve.mjs` with `PORT=4193`), every exercise
built into a real `#quest-stave`-style host, and then the **SVG measured**.
Mark's own browser and its storage are never touched.

**41 of 41 checks pass.** Coverage:

- **204 exercises, no exceptions, no warnings.** 188 authored in `LAB_CARDS`
  (the count was 138 when this began and the author is still adding), the 14
  `positionVariant` drills generated at session time, and 2 synthetic ones.
- **1336 note heads, every one on the staff line its AUTHORED spelling demands,
  worst error 0.00px.** The expected y is computed in the probe from the letter
  and octave (`f/5` is the treble top line) against the top line **measured off
  the drawn staff**, so it is independent of the renderer. A renderer that
  re-spelt an authored Bb as A# would land a half-space out and fail this.
- **The named case.** `nt-flats-w`, key of C, authored `Bb4`: the page prints a
  flat, on the B line. The accidental-carry drill prints flat, nothing, natural,
  nothing across four B's, which is the rule it teaches.
- **Accidentals as SHAPES.** Every authored `b`, `#` and `n` produces a glyph
  that plain notes never carry, and the three sets of shapes are pairwise
  disjoint: a flat is not a sharp wearing a different label.
- **44 rests, 14 ties, 16 slurs, 9 tuplet brackets, 14 dynamics, 1 text mark,
  4 pedallings**: all authored, all on the page, counted per exercise.
- **Separate triplet groups.** `rh-tri-i` gets TWO brackets (see the trap below).
- **Tie vs slur** are different drawings, in separately classed groups
  (`.vf-lab-tie`, `.vf-lab-slur`) with `data-from`/`data-to`.
- **6/8**: the dotted-quarter tempo, the 6/8 meter, eighths beamed in threes,
  and 6/8 rests (no authored exercise has one yet, so a synthetic
  `8 8r 8 8 8r 8 | 8 8 8 8d 16 8r` proves it; labelled synthetic in the sweep).
- **Nothing is drawn over the clef, key signature or meter** in any exercise.
- **Cream `#f5f1e6`, ink `#23282f`, staff line `#837c69`**, the values
  `engraving.mjs` and `.lesson-stave` already use.
- **Hand labels are letters, not colours**: a printed `R`/`L` beside each stave
  (`#6b6558` on cream = 5.1:1, AA).
- **Phone**: at 390px, 3 of the 11 photographed pages overflow, and every one
  that does shows the scroll hint; every one that does not, does not.
- **Inside a `.canon-root` board** the page still paints and still has geometry,
  with a control proving the reset is live (see the trap below).
- **An unreadable spec and a malformed cell** both refuse visibly and leave no
  `<svg>` behind.
- `update()`, `scrollToBeat()` and `destroy()` are each exercised once.

### Screenshots
`reports/lab-score/*.png`, each at desktop 1418 and phone 390, deviceScaleFactor
2: `flats`, `naturals`, `sharps`, `ties`, `tie-and-slur`, `triplets`, `symbols`,
`pedal`, `six-eight`, `six-eight-rests`, `grand-staff`.
The full per-exercise measurement set is `reports/lab-score/sweep.json`.

---

## Traps found on the way

**1. Two triplets in one bar share an id.** `parseRhythm` numbers a tuplet
`${bar}:${Math.floor(tupletSeq / 3)}` and resets `tupletSeq` on every non-tuplet
cell, so `8 8 8 q 8 8 8` (rh-tri-i, bar 1) gives BOTH triplets the id `0:0`.
Grouping by id draws one six-note bracket over a bar that has two triplets in it.
LabScore groups by **contiguity**, splitting on any change of id or ratio and
then chunking by `n`, which is right under the current ids and still right when
the author makes them unique. `test/lab-score.mjs` pins both cases.

**2. `all: revert` erases SVG GEOMETRY, not just paint, and that includes `d`.**
Measured here on 2026-09-13: inside a `.canon-root` board a VexFlow `<path>`
computes `d: none`. `d` is a CSS property in SVG2, `all` covers it, and a path
with no `d` is not a note head with the wrong colour, it is a note head that does
not exist. The same goes for `x`, `y`, `width`, `height` (the `<svg>`'s own
width measured 244px inside the board), `cx`, `cy`, `r`, `rx`, `ry`.
This is the **sixth** round of this bug class in this app (style.css keeps the
tally: stroke and fill, then `color` behind `currentColor`, then `rx`/`ry`, then
`#cp-again`, then `#lesson-stave`), and converting one property at a time is what
lost the previous five. `harden(svg)` therefore mirrors the whole paint AND
geometry family into inline style, which the cascade compares before layers and
the reset cannot reach. The probe's control is a twin path carrying only its
attributes: box width 0, computed `d: none`.
**This means LabScore does not need a style.css exemption to be mounted inside a
canon board**, which is just as well, since `#quest-stave` carries the
`lesson-stave` CLASS and the exemption list names `#lesson-stave` by ID.

**3. `joinVoices` is what reserves an accidental's width.** It was being skipped
for single-voice pages; `Formatter.joinVoices` is what builds the modifier
contexts, so a whole-note Bb printed its flat straight through the 4/4. Every
measurement still passed. It was caught by looking at the picture.

**4. A `.vf-notehead` group is not just the head.** VexFlow 4.2 draws the stem
and the ledger lines as siblings and every modifier glyph INSIDE the head's
group, so the group's box is a head plus a 33px stem. Taking its centre put
every note 22px off its line, in the probe, not in the renderer. The head is
the first path in the group; the modifiers are the rest.

**5. VexFlow's `Stave(x, y, w)` y is the box top, not the top line.** It reserves
four line-spaces above. Staves start at y 16 so the printed top line lands at 56
and the bass at 186, where `engraving.mjs` puts them.

**6. `PedalMarking` wants two notes; an authored pedal names two BEATS.**
"0 to 4, then 4 to 8" over two whole notes handed VexFlow the same note twice and
drew one bracket for two pedallings. The bracket is drawn from the authored span:
the note at the lift beat, or that bar's line when nothing is written there.

---

## One thing for the learning-lab author (not mine to change)

`ex-touch-t` ("Legato in the left hand") is `q q q q | h h` with
`marks: [{ kind: 'slur', from: 0, to: 5 }]`. Its notes fall on beats
0, 1, 2, 3, 4 and **6**. Beat 5 is inside the first half note, so the slur
resolves to five of the six notes (measured: x 123.2 → 254.3, ending on the note
at beat 4, not the one at beat 6). LabScore resolves it exactly as the existing
`drawMarks` does (inclusive of every sounding note in `[from, to]`), so this is
not a change in behaviour, but `to: 6` is probably what was meant.

---

## Running it

```
PORT=4193 node serve.mjs                 # this working copy, not the :4180 serving copy
node tools/lab-score-probe.mjs           # 41 checks, ~2 min, writes reports/lab-score/
node test/lab-score.mjs                  # 3 offline checks, no DOM, instant
```

The probe honours `KEYS_TEST_ORIGIN` and defaults to `http://localhost:4193`.
Neither is wired into `tools/gates.mjs`: that file has another owner, and the
suite is the root's call to extend.

## Supervisor follow-up
The reported legato slur endpoint was verified against notes at beats 0,1,2,3,4,6 and corrected to beat 6 for `ex-touch-t` and its two authored alternatives. The complete gate roster now includes both lab-score checks. Final combined acceptance is recorded separately in `learning-wave-acceptance.md`.
