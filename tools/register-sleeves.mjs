// Put generated sleeves into the art manifest, HONESTLY.
//
// The manifest's existing entries mean "this sleeve is a photograph of a real
// record", carrying artist/album/year. A generated sleeve is not that, and
// giving one a fabricated artist and year would put a lie in the one file whose
// whole job is provenance. So these are marked `generated: true` and say what
// they were drawn from, which is the piece's own notes.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SONGS } from '../js/songs.mjs';

const ROOT = join(import.meta.dirname, '..');
const manifest = join(ROOT, 'js', 'art-manifest.mjs');
const cur = readFileSync(manifest, 'utf8');
const m = cur.match(/export const ART = (\{[\s\S]*?\});?\s*$/);
if (!m) { console.error('could not read the ART object out of art-manifest.mjs'); process.exit(1); }
const art = JSON.parse(m[1]);

const groups = new Map();
for (const s of SONGS) {
  const g = s.group ?? s.id;
  if (!groups.has(g)) groups.set(g, s);
}

let added = 0;
for (const [g, song] of groups) {
  if (art[g]) continue;
  if (!existsSync(join(ROOT, 'art', '512', g + '.jpg'))) continue;
  art[g] = { generated: true,
    drawnFrom: 'the notes of ' + song.title + (song.composer ? ', ' + song.composer : '') };
  added++;
}

const sorted = Object.fromEntries(Object.keys(art).sort().map((k) => [k, art[k]]));
writeFileSync(manifest, cur.slice(0, m.index) + 'export const ART = ' + JSON.stringify(sorted, null, 2) + ';\n');
console.log(`registered ${added} generated sleeves; the manifest now has ${Object.keys(sorted).length} entries ` +
  `(${Object.values(sorted).filter((v) => v.generated).length} generated, ${Object.values(sorted).filter((v) => !v.generated).length} from real records)`);
