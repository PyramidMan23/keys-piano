// Solve the semantic palette instead of guessing at it.
//
// The problem the check found: a saturated green and a saturated amber both
// simulate to nearly the same yellowish tone for a deuteranope (L*80 vs L*83).
// That is the app's current bug too (#f0a832 amber vs #e05252 red land 1.0 L*
// apart). Hand-tweaking hex codes was not converging, so this searches.
//
// For each state we fix the HUE (it still carries meaning for normal colour
// vision) and search lightness and chroma for the combination that:
//   1. passes WCAG AA 4.5:1 as text on the app's ground, and
//   2. maximises the SMALLEST pairwise lightness gap between states once
//      simulated as a deuteranope and a protanope, which are the two types
//      that flatten the green/amber/red axis.
//
// Run: node design-2026-08/palette-solve.mjs

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const unlin = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const relLum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const contrast = (a, b) => { const [x, y] = [relLum(hex(a)), relLum(hex(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const lstar = (h) => { const y = relLum(hex(h)); return y <= 216 / 24389 ? y * 24389 / 27 : 116 * Math.cbrt(y) - 16; };

const CVD = {
  deuteranope: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
  protanope:   [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
  tritanope:   [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]],
};
const simulate = (h, type) => {
  const m = CVD[type], c = hex(h).map(lin);
  return toHex(m.map((r) => r[0] * c[0] + r[1] * c[1] + r[2] * c[2]).map(unlin));
};

// HSL -> hex, so we can sweep lightness and saturation inside a fixed hue.
function hsl(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

// 2026-08-29, after measuring Apple Music and Spotify: the surfaces moved.
// Spotify runs its page at L*5 and RAISES cards to L*12; we copied that split,
// so the worst background any of these colours now sits on is the raised card,
// not the page. Solving against the page instead would pass here and fail in
// the product. Lifting muted for AA on the card then collapsed it against the
// green, and lifting the green pushed it into the red's band for protanopes,
// which is why all four are solved JOINTLY rather than one at a time.
const GROUND = '#1a221c';
// hue is fixed per state, everything else is searched
// Constraints exist because the first unconstrained run "solved" it by making
// inactive the loudest colour on screen and the decay warning near-white. A
// separation score is not a design. Each state must still LOOK like itself:
// a floor on saturation so green reads green, a ceiling on lightness so the
// warning is not white, and muted held quiet and neutral by construction.
const STATES = [
  { key: 'right',  hue: 145, sMin: 0.28, sMax: 0.60, lMin: 0.55, lMax: 0.86, label: 'banked / clean / correct' },
  { key: 'urgent', hue: 42,  sMin: 0.45, sMax: 0.80, lMin: 0.48, lMax: 0.72, label: 'decaying / needs attention' },
  { key: 'wrong',  hue: 6,   sMin: 0.40, sMax: 0.75, lMin: 0.48, lMax: 0.74, label: 'wrong note / failure' },
  { key: 'muted',  hue: 150, sMin: 0.02, sMax: 0.10, lMin: 0.44, lMax: 0.60, label: 'inactive' },
];

// candidate colours per state that clear AA on the ground
const options = STATES.map((st) => {
  const out = [];
  for (let l = st.lMin; l <= st.lMax + 1e-9; l += 0.01) {
    for (let s = st.sMin; s <= st.sMax + 1e-9; s += 0.02) {
      const c = hsl(st.hue, s, l);
      if (contrast(c, GROUND) >= 4.5) out.push(c);
    }
  }
  return { ...st, out };
});
console.log('AA-passing candidates per state:', options.map((o) => `${o.key} ${o.out.length}`).join(', '));

// score a combination by its weakest pairwise separation, in the two types
// that flatten this axis. Trichromats get hue as well, so they are not the
// binding constraint.
const score = (pick) => {
  // hard rejection: inactive may never outshine a state that means something
  const Lp = pick.map((c) => lstar(c));
  if (Lp[3] >= Math.min(Lp[0], Lp[1], Lp[2])) return { worst: -1, worstPair: 'muted too loud' };
  let worst = Infinity, worstPair = '';
  for (const type of ['deuteranope', 'protanope']) {
    const L = pick.map((c) => lstar(simulate(c, type)));
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const d = Math.abs(L[i] - L[j]);
      if (d < worst) { worst = d; worstPair = `${STATES[i].key}/${STATES[j].key} (${type})`; }
    }
  }
  return { worst, worstPair };
};

// greedy then local search: the space is ~10^7, brute force is pointless
let best = null;
for (let restart = 0; restart < 240; restart++) {
  // deterministic spread of starting points, no RNG (repeatable output)
  let pick = options.map((o, i) => o.out[(restart * 7 + i * 31) % o.out.length]);
  let cur = score(pick);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < pick.length; i++) {
      for (const cand of options[i].out) {
        const trial = [...pick]; trial[i] = cand;
        const s = score(trial);
        if (s.worst > cur.worst) { pick = trial; cur = s; improved = true; }
      }
    }
  }
  if (!best || cur.worst > best.cur.worst) best = { pick, cur };
}

console.log(`\nBest separation found: smallest gap ${best.cur.worst.toFixed(1)} L* (${best.cur.worstPair})\n`);
best.pick.forEach((c, i) => {
  console.log(`  ${STATES[i].key.padEnd(7)} ${c}  contrast ${contrast(c, GROUND).toFixed(2)}:1  ${STATES[i].label}`);
});
console.log('\nHow each type of colour vision reads the ladder:');
for (const type of ['deuteranope', 'protanope', 'tritanope']) {
  console.log(`  ${type.padEnd(12)} ` + best.pick.map((c, i) => `${STATES[i].key} L*${lstar(simulate(c, type)).toFixed(0)}`).join('  '));
}
console.log('\nNormal colour vision L*: ' + best.pick.map((c, i) => `${STATES[i].key} L*${lstar(c).toFixed(0)}`).join('  '));
