// WHAT IS ACTUALLY ON THE SCREENS void-check CALLS EMPTY?
// Opens each the way the app does and lists what is visible, so a void can be
// told apart from a screen that simply has not been set up.
import { launch } from './cdp.mjs';

const NAMES = process.argv.slice(2);
const day = (o) => { const x = new Date(); x.setDate(x.getDate() - o);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [day(0), day(1), day(3)], pmin: { [day(0)]: 20, [day(1)]: 32 },
  songs: { 'fur-elise': { plays: 79, stars: 3, best: 96 }, 'still-dre-easy': { plays: 22, stars: 3, best: 91 } },
  lessons: {}, lib: { learning: true },
};
const b = await launch({ width: 1418, height: 900, scale: 1, port: 9683 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 2000));
  for (const name of NAMES) {
    const info = await b.eval(`(() => {
      const btn = document.getElementById('btn-' + ${JSON.stringify(name)});
      if (btn) btn.click(); else window.__show(${JSON.stringify(name)});
      return btn ? 'clicked btn-' + ${JSON.stringify(name)} : '__show only';
    })()`);
    await new Promise((r) => setTimeout(r, 900));
    const dump = await b.eval(`(() => {
      const s = document.getElementById('screen-' + ${JSON.stringify(name)});
      if (!s) return 'NO SCREEN ELEMENT';
      const leaves = [...s.querySelectorAll('*')].filter((e) => !e.children.length
        && e.textContent.trim() && e.getBoundingClientRect().width > 0);
      const cvs = [...s.querySelectorAll('canvas')].map((c) => {
        const r = c.getBoundingClientRect();
        return (c.id || '?') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
      });
      const card = s.querySelector('.dv-card');
      const cr = (card || s).getBoundingClientRect();
      return 'card ' + Math.round(cr.width) + 'x' + Math.round(cr.height)
        + ' | canvases: ' + (cvs.join(', ') || 'none')
        + ' | ' + leaves.length + ' text leaves: '
        + [...new Set(leaves.map((e) => e.textContent.trim()))].slice(0, 14).join(' / ');
    })()`);
    console.log(`\n=== ${name}  (${info})`);
    console.log('  ' + dump);
  }
} finally { await b.close(); }
