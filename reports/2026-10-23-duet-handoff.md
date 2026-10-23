# Duet handoff (keys-v135), 2026-10-23

Branch `claude/keys-app-roadmap-qkvkef`. Not on `master` yet: the push to master
was blocked as a production deploy and needs Mark to merge or approve.

## What Mark asked for
A piano app that teaches reading without reading ever getting ahead of playing,
looks like the existing Keys (dark green, Fraunces, mint, cream page), feels
smooth, and has no background glows on the main menus. He chose points 1-3 of
the competitor review: help that moves itself, one view where bars and noteheads
are visibly the same note, and help that fades instead of swapping views.

## What shipped
| Where | What |
|---|---|
| `duet.html`, `js/duet.mjs` | Duet page. Engraved score strip over the falls, one Engine clock. |
| `js/engraving.mjs` | `windowBars` (default 4, so the app is unchanged). Duet sets Infinity for one strip. |
| `js/canon-play.mjs`, `js/app.mjs` | Duet button at the end of the Falls/Score segment (wide board via canon, narrow/plain via app). Opens `duet.html?song=<id>`. |
| `js/app.mjs` | Library atmosphere wash no longer painted. |
| `style.css` | Library cover halos hidden; phone (<=755px) library reflow so the page is 390px wide, not 520px. |
| `sw.js`, `index.html` | keys-v135, duet files in the shell. |

### How Duet behaves
- **Help** is a number per song in `localStorage['keys-duet']`, 0 to 1 in steps
  of 0.25. A run with 90%+ right notes (hits / (hits + missed + wrong); NOT
  `engine.accuracy()`, which caps wait mode at 80%) takes a step off; under 70%
  puts one back. A new song starts one step more helpful than your best song.
- **Help mapping**: letters while help > 0.6; lookahead = 0.75 + 3.25 x help
  beats; help 0 = lookahead 0.02 (bars effectively gone, keys still light).
- **Hesitation**: waiting > 2.2s on a group raises help to at least 0.75 for
  that group only.
- **Glide**: beat -> x table from the `[data-beat]` noteheads, interpolated,
  applied as `translate3d` (a scroll cannot go negative, so early notes would sit
  left of the line). Play line at 28% of the strip.
- **Threads**: when a new group becomes current, a 1.5px bezier in the hand
  colour from each notehead to its key, 900ms fade. Off under reduced motion.
- Only songs that engrave (`notationModel(s).reason` empty) are listed: 227 of 304.

## Independent review, and what was fixed
A fresh reviewer read the whole diff cold. Fixed:
- **Offline**: Duet buttons open `duet.html?song=<id>`, and the shell lookup did
  not ignore the query, so Duet failed offline. `sw.js` now matches navigations
  with `ignoreSearch`.
- **Phone search results**: song rows had four fixed columns that left the title
  0px wide (page 426px, song not tappable). Title now takes the first line.
- **Timed mode hesitation**: with Wait off nothing ever waits, so a missed note
  now brings the bars back for two beats.
- **Hear it**: plays each group as it falls due in both modes (was 0% in timed
  mode), pairs every press with a release, resets the button when it ends.
- **Threads** re-read the notehead each frame, so they follow the glide.
- **Tempo / Wait / Restart** reuse the engraved strip instead of re-drawing it.
- `canon-play.mjs` keeps its original mixed line endings: the diff is 16 lines.
- Duet has the app icon (the favicon 404 is gone).

## Verified
- `node test/check.mjs`: 504/504 green.
- Headless Chromium, desktop 1280-1400 and phone 390: library, Explore, a song,
  the Duet button, Duet, back. No page errors. Phone pages are exactly 390 wide.
- Full run of Ode to Joy and Lost (Easy): help steps 1 -> 0.75 after 100%.
- Frame time: 16.7ms median and p95 on Ode to Joy, The Entertainer (Hard,
  2621 notes) and Fantaisie-Impromptu (Hard, 3013 notes).
- NOT verified: a real P-45 session, a real phone, actual learning.

## Known limits and next steps
1. **Load time of long songs.** The whole song engraves at once: 1.4-2s headless
   for the 2500-3000-note Hard tiers (Ode to Joy 1.5s total, most of it the song
   library). Fix if it shows on a phone: engrave the first 8 bars, then the rest
   in idle callbacks.
2. **Phone library CSS keys on inline-style substrings** of the canon template
   (`width:186px`, `width:412px`, tab-cell style). If the library template is
   regenerated, re-check the phone width (`document.documentElement.scrollWidth`
   must equal 390 at 390).
3. **Duet is its own page**, so the canon play screen and its gates are untouched.
   Folding it into the play screen as a third view means making the red gates
   green first (overlay, canon-journeys, canon-geometry, canon-samples,
   score-render-check; they need Chrome at the Windows path).
4. **Song adding is still the biggest friction.** Proposed: one inbox folder and
   one command that picks the MIDI/score route or the video lane, runs the
   checks and writes all tiers.
5. Roadmap from the competitor review not built yet: visible pulse on the beat
   and a clap-it-first step (rhythm), 30-second sight-reading checks from notes
   already played, song-first home with one Play button.
