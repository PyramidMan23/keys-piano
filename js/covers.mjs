// Generative song covers (15th council 2026-08-28, Mark: "cover art…the way
// Apple would, sleek, alive"). Laws from the council, kept exactly:
//  - PLATES, never wallpaper: covers sit BESIDE text, never behind it; the
//    play screen shows one only while armed/paused, fading as notes start.
//  - Derived from the song's own DATA (honest art: the notes you will play
//    are the picture). Rendered once per song, cached.
//  - True-black base, smoked-glass frame; NO amber inside artwork (amber
//    stays the next-action's light); artwork peak luminance capped so card
//    text contrast is untouched.
//  - Identity is never hue alone: every cover carries a perimeter NOTCH
//    signature + the engraved monogram (shape + mark, colour-blind law).
//  - "Alive" = a single 320ms specular sweep on hover/focus, replay only
//    after focus leaves; reduced-motion gets opacity only. No loops.
// coverSpec() is pure + node-tested; renderCover() is the only canvas part.
//
// 2026-08-28, Mark: "I want the actual album art for each song, not some
// random picture." So the generated plate is now the FALLBACK, not the face.
// 26 of 30 groups have their real sleeve on disk (tools/fetch-art.mjs, matched
// against the expected artist / track / record before it was accepted). The
// four that do not are the ones with no honest recording: Happy Birthday,
// Bella Ciao, and the two scale drills. They still get the note-derived plate,
// which is the point of keeping it: an unowned song must not look broken next
// to a real sleeve.
import { difficultyFeatures } from './difficulty.mjs';
import { ART } from './art-manifest.mjs';

const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// muted dark-glass hue pairs, every channel low enough that composited
// luminance stays under the council ceiling (test-pinned; no amber ~30-50°)
export const COVER_HUES = [
  [[38, 66, 72], [24, 40, 52]],   // teal / slate
  [[72, 46, 38], [46, 30, 28]],   // rust / umber
  [[46, 66, 44], [28, 42, 34]],   // moss / pine
  [[64, 42, 66], [38, 28, 46]],   // plum / dusk
  [[42, 50, 64], [28, 32, 44]],   // steel / navy-smoke
  [[56, 64, 38], [36, 42, 26]],   // olive / moss-smoke (sand was amber-band, own test caught it)
  [[66, 38, 48], [40, 26, 34]],   // wine / rose-smoke
  [[40, 58, 58], [26, 38, 40]],   // sea / stone
];
export const FAMILIES = ['constellation', 'arc', 'pulse', 'lattice', 'orbit', 'cascade'];

export function coverSpec(song) {
  const f = difficultyFeatures(song);
  const h = hash(song.group ?? song.id);
  // family from the song's dominant measurable character, hash tie-break
  let family;
  if (f.chordFrac > 0.45) family = 'lattice';
  else if (f.offGrid > 0.25) family = 'cascade';
  else if (f.nps > 4.5) family = 'pulse';
  else if (f.span > 3.6) family = 'orbit';
  else if (f.variety <= 14) family = 'arc';
  else family = FAMILIES[h % FAMILIES.length];
  const hues = COVER_HUES[h % COVER_HUES.length];
  // first 48 onsets, normalized: the notes ARE the artwork
  const notes = [...song.notes].sort((a, b) => a.b - b.b).slice(0, 48);
  const endB = Math.max(...notes.map((n) => n.b + n.d), 1);
  const lo = Math.min(...notes.map((n) => n.m)), hi = Math.max(...notes.map((n) => n.m));
  const pts = notes.map((n) => ({
    x: n.b / endB,
    y: hi === lo ? 0.5 : 1 - (n.m - lo) / (hi - lo),
    s: Math.min(1, n.d / 4),
    L: n.h === 'L',
  }));
  return {
    id: song.group ?? song.id,
    family,
    hues,
    pts,
    rot: (h >> 3) % 4,                 // quarter-turn rotation
    mirror: ((h >> 5) & 1) === 1,
    notches: [(h >> 7) % 12, ((h >> 11) % 12), ((h >> 15) % 12)].map((v, i) => (v + i * 4) % 12),
    monogram: (song.title ?? '?').replace(/^(The|A|An) /, '')[0],
  };
}

// distinctness fingerprint (council: family + hues + notch signature, 
// uniqueness across the whole library is pinned by a test, not hoped for)
export const coverFingerprint = (spec) =>
  spec.family + '|' + spec.hues[0].join(',') + '|' + spec.notches.join(',') + '|' + spec.rot + (spec.mirror ? 'm' : '');

// The real sleeve if this song has one, else null. Two sizes on disk: the
// 128 thumb for row plates, the 512 for anything bigger. Pure, so it is
// node-testable without a canvas.
export const sleeveUrlByGroup = (group, size = 256) =>
  (ART[group] ? `art/${size <= 128 ? 128 : 512}/${group}.jpg` : null);

export function sleeveUrl(song, size = 256) {
  return sleeveUrlByGroup(song.group ?? song.id, size);
}

const cache = new Map();
export function coverDataUrl(song, size = 256) {
  const real = sleeveUrl(song, size);
  if (real) return real;
  const key = (song.group ?? song.id) + '@' + size;
  if (cache.has(key)) return cache.get(key);
  const spec = coverSpec(song);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const S = size, inset = S * 0.125;
  const [hueA, hueB] = spec.hues;
  const rgba = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
  // base + smoked-glass frame
  x.fillStyle = '#000004';
  x.fillRect(0, 0, S, S);
  const g = x.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, rgba(hueB, 0.55));
  g.addColorStop(1, 'rgba(0,0,4,0.9)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(255,255,255,0.10)';
  x.lineWidth = Math.max(1, S / 128);
  x.strokeRect(x.lineWidth / 2, x.lineWidth / 2, S - x.lineWidth, S - x.lineWidth);
  // perimeter notch signature (identity without hue)
  x.strokeStyle = 'rgba(255,255,255,0.15)'; // luminance ceiling law
  x.lineWidth = Math.max(1.5, S / 96);
  for (const n of spec.notches) {
    const side = n % 4, off = (Math.floor(n / 4) + 1) * S / 4;
    x.beginPath();
    if (side === 0) { x.moveTo(off - S / 32, 2); x.lineTo(off + S / 32, 2); }
    else if (side === 1) { x.moveTo(S - 2, off - S / 32); x.lineTo(S - 2, off + S / 32); }
    else if (side === 2) { x.moveTo(off - S / 32, S - 2); x.lineTo(off + S / 32, S - 2); }
    else { x.moveTo(2, off - S / 32); x.lineTo(2, off + S / 32); }
    x.stroke();
  }
  // plot the notes per family, inside the safe inset
  x.save();
  x.translate(S / 2, S / 2);
  x.rotate(spec.rot * Math.PI / 2);
  if (spec.mirror) x.scale(-1, 1);
  x.translate(-S / 2, -S / 2);
  const px = (p) => inset + p.x * (S - 2 * inset);
  const py = (p) => inset + p.y * (S - 2 * inset);
  const dot = (p, r, rgb, a) => { x.beginPath(); x.arc(px(p), py(p), r, 0, 7); x.fillStyle = rgba(rgb, a); x.fill(); };
  if (spec.family === 'arc' || spec.family === 'cascade') {
    x.beginPath();
    spec.pts.forEach((p, i) => (i ? x.lineTo(px(p), py(p)) : x.moveTo(px(p), py(p))));
    x.strokeStyle = rgba(hueA, 0.5);
    x.lineWidth = Math.max(1.5, S / 100);
    x.stroke();
    for (const p of spec.pts) dot(p, Math.max(1.5, S / 90), hueA, 0.55);
  } else if (spec.family === 'pulse') {
    for (const p of spec.pts) {
      x.fillStyle = rgba(p.L ? hueB : hueA, 0.55);
      const w = Math.max(2, S / 64);
      x.fillRect(px(p) - w / 2, py(p), w, (S - inset) - py(p) > 0 ? Math.max(S / 40, (1 - p.y) * S * 0.2) : S / 40);
    }
  } else if (spec.family === 'lattice') {
    x.strokeStyle = rgba(hueA, 0.35);
    x.lineWidth = Math.max(1, S / 128);
    for (const p of spec.pts) { x.strokeRect(px(p) - S / 40, py(p) - S / 40, S / 20, S / 20); }
  } else if (spec.family === 'orbit') {
    for (const p of spec.pts) {
      x.beginPath();
      x.arc(S / 2, S / 2, Math.abs(p.y - 0.5) * (S - 2 * inset) + S / 20, p.x * 6.28, p.x * 6.28 + 0.9);
      x.strokeStyle = rgba(p.L ? hueB : hueA, 0.5);
      x.lineWidth = Math.max(1.5, S / 100);
      x.stroke();
    }
  } else { // constellation
    for (const p of spec.pts) dot(p, Math.max(1.5, S / 96) + p.s * S / 60, p.L ? hueB : hueA, 0.55);
  }
  x.restore();
  // ONE neutral highlight + the engraved monogram (identity, not decoration)
  x.strokeStyle = 'rgba(255,255,255,0.16)';
  x.lineWidth = Math.max(1, S / 128);
  x.beginPath(); x.moveTo(inset, inset * 0.72); x.lineTo(S - inset, inset * 0.72); x.stroke();
  x.font = `600 ${S * 0.16}px Fraunces, Georgia, serif`;
  x.fillStyle = 'rgba(255,255,255,0.16)';
  x.textBaseline = 'bottom';
  x.fillText(spec.monogram, inset * 0.9, S - inset * 0.7);
  const url = c.toDataURL('image/png');
  cache.set(key, url);
  return url;
}
