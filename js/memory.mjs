// Staged memory transfer (mastery item 7, council 08-24). DOM-free stage
// machine. A section is memorized by climbing five stages of cue removal:
//   score  -> reduced (letters off, score dimmed) -> landmarks (bar-first
//   notes only) -> blank (metronome only) -> random-start recall.
// Random-start cures motor-chain-only memory: if you can only play it from
// the top, you have a chain, not a map. Pass rule matches the trainer:
// two laps at >= 85% accuracy with zero wrong notes per stage.

export const MEM_STAGES = [
  { key: 'score', label: 'score visible' },
  { key: 'reduced', label: 'reduced cues' },
  { key: 'landmarks', label: 'landmarks only' },
  { key: 'blank', label: 'blank, metronome only' },
  { key: 'recall', label: 'random-start recall' },
];
export const MEM_PASS_ACC = 85;

// What each stage lets the renderers show. The falls renderer honours
// letters/filter; the score surface honours dim; hint/targets are cues too.
export function memCues(stageIdx) {
  const key = MEM_STAGES[Math.max(0, Math.min(MEM_STAGES.length - 1, stageIdx))].key;
  return {
    letters: key === 'score',                       // note names inside pills
    dimScore: key !== 'score',                      // score at 50% when visible
    noteFilter: key === 'landmarks' ? 'landmarks' : (key === 'blank' || key === 'recall') ? 'none' : null,
    hints: key === 'score',                         // wait-mode "Press C4" text
    targets: key === 'score' || key === 'reduced',  // pulsing due-key highlight
    metronome: key === 'blank' || key === 'recall',
    randomStart: key === 'recall',
  };
}

// rec: {stage, passes}. A clean lap (>=85, 0 wrong) twice moves a stage up;
// any other lap resets the pass count for that stage.
export function memAdvance(rec, lapAcc, lapWrong) {
  const r = { stage: 0, passes: 0, ...rec };
  if (lapWrong === 0 && lapAcc >= MEM_PASS_ACC) {
    r.passes++;
    if (r.passes >= 2) {
      r.passes = 0;
      if (r.stage >= MEM_STAGES.length - 1) return { rec: r, cleared: true, stageUp: false, done: true };
      r.stage++;
      return { rec: r, cleared: true, stageUp: true, done: false };
    }
    return { rec: r, cleared: true, stageUp: false, done: false };
  }
  r.passes = 0;
  return { rec: r, cleared: false, stageUp: false, done: false };
}

// Recall stage: name a bar to start from. Returns the 1-based bar number in
// the SONG (what the app tells Mark) and the loop start beat.
export function randomStartBar(section, timeSigBeats, rng = Math.random) {
  const bars = Math.max(1, Math.floor((section.endBeat - section.startBeat) / timeSigBeats));
  const barIdx = Math.floor(rng() * bars);
  const startBeat = section.startBeat + barIdx * timeSigBeats;
  return { bar: Math.floor(startBeat / timeSigBeats) + 1, startBeat };
}
