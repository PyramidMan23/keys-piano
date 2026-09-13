// DO THE EXPLORE COLLECTION CHIPS WORK, AT BOTH ENDS OF THE WINDOW?
//
// Explore is the all-songs wall and it is 81 pieces deep. The chips are the way
// in, and a way in that clips its own labels, hides its seventh collection past
// the right edge, or filters the list without moving the sort is worse than no
// way in at all, because it reads as working.
//
// So this probe never asks the app what it INTENDED. It opens the real page at
// 375x812 and at 1418x900, presses the chips with REAL HIT-TESTED CLICKS the
// way a finger does, and MEASURES what came back: every chip's rect against its
// row's, the row's scrollWidth against its clientWidth, each chip's height
// against the 44px floor, the titles actually on the wall against the
// collection they claim to be, and the computed WCAG contrast of both chip inks
// on the chip's own ground. State is read as aria-pressed plus a MEASURED
// underline plus a MEASURED dot, never as "the class is there".
//
//   PORT=4181 node tools/collections-probe.mjs
//
// PORT, because the gates run against the serving copy on 4180 and a build
// under test must never be graded by loading somebody else's tree.
//
// ☠️ THE 756 COLUMN ALREADY OVERFLOWS A 375 VIEWPORT, by 136px, with no chips
// on screen at all: the phone composition is a fixed 756px card and the app
// scrolls it sideways. The Explore tab overflows further than Learning does,
// and it did that before any of this was written. So "the document must not
// overflow" cannot be asserted flat at 375 without failing a build that is no
// worse than master, and comparing one tab against another measures the tabs,
// not the chips. What IS asserted is the honest version, measured on ONE page
// in ONE state: the row never scrolls sideways, it sits exactly inside the tab
// strip's own box, and hiding the row with display:none does not shrink the
// document's scrollWidth by a single pixel. At 1418 the flat rule holds and is
// asserted flat.

import { launch } from './cdp.mjs';

const BASE = 'http://localhost:' + (process.env.PORT || 4180) + '/index.html';
const WIDTHS = [[375, 812], [1418, 900]];

// A seeded state so the wall is the WALL: nothing played, nothing proven, so
// every piece sits in Explore and the counts are the catalogue's own.
const seed = (lib) => ({
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 0,
  days: [], pmin: {}, songs: {}, lessons: {},
  // canonShowAll, because the page deals only what its composition holds (5
  // ledger rows, or the desktop grid's capacity) and "the rows equal the chip's
  // count" is a claim about the whole collection, not about one page of it.
  lib: Object.assign({ learning: true, canonShowAll: true }, lib),
});

const fails = [];
const notes = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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

// A REAL CLICK, never el.click(): a synthetic click does not hit-test, so it
// "succeeds" on an element something else is covering and nothing happens.
//
// ☠️ AND AT 375 THE TARGET IS OFTEN OFF THE SIDE OF THE VIEWPORT. The 756
// card scrolls sideways, so the Explore tab, the sort pair and the last three
// chips all sit past x=375 and elementFromPoint returns null for every one of
// them: the first run read that as "nothing hit-testable" three times and it
// was the probe that was wrong, not the app. Scroll the target into view the
// way a thumb does, THEN hit-test, and re-read the rect afterwards because
// scrolling moved it.
const scrollIntoViewThen = (find) => '(() => {'
  + ' const el = (' + find + ');'
  + ' if (!el) return null;'
  + ' el.scrollIntoView({ block: "center", inline: "center" });'
  + ' const r = el.getBoundingClientRect();'
  + ' if (!r.width || !r.height) return null;'
  + ' const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);'
  + ' const top = document.elementFromPoint(cx, cy);'
  + ' if (!top || !(top === el || el.contains(top) || top.contains(el))) return null;'
  + ' return { x: Math.round(cx), y: Math.round(cy) };'
  + '})()';
const hitSelector = (selector) => scrollIntoViewThen(
  'document.querySelector(' + JSON.stringify(selector) + ')');
const hitLabel = (re) => scrollIntoViewThen('(() => {'
  + ' const want = ' + re + ';'
  + ' const ms = [...document.querySelectorAll("*")].filter((e) => !e.children.length'
  + '   && want.test(e.textContent.trim()) && e.getBoundingClientRect().width > 0);'
  + ' for (const el of ms.reverse()) return el.closest("button, a, [role=\'button\']") || el;'
  + ' return null;'
  + '})()');

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
      x: b.x, y: b.y, w: b.width, h: b.height,
      scrollW: c.scrollWidth, clientW: c.clientWidth,
      bg: cs.backgroundColor,
      underlineW: parseFloat(cs.borderBottomWidth) || 0,
      underline: cs.borderBottomColor,
      labelInk: spans[0] ? getComputedStyle(spans[0]).color : null,
      labelWeight: spans[0] ? getComputedStyle(spans[0]).fontWeight : null,
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
    lines: [...new Set(chips.map((c) => Math.round(c.y)))].length,
    chips,
    // the titles ACTUALLY on the wall, tagged by whichever of the two renderers
    // drew them (data-lib-row, the ledger and the tile grid both set it)
    titles: [...document.querySelectorAll('[data-lib-row]')].map((e) => e.dataset.libRow),
    more: (() => { const m = [...document.querySelectorAll('*')]
      .find((e) => !e.children.length && /^Show the other \\d+ in /.test(e.textContent.trim()));
      return m ? m.textContent.trim() : null; })(),
    docScrollW: document.documentElement.scrollWidth,
    docClientW: document.documentElement.clientWidth,
    empty: empty ? empty.textContent : null,
    emptyBtn: !!document.querySelector('.lib-collection-reset'),
    tabs: [...document.querySelectorAll('#sec-learning, #sec-repertoire, #sec-fame, #sec-explore')]
      .map((t) => { const r = t.getBoundingClientRect();
        return t.textContent.replace(/\\s+/g, ' ').trim() + '@' + Math.round(r.h); }),
    query: document.querySelector('input[type=search]')?.value ?? null,
    placeholder: document.querySelector('input[type=search]')?.placeholder ?? null,
    errs: (window.__errs ?? []).slice(0, 5),
  });
})()`;

// The truth the chips are graded against comes from the DATA, read here in node
// from the same modules the app imports, never from the chips themselves.
const { SHELF } = await import('../js/songs.mjs');
const { groupSongs, filterCollection, COLLECTIONS } = await import('../js/library.mjs');
const GROUPS = [...groupSongs(SHELF).values()];
const EXPECTED = Object.fromEntries(COLLECTIONS.map((c) => [c.key, filterCollection(GROUPS, c.key).length]));
const titleOf = (v) => v[v.length - 1].title;
const CLASSICAL = new Set(filterCollection(GROUPS, 'classical').map(titleOf));
// A tag the library ACTUALLY carries, for the search leg. "christmas" is in the
// allowed set but no piece carries it yet, so the probe searches for something
// real rather than pretending a Christmas shelf exists.
const SEARCH_TAG = ['christmas', 'jazz', 'games', 'classical'].find((t) => SHELF.some((s) => s.tags?.includes(t)));
const TAGGED = SEARCH_TAG ? new Set(GROUPS.filter((v) => v[0].tags?.includes(SEARCH_TAG)).map(titleOf)) : new Set();
// The collection with no pieces IS the empty state: no piece in this library is
// jazz or blues, so nothing has to be faked or seeded to reach it.
const EMPTY_KEY = COLLECTIONS.slice(1).find((c) => EXPECTED[c.key] === 0)?.key ?? null;

for (const [width, height] of WIDTHS) {
  const b = await launch({ width, height, scale: 1, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });
  const at = (msg) => `${width}x${height}: ${msg}`;
  const bad = (msg) => fails.push(at(msg));
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', {
      source: 'window.__errs = []; window.addEventListener("error", (e) => window.__errs.push(e.message));',
    });
    const read = async () => JSON.parse(await b.eval(MEASURE));
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
    // The seed asks for the whole shelf up front, so a read IS the whole
    // collection. Nothing here clicks show-more: that control's hit target
    // moves with the grid and a flaky click would make this gate lie.
    const showAll = read;

    // THE CHIPS' OWN CONTRIBUTION TO HORIZONTAL OVERFLOW, measured by taking
    // them away on the very page being measured and looking again.
    const overflowWithout = async () => {
      const before = await b.eval('(() => { const r = document.querySelector(".lib-collections"); '
        + 'if (!r) return null; const was = r.style.display; r.style.display = "none"; '
        + 'const w = document.documentElement.scrollWidth; r.style.display = was; return w; })()');
      return before;
    };

    // ---- the tab strip as it stands, with no chips on it -----------------
    await b.goto(BASE + '?canon=0');
    await b.eval('localStorage.setItem("keys-v1", ' + JSON.stringify(JSON.stringify(seed({ canonTab: 'learning' }))) + '); true');
    await b.goto(BASE + '?canon=1');
    await b.ready();
    await wait(1400);
    const base = await read();
    if (base.row) bad('the collection chips are showing on the Learning tab');
    const tabsBefore = base.tabs.join(' / ');

    // ---- now Explore, All ---------------------------------------------------
    await b.goto(BASE + '?canon=0');
    await b.eval('localStorage.setItem("keys-v1", ' + JSON.stringify(JSON.stringify(seed({ canonTab: 'explore', collection: 'all' }))) + '); true');
    await b.goto(BASE + '?canon=1');
    await b.ready();
    await wait(1400);

    let m = await read();
    if (!m.row) { bad('no collection row on Explore at all'); continue; }
    console.log(at(`${m.chips.length} chips on ${m.lines} line(s), row ${Math.round(m.rowRect.w)}x${Math.round(m.rowRect.h)}`));
    console.log(at('chips: ' + m.chips.map((c) => `${c.label} ${c.count}`).join(' | ')));

    // ---- 1. seven chips, label and count, nothing clipped -------------------
    if (m.chips.length !== COLLECTIONS.length)
      bad(`${m.chips.length} chips, expected ${COLLECTIONS.length}`);
    for (const c of m.chips) {
      const want = COLLECTIONS.find((x) => x.key === c.key);
      if (!want) { bad(`unknown chip ${c.key}`); continue; }
      if (c.label !== want.label) bad(`chip ${c.key} reads ${JSON.stringify(c.label)}, not ${JSON.stringify(want.label)}`);
      if (c.count !== String(EXPECTED[c.key])) bad(`chip ${c.key} counts ${c.count}, the data says ${EXPECTED[c.key]}`);
      if (c.scrollW > c.clientW + 1) bad(`chip ${c.label} is clipped: scrollWidth ${c.scrollW} over clientWidth ${c.clientW}`);
      if (c.x < m.rowRect.x - 0.5 || c.x + c.w > m.rowRect.x + m.rowRect.w + 0.5)
        bad(`chip ${c.label} sits outside its row (${Math.round(c.x)}..${Math.round(c.x + c.w)} against ${Math.round(m.rowRect.x)}..${Math.round(m.rowRect.x + m.rowRect.w)})`);
      // ---- 3. the 44px floor, and the 48 ceiling the spec draws ----
      if (c.h < 44) bad(`chip ${c.label} is only ${c.h.toFixed(1)}px tall`);
      if (c.h > 48) bad(`chip ${c.label} is ${c.h.toFixed(1)}px tall, over the 48 ceiling`);
      // ---- contrast, computed, both inks on the chip's own ground ----
      for (const [what, ink] of [['label', c.labelInk], ['count', c.countInk]]) {
        const r = ratio(ink, c.bg);
        if (r < 4.5) bad(`chip ${c.label} ${what} ink ${ink} on ${c.bg} is ${r.toFixed(2)}:1`);
      }
    }
    {
      const c = m.chips[0];
      console.log(at(`ink ${c.labelInk} ${ratio(c.labelInk, c.bg).toFixed(1)}:1, count ${m.chips[1].countInk} ${ratio(m.chips[1].countInk, c.bg).toFixed(1)}:1 on ${c.bg}`));
    }

    // ---- 2. the row wraps, never scrolls, and adds no overflow -------------
    if (m.rowWrap !== 'wrap') bad(`the row is ${m.rowWrap}, not wrap`);
    if (m.rowScrollW > m.rowClientW + 1) bad(`the row scrolls sideways (${m.rowScrollW} over ${m.rowClientW})`);
    if (width >= 1418 && m.lines !== 1) bad(`${m.lines} lines at 1418, the spec is one`);
    if (width <= 375 && m.lines > 3) bad(`${m.lines} lines at 375, the spec allows three`);
    if (m.stripRect && (m.rowRect.x < m.stripRect.x - 0.5
        || m.rowRect.x + m.rowRect.w > m.stripRect.x + m.stripRect.w + 0.5))
      bad('the chip row is wider than the tab strip it sits under');
    const chipless = await overflowWithout();
    if (chipless !== null && m.docScrollW > chipless)
      bad(`the chips added horizontal overflow: ${m.docScrollW} against ${chipless} with the row hidden`);
    console.log(at(`document scrollWidth ${m.docScrollW} in a ${m.docClientW} viewport, and ${chipless} with the chip row hidden`));
    if (width >= 1418 && m.docScrollW > m.docClientW)
      bad(`the document overflows sideways at 1418 (${m.docScrollW} over ${m.docClientW})`);
    if (m.placeholder !== 'Search all songs')
      bad(`the search box reads ${JSON.stringify(m.placeholder)}, not "Search all songs"`);

    const allShown = await showAll();
    if (allShown.titles.length !== EXPECTED.all)
      bad(`${allShown.titles.length} rows on the whole wall, the All chip says ${EXPECTED.all}`);
    if (allShown.titles.some((t) => /Scale$/.test(t)))
      bad('a technique drill reached the Explore wall: ' + allShown.titles.filter((t) => /Scale$/.test(t)).join(', '));

    // ---- 4. pressing Classical filters, and the state MOVES ----------------
    if (!await click(hitSelector('button.lib-collection[data-collection="classical"]'), 'the Classical chip')) continue;
    m = await showAll();
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
    const strays = m.titles.filter((t) => !CLASSICAL.has(t));
    if (strays.length) bad(`rows that are not classical: ${strays.join(', ')}`);
    { const c = await overflowWithout(); if (c !== null && m.docScrollW > c) bad('filtering added horizontal overflow'); }
    console.log(at(`Classical: ${m.titles.length} rows, all classical, underline ${cls.underline} plus a ${cls.dotW}px dot`));

    // ---- 5. the sorts reorder the FILTERED rows ----------------------------
    let az = null;
    if (!await click(hitLabel('/^A to Z$/'), 'the "A to Z" control')) { /* recorded */ }
    else {
      az = await showAll();
      const sorted = [...az.titles].sort((x, y) => x.localeCompare(y));
      if (az.titles.length !== EXPECTED.classical) bad(`A to Z changed the filtered count to ${az.titles.length}`);
      if (az.titles.join('|') !== sorted.join('|')) bad('A to Z did not order the filtered rows alphabetically');
      if (az.titles.join('|') === m.titles.join('|')) bad('A to Z left the filtered rows in the order they were in');
      if (await click(hitLabel('/^Weakest$/'), 'the "Weakest" control')) {
        const diff = await showAll();
        if (diff.titles.length !== EXPECTED.classical) bad(`Weakest changed the filtered count to ${diff.titles.length}`);
        if (diff.titles.join('|') === az.titles.join('|')) bad('Weakest first did not reorder the filtered rows');
        console.log(at(`both sorts reorder the filtered set: A to Z starts ${JSON.stringify(az.titles[0])}, Weakest starts ${JSON.stringify(diff.titles[0])}`));
      }
    }

    // ---- 6. search bypasses the collection, matches tags, then gives it back
    const type = (q) => b.eval(`(() => { const i = document.querySelector('input[type=search]');
      i.value = ${JSON.stringify(q)}; i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    if (!SEARCH_TAG) bad('no tag in LIBRARY to search for');
    else {
      await type(SEARCH_TAG); await wait(700);
      const hits = await showAll();
      if (hits.row) bad('the chip row is still showing during a search');
      if (!hits.titles.length) bad(`searching ${JSON.stringify(SEARCH_TAG)} found nothing`);
      const byTag = hits.titles.filter((t) => TAGGED.has(t));
      if (byTag.length !== TAGGED.size)
        bad(`searching the tag ${JSON.stringify(SEARCH_TAG)} found ${byTag.length} of the ${TAGGED.size} pieces carrying it`);
      console.log(at(`search "${SEARCH_TAG}" found ${hits.titles.length} rows, ${byTag.length} of them carrying the tag`));
      await type(''); await wait(800);
      const back = await showAll();
      if (!back.row) bad('clearing the query did not bring the chip row back');
      else if (chipOf(back, 'classical')?.pressed !== 'true')
        bad('clearing the query did not restore the chosen collection');
      else if (back.titles.length !== EXPECTED.classical)
        bad(`after clearing, ${back.titles.length} rows instead of the collection's ${EXPECTED.classical}`);
    }

    // ---- 7. a reload restores it, and the other tabs are untouched ---------
    await b.goto(BASE + '?canon=1');
    await b.ready();
    await wait(1400);
    const after = await showAll();
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
    // and the chips belong to Explore alone
    if (await click(hitSelector('#sec-learning'), 'the Learning tab')) {
      const onLearning = await read();
      if (onLearning.row) bad('the collection chips are showing on Learning');
      else console.log(at('Learning has no chip row; Learning, Repertoire and Hall of fame all unchanged'));
      await click(hitSelector('#sec-explore'), 'the Explore tab');
    }

    // ---- 8. the empty state, and its way out -------------------------------
    // Jazz & blues is genuinely empty in this library (no piece carries jazz or
    // blues), so this leg exercises the real state rather than a seeded one.
    //
    // It starts from a fresh load because the Learning tab click above turns
    // the show-all flag off, which is what a tab click is supposed to do; this
    // leg counts whole collections and needs the whole wall.
    await b.goto(BASE + '?canon=0');
    await b.eval('localStorage.setItem("keys-v1", ' + JSON.stringify(JSON.stringify(seed({ canonTab: 'explore', collection: 'all' }))) + '); true');
    await b.goto(BASE + '?canon=1');
    await b.ready();
    await wait(1400);
    if (!EMPTY_KEY) {
      notes.push(at('every collection has pieces now: the empty state was not exercised'));
    } else if (await click(hitSelector(`button.lib-collection[data-collection="${EMPTY_KEY}"]`), `the ${EMPTY_KEY} chip`)) {
      const e = await read();
      if (!e.empty || !/No pieces in this collection/.test(e.empty))
        bad(`the empty collection says ${JSON.stringify(e.empty)}, not "No pieces in this collection"`);
      if (!e.emptyBtn) bad('the empty state has no "Show all" control');
      if (e.titles.length) bad(`${e.titles.length} rows rendered for an empty collection`);
      if (chipOf(e, EMPTY_KEY)?.pressed !== 'true') bad('a zero-count chip did not take the selection');
      { const c = await overflowWithout(); if (c !== null && e.docScrollW > c) bad('the empty state added horizontal overflow'); }
      if (await click(hitSelector('.lib-collection-reset'), 'the "Show all" control')) {
        const restored = await showAll();
        if (chipOf(restored, 'all')?.pressed !== 'true') bad('"Show all" did not reset to All');
        if (restored.empty) bad('the empty state is still showing after "Show all"');
        if (restored.titles.length !== EXPECTED.all)
          bad(`"Show all" restored ${restored.titles.length} rows, not the wall's ${EXPECTED.all}`);
        console.log(at(`the empty ${EMPTY_KEY} chip reads right, and "Show all" restores ${restored.titles.length} rows`));
      }
    }

    const errs = (await read()).errs;
    if (errs.length) bad('page errors: ' + errs.join(' | '));
  } finally {
    await b.close();
  }
}

for (const line of notes) console.log('note: ' + line);
if (fails.length) { for (const f of fails) console.log('FAIL: ' + f); process.exit(1); }
console.log('PASS: the collection chips render, wrap, filter, sort, search, persist and empty out cleanly at 375 and 1418');
