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
`tools/press-probe.mjs` · `tools/seek-probe.mjs` · `tools/surface-check.mjs`

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
