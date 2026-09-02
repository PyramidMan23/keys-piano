// Human-label contact sheet: for a sample of notes, crop the STRIKE frame around
// the key (keys + the hands over them), mark the key's column, print the claim,
// and tile them so a person can say which hand really played it.
//   node contact-sheet.mjs <video> <assigned.json> <geometry.json> --pick "12,40,77,..." --out sheet.png
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const [video, asgPath, geoPath] = args.filter((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1].startsWith('--')));
const A = JSON.parse(readFileSync(asgPath, 'utf8')); const geo = JSON.parse(readFileSync(geoPath, 'utf8'));
const pick = flag('pick').split(',').map(Number); const out = flag('out', 'sheet.png');
const keyOf = Object.fromEntries(geo.keys.map((k) => [k.midi, k]));
const nm = (m) => ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][m % 12] + (Math.floor(m / 12) - 1);
const tiles = [];
for (const i of pick) {
  const n = A.notes[i]; const k = keyOf[n.midi]; const cx = Math.round((k.x0 + k.x1) / 2);
  const x0 = Math.max(0, Math.min(geo.width - 640, cx - 320)); const y0 = Math.max(0, geo.keyboardTopY - 60); const h = Math.min(geo.height - y0, (geo.keyboardBottomY ?? geo.height) - y0 + 180);
  const label = `#${i} ${nm(n.midi)} t=${n.strikeT.toFixed(2)} claim=${n.hand ?? 'UNRESOLVED'}`;
  const tile = `${out}.tile${tiles.length}.png`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(n.strikeT), '-i', video, '-frames:v', '1', '-vf',
    `crop=640:${h}:${x0}:${y0},drawbox=x=${cx - x0 - 2}:y=0:w=5:h=${h}:color=yellow@0.9:t=fill`, tile]);
  tiles.push(tile);
}
const inputs = tiles.flatMap((t) => ['-i', t]);
execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${tiles.map((_, i) => `[${i}:v]`).join('')}xstack=inputs=${tiles.length}:layout=${tiles.map((_, i) => { const r = Math.floor(i / 3); return `${(i % 3) * 640}_${r === 0 ? '0' : Array.from({ length: r }, (_, k) => 'h' + k * 3).join('+')}`; }).join('|')}`, out]);
console.log('wrote', out, 'with', tiles.length, 'tiles');
