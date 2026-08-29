// Walk every screen in the RUNNING APP with the canon mounted, and report what
// is actually on it.
//
// The overlay proves the markup is the design. It cannot prove the app FILLED
// it: a screen can be pixel-perfect and still be showing the design's sample
// text as if it were the user's data, which is worse than an empty state
// because it reads as real. So this asks a different question of every screen -
// does anything here still say what the artboard said?
//
// Run: node tools/walk-canon.mjs
import { launch } from './cdp.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EX = join(ROOT, 'design', 'extracted');

// the sample strings each artboard shipped with, so we can spot survivors
const sample = {};
for (const f of readdirSync(EX).filter((x) => x.endsWith('.json'))) {
  const key = f.replace('.json', '');
  const d = JSON.parse(readFileSync(join(EX, f), 'utf8'));
  sample[key] = d.nodes.filter((n) => n.text && n.text.length > 3).map((n) => n.text);
}

const today = new Date();
const day = (o) => { const d = new Date(today); d.setDate(d.getDate() - o);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5,
  days: [day(0), day(1), day(2), day(4), day(5)],
  pmin: { [day(0)]: 24, [day(1)]: 12, [day(2)]: 31, [day(4)]: 18, [day(5)]: 9 },
  lastSession: { songId: 'fur-elise', at: Date.now() - 36e5 },
  songs: {
    'fur-elise': { plays: 79, stars: 3, best: 96, scorePasses: 2, bestScore: 96 },
    'still-dre-easy': { plays: 22, stars: 3, best: 91, scorePasses: 1, bestScore: 91 },
    'mario-easy': { plays: 5, stars: 1, best: 71, scorePasses: 0, bestScore: 71 },
    'scale-c-major': { plays: 3, stars: 1, best: 80, scorePasses: 0, bestScore: 80 },
  },
  lib: { learning: true },
};

const b = await launch({ width: 900, height: 1700, scale: 1, port: 9508 });
const rows = [];
try {
  await b.goto('http://localhost:4180/index.html');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  const w = b.watchErrors();
  await b.goto('http://localhost:4180/index.html?canon=1');
  await b.freezeMotion();
  await new Promise((r) => setTimeout(r, 1600));

  const screens = await b.eval(`[...document.querySelectorAll('.screen')].map(s => s.id.replace('screen-',''))`);
  for (const key of screens) {
    await b.eval(`window.__show && window.__show('${key}'); true`);
    await new Promise((r) => setTimeout(r, 320));
    const seen = await b.eval(`(() => {
      const host = document.getElementById('screen-${key}');
      const card = host.firstElementChild;
      if (!card) return null;
      const r = card.getBoundingClientRect();
      return {
        box: Math.round(r.width) + 'x' + Math.round(r.height),
        visible: r.width > 0 && r.height > 0,
        texts: [...card.querySelectorAll('*')].filter(e => !e.children.length && e.textContent.trim() && e.offsetParent !== null)
          .map(e => ({ t: e.textContent.trim(), id: (e.closest('[id]') || {}).id || null })),
      };
    })()`);
    if (!seen) { rows.push({ key, note: 'no canon card' }); continue; }
    // Only flag things that are unmistakably sample DATA. A canon label like
    // "CARRY ON" or "SORT" is meant to survive; a number or a full sentence
    // out of the artboard is the design speaking in the user's place.
    const samples = new Set(sample[key] ?? []);
    const looksLikeData = (t) => /[0-9]/.test(t) || (t.length > 28 && /[a-z]/.test(t));
    const survivors = seen.texts.filter((x) => samples.has(x.t) && looksLikeData(x.t));
    rows.push({ key, box: seen.box, visible: seen.visible, texts: seen.texts.length, survivors });
  }
  w.stop();
  console.log(`errors during the walk: ${w.errors.length ? w.errors.join(' | ') : 'none'}\n`);
} finally { await b.close(); }

console.log('screen        box          shown  sample text still on screen');
console.log('-'.repeat(78));
for (const r of rows) {
  if (r.note) { console.log(`${r.key.padEnd(13)} ${r.note}`); continue; }
  console.log(`${r.key.padEnd(13)} ${String(r.box).padEnd(12)} ${String(r.texts).padStart(5)}  ${r.survivors.length}`);
}
console.log('\nSAMPLE TEXT STILL SHOWING (the design speaking as if it were the user):');
for (const r of rows) {
  if (!r.survivors?.length) continue;
  console.log(`\n  ${r.key} (${r.survivors.length}):`);
  for (const x of r.survivors.slice(0, 14)) console.log(`     ${(x.id ? '#' + x.id : '(no id)').padEnd(20)} ${JSON.stringify(x.t.slice(0, 56))}`);
  if (r.survivors.length > 14) console.log(`     ... and ${r.survivors.length - 14} more`);
}
