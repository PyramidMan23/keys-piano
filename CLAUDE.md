# Keys — read this before you build anything

Mark's personal piano-learning PWA. This file is auto-loaded when you work in
this directory. It exists because on 2026-08-30 a session told Mark "I can't
listen to YouTube videos" and started building a MIDI importer, while a working
audio-to-MIDI pipeline **already existed on this machine and had already been
used to build two of the songs in the library**. His words: "how did you not
know that was built? you nearly rebuilt something we have?"

**So: check this list before you say "we can't", and before you write a tool.**

## Before you finish, run the worklist

    node tools/worklist.mjs

It lists everything Mark has asked for that is not done yet, and each item
carries a CHECK, so "done" is a number and not a judgement call. It exists
because of a pattern he named on 2026-08-30: find a problem, write it up well,
move on without fixing it. Reporting is not finishing.

**Work it to zero.** Fix the next OPEN item, re-run, repeat. Items marked MARK
are blocked on a decision only he can make; they never justify stopping on the
others. Do not stop to report progress: report once, at the end.

## What already exists

**The listening lane** — `C:\Users\markh\keys-piano-tools\` (its own venv, NOT
the hermes one). Turns audio into MIDI:
- `venv/Scripts/yt-dlp.exe` + ffmpeg — a URL to a wav
- `transcribe.py <wav> <mid>` — ByteDance `piano_transcription_inference`
- `mid2json.py`, `diff-vs-keys.mjs` — compare a transcription to what we ship
- `run-one.sh <url> <slug>` — both steps
- ☠️ needs `librosa==0.9.2`; the checkpoint lives at
  `~/piano_transcription_inference_data/*.pth` and does NOT auto-download
- **Law (16th council, 2026-08-28): a transcription is EVIDENCE, not a song.**
  It may verify and flag. It never ships unreviewed, and it never decides hands.

**The watching lane** — `tools/video-lane/` (mirrored from
`keys-piano-tools/video-lane/`). A YouTube falling-note video to notes, times and
a per-note COLOUR, which is the hand information audio throws away:

    calibrate.mjs <frames...> --out geometry.json    the 88-key grid, FITTED
    extract.mjs <video> <geometry> <template>        key tint -> events
    compare.mjs <events.json> <transcribed.mid>      consistency vs the audio
    templates/*.json                                 per-renderer profile

- ☠️ **Read the KEY TINT on the drawn keyboard, NOT the falling bars.** Watching
  a band above the strike line scored F1 0.383. This renderer throws particle
  spray as bright as the bars (225-254) plus a ~10px bloom, so ONE note lit five
  key columns and a moment with three notes read as thirteen. The keyboard is one
  key wide by construction, is clear of the particles, and lights at the strike.
- ☠️ **A key's own median is not its rest colour if it is mostly down.** A3 is
  held ~88% of Silksong, so its median WAS the pressed tint and detection
  inverted: it reported the release gaps, 33 events, none at the right moment.
  Rest comes from the key TYPE (all whites ~(216,220,228)), per key only when
  that key agrees with its type.
- ☠️ **ffmpeg silently rounds an odd crop height down** (yuv420p needs even
  dimensions). A 231-row request gave 230-row frames and every frame slipped one
  row against the next. Even geometry, and assert the size showinfo reports.
- ☠️ **The frame is not always the piano.** The title card read as 50 notes at
  once. Scene gate, settle after the dissolve, and a ten-finger gate: no
  performance strikes more than 10 keys in one frame.
- ☠️ **Never fill a missing key from its neighbour's width.** That put a white
  key on top of black key 63. Fit the grid (residual 0.7px) and refuse if it
  does not fit.
- **`handMapping` is null and stays null until a human says.** Colour -> hand
  must come from evidence OUTSIDE pitch. "The lower cluster is the left hand" is
  Law 2 wearing a fake moustache.
- `to-import.mjs <events> <template> --bpm N --bpm-source "..." --meter M` writes
  the two-track MIDI; `import-midi.mjs --video-hands` takes the tracks as hands
  and NOTHING else a score would earn (fromScore false, pedal fix runs, Hard
  faces the audit, the transcription re-split never touches them).
- ☠️ **The grid fit cannot prove the tempo.** Onsets on a quarter-beat grid at
  70 fit at 35, 140 and 210 too. The bpm is a fact from outside (the
  arranger's marking) and `--bpm-source` says where; the fit only proves the
  render is metronomic at it.
- ☠️ **Colour is hand only when the renderer says so.** Sheet Music Boss /
  Embers paints by hand (mapping proven from the arranger's own published
  score). Erik C and Patrik Pietschmann paint a left-to-right gradient by pitch
  over a REAL keyboard: notes and timing readable, hands NOT. Never fill that
  gap from pitch.
- ☠️ **One channel is not one renderer.** Sheet Music Boss alone spans four: Embers
  red/grey (2025, Silksong), flat Synthesia-style blue/green (2019), a 3D render in
  blue/green (2020) or dark-blue/cyan (2022), and cropped-keyboard renders. A
  template names its own `metric` and per-key-type classes, measured on that
  video's own tint histogram, judged on the per-frame MEDIAN of a press (the 3D
  render's white strike flare smears a run mean). Never reuse thresholds across
  renderers.
- ☠️ **Colour is not always hand, even from SMB.** Song of Storms (2022) paints
  VOICES: bass-staff chords one blue, bass-staff line the other, a G2 in the same
  colour as a G5+D6 above it. Test every new video for same-colour spans over a
  tenth and for one colour above the other at the same instant BEFORE trusting
  bar 1; bar 1 alone agreed with the score and would have shipped a lie.
- **The arranger's own engraving is IN every SMB video** (page 1 on the end card):
  hand mapping and the tempo marking come from there; Musicnotes is not needed.
- Results, gates and the one failing number: `tools/video-lane/THRESHOLDS.md`.

**The importer** — `tools/import-midi.mjs`, `tools/midi.mjs` (a dependency-free
SMF reader and a small writer for fixtures). MIDI to a Keys song, three tiers,
each a strict SUBSET of the verified notes. It takes hands from the file's own
tracks where they exist and only falls back to the algorithm otherwise, and it
REFUSES to write a tier that fails the playability audit. Generated songs land
in `js/songs-imported.mjs`, never in `songs.mjs`.

**Hand assignment** — `js/hands.mjs`. `handsAreSane()` and an offline
`repairHands()`. Deliberately NOT wired into the app: see the law below.

**Gates** (all must be green before you ship):
`test/check.mjs` · `test/import-roundtrip.mjs` · `tools/overlay.mjs` ·
`tools/canon-runtime.mjs` · `tools/canon-clickable.mjs` ·
`tools/canon-geometry.mjs` · `tools/canon-samples.mjs` ·
`tools/canon-journeys.mjs` · `tools/score-render-check.mjs` ·
`tools/void-check.mjs` · `tools/hand-audit.mjs` ·
`tools/finger-check.mjs` · `tools/finger-probe.mjs` ·
`tools/restart-probe.mjs` · `tools/shell-check.mjs` ·
`tools/press-probe.mjs` · `tools/seek-probe.mjs` · `tools/surface-check.mjs` ·
`tools/bars-probe.mjs`

☠️ **`surface-check.mjs` was red for weeks and the app was never at fault.** It
read 2/8, and the note here said "the theory-task keyboard paints nothing at
all". That sentence was false. The gate opened each screen with `window.__show`,
which only toggles which screen is hidden; every one of those canvases is built,
sized and painted by its CONTROL HANDLER, and the theory keyboard is not drawn
until a drill actually starts. Opened the way a person opens them - the tool
row, Continue here, path > Start - the same six surfaces paint 97 to 99% ink,
unchanged app code (2026-09-01). Fixed in the gate; it now walks a real route
per surface and fails as NO CONTROL rather than falling back to `__show`.

Two things to carry out of that. **A gate can be the thing that is broken**, and
this one had already been caught making the identical mistake: `void-check.mjs`
carries a tombstone saying `__show` leaves `window.__falls` false and the deck
unbuilt. The lesson was written down and then not applied one file over. And
**a red gate whose diagnosis nobody re-derived becomes a fact**: "the theory-task
keyboard paints nothing" sat in this file as settled truth, which is exactly what
stopped anyone opening the screen to look.

**The tempo lane** — `keys-piano-tools/`, mirrored to `tools/tempo-lane/`. The
transcriber emits NO tempo and NO meter, so without this every transcribed song
wears an arbitrary 120bpm 4/4 grid (Mark caught it: Married Life is a waltz).

    pulse.py <wav> <out.beats.json>     librosa beat track + accents (the ear)
    meter.mjs                           bar first from harmony+bass, then the beat
    downbeat.mjs                        DP bar-line tracker + chooseBar + unfoldPhrase
    write-meter.mjs                     -> js/songs-meter.mjs   (time signatures)
    write-bars.mjs                      -> js/songs-bars.mjs    (bar lines)
    corpus.mjs                          the ground-truth harness, run it after ANY change

☠️ **GROUND TRUTH IS FREE AND WE ALREADY OWN IT.** For pieces with a Mutopia
score AND a recording, DTW-aligning the two transfers the score's real beats
onto rubato playing. `corpus.mjs` does this and scores the lane against the
thresholds committed before any of it ran: beat F1 ≥ 0.75, downbeat F1 ≥ 0.60.
Grade against the SCORE MIDI, never the library's imported copy — the import
quantises to a 1/4-beat grid, and truth that has been through the pipeline is
not truth (it read 0.442 where the real answer was 0.872).

☠️ **A SONG ONLY GETS BARS IF TWO INDEPENDENT READINGS AGREE.** The bar map's
implied tempo must match the meter model's heard tempo within 15%, or nothing
is drawn. Six of seven songs are refused by that rule and each refusal says
why; a regular PHRASE is indistinguishable from a long bar without it.

☠️ **Claude Design's binding tokens are not markup, and they shipped.** The
prototype carries `onChange="{{ noop }}"` and `checked="{{ boxOn }}"` /
`"{{ boxOff }}"`. A browser reads the first as an inline handler whose body is
the identifier `noop` (165 ReferenceErrors in the journal, one per toggle of
Wait for me) and any non-empty `checked=` as CHECKED, so a box the design shows
off rendered ticked. `extract-design.mjs` resolves them at the source, the
generator refuses a token that reaches it, and `check.mjs` asserts none ship.

☠️ **"The source recording is no longer on disk" was never true of a score.**
`record-tier-reasons.mjs` only looked in the workshop, so seven Mutopia pieces
carried a false reason for their missing Medium. The true one was arithmetic: a
tier is a step down only under 85% of the tier above, and `thin('medium')` on
an arpeggiated score keeps nearly every note. The importer now cuts a missing
tier FROM THE SCORE (beat-window, melody and bass protected, strict subset,
audit, and the library's own difficulty ordering). Where no band exists the
piece keeps two tiers and says why.

☠️ **THE PHANTOM 120.** `tools/midi.mjs` seeded a default 120bpm and kept it
beside a file's real tempo meta at tick 0, and `tempoOf` averaged the two: every
engraved score shipped too fast (Clair de Lune marked 60, taught at 90; the
Pathetique marked 36, taught at 78). A stated tempo now REPLACES the fallback,
and the average is weighted by the ticks each tempo rules, so a two-bar
ritardando cannot set a whole piece's number (Traumerei read 47 for a marked
60). Fixed 2026-09-02 for 15 score pieces, 43 tiers.

☠️ **RUN `tools/make-sleeves.mjs` FROM THE SERVING COPY.** It writes its scratch
`.sleeve.html` next to itself and then loads it from `http://localhost:4180`,
which serves `C:\Users\markh\keys-piano`. Run from the Drive build copy it
photographs the server's "not found" page, and keys-v110 shipped two cover
sleeves that were exactly that, byte-identical to each other, past every gate.
Same family as the gate trap below: the tool edits one tree and the browser reads
the other. Two related rules the same bug taught: a sleeve is drawn from the
group's FULLEST tier (an Easy tier's thinning had dropped nearly every F sharp,
so the key detector read G major as C major), and a key STATED by a score
(`import-midi.mjs --key "G major"`) beats a detected one.

**Bump `VERSION` in `sw.js` on every deploy**, or clients keep the cached build
and the work never reaches Mark. `shell-check.mjs` proves the shell precaches
everything the app imports: three modules were missing, including the one
holding the immersive Restart button, which would have been absent offline.

## Laws

1. **Never invent note data.** Notes come from a file or a transcription, never
   from memory. Typing a song out from memory is how `interstellar` ended up
   with a right hand that must hold 16 semitones and travel 46 in 238ms.
2. **Never split hands by pitch.** 38 of 128 songs have 100% of their notes on
   one side of a fixed pitch. That is a script, not an arranger, and it is the
   single biggest source of wrong teaching in this app. `hand-audit.mjs` detects
   it; do not add another one.
3. **Never rewrite `h` on a song that carries AUTHORED `f`.** Fingering is
   written against a hand. Change the hand and the fingering silently becomes a
   lie. Fingering DERIVED by `tools/finger.mjs` is the exception and must not be
   read as one: it is computed from the shipped hands, so a hand fix simply
   requires re-running the tool afterwards. Read literally, this law would have
   frozen all 62 outstanding hand defects the moment fingering was filled in,
   which is the opposite of what it is for. Check `song.fingeringDerived`.
4. **Repair offline, never at load time.** The data the learner receives must be
   the data in the file. Load time validates; it does not mutate.
5. **Fingering: notes yes, guessed fingers never** — and know which kind you
   are writing. EDITORIAL fingering is what a particular editor printed; it
   encodes an interpretation, cannot be derived, and inventing one is a lie.
   ERGONOMIC fingering is a consequence of the hand (five fingers of fixed
   length, a thumb that passes under, a span that runs out) and is mostly forced
   by the notes. `tools/finger.mjs` derives only the second, and earns the right
   to by re-deriving the scale fingering that WAS checked against real sources:
   a hard 100% on the white-key scales before it may write anything. It cannot
   reach the memorised flat-key patterns (Bb and Eb left hands are byte-
   identical despite different notes) and does not pretend to; those scales
   already carry verified fingering, so it never fingers them.
6. **The app renders the design's own extracted markup** (`js/canon-templates.mjs`).
   Binders bind DATA. They write no colour, size, radius or spacing.
7. **A subtree the app DRAWS into is not canon markup** and is exempt from
   `.canon-root * { all: revert }`. That reset beats SVG presentation
   attributes, including `rx`/`ry`, and it silently erased the whole score view.
8. **Change the design in the ARTBOARD**, then regenerate the canon and re-run
   every gate. Never patch a binder to outrun the specification.

## Where things live

- serving copy `C:\Users\markh\keys-piano` (scheduled task `KeysPianoServer`, :4180)
- build copy + git `G:\My Drive\Claude-Workspace\piano` → `PyramidMan23/keys-piano`
- ☠️ every mirror is `robocopy C: G: /MIR /XD .git`. A plain `/MIR` once purged
  the repo, and Drive plants `desktop.ini` inside `.git/refs` which breaks git.
- deeper history, traps 1-70: the `project-piano-learning-pwa` memory file.
