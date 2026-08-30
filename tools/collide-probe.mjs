// WHAT IS THE "PLAY AGAIN" BUTTON SITTING ON TOP OF?
//
// The immersed screenshot shows it overlapping the combo badge in the bottom
// right corner. Measure both rather than eyeball the pixels.
import { launch } from './cdp.mjs';

const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [], pmin: {}, lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: { 'still-dre-easy': { plays: 22, stars: 3, best: 91 } }, lessons: {}, lib: { learning: true },
};

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9679 });
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

  console.log(await b.eval(`(() => {
    const R = (e) => { const r = e.getBoundingClientRect();
      return Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); };
    const again = document.querySelector('[aria-label="Play again from the start"]');
    const ar = again.getBoundingClientRect();
    const out = ['viewport ' + innerWidth + 'x' + innerHeight];
    out.push('again      ' + R(again) + '   parent <' + again.parentElement.tagName.toLowerCase() + '> ' + R(again.parentElement));
    // anything else visible that overlaps the button's box
    for (const e of document.querySelectorAll('*')) {
      if (e === again || again.contains(e) || e.contains(again)) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (getComputedStyle(e).visibility === 'hidden') continue;
      const hit = r.x < ar.x + ar.width && r.x + r.width > ar.x && r.y < ar.y + ar.height && r.y + r.height > ar.y;
      if (!hit) continue;
      const t = (e.textContent || '').trim().slice(0, 30);
      if (e.children.length > 2) continue;         // containers, not the thing itself
      out.push('overlaps   ' + R(e) + '   z=' + getComputedStyle(e).zIndex + '  ' + JSON.stringify(t));
    }
    return out.join('\\n');
  })()`));
} finally { await b.close(); }
