// Take capture bookkeeping (mastery item 5, council 08-24). DOM-free: the
// index/eviction logic lives here so the node test can pin it; the IndexedDB
// and MediaRecorder plumbing stays in app.mjs. Audio is for REVIEW only,
// never scoring: mic AGC lies about dynamics.

export const TAKE_CAP = 20; // keep the newest N takes, oldest evicted

// index: array of {id, songId, title, at, durMs, hasAudio, bytes, events}
// newest LAST. Returns the new index plus what fell off the shelf (the caller
// deletes those blobs from IndexedDB).
export function addTake(index, meta, cap = TAKE_CAP) {
  const next = [...index.filter((t) => t.id !== meta.id), meta];
  next.sort((a, b) => a.at - b.at);
  const evicted = next.length > cap ? next.slice(0, next.length - cap) : [];
  return { index: next.slice(Math.max(0, next.length - cap)), evicted };
}

export function removeTake(index, id) {
  return index.filter((t) => t.id !== id);
}

export function takeUsage(index) {
  const bytes = index.reduce((a, t) => a + (t.bytes || 0), 0);
  return { count: index.length, bytes, mb: +(bytes / 1048576).toFixed(1) };
}

export function newTakeId(at) {
  return `take-${at}-${Math.floor(Math.random() * 1e6)}`;
}

// Replay prep: recorded MIDI events {t(ms), m, vel, down} become preview-synth
// notes. Down/up pairs are matched per midi; unmatched downs get a beat.
export function eventsToNotes(events, msPerBeat = 500) {
  const open = new Map(); // midi -> event
  const notes = [];
  const endT = events.length ? Math.max(...events.map((e) => e.t)) : 0;
  for (const e of events) {
    if (e.kind === 'cc') continue; // pedal is context, not a note to replay
    if (e.down) {
      if (!open.has(e.m)) open.set(e.m, e);
    } else if (open.has(e.m)) {
      const on = open.get(e.m);
      open.delete(e.m);
      notes.push({ b: on.t / msPerBeat, d: Math.max(0.05, (e.t - on.t) / msPerBeat), m: e.m, h: on.h ?? 'R' });
    }
  }
  for (const [m, on] of open) notes.push({ b: on.t / msPerBeat, d: Math.max(0.2, (endT - on.t) / msPerBeat) || 1, m, h: on.h ?? 'R' });
  notes.sort((a, b) => a.b - b.b);
  return notes;
}
