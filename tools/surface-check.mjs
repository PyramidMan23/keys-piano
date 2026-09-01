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
// ☠️ OPEN EVERY SCREEN THROUGH ITS OWN CONTROL, NEVER `__show` ALONE. `show()`
// only toggles which screen is hidden. Every one of these canvases is built,
// sized and painted by the CONTROL HANDLER: `btn-freeplay` is what constructs
// the FallsView, stands the artboard's resting picture down and draws; the
// theory keyboard is not painted until a drill actually starts. Reached through
// `__show` alone, six of the eight surfaces reported "0 inked px", and that was
// written into CLAUDE.md as a known-red APP defect. It was not one: opened the
// way a person opens them, all six paint 97-99% ink (measured 2026-09-01). The
// bug was here, in the gate. void-check.mjs already carries a tombstone for the
// identical mistake, so this is the second time the same lie was measured.
//
// A route is therefore not convenience, it IS the measurement. A surface whose
// control is missing fails as NO CONTROL and never falls back to `__show`,
// because the fallback is how the gate came to photograph screens no user had
// ever opened and call them defects.
//
// Usage: node tools/surface-check.mjs
import { launch } from './cdp.mjs';

const day = (o) => { const x = new Date(); x.setDate(x.getDate() - o);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

// screen id -> [surface selector, and the taps a person makes to get there]
//
// A step is `{ id }` for a control that has one, or `{ text }` for one the
// design only labels in words. Clicking the id is not a back door: the canon
// library's own tool rows forward to these very ids
// (`canon-library.mjs` -> `ctx.onTool` -> `el.click()`), so it is the user's tap.
const SURFACES = [
  { screen: 'screen-play', sel: '#falls', label: 'falling-notes deck',
    open: [{ text: 'Resume the session' }] },
  { screen: 'screen-play', sel: '#score-wrap svg', label: 'score notation',
    open: [{ text: 'Resume the session' }, { id: 'mode-score' }] },
  { screen: 'screen-freeplay', sel: '#freeplay-canvas', label: 'free play keys',
    open: [{ id: 'btn-freeplay' }] },
  { screen: 'screen-echo', sel: '#echo-canvas', label: 'melody echo keys',
    open: [{ id: 'btn-echo' }] },
  // the trace is a moving bar over a hit line, painted by runCalibration() the
  // moment the screen opens: sparse on purpose, and honestly so
  { screen: 'screen-calibrate', sel: '#cal-canvas', label: 'latency trace',
    open: [{ id: 'btn-calibrate' }] },
  { screen: 'screen-improv', sel: '#improv-canvas', label: 'improv keys',
    open: [{ id: 'btn-improv' }] },
  { screen: 'screen-lesson', sel: '#lesson-keys', label: 'lesson keyboard',
    open: [{ id: 'btn-lessons' }, { text: 'Continue here' }] },
  // ☠️ THE THEORY KEYBOARD IS NOT PAINTED BY ARRIVING. openTaskScreen() hides
  // the stage and puts the pre-start invite up instead; only runTask() ->
  // setKeyboard() sizes and draws it. Press Start, the same as the learner.
  { screen: 'screen-task', sel: '#task-keys', label: 'theory task keyboard',
    open: [{ id: 'btn-path' }, { id: 'path-go' }, { id: 'task-start' }] },
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

  for (const s of SURFACES) {
    // home first, so every route starts where a person starts
    await b.eval(`(() => { document.getElementById('btn-home')?.click(); return true; })()`).catch(() => {});
    await new Promise((r) => setTimeout(r, 500));

    // walk the route. A control that is not there fails the row; it never
    // licenses a fall back to __show, which is the fabrication this gate
    // shipped for weeks.
    const trace = [];
    let missing = null;
    for (const step of s.open) {
      const did = await b.eval(`(() => {
        const step = ${JSON.stringify(step)};
        const el = step.id ? document.getElementById(step.id)
          : [...document.querySelectorAll('*')].reverse().find((e) => !e.children.length
              && e.textContent.trim() === step.text && e.getBoundingClientRect().width > 0);
        if (!el) return 'MISSING';
        (el.closest('button, a, [role="button"]') || el).click();
        return 'ok';
      })()`);
      trace.push((step.id ?? step.text) + (did === 'ok' ? '' : '!'));
      if (did !== 'ok') { missing = step.id ?? step.text; break; }
      await new Promise((r) => setTimeout(r, 800));
    }
    const route = trace.join(' > ');
    if (missing) {
      rows.push({ label: s.label, verdict: 'NO CONTROL', detail: `route ${route}: nothing to click for "${missing}"` });
      continue;
    }
    await new Promise((r) => setTimeout(r, 500));
    rows.push(JSON.parse(await b.eval(`(() => {
      // PROVE THE SCREEN WAS REACHED FIRST. A canvas on a screen that never
      // opened reads blank too, and reporting that as a defect would be a lie.
      const screen = document.getElementById(${JSON.stringify(s.screen)});
      const shown = screen && getComputedStyle(screen).display !== 'none' && !screen.hidden;
      if (!shown) return JSON.stringify({ label: ${JSON.stringify(s.label)}, verdict: 'NOT REACHED', detail: 'route ${route} left the ${s.screen} screen closed, so its surface was not judged' });
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
        verdict: ink < 8 ? 'BLANK' : 'ok',
        detail: box + '  ' + ink + (el.tagName === 'CANVAS' ? ' inked px (' + pct.toFixed(1) + '%)' : ' drawn nodes') + '  via ${route}' });
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
