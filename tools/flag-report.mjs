// WHERE ARE THE HAND FLAGS, AND WHAT WOULD IT TAKE TO CLEAR THEM?
// Splits the audit's findings by provenance and by whether a guard protects the
// song, so a plan can be costed instead of guessed at.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = join(import.meta.dirname, '..');
const { SONGS } = await import('file:///' + join(ROOT, 'js', 'songs.mjs').replace(/\\/g, '/'));
const byId = new Map(SONGS.map((s) => [s.id, s]));

// ☠️ hand-audit EXITS NON-ZERO when it finds anything, which is its whole job,
// so execFileSync throws and the output arrives on the error rather than the
// return. Reading only the return value gets you a crash and no report.
let audit = '';
try { audit = execFileSync(process.execPath, [join(ROOT, 'tools', 'hand-audit.mjs')], { encoding: 'utf8', maxBuffer: 1 << 26 }); }
catch (e) { audit = String(e.stdout || '') + String(e.stderr || ''); }
const ids = [...new Set((audit.match(/^ {2}[a-z0-9-]+/gm) || []).map((s) => s.trim()))].filter((id) => byId.has(id));

const SUITE = readFileSync(join(ROOT, 'test', 'check.mjs'), 'utf8');
const pinned = (id) => SUITE.includes(`'${id}'`) || SUITE.includes(`"${id}"`);
const authored = new Set(JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `
  import { SONGS } from ${JSON.stringify('file:///' + join(ROOT, 'js', 'songs.mjs').replace(/\\\\/g, '/'))};
  console.log(JSON.stringify(SONGS.filter((s) => s.notes && s.notes.some((n) => n.f)).map((s) => s.id)));
`], { encoding: 'utf8', env: { ...process.env, KEYS_RAW_FINGERS: '1' } })));

const bucket = { transcribed: [], curated: [], protectedAuthored: [], protectedPin: [] };
for (const id of ids) {
  const s = byId.get(id);
  if (authored.has(id)) bucket.protectedAuthored.push(id);
  else if (pinned(id)) bucket.protectedPin.push(id);
  else if (/transcription/i.test(s.source || '')) bucket.transcribed.push(id);
  else bucket.curated.push(id);
}
console.log(`${ids.length} flagged entries`);
console.log(`  transcribed, repairable        ${bucket.transcribed.length}`);
console.log(`  curated, repairable            ${bucket.curated.length}`);
console.log(`  PROTECTED (authored fingering) ${bucket.protectedAuthored.length}  ${bucket.protectedAuthored.slice(0, 8).join(' ')}`);
console.log(`  PROTECTED (suite pin)          ${bucket.protectedPin.length}  ${bucket.protectedPin.slice(0, 8).join(' ')}`);

// per category counts straight from the audit's own headings
console.log('\nby kind:');
for (const line of audit.split('\n').filter((l) => l.startsWith('###'))) console.log('  ' + line.replace(/^###\s*/, ''));

// how bad is the worst roam, and is it a handful of moments or everywhere?
console.log('\nworst roam per flagged song (top 12):');
const roam = (ns, h) => {
  const hn = ns.filter((n) => n.h === h).sort((a, b) => a.b - b.b);
  let w = 0;
  for (let i = 0; i < hn.length; i++) {
    let lo = hn[i].m, hi = hn[i].m;
    for (let j = i + 1; j < hn.length && hn[j].b - hn[i].b <= 1; j++) { lo = Math.min(lo, hn[j].m); hi = Math.max(hi, hn[j].m); }
    w = Math.max(w, hi - lo);
  }
  return w;
};
const worst = ids.map((id) => {
  const s = byId.get(id);
  return { id, w: Math.max(roam(s.notes, 'L'), roam(s.notes, 'R')), n: s.notes.length,
    kind: authored.has(id) ? 'authored' : pinned(id) ? 'pinned' : /transcription/i.test(s.source || '') ? 'transcribed' : 'curated' };
}).sort((a, b) => b.w - a.w);
for (const w of worst.slice(0, 12)) console.log(`  ${w.id.padEnd(28)} ${String(w.w).padStart(3)} semitones  ${w.n} notes  [${w.kind}]`);
