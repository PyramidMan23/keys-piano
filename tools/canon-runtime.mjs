// THE RUNTIME GATE. Everything the pixel overlay cannot see.
//
// The overlay proves the canon MOUNTS identically. Three things happen after
// that which it has no view of, and all three were broken when this file was
// written:
//
//  1. The app renders into the canon and can replace it. Measured properly, by
//     counting what SURVIVED against what was MOUNTED - the earlier version of
//     this counted survivors against whatever was still in the DOM, so deleting
//     most of a screen still scored 100%. Codex caught that; it was a metric
//     that could not fail.
//  2. Ids get grafted at RUNTIME by the binders, so a duplicate-id check at boot
//     reports zero and the app still has eleven of them a second later. That is
//     Rule 3, and duplicates make getElementById return the wrong element.
//  3. A person can be INSIDE a control while the screen re-renders. Typing
//     "fur" into the search box left it reading "" with focus lost, every
//     keystroke, because the re-render replaced the input.
//
// Run: node tools/canon-runtime.mjs
import { launch } from './cdp.mjs';

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
const FLOWS = [
  ['library', null], ['trophies', 'btn-trophies'], ['takes', 'btn-takes'], ['lessons', 'btn-lessons'],
  ['keys12', 'btn-keys12'], ['freeplay', 'btn-freeplay'], ['metronome', 'btn-metronome'],
  ['rhythm', 'btn-rhythm'], ['echo', 'btn-echo'], ['improv', 'btn-improv'],
  ['calibrate', 'btn-calibrate'], ['touch', 'btn-touch'], ['path', 'btn-path'],
];

const dupes = `(() => {
  const seen = {};
  for (const el of document.querySelectorAll('[id]')) seen[el.id] = (seen[el.id] ?? 0) + 1;
  return Object.entries(seen).filter(([, n]) => n > 1).map(([id, n]) => id + ' x' + n);
})()`;

const b = await launch({ width: 900, height: 1700, scale: 1, port: 9530 });
const problems = [];
const rows = [];
try {
  await b.goto('http://localhost:4180/index.html');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  const w = b.watchErrors();
  await b.goto('http://localhost:4180/index.html?canon=1');
  await b.freezeMotion();
  await new Promise((r) => setTimeout(r, 1600));

  // Stamp what the canon MOUNTED. This is the denominator, and it is fixed:
  // an element the app deletes cannot quietly leave the sum.
  const mounted = await b.eval(`(() => {
    const out = {};
    let n = 0;
    for (const host of document.querySelectorAll('.canon-root')) {
      const card = host.firstElementChild;
      if (!card) continue;
      const key = host.id.replace('screen-', '');
      let count = 0;
      for (const el of [card, ...card.querySelectorAll('*')]) { el.dataset.canonStamp = String(n++); count++; }
      out[key] = count;
    }
    return out;
  })()`);

  for (const [screen, control] of FLOWS) {
    if (control) await b.eval(`(() => { const el = document.getElementById('${control}'); if (el) el.click(); return true; })()`);
    else await b.eval(`window.__show && window.__show('library'); true`);
    await new Promise((r) => setTimeout(r, 420));
    const alive = await b.eval(`(() => {
      const host = document.getElementById('screen-${screen}');
      const card = host && host.firstElementChild;
      if (!card) return { alive: 0, lost: [] };
      const all = [card, ...card.querySelectorAll('*')];
      const lost = [];
      for (const el of all) {
        if (el.dataset.canonStamp === undefined) {
          const owner = el.parentElement && el.parentElement.closest('[id]');
          if (owner && !lost.includes(owner.id)) lost.push(owner.id);
        }
      }
      // DISTINCT stamps, because a binder that clones a designed row hands the
      // clone the same stamp, and counting those made the lessons screen report more
      // survivors than it ever mounted.
      const stamps = new Set(all.filter((e) => e.dataset.canonStamp !== undefined).map((e) => e.dataset.canonStamp));
      const foreign = all.filter((e) => e.dataset.canonStamp === undefined).length;
      return { alive: stamps.size, foreign, lost: lost.slice(0, 6) };
    })()`);
    const expected = mounted[screen] ?? 0;
    rows.push({ screen, expected, alive: alive.alive, foreign: alive.foreign, lost: alive.lost });
    const d = await b.eval(dupes);
    if (d.length) problems.push(`duplicate ids after opening ${screen}: ${d.join(', ')}`);
  }

  // typing into the search must not lose the field or its value
  await b.eval(`window.__show && window.__show('library'); true`);
  await new Promise((r) => setTimeout(r, 300));
  await b.eval(`(() => { const s = document.getElementById('lib-search'); if (s) s.focus(); return true; })()`);
  for (const ch of ['f', 'u', 'r']) {
    await b.eval(`(() => { const s = document.getElementById('lib-search');
      if (!s) return false; s.value = (s.value || '') + '${ch}';
      s.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    await new Promise((r) => setTimeout(r, 180));
  }
  const search = await b.eval(`(() => { const s = document.getElementById('lib-search');
    return { value: s ? s.value : 'GONE', focused: !!s && document.activeElement === s }; })()`);
  if (search.value !== 'fur') problems.push(`search lost its value while typing: read ${JSON.stringify(search.value)}, expected "fur"`);
  if (!search.focused) problems.push('search lost focus while typing');

  // accessibility: the artboards carry none of it, so the mount ports the app's
  // semantics across and names what the design labelled only visually. If that
  // stops working, a screen reader gets a page of unlabelled buttons.
  const a11y = await b.eval(`(() => {
    const unnamed = [];
    for (const r of document.querySelectorAll('.canon-root')) {
      const card = r.firstElementChild;
      if (!card) continue;
      for (const c of card.querySelectorAll('button, a, input, select, textarea')) {
        const name = (c.getAttribute('aria-label') || c.textContent || c.getAttribute('title') || c.getAttribute('placeholder') || '').trim();
        if (!name) unnamed.push((c.id || c.tagName.toLowerCase()) + ' in ' + r.id);
      }
    }
    return { unnamed, misses: window.__canonMisses ? [...window.__canonMisses] : [] };
  })()`);
  if (a11y.unnamed.length) problems.push(`controls with no accessible name: ${a11y.unnamed.join(', ')}`);
  if (a11y.misses.length) problems.push(`binders could not find these slots (the design's sample text is still on screen): ${a11y.misses.join(' | ')}`);

  w.stop();
  if (w.errors.length) problems.push(...w.errors.map((e) => 'console: ' + e));
} finally { await b.close(); }

console.log('screen        mounted  survived  app markup   containers the app drew into');
console.log('-'.repeat(78));
let exp = 0, got = 0, alien = 0;
for (const r of rows) {
  exp += r.expected; got += r.alive; alien += r.foreign;
  console.log(`${r.screen.padEnd(13)} ${String(r.expected).padStart(7)}  ${String(r.alive).padStart(8)}  ${String(r.foreign).padStart(10)}   ${r.lost.map((x) => '#' + x).join(' ')}`);
}
console.log('-'.repeat(78));
// The number that matters is APP MARKUP, not survivors. A list with fewer real
// items than the design sampled legitimately has fewer rows, and counting that
// as drift would make the gate cry wolf until it was ignored. An element the
// app DREW ITSELF inside the canon is the actual regression.
console.log(`${got}/${exp} mounted elements still present; ${alien} elements of app markup inside the canon`);
if (alien) problems.push(`${alien} elements of app-generated markup inside the canon`);
console.log(problems.length
  ? `\n${problems.length} RUNTIME PROBLEMS:`
  : '\nno app markup in the canon, no duplicate ids, no console errors, search survives typing');
for (const p of problems) console.log('  ' + p);
process.exit(problems.length ? 1 : 0);
