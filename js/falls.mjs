// Falling-notes renderer v3 "magic pass" (council 2026-08-23, locked list):
// dark restraint + one razor-bright contact moment. Contact bead + lens flare
// at impact, tapered breathing light fountains on held keys, pre-rendered
// additive glow sprites, ONE shared bloom envelope per chord, 8-14 mixed
// sparks (needles/embers/max one starburst), localized combo escalation,
// latched reduced mode when the effects budget (4ms, 8-of-12 frames) blows.
// Hand identity law: amber+filled vs cyan+outlined, colour AND shape.

// THE DECK'S NUMBERS, read off artboard 8a "Deck states".
//
// Mark, 2026-08-29, looking at the artboard's still picture of this deck: it
// looks boring, and he wants it "magical and alive... soul and lights, like the
// YouTube videos of people playing piano." A still artboard cannot carry motion,
// so 8a was commissioned as VALUES instead of a picture, and these are them.
// The panel number is on every line so any of them can be checked against the
// board, and tools/deck-spec.mjs re-extracts it; test/check.mjs fails if the
// design moves a number this file still hardcodes.
const DECK = {
  // panel 01, resting. The deck should look switched on, not busy.
  rest: { alphaLo: 0.30, alphaHi: 0.40, periodS: 3.2 },
  // panel 08, applies everywhere: radius 14px + 26px * n^2, alpha 0.18 + 0.82 * n^3
  glow: { r0: 14, rGain: 26, a0: 0.18, aGain: 0.82 },
  // panel 07, a long clean run. Capped, and printed as a number elsewhere, so
  // escalation is never brightness alone.
  tier: { at: [8, 16, 32, 64], lineWidth: [2, 3, 4, 4], bloomScale: [1.00, 1.15, 1.30, 1.30], sparks: [8, 11, 14, 14] },
  // panel 08, budgets. Without these a fast passage sums to white.
  budget: { sparksAlive: 60, sparksPer100ms: 24, blooms: 6 },
  // panel 04, the strike instant: one ring, 18 to 64px over 180ms, 3px to 1px,
  // alpha 0.90 to 0. One frame of white is the whole trick; this is the decay.
  ring: { r0: 18, r1: 64, ttlS: 0.18, w0: 3, w1: 1, a0: 0.90 },
  // panel 05, a chord: one shared ring, per-note cores at 0.70, never summed
  chord: { windowMs: 50, coreAlpha: 0.70 },
  // panel 06, a sustained note: 2.2Hz pulse between alpha 0.55 and 0.75, and a
  // tail texture of one 1px scanline every 6px that scrolls. The board gives no
  // scroll speed, so it is DERIVED from the board's own pulse: one line spacing
  // per pulse period (6px x 2.2Hz), never a number somebody liked.
  sustain: { hz: 2.2, aLo: 0.55, aHi: 0.75, scanStep: 6, scanPx: 1 },
  // panel 07, a long clean run: a faint ambient wash from tier 3, never brighter
  wash: { fromTier: 2, alpha: 0.12 },
  // panel 09, a long note approaching: the press and the ring. "The tail is
  // the ring, not a hold. Only the press is judged." (Mark, 2026-08-30: the
  // Fur Elise bass pills read as hold-this-for-six-beats.)
  longNote: { headBeats: 1.0, tailAlpha: 0.30, thresholdBeats: 1.25, scanStep: 6, scanPx: 1, edgePx: 1, edgeAlpha: 0.55 },
};

const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const LETTERS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const LOW = 21, HIGH = 108;

// Cinema palette (Mark's pick, 2026-08-25): TRUE BLACK ground, dark glass
// keys, light belongs to the notes, the deck exists to catch it.
export const COLORS = {
  bg: '#000000',   // was #000002; true black, matching the app ground (2026-08-29)
  laneLine: '#10141b',
  bar: '#151a23',
  hit: '#e8e4da',
  right: '#f0a832',
  rightGlow: 'rgba(240, 168, 50, 0.55)',
  rightBright: '#ffd888',
  left: '#5ee0f2',
  leftGlow: 'rgba(94, 224, 242, 0.55)',
  leftBright: '#c2f4ff',
  wrong: '#e05252',
  // WHITE KEYS ARE WHITE (Mark, 2026-08-30: "can we get the white keys to be
  // white but still look cinematic and amazing like Apple would do it").
  // They were #171b22, which is not a white key: it is a black one with a
  // lighter name. Cinematic does not mean dark. A real piano under stage light
  // has ivory keys with the far end in the fallboard's shadow and the near
  // front edge catching the light, which is exactly this gradient, top to
  // bottom. Never pure #ffffff: it glares and reads as plastic, where warm
  // ivory reads as an instrument.
  whiteKey: '#ded9ce',       // the far end, in shadow
  whiteKeyLow: '#faf8f3',    // the front edge, lit
  blackKey: '#0d1016',       // lifted just off the ground so it reads as a key
  blackKeyLow: '#05070b',
  passive: '#2c323d',
  label: '#4a4f57',          // ink ON a white key
  labelOnBlack: '#b9bec7',   // and on a black key, where dark ink would vanish
};

// Keyboard geometry as pure data so the tap hit-test is node-testable.
// lo/hi restrict the range (lessons zoom to the octaves in play; the full
// 88 keys made "find E4" a hunt through eight Es).
export function layoutKeys(w, lo = LOW, hi = HIGH) {
  let whites = 0;
  for (let m = lo; m <= hi; m++) if (WHITE_PCS.includes(m % 12)) whites++;
  const whiteW = w / whites;
  const map = new Map();
  let wi = 0;
  for (let m = lo; m <= hi; m++) {
    if (WHITE_PCS.includes(m % 12)) {
      map.set(m, { x: wi * whiteW, w: whiteW, white: true });
      wi++;
    } else {
      map.set(m, { x: wi * whiteW - whiteW * 0.3, w: whiteW * 0.6, white: false });
    }
  }
  return map;
}

// Note styles (Mark 2026-08-25): 'duo' = amber/cyan; 'moon' = the Rousseau
// white, hot ivory cores, colour only as faint temperature. Hand identity
// NEVER depends on hue: right = FILLED pill, left = OUTLINED pill, in every
// style (colour-blind law). Pure, node-tested.
export function handPalette(style, hand) {
  if (style === 'moon') {
    return hand === 'L'
      ? { main: '#dfe6f0', bright: '#ffffff', glow: 'rgba(226,236,250,0.55)', deep: '#b8c2d2',
          fillDim: 'rgba(226,236,250,0.13)', triplet: '226, 236, 250' }
      : { main: '#f2ead6', bright: '#fffdf4', glow: 'rgba(255,244,214,0.6)', deep: '#d6cbaa',
          fillDim: 'rgba(255,244,214,0.13)', triplet: '255, 244, 214' };
  }
  return hand === 'L'
    ? { main: COLORS.left, bright: COLORS.leftBright, glow: COLORS.leftGlow, deep: '#3fb3d6',
        fillDim: 'rgba(94, 224, 242, 0.16)', triplet: '94, 224, 242' }
    : { main: COLORS.right, bright: COLORS.rightBright, glow: COLORS.rightGlow, deep: '#d99422',
        fillDim: 'rgba(240, 168, 50, 0.16)', triplet: '240, 168, 50' };
}

// Per-strike verdict (Mark's Guitar-Hero ask, shipped to the real app 08-25):
// the WORD + the chevron DIRECTION + the POSITION carry it, left of the key
// = early, right = late, centre = perfect. Chevron doubles past 120ms so the
// size of the miss reads too. Pure, node-tested.
export function verdictOf(type, deltaMs) {
  if (type === 'perfect') return { word: 'PERFECT', glyph: '◎', dx: 0, heavy: false };
  const early = (deltaMs ?? 0) < 0;
  const heavy = Math.abs(deltaMs ?? 0) > 120;
  return early
    ? { word: 'EARLY', glyph: heavy ? '◀◀' : '◀', dx: -1, heavy }
    : { word: 'LATE', glyph: heavy ? '▶▶' : '▶', dx: 1, heavy };
}

// Signed timing offset -> strip position in -1..1, capped at ±150ms (the good
// window). Pure, node-tested.
export function tickOffset(deltaMs) {
  return Math.max(-1, Math.min(1, deltaMs / 150));
}

// Point to key: black keys sit on top so they win inside their shorter reach.
export function keyAtPoint(keyX, x, y, kbTop, kbH) {
  if (y < kbTop || y > kbTop + kbH) return null;
  if (y <= kbTop + kbH * 0.62) {
    for (const [m, k] of keyX) {
      if (!k.white && x >= k.x && x <= k.x + k.w) return m;
    }
  }
  for (const [m, k] of keyX) {
    if (k.white && x >= k.x && x < k.x + k.w) return m;
  }
  return null;
}

// pre-rendered radial glow sprite (stamped, never re-gradiented per frame)
function makeGlowSprite(r, g, b) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const grad = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.9)`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},0.35)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = grad;
  x.fillRect(0, 0, 64, 64);
  return c;
}

export class FallsView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lookaheadBeats = 4;
    this.pressed = new Map(); // midi -> 'R' | 'L'
    this.pressedAt = new Map(); // midi -> performance.now() at press (duration = length)
    this.handMap = null;      // midi -> hand, set from the current song
    this.flashes = [];
    this.particles = [];      // {x,y,vx,vy,life,ttl,size,kind:'needle'|'ember'|'burst',hand}
    this.flares = [];         // contact beads/lens flares {x,y,life,ttl,scale,hand}
    this.bloom = null;        // ONE shared chord bloom envelope {x,life,ttl,scale}
    this.hint = null;
    this.targets = new Set();
    this.comboLevel = 0;      // 0 | 1 (10+) | 2 (25+), set by the app
    this.cueLetters = true;   // memory ladder: note letters can be removed
    this.cueFilter = null;    // null | 'landmarks' (bar-first notes) | 'none' (blank)
    this.improv = null;       // {chordPcs:Set, scalePcs:Set} keyboard highlights
    this.kbLetters = true;    // lesson READ phase hides the printed key names
    this.lo = LOW; this.hi = HIGH; // visible key range (lessons zoom in)
    this.markMiddleC = false; // lessons anchor the landmark C4 with a dot
    this.ticks = [];          // timing ticks {off -1..1, heavy, hand, life, ttl}
    this.verdicts = [];       // per-strike EARLY/PERFECT/LATE plaques at the key
    this.banner = null;       // armed-start prompt (timed mode waits for a key)
    this.ripples = [];        // liquid-glass contact rings {x, y, t0, ttl, w, hand, perfect}
    this.rings = [];          // strike rings, 8a panel 04 {x, y, life, hand}
    this.noteStyle = (typeof window !== 'undefined' && window.__keysNoteStyle) || 'duo';
    this._vig = null;         // pre-rendered vignette, free per frame
    this.reduced = false;     // latched for the session when the budget blows
    this._budgetStrikes = []; // rolling window of effect frame costs
    this._lastDraw = 0;
    this.spriteAmber = makeGlowSprite(240, 168, 50);
    this.spriteCyan = makeGlowSprite(94, 224, 242);
    this.spriteWhite = makeGlowSprite(255, 244, 220);
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = this.canvas.getBoundingClientRect();
    this.canvas.width = r.width * dpr;
    this.canvas.height = r.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = r.width;
    this.h = r.height;
    this.kbH = Math.max(78, Math.min(130, this.h * 0.24));
    this._layoutKeys();
    this._makeVignette();
  }

  _layoutKeys() {
    this.keyX = layoutKeys(this.w, this.lo, this.hi);
  }

  // Zoom the keyboard to an octave-snapped range (lessons). Full range = play.
  setRange(lo, hi) {
    this.lo = lo; this.hi = hi;
    if (this.w) this._layoutKeys();
  }

  // Which key is under a canvas-local point? Used by the lessons' tappable
  // keyboard. kbTop = where the keyboard starts vertically on this canvas.
  pickKeyAt(x, y, kbTop, kbH) {
    return keyAtPoint(this.keyX, x, y, kbTop, kbH);
  }

  _hand(m) { return this.pressed.get(m) ?? this.handMap?.get(m) ?? 'R'; }
  // pressedAt lets a held note's length MEAN its duration (8a panel 06's note:
  // "Duration has to be a length you can read, not a brightness you have to
  // judge"). Codex caught that the fountain height carried combo, not time.
  keyDown(m, hand) { this.pressed.set(m, hand ?? this.handMap?.get(m) ?? 'R'); this.pressedAt.set(m, performance.now()); }
  keyUp(m) { this.pressed.delete(m); this.pressedAt.delete(m); }
  flash(m, type) { this.flashes.push({ midi: m, type, until: performance.now() + 350 }); }

  // Timing tick (council 08-24): one spatial vocabulary for ahead/behind.
  // Position IS the signal (left = ahead, right = behind), colour-blind-safe
  // by construction; ticks past 120ms grow, they never change vocabulary.
  // Guitar-Hero plaque at the key. Timed mode only, wait mode has no clock.
  strikeVerdict(midi, type, deltaMs) {
    const k = this.keyX.get(midi);
    if (!k) return;
    const v = verdictOf(type, deltaMs);
    this.verdicts.push({ x: k.x + k.w / 2 + v.dx * k.w * 1.1, ...v, life: 0, ttl: 0.85 });
    if (this.verdicts.length > 8) this.verdicts.splice(0, this.verdicts.length - 8);
  }

  timingTick(deltaMs, hand) {
    this.ticks.push({ off: tickOffset(deltaMs), heavy: Math.abs(deltaMs) > 120, hand, life: 0, ttl: 1.1 });
    if (this.ticks.length > 24) this.ticks.splice(0, this.ticks.length - 24);
  }
  biasNote(text) {
    this.floaters.push({ x: this.w / 2, y: Math.max(60, this.h - this.kbH - 78), text, color: '#e6e2d8', life: 0, ttl: 1.8 });
  }

  // Impact celebration: contact bead + flare, sparks, shared chord bloom.
  burst(midi, type, text) {
    const k = this.keyX.get(midi);
    if (!k) return;
    const x = k.x + k.w / 2;
    const y = this.h - this.kbH;
    const hand = this._hand(midi);
    const perfect = type === 'perfect';
    const escal = 1 + this.comboLevel * 0.35;

    // A chord is ONE event with several roots (8a panel 05): notes landing
    // inside the 50ms window share a single ring, and their cores dim to 0.70
    // instead of stacking three full-strength strikes into a white blob.
    const nowMs = performance.now();
    const inChord = this._lastBurstAt && nowMs - this._lastBurstAt < DECK.chord.windowMs;
    this._lastBurstAt = nowMs;

    // contact bead + lens flare (the genre's highest-value cue)
    if (this.flares.length < 12) {
      this.flares.push({ x, y, life: 0, ttl: 0.22, scale: (perfect ? 1 : 0.65) * escal * (inChord ? DECK.chord.coreAlpha : 1), hand });
    }
    // the strike ring (8a panel 04): 18 to 64px over 180ms, one per strike,
    // shared across a chord window
    if (!inChord && this.rings.length < 6) {
      this.rings.push({ x, y, life: 0, hand });
    }
    // liquid-glass contact (cinema, 08-25): flattened rings spreading on the
    // deck, short-lived by law, or they become the rejected trails
    if (this.ripples.length < 10) {
      const rings = perfect ? 3 : 2;
      for (let i = 0; i < rings; i++) {
        this.ripples.push({ x, y, life: -i * 0.055, ttl: 0.3, w: k.w, hand, perfect });
      }
    }
    // ember plume: slow rising motes that make the black feel deep
    for (let i = 0; i < (this.reduced ? 3 : perfect ? 8 : 5); i++) {
      this.particles.push({ x: x + (Math.random() - 0.5) * k.w * 0.7, y, vx: (Math.random() - 0.5) * 14,
        vy: -(24 + Math.random() * 42), life: 0, ttl: 1 + Math.random() * 0.9,
        size: 1 + Math.random() * 1.8, kind: 'ember', hand, tw: Math.random() * 6.28 });
    }
    // ONE shared bloom per chord window, boosted not stacked
    if (!this.reduced) {
      const now = performance.now();
      if (this.bloom && now - this.bloom.at < 50) this.bloom.scale = Math.min(2.2, this.bloom.scale + 0.3);
      else this.bloom = { x, at: now, life: 0, ttl: 0.3, scale: (perfect ? 1.2 : 0.8) * escal };
    }
    // mixed sparks: needles + embers + at most one starburst
    // 8a panel 08: 60 alive. The old cap of 350 is what turns a fast passage
    // into white mush, which is exactly the failure the board calls out.
    const cap = this.reduced ? 30 : DECK.budget.sparksAlive;
    if (this.particles.length > cap) this.particles.splice(0, this.particles.length - cap);
    const nNeedle = (this.reduced ? 3 : 6) + this.comboLevel * 2;
    const nEmber = (this.reduced ? 3 : 6) + this.comboLevel;
    for (let i = 0; i < nNeedle; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const sp = 220 + Math.random() * 260 * escal;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, ttl: 0.22 + Math.random() * 0.15, size: 1, kind: 'needle', hand });
    }
    for (let i = 0; i < nEmber; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const sp = 30 + Math.random() * 90;
      this.particles.push({ x, y, vx: Math.cos(a) * sp + (Math.random() - 0.5) * 20, vy: Math.sin(a) * sp, life: 0, ttl: 0.7 + Math.random() * 0.8, size: 1.6 + Math.random() * 2, kind: 'ember', hand, tw: Math.random() * 6.28 });
    }
    if (perfect && !this.reduced) {
      this.particles.push({ x, y, vx: 0, vy: 0, life: 0, ttl: 0.28, size: 1, kind: 'burst', hand });
    }
    if (text) this.floaters.push({ x, y: y - 26, text, color: perfect ? COLORS.rightBright : '#cfd6de', life: 0, ttl: 0.9 });
  }

  floaters = [];

  draw(engine) {
    // A mid-layout frame can catch the canvas at zero width, and a zero-width
    // key layout hands roundRect a negative radius, which THROWS and kills the
    // whole animation loop. One guard, because one transient frame must never
    // cost the run. (Found by the immersion toggle, 2026-08-29.)
    if (this.w < 50 || this.h < 50) return;
    this._lastEngine = engine;
    const now = performance.now();
    const dt = Math.min(0.05, this._lastDraw ? (now - this._lastDraw) / 1000 : 0.016);
    this._lastDraw = now;

    const { ctx, w, h, kbH } = this;
    const fallH = h - kbH;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = COLORS.laneLine;
    ctx.lineWidth = 1;
    for (let m = this.lo; m <= this.hi; m++) {
      if (m % 12 === 0) {
        const k = this.keyX.get(m);
        ctx.beginPath(); ctx.moveTo(k.x, 0); ctx.lineTo(k.x, fallH); ctx.stroke();
      }
    }

    const pxPerBeat = fallH / this.lookaheadBeats;
    const beat = engine.beat;
    for (let b = Math.ceil(beat); b < beat + this.lookaheadBeats + 1; b++) {
      if ((b % engine.song.timeSig[0]) !== 0) continue;
      const y = fallH - (b - beat) * pxPerBeat;
      const isChunkEdge = this.chunkBeats && b % this.chunkBeats === 0;
      ctx.fillStyle = isChunkEdge ? COLORS.hit : COLORS.bar;
      ctx.globalAlpha = isChunkEdge ? 0.6 : 1;
      ctx.fillRect(0, y, w, isChunkEdge ? 2 : 1);
      ctx.globalAlpha = 1;
      if (isChunkEdge && this.chunkBeats) {
        ctx.textAlign = 'left';
        ctx.font = '600 11px system-ui';
        ctx.fillStyle = COLORS.hit;
        ctx.fillText(`${Math.round(b / this.chunkBeats) + 1}`, 8, y - 5);
      }
    }

    // Notes: glowing pills (unchanged look, the restraint half of the design)
    const drawNote = (n, passive) => {
      const top = n.b + n.d, bottom = n.b;
      if (top < beat || bottom > beat + this.lookaheadBeats) return;
      const k = this.keyX.get(n.m);
      if (!k) return;
      const y1 = fallH - (top - beat) * pxPerBeat;
      const y2 = fallH - (bottom - beat) * pxPerBeat;
      const pad = k.white ? 2.5 : 1;
      const x = k.x + pad, bw = k.w - pad * 2, bh = Math.max(10, y2 - y1 - 3);
      const r = Math.min(7, bw / 2);
      // NEARNESS, continuous. This used to be a boolean, "within 26px of the
      // line", so a note was either flat or fully lit and nothing happened in
      // between. Artboard 8a panels 02, 03 and 08 give the real curves: the
      // radius grows with n squared and the alpha with n cubed, which is why
      // the last 120ms carries the anticipation instead of the whole fall.
      const near = Math.max(0, Math.min(1, y2 / fallH));
      const glowR = DECK.glow.r0 + DECK.glow.rGain * near * near;
      const glowA = DECK.glow.a0 + DECK.glow.aGain * near * near * near;
      const nearLine = near > 0.94;

      if (passive) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = COLORS.passive;
        roundRect(ctx, x, y1, bw, bh, r); ctx.fill();
        ctx.globalAlpha = 1;
        return;
      }
      const P = handPalette(this.noteStyle, n.h === 'L' ? 'L' : 'R');
      // layered halo: the wide soft bloom shadowBlur cannot give (a stamped
      // pre-rendered sprite, one drawImage), this is the videos' glow
      if (!passive && glowA > 0.02) {
        const hsprite = this.noteStyle === 'moon' ? this.spriteWhite : (n.h === 'L' ? this.spriteCyan : this.spriteAmber);
        const hs = glowR * 2;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = glowA;
        ctx.drawImage(hsprite, x + bw / 2 - hs / 2, y1 + bh - hs / 2, hs, hs);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      // panel 09: a long note splits into the PRESS HEAD (the bottom beat,
      // drawn exactly as pills always drew) and the RING TAIL above it, dim
      // and scanlined so it reads as sound continuing, never a hold. The
      // glow sprite above already stamps at the pill bottom: head only.
      const LN = DECK.longNote;
      const isLong = n.d > LN.thresholdBeats;
      const headH = isLong ? Math.min(bh, Math.max(12, LN.headBeats * pxPerBeat)) : bh;
      const headY = y1 + bh - headH;
      const paintPill = (py, ph) => {
        if (n.h === 'R') {
          const grad = ctx.createLinearGradient(0, y1, 0, y1 + bh);
          grad.addColorStop(0, P.main);
          grad.addColorStop(1, nearLine ? P.bright : P.deep);
          ctx.fillStyle = grad;
          roundRect(ctx, x, py, bw, ph, r); ctx.fill();
        } else {
          ctx.fillStyle = P.fillDim;
          roundRect(ctx, x, py, bw, ph, r); ctx.fill();
          ctx.strokeStyle = nearLine ? P.bright : P.main;
          ctx.lineWidth = 2;
          roundRect(ctx, x + 1, py + 1, bw - 2, ph - 2, r); ctx.stroke();
        }
      };
      ctx.save();
      if (isLong) {
        // the ring tail: no shadow glow (the board: "tail adds none")
        ctx.globalAlpha = LN.tailAlpha;
        paintPill(y1, bh - headH + r);
        ctx.globalAlpha = 1;
        // scanline texture, background-coloured cuts every 6px
        ctx.fillStyle = COLORS.bg;
        for (let sy = headY - LN.scanStep; sy > y1; sy -= LN.scanStep) {
          ctx.fillRect(x, sy, bw, LN.scanPx);
        }
      }
      ctx.shadowColor = P.glow;
      ctx.shadowBlur = nearLine ? 36 : 16;
      paintPill(headY, headH);
      if (isLong) {
        // the 1px edge at the split
        ctx.shadowBlur = 0;
        ctx.globalAlpha = LN.edgeAlpha;
        ctx.fillStyle = P.main;
        ctx.fillRect(x, headY, bw, LN.edgePx);
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // EVERY note carries its name, and its finger when authored, quick
      // short notes used to drop both (Mark, live 2026-08-28): pills too
      // short for an inside label wear it just above the pill instead.
      if (this.cueLetters) {
        ctx.textAlign = 'center';
        const letter = LETTERS[n.m % 12];
        if (headH > 24) {
          // the label lives in the PRESS HEAD: on a six-beat pill a centred
          // letter floated mid-tail, exactly where nothing is played
          ctx.fillStyle = n.h === 'R' ? '#141414' : handPalette(this.noteStyle, 'L').bright;
          ctx.font = `bold ${Math.min(13, bw * 0.5)}px system-ui`;
          ctx.fillText(letter, x + bw / 2, headY + headH / 2 + 4);
          if (n.f) {
            if (headH > 44) {
              ctx.font = '10px system-ui';
              ctx.fillStyle = n.h === 'R' ? 'rgba(20,20,20,0.7)' : 'rgba(194,244,255,0.7)';
              ctx.fillText(String(n.f), x + bw / 2, y1 + bh - 7);
            } else {
              ctx.font = '9px system-ui';
              ctx.fillStyle = handPalette(this.noteStyle, n.h).bright;
              ctx.fillText(String(n.f), x + bw / 2, y1 - 3);
            }
          }
        } else {
          // short pill: name (·finger) floats just above it, hand-coloured
          ctx.font = `bold ${Math.min(10, Math.max(8, bw * 0.4))}px system-ui`;
          ctx.fillStyle = handPalette(this.noteStyle, n.h).bright;
          ctx.fillText(letter + (n.f ? '·' + n.f : ''), x + bw / 2, y1 - 3);
        }
      }
    };
    // memory-ladder cue filter: landmarks = only each bar's first-beat notes
    const tsb = engine.song.timeSig[0];
    const cueShow = (n) => !this.cueFilter || (this.cueFilter === 'landmarks' && n.b % tsb === 0);
    for (const g of engine.groups) for (const n of g.notes) if (cueShow(n)) drawNote(n, false);
    for (const n of engine.passive) if (cueShow(n)) drawNote(n, true);

    // The ambient wash, 8a panel 07: from tier 3 the whole deck warms very
    // slightly, so a long clean run FEELS different before you read the number.
    // Capped at one value; escalation is never brightness alone.
    if (this.comboLevel >= DECK.wash.fromTier && !this.reduced) {
      ctx.save();
      const wash = ctx.createLinearGradient(0, fallH, 0, 0);
      wash.addColorStop(0, `rgba(240, 190, 90, ${DECK.wash.alpha})`);
      wash.addColorStop(1, 'rgba(240, 190, 90, 0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, w, fallH);
      ctx.restore();
    }

    // The hit line BREATHES. Artboard 8a, panel 01, and it is the whole answer
    // to why the resting deck looked dead: with nothing falling, nothing moved
    // at all. 2px at alpha 0.30 to 0.40 over 3.2s, so the deck reads as
    // switched on before a note is played. Widens with the run tier (panel 07).
    ctx.save();
    const breath = DECK.rest.alphaLo
      + (DECK.rest.alphaHi - DECK.rest.alphaLo) * (0.5 + 0.5 * Math.sin((now / 1000) * (Math.PI * 2 / DECK.rest.periodS)));
    const lineW = DECK.tier.lineWidth[Math.min(this.comboLevel, DECK.tier.lineWidth.length - 1)];
    ctx.shadowColor = 'rgba(232, 228, 218, 0.35)';
    ctx.shadowBlur = 5;
    ctx.fillStyle = `rgba(232, 228, 218, ${breath.toFixed(3)})`;
    ctx.fillRect(0, fallH - lineW, w, lineW);
    ctx.restore();

    if (this.banner) {
      ctx.textAlign = 'center';
      ctx.font = '600 17px system-ui';
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
      ctx.fillStyle = COLORS.rightBright;
      ctx.fillText(this.banner, w / 2, fallH * 0.45);
      ctx.restore();
    }
    if (engine.waiting && this.hint) {
      ctx.textAlign = 'center';
      ctx.font = '600 15px system-ui';
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
      ctx.fillStyle = COLORS.rightBright;
      ctx.fillText(`Press  ${this.hint}`, w / 2, fallH - 16);
      ctx.restore();
    }

    this._drawKeyboard(fallH, now);
    this._drawReflections(fallH);

    // ---- effects pass, under the 4ms budget ----
    const fx0 = performance.now();
    this._drawRipples(fallH, dt);
    this._drawRings(dt);
    this._drawFountains(fallH, now, dt);
    this._drawFlares(fallH, dt);
    this._drawBloom(fallH, dt);
    this._drawParticles(dt);
    this._drawFloaters(dt);
    this._drawTicks(fallH, dt);
    this._drawVerdicts(fallH, dt);
    const fxMs = performance.now() - fx0;
    if (!this.reduced) {
      this._budgetStrikes.push(fxMs > 4 ? 1 : 0);
      if (this._budgetStrikes.length > 12) this._budgetStrikes.shift();
      if (this._budgetStrikes.reduce((a, v) => a + v, 0) >= 8) this.reduced = true; // latched
    }

    const prog = Math.min(1, (engine.beat - engine.startBeat) / (engine.endBeat - engine.startBeat));
    ctx.fillStyle = 'rgba(232,228,218,0.12)';
    ctx.fillRect(0, 0, w, 3);
    ctx.fillStyle = COLORS.right;
    ctx.fillRect(0, 0, w * prog, 3);

    if (this._vig) ctx.drawImage(this._vig, 0, 0, w, h);
  }

  // static vignette, rebuilt only on resize, frames the stage for free
  _makeVignette() {
    if (!this.w || !this.h) return;
    const c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(this.w / 2));
    c.height = Math.max(2, Math.round(this.h / 2));
    const x = c.getContext('2d');
    const g = x.createRadialGradient(c.width / 2, c.height * 0.55, Math.min(c.width, c.height) * 0.46,
                                     c.width / 2, c.height * 0.55, Math.max(c.width, c.height) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.42)');
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    this._vig = c;
  }

  // near-line notes reflect down onto the dark glass deck (cinema 08-25):
  // the single strongest production cue in the reference videos
  _drawReflections(top) {
    const { ctx } = this;
    const eng = this._lastEngine;
    if (!eng) return;
    const pxPerBeat = (this.h - this.kbH) / this.lookaheadBeats;
    const beat = eng.beat;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const reflect = (note) => {
      const bottom = note.b;
      const t = 1 - (bottom - beat) / this.lookaheadBeats;
      if (t < 0.55 || t > 1.02) return;
      const k = this.keyX.get(note.m);
      if (!k) return;
      const hand = note.h === 'L' ? 'L' : 'R';
      const col = handPalette(this.noteStyle, hand).triplet;
      const depth = Math.min(this.kbH * 0.8, 56) * t;
      const bw = k.w * 0.5;
      const g = ctx.createLinearGradient(0, top, 0, top + depth);
      g.addColorStop(0, 'rgba(' + col + ',' + (0.3 * t).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(k.x + (k.w - bw) / 2, top, bw, depth);
    };
    for (const g2 of eng.groups) for (const note of g2.notes) reflect(note);
    ctx.restore();
  }

  // liquid-glass contact rings: flattened ellipses, near arc bright, far arc
  // dim, dead inside 300ms so they never become trails
  _drawRipples(top, dt) {
    if (!this.ripples.length) return;
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.ripples = this.ripples.filter((r) => {
      r.life += dt;
      if (r.life < 0) return true;
      if (r.life > r.ttl) return false;
      const k = r.life / r.ttl;
      const rx = r.w * (0.5 + k * 2.2);
      const ry = rx * 0.27;
      const a = (1 - k) * (r.perfect ? 0.8 : 0.55);
      const colB = handPalette(this.noteStyle, r.hand === 'L' ? 'L' : 'R').bright;
      ctx.lineWidth = Math.max(0.8, 2.2 * (1 - k));
      ctx.globalAlpha = a * 0.45;
      ctx.strokeStyle = '#efe9da';
      ctx.beginPath(); ctx.ellipse(r.x, r.y, rx, ry, 0, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.globalAlpha = a;
      ctx.strokeStyle = colB;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, rx, ry, 0, 0, Math.PI); ctx.stroke();
      return true;
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // the strike ring, 8a panel 04: values from the board, not tuned by eye
  _drawRings(dt) {
    if (!this.rings.length) return;
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.rings = this.rings.filter((g) => {
      g.life += dt;
      const k = g.life / DECK.ring.ttlS;
      if (k >= 1) return false;
      const P = handPalette(this.noteStyle, g.hand === 'L' ? 'L' : 'R');
      ctx.globalAlpha = DECK.ring.a0 * (1 - k);
      ctx.lineWidth = DECK.ring.w0 + (DECK.ring.w1 - DECK.ring.w0) * k;
      ctx.strokeStyle = P.bright;
      ctx.beginPath();
      ctx.arc(g.x, g.y, DECK.ring.r0 + (DECK.ring.r1 - DECK.ring.r0) * k, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // The scanline rows of a sustained note's tail, 8a panel 06: one 1px line
  // every 6px, scrolling upward. Pure so the suite can pin spacing, width and
  // the derived scroll speed against the board. h is height ABOVE the hit line;
  // k is the 0..1 fraction of the tail's full height (for taper interpolation).
  static scanlineRows(hMax, nowMs) {
    const step = DECK.sustain.scanStep;
    const speed = step * DECK.sustain.hz;              // one spacing per pulse period
    const phase = ((nowMs / 1000) * speed) % step;
    const rows = [];
    for (let h = phase; h < hMax; h += step) rows.push({ h, k: h / hMax });
    return rows;
  }

  // held-key light fountains: tapered, breathing, hand-shaped
  _drawFountains(top, now, dt) {
    const { ctx } = this;
    if (this.pressed.size === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // 8a panel 06: a held note pulses at 2.2Hz between alpha 0.55 and 0.75, so
    // duration reads as a living light, not a frozen one. The old value was a
    // number somebody liked; this one is the board's.
    const ph = 0.5 + 0.5 * Math.sin(now / 1000 * Math.PI * 2 * DECK.sustain.hz);
    const breath = DECK.sustain.aLo + (DECK.sustain.aHi - DECK.sustain.aLo) * ph;
    const hCeil = (this.reduced ? 60 : 100 + this.comboLevel * 20) * (0.75 + breath * 0.35);
    // ±4px radius pulse on the contact sprite, panel 06's third value
    const sprPulse = 8 * (ph - 0.5);
    for (const [m, hand] of this.pressed) {
      const k = this.keyX.get(m);
      if (!k) continue;
      // duration IS the length: a tap is a stub, a held note grows to full
      // height over ~2.5s and then breathes there
      const heldS = (now - (this.pressedAt.get(m) ?? now)) / 1000;
      const hMax = hCeil * Math.min(1, 0.25 + heldS / 2.5);
      const cx = k.x + k.w / 2;
      const PF = handPalette(this.noteStyle, hand === 'L' ? 'L' : 'R');
      if (hand === 'L') {
        // split double-taper (outlined identity, not hue alone)
        ctx.fillStyle = 'rgba(' + PF.triplet + ', 0.28)';
        for (const off of [-k.w * 0.22, k.w * 0.22]) {
          ctx.beginPath();
          ctx.moveTo(cx + off - 1.5, top);
          ctx.lineTo(cx + off + 1.5, top);
          ctx.lineTo(cx + off, top - hMax * (40 / 100 + 0.6));
          ctx.closePath();
          ctx.fill();
        }
        { const sz = 28 + sprPulse; ctx.drawImage(this.noteStyle === 'moon' ? this.spriteWhite : this.spriteCyan, cx - sz / 2, top - sz / 2, sz, sz); }
        // 8a panel 06, the tail texture: 1px scanlines every 6px, scrolling up
        // the split tapers. Budgeted: reduced mode drops the texture, and only
        // ten fingers exist, so past 12 held keys (a MIDI fault) it stands down.
        ctx.fillStyle = 'rgba(' + PF.triplet + ', 1)';
        const tailH = hMax * (40 / 100 + 0.6);
        for (const row of (this.reduced || this.pressed.size > 12) ? [] : FallsView.scanlineRows(tailH, now)) {
          const half = 1.5 * (1 - row.k);
          if (half < 0.3) continue;
          ctx.globalAlpha = 0.30 * breath * (1 - row.k);
          for (const off of [-k.w * 0.22, k.w * 0.22]) {
            ctx.fillRect(cx + off - half, top - row.h, half * 2, DECK.sustain.scanPx);
          }
        }
        ctx.globalAlpha = 1;
      } else {
        // single filled taper
        const grad = ctx.createLinearGradient(0, top, 0, top - hMax);
        grad.addColorStop(0, 'rgba(' + PF.triplet + ', 0.45)');
        grad.addColorStop(1, 'rgba(' + PF.triplet + ', 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - k.w * 0.32, top);
        ctx.lineTo(cx + k.w * 0.32, top);
        ctx.lineTo(cx, top - hMax);
        ctx.closePath();
        ctx.fill();
        { const sz = 28 + sprPulse; ctx.drawImage(this.noteStyle === 'moon' ? this.spriteWhite : this.spriteAmber, cx - sz / 2, top - sz / 2, sz, sz); }
        // 8a panel 06, the tail texture: 1px scanlines every 6px, scrolling up
        // the taper. Width follows the taper; same budget rule as the left hand.
        ctx.fillStyle = 'rgba(' + PF.triplet + ', 1)';
        for (const row of (this.reduced || this.pressed.size > 12) ? [] : FallsView.scanlineRows(hMax, now)) {
          const half = k.w * 0.32 * (1 - row.k);
          if (half < 0.5) continue;
          ctx.globalAlpha = 0.30 * breath * (1 - row.k);
          ctx.fillRect(cx - half, top - row.h, half * 2, DECK.sustain.scanPx);
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  // contact bead + short horizontal lens flare
  _drawFlares(top, dt) {
    const { ctx } = this;
    if (!this.flares.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.flares = this.flares.filter((f) => {
      f.life += dt;
      if (f.life > f.ttl) return false;
      const t = f.life / f.ttl;
      const a = 1 - t;
      const sprite = this.noteStyle === 'moon' ? this.spriteWhite : (f.hand === 'L' ? this.spriteCyan : this.spriteAmber);
      // bead
      ctx.globalAlpha = a;
      const bs = 22 * f.scale * (1 + t);
      ctx.drawImage(this.spriteWhite, f.x - bs / 2, top - bs / 2, bs, bs);
      // horizontal lens flare: wide thin colored streak
      const fw = 90 * f.scale * (1 + t * 1.6);
      ctx.globalAlpha = a * 0.8;
      ctx.drawImage(sprite, f.x - fw / 2, top - 5, fw, 10);
      return true;
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // one shared chord bloom envelope
  _drawBloom(top, dt) {
    if (!this.bloom) return;
    const { ctx } = this;
    this.bloom.life += dt;
    if (this.bloom.life > this.bloom.ttl) { this.bloom = null; return; }
    const t = this.bloom.life / this.bloom.ttl;
    const a = (1 - t) * 0.5;
    const size = 160 * this.bloom.scale * (1 + t);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a;
    ctx.drawImage(this.spriteWhite, this.bloom.x - size / 2, top - size / 4, size, size / 2);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  _drawParticles(dt) {
    const { ctx } = this;
    if (!this.particles.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.particles = this.particles.filter((p) => {
      p.life += dt;
      if (p.life > p.ttl) return false;
      const t = p.life / p.ttl;
      const a = 1 - t;
      const sprite = this.noteStyle === 'moon' ? this.spriteWhite : (p.hand === 'L' ? this.spriteCyan : this.spriteAmber);
      if (p.kind === 'needle') {
        // fast razor line along its velocity
        ctx.globalAlpha = a;
        ctx.strokeStyle = handPalette(this.noteStyle, p.hand === 'L' ? 'L' : 'R').bright;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        ctx.stroke();
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 500 * dt;
      } else if (p.kind === 'ember') {
        // slow drifting twinkle
        p.tw += dt * 9;
        ctx.globalAlpha = a * (0.55 + 0.45 * Math.sin(p.tw));
        const s = p.size * 6 * (0.6 + a * 0.4);
        ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 60 * dt;
      } else { // starburst: one brief expanding star
        ctx.globalAlpha = a;
        const s = 30 + t * 90;
        ctx.drawImage(this.spriteWhite, p.x - s / 2, p.y - s / 2, s, s);
        ctx.strokeStyle = 'rgba(255,244,220,' + (a * 0.9) + ')';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 4; i++) {
          const ang = (Math.PI / 4) + i * (Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(ang) * 4, p.y + Math.sin(ang) * 4);
          ctx.lineTo(p.x + Math.cos(ang) * (6 + t * 46), p.y + Math.sin(ang) * (6 + t * 46));
          ctx.stroke();
        }
      }
      return true;
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // The timing strip: a short ruler above the hit line. Centre notch = on
  // time; each accepted press drops a tick left (ahead) or right (behind).
  // Drawn only while ticks are alive, no permanent chrome.
  _drawTicks(fallH, dt) {
    this.ticks = this.ticks.filter((t) => { t.life += dt; return t.life <= t.ttl; });
    if (!this.ticks.length) return;
    const { ctx } = this;
    const cx = this.w / 2;
    const y = fallH - 46;
    const half = Math.min(110, this.w * 0.2);
    ctx.save();
    // ruler + centre notch
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = COLORS.laneLine;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx + half, y); ctx.stroke();
    ctx.strokeStyle = COLORS.hit;
    ctx.beginPath(); ctx.moveTo(cx, y - 7); ctx.lineTo(cx, y + 7); ctx.stroke();
    // end labels, tiny and static (words + position, never colour alone)
    ctx.globalAlpha = 0.55;
    ctx.font = '10px system-ui';
    ctx.fillStyle = '#9aa1ab';
    ctx.textAlign = 'left'; ctx.fillText('early', cx - half - 2, y - 10);
    ctx.textAlign = 'right'; ctx.fillText('late', cx + half + 2, y - 10);
    for (const t of this.ticks) {
      const a = 1 - t.life / t.ttl;
      const x = cx + t.off * half;
      const h = t.heavy ? 15 : 9;
      ctx.globalAlpha = a * (t.heavy ? 0.95 : 0.7);
      ctx.strokeStyle = handPalette(this.noteStyle, t.hand === 'L' ? 'L' : 'R').bright;
      ctx.lineWidth = t.heavy ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x, y + h / 2); ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // the verdict plaques: word + chevron + position, never hue (colour-blind law)
  _drawVerdicts(fallH, dt) {
    if (!this.verdicts.length) return;
    const { ctx } = this;
    this.verdicts = this.verdicts.filter((v) => {
      v.life += dt;
      if (v.life > v.ttl) return false;
      const k = v.life / v.ttl;
      const a = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
      const rise = 22 + k * 30;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.font = (v.heavy ? '700 27px' : '600 23px') + ' ui-monospace, monospace';
      ctx.fillStyle = 'rgba(240,235,224,0.98)';
      ctx.fillText(v.glyph, v.x, fallH - rise);
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(240,235,224,0.85)';
      ctx.fillText(v.word, v.x, fallH - rise + 13);
      ctx.restore();
      ctx.globalAlpha = 1;
      return true;
    });
  }

  _drawFloaters(dt) {
    const { ctx } = this;
    this.floaters = this.floaters.filter((f) => {
      f.life += dt;
      if (f.life > f.ttl) return false;
      const t = f.life / f.ttl;
      ctx.globalAlpha = 1 - t;
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px system-ui';
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y - t * 34);
      return true;
    });
    ctx.globalAlpha = 1;
  }

  _drawKeyboard(top, now = performance.now()) {
    const { ctx, kbH } = this;
    this.flashes = this.flashes.filter((f) => f.until > now);
    const flashOf = (m) => this.flashes.find((f) => f.midi === m);
    const pulse = 0.45 + 0.3 * Math.sin(now / 160);

    for (let m = this.lo; m <= this.hi; m++) {
      const k = this.keyX.get(m);
      if (!k.white) continue;
      const down = this.pressed.has(m);
      const hand = down ? this.pressed.get(m) : null;
      const fl = flashOf(m);
      if (fl?.type === 'wrong') {
        ctx.fillStyle = COLORS.wrong;
        ctx.fillRect(k.x + 0.5, top, k.w - 1, kbH);
      } else if (!down && this.targets.has(m)) {
        const g = ctx.createLinearGradient(0, top, 0, top + kbH);
        g.addColorStop(0, `rgba(240, 168, 50, ${pulse})`);
        g.addColorStop(1, COLORS.whiteKey);
        ctx.fillStyle = g;
        ctx.fillRect(k.x + 0.5, top, k.w - 1, kbH);
      } else if (down) {
        const PK = handPalette(this.noteStyle, hand === 'L' ? 'L' : 'R');
        const g = ctx.createLinearGradient(0, top, 0, top + kbH);
        g.addColorStop(0, PK.bright); g.addColorStop(1, PK.main);
        ctx.fillStyle = g;
        ctx.fillRect(k.x + 0.5, top, k.w - 1, kbH);
      } else {
        const g = ctx.createLinearGradient(0, top, 0, top + kbH);
        g.addColorStop(0, COLORS.whiteKey); g.addColorStop(1, COLORS.whiteKeyLow);
        ctx.fillStyle = g;
        ctx.fillRect(k.x + 0.5, top, k.w - 1, kbH);
      }
      // improv highlights: chord tones bright + FILLED dot, scale tones soft
      // + OUTLINED dot. Brightness and dot shape carry the signal, never hue.
      if (this.improv && !down) {
        const pc = m % 12;
        const cx = k.x + k.w / 2, cy = top + kbH - 30;
        if (this.improv.chordPcs.has(pc)) {
          ctx.fillStyle = 'rgba(240, 168, 50, 0.45)';
          ctx.fillRect(k.x + 0.5, top, k.w - 1, kbH);
          ctx.fillStyle = '#8a5a00';
          ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, 6.29); ctx.fill();
        } else if (this.improv.scalePcs.has(pc)) {
          ctx.strokeStyle = '#8a8478';
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 6.29); ctx.stroke();
        }
      }
      if (this.kbLetters) {
        const letter = LETTERS[m % 12];
        ctx.textAlign = 'center';
        ctx.fillStyle = down ? '#141414' : COLORS.label;
        ctx.font = `bold ${Math.min(13, k.w * 0.55)}px system-ui`;
        const name = m % 12 === 0 ? letter + (Math.floor(m / 12) - 1) : letter;
        ctx.fillText(name, k.x + k.w / 2, top + kbH - 8);
      }
    }
    // landmark anchor (lessons): middle C wears a dot + name so the learner
    // always has a fixed point to count from, even when key names are off
    if (this.markMiddleC && this.keyX.has(60)) {
      const k = this.keyX.get(60);
      const cx = k.x + k.w / 2, cy = top + kbH * 0.52;
      ctx.fillStyle = '#8a5a00';
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 6.29); ctx.fill();
      ctx.strokeStyle = COLORS.right;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 6.29); ctx.stroke();
      if (k.w > 40) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#c2ad7a';
        ctx.font = 'bold 10px system-ui';
        ctx.fillText('middle C', cx, cy + 22);
      }
    }
    for (let m = this.lo; m <= this.hi; m++) {
      const k = this.keyX.get(m);
      if (k.white) continue;
      const down = this.pressed.has(m);
      const hand = down ? this.pressed.get(m) : null;
      const fl = flashOf(m);
      const bh = kbH * 0.62;
      const impChord = this.improv && !down && this.improv.chordPcs.has(m % 12);
      const impScale = this.improv && !down && !impChord && this.improv.scalePcs.has(m % 12);
      ctx.fillStyle = fl?.type === 'wrong' ? COLORS.wrong
        : down ? handPalette(this.noteStyle, hand === 'L' ? 'L' : 'R').main
        : this.targets.has(m) ? `rgba(240, 168, 50, ${0.35 + pulse * 0.5})`
        : impChord ? 'rgba(240, 168, 50, 0.55)'
        : COLORS.blackKey;
      roundRect(ctx, k.x, top - 1, k.w, bh, 3, true);
      ctx.fill();
      if (!down && !fl) { // hairline rim keeps the black keys readable on black
        ctx.strokeStyle = 'rgba(141, 151, 164, 0.28)';
        ctx.lineWidth = 1;
        roundRect(ctx, k.x + 0.5, top - 0.5, k.w - 1, bh - 1, 3, true);
        ctx.stroke();
      }
      if (impChord || impScale) {
        const cx = k.x + k.w / 2, cy = top + bh - 16;
        if (impChord) { ctx.fillStyle = '#3a2800'; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 6.29); ctx.fill(); }
        else { ctx.strokeStyle = '#9a948a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, 3.2, 0, 6.29); ctx.stroke(); }
      }
      if (this.kbLetters) {
        ctx.textAlign = 'center';
        ctx.fillStyle = down ? '#141414' : COLORS.labelOnBlack;
        ctx.font = `bold ${Math.min(9, k.w * 0.5)}px system-ui`;
        ctx.fillText(LETTERS[m % 12], k.x + k.w / 2, top + bh - 6);
      }
    }
  }
}

function roundRect(ctx, x, y, w, h, r, bottomOnly = false) {
  ctx.beginPath();
  if (bottomOnly) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.closePath();
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
