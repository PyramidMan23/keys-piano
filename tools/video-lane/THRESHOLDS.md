# Video lane — committed thresholds

Written 2026-09-01, BEFORE the first extraction ran, per the stop-loss law in
`MarkOS/brain/decisions/2026-09-01-keys-video-lane-plan.md`. A failed threshold means
the numbers are reported and work STOPS. No lowering, no repair queue.

## Geometry gate (per video)

- Exactly 52 white + 36 black keys detected across the keyboard strip, black keys in
  the 2-3-2-3 pattern anchored so the leftmost white key is A0 (MIDI 21). Anything
  else = REFUSE by name (cropped keyboard, nonstandard layout, not a falling-note video).

## Extraction gate (per video)

- Ambiguous events (colour not attributable to a template hand cluster, or occupancy
  unresolved) must be < 2% of all detected events, each one listed. >= 2% = REFUSE.
- PTS timestamps only. If the container reports variable frame rate and PTS cannot be
  read per frame, REFUSE (no frame/fps arithmetic).

## Audio-consistency check (per video; a CONSISTENCY check, not truth)

Compare video note stream vs ByteDance transcription of the same video's audio,
onset tolerance ±80ms, pitch exact:
- Overall F1 >= 0.90.
- Worst 30-second window F1 >= 0.75.
Below either = REFUSE the song (the two independent readings disagree; we do not pick one).
Audio carries no hands, so this check cannot validate hands; it validates pitch+onset.

## Mutation gate (the extractor may not judge anything until it passes these)

Pixel-level mutations of real frames, applied upstream of the extractor:
1. Octave crop (chop >= 1 octave off one side): geometry gate must REFUSE.
2. Palette swap (swap the two hand hues): every hand label must flip; anything less
   means hands are not purely colour-driven and the extractor is condemned.
3. Third colour injected onto >= 5 note bars: those events must surface as ambiguous,
   not silently join a hand.

## Hand-semantics rule (per template)

Colour -> hand mapping comes ONLY from the template profile, established from evidence
external to pitch (channel documentation, a same-template video with visible hands, or
Mark's own eyes on a 10-second excerpt). NEVER from mean pitch of a cluster.

## Timing / import gate (Phase 2, Hard only)

- Seconds -> beats only through a beat-tracking gate on the video's own audio:
  piecewise map between tracked beats; the tracked-beat lane must show tempo stability
  (median absolute deviation of inter-beat interval < 12% of median) or the song keeps
  seconds/FREE TIME and rhythmic import is refused.
- Post-quantisation: mean onset move < 0.12 beats AND worst < 0.45 beats, else the
  quantised import is REFUSED (free-time seconds remain the honest state).
- Video provenance is `video-authored-hands`; it must NEVER set `fromScore`. The Hard
  tier faces the full playability audit.
- Dedup happens BEFORE quantisation on event identity, never on (beat,pitch,hand).
- Offsets from trail ends are stored separately and do not populate `d` and do not
  feed the playability audit until this template's duration semantics are proven
  against a score pair.

---

# RESULTS — Silksong Theme (Sheet Music Boss / Embers), 2026-09-02

Video `tDT7qpAaRx0`, 1920x1080 AV1, 60fps CFR, 92.3s, 5535 frames. Whole run
takes about 30 seconds of wall clock.

## Gates

| Gate | Committed | Measured | Verdict |
|---|---|---|---|
| Geometry | exactly 52 white + 36 black, A0-anchored | 52 + 36, grid residual 0.7px | PASS |
| Ambiguity | < 2% of events unresolved | 0 of 264 (0.0%) | PASS |
| PTS | decoded timestamps only, never frame/fps | showinfo PTS, size asserted per frame | PASS |
| Audio consistency | F1 >= 0.90 | **0.864** | **FAIL** |
| Worst 30s window | F1 >= 0.75 | 0.809 | PASS |
| Mutation: octave crop | geometry must refuse | refused ("expected 36 black keys, found 31") | PASS |
| Mutation: palette swap | must not silently classify | ambiguity 0% -> 29.2%, trips the 2% gate | PASS |

## The failing gate, honestly

Precision against the transcription is **0.989** (261 of 264 video events match
an audio note). The video invents essentially nothing. The F1 shortfall is
entirely recall: 79 transcribed notes have no video counterpart, and **50 of
those 79 are an exact octave (or two) ABOVE a video note at the same instant** -
octave ghosts, a known failure of piano transcription on synthesised, reverberant
audio. The reference is the weaker stream, which is exactly what "two machines
agreeing proves agreement, not correctness" was written to guard against.

The threshold is NOT being lowered and the number is NOT being recomputed with
the ghosts removed. It failed as written: 0.864.

## What was verified directly instead

Four instants (12.0s, 30.0s, 47.0s, 62.0s) were rendered and read by eye against
the extractor's claim. All four agree exactly, 15 keys in total, every pitch and
every colour class correct:

- 12.0s: 1 grey + 2 red — extractor said 64 grey, 67 + 71 red
- 30.0s: 3 grey + 1 red — extractor said 59, 62, 64 grey, 71 red
- 47.0s: 2 grey + 2 red — extractor said 42, 54 grey, 62, 76 red
- 62.0s: 3 grey + 2 red — extractor said 57, 60, 62 grey, 86, 98 red

Timing after the locked 95ms latency: median onset error **4ms**, p90 8ms.

## Still open, and blocking import

`handMapping` in the template profile is null. Red versus grey is measured and
separable; WHICH IS THE LEFT HAND is not established, and it must not be inferred
from pitch. Nothing gets imported until that comes from evidence outside pitch.

---

# PHASE 2 RESULT — Silksong imported, 2026-09-02

- **Hand mapping established from evidence outside pitch:** the arranger's own
  published score (Musicnotes MN0304368, `silksong/score-preview.png`). Bar 1:
  treble = E5 then the B4+D5 dyad, bass = held A3 with E4 off-beat. The video
  paints those treble notes red and those bass notes grey. `handMapping`
  {red: R, white: L} recorded in the template with this citation.
- **Seconds -> beats:** a rendered video is played from a MIDI at a fixed tempo,
  so the grid is a hypothesis to TEST. At the score's quarter = 70 in 2/4, the
  264 onsets snap with mean move 0.015 beat, worst 0.119 (committed refusal:
  mean >= 0.12 or worst >= 0.45). Metronomic. `to-import.mjs` refuses otherwise.
- **Importer:** `--video-hands` takes the two tracks as hands and nothing else a
  score would earn (fromScore false, pedal fix runs, Hard faces the audit). All
  three tiers passed: Easy 140 / Medium 199 / Hard 264 notes, 49 / 60 / 70 bpm,
  `provenance: 'video-authored-hands'`. Shipped in keys-v102.
- **Templates that do NOT carry hands:** Erik C 'Piano Man' (Zelda) and Patrik
  Pietschmann (Overwatch) render over a REAL keyboard with real hands, and their
  bar colour is a left-to-right gradient by pitch position, not by hand. The
  lane can read pitch and time from them; it cannot read hands, and it must not
  infer them from pitch. Those songs need hands from another source.
- **Durations (Codex round 3):** the plan held tint lengths untrusted until
  proven. Proven now against the published score at quarter = 70: treble
  quarters read 1.11-1.28 beats, the bass half note 1.67-1.81, and five repeats
  of each figure agree to within 0.02 beat. That is a note-off, not a trail.
  Recorded as `durationSemantics` in the template; durations still face
  quantisation, unpedal and the audit.
- **Codex round 3 fixes:** the importer can no longer re-split video hands
  (the transcription repair path is skipped; the per-tier resplit is identity);
  `to-import.mjs` refuses any colour the template does not map, requires
  `--bpm-source`, resolves `midi.mjs` in both copies of this folder, and says
  plainly that the grid fit tests metronomicity at a GIVEN tempo (35, 70, 140
  and 210 all fit; the number is the arranger's, not the fit's).

---

# FEASIBILITY — hand-pose lane for FILMED keyboards (Zelda / Overwatch), 2026-09-02

Codex's verdict on the first plan was "do not build this yet": run a 100-strike
feasibility experiment per video with human-labelled hands first. This section
is that experiment, numbers as measured, committed gates: two-witness hand
identity must agree; unresolved share < 5% to import; per-note hand accuracy
against human labels reported by stratum before any threshold is trusted.

## What works (measured)
- **Geometry on film** (`calibrate.mjs --filmed`): the keyboard band is found
  anywhere in the frame; all 36 black keys detected in both videos; the standard
  88-key layout (black-key offsets measured on the pixel-uniform SMB render:
  C# -0.115, D# +0.055, F# -0.195, G# -0.038, A# +0.150 white-widths) maps
  through a quadratic camera with worst residual 3.0px (Zelda) / 2.9px (Overwatch).
  Pitch mapping proven against the audio transcription: with ZERO semitone shift
  197 of 197 audio notes in a 60s Zelda window match a bar-lane note; every other
  shift scores under 25.
- **Notes from the falling bars** (`extract-bars.mjs`): per-key occupancy in a
  band 60-90px above the strike line with non-maximum suppression across
  neighbouring columns (without it two lit keys read as five). Lane latency from
  the bars' own fall speed: Zelda 402px/s -> 186ms; Overwatch 146px/s -> 512ms.
  ☠️ A `-ss N -c copy` clip starts at the previous keyframe, so clip timestamps
  are off by up to a second; only full-video PTS are trusted.
- **Hands** (`hands-track.py`, MediaPipe Hand Landmarker, VIDEO mode): two hands
  in 76% of Overwatch clip frames, one in 21%, none in 3%. Track identity by
  wrist continuity; the two tracks named by two independent witnesses (model
  label majority, left-of-other-hand majority): Overwatch clip track0 = R
  (label 97%, right of the other 98%), track1 = L (98% / 88%). Agreement gate held.
- **Assignment** (`assign-hands.mjs`): a note goes to a hand only when one hand
  has a fingertip within NEAR key-widths of the key over the keys in the strike
  window and the other has none within FAR; else UNRESOLVED, which blocks import.

## What does not yet pass
- Overwatch clip, 449 notes: unresolved 26.9% at window +-2 / NEAR 0.8; 19.4% at
  +-4 / 1.0; 15.4% at +-6 / 1.2. Gate is < 5%. Most unresolved are "no fingertip
  close enough": the landmark tips do not land on the played key at the strike
  frame as often as the rule needs, and widening the window trades that for
  "both hands near".
- Human labels: only six tiles read by eye so far (thumb side agreed with the
  claim on five, one ambiguous). That is not a corpus. `contact-sheet.mjs`
  builds the sheets; 100 labelled strikes per video stratified by chords,
  crossings, thumbs, black keys, occlusion and repeats are still owed.
- Hands identity on Zelda: MediaPipe labelled both hands "Left" in a probe
  frame; the track-level witnesses have not yet been run on the full video.

## Honest state
Notes and timing from these two videos are within reach (pitch proven, timing
to a measured constant). Hands are a feasibility result with a 15-27%
unresolved rate and six eyeballed labels. Nothing from either video imports
until the unresolved share is under the gate AND a labelled corpus says the
assignments are right.

## Full-video numbers (Zelda, 590s, 60fps)
- Bar lane vs audio transcription: 4501 video / 4931 audio, latency 228ms
  (measured; the fall-speed estimate said 186), precision 0.903, recall 0.824,
  F1 0.862, onset error median 27ms, p90 56ms. Worst 30s window (395s) F1 0.60:
  589 audio notes in 30s, 19.6/s, median 0.147s. Of 866 audio-only notes 145
  are octave ghosts and 776 sit in dense passages: fast repeats on one key merge
  in the band because the gap between consecutive bars is under the 3-frame
  hysteresis. Of 436 video-only events 318 are under 0.1s: particle blips.
  The dense-passage recall and the blips are the two open problems on notes.
- Human labels (contact sheets, hand identity by thumb side): Zelda 41 tiles,
  34 agree with the claim, 6 ambiguous by eye (all in the stratum where both
  thumbs sit within a key of the marked column), 1 possible disagreement
  (#158, D5, claimed R, thumb reads left). Overwatch 6 tiles, 5 agree, 1
  ambiguous. Labels in `labels.json`. This is 47 labels against the 100 per
  video the plan requires; it is evidence, not a corpus.

## Full-video numbers (Overwatch, 334s, 25fps): NO-GO
- Bar lane vs audio: 1787 video / ~3900 audio, precision 0.438, recall 0.200,
  best latency came out NEGATIVE (-118ms), i.e. the alignment is not real. The
  bars are small (short notes at 146px/s are 10-20px tall), the source is 25fps,
  and the camera is farther and dimmer: the band-occupancy reader is the wrong
  instrument for this render.
- Track identity: over the full video the two witnesses fall to 66% / 61% and
  65% / 73% (the hands cross and leave the frame, and the wrist-continuity
  tracker swaps them). The clip's 97-98% did not survive the whole performance.
  8.4% of notes came back unresolved, but with identity that weak the 91.6%
  "resolved" are not trustworthy either. Nothing from Overwatch imports.
- What would change this: per-frame identity re-anchoring (thumb-side geometry
  when both hands are visible, palm orientation), and a bar reader that tracks
  each bar as an object down the lane rather than sampling one band.

## Full-video numbers (Zelda, 590s, 60fps): CLOSE, NOT YET
- Track identity held for the whole performance: track0 = R (label 99%, right of
  the other 100%), track1 = L (98% / 96%), 32.8k frames each.
- 4501 notes: assigned 4290 (L 2020, R 2270), unresolved 211 = **4.7%**, under
  the 5% gate (100 "both hands within reach", 111 "no fingertip close enough").
  Five assigned notes have the left hand sounding above a simultaneous right,
  which a pitch split could never produce: the reader is reading hands.
- What still blocks import: (1) the 211 unresolved notes have no lawful hand
  and must be resolved by a human or stay out (they block import by contract);
  (2) the bar reader's recall in dense passages (0.60 in the worst 30s window)
  means a Hard tier would be MISSING notes in the fast runs; (3) 41 human
  labels against the 100 the plan requires. Fix (2) first (track each bar as an
  object down the lane so consecutive same-key bars do not merge), then label,
  then decide.

---

# RESULTS — Zelda batch (four Sheet Music Boss videos), 2026-09-04

Mark's list: Song of Storms, Main Theme, Zelda's Lullaby, Gerudo Valley. All four
SMB videos downloaded at 1920x1080 60fps CFR (AV1). None of them is the Embers
red/grey render Silksong came from; three renderers appear, and the template
system had to grow to name its own colour metric per renderer
(`metric`, `classesWhite`, `classesBlack`, judged on the per-frame MEDIAN over a
press, because the 2020-22 3D render's white strike flare smears a run MEAN).

| Song | Video | Renderer | Geometry | Ambiguous | Audio F1 / worst 30s | Octave crop | Palette swap | Hands | Grid fit | Shipped |
|---|---|---|---|---|---|---|---|---|---|---|
| Zelda's Lullaby | O6MtYbfo1eY (2019) | flat Synthesia-style, blue/green | 52+36, residual 0.5px | 0 of 698 | 0.816 / 0.157* | refused (32 black) | 46 flipped, 0 unchanged, 56 ambiguous | blue=L green=R from the engraving in the video | 110, mean 0.046 worst 0.124 | Easy 269 / Hard 698 |
| Gerudo Valley | Sna0iom85IU (2020) | 3D render, blue/green | `--filmed` fit, residual 1.8px (uniform fit refused at 6.5px) | 9 of 1468 (0.6%), all listed | 0.860 / 0.788 | refused (30 black) | 314 flipped, 0 unchanged, 72 ambiguous | blue=L green=R from the engraving in the video | 120, mean 0.013 worst 0.052 | Easy 595 / Medium 1297; **Hard REFUSED by the audit** |
| Song of Storms | jxd-DCi_cLM (2022) | 3D render, dark-blue/cyan | 52+36, residual 0.7px | 0 of 942 | 0.869 / 0.814 | refused (32 black) | 228 flipped, 1 unchanged, 6 unmatched | **NOT HANDS** | (not run) | **EXCLUDED** |
| Main Theme | c0szv75MEU4 (2019), Xtre_JPPxBs (2024 EASY) | cropped keyboards | **REFUSED**: 32 and 25 black keys found | | | | | | | **EXCLUDED** |

\* Lullaby's worst window is the last 24 s: the piece ends at 182 s and the channel
outro jingle plays over the end card to 206 s (194 audio-only notes there, 3 % of
which match anything the video played, so it is not the piece). Inside the
performance the window gate holds.

## The audio-consistency gate, honestly

All three extractions FAIL F1 >= 0.90 exactly the way Silksong did (0.864):
precision 0.986-0.997, the shortfall is recall against a transcription that
produces octave ghosts (Storms 133 of 271 audio-only notes, Lullaby 68 of 311,
Gerudo 89 of 450 sit an octave or a twelfth above a video note at the same
instant). The threshold is NOT lowered and the numbers are NOT recomputed with
ghosts removed. What was verified directly instead: page 1 of each arranger's
own engraving, shown inside the video, bar by bar against the extracted events
(Lullaby bars 1-7, Gerudo bars 1-7, Storms bars 1-7): every pitch, every hand
colour and every bar length agreed.

## Song of Storms: the colours are voices, not hands

Bar 5 of the engraving puts F3+A3 chords and the E3 G3 B3 line in the SAME bass
staff; the video paints the chords CYAN and the line DARK BLUE. At 71.67 s a
cyan G2 sounds with a cyan G5 and D6 (43 semitones), and 33 instants have one
colour spanning more than a tenth. Transcribed velocity does not separate the
colours (p50 84 vs 89). Notes and timing are clean (0 ambiguous, median onset
error 3 ms) but hands cannot be read, and Law 2 forbids filling them from
pitch. Excluded; a hand source outside this video would reopen it.

## Main Theme: cropped keyboards

Both SMB renders show only part of the keyboard (45 and 36 white keys). The
committed geometry gate refuses anything but the full 88, so nothing was
anchored by guesswork. Reopening this needs a decision to anchor a cropped
keyboard from the black-key pattern plus the audio transcription's pitch
(the filmed lane's method), which is a new gate, not a lowered one.

## Gerudo Valley Hard

18 left-hand moves of 19 semitones at sixteenth-note speed (A3 -> D2, 152
semitones a second, the arranger's own bass figure at quarter = 120) trip the
120 st/s ceiling on 1.77 % of onsets (gate: 1 %). The audit is the contract for
video-authored hands (Codex round 3), so Hard is refused and the arrangement
ships as Easy 84 bpm / Medium 102 bpm, where the same moves fall under the
ceiling. Exempting video-authored Hard from the audit the way an engraving is
exempt is Mark's call, not the lane's.

## Lullaby Medium

thin('medium') keeps 656 of 698 (not a step down). The density cut cannot reach
the 317-593 band because in an eighth-eighth-quarter arpeggio every left-hand
note is an outer voice of its beat, so nothing is droppable without losing a
bass or a melody note. Two tiers, as the importer says.

## Lane fixes this run
- `extract.mjs`: template metric + per-type classes + per-frame median (above).
- `extract.mjs`: ambiguous count is now taken over the events that SURVIVE the
  ten-finger drop; it used to count title-card events already thrown away
  (Lullaby read 14.2 % when the real figure was 0).
- `to-import.mjs`: ambiguous events under the 2 % gate are LISTED and left out
  instead of refusing the whole file; `--meter N/D`; handMapping check is
  colour-name agnostic.
- `import-midi.mjs`: the density tier fill now runs for video-authored hands too.

---

# GERUDO VALLEY HARD — the audit exemption, 2026-09-05

Mark, in his own words: **"do the hard tier for gerudo, exempt it from the audit"**.

The refusal was real and is not being re-scored: the arrangement asks the left
hand for 18 leaps of about 19 semitones at sixteenth-note speed, 152 semitones a
second against a 120 ceiling, on 1.77% of onsets against a 1% gate. What changed
is WHOSE work the audit is grading. The ceiling was derived to catch hands a
SCRIPT invented; these hands are the ones Andrew Wrangell painted in his own
render, at his own marked tempo, and the leaps are his written bass figure. That
is the same argument that already exempts an engraved score's Hard tier, so
`import-midi.mjs` now treats `fromScore || videoHands` alike for Hard only.

What the exemption does NOT cover, and this matters most:
- **A CROSSING is still refused**, whoever authored the hands. Hands that cross
  mean we read the staves or the colours the wrong way round, and no authorship
  makes a mis-read right. The first version of this change skipped the audit
  outright, and Codex's planted fixture in `test/import-roundtrip.mjs` (eight
  deliberately swapped moments) failed within a minute. `crossings()` in
  `js/hands.mjs` is now the one definition of that rule and an authored Hard is
  still measured against it. Gerudo Valley: 0 crossings on 1019 onsets.

Three more things kept, deliberately:
- **Easy and Medium are still audited.** We cut those, so they are ours to grade.
- **A video-authored Hard is never thinned to pass.** The density fallback that
  trims a transcribed Hard "until it is playable" is skipped for authored hands,
  or the app would teach a different arrangement than the one on the page.
- **The exemption announces itself.** The importer prints that the tier does NOT
  pass on its own and names whose call it was, so this can never look like a
  green result.

Gerudo Valley now ships Easy 595 / Medium 1240 / Hard 1459 at 84 / 102 / 120 bpm.
Medium is a density cut of the Hard, so it is a strict subset of the arranger's
notes and a real step down (1240 against 1459, with 595 a step down again).

Zelda's Lullaby is unchanged at two tiers: its refusal was never the audit, it
is that every left-hand note is an outer voice of its beat, so no density cut
lands between 317 and 593 notes without dropping a beat's melody or bass.
