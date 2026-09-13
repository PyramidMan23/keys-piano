// The learning wave's surfaces: the reading lane, the skill quests, the
// "Understand this passage" card and the daily route.
//
// Why this file exists at all: app.mjs is already 4800 lines, and every one of
// these is a SCREEN's worth of machinery. The rule followed here is the same
// one path.mjs follows: app.mjs owns the wiring (screens, routing, MIDI, the
// engine) and hands this module a context object; this module owns the markup
// it draws and every timer, click and lit key it starts.
//
// Three laws this file is built around, all of them paid for already:
//  1. LEAVING A SCREEN ENDS WHAT THE SCREEN STARTED. Every deferred thing here
//     carries a generation check and `leave()` kills the lot.
//  2. A subtree the APP draws inside a canon board is exempt from the canon
//     reset, and the exemption is written in the same edit (style.css).
//  3. Assistance is normal and earns PRACTICE credit. It never earns
//     independent, retained or transfer credit, and the copy says which is which
//     at the moment it happens, not afterwards.

import { readingPlan, presentExercise, abandonPresentation, presentationValid,
  sessionPolicy, readingSummary, CONTAMINANTS } from './reading-session.mjs';
import { ScoreView } from './score.mjs';
import { Engine } from './engine.mjs';
import { evidenceStrands, freshReadDue } from './game.mjs';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const fact = (dl, term, value) => {
  if (value == null || value === '') return;
  dl.append(el('dt', null, term), el('dd', null, String(value)));
};

export function installLearningUI(ctx) {
  const { state, store, show, jlog } = ctx;
  // js/learning-lab.mjs, injected by app.mjs after boot so this module never
  // has to know how it was loaded. Null until then, and every surface that
  // reads it says what is missing rather than drawing an empty shelf.
  let lab = null;
  let generation = 0;          // every screen entry invalidates the last one's timers
  let readingScore = null;     // the preparation ScoreView, rebuilt per plan
  let readingPlanShown = null;

  // ---- reading lane ---------------------------------------------------------

  const readingMode = () => (state.lib?.readingMode === 'first' ? 'first' : 'learn');
  const intentOf = (mode) => (mode === 'first' ? 'first-read' : 'practice');

  // SHORT AND ACTIONABLE. Two sentences: what to do, and the one thing that
  // makes this activity different from the other one. The reasoning, the
  // evidence vocabulary and the pool arithmetic all live in the disclosure
  // under the score, where someone who wants them can find them and a beginner
  // trying to start playing does not have to read past them.
  const MODE_COPY = {
    learn: 'Work it out. The notes wait for you, you can stop, and you can play it again.',
    first: 'Read it once, straight through: music you have not seen, help off. Wrong notes are fine; stopping is the thing to train out.',
  };
  const MODE_WHY = {
    learn: 'Learn mode is practice. Because you are helped here, a clean run says you worked the notes out, ' +
      'not that you can read music at sight. It still moves the level ladder and it still earns practice credit.',
    first: 'A first reading is the test: music you have not seen, in time, with the help off. ' +
      'Pitch, rhythm and keeping going are reported apart, because they are different problems. ' +
      'Help stays available the whole time. Taking it does not waste the read, it turns it into practice, and the app says so the moment you take it.',
  };

  function syncReadingMode() {
    const mode = readingMode();
    for (const [id, want] of [['reading-mode-learn', 'learn'], ['reading-mode-first', 'first']]) {
      const b = $(id);
      if (!b) continue;
      b.dataset.on = String(mode === want);
      b.setAttribute('aria-checked', String(mode === want));
      b.tabIndex = mode === want ? 0 : -1;
    }
    $('reading-what').textContent = MODE_COPY[mode];
    $('reading-why').textContent = MODE_WHY[mode];
  }

  // ---- THE PRESENTATION LIFECYCLE -------------------------------------------
  // reading-session's rule, followed exactly: `readingPlan` is a pure getter
  // that records nothing, and `presentExercise` is the call that SPENDS the
  // music. Studying a score and walking away costs the piece, because he saw
  // it; so the presentation happens at the moment the notation is actually
  // DRAWN, never when it is hidden and never for a facts line alone.
  //
  // Three rules fall out of that, and all three are bugs if broken:
  //  - a settings-only redraw (tempo, count-in, pulse, mode) must re-use the
  //    SAME presented exercise and the SAME receipt. Re-presenting would deal
  //    fresh music every time a checkbox moved.
  //  - leaving without playing, or replacing the exercise, abandons the
  //    receipt. The exposure stays spent; the one first-read chance dies.
  //  - the receipt goes into readAttempt. Without it a read can never be a
  //    first reading under the new rules.
  let presented = null;       // { plan, presentation, drawn }
  let readingLive = false;    // a read is out on the play screen right now

  const tempoChoice = () => (state.lib?.readingTempo ?? 100) / 100;
  const scoreHidden = () => !!state.lib?.readingHideScore;

  function abandonPresented(why) {
    if (!presented) return;
    abandonPresentation(presented.presentation);
    jlog('reading_abandon', { why, level: presented.plan?.level ?? null });
    presented = null;
    readingLive = false;
  }

  // Spend one piece of music and hand back everything the read needs. Called
  // when the notation goes on screen, and by "Next exercise" from the results.
  function presentNext(intent = intentOf(readingMode()), tempo = tempoChoice()) {
    abandonPresented('replaced');
    const res = presentExercise(state.sight, { intent, tempo });
    // SAVE IMMEDIATELY: the exposure is banked in the returned ledger, and a
    // presentation that is not persisted is a piece of music spent twice.
    state.sight = res.reading;
    store.save(state);
    if (!res.exercise) return null;
    presented = { plan: res, presentation: res.presentation, drawn: true };
    jlog('reading_present', { level: res.level, novel: res.novel, key: res.exercise.key ?? null });
    return res;
  }

  function renderReadingPrep() {
    const mode = readingMode();
    const intent = intentOf(mode);
    const tempo = tempoChoice();
    // Re-use what is already on screen. A settings change re-reads the POLICY
    // from the same exercise; it never deals new music.
    let plan;
    if (presented && presentationValid(presented.presentation)) {
      plan = { ...presented.plan, intent,
        policy: sessionPolicy(presented.plan.level, intent, presented.plan.exercise, { tempo }) };
      presented.plan = plan;
    } else if (scoreHidden()) {
      // nothing is drawn, so nothing is spent: the pure getter answers the
      // facts line and the exercise is presented when Start is pressed
      plan = readingPlan(state.sight, { intent, tempo });
      presented = null;
    } else {
      plan = presentNext(intent, tempo) ?? readingPlan(state.sight, { intent, tempo });
    }
    readingPlanShown = plan;
    const facts = $('reading-prep-facts');
    facts.replaceChildren();
    const ex = plan.exercise;
    if (!ex) {
      $('reading-facts-line').textContent = 'No exercise at this level can be engraved: ' + (plan.engraving?.reason ?? 'unknown reason') + '.';
      $('reading-conditions').textContent = '';
      $('reading-prep-stave').replaceChildren();
      $('reading-go').disabled = true;
      return;
    }
    $('reading-go').disabled = false;
    const p = plan.policy;
    const lo = Math.min(...ex.notes.map((n) => n.m)), hi = Math.max(...ex.notes.map((n) => n.m));
    const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const nm = (m) => NAMES[m % 12] + (Math.floor(m / 12) - 1);
    const hands = new Set(ex.notes.map((n) => n.h)).size > 1 ? 'both hands'
      : ex.notes[0].h === 'L' ? 'left hand' : 'right hand';
    const bars = ex.bars ?? Math.ceil((ex.endBeat ?? 8) / (ex.timeSig?.[0] ?? 4));
    const tempoPct = Math.round(p.tempo * 100);

    // ONE line of what is in front of you, and one line of the conditions it
    // runs under. Everything else is in the disclosure.
    $('reading-facts-line').replaceChildren();
    const line = $('reading-facts-line');
    line.append(el('b', null, `${ex.key ?? 'no key'} · ${ex.timeSig ? ex.timeSig.join('/') : '4/4'} · ${bars} bars · ${hands}`));
    line.append(document.createTextNode(` · ${nm(lo)} to ${nm(hi)} · `));
    line.append(el('span', plan.novel ? 'lw-new' : 'lw-again',
      plan.novel ? 'new to you' : `read ${plan.timesRead}× before`));
    // The conditions a person has to know BEFORE pressing Start, in the
    // shortest true words: help, hands, tempo.
    $('reading-conditions').textContent =
      `Level ${plan.level} · help ${p.waitMode ? 'on' : 'off'} · ${hands} · ${tempoPct}% tempo` +
      (p.waitMode ? '' : ` · ${p.countIn.beats}-beat count-in`);

    fact(facts, 'Level', `${plan.level} of 5`);
    fact(facts, 'Key', ex.key ?? 'not stated');
    fact(facts, 'Meter', ex.timeSig ? ex.timeSig.join('/') : '4/4');
    fact(facts, 'Length', `${bars} bars, written at ${Math.round(ex.bpm)} bpm${tempoPct !== 100 ? `, played at ${tempoPct}% of it` : ''}`);
    fact(facts, 'Range', `${nm(lo)} to ${nm(hi)}, ${hands}`);
    fact(facts, 'New to you', plan.novel ? 'Yes, this music has not been dealt before'
      : `No: read ${plan.timesRead} time${plan.timesRead === 1 ? '' : 's'} already, so this is practice, not a fresh test`);
    fact(facts, 'Pool', `${plan.pool.seen} of ${plan.pool.size} distinct exercises at this level seen${plan.pool.exhausted ? ', all seen' : ''}`);
    fact(facts, 'Help', p.waitMode ? 'On: the notes wait for you' : 'Off: the clock runs');
    fact(facts, 'This counts as', p.evidence);
    $('reading-prep-note').textContent = mode === 'first'
      ? `Take about ${p.preview.seconds} seconds over the score first. It is never played to you: hearing it is not reading it. ` +
        'Press any key when you are ready, the count-in starts, and nothing restarts you after a wrong note. ' +
        'Choosing a slower tempo here is a reading choice, not a penalty: it is recorded as a condition of the read. ' +
        'Changing tempo, hands or the passage DURING the read is what turns it into practice.'
      : 'The score is here to study. Stop, work a bar out, play it again: that is what this mode is for.';
    drawReadingScore(ex);
  }

  function drawReadingScore(ex) {
    const host = $('reading-prep-stave');
    if (state.lib?.readingHideScore) { host.replaceChildren(); return; }
    host.replaceChildren();
    try {
      readingScore = new ScoreView(host);
      readingScore.build(ex, new Engine(ex, { waitMode: true }));
    } catch { host.replaceChildren(el('p', 'hint', 'The score could not be drawn here. It will still be drawn on the practice screen.')); }
  }

  // Three dimensions, printed apart, each with the sentence that says what it
  // is and is not. No composite number exists anywhere in this panel.
  function renderReadingResult(res) {
    const box = $('reading-result');
    if (!box) return;
    box.hidden = false;
    const rows = $('reading-result-rows');
    rows.replaceChildren();
    const row = (name, value, why, unknown = false) => {
      const r = el('div', 'lw-score');
      r.append(el('span', 'lw-score-name', name));
      const v = el('span', 'lw-score-val', value);
      if (unknown) v.dataset.unknown = '1';
      r.append(v, el('span', 'lw-score-why', why));
      rows.append(r);
    };
    row('Pitch', `${res.pitch.correct} / ${res.pitch.required}`,
      `${res.pitch.wrong} wrong, ${res.pitch.missed} missed. Which notes came out, nothing about when.`);
    if (res.rhythm.measured) {
      row('Rhythm', `median ${Math.abs(res.rhythm.median ?? 0)}ms ${(res.rhythm.median ?? 0) < 0 ? 'ahead' : 'behind'}`,
        `${res.rhythm.onTime} of ${res.rhythm.count} on time, ${res.rhythm.late} late. The middle value, not an average: a couple of wild notes do not move it.`);
    } else {
      row('Rhythm', 'not measured', res.rhythm.reason ?? CONTAMINANTS.assisted, true);
    }
    row('Keeping going', `longest run ${res.continuity.longestRun}`,
      `${res.continuity.stumbles} stumble${res.continuity.stumbles === 1 ? '' : 's'}. Reading continuously is the skill: this counts recoveries, not perfection.`);
    // ONE restrained milestone, and only for a thing that actually happened.
    // It is a line inside the panel the learner just opened, not an overlay,
    // never during playing, and the animation stands down under reduced motion.
    box.querySelector('.lw-milestone')?.remove();
    // announced ONLY on a real level change, which a part-scope read can never
    // cause (judgeSight holds the ladder for those)
    if (res.levelChanged) {
      const m = el('div', 'lw-milestone');
      m.append(el('i', null, '◆'), document.createTextNode(
        `Reading level ${res.level}. ${res.msg} The level moved on the reads recorded below, never on time spent.`));
      box.insertBefore(m, box.firstChild.nextSibling);
    }
    const ev = $('reading-result-evidence');
    ev.replaceChildren();
    // SCOPE IS PART OF THE CLAIM. A right-hand read is a read of the right
    // hand, and the sentence says so; only a whole-exercise read claims the
    // exercise. An unfinished read claims nothing at all, in either direction,
    // and the music still counts as seen because he saw it.
    // FOUR OUTCOMES, FOUR SENTENCES. "Alone" and "it came off" are different
    // facts and the words must not merge them: a read played alone that did not
    // come off used to be told "this counts as reading new music on your own".
    // `proof` is the only one of these that earns anything.
    const scopeWord = res.scopeFull === false ? ` (part of the exercise only: ${res.scope})` : '';
    const CREDIT_LINE = {
      'independent reading': `Clean, alone, on music you had not seen. This is the one that counts as reading${scopeWord}.`,
      'independent reading of a part': `Clean and unaided, on the part you chose${scopeWord}. Real evidence at that scope; not a read of the whole exercise, so the level did not move.`,
      'independent attempt': 'You read that alone, with no help, and it did not come off. That is what first reads are for: nothing was lost and nothing is claimed.',
      'guided practice': `Banked as guided practice${scopeWord}.`,
      none: 'Not finished, so nothing was banked either way, and a retry of it is practice. The music counts as seen.',
    };
    ev.append(document.createTextNode(CREDIT_LINE[res.credit] ?? CREDIT_LINE.none));
    if (res.credit !== 'none' && !res.proof && res.independent) {
      ev.append(document.createElement('br'),
        el('span', 'hint', 'No proof banked: proof needs a clean read of the whole exercise, alone, on music you had not seen.'));
    }
    if (res.tempoPct != null && res.tempoPct !== 100) {
      ev.append(document.createElement('br'),
        el('span', 'hint', `Read at ${res.tempoPct}% of the written tempo, chosen before you started. Recorded as a condition, not a penalty.`));
    }
    for (const c of res.contaminants ?? []) {
      const flag = el('span', 'lw-flag', CONTAMINANTS[c] ?? c);
      ev.append(document.createElement('br'), flag);
    }
    renderReadingProgress();
  }

  // One row per level. No global "reading ability" figure, because there is no
  // such number: level 2 and level 5 reading are different things.
  function renderReadingProgress() {
    const host = $('reading-progress');
    if (!host) return;
    const summary = readingSummary(state.sight);
    host.replaceChildren();
    for (const lvl of summary.levels) {
      const r = el('div', 'lw-score');
      r.append(el('span', 'lw-score-name', `Level ${lvl.level}${lvl.level === summary.level ? ' · current' : ''}`));
      const v = el('span', 'lw-score-val', lvl.line);
      if (!lvl.independentCleans && !lvl.guidedCleans) v.dataset.unknown = '1';
      // LIFETIME counts and the RECENT WINDOW are labelled apart. `reads`,
      // `independentCleans` and `guidedCleans` come from the monotonic ledger
      // and only ever go up; `recent` is the last 60 reads of detail, and the
      // partial scopes below are read off that window, so they say so.
      r.append(v, el('span', 'lw-score-why',
        `${lvl.reads} read${lvl.reads === 1 ? '' : 's'} all time · ${lvl.pool.seen} of ${lvl.pool.size} distinct exercises at this level seen` +
        (lvl.pool.exhausted ? ' (pool exhausted: no fresh test left at this level)' : '') +
        (lvl.partialScopeCleans ? ` · ${lvl.partialScopeCleans} clean at part scope all time, which does not move this level` : '') +
        (lvl.partialScopes?.length ? ` (recent scopes: ${lvl.partialScopes.join(', ')})` : '') +
        ` · detail kept for the last ${lvl.recent.window} reads (${lvl.recent.reads} here)`));
      host.append(r);
    }
    $('reading-progress-note').textContent = summary.legacy
      ? `${summary.legacy.reads} earlier reads are kept at level ${summary.legacy.level}. ${summary.legacy.note}`
      : 'Guided reads and unaided reads are counted apart, and neither is turned into a percentage.';
  }

  function openReading() {
    show('reading');          // show() bumps the generation itself, via leave()
    generation++;
    $('now-playing').textContent = 'Reading';
    syncReadingMode();
    renderReadingPrep();
    renderReadingProgress();
    $('reading-msg').textContent = '';
    $('reading-more').open = !!state.lib?.readingMoreOpen;
    $('reading-tempo').value = state.lib?.readingTempo ?? 100;
    $('reading-tempo-val').textContent = ($('reading-tempo').value) + '%';
    $('reading-countin').checked = state.readingCountIn !== false;
    $('reading-pulse').checked = state.readingPulse !== false;
    $('reading-prep-toggle').textContent = state.lib?.readingHideScore ? 'Show the score' : 'Hide the score';
    const lastRead = state.sight?.reads?.at(-1);
    if (lastRead?.pitch && lastRead?.rhythm && lastRead?.continuity) {
      const credit = !lastRead.completed || lastRead.verdict === 'abandoned' ? 'none'
        : lastRead.proof ? 'independent reading'
        : lastRead.independent && lastRead.verdict === 'clean' && lastRead.scopeFull === false
          ? 'independent reading of a part'
          : lastRead.independent ? 'independent attempt' : 'guided practice';
      renderReadingResult({ ...lastRead, credit, levelChanged: false });
    } else $('reading-result').hidden = true;
    jlog('reading_open', { mode: readingMode(), level: readingPlanShown?.level ?? null });
  }

  function wireReading() {
    const setMode = (mode) => {
      (state.lib ??= {}).readingMode = mode;
      store.save(state);
      syncReadingMode();
      renderReadingPrep();
      jlog('reading_mode', { mode });
    };
    $('reading-mode-learn')?.addEventListener('click', () => setMode('learn'));
    $('reading-mode-first')?.addEventListener('click', () => setMode('first'));
    // a radiogroup answers to the arrow keys, or it is a radiogroup in name only
    for (const id of ['reading-mode-learn', 'reading-mode-first']) {
      $(id)?.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        const next = readingMode() === 'learn' ? 'first' : 'learn';
        setMode(next);
        $(next === 'learn' ? 'reading-mode-learn' : 'reading-mode-first')?.focus();
      });
    }
    $('reading-back')?.addEventListener('click', () => { show('library'); ctx.renderLibrary(); });
    $('reading-more')?.addEventListener('toggle', () => {
      (state.lib ??= {}).readingMoreOpen = $('reading-more').open;
      store.save(state);
    });
    $('reading-tempo')?.addEventListener('input', () => {
      $('reading-tempo-val').textContent = $('reading-tempo').value + '%';
    });
    $('reading-tempo')?.addEventListener('change', () => {
      (state.lib ??= {}).readingTempo = +$('reading-tempo').value;
      store.save(state);
      $('reading-msg').textContent = +$('reading-tempo').value < 100
        ? 'Chosen before you start, a slower tempo is a reading condition, not a penalty. Moving it mid-read is what makes the read practice.'
        : '';
      renderReadingPrep();   // the conditions line and the pulse follow the choice
    });
    $('reading-countin')?.addEventListener('change', () => {
      state.readingCountIn = $('reading-countin').checked; store.save(state);
    });
    $('reading-pulse')?.addEventListener('change', () => {
      state.readingPulse = $('reading-pulse').checked; store.save(state);
    });
    $('reading-prep-toggle')?.addEventListener('click', () => {
      (state.lib ??= {}).readingHideScore = !state.lib?.readingHideScore;
      store.save(state);
      $('reading-prep-toggle').textContent = state.lib.readingHideScore ? 'Show the score' : 'Hide the score';
      renderReadingPrep();
    });
    $('reading-go')?.addEventListener('click', () => {
      const intent = intentOf(readingMode());
      // If the score was hidden, nothing has been spent yet: the read itself is
      // the presentation. If it was on screen, the receipt already exists and
      // this is the SAME music, not a fresh deal.
      const pre = (presented && presentationValid(presented.presentation))
        ? presented.plan : presentNext(intent, tempoChoice());
      if (!pre?.exercise) { $('reading-msg').textContent = 'No exercise could be prepared. Nothing was started.'; return; }
      readingLive = true;
      jlog('reading_start', { mode: readingMode(), tempo: tempoChoice(), level: pre.level, novel: pre.novel });
      ctx.startReading(intent, tempoChoice(), pre);
    });
    // A deliberate "deal me another one". It says what it costs, because the
    // pool is finite and a presentation spends a piece of it.
    $('reading-new')?.addEventListener('click', () => {
      // ☠️ NEVER SPEND MUSIC THAT IS NOT DRAWN. Presenting is what banks the
      // exposure, and with the score hidden nothing goes on screen: dealing
      // here would burn a piece of a finite pool he never saw. With the score
      // hidden this abandons whatever was showing and leaves the next exercise
      // to be presented by Start, which is the moment it is actually seen.
      if (scoreHidden()) {
        abandonPresented('another-one-while-hidden');
        $('reading-msg').textContent =
          'The score is hidden, so nothing has been dealt yet: the next exercise is chosen when you press Start.';
        renderReadingPrep();
        return;
      }
      const pre = presentNext();
      $('reading-msg').textContent = pre
        ? 'New exercise dealt. That one is now spent, whether or not you play it.'
        : 'No exercise could be dealt at this level.';
      renderReadingPrep();
      renderReadingProgress();
    });
  }

  // ---- the lessons board's learning block -----------------------------------
  // Three things, in one app-drawn subtree appended to whichever lessons board
  // is mounted: today's route, the skill quests, and the three strands of
  // evidence. Not a dashboard: a route of four rows, a list, and three lines.
  // Nothing here is a number pretending to be an ability.

  // The lessons board under the canon replaces the screen's markup, so the ONE
  // copy of this block is created here and moved to whichever host is live.
  function blockHost() {
    const screen = $('screen-lessons');
    if (!screen) return null;
    const board = screen.firstElementChild;
    return board && !board.dataset.legacyScreen ? board : screen;
  }
  function ensureBlock() {
    const host = blockHost();
    if (!host) return null;
    let root = $('lw-block');
    if (!root) { root = el('div', 'lw-quests'); root.id = 'lw-block'; }
    if (root.parentElement !== host) host.append(root);
    return root;
  }

  // The route comes from learning-lab's dailyRoute: one route model, and the
  // passage segment carries teacher.prescribe()'s answer through WHOLE, so the
  // app still has exactly one "do this next" voice.
  //
  // The reading segment's copy is written here rather than taken from the
  // module: ROUTE_DEFAULT says reading "only improves on music you have not
  // memorised", which overstates it. Reading familiar music helps; only fresh
  // material can TEST reading. (Flagged to the supervisor; the module's own
  // string belongs to its owner.)
  const ROUTE_WHY = {
    reading: 'A short read of music you have not seen. Familiar pieces are worth reading too; fresh material is what shows you can read on your own.',
  };
  function routeSection() {
    const wrap = el('details', 'lw-route-wrap');
    wrap.id = 'lw-route-details';
    const sum = el('summary', null, 'Today\'s route');
    wrap.append(sum);
    if (!lab) {
      wrap.append(el('p', 'hint', 'The skill quests are not loaded in this build, so there is no route to show.'));
      return wrap;
    }
    const route = lab.dailyRoute(state, {
      now: Date.now(),
      prescription: ctx.prescribeNow(),
    });
    const live = route.segments.filter((s) => !s.skipped);
    sum.textContent = `Today's route · about ${route.totalMinutes} minutes · ${live.filter((s) => s.done).length} of ${live.length} touched`;
    wrap.open = !!state.lib?.routeOpen;
    wrap.addEventListener('toggle', () => { (state.lib ??= {}).routeOpen = wrap.open; store.save(state); });
    const list = el('div', 'lw-route');
    for (const seg of route.segments) {
      const b = el('button', 'lw-route-item');
      b.type = 'button';
      b.dataset.state = seg.skipped ? 'done' : seg.done ? 'done' : 'open';
      const label = routeLabel(seg);
      b.append(el('span', null, `${seg.skipped ? '– ' : seg.done ? '✓ ' : '○ '}${seg.label}: ${label}`));
      b.append(el('span', 'lw-route-mins', seg.skipped ? 'skipped' : seg.minutes + ' min'));
      b.disabled = seg.skipped;
      b.addEventListener('click', () => runRouteSegment(seg));
      const skip = el('button', 'lw-route-skip', seg.skipped ? '' : 'Skip');
      skip.type = 'button';
      if (!seg.skipped) {
        skip.addEventListener('click', (e) => {
          e.stopPropagation();
          const r = lab.skipSegment(state, seg.id);
          store.save(state);
          setQuestMsgSafe(r.note);
          renderLessonExtras();
        });
      }
      const rowWrap = el('div', 'lw-route-row');
      rowWrap.append(b, skip);
      list.append(rowWrap);
      list.append(el('p', 'hint', ROUTE_WHY[seg.id] ?? seg.why));
    }
    wrap.append(list);
    wrap.append(el('p', 'hint', route.note + ' ' + route.shortVersion));
    return wrap;
  }
  const setQuestMsgSafe = (t) => { const m = $('quest-msg'); if (m) m.textContent = t; };
  const STAGE_WORD = { worked: 'watch it', guided: 'with help', independent: 'on your own', recall: 'check it stuck', transfer: 'somewhere new' };
  // THE READING SEGMENT IS THE READING LANE, not a notation rung. The lab's
  // easyReadingNext returns a rhythm/notation card, which is a different thing
  // from reading a piece of music you have not seen. So: a DATED obligation (a
  // recall that has come due) wins, because it expires; otherwise the segment
  // opens the first-reading lane, which is what "short daily reading" means.
  const readingSegmentIsRecall = (seg) =>
    seg.suggestion?.stage === 'recall' && !!seg.suggestion?.cardId;
  function routeLabel(seg) {
    const s = seg.suggestion;
    if (!s) return 'nothing to point at yet';
    if (s.kind === 'prescription') return s.prescription?.reason ?? 'your next passage';
    if (s.kind === 'free') return 'anything you like, unscored';
    if (seg.id === 'reading' && !readingSegmentIsRecall(seg)) {
      return (state.sight?.reads ?? []).length
        ? 'a first reading, on music you have not seen'
        : 'open the reading lane, Learn mode first';
    }
    const card = lab.cardById(s.cardId);
    return card ? `${card.title} · ${STAGE_WORD[s.stage] ?? s.stage}` : s.cardId;
  }
  function runRouteSegment(seg) {
    const s = seg.suggestion;
    if (!s) return;
    if (s.kind === 'prescription') { ctx.runPrescription(s.prescription); return; }
    if (s.kind === 'free') { show('library'); ctx.renderLibrary(); return; }
    if (seg.id === 'reading' && !readingSegmentIsRecall(seg)) { openReading(); return; }
    if (s.cardId) { openQuest(s.cardId, s.stage); return; }
    openReading();
  }

  function strandsSection() {
    const box = el('div', 'lw-scores');
    box.id = 'lw-strands';
    for (const s of evidenceStrands(state, readingSummary(state.sight))) {
      const r = el('div', 'lw-score');
      r.append(el('span', 'lw-score-name', s.name));
      const v = el('span', 'lw-score-val', s.line);
      if (!s.known) v.dataset.unknown = '1';
      r.append(v);
      if (s.detail) r.append(el('span', 'lw-score-why', s.detail));
      box.append(r);
    }
    return box;
  }

  function renderLessonExtras() {
    const root = ensureBlock();
    if (!root) return;
    root.replaceChildren();
    root.append(routeSection());
    if (lab) {
      const head = el('div', 'lw-quests-head');
      head.append(el('h3', 'lw-quests-title', 'Skill quests'));
      const counter = el('span', 'lw-quests-count');
      head.append(counter);
      root.append(head);
      renderQuestList(root, counter);
    }
    const evHead = el('div', 'lw-quests-head');
    evHead.append(el('h3', 'lw-quests-title', 'What you can actually show'));
    root.append(evHead, strandsSection());
    root.append(el('p', 'hint',
      'Three strands, counted apart. Playing a song you know well is not evidence about reading, and a clean first read is not evidence about repertoire.'));
  }

  // ---- "Understand this passage" (package 4) --------------------------------
  // A COMPACT EXPANDABLE CARD inside the practice guide, not a screen and not a
  // dashboard. It only appears when an applied card's harmony could be VERIFIED
  // against the song data that actually shipped; where it could not, it says so
  // and offers the study piece instead of printing a guessed chord over
  // somebody's arrangement.
  function passageCard(host, song, engine) {
    if (!lab || !host || !song) return null;
    resolvedApplied ??= lab.resolveAppliedCards(ctx.SONGS);
    // THE WAY BACK. A technique route sends the learner off to a scale; the
    // exact passage, hands, tempo and help they left are stored, and this is
    // the control that puts them back on it. Without this the route is one
    // way, which is the thing the brief calls out by name.
    // THE WAY BACK IS WHERE HE ACTUALLY WAS, not where the card says the
    // passage lives. The detour captured the LIVE engine (its range, hands,
    // tempo and help), it survives a reload because it is in saved state, and
    // it is a visible button on whatever screen he lands on next.
    // Shown whenever he is NOT already back: a different song, or the same
    // song at different settings. After a reload the card re-opens its passage
    // at the AUTHORED defaults, which is not where he left off, so the control
    // has to be reachable there too rather than only on the scale.
    const back = state.labReturn?.back;
    const alreadyBack = back && back.songId === song.id && engine &&
      engine.hand === back.hand && engine.waitMode === back.wait &&
      Math.round(engine.tempo * 100) === back.tempo &&
      engine.startBeat === back.startBeat && engine.endBeat === back.endBeat;
    if (back && !alreadyBack) {
      const row = el('div', 'passage-return');
      const b = el('button', null, `← Back to ${back.title ?? back.songId}${back.where ? ', ' + back.where : ''}`);
      b.type = 'button';
      b.className = 'is-primary';
      b.addEventListener('click', () => {
        const target = { ...back };
        delete state.labReturn.back;
        store.save(state);
        // a navigation, never an assessment: no `assess`, so ordinary looping
        // and ordinary scoring are exactly what they were
        ctx.launchPassage(target);
      });
      const wrap = el('div', 'passage-actions');
      wrap.append(b);
      row.append(el('p', 'passage-source',
        `You came here from ${back.title ?? back.songId}${back.where ? ' (' + back.where + ')' : ''}. ` +
        `It returns to ${back.hand === 'both' ? 'both hands' : back.hand === 'R' ? 'the right hand' : 'the left hand'}, ` +
        `${back.tempo}% tempo, help ${back.wait ? 'on' : 'off'}` +
        (back.startBeat ? `, from where you had the practice bar` : '') + '.'), wrap);
      host.append(row);
    }
    const cards = lab.LAB_CARDS.filter((c) => c.track === 'applied' && c.passage?.songId === song.id);
    if (!cards.length) return null;
    const card = document.createElement('details');
    card.className = 'passage-card';
    card.id = 'passage-card';
    const sum = document.createElement('summary');
    sum.textContent = 'Understand this passage';
    card.append(sum);
    const body = el('div', 'passage-card-body');
    for (const c of cards) {
      const resolved = resolvedApplied.find((r) => r.cardId === c.id);
      const p = lab.labProgress(state, c.id);
      body.append(el('h4', 'lw-quests-title', c.title));
      // ☠️ REFUSAL FIRST. A card whose authored expectations no longer match
      // the shipped song must NOT print its key, its harmony or its section as
      // facts and then admit underneath that none of it was verified. The
      // refusal comes first and the metadata does not come at all.
      if (!resolved?.ok) {
        body.append(el('p', 'passage-unknown',
          resolved?.note ?? 'This card will not annotate this song: its shipped data no longer matches what was authored against it.'));
        body.append(el('p', 'passage-source',
          'Nothing about this passage is claimed here. The card still runs, on its own study piece.'));
      } else {
        const dl = el('dl', 'passage-facts');
        // AUTHORED metadata, and only on a song whose data still matches what
        // was authored against it. Nothing here is inferred from the notes.
        fact(dl, 'Key', c.passage.key ?? 'not stated');
        fact(dl, 'Section', `${c.passage.section} · beats ${c.passage.startBeat}-${c.passage.endBeat}`);
        fact(dl, 'Why that key', c.passage.why ?? 'not stated');
        fact(dl, 'Settings it opens at', `${c.passage.hand === 'both' ? 'both hands' : c.passage.hand === 'R' ? 'right hand' : 'left hand'}, ${c.passage.tempo}% tempo, help ${c.passage.wait ? 'on' : 'off'}`);
        fact(dl, 'Progress', lab.labLabel(p));
        body.append(dl);
        // resolved.note IS passage.why on a verified card, and it is already
        // printed above as a fact; only add it when it says something else.
        if (resolved.note && resolved.note !== c.passage.why) body.append(el('p', 'passage-source', resolved.note));
      }
      const actions = el('div', 'passage-actions');
      const open = el('button', null, p.attempts ? 'Continue this card' : 'Work through it');
      open.type = 'button';
      open.className = 'is-primary';
      open.addEventListener('click', () => openQuest(c.id));
      actions.append(open);
      if (c.technique?.scaleId) {
        const tech = el('button', null, `Technique: ${c.technique.label ?? c.technique.scaleId}`);
        tech.type = 'button';
        tech.addEventListener('click', () => {
          // ROUTE OUT, AND BACK. The exact passage and settings are stored so
          // "back to the music" returns here, not to the library.
          state.labReturn = { cardId: c.id, stage: 'transfer', at: Date.now(),
            back: ctx.currentPassage() };
          store.save(state);
          ctx.openScale(c.technique.scaleId);
        });
        actions.append(tech);
      }
      if (c.expressionGoal) {
        const ex = el('button', null, 'Expression goal');
        ex.type = 'button';
        ex.addEventListener('click', () => setQuestMsgSafe(c.expressionGoal.text ?? String(c.expressionGoal)));
        actions.append(ex);
        body.append(el('p', 'passage-source', 'One expression goal: ' +
          (c.expressionGoal.text ?? String(c.expressionGoal))));
      }
      body.append(actions);
    }
    card.append(body);
    host.append(card);
    return card;
  }

  // ---- leaving --------------------------------------------------------------
  // Called from app.show() for EVERY screen change. Nothing this module started
  // may outlive the screen that started it.
  function leave(nextScreen) {
    generation++;
    if (nextScreen !== 'reading') readingScore = null;
    // THE READ'S OWN LIFECYCLE. A presentation survives exactly two moves: the
    // reading screen itself, and the play screen it was started onto. Anything
    // else is walking away, and walking away abandons the receipt (the music
    // stays spent, because he saw it).
    if (readingLive) {
      if (nextScreen !== 'play') abandonPresented('left-mid-read');
    } else if (presented && nextScreen !== 'reading' && nextScreen !== 'play') {
      abandonPresented('left-without-playing');
    }
    leaveQuest(nextScreen);
  }
  // called by app.mjs the moment gradeRead consumes the receipt
  function readingGraded() { presented = null; readingLive = false; }

  wireReading();

  // ---- quests: the learning lab, run on a screen (packages 2-5) -------------
  //
  // learning-lab.mjs owns every judgement here. This runner collects physical
  // input with an explicit millisecond stamp, hands it to the session, and
  // draws what the session says. It scores nothing, and it never sets a pass
  // flag: `session.finish()` is the only place a verdict is formed.

  let quest = null;   // the live run: session, clock, raf, generation
  let questView = null, questScore = null;
  let resolvedApplied = null;

  const RUNGS = [
    { kind: 'worked', name: 'Watch it', mark: '◇' },
    { kind: 'guided', name: 'With help', mark: '◑' },
    { kind: 'independent', name: 'On your own', mark: '●' },
    { kind: 'recall', name: 'A day later', mark: '★' },
    { kind: 'transfer', name: 'Somewhere new', mark: '★' },
  ];

  const capabilities = () => ({
    // A screen tap has no velocity and its note-off is synthesised 180ms later
    // by the app, not measured, so neither may be claimed without a keyboard.
    velocity: ctx.midiConnected(), noteOff: ctx.midiConnected(), pedal: !!state.pedalSeen,
  });

  function labQuestNext() {
    const n = lab.nextLabCard(state, Date.now());
    if (!n) return null;
    const card = lab.cardById(n.cardId);
    return { id: n.cardId, name: card.title, stage: n.stage, why: n.why };
  }

  // ---- the quest list on the lessons board ----------------------------------
  function renderQuestList(root, counter) {
    const summary = lab.labSummary(state, Date.now());
    counter.textContent = `${summary.independent} of ${summary.cards} passed on your own`;
    // ONE next action, in the app's voice, before the list of everything.
    const next = lab.labNextLine(state, Date.now());
    if (next) {
      const hero = el('button', 'lw-quests-next');
      hero.type = 'button';
      const what = el('span', 'lw-quests-next-what');
      what.append(el('span', 'lw-quests-next-kicker', 'Next skill quest'), document.createTextNode(next.line));
      what.append(el('span', 'lw-quest-sub', next.why));
      hero.append(what, el('span', 'lw-quest-state', '▶'));
      hero.addEventListener('click', () => openQuest(next.cardId));
      root.append(hero);
    }
    const list = el('ul', 'lw-quest-list');
    list.id = 'lw-quest-list';
    for (const track of lab.TRACKS) {
      const done = summary.byTrack.find((t) => t.id === track.id);
      const head = el('li', 'lw-quests-head');
      head.append(el('span', 'lw-quests-count', `${track.name} · ${done?.done ?? 0} of ${done?.of ?? 0} on your own`),
        el('span', 'lw-quest-sub', track.why));
      list.append(head);
      for (const card of lab.LAB_CARDS.filter((c) => c.track === track.id)) {
        const p = lab.labProgress(state, card.id);
        const row = el('li');
        const b = el('button', 'lw-quest-row');
        b.type = 'button';
        const name = el('span', 'lw-quest-name', card.title);
        name.append(el('span', 'lw-quest-sub', 'Measures: ' + card.measures));
        // five pips, one per rung: shape and word, never colour alone
        const pips = el('span', 'lw-quest-pips');
        pips.title = RUNGS.map((r) => `${r.name}: ${p.rungs.find((x) => x.kind === r.kind)?.done ? 'passed' : 'open'}`).join(', ');
        for (const r of RUNGS) {
          const i = el('i');
          i.dataset.on = p.rungs.find((x) => x.kind === r.kind)?.done ? '1' : '0';
          pips.append(i);
        }
        const dueRecall = summary.dueRecall.includes(card.id);
        const st = el('span', 'lw-quest-state');
        st.dataset.state = dueRecall ? 'due' : p.competence ? 'done' : 'open';
        st.append(el('i', null, dueRecall ? '★' : p.competence ? '●' : '○'),
          document.createTextNode(dueRecall ? 'recall due' : lab.labLabel(p)));
        b.append(name, pips, st);
        b.addEventListener('click', () => openQuest(card.id));
        row.append(b);
        list.append(row);
      }
    }
    root.append(list);
  }

  // ---- opening one quest ----------------------------------------------------
  function openQuest(cardId, stageKind = null) {
    if (!lab) return;
    resolvedApplied ??= lab.resolveAppliedCards(ctx.SONGS);
    const now = Date.now();
    const avail = stageKind ? lab.stageAvailable(state, cardId, stageKind, now) : { ok: true };
    const session = lab.startCard(state, cardId, {
      now, stage: stageKind && avail.ok ? stageKind : undefined,
      capabilities: capabilities(), cal: ctx.touchCal(), resolvedApplied,
    });
    if (!session) return;
    // ☠️ SHOW FIRST, THEN TAKE THE GENERATION. app.show() calls leave(), which
    // bumps the generation to kill the last screen's timers: taking the number
    // before show() meant every deferred continuation this rung scheduled was
    // stale the moment it was scheduled, and the demonstration rung could never
    // end. Cost an hour; worth the four lines saying so.
    show('quest');
    generation++;
    const gen = generation;
    quest = { session, gen, cardId, phase: 'ready', t0: 0, raf: 0, countInUntil: 0, result: null, record: null };
    $('now-playing').textContent = 'Skill quest';
    if (!questView) questView = new ctx.FallsView($('quest-keys'));
    renderQuest(avail);
    jlog('quest_open', { id: cardId, stage: session.stage.kind });
  }

  function renderQuest(avail = { ok: true }) {
    if (!quest) return;
    const s = quest.session.state();
    $('quest-title').textContent = s.cardTitle;
    $('quest-why').textContent = s.skillName ?? '';
    // the five rungs, as shape plus word
    const rail = $('quest-rungs');
    rail.replaceChildren();
    const p = lab.labProgress(state, s.cardId);
    for (const r of RUNGS) {
      const row = p.rungs.find((x) => x.kind === r.kind);
      const li = el('li', 'lw-rung');
      const blocked = lab.stageAvailable(state, s.cardId, r.kind, Date.now());
      li.dataset.state = r.kind === s.stage ? 'now' : row?.done ? 'done'
        : blocked.ok === false && blocked.blocked ? 'locked' : 'open';
      if (r.kind !== s.stage && !row?.done && blocked.blocked === 'too-soon') li.dataset.state = 'due';
      li.append(el('i', null, row?.done ? '✓' : r.kind === s.stage ? '▶' : r.mark), document.createTextNode(r.name));
      if (row?.selfReported) li.append(document.createTextNode(' (your own check)'));
      li.title = blocked.ok ? '' : blocked.why;
      rail.append(li);
    }
    // teaching copy: what to do, what it teaches (worked rung only), and every
    // reason this attempt is worth what it is worth
    const teach = $('quest-teach');
    teach.replaceChildren();
    for (const line of s.say) teach.append(el('p', null, line));
    const notice = el('details', 'lw-more lw-notice');
    notice.append(el('summary', null, 'What to notice'));
    notice.append(el('p', null, `What this checks: ${s.measures}`));
    if (s.teaches?.length) {
      const ul = el('ul');
      for (const t of s.teaches) ul.append(el('li', null, t));
      notice.append(ul);
    }
    teach.append(notice);
    if (!avail.ok && avail.why) teach.append(el('p', 'lw-said', avail.why + (avail.playableAsPractice ? ' You can still play it: it counts as practice.' : '')));
    if (s.fellBackNote) teach.append(el('p', 'lw-said', s.fellBackNote));
    if (s.repeatedNote) teach.append(el('p', 'lw-said', s.repeatedNote));
    // THE TRANSFER POOL, said out loud. A transfer rung carries three pieces of
    // comparable material; when it deals an alternate the learner is told, and
    // once the pool is spent the rung stays playable and stops claiming to be
    // a transfer. Silence here would let a repeat look like fresh evidence.
    if (s.usingAlt && s.altNote) teach.append(el('p', 'lw-said', s.altNote));
    if (s.poolExhausted) teach.append(el('p', 'lw-said',
      'Every piece of material for this rung has been met. It is still worth playing, and it can no longer be transfer evidence.'));
    if (s.pool && s.stage === 'transfer') teach.append(el('p', 'lw-said',
      `Transfer material: ${s.pool.used ?? 0} of ${s.pool.size ?? 0} used.`));
    // WHAT IS MISSING, then what it would have measured. `why` names the
    // absent capability in plain words; `note` says what the rung measures on
    // hardware that has it. A learner needs the first one.
    if (s.degraded && s.support?.why) teach.append(el('p', 'lw-said', s.support.why));
    if (s.degraded && s.support?.note) teach.append(el('p', 'lw-said', s.support.note));
    for (const r of s.assistReasons) teach.append(el('p', 'lw-said', r));
    if (s.passage) teach.append(el('p', 'lw-said', 'Back to the music: ' + s.passage.line));

    drawQuestStave(s);
    drawCountRow(s);

    // the keyboard: zoomed to what this rung asks for, targets lit only where
    // the rung allows help
    const midis = (s.song?.notes ?? []).map((n) => n.m);
    if (midis.length) {
      const kr = ctx.lessonKeyRange(midis);
      questView.setRange(kr.lo, kr.hi);
      questView.markMiddleC = true;
      questView.kbLetters = s.stage === 'worked' || s.stage === 'guided';
    }
    questView.targets = new Set((s.targets ?? []).flatMap((t) => t.midis));
    questView.pressed.clear();
    if (ctx.CANON_ON) ctx.hideRestingLayer($('quest-keys'));
    questView.resize();
    drawQuestKeys();

    // the answer question, when the rung has one
    renderAsk(s);
    syncQuestControls(s);
  }

  // A QUEST'S PAGE IS AUTHORED, NOT DERIVED. The generic ScoreView engraves
  // `s.song`, and a song is MIDI numbers: spellPitch re-derives the spelling
  // from pitch and key, so in C major it prints A sharp where the flats card
  // authored B flat, and it loses every rest, tie, slur, tuplet and dynamic.
  // That is the exact reading error the card is teaching. js/lab-score.mjs
  // engraves `s.render`, the authored page itself. Reading and repertoire keep
  // ScoreView; nothing else changed.
  //
  // The renderer draws its own marks, so there is no second pass here: a
  // hand-painted layer on top would print every dynamic and slur twice.
  function drawQuestStave(s) {
    const host = $('quest-stave');
    questScore?.destroy?.();
    questScore = null;
    host.replaceChildren();
    if (!s.render) {
      if (s.song) host.append(el('p', 'hint', 'This rung has no authored page to draw.'));
      return;
    }
    try {
      questScore = new ctx.LabScore(host);
      if (!questScore.build(s.render)) {
        // LabScore prints its own visible refusal and never falls back to a
        // pitch guide: a page showing something other than what is being
        // scored is worse than a page that says it cannot be drawn.
        jlog('quest_engrave_refused', { id: s.cardId, why: questScore.error ?? null });
      }
    } catch (err) {
      host.append(el('p', 'hint', 'This exercise could not be engraved here: ' + (err?.message ?? err)));
    }
  }

  function drawCountRow(s) {
    const row = $('quest-counts');
    row.replaceChildren();
    const cells = s.countRow;
    row.hidden = !cells || !(s.help?.id === 'countRow' || s.stage === 'worked' || s.stage === 'guided');
    if (row.hidden || !cells) return;
    const per = s.meter?.[0] ?? 4;
    for (const c of cells) {
      const b = el('b', null, c.active ? c.label : `(${c.label})`);
      b.dataset.on = c.active ? '1' : '0';
      b.style.left = `${((c.pos / per) * 92) + 3}%`;
      row.append(b);
    }
    for (let i = 0; i < per; i++) {
      const tick = el('i', 'lw-beat');
      tick.style.left = `${((i / per) * 92) + 3}%`;
      row.append(tick);
    }
  }

  function drawQuestKeys() {
    if (!quest || !questView) return;
    cancelAnimationFrame(quest.raf);
    quest.raf = 0;
    if ($('screen-quest').hidden || $('quest-keys').hidden) return;
    const owner = quest;
    const c = questView;
    c.ctx.fillStyle = ctx.COLORS.bg;
    c.ctx.fillRect(0, 0, c.w, c.h);
    c.kbH = c.h - 4;
    c._drawKeyboard(4);
    c._drawFlares(4, 0.016); c._drawParticles(0.016); c._drawFloaters(0.016);
    quest.raf = requestAnimationFrame(() => {
      if (quest === owner) drawQuestKeys();
    });
  }

  function renderAsk(s) {
    const host = $('quest-teach');
    const ask = s.ask ?? s.selfCheck;
    if (!ask) return;
    const box = el('div', 'lw-ask');
    box.append(el('p', null, ask.prompt));
    const row = el('div', 'passage-actions');
    for (const opt of ask.options) {
      const b = el('button', null, opt.label);
      b.type = 'button';
      b.addEventListener('click', () => {
        const r = quest.session.answer(opt.id);
        if (r?.invalid) { setQuestMsg(r.why ?? 'That is not one of the options offered.'); return; }
        // ☠️ On an ASSESSMENT rung the answer is never revealed before the
        // attempt is finished: naming the right option is exactly the leak
        // that turns a check into a quiz with the answers printed on it.
        const assessing = ['independent', 'recall', 'transfer'].includes(s.stage);
        setQuestMsg(s.selfCheck ? 'Recorded as your own listening check. It is not a measurement.'
          : assessing ? 'Answer recorded. It is marked when the rung is finished.'
          : r?.correct ? 'Yes. ' + (r.why ?? '') : 'Not that one. ' + (r.why ?? ''));
        for (const other of row.querySelectorAll('button')) other.dataset.on = String(other === b);
        // a listening rung was WAITING for this answer: it is the whole rung
        if (quest?.phase === 'answering') finishQuest();
      });
      row.append(b);
    }
    box.append(row);
    host.append(box);
  }

  const setQuestMsg = (text) => { $('quest-msg').textContent = text; };

  function syncQuestControls(s) {
    const ready = quest.phase === 'ready';
    const done = quest.phase === 'done';
    const watching = quest.phase === 'playing' && (s.input === 'listen' || s.input === 'self-check');
    if (quest.phase === 'answering') setQuestMsg($('quest-msg').textContent || 'Answer above to finish this rung.');
    $('quest-go').hidden = !(ready || watching);
    $('quest-go').textContent = watching ? 'I have watched it'
      : s.input === 'listen' ? '▶ Play it for me'
      : s.input === 'play-passage' ? '▶ Open the passage'
      : s.input === 'self-check' ? 'Listen and answer' : '▶ Start';
    $('quest-show').hidden = !(done && (s.input === 'listen' || s.input === 'self-check'));
    $('quest-show').textContent = '↻ Play it again';
    // A hint is offered on every played rung, including the assessments: help
    // must stay recoverable. Using one converts the attempt, and says so.
    $('quest-hint').hidden = !(quest.phase === 'playing' && s.targets !== null && s.input !== 'listen');
    $('quest-retry').hidden = !done || !quest.result || quest.result.passed === true;
    $('quest-next').hidden = !done;
    $('quest-tap-row').hidden = !(s.input === 'tap-rhythm' && quest.phase !== 'done');
    $('quest-keys').hidden = s.input === 'tap-rhythm' || s.input === 'listen' || s.input === 'self-check';
    $('quest-kb').hidden = $('quest-keys').hidden;
    const prog = s.progress;
    $('quest-phase').textContent = `${RUNGS.find((r) => r.kind === s.stage)?.name ?? s.stage} · ${s.input.replace(/-/g, ' ')}`;
    $('quest-progress').textContent = quest.phase === 'playing'
      ? (s.input === 'tap-rhythm' ? `${prog.taps} taps` : `${prog.played} of ${prog.of} played`)
      : s.retries.used ? `attempt ${s.retries.used + 1} of ${s.retries.max + 1}` : '';
  }

  // ---- running one rung -----------------------------------------------------
  const questNowMs = () => performance.now() - quest.t0;

  function questGo() {
    if (!quest) return;
    // mid-demonstration, the same button ends the watching
    if (quest.phase === 'playing' && quest.endDemo) { quest.endDemo(); return; }
    if (quest.phase !== 'ready') return;
    const s = quest.session.state();
    if (s.input === 'play-passage' && s.passage) { openQuestPassage(s); return; }
    if (s.input === 'listen') { playQuestDemo(s); return; }
    if (s.input === 'self-check') { playQuestDemo(s, true); return; }
    startQuestRun(s);
  }

  // The worked rung: the app plays it, the keys light, nothing is judged.
  //
  // ☠️ A DEMONSTRATION MUST NOT DEPEND ON AUDIO TO END. playPreview's onDone
  // only fires once its AudioContext has actually run, and a context that never
  // wakes (a muted device, a blocked autoplay policy, a headless browser) left
  // the rung stuck on "playing" forever with no way forward. The written
  // duration ends it, the learner can end it, and the sound is a bonus.
  function playQuestDemo(s, selfCheck = false) {
    const gen = quest.gen;
    const notes = s.song?.notes ?? [];
    // ☠️ the same guard as a normal completion: finishQuest owns the phase.
    // Setting it to 'done' first made finishQuest a no-op and the rung hung.
    if (!notes.length) { finishQuest(); return; }
    quest.phase = 'playing';
    quest.watched = false;
    setQuestMsg(selfCheck
      ? 'Listen, then answer. Your answer is recorded as your own verdict; the app measures nothing here.'
      : 'Watch the keys and the page together. Nothing is being judged.');
    const perBeat = 60000 / (s.song.bpm ?? 72);
    const endDemo = () => {
      if (generation !== gen || !quest || quest.watched) return;
      quest.watched = true;
      clearTimeout(quest.timer);
      ctx.stopPreview();
      setQuestMsg(selfCheck ? 'Now answer above, in your own words.' : 'That is the shape of it. Now try it.');
      // a listening self check is only finished once it has been answered: its
      // whole content is the learner's own verdict
      // ☠️ NO ANSWER, NO VERDICT. A degraded rung always carries a real
      // question (its own, or the fallback for the measurement this device
      // cannot make). Finishing without answering it records nothing: there is
      // no default answer and no fake verdict.
      if (selfCheck && s.selfCheck && !quest.session.selfReport) {
        quest.phase = 'answering';
        syncQuestControls(quest.session.state());
        setQuestMsg('Answer above to finish this rung. Nothing is recorded until you do.');
        return;
      }
      finishQuest();
    };
    quest.endDemo = endDemo;
    ctx.playPreview(notes, perBeat, (m, down) => {
      if (generation !== gen) return;
      if (down) questView?.keyDown(m, m < 60 ? 'L' : 'R'); else questView?.keyUp(m);
    }, endDemo);
    const spanMs = Math.max(...notes.map((n) => (n.b + n.d))) * (4 / (s.song.beatUnit ?? 4)) * s.msPerBeat;
    quest.timer = setTimeout(endDemo, spanMs + 900);
    syncQuestControls(quest.session.state());
  }

  function startQuestRun(s) {
    const gen = quest.gen;
    quest.phase = 'counting';
    setQuestMsg('Count-in…');
    const beats = s.countIn ?? 2;
    const perBeat = s.msPerBeat;
    const t0 = ctx.metCountIn(beats, perBeat);       // schedules the clicks, returns beat-zero time
    quest.t0 = t0;
    quest.timer = setTimeout(() => {
      if (generation !== gen || !quest) return;
      quest.phase = 'playing';
      quest.session.begin(0);
      setQuestMsg(s.input === 'tap-rhythm' ? 'Tap the written rhythm.' : 'Play it.');
      syncQuestControls(quest.session.state());
      // the rung ends when the written music has run out, plus a grace: a late
      // last note is still a late note, not a missing one
      const span = (s.song?.sections?.[0]?.endBeat ?? 4) * (4 / (s.song?.beatUnit ?? 4)) * perBeat;
      quest.timer = setTimeout(() => {
        if (generation !== gen || !quest || quest.phase !== 'playing') return;
        finishQuest();
      }, span + 900);
    }, Math.max(0, t0 - performance.now()));
    syncQuestControls(s);
  }

  // physical input, stamped in milliseconds from beat zero
  function questNote(midi, isDown, velocity, source = 'midi') {
    if (!quest || quest.phase !== 'playing') return;
    const s = quest.session.state();
    if (isDown) questView?.keyDown(midi, midi < 60 ? 'L' : 'R'); else questView?.keyUp(midi);
    if (s.input === 'tap-rhythm') { if (isDown) quest.session.tap({ at: questNowMs() }); }
    else if (isDown) quest.session.noteOn(midi, { at: questNowMs(), velocity, source });
    else quest.session.noteOff(midi, { at: questNowMs(), source });
    const now = quest.session.state();
    $('quest-progress').textContent = s.input === 'tap-rhythm'
      ? `${now.progress.taps} taps` : `${now.progress.played} of ${now.progress.of} played`;
  }
  function questPedal(down) {
    if (!quest || quest.phase !== 'playing') return;
    state.pedalSeen = true;
    quest.session.pedal(down, { at: questNowMs() });
  }

  function finishQuest() {
    if (!quest || quest.marked) return;   // a rung is marked exactly once
    quest.marked = true;
    clearTimeout(quest.timer);
    ctx.killClicks();
    quest.phase = 'done';
    const result = quest.session.finish({ now: Date.now() });
    // A REPAIR PASS IS NOT A RUNG ATTEMPT. It is never handed to
    // recordLabResult, so it can never fill a rung, move a stage or pay XP;
    // the one thing it can do is bank a recovery, and only if the lab's own
    // fault list has nothing left in the bar being repaired.
    if (quest.repair) { finishRepair(result); return; }
    const record = lab.recordLabResult(state, result, { now: Date.now() });
    quest.result = result;
    quest.record = record;
    store.save(state);
    ctx.markPracticedToday();
    ctx.dayStat('questRungs');
    ctx.settleGame();
    jlog('quest_done', { id: result.cardId, stage: result.stage, outcome: record.outcome, assisted: result.assisted });
    renderQuestResult(result, record);
  }

  function finishRepair(result) {
    const { bar, label, cardId } = quest.repair;
    const stillWrong = (result.faults ?? []).filter((f) => f.bar === bar);
    const fixed = stillWrong.length === 0;
    const rec = lab.recordRecovery(state, cardId, { fixed, now: Date.now() });
    store.save(state);
    ctx.markPracticedToday();
    quest.result = result;
    quest.record = null;
    // A repair that came off is finished with. One that did not is still the
    // job, so Retry re-runs the REPAIR rather than turning into a rung attempt.
    if (fixed) quest.repair = null;
    jlog('quest_repair', { id: cardId, bar, fixed });
    const teach = $('quest-teach');
    const box = el('div', 'lw-scores');
    const r = el('div', 'lw-score');
    r.append(el('span', 'lw-score-name', `${label}: ${fixed ? 'repaired' : 'not yet'}`));
    r.append(el('span', 'lw-score-val', fixed ? 'banked' : 'nothing banked'));
    r.append(el('span', 'lw-score-why', fixed
      ? `${rec.note} A repair is practice: it does not pass the rung, and the rung is still open.`
      : `Still wrong in that bar: ${stillWrong.map((f) => f.text).join(' ')} ${rec.note}`));
    box.append(r);
    teach.append(box);
    setQuestMsg(fixed ? 'Repair banked. Run the rung again when you are ready.' : 'Not banked. That bar is still the bar.');
    syncQuestControls(quest.session.state());
    renderLessonExtras();
  }

  function renderQuestResult(result, record) {
    const teach = $('quest-teach');
    const box = el('div', 'lw-scores');
    box.id = 'lw-quest-result';
    const head = el('div', 'lw-score');
    head.append(el('span', 'lw-score-name', result.headline));
    head.append(el('span', 'lw-score-val', record.outcome.replace(/-/g, ' ')));
    head.append(el('span', 'lw-score-why', 'Measured: ' + result.measured));
    box.append(head);
    for (const line of result.detail ?? []) {
      const r = el('div', 'lw-score');
      r.append(el('span', 'lw-score-why', line));
      box.append(r);
    }
    // WHAT COULD NOT BE MEASURED. A rung can read the rhythm perfectly and
    // still have had no way to see the dynamics; the learner should know which
    // half of the claim is missing rather than reading a bare pass.
    for (const u of result.unmeasured ?? []) {
      const r = el('div', 'lw-score');
      r.append(el('span', 'lw-score-name', 'Not measured: ' + (u.what ?? 'part of this rung')));
      r.append(el('span', 'lw-score-val', 'unknown'));
      r.querySelector('.lw-score-val').dataset.unknown = '1';
      r.append(el('span', 'lw-score-why', u.why ?? ''));
      box.append(r);
    }
    // ☠️ A REFUSED CLAIM IS SHOWN, NOT SWALLOWED. This is the difference
    // between "you passed" and "you passed, and here is what that pass can and
    // cannot say".
    for (const line of record.refused ?? []) {
      const r = el('div', 'lw-score');
      r.append(el('span', 'lw-flag', line));
      box.append(r);
    }
    const cel = lab.celebrationFor(record);
    if (cel?.line) {
      const m = el('div', 'lw-milestone');
      m.append(el('i', null, cel.mark ?? '◆'), document.createTextNode(cel.line + (cel.xp ? ` · ${cel.xp} XP` : '')));
      box.append(m);
    }
    // ☠️ REPAIR IS PLAYED, NOT CLICKED. This button used to call
    // recordRecovery({fixed:true}) straight off the click, which banked a
    // successful repair for pressing a button. A repair is a bounded run of
    // this rung's own exercise, judged by the lab's own scorer, and the ONLY
    // thing that credits it is that bar coming back clean. Nothing is claimed
    // for opening it, for playing it badly, or for walking away.
    if (result.recovery) {
      const rec0 = result.recovery;
      const r = el('div', 'lw-score');
      const b = el('button', 'tool', `Repair ${rec0.label ?? 'that bar'}`);
      b.type = 'button';
      b.addEventListener('click', () => startRepair(result, rec0));
      r.append(el('span', 'lw-score-why',
        `${rec0.say ?? 'Play just this bar, slowly, until it is right.'} ` +
        (rec0.faults?.length ? `What went wrong there: ${rec0.faults.join(' ')}` : '')), b);
      box.append(r);
    }
    teach.append(box);
    setQuestMsg(record.competence ? 'This card now reads: ' + record.competence : '');
    const s = quest.session.state();
    syncQuestControls(s);
    // where to go next
    $('quest-next').textContent = s.passage ? 'Back to the passage' : 'Next rung';
    renderLessonExtras();
  }

  // ---- repairing one bar ----------------------------------------------------
  // A fresh session on the SAME rung, presented as one bar's work. It is never
  // recorded as a rung attempt (fixing a bar is not a pass, and recordLabResult
  // is deliberately not called): the only thing it can produce is a recovery,
  // and only when the lab's own scorer reports no fault left in that bar.
  function startRepair(fromResult, recovery) {
    if (!quest || !lab) return;
    const card = lab.cardById(fromResult.cardId);
    const stage = lab.stageOf(card, fromResult.stage, fromResult.stageIndex ?? 0);
    if (!card || !stage) return;
    const session = lab.startCard(state, card.id, {
      now: Date.now(), stage: fromResult.stage,
      capabilities: capabilities(), cal: ctx.touchCal(), resolvedApplied,
    });
    if (!session) return;
    quest.session = session;
    quest.phase = 'ready';
    quest.marked = false;
    quest.result = null;
    quest.record = null;
    quest.repair = { bar: recovery.bar, label: recovery.label, cardId: card.id,
      startBeat: recovery.startBeat, endBeat: recovery.endBeat };
    quest.marked = false;
    renderQuest();
    focusRepairBar(quest.repair);
    setQuestMsg(`${recovery.label} only. The rest of the page is dimmed and is there for its key, ` +
      'its accidentals and anything tied across the bar line. Nothing outside that bar is judged, ' +
      'and a repair never passes the rung: it is practice on one bar.');
  }

  // CROP THE PAGE TO THE BAR. LabScore hands back every drawn note with the
  // beat it sits on, so the repair dims everything outside the bar and scrolls
  // to it. The notes outside stay VISIBLE rather than removed, because the key
  // signature, a carried accidental and a tie across the bar line are all part
  // of reading that bar correctly.
  function focusRepairBar(repair) {
    const notes = questScore?.notes;
    if (!Array.isArray(notes) || !repair) return false;
    let dimmed = 0;
    for (const n of notes) {
      if (!n?.el) continue;
      const inBar = n.at >= repair.startBeat - 1e-6 && n.at < repair.endBeat - 1e-6;
      n.el.style.opacity = inBar ? '1' : '0.28';
      if (!inBar) dimmed++;
    }
    questScore.scrollToBeat?.(repair.startBeat);
    return dimmed > 0;
  }

  // ---- the routes out of a card --------------------------------------------
  // ☠️ ONLY A RUNG THAT IS ACTUALLY OPENING THE PASSAGE. `state().passage` is
  // non-null only on such a rung; an alternate-study transfer must NOT launch
  // the original catalogue passage, and a card whose passage was refused falls
  // back to its own study piece, which this never overrides.
  function openQuestPassage(s) {
    const p = s.passage;
    if (!p) return false;
    const assess = { cardId: s.cardId, stage: s.stage, stageIndex: quest?.session?.stageIndex ?? 0,
      contentId: s.contentId ?? null, at: Date.now() };
    // ☠️ KEEP THE WAY BACK. `labReturn` carries two different things: the
    // assessment binding, and `back`, the place a technique detour came from.
    // Overwriting the whole object dropped `back` on the floor, so after a
    // reload there was no return control anywhere.
    state.labReturn = { ...(state.labReturn?.back ? { back: state.labReturn.back } : {}), ...assess };
    store.save(state);
    jlog('quest_passage', { id: s.cardId, songId: p.songId, section: p.section });
    return ctx.launchPassage({ songId: p.songId, section: p.section,
      hand: p.hand, tempo: p.tempo, wait: p.wait, assess });
  }

  // Called by app.mjs when a run finishes while a bound quest passage is open:
  // the practice surface's own accuracy IS the measurement, handed straight
  // back. `bound` is the identity app.mjs checked the engine against; this
  // re-checks it against the LIVE session so a stale card can never be marked.
  function questPassageResult(run, bound) {
    const back = state.labReturn;
    if (!back || !bound || !quest) return false;
    if (bound.cardId !== back.cardId || quest.cardId !== back.cardId) return false;
    if (quest.marked || quest.session.stage.kind !== back.stage) return false;
    quest.session.recordPassage(run);
    // the BINDING is spent; the way back, if there is one, is not
    const keepBack = state.labReturn?.back ?? null;
    if (keepBack) state.labReturn = { back: keepBack }; else delete state.labReturn;
    quest.phase = 'playing';
    show('quest');
    finishQuest();
    return true;
  }

  function leaveQuest(nextScreen) {
    if (!quest) return;
    clearTimeout(quest.timer);
    cancelAnimationFrame(quest.raf);
    ctx.killClicks();
    ctx.stopPreview();
    questView?.pressed.clear();
    if (nextScreen !== 'quest' && nextScreen !== 'play') quest = null;
  }

  function wireQuest() {
    $('quest-back')?.addEventListener('click', () => { ctx.openLessons(); });
    $('quest-go')?.addEventListener('click', questGo);
    $('quest-show')?.addEventListener('click', () => { if (quest) playQuestDemo(quest.session.state()); });
    $('quest-hint')?.addEventListener('click', () => {
      if (!quest) return;
      const h = quest.session.hint();
      questView.targets = new Set(h.keys ?? []);
      setQuestMsg(h.text + ' This attempt now counts as practice.');
    });
    $('quest-retry')?.addEventListener('click', () => {
      if (!quest) return;
      const r = quest.session.retry();
      if (!r.ok) { setQuestMsg(r.why); return; }
      // ☠️ CLEAR THE MARK LATCH. finishQuest() marks a rung exactly once
      // and returns early if it is already marked; leaving the latch set after
      // a retry meant the new attempt could never be graded, so the rung sat
      // in 'playing' until the probe timed out. Same for the repair pass.
      quest.session = r.session;
      quest.phase = 'ready';
      quest.marked = false;
      quest.watched = false;
      quest.result = null;
      quest.record = null;
      clearTimeout(quest.timer);
      renderQuest();
      setQuestMsg(quest.repair ? 'Same bar, fresh go.' : 'Same rung, fresh go. Nothing was lost.');
    });
    $('quest-next')?.addEventListener('click', () => {
      const s = quest?.session.state();
      if (s?.passage) { openQuestPassage(s); return; }
      const id = quest?.cardId;
      quest = null;
      if (id) openQuest(id); else ctx.openLessons();
    });
    $('quest-kb')?.addEventListener('click', () => {
      const cvs = $('quest-keys');
      cvs.hidden = !cvs.hidden;
      $('quest-kb').textContent = cvs.hidden ? 'Show keyboard' : 'Hide keyboard';
      if (!cvs.hidden) { questView.resize(); drawQuestKeys(); }
    });
    // the tap/hold alternative: a real hold, so duration rungs are playable
    // without a piano, and the space bar does the same thing
    const tap = $('quest-tap');
    const down = (e) => { e.preventDefault(); tap.dataset.down = '1'; questNote(60, true, null, 'click'); };
    const up = (e) => { e.preventDefault(); tap.dataset.down = '0'; questNote(60, false, null, 'click'); };
    tap?.addEventListener('pointerdown', down);
    tap?.addEventListener('pointerup', up);
    tap?.addEventListener('pointercancel', up);
    tap?.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') down(e); });
    tap?.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') up(e); });
    $('quest-keys')?.addEventListener('pointerdown', (e) => {
      if (!questView) return;
      const r = e.currentTarget.getBoundingClientRect();
      const sc = e.currentTarget.clientWidth / r.width;
      const m = questView.pickKeyAt((e.clientX - r.left) * sc, (e.clientY - r.top) * sc, 4, questView.h - 4);
      if (m == null) return;
      questNote(m, true, null, 'click');
      setTimeout(() => questNote(m, false, null, 'click'), 180);
    });
  }
  wireQuest();

  const setLab = (module) => {
    lab = module;
    lab.migrateLab(state);     // once at boot, beside the other migrations
  };

  return {
    openReading, renderReadingProgress, renderLessonExtras, openQuest, passageCard,
    readingResult: renderReadingResult,
    readingPlanShown: () => readingPlanShown,
    presentNext, readingGraded,
    readingPresented: () => (presented ? { ...presented.presentation } : null),
    questNote, questPedal, questPassageResult,
    questActive: () => !!quest,
    // debug/test lever, the same spirit as __engine and __lesson: the live
    // rung's own state plus its clock, so a probe can play in real time
    // through the same input path the P-45 uses instead of setting flags.
    questDebug: () => (quest ? {
      phase: quest.phase, cardId: quest.cardId, nowMs: quest.phase === 'ready' ? 0 : questNowMs(),
      result: quest.result, record: quest.record, state: quest.session.state(),
    } : null),
    labBadges: () => (lab ? lab.labBadges(state) : []),
    leave, setLab,
    strands: () => evidenceStrands(state, readingSummary(state.sight)),
    freshReadDue: (now) => freshReadDue(state, now),
  };
}
