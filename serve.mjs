// Tiny static server for local dev + the practice journal sink. No deps.
import { createServer } from 'node:http';
import { readFile, appendFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = 4180;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ttf': 'font/ttf',
};

const JOURNAL = join(ROOT, 'journal.log');

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    // usage-gate journal (council 2026-08-23): the app POSTs event batches,
    // they land here as JSON lines so Claude can read real practice evidence
    if (path === '/journal' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 200000) break; }
      try {
        const events = JSON.parse(body);
        if (Array.isArray(events) && events.length <= 500) {
          await appendFile(JOURNAL, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
        }
      } catch { /* malformed batch: drop, never 500 the app */ }
      res.writeHead(204).end();
      return;
    }
    if (path === '/journal' && req.method === 'GET') {
      const log = await readFile(JOURNAL, 'utf8').catch(() => '');
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end(log);
      return;
    }
    if (path === '/') path = '/index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': MIME[extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch {
    // A typo must land IN THE APP, not on a bare "not found". Mark hand-typed
    // localhost:4180/ with a stray character on the end and got a black page
    // with two words on it (2026-08-29). For anything that looks like a page
    // request, serve the app shell; only real asset misses still 404 so a
    // broken image or module never silently becomes HTML.
    const wantsPage = req.method === 'GET' && !extname(req.url.split('?')[0]) ;
    if (wantsPage) {
      try {
        const shell = await readFile(join(ROOT, 'index.html'));
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end(shell);
        return;
      } catch { /* fall through to the honest 404 */ }
    }
    res.writeHead(404).end('not found');
  }
}).listen(PORT, () => console.log(`piano dev server on http://localhost:${PORT}`));
