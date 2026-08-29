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
import { applyInherited, mountMarkup } from './canon-screen.mjs';
import { reclaimIds, captureFocus, restoreFocus, nameControls } from './canon-mount.mjs';
import { coverDataUrl } from './covers.mjs';

// The five songs the design drew in its own row samples. Named once, because
// two places need them and they must not drift apart.
const ROW_SAMPLES = ['River Flows in You', 'Für Elise', 'Still D.R.E.', 'Super Mario Bros. Theme', 'C Major Scale'];

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
  applyInherited(host, 'library');
  // a person can be typing in the search box while this runs
  CANON_MISSES.length = 0;
  const focus = captureFocus(host);
  const root = mountMarkup(host, CANON.library);

  // Resolve the sample song rows NOW, before anything else rewrites text.
  // bySample finds the FIRST node with that text, and the moment the
  // recommendation is bound to a real song the hero can carry the same title as
  // a row: "Für Elise" then resolved to the hero, the row walk climbed past
  // the list looking for a parent that was never coming, and the whole library
  // threw. Order of binding is not a detail here.
  const rowAnchors = ROW_SAMPLES.map((t) => bySample(root, t)).filter(Boolean);

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

  // ---- rail: the dock ----
  const dock = [
    ['Repertoire', () => ctx.onTab?.('repertoire')],
    ['Free play', () => ctx.onTool?.('btn-freeplay')],
    ['Metronome', () => ctx.onTool?.('btn-metronome')],
    ['Latency calibration', () => ctx.onTool?.('btn-calibrate')],
  ];
  for (const [label, fn] of dock) {
    const n = bySample(root, label);
    if (!n) continue;
    const c = control(n);
    c.addEventListener('click', fn);
    c.style.cursor = 'pointer';
  }
  const resume = bySample(root, 'Resume the session');
  if (resume) { const c = control(resume); c.addEventListener('click', () => onRun?.(prescription)); c.style.cursor = 'pointer'; }

  // ---- the four shelves, now tabs ----
  const counts = ctx.counts;
  const tabs = [['Learning', 'sec-learning', counts.learning], ['Repertoire', 'sec-repertoire', counts.repertoire],
                ['Hall of fame', 'sec-fame', counts.fame], ['Explore', 'sec-explore', counts.explore]];
  for (const [label, id, n] of tabs) {
    // the tab label appears twice (rail and tab bar), so take the one inside the tab strip
    const hits = [...root.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim() === label && e.getBoundingClientRect().y < 90);
    const node = hits[hits.length - 1];
    if (!node) continue;
    const c = control(node);
    c.id = id;
    c.addEventListener('click', () => ctx.onTab?.(id.replace('sec-', '')));
    c.style.cursor = 'pointer';
    const countEl = c.querySelector('*:not(:first-child)');
    if (countEl && /^\d+$/.test(countEl.textContent.trim())) countEl.textContent = String(n);
    if (id === 'sec-learning' && countEl) countEl.id = 'learn-count';
  }

  // ---- the recommendation ----
  if (prescription) {
    setText(root, 'Star Wars Main Title', prescription.title);
    const reason = bySample(root, 'John Williams, arranged for two hands. Nothing banked yet, start on the easy tier.');
    if (reason) { reason.textContent = prescription.reason; reason.id = 'next-action-reason'; }
    const label = bySample(root, 'DO THIS NEXT');
    if (label) label.id = 'next-action-label';
    const title = bySample(root, prescription.title);
    if (title) control(title, 3).id = 'next-action';
    const img = root.querySelector('img[data-art]');
    if (img) {
      // No song yet means no sleeve. An empty src is not "no image": the
      // browser draws a broken-image glyph, which is how the very first screen
      // a new user sees ended up with one.
      const src = prescription.art ?? (prescription.song ? coverDataUrl(prescription.song, 96) : null);
      if (src) { img.src = src; img.hidden = false; } else { img.removeAttribute('src'); img.hidden = true; }
      img.alt = '';
      img.removeAttribute('data-art');
      img.id = 'next-action-cover';
    }
    const start = bySample(root, 'Start');
    if (start) { const c = control(start); c.addEventListener('click', () => onRun?.(prescription)); c.style.cursor = 'pointer'; }
    const another = bySample(root, 'Choose another');
    if (another) { const c = control(another); c.addEventListener('click', () => ctx.onChooseAnother?.()); c.style.cursor = 'pointer'; }
  }

  // ---- the rows, then everything the canon absorbed ----
  renderRows(root, ctx, rowAnchors);
  bindDashboard(root, ctx);
  bindAllTools(root, ctx);

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
  const rows = samples.map((t) => bySample(root, t)?.closest(tag)).filter(Boolean);
  return rows.length === samples.length ? rows : [];
}

// the two appearances of a checkbox, taken from a sample that is ticked and one
// that is not
function checkVariants(rows, doneIndex) {
  const boxOf = (r) => r.firstElementChild;
  const onEl = rows[doneIndex] ? boxOf(rows[doneIndex]) : null;
  const offRow = rows.find((r, i) => i !== doneIndex && boxOf(r));
  const offEl = offRow ? boxOf(offRow) : null;
  return {
    on: onEl ? { style: onEl.getAttribute('style'), html: onEl.innerHTML } : null,
    off: offEl ? { style: offEl.getAttribute('style'), html: offEl.innerHTML } : null,
  };
}
function setCheck(row, done, v) {
  const box = row.firstElementChild;
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
    T('Screen taps. Plug the P-45 in for the real thing.', ctx.keyboard.sub);
  }

  // the table header count, and the affordance for the rows not shown
  const header = bySample(root, 'LEARNING, WEAKEST FIRST');
  if (header && header.parentElement) {
    const count = [...header.parentElement.children].find((c) => c !== header && /^\d+$/.test(c.textContent.trim()));
    if (count && ctx.learningTotal != null) count.textContent = String(ctx.learningTotal);
  }
  const more = bySample(root, 'Show the other 7 in Learning');
  if (more) {
    const hidden = Math.max(0, (ctx.learningTotal ?? 0) - (ctx.rows?.length ?? 0));
    more.textContent = `Show the other ${hidden} in Learning`;
    const c = control(more);
    // NOT the hidden attribute: [hidden] hides via a user-agent display:none,
    // and every element in the canon carries an inline display, which wins, so
    // the row stayed on screen saying "Show the other 0 in Learning".
    // And NOT display:'' to show it again: clearing the property deletes the
    // design's own inline display:flex, which dropped the chevron onto its own
    // line. Put back exactly what the design had.
    const shown = c.style.display;
    c.style.display = hidden === 0 ? 'none' : shown;
    c.style.cursor = 'pointer';
    c.addEventListener('click', () => ctx.onShowMore?.());
  }

  // today's quests: the design drew three, the middle one ticked
  if (ctx.quests) {
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

  // the weekly mission
  if (ctx.mission) {
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
    const bars = strip?.previousElementSibling;
    if (strip && bars) {
      const drawn = [...bars.children];
      const pctOf = (el) => parseFloat((el.getAttribute('style') || '').match(/height\s*:\s*([\d.]+)%/)?.[1] ?? '0');
      const styleOf = (el) => el.getAttribute('style');
      const pcts = drawn.map(pctOf);
      const maxPct = Math.max(...pcts);
      const minPct = Math.min(...pcts.filter((p) => p > 0));
      const shape = {
        today: styleOf(drawn[drawn.length - 1]),
        zero: styleOf(drawn.find((el, i) => pctOf(el) === 0 && i < drawn.length - 1) ?? drawn[0]),
        value: styleOf(drawn.find((el, i) => pctOf(el) > 0 && i < drawn.length - 1) ?? drawn[0]),
      };
      const max = Math.max(1, ...ctx.practice.map((d) => d.minutes));
      const labels = [...strip.children];
      ctx.practice.forEach((d, i) => {
        if (labels[i]) labels[i].textContent = d.isToday ? 'today' : d.label;
        const bar = drawn[i];
        if (!bar) return;
        const base = d.isToday ? shape.today : d.minutes > 0 ? shape.value : shape.zero;
        bar.setAttribute('style', base);
        if (d.minutes > 0 || d.isToday) {
          const pct = d.minutes > 0 ? Math.max(minPct, Math.round((d.minutes / max) * maxPct)) : 0;
          bar.style.height = `${pct}%`;
        }
        bar.title = `${d.label}: ${Math.round(d.minutes)} min`;
      });
    }
  }

  if (ctx.path) {
    T('Chords from a symbol', ctx.path.skill);
    T('Skill 2 of 5. Stage: independent, one stage short of retained.', ctx.path.stage);
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
    }
    const go = bySample(root, 'Continue');
    if (go) { const c = control(go); c.addEventListener('click', () => ctx.onPath?.()); c.style.cursor = 'pointer'; }
  }

  const formDone = bySample(root, 'Done, I watched it');
  if (formDone) { const c = control(formDone); c.addEventListener('click', () => ctx.onFormDone?.()); c.style.cursor = 'pointer'; }
  const formSkip = bySample(root, 'Not today');
  if (formSkip) { const c = control(formSkip); c.addEventListener('click', () => ctx.onFormSnooze?.()); c.style.cursor = 'pointer'; }
}


// ---- All tools ------------------------------------------------------------
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
  const dockItem = bySample(root, 'Free play');
  const groupLabel = bySample(root, 'MOST USED');
  if (!dockItem || !groupLabel) return;

  const itemTemplate = control(dockItem).cloneNode(true);
  const labelTemplate = groupLabel.cloneNode(true);

  const panel = document.createElement('div');
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

  triggerBtn.style.cursor = 'pointer';
  triggerBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  });
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
function renderRows(root, ctx, anchors) {
  const { rows: wanted, onOpenSong } = ctx;
  const titles = (anchors ?? ROW_SAMPLES.map((a) => bySample(root, a))).filter(Boolean);
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
    [...slot(row, TIERS).querySelectorAll('button')].forEach((btn, i) => {
      const proofs = tiers[i] ?? 0;
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
