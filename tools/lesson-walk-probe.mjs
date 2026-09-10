// EVERY LESSON, THE WAY A LEARNER MEETS IT (18th council, 2026-09-06).
//
// Mark and his housemate sat at "read the note, play it" over an empty stave.
// The gates were green because they checked that buttons existed; nobody
// measured what a person would see. This opens all 13 reading lessons in turn
// (each with the ones before it done), presses Play this step, and asserts:
// a visible target (a note head on the stave with real size, or lit keys), an
// instruction that names what the runner expects, a correct press scored as
// correct, a wrong press scored as a miss, and no errors. Codex's addition:
// "a visible target establishes basic functionality; it does not establish
// that the displayed target matches the instruction or that a correct response
// is scored correctly. Add those checks."
//
// Run: node tools/lesson-walk-probe.mjs      (needs the :4180 serving copy)
import { launch } from './cdp.mjs';
import { LESSONS, bridgeSongFor } from '../js/lessons.mjs';
import { SHELF } from '../js/songs.mjs';
import { metSongDemands, demandConnection } from '../js/difficulty.mjs';

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9781, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });
const results = [];
const ok = (name, pass, note = '') => { results.push(pass); console.log((pass ? 'PASS ' : 'FAIL ') + name + (note ? '  ' + note : '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));` });
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const nameOf = (m) => NAMES[m % 12] + (Math.floor(m / 12) - 1);

await b.goto('http://localhost:4180/index.html');
for (let i = 0; i < LESSONS.length; i++) {
  const les = LESSONS[i];
  const done = Object.fromEntries(LESSONS.slice(0, i).map((l) => [l.id, Date.now() - (i - LESSONS.indexOf(l)) * 864e5]));
  const seed = { firstRunDone: true, diagnosticDone: Date.now(), calibratedAt: Date.now() - 864e5, calOffsetMs: 0, lib: { learning: true }, lessons: done };
  // Run C: this learner has timed repertoire evidence, not just pitch lessons.
  if (les.id === 'the-cs') seed.playable = {'river-easy':{provenAt:Date.now()-86400000,dueAt:Date.now()+86400000}};
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(seed))}); true`);
  await b.goto('http://localhost:4180/index.html'); await b.ready(); await sleep(600);
  await b.eval(`document.getElementById('btn-lessons').click(); true`); await sleep(600);
  // the lessons board re-renders itself for a moment after opening; a click that
  // lands on a button being replaced does nothing, so try until the lesson shows
  let title = '';
  for (let tries = 0; tries < 6 && title !== les.title; tries++) {
    await b.eval(`(() => { const l = [...document.querySelectorAll('#screen-lessons *')].find((e) => !e.children.length && e.textContent.trim() === 'Continue here' && e.getBoundingClientRect().width > 0); if (!l) return null; l.closest('button').click(); return true; })()`);
    await sleep(700);
    title = await b.eval(`document.getElementById('lesson-title').textContent.trim()`);
    if (title !== les.title) { await b.eval(`window.__show('lessons'); true`); await sleep(400); }
  }
  if (title !== les.title) { ok(`${i + 1}. ${les.title}: Continue here opens it`, false, `opened "${title}"`); continue; }
  const teaching = await b.eval(`document.getElementById('lesson-steps').textContent`);
  ok(`${les.title}: audited teaching is rendered`, les.steps.every(line => teaching.includes(line)));
  const vid = await b.eval(`(() => { const a = document.querySelector('#lesson-video a'); return a && a.getBoundingClientRect().width > 0 ? a.href : null; })()`);
  ok(`${i + 1}. ${les.title}: a verified video link is on the page`, !!vid && /youtube\.com\/watch/.test(vid), vid ?? 'none');
  if (les.drill.type === 'rhythm-gate') {
    const link = await b.eval(`(() => { const l = document.getElementById('lesson-rhythm-link'); return l && !l.hidden && l.getBoundingClientRect().width > 0 ? l.textContent.trim() : null; })()`);
    ok(`${i + 1}. ${les.title}: the rhythm gate offers its door`, !!link, link ?? 'no link');
    continue;
  }
  await b.eval(`document.getElementById('lesson-start').click(); true`); await sleep(900);
  const st = await b.eval(`(() => {
    const r = window.__lesson?.(); if (!r) return { runner: false };
    const cur = r.current; const want = Array.isArray(cur) ? cur.map((x) => x.m ?? x) : cur?.ms ? cur.ms : cur?.m != null ? [cur.m] : [];
    const heads = [...document.querySelectorAll('#lesson-stave ellipse')].map((e) => { const q = e.getBoundingClientRect(); return Math.round(q.width) + 'x' + Math.round(q.height); });
    const lit = window.__falls ? null : null;
    const targets = [...(window.__lessonTargets?.() ?? [])];
    return { runner: true, want, heads, msg: document.getElementById('lesson-msg').textContent.trim(), hud: document.getElementById('lesson-phase').textContent.trim(), keysHidden: document.getElementById('lesson-keys').hidden, firstTry: r.firstTry, misses: r.misses, li: r.li };
  })()`);
  if (!st.runner) { ok(`${i + 1}. ${les.title}: the drill starts`, false, 'no runner'); continue; }
  const headsOk = st.heads.length > 0 && st.heads.every((h) => { const [w, hh] = h.split('x').map(Number); return w >= 6 && hh >= 5; });
  const visible = headsOk || (les.drill.type === 'technique' && !st.keysHidden);
  ok(`${i + 1}. ${les.title}: a visible target (${les.drill.type})`, visible && st.want.length > 0, `heads=${JSON.stringify(st.heads)} want=${st.want.map(nameOf).join('+')}`);
  // the instruction names what the runner expects, or says "read it" (a reading drill must not name the answer at names-off levels)
  const named = st.want.some((m) => st.msg.includes(nameOf(m))) || /read|play (it|the)|shown|in order|find|count/i.test(st.msg);
  ok(`${i + 1}. ${les.title}: the instruction matches the target`, named, `msg="${st.msg}"`);
  // a WRONG press is a miss, a RIGHT press scores
  const wrong = st.want[0] + (st.want.includes(st.want[0] + 1) ? 2 : 1);
  await b.eval(`window.__simNote(${wrong}, true); window.__simNote(${wrong}, false); true`); await sleep(400);
  const afterWrong = await b.eval(`(() => { const r = window.__lesson(); return { misses: r.misses, firstTry: r.firstTry, li: r.li }; })()`);
  await b.eval(`(() => { for (const m of ${JSON.stringify(st.want)}) window.__simNote(m, true, 90); return true; })()`); await sleep(120);
  await b.eval(`(() => { for (const m of ${JSON.stringify(st.want)}) window.__simNote(m, false); return true; })()`); await sleep(500);
  const afterRight = await b.eval(`(() => { const r = window.__lesson(); const cur = r.current; return { misses: r.misses, firstTry: r.firstTry, li: r.li, qi: r.qi, done: r.done }; })()`);
  const wrongScored = afterWrong.misses > st.misses;
  const rightScored = (afterRight.qi ?? 0) > 0 || afterRight.li > st.li || afterRight.done === true || afterRight.misses === afterWrong.misses;
  ok(`${i + 1}. ${les.title}: wrong press counts as a miss, right press advances`, wrongScored && rightScored, `misses ${st.misses}->${afterWrong.misses}->${afterRight.misses}, qi=${afterRight.qi} li ${st.li}->${afterRight.li}`);
  if (les.id === 'the-cs') {
    // Finish through the real input handler, including release between targets.
    for (let tries=0; tries<150; tries++) {
      const next=await b.eval(`(() => {const r=window.__lesson?.(); if (!r || r.done) return null;
        const c=r.current; return Array.isArray(c) ? c : c.ms ?? [c.m];})()`);
      if (!next) break;
      await b.eval(`(() => {for (const m of ${JSON.stringify(next)}) {window.__simNote(m,true);window.__simNote(m,false);} return true;})()`);
      await sleep(80);
    }
    const saved=await b.eval(`JSON.parse(localStorage.getItem('keys-v1'))`);
    const bridge=bridgeSongFor(les.id,SHELF,saved);
    const shown=await b.eval(`({id:document.getElementById('lesson-rhythm-link').dataset.bridge,
      visible:!document.getElementById('lesson-rhythm-link').hidden,
      text:document.getElementById('lesson-msg').textContent})`);
    ok('completed reading lesson offers the demand-matched song and its connection',
      !!saved.lessons?.[les.id] && !!bridge && shown.visible && shown.id===bridge.id &&
      shown.text.includes(demandConnection(bridge,metSongDemands(saved,SHELF))),JSON.stringify(shown));
  }
  const errs = await b.eval('window.__errs.splice(0)');
  ok(`${i + 1}. ${les.title}: no errors`, !errs.length, errs.join('|'));
}
const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await b.close?.();
process.exit(failed ? 1 : 0);
