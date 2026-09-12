# Keys: five improvements

Authorized 2026-09-12: build all five, fitting the existing design.

Work in the clean `keys-piano-astra` checkout. Preview on port 4193 (4181 has
an old Fuel service worker in the browser). Public deployment is a separate step.

## Acceptance

1. Coaching: a compact session brief explains the current target, the latest
   comparable attempt and the next action. Existing journey and correction
   controllers remain authoritative; free practice and arbitrary seeking survive.
2. Trustworthy music: a reproducible per-tier source inventory and comparisons to
   actual source MIDI/extraction files, with honest coverage and explicit unresolved
   differences. Source details are available inside the song, without claiming
   algorithmic hand-span checks establish musical fidelity.
3. Playing: a direct custom passage loop, consistent restart/seek and tempo
   behavior, recoverable compact controls, keyboard access and reduced motion.
4. Reading: proper key signatures, contextual accidentals, rests, beams, chords,
   tied durations and meter-aware layout. Unsupported/unverified timing must be
   disclosed rather than engraved as a verified score. Offline support retained.
5. Improvement: dated same-condition attempt comparisons and passage evidence,
   with help/tempo/hand/scope explicit; no synthetic progress or retention claims.

## Design contract

Extend the existing play surface. Dark near-neutral green chrome, Fraunces titles,
restrained mint actions, album art as the main color. Use the current controls and
disclosures; keep the playing area dominant. Retain the cream score page. Every
new control must work on the wide and compact boards and with keyboard input.

## Verification

Node acceptance tests, source audit, rendered browser probes against :4193,
desktop and narrow visual inspection, the full existing gates, and cold review.
Actual P-45 playing and retention remain learner acceptance, never simulated proof.

## Build receipt, 2026-09-12

All five areas have working local extensions. The existing visual system was
preserved and the scored desktop/mobile design review cleared its fixes.

- Core regression: 437 checks passed. New notation, comparison, source-drift and
  bounds tests passed, as did the MIDI import round trip.
- Browser notation: every four-bar window of all 159 eligible shelf tiers renders
  without exceptions. The other 82 tiers explicitly use the pitch-guide fallback.
- Passage probe: custom bounds survive restart and tempo changes; a completed loop
  records passage-only evidence. Whole-song reset and Score selection pass.
- Mobile: 390px disclosure fits, Tab focus is visible, collapsed guide preserves
  score clearance. Existing responsive and canonical-layout probes passed.
- Full gate runner reported 28/29 after its built-in retries. The learning trial
  reported 49/53 twice; a subsequent detailed standalone run passed 53/53 with
  no app changes. This is an unresolved intermittent test result, not a clean
  full-suite claim. Logs: gates-five-final.log and trial-five.log (local, ignored).
- Source inventory: 270 stored tiers, 37 compared with available MIDI; 28 match
  every shipped onset. The 138 source staff/hand differences are review findings,
  not automatically repaired notes. See reports/music-source-audit.md and
  reports/source-hand-differences.json. Staff mapping does not certify playing hands.
- Claude cross-review could not run because its OAuth login expired. The visual
  review cleared the scored fixes; it is not a substitute for the code review.

No public deployment or :4180 serving-copy update was performed. Next acceptance:
real P-45 playing, editorial source review, and resolving the intermittent trial
result before any public release. Unsupported tuplets/free timing remain labeled.

## Finish receipt, 2026-09-12

This supersedes the source counts and unresolved implementation findings above.

- Imported MIDI note positions are quarter-note units even when the time signature
  denominator is eight. `noteBeatUnit: 4` now records that contract. Notation,
  source comparison, practice chunks, memory starts and feedback bar numbers use
  the correct units. Existing eighth-unit curated arrangements retain their units.
- All 37 tiers with available source MIDI match every shipped note onset within
  the documented import tolerance. All 241 staff/hand differences trace to exact
  committed arrangement adjustments; zero are unexplained. This is traceability,
  not certification of an edition or independent approval of every playing hand.
  The 270-tier inventory continues to disclose which sources were not compared.
- Every four-bar window of all 165 eligible shelf tiers engraves successfully,
  including the six previously unsupported triplet tiers. The remaining 76
  performance-timed arrangements intentionally retain a labeled pitch guide:
  their recordings do not establish a verified regular score grid.
- Desktop and narrow visual review cleared the compact guide, triplet notation,
  score clearance and keyboard focus. The selected difficulty now correctly
  matches the open arrangement, including Easy on the wide play surface.
- The learning-trial race was in the probe: it clicked before listening finished.
  It now waits for the real playback transition. The Chrome launcher also uses
  uniquely allocated debugging ports, and failed gates retain full diagnostic logs.
  The perfect-lap fixture resets and plays in one task so browser scheduling cannot
  grade its first simulated note as a delayed wait-mode response.

Core regression remains 437/437; notation/source acceptance and MIDI import
round-trip checks pass. The full final suite finished **29/29 green**, including
53/53 learning-trial checks. Seek, perfect-lap, responsive and audio-exit probes
passed the runner's isolated retries after the loaded parallel run. The fast
worklist reports zero implementation items open; its historical form-rating
proposal remains a separate user decision. Logs: `gates-final.log` and the full
per-gate outputs under `reports/gate-logs/` (local, ignored).

Claude's cold code review was attempted but its OAuth session is expired. Physical
P-45 acceptance and real learner improvement remain external checks. No public
deployment or update to the separate :4180 serving copy was performed; use :4193.
