// THE SAMPLE-BLEED AUDIT (2026-08-29, after the lessons tab shipped a wall of
// design samples through five green gates). The design's boards carry SAMPLE
// VALUES; a binder that misses leaves them on screen wearing the user's own
// clothes. This walks every screen through the app's real doors with seeded
// REAL data chosen to collide with no sample, and flags every sample value
// still visible.
//
// The sentinel list is curated: each string is a VALUE the design drew that
// can never be true under this seed (dates, fake stats, fake songs). Labels
// and vocabulary words are not sentinels.
//
// Run: node tools/canon-samples.mjs
import { launch } from './cdp.mjs';

const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 37,
  days: [], pmin: {},
  songs: { 'fur-elise': { plays: 4, stars: 1, best: 77 } },
  lessons: { 'middle-c': 1 },
  lib: { learning: true },
};

// screen -> [how to open, sentinels that may not be visible there]
const SCREENS = [
  ['library', null, [
    'John Williams, arranged for two hands. Nothing banked yet, start on the easy tier.',
    'Skill 2 of 5. Stage: independent, one stage short of retained.',
  ]],
  ['play', 'song:Für Elise', [
    'TIER 3', 'B2 of B4', 'Section B, bars 17 to 32', 'Star Wars Main Title',
  ]],
  ['lessons', 'btn-lessons', []],
  ['lesson', 'lesson:first', ['Reading a lead sheet', 'Say each chord symbol out loud on beat one.']],
  ['path', 'btn-path', [
    'Cm7 and F7 built clean on 24 and 26 August. Two of three needed.',
    'Still D.R.E., full left hand',
    'Chords from a symbol has been independent for six days',
  ]],
  ['echo', 'btn-echo', ['4, five notes', '+38ms', 'Four notes back, all correct, a little late on the last one.']],
  ['rhythm', 'btn-rhythm', ['Beat 5 landed early by 90ms']],
  ['improv', 'btn-improv', ['Modal vamp on D', 'Pop loop in G', 'ii V I in C']],
  ['freeplay', 'btn-freeplay', ['Cm7, root position', 'Fmaj7, root position']],
  ['metronome', 'btn-metronome', []],
  ['trophies', 'btn-trophies', [
    'First clean run', 'Seven day rhythm', 'Three songs banked', 'A hundred plays',
    'Clean run, hard tier', 'Skill to independent', '24 Aug', '26 Aug',
  ]],
  ['takes', 'btn-takes', ['9 takes kept, 312MB of 500MB.', '28 Aug, easy tier', '2:14', '3:41']],
  ['calibrate', 'btn-calibrate', ['Measured 42ms of output delay. Applied to scoring.', '42ms']],
  ['touch', 'btn-touch', ['mezzo forte, 78', '4 done']],
  ['keys12', 'btn-keys12', ['6 of 12', '3 of 12']],
  // the teacher task screen (board 11c, 2026-08-30): its drawn specimens are
  // blanked at boot by path.mjs; this holds that line
  ['task', 'show:task', [
    'Root position, left hand alone, name the notes as you place them.',
    'That was a G sharp. The seventh of Cm7 is B flat.',
    'STAGE 4, INDEPENDENT', 'E flat', '2 of 3 clean builds banked',
  ]],
];

// the drawer is its own surface with its own drawn sample states
const DRAWER_SENTINELS = ['Two won, two open', '312MB of 500MB', 'Measured 42ms of output delay',
  'Six hits from softest to hardest', 'Level 3, 9 in a row', 'Level 4, five notes', '6 of 48 cells passed'];
const b = await launch({ width: 1418, height: 738, scale: 1, port: 9581 });
const results = [];
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1900));

  for (const [screen, how, sentinels] of SCREENS) {
    if (how === 'song:Für Elise') {
      await b.eval(`(() => {
        const row = [...document.querySelectorAll('#screen-library *')]
          .find((e) => !e.children.length && e.textContent.trim() === 'Für Elise');
        (row?.closest('[style*="cursor"]') ?? row?.parentElement)?.click();
        return true;
      })()`);
      await new Promise((r) => setTimeout(r, 1500));
    } else if (how === 'lesson:first') {
      await b.eval(`(() => { document.getElementById('btn-lessons')?.click(); return true; })()`);
      await new Promise((r) => setTimeout(r, 700));
      await b.eval(`(() => {
        const list = document.getElementById('lesson-list');
        const row = list && [...list.querySelectorAll('[data-i]'), ...list.children].find((c) => !c.disabled && c.textContent.trim());
        row?.click();
        return true;
      })()`);
      await new Promise((r) => setTimeout(r, 900));
    } else if (how === 'show:task') {
      await b.eval(`window.__show('task'); true`);
      await new Promise((r) => setTimeout(r, 500));
    } else if (how) {
      await b.eval(`(() => { document.getElementById(${JSON.stringify(how)})?.click(); return true; })()`);
      await new Promise((r) => setTimeout(r, 700));
    } else {
      await b.eval(`window.__show('library'); true`);
      await new Promise((r) => setTimeout(r, 500));
    }
    const visibleText = await b.eval(`(() => {
      const host = document.getElementById('screen-${screen}');
      if (!host || host.hidden) return 'SCREEN NOT VISIBLE';
      const out = [];
      for (const e of host.querySelectorAll('*')) {
        if (e.children.length) continue;
        const t = e.textContent.trim();
        if (!t) continue;
        const r = e.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        out.push(t);
      }
      return out.join('\\n');
    })()`);
    const hits = visibleText === 'SCREEN NOT VISIBLE' ? ['SCREEN NOT VISIBLE']
      : sentinels.filter((sv) => visibleText.includes(sv));
    results.push({ screen, hits });
  }
  // the SLEEVE WALL (12a), opened through its real door on the Explore shelf.
  // Its drawn samples: "EXPLORE · 17 SONGS", Für Elise at "79" plays Banked -
  // none can be true under this seed (fur-elise has 4 plays, and the shelf
  // count is whatever the app computes).
  await b.eval(`window.__show('library'); true`);
  await new Promise((r) => setTimeout(r, 400));
  await b.eval(`(() => { document.getElementById('sec-explore')?.click(); return true; })()`);
  await new Promise((r) => setTimeout(r, 700));
  await b.eval(`(() => { const m = [...document.querySelectorAll('#screen-library *')].find((e) => !e.children.length && /^Show the other/.test(e.textContent.trim())); (m && (m.closest('button') ?? m.parentElement)).click(); return true; })()`);
  await new Promise((r) => setTimeout(r, 900));
  const galleryText = await b.eval(`document.getElementById('canon-gallery')?.textContent ?? 'NO GALLERY'`);
  const GALLERY_SENTINELS = ['EXPLORE · 17 SONGS'];
  results.push({ screen: 'library gallery', hits: galleryText === 'NO GALLERY' ? ['NO GALLERY']
    : GALLERY_SENTINELS.filter((sv) => galleryText.includes(sv)) });
  await b.eval(`(document.getElementById('canon-gallery')?.remove(), true)`);

  // the ALL TOOLS drawer, opened for real
  await b.eval(`window.__show('library'); true`);
  await new Promise((r) => setTimeout(r, 500));
  await b.eval(`(() => { const l = [...document.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim() === 'All tools'); (l?.closest('button') ?? l?.parentElement)?.click(); return true; })()`);
  await new Promise((r) => setTimeout(r, 900));
  const drawerText = await b.eval(`document.getElementById('canon-tools-drawer')?.textContent ?? 'NO DRAWER'`);
  results.push({ screen: 'all-tools drawer', hits: drawerText === 'NO DRAWER' ? ['NO DRAWER'] : DRAWER_SENTINELS.filter((sv) => drawerText.includes(sv)) });
} finally { await b.close(); }

let failed = 0;
for (const r of results) {
  if (r.hits.length) failed++;
  console.log(`${r.hits.length ? 'FAIL' : 'PASS'}  ${r.screen}`);
  for (const h of r.hits) console.log('        sample visible: ' + JSON.stringify(h));
}
console.log(`\n${results.length - failed}/${results.length} screens show no design-sample values with real data`);
process.exit(failed ? 1 : 0);
