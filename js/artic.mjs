// Key-release articulation (mastery item 3, council 08-24). DOM-free.
// The engine's play log carries real on/off times per accepted note; here we
// measure how each note CONNECTS to the next one in the same hand: overlap
// (legato), a small daylight gap (detached), or a large gap on a note that
// was written long (choppy). Plus clipped endings: long notes cut well short.
// Thresholds are arrangement choices, exported so the tests pin them.

export const LEGATO_MAX_GAP_MS = 20;   // touch or overlap up to 20ms of daylight = joined
export const DETACHED_MAX_FRAC = 0.35; // gap under 35% of the written value = detached
export const CLIP_FRAC = 0.5;          // a long note held under half its value = clipped

// playLog: engine entries {m,h,b,d,onMs,offMs}. Returns per-junction records.
export function analyzeArticulation(playLog, msPerBeat) {
  const joins = [];
  const clipped = [];
  for (const hand of ['L', 'R']) {
    const seq = playLog.filter((e) => e.h === hand && e.offMs != null).sort((a, b) => a.onMs - b.onMs || a.m - b.m);
    for (let i = 0; i < seq.length; i++) {
      const cur = seq[i];
      const writtenMs = cur.d * msPerBeat;
      const heldMs = cur.offMs - cur.onMs;
      if (writtenMs >= msPerBeat && heldMs < CLIP_FRAC * writtenMs) {
        clipped.push({ hand, beat: cur.b, midi: cur.m, heldMs, writtenMs });
      }
      // next note in this hand at a LATER beat (chord siblings are not junctions)
      const next = seq.slice(i + 1).find((e) => e.b > cur.b);
      if (!next) continue;
      const gapMs = next.onMs - cur.offMs; // negative = overlap
      let kind;
      if (gapMs <= LEGATO_MAX_GAP_MS) kind = 'legato';
      else if (gapMs < DETACHED_MAX_FRAC * writtenMs) kind = 'detached';
      else kind = writtenMs >= 0.9 * msPerBeat ? 'choppy' : 'detached';
      joins.push({ hand, beat: cur.b, midi: cur.m, gapMs, writtenMs, kind });
    }
  }
  return { joins, clipped };
}

// One honest paragraph for the results screen, plus the worst spot.
export function articulationSummary({ joins, clipped }, sections = [], timeSigBeats = 4) {
  if (joins.length < 5) return null; // too little data to say anything fair
  const legato = joins.filter((j) => j.kind === 'legato').length;
  const choppy = joins.filter((j) => j.kind === 'choppy');
  const legatoPct = Math.round((legato / joins.length) * 100);
  const barOf = (b) => Math.floor(b / timeSigBeats) + 1;
  let worst = null;
  if (sections.length && (choppy.length || clipped.length)) {
    const counts = sections.map((sec) => ({
      sec,
      n: choppy.filter((j) => j.beat >= sec.startBeat && j.beat < sec.endBeat).length
        + clipped.filter((c) => c.beat >= sec.startBeat && c.beat < sec.endBeat).length,
    })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
    if (counts.length) worst = { name: counts[0].sec.name, count: counts[0].n };
  }
  const parts = [`legato ${legatoPct}% of joined notes`];
  if (choppy.length) parts.push(`${choppy.length} choppy join${choppy.length === 1 ? '' : 's'}`);
  if (clipped.length) parts.push(`${clipped.length} clipped ending${clipped.length === 1 ? '' : 's'} (first at bar ${barOf(clipped[0].beat)})`);
  return {
    legatoPct,
    joins: joins.length,
    choppy: choppy.length,
    clipped: clipped.length,
    worst,
    text: parts.join('; ') + (worst ? `. Roughest spot: ${worst.name}.` : '.'),
  };
}
