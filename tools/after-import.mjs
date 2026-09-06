// EVERYTHING A NEW SONG NEEDS AFTER import-midi.mjs, in one command.
//
// Written 2026-09-06, after Mark asked why adding a song takes so long. Import
// is one command; what follows was five, run by hand, in a specific order, in a
// SPECIFIC COPY of the tree, and every mistake in this session came from that
// list rather than from the music:
//
//   - make-sleeves.mjs run from the Drive build copy photographed the server's
//     404 page, because it writes its scratch page next to itself and loads it
//     from localhost:4180, which serves the OTHER copy. Two cover sleeves
//     shipped as a screenshot of "not found", byte-identical, past all 19 gates.
//   - register-sleeves.mjs is a separate step and is easy to forget, which
//     leaves art on disk that the manifest never mentions.
//   - finger.mjs has to re-run or the new song has no fingering, and
//     record-tier-reasons.mjs has to re-run or the worklist reopens.
//   - and everything has to be mirrored to the other copy, or the gates test
//     code that is not the code you just wrote.
//
// So: one command, always in the serving copy, in the right order, mirrored and
// md5-verified at the end.
//
//   node tools/after-import.mjs                 the whole tail
//   node tools/after-import.mjs --no-sleeves    when the art is already right
import { execFileSync } from 'node:child_process';
import { readFileSync, copyFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const SERVING = 'C:/Users/markh/keys-piano';
const BUILD = 'G:/My Drive/Claude-Workspace/piano';

// ☠️ THE BROWSER READS THE SERVING COPY. Any step that renders (the sleeves)
// must run there or it photographs whatever that copy happens to hold.
if (join(import.meta.dirname, '..').replace(/\\/g, '/').toLowerCase() !== SERVING.toLowerCase()) {
  console.error(`REFUSE: run this from the serving copy (${SERVING}); the sleeve renderer loads its page from the server, which serves that tree`);
  process.exit(2);
}

const step = (label, file, args = []) => {
  process.stdout.write(`${label.padEnd(26)}`);
  const started = Date.now();
  try {
    const out = execFileSync(process.execPath, [join(SERVING, file), ...args], { cwd: SERVING, encoding: 'utf8' });
    const last = out.trim().split('\n').filter(Boolean).pop() ?? '';
    console.log(`${String(Math.round((Date.now() - started) / 1000)).padStart(3)}s  ${last.slice(0, 78)}`);
  } catch (e) {
    console.log('FAILED');
    console.log((String(e.stdout ?? '') + String(e.stderr ?? '')).split('\n').slice(-12).join('\n'));
    process.exit(1);
  }
};

step('fingering', 'tools/finger.mjs');
step('tier reasons', 'tools/record-tier-reasons.mjs');
if (!process.argv.includes('--no-sleeves')) {
  step('sleeves (the missing ones)', 'tools/make-sleeves.mjs');
  step('sleeves into the manifest', 'tools/register-sleeves.mjs');
}

// mirror the files a song touches, then PROVE both copies agree. Byte equality
// is the only claim worth making here: "I copied it" is not one.
const md5 = (p) => createHash('md5').update(readFileSync(p)).digest('hex');
const tracked = ['js/songs-imported.mjs', 'js/songs-fingers.mjs', 'js/tiers-refused.mjs', 'js/art-manifest.mjs', 'sw.js'];
const art = [];
for (const line of readFileSync(join(SERVING, 'js/art-manifest.mjs'), 'utf8').split('\n')) {
  const m = /"([a-z0-9-]+)"\s*:/.exec(line);
  if (m) for (const size of [512, 128]) {
    const rel = `art/${size}/${m[1]}.jpg`;
    if (existsSync(join(SERVING, rel))) art.push(rel);
  }
}
let copied = 0, same = 0;
for (const rel of [...tracked, ...art]) {
  const a = join(SERVING, rel), b = join(BUILD, rel);
  if (!existsSync(a)) continue;
  if (existsSync(b) && md5(a) === md5(b)) { same++; continue; }
  copyFileSync(a, b);
  copied++;
}
const bad = [...tracked, ...art].filter((rel) => existsSync(join(SERVING, rel)) && md5(join(SERVING, rel)) !== md5(join(BUILD, rel)));
console.log(`\nmirrored ${copied} file(s) to the build copy, ${same} already matched`);
if (bad.length) { console.log(`STILL DIFFERENT: ${bad.join(', ')}`); process.exit(1); }
console.log('both copies byte-identical on every song file');
console.log("\nnext: bump VERSION in sw.js, then 'node tools/gates.mjs'");
