// Gamification engine (14th council 2026-08-28, Mark's directive: "gamify
// everything... according to psychology"). The laws baked in:
//  - XP from VALUE, not volume: no per-note, per-lap or combo XP; one-time
//    sources dedupe on their ref. Every entry keeps its source event.
//  - "Game Level" is game progression, never a musicianship claim.
//  - Autonomy: three quests offered, the player CHOOSES one; declining costs
//    nothing. Weekly missions are chosen too, and never expire, they resume.
//  - Humane continuity: practice rhythm + personal best; freeze tokens are
//    manual and earned; a missed day gets fresh-start language, never shame.
//  - Every badge is an evidence cabinet entry; arcade stats are labelled so.
// Pure + DOM-free so all of it is node-testable.

const DAY = 86400000;

// ---- XP ----
export const XP = {
  proof: 50,          // a lesson's song proof banked (once per lesson)
  playable: 100,      // a song proven independently playable (once per song)
  songReview: 40,     // a due retention check passed (repeatable by design)
  sectionMastered: 30, // a section trainer ladder finished at 100% (once per song+section)
  lessonCleared: 40,  // teacher lesson transfer passed (once per lesson)
  questDone: 60,      // the chosen daily quest completed
  weeklyDone: 150,    // the chosen weekly mission completed
  calibrated: 20,     // latency calibration done (once)
  firstCleanRun: 25,  // first ≥85% timed full run of a song (once per song)
};
// quest/weekly rewards are once-per-period by REF (day / ISO week), a re-pick
// can never double-pay (Codex review P1, 2026-08-28)
const ONCE = new Set(['proof', 'playable', 'sectionMastered', 'lessonCleared', 'calibrated', 'firstCleanRun', 'questDone', 'weeklyDone']);

export function grantXp(st, src, ref, now) {
  if (!XP[src]) return null;
  // the BALANCE and the dedupe ledger are permanent; xpLog is display only
  // (capping the log must never delete earned XP or reopen one-time rewards)
  st.xpKeys ??= {};
  const key = src + '|' + (ref ?? '');
  if (ONCE.has(src) && st.xpKeys[key]) return null;
  st.xpKeys[key] = 1;
  st.xpTotal = (st.xpTotal ?? 0) + XP[src];
  const entry = { t: now, src, ref: ref ?? '', xp: XP[src] };
  (st.xpLog ??= []).push(entry);
  if (st.xpLog.length > 200) st.xpLog.shift();
  return entry;
}
export const totalXp = (st) => st.xpTotal ?? (st.xpLog ?? []).reduce((a, e) => a + e.xp, 0);
// triangular curve: level n needs 100·n(n+1)/2 total
export function gameLevel(total) {
  let level = 1, need = 100, base = 0;
  while (total >= base + need) { base += need; level++; need = level * 100; }
  return { level, into: total - base, next: need };
}

// ---- daily quests (choose ONE of three; deterministic per day) ----
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export function questsFor(st, day) {
  const ds = (st.dayStats ?? {})[day] ?? {};
  const pool = [
    { id: 'clean-run', label: 'One clean run', why: 'a full song, no waiting, ≥85%', done: (ds.cleanRuns ?? 0) >= 1 },
    { id: 'minutes10', label: '10 real minutes', why: 'time at the keys is the only currency', done: (ds.minutes ?? 0) >= 10 },
    { id: 'train-section', label: 'Master a section', why: 'ride one trainer ladder to 100%', done: (ds.sectionsMastered ?? 0) >= 1 },
  ];
  const lessonsDone = st.teacherLessons ?? {};
  const proofPending = Object.keys(lessonsDone).some((id) => !(st.pathProofs ?? {})[id]);
  if (proofPending) pool.push({ id: 'proof', label: 'Bank a song proof', why: 'a lesson is not real until it survives a song', done: (ds.proofsBanked ?? 0) >= 1 });
  const reviewDue = Object.values(st.playable ?? {}).some((p) => p.provenAt && p.dueAt && p.dueAt <= Date.parse(day + 'T23:59:59'));
  if (reviewDue) pool.push({ id: 'review', label: 'Still playable?', why: 'retention is tested, never assumed', done: (ds.reviewsPassed ?? 0) >= 1 });
  // seeded pick of 3, stable all day
  const seed = hash(day);
  const picked = [...pool].sort((a, b) => hash(day + a.id) - hash(day + b.id)).slice(0, 3);
  return picked.map((q) => ({ ...q, xp: XP.questDone, active: st.activeQuest?.day === day && st.activeQuest?.id === q.id }));
}
export function chooseQuest(st, day, id) {
  if (st.activeQuest?.day === day && st.activeQuest.done) return; // today's quest is already paid
  st.activeQuest = { day, id, done: false };
}
// call after any counter changes; grants XP once when the ACTIVE quest
// completes, ref is the DAY, so one quest reward per day, ever
export function settleQuest(st, day, now) {
  const aq = st.activeQuest;
  if (!aq || aq.day !== day || aq.done) return null;
  const q = questsFor(st, day).find((x) => x.id === aq.id);
  if (!q?.done) return null;
  aq.done = true;
  return grantXp(st, 'questDone', day, now);
}

// ---- weekly mission (choose one; resumable, never punitively reset) ----
export const isoWeek = (d) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y = t.getUTCFullYear();
  return y + '-W' + String(Math.ceil((((t - Date.UTC(y, 0, 1)) / DAY) + 1) / 7)).padStart(2, '0');
};
const inWeek = (t, week, now) => t && isoWeek(new Date(t)) === week;
export function weeklyOptions(st, week, now) {
  return [
    { id: 'playable1', label: 'Make one song truly yours', why: 'two clean days = independently playable',
      done: Object.values(st.playable ?? {}).some((p) => inWeek(p.provenAt, week, now)) },
    { id: 'proofs2', label: 'Bank two song proofs', why: 'skills only count inside real music',
      done: Object.values(st.pathProofs ?? {}).filter((p) => inWeek(p.at, week, now)).length >= 2 },
    { id: 'days3', label: 'Three practice days', why: 'rhythm beats bingeing',
      done: (st.days ?? []).filter((d) => isoWeek(new Date(d + 'T12:00:00')) === week).length >= 3 },
  ].map((m) => ({ ...m, xp: XP.weeklyDone }));
}
export function chooseWeekly(st, week, id) {
  if (st.weekly?.week === week && st.weekly.done) return; // this week's mission is paid
  if (st.weekly?.week === week && !st.weekly.done) { st.weekly.id = id; return; } // switch, don't reset payment
  st.weekly = { week, id, done: false };
}
// ref is the ISO WEEK: one mission reward per week, ever. An unfinished
// mission crossing into a new week re-bases (fresh week, same choice), it
// resumes, it never becomes impossible (Codex review P2).
export function rebaseWeekly(st, week) {
  if (st.weekly && !st.weekly.done && st.weekly.week !== week) st.weekly.week = week;
}
export function settleWeekly(st, week, now) {
  const w = st.weekly;
  if (!w || w.done) return null;
  const m = weeklyOptions(st, w.week, now).find((x) => x.id === w.id);
  if (!m?.done) return null;
  w.done = true;
  return grantXp(st, 'weeklyDone', w.week, now);
}

// ---- practice rhythm (humane continuity) ----
const localKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Frozen days live in their OWN ledger: they keep the rhythm alive but are
// never real practice days (they must not satisfy missions, the form-card
// cadence, or anything else that reads st.days. Codex review P1).
const rhythmDays = (st) => new Set([...(st.days ?? []), ...(st.frozenDays ?? [])]);
// current = consecutive days ending today (or yesterday, a rhythm is not
// broken until a whole day has passed without playing)
export function rhythmOf(st, today) {
  const days = rhythmDays(st);
  const d = new Date(today + 'T12:00:00');
  if (!days.has(today)) d.setDate(d.getDate() - 1);
  let cur = 0;
  while (days.has(localKey(d))) { cur++; d.setDate(d.getDate() - 1); }
  const best = Math.max(st.bestRhythm ?? 0, cur);
  return { current: cur, best, freezes: st.freezeTokens ?? 0 };
}
// a freeze is OFFERED (never forced) when yesterday broke a rhythm ≥3
export function freezeOffer(st, today) {
  if ((st.freezeTokens ?? 0) < 1) return null;
  const days = rhythmDays(st);
  const d = new Date(today + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  const yesterday = localKey(d);
  if (days.has(yesterday)) return null; // nothing broke
  d.setDate(d.getDate() - 1);
  let run = 0;
  while (days.has(localKey(d))) { run++; d.setDate(d.getDate() - 1); }
  return run >= 3 ? { yesterday, wouldKeep: run + 1 } : null;
}
export function useFreeze(st, yesterday) {
  if ((st.freezeTokens ?? 0) < 1) return false;
  st.freezeTokens--;
  (st.frozenDays ??= []).push(yesterday);
  return true;
}
export function earnFreeze(st, cap = 3) {
  st.freezeTokens = Math.min(cap, (st.freezeTokens ?? 0) + 1);
}

// ---- assessment vocabulary (one voice everywhere judgment lives) ----
export function verdictWord(st, songId) {
  if (st.playable?.[songId]?.provenAt) return 'Playable independently';
  const s = st.songs?.[songId];
  if (!s || !s.plays) return 'Not yet assessed';
  return (s.best ?? 0) >= 85 ? 'One clean day banked' : 'Needs work';
}

// ---- badges: an evidence cabinet, never hue-only ----
export function badges(st, songs = []) {
  const out = [];
  const proofs = Object.entries(st.pathProofs ?? {});
  if (proofs.length) out.push({ id: 'first-proof', word: 'First proof', shape: '🎵', evidence: proofs[0][1] });
  const playable = Object.entries(st.playable ?? {}).filter(([, p]) => p.provenAt);
  if (playable.length) out.push({ id: 'first-playable', word: 'First playable song', shape: '🏆', evidence: { songId: playable[0][0], at: playable[0][1].provenAt } });
  for (const [id, p] of playable) {
    const s = songs.find((x) => x.id === id);
    out.push({ id: 'playable:' + id, word: (s?.title ?? id) + ' · playable', shape: '🏆', evidence: { songId: id, at: p.provenAt } });
  }
  if (st.calibratedAt) out.push({ id: 'calibrated', word: 'Calibrated', shape: '🎯', evidence: { at: st.calibratedAt, offsetMs: st.calOffsetMs } });
  if ((st.bestRhythm ?? 0) >= 7) out.push({ id: 'rhythm7', word: '7-day rhythm', shape: '🔥', evidence: { best: st.bestRhythm } });
  const lessons = Object.keys(st.teacherLessons ?? {}).length;
  if (lessons >= 5) out.push({ id: 'foundation', word: 'Foundation complete', shape: '🎓', evidence: st.teacherLessons });
  // arcade stats are honest fun, labelled as arcade, never competence claims
  const bestCombo = Math.max(0, ...Object.values(st.songs ?? {}).map((s) => s.bestCombo ?? 0));
  if (bestCombo >= 50) out.push({ id: 'combo50', word: bestCombo + ' note streak', shape: '⚡', arcade: true, evidence: { bestCombo } });
  return out;
}

// ---- song journeys (goal-gradient milestones; pilot: See You Again Easy) ----
export const JOURNEYS = {
  'see-you-again-easy': [
    { name: 'The riff', section: 'Riff', hand: 'R', wait: true, pass: 'finish' },
    { name: 'Chorus melody', section: 'Chorus', hand: 'R', wait: true, pass: 'finish' },
    { name: 'Hands together', section: null, hand: 'both', wait: true, pass: 'finish' },
    { name: 'Full run', section: null, hand: 'both', wait: false, pass: 'run85' },
    { name: 'Prove it', section: null, hand: 'both', wait: false, pass: 'playable' },
  ],
};
export function journeyState(st, songId) {
  const steps = JOURNEYS[songId];
  if (!steps) return null;
  const step = st.journeys?.[songId]?.step ?? 0;
  return { steps, step: Math.min(step, steps.length) };
}
export function journeyAdvance(st, songId) {
  const steps = JOURNEYS[songId];
  if (!steps) return null;
  const j = ((st.journeys ??= {})[songId] ??= { step: 0 });
  if (j.step < steps.length) j.step++;
  return j.step;
}
