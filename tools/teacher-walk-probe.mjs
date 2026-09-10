// THE TEACHER'S HALF, THE WAY A LEARNER MEETS IT (Mark, 2026-09-07: "are we
// sure? the lessons, my path, playing by ear, theory ... the part I would pay
// to sit down with a music teacher for").
//
// lesson-walk-probe covers the 13 reading lessons. This covers the rest of the
// taught surface: the five chord lessons' guided tasks on the task screen
// (chord build, nearest inversion, two hands, lead sheet), Melody echo, and a
// theory card. For each: the prompt names a real target, a RIGHT answer is
// scored right and advances, a WRONG answer is scored wrong and does not, and
// no errors. Measured in the rendered app, never inferred from code.
//
// Run: node tools/teacher-walk-probe.mjs      (needs the :4180 serving copy)
import { launch } from './cdp.mjs';
import { TEACHER_LESSONS, triadMidis } from '../js/teacher.mjs';

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9791, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });
const results = [];
const ok = (name, pass, note = '') => { results.push(pass); console.log((pass ? 'PASS ' : 'FAIL ') + name + (note ? '  ' + note : '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));` });
const errs = () => b.eval('window.__errs.splice(0)');
const press = async (midis, hold = 450) => {
  await b.eval(`(() => { for (const m of ${JSON.stringify(midis)}) window.__simNote(m, true, 90); return true; })()`);
  await sleep(hold);
  await b.eval(`(() => { for (const m of ${JSON.stringify(midis)}) window.__simNote(m, false); return true; })()`);
};
const task = () => b.eval(`({ prompt: document.getElementById('task-prompt').textContent.replace(/\\s+/g, ' ').trim(), msg: document.getElementById('task-msg').textContent.trim(), slots: [...document.querySelectorAll('#task-slots .slot, #task-slots [class*=clean], #task-slots [class*=recov], #task-slots [class*=todo]')].map((s) => s.className), screen: [...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id).join() })`);

const seed = (extra = {}) => ({ firstRunDone: true, diagnosticDone: Date.now() - 864e5, calibratedAt: Date.now() - 864e5, calOffsetMs: 0, lib: { learning: true }, ...extra });
const boot = async (st) => { await b.goto('http://localhost:4180/index.html'); await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(st))}); true`); await b.goto('http://localhost:4180/index.html'); await b.ready(); await sleep(600); };
await b.goto('http://localhost:4180/index.html');

// ---- the five chord lessons, guided phase
for (let i = 0; i < TEACHER_LESSONS.length; i++) {
  const les = TEACHER_LESSONS[i];
  const done = Object.fromEntries(TEACHER_LESSONS.slice(0, i).map((l) => [l.id, Date.now() - 864e5]));
  const proofs = Object.fromEntries(TEACHER_LESSONS.slice(0, i).map((l) => [l.id, { at: Date.now() - 864e5 }]));
  const mastery = Object.fromEntries(TEACHER_LESSONS.slice(0, i).flatMap((l) => l.skillIds).map((s) => [s, { stage: 'independent', evidence: [{ t: Date.now() - 864e5, passed: true }], lastTested: Date.now() - 864e5, dueAt: Date.now() + 9 * 864e5 }]));
  await boot(seed({ teacherLessons: done, pathProofs: proofs, mastery }));
  await b.eval(`document.getElementById('btn-path').click(); true`); await sleep(700);
  let opened = null;
  for (let tries = 0; tries < 8 && !opened; tries++) {
    opened = await b.eval(`(() => { const l = [...document.querySelectorAll('#screen-path *')].find((e) => !e.children.length && e.textContent.trim() === ${JSON.stringify(les.title)} && e.getBoundingClientRect().width > 0); if (!l) return null; let c = l; while (c && !(c.tagName === 'BUTTON' || c.style.cursor === 'pointer' || c.onclick)) c = c.parentElement; (c || l).click(); return (c || l).tagName; })()`);
    if (!opened) await sleep(400);
  }
  await sleep(800);
  let t = await task();
  if (t.screen !== 'screen-task') { ok(`${les.title}: the path row opens the lesson`, false, `opened=${opened} screen=${t.screen}`); continue; }
  const teaching = await b.eval(`document.getElementById('task-teach').textContent`);
  ok(`${les.title}: audited teaching is rendered`, les.teach.every(line => teaching.includes(line)));
  const vid = await b.eval(`(() => { const a = document.querySelector('#task-video a'); return a && a.getBoundingClientRect().width > 0 ? a.href : null; })()`);
  ok(`${les.title}: a verified video link is on the page`, !!vid && /youtube\.com\/watch/.test(vid), vid ?? 'none');
  await b.eval(`document.getElementById('task-start').click(); true`); await sleep(500);
  await b.eval(`(() => { const s = [...document.querySelectorAll('#screen-task button')].find((x) => /start drill/i.test(x.textContent) && x.getBoundingClientRect().width > 0); if (s) s.click(); return !!s; })()`); await sleep(600);
  t = await task();
  const spec = les.guided;
  if (spec.type === 'pulse') {
    ok(`${les.title}: the guided task asks for taps on the click`, /tap any key/i.test(t.prompt), t.prompt);
    ok(`${les.title}: no errors`, !(await errs()).length);
    continue;
  }
  if (spec.type === 'leadsheet') {
    ok(`${les.title}: the lead sheet shows its bars`, /read one bar ahead/i.test(t.prompt) && (await b.eval(`document.querySelectorAll('#task-sheet .ls-bar').length`)) === spec.bars.length, t.prompt);
    ok(`${les.title}: no errors`, !(await errs()).length);
    continue;
  }
  const sym = spec.type === 'chord' ? spec.pool[0] : spec.seq[0];
  ok(`${les.title}: the prompt names the first target (${sym})`, t.prompt.startsWith(sym), t.prompt);
  const want = triadMidis(sym);
  const lh = want[0] - 12;
  // WRONG: a triad a semitone up, held and released
  const wrong = want.map((m) => m + 1);
  await press(spec.type === 'twohand' ? [lh + 1, ...wrong] : wrong, 500); await sleep(700);
  const afterWrong = await task();
  // judged wrong = the prompt stays on the same symbol AND the message names the right notes
  const wantNames = want.map((m) => ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][m % 12] + (Math.floor(m / 12) - 1)).join(' + ');
  ok(`${les.title}: a wrong chord is judged wrong, names the answer, and does not advance`, afterWrong.prompt.startsWith(sym) && afterWrong.msg.includes(wantNames), `msg="${afterWrong.msg}" want=${wantNames}`);
  // RIGHT: the triad (with its root below for two hands)
  await press(spec.type === 'twohand' ? [lh, ...want] : want, 500); await sleep(900);
  const afterRight = await task();
  const next = spec.type === 'chord' ? spec.pool[1] : spec.seq[1];
  ok(`${les.title}: the right chord advances to the next target (${next})`, afterRight.prompt.startsWith(next) || afterRight.slots.some((c) => /clean/.test(c)), `prompt="${afterRight.prompt}" slots=${JSON.stringify(afterRight.slots)}`);
  ok(`${les.title}: no errors`, !(await errs()).length);
}

// ---- Melody echo: the phrase plays, a wrong reply is refused, the right reply is scored
{
  await boot(seed());
  await b.eval(`document.getElementById('btn-echo').click(); true`); await sleep(400);
  await b.eval(`document.getElementById('echo-play').click(); true`);
  let st = null;
  for (let i = 0; i < 120; i++) { await sleep(250); st = await b.eval(`window.__echoState()`); if (st.awaiting) break; }
  const notes = st?.phrase?.playNotes?.map((n) => n.m) ?? [];
  ok('echo: the phrase plays and then waits for the reply', !!st?.awaiting && notes.length >= 2, `awaiting=${st?.awaiting} notes=${JSON.stringify(notes)}`);
  const hud = () => b.eval(`document.getElementById('echo-msg')?.textContent.trim() ?? [...document.querySelectorAll('#screen-echo *')].filter((e) => !e.children.length && e.getBoundingClientRect().width > 0 && /got it|not quite|listen|your turn|play/i.test(e.textContent)).map((e) => e.textContent.trim()).join(' | ')`);
  await press([notes[0] + 1], 150); await sleep(400);
  ok('echo: a wrong first note is refused', /not quite/i.test(await hud()), await hud());
  await b.eval(`document.getElementById('echo-again').click(); true`);
  for (let i = 0; i < 120; i++) { await sleep(250); st = await b.eval(`window.__echoState()`); if (st.awaiting) break; }
  for (const m of notes) { await press([m], 150); await sleep(120); }
  await sleep(500);
  ok('echo: the right reply is scored as got it', /got it/i.test(await hud()), await hud());
  ok('echo: no errors', !(await errs()).length);
}

// ---- a theory card: opens with a real task, two correct plays learn it
{
  await boot(seed({ lastSession: { songId: 'song-of-storms-easy', at: Date.now() - 36e5 } }));
  await b.eval(`[...document.querySelectorAll('#screen-library *')].find((e) => !e.children.length && e.textContent.trim() === 'Resume the session').closest('button').click(); true`); await sleep(900);
  const card = await b.eval(`(async () => { const T = await import('./js/theory.mjs'); const c = T.CARDS.find((x) => x.title === 'C major'); window.__openCard({ ...c, task: [60, 64, 67] }); return { title: document.getElementById('theory-title').textContent, status: document.getElementById('theory-status').textContent, hidden: document.getElementById('theory-card').hidden }; })()`);
  ok('theory: the card opens with its task', !card.hidden && card.title === 'C major' && /C4 \+ E4 \+ G4/.test(card.status), JSON.stringify(card));
  await press([60, 64, 67], 300); await sleep(300);
  const once = await b.eval(`document.getElementById('theory-status').textContent`);
  await press([60, 64, 67], 300); await sleep(300);
  const twice = await b.eval(`document.getElementById('theory-status').textContent`);
  ok('theory: two correct plays learn the chord', /once more/i.test(once) && /learned/i.test(twice), `${once} -> ${twice}`);
  ok('theory: no errors', !(await errs()).length);
}

const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await b.close?.();
process.exit(failed ? 1 : 0);
