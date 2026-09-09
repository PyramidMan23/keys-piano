// LEAVING A SCREEN ENDS WHAT THE SCREEN STARTED.
//
// Mark, 2026-09-06: "if we start the training mode, the tick tick, I can't get
// it off." The check-in's click track survived Back, the finished step then
// re-opened the task over the library, and Rhythm tap's four booked bars kept
// clicking over whatever came next. This walks every activity that makes
// sound or holds a timer, leaves it the way a person does (the screen's own
// Library control, or Back), and asserts that NOTHING it started is still
// running afterwards: no clicks, no preview notes, no screen change, no error.
//
// Run: node tools/leave-probe.mjs        (needs the :4180 serving copy)
import { launch } from './cdp.mjs';

// headless Chrome has no user gesture, so the AudioContext would stay suspended
// and its clock frozen: the metronome and the sample player would never schedule
const b = await launch({ width: 1418, height: 900, scale: 1, port: 9701, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });
const results = [];
const ok = (name, pass, note = '') => { results.push({ name, pass, note }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (note ? '  ' + note : '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// count every sound the page schedules, from before the app boots
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.__osc = 0; window.__buf = 0; window.__kills = 0;
  const P = (window.AudioContext || window.webkitAudioContext).prototype;
  const co = P.createOscillator; P.createOscillator = function () { window.__osc++; return co.apply(this, arguments); };
  const cb = P.createBufferSource; P.createBufferSource = function () { window.__buf++; return cb.apply(this, arguments); };
  const os = OscillatorNode.prototype.stop; OscillatorNode.prototype.stop = function (t) { if (t === undefined) window.__kills++; return os.apply(this, arguments); };
  window.__errs = [];
  window.addEventListener('error', (e) => window.__errs.push('ERR ' + e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  window.addEventListener('unhandledrejection', (e) => window.__errs.push('REJ ' + (e.reason && e.reason.message || e.reason)));
` });

const SEED = { firstRunDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 0, lib: { learning: true },
  lastSession: { songId: 'song-of-storms-easy', at: Date.now() - 36e5 } };
await b.goto('http://localhost:4180/index.html');
await b.eval(`localStorage.setItem('keys-v1', JSON.stringify(${JSON.stringify(SEED)})); true`);
const boot = async () => { await b.goto('http://localhost:4180/index.html'); await sleep(1500); };
await boot();
const stateKey = await b.eval(`Object.keys(localStorage).filter((k) => /keys|state/i.test(k)).join(',')`);
console.log('localStorage keys:', stateKey);

const visible = () => b.eval(`[...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id.replace('screen-', '')).join(',')`);
const errs = () => b.eval(`window.__errs.splice(0)`);
// the visible control on the CURRENT screen with this text, the way a person hits it
const clickText = (label, scope = '') => b.eval(`(() => {
  const root = ${scope ? `document.querySelector(${JSON.stringify(scope)})` : 'document'};
  const m = [...root.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim() === ${JSON.stringify(label)} && e.getBoundingClientRect().width > 0);
  for (const el of m.reverse()) { let c = el; while (c && !(c.tagName === 'BUTTON' || c.style.cursor === 'pointer' || c.onclick)) c = c.parentElement; (c || el).click(); return (c || el).tagName; }
  return null;
})()`);
const clickId = (id) => b.eval(`(() => { const e = document.getElementById(${JSON.stringify(id)}); if (!e) return false; e.click(); return true; })()`);
const sounds = () => b.eval(`({ osc: window.__osc, buf: window.__buf, kills: window.__kills })`);
const quiet = async (ms = 2500) => { const a = await sounds(); await sleep(ms); const c = await sounds(); return { osc: c.osc - a.osc, buf: c.buf - a.buf }; };
const leaveVia = async (label, scope) => { const tag = await clickText(label, scope); await sleep(400); return tag; };

// 1. the check-in pulse, Back mid-pulse: no clicks, no screen change, no advance
{
  await clickId('btn-path'); await sleep(400);
  await clickId('path-go'); await sleep(400);
  const title0 = await b.eval(`document.getElementById('task-title').textContent`);
  await clickId('task-start'); await sleep(2000);
  const during = await quiet(1500);
  await clickId('task-back'); await sleep(300);
  const after = await quiet(9000);
  const title1 = await b.eval(`document.getElementById('task-title').textContent`);
  ok('check-in: Back mid-pulse stops the click track', during.osc > 0 && after.osc === 0, `during=${during.osc} after=${after.osc}`);
  ok('check-in: Back mid-pulse does not advance the check-in', title0 === title1 && (await visible()) === 'path', `${title0} -> ${title1} on ${await visible()}`);
  ok('check-in: no errors', !(await errs()).length);
}
// 1b. the same pulse left through the app's other door: the rail's Library on the task screen
{
  await clickId('path-go'); await sleep(400);
  await clickId('task-start'); await sleep(1500);
  await b.eval(`window.__show('library')`); await sleep(300);
  const after = await quiet(6000);
  ok('check-in: leaving to the library stops the click track', after.osc === 0 && (await visible()) === 'library', `after=${after.osc} on ${await visible()}`);
}

// 2. Rhythm tap: four booked bars die with the screen
{
  await clickId('btn-rhythm'); await sleep(400);
  await clickId('rhythm-go'); await sleep(1200);
  const booked = await sounds();
  await leaveVia('Library', '#screen-rhythm');
  const s = await sounds();
  const after = await quiet(2500);
  ok('rhythm: leaving kills the booked clicks', s.kills >= 15 && (await visible()) === 'library', `booked=${booked.osc} killed=${s.kills}`);
  // the HUD timers must not touch the screen either: come back and check the message
  await clickId('btn-rhythm'); await sleep(200);
  const msg0 = await b.eval(`document.getElementById('rhythm-msg').textContent`);
  await sleep(4000);
  const msg1 = await b.eval(`document.getElementById('rhythm-msg').textContent`);
  ok('rhythm: no stale phase message after re-entry', msg0 === msg1, `${msg0} -> ${msg1}`);
  ok('rhythm: no errors', !(await errs()).length);
  await b.eval(`window.__show('library')`);
}

// 3. Metronome: Start, leave, silence
{
  await clickId('btn-metronome'); await sleep(300);
  await clickId('met-toggle'); await sleep(1200);
  const during = await quiet(1000);
  await leaveVia('Library', '#screen-metronome');
  const after = await quiet(2000);
  const label = await b.eval(`document.getElementById('met-toggle').textContent`);
  ok('metronome: leaving stops it', during.osc > 0 && after.osc === 0 && /Start/.test(label), `during=${during.osc} after=${after.osc} label=${label}`);
}

// 4. Play: Hear it, Memorize, Train, Record, Perform, then Library
{
  await b.eval(`window.__show('library'); true`); await sleep(200);
  const resumed = await clickText('Resume the session'); await sleep(900);
  ok('library: Resume the session opens the last song', (await visible()) === 'play' && !!resumed, `tag=${resumed} on ${await visible()}`);
  const title = await b.eval(`[...document.querySelectorAll('#screen-play *')].find((e) => !e.children.length && /Song of Storms/.test(e.textContent))?.textContent.trim()`);
  ok('play: it is the last song', /Song of Storms/.test(title ?? ''), title);
  await clickId('btn-hear'); await sleep(1500);
  const during = await quiet(1000);
  await leaveVia('Library', '#screen-play');
  const after = await quiet(2000);
  ok('play: leaving stops Hear it', during.buf + during.osc > 0 && after.buf + after.osc === 0, `during=${JSON.stringify(during)} after=${JSON.stringify(after)}`);
  // memorize, train, take, perf: each leaves nothing behind on the way out
  for (const [id, label] of [['btn-mem', 'memorize'], ['btn-train', 'train'], ['btn-take', 'record take'], ['btn-perf', 'perform']]) {
    await clickText('Resume the session'); await sleep(700);
    await clickId(id); await sleep(800);
    await leaveVia('Library', '#screen-play');
    const q = await quiet(2500);
    const e = await errs();
    ok(`play: ${label} then Library leaves nothing running`, q.osc === 0 && q.buf === 0 && !e.length && (await visible()) === 'library', `after=${JSON.stringify(q)} errs=${e.join('|')}`);
  }
}

// 5. Echo and Improv
{
  await clickId('btn-echo'); await sleep(300);
  const s0 = await sounds();
  await clickId('echo-play'); await sleep(900);
  const s1 = await sounds();
  const during = { buf: s1.buf - s0.buf };
  await leaveVia('Library', '#screen-echo');
  const after = await quiet(2500);
  const awaiting = await b.eval(`window.__echoState().awaiting`);
  ok('echo: leaving stops the phrase', during.buf > 0 && after.buf === 0 && !awaiting, `during=${during.buf} after=${after.buf} awaiting=${awaiting}`);
  await clickId('btn-improv'); await sleep(300);
  await clickId('improv-go'); await sleep(1500);
  const d2 = await quiet(1500);
  await leaveVia('Library', '#screen-improv');
  const a2 = await quiet(3000);
  ok('improv: leaving stops the backing', d2.buf > 0 && a2.buf === 0, `during=${d2.buf} after=${a2.buf}`);
  ok('echo/improv: no errors', !(await errs()).length);
}

// 6. Lessons: a drill, then Library
{
  await clickId('btn-lessons'); await sleep(400);
  await clickText('Continue here', '#screen-lessons'); await sleep(600);
  const scr = await visible();
  const buttons = await b.eval(`[...document.querySelectorAll('#screen-lesson button')].filter((x) => x.offsetParent).map((x) => (x.id || '') + ':' + x.textContent.trim().slice(0, 24)).join(' | ')`);
  const started = await b.eval(`(() => { const b = [...document.querySelectorAll('#screen-lesson button')].find((x) => x.offsetParent && /start|begin|go|play|hear/i.test(x.textContent)); if (b) { b.click(); return b.textContent.trim(); } return null; })()`);
  console.log('lesson buttons:', buttons);
  await sleep(1500);
  await leaveVia('Back', '#screen-lesson'); await sleep(300); await b.eval(`window.__show('library')`);
  const q = await quiet(2500);
  const e = await errs();
  ok('lesson: drill then Library leaves nothing running', scr === 'lesson' && q.osc === 0 && q.buf === 0 && !e.length && (await visible()) === 'library', `screen=${scr} started=${started} after=${JSON.stringify(q)} errs=${e.join('|')}`);
}

// 7. Failed runs now lead to a correction, with Restart and the named exit.
{
  await clickText('Resume the session'); await sleep(800);
  const finish = async () => {
    await b.eval(`(() => { document.getElementById('section-select').value=''; const wm = document.getElementById('wait-mode'); wm.checked = false; wm.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    await sleep(200);
    await b.eval(`window.__simNote(60, true); window.__simNote(60, false); true`); // arms, one bar counts in
    await sleep(300);
    await b.eval(`window.__engine.beat = window.__engine.endBeat - 2; true`);
    for (let i = 0; i < 40; i++) { await sleep(250); if (await b.eval(`!!document.querySelector('.correction-card')`)) break; }
    return b.eval(`({ shown: (document.querySelector('.correction-card')?.getBoundingClientRect().height ?? 0)>40, finished: window.__engine.finished, beat: window.__engine.beat })`);
  };
  const r1 = await finish();
  ok('play: a failed finished run shows a rendered correction', r1.shown && r1.finished, JSON.stringify(r1));
  await clickText('Restart','#screen-play'); await sleep(500);
  const again = await b.eval(`({ hidden: document.getElementById('results').hidden, beat: window.__engine.beat, finished: window.__engine.finished, screen: [...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id).join() })`);
  ok('play: Restart rebuilds the run from the top', again.hidden && again.beat === 0 && !again.finished && again.screen === 'screen-play', JSON.stringify(again));
  const r2 = await finish();
  ok('play: the second run finishes too', r2.shown && r2.finished, JSON.stringify(r2));
  const beforeHear = await sounds();
  await clickId('correction-hear'); await sleep(700);
  const heard = await sounds();
  await clickId('j-exit'); await sleep(500);
  const silence = await quiet(5000);
  ok('correction: leaving stops its audio and prevents a stale continuation', heard.buf+heard.osc>beforeHear.buf+beforeHear.osc && silence.buf+silence.osc===0 && (await visible())==='library', JSON.stringify(silence));
  const e = await errs();
  ok('play: the named exit lands on the library, clean', (await visible()) === 'library' && (await b.eval(`document.getElementById('results').hidden`)) && !e.length, `on ${await visible()} errs=${e.join('|')}`);
  const resumeSub = await b.eval(`[...document.querySelectorAll('#screen-library *')].find((e) => !e.children.length && e.textContent.trim() === 'Resume the session')?.closest('button')?.textContent`);
  ok('library: the resume tile still names the song', /Song of Storms/.test(resumeSub ?? ''), resumeSub);
}

// 8. The first minute has the same leave contract as the full practice screen.
{
  await b.eval(`localStorage.setItem('keys-v1','{}'); true`); await boot();
  await clickId('firstrun-taps'); await clickId('firstrun-new'); await sleep(500);
  const before = await sounds();
  await clickId('j-go'); await sleep(700);
  const playing = await sounds();
  await clickId('j-exit'); await sleep(400);
  const after = await quiet(14000);
  ok('first minute: leaving cancels the phrase and its deferred completion', playing.buf+playing.osc>before.buf+before.osc && after.buf+after.osc===0 && (await visible())==='library', JSON.stringify(after));
  ok('first minute: no errors after leaving', !(await errs()).length);
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
await b.close?.();
process.exit(failed.length ? 1 : 0);
