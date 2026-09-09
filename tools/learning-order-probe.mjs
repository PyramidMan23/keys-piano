// THE LEARNING SHELF ORDERS BY TIME IN THE SONG, AND THE CLOCK ACTUALLY RUNS.
//
// Mark, 2026-09-09: "how we make sure that any song I'm learning comes up there
// in the order that I've tried playing or spent the most time in the song comes
// up first". Before this, Learning held only songs with a FINISHED run, weakest
// first, so a song he drilled for twenty minutes and never played end to end
// sat in Explore with no trace. This gate seeds three songs (five minutes with
// no finish, one minute plus two finishes, twenty seconds with no finish),
// reads the RENDERED shelf, then opens a song, lets the engine run, leaves,
// and proves the persisted clock moved.
//
//   node tools/learning-order-probe.mjs
import { launch } from './cdp.mjs';

const b = await launch({ width: 756, height: 1400, scale: 1, port: 9771, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, pass, note = '') => { results.push(!!pass); console.log((pass ? 'PASS ' : 'FAIL ') + name + (note ? '  ' + note : '')); };
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(e.message));` });

const NOW = Date.now();
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: NOW - 864e5, calOffsetMs: 0, days: [], pmin: {},
  lib: { learning: true, canonTab: 'learning' },
  lastSession: { songId: 'song-of-storms-easy', at: NOW - 36e5 },
  songs: {
    'song-of-storms-easy': { plays: 0, stars: 0, best: 0, ms: 300000, lastAt: NOW - 36e5 },   // five minutes, never finished
    'fur-elise':           { plays: 2, stars: 1, best: 70, ms: 60000, lastAt: NOW - 72e5 },   // two finishes, one minute
    'ode-to-joy':          { plays: 0, stars: 0, best: 0, ms: 20000, lastAt: NOW - 18e5 },    // twenty seconds: an accidental launch
  },
};
await b.goto('http://localhost:4180/index.html'); await b.ready();
await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
await b.goto('http://localhost:4180/index.html'); await b.ready(); await sleep(800);

const visible = () => b.eval(`[...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id.replace('screen-', '')).join(',')`);
const header = () => b.eval(`[...document.querySelectorAll('#screen-library *')].find((e) => !e.children.length && /^(LEARNING|SEARCH RESULTS|EXPLORE|REPERTOIRE|HALL OF FAME)/.test(e.textContent.trim()) && e.getBoundingClientRect().width > 0)?.textContent.trim()`);
// the song titles drawn AFTER the shelf header, in document order: the table rows
const rows = () => b.eval(`(() => {
  const h = [...document.querySelectorAll('#screen-library *')].find((e) => !e.children.length && /^LEARNING/.test(e.textContent.trim()) && e.getBoundingClientRect().width > 0);
  if (!h) return null;
  return [...document.querySelectorAll('#screen-library *')]
    .filter((e) => !e.children.length && e.getBoundingClientRect().width > 0 && (h.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING))
    .map((e) => e.textContent.trim())
    .filter((t) => /^(Song of Storms|Für Elise|Ode to Joy)/.test(t))
    .map((t) => t.replace(/\\s*\\(.*$/, ''));
})()`);
const clickText = (label, scope) => b.eval(`(() => { const root = document.querySelector(${JSON.stringify(scope)}); const m = [...root.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim() === ${JSON.stringify(label)} && e.getBoundingClientRect().width > 0); for (const el of m.reverse()) { let c = el; while (c && !(c.tagName === 'BUTTON' || c.style.cursor === 'pointer')) c = c.parentElement; (c || el).click(); return true; } return false; })()`);
const stored = (id) => b.eval(`JSON.parse(localStorage.getItem('keys-v1')).songs[${JSON.stringify(id)}]`);

// 1. the rendered shelf
const h1 = await header();
ok('the header names the order on screen', h1 === 'LEARNING, MOST PLAYED FIRST', JSON.stringify(h1));
const r1 = await rows();
ok('most time in the song leads Learning', r1 && r1[0] === 'Song of Storms', JSON.stringify(r1));
ok('a song with finished runs is still in Learning', r1 && r1.includes('Für Elise'), JSON.stringify(r1));
ok('five minutes with NO finished run is in Learning', r1 && r1.includes('Song of Storms'), JSON.stringify(r1));
ok('twenty seconds (an accidental launch) is NOT in Learning', r1 && !r1.includes('Ode to Joy'), JSON.stringify(r1));
ok('the tab count matches', (await b.eval(`[...document.querySelectorAll('#screen-library *')].some((e) => !e.children.length && e.textContent.trim() === '2')`)), 'no leaf reads 2');

// 2. the clock runs: open the song, let the engine tick, leave, read what persisted
const before = await stored('song-of-storms-easy');
ok('resume tile opens the song', (await clickText('Resume the session', '#screen-library')) && (await (async () => { await sleep(900); return visible(); })()) === 'play', `on ${await visible()}`);
await b.eval(`(() => { const wm = document.getElementById('wait-mode'); if (wm && wm.checked) { wm.checked = false; wm.dispatchEvent(new Event('change', { bubbles: true })); } return true; })()`);
await sleep(200);
await b.eval(`window.__simNote(60, true); window.__simNote(60, false); true`); // arms the run
await sleep(3500);
const ticking = await b.eval(`window.__engine ? Math.round(window.__engine.timeMs) : -1`);
await b.eval(`window.__show('library')`); await sleep(600);
const after = await stored('song-of-storms-easy');
ok('the engine clock ran while the song was open', ticking > 500, `timeMs=${ticking}`);
ok('leaving the song banked its time into the song', after.ms >= before.ms + 1000 && after.ms <= before.ms + ticking + 3000, `ms ${before.ms} -> ${after.ms} (engine ${ticking}, read before leaving)`);
ok('leaving stamped lastAt', after.lastAt > NOW, `lastAt=${after.lastAt}`);
ok('the shelf still leads with it after the visit', (await rows())?.[0] === 'Song of Storms', JSON.stringify(await rows()));
// back in, out again: the same engine must not be banked twice
await clickText('Resume the session', '#screen-library'); await sleep(900);
await b.eval(`window.__show('library')`); await sleep(400);
const again = await stored('song-of-storms-easy');
ok('an unplayed reopen adds nothing (no double count)', again.ms === after.ms, `ms ${after.ms} -> ${again.ms}`);

const errs = await b.eval('window.__errs');
ok('no errors', !errs.length, errs.join('|'));
console.log(`${results.filter(Boolean).length}/${results.length} passed`);
await b.close?.();
process.exit(results.every(Boolean) ? 0 : 1);
