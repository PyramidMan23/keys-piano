// The canon library renderer.
//
// apply-design doctrine, strategy rung (d): a PARALLEL renderer selected at the
// render boundary behind a flag, with the old renderer left intact underneath,
// so a bad port is one flag away from being undone.
//
// The governing rule, and the reason this file is mostly binding and almost no
// styling: THE APP RENDERS THE DESIGN'S OWN MARKUP. `canon-templates.mjs` holds
// the artboard byte for byte, straight out of the extraction. Nothing here
// writes a colour, a size, a radius or a spacing value. If something looks
// wrong, it is wrong in the design and gets fixed in Claude Design, re-extracted
// and rebuilt. That is what stops the slow re-implementation drift that cost
// thirty hours on the gym port and a week on Mailroom.
//
// Turn it on with ?canon=1 (or window.__canon = true before boot).
import { CANON } from './canon-templates.mjs';
import { applyInherited, mountMarkup, renderCanonScreen } from './canon-screen.mjs';
import { bindSegment as segmentVariants } from './canon-bind.mjs';
import { reclaimIds, captureFocus, restoreFocus, nameControls, desktopFits, applyCanonZoom } from './canon-mount.mjs';
import { coverDataUrl, sleeveUrlByGroup } from './covers.mjs';

// THE SAMPLE ROWS, FOUND STRUCTURALLY.
//
// This used to be a hardcoded list of the five songs artboard 5b happens to
// draw. Then 7a arrived, the desktop frame, and it samples a different five
// (Happy Birthday instead of River Flows in You), so a hardcoded list binds one
// composition and silently leaves the other showing the artboard's own data.
//
// Both compositions build the table the same way: a header row carrying SONG
// and PLAYS, then sibling rows with the same slot count, then a narrower row for
// "show the other N". Walk that, and the rule holds for whatever frame the
// design draws next.
function findRowAnchors(root) {
  const song = bySample(root, 'SONG'), plays = bySample(root, 'PLAYS');
  if (!song || !plays) return [];
  let header = song;
  while (header && !header.contains(plays)) header = header.parentElement;
  if (!header) return [];
  const slots = header.children.length;
  const out = [];
  for (let row = header.nextElementSibling; row; row = row.nextElementSibling) {
    if (row.children.length !== slots) break;
    const title = [...row.children[1].querySelectorAll('*')]
      .find((e) => !e.children.length && e.textContent.trim());
    if (!title) break;
    out.push(title);
  }
  return out;
}

// Resolve a slot by the sample text the DESIGN put there. Text is the contract:
// it survives restyling, and it is what a human would point at.
function bySample(root, sample) {
  for (const e of root.querySelectorAll('*')) {
    if (e.children.length) continue;
    if (e.textContent.trim() === sample) return e;
  }
  return null;
}
// The CONTROL a label belongs to. A real interactive ancestor wins outright:
// "the smallest ancestor that PAINTS a surface" is the right rule for resolving
// a chip against a design, but it is the wrong rule for deciding what to click
// or hide. The design draws "Show the other 7 in Learning" as a bare text
// button with no border and no background, so the paint rule climbed straight
// past it to the content column - and hiding that hid the ENTIRE library. The
// pixel gate caught it at 123,066 differing pixels; nothing else would have.
function control(node, max = 4) {
  const interactive = node.closest('button, a, input, select, textarea, label, [role="button"]');
  if (interactive) return interactive;
  let t = node;
  for (let i = 0; i < max && t.parentElement; i++) {
    const cs = getComputedStyle(t);
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0) return t;
    t = t.parentElement;
  }
  return t;
}
// A BINDER THAT MISSES MUST SAY SO.
//
// bySample returns the first node with that exact text, or null, and every
// caller here shrugs and carries on. That is the worst possible failure for
// this port: the design's sample data stays on screen, looking like the user's
// own, and nothing anywhere goes red. Codex named it as the highest-severity
// silent failure in the whole approach and it was right.
//
// So every miss is recorded, and tools/canon-runtime.mjs fails the build on a
// non-empty list. The cost of a false positive here is a line of output; the
// cost of a false negative is Mark reading someone else's practice minutes as
// his own.
export const CANON_MISSES = [];
const miss = (sample) => { CANON_MISSES.push(sample); return null; };
if (typeof window !== 'undefined') window.__canonMisses = CANON_MISSES;

const setText = (root, sample, value) => {
  const n = bySample(root, sample);
  if (!n) return miss(sample);
  n.textContent = value;
  return n;
};
const setId = (root, sample, id, climb = 0) => {
  const n = bySample(root, sample);
  if (!n) return null;
  const target = climb ? control(n, climb) : n;
  target.id = id;
  return target;
};

export function renderCanonLibrary(host, ctx) {
  const { prescription, streak, level, onRun } = ctx;
  // WHICH COMPOSITION. 5b is a 756px column; 7a is the 1418x738 desktop frame,
  // drawn after Mark pointed out the app was using half his screen. They are
  // different compositions, not one reflowing, so the caller names the one it
  // wants and everything below binds to whichever arrived.
  const screen = CANON[ctx.screen] ? ctx.screen : 'library';
  applyInherited(host, screen);
  // a person can be typing in the search box while this runs
  CANON_MISSES.length = 0;
  const focus = captureFocus(host);
  const root = mountMarkup(host, CANON[screen]);
  if (screen === 'library-desktop') applyCanonZoom(root);

  // Resolve the sample song rows NOW, before anything else rewrites text.
  // bySample finds the FIRST node with that text, and the moment the
  // recommendation is bound to a real song the hero can carry the same title as
  // a row: "Für Elise" then resolved to the hero, the row walk climbed past
  // the list looking for a parent that was never coming, and the whole library
  // threw. Order of binding is not a detail here.
  const rowAnchors = findRowAnchors(root);

  // ---- rail: status ----
  setText(root, 'LVL 1', `LVL ${level.n}`);
  setText(root, '80/100', `${level.xp}/${level.next}`);
  setText(root, '1 day rhythm', `${streak.current} day rhythm`);
  setText(root, 'best 1', `best ${streak.best}`);
  const lvlEl = bySample(root, `LVL ${level.n}`);
  if (lvlEl) lvlEl.id = 'game-level';
  const rc = bySample(root, `${streak.current} day rhythm`);
  if (rc) rc.id = 'rhythm-chip';

  // the search field is a REAL input in the canon; the app reads .value off it
  const search = root.querySelector('input[type="search"]');
  if (search) {
    search.id = 'lib-search';
    search.addEventListener('input', () => ctx.onSearch?.(search.value));
  }

  // ---- the tab strip, found structurally (10a moved it into the content) ----
  // The old rule was "a tab is a label whose rect sits above y=90", which was
  // true of exactly one composition. The structural truth: the four shelf
  // labels whose CONTROLS share one parent and sit on one horizontal line.
  const TAB_LABELS = ['Learning', 'Repertoire', 'Hall of fame', 'Explore'];
  const tabStrip = (() => {
    const byParent = new Map();
    for (const label of TAB_LABELS) {
      for (const e of root.querySelectorAll('*')) {
        if (e.children.length || e.textContent.trim() !== label) continue;
        const c = control(e);
        const p = c.parentElement;
        if (!p) continue;
        if (!byParent.has(p)) byParent.set(p, new Map());
        if (!byParent.get(p).has(label)) byParent.get(p).set(label, c);
      }
    }
    for (const [p, found] of byParent) {
      if (found.size !== 4) continue;
      const ys = [...found.values()].map((c) => c.getBoundingClientRect().y);
      if (Math.max(...ys) - Math.min(...ys) <= 10) return { parent: p, controls: found };
    }
    return null;
  })();

  // ---- rail: the dock ----
  const dock = [
    ['Repertoire', () => ctx.onTab?.('repertoire')],
    ['Free play', () => ctx.onTool?.('btn-freeplay')],
    ['Metronome', () => ctx.onTool?.('btn-metronome')],
    ['Latency calibration', () => ctx.onTool?.('btn-calibrate')],
    // the rail's voice readout is a control, not a caption; it was dead
    ['Voice', () => ctx.onTool?.('btn-voice')],
  ];
  for (const [label, fn] of dock) {
    const n = bySample(root, label);
    if (!n) continue;
    const c = control(n);
    // a label that IS a tab is the tab's, not the dock's (10a has no rail
    // Repertoire; binding the tab twice fired two renders per click)
    if (tabStrip && tabStrip.parent.contains(c)) continue;
    c.addEventListener('click', fn);
    c.style.cursor = 'pointer';
  }
  const resume = bySample(root, 'Resume the session');
  if (resume) { const c = control(resume); c.addEventListener('click', () => onRun?.(prescription)); c.style.cursor = 'pointer'; }

  // ---- the four shelves, now tabs ----
  const counts = ctx.counts;
  const tabControls = [];
  const tabs = [['Learning', 'sec-learning', counts.learning], ['Repertoire', 'sec-repertoire', counts.repertoire],
                ['Hall of fame', 'sec-fame', counts.fame], ['Explore', 'sec-explore', counts.explore]];
  for (const [label, id, n] of tabs) {
    const c = tabStrip?.controls.get(label);
    if (!c) continue;
    c.id = id;
    c.addEventListener('click', () => ctx.onTab?.(id.replace('sec-', '')));
    c.style.cursor = 'pointer';
    const countEl = c.querySelector('*:not(:first-child)');
    if (countEl && /^\d+$/.test(countEl.textContent.trim())) countEl.textContent = String(n);
    if (id === 'sec-learning' && countEl) countEl.id = 'learn-count';
    tabControls.push({ id: id.replace('sec-', ''), el: c });
  }
  // The active tab has to LOOK active, and clicking one has to CHANGE THE
  // TABLE. Before 2026-08-29 the click only toggled a collapse flag the canon
  // renderer never read, so tapping Hall of fame did nothing a person could
  // see, which is indistinguishable from broken, and Mark called it exactly
  // that. The active look is harvested from the design's own Learning tab
  // (drawn selected) against its neighbours, never invented here.
  if (ctx.activeTab && tabControls.length > 1) {
    // an activeTab that matches nothing ('search') styles every tab inactive,
    // so the Learning underline does not sit there lying during a search
    const activeEl = tabControls.find((t) => t.id === ctx.activeTab)?.el ?? null;
    segmentVariants(tabControls.map((t) => t.el), (el) => el === activeEl);
  }

  // the table's sort control. Two buttons the design draws as a segment, and
  // neither did anything: the app's own sort lives on #explore-sort.
  const sortPair = [['Weakest', 'diff'], ['A to Z', 'az']]
    .map(([label, mode]) => ({ el: bySample(root, label), mode }))
    .filter((x) => x.el);
  if (sortPair.length === 2) {
    const members = sortPair.map((x) => control(x.el));
    for (const { el, mode } of sortPair) {
      const c = control(el);
      c.style.cursor = 'pointer';
      c.addEventListener('click', () => ctx.onSort?.(mode));
    }
    if (ctx.sortMode) {
      const active = sortPair.find((x) => x.mode === ctx.sortMode);
      if (active) segmentVariants(members, (el) => el === control(active.el));
    }
  }

  // ---- the recommendation (council redraw 2026-08-30) ----------------------
  // The 666x516 billboard is gone. The recommendation is a pinned 412x166
  // module in the grid's first three columns. Its two states live on the
  // STATES BOARD as #rec-module-song and #rec-module-skill, where every
  // liftable module in this app lives: the SKILL state carries no artwork at
  // all, because inventing a sleeve for a skill is a lie, and an empty plate
  // is what Mark was looking at. (They were briefly drawn in an annex under
  // 10a; that made the board 980 tall and blinded the pixel gate.)
  const moduleIn = (scope) => {
    if (!scope) return null;
    return [...scope.querySelectorAll('div')]
      .filter((d) => {
        const r = d.getBoundingClientRect();
        // module-sized, never the button ROW inside it (it holds both words too)
        return /Start/.test(d.textContent) && /Choose another/.test(d.textContent)
          && r.height >= 100 && r.width >= 300;
      })
      .sort((a, b) => (a.getBoundingClientRect().width * a.getBoundingClientRect().height)
        - (b.getBoundingClientRect().width * b.getBoundingClientRect().height))[0] ?? null;
  };
  if (prescription && !prescription.song && !prescription.art) {
    const t = document.createElement('template');
    t.innerHTML = CANON['states'] ?? '';
    const skillMod = t.content.querySelector('#rec-module-skill');
    const songMod = moduleIn(root);
    if (skillMod && songMod) {
      const clone = skillMod.cloneNode(true);
      clone.removeAttribute('id');   // that id is the design's, not the app's
      songMod.replaceWith(clone);
    }
  }
  if (prescription) {
    // SCOPE EVERY WRITE TO THE MODULE. Two states carry two sets of samples,
    // and one of the skill state's samples ("Chords from a symbol") is also
    // the sample headline of the YOUR PATH card further down the same board:
    // an unscoped bind overwrote the path teaser with the song title and
    // reported a phantom miss. The module is the only place these belong.
    const rec = moduleIn(root) ?? root;
    // AND SKIP THE EYEBROW. The 756 column sets "DO THIS NEXT" in Fraunces too
    // (the desktop module uses the mono label face), so "the first Fraunces
    // leaf" was the eyebrow there and the phone hero announced the song title
    // twice, once where its own label belongs. The label knows its own name.
    const label = bySample(rec, 'DO THIS NEXT');
    const headline = [...rec.querySelectorAll('*')].find((e) => e !== label && !e.children.length
      && /Fraunces/.test(e.getAttribute('style') ?? '') && e.textContent.trim());
    if (headline) headline.textContent = prescription.title;
    const reason = bySample(rec, 'John Williams, arranged for two hands. Nothing banked yet, start on the easy tier.')
      ?? bySample(rec, 'last tested 4 days ago');
    if (reason) { reason.textContent = prescription.reason; reason.id = 'next-action-reason'; }
    if (label) label.id = 'next-action-label';
    if (headline) control(headline, 3).id = 'next-action';
    const img = rec.querySelector('img[data-art]') ?? rec.querySelector('img');
    if (img) {
      // No song yet means no sleeve. An empty src is not "no image": the
      // browser draws a broken-image glyph, which is how the very first screen
      // a new user sees ended up with one.
      // 512, not 96: the hero plate is 258 CSS px and rising, and a 96 request
      // resolves to the art/128 THUMBNAIL, which the browser then stretched.
      // Mark, 2026-08-30: the hero read as a blur. Ask for the big file.
      const src = prescription.art ?? (prescription.song ? coverDataUrl(prescription.song, 512) : null);
      if (src) { img.src = src; img.hidden = false; } else { img.removeAttribute('src'); img.hidden = true; }
      img.alt = '';
      img.removeAttribute('data-art');
      img.id = 'next-action-cover';
    }
    const start = bySample(rec, 'Start');
    if (start) { const c = control(start); c.addEventListener('click', () => onRun?.(prescription)); c.style.cursor = 'pointer'; }
    const another = bySample(rec, 'Choose another');
    if (another) { const c = control(another); c.addEventListener('click', () => ctx.onChooseAnother?.()); c.style.cursor = 'pointer'; }
  }

  // ---- the hero's ambient glow follows the REAL artwork -------------------
  // The richness pass asked for "a soft ambient glow bled from that artwork's
  // own colours". What the artboard shipped is a decorative textless <i>
  // overlay (absolute, 560x330, pointer-events none) carrying a radial in the
  // HAND colours, amber .22 over cyan .10, sampled from the Dr. Dre sleeve. On
  // the green panel it reads as a swampy wash whatever song is showing, and
  // Mark called it: "theres some weird green colour fade here, should it be
  // like that?" No. The glow now samples the actual hero sleeve, and an artless
  // hero gets no glow, because a glow from nothing is a lie in light.
  const glowLayers = [...root.querySelectorAll('i[style*="radial-gradient"], span[style*="radial-gradient"], div[style*="radial-gradient"]')]
    .filter((el) => !el.textContent.trim() && !el.querySelector('img'));
  const heroBand = bySample(root, 'DO THIS NEXT')?.closest('div[style*="background"]')
    ?? bySample(root, 'DO THIS NEXT')?.parentElement?.parentElement;
  for (const layer of glowLayers) {
    if (heroBand && !heroBand.contains(layer) && !layer.parentElement?.contains(heroBand)) continue;
    const heroImg2 = root.querySelector('#next-action-cover, [id="next-action-cover"]') ?? heroBand?.querySelector('img');
    if (!prescription?.song && !prescription?.art) { layer.style.display = 'none'; continue; }
    if (!heroImg2) continue;
    const paint = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 8;
        const x = c.getContext('2d');
        x.drawImage(heroImg2, 0, 0, 8, 8);
        const d = x.getImageData(0, 0, 8, 8).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
        const n = d.length / 4;
        r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
        const max = Math.max(r, g, b, 1);
        if (max < 90) { const k = 110 / max; r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k); }
        layer.style.background =
          `radial-gradient(58% 120% at 20% 46%, rgba(${r},${g},${b},.20), rgba(${r},${g},${b},0) 68%)`;
        layer.style.display = '';
      } catch { layer.style.display = 'none'; }
    };
    if (heroImg2.complete && heroImg2.naturalWidth) paint();
    else heroImg2.addEventListener('load', paint, { once: true });
  }

  // ---- the rows, then everything the canon absorbed ----
  // 10a (2026-08-29) replaced the ledger table with an art-forward TILE GRID;
  // the 756 column still draws rows. Try the grid first, structurally.
  if (!renderTiles(root, ctx)) renderRows(root, ctx, rowAnchors);
  bindDashboard(root, ctx);
  bindAllTools(root, ctx);
  bindFreezeOffer(root, ctx);

  // the binders above graft ids onto designed nodes; take those ids back off
  // the hidden legacy copy so nothing resolves twice
  reclaimIds(host);
  // the library REMOUNTS on every render, which discards anything the mount
  // added, so the accessible names have to be reapplied here or the two collapse
  // chevrons go back to being nameless the first time the screen re-renders
  nameControls(root);
  restoreFocus(host, focus);
  return root;
}

// ---- repeated groups -------------------------------------------------------
// A group of rows the design drew N of. Resolve them by their own sample text,
// keep the last as the template, and harvest any two-state appearance (a ticked
// box vs an empty one) from the samples themselves. Same discipline as the tier
// pips: the design owns how a state looks, this file owns which state.
function rowsFromSamples(root, samples, tag = 'button') {
  // 10a draws the quest and mission rows as SPANS, not buttons: fall back to
  // the leaf's structural row (label-group's parent) when no button exists.
  const rows = samples.map((t) => {
    const leaf = bySample(root, t);
    if (!leaf) return null;
    return leaf.closest(tag) ?? leaf.parentElement?.parentElement ?? null;
  }).filter(Boolean);
  return rows.length === samples.length ? rows : [];
}

// the two appearances of a checkbox, taken from a sample that is ticked and one
// that is not
function checkVariants(rows, doneIndex) {
  // the checkbox is the row's <i> glyph; on the desktop boards it nests one
  // level down, so firstElementChild alone grabbed the whole label group
  const boxOf = (r) => r.querySelector('i') ?? r.firstElementChild;
  const onEl = rows[doneIndex] ? boxOf(rows[doneIndex]) : null;
  const offRow = rows.find((r, i) => i !== doneIndex && boxOf(r));
  const offEl = offRow ? boxOf(offRow) : null;
  return {
    on: onEl ? { style: onEl.getAttribute('style'), html: onEl.innerHTML } : null,
    off: offEl ? { style: offEl.getAttribute('style'), html: offEl.innerHTML } : null,
  };
}
function setCheck(row, done, v) {
  const box = row.querySelector('i') ?? row.firstElementChild;
  const want = done ? v.on : v.off;
  if (!box || !want) return;
  if (want.style != null) box.setAttribute('style', want.style);
  box.innerHTML = want.html;
}

// Fill a designed group with real items: reuse the drawn rows, clone the last
// one when there are more items than the design sampled, drop the spares when
// there are fewer. Never invent a row shape.
function fillGroup(rows, items, fill) {
  if (!rows.length) return;
  const parent = rows[0].parentElement;
  const template = rows[rows.length - 1];
  const live = [...rows];
  while (live.length < items.length) {
    const clone = template.cloneNode(true);
    parent.insertBefore(clone, live[live.length - 1].nextSibling);
    live.push(clone);
  }
  while (live.length > items.length) live.pop().remove();
  live.forEach((row, i) => fill(row, items[i], i));
}

// ---- the dashboard the canon absorbed --------------------------------------
// The canon library is not the old library reskinned: it swallowed the game
// row, the recommendation, the quests, the form card, the practice chart and
// the path teaser, each of which was its own renderer in the app. So each needs
// its slot bound here or it ships the design's sample text as if it were the
// user's data, which is worse than an empty state because it reads as real.
function bindDashboard(root, ctx) {
  const T = (sample, value) => { if (value != null) setText(root, sample, value); };

  if (ctx.carryOn) { T('Resume the session', ctx.carryOn.title); T('Chords from a symbol', ctx.carryOn.sub); }
  T('140', ctx.metronomeBpm);
  T('Grand', ctx.voiceName);
  if (ctx.keyboard) {
    T('No keyboard', ctx.keyboard.title);
    T('Screen taps. Plug your keyboard in for the real thing.', ctx.keyboard.sub);
  }

  // The table header names the ACTIVE tab and carries its count. Before this
  // it said LEARNING forever, whatever the table was actually showing.
  const header = bySample(root, 'LEARNING, WEAKEST FIRST');
  if (header && header.parentElement) {
    if (ctx.tableTitle) header.textContent = ctx.tableTitle;
    const count = [...header.parentElement.children].find((c) => c !== header && /^\d+$/.test(c.textContent.trim()));
    if (count && ctx.learningTotal != null) count.textContent = String(ctx.learningTotal);
  }
  const more = bySample(root, 'Show the other 7 in Learning');
  if (more) {
    const hidden = Math.max(0, (ctx.learningTotal ?? 0) - (ctx.rows?.length ?? 0));
    const word = ctx.tabWord ?? 'Learning';
    // THE ALBUM WALL NEEDS A DOOR EVEN WHEN NOTHING IS HIDDEN. Once the grid
    // filled tall windows, every song fitted, this tile hid itself, and the
    // full-screen wall became unreachable. It is a viewing mode, not just an
    // overflow escape, so it stays and says what it does.
    more.textContent = hidden > 0
      ? `Show the other ${hidden} in ${word}`
      : `See all ${ctx.learningTotal ?? 0} in ${word}`;
    const c = control(more);
    // NOT the hidden attribute: [hidden] hides via a user-agent display:none,
    // and every element in the canon carries an inline display, which wins, so
    // the row stayed on screen saying "Show the other 0 in Learning".
    // And NOT display:'' to show it again: clearing the property deletes the
    // design's own inline display:flex, which dropped the chevron onto its own
    // line. Put back exactly what the design had.
    const shown = c.style.display;
    // TAG WHY it is hidden: "nothing left to show" is not "it did not fit",
    // and the elastic sweep must not resurrect it by evicting a real tile.
    delete c.dataset.moreEmpty;      // it never hides now: the wall keeps its door
    c.style.display = shown;
    c.style.cursor = 'pointer';
    // Mark, 2026-08-29: this tile opens the FULL-SCREEN sleeve wall (12a)
    // where the board exists; the in-place expansion stays the fallback.
    c.addEventListener('click', () => {
      if (CANON['library-gallery'] && desktopFits()) { openLibraryGallery(ctx); return; }
      ctx.onShowMore?.();
    });
  }

  // The CHOOSE-1 cards (council round, 2026-08-30). The code truth is one
  // paid quest a day and one mission a week; the drawn card says so now:
  // every option stays visible, the CHOSEN row is expanded with its live
  // line, the ghosts remain clickable until completion. Both templates and
  // their looks are the design's own two drawn row variants.
  const bindChooseCard = (kickerText, items, onPick) => {
    const kick = bySample(root, kickerText);
    if (!kick || !items) return false;
    let card = kick.parentElement;
    while (card && !card.querySelector('button')) card = card.parentElement;
    if (!card) return false;
    const rows = [...card.querySelectorAll('button')];
    const chosenTpl = rows.find((r2) => /CHOSEN/.test(r2.textContent))?.cloneNode(true);
    const plainTpl = rows.find((r2) => !/CHOSEN/.test(r2.textContent))?.cloneNode(true);
    if (!chosenTpl || !plainTpl || !rows.length) return false;
    const col = rows[0].parentElement;
    // deal back WHERE the drawn rows were: the 756 card keeps its footer in
    // the same column, and plain appending shoved the rows below it
    const anchor = rows[rows.length - 1].nextSibling;
    for (const r2 of rows) r2.remove();
    for (const it of items) {
      const row = (it.chosen ? chosenTpl : plainTpl).cloneNode(true);
      const label = [...row.querySelectorAll('span')].find((s) => !s.children.length
        && /700 12px/.test(s.getAttribute('style') ?? '') && !/^(CHOSEN|\+\d+)$/.test(s.textContent.trim()));
      if (label) label.textContent = it.label;
      if (it.chosen) {
        const xp = [...row.querySelectorAll('span')].find((s) => !s.children.length && /^\+\d+$/.test(s.textContent.trim()));
        if (xp && it.xp != null) xp.textContent = `+${it.xp}`;
        const line = [...row.querySelectorAll('span')].find((s) => !s.children.length
          && /400 11px/.test(s.getAttribute('style') ?? '') && s !== label
          && s.textContent.trim() !== 'CHOSEN');
        if (line) line.textContent = it.line ?? it.why ?? '';
      }
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => onPick(it));
      col.insertBefore(row, anchor);
    }
    return true;
  };

  // today's quests: the CHOOSE-1 card on the desktop board, the old ticked
  // trio on the 756 column until its own redraw lands
  if (ctx.quests && !bindChooseCard('TODAY · CHOOSE 1', ctx.quests, (q) => ctx.onQuest?.(q))) {
    const rows = rowsFromSamples(root, ['Master a section', '10 real minutes, done', 'One clean run']);
    const v = checkVariants(rows, 1);
    T('1 of 3 done', `${ctx.quests.filter((q) => q.done).length} of ${ctx.quests.length} done`);
    fillGroup(rows, ctx.quests, (row, q) => {
      const leaves = [...row.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim());
      if (leaves[0]) leaves[0].textContent = q.label;
      if (leaves[1]) leaves[1].textContent = `+${q.xp}`;
      setCheck(row, q.done, v);
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => ctx.onQuest?.(q));
    });
  }

  // the weekly mission, same law
  if (ctx.mission && !bindChooseCard('THIS WEEK · CHOOSE 1', ctx.mission.items, (m) => ctx.onMission?.(m))) {
    const rows = rowsFromSamples(root, ['Make one song truly yours', 'Bank two song proofs', 'Three practice days']);
    const v = checkVariants(rows, -1);
    T('+150 each', ctx.mission.each);
    fillGroup(rows, ctx.mission.items, (row, m) => {
      const leaf = [...row.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim());
      if (leaf) leaf.textContent = m.label;
      setCheck(row, m.done, v);
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => ctx.onMission?.(m));
    });
  }

  // Practice, last 7 days. The design carries the VALUE as the bar's own height
  // percentage, not as a child fill, and it draws three different bars: an
  // outlined one for a past day with minutes, a dashed baseline for a day with
  // none, and a solid accent one for today. Harvest all three, and read the
  // scale out of the design too - its tallest bar is the top of the axis - so
  // no percentage in here is a number anybody chose.
  if (ctx.practice?.length) {
    const todayLabel = bySample(root, 'today');
    const strip = todayLabel?.parentElement;
    // the bars row is the PRIOR SIBLING CARRYING %-HEIGHTS: the council round
    // slid a headline between them and the naive previousElementSibling crashed
    let bars = strip?.previousElementSibling;
    while (bars && ![...bars.children].some((el) => /height\s*:\s*[\d.]+%/.test(el.getAttribute('style') ?? ''))) {
      bars = bars.previousElementSibling;
    }
    if (strip && bars) {
      // The council redraw made a ZERO day a full-height WRAPPER holding a
      // dashed baseline, so its own height reads 100% and the old percentage
      // reader scaled every bar against a wrapper. A wrapper is recognised by
      // its align-items:flex-end and counts as zero.
      const isWrap = (el) => /align-items:\s*flex-end/.test(el.getAttribute('style') ?? '');
      const drawn = [...bars.children];
      const pctOf = (el) => isWrap(el) ? 0 : parseFloat((el.getAttribute('style') || '').match(/height\s*:\s*([\d.]+)%/)?.[1] ?? '0');
      const styleOf = (el) => el.getAttribute('style');
      const pcts = drawn.map(pctOf);
      const maxPct = Math.max(...pcts);
      const minPct = Math.min(...pcts.filter((p) => p > 0));
      const zeroTpl = drawn.find(isWrap)?.cloneNode(true) ?? null;
      const shape = {
        today: styleOf(drawn[drawn.length - 1]),
        zero: styleOf(drawn.find((el, i) => pctOf(el) === 0 && !isWrap(el) && i < drawn.length - 1) ?? drawn[0]),
        value: styleOf(drawn.find((el, i) => pctOf(el) > 0 && !isWrap(el) && i < drawn.length - 1) ?? drawn[0]),
      };
      const max = Math.max(1, ...ctx.practice.map((d) => d.minutes));
      const labels = [...strip.children];
      ctx.practice.forEach((d, i) => {
        if (labels[i]) labels[i].textContent = d.isToday ? 'today' : d.label;
        const bar = bars.children[i];
        if (!bar) return;
        if (d.minutes <= 0 && !d.isToday && zeroTpl) {
          const z = zeroTpl.cloneNode(true);
          z.title = `${d.label}: 0 min`;
          bar.replaceWith(z);
          return;
        }
        const base = d.isToday ? shape.today : d.minutes > 0 ? shape.value : shape.zero;
        bar.setAttribute('style', base);
        if (bar.children.length) bar.innerHTML = ''; // a repurposed wrapper sheds its baseline child
        if (d.minutes > 0 || d.isToday) {
          const pct = d.minutes > 0 ? Math.max(minPct, Math.round((d.minutes / max) * maxPct)) : 0;
          bar.style.height = `${pct}%`;
        }
        bar.title = `${d.label}: ${Math.round(d.minutes)} min`;
      });
    }
    // the council's measurement rulings: a chart is decorative until it
    // carries its total and its trend
    // board-conditional slots: only the compositions that DRAW them bind them
    if (ctx.practiceHead && bySample(root, '84 MIN · 4 DAYS')) T('84 MIN · 4 DAYS', ctx.practiceHead);
    if (ctx.practiceTrend && bySample(root, '+18% vs previous 7 days')) T('+18% vs previous 7 days', ctx.practiceTrend);
  }

  if (ctx.path) {
    T('Chords from a symbol', ctx.path.skill);
    // the 4-line teaser replaced this sample; bind it only where it exists
    if (bySample(root, 'Skill 2 of 5. Stage: independent, one stage short of retained.')) T('Skill 2 of 5. Stage: independent, one stage short of retained.', ctx.path.stage);
    // the four-line teaser (council round): action and evidence are value slots
    if (ctx.path.action && bySample(root, 'Build Cm7 and F7 from the symbol, left hand alone.')) T('Build Cm7 and F7 from the symbol, left hand alone.', ctx.path.action);
    if (ctx.path.evidence != null && bySample(root, 'Independent for six days. Decays Thursday.')) T('Independent for six days. Decays Thursday.', ctx.path.evidence);
    // Only write this when it is genuinely known. Writing "0 OF 5 STAGES" while
    // the design's own pips still showed four filled was the port contradicting
    // itself on screen, and a confident wrong number is worse than the sample.
    if (ctx.path.stagesDone != null && ctx.path.stagesTotal != null) {
      T('4 OF 5 STAGES', `${ctx.path.stagesDone} OF ${ctx.path.stagesTotal} STAGES`);
      const bar = bySample(root, `${ctx.path.stagesDone} OF ${ctx.path.stagesTotal} STAGES`)?.parentElement;
      if (bar) {
        const pips = [...bar.children].filter((e) => e !== bySample(root, `${ctx.path.stagesDone} OF ${ctx.path.stagesTotal} STAGES`) && !e.textContent.trim());
        const on = pips.find((e) => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)')?.getAttribute('style');
        const off = pips.find((e) => getComputedStyle(e).backgroundColor === 'rgba(0, 0, 0, 0)')?.getAttribute('style');
        pips.forEach((pip, i) => {
          const style = i < ctx.path.stagesDone ? on : off;
          if (style) pip.setAttribute('style', style);
        });
      }
    } else {
      // no skill on trial (diagnostic, assessment, done): the drawn 4-of-5
      // sample must not speak for a stage nobody computed
      const bar = bySample(root, '4 OF 5 STAGES')?.parentElement;
      if (bar) {
        if (!bar.dataset.disp) bar.dataset.disp = bar.style.display || 'flex';
        bar.style.display = 'none';
      }
    }
    const go = bySample(root, 'Continue');
    if (go) { const c = control(go); c.addEventListener('click', () => ctx.onPath?.()); c.style.cursor = 'pointer'; }
  }

  const formDone = bySample(root, 'Done, I watched it');
  if (formDone) { const c = control(formDone); c.addEventListener('click', () => ctx.onFormDone?.()); c.style.cursor = 'pointer'; }
  const formSkip = bySample(root, 'Not today');
  if (formSkip) { const c = control(formSkip); c.addEventListener('click', () => ctx.onFormSnooze?.()); c.style.cursor = 'pointer'; }
  // The module obeys the legacy SCHEDULE (due every 7 practice days, snooze
  // holds the day): drawn always-on, it nagged daily and Done never dismissed
  // it (Codex parity B3). Captured inline display, trap 8's rule.
  {
    const kick = bySample(root, 'FORM CHECK');
    let mod = kick;
    while (mod && mod.parentElement && !mod.contains(formDone ?? kick)) mod = mod.parentElement;
    if (mod && kick) {
      if (!mod.dataset.disp) mod.dataset.disp = mod.style.display || 'block';
      mod.style.display = ctx.formCheckDue ? mod.dataset.disp : 'none';
    }
  }
}


// ---- the freeze offer (CANON-GAPS Gap C, closed 2026-08-29) ----------------
// The design drew this module once, on the states board (6q), and the canon
// library never reached it: renderGameRow does not run under the canon, so a
// broken 3-day rhythm never produced the offer. The module is LIFTED VERBATIM
// out of the states canon (its inline styles are self-contained) and mounted
// into the library only while an offer is live. Recorded deviation: the states
// board draws it in isolation, so its position in the library composition is
// the app's choice (first thing in the frame), not the design's.
let statesFreezeHTML = null;
function bindFreezeOffer(root, ctx) {
  if (!ctx.freeze) return;
  if (statesFreezeHTML === null) {
    const t = document.createElement('template');
    t.innerHTML = CANON['states'] ?? '';
    statesFreezeHTML = t.content.querySelector('#freeze-offer')?.outerHTML ?? '';
  }
  if (!statesFreezeHTML) return;
  const holder = document.createElement('template');
  holder.innerHTML = statesFreezeHTML;
  const offer = holder.content.firstElementChild;
  // the design's sample numbers become the real ones; wording stays byte for byte
  for (const e of offer.querySelectorAll('*')) {
    if (e.children.length) continue;
    const t2 = e.textContent;
    if (/Use a freeze to keep your \d+ day rhythm/.test(t2)) {
      e.textContent = t2.replace(/\d+ day rhythm/, `${ctx.freeze.wouldKeep} day rhythm`);
    } else if (/You have \d+ freezes? left/.test(t2)) {
      e.textContent = t2.replace(/\d+ freezes? left/, `${ctx.freeze.freezes} ${ctx.freeze.freezes === 1 ? 'freeze' : 'freezes'} left`);
    }
  }
  const yes = offer.querySelector('#freeze-yes');
  const no = offer.querySelector('#freeze-no');
  if (yes) yes.addEventListener('click', () => ctx.onFreezeYes?.());
  if (no) no.addEventListener('click', () => ctx.onFreezeNo?.());
  // The states board draws the module in isolation; the library composition
  // has no slot for it, so it floats over the frame rather than reflowing a
  // fixed 738px composition. BOTTOM-RIGHT, not top-left: Codex measured the
  // first placement covering the search field and half the quick rail; the
  // corner over the form check occludes the least-used module and the offer
  // is one click to dismiss either way. Scaffolding position only.
  if (!root.style.position) root.style.position = 'relative';
  offer.style.position = 'absolute';
  offer.style.bottom = '12px';
  offer.style.right = '12px';
  offer.style.zIndex = '40';
  root.insertAdjacentElement('afterbegin', offer);
}

// ---- All tools ------------------------------------------------------------
// Artboard 7b IS this drawer: all 17 tools in three columns, each with a real
// one-line description and a state marker, plus a legend. So there is nothing
// to invent and nothing to lay out. Render the artboard, attach the app's
// handlers to the rows the design already drew, and wire Close.
//
// The rows are matched to the app's tools BY THEIR LABEL, which works because
// the design was briefed from the app's own rail and uses the same seventeen
// words. A tool the drawer does not name is reported rather than dropped.
function openToolsDrawer(ctx, onClose, board = 'alltools') {
  const existing = document.getElementById('canon-tools-drawer');
  if (existing) { existing.remove(); return null; }

  const shade = document.createElement('div');
  shade.id = 'canon-tools-drawer';
  shade.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;overflow:auto';
  // the ground the design assumes behind its own card
  shade.style.background = getComputedStyle(document.body).backgroundColor || '#000';

  const host = document.createElement('div');
  host.style.width = 'max-content';
  shade.appendChild(host);
  document.body.appendChild(shade);

  const root = renderCanonScreen(host, board);
  if (board === 'alltools') applyCanonZoom(root);

  // every tool the app has, flattened, so a row can find its handler
  const byLabel = new Map();
  for (const group of ctx.tools ?? []) for (const item of group.items) byLabel.set(item.label, item);

  const close = () => { shade.remove(); onClose?.(); };
  let wired = 0;
  const unmatched = [];
  for (const el of root.querySelectorAll('*')) {
    if (el.children.length) continue;
    const label = el.textContent.trim();
    const tool = byLabel.get(label);
    if (!tool) continue;
    // the row is the smallest ancestor that also holds the description AND
    // the leading state box; stopping at the text column left every box
    // wearing its drawn sample state (the swap silently never fired)
    let row = el;
    for (let i = 0; i < 3 && row.parentElement; i++) {
      if (row.children.length >= 2) break;
      row = row.parentElement;
    }
    for (let i = 0; i < 2 && row.parentElement && !row.querySelector('i'); i++) row = row.parentElement;
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => { close(); ctx.onTool?.(tool.id); });
    // TRUTH over sample (sample-bleed audit): the drawn rows carried fake
    // per-tool states. Where the app computes a real line, it replaces the
    // sample; a plain description keeps the design's own words. The leading
    // box swaps between the design's own drawn checked/unchecked variants.
    const st = ctx.toolStatus?.[label];
    if (st) {
      if (st.line) {
        const desc = [...row.querySelectorAll('*')].find((x) => !x.children.length && x !== el && x.textContent.trim().length > 6);
        if (desc) desc.textContent = st.line;
      }
      row.dataset.toolDone = st.done ? '1' : '0';
    }
    byLabel.delete(label);
    wired++;
  }
  // swap every leading box to the drawn variant matching its truth, and make
  // the header count honest
  {
    const rows2 = [...root.querySelectorAll('[data-tool-done]')];
    const boxOf = (r) => r.querySelector('i');
    const onBox = rows2.map(boxOf).find((b2) => (b2?.getAttribute('style') ?? '').includes('background:#82bf9c'));
    const onStyle = onBox?.getAttribute('style');
    const onInner = onBox?.innerHTML ?? '';
    const offStyle = rows2.map(boxOf).find((b2) => b2 && !(b2.getAttribute('style') ?? '').includes('background:#82bf9c') && !(b2.getAttribute('style') ?? '').includes('border-bottom'))?.getAttribute('style');
    let doneCount = 0;
    for (const r of rows2) {
      const done = r.dataset.toolDone === '1';
      if (done) doneCount++;
      const b2 = boxOf(r);
      const want = done ? onStyle : offStyle;
      if (b2 && want) { b2.setAttribute('style', want); b2.innerHTML = done ? onInner : ''; }
    }
    const counter = [...root.querySelectorAll('*')].find((x) => !x.children.length && /already set up$/.test(x.textContent.trim()));
    if (counter) counter.textContent = `${doneCount} already set up`;
  }
  for (const [label] of byLabel) unmatched.push(label);
  if (unmatched.length) CANON_MISSES.push('tools drawer has no row for: ' + unmatched.join(', '));

  const closeBtn = bySample(root, 'Close');
  if (closeBtn) { const c = control(closeBtn); c.addEventListener('click', close); c.style.cursor = 'pointer'; }
  shade.addEventListener('click', (ev) => { if (ev.target === shade) close(); });
  document.addEventListener('keydown', function esc(ev) {
    if (ev.key !== 'Escape') return;
    document.removeEventListener('keydown', esc);
    close();
  });
  return { wired, unmatched };
}

// ---- the 12a SLEEVE WALL (2026-08-29) ---------------------------------------
// Mark: "see all the songs take up the whole screen with all the album art".
// Artboard 12a IS that wall: a thin strip (Library out, shelf kicker, search)
// over a full-width flex-wrap of 208px sleeves that overflows past the frame.
// Same discipline as the drawer: render the board, deal real tiles into the
// design's own cells, write no colour, size, radius or spacing.
function openLibraryGallery(ctx) {
  const existing = document.getElementById('canon-gallery');
  if (existing) { existing.remove(); return null; }
  if (!CANON['library-gallery']) return null;

  const shade = document.createElement('div');
  shade.id = 'canon-gallery';
  shade.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;overflow:auto';
  shade.style.background = getComputedStyle(document.body).backgroundColor || '#000';
  const host = document.createElement('div');
  host.style.width = 'max-content';
  shade.appendChild(host);
  document.body.appendChild(shade);
  const root = renderCanonScreen(host, 'library-gallery');
  applyCanonZoom(root);

  const close = () => { shade.remove(); };
  const back = bySample(root, 'Library');
  if (back) { const cb = control(back); cb.style.cursor = 'pointer'; cb.addEventListener('click', close); }
  document.addEventListener('keydown', function esc(ev) {
    if (ev.key !== 'Escape') return;
    document.removeEventListener('keydown', esc);
    close();
  });

  const leaves = (el) => [...el.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim());
  const STATES = ['Banked', 'Needs work', 'Not started'];
  const rows = ctx.galleryRows ?? ctx.rows ?? [];

  // the wall: the container holding many identically-styled tile cells
  const firstTitle = leaves(root).find((l) => /Fraunces/.test(l.getAttribute('style') ?? ''));
  let cell = firstTitle, wall = null;
  while (cell && cell.parentElement) {
    const sibs = [...cell.parentElement.children].filter((s) => s.getAttribute('style') === cell.getAttribute('style'));
    if (sibs.length >= 8) { wall = cell.parentElement; break; }
    cell = cell.parentElement;
  }
  if (!wall) { CANON_MISSES.push('gallery: no tile wall found'); return { tiles: 0 }; }
  const tiles = [...wall.children].filter((c2) => c2.getAttribute('style') === cell.getAttribute('style'));

  // harvest the three drawn state appearances, renderTiles' rule
  const stateVariants = new Map();
  const stateSpanOf = (tile) => leaves(tile).map((x) => ({ l: x, w: x.textContent.trim() }))
    .filter((x) => STATES.includes(x.w)).map((x) => x.l.parentElement)[0] ?? null;
  for (const tile of tiles) {
    const span = stateSpanOf(tile);
    if (!span) continue;
    const word = span.textContent.trim();
    if (!stateVariants.has(word)) {
      stateVariants.set(word, { i: span.querySelector('i')?.getAttribute('style') ?? null,
        // THE TICK IS NOT DECORATION. Banked's box carries a mark inside it and
        // the other two are empty; swapping only the <i>'s style left every
        // dealt Banked chip a bare green square, which is hue alone doing the
        // work. The mark travels with the variant.
        mark: span.querySelector('i')?.innerHTML ?? '',
        word: [...span.children].find((ch) => ch.tagName === 'SPAN')?.getAttribute('style') ?? null });
    }
  }
  const template = tiles.find((t) => t.querySelector('img'))?.cloneNode(true);
  const plateTpl = tiles.find((t) => !t.querySelector('img'))?.cloneNode(true) ?? null;
  if (!template) { CANON_MISSES.push('gallery: no sleeve tile template'); return { tiles: 0 }; }
  const monogram = (title) => {
    const words = String(title ?? '').split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    if (words[0].length === 1) return words[0].toUpperCase();
    return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  };

  for (const t of tiles) t.remove();
  const built = [];
  for (const song of rows) {
    const real = song.song ?? song;
    // ☠️ `real.group` alone misses every SINGLE-TIER song. Happy Birthday and the
    // standalone scales have no `group` field, so this never looked for their
    // sleeve at all and they kept drawing the monogram plate while every song
    // around them had art. Everywhere else in the app the key is `group ?? id`.
    const sleeveKey = real.group ?? real.id ?? song.id;
    const hasSleeve = !!song.art || !!(sleeveKey && sleeveUrlByGroup(sleeveKey, 512));
    const tile = (hasSleeve || !plateTpl ? template : plateTpl).cloneNode(true);
    wall.appendChild(tile);
    built.push(tile);
    const img = tile.querySelector('img');
    if (img) {
      // a wall of 512px jpgs decodes ~1MB each: lazy + async keeps the open snappy
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = song.art || coverDataUrl(real, 208);
      img.alt = '';
      img.removeAttribute('data-art');
      const glow = tile.querySelector('i[style*="blur("]');
      if (glow) paintArtGlow(glow, img);
    } else {
      // the plate's Georgia display leaf is the monogram slot
      const mono = leaves(tile).find((l) => /Georgia/i.test(l.getAttribute('style') ?? ''));
      if (mono) mono.textContent = monogram(song.title);
    }
    const title = leaves(tile).find((l) => /Fraunces/.test(l.getAttribute('style') ?? ''));
    if (title) title.textContent = song.title;
    const span = stateSpanOf(tile);
    if (span) {
      const v = stateVariants.get(song.state);
      const wordEl = [...span.children].find((ch) => ch.tagName === 'SPAN');
      if (wordEl) wordEl.textContent = song.state;
      if (v) {
        const shape = span.querySelector('i');
        if (v.i && shape) shape.setAttribute('style', v.i);
        if (shape) shape.innerHTML = v.mark ?? '';
        if (v.word && wordEl) wordEl.setAttribute('style', v.word);
      }
    }
    const plays = leaves(tile).filter((l) => /^\d+$/.test(l.textContent.trim())).pop();
    if (plays && song.plays != null) plays.textContent = String(song.plays);
    if (song.onOpen) {
      tile.style.cursor = 'pointer';
      tile.addEventListener('click', () => { close(); song.onOpen(song); });
    }
  }

  // the shelf kicker, a value slot: "EXPLORE · 17 SONGS" is the drawn sample
  const kicker = leaves(root).find((l) => /·\s*\d+\s*SONGS?$/.test(l.textContent.trim()));
  const word = (ctx.tabWord ?? 'Learning').toUpperCase();
  const setKicker = (n) => { if (kicker) kicker.textContent = `${word} · ${n} ${n === 1 ? 'SONG' : 'SONGS'}`; };
  setKicker(rows.length);

  // a search that matches nothing gets the design's OWN no-results module
  // (the states board's dashed plate), lifted verbatim, the renderTiles rule:
  // a silent black wall answers nobody
  let emptyMod = null;
  const setEmpty = (show) => {
    if (show && !emptyMod) {
      const t = document.createElement('template');
      t.innerHTML = CANON['states'] ?? '';
      const frag = t.content.querySelector('#list-results')?.firstElementChild?.cloneNode(true);
      if (frag) { emptyMod = frag; emptyMod.dataset.disp = frag.style.display || 'block'; wall.appendChild(frag); }
    }
    if (emptyMod) emptyMod.style.display = show ? emptyMod.dataset.disp : 'none';
  };

  // the search input the design drew, kept live: filter tiles by title
  const input = root.querySelector('input');
  if (input) {
    input.value = '';
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let shown2 = 0;
      built.forEach((tile, i) => {
        const hit = !q || String(rows[i]?.title ?? '').toLowerCase().includes(q);
        // trap 8's class: every canon element carries an inline display, so
        // hiding and restoring must round-trip the design's own value
        if (!tile.dataset.disp) tile.dataset.disp = tile.style.display || 'block';
        tile.style.display = hit ? tile.dataset.disp : 'none';
        if (hit) shown2++;
      });
      setKicker(shown2);
      setEmpty(!!q && shown2 === 0);
      sync();
    });
    // typing in the wall should not fall through to the app's key handlers
    input.addEventListener('keydown', (ev) => { if (ev.key !== 'Escape') ev.stopPropagation(); });
  }

  // SCROLL. The design draws the wall absolute inside an overflow:hidden
  // viewport with its own hairline track + thumb on the right edge. Native
  // scroll on the viewport, the native bar stood down; the drawn thumb becomes
  // the live indicator. Its height/offset are TRUTH READOUTS (like counts),
  // not styling: the board itself drew "about a third visible" as a sample.
  const viewport = wall.parentElement;
  const bars = [...viewport.children].filter((c2) => c2 !== wall && c2.tagName === 'I');
  const track = bars.find((b2) => (b2.getAttribute('style') ?? '').includes('bottom'));
  const thumb = bars.find((b2) => (b2.getAttribute('style') ?? '').includes('height'));
  viewport.style.overflowY = 'auto';
  viewport.style.scrollbarWidth = 'none';
  const sync = () => {
    const sh = viewport.scrollHeight, ch = viewport.clientHeight, st = viewport.scrollTop;
    // the indicators scroll with the content (absolute in the scroller), so
    // they ride scrollTop back into place
    if (track) track.style.transform = `translateY(${st}px)`;
    if (thumb) {
      const trackH = ch - 32;
      const frac = Math.min(1, ch / Math.max(1, sh));
      const h = Math.max(24, Math.round(trackH * frac));
      const y = st + ((sh > ch) ? (st / (sh - ch)) * (trackH - h) : 0);
      thumb.style.height = h + 'px';
      thumb.style.transform = `translateY(${y}px)`;
      const hide = frac >= 1 ? 'hidden' : 'visible';
      thumb.style.visibility = hide;
      if (track) track.style.visibility = hide;
    }
  };
  viewport.addEventListener('scroll', sync);
  sync();
  return { tiles: built.length };
}

// ---- All tools, the 756px fallback -----------------------------------------
// The canon's rail ends with "All tools 17" and the line "Learn 3, Practise 9,
// Tools 5. Searchable, nothing removed." Nothing in the canon shows what opens.
// That is a real design gap, recorded in design-2026-08/CANON-GAPS.md, and it
// is not a cosmetic one: under the flag those seventeen controls live on the
// hidden legacy markup, so most of the app is simply unreachable.
//
// Until the artboard exists, the panel is built from the design's OWN dock
// button and its OWN group label, cloned. That is the same discipline as every
// other binder here - reuse the control the design drew rather than invent a
// look for one it did not enumerate - and the counts come from the app, not
// from the sample copy, so they cannot drift apart.
function bindAllTools(root, ctx) {
  const trigger = bySample(root, 'All tools');
  if (!trigger) return;
  const triggerBtn = control(trigger);

  // The TRIGGER is wired first and unconditionally. 10a dropped the 7a rail's
  // "MOST USED" group label, and requiring it before wiring anything left the
  // All tools control DEAD on the new library: the clickable gate caught it at
  // 94/95. The in-rail expansion below is a fallback for widths where no
  // drawer board exists, and only IT needs the templates.
  triggerBtn.style.cursor = 'pointer';
  let panel = null;
  triggerBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    // 7b at full width, 9c below it: the judge round drew the narrow drawer,
    // so the improvised in-rail list is retired everywhere it exists.
    const board = desktopFits() ? 'alltools' : 'alltools-narrow';
    if (CANON[board]) { openToolsDrawer(ctx, undefined, board); return; }
    if (panel) panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  });

  const dockItem = bySample(root, 'Free play');
  const groupLabel = bySample(root, 'MOST USED');
  if (!dockItem || !groupLabel) return;

  const itemTemplate = control(dockItem).cloneNode(true);
  const labelTemplate = groupLabel.cloneNode(true);

  panel = document.createElement('div');
  panel.id = 'canon-all-tools';
  panel.style.display = 'none';
  // the rail is a flex column; match it rather than choose a layout
  panel.style.flexDirection = 'column';
  panel.style.gap = getComputedStyle(triggerBtn.parentElement).gap || '';

  const groups = ctx.tools ?? [];
  // Nothing to say means SAY NOTHING. Binding an empty list rewrote the count to
  // "0" and the summary to ". Searchable, nothing removed.", which is the design
  // speaking nonsense in the user's place. The pixel gate caught it only once it
  // started judging by connectedness rather than by contrast.
  if (!groups.length) return;
  for (const group of groups) {
    const label = labelTemplate.cloneNode(true);
    label.textContent = group.label;
    panel.appendChild(label);
    for (const tool of group.items) {
      const item = itemTemplate.cloneNode(true);
      item.removeAttribute('id');
      const cells = [item, ...item.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim());
      if (cells[0]) cells[0].textContent = tool.label;
      // the dock's second cell is its trailing readout; a tool without one
      // should not inherit "140" from the metronome it was cloned near
      if (cells[1]) cells[1].textContent = tool.note ?? '';
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => ctx.onTool?.(tool.id));
      panel.appendChild(item);
    }
  }
  triggerBtn.parentElement.insertBefore(panel, triggerBtn.nextSibling);

  // the count beside the trigger is the app's, not the artboard's
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  const countCell = [...triggerBtn.querySelectorAll('*')]
    .find((e) => !e.children.length && /^\d+$/.test(e.textContent.trim()));
  if (countCell) countCell.textContent = String(total);
  const summary = bySample(root, 'Learn 3, Practise 9, Tools 5. Searchable, nothing removed.');
  if (summary) {
    summary.textContent = groups.map((g) => `${g.label[0] + g.label.slice(1).toLowerCase()} ${g.items.length}`)
      .join(', ') + '. Searchable, nothing removed.';
  }

}

// The design drew five sample rows, and reading them properly is most of this
// port. Three things are true of them that a quick look misses:
//
//  1. Every row is the SAME six slots: art, title+sub, plays, difficulty,
//     state, tiers. So bind by slot, not by matching sample strings. String
//     matching breaks the moment a state leaves a cell empty (Not started has
//     no difficulty range, Banked does), and it also grabs the drill plate's
//     monogram and writes the song title over it.
//  2. The row has THREE STATES that are painted differently. Banked carries a
//     left accent bar, a filled checkbox, accent text and filled pips. Cloning
//     row one for all five flattens every row to the palest state.
//  3. A technique drill is a DIFFERENT ROW, not a song with fewer numbers. Its
//     art slot is a drawn staff plate rather than a sleeve, and its tier slot
//     is one 140px "1 TIER" button instead of three 44px E/M/H buttons. That is
//     a real decision about what a drill is, and flattening it was the last
//     thing the pixel overlay was still complaining about.
//
// CANON GAP, recorded rather than invented: the design samples a drill in
// "Needs work" only. A banked drill falls back to that row. If the app can
// reach that state, the design owes us the artboard.
// Recolour a designed glow layer from the artwork it sits behind, keeping the
// design's own alpha. Used for the tile halos; the hero glow has its own pass.
function paintArtGlow(layer, img) {
  // a glow HALO overhangs the tile TITLE, and an absolutely-positioned layer
  // eats the hit-test for everything under it: clicks on a song's own name
  // did nothing (journeys caught it, 2026-08-30)
  layer.style.pointerEvents = 'none';
  const alpha = (layer.getAttribute('style') ?? '').match(/rgba\([^)]*?,\s*(\.?\d*\.?\d+)\)/)?.[1] ?? '.3';
  const paint = () => {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 8;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0, 8, 8);
      const d = x.getImageData(0, 0, 8, 8).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4;
      r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
      const max = Math.max(r, g, b, 1);
      if (max < 90) { const k = 110 / max; r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k); }
      layer.style.background = `rgba(${r},${g},${b},${alpha})`;
    } catch { layer.style.display = 'none'; }
  };
  if (img.complete && img.naturalWidth) paint();
  else img.addEventListener('load', paint, { once: true });
}

// ---- the 10a ART GRID (2026-08-29) ------------------------------------------
// The desktop library's heart is a grid of 132px sleeves: art, Fraunces title,
// state in shape plus word, E/M/H tier pips, plays count, and a final
// "Show the other N" cell. Everything visual is HARVESTED from the design's own
// sample tiles; this function writes no colour, size, radius or spacing.
function renderTiles(root, ctx) {
  const moreLeaf = [...root.querySelectorAll('*')]
    .find((e) => !e.children.length && /^Show the other \d+ in /.test(e.textContent.trim()));
  if (!moreLeaf) return false;
  const moreBtn = moreLeaf.closest('button') ?? control(moreLeaf);
  // The grid is a COLUMN of row divs, five cells each, with the show-more
  // control as the last cell of the last row. The first cut treated the last
  // row as the whole grid, crammed all nine clones into it, and left the first
  // row showing the design's samples; the overlay caught it at 140k pixels.
  // THE GRID, found by SHAPE, not by inline style. Three row structures have
  // now shipped: a column of identical rows, one flex row, and (after the
  // council redraw) two rows with DIFFERENT inline styles. Style-matching
  // broke on the third and the entire grid silently vanished, taking every
  // song row with it. So: take the container that holds the show-more, gather
  // every tile-shaped cell inside it whatever the row nesting, and collapse
  // them into ONE wrapping row. Wrapping is what the elastic library wants
  // anyway: more height simply means more rows, with no arithmetic.
  const lastRow = moreBtn.parentElement;
  const rowsCol = lastRow.parentElement;
  const isModule = (c) => /Start/.test(c.textContent) && /Choose another/.test(c.textContent);
  // A TILE IS TILE-SHAPED. The 756 column's ledger rows also carry a Fraunces
  // title, so a title-only test treated the phone library as a grid and
  // collapsed its rows into one wrapping line (the overlay caught it: 1030px
  // tall against the drawn 1334). Narrowness alone does not separate them
  // either: a ledger row's TEXT SLOT is narrow AND holds the Fraunces title, so
  // the width rule simply moved the false match one level down and the phone
  // board still lost four of its five rows. What actually tells them apart is
  // the aspect: a tile is a PORTRAIT cell (132 wide, 166 tall, sleeve above
  // title), and every ledger part is wider than it is tall.
  const colW = rowsCol.getBoundingClientRect().width || 1390;
  const isTile = (c) => {
    if (c === moreBtn || isModule(c)) return false;
    const b = c.getBoundingClientRect();
    if (b.width >= colW * 0.4 || b.height <= b.width) return false;
    return [...c.querySelectorAll('*')].some((e) => !e.children.length && /Fraunces/.test(e.getAttribute('style') ?? ''));
  };
  const rowDivs = [...rowsCol.children].filter((r) => [...r.children].some(isTile) || r.contains(moreBtn));
  // THE DESIGN'S OWN BAND HEIGHT, read before a single tile is dealt. Captured
  // any later and it is the height the app itself just produced, which fed
  // straight back into capacity (46 songs dealt, no room, show-more gone).
  const drawnBandH = Math.round(rowsCol.getBoundingClientRect().height);
  // THE ROW WAS THE RULER. The design's rows are a FIXED 166 tall and their
  // cells stretch to fill them, which quietly SHRINKS each title line below its
  // own line-height (19.23 against 19.55). Collapsing to one auto-height
  // wrapping line takes the ruler away: every cell relaxes to its natural
  // 166.55, rounds to 167, and everything below the grid sits one pixel low.
  // 130,010 structural pixels, all of it that one pixel. So keep the ruler.
  // Read here, BEFORE the collapse: measured after the module is appended, the
  // row is as tall as the module (231) and the whole band inflates by 65px.
  // Read PER ROW, because the board is not uniform: row 1 carries the
  // recommendation module and squeezes its cells to 166, row 2 lets its cells
  // hang to 166.55. Imposing either one on both is a redesign, not a port.
  const drawnRows = rowDivs.map((r) => {
    const kids = [...r.children].map((c) => c.getBoundingClientRect().height);
    return { box: r.getBoundingClientRect().height, cell: kids.length ? Math.max(...kids) : 0 };
  });
  // and the two ODD CELLS keep their own drawn height rather than their line's:
  // the board's door is 166 sitting beside 166.55 tiles, so a per-line target
  // pushed its dashed underline half a pixel down.
  const drawnFixed = new Map();
  for (const r of rowDivs) for (const c of r.children) {
    if (isModule(c) || c === moreBtn || c.contains(moreBtn)) drawnFixed.set(c, c.getBoundingClientRect().height);
  }
  const drawnCellH = Math.round(drawnRows[0]?.cell ?? 0);
  const drawnPitch = rowDivs.length > 1
    ? Math.round(rowDivs[1].getBoundingClientRect().y - rowDivs[0].getBoundingClientRect().y) : 0;
  const gridHost = rowDivs[0] ?? lastRow;
  const module = rowDivs.flatMap((r) => [...r.children]).find(isModule) ?? null;
  const tiles = rowDivs.flatMap((r) => [...r.children]).filter(isTile);
  if (tiles.length < 3) return false;
  if (module && module.parentElement !== gridHost) gridHost.appendChild(module);
  if (moreBtn.parentElement !== gridHost) gridHost.appendChild(moreBtn);
  for (const r of rowDivs) if (r !== gridHost) r.remove();
  gridHost.style.flexWrap = 'wrap';
  gridHost.style.alignContent = 'flex-start';
  gridHost.style.height = 'auto';
  // WRAPPING INHERITS THE WRONG GAP. Collapsing the rows made the wrap use the
  // row's own COLUMN gap (6px) where the design spaced its rows by 14px, so
  // every row after the first sat 7px high and the whole dashboard rode up
  // (the overlay caught it as a 7px shift). Take the container's real row gap.
  // Prefer the PITCH the design actually drew (row 2 top minus row 1 top) less
  // the row height, so gap and cell together reproduce the board's own rhythm.
  {
    const cs = getComputedStyle(rowsCol);
    let drawnRowGap = parseFloat(cs.rowGap) || parseFloat(cs.gap) || 0;
    if (drawnPitch > drawnCellH) drawnRowGap = drawnPitch - drawnCellH;
    if (drawnRowGap) gridHost.style.rowGap = drawnRowGap + 'px';
  }
  const rows = [gridHost];
  const rowTpl = gridHost;
  const perRow = Infinity;   // wrapping decides the break, not arithmetic

  const leaves = (el) => [...el.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim());
  const STATES = ['Banked', 'Needs work', 'Not started'];

  // harvest each drawn state's appearance: the shape <i> and the word span
  const stateVariants = new Map();
  const stateSpanOf = (tile) => leaves(tile).map((l) => ({ l, w: l.textContent.trim() }))
    .filter((x) => STATES.includes(x.w)).map((x) => x.l.parentElement)[0] ?? null;
  for (const tile of tiles) {
    const span = stateSpanOf(tile);
    if (!span) continue;
    const word = span.textContent.trim();
    if (!stateVariants.has(word)) {
      stateVariants.set(word, { i: span.querySelector('i')?.getAttribute('style') ?? null,
        // THE TICK IS NOT DECORATION. Banked's box carries a mark inside it and
        // the other two are empty; swapping only the <i>'s style left every
        // dealt Banked chip a bare green square, which is hue alone doing the
        // work. The mark travels with the variant.
        mark: span.querySelector('i')?.innerHTML ?? '',
        word: [...span.children].find((ch) => ch.tagName === 'SPAN')?.getAttribute('style') ?? null });
    }
  }

  // harvest the two pip appearances (filled vs hollow) from the drawn grids
  const pipRowOf = (tile) => leaves(tile).filter((l) => /^[EMH]$/.test(l.textContent.trim()))
    .map((l) => l.parentElement?.parentElement)[0] ?? null;
  let pipOn = null, pipOff = null, letterOn = null, letterOff = null;
  for (const tile of tiles) {
    const row = pipRowOf(tile);
    if (!row) continue;
    for (const cell of row.children) {
      const pip = cell.querySelector('i');
      const letter = cell.querySelector('span');
      if (!pip) continue;
      const filled = (pip.getAttribute('style') ?? '').includes('background');
      if (filled && !pipOn) { pipOn = pip.getAttribute('style'); letterOn = letter?.getAttribute('style') ?? null; }
      if (!filled && !pipOff) { pipOff = pip.getAttribute('style'); letterOff = letter?.getAttribute('style') ?? null; }
    }
  }

  // TWO templates, both the design's own: a sleeve tile, and the artless PLATE
  // tile (stave hairlines + a Georgia monogram) it drew for songs with no
  // honest recording. Which one a song gets is data: does a real sleeve exist.
  const template = tiles.find((t) => t.querySelector('img'))?.cloneNode(true);
  const plateTpl = tiles.find((t) => !t.querySelector('img'))?.cloneNode(true) ?? null;
  if (!template) return false;
  // the design's own monogram rule, read off its samples: "HB" for Happy
  // Birthday, "C" for C Major Scale (a single-letter first word stands alone)
  const monogram = (title) => {
    const words = String(title ?? '').split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    if (words[0].length === 1) return words[0].toUpperCase();
    return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  };

  // rebuild the rows: empty them, keep the first as the row template, deal
  // tiles back at the design's own row size, close the last row with show-more
  for (const t of tiles) t.remove();
  moreBtn.remove();
  for (const r of rows) if (r !== rowTpl) r.remove();
  const rowsOut = [rowTpl];
  const rowFor = (i) => {
    const idx = Math.floor(i / perRow);
    while (rowsOut.length <= idx) {
      const nr = rowTpl.cloneNode(false);
      rowsCol.appendChild(nr);
      rowsOut.push(nr);
    }
    return rowsOut[idx];
  };
  (ctx.rows ?? []).forEach((song, ti) => {
    const real = song.song ?? song;
    // ☠️ `real.group` alone misses every SINGLE-TIER song. Happy Birthday and the
    // standalone scales have no `group` field, so this never looked for their
    // sleeve at all and they kept drawing the monogram plate while every song
    // around them had art. Everywhere else in the app the key is `group ?? id`.
    const sleeveKey = real.group ?? real.id ?? song.id;
    const hasSleeve = !!song.art || !!(sleeveKey && sleeveUrlByGroup(sleeveKey, 132));
    const tile = (hasSleeve || !plateTpl ? template : plateTpl).cloneNode(true);
    rowFor(ti).appendChild(tile);

    const img = tile.querySelector('img');
    if (img) {
      img.src = song.art || coverDataUrl(real, 132);
      img.alt = '';
      img.removeAttribute('data-art');
      // ☠️ trap 25's class again: each tile's art wrapper carries a TEXTLESS
      // blur-glow layer whose colour the design baked from ITS sample sleeve
      // (Für Elise amber). Cloned as-is, every sleeve wore FE's amber halo:
      // the overlay caught 116k pixels of it. Same ruling as the hero glow:
      // the glow follows the REAL artwork, alpha kept from the design.
      const glow = tile.querySelector('i[style*="blur("]');
      if (glow) paintArtGlow(glow, img);
    } else {
      // the plate's centred Georgia leaf is the monogram slot
      const mono = leaves(tile).find((l) => /44px/.test(l.getAttribute('style') ?? ''));
      if (mono) mono.textContent = monogram(song.title);
    }
    // the Fraunces display line is the title slot
    const title = leaves(tile).find((l) => /Fraunces/.test(l.getAttribute('style') ?? ''));
    if (title) title.textContent = song.title;
    const span = stateSpanOf(tile);
    if (span) {
      const v = stateVariants.get(song.state);
      const wordEl = [...span.children].find((ch) => ch.tagName === 'SPAN');
      if (wordEl) wordEl.textContent = song.state;
      if (v) {
        const shape = span.querySelector('i');
        if (v.i && shape) shape.setAttribute('style', v.i);
        if (shape) shape.innerHTML = v.mark ?? '';
        if (v.word && wordEl) wordEl.setAttribute('style', v.word);
      }
    }
    const pips = pipRowOf(tile);
    if (pips) {
      const tiers = Array.isArray(song.tiers) ? song.tiers : [];
      // ☠️ MATCH THE CELL'S OWN LETTER, DO NOT COUNT CELLS. song.tiers holds the
      // proofs for the tiers this song actually ships, easiest first, so filling
      // E, M, H from it by index mislabels every song that skips one: Easy+Hard
      // drew "E M". tierLevels says which letter each entry belongs to, and is
      // null only where no variant has a level, where by-position is right.
      const levels = Array.isArray(song.tierLevels) ? song.tierLevels : null;
      [...pips.children].forEach((cell, i) => {
        const pip = cell.querySelector('i');
        const letter = cell.querySelector('span');
        if (!pip) return;
        const at = levels ? levels.indexOf((letter?.textContent ?? '').trim()) : i;
        // a single-tier drill keeps only its first pip honest; spare letters go
        // (no un-hiding: every tile here is a fresh clone of the template, and
        // writing display back would SHOW a cell the design itself hides)
        if (at < 0 || (at >= tiers.length && tiers.length)) { cell.style.display = 'none'; return; }
        const on = (tiers[at] ?? 0) > 0;
        if (on && pipOn) { pip.setAttribute('style', pipOn); if (letterOn && letter) letter.setAttribute('style', letterOn); }
        if (!on && pipOff) { pip.setAttribute('style', pipOff); if (letterOff && letter) letter.setAttribute('style', letterOff); }
      });
      // the plays count is the trailing numeric leaf OUTSIDE the E/M/H cells
      const plays = leaves(pips.parentElement).filter((l) => /^\d+$/.test(l.textContent.trim())).pop();
      if (plays && song.plays != null) plays.textContent = String(song.plays);
    }
    if (song.onOpen) {
      tile.style.cursor = 'pointer';
      tile.addEventListener('click', () => song.onOpen(song));
    }
  });
  // the show-more cell is the next cell after the last tile, new row if full
  rowFor((ctx.rows ?? []).length).appendChild(moreBtn);
  // ZERO rows IN A SEARCH: the design drew this state on the states board
  // (the dashed plate + "Nothing matches, try a shorter word."). Lift it
  // verbatim, the freeze-offer pattern. Only for searches: an empty Learning
  // tab is not a failed search, and the copy would lie there (caught on the
  // theory-card eyeball pass).
  if (!(ctx.rows ?? []).length && ctx.activeTab === 'search') {
    const t = document.createElement('template');
    t.innerHTML = CANON['states'] ?? '';
    const empty = t.content.querySelector('#list-results');
    if (empty) {
      const frag = empty.firstElementChild?.cloneNode(true);
      if (frag) rowTpl.appendChild(frag);
    }
  }
  // The HERO also wears a state chip, drawn "Not started" on the board. It was
  // the one sample left talking over real data (Still D.R.E. at 22 plays read
  // "Not started"). Bind it here, where the harvested variants live; the chip
  // outside the grid is the hero's.
  if (ctx.prescription?.state) {
    const heroLeaf = [...root.querySelectorAll('*')]
      .find((e) => !e.children.length && STATES.includes(e.textContent.trim()) && !rowsCol.contains(e));
    const span = heroLeaf?.parentElement;
    if (span) {
      const v = stateVariants.get(ctx.prescription.state);
      const wordEl = [...span.children].find((ch) => ch.tagName === 'SPAN');
      if (wordEl) wordEl.textContent = ctx.prescription.state;
      if (v) {
        const shape = span.querySelector('i');
        if (v.i && shape) shape.setAttribute('style', v.i);
        if (shape) shape.innerHTML = v.mark ?? '';
        if (v.word && wordEl) wordEl.setAttribute('style', v.word);
      }
    }
  }
  // CONTAINMENT (Mark's screenshot, 2026-08-29): the band the grid lives in is
  // a fixed 392px of a fixed 738px composition. More rows than the design drew
  // (show all, search) were painting straight over the practice chart and the
  // form check below, so the band CLIPS, exactly as the board's own wrapper
  // does. It clips rather than scrolls on purpose: a scroll container is a
  // composited layer, and Chrome will not put LCD subpixel text inside one, so
  // `overflow-y: auto` silently re-rendered every label in the grid with
  // grayscale antialiasing and the overlay read 12,391 differing pixels of
  // pure font rasterisation. Nothing overflows now in any case: the elastic
  // plan deals only what fits and the door carries the remainder to the wall.
  // TAG THE ROW THAT HOLDS THE CELLS. In the single-row council layout the
  // cells' parent is `lastRow`, and tagging its PARENT made every elastic
  // measurement size the wrong box (the dashboard ended up above the grid).
  gridHost.dataset.libGrid = '1';   // the ONE wrapping row the elastic library sizes
  if (drawnBandH > 40) gridHost.dataset.drawnH = String(drawnBandH);
  // and hand every cell, dealt ones included, the height its LINE had on the
  // board. Corrected by DELTA, never set outright: the door is content-box with
  // padding, so a flat height:166 made its border box 230 and shoved the
  // dashboard down 64px. Lines past the last drawn row reuse the last one.
  if (drawnCellH > 40) {
    const kids = [...gridHost.children];
    // Read EVERY line assignment before writing ANY height. Resizing a cell
    // moves the cells after it, so a loop that measures as it goes lost the
    // later ones out of the map, and the whole sizing pass died silently on an
    // undefined row.
    const tops = [...new Set(kids.map((c) => Math.round(c.getBoundingClientRect().y)))].sort((a, z) => a - z);
    const rowFor = (i) => drawnRows[Math.min(Math.max(i, 0), drawnRows.length - 1)];
    const plan = kids.map((c) => ({ c,
      target: drawnFixed.get(c) ?? rowFor(tops.indexOf(Math.round(c.getBoundingClientRect().y))).cell }));
    for (const { c, target } of plan) {
      const cur = c.getBoundingClientRect().height;
      if (!target || Math.abs(cur - target) < 0.01) continue;
      c.style.height = (parseFloat(getComputedStyle(c).height) - (cur - target)) + 'px';
    }
    // the band is the sum of the ROW BOXES, which is not the sum of the cells:
    // the board's second row is 166 with its cells hanging 0.55 past it
    const gap = parseFloat(getComputedStyle(gridHost).rowGap) || 0;
    let bandH = gap * (tops.length - 1);
    for (let i = 0; i < tops.length; i++) bandH += rowFor(i).box;
    if (bandH > 40) gridHost.style.height = bandH + 'px';
  }
  rowsCol.style.overflow = 'hidden';
  rowsCol.style.minHeight = '0';
  return true;
}

function renderRows(root, ctx, anchors) {
  const { rows: wanted, onOpenSong } = ctx;
  const titles = (anchors ?? findRowAnchors(root)).filter(Boolean);
  if (titles.length < 2) return;

  // walk up from each title collecting ancestors, then take the deepest one
  // that every title shares: that is the container the rows live in
  const chain = (n) => { const out = []; let e = n; while (e && e !== root.parentElement) { out.push(e); e = e.parentElement; } return out; };
  const chains = titles.map(chain);
  let list = null;
  for (const cand of chains[0]) { if (chains.every((c) => c.includes(cand))) { list = cand; break; } }
  if (!list) return;

  // climb to the child of the list, and give up rather than run off the top: a
  // title that is NOT inside the list (the hero carries song titles too) must
  // drop out, not crash
  const rowOf = (t) => { let e = t; while (e && e.parentElement !== list) e = e.parentElement; return e; };
  const existing = titles.map(rowOf).filter(Boolean);
  if (existing.length < 2) return;

  const ART = 0, TEXT = 1, PLAYS = 2, DIFF = 3, STATE = 4, TIERS = 5;
  const slot = (row, i) => row.children[i];
  // The slot ITSELF is a leaf when it holds its text directly, which the plays
  // and difficulty slots do. Looking only at descendants silently bound
  // nothing there, so every banked row kept the template song's numbers: the
  // overlay caught it as 596 stray pixels reading "79 4.2-5.7" in the Still
  // D.R.E. row. A binder that no-ops is worse than one that throws.
  const leaves = (el) => [el, ...el.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim());
  const kindOf = (row) => (slot(row, ART).tagName === 'IMG' ? 'song' : 'drill');
  const stateOf = (row) => (leaves(slot(row, STATE))[0]?.textContent ?? '').trim();

  // one template per (kind, state), taken from the design's own sample
  const templates = new Map();
  for (const row of existing) {
    const key = kindOf(row) + '|' + stateOf(row);
    if (!templates.has(key)) templates.set(key, row.cloneNode(true));
  }
  const anyOfKind = (kind) => {
    for (const [k, v] of templates) if (k.startsWith(kind + '|')) return v;
    return null;
  };

  // A pip is filled or empty, and the two look different at each of the two pip
  // sizes the design uses (4px in a tier button, 5px in the drill's). Harvest
  // all four style attributes from the design's own pips rather than typing a
  // colour: this file writes no colour, and that is the whole defence against
  // the port drifting back into a re-implementation.
  const pipKey = (el, on) => (el.style.width || '?') + '|' + (on ? 'on' : 'off');
  const pipRef = {};
  for (const row of existing) {
    for (const pip of row.querySelectorAll('i')) {
      const on = getComputedStyle(pip).backgroundColor !== 'rgba(0, 0, 0, 0)';
      const k = pipKey(pip, on);
      if (!(k in pipRef)) pipRef[k] = pip.getAttribute('style');
    }
  }

  // The rows are DIRECT CHILDREN of the content column, not members of a
  // dedicated list, so appending puts them after the quests and the practice
  // chart. Hold the node that follows the last original row and insert before
  // it, which keeps them exactly where the design put them.
  const anchorAfter = existing[existing.length - 1].nextSibling;
  for (const r of existing) r.remove();

  for (const song of wanted) {
    const tiers = Array.isArray(song.tiers) ? song.tiers : [];
    const kind = song.kind ?? (tiers.length === 1 ? 'drill' : 'song');
    const tpl = templates.get(kind + '|' + song.state) ?? anyOfKind(kind) ?? anyOfKind('song');
    if (!tpl) continue;
    const row = tpl.cloneNode(true);
    list.insertBefore(row, anchorAfter);

    const [titleEl, subEl] = leaves(slot(row, TEXT));
    if (titleEl) titleEl.textContent = song.title;
    if (subEl) subEl.textContent = song.sub;
    const put = (i, v) => { const n = leaves(slot(row, i))[0]; if (n) n.textContent = v; };
    put(PLAYS, song.plays);
    put(DIFF, song.diff);
    put(STATE, song.state);

    // pips carry this song's proofs, not the template song's
    // the same letter rule as the grid tiles: a tier button belongs to the
    // level printed on it, and a song that does not ship that level shows none
    const levels = Array.isArray(song.tierLevels) ? song.tierLevels : null;
    [...slot(row, TIERS).querySelectorAll('button')].forEach((btn, i) => {
      const at = levels ? levels.indexOf((btn.querySelector('span')?.textContent ?? '').trim()) : i;
      if (at < 0) { btn.style.display = 'none'; return; }
      const proofs = tiers[at] ?? 0;
      [...btn.querySelectorAll('i')].forEach((pip, k) => {
        const style = pipRef[pipKey(pip, k < proofs)];
        if (style) pip.setAttribute('style', style);
      });
    });

    // a drill's art slot is a drawn plate with no image to bind
    const img = slot(row, ART).tagName === 'IMG' ? slot(row, ART) : null;
    if (img) {
      img.src = song.art || coverDataUrl(song.song ?? song, 128);
      img.alt = '';
      img.removeAttribute('data-art');
    }
    if (song.onOpen || onOpenSong) {
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => (song.onOpen ?? onOpenSong)(song));
    }
  }
}
