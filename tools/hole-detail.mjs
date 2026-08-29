// Name the holes precisely. A correction sent to a design tool as "this screen
// feels thin" gets a guess back; sent as "these six ids have no visible label"
// it gets a fix. apply-design Rule 6.
import { launch } from './cdp.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const inv = JSON.parse(readFileSync(join(ROOT, 'design-2026-08', 'control-inventory.json'), 'utf8'));
const THIN = ['play', 'path', 'lessons', 'lesson', 'task', 'echo', 'rhythm', 'improv', 'freeplay', 'metronome', 'takes', 'calibrate', 'touch'];

const b = await launch({ width: 900, height: 1600, scale: 1, port: 9359 });
try {
  await b.goto('http://localhost:4180/design-2026-08/keys-prototype.html');
  console.log('REAL INPUTS PRESENT IN THE WHOLE PROTOTYPE:');
  const inputs = await b.eval(`(() => {
    const out = [];
    for (const p of document.querySelectorAll('.pane')) {
      p.classList.add('on');
      for (const e of p.querySelectorAll('input,select,textarea')) {
        out.push(p.dataset.screen + '  <' + e.tagName.toLowerCase() + (e.type ? ' type=' + e.type : '') + '>');
      }
      p.classList.remove('on');
    }
    return out;
  })()`);
  inputs.forEach((i) => console.log('  ' + i));

  console.log('\nPER SCREEN, what the design drew vs what the app needs:');
  for (const key of THIN) {
    await b.eval(`document.querySelector('.chip[data-go="${key}"]').click(); true`);
    await new Promise((r) => setTimeout(r, 180));
    const texts = await b.eval(`(() => {
      const p = document.getElementById('pane-${key}');
      const s = new Set();
      for (const e of p.querySelectorAll('*')) {
        if (e.children.length) continue;
        const t = e.textContent.trim();
        if (t && t.length <= 34) s.add(t);
      }
      return [...s];
    })()`);
    const need = (inv.screens[key] ?? []).map((c) => c.id);
    console.log(`\n  ${key}  needs ${need.length} controls`);
    console.log(`    ids:   ${need.join(' ')}`);
    console.log(`    drawn: ${texts.slice(0, 22).join(' | ')}`);
  }
} finally { await b.close(); }
