// IS THE "PLAY AGAIN" BUTTON REALLY THERE WHILE IMMERSED, AND REALLY QUIET?
//
// Mark, 2026-08-30: "when the notes and keyboard take up the whole screen, can
// we have a restart button ... out of the way, semi opaque, but we know it's
// there kind of thing. Do this in a nice way. Very, very nice way."
//
// Three things have to be true at once and only one of them is visible in the
// source: it exists while immersed, it is QUIET at rest, and it comes up when
// you reach for it. So this measures the real element in the real immersed
// board rather than trusting the cssText that created it.
//
// ☠️ MEASURES THE RESTING STATE. The button animates opacity over 180ms, and
// reading it mid-transition reports a number that is true for no one.
//
//   node tools/restart-probe.mjs
import { launch } from './cdp.mjs';

const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [], pmin: {},
  lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: { 'still-dre-easy': { plays: 22, stars: 3, best: 91 }, 'fur-elise': { plays: 79, stars: 3, best: 96 } },
  lessons: {}, lib: { learning: true },
};

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9676 });
const fails = [];
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1800));

  const pt = await b.eval(`(() => {
    for (const label of ['Still D.R.E.', 'Start']) {
      const matches = [...document.querySelectorAll('*')].filter((e) => !e.children.length
        && e.textContent.trim() === label && e.getBoundingClientRect().width > 0);
      for (const el of matches.reverse()) {
        const hit = el.closest('button, a, [role="button"]') || el;
        const r = hit.getBoundingClientRect();
        const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);
        const top = document.elementFromPoint(cx, cy);
        if (top && (top === hit || hit.contains(top) || top.contains(hit))) return { x: Math.round(cx), y: Math.round(cy) };
      }
    }
    return null;
  })()`);
  if (!pt) { console.log('could not open a song'); process.exit(1); }
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await new Promise((r) => setTimeout(r, 1300));

  // before immersion it must be absent, or it is clutter on the normal board
  const beforeShown = await b.eval(`(() => {
    const el = document.querySelector('[aria-label="Play again from the start"]');
    if (!el) return 'missing';
    return getComputedStyle(el).display;
  })()`);
  if (beforeShown === 'missing') fails.push('the Play again button was never created');
  else if (beforeShown !== 'none') fails.push(`Play again is showing (display:${beforeShown}) BEFORE immersion`);

  // the app's OWN lever (canon-play.mjs exposes it beside the dblclick and the
  // Train button), rather than hunting the board element and guessing at it
  const entered = await b.eval(`(() => {
    if (typeof window.__deckImmersion !== 'function') return 'no window.__deckImmersion';
    window.__deckImmersion(true);
    return 'immersed';
  })()`);
  if (entered !== 'immersed') { fails.push(entered); }
  await new Promise((r) => setTimeout(r, 700));    // let the 180ms transition settle

  const rest = await b.eval(`(() => {
    const el = document.querySelector('[aria-label="Play again from the start"]');
    if (!el) return { err: 'gone' };
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const vw = innerWidth, vh = innerHeight;
    // is it the topmost thing at its own centre? a button nothing can click is
    // not a button, and this is the check a synthetic .click() would skip
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return {
      display: cs.display, opacity: +cs.opacity, height: Math.round(r.height),
      right: Math.round(vw - (r.x + r.width)), bottom: Math.round(vh - (r.y + r.height)),
      label: el.textContent.trim(), border: cs.borderColor,
      hittable: !!top && (top === el || el.contains(top)),
    };
  })()`);
  if (rest.err) fails.push('the button vanished on entering immersion');
  else {
    console.log(`immersed: ${rest.label} | ${rest.height}px tall, ${rest.right}px from the right, ` +
      `${rest.bottom}px from the bottom`);
    console.log(`  resting opacity ${rest.opacity}, border ${rest.border}, clickable=${rest.hittable}`);
    if (rest.display === 'none') fails.push('immersed but the button is display:none');
    if (rest.height < 44) fails.push(`${rest.height}px tall, under the 44px touch target`);
    if (!(rest.opacity > 0.15 && rest.opacity < 0.6)) {
      fails.push(`resting opacity ${rest.opacity}: Mark asked for "semi opaque, but we know it's there"`);
    }
    if (!rest.hittable) fails.push('something is covering the button: it cannot be clicked');
  }

  // ☠️ AND IT MUST NOT LAND ON ANYTHING. Every measurement above passed while
  // the button was printed straight over the combo badge, because each element
  // was individually correct and nothing compared them. Overlap is the defect
  // that only a screenshot caught, so it becomes an assertion here.
  const over = await b.eval(`(() => {
    const again = document.querySelector('[aria-label="Play again from the start"]');
    const a = again.getBoundingClientRect();
    const hits = [];
    for (const e of document.querySelectorAll('*')) {
      if (e === again || again.contains(e) || e.contains(again)) continue;
      if (e.children.length) continue;                  // leaves: the visible text itself
      const r = e.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (getComputedStyle(e).visibility === 'hidden' || !(e.textContent || '').trim()) continue;
      if (r.x < a.x + a.width && r.x + r.width > a.x && r.y < a.y + a.height && r.y + r.height > a.y) {
        hits.push((e.textContent || '').trim().slice(0, 30));
      }
    }
    return hits;
  })()`);
  if (over.length) fails.push(`Play again is printed over: ${over.map((s) => JSON.stringify(s)).join(', ')}`);
  else console.log('  overlaps nothing on screen');

  // and it must come up when reached for
  const woke = await b.eval(`(() => {
    const el = document.querySelector('[aria-label="Play again from the start"]');
    el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
    return null;
  })(), true`);
  void woke;
  await new Promise((r) => setTimeout(r, 500));
  const hot = await b.eval(`(() => {
    const el = document.querySelector('[aria-label="Play again from the start"]');
    const cs = getComputedStyle(el);
    return { opacity: +cs.opacity, border: cs.borderColor };
  })()`);
  console.log(`  on hover: opacity ${hot.opacity}, border ${hot.border}`);
  if (!(hot.opacity > 0.9)) fails.push(`hover only reaches opacity ${hot.opacity}`);
  if (hot.border === rest.border) fails.push('hover does not change the border: no signal but opacity');
} finally { await b.close(); }

if (fails.length) {
  console.log('\nFAIL');
  for (const f of fails) console.log('  ' + f);
  process.exit(1);
}
console.log('\nPlay again: hidden on the normal board, quiet while immersed, wakes when reached for');
