# Keys — Mastery Build (the 10-step roadmap)

You are building the "mastery wave" of **Keys**, Mark's personal piano-learning PWA. This
prompt is self-contained: everything you need is in here and in the repo. Read this whole
file before writing a line of code. Mark's word: build all ten items, in the wave order
below, with every gate green before moving on.

## The app, in one paragraph

Vanilla-JS PWA (no framework, no build step), Chromium-only (Mark uses **Edge**; Chrome has
an unsolved local-address block on this machine — do not "fix" that here). It teaches piano
via a Yamaha P-45 over Web MIDI: falling-notes + real-notation score modes, wait mode,
section/chunk trainers with tempo ramp, 30-kernel sight-reading, 11-lesson curriculum with a
first-attempt mastery ledger and error-weighted review, theory cards, rhythm tap with count
row, melody echo, pace meter, practice analytics, and a usage journal.

## Locations and ship discipline (non-negotiable)

- **Build copy (edit here):** `G:\My Drive\Claude-Workspace\piano`
- **Serving copy (never edit directly):** `C:\Users\markh\keys-piano` — served by the
  Windows scheduled task **KeysPianoServer** (`node serve.mjs`, port 4180, auto-starts at
  logon). After a sync, verify what the server actually serves with `curl`.
- **Gated sync — the only allowed deploy:**
  `node test/check.mjs > /dev/null 2>&1 && cp -r ./* /c/Users/markh/keys-piano/`
  (a failing suite must NEVER reach the serving copy).
- **Test suite:** `test/check.mjs`, baseline **67 checks green**. Every feature you add
  ships with node-level acceptance tests. Never let the baseline drop.
- **Service worker:** bump `VERSION` in `sw.js` (currently `keys-v24`) once per wave, and
  add any new .mjs files to its SHELL list.
- **Verify at the output, never the input.** After each wave: run the suite, sync, then
  drive the live app at http://localhost:4180 through a browser and prove the feature works
  (debug levers exist: `window.__simNote(midi, down)` simulates MIDI through the real
  pipeline, `window.__engine` is the live engine, `window.__openCard(card)` opens a theory
  card). Report honestly anything you could not verify.

## Architecture map

- `js/midi.mjs` — Web MIDI input. **Currently handles ONLY note-on/off (0x90/0x80). There is
  no 0xB0 control-change branch: sustain pedal (CC64) never reaches the app. Velocity is
  passed to onNote but almost entirely unused.** This file is where wave 1 starts.
- `js/engine.mjs` — DOM-free practice engine (groups, wait mode, timing windows
  PERFECT_MS=60 / GOOD_MS=150, per-lap events, pace events, calibration offset, chunkRange).
  All new scoring logic goes here or in new DOM-free modules so it is node-testable.
- `js/falls.mjs` — canvas falling-notes renderer (glow sprites, particles, fountains,
  reduced-mode perf latch at 4ms effects budget / 8-of-12 frames).
- `js/score.mjs` — hand-rolled SVG grand-staff renderer (no key signatures or rests yet —
  out of scope here; do not attempt).
- `js/songs.mjs` — 35 entries (10 songs × Easy/Medium/Hard + drills/scales), validateSong.
- `js/lessons.mjs` — curriculum + StaffDrill/TogetherDrill/PhraseDrill + pickReviewItems.
- `js/theory.mjs`, `js/rhythm.mjs`, `js/echo.mjs`, `js/sight.mjs`, `js/audio.mjs` (preview
  synth: per-session gain bus, JIT scheduler), `js/app.mjs` (all wiring; ~large).
- `serve.mjs` — static server + POST/GET `/journal` (JSON-lines usage journal at
  `C:\Users\markh\keys-piano\journal.log`). Journal decision-relevant events only.
- State: localStorage key `keys-v1` — normalized on load; notable fields: `songs` (per-id
  stats), `litems` (first-attempt mastery ledger), `lessons` (id → completion timestamp),
  `calOffsetMs`, `pmin` (practice minutes), `sight`, `rhythm`, `echo`, `lastSession`.

## House laws

1. **Mark is colour-blind.** Never signal by hue alone: pair colour with position, shape,
   or words. Right hand = amber + filled shapes; left hand = cyan + outlined shapes.
2. **No em dashes** in any UI copy, code comment, or output.
3. **Never guess musical or technical facts** — verify or mark clearly as arrangement
   choice. (No new song transcription is needed in this build.)
4. Dark-only committed theme; all colors explicit; contrast ≥ WCAG AA on new surfaces.
5. New engine logic = DOM-free and node-tested. UI verified live in the browser.
6. Wrong-note feedback is never punishing for physical accidents (see double-tap
   forgiveness and cross-hand unison dedupe already in engine.mjs — study both).

## Traps this codebase already taught (do not relearn them)

- Headless browser panes freeze requestAnimationFrame: drive `__engine.tick()` manually in
  probes; the HUD/render paths only run on a visible tab.
- `[hidden]` is overridden by any `display:` class — the fix `[hidden]{display:none
  !important}` exists in style.css; keep using attribute hiding.
- Rows in flex columns need `flex: none` or they compress and children bleed.
- Two notes with the same midi in one beat-group deadlock wait mode — buildGroups dedupes;
  keep it that way in any new grouping code.
- setInterval throttles in background tabs: any audio scheduler must skip overdue events,
  never burst-play them (see audio.mjs overdue policy).
- `node test | tail && cp` syncs even on failure — always use the gated sync form above.

## THE TEN ITEMS (council-locked, build in this order)

### Wave 1 — the "hear HOW he plays" vertical slice (items 1-4). Ship as one wave.

**1. Touch diagnostic (per-key velocity calibration).**
New module `js/touch.mjs` (DOM-free core). A guided diagnostic: the app asks Mark to play
sampled keys (a spread of ~8 keys across the range) at "soft", "medium", "strong" — several
strikes each. Store per-range calibration (median velocity per dynamic per register zone)
in state (`state.touch`, schema-versioned). All later dynamics feedback maps raw velocity
through this calibration; raw thresholds are forbidden (false precision). Include a
baseline-recording note in state (date + medians) so drift can be re-calibrated.
Acceptance: node tests for the calibration math (median per zone, classification of a
velocity into soft/med/strong per zone); live: diagnostic flow completes via __simNote with
synthetic velocities and persists.

**2. Sustain pedal (CC64) analysis.**
`js/midi.mjs`: add the 0xB0 branch; expose `onControl(cc, value)`; CC64 ≥ 64 = down.
Engine: track pedal state timeline during play (down/up events with timeMs + beat).
New DOM-free analyzer `js/pedal.mjs`: given the pedal timeline + note events, flag
(a) late pedal changes at harmony changes (pedal held across a chord-loop boundary >150ms),
(b) blur risk (pedal held while ≥N distinct pitch classes accumulate),
(c) gaps (pedal fully up across a section marked legato — only where songs opt in via a
`pedal: true` section flag; do NOT invent pedal markings for songs that never specified
them — treat pedal feedback as observational unless a song opts in).
UI: pedal state indicator in the falls view (a bar/word near the HUD: DOWN/UP with shape
change, not colour alone) + post-song "pedal notes" list on the results screen.
Acceptance: node tests drive synthetic timelines through the analyzer; live: __simNote-style
control simulation (add `window.__simCC(cc, val)` lever) shows indicator + results notes.

**3. Key-release articulation.**
Engine already receives note-off (falls.keyUp path). Record per-note release: gap or overlap
to the NEXT note in the same hand (ms and as a fraction of the note's written duration).
Classify: legato (small overlap), detached (small gap), choppy (large gap on notes written
long). Post-song: an articulation summary ("legato 72% of joined notes; 6 clipped endings")
plus per-section worst spot. Add to the journal. No per-note nagging mid-song.
Acceptance: node tests with synthetic on/off streams verifying classification boundaries;
live probe with timed __simNote on/off pairs.

**4. Voicing feedback (melody vs accompaniment balance).**
Using calibrated touch (item 1): for songs where hands are melody(R)/accompaniment(L) —
which is every current song — compare average calibrated dynamic of RH melody notes vs LH
notes over rolling windows. Post-song: "melody stood above the accompaniment X% of the
time" + a worst window pointer. Only report when calibration exists; never from raw
velocity. Acceptance: node tests on synthetic velocity streams (balanced vs buried melody);
live: results line appears after a playthrough with synthetic velocities.

**GATE: wave 1 ships (tests green, sync, live-verified) before wave 2 starts.**

### Wave 2 — evidence and honesty (items 5-6)

**5. Synchronized audio+MIDI take capture.**
"⏺ Record take" in the play screen: getUserMedia audio (ask permission on first use; fail
soft if denied — MIDI-only take) recorded alongside the MIDI event stream (timestamps
aligned to performance.now). Takes stored: audio as blob in IndexedDB (NOT localStorage),
MIDI events + metadata in IndexedDB with a small index in state. Takes shelf screen: list,
play back audio, and replay MIDI through the preview synth for A/B. Cap storage (e.g. keep
last 20 takes, oldest evicted; show usage). Audio is for review, never scoring (mic AGC
lies). Acceptance: node tests for the take index/eviction logic (DOM-free module);
live: record a short take via synthetic MIDI (audio permission may be undeniable headless —
verify the fail-soft path headless and note the mic path for Mark's first real use).

**6. Filmed self-review checkpoint.**
Lightweight recurring card (every ~7 practice days, pull-not-nag: shows as an optional
card on the library, dismissible): "Film 60 seconds of yourself playing." Shows the five
checks: balanced seat and feet, neutral wrist, relaxed shoulders, curved fingers, no
visible tension. Camera angle guidance: torso, forearms, wrists and keys in frame. A
"done" button logs it (journal + state) with an optional 1-5 self-rating per check.
Standing copy (verbatim): recurring pain or uncertainty means show a human teacher.
No video is recorded by the app. Acceptance: scheduling logic node-tested (due after 7
practice days since last done); live: card renders, done-flow persists.

### Wave 3 — memory and inner ear (items 7-8)

**7. Staged memory transfer.**
Per song section: a "Memorize" ladder with stages: (a) score visible → (b) reduced cues
(falls letters hidden + score dimmed 50%) → (c) landmarks only (first note of each bar
shown) → (d) blank (metronome only) → (e) RANDOM-START recall (app names a bar number to
start from — cures motor-chain-only memory). Stage passes at ≥85% accuracy, 0 wrong ×2,
same as the trainer; stage state persists per section. Reuse the falls renderer with cue
flags; do not fork it. Acceptance: node tests for the stage machine; live: stage flags
change what the renderer draws (probe canvas/DOM state).

**8. Audiation and simple transposition.**
Extend melody echo with two modes: (a) "Sing first": phrase plays, a 3-second gap invites
singing (untracked — honesty text explains why), then play-back on keys as normal;
(b) "Transpose it": play the phrase back starting on a DIFFERENT named key (+2 or +5
semitones, app names the new starting note); correct = the interval sequence matches from
the new root (engine-side interval comparison, octave-agnostic). Level ladder as echo.
Acceptance: node tests for interval-sequence matching incl. octave-agnostic compare;
live: full transpose round via __simNote.

### Wave 4 — pressure and creation (items 9-10)

**9. Performance simulation and recovery.**
"Performance run" mode on any song: no wait mode, no restarts, one take, three simulated
stakes (a count-in, a visible "audience" header, and no pause). Scoring emphasises
CONTINUITY: longest unbroken run, recovery time after errors (beats until next correct
note), and a "kept going" rating; explicitly do NOT punish wrong notes harder than usual —
punish stopping. Post-run report + journal. Acceptance: node tests for continuity metrics
(longest run, recovery beats) on synthetic event streams; live: one performance run e2e.

**10. Improvisation playground + 12-key fluency ladder.**
(a) Improv: pick a loop (Am-F-C-G, C-G/B-Am-G, or 12-bar C blues — chord data authored
inline, these are generic progressions); LH auto-comp plays via the preview synth (opt-in
sound, uses audio.mjs); the on-screen keyboard highlights chord tones (bright) and scale
tones (soft) for the CURRENT chord — colour + brightness + dot shape, not hue alone. No
scoring at all: an explicit no-judgement zone (journal logs minutes only).
(b) 12-key ladder: generate all 12 major + 12 natural-minor scales as trainer-compatible
drills (extend the existing scaleFromSteps generator; fingering: use standard fingering
tables — RH/LH per key — author them explicitly and test at least C, G, F, Bb, E for
correctness against standard fingering references; do not guess: if unsure of a key's
standard fingering, verify online before authoring). Ladder UI: a keys grid showing
passed/unpassed per key, fed by the existing section trainer.
Acceptance: node tests (scale generation for all 24, fingering spot checks, chord/scale
tone sets per progression chord); live: improv highlights change with the loop, one scale
drill playthrough.

## Per-wave definition of done

1. `node test/check.mjs` green (baseline 67 + your new tests).
2. Gated sync; `curl` the serving copy for a new-code marker.
3. Live verification against http://localhost:4180 with the debug levers; console clean.
4. sw.js VERSION bumped once; new modules in SHELL.
5. A short honest ledger in your final report: what is proven, what awaits Mark's hardware
   (real velocity/pedal/mic can only be finally proven by him playing).

## Context notes

- The usage-gate council ruling (5 practice sessions before features) is being explicitly
  overridden by Mark by commissioning this build. Note it, don't relitigate it.
- Do not touch: score.mjs key-signature work, Chrome debugging, VPS deploys.
- Memory file for this project (read it first):
  `C:\Users\markh\.claude\projects\G--My-Drive-Claude-Workspace-TheSolvaGroup\memory\project-piano-learning-pwa.md`
- Council notes with full specs/rationale:
  `C:\Users\markh\Claude-Workspace\MarkOS\brain\decisions\2026-08-24-council-keys-path-to-mastery.md`
  (and the five earlier Keys council notes alongside it).
- When done, update the memory file with what shipped, and end your report with a TLDR and
  a HOW TO LOOK section telling Mark exactly what to click.
