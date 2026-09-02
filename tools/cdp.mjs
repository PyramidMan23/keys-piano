// Minimal Chrome DevTools Protocol client. Zero dependencies: Node 24 ships a
// native WebSocket, and Chrome is already on this machine, so the pinned-browser
// requirement of the overlay doctrine costs no install.
//
// Why pinned: apply-design Rule 12.1 - both sides of an overlay must render in
// the SAME browser at the SAME deviceScaleFactor, or font rastering differences
// drown the real signal and you spend hours chasing noise.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

export async function launch({ width = 756, height = 1400, scale = 2, port = 9333 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'keys-cdp-'));
  const proc = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    '--hide-scrollbars',
    '--force-device-scale-factor=' + scale,
    '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--mute-audio',
    // navigator.webdriver === true inside the page, so app.mjs jlog() drops every
    // event a gate produces (2026-09-02: tools had polluted the practice journal)
    '--enable-automation',
    'about:blank',
  ], { stdio: 'ignore' });

  // wait for the debugger to answer
  let target = null;
  for (let i = 0; i < 100; i++) {
    await new Promise((r) => setTimeout(r, 150));
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === 'page');
      if (target) break;
    } catch { /* not up yet */ }
  }
  if (!target) { proc.kill(); throw new Error('Chrome did not open a debugging port'); }

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
      try { rmSync(profile, { recursive: true, force: true }); } catch {}
    },
  };
}
