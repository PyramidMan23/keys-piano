// Force :active with CDP and read the computed style. This separates two
// questions a simulated press conflates: "is the CSS correct" and "did my fake
// press actually register". Only the first is about the app.
import { launch } from './cdp.mjs';
const SEED = { firstRunDone: true, diagnosticDone: true, days: [], pmin: {}, songs: {}, lessons: {}, lib: { learning: true } };
const b = await launch({ width: 1600, height: 950, scale: 1, port: 9688 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1900));
  await b.send('DOM.enable', {});
  await b.send('CSS.enable', {});
  const { root } = await b.send('DOM.getDocument', { depth: -1 });
  // find the button by text through the page, then map to a backend node id
  await b.eval(`(() => {
    const el = [...document.querySelectorAll('*')].find((e) => !e.children.length
      && e.textContent.trim() === 'Free play' && e.getBoundingClientRect().width > 0);
    el.setAttribute('data-press-probe', '1');
    return true;
  })()`);
  const { nodeId } = await b.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-press-probe="1"]' });
  console.log('resting  : ' + await b.eval(`getComputedStyle(document.querySelector('[data-press-probe]')).transform`));
  await b.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
  await new Promise((r) => setTimeout(r, 120));
  console.log('forced   : ' + await b.eval(`(() => { const s = getComputedStyle(document.querySelector('[data-press-probe]'));
    return s.transform + '   filter ' + s.filter; })()`));
  await b.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
} finally { await b.close(); }
