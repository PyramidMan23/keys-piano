# Canon gaps and recorded deviations

Rewritten 2026-08-29 after the DESKTOP WAVE (10a + 11a-11n). Everything in here
is generated evidence, not recollection; each claim names the tool that proves
it.

The rule this file serves (apply-design Rule 1): a design tool draws SURFACES,
an app is made of CONTROLS. A control with no home is a design gap to take BACK
to Claude Design, never something to invent during the port.

## Where the port stands, 2026-08-29 desktop wave

| gate | what it proves | result |
|---|---|---|
| `tools/overlay.mjs` | design vs build, pinned Chrome, dsf 2, motion frozen, connectedness split | **37/37 screens, zero structural pixels** |
| `tools/canon-runtime.mjs` | post-mount survival, duplicate ids, console errors, binder misses, search focus | **all clean** |
| `tools/canon-clickable.mjs` | every VISIBLE control has a real listener (exits red on any dead one) | **95/95, 100%** |
| `tools/canon-journeys.mjs` | real hit-tested CDP clicks and typed characters, per-screen deep journeys asserting the visible result AND the persisted state | **24/24** |
| `tools/canon-contract.mjs` | id + TAG + required data-* | 130 shared ids, 128 match (2 below) |
| `test/check.mjs` | the app's own suite | 213 green |

## CLOSED this wave

**Every screen now has a desktop composition.** Before 2026-08-29 only the
library (7a) and play (9a) had 1418x738 boards; the other 14 screens rendered
as 756px phone columns floating in black, which is why Free play was "a tiny
keyboard strip in a void". Claude Design drew 11a-11n, one desktop board per
screen, same ids, same wording, new architecture; `boardFor()` in
canon-mount.mjs picks `<screen>-desktop` at boot when the window is 1418+.
Free play is now the full-width keyboard with the play deck's presence.

**7a replaced by 10a, the art-forward library.** Mark rejected 7a (art
squeezed, learning and tools buried). 10a was drawn under the same judge panel
(Apple HI, iTunes library, Spotify lead, contrast scientist, concert pianist):
the sleeves are the heart (132px grid, Fraunces titles, state in shape plus
word, E/M/H tier pips, plays), the recommendation and tools sit in plain view.
Panel rulings are annotated on the canvas next to the board.

**The old Gap B (in-screen controls the artboards omitted) is superseded.**
The 11-series boards carry every one of the screen ids the app addresses,
verified id-by-id against the extraction at commission time (echo-play,
cal-redo, met-bpm-num, task-easier, lesson-kb-toggle, improv-loop, rhythm-go
and the rest). `tools/canon-contract.mjs` holds the count.

**Gap C, the freeze offer, is live.** The states board's own module is lifted
verbatim into the library while an offer exists; `canonLibraryCtx` computes the
offer with the same humane rules as the legacy renderer (offered never forced,
a decline holds for the day). Journey-proven: a broken 3-day rhythm draws the
offer with the real numbers, Use one spends the token, records the frozen day
and clears the module.

**The narrow drawer exists.** 9c is wired below 1418px; the improvised in-rail
clone list is dead code kept only as a last-resort fallback.

**The deck spec (8a) is fully implemented.** Strike ring, chord envelope,
continuous nearness, budgets, tier wash, sustain pulse, and as of this wave the
last item: the sustained-note SCANLINE TAIL (1px line every 6px, scrolling).
The board gives no scroll speed, so it is derived from the board's own pulse:
one line spacing per 2.2Hz period. `FallsView.scanlineRows` is pure and the
suite pins spacing, scroll and wrap against deck-spec.json itself
(mutation-proven: changing the spacing goes red).

## Gap D: the improv loop is a bar timeline (unchanged)

The design drew a 20-cell bar grid with chord names on four cells. The binder
fills the named cells in order; a loop with more changes than the design
sampled fills what fits rather than inventing a layout.

## Contract residue: 2 of 130

`mode-falls` (play) and `echo-mode-echo` (echo-desktop): the app marks the
selected segment member with `data-on`; the design draws selection as inline
style on the selected member. The binder swaps the design's own harvested
styles (`bindSegmentByIds`), so behaviour and appearance both hold; the
attribute itself is absent from the canon by design. Accepted.

## Recorded deviations (deliberate, not gaps)

1. **Artwork resolution.** Rows/hero bind the shipped 128px thumbs; the 10a
   tiles bind the shipped 512px sleeves at 132px. The design inlines
   full-size images; the app serves what it ships offline.
2. **Art-true glow, hero AND tiles.** The hero's ambient glow and every tile's
   blur halo are recoloured at runtime from the ACTUAL sleeve (design baked
   its sample's colours; cloning spread Für Elise's amber onto every sleeve
   until the overlay caught it). The overlay art-classes textless
   radial-gradient and blur() layers, padding blur boxes by 3x the radius.
3. **Artless tiles use the design's plate variant** (stave hairlines + Georgia
   monogram) with the monogram derived by the design's own sample rule: first
   letters of the first two words, a single-letter first word stands alone.
4. **Tile pips read progress**: a tier's pip fills when that tier has any
   stars; a single-tier drill hides its spare pips. The state word carries the
   real state.
5. **Frame choice for the 14 utility screens is decided at boot width.**
   app.mjs wires its listeners onto these ids at module top level, so a
   post-boot remount would orphan them. The library and play react to live
   resizes; the utility screens pick up a width change on next load.
6. **The freeze module floats over the composition's top-left.** The states
   board draws it in isolation; the fixed 738px compositions have no slot, so
   the app positions it as an overlay. The module markup itself is untouched.
7. **Accessibility added** (unchanged): aria names ported by id and derived
   from the design's own labels; focus ring in the design's accent.
8. **Standards mode** (unchanged): the prototype emits a doctype; quirks-mode
   geometry is dead.
9. **The sound select maps the two REAL voices** (Grand piano / Synth); the
   board's Upright and Muted felt options are not shipped instruments.
10. **No emoji on canon surfaces.** The app's own copy used emoji as icons
    (43 in js modules); all stripped 2026-08-29, badge shapes now geometric
    glyphs (◆ ★ ◎ ● ■ ▲) so the shape-plus-word law holds without them.
