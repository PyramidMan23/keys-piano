// THE GEOMETRY GATE (2026-08-29). Mark's screenshot showed library tiles
// painted ON TOP of the practice chart, the path teaser and the form check
// once more tiles rendered than the board drew, and no gate saw it: pixels
// matched the design (which never drew that state), every control had a
// listener, and every journey ended on the right screen.
//
// So this measures the thing he pointed at: on EVERY screen, in the heavy
// states, no two visible controls may overlap, nothing may leave the frame,
// and the fixed composition may not overflow itself outside a designated
// scroll region.
//
// Run: node tools/canon-geometry.mjs
import { launch } from './cdp.mjs';

const today = new Date();
const day = (o) => { const d = new Date(today); d.setDate(d.getDate() - o);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// a HEAVY seed: plays across many songs so show-all and search produce the
// dense grid that caused the original overlap
const SONG_IDS = ['fur-elise', 'still-dre-easy', 'mario-easy', 'river', 'runaway-easy',
  'game-of-thrones-easy', 'lost-easy', 'numb-easy', 'interstellar-easy', 'faded-easy',
  'pirates-easy', 'piano-man-easy', 'empire-easy', 'hotel-california-easy'];
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [day(0), day(1), day(2)], pmin: { [day(0)]: 24, [day(1)]: 12 },
  lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: Object.fromEntries(SONG_IDS.map((id, i) => [id, { plays: i + 1, stars: i % 4, best: 70 + i }])),
  lib: { learning: true },
};

// overlays that deliberately sit over other content
const OVERLAYS = ['freeze-offer', 'canon-tools-drawer', 'firstrun', 'results', 'theory-card'];

const PROBE = `((screenId) => {
  // a screen id, or a full-screen overlay's own id (the sleeve-wall gallery)
  const host = document.getElementById('screen-' + screenId) ?? document.getElementById(screenId);
  const card = host && host.firstElementChild;
  if (!card) return { missing: true };
  const problems = [];
  const cr = card.getBoundingClientRect();

  // 1. the composition must not overflow itself where the spill is VISIBLE.
  // overflow hidden/auto/scroll all CONTAIN their content (the hero card clips
  // its own 520px glow circles by design); only overflow visible paints out.
  const contains2 = (el) => getComputedStyle(el).overflowY !== 'visible';
  for (const el of [card, ...card.querySelectorAll('*')]) {
    if (el.scrollHeight > el.clientHeight + 8 && el.clientHeight > 0 && !contains2(el)) {
      let anc = el.parentElement, held = false;
      while (anc && anc !== card.parentElement) { if (contains2(anc)) { held = true; break; } anc = anc.parentElement; }
      if (!held) {
        const tag = el.tagName + (el.id ? '#' + el.id : '');
        if (!problems.some((p) => p.startsWith('overflow'))) {
          problems.push('overflow: ' + tag + ' spills ' + (el.scrollHeight - el.clientHeight) + 'px visibly');
        }
      }
    }
  }

  // the VISIBLE portion of a rect: clipped by every non-visible-overflow
  // ancestor, because a tile scrolled out of the grid still reports its raw
  // rect and is not really anywhere
  const clip = (el, r) => {
    let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
    let anc = el.parentElement;
    while (anc && anc !== card.parentElement) {
      const cs = getComputedStyle(anc);
      if (cs.overflowY !== 'visible' || cs.overflowX !== 'visible') {
        const ar = anc.getBoundingClientRect();
        x1 = Math.max(x1, ar.left); y1 = Math.max(y1, ar.top);
        x2 = Math.min(x2, ar.right); y2 = Math.min(y2, ar.bottom);
      }
      anc = anc.parentElement;
    }
    return { left: x1, top: y1, right: x2, bottom: y2, width: Math.max(0, x2 - x1), height: Math.max(0, y2 - y1) };
  };

  // 2. visible interactive controls: inside the frame, and never intersecting
  const controls = [...card.querySelectorAll('button, a, input, select, [style*="cursor: pointer"], [style*="cursor:pointer"]')]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      if (${JSON.stringify(OVERLAYS)}.some((id) => el.closest('#' + id))) return false;
      // occluded-by-design (hidden panes) never count
      const cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none';
    });
  const rects = controls.map((el) => ({ el, r: clip(el, el.getBoundingClientRect()) }))
    .filter((x) => x.r.width > 2 && x.r.height > 2);
  for (const { el, r } of rects) {
    if (r.right > cr.right + 2 || r.bottom > cr.bottom + 2 || r.left < cr.left - 2 || r.top < cr.top - 2) {
      problems.push('outside frame: ' + (el.id || el.tagName + ' "' + (el.textContent || '').trim().slice(0, 24) + '"'));
    }
  }
  const name = (el) => el.id || el.tagName + ' "' + (el.textContent || '').trim().slice(0, 24) + '"';
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b2 = rects[j];
      if (a.el.contains(b2.el) || b2.el.contains(a.el)) continue;
      const ox = Math.min(a.r.right, b2.r.right) - Math.max(a.r.left, b2.r.left);
      const oy = Math.min(a.r.bottom, b2.r.bottom) - Math.max(a.r.top, b2.r.top);
      if (ox > 2 && oy > 2) {
        problems.push('OVERLAP: ' + name(a.el) + ' x ' + name(b2.el) + ' (' + Math.round(ox) + 'x' + Math.round(oy) + 'px)');
        if (problems.length > 8) return { problems };
      }
    }
  }
  return { problems };
})`;

const b = await launch({ width: 1418, height: 738, scale: 1, port: 9541 });
const results = [];
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1800));

  const SCREENS = ['library', 'play', 'lessons', 'lesson', 'task', 'path', 'echo', 'rhythm',
    'improv', 'freeplay', 'metronome', 'trophies', 'takes', 'calibrate', 'touch', 'keys12'];
  for (const s of SCREENS) {
    await b.eval(`window.__show(${JSON.stringify(s)}); true`);
    await new Promise((r) => setTimeout(r, 400));
    const res = await b.eval(`${PROBE}(${JSON.stringify(s)})`);
    results.push({ state: s, ...res });
  }

  // the library's HEAVY states, the ones that caused the original overlap.
  // On desktop the show-more tile now opens the full-screen sleeve wall
  // (2026-08-29), which is measured as its own state and then closed.
  await b.eval(`window.__show('library'); true`);
  await new Promise((r) => setTimeout(r, 400));
  await b.eval(`(() => { const m = [...document.querySelectorAll('#screen-library *')].find((e) => !e.children.length && /^Show the other/.test(e.textContent.trim())); (m && (m.closest('button') ?? m.parentElement)).click(); return true; })()`);
  await new Promise((r) => setTimeout(r, 900));
  const g = await b.eval(`!!document.getElementById('canon-gallery')`);
  if (g) {
    results.push({ state: 'library gallery (sleeve wall)', ...(await b.eval(`${PROBE}('canon-gallery')`)) });
    await b.eval(`(document.getElementById('canon-gallery')?.remove(), true)`);
  } else {
    // the phone composition keeps the in-place expansion
    results.push({ state: 'library show-all', ...(await b.eval(`${PROBE}('library')`)) });
  }
  const libStates = [
    ['library explore tab', `(() => { document.getElementById('sec-explore')?.click(); return true; })()`],
    ['library search', `(() => { const s2 = document.getElementById('lib-search'); s2.value = 'a'; s2.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`],
  ];
  for (const [label, action] of libStates) {
    await b.eval(action);
    await new Promise((r) => setTimeout(r, 600));
    const res = await b.eval(`${PROBE}('library')`);
    results.push({ state: label, ...res });
  }
} finally { await b.close(); }

let failed = 0;
for (const r of results) {
  const bad = r.missing ? ['screen missing'] : (r.problems ?? []);
  if (bad.length) failed++;
  console.log(`${bad.length ? 'FAIL' : 'PASS'}  ${r.state}`);
  for (const p of bad) console.log('        ' + p);
}
console.log(`\n${results.length - failed}/${results.length} states: no overlapped controls, nothing outside the frame, no uncontained overflow`);
process.exit(failed ? 1 : 0);
