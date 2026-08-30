// DOES EVERY SURFACE THE APP DRAWS ACTUALLY HAVE ANYTHING ON IT?
//
// This gate exists because the Score view rendered as an empty black box for
// days while all seven other gates were green. None of them could see it: the
// canon gates check the canon's own markup, and the score, the falling deck,
// the calibration trace and the practice chart are surfaces the APP paints into
// a container the canon merely hosts. A container can be the right size, in the
// right place, with the right id, and be completely blank.
//
// For each drawn surface it asserts: the box is not collapsed, and there are
// actual non-background pixels inside it.
//
// Usage: node tools/surface-check.mjs
import { launch } from './cdp.mjs';

const day = (o) => { const x = new Date(); x.setDate(x.getDate() - o);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

// screen id -> [surface selector, how to reach it]
const SURFACES = [
  { screen: 'screen-play', sel: '#falls', label: 'falling-notes deck' },
  { screen: 'screen-play', sel: '#score-wrap svg', label: 'score notation', mode: 'score' },
  { screen: 'screen-freeplay', sel: '#freeplay-canvas', label: 'free play keys' },
  { screen: 'screen-echo', sel: '#echo-canvas', label: 'melody echo keys' },
  { screen: 'screen-calibrate', sel: '#cal-canvas', label: 'latency trace' },
  { screen: 'screen-improv', sel: '#improv-canvas', label: 'improv keys' },
  { screen: 'screen-lesson', sel: '#lesson-keys', label: 'lesson keyboard' },
  { screen: 'screen-task', sel: '#task-keys', label: 'theory task keyboard' },
];

const b = await launch({ width: 1600, height: 950, scale: 1, port: 9580 });
const rows = [];
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  const ids = JSON.parse(await b.eval('(async () => JSON.stringify((await import("/js/songs.mjs")).SONGS.map(s=>s.id)))()'));
  const songs = {}; ids.slice(0, 40).forEach((id, i) => { songs[id] = { plays: 3 + (i % 9), stars: i % 3, best: 55 + (i % 40) }; });
  const seed = { firstRunDone: true, diagnosticDone: true, days: [day(0), day(1), day(3)],
    pmin: { [day(0)]: 20, [day(1)]: 32, [day(3)]: 18 }, songs, lessons: {}, lib: { learning: true },
    lastSession: { songId: 'fur-elise', sec: 0, tempo: '100', hand: 'both', wait: true, view: 'falls', at: Date.now() } };
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(seed))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 2200));

  // open the play screen through the app's own return loop
  await b.eval(`(() => {
    const hits = [...document.querySelectorAll('*')].filter((e) => !e.children.length
      && e.textContent.trim() === 'Resume the session' && e.getBoundingClientRect().width > 0);
    for (const el of hits.reverse()) { const c = el.closest('button, a, [role="button"]') || el; c.click(); return true; }
    return false;
  })()`);
  await new Promise((r) => setTimeout(r, 1800));

  for (const s of SURFACES) {
    // show the screen the app's own way, then the mode if one is asked for
    await b.eval(`(() => { const n = ${JSON.stringify(s.screen.replace('screen-', ''))};
      if (typeof window.__show === 'function') { window.__show(n); return 'shown ' + n; }
      return 'no __show hook'; })()`).catch(() => {});
    if (s.mode === 'score') await b.eval(`document.getElementById('mode-score')?.click(); true`);
    await new Promise((r) => setTimeout(r, 700));
    rows.push(JSON.parse(await b.eval(`(() => {
      // PROVE THE SCREEN WAS REACHED FIRST. A canvas on a screen that never
      // opened reads blank too, and reporting that as a defect would be a lie.
      const screen = document.getElementById(${JSON.stringify(s.screen)});
      const shown = screen && getComputedStyle(screen).display !== 'none' && !screen.hidden;
      if (!shown) return JSON.stringify({ label: ${JSON.stringify(s.label)}, verdict: 'NOT REACHED', detail: 'the ${s.screen} screen never opened, so its surface was not judged' });
      const el = document.querySelector(${JSON.stringify(s.sel)});
      if (!el) return JSON.stringify({ label: ${JSON.stringify(s.label)}, verdict: 'MISSING', detail: 'no element for ${s.sel}' });
      const r = el.getBoundingClientRect();
      const box = Math.round(r.width) + 'x' + Math.round(r.height);
      if (r.width < 20 || r.height < 20)
        return JSON.stringify({ label: ${JSON.stringify(s.label)}, verdict: 'COLLAPSED', detail: box });
      let ink = 0, total = 0;
      if (el.tagName === 'CANVAS') {
        try {
          // ☠️ SAMPLE THE WHOLE CANVAS. Reading only the top-left corner called
          // Free play blank while it was drawing a full keyboard: its keys live
          // at the BOTTOM of a 1390x660 surface and the corner is honestly
          // empty. A gate that looks in the wrong place is worse than no gate.
          const c = el.getContext('2d');
          const w = el.width || Math.round(r.width), h = el.height || Math.round(r.height);
          const d = c.getImageData(0, 0, w, h).data;
          const g = [d[0], d[1], d[2]];
          const STRIDE = 4;   // every 4th pixel, plenty for "is anything here"
          for (let y = 0; y < h; y += STRIDE) for (let x = 0; x < w; x += STRIDE) {
            const i = (y * w + x) * 4;
            total++;
            if (Math.abs(d[i] - g[0]) > 10 || Math.abs(d[i+1] - g[1]) > 10 || Math.abs(d[i+2] - g[2]) > 10) ink++;
          }
          total = total || 1;
        } catch (e) { return JSON.stringify({ label: ${JSON.stringify(s.label)}, verdict: 'UNREADABLE', detail: String(e.message) }); }
      } else {
        const kids = [...el.querySelectorAll('*')];
        total = kids.length;
        ink = kids.filter((k) => { const kr = k.getBoundingClientRect(); return kr.width > 0.5 && kr.height > 0.5; }).length;
      }
      const pct = total ? (100 * ink / total) : 0;
      return JSON.stringify({ label: ${JSON.stringify(s.label)}, box,
        verdict: ink < 8 ? 'BLANK' : 'ok', detail: box + '  ' + ink + (el.tagName === 'CANVAS' ? ' inked px (' + pct.toFixed(1) + '%)' : ' drawn nodes') });
    })()`)));
  }
} finally { await b.close(); }

console.log('surface                    verdict     detail');
console.log('-'.repeat(72));
let bad = 0;
for (const r of rows) {
  if (r.verdict !== 'ok') bad++;
  console.log(`${r.label.padEnd(26)} ${r.verdict.padEnd(11)} ${r.detail}`);
}
console.log('-'.repeat(72));
console.log(`${rows.length - bad}/${rows.length} drawn surfaces have visible content`);
process.exit(bad ? 1 : 0);
