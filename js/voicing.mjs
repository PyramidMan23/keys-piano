// Voicing balance (mastery item 4, council 08-24). DOM-free. Every current
// song is melody(R) over accompaniment(L), so the question is simple: did the
// melody stand above the accompaniment? Judged ONLY through the touch
// calibration (item 1); raw velocity comparisons across registers are false
// precision and are refused here by design.

import { calibratedLevel } from './touch.mjs';

export const VOICING_MARGIN = 0.06;  // melody must sit this far above on the 0..1 scale
export const WINDOW_BEATS = 8;       // rolling judgement window

// playLog: engine entries with vel. Returns null when it cannot judge honestly
// (no calibration, or not enough two-hand velocity data).
export function analyzeVoicing(playLog, cal, { windowBeats = WINDOW_BEATS } = {}) {
  if (!cal?.zones) return null;
  const withVel = playLog.filter((e) => e.vel != null && e.vel > 0);
  if (!withVel.length) return null;
  const maxBeat = Math.max(...withVel.map((e) => e.b));
  const windows = [];
  for (let start = 0; start <= maxBeat; start += windowBeats) {
    const inWin = withVel.filter((e) => e.b >= start && e.b < start + windowBeats);
    const rh = inWin.filter((e) => e.h === 'R').map((e) => calibratedLevel(cal, e.m, e.vel));
    const lh = inWin.filter((e) => e.h === 'L').map((e) => calibratedLevel(cal, e.m, e.vel));
    if (rh.length < 2 || lh.length < 2) continue; // not enough of both voices to judge
    const mean = (xs) => xs.reduce((a, v) => a + v, 0) / xs.length;
    const diff = mean(rh) - mean(lh);
    windows.push({ startBeat: start, diff, above: diff >= VOICING_MARGIN });
  }
  if (windows.length < 2) return null;
  const abovePct = Math.round((windows.filter((w) => w.above).length / windows.length) * 100);
  const worst = windows.reduce((a, w) => (a == null || w.diff < a.diff ? w : a), null);
  return { windows: windows.length, abovePct, worst };
}

export function voicingText(res, timeSigBeats = 4) {
  if (!res) return null;
  const bar = Math.floor(res.worst.startBeat / timeSigBeats) + 1;
  const verdict = res.abovePct >= 80 ? 'The melody led.'
    : res.abovePct >= 50 ? 'The melody led most of the time; keep the left hand under it.'
    : 'The accompaniment buried the melody: play the right hand out, left hand softer.';
  return `Melody stood above the accompaniment ${res.abovePct}% of the time (weakest around bar ${bar}). ${verdict}`;
}
