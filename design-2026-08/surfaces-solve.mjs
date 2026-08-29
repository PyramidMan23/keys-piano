// Surface ramp, derived from MEASURED Apple Music and Spotify values.
//
// What was measured in the browser, not recalled:
//   Spotify   page ground rgb(18,18,18)  L* 5    raised cards rgb(31,31,31) L* 12
//   Apple     page ground rgb(31,31,31)  L* 12
//   Keys v3   ground L* 3, panel L* 8
//
// Claude's first read was "both apps sit artwork on L*12, so raise our ground".
// Codex killed that: Spotify's PAGE is L*5 and only its raised CARDS reach L*12,
// so a blanket raise would flatten the hierarchy and add glare in a dark room.
// The fix is the split Spotify actually uses: a dark ground, raised surfaces
// for the things that hold content, and a border around sleeves so a dark album
// cover keeps its edge locally, where the defect actually is.
//
// This script solves each surface to a TARGET L* inside the chosen hue, then
// re-checks every contrast pair, because raising the panel lowers the contrast
// of everything sitting on it.
//
// Run: node design-2026-08/surfaces-solve.mjs

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const relLum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const lstar = (h) => { const y = relLum(hex(h)); return y <= 216 / 24389 ? y * 24389 / 27 : 116 * Math.cbrt(y) - 16; };
const contrast = (a, b) => { const [x, y] = [relLum(hex(a)), relLum(hex(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// Scale a hue's RGB ratios until it lands on the target lightness.
function atLightness(baseHex, targetL) {
  const base = hex(baseHex);
  const mx = Math.max(...base) || 1;
  let lo = 0, hi = 255;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const c = toHex(base.map((v) => (v / mx) * mid));
    if (lstar(c) < targetL) lo = mid; else hi = mid;
  }
  return toHex(base.map((v) => (v / mx) * ((lo + hi) / 2)));
}

// The three hue families Mark is choosing between, expressed as a direction
// rather than a fixed colour, so each can be placed at any lightness.
const FAMILIES = {
  Conservatory: { dir: '#0A0D0B', note: 'near-black with a faint green cast' },
  Darkroom:     { dir: '#100E0B', note: 'warm near-black, the brown answer' },
  Eucalypt:     { dir: '#0B0D0C', note: 'cool charcoal' },
};

// Targets taken from the measurements above.
// 2026-08-29, Mark: "lets make sure the background is true black so the colours
// pop and theres a lot of contrast and it looks amazing on OLED".
// His panel is Samsung Display, 2880x1800, 14.0 inch, in an HP OmniBook X Flip,
// which is the OLED configuration. On OLED a #000000 pixel is OFF, so the art
// genuinely floats and the contrast is not a ratio, it is absolute.
//
// This does NOT undo the Spotify split, it sharpens it. Apple and Spotify avoid
// true black because they also ship to LCD, where black is a grey hole with
// backlight bleed. Keys ships to one known OLED panel. So: the PAGE goes to
// true black, and the raised card stays at L*12, which is what keeps a dark
// album sleeve from dissolving and keeps near-black gradients from banding.
// The card is now 12 L* above the page instead of 7, so the structure reads
// harder, not softer.
const STEPS = [
  ['ground', 0,  'the page: true black, OLED pixels off'],
  ['raised', 12, 'cards, the recommendation strip, the rail, matching Spotify cards and Apple ground'],
  ['line',   19, 'borders, including the edge that keeps a dark sleeve separated'],
];

const INK = { Conservatory: '#E9EDE7', Darkroom: '#EDE9E1', Eucalypt: '#E8ECEA' };
// The semantic set is NOT re-derived here. Lifting one colour at a time was
// tried and it chased its own tail: raising the card to L*12 pushed muted under
// AA, lifting muted collapsed it against the green, and lifting the green then
// pushed it into the red's band for protanopes. One change moves the whole
// ladder, so all four are solved JOINTLY by palette-solve.mjs, against the
// raised card, which is the worst background any of them now sits on. These are
// its output. Change them there, never here, or the two scripts will disagree
// and the one nobody re-runs will win.
const SEMANTIC = {
  accentInk: '#82bf9c',   // banked, clean, correct
  urgent:    '#efce81',   // decaying, needs attention
  wrong:     '#d4a19b',   // wrong note
  muted:     '#788c82',   // inactive
};
const ACCENT_FILL = '#2E6B47';

for (const [name, fam] of Object.entries(FAMILIES)) {
  console.log(`\n=== ${name} === ${fam.note}`);
  const s = {};
  for (const [key, target, why] of STEPS) {
    s[key] = target === 0 ? '#000000' : atLightness(fam.dir, target);
    console.log(`  ${key.padEnd(7)} ${s[key]}  L*${lstar(s[key]).toFixed(1).padStart(4)}   ${why}`);
  }
  const ink = INK[name];
  console.log('  contrast, everything re-checked against the RAISED surface too:');
  let fails = 0;
  const check = (fg, bg, need, what) => {
    const r = contrast(fg, bg), ok = r >= need;
    if (!ok) fails++;
    console.log(`    ${ok ? 'PASS' : 'FAIL'} ${r.toFixed(2)}:1 (need ${need})  ${what}`);
  };
  check(ink, s.ground, 4.5, 'ink on the page');
  check(ink, s.raised, 4.5, 'ink on a raised card');
  for (const [k, v] of Object.entries(SEMANTIC)) {
    check(v, s.ground, 4.5, `${k} on the page`);
    check(v, s.raised, 4.5, `${k} on a raised card`);
  }
  check('#FFFFFF', ACCENT_FILL, 4.5, 'white on the filled accent button');
  console.log(`  -> ${fails === 0 ? 'all pass' : fails + ' FAILURES'}`);
}

// Confirm the jointly-solved ladder still holds here. This is a CHECK, not a
// second derivation: if it ever disagrees with palette-solve.mjs, that script
// is right and these constants are stale.
const CVD = {
  deuteranope: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
  protanope:   [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
};
const unlin = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const simulate = (h, type) => { const m = CVD[type], c = hex(h).map(lin); return toHex(m.map((r) => r[0] * c[0] + r[1] * c[1] + r[2] * c[2]).map(unlin)); };
console.log('\ncolour-vision ladder, jointly solved against the raised card:');
for (const type of ['deuteranope', 'protanope']) {
  const e = Object.entries(SEMANTIC).map(([k, v]) => [k, lstar(simulate(v, type))]);
  let worst = Infinity, pair = '';
  for (let i = 0; i < e.length; i++) for (let j = i + 1; j < e.length; j++) {
    const d = Math.abs(e[i][1] - e[j][1]);
    if (d < worst) { worst = d; pair = `${e[i][0]}/${e[j][0]}`; }
  }
  console.log(`  ${type.padEnd(12)} ` + e.map(([k, L]) => `${k} L*${L.toFixed(0)}`).join('  ') + `   closest ${pair} ${worst.toFixed(1)} ${worst >= 10 ? 'OK' : 'TOO CLOSE'}`);
}

console.log(`\nSleeve edge: a 1px ${atLightness('#0A0D0B', 19)} border is ~${(lstar(atLightness('#0A0D0B', 19)) - 12).toFixed(0)} L* above the raised surface,`);
console.log('which is what stops a dark album cover from dissolving into the card behind it.');
