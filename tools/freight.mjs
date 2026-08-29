// Reassemble a file freighted through the journal sink (trap 15/21: Edge eats
// the 3rd+ download from claude.ai; the reliable route is the design page's own
// GetFile API, chunked base64 POSTed no-cors to http://localhost:4180/journal).
//
// Freight line shape, one JSON object per journal line:
//   { t, k: 'freight', file, i, n, d }   d = base64 slice, i of n
//
// Usage:  node tools/freight.mjs <fileTag> <outPath>
// Then:   node tools/freight.mjs --clean     removes ALL freight lines
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOG = join(ROOT, 'journal.log');

const lines = readFileSync(LOG, 'utf8').split('\n').filter(Boolean);
const parse = (l) => { try { return JSON.parse(l); } catch { return null; } };

if (process.argv[2] === '--clean') {
  const kept = lines.filter((l) => { const j = parse(l); return !(j && j.k === 'freight'); });
  writeFileSync(LOG, kept.join('\n') + (kept.length ? '\n' : ''));
  console.log(`cleaned: ${lines.length - kept.length} freight lines removed, ${kept.length} kept`);
  process.exit(0);
}

const [, , tag, out] = process.argv;
if (!tag || !out) { console.error('usage: node tools/freight.mjs <fileTag> <outPath> | --clean'); process.exit(1); }

const chunks = lines.map(parse).filter((j) => j && j.k === 'freight' && j.file === tag);
if (!chunks.length) { console.error(`no freight for ${tag}`); process.exit(1); }
const n = chunks[0].n;
const byIndex = new Map(chunks.map((c) => [c.i, c.d]));
const missing = [];
for (let i = 0; i < n; i++) if (!byIndex.has(i)) missing.push(i);
if (missing.length) { console.error(`missing chunks: ${missing.join(',')} of ${n}`); process.exit(1); }
const b64 = Array.from({ length: n }, (_, i) => byIndex.get(i)).join('');
const buf = Buffer.from(b64, 'base64');
writeFileSync(out, buf);
console.log(`wrote ${out}: ${buf.length} bytes from ${n} chunks`);
