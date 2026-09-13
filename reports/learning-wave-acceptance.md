# Keys learning wave — supervisor acceptance

Status: INTEGRATION VERIFICATION IN PROGRESS. This is not a completion receipt.

## Delivery scope

- Guided reading and independent first-reading modes; score presentation receipts, honest finite material pools, separate pitch/rhythm/continuity and preserved legacy progress.
- 29 skill cards across written rhythm, notation, applied theory and expression; worked, guided, independent, later recall and transfer stages. 146 base steps plus 50 authored alternate transfer exercises.
- Written durations/rests, dots, ties/slurs, 3/4, 6/8 and triplets; flats/naturals, accidental carry, signatures, landmarks/intervals and vertical two-hand reading.
- Authored theory for four verified catalogue passages plus an original cadence study; connected technique and expression routes.
- Configurable daily route, distinct reading/repertoire/skill evidence, scoped rewards and restrained milestones.
- Dedicated authored-notation renderer. Existing song/practice rendering remains on its existing path.

## Preserved incoming work

The outgoing desktop handoff contained source changes absent from Git HEAD. Reconciled 10 runtime/test files and 385 changed/new artwork files into the authoritative source, with backups and SHA256 verification. See `outgoing-handoff-reconciliation.json`.

Library collections, recent Learning ordering, exercise exclusions, result-card visibility, restart, seek-aware Hear, recoverable guide controls and immersion are acceptance requirements. Static inspection confirms the outgoing app hooks were merged; final regression suite pending.

## Verification recorded so far

- Root independently ran `test/reading-session.mjs`: 18 checks passed.
- Root independently ran revised `test/learning-lab.mjs`: 52 checks passed. Covers all 146 base steps and all 50 alternate transfer exercises with simulated input; 21 unsupported-measurement paths require valid self-assessment rather than invented passes.
- Root independently ran `test/lab-score.mjs`: 3 checks passed.
- Renderer author ran `tools/lab-score-probe.mjs`: 41/41 checks, 204 exercises, 1336 noteheads at their expected staff positions. Root inspected final flat, triplet and tie/slur captures. Final full-suite rerun pending.
- Independent Opus reading, curriculum and UI reviews were performed. Root verified findings against code/reproductions. Curriculum findings fixed; final UI findings still in integration.
- Latest in-progress full learning UI probe reached 94/97 before the single-pass passage, retry and repair fixes. This is NOT acceptance.
- `tools/worklist.mjs` now invokes the authoritative complete gate roster, replacing its stale subset. Complete run pending.

## Boundaries

Authoritative checkout: `C:\Users\markh\keys-piano-astra`, starting HEAD `cd4e5a6`, branch `library-collections`.
Preview: http://localhost:4193/ . Source hash checked during implementation; final hash check pending.
Normal desktop copy `C:\Users\markh\keys-piano` (port 4180): unchanged by this wave so far.
Git commit/push: pending. Public deployment: not performed.
No changes to Mark's browser progress. Browser probes use disposable profiles.

Hardware acceptance on the P-45, human timing tolerances and actual learning/retention outcomes have not been measured. Generated reading and transfer pools are finite and reported honestly. Self-assessment is recorded separately from measured competence.
