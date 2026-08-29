// Palette engineering for the Keys redesign (Mark 2026-08-29: "I don't want
// the main colour on top to be orange, everything I've been doing is orange.
// I love green, like earthy greens").
//
// Two things get MEASURED here rather than asserted:
//  1. WCAG contrast for every ink-on-surface pair the UI actually uses.
//  2. Colour-vision separation. Mark is colour-blind, so a palette that only
//     works for normal trichromats is a broken palette. Every candidate is run
//     through deuteranope, protanope and tritanope simulation, and the check
//     that matters is that the semantic colours stay separated by LIGHTNESS,
//     because lightness survives every type of CVD. Hue is decoration.
//
// Run: node design-2026-08/palette-check.mjs

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const relLum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const contrast = (a, b) => {
  const [x, y] = [relLum(hex(a)), relLum(hex(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
// perceptual lightness, CIE L* — the axis every CVD type keeps
const lstar = (h) => { const y = relLum(hex(h)); return y <= 216 / 24389 ? y * 24389 / 27 : 116 * Math.cbrt(y) - 16; };

// Brettel/Viénot-style dichromat simulation in linear sRGB.
const CVD = {
  deuteranope: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
  protanope:   [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
  tritanope:   [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]],
};
const simulate = (h, type) => {
  const m = CVD[type], c = hex(h).map(lin);
  const out = m.map((row) => row[0] * c[0] + row[1] * c[1] + row[2] * c[2]);
  return toHex(out.map((v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
};

// The semantic set, staggered by LIGHTNESS on purpose. The first run of this
// script had amber and red landing 1.0 L* apart for a deuteranope, i.e. the
// same shade, which is also true of the app's current #f0a832 vs #e05252. The
// hues stay (they carry meaning for trichromats) but each state now sits on
// its own lightness step, so the ladder survives every kind of colour vision.
const SEMANTIC_TIERED = {
  right: '#B6E3C4',    // lightest: banked, clean, correct
  urgent: '#E0B15A',   // middle: decaying, needs attention
  wrong: '#B4453E',    // darkest: wrong note, failure
  muted: '#7C8A83',    // furthest down: inactive
};

const PALETTES = {
  // The green Mark already approved once, on solvapartners (#2E6B47 family),
  // rebuilt for a dark app instead of an ivory site.
  conservatory: {
    note: 'Deep forest on near-black with a faint green cast. Closest to the green he already signed off.',
    ground: '#0A0D0B', panel: '#121814', line: '#1E2620',
    ink: '#E9EDE7',
    accentFill: '#2E6B47',
    ...SEMANTIC_TIERED, accentInk: '#B6E3C4',
  },
  // The answer to "maybe not brown": brown IS dark orange, so it cannot be a
  // colour. It can be the GROUND. A warm-neutral near-black reads as paper in
  // a dark room and makes the sleeves pop, without the app reading brown.
  darkroom: {
    note: 'Warm-neutral ground (the brown lives only in the dark, never as a colour) with the same forest accent.',
    ground: '#100E0B', panel: '#191611', line: '#26221B',
    ink: '#EDE9E1',
    accentFill: '#2E6B47',
    ...SEMANTIC_TIERED, accentInk: '#B6E3C4',
  },
  // Sage/eucalyptus: greyer, cooler, more "instrument" than "forest".
  eucalypt: {
    note: 'Desaturated sage on charcoal. Calmest, most instrument-like, least likely to read as a brand colour.',
    ground: '#0B0D0C', panel: '#141816', line: '#212724',
    ink: '#E8ECEA',
    accentFill: '#3D6B57',
    ...SEMANTIC_TIERED, accentInk: '#B6E3C4',
  },
};

// The pairs the UI genuinely renders. AA body text is 4.5, large text 3.0.
const PAIRS = [
  ['ink', 'ground', 4.5, 'body text on the page'],
  ['ink', 'panel', 4.5, 'body text on a card'],
  ['muted', 'ground', 4.5, 'secondary text on the page'],
  ['muted', 'panel', 4.5, 'secondary text on a card'],
  ['accentInk', 'ground', 4.5, 'accent text and rules on the page'],
  ['accentInk', 'panel', 4.5, 'accent text on a card'],
  ['urgent', 'ground', 4.5, 'the decay warning'],
  ['wrong', 'ground', 4.5, 'a wrong note'],
];

for (const [name, p] of Object.entries(PALETTES)) {
  console.log(`\n=== ${name} ===\n${p.note}`);
  let fails = 0;
  for (const [fg, bg, need, what] of PAIRS) {
    const r = contrast(p[fg], p[bg]);
    const ok = r >= need;
    if (!ok) fails++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${r.toFixed(2)}:1 (need ${need})  ${fg} on ${bg}  ${what}`);
  }
  // white text sitting on the filled accent button
  const onFill = contrast('#FFFFFF', p.accentFill);
  console.log(`  ${onFill >= 4.5 ? 'PASS' : 'FAIL'} ${onFill.toFixed(2)}:1 (need 4.5)  white on the filled accent button`);
  if (onFill < 4.5) fails++;

  // Colour vision: the three states this app signals must stay apart for ANY
  // eyes. Lightness separation is the test, because hue separation is not
  // available to every viewer.
  const semantic = { accentInk: p.accentInk, urgent: p.urgent, wrong: p.wrong, muted: p.muted };
  console.log('  colour vision, semantic colours:');
  for (const type of ['deuteranope', 'protanope', 'tritanope']) {
    const sims = Object.entries(semantic).map(([k, v]) => [k, simulate(v, type)]);
    const worst = [];
    for (let i = 0; i < sims.length; i++) for (let j = i + 1; j < sims.length; j++) {
      worst.push({ pair: `${sims[i][0]}/${sims[j][0]}`, dL: Math.abs(lstar(sims[i][1]) - lstar(sims[j][1])) });
    }
    worst.sort((a, b) => a.dL - b.dL);
    const w = worst[0];
    // under ~10 L* apart two colours read as the same shade to that viewer,
    // which is exactly when a hue-only signal disappears
    console.log(`    ${type.padEnd(12)} closest pair ${w.pair.padEnd(22)} dL* ${w.dL.toFixed(1)} ${w.dL >= 10 ? 'separable' : 'TOO CLOSE, must not be hue-only'}`);
    if (type === 'deuteranope') console.log('      ladder as a deuteranope sees it: ' + sims.map(([k, v]) => `${k} L*${lstar(v).toFixed(0)}`).join('  '));
  }
  console.log(`  -> ${fails === 0 ? 'all contrast pairs pass' : fails + ' contrast failures'}`);
}
