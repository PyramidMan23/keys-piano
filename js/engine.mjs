// Practice engine. DOM-free so the node test can drive it.
// Council spec: wait mode, tempo scaling, looping, hands-separate,
// per-note timing + wrong-note feedback, calibration offset applied to input.

export const PERFECT_MS = 60;
export const GOOD_MS = 150;

export function classifyTiming(deltaMs) {
  const d = Math.abs(deltaMs);
  if (d <= PERFECT_MS) return 'perfect';
  if (d <= GOOD_MS) return 'good';
  return 'late';
}

// Group notes that start on the same beat into chords the player must satisfy.
export function buildGroups(song, hand /* 'both'|'L'|'R' */, loop /* {start,end}|null */) {
  const inLoop = (n) => !loop || (n.b >= loop.start && n.b < loop.end);
  const required = song.notes.filter((n) => inLoop(n) && (hand === 'both' || n.h === hand));
  const passive = song.notes.filter((n) => inLoop(n) && !(hand === 'both' || n.h === hand));
  const map = new Map();
  for (const n of required) {
    if (!map.has(n.b)) map.set(n.b, []);
    map.get(n.b).push(n);
  }
  const groups = [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([beat, notes]) => {
      // a cross-hand unison is ONE physical key: dedupe so a single press
      // satisfies it (a Set-based done-tracker deadlocks wait mode otherwise)
      const seenMidi = new Set();
      const uniq = notes.filter((n) => (seenMidi.has(n.m) ? false : (seenMidi.add(n.m), true)));
      return { beat, notes: uniq, done: new Set() };
    });
  return { groups, passive, required };
}

export class Engine {
  constructor(song, opts = {}) {
    this.song = song;
    this.hand = opts.hand ?? 'both';
    this.tempo = opts.tempo ?? 1; // 1 = song bpm
    this.waitMode = opts.waitMode ?? true;
    this.loop = opts.loop ?? null; // {start,end} beats, loops in wait mode too
    this.calOffsetMs = opts.calOffsetMs ?? 0;
    const { groups, passive } = buildGroups(song, this.hand, this.loop);
    this.groups = groups;
    this.passive = passive;
    this.reset();
  }

  msPerBeat() { return 60000 / (this.song.bpm * this.tempo); }
  get startBeat() { return this.loop ? this.loop.start : 0; }
  get endBeat() {
    if (this.loop) return this.loop.end;
    return Math.max(...this.song.notes.map((n) => n.b + n.d));
  }

  reset() {
    this.beat = this.startBeat;
    this.nextGroupIdx = 0;
    this.waiting = false;
    this.finished = false;
    this.stats = { perfect: 0, good: 0, late: 0, wrong: 0, missed: 0 };
    this.events = []; // {type, midi, beat} feedback events since last drain
    this.timeMs = 0; // wall time, advances even while waiting
    this.recent = new Map(); // midi -> timeMs of last accepted hit
    this._lastDoneAt = null; // pace tracking: when the previous group finished
    this._lastDoneBeat = null;
    // mastery wave (council 08-24): what the analyzers read after the run
    this.playLog = [];  // accepted notes {m,h,b,d,onMs,offMs,vel}
    this.pedalLog = []; // sustain transitions {down,timeMs,beat}
    this.pedalDown = false;
    // signed timing (council 08-24): timed-mode deltas and wait-mode responses
    this.timing = [];    // signed ms per accepted timed press (neg = ahead)
    this.responses = []; // ms from freeze to press per accepted wait press
    this._waitStartMs = null;
    for (const g of this.groups) g.done.clear();
  }

  currentGroup() { return this.groups[this.nextGroupIdx] ?? null; }

  // Advance the clock by wall-time delta. In wait mode the clock freezes at a
  // group's beat until every required note in it has been played.
  tick(deltaMs) {
    if (this.finished) return;
    this.timeMs += deltaMs;
    let advBeats = deltaMs / this.msPerBeat();
    const g = this.currentGroup();
    if (this.waitMode && g) {
      const gap = g.beat - this.beat;
      if (advBeats >= gap && g.done.size < g.notes.length) {
        this.beat = g.beat;
        // stamp when the freeze began so accepted presses report responseMs
        if (!this.waiting) { this.waiting = true; this._waitStartMs = this.timeMs; }
        return;
      }
    }
    this.beat += advBeats;
    if (!this.waitMode) {
      // Timed mode: expire EVERY overdue group, not just the first, a long
      // tick (lag spike, background tab) must not swallow misses.
      let cur;
      while ((cur = this.currentGroup()) && this.beat > cur.beat + GOOD_MS / this.msPerBeat()) {
        const missed = cur.notes.length - cur.done.size;
        if (missed > 0) {
          this.stats.missed += missed;
          for (const n of cur.notes) if (!cur.done.has(n.m)) this.events.push({ type: 'missed', midi: n.m, beat: n.b });
        }
        this.nextGroupIdx++;
      }
    }
    if (this.beat >= this.endBeat) {
      if (this.loop) {
        // Per-lap scoring: report the lap then start the next one clean, so
        // the section trainer can judge each pass on its own.
        const lapAccuracy = this.accuracy();
        const lapWrong = this.stats.wrong;
        this.reset();
        this.events.push({ type: 'lap', accuracy: lapAccuracy, wrong: lapWrong });
      } else { this.beat = this.endBeat; this.finished = true; }
    }
  }

  // Sustain pedal transition (CC64 mapped to boolean upstream). Repeated
  // same-state values from a continuous pedal are collapsed to transitions.
  pedal(down) {
    if (down === this.pedalDown) return;
    this.pedalDown = down;
    this.pedalLog.push({ down, timeMs: this.timeMs, beat: this.beat });
  }

  // Player released a key: close the newest still-open play-log entry so the
  // articulation analyzer can measure real gaps and overlaps.
  noteOff(midi) {
    for (let i = this.playLog.length - 1; i >= 0; i--) {
      const e = this.playLog[i];
      if (e.m === midi && e.offMs == null) { e.offMs = this.timeMs; return; }
    }
  }

  // Player pressed a key. tMs is performance.now()-style; calibration applied here.
  noteOn(midi, velocity = null) {
    if (this.finished) return { result: 'extra' };
    const g = this.currentGroup();
    if (!g) return this._wrong(midi);
    const need = g.notes.find((n) => n.m === midi && !g.done.has(n.m));
    if (!need) {
      // Re-striking a note that was just accepted is a nervous double-tap,
      // not a mistake: ignore it rather than punishing it. Covers both a
      // still-current chord and the final chord note after the group advanced.
      const last = this.recent.get(midi);
      if (g.done.has(midi) || (last != null && this.timeMs - last < 350)) return { result: 'duplicate' };
      return this._wrong(midi);
    }

    const deltaMs = (this.beat - g.beat) * this.msPerBeat() - this.calOffsetMs;
    if (!this.waiting && deltaMs < -GOOD_MS) {
      // Right key, but its beat hasn't arrived: reject without consuming,
      // otherwise the whole song can be sprinted through ahead of the music.
      this.events.push({ type: 'early', midi, beat: g.beat });
      return { result: 'early', deltaMs };
    }
    const result = this.waiting ? 'good' : classifyTiming(deltaMs);
    g.done.add(midi);
    this.recent.set(midi, this.timeMs);
    this.playLog.push({ m: midi, h: need.h, b: need.b, d: need.d, onMs: this.timeMs, offMs: null, vel: velocity });
    this.stats[result === 'late' ? 'late' : result]++;
    // Signed timing travels with the event (council 08-24): timed presses carry
    // deltaMs (negative = ahead of the beat), wait presses carry responseMs.
    const ev = { type: result, midi, beat: g.beat, hand: need.h };
    if (this.waiting) {
      ev.responseMs = Math.max(0, Math.round(this.timeMs - (this._waitStartMs ?? this.timeMs)));
      this.responses.push(ev.responseMs);
    } else {
      ev.deltaMs = Math.round(deltaMs);
      this.timing.push(ev.deltaMs);
    }
    this.events.push(ev);

    if (g.done.size >= g.notes.length) {
      // pace: your real speed between completed groups vs the song's tempo
      if (this._lastDoneAt != null && g.beat > this._lastDoneBeat) {
        const idealMs = (g.beat - this._lastDoneBeat) * this.msPerBeat();
        const actualMs = this.timeMs - this._lastDoneAt;
        if (actualMs > 0) this.events.push({ type: 'pace', ratio: idealMs / actualMs });
      }
      this._lastDoneAt = this.timeMs;
      this._lastDoneBeat = g.beat;
      this.nextGroupIdx++;
      this.waiting = false;
    }
    return { result, deltaMs };
  }

  _wrong(midi) {
    this.stats.wrong++;
    this.events.push({ type: 'wrong', midi, beat: this.beat });
    return { result: 'wrong' };
  }

  drainEvents() { const e = this.events; this.events = []; return e; }

  accuracy() {
    const s = this.stats;
    const total = s.perfect + s.good + s.late + s.missed;
    if (total === 0) return 0;
    // ponytail: simple weighted score; ceiling = no per-note difficulty weighting
    return Math.round(((s.perfect + s.good * 0.8 + s.late * 0.4) / (total + s.wrong * 0.5)) * 100);
  }
}

// Signed-timing analysis (council 08-24): report the LEAN, not just the size
// of the error, median |delta| would hide whether the player rushes or drags.
export function timingSummary(deltas) {
  if (!deltas.length) return null;
  const s = [...deltas].sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.round(p * (s.length - 1)))];
  return { median: q(0.5), spread: Math.round((q(0.75) - q(0.25)) / 2), count: s.length };
}

// One calm line when the last few presses lean one way; null otherwise.
// Text only for persistent bias (per-note labels cause the guidance effect).
export function biasText(deltas, minN = 6, thresholdMs = 35) {
  if (deltas.length < minN) return null;
  const recent = deltas.slice(-8);
  const s = [...recent].sort((a, b) => a - b);
  const med = s[Math.floor(s.length / 2)];
  if (Math.abs(med) < thresholdMs) return null;
  return `Mostly ${Math.abs(med)}ms ${med < 0 ? 'ahead' : 'behind'}`;
}

// Learning chunks (Mark 2026-08-24): slice a song into fixed bar-pair windows
// with clear start/stop points, the unit a phrase is actually learned in.
export function chunkRange(song, idx, bars = 2) {
  const chunkBeats = bars * song.timeSig[0];
  const endBeat = Math.max(...song.notes.map((n) => n.b + n.d));
  const count = Math.ceil(endBeat / chunkBeats);
  const i = Math.max(0, Math.min(count - 1, idx));
  return { start: i * chunkBeats, end: Math.min((i + 1) * chunkBeats, endBeat), count, idx: i, chunkBeats };
}

// Latency calibration: player taps any key each time the marker lands.
// Store median offset of (tapTime - targetTime).
export function medianOffset(offsets) {
  if (!offsets.length) return 0;
  const s = [...offsets].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}
