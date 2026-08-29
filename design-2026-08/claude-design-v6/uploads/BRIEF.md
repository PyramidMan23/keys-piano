# Keys - main screen redesign brief

**For Claude Design. Written 2026-08-28. The app is running and untouched; this produces a design only.**

---

## 1. What Keys is

A personal piano-learning PWA. Mark owns a Yamaha P-45 digital piano, plugs it into his laptop over USB,
and the app listens to what he plays over Web MIDI and scores it note by note. It replaced a $25/month
Playground Sessions subscription he barely used.

It is **not** a music player. Nothing streams. The songs are hand-curated MIDI charts, each split into
hands, tempo-mapped, sectioned and fingered. You learn them by playing them on a real piano.

One user: Mark. Dark room, evening, laptop on the piano. He is mid-song more often than browsing.

## 2. The screen being redesigned

`#screen-library` - the home screen. It is the first thing that opens, the launcher for every song and
every tool, and the place progress is read. Everything below is on this ONE screen today.

## 3. Why it is being redesigned

It works. It reads like a database. The specific failures, from the running app:

1. **The library is invisible.** Four collapsible shelves, three of them shut by default. On open you see
   headings, not music.
2. **The art is a muddy square.** Covers today are generated from the song's own note data: dark, tiny,
   near-identical at a glance, and they sit at the far edge of a card where text runs underneath them.
3. **It reads as a spreadsheet.** Every row is title / composer / difficulty range / three tier chips,
   laid out as columns. Nothing is bigger than anything else.
4. **The hierarchy is flat.** A shouting amber suggestion box, then quest pills, then shelves, all
   competing at the same weight.
5. **The tool rail floats over the content** and overlaps the rows behind it.
6. **Emoji are doing the job of icons** - a tell that nobody drew this on purpose.

## 4. The single biggest change: real cover art

**26 of the 30 song groups now have their actual album sleeve on disk**, fetched from the iTunes Search
API and the Cover Art Archive, verified against the expected artist, track and record. Not a stock photo,
not a generated pattern: the real sleeve.

- `art/512/<group>.jpg` - the big plate (hero, now-playing, detail)
- `art/128/<group>.jpg` - the row thumbnail
- `art/art.json` - manifest with artist, album, year and source URL per group

Real sleeves in the library right now include Hotel California, A Night At The Opera, Led Zeppelin IV,
In-A-Gadda-Da-Vida, 2001, Meteora, Hybrid Theory, Piano Man, The Blueprint 3, My Beautiful Dark Twisted
Fantasy, Gangsta's Paradise, Furious 7, Interstellar, Star Wars: A New Hope, Game of Thrones, Faded,
How to Save a Life, Oddments, First Love, Minutes to Midnight, Lost Demos, Super Mario Bros. 35 OST, and
Kempff / Karajan sleeves for the Beethoven.

**Four groups deliberately have no sleeve** because no honest recording exists: Happy Birthday, Bella Ciao,
C Major Scale, A Minor Scale. They keep a designed plate. **The design must handle both cases in the same
grid without one looking broken.** That is a real design problem, not an edge case.

The art is square, high-contrast, and often loud (Mario is bright red, Faded is ice blue, In-A-Gadda-Da-Vida
is orange). It has to sit in a dark room app without blowing it out, and text over it must stay readable.

## 5. What is actually on this screen today - the control inventory

**51 interactive controls.** A redesign that quietly drops any of these has failed. Numbered so nothing
gets lost:

**Header / status**
1. Library button (returns here from a song)
2. Now-playing readout
3. MIDI status ("Screen taps - plug the P-45 in for the real thing" when no keyboard)

**Progress + search**
4. Game level with XP bar (currently: level 1, 80/100 XP)
5. Rhythm streak chip (currently: 1-day rhythm, best 1)
6. Global search field - searches ALL songs, hides the shelves and shows one flat tagged result list

**The one suggestion**
7. Next-action card. The app's single amber recommendation, with a reason line under it. Currently:
   *Time to check "Chords from a symbol" is still there. Last tested 2 days ago, stage: independent.*
   It has a cover plate slot. It is the most important control on the screen.
8. Freeze offer (appears when a skill is about to decay)

**Quests**
9-11. TODAY: Master a section +60, 10 real minutes +60 (done), One clean run +60
12-14. MISSION: Make one song truly yours +150, Bank two song proofs +150, Three practice days +150

**Form check card** (appears periodically)
15. Five posture checks, 16. "Done, I watched it", 17. "Not today"

**The four shelves** (each a toggle, each holding song cards or rows)
18. Learning - 12 groups, open by default, weakest first
19. Repertoire - 1 group, 3-starred songs
20. Hall of fame - 9 groups
21. Explore - 17 groups, never finished
22. Explore sort toggle (A-Z / difficulty)

**Each song card carries** (this is the unit that matters most)
- title, composer/arrangement note, bpm
- three tier buttons: Easy / Medium / Hard, each with its own 3-star score
- difficulty range (e.g. 4.2-5.7)
- play count (Fur Elise: 79 plays)
- a status line: "Needs work" / "One clean day banked"
- the cover plate
- Songs with one tier (scales, Happy Birthday) show stars instead of tier buttons

**Practice chart** 23. a practice history chart
**Path teaser** 24. with a "Continue" button

**Tool rail - 3 groups, 15 tools behind them**
25-27. Learn / Practise / Tools rail buttons
28-30. Learn: My path, Lessons, Sight reading
31-39. Practise: Quick win, Improve a song, Skill workout, Rhythm tap, Melody echo, Improv, 12 keys,
       Free play, Metronome
40-44. Tools: Trophies, Takes, Voice (shows current instrument), Latency calibration, Touch diagnostic
45-51. Section carets, results list, and the hint line "Want a new song? Ask Claude to curate it."

## 6. Real state to design against - use these exact numbers

Not placeholder data. This is Mark's actual save:

- Level 1, 80/100 XP, 1-day rhythm streak, best 1
- Learning: 12 (Lost, Game of Thrones, A Minor Scale, Runaway, C Major Scale, Fur Elise, Happy Birthday,
  Star Wars Main Title, Still D.R.E., Super Mario Bros. Theme, He's a Pirate, and one more)
- Repertoire: 1. Hall of fame: 9. Explore: 17.
- Fur Elise: 79 plays, difficulty 4.2-5.7, "One clean day banked", 3/3 stars on all tiers
- Still D.R.E.: 39 plays, 2.5-6.5, one clean day banked
- Happy Birthday: 24 plays, 2.9, 2/3 stars
- Super Mario Bros. Theme: 5 plays, 3.3-6.2, needs work
- C Major Scale: 3 plays, 3.8, needs work
- Lost: 1 play, 2.7-5.9, needs work

## 7. Direction

**Immersive, intuitive, and unmistakably deliberate.** The bar is a music app someone would pay for:
Apple Music's editorial weight, not a dashboard.

**Mark's taste, non-negotiable:** rich, not flat minimalism. Dark, but with real depth and material - not
a grey box with rounded corners. Art-led. Confident type. Density is fine; blandness is not.

### The AI tells to avoid, explicitly

These are the things that make software look generated. None of them appear in this design:

- Purple-to-indigo gradient anything, especially a hero
- Glassmorphism applied uniformly to every surface
- Emoji standing in for icons (the current app is full of them - they go)
- A centred hero with a big word and a tagline under it. This is an app, not a landing page.
  "Keys / Your P-45, your songs, no subscription." reads as a marketing site and should not survive.
- Uniform card grid where every tile is the same size and weight
- Pill badges on everything
- Evenly-spaced everything. Real design has asymmetry and a clear first thing.
- Generic sans set at one weight throughout
- Decorative sparkle/star iconography
- Em dashes anywhere in copy. Use commas, colons, or full stops.

### Hard rules

- **Mark is colour-blind.** Never use hue alone to carry meaning. Red/green, blue/purple: always paired
  with shape, position, weight or a label.
- **Both themes designed, not inverted.** Dark is the primary (he plays at night). Light must be drawn,
  not computed.
- **44px minimum touch target** on anything tappable.
- **Text over artwork must pass WCAG AA in both themes.** Sleeves are loud; scrim or plate accordingly.
- **His real viewport is 756 x 393 CSS px** (Edge at 190% zoom on a 1440 window). Design must hold from
  ~375px through ~1440px. Short viewports are the norm, so vertical budget is tight.
- Offline PWA. No web fonts that need a network, no remote images. Art is local.

## 8. What to produce, in this order

1. **Three identity directions for the library screen**, each rendered on the SAME real content:
   the next-action, the Learning shelf with 4 real cards (Fur Elise, Still D.R.E., Super Mario Bros.,
   C Major Scale - so a no-sleeve card is in every direction), the shelf headers, and the tool rail.
   Real album art, real numbers from section 6. One artboard each, side by side.
2. Then, after Mark picks one: the full main screen in that direction, dark and light, with every one of
   the 51 controls given a home, plus the empty state, the search-results state, and the no-MIDI state.

Do not design a screen whose content you have not been given. Ask instead.
