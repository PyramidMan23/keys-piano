# Changed files and purpose

All paths are relative to the repository root. The table lists every retained
file in the review diff. No serving-copy or workshop file was changed.

| File | Why |
| --- | --- |
| js/songs-imported.mjs | Generated provenance for the three permitted groups; note arrays unchanged; Gerudo omissions recorded. |
| test/check.mjs | Assert video identity, source fields, full reference counts, hands and timing. |
| tools/import-midi.mjs | Optional video provenance input and dry preview export; default behavior unchanged. |
| tools/video-lane/THRESHOLDS.md | Dated findings, per-song numbers, failed gates, known differences and scope blocker. |
| tools/video-lane/extract.mjs | Retain excluded events and optional full timestamped colour signal. |
| tools/video-lane/rawframe.mjs | Render evidence frames with actual decoded presentation timestamps. |
| tools/video-lane/to-import.mjs | Generate full video provenance sidecars through the lane. |
| tools/video-lane/compare-witness.mjs | Align independent bar rows to key events and list disagreements. |
| tools/video-lane/import-reviewed.mjs | Reproducible dry import and metadata-only/apply modes. |
| tools/video-lane/measure-reconciliation.mjs | Whole-stream onset, count, hand and held-span measurements. |
| tools/video-lane/provenance.mjs | Compute per-tier reconciliation without hiding simplified-tier omissions. |
| tools/video-lane/reconcile-reviewed.mjs | Apply frame-reviewed Gerudo splits using decoded timestamps. |
| tools/video-lane/review-candidates.mjs | Render before/after candidate pairs and contact sheets. |
| tools/video-lane/review-releases.mjs | Compare written values to tint releases and render evidence. |
| tools/video-lane/verify-scope.mjs | Prove literal byte identity of every other imported group. |
| tools/video-lane/witness-bars.mjs | Independent two-row falling-bar diagnostic over entire recordings. |
| tools/video-lane/templates/sheet-music-boss-embers.json | Correct evidence and duration claims; numerical controls and colour mappings unchanged. |
| tools/video-lane/templates/sheet-music-boss-3d-blue-green.json | Correct evidence and duration claims; numerical controls and colour mappings unchanged. |
| tools/video-lane/templates/sheet-music-boss-synthesia-2019.json | Correct evidence and duration claims; numerical controls and colour mappings unchanged. |
| tools/video-lane/reconciliation-2026-09-09/.gitignore | Keep reproducible intermediate files out of review diff. |
| tools/video-lane/reconciliation-2026-09-09/README.md | Outcome boundary and reproduction instructions. |
| tools/video-lane/reconciliation-2026-09-09/check.txt | Actual command receipt. |
| tools/video-lane/reconciliation-2026-09-09/extractor-proof.json | Verified byte-identity or extractor/gate comparison. |
| tools/video-lane/reconciliation-2026-09-09/finger-check.txt | Actual command receipt. |
| tools/video-lane/reconciliation-2026-09-09/frames.json | Diagnostic snapshot or evidence metadata. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-corrected-dry-import.txt | Actual command receipt. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-metadata-import.txt | Actual command receipt. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-128.18.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-16.2.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-16.7.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-16.95.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-160.667.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-164.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-2.25.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-23.8.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-4.183.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-75.45.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-75.55.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-01.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-02.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-03.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-04.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-05.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-06.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-07.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-08.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-09.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-10.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-11.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-12.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-13.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-14.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-15.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-16.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-17.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-18.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-19.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-20.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-21.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-22.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-candidates-23.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-releases.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-single-candidates-01.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-single.candidate-frames.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-single.decisions.json | Per-event human frame-review decisions. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-span-0.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-span-1.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-span-2.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-span-3.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-span-4.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-span-5.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-span-6.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-span-7.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley-span-8.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.accepted.mid | Generated two-track import file or full provenance sidecar. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.audio-consistency.txt | Actual command receipt. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.candidate-frames.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.colour-runs.json | Diagnostic snapshot or evidence metadata. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.decisions.json | Per-event human frame-review decisions. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.evidence.json | Named video, engraving and reconciliation limits. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.excluded-decisions.json | Per-event human frame-review decisions. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.import-preview.json | Dry import, distinct from current app data. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.joint-candidates.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.measurements.json | Whole-stream timing and held-span measurements. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.mid | Generated two-track import file or full provenance sidecar. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.mid.video.json | Generated two-track import file or full provenance sidecar. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.raw.json | Full original extractor output with exclusions. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.releases.json | Independent written-value release check. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.reviewed-measurements.json | Whole-stream timing and held-span measurements. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.reviewed.json | Reviewed source events for lane input. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.signal.json.gz | Full sampled colour signal with decoded timestamps. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.single-candidates.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.witness-diff.json | Independent whole-video bar witness or comparison. |
| tools/video-lane/reconciliation-2026-09-09/gerudo-valley.witness.json | Independent whole-video bar witness or comparison. |
| tools/video-lane/reconciliation-2026-09-09/hand-audit.txt | Actual command receipt. |
| tools/video-lane/reconciliation-2026-09-09/import-roundtrip.txt | Actual command receipt. |
| tools/video-lane/reconciliation-2026-09-09/import.txt | Actual command receipt. |
| tools/video-lane/reconciliation-2026-09-09/measure.txt | Whole-stream timing and held-span measurements. |
| tools/video-lane/reconciliation-2026-09-09/measurements.json | Whole-stream timing and held-span measurements. |
| tools/video-lane/reconciliation-2026-09-09/reviewed-measurements.json | Whole-stream timing and held-span measurements. |
| tools/video-lane/reconciliation-2026-09-09/scope-proof.json | Verified byte-identity or extractor/gate comparison. |
| tools/video-lane/reconciliation-2026-09-09/score-readings.mjs | Independent written-value release check. |
| tools/video-lane/reconciliation-2026-09-09/silksong-2.117.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/silksong-86.3.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/silksong-89.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/silksong-candidates-01.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-candidates-02.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-candidates-03.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-candidates-04.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-candidates-05.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-releases.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/silksong-single-candidates-01.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-single-candidates-02.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-single-candidates-03.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-single-candidates-04.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-single-candidates-05.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-single-candidates-06.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-single.candidate-frames.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/silksong-single.decisions.json | Per-event human frame-review decisions. |
| tools/video-lane/reconciliation-2026-09-09/silksong-unmatched-candidates-01.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-unmatched-candidates-02.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/silksong-unmatched.candidate-frames.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/silksong-unmatched.decisions.json | Per-event human frame-review decisions. |
| tools/video-lane/reconciliation-2026-09-09/silksong.accepted.mid | Generated two-track import file or full provenance sidecar. |
| tools/video-lane/reconciliation-2026-09-09/silksong.audio-consistency.txt | Actual command receipt. |
| tools/video-lane/reconciliation-2026-09-09/silksong.candidate-frames.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/silksong.colour-runs.json | Diagnostic snapshot or evidence metadata. |
| tools/video-lane/reconciliation-2026-09-09/silksong.decisions.json | Per-event human frame-review decisions. |
| tools/video-lane/reconciliation-2026-09-09/silksong.evidence.json | Named video, engraving and reconciliation limits. |
| tools/video-lane/reconciliation-2026-09-09/silksong.excluded-decisions.json | Per-event human frame-review decisions. |
| tools/video-lane/reconciliation-2026-09-09/silksong.import-preview.json | Dry import, distinct from current app data. |
| tools/video-lane/reconciliation-2026-09-09/silksong.joint-candidates.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/silksong.measurements.json | Whole-stream timing and held-span measurements. |
| tools/video-lane/reconciliation-2026-09-09/silksong.mid | Generated two-track import file or full provenance sidecar. |
| tools/video-lane/reconciliation-2026-09-09/silksong.mid.video.json | Generated two-track import file or full provenance sidecar. |
| tools/video-lane/reconciliation-2026-09-09/silksong.raw.json | Full original extractor output with exclusions. |
| tools/video-lane/reconciliation-2026-09-09/silksong.releases.json | Independent written-value release check. |
| tools/video-lane/reconciliation-2026-09-09/silksong.reviewed-measurements.json | Whole-stream timing and held-span measurements. |
| tools/video-lane/reconciliation-2026-09-09/silksong.reviewed.json | Reviewed source events for lane input. |
| tools/video-lane/reconciliation-2026-09-09/silksong.signal.json.gz | Full sampled colour signal with decoded timestamps. |
| tools/video-lane/reconciliation-2026-09-09/silksong.single-candidates.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/silksong.unmatched-candidates.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/silksong.witness-diff.json | Independent whole-video bar witness or comparison. |
| tools/video-lane/reconciliation-2026-09-09/silksong.witness.json | Independent whole-video bar witness or comparison. |
| tools/video-lane/reconciliation-2026-09-09/span-frames.json | Whole-stream timing and held-span measurements. |
| tools/video-lane/reconciliation-2026-09-09/worklist.txt | Actual command receipt. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-173.783.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-186.383.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-186.4.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-190.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-2.317.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-6.817.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-candidates-01.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-releases.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-single-candidates-01.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-single.candidate-frames.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-single.decisions.json | Per-event human frame-review decisions. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-span-0.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-span-1.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-span-2.png | Inspected source/score/release/span frame evidence. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-unmatched-candidates-01.png | Inspected before/after candidate contact sheet. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-unmatched.candidate-frames.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby-unmatched.decisions.json | Per-event human frame-review decisions. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.accepted.mid | Generated two-track import file or full provenance sidecar. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.audio-consistency.txt | Actual command receipt. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.candidate-frames.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.colour-runs.json | Diagnostic snapshot or evidence metadata. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.decisions.json | Per-event human frame-review decisions. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.evidence.json | Named video, engraving and reconciliation limits. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.excluded-decisions.json | Per-event human frame-review decisions. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.import-preview.json | Dry import, distinct from current app data. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.joint-candidates.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.measurements.json | Whole-stream timing and held-span measurements. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.mid | Generated two-track import file or full provenance sidecar. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.mid.video.json | Generated two-track import file or full provenance sidecar. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.raw.json | Full original extractor output with exclusions. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.releases.json | Independent written-value release check. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.reviewed-measurements.json | Whole-stream timing and held-span measurements. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.reviewed.json | Reviewed source events for lane input. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.signal.json.gz | Full sampled colour signal with decoded timestamps. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.single-candidates.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.unmatched-candidates.json | Candidate enumeration and frame timestamps. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.witness-diff.json | Independent whole-video bar witness or comparison. |
| tools/video-lane/reconciliation-2026-09-09/zeldas-lullaby.witness.json | Independent whole-video bar witness or comparison. |
| tools/video-lane/reconciliation-2026-09-09/FILES.md | Complete retained review-diff inventory and reasons. |
| tools/video-lane/reconciliation-2026-09-09/local-intermediates.json | Inventory of retained local intermediates after cleanup was blocked. |

Automatic approval policy blocked generated-intermediate cleanup. 992 local
intermediates remain, individually listed in local-intermediates.json. They are
excluded from the review diff and are not required by the application.
