// What in the library actually LOOKS like a control? Measure it, do not guess.
// The press-feel heuristic missed almost everything on its first pass, so this
// prints the real distribution before the rule is rewritten.
import { launch } from './cdp.mjs';

const b = await launch({ width: 900, height: 1400, scale: 1, port: 9353 });
try {
  await b.goto('http://localhost:4180/design-2026-08/keys-prototype.html');
  const rows = await b.eval(`(() => {
    const lib = document.getElementById('pane-library');
    const out = [];
    for (const n of lib.querySelectorAll('*')) {
      const cs = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      const t = n.textContent.trim();
      if (!t || t.length > 42) continue;
      if (r.height < 16 || r.height > 90) continue;
      if (r.width < 24 || r.width > 400) continue;
      const painted = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0;
      if (!painted) continue;
      out.push({ t: t.slice(0, 26), w: Math.round(r.width), h: Math.round(r.height),
                 rad: cs.borderRadius, bg: cs.backgroundColor, bw: cs.borderTopWidth,
                 kids: n.children.length });
    }
    return out;
  })()`);
  console.log('painted, text-bearing, button-sized elements in the library:', rows.length);
  const byRadius = {};
  for (const r of rows) byRadius[r.rad] = (byRadius[r.rad] || 0) + 1;
  console.log('radius distribution:', Object.entries(byRadius).sort((a, b) => b[1] - a[1]).slice(0, 8));
  console.log('\nsample:');
  rows.slice(0, 28).forEach((r) => console.log(`  ${String(r.w).padStart(3)}x${String(r.h).padStart(2)} rad ${r.rad.padEnd(8)} kids ${r.kids}  ${r.t}`));
} finally {
  await b.close();
}
