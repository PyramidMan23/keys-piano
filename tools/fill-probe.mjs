// How does the library divide surplus height between song rows and the
// dashboard? Prints, per viewport, the row count and the dead space the
// dashboard cards absorb. Usage: node tools/fill-probe.mjs
import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const day = (o) => { const x = new Date(); x.setDate(x.getDate() - o);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const SIZES = process.argv[2] ? [process.argv[2].split('x').map(Number)]
  : [[1418, 738], [1418, 900], [1418, 1050], [1600, 1050], [1920, 1080], [2560, 1440]];
let port = 9540;
for (const [w, h] of SIZES) {
  const b = await launch({ width: w, height: h, scale: 1, port: port++ });
  try {
    await b.goto('http://localhost:4180/index.html?canon=0');
    const ids = JSON.parse(await b.eval('(async () => JSON.stringify((await import("/js/songs.mjs")).SONGS.map(s=>s.id)))()'));
    const songs = {}; ids.forEach((id, i) => { songs[id] = { plays: 3 + (i % 9), stars: i % 3, best: 55 + (i % 40) }; });
    const seed = { firstRunDone: true, diagnosticDone: true, days: [day(0), day(1), day(3)],
      pmin: { [day(0)]: 20, [day(1)]: 32, [day(3)]: 18 },
      lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 }, songs, lessons: {}, lib: { learning: true } };
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(seed))}); true`);
    await b.goto('http://localhost:4180/index.html?canon=1');
    await new Promise((r) => setTimeout(r, 2400));
    // WHICH BOARD ACTUALLY MOUNTED. The composition is re-picked on resize, so
    // a screenshot taken after the measurement can be of a different board than
    // the one measured. Name it, every time, or the picture lies.
    const board = await b.eval(`(() => {
      const t = document.querySelector('#screen-library')?.textContent ?? '';
      if (/MOST USED/.test(t)) return 'library (756 column)';
      if (document.querySelector('#screen-library [data-lib-grid]')) return 'library-desktop (10a art grid)';
      return 'UNKNOWN';
    })()`);
    if (!/desktop/.test(board)) console.log('  !! ' + w + 'x' + h + ' mounted ' + board + ', innerWidth=' + await b.eval('window.innerWidth'));
    console.log(w + 'x' + h, await b.eval(`(() => {
      const g = document.querySelector('#screen-library [data-lib-grid]');
      if (!g) return 'NO GRID';
      const col = g.parentElement.parentElement;
      const dash = [...col.children].find((k) => /CHOOSE 1/.test(k.textContent));
      const cards = dash ? [...dash.children].filter((c) => c.getBoundingClientRect().height > 1) : [];
      // dead space = the biggest internal gap between consecutive visible children
      const deadOf = (c) => {
        const kids = [...c.children].filter((k) => k.getBoundingClientRect().height > 0);
        let worst = 0;
        for (let i = 1; i < kids.length; i++) {
          const gap = kids[i].getBoundingClientRect().y - kids[i - 1].getBoundingClientRect().bottom;
          if (gap > worst) worst = gap;
        }
        return Math.round(worst);
      };
      const tops = [...new Set([...g.children].filter((c) => getComputedStyle(c).display !== 'none')
        .map((c) => Math.round(c.getBoundingClientRect().y)))];
      return JSON.stringify({
        zoom: +(getComputedStyle(document.querySelector('#screen-library .dv-card') ?? document.body).zoom ?? 1),
        rows: tops.length,
        tiles: [...g.children].filter((c) => getComputedStyle(c).display !== 'none').length,
        dashH: dash ? Math.round(dash.getBoundingClientRect().height) : 0,
        cardH: cards.map((c) => Math.round(c.getBoundingClientRect().height)),
        deadGap: cards.map(deadOf),
      });
    })()`));
    writeFileSync(`design-2026-08/verify-20260829/fill-${w}x${h}.png`, await b.shot());
  } finally { await b.close(); }
}
