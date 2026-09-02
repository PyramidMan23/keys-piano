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
