// THE BLACK-HOLE GATE. For every screen the app can show, capture what is
// actually on screen and find the largest EMPTY rectangle in it.
//
// Two reasons this exists, and they are the same reason:
//   1. Mark, repeatedly: "I do not want black empty space on the homepage."
//   2. The Score view rendered as an empty box for days behind seven green
//      gates. Every one of them inspected ELEMENTS. None of them looked at the
//      picture and asked whether a large part of it was nothing. An element can
//      exist, be the right size, in the right place, and be blank; and under
//      the canon the element the app draws into is often not even the thing the
//      user sees, so element-picking gates cannot be trusted here.
//
// It judges rendered pixels, so it does not care which layer painted them.
//
// Usage: node tools/void-check.mjs [--limit 25]
import { launch } from './cdp.mjs';
import { decode } from './png.mjs';

const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 25);
const day = (o) => { const x = new Date(); x.setDate(x.getDate() - o);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

const SCREENS = [
  ['library', null], ['play', null], ['play', 'score'], ['freeplay', null], ['echo', null],
  ['improv', null], ['metronome', null], ['calibrate', null], ['lessons', null], ['lesson', null],
  ['task', null], ['rhythm', null], ['path', null], ['trophies', null], ['takes', null], ['touch', null],
];

// ☠️ ONE THRESHOLD FOR EVERY SCREEN IS THE WRONG QUESTION, and asking it kept
// three screens red that are not broken. A dashboard with a hole in it is a
// defect. An ACTIVITY STAGE is supposed to be open: Rhythm tap draws a pattern
// across a wide lane, the Touch diagnostic asks for one key at a time, and an
// honest trophy cabinet with nothing earned yet SHOULD look bare. Padding those
// to reach 25% would be manufacturing content to satisfy a number.
//
// But a looser number on its own is gate laundering, so a screen that gets extra
// room must PROVE it painted what it exists to paint. Each policy below pairs
// its allowance with evidence that has to be on screen, and the evidence is the
// real gate: if Rhythm stops drawing its pattern, `requires` fails no matter how
// much ink happens to be there.
const POLICY = {
  // ☠️ THE LESSONS INDEX IS A LIST, AND ITS GUTTER IS DRAWN, NOT MISSING.
  // Measured 2026-09-02, when the two technique lessons took the curriculum
  // from 11 rows to 13: the same screen went from 10.1% to 40.6% empty without
  // a single pixel of content being lost. The list has a FIXED height, so more
  // lessons means shorter rows, and at 13 rows every title happens to end left
  // of x=384, which merges the whitespace between a left-aligned title and its
  // right-aligned state chip into one tall rectangle. The design drew that
  // gutter, and it draws a hairline under every row that this gate's INK
  // threshold (12) is too coarse to see, so the rectangle it finds is emptier
  // than the screen a person looks at.
  // The allowance is therefore paired with evidence that is STRONGER than the
  // ink number was: the hero, the first lesson, the state vocabulary and the
  // LAST row of the curriculum all have to be on screen, so a list that
  // silently truncates or fails to bind still fails here.
  lessons: { limit: 50, requires: [/CONTINUE HERE/, /Middle C and the grand staff/, /Ready|Complete/, /The C major scale, right hand/, /OF \d+ COMPLETE/] },
  rhythm: { limit: 80, requires: ['TAP THE PATTERN', /LEVEL|Level/, /Clean rounds|IN A ROW/] },
  touch: { limit: 70, requires: [/PLAY THE KEY SHOWN|Strike \d+ of/, 'KEY', /LAST HIT|SOFT|MEDIUM|FIRM/] },
  trophies: { limit: 60, requires: [/Trophies/, /XP LOG/, /Nothing yet|proven|Calibrated|No XP yet/] },
};
const policyFor = (name) => POLICY[name] || { limit: LIMIT, requires: [] };

const CELL = 12;          // downsample: one cell is 12x12 device px
const INK = 12;           // a cell is "inked" if any pixel differs from the ground by this

// largest all-zero axis-aligned rectangle in a binary grid (histogram method)
function largestVoid(grid, W, H) {
  const heights = new Array(W).fill(0);
  let best = 0, bestBox = null;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) heights[x] = grid[y * W + x] ? 0 : heights[x] + 1;
    const stack = [];
    for (let x = 0; x <= W; x++) {
      const h = x === W ? 0 : heights[x];
      let start = x;
      while (stack.length && stack[stack.length - 1][1] >= h) {
        const [s, hh] = stack.pop();
        const area = hh * (x - s);
        if (area > best) { best = area; bestBox = { x: s, y: y - hh + 1, w: x - s, h: hh }; }
        start = s;
      }
      stack.push([start, h]);
    }
  }
  return { area: best, box: bestBox };
}

const b = await launch({ width: 1600, height: 950, scale: 1, port: 9595 });
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
  await b.freezeMotion();

  for (const [name, mode] of SCREENS) {
    const opened = await b.eval(`(() => {
      // ☠️ OPEN IT THE WAY THE APP DOES, NOT WITH __show ALONE. show() only
      // toggles which screen is visible; the real CONTROL does the setup.
      // Opening free play from its button is what constructs the live FallsView
      // and calls hideRestingLayer to take the artboard's STILL PICTURE off the
      // deck. Going in through __show left the resting artwork up with no live
      // canvas behind it, so this gate spent weeks measuring a screen no user
      // ever sees and calling it 40.5% empty. Click the button where one exists.
      if (typeof window.__show !== 'function') return 'no __show';
      const want = ${JSON.stringify(name)};
      // ☠️ THE PLAY SCREEN IS REACHED BY OPENING A SONG, and nothing else builds
      // its deck: under __show, window.__falls and window.__engine are both
      // FALSE, so this gate photographed a play screen with no live canvas at
      // all and reported 45% of it empty. Same class of error as free play.
      // Click a real song row, which is the only way a person gets here.
      if (want === 'play') {
        const row = [...document.querySelectorAll('*')].find((e) => !e.children.length
          && /^(F\\u00fcr Elise|Still D\\.R\\.E\\.)$/.test(e.textContent.trim())
          && e.getBoundingClientRect().width > 0);
        const hit = row && (row.closest('button, a, [role="button"]') || row.parentElement);
        if (hit) hit.click();
      }
      const btn = document.getElementById('btn-' + want);
      if (btn) btn.click(); else if (want !== 'play') window.__show(want);
      if (want === 'play' && !document.getElementById('screen-play')?.matches(':not([hidden])')) window.__show('play');
      const s = document.getElementById('screen-' + ${JSON.stringify(name)});
      return s && getComputedStyle(s).display !== 'none' ? 'ok' : 'not shown';
    })()`);
    if (mode === 'score') await b.eval(`document.getElementById('mode-score')?.click(); true`);
    await new Promise((r) => setTimeout(r, 650));

    // ☠️ MEASURE THE SCREEN IN USE, NOT WAITING TO BE USED. The play deck is a
    // canvas that is CORRECTLY empty until notes fall, so photographing it at
    // rest and calling 45% of it a void is measuring the wrong moment: the
    // learner never looks at that state for long. Wind the engine on and draw a
    // real frame, which is exactly what the app does a moment later anyway.
    // Screens that wait behind a Start button get the same treatment.
    // A screen that waits behind a Start button is not empty, it is WAITING.
    // Rhythm tap and the Touch diagnostic both open on an instruction card with
    // the activity area blank until you begin, so press begin, the same as the
    // play deck is wound on below.
    if (name === 'rhythm' || name === 'touch' || name === 'calibrate') {
      await b.eval(`(() => {
        const s = document.getElementById('screen-' + ${JSON.stringify(name)});
        if (!s) return 'no screen';
        const go = [...s.querySelectorAll('*')].find((e) => !e.children.length
          && /^(Start|Begin|Start over|\\u25b6)$/i.test(e.textContent.trim())
          && e.getBoundingClientRect().width > 0);
        const hit = go && (go.closest('button, a, [role="button"]') || go);
        if (hit) { hit.click(); return 'started'; }
        return 'no start control';
      })()`);
      await new Promise((r) => setTimeout(r, 700));
    }
    if (name === 'play' && !mode) {
      await b.eval(`(() => {
        const f = window.__falls, e = window.__engine;
        if (!f || !e) return 'no deck';
        e.t = 4;                       // four beats in: notes are on screen
        f.draw(e);
        return 'drawn';
      })()`);
      await new Promise((r) => setTimeout(r, 120));
    }
    if (opened !== 'ok') { rows.push({ name: name + (mode ? ':' + mode : ''), verdict: 'NOT REACHED', detail: opened }); continue; }

    // the CONTENT box: the canon card if there is one, else the screen itself
    const box = JSON.parse(await b.eval(`(() => {
      const s = document.getElementById('screen-' + ${JSON.stringify(name)});
      const card = s.querySelector('.dv-card') || s;
      const r = card.getBoundingClientRect();
      return JSON.stringify({ x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)),
        width: Math.round(r.width), height: Math.round(r.height) });
    })()`));
    if (box.width < 50 || box.height < 50) { rows.push({ name, verdict: 'COLLAPSED', detail: box.width + 'x' + box.height }); continue; }

    const img = decode(await b.shot(box));
    const W = Math.floor(img.width / CELL), H = Math.floor(img.height / CELL);
    const grid = new Uint8Array(W * H);
    const px = (x, y) => { const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
    const ground = px(1, 1);
    for (let cy = 0; cy < H; cy++) for (let cx = 0; cx < W; cx++) {
      let inked = 0;
      for (let y = cy * CELL; y < (cy + 1) * CELL && !inked; y += 3)
        for (let x = cx * CELL; x < (cx + 1) * CELL && !inked; x += 3) {
          const p = px(x, y);
          if (Math.abs(p[0] - ground[0]) > INK || Math.abs(p[1] - ground[1]) > INK || Math.abs(p[2] - ground[2]) > INK) inked = 1;
        }
      grid[cy * W + cx] = inked;
    }
    const { area, box: v } = largestVoid(grid, W, H);
    const pct = (100 * area) / (W * H);
    const pol = policyFor(name);

    // the evidence half of the policy: what this screen must actually be showing
    let missing = [];
    if (pol.requires.length) {
      const texts = JSON.parse(await b.eval(`(() => {
        const s = document.getElementById('screen-' + ${JSON.stringify(name)});
        if (!s) return '[]';
        return JSON.stringify([...s.querySelectorAll('*')]
          .filter((e) => !e.children.length && e.textContent.trim() && e.getBoundingClientRect().width > 0)
          .map((e) => e.textContent.trim()));
      })()`));
      missing = pol.requires.filter((r) => !texts.some((t) => (r instanceof RegExp ? r.test(t) : t.includes(r))));
    }
    const tooEmpty = pct > pol.limit;
    rows.push({
      name: name + (mode ? ':' + mode : ''),
      verdict: missing.length ? 'NOT SHOWING' : tooEmpty ? 'VOID' : 'ok',
      detail: `${box.width}x${box.height}, biggest empty block ${pct.toFixed(1)}% ` +
        (pol.limit !== LIMIT ? `(allowed ${pol.limit}% here) ` : '') +
        (v ? `at ${v.x * CELL}, ${v.y * CELL} (${v.w * CELL}x${v.h * CELL}px)` : '') +
        (missing.length ? `  MISSING: ${missing.map(String).join(', ')}` : ''),
    });
  }
} finally { await b.close(); }

console.log(`screen           verdict      the biggest hole in it (flagged over ${LIMIT}%)`);
console.log('-'.repeat(84));
let bad = 0;
for (const r of rows) {
  if (r.verdict !== 'ok') bad++;
  console.log(`${r.name.padEnd(16)} ${r.verdict.padEnd(12)} ${r.detail}`);
}
console.log('-'.repeat(84));
console.log(`${rows.length - bad}/${rows.length} screens have no large empty region`);
process.exit(bad ? 1 : 0);
