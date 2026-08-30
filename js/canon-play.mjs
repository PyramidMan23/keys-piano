// The WIDE play screen: artboard 9a adopted by the running app.
//
// Mark, 2026-08-29, looking at the play screen on his laptop: "why is the
// synthesizer so small now???? it looks not good at all." He was right, and the
// cause was scope, not style: the library got a 1418px desktop composition and
// the play screen never did, so the app's most important surface ran as a 756px
// phone column centred in a wide window, and the deck with it.
//
// 9a is the judge-panel's desktop play board: the deck owns a ~1074x647 region
// on the left, and a 330px training column holds the run readouts, tempo, wait,
// note letters, section, chunk, sound and the action buttons, with Train the
// only filled button on the screen.
//
// 9a carries ZERO ids. Grafting the app's ids onto it and deleting the working
// screen would kill every control, because the app bound its listeners to the
// existing nodes at boot (that is Rule 2 by another door). So this file does
// two things instead, and only these:
//
//   ADOPT the live surfaces. The canvas the app draws to, the score view, the
//   combo flash and the performance banner are MOVED into 9a's deck region.
//   Moving a canvas node preserves its context and every reference FallsView
//   holds; one resize() call later it is painting at 1074px instead of 720.
//
//   PROXY the controls. Every 9a control forwards to the hidden, still-wired
//   original: the drawn tempo track maps a click to the range input's value,
//   the Wait for me row clicks the real checkbox and prints its state in a
//   word, the section rows drive the real <select>, and the buttons click the
//   buttons. Nothing is re-implemented, so behaviour cannot fork.
//
// Nothing here writes a colour, size, radius or spacing. The design owns the
// look; the app keeps the behaviour it already proved.
import { CANON } from './canon-templates.mjs';
import { applyInherited } from './canon-screen.mjs';
import { nameControls, bindBack, CANON_ON, desktopFits, applyCanonZoom } from './canon-mount.mjs';
import { bindSegment } from './canon-bind.mjs';
import { voiceInfo } from './audio.mjs';

const $ = (id) => document.getElementById(id);

// resolve a leaf by its sample text, inside a root
const leaf = (root, t) => [...root.querySelectorAll('*')]
  .find((e) => !e.children.length && e.textContent.trim() === t);
const rowOf = (el, minKids = 2) => {
  let r = el;
  while (r && r.parentElement && r.children.length < minKids) r = r.parentElement;
  return r;
};

export function widePlayFits() {
  // 1000+, fit-scaled: the same gate every desktop composition now uses
  return CANON_ON && !!CANON['play-training'] && desktopFits();
}

// Idempotent: safe to call on every show('play').
export function mountWidePlay(host) {
  if (!widePlayFits() || !host) return false;
  if (host.dataset.widePlay === '1') { syncWidePlay(); return true; }

  const old = host.firstElementChild;           // the 756px canon (6a), fully wired
  if (!old || !$('falls')) return false;

  applyInherited(host, 'play-training');
  const shell = document.createElement('div');
  shell.innerHTML = CANON['play-training'];
  board = shell.firstElementChild;

  // mount FIRST, measure after: clientWidth is zero before insertion
  host.insertBefore(board, old);
  // BOTH-axes fit, not width-only: browser chrome (bookmarks bar, zoom) eats
  // height while width stays full, and the width-only zoom clipped the rail's
  // bottom buttons clean off (Mark, 2026-08-30: "there's no restart button").
  const fitZoom = () => {
    const z = Math.min(1, window.innerWidth / 1418, window.innerHeight / 738);
    board.style.zoom = z < 1 ? String(z) : '';
  };
  fitZoom();
  window.__refitPlay = fitZoom;
  old.style.display = 'none';                    // hidden, NOT removed: it is the backend
  host.dataset.widePlay = '1';

  const region = [...board.querySelectorAll('div')]
    .filter((d) => d.clientWidth >= 900 && d.clientHeight >= 500)
    .sort((a, b) => (a.clientWidth * a.clientHeight) - (b.clientWidth * b.clientHeight))[0];
  if (!region) { board.remove(); old.style.display = ''; delete host.dataset.widePlay; return false; }
  // The region holds TWO things: the run readout strip (CLEAN / IN A ROW /
  // TIMING / TIER, the numbers the pianist judge put over the deck) and the
  // artboard's mock deck. Wiping the whole region took the readouts with it and
  // every cp-* id silently went missing, so only children that do NOT carry the
  // readouts stand down.
  // the readout strip, the tier chip, and the JOURNEY strip (2026-08-30) are
  // SEPARATE children of the region and all survive the wipe
  const keepReadouts = [...region.children].filter((c) => /CLEAN|TIER|JOURNEY/.test(c.textContent));
  for (const c of [...region.children]) if (!keepReadouts.includes(c)) c.remove();
  region.style.position = 'relative';
  region.style.display = 'flex';
  region.style.flexDirection = 'column';
  for (const k of keepReadouts) {
    k.style.flex = 'none';
    // the strip's children are absolutely positioned, so without a floor the
    // strip collapses to nothing and the performance banner lands on top of it
    k.style.position = 'relative';
    if (k.getBoundingClientRect().height < 30) k.style.minHeight = '56px';
    // the tier chip is a pill, not a banner: parked in the flex column it
    // stretched to full width and clipped its own text off the left edge
    if (/TIER/.test(k.textContent)) { k.style.alignSelf = 'flex-end'; k.style.width = 'max-content'; k.style.minHeight = ''; }
  }
  for (const id of ['perf-banner', 'falls', 'score-wrap', 'combo-flash']) {
    const el = $(id);
    if (el) region.appendChild(el);
  }
  // the JOURNEY strip belongs at the BOTTOM of the column, under the deck
  {
    const js = keepReadouts.find((c) => /JOURNEY/.test(c.textContent));
    if (js) { js.style.minHeight = ''; region.appendChild(js); }
  }
  // belt and braces: whatever a window does, the training rail must never
  // strand a control below the fold; it scrolls within itself if squeezed
  {
    const railCol = region.parentElement && [...region.parentElement.children]
      .find((c) => c !== region && c.clientWidth > 200 && c.clientWidth < 500);
    if (railCol) { railCol.style.overflowY = 'auto'; railCol.style.minHeight = '0'; }
  }
  const falls = $('falls');
  falls.style.width = '100%';
  falls.style.flex = '1 1 auto';
  falls.style.minHeight = '0';
  falls.style.height = 'auto';
  window.__falls?.resize?.();                    // set by app.mjs; harmless if absent

  // THE SCORE IS A SURFACE, NOT A DRAWING. The board drew a 56px "SCORE VIEW"
  // strip as a picture OF the score, and the port hands that element's id to
  // the real ScoreView, which wipes it and injects a 5,600-node SVG. Falls got
  // adopted properly here and the score got nothing, so it inherited the
  // strip's inline `display:flex;flex-direction:column`: a flex column stretches
  // its child to the container width, and an SVG with intrinsic width and
  // height scales its height to match, so the whole of Fur Elise rendered
  // 1048x9 and Mark saw an empty black box. It also never picked up the app's
  // own `.score-wrap` class, which carries the printed-page ground, the
  // horizontal scroll and every --score-* ink variable the notation paints
  // with. Adopt it the way the deck is adopted.
  const scoreWrap = $('score-wrap');
  if (scoreWrap) {
    scoreWrap.classList.add('score-wrap');
    scoreWrap.style.display = 'block';           // never flex: the SVG must not stretch
    scoreWrap.style.flexDirection = '';
    scoreWrap.style.gap = '';
    scoreWrap.style.padding = '';                // let the class set the page margins
    scoreWrap.style.flex = '1 1 auto';
    scoreWrap.style.minHeight = '0';
    scoreWrap.style.width = '100%';
  }

  // ---- proxies: every drawn control drives the hidden real one -------------
  // A proxy also MIRRORS the hidden control's label whenever it leaves its
  // resting text ("Hear it" -> "Stop", "Train" -> "Training at 80% (0/2)"),
  // and returns to the design's own word at rest. Without this the desktop
  // buttons concealed their active states (Codex full-verify, 2026-08-29).
  proxyMirrors.length = 0;
  const proxy = (sample, id) => {
    // Prefer the leaf inside a BUTTON: the journey strip draws a step named
    // "Hear it", which sits earlier in the DOM than the action button and
    // stole the proxy (v69 first battery caught it).
    const cands = [...board.querySelectorAll('*')]
      .filter((e) => !e.children.length && e.textContent.trim() === sample);
    const el = cands.find((e) => e.closest('button')) ?? cands[0];
    if (!el) return null;
    const c = el.closest('button') ?? rowOf(el);
    c.style.cursor = 'pointer';
    c.addEventListener('click', () => { $(id)?.click(); setTimeout(mirrorProxies, 0); });
    c.dataset.proxyFor = id;
    proxyMirrors.push({ el, id, drawn: el.textContent, base: stripLabel($(id)?.textContent) });
    return c;
  };
  proxy('Train', 'btn-train');
  proxy('Hear it', 'btn-hear');
  proxy('Memorize', 'btn-mem');
  proxy('Record take', 'btn-take');
  proxy('Restart', 'btn-restart');
  proxy('Prev', 'chunk-prev');
  proxy('Next', 'chunk-next');
  // the chunk READOUT is the legacy toggle (its label click turns chunk
  // looping off): without this, desktop had no way OUT of chunk mode. Click
  // wiring only, no label mirror: syncWidePlay already feeds cp-chunk.
  {
    const el = leaf(board, 'B2 of B4');
    if (el) {
      const c = el.closest('button') ?? rowOf(el);
      c.style.cursor = 'pointer';
      c.title = 'Toggle chunk looping';
      c.dataset.proxyFor = 'chunk-label';
      c.addEventListener('click', () => { $('chunk-label')?.click(); setTimeout(syncWidePlay, 0); });
    }
  }
  // drawn on 9a in the 2026-08-30 parity round; a no-op on older markup
  proxy('Performance run', 'btn-perf');
  bindHandCells(board);
  // TIER PICKER (drawn Round C, Mark: "it's very hard to pick easy medium or
  // hard"): each cell opens that tier's variant of the current song; cells
  // for tiers a song does not ship stand down
  {
    const tierCells = ['Easy', 'Medium', 'Hard'].map((w) => {
      const l = [...board.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim() === w && e.closest('button'));
      return l ? l.closest('button') : null;
    });
    if (tierCells.filter(Boolean).length === 3) {
      tierCells.forEach((c, i) => {
        c.dataset.tierCell = ['Easy', 'Medium', 'Hard'][i];
        if (!c.dataset.disp) c.dataset.disp = c.style.display || 'flex';
        c.style.cursor = 'pointer';
        c.addEventListener('click', () => { window.__openTier?.(c.dataset.tierCell); setTimeout(() => board.__syncTiers?.(), 400); });
      });
      board.__syncTiers = () => {
        const info = window.__tierInfo?.();
        if (!info) return;
        const sig = info.have.join(',') + '|' + info.current;
        if (board.dataset.tsig === sig) return;
        board.dataset.tsig = sig;
        tierCells.forEach((c) => { c.style.display = info.have.includes(c.dataset.tierCell) ? c.dataset.disp : 'none'; });
        bindSegment(tierCells.filter((c) => c.style.display !== 'none'), (el) => el.dataset.tierCell === info.current);
      };
      board.__syncTiers();
    }
  }
  const modeF = proxy('Falls', 'mode-falls');
  const modeS = proxy('Score', 'mode-score');
  if (modeF && modeS) {
    const restyle = () => bindSegment([modeF, modeS], (el) =>
      el === (window.__viewMode === 'score' ? modeS : modeF));
    modeF.addEventListener('click', () => setTimeout(restyle, 0));
    modeS.addEventListener('click', () => setTimeout(restyle, 0));
  }

  // toggles: the row clicks the real checkbox; the word prints its state.
  // preventDefault matters: the drawn row is a LABEL around a native checkbox,
  // and a label click synthesizes a second click on its input, which bubbled
  // back through this listener and flipped the real checkbox TWICE, a net
  // no-op. The wait toggle was dead on desktop until the parity journey
  // caught it (2026-08-30).
  const toggle = (sample, id) => {
    const label = leaf(board, sample);
    if (!label) return;
    const row = rowOf(label);
    const word = [...row.querySelectorAll('*')]
      .find((e) => !e.children.length && /^(on|off)$/.test(e.textContent.trim()));
    const reflect = () => {
      const real = $(id);
      if (word) word.textContent = real?.checked ? 'on' : 'off';
      const drawnBox = row.querySelector('input[type="checkbox"]');
      if (drawnBox && real) drawnBox.checked = real.checked;
    };
    row.style.cursor = 'pointer';
    row.addEventListener('click', (ev) => { ev.preventDefault(); $(id)?.click(); reflect(); });
    row.dataset.reflects = id;
    reflect();
  };
  toggle('Wait for me', 'wait-mode');
  toggle('Note letters', 'chk-letters');

  // NOTE STYLE and TAP SOUND (drawn 2026-08-30 parity round): each half of the
  // shared row is a button carrying its own state word; a click cycles the
  // legacy control and the word mirrors the legacy truth
  const cycleReflects = [];
  const cycleRow = (sample, id, getWord, act) => {
    const label = leaf(board, sample);
    const btn = label?.closest('button');
    if (!btn) return;
    const word = [...btn.querySelectorAll('span')].find((s) => s !== label && !s.children.length);
    const reflect = () => { const w = getWord(); if (word && w && word.textContent !== w) word.textContent = w; };
    btn.style.cursor = 'pointer';
    btn.dataset.proxyFor = id;
    btn.addEventListener('click', () => { act(); setTimeout(reflect, 0); });
    reflect();
    cycleReflects.push(reflect);
  };
  cycleRow('Note style', 'notestyle-seg',
    () => document.querySelector('#notestyle-seg .seg-btn[data-on="true"]')?.textContent.trim() ?? 'Colour',
    () => document.querySelector('#notestyle-seg .seg-btn:not([data-on="true"])')?.click());
  cycleRow('Tap sound', 'btn-sound',
    () => stripLabel($('btn-sound')?.textContent) || 'Auto',
    () => $('btn-sound')?.click());
  board.__cycleReflect = () => cycleReflects.forEach((f) => f());

  // tempo: a click on the drawn track maps to the range input's own scale
  const pct = leaf(board, '74%');
  if (pct) { pct.id = 'cp-tempo-pct'; }
  const bpm = leaf(board, '104 bpm');
  if (bpm) { bpm.id = 'cp-bpm'; }
  const tempoLabel = leaf(board, 'TEMPO');
  if (tempoLabel) {
    const block = rowOf(tempoLabel, 2).parentElement ?? rowOf(tempoLabel, 2);
    const input = $('tempo');
    // The board draws a REAL <input type=range> now. The old wiring looked for
    // a textless div track, found nothing, and wired nothing, so the thumb
    // moved and the engine never heard it (Mark, 2026-08-30: "the tempo bar
    // isn't working"). Forward its moves to the app's input; its RANGE is the
    // app's truth (the drawn 40-140 was a sample, the engine's is 40-120).
    const drawn = block?.querySelector('input[type="range"]') ?? board.querySelector('input[type="range"]');
    if (drawn && input) {
      drawn.min = input.min; drawn.max = input.max; drawn.step = input.step || '5';
      drawn.value = input.value;
      drawn.dataset.proxyFor = 'tempo';
      drawn.addEventListener('input', () => {
        input.value = drawn.value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        syncWidePlay();
      });
    } else if (input) {
      // older markup fallback: the drawn static track maps a click to the scale
      const track = [...(block ?? board).querySelectorAll('div')]
        .find((d) => d.clientWidth > 150 && d.clientHeight <= 24 && !d.textContent.trim());
      if (track) {
        track.style.cursor = 'pointer';
        track.addEventListener('click', (ev) => {
          const r = track.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (ev.clientX - r.x) / r.width));
          const min = +input.min || 40, max = +input.max || 140;
          input.value = String(Math.round(min + ratio * (max - min)));
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          syncWidePlay();
        });
      }
    }
  }

  // SECTION and SOUND are NATIVE SELECTS in 9a: their option texts measure
  // 0x0 in the extraction because options render off-document. The first
  // attempt treated them as drawn rows, matched "Section B, bars 17 to 32" by
  // first occurrence, hit the Fraunces TRAINING header instead (the same string
  // appears three times on this board), and cloned 19px headers as list rows
  // straight over the action buttons. Geometry told the truth; the fix is to
  // mirror the real selects into the drawn ones.
  const selects = [...board.querySelectorAll('select')];
  const optionTexts = (sel) => [...sel.options].map((o) => o.textContent);
  const sec9 = selects.find((x) => optionTexts(x).some((t) => t.includes('Section A')));
  const sound9 = selects.find((x) => optionTexts(x).some((t) => t.includes('Grand piano')));

  const trainLine = leaf(board, 'Section B, bars 17 to 32');
  if (trainLine) trainLine.id = 'cp-train-sec';   // the big header under TRAINING

  if (sec9) {
    const mirror = () => {
      const real = $('section-select');
      if (!real) return;
      const want = [...real.options].map((o) => o.value + '|' + o.text).join(';');
      if (sec9.dataset.mirrored !== want) {
        sec9.innerHTML = '';
        for (const o of real.options) sec9.add(new Option(o.text, o.value));
        sec9.dataset.mirrored = want;
      }
      sec9.value = real.value;
      const cur = $('cp-train-sec');
      if (cur) cur.textContent = real.selectedOptions[0]?.text?.replace(/^\u2713 /, '') ?? 'Whole song';
    };
    sec9.addEventListener('change', () => {
      const real = $('section-select');
      if (!real) return;
      real.value = sec9.value;
      real.dispatchEvent(new Event('change', { bubbles: true }));
      mirror();
    });
    board.__mirrorSections = mirror;
    mirror();
  }

  // The board draws four voices; the app ships two. The select mirrors the
  // truth rather than leaving two options that do nothing: Grand piano and
  // Synth, driven by the app's own voice toggle. Recorded in CANON-GAPS.md.
  if (sound9) {
    // the app's real voices (Grand / Felt / Synth as of 2026-08-30), mirrored
    const syncSound = () => {
      if (sound9.options.length !== 3) {
        sound9.innerHTML = '';
        sound9.add(new Option('Grand piano', 'auto'));
        sound9.add(new Option('Felt grand', 'felt'));
        sound9.add(new Option('Synth', 'synth'));
      }
      sound9.value = voiceInfo().mode;
    };
    sound9.addEventListener('change', () => {
      // cycle the real toggle until the modes agree (max 3 steps)
      for (let i = 0; i < 3 && voiceInfo().mode !== sound9.value; i++) $('btn-voice')?.click();
      setTimeout(syncSound, 50);
    });
    board.__syncSound = syncSound;
    syncSound();
  }

  // CHUNK SIZE (drawn 2026-08-30 parity round): the drawn select drives the
  // hidden real one by leading number, the same rule that fixed chunkBars
  const chunk9 = selects.find((x) => optionTexts(x).some((t) => t.trim() === '1 bar'));
  if (chunk9) {
    chunk9.dataset.proxyFor = 'chunk-size';
    chunk9.addEventListener('change', () => {
      const real = $('chunk-size');
      if (!real) return;
      const want = parseFloat(chunk9.value || chunk9.options[chunk9.selectedIndex]?.text || '2');
      const idx = [...real.options].findIndex((o) => parseFloat(o.value || o.text) === want);
      if (idx >= 0) { real.selectedIndex = idx; real.dispatchEvent(new Event('change', { bubbles: true })); }
      syncWidePlay();
    });
  }

  // ---- the JOURNEY strip (drawn 2026-08-30 parity round) --------------------
  // The per-song step ladder lived only on the hidden phone board; the deck
  // now carries the drawn strip and mirrors the legacy #journey-strip truth:
  // step names and states are dealt into the board's own drawn cell variants.
  {
    const kick = leaf(board, 'JOURNEY');
    const nextBtn = leaf(board, 'Next step')?.closest('button');
    if (kick && nextBtn) {
      const row = kick.parentElement;
      const cells = [...row.children].filter((c) => c.tagName === 'SPAN' && c !== kick && c.querySelector('i'));
      // the drawn samples in order: done, done, current, todo, todo
      const tplDone = cells[0]?.cloneNode(true), tplNow = cells[2]?.cloneNode(true), tplTodo = cells[3]?.cloneNode(true);
      row.dataset.disp = row.style.display || 'flex';
      nextBtn.dataset.disp = nextBtn.style.display || '';
      nextBtn.style.cursor = 'pointer';
      nextBtn.addEventListener('click', () => { $('j-go')?.click(); setTimeout(syncWidePlay, 0); });
      board.__mirrorJourney = () => {
        const legacy = $('journey-strip');
        const steps = legacy && !legacy.hidden ? [...legacy.querySelectorAll('.j-step')] : [];
        const sig = steps.map((s) => s.textContent.trim() + '|' + s.className).join(';') + '|' + !!$('j-go');
        if (row.dataset.jsig === sig) return;
        row.dataset.jsig = sig;
        if (!steps.length || !tplDone || !tplNow || !tplTodo) { row.style.display = 'none'; return; }
        row.style.display = row.dataset.disp;
        for (const c of [...row.children]) {
          if (c.tagName === 'SPAN' && c !== kick && c.querySelector('i')) c.remove();
        }
        for (const s of steps) {
          const tpl = s.classList.contains('done') ? tplDone : s.classList.contains('now') ? tplNow : tplTodo;
          const c = tpl.cloneNode(true);
          const word = [...c.children].find((x) => x.tagName === 'SPAN');
          if (word) word.textContent = s.textContent.replace(/^[^\p{L}]+/u, '').trim();
          row.insertBefore(c, nextBtn);
        }
        nextBtn.style.display = $('j-go') ? nextBtn.dataset.disp : 'none';
      };
      board.__mirrorJourney();
    }
  }

  // readouts and header slots the app will keep current
  const give = (sample, id) => { const el = leaf(board, sample); if (el) el.id = id; };
  give('Star Wars Main Title', 'cp-title');
  give('Easy tier, section B', 'cp-sub');
  give('96%', 'cp-clean');
  give('34', 'cp-row');
  give('+12', 'cp-timing');
  // the tier chip's text carries styling spans, so match it loosely
  { const t = [...board.querySelectorAll('*')].find((e) => /^TIER\s*\d/.test(e.textContent.trim()) && e.textContent.trim().length < 10); if (t) t.id = 'cp-tier'; }
  give('B2 of B4', 'cp-chunk');

  // the header sleeve: 9a ships it as a data-art slot; the app fills it with
  // the CURRENT song's artwork through syncWidePlay
  const art = board.querySelector('img[data-art], img');
  if (art) { art.id = 'cp-art'; art.removeAttribute('data-art'); art.alt = ''; }

  // ---- IMMERSION (Mark, 2026-08-29): "we want this part to take up as much
  // screen real estate as we can, the biggest immersion factor." During a run
  // the chrome recedes: the board header and the training column collapse and
  // the deck owns the whole frame except the readout strip, which is exactly
  // the state he circled. Same surfaces, two states, nothing invented.
  //
  // The first cut guessed the structure (querySelector('div') grabbed the
  // outermost wrapper and hid the entire board, deck included), so this one
  // MEASURES it: the header is the short child of the card, the main row is the
  // tall one, the column is the narrow child of the main row.
  // one wrapper deeper than it looks: the card's only child holds the header
  // row and the main row (the diagnosis printed it plainly)
  const wrap = board.firstElementChild ?? board;
  const header = [...wrap.children].find((c) => c.clientHeight > 0 && c.clientHeight < 140);
  const main = [...wrap.children].find((c) => c.clientHeight >= 400);
  const deckSide = main ? [...main.children].find((c) => c.contains(region)) : null;
  const column = main ? [...main.children].find((c) => c !== deckSide && c.clientWidth < 500) : null;
  const saved = new Map();
  const stash = (el, props) => { if (!el) return; if (!saved.has(el)) saved.set(el, {}); for (const p2 of props) saved.get(el)[p2] = el.style[p2]; };
  board.__immersion = (on) => {
    if (!main || !deckSide) return;
    if (on && board.dataset.immersed !== '1') {
      stash(header, ['display']); stash(column, ['display']);
      stash(main, ['height']); stash(deckSide, ['width', 'height']); stash(region, ['height', 'paddingRight']);
      if (header) header.style.display = 'none';
      if (column) column.style.display = 'none';
      main.style.height = board.clientHeight + 'px';
      deckSide.style.width = '100%';
      deckSide.style.height = '100%';
      region.style.height = '100%';
      // the 24px CONTROLS rail overlays the right edge while immersed; without
      // this the TIER chip and the armed banner sat half under it, clipped
      region.style.paddingRight = '28px';
      board.dataset.immersed = '1';
    } else if (!on && board.dataset.immersed === '1') {
      for (const [el, props] of saved) for (const [k, v] of Object.entries(props)) el.style[k] = v;
      saved.clear();
      board.dataset.immersed = '';
    }
    requestAnimationFrame(() => window.__falls?.resize?.());
  };
  // The collapsed rail: when the column recedes it leaves a 24px strip on the
  // right edge, in the language (black, hairline, vertical mono label), so the
  // controls are one click away instead of hidden behind a keyboard shortcut.
  // Mark asked for exactly this: "a side bar that minimizes when we start
  // playing and expands the playing screen".
  const rail = document.createElement('button');
  rail.type = 'button';
  rail.setAttribute('aria-label', 'Show the training controls');
  rail.style.cssText = 'position:absolute;top:0;right:0;bottom:0;width:24px;display:none;'
    + 'background:#000;border:0;border-left:1px solid #253129;cursor:pointer;padding:0;z-index:5';
  rail.innerHTML = '<span style="writing-mode:vertical-rl;font:400 10px/1 ui-monospace,Menlo,monospace;'
    + 'letter-spacing:.18em;color:#788c82;pointer-events:none">CONTROLS</span>';
  rail.addEventListener('click', () => board.__immersion(false));
  (main ?? board).style.position = 'relative';
  (main ?? board).appendChild(rail);
  // PLAY AGAIN, while immersed. Mark, 2026-08-30: "when the notes and keyboard
  // take up the whole screen, can we have a restart button ... out of the way,
  // semi opaque, but we know it's there."
  //
  // So: a circle in the bottom corner, clear of the CONTROLS rail, resting at
  // low opacity so it never competes with the falling notes, and coming fully
  // up on hover or keyboard focus with its name beside it. Mint on waking, not
  // amber: the colour law says mint is what you can act on NOW and amber is
  // progress already made, and a restart is an action. 44px because every touch
  // target here is. It drives the board's own Restart control rather than a
  // second code path, so there is one definition of what restarting means.
  const again = document.createElement('button');
  again.type = 'button';
  // The id is load-bearing, not decoration: style.css exempts #cp-again from
  // `.canon-root * { all: revert }`. Without it that reset strips the icon's SVG
  // presentation attributes and the arrow paints black on a black pill, at the
  // right size and completely invisible. Same trap that erased the score view.
  again.id = 'cp-again';
  again.setAttribute('aria-label', 'Play again from the start');
  // ☠️☠️ IT HAS COLLIDED TWICE. Read this before moving it a third time.
  //   1st: right:44px/bottom:16px printed over the combo badge ("Play again" at
  //        1260,678 against "24 in a row" at 1294,695), two boxes of text on
  //        top of one another.
  //   2nd: left:16px/bottom:16px, chosen as "the free corner", sat ON THE
  //        KEYBOARD. There is ONE canvas for the whole deck (x15-1389, y80-695)
  //        and its lower band IS the keys, so bottom:16px laid a 44px button
  //        over the bottom 17px of the low white keys, exactly where a finger
  //        lands. Both times every element was individually correct and only
  //        looking at a screenshot showed it.
  // The lesson from both: the BOTTOM of this board belongs to the playing
  // surface. The one band with nothing in it is the readout strip along the TOP
  // (y 0-80), whose right half is empty, and it sits ABOVE the canvas so it can
  // never cover a note or a key. It also puts this beside the CONTROLS rail, so
  // the two things you reach for mid-song live together.
  // tools/immersion-clearance.mjs now FAILS if this box touches the deck
  // canvas, the combo badge, the tier chip or the rail. Move it there, not here.
  again.style.cssText = 'position:absolute;right:40px;top:10px;height:44px;padding:0 14px;'
    + 'display:none;align-items:center;gap:9px;z-index:6;cursor:pointer;'
    + 'background:rgba(0,0,0,.55);border:1px solid #253129;border-radius:22px;'
    + 'color:#e9ede7;font:700 12px/1 Helvetica,Arial,sans-serif;opacity:.32;'
    + 'transition:opacity .18s ease,border-color .18s ease,background .18s ease;'
    + '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)';
  again.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" '
    + 'style="display:block;flex:none"><path d="M13.2 6.6A5.4 5.4 0 1 0 13 9.9" fill="none" '
    + 'stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
    + '<path d="M13.6 2.6v4.2h-4.2" fill="none" stroke="currentColor" stroke-width="1.7" '
    + 'stroke-linecap="round" stroke-linejoin="round"/></svg>'
    + '<span style="pointer-events:none">Play again</span>';
  const wake = (up) => {
    again.style.opacity = up ? '1' : '.32';
    again.style.borderColor = up ? '#82bf9c' : '#253129';
    again.style.background = up ? 'rgba(0,0,0,.78)' : 'rgba(0,0,0,.55)';
  };
  again.addEventListener('pointerenter', () => wake(true));
  again.addEventListener('pointerleave', () => wake(false));
  again.addEventListener('focus', () => wake(true));
  again.addEventListener('blur', () => wake(false));
  again.addEventListener('click', () => $('btn-restart')?.click());
  (main ?? board).appendChild(again);

  const innerImmersion = board.__immersion;
  board.__immersion = (on) => {
    innerImmersion(on);
    rail.style.display = on ? 'block' : 'none';
    again.style.display = on ? 'flex' : 'none';
    if (!on) wake(false);
  };

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && board.dataset.immersed === '1') board.__immersion(false);
  });
  const trainBtn = leaf(board, 'Train');
  if (trainBtn) (trainBtn.closest('button') ?? rowOf(trainBtn)).addEventListener('click', () => board.__immersion(true));
  region.addEventListener('dblclick', () => board.__immersion(board.dataset.immersed !== '1'));
  window.__deckImmersion = (on) => board.__immersion(on);

  bindBack(board);
  nameControls(board);
  syncWidePlay();
  return true;
}

// Called by the app whenever the numbers move: cheap, guarded, no layout work.
export function syncWidePlay(info = {}) {
  if (!$('cp-clean')) return;
  const put = (id, v) => { const el = $(id); if (el && v != null && el.textContent !== String(v)) el.textContent = String(v); };
  put('cp-clean', info.accuracy != null ? info.accuracy + '%' : null);
  put('cp-row', info.combo);
  put('cp-timing', info.timing);
  put('cp-tier', info.tier != null ? 'TIER ' + info.tier : null);
  put('cp-title', info.title);
  put('cp-sub', info.sub);
  put('cp-tempo-pct', $('tempo') ? $('tempo').value + '%' : null);
  // the drawn slider follows programmatic tempo writes (startSong resets 100)
  {
    const drawn = board?.querySelector('input[type="range"][data-proxy-for="tempo"]');
    const real = $('tempo');
    if (drawn && real && drawn.value !== real.value && document.activeElement !== drawn) drawn.value = real.value;
  }
  put('cp-bpm', info.bpm);
  if (info.art) { const img = $('cp-art'); if (img && img.src !== info.art) img.src = info.art; }
  const chunkText = $('chunk-label')?.textContent?.trim();
  if (chunkText) put('cp-chunk', chunkText.replace(/^[^A-Za-z0-9]+/, ''));
  mirrorProxies();
  syncHandCells();
  board?.__mirrorSections?.();
  board?.__syncSound?.();
  board?.__mirrorJourney?.();
  board?.__cycleReflect?.();
  board?.__syncTiers?.();
}
let board = null;   // the mounted 9a root; module-scoped so sync can reach the section list

// ---- the HANDS segment (drawn 2026-08-30) ----------------------------------
// Mark: "I can't see the option to play with left or right hand or both."
// He was right: the control lived only on the legacy markup and neither
// composition drew it, so the port hid it. Both play boards now draw a
// Both/Left/Right segment; each drawn cell clicks the hidden legacy
// .hand-btn, and selection mirrors the legacy row's own data-on truth
// (maintained by the app's existing click handler).
const HAND_BY_WORD = { Both: 'both', Left: 'L', Right: 'R' };
const handGroups = [];   // one array of bound cells per composition
export function bindHandCells(root) {
  if (!root) return false;
  const cells = [];
  for (const [word, code] of Object.entries(HAND_BY_WORD)) {
    const el = [...root.querySelectorAll('*')]
      .find((e) => !e.children.length && e.textContent.trim() === word && !e.closest('[data-legacy-screen]'));
    const c = el?.closest('button');
    if (!c || c.dataset.handCell) continue;
    c.style.cursor = 'pointer';
    c.dataset.handCell = code;
    c.addEventListener('click', () => {
      [...document.querySelectorAll('.hand-btn')].find((b2) => b2.dataset.hand === code)?.click();
      setTimeout(syncHandCells, 0);
    });
    cells.push(c);
  }
  if (cells.length !== 3) return false;
  handGroups.push(cells);
  syncHandCells();
  return true;
}
export function syncHandCells() {
  const cur = [...document.querySelectorAll('.hand-btn')].find((b2) => b2.dataset.on === 'true')?.dataset.hand ?? 'both';
  for (const cells of handGroups) bindSegment(cells, (el) => el.dataset.handCell === cur);
}

// drawn-label mirroring: emoji and glyph prefixes are the legacy rail's, not
// the design's, so labels compare and display stripped of them
const stripLabel = (t) => String(t ?? '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
const proxyMirrors = [];
function mirrorProxies() {
  for (const m of proxyMirrors) {
    const real = $(m.id);
    if (!real) continue;
    const now = stripLabel(real.textContent);
    const want = now && now !== m.base ? now : m.drawn;
    if (m.el.textContent !== want) m.el.textContent = want;
  }
}
