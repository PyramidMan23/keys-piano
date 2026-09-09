# Video reconciliation evidence, 2026-09-09

Read `../THRESHOLDS.md:366` for the outcome and limits. This is not a completed
music-fidelity certificate. Gerudo has 273 corrected source strikes awaiting
permission to replace its three positional fingering entries. The current
imported note arrays remain unchanged; their new metadata reports the omissions.

## Reproduce without writing app data

Run from the repository root:

```powershell
node tools/video-lane/reconcile-reviewed.mjs
node tools/video-lane/import-reviewed.mjs
node tools/video-lane/measure-reconciliation.mjs --reviewed
node tools/video-lane/verify-scope.mjs
```

The import reproduction is a dry run by default. `--apply` writes app data and
can invalidate fingering. It must not be used for the corrected Gerudo source
under the current fence without approval for its fingering entries.
`--metadata-only --apply` reproduces the present state: original notes, compared
against the corrected full reference. No hand-typed generated song data is used.
`--id gerudo-valley` restricts the reproduction to that group.

The reviewer must regenerate only Gerudo's three fingering entries when applying
its corrected import. Do not use a general fingering regeneration that silently
changes unrelated songs. The existing importer automatically drops stale entries;
regeneration must follow, then all four required checks and the byte comparison.

The four required checks are:

```powershell
node test/check.mjs
node tools/hand-audit.mjs --all
$env:TEMP = Join-Path (Get-Location) 'tools/video-lane/reconciliation-2026-09-09/scratch'
$env:TMP = $env:TEMP
node test/import-roundtrip.mjs
node tools/finger-check.mjs
```

The temporary-directory environment variables keep the roundtrip test inside
this clone. No browser or server is needed. The 25 rendered gates are UNVERIFIED
here and belong to the reviewer on the serving copy.

## Evidence structure

- `*.raw.json`: full key-tint re-extraction, including rejected/ambiguous events.
- `*.signal.json.gz`: compressed per-frame red/green/blue samples and actual
  presentation timestamps. Used to choose real timestamps for reviewed splits.
- `*.witness.json`: independent two-row falling-bar runs, including one-frame
  flicker. These are diagnostics, not automatically accepted musical events.
- `*.witness-diff.json`: independent alignment and unmatched events for each row.
- `*.joint-candidates.json`, `*.single-candidates.json`: candidates requiring eyes.
- `*.decisions.json`: the reviewed decision for each candidate, with frame times,
  sheet and cell. Gerudo paired candidate indices 41, 203, 220 and 222 are rejected;
  all other paired candidates and single-row index 0 are accepted.
- `*-candidates-*.png`: before/after pairs, left then right, twelve pairs per sheet.
  Cell numbers are zero-based, reading left to right then top to bottom. The
  yellow marker identifies the tested key; the label includes decoded timestamps.
- `*.excluded-decisions.json`: every original extractor rejection/ambiguity and
  its scene-specific frame decision. Gerudo's nine ambiguities are all non-notes.
- `*.reviewed.json`: source events after applying the reviewed decisions. These
  retain uncertain release endpoints explicitly; they are not finger-hold truth.
- `*.evidence.json`, `*.mid`, `*.mid.video.json`: named sources, two-track Musical
  Instrument Digital Interface files, and full note-onset provenance reference.
- `*.import-preview.json`: dry import result. Gerudo's preview contains the
  corrected 680/1472/1732 tiers, unlike the current app's 595/1240/1459 tiers.
- `score-readings.mjs`, `*.releases.json`, `*-releases.png`: at least twenty independent
  written-value comparisons per song, including failures. Physical note-off is
  UNVERIFIED. Sample frame paths under scratch are reproducible intermediates;
  the contact sheets preserve the reviewed pixels.
- `span-frames.json`, `*-span-*.png`: all twelve held-span failures, visually
  inspected; both distant tinted keys are present. Their physical holding is
  UNVERIFIED. The report does not conceal them using a strike-only test.
- `*.measurements.json`, `measurements.json`: baseline accepted-event measurements.
- `*.reviewed-measurements.json`, `reviewed-measurements.json`: corrected reference
  versus current app, including full held-span lists and per-tier timing.
- `*.audio-consistency.txt`: unchanged audio-agreement gates. Gerudo now passes;
  Silksong and Lullaby still fail. Latency was not adjusted to manufacture a pass.
- `scope-proof.json`: literal comparison of every other serialized song object
  to commit 20c68dd, plus note-array comparison for these nine tiers.
- Other named frame images and `frames.json`: title/end cards, engraved sources,
  hidden colour switches and representative defects.
- Check/import text receipts: actual command results; metadata import is distinct from
  corrected dry import. `FILES.md` enumerates every retained changed file.

## Regenerate a visual review

The source workshop was read only. Videos and geometry remain at
`C:/Users/markh/keys-piano-tools/video-lane/{silksong,z-gerudo-valley,z-zeldas-lullaby}`.
Silksong is `video.webm`; the other two are `video.mkv`. Existing workshop geometry
is used unchanged. Every rendered frame reports its decoded presentation timestamp.

```powershell
node tools/video-lane/review-candidates.mjs gerudo-valley z-gerudo-valley mkv
node tools/video-lane/review-candidates.mjs gerudo-valley z-gerudo-valley mkv single
node tools/video-lane/review-releases.mjs
```

Replace song/folder/extension for the other songs. The review tools use ffmpeg
and the workshop Python/Pillow interpreter, writing only inside this repository.
They regenerate intermediate cropped frames and sheets, never human decisions.
The independent witness is `witness-bars.mjs`; its family argument is `embers`
for Silksong and `blue-green` for the other two. Feed its result to
`compare-witness.mjs <evidence-directory> <song-id>`. Alignments and failed
candidates are diagnostic evidence, not an instruction to insert every detection.

Generated intermediate cleanup was rejected by automatic approval policy. Those
files remain locally, excluded by this folder's .gitignore. The full local file
inventory identifies them separately; contact sheets retain the inspected pixels.
