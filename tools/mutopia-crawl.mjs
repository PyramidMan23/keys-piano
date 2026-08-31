// CRAWL MUTOPIA'S PIANO CATALOGUE and import everything solo-piano it holds.
//
// Mark, 2026-08-30: "why are there still only 46 songs? I wanna add sooooo many
// more, why is this taking so long?" Fair. Importing pieces one at a time was
// the slow part, not the importer.
//
// Mutopia ships an .rdf beside every piece with its real title, composer and
// instrument, so the catalogue can be read rather than guessed at from folder
// names. Everything here is public domain and typeset from the score in
// LilyPond, which means the MIDI carries STAVES: the importer takes the hands
// off the file and never has to guess, which is the whole reason this lane is
// worth more than transcribing a recording.
//
//   node tools/mutopia-crawl.mjs --list            just show what is there
//   node tools/mutopia-crawl.mjs --max 40          fetch and import up to 40
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'https://www.mutopiaproject.org/ftp';
const DIR = 'C:/Users/markh/keys-piano-tools/midi';
const ROOT = join(import.meta.dirname, '..');
const listOnly = process.argv.includes('--list');
const MAX = Number((process.argv.find((a, i) => process.argv[i - 1] === '--max')) || 40);

// composers with a substantial solo-piano catalogue on Mutopia
const COMPOSERS = ['ChopinFF', 'BeethovenLv', 'SatieE', 'DebussyC', 'SchumannR',
  'MozartWA', 'BachJS', 'LisztF', 'GriegE', 'SchubertF', 'MendelssohnF',
  'TchaikovskyPI', 'JoplinS', 'ClementiM', 'BurgmullerJFF', 'FieldJ'];

const get = (url) => {
  try { return execFileSync('curl', ['-sL', '--fail', '-m', '25', url], { encoding: 'utf8', maxBuffer: 1 << 26 }); }
  catch { return ''; }
};
const dirs = (html) => [...html.matchAll(/href="([^"?/][^"]*)\/"/g)].map((m) => m[1]).filter((d) => d !== '..');

const catalogue = [];
for (const c of COMPOSERS) {
  const top = get(`${BASE}/${c}/`);
  if (!top) { console.log(`  ${c}: unreachable`); continue; }
  let found = 0;
  for (const opus of dirs(top)) {
    const lvl = get(`${BASE}/${c}/${opus}/`);
    if (!lvl) continue;
    const pieces = dirs(lvl);
    // some composers put the piece folder directly under the composer
    const targets = pieces.length ? pieces.map((p) => `${c}/${opus}/${p}`) : [`${c}/${opus}`];
    for (const path of targets) {
      const leaf = path.split('/').pop();
      const rdf = get(`${BASE}/${path}/${leaf}.rdf`);
      if (!rdf) continue;
      const field = (n) => (rdf.match(new RegExp(`<mp:${n}>([^<]*)</mp:${n}>`)) || [])[1] ||
                           (rdf.match(new RegExp(`<dc:${n}>([^<]*)</dc:${n}>`)) || [])[1] || '';
      const instrument = field('for');
      if (!/^piano$/i.test(instrument.trim())) continue;      // solo piano only
      const title = field('title').trim();
      const composer = field('creator').trim() || field('maintainer').trim();
      if (!title) continue;
      catalogue.push({ path, leaf, title, composer });
      found++;
    }
  }
  console.log(`  ${c.padEnd(16)} ${found} solo-piano pieces`);
}

console.log(`\n${catalogue.length} solo-piano pieces in the catalogue`);
if (listOnly) {
  for (const p of catalogue.slice(0, 60)) console.log(`  ${p.title}  (${p.composer})`);
  process.exit(0);
}

// what is already in the library, so a re-run adds rather than repeats
const have = new Set();
try {
  const m = await import('file:///' + join(ROOT, 'js', 'songs-imported.mjs').replace(/\\/g, '/'));
  for (const s of m.IMPORTED || []) have.add(s.group ?? s.id);
} catch {}

mkdirSync(DIR, { recursive: true });
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
let added = 0, skipped = 0, refused = 0;
for (const p of catalogue) {
  if (added >= MAX) break;
  const id = slug(p.title);
  if (!id || have.has(id)) { skipped++; continue; }
  const file = join(DIR, id + '.mid');
  if (!existsSync(file)) {
    const buf = (() => {
      try { return execFileSync('curl', ['-sL', '--fail', '-m', '30', `${BASE}/${p.path}/${p.leaf}.mid`],
        { maxBuffer: 1 << 26, encoding: 'buffer' }); } catch { return null; }
    })();
    if (!buf || buf.subarray(0, 4).toString('ascii') !== 'MThd') { refused++; continue; }
    writeFileSync(file, buf);
  }
  try {
    const out = execFileSync(process.execPath, [join(import.meta.dirname, 'import-midi.mjs'), file,
      '--id', id, '--title', p.title, '--composer', p.composer, '--group', id,
      '--source', 'Mutopia Project, ' + p.path], { encoding: 'utf8' });
    const tiers = (out.match(/^ok /gm) || []).length;
    if (!tiers) { refused++; continue; }
    console.log(`  + ${p.title.slice(0, 44).padEnd(46)} ${tiers} tiers`);
    added++;
  } catch { refused++; }
}
console.log(`\nadded ${added}, already had ${skipped}, refused or unusable ${refused}`);
