// App wiring: screens, engine loop, stats, streaks, results.
// Council defaults: falling notes is the default surface; a song section only
// counts as "learned" after at least one score-mode pass (Codex's mechanic).

import { SONGS, validateSong, LADDER } from './songs.mjs';
import { ContinuityTracker } from './perform.mjs';
import { LOOPS, chordAt, compNotes } from './improv.mjs';
import { Engine, medianOffset, chunkRange, timingSummary, biasText } from './engine.mjs';
import { MidiInput } from './midi.mjs';
import { FallsView, LOW, HIGH, COLORS } from './falls.mjs';
import { ScoreView } from './score.mjs';
import { playPreview, stopPreview, setVoiceMode, voiceInfo } from './audio.mjs';
import { pickPhrase, EchoRound, TransposeRound } from './echo.mjs';
import { MEM_STAGES, memCues, memAdvance, randomStartBar } from './memory.mjs';
import { makeExercise, judgeSight } from './sight.mjs';
import { matchCard, CardTask } from './theory.mjs';
import { pickPattern, RhythmRound } from './rhythm.mjs';
import { LESSONS, StaffDrill, TogetherDrill, PhraseDrill, PHRASES, pickReviewItems, lessonKeyRange, buildLevels, LevelRunner, lessonItemKeyOf } from './lessons.mjs';
import { installPath } from './path.mjs';
import { makeCountCells } from './rhythm.mjs';
import { TouchDiagnostic, buildCalibration, ZONES } from './touch.mjs';
import { addTake, removeTake, takeUsage, newTakeId, eventsToNotes } from './takes.mjs';
import { FORM_CHECKS, formDue } from './form.mjs';
import { analyzePedal, pedalNotes } from './pedal.mjs';
import { analyzeArticulation, articulationSummary } from './artic.mjs';
import { analyzeVoicing, voicingText } from './voicing.mjs';
import { groupSongs, classifyGroups, nextAction, filterExplore, SEARCH_PERSISTENT_AT } from './library.mjs';

const $ = (id) => document.getElementById(id);
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = (m) => NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);

// ---------- persistent state ----------
const store = {
  load() {
    let s;
    try { s = JSON.parse(localStorage.getItem('keys-v1')) ?? {}; } catch { s = {}; }
    // normalize the persisted schema: a stale or mangled shape must never crash boot
    if (typeof s !== 'object' || Array.isArray(s)) s = {};
    if (typeof s.songs !== 'object' || s.songs === null || Array.isArray(s.songs)) s.songs = {};
    if (!Array.isArray(s.days)) s.days = [];
    if (typeof s.calOffsetMs !== 'number' || !isFinite(s.calOffsetMs)) s.calOffsetMs = 0;
    return s;
  },
  save(s) { localStorage.setItem('keys-v1', JSON.stringify(s)); },
};
const state = Object.assign({ songs: {}, calOffsetMs: 0, days: [] }, store.load());
// note style (Mark 2026-08-25): 'duo' amber/cyan or 'moon' Rousseau white.
// Views read the seam at construction; applyNoteStyle updates the live ones.
window.__keysNoteStyle = state.noteStyle === 'moon' ? 'moon' : 'duo';
function applyNoteStyle(styleName, lettersOn) {
  state.noteStyle = styleName;
  state.showLetters = lettersOn;
  window.__keysNoteStyle = styleName;
  for (const v of [falls, fpView, echoView, improvView, takesView, lessonView]) {
    if (!v) continue;
    v.noteStyle = styleName;
    v.cueLetters = lettersOn; // the memorize ladder re-applies its own cues
  }
  store.save(state);
}
const songStats = (id) => (state.songs[id] ??= { plays: 0, best: 0, scorePasses: 0, stars: 0, bestScore: 0 });
// Local date, not toISOString: UTC would flip Mark's AEST mornings to yesterday.
const localDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function markPracticedToday() {
  const today = localDay(new Date());
  if (!state.days.includes(today)) state.days.push(today);
  store.save(state);
}
function streakLen() {
  let n = 0;
  const d = new Date();
  for (;;) {
    const key = localDay(d);
    if (state.days.includes(key)) { n++; d.setDate(d.getDate() - 1); } else break;
  }
  return n;
}

// ---------- practice journal (council 2026-08-23: decision-relevant events
// only, self-logged because hand-journaling corrupts the usage test) ----------
const jbuf = [];
function jlog(e, data = {}) {
  jbuf.push({ v: 1, t: Date.now(), e, ...data });
  if (jbuf.length >= 25) jflush();
}
function jflush() {
  if (!jbuf.length) return;
  const batch = JSON.stringify(jbuf.splice(0, jbuf.length));
  try {
    if (!navigator.sendBeacon?.('/journal', new Blob([batch], { type: 'application/json' }))) {
      fetch('/journal', { method: 'POST', body: batch, keepalive: true }).catch(() => {});
    }
  } catch { /* journal must never break practice */ }
}
setInterval(jflush, 10000);
window.addEventListener('pagehide', jflush);
window.addEventListener('error', (ev) => jlog('error', { msg: String(ev.message).slice(0, 200) }));
jlog('session_start');

// ---------- MIDI ----------
const midi = new MidiInput();
midi.onStatus = (text, connected) => {
  const el = $('midi-status');
  el.textContent = 'MIDI: ' + text.replace(/^Connected: /, '');
  el.dataset.connected = String(connected);
};

// Debug/test hooks: simulate a key or a control change from the console
// (never guess whether the pipeline works without hardware attached).
window.__simNote = (m, down = true, vel = 90) => midi.onNote?.(m, vel, down);
window.__simCC = (cc, val) => midi.onControl?.(cc, val);

// ---------- screens ----------
const screens = ['library', 'play', 'freeplay', 'calibrate', 'echo', 'metronome', 'rhythm', 'lessons', 'lesson', 'touch', 'takes', 'improv', 'keys12', 'path', 'task'];
function show(name) {
  // leaving any screen kills preview audio and its visual leftovers (audit #1, #9)
  stopPreview();
  stopMetronome();
  stopTakeAudio();
  if (takeRec && name !== 'play') finishTake('left-screen');
  if (perf && name !== 'play') perfEnd(); // walking off stage ends the take
  if (active === 'improv' && name !== 'improv' && improvEnterT) {
    jlog('improv', { min: +((Date.now() - improvEnterT) / 60000).toFixed(2) }); // minutes only, never scores
    improvEnterT = 0;
    improvOn = false;
  }
  previewActive = false;
  const hearBtn = $('btn-hear');
  if (hearBtn) hearBtn.textContent = '▶ Hear it';
  falls?.pressed.clear();
  echoView?.pressed.clear();
  // abandonment: leaving mid-song is exactly the signal the usage gate wants
  if (active === 'play' && name !== 'play' && engine && !engine.finished) {
    jlog('abandon', { id: song?.id, at: Math.round(engine.beat), of: Math.round(engine.endBeat) });
  }
  if (name !== active) jlog('screen', { to: name });
  for (const s of screens) $('screen-' + s).hidden = s !== name;
  $('results').hidden = true;
  active = name;
}
let active = 'library';

// ---------- library ----------
// 2026-08-28 council: ONE page, progressive disclosure. One amber next-action,
// Learning open (counted), Repertoire + Explore collapsed dense rows, search
// scoped to Explore, tools folded into the Learn/Practise/Tools rail.
function weakestSection() {
  let worst = null;
  for (const s of SONGS) {
    const acc = songStats(s.id).sectionAcc ?? {};
    for (const [name, rec] of Object.entries(acc)) {
      if (rec.best >= 85) continue;
      if (!worst || rec.best < worst.best) worst = { song: s, name, best: rec.best };
    }
  }
  return worst;
}
function resumeLastSession() {
  const last = state.lastSession;
  const lastSong = last && SONGS.find((s) => s.id === last.songId);
  if (!lastSong) return;
  startSong(lastSong);
  if (last.sec !== '') $('section-select').value = last.sec;
  $('tempo').value = last.tempo ?? 100;
  $('tempo-val').textContent = ($('tempo').value) + '%';
  $('wait-mode').checked = last.wait ?? true;
  if (last.hand && last.hand !== 'both') {
    hand = last.hand;
    document.querySelectorAll('.hand-btn').forEach((x) => (x.dataset.on = String(x.dataset.hand === hand)));
  }
  viewMode = last.view === 'score' ? 'score' : 'falls';
  syncModeButtons();
  rebuildEngine();
}
function trainWeakest(worst) {
  startSong(worst.song);
  const idx = worst.song.sections.findIndex((x) => x.name === worst.name);
  if (idx >= 0) startTraining(idx);
}
function renderNextAction() {
  const card = $('next-action');
  const last = state.lastSession;
  const lastSong = last && SONGS.find((s) => s.id === last.songId);
  const worst = weakestSection();
  const act = nextAction({ lastSession: last, lastSong, worst });
  card.hidden = false;
  $('next-action-label').textContent = act.label;
  $('next-action-reason').textContent = act.reason;
  card.onclick = () => {
    if (act.kind === 'resume') resumeLastSession();
    else if (act.kind === 'target') trainWeakest(worst);
    else $('btn-path').click();
  };
}

const starsOf = (id) => { const n = songStats(id).stars || 0; return '★'.repeat(n) + '☆'.repeat(3 - n); };
function makeCard(variants) {
  const main = variants[variants.length - 1];
  const st = songStats(main.id);
  const card = document.createElement('button');
  card.className = 'song-card';
  const levelRow = variants.length > 1
    ? `<div class="levels">` + variants.map((v) =>
        `<span class="level-btn" data-id="${v.id}">${v.level} <span class="stars">${starsOf(v.id)}</span></span>`).join('') + `</div>`
    : `<div class="stats"><span class="stars">${starsOf(main.id)}</span></div>`;
  card.innerHTML = `
    <span class="sheet-chip" aria-hidden="true"><b>${main.title.replace(/^(The|A|An) /, '')[0]}</b><span>${main.bpm}</span></span>
    <h3>${main.title}</h3>
    <div class="composer">${main.composer.replace(' · easy arrangement', '')} · ${main.bpm} bpm</div>
    ${levelRow}
    <div class="stats">
      <span>Plays <b>${variants.reduce((a, v) => a + songStats(v.id).plays, 0)}</b></span>
      <span>Top score <b>${Math.max(...variants.map((v) => songStats(v.id).bestScore || 0))}</b></span>
      <span class="${st.scorePasses > 0 ? 'learned' : ''}">${st.scorePasses > 0 ? '♪ read from score' : ''}</span>
    </div>`;
  // card click: the ladder — first unbeaten tier, Easy upward
  card.addEventListener('click', () => {
    const pick = variants.find((v) => (songStats(v.id).stars || 0) < 3) ?? main;
    startSong(pick);
  });
  for (const btn of card.querySelectorAll('.level-btn')) {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      startSong(SONGS.find((s) => s.id === btn.dataset.id));
    });
  }
  return card;
}
function makeRow(variants) {
  const main = variants[variants.length - 1];
  const row = document.createElement('button');
  row.className = 'song-row';
  const topStars = starsOf(main.id);
  // tier chips are clickable: Mark jumps straight to Hard on new songs
  const tiers = variants.length > 1
    ? variants.map((v) => `<i class="row-tier" data-id="${v.id}" title="${v.level}">${(v.level || '')[0]}</i>`).join('')
    : '';
  row.innerHTML = `
    <span class="row-title">${main.title}</span>
    <span class="row-meta">${main.composer.replace(' · easy arrangement', '')}</span>
    <span class="row-tiers">${tiers}</span>
    <span class="row-stars stars">${(songStats(main.id).stars || 0) > 0 ? topStars : ''}</span>`;
  row.addEventListener('click', () => {
    const pick = variants.find((v) => (songStats(v.id).stars || 0) < 3) ?? main;
    startSong(pick);
  });
  for (const chip of row.querySelectorAll('.row-tier')) {
    chip.addEventListener('click', (ev) => {
      ev.stopPropagation();
      startSong(SONGS.find((s) => s.id === chip.dataset.id));
    });
  }
  return row;
}

state.lib = Object.assign({ learning: true, repertoire: false, explore: false }, state.lib || {});
let exploreQuery = '';
function renderLibrary() {
  $('streak').textContent = streakLen() > 0 ? `🔥 ${streakLen()} day streak` : '';
  renderNextAction();
  renderFormCard();
  renderPracticeChart();
  for (const song of SONGS) {
    const errs = validateSong(song);
    if (errs.length) console.error(song.id, errs);
  }
  const groups = groupSongs(SONGS);
  const { learning, repertoire, explore } = classifyGroups(groups, songStats);
  $('learn-count').textContent = learning.length ? String(learning.length) : '';
  const fill = (id, items, make) => {
    const el = $(id);
    el.innerHTML = '';
    for (const v of items) el.appendChild(make(v));
    if (!items.length) el.innerHTML = `<p class="hint">${id === 'list-learning' ? 'Nothing in flight — pick something from Explore.' : 'Nothing here yet.'}</p>`;
  };
  fill('list-learning', learning, makeCard);
  fill('list-repertoire', repertoire, makeRow);
  fill('list-explore', filterExplore(explore, exploreQuery), makeRow);
  // collapse state (persisted; Learning defaults open)
  for (const head of document.querySelectorAll('.lib-head')) {
    const sec = head.dataset.sec;
    const open = !!state.lib[sec];
    head.setAttribute('aria-expanded', String(open));
    head.closest('.lib-sec').classList.toggle('open', open);
  }
  // search: icon until the catalog earns a persistent field
  const persistent = explore.length >= SEARCH_PERSISTENT_AT;
  $('explore-search').hidden = !(persistent || exploreQuery || $('explore-search').dataset.open === 'true');
  $('explore-search-btn').hidden = !$('explore-search').hidden;
}
for (const head of document.querySelectorAll('.lib-head')) {
  head.addEventListener('click', (ev) => {
    if (ev.target.closest('.lib-search')) return; // the search control is not a toggle
    const sec = head.dataset.sec;
    state.lib[sec] = !state.lib[sec];
    store.save(state);
    renderLibrary();
  });
}
$('explore-search-btn').addEventListener('click', (ev) => {
  ev.stopPropagation();
  $('explore-search').dataset.open = 'true';
  state.lib.explore = true;
  store.save(state);
  renderLibrary();
  $('explore-search').focus();
});
$('explore-search').addEventListener('input', () => {
  exploreQuery = $('explore-search').value;
  renderLibrary();
  $('explore-search').focus();
});
// rail: one sheet open at a time, tap again to close (state is not persisted —
// the rail is a menu, not a mode)
for (const btn of document.querySelectorAll('.rail-btn')) {
  btn.addEventListener('click', () => {
    const id = 'rail-' + btn.dataset.rail;
    const sheet = $(id);
    const wasOpen = !sheet.hidden;
    for (const s of document.querySelectorAll('.rail-sheet')) s.hidden = true;
    for (const b of document.querySelectorAll('.rail-btn')) b.classList.remove('on');
    if (!wasOpen) { sheet.hidden = false; btn.classList.add('on'); }
  });
}

// ---------- play ----------
let engine = null, song = null, falls = null, score = null;
let viewMode = 'falls'; // council default; score one tap away
let hand = 'both';
let sightMode = false;
let wrongByGroup = new Map(); // "60,64,69" -> {count, midis} for theory triggers
let cardTask = null; // open theory card listener
let raf = 0, lastT = 0, scorePassFlag = false;
let armed = false, armCountUntil = 0; // timed mode waits for the first key, then a 1-bar count-in
let combo = 0, points = 0, bestCombo = 0;
let paceSamples = []; // rolling engine 'pace' ratios (your speed vs the song's)
let lastBiasAt = 0;   // rate limit for the "Mostly Nms ahead" line (council 08-24)
const MILESTONES = new Set([10, 25, 50, 100, 200]);

// Colour-blind law: the meter's signal is POSITION + WORDS; colour is garnish.
function paceHtml() {
  if (paceSamples.length < 2) return '';
  const mean = paceSamples.reduce((a, v) => a + v, 0) / paceSamples.length;
  const pct = Math.round(Math.min(2, Math.max(0.4, mean)) * 100);
  const state = pct < 85 ? 'SPEED UP' : pct > 115 ? 'RUSHING' : 'ON PACE';
  const fill = Math.min(100, Math.max(0, ((pct - 50) / 100) * 100));
  return `<span class="pace ${state === 'ON PACE' ? 'pace-good' : ''}">
    <span class="pace-meter"><i style="width:${fill}%"></i><b class="pace-notch"></b></span>
    <span class="pace-label">${pct}% · ${state}</span></span>`;
}
// Pedal indicator: SHAPE + WORDS carry the state (colour-blind law), and it
// only appears once the pedal has actually spoken during this run.
function pedalHtml() {
  if (!engine || (!engine.pedalLog.length && !engine.pedalDown)) return '';
  return engine.pedalDown
    ? `<span class="pedal-ind down">▼ PEDAL DOWN</span>`
    : `<span class="pedal-ind">△ pedal up</span>`;
}

// Section trainer (Simply Piano style): loop a section slow, pass it twice,
// speed up 10%, reach 100% and it is marked passed; then the next section.
let trainer = null; // {secIdx | chunk:true, tempoPct, passes}
let chunkIdx = null; // active learning-chunk index, null = chunks off
let memo = null; // memory ladder {section, rec:{stage,passes}, cues, recallBar}
let memoLastClickBeat = null; // blank-stage metronome edge detector
let loopOverride = null; // one-shot {start,end} consumed by the next rebuild
const PASS_ACC = 85;
let previewActive = false, previewStop = null;

function comboFlash(n) {
  const el = $('combo-flash');
  el.textContent = `${n} NOTE STREAK`;
  el.classList.remove('go');
  void el.offsetWidth; // restart the animation
  el.classList.add('go');
}

function startSong(s, { asScorePass = false } = {}) {
  jlog('song_start', { id: s.id, sight: !!s.sightRead });
  song = s;
  sightMode = !!s.sightRead;
  scorePassFlag = asScorePass;
  viewMode = (asScorePass || sightMode) ? 'score' : 'falls';
  hand = 'both';
  // sight reading is score-led by definition: no falls, no hearing it first
  $('mode-falls').disabled = sightMode;
  $('btn-hear').disabled = sightMode;
  $('btn-train').disabled = sightMode;
  show('play');
  $('now-playing').textContent = `${s.title}${s.level ? ' · ' + s.level : ''} · ${s.composer.replace(' · easy arrangement', '')}`;
  renderSections();
  $('section-select').value = '';
  chunkIdx = null; syncChunkLabel();
  trainer = null; syncTrainButton();
  $('tempo').value = 100; $('tempo-val').textContent = '100%';
  // sight reading: read at your own pace early, in time from level 3
  $('wait-mode').checked = sightMode ? (state.sight?.level ?? 1) < 3 : true;
  rebuildEngine();
  syncModeButtons();
}

function renderSections() {
  const passed = songStats(song.id).sectionsPassed ?? {};
  const sel = $('section-select');
  const keep = sel.value;
  sel.innerHTML = '<option value="">Whole song</option>' +
    (song.sections ?? []).map((x, i) => `<option value="${i}">${passed[x.name] ? '✓ ' : ''}${x.name}</option>`).join('');
  sel.value = keep && +keep < (song.sections?.length ?? 0) ? keep : '';
}

function chunkBars() { return +$('chunk-size').value; }
function syncChunkLabel() {
  const btn = $('chunk-label');
  if (chunkIdx === null) { btn.textContent = '🧩 Chunks off'; return; }
  const c = chunkRange(song, chunkIdx, chunkBars());
  btn.textContent = `🧩 Chunk ${c.idx + 1} / ${c.count}`;
}

function rebuildEngine() {
  const secIdx = $('section-select').value;
  const loop = loopOverride ? { ...loopOverride }
    : chunkIdx !== null
    ? (() => { const c = chunkRange(song, chunkIdx, chunkBars()); return { start: c.start, end: c.end }; })()
    : secIdx === '' ? null : {
      start: song.sections[+secIdx].startBeat,
      end: song.sections[+secIdx].endBeat,
    };
  loopOverride = null; // one-shot: only the rebuild that was handed it uses it
  engine = new Engine(song, {
    hand,
    tempo: (+$('tempo').value) / 100,
    waitMode: $('wait-mode').checked,
    loop,
    calOffsetMs: state.calOffsetMs,
  });
  combo = 0; points = 0; bestCombo = 0;
  paceSamples = [];
  lastBiasAt = 0;
  wrongByGroup = new Map();
  window.__engine = engine; // debug/test handle, same spirit as __simNote
  if (!falls) falls = new FallsView($('falls'));
  falls.noteStyle = window.__keysNoteStyle;
  falls.cueLetters = state.showLetters !== false;
  // Wait mode freezes the clock, so EARLY/PERFECT/LATE cannot exist there —
  // say so once, or the verdicts just look broken (Mark, 2026-08-25)
  if ($('wait-mode').checked && !window.__verdictHintShown) {
    window.__verdictHintShown = true;
    setTimeout(() => falls?.biasNote('Wait mode is on — turn "Wait for me" off to see EARLY / PERFECT / LATE'), 1200);
  }
  falls.handMap = new Map(song.notes.map((n) => [n.m, n.h])); // fountain colours per hand
  falls.chunkBeats = chunkIdx !== null ? chunkRange(song, chunkIdx, chunkBars()).chunkBeats : null;
  falls.resize();
  if (!score) score = new ScoreView($('score-wrap'));
  score.build(song, engine);
  trainer = null;
  syncTrainButton();
  memo = null; // manual control changes exit memorize (keep-path restores)
  applyMemCues();
  // return loop: remember exactly where he is, every rebuild
  state.lastSession = {
    songId: song.id, sec: secIdx, tempo: $('tempo').value,
    hand, wait: $('wait-mode').checked, view: viewMode,
  };
  store.save(state);
  armed = !$('wait-mode').checked;
  armCountUntil = 0;
  falls.banner = armed ? 'Press any key when ready — then one bar counts you in' : null;
  if (armed) comboFlash('PRESS ANY KEY TO START');
  lastT = 0;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loopFrame);
}

// the trigger press is consumed: it starts the count-in, it is never judged
function startArmCountIn() {
  armed = false;
  falls.banner = null;
  armCountUntil = performance.now() + 4 * engine.msPerBeat();
  metCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  metCtx.resume();
  const spb = engine.msPerBeat() / 1000;
  const t0 = metCtx.currentTime + 0.08;
  for (let i = 0; i < 4; i++) {
    const o = metCtx.createOscillator(), g = metCtx.createGain();
    o.type = 'square'; o.frequency.value = i === 0 ? 1500 : 1000;
    g.gain.setValueAtTime(i === 0 ? 0.25 : 0.16, t0 + i * spb);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + i * spb + 0.05);
    o.connect(g).connect(metCtx.destination);
    o.start(t0 + i * spb); o.stop(t0 + i * spb + 0.06);
  }
}

function loopFrame(t) {
  if (active !== 'play') return;
  // clamp the delta: a backgrounded tab must not deliver minutes in one tick
  // and instantly fail the whole song (audit #5)
  // performance count-in: clock holds for four beats while the clicks play
  if (armCountUntil && t >= armCountUntil) armCountUntil = 0;
  const clockHeld = armed || (armCountUntil && t < armCountUntil);
  if (lastT && !previewActive && !clockHeld && !(perf && t < perf.countUntil)) engine.tick(Math.min(200, t - lastT));
  lastT = t;
  for (const ev of engine.drainEvents()) {
    if (perf) perf.tracker.event(ev.type, engine.beat);
    if (ev.type === 'lap') { onLap(ev); continue; }
    if (ev.type === 'pace') { paceSamples.push(ev.ratio); if (paceSamples.length > 6) paceSamples.shift(); continue; }
    // visual effects only when the falls canvas is the live surface: in score
    // mode nothing ages particles and they pile up by the ten-thousand (audit #7)
    const fx = viewMode === 'falls';
    if (ev.type === 'perfect') {
      combo++; const p = 100 + Math.min(combo, 50) * 2; points += p;
      if (fx) falls.burst(ev.midi, 'perfect', `+${p}`);
    } else if (ev.type === 'good') {
      combo++; const p = 60 + Math.min(combo, 50); points += p;
      if (fx) falls.burst(ev.midi, 'good', `+${p}`);
    } else if (ev.type === 'late') {
      points += 20; if (fx) falls.burst(ev.midi, 'good');
    }
    // timing strip + rate-limited bias line (council 08-24): every accepted
    // timed press drops a spatial tick; text appears only for a persistent lean
    if (ev.deltaMs != null && fx) {
      falls.strikeVerdict(ev.midi, ev.type, ev.deltaMs);
      falls.timingTick(ev.deltaMs, ev.hand);
      if (t - lastBiasAt > 8000) {
        const bias = biasText(engine.timing);
        if (bias) { falls.biasNote(bias); lastBiasAt = t; }
      }
    }
    if (ev.type === 'wrong' || ev.type === 'early' || ev.type === 'missed') {
      if (ev.type !== 'early') combo = 0;
      if (fx) falls.flash(ev.midi, 'wrong');
      // theory trigger data: which expected group was fumbled (audit-by-play)
      if (ev.type === 'wrong') {
        const g = engine.currentGroup();
        if (g) {
          const midis = g.notes.map((n) => n.m).sort((a, b) => a - b);
          const key = midis.join(',');
          const rec = wrongByGroup.get(key) ?? { count: 0, midis };
          rec.count++;
          wrongByGroup.set(key, rec);
        }
      }
    }
    bestCombo = Math.max(bestCombo, combo);
    falls.comboLevel = combo >= 25 ? 2 : combo >= 10 ? 1 : 0;
    if (MILESTONES.has(combo)) comboFlash(combo);
  }
  // hint + target keys: name and light the keys due right now (the memory
  // ladder strips these cues stage by stage)
  const cur = engine.currentGroup();
  const due = cur && (engine.waiting || cur.beat - engine.beat < 1)
    ? cur.notes.filter((n) => !cur.done.has(n.m)) : [];
  falls.hint = (!memo || memo.cues.hints) && engine.waiting && due.length ? due.map((n) => noteName(n.m)).join(' + ') : null;
  falls.targets = (!memo || memo.cues.targets) ? new Set(due.map((n) => n.m)) : new Set();
  memMetronomeTick();
  if (viewMode === 'falls') falls.draw(engine);
  else score.update(engine, hand);
  const s = engine.stats;
  $('hud').innerHTML = `
    <span>Score <b>${points}</b></span>
    <span>Combo <b>${combo > 0 ? 'x' + combo : '-'}</b></span>
    <span>Accuracy <b>${engine.accuracy()}%</b></span>
    <span class="h-wrong">Wrong <b>${s.wrong}</b></span>` + paceHtml() + pedalHtml();
  if (engine.finished) { finishSong(); return; }
  scheduleFrame();
}

function finishSong() {
  if (takeRec) finishTake(); // a finished song closes and shelves its take
  markPracticedToday();
  logPracticeMinutes(engine.timeMs / 60000);
  jlog('song_finish', { id: song.id, acc: engine.accuracy(), wrong: engine.stats.wrong, mode: viewMode, sight: sightMode });
  if (sightMode) { finishSightRead(); return; }
  const acc = engine.accuracy();
  const stars = acc >= 90 ? 3 : acc >= 75 ? 2 : acc >= 50 ? 1 : 0;
  const st = songStats(song.id);
  const prevAcc = st.lastAcc;
  st.lastAcc = acc;
  st.plays++;
  st.best = Math.max(st.best, acc);
  st.stars = Math.max(st.stars || 0, stars);
  st.bestScore = Math.max(st.bestScore || 0, points);
  if (scorePassFlag || viewMode === 'score') st.scorePasses++;
  store.save(state);
  const s = engine.stats;
  $('results-title').innerHTML = `<span class="stars big">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span> ` +
    (acc >= 90 ? 'Beautiful.' : acc >= 70 ? 'Nice one.' : 'Keep at it.');
  // capability delta (council: this replaces XP as the motivator)
  const delta = prevAcc != null
    ? `<span class="${acc >= prevAcc ? 'delta-up' : 'delta-down'}">last time ${prevAcc}% → today <b>${acc}%</b></span>`
    : '';
  $('results-stats').innerHTML = `
    <span><b>${points}</b>score</span>
    <span><b>${acc}%</b>accuracy</span>
    <span><b>x${bestCombo}</b>best combo</span>
    <span><b>${s.wrong}</b>wrong</span>` + delta;
  // mastery analyzers (council 08-24): how he played, not just what he hit
  const analysis = [];
  if (engine.pedalLog.length) {
    const pf = analyzePedal(engine.pedalLog, engine.playLog, { sections: song.sections ?? [] });
    const barOf = (b) => Math.floor(b / song.timeSig[0]) + 1;
    const pnotes = pedalNotes(pf, barOf);
    analysis.push(...(pnotes.length ? pnotes.map((t) => '🦶 Pedal: ' + t) : ['🦶 Pedal: clean. Changes landed with the harmony.']));
  }
  const art = articulationSummary(analyzeArticulation(engine.playLog, engine.msPerBeat()), song.sections ?? [], song.timeSig[0]);
  if (art) analysis.push('♪ Articulation: ' + art.text);
  const voi = state.touch?.zones ? analyzeVoicing(engine.playLog, state.touch) : null;
  const vtext = voicingText(voi, song.timeSig[0]);
  if (vtext) analysis.push('⚖ Voicing: ' + vtext);
  // signed timing story (council 08-24): the lean, not just the error size
  const ts = timingSummary(engine.timing);
  if (ts) {
    const lean = Math.abs(ts.median) < 15 ? 'dead centre'
      : `${Math.abs(ts.median)}ms ${ts.median < 0 ? 'ahead' : 'behind'}`;
    analysis.push(`⏱ Timing: ${lean}, consistency ±${ts.spread}ms over ${ts.count} notes`);
  }
  if (!ts && engine.responses.length) {
    const rs = timingSummary(engine.responses);
    analysis.push(`⚡ Response: median ${rs.median}ms after each note arrives (wait mode)`);
  }
  $('results-analysis').innerHTML = analysis.map((t) => `<li>${t}</li>`).join('');
  $('results-analysis').hidden = analysis.length === 0;
  if (analysis.length) jlog('analysis', { id: song.id, pedalEvents: engine.pedalLog.length, legatoPct: art?.legatoPct ?? null, clipped: art?.clipped ?? null, voicingAbovePct: voi?.abovePct ?? null });

  // performance report: continuity is the story, not cleanliness
  if (perf) {
    const r = perf.tracker.result();
    $('results-title').textContent = `🎭 ${r.rating}`;
    $('results-stats').innerHTML = `
      <span><b>${r.longestRun}</b>longest run</span>
      <span><b>${r.stumbles}</b>stumbles</span>
      <span><b>${r.avgRecoveryBeats}</b>beats to recover</span>
      <span><b>${acc}%</b>accuracy</span>`;
    jlog('perf_run', { id: song.id, longestRun: r.longestRun, errors: r.errors, stumbles: r.stumbles, avgRecoveryBeats: r.avgRecoveryBeats, acc });
    perfEnd();
  }

  const needsScorePass = songStats(song.id).scorePasses === 0;
  $('results-nudge').textContent = needsScorePass
    ? 'To mark this learned, play one pass reading the score. That is where the music-reading actually happens.'
    : '';
  $('results-score-pass').style.display = needsScorePass ? '' : 'none';
  $('results-score-pass').textContent = 'Score-mode pass';
  // theory card offer: the chord he fumbled 3+ times this run
  let worst = null;
  for (const rec of wrongByGroup.values()) if (rec.count >= 3 && (!worst || rec.count > worst.count)) worst = rec;
  const tBtn = $('results-theory');
  if (worst) {
    const card = matchCard(worst.midis);
    tBtn.hidden = false;
    tBtn.textContent = `🎓 ${card.title}`;
    tBtn.onclick = () => openTheoryCard(card);
  } else tBtn.hidden = true;
  $('results').hidden = false;
}

// ---------- sight reading ----------
const sightState = () => (state.sight ??= { level: 1, cleans: 0, flops: 0, done: 0 });
function newSightExercise() {
  const s = sightState();
  const ex = makeExercise(s.level, (Date.now() ^ (s.done * 2654435761)) >>> 0);
  startSong(ex);
}
function finishSightRead() {
  const acc = engine.accuracy();
  const s = engine.stats;
  const { next, msg } = judgeSight(sightState(), acc, s.wrong);
  state.sight = next;
  store.save(state);
  $('results-title').textContent = `📖 ${msg}`;
  $('results-stats').innerHTML = `
    <span><b>${s.perfect + s.good}</b>on time</span>
    <span><b>${s.late}</b>late</span>
    <span><b>${s.wrong}</b>wrong</span>
    <span><b>${acc}%</b>accuracy</span>
    <span><b>L${next.level}</b>sight level</span>`;
  $('results-nudge').textContent = next.level >= 3 && (state.sight.level ?? 1) >= 3
    ? 'From level 3 the exercise runs in time: read AHEAD of the cursor.'
    : 'Read the score, not your hands. Wrong notes are fine; stopping is the enemy.';
  $('results-score-pass').style.display = '';
  $('results-score-pass').textContent = 'Next exercise →';
  $('results-theory').hidden = true;
  $('results').hidden = false;
}
$('btn-sight').addEventListener('click', () => { show('play'); newSightExercise(); });

// ---------- theory card ----------
function openTheoryCard(card) {
  $('results').hidden = true;
  $('theory-title').textContent = card.title;
  $('theory-body').textContent = card.body;
  $('theory-status').textContent = `Play ${card.task.length > 1 ? 'these notes TOGETHER' : 'it'}, twice: ${card.task.map((m) => noteName(m)).join(' + ')}`;
  cardTask = new CardTask(card.task);
  $('theory-card').hidden = false;
  (state.theory ??= {})[card.title] = ((state.theory ?? {})[card.title] ?? 0) + 1;
  store.save(state);
}
$('theory-close').addEventListener('click', () => { $('theory-card').hidden = true; cardTask = null; });
window.__openCard = openTheoryCard; // debug/test lever, same spirit as __simNote
function theoryNote(m, isDown) {
  if (!cardTask) return;
  const res = cardTask.note(m, isDown);
  if (res === 'again') $('theory-status').textContent = 'Yes. Once more.';
  else if (res === 'done') {
    $('theory-status').textContent = '✓ Learned. That chord is yours now.';
    comboFlash('THEORY ★');
    setTimeout(() => { $('theory-card').hidden = true; cardTask = null; }, 1400);
  }
}

// ---------- lessons (the taught curriculum) ----------
let lessonDef = null, lessonScore = null, reviewMode = false, reviewFirstTry = 0, reviewTotal = 0;
const lessonsDone = () => (state.lessons ??= {});
// item-level first-attempt ledger: the mastery signal (council 08-24)
function recordItem(key, firstOk) {
  const rec = ((state.litems ??= {})[key] ??= { n: 0, fm: 0 });
  rec.n++;
  if (!firstOk) rec.fm++;
  store.save(state);
}

function renderLessonList() {
  const done = lessonsDone();
  $('btn-review').hidden = Object.keys(done).length < 2; // pull, never nag
  const list = $('lesson-list');
  list.innerHTML = '';
  // numbered curriculum spine (10th council): sequential states as shape+word
  let unlocked = true;
  LESSONS.forEach((les, i) => {
    const isDone = !!done[les.id];
    const card = document.createElement('button');
    card.className = 'lesson-card' + (isDone ? ' done' : '') + (unlocked ? '' : ' locked');
    card.disabled = !unlocked;
    const star = state.lessonStars?.[les.id] ? '<span class="spine-star" title="retention star: nailed in a later review">★</span>' : '';
    const badge = state.lessonBadges?.[les.id] ? '<span class="spine-badge" title="clean run: zero misses">🏅</span>' : '';
    const stateChip = isDone ? '<span class="spine-state done"><i>✓</i>Complete</span>'
      : unlocked ? '<span class="spine-state ready"><i>▶</i>Ready</span>'
      : '<span class="spine-state locked"><i>○</i>Locked</span>';
    card.innerHTML = `<span class="spine-num">${String(i + 1).padStart(2, '0')}</span>` +
      `<span class="spine-title">${les.title}</span>${star}${badge}${stateChip}`;
    if (unlocked) card.addEventListener('click', () => openLesson(les));
    list.appendChild(card);
    if (!isDone) unlocked = false; // sequential unlock
  });
}

function lessonStaveSong(items) {
  // render the prompt on the grand staff; items may carry a beat for phrases
  return {
    id: 'lesson-prompt', title: '', bpm: 60, timeSig: [4, 4], beatUnit: 4, sections: [],
    noTimeSig: true, // a drill prompt has no meter; the 4/4 read as "octave 4"
    notes: items.map(({ m, h, b }) => ({ b: b ?? 0, d: b != null ? 1 : 4, m, h })),
  };
}
function showLessonPrompt(items) {
  lessonScore ??= new ScoreView($('lesson-stave'));
  const promptSong = lessonStaveSong(items);
  const promptEngine = new Engine(promptSong, { waitMode: true });
  lessonScore.build(promptSong, promptEngine);
}

// ---- game wiring (9th council 2026-08-25): teach -> levels -> melody payoff ----
let lessonRunner = null, lessonView = null;
let lessonTapCount = 0, lessonMidiCount = 0;

function drawLessonKeys() {
  if (active !== 'lesson' || !lessonView) return;
  const c = lessonView;
  c.ctx.fillStyle = COLORS.bg;
  c.ctx.fillRect(0, 0, c.w, c.h);
  c.kbH = c.h - 4;
  c._drawKeyboard(4);
  // restrained impact fx (9th council): the correct-press celebration the
  // lesson surface never had — flares/sparks land on the keyboard top edge
  const dt = 0.016;
  c._drawFlares(4, dt);
  c._drawParticles(dt);
  c._drawFloaters(dt);
  requestAnimationFrame(drawLessonKeys);
}

// every midi a lesson can ask for, to size the zoomed keyboard
function lessonMidis(les) {
  const out = [];
  if (les.ex) out.push(les.ex.m);
  if (les.exChord) out.push(...les.exChord);
  const d = les.drill;
  if (d.type === 'staff') out.push(...d.pool.map((p) => p.m));
  else if (d.type === 'phrase') for (const ph of PHRASES) out.push(...ph.ms);
  else if (d.items) for (const it of d.items) out.push(...it);
  return out;
}

// Octave coaching (2026-08-25, Mark pressed D5 for E4 and asked "which E?"):
// name the RELATIONSHIP, not just the miss. Direction is physical.
function whichKeyHint(pressed, exp) {
  if (!exp.length || exp.includes(pressed)) return '';
  const target = exp.reduce((a, b) => (Math.abs(b - pressed) < Math.abs(a - pressed) ? b : a));
  const dir = pressed > target ? 'LEFT (lower)' : 'RIGHT (higher)';
  if (pressed % 12 === target % 12) {
    const oct = Math.abs(pressed - target) / 12;
    return ` Right letter, wrong octave: ${noteName(pressed)} and ${noteName(target)} are the same letter ${oct} octave${oct > 1 ? 's' : ''} apart. The number picks WHICH one: go ${dir} to the lit key. Higher on the stave = further right on the keyboard.`;
  }
  return ` It is to the ${pressed > target ? 'LEFT' : 'RIGHT'} of what you pressed.`;
}

// draw one drill item (any shape) on the stave
function promptItems(it) {
  if (Array.isArray(it)) return it.map((m) => ({ m, h: m < 60 ? 'L' : 'R' }));
  if (it.ms) return it.ms.map((m, i) => ({ m, h: it.h, b: i }));
  return [it];
}
function showCurrentPrompt() {
  const lv = lessonRunner.level;
  if (lv?.melody) {
    // the payoff: whole melody on the stave, current note lit (victory lap,
    // not assessment — no litems recorded here)
    const items = lv.melody.flatMap((it, i) =>
      Array.isArray(it) ? it.map((m) => ({ m, h: m < 60 ? 'L' : 'R', b: i })) : [{ ...it, b: i }]);
    showLessonPrompt(items);
  } else showLessonPrompt(promptItems(lessonRunner.current));
  lessonView.targets = new Set(lv?.melody ? lessonRunner.expected() : []);
}
// game HUD (10th council): ONE level rail answering "where am I in the
// lesson?", plus a FIXED slot ledger from the authored round answering "how
// is this round going?" — never the mutable retry queue, so the finish line
// can never move backwards on a miss. States are shape + word, not hue.
function updateLessonHud() {
  const p = lessonRunner?.progress();
  if (!p) { $('lesson-phase').textContent = ''; $('lesson-progress').innerHTML = ''; return; }
  const mode = p.melody ? 'play it through' : p.labels ? 'names on' : 'names off';
  $('lesson-phase').innerHTML =
    `<span class="lvl-rail"><b>LEVEL ${p.level} / ${p.of}</b><em>${p.name}</em><span class="lvl-mode">${mode}</span></span>`;
  const word = { clean: 'clean', recov: 'recovered', todo: 'to play' };
  const dots = p.slots.map((s, i) =>
    `<i class="slot ${s}${i === p.activeSlot ? ' now' : ''}" title="${word[s]}"></i>`).join('');
  $('lesson-progress').innerHTML = `<span class="slot-row">${dots}</span>` +
    (p.melody ? '' : `<span class="slot-need">${p.firstTry} / ${p.pass} clean</span>`);
}

function openLesson(les) {
  lessonDef = les;
  reviewMode = false;
  lessonRunner = null;
  lessonTapCount = 0; lessonMidiCount = 0;
  show('lesson');
  $('now-playing').textContent = 'Lesson';
  $('lesson-title').textContent = les.title;
  $('lesson-body').textContent = '';
  $('lesson-steps').innerHTML = les.steps.map((s) => `<li>${s}</li>`).join('');
  $('lesson-video').innerHTML = `🎥 Still confused? <a href="${les.video.url}" target="_blank" rel="noopener">Watch: ${les.video.title}</a> (free, opens YouTube)`;
  $('lesson-nomidi').hidden = $('midi-status').dataset.connected === 'true';
  $('lesson-rhythm-link').hidden = les.drill.type !== 'rhythm-gate';
  $('lesson-phase').textContent = '';
  $('lesson-stave').innerHTML = '';
  lessonScore = null;
  // the tappable, labelled keyboard is part of every lesson
  if (!lessonView) lessonView = new FallsView($('lesson-keys'));
  lessonView.kbLetters = true;
  lessonView.targets = new Set();
  lessonView.pressed.clear();
  // zoom to the octaves this lesson uses (middle C always anchored + dotted)
  const kr = lessonKeyRange(lessonMidis(les));
  lessonView.setRange(kr.lo, kr.hi);
  lessonView.markMiddleC = true;
  $('lesson-keys').hidden = les.drill.type === 'rhythm-gate';
  $('lesson-kb-toggle').hidden = les.drill.type === 'rhythm-gate';
  $('lesson-kb-toggle').textContent = 'Hide keyboard';
  lessonView.resize();
  drawLessonKeys();

  if (les.drill.type === 'rhythm-gate') {
    $('lesson-start').hidden = true;
    const cleans = (state.rhythm?.totalCleans ?? 0);
    if (cleans > 0) { completeLesson(); }
    else {
      $('lesson-msg').textContent = 'One clean Rhythm tap round finishes this lesson.';
      $('lesson-progress').textContent = '';
    }
    return;
  }

  // TEACH: the worked example, shown and heard BEFORE any assessment
  const demo = les.exChord ?? (les.ex ? [les.ex.m] : []);
  if (demo.length) {
    showLessonPrompt(demo.map((m) => ({ m, h: les.ex?.h ?? (m < 60 ? 'L' : 'R') })));
    lessonView.targets = new Set(demo);
    playPreview(demo.map((m) => ({ b: 0, d: 2, m, h: 'R' })), 600, null, null);
    $('lesson-msg').textContent = `This is ${demo.map((m) => noteName(m)).join(' + ')}: on the stave above, lit on the keyboard below. When it makes sense, start the drill.`;
  }
  $('lesson-progress').textContent = '';
  $('lesson-start').hidden = false;
}

function beginLessonDrill() {
  if (!lessonDef?.game || !lessonView) return; // no lesson open: nothing to start
  $('lesson-start').hidden = true;
  lessonView.targets = new Set();
  lessonRunner = new LevelRunner(buildLevels(lessonDef));
  enterLevel();
}

// present the current level: assistance (key names) is a property of the
// LEVEL, the instruction matches the item shape, HUD shows segments + pips
function enterLevel() {
  const lv = lessonRunner.level;
  lessonView.kbLetters = lv.labels !== false;
  const it = lessonRunner.current;
  const how = Array.isArray(it) ? 'Play the notes shown TOGETHER.'
    : it?.ms ? 'Play the phrase in order.'
    : 'Read the note, play it.';
  $('lesson-msg').textContent = lv.melody
    ? '🎵 The payoff: play the melody you just learned. Each next key lights up.'
    : lv.mixed ? `Mix round, names off. ${how}`
    : `${lv.name}. ${how}`;
  showCurrentPrompt();
  updateLessonHud();
}
for (const b of document.querySelectorAll('#notestyle-seg .seg-btn')) {
  b.addEventListener('click', () => {
    for (const o of document.querySelectorAll('#notestyle-seg .seg-btn')) o.dataset.on = String(o === b);
    applyNoteStyle(b.dataset.style, $('chk-letters').checked);
  });
}
$('chk-letters').addEventListener('change', () => {
  applyNoteStyle(window.__keysNoteStyle, $('chk-letters').checked);
});
// restore the persisted choice into the controls at boot
if (state.noteStyle === 'moon') {
  for (const o of document.querySelectorAll('#notestyle-seg .seg-btn')) o.dataset.on = String(o.dataset.style === 'moon');
}
if (state.showLetters === false) $('chk-letters').checked = false;

$('lesson-start').addEventListener('click', beginLessonDrill);
window.__lesson = () => lessonRunner; // debug/test lever, same spirit as __engine
$('lesson-kb-toggle').addEventListener('click', () => {
  const cvs = $('lesson-keys');
  cvs.hidden = !cvs.hidden;
  $('lesson-kb-toggle').textContent = cvs.hidden ? 'Show keyboard' : 'Hide keyboard';
  if (!cvs.hidden) { lessonView.resize(); drawLessonKeys(); }
});
$('lesson-keys').addEventListener('pointerdown', (e) => {
  if (!lessonView) return;
  const r = e.currentTarget.getBoundingClientRect();
  const m = lessonView.pickKeyAt(e.clientX - r.left, e.clientY - r.top, 4, lessonView.h - 4);
  if (m != null) lessonNote(m, true, 'tap');
});

function completeLesson() {
  const clean = !!lessonRunner && lessonRunner.misses === 0;
  lessonsDone()[lessonDef.id] = Date.now(); // timestamp feeds review recency
  if (clean) (state.lessonBadges ??= {})[lessonDef.id] = true; // clean run, not a star
  store.save(state);
  markPracticedToday();
  const cap = lessonDef.game?.capability ?? '';
  $('lesson-msg').textContent = `✓ Lesson complete.${clean ? ' 🏅 Clean run!' : ''} ${cap} Next one unlocked.`;
  comboFlash(clean ? 'CLEAN RUN 🏅' : 'LESSON ✓');
  // flourish: the app plays back the melody he just earned, on the grand
  const mel = lessonDef.game?.melody;
  if (mel) {
    const notes = mel.flatMap((it, i) => Array.isArray(it)
      ? it.map((mm) => ({ b: i, d: 1, m: mm, h: mm < 60 ? 'L' : 'R' }))
      : [{ b: i, d: 1, m: it.m, h: it.h }]);
    playPreview(notes, 140, null, null);
  }
  lessonRunner = null;
  setTimeout(() => { if (active === 'lesson') { show('lessons'); renderLessonList(); } }, 2600);
}

function lessonNote(m, isDown, mode = 'midi') {
  if (!lessonDef) return;
  if (reviewMode) { reviewNote(m, isDown); return; }
  if (!lessonRunner || lessonRunner.done) return;
  if (isDown) {
    if (mode === 'tap') {
      lessonTapCount++;
      lessonView?.keyDown(m, m < 60 ? 'L' : 'R');
      setTimeout(() => lessonView?.keyUp(m), 180);
      // taps sound the grand samples; the P-45 stays silent-scored (its own law)
      playPreview([{ b: 0, d: 0.8, m, h: m < 60 ? 'L' : 'R' }], 300, null, null);
    } else { lessonMidiCount++; lessonView?.keyDown(m, m < 60 ? 'L' : 'R'); }
  } else if (mode !== 'tap') lessonView?.keyUp(m);

  const lv = lessonRunner.level;
  const item = lessonRunner.current; // captured BEFORE note() can advance
  const res = lessonRunner.note(m, isDown);
  if (res.ok === null) return; // partial chord or key-up: nothing to judge yet

  // the mastery ledger records only unassisted reading: names-off levels,
  // never the melody payoff (its targets are lit)
  const evidential = lv.labels === false && !lv.melody;

  if (res.ok === false) {
    if (res.firstMiss && evidential) recordItem(lessonItemKeyOf(item), false);
    // miss = information: expected lit + named + octave coaching, prompt stays
    const exp = lessonRunner.expected();
    lessonView.targets = new Set(exp);
    const expNames = exp.map(noteName).join(' + ');
    $('lesson-msg').textContent = (item?.ms
      ? `You pressed ${noteName(m)}. The phrase restarts on ${expNames}, lit below.`
      : `You pressed ${noteName(m)}. The note asked is ${expNames}, lit below.`) + whichKeyHint(m, exp);
    updateLessonHud();
    return;
  }

  // correct input
  if (res.part) { // mid-phrase progress
    $('lesson-msg').textContent = `${lessonRunner.seqIdx} / ${item.ms.length}…`;
    if (lv.melody) lessonView.targets = new Set(lessonRunner.expected());
    return;
  }

  // prompt complete: restrained impact fx at the key, evidence recorded
  lessonView.targets = new Set();
  const midiOfItem = Array.isArray(item) ? item[0] : item.ms ? item.ms[item.ms.length - 1] : item.m;
  lessonView.burst(midiOfItem, res.firstAttempt ? 'perfect' : 'good');
  if (evidential) recordItem(lessonItemKeyOf(item), !!res.firstAttempt);

  if (res.lessonDone) {
    jlog('lesson_done', { id: lessonDef.id, taps: lessonTapCount, midi: lessonMidiCount, misses: lessonRunner.misses });
    completeLesson();
    return;
  }
  if (res.levelPassed) {
    comboFlash('LEVEL ✓');
    enterLevel();
    return;
  }
  if (res.levelFailed) {
    comboFlash('RUN IT BACK');
    $('lesson-msg').textContent = 'So close. Same level, fresh run — nothing lost.';
    showCurrentPrompt();
    updateLessonHud();
    return;
  }
  if (lv.melody) lessonView.targets = new Set(lessonRunner.expected());
  $('lesson-msg').textContent = res.firstAttempt ? '✓ First try.' : '✓ Got there.';
  showCurrentPrompt();
  updateLessonHud();
}

// ---------- mixed cumulative review (the mastery engine, council 08-24) ----------
let reviewItems = [], reviewIdx = 0, reviewDrill = null, reviewLessonClean = {};

function buildReviewCandidates() {
  const done = lessonsDone();
  const out = [];
  for (const les of LESSONS) {
    if (!done[les.id]) continue;
    if (les.drill.type === 'staff') for (const p of les.drill.pool) out.push({ type: 'staff', m: p.m, h: p.h, key: `s:${p.m}|${p.h}`, lessonId: les.id });
    if (les.drill.type === 'together') for (const it of les.drill.items) out.push({ type: 'chord', midis: it, key: `c:${it.join('-')}`, lessonId: les.id });
    if (les.drill.type === 'phrase') for (const ph of PHRASES) out.push({ type: 'phrase', phrase: ph, key: `p:${ph.ms.join('-')}`, lessonId: les.id });
  }
  return out;
}

function showReviewItem() {
  const item = reviewItems[reviewIdx];
  $('lesson-progress').textContent = `${reviewIdx + 1} / ${reviewItems.length}`;
  if (item.type === 'staff') {
    reviewDrill = new StaffDrill([{ m: item.m, h: item.h }], 1);
    showLessonPrompt([{ m: item.m, h: item.h }]);
    $('lesson-msg').textContent = 'Read it, play it.';
  } else if (item.type === 'chord') {
    reviewDrill = new TogetherDrill([item.midis], 1);
    showLessonPrompt(item.midis.map((m) => ({ m, h: m < 60 ? 'L' : 'R' })));
    $('lesson-msg').textContent = 'Play all the notes together.';
  } else {
    reviewDrill = new PhraseDrill([item.phrase], 1);
    showLessonPrompt(item.phrase.ms.map((m, i) => ({ m, h: item.phrase.h, b: i })));
    $('lesson-msg').textContent = 'Read the phrase, play it in order.';
  }
}

function startReview() {
  const candidates = buildReviewCandidates();
  if (candidates.length < 4) return;
  reviewItems = pickReviewItems(candidates, state.litems ?? {}, lessonsDone(), 6);
  reviewIdx = 0; reviewFirstTry = 0; reviewTotal = reviewItems.length;
  reviewLessonClean = {}; // lessonId -> stayed first-try this review (retention ★)
  reviewMode = true;
  lessonDef = { id: 'review', title: '🔁 Quick review', body: 'Six things you have already learned, mixed together and weighted toward what you have missed before. First try is what counts.', drill: { type: 'review' } };
  show('lesson');
  $('now-playing').textContent = 'Review';
  $('lesson-title').textContent = lessonDef.title;
  $('lesson-body').textContent = lessonDef.body;
  $('lesson-steps').innerHTML = '';
  $('lesson-video').innerHTML = '';
  $('lesson-phase').textContent = '';
  $('lesson-start').hidden = true;
  $('lesson-rhythm-link').hidden = true;
  $('lesson-nomidi').hidden = $('midi-status').dataset.connected === 'true';
  $('lesson-stave').innerHTML = '';
  lessonScore = null;
  // review keeps the tappable keyboard, labels on (review measures memory of
  // the STAVE, and the ledger already weights what it needs to)
  if (!lessonView) lessonView = new FallsView($('lesson-keys'));
  lessonView.kbLetters = true;
  lessonView.targets = new Set();
  const revMs = reviewItems.flatMap((it) => it.type === 'staff' ? [it.m] : it.type === 'chord' ? it.midis : it.phrase.ms);
  const rkr = lessonKeyRange(revMs);
  lessonView.setRange(rkr.lo, rkr.hi);
  lessonView.markMiddleC = true;
  $('lesson-keys').hidden = false;
  $('lesson-kb-toggle').hidden = false;
  $('lesson-kb-toggle').textContent = 'Hide keyboard';
  lessonView.resize();
  drawLessonKeys();
  showReviewItem();
}

function finishReview() {
  reviewMode = false;
  markPracticedToday();
  // retention stars (9th council): a lesson's card earns its ★ only when its
  // items came up in a later review and stayed first-try — durable mastery,
  // not same-session performance
  const starred = [];
  for (const [lid, clean] of Object.entries(reviewLessonClean)) {
    if (!clean) continue;
    state.lessonStars ??= {};
    if (!state.lessonStars[lid]) starred.push(lid);
    state.lessonStars[lid] = true;
  }
  if (starred.length) store.save(state);
  comboFlash(starred.length ? `RETENTION ★ ×${starred.length}` : `REVIEW ${reviewFirstTry}/${reviewTotal} FIRST TRY`);
  $('lesson-msg').textContent = `Done: ${reviewFirstTry} of ${reviewTotal} on the first try.` +
    (starred.length ? ` ★ Retention star${starred.length > 1 ? 's' : ''} earned — see the lesson list.` : ' Misses come back next review, weighted.');
  setTimeout(() => { if (active === 'lesson') { show('lessons'); renderLessonList(); } }, 2200);
}

function reviewNote(m, isDown) {
  const item = reviewItems[reviewIdx];
  if (!item || !reviewDrill) return;
  let res;
  if (item.type === 'chord') res = reviewDrill.note(m, isDown);
  else { if (!isDown) return; res = reviewDrill.answer(m); }
  if (res.firstAttempt) { recordItem(item.key, true); reviewFirstTry++; }
  if (res.firstMiss) { recordItem(item.key, false); reviewLessonClean[item.lessonId] = false; }
  if (res.firstAttempt && !(item.lessonId in reviewLessonClean)) reviewLessonClean[item.lessonId] = true;
  if (res.ok === false) $('lesson-msg').textContent = 'Not that one.';
  if (res.done) {
    reviewIdx++;
    if (reviewIdx >= reviewItems.length) { reviewDrill = null; finishReview(); }
    else showReviewItem();
  }
}

$('btn-lessons').addEventListener('click', () => {
  show('lessons');
  $('now-playing').textContent = 'Lessons';
  renderLessonList();
});
$('btn-review').addEventListener('click', startReview);
$('lesson-back').addEventListener('click', () => { show('lessons'); renderLessonList(); });
$('lesson-rhythm-link').addEventListener('click', () => $('btn-rhythm').click());

// ---------- rhythm tap ----------
let rhythmRound = null, rhythmT0 = 0, rhythmRecording = false;
const rhythmState = () => (state.rhythm ??= { level: 1, cleans: 0 });
function rhythmHud(msg) {
  const rs = rhythmState();
  $('rhythm-level').textContent = `Level ${rs.level}`;
  $('rhythm-streak').textContent = `Clean rounds: ${rs.cleans}/3`;
  if (msg) $('rhythm-msg').textContent = msg;
}
function renderRhythmBlocks(beats, states) {
  $('rhythm-blocks').innerHTML = beats.map((b, i) =>
    `<span class="rblock ${states?.[i] ?? ''}" style="left:${(b / 4) * 92}%"></span>`).join('') +
    [0, 1, 2, 3].map((q) => `<i class="rtick" style="left:${(q / 4) * 92}%"></i>`).join('') +
    // the count row: read the rhythm as counts, rests marked explicitly
    `<span class="count-row">` + makeCountCells(beats).map((c) =>
      `<b class="${c.active ? 'on' : 'rest'}" style="left:${(c.pos / 4) * 92}%">${c.active ? c.label : `(${c.label})`}</b>`).join('') + `</span>`;
}
$('btn-rhythm').addEventListener('click', () => {
  show('rhythm');
  $('now-playing').textContent = 'Rhythm tap';
  rhythmRecording = false; rhythmRound = null;
  rhythmHud("Press ▶ when you're ready.");
  $('rhythm-blocks').innerHTML = '';
});
$('rhythm-go').addEventListener('click', () => {
  if (rhythmRecording) return;
  metCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  metCtx.resume();
  const rs = rhythmState();
  const pattern = pickPattern(rs.level);
  const BPM = 80, spb = 60 / BPM, msPerBeat = spb * 1000;
  renderRhythmBlocks(pattern.beats);
  const t0 = metCtx.currentTime + 0.2;
  const click = (at, hz, vol) => {
    const o = metCtx.createOscillator(), g = metCtx.createGain();
    o.type = 'square'; o.frequency.value = hz;
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
    o.connect(g).connect(metCtx.destination);
    o.start(at); o.stop(at + 0.06);
  };
  // bar 1 count-in, bar 2 the pattern (over soft clicks), bar 3 count-in, bar 4 Mark
  for (let q = 0; q < 16; q++) click(t0 + q * spb, q % 4 === 0 ? 1500 : 1000, q >= 4 && q < 8 ? 0.08 : 0.16);
  for (const b of pattern.beats) click(t0 + (4 + b) * spb, 2100, 0.3);
  const phase = (name, atBar) => setTimeout(() => { if (active === 'rhythm') rhythmHud(name); }, Math.max(0, (t0 - metCtx.currentTime + atBar * 4 * spb) * 1000));
  phase('1… 2… 3… 4…', 0);
  phase('LISTEN…', 1);
  phase('Get ready…', 2);
  rhythmRound = new RhythmRound(pattern.beats, msPerBeat);
  rhythmRecording = true; // taps only count inside the window below
  const tapBarStartMs = performance.now() + (t0 - metCtx.currentTime + 12 * spb) * 1000;
  rhythmT0 = tapBarStartMs;
  phase('YOUR TURN — tap it', 3);
  setTimeout(() => {
    if (active !== 'rhythm' || !rhythmRound) return;
    rhythmRecording = false;
    const res = rhythmRound.result();
    const states = rhythmRound.expected.map((e2) => (e2.hit !== null ? 'hit' : 'miss'));
    renderRhythmBlocks(pattern.beats, states);
    if (res.clean) {
      rs.cleans++;
      rs.totalCleans = (rs.totalCleans ?? 0) + 1;
      if (rs.cleans >= 3 && rs.level < 3) { rs.level++; rs.cleans = 0; comboFlash(`RHYTHM LEVEL ${rs.level}`); rhythmHud('CLEAN — level up! ▶ for the next one.'); }
      else rhythmHud('CLEAN. ▶ for another.');
    } else {
      rs.cleans = 0;
      rhythmHud(`${res.hit}/${rhythmRound.expected.length} hit, ${res.extras} extra tap${res.extras === 1 ? '' : 's'}. ▶ to retry.`);
    }
    store.save(state);
    markPracticedToday();
    rhythmRound = null;
  }, (t0 - metCtx.currentTime + 16 * spb) * 1000 + 250);
});
function rhythmNote() {
  if (!rhythmRound || !rhythmRecording) return;
  const rel = performance.now() - rhythmT0 - (state.calOffsetMs || 0);
  if (rel < -200) return; // ignore taps before the bar actually starts
  const r = rhythmRound.tap(rel);
  if (r.result !== 'extra') $('rhythm-msg').textContent = `● ${r.result}`;
  else $('rhythm-msg').textContent = '✖ extra tap';
}

// ---------- section trainer ----------
function syncTrainButton() {
  $('btn-train').textContent = trainer ? `🎯 Training at ${trainer.tempoPct}% (${trainer.passes}/2)` : '🎯 Train section';
  $('btn-train').classList.toggle('training', !!trainer);
}

function startTraining(secIdx) {
  trainer = { secIdx, tempoPct: 70, passes: 0 };
  $('section-select').value = String(secIdx);
  $('wait-mode').checked = false;
  $('tempo').value = trainer.tempoPct;
  $('tempo-val').textContent = trainer.tempoPct + '%';
  rebuildEngineKeepTrainer();
}

// rebuildEngine wipes trainer state (manual control changes exit training);
// the trainer itself rebuilds through this instead.
function rebuildEngineKeepTrainer() {
  const t = trainer;
  rebuildEngine();
  trainer = t;
  syncTrainButton();
}

function scheduleFrame() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loopFrame);
}

function onLap(ev) {
  jlog('lap', { id: song.id, acc: ev.accuracy, wrong: ev.wrong, training: !!trainer, tempo: trainer?.tempoPct, mem: memo ? memo.rec.stage : undefined });
  markPracticedToday();
  logPracticeMinutes(((engine.endBeat - engine.startBeat) * engine.msPerBeat()) / 60000);
  // memorize laps are judged by the ladder, and a recall lap is a PARTIAL
  // section: never let it pollute the prescription's sectionAcc numbers
  if (memo) { onMemLap(ev); return; }
  // record per-section capability regardless of trainer state
  const secIdx = $('section-select').value;
  if (secIdx !== '' && song.sections?.[+secIdx]) {
    const name = song.sections[+secIdx].name;
    const st = songStats(song.id);
    const rec = ((st.sectionAcc ??= {})[name] ??= { best: 0, last: 0 });
    rec.last = ev.accuracy;
    rec.best = Math.max(rec.best, ev.accuracy);
    store.save(state);
  }
  if (!trainer) return;
  const passedLap = ev.accuracy >= PASS_ACC && ev.wrong === 0;
  if (passedLap) {
    trainer.passes++;
    if (trainer.passes >= 2) {
      if (trainer.tempoPct >= 100) { sectionPassed(); return; }
      trainer.tempoPct = Math.min(100, trainer.tempoPct + 10);
      trainer.passes = 0;
      comboFlash(`SPEED UP ${trainer.tempoPct}%`);
      $('tempo').value = trainer.tempoPct;
      $('tempo-val').textContent = trainer.tempoPct + '%';
      rebuildEngineKeepTrainer();
      return;
    }
  } else {
    trainer.passes = 0;
  }
  syncTrainButton();
}

function sectionPassed() {
  if (trainer.chunk) {
    // chunk chain: passed at full tempo, roll to the next chunk automatically
    const c = chunkRange(song, chunkIdx, chunkBars());
    comboFlash(`CHUNK ${c.idx + 1} PASSED ★`);
    markPracticedToday();
    if (c.idx + 1 < c.count) {
      trainChunk(c.idx + 1);
    } else {
      trainer = null;
      comboFlash('ALL CHUNKS PASSED ★★★');
      $('tempo').value = 100; $('tempo-val').textContent = '100%';
      setChunk(null);
    }
    syncTrainButton();
    return;
  }
  const st = songStats(song.id);
  const name = song.sections[trainer.secIdx].name;
  (st.sectionsPassed ??= {})[name] = true;
  store.save(state);
  comboFlash('SECTION PASSED ★');
  const next = trainer.secIdx + 1;
  if (next < song.sections.length) {
    startTraining(next);
  } else {
    trainer = null;
    comboFlash('ALL SECTIONS PASSED ★★★');
    $('tempo').value = 100; $('tempo-val').textContent = '100%';
    $('section-select').value = '';
    rebuildEngine();
  }
  renderSections();
  syncTrainButton();
}

// chunk trainer: pass a chunk clean at full tempo and it advances to the next
function trainChunk(i) {
  chunkIdx = i;
  syncChunkLabel();
  $('wait-mode').checked = false;
  $('tempo').value = 70; $('tempo-val').textContent = '70%';
  const t = { chunk: true, tempoPct: 70, passes: 0 };
  rebuildEngine();
  trainer = t;
  syncTrainButton();
}

$('btn-train').addEventListener('click', () => {
  if (trainer) {
    trainer = null;
    $('tempo').value = 100; $('tempo-val').textContent = '100%';
    rebuildEngine();
  } else if (chunkIdx !== null) {
    trainChunk(chunkIdx);
  } else {
    const sel = $('section-select').value;
    startTraining(sel === '' ? 0 : +sel);
  }
  syncTrainButton();
});

// ---------- performance simulation (mastery item 9) ----------
// One take, count-in, audience banner, no practice controls. Scored on
// CONTINUITY: wrong notes cost what they always cost; stopping is the enemy.
let perf = null; // {tracker, countUntil}
const PERF_LOCKED = ['btn-restart', 'btn-train', 'btn-mem', 'btn-hear', 'wait-mode', 'tempo', 'section-select', 'chunk-prev', 'chunk-label', 'chunk-next', 'chunk-size'];
function perfControls(locked) {
  for (const id of PERF_LOCKED) $(id).disabled = locked;
  for (const b of document.querySelectorAll('.hand-btn')) b.disabled = locked;
  $('perf-banner').hidden = !locked;
  $('btn-perf').classList.toggle('training', locked);
}
function perfEnd() {
  if (!perf) return;
  perf = null;
  perfControls(false);
}
$('btn-perf').addEventListener('click', () => {
  if (perf) return; // one take means one take
  $('section-select').value = '';
  chunkIdx = null; syncChunkLabel();
  $('wait-mode').checked = false;
  $('tempo').value = 100; $('tempo-val').textContent = '100%';
  rebuildEngine();
  armed = false; armCountUntil = 0; falls.banner = null; // perf has its own count-in
  perf = { tracker: new ContinuityTracker(), countUntil: performance.now() + 4 * engine.msPerBeat() };
  perfControls(true);
  jlog('perf_start', { id: song.id });
  // audible count-in: four clicks, accent on one
  metCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  metCtx.resume();
  const spb = engine.msPerBeat() / 1000;
  const t0 = metCtx.currentTime + 0.08;
  for (let i = 0; i < 4; i++) {
    const o = metCtx.createOscillator(), g = metCtx.createGain();
    o.type = 'square'; o.frequency.value = i === 0 ? 1500 : 1000;
    g.gain.setValueAtTime(i === 0 ? 0.25 : 0.16, t0 + i * spb);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + i * spb + 0.05);
    o.connect(g).connect(metCtx.destination);
    o.start(t0 + i * spb); o.stop(t0 + i * spb + 0.06);
  }
});

// ---------- staged memory transfer (mastery item 7) ----------
const memRecOf = (songId, secName) => ((state.mem ??= {})[songId] ??= {})[secName] ?? { stage: 0, passes: 0 };
function saveMemRec() {
  if (!memo) return;
  ((state.mem ??= {})[song.id] ??= {})[memo.section.name] = { stage: memo.rec.stage, passes: memo.rec.passes };
  store.save(state);
}

function applyMemCues() {
  const cues = memo ? memo.cues : null;
  if (falls) {
    falls.cueLetters = cues ? cues.letters : true;
    falls.cueFilter = cues ? cues.noteFilter : null;
  }
  $('score-wrap').classList.toggle('dimmed', !!cues?.dimScore);
}

function syncMemButton() {
  const btn = $('btn-mem');
  if (!memo) { btn.textContent = '🧠 Memorize'; btn.classList.remove('training'); return; }
  const st = MEM_STAGES[memo.rec.stage];
  btn.textContent = st.key === 'recall'
    ? `🧠 5/5 from bar ${memo.recallBar} (${memo.rec.passes}/2)`
    : `🧠 ${memo.rec.stage + 1}/5 ${st.label} (${memo.rec.passes}/2)`;
  btn.classList.add('training');
}

// rebuildEngine clears memo (a manual control change is an exit); the ladder
// itself rebuilds through this, restoring the state and its cues.
function rebuildEngineKeepMemo() {
  const m = memo;
  if (m.cues.randomStart) {
    const rs = randomStartBar(m.section, song.timeSig[0]);
    m.recallBar = rs.bar;
    loopOverride = { start: rs.startBeat, end: m.section.endBeat };
    comboFlash(`FROM BAR ${rs.bar}`);
  } else {
    loopOverride = { start: m.section.startBeat, end: m.section.endBeat };
  }
  rebuildEngine();
  memo = m;
  memoLastClickBeat = null;
  applyMemCues();
  syncMemButton();
}

function startMemorize() {
  const secIdx = $('section-select').value;
  const section = secIdx !== '' && song.sections?.[+secIdx]
    ? song.sections[+secIdx]
    : { name: 'Whole song', startBeat: 0, endBeat: Math.max(...song.notes.map((n) => n.b + n.d)) };
  const rec = memRecOf(song.id, section.name);
  memo = { section, rec: { ...rec }, cues: memCues(rec.stage), recallBar: null };
  chunkIdx = null; syncChunkLabel();
  $('wait-mode').checked = false; // memory is judged in time, like the trainer
  jlog('mem_start', { id: song.id, sec: section.name, stage: rec.stage });
  rebuildEngineKeepMemo();
}

function exitMemorize() {
  memo = null;
  applyMemCues();
  syncMemButton();
  rebuildEngine();
}

$('btn-mem').addEventListener('click', () => { if (memo) exitMemorize(); else startMemorize(); });

// blank/recall stages keep time with a metronome click, nothing else
function memMetronomeTick() {
  if (!memo?.cues.metronome || !engine || engine.finished) return;
  const b = Math.floor(engine.beat);
  if (b === memoLastClickBeat) return;
  memoLastClickBeat = b;
  metCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (metCtx.state !== 'running') { metCtx.resume(); return; }
  const accent = ((b % song.timeSig[0]) + song.timeSig[0]) % song.timeSig[0] === 0;
  const o = metCtx.createOscillator(), g = metCtx.createGain();
  o.type = 'square'; o.frequency.value = accent ? 1500 : 1000;
  const at = metCtx.currentTime;
  g.gain.setValueAtTime(accent ? 0.22 : 0.13, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
  o.connect(g).connect(metCtx.destination);
  o.start(at); o.stop(at + 0.06);
}

function onMemLap(ev) {
  const { rec, stageUp, done } = memAdvance(memo.rec, ev.accuracy, ev.wrong);
  memo.rec = rec;
  saveMemRec();
  if (done) {
    jlog('mem_done', { id: song.id, sec: memo.section.name });
    comboFlash('MEMORIZED ★★★');
    exitMemorize();
    return;
  }
  if (stageUp) {
    memo.cues = memCues(rec.stage);
    comboFlash(`STAGE ${rec.stage + 1}: ${MEM_STAGES[rec.stage].label.toUpperCase()}`);
    rebuildEngineKeepMemo();
    return;
  }
  if (memo.cues.randomStart) { rebuildEngineKeepMemo(); return; } // fresh bar each lap
  syncMemButton();
}

// ---------- learning chunks ----------
function setChunk(i) {
  if (i === null) { chunkIdx = null; } else {
    const c = chunkRange(song, i, chunkBars());
    chunkIdx = c.idx;
  }
  syncChunkLabel();
  rebuildEngine();
}
$('chunk-label').addEventListener('click', () => setChunk(chunkIdx === null ? 0 : null));
$('chunk-prev').addEventListener('click', () => setChunk(chunkIdx === null ? 0 : chunkIdx - 1));
$('chunk-next').addEventListener('click', () => setChunk(chunkIdx === null ? 0 : chunkIdx + 1));
$('chunk-size').addEventListener('change', () => { if (chunkIdx !== null) setChunk(chunkIdx); });

// ---------- hear-it preview ----------
$('btn-hear').addEventListener('click', () => {
  if (previewActive) {
    previewStop?.(); previewActive = false;
    $('btn-hear').textContent = '▶ Hear it';
    falls.pressed.clear(); // no key left visually stuck mid-note (audit #9)
    return;
  }
  const secIdx = $('section-select').value;
  const range = chunkIdx !== null
    ? (() => { const c = chunkRange(song, chunkIdx, chunkBars()); return { startBeat: c.start, endBeat: c.end }; })()
    : secIdx === '' ? null : song.sections[+secIdx];
  const notes = song.notes.filter((n) =>
    (!range || (n.b >= range.startBeat && n.b < range.endBeat)) &&
    (hand === 'both' || n.h === hand));
  if (!notes.length) return;
  previewActive = true;
  $('btn-hear').textContent = '■ Stop';
  previewStop = playPreview(notes, engine.msPerBeat(), (m, downState) => {
    if (downState) falls.keyDown(m); else falls.keyUp(m);
  }, () => {
    previewActive = false;
    $('btn-hear').textContent = '▶ Hear it';
    falls.pressed.clear();
  });
});

function syncModeButtons() {
  $('mode-falls').dataset.on = String(viewMode === 'falls');
  $('mode-score').dataset.on = String(viewMode === 'score');
  $('falls').hidden = viewMode !== 'falls';
  $('score-wrap').hidden = viewMode !== 'score';
  if (viewMode === 'falls') falls?.resize();
}

$('mode-falls').addEventListener('click', () => { viewMode = 'falls'; syncModeButtons(); });
$('mode-score').addEventListener('click', () => { viewMode = 'score'; syncModeButtons(); });
for (const b of document.querySelectorAll('.hand-btn')) {
  b.addEventListener('click', () => {
    hand = b.dataset.hand;
    document.querySelectorAll('.hand-btn').forEach((x) => (x.dataset.on = String(x === b)));
    rebuildEngine();
  });
}
$('tempo').addEventListener('input', () => { $('tempo-val').textContent = $('tempo').value + '%'; });
$('tempo').addEventListener('change', rebuildEngine);
$('section-select').addEventListener('change', rebuildEngine);
$('wait-mode').addEventListener('change', rebuildEngine);
$('btn-restart').addEventListener('click', rebuildEngine);
$('results-again').addEventListener('click', () => { $('results').hidden = true; rebuildEngine(); raf = requestAnimationFrame(loopFrame); });
$('results-score-pass').addEventListener('click', () => {
  if (sightMode) { $('results').hidden = true; newSightExercise(); return; }
  startSong(song, { asScorePass: true });
});
$('results-done').addEventListener('click', () => { show('library'); renderLibrary(); });
$('btn-home').addEventListener('click', () => { show('library'); renderLibrary(); });

// ---------- free play ----------
let fpView = null;
$('btn-freeplay').addEventListener('click', () => {
  show('freeplay');
  $('now-playing').textContent = 'Free play';
  if (!fpView) fpView = new FallsView($('freeplay-canvas'));
  fpView.resize();
  drawFreeplay();
});
function drawFreeplay() {
  if (active !== 'freeplay') return;
  const c = fpView;
  const ctx = c.ctx;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, c.w, c.h);
  c.kbH = c.h - 4;
  c._drawKeyboard(4);
  requestAnimationFrame(drawFreeplay);
}

// ---------- calibration ----------
let calRunning = false;
function calVerdict(ms) {
  const a = Math.abs(ms);
  if (a <= 60) return 'that is a normal, healthy value';
  if (a <= 150) return 'a bit high but usable';
  return 'that looks WRONG — redo the calibration, tapping exactly when the bar lands';
}
// Voice diagnostic (council 08-24): the button shows WHAT is sounding — grand
// samples or the synth fallback — and taps toggle a forced A/B comparison.
function voiceLabel() {
  const v = voiceInfo();
  if (v.mode === 'synth') return '🔊 Voice: Synth (A/B test)';
  const status = v.loaded === 0 ? 'loading on first play' : `${v.loaded}/${v.total} loaded`;
  const fb = v.lastVoice === 'synth' && v.loaded < v.total ? ' ⚠ FALLBACK ACTIVE' : '';
  return `🔊 Voice: Grand piano (${status})${fb}`;
}
function refreshVoiceBtn() { $('btn-voice').textContent = voiceLabel(); }
setVoiceMode(localStorage.getItem('keys-voice') || 'auto');
$('btn-voice').addEventListener('click', () => {
  const next = voiceInfo().mode === 'synth' ? 'auto' : 'synth';
  setVoiceMode(next);
  localStorage.setItem('keys-voice', next);
  refreshVoiceBtn();
});
refreshVoiceBtn();
setInterval(refreshVoiceBtn, 4000); // status catches up after samples decode

$('btn-calibrate').addEventListener('click', () => {
  show('calibrate');
  $('now-playing').textContent = 'Latency calibration';
  const cur = state.calOffsetMs || 0;
  $('cal-status').innerHTML = `Currently stored: <b>${cur}ms</b> (${calVerdict(cur)}). Tap any key each time the bar lands to redo.`;
  runCalibration();
});
$('cal-redo').addEventListener('click', () => { runCalibration(); $('cal-status').textContent = 'Fresh run: press any key when the bar hits the line…'; });
$('cal-reset').addEventListener('click', () => {
  state.calOffsetMs = 0;
  store.save(state);
  $('cal-status').innerHTML = 'Offset cleared to <b>0ms</b>. Play a song; if your on-time notes score "late", calibrate again.';
});
function runCalibration() {
  const canvas = $('cal-canvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width * dpr; canvas.height = r.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = r.width, Hh = r.height, lineY = Hh - 60;
  const period = 1000; // one drop per second
  const offsets = [];
  const t0 = performance.now();
  calRunning = true;
  window.__calTap = () => {
    if (!calRunning) return;
    const now = performance.now();
    const phase = ((now - t0) % period);
    const off = phase > period / 2 ? phase - period : phase; // nearest landing
    offsets.push(Math.round(off));
    $('cal-status').innerHTML = `Tap ${offsets.length}/8 · offset <b>${Math.round(off)}ms</b>`;
    if (offsets.length >= 8) {
      calRunning = false;
      state.calOffsetMs = medianOffset(offsets);
      store.save(state);
      $('cal-status').innerHTML = `Done. Median offset <b>${state.calOffsetMs}ms</b> saved (${calVerdict(state.calOffsetMs)}). Applied to all scoring.`;
    }
  };
  (function frame(now) {
    if (active !== 'calibrate') return;
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, Hh);
    ctx.fillStyle = COLORS.hit; ctx.fillRect(0, lineY, W, 3);
    const phase = ((now - t0) % period) / period;
    const y = phase * lineY;
    ctx.fillStyle = COLORS.right;
    ctx.fillRect(W / 2 - 40, y - 18, 80, 18);
    if (calRunning) requestAnimationFrame(frame);
  })(performance.now());
}

// ---------- touch diagnostic (mastery item 1) ----------
let touchDiag = null;
function touchPrompt() {
  const cur = touchDiag?.current();
  if (!cur) return;
  $('touch-dyn').textContent = cur.dyn.toUpperCase();
  $('touch-key').textContent = noteName(cur.key);
  $('touch-progress').textContent = `Strike ${cur.strike} of ${cur.of} · step ${cur.step} of ${cur.steps}`;
}
function startTouchDiag() {
  touchDiag = new TouchDiagnostic();
  $('touch-status').textContent = state.touch?.date
    ? `Current calibration recorded ${state.touch.date}. Play the asked key at the asked strength to re-record.`
    : 'Play the asked key at the asked strength. Three strikes each.';
  $('touch-done').hidden = true;
  touchPrompt();
}
$('btn-touch').addEventListener('click', () => {
  show('touch');
  $('now-playing').textContent = 'Touch diagnostic';
  startTouchDiag();
});
$('touch-redo').addEventListener('click', startTouchDiag);
$('touch-done').addEventListener('click', () => { show('library'); renderLibrary(); });
function touchNote(m, vel) {
  if (!touchDiag || touchDiag.done) return;
  const want = touchDiag.current().key;
  const res = touchDiag.strike(m, vel);
  if (!res.accepted) {
    $('touch-status').textContent = `That was ${noteName(m)}, but this step wants ${noteName(want)}.`;
    return;
  }
  $('touch-status').textContent = `✓ velocity ${vel}`;
  if (!res.done) { touchPrompt(); return; }
  const { cal, problems } = buildCalibration(touchDiag.samples, localDay(new Date()));
  touchDiag = null;
  if (problems.length) {
    $('touch-dyn').textContent = 'REDO';
    $('touch-key').textContent = '';
    $('touch-progress').textContent = '';
    $('touch-status').textContent = `The ${problems.map((z) => ZONES[z].name).join(' and ')} zone${problems.length === 1 ? ' did' : 's did'} not separate soft < medium < strong. Exaggerate the difference and restart.`;
    return;
  }
  state.touch = cal; // schema-versioned {v, date, zones}: the dynamics baseline
  store.save(state);
  jlog('touch_calibrated', { zones: cal.zones });
  $('touch-dyn').textContent = 'DONE';
  $('touch-key').textContent = '✓';
  $('touch-progress').textContent = '';
  $('touch-status').textContent = `Calibration saved (${cal.date}). Voicing feedback is live from your next song. Redo this if the piano or your touch drifts.`;
  $('touch-done').hidden = false;
}

// ---------- take capture (mastery item 5) ----------
// A take = the MIDI event stream + (when the mic allows) synchronized audio,
// both stamped from one performance.now() zero. Audio is review-only.
let takeRec = null;   // {t0, events, rec, stream, chunks}
let takeAudio = null; // currently playing shelf audio

function idbOpen() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('keys-takes', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('takes');
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function idbPut(id, rec) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction('takes', 'readwrite');
    tx.objectStore('takes').put(rec, id);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}
async function idbGet(id) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const req = db.transaction('takes').objectStore('takes').get(id);
    req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error);
  });
}
async function idbDel(id) {
  const db = await idbOpen();
  return new Promise((res) => {
    const tx = db.transaction('takes', 'readwrite');
    tx.objectStore('takes').delete(id);
    tx.oncomplete = res; tx.onerror = res; // best-effort cleanup
  });
}

async function startTake() {
  const tr = { t0: performance.now(), events: [], rec: null, stream: null, chunks: [] };
  takeRec = tr;
  $('btn-take').textContent = '■ Stop take';
  $('btn-take').classList.add('training');
  try {
    // AGC and friends off: the recording should sound like the room does
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    if (takeRec !== tr) { stream.getTracks().forEach((t) => t.stop()); return; }
    tr.stream = stream;
    tr.rec = new MediaRecorder(stream);
    tr.rec.ondataavailable = (e) => { if (e.data.size) tr.chunks.push(e.data); };
    tr.rec.start(1000);
    jlog('take_start', { audio: true });
  } catch {
    // fail soft: no mic permission (or no mic) = MIDI-only take, still worth it
    if (takeRec === tr) jlog('take_start', { audio: false });
  }
}

async function finishTake() {
  const tr = takeRec;
  takeRec = null;
  const btn = $('btn-take');
  if (btn) { btn.textContent = '⏺ Record take'; btn.classList.remove('training'); }
  if (!tr) return;
  if (tr.rec && tr.rec.state !== 'inactive') {
    await new Promise((res) => { tr.rec.onstop = res; tr.rec.stop(); });
  }
  tr.stream?.getTracks().forEach((t) => t.stop());
  const audio = tr.chunks.length ? new Blob(tr.chunks, { type: tr.rec?.mimeType || 'audio/webm' }) : null;
  if (!tr.events.length && !audio) return; // empty take: nothing to shelve
  const at = Date.now();
  const meta = {
    id: newTakeId(at), songId: song?.id ?? null, title: song?.title ?? 'Play',
    at, durMs: Math.round(tr.events.length ? Math.max(...tr.events.map((e) => e.t)) : 0),
    hasAudio: !!audio, bytes: audio?.size ?? 0, events: tr.events.length,
  };
  await idbPut(meta.id, { meta, events: tr.events, audio });
  const res = addTake(state.takes ?? [], meta);
  state.takes = res.index;
  store.save(state);
  for (const ev of res.evicted) idbDel(ev.id); // cap enforced in the blob store too
  jlog('take_saved', { id: meta.id, songId: meta.songId, durMs: meta.durMs, audio: meta.hasAudio, bytes: meta.bytes });
  comboFlash('TAKE SAVED');
}

$('btn-take').addEventListener('click', () => { if (takeRec) finishTake(); else startTake(); });

function stopTakeAudio() {
  if (takeAudio) {
    takeAudio.pause();
    try { URL.revokeObjectURL(takeAudio.src); } catch { /* fine */ }
    takeAudio = null;
  }
}

// ---------- takes shelf ----------
let takesView = null;
$('btn-takes').addEventListener('click', () => {
  show('takes');
  $('now-playing').textContent = 'Takes';
  if (!takesView) takesView = new FallsView($('takes-canvas'));
  takesView.resize();
  drawTakes();
  renderTakes();
});
function drawTakes() {
  if (active !== 'takes') return;
  const c = takesView;
  c.ctx.fillStyle = COLORS.bg;
  c.ctx.fillRect(0, 0, c.w, c.h);
  c.kbH = c.h - 4;
  c._drawKeyboard(4);
  requestAnimationFrame(drawTakes);
}
function renderTakes() {
  const takes = [...(state.takes ?? [])].sort((a, b) => b.at - a.at);
  const u = takeUsage(takes);
  $('takes-usage').textContent = takes.length
    ? `${u.count} of 20 shelf slots · ${u.mb} MB of audio`
    : 'No takes yet. Hit ⏺ Record take on any song.';
  const list = $('takes-list');
  list.innerHTML = '';
  for (const t of takes) {
    const when = new Date(t.at);
    const row = document.createElement('div');
    row.className = 'take-row';
    row.innerHTML = `
      <span class="take-name"><b>${t.title}</b> · ${localDay(when)} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')} · ${Math.round(t.durMs / 1000)}s · ${t.events} notes${t.hasAudio ? '' : ' · no mic'}</span>
      <button class="ghost t-audio" ${t.hasAudio ? '' : 'disabled'}>▶ Audio</button>
      <button class="ghost t-midi">♪ Keys replay</button>
      <button class="ghost t-del">✕</button>`;
    row.querySelector('.t-audio').addEventListener('click', async () => {
      stopTakeAudio(); stopPreview();
      const rec = await idbGet(t.id);
      if (!rec?.audio) return;
      takeAudio = new Audio(URL.createObjectURL(rec.audio));
      takeAudio.play();
    });
    row.querySelector('.t-midi').addEventListener('click', async () => {
      stopTakeAudio(); stopPreview();
      const rec = await idbGet(t.id);
      if (!rec?.events?.length) return;
      const notes = eventsToNotes(rec.events, 500);
      playPreview(notes, 500, (m, d2) => { if (d2) takesView.keyDown(m); else takesView.keyUp(m); },
        () => takesView.pressed.clear());
    });
    row.querySelector('.t-del').addEventListener('click', async () => {
      await idbDel(t.id);
      state.takes = removeTake(state.takes ?? [], t.id);
      store.save(state);
      renderTakes();
    });
    list.appendChild(row);
  }
}

// ---------- improv playground (mastery item 10a) ----------
let improvView = null, improvOn = false, improvLoop = LOOPS[0], improvT0 = 0, improvEnterT = 0;

$('btn-improv').addEventListener('click', () => {
  show('improv');
  $('now-playing').textContent = 'Improv';
  improvEnterT = Date.now();
  const sel = $('improv-loop');
  if (!sel.options.length) {
    sel.innerHTML = LOOPS.map((l2, i) => `<option value="${i}">${l2.name}</option>`).join('');
  }
  improvLoop = LOOPS[+sel.value || 0];
  improvOn = false;
  $('improv-go').textContent = '▶ Start backing';
  if (!improvView) improvView = new FallsView($('improv-canvas'));
  improvView.resize();
  drawImprov();
});
$('improv-loop').addEventListener('change', () => {
  improvLoop = LOOPS[+$('improv-loop').value || 0];
  if (improvOn) { improvT0 = performance.now(); playComp(); }
});
function playComp() {
  if (!improvOn || active !== 'improv') return;
  playPreview(compNotes(improvLoop), 750, (m, d2) => {
    if (d2) improvView.keyDown(m); else improvView.keyUp(m);
  }, () => playComp()); // loop the backing until stopped
}
$('improv-go').addEventListener('click', () => {
  if (improvOn) {
    improvOn = false;
    stopPreview();
    improvView.pressed.clear();
    $('improv-go').textContent = '▶ Start backing';
    return;
  }
  improvOn = true;
  improvT0 = performance.now();
  $('improv-go').textContent = '■ Stop backing';
  playComp();
});
function drawImprov() {
  if (active !== 'improv') return;
  const c = improvView;
  const beat = improvOn ? (performance.now() - improvT0) / 750 : 0;
  const cur = chordAt(improvLoop, beat);
  c.improv = { chordPcs: new Set(cur.pcs), scalePcs: new Set(improvLoop.scale) };
  $('improv-chord').textContent = improvOn ? `${cur.name} · bar ${cur.bar + 1}` : `${cur.name} (press ▶ to hear the loop)`;
  c.ctx.fillStyle = COLORS.bg;
  c.ctx.fillRect(0, 0, c.w, c.h);
  c.kbH = c.h - 4;
  c._drawKeyboard(4);
  requestAnimationFrame(drawImprov);
}

// ---------- 12-key fluency ladder (mastery item 10b) ----------
const ladderPassed = (id) => {
  const p = songStats(id).sectionsPassed ?? {};
  return !!(p['Going up'] && p['Coming down']);
};
function renderKeys12() {
  for (const mode of ['major', 'minor']) {
    const grid = $(`keys12-${mode}`);
    grid.innerHTML = '';
    for (const entry of LADDER.filter((l2) => l2.mode === mode)) {
      const done = ladderPassed(entry.id);
      const cell = document.createElement('button');
      cell.className = 'key-cell' + (done ? ' passed' : '');
      cell.innerHTML = `${entry.key}<span class="key-state">${done ? '✓ passed' : '○ open'}</span>`;
      cell.addEventListener('click', () => {
        startSong(SONGS.find((s) => s.id === entry.id));
        startTraining(0);
      });
      grid.appendChild(cell);
    }
  }
}
$('btn-keys12').addEventListener('click', () => {
  show('keys12');
  $('now-playing').textContent = '12 keys';
  renderKeys12();
});

// ---------- filmed self-review checkpoint (mastery item 6) ----------
function renderFormCard() {
  const el = $('form-card');
  const today = localDay(new Date());
  if (!formDue(state.formLast ?? null, state.days) || state.formSnooze === today) { el.hidden = true; return; }
  const checks = $('form-checks');
  if (!checks.children.length) {
    checks.innerHTML = FORM_CHECKS.map((c, i) => `
      <label class="form-check">${c}
        <select data-check="${i}" class="ctl-select">
          <option value="">rate 1-5 (optional)</option>
          ${[1, 2, 3, 4, 5].map((n2) => `<option value="${n2}">${n2}</option>`).join('')}
        </select>
      </label>`).join('');
  }
  el.hidden = false;
}
$('form-done').addEventListener('click', () => {
  const ratings = {};
  for (const sel of $('form-checks').querySelectorAll('select')) {
    if (sel.value) ratings[FORM_CHECKS[+sel.dataset.check]] = +sel.value;
  }
  state.formLast = localDay(new Date());
  store.save(state);
  jlog('form_check', { ratings });
  $('form-card').hidden = true;
  comboFlash('FORM CHECK ★');
});
$('form-snooze').addEventListener('click', () => {
  state.formSnooze = localDay(new Date());
  store.save(state);
  $('form-card').hidden = true;
});

// ---------- practice minutes + chart ----------
function logPracticeMinutes(mins) {
  if (!(mins > 0)) return;
  const key = localDay(new Date());
  (state.pmin ??= {})[key] = +(((state.pmin ?? {})[key] ?? 0) + mins).toFixed(2);
  store.save(state);
}
function renderPracticeChart() {
  const el = $('practice-chart');
  const pmin = state.pmin ?? {};
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() - 13);
  for (let i = 0; i < 14; i++) { days.push(localDay(d)); d.setDate(d.getDate() + 1); }
  const max = Math.max(5, ...days.map((k) => pmin[k] ?? 0));
  const total = days.reduce((a, k) => a + (pmin[k] ?? 0), 0);
  if (total === 0) { el.innerHTML = ''; return; }
  el.innerHTML = `<span class="hint">Practice, last 14 days (${Math.round(total)} min):</span>` +
    days.map((k) => {
      const v = pmin[k] ?? 0;
      // zero-minute days get an empty track, never a sliver of fill
      const h = v > 0 ? Math.max(3, Math.round((v / max) * 34)) : 0;
      const fill = h > 0 ? `<i style="height:${h}px"></i>` : '';
      return `<span class="pbar" title="${k}: ${Math.round(v)} min">${fill}</span>`;
    }).join('');
}

// ---------- 5-minute session picker (council: three moods, never a checklist) ----------
function mostWinnableSection() {
  let best = null;
  for (const s of SONGS) {
    const acc = songStats(s.id).sectionAcc ?? {};
    for (const [name, rec] of Object.entries(acc)) {
      if (rec.best >= 85 || rec.best < 50) continue; // close to passing = winnable
      if (!best || rec.best > best.best) best = { song: s, name, best: rec.best };
    }
  }
  return best;
}
$('sess-quick').addEventListener('click', () => {
  const win = mostWinnableSection();
  if (win) {
    startSong(win.song);
    startTraining(win.song.sections.findIndex((x) => x.name === win.name));
    return;
  }
  // nothing in flight: shortest not-yet-3-starred song, trained from the top
  const open = [...SONGS].filter((s) => (songStats(s.id).stars || 0) < 3)
    .sort((a, b) => a.notes.length - b.notes.length)[0] ?? SONGS[0];
  startSong(open);
  startTraining(0);
});
$('sess-improve').addEventListener('click', () => {
  const worst = weakestSection();
  if (worst) { trainWeakest(worst); return; }
  if (state.lastSession && SONGS.find((s) => s.id === state.lastSession.songId)) { resumeLastSession(); return; }
  startSong(SONGS[0]);
});
$('sess-skill').addEventListener('click', () => {
  // alternate days between the ear and the fingers
  if (new Date().getDate() % 2 === 0) $('btn-echo').click();
  else { startSong(SONGS.find((s) => s.id === 'scale-c-major')); startTraining(0); }
});

// ---------- metronome ----------
let metCtx = null, metTicker = null, metNextBeat = 0, metBeatIdx = 0;
function stopMetronome() {
  if (metTicker) { clearInterval(metTicker); metTicker = null; }
  const btn = $('met-toggle');
  if (btn) btn.textContent = '▶ Start';
}
function startMetronome() {
  metCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  metCtx.resume();
  metNextBeat = metCtx.currentTime + 0.1;
  metBeatIdx = 0;
  const tick = () => {
    const bpm = +$('met-bpm').value;
    const perBar = +$('met-sig').value;
    const spb = 60 / bpm;
    while (metNextBeat < metCtx.currentTime + 0.3) {
      const accent = metBeatIdx % perBar === 0;
      const osc = metCtx.createOscillator();
      const g = metCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = accent ? 1500 : 1000;
      g.gain.setValueAtTime(accent ? 0.25 : 0.15, metNextBeat);
      g.gain.exponentialRampToValueAtTime(0.001, metNextBeat + 0.05);
      osc.connect(g).connect(metCtx.destination);
      osc.start(metNextBeat);
      osc.stop(metNextBeat + 0.06);
      const idx = metBeatIdx % perBar;
      const at = (metNextBeat - metCtx.currentTime) * 1000;
      setTimeout(() => { if (metTicker) $('met-beat').textContent = '● '.repeat(idx + 1) + '○ '.repeat(Math.max(0, perBar - idx - 1)); }, Math.max(0, at));
      metNextBeat += spb;
      metBeatIdx++;
    }
  };
  tick();
  metTicker = setInterval(tick, 100);
  $('met-toggle').textContent = '■ Stop';
}
$('btn-metronome').addEventListener('click', () => {
  show('metronome');
  $('now-playing').textContent = 'Metronome';
});
$('met-toggle').addEventListener('click', () => { if (metTicker) stopMetronome(); else startMetronome(); });
// slider and number box stay in sync; the ticker reads the slider live, so a
// mid-typing value (like the "1" of "150") never reaches the click scheduler
$('met-bpm').addEventListener('input', () => { $('met-bpm-num').value = $('met-bpm').value; });
$('met-bpm-num').addEventListener('input', () => {
  const v = +$('met-bpm-num').value;
  if (v >= 40 && v <= 200) $('met-bpm').value = v;
});
$('met-bpm-num').addEventListener('change', () => {
  const v = Math.max(40, Math.min(200, Math.round(+$('met-bpm-num').value) || 80));
  $('met-bpm-num').value = v;
  $('met-bpm').value = v;
});

// ---------- melody echo ----------
let echoView = null, echoRound = null, echoPhrase = null;
let echoStreak = 0, echoClean = 0, echoAwaiting = false;
const echoState = () => (state.echo ??= { level: 3, bestStreak: 0, prevBest: 0 });

$('btn-echo').addEventListener('click', () => {
  const es = echoState();
  es.prevBest = es.bestStreak; // this session chases the old best
  show('echo');
  $('now-playing').textContent = 'Melody echo';
  if (!echoView) echoView = new FallsView($('echo-canvas'));
  echoView.resize();
  // full session reset: stale rounds must not leak across exits (audit #10)
  echoStreak = 0; echoClean = 0;
  echoRound = null; echoPhrase = null; echoAwaiting = false;
  clearTimeout(echoSingTimer);
  syncEchoModes();
  updateEchoHud('Press ▶ to hear the first phrase.');
  drawEcho();
});

function updateEchoHud(msg) {
  const es = echoState();
  $('echo-level').textContent = `Phrase length: ${es.level}`;
  $('echo-streak').textContent = `Streak: ${echoStreak}`;
  $('echo-delta').textContent = es.prevBest > 0 ? `best last session: ${es.prevBest}` : '';
  if (msg) $('echo-msg').textContent = msg;
}

function drawEcho() {
  if (active !== 'echo') return;
  const c = echoView;
  c.ctx.fillStyle = COLORS.bg;
  c.ctx.fillRect(0, 0, c.w, c.h);
  c.kbH = c.h - 4;
  c._drawKeyboard(4);
  requestAnimationFrame(drawEcho);
}

// Echo modes (mastery item 8): plain echo, audiation ("sing first"), and
// simple transposition. One phrase pipeline, three ways to answer it.
let echoMode = 'echo'; // 'echo' | 'sing' | 'trans'
let echoShift = 0;     // semitones for the current transpose round
let echoSingTimer = 0;

function syncEchoModes() {
  $('echo-mode-echo').dataset.on = String(echoMode === 'echo');
  $('echo-mode-sing').dataset.on = String(echoMode === 'sing');
  $('echo-mode-trans').dataset.on = String(echoMode === 'trans');
}
for (const [id, mode] of [['echo-mode-echo', 'echo'], ['echo-mode-sing', 'sing'], ['echo-mode-trans', 'trans']]) {
  $(id).addEventListener('click', () => {
    echoMode = mode;
    syncEchoModes();
    stopPreview();
    clearTimeout(echoSingTimer);
    echoRound = null; echoPhrase = null; echoAwaiting = false;
    updateEchoHud(mode === 'sing'
      ? 'Sing-first: the phrase plays, you sing it back, THEN play it on the keys.'
      : mode === 'trans'
        ? 'Transpose: the phrase plays, you play it back from a DIFFERENT named starting note.'
        : 'Press ▶ to hear a phrase.');
  });
}

function makeEchoRound(fresh) {
  if (echoMode === 'trans') {
    if (fresh) echoShift = Math.random() < 0.5 ? 2 : 5; // up a tone, or up a fourth
    return new TransposeRound(echoPhrase.midis, echoShift);
  }
  return new EchoRound(echoPhrase.midis);
}

function echoYourTurnMsg() {
  if (echoMode === 'trans') {
    const target = noteName(echoPhrase.midis[0] + echoShift);
    return `Your turn: play it starting on ${target} (${echoShift === 2 ? 'up a tone' : 'up a fourth'}). Any octave of ${target.replace(/-?\d+$/, '')} starts it.`;
  }
  return 'Your turn: play it back.';
}

function playEchoPhrase(freshPhrase) {
  const es = echoState();
  if (freshPhrase) {
    echoPhrase = pickPhrase(SONGS, es.level);
    if (!echoPhrase) { updateEchoHud('No phrases available.'); return; }
  }
  if (!echoPhrase) return;
  echoRound = makeEchoRound(freshPhrase);
  echoAwaiting = false;
  clearTimeout(echoSingTimer);
  updateEchoHud(`Listen… (from ${echoPhrase.songTitle})`);
  playPreview(echoPhrase.playNotes, 500, (m, downState) => {
    if (downState) echoView.keyDown(m); else echoView.keyUp(m);
  }, () => {
    echoView.pressed.clear();
    if (echoMode === 'sing') {
      // audiation gap: untracked on purpose, and honest about why
      updateEchoHud('Sing it back now. (Untracked: the app will not pretend to judge your voice.)');
      echoSingTimer = setTimeout(() => {
        if (active !== 'echo') return;
        echoAwaiting = true;
        updateEchoHud('Now play it on the keys.');
      }, 3000);
    } else {
      echoAwaiting = true;
      updateEchoHud(echoYourTurnMsg());
    }
  });
}

window.__echoState = () => ({ mode: echoMode, shift: echoShift, phrase: echoPhrase, awaiting: echoAwaiting, streak: echoStreak }); // debug/test lever
$('echo-play').addEventListener('click', () => playEchoPhrase(true));
$('echo-again').addEventListener('click', () => { if (echoPhrase) { updateEchoHud('Listen again…'); playEchoPhrase(false); } });

function echoNote(m) {
  if (!echoRound || !echoAwaiting) return;
  const res = echoRound.noteOn(m);
  if (res.status === 'wrong') {
    echoView.flash(m, 'wrong');
    echoClean = 0;
    echoStreak = 0;
    updateEchoHud('Not quite — the phrase restarts. Hear it again if you need.');
  } else if (res.status === 'done') {
    const es = echoState();
    const clean = echoRound.mistakes === 0;
    echoStreak++;
    es.bestStreak = Math.max(es.bestStreak, echoStreak);
    echoClean = clean ? echoClean + 1 : 0;
    let msg = `✓ Got it${clean ? ', clean' : ''}. Press ▶ for the next one.`;
    if (echoClean >= 5 && es.level < 8) {
      es.level++;
      echoClean = 0;
      comboFlash(`LEVEL UP — ${es.level} NOTES`);
      msg = `Five clean echoes: phrases are now ${es.level} notes. Press ▶.`;
    }
    store.save(state);
    updateEchoHud(msg);
    echoAwaiting = false;
  } else {
    updateEchoHud(`${res.idx} / ${echoPhrase.midis.length}…`);
  }
}

// ---------- MIDI routing ----------
midi.onNote = (m, vel, down) => {
  if (cardTask) { theoryNote(m, down); return; }
  if (active === 'task') { if (down) pathUI.noteOn(m); else pathUI.noteOff(m); return; }
  if (active === 'lesson') { lessonNote(m, down); return; }
  if (active === 'rhythm') { if (down) rhythmNote(); return; }
  if (active === 'touch') { if (down) touchNote(m, vel); return; }
  if (active === 'play' && engine) {
    if (armed && down) { startArmCountIn(); return; }
    if (takeRec) takeRec.events.push({ t: performance.now() - takeRec.t0, m, vel, down, h: falls?.handMap?.get(m) ?? 'R' });
    if (down) { falls.keyDown(m); engine.noteOn(m, vel); } else { falls.keyUp(m); engine.noteOff(m); }
  } else if (active === 'freeplay' && fpView) {
    if (down) {
      fpView.keyDown(m);
      const log = $('freeplay-log');
      log.innerHTML = `${noteName(m)} <span class="vel">vel ${vel}</span> ` + log.innerHTML.slice(0, 400);
    } else fpView.keyUp(m);
  } else if (active === 'echo') {
    if (down) { echoView?.keyDown(m); echoNote(m); } else echoView?.keyUp(m);
  } else if (active === 'improv') {
    if (down) improvView?.keyDown(m); else improvView?.keyUp(m); // no judgement zone
  } else if (active === 'calibrate' && down) {
    window.__calTap?.();
  }
};

// Sustain pedal (CC64): >= 64 is down. The engine records the transition
// timeline; the analyzers read it after the run.
midi.onControl = (cc, val) => {
  if (cc !== 64) return;
  if (takeRec && active === 'play') takeRec.events.push({ kind: 'cc', t: performance.now() - takeRec.t0, cc, val });
  if (active === 'play' && engine) engine.pedal(val >= 64);
};

// ---------- boot ----------
// sight exercises are throwaway ids; stop their stats entries accumulating
for (const k of Object.keys(state.songs)) if (k.startsWith('sight-')) delete state.songs[k];
window.addEventListener('resize', () => { falls?.resize(); fpView?.resize(); echoView?.resize(); });
document.addEventListener('visibilitychange', () => { lastT = 0; });
// Teacher Loop v1 (11th council): the path owns the "what next" question
const pathUI = installPath({
  $, show, state, store, FallsView, playPreview, stopPreview, comboFlash,
  markPracticedToday, jlog, lessonKeyRange, COLORS, renderLibrary,
});
window.__path = pathUI; // debug lever, same spirit as __engine / __lesson

midi.connect();
renderLibrary();
pathUI.renderTeaser();
show('library');
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js');
}
