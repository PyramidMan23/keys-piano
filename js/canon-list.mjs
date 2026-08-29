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
export function fillCanonList(container, items, fill) {
  if (!container) return false;
  let drawn = [...container.children].filter((c) => c.hasAttribute('data-i'));
  if (!drawn.length) {
    // Most lists in the canon mark their rows with data-i, but a couple
    // (#xp-log, #path-lessons) are a heading followed by plain rows. Take the
    // children, minus a leading all-caps heading, rather than refuse to bind
    // and leave the app to overwrite the whole thing.
    const kids = [...container.children];
    const isHeading = (el) => !el.children.length && /^[A-Z0-9 ,.'-]{2,24}$/.test(el.textContent.trim());
    drawn = kids.length > 1 && isHeading(kids[0]) ? kids.slice(1) : kids;
  }
  if (!drawn.length) return false;

  const ref = pipVariants(drawn);
  // Keep whatever the design put AROUND the rows (a heading, a footnote). Only
  // the rows themselves are ours to replace.
  const anchor = drawn[drawn.length - 1].nextSibling;
  const templates = drawn.map((r) => r.cloneNode(true));
  for (const r of drawn) r.remove();

  items.forEach((item, i) => {
    // reuse the matching sample row where the design drew several, so a list
    // whose rows alternate or escalate keeps doing that
    const tpl = templates[Math.min(i, templates.length - 1)];
    const row = tpl.cloneNode(true);
    row.dataset.i = String(i);
    container.insertBefore(row, anchor);
    fill(row, item, i, { cells: cellsOf(row), setPips: (n) => setPips(row, n, ref) });
  });
  return true;
}
