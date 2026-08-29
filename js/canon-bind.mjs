// The lists, bound into the design instead of over it.
//
// Measured before this file: 74% of the elements on the app's screens were
// still the design a second after mounting, and the missing 26% was four
// containers where the app generates rows with innerHTML - #lesson-list,
// #path-skills, #trophy-list and the four #keys12-* grids. The pixel gate could
// not see any of it, because it measures the mount and this happens after.
//
// Every one of those containers has the design's own row sitting in it, marked
// with data-i, because the artboards were drawn from the app's control
// inventory. So none of this invents a row: it clones the one the design drew.
//
// Each binder returns false when the canon is not mounted or has no row to
// clone, and the caller falls back to the app's original renderer. A list that
// silently comes out empty is worse than one that looks old.
import { fillCanonList } from './canon-list.mjs';

const $ = (id) => document.getElementById(id);
const inCanon = (el) => !!el && !!el.closest('.canon-root') && !el.closest('[data-legacy-screen]');

// Rows in the design are [index, name, stage] for the two ladders, and
// [name, evidence] for a trophy. Bind by position: the design's own cell order
// is the contract, and it is stable because the artboard drew it that way.
function bindRows(id, items, fill, pickTpl) {
  const c = $(id);
  if (!inCanon(c)) return false;
  return fillCanonList(c, items, fill, pickTpl);
}

// ---- the five teacher lessons, and the five skills behind them -------------
// The drawn state vocabulary on the lessons boards is retained / in progress
// / not started; the app's is Complete / Ready / Locked. Codex caught the
// binder writing the word while KEEPING the template's shape (a Ready row
// wearing the board's green check), and dropping clean-run badges and
// retention stars entirely under the canon. Templates are picked by state
// CLASS so shape and word agree, and rewards ride the state cell in shape
// plus word.
const LESSON_TPL_WORD = { Complete: 'retained', Ready: 'in progress', Locked: 'not started' };
export const bindLessonList = (lessons) =>
  bindRows('lesson-list', lessons, (row, l, i, { cells }) => {
    // slot-aware, not index-aware: the redrawn rows carry numeral, Fraunces
    // title, an optional REWARD leaf and the state chip; index writes put the
    // state into the reward slot and it printed twice
    const leaves = leafTexts(row);
    const num = leaves.find((e) => /^\d+$/.test(e.textContent.trim()));
    const title = leaves.find((e) => e !== num && /Fraunces/.test(e.getAttribute('style') ?? ''));
    const stateLeaf = leaves.find((e) => /^(Complete|Ready|Locked|retained|in progress|not started)/.test(e.textContent.trim()));
    const rewardLeaf = leaves.find((e) => /clean run|remembered/.test(e.textContent) && e !== stateLeaf);
    if (num) num.textContent = String(i + 1);
    if (title) title.textContent = l.title; else if (cells[1]) cells[1].textContent = l.title;
    if (stateLeaf) stateLeaf.textContent = l.state; else if (cells[2]) cells[2].textContent = l.state;
    if (rewardLeaf) {
      // the design draws the diamond as its own glyph beside the words, so the
      // text carries words only (a second diamond doubled it); no reward means
      // the whole mark stands down rather than an orphan glyph
      const marks = [l.badge ? 'clean run' : null, l.star ? '★ remembered' : null].filter(Boolean);
      const wrap = rewardLeaf.parentElement;
      if (!marks.length) { if (wrap) wrap.style.display = 'none'; }
      else rewardLeaf.textContent = marks.join(' · ');
    }
    if (l.onOpen) { row.style.cursor = 'pointer'; row.addEventListener('click', l.onOpen); }
  }, (l, i, templates) => {
    // the redrawn 11a speaks the app's own vocabulary; the phone board still
    // speaks the older sample words, so try exact first, then the legacy map
    const base = String(l.state).split(' ·')[0];
    let idx = templates.findIndex((t) => t.textContent.includes(base));
    if (idx < 0 && LESSON_TPL_WORD[base]) idx = templates.findIndex((t) => t.textContent.includes(LESSON_TPL_WORD[base]));
    return idx >= 0 ? idx : Math.min(i, templates.length - 1);
  });

const STAGE_WORDS = ['unseen', 'introduced', 'guided', 'independent', 'retained'];
const leafTexts = (el) => [el, ...el.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim());
export const bindPathSkills = (skills) =>
  bindRows('path-skills', skills, (row, s, i, { cells, setPips }) => {
    // STRUCTURE-AWARE slots (2026-08-29): the desktop path cards carry an
    // extra kicker leaf on the selected card, so index-order writes put the
    // name into WHY THIS IS NEXT and the stage into the name. Resolve each
    // slot by what it IS: the numeral, the Fraunces display line, the stage
    // word; anything else (the kicker) is the design's own and stays.
    const leaves = leafTexts(row);
    const num = leaves.find((l) => /^\d+$/.test(l.textContent.trim()));
    // the 11d cards carry an UPPERCASE stage chip and an uppercase bottom
    // label ("INDEPENDENT · DECAYS THURSDAY"); the phone rows a lowercase word
    const isStageWord = (t) => STAGE_WORDS.includes(t.trim().toLowerCase());
    const chip = leaves.find((l) => isStageWord(l.textContent) && l.textContent.trim() === l.textContent.trim().toUpperCase());
    const bottom = leaves.find((l) => l !== chip
      && STAGE_WORDS.some((w) => l.textContent.trim().toLowerCase().startsWith(w))
      && l.textContent.trim() === l.textContent.trim().toUpperCase());
    const state = leaves.find((l) => isStageWord(l.textContent) && l !== chip && l !== bottom);
    const name = leaves.find((l) => /Fraunces/.test(l.getAttribute('style') ?? ''))
      ?? leaves.find((l) => l !== num && l !== state && l !== chip && l !== bottom);
    if (num) num.textContent = String(i + 1);
    if (name) name.textContent = s.name;
    if (chip) chip.textContent = String(s.stage).toUpperCase();
    if (bottom) bottom.textContent = (s.bottom ?? s.stage).toUpperCase();
    if (state) state.textContent = s.stage;
    setPips(s.filled ?? 0);
    if (s.title) row.title = s.title;
    if (s.onOpen) { row.style.cursor = 'pointer'; row.addEventListener('click', s.onOpen); }
  }, (s, i, templates) => {
    // the drawn card whose STATE matches carries the right shape for the word
    const want = String(s.stage).toLowerCase();
    const idx = templates.findIndex((t) => leafTexts(t).some((l) => l.textContent.trim().toLowerCase().startsWith(want)));
    return idx >= 0 ? idx : Math.min(i, templates.length - 1);
  });

export const bindPathLessons = (lessons) =>
  bindRows('path-lessons', lessons, (row, l, i, { cells }) => {
    // same structure-aware rule: the desktop rows are [check glyph, name] with
    // no numeral and no state word; writing by index ate the lesson names
    const LESSON_STATES = ['Complete', 'Ready', 'Locked', 'Due', 'Not started'];
    // the 11d checklist speaks Due / Not started; the app speaks Ready / Locked
    const BOARD_WORD = { Ready: 'Due', Locked: 'Not started' };
    const leaves = leafTexts(row);
    const num = leaves.find((x) => /^\d+$/.test(x.textContent.trim()));
    const state = leaves.find((x) => LESSON_STATES.includes(x.textContent.trim()));
    const name = leaves.find((x) => x !== num && x !== state);
    const boardSpeaksDue = state && ['Due', 'Not started'].includes(state.textContent.trim());
    if (num) num.textContent = String(i + 1);
    if (name) name.textContent = l.title;
    if (state) state.textContent = boardSpeaksDue ? (BOARD_WORD[l.state] ?? l.state) : l.state;
    row.toggleAttribute('disabled', !!l.locked);
    if (l.onOpen && !l.locked) { row.style.cursor = 'pointer'; row.addEventListener('click', l.onOpen); }
  }, (l, i, templates) => {
    // deal each lesson the drawn row whose STATE SHAPE matches its truth
    const words = [l.state, { Ready: 'Due', Locked: 'Not started' }[l.state]].filter(Boolean);
    const idx = templates.findIndex((t) => leafTexts(t).some((x) => words.includes(x.textContent.trim())));
    return idx >= 0 ? idx : Math.min(i, templates.length - 1);
  });

// ---- trophies and the XP ledger --------------------------------------------
export const bindTrophyList = (items) =>
  bindRows('trophy-list', items, (row, t, i, { cells }) => {
    if (cells[0]) cells[0].textContent = t.word;
    if (cells[1]) cells[1].textContent = t.evidence;
  });

export const bindXpLog = (items) =>
  bindRows('xp-log', items, (row, e, i, { cells }) => {
    if (cells[0]) cells[0].textContent = e.label;
    if (cells[1]) cells[1].textContent = e.xp;
  });

// ---- the 12-key ladder ------------------------------------------------------
// A different shape, and worth saying why: the design already drew all twelve
// keys, each button carrying data-k="C". There is nothing to clone and nothing
// to remove. Rebuilding it would have thrown away twelve designed buttons to
// draw twelve plainer ones.
export function bindKeys12(mode, entries) {
  const grid = $(`keys12-${mode}`);
  if (!inCanon(grid)) return false;
  const buttons = [...grid.querySelectorAll('[data-k]')];
  if (!buttons.length) return false;
  // harvest the two appearances from the design's own buttons before touching
  // any of them
  const done = buttons.find((b) => /pass/i.test(b.textContent));
  const open = buttons.find((b) => !/pass/i.test(b.textContent));
  const shape = { done: done?.getAttribute('style'), open: open?.getAttribute('style') };
  const markDone = done?.querySelector('i')?.getAttribute('style');
  const markOpen = open?.querySelector('i')?.getAttribute('style');

  // A VOCABULARY WITH TWO HOMES. The design writes data-k="F sharp" and
  // "D flat"; the app's ladder writes "F#" and "Db". Twenty of the twenty-four
  // black-key cells were therefore dead on arrival, and nothing noticed because
  // the pixels matched and the ids resolved. Normalise both sides to the same
  // spelling rather than picking a winner.
  // Matched by PITCH CLASS, not by spelling. Normalising the words was not
  // enough: the design spells all four grids in flats, while the app's minor
  // ladders spell the same notes in sharps, so "D flat" still found nothing
  // where the app had written "C#". Two names for one key is not a formatting
  // difference, it is the same note, so compare the note.
  const PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const keyName = (k) => {
    const t = String(k ?? '').trim().toLowerCase().replace(/\s*sharp$/, '#').replace(/\s*flat$/, 'b').replace(/\s+/g, '');
    const base = PC[t[0]];
    if (base === undefined) return t;
    const accidental = t.includes('#') ? 1 : t.slice(1).includes('b') ? -1 : 0;
    return String((base + accidental + 12) % 12);
  };
  for (const btn of buttons) {
    const want = keyName(btn.dataset.k);
    const entry = entries.find((e) => keyName(e.key) === want);
    if (!entry) continue;
    const style = entry.done ? shape.done : shape.open;
    if (style) btn.setAttribute('style', style);
    const mark = btn.querySelector('i');
    const markStyle = entry.done ? markDone : markOpen;
    if (mark && markStyle) mark.setAttribute('style', markStyle);
    const cells = [...btn.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim());
    // the last text cell is the state word the design drew next to the key
    const stateCell = cells[cells.length - 1];
    if (stateCell && cells.length > 1) stateCell.textContent = entry.done ? 'passed' : 'open';
    btn.onclick = entry.onOpen ?? null;
    btn.style.cursor = entry.onOpen ? 'pointer' : '';
  }
  return true;
}

// The four ladder headers each carry an "N of 12" counter the design drew but
// no id owns, so the app had no way to reach it and the artboard's own numbers
// were still on screen. Bound off the same entries the buttons use.
export function bindKeys12Count(mode, entries) {
  const grid = $(`keys12-${mode}`);
  if (!inCanon(grid) || !grid.parentElement) return false;
  // The desktop board keeps each section's counter in a heading row that is
  // NOT inside the grid's direct parent, so the old one-level search bound
  // nothing and all four sample counts stayed on screen (sample-bleed audit).
  // Climb, then pick the counter GEOMETRICALLY closest to this grid, so a
  // wide scope can never grab a sibling section's counter.
  const gr = grid.getBoundingClientRect();
  let counter = null, scope = grid.parentElement;
  for (let up = 0; up < 3 && scope && !counter; up++, scope = scope.parentElement) {
    const cands = [...scope.querySelectorAll('*')]
      .filter((e) => !e.children.length && /^\d+\s+of\s+12$/.test(e.textContent.trim()))
      .filter((e) => !e.closest('[id^="keys12-"]'));
    if (cands.length) {
      counter = cands.sort((x, y) => {
        const dx = Math.abs(x.getBoundingClientRect().left - gr.left) + Math.abs(x.getBoundingClientRect().bottom - gr.top);
        const dy = Math.abs(y.getBoundingClientRect().left - gr.left) + Math.abs(y.getBoundingClientRect().bottom - gr.top);
        return dx - dy;
      })[0];
    }
  }
  if (!counter) return false;
  counter.textContent = `${entries.filter((e) => e.done).length} of 12`;
  return true;
}

// The improv screen's loop is a BAR TIMELINE, not a chip list: the design drew
// a 20-cell grid where four cells carry chord names and the rest are empty,
// because a chord change lands on a bar. So bind the named cells in order and
// leave the grid alone.
//
// When the loop has a different number of changes than the design sampled, the
// honest thing is to fill what fits and leave the rest empty rather than invent
// a bar layout the design never specified. Recorded in CANON-GAPS.md.
export function bindImprovLoop(chords) {
  const live = $('improv-chord');
  if (!inCanon(live) || !chords.length) return false;
  const root = live.closest('.canon-root');
  const isChord = (el) => !el.children.length && /^[A-G][#b]?(maj|min|m|dim|aug|sus)?[0-9]*$/.test(el.textContent.trim());
  let strip = null;
  for (const el of root.querySelectorAll('*')) {
    const named = [...el.children].filter(isChord);
    if (named.length >= 3 && !named.includes(live)) { strip = el; break; }
  }
  if (!strip) return false;
  const cells = [...strip.children].filter(isChord);
  cells.forEach((cell, i) => { cell.textContent = chords[i] ?? ''; });
  return true;
}

// ---- segmented controls -----------------------------------------------------
// The app moves a selection by setting data-on and letting its stylesheet do
// the rest. Inside the canon that stylesheet has stood down, and the design
// carries the selected look as an INLINE style on whichever member it drew
// selected. So the selection would paint itself onto one button and never move,
// no matter what the app set.
//
// The design does show both appearances though: one member is on, its siblings
// are off. Harvest the two style attributes from the design's own group and
// swap them, exactly as the tier pips and the quest checkboxes are handled.
// Nothing here writes a colour.
const segCache = new WeakMap();

// A style attribute carries two different kinds of thing at once: STATE (ink,
// fill, border colour) and POSITION (which corner is rounded, how wide it is).
// Swapping whole attributes moved the rounded corner from the left button to
// the right one along with the highlight, so only the state half may move.
//
// And the two sides are compared as COMPUTED values, not as attribute text. The
// design writes `border:1px solid #253129` on one button and adds
// `border-color:#82bf9c` on the other, so a text diff says "this property only
// exists on one side" and the obvious repair - remove it - resolves the border
// to currentColor and paints it white. Computed styles are already resolved, so
// both sides always have a real value to swap in.
const STATE_PROPS = [
  'color', 'background-color', 'border-top-color', 'border-right-color',
  'border-bottom-color', 'border-left-color', 'box-shadow', 'opacity',
  'font-weight', 'text-decoration-line', 'filter',
  // the library tabs carry their active state as an underline, which is a
  // border-bottom WIDTH, not only a colour
  'border-bottom-width', 'border-bottom-style',
];

export function bindSegment(members, isActive) {
  const live = members.filter(Boolean).filter((el) => inCanon(el));
  if (live.length < 2) return false;
  const group = live[0].parentElement;
  let shape = segCache.get(group);
  if (!shape) {
    // Read both looks BEFORE anything is changed, or the first call captures its
    // own output and every member looks selected forever after. That happened:
    // both looks came from the same button, so tapping Score lit Score without
    // unlighting Falls. The design draws the selected member FIRST in every
    // segment it has, so that is the "on" look.
    const onEl = live[0];
    const onCS = getComputedStyle(onEl);
    const offEl = live.find((el) => STATE_PROPS.some((p) => getComputedStyle(el)[p] !== onCS[p]));
    if (!offEl) return false;   // one look for every member: nothing to swap
    const offCS = getComputedStyle(offEl);
    const on = {}, off = {};
    for (const p of STATE_PROPS) {
      if (onCS[p] === offCS[p]) continue;
      on[p] = onCS[p];
      off[p] = offCS[p];
    }
    shape = { on, off };
    segCache.set(group, shape);
  }
  for (const el of live) {
    const active = isActive(el);
    for (const [p, v] of Object.entries(active ? shape.on : shape.off)) el.style.setProperty(p, v);
    el.dataset.on = String(active);
  }
  return true;
}

export const bindSegmentByIds = (ids, activeId) =>
  bindSegment(ids.map((id) => $(id)), (el) => el.id === activeId);
