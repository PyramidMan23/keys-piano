// DOES THE CLICK DO THE RIGHT THING?
//
// tools/canon-clickable.mjs proves every control has a listener. Codex, in
// council on 2026-08-29: "It proves only that every control triggers something,
// the behavioural equivalent of proving every piano key makes a noise, without
// checking the note."
//
// So this walks Mark's real journeys and asserts the OUTCOME: which screen you
// land on, what state changed, whether you can get back, and whether the change
// survives a reload. A journey that ends on the right screen with the wrong
// state fails here, and neither the pixel gate nor the listener audit can see
// that.
//
// Run: node tools/canon-journeys.mjs
import { launch } from './cdp.mjs';

const today = new Date();
const day = (o) => { const d = new Date(today); d.setDate(d.getDate() - o);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 42,
  days: [day(0), day(1), day(2), day(4)],
  pmin: { [day(0)]: 24, [day(1)]: 12, [day(2)]: 31, [day(4)]: 18 },
  lastSession: { songId: 'still-dre-easy', at: Date.now() - 36e5 },
  songs: {
    'fur-elise': { plays: 79, stars: 3, best: 96 },
    'still-dre-easy': { plays: 22, stars: 3, best: 91 },
    'mario-easy': { plays: 5, stars: 1, best: 71 },
  },
  lib: { learning: true },
};

const results = [];
const b = await launch({ width: 1418, height: 900, scale: 1, port: 9591 });

const boot = async () => {
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1700));
};
const visible = () => b.eval(`(() => { const s = [...document.querySelectorAll('.screen')].find(x => !x.hidden); return s ? s.id.replace('screen-','') : 'none'; })()`);
// A REAL mouse click, hit-tested by the browser. The first version of this file
// used el.click(), which fires handlers even when another element is sitting on
// top eating the actual pointer - and that is precisely how a full-screen
// overlay blocked every control while this suite reported 6/6. Synthetic clicks
// do not hit-test; these do.
const clickText = async (label) => {
  const pt = await b.eval(`(() => {
    // Among every element with this text, click the one a PERSON would hit: the
    // one that wins the hit-test at its own centre. The first version clicked
    // the first DOM match, which found the rail's "Metronome" sitting UNDER the
    // open tools drawer, and the click landed on the drawer instead.
    const matches = [...document.querySelectorAll('*')]
      .filter(e => !e.children.length && e.textContent.trim() === ${JSON.stringify(label)}
                   && e.getBoundingClientRect().width > 0);
    for (const el of matches.reverse()) {
      const hit = el.closest('button, a, [role="button"]') || el;
      const r = hit.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);
      const top = document.elementFromPoint(cx, cy);
      if (top && (top === hit || hit.contains(top) || top.contains(hit))) {
        return { x: Math.round(cx), y: Math.round(cy) };
      }
    }
    return null;
  })()`);
  if (!pt) return 'NOT FOUND';
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  return 'ok';
};
const state = () => b.eval(`JSON.parse(localStorage.getItem('keys-v1') || '{}')`);
// a REAL hit-tested click on an element addressed by id: the browser picks
// the topmost node at the element's centre, so an occluding layer fails this
// the way it fails a person (Codex: several journeys still used .click())
const clickId = async (id) => {
  const pt = await b.eval(`(() => {
    const el = document.getElementById(${JSON.stringify(id)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);
    const top = document.elementFromPoint(cx, cy);
    if (!(top && (top === el || el.contains(top) || top.contains(el)))) return null;
    return { x: Math.round(cx), y: Math.round(cy) };
  })()`);
  if (!pt) return 'NOT CLICKABLE';
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  return 'ok';
};


async function journey(name, fn) {
  try {
    const problems = await fn();
    results.push({ name, problems: problems ?? [] });
  } catch (e) { results.push({ name, problems: ['threw: ' + (e.message ?? e)] }); }
}

try {
  await b.goto('http://localhost:4180/index.html');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await boot();

  await journey('open a song from the library, then get back out', async () => {
    const bad = [];
    if (await visible() !== 'library') bad.push('did not start on the library');
    const clicked = await clickText('Still D.R.E.');
    if (clicked !== 'ok') bad.push('no Still D.R.E. row on the library');
    await new Promise((r) => setTimeout(r, 900));
    const where = await visible();
    if (where !== 'play') bad.push(`clicking a song landed on ${where}, expected play`);
    const song = await b.eval(`(() => { const t = document.getElementById('now-playing'); return t ? t.textContent.trim() : ''; })()`);
    if (!/still/i.test(song)) bad.push(`play screen is showing ${JSON.stringify(song)}, not the song that was clicked`);
    if (await clickText('Library') !== 'ok') bad.push('no way back on the play screen');
    await new Promise((r) => setTimeout(r, 700));
    if (await visible() !== 'library') bad.push('the back control did not return to the library');
    return bad;
  });

  await journey('reach a tool through All tools, and come back', async () => {
    const bad = [];
    if (await clickText('All tools') !== 'ok') bad.push('no All tools control');
    await new Promise((r) => setTimeout(r, 600));
    const open = await b.eval(`!!document.getElementById('canon-tools-drawer')`);
    if (!open) bad.push('All tools did not open the drawer');
    if (await clickText('Metronome') !== 'ok') bad.push('no Metronome row in the drawer');
    await new Promise((r) => setTimeout(r, 800));
    const where = await visible();
    if (where !== 'metronome') bad.push(`the drawer sent us to ${where}, expected metronome`);
    if (await b.eval(`!!document.getElementById('canon-tools-drawer')`)) bad.push('the drawer stayed open behind the screen');
    if (await clickText('Library') !== 'ok') bad.push('no way back from the metronome');
    await new Promise((r) => setTimeout(r, 700));
    if (await visible() !== 'library') bad.push('could not get back from the metronome');
    return bad;
  });

  await journey('change the sort, and have it survive a reload', async () => {
    const bad = [];
    const before = (await state()).lib?.exploreSort ?? 'az';
    const target = before === 'diff' ? 'A to Z' : 'Weakest';
    if (await clickText(target) !== 'ok') bad.push(`no ${target} control`);
    await new Promise((r) => setTimeout(r, 700));
    const after = (await state()).lib?.exploreSort;
    if (after === before) bad.push(`clicking ${target} did not change the stored sort (${before})`);
    await boot();
    const reloaded = (await state()).lib?.exploreSort;
    if (reloaded !== after) bad.push(`the sort did not survive a reload (${after} became ${reloaded})`);
    return bad;
  });

  await journey('type in the search and have the library respond', async () => {
    const bad = [];
    const typed = await b.eval(`(() => {
      const s = document.getElementById('lib-search');
      if (!s) return 'NO SEARCH';
      s.focus();
      return 'ok';
    })()`);
    if (typed !== 'ok') bad.push('no search field on the library');
    for (const ch of 'elise') await b.send('Input.dispatchKeyEvent', { type: 'char', text: ch });
    await new Promise((r) => setTimeout(r, 700));
    const kept = await b.eval(`(() => { const s = document.getElementById('lib-search'); return s ? { v: s.value, focused: document.activeElement === s } : null; })()`);
    if (!kept || kept.v !== 'elise') bad.push(`the search lost what was typed (read ${JSON.stringify(kept && kept.v)})`);
    if (kept && !kept.focused) bad.push('the search lost focus while typing');
    return bad;
  });

  await journey('choose a quest, and have the choice stick', async () => {
    const bad = [];
    await boot();
    // the quest rows are BUTTONS on the 756 column and SPANS on 10a, so read
    // the first quest's label structurally rather than by tag
    const label = await b.eval(`(() => {
      const t = document.getElementById('screen-library');
      const box = [...t.querySelectorAll('*')].find(e => !e.children.length && /^TODAY( · CHOOSE 1)?$/.test(e.textContent.trim()));
      if (!box) return null;
      let module = box.closest('div');
      while (module && !module.querySelector('button')) module = module.parentElement;
      if (!module) return null;
      const btn = [...module.querySelectorAll('button')].find((b2) => b2.getBoundingClientRect().width > 0);
      const leaf2 = btn && [...btn.querySelectorAll('*')].find((e) => !e.children.length && /[a-z]/.test(e.textContent) && !/^(CHOSEN|\\+\\d+)$/.test(e.textContent.trim()));
      return leaf2 ? leaf2.textContent.trim() : null;
    })()`);
    if (!label) { bad.push('no quests on the library'); return bad; }
    const beforeQ = JSON.stringify((await state()).activeQuest ?? null);   // chooseQuest writes activeQuest
    if (await clickText(label) !== 'ok') bad.push(`could not click the quest ${JSON.stringify(label)}`);
    await new Promise((r) => setTimeout(r, 700));
    const afterQ = JSON.stringify((await state()).activeQuest ?? null);
    if (afterQ === beforeQ) bad.push('choosing a quest changed nothing that persists');
    return bad;
  });

  await journey('the tabs change the table: Hall of fame, Explore, back to Learning', async () => {
    const bad = [];
    await boot();
    // The desktop frame has no separate table-header label; the honest signal
    // that the table switched is the show-more line and the rows themselves.
    // Read the ROWS, not the show-more copy: Codex's repro was an early-return
    // renderRows, which leaves the rows untouched while the copy still updates,
    // and a copy-based assertion waves it through.
    const tableSays = () => b.eval(`(() => {
      const card = document.getElementById('screen-library').firstElementChild;
      const t = card.textContent;
      const m = t.match(/Show the other \d+ in ([A-Za-z ]+)/);
      const word = m ? m[1].trim() : (JSON.parse(localStorage.getItem('keys-v1')).lib.canonTab ?? 'learning');
      const rows = [...card.querySelectorAll('img')].filter(i => i.id !== 'next-action-cover').map(i => {
        let r = i.parentElement; while (r && r.children.length < 4) r = r.parentElement;
        return r ? (r.textContent || '').slice(0, 30) : '';
      });
      return { word, rows: rows.join('|') };
    })()`);
    const start = await tableSays();
    if (await clickText('Hall of fame') !== 'ok') bad.push('no Hall of fame tab to click');
    await new Promise((r) => setTimeout(r, 800));
    let says = await tableSays();
    if (!/fame/i.test(says.word)) bad.push(`clicked Hall of fame and the table still shows ${JSON.stringify(says.word)}`);
    if (says.rows === start.rows) bad.push('clicked Hall of fame and the ROWS did not change');
    const fameRows = says.rows;
    if (await clickText('Explore') !== 'ok') bad.push('no Explore tab to click');
    await new Promise((r) => setTimeout(r, 800));
    says = await tableSays();
    if (!/explore/i.test(says.word)) bad.push(`clicked Explore and the table still shows ${JSON.stringify(says.word)}`);
    if (says.rows === fameRows) bad.push('clicked Explore and the ROWS did not change');
    if (await clickText('Learning') !== 'ok') bad.push('no Learning tab to click');
    await new Promise((r) => setTimeout(r, 800));
    says = await tableSays();
    if (!/learning/i.test(says.word)) bad.push(`clicked Learning and the table still shows ${JSON.stringify(says.word)}`);
    if (says.rows !== start.rows) bad.push('returning to Learning did not restore the original rows');
    return bad;
  });

  await journey('typing in the search FILTERS the table', async () => {
    const bad = [];
    await boot();
    const rowTitles = () => b.eval(`(() => {
      // the GRID is tagged by the elastic library; its Fraunces leaves are
      // the result titles. The hero legitimately keeps the resume song.
      const grid = document.querySelector('#screen-library [data-lib-grid]');
      if (!grid) return [];
      return [...grid.querySelectorAll('*')]
        .filter((e) => !e.children.length && /Fraunces/.test(e.getAttribute('style') ?? '') && e.textContent.trim() && e.getBoundingClientRect().width > 0)
        .map((e) => e.textContent.trim());
    })()`);
    const before = await rowTitles();
    await b.eval(`(() => { const s = document.getElementById('lib-search'); s.focus(); return true; })()`);
    for (const ch of 'elise') await b.send('Input.dispatchKeyEvent', { type: 'char', text: ch });
    await new Promise((r) => setTimeout(r, 900));
    const after = await rowTitles();
    if (!after.some((t) => /Elise/.test(t))) bad.push('searching "elise" produced no row containing Elise');
    if (after.length >= before.length && before.length > 2) bad.push(`searching did not narrow the table (${before.length} rows before, ${after.length} after)`);
    if (after.some((t) => /Mario|D\.R\.E/.test(t))) bad.push('non-matching songs are still in the table while searching');
    return bad;
  });

  await journey('a brand new user can get past the first-run dialog', async () => {
    const bad = [];
    await b.goto('http://localhost:4180/index.html?canon=0');
    await b.eval(`localStorage.clear(); true`);
    await b.goto('http://localhost:4180/index.html');
    await new Promise((r) => setTimeout(r, 1800));
    const up = await b.eval(`(() => { const f = document.getElementById('firstrun'); return f && !f.hidden; })()`);
    if (!up) return ['fresh state did not show the first-run dialog (fine if intended, but then nothing should block clicks)'];
    if (await clickText('Skip, just show me the app') !== 'ok') bad.push('no Skip control on the first-run dialog');
    await new Promise((r) => setTimeout(r, 700));
    const gone = await b.eval(`(() => { const f = document.getElementById('firstrun'); return !f || f.hidden; })()`);
    if (!gone) bad.push('Skip did not dismiss the first-run dialog, so every click on the page is eaten by it');
    // and now a real click must actually reach the page
    if (await clickText('All tools') !== 'ok') bad.push('no All tools after dismissing first-run');
    await new Promise((r) => setTimeout(r, 700));
    if (!await b.eval(`!!document.getElementById('canon-tools-drawer') || !!document.querySelector('#canon-all-tools[style*="flex"]')`)) {
      bad.push('after dismissing first-run, clicking All tools still does nothing');
    }
    return bad;
  });

  await journey('every tool in the drawer opens its screen and comes back', async () => {
    const bad = [];
    await boot();
    // tool label -> the screen it must land on. Read from the app's own rails,
    // asserted against the visible screen, so a dead drawer row cannot hide.
    const MAP = {
      'My path': 'path', 'Lessons': 'lessons', 'Sight reading': 'play',
      // Skill workout is "ear or scales, ALTERNATING EACH DAY": scales day
      // lands on play, ear day on echo. Pinning one broke on the date rollover.
      'Quick win': 'play', 'Improve a song': 'play', 'Skill workout': ['play', 'echo'],
      'Rhythm tap': 'rhythm', 'Melody echo': 'echo', 'Improv': 'improv',
      '12 keys': 'keys12', 'Free play': 'freeplay', 'Metronome': 'metronome',
      'Trophies': 'trophies', 'Takes': 'takes', 'Voice': 'library',
      'Latency calibration': 'calibrate', 'Touch diagnostic': 'touch',
    };
    for (const [label, expect] of Object.entries(MAP)) {
      if (await clickText('All tools') !== 'ok') { bad.push('could not open the drawer for ' + label); break; }
      await new Promise((r) => setTimeout(r, 500));
      if (await clickText(label) !== 'ok') { bad.push('no drawer row for ' + label); await b.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 27, key: 'Escape', code: 'Escape' }); continue; }
      await new Promise((r) => setTimeout(r, 800));
      const where = await visible();
      const wanted = Array.isArray(expect) ? expect : [expect];
      if (!wanted.includes(where)) bad.push(`${label} landed on ${where}, expected ${wanted.join(' or ')}`);
      // and back, whatever screen we are on
      if (where !== 'library') {
        if (await clickText('Library') !== 'ok') bad.push(`no way back from ${label} (${where})`);
        await new Promise((r) => setTimeout(r, 700));
        if (await visible() !== 'library') bad.push(`could not return to the library from ${label}`);
      }
    }
    return bad;
  });

  await journey('a LESSON actually runs: open, start, see the first step', async () => {
    const bad = [];
    await boot();
    if (await clickText('All tools') !== 'ok') return ['no drawer'];
    await new Promise((r) => setTimeout(r, 500));
    if (await clickText('Lessons') !== 'ok') return ['no Lessons in the drawer'];
    await new Promise((r) => setTimeout(r, 800));
    if (await visible() !== 'lessons') return ['Lessons did not open the lessons screen'];
    // the first lesson row is Ready by definition of the sequential unlock;
    // find its title and click it for REAL (hit-tested, not row.click())
    const lessonTitle = await b.eval(`(() => {
      const list = document.getElementById('lesson-list');
      if (!list) return null;
      const row = [...list.querySelectorAll('[data-i]'), ...list.children].find((c) => !c.disabled && c.textContent.trim());
      if (!row) return null;
      const leaf = [...row.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim().length > 3);
      return leaf ? leaf.textContent.trim() : null;
    })()`);
    if (!lessonTitle) return ['no openable lesson row'];
    if (await clickText(lessonTitle) !== 'ok') return ['the lesson row ' + JSON.stringify(lessonTitle) + ' does not win its own hit-test'];
    await new Promise((r) => setTimeout(r, 900));
    if (await visible() !== 'lesson') bad.push('clicking a lesson did not open the lesson screen');
    const started = await clickId('lesson-start');
    if (started !== 'ok') bad.push('lesson-start does not win its own hit-test');
    await new Promise((r) => setTimeout(r, 1000));
    const step = await b.eval(`(() => {
      const steps = document.getElementById('lesson-steps');
      const phase = document.getElementById('lesson-phase');
      return { steps: steps ? steps.textContent.trim().length : -1,
               phase: phase ? phase.textContent.trim().slice(0, 40) : null,
               keys: !!document.getElementById('lesson-keys') };
    })()`);
    if (step.steps <= 0) bad.push('the lesson started but no steps rendered');
    if (!step.keys) bad.push('the lesson keyboard canvas is missing');
    // leaving a lesson is TWO steps by design: Back goes up to the lesson
    // list, and the list's Library goes home. The first version demanded the
    // library in one hop and called correct behaviour a bug.
    if (await clickText('Back') !== 'ok') bad.push('no Back inside the lesson');
    await new Promise((r) => setTimeout(r, 700));
    if (await visible() !== 'lessons') bad.push('Back did not return to the lesson list');
    if (await clickText('Library') !== 'ok') bad.push('no Library on the lesson list');
    await new Promise((r) => setTimeout(r, 700));
    if (await visible() !== 'library') bad.push('could not get home from the lesson list');
    return bad;
  });

  // ---- 2026-08-29: EVERY screen gets a deep journey ------------------------
  // Enter through the app's own navigation, use the screen's controls, assert
  // the visible result AND the persisted state, and get back out. Appearance
  // gates have lied twice; behaviour is the standard.
  const openTool = async (label) => {
    if (await clickText('All tools') !== 'ok') return 'no All tools control';
    await new Promise((r) => setTimeout(r, 500));
    if (await clickText(label) !== 'ok') return `no drawer row for ${label}`;
    await new Promise((r) => setTimeout(r, 800));
    return 'ok';
  };
  const goHome = async (bad, from) => {
    if (await clickText('Library') !== 'ok') { bad.push(`no way back from ${from}`); return; }
    await new Promise((r) => setTimeout(r, 600));
    if (await visible() !== 'library') bad.push(`could not get home from ${from}`);
  };
  const text = (id) => b.eval(`(() => { const e = document.getElementById(${JSON.stringify(id)}); return e ? e.textContent.trim() : null; })()`);
  const sim = (m, down, vel = 80) => b.eval(`(window.__simNote ? (window.__simNote(${m}, ${down}, ${vel}), 'ok') : 'no __simNote')`);

  await journey('METRONOME: start it, type a tempo, see both fields agree, stop it', async () => {
    const bad = [];
    await boot();
    const r0 = await openTool('Metronome');
    if (r0 !== 'ok') return [r0];
    if (await visible() !== 'metronome') return ['did not land on the metronome'];
    // the toggle prints the app's own label, which carries a glyph prefix
    if (await clickText('Start') !== 'ok' && await clickText('▶ Start') !== 'ok') bad.push('no Start control on the metronome');
    await new Promise((r) => setTimeout(r, 700));
    const running = await b.eval(`document.getElementById('met-toggle').textContent`);
    if (!/stop/i.test(running)) bad.push(`Start did not flip the toggle to Stop (reads ${JSON.stringify(running)})`);
    // type a real tempo into the number field and commit it
    await b.eval(`(() => { const n = document.getElementById('met-bpm-num'); n.focus(); n.select(); return true; })()`);
    for (const ch of '77') await b.send('Input.dispatchKeyEvent', { type: 'char', text: ch });
    await b.eval(`(() => { const n = document.getElementById('met-bpm-num'); n.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    await new Promise((r) => setTimeout(r, 400));
    const pair = await b.eval(`({ num: document.getElementById('met-bpm-num').value, range: document.getElementById('met-bpm').value })`);
    if (pair.num !== '77') bad.push(`typing 77 left the number field at ${JSON.stringify(pair.num)}`);
    if (pair.range !== '77') bad.push(`the slider did not follow the typed tempo (reads ${JSON.stringify(pair.range)})`);
    if (await clickId('met-toggle') !== 'ok') bad.push('met-toggle does not win its own hit-test');
    await new Promise((r) => setTimeout(r, 300));
    const stopped = await b.eval(`document.getElementById('met-toggle').textContent`);
    if (/stop/i.test(stopped)) bad.push('clicking the toggle again did not stop the metronome');
    await goHome(bad, 'the metronome');
    return bad;
  });

  await journey('FREE PLAY: a played note lands in the log', async () => {
    const bad = [];
    await boot();
    const r0 = await openTool('Free play');
    if (r0 !== 'ok') return [r0];
    if (await visible() !== 'freeplay') return ['did not land on freeplay'];
    const before = (await text('freeplay-log')) ?? '';
    if (await sim(60, true) !== 'ok') return ['no __simNote lever'];
    await new Promise((r) => setTimeout(r, 300));
    await sim(60, false);
    await new Promise((r) => setTimeout(r, 500));
    const after = (await text('freeplay-log')) ?? '';
    if (after === before || !/C4|C\b/.test(after)) bad.push(`playing middle C did not reach the log (before ${JSON.stringify(before.slice(0, 30))}, after ${JSON.stringify(after.slice(0, 30))})`);
    await goHome(bad, 'freeplay');
    return bad;
  });

  await journey('MELODY ECHO: the phrase plays and the screen says so', async () => {
    const bad = [];
    await boot();
    const r0 = await openTool('Melody echo');
    if (r0 !== 'ok') return [r0];
    if (await visible() !== 'echo') return ['did not land on echo'];
    const before = (await text('echo-msg')) ?? '';
    if (await clickText('▶ Play the phrase') !== 'ok' && await clickText('Play the phrase') !== 'ok') bad.push('no Play-the-phrase control');
    await new Promise((r) => setTimeout(r, 1200));
    const after = (await text('echo-msg')) ?? '';
    if (after === before || !after) bad.push(`starting the echo changed nothing on screen (still ${JSON.stringify(before.slice(0, 40))})`);
    await goHome(bad, 'echo');
    return bad;
  });

  await journey('RHYTHM TAP: starting a round renders the pattern blocks', async () => {
    const bad = [];
    await boot();
    const r0 = await openTool('Rhythm tap');
    if (r0 !== 'ok') return [r0];
    if (await visible() !== 'rhythm') return ['did not land on rhythm'];
    if (await clickText('▶ Play pattern') !== 'ok' && await clickText('Play pattern') !== 'ok' && await clickText('Start') !== 'ok') bad.push('no start control on rhythm tap');
    await new Promise((r) => setTimeout(r, 1200));
    const blocks = await b.eval(`(() => { const e = document.getElementById('rhythm-blocks'); return e ? e.children.length : -1; })()`);
    if (blocks < 1) bad.push(`starting a round rendered ${blocks} pattern blocks`);
    const lvl = await text('rhythm-level');
    if (!lvl || !/\d/.test(lvl)) bad.push(`no readable level (${JSON.stringify(lvl)})`);
    await goHome(bad, 'rhythm tap');
    return bad;
  });

  await journey('IMPROV: the loop starts, the chord readout lives, and it stops', async () => {
    const bad = [];
    await boot();
    const r0 = await openTool('Improv');
    if (r0 !== 'ok') return [r0];
    if (await visible() !== 'improv') return ['did not land on improv'];
    if (await clickId('improv-go') !== 'ok') bad.push('improv-go does not win its own hit-test');
    await new Promise((r) => setTimeout(r, 300));
    const go = await text('improv-go');
    if (!go || !/stop/i.test(go)) bad.push(`starting the backing did not flip the control (reads ${JSON.stringify(go)})`);
    await new Promise((r) => setTimeout(r, 900));
    const chord = await text('improv-chord');
    if (!chord) bad.push('no live chord readout while the loop runs');
    if (await clickId('improv-go') !== 'ok') bad.push('improv-go (stop) does not win its own hit-test');
    await new Promise((r) => setTimeout(r, 300));
    const stopped = await text('improv-go');
    if (/stop/i.test(stopped)) bad.push('the backing did not stop');
    await goHome(bad, 'improv');
    return bad;
  });

  await journey('CALIBRATION: redo arms a fresh run, reset zeroes the stored offset', async () => {
    const bad = [];
    // an earlier journey legitimately cleared storage; this one asserts the
    // SEEDED offset, so it re-seeds rather than assuming order
    await b.goto('http://localhost:4180/index.html?canon=0');
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
    await boot();
    const r0 = await openTool('Latency calibration');
    if (r0 !== 'ok') return [r0];
    if (await visible() !== 'calibrate') return ['did not land on calibrate'];
    if (await clickText('↻ Redo') !== 'ok' && await clickText('Measure again') !== 'ok' && await clickText('Redo') !== 'ok') bad.push('no redo control');
    await new Promise((r) => setTimeout(r, 500));
    const status = (await text('cal-status')) ?? '';
    if (!/fresh|press any key/i.test(status)) bad.push(`redo did not arm a fresh run (status ${JSON.stringify(status.slice(0, 50))})`);
    const before = (await state()).calOffsetMs;
    if (before !== 42) bad.push(`seeded offset should read 42 before reset, read ${before}`);
    if (await clickText('Back to zero') !== 'ok' && await clickText('Reset') !== 'ok' && await clickText('✕ Reset') !== 'ok') bad.push('no reset control');
    await new Promise((r) => setTimeout(r, 500));
    const after = (await state()).calOffsetMs;
    if (after !== 0) bad.push(`reset left the stored offset at ${after}, expected 0`);
    await goHome(bad, 'calibrate');
    return bad;
  });

  await journey('TOUCH DIAGNOSTIC: it asks for a key, and a struck key advances it', async () => {
    const bad = [];
    await boot();
    const r0 = await openTool('Touch diagnostic');
    if (r0 !== 'ok') return [r0];
    if (await visible() !== 'touch') return ['did not land on touch'];
    const key0 = await text('touch-key');
    const dyn0 = await text('touch-dyn');
    if (!key0) bad.push('the diagnostic is not asking for a key');
    if (!dyn0) bad.push('the diagnostic is not asking for a strength');
    const prog0 = await text('touch-progress');
    // strike the ASKED key: read its midi out of the running diagnostic prompt
    const asked = await b.eval(`(() => {
      // touch-key prints a note name; find the midi by asking the app's own map:
      // simulate through every candidate is silly, so read the diagnostic state
      // through the only public seam, the prompt text + a probe strike.
      return document.getElementById('touch-key').textContent.trim();
    })()`);
    // probe: strike middle C; either it is the asked key (progress moves) or the
    // screen must SAY it wanted something else. Both are correct behaviour.
    await sim(60, true, 90); await sim(60, false, 90);
    await new Promise((r) => setTimeout(r, 500));
    const status = (await text('touch-status')) ?? '';
    const prog1 = await text('touch-progress');
    const moved = prog1 !== prog0;
    const corrected = /wants|was/i.test(status);
    if (!moved && !corrected) bad.push(`a struck key neither advanced the diagnostic nor drew a correction (asked ${JSON.stringify(asked)}, status ${JSON.stringify(status.slice(0, 60))})`);
    await goHome(bad, 'touch');
    return bad;
  });

  await journey('12 KEYS: all four grids populated, a cell launches its drill', async () => {
    const bad = [];
    await boot();
    const r0 = await openTool('12 keys');
    if (r0 !== 'ok') return [r0];
    if (await visible() !== 'keys12') return ['did not land on keys12'];
    const grids = await b.eval(`(() => ['keys12-major','keys12-minor','keys12-majarp','keys12-minarp']
      .map((id) => { const e = document.getElementById(id); return e ? e.querySelectorAll('button').length : -1; }))()`);
    for (let gi = 0; gi < 4; gi++) if (grids[gi] !== 12) bad.push(`grid ${gi} holds ${grids[gi]} drills, expected 12`);
    const cellLabel = await b.eval(`(() => { const e = document.getElementById('keys12-major'); const c = e && e.querySelector('button'); if (!c) return null; c.id = c.id || 'k12-first-cell'; return c.id; })()`);
    if (!cellLabel) bad.push('no cell in the major grid');
    else if (await clickId(cellLabel) !== 'ok') bad.push('the first major-grid cell does not win its own hit-test');
    await new Promise((r) => setTimeout(r, 900));
    if (await visible() !== 'play') bad.push('a 12-key cell did not launch its drill on the play screen');
    await goHome(bad, 'the 12-key drill');
    return bad;
  });

  await journey('TROPHIES: seeded XP shows in the ledger, badges have words', async () => {
    const bad = [];
    await b.goto('http://localhost:4180/index.html?canon=0');
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify({
      ...SEED, xpTotal: 50, xpKeys: ['proof:still-dre-easy'],
      xpLog: [{ t: Date.now(), src: 'proof', ref: 'still-dre-easy', xp: 50 }],
    }))}); true`);
    await boot();
    const r0 = await openTool('Trophies');
    if (r0 !== 'ok') return [r0];
    if (await visible() !== 'trophies') return ['did not land on trophies'];
    const xp = (await text('xp-log')) ?? '';
    if (!/\+50/.test(xp) || !/proof/.test(xp)) bad.push(`the seeded +50 proof XP is not in the ledger (${JSON.stringify(xp.slice(0, 60))})`);
    const trophies = (await text('trophy-list')) ?? '';
    if (!trophies) bad.push('the badge cabinet rendered nothing at all');
    await goHome(bad, 'trophies');
    return bad;
  });

  await journey('TAKES: the shelf states its empty truth', async () => {
    const bad = [];
    await boot();
    const r0 = await openTool('Takes');
    if (r0 !== 'ok') return [r0];
    if (await visible() !== 'takes') return ['did not land on takes'];
    const usage = (await text('takes-usage')) ?? '';
    if (!/no takes yet|shelf slots/i.test(usage)) bad.push(`the storage line is not honest about the shelf (${JSON.stringify(usage.slice(0, 60))})`);
    await goHome(bad, 'takes');
    return bad;
  });

  await journey('MY PATH: a real reason, and Continue goes somewhere real', async () => {
    const bad = [];
    await boot();
    const r0 = await openTool('My path');
    if (r0 !== 'ok') return [r0];
    if (await visible() !== 'path') return ['did not land on path'];
    const reason = (await text('path-reason')) ?? '';
    if (!reason) bad.push('the path has no reason line');
    if (/has been independent for six days/.test(reason)) bad.push('the path is showing the DESIGN SAMPLE reason, not the real prescription');
    const skills = await b.eval(`(() => { const e = document.getElementById('path-skills'); return e ? e.children.length : -1; })()`);
    if (skills < 3) bad.push(`the skills graph shows ${skills} skills`);
    // Codex: the WHAT IT UNLOCKS module kept its sample songs whatever the
    // data said. The sample pair may never both survive binding.
    const unlocks = await b.eval(`(() => { const e = document.getElementById('path-playable'); return e ? e.textContent : ''; })()`);
    if (/River Flows in You/.test(unlocks) && /Still D\.R\.E\., full left hand/.test(unlocks)) {
      bad.push('the unlocks module is still showing the DESIGN SAMPLE songs');
    }
    const went = await clickId('path-go');
    if (went !== 'ok') bad.push('path-go does not win its own hit-test');
    await new Promise((r) => setTimeout(r, 1000));
    const where = await visible();
    if (where === 'path') bad.push('Continue did nothing: still on the path');
    // wherever it went, a person must be able to get home
    if (where !== 'library') {
      const back = await clickText('Back');
      if (back === 'ok') { await new Promise((r) => setTimeout(r, 600)); }
      await goHome(bad, `the prescription (${where})`);
    }
    return bad;
  });

  await journey('FREEZE OFFER: a broken rhythm offers a freeze, Use one keeps the run', async () => {
    const bad = [];
    await b.goto('http://localhost:4180/index.html?canon=0');
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify({
      ...SEED, freezeTokens: 1,
      days: [day(0), day(2), day(3), day(4)],   // yesterday missing; 3-day run before it
      pmin: {},
    }))}); true`);
    await boot();
    const offered = await b.eval(`(() => { const f = document.getElementById('freeze-offer'); return f && f.getBoundingClientRect().height > 0; })()`);
    if (!offered) return ['a broken 3-day rhythm produced no freeze offer on the library'];
    const wording = await text('freeze-offer');
    if (!/keep your 4 day rhythm/i.test(wording)) bad.push(`the offer does not carry the real rhythm (${JSON.stringify(wording?.slice(0, 80))})`);
    if (!/1 freeze left/i.test(wording)) bad.push(`the offer does not carry the real token count (${JSON.stringify(wording?.slice(0, 120))})`);
    if (await clickText('Use one') !== 'ok') return ['no Use one control on the offer'];
    await new Promise((r) => setTimeout(r, 800));
    const st = await state();
    if ((st.freezeTokens ?? 99) !== 0) bad.push(`using the freeze left ${st.freezeTokens} tokens, expected 0`);
    if (!(st.frozenDays ?? []).includes(day(1))) bad.push('the frozen day was not recorded');
    const still = await b.eval(`(() => { const f = document.getElementById('freeze-offer'); return f && f.getBoundingClientRect().height > 0; })()`);
    if (still) bad.push('the offer is still on screen after being used');
    return bad;
  });

  await journey('IMMERSION: a run recedes the chrome, Escape brings it back', async () => {
    const bad = [];
    await boot();
    if (await clickText('Still D.R.E.') !== 'ok') return ['no song row to open'];
    await new Promise((r) => setTimeout(r, 1200));
    if (await visible() !== 'play') return ['could not reach the play screen'];
    const wide = await b.eval(`document.getElementById('screen-play').dataset.widePlay === '1'`);
    if (!wide) return ['the wide play board is not mounted at 1418px'];
    if (await clickText('Train') !== 'ok') bad.push('no Train control on the play board');
    await new Promise((r) => setTimeout(r, 1000));
    const immersed = await b.eval(`(() => { const bd = document.getElementById('screen-play').firstElementChild; return bd.dataset.immersed === '1'; })()`);
    if (!immersed) bad.push('Train did not immerse the deck');
    const rail = await b.eval(`(() => { const r = document.querySelector('[aria-label="Show the training controls"]'); return r && getComputedStyle(r).display !== 'none'; })()`);
    if (!rail) bad.push('the CONTROLS edge rail is not showing while immersed');
    await b.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 27, key: 'Escape', code: 'Escape' });
    await new Promise((r) => setTimeout(r, 600));
    const restored = await b.eval(`(() => { const bd = document.getElementById('screen-play').firstElementChild; return bd.dataset.immersed !== '1'; })()`);
    if (!restored) bad.push('Escape did not restore the chrome');
    await goHome(bad, 'the immersed deck');
    return bad;
  });

  await journey('a COMPLETED lesson replays: the row says so, and it opens ready to run', async () => {
    const bad = [];
    await b.goto('http://localhost:4180/index.html?canon=0');
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify({
      ...SEED, lessons: { 'middle-c': { at: 1 } },
    }))}); true`);
    await boot();
    const r0 = await openTool('Lessons');
    if (r0 !== 'ok') return [r0];
    const rowState = await b.eval(`(() => {
      const list = document.getElementById('lesson-list');
      const row = list && [...list.querySelectorAll('[data-i]'), ...list.children].find((c) => /Middle C/.test(c.textContent));
      return row ? row.textContent : null;
    })()`);
    if (!rowState) return ['no Middle C row on the lessons list'];
    if (!/Replay/.test(rowState)) bad.push('the completed row does not offer Replay (' + JSON.stringify(rowState.slice(0, 60)) + ')');
    if (await clickText('Middle C and the grand staff') !== 'ok') return ['the completed row does not win its own hit-test'];
    await new Promise((r) => setTimeout(r, 900));
    if (await visible() !== 'lesson') bad.push('replaying a completed lesson did not open the lesson screen');
    const title = await text('lesson-title');
    if (!/Middle C/.test(title ?? '')) bad.push(`the replay opened the wrong lesson (${JSON.stringify(title)})`);
    if (await clickId('lesson-start') !== 'ok') bad.push('no runnable start on a replayed lesson');
    await new Promise((r) => setTimeout(r, 900));
    const steps = await b.eval(`(document.getElementById('lesson-progress')?.textContent ?? '').length`);
    if (steps < 1) bad.push('the replayed lesson did not actually start (no level rail)');
    if (await clickText('Back') !== 'ok') bad.push('no Back inside the replayed lesson');
    await new Promise((r) => setTimeout(r, 600));
    await goHome(bad, 'the replayed lesson list');
    return bad;
  });

  await journey('GALLERY: the show-more tile becomes a full-screen sleeve wall, search filters it, Escape leaves it', async () => {
    const bad = [];
    // Explore is the shelf with enough songs to overflow the grid
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify({ ...SEED, lib: { learning: true, canonTab: 'explore' } }))}); true`);
    await boot();
    const label = await b.eval(`([...document.querySelectorAll('*')]
      .map((e) => !e.children.length && e.getBoundingClientRect().width > 0 ? e.textContent.trim() : '')
      .find((t) => /^Show the other \\d+ in /.test(t)) ?? null)`);
    if (!label) return ['no "Show the other N" tile on the Explore shelf'];
    if (await clickText(label) !== 'ok') return ['the show-more tile does not win its own hit-test'];
    await new Promise((r) => setTimeout(r, 900));
    const wall = await b.eval(`(() => {
      const g = document.getElementById('canon-gallery');
      if (!g) return null;
      const titles = [...g.querySelectorAll('*')].filter((e) => !e.children.length
        && /Fraunces/.test(e.getAttribute('style') ?? '') && e.textContent.trim());
      const kicker = [...g.querySelectorAll('*')].find((e) => !e.children.length && /SONGS?$/.test(e.textContent.trim()));
      const vp = [...g.querySelectorAll('div')].find((d) => d.style.overflowY === 'auto');
      return { tiles: titles.length, kicker: kicker?.textContent.trim() ?? '',
        scrollable: vp ? vp.scrollHeight > vp.clientHeight : false };
    })()`);
    if (!wall) return ['clicking the tile opened no gallery'];
    if (wall.tiles <= 9) bad.push(`the wall shows ${wall.tiles} tiles, no more than the grid already did`);
    if (!wall.kicker.includes(String(wall.tiles))) bad.push(`the kicker (${JSON.stringify(wall.kicker)}) does not carry the real count`);
    if (!wall.scrollable) bad.push('the wall does not scroll, so most of the shelf is unreachable');
    // search, typed for real
    await b.eval(`(() => { const i = document.querySelector('#canon-gallery input'); i.focus(); return true; })()`);
    for (const ch of 'ca') await b.send('Input.dispatchKeyEvent', { type: 'char', text: ch });
    await b.eval(`(() => { const i = document.querySelector('#canon-gallery input'); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    await new Promise((r) => setTimeout(r, 400));
    const after = await b.eval(`(() => {
      const g = document.getElementById('canon-gallery');
      const vis = [...g.querySelectorAll('*')].filter((e) => !e.children.length
        && /Fraunces/.test(e.getAttribute('style') ?? '') && e.textContent.trim()
        && e.getBoundingClientRect().width > 0);
      return { shown: vis.length, sampleTitle: vis[0]?.textContent.trim() ?? null };
    })()`);
    if (after.shown === 0 || after.shown >= wall.tiles) bad.push(`typing "ca" left ${after.shown} of ${wall.tiles} tiles, no filtering happened`);
    if (after.sampleTitle && !/ca/i.test(after.sampleTitle)) bad.push(`a surviving tile (${JSON.stringify(after.sampleTitle)}) does not match the query`);
    await b.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 27, key: 'Escape', code: 'Escape' });
    await new Promise((r) => setTimeout(r, 500));
    const out = await b.eval(`({ gone: !document.getElementById('canon-gallery'), lib: !document.getElementById('screen-library')?.hidden })`);
    if (!out.gone) bad.push('Escape did not close the gallery');
    if (!out.lib) bad.push('leaving the gallery lost the library');
    // back in, and a tile opens its song for real
    if (await clickText(label) !== 'ok') bad.push('the show-more tile died after one use');
    await new Promise((r) => setTimeout(r, 900));
    const first = await b.eval(`([...document.querySelectorAll('#canon-gallery *')]
      .filter((e) => !e.children.length && /Fraunces/.test(e.getAttribute('style') ?? '') && e.textContent.trim())[0]?.textContent.trim() ?? null)`);
    if (!first) { bad.push('no tile to open on the second visit'); return bad; }
    if (await clickText(first) !== 'ok') bad.push('the first sleeve does not win its own hit-test');
    await new Promise((r) => setTimeout(r, 1200));
    if (await visible() !== 'play') bad.push('clicking a sleeve did not open the song');
    await b.eval(`(document.getElementById('canon-gallery')?.remove(), window.__show('library'), true)`);
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
    return bad;
  });

  await journey('CHUNKS: Next from "Chunks off" lands on a real numbered chunk, never NaN', async () => {
    const bad = [];
    await boot();
    if (await clickText('Still D.R.E.') !== 'ok') return ['no library row for the seeded song'];
    await new Promise((r) => setTimeout(r, 1300));
    if (await visible() !== 'play') return ['the song did not open'];
    await b.eval(`(document.getElementById('chunk-next')?.click(), true)`);
    await new Promise((r) => setTimeout(r, 500));
    const lab = await b.eval(`(document.getElementById('chunk-label')?.textContent ?? '').trim()`);
    // the NaN class: the canon select's word values fed +value (Codex 2026-08-29)
    if (!/^Chunk \d+ \/ \d+$/.test(lab.replace(/^[^A-Za-z0-9]+/, ''))) bad.push(`chunk-next produced ${JSON.stringify(lab)}`);
    const wide = await b.eval(`(document.getElementById('cp-chunk')?.textContent ?? '').trim()`);
    if (wide && /NaN/.test(wide)) bad.push(`the wide readout mirrors NaN (${JSON.stringify(wide)})`);
    await b.eval(`(document.getElementById('chunk-label')?.click(), true)`);
    await goHome(bad, 'the chunk run');
    return bad;
  });

  await journey('HEAR IT: the drawn desktop button says Stop while the demo runs, and comes back', async () => {
    const bad = [];
    await boot();
    if (await clickText('Still D.R.E.') !== 'ok') return ['no library row for the seeded song'];
    await new Promise((r) => setTimeout(r, 1300));
    const drawn = () => b.eval(`(document.querySelector('[data-proxy-for="btn-hear"]')?.textContent ?? '').trim()`);
    if (await drawn() !== 'Hear it') return [`no drawn Hear it proxy (reads ${JSON.stringify(await drawn())})`];
    if (await clickText('Hear it') !== 'ok') return ['Hear it does not win its own hit-test'];
    await new Promise((r) => setTimeout(r, 900));
    const during = await drawn();
    if (during !== 'Stop') bad.push(`the drawn button conceals the running demo (reads ${JSON.stringify(during)})`);
    if (during === 'Stop' && await clickText('Stop') !== 'ok') bad.push('the Stop state does not win its own hit-test');
    await new Promise((r) => setTimeout(r, 600));
    if (await drawn() !== 'Hear it') bad.push(`stopping did not restore the resting word (reads ${JSON.stringify(await drawn())})`);
    await goHome(bad, 'the demo');
    return bad;
  });

  await journey('TASK: a chord build shows its symbol, fills note cells on taps, and counts the round', async () => {
    const bad = [];
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify({
      ...SEED, diagnosticDone: 1, mastery: { 'chord-symbol': { stage: 'independent', evidence: [], lastTested: 1, dueAt: 1 } }, teacherLessons: {},
    }))}); true`);
    await boot();
    const r0 = await openTool('My path');
    if (r0 !== 'ok') return [r0];
    if (await clickId('path-go') !== 'ok') return ['path-go does not win its own hit-test'];
    await new Promise((r) => setTimeout(r, 2200));
    if (await visible() !== 'task') return ['the due chord skill did not open the task screen'];
    // pre-start: no drawn specimen may be talking
    const bleed = await b.eval(`(['Root position, left hand alone', 'That was a G sharp']
      .filter((s) => document.getElementById('screen-task').textContent.includes(s)))`);
    if (bleed.length) bad.push('drawn samples still visible pre-start: ' + JSON.stringify(bleed));
    await b.eval(`(() => {
      const l = [...document.querySelectorAll('*')].find((e) => !e.children.length && /Continue|Start/.test(e.textContent) && e.getBoundingClientRect().width > 0 && e.closest('button'));
      l?.closest('button')?.click(); return true;
    })()`);
    await new Promise((r) => setTimeout(r, 1500));
    const stage = await b.eval(`(() => {
      const sheet = document.getElementById('task-sheet');
      const wm = sheet && [...sheet.querySelectorAll('*')].find((e) => !e.children.length && /150px/.test(e.getAttribute('style') ?? ''));
      const cells = [...document.getElementById('task-slots').children].map((c) => c.textContent.trim());
      const round = [...document.querySelectorAll('#screen-task *')].filter((e) => !e.children.length && /^(Clean|Helped|Open)$/.test(e.textContent.trim())).length;
      const line = [...document.querySelectorAll('#screen-task *')].find((e) => !e.children.length && /clean builds banked$/.test(e.textContent.trim()));
      return { wm: wm?.textContent.trim() ?? null, cells, round, line: line?.textContent.trim() ?? null };
    })()`);
    if (!stage.wm) bad.push('the working area shows no watermark symbol');
    if (!stage.cells.length || !stage.cells.every((c) => c === 'empty')) bad.push(`fresh build cells wrong: ${JSON.stringify(stage.cells)}`);
    if (stage.round < 3) bad.push('THIS ROUND module missing its cells');
    if (!/^0 of \d+ clean builds banked$/.test(stage.line ?? '')) bad.push(`round line wrong: ${JSON.stringify(stage.line)}`);
    // a real tap on the drawn keys fills a note cell
    await b.eval(`(() => {
      const c = document.getElementById('task-keys');
      const r = c.getBoundingClientRect();
      c.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + r.width * 0.2, clientY: r.bottom - 20, bubbles: true }));
      return true;
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    const after = await b.eval(`([...document.getElementById('task-slots').children].map((c) => c.textContent.trim()))`);
    if (!after.some((c) => c !== 'empty' && c.length)) bad.push(`a tapped key filled no note cell: ${JSON.stringify(after)}`);
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
    return bad;
  });

  await journey('PLAY PARITY: tempo, Wait for me, Note letters and Section all drive the engine', async () => {
    const bad = [];
    // See You Again has a defined song JOURNEY, so the strip assertion fires
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify({
      ...SEED, songs: { ...SEED.songs, 'see-you-again-easy': { plays: 2, stars: 0, best: 40 } },
    }))}); true`);
    await boot();
    if (await clickText('See You Again') !== 'ok') return ['no library row for the seeded song'];
    await new Promise((r) => setTimeout(r, 1500));
    if (await visible() !== 'play') return ['the song did not open'];
    // TEMPO: the drawn range drives the engine (dead until 2026-08-30)
    const t = await b.eval(`(() => {
      const drawn = document.querySelector('input[type="range"][data-proxy-for="tempo"]');
      if (!drawn || drawn.getBoundingClientRect().width < 10) return null;
      drawn.value = '60';
      drawn.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    if (!t) bad.push('no wired drawn tempo slider on the wide board');
    await new Promise((r) => setTimeout(r, 500));
    const tempoState = await b.eval(`({ engine: window.__engine?.tempo, pct: document.getElementById('cp-tempo-pct')?.textContent ?? null })`);
    if (tempoState.engine !== 0.6) bad.push(`dragging the drawn tempo left the engine at ${JSON.stringify(tempoState.engine)}`);
    if (tempoState.pct !== '60%') bad.push(`the tempo readout says ${JSON.stringify(tempoState.pct)}, expected "60%"`);
    // WAIT FOR ME: the drawn row flips the real checkbox and its printed word
    const wait0 = await b.eval(`document.getElementById('wait-mode').checked`);
    if (await clickText('Wait for me') !== 'ok') bad.push('Wait for me does not win its own hit-test');
    await new Promise((r) => setTimeout(r, 400));
    const wait1 = await b.eval(`(() => {
      const row = document.querySelector('[data-reflects="wait-mode"]');
      const word = row && [...row.querySelectorAll('*')].find((e) => !e.children.length && /^(on|off)$/.test(e.textContent.trim()));
      return { checked: document.getElementById('wait-mode').checked, word: word?.textContent.trim() ?? null };
    })()`);
    if (wait1.checked === wait0) bad.push('the Wait for me row did not flip the real checkbox');
    if (wait1.word !== (wait1.checked ? 'on' : 'off')) bad.push(`Wait for me prints ${JSON.stringify(wait1.word)} while the checkbox is ${wait1.checked}`);
    // NOTE LETTERS: same contract
    const let0 = await b.eval(`document.getElementById('chk-letters').checked`);
    if (await clickText('Note letters') !== 'ok') bad.push('Note letters does not win its own hit-test');
    await new Promise((r) => setTimeout(r, 400));
    const let1 = await b.eval(`document.getElementById('chk-letters').checked`);
    if (let1 === let0) bad.push('the Note letters row did not flip the real checkbox');
    // SECTION: choosing a section loops the engine
    const sec = await b.eval(`(() => {
      const sels = [...document.querySelectorAll('#screen-play select')].filter((s) => s.getBoundingClientRect().width > 0);
      const sec9 = sels.find((s) => [...s.options].some((o) => /bars/i.test(o.text) || /Section|Whole/i.test(o.text)));
      if (!sec9) return null;
      const opt = [...sec9.options].find((o) => o.value !== '');
      if (!opt) return 'NO SECTIONS';
      sec9.value = opt.value;
      sec9.dispatchEvent(new Event('change', { bubbles: true }));
      return opt.text;
    })()`);
    if (!sec) bad.push('no visible section select on the wide board');
    else if (sec !== 'NO SECTIONS') {
      await new Promise((r) => setTimeout(r, 600));
      const loop = await b.eval(`(window.__engine?.loop ? 'looped' : 'whole')`);
      if (loop !== 'looped') bad.push(`choosing section ${JSON.stringify(sec)} set no engine loop`);
    }
    // PERFORMANCE RUN: drawn and wired (missing until 2026-08-30)
    const perf = await b.eval(`(() => { const c = document.querySelector('[data-proxy-for="btn-perf"]'); return c ? c.getBoundingClientRect().width > 0 : false; })()`);
    if (!perf) bad.push('no visible Performance run control on the wide board');
    // CHUNK SIZE + the OFF toggle
    await b.eval(`(document.getElementById('chunk-next')?.click(), true)`);
    await new Promise((r) => setTimeout(r, 400));
    const size = await b.eval(`(() => {
      const drawn = document.querySelector('select[data-proxy-for="chunk-size"]');
      if (!drawn || drawn.getBoundingClientRect().width < 5) return null;
      const opt = [...drawn.options].find((o) => (o.value || o.text).startsWith('4'));
      drawn.value = opt.value;
      drawn.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!size) bad.push('no visible chunk size select on the wide board');
    await new Promise((r) => setTimeout(r, 400));
    const lab = await b.eval(`(document.getElementById('chunk-label')?.textContent ?? '').trim()`);
    if (!/^Chunk \d+ \/ \d+$/.test(lab.replace(/^[^A-Za-z0-9]+/, ''))) bad.push(`chunk size change broke the label (${JSON.stringify(lab)})`);
    const off = await b.eval(`(() => { const c = document.querySelector('[data-proxy-for="chunk-label"]'); if (!c) return null; c.click(); return true; })()`);
    await new Promise((r) => setTimeout(r, 400));
    const lab2 = await b.eval(`(document.getElementById('chunk-label')?.textContent ?? '').trim().replace(/^[^A-Za-z]+/, '')`);
    if (!off) bad.push('no drawn way to turn chunk looping OFF');
    else if (lab2 !== 'Chunks off') bad.push(`the chunk toggle did not turn chunks off (${JSON.stringify(lab2)})`);
    // NOTE STYLE flips the legacy seg (colour-blind law: the words move)
    const ns0 = await b.eval(`document.querySelector('#notestyle-seg .seg-btn[data-on="true"]')?.textContent.trim()`);
    const nsC = await b.eval(`(() => { const c = document.querySelector('[data-proxy-for="notestyle-seg"]'); if (!c || c.getBoundingClientRect().width < 5) return null; c.click(); return true; })()`);
    await new Promise((r) => setTimeout(r, 400));
    const ns1 = await b.eval(`document.querySelector('#notestyle-seg .seg-btn[data-on="true"]')?.textContent.trim()`);
    if (!nsC) bad.push('no visible Note style control on the wide board');
    else if (ns1 === ns0) bad.push('the Note style row did not flip the legacy segment');
    // JOURNEY strip mirrors the legacy ladder when the song has one
    const jz = await b.eval(`(() => {
      const legacy = document.getElementById('journey-strip');
      const kick = [...document.querySelectorAll('#screen-play *')].find((e) => !e.children.length && e.textContent.trim() === 'JOURNEY');
      const legacySteps = legacy && !legacy.hidden ? legacy.querySelectorAll('.j-step').length : 0;
      if (!legacySteps) return { skip: true };
      if (!kick || kick.getBoundingClientRect().width < 1) return { skip: false, drawn: 0, legacySteps };
      const row = kick.parentElement;
      return { skip: false, legacySteps,
        drawn: [...row.children].filter((c) => c.tagName === 'SPAN' && c !== kick && c.querySelector('i')).length };
    })()`);
    if (!jz.skip && jz.drawn !== jz.legacySteps) bad.push(`the drawn journey shows ${jz.drawn} steps, the app has ${jz.legacySteps}`);
    await goHome(bad, 'the play parity checks');
    await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
    return bad;
  });

  await journey('the plain url IS the new design, and ?canon=0 still gets the old one', async () => {
    const bad = [];
    await b.goto('http://localhost:4180/index.html');
    await new Promise((r) => setTimeout(r, 1500));
    if (await b.eval(`document.querySelectorAll('.canon-root').length`) === 0) {
      bad.push('the plain url does not serve the redesign');
    }
    await b.goto('http://localhost:4180/index.html?canon=0');
    await new Promise((r) => setTimeout(r, 1500));
    if (await b.eval(`document.querySelectorAll('.canon-root').length`) > 0) {
      bad.push('?canon=0 no longer falls back to the old app, so there is no way back');
    }
    return bad;
  });
} finally { await b.close(); }

let failed = 0;
for (const r of results) {
  const ok = r.problems.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.name}`);
  for (const p of r.problems) console.log(`        ${p}`);
}
console.log(`\n${results.length - failed}/${results.length} journeys end where they should, with the state they should`);
process.exit(failed ? 1 : 0);
