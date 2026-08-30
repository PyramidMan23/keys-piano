// Screenshot the REAL app library at several window sizes, and report whether
// anything in the grid band is clipped away by the containment rule.
import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const day = (o) => { const d = new Date(); d.setDate(d.getDate() - o);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const SEED = { firstRunDone: true, diagnosticDone: true, days: [day(0), day(1), day(3)],
  pmin: { [day(0)]: 20, [day(1)]: 32, [day(3)]: 18 },
  lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: { 'fur-elise': { plays: 79, stars: 3, best: 92 }, 'still-dre-easy': { plays: 39, stars: 2, best: 84 },
    'mario-easy': { plays: 5, stars: 1, best: 61 }, river: { plays: 12, stars: 1, best: 58 } },
  lessons: {}, lib: { learning: true } };
const SIZES = [[1418, 738], [1600, 900], [1280, 720], [1920, 1080]];
let port = 9500;
for (const [w, h] of SIZES) {
  const b = await launch({ width: w, height: h, scale: 1, port: port++ });
  try {
    await b.goto('http://localhost:4180/index.html?canon=0');
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
    await b.goto('http://localhost:4180/index.html?canon=1');
    await new Promise((r) => setTimeout(r, 2200));
    const report = await b.eval(`(() => {
      const g = document.querySelector('#screen-library [data-lib-grid]');
      if (!g) return 'NO GRID';
      const band = g.parentElement;
      const gr = g.getBoundingClientRect(), br = band.getBoundingClientRect();
      const kids = [...g.children].filter((c) => getComputedStyle(c).display !== 'none');
      const clipped = kids.filter((c) => c.getBoundingClientRect().bottom > br.bottom + 1);
      const doc = document.documentElement;
      const art = [...g.querySelectorAll('img')].filter((i) => i.getBoundingClientRect().width > 40).length;
      return JSON.stringify({
        cells: kids.length, sleeves: art,
        clippedCells: clipped.map((c) => c.textContent.trim().slice(0, 18)),
        gridBottom: Math.round(gr.bottom), bandBottom: Math.round(br.bottom),
        pageScrolls: doc.scrollHeight > doc.clientHeight + 1,
        door: [...g.children].map((c) => c.textContent.trim()).find((t) => /^(Show the other|See all)/.test(t)) ?? 'NO DOOR',
      });
    })()`);
    console.log(w + 'x' + h, report);
    writeFileSync(`design-2026-08/verify-20260829/app-${w}x${h}.png`, await b.shot());
  } finally { await b.close(); }
}
