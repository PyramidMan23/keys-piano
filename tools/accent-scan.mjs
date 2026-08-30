// Report every candidate site for the PROGRESS accent in the design source,
// with the nearby text, so a replacement is made against evidence and never a
// blind global swap. Read-only. Usage: node tools/accent-scan.mjs
import { readFileSync } from 'node:fs';
const SRC = 'design-2026-08/claude-design-v8/Keys Library Directions.dc.html';
const s = readFileSync(SRC, 'utf8');

const TARGETS = [
  ['level fill', /width:\d+%;height:100%;background:#82bf9c/g],
  ['path pip', /max-width:30px;height:6px;background:#82bf9c;border:1px solid #82bf9c/g],
  ['streak square', /width:12px;height:12px;flex:none;background:#82bf9c;border-radius:2px/g],
  ['practice bar', /height:\d+%;border:1px solid #253129;background:#000;box-sizing:border-box;border-radius:1px/g],
  ['practice today', /height:\d+%;background:#82bf9c;box-sizing:border-box;border-radius:1px/g],
  ['no-keyboard ring', /border:1\.6px solid #efce81;border-radius:50%/g],
  ['no-keyboard word', /color:#efce81"[^>]*>No keyboard/g],
];
// nearest human-readable text after a position, to identify which board it is on
const near = (i) => {
  const w = s.slice(i, i + 1400).replace(/<[^>]*>/g, '');
  const words = w.split('').map((t) => t.trim()).filter((t) => /[A-Za-z]{3}/.test(t));
  return words.slice(0, 3).join(' | ').slice(0, 70);
};
for (const [name, re] of TARGETS) {
  re.lastIndex = 0;
  let m, n = 0;
  console.log('=== ' + name + ' ===');
  while ((m = re.exec(s))) {
    console.log(`  @${String(m.index).padStart(7)}  ${near(m.index)}`);
    if (++n > 12) { console.log('  ... more'); break; }
  }
  if (!n) console.log('  NONE');
}
