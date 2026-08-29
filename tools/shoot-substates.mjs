// SUB-STATE evidence shots (2026-08-29 verification round): the states no
// per-screen screenshot ever showed. Real doors, real clicks, seeded data.
// Run: node tools/shoot-substates.mjs
import { launch } from './cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'design-2026-08', 'verify-20260829');
mkdirSync(OUT, { recursive: true });

const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 37,
  days: [], pmin: {}, songs: { 'still-dre-easy': { plays: 9, stars: 2, best: 88 } },
  lessons: { 'middle-c': 1, 'treble-lines': 1 }, lib: { learning: true },
};

const shoot = async (b, name, w = 1418, h = 738) => {
  const png = await b.shot({ x: 0, y: 0, width: w, height: h });
  writeFileSync(join(OUT, `${name}.png`), png);
  console.log(`${name}.png  ${png.length}`);
};
const clickText = async (b, label) => b.eval(`(() => {
  const l = [...document.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim() === ${JSON.stringify(label)} && e.getBoundingClientRect().width > 0);
  if (!l) return false;
  (l.closest('button, a, [role="button"]') ?? l.parentElement)?.click();
  return true;
})()`);

// ---- 1418 sub-states --------------------------------------------------------
let b = await launch({ width: 1418, height: 738, scale: 1, port: 9601 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1900));

  // open a song
  await clickText(b, 'Still D.R.E.');
  await new Promise((r) => setTimeout(r, 1400));

  // SCORE view
  await b.eval(`(document.getElementById('mode-score')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 900));
  await shoot(b, 'sub-play-score');
  await b.eval(`(document.getElementById('mode-falls')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 500));

  // HEAR IT demo (follow-along)
  await b.eval(`(document.getElementById('btn-hear')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 2600));
  await shoot(b, 'sub-play-demo');
  await b.eval(`(document.getElementById('btn-hear')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 500));

  // CHUNK mode on
  await b.eval(`(document.getElementById('chunk-next')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 700));
  await shoot(b, 'sub-play-chunks');

  // ECHO: sing + transpose modes
  await b.eval(`window.__show('library'); true`);
  await new Promise((r) => setTimeout(r, 500));
  await b.eval(`(document.getElementById('btn-echo')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 700));
  await b.eval(`(document.getElementById('echo-mode-sing')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 500));
  await shoot(b, 'sub-echo-sing');
  await b.eval(`(document.getElementById('echo-mode-trans')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 500));
  await shoot(b, 'sub-echo-transpose');

  // QUICK REVIEW (2 lessons done -> visible)
  await b.eval(`(document.getElementById('btn-lessons')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 700));
  const rev = await clickText(b, 'Review what is due');
  await new Promise((r) => setTimeout(r, 1000));
  console.log('review opened:', rev);
  await shoot(b, 'sub-lessons-review');

  // PATH: the check-in / prescribed task through path-go
  await b.eval(`(document.getElementById('btn-path')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 700));
  await b.eval(`(document.getElementById('path-go')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 1100));
  await shoot(b, 'sub-path-go-target');

  // SIGHT READING (score-locked play)
  await b.eval(`window.__show('library'); true`);
  await new Promise((r) => setTimeout(r, 400));
  await clickText(b, 'All tools');
  await new Promise((r) => setTimeout(r, 600));
  await clickText(b, 'Sight reading');
  await new Promise((r) => setTimeout(r, 1200));
  await shoot(b, 'sub-sight-reading');
} finally { await b.close(); }

// ---- 900px: the phone composition after all the changes --------------------
b = await launch({ width: 900, height: 738, scale: 1, port: 9602 });
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1900));
  await shoot(b, 'sub-narrow-library', 900, 738);
  await b.eval(`(document.getElementById('btn-freeplay')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 800));
  await shoot(b, 'sub-narrow-freeplay', 900, 738);
  await b.eval(`(document.getElementById('btn-lessons')?.click(), true)`);
  await new Promise((r) => setTimeout(r, 800));
  await shoot(b, 'sub-narrow-lessons', 900, 738);
} finally { await b.close(); }
console.log('done');
