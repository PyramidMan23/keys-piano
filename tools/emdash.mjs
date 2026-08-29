// Mark's hard rule, 2026-07-26: no em dash character, anywhere, ever. It is the
// single biggest tell that an AI wrote the text.
//
// This separates the two cases, because they need different fixes: an em dash
// inside a STRING is copy a user reads and has to be rewritten with a comma, a
// colon or a full stop; one in a comment is just a comment.
//
// Run: node tools/emdash.mjs [--strings]
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EM = '\u2014';
const files = [
  ...readdirSync(join(ROOT, 'js')).filter((f) => f.endsWith('.mjs')).map((f) => join('js', f)),
  ...readdirSync(ROOT).filter((f) => f.endsWith('.html') || f.endsWith('.css')),
];

let strings = 0, comments = 0;
const hits = [];
for (const rel of files) {
  const text = readFileSync(join(ROOT, rel), 'utf8');
  text.split('\n').forEach((line, i) => {
    if (!line.includes(EM)) return;
    const trimmed = line.trim();
    // a line whose em dash sits after a comment marker, with no quote before it
    const idx = line.indexOf(EM);
    const before = line.slice(0, idx);
    const inComment = /^\s*(\/\/|\*|\/\*|<!--)/.test(trimmed) ||
      (before.includes('//') && !/["'`][^"'`]*$/.test(before));
    const n = (line.match(new RegExp(EM, 'g')) ?? []).length;
    if (inComment) comments += n; else { strings += n; hits.push(`${rel}:${i + 1}  ${trimmed.slice(0, 120)}`); }
  });
}
console.log(`${strings} in strings/markup (user-visible), ${comments} in comments`);
if (process.argv.includes('--strings')) for (const h of hits) console.log('  ' + h);
process.exit(strings ? 1 : 0);
