// DOES "HEAR IT" START WHERE YOU DRAGGED THE PRACTICE BAR TO?
//
// Mark, 2026-09-13: "when i drag it to a time and it has restart at (whatever
// time it is i dragged it too) i want to be able to go listen or hear it and it
// plays from where i dragged it to and not the start off the song?"
//
// Dragging the practice bar sets a start beat, the Restart button renames
// itself "Restart from 0:14", and pressing Restart really does begin there
// (the engine is rebuilt with loop.start). "Hear it" was the one control that
// never read that number: its range chain knew about a correction, the first
// minute, a chunk and a section, and nothing else, so the demo always rebuilt
// from beat 0 of the whole song.
//
// This probe refuses to ask the app what it INTENDED. It drags the bar with
// real pointer events the way Mark does, reads the practice engine's own
// startBeat, then presses Hear it and asserts the DEMO engine starts at the
// same beat and that its first note is not the song's first note.
//
//   node tools/hear-from-seek-probe.mjs
import { launch } from './cdp.mjs';

const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 0,
  days: [], pmin: {},
  songs: { 'fur-elise': { plays: 79, stars: 3, best: 96 }, 'jaws-easy': { plays: 12, stars: 2, best: 88 } },
  lessons: {}, lib: { learning: true },
};

// The seek quantises to a beat, so demo and practice agree exactly or not at all.
const SLACK = 0.01;

// Point at another tree with PORT=xxxx (the gates run against the serving copy).
const BASE = 'http://localhost:' + (process.env.PORT || 4180) + '/index.html';
// The AudioContext clock stays frozen without this, so the demo never starts.
const b = await launch({ width: 1418, height: 900, scale: 1, port: 9694, extraArgs: ['--autoplay-policy=no-user-gesture-required'] });
const fails = [];
const click = async (x, y) => {
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await b.goto(BASE + '?canon=0');
  await b.eval('localStorage.setItem("keys-v1", ' + JSON.stringify(JSON.stringify(SEED)) + '); true');
  await b.goto(BASE + '?canon=1');
  await wait(1800);

  // A real hit-tested click, never el.click(): a synthetic click does not
  // hit-test and "succeeds" on a covered element, so nothing opens.
  const hit = (label) => '(() => {'
    + ' const want = ' + JSON.stringify(label) + ';'
    + ' const ms = [...document.querySelectorAll("*")].filter((e) => !e.children.length'
    + '   && e.textContent.trim() === want && e.getBoundingClientRect().width > 0);'
    + ' for (const el of ms.reverse()) {'
    + '   const h = el.closest("button, a, [role=\'button\']") || el;'
    + '   const r = h.getBoundingClientRect();'
    + '   const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);'
    + '   const top = document.elementFromPoint(cx, cy);'
    + '   if (top && (top === h || h.contains(top) || top.contains(h))) return { x: Math.round(cx), y: Math.round(cy) };'
    + ' }'
    + ' return null;'
    + '})()';

  let pt = null;
  for (const label of ['Fur Elise', 'Für Elise', 'Jaws', 'Still D.R.E.']) {
    pt = await b.eval(hit(label));
    if (pt) { console.log('opening ' + JSON.stringify(label)); break; }
  }
  if (!pt) { console.log('FAIL: no song row to open'); process.exit(1); }
  await click(pt.x, pt.y);
  await wait(1400);

  const armed = JSON.parse(await b.eval('(() => {'
    + ' const f = window.__falls, e = window.__engine;'
    + ' return JSON.stringify({ seekable: !!(f && f.seekable), hasSeek: !!(f && typeof f.onSeek === "function"),'
    + '   start: e ? e.startBeat : null, end: e ? e.endBeat : null });'
    + '})()'));
  console.log('practice armed: seekable=' + armed.seekable + ' onSeek=' + armed.hasSeek + ' range=' + armed.start + '..' + armed.end);
  if (!armed.seekable || !armed.hasSeek) { console.log('FAIL: the practice bar is not draggable before any watch'); process.exit(1); }

  // ---- drag the practice bar to 45% with real pointer events ----
  const g = JSON.parse(await b.eval('(() => {'
    + ' const r = document.getElementById("falls").getBoundingClientRect();'
    + ' return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height });'
    + '})()'));
  const barY = Math.round(g.y + 12);
  const xAt = (f) => Math.round(g.x + 14 + (g.w - 28) * f);
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: xAt(0.1), y: barY, buttons: 0 });
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: xAt(0.1), y: barY, button: 'left', buttons: 1, clickCount: 1 });
  await wait(60);
  if (await b.eval('!!(window.__falls && window.__falls._scrub != null)') !== true)
    fails.push('pressing the practice bar did not start a drag');
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: xAt(0.45), y: barY, buttons: 1 });
  await wait(60);
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: xAt(0.45), y: barY, button: 'left', clickCount: 1 });
  await wait(900);

  const after = JSON.parse(await b.eval('(() => {'
    + ' const e = window.__engine, btn = document.getElementById("btn-restart");'
    + ' return JSON.stringify({ start: e ? +e.startBeat.toFixed(3) : null, end: e ? e.endBeat : null,'
    + '   label: btn ? btn.textContent.trim() : null });'
    + '})()'));
  console.log('after the drag: practice starts at beat ' + after.start + ' of ' + after.end
    + '; the button reads ' + JSON.stringify(after.label));
  if (!(after.start > 0)) { console.log('FAIL: the drag did not move the practice start off beat 0'); process.exit(1); }
  if (!/^Restart from \d+:\d\d$/.test(after.label || ''))
    fails.push('the Restart button does not name the chosen time (reads ' + JSON.stringify(after.label) + ')');

  // ---- now press Hear it: the whole point ----
  // Free listening is an override, so its disclosure has to be opened with a
  // real click first; without it the label matches a 0x0 control and the
  // handler never runs (that is how this probe first "failed" for the wrong
  // reason).
  const adjust = await b.eval(hit('Adjust practice'));
  if (!adjust) { console.log('FAIL: no Adjust practice control'); process.exit(1); }
  await click(adjust.x, adjust.y);
  await wait(400);
  let hp = null;
  for (const label of ['Hear it', '▶ Hear it']) { hp = await b.eval(hit(label)); if (hp) break; }
  if (!hp) { console.log('FAIL: no "Hear it" control on the play screen'); process.exit(1); }
  await click(hp.x, hp.y);
  await wait(1500);

  const demo = JSON.parse(await b.eval('(() => {'
    + ' const d = window.__demo, f = window.__falls;'
    + ' if (!d) return JSON.stringify({ demo: false });'
    + ' const inRange = d.song.notes.filter((n) => n.b >= d.startBeat && n.b < d.endBeat).map((n) => n.b);'
    + ' return JSON.stringify({ demo: true, start: +d.startBeat.toFixed(3), end: +d.endBeat.toFixed(1),'
    + '   firstOnset: +Math.min(...inRange).toFixed(3),'
    + '   songFirst: +Math.min(...d.song.notes.map((n) => n.b)).toFixed(3),'
    + '   transport: (f && f.transport) ? { start: +f.transport.start.toFixed(3), end: +f.transport.end.toFixed(1) } : null });'
    + '})()'));
  if (!demo.demo) { console.log('FAIL: the demo never started'); process.exit(1); }
  console.log('Hear it: the demo runs ' + demo.start + '..' + demo.end + ', its first note is at beat '
    + demo.firstOnset + ' (the song\'s own first note is at ' + demo.songFirst + ')');

  if (Math.abs(demo.start - after.start) > SLACK)
    fails.push('Hear it ignored the chosen position: the practice bar is at beat ' + after.start + ' but the demo starts at ' + demo.start);
  if (demo.firstOnset <= demo.songFirst + SLACK)
    fails.push('the demo\'s first note is the song\'s own first note (beat ' + demo.firstOnset + '): it played from the beginning');
  if (demo.end < after.end - SLACK)
    fails.push('the demo stops short of the song\'s end (' + demo.end + ' < ' + after.end + ')');
  if (demo.transport && Math.abs(demo.transport.start - after.start) > SLACK)
    fails.push('the scrub bar re-based to ' + demo.transport.start + ' instead of the chosen ' + after.start);

  // ---- and stopping the watch must leave the chosen position alone ----
  let sp = null;
  for (const label of ['■ Stop', 'Stop']) { sp = await b.eval(hit(label)); if (sp) break; }
  if (!sp) {
    fails.push('no Stop control while watching');
  } else {
    await click(sp.x, sp.y);
    await wait(900);
    const back = JSON.parse(await b.eval('(() => {'
      + ' const e = window.__engine, btn = document.getElementById("btn-restart");'
      + ' return JSON.stringify({ start: e ? +e.startBeat.toFixed(3) : null, label: btn ? btn.textContent.trim() : null });'
      + '})()'));
    console.log('after Stop: practice still starts at beat ' + back.start + ', the button reads ' + JSON.stringify(back.label));
    if (Math.abs((back.start === null ? -1 : back.start) - after.start) > SLACK)
      fails.push('stopping the watch threw the chosen position away (' + back.start + ' instead of ' + after.start + ')');
  }
} finally {
  await b.close();
}

if (fails.length) { for (const f of fails) console.log('FAIL: ' + f); process.exit(1); }
console.log('PASS: Hear it plays from the position you dragged to, and stopping keeps it');
