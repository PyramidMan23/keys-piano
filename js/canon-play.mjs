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
  applyCanonZoom(board);
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
  // the readout strip and the tier chip are SEPARATE children of the region
  const keepReadouts = [...region.children].filter((c) => /CLEAN|TIER/.test(c.textContent));
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
  const falls = $('falls');
  falls.style.width = '100%';
  falls.style.flex = '1 1 auto';
  falls.style.minHeight = '0';
  falls.style.height = 'auto';
  window.__falls?.resize?.();                    // set by app.mjs; harmless if absent

  // ---- proxies: every drawn control drives the hidden real one -------------
  // A proxy also MIRRORS the hidden control's label whenever it leaves its
  // resting text ("Hear it" -> "Stop", "Train" -> "Training at 80% (0/2)"),
  // and returns to the design's own word at rest. Without this the desktop
  // buttons concealed their active states (Codex full-verify, 2026-08-29).
  proxyMirrors.length = 0;
  const proxy = (sample, id) => {
    const el = leaf(board, sample);
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
  const modeF = proxy('Falls', 'mode-falls');
  const modeS = proxy('Score', 'mode-score');
  if (modeF && modeS) {
    const restyle = () => bindSegment([modeF, modeS], (el) =>
      el === (window.__viewMode === 'score' ? modeS : modeF));
    modeF.addEventListener('click', () => setTimeout(restyle, 0));
    modeS.addEventListener('click', () => setTimeout(restyle, 0));
  }

  // toggles: the row clicks the real checkbox; the word prints its state
  const toggle = (sample, id) => {
    const label = leaf(board, sample);
    if (!label) return;
    const row = rowOf(label);
    const word = [...row.querySelectorAll('*')]
      .find((e) => !e.children.length && /^(on|off)$/.test(e.textContent.trim()));
    const reflect = () => { if (word) word.textContent = $(id)?.checked ? 'on' : 'off'; };
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => { $(id)?.click(); reflect(); });
    row.dataset.reflects = id;
    reflect();
  };
  toggle('Wait for me', 'wait-mode');
  toggle('Note letters', 'chk-letters');

  // tempo: a click on the drawn track maps to the range input's own scale
  const pct = leaf(board, '74%');
  if (pct) { pct.id = 'cp-tempo-pct'; }
  const bpm = leaf(board, '104 bpm');
  if (bpm) { bpm.id = 'cp-bpm'; }
  const tempoLabel = leaf(board, 'TEMPO');
  if (tempoLabel) {
    const block = rowOf(tempoLabel, 2).parentElement ?? rowOf(tempoLabel, 2);
    const track = [...block.querySelectorAll('div')]
      .find((d) => d.clientWidth > 150 && d.clientHeight <= 24 && !d.textContent.trim());
    const input = $('tempo');
    if (track && input) {
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
    const syncSound = () => {
      if (sound9.options.length !== 2) {
        sound9.innerHTML = '';
        sound9.add(new Option('Grand piano', 'auto'));
        sound9.add(new Option('Synth', 'synth'));
      }
      sound9.value = voiceInfo().mode === 'synth' ? 'synth' : 'auto';
    };
    sound9.addEventListener('change', () => {
      const wantSynth = sound9.value === 'synth';
      if ((voiceInfo().mode === 'synth') !== wantSynth) $('btn-voice')?.click();
      setTimeout(syncSound, 50);
    });
    board.__syncSound = syncSound;
    syncSound();
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
  const innerImmersion = board.__immersion;
  board.__immersion = (on) => { innerImmersion(on); rail.style.display = on ? 'block' : 'none'; };

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
  put('cp-bpm', info.bpm);
  if (info.art) { const img = $('cp-art'); if (img && img.src !== info.art) img.src = info.art; }
  const chunkText = $('chunk-label')?.textContent?.trim();
  if (chunkText) put('cp-chunk', chunkText.replace(/^[^A-Za-z0-9]+/, ''));
  mirrorProxies();
  board?.__mirrorSections?.();
  board?.__syncSound?.();
}
let board = null;   // the mounted 9a root; module-scoped so sync can reach the section list

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
