// WHICH TRANSCRIPTIONS CAN BE RE-IMPORTED, and from which file.
//
// Reads the library for every machine-transcribed group and finds the .mid it
// came from, so a re-import uses the song's OWN id, title and composer rather
// than a list typed out again (which is how a re-import quietly renames things).
// Prints TSV: midPath, id, title, composer.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const { SONGS } = await import('file:///' + join(import.meta.dirname, '..', 'js', 'songs.mjs').replace(/\\/g, '/'));
const DIRS = [
  'C:/Users/markh/keys-piano-tools/workshop/full',     // full-length takes win
  'C:/Users/markh/keys-piano-tools/workshop/comp',
  'C:/Users/markh/keys-piano-tools/workshop',
];

const groups = new Map();
for (const s of SONGS) {
  if (!/transcription/i.test(s.source || '')) continue;
  const g = s.group ?? s.id;
  if (!groups.has(g)) groups.set(g, s);
}

const listing = DIRS.map((d) => [d, existsSync(d) ? readdirSync(d).filter((f) => f.endsWith('.mid')) : []]);
for (const [g, s] of groups) {
  let found = null;
  for (const [dir, files] of listing) {
    // the file this group came from: exact id, else the id with a source suffix
    const hit = files.find((f) => f === g + '.mid') || files.find((f) => f.startsWith(g + '-') || f.startsWith(g + '2'));
    if (hit) { found = join(dir, hit); break; }
  }
  if (!found) { process.stderr.write(`no .mid for ${g}\n`); continue; }
  console.log([found.replace(/\\/g, '/'), g, s.title, s.composer || ''].join('\t'));
}
