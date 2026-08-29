import { setTextKeeping, setHTMLKeeping, CANON_ON, hideRestingLayer } from './canon-mount.mjs';
import { CANON } from './canon-templates.mjs';
import { coverDataUrl } from './covers.mjs';
import { bindPathSkills, bindPathLessons } from './canon-bind.mjs';
// Teacher Loop v1 UI (11th council 2026-08-25). The Path screen renders one
// prescription with its REASON and its EVIDENCE, and runs the six task types.
// Wiring only: every rule lives in teacher.mjs so it stays node-testable.
//
// Assistance law: `help` decides what the attempt can prove. A guided task can
// never push a skill past "guided", no matter how clean it is.

import {
  SKILLS, SKILL_BY_ID, STAGES, stageRank, TEACHER_LESSONS, ASSESSMENT, DIAGNOSTIC,
  TECHNIQUE_RUBRIC, TECHNIQUE_STOP_RULE, prescribe, recordAttempt, emptyMastery,
  triadMidis, nearestVoicing, markIntroduced, SKILL_REPERTOIRE, playableGroups,
} from './teacher.mjs';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = (m) => NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);

// ---- pure scoring helpers (node-tested) ----

// A chord attempt is right when the held keys are exactly the wanted pitch
// classes, in any octave and any voicing.
export function chordMatches(held, wantPcs) {
  const got = new Set([...held].map((m) => m % 12));
  const want = new Set(wantPcs.map((p) => ((p % 12) + 12) % 12));
  if (got.size !== want.size) return false;
  for (const p of want) if (!got.has(p)) return false;
  return true;
}

// Did the change use the NEAREST voicing? Compared against the same function
// the lesson teaches, with a tolerance of one voice being an octave out.
export function usedNearest(played, sym, from) {
  const want = nearestVoicing(sym, from);
  const a = [...played].sort((x, y) => x - y);
  const b = [...want].sort((x, y) => x - y);
  if (a.length !== b.length) return false;
  return a.every((m, i) => m === b[i]);
}

// Pulse: taps judged against click times. Returns evidence, never a verdict.
export function pulseScore(taps, clicks, windowMs = 150) {
  const used = new Set();
  let inside = 0;
  const offsets = [];
  for (const t of taps) {
    let best = -1, bestD = Infinity;
    clicks.forEach((c, i) => {
      if (used.has(i)) return;
      const d = Math.abs(t - c);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best < 0) continue;
    used.add(best);
    offsets.push(t - clicks[best]);
    if (bestD <= windowMs) inside++;
  }
  const med = offsets.length
    ? [...offsets].sort((a, b) => a - b)[Math.floor(offsets.length / 2)]
    : 0;
  return { inside, of: clicks.length, medianMs: Math.round(med), passed: inside >= Math.ceil(clicks.length * 0.8) };
}

// Where the LEFT HAND root sits: the C3 octave. It must be a key the learner
// can actually see and reach, lighting a C2 that is off the visible keyboard
// made the task unplayable by tap (found live 2026-08-25).
export function lhRoot(chordMidi, low = 48) {
  return low + ((((chordMidi % 12) - low) % 12) + 12) % 12;
}

// Two hands "together": the gap between the first left and first right onset.
export function togetherGap(lhMs, rhMs) {
  if (lhMs == null || rhMs == null) return null;
  return Math.abs(lhMs - rhMs);
}

export function installPath(ctx) {
  const {
    $, show, state, store, FallsView, playPreview, stopPreview, comboFlash,
    markPracticedToday, jlog, lessonKeyRange, COLORS,
    SONGS, songStats, launchSong, runPrescription, awardXp,
  } = ctx;

  let view = null;          // tappable keyboard (same component the lessons use)
  let introTarget = null;   // {sym, midis}, the teach-screen chord, live
  let introHeld = new Set(), introTimer = 0, introCount = 0;
  let task = null;          // the live task
  let rx = null;            // current prescription
  let clickTimer = 0, clickCtx = null;

  const mastery = () => (state.mastery ??= emptyMastery());
  const doneLessons = () => (state.teacherLessons ??= {});

  // ---------- the click track (self-contained: the metronome screen's one is
  // bound to its own DOM inputs) ----------
  function stopClicks() {
    clearInterval(clickTimer);
    clickTimer = 0;
  }
  function runClicks(bpm, beats, onBeat, onDone) {
    stopClicks();
    clickCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    clickCtx.resume();
    const spb = 60000 / bpm;
    const t0 = performance.now() + 700; // a bar of air before the first click
    const times = Array.from({ length: beats }, (_, i) => t0 + i * spb);
    let i = 0;
    clickTimer = setInterval(() => {
      const now = performance.now();
      while (i < times.length && times[i] <= now + 20) {
        const when = clickCtx.currentTime + Math.max(0, (times[i] - now)) / 1000;
        const osc = clickCtx.createOscillator();
        const g = clickCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = i % 4 === 0 ? 1500 : 1000;
        g.gain.setValueAtTime(i % 4 === 0 ? 0.25 : 0.15, when);
        g.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
        osc.connect(g).connect(clickCtx.destination);
        osc.start(when); osc.stop(when + 0.06);
        onBeat?.(i, times[i]);
        i++;
      }
      if (i >= times.length && now > times[times.length - 1] + 900) {
        stopClicks();
        onDone?.(times);
      }
    }, 16);
    return times;
  }

  // ---------- the Path screen ----------
  function stageChip(stage) {
    const label = { unseen: 'not met', introduced: 'met', guided: 'with help', independent: 'on your own', retained: 'remembered' }[stage] ?? stage;
    const shape = { unseen: '·', introduced: '◔', guided: '◑', independent: '●', retained: '★' }[stage] ?? '·';
    return '<span class="stage-chip s-' + stage + '"><i>' + shape + '</i>' + label + '</span>';
  }

  function renderPath() {
    // the path is the LEARNING voice: no resume candidate here (13th council)
    rx = prescribe(state, Date.now(), { songs: SONGS ?? [], statsOf: songStats });
    setTextKeeping($('path-reason'), rx.reason);   // the canon nests #path-go inside it
    // The desktop module carries a Fraunces HEADLINE above the reason; the
    // sample skill name sat there whatever the prescription said (Codex round
    // 2, must-fix 1: headline, reason and evidence must name ONE subject).
    {
      const pr = $('path-reason');
      const head = pr && [...pr.querySelectorAll('*')]
        .find((x) => !x.children.length && /Fraunces/.test(x.getAttribute('style') ?? ''));
      if (head) {
        const skillId = rx.skillId
          ?? (rx.lessonId && TEACHER_LESSONS.find((l) => l.id === rx.lessonId)?.skillIds?.[0]);
        const song = rx.songId && (SONGS ?? []).find((x) => x.id === rx.songId);
        head.textContent = (skillId && SKILL_BY_ID[skillId]?.name)
          ?? song?.title
          ?? ({ diagnostic: 'The check-in', assessment: 'The assessment', done: 'Path complete' }[rx.kind]
              ?? 'Continue learning');
      }
    }
    // the 756 column's one-line evidence; the desktop strip binds its own
    // three cells below, and this write must not clobber one of them
    if (!$('path-evidence')?.textContent.includes('LAST TESTED')) {
      setTextKeeping($('path-evidence'), rx.evidence ? 'Why: ' + rx.evidence : '');
    }
    $('path-go').textContent = rx.kind === 'diagnostic' ? '▶ Start the check-in'
      : rx.kind === 'review' ? '▶ Quick check'
      : rx.kind === 'assessment' ? '▶ Take the assessment'
      : rx.kind === 'proof' ? 'Prove it in the song'
      : rx.kind === 'song-review' ? 'Run the song'
      : rx.kind === 'repertoire' ? 'Five focused minutes'
      : rx.kind === 'done' ? '✓ Path complete' : '▶ Continue learning';
    $('path-go').disabled = rx.kind === 'done';
    // ---- 11d value slots (2026-08-30 council redraw), each guarded so the
    // phone board is untouched. Scoped writes: sample text is the address.
    {
      const scr = $('screen-path');
      const leafBy = (rootEl, sample) => rootEl && [...rootEl.querySelectorAll('*')]
        .find((e) => !e.children.length && e.textContent.trim() === sample && !e.closest('[data-legacy-screen]'));
      const skillId = rx.skillId
        ?? (rx.lessonId && TEACHER_LESSONS.find((l2) => l2.id === rx.lessonId)?.skillIds?.[0]) ?? null;
      const STAGES2 = ['unseen', 'introduced', 'guided', 'independent', 'retained'];
      const m2 = skillId ? (mastery()[skillId] ?? { stage: 'unseen', evidence: [] }) : null;
      const rank2 = m2 ? STAGES2.indexOf(m2.stage) : -1;
      // header statement
      const head = leafBy(scr, '2 OF 5 SKILLS INDEPENDENT');
      if (head) {
        const n2 = SKILLS.filter((s3) => STAGES2.indexOf((mastery()[s3.id] ?? { stage: 'unseen' }).stage) >= 3).length;
        head.textContent = `${n2} OF ${SKILLS.length} SKILLS INDEPENDENT`;
      }
      const reason = $('path-reason');
      const act = leafBy(reason, 'Build Cm7 and F7 from the symbol, left hand alone.');
      if (act) act.textContent = rx.reason ?? '';
      const why = leafBy(reason, 'Independent for six days. It decays Thursday.');
      if (why) why.textContent = rx.evidence ?? rx.reason ?? '';
      const mile = leafBy(reason, 'One clean run moves this to Guided');
      if (mile) {
        mile.textContent = rank2 >= 0 && rank2 < 4
          ? `A clean, unassisted pass moves this to ${STAGES2[rank2 + 1]}`
          : rank2 === 4 ? 'Held. Reviews keep it alive.'
          : rx.kind === 'diagnostic' ? 'The check-in builds your path from what you play'
          : 'Keep going: the path re-plans after every attempt';
      }
      // the three-cell evidence strip
      const ev = $('path-evidence');
      const evRow = ev && leafBy(ev, 'LAST TESTED')?.parentElement?.parentElement;
      if (leafBy(ev, 'LAST TESTED')) {
        if (!ev.dataset.disp) ev.dataset.disp = ev.style.display || 'flex';
        if (!m2 || !m2.lastTested) { ev.style.display = rx.kind === 'diagnostic' ? 'none' : ev.dataset.disp; }
        else ev.style.display = ev.dataset.disp;
        const lt = leafBy(ev, '26 August, four days ago');
        if (lt) {
          if (m2?.lastTested) {
            const d2 = new Date(m2.lastTested);
            const days = Math.max(0, Math.round((Date.now() - m2.lastTested) / 864e5));
            lt.textContent = `${d2.getDate()} ${d2.toLocaleString('en', { month: 'long' })}, ${days === 0 ? 'today' : days === 1 ? 'yesterday' : days + ' days ago'}`;
          } else lt.textContent = 'Not tested yet';
        }
        const rr = leafBy(ev, 'Two clean builds of three');
        if (rr) {
          const tail = (m2?.evidence ?? []).slice(-3);
          rr.textContent = tail.length
            ? `${tail.filter((e2) => e2.passed).length} clean of the last ${tail.length}`
            : 'No attempts on record';
        }
        const tg = leafBy(ev, 'Three clean builds, no help');
        if (tg) {
          tg.textContent = rank2 >= 4 ? 'Still there after a break'
            : rank2 === 3 ? 'Stay clean on a quick check'
            : 'Clean builds without help';
        }
      }
      // the two technique tiles are DRAWN SAMPLES with no data behind them:
      // they stand down; the Technique drills button is the real door
      {
        const tiles2 = ['Move between chords without jumping', 'Left hand root, right hand third and seventh']
          .map((t2) => leafBy(scr, t2)).filter(Boolean);
        // hide the tiles' shared ROW (hiding only the tiles left their gap),
        // and the kicker floats gapless above the real button
        const row2 = tiles2.length ? tiles2.map((l2) => {
          let t3 = l2;
          for (let i2 = 0; i2 < 4 && t3.parentElement; i2++) t3 = t3.parentElement;
          return t3;
        }) : [];
        const common = tiles2.length === 2 ? (() => {
          let a2 = tiles2[0];
          while (a2 && !a2.contains(tiles2[1])) a2 = a2.parentElement;
          return a2;
        })() : null;
        if (common && common !== scr && !common.querySelector('button[id]')) common.style.display = 'none';
        else for (const l2 of tiles2) { let t3 = l2; for (let i2 = 0; i2 < 3 && t3.parentElement; i2++) { t3 = t3.parentElement; if (t3.children.length >= 2 && t3.querySelector('i, b')) break; } t3.style.display = 'none'; }
      }
      const lk = leafBy(scr, 'LESSONS BEHIND THIS · 3 OF 5');
      if (lk) lk.textContent = `LESSONS BEHIND THIS · ${Object.keys(doneLessons()).length} OF ${TEACHER_LESSONS.length}`;
    }
    const nPlay = playableGroups(state, SONGS ?? []).length;
    // TWO compositions live behind #path-playable. The 756 column is a plain
    // count line. The desktop board draws WHAT IT UNLOCKS with two song rows,
    // and Codex caught the module keeping its SAMPLE songs (River Flows in
    // You) whatever the data said. The rows now carry the prescribed skill's
    // real repertoire, and rows with nothing behind them stand down.
    {
      const pp = $('path-playable');
      const unlockRows = pp ? [...pp.children].filter((c) => c.querySelector('img')) : [];
      if (unlockRows.length) {
        const skillId = rx.skillId
          ?? (rx.lessonId && TEACHER_LESSONS.find((l) => l.id === rx.lessonId)?.skillIds?.[0])
          ?? null;
        const rep = skillId ? SKILL_REPERTOIRE[skillId] : null;
        const seen = new Set();
        const entries = rep ? [rep.payoff, ...(rep.proof ?? [])].filter(Boolean)
          .filter((e) => !seen.has(e.songId) && seen.add(e.songId)) : [];
        unlockRows.forEach((row, i) => {
          const e = entries[i];
          if (!e) { row.style.display = 'none'; return; }
          const song = (SONGS ?? []).find((x) => x.id === e.songId);
          if (!song) { row.style.display = 'none'; return; }
          row.style.display = '';
          const img = row.querySelector('img');
          if (img) { img.src = coverDataUrl(song, 64); img.alt = ''; img.removeAttribute('data-art'); }
          const leaves2 = [...row.querySelectorAll('*')].filter((x) => !x.children.length && x.textContent.trim());
          const title2 = leaves2.find((x) => /Fraunces/.test(x.getAttribute('style') ?? '')) ?? leaves2[0];
          if (title2) title2.textContent = song.title;
          // the requirement line is REAL data: which section proves the skill
          const req = leaves2.find((x) => x !== title2 && /^(Unlocks|Proof|The payoff)/.test(x.textContent.trim()));
          if (req) req.textContent = `${rep.payoff && e.songId === rep.payoff.songId && e.section === rep.payoff.section ? 'The payoff' : 'Proof'} · ${e.section}`;
        });
      } else {
        setTextKeeping(pp, nPlay > 0
          ? '' + nPlay + ' song' + (nPlay === 1 ? '' : 's') + ' independently playable'
          : '');
      }
    }

    // The canon drew a row per skill, with five pips for the stage ladder.
    // STAGES is the design's own order, read off its sample rows.
    const STAGES = ['unseen', 'introduced', 'guided', 'independent', 'retained'];
    const skillRows = SKILLS.map((s2) => {
      const m2 = mastery()[s2.id] ?? { stage: 'unseen' };
      const rank2 = STAGES.indexOf(m2.stage);
      const now2 = Date.now();
      let bottom = m2.stage;
      if (rank2 >= 1 && m2.dueAt) {
        if (m2.dueAt <= now2) bottom = `${m2.stage} · due today`;
        else bottom = `${m2.stage} · ${rank2 === 4 ? 'held' : 'decays'} ${new Date(m2.dueAt).toLocaleString('en', { weekday: 'long' })}`;
      }
      if (rank2 === 4 && m2.lastTested) bottom = `${m2.stage} · held ${Math.max(1, Math.round((now2 - m2.lastTested) / 864e5))} days`;
      return { name: s2.name, stage: m2.stage, title: s2.passRule, bottom,
               filled: Math.max(0, rank2 + 1) };
    });
    if (!(CANON_ON && bindPathSkills(skillRows))) {
    $('path-skills').innerHTML = '<h3 class="path-sub">What you can do</h3>' +
      SKILLS.map((s) => {
        const m = mastery()[s.id] ?? { stage: 'unseen' };
        return '<div class="skill-row"><span class="skill-name">' + s.name + '</span>' +
          stageChip(m.stage) +
          '<span class="skill-rule" title="how this is judged">' + s.passRule + '</span></div>';
      }).join('');
    }

    const done = doneLessons();
    const lessonRows = TEACHER_LESSONS.map((l, i) => {
      const isDone = !!done[l.id];
      const isNext = !isDone && TEACHER_LESSONS.slice(0, i).every((p) => done[p.id]);
      return { title: l.title, state: isDone ? 'Complete' : isNext ? 'Ready' : 'Locked',
               locked: !isDone && !isNext, onOpen: () => openLesson(l) };
    });
    if (CANON_ON && bindPathLessons(lessonRows)) return;
    $('path-lessons').innerHTML = '<h3 class="path-sub">The five steps</h3>' +
      TEACHER_LESSONS.map((l, i) => {
        const isDone = !!done[l.id];
        const isNext = !isDone && TEACHER_LESSONS.slice(0, i).every((p) => done[p.id]);
        return '<button class="lesson-card' + (isDone ? ' done' : '') + (isNext || isDone ? '' : ' locked') + '"' +
          (isNext || isDone ? '' : ' disabled') + ' data-lesson="' + l.id + '">' +
          '<span class="spine-num">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="spine-title">' + l.title + '</span>' +
          '<span class="spine-state ' + (isDone ? 'done' : isNext ? 'ready' : 'locked') + '"><i>' +
          (isDone ? '✓' : isNext ? '▶' : '○') + '</i>' + (isDone ? 'Complete' : isNext ? 'Ready' : 'Locked') +
          '</span></button>';
      }).join('');
    for (const b of $('path-lessons').querySelectorAll('[data-lesson]')) {
      b.addEventListener('click', () => openLesson(TEACHER_LESSONS.find((l) => l.id === b.dataset.lesson)));
    }
  }

  function renderTeaser() {
    const el = $('path-teaser');
    if (!el) return;
    const p = prescribe(state, Date.now());
    el.hidden = false;
    el.innerHTML = '<span class="teaser-tag">Your path</span>' +
      '<span class="teaser-reason">' + p.reason + '</span>' +
      '<button class="tool accent teaser-go">▶ Continue</button>';
    el.querySelector('.teaser-go').addEventListener('click', () => openPath());
  }

  function openPath() {
    show('path');
    $('now-playing').textContent = 'My path';
    renderPath();
  }

  // ---------- the task screen ----------
  function ensureView() {
    if (!view) view = new FallsView($('task-keys'));
    return view;
  }

  function setKeyboard(lo, hi, labels = true) {
    const v = ensureView();
    v.kbLetters = labels;
    v.markMiddleC = true;
    v.targets = new Set();
    v.pressed.clear();
    v.setRange(lo, hi);
    $('task-keys').hidden = false;
    // the artboard's still keyboard picture (sample-lit cyan keys, middle C
    // ring) must not sit over the live one: the one adopted canvas that never
    // stood its mock down (Mark's "visual glitch", 2026-08-30)
    if (CANON_ON) hideRestingLayer($('task-keys'));
    v.resize();
    drawKeys();
  }

  let drawing = false;
  function drawKeys() {
    if (!view) return;
    const on = !$('screen-task').hidden && !$('task-keys').hidden;
    if (!on) { drawing = false; return; }
    drawing = true;
    view.ctx.fillStyle = COLORS.bg;
    view.ctx.fillRect(0, 0, view.w, view.h);
    // The working area FLEXES taller when a task hides the sheet, and filling
    // it painted 500px ghost keys (Mark's screenshot, 2026-08-30). The desktop
    // board draws the keys as a 283px strip; that proportion is the ceiling,
    // anchored to the canvas bottom with quiet black above.
    view.kbH = Math.min(view.h - 4, 300);
    const kbTop = view.h - view.kbH;
    view._drawKeyboard(kbTop);
    view._drawFlares(kbTop, 0.016);
    view._drawParticles(0.016);
    requestAnimationFrame(drawKeys);
  }

  function slots(n, states) {
    // build tasks hand this row to the held-note cells (canon board 11c);
    // everything else keeps the plain slot dots
    if (!(isBuildTask() && heldModule())) {
      $('task-slots').innerHTML = Array.from({ length: n }, (_, i) =>
        '<i class="slot ' + (states[i] ?? 'todo') + '"></i>').join('');
    }
    bindRound(n, states);
  }

  // ---- board 11c stage bindings (2026-08-30) --------------------------------
  // Mark: "it looks so messy... is this really the best learning experience we
  // can do in a gamified way?" The redrawn task board added three modules;
  // everything here binds DATA into the design's own markup, writes no styles.
  const BUILD_TASKS = new Set(['chord', 'inversion', 'twohand']);
  const isBuildTask = () => !!task && (BUILD_TASKS.has(task.spec?.type) || BUILD_TASKS.has(task.kind));

  // the 150px watermark inside task-sheet: the symbol being built, huge and
  // quiet behind the working area (drawn sample "Cm7")
  function bindWatermark(sym) {
    if (!CANON_ON) return;
    const sheet = $('task-sheet');
    const wm = sheet && [...sheet.querySelectorAll('*')]
      .find((e) => !e.children.length && /150px/.test(e.getAttribute('style') ?? ''));
    if (!wm) return;                     // the phone board draws no watermark
    wm.textContent = sym || '';
    if (sym) sheet.hidden = false;
  }

  // THIS ROUND, the module under HOW IT WORKS: cells lifted from its own drawn
  // Clean/Helped/Open samples, dealt to the real round length every update
  let roundUi;
  function roundModule() {
    if (roundUi !== undefined || !CANON_ON) return roundUi;
    const leafFor = (word) => [...document.querySelectorAll('#screen-task *')]
      .find((e) => !e.children.length && e.textContent.trim() === word && !e.closest('[data-legacy-screen]'));
    if (!leafFor('THIS ROUND')) { roundUi = false; return roundUi; }
    const tpl = {};
    let row = null;
    for (const [state, word] of [['clean', 'Clean'], ['recov', 'Helped'], ['todo', 'Open']]) {
      const leaf = leafFor(word);
      if (!leaf) { roundUi = false; return roundUi; }
      let cell = leaf;
      for (let i = 0; i < 3 && cell.parentElement; i++) {
        if (cell.querySelector('i, b') || cell.children.length >= 2) break;
        cell = cell.parentElement;
      }
      tpl[state] = cell.cloneNode(true);
      row = cell.parentElement;
    }
    const line = [...document.querySelectorAll('#screen-task *')]
      .find((e) => !e.children.length && /clean builds banked$/.test(e.textContent.trim()));
    roundUi = row ? { row, tpl, line } : false;
    return roundUi;
  }
  function bindRound(n, states) {
    const ui = roundModule();
    if (!ui) return;
    while (ui.row.firstChild) ui.row.firstChild.remove();
    for (let i = 0; i < n; i++) {
      const st = states[i] === 'clean' ? 'clean' : states[i] === 'recov' ? 'recov' : 'todo';
      ui.row.appendChild(ui.tpl[st].cloneNode(true));
    }
    if (ui.line) ui.line.textContent = `${states.filter((s) => s === 'clean').length} of ${n} clean builds banked`;
  }

  // the held-note cells: for build tasks the drawn slot row shows which notes
  // are placed so far ("C", "E flat", "empty"), straight from task.held
  let heldUi;
  function heldModule() {
    if (heldUi !== undefined || !CANON_ON) return heldUi;
    const host = $('task-slots');
    const emptyLeaf = host && [...host.querySelectorAll('*')]
      .find((e) => !e.children.length && e.textContent.trim() === 'empty');
    const nameLeaf = host && [...host.querySelectorAll('*')]
      .find((e) => !e.children.length && /Fraunces/.test(e.getAttribute('style') ?? '') && e.textContent.trim());
    if (!emptyLeaf || !nameLeaf) { heldUi = false; return heldUi; }
    const cellOf = (l) => { let c = l; while (c.parentElement && c.parentElement !== host) c = c.parentElement; return c; };
    heldUi = { host, emptyTpl: cellOf(emptyLeaf).cloneNode(true), nameTpl: cellOf(nameLeaf).cloneNode(true) };
    return heldUi;
  }
  function syncHeldCells() {
    const ui = heldModule();
    if (!ui || !isBuildTask()) return;
    const sym = task.round?.[task.idx] ?? task.seq?.[task.idx];
    const wantN = sym ? triadMidis(sym).length : 3;
    // the ATTEMPT set, judgeHeld's own rule: rolled/staccato notes stay shown
    const held = [...new Set([...(task.window ?? []), ...task.held])].sort((a, b) => a - b);
    while (ui.host.firstChild) ui.host.firstChild.remove();
    for (let i = 0; i < wantN; i++) {
      if (i < held.length) {
        const c = ui.nameTpl.cloneNode(true);
        const nm = [...c.querySelectorAll('*')].find((e) => !e.children.length && /Fraunces/.test(e.getAttribute('style') ?? ''));
        // the app's spoken vocabulary ("G sharp"), never a bare accidental
        if (nm) nm.textContent = NOTE_NAMES[held[i] % 12].replace('#', ' sharp');
        ui.host.appendChild(c);
      } else ui.host.appendChild(ui.emptyTpl.cloneNode(true));
    }
  }

  function openTaskScreen(title, teach, ready) {
    stopPreview();
    show('task');
    $('now-playing').textContent = 'My path';
    $('task-title').textContent = title;
    $('task-teach').innerHTML = teach?.length
      ? '<ol class="lesson-steps">' + teach.map((t) => '<li>' + t + '</li>').join('') + '</ol>' : '';
    $('task-rubric').hidden = true;
    $('task-stage').hidden = true;
    $('task-sheet').hidden = true;
    $('task-msg').textContent = '';
    $('task-slots').innerHTML = '';
    $('task-payoff').hidden = true;
    $('task-start').hidden = false;
    $('task-show').hidden = true;
    $('task-easier').hidden = true;
    $('task-kb').textContent = 'Hide keyboard';
    // the PRE-START INVITE (states board, council 2026-08-30): the stage is
    // never a black void before Start. Lifted verbatim, freeze-offer pattern;
    // any start removes it.
    $('task-prestart-live')?.remove();
    if (CANON_ON && (CANON['states'] ?? '').includes('task-prestart')) {
      const t2 = document.createElement('template');
      t2.innerHTML = CANON['states'];
      const inv = t2.content.querySelector('#task-prestart')?.cloneNode(true);
      if (inv) {
        inv.id = 'task-prestart-live';
        const q2 = [...inv.querySelectorAll('*')].find((e) => !e.children.length && /\?$/.test(e.textContent.trim()));
        if (q2) q2.textContent = title;
        const line2 = [...inv.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim() === 'Four notes, root position, left hand.');
        if (line2) line2.textContent = ready ?? '';
        const cta = [...inv.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim() === 'Start drill');
        const c2 = cta?.closest('button') ?? cta?.parentElement;
        if (c2) { c2.style.cursor = 'pointer'; c2.addEventListener('click', () => { $('task-prestart-live')?.remove(); $('task-start')?.click(); }); }
        inv.style.margin = '48px auto';
        $('task-prompt')?.insertAdjacentElement('afterend', inv);
      }
    }
  }

  // ---- lesson: teach -> guided -> transfer ----
  let lessonDef = null, phase = 'guided';

  function openLesson(les) {
    if (!les) return;
    lessonDef = les;
    for (const sid of les.skillIds) markIntroduced(mastery(), sid, Date.now());
    store.save(state);
    phase = (state.teacherStep?.[les.id] === 'transfer') ? 'transfer' : 'guided';
    openTaskScreen(les.title, les.teach, 'Pass rule: ' + les.passRule + '.');
    $('task-start').textContent = phase === 'transfer' ? '▶ Continue: on your own' : '▶ Start the guided go';
    $('task-show').hidden = false;
    $('task-easier').hidden = phase !== 'transfer';
    $('task-msg').textContent = 'Pass rule: ' + les.passRule + '.';
    // demo the first thing so he HEARS it before being asked (teach, then test)
    const spec = les.guided;
    if (spec.type === 'chord' || spec.type === 'inversion' || spec.type === 'twohand' || spec.type === 'leadsheet') {
      const first = spec.pool?.[0] ?? spec.seq?.[0] ?? spec.bars?.[0];
      const ms = triadMidis(first);
      setKeyboard(48, 83, true);
      view.targets = new Set(ms);
      playPreview(ms.map((m) => ({ b: 0, d: 2, m, h: 'R' })), 600, null, null);
      setIntroTarget(first, ms);
      $('task-msg').textContent = 'That is ' + first + ': ' + ms.map(noteName).join(' + ') + ', lit up. TRY IT NOW: press the lit keys together and I will tell you if you got it.';
    } else {
      setKeyboard(48, 83, true);
    }
  }

  function startLessonPhase() {
    const spec = phase === 'transfer' ? lessonDef.transfer : lessonDef.guided;
    (state.teacherStep ??= {})[lessonDef.id] = phase;
    store.save(state);
    $('task-payoff').hidden = true;
    $('task-show').hidden = false;
    $('task-easier').hidden = phase !== 'transfer';
    runTask(spec, {
      title: lessonDef.title,
      badge: phase === 'transfer' ? 'ON YOUR OWN: no names, help if you get stuck' : 'GUIDED: names on, help shown',
      onDone: (res) => finishLessonPhase(res),
    });
  }

  function finishLessonPhase(res) {
    const skillId = lessonDef.skillIds[0];
    const assisted = phase === 'guided';
    // ☠️ Codex lessons round: replaying a COMPLETED lesson restarted at
    // guided and every attempt wrote mastery evidence, so one bad replay
    // demoted an independent or retained skill while the row still said
    // Complete. A voluntary replay is PRACTICE: it never moves the ledger.
    const isReplay = !!doneLessons()[lessonDef.id];
    if (!isReplay) recordAttempt(mastery(), skillId, {
      passed: res.passed, assisted, novel: false, now: Date.now(), note: res.note ?? '',
    });
    jlog('teacher_task', { lesson: lessonDef.id, phase, passed: res.passed, note: res.note ?? '' });
    if (!res.passed) {
      $('task-msg').textContent = '✗ ' + (res.note ?? '') + ' Not a problem: same task, fresh go. ' + lessonDef.passRule + '.';
      $('task-start').hidden = false;
      $('task-start').textContent = '↺ Run it back';
      store.save(state);
      return;
    }
    if (phase === 'guided') {
      phase = 'transfer';
      state.teacherStep[lessonDef.id] = 'transfer';
      store.save(state);
      comboFlash('NOW ON YOUR OWN');
      $('task-msg').textContent = '✓ ' + (res.note ?? '') + ' Now the same skill with the help off, on material you have not drilled.';
      $('task-start').hidden = false;
      $('task-start').textContent = '▶ On your own';
      // 13th council: the early payoff, hear the skill inside a real song
      // right now, help on. Optional, never gates anything.
      const rep = SKILL_REPERTOIRE[lessonDef.skillIds[0]];
      if (rep?.payoff && launchSong) {
        const s = (SONGS ?? []).find((x) => x.id === rep.payoff.songId);
        const btn = $('task-payoff');
        btn.hidden = false;
        btn.textContent = 'Hear it in a song, ' + (s?.title ?? rep.payoff.songId) + ' (with help)';
        btn.onclick = () => {
          jlog('path_payoff', { lesson: lessonDef.id, song: rep.payoff.songId });
          launchSong({ ...rep.payoff, wait: true });
        };
      }
      return;
    }
    // transfer passed: the lesson is genuinely done. A REPLAY pass keeps its
    // original completion time and says what it is (practice went well).
    if (!isReplay) doneLessons()[lessonDef.id] = Date.now();
    delete state.teacherStep[lessonDef.id];
    markPracticedToday();
    awardXp?.('lessonCleared', lessonDef.id);
    store.save(state);
    comboFlash(isReplay ? 'REPLAY ✓' : 'STEP CLEARED');
    $('task-msg').textContent = isReplay
      ? '✓ ' + (res.note ?? '') + ' Good practice. "' + lessonDef.title + '" was already yours; nothing changed on the ledger.'
      : '✓ ' + (res.note ?? '') + ' "' + lessonDef.title + '" is yours. ' + SKILL_BY_ID[lessonDef.skillIds[0]].name + ' is now "on your own".';
    $('task-start').hidden = true;
    setTimeout(() => { if (!$('screen-task').hidden) openPath(); }, 2400);
  }

  let introWindow = new Set(); // same roll/staccato tolerance as the tasks
  function setIntroTarget(sym, midis) {
    introTarget = { sym, midis: [...midis] };
    introHeld.clear();
    introWindow.clear();
    introCount = 0;
  }
  function introNote(m, isDown) {
    if (!introTarget) return;
    if (!isDown) { view?.keyUp(m); introHeld.delete(m); return; }
    view?.keyDown(m, m < 60 ? 'L' : 'R');
    introHeld.add(m);
    introWindow.add(m); // survives a quick release, real chords are rolled
    clearTimeout(introTimer);
    introTimer = setTimeout(() => {
      if (!introTarget) return;
      const want = new Set(introTarget.midis);
      const held = [...new Set([...introWindow, ...introHeld])];
      const match = held.length === want.size && held.every((x) => want.has(x));
      if (match) {
        introCount++;
        for (const mm of held) view.burst(mm, 'perfect');
        comboFlash('✓ ' + introTarget.sym);
        $('task-msg').textContent = '✓ YES: that is ' + introTarget.sym + '! ×' + introCount +
          '. Play it again, or press the orange button when you are ready.';
        for (const mm of held) view.keyUp(mm);
        introHeld.clear();
        introWindow.clear();
      } else if (held.some((x) => !want.has(x))) {
        $('task-msg').textContent = 'Almost, press only the LIT keys, all together: ' +
          [...want].sort((a, b) => a - b).map(noteName).join(' + ') + '.';
        introWindow.clear(); // a judged miss must not poison the next try
      }
      // correct-but-partial: say nothing, keep waiting, never a fail
    }, 350);
  }

  // ---- the six task types ----
  function runTask(spec, opts) {
    introTarget = null;
    clearTimeout(introTimer);
    introHeld.clear();
    $('task-start').hidden = true;
    $('task-stage').hidden = false;
    // setTextKeeping: the drawn badge is a styled mono span inside the box;
    // bare textContent replaced it with unstyled inherited text
    setTextKeeping($('task-badge'), opts.badge ?? '');
    $('task-sheet').hidden = true;
    const help = spec.help !== false;
    setKeyboard(48, 83, help);
    task = { spec, opts, help, held: new Set(), results: [], idx: 0, lastVoicing: null, t0: 0 };

    if (spec.type === 'pulse') return startPulse();
    if (spec.type === 'read') return startRead();
    if (spec.type === 'chord') return startChordRound();
    if (spec.type === 'inversion') return startSeqRound('inversion');
    if (spec.type === 'twohand') return startSeqRound('twohand');
    if (spec.type === 'leadsheet') return startLeadSheet();
  }

  function finish(passed, note) {
    const t = task;
    task = null;
    stopClicks();
    t.opts.onDone?.({ passed, note });
  }

  // 1) PULSE
  function startPulse() {
    const { beats, bpm } = task.spec;
    task.taps = [];
    task.clicks = [];
    slots(beats, []);
    setHTMLKeeping($('task-prompt'), '<span class="big-sym">Tap any key on every click</span>');
    $('task-msg').textContent = 'Count out loud: 1 2 3 4. Land WITH the click.';
    task.clicks = runClicks(bpm, beats,
      (i) => slots(beats, Array.from({ length: beats }, (_, k) => (k <= i ? 'clean' : 'todo'))),
      (times) => {
        const sc = pulseScore(task.taps, times);
        const dir = sc.medianMs > 25 ? ' You are landing after the click.' : sc.medianMs < -25 ? ' You are landing before the click.' : '';
        finish(sc.passed, sc.inside + ' of ' + sc.of + ' inside 150ms, typical offset ' + sc.medianMs + 'ms.' + dir);
      });
  }

  // 2) READ (diagnostic only): single notes, no help
  function startRead() {
    task.notes = [...task.spec.notes];
    slots(task.notes.length, []);
    nextRead();
  }
  function nextRead() {
    const m = task.notes[task.idx];
    setHTMLKeeping($('task-prompt'), '<span class="big-sym">' + noteName(m) + '</span><span class="sym-sub">play this note</span>');
    bindWatermark(noteName(m));
    if (task.help) view.targets = new Set([m]);
  }

  // 3) CHORD symbols
  function startChordRound() {
    task.pool = [...task.spec.pool];
    task.round = Array.from({ length: 5 }, (_, i) => task.pool[i % task.pool.length]);
    slots(5, []);
    nextChord();
  }
  function nextChord() {
    const sym = task.round[task.idx];
    const ms = triadMidis(sym);
    setHTMLKeeping($('task-prompt'), '<span class="big-sym">' + sym + '</span><span class="sym-sub">play this chord, all notes together</span>');
    bindWatermark(sym);
    syncHeldCells();
    view.targets = task.help ? new Set(ms) : new Set();
    $('task-msg').textContent = task.help ? 'Lit on the keyboard below.' : 'No help now: work it out from the symbol.';
  }

  // 4/5) INVERSION and TWOHAND sequences
  function startSeqRound(kind) {
    task.kind = kind;
    task.seq = [...task.spec.seq, task.spec.seq[0]]; // return home: 5 changes
    slots(task.seq.length, []);
    task.lastVoicing = null;
    nextSeq();
  }
  function nextSeq() {
    const sym = task.seq[task.idx];
    const want = task.kind === 'inversion' && task.lastVoicing
      ? nearestVoicing(sym, task.lastVoicing) : triadMidis(sym);
    task.want = want;
    const sub = task.kind === 'twohand'
      ? 'left hand the root, right hand the chord, TOGETHER'
      : task.lastVoicing ? 'move as little as possible' : 'start in root position';
    setHTMLKeeping($('task-prompt'), '<span class="big-sym">' + sym + '</span><span class="sym-sub">' + sub + '</span>');
    bindWatermark(sym);
    syncHeldCells();
    view.targets = task.help
      ? new Set(task.kind === 'twohand' ? [...want, lhRoot(want[0])] : want)
      : new Set();
    task.lhAt = null; task.rhAt = null;
  }

  // 6) LEAD SHEET: bars scroll on a click track
  function startLeadSheet() {
    const { bars, bpm } = task.spec;
    task.bars = bars;
    task.barHits = bars.map(() => null);
    $('task-sheet').hidden = false;
    $('task-sheet').innerHTML = bars.map((b, i) =>
      '<span class="ls-bar" data-i="' + i + '"><b>' + b + '</b><i></i></span>').join('');
    setHTMLKeeping($('task-prompt'), '<span class="sym-sub">Read one bar ahead. Both hands on beat 1 of each bar.</span>');
    slots(bars.length, []);
    task.lastVoicing = null;
    const beats = bars.length * 4;
    task.barTimes = [];
    runClicks(bpm, beats,
      (i, when) => {
        if (i % 4 !== 0) return;
        const bar = i / 4;
        task.barTimes[bar] = when;
        task.curBar = bar;
        for (const el of $('task-sheet').querySelectorAll('.ls-bar')) el.classList.toggle('now', +el.dataset.i === bar);
      },
      () => {
        const good = task.barHits.filter(Boolean).length;
        const need = task.bars.length;
        finish(good === need, good + ' of ' + need + ' bars landed.');
      });
  }

  // ---------- input: every task judges the same two events ----------
  function noteOn(m) {
    if (!task) { introNote(m, true); return; }
    view?.keyDown(m, m < 60 ? 'L' : 'R');
    const t = performance.now();
    const spec = task.spec;

    if (spec.type === 'pulse') { task.taps.push(t); view.burst(m, 'good'); return; }

    if (spec.type === 'read') {
      const want = task.notes[task.idx];
      const ok = m === want;
      task.results.push(ok);
      slots(task.notes.length, task.results.map((r) => (r ? 'clean' : 'recov')));
      if (ok) view.burst(m, 'perfect');
      task.idx++;
      if (task.idx >= task.notes.length) {
        const n = task.results.filter(Boolean).length;
        return finish(n >= task.notes.length - 1, n + ' of ' + task.notes.length + ' read correctly.');
      }
      return nextRead();
    }

    task.held.add(m);
    syncHeldCells();
    // the attempt WINDOW keeps every note of this try even after its key is
    // released, a real player rolls chords and plays staccato, and judging
    // only the still-held keys silently rejected honest G chords
    // (Mark, live, 2026-08-28)
    (task.window ??= new Set()).add(m);
    if (spec.type === 'twohand' || task.kind === 'twohand') {
      if (m < 60 && task.lhAt == null) task.lhAt = t;
      if (m >= 60 && task.rhAt == null) task.rhAt = t;
    }
    clearTimeout(task.settle);
    task.settle = setTimeout(() => judgeHeld(), 350); // rolled chords settle slowly
  }

  function noteOff(m) {
    if (!task) { introNote(m, false); return; }
    view?.keyUp(m);
    task.held.delete(m);
    // held cells keep showing the ATTEMPT (task.window), so a rolled or
    // staccato build never watches its own notes vanish; they clear on judge
  }

  // clearing a resolved prompt must lift the LATCHED keys visually too
  function releaseHeld() {
    if (!task) return;
    for (const m of task.held) view?.keyUp(m);
    task.held.clear();
    task.window?.clear();
    syncHeldCells();
    task.nudged = false; task.rearmed = false;
  }
  function clearAttempt() { // a judged-wrong try must not poison the next one
    task.window?.clear();
    task.nudged = false; task.rearmed = false;
  }

  function judgeHeld() {
    if (!task) return;
    const spec = task.spec;
    // judge the UNION of this attempt's window and the still-held keys
    const held = [...new Set([...(task.window ?? []), ...task.held])];
    if (!held.length) return;
    // roll tolerance: a correct-so-far PARTIAL chord is never a miss, nudge
    // once, give it one longer settle, and wait for the rest of the fingers
    const wantOf = () => {
      if (spec.type === 'chord') return triadMidis(task.round[task.idx]).map((x) => x % 12);
      if (spec.type === 'inversion' || spec.type === 'twohand') return triadMidis(task.seq[task.idx]).map((x) => x % 12);
      if (spec.type === 'leadsheet') return triadMidis(task.bars[task.curBar ?? 0]).map((x) => x % 12);
      return null;
    };
    const want = wantOf();
    if (want) {
      const judged = (spec.type === 'twohand' || spec.type === 'leadsheet')
        ? held.filter((x) => x >= 60) : held;
      const pcsHeld = new Set(judged.map((x) => x % 12));
      if (pcsHeld.size > 0 && pcsHeld.size < new Set(want).size && [...pcsHeld].every((pc) => want.includes(pc))) {
        if (!task.nudged) { task.nudged = true; $('task-msg').textContent = 'Good start, add the rest of the chord.'; }
        if (!task.rearmed) {
          task.rearmed = true;
          clearTimeout(task.settle);
          task.settle = setTimeout(() => judgeHeld(), 800);
        }
        return;
      }
    }

    if (spec.type === 'chord') {
      const sym = task.round[task.idx];
      const ok = chordMatches(held, triadMidis(sym).map((x) => x % 12));
      if (!ok) {
        task.missN = (task.missN ?? 0) + 1;
        const recipe = sym + ' recipe: press ' + sym[0] + ', skip a white key, press, skip one, press.';
        if (task.help || task.missN >= 2) {
          view.targets = new Set(triadMidis(sym));
          if (task.missN >= 2) view.kbLetters = true;
          $('task-msg').textContent = 'You held ' + held.map(noteName).join(' + ') + '. ' + sym + ' is ' +
            triadMidis(sym).map(noteName).join(' + ') + ', lit up' + (task.missN >= 2 ? ', names on. Copy the lights.' : '.');
        } else {
          $('task-msg').textContent = 'Not ' + sym + ' yet. ' + recipe + ' One more miss and I will light it up.';
        }
        task.missed = true;
        clearAttempt();
        return;
      }
      view.burst(held[0], task.missed ? 'good' : 'perfect');
      task.results.push(!task.missed);
      task.missed = false;
      task.missN = 0;
      view.kbLetters = task.help;
      slots(5, task.results.map((r) => (r ? 'clean' : 'recov')));
      task.idx++;
      releaseHeld();
      if (task.idx >= task.round.length) {
        const n = task.results.filter(Boolean).length;
        return finish(n >= 4, n + ' of 5 voiced right first try.');
      }
      return nextChord();
    }

    if (spec.type === 'inversion' || spec.type === 'twohand') {
      const sym = task.seq[task.idx];
      const pcs = triadMidis(sym).map((x) => x % 12);
      const rh = held.filter((x) => x >= 60);
      const lh = held.filter((x) => x < 60);
      const chordPart = spec.type === 'twohand' ? rh : held;
      if (!chordMatches(chordPart, pcs)) {
        task.missN = (task.missN ?? 0) + 1;
        if (task.help || task.missN >= 2) {
          const lit = spec.type === 'twohand' ? [...task.want, lhRoot(task.want[0])] : task.want;
          view.targets = new Set(lit);
          if (task.missN >= 2) view.kbLetters = true;
          $('task-msg').textContent = sym + ' is ' + task.want.map(noteName).join(' + ') +
            (spec.type === 'twohand' ? ' plus a low ' + NOTE_NAMES[task.want[0] % 12] + ' in the left hand' : '') +
            ', lit up' + (task.missN >= 2 ? ', names on. Copy the lights.' : '.');
        } else {
          $('task-msg').textContent = 'Not ' + sym + ' yet. It needs ' + pcs.map((pc) => NOTE_NAMES[pc]).join(' + ') +
            '. One more miss and I will light it up.';
        }
        task.missed = true;
        clearAttempt();
        return;
      }
      let ok = !task.missed;
      let why = '';
      if (spec.type === 'inversion') {
        if (task.lastVoicing && !usedNearest(chordPart, sym, task.lastVoicing)) {
          ok = false;
          const want = nearestVoicing(sym, task.lastVoicing);
          why = ' Nearer was ' + want.map(noteName).join(' + ') + '.';
        }
      } else {
        const rootPc = triadMidis(sym)[0] % 12;
        if (!lh.length || lh.every((x) => x % 12 !== rootPc)) { ok = false; why = ' Left hand needs the root, ' + NOTE_NAMES[rootPc] + '.'; }
        else {
          const gap = togetherGap(task.lhAt, task.rhAt);
          if (gap != null && gap > 120) { ok = false; why = ' Hands were ' + Math.round(gap) + 'ms apart, aim under 120.'; }
        }
      }
      view.burst(chordPart[0], ok ? 'perfect' : 'good');
      task.results.push(ok);
      if (why) $('task-msg').textContent = why.trim();
      slots(task.seq.length, task.results.map((r) => (r ? 'clean' : 'recov')));
      task.lastVoicing = [...chordPart].sort((a, b) => a - b);
      task.missed = false;
      task.missN = 0;
      view.kbLetters = task.help;
      task.idx++;
      releaseHeld();
      if (task.idx >= task.seq.length) {
        const n = task.results.filter(Boolean).length;
        return finish(n >= 4, n + ' of ' + task.seq.length + ' changes clean.');
      }
      return nextSeq();
    }

    if (spec.type === 'leadsheet') {
      const bar = task.curBar ?? 0;
      if (task.barHits[bar]) return;
      const sym = task.bars[bar];
      const rh = held.filter((x) => x >= 60);
      const lh = held.filter((x) => x < 60);
      const pcs = triadMidis(sym).map((x) => x % 12);
      if (!chordMatches(rh.length ? rh : held, pcs)) { clearAttempt(); return; }
      const rootPc = pcs[0];
      const rootOk = !lh.length || lh.some((x) => x % 12 === rootPc);
      task.barHits[bar] = rootOk;
      const el = $('task-sheet').querySelector('[data-i="' + bar + '"]');
      el?.classList.add(rootOk ? 'hit' : 'part');
      view.burst((rh[0] ?? held[0]), rootOk ? 'perfect' : 'good');
      slots(task.bars.length, task.barHits.map((h) => (h === null ? 'todo' : h ? 'clean' : 'recov')));
      releaseHeld();
    }
  }

  // ---------- diagnostic ----------
  let diagIdx = 0;
  function startDiagnostic() {
    diagIdx = 0;
    nextDiagnostic();
  }
  function nextDiagnostic() {
    if (diagIdx >= DIAGNOSTIC.length) {
      state.diagnosticDone = Date.now();
      store.save(state);
      comboFlash('CHECK-IN DONE');
      openTaskScreen('Check-in complete', [
        'That is all I needed. Your path below is now built from what you actually played, not from a guess.',
        'Anything you already showed me is marked as met; anything you skipped simply starts at the beginning.',
      ]);
      $('task-start').hidden = true;
      setTimeout(() => openPath(), 2000);
      return;
    }
    const d = DIAGNOSTIC[diagIdx];
    openTaskScreen('Check-in ' + (diagIdx + 1) + ' of ' + DIAGNOSTIC.length, [d.prompt]);
    $('task-start').hidden = false;
    $('task-start').textContent = '▶ Go';
    $('task-msg').textContent = 'No score here. This only tells me where to start you.';
    setKeyboard(48, 83, true);
  }
  function runDiagnosticStep() {
    const d = DIAGNOSTIC[diagIdx];
    runTask({ ...d, help: false }, {
      badge: 'CHECK-IN: nothing is being graded',
      onDone: (res) => {
        // a diagnostic only ever OPENS a skill; it can never grant independence
        recordAttempt(mastery(), d.skillId, { passed: res.passed, assisted: true, now: Date.now(), note: 'check-in: ' + (res.note ?? '') });
        store.save(state);
        $('task-msg').textContent = (res.passed ? '✓ ' : '· ') + (res.note ?? '');
        diagIdx++;
        setTimeout(nextDiagnostic, 1100);
      },
    });
  }

  // ---------- assessment: novel material, no help, retention-grade ----------
  function startAssessment() {
    openTaskScreen(ASSESSMENT.title, [
      'Eight bars in an order no lesson has drilled. No key names, no lit keys, no second go.',
      'This is the only honest test of whether the skill is yours: new material, unaided.',
    ]);
    $('task-start').textContent = '▶ Begin';
    $('task-start').onclick = () => {
      runTask({ type: 'leadsheet', bars: ASSESSMENT.bars, bpm: ASSESSMENT.bpm, help: false }, {
        badge: 'ASSESSMENT: novel material',
        onDone: (res) => {
          const hits = res.note ?? '';
          const passed = res.passed || /([7-8]) of 8/.test(hits);
          for (const sid of ['lead-sheet', 'inversion', 'two-hand', 'chord-symbol']) {
            recordAttempt(mastery(), sid, { passed, assisted: false, novel: true, now: Date.now(), note: 'assessment: ' + hits });
          }
          state.teacherAssessed = passed ? Date.now() : 0;
          markPracticedToday();
          store.save(state);
          jlog('teacher_assessment', { passed, note: hits });
          comboFlash(passed ? 'ASSESSMENT PASSED ★' : 'NOT YET');
          $('task-msg').textContent = (passed ? '★ ' : '· ') + hits +
            (passed ? ' That is Teacher Loop v1 complete: you can play a pop song from a lead sheet.'
                    : ' Needed 7 of 8. Nothing is lost, the path will point you at the weak part.');
          setTimeout(() => openPath(), 2800);
        },
      });
    };
  }

  // ---------- technique checkpoint (self-screening, never an app verdict) ----------
  function openTechnique() {
    openTaskScreen('Technique check', [
      'MIDI can hear what you played. It cannot see YOU: it has no idea about your wrist, your shoulders or your hand shape.',
      'So this one is yours to judge. Film ten seconds on your phone, from the side, then answer honestly.',
    ]);
    $('task-start').hidden = true;
    $('task-keys').hidden = true;
    const el = $('task-rubric');
    el.hidden = false;
    el.innerHTML = '<h3>Watch the clip and check each one</h3>' +
      '<div class="form-checks">' + TECHNIQUE_RUBRIC.map((r) =>
        '<label class="form-check"><span>' + r.check + '</span>' +
        '<select class="ctl-select" data-r="' + r.id + '">' +
        '<option value="">–</option><option value="ok">Fine</option><option value="no">Needs work</option>' +
        '</select></label>').join('') + '</div>' +
      '<p class="form-teacher">' + TECHNIQUE_STOP_RULE + '</p>' +
      '<div class="echo-actions"><button id="tech-save" class="tool accent">Save this check</button></div>';
    el.querySelector('#tech-save').addEventListener('click', () => {
      const answers = {};
      for (const sel of el.querySelectorAll('[data-r]')) answers[sel.dataset.r] = sel.value;
      (state.technique ??= []).push({ t: Date.now(), answers });
      if (state.technique.length > 30) state.technique.shift();
      store.save(state);
      jlog('technique_check', answers);
      const pain = answers.pain === 'no';
      $('task-msg').textContent = pain
        ? '⚠ You flagged pain. Stop for today. This app cannot diagnose that, please raise it with a teacher or a doctor.'
        : '✓ Logged. Re-check it whenever a piece starts feeling like hard work.';
      comboFlash('CHECKED');
    });
  }

  // Show me (Mark 2026-08-25: "show me what to do and let me replay it"):
  // lights and plays the current ask; press it as often as you like.
  function showMe() {
    const spec = task ? task.spec : (lessonDef && (phase === 'transfer' ? lessonDef.transfer : lessonDef.guided));
    if (!spec) return;
    if (spec.type === 'pulse') {
      $('task-msg').textContent = 'Listen: four clicks. Press any key WITH each click.';
      runClicks(spec.bpm ?? 70, 4, null, null);
      return;
    }
    const sym = task
      ? (task.round?.[task.idx] ?? task.seq?.[task.idx] ?? task.bars?.[task.curBar ?? 0])
      : (spec.pool?.[0] ?? spec.seq?.[0] ?? spec.bars?.[0]);
    if (!sym) return;
    const want = task?.kind === 'inversion' && task?.lastVoicing
      ? nearestVoicing(sym, task.lastVoicing) : triadMidis(sym);
    const withRoot = (spec.type === 'twohand' || spec.type === 'leadsheet');
    const lit = withRoot ? [...want, lhRoot(want[0])] : want;
    view.kbLetters = true;
    view.targets = new Set(lit);
    playPreview(lit.map((m) => ({ b: 0, d: 2, m, h: m < 60 ? 'L' : 'R' })), 600, null, null);
    $('task-msg').textContent = 'This is ' + sym + ': ' + [...lit].sort((a, b) => a - b).map(noteName).join(' + ') +
      ', lit up. ' + (task ? 'Copy it.' : 'TRY IT NOW: press the lit keys together and I will tell you if you got it.');
    if (task && !task.help) task.missed = true; // honesty: this prompt is now assisted
    if (!task) setIntroTarget(sym, lit);
  }

  // ---------- events ----------
  $('btn-path').addEventListener('click', openPath);
  $('path-home').addEventListener('click', () => { show('library'); ctx.renderLibrary(); });
  $('path-technique').addEventListener('click', openTechnique);
  $('task-start').addEventListener('click', () => $('task-prestart-live')?.remove());
  $('task-back').addEventListener('click', openPath);
  $('task-show').addEventListener('click', showMe);
  $('task-easier').addEventListener('click', () => {
    if (!lessonDef) return;
    (state.teacherStep ??= {})[lessonDef.id] = 'guided';
    store.save(state);
    openLesson(lessonDef); // back to the with-help round, teach text and all
  });
  $('task-kb').addEventListener('click', () => {
    const c = $('task-keys');
    c.hidden = !c.hidden;
    $('task-kb').textContent = c.hidden ? 'Show keyboard' : 'Hide keyboard';
    if (!c.hidden) { view.resize(); drawKeys(); }
  });
  // Tap input LATCHES for chord tasks: the old 200ms auto-release made building
  // a three-note chord one finger at a time impossible (found live 2026-08-25).
  // Tapping a latched key again lifts it, so a wrong note is correctable.
  // harvest the 11c stage templates before anything wipes them, then stand
  // the drawn SAMPLE VALUES down ("C", "E flat", "2 of 3 clean builds banked",
  // the Cm7 watermark): they are the design's specimens, not app state
  if (CANON_ON) {
    if (heldModule()) { const h = $('task-slots'); while (h.firstChild) h.firstChild.remove(); }
    if (roundModule()) bindRound(3, []);
    bindWatermark('');
    // the board's remaining sample VALUES, blanked byte for byte (labels stay)
    for (const sample of ['Cm7', 'Root position, left hand alone, name the notes as you place them.',
      'That was a G sharp. The seventh of Cm7 is B flat.', 'STAGE 4, INDEPENDENT']) {
      const l = [...document.querySelectorAll('#screen-task *')]
        .find((e) => !e.children.length && e.textContent.trim() === sample && !e.closest('[data-legacy-screen]'));
      if (l) l.textContent = '';
    }
  }

  const CHORD_TASKS = new Set(['chord', 'inversion', 'twohand', 'leadsheet']);
  $('task-keys').addEventListener('pointerdown', (e) => {
    if (!view) return;
    const r = e.currentTarget.getBoundingClientRect();
    const sc = e.currentTarget.clientWidth / r.width;   // zoom-safe taps
    // same anchor as drawKeys: the keys live in the bottom kbH of the canvas
    const m = view.pickKeyAt((e.clientX - r.left) * sc, (e.clientY - r.top) * sc, view.h - view.kbH, view.kbH);
    if (m == null) return;
    const latching = (task && CHORD_TASKS.has(task.spec.type)) || (!task && introTarget && introTarget.midis.length > 1);
    const heldSet = task ? task.held : introHeld;
    if (latching && heldSet.has(m)) { noteOff(m); return; } // tap again to lift
    playPreview([{ b: 0, d: 0.8, m, h: m < 60 ? 'L' : 'R' }], 300, null, null);
    const owner = task; // a release must never reach into the NEXT task chord
    noteOn(m);
    if (!latching) setTimeout(() => { if (task === owner) noteOff(m); else view?.keyUp(m); }, 200);
  });
  $('path-go').addEventListener('click', () => {
    if (!rx) return;
    if (rx.kind === 'diagnostic') return startDiagnostic();
    if (rx.kind === 'assessment') return startAssessment();
    if (rx.kind === 'review' || rx.kind === 'skill') {
      const les = TEACHER_LESSONS.find((l) => l.id === rx.lessonId) ||
        TEACHER_LESSONS.find((l) => l.skillIds.includes(rx.skillId));
      if (les) {
        openLesson(les);
        if (rx.kind === 'review') {
          // a review IS the unaided check, say so before he presses Start
          // (the button used to promise a guided go, Codex review P2)
          phase = 'transfer';
          $('task-start').textContent = '▶ Continue: on your own';
          $('task-easier').hidden = false;
        }
      }
      return;
    }
    if (rx.kind === 'lesson') return openLesson(TEACHER_LESSONS.find((l) => l.id === rx.lessonId));
    // song-shaped prescriptions launch through the app's one launcher
    if (rx.kind === 'proof' || rx.kind === 'repertoire' || rx.kind === 'song-review') return runPrescription?.(rx);
  });
  $('task-start').addEventListener('click', () => {
    if ($('task-title').textContent.startsWith('Check-in')) return runDiagnosticStep();
    if (lessonDef) return startLessonPhase();
  });

  return {
    openPath, renderTeaser,
    noteOn: (m) => { if (!$('screen-task').hidden) noteOn(m); },
    noteOff: (m) => { if (!$('screen-task').hidden) noteOff(m); },
    active: () => !$('screen-task').hidden || !$('screen-path').hidden,
  };
}
