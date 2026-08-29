// Drive the app's REAL flows with the canon mounted, and check the canon's
// slots actually fill.
//
// walk-canon.mjs only SHOWS each screen; most of the app's renderers run when
// you ENTER a screen through its own control. A slot that still reads the
// artboard's sample text after the real flow ran is genuinely unbound, and that
// is the only version of this question worth answering.
//
// Run: node tools/flow-canon.mjs
import { launch } from './cdp.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EX = join(ROOT, 'design', 'extracted');
const sample = {};
for (const f of readdirSync(EX).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(join(EX, f), 'utf8'));
  sample[f.replace('.json', '')] = new Set(d.nodes.filter((n) => n.text).map((n) => n.text));
}

const today = new Date();
const day = (o) => { const d = new Date(today); d.setDate(d.getDate() - o);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [day(0), day(1), day(2), day(4), day(5)],
  pmin: { [day(0)]: 24, [day(1)]: 12, [day(2)]: 31, [day(4)]: 18, [day(5)]: 9 },
  lastSession: { songId: 'fur-elise', at: Date.now() - 36e5 },
  songs: {
    'fur-elise': { plays: 79, stars: 3, best: 96, scorePasses: 2, bestScore: 96 },
    'still-dre-easy': { plays: 22, stars: 3, best: 91, scorePasses: 1, bestScore: 91 },
    'mario-easy': { plays: 5, stars: 1, best: 71, scorePasses: 0, bestScore: 71 },
  },
  lib: { learning: true },
};

// each screen, and the control that REALLY opens it
const FLOWS = [
  ['trophies', 'btn-trophies'], ['takes', 'btn-takes'], ['lessons', 'btn-lessons'],
  ['keys12', 'btn-keys12'], ['freeplay', 'btn-freeplay'], ['metronome', 'btn-metronome'],
  ['rhythm', 'btn-rhythm'], ['echo', 'btn-echo'], ['improv', 'btn-improv'],
  ['calibrate', 'btn-calibrate'], ['touch', 'btn-touch'], ['path', 'btn-path'],
];

const b = await launch({ width: 900, height: 1700, scale: 1, port: 9509 });
const out = [];
try {
  await b.goto('http://localhost:4180/index.html');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  const w = b.watchErrors();
  await b.goto('http://localhost:4180/index.html?canon=1');
  await b.freezeMotion();
  await new Promise((r) => setTimeout(r, 1500));

  for (const [screen, control] of FLOWS) {
    const clicked = await b.eval(`(() => { const el = document.getElementById('${control}');
      if (!el) return 'MISSING CONTROL'; el.click(); return 'ok'; })()`);
    await new Promise((r) => setTimeout(r, 420));
    const seen = await b.eval(`(() => {
      const host = document.getElementById('screen-${screen}');
      const card = host && host.firstElementChild;
      if (!card) return null;
      const on = host.offsetParent !== null || !host.hidden;
      return { on, texts: [...card.querySelectorAll('*')]
        .filter(e => !e.children.length && e.textContent.trim())
        .map(e => ({ t: e.textContent.trim(), id: (e.closest('[id]') || {}).id || null })) };
    })()`);
    if (!seen) { out.push({ screen, clicked, note: 'no canon card' }); continue; }
    const looksLikeData = (t) => /[0-9]/.test(t) || (t.length > 28 && /[a-z]/.test(t));
    const orphans = seen.texts.filter((x) => sample[screen]?.has(x.t) && looksLikeData(x.t));
    out.push({ screen, clicked, on: seen.on, total: seen.texts.length, orphans });
    await b.eval(`window.__show && window.__show('library'); true`);
    await new Promise((r) => setTimeout(r, 160));
  }
  w.stop();
  console.log(`errors during the flows: ${w.errors.length ? w.errors.slice(0, 4).join(' | ') : 'none'}\n`);
} finally { await b.close(); }

console.log('screen        opened via         shown  sample data still unbound');
console.log('-'.repeat(74));
for (const r of out) {
  if (r.note) { console.log(`${r.screen.padEnd(13)} ${r.clicked.padEnd(18)} ${r.note}`); continue; }
  console.log(`${r.screen.padEnd(13)} ${r.clicked.padEnd(18)} ${String(r.total).padStart(5)}  ${r.orphans.length}`);
}
for (const r of out) {
  if (!r.orphans?.length) continue;
  console.log(`\n  ${r.screen}:`);
  for (const x of r.orphans.slice(0, 10)) console.log(`     ${(x.id ? '#' + x.id : '(no id)').padEnd(20)} ${JSON.stringify(x.t.slice(0, 52))}`);
}
