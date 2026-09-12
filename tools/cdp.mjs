// Minimal Chrome DevTools Protocol client. Zero dependencies: Node 24 ships a
// native WebSocket, and Chrome is already on this machine, so the pinned-browser
// requirement of the overlay doctrine costs no install.
//
// Why pinned: apply-design Rule 12.1 - both sides of an overlay must render in
// the SAME browser at the SAME deviceScaleFactor, or font rastering differences
// drown the real signal and you spend hours chasing noise.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// Let Chrome allocate an available port atomically. Probing then binding a
// requested port races parallel gates and recently closed Chrome processes.
// Read only this child's unique profile; never attach to an old test browser.
// https://chromedevtools.github.io/devtools-protocol/
export async function launch({ width = 756, height = 1400, scale = 2, extraArgs = [] } = {}) {
  let port = 0;
  const profile = mkdtempSync(join(tmpdir(), 'keys-cdp-'));
  const proc = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    '--hide-scrollbars',
    '--force-device-scale-factor=' + scale,
    '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--mute-audio',
    // navigator.webdriver === true inside the page, so app.mjs jlog() drops every
    // event a gate produces (2026-09-02: tools had polluted the practice journal)
    '--enable-automation',
    ...extraArgs,
    'about:blank',
  ], { stdio: 'ignore' });

  // wait for the debugger to answer
  // 40s, not 15: on 2026-09-07 another session's probes, the nightly refresh
  // and Drive were pinning the CPU at 100% and Chrome took longer than 15s to
  // answer, which failed a gate that had nothing wrong with it
  let target = null;
  for (let i = 0; i < 260; i++) {
    await new Promise((r) => setTimeout(r, 150));
    try {
      if (!port) {
        port = Number(readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]);
        if (!(port > 0 && port < 65536)) { port = 0; continue; }
      }
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === 'page');
      if (target) break;
    } catch { /* not up yet */ }
  }
  if (!target) { proc.kill(); throw new Error('Chrome did not open a debugging port'); }

  // ☠️ AND A GATE THAT THROWS MUST NOT LEAK ITS BROWSER, which is how the stale
  // ones accumulated: close() only runs on the happy path. Kill the child when
  // this process ends, however it ends.
  let killed = false;
  const cleanup = () => {
    if (killed) return;
    killed = true;
    try { proc.kill(); } catch {}
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  };
  process.once('exit', cleanup);
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.once(sig, () => { cleanup(); process.exit(130); });
  process.once('uncaughtException', (e) => { cleanup(); throw e; });

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  const listeners = [];      // (method, params) => void, for CDP events
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      return;
    }
    if (msg.method) for (const fn of listeners) fn(msg.method, msg.params);
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const n = ++id;
    pending.set(n, { res, rej });
    ws.send(JSON.stringify({ id: n, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: scale, mobile: false,
  });

  return {
    send,
    // Subscribe to CDP events. A page that throws during boot still renders
    // something, so "it looked fine in a screenshot" is not evidence it worked.
    on(fn) { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); },
    // Collect console errors, warnings and uncaught exceptions until stopped.
    watchErrors() {
      const out = [];
      const off = this.on((method, p) => {
        if (method === 'Runtime.consoleAPICalled' && (p.type === 'error' || p.type === 'warning'))
          out.push(p.type + ': ' + p.args.map((a) => a.value ?? a.description ?? a.type).join(' ').slice(0, 240));
        else if (method === 'Runtime.exceptionThrown')
          out.push('EXCEPTION: ' + String(p.exceptionDetails.exception?.description ?? p.exceptionDetails.text).slice(0, 400));
      });
      return { errors: out, stop: off };
    },
    async goto(url) {
      if (process.env.KEYS_TEST_ORIGIN) url = url.replace('http://localhost:4180', process.env.KEYS_TEST_ORIGIN);
      await send('Page.navigate', { url });
      // settle: readyState complete plus a frame, then fonts
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 100));
        const { result } = await send('Runtime.evaluate', {
          expression: 'document.readyState === "complete"', returnByValue: true,
        });
        if (result.value) break;
      }
      await send('Runtime.evaluate', {
        expression: 'document.fonts ? document.fonts.ready.then(()=>true) : true',
        awaitPromise: true, returnByValue: true,
      });
    },
    // Wait until the APP is up, not just the document: under a pinned CPU the
    // modules can still be loading seconds after readyState says complete, and
    // a probe that acts then reads sample text or throws on window.__show.
    async ready(ms = 30000) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        const { result } = await send('Runtime.evaluate', { expression: "typeof window.__show === 'function' && !!document.querySelector('#screen-library')", returnByValue: true });
        if (result.value) return true;
        await new Promise((r) => setTimeout(r, 150));
      }
      throw new Error('the app did not boot within ' + ms + 'ms');
    },
    async eval(expression) {
      const { result, exceptionDetails } = await send('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (exceptionDetails) throw new Error(exceptionDetails.text + ' ' + (exceptionDetails.exception?.description ?? ''));
      return result.value;
    },
    // Rule 12.4: motion frozen on BOTH sides before any shot, or a mid-transition
    // frame reads as a design difference.
    async freezeMotion() {
      await this.eval(`(() => { const s = document.createElement('style');
        s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
        document.head.appendChild(s); return true; })()`);
    },
    // A CLIPPED shot may reach below the fold, so it needs captureBeyondViewport.
    // An UNCLIPPED one must not: Chrome grows the page to the full content size
    // to take it, which fires resize, and this app re-picks its whole
    // composition on resize. Every full-page screenshot of the library was
    // therefore of the 756 column while the measurement taken a moment earlier
    // was of the desktop grid. The picture and the numbers disagreed, and the
    // picture was the liar.
    async shot(clip) {
      const params = { format: 'png', captureBeyondViewport: !!clip };
      if (clip) params.clip = { ...clip, scale: 1 };
      const { data } = await send('Page.captureScreenshot', params);
      return Buffer.from(data, 'base64');
    },
    async close() {
      try { ws.close(); } catch {}
      proc.kill();
      cleanup();
      try { rmSync(profile, { recursive: true, force: true }); } catch {}
    },
  };
}
