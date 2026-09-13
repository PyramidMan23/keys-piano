// DOES THE END OF A RUN SHOW YOU ANYTHING?
//
// Mark, 2026-09-13: "now when i finish a song i cant see my score and i dont
// see that card that used to come up its just black. is this a bug?? can we
// have the old thing back haha"
//
// It was a bug, and his own journal is the evidence: three Fur Elise finishes
// at 80, 76 and 78 percent and a Mario finish at 78, not one score card
// between them. finishSong hid the results card whenever a correction existed
// (`$('results').hidden = guidedHold || !!correction`), every run under 85%
// makes a correction, and the correction draws into #guide-body, which is
// hidden while the guide is collapsed. His guide was collapsed. So the card
// was suppressed and the thing that replaced it was invisible: a black deck
// and no feedback at all.
//
// This probe refuses to ask the app what it INTENDED. It opens a song, hides
// the practice guide the way his window had it, drives a real run to a real
// finish with a deliberately low accuracy, and MEASURES what a person would
// see: the results card's rendered rect, the numbers inside it, the
// correction's rendered rect, and whether the card actually covers the deck
// rather than sitting behind a black canvas. Then it does it again with a
// clean run, where no correction exists, because a fix that only works on the
// failing path is half a fix.
//
// Both of Mark's window widths, because the guide's collapse default is a
// width test and the composition changes with it.
//
//   node tools/finish-card-probe.mjs          (PORT=4181 to point at a worktree)
import { launch } from './cdp.mjs';

const BASE = 'http://localhost:' + (process.env.PORT || 4180) + '/index.html';
const NOW = Date.now();
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: NOW - 864e5, calOffsetMs: 0,
  days: [], pmin: {}, lessons: {},
  lib: { learning: true, canonTab: 'learning' },
  songs: { 'fur-elise': { plays: 9, stars: 1, best: 78, ms: 600000, lastAt: NOW - 36e5 } },
};

const results = [];
const ok = (name, pass, note = '') => {
  results.push(!!pass);
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (note ? '  ' + note : ''));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A real hit-tested click, never el.click(): a synthetic click does not
// hit-test and "succeeds" on a covered element, so nothing opens.
const hit = (label) => `(() => {
  const want = ${JSON.stringify('%LABEL%')};
  const ms = [...document.querySelectorAll('*')].filter((e) => !e.children.length
    && e.textContent.trim() === want && e.getBoundingClientRect().width > 0);
  for (const el of ms.reverse()) {
    const h = el.closest("button, a, [role='button']") || el;
    const r = h.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);
    const top = document.elementFromPoint(cx, cy);
    if (top && (top === h || h.contains(top) || top.contains(h))) return { x: Math.round(cx), y: Math.round(cy) };
  }
  return null;
})()`.replace(JSON.stringify('%LABEL%'), JSON.stringify(label));

async function walk(width, height) {
  console.log(`\n---- ${width}x${height} ----`);
  const b = await launch({ width, height, scale: 1, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });
  const tag = (name) => `${name} @${width}`;
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(e.message));`,
    });
    const click = async (x, y) => {
      await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
      await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    };
    const clickLabel = async (label) => {
      const pt = await b.eval(hit(label));
      if (!pt) return false;
      await click(pt.x, pt.y);
      return true;
    };

    await b.goto(BASE + '?canon=0');
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
    await b.goto(BASE + '?canon=1');
    await sleep(1800);

    let opened = false;
    for (const label of ['Für Elise', 'Fur Elise']) if (await clickLabel(label)) { opened = true; break; }
    if (!opened) { ok(tag('a song opens from the library'), false, 'no Fur Elise row'); return; }
    await sleep(1600);
    const screen = await b.eval(`[...document.querySelectorAll('[id^=screen-]')].filter((s) => !s.hidden).map((s) => s.id.replace('screen-','')).join(',')`);
    if (!/play/.test(screen)) { ok(tag('a song opens from the library'), false, `landed on ${screen}`); return; }

    // Mark's window, exactly: the practice guide collapsed. This is the
    // condition that made a correction invisible, so the probe reproduces it
    // rather than assuming the guide happens to be open.
    await clickLabel('Hide practice guide');
    await sleep(500);
    const collapsed = await b.eval(`(document.getElementById('guide-toggle')?.textContent ?? '').trim()`);
    ok(tag('the practice guide starts collapsed, the way his window had it'),
      collapsed === 'Show practice guide', JSON.stringify(collapsed));

    // ---- a failing run, driven the way a person fails one: nothing played ----
    // A fresh attempt sits ARMED until a trigger press, so send one, then let
    // the engine's own clock carry the run to its end with every note missed.
    const finish = async () => {
      await b.eval(`(() => {
        document.getElementById('section-select').value = '';
        const wm = document.getElementById('wait-mode');
        if (wm.checked) { wm.checked = false; wm.dispatchEvent(new Event('change', { bubbles: true })); }
        return true;
      })()`);
      await sleep(300);
      await b.eval(`window.__simNote(60, true); window.__simNote(60, false); true`);
      await sleep(400);
      await b.eval(`window.__engine.beat = window.__engine.endBeat - 2; true`);
      for (let i = 0; i < 60; i++) {
        await sleep(250);
        if (await b.eval(`!!window.__engine && window.__engine.finished`)) break;
      }
      await sleep(600);
    };

    // Everything a person can actually see at the end of the run, measured.
    const seen = () => b.eval(`(() => {
      const r = document.getElementById('results');
      const box = r ? r.getBoundingClientRect() : null;
      const card = r ? r.querySelector('.results-card') : null;
      const cbox = card ? card.getBoundingClientRect() : null;
      const stats = document.getElementById('results-stats');
      const stars = document.querySelector('#results-title .stars');
      const corr = document.querySelector('.correction-card');
      const cr = corr ? corr.getBoundingClientRect() : null;
      const deck = document.getElementById('falls');
      const dr = deck ? deck.getBoundingClientRect() : null;
      const over = (a, x) => !a || !x ? 0
        : Math.max(0, Math.min(a.right, x.right) - Math.max(a.left, x.left))
          * Math.max(0, Math.min(a.bottom, x.bottom) - Math.max(a.top, x.top));
      return {
        hidden: r ? r.hidden : 'no #results',
        rect: cbox ? { w: Math.round(cbox.width), h: Math.round(cbox.height) } : null,
        statsText: stats ? stats.textContent.replace(/\\s+/g, ' ').trim() : null,
        stars: stars ? { text: stars.textContent.trim(), w: Math.round(stars.getBoundingClientRect().width) } : null,
        verdict: document.querySelector('#results-stats .verdict')?.textContent.trim() ?? null,
        delta: document.querySelector('#results-stats .delta-up, #results-stats .delta-down')?.textContent.replace(/\\s+/g, ' ').trim() ?? null,
        again: (() => { const a = document.getElementById('results-again'); const ar = a && a.getBoundingClientRect();
          return a ? { text: a.textContent.trim(), w: Math.round(ar.width), h: Math.round(ar.height) } : null; })(),
        correction: corr ? { w: Math.round(cr.width), h: Math.round(cr.height), text: corr.textContent.replace(/\\s+/g, ' ').trim().slice(0, 90) } : null,
        deckRect: dr ? { w: Math.round(dr.width), h: Math.round(dr.height) } : null,
        overlapPct: (dr && cbox && dr.width * dr.height) ? +(100 * over(cbox, dr) / (dr.width * dr.height)).toFixed(1) : 0,
        acc: window.__engine ? window.__engine.accuracy() : null,
        finished: !!(window.__engine && window.__engine.finished),
      };
    })()`);

    await finish();
    const low = await seen();
    console.log('low run: ' + JSON.stringify(low));
    ok(tag('a finished run under 85% shows the results card'),
      low.finished && low.hidden === false, `hidden=${low.hidden} finished=${low.finished} acc=${low.acc}`);
    ok(tag('the card has a rendered rect, it is not an empty node'),
      !!low.rect && low.rect.w > 100 && low.rect.h > 100, JSON.stringify(low.rect));
    ok(tag('the run really was a low one (a correction is the whole trap)'),
      typeof low.acc === 'number' && low.acc < 85, `acc=${low.acc}`);
    ok(tag('the card names an accuracy'),
      /\d+%\s*accuracy/.test(low.statsText ?? ''), JSON.stringify((low.statsText ?? '').slice(0, 80)));
    ok(tag('the card draws the stars'),
      !!low.stars && /[★☆]{3}/.test(low.stars.text) && low.stars.w > 0, JSON.stringify(low.stars));
    ok(tag('the card carries the competence line'), !!low.verdict && low.verdict.length > 3, JSON.stringify(low.verdict));
    ok(tag('the card carries a Play again / Restart from control at 44px'),
      !!low.again && /^(Play again|Restart)/.test(low.again.text) && low.again.h >= 44, JSON.stringify(low.again));
    ok(tag('the correction is in the DOM AND rendered, not hidden inside a collapsed guide'),
      !!low.correction && low.correction.h > 40 && low.correction.w > 40, JSON.stringify(low.correction));
    ok(tag('the falls canvas is not the only thing on screen: the card covers the deck'),
      low.overlapPct > 5, `card ${JSON.stringify(low.rect)} over deck ${JSON.stringify(low.deckRect)} = ${low.overlapPct}%`);

    // ---- a second failing run at the same scope earns the attempt delta ----
    if (!(await clickLabel('Play again'))) ok(tag('Play again is hit-testable on the results card'), false, 'no Play again');
    else ok(tag('Play again is hit-testable on the results card'), true);
    await sleep(900);
    await finish();
    const second = await seen();
    console.log('second low run: ' + JSON.stringify(second));
    ok(tag('the second run shows its card too'), second.hidden === false && second.finished,
      `hidden=${second.hidden} acc=${second.acc}`);
    ok(tag('the card carries the previous-attempt delta'),
      !!second.delta && /\d+%\s*→\s*today/.test(second.delta), JSON.stringify(second.delta));

    // ---- and a clean run, where no correction exists at all ----
    // Help on, whole song: with help on the engine accepts only the current
    // group's notes, so arriving at each group and playing exactly it is a
    // person playing the piece right rather than a score being handed in.
    // ☠️ A SECTION RUN NEVER FINISHES. `repeat` is true whenever there is no
    // chosen start, so a section loops back to its own first beat forever: the
    // first cut of this leg watched the beat wrap 10.47 to 0.74 three times and
    // reported the app broken. The whole song is the only run that ends.
    await clickLabel('Play again');
    await sleep(700);
    await b.eval(`(() => {
      const sel = document.getElementById('section-select');
      sel.value = '';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      const wm = document.getElementById('wait-mode');
      if (!wm.checked) { wm.checked = true; wm.dispatchEvent(new Event('change', { bubbles: true })); }
      return true;
    })()`);
    await sleep(500);
    for (let i = 0; i < 200; i++) {
      if (await b.eval(`!!window.__engine && window.__engine.finished`)) break;
      const left = await b.eval(`(() => {
        const e = window.__engine, g = e && e.currentGroup();
        if (!g) { e.beat = e.endBeat - 0.01; return -1; }
        e.beat = g.beat;
        for (const n of g.notes) if (!g.done.has(n.m)) { window.__simNote(n.m, true, 90); window.__simNote(n.m, false); }
        return g.notes.length;
      })()`);
      await sleep(left === -1 ? 400 : 60);
    }
    await sleep(1200);
    const high = await seen();
    console.log('clean run: ' + JSON.stringify(high));
    ok(tag('the clean run finished at 85% or better'), high.finished && high.acc >= 85, `acc=${high.acc} finished=${high.finished}`);
    ok(tag('a clean run makes no correction'), high.correction === null, JSON.stringify(high.correction));
    ok(tag('and the results card still shows'), high.hidden === false && !!high.rect && high.rect.h > 100,
      `hidden=${high.hidden} rect=${JSON.stringify(high.rect)}`);
    ok(tag('the clean card names its accuracy and stars'),
      /\d+%\s*accuracy/.test(high.statsText ?? '') && !!high.stars && high.stars.w > 0,
      JSON.stringify((high.statsText ?? '').slice(0, 60)));

    const errs = await b.eval('window.__errs');
    ok(tag('no page errors'), !errs.length, errs.join('|'));
  } finally {
    await b.close();
  }
}

await walk(1418, 900);
await walk(2000, 1100);

console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
if (!results.length || !results.every(Boolean)) process.exit(1);
console.log('PASS: a finished run always shows its score, and a correction is drawn where it can be seen');
