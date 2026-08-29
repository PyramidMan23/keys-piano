# Canon gaps and recorded deviations

What the port knows it has NOT closed. Generated evidence, not recollection:
`node tools/canon-coverage.mjs` matches every labelled control in `index.html`
against every text node in all 18 extracted artboards.

The rule this serves (apply-design Rule 1): a design tool draws SURFACES, an app
is made of CONTROLS. On Mailroom, 13 beautiful screens covered about 40% of the
real controls and the gap only surfaced after the port had failed twice. A
control with no home is a design gap to take BACK to Claude Design, never
something to invent during the port.

## Where the port actually stands

| gate | what it proves | result |
|---|---|---|
| `tools/overlay.mjs` | design vs build, same pinned Chrome, dsf 2, motion frozen, clipped to the same device-pixel box | **18/18 screens, zero structural pixels** |
| `tools/canon-runtime.mjs` | what happens AFTER mount: app markup, duplicate ids, console errors, focus, accessible names, binder misses | **all clean** |
| `tools/canon-contract.mjs` | id + TAG + required data-* triple | 128/130 shared ids match |
| `tools/canon-nesting.mjs` | an addressed control inside a container the app rebuilds | 1 latent, below |
| `test/check.mjs` | the app's own suite | 212 green |

## Gap A: the "All tools" panel has no artboard

The library rail ends with `All tools 17` and the line "Learn 3, Practise 9,
Tools 5." Nothing in the canon shows what opens. These are the three rails Mark
screenshotted on 2026-08-28 and asked for by name.

**Interim, and it is an interim:** `bindAllTools` in `js/canon-library.mjs`
builds the panel by cloning the design's OWN dock button and its OWN group
label, filled from the app's real rails. Every screen is reachable and nothing
about the look was invented. It still needs the artboard, because a designer
would not lay out seventeen items as one flat column.

## Gap B: in-screen controls the artboards omitted

32 labelled controls have no text anywhere in the canon. They still work, on the
hidden legacy markup the app continues to drive, but the design never drew them.

| screen | controls |
|---|---|
| play | `btn-sound` Auto, `btn-mem` Memorize, `btn-take` Record take, `section-select`, `chunk-prev`, `chunk-next`, `tempo`, `wait-mode` |
| rhythm | `rhythm-go` Play pattern |
| echo | `echo-play`, `echo-again` |
| calibrate | `cal-redo`, `cal-reset` |
| metronome | `met-bpm`, `met-bpm-num`, `met-sig` |
| task | `task-easier`, `task-kb` |
| lesson | `lesson-kb-toggle` |
| improv | `improv-loop` |
| results | `results-again`, `results-theory` |
| first run | `firstrun-taps`, `firstrun-skip` |
| library | `explore-sort` |
| learn / practise rails | `btn-sight`, `btn-review`, `sess-quick`, `sess-skill`, `btn-keys12`, `path-technique` |

## Gap C: a state the design drew but the port does not reach

The `states` artboard draws a freeze offer (`#freeze-offer`, with `#freeze-yes`
and `#freeze-no` inside it). The canon library carries `#freeze-offer` but
nothing binds it, because `renderGameRow` does not run under the flag. Two
consequences:

- a streak-freeze offer never appears under the canon;
- `tools/canon-nesting.mjs` correctly reports `#freeze-yes` and `#freeze-no` as
  living inside a container the app rebuilds. It is latent rather than live only
  because that renderer is currently unreachable, which is not a safe reason.

## Gap D: the improv loop is a bar timeline

The design drew a 20-cell bar grid with chord names on four of the cells. The
binder fills the named cells in order. A loop with more changes than the design
sampled fills what fits, rather than inventing a bar layout the design never
specified.

## Recorded deviations (deliberate, not gaps)

1. **Artwork resolution.** The design inlines the full-size sleeve; the app
   serves the 128px thumb, because shipping 512px images for 40px plates would
   put a quarter of a megabyte of sleeve into an offline app's shell for no
   visible gain. This is the only thing the pixel gate still counts as
   different, and it counts it separately and says so.
2. **Accessibility added.** The artboards carry zero aria attributes and zero
   roles. The mount ports the app's own semantics across by id, and names the
   controls the design labelled only visually. A deviation FROM the canon, and
   not a negotiable one.
3. **A focus ring.** `all: revert` also reverted the app's focus treatment and
   the artboards never drew one, so `.canon-root :focus-visible` uses the
   design's own `--accent`.
4. **Standards mode.** The prototype had no doctype and rendered in QUIRKS mode,
   where a line box containing no text ignores the block's strut. Every geometry
   in `design/extracted/` was therefore quirks geometry that the app could not
   reproduce. The prototype now emits a doctype; two screens changed height by a
   few pixels, and moved TOWARD what Claude Design itself renders.
