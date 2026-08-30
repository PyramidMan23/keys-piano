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
import { playPreview, stopPreview, setVoiceMode, voiceInfo, voiceModeLabel, voiceModeNext, soundModeNext, tapSoundActive } from './audio.mjs';
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
import { groupSongs, classifyGroups, filterExplore } from './library.mjs';
import { prescribe, qualifiesPlayable, recordPlayableRun, PROOF_PASS, SKILL_BY_ID, TEACHER_LESSONS, STAGES } from './teacher.mjs';
import {
  grantXp, totalXp, gameLevel, questsFor, chooseQuest, settleQuest,
  isoWeek, weeklyOptions, chooseWeekly, settleWeekly,
  rhythmOf, freezeOffer, useFreeze, earnFreeze, rebaseWeekly,
  verdictWord, badges, JOURNEYS, journeyState, journeyAdvance,
} from './game.mjs';
import { difficultyScore, difficultyBand, HALL_OF_FAME } from './difficulty.mjs';
import { coverDataUrl } from './covers.mjs';
import { CANON_ON, setTextKeeping, setHTMLKeeping, setRichText, hideRestingLayer, setCanonNav, desktopFits, applyCanonZoom } from './canon-mount.mjs';
import { bindTrophyList, bindXpLog, bindKeys12, bindKeys12Count, bindLessonList, bindImprovLoop, bindSegmentByIds, bindSegment } from './canon-bind.mjs';
import { mountWidePlay, syncWidePlay, bindHandCells, syncHandCells } from './canon-play.mjs';
import { renderCanonLibrary } from './canon-library.mjs';

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
  // A REAL ROLLBACK, not a renderer switch.
  //
  // Codex, council 2026-08-29: "Both renderers mutate the same persisted state.
  // If Canon corrupts progress, double-awards XP, or writes an incompatible
  // shape, ?canon=0 merely displays the old renderer over damaged data. That is
  // a renderer switch, not rollback." It was right, and the claim that a
  // rollback was one query string away was false.
  //
  // So the FIRST write under the canon copies the pre-canon state aside, once
  // and never again, and window.__restorePreCanon() puts it back. Cheap
  // insurance against the one failure that cannot be undone by reloading.
  save(s) {
    try {
      if (CANON_ON && localStorage.getItem('keys-v1-precanon') === null) {
        localStorage.setItem('keys-v1-precanon', localStorage.getItem('keys-v1') ?? '{}');
      }
    } catch { /* private mode, quota: never let a backup stop a save */ }
    localStorage.setItem('keys-v1', JSON.stringify(s));
  },
};
const state = Object.assign({ songs: {}, calOffsetMs: 0, days: [] }, store.load());
// The restore half of the above. Deliberately a console lever rather than a
// button: it throws away everything done since the canon first wrote, so it
// should be hard to hit by accident.
window.__restorePreCanon = () => {
  const snap = localStorage.getItem('keys-v1-precanon');
  if (snap === null) return 'no pre-canon snapshot exists';
  localStorage.setItem('keys-v1', snap);
  localStorage.removeItem('keys-v1-precanon');
  location.reload();
  return 'restored';
};
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
  if (!state.days.includes(today)) {
    state.days.push(today);
    settleGame(); // a new practice day can complete the weekly mission itself
  }
  store.save(state);
}
// ---------- gamification hooks (14th council: XP from value, not volume) ----
function dayStat(key, inc = 1) {
  const day = localDay(new Date());
  const ds = ((state.dayStats ??= {})[day] ??= {});
  ds[key] = (ds[key] ?? 0) + inc;
}
function awardXp(src, ref) {
  const entry = grantXp(state, src, ref, Date.now());
  if (entry) { jlog('xp', { src, ref, xp: entry.xp }); comboFlash(`+${entry.xp} XP · ${src.replace(/([A-Z])/g, ' $1').toUpperCase()}`); }
  return entry;
}
// after any counter/event that could complete the chosen quest or mission
function settleGame() {
  const day = localDay(new Date());
  const q = settleQuest(state, day, Date.now());
  if (q) { jlog('quest_done', { id: state.activeQuest?.id }); comboFlash('QUEST DONE ✓ +' + q.xp + ' XP'); }
  const w = settleWeekly(state, isoWeek(new Date()), Date.now());
  if (w) { jlog('weekly_done', { id: state.weekly?.id }); comboFlash('WEEKLY MISSION ✓ +' + w.xp + ' XP'); }
  const r = rhythmOf(state, day);
  if (r.current > (state.bestRhythm ?? 0)) state.bestRhythm = r.current;
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
// 14th council input chip: the app always says what it is listening to, and
// what that input can honestly prove (shape + word, never hue alone).
function syncInputChip(detail) {
  const el = $('midi-status');
  const connected = el.dataset.connected === 'true';
  el.textContent = !connected
    ? 'Screen taps · plug the P-45 in for the real thing'
    : state.calibratedAt ? 'MIDI · calibrated ✓' : 'MIDI · uncalibrated, run Latency calibration';
  if (detail) el.title = detail;
}
midi.onStatus = (text, connected) => {
  const el = $('midi-status');
  el.dataset.connected = String(connected);
  syncInputChip(text);
  // the drawn "P-45 connected / No keyboard" module binds at render time:
  // plugging in while parked on the library must repaint it (Codex parity B5)
  if (CANON_ON && !$('screen-library').hidden) renderLibrary();
};

// Debug/test hooks: simulate a key or a control change from the console
// (never guess whether the pipeline works without hardware attached).
window.__simNote = (m, down = true, vel = 90) => midi.onNote?.(m, vel, down);
window.__simCC = (cc, val) => midi.onControl?.(cc, val);

// ---------- screens ----------
const screens = ['library', 'play', 'freeplay', 'calibrate', 'echo', 'metronome', 'rhythm', 'lessons', 'lesson', 'touch', 'takes', 'improv', 'keys12', 'path', 'task', 'trophies'];

// THE TOP BAR, ABSORBED. The desktop library is drawn as a full 1418x738 frame,
// and the app's 61px bar sat above it, so the frame could never fit and the
// bottom of the rail fell off the screen. Claude Design's ruling, asked
// directly: absorb it, because the bar carries only a home label and the MIDI
// status, and the rail already states the keyboard status in more detail plus
// the two tools that depend on it. Keeping both says it twice and spends 61px
// doing so. Every other screen keeps its bar, because they still need the way
// back.
// the canon's own back controls need somewhere to go
setCanonNav({ home: () => { show('library'); renderLibrary(); } });

function syncTopbar(name) {
  // header CLASS topbar, not id: $('topbar') was null, this whole function was
  // a silent no-op, and the bar sat over every canon screen while a probe
  // reported it hidden because the probe's null branch printed 'none'. Two
  // lessons for the price of one: verify the selector against the markup, and
  // never let a probe's fallback string impersonate a real measurement.
  const bar = document.querySelector('header.topbar');
  if (!bar) return;
  // Absorbed EVERYWHERE under the canon, not just the desktop library. The bar
  // is old-app chrome Claude Design never drew: every artboard carries its own
  // designed Library control (wired by bindBack), so the bar said everything
  // twice in the wrong visual language. Mark, 2026-08-29, pointing at it: can
  // we make this library button look better. The better version already
  // existed inside every screen; the fix is deleting the duplicate.
  bar.style.display = CANON_ON ? 'none' : '';
}

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
  syncTopbar(name);
  // The wide play board (9a): mounted lazily the first time the play screen
  // shows at desktop width, so Mark's "why is the synthesizer so small" screen
  // gets the 1074px deck instead of the phone column.
  // Deferred a tick: this hook sits early in show(), while the play screen is
  // still hidden, and a hidden pane measures 0x0 everywhere - the exact
  // decorate-before-show trap the prototype already documents. Mounted eagerly
  // here it found no deck region and quietly declined, and the small deck
  // stayed. After the toggle below it measures true.
  if (name === 'play') {
    window.__viewMode = viewMode;
    setTimeout(() => {
      if (mountWidePlay($('screen-play')) && song) {
        // full first sync, so the header never shows the artboard's sample song
        const lv = (song.level ?? 'easy');
        syncWidePlay({ title: song.title, sub: lv[0].toUpperCase() + lv.slice(1) + ' tier',
          bpm: Math.round(song.bpm * (+$('tempo').value) / 100) + ' bpm',
          accuracy: engine ? engine.accuracy() : 0, combo: 0, tier: (falls?.comboLevel ?? 0) + 1, timing: '\u2014',
          art: coverDataUrl(song, 96) });
      }
    }, 0);
  }
  // A screen change closes the tools drawer. Reaching a tool by any other route
  // left it hanging open behind the new screen.
  document.getElementById('canon-tools-drawer')?.remove();
  previewActive = false;
  demoEngine = null; // a screen change ends the follow-along demo too
  const hearBtn = $('btn-hear');
  if (hearBtn) hearBtn.textContent = '▶ Hear it';
  falls?.pressed.clear();
  if (falls) falls.banner = null;
  echoView?.pressed.clear();
  // abandonment: leaving mid-song is exactly the signal the usage gate wants
  if (active === 'play' && name !== 'play' && engine && !engine.finished) {
    jlog('abandon', { id: song?.id, at: Math.round(engine.beat), of: Math.round(engine.endBeat) });
  }
  if (name !== active) jlog('screen', { to: name });
  for (const s of screens) $('screen-' + s).hidden = s !== name;
  $('results').hidden = true;
  active = name;
  // keep the desktop composition fit-scaled to the live window
  if (CANON_ON) {
    const card = $('screen-' + name)?.firstElementChild;
    if (card && card.clientWidth >= 1400) applyCanonZoom(card);
  }
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
    if (CANON_ON) syncHandCells();
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
// 13th council: prescribe() is the app's ONE brain. The amber card asks it
// with the resume candidate; the path screen asks it without (the path is the
// learning voice, the card is the whole-app voice).
function renderNextAction() {
  const card = $('next-action');
  const last = state.lastSession;
  const lastSong = last && SONGS.find((s) => s.id === last.songId);
  const rx = prescribe(state, Date.now(), {
    songs: SONGS, statsOf: songStats,
    resume: lastSong ? { songId: lastSong.id, title: lastSong.title, level: lastSong.level, at: last.at } : null,
  });
  card.hidden = false;
  $('next-action-label').textContent = rx.reason;
  $('next-action-reason').textContent = rx.evidence ?? '';
  // council: a 96px cover plate BESIDE the hero text when the action is a song
  const heroSong = rx.songId && SONGS.find((s) => s.id === rx.songId);
  const plate = $('next-action-cover');
  if (heroSong) { plate.hidden = false; plate.src = coverDataUrl(heroSong, 96); }
  else plate.hidden = true;
  card.onclick = () => runPrescription(rx);
}
// One launcher for every prescription kind, the path screen calls this too.
function runPrescription(rx) {
  if (rx.kind === 'resume') { resumeLastSession(); return; }
  if (rx.kind === 'proof' || rx.kind === 'repertoire' || rx.kind === 'song-review') {
    const s = SONGS.find((x) => x.id === rx.songId);
    if (!s) { $('btn-path').click(); return; }
    if (rx.kind === 'proof') {
      state.pathPending = { type: 'proof', lessonId: rx.lessonId, songId: rx.songId, section: rx.section, at: Date.now() };
    } else delete state.pathPending;
    store.save(state);
    startSong(s);
    pathSessionUntil = Date.now() + 5 * 60000; // council: five-minute timebox
    const secIdx = rx.section ? (s.sections ?? []).findIndex((x) => x.name === rx.section) : -1;
    if (rx.sub === 'weak-section' && secIdx >= 0) {
      startTraining(secIdx);
    } else {
      // proof / earn-playable / tier-up / song-review: help OFF, full tempo
      if (secIdx >= 0) $('section-select').value = String(secIdx);
      $('wait-mode').checked = false;
      rebuildEngine();
    }
    return;
  }
  $('btn-path').click(); // diagnostic / review / lesson / skill / assessment / done
}
// tap-sound toggle: Auto → On → Off, persisted; the chip always says the mode
function syncSoundBtn() {
  const m = ['auto', 'on', 'off'].includes(state.soundMode) ? state.soundMode : 'auto';
  $('btn-sound').textContent = m === 'auto' ? 'Auto' : m === 'on' ? 'On' : 'Off';
}
$('btn-sound').addEventListener('click', () => {
  state.soundMode = soundModeNext(state.soundMode);
  store.save(state);
  jlog('sound_mode', { mode: state.soundMode });
  syncSoundBtn();
});

// Lesson payoff fragments launch with help ON: hearing the skill in a song.
function launchSongFragment({ songId, section, wait = true }) {
  const s = SONGS.find((x) => x.id === songId);
  if (!s) return;
  startSong(s);
  const secIdx = section ? (s.sections ?? []).findIndex((x) => x.name === section) : -1;
  if (secIdx >= 0) $('section-select').value = String(secIdx);
  $('wait-mode').checked = wait;
  rebuildEngine();
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
    <img class="cover-plate cover-64" src="${coverDataUrl(main, 64)}" alt="" aria-hidden="true">
    <h3>${main.title}</h3>
    <div class="composer">${main.composer.replace(' · easy arrangement', '')} · ${main.bpm} bpm</div>
    ${levelRow}
    <div class="stats">
      <span>Difficulty <b>${difficultyScore(variants[0])}${variants.length > 1 ? '–' + difficultyScore(main) : ''}</b></span>
      <span>Plays <b>${variants.reduce((a, v) => a + songStats(v.id).plays, 0)}</b></span>
      <span class="verdict-word">${(() => { const best = variants.find((v) => state.playable?.[v.id]?.provenAt) ?? variants.find((v) => songStats(v.id).plays > 0); return best ? verdictWord(state, best.id) : ''; })()}</span>
      <span class="${st.scorePasses > 0 ? 'learned' : ''}">${st.scorePasses > 0 ? '♪ read from score' : ''}</span>
    </div>`;
  // card click: the ladder, first unbeaten tier, Easy upward
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
function makeRow(variants, fromLabel = null) {
  const main = variants[variants.length - 1];
  const row = document.createElement('button');
  row.className = 'song-row';
  const topStars = starsOf(main.id);
  // tier chips are clickable: Mark jumps straight to Hard on new songs.
  // Each carries its measured difficulty (number + word, colour-blind law).
  const tiers = variants.length > 1
    ? variants.map((v) => { const d = difficultyScore(v); return `<i class="row-tier" data-id="${v.id}" title="${v.level} · difficulty ${d} (${difficultyBand(d)})">${(v.level || '')[0]}</i>`; }).join('')
    : '';
  const dLo = difficultyScore(variants[0]), dHi = difficultyScore(main);
  const diff = variants.length > 1 ? `${dLo}–${dHi}` : `${dHi} ${difficultyBand(dHi)}`;
  row.innerHTML = `
    <img class="cover-plate cover-40" src="${coverDataUrl(main, 40)}" alt="" aria-hidden="true">
    <span class="row-title">${main.title}</span>
    <span class="row-meta">${fromLabel ?? main.composer.replace(' · easy arrangement', '')}</span>
    <span class="row-diff" title="measured difficulty, 1–10">${diff}</span>
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

state.lib = Object.assign({ learning: true, repertoire: false, fame: false, explore: false }, state.lib || {});
let libQuery = ''; // the GLOBAL search, one box, every shelf
function renderGameRow() {
  const lvl = gameLevel(totalXp(state));
  const pct = Math.round((lvl.into / lvl.next) * 100);
  $('game-level').innerHTML = `GAME LEVEL <b>${lvl.level}</b>
    <i class="xp-bar"><i style="width:${pct}%"></i></i>
    <span class="xp-num">${lvl.into}/${lvl.next} XP</span>`;
  const today = localDay(new Date());
  const r = rhythmOf(state, today);
  $('rhythm-chip').textContent = r.current > 0
    ? `${r.current}-day rhythm · best ${r.best}` + (r.freezes ? ` · freezes ×${r.freezes}` : '')
    : (r.best > 1 ? `Fresh start today · best rhythm ${r.best}` : '');
  // humane continuity: OFFER a freeze, never force or shame, and a declined
  // offer stays declined for the day (Codex review P3)
  const offer = state.freezeDeclined === today ? null : freezeOffer(state, today);
  const fo = $('freeze-offer');
  if (offer) {
    fo.hidden = false;
    fo.innerHTML = `Yesterday slipped by. Use a freeze to keep your ${offer.wouldKeep}-day rhythm?
      <button id="freeze-yes" class="tool">Use one</button>
      <button id="freeze-no" class="ghost">Fresh start</button>`;
    $('freeze-yes').onclick = () => { useFreeze(state, offer.yesterday); store.save(state); jlog('freeze_used', {}); renderLibrary(); };
    $('freeze-no').onclick = () => { fo.hidden = true; state.freezeDeclined = today; store.save(state); };
  } else fo.hidden = true;
  // daily quests: three offered, HE picks one; declining costs nothing
  const quests = questsFor(state, today);
  $('quest-row').innerHTML = `<span class="quest-tag">Today</span>` + quests.map((q) => `
    <button class="quest ${q.active ? 'on' : ''} ${q.done ? 'done' : ''}" data-q="${q.id}" title="${q.why}">
      <i>${q.done ? '✓' : q.active ? '▶' : '○'}</i> ${q.label} <span class="q-xp">+${q.xp}</span>
    </button>`).join('');
  for (const b of $('quest-row').querySelectorAll('.quest')) {
    b.addEventListener('click', () => {
      chooseQuest(state, today, b.dataset.q);
      jlog('quest_chosen', { id: b.dataset.q });
      settleGame(); // it may already be satisfied, pay it honestly
      renderLibrary();
    });
  }
  // weekly mission: pick one of three, resumable, no expiry loss. A mission
  // that crossed into a new week re-bases instead of going stale forever.
  const week = isoWeek(new Date());
  rebaseWeekly(state, week);
  const w = state.weekly && !state.weekly.done ? state.weekly : null;
  if (w) {
    const m = weeklyOptions(state, w.week).find((x) => x.id === w.id);
    $('weekly-row').innerHTML = `<span class="quest-tag">Mission</span>
      <span class="weekly-live"><i>${m?.done ? '✓' : '▶'}</i> ${m?.label ?? w.id} <span class="q-xp">+150</span></span>`;
  } else {
    $('weekly-row').innerHTML = `<span class="quest-tag">Mission</span>` + weeklyOptions(state, week).map((m) => `
      <button class="quest" data-w="${m.id}" title="${m.why}"><i>○</i> ${m.label} <span class="q-xp">+${m.xp}</span></button>`).join('');
    for (const b of $('weekly-row').querySelectorAll('[data-w]')) {
      b.addEventListener('click', () => { chooseWeekly(state, week, b.dataset.w); jlog('weekly_chosen', { id: b.dataset.w }); settleGame(); renderLibrary(); });
    }
  }
}


// ---------- the canon library (apply-design rung (d), behind ?canon=1) -------
// The renderer next door renders the DESIGN'S OWN MARKUP and binds data into
// it; this function is the data half, and the only place the two meet. Nothing
// here decides how anything looks. If the library looks wrong, it is wrong in
// Claude Design and gets fixed there, re-extracted and rebuilt - which is the
// whole reason the port stopped drifting.
function canonRowOf(variants) {
  const main = variants[variants.length - 1];
  // proofs per tier, easiest first: exactly the pips the design draws
  const tiers = variants.map((v) => songStats(v.id).stars || 0);
  const plays = variants.reduce((a, v) => a + (songStats(v.id).plays || 0), 0);
  const dLo = difficultyScore(variants[0]), dHi = difficultyScore(main);
  const banked = tiers.every((t) => t >= 3);
  return {
    song: main,
    title: main.title,
    sub: main.composer.replace(' · easy arrangement', ''),
    plays: String(plays),
    // en dash, matching the design's own "4.2–5.7"
    diff: variants.length > 1 ? `${dLo}–${dHi}` : String(dHi),
    state: banked ? 'Banked' : (plays > 0 || tiers.some((t) => t > 0)) ? 'Needs work' : 'Not started',
    tiers,
    onOpen: () => startSong(variants.find((v) => (songStats(v.id).stars || 0) < 3) ?? main),
  };
}

// The desktop frame is a fixed 1418px composition. It fits or it does not;
// there is no in-between the design specified, so this is a straight width test
// against the frame's own width rather than a breakpoint somebody invented.
const CANON_DESKTOP_W = 1418;
// desktopFits gates at 1000 CSS px and the card fit-scales below 1418: Mark's
// zoomed Edge viewport sat under 1418 and got the phone column in a desktop
// window (his screenshot, 2026-08-29 evening).
const canonLibraryScreen = () =>
  (desktopFits() && CANON_ON ? 'library-desktop' : 'library');

function canonLibraryCtx() {
  const lvl = gameLevel(totalXp(state));
  const today = localDay(new Date());
  const r = rhythmOf(state, today);
  const groups = groupSongs(SONGS);
  const { learning, repertoire, explore } = classifyGroups(groups, songStats);
  const last = state.lastSession;
  const lastSong = last && SONGS.find((x) => x.id === last.songId);
  const rx = prescribe(state, Date.now(), {
    songs: SONGS, statsOf: songStats,
    resume: lastSong ? { songId: lastSong.id, title: lastSong.title, level: lastSong.level, at: last.at } : null,
  });
  const heroSong = rx.songId && SONGS.find((x) => x.id === rx.songId);

  // THE TABS ARE TABS. Clicking Hall of fame used to toggle a collapse flag the
  // canon renderer never read, so the table showed Learning forever and every
  // tab click did nothing a person could see. Mark, 2026-08-29, second report:
  // "Why can't I click on Hall of Fame or repertoire or explore... Nothing
  // happens." The table now shows the ACTIVE tab's list, and the search box
  // filters across every shelf, tagged with where each hit lives.
  const q = libQuery.trim();
  const fameGroups = HALL_OF_FAME.map((h2) => groups.get(h2.group)).filter(Boolean);
  const sortMode2 = state.lib.exploreSort === 'diff' ? 'diff' : 'az';
  // Explore is the ALL SONGS shelf (Mark, 2026-08-30: "make sure explore has
  // all our songs in it, that's our all songs area"): every group, not just
  // the untouched remainder, so the sleeve wall from here is the whole catalogue
  const allGroups = [...groups.values()];
  // THE SORT APPLIES TO EVERY SHELF (Mark, 2026-08-30: "I don't think those
  // buttons do anything"). He was right: only Explore consulted the setting,
  // so on Learning the click stored a preference, moved nothing, and left the
  // header still reading WEAKEST FIRST. Now each shelf keeps its own smart
  // order under 'diff' and every shelf can go A to Z, and the header below
  // NAMES the order actually on screen.
  const azSort = (list) => [...list].sort((a2, b2) =>
    a2[a2.length - 1].title.localeCompare(b2[b2.length - 1].title));
  const az = sortMode2 === 'az';
  const smartTitle = { learning: 'LEARNING, WEAKEST FIRST', repertoire: 'REPERTOIRE, STRONGEST FIRST',
    fame: 'HALL OF FAME', explore: 'EXPLORE, EASIEST FIRST' };
  const shelf = (key, list) => ({
    rows: az ? azSort(list) : list,
    title: az ? `${smartTitle[key].split(',')[0]}, A TO Z` : smartTitle[key],
    word: { learning: 'Learning', repertoire: 'Repertoire', fame: 'Hall of fame', explore: 'Explore' }[key],
  });
  const LISTS = {
    learning: shelf('learning', learning),
    repertoire: shelf('repertoire', repertoire),
    fame: shelf('fame', fameGroups),
    explore: shelf('explore', sortMode2 === 'diff'
      ? [...allGroups].sort((a2, b2) => difficultyScore(a2[0]) - difficultyScore(b2[0]))
      : allGroups),
  };
  const activeTab = LISTS[state.lib.canonTab] ? state.lib.canonTab : 'learning';
  // Search over EVERY variant of every group. filterExplore only reads
  // variants[0], while the table displays the LAST variant's composer, so a
  // search for words a person can literally see on screen ("rondo", the
  // arranger credit) found nothing. Codex caught it in review.
  const qLower = q.toLowerCase();
  const searchHits = q ? [...groups.values()].filter((v) =>
    v.some((x) => `${x.title} ${x.composer ?? ''}`.toLowerCase().includes(qLower))) : [];
  const active = q
    ? { rows: searchHits, title: 'SEARCH RESULTS', word: 'results' }
    : LISTS[activeTab];
  // The page size is the COMPOSITION'S OWN capacity: the 10a grid draws nine
  // tiles before its show-more cell, the 756 ledger draws five rows. One
  // hardcoded 5 starved the desktop grid; show-all/search then overflowed the
  // fixed band and tiles sat ON TOP of the practice chart and the form check
  // (Mark's screenshot, 2026-08-29). The binder contains the overflow too, but
  // the default page should fill the frame it was drawn for.
  libShelfTotal = active.rows.length;   // the plan needs to know what it can fill
  const pageSize = canonLibraryScreen() === 'library-desktop' ? libCapacity() : 5;
  const shown = state.lib.canonShowAll || q ? active.rows : active.rows.slice(0, pageSize);

  return {
    level: { n: lvl.level, xp: lvl.into, next: lvl.next },
    streak: { current: r.current, best: r.best },
    counts: { learning: learning.length, repertoire: repertoire.length,
              fame: HALL_OF_FAME.length, explore: allGroups.length },
    prescription: heroSong
      ? { title: heroSong.title, reason: rx.evidence ?? rx.reason, song: heroSong,
          // the hero's state chip carries the recommended GROUP's real state
          state: (() => { const v = groups.get(heroSong.group); return v ? canonRowOf(v).state : null; })() }
      // NO SONG: the headline is the SKILL'S NAME, never the whole sentence.
      // The drawn module allows three lines; "Time to check "Chords from a
      // symbol" is still there." overran and clipped (Mark's screenshot,
      // 2026-08-30). Name on top, sentence underneath, same as the teaser.
      : (() => {
        const sid = rx.skillId
          ?? (rx.lessonId && TEACHER_LESSONS.find((l2) => l2.id === rx.lessonId)?.skillIds?.[0]);
        const name = (sid && SKILL_BY_ID[sid]?.name)
          ?? ({ diagnostic: 'The check-in', assessment: 'The assessment', done: 'Path complete' }[rx.kind]
              ?? 'Continue learning');
        return { title: name, reason: rx.reason ?? rx.evidence ?? '', song: null };
      })(),
    // WHICH FRAME. The design draws the library twice: a 756px column (5b) and a
    // 1418x738 desktop composition (7a). They are different compositions, not
    // one reflowing, so pick the widest that fits rather than stretch either.
    screen: canonLibraryScreen(),
    rows: shown.map(canonRowOf),
    // the full shelf for the 12a sleeve wall, not just the nine on the grid
    galleryRows: active.rows.map(canonRowOf),
    learningTotal: active.rows.length,
    tableTitle: active.title,
    tabWord: active.word,
    activeTab: q ? 'search' : activeTab,   // 'search' matches no tab, so none styles as selected

    // the rail's live readouts
    carryOn: lastSong ? { title: 'Resume the session', sub: lastSong.title } : null,
    metronomeBpm: $('met-bpm')?.value ?? '100',
    voiceName: voiceModeLabel(voiceInfo().mode),
    // the app's single source of truth for whether a keyboard is plugged in
    keyboard: ($('midi-status')?.dataset.connected === 'true')
      ? { title: 'P-45 connected', sub: 'Real keys, real velocity.' }
      : { title: 'No keyboard', sub: 'Screen taps. Plug the P-45 in for the real thing.' },

    // The freeze offer (CANON-GAPS Gap C): same humane rules as renderGameRow,
    // offered never forced, and a decline holds for the day.
    freeze: (() => {
      if (state.freezeDeclined === today) return null;
      const offer = freezeOffer(state, today);
      return offer ? { wouldKeep: offer.wouldKeep, yesterday: offer.yesterday, freezes: state.freezeTokens ?? 0 } : null;
    })(),
    onFreezeYes: () => {
      const offer = freezeOffer(state, today);
      if (offer) { useFreeze(state, offer.yesterday); store.save(state); jlog('freeze_used', {}); }
      renderLibrary();
    },
    onFreezeNo: () => { state.freezeDeclined = today; store.save(state); renderLibrary(); },

    // the CHOOSE-1 cards (council 2026-08-30): every option visible, the
    // chosen one expanded with a LIVE line, ghosts clickable until paid
    quests: (() => {
      const ds = (state.dayStats ?? {})[today] ?? {};
      const prog = {
        minutes10: `${Math.min(10, Math.round(ds.minutes ?? 0))} of 10 min`,
        'clean-run': (ds.cleanRuns ?? 0) >= 1 ? 'clean run in' : null,
        'train-section': (ds.sectionsMastered ?? 0) >= 1 ? 'section mastered' : null,
        proof: (ds.proofsBanked ?? 0) >= 1 ? 'proof banked' : null,
        review: (ds.reviewsPassed ?? 0) >= 1 ? 'review passed' : null,
      };
      return questsFor(state, today).map((q) => ({
        id: q.id, label: q.label, xp: q.xp, done: !!q.done, why: q.why, chosen: !!q.active,
        line: [prog[q.id], q.why].filter(Boolean).join(' · '),
      }));
    })(),
    mission: (() => {
      const week = isoWeek(new Date());
      const opts = weeklyOptions(state, week);
      const chosenId = state.weekly?.week === week ? state.weekly.id : null;
      const dow = new Date().getDay();
      const daysLeft = dow === 0 ? 1 : 8 - dow;
      const daysIn = (state.days ?? []).filter((d) => isoWeek(new Date(d + 'T12:00:00')) === week).length;
      const proofsIn = Object.values(state.pathProofs ?? {}).filter((p) => p.at && isoWeek(new Date(p.at)) === week).length;
      const prog = {
        days3: `${daysIn} of 3 days`,
        proofs2: `${proofsIn} of 2 proofs`,
        playable1: null,
      };
      const items = opts.map((m) => ({
        id: m.id, label: m.label, xp: m.xp, done: !!m.done, why: m.why, chosen: m.id === chosenId,
        line: [prog[m.id], `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`].filter(Boolean).join(' · '),
      }));
      return { each: `+${opts[0]?.xp ?? 150}`, items, week };
    })(),

    // practice, last 7 days, oldest first, in real minutes
    practice: (() => {
      const pmin = state.pmin ?? {};
      const out = [];
      const d = new Date();
      d.setDate(d.getDate() - 6);
      const LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      for (let i = 0; i < 7; i++) {
        const key = localDay(d);
        out.push({ label: LETTER[d.getDay()], key, minutes: pmin[key] ?? 0, isToday: key === today });
        d.setDate(d.getDate() + 1);
      }
      return out;
    })(),
    // the chart's total and trend (council: a chart is decorative without them)
    practiceHead: (() => {
      const pmin = state.pmin ?? {};
      const d = new Date();
      let total = 0, days = 0;
      for (let i = 0; i < 7; i++) { const k = localDay(d); const m = pmin[k] ?? 0; total += m; if (m > 0) days++; d.setDate(d.getDate() - 1); }
      return `${Math.round(total)} MIN · ${days} DAY${days === 1 ? '' : 'S'}`;
    })(),
    practiceTrend: (() => {
      const pmin = state.pmin ?? {};
      const d = new Date();
      let cur = 0, prev = 0;
      for (let i = 0; i < 14; i++) { const k = localDay(d); const m = pmin[k] ?? 0; if (i < 7) cur += m; else prev += m; d.setDate(d.getDate() - 1); }
      // a tiny baseline makes the percentage absurd (+1599% on Mark's own
      // screen): under 15 baseline minutes the comparison is not a trend yet
      if (prev < 15) return cur > 0 ? 'Building the baseline' : 'First full week';
      const pct = Math.round(((cur - prev) / prev) * 100);
      if (pct > 300) return 'Way up on last week';
      if (pct < -75) return 'Way down on last week';
      return `${pct >= 0 ? '+' : ''}${pct}% vs previous 7 days`;
    })(),

    // The four-line teaser (council): skill name, prescribed action, evidence,
    // and the stage pips only when a real skill is on trial.
    path: (() => {
      const skillId = rx.skillId
        ?? (rx.lessonId && TEACHER_LESSONS.find((l2) => l2.id === rx.lessonId)?.skillIds?.[0]);
      const skillName = (skillId && SKILL_BY_ID[skillId]?.name)
        ?? ({ diagnostic: 'The check-in', assessment: 'The assessment', done: 'Path complete' }[rx.kind] ?? 'Continue learning');
      const stage = skillId ? (state.mastery?.[skillId]?.stage ?? 'unseen') : null;
      const rank = stage ? STAGES.indexOf(stage) : -1;
      return {
        skill: skillName, action: rx.reason, evidence: rx.evidence ?? '',
        stage: rx.evidence ?? '',
        stagesDone: rank >= 0 ? rank + 1 : null,
        stagesTotal: rank >= 0 ? STAGES.length : null,
      };
    })(),

    onRun: () => runPrescription(rx),
    onShowMore: () => { state.lib.canonShowAll = true; store.save(state); renderLibrary(); },
    onQuest: (q) => { chooseQuest(state, today, q.id); store.save(state); renderLibrary(); },
    onMission: (m) => { chooseWeekly(state, isoWeek(new Date()), m.id); settleGame(); renderLibrary(); },
    onPath: () => runPrescription(rx),
    // DEMOTED to an on-demand tool (Mark's word, 2026-08-30): the card never
    // auto-appears; the All tools "Form check" row summons it, Done or Not
    // today puts it away. formDue no longer nags anyone.
    onFormDone: () => { $('form-done')?.click(); state.formOnDemand = false; store.save(state); renderLibrary(); },
    onFormSnooze: () => { $('form-snooze')?.click(); state.formOnDemand = false; store.save(state); renderLibrary(); },
    formCheckDue: state.formOnDemand === true,
    onChooseAnother: () => { state.lib.explore = true; store.save(state); renderLibrary(); },
    onSearch: (q) => { libQuery = q; renderLibrary(); },
    onTab: (sec) => { state.lib.canonTab = sec; state.lib.canonShowAll = false; store.save(state); renderLibrary(); },
    onTool: (id) => { const el = $(id); if (el) el.click(); },
    sortMode: state.lib.exploreSort === 'diff' ? 'diff' : 'az',
    onSort: (mode) => { state.lib.exploreSort = mode; store.save(state); renderLibrary(); },

    // Per-tool TRUTH for the drawer (sample-bleed audit: the drawn rows carried
    // fake states - "9 recordings kept, 312MB", "Measured 42ms", "Two won" -
    // wearing the user's clothes). Only lines the app can actually compute;
    // a tool with a plain description keeps the design's own words.
    toolStatus: (() => {
      const takes = state.takes ?? [];
      const tu = takes.length ? takeUsage([...takes]) : null;
      const won = badges(state, SONGS).length;
      const ladderDone = LADDER.filter((l2) => {
        const p2 = songStats(l2.id).sectionsPassed ?? {};
        return !!(p2['Going up'] && p2['Coming down']);
      }).length;
      const rl = state.rhythm?.level;
      const el2 = state.echo?.level;
      const out = {
        'Rhythm tap': { line: rl ? `Tap the pattern, no pitch. Level ${rl}.` : 'Tap the pattern, no pitch.', done: !!state.rhythm?.totalCleans },
        'Melody echo': { line: el2 ? `Hear a phrase, play it back. Level ${el2}.` : 'Hear a phrase, play it back.', done: (state.echo?.bestStreak ?? 0) > 0 },
        '12 keys': { line: `Fluency ladder. ${ladderDone} of ${LADDER.length} cells passed.`, done: ladderDone > 0 },
        'Metronome': { line: (() => { const sig = String($('met-sig')?.value ?? '4/4'); return `${$('met-bpm')?.value ?? 100} bpm, ${sig.includes('/') ? sig : sig + '/4'}.`; })(), done: false },
        'Trophies': { line: won ? `${won} won. XP log kept alongside.` : 'Nothing won yet. XP log kept alongside.', done: won > 0 },
        'Takes': { line: tu ? `${tu.count} recording${tu.count === 1 ? '' : 's'} kept, ${tu.mb} MB.` : 'No takes yet. Record from any song.', done: takes.length > 0 },
        'Latency calibration': { line: state.calOffsetMs ? `Measured ${state.calOffsetMs}ms of output delay, applied to scoring.` : 'Not measured yet. Two minutes, once.', done: !!state.calibratedAt },
        'Touch diagnostic': { line: state.touch?.date ? `Calibrated ${state.touch.date}.` : 'Not run yet. Teaches the app your touch.', done: !!state.touch?.date },
        'Lessons': { done: Object.keys(state.lessons ?? {}).length > 0 },
        'My path': { done: Object.keys(state.mastery ?? {}).length > 0 },
        'Form check': { line: state.formLast ? `Last done ${state.formLast}.` : 'A 60 second posture self-check, on your terms.', done: !!state.formLast },
      };
      return out;
    })(),

    // The seventeen tools, read out of the app's own rails so the counts and
    // the labels cannot drift from what actually exists. The canon has no
    // artboard for this panel yet (design-2026-08/CANON-GAPS.md); without it
    // most of the app is unreachable under the flag.
    tools: ['learn', 'practise', 'tools'].map((rail) => {
      const host = $(`rail-${rail}`);
      const items = host ? [...host.querySelectorAll('button[id]')].map((btn) => {
        // the button's own label, minus the leading emoji the rail uses
        const text = (btn.textContent || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
        // The dock in the canon is a NAME and a trailing readout ("Voice" /
        // "Grand"). btn-voice's label is a whole diagnostic sentence, so split
        // it the way the design's own dock item is shaped rather than let it
        // run off the end of the rail.
        const i = text.indexOf(':');
        if (i < 0) return { id: btn.id, label: text };
        const note = text.slice(i + 1).trim().replace(/\s*\(.*$/, '');
        return { id: btn.id, label: text.slice(0, i).trim(), note };
      }) : [];
      return { label: rail === 'practise' ? 'PRACTISE' : rail.toUpperCase(), items };
    }).filter((g) => g.items.length),
  };
}

// ---- the ELASTIC library + AMBIENT WASH (council law, 2026-08-30) ----------
// Mark: "the home page fills the page and looks amazing with the colours of
// the album art." Codex verdict (c): the tile band flexes by WHOLE rows, the
// dashboard pins to the viewport bottom, and a page-wide wash sampled from
// the hero art keeps black from reading as void. All values are the
// council's law, recorded in CANON-GAPS.
// the council redraw's own numbers, read off the board: 132px cells, 6px gaps,
// 166px rows, and a 412px recommendation module occupying the first row's head
let lastLibCap = 0;
const LIB_CELL = 138;        // 132 + 6 gap
const LIB_ROW_PITCH = 180;   // 166px row + the board's 14px ROW gap (its two
                             // drawn rows span 346: 166 + 14 + 166). Using the
                             // 6px COLUMN gap here cut every row after the first.
const LIB_MODULE_W = 418;    // 412 + 6
let libDrawnGridH = 346;     // the board's own grid band, captured at first render
let libDashH = 206;          // the dashboard strip's natural height, captured once
const LIB_GRID_TOP = 162;    // header 54 + tools 50 + tabs 44, off the board
let libShelfTotal = 0;       // how many songs the active shelf actually has
function libPlan() {
  // WHOLE, FULL ROWS. Mark, 2026-08-30: "if we have enough songs, let the songs
  // take up that whole black space and just leave the last square as the See
  // all". So we never open a row we cannot completely fill: we take the tallest
  // whole number of rows the window allows AND the shelf can fill, the door
  // takes the final cell, and any leftover height goes to the cards, never to
  // black. (This supersedes the clipped part-row idea from earlier today.)
  const z = Math.min(1, window.innerWidth / 1418) || 1;
  const frameH = Math.max(738, Math.round(window.innerHeight / z));
  const avail = Math.max(LIB_ROW_PITCH, frameH - LIB_GRID_TOP - libDashH - 14);
  const bySpace = Math.max(1, Math.floor((avail + 14) / LIB_ROW_PITCH));
  const firstRow = Math.max(1, Math.floor((1390 - LIB_MODULE_W) / LIB_CELL));
  const otherRow = Math.max(1, Math.floor(1390 / LIB_CELL));
  const cellsFor = (r) => firstRow + (r - 1) * otherRow;
  let rows = 1;
  for (let r = bySpace; r >= 1; r--) {
    // the door is a DOUBLE-WIDTH cell (286px against a 132px tile), so it eats
    // two slots, not one. Counting it as one overflowed into a fourth row that
    // could not be filled, which is where the black came back.
    if (cellsFor(r) - 2 <= libShelfTotal) { rows = r; break; }
  }
  return { rows, capacity: Math.max(1, cellsFor(rows) - 2) };
}
const libCapacity = () => libPlan().capacity;
function applyLibraryAtmosphere() {
  const host = $('screen-library');
  const card = host?.firstElementChild;
  const frame = card?.firstElementChild;
  if (!frame || !frame.style.height) return;      // phone board: fixed column
  const z = Math.min(1, window.innerWidth / 1418);
  const target = Math.max(738, Math.round(window.innerHeight / z));
  frame.style.height = target + 'px';
  // the hero/tile band is the flexible region; find it as the frame child
  // containing the grid's show-more control
  // NO DEAD BLACK BAND (council ruling 2026-08-30, Mark's third ask). The grid
  // fills everything between the tabs and the dashboard; its last row is
  // clipped mid-sleeve on purpose and wears a short fade so the cut reads as
  // deliberate. When the shelf runs out of songs the dashboard FLOATS UP to
  // meet the grid instead of leaving a hole. Values are the council's.
  const gridRow = frame.querySelector('[data-lib-grid]');
  const todayLeaf = [...frame.querySelectorAll('*')]
    .find((e) => !e.children.length && /CHOOSE 1$/.test(e.textContent.trim()));
  if (gridRow && todayLeaf) {
    const content = [...frame.children].find((c) => c.contains(gridRow));
    let dashBand = todayLeaf;
    while (dashBand && dashBand.parentElement && dashBand.parentElement !== content) dashBand = dashBand.parentElement;
    let gridBand = gridRow;
    while (gridBand && gridBand.parentElement && gridBand.parentElement !== content) gridBand = gridBand.parentElement;

    gridRow.style.flexWrap = 'wrap';
    gridRow.style.alignContent = 'flex-start';
    gridRow.style.overflow = 'hidden';
    if (gridRow.dataset.drawnH) libDrawnGridH = Number(gridRow.dataset.drawnH) || libDrawnGridH;

    if (content && dashBand && gridBand && dashBand !== gridBand) {
      dashBand.style.flex = '0 0 auto';
      if (dashBand.getBoundingClientRect().height > 40) {
        const z0 = Math.min(1, window.innerWidth / 1418) || 1;
        libDashH = Math.round(dashBand.getBoundingClientRect().height / z0);
      }
      const z = Math.min(1, window.innerWidth / 1418) || 1;
      // measured from the GRID'S OWN TOP to the content's bottom: the content
      // column also holds the tabs row, and subtracting only the dashboard
      // overshot by exactly the tabs' height and pushed the cards off screen.
      // The grid's top does not depend on the grid's height, so this is not
      // circular the way measuring the grid itself was.
      const avail = Math.max(LIB_ROW_PITCH, Math.round(
        (content.getBoundingClientRect().bottom - gridRow.getBoundingClientRect().top) / z) - libDashH - 14);
      const plan = libPlan();
      // WHOLE ROWS, PURE ARITHMETIC. The plan already decided how many rows the
      // shelf can completely fill; measuring the grid's natural height to infer
      // "is it clipped" kept disagreeing with it and left a fade over a row
      // that was never partial. There is no partial row any more.
      gridBand.style.flex = '0 0 auto';
      const h = Math.max(166, Math.min(avail, plan.rows * LIB_ROW_PITCH - 14));
      gridRow.style.height = h + 'px';
      gridBand.style.height = h + 'px';
      // leftover height belongs to the cards, never to black
      dashBand.style.flex = h < avail - 2 ? '1 1 auto' : '0 0 auto';
      const oldFade = gridBand.querySelector(':scope > [data-grid-fade]');
      if (oldFade) oldFade.remove();

      // The plan makes the door the FINAL cell of the last full row, so there
      // is nothing to reposition and nothing below the cut. All this does now
      // is undo any hiding a previous pass left behind, then stand down any
      // cell that genuinely does not fit (a shelf smaller than one row).
      const cells = [...gridRow.children].filter((c) => !c.dataset.gridFade);
      for (const c of cells) if (c.dataset.disp) { c.style.display = c.dataset.disp; delete c.dataset.disp; }
      const bottom = gridRow.getBoundingClientRect().bottom;
      for (const c of cells) {
        const r = c.getBoundingClientRect();
        if (r.height > 0 && r.top >= bottom - 2) {
          if (!c.dataset.disp) c.dataset.disp = c.style.display || '';
          c.style.display = 'none';
        }
      }
    }
  }

  // the ambient wash: one layer, colour from the hero art, under everything
  let wash = frame.querySelector(':scope > [data-lib-wash]');
  if (!wash) {
    wash = document.createElement('i');
    wash.dataset.libWash = '1';
    // data-bound atmosphere carries the frame's own stamp, the improv-options rule
    if (frame.dataset.canonStamp !== undefined) wash.dataset.canonStamp = frame.dataset.canonStamp;
    wash.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:block';
    frame.style.position = 'relative';
    frame.insertBefore(wash, frame.firstChild);
  }
  const heroImg = [...frame.querySelectorAll('img')].find((i2) => i2.getBoundingClientRect().width > 100);
  const paint = (el) => {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 8;
      const x = c.getContext('2d');
      x.drawImage(el, 0, 0, 8, 8);
      const d = x.getImageData(0, 0, 8, 8).data;
      let r = 0, g = 0, b = 0;
      for (let i2 = 0; i2 < d.length; i2 += 4) { r += d[i2]; g += d[i2 + 1]; b += d[i2 + 2]; }
      const n = d.length / 4; r /= n; g /= n; b /= n;
      // to HSL, clamp sat 40-72 and light 42-58 (council law); grey art
      // falls back to the app's own muted ink at the low peak
      const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255;
      const l = (mx + mn) / 2;
      const sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
      let h = 0;
      const rr = r / 255, gg = g / 255, bb = b / 255;
      if (mx !== mn) {
        if (mx === rr) h = ((gg - bb) / (mx - mn)) % 6;
        else if (mx === gg) h = (bb - rr) / (mx - mn) + 2;
        else h = (rr - gg) / (mx - mn) + 4;
        h = Math.round(h * 60); if (h < 0) h += 360;
      }
      const col = sat < 0.10 ? '120, 140, 130'
        : (() => {
          const s2 = Math.min(0.72, Math.max(0.40, sat)), l2 = Math.min(0.58, Math.max(0.42, l));
          const c2 = (1 - Math.abs(2 * l2 - 1)) * s2, x2 = c2 * (1 - Math.abs(((h / 60) % 2) - 1)), m2 = l2 - c2 / 2;
          const [r2, g2, b2] = h < 60 ? [c2, x2, 0] : h < 120 ? [x2, c2, 0] : h < 180 ? [0, c2, x2]
            : h < 240 ? [0, x2, c2] : h < 300 ? [x2, 0, c2] : [c2, 0, x2];
          return [r2 + m2, g2 + m2, b2 + m2].map((v) => Math.round(v * 255)).join(', ');
        })();
      const peak = sat < 0.10 ? '.035' : '.065';
      wash.style.background = `radial-gradient(ellipse 82% 88% at 24% 38%, rgba(${col},${peak}) 0%, rgba(${col},.035) 38%, rgba(${col},.012) 62%, transparent 82%)`;
    } catch { wash.style.background = 'none'; }
  };
  if (heroImg) {
    if (heroImg.complete && heroImg.naturalWidth) paint(heroImg);
    else heroImg.addEventListener('load', () => paint(heroImg), { once: true });
  }
  // ONE correction pass: the first render sizes the bands, and only then can
  // capacity be measured. If the measured grid holds more (or fewer) whole
  // cells than we dealt, re-render exactly once. The flag stops a loop.
  const want = libCapacity();
  if (want !== lastLibCap && !applyLibraryAtmosphere.__correcting) {
    applyLibraryAtmosphere.__correcting = true;
    lastLibCap = want;
    renderLibrary();
    applyLibraryAtmosphere.__correcting = false;
  }
}
function renderLibrary() {
  // The canon is a DIFFERENT COMPOSITION, not a reskin: it absorbs the game
  // row, the recommendation, the quests, the form card, the practice chart and
  // the path teaser that the old screen kept as separate blocks. So it replaces
  // the whole render, rather than running underneath it.
  if (CANON_ON) {
    syncTopbar(active);
    renderCanonLibrary($('screen-library'), canonLibraryCtx());
    applyLibraryAtmosphere();
    return;
  }
  renderGameRow();
  renderNextAction();
  renderFormCard();
  renderPracticeChart();
  for (const song of SONGS) {
    const errs = validateSong(song);
    if (errs.length) console.error(song.id, errs);
  }
  const groups = groupSongs(SONGS);
  const { learning, repertoire, explore } = classifyGroups(groups, songStats);
  // GLOBAL search (Mark 2026-08-28: "songs are spread across categories"):
  // a query collapses the sections into one result list, each row tagged
  // with WHERE the song lives
  const q = libQuery.trim();
  $('sec-results').hidden = !q;
  for (const id of ['sec-learning', 'sec-repertoire', 'sec-fame', 'sec-explore']) $(id).hidden = !!q;
  if (q) {
    const inFame = new Set(HALL_OF_FAME.map((h) => h.group));
    const tagOf = (v) => learning.includes(v) ? 'Learning'
      : repertoire.includes(v) ? 'Repertoire'
      : inFame.has(v[0].group ?? v[0].id) ? '🎬 Hall of fame' : 'Explore';
    const hits = filterExplore([...groups.values()], q);
    const el = $('list-results');
    el.innerHTML = '';
    for (const v of hits) el.appendChild(makeRow(v, tagOf(v) + ' · ' + v[v.length - 1].composer.replace(' · easy arrangement', '')));
    if (!hits.length) el.innerHTML = '<p class="hint">Nothing matches, try a shorter word.</p>';
  }
  $('learn-count').textContent = learning.length ? String(learning.length) : '';
  const fill = (id, items, make) => {
    const el = $(id);
    el.innerHTML = '';
    for (const v of items) el.appendChild(make(v));
    if (!items.length) el.innerHTML = `<p class="hint">${id === 'list-learning' ? 'Nothing in flight, pick something from Explore.' : 'Nothing here yet.'}</p>`;
  };
  fill('list-learning', learning, makeCard);
  fill('list-repertoire', repertoire, makeRow);
  // 🎬 hall of fame: the screen songs, provenance shown (Mark's ask 08-28)
  const fameEl = $('list-fame');
  fameEl.innerHTML = '';
  for (const h of HALL_OF_FAME) {
    const variants = groups.get(h.group);
    if (variants) fameEl.appendChild(makeRow(variants, '🎬 ' + h.from));
  }
  // explore ordering: A–Z or by measured entry difficulty (easiest tier first)
  const sortMode = state.lib.exploreSort === 'diff' ? 'diff' : 'az';
  $('explore-sort').textContent = sortMode === 'diff' ? '1→10' : 'A–Z';
  $('explore-sort').title = sortMode === 'diff' ? 'Ordered by difficulty, tap for A–Z' : 'Ordered A–Z, tap for difficulty';
  const exploreSorted = sortMode === 'diff'
    ? [...explore].sort((a, b) => difficultyScore(a[0]) - difficultyScore(b[0]))
    : explore;
  fill('list-explore', exploreSorted, makeRow);
  // collapse state (persisted; Learning defaults open)
  for (const head of document.querySelectorAll('.lib-head')) {
    const sec = head.dataset.sec;
    const open = !!state.lib[sec];
    head.setAttribute('aria-expanded', String(open));
    head.closest('.lib-sec')?.classList.toggle('open', open);
  }
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
$('explore-sort').addEventListener('click', (ev) => {
  ev.stopPropagation();
  state.lib.exploreSort = state.lib.exploreSort === 'diff' ? 'az' : 'diff';
  state.lib.explore = true;
  store.save(state);
  jlog('explore_sort', { mode: state.lib.exploreSort });
  renderLibrary();
});
$('lib-search').addEventListener('input', () => {
  libQuery = $('lib-search').value;
  renderLibrary();
});
// rail: one sheet open at a time, tap again to close (state is not persisted, 
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
let pathSessionUntil = 0; // 13th council: prescribed sessions get a 5-minute timebox
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
let demoEngine = null; // Hear-it v2 (Mark 2026-08-28): the song PLAYS ITSELF: 
// falls flow, keys press, grand sounds. A separate engine so the demo can
// never touch stats, laps, proofs or the playable ledger.

function comboFlash(n) {
  const el = $('combo-flash');
  // numbers are combo milestones; any other message renders verbatim
  el.textContent = typeof n === 'number' ? `${n} NOTE STREAK` : n;
  el.classList.remove('go');
  void el.offsetWidth; // restart the animation
  el.classList.add('go');
}

function startSong(s, { asScorePass = false } = {}) {
  jlog('song_start', { id: s.id, sight: !!s.sightRead });
  pathSessionUntil = 0; // an ordinary open carries no prescribed timebox
  song = s;
  sightMode = !!s.sightRead;
  scorePassFlag = asScorePass;
  viewMode = (asScorePass || sightMode) ? 'score' : 'falls';
  hand = 'both';
  document.querySelectorAll('.hand-btn').forEach((x) => (x.dataset.on = String(x.dataset.hand === 'both')));
  if (CANON_ON) syncHandCells();
  // sight reading is score-led by definition: no falls, no hearing it first
  $('mode-falls').disabled = sightMode;
  $('btn-hear').disabled = sightMode;
  $('btn-train').disabled = sightMode;
  show('play');
  $('now-playing').textContent = `${s.title}${s.level ? ' · ' + s.level : ''} · ${s.composer.replace(' · easy arrangement', '')} · D${difficultyScore(s)} ${difficultyBand(difficultyScore(s))}`;
  renderSections();
  $('section-select').value = '';
  chunkIdx = null; syncChunkLabel();
  trainer = null; syncTrainButton();
  $('tempo').value = 100; $('tempo-val').textContent = '100%';
  // sight reading: read at your own pace early, in time from level 3
  $('wait-mode').checked = sightMode ? (state.sight?.level ?? 1) < 3 : true;
  rebuildEngine();
  syncModeButtons();
  renderJourney();
}

function renderSections() {
  const passed = songStats(song.id).sectionsPassed ?? {};
  const sel = $('section-select');
  const keep = sel.value;
  sel.innerHTML = '<option value="">Whole song</option>' +
    (song.sections ?? []).map((x, i) => `<option value="${i}">${passed[x.name] ? '✓ ' : ''}${x.name}</option>`).join('');
  sel.value = keep && +keep < (song.sections?.length ?? 0) ? keep : '';
}

// parseFloat, not unary +: the canon play board's own select claimed this id
// and its options carry the drawn words ("2 bars") as values, which made every
// chunk read NaN (Codex full-verify, 2026-08-29). The leading number is the
// honest value in both worlds.
function chunkBars() { return parseFloat($('chunk-size').value) || 2; }
function syncChunkLabel() {
  const btn = $('chunk-label');
  if (chunkIdx === null) { btn.textContent = 'Chunks off'; return; }
  const c = chunkRange(song, chunkIdx, chunkBars());
  btn.textContent = `Chunk ${c.idx + 1} / ${c.count}`;
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
  window.__falls = falls;   // the wide play screen adopts this canvas and calls resize()
  // the artboard's still picture of the deck must not sit over the live one
  if (CANON_ON) hideRestingLayer($('falls'));
  falls.noteStyle = window.__keysNoteStyle;
  falls.cueLetters = state.showLetters !== false;
  // Wait mode freezes the clock, so EARLY/PERFECT/LATE cannot exist there, 
  // say so once, or the verdicts just look broken (Mark, 2026-08-25)
  if ($('wait-mode').checked && !window.__verdictHintShown) {
    window.__verdictHintShown = true;
    setTimeout(() => falls?.biasNote('Wait mode is on, turn "Wait for me" off to see EARLY / PERFECT / LATE'), 1200);
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
    hand, wait: $('wait-mode').checked, view: viewMode, at: Date.now(),
  };
  store.save(state);
  armed = !$('wait-mode').checked;
  armCountUntil = 0;
  falls.banner = armed ? 'Press any key when ready, then one bar counts you in' : null;
  if (armed) comboFlash('PRESS ANY KEY TO START');
  // council: the 160px cover shows only in the ready state, then cedes the
  // light to the notes (240ms fade on the first press)
  const pc = $('play-cover');
  pc.src = coverDataUrl(song, 512);
  pc.classList.remove('fade');
  pc.hidden = false;
  lastT = 0;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loopFrame);
}

// the trigger press is consumed: it starts the count-in, it is never judged
function fadePlayCover() {
  const pc = $('play-cover');
  if (pc.hidden || pc.classList.contains('fade')) return;
  pc.classList.add('fade');
  setTimeout(() => { pc.hidden = true; }, 260);
}
function startArmCountIn() {
  armed = false;
  falls.banner = null;
  fadePlayCover();
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
  if (pathSessionUntil && Date.now() >= pathSessionUntil) {
    pathSessionUntil = 0;
    comboFlash('5 MINUTES: SESSION BANKED');
    jlog('path_session_done', { id: song?.id });
  }
  // Hear-it v2: while the demo engine plays the song itself, the falls follow
  // IT: auto-struck at the line, and the real engine (and all stats) sleep.
  if (previewActive && demoEngine) {
    if (lastT) demoEngine.tick(Math.min(200, t - lastT));
    lastT = t;
    let g = demoEngine.currentGroup();
    while (g && g.beat <= demoEngine.beat + 0.001) {
      for (const n2 of [...g.notes]) demoEngine.noteOn(n2.m);
      const g2 = demoEngine.currentGroup();
      if (g2 === g) break;
      g = g2;
    }
    for (const ev of demoEngine.drainEvents()) {
      if ((ev.type === 'perfect' || ev.type === 'good') && viewMode === 'falls') falls.burst(ev.midi, ev.type);
    }
    if (viewMode === 'falls') falls.draw(demoEngine); else score.update(demoEngine, hand);
    if (demoEngine.finished) { previewStop?.(); stopDemo(); }
    scheduleFrame();
    return;
  }
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
  // setHTMLKeeping, not innerHTML: the canon nests #combo-flash inside the hud,
  // and rebuilding the hud sixty times a second was deleting it.
  setHTMLKeeping($('hud'), `
    <span>Score <b>${points}</b></span>
    <span>Combo <b>${combo > 0 ? 'x' + combo : '-'}</b></span>
    <span>Accuracy <b>${engine.accuracy()}%</b></span>
    <span class="h-wrong">Wrong <b>${s.wrong}</b></span>` + paceHtml() + pedalHtml());
  // the wide play board's readout column mirrors the same numbers
  window.__viewMode = viewMode;
  // AUTO-immersion is DEAD (Mark, 2026-08-30: "the zooming in when we start
  // playing is annoying and throws me off"). Immersion is now his gesture
  // only: double-click the deck in, double-click / Escape / CONTROLS rail out.
  syncWidePlay({
    accuracy: engine.accuracy(),
    combo: combo > 0 ? combo : 0,
    timing: '\u2014',   // no honest per-frame timing source yet; a dash, never sample data
    tier: (falls?.comboLevel ?? 0) + 1,
    title: song?.title,
    sub: song ? `${(song.level ?? 'easy')[0].toUpperCase()}${(song.level ?? 'easy').slice(1)} tier` : null,
    bpm: song ? Math.round(song.bpm * (+$('tempo').value) / 100) + ' bpm' : null,
  });
  if (engine.finished) { finishSong(); return; }
  scheduleFrame();
}

function finishSong() {
  window.__deckImmersion?.(false);   // the run is over; give the controls back
  if (engine.__finishHandled) return; // pumped frames must not double-count
  engine.__finishHandled = true;
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
  st.bestCombo = Math.max(st.bestCombo ?? 0, bestCombo); // arcade stat, labelled arcade
  // playable-song ledger (13th council): only uncarryable evidence counts, 
  // whole song, help off, full tempo, both hands, ≥85%. Two days prove it.
  const qualified = qualifiesPlayable({ secIdx: $('section-select').value, wait: $('wait-mode').checked, tempo: $('tempo').value, hand, acc, sight: sightMode });
  if (qualified) {
    const wasDue = state.playable?.[song.id]?.dueAt && state.playable[song.id].dueAt <= Date.now();
    const status = recordPlayableRun(state, song.id, { day: localDay(new Date()), now: Date.now() });
    if (status === 'proven') { comboFlash('INDEPENDENTLY PLAYABLE'); awardXp('playable', song.id); earnFreeze(state); }
    else if (status === 'day-banked') comboFlash('DAY ONE BANKED: AGAIN ANOTHER DAY');
    else if (status === 'refreshed' && wasDue) awardXp('songReview', song.id + ':' + localDay(new Date()));
    jlog('playable_run', { id: song.id, status, acc });
    dayStat('cleanRuns');
    if (wasDue && status === 'refreshed') dayStat('reviewsPassed');
    awardXp('firstCleanRun', song.id);
  } else if (acc >= 85 && !$('wait-mode').checked && $('section-select').value === '' && !sightMode) {
    dayStat('cleanRuns'); // clean but e.g. slowed: still a real run for the quest
  }
  // song journey (goal-gradient milestones, pilot: See You Again Easy)
  const jj = journeyState(state, song.id);
  if (jj && jj.step < jj.steps.length) {
    const stepDef = jj.steps[jj.step];
    const secOk = !stepDef.section || song.sections?.[+$('section-select').value]?.name === stepDef.section;
    const handOk = stepDef.hand === 'both' ? hand === 'both' : hand === stepDef.hand;
    const passOk = stepDef.pass === 'finish' ? true
      : stepDef.pass === 'run85' ? (acc >= 85 && !$('wait-mode').checked)
      : stepDef.pass === 'playable' ? !!state.playable?.[song.id]?.provenAt : false;
    if (secOk && handOk && passOk) {
      const n = journeyAdvance(state, song.id);
      comboFlash(n >= jj.steps.length ? '🌟 JOURNEY COMPLETE' : `MILESTONE ${n}/${jj.steps.length} ✓`);
      jlog('journey', { id: song.id, step: n });
      renderJourney();
    }
  }
  settleGame();
  store.save(state);
  const s = engine.stats;
  $('results-title').innerHTML = `<span class="stars big">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span> ` +
    (acc >= 90 ? 'Beautiful.' : acc >= 70 ? 'Nice one.' : 'Keep at it.');
  // capability delta (council: this replaces XP as the motivator)
  const delta = prevAcc != null
    ? `<span class="${acc >= prevAcc ? 'delta-up' : 'delta-down'}">last time ${prevAcc}% → today <b>${acc}%</b></span>`
    : '';
  // 14th council: assessment leads with accuracy + ONE verdict; the arcade
  // numbers are honest fun, visually subordinate and labelled arcade.
  $('results-stats').innerHTML = `
    <span class="lead"><b>${acc}%</b>accuracy</span>
    <span class="lead verdict"><b>${verdictWord(state, song.id)}</b></span>
    <span><b>${s.wrong}</b>wrong</span>` + delta +
    `<span class="arcade">arcade: ${points} pts · x${bestCombo} combo</span>`;
  // mastery analyzers (council 08-24): how he played, not just what he hit.
  // 14th council readiness gate: these verdicts need REAL input, never issue
  // touch/pedal/articulation/voicing authority off screen taps.
  const analysis = [];
  const realInput = $('midi-status').dataset.connected === 'true';
  if (realInput && engine.pedalLog.length) {
    const pf = analyzePedal(engine.pedalLog, engine.playLog, { sections: song.sections ?? [] });
    const barOf = (b) => Math.floor(b / song.timeSig[0]) + 1;
    const pnotes = pedalNotes(pf, barOf);
    analysis.push(...(pnotes.length ? pnotes.map((t) => '🦶 Pedal: ' + t) : ['🦶 Pedal: clean. Changes landed with the harmony.']));
  }
  let art = null, voi = null;
  if (realInput) {
    art = articulationSummary(analyzeArticulation(engine.playLog, engine.msPerBeat()), song.sections ?? [], song.timeSig[0]);
    if (art) analysis.push('♪ Articulation: ' + art.text);
    voi = state.touch?.zones ? analyzeVoicing(engine.playLog, state.touch) : null;
    const vtext = voicingText(voi, song.timeSig[0]);
    if (vtext) analysis.push('⚖ Voicing: ' + vtext);
  } else {
    analysis.push('Input: screen taps, touch, pedal and voicing analysis wait for the real piano.');
  }
  // signed timing story (council 08-24): the lean, not just the error size
  const ts = timingSummary(engine.timing);
  if (ts) {
    const lean = Math.abs(ts.median) < 15 ? 'dead centre'
      : `${Math.abs(ts.median)}ms ${ts.median < 0 ? 'ahead' : 'behind'}`;
    analysis.push(`Timing: ${lean}, consistency ±${ts.spread}ms over ${ts.count} notes` +
      (state.calibratedAt ? '' : ' · run Latency calibration for honest verdicts'));
  }
  if (!ts && engine.responses.length) {
    const rs = timingSummary(engine.responses);
    analysis.push(`Response: median ${rs.median}ms after each note arrives (wait mode)`);
  }
  $('results-analysis').innerHTML = analysis.map((t) => `<li>${t}</li>`).join('');
  $('results-analysis').hidden = analysis.length === 0;
  if (analysis.length) jlog('analysis', { id: song.id, pedalEvents: engine.pedalLog.length, legatoPct: art?.legatoPct ?? null, clipped: art?.clipped ?? null, voicingAbovePct: voi?.abovePct ?? null });

  // performance report: continuity is the story, not cleanliness
  if (perf) {
    const r = perf.tracker.result();
    $('results-title').textContent = `${r.rating}`;
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
    tBtn.textContent = `${card.title}`;
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
// Screen lever, same spirit again. Added during the 2026-08-29 token port:
// half the screens only build their DOM on entry, so without this there is no
// way to verify a palette change on them without a human clicking sixteen times.
window.__show = show;
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
  // The canon drew five lesson rows; bind into them. The state word is the
  // design's own vocabulary (Complete / Ready / Locked), so it is read off the
  // sequential unlock exactly as the old renderer computed it.
  if (CANON_ON) {
    let open = true;
    const rows = LESSONS.map((les, i) => {
      const isDone = !!done[les.id];
      // a finished lesson is a PLAYABLE thing, and the row must say so;
      // rewards ride along in shape plus word (Codex: they were canon-invisible)
      const row = { title: les.title, state: isDone ? 'Complete · Replay' : open ? 'Ready' : 'Locked',
                    badge: !!state.lessonBadges?.[les.id], star: !!state.lessonStars?.[les.id],
                    locked: !open && !isDone, onOpen: open ? () => openLesson(les) : null };
      if (!isDone) open = false;
      return row;
    });
    const bound = bindLessonList(rows);
    // The redrawn 11a carries a CONTINUE HERE hero above the list: bind it to
    // the next Ready lesson (number, title, its own capability line as the
    // child-plain promise) and wire the one filled-green button. No Ready
    // lesson (course finished) stands the hero down.
    {
      const rootEl = $('screen-lessons')?.firstElementChild;
      const kick = rootEl && [...rootEl.querySelectorAll('*')]
        .find((e) => !e.children.length && e.textContent.trim() === 'CONTINUE HERE');
      const hero = kick?.closest('div[style*="border"]') ?? kick?.parentElement?.parentElement;
      if (hero) {
        const next = LESSONS.find((les) => !done[les.id]);
        if (!next) { hero.style.display = 'none'; }
        else {
          const leaves = [...hero.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim());
          // the hero's big NUMERAL is Fraunces too and sits first in the DOM;
          // picking "first Fraunces leaf" as the title wrote the title into
          // the number slot and it wrapped down the screen edge. Resolve the
          // numeral first and exclude it.
          const num = leaves.find((e) => /^\d+$/.test(e.textContent.trim()));
          const title = leaves.find((e) => e !== num && /Fraunces/.test(e.getAttribute('style') ?? ''));
          const btnLeaf = leaves.find((e) => e.textContent.trim() === 'Continue here');
          const promise = leaves.find((e) => e !== kick && e !== num && e !== title && e !== btnLeaf);
          if (num) num.textContent = String(LESSONS.indexOf(next) + 1);
          if (title) title.textContent = next.title;
          if (promise) promise.textContent = next.game?.capability ?? next.steps?.[0] ?? '';
          const btn = btnLeaf?.closest('button') ?? btnLeaf?.parentElement;
          if (btn && !btn.dataset.heroWired) {
            btn.dataset.heroWired = '1';
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', () => { const n2 = LESSONS.find((les) => !lessonsDone()[les.id]); if (n2) openLesson(n2); });
          }
        }
      }
    }
    if (bound) return;
  }
  list.innerHTML = '';
  // numbered curriculum spine (10th council): sequential states as shape+word
  let unlocked = true;
  LESSONS.forEach((les, i) => {
    const isDone = !!done[les.id];
    const card = document.createElement('button');
    card.className = 'lesson-card' + (isDone ? ' done' : '') + (unlocked ? '' : ' locked');
    card.disabled = !unlocked;
    const star = state.lessonStars?.[les.id] ? '<span class="spine-star" title="retention star: nailed in a later review">★</span>' : '';
    const badge = state.lessonBadges?.[les.id] ? '<span class="spine-badge" title="clean run: zero misses">★</span>' : '';
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
  // lesson surface never had, flares/sparks land on the keyboard top edge
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
    // not assessment, no litems recorded here)
    const items = lv.melody.flatMap((it, i) =>
      Array.isArray(it) ? it.map((m) => ({ m, h: m < 60 ? 'L' : 'R', b: i })) : [{ ...it, b: i }]);
    showLessonPrompt(items);
  } else showLessonPrompt(promptItems(lessonRunner.current));
  lessonView.targets = new Set(lv?.melody ? lessonRunner.expected() : []);
}
// game HUD (10th council): ONE level rail answering "where am I in the
// lesson?", plus a FIXED slot ledger from the authored round answering "how
// is this round going?", never the mutable retry queue, so the finish line
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
  $('lesson-video').innerHTML = `Still confused? <a href="${les.video.url}" target="_blank" rel="noopener">Watch: ${les.video.title}</a> (free, opens YouTube)`;
  $('lesson-nomidi').hidden = $('midi-status').dataset.connected === 'true';
  $('lesson-rhythm-link').hidden = les.drill.type !== 'rhythm-gate';
  $('lesson-phase').textContent = '';
  $('lesson-stave').innerHTML = '';
  lessonScore = null;
  // the tappable, labelled keyboard is part of every lesson
  if (!lessonView) lessonView = new FallsView($('lesson-keys'));
  // the artboard's still picture of the deck must not sit over the live one
  if (CANON_ON) hideRestingLayer($('lesson-keys'));
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
    // ☠️ Codex lessons round: REOPENING this lesson used to re-fire the whole
    // completion (celebration, timestamp overwrite, auto-exit) with nothing
    // played. Opening a lesson may never complete it; only a FIRST clean
    // round may.
    if (lessonsDone()[les.id]) {
      setTextKeeping($('lesson-msg'), 'Already complete. Any clean Rhythm tap round keeps it fresh.');
      $('lesson-progress').textContent = '';
    } else if (cleans > 0) { completeLesson(); }
    else {
      setTextKeeping($('lesson-msg'), 'One clean Rhythm tap round finishes this lesson.');
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
    setTextKeeping($('lesson-msg'), `This is ${demo.map((m) => noteName(m)).join(' + ')}: on the stave above, lit on the keyboard below. When it makes sense, start the drill.`);
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
  // ELI5 first-contact line (Codex): the slot ledger is five shapes and a
  // count with no explanation anywhere a touch user can reach. Say it ONCE,
  // on the very first level a brand-new learner ever runs.
  const firstEver = !Object.keys(lessonsDone()).length && !state.railExplained;
  if (firstEver) { state.railExplained = true; store.save(state); }
  setTextKeeping($('lesson-msg'), lv.melody
    ? 'The payoff: play the melody you just learned. Each next key lights up.'
    : lv.mixed ? `Mix round, names off. ${how}`
    : firstEver
      ? `${lv.name}. ${how} Get 4 first tries to pass the level. A diamond means you fixed one after a miss.`
      : `${lv.name}. ${how}`);
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
  // normalise by the element's rendered scale: under the desktop-fit zoom the
  // rect is scaled while the key layout is in layout px, and unscaled taps
  // land one key to the side
  const sc = e.currentTarget.clientWidth / r.width;
  const m = lessonView.pickKeyAt((e.clientX - r.left) * sc, (e.clientY - r.top) * sc, 4, lessonView.h - 4);
  if (m != null) lessonNote(m, true, 'tap');
});

function completeLesson() {
  const clean = !!lessonRunner && lessonRunner.misses === 0;
  // Codex lessons round: a REPLAY may not rewrite history or lie about
  // unlocking. completedAt is written once; replays record their own time.
  const done = lessonsDone();
  const wasComplete = !!done[lessonDef.id];
  if (!wasComplete) done[lessonDef.id] = Date.now(); // feeds review recency
  else (state.lessonReplays ??= {})[lessonDef.id] = Date.now();
  if (clean) (state.lessonBadges ??= {})[lessonDef.id] = true; // clean run, not a star
  // reading lessons join the ONE value currency, first completion only; the
  // dedupe key makes a replay award impossible
  if (!wasComplete) awardXp('lessonCleared', 'reading:' + lessonDef.id);
  store.save(state);
  markPracticedToday();
  const cap = lessonDef.game?.capability ?? '';
  const isLast = LESSONS[LESSONS.length - 1]?.id === lessonDef.id;
  setTextKeeping($('lesson-msg'), wasComplete
    ? `✓ Replay complete.${clean ? ' ★ Clean run!' : ''} ${cap}`
    : isLast ? `✓ Reading course complete.${clean ? ' ★ Clean run!' : ''} ${cap}`
    : `✓ Lesson complete.${clean ? ' ★ Clean run!' : ''} ${cap} Next one unlocked.`);
  comboFlash(clean ? 'CLEAN RUN ★' : wasComplete ? 'REPLAY ✓' : 'LESSON ✓');
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
    setTextKeeping($('lesson-msg'), (item?.ms
      ? `You pressed ${noteName(m)}. The phrase restarts on ${expNames}, lit below.`
      : `You pressed ${noteName(m)}. The note asked is ${expNames}, lit below.`) + whichKeyHint(m, exp));
    updateLessonHud();
    return;
  }

  // correct input
  if (res.part) { // mid-phrase progress
    setTextKeeping($('lesson-msg'), `${lessonRunner.seqIdx} / ${item.ms.length}…`);
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
    setTextKeeping($('lesson-msg'), 'So close. Same level, fresh run, nothing lost.');
    showCurrentPrompt();
    updateLessonHud();
    return;
  }
  if (lv.melody) lessonView.targets = new Set(lessonRunner.expected());
  setTextKeeping($('lesson-msg'), res.firstAttempt ? '✓ First try.' : '✓ Got there.');
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
    setTextKeeping($('lesson-msg'), 'Read it, play it.');
  } else if (item.type === 'chord') {
    reviewDrill = new TogetherDrill([item.midis], 1);
    showLessonPrompt(item.midis.map((m) => ({ m, h: m < 60 ? 'L' : 'R' })));
    setTextKeeping($('lesson-msg'), 'Play all the notes together.');
  } else {
    reviewDrill = new PhraseDrill([item.phrase], 1);
    showLessonPrompt(item.phrase.ms.map((m, i) => ({ m, h: item.phrase.h, b: i })));
    setTextKeeping($('lesson-msg'), 'Read the phrase, play it in order.');
  }
}

function startReview() {
  const candidates = buildReviewCandidates();
  if (candidates.length < 4) return;
  reviewItems = pickReviewItems(candidates, state.litems ?? {}, lessonsDone(), 6);
  reviewIdx = 0; reviewFirstTry = 0; reviewTotal = reviewItems.length;
  reviewLessonClean = {}; // lessonId -> stayed first-try this review (retention ★)
  reviewMode = true;
  lessonDef = { id: 'review', title: 'Quick review', body: 'Six things you have already learned, mixed together and weighted toward what you have missed before. First try is what counts.', drill: { type: 'review' } };
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
  // the artboard's still picture of the deck must not sit over the live one
  if (CANON_ON) hideRestingLayer($('lesson-keys'));
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
  // items came up in a later review and stayed first-try, durable mastery,
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
  setTextKeeping($('lesson-msg'), `Done: ${reviewFirstTry} of ${reviewTotal} on the first try.` +
    (starred.length ? ` ★ Retention star${starred.length > 1 ? 's' : ''} earned, see the lesson list.` : ' Misses come back next review, weighted.'));
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
  if (res.ok === false) setTextKeeping($('lesson-msg'), 'Not that one.');
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
  phase('YOUR TURN: tap it', 3);
  setTimeout(() => {
    if (active !== 'rhythm' || !rhythmRound) return;
    rhythmRecording = false;
    const res = rhythmRound.result();
    const states = rhythmRound.expected.map((e2) => (e2.hit !== null ? 'hit' : 'miss'));
    renderRhythmBlocks(pattern.beats, states);
    if (res.clean) {
      rs.cleans++;
      rs.totalCleans = (rs.totalCleans ?? 0) + 1;
      if (rs.cleans >= 3 && rs.level < 3) { rs.level++; rs.cleans = 0; comboFlash(`RHYTHM LEVEL ${rs.level}`); rhythmHud('CLEAN: level up! ▶ for the next one.'); }
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
  $('btn-train').textContent = trainer ? `Training at ${trainer.tempoPct}% (${trainer.passes}/2)` : 'Train section';
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
  // path proof lap (13th council): the prescribed section, help off, full
  // tempo, clean, this is what banks a lesson's skill in real music
  const pp = state.pathPending;
  if (pp?.type === 'proof' && pp.songId === song.id && !$('wait-mode').checked &&
      +$('tempo').value >= 100 && song.sections?.[+secIdx]?.name === pp.section &&
      ev.accuracy >= PROOF_PASS.minAcc && ev.wrong <= PROOF_PASS.maxWrong) {
    (state.pathProofs ??= {})[pp.lessonId] = { songId: pp.songId, section: pp.section, at: Date.now(), acc: ev.accuracy };
    delete state.pathPending;
    comboFlash('PROOF BANKED');
    jlog('path_proof', { lesson: pp.lessonId, song: pp.songId, acc: ev.accuracy });
    dayStat('proofsBanked');
    awardXp('proof', pp.lessonId);
    settleGame();
    store.save(state);
  }
  // journey milestones scoped to a SECTION complete on a lap (a section loop
  // never "finishes"); full-song milestones complete in finishSong
  const jj2 = journeyState(state, song.id);
  if (jj2 && jj2.step < jj2.steps.length) {
    const sd = jj2.steps[jj2.step];
    const handOk = sd.hand === 'both' ? hand === 'both' : hand === sd.hand;
    if (sd.section && sd.pass === 'finish' && handOk && song.sections?.[+secIdx]?.name === sd.section) {
      const n2 = journeyAdvance(state, song.id);
      comboFlash(`MILESTONE ${n2}/${jj2.steps.length} ✓`);
      jlog('journey', { id: song.id, step: n2 });
      store.save(state);
      renderJourney();
    }
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
  dayStat('sectionsMastered');
  awardXp('sectionMastered', song.id + '|' + name);
  settleGame();
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
  // ☠️ trap 8: the canon banner carries an inline display, which BEATS the
  // hidden attribute, so the design's sample "Performance mode" line sat on
  // every play screen. Toggle the captured inline display instead.
  { const pb = $('perf-banner');
    if (pb) {
      if (pb.dataset.designDisplay === undefined) pb.dataset.designDisplay = pb.style.display;
      pb.hidden = !locked;
      pb.style.display = locked ? pb.dataset.designDisplay : 'none';
    } }
  $('btn-perf').classList.toggle('training', locked);
}
// stand the banner down at boot: before the first performance run nothing
// else touches it, and the canon ships it visible with sample text
perfControls(false);
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
  if (!memo) { btn.textContent = 'Memorize'; btn.classList.remove('training'); return; }
  const st = MEM_STAGES[memo.rec.stage];
  btn.textContent = st.key === 'recall'
    ? `5/5 from bar ${memo.recallBar} (${memo.rec.passes}/2)`
    : `${memo.rec.stage + 1}/5 ${st.label} (${memo.rec.passes}/2)`;
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
    previewStop?.();
    stopDemo();
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
  // the follow-along engine: same song, same loop, timed mode, its own clock
  demoEngine = new Engine(song, {
    hand,
    tempo: (+$('tempo').value) / 100,
    waitMode: false,
    loop: range ? { start: range.startBeat, end: range.endBeat } : null,
    calOffsetMs: 0,
  });
  window.__demo = demoEngine; // probe lever
  falls.banner = '▶ WATCHING: the song plays itself';
  fadePlayCover();
  jlog('demo_play', { id: song.id, sec: $('section-select').value });
  previewStop = playPreview(notes, engine.msPerBeat(), (m, downState) => {
    if (downState) falls.keyDown(m); else falls.keyUp(m);
  }, () => {
    stopDemo();
  });
});
function stopDemo() {
  if (!previewActive && !demoEngine) return; // idempotent (manual stop + onDone)
  previewActive = false;
  demoEngine = null;
  $('btn-hear').textContent = '▶ Hear it';
  if (falls) { falls.banner = null; falls.pressed.clear(); }
  if (active === 'play') rebuildEngine(); // clean, armed restart, watched it, now play it
}

function syncModeButtons() {
  // under the canon the selected look is an inline style, not a CSS rule
  if (!(CANON_ON && bindSegmentByIds(['mode-falls', 'mode-score'], viewMode === 'score' ? 'mode-score' : 'mode-falls'))) {
    $('mode-falls').dataset.on = String(viewMode === 'falls');
    $('mode-score').dataset.on = String(viewMode === 'score');
  }
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
// the drawn HANDS segments (both compositions) proxy to the buttons above
if (CANON_ON) bindHandCells($('screen-play'));
// Range CONTRACTS: the canon boards drew sample ranges (tempo to 200%, met
// slider to 240 against a 200 number field). The app's contracts are the
// truth; drawn numbers are specimens (Codex parity audit, 2026-08-30).
if (CANON_ON) {
  const t = $('tempo');
  if (t) { t.min = '40'; t.max = '120'; t.step = '5'; }
  for (const id of ['met-bpm', 'met-bpm-num']) { const el = $(id); if (el) { el.min = '40'; el.max = '200'; } }
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
let fpPlayed = false;   // first-note latch for the free-play affordance
// FREE PLAY FILLS THE WINDOW, like the immersed deck (Mark: why is free play
// still really small, I want it to look like the deck). The 11h board is the
// 1418x738 REFERENCE composition; the live stage is ELASTIC: the card
// stretches to the real window and the keyboard takes everything under the
// header. Recorded deviation in CANON-GAPS.md.
function sizeFreeplayStage() {
  if (!CANON_ON) return;
  const card = $('screen-freeplay')?.firstElementChild;
  if (!card || !card.contains($('freeplay-canvas'))) return;
  const z = parseFloat(card.style.zoom || '1') || 1;
  card.style.width = Math.round(window.innerWidth / z) + 'px';
  card.style.height = Math.round(window.innerHeight / z) + 'px';
  // the board nests a fixed 1418x738 frame inside the card; stretch it too
  const frame = card.querySelector('div[style*="width:1418px"]');
  if (frame) { frame.style.width = '100%'; frame.style.height = '100%'; }
}
$('btn-freeplay').addEventListener('click', () => {
  show('freeplay');
  $('now-playing').textContent = 'Free play';
  sizeFreeplayStage();
  if (!fpView) fpView = new FallsView($('freeplay-canvas'));
  // the artboard's still picture of the deck must not sit over the live one
  if (CANON_ON) hideRestingLayer($('freeplay-canvas'));
  // The design's WHAT YOU PLAYED line ships SAMPLE chords, which read as the
  // user's own playing. Keep the kicker, clear the samples, and give the app
  // a value slot styled by the design's own sample span.
  {
    const log = $('freeplay-log');
    if (CANON_ON && log && !document.getElementById('freeplay-log-val')) {
      const kids = [...log.children];
      const kicker = kids.find((c) => /WHAT YOU PLAYED/.test(c.textContent));
      // REUSE a designed sample span as the value slot rather than creating
      // one: the runtime gate rightly flags app-made elements in the canon
      const val = kids.find((c) => c !== kicker && c.tagName === 'SPAN');
      for (const c of kids) if (c !== kicker && c !== val) c.remove();
      if (val) { val.id = 'freeplay-log-val'; val.textContent = ''; }
    }
  }
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
  // First-use affordance (Codex opinion round, #11): before the first note the
  // full-width keyboard risks reading as frozen. One quiet line, gone forever
  // after the first key. Uses the deck's own muted ink.
  if (!fpPlayed) {
    ctx.fillStyle = COLORS.passive;
    ctx.font = '400 14px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Play anything. Every note and chord you play is named, top right.', c.w / 2, Math.max(28, (c.h - c.kbH) / 2 + 18));
    ctx.textAlign = 'left';
  }
  requestAnimationFrame(drawFreeplay);
}

// ---------- calibration ----------
let calRunning = false;
function calVerdict(ms) {
  const a = Math.abs(ms);
  if (a <= 60) return 'that is a normal, healthy value';
  if (a <= 150) return 'a bit high but usable';
  return 'that looks WRONG: redo the calibration, tapping exactly when the bar lands';
}
// Voice diagnostic (council 08-24): the button shows WHAT is sounding, grand
// samples or the synth fallback, and taps toggle a forced A/B comparison.
function voiceLabel() {
  const v = voiceInfo();
  if (v.mode === 'synth') return 'Voice: Synth';
  const name = voiceModeLabel(v.mode) === 'Felt' ? 'Felt grand' : 'Grand piano';
  const status = v.loaded === 0 ? 'loading on first play' : `${v.loaded}/${v.total} loaded`;
  const fb = v.lastVoice === 'synth' && v.loaded < v.total ? ' ⚠ FALLBACK ACTIVE' : '';
  return `Voice: ${name} (${status})${fb}`;
}
function refreshVoiceBtn() { $('btn-voice').textContent = voiceLabel(); }
setVoiceMode(localStorage.getItem('keys-voice') || 'auto');
$('btn-voice').addEventListener('click', () => {
  const next = voiceModeNext(voiceInfo().mode);
  setVoiceMode(next);
  localStorage.setItem('keys-voice', next);
  refreshVoiceBtn();
  // the canon library's Voice readout binds at render time; without this the
  // drawn dock said Grand while the backend played Synth (Codex parity B4)
  if (CANON_ON && !$('screen-library').hidden) renderLibrary();
});
refreshVoiceBtn();
setInterval(refreshVoiceBtn, 4000); // status catches up after samples decode

$('btn-calibrate').addEventListener('click', () => {
  show('calibrate');
  $('now-playing').textContent = 'Latency calibration';
  const cur = state.calOffsetMs || 0;
  setRichText($('cal-status'), `Currently stored: <b>${cur}ms</b> (${calVerdict(cur)}). Tap any key each time the bar lands to redo.`);
  if (CANON_ON) {
    const sp = [...$('screen-calibrate').querySelectorAll('*')].find((e) => !e.children.length && /^spread /.test(e.textContent.trim()));
    if (sp) sp.style.visibility = 'hidden';   // a sample range must not outrank a real run
  }
  // the board's meter face carries a drawn readout chip stuck at its sample
  // 42ms; with a different stored offset that is a lie in numerals
  // (sample-bleed audit). Bind every ms readout on the face to the truth.
  if (CANON_ON) {
    for (const leaf of document.querySelectorAll('#screen-calibrate *')) {
      if (!leaf.children.length && /^\d+ms$/.test(leaf.textContent.trim())) leaf.textContent = `${cur}ms`;
    }
  }
  runCalibration();
});
$('cal-redo').addEventListener('click', () => { runCalibration(); setTextKeeping($('cal-status'), 'Fresh run: press any key when the bar hits the line…'); });
$('cal-reset').addEventListener('click', () => {
  state.calOffsetMs = 0;
  store.save(state);
  setRichText($('cal-status'), 'Offset cleared to <b>0ms</b>. Play a song; if your on-time notes score "late", calibrate again.');
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
    setRichText($('cal-status'), `Tap ${offsets.length}/8 · offset <b>${Math.round(off)}ms</b>`);
    if (offsets.length >= 8) {
      calRunning = false;
      state.calOffsetMs = medianOffset(offsets);
      // the drawn SPREAD annotation (board 11l) speaks only after a real run
      if (CANON_ON) {
        const sp = [...$('screen-calibrate').querySelectorAll('*')].find((e) => !e.children.length && /^spread /.test(e.textContent.trim()));
        if (sp) {
          const lo = Math.round(Math.min(...offsets)), hi = Math.round(Math.max(...offsets));
          sp.textContent = `spread ${lo} to ${hi}ms`;
          sp.style.visibility = 'visible';
        }
      }
      state.calibratedAt = Date.now();
      awardXp('calibrated', 'cal');
      syncInputChip();
      store.save(state);
      setRichText($('cal-status'), `Done. Median offset <b>${state.calOffsetMs}ms</b> saved (${calVerdict(state.calOffsetMs)}). Applied to all scoring.`);
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
  setTextKeeping($('touch-status'), state.touch?.date
    ? `Current calibration recorded ${state.touch.date}. Play the asked key at the asked strength to re-record.`
    : 'Play the asked key at the asked strength. Three strikes each.');
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
    setTextKeeping($('touch-status'), `That was ${noteName(m)}, but this step wants ${noteName(want)}.`);
    return;
  }
  setTextKeeping($('touch-status'), `✓ velocity ${vel}`);
  if (!res.done) { touchPrompt(); return; }
  const { cal, problems } = buildCalibration(touchDiag.samples, localDay(new Date()));
  touchDiag = null;
  if (problems.length) {
    $('touch-dyn').textContent = 'REDO';
    $('touch-key').textContent = '';
    $('touch-progress').textContent = '';
    setTextKeeping($('touch-status'), `The ${problems.map((z) => ZONES[z].name).join(' and ')} zone${problems.length === 1 ? ' did' : 's did'} not separate soft < medium < strong. Exaggerate the difference and restart.`);
    return;
  }
  state.touch = cal; // schema-versioned {v, date, zones}: the dynamics baseline
  store.save(state);
  jlog('touch_calibrated', { zones: cal.zones });
  $('touch-dyn').textContent = 'DONE';
  $('touch-key').textContent = '✓';
  $('touch-progress').textContent = '';
  setTextKeeping($('touch-status'), `Calibration saved (${cal.date}). Voicing feedback is live from your next song. Redo this if the piano or your touch drifts.`);
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
  if (btn) { btn.textContent = 'Record take'; btn.classList.remove('training'); }
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
  // the artboard's still picture of the deck must not sit over the live one
  if (CANON_ON) hideRestingLayer($('takes-canvas'));
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
    : 'No takes yet. Hit Record take on any song.';
  // the SELECTED TAKE inspector (drawn 2026-08-30) binds the newest take;
  // with none, the module stands down rather than wearing its samples
  if (CANON_ON) {
    const host = $('screen-takes');
    const kick = host && [...host.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim() === 'SELECTED TAKE');
    if (kick) {
      let mod = kick.parentElement;
      while (mod && mod.parentElement && mod.querySelectorAll('span').length < 4) mod = mod.parentElement;
      if (!mod.dataset.disp) mod.dataset.disp = mod.style.display || 'block';
      if (!takes.length) { mod.style.display = 'none'; }
      else {
        mod.style.display = mod.dataset.disp;
        const t0 = takes[0];
        const when = new Date(t0.at);
        const leaves = [...mod.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim() && e !== kick);
        const title = leaves.find((e) => /Fraunces/.test(e.getAttribute('style') ?? '')) ?? leaves[0];
        const meta = leaves.find((e) => /,/.test(e.textContent) && e !== title);
        const len = leaves.find((e) => /^\d+:\d\d$/.test(e.textContent.trim()));
        if (title) title.textContent = t0.title;
        if (meta) meta.textContent = `${localDay(when)}${t0.hasAudio ? '' : ' · no mic'}`;
        if (len) len.textContent = `${Math.floor(t0.durMs / 60000)}:${String(Math.round(t0.durMs / 1000) % 60).padStart(2, '0')}`;
      }
    }
  }
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
  // Rebuild when the options carry no value attributes too: the canon board's
  // own select claimed this id with the DRAWN loop names as values, so
  // +value||0 pinned every choice to loop 0 (same class as chunk-size).
  // Real loops in, canon styling kept.
  if (!sel.options.length || !sel.options[0].hasAttribute('value')) {
    sel.innerHTML = LOOPS.map((l2, i) => `<option value="${i}">${l2.name}</option>`).join('');
    // the options are DATA bound into a canon control, the same standing a
    // cloned designed row has, so they carry the select's own stamp
    if (sel.dataset.canonStamp !== undefined) {
      for (const o of sel.options) o.dataset.canonStamp = sel.dataset.canonStamp;
    }
  }
  improvLoop = LOOPS[+sel.value || 0];
  // the design draws the loop's chord sequence beside the live chord
  if (CANON_ON) bindImprovLoop((improvLoop.chords ?? improvLoop.bars ?? []).map((c) => c.sym ?? c.name ?? String(c)));
  improvOn = false;
  $('improv-go').textContent = '▶ Start backing';
  if (!improvView) improvView = new FallsView($('improv-canvas'));
  // the artboard's still picture of the deck must not sit over the live one
  if (CANON_ON) hideRestingLayer($('improv-canvas'));
  improvView.resize();
  drawImprov();
});
// The improv boards (11g, 2026-08-30) draw a chord TIMELINE with a current
// cell and a stack of upcoming-chord cards. Both are value surfaces: the
// timeline marker moves with the backing, the cards rotate from the live bar.
let improvUi = null;
function bindImprovNow(loop, curIdx) {
  const host = $('screen-improv');
  if (!host || host.hidden) return;
  const chordRe = /^[A-G][#b]?(maj|min|m|dim|aug|sus)?[0-9]*$/;
  const seq = (loop.chords ?? loop.bars ?? []).map((c) => c.sym ?? c.name ?? String(c));
  if (!seq.length) return;
  if (!improvUi) {
    const live = $('improv-chord');
    let strip = null;
    for (const el of host.querySelectorAll('*')) {
      const named = [...el.children].filter((c) => !c.children.length ? chordRe.test(c.textContent.trim()) : chordRe.test(c.textContent.trim()) && c.querySelector('span,i'));
      if (named.length >= 3 && !named.includes(live)) { strip = el; break; }
    }
    const cells = strip ? [...strip.children].filter((c) => chordRe.test(c.textContent.trim())) : [];
    const on = cells[0]?.getAttribute('style');
    const off = cells[1]?.getAttribute('style');
    const cards = [...host.querySelectorAll('*')].filter((e) => !e.children.length
      && chordRe.test(e.textContent.trim()) && /Fraunces/.test(e.getAttribute('style') ?? '')
      && (!strip || !strip.contains(e)));
    improvUi = { cells, on, off, cards };
  }
  improvUi.cells.forEach((cell, i) => {
    const idx = i % seq.length;
    const leaf = [...cell.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim()) ?? cell;
    if (chordRe.test(leaf.textContent.trim()) || leaf === cell) leaf.textContent = seq[idx] ?? '';
    if (improvUi.on && improvUi.off) cell.setAttribute('style', idx === (curIdx % seq.length) ? improvUi.on : improvUi.off);
  });
  improvUi.cards.forEach((card, i) => {
    card.textContent = seq[(curIdx + i) % seq.length];
  });
}
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
  if (CANON_ON) bindImprovNow(improvLoop, cur.bar ?? 0);
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
  for (const mode of ['major', 'minor', 'majarp', 'minarp']) {
    const grid = $(`keys12-${mode}`);
    // The canon already drew all twelve keys, each button tagged data-k. Set
    // their state in place; rebuilding threw away twelve designed buttons to
    // draw twelve plainer ones.
    const entries = LADDER.filter((l2) => l2.mode === mode).map((entry) => ({
      key: entry.key,
      done: ladderPassed(entry.id),
      onOpen: () => { startSong(SONGS.find((s2) => s2.id === entry.id)); startTraining(0); },
    }));
    if (CANON_ON && bindKeys12(mode, entries)) { bindKeys12Count(mode, entries); continue; }
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
// Form check as an ON-DEMAND tool (demoted from the auto card, Mark
// 2026-08-30): the drawer row summons the library's form module once
$('btn-form')?.addEventListener('click', () => {
  state.formOnDemand = true;
  store.save(state);
  show('library');
  renderLibrary();
});

// ---------- practice minutes + chart ----------
function logPracticeMinutes(mins) {
  if (!(mins > 0)) return;
  const key = localDay(new Date());
  (state.pmin ??= {})[key] = +(((state.pmin ?? {})[key] ?? 0) + mins).toFixed(2);
  dayStat('minutes', mins);
  settleGame();
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

// ---------- trophies: the evidence cabinet ----------
const NOTE_DATE = (t) => new Date(t).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
function renderTrophies() {
  const list = badges(state, SONGS);
  // The canon drew these rows; bind into them rather than over them. Falls
  // through to the app's own markup when the flag is off.
  const trophyRows = list.map((b) => {
    const ev = b.evidence ?? {};
    const evText = b.id.startsWith('playable:') || b.id === 'first-playable'
      ? `proven ${NOTE_DATE(ev.at)}`
      : b.id === 'first-proof' ? `${ev.songId ?? ''} ${ev.acc ?? ''}%`
      : b.id === 'calibrated' ? `${NOTE_DATE(ev.at)}`
      : b.id === 'rhythm7' ? `best run ${ev.best} days`
      : b.arcade ? `best streak ${ev.bestCombo} notes` : 'not yet';
    return { word: b.word, evidence: evText };
  });
  const xpRows = [...(state.xpLog ?? [])].reverse().slice(0, 20)
    .map((e) => ({ label: `${e.src} ${e.ref}`.trim(), xp: `+${e.xp}` }));
  if (!(CANON_ON && bindTrophyList(trophyRows) && bindXpLog(xpRows))) {
  $('trophy-list').innerHTML = list.length ? list.map((b) => {
    const ev = b.evidence ?? {};
    const evText = b.id.startsWith('playable:') || b.id === 'first-playable'
      ? `proven ${NOTE_DATE(ev.at)} · two clean days, no waiting, full tempo`
      : b.id === 'first-proof' ? `${ev.songId ?? ''} · ${ev.section ?? ''} · ${ev.acc ?? ''}% · ${ev.at ? NOTE_DATE(ev.at) : ''}`
      : b.id === 'calibrated' ? `${NOTE_DATE(ev.at)} · median offset ${ev.offsetMs}ms`
      : b.id === 'rhythm7' ? `best run ${ev.best} days`
      : b.arcade ? `best streak ${ev.bestCombo} notes` : '';
    return `<div class="trophy ${b.arcade ? 'arcade-badge' : ''}">
      <span class="t-shape">${b.shape}</span>
      <span class="t-word">${b.word}${b.arcade ? ' <i class="t-arc">ARCADE</i>' : ''}</span>
      <span class="t-ev">${evText}</span>
    </div>`;
  }).join('') : '<p class="hint">Nothing yet, the first proof, the first playable song and the calibration all land here, each with its evidence.</p>';
  const log = [...(state.xpLog ?? [])].reverse().slice(0, 20);
  $('xp-log').innerHTML = log.length
    ? log.map((e) => `<div class="xp-row"><b>+${e.xp}</b> ${e.src} <span class="t-ev">${e.ref} · ${NOTE_DATE(e.t)}</span></div>`).join('')
    : '<p class="hint">No XP yet. It only comes from things that matter: proofs, playable songs, mastered sections, the quests you choose.</p>';
  }
}
$('btn-trophies').addEventListener('click', () => {
  show('trophies');
  $('now-playing').textContent = 'Trophies';
  renderTrophies();
});

// ---------- song journey strip (goal gradient; pilot: See You Again Easy) ----
function renderJourney() {
  const strip = $('journey-strip');
  const jj = song && journeyState(state, song.id);
  if (!jj) { strip.hidden = true; return; }
  strip.hidden = false;
  strip.innerHTML = jj.steps.map((s2, i) => `
    <span class="j-step ${i < jj.step ? 'done' : i === jj.step ? 'now' : ''}">
      <i>${i < jj.step ? '✓' : i === jj.step ? '▶' : '○'}</i>${s2.name}
    </span>`).join('<span class="j-link"></span>') +
    (jj.step < jj.steps.length ? `<button id="j-go" class="tool">▶ ${jj.steps[jj.step].name}</button>` : '<span class="j-done">🌟 Journey complete</span>');
  $('j-go')?.addEventListener('click', () => {
    const stepDef = jj.steps[jj.step];
    const secIdx = stepDef.section ? (song.sections ?? []).findIndex((x) => x.name === stepDef.section) : -1;
    $('section-select').value = secIdx >= 0 ? String(secIdx) : '';
    $('wait-mode').checked = stepDef.wait;
    hand = stepDef.hand === 'both' ? 'both' : stepDef.hand;
    document.querySelectorAll('.hand-btn').forEach((x) => (x.dataset.on = String(x.dataset.hand === hand)));
    if (CANON_ON) syncHandCells();
    jlog('journey_step_start', { id: song.id, step: jj.step });
    rebuildEngine();
  });
}

// ---------- first run: hardware-aware, one-tap skippable ----------
function maybeFirstRun() {
  const fresh = !(state.days?.length) && !state.lastSession && !state.diagnosticDone;
  if (!fresh || state.firstRunDone) return;
  $('firstrun').hidden = false;
  jlog('firstrun_shown', {});
  const close = (how) => {
    $('firstrun').hidden = true;
    state.firstRunDone = how;
    store.save(state);
    jlog('firstrun_done', { how });
    if (how !== 'skip') $('btn-path').click(); // the diagnostic IS the audition
  };
  window.__firstRunNote = () => { window.__firstRunNote = null; close('midi'); };
  $('firstrun-taps').onclick = () => close('taps');
  $('firstrun-skip').onclick = () => close('skip');
}

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
    // parseFloat: the canon select's values are the drawn words ("3/4", "6/8"),
    // and +"3/4" is NaN, which killed the accent (same class as chunk-size)
    const perBar = parseFloat($('met-sig').value) || 4;
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
      setTimeout(() => { if (metTicker) paintMetBeat(idx, perBar); }, Math.max(0, at));
      metNextBeat += spb;
      metBeatIdx++;
    }
  };
  tick();
  metTicker = setInterval(tick, 100);
  $('met-toggle').textContent = '■ Stop';
}
// The drawn CONDUCTOR (board 11i, 2026-08-30): a pulse ring with the beat
// number and one dot per beat. Binding, never wiping: textContent on
// #met-beat used to erase the whole drawn module with dot characters.
let metDotTpl = null;
function paintMetBeat(idx, perBar) {
  const host = $('met-beat');
  const num = CANON_ON && [...host.querySelectorAll('*')]
    .find((e) => !e.children.length && /Fraunces/.test(e.getAttribute('style') ?? '') && /^\d+$/.test(e.textContent.trim()) && parseFloat(e.getAttribute('style').match(/font:[^;]*?(\d+)px/)?.[1] ?? 0) > 40);
  if (!num) { host.textContent = '● '.repeat(idx + 1) + '○ '.repeat(Math.max(0, perBar - idx - 1)); return; }
  num.textContent = String(idx + 1);
  const line = [...host.querySelectorAll('*')].find((e) => !e.children.length && /^beat \d+$/.test(e.textContent.trim()));
  if (line) line.textContent = `beat ${idx + 1}`;
  // the dot cells: i shape + numbered span; dealt to the real beats per bar,
  // the CURRENT beat wears the drawn filled look
  // dot labels are the SMALL numerals; the ring's 86px numeral must not match
  const numbered = [...host.querySelectorAll('span')].filter((e) => !e.children.length && /^\d$/.test(e.textContent.trim())
    && parseFloat((e.getAttribute('style') ?? '').match(/font:[^;]*?(\d+(?:\.\d+)?)px/)?.[1] ?? 99) <= 14 && e !== num);
  const cells = [...new Set(numbered.map((e) => e.parentElement))].filter((c) => c.querySelector('i') && !c.contains(num));
  if (!cells.length) return;
  if (!metDotTpl) {
    const on = cells.map((c) => c.querySelector('i')).find((i2) => (i2.getAttribute('style') ?? '').includes('background'));
    const off = cells.map((c) => c.querySelector('i')).find((i2) => !(i2.getAttribute('style') ?? '').includes('background'));
    metDotTpl = { cell: cells[0].cloneNode(true), on: on?.getAttribute('style'), off: off?.getAttribute('style'), row: cells[0].parentElement };
  }
  const row = metDotTpl.row;
  while (row.children.length < perBar) row.appendChild(metDotTpl.cell.cloneNode(true));
  while (row.children.length > perBar) row.lastElementChild.remove();
  [...row.children].forEach((c, i2) => {
    const dot = c.querySelector('i');
    const lab = c.querySelector('span');
    if (lab) lab.textContent = String(i2 + 1);
    if (dot && metDotTpl.on && metDotTpl.off) dot.setAttribute('style', i2 === idx ? metDotTpl.on : metDotTpl.off);
  });
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
  // the artboard's still picture of the deck must not sit over the live one
  if (CANON_ON) hideRestingLayer($('echo-canvas'));
  echoView.resize();
  // full session reset: stale rounds must not leak across exits (audit #10)
  echoStreak = 0; echoClean = 0;
  echoRound = null; echoPhrase = null; echoAwaiting = false;
  setEchoPhase(null);
  clearTimeout(echoSingTimer);
  syncEchoModes();
  updateEchoHud('Press ▶ to hear the first phrase.');
  drawEcho();
});

// the drawn LISTENING / YOUR TURN phase labels (board 11e): the adoption
// stood them down as decor; the round brings the honest one back
function setEchoPhase(phase) {
  if (!CANON_ON) return;
  const scr = $('screen-echo');
  for (const [word, on] of [['LISTENING', phase === 'listen'], ['YOUR TURN', phase === 'reply']]) {
    const l = scr && [...scr.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim() === word && !e.closest('[data-legacy-screen]'));
    if (!l) continue;
    let mod = l.parentElement ?? l;
    if (!mod.dataset.disp) mod.dataset.disp = mod.style.display || 'block';
    mod.style.display = on ? mod.dataset.disp : 'none';
  }
}
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
  if (!(CANON_ON && bindSegmentByIds(['echo-mode-echo', 'echo-mode-sing', 'echo-mode-trans'], 'echo-mode-' + echoMode))) {
    $('echo-mode-echo').dataset.on = String(echoMode === 'echo');
    $('echo-mode-sing').dataset.on = String(echoMode === 'sing');
    $('echo-mode-trans').dataset.on = String(echoMode === 'trans');
  }
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
  setEchoPhase('listen');
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
      setEchoPhase('reply');
        setEchoPhase('reply');
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
    updateEchoHud('Not quite, the phrase restarts. Hear it again if you need.');
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
      comboFlash(`LEVEL UP: ${es.level} NOTES`);
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
  if (down && !$('firstrun').hidden) { window.__firstRunNote?.(); return; }
  if (cardTask) { theoryNote(m, down); return; }
  if (active === 'task') { if (down) pathUI.noteOn(m); else pathUI.noteOff(m); return; }
  if (active === 'lesson') { lessonNote(m, down); return; }
  if (active === 'rhythm') { if (down) rhythmNote(); return; }
  if (active === 'touch') { if (down) touchNote(m, vel); return; }
  if (active === 'play' && engine) {
    if (armed && down) { startArmCountIn(); return; }
    if (down) fadePlayCover(); // wait mode: the first press cedes the light too
    // tap-sound law: screen taps hear the grand; the P-45 speaks for itself
    if (down && tapSoundActive(state.soundMode, $('midi-status').dataset.connected === 'true')) {
      playPreview([{ b: 0, d: 1.2, m, h: falls?.handMap?.get(m) ?? 'R', v: vel != null ? vel / 127 : 0.8 }], 350, null, null);
    }
    if (takeRec) takeRec.events.push({ t: performance.now() - takeRec.t0, m, vel, down, h: falls?.handMap?.get(m) ?? 'R' });
    if (down) { falls.keyDown(m); engine.noteOn(m, vel); } else { falls.keyUp(m); engine.noteOff(m); }
  } else if (active === 'freeplay' && fpView) {
    if (down) {
      fpView.keyDown(m);
      fpPlayed = true;
      const log = $('freeplay-log-val') ?? $('freeplay-log');
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
window.addEventListener('resize', () => {
  falls?.resize(); fpView?.resize(); echoView?.resize(); window.__refitPlay?.();
  // the elastic library re-plans only when a WHOLE row of capacity changes
  if (CANON_ON && !$('screen-library').hidden) {
    const cap = libCapacity();
    if (cap !== lastLibCap) { lastLibCap = cap; renderLibrary(); }
    else applyLibraryAtmosphere();
  }
});
// the drawn tier picker's data hooks (canon-play): which tiers exist for the
// open song's group, which is current, and the door to another one
window.__tierInfo = () => {
  if (!song) return null;
  const vars = SONGS.filter((x) => x.group === song.group);
  return { have: vars.map((x) => x.level), current: song.level };
};
window.__openTier = (level) => {
  if (!song) return;
  const target = SONGS.find((x) => x.group === song.group && x.level === level);
  if (target && target.id !== song.id) startSong(target);
};
document.addEventListener('visibilitychange', () => { lastT = 0; });
// Teacher Loop v1 (11th council): the path owns the "what next" question
const pathUI = installPath({
  $, show, state, store, FallsView, playPreview, stopPreview, comboFlash,
  markPracticedToday, jlog, lessonKeyRange, COLORS, renderLibrary,
  SONGS, songStats, launchSong: launchSongFragment, runPrescription, awardXp,
});
window.__path = pathUI; // debug lever, same spirit as __engine / __lesson

midi.connect();
renderLibrary();
pathUI.renderTeaser();
show('library');
syncInputChip();
syncSoundBtn();
maybeFirstRun();
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js');
}

// Crossing the desktop frame's width swaps the whole composition, so the
// library has to re-render. Debounced, because a drag across the boundary fires
// resize continuously and each render remounts the canon.
{
  let composed = canonLibraryScreen();
  const bootDesktop = desktopFits();
  let t = 0;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const next = canonLibraryScreen();
      if (next !== composed) {
        composed = next;
        if (active === 'library') renderLibrary();
      }
      // the utility boards were composed at boot; crossing the desktop
      // threshold mid-session re-boots the shell ONCE, only while idling on
      // the library, so every screen re-mounts in the right composition
      if (CANON_ON && desktopFits() !== bootDesktop && active === 'library') {
        location.reload();
        return;
      }
      // otherwise keep the active card fit-scaled, and the free-play stage
      // elastic
      const card = $('screen-' + active)?.firstElementChild;
      if (CANON_ON && card && card.clientWidth >= 1400) applyCanonZoom(card);
      if (active === 'freeplay') { sizeFreeplayStage(); fpView?.resize(); }
    }, 150);
  });
}
