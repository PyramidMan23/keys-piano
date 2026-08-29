// Drive the prototype with REAL input in a pinned headless Chrome and assert it
// actually walks. apply-design Rule 5: a port is not verified until a
// human-visible image has been compared, and Rule 12.8: "open" is proven by
// geometry and a screenshot, never by text being present in the DOM.
//
// Run: node tools/proto-test.mjs
import { launch } from './cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'design-2026-08', 'proto-shots');
mkdirSync(SHOTS, { recursive: true });
const URL = 'http://localhost:4180/design-2026-08/keys-prototype.html';

const b = await launch({ width: 900, height: 1200, scale: 1, port: 9351 });
let pass = 0, fail = 0;
const check = (ok, msg) => { ok ? pass++ : fail++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${msg}`); };

try {
  await b.goto(URL);
  await b.freezeMotion();

  const screens = await b.eval(`[...document.querySelectorAll('.pane')].map(p => p.dataset.screen)`);
  check(screens.length === 18, `18 screens present (got ${screens.length})`);

  const visible = await b.eval(`document.querySelectorAll('.pane.on').length`);
  check(visible === 1, `exactly one screen visible on load (got ${visible})`);

  const first = await b.eval(`document.querySelector('.pane.on').dataset.screen`);
  check(first === 'library', `opens on the library (got ${first})`);

  // every chip must actually switch, and be PROVEN by the pane having real size
  console.log('\n  walking every screen by clicking its chip:');
  for (const key of screens) {
    await b.eval(`document.querySelector('.chip[data-go="${key}"]').click(); true`);
    const state = await b.eval(`(() => {
      const p = document.querySelector('.pane.on');
      if (!p || p.dataset.screen !== '${key}') return { ok: false, got: p && p.dataset.screen };
      const r = p.getBoundingClientRect();
      return { ok: r.width > 300 && r.height > 200, w: Math.round(r.width), h: Math.round(r.height),
               label: p.dataset.label,
               imgs: p.querySelectorAll('img').length,
               broken: [...p.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length };
    })()`);
    check(state.ok && state.broken === 0,
      `${(state.label || key).padEnd(20)} ${state.w}x${state.h}  ${state.imgs} img, ${state.broken} broken`);
  }

  // the design's own library controls must navigate
  console.log('\n  the controls the design itself drew inside the Library:');
  for (const [label, target] of [['Metronome', 'metronome'], ['Free play', 'freeplay'], ['Latency calibration', 'calibrate']]) {
    await b.eval(`document.querySelector('.chip[data-go="library"]').click(); true`);
    const wired = await b.eval(`(() => {
      const lib = document.getElementById('pane-library');
      const el = [...lib.querySelectorAll('[data-go="${target}"]')][0];
      if (!el) return { wired: false };
      const r = el.getBoundingClientRect();
      el.click();
      return { wired: true, w: Math.round(r.width), h: Math.round(r.height) };
    })()`);
    if (!wired.wired) { check(false, `${label} is not wired`); continue; }
    await new Promise((r) => setTimeout(r, 260));
    const now = await b.eval(`document.querySelector('.pane.on').dataset.screen`);
    check(now === target, `${label.padEnd(20)} navigates to ${target} (hit box ${wired.w}x${wired.h}, got ${now})`);
  }

  // All tools sheet: proven OPEN by geometry, not by its text existing
  await b.eval(`document.querySelector('.chip[data-go="library"]').click(); true`);
  await b.eval(`(() => { const el = document.querySelector('#pane-library [data-go="__tools"]'); if (el) el.click(); return !!el; })()`);
  await new Promise((r) => setTimeout(r, 300));
  const sheet = await b.eval(`(() => {
    const s = document.getElementById('sheet');
    const r = s.getBoundingClientRect();
    const cs = getComputedStyle(s);
    return { display: cs.display, onScreen: r.width > 200 && r.height > 200 && r.top < innerHeight,
             buttons: s.querySelectorAll('.sheet-grid button').length };
  })()`);
  check(sheet.display !== 'none' && sheet.onScreen, `All tools sheet is really open (display ${sheet.display}, on screen ${sheet.onScreen})`);
  check(sheet.buttons === 18, `sheet lists all 18 screens (got ${sheet.buttons})`);

  // jump from inside the sheet
  await b.eval(`[...document.querySelectorAll('.sheet-grid button')].find(x => x.textContent === 'Trophies').click(); true`);
  await new Promise((r) => setTimeout(r, 200));
  const jumped = await b.eval(`document.querySelector('.pane.on').dataset.screen`);
  check(jumped === 'trophies', `jumping from the sheet works (got ${jumped})`);

  // press feedback exists and is not everywhere (a screen where everything
  // flashes reads as broken, not alive)
  const hots = await b.eval(`(() => {
    document.querySelector('.chip[data-go="library"]').click();
    const lib = document.getElementById('pane-library');
    return { hot: lib.querySelectorAll('.hot').length, all: lib.querySelectorAll('*').length };
  })()`);
  // probe-controls.mjs measured 39 genuinely control-shaped elements in the
  // library, so the press layer should find about that many: enough to feel
  // alive, not so many that the whole screen flashes and reads as broken.
  check(hots.hot >= 30 && hots.hot <= 60 && hots.hot < hots.all * 0.25,
    `library press layer covers the real controls (${hots.hot} of ${hots.all}, expected 30-60)`);

  // LOOK at it: shots of the ones most worth eyeballing
  console.log('\n  screenshots:');
  for (const key of ['library', 'play', 'keys12', 'trophies', 'metronome']) {
    await b.eval(`document.querySelector('.chip[data-go="${key}"]').click(); true`);
    await new Promise((r) => setTimeout(r, 350));
    const png = await b.shot();
    writeFileSync(join(SHOTS, `${key}.png`), png);
    console.log(`    ${key}.png  ${(png.length / 1024).toFixed(0)}KB`);
  }
} finally {
  await b.close();
}

console.log(`\n${fail === 0 ? 'ALL GREEN' : 'FAILURES'}: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
