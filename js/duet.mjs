// DUET: the score and the falling notes on one screen, driven by one engine.
// Local prototype (duet.html), not wired into the shell or the service worker.
//
// The idea is a reading ladder per song. The bars teach you the notes; the
// score sits above them on the same clock, the current notehead lit in the
// same hand colour as the bar that is about to land. Each rung moves weight
// from the bars to the page, and a rung only opens once you have played the
// song cleanly on the one below, so reading never runs ahead of your hands.
import { SHELF } from './songs.mjs';
import { Engine } from './engine.mjs';
import { FallsView } from './falls.mjs';
import { ScoreView } from './score.mjs';
import { MidiInput } from './midi.mjs';
import { playPreview, stopPreview } from './audio.mjs';
import { notationModel } from './notation.mjs';

const $ = (id) => document.getElementById(id);
const LEVELS = {
  1: { scoreOpacity: 0.8, lookahead: 4, letters: true },
  2: { scoreOpacity: 1, lookahead: 4, letters: false },
  3: { scoreOpacity: 1, lookahead: 1.25, letters: false },
  4: { scoreOpacity: 1, lookahead: 0.02, letters: false },
};
const CLEAN = 0.9; // accuracy that opens the next rung

const store = {
  load() { try { return JSON.parse(localStorage.getItem('keys-duet') || '{}'); } catch { return {}; } },
  save(s) { try { localStorage.setItem('keys-duet', JSON.stringify(s)); } catch { /* private mode */ } },
};
const saved = store.load();
saved.songs ??= {};

let song = null, engine = null, demo = false, level = 1, last = 0;
const falls = new FallsView($('falls'));
const score = new ScoreView($('score'));
const playhead = document.createElement('div');
playhead.className = 'duet-playhead';

// highest rung cleared anywhere: a new song starts one below it, never above
const readingLevel = () => Math.max(1, ...Object.values(saved.songs).map((s) => s.cleared ?? 0));
const unlocked = (id) => Math.min(4, (saved.songs[id]?.cleared ?? Math.max(0, readingLevel() - 1)) + 1);

function fillPicker() {
  const sel = $('song');
  // only songs that engrave: a pitch guide cannot teach reading
  const easy = SHELF.filter((s) => s.notes?.length && s.timeSig && !s.noTimeSig && !notationModel(s).reason)
    .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
  for (const s of easy) {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.level ? `${s.title} · ${s.level}` : s.title;
    sel.append(o);
  }
  sel.value = saved.last && easy.some((s) => s.id === saved.last) ? saved.last : easy[0]?.id;
  sel.addEventListener('change', () => load(sel.value));
}

function load(id) {
  song = SHELF.find((s) => s.id === id);
  saved.last = id; store.save(saved);
  level = Math.min(saved.songs[id]?.level ?? unlocked(id), unlocked(id));
  falls.handMap = new Map(song.notes.map((n) => [n.m, n.h]));
  // zoom the keyboard to the song so the bars are wide enough to read under the page
  const ms = song.notes.map((n) => n.m);
  falls.setRange(Math.max(21, Math.min(...ms) - 4), Math.min(108, Math.max(...ms) + 4));
  rebuild();
}

function rebuild() {
  stopPreview(); demo = false; $('hear').textContent = '▶ Hear it';
  engine = new Engine(song, { waitMode: $('wait').checked, tempo: $('tempo').value / 100, repeat: false });
  score.build(song, engine);
  $('score').append(playhead);
  applyLevel();
  falls.resize();
}

function applyLevel() {
  const cfg = LEVELS[level];
  $('score').style.opacity = cfg.scoreOpacity;
  falls.lookaheadBeats = cfg.lookahead;
  falls.cueLetters = cfg.letters;
  const open = unlocked(song.id);
  for (const b of document.querySelectorAll('.ladder button')) {
    const n = Number(b.dataset.level);
    b.setAttribute('aria-pressed', String(n === level));
    b.disabled = n > open;
    b.style.opacity = n > open ? 0.4 : 1;
    b.title = n > open ? `Opens after a clean run (${CLEAN * 100}%+) on rung ${n - 1}` : b.title.replace(/^Opens.*$/, '');
  }
  saved.songs[song.id] = { ...saved.songs[song.id], level };
  store.save(saved);
}

function press(m, isDown) {
  if (!engine) return;
  if (isDown) { falls.keyDown(m); engine.noteOn(m); } else { falls.keyUp(m); engine.noteOff(m); }
}
FallsView.onKeyDefault = press; // screen taps go through the same path as the piano
falls.onKey = press;

function placePlayhead() {
  const el = $('score').querySelector('[data-state="current"]');
  if (!el) { playhead.hidden = true; return; }
  const box = $('score').getBoundingClientRect(), r = el.getBoundingClientRect();
  playhead.hidden = false;
  playhead.style.left = `${r.left - box.left + $('score').scrollLeft + r.width / 2 - 1}px`;
}

function finish() {
  // right notes over everything asked and every wrong press. Not accuracy():
  // wait mode grades every press "good", so a flawless run there reads 80%.
  const s = engine.stats, hit = s.perfect + s.good + s.late;
  const acc = hit / Math.max(1, hit + s.missed + s.wrong);
  const rec = saved.songs[song.id] ?? {};
  let tip = `Run finished at ${Math.round(acc * 100)}%.`;
  if (!demo && acc >= CLEAN && level > (rec.cleared ?? 0)) {
    rec.cleared = level;
    tip += level < 4 ? ` Rung ${level + 1} is open: the score takes more of the lead.` : ' You read the whole song. That is the goal.';
  } else if (!demo && acc < CLEAN) tip += ` ${Math.round(CLEAN * 100)}% opens the next rung.`;
  saved.songs[song.id] = rec; store.save(saved);
  applyLevel();
  status(tip);
}

function status(tip = '') {
  const s = engine?.stats ?? {};
  $('status').innerHTML = `<span>Rung <b>${level}</b> of 4</span><span>Reading level <b>${readingLevel()}</b></span>`
    + `<span>Clean <b>${(s.perfect ?? 0) + (s.good ?? 0)}</b></span><span>Wrong <b>${s.wrong ?? 0}</b></span>`
    + (tip ? `<span class="duet-tip">${tip}</span>` : '');
}

function frame(now) {
  const dt = last ? Math.min(100, now - last) : 0;
  last = now;
  if (engine && !engine.finished) {
    if (demo) { const g = engine.currentGroup(); if (g && engine.waiting) for (const n of g.notes) engine.noteOn(n.m); }
    engine.tick(dt);
    engine.drainEvents().forEach((ev) => { if (ev.type === 'perfect' || ev.type === 'good') falls.burst(ev.midi, ev.type); });
    score.update(engine, 'both');
    placePlayhead();
    if (engine.finished) finish();
  }
  if (engine) falls.draw(engine);
  requestAnimationFrame(frame);
}

for (const b of document.querySelectorAll('.ladder button')) {
  b.addEventListener('click', () => { level = Number(b.dataset.level); applyLevel(); status(); });
}
$('wait').addEventListener('change', rebuild);
$('tempo').addEventListener('input', () => { $('tempo-val').textContent = `${$('tempo').value}%`; });
$('tempo').addEventListener('change', rebuild);
$('restart').addEventListener('click', () => { rebuild(); status(); });
$('hear').addEventListener('click', () => {
  if (demo) { rebuild(); return; }
  rebuild();
  demo = true; $('hear').textContent = '■ Stop';
  playPreview(song.notes, engine.msPerBeat(), (m, down) => (down ? falls.keyDown(m) : falls.keyUp(m)), () => {});
});
const midi = new MidiInput();
midi.onNote = (m, _v, isDown) => press(m, isDown);
midi.onStatus = (text) => status(text);
$('midi').addEventListener('click', () => midi.connect());
addEventListener('resize', () => falls.resize());

fillPicker();
load($('song').value);
status('Play along on your piano, or tap the keys. The lit notehead is the bar about to land.');
requestAnimationFrame(frame);
window.__duet = { get engine() { return engine; }, get song() { return song; }, press };
