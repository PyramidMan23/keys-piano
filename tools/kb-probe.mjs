// WHAT IS ACTUALLY DRAWING THE KEYBOARD? Changing the canvas palette did
// nothing, and changing the artboard's own key markup did nothing either, so
// something else paints it. Ask the page rather than reason about it.
import { launch } from './cdp.mjs';

const screen = process.argv[2] || 'freeplay';
const b = await launch({ width: 1600, height: 950, scale: 1, port: 9672 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify({
    firstRunDone: true, diagnosticDone: true, days: [], pmin: {}, songs: {}, lessons: {}, lib: { learning: true },
  }))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 2200));
  await b.eval(`window.__show(${JSON.stringify(screen)}); true`);
  await new Promise((r) => setTimeout(r, 1400));

  console.log(await b.eval(`(() => {
    const out = [];
    // find the keyboard: the widest run of thin sibling boxes near the bottom
    const wKeys = [...document.querySelectorAll('[data-w]')].filter((e) => e.getBoundingClientRect().width > 0);
    const bKeys = [...document.querySelectorAll('[data-b]')].filter((e) => e.getBoundingClientRect().width > 0);
    out.push('artboard keys visible: ' + wKeys.length + ' white, ' + bKeys.length + ' black');
    if (wKeys.length) {
      const cs = getComputedStyle(wKeys[0]);
      out.push('  first white key background: ' + cs.background.slice(0, 90));
      const r = wKeys[0].getBoundingClientRect();
      out.push('  at ' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    const cv = [...document.querySelectorAll('canvas')].filter((c) => c.getBoundingClientRect().width > 50);
    out.push('visible canvases: ' + cv.map((c) => (c.id || '?') + ' ' +
      Math.round(c.getBoundingClientRect().width) + 'x' + Math.round(c.getBoundingClientRect().height)).join(', '));
    // what is under the middle of the keyboard region
    const probe = document.elementFromPoint(700, 600);
    const chain = [];
    for (let n = probe; n && chain.length < 4; n = n.parentElement) {
      const r = n.getBoundingClientRect();
      chain.push(n.tagName + (n.id ? '#' + n.id : '') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    out.push('under (700,600): ' + chain.join(' < '));
    // READ THE PIXEL. Everything else is inference.
    const cvs = document.getElementById('freeplay-canvas');
    if (cvs) {
      const g = cvs.getContext('2d');
      const px = (x, y) => { const d = g.getImageData(x, y, 1, 1).data; return d[0] + ',' + d[1] + ',' + d[2]; };
      out.push('canvas backing ' + cvs.width + 'x' + cvs.height);
      out.push('  a white key near its front edge: ' + px(Math.round(cvs.width * 0.30), Math.round(cvs.height - 20)));
      out.push('  same key higher up:              ' + px(Math.round(cvs.width * 0.30), Math.round(cvs.height * 0.80)));
      // how many elements claim this id? a duplicate would mean getElementById
      // and elementFromPoint are looking at DIFFERENT canvases
      out.push('  elements with id freeplay-canvas: ' + document.querySelectorAll('#freeplay-canvas, [id="freeplay-canvas"]').length);
      out.push('  the one under the pointer IS the one I read: ' + (document.elementFromPoint(700, 600) === cvs));
      // scan a row across the bottom of the keyboard and count the colours
      const row = Math.round(cvs.height - 24);
      const counts = new Map();
      const d = g.getImageData(0, row, cvs.width, 1).data;
      for (let x = 0; x < cvs.width; x++) {
        const k = d[x * 4] + ',' + d[x * 4 + 1] + ',' + d[x * 4 + 2];
        counts.set(k, (counts.get(k) || 0) + 1);
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      out.push('  colours across the key row: ' + top.map(([c, n]) => c + ' x' + n).join('  |  '));
      // The canvas is blank AND on top, which means the keyboard is DOM BEHIND
      // it. A canvas still hit-tests even where its pixels are transparent, so
      // elementFromPoint naming it proves nothing about what is painting.
      const wrap = cvs.parentElement;
      const kids = [...wrap.querySelectorAll('*')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.height > 40 && r.width > 4 && r.width < 60 && e !== cvs;
      });
      out.push('  key-shaped elements behind the canvas: ' + kids.length);
      if (kids.length) {
        const c0 = getComputedStyle(kids[0]);
        out.push('    raw style: ' + (kids[0].getAttribute('style') || '(none)').slice(0, 200));
        out.push('    its parent: <' + kids[0].parentElement.tagName.toLowerCase() + '> style=' +
          (kids[0].parentElement.getAttribute('style') || '(none)').slice(0, 140));
        // which canon board did this subtree come from?
        let root = kids[0];
        while (root && !root.dataset.canonScreen && root.parentElement) root = root.parentElement;
        out.push('    canon board: ' + (root && root.dataset ? (root.dataset.canonScreen || '(not tagged)') : '?'));
      }
    }
    return out.join('\\n');
  })()`));
} finally { await b.close(); }
