// Screenshot EVERY screen at 1418x738 with realistic seeded data, plus the
// immersed deck mid-run. The final deliverable of the 2026-08-29 desktop wave:
// proof at the OUTPUT, straight off the running server.
//
// Run: node tools/shoot-all.mjs
import { launch } from './cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'design-2026-08', 'shots-final');
mkdirSync(OUT, { recursive: true });

const today = new Date();
const day = (o) => { const d = new Date(today); d.setDate(d.getDate() - o);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [day(0), day(1), day(2), day(4), day(5)],
  pmin: { [day(0)]: 24, [day(1)]: 12, [day(2)]: 31, [day(4)]: 18, [day(5)]: 9 },
  lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: {
    'fur-elise': { plays: 79, stars: 3, best: 96, scorePasses: 2, bestScore: 96 },
    'still-dre-easy': { plays: 22, stars: 3, best: 91, scorePasses: 1, bestScore: 91 },
    'mario-easy': { plays: 5, stars: 1, best: 71 },
    'river': { plays: 12, stars: 1, best: 78 },
    'interstellar-easy': { plays: 3, stars: 1, best: 74 },
  },
  xpTotal: 130, xpKeys: ['proof:still-dre-easy', 'firstCleanRun:fur-elise'],
  xpLog: [
    { t: Date.now() - 864e5, src: 'proof', ref: 'still-dre-easy', xp: 50 },
    { t: Date.now() - 36e5, src: 'firstCleanRun', ref: 'fur-elise', xp: 25 },
  ],
  lib: { learning: true },
};

const SCREENS = ['library', 'play', 'lessons', 'lesson', 'task', 'path', 'echo', 'rhythm',
  'improv', 'freeplay', 'metronome', 'trophies', 'takes', 'calibrate', 'touch', 'keys12'];

const b = await launch({ width: 1418, height: 738, scale: 1, port: 9520 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 2000));

  const shoot = async (name) => {
    const png = await b.shot({ x: 0, y: 0, width: 1418, height: 738 });
    writeFileSync(join(OUT, `${name}.png`), png);
    console.log(`${name}.png  ${png.length} bytes`);
  };

  for (const s of SCREENS) {
    if (s === 'play') {
      // open a real song through the app's own path so the header carries it
      await b.eval(`(() => {
        const row = [...document.querySelectorAll('#screen-library *')]
          .find((e) => !e.children.length && e.textContent.trim() === 'Still D.R.E.');
        (row?.closest('[style*="cursor"]') ?? row?.parentElement)?.click();
        return true;
      })()`);
      await new Promise((r) => setTimeout(r, 1400));
      const where = await b.eval(`[...document.querySelectorAll('.screen')].find((x) => !x.hidden)?.id`);
      if (where !== 'screen-play') { await b.eval(`window.__show('play'); true`); await new Promise((r) => setTimeout(r, 900)); }
    } else {
      await b.eval(`window.__show(${JSON.stringify(s)}); true`);
      await new Promise((r) => setTimeout(r, 700));
      if (s === 'lesson') {
        // a lesson screen without a lesson open is an empty stage: open one
        await b.eval(`(() => {
          const list = document.getElementById('lesson-list');
          const row = list && [...list.querySelectorAll('[data-i]'), ...list.children].find((c) => !c.disabled && c.textContent.trim());
          if (row) row.click();
          return true;
        })()`);
        await new Promise((r) => setTimeout(r, 900));
      }
      if (s === 'task') {
        await b.eval(`(() => { document.getElementById('btn-path')?.click(); return true; })()`);
        await new Promise((r) => setTimeout(r, 600));
        await b.eval(`(() => { document.getElementById('path-go')?.click(); return true; })()`);
        await new Promise((r) => setTimeout(r, 900));
      }
    }
    await shoot(s);
  }

  // the immersed deck MID-RUN, through the REAL flow: open the song, click
  // Train with a real hit-tested mouse event (the same path the journey
  // proves), let the run roll, then hold keys so the fountains and the
  // sustained-note scanline tails are on screen.
  await b.eval(`window.__show('library'); true`);
  await new Promise((r) => setTimeout(r, 700));
  const clickReal = async (label) => {
    const pt = await b.eval(`(() => {
      const matches = [...document.querySelectorAll('*')]
        .filter((e) => !e.children.length && e.textContent.trim() === ${JSON.stringify(label)}
                     && e.getBoundingClientRect().width > 0);
      for (const el of matches.reverse()) {
        const hit = el.closest('button, a, [role="button"]') || el;
        const r = hit.getBoundingClientRect();
        const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);
        const top = document.elementFromPoint(cx, cy);
        if (top && (top === hit || hit.contains(top) || top.contains(hit))) return { x: Math.round(cx), y: Math.round(cy) };
      }
      return null;
    })()`);
    if (!pt) return false;
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
    return true;
  };
  await clickReal('Still D.R.E.');
  await new Promise((r) => setTimeout(r, 1200));
  await clickReal('Train');
  await new Promise((r) => setTimeout(r, 2600));      // count-in, deck rolling
  // hold the currently-due notes so the tails and fountains are lit
  await b.eval(`(() => {
    const e = window.__engine;
    const due = e && e.currentGroup ? e.currentGroup() : null;
    const midis = due && due.midis ? [...due.midis] : [60, 64];
    for (const m of midis.slice(0, 2)) window.__simNote(m, true, 92);
    window.__heldShot = midis.slice(0, 2);
    return midis;
  })()`);
  await new Promise((r) => setTimeout(r, 700));
  await shoot('deck-immersed-midrun');
  await b.eval(`((window.__heldShot || []).forEach((m) => window.__simNote(m, false)), true)`);
} finally { await b.close(); }
console.log(`\nwrote ${SCREENS.length + 1} shots to design-2026-08/shots-final/`);
