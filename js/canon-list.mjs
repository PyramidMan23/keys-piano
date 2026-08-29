// Fill a designed LIST without destroying the design.
//
// The app builds its lists the fast way: `$('trophy-list').innerHTML = rows
// .map(...)`. Under the canon that is the single most destructive thing it can
// do, because the container it is overwriting is full of the design's own
// markup. Measured before this file existed: 157 of 818 elements across the
// screens were the app's markup again within a second of mounting, and the
// pixel gate could not see it because it measures the mount, not what happens
// next.
//
// The design anticipated this. Every repeatable row in the canon carries
// data-i, and every progress pip carries data-k, in exactly the containers the
// app rebuilds. So the row template is not something to invent: it is sitting
// in the markup, indexed, waiting to be cloned.
//
// The rule this file keeps, same as canon-library.mjs: it writes no colour, no
// size, no radius and no spacing. It clones what the design drew and puts data
// in the slots.

// leaf text nodes of a row, in document order. The row element itself counts
// when it holds its text directly, which some slots do; missing that was worth
// 596 stray pixels on the library once already.
export const cellsOf = (row) =>
  [row, ...row.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim());

// The two appearances of a progress pip, harvested from the design's own rows.
// A design that draws three filled pips and two empty ones has already told us
// what filled and empty look like; there is no reason to write a colour here.
export function pipVariants(rows) {
  const ref = {};
  for (const row of rows) {
    for (const pip of row.querySelectorAll('[data-k]')) {
      const on = getComputedStyle(pip).backgroundColor !== 'rgba(0, 0, 0, 0)';
      const key = (pip.style.width || '?') + '|' + (on ? 'on' : 'off');
      if (!(key in ref)) ref[key] = pip.getAttribute('style');
    }
  }
  return ref;
}

export function setPips(row, filled, ref) {
  const pips = [...row.querySelectorAll('[data-k]')];
  pips.forEach((pip, i) => {
    const style = ref[(pip.style.width || '?') + '|' + (i < filled ? 'on' : 'off')];
    if (style) pip.setAttribute('style', style);
  });
  return pips.length;
}

// Rebuild a designed list from real items.
//
// `fill(row, item, i, helpers)` gets a CLONE of the design's own row. Returns
// false when the container has no designed row to clone, so a caller can fall
// back to the app's old renderer rather than silently produce an empty list.
export function fillCanonList(container, items, fill, pickTpl) {
  if (!container) return false;
  let drawn = [...container.children].filter((c) => c.hasAttribute('data-i'));
  if (!drawn.length) {
    // Most lists in the canon mark their rows with data-i, but a couple
    // (#xp-log, #path-lessons) are a heading followed by plain rows. Take the
    // children, minus a leading all-caps heading, rather than refuse to bind
    // and leave the app to overwrite the whole thing.
    const kids = [...container.children];
    // A heading can be a bare leaf ("XP LOG") or a padded WRAPPER holding one
    // leaf, which is how the desktop boards draw it. Treating the wrapper as a
    // row template wrote the first item's label INTO the heading and dropped
    // its value cell (the trophies journey caught the +50 going missing).
    const onlyLeaf = (el) => {
      const ls = [el, ...el.querySelectorAll('*')].filter((x) => !x.children.length && x.textContent.trim());
      return ls.length === 1 ? ls[0].textContent.trim() : null;
    };
    const isHeading = (el) => /^[A-Z0-9 ,.'-]{2,24}$/.test(onlyLeaf(el) ?? 'x-not-caps');
    drawn = kids.length > 1 && isHeading(kids[0]) ? kids.slice(1) : kids;
  }
  if (!drawn.length) return false;

  // NESTED GRIDS (the lessons-tab class, again on trophies): some boards draw
  // their repeatable UNITS two-to-a-row inside wrapper divs. Detected
  // conservatively: every drawn child is a pure wrapper of 2+ cells, and every
  // cell carries at least two text leaves of its own (a real card). Then the
  // CELLS are the units: deal them back into cloned wrapper rows, or the
  // binder fills wrappers and half the samples survive inside them.
  let rowTpl = null, perRow = 0, rowAnchor = null, rowParent = null;
  const leavesOf = (el) => [el, ...el.querySelectorAll('*')].filter((x) => !x.children.length && x.textContent.trim().length > 1);
  const nested = drawn.length >= 1 && drawn.every((r) =>
    r.children.length >= 2 && ![...r.childNodes].some((n) => n.nodeType === 3 && n.data.trim())
    && [...r.children].every((cell) => leavesOf(cell).length >= 2));
  if (nested) {
    perRow = Math.max(...drawn.map((r) => r.children.length));
    rowTpl = drawn[0].cloneNode(false);
    rowParent = drawn[0].parentElement;
    rowAnchor = drawn[drawn.length - 1].nextSibling;
    const cells = drawn.flatMap((r) => [...r.children]);
    for (const r of drawn) r.remove();
    drawn = cells;   // from here on, the cells ARE the drawn rows
  }

  const ref = pipVariants(drawn);
  // Keep whatever the design put AROUND the rows (a heading, a footnote). Only
  // the rows themselves are ours to replace.
  const anchor = nested ? null : drawn[drawn.length - 1].nextSibling;
  const templates = drawn.map((r) => r.cloneNode(true));
  if (!nested) for (const r of drawn) r.remove();

  // nested: rebuild wrapper rows and deal cells into them, perRow at a time
  const rowsOut = [];
  const cellHome = (i) => {
    const idx = Math.floor(i / perRow);
    while (rowsOut.length <= idx) {
      const nr = rowTpl.cloneNode(false);
      rowParent.insertBefore(nr, rowAnchor);
      rowsOut.push(nr);
    }
    return rowsOut[idx];
  };

  items.forEach((item, i) => {
    // reuse the matching sample row where the design drew several, so a list
    // whose rows alternate or escalate keeps doing that. A caller that knows
    // WHICH sample matches (the path picks by STAGE, so a card's drawn shape
    // agrees with its word) passes pickTpl; index order is the fallback.
    const pick = pickTpl ? pickTpl(item, i, templates) : null;
    const tpl = templates[(pick != null && pick >= 0) ? pick : Math.min(i, templates.length - 1)];
    const row = tpl.cloneNode(true);
    row.dataset.i = String(i);
    if (nested) cellHome(i).appendChild(row);
    else container.insertBefore(row, anchor);
    fill(row, item, i, { cells: cellsOf(row), setPips: (n) => setPips(row, n, ref) });
  });
  return true;
}
