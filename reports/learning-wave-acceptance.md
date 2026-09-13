# Keys learning wave — supervisor acceptance

Status: ACCEPTED — Keys v133, 2026-09-13. All six packages are connected; see `learning-wave-integration.md` for the feature map.

## Delivery scope

- Guided reading and independent first-reading modes; score presentation receipts, honest finite material pools, separate pitch/rhythm/continuity and preserved legacy progress.
- 29 skill cards across written rhythm, notation, applied theory and expression; worked, guided, independent, later recall and transfer stages. 146 base steps plus 50 authored alternate transfer exercises.
- Written durations/rests, dots, ties/slurs, 3/4, 6/8 and triplets; flats/naturals, accidental carry, signatures, landmarks/intervals and vertical two-hand reading.
- Authored theory for four verified catalogue passages plus an original cadence study; connected technique and expression routes.
- Configurable daily route, distinct reading/repertoire/skill evidence, scoped rewards and restrained milestones.
- Dedicated authored-notation renderer. Existing song/practice rendering remains on its existing path.

## Preserved incoming work

The outgoing desktop handoff contained source changes absent from Git HEAD. Reconciled 10 runtime/test files and 385 changed/new artwork files into the authoritative source, with backups and SHA256 verification. See `outgoing-handoff-reconciliation.json`.

Library collections, recent Learning ordering, exercise exclusions, result-card visibility, restart, seek-aware Hear, recoverable guide controls and immersion were preserved. Upstream v132 history at `00cced0` was merged through `2ae7a73`, following the wave checkpoint `a54e811`.

## Final verification

- Root independently ran `test/reading-session.mjs`: 18 checks passed.
- Revised `test/learning-lab.mjs`: 54 checks passed. Covers all 146 base steps and all 50 alternate transfer exercises with simulated input; 21 unsupported-measurement paths require valid self-assessment rather than invented passes. Guided passages use actual note evidence for practice success, never independent credit.
- Root independently ran `test/lab-score.mjs`: 3 checks passed.
- Final engraving browser gate: 41/41 checks, 204 exercises, 1336 noteheads at their expected staff positions. Root inspected final flat, triplet and tie/slur captures.
- Independent Opus 5 reading, curriculum and UI reviews were performed. Root verified and fixed their confirmed findings.
- Full learning UI: 115/115. Lifecycle: 4/4 on both preview and delivered desktop. Core: 503 checks. Existing lesson walkthrough: 76/76; teacher walkthrough: 33/33; learning trial: 53/53; finish card: 36/36; navigation: 30/30.
- Complete final gate run: **38/38 green in 751 seconds**, on the source preview at port 4193, including isolated retries. Logs are retained locally in `reports/gate-logs`.
- The worklist now uses the complete roster. Its duplicate early geometry pass reported a calibration gap under concurrent load; the authoritative isolated gate subsequently passed all 16 screens. The redundant separate pass was removed so geometry has one owner. Final static worklist: 0 open, one pre-existing form-rating decision for Mark.
- Final desktop/390px rendered checks preserve the existing board and visual language. The phone worked action is visible at y670–717 in a 900px viewport, with no horizontal overflow; longer guidance remains in an accessible disclosure. Impeccable detector: no findings on the UI module.
- Integration fixes include placing the learning extension after the original lesson board, updating navigation and theory expectations, and stabilizing the engraving test at viewport changes. The responsive gate excludes unpainted closed-disclosure content and also checks loop controls while open. No thresholds were reduced.

## Boundaries

Authoritative checkout: `C:\Users\markh\keys-piano-astra`, starting HEAD `cd4e5a6`, delivery branch `feature/gamified-learning-wave`.
Preview: http://localhost:4193/ . Source/served bytes verified.
Normal desktop copy `C:\Users\markh\keys-piano` (port 4180): updated to keys-v133 after backing up the previous runtime. 62/62 runtime files byte-identical; served app, learning module, CSS and service worker verified.
Final commit and push are recorded in repository history and the handoff. Public deployment: not performed.
No changes to Mark's browser progress. Browser probes use disposable profiles.

Hardware acceptance on the P-45, human timing tolerances and actual learning/retention outcomes have not been measured. Generated reading and transfer pools are finite and reported honestly. Self-assessment is recorded separately from measured competence.
