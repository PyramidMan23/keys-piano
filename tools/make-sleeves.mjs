// GENERATED SLEEVES for the music that never had a record.
//
// Mark, 2026-08-30: "make sure every song has a cover art ... happy birthday and
// the c major songs didn't have art and we need them all too so it looks nice
// and adds colour to the app. make sure they all have art that matches and
// looks awesome."
//
// Bach did not release a record, so there is no sleeve to fetch and inventing
// an "artist / album / year" for one would be a lie sitting in a manifest whose
// whole meaning is "this came from a real release". Instead each of these gets
// a sleeve DRAWN FROM THE MUSIC ITSELF:
//
//   - the hue comes from the piece's own key, walked round the circle of
//     fifths, so the set reads as one series and no two neighbours collide
//   - major is warm and bright, minor is deep and cool, taken from the actual
//     pitch-class histogram rather than a label
//   - the ribbon across the sleeve IS the opening melody's contour, so a scale
//     climbs, a nocturne undulates, and every sleeve is true to its piece
//   - the type is the app's own Fraunces over letterspaced mono, so these sit
//     beside the real record sleeves without looking like a different app
//
// Rendered in the pinned headless Chrome and written at both sizes the app
// asks for.
//
//   node tools/make-sleeves.mjs            every group that has no sleeve
//   node tools/make-sleeves.mjs --only gymnopedie-1
//   node tools/make-sleeves.mjs --force    redraw ones that already exist
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch } from './cdp.mjs';
import { SONGS } from '../js/songs.mjs';
import { ART } from '../js/art-manifest.mjs';

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const force = process.argv.includes('--force');
const ROOT = join(import.meta.dirname, '..');
const NAMES = ['C', 'C sharp', 'D', 'E flat', 'E', 'F', 'F sharp', 'G', 'A flat', 'A', 'B flat', 'B'];
const FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];   // C G D A E B F# C# G# D# A# F

// The key, read off the notes rather than a label: correlate the pitch-class
// histogram against a major and a minor profile and take the best fit.
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
function keyOf(notes) {
  const h = new Array(12).fill(0);
  for (const n of notes) h[n.m % 12] += Math.max(0.25, Math.min(4, n.d));
  const corr = (profile, rot) => {
    let s = 0;
    for (let i = 0; i < 12; i++) s += h[(i + rot) % 12] * profile[i];
    return s;
  };
  // ☠️ The histogram alone confuses a key with its DOMINANT: it called the
  // Pathetique's Adagio E flat when Beethoven wrote it in A flat, a fifth away.
  // The bass line settles the argument, because a piece sits on its tonic and
  // almost always ENDS on it. Both hints are weighted, never decisive.
  const bass = notes.filter((n) => n.h === 'L');
  const bassHist = new Array(12).fill(0);
  for (const n of bass) bassHist[n.m % 12] += 1;
  const bassMax = Math.max(1, ...bassHist);
  const last = [...notes].sort((a, b) => (b.b + b.d) - (a.b + a.d))[0];
  const lastPc = last ? last.m % 12 : -1;
  const lastBass = bass.length ? [...bass].sort((a, b) => (b.b + b.d) - (a.b + a.d))[0].m % 12 : -1;

  let best = { score: -1 };
  for (let r = 0; r < 12; r++) {
    for (const [mode, p] of [['major', MAJ], ['minor', MIN]]) {
      let score = corr(p, r) / (mode === 'major' ? 1 : 1.02);
      score *= 1 + 0.16 * (bassHist[r] / bassMax);      // the bass lives on the tonic
      if (r === lastBass) score *= 1.14;                 // and lands on it
      else if (r === lastPc) score *= 1.06;
      if (score > best.score) best = { score, tonic: r, mode };
    }
  }
  return best;
}

// The opening melody, as a 0..1 contour. The top voice is the tune.
// The opening melody as a 0..1 contour, SMOOTHED INTO A GESTURE. The raw top
// line of a piece with repeated notes reads as a jagged trace, like a share
// price. A short moving average keeps the shape of the phrase (a scale still
// climbs, a nocturne still swells) and drops the jitter that made it look like
// data instead of music.
function contourOf(notes, steps = 40) {
  const rh = notes.filter((n) => n.h === 'R').sort((a, b) => a.b - b.b);
  const line = [];
  let lastBeat = null;
  for (const n of rh) {
    if (n.b === lastBeat) { if (n.m > line[line.length - 1]) line[line.length - 1] = n.m; continue; }
    line.push(n.m); lastBeat = n.b;
    if (line.length >= steps) break;
  }
  if (line.length < 4) return null;
  const win = line.length > 24 ? 3 : 2;
  const smooth = line.map((_, i) => {
    let t = 0, c = 0;
    for (let j = Math.max(0, i - win); j <= Math.min(line.length - 1, i + win); j++) { t += line[j]; c++; }
    return t / c;
  });
  const lo = Math.min(...smooth), hi = Math.max(...smooth);
  return smooth.map((m) => (m - lo) / Math.max(1e-6, hi - lo));
}

function sleeveHtml(song) {
  const key = keyOf(song.notes);
  const contour = contourOf(song.notes) || [0.2, 0.5, 0.35, 0.7, 0.5, 0.85, 0.6, 0.4];
  const hue = Math.round((FIFTHS.indexOf(key.tonic) / 12) * 360);
  const major = key.mode === 'major';

  // LIGHTNESS CARRIES AS MUCH AS HUE. Mark is colour blind, and a shelf whose
  // sleeves differ only in hue would read to him as one colour. Register does
  // the other half: a piece living high on the keyboard gets a brighter ground
  // than one living low, so every sleeve stays distinguishable with no hue at
  // all. Mode does the rest, major bright and open, minor deep.
  const mean = song.notes.reduce((a, c) => a + c.m, 0) / song.notes.length;
  const lift = Math.max(0, Math.min(1, (mean - 48) / 26));
  const L1 = Math.round((major ? 36 : 27) + lift * 14);
  const S1 = major ? 62 : 50;
  const c1 = `hsl(${hue} ${S1}% ${L1}%)`;
  const c2 = `hsl(${(hue + 26) % 360} ${S1 + 12}% ${Math.max(12, L1 - 14)}%)`;
  const c3 = `hsl(${(hue + 40) % 360} ${S1}% ${Math.max(7, L1 - 24)}%)`;
  const ink = `hsl(${hue} 28% ${Math.round(93 - (1 - lift) * 3)}%)`;
  const line = `hsl(${(hue + 22) % 360} 88% ${Math.round(63 + lift * 13)}%)`;
  // ☠️ `${line}3d` is NOT a colour. Appending hex alpha to an hsl() string makes
  // the whole background shorthand invalid, and the sleeve renders black no
  // matter what you do to the stops. Alpha goes inside, after a slash.
  const glow = `hsl(${(hue + 22) % 360} 88% ${Math.round(63 + lift * 13)}% / .24)`;

  const W = 512, PAD = 44, top = 246, h = 148;
  const pts = contour.map((v, i) => [PAD + (i / (contour.length - 1)) * (W - PAD * 2), top + h - v * h]);
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  const staves = [0, 1, 2, 3, 4].map((i) =>
    `<line x1="${PAD}" y1="${top + 12 + i * 31}" x2="${W - PAD}" y2="${top + 12 + i * 31}" stroke="${ink}" stroke-opacity=".10" stroke-width="1"/>`).join('');
  const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const title = esc(song.title);
  const size = title.length > 26 ? 36 : title.length > 18 ? 43 : 52;

  return `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family: Fraunces; src: url('fonts/Fraunces.ttf') format('truetype'); font-weight: 100 900; }
  html,body { margin:0; background:#000; }
  .s { position:relative; width:512px; height:512px; overflow:hidden;
       background:
         radial-gradient(72% 52% at 84% 94%, ${glow} 0%, transparent 62%),
         radial-gradient(78% 60% at 14% 2%, ${c1} 0%, transparent 70%),
         linear-gradient(157deg, ${c1} 0%, ${c2} 54%, ${c3} 100%); }
  .vig { position:absolute; inset:0;
    background: radial-gradient(128% 104% at 46% 34%, transparent 56%, rgba(0,0,0,.34) 100%); }
  .grain { position:absolute; inset:0; opacity:.40;
    background: repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 3px); }
  .eyebrow { position:absolute; left:44px; top:42px; font:400 13px/1 ui-monospace,Menlo,monospace;
    letter-spacing:.26em; text-transform:uppercase; color:${ink}; opacity:.6; }
  .title { position:absolute; left:44px; right:44px; top:70px;
    font:600 ${size}px/1.04 Fraunces,Georgia,serif; color:${ink}; letter-spacing:-.012em;
    text-shadow:0 2px 26px rgba(0,0,0,.45); }
  .rule { position:absolute; left:44px; width:72px; height:2px; top:210px; background:${line}; }
  .composer { position:absolute; left:44px; right:44px; bottom:42px;
    font:400 15px/1.35 ui-monospace,Menlo,monospace; letter-spacing:.14em;
    text-transform:uppercase; color:${ink}; opacity:.7; }
  svg { position:absolute; left:0; top:0; }
</style>
<div class="s">
  <svg width="512" height="512">
    <defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter></defs>
    ${staves}
    <path d="${d}" fill="none" stroke="${line}" stroke-width="16" stroke-linecap="round" opacity=".45" filter="url(#b)"/>
    <path d="${d}" fill="none" stroke="${line}" stroke-width="3.6" stroke-linecap="round"/>
    ${pts.filter((_, i) => i % 5 === 0).map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="${line}"/>`).join('')}
  </svg>
  <div class="vig"></div>
  <div class="grain"></div>
  <div class="eyebrow">${NAMES[key.tonic]} ${key.mode}</div>
  <div class="title">${title}</div>
  <div class="rule"></div>
  <div class="composer">${esc(song.composer)}</div>
</div>`;
}

// which groups need one
const groups = new Map();
for (const s of SONGS) {
  const g = s.group ?? s.id;
  if (!groups.has(g)) groups.set(g, s);
}
const targets = [...groups.entries()]
  .filter(([g]) => (force || !ART[g]))
  .filter(([g]) => !only || g === only);

if (!targets.length) { console.log('nothing to draw'); process.exit(0); }
console.log(`drawing ${targets.length} sleeves`);

mkdirSync(join(ROOT, 'art', '512'), { recursive: true });
mkdirSync(join(ROOT, 'art', '128'), { recursive: true });
const tmp = join(tmpdir(), 'keys-sleeves');
mkdirSync(tmp, { recursive: true });

const b = await launch({ width: 560, height: 560, scale: 1, port: 9610 });
const made = [];
try {
  for (const [g, song] of targets) {
    const html = join(ROOT, '.sleeve.html');
    writeFileSync(html, sleeveHtml(song, g));
    await b.goto('http://localhost:4180/.sleeve.html');
    await new Promise((r) => setTimeout(r, 260));
    const png = join(tmp, g + '.png');
    writeFileSync(png, await b.shot({ x: 0, y: 0, width: 512, height: 512 }));
    for (const size of [512, 128]) {
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-vf', `scale=${size}:${size}:flags=lanczos`,
        '-q:v', '3', join(ROOT, 'art', String(size), g + '.jpg')]);
    }
    made.push({ g, title: song.title });
    console.log(`  ${g.padEnd(24)} ${song.title}`);
  }
} finally {
  await b.close();
  try { unlinkSync(join(ROOT, '.sleeve.html')); } catch {}
}

console.log(`\nwrote ${made.length} sleeves at 512 and 128`);
console.log('now run tools/register-sleeves.mjs to put them in the manifest');
