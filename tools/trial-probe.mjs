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
  await b.goto('http://localhost:4180/index.html'); await b.ready(); await sleep(700);
};
const visible = () => b.eval(`[...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id.replace('screen-', '')).join(',')`);
const clickText = (label, scope) => b.eval(`(() => { const root = document.querySelector(${JSON.stringify(scope)}); const m = [...root.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim() === ${JSON.stringify(label)} && e.getBoundingClientRect().width > 0); for (const el of m.reverse()) { let c = el; while (c && !(c.tagName === 'BUTTON' || c.style.cursor === 'pointer')) c = c.parentElement; (c || el).click(); return true; } return false; })()`);
const strip = () => b.eval(`(() => { const s = document.getElementById('journey-strip'); const btn = document.getElementById('j-go'); return { hidden: s.hidden, steps: [...s.querySelectorAll('.j-step')].map((x) => x.textContent.trim().replace(/^[^A-Za-z]+/, '') + (x.classList.contains('done') ? '=done' : x.classList.contains('now') ? '=now' : '')), button: btn?.textContent.trim() ?? null }; })()`);
const drawnStrip = () => b.eval(`(() => { const k = [...document.querySelectorAll('#screen-play *')].find((e) => !e.children.length && e.textContent.trim() === 'JOURNEY' && e.getBoundingClientRect().width > 0); if (!k) return null; const row = k.parentElement; return { cells: [...row.children].filter((c) => c.tagName === 'SPAN' && c !== k).map((c) => c.textContent.trim()), next: [...row.querySelectorAll('button')].map((x) => x.textContent.trim() + (x.getBoundingClientRect().width > 0 ? '' : '(hidden)')) }; })()`);
const errs = () => b.eval('window.__errs.splice(0)');

// 1. open the last song: the invitation is there before anything is pressed
await boot(seed());
const primary = await b.eval(`(() => { const p = document.getElementById('practice-primary'); const mod = p?.closest('.practice-prescription'); const tab = document.getElementById('sec-learning'); return {count:document.querySelectorAll('#practice-primary').length, height:p?.getBoundingClientRect().height, before:!!mod && !!tab && !!(mod.compareDocumentPosition(tab) & Node.DOCUMENT_POSITION_FOLLOWING)}; })()`);
ok('one primary practice action precedes browsing with a usable target', primary.count === 1 && primary.height >= 44 && primary.before, JSON.stringify(primary));
await clickText('Resume the session', '#screen-library'); await sleep(1200);
let st = await strip(); let ds = await drawnStrip();
const adjust = await b.eval(`(() => { const d = [...document.querySelectorAll('#screen-play .practice-adjust')].find((d) => d.getBoundingClientRect().width > 0); return !!d && !d.open && d.querySelector('summary').getBoundingClientRect().height >= 44; })()`);
ok('alternate practice modes start behind Adjust practice', adjust);
ok('a song opens with the journey visible', (await visible()) === 'play' && !st.hidden && st.steps.length === 6 && st.steps[0] === 'Hear it=now', JSON.stringify(st));
ok('the drawn strip mirrors six milestones without a competing primary button', !!ds && ds.cells.length === 6 && ds.next.every((x) => x.endsWith('(hidden)')), JSON.stringify(ds));
const guideSize = await b.eval(`(() => {
  const guide = document.getElementById('session-guide'), go = document.getElementById('j-go'), exit = document.getElementById('j-exit');
  const r = guide.getBoundingClientRect(), a = go.getBoundingClientRect(), z = exit.getBoundingClientRect();
  const hit = document.elementFromPoint(a.x + a.width / 2, a.y + a.height / 2);
  return { count: document.querySelectorAll('#session-guide').length, height: r.height,
    go: a.height, exit: z.height, fits: r.right <= innerWidth && r.bottom <= innerHeight,
    hit: hit === go || go.contains(hit), words: document.getElementById('j-instruction').textContent };
})()`);
ok('the controller is drawn, hit-testable and states section, hand, help and pass target', guideSize.count === 1 && guideSize.height > 80 && guideSize.go >= 44 && guideSize.exit >= 44 && guideSize.fits && guideSize.hit && /both hands, help on.*80%/.test(guideSize.words), JSON.stringify(guideSize));
ok('the header states what is in the piece', /D minor/.test(await b.eval(`document.getElementById('cp-sub')?.textContent ?? ''`)) && /3\/4/.test(await b.eval(`document.getElementById('cp-sub')?.textContent ?? ''`)), await b.eval(`document.getElementById('cp-sub')?.textContent`));

// 2. A short listen earns nothing. Actual playback earns listening credit.
await b.eval(`document.getElementById('j-go').click(); true`); await sleep(250);
await b.eval(`document.getElementById('btn-hear').click(); true`); await sleep(250);
st = await strip();
ok('starting then stopping earns no listening rung', st.steps[0] === 'Hear it=now', JSON.stringify(st));
await b.eval(`document.getElementById('j-go').click(); true`);
const listenMs = await b.eval(`(window.__demo.endBeat - window.__demo.startBeat) * window.__demo.msPerBeat()`);
await sleep(listenMs + 1500);
st = await strip();
ok('playback completes the listening rung', st.steps[0] === 'Hear it=done' && st.steps[1] === 'Right hand \u00b7 A=now', JSON.stringify(st.steps));

// 3. rung two, failed: right hand, section A, wait off, nothing played -> the lap fails with an explanation
await b.eval(`document.getElementById('j-go').click(); true`); await sleep(400);
const setup = await b.eval(`({ sec: document.getElementById('section-select').value, wait: document.getElementById('wait-mode').checked, hand: [...document.querySelectorAll('.hand-btn')].find((x) => x.dataset.on === 'true')?.dataset.hand })`);
ok('the rung sets section A, help on, right hand', setup.sec === '0' && setup.wait === true && setup.hand === 'R', JSON.stringify(setup));
await b.eval(`const wm = document.getElementById('wait-mode'); wm.checked = false; wm.dispatchEvent(new Event('change', { bubbles: true })); true`); await sleep(300);
await b.eval(`window.__simNote(60, true); window.__simNote(60, false); true`); await sleep(400); // arms and counts in
await b.eval(`window.__engine.beat = window.__engine.endBeat - 1.5; true`);
let failed = null;
for (let i = 0; i < 30; i++) { await sleep(300); const s2 = await strip(); if (await b.eval(`!!document.getElementById('correction-try')`)) { failed = s2; break; } }
const banner = await b.eval(`window.__falls?.banner ?? ''`);
const correctionCard = await b.eval(`(() => { const c=document.querySelector('.correction-card'); return {text:c?.textContent, sized:c && [...c.querySelectorAll('button')].every(x=>x.getBoundingClientRect().height>=44)}; })()`);
ok('a failed rung keeps the step and offers one measured correction', !!failed && failed.steps[1] === 'Right hand · A=now' && /Missed note|Wrong pitch|Early:|Late:|Short key hold/.test(correctionCard.text) && correctionCard.sized, JSON.stringify(correctionCard));
await b.eval(`document.getElementById('correction-hear').click(); true`); await sleep(300);
const bit = await b.eval(`({start:window.__demo.startBeat,end:window.__demo.endBeat})`);
ok('Hear this bit demonstrates at most two bars', bit.end > bit.start && bit.end-bit.start <= 6, JSON.stringify(bit));
await b.eval(`document.getElementById('correction-try').click(); true`); await sleep(150);
const retryBit = await b.eval(`({start:window.__engine.startBeat,end:window.__engine.endBeat,help:window.__engine.waitMode})`);
ok('Try this bit uses exactly the demonstrated span with help on', retryBit.start===bit.start && retryBit.end===bit.end && retryBit.help, JSON.stringify(retryBit));
for (let i=0;i<180;i++) {
  if (await b.eval(`!!document.getElementById('correction-result')`)) break;
  await b.eval(`(() => { const g=window.__engine.currentGroup(); if (g) for(const n of g.notes) if(!g.done.has(n.m)) {window.__simNote(n.m,true);window.__simNote(n.m,false);} return true; })()`);
  await sleep(100);
}
const comparison = await b.eval(`document.getElementById('correction-result')?.textContent ?? ''`);
ok('the retry compares the same passage and never advances the journey', /before \d+% \(help off\), now \d+% \(help on\)/.test(comparison) && (await strip()).steps[1] === 'Right hand · A=now', comparison);
// The failure above uses an explicit settings override. The next guided attempt
// restores all of its prescribed settings before any notes are accepted.

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
const heldAt = await b.eval('window.__engine.beat');
await sleep(500);
ok('the completed guided attempt pauses instead of silently replaying the old hand', await b.eval('window.__engine.beat') === heldAt);
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
// the reading ladder has a DOOR on the path (Mark: "i thought my path was the lessons but i couldnt find them there")
const door = await b.eval(`(() => { const d = document.getElementById('path-reading'); return d ? { text: d.textContent.trim(), visible: d.getBoundingClientRect().width > 0 } : null; })()`);
ok('My Path shows the reading-lessons door with its count and next title', !!door && door.visible && /Reading lessons · 0 of 13 · next: Middle C/.test(door.text), JSON.stringify(door));
await b.eval(`document.getElementById('path-reading').click(); true`); await sleep(700);
ok('the door opens the Lessons screen', (await visible()) === 'lessons', await visible());
await b.eval(`document.getElementById('btn-path').click(); true`); await sleep(800);
await b.eval(`document.getElementById('path-go').click(); true`); await sleep(800);
ok('Continue opens that lesson', (await visible()) === 'lesson' && /Middle C/.test(await b.eval(`document.getElementById('lesson-title').textContent`)), await visible());
const showme = await b.eval(`(() => { const b2 = document.getElementById('lesson-showme'); const a = document.querySelector('#lesson-video a'); return { showme: !!b2 && b2.getBoundingClientRect().width > 0, link: !!a && a.getBoundingClientRect().width > 0, text: b2?.textContent.trim() }; })()`);
ok('the lesson carries Show me beside the verified video link', showme.showme && showme.link && showme.text === 'Show me', JSON.stringify(showme));
await b.eval(`document.getElementById('lesson-showme').click(); true`); await sleep(600);
ok('Show me lights the worked example on the lesson keyboard', /that is C4/.test(await b.eval(`document.getElementById('lesson-msg').textContent`)), await b.eval(`document.getElementById('lesson-msg').textContent`));
// THE NOTE IS ON THE STAVE (Mark, 2026-09-06: "it felt like notes were meant to show up here and
// weren't"). The lesson stave sits inside the canon column; without its exemption from the
// reset the note head's rx/ry revert to 0 and the learner reads an empty staff.
await b.eval(`document.getElementById('lesson-start').click(); true`); await sleep(1200);
const noteHead = await b.eval(`(() => { const e = document.querySelector('#lesson-stave ellipse'); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), stroke: getComputedStyle(e).stroke, fill: getComputedStyle(e).fill }; })()`);
ok('the drill draws a note head on the lesson stave', !!noteHead && noteHead.w >= 8 && noteHead.h >= 6 && noteHead.stroke !== 'none', JSON.stringify(noteHead));
const hud = await b.eval(`document.getElementById('lesson-phase').textContent`);
ok('the lesson HUD reads as words, not a run-on', /^LEVEL \d+ \/ \d+ · .+ · names (on|off)$/.test(hud), hud);

// 7. a due transfer check is prescribed and launches help-off on the other passage
await boot(seed({ transfers: { [SONG]: { section: 'B, bars 17 to 32', from: 'A, bars 1 to 16', passedAt: Date.now() - 864e5, dueAt: Date.now() - 3600000 } }, lastSession: null }));
await b.eval(`document.getElementById('btn-path').click(); true`); await sleep(800);
const go2 = await b.eval(`document.getElementById('path-go').textContent.trim()`);
ok('My Path prescribes the transfer check', /Play this passage independently/.test(go2), go2);
await b.eval(`document.getElementById('path-go').click(); true`); await sleep(1200);
const tset = await b.eval(`({ screen: [...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id).join(), sec: document.getElementById('section-select').selectedOptions[0]?.textContent, wait: document.getElementById('wait-mode').checked, banner: window.__falls?.banner })`);
ok('legacy unknown exposure launches an independent check without a novelty claim', tset.screen === 'screen-play' && /B, bars 17/.test(tset.sec ?? '') && tset.wait === false && /independent:/.test(tset.banner ?? ''), JSON.stringify(tset));
// Reloaded resumption, including deliberately conflicting legacy settings,
// through the same visible controller on the phone and desktop compositions.
for (const width of [756, 1418]) {
  await b.send('Emulation.setDeviceMetricsOverride', {width, height:900, deviceScaleFactor:1, mobile:false});
  await boot(seed({journeys:{[SONG]:{step:2,guided:true}}, lastSession:{songId:SONG,sec:'1',hand:'R',wait:false,tempo:60,at:Date.now()}}));
  await clickText('Resume the session', '#screen-library'); await sleep(1000);
  const resumed = await b.eval(`(() => {
    const p = document.getElementById('session-guide'), go = document.getElementById('j-go'), exit = document.getElementById('j-exit');
    const a = go.getBoundingClientRect(), z = exit.getBoundingClientRect();
    return { hand:window.__engine.hand, wait:window.__engine.waitMode, tempo:window.__engine.tempo,
      sec:document.getElementById('section-select').value, count:document.querySelectorAll('#session-guide').length,
      instruction:document.getElementById('j-instruction').textContent, exit:exit.textContent,
      fits:p.getBoundingClientRect().right <= innerWidth && z.bottom <= innerHeight,
      sized:a.height >= 44 && z.height >= 44 };
  })()`);
  ok(width + ': reload restores the exact rung with a visible instruction and named exit', resumed.hand === 'L' && resumed.wait && resumed.tempo === 1 && resumed.sec === '0' && resumed.count === 1 && resumed.fits && resumed.sized && /left hand, help on.*70%/.test(resumed.instruction) && /resume at Left hand/.test(resumed.exit), JSON.stringify(resumed));
  // Activate the exit with the keyboard, then prove leaving ends the screen.
  await b.eval(`document.getElementById('j-exit').focus(); true`);
  await b.send('Input.dispatchKeyEvent', {type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await b.send('Input.dispatchKeyEvent', {type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await sleep(400);
  ok(width + ': the named exit works from the keyboard and ends the demo', (await visible()) === 'library' && await b.eval('!window.__falls?.seekable'));
}
// First minute with no physical keyboard, in both target compositions.
await b.send('Page.addScriptToEvaluateOnNewDocument', {source:`Object.defineProperty(navigator,'requestMIDIAccess',{configurable:true,value:async()=>{throw Error('No keyboard in this test');}});`});
for (const [width, experience, expectedHand] of [[756,'new','R'],[1418,'returning','both']]) {
  await b.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await boot({});
  const welcome = await b.eval(`(() => {const f=document.getElementById('firstrun'), c=document.getElementById('firstrun-choice'); return {open:!f.hidden, choice:c.hidden,role:f.getAttribute('role'),target:document.getElementById('firstrun-taps').getBoundingClientRect().height};})()`);
  ok(width+': a fresh player gets a sized, accessible key test before the experience choice', welcome.open && welcome.choice && welcome.role==='dialog' && welcome.target>=44, JSON.stringify(welcome));
  await b.eval(`document.getElementById('firstrun-retry').click(); true`); await sleep(250);
  if (experience === 'new') {
    await b.eval(`document.getElementById('firstrun-taps').focus(); true`);
    await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  } else await b.eval(`window.__simNote(64,true); window.__simNote(64,false); true`);
  const heardKey = await b.eval(`document.getElementById('firstrun-msg').textContent`);
  ok(width+': connection confirmation names the exact key', heardKey.includes(experience==='new'?'C4 received':'E4 received'), heardKey);
  await b.eval(`document.getElementById('firstrun-${experience}').click(); true`); await sleep(1000);
  ok(width+': experience selection opens the phrase, without a diagnostic', (await visible())==='play' && await b.eval(`window.__engine.hand===${JSON.stringify(expectedHand)} && window.__engine.waitMode && window.__engine.endBeat-window.__engine.startBeat===16`));
  await b.eval(`document.getElementById('j-go').click(); true`); await sleep(150);
  const duration = await b.eval(`(window.__demo.endBeat-window.__demo.startBeat)*window.__demo.msPerBeat()`);
  await sleep(duration+1500);
  ok(width+': hearing the real phrase unlocks the attempt', await b.eval(`document.getElementById('j-go').textContent==='Play four bars'`));
  await b.eval(`document.getElementById('j-go').click(); true`);
  const keysSized = await b.eval(`(() => {const keys=[...document.querySelectorAll('.first-phrase-keys button')];return keys.length>0 && keys.every(k=>!k.disabled && k.getBoundingClientRect().height>=44 && k.getAttribute('aria-label').startsWith('Play '));})()`);
  ok(width+': the phrase has named, sized note buttons for keyboard and screen input', keysSized);
  for (let i=0;i<300;i++) {
    if (await b.eval(`document.getElementById('j-go').textContent==='Open library'`)) break;
    await b.eval(`(() => {const g=window.__engine.currentGroup();if(g)for(const n of g.notes)if(!g.done.has(n.m))document.getElementById('first-note-'+n.m)?.click();return true;})()`);
    await sleep(100);
  }
  const result = await b.eval(`({label:document.getElementById('j-go').textContent,words:document.getElementById('j-instruction').textContent,saved:JSON.parse(localStorage.getItem('keys-v1')).firstMinuteResult})`);
  ok(width+': playing screen notes earns a scored first phrase', result.label==='Open library' && result.saved?.accuracy>=70 && /Four bars banked/.test(result.words), JSON.stringify(result));
  await b.eval(`document.getElementById('j-go').click(); true`); await sleep(500);
  ok(width+': the library offers the check-in without opening it', (await visible())==='library' && await b.eval(`/check-in/i.test(document.getElementById('practice-primary')?.textContent ?? '')`));
  await b.goto('http://localhost:4180/index.html'); await b.ready(); await sleep(500);
  ok(width+': a returning player never sees the welcome again', await b.eval(`document.getElementById('firstrun').hidden`));
}
// Recovery through the visible file input, then a full reload.
await boot(seed());
await b.eval(`document.getElementById('recovery-panel').open = true; window.confirm = () => true; true`);
const restoreSeed = {songs:{'fur-elise':{plays:3,ms:180000,best:90,stars:3}},days:['2026-09-01'],
  firstRunDone:true,diagnosticDone:true,calOffsetMs:12,technique:[{t:1,answers:{}}],
  playable:{'fur-elise':{days:['2026-09-01','2026-09-02'],provenAt:1,dueAt:Date.now()+864e5}}};
await b.eval(`(async () => {
  const {exportProgress} = await import('./js/library.mjs');
  const transfer = new DataTransfer();
  transfer.items.add(new File([exportProgress(${JSON.stringify(restoreSeed)})], 'progress.json', {type:'application/json'}));
  const input = document.getElementById('progress-import'); input.files = transfer.files;
  input.dispatchEvent(new Event('change', {bubbles:true})); return true;
})()`);
await sleep(2000); await b.ready();
const restored = await b.eval(`JSON.parse(localStorage.getItem('keys-v1'))`);
ok('file restore survives reload with song proof and technique history', restored.songs?.['fur-elise']?.plays === 3 && restored.playable?.['fur-elise']?.days?.length === 2 && restored.technique?.length === 1 && restored.calOffsetMs === 12, JSON.stringify(restored.songs));
ok('restore retains the previous browser snapshot', await b.eval(`!!localStorage.getItem('keys-v1-before-restore')`));
ok('no errors', !(await errs()).length);

const failedN = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failedN}/${results.length} passed`);
await b.close?.();
process.exit(failedN ? 1 : 0);
