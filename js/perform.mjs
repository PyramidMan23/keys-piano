// Performance simulation (mastery item 9, council 08-24). DOM-free.
// A performance run is scored on CONTINUITY, not cleanliness: the longest
// unbroken run of sounded notes, how fast he recovers after an error, and a
// kept-going verdict. Wrong notes are deliberately NOT punished harder than
// usual; stopping is the enemy.

export class ContinuityTracker {
  constructor() {
    this.run = 0;
    this.longestRun = 0;
    this.correct = 0;
    this.errors = 0;
    this.recoveries = []; // beats from an error to the next sounded note
    this._errBeat = null; // first error of the current stumble
  }
  event(type, beat) {
    if (type === 'perfect' || type === 'good' || type === 'late') {
      this.correct++;
      this.run++;
      this.longestRun = Math.max(this.longestRun, this.run);
      if (this._errBeat != null) {
        this.recoveries.push(Math.max(0, beat - this._errBeat));
        this._errBeat = null;
      }
    } else if (type === 'wrong' || type === 'missed') {
      this.errors++;
      this.run = 0;
      // a stumble is measured from its FIRST error; pile-ups are one stumble
      if (this._errBeat == null) this._errBeat = beat;
    }
    // 'early' and 'duplicate' are neither progress nor stumble
  }
  result() {
    const avg = this.recoveries.length
      ? this.recoveries.reduce((a, v) => a + v, 0) / this.recoveries.length
      : 0;
    return {
      longestRun: this.longestRun,
      correct: this.correct,
      errors: this.errors,
      stumbles: this.recoveries.length + (this._errBeat != null ? 1 : 0),
      avgRecoveryBeats: +avg.toFixed(2),
      rating: keptGoingRating(avg, this.errors),
    };
  }
}

export function keptGoingRating(avgRecoveryBeats, errors) {
  if (errors === 0) return 'FLAWLESS. Never needed to recover.';
  if (avgRecoveryBeats <= 1) return 'UNSHAKEABLE. Mistakes cost you barely a beat.';
  if (avgRecoveryBeats <= 2) return 'SOLID. You kept the music moving.';
  return 'THE SHOW STOPPED. Keep the pulse: a wrong note is cheaper than silence.';
}
