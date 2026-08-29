// Sustain pedal analysis (mastery item 2, council 08-24). DOM-free: given the
// engine's pedal transition log and play log, flag the three teachable pedal
// faults. Pedal feedback is OBSERVATIONAL unless a song section opts in with
// a `pedal: true` flag; we never invent pedal markings for songs without one.

export const LATE_CHANGE_MS = 150; // pedal held this long past a harmony change = smear
export const BLUR_PITCH_CLASSES = 6; // distinct pitch classes under one pedal = mud risk

// Harmony changes, heard not guessed: the moments the LEFT hand lands a bass
// note with a different pitch class than the previous one. That is where a
// pedal change is due.
export function harmonyChanges(playLog) {
  const lh = playLog.filter((e) => e.h === 'L').sort((a, b) => a.onMs - b.onMs);
  const out = [];
  let prevPc = null;
  for (const e of lh) {
    const pc = e.m % 12;
    if (prevPc != null && pc !== prevPc) out.push({ timeMs: e.onMs, beat: e.b });
    prevPc = pc;
  }
  return out;
}

export function pedalStateAt(pedalLog, timeMs) {
  let down = false;
  for (const ev of pedalLog) {
    if (ev.timeMs > timeMs) break;
    down = ev.down;
  }
  return down;
}

// findings: [{type:'late'|'blur'|'gap', beat, ...}]
export function analyzePedal(pedalLog, playLog, { sections = [] } = {}) {
  const findings = [];
  if (pedalLog.length) {
    // (a) late changes: pedal down at a harmony change and still down 150ms later
    for (const hc of harmonyChanges(playLog)) {
      if (!pedalStateAt(pedalLog, hc.timeMs)) continue;
      const lifted = pedalLog.some((ev) => !ev.down && ev.timeMs > hc.timeMs && ev.timeMs <= hc.timeMs + LATE_CHANGE_MS);
      if (!lifted) findings.push({ type: 'late', beat: hc.beat });
    }
    // (b) blur risk: distinct pitch classes accumulating under one held pedal
    const events = [
      ...playLog.map((e) => ({ t: e.onMs, kind: 'note', pc: e.m % 12, beat: e.b })),
      ...pedalLog.map((e) => ({ t: e.timeMs, kind: e.down ? 'down' : 'up' })),
    ].sort((a, b) => a.t - b.t);
    let down = false, pcs = new Set(), startBeat = null, flagged = false;
    for (const ev of events) {
      if (ev.kind === 'down') { down = true; pcs = new Set(); startBeat = null; flagged = false; }
      else if (ev.kind === 'up') { down = false; }
      else if (down) {
        pcs.add(ev.pc);
        startBeat ??= ev.beat;
        if (pcs.size >= BLUR_PITCH_CLASSES && !flagged) {
          findings.push({ type: 'blur', beat: startBeat, pcs: pcs.size });
          flagged = true; // one flag per pedal hold, not one per extra note
        }
      }
    }
  }
  // (c) gaps: only sections that opted in with pedal: true may complain.
  // Pedal was "used in the section" if it was already down entering it, or
  // went down anywhere inside it.
  const stateAtBeat = (beat) => {
    let down = false;
    for (const ev of pedalLog) { if (ev.beat > beat) break; down = ev.down; }
    return down;
  };
  for (const sec of sections) {
    if (!sec.pedal) continue;
    const used = stateAtBeat(sec.startBeat)
      || pedalLog.some((ev) => ev.down && ev.beat >= sec.startBeat && ev.beat < sec.endBeat);
    if (!used) findings.push({ type: 'gap', section: sec.name, beat: sec.startBeat });
  }
  return findings;
}

// Human sentences for the results screen. No nagging tone, no hue-only signal.
export function pedalNotes(findings, barOf = (b) => Math.floor(b / 4) + 1) {
  const notes = [];
  const late = findings.filter((f) => f.type === 'late');
  const blur = findings.filter((f) => f.type === 'blur');
  const gaps = findings.filter((f) => f.type === 'gap');
  if (late.length) notes.push(`Pedal held through ${late.length} harmony change${late.length === 1 ? '' : 's'} (first at bar ${barOf(late[0].beat)}). Lift AS the new chord lands, catch it just after.`);
  if (blur.length) notes.push(`Blur risk ${blur.length}x: ${blur[0].pcs}+ different notes rang under one pedal from bar ${barOf(blur[0].beat)}. Change pedal more often there.`);
  for (const g of gaps) notes.push(`"${g.section}" is marked legato but the pedal stayed up. Try syncopated pedalling through it.`);
  return notes;
}
