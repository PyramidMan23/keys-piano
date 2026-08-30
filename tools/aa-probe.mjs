// Why is one side's text grayscale-antialiased and the other's subpixel?
// Chrome drops LCD text on any composited / non-opaque / contained ancestor.
import { launch } from './cdp.mjs';
const D = 'http://localhost:4180/design-2026-08/keys-prototype.html?raw=1';
const B = 'http://localhost:4180/design-2026-08/canon-harness.html?screen=library-desktop';
const PROPS = ['opacity', 'transform', 'filter', 'willChange', 'isolation', 'mixBlendMode',
  'contain', 'backdropFilter', 'webkitFontSmoothing', 'perspective', 'overflow', 'backgroundColor', 'position', 'zIndex'];
const probe = `(() => {
  const el = document.querySelector('.pane.on')
    ? (document.querySelector('.pane.on').querySelector('.dv-card') || document.querySelector('.pane.on').firstElementChild)
    : document.querySelector('#host').firstElementChild;
  const leaf = [...el.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim() === 'C Major Scale');
  if (!leaf) return 'NO LEAF';
  const out = [];
  for (let n = leaf; n && n !== document.documentElement; n = n.parentElement) {
    const s = getComputedStyle(n);
    const bits = ${JSON.stringify(PROPS)}
      .map((p) => p + '=' + s[p])
      .filter((t) => !/=(none|normal|auto|visible|0px|1$|static|isolate-auto|rgba\\(0, 0, 0, 0\\))$/.test(t));
    out.push(n.tagName + '.' + (n.className || '-') + '  ' + (bits.join(' ') || '(plain)'));
  }
  return out.join('\\n');
})()`;
for (const [n, u, isD] of [['DESIGN', D, true], ['BUILD', B, false]]) {
  const b = await launch({ width: 1700, height: 2000, scale: 2, port: isD ? 9480 : 9481 });
  try {
    await b.goto(u); await b.freezeMotion();
    if (isD) await b.eval('document.querySelector(\'.chip[data-go="library-desktop"]\').click(); true');
    await new Promise((r) => setTimeout(r, 500));
    console.log('=== ' + n + ' ==='); console.log(await b.eval(probe));
  } finally { await b.close(); }
}
