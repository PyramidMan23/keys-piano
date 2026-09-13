// THE LEARNING WAVE, WALKED THE WAY A PERSON WALKS IT.
//
// Every check here opens a real screen with a real control, plays real notes
// through window.__simNote (the same call the MIDI handler makes for the P-45),
// and then MEASURES the rendered result. Nothing sets a success flag; nothing
// asserts that a button exists and calls that a feature.
//
// That rule is the whole point of this file. On 2026-09-06 every gate in this
// project was green while Mark was reading an empty stave, because the gates
// checked that buttons existed rather than what a person would see.
//
// Run:  node tools/learning-wave-probe.mjs
//       KEYS_TEST_ORIGIN=http://localhost:4193 node tools/learning-wave-probe.mjs
import { launch } from './cdp.mjs';

// Section switch, for iterating on one half without paying for the other.
// The DEFAULT is everything: a bounded run is for editing, not for reporting.
//   node tools/learning-wave-probe.mjs            every check
//   node tools/learning-wave-probe.mjs --quests   the skill quests only
//   node tools/learning-wave-probe.mjs --reading  the reading lane only
const ARGS = new Set(process.argv.slice(2));
const ONLY = ARGS.has('--quests') ? 'quests' : ARGS.has('--reading') ? 'reading' : null;
const want = (section) => !ONLY || ONLY === section;

const ORIGIN = process.env.KEYS_TEST_ORIGIN || 'http://localhost:4180';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, pass, note = '') => {
  results.push({ name, pass, note });
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (note ? '\n       ' + note : ''));
};

const b = await launch({ width: 1400, height: 1000, scale: 1, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });

// count every scheduled sound and every uncaught error, from before boot
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.__osc = 0;
  const P = (window.AudioContext || window.webkitAudioContext).prototype;
  const co = P.createOscillator; P.createOscillator = function () { window.__osc++; return co.apply(this, arguments); };
  const cb = P.createBufferSource; P.createBufferSource = function () { window.__osc++; return cb.apply(this, arguments); };
  window.__errs = [];
  window.addEventListener('error', (e) => window.__errs.push('ERR ' + e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  window.addEventListener('unhandledrejection', (e) => window.__errs.push('REJ ' + (e.reason && e.reason.message || e.reason)));
` });

// A FRESH, SYNTHETIC PROFILE. This never touches Mark's browser storage: the
// cdp launcher makes a throwaway Chrome profile per run, and this seed is the
// minimum that skips the first-run card.
const SEED = { firstRunDone: true, diagnosticDone: Date.now() - 864e5, calOffsetMs: 0, days: [], songs: {} };
await b.goto(ORIGIN + '/index.html');
await b.eval(`localStorage.setItem('keys-v1', JSON.stringify(${JSON.stringify(SEED)})); true`);
const boot = async () => { await b.goto(ORIGIN + '/index.html'); await b.ready(); await sleep(600); };
await boot();

const evalq = (expr) => b.eval(`(() => { try { return ${expr}; } catch (e) { return 'THREW: ' + e.message; } })()`);
const clickId = (id) => b.eval(`(() => { const e = document.getElementById(${JSON.stringify(id)}); if (!e) return false; e.click(); return true; })()`);
const visible = () => b.eval(`[...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id.replace('screen-', '')).join(',')`);
const errs = () => b.eval(`window.__errs.splice(0)`);
const sounds = () => b.eval(`window.__osc`);
const sim = (m, down, vel = 90) => b.eval(`(window.__simNote(${m}, ${down}, ${vel}), true)`);

// Play the engine's own current group, correctly, until the run finishes.
//
// It runs INSIDE the page, on a 16ms timer, because a read is played in real
// time: the clock keeps running between groups even in wait mode, so a
// two-bar exercise at 66bpm takes about seven seconds however fast the notes
// are sent. Pressing early is a wrong note to the engine (it is a wrong note
// to a teacher too), so this presses when the group is due: the moment the
// freeze starts in wait mode, or at the note's own beat when the clock runs.
//
// `wrongFor` lets a check play a deliberately bad read: the pitch played is
// one semitone off for the first N groups.
async function playThrough({ wrongFor = 0, timeout = 30000 } = {}) {
  const outcome = await b.eval(`new Promise((res) => {
    const t0 = Date.now(); let group = 0;
    const step = () => {
      const e = window.__engine;
      if (!e) return res('no engine');
      if (e.finished) return res('finished');
      if (Date.now() - t0 > ${timeout}) return res('timeout at beat ' + e.beat.toFixed(2) + '/' + e.endBeat);
      const g = e.currentGroup();
      if (g) {
        const dueMs = (g.beat - e.beat) * e.msPerBeat();
        if (e.waiting || (!e.waitMode && dueMs <= 16)) {
          const bad = group < ${wrongFor};
          for (const n of g.notes) if (!g.done.has(n.m)) {
            const m = bad ? n.m + 1 : n.m;
            window.__simNote(m, true, 90); window.__simNote(m, false, 90);
          }
          group++;
        }
      }
      setTimeout(step, 16);
    };
    step();
  })`);
  await sleep(600);
  return outcome;
}

// ---------------------------------------------------------------------------
// 1. The reading lane exists, is reachable from the tools rail, and names its
//    two activities. (Entry point, not decoration: the click is the test.)
// ---------------------------------------------------------------------------
if (want('reading'))
{  await clickId('btn-sight');
  await sleep(500);
  const seen = await visible();
  const modes = await b.eval(`[...document.querySelectorAll('#screen-reading .lw-seg button')].map((x) => x.textContent.trim()).join('|')`);
  const facts = await b.eval(`[...document.querySelectorAll('#reading-prep-facts dt')].map((d) => d.textContent).join('|')`);
  const stave = await b.eval(`document.querySelectorAll('#reading-prep-stave svg').length`);
  ok('reading lane opens from the tools rail with both activities named',
    seen === 'reading' && modes === 'Learn mode|First reading', `screen=${seen} modes=${modes}`);
  ok('score preparation states key, meter, novelty and what the read will count as',
    /Key/.test(facts) && /Meter/.test(facts) && /New to you/.test(facts) && /This counts as/.test(facts), facts);
  ok('the preparation score is real engraved notation, not a letter list', stave > 0, `svg elements: ${stave}`);

  // START IS VISIBLE WITHOUT SCROLLING, and the instructions above it are
  // short. The first version put ~70 words and nine metadata rows over the
  // button, so the first thing a learner met was a wall of reasoning.
  const above = await b.eval(`(() => {
    const go = document.getElementById('reading-go').getBoundingClientRect();
    const words = document.getElementById('reading-what').textContent.trim().split(/\\s+/).length;
    const oneLine = document.getElementById('reading-facts-line').textContent.trim();
    const more = document.getElementById('reading-more');
    return { top: Math.round(go.top), h: Math.round(go.height), words,
      lineLen: oneLine.length, rationaleHidden: !more.open,
      conditions: document.getElementById('reading-conditions').textContent }; })()`);
  ok('Start sits in the first screenful, above the score', above.top + above.h < 400, `Start at y=${above.top}`);
  ok('the instruction above Start is two short sentences, not a lecture',
    above.words <= 30, `${above.words} words`);
  ok('the conditions (level, help, hands, tempo) are stated in one line beside Start',
    /help (on|off)/.test(above.conditions) && /tempo/.test(above.conditions), above.conditions);
  ok('the rationale and the pool arithmetic are behind a disclosure, not removed',
    above.rationaleHidden && /Pool/.test(facts), `details open=${!above.rationaleHidden}`);
}

// ---------------------------------------------------------------------------
// 2. GUIDED CLEAN COMPLETION. The reproduced bug: a flawless help-on read
//    scores exactly 80 because wait mode freezes the clock, and the old gate
//    needed 85, so it could never advance. Play one perfectly and check the
//    ladder moved and the panel does NOT print a timing number it never
//    measured.
// ---------------------------------------------------------------------------
if (want('reading'))
{  await clickId('reading-mode-learn');
  await sleep(200);
  await clickId('reading-go');
  await sleep(900);
  const wait = await b.eval(`document.getElementById('wait-mode').checked`);
  const ran = await playThrough();
  ok('the guided read actually reached the end of the exercise', ran === 'finished', String(ran));
  const panel = await b.eval(`({
    shown: !document.getElementById('results').hidden,
    title: document.getElementById('results-title').textContent,
    stats: document.getElementById('results-stats').textContent,
    nudge: document.getElementById('results-nudge').textContent,
  })`);
  const led = await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1')).sight ?? {};
    const last = (s.reads ?? []).at(-1) ?? {};
    return { level: s.level, cleans: s.cleans, reads: (s.reads ?? []).length,
      verdict: last.verdict ?? null, credit: last.independent ?? null }; })()`);
  ok('a guided read runs with help on, as its own activity', wait === true, `wait-mode=${wait}`);
  ok('a flawless GUIDED read is judged clean and banks a read',
    panel.shown && led.reads === 1 && led.verdict === 'clean',
    `verdict=${led.verdict} reads=${led.reads} title=${panel.title}`);
  ok('a guided read never claims independent reading evidence',
    led.credit === false, `independent=${led.credit}`);
  ok('the results panel refuses to print a timing number the frozen clock never measured',
    /not measured/.test(panel.stats) || /not measured/.test(panel.nudge), panel.stats);
}

// ---------------------------------------------------------------------------
// 3. FIRST READING, HELP CONTAMINATION. Start a declared first reading, switch
//    help on partway, finish it, and check the app said so AT THE MOMENT and
//    banked it as guided practice rather than as reading unseen music.
// ---------------------------------------------------------------------------
if (want('reading'))
{  await clickId('btn-sight');
  await sleep(400);
  await clickId('reading-mode-first');
  await sleep(250);
  // read the way a person reads it: the instruction plus the conditions beside
  // the Start button, which is everything visible before pressing it
  const what = await b.eval(`document.getElementById('reading-what').textContent + ' || ' +
    document.getElementById('reading-conditions').textContent`);
  ok('first reading explains that it is one continuous read of unseen music with help off',
    /not seen|never seen/i.test(what) && /help off/i.test(what), what.slice(0, 140));
  await clickId('reading-go');
  await sleep(900);
  const waitOff = await b.eval(`document.getElementById('wait-mode').checked`);
  ok('a declared first reading starts with the clock running', waitOff === false, `wait-mode=${waitOff}`);
  // arm it, play a couple of notes, then reach for help mid-read
  await sim(60, true); await sim(60, false);
  await sleep(400);
  await b.eval(`(() => { const w = document.getElementById('wait-mode'); w.checked = true; w.dispatchEvent(new Event('change')); return true; })()`);
  await sleep(300);
  const said = await b.eval(`document.getElementById('reading-msg').textContent`);
  ok('taking help during a first reading says so at the moment it is taken',
    /help/i.test(said), said);
  await playThrough();
  const last = await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).sight.reads.at(-1)`);
  ok('a contaminated first reading is banked as practice, never as reading unseen music',
    last && last.independent === false && (last.contaminants || []).length > 0,
    `independent=${last?.independent} contaminants=${JSON.stringify(last?.contaminants)}`);
  const evidence = await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).sight.evidence.at(-1)`);
  ok('its evidence row reads back as assisted, in the app\'s existing vocabulary',
    evidence && evidence.assisted === true, JSON.stringify(evidence));
}

// ---------------------------------------------------------------------------
// 4. THE THREE DIMENSIONS ARE SHOWN APART, and each says what it is.
// ---------------------------------------------------------------------------
if (want('reading'))
{  await clickId('btn-sight');
  await sleep(500);
  const rows = await b.eval(`[...document.querySelectorAll('#reading-result-rows .lw-score')].map((r) => ({
    name: r.querySelector('.lw-score-name').textContent,
    val: r.querySelector('.lw-score-val').textContent,
    why: r.querySelector('.lw-score-why').textContent.slice(0, 70) }))`);
  const names = rows.map((r) => r.name).join('|');
  ok('the last first reading reports pitch, rhythm and continuity separately',
    names === 'Pitch|Rhythm|Keeping going', names);
  ok('no composite "reading ability" number is shown anywhere on the panel',
    !/\b\d{1,3}\s*%/.test(rows.map((r) => r.val).join(' ')), JSON.stringify(rows.map((r) => r.val)));
  const prog = await b.eval(`document.getElementById('reading-progress').textContent`);
  ok('reading evidence is reported per level, with the finite pool named',
    /Level 1/.test(prog) && /of 36/.test(prog), prog.slice(0, 120));
}

// ---------------------------------------------------------------------------
// 4b. A TEMPO CHOSEN BEFORE THE READ IS A CONDITION, NOT A PENALTY, and one
//     MOVED DURING IT is what makes the read practice. The two must not be
//     confused: a beginner reading steadily at 60% is reading.
// ---------------------------------------------------------------------------
if (want('reading'))
{  await clickId('btn-sight');
  await sleep(400);
  await clickId('reading-mode-first');
  await b.eval(`(() => { const d = document.getElementById('reading-more'); d.open = true;
    const t = document.getElementById('reading-tempo'); t.value = '60';
    t.dispatchEvent(new Event('change')); return true; })()`);
  await sleep(400);
  const said = await b.eval(`document.getElementById('reading-msg').textContent`);
  const cond = await b.eval(`document.getElementById('reading-conditions').textContent`);
  ok('choosing a slower tempo before the read is named as a condition, not a mistake',
    /not a penalty/i.test(said) && /60% tempo/.test(cond), `${said} | ${cond}`);
  await clickId('reading-go');
  await sleep(900);
  const started = await b.eval(`({ tempo: document.getElementById('tempo').value,
    engineTempo: window.__engine?.tempo, wait: document.getElementById('wait-mode').checked })`);
  ok('the read actually runs at the tempo he chose', started.tempo === '60' && Math.abs(started.engineTempo - 0.6) < 1e-6,
    JSON.stringify(started));
  const ran = await playThrough();
  const last = await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).sight.reads.at(-1)`);
  ok('a clean read at a chosen slow tempo is still reading unseen music',
    ran === 'finished' && last?.independent === true && last?.tempoPct === 60,
    `ran=${ran} independent=${last?.independent} tempoPct=${last?.tempoPct} contaminants=${JSON.stringify(last?.contaminants)}`);
  const panelSays = await b.eval(`document.getElementById('reading-result-evidence').textContent`);
  ok('and the panel records the chosen tempo as a condition of the read',
    /60% of the written tempo/.test(panelSays), panelSays.slice(0, 140));
  // reset the choice so later checks run at the written tempo
  await clickId('btn-sight');
  await sleep(400);
  await b.eval(`(() => { const t = document.getElementById('reading-tempo'); t.value = '100';
    t.dispatchEvent(new Event('change')); return true; })()`);
}

// ---------------------------------------------------------------------------
// 4c. A LOOPED READ CAN NEVER FINISH, so the control that would loop one is
//     not offered. engine.tick REPEATS instead of finishing while `loop &&
//     repeat`, which would have left a learner lapping a bar forever, banking
//     nothing, with nothing on screen to say why. Found by this probe.
// ---------------------------------------------------------------------------
if (want('reading'))
{  await clickId('btn-sight');
  await sleep(400);
  await clickId('reading-go');
  await sleep(900);
  const locked = await b.eval(`['chunk-prev','chunk-label','chunk-next','chunk-size']
    .map((id) => document.getElementById(id).disabled).join(',')`);
  ok('chunk looping is disabled during a read, because a looped run never finishes',
    locked === 'true,true,true,true', locked);
  const others = await b.eval(`({ hear: document.getElementById('btn-hear').disabled,
    falls: document.getElementById('mode-falls').disabled,
    train: document.getElementById('btn-train').disabled,
    tempo: document.getElementById('tempo').disabled,
    wait: document.getElementById('wait-mode').disabled })`);
  ok('help and tempo stay reachable during a read: taking help converts it, it is never blocked',
    others.wait === false && others.tempo === false && others.hear === true,
    JSON.stringify(others));
  await playThrough();
}

// ---------------------------------------------------------------------------
// 4d. AN UNFINISHED READ BANKS NOTHING, in either direction, and a retry of
//     the same music is practice from then on.
// ---------------------------------------------------------------------------
if (want('reading'))
{  await clickId('btn-sight');
  await sleep(400);
  await clickId('reading-mode-first');
  await clickId('reading-go');
  await sleep(800);
  const key = await b.eval(`window.__engine ? (window.__learning ? '' : '') : ''; (window.__engine && window.__engine.song) ? window.__engine.song.contentKey ?? '' : ''`);
  const evBefore = await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).sight.evidence.length`);
  await sim(60, true); await sim(60, false);
  await sleep(700);
  await b.eval(`window.__show('library'); true`);          // walk away mid-read
  await sleep(500);
  const evAfter = await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).sight.evidence.length`);
  ok('abandoning a read banks no evidence at all', evAfter === evBefore,
    `evidence ${evBefore} -> ${evAfter}`);
}

// ---------------------------------------------------------------------------
// 5. LEAVING A SCREEN ENDS WHAT THE SCREEN STARTED. Start a first reading with
//    the pulse on, leave mid-read, and assert silence afterwards.
// ---------------------------------------------------------------------------
if (want('reading'))
{  await clickId('btn-sight');
  await sleep(400);
  await clickId('reading-mode-first');
  await clickId('reading-go');
  await sleep(700);
  await sim(60, true); await sim(60, false);      // arms the count-in and the pulse
  await sleep(1200);
  await b.eval(`window.__show('library'); true`);
  await sleep(400);
  const before = await sounds();
  await sleep(2500);
  const after = await sounds();
  ok('leaving a reading mid-run leaves nothing clicking', after - before === 0,
    `${after - before} sounds scheduled in 2.5s after leaving`);
}

// ---------------------------------------------------------------------------
// 6. PROGRESS SURVIVES A RELOAD, and nothing is invented on the way through.
// ---------------------------------------------------------------------------
if (want('reading'))
{  const beforeState = await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1')).sight;
    return { level: s.level, reads: s.reads.length, evidence: s.evidence.length, xp: JSON.parse(localStorage.getItem('keys-v1')).xpTotal ?? 0 }; })()`);
  await boot();
  await clickId('btn-sight');
  await sleep(600);
  const afterState = await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1')).sight;
    return { level: s.level, reads: s.reads.length, evidence: s.evidence.length, xp: JSON.parse(localStorage.getItem('keys-v1')).xpTotal ?? 0 }; })()`);
  ok('reading progress survives a reload unchanged',
    JSON.stringify(beforeState) === JSON.stringify(afterState),
    `${JSON.stringify(beforeState)} -> ${JSON.stringify(afterState)}`);
  // THE INVARIANT, not a fixed count: a read is independent only if it was
  // unhelped, uninterrupted and covered the whole exercise. The guided read,
  // the help-toggled read and the abandoned read above must each fail it, and
  // a reload must not flip any of them.
  const reads = await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).sight.reads.map((r) => ({ i: r.independent, f: r.scopeFull, c: r.contaminants.length, m: r.mode, d: r.completed }))`);
  const bad = reads.filter((r) => r.i && (r.c > 0 || r.f === false || r.m !== 'independent' || r.d !== true));
  const helped = reads.filter((r) => r.c > 0 && r.i);
  ok('every independent read is unhelped, uninterrupted and whole; every helped one is not',
    bad.length === 0 && helped.length === 0 && reads.some((r) => r.i) && reads.some((r) => !r.i),
    `${reads.filter((r) => r.i).length} independent of ${reads.length}: ${JSON.stringify(reads)}`);
}

// ---------------------------------------------------------------------------
// 7. MIGRATION. An old {level,cleans,flops,done} ledger keeps its level and its
//    read count and gains no evidence it never earned.
// ---------------------------------------------------------------------------
if (want('reading'))
{  await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1'));
    s.sight = { level: 3, cleans: 1, flops: 0, done: 12 };
    localStorage.setItem('keys-v1', JSON.stringify(s)); return true; })()`);
  await boot();
  await clickId('btn-sight');
  await sleep(700);
  const mig = await b.eval(`(() => { const t = document.getElementById('reading-progress-note').textContent;
    const facts = [...document.querySelectorAll('#reading-prep-facts dd')].map((d) => d.textContent);
    return { note: t, level: facts[0] }; })()`);
  ok('an older reading ledger keeps its level and says what it cannot claim',
    /^3 of 5/.test(mig.level) && /12 earlier reads/.test(mig.note) && /unknown/.test(mig.note),
    `level="${mig.level}" note="${mig.note}"`);
}

// ---------------------------------------------------------------------------
// 7b. PARTIAL SCOPE IS REAL EVIDENCE AT ITS OWN SCOPE, and it cannot move the
//     whole-exercise ladder. Levels 3-5 carry two-handed kernels, so reading
//     one hand of one is a real learner choice and the only honest way to
//     reach `scopeFull === false`. It runs on a seeded level-3 ledger, after
//     the reload and migration checks, so it disturbs neither.
// ---------------------------------------------------------------------------
if (want('reading'))
{  await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1'));
    s.sight = { level: 3, cleans: 0, flops: 0, done: 0 };
    localStorage.setItem('keys-v1', JSON.stringify(s)); return true; })()`);
  await boot();
  await clickId('btn-sight');
  await sleep(500);
  await clickId('reading-mode-first');
  await sleep(250);
  await clickId('reading-go');
  await sleep(900);
  const before = await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1')).sight;
    return { level: s.level, cleans: s.cleans ?? 0, reads: (s.reads ?? []).length }; })()`);
  const hands = await b.eval(`[...new Set((window.__engine?.groups ?? []).flatMap((g) => g.notes.map((n) => n.h)))].sort().join('')`);
  ok('a level-3 exercise really is two-handed, so one hand of it is a part scope',
    hands === 'LR', `hands=${hands}`);
  await b.eval(`(() => { const btn = [...document.querySelectorAll('.hand-btn')].find((x) => x.dataset.hand === 'R'); btn.click(); return true; })()`);
  await sleep(400);
  const ran = await playThrough();
  const after = await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1')).sight;
    return { level: s.level, cleans: s.cleans ?? 0, reads: (s.reads ?? []).length, last: (s.reads ?? []).at(-1) }; })()`);
  ok('the part-scope read was recorded', ran === 'finished' && after.reads === before.reads + 1,
    `ran=${ran} reads ${before.reads} -> ${after.reads}`);
  ok('changing hands during a read is recorded as a change',
    (after.last?.contaminants ?? []).includes('hand-changed'),
    `contaminants=${JSON.stringify(after.last?.contaminants)}`);
  ok('a part-scope read carries its own scope, never the whole exercise\'s',
    after.last?.scopeFull === false && /hand-R/.test(after.last?.scope ?? ''),
    `scope=${after.last?.scope} scopeFull=${after.last?.scopeFull}`);
  ok('and a part-scope read does not move the whole-exercise level ladder',
    after.level === before.level && after.cleans === before.cleans,
    `level ${before.level} -> ${after.level}, cleans ${before.cleans} -> ${after.cleans}`);
  const panel = await b.eval(`document.getElementById('results-nudge').textContent`);
  const evidence = await b.eval(`document.getElementById('reading-result-evidence').textContent`);
  ok('and both the results card and the reading panel say it was part of the exercise',
    /Part of the exercise only/.test(panel) && /part of the exercise only/i.test(evidence),
    panel.slice(-100));
}

// ---------------------------------------------------------------------------
// 7c. THE PRESENTATION LIFECYCLE. Putting the score on screen is what SPENDS
//     the music; a settings change must not deal new music; and a score that
//     was never drawn must not be spent at all.
// ---------------------------------------------------------------------------
if (want('reading'))
{
  await b.eval(`(() => { const st = JSON.parse(localStorage.getItem('keys-v1'));
    st.sight = { v: 2, level: 1, cleans: 0, flops: 0, done: 0, seen: {}, reads: [], evidence: [], counts: {}, legacy: null };
    st.lib = { ...(st.lib ?? {}), readingHideScore: false, readingTempo: 100, readingMode: 'first' };
    localStorage.setItem('keys-v1', JSON.stringify(st)); return true; })()`);
  await boot();
  await clickId('btn-sight');
  await sleep(900);
  const shown = await b.eval(`(() => { const st = JSON.parse(localStorage.getItem('keys-v1')).sight;
    return { seen: Object.keys(st.seen ?? {}).length,
      line: document.getElementById('reading-facts-line').textContent,
      svg: document.querySelectorAll('#reading-prep-stave svg').length }; })()`);
  ok('drawing the score banks the exposure immediately and saves it',
    shown.svg > 0 && shown.seen === 1, `seen=${shown.seen} svg=${shown.svg}`);

  const before = await b.eval(`(() => ({ line: document.getElementById('reading-facts-line').textContent,
    token: window.__learning.readingPresented()?.token ?? null })) ()`);
  await b.eval(`(() => { const t = document.getElementById('reading-tempo'); t.value = '70';
    t.dispatchEvent(new Event('change')); return true; })()`);
  await sleep(500);
  await clickId('reading-mode-learn');
  await sleep(400);
  await clickId('reading-mode-first');
  await sleep(400);
  const after = await b.eval(`(() => { const st = JSON.parse(localStorage.getItem('keys-v1')).sight;
    return { line: document.getElementById('reading-facts-line').textContent,
      token: window.__learning.readingPresented()?.token ?? null,
      seen: Object.keys(st.seen ?? {}).length,
      cond: document.getElementById('reading-conditions').textContent }; })()`);
  ok('a tempo or mode change redraws the SAME exercise and spends nothing more',
    after.line === before.line && after.token === before.token && after.seen === 1,
    `seen=${after.seen} sameExercise=${after.line === before.line} sameReceipt=${after.token === before.token} "${after.cond}"`);

  await clickId('reading-prep-toggle');
  await sleep(400);
  await clickId('reading-new');
  await sleep(500);
  const hidden = await b.eval(`(() => { const st = JSON.parse(localStorage.getItem('keys-v1')).sight;
    return { seen: Object.keys(st.seen ?? {}).length,
      svg: document.querySelectorAll('#reading-prep-stave svg').length,
      msg: document.getElementById('reading-msg').textContent }; })()`);
  ok('with the score hidden, Another one deals nothing: undrawn music is never spent',
    hidden.svg === 0 && hidden.seen === 1 && /hidden/i.test(hidden.msg),
    `seen=${hidden.seen} svg=${hidden.svg} "${hidden.msg.slice(0, 80)}"`);
  await clickId('reading-prep-toggle');
  await sleep(600);

  const t0 = await b.eval(`window.__learning.readingPresented()?.token ?? null`);
  await b.eval(`window.__show('library'); true`);
  await sleep(400);
  const gone = await b.eval(`window.__learning.readingPresented()`);
  ok('leaving the reading screen without playing abandons the receipt',
    t0 !== null && gone === null, `token ${t0} -> ${JSON.stringify(gone)}`);
}

// ---------------------------------------------------------------------------
// 8. THE LESSONS BOARD carries the route and the three strands, in the canon,
//    with working controls at both widths.
// ---------------------------------------------------------------------------
if (want('reading'))
{  await clickId('btn-lessons');
  await sleep(700);
  const block = await b.eval(`(() => { const r = document.getElementById('lw-block'); if (!r) return null;
    const rect = r.getBoundingClientRect();
    return { inCanon: !!r.closest('.canon-root') && !r.closest('[data-legacy-screen]'),
      w: Math.round(rect.width), h: Math.round(rect.height),
      route: [...r.querySelectorAll('.lw-route-item')].map((x) => x.textContent.slice(0, 34)),
      strands: [...r.querySelectorAll('#lw-strands .lw-score-name')].map((x) => x.textContent).join('|'),
      small: [...r.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().height < 44).length }; })()`);
  ok('the lessons board carries today\'s route, drawn inside the canon board',
    !!block && block.inCanon && block.route.length >= 1 && block.h > 40,
    block ? `w=${block.w} h=${block.h} rows=${block.route.length}` : 'no block');
  ok('reading, repertoire and musical skill are three separate strands',
    block?.strands === 'Reading|Repertoire|Musical skill', block?.strands);
  ok('every control in the block meets the 44px target floor',
    block?.small === 0, `${block?.small} controls under 44px`);
}

// ---------------------------------------------------------------------------
// 9. THE SAME SURFACES AT 390 AND 375, keyboard reachable, nothing overflowing.
// ---------------------------------------------------------------------------
if (want('reading')) for (const width of [390, 375]) {
  await b.send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: false });
  await sleep(300);
  await clickId('btn-sight');
  await sleep(600);
  const narrow = await b.eval(`(() => {
    const s = document.getElementById('screen-reading');
    // A printed score is WIDER than a phone by design and lives in its own
    // horizontal scroller, so anything inside a scrolling ancestor is not an
    // overflow: only things that push the PAGE sideways are.
    const scrolls = (e) => { for (let c = e.parentElement; c && c !== s; c = c.parentElement) {
      const ox = getComputedStyle(c).overflowX; if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true; } return false; };
    const over = [...s.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > ${width} + 1 && !scrolls(e)).length;
    const ctrl = [...s.querySelectorAll('button, input, summary')].filter((e) => e.offsetParent !== null);
    const small = ctrl.filter((e) => e.getBoundingClientRect().height < 44 && e.type !== 'checkbox' && e.type !== 'range').length;
    const focusable = ctrl.filter((e) => e.tabIndex >= 0).length;
    return { over, small, ctrl: ctrl.length, focusable };
  })()`);
  ok(`reading lane fits ${width}px with no overflow and full-size controls`,
    narrow.over === 0 && narrow.small === 0,
    `overflowing=${narrow.over} under-44px=${narrow.small} controls=${narrow.ctrl}`);
  ok(`reading lane is keyboard reachable at ${width}px`,
    narrow.focusable >= 4, `${narrow.focusable} focusable controls`);
}
await b.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false });

// ===========================================================================
// THE SKILL QUESTS (packages 2 to 5).
//
// Every check below plays a rung through window.__simNote, the same call the
// P-45's MIDI handler makes, and then reads what was STORED. None of them sets
// a pass flag, and none of them writes a result into the ledger: the only way
// a rung passes here is by being played.
// ===========================================================================

// Play the live quest rung's own written music, in real time, off its own
// clock. `hold` scales how long each key is held (1 = the written value), and
// `wrong` shifts every pitch a semitone, so the same driver produces a clean
// read, a duration fault or a pitch fault.
const playQuest = (opts = {}) => b.eval(`new Promise((res) => {
  const d0 = window.__quest();
  if (!d0) return res('no quest');
  const st = d0.state;
  if (!st.song) return res('no song');
  const mpb = st.msPerBeat, bu = st.song.beatUnit || 4;
  const hold = ${opts.hold ?? 1}, bump = ${opts.wrong ? 1 : 0};
  const notes = st.song.notes.map((n) => ({ m: n.m + bump,
    on: n.b * (4 / bu) * mpb, off: (n.b + n.d * hold) * (4 / bu) * mpb }));
  const t0 = Date.now(); const fired = new Set();
  const step = () => {
    const d = window.__quest();
    if (!d) return res('gone');
    if (d.phase === 'done') return res('done');
    if (Date.now() - t0 > 35000) return res('timeout in ' + d.phase);
    if (d.phase === 'playing') {
      const now = d.nowMs;
      notes.forEach((n, i) => {
        if (!fired.has('on' + i) && now >= n.on) { fired.add('on' + i); window.__simNote(n.m, true, ${opts.velocity ?? 80}); }
        if (!fired.has('off' + i) && now >= n.off) { fired.add('off' + i); window.__simNote(n.m, false, 0); }
      });
    }
    setTimeout(step, 12);
  };
  step();
})`);

// Play whatever song the PRACTICE SURFACE currently has open, correctly, one
// press per group. Used for the applied cards' play-passage handoff.
const playEngine = (timeout = 60000) => b.eval(`new Promise((res) => {
  const t0 = Date.now(); let lastAt = 0;
  const step = () => {
    const e = window.__engine;
    if (!e) return res('no engine');
    if (e.finished) return res('finished');
    if (Date.now() - t0 > ${timeout}) return res('timeout beat=' + e.beat.toFixed(1) + '/' + e.endBeat + ' idx=' + e.nextGroupIdx);
    const g = e.currentGroup();
    const now = Date.now();
    if (g && now - lastAt > 140) {
      const due = (g.beat - e.beat) * e.msPerBeat();
      // press when the engine is actually waiting for this group, or when its
      // beat has arrived with the clock running. Re-pressed on a cadence rather
      // than once per index, so a press the engine declines cannot deadlock.
      if (e.waiting || (!e.waitMode && due <= 24)) {
        lastAt = now;
        let pend = g.notes.filter((n) => !g.done.has(n.m));
        if (!pend.length) pend = g.notes;      // repeated pitch in one group
        for (const n of pend) window.__simNote(n.m, true, 90);
        setTimeout(() => { for (const n of pend) window.__simNote(n.m, false, 0); }, 70);
      }
    }
    setTimeout(step, 50);
  };
  step();
})`);

const labCard = (id) => b.eval(`JSON.parse(localStorage.getItem('keys-v1')).lab?.cards?.[${JSON.stringify(id)}] ?? null`);
// wait until the count-in is over and the rung is really accepting input
const waitPhase = async (want, ms = 8000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const p = await b.eval(`window.__quest()?.phase ?? null`);
    if (p === want) return true;
    await sleep(120);
  }
  return false;
};
const allKeysUp = () => b.eval(`(() => { for (let m = 21; m <= 108; m++) window.__simNote(m, false, 0); return true; })()`);
const questNow = () => b.eval(`(() => { const d = window.__quest(); return d ? { phase: d.phase, stage: d.state.stage,
  input: d.state.input, outcome: d.record?.outcome ?? null, passed: d.result?.passed ?? null,
  refused: d.record?.refused ?? null, faults: (d.result?.faults ?? []).map((f) => f.kind + '@' + f.bar),
  detail: d.result?.detail ?? [], recovery: d.result?.recovery?.label ?? null,
  assisted: d.result?.assisted ?? null, degraded: d.state.degraded, support: d.state.support } : null; })()`);
const openQuest = (id, stage) => b.eval(`(window.__learning.openQuest(${JSON.stringify(id)}${stage ? ', ' + JSON.stringify(stage) : ''}), true)`);

// ---------------------------------------------------------------------------
// Q1. THE LESSON BOARD LISTS THE WHOLE ROSTER, and one tap opens a card.
// ---------------------------------------------------------------------------
if (want('quests'))
{  await clickId('btn-lessons');
  await sleep(800);
  const block = await b.eval(`(() => { const r = document.getElementById('lw-block'); if (!r) return null;
    return { quests: r.querySelectorAll('.lw-quest-row').length,
      tracks: [...r.querySelectorAll('.lw-quests-count')].map((x) => x.textContent).slice(0, 5),
      next: r.querySelector('.lw-quests-next')?.textContent?.slice(0, 60) ?? null,
      pips: r.querySelector('.lw-quest-pips')?.children.length ?? 0 }; })()`);
  ok('every authored quest is on the lessons board, grouped by track',
    block?.quests === 29 && block.tracks.length >= 4, `${block?.quests} rows, tracks: ${JSON.stringify(block?.tracks?.slice(0, 2))}`);
  ok('each row shows its five rungs as shapes, not a colour alone', block?.pips === 5, `${block?.pips} pips`);
  ok('one concise next action sits above the list', !!block?.next, block?.next ?? 'none');
}

// ---------------------------------------------------------------------------
// Q2. WATCH IT -> WITH HELP -> ON YOUR OWN, played, on the written-rhythm card
//     that the note-values lesson now depends on.
// ---------------------------------------------------------------------------
if (want('quests'))
{  await openQuest('rh-values');
  await sleep(600);
  let q = await questNow();
  ok('a quest opens on its demonstration rung', q?.stage === 'worked' && q.input === 'listen', JSON.stringify(q));
  const stave = await b.eval(`document.querySelectorAll('#quest-stave svg').length`);
  ok('the rung draws real engraved notation', stave > 0, `${stave} svg`);
  await clickId('quest-go');            // play it for me
  await sleep(1200);
  await clickId('quest-go');            // "I have watched it"
  await sleep(700);
  const afterWorked = await labCard('rh-values');
  ok('a demonstration actually completes and is stored (it used to hang forever)',
    !!afterWorked?.stages?.worked, JSON.stringify(afterWorked?.stages ?? null));

  await clickId('quest-next');
  await sleep(700);
  q = await questNow();
  ok('the card advances to the guided rung', q?.stage === 'guided', JSON.stringify(q));
  await clickId('quest-go');
  const guidedRan = await playQuest();
  await sleep(800);
  q = await questNow();
  const guidedCard = await labCard('rh-values');
  ok('a clean guided rung is stored as PRACTICE, and fills the guided rung only',
    guidedRan === 'done' && q.outcome === 'practice' && !!guidedCard.stages.guided?.passedAt &&
    !guidedCard.stages.independent, `${guidedRan} outcome=${q.outcome} stages=${Object.keys(guidedCard.stages)}`);

  await clickId('quest-next');
  await sleep(700);
  q = await questNow();
  ok('and then to the independent rung', q?.stage === 'independent', JSON.stringify(q));
  await clickId('quest-go');
  const indRan = await playQuest();
  await sleep(900);
  q = await questNow();
  const indCard = await labCard('rh-values');
  const xp = await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1'));
    return { total: s.xpTotal ?? 0, keys: Object.keys(s.xpKeys ?? {}) }; })()`);
  ok('a clean unaided rung is stored as independent and pays once',
    indRan === 'done' && q.outcome === 'independent' && !!indCard.stages.independent?.passedAt &&
    xp.keys.filter((k) => k.includes('lab:rh-values')).length === 1,
    `${indRan} outcome=${q.outcome} xpKeys=${JSON.stringify(xp.keys)}`);
}

// ---------------------------------------------------------------------------
// Q3. WRITTEN RHYTHM MEANS DURATIONS AND RESTS, not just onsets. Right notes
//     at the right moments, released far too early, is a FAIL.
// ---------------------------------------------------------------------------
if (want('quests'))
{  await openQuest('rh-values', 'independent');
  await sleep(600);
  await clickId('quest-go');
  const ran = await playQuest({ hold: 0.12 });
  await sleep(900);
  const q = await questNow();
  ok('right onsets with wrong note lengths is a failure, not a near miss',
    ran === 'done' && q.passed === false && q.faults.some((f) => f.startsWith('duration')),
    `${ran} passed=${q.passed} faults=${JSON.stringify(q.faults)}`);
  ok('and the feedback names the note, the beat, and both lengths in milliseconds',
    /held \d+ms; it is written for \d+ms/.test((q.detail ?? []).join(' ')), (q.detail ?? [])[0] ?? 'none');

  // REPAIR IS PLAYED, NOT CLICKED
  const before = (await labCard('rh-values')).recoveries ?? 0;
  const clicked = await b.eval(`(() => { const bs = [...document.querySelectorAll('#quest-teach button')]
    .filter((x) => /Repair/.test(x.textContent)); if (!bs.length) return 'none'; bs[0].click(); return bs[0].textContent; })()`);
  await sleep(600);
  const afterClick = (await labCard('rh-values')).recoveries ?? 0;
  ok('clicking Repair banks nothing: it opens a bar to play, it does not claim one',
    clicked !== 'none' && afterClick === before, `"${clicked}" recoveries ${before} -> ${afterClick}`);
  await clickId('quest-go');
  await playQuest({ hold: 0.12 });
  await sleep(800);
  const afterBad = (await labCard('rh-values')).recoveries ?? 0;
  ok('and playing the repair badly still banks nothing', afterBad === before, `recoveries ${afterBad}`);
  await allKeysUp();
  await clickId('quest-retry');      // a repair that missed is still the repair
  await sleep(500);
  await clickId('quest-go');
  await waitPhase('playing');
  await playQuest({ hold: 1 });
  await sleep(900);
  const afterGood = (await labCard('rh-values')).recoveries ?? 0;
  const rungStillOpen = await b.eval(`(() => { const c = JSON.parse(localStorage.getItem('keys-v1')).lab.cards['rh-values'];
    return c.recoveries; })()`);
  ok('a bar played clean banks exactly one repair, and the rung stays open',
    afterGood === before + 1 && rungStillOpen === before + 1, `recoveries ${before} -> ${afterGood}`);
}

// ---------------------------------------------------------------------------
// Q4. RESTS ARE SILENCE. A key still sounding through a written rest fails on
//     its own fault kind, not as a timing error.
// ---------------------------------------------------------------------------
if (want('quests'))
{  await openQuest('rh-rests', 'independent');
  await sleep(600);
  const stave = await b.eval(`(() => { const svg = document.querySelector('#quest-stave svg');
    return svg ? svg.querySelectorAll('.vf-stavenote, [data-beat]').length : 0; })()`);
  ok('the rests exercise is engraved, rests and all', stave > 0, `${stave} drawn note elements`);
  await clickId('quest-go');
  // hold every note four times its written length: it will run through the rests
  const ran = await playQuest({ hold: 4 });
  await sleep(900);
  const q = await questNow();
  ok('holding a key through a written rest fails as a REST fault',
    ran === 'done' && q.passed === false && q.faults.some((f) => /rest/.test(f)),
    `${ran} passed=${q.passed} faults=${JSON.stringify(q.faults)}`);
  // and the same exercise played correctly passes
  await allKeysUp();
  await clickId('quest-retry');
  await sleep(500);
  await clickId('quest-go');
  await waitPhase('playing');
  const clean = await playQuest({ hold: 1 });
  await sleep(900);
  const q2 = await questNow();
  ok('and the same written rhythm, played with its rests, passes',
    clean === 'done' && q2.passed === true, `${clean} passed=${q2.passed} faults=${JSON.stringify(q2.faults)}`);
}

// ---------------------------------------------------------------------------
// Q5. THE PAGE IS THE AUTHORED ONE, not one re-derived from MIDI. This is the
//     wiring check for js/lab-score.mjs: the generic ScoreView spells from
//     pitch and key, so in C major it prints A sharp where the flats card
//     authored B flat, which is the exact error that card teaches. The
//     renderer's own probe measures its glyph geometry; this one only asks
//     whether the app is drawing the authored page at all.
// ---------------------------------------------------------------------------
if (want('quests'))
{
  await openQuest('nt-flats', 'worked');
  await sleep(800);
  const flat = await b.eval(`(() => { const h = document.getElementById('quest-stave');
    const svg = h.querySelector('svg');
    const authored = window.__quest()?.state.render;
    const cells = (authored?.staves ?? []).flatMap((st) => st.bars).flatMap((bar) => bar.cells);
    return { svg: !!svg, refusal: h.querySelector('[data-lab-score="error"]')?.textContent ?? null,
      aria: svg?.getAttribute('aria-label') ?? '',
      heads: svg ? svg.querySelectorAll('.vf-stavenote').length : 0,
      authoredKeys: cells.flatMap((c) => c.keys ?? []),
      authoredAcc: cells.flatMap((c) => c.accidentals ?? []).filter(Boolean) }; })()`);
  ok('the flats card draws the page it authored, spelled as flats',
    flat.svg && !flat.refusal && /flat/i.test(flat.aria) && !/sharp/i.test(flat.aria) &&
    flat.authoredKeys.some((k) => /b[b]?\//.test(k)) && flat.authoredAcc.includes('b'),
    `aria="${flat.aria}" keys=${JSON.stringify(flat.authoredKeys)} acc=${JSON.stringify(flat.authoredAcc)} refusal=${flat.refusal}`);

  // every authored symbol kind, measured on the drawn page rather than in data
  for (const [id, what, check] of [
    ['nt-naturals', 'natural signs and the accidental carry rule', (d) => d.authoredAcc.includes('n')],
    ['rh-ties', 'ties, drawn as ties', (d) => d.ties > 0],
    ['rh-tie-vs-slur', 'a slur drawn differently from a tie', (d) => d.slurs > 0 || d.ties > 0],
    ['rh-six-eight', 'six-eight with a dotted-quarter beat', (d) => /6\/8/.test(d.aria) && /= 60|=60/.test(d.texts.join(' '))],
    ['rh-triplets', 'triplet brackets', (d) => d.tuplets > 0],
    ['rh-rests', 'rests on the page', (d) => d.rests > 0],
    ['nt-symbols', 'dynamics and articulation marks', (d) => d.marks > 0],
  ]) {
    await openQuest(id, 'worked');
    await sleep(750);
    const d = await b.eval(`(() => { const h = document.getElementById('quest-stave');
      const svg = h.querySelector('svg');
      const r = window.__quest()?.state.render;
      const cells = (r?.staves ?? []).flatMap((st) => st.bars).flatMap((bar) => bar.cells);
      return { svg: !!svg, refusal: h.querySelector('[data-lab-score="error"]')?.textContent ?? null,
        aria: svg?.getAttribute('aria-label') ?? '',
        heads: svg ? svg.querySelectorAll('.vf-stavenote').length : 0,
        ties: svg ? svg.querySelectorAll('.vf-lab-tie').length : 0,
        slurs: svg ? svg.querySelectorAll('.vf-lab-slur').length : 0,
        texts: svg ? [...svg.querySelectorAll('text')].map((t) => t.textContent) : [],
        tuplets: cells.filter((c) => c.tuplet).length,
        rests: cells.filter((c) => c.rest).length,
        marks: (r?.marks ?? []).length,
        authoredAcc: cells.flatMap((c) => c.accidentals ?? []).filter(Boolean) }; })()`);
    ok(`${what} are engraved on the quest page (${id})`,
      d.svg && !d.refusal && d.heads > 0 && check(d),
      `heads=${d.heads} ties=${d.ties} slurs=${d.slurs} tuplets=${d.tuplets} rests=${d.rests} marks=${d.marks} acc=${JSON.stringify(d.authoredAcc)} aria="${d.aria}"`);
  }

  // and nothing is drawn twice: the renderer owns the marks
  await openQuest('nt-symbols', 'worked');
  await sleep(700);
  const dyn = await b.eval(`(() => { const svg = document.querySelector('#quest-stave svg');
    const r = window.__quest()?.state.render;
    const wanted = (r?.marks ?? []).filter((m) => m.kind === 'dynamic').map((m) => m.value);
    const printed = [...svg.querySelectorAll('text')].map((t) => t.textContent.trim());
    return { wanted, hits: wanted.map((w) => printed.filter((t) => t === w).length) }; })()`);
  ok('each authored dynamic is printed exactly once, never twice',
    dyn.wanted.length > 0 && dyn.hits.every((n) => n === 1),
    `wanted=${JSON.stringify(dyn.wanted)} counts=${JSON.stringify(dyn.hits)}`);
}

// ---------------------------------------------------------------------------
// Q6. A HINT IS RECOVERABLE HELP, and it downgrades what the attempt can claim.
// ---------------------------------------------------------------------------
if (want('quests'))
{  await openQuest('rh-pulse', 'independent');
  await sleep(600);
  await clickId('quest-go');
  await waitPhase('playing');
  const hintText = await b.eval(`(() => { const b2 = document.getElementById('quest-hint');
    if (b2.hidden) return 'hidden'; b2.click(); return document.getElementById('quest-msg').textContent; })()`);
  ok('help stays reachable during an assessment rung, and says what it costs',
    /practice/i.test(hintText), hintText.slice(0, 110));
  await playQuest();
  await sleep(900);
  const q = await questNow();
  const card = await labCard('rh-pulse');
  ok('a hinted pass is stored as practice and leaves the independent rung open',
    q.outcome === 'practice' && q.assisted === true && !card.stages?.independent?.passedAt,
    `outcome=${q.outcome} assisted=${q.assisted} refused=${JSON.stringify(q.refused)}`);
  ok('and the refusal is shown to the learner, not swallowed',
    (q.refused ?? []).length > 0 &&
    await b.eval(`[...document.querySelectorAll('#quest-teach .lw-flag')].length > 0`),
    JSON.stringify(q.refused));
}

// ---------------------------------------------------------------------------
// Q7. RETRY IS BOUNDED AND KEEPS ITS COUNT, and a repeated pass cannot pay
//     twice for the same card.
// ---------------------------------------------------------------------------
if (want('quests'))
{  await openQuest('rh-pulse', 'independent');
  await sleep(500);
  await clickId('quest-go');
  await playQuest({ wrong: true });
  await sleep(800);
  const before = await b.eval(`document.getElementById('quest-progress').textContent`);
  await clickId('quest-retry');
  await sleep(500);
  const after = await b.eval(`(() => ({ prog: document.getElementById('quest-progress').textContent,
    retries: window.__quest().state.retries })) ()`);
  ok('a failed rung offers a bounded retry that carries its attempt count',
    after.retries.used === 1 && after.retries.left === after.retries.max - 1,
    `${before} -> ${JSON.stringify(after.retries)}`);
  await clickId('quest-go');
  await playQuest();
  await sleep(900);
  const xpAfterFirst = await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).xpTotal ?? 0`);
  // pass the SAME rung again: no new competence, no new XP
  await openQuest('rh-pulse', 'independent');
  await sleep(500);
  await clickId('quest-go');
  await playQuest();
  await sleep(900);
  const xpAfterSecond = await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).xpTotal ?? 0`);
  ok('repeating a rung already passed pays nothing the second time',
    xpAfterSecond === xpAfterFirst, `${xpAfterFirst} -> ${xpAfterSecond}`);
}

// ---------------------------------------------------------------------------
// Q8. DELAYED RECALL IS A CALENDAR FACT, and transfer needs new material.
//     Prior history is SEEDED (dated stage records only); the rung under test
//     is played for real.
// ---------------------------------------------------------------------------
if (want('quests'))
{  const seed = async (cardId, extra = '') => {
    await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1'));
      const DAY = 86400000, old = Date.now() - 3 * DAY;
      s.lab = s.lab ?? { v: 1, cards: {}, skills: {}, days: {}, clock: {}, route: {} };
      s.lab.cards[${JSON.stringify(cardId)}] = { evidence: [], selfChecks: [], seenContent: [], attempts: 3, recoveries: 0,
        stages: { worked: { at: old }, guided: { passedAt: old },
          independent: { passedAt: old, date: '2026-09-10', outcome: 'independent', assisted: false, contentId: 'seeded' } } ${extra} };
      localStorage.setItem('keys-v1', JSON.stringify(s)); return true; })()`);
    await boot();
  };
  // a recall with no delay behind it cannot claim retention
  await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1'));
    s.lab = s.lab ?? { v: 1, cards: {}, skills: {}, days: {}, clock: {}, route: {} };
    s.lab.cards['rh-eighths'] = { evidence: [], selfChecks: [], seenContent: [], attempts: 2, recoveries: 0,
      stages: { worked: { at: Date.now() }, guided: { passedAt: Date.now() },
        independent: { passedAt: Date.now(), date: new Date().toISOString().slice(0, 10), outcome: 'independent', assisted: false } } };
    localStorage.setItem('keys-v1', JSON.stringify(s)); return true; })()`);
  await boot();
  const tooSoon = await b.eval(`(() => { const L = window.__lab; return null; })()`);
  await openQuest('rh-eighths', 'recall');
  await sleep(600);
  const saidTooSoon = await b.eval(`document.getElementById('quest-teach').textContent`);
  ok('a recall asked for on the same day says it cannot prove a day yet',
    /come back tomorrow|later day/i.test(saidTooSoon), saidTooSoon.slice(0, 130));

  // seeded three days back: the recall is genuinely due, and is PLAYED
  await seed('rh-eighths');
  await openQuest('rh-eighths', 'recall');
  await sleep(700);
  const stage = await questNow();
  await clickId('quest-go');
  const ran = await playQuest();
  await sleep(900);
  const q = await questNow();
  const card = await labCard('rh-eighths');
  ok('a recall played clean a day later is stored as retained, on the recall rung',
    ran === 'done' && stage.stage === 'recall' && q.outcome === 'retained' && !!card.stages.recall?.passedAt,
    `${ran} stage=${stage.stage} outcome=${q.outcome} stages=${Object.keys(card.stages)}`);
  const badges = await b.eval(`(() => { document.getElementById('btn-trophies').click();
    return [...document.querySelectorAll('#trophy-list *')].map((x) => x.textContent).join(' | ').slice(0, 400); })()`);
  ok('and it reaches the existing evidence cabinet in the app\'s own vocabulary',
    /Eighth notes|eighth/i.test(badges), badges.slice(0, 120));
}

// ---------------------------------------------------------------------------
// Q9. THE APPLIED CARDS HAND OFF TO THE REAL PASSAGE, at the exact settings
//     the card authored, and the practice surface's own accuracy is what marks
//     the rung. All four are checked for the handoff; one is played through.
// ---------------------------------------------------------------------------
if (want('quests'))
{  const APPLIED = [
    ['ap-am-still-dre', 'still-dre-easy', 'Loop 1'],
    ['ap-c-ode-to-joy', 'ode-to-joy', 'Phrase A'],
    ['ap-g-happy-birthday', 'happy-birthday', 'Lines 1-2'],
    ['ap-cm-game-of-thrones', 'game-of-thrones-easy', 'Theme'],
  ];
  for (const [cardId, songId, section] of APPLIED) {
    await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1'));
      const old = Date.now() - 3 * 86400000;
      s.lab = s.lab ?? { v: 1, cards: {}, skills: {}, days: {}, clock: {}, route: {} };
      s.lab.cards[${JSON.stringify(cardId)}] = { evidence: [], selfChecks: [], seenContent: [], attempts: 3, recoveries: 0,
        stages: { worked: { at: old }, guided: { passedAt: old },
          independent: { passedAt: old, date: '2026-09-10', outcome: 'independent', assisted: false } } };
      localStorage.setItem('keys-v1', JSON.stringify(s)); return true; })()`);
    await boot();
    await openQuest(cardId, 'transfer');
    await sleep(700);
    const want = await b.eval(`(() => { const p = window.__quest()?.state.passage; return p ? { songId: p.songId,
      section: p.section, hand: p.hand, tempo: p.tempo, wait: p.wait, line: p.line } : null; })()`);
    if (!want) { ok(`${cardId}: its passage could be verified against the shipped song`, false, 'card refused its passage'); continue; }
    await clickId('quest-go');
    await sleep(1300);
    const got = await b.eval(`(() => ({ screen: [...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id).join(),
      hand: window.__engine?.hand, wait: window.__engine?.waitMode,
      tempo: Math.round((window.__engine?.tempo ?? 0) * 100),
      start: window.__engine?.startBeat, end: window.__engine?.endBeat,
      sec: document.getElementById('section-select').selectedOptions[0]?.textContent ?? '' })) ()`);
    ok(`${cardId} opens ${songId} at the settings it authored`,
      got.screen === 'screen-play' && got.hand === want.hand && got.wait === want.wait &&
      got.tempo === want.tempo && new RegExp(section.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')).test(got.sec),
      `${JSON.stringify(got)} wanted ${JSON.stringify(want)}`);
    if (cardId !== 'ap-c-ode-to-joy') continue;
    const ran = await playEngine();
    await sleep(1400);
    const back = await b.eval(`(() => { const d = window.__quest(); const c = JSON.parse(localStorage.getItem('keys-v1')).lab.cards[${JSON.stringify(cardId)}];
      return { screen: [...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id).join(),
        outcome: d?.record?.outcome ?? null, passed: d?.result?.passed, measured: d?.result?.measured ?? null,
        transfer: !!c.stages?.transfer?.passedAt, refused: d?.record?.refused ?? null }; })()`);
    ok('playing the real passage returns to the card and marks it from that run',
      ran === 'finished' && back.screen === 'screen-quest' && back.outcome !== null &&
      /from the practice surface/.test(back.measured ?? ''),
      `${ran} ${JSON.stringify(back)}`);
    ok('a passage played WITH HELP ON cannot fill the transfer rung',
      back.passed === true && back.outcome === 'practice' && back.transfer === false,
      `outcome=${back.outcome} transferStored=${back.transfer} refused=${JSON.stringify(back.refused)}`);
  }
}

// ---------------------------------------------------------------------------
// Q10. THE TECHNIQUE ROUTE GOES OUT AND COMES BACK TO WHERE HE ACTUALLY WAS.
//      Not to the card's authored defaults: to the range, hand, tempo and help
//      setting he had in front of him when he took the detour, and it survives
//      a reload, because the way back lives in saved state.
// ---------------------------------------------------------------------------
if (want('quests'))
{
  await b.eval(`(() => { const st = JSON.parse(localStorage.getItem('keys-v1'));
    delete st.labReturn;
    const old = Date.now() - 3 * 86400000;
    st.lab = st.lab ?? { v: 1, cards: {}, skills: {}, days: {}, clock: {}, route: {} };
    st.lab.cards['ap-am-still-dre'] = { evidence: [], selfChecks: [], seenContent: [], attempts: 3, recoveries: 0,
      stages: { worked: { at: old }, guided: { passedAt: old },
        independent: { passedAt: old, date: '2026-09-10', outcome: 'independent', assisted: false } } };
    localStorage.setItem('keys-v1', JSON.stringify(st)); return true; })()`);
  await boot();
  // open the passage the ordinary way, then CHANGE IT: a slower tempo, one
  // hand, help off. This is the state the return has to restore.
  await openQuest('ap-am-still-dre', 'transfer');
  await sleep(700);
  await clickId('quest-go');
  await sleep(1300);
  await b.eval(`(() => {
    const t = document.getElementById('tempo'); t.value = '70'; t.dispatchEvent(new Event('change'));
    const w = document.getElementById('wait-mode'); w.checked = false; w.dispatchEvent(new Event('change'));
    [...document.querySelectorAll('.hand-btn')].find((x) => x.dataset.hand === 'R').click();
    return true; })()`);
  await sleep(700);
  const mine = await b.eval(`(() => ({ hand: window.__engine?.hand, wait: window.__engine?.waitMode,
    tempo: Math.round((window.__engine?.tempo ?? 0) * 100),
    start: window.__engine?.startBeat, end: window.__engine?.endBeat,
    card: !!document.getElementById('passage-card'),
    tech: [...document.querySelectorAll('#passage-card button')].map((b2) => b2.textContent).join(' | ') })) ()`);
  ok('the passage carries the Understand-this-passage card with a named technique route',
    mine.card && /Technique: [A-G]/.test(mine.tech), JSON.stringify(mine.tech));
  ok('the technique button names the scale in words, not its id',
    !/scale-[a-z]/.test(mine.tech), mine.tech);

  const wentOut = await b.eval(`(() => { const b2 = [...document.querySelectorAll('#passage-card button')]
    .find((x) => /Technique/.test(x.textContent)); if (!b2) return null; b2.click(); return true; })()`);
  await sleep(1200);
  const atScale = await b.eval(`(() => ({ title: document.getElementById('now-playing').textContent.slice(0, 44),
    ret: JSON.parse(localStorage.getItem('keys-v1')).labReturn?.back ?? null })) ()`);
  ok('the technique route opens the scale the card names',
    wentOut && /[Ss]cale/.test(atScale.title), atScale.title);
  ok('and it remembers the settings he actually had, not the card defaults',
    atScale.ret && atScale.ret.hand === mine.hand && atScale.ret.tempo === mine.tempo &&
    atScale.ret.wait === mine.wait && atScale.ret.startBeat === mine.start,
    `stored ${JSON.stringify(atScale.ret)} vs live ${JSON.stringify(mine)}`);

  // RELOAD: the way back is saved state, so it survives one
  await boot();
  const afterReload = await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).labReturn?.back ?? null`);
  ok('the way back survives a reload', !!afterReload, JSON.stringify(afterReload));
  await b.eval(`window.__learning.openQuest('ap-am-still-dre','worked'), true`);
  await sleep(400);
  await b.eval(`window.__show('library'); true`);
  await sleep(300);
  // re-open the scale, where the return control is drawn
  await b.eval(`(() => { const s2 = JSON.parse(localStorage.getItem('keys-v1'));
    return !!s2.labReturn; })()`);
  const reopened = await b.eval(`(() => { const api = window.__learning; return true; })()`);
  await b.eval(`window.__learning.openQuest('ap-am-still-dre','transfer'), true`);
  await sleep(500);
  await b.eval(`(() => { const p = window.__quest()?.state.passage; return !!p; })()`);
  await clickId('quest-go');
  await sleep(1300);
  const backBtn = await b.eval(`[...document.querySelectorAll('.passage-return button')].map((x) => x.textContent)[0] ?? null`);
  ok('and after a reload the way back is still a reachable, visible control',
    !!backBtn, backBtn ?? 'no button');
  const returned = await b.eval(`(() => { const b2 = [...document.querySelectorAll('.passage-return button')][0];
    if (!b2) return null; b2.click(); return true; })()`);
  await sleep(1300);
  const home = await b.eval(`(() => ({ title: document.getElementById('now-playing').textContent.slice(0, 30),
    hand: window.__engine?.hand, wait: window.__engine?.waitMode,
    tempo: Math.round((window.__engine?.tempo ?? 0) * 100),
    start: window.__engine?.startBeat, end: window.__engine?.endBeat })) ()`);
  ok('the way back lands on the passage at HIS hands, tempo, help and range',
    returned && /Still D/.test(home.title) && home.hand === mine.hand &&
    home.tempo === mine.tempo && home.wait === mine.wait &&
    home.start === mine.start && home.end === mine.end,
    `${JSON.stringify(home)} wanted ${JSON.stringify(mine)}`);
  ok('and coming back is a navigation, never a second assessment of that card',
    await b.eval(`JSON.parse(localStorage.getItem('keys-v1')).labReturn?.back == null`),
    'labReturn.back cleared on return');
}

// ---------------------------------------------------------------------------
// Q11. AN UNMEASURABLE DIMENSION BECOMES AN HONEST LISTENING CHECK, never a
//      fake pass. No MIDI keyboard is connected in this browser, so velocity,
//      note-off and pedal are all absent: exactly the case that matters.
// ---------------------------------------------------------------------------
if (want('quests')) for (const [id, need] of [['ex-dynamics', 'velocity'], ['ex-pedal', 'pedal'], ['ex-balance', 'velocity-calibrated']]) {
  await openQuest(id, 'independent');
  await sleep(650);
  const q = await questNow();
  const said = await b.eval(`document.getElementById('quest-teach').textContent`);
  ok(`${id} degrades to a listening check when the device cannot measure ${need}`,
    q?.degraded === true && q.input === 'self-check' && q.support?.ok === false,
    `degraded=${q?.degraded} input=${q?.input} support=${JSON.stringify(q?.support)}`);
  const words = need.replace(/-/g, ' ');
  ok(`${id} says on screen what is missing rather than pretending`,
    said.length > 40 && new RegExp('does not report ' + words, 'i').test(said),
    said.slice(-140));
}
{
  // answering a self check records a self report, and a self report is not competence
  await openQuest('ex-dynamics', 'independent');
  await sleep(600);
  await clickId('quest-go');
  await sleep(1400);
  await clickId('quest-go');           // stop watching
  await sleep(500);
  const answered = await b.eval(`(() => { const b2 = [...document.querySelectorAll('.lw-ask button')][0];
    if (!b2) return 'no options'; b2.click(); return b2.textContent; })()`);
  await sleep(800);
  const q = await questNow();
  const card = await labCard('ex-dynamics');
  ok('a listening self report is recorded as the learner\'s own verdict, never as competence',
    answered !== 'no options' && q.outcome === 'self-report' &&
    !card?.stages?.independent?.passedAt && !!card?.stages?.independent?.selfReportedAt,
    `answered="${answered}" outcome=${q.outcome} stored=${JSON.stringify(card?.stages?.independent ?? null)}`);
}

// ---------------------------------------------------------------------------
// Q12. THE NOTE-VALUES LESSON NO LONGER COMPLETES FROM AN EAR-COPY ROUND.
// ---------------------------------------------------------------------------
if (want('quests'))
{  // seed PRIOR lesson history so the ladder is unlocked as far as note values,
  // and plenty of clean EAR-COPY rounds, which is the thing that must no longer
  // finish it
  await b.eval(`(() => { const s = JSON.parse(localStorage.getItem('keys-v1'));
    const t = Date.now() - 5 * 86400000;
    s.lessons = { 'middle-c': t, 'treble-lines': t, 'treble-spaces': t, 'bass-lines': t,
      'bass-spaces': t, 'the-cs': t, phrases: t, 'sharps-flats': t, intervals: t, triads: t };
    s.rhythm = { level: 1, cleans: 3, totalCleans: 5 };
    delete s.lab; localStorage.setItem('keys-v1', JSON.stringify(s)); return true; })()`);
  await boot();
  await clickId('btn-lessons');
  await sleep(600);
  const opened = await b.eval(`(() => { const rows = [...document.querySelectorAll('#lesson-list *')]
    .filter((e) => /Rhythm: note values/.test(e.textContent) && !e.children.length);
    if (!rows.length) return 'no row';
    let c = rows[0]; while (c && !(c.tagName === 'BUTTON' || c.style.cursor === 'pointer')) c = c.parentElement;
    (c || rows[0]).click(); return true; })()`);
  await sleep(700);
  const state2 = await b.eval(`(() => ({ msg: document.getElementById('lesson-msg').textContent,
    done: !!JSON.parse(localStorage.getItem('keys-v1')).lessons?.['rhythm-values'],
    action: document.getElementById('lesson-rhythm-link')?.textContent,
    quest: document.getElementById('lesson-rhythm-link')?.dataset.quest })) ()`);
  ok('five clean ear-copy rounds no longer finish the note-values lesson',
    state2.done === false && /written rhythm/i.test(state2.msg), `${state2.done} "${state2.msg.slice(0, 100)}"`);
  ok('and its action button opens the written-rhythm quest instead of Rhythm tap',
    state2.quest === 'rh-values', `${state2.action} -> ${state2.quest}`);
  const went = await b.eval(`(() => { document.getElementById('lesson-rhythm-link').click(); return true; })()`);
  await sleep(700);
  ok('that button actually lands on the written-rhythm card',
    await b.eval(`!document.getElementById('screen-quest').hidden && window.__quest()?.state.cardId === 'rh-values'`),
    await b.eval(`document.getElementById('quest-title').textContent`));
}

// ---------------------------------------------------------------------------
// Q13. THE SHARPS LESSON LINKS TO THE FLATS DRILL IT SAYS IT DOES NOT COVER.
// ---------------------------------------------------------------------------
if (want('quests'))
{  await clickId('btn-lessons');
  await sleep(500);
  const link = await b.eval(`(() => { const rows = [...document.querySelectorAll('#lesson-list *')]
    .filter((e) => /Sharps, flats/.test(e.textContent) && !e.children.length);
    if (!rows.length) return 'no row';
    let c = rows[0]; while (c && !(c.tagName === 'BUTTON' || c.style.cursor === 'pointer')) c = c.parentElement;
    (c || rows[0]).click(); return true; })()`);
  await sleep(600);
  const info = await b.eval(`(() => ({ quest: document.getElementById('lesson-rhythm-link')?.dataset.quest,
    label: document.getElementById('lesson-rhythm-link')?.textContent,
    steps: document.getElementById('lesson-steps')?.textContent ?? '' })) ()`);
  ok('the sharps lesson states it does not cover flats, and links the drill that does',
    info.quest === 'nt-flats' && /sharp/i.test(info.steps) && /flat/i.test(info.steps),
    `${info.label} -> ${info.quest}`);
}

// ---------------------------------------------------------------------------
// Q13b. A REPAIR IS CROPPED TO ITS BAR. The page stays whole, because the key,
//       a carried accidental and a tie across the bar line are part of reading
//       that bar; everything outside it is dimmed and only it is judged.
// ---------------------------------------------------------------------------
if (want('quests'))
{
  await openQuest('rh-values', 'independent');
  await sleep(600);
  await clickId('quest-go');
  await waitPhase('playing');
  await playQuest({ hold: 0.12 });
  await sleep(900);
  await b.eval(`(() => { const b2 = [...document.querySelectorAll('#quest-teach button')]
    .find((x) => /Repair/.test(x.textContent)); if (b2) b2.click(); return !!b2; })()`);
  await sleep(700);
  const crop = await b.eval(`(() => { const svg = document.querySelector('#quest-stave svg');
    if (!svg) return null;
    const heads = [...svg.querySelectorAll('.vf-stavenote')];
    const dim = heads.filter((h) => (h.style.opacity || '1') !== '1').length;
    return { heads: heads.length, dim, msg: document.getElementById('quest-msg').textContent }; })()`);
  ok('the repair dims the page outside its bar and says only that bar is judged',
    crop && crop.heads > 0 && crop.dim > 0 && crop.dim < crop.heads &&
    /only/i.test(crop.msg) && /never passes the rung|practice on one bar/i.test(crop.msg),
    `${crop?.dim} of ${crop?.heads} dimmed; "${(crop?.msg ?? '').slice(0, 110)}"`);
}

// ---------------------------------------------------------------------------
// Q13c. AN UNANSWERED LISTENING CHECK RECORDS NOTHING. There is no default
//       answer, and finishing without one cannot advance the rung.
// ---------------------------------------------------------------------------
if (want('quests'))
{
  await b.eval(`(() => { const st = JSON.parse(localStorage.getItem('keys-v1'));
    delete st.lab; localStorage.setItem('keys-v1', JSON.stringify(st)); return true; })()`);
  await boot();
  await openQuest('ex-pedal', 'independent');
  await sleep(650);
  const q0 = await questNow();
  const hasQuestion = await b.eval(`(() => { const d = window.__quest();
    return { selfCheck: !!d.state.selfCheck, options: (d.state.selfCheck?.options ?? []).length }; })()`);
  ok('a degraded rung always carries a real question to answer',
    q0.input === 'self-check' && hasQuestion.selfCheck && hasQuestion.options > 1,
    `input=${q0.input} options=${hasQuestion.options}`);
  await clickId('quest-go');
  await sleep(1500);
  await clickId('quest-go');        // stop watching WITHOUT answering
  await sleep(700);
  const after = await b.eval(`(() => { const d = window.__quest();
    const c = JSON.parse(localStorage.getItem('keys-v1')).lab?.cards?.['ex-pedal'] ?? null;
    return { phase: d?.phase, msg: document.getElementById('quest-msg').textContent,
      stored: c?.stages?.independent ?? null, outcome: d?.record?.outcome ?? null }; })()`);
  ok('finishing a listening check without answering records nothing at all',
    after.phase === 'answering' && after.stored === null && after.outcome === null &&
    /nothing is recorded/i.test(after.msg),
    `phase=${after.phase} stored=${JSON.stringify(after.stored)} "${after.msg.slice(0, 80)}"`);
  const answered = await b.eval(`(() => { const b2 = [...document.querySelectorAll('.lw-ask button')][0];
    if (!b2) return 'none'; b2.click(); return b2.textContent; })()`);
  await sleep(800);
  const done = await b.eval(`(() => { const c = JSON.parse(localStorage.getItem('keys-v1')).lab.cards['ex-pedal'];
    const d = window.__quest();
    return { outcome: d?.record?.outcome, passedAt: c.stages?.independent?.passedAt ?? null,
      selfReportedAt: c.stages?.independent?.selfReportedAt ?? null }; })()`);
  ok('and once answered it is stored as a self report, never as competence',
    answered !== 'none' && done.outcome === 'self-report' && !done.passedAt && !!done.selfReportedAt,
    `"${answered}" outcome=${done.outcome} stored=${JSON.stringify(done)}`);
}

// ---------------------------------------------------------------------------
// Q13d. THE TRANSFER POOL IS NAMED, so a repeat can never look like fresh
//       evidence and an exhausted pool says what it can no longer claim.
// ---------------------------------------------------------------------------
if (want('quests'))
{
  await b.eval(`(() => { const st = JSON.parse(localStorage.getItem('keys-v1'));
    const old = Date.now() - 3 * 86400000;
    st.lab = st.lab ?? { v: 1, cards: {}, skills: {}, days: {}, clock: {}, route: {} };
    st.lab.cards['rh-dots'] = { evidence: [], selfChecks: [], seenContent: [], attempts: 3, recoveries: 0,
      stages: { worked: { at: old }, guided: { passedAt: old },
        independent: { passedAt: old, date: '2026-09-10', outcome: 'independent', assisted: false } } };
    localStorage.setItem('keys-v1', JSON.stringify(st)); return true; })()`);
  await boot();
  await openQuest('rh-dots', 'transfer');
  await sleep(700);
  const pool = await b.eval(`(() => { const d = window.__quest(); if (!d) return null;
    return { pool: d.state.pool ?? null, usingAlt: d.state.usingAlt ?? null,
      exhausted: d.state.poolExhausted ?? null,
      shown: document.getElementById('quest-teach').textContent }; })()`);
  ok('a transfer rung tells the learner how much fresh material it still has',
    !!pool?.pool && /Transfer material: \d+ of \d+ used/.test(pool.shown),
    `pool=${JSON.stringify(pool?.pool)} usingAlt=${pool?.usingAlt}`);
}

// ---------------------------------------------------------------------------
// Q14. LEAVING A QUEST ENDS WHAT IT STARTED.
// ---------------------------------------------------------------------------
if (want('quests'))
{  await openQuest('rh-pulse', 'guided');
  await sleep(500);
  await clickId('quest-go');
  await sleep(700);
  await b.eval(`window.__show('library'); true`);
  await sleep(400);
  const before = await sounds();
  await sleep(2500);
  const after = await sounds();
  ok('leaving a quest mid-count-in leaves nothing clicking', after - before === 0,
    `${after - before} sounds scheduled in 2.5s after leaving`);
}

// ---------------------------------------------------------------------------
// 10. NOTHING THREW ANYWHERE ALONG THE WAY.
// ---------------------------------------------------------------------------
{
  const e = await errs();
  ok('no uncaught error on any surface walked above', e.length === 0, e.slice(0, 4).join(' | '));
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
await b.close();
process.exit(failed.length ? 1 : 0);
