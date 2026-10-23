// DUET: the score and the falling notes on one screen, driven by one engine.
//
// One rule, three behaviours:
// 1. HELP MOVES ITSELF. There is no ladder to pick from. Help is a number per
//    song, 0 (read the page) to 1 (the bars do the work). A clean run takes a
//    step off, a rough run puts one back. The only control is More / Less help.
// 2. ONE PLAY LINE. The score is one continuous strip that glides under a fixed
//    line, on the same clock as the falls. When a note is due, a thin thread
//    joins its notehead to its key, so the dot on the page and the key under
//    your finger are visibly the same thing.
// 3. HELP FADES, VIEWS NEVER SWAP. Letters go first, then the bars shorten,
//    then they are gone. If you hesitate on a note the bars come back for it,
//    and leave again once you have played it.
import { SHELF } from './songs.mjs';
import { Engine } from './engine.mjs';
import { FallsView } from './falls.mjs';
import { EngravedScore } from './engraving.mjs';
import { MidiInput } from './midi.mjs';
import { playPreview, stopPreview } from './audio.mjs';
import { notationModel } from './notation.mjs';

const $ = (id) => document.getElementById(id);
const STEP = 0.25;      // one step of help
const CLEAN = 0.9;      // right-note share that takes a step off
const ROUGH = 0.7;      // below this a step goes back on
const HESITATE_MS = 2200;
const HAND = { R: '#efce81', L: '#67e8f9' }; // the falls' own amber and cyan

const store = {
  load() { try { return JSON.parse(localStorage.getItem('keys-duet') || '{}'); } catch { return {}; } },
  save(s) { try { localStorage.setItem('keys-duet', JSON.stringify(s)); } catch { /* private mode */ } },
};
const saved = store.load();
saved.songs ??= {};

let song = null, engine = null, demo = false, help = 1, last = 0;
let beatX = [];          // [{beat, x}] noteheads along the strip, sorted
let threads = [];        // {m, hand, from:{x,y}, born}
let lastGroup = null;
let engraved = null;
let demoHeld = [];      // notes the demo pressed last frame
let boostUntil = -1;    // beat until which a miss keeps the bars back    // id of the song the strip was drawn for
const falls = new FallsView($('falls'));
const score = new EngravedScore($('score-strip'));
score.windowBars = Infinity; // one strip, so it can glide instead of turning pages
const link = $('link'), lctx = link.getContext('2d');

// a new song starts at the help you have earned elsewhere, a step more cautious
const earnedHelp = () => {
  const vals = Object.values(saved.songs).map((s) => s.help).filter((h) => h != null);
  return vals.length ? Math.min(1, Math.min(...vals) + STEP) : 1;
};
const engraves = (s) => s.notes?.length && s.timeSig && !s.noTimeSig && !notationModel(s).reason;

function fillPicker() {
  const sel = $('song');
  const list = SHELF.filter(engraves).sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
  for (const s of list) {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.level ? `${s.title} · ${s.level}` : s.title;
    sel.append(o);
  }
  const asked = new URLSearchParams(location.search).get('song');
  const pick = [asked, saved.last].find((id) => id && list.some((s) => s.id === id));
  sel.value = pick ?? list[0]?.id;
  sel.addEventListener('change', () => load(sel.value));
}

function load(id) {
  song = SHELF.find((s) => s.id === id);
  saved.last = id; store.save(saved);
  help = saved.songs[id]?.help ?? earnedHelp();
  falls.handMap = new Map(song.notes.map((n) => [n.m, n.h]));
  const ms = song.notes.map((n) => n.m);
  falls.setRange(Math.max(21, Math.min(...ms) - 4), Math.min(108, Math.max(...ms) + 4));
  rebuild();
}

function rebuild() {
  stopPreview(); demo = false; demoHeld = []; boostUntil = -1; $('hear').textContent = 'Hear it';
  engine = new Engine(song, { waitMode: $('wait').checked, tempo: $('tempo').value / 100, repeat: false });
  // engraving a long song is the slow part (about 2s for 3000 notes), and only
  // the song changes it: tempo, wait mode and restart reuse the strip
  if (engraved !== song.id) { score.build(song, engine); measureStrip(); engraved = song.id; }
  else for (const els of score.noteEls.values()) for (const el of els) if (el) delete el.dataset.state;
  threads = []; lastGroup = null;
  applyHelp(help);
  sizeLink();
  falls.resize();
  status();
}

// x of every notehead in strip coordinates, so any beat maps to a position
function measureStrip() {
  const strip = $('score-strip'), seen = new Map();
  const sheet = strip.firstElementChild;
  if (sheet) sheet.style.transform = 'none';
  const box = strip.getBoundingClientRect();
  for (const el of strip.querySelectorAll('[data-beat]')) {
    const b = Number(el.dataset.beat), r = el.getBoundingClientRect();
    if (!r.width || seen.has(b)) continue;
    seen.set(b, r.left - box.left + r.width / 2);
  }
  beatX = [...seen].map(([beat, x]) => ({ beat, x })).sort((a, b) => a.beat - b.beat);
}
function xForBeat(beat) {
  if (!beatX.length) return 0;
  if (beat <= beatX[0].beat) return beatX[0].x;
  for (let i = 1; i < beatX.length; i++) {
    const a = beatX[i - 1], b = beatX[i];
    if (beat <= b.beat) return a.x + (b.x - a.x) * ((beat - a.beat) / (b.beat - a.beat));
  }
  return beatX.at(-1).x;
}

// help 1: letters, four beats of bars. help 0: no bars, no letters.
function applyHelp(h, transient = false) {
  falls.cueLetters = h > 0.6;
  falls.lookaheadBeats = h <= 0 ? 0.02 : 0.75 + h * 3.25;
  if (transient) return;
  help = h;
  saved.songs[song.id] = { ...saved.songs[song.id], help };
  store.save(saved);
  const pips = $('help-pips');
  pips.replaceChildren(...[0, 1, 2, 3, 4].map((i) => {
    const p = document.createElement('i');
    p.dataset.on = String(i <= Math.round(help / STEP));
    return p;
  }));
  $('help-label').textContent = help >= 1 ? 'Bars lead' : help > 0.6 ? 'Letters fading' : help > 0.3 ? 'Score leads' : help > 0 ? 'Bars as a check' : 'Reading';
  $('less').disabled = help <= 0;
  $('more').disabled = help >= 1;
}

function press(m, isDown) {
  if (!engine) return;
  if (isDown) { falls.keyDown(m); engine.noteOn(m); } else { falls.keyUp(m); engine.noteOff(m); }
}
FallsView.onKeyDefault = press; // screen taps go through the same path as the piano
falls.onKey = press;

function sizeLink() {
  const r = link.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  link.width = Math.round(r.width * dpr); link.height = Math.round(r.height * dpr);
  lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// a thread from each due notehead to its key, drawn once per new group
function spawnThreads(g) {
  const strip = $('score-strip');
  for (const n of g.notes) {
    const el = score.noteEls.get(n)?.[0];
    if (!el) continue;
    const head = el.querySelector('.vf-notehead') ?? el, r = head.getBoundingClientRect();
    if (r.right < strip.getBoundingClientRect().left) continue;
    threads.push({ m: n.m, hand: n.h, head, born: performance.now() }); // re-read each frame: the strip glides
  }
}
function drawThreads(now) {
  const stage = link.getBoundingClientRect(), fr = $('falls').getBoundingClientRect();
  lctx.clearRect(0, 0, stage.width, stage.height);
  const kbY = fr.bottom - stage.top - (falls.kbH ?? 100);
  threads = threads.filter((t) => now - t.born < 900);
  for (const t of threads) {
    const k = falls.keyX?.get(t.m), hr = t.head.getBoundingClientRect();
    if (!k || !hr.width) continue;
    const x = hr.left - stage.left + hr.width / 2, y = hr.bottom - stage.top;
    const kx = fr.left - stage.left + (k.x + k.w / 2) * (fr.width / falls.w);
    const life = (now - t.born) / 900, a = life < 0.15 ? life / 0.15 : 1 - (life - 0.15) / 0.85;
    lctx.globalAlpha = Math.max(0, a) * 0.85;
    lctx.strokeStyle = HAND[t.hand] ?? HAND.R;
    lctx.lineWidth = 1.5;
    lctx.beginPath();
    lctx.moveTo(x, y);
    lctx.bezierCurveTo(x, y + 60, kx, kbY - 80, kx, kbY);
    lctx.stroke();
  }
  lctx.globalAlpha = 1;
}

function finish() {
  const s = engine.stats, hit = s.perfect + s.good + s.late;
  const share = hit / Math.max(1, hit + s.missed + s.wrong);
  let tip = `${Math.round(share * 100)}% right notes.`;
  if (!demo) {
    if (share >= CLEAN && help > 0) { applyHelp(Math.max(0, help - STEP)); tip += ' Clean. A little less help next time.'; }
    else if (share >= CLEAN) tip += ' Read from the page, start to finish.';
    else if (share < ROUGH && help < 1) { applyHelp(Math.min(1, help + STEP)); tip += ' A little more help next time.'; }
  }
  if (demo) { demo = false; $('hear').textContent = 'Hear it'; tip = 'That is how it goes. Your turn.'; }
  status(tip);
}

function status(tip = '') {
  const s = engine?.stats ?? {};
  $('status').textContent = tip || `${(s.perfect ?? 0) + (s.good ?? 0) + (s.late ?? 0)} right · ${s.wrong ?? 0} wrong`;
}

function frame(now) {
  const dt = last ? Math.min(100, now - last) : 0;
  last = now;
  if (engine && !engine.finished) {
    const g = engine.currentGroup();
    // the demo plays each group as it falls due, in wait mode and timed mode
    // alike, and lets go a frame later so every press has its release
    for (const m of demoHeld) engine.noteOff(m);
    demoHeld = [];
    if (demo && g && engine.beat >= g.beat - 0.02) for (const n of g.notes) { engine.noteOn(n.m); demoHeld.push(n.m); }
    // hesitation brings the bars back for this note only: stuck in wait mode,
    // or (timed mode, where nothing waits) a note just missed
    const stuck = (engine.waiting && engine._waitStartMs != null && engine.timeMs - engine._waitStartMs > HESITATE_MS)
      || engine.beat < boostUntil;
    applyHelp(stuck ? Math.max(help, 0.75) : help, true);
    engine.tick(dt);
    engine.drainEvents().forEach((ev) => {
      if (ev.type === 'perfect' || ev.type === 'good') falls.burst(ev.midi, ev.type);
      if (ev.type === 'missed' && !demo) boostUntil = engine.beat + 2;
    });
    score.update(engine, 'both');
    const cur = engine.currentGroup();
    if (cur && cur !== lastGroup) { lastGroup = cur; spawnThreads(cur); }
    if (engine.finished) finish();
  }
  if (engine) {
    // glide: the current beat sits on the play line, every frame
    // translate rather than scroll: a scroll cannot go below zero, so the first
    // notes of a song would sit left of the line, and a transform composites
    const strip = $('score-strip'), sheet = strip.firstElementChild;
    if (sheet) sheet.style.transform = `translate3d(${(strip.clientWidth * 0.28 - xForBeat(engine.beat)).toFixed(1)}px,0,0)`;
    falls.draw(engine);
    drawThreads(now);
  }
  requestAnimationFrame(frame);
}

$('less').addEventListener('click', () => { applyHelp(Math.max(0, help - STEP)); });
$('more').addEventListener('click', () => { applyHelp(Math.min(1, help + STEP)); });
$('wait').addEventListener('change', rebuild);
$('tempo').addEventListener('input', () => { $('tempo-val').textContent = `${$('tempo').value}%`; });
$('tempo').addEventListener('change', rebuild);
$('restart').addEventListener('click', rebuild);
$('hear').addEventListener('click', () => {
  if (demo) { rebuild(); return; }
  rebuild();
  demo = true; $('hear').textContent = 'Stop';
  playPreview(song.notes, engine.msPerBeat(), (m, down) => (down ? falls.keyDown(m) : falls.keyUp(m)), () => {});
});
const midi = new MidiInput();
midi.onNote = (m, _v, isDown) => press(m, isDown);
midi.onStatus = (text, ok) => { $('midi').textContent = ok ? 'Piano connected' : 'Connect piano'; status(text); };
$('midi').addEventListener('click', () => midi.connect());
addEventListener('resize', () => { falls.resize(); sizeLink(); measureStrip(); });

fillPicker();
load($('song').value);
requestAnimationFrame(frame);
window.__duet = { get engine() { return engine; }, get song() { return song; }, get help() { return help; }, get lookahead() { return falls.lookaheadBeats; }, press };
