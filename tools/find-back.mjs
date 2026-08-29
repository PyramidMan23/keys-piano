// Which screens did the design give a back control? An earlier claim that none
// did was made from a truncated text sample and was wrong: My path has a
// "Library" button. Wiring the ones that exist makes the prototype behave like
// the app instead of relying on scaffolding.
import { launch } from './cdp.mjs';

const b = await launch({ width: 820, height: 1500, scale: 1, port: 9383 });
try {
  await b.goto('http://localhost:4180/design-2026-08/keys-prototype.html');
  const keys = await b.eval(`[...document.querySelectorAll('.pane')].map(p => p.dataset.screen)`);
  const found = [];
  for (const key of keys) {
    await b.eval(`document.querySelector('.chip[data-go="${key}"]').click(); true`);
    await new Promise((r) => setTimeout(r, 200));
    const hits = await b.eval(`(() => {
      const p = document.querySelector('.pane.on');
      const out = [];
      for (const e of p.querySelectorAll('*')) {
        if (e.children.length) continue;
        const t = e.textContent.trim();
        if (/^(library|back|home)$/i.test(t)) {
          const r = e.getBoundingClientRect();
          out.push({ t, w: Math.round(r.width), h: Math.round(r.height) });
        }
      }
      return out;
    })()`);
    if (hits.length) { found.push({ key, hits }); console.log(`${key.padEnd(12)} ${hits.map(h => `"${h.t}" ${h.w}x${h.h}`).join(', ')}`); }
  }
  console.log(`\n${found.length} of ${keys.length} screens carry their own back control.`);
  console.log('screens WITHOUT one: ' + keys.filter((k) => !found.find((f) => f.key === k)).join(' '));
} finally { await b.close(); }
