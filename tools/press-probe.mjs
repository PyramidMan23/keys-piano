// DOES A PRESS ANSWER? Drive a real press and measure what changes.
//
// Mark: "can we make the feeling of pressing the buttons better? it'll add more
// soul and life." Feel cannot be asserted, only driven and looked at, so this
// holds a key and a button DOWN and captures both the numbers and the picture.
//
// ☠️ REAL POINTER EVENTS, NOT .click(). A synthetic click never produces an
// :active state at all - the browser paints that only for a real press - so a
// probe built on .click() would report "no press feedback" forever and send you
// rewriting CSS that was already correct.
import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const OUT = process.argv[2] || 'press.png';
const SEED = {
  firstRunDone: true, diagnosticDone: true, calibratedAt: Date.now() - 864e5,
  days: [], pmin: {}, songs: {}, lessons: {}, lib: { learning: true },
};
const b = await launch({ width: 1600, height: 950, scale: 2, port: 9685 });
const fails = [];
try {
  await b.goto('http://localhost:4180/index.html?canon=0');
  await b.eval(`localStorage.setItem('keys-v1', ${JSON.stringify(JSON.stringify(SEED))}); true`);
  await b.goto('http://localhost:4180/index.html?canon=1');
  await new Promise((r) => setTimeout(r, 1900));

  // --- a UI button, held down ---
  const btn = await b.eval(`(() => {
    const el = [...document.querySelectorAll('*')].find((e) => !e.children.length
      && e.textContent.trim() === 'Free play' && e.getBoundingClientRect().width > 0);
    if (!el) return null;
    const hit = el.closest('button, a, [role="button"]') || el;
    const r = hit.getBoundingClientRect();
    window.__pressTarget = hit;
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + Math.min(r.height / 2, 20)) };
  })()`);
  if (!btn) fails.push('no Free play control to press');
  else {
    const rest = await b.eval(`getComputedStyle(window.__pressTarget).transform`);
    // ☠️ `buttons: 1` IS REQUIRED or Chrome never enters :active. Without the
    // bitmask the press is delivered but no button is considered held, so the
    // page paints its resting state and a probe reports "no press feedback" for
    // CSS that is perfectly correct.
    // ☠️ MOVE THE POINTER THERE FIRST. A bare mousePressed is delivered without
    // the renderer ever hit-testing that element as hovered, so Chrome does not
    // enter :active and the probe reads the resting style. mouseMoved sets the
    // target; only then does a press mean anything.
    await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: btn.x, y: btn.y, buttons: 0 });
    await new Promise((r) => setTimeout(r, 40));
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: btn.x, y: btn.y, button: 'left', buttons: 1, clickCount: 1 });
    await new Promise((r) => setTimeout(r, 90));
    const held = await b.eval(`(() => { const s = getComputedStyle(window.__pressTarget);
      return JSON.stringify({ transform: s.transform, filter: s.filter }); })()`);
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: btn.x, y: btn.y, button: 'left', clickCount: 1 });
    const h = JSON.parse(held);
    console.log(`button at rest : ${rest}`);
    console.log(`button pressed : ${h.transform}   filter ${h.filter}`);
    if (h.transform === rest && h.filter === 'none') fails.push('the button does not answer a press at all');
  }
  await new Promise((r) => setTimeout(r, 900));

  // --- a piano key, held down, captured mid-press ---
  const key = await b.eval(`(() => {
    const v = window.__fpView;
    if (!v) return { err: 'free play not open' };
    const c = document.getElementById('freeplay-canvas');
    const r = c.getBoundingClientRect();
    return { x: Math.round(r.x + r.width * 0.31), y: Math.round(r.y + (v.h - v.kbH / 2) * (r.height / v.h)) };
  })()`);
  if (key.err) fails.push(key.err);
  else {
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: key.x, y: key.y, button: 'left', buttons: 1, clickCount: 1 });
    await new Promise((r) => setTimeout(r, 140));   // past the 60ms dip settle
    const dip = await b.eval(`(() => {
      const v = window.__fpView;
      const m = [...v.pressed.keys()][0];
      if (m == null) return JSON.stringify({ err: 'no key registered as down' });
      return JSON.stringify({ midi: m, dip: +v._keyDip(m, performance.now()).toFixed(2), down: v.pressed.size });
    })()`);
    const d = JSON.parse(dip);
    if (d.err) fails.push(d.err);
    else {
      console.log(`key pressed    : midi ${d.midi}, sunk ${d.dip}px, ${d.down} key(s) down`);
      if (!(d.dip > 1)) fails.push(`the key only sank ${d.dip}px: the press does not read`);
    }
    const png = await b.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(OUT, Buffer.from(png.data, 'base64'));
    console.log(`wrote ${OUT} with the key still held down`);
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: key.x, y: key.y, button: 'left', clickCount: 1 });
  }
} finally { await b.close(); }

if (fails.length) { console.log('\nFAIL'); for (const f of fails) console.log('  ' + f); process.exit(1); }
console.log('\na press is answered by both the keys and the controls');
