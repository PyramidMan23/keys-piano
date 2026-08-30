// Measure the immersed deck: where every fixed thing sits, and whether the
// "Play again" pill is stealing hits from the keyboard.
//
// The pill moved from bottom-right (where it printed over the combo badge) to
// bottom-left, and bottom-left is the keyboard. No gate caught it because every
// element is individually correct; only a hit-test at the pill's own centre
// shows that a piano key is underneath it. Same lesson as the first move.
import { launch } from './cdp.mjs';

const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [], pmin: {}, lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: { 'still-dre-easy': { plays: 22, stars: 3, best: 91 } }, lessons: {}, lib: { learning: true },
};

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9682 });
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
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await new Promise((r) => setTimeout(r, 1400));
  await b.eval('window.__deckImmersion(true), true');
  await new Promise((r) => setTimeout(r, 900));

  const out = await b.eval(`(() => {
    const R = (el) => { if (!el) return null; const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
               right: Math.round(r.right), bottom: Math.round(r.bottom) }; };
    const byText = (t) => [...document.querySelectorAll('button,div,span')]
      .find((e) => e.textContent.trim() === t && e.getBoundingClientRect().width > 0);
    const board = document.getElementById('screen-play').firstElementChild;
    const pill = [...document.querySelectorAll('button')].find((e) => /Play again/.test(e.textContent));
    const rail = [...document.querySelectorAll('button')].find((e) => /CONTROLS/.test(e.textContent));
    const canvases = [...document.querySelectorAll('canvas')].map((c) => ({ el: c, r: c.getBoundingClientRect() }));
    const keys = (canvases.find((c) => c.r.height > 80 && c.r.bottom > innerHeight * 0.55) || {}).el;

    // What is ACTUALLY under the pill's centre and under each corner of it?
    const probes = {};
    if (pill) {
      const r = pill.getBoundingClientRect();
      const pts = { centre: [r.x + r.width / 2, r.y + r.height / 2],
                    left: [r.x + 6, r.y + r.height / 2],
                    right: [r.right - 6, r.y + r.height / 2] };
      // hide the pill and ask what the finger would have hit instead
      const vis = pill.style.visibility; pill.style.visibility = 'hidden';
      for (const [k, [x, y]] of Object.entries(pts)) {
        const el = document.elementFromPoint(x, y);
        probes[k] = el ? (el.tagName.toLowerCase()
          + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '')
          + ' text="' + (el.textContent || '').trim().slice(0, 18) + '"') : 'nothing';
      }
      pill.style.visibility = vis;
    }
    return JSON.stringify({
      viewport: { w: innerWidth, h: innerHeight },
      board: R(board), pill: R(pill), rail: R(rail), keyboard: R(keys),
      allCanvases: canvases.map((c) => ({ w: Math.round(c.r.width), h: Math.round(c.r.height), y: Math.round(c.r.y), bottom: Math.round(c.r.bottom) })),
      main: R(pill && pill.offsetParent),
      combo: R(byText('24 in a row')), tier: R(byText('TIER 1')),
      readoutStripBottom: R(document.querySelector('#screen-play')) ,
      underThePill: probes,
    }, null, 2);
  })()`);
  console.log(out);
} finally { await b.close(); }
