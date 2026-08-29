// Which regions did the design LABEL with an id instead of drawing?
//
// A static design cannot draw live falling notes or a waveform, so canvas
// regions are legitimately placeholders. But a placeholder is not a design, and
// the difference has to be stated rather than counted as covered. An earlier
// version of this probe returned "none" because the regex was mangled through
// shell escaping; that is why it lives in a file now.
import { launch } from './cdp.mjs';

const b = await launch({ width: 900, height: 1600, scale: 1, port: 9365 });
try {
  await b.goto('http://localhost:4180/design-2026-08/keys-prototype.html');
  const found = await b.eval(`(() => {
    const out = [];
    for (const p of document.querySelectorAll('.pane')) {
      p.classList.add('on');
      const t = p.innerText || '';
      const hits = t.match(/\\b[a-z]{2,}-[a-z-]{2,}\\b/g) || [];
      for (const h of new Set(hits)) out.push({ screen: p.dataset.screen, label: h });
      p.classList.remove('on');
    }
    document.getElementById('pane-library').classList.add('on');
    return out;
  })()`);
  const byScreen = {};
  for (const f of found) (byScreen[f.screen] ??= []).push(f.label);
  console.log('REGIONS LABELLED WITH AN ID RATHER THAN DRAWN:');
  if (!found.length) console.log('  none');
  for (const [s, list] of Object.entries(byScreen)) console.log(`  ${s.padEnd(12)} ${[...new Set(list)].join(' ')}`);
  console.log(`\ntotal: ${found.length}`);

  const canvases = await b.eval(`(() => {
    const out = [];
    for (const p of document.querySelectorAll('.pane')) {
      const n = p.querySelectorAll('canvas').length;
      if (n) out.push(p.dataset.screen + ' x' + n);
    }
    return out;
  })()`);
  console.log('\nreal <canvas> elements present (these are the live surfaces a static design cannot draw):');
  console.log('  ' + (canvases.join(', ') || 'none'));
} finally { await b.close(); }
