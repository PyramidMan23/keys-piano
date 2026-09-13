// DO THE EXPLORE COLLECTION CHIPS WORK, AT BOTH ENDS OF THE WINDOW?
//
// Explore is the all-songs wall and it is 81 pieces deep. The chips are the way
// in, and a way in that clips its own labels, puts its last three collections
// off the side of Mark's phone, or filters the list without moving the sort is
// worse than no way in at all, because it reads as working.
//
// So this probe never asks the app what it INTENDED. It opens the real page at
// 375x812 and at 1418x900, presses the chips with REAL HIT-TESTED CLICKS the
// way a finger does, and MEASURES what came back: every chip's rect against the
// VISIBLE WINDOW, the row's scrollWidth against its clientWidth, each chip's
// height against the 44px floor, the titles actually on the wall against the
// collection they claim to be, the Weakest order against difficultyScore
// itself, and the computed WCAG contrast of both inks on the chip's own ground.
// State is read as aria-pressed plus a MEASURED underline plus a MEASURED dot,
// never as "the class is there", and the hover colour is read by putting a real
// pointer on a chip.
//
//   PORT=4181 node tools/collections-probe.mjs
//
// PORT, because the gates run against the serving copy on 4180 and a build
// under test must never be graded by loading somebody else's tree.
//
// ☠️ THE PROBE MUST NOT SCROLL TO REACH A CHIP. The first cut did, and that is
// the gate agreeing with the bug: the 756px phone card scrolls sideways, the
// row filled its column, the last three chips sat past x=375, and scrolling to
// click them proved only that the probe could scroll. Every chip assertion here
// runs at scrollX 0 and compares against innerWidth. Controls that are NOT the
// chips (the sort pair, the tab strip) still sit off the side of that card on
// master, so those are scrolled into view the way a thumb does, and the scroll
// is put back before anything is measured.
//
// ☠️ AND THE 756 COLUMN ALREADY OVERFLOWS A 375 VIEWPORT with no chips on it at
// all, so "the document must not overflow" cannot be asserted flat at 375
// without failing a build that is no worse than master. The honest version is
// asserted instead, measured on one page in one state: hiding the chip row with
// display:none does not shrink the document's scrollWidth by a pixel. At 1418
// the flat rule holds and is asserted flat.
import { launch } from './cdp.mjs';

const BASE = 'http://localhost:' + (process.env.PORT || 4180) + '/index.html';
const WIDTHS = [[375, 812], [1418, 900]];

const fails = [];
const notes = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- the truth, read in node from the modules the app itself imports -------
const { SHELF } = await import('../js/songs.mjs');
const { groupSongs, filterCollection, COLLECTIONS } = await import('../js/library.mjs');
const { difficultyScore, HALL_OF_FAME } = await import('../js/difficulty.mjs');
const GROUPS = [...groupSongs(SHELF).values()];
const EXPECTED = Object.fromEntries(COLLECTIONS.map((c) => [c.key, filterCollection(GROUPS, c.key).length]));
const titleOf = (v) => v[v.length - 1].title;
const CLASSICAL_TITLES = new Set(filterCollection(GROUPS, 'classical').map(titleOf));
// the app orders Weakest first by the EASIEST tier's score, so that is what the
// rendered order is graded against
const SCORE = new Map(GROUPS.map((v) => [titleOf(v), difficultyScore(v[0])]));
// A tag the library ACTUALLY carries. "christmas" is in the allowed set but no
// piece carries it yet, so the probe searches for something real.
const SEARCH_TAG = ['christmas', 'jazz', 'games', 'classical'].find((t) => SHELF.some((s) => s.tags?.includes(t)));
const TAGGED = SEARCH_TAG ? new Set(GROUPS.filter((v) => v[0].tags?.includes(SEARCH_TAG)).map(titleOf)) : new Set();
// The collection with no pieces IS the empty state: no piece in this library is
// jazz or blues, so nothing has to be faked to reach it.
const EMPTY_KEY = COLLECTIONS.slice(1).find((c) => EXPECTED[c.key] === 0)?.key ?? null;
// Songs proven playable, so REPERTOIRE IS POPULATED rather than empty and the
// "the other shelves are untouched" check has something to be untouched about.
const PROVEN = ['fur-elise', 'river-easy', 'happy-birthday', 'ode-to-joy', 'jaws-easy']
  .filter((id) => SHELF.some((s) => s.id === id));

// The shelf starts COLLAPSED, the way it does for a person: no canonShowAll.
const seed = (lib) => ({
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 0,
  days: [], pmin: {}, lessons: {},
  songs: Object.fromEntries(PROVEN.map((id) => [id, { plays: 9, stars: 3, best: 95 }])),
  playable: Object.fromEntries(PROVEN.map((id) => [id, { provenAt: Date.now() - 2 * 864e5, days: [] }])),
  lib: Object.assign({ learning: true }, lib),
});

// ---- the contrast arithmetic, computed rather than trusted -----------------
// There is no contrast tool in tools/, so the ratios are done here and asserted
// at 4.5:1 for every piece of text on a chip. (The dot beside the underline is
// the part that does not depend on hue at all; Mark is colour blind.)
const chan = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const rgb = (css) => (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const ratio = (fg, bg) => {
  const a = lum(rgb(fg)), b = lum(rgb(bg));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
// a colour is "not there" when its alpha is zero, which is how an inactive
// chip's underline and dot are drawn (the space is kept, the ink is not)
const alphaOf = (css) => {
  if (!css || /transparent/.test(css)) return 0;
  const parts = css.match(/[\d.]+/g);
  if (!parts) return 0;
  return /rgba/.test(css) ? Number(parts[3] ?? 1) : 1;
};
const hex = (css) => '#' + rgb(css).map((v) => v.toString(16).padStart(2, '0')).join('');

// A REAL CLICK, never el.click(): a synthetic click does not hit-test, so it
// "succeeds" on an element something else is covering and nothing happens.
const hitWhere = (find, scroll) => '(() => {'
  + ' const el = (' + find + ');'
  + ' if (!el) return null;'
  + (scroll ? ' el.scrollIntoView({ block: "center", inline: "center" });' : '')
  + ' const r = el.getBoundingClientRect();'
  + ' if (!r.width || !r.height) return null;'
  + ' const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);'
  + ' const top = document.elementFromPoint(cx, cy);'
  + ' if (!top || !(top === el || el.contains(top) || top.contains(el))) return null;'
  + ' return { x: Math.round(cx), y: Math.round(cy) };'
  + '})()';
// A chip is never scrolled to SIDEWAYS. Vertically is fine, a thumb does that,
// and the wall gets long; horizontally is the whole finding, so scrollX is
// forced back to 0 before the rect is read and the hit test is done there.
const hitChip = (key) => '(() => {'
  + ' const el = document.querySelector("button.lib-collection[data-collection=\'' + key + '\']");'
  + ' if (!el) return null;'
  + ' el.scrollIntoView({ block: "center", inline: "nearest" });'
  + ' window.scrollTo(0, window.scrollY);'
  + ' const r = el.getBoundingClientRect();'
  + ' if (!r.width || !r.height) return null;'
  + ' const cx = r.x + r.width / 2, cy = r.y + r.height / 2;'
  + ' const top = document.elementFromPoint(cx, cy);'
  + ' if (!top || !(top === el || el.contains(top) || top.contains(el))) return null;'
  + ' return { x: Math.round(cx), y: Math.round(cy) };'
  + '})()';
const hitHere = (selector) => hitWhere('document.querySelector(' + JSON.stringify(selector) + ')', false);
const hitScrolled = (selector) => hitWhere('document.querySelector(' + JSON.stringify(selector) + ')', true);
const hitLabel = (re) => hitWhere('(() => {'
  + ' const want = ' + re + ';'
  + ' const ms = [...document.querySelectorAll("*")].filter((e) => !e.children.length'
  + '   && want.test(e.textContent.trim()) && e.getBoundingClientRect().width > 0);'
  + ' for (const el of ms.reverse()) return el.closest("button, a, [role=\'button\']") || el;'
  + ' return null;'
  + '})()', true);

// Everything about the chip row, the wall and the frame, in one round trip.
const MEASURE = `(() => {
  const row = document.querySelector('.lib-collections:not(.lib-collection-empty)');
  const strip = document.getElementById('sec-explore')?.parentElement ?? null;
  const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const chips = row ? [...row.querySelectorAll('button.lib-collection')].map((c) => {
    const b = c.getBoundingClientRect();
    const cs = getComputedStyle(c);
    const spans = [...c.querySelectorAll('span')];
    const dot = c.querySelector('i');
    const dcs = dot ? getComputedStyle(dot) : null;
    return {
      key: c.dataset.collection,
      label: spans[0]?.textContent ?? '',
      count: spans[1]?.textContent ?? '',
      pressed: c.getAttribute('aria-pressed'),
      x: b.x, y: b.y, w: b.width, h: b.height, right: b.right,
      scrollW: c.scrollWidth, clientW: c.clientWidth,
      bg: cs.backgroundColor,
      underlineW: parseFloat(cs.borderBottomWidth) || 0,
      underline: cs.borderBottomColor,
      labelInk: spans[0] ? getComputedStyle(spans[0]).color : null,
      countInk: spans[1] ? getComputedStyle(spans[1]).color : null,
      dotW: dcs ? parseFloat(dcs.width) : 0,
      dotBg: dcs ? dcs.backgroundColor : null,
    };
  }) : [];
  const empty = document.querySelector('.lib-collection-empty');
  return JSON.stringify({
    row: !!row,
    rowRect: box(row), stripRect: box(strip),
    rowScrollW: row ? row.scrollWidth : 0, rowClientW: row ? row.clientWidth : 0,
    rowWrap: row ? getComputedStyle(row).flexWrap : null,
    rowHoverVar: row ? getComputedStyle(row).getPropertyValue('--chip-hover-border').trim() : null,
    // the hover the DESIGN parks on its own tabs, for the chips to be graded against
    stripHover: (() => {
      for (const t of document.querySelectorAll('#sec-learning, #sec-repertoire, #sec-fame, #sec-explore')) {
        const m = /border-color:\\s*([^;]+)/.exec(t.getAttribute('style-hover') ?? '');
        if (m) return m[1].trim();
      }
      return null;
    })(),
    lines: [...new Set(chips.map((c) => Math.round(c.y)))].length,
    chips,
    // The titles ACTUALLY on the wall, tagged by whichever of the three
    // renderers drew them (data-lib-row; the ledger, the tile grid and the
    // sleeve wall all set it). When the sleeve wall is up the grid is STILL in
    // the document behind it, so counting every tag read 25 + 81 = 106 and the
    // gate called the app wrong. Whatever is in front is what is on the wall.
    titles: (() => {
      const gallery = document.getElementById('canon-gallery');
      const scope = gallery ?? document;
      return [...scope.querySelectorAll('[data-lib-row]')].map((e) => e.dataset.libRow);
    })(),
    gallery: !!document.getElementById('canon-gallery'),
    more: (() => { const m = [...document.querySelectorAll('*')]
      .find((e) => !e.children.length && /^Show the other \\d+ in /.test(e.textContent.trim()));
      return m ? m.textContent.trim() : null; })(),
    docScrollW: document.documentElement.scrollWidth,
    docClientW: document.documentElement.clientWidth,
    innerW: window.innerWidth, scrollX: window.scrollX,
    empty: empty ? empty.textContent : null,
    emptyBtn: !!document.querySelector('.lib-collection-reset'),
    tabs: [...document.querySelectorAll('#sec-learning, #sec-repertoire, #sec-fame, #sec-explore')]
      .map((t) => { const r = t.getBoundingClientRect();
        return t.textContent.replace(/\\s+/g, ' ').trim() + '@' + Math.round(r.height); }),
    placeholder: document.querySelector('input[type=search]')?.placeholder ?? null,
    errs: (window.__errs ?? []).slice(0, 5),
  });
})()`;

for (const [width, height] of WIDTHS) {
  const b = await launch({ width, height, scale: 1, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });
  const at = (msg) => `${width}x${height}: ${msg}`;
  const bad = (msg) => fails.push(at(msg));
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', {
      source: 'window.__errs = []; window.addEventListener("error", (e) => window.__errs.push(e.message));',
    });
    // EVERY measurement of a chip happens at scrollX 0. Clicking a control that
    // master leaves off the side of the 756 card scrolls the page sideways; put
    // it back before looking at anything.
    const home = () => b.eval('window.scrollTo(0, window.scrollY); true');
    const read = async () => { await home(); return JSON.parse(await b.eval(MEASURE)); };
    const clickAt = async (pt) => {
      await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y, buttons: 0 });
      await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', buttons: 1, clickCount: 1 });
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
      await wait(700);
    };
    const click = async (script, what) => {
      const pt = await b.eval(script);
      if (!pt) { bad(`nothing hit-testable at ${what}`); return false; }
      await clickAt(pt);
      return true;
    };
    const chipOf = (m, key) => m.chips.find((c) => c.key === key);
    const open = async (lib) => {
      await b.goto(BASE + '?canon=0');
      await b.eval('localStorage.setItem("keys-v1", ' + JSON.stringify(JSON.stringify(seed(lib))) + '); true');
      await b.goto(BASE + '?canon=1');
      await b.ready();
      await wait(1400);
      return read();
    };
    // PAGE THE WAY A PERSON DOES. A collection opens collapsed, so the whole
    // list is reached by pressing show-more until it is gone, and the count
    // that comes back is the count the chip has to match.
    // ☠️ AND THE SAME CONTROL DOES TWO DIFFERENT THINGS. On the 756 column it
    // pages the ledger in place; at desktop, where the sleeve wall exists, it
    // opens the FULL-SCREEN WALL instead (canon-library.mjs, Mark's call
    // 2026-08-29) and the grid behind it never grows. The first cut pressed it
    // eight times at 1418 and reported the app broken; the app was doing what
    // it was built to do. Either way the whole collection ends up on screen,
    // and either way the rows carry data-lib-row, so the count is read from
    // wherever it landed and the wall is closed with Escape afterwards.
    const galleryUp = () => b.eval('!!document.getElementById("canon-gallery")');
    const closeGallery = async () => {
      if (await galleryUp() !== true) return false;
      await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await wait(500);
      return true;
    };
    const expand = async () => {
      let m = await read();
      for (let i = 0; i < 8 && m.more; i++) {
        if (!await click(hitLabel('/^Show the other \\d+ in /'), 'the show-more control')) break;
        if (await galleryUp() === true) { m = await read(); return { ...m, gallery: true }; }
        m = await read();
      }
      if (m.more) bad(`show-more is still on screen after eight presses (${m.more})`);
      return m;
    };
    // Read a whole collection, then put the screen back the way it was.
    const whole = async () => {
      const m = await expand();
      if (m.gallery) await closeGallery();
      return m;
    };
    // The chips' own contribution to horizontal overflow, measured by taking
    // them away on the very page being measured and looking again.
    const overflowWithout = () => b.eval('(() => { const r = document.querySelector(".lib-collections"); '
      + 'if (!r) return null; const was = r.style.display; r.style.display = "none"; '
      + 'const w = document.documentElement.scrollWidth; r.style.display = was; return w; })()');
    const shelfOf = async (tab, lib) => {
      const m = await open(Object.assign({ canonTab: tab }, lib));
      if (m.row) bad(`the collection chips are showing on the ${tab} tab`);
      return (await whole()).titles;
    };

    // ---- the other shelves, POPULATED, with no chip row near them ----------
    const learningFirst = await open({ canonTab: 'learning' });
    if (learningFirst.row) bad('the collection chips are showing on the Learning tab');
    const tabsBefore = learningFirst.tabs.join(' / ');
    const repertoireAll = await shelfOf('repertoire', { collection: 'all' });
    const fameAll = await shelfOf('fame', { collection: 'all' });
    if (!repertoireAll.length) bad('the seed did not populate Repertoire, so nothing was compared');
    if (fameAll.length !== HALL_OF_FAME.length)
      bad(`Hall of fame shows ${fameAll.length} rows, the list has ${HALL_OF_FAME.length}`);
    console.log(at(`Repertoire ${repertoireAll.length} rows, Hall of fame ${fameAll.length} rows, no chip row on either`));

    // ---- Explore, All, COLLAPSED, as a person finds it ---------------------
    let m = await open({ canonTab: 'explore', collection: 'all' });
    if (!m.row) { bad('no collection row on Explore at all'); continue; }
    const collapsedRows = m.titles.length;
    const collapsedMore = m.more;
    if (!collapsedMore) bad('the wall opened fully expanded: there is no pagination to test');
    console.log(at(`${m.chips.length} chips on ${m.lines} line(s), row ${Math.round(m.rowRect.w)}x${Math.round(m.rowRect.h)}, ${collapsedRows} rows and ${JSON.stringify(collapsedMore)}`));
    console.log(at('chips: ' + m.chips.map((c) => `${c.label} ${c.count}`).join(' | ')));

    // ---- 1. seven chips, label and count, nothing clipped, all ON SCREEN ---
    if (m.scrollX !== 0) bad(`the page is scrolled to x=${m.scrollX} before any chip was measured`);
    if (m.chips.length !== COLLECTIONS.length)
      bad(`${m.chips.length} chips, expected ${COLLECTIONS.length}`);
    for (const c of m.chips) {
      const want = COLLECTIONS.find((x) => x.key === c.key);
      if (!want) { bad(`unknown chip ${c.key}`); continue; }
      if (c.label !== want.label) bad(`chip ${c.key} reads ${JSON.stringify(c.label)}, not ${JSON.stringify(want.label)}`);
      if (c.count !== String(EXPECTED[c.key])) bad(`chip ${c.key} counts ${c.count}, the data says ${EXPECTED[c.key]}`);
      if (c.scrollW > c.clientW + 1) bad(`chip ${c.label} is clipped: scrollWidth ${c.scrollW} over clientWidth ${c.clientW}`);
      if (c.x < m.rowRect.x - 0.5 || c.right > m.rowRect.x + m.rowRect.w + 0.5)
        bad(`chip ${c.label} sits outside its row (${Math.round(c.x)}..${Math.round(c.right)} against ${Math.round(m.rowRect.x)}..${Math.round(m.rowRect.x + m.rowRect.w)})`);
      // ☠️ THE ONE THAT MATTERS ON THE PHONE: every chip inside the window, flat.
      if (c.x < -0.5 || c.right > m.innerW + 0.5)
        bad(`chip ${c.label} is off the side of the ${m.innerW}px window (${Math.round(c.x)}..${Math.round(c.right)})`);
      // ---- the 44px floor, and the 48 ceiling the spec draws ----
      if (c.h < 44) bad(`chip ${c.label} is only ${c.h.toFixed(1)}px tall`);
      if (c.h > 48) bad(`chip ${c.label} is ${c.h.toFixed(1)}px tall, over the 48 ceiling`);
      // ---- contrast, computed, both inks on the chip's own ground ----
      for (const [what, ink] of [['label', c.labelInk], ['count', c.countInk]]) {
        const r = ratio(ink, c.bg);
        if (r < 4.5) bad(`chip ${c.label} ${what} ink ${ink} on ${c.bg} is ${r.toFixed(2)}:1`);
      }
    }
    console.log(at(`every chip inside the ${m.innerW}px window: rightmost edge ${Math.round(Math.max(...m.chips.map((c) => c.right)))}`));
    {
      const c = m.chips[0];
      console.log(at(`ink ${c.labelInk} ${ratio(c.labelInk, c.bg).toFixed(1)}:1, count ${m.chips[1].countInk} ${ratio(m.chips[1].countInk, c.bg).toFixed(1)}:1 on ${c.bg}`));
    }

    // ---- the harvested hover actually REACHES the chip ---------------------
    // The first cut set --chip-hover-border and THEN assigned cssText, which
    // replaces the whole declaration block, custom properties included, so the
    // CSS fallback answered every time and it still looked right on screen.
    // Read the variable, then put a real pointer on a chip and read the border.
    if (!m.stripHover) notes.push(at('the design parks no style-hover on its tabs; the chips use the fallback'));
    else if (m.rowHoverVar !== m.stripHover)
      bad(`the chips carry --chip-hover-border ${JSON.stringify(m.rowHoverVar)}, the strip's own hover is ${JSON.stringify(m.stripHover)}`);
    {
      const pt = await b.eval(hitChip('classical'));
      if (!pt) bad('the Classical chip is not hit-testable where it sits');
      else {
        await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y, buttons: 0 });
        await wait(250);
        const hovered = await b.eval('getComputedStyle(document.querySelector(\'button.lib-collection[data-collection="classical"]\')).borderBottomColor');
        if (m.stripHover && hex(hovered) !== m.stripHover.toLowerCase())
          bad(`a hovered chip borders ${hovered} (${hex(hovered)}), the strip's own hover is ${m.stripHover}`);
        else console.log(at(`a hovered chip borders ${hex(hovered)}, which is the strip's own ${m.stripHover}`));
        // take the pointer off again, or every later measurement is hovered
        await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2, buttons: 0 });
        await wait(150);
      }
    }

    // ---- 2. the row wraps, never scrolls, and adds no overflow -------------
    if (m.rowWrap !== 'wrap') bad(`the row is ${m.rowWrap}, not wrap`);
    if (m.rowScrollW > m.rowClientW + 1) bad(`the row scrolls sideways (${m.rowScrollW} over ${m.rowClientW})`);
    if (width >= 1418 && m.lines !== 1) bad(`${m.lines} lines at 1418, the spec is one`);
    if (width <= 375 && m.lines > 3) bad(`${m.lines} lines at 375, the spec allows three`);
    if (m.stripRect && m.rowRect.x < m.stripRect.x - 0.5)
      bad('the chip row starts left of the tab strip it sits under');
    if (m.stripRect && m.rowRect.x + m.rowRect.w > m.stripRect.x + m.stripRect.w + 0.5)
      bad('the chip row is wider than the tab strip it sits under');
    {
      const chipless = await overflowWithout();
      if (chipless !== null && m.docScrollW > chipless)
        bad(`the chips added horizontal overflow: ${m.docScrollW} against ${chipless} with the row hidden`);
      console.log(at(`document scrollWidth ${m.docScrollW} in a ${m.docClientW} viewport, and ${chipless} with the chip row hidden`));
    }
    if (width >= 1418 && m.docScrollW > m.docClientW)
      bad(`the document overflows sideways at 1418 (${m.docScrollW} over ${m.docClientW})`);
    if (m.placeholder !== 'Search all songs')
      bad(`the search box reads ${JSON.stringify(m.placeholder)}, not "Search all songs"`);

    // ---- collapsed -> expanded, by pressing the control a person presses ---
    const allExpanded = await whole();
    if (allExpanded.titles.length !== EXPECTED.all)
      bad(`${allExpanded.titles.length} rows on the expanded wall, the All chip says ${EXPECTED.all}`);
    if (allExpanded.titles.length <= collapsedRows) bad('show-more did not add any rows');
    if (allExpanded.titles.some((t) => /Scale$/.test(t)))
      bad('a technique drill reached the Explore wall: ' + allExpanded.titles.filter((t) => /Scale$/.test(t)).join(', '));
    console.log(at(`collapsed ${collapsedRows} rows, expanded ${allExpanded.titles.length}, show-more gone`));

    // ---- 4. Classical filters, RESETS THE PAGE, and the state moves --------
    if (!await click(hitChip('classical'), 'the Classical chip')) continue;
    // expanded -> chip -> collapsed again
    const collapsedAgain = await read();
    if (collapsedAgain.titles.some((t) => !CLASSICAL_TITLES.has(t)))
      bad('the first page of Classical already carries a row that is not classical');
    if (collapsedRows < EXPECTED.classical) {
      // the composition holds fewer rows than this collection has, so choosing
      // it must hand back a FIRST PAGE with its door, exactly as a tab click does
      if (!collapsedAgain.more)
        bad('choosing a collection did not put the list back to its first page');
      if (collapsedAgain.titles.length >= EXPECTED.classical)
        bad(`choosing a collection showed all ${collapsedAgain.titles.length} rows instead of one page`);
      console.log(at(`Classical opens collapsed at ${collapsedAgain.titles.length} rows with ${JSON.stringify(collapsedAgain.more)}`));
    } else {
      // this composition draws more rows than Classical has, so there is no
      // page to reset; say so rather than assert something that cannot be true
      if (collapsedAgain.titles.length !== EXPECTED.classical)
        bad(`Classical fits this frame but drew ${collapsedAgain.titles.length} of ${EXPECTED.classical} rows`);
      notes.push(at(`Classical (${EXPECTED.classical}) fits this frame's ${collapsedRows}-row page, so the pagination reset is exercised at 375 only`));
    }

    m = await whole();
    const cls = chipOf(m, 'classical');
    const others = m.chips.filter((c) => c.key !== 'classical');
    if (cls.pressed !== 'true') bad('Classical is not aria-pressed after a click');
    if (others.some((c) => c.pressed !== 'false')) bad('another chip is still aria-pressed');
    if (!(cls.underlineW >= 2)) bad(`Classical has no underline (${cls.underlineW}px)`);
    if (alphaOf(cls.underline) === 0) bad(`Classical's underline is invisible (${cls.underline})`);
    if (others.some((c) => alphaOf(c.underline) > 0)) bad('an inactive chip is still underlined');
    if (!(alphaOf(cls.dotBg) > 0 && cls.dotW >= 4)) bad(`Classical carries no dot (${cls.dotW}px ${cls.dotBg})`);
    if (others.some((c) => alphaOf(c.dotBg) > 0)) bad('an inactive chip carries a filled dot');
    // the dot's SPACE is reserved on every chip, so nothing jumps when one is pressed
    if (others.some((c) => c.dotW < cls.dotW - 0.5)) bad('an inactive chip does not reserve the dot space');
    if (m.titles.length !== EXPECTED.classical)
      bad(`${m.titles.length} rows rendered for Classical, the chip says ${EXPECTED.classical}`);
    const strays = m.titles.filter((t) => !CLASSICAL_TITLES.has(t));
    if (strays.length) bad(`rows that are not classical: ${strays.join(', ')}`);
    {
      const chipless = await overflowWithout();
      if (chipless !== null && m.docScrollW > chipless) bad('filtering added horizontal overflow');
    }
    console.log(at(`Classical: ${m.titles.length} rows, all classical, underline ${cls.underline} plus a ${cls.dotW}px dot`));

    // ---- 5. the sorts reorder the FILTERED rows, and Weakest IS the order --
    if (await click(hitLabel('/^A to Z$/'), 'the "A to Z" control')) {
      const az = await whole();
      const sorted = [...az.titles].sort((x, y) => x.localeCompare(y));
      if (az.titles.length !== EXPECTED.classical) bad(`A to Z changed the filtered count to ${az.titles.length}`);
      if (az.titles.join('|') !== sorted.join('|')) bad('A to Z did not order the filtered rows alphabetically');
      if (az.titles.join('|') === m.titles.join('|')) bad('A to Z left the filtered rows in the order they were in');
      if (await click(hitLabel('/^Weakest$/'), 'the "Weakest" control')) {
        const diff = await whole();
        if (diff.titles.length !== EXPECTED.classical) bad(`Weakest changed the filtered count to ${diff.titles.length}`);
        if (diff.titles.join('|') === az.titles.join('|')) bad('Weakest first did not reorder the filtered rows');
        // THE ORDER ITSELF, not merely that it moved: the easiest tier's score,
        // non-decreasing down the list, graded against difficultyScore.
        const scores = diff.titles.map((t) => SCORE.get(t));
        const nowhere = diff.titles.filter((t) => SCORE.get(t) === undefined);
        if (nowhere.length) bad(`no difficulty score for ${nowhere.join(', ')}`);
        for (let i = 1; i < scores.length; i++) {
          if (!(scores[i] >= scores[i - 1] - 1e-9)) {
            bad(`Weakest first is out of order: ${diff.titles[i - 1]} ${scores[i - 1]} then ${diff.titles[i]} ${scores[i]}`);
            break;
          }
        }
        console.log(at(`Weakest first runs ${scores[0]} to ${scores[scores.length - 1]}, non-decreasing across all ${scores.length} filtered rows`));
      }
    }

    // ---- 6. search bypasses the collection, matches tags, then gives it back
    const type = (q) => b.eval(`(() => { const i = document.querySelector('input[type=search]');
      i.value = ${JSON.stringify(q)}; i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    if (!SEARCH_TAG) bad('no tag in LIBRARY to search for');
    else {
      await type(SEARCH_TAG); await wait(700);
      const hits = await whole();
      if (hits.row) bad('the chip row is still showing during a search');
      if (!hits.titles.length) bad(`searching ${JSON.stringify(SEARCH_TAG)} found nothing`);
      const byTag = hits.titles.filter((t) => TAGGED.has(t));
      if (byTag.length !== TAGGED.size)
        bad(`searching the tag ${JSON.stringify(SEARCH_TAG)} found ${byTag.length} of the ${TAGGED.size} pieces carrying it`);
      console.log(at(`search "${SEARCH_TAG}" found ${hits.titles.length} rows, ${byTag.length} of them carrying the tag`));
      await type(''); await wait(800);
      const back = await whole();
      if (!back.row) bad('clearing the query did not bring the chip row back');
      else if (chipOf(back, 'classical')?.pressed !== 'true')
        bad('clearing the query did not restore the chosen collection');
      else if (back.titles.length !== EXPECTED.classical)
        bad(`after clearing, ${back.titles.length} rows instead of the collection's ${EXPECTED.classical}`);
    }

    // ---- 7. a reload restores it, and the other shelves do not move --------
    await b.goto(BASE + '?canon=1');
    await b.ready();
    await wait(1400);
    const after = await whole();
    if (!after.row) bad('no chip row after a reload');
    else if (chipOf(after, 'classical')?.pressed !== 'true') bad('the collection did not survive a reload');
    else if (after.titles.length !== EXPECTED.classical)
      bad(`after a reload, ${after.titles.length} rows instead of ${EXPECTED.classical}`);
    for (const [word, seen] of [['Learning', after.tabs[0]], ['Repertoire', after.tabs[1]], ['Hall of fame', after.tabs[2]]]) {
      if (!seen) { bad(`the ${word} tab is gone`); continue; }
      if (!seen.startsWith(word)) bad(`the ${word} tab reads ${JSON.stringify(seen)}`);
      if (Number(seen.split('@').pop()) < 44) bad(`the ${word} tab shrank to ${seen.split('@').pop()}px`);
    }
    if (after.tabs.join(' / ') !== tabsBefore)
      bad(`the tab strip changed: ${tabsBefore} -> ${after.tabs.join(' / ')}`);
    // THE OTHER SHELVES DO NOT MOVE. Same seed, same tabs, a collection chosen:
    // the rows AND their order must be identical to what they were with no
    // collection at all. A filter that leaked into Repertoire would show up
    // here as a shorter list or a different first row.
    const repertoireFiltered = await shelfOf('repertoire', { collection: 'classical' });
    const fameFiltered = await shelfOf('fame', { collection: 'classical' });
    if (repertoireFiltered.join('|') !== repertoireAll.join('|'))
      bad(`Repertoire changed with a collection chosen: ${repertoireAll.join(', ')} -> ${repertoireFiltered.join(', ')}`);
    if (fameFiltered.join('|') !== fameAll.join('|'))
      bad(`Hall of fame changed with a collection chosen: ${fameAll.join(', ')} -> ${fameFiltered.join(', ')}`);
    console.log(at(`Repertoire and Hall of fame identical in rows and order with a collection chosen (${repertoireFiltered.length} and ${fameFiltered.length} rows)`));

    // ---- 8. the empty state, and its way out -------------------------------
    // Jazz & blues is genuinely empty in this library (no piece carries jazz or
    // blues), so this leg exercises the real state rather than a seeded one.
    await open({ canonTab: 'explore', collection: 'all' });
    if (!EMPTY_KEY) {
      notes.push(at('every collection has pieces now: the empty state was not exercised'));
    } else if (await click(hitChip(EMPTY_KEY), `the ${EMPTY_KEY} chip`)) {
      const e = await read();
      if (!e.empty || !/No pieces in this collection/.test(e.empty))
        bad(`the empty collection says ${JSON.stringify(e.empty)}, not "No pieces in this collection"`);
      if (!e.emptyBtn) bad('the empty state has no "Show all" control');
      if (e.titles.length) bad(`${e.titles.length} rows rendered for an empty collection`);
      if (chipOf(e, EMPTY_KEY)?.pressed !== 'true') bad('a zero-count chip did not take the selection');
      {
        const chipless = await overflowWithout();
        if (chipless !== null && e.docScrollW > chipless) bad('the empty state added horizontal overflow');
      }
      if (await click(hitHere('.lib-collection-reset'), 'the "Show all" control')) {
        const restored = await whole();
        if (chipOf(restored, 'all')?.pressed !== 'true') bad('"Show all" did not reset to All');
        if (restored.empty) bad('the empty state is still showing after "Show all"');
        if (restored.titles.length !== EXPECTED.all)
          bad(`"Show all" restored ${restored.titles.length} rows, not the wall's ${EXPECTED.all}`);
        console.log(at(`the empty ${EMPTY_KEY} chip reads right, and "Show all" restores ${restored.titles.length} rows`));
      }
    }

    // and the chips belong to Explore alone
    if (await click(hitScrolled('#sec-learning'), 'the Learning tab')) {
      const onLearning = await read();
      if (onLearning.row) bad('the collection chips are showing on Learning');
      else console.log(at('Learning has no chip row'));
    }

    const errs = (await read()).errs;
    if (errs.length) bad('page errors: ' + errs.join(' | '));
  } finally {
    await b.close();
  }
}

for (const line of notes) console.log('note: ' + line);
if (fails.length) { for (const f of fails) console.log('FAIL: ' + f); process.exit(1); }
console.log('PASS: the collection chips render inside the window, wrap, filter, page, sort, search, persist and empty out cleanly at 375 and 1418');
