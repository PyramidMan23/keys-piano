// Fetch public-domain piano scores from the Mutopia Project and run each one
// through tools/import-midi.mjs.
//
// Mutopia files are typeset from the score in LilyPond and exported with the
// staves intact, which is why this lane is worth so much more than transcribing
// a performance: the file SAYS which hand plays each note, so the importer
// never has to guess. On the Chopin nocturne that meant a mean timing error of
// 0.004 beats and all three tiers passing, against 0.051 and one of three for a
// machine transcription of a recording.
//
// Every composer here died over a century ago and Mutopia publishes these
// specifically to be used. Files land in keys-piano-tools/midi/ and are kept,
// so a re-import never needs the network.
//
//   node tools/import-mutopia.mjs            import everything below
//   node tools/import-mutopia.mjs --only bach-prelude-c
//   node tools/import-mutopia.mjs --dry
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'C:/Users/markh/keys-piano-tools/midi';
const BASE = 'https://www.mutopiaproject.org/ftp';

// path is the Mutopia folder; the .mid inside is always named after the folder
const PIECES = [
  { path: 'SatieE/gymnopedie_1',                   id: 'gymnopedie-1',      title: 'Gymnopédie No. 1',            composer: 'Erik Satie' },
  { path: 'BachJS/BWV846/wtk1-prelude1',           id: 'bach-prelude-c',    title: 'Prelude in C major',          composer: 'J.S. Bach, BWV 846' },
  { path: 'BachJS/BWV988/bwv-988-aria',            id: 'goldberg-aria',     title: 'Goldberg Variations, Aria',   composer: 'J.S. Bach, BWV 988' },
  { path: 'DebussyC/L75/debussy_Ste_Bergamesq_Clair', id: 'clair-de-lune',  title: 'Clair de Lune',               composer: 'Claude Debussy' },
  { path: 'DebussyC/L66/debussy_Arabesque_1',      id: 'arabesque-1',       title: 'Arabesque No. 1',             composer: 'Claude Debussy' },
  { path: 'LisztF/S.172/liszt-consolation-no3',    id: 'consolation-3',     title: 'Consolation No. 3',           composer: 'Franz Liszt' },
  { path: 'MozartWA/KV331/KV331_3_RondoAllaTurca', id: 'rondo-alla-turca',  title: 'Rondo alla Turca',            composer: 'W.A. Mozart, K. 331' },
  { path: 'SchumannR/O15/SchumannOp15No07',        id: 'traumerei',         title: 'Träumerei',                   composer: 'Robert Schumann, Op. 15' },
  { path: 'BeethovenLv/O13/pathetique-2',          id: 'pathetique-2',      title: 'Pathétique Sonata, 2nd movement', composer: 'Beethoven, Op. 13' },
  { path: 'ChopinFF/O28/Chop-28-4',                id: 'prelude-e-minor',   title: 'Prelude in E minor',          composer: 'Chopin, Op. 28 No. 4' },
  { path: 'ChopinFF/O28/Chop-28-15',               id: 'raindrop-prelude',  title: 'Raindrop Prelude',            composer: 'Chopin, Op. 28 No. 15' },
  { path: 'ChopinFF/O66/chopin_fantaisie-impromptu', id: 'fantaisie-impromptu', title: 'Fantaisie-Impromptu',     composer: 'Chopin, Op. posth. 66' },
];

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const dry = process.argv.includes('--dry');
mkdirSync(DIR, { recursive: true });

const report = [];
for (const p of PIECES) {
  if (only && p.id !== only) continue;
  const name = p.path.split('/').pop();
  const file = join(DIR, p.id + '.mid');
  try {
    if (!existsSync(file) || statSync(file).size < 100) {
      const url = `${BASE}/${p.path}/${name}.mid`;
      const buf = execFileSync('curl', ['-sL', '--fail', url], { maxBuffer: 1 << 26, encoding: 'buffer' });
      if (buf.subarray(0, 4).toString('ascii') !== 'MThd') throw new Error('not a MIDI file (got ' + buf.length + ' bytes)');
      writeFileSync(file, buf);
    }
    const args = [join(import.meta.dirname, 'import-midi.mjs'), file,
      '--id', p.id, '--title', p.title, '--composer', p.composer,
      '--group', p.id, '--source', 'Mutopia Project, ' + p.path];
    if (dry) args.push('--dry');
    const out = execFileSync(process.execPath, args, { encoding: 'utf8' });
    const tiers = [...out.matchAll(/^ok\s+(\S+)\s+(\d+) notes, (\d+)bpm/gm)].map((m) => `${m[1]} (${m[2]}n ${m[3]}bpm)`);
    const refused = [...out.matchAll(/^REFUSED\s+(\w+):/gm)].map((m) => m[1]);
    const hands = (out.match(/^hands: (.+)$/m) || [])[1] ?? '?';
    report.push({ id: p.id, title: p.title, tiers, refused, hands, err: null });
  } catch (e) {
    report.push({ id: p.id, title: p.title, tiers: [], refused: [], hands: '-', err: String(e.stdout || e.message).slice(-200).trim() });
  }
  const r = report[report.length - 1];
  console.log(`${r.err ? 'FAIL' : 'ok  '} ${r.id.padEnd(22)} ${r.err ? r.err : r.tiers.join(', ') + (r.refused.length ? '  REFUSED: ' + r.refused.join(',') : '')}`);
}

console.log('\n' + '-'.repeat(78));
const good = report.filter((r) => !r.err && r.tiers.length);
console.log(`${good.length}/${report.length} pieces imported, ${good.reduce((a, c) => a + c.tiers.length, 0)} playable tiers`);
const guessed = good.filter((r) => /derived/.test(r.hands));
if (guessed.length) console.log(`hands DERIVED (the file carried no staves) for: ${guessed.map((r) => r.id).join(', ')}`);
const refused = report.filter((r) => r.refused.length);
if (refused.length) console.log(`tiers refused by the audit: ${refused.map((r) => r.id + ':' + r.refused.join('/')).join(', ')}`);
for (const r of report.filter((x) => x.err)) console.log(`FAILED ${r.id}: ${r.err}`);
