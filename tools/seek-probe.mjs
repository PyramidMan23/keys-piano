// DOES THE SCRUB BAR SEEK, AND DO PICTURE AND SOUND STILL AGREE AFTERWARDS?
//
// Mark, 2026-08-31: "when we're listening/watching a song getting played can we
// move this bar up top like on vlc or a media app and skip forward or back in
// that song and have the video/music match?"
//
// The last clause is the whole job, and it is the part a naive seek gets wrong.
// Watching runs TWO clocks that are started together and never speak again:
//
//   the ENGINE counts beats  -> drives the falls, the keyboard, the bar
//   the SCHEDULER counts seconds from its own t0 -> drives the audio
//
// Nothing reconciles them. Move one and the app does not seek, it desyncs, and
// the failure is quiet: both halves keep running, each perfectly consistent
// with itself, just describing different moments of the song. You would only
// catch it by ear.
//
// So this probe refuses to ask either clock about itself. It reads the beat off
// the ENGINE and the lit keys off the SCHEDULER (falls.keyDown is called from
// the audio callback, nowhere else) and asserts they describe the same bar of
// music. That is a cross-clock check; "engine.beat moved" would pass while the
// sound played on from the old spot.
//
//   node tools/seek-probe.mjs
import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const SHOT = process.argv[2] || 'seek.png';

// ☠️ SEEK INTO A REST, NOT INTO A BUSY BAR. The drift the anchor prevents is
// exactly the silence you land in, so on a dense piece there is nothing to
// measure: Für Elise's largest gap between notes is HALF A BEAT, so a broken
// anchor lands within the slack and the probe passes while desynced. This ran
// green against deliberately broken code before that was noticed. Jaws opens on
// an 18-beat rest, which is why it is the fixture.
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5, calOffsetMs: 0,
  days: [], pmin: {},
  songs: {
    'jaws-easy': { plays: 12, stars: 2, best: 88 },
    'fur-elise': { plays: 79, stars: 3, best: 96 },
    'still-dre-easy': { plays: 22, stars: 3, best: 91 },
  },
  lessons: {}, lib: { learning: true },
};

// How far a note's onset may sit from the engine's beat. The scheduler leads by
// 120ms and is sampled a frame late, so this is never zero; a beat is generous
// for that and still an eighth of the drift a missing anchor produces here.
const DRIFT_MAX = 1.0;

const b = await launch({ width: 1418, height: 900, scale: 1, port: 9692 });
const fails = [];
const click = async (x, y) => {
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1800));

  // ☠️ A REAL HIT-TESTED CLICK, never el.click() - a synthetic click does not
  // hit-test and "succeeds" on an element that is covered, so nothing opens.
  const hit = (label) => `(() => {
    const ms = [...document.querySelectorAll('*')].filter((e) => !e.children.length
      && e.textContent.trim() === ${JSON.stringify(label)} && e.getBoundingClientRect().width > 0);
    for (const el of ms.reverse()) {
      const h = el.closest('button, a, [role="button"]') || el;
      const r = h.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + Math.min(r.height / 2, 20);
      const top = document.elementFromPoint(cx, cy);
      if (top && (top === h || h.contains(top) || top.contains(h))) return { x: Math.round(cx), y: Math.round(cy) };
    }
    return null;
  })()`;

  let pt = null;
  for (const label of ['Jaws', 'Für Elise', 'Still D.R.E.', 'Start']) {
    pt = await b.eval(hit(label));
    if (pt) { console.log(`opening ${JSON.stringify(label)}`); break; }
  }
  if (!pt) { console.log('FAIL: no song row to open'); process.exit(1); }
  await click(pt.x, pt.y);
  await new Promise((r) => setTimeout(r, 1300));

  // press Hear it.
  // ☠️ THE CANON'S TWIN, NOT `#btn-hear`. Under the canon the addressed button
  // is 0x0 and a drawn twin with no id carries the label, so it reads "Hear it"
  // with no play glyph. Matching the legacy text finds a control of zero size
  // and clicks nothing.
  let hp = null;
  for (const label of ['Hear it', '▶ Hear it']) { hp = await b.eval(hit(label)); if (hp) break; }
  if (!hp) { console.log('FAIL: no "Hear it" control on the play screen'); process.exit(1); }
  await click(hp.x, hp.y);
  await new Promise((r) => setTimeout(r, 1500));

  const armed = await b.eval(`(() => {
    const f = window.__falls, d = window.__demo;
    return JSON.stringify({ seekable: !!f?.seekable, hasSeek: typeof f?.onSeek === 'function',
      demo: !!d, beat: d ? +d.beat.toFixed(2) : null,
      start: d ? d.startBeat : null, end: d ? +d.endBeat.toFixed(1) : null });
  })()`);
  const a = JSON.parse(armed);
  console.log(`watching: seekable=${a.seekable} onSeek=${a.hasSeek} beat=${a.beat} range=${a.start}..${a.end}`);
  if (!a.demo) { console.log('FAIL: the demo never started'); process.exit(1); }
  if (!a.seekable || !a.hasSeek) fails.push('the bar is not armed for scrubbing while watching');
  // the song's true length, read BEFORE any seek can re-base anything
  const fullS = Math.round(+(await b.eval(`(window.__demo.endBeat - window.__demo.startBeat) * window.__demo.msPerBeat() / 1000`)));
  console.log(`the whole watch is ${fullS}s`);

  // ---- drag the bar to 62% with real pointer events ----
  const geo = await b.eval(`(() => {
    const c = document.getElementById('falls');
    const r = c.getBoundingClientRect();
    return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height });
  })()`);
  const g = JSON.parse(geo);

  // Aim at a REST, and stop 3 beats short of its far edge.
  //
  // Land mid-rest and a correct app plays nothing for seconds, so there is
  // nothing to sample; land in a busy bar and a BROKEN one drifts by less than
  // the slack, so nothing fails. Three beats before the rest ends gives both:
  // a correct anchor holds those 3 beats of silence and then plays in step,
  // while a missing one fires that note the instant you release the handle,
  // 3 beats early, which is triple the tolerance and cannot hide.
  const aim = JSON.parse(await b.eval(`(() => {
    const d = window.__demo;
    const beats = [...new Set(d.song.notes.filter((n) => n.b >= d.startBeat && n.b < d.endBeat)
      .map((n) => n.b))].sort((x, y) => x - y);
    let gap = 0, endsAt = null;
    for (let i = 1; i < beats.length; i++) {
      if (beats[i] - beats[i - 1] > gap) { gap = beats[i] - beats[i - 1]; endsAt = beats[i]; }
    }
    const span = d.endBeat - d.startBeat;
    if (gap < 5) return JSON.stringify({ gap, frac: 0.62, weak: true });
    return JSON.stringify({ gap: +gap.toFixed(2), endsAt, weak: false,
      frac: (endsAt - 3 - d.startBeat) / span });
  })()`));
  const TARGET = Math.max(0.02, Math.min(0.98, aim.frac));
  console.log(aim.weak
    ? `⚠ this song's largest rest is ${aim.gap} beats, too short to prove the anchor; seeking to 62% instead`
    : `aiming into the ${aim.gap}-beat rest that ends at beat ${aim.endsAt}: seek to ${(TARGET * 100).toFixed(1)}%`);
  const barY = Math.round(g.y + 12);
  const xAt = (f) => Math.round(g.x + 14 + (g.w - 28) * f);
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: xAt(0.2), y: barY, buttons: 0 });
  await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: xAt(0.2), y: barY, button: 'left', buttons: 1, clickCount: 1 });
  await new Promise((r) => setTimeout(r, 60));
  const dragging = await b.eval(`window.__falls && window.__falls._scrub != null`);
  if (dragging !== true) fails.push('pressing the bar did not start a drag (the hit band never caught it)');
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: xAt(TARGET), y: barY, buttons: 1 });
  await new Promise((r) => setTimeout(r, 60));
  await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: xAt(TARGET), y: barY, button: 'left', clickCount: 1 });
  await new Promise((r) => setTimeout(r, 260));

  const after = JSON.parse(await b.eval(`(() => {
    const d = window.__demo, f = window.__falls;
    return JSON.stringify({ beat: d ? +d.beat.toFixed(2) : null, start: d ? d.startBeat : null,
      end: d ? +d.endBeat.toFixed(1) : null, scrub: f ? f._scrub : 'no view' });
  })()`));
  const wantBeat = a.start + (a.end - a.start) * TARGET;
  console.log(`seeked to ${Math.round(TARGET * 100)}%: engine beat ${after.beat} (wanted ~${wantBeat.toFixed(1)})`);
  if (after.beat == null) fails.push('the demo died during the seek');
  else if (Math.abs(after.beat - wantBeat) > (a.end - a.start) * 0.06) {
    fails.push(`the seek missed: beat ${after.beat}, wanted ~${wantBeat.toFixed(1)}`);
  }
  if (after.scrub !== null) fails.push('the drag was never released (the bar would paint at the old finger)');

  // ☠️ AND NOW ASK THE BAR, not the engine. Both readings above come from
  // engine internals, and the engine was right the whole time the DRAWN bar was
  // wrong: seeking re-based engine.startBeat, so the handle snapped back toward
  // zero and the total time became the time REMAINING. Every number agreed with
  // every other number and the only thing that disagreed was the picture.
  const drawn = JSON.parse(await b.eval(`(() => {
    const f = window.__falls, d = window.__demo;
    if (!f || !d) return JSON.stringify({ err: 'no view' });
    const tr = f.transport;
    if (!tr) return JSON.stringify({ err: 'the bar has no range to span' });
    const span = tr.end - tr.start;
    return JSON.stringify({ handle: +((d.beat - tr.start) / span).toFixed(3),
      totalS: Math.round((span * d.msPerBeat()) / 1000) });
  })()`));
  if (drawn.err) fails.push(drawn.err);
  else {
    console.log(`the bar itself: handle at ${(drawn.handle * 100).toFixed(1)}%, total ${drawn.totalS}s`);
    if (Math.abs(drawn.handle - TARGET) > 0.05) {
      fails.push(`the drawn handle sits at ${(drawn.handle * 100).toFixed(1)}% after seeking to`
        + ` ${(TARGET * 100).toFixed(1)}%: the bar re-scaled itself to the remaining song`);
    }
    if (Math.abs(drawn.totalS - fullS) > 2) {
      fails.push(`the bar says the song is ${drawn.totalS}s long, but it was ${fullS}s before the seek`);
    }
  }

  // ---- THE CROSS-CLOCK CHECK ----
  // engine.beat comes from the engine; falls.pressed is filled ONLY by the
  // audio scheduler's callback. If a lit key belongs to a part of the song the
  // engine is nowhere near, picture and sound have come apart.
  const verdict = JSON.parse(await b.eval(`(async () => {
    const f = window.__falls, d = window.__demo;
    if (!f || !d) return JSON.stringify({ err: 'demo gone before sampling' });
    const notes = d.song.notes;
    // ☠️ MEASURE ONSETS, NOT WHAT IS HELD DOWN. "is a note of this pitch
    // sounding near this beat" is far too kind: Jaws' notes are long, so a
    // sustain window plus a beat of slack swallows several beats of drift and
    // the check passes against code that is provably desynced (it did). The
    // moment a key LIGHTS is a hard edge, and it either lands on that note's
    // beat or it does not.
    const onsets = [];
    let prev = new Set();
    // by TIME, not by frame count: the seek deliberately lands in silence, and
    // a fixed frame budget can expire before the first note is due and report
    // "the audio never started" for an app behaving perfectly
    const until = performance.now() + 6000;
    while (performance.now() < until && onsets.length < 24) {
      await new Promise((r) => requestAnimationFrame(r));
      const dd = window.__demo;
      if (!dd) break;
      const now = new Set(f.pressed.keys());
      for (const m of now) if (!prev.has(m)) onsets.push({ beat: dd.beat, m });
      prev = now;
    }
    // each onset should land on a note of that pitch AT the engine's beat
    let worst = 0, sum = 0;
    for (const s of onsets) {
      let best = Infinity;
      for (const n of notes) if (n.m === s.m) best = Math.min(best, Math.abs(n.b - s.beat));
      if (best === Infinity) continue;
      worst = Math.max(worst, best);
      sum += best;
    }
    return JSON.stringify({ samples: onsets.length, worst: +worst.toFixed(2),
      mean: onsets.length ? +(sum / onsets.length).toFixed(2) : null,
      beat: +(window.__demo?.beat ?? -1).toFixed(2) });
  })()`));
  if (verdict.err) fails.push(verdict.err);
  else {
    console.log(`cross-clock: ${verdict.samples} note onsets, off by ${verdict.mean} beats on average,`
      + ` ${verdict.worst} at worst`);
    if (!verdict.samples) {
      // audio never spoke: cannot judge the marriage either way, so say so
      console.log('  (no key ever lit - the audio context never started in this browser)');
      fails.push('the scheduler lit no keys after the seek, so the match is unproven');
    } else if (verdict.worst > DRIFT_MAX) {
      fails.push(`picture and sound came apart by ${verdict.worst} beats after the seek`
        + ` (mean ${verdict.mean}): the audio is playing a different bar from the falls`);
    }
    if (verdict.beat <= after.beat) fails.push('the song stopped advancing after the seek');
  }

  // a picture of the bar mid-watch, so the thing can be LOOKED at and not only
  // asserted about
  const png = await b.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(SHOT, Buffer.from(png.data, 'base64'));
  console.log(`wrote ${SHOT}`);

  // ---- ← / → skip ----
  const beforeSkip = +(await b.eval(`window.__demo ? window.__demo.beat : -1`));
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
  await new Promise((r) => setTimeout(r, 300));
  const afterSkip = +(await b.eval(`window.__demo ? window.__demo.beat : -1`));
  console.log(`ArrowLeft: beat ${beforeSkip.toFixed(1)} -> ${afterSkip.toFixed(1)}`);
  if (!(afterSkip < beforeSkip - 0.5)) fails.push('ArrowLeft did not skip back');

  // ---- and the handle must NOT survive into practice ----
  let sp = null;
  for (const label of ['■ Stop', 'Stop', 'Hear it']) { sp = await b.eval(hit(label)); if (sp) break; }
  if (sp) await click(sp.x, sp.y);
  await new Promise((r) => setTimeout(r, 700));
  const rest = JSON.parse(await b.eval(`(() => {
    const f = window.__falls;
    return JSON.stringify({ seekable: !!f?.seekable, onSeek: typeof f?.onSeek === 'function', demo: !!window.__demo });
  })()`));
  console.log(`after stop: seekable=${rest.seekable} onSeek=${rest.onSeek}`);
  if (rest.seekable || rest.onSeek) {
    fails.push('the scrub handle survived into practice: a run could skip bars it then scores as clean');
  }
} finally { await b.close(); }

if (fails.length) { console.log('\nFAIL'); for (const f of fails) console.log('  ' + f); process.exit(1); }
console.log('\nthe bar seeks, and picture and sound still describe the same bar of music');
