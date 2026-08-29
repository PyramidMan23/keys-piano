// Touch diagnostic: per-key velocity calibration (mastery item 1, council
// 2026-08-24). The P-45's action is not uniform across the range and neither
// is Mark's hand, so raw velocity thresholds are false precision. A guided
// diagnostic samples 8 keys across the range at three dynamics; we store the
// median velocity per dynamic per register ZONE and every later dynamics
// judgement maps raw velocity through that calibration. DOM-free.

export const TOUCH_KEYS = [36, 43, 48, 55, 60, 67, 72, 84]; // C2 G2 C3 G3 C4 G4 C5 C6
export const DYNAMICS = ['soft', 'medium', 'strong'];
export const STRIKES_PER = 3;

// Register zones: two sampled keys land in each, so a zone median rests on 6 strikes.
export const ZONES = [
  { lo: 21, hi: 47, name: 'low' },
  { lo: 48, hi: 59, name: 'mid-low' },
  { lo: 60, hi: 71, name: 'mid-high' },
  { lo: 72, hi: 108, name: 'high' },
];

export function zoneOf(midi) {
  for (let i = 0; i < ZONES.length; i++) if (midi >= ZONES[i].lo && midi <= ZONES[i].hi) return i;
  return midi < 21 ? 0 : ZONES.length - 1;
}

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
};

// Guided flow: all sampled keys at soft, then medium, then strong; STRIKES_PER
// strikes each. Strikes on any key other than the one asked for are ignored,
// never punished (reaching for the wrong key is not a dynamics fact).
export class TouchDiagnostic {
  constructor() {
    this.steps = [];
    for (const dyn of DYNAMICS) for (const key of TOUCH_KEYS) this.steps.push({ key, dyn });
    this.idx = 0;
    this.count = 0; // strikes recorded on the current step
    this.samples = []; // {key, zone, dyn, vel}
  }

  get done() { return this.idx >= this.steps.length; }

  current() {
    if (this.done) return null;
    const s = this.steps[this.idx];
    return { key: s.key, dyn: s.dyn, strike: this.count + 1, of: STRIKES_PER, step: this.idx + 1, steps: this.steps.length };
  }

  strike(midi, velocity) {
    if (this.done) return { accepted: false, done: true };
    const s = this.steps[this.idx];
    if (midi !== s.key) return { accepted: false, done: false };
    if (!(velocity >= 1 && velocity <= 127)) return { accepted: false, done: false };
    this.samples.push({ key: s.key, zone: zoneOf(s.key), dyn: s.dyn, vel: velocity });
    this.count++;
    if (this.count >= STRIKES_PER) { this.idx++; this.count = 0; }
    return { accepted: true, done: this.done };
  }
}

// Medians per zone per dynamic. A zone is only trustworthy when its medians
// rise soft < medium < strong; zones that fail land in `problems` and the
// diagnostic should be redone rather than stored.
export function buildCalibration(samples, date = null) {
  const zones = ZONES.map(() => ({ soft: null, medium: null, strong: null }));
  for (let z = 0; z < ZONES.length; z++) {
    for (const dyn of DYNAMICS) {
      zones[z][dyn] = median(samples.filter((s) => s.zone === z && s.dyn === dyn).map((s) => s.vel));
    }
  }
  const problems = [];
  for (let z = 0; z < zones.length; z++) {
    const { soft, medium, strong } = zones[z];
    if (soft == null || medium == null || strong == null || !(soft < medium && medium < strong)) problems.push(z);
  }
  return { cal: { v: 1, date, zones }, problems };
}

// Which dynamic is this strike, for this key, for THIS player? Thresholds sit
// midway between the zone's medians.
export function classifyDynamic(cal, midi, velocity) {
  const z = cal.zones[zoneOf(midi)];
  if (velocity < (z.soft + z.medium) / 2) return 'soft';
  if (velocity < (z.medium + z.strong) / 2) return 'medium';
  return 'strong';
}

// Continuous calibrated level on 0..1: the zone's soft median maps to 0.25,
// medium to 0.5, strong to 0.75, piecewise-linear between and beyond, clamped.
// This is the register-independent scalar the voicing analysis compares.
export function calibratedLevel(cal, midi, velocity) {
  const z = cal.zones[zoneOf(midi)];
  const pts = [[z.soft, 0.25], [z.medium, 0.5], [z.strong, 0.75]];
  let lvl;
  if (velocity <= pts[0][0]) lvl = 0.25 * (velocity / pts[0][0]);
  else if (velocity >= pts[2][0]) lvl = 0.75 + 0.25 * ((velocity - pts[2][0]) / Math.max(1, 127 - pts[2][0]));
  else {
    const [a, b] = velocity <= pts[1][0] ? [pts[0], pts[1]] : [pts[1], pts[2]];
    lvl = a[1] + (b[1] - a[1]) * ((velocity - a[0]) / Math.max(1, b[0] - a[0]));
  }
  return Math.min(1, Math.max(0, lvl));
}
