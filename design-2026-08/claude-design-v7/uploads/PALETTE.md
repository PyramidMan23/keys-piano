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
