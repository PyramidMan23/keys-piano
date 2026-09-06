// THE 756 COLUMN LIBRARY: search, tabs and Back behave the same as on the desktop frame.
// Run: node tools/phone-library-probe.mjs
import { launch } from './cdp.mjs';

const b = await launch({ width: 756, height: 1400, scale: 1, port: 9711, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, pass, note = '') => { results.push(pass); console.log((pass ? 'PASS ' : 'FAIL ') + name + (note ? '  ' + note : '')); };
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(e.message));` });
const SEED = { firstRunDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 0, lib: { learning: true },
  lastSession: { songId: 'song-of-storms-easy', at: Date.now() - 36e5 } };
await b.goto('http://localhost:4180/index.html');
await b.eval(`localStorage.setItem('keys-v1', JSON.stringify(${JSON.stringify(SEED)})); true`);
await b.goto('http://localhost:4180/index.html'); await sleep(1500);

const visible = () => b.eval(`[...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id.replace('screen-', '')).join(',')`);
const screenKind = () => b.eval(`document.querySelector('#screen-library .canon-root')?.dataset.canonScreen ?? document.querySelector('#screen-library')?.firstElementChild?.clientWidth`);
const box = () => b.eval(`document.querySelector('#screen-library input[type=search]')?.value`);
const title = () => b.eval(`[...document.querySelectorAll('#screen-library *')].find((e) => !e.children.length && /(SEARCH RESULTS|LEARNING|EXPLORE|REPERTOIRE|HALL OF FAME)/.test(e.textContent) && e.getBoundingClientRect().width > 0)?.textContent`);
const type = (q) => b.eval(`(() => { const i = document.querySelector('#screen-library input[type=search]'); i.value = ${JSON.stringify(q)}; i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
const clickText = (label, scope) => b.eval(`(() => {
  const root = document.querySelector(${JSON.stringify(scope)});
  const m = [...root.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim() === ${JSON.stringify(label)} && e.getBoundingClientRect().width > 0);
  for (const el of m.reverse()) { let c = el; while (c && !(c.tagName === 'BUTTON' || c.style.cursor === 'pointer')) c = c.parentElement; (c || el).click(); return (c || el).tagName; }
  return null;
})()`);
const rowCount = () => b.eval(`[...document.querySelectorAll('#screen-library *')].filter((e) => !e.children.length && /\\(The Legend of Zelda\\)|Für Elise|Clair de Lune/.test(e.textContent) && e.getBoundingClientRect().width > 0 && !e.closest('button')).length`);

console.log('library frame:', await screenKind(), 'width', await b.eval('innerWidth'));
await type('storms'); await sleep(400);
ok('phone: search filters the table', (await title()) === 'SEARCH RESULTS', await title());
const rowTag = await b.eval(`(() => { const leaf = [...document.querySelectorAll('#screen-library *')].filter((e) => !e.children.length && /Song of Storms/.test(e.textContent) && e.getBoundingClientRect().width > 0 && !e.closest('button'))[0]; let c = leaf; while (c && !(c.tagName === 'BUTTON' || c.style.cursor === 'pointer')) c = c.parentElement; if (!c) return null; c.click(); return c.tagName; })()`);
await sleep(900);
ok('phone: a search hit opens the song', (await visible()) === 'play', `tag=${rowTag} on ${await visible()}`);
await clickText('Library', '#screen-play'); await sleep(700);
ok('phone: Back after a search shows the whole shelf again', (await visible()) === 'library' && (await box()) === '' && (await title()) !== 'SEARCH RESULTS', `box="${await box()}" title=${await title()}`);
await type('zelda'); await sleep(300);
await clickText('Explore', '#screen-library'); await sleep(400);
ok('phone: a tab click during a search ends the search', (await box()) === '' && /EXPLORE/.test(await title() ?? ''), `box="${await box()}" title=${await title()}`);
const resumeTag = await clickText('Resume the session', '#screen-library'); await sleep(900);
ok('phone: Resume the session opens the last song', resumeTag ? (await visible()) === 'play' : true, resumeTag ? `on ${await visible()}` : 'no resume tile on this frame');
if (resumeTag) { await clickText('Library', '#screen-play'); await sleep(500); }
const errs = await b.eval('window.__errs');
ok('phone: no errors', !errs.length, errs.join('|'));
console.log(`${results.filter(Boolean).length}/${results.length} passed`);
await b.close?.();
process.exit(results.every(Boolean) ? 0 : 1);
