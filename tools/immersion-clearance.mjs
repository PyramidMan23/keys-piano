// GATE: nothing overlaid on the immersed deck may sit on top of anything else.
//
// The "Play again" pill has now been placed twice and collided twice - first
// with the combo badge, then with the keyboard - and neither time did any gate
// notice, because every element was individually correct. Correctness of the
// parts is not clearance between them, so this measures the gaps.
//
// It also hit-tests the pill's own centre. An overlap check alone would still
// pass a button that renders in a clear space while an invisible layer eats its
// clicks, and it is the hit that the player actually experiences.
//
//   node tools/immersion-clearance.mjs        (needs the server on :4180)
import { launch } from './cdp.mjs';

const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [], pmin: {}, lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: { 'still-dre-easy': { plays: 22, stars: 3, best: 91 } }, lessons: {}, lib: { learning: true },
};

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9684 });
const fails = [];
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1900));
  const pt = await b.eval(`(() => {
    for (const label of ['Still D.R.E.', 'Start']) {
      const m = [...document.querySelectorAll('*')].filter((e) => !e.children.length
        && e.textContent.trim() === label && e.getBoundingClientRect().width > 0);
      for (const el of m.reverse()) {
        const hit = el.closest('button, a, [role="button"]') || el;
        const r = hit.getBoundingClientRect();
        const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);
        const t = document.elementFromPoint(cx, cy);
        if (t && (t === hit || hit.contains(t) || t.contains(hit))) return { x: Math.round(cx), y: Math.round(cy) };
      }
    }
    return null;
  })()`);
  if (!pt) { console.error('FAIL: could not reach the play deck'); process.exit(1); }
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await new Promise((r) => setTimeout(r, 1400));
  await b.eval('window.__deckImmersion(true), true');
  await new Promise((r) => setTimeout(r, 900));

  const raw = await b.eval(`(() => {
    const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom }; };
    const byText = (re) => [...document.querySelectorAll('button,div,span')]
      .find((e) => re.test(e.textContent.trim()) && e.getBoundingClientRect().width > 0);
    const pill = [...document.querySelectorAll('button')].find((e) => /Play again/.test(e.textContent));
    const rail = [...document.querySelectorAll('button')].find((e) => /CONTROLS/.test(e.textContent));
    // ONE canvas carries the whole deck: falling notes on top, keyboard along
    // the bottom. Treat the entire canvas as untouchable - anything laid over
    // any part of it covers either a note or a key.
    const deck = [...document.querySelectorAll('canvas')]
      .map((c) => ({ el: c, r: c.getBoundingClientRect() }))
      .filter((c) => c.r.width > 400 && c.r.height > 200)
      .sort((a, z) => z.r.width * z.r.height - a.r.width * a.r.height)[0];
    let hit = null;
    if (pill) {
      const r = pill.getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      hit = el === pill || pill.contains(el) ? 'pill' : (el ? el.tagName.toLowerCase() + ' "' + (el.textContent || '').trim().slice(0, 24) + '"' : 'nothing');
    }
    // INK, not just box. The canon-root all-revert rule strips SVG presentation
    // attributes, so the icon can measure a perfect 16x16 and paint nothing.
    // Every earlier check here passed while the arrow was black on a black pill.
    // (No backticks in this comment: it lives inside a template literal.)
    let icon = null;
    if (pill) {
      const path = pill.querySelector('svg path');
      const svg = pill.querySelector('svg');
      const r2 = svg && svg.getBoundingClientRect();
      const cs2 = path && getComputedStyle(path);
      icon = { w: r2 ? Math.round(r2.width) : 0, h: r2 ? Math.round(r2.height) : 0,
               stroke: cs2 ? cs2.stroke : 'NO PATH', strokeWidth: cs2 ? cs2.strokeWidth : '0',
               color: getComputedStyle(pill).color };
    }
    return JSON.stringify({
      pill: R(pill), rail: R(rail), deck: deck ? R(deck.el) : null,
      combo: R(byText(/^\\d+ in a row$/)), tier: R(byText(/^TIER \\d$/)), hit, icon,
      immersed: document.getElementById('screen-play').firstElementChild.dataset.immersed === '1',
    });
  })()`);
  const m = JSON.parse(raw);

  const overlap = (a, z) => {
    if (!a || !z) return 0;
    const w = Math.min(a.right, z.right) - Math.max(a.x, z.x);
    const h = Math.min(a.bottom, z.bottom) - Math.max(a.y, z.y);
    return w > 0 && h > 0 ? Math.round(w) * Math.round(h) : 0;
  };
  const box = (r) => r ? `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.w)}x${Math.round(r.h)}` : 'MISSING';

  if (!m.immersed) fails.push('the deck did not enter immersion, so nothing below was actually tested');
  if (!m.pill) fails.push('the "Play again" pill is not present while immersed');
  else {
    for (const [name, r] of [['the deck canvas (notes AND keys)', m.deck], ['the combo badge', m.combo],
                             ['the TIER chip', m.tier], ['the CONTROLS rail', m.rail]]) {
      const px = overlap(m.pill, r);
      if (px > 0) fails.push(`"Play again" (${box(m.pill)}) overlaps ${name} (${box(r)}) by ${px}px2`);
    }
    if (m.hit !== 'pill') fails.push(`a click at the centre of "Play again" lands on ${m.hit}, not the button`);
    if (Math.round(m.pill.h) < 44) fails.push(`"Play again" is ${Math.round(m.pill.h)}px tall; every touch target here is 44`);
    const ic = m.icon;
    if (!ic || !ic.w || !ic.h) fails.push('the refresh icon has no box');
    else if (ic.stroke === 'none' || /rgba\(0, 0, 0, 0\)/.test(ic.stroke)) {
      fails.push(`the refresh icon measures ${ic.w}x${ic.h} but its stroke is "${ic.stroke}" - it paints NOTHING. `
        + 'That is `all: revert` eating the SVG presentation attributes; exempt #cp-again in style.css.');
    } else if (ic.stroke !== ic.color) {
      fails.push(`the icon stroke (${ic.stroke}) no longer follows the pill's colour (${ic.color}); currentColor was lost`);
    }
  }

  // DOES IT ACTUALLY RESTART? Everything above is geometry and ink; none of it
  // proves the button does its job. The pill is supposed to drive the board's
  // own #btn-restart rather than a second code path, so watch that control and
  // click the pill with a REAL mouse event at real coordinates - a dispatched
  // click would skip hit-testing and pass even if something covered the pill.
  if (m.pill) {
    await b.eval(`(() => { window.__restartFired = 0;
      document.getElementById('btn-restart').addEventListener('click', () => { window.__restartFired++; });
      return true; })()`);
    const cx = Math.round(m.pill.x + m.pill.w / 2), cy = Math.round(m.pill.y + m.pill.h / 2);
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 });
    await new Promise((r) => setTimeout(r, 600));
    const fired = await b.eval('String(window.__restartFired)');
    if (fired !== '1') fails.push(`clicking "Play again" fired the real Restart ${fired} times, expected exactly 1`);
    else console.log('  click  drives #btn-restart exactly once');
  }

  console.log('immersion clearance');
  console.log('  pill  ' + box(m.pill) + '   hit-test: ' + m.hit);
  console.log('  icon  ' + (m.icon ? `${m.icon.w}x${m.icon.h} stroke=${m.icon.stroke} width=${m.icon.strokeWidth}` : 'MISSING'));
  console.log('  deck  ' + box(m.deck));
  console.log('  combo ' + box(m.combo) + '   tier ' + box(m.tier) + '   rail ' + box(m.rail));
} finally { await b.close(); }

if (fails.length) { console.error('\nFAIL\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('\nPASS  nothing overlaps, and the pill owns its own centre');
