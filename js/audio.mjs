// "Hear it" preview player, v4 (2026-08-24, Mark: "make it sound like an
// actual grand piano"). The voice is now a REAL grand: the Salamander Grand
// Piano sample set (Yamaha C5 recorded by Alexander Holm, CC-BY 3.0, via
// tonejs.github.io/audio/salamander), self-hosted in samples/ as 30 notes at
// minor-third spacing. A note plays the nearest sample pitch-shifted at most
// 1 semitone, so it stays natural across the range. The old triangle synth
// survives only as a fail-soft fallback if a sample cannot load or decode.
// All the v3 session discipline is kept, each piece from a confirmed audit
// finding:
//  - per-SESSION gain bus (no master-restore race)
//  - scheduling starts only AFTER ctx.resume() resolves
//  - overdue notes (hidden-tab throttling) are SKIPPED, never burst-played
// Playback only; scoring stays silent per the council ruling.

let ctx = null, comp = null;
let current = null;

const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---- sample map (DOM-free helpers, node-tested) ----
export const SAMPLE_NOTES = [];
for (let oct = 0; oct <= 7; oct++) for (const pc of [21, 24, 27, 30]) {
  const m = pc + oct * 12;
  if (m <= 108) SAMPLE_NOTES.push(m); // A0, C1, Ds1, Fs1 ... A7, C8
}
SAMPLE_NOTES.sort((a, b) => a - b);

const SAMPLE_LETTERS = { 9: 'A', 0: 'C', 3: 'Ds', 6: 'Fs' };
export function sampleName(midi) {
  const letter = SAMPLE_LETTERS[midi % 12];
  return letter + (Math.floor(midi / 12) - 1);
}

export function nearestSample(midi, notes = SAMPLE_NOTES) {
  let best = notes[0];
  for (const s of notes) if (Math.abs(s - midi) < Math.abs(best - midi)) best = s;
  return best;
}

export const rateFor = (midi, sampleMidi) => Math.pow(2, (midi - sampleMidi) / 12);

// ---- sample loading: fetched once, decoded once, kept for the session ----
const buffers = new Map(); // sampleMidi -> AudioBuffer | null (null = failed)
let samplesLoading = null;
function loadSamples() {
  samplesLoading ??= Promise.all(SAMPLE_NOTES.map(async (sm) => {
    try {
      const res = await fetch(`samples/${sampleName(sm)}.mp3`);
      if (!res.ok) throw new Error('http ' + res.status);
      buffers.set(sm, await ctx.decodeAudioData(await res.arrayBuffer()));
    } catch {
      buffers.set(sm, null); // this note falls back to the synth voice
    }
  }));
  return samplesLoading;
}

// debug/test lever: how many samples actually decoded
export function audioStats() {
  let loaded = 0, failed = 0;
  for (const b of buffers.values()) (b ? loaded++ : failed++);
  return { loaded, failed, total: SAMPLE_NOTES.length };
}
if (typeof window !== 'undefined') window.__audioStats = audioStats;

// Voice diagnostic (council 08-24): what Mark hears must be a fact on screen,
// not a guess. 'auto' = samples with per-note synth fail-soft (the shipped
// behaviour), 'synth' = force the old triangle voice for A/B comparison.
let voiceMode = 'auto';
let lastVoice = null; // 'sample' | 'synth', what the most recent note used
export function setVoiceMode(mode) { voiceMode = mode === 'synth' ? 'synth' : 'auto'; }
export function voiceInfo() { return { mode: voiceMode, lastVoice, ...audioStats() }; }

// Authored dynamics (council 08-24): preview notes may carry v (0..1); mapped
// through a conservative gain curve, no fake filtering on a single layer.
export const dynGain = (v) => (v == null ? 1 : 0.55 + 0.45 * Math.max(0, Math.min(1, v)));

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;
    comp.connect(ctx.destination);
  }
  const ready = ctx.state === 'running' ? Promise.resolve() : ctx.resume();
  return ready.then(loadSamples);
}

// fail-soft synth voice (the old v3 sound), used only when a sample is missing
function synthVoice(bus, when, midi, durS, gainMul) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq(midi);
  const peak = 0.14 * gainMul;
  const sustainEnd = when + Math.max(0.18, durS * 0.92);
  const release = 0.09;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + 0.008);
  g.gain.linearRampToValueAtTime(peak * 0.8, sustainEnd);
  g.gain.linearRampToValueAtTime(0.0001, sustainEnd + release);
  osc.connect(g).connect(bus);
  osc.start(when);
  osc.stop(sustainEnd + release + 0.02);
  return osc;
}

function voice(bus, when, midi, durS, gainMul) {
  if (voiceMode === 'synth') { lastVoice = 'synth'; return synthVoice(bus, when, midi, durS, gainMul); }
  // nearest DECODED sample; a failed neighbour just widens the shift a touch
  const usable = SAMPLE_NOTES.filter((sm) => buffers.get(sm));
  if (!usable.length) { lastVoice = 'synth'; return synthVoice(bus, when, midi, durS, gainMul); }
  lastVoice = 'sample';
  const sm = nearestSample(midi, usable);
  const src = ctx.createBufferSource();
  src.buffer = buffers.get(sm);
  src.playbackRate.value = rateFor(midi, sm);
  const g = ctx.createGain();
  const peak = 0.85 * gainMul; // the sample carries its own natural decay
  const end = when + Math.max(0.25, durS);
  const release = 0.18; // damper falls: short ramp, not a hard cut
  g.gain.setValueAtTime(peak, when);
  g.gain.setValueAtTime(peak, end);
  g.gain.linearRampToValueAtTime(0.0001, end + release);
  src.connect(g).connect(bus);
  src.start(when);
  src.stop(end + release + 0.05);
  return src;
}

// notes: song-format; msPerBeat at preview tempo.
// onKey(midi, isDown) mirrors onto the on-screen keyboard. Returns stop().
export function playPreview(notes, msPerBeat, onKey, onDone) {
  stopPreview();
  const sess = { stopped: false, oscs: [], timers: [], next: 0, bus: null };
  current = sess;

  ensureCtx().then(() => {
    if (sess.stopped) return; // stopped before the context even woke
    sess.bus = ctx.createGain();
    sess.bus.gain.value = 1;
    sess.bus.connect(comp);

    const startBeat = Math.min(...notes.map((n) => n.b));
    const song = [...notes]
      .map((n) => ({ atS: ((n.b - startBeat) * msPerBeat) / 1000, durS: (n.d * msPerBeat) / 1000, m: n.m, h: n.h, v: n.v }))
      .sort((a, b) => a.atS - b.atS);
    const t0 = ctx.currentTime + 0.12;
    const endS = Math.max(...song.map((n) => n.atS + n.durS));

    const LOOKAHEAD = 0.35;
    const tick = () => {
      if (sess.stopped) return;
      const now = ctx.currentTime;
      while (sess.next < song.length && t0 + song[sess.next].atS < now + LOOKAHEAD) {
        const n = song[sess.next++];
        const when = t0 + n.atS;
        if (when < now - 0.05) continue; // overdue (throttled tab): skip, don't burst
        sess.oscs.push(voice(sess.bus, when, n.m, n.durS, (n.h === 'L' ? 0.8 : 1) * dynGain(n.v)));
        const visualInMs = Math.max(0, (when - now) * 1000);
        sess.timers.push(setTimeout(() => { if (!sess.stopped) onKey?.(n.m, true); }, visualInMs));
        sess.timers.push(setTimeout(() => { if (!sess.stopped) onKey?.(n.m, false); }, visualInMs + n.durS * 1000));
      }
      if (sess.next >= song.length && now > t0 + endS + 0.4) {
        sess.stopped = true;
        clearInterval(sess.ticker);
        onDone?.();
      }
    };
    tick();
    sess.ticker = setInterval(tick, 100);
  });

  return () => stopSession(sess);
}

function stopSession(sess) {
  if (!sess || sess.stopped) return;
  sess.stopped = true;
  clearInterval(sess.ticker);
  for (const t of sess.timers) clearTimeout(t);
  if (sess.bus) {
    // silence THIS session's bus only; nobody else is affected
    const now = ctx.currentTime;
    sess.bus.gain.cancelScheduledValues(now);
    sess.bus.gain.setValueAtTime(sess.bus.gain.value, now);
    sess.bus.gain.linearRampToValueAtTime(0.0001, now + 0.06);
    for (const o of sess.oscs) { try { o.stop(now + 0.08); } catch { /* already ended */ } }
    setTimeout(() => { try { sess.bus.disconnect(); } catch { /* fine */ } }, 200);
  }
}

export function stopPreview() { stopSession(current); }

// ---- tap-sound law (Mark 2026-08-28: "hear the notes as they're pressed so
// we can follow the flow"). The silent-scoring council law was written for
// the P-45, which speaks for itself; SCREEN TAPS have no instrument, so by
// default they sound the grand. Modes: auto (taps sound, MIDI silent) /
// on (always sound) / off (always silent). Pure + node-tested.
export const SOUND_MODES = ['auto', 'on', 'off'];
export function soundModeNext(mode) {
  const i = SOUND_MODES.indexOf(SOUND_MODES.includes(mode) ? mode : 'auto');
  return SOUND_MODES[(i + 1) % SOUND_MODES.length];
}
export function tapSoundActive(mode, midiConnected) {
  const m = SOUND_MODES.includes(mode) ? mode : 'auto';
  return m === 'on' || (m === 'auto' && !midiConnected);
}
