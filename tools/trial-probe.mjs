// THE TEN-SESSION TRIAL, DRIVEN (17th council, 2026-09-06).
//
// Every song opens with a journey: Hear it, then one section one hand at a
// time with help on, then a full run, then the proof. This proves the loop the
// way a person meets it: open a song, see the invitation, take the first rung
// (listen), take the second (right hand, section A) and PASS it by playing the
// notes, see the block banked on the library; fail a rung and get one line
// naming the note missed most; get a reading lesson prescribed; get a transfer
// check prescribed and launched help-off. Also: the lesson's Show me button
// exists beside the verified video link.
//
// Run: node tools/trial-probe.mjs        (needs the :4180 serving copy)
import { launch } from './cdp.mjs';

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9741, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });
const results = [];
const ok = (name, pass, note = '') => { results.push({ name, pass }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (note ? '  ' + note : '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));` });
const SONG = 'song-of-storms-easy';
const seed = (extra = {}) => ({ firstRunDone: true, diagnosticDone: Date.now() - 864e5, calibratedAt: Date.now() - 864e5, calOffsetMs: 0, lib: { learning: true }, lastSession: { songId: SONG, at: Date.now() - 36e5 }, ...extra });
const boot = async (st) => {
  await b.goto('http://localhost:4180/index.html');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(st))}); true`);
  await b.goto('http://localhost:4180/index.html'); await sleep(1600);
};
const visible = () => b.eval(`[...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id.replace('screen-', '')).join(',')`);
const clickText = (label, scope) => b.eval(`(() => { const root = document.querySelector(${JSON.stringify(scope)}); const m = [...root.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim() === ${JSON.stringify(label)} && e.getBoundingClientRect().width > 0); for (const el of m.reverse()) { let c = el; while (c && !(c.tagName === 'BUTTON' || c.style.cursor === 'pointer')) c = c.parentElement; (c || el).click(); return true; } return false; })()`);
const strip = () => b.eval(`(() => { const s = document.getElementById('journey-strip'); const btn = document.getElementById('j-go'); return { hidden: s.hidden, steps: [...s.querySelectorAll('.j-step')].map((x) => x.textContent.trim().replace(/^[^A-Za-z]+/, '') + (x.classList.contains('done') ? '=done' : x.classList.contains('now') ? '=now' : '')), button: btn?.textContent.trim() ?? null }; })()`);
const drawnStrip = () => b.eval(`(() => { const k = [...document.querySelectorAll('#screen-play *')].find((e) => !e.children.length && e.textContent.trim() === 'JOURNEY' && e.getBoundingClientRect().width > 0); if (!k) return null; const row = k.parentElement; return { cells: [...row.children].filter((c) => c.tagName === 'SPAN' && c !== k).map((c) => c.textContent.trim()), next: [...row.querySelectorAll('button')].map((x) => x.textContent.trim() + (x.getBoundingClientRect().width > 0 ? '' : '(hidden)')) }; })()`);
const errs = () => b.eval('window.__errs.splice(0)');

// 1. open the last song: the invitation is there before anything is pressed
await boot(seed());
await clickText('Resume the session', '#screen-library'); await sleep(1200);
let st = await strip(); let ds = await drawnStrip();
ok('a song opens with the journey visible', (await visible()) === 'play' && !st.hidden && st.steps.length === 6 && st.steps[0] === 'Hear it=now', JSON.stringify(st));
ok('the DRAWN strip mirrors it and shows a Next step button', !!ds && ds.cells.length === 6 && ds.next.some((x) => x === 'Next step'), JSON.stringify(ds));
ok('the header states what is in the piece', /D minor/.test(await b.eval(`document.getElementById('cp-sub')?.textContent ?? ''`)) && /3\/4/.test(await b.eval(`document.getElementById('cp-sub')?.textContent ?? ''`)), await b.eval(`document.getElementById('cp-sub')?.textContent`));

// 2. rung one: Hear it. Pressing the drawn Next step plays the demo and the rung passes.
await b.eval(`[...document.querySelectorAll('#screen-play button')].find((x) => x.textContent.trim() === 'Next step' && x.getBoundingClientRect().width > 0).click(); true`); await sleep(1200);
st = await strip();
ok('Hear it passes on listening and the strip moves to Right hand · A', st.steps[0] === 'Hear it=done' && st.steps[1] === 'Right hand · A=now', JSON.stringify(st.steps));
await b.eval(`document.getElementById('btn-hear').click(); true`); await sleep(500); // stop the demo

// 3. rung two, failed: right hand, section A, wait off, nothing played -> the lap fails with an explanation
await b.eval(`document.getElementById('j-go').click(); true`); await sleep(400);
const setup = await b.eval(`({ sec: document.getElementById('section-select').value, wait: document.getElementById('wait-mode').checked, hand: [...document.querySelectorAll('.hand-btn')].find((x) => x.dataset.on === 'true')?.dataset.hand })`);
ok('the rung sets section A, help on, right hand', setup.sec === '0' && setup.wait === true && setup.hand === 'R', JSON.stringify(setup));
await b.eval(`const wm = document.getElementById('wait-mode'); wm.checked = false; wm.dispatchEvent(new Event('change', { bubbles: true })); true`); await sleep(300);
await b.eval(`window.__simNote(60, true); window.__simNote(60, false); true`); await sleep(400); // arms and counts in
await b.eval(`window.__engine.beat = window.__engine.endBeat - 1.5; true`);
let failed = null;
for (let i = 0; i < 30; i++) { await sleep(300); const s2 = await strip(); if (/Try again/.test(s2.button ?? '')) { failed = s2; break; } }
const banner = await b.eval(`window.__falls?.banner ?? ''`);
ok('a failed rung keeps the step, says Try again, and names the note missed most', !!failed && /Most missed: [A-G]#?\d/.test(banner) && /Lesson:/.test(banner), `button=${failed?.button} banner=${banner}`);

// 4. rung two, passed: help on, play every right-hand group of section A
await b.eval(`document.getElementById('j-go').click(); true`); await sleep(400);
// help on: the engine accepts only the CURRENT group's notes, and the clock
// runs between groups at the song's tempo, so this plays the way a person
// does: whatever the engine is waiting for, when it is waiting for it
let passed = null;
for (let i = 0; i < 400 && !passed; i++) {
  await b.eval(`(() => { const e = window.__engine; const g = e && e.currentGroup(); if (!g) return 0; const want = g.notes.filter((n) => !g.done.has(n.m)).map((n) => n.m); for (const m of want) window.__simNote(m, true, 90); setTimeout(() => { for (const m of want) window.__simNote(m, false); }, 60); return want.length; })()`);
  await sleep(120);
  const s2 = await strip(); if (s2.steps[1] === 'Right hand · A=done') passed = s2;
}
const blocks = await b.eval(`(JSON.parse(localStorage.getItem('keys-v1')).blocks ?? []).map((x) => x.kind + ':' + x.ref)`);
ok('a passed rung advances the strip and banks a practice block', !!passed && passed.steps[2] === 'Left hand · A=now' && blocks.some((x) => x.startsWith('journey:') && /Right hand/.test(x)), `steps=${JSON.stringify(passed?.steps)} blocks=${JSON.stringify(blocks)}`);
ok('no errors so far', !(await errs()).length);

// 5. the ledger shows on the library
await clickText('Library', '#screen-play'); await sleep(800);
const head = await b.eval(`[...document.querySelectorAll('#screen-library *')].find((e) => !e.children.length && /MIN · \\d+ DAYS? · \\d+ BLOCKS?/.test(e.textContent))?.textContent ?? null`);
ok('the library practice line carries the completed-blocks count', !!head && /· [1-9]\d* BLOCK/.test(head), head);

// 6. the brain prescribes a reading lesson once the chord ladder is ahead
await boot(seed({ teacherLessons: { 'tl-pulse': Date.now() - 864e5 }, pathProofs: { 'tl-pulse': { at: Date.now() - 864e5 } }, mastery: { pulse: { stage: 'independent', evidence: [], lastTested: Date.now() - 864e5, dueAt: Date.now() + 5 * 864e5 } }, lastSession: null }));
await b.eval(`document.getElementById('btn-path').click(); true`); await sleep(800);
const go = await b.eval(`document.getElementById('path-go').textContent.trim()`);
const headline = await b.eval(`document.getElementById('path-reason').textContent`);
ok('My Path prescribes the first reading lesson', /reading/i.test(go) && /Middle C and the grand staff/.test(headline), `go="${go}"`);
await b.eval(`document.getElementById('path-go').click(); true`); await sleep(800);
ok('Continue opens that lesson', (await visible()) === 'lesson' && /Middle C/.test(await b.eval(`document.getElementById('lesson-title').textContent`)), await visible());
const showme = await b.eval(`(() => { const b2 = document.getElementById('lesson-showme'); const a = document.querySelector('#lesson-video a'); return { showme: !!b2 && b2.getBoundingClientRect().width > 0, link: !!a && a.getBoundingClientRect().width > 0, text: b2?.textContent.trim() }; })()`);
ok('the lesson carries Show me beside the verified video link', showme.showme && showme.link && showme.text === 'Show me', JSON.stringify(showme));
await b.eval(`document.getElementById('lesson-showme').click(); true`); await sleep(600);
ok('Show me lights the worked example on the lesson keyboard', /that is C4/.test(await b.eval(`document.getElementById('lesson-msg').textContent`)), await b.eval(`document.getElementById('lesson-msg').textContent`));

// 7. a due transfer check is prescribed and launches help-off on the other passage
await boot(seed({ transfers: { [SONG]: { section: 'B, bars 17 to 32', from: 'A, bars 1 to 16', passedAt: Date.now() - 864e5, dueAt: Date.now() - 3600000 } }, lastSession: null }));
await b.eval(`document.getElementById('btn-path').click(); true`); await sleep(800);
const go2 = await b.eval(`document.getElementById('path-go').textContent.trim()`);
ok('My Path prescribes the transfer check', /Check it holds/.test(go2), go2);
await b.eval(`document.getElementById('path-go').click(); true`); await sleep(1200);
const tset = await b.eval(`({ screen: [...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id).join(), sec: document.getElementById('section-select').selectedOptions[0]?.textContent, wait: document.getElementById('wait-mode').checked, banner: window.__falls?.banner })`);
ok('it launches the undrilled section, help off, with the banner saying so', tset.screen === 'screen-play' && /B, bars 17/.test(tset.sec ?? '') && tset.wait === false && /Transfer check/.test(tset.banner ?? ''), JSON.stringify(tset));
ok('no errors', !(await errs()).length);

const failedN = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failedN}/${results.length} passed`);
await b.close?.();
process.exit(failedN ? 1 : 0);
