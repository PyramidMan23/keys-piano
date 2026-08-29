# Keys palette, 2026-08-29

Mark: "I don't want the main colour on top to be orange. Everything I've been doing is orange. I love
green, like earthy greens. And brown. I don't know, maybe not brown."

Every number below was measured by `palette-check.mjs` and `palette-solve.mjs` in this folder, not
picked by eye. Re-run either to reproduce.

---

## Why not orange, on the record

This is not a new preference. On 2026-08-26, looking at the deployed solvapartners site, Mark said the
amber tinge is "the same colour Claude and Claude Design always puts in", and asked for something that
does not read as AI colour slop. solvapartners was rebuilt on a gum-green and ivory family (`#2E6B47`)
which he approved. Keys uses that same green family, so his tools agree with each other, but on a dark
ground instead of ivory so it is not a copy of the site.

**thesolvagroup.com keeps its orange. That is his approved flagship and is not to be "fixed".**

## The five rules this palette follows

**1. The album art is the colour. The interface is not.**
Twenty six real sleeves are now in the library, and they are loud: Mario is bright red, Faded is ice
blue, In-A-Gadda-Da-Vida is orange, the Deutsche Grammophon Fur Elise is pure yellow. A UI with its own
loud accent competing against those is mud. This is why Apple Music and Spotify run near-black chrome.
The hue budget belongs to the sleeves; the chrome stays near-neutral and lets them do the work.

**2. Accent scarcity is why the app currently "feels orange".**
The problem was never the hue, it was the AREA. Today's next-action is a full-width amber SLAB, so amber
is a surface rather than a mark. Green would make exactly the same mistake at the same size. So:
green appears as a rule, a small filled button, a dot, and the active tab underline. **Never as a field
wider than a button.** Roughly 60 percent ground, 30 percent panel and ink, 10 percent everything else.

**3. Lightness carries meaning. Hue only decorates it.**
Mark is colour-blind. Hue is not a channel that can be relied on, so the four states are separated on
the lightness axis, which survives every type of colour vision, and each one still carries a glyph and
a word as well. Solved values:

| state | colour | on `#0A0D0B` | deuteranope | protanope |
|---|---|---|---|---|
| banked, clean, correct | `#7cb694` | 8.35:1 | L\*61 | L\*63 |
| decaying, needs attention | `#f0ce7f` | 12.87:1 | L\*90 | L\*88 |
| wrong note | `#d49891` | 8.09:1 | L\*78 | L\*76 |
| inactive | `#6c7f75` | 4.58:1 | L\*48 | L\*49 |

Smallest gap between any two: **11.9 L\***. For comparison, the app's current amber `#f0a832` and red
`#e05252` sit **1.0 L\* apart** as a deuteranope sees them, which is to say they are the same colour.
Fixing that is worth more to Mark than the hue change he asked for.

Note the wrong-note red is softer than today's. That is deliberate: a practice app should not shout at
someone for a missed note at eleven at night. The severity is carried by the word and the glyph.

**4. Green is the conventional "success" colour, so making it the brand colour costs something.**
If green is both the identity and the meaning of "you did it", the signal stops being a signal. Two
mitigations, both required: the brand green (`#2E6B47` deep fill) sits at a clearly different lightness
from the state green (`#7cb694` light ink), and every state keeps its glyph and its label so the colour
is never doing the work alone.

**5. The register is low-arousal, because he plays at night.**
Amber and red are the alert register. Desaturated greens are the restorative one. Reserving warmth for
things that are genuinely urgent (a skill decaying on Thursday) means it lands when it appears, instead
of being the wallpaper it is today.

## The brown question, answered honestly

Brown is dark orange. Literally: take the amber he is sick of, drop the lightness and the chroma, and
you have brown. As a **colour**, it reimports exactly the warmth he is trying to get away from.

As a **ground** it is a different thing entirely. A warm near-black, below about L\*12, reads as a dark
room rather than as brown, and it is the oldest trick in gallery hanging for making artwork come
forward. So: brown is allowed underneath the art, never on top of it. That is the `darkroom` option.

## The three grounds to choose between

All three carry the same accent and the same state ladder. Only the ground and ink change.

| | ground | panel | ink | reads as |
|---|---|---|---|---|
| **Conservatory** | `#0A0D0B` | `#121814` | `#E9EDE7` | near-black with a faint green cast, closest to the green he already approved |
| **Darkroom** | `#100E0B` | `#191611` | `#EDE9E1` | warm near-black, the brown answer, sleeves pop hardest against it |
| **Eucalypt** | `#0B0D0C` | `#141816` | `#E8ECEA` | cool charcoal, calmest, most like an instrument and least like a brand |

Shared across all three:

```
--accent-fill : #2E6B47   deep forest, filled buttons and the active marker (white on it = 6.34:1)
--accent-ink  : #7cb694   accent text, rules, the active tab underline
--right       : #7cb694   banked, clean, correct
--urgent      : #f0ce7f   decaying, needs attention
--wrong       : #d49891   wrong note
--muted       : #6c7f75   inactive
```

## One thing worth stealing from the expensive music apps

The hero sleeve can throw a soft bloom of its own dominant colour behind itself, so the screen quietly
takes on the mood of whatever Mark is about to play. That is what makes Apple Music feel alive.

The rule that keeps it safe: **the bloom is ambient only.** It never colours a control, a state, or a
piece of text. Functional colour always comes from the fixed palette above. Decoration can be as
colourful as the record; meaning cannot.

---

# Revision, 2026-08-29: measured against Apple Music and Spotify

Mark: "what can we learn from looking at itunes and spotify?" So both were opened and **measured** with
getComputedStyle and getBoundingClientRect, not recalled. Our own design was measured the same way.

## What the tape says

| | Apple Music | Spotify | Keys, before this revision |
|---|---|---|---|
| page ground | `rgb(31,31,31)` L\*12 | `rgb(18,18,18)` L\*5 | L\*3 |
| raised surface | (page is the surface) | `rgb(31,31,31)` L\*12 | L\*8 |
| artwork sizes | 200, 40, 96, 256, 528 | 176 | 72, 40 |
| track row | 46px, four fields, 18 of 18 | n/a | seven fields plus three tap targets |
| type steps | about six, floor 11px | about five, floor 11px | **19 steps, floor 9px** |
| accent | none in chrome | green L\*66 to 76, play control and active nav only | green L\*69 |

## What changed, and what did not

**The ground splits in two.** Claude's first read was "both apps sit artwork on L\*12, so raise our
ground". Codex killed it: Spotify's PAGE is L\*5 and only its raised CARDS reach L\*12. A blanket raise
would flatten the hierarchy and add glare in a dark room. So Keys copies the split Spotify actually uses:

```
--ground : #0d120f   L*5    the page
--raised : #1a221c   L*12   cards, the recommendation strip, the rail
--line   : #253129   L*19   borders, and the edge around every sleeve
```

That last one is the point: a 1px border 7 L\* above the card is what stops a dark album cover from
dissolving into the surface behind it. The defect was local, so the fix is local.

**Six type roles, 11px floor.** The clearest finding of the whole exercise: our design used **19 distinct
size and weight steps, including 29 instances of 9px text**. Neither reference goes below 11px, and both
run five or six steps in total. Nine-pixel type is not a style choice, it is the signature of typography
that was never designed.

**Artwork stays at 40 and 72.** Claude wanted to drop 72 as an orphan size, since both apps quantise to
about 40 for rows then jump to about 200. Codex rejected it: that quantisation reflects streaming
primitives, and Keys has a third primitive neither app has, a prescribed next action that must outrank a
row without eating half a 393px viewport. So 40 for rows, 72 for the recommendation strip only, and about
200 reserved for a future feature view.

**The row keeps its density.** Apple's 46px four-field row does not transfer, because a streaming app has
no progress to show and our row's entire job is plays, difficulty, state and tier.

## The semantic ladder, re-solved

Raising the card to L\*12 broke the old set: `muted` fell to 3.82:1 on a card. Lifting it collapsed it
against the green; lifting the green pushed it into the red's band for protanopes. One change moves the
whole ladder, so all four were re-solved **jointly, against the raised surface**, which is the worst
background any of them now sits on. Solving against the page would have passed on paper and failed in
the product.

| state | colour | on the raised card | deuteranope | protanope |
|---|---|---|---|---|
| banked, clean, correct | `#82bf9c` | 7.66:1 | L\*64 | L\*66 |
| decaying | `#efce81` | 10.71:1 | L\*90 | L\*88 |
| wrong note | `#d4a19b` | 7.27:1 | L\*79 | L\*77 |
| inactive | `#788c82` | 4.55:1 | L\*53 | L\*54 |

Smallest gap between any two: **10.5 L\***. Accent fill stays `#2E6B47`, white on it 6.34:1.

Reproduce with `surfaces-solve.mjs` and `palette-solve.mjs` in this folder.

---

# Revision 2, 2026-08-29: true black, because the panel is OLED

Mark: "lets make sure the background its true black so the colours pop and theres a lot of contrast and
it looks amazing on OLED do you know what i mean??"

Yes. On OLED a `#000000` pixel is switched **off**. The contrast is not a ratio, it is absolute, and
artwork appears to float in nothing rather than sit on a dark rectangle.

**His panel, read off the machine rather than assumed:** Samsung Display (`SDC`), 2880 x 1800, physical
size 30 x 19 cm (14.0 inch diagonal), digital input, in an HP OmniBook X Flip 14. That is HP's 2.8K OLED
configuration. There is no field that literally reports "OLED", so this is strong evidence rather than a
readout, but every attribute matches and none contradicts.

## This sharpens the Spotify split, it does not undo it

Apple Music and Spotify both avoid true black. That is not an aesthetic preference, it is a shipping
constraint: they run on millions of LCD panels, where `#000000` is a grey hole that shows backlight
bleed and clouding. Keys ships to one known OLED panel, so it can take the option they cannot.

What does NOT change is the reason the raised surface exists. A black album sleeve on a black ground has
no edge on any panel technology. So:

```
--ground : #000000   L*0     the page, pixels off
--raised : #1a221c   L*12    cards, the recommendation strip, the rail
--line   : #253129   L*19    borders, and the edge around every sleeve
--ink    : #E9EDE7
```

The card is now **12 L\* above the page instead of 7**, so the structure reads harder than it did before,
not softer. Keeping the card at L\*12 rather than dropping it toward black also avoids near-black
banding, which OLED shows more readily than LCD.

## The ladder, re-verified on true black

Every semantic colour was re-checked against the **raised card**, which is the worst background any of
them sits on. Solving against the page would pass on paper and fail in the product.

| state | colour | on the raised card | deuteranope | protanope |
|---|---|---|---|---|
| banked, clean, correct | `#82bf9c` | 7.66:1 | L\*64 | L\*66 |
| decaying | `#efce81` | 10.71:1 | L\*90 | L\*88 |
| wrong note | `#d4a19b` | 7.27:1 | L\*79 | L\*77 |
| inactive | `#788c82` | 4.55:1 | L\*53 | L\*54 |

Ink on a card 13.75:1. White on the accent fill `#2E6B47` 6.34:1. Smallest colour-vision gap **10.5 L\***.
All pass. Reproduce with `surfaces-solve.mjs`.

## The one OLED cost, stated

Large areas of pure black next to bright artwork can show faint smearing while scrolling on some OLED
panels, and static bright elements carry a long-term burn-in risk. Neither is a reason to avoid true
black here: this app is used in short sessions, the bright elements move, and nothing static and bright
sits on screen for hours.
