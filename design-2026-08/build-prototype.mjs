// Build the CLICKABLE prototype of the whole app from the Claude Design export.
//
// Mark, 2026-08-29: "I want the whole app redesigned in Claude Design and have it
// clickable, so it feels like the real app. I can click around, see how the
// buttons feel, how the animations are... click through the whole app and make
// sure it's all been designed."
//
// The rule this file obeys: the ARTBOARDS ARE LIFTED VERBATIM. Their markup and
// inline styles are the design and are never rewritten. Everything this script
// adds is either (a) prototype scaffolding that sits OUTSIDE the 756px frame and
// is visibly not part of the design, or (b) interaction on elements the design
// already drew. The design gave no back-navigation on any screen, so the walking
// chrome is mine and is marked as such, rather than silently invented inside the
// artboard.
//
// Run: node design-2026-08/build-prototype.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, 'claude-design-v8', 'Keys Library Directions.dc.html');
const UP = join(HERE, 'claude-design-v8', 'uploads');
const OUT = join(HERE, 'keys-prototype.html');
const src = readFileSync(SRC, 'utf8');

// screen id -> [artboard, label]. Order is the walking order in the chrome.
const SCREENS = [
  // 7a and 7b are the DESKTOP frames, drawn at 1418x738 after Mark pointed out
  // that every other artboard is a 756px column and his window is 1418 wide, so
  // the app was using half his screen. They are separate COMPOSITIONS, not a
  // reflow of 5b, and the port treats them that way.
  // 8a is the DECK SPEC: not a screen the app renders, but the falling-notes
  // language written as values, because the deck is a canvas painted at 60fps
  // and a still artboard cannot carry motion.
  ['deck',            '8a', 'Deck states'],
  // the judge-panel round drew the screens that had never been drawn
  ['play-training',   '9a', 'Play, training cluster'],
  ['controls',        '9b', 'Compact controls'],
  ['alltools-narrow', '9c', 'All tools, narrow'],
  // 10a replaced 7a on 2026-08-29: Mark rejected 7a's layout (art squeezed,
  // learning and tools buried); 10a is the judge-panel art-forward relayout.
  // 7a stays on the canvas but is no longer ported.
  ['library-desktop', '10a', 'Library, desktop'],
  // the 11-series: every remaining screen's DESKTOP composition (2026-08-29)
  ['lessons-desktop',   '11a', 'Lessons, desktop'],
  ['lesson-desktop',    '11b', 'Lesson step, desktop'],
  ['task-desktop',      '11c', 'Theory task, desktop'],
  ['path-desktop',      '11d', 'My path, desktop'],
  ['echo-desktop',      '11e', 'Melody echo, desktop'],
  ['rhythm-desktop',    '11f', 'Rhythm tap, desktop'],
  ['improv-desktop',    '11g', 'Improv, desktop'],
  ['freeplay-desktop',  '11h', 'Free play, desktop'],
  ['metronome-desktop', '11i', 'Metronome, desktop'],
  ['trophies-desktop',  '11j', 'Trophies, desktop'],
  ['takes-desktop',     '11k', 'Takes, desktop'],
  ['calibrate-desktop', '11l', 'Latency calibration, desktop'],
  ['touch-desktop',     '11m', 'Touch diagnostic, desktop'],
  ['keys12-desktop',    '11n', '12 keys, desktop'],
  ['alltools',        '7b', 'All tools'],
  ['library',   '5b', 'Library'],
  ['play',      '6a', 'Play'],
  ['keys12',    '6p', '12 keys'],
  ['path',      '6e', 'My path'],
  ['lessons',   '6l', 'Lessons'],
  ['lesson',    '6c', 'Lesson step'],
  ['task',      '6b', 'Theory task'],
  ['echo',      '6d', 'Melody echo'],
  ['rhythm',    '6h', 'Rhythm tap'],
  ['improv',    '6j', 'Improv'],
  ['freeplay',  '6m', 'Free play'],
  ['metronome', '6g', 'Metronome'],
  ['trophies',  '6n', 'Trophies'],
  ['takes',     '6k', 'Takes'],
  ['calibrate', '6i', 'Latency calibration'],
  ['touch',     '6f', 'Touch diagnostic'],
  ['overlays',  '6o', 'Overlays'],
  ['states',    '6q', 'Freeze + no results'],
];

function artboard(id) {
  const start = src.indexOf(`<div class="dv-opt" id="${id}">`);
  if (start < 0) throw new Error(`artboard ${id} missing`);
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(src))) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return src.slice(start, m.index + m[0].length);
  }
  throw new Error(`artboard ${id} unterminated`);
}

// remove the canvas's own annotation row and its fold marker label, which are
// design-tool chrome and would read as part of the app
function clean(block) {
  // 'fold' is the artboard's 393PX FOLD annotation: a design-tool ruler showing
  // where a phone screen would cut the frame. It is 21px of chrome at the top of
  // every screen and it was rendering inside the app once the canon was mounted.
  // Stripped here, at prototype build time, so the design side of the overlay
  // and the shipped template lose it together and stay comparable.
  for (const cls of ['dv-olabel', 'fold']) {
    let i;
    while ((i = block.indexOf(`<div class="${cls}">`)) >= 0) {
      const re = /<\/?div\b[^>]*>/g; re.lastIndex = i;
      let d = 0, m, end = -1;
      while ((m = re.exec(block))) { d += m[0][1] === '/' ? -1 : 1; if (d === 0) { end = m.index + m[0].length; break; } }
      if (end < 0) break;
      block = block.slice(0, i) + block.slice(end);
    }
  }
  return block;
}

const inlined = new Map();
function inlineImages(block) {
  return block.replace(/src="uploads\/([^"]+)"/g, (_, name) => {
    if (!inlined.has(name)) {
      const bytes = readFileSync(join(UP, name));
      inlined.set(name, `data:image/jpeg;base64,${bytes.toString('base64')}`);
    }
    return `src="${inlined.get(name)}"`;
  });
}

// DEVIATION, recorded. The export writes `defaultChecked` on two checkboxes.
// That is a React prop, not an HTML attribute, so in the exported file it does
// nothing and both boxes render OFF, while the design tool believed it had
// turned them on and said so. Converted to the real attribute here so the
// prototype shows what the design meant. The canon file still carries the bug
// and should be fixed at source on the next design pass.
const fixReactisms = (html) => html.replace(/\sdefaultChecked/g, ' checked');

const panes = SCREENS.map(([key, id, label]) =>
  `<section class="pane" id="pane-${key}" data-screen="${key}" data-label="${label}">${fixReactisms(inlineImages(clean(artboard(id))))}</section>`
).join('\n');

const chips = SCREENS.map(([key, , label], i) =>
  `<button class="chip${i === 0 ? ' on' : ''}" data-go="${key}">${label}</button>`
).join('');

// Text labels inside the LIBRARY artboard that the design already drew as
// controls, wired to the screen they really open in the app. Nothing invented:
// each of these strings exists in 5b.
const HOTSPOTS = {
  'Free play': 'freeplay',
  'Metronome': 'metronome',
  'Latency calibration': 'calibrate',
  'Resume the session': 'play',
  'Start': 'play',
  'Continue': 'path',
  'All tools': '__tools',
};

// THE DOCTYPE IS LOad-BEARING. Without it the browser parses this file in
// QUIRKS mode, where a line box that contains no text directly ignores the
// block's strut. Every geometry in design/extracted/ was therefore quirks
// geometry, and the app - which is standards mode, like every real page -
// could not reproduce it: the states screen came out 7px taller and no
// property gate could see why, because every computed style matched.
// Standards mode is also closer to what Claude Design itself renders.
const page = `<!doctype html>
<html lang="en">
<title>Keys Prototype</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #000; color: #e9ede7;
         font: 14px/1.5 ui-sans-serif, system-ui, "Segoe UI", sans-serif; }

  /* PROTOTYPE SCAFFOLDING. Deliberately outside the 756px frame and visually
     distinct, because the design does not specify app navigation chrome and
     inventing it inside the artboard would contaminate the canon. */
  .proto { position: sticky; top: 0; z-index: 20; background: #000;
           border-bottom: 1px solid #253129; padding: 10px 14px 11px; }
  .proto-title { font: 600 12px/1 ui-monospace, Consolas, monospace; letter-spacing: .1em;
                 color: #788c82; margin: 0 0 9px; }
  .proto-title b { color: #82bf9c; font-weight: 600; }
  .chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { appearance: none; border: 1px solid #253129; background: #000; color: #a9b8b0;
          min-height: 34px; padding: 0 12px; border-radius: 7px; cursor: pointer;
          font: 600 12.5px/1 inherit; transition: background .14s ease, color .14s ease, border-color .14s ease, transform .1s ease; }
  .chip:hover { color: #e9ede7; border-color: #3a4a41; }
  .chip:active { transform: scale(.97); }
  .chip.on { background: #2e6b47; border-color: #2e6b47; color: #fff; }
  .chip:focus-visible { outline: 2px solid #82bf9c; outline-offset: 2px; }

  .stage { display: flex; justify-content: center; padding: 22px 12px 70px; }

  /* Mark may well open this on his phone. The artboards are a fixed 756px, so
     on a narrow screen they overflow and he ends up dragging sideways through
     every screen (measured: a 390px window gave a 573px page).
     The fit factor is applied by script as zoom, not by CSS transform, because
     transform: scale(calc(100vw / 770)) is INVALID: dividing a length by a
     number yields a length and scale() needs a number, so the declaration was
     silently dropped and the frame was merely clipped. zoom also shrinks the
     layout box, so no dead space is left underneath. */
  @media (max-width: 820px) { .stage { padding: 14px 0 60px; } }
  .pane { display: none; animation: rise .26s cubic-bezier(.2,.7,.3,1); }
  .pane.on { display: block; }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

  /* LIFE. The design is a static frozen surface, so pressability is added here
     for every element that reads as a control. Kept subtle: a lift, a hairline
     brightening, and a real press. */
  .pane [data-hot] { cursor: pointer; }
  .pane .hot { cursor: pointer; transition: filter .14s ease, transform .09s ease, box-shadow .14s ease; }
  .pane .hot:hover { filter: brightness(1.28); }
  .pane .hot:active { transform: scale(.985); filter: brightness(1.05); }
  .pane .hot::after { content: ""; position: absolute; inset: 0; border-radius: inherit;
                      background: #82bf9c; opacity: 0; pointer-events: none; transition: opacity .18s ease; }
  .pane .hot.flash::after { opacity: .18; transition: opacity 0s; }

  .hint { max-width: 756px; margin: 0 auto; color: #788c82; font-size: 12.5px;
          padding: 0 12px 40px; text-align: center; }
  .hint b { color: #a9b8b0; font-weight: 600; }

  /* the All tools sheet, which the design drew as a row but not as an open state */
  .sheet { position: fixed; inset: 0; z-index: 40; display: none; place-items: center;
           background: rgba(0,0,0,.72); backdrop-filter: blur(2px); }
  .sheet.on { display: grid; animation: fade .18s ease; }
  @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
  .sheet-inner { width: min(560px, 92vw); background: #000; border: 1px solid #253129;
                 border-radius: 14px; padding: 18px; animation: rise .24s cubic-bezier(.2,.7,.3,1); }
  .sheet h3 { font: 600 15px/1 'Fraunces', Georgia, serif; margin: 0 0 3px; }
  .sheet p { color: #788c82; font-size: 12px; margin: 0 0 14px; }
  .sheet-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
  .sheet-grid button { appearance: none; text-align: left; border: 1px solid #253129; background: #000;
                       color: #e9ede7; min-height: 44px; padding: 0 13px; border-radius: 8px;
                       font: 600 13px/1 inherit; cursor: pointer;
                       transition: background .14s ease, border-color .14s ease, transform .09s ease; }
  .sheet-grid button:hover { border-color: #82bf9c; background: #0b100d; }
  .sheet-grid button:active { transform: scale(.97); }
  .sheet-close { margin-top: 14px; appearance: none; border: 0; background: #2e6b47; color: #fff;
                 min-height: 44px; padding: 0 18px; border-radius: 8px; font: 700 13px/1 inherit; cursor: pointer; }
</style>

<div class="proto">
  <p class="proto-title">KEYS PROTOTYPE &middot; <b>${SCREENS.length} screens</b> &middot; click anything</p>
  <div class="chips">${chips}</div>
</div>

<div class="stage">${panes}</div>

<p class="hint">The dashed <b>393px fold</b> line on each screen marks what you would see without
scrolling, at your real window size.
<b>On a phone this is a scaled-down preview, not a mobile design</b>: the whole 756px screen is shrunk
to fit, so a 44px control lands at about 21px. Pinch to zoom in and read it. The app itself is desktop
only, because Web MIDI does not exist on iOS, so the phone view is for looking rather than using.
Every screen is the Claude Design output, lifted exactly.
The <b>row of buttons at the top is prototype scaffolding</b>, not part of the design:
the design does not draw app navigation, so this is how you walk it.
Inside the Library, <b>Free play</b>, <b>Metronome</b>, <b>Latency calibration</b>,
<b>Start</b>, <b>Continue</b> and <b>All tools</b> really navigate.</p>

<div class="sheet" id="sheet">
  <div class="sheet-inner">
    <h3>All tools</h3>
    <p>Every screen in the app. In the real build this is the searchable drawer.</p>
    <div class="sheet-grid" id="sheet-grid"></div>
    <button class="sheet-close" id="sheet-close">Close</button>
  </div>
</div>

<script>
(function () {
  var SCREENS = ${JSON.stringify(SCREENS.map(([k, , l]) => [k, l]))};
  var HOTSPOTS = ${JSON.stringify(HOTSPOTS)};

  // RAW MODE. The extractor loads this file with ?raw=1 to read the canon out
  // of it, and everything below that is prototype scaffolding - press states,
  // back wiring, the falling deck - would then be captured AS IF it were
  // design. It already was: the deck animation hides the canon's own resting
  // deck layer, and design/extracted/play.html came out carrying a baked
  // display:none on it. A whole screen's centrepiece, invisible, and every
  // style gate green. Scaffolding must be able to stand down.
  var RAW = /[?&]raw=1/.test(location.search);

  var history = [];
  function show(key, isBack) {
    var cur = document.querySelector('.pane.on');
    if (cur && cur.dataset.screen !== key && !isBack) history.push(cur.dataset.screen);
    var found = null;
    document.querySelectorAll('.pane').forEach(function (p) {
      var on = p.dataset.screen === key;
      p.classList.toggle('on', on);
      if (on) found = p;
    });
    if (!found) return;
    // Decorate on FIRST SHOW, never before. A hidden pane measures 0x0, so a
    // decoration pass that runs while every pane is display:none finds nothing
    // and silently produces a dead screen. That bug shipped once here already.
    if (!RAW) { decorate(found); animateFalls(found); }
    document.querySelectorAll('.chip').forEach(function (c) {
      c.classList.toggle('on', c.dataset.go === key);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', function (e) {
    var chip = e.target.closest ? e.target.closest('.chip') : null;
    if (chip) { show(chip.dataset.go); return; }
    var back = e.target.closest ? e.target.closest('[data-back]') : null;
    if (back) {
      back.classList.add('flash');
      setTimeout(function () { back.classList.remove('flash'); }, 190);
      var to = back.dataset.back === 'pop' ? (history.pop() || 'library') : 'library';
      setTimeout(function () { show(to, true); }, 90);
      return;
    }
    var hot = e.target.closest ? e.target.closest('[data-go]') : null;
    if (hot && !hot.classList.contains('chip')) {
      hot.classList.add('flash');
      setTimeout(function () { hot.classList.remove('flash'); }, 190);
      if (hot.dataset.go === '__tools') { document.getElementById('sheet').classList.add('on'); return; }
      setTimeout(function () { show(hot.dataset.go); }, 90);
      return;
    }
    if (e.target.id === 'sheet-close' || e.target.id === 'sheet') {
      document.getElementById('sheet').classList.remove('on');
    }
  });

  // fill the All tools sheet
  var grid = document.getElementById('sheet-grid');
  SCREENS.forEach(function (s) {
    var b = document.createElement('button');
    b.textContent = s[1];
    b.addEventListener('click', function () {
      document.getElementById('sheet').classList.remove('on');
      show(s[0]);
    });
    grid.appendChild(b);
  });

  // Wire the design's OWN library controls by their exact text, and make every
  // button-shaped element in every screen feel pressable.
  var lib = document.getElementById('pane-library');
  lib.classList.add('on');   // must be laid out before anything is measured
  Object.keys(HOTSPOTS).forEach(function (label) {
    var nodes = lib ? lib.querySelectorAll('*') : [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.children.length === 0 && n.textContent.trim() === label) {
        // climb to the smallest ancestor that paints a surface, which is the
        // control, not the label span
        var t = n;
        for (var up = 0; up < 4 && t.parentElement; up++) {
          var cs = getComputedStyle(t);
          if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px') break;
          t = t.parentElement;
        }
        t.setAttribute('data-go', HOTSPOTS[label]);
        t.classList.add('hot');
        if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
        break;
      }
    }
  });

  // press feel on anything that already looks like a control
  function decorate(pane) {
    if (RAW || pane.dataset.decorated) return;
    pane.dataset.decorated = '1';

    // Whatever the design calls its back control, wire it. "Back" pops the real
    // history so it behaves like the app; "Library" and "Home" go home. Written
    // generically because the design is still adding these and the labels
    // should not have to be re-listed here every time it does.
    pane.querySelectorAll('*').forEach(function (n) {
      if (n.children.length) return;
      var t = n.textContent.trim();
      if (!/^(library|back|home)$/i.test(t)) return;
      var target = n;
      for (var up = 0; up < 4 && target.parentElement; up++) {
        var c = getComputedStyle(target);
        if (c.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(c.borderTopWidth) > 0) break;
        target = target.parentElement;
      }
      if (target.dataset.back) return;
      target.dataset.back = /^back$/i.test(t) ? 'pop' : 'home';
      target.classList.add('hot');
      if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
    });
    pane.querySelectorAll('*').forEach(function (n) {
      if (n.classList.contains('hot')) return;
      var cs = getComputedStyle(n);
      var r = n.getBoundingClientRect();
      var t = n.textContent.trim();
      // These thresholds are MEASURED, not guessed. tools/probe-controls.mjs
      // found the design uses 2-4px radii (the first attempt required >=4 and
      // caught 7 of 39) and puts every control at exactly 44px tall, so the
      // 44px touch rule is already respected throughout the canon.
      var painted = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0;
      var looksControl = painted && t.length > 0 && t.length <= 42
        && r.height >= 16 && r.height <= 90
        && r.width >= 24 && r.width <= 400
        && n.children.length <= 3;
      if (looksControl) {
        n.classList.add('hot');
        if (cs.position === 'static') n.style.position = 'relative';
        n.addEventListener('click', function () {
          n.classList.add('flash');
          setTimeout(function () { n.classList.remove('flash'); }, 190);
        });
      }
    });
  }

  // PROTOTYPE SCAFFOLDING: the falling-notes deck, actually falling.
  // A static design cannot show motion, and motion is the app's whole character,
  // so the deck animates here using the REAL hand colours from js/falls.mjs
  // (right #f0a832, left #5ee0f2) on true black. Nothing here is design canon:
  // it exists so Mark can feel the rhythm of the thing rather than imagine it.
  function animateFalls(pane) {
    // PLAY ONLY. Eight screens have a canvas and each shows something
    // different: a stave, a keyboard, a waveform, a latency scatter. An earlier
    // version ran on all of them, which hid every designed resting state and
    // put falling notes inside the calibration meter. The deck is the only
    // surface whose character IS motion.
    if (RAW || pane.dataset.screen !== 'play') return;
    var c = pane.querySelector('canvas');
    if (!c || pane.dataset.anim) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    pane.dataset.anim = '1';
    // DEVIATION, recorded. Claude Design drew a RESTING deck as an absolutely
    // positioned layer over the canvas. It is canon and it stays on every other
    // screen, but on the one surface Mark asked to see MOVE, two decks stacked
    // read as clutter. So on the play deck only, the static layer steps aside
    // and the animation renders the same thing in the same language: lane
    // hairlines, a green key line, keys beneath it, note pills mid-fall.
    var over = c.parentElement && c.parentElement.querySelector('span[style*="absolute"]');
    if (over) over.style.display = 'none';
    var box = c.getBoundingClientRect();
    var W = Math.max(200, Math.round(box.width)), H = Math.max(120, Math.round(box.height));
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr;
    var g = c.getContext('2d');
    if (!g) return;
    g.scale(dpr, dpr);
    var LANES = 14, keyLine = H - 26;
    // DETERMINISTIC on purpose. With Math.random the deck sometimes dealt a
    // frame with almost no left-hand notes, which made the colour assertion in
    // tools/anim-proof.mjs flake. A flaky test teaches you to ignore red, and
    // it also meant the deck occasionally looked lopsided. A fixed sequence
    // gives a musical-looking spread and a stable gate.
    var notes = [];
    for (var i = 0; i < 26; i++) {
      var a = (i * 5) % LANES;              // walks the lanes without clumping
      var b = ((i * 7919) % 100) / 100;     // stable pseudo-spread for depth
      notes.push({ lane: a,
                   y: -(i * (H * 2.4 / 26)),
                   len: 18 + Math.round(b * 42),
                   hand: (i % 5 === 1 || i % 5 === 3) ? 'L' : 'R' });
    }
    var speed = 1.45;
    function frame() {
      if (!pane.classList.contains('on')) { requestAnimationFrame(frame); return; }
      g.clearRect(0, 0, W, H);
      // lane hairlines
      g.strokeStyle = '#141a16'; g.lineWidth = 1;
      for (var l = 1; l < LANES; l++) {
        var x = Math.round(l * (W / LANES)) + 0.5;
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, keyLine); g.stroke();
      }
      // the key line the notes land on, and the dark glass keys beneath it
      g.fillStyle = '#0a0c0b';
      g.fillRect(0, keyLine, W, H - keyLine);
      g.strokeStyle = '#3a4a41'; g.lineWidth = 1;
      for (var k = 1; k < LANES; k++) {
        var kx = Math.round(k * (W / LANES)) + 0.5;
        g.beginPath(); g.moveTo(kx, keyLine); g.lineTo(kx, H); g.stroke();
      }
      g.strokeStyle = '#82bf9c'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, keyLine); g.lineTo(W, keyLine); g.stroke();
      var lw = W / LANES;
      for (var n = 0; n < notes.length; n++) {
        var it = notes[n];
        it.y += speed;
        if (it.y - it.len > keyLine) { it.y = -it.len - H * 0.9; it.lane = (it.lane + 5) % LANES; }
        var top = it.y - it.len, bot = Math.min(it.y, keyLine);
        if (bot <= 0) continue;
        var col = it.hand === 'R' ? '#f0a832' : '#5ee0f2';
        var near = Math.max(0, 1 - (keyLine - bot) / 90);
        // The real deck's law (falls.mjs): light belongs to the notes. They sit
        // near full strength and BLOOM as they reach the line, rather than
        // fading in from nothing, which read as washed out at 0.55.
        g.globalAlpha = 0.82 + near * 0.18;
        g.shadowColor = it.hand === 'R' ? 'rgba(240,168,50,0.55)' : 'rgba(94,224,242,0.55)';
        g.shadowBlur = 6 + near * 14;
        g.fillStyle = col;
        var x0 = it.lane * lw + 3, w0 = lw - 6, h0 = Math.max(4, bot - Math.max(0, top));
        var y0 = Math.max(0, top);
        var r0 = Math.min(3, w0 / 2, h0 / 2);
        g.beginPath();
        if (g.roundRect) g.roundRect(x0, y0, w0, h0, r0); else g.rect(x0, y0, w0, h0);
        g.fill();
        g.shadowBlur = 0;
        if (near > 0.7) { g.globalAlpha = (near - 0.7) * 2.2; g.fillStyle = '#fff';
          g.fillRect(x0, keyLine - 3, w0, 3); }
        g.globalAlpha = 1;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function fitToWindow() {
    var stage = document.querySelector('.stage');
    var w = document.documentElement.clientWidth;
    stage.style.zoom = w < 820 ? Math.min(1, (w - 14) / 770) : '';
  }
  addEventListener('resize', fitToWindow);
  fitToWindow();

  show('library');
})();
</script>
`;

writeFileSync(OUT, page);
console.log(`wrote ${OUT}`);
console.log(`  ${(page.length / 1024 / 1024).toFixed(2)} MB, ${SCREENS.length} screens, ${inlined.size} images inlined`);
console.log(`  remote refs: ${(page.match(/src="(?!data:)[^"]*"/g) || []).length}`);
console.log(`  em dashes: ${(page.match(/—/g) || []).length}`);
