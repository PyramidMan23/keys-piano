// THE WORKLIST. Every outstanding thing Mark has asked for, with a CHECK that
// proves it done. Run it and the answer is a number, not an opinion.
//
// This exists because of a pattern he called out on 2026-08-30: I would find a
// problem, write it up well, and move on to the next thing without fixing it.
// Reporting is not finishing. A prose to-do list lets me do that again; a list
// that checks itself does not, because "done" stops being my judgement.
//
//   node tools/worklist.mjs          check everything
//   node tools/worklist.mjs --fast   skip the checks that need a browser
//
// An item marked NEEDS MARK is blocked on a decision only he can make. Those
// never count against the total, and they must never be used as an excuse to
// stop on the others.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { SONGS } from '../js/songs.mjs';

const ROOT = join(import.meta.dirname, '..');
const fast = process.argv.includes('--fast');
const run = (tool, args = []) => {
  try { return execFileSync(process.execPath, [join(ROOT, 'tools', tool), ...args], { encoding: 'utf8', maxBuffer: 1 << 26 }); }
  catch (e) { return String(e.stdout || '') + String(e.stderr || ''); }
};

const REQUESTED = [
  ['clair-de-lune', 'Clair de Lune'], ['moonlight-sonata', 'Moonlight Sonata'], ['nocturne-op9-2', 'Nocturne Op.9 No.2'],
  ['gymnopedie-1', 'Gymnopedie No.1'], ['fur-elise', 'Fur Elise'], ['consolation-3', 'Consolation No.3'],
  ['bach-prelude-c', 'Prelude in C'], ['pathetique-2', 'Pathetique 2nd mvt'], ['liebestraum-3', 'Liebestraum No.3'],
  ['fantaisie-impromptu', 'Fantaisie-Impromptu'], ['prelude-e-minor', 'Prelude in E minor'],
  ['rach-pc2-2', 'Rachmaninoff PC2 2nd mvt'], ['raindrop-prelude', 'Raindrop Prelude'], ['traumerei', 'Traumerei'],
  ['rondo-alla-turca', 'Rondo alla Turca'], ['arabesque-1', 'Arabesque No.1'], ['goldberg-aria', 'Goldberg Aria'],
  ['mozart-pc21-2', 'Mozart PC21 2nd mvt'], ['un-sospiro', 'Un Sospiro'], ['light-of-the-seven', 'Light of the Seven'],
  ['overwatch', 'Overwatch theme'], ['disney-intro', 'Disney intro'], ['next-episode', 'Dr Dre, The Next Episode'],
  ['x-files', 'X-Files theme'], ['coffin-dance', 'Coffin Dance'], ['never-gonna', 'Never Gonna Give You Up'],
  ['jaws', 'Jaws theme'], ['imperial-march', 'Imperial March'], ['gladiator', 'Gladiator'],
];

const groups = new Set(SONGS.map((s) => s.group ?? s.id));

const ITEMS = [
  {
    id: 'songs',
    what: 'Every song Mark listed is in the app',
    check: () => {
      const missing = REQUESTED.filter(([id]) => !groups.has(id));
      return { ok: !missing.length, detail: missing.length
        ? `${REQUESTED.length - missing.length}/${REQUESTED.length} in. Missing: ${missing.map((m) => m[1]).join(', ')}`
        : `all ${REQUESTED.length} in` };
    },
  },
  {
    id: 'compilation',
    what: 'The 23-song compilation video has been worked through',
    check: () => ({ ok: false, detail: 'never started. https://www.youtube.com/watch?v=ssN7_u08HFY needs its track list read, then each song sourced' }),
  },
  {
    id: 'hands',
    what: 'No song has a hand assignment that would teach the wrong hand',
    check: () => {
      const out = run('hand-audit.mjs');
      const m = out.match(/(\d+) of (\d+) songs have at least one problem/);
      const split = (out.match(/### PROBABLE THRESHOLD SPLIT\s+\((\d+)\)/) || [])[1];
      const bad = m ? Number(m[1]) : -1;
      return { ok: bad === 0, detail: m ? `${bad} of ${m[2]} songs flagged, ${split ?? '?'} of them split by a script` : 'audit did not run' };
    },
  },
  {
    id: 'tiers',
    what: 'Every imported piece has all three tiers, or a recorded reason it cannot',
    check: () => {
      const byGroup = new Map();
      for (const s of SONGS.filter((x) => x.handAssignment === 'generated')) {
        const g = s.group ?? s.id;
        if (!byGroup.has(g)) byGroup.set(g, []);
        byGroup.get(g).push(s.level || 'single');
      }
      const thin = [...byGroup.entries()].filter(([, v]) => v.length < 3);
      return { ok: !thin.length, detail: thin.length
        ? `${thin.length} pieces short of three tiers: ${thin.map(([g, v]) => `${g}[${v.join(',')}]`).join(' ')}`
        : 'all imported pieces have three tiers' };
    },
  },
  {
    id: 'voids',
    what: 'No screen has a large hole in it',
    needsBrowser: true,
    check: () => {
      const out = run('void-check.mjs');
      // ☠️ FAIL CLOSED. `run` swallows a crash and hands back the stack trace as
      // ordinary output, and a stack trace contains no "VOID" lines, so a gate
      // that NEVER RAN was reported green. That is the third outcome every gate
      // has and this one could not express: not clean, not dirty, but "the check
      // did not happen" (Codex found it, 2026-08-31). Demand the summary line
      // void-check prints on every successful run; absence is a failure, not
      // silence meaning consent.
      if (!/screens have no large empty region/.test(out)) {
        return { ok: false, detail: 'void-check DID NOT RUN (no summary line). Output began: ' +
          (out.trim().split('\n')[0] || '(nothing)').slice(0, 120) };
      }
      const bad = [...out.matchAll(/^(\S+)\s+VOID/gm)].map((m) => m[1]);
      return { ok: !bad.length, detail: bad.length ? `${bad.length} screens with a hole: ${bad.join(', ')}` : 'no screen has a hole' };
    },
  },
  {
    id: 'gates',
    what: 'Every gate is green',
    needsBrowser: true,
    check: () => {
      const fails = [];
      const suite = run('../test/check.mjs');
      if (!/ALL GREEN/.test(suite)) fails.push('suite');
      for (const [tool, want] of [['overlay.mjs', /38\/38 screens/], ['canon-journeys.mjs', /30\/30 journeys/],
        ['canon-geometry.mjs', /19\/19 states/], ['canon-samples.mjs', /18\/18 screens/],
        ['score-render-check.mjs', /^PASS/m], ['../test/import-roundtrip.mjs', /survive/]]) {
        if (!want.test(run(tool))) fails.push(tool.replace('../test/', '').replace('.mjs', ''));
      }
      return { ok: !fails.length, detail: fails.length ? `red: ${fails.join(', ')}` : 'all gates green' };
    },
  },
  {
    id: 'friday-night',
    what: '"friday night" identified and added',
    needsMark: true,
    check: () => ({ ok: false, detail: 'Mark said "friday night" mid-flow and I never learned which song he meant' }),
  },
  {
    id: 'form-check',
    what: 'Form check 1-5 rating selects',
    needsMark: true,
    check: () => ({ ok: false, detail: 'proposed before this conversation, never ruled on' }),
  },
];

console.log('THE WORKLIST\n' + '='.repeat(74));
let done = 0, open = 0, blocked = 0;
for (const item of ITEMS) {
  if (fast && item.needsBrowser) { console.log(`  skip  ${item.what}`); continue; }
  const { ok, detail } = item.check();
  const tag = item.needsMark ? 'MARK' : ok ? ' ok ' : 'OPEN';
  if (item.needsMark) blocked++; else if (ok) done++; else open++;
  console.log(`  ${tag}  ${item.what}\n        ${detail}`);
}
console.log('='.repeat(74));
console.log(`${done} done, ${open} still open, ${blocked} waiting on Mark`);
if (open) {
  console.log('\nNot finished. Keep going: fix the next OPEN item, re-run this, repeat until');
  console.log('"still open" is 0. Do not stop to report progress; report once at the end.');
}
process.exit(open ? 1 : 0);
