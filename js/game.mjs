import { SKILL_BY_ID, competence, competenceLine, songEvidence } from './teacher.mjs';
import { beatsPerBar } from './meter.mjs';
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
  passageIndependent: 25,
  passageRetention: 40,
  transfer: 40,       // a day-later unaided check on an undrilled passage passed: the mastery upgrade (18th council)
  // ---- the learning wave (2026-09-13) --------------------------------------
  // Still ONE currency, still paid for VALUE. Every one of these is one-time by
  // a ref that names the thing done, so replaying a quest rung, re-reading the
  // same exercise, or opening a lesson twice pays exactly nothing. There is no
  // source here for opening, viewing or listening to anything.
  readFirst: 35,      // a first reading finished with the evidence intact (once per piece of material)
  questRung: 20,      // one quest rung passed (once per quest+rung)
  questRecall: 30,    // a quest's delayed-recall rung passed a day later (once per quest)
  questTransfer: 45,  // a quest applied to material it was never drilled on (once per quest)
};
// quest/weekly rewards are once-per-period by REF (day / ISO week), a re-pick
// can never double-pay (Codex review P1, 2026-08-28)
const ONCE = new Set(['proof', 'playable', 'sectionMastered', 'lessonCleared', 'calibrated', 'firstCleanRun', 'questDone', 'weeklyDone', 'transfer', 'passageIndependent', 'passageRetention',
  'readFirst', 'questRung', 'questRecall', 'questTransfer']);

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
    { id: 'passage-check', label: 'Pass a passage check', why: 'both hands, full tempo, help off, at least 85%', done: (ds.passageChecks ?? 0) >= 1 },
    { id: 'train-section', label: 'Master a section', why: 'ride one trainer ladder to 100%', done: (ds.sectionsMastered ?? 0) >= 1 },
  ];
  const lessonsDone = st.teacherLessons ?? {};
  const proofPending = Object.keys(lessonsDone).some((id) => !(st.pathProofs ?? {})[id]);
  if (proofPending) pool.push({ id: 'proof', label: 'Bank a song proof', why: 'a lesson is not real until it survives a song', done: (ds.proofsBanked ?? 0) >= 1 });
  // The learning wave's two quests join the pool only once the learner has
  // actually opened those lanes. An offer for a surface nobody has met is not
  // autonomy, it is noise, and the three-of-a-pool shape is the council's.
  if ((st.sight?.reads ?? []).length) pool.push({ id: 'first-reading', label: 'One first reading', why: 'music you have never seen, read straight through, help off', done: (ds.firstReads ?? 0) >= 1 });
  if (Object.keys(st.quests ?? {}).length) pool.push({ id: 'quest-rung', label: 'Clear a quest rung', why: 'one rung of one skill, played not read about', done: (ds.questRungs ?? 0) >= 1 });
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
  const q = questsFor(st, day).find((x) => x.id === aq.id)
    ?? (aq.id === 'minutes10' ? {done:(st.dayStats?.[day]?.minutes ?? 0) >= 10} : null); // honour an already chosen legacy goal
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
  return competenceLine(songEvidence(st, songId));
}

// ---- badges: an evidence cabinet, never hue-only ----
export function badges(st, songs = []) {
  const out = [];
  const proofs = Object.entries(st.pathProofs ?? {});
  if (proofs.length) out.push({ id: 'first-proof', word: 'First proof', shape: '◆', evidence: proofs[0][1] });
  const playable = Object.entries(st.playable ?? {}).filter(([, p]) => p.provenAt);
  if (playable.length) out.push({ id: 'first-playable', word: 'First playable song', shape: '★', evidence: { songId: playable[0][0], at: playable[0][1].provenAt } });
  for (const [id, p] of playable) {
    const s = songs.find((x) => x.id === id);
    out.push({ id: 'playable:' + id, word: (s?.title ?? id) + ' · playable', shape: '★', evidence: { songId: id, at: p.provenAt } });
  }
  // Run C: dated ability rows include assisted and first independent passes.
  for (const id of Object.keys(st.songs ?? {})) {
    const earned = competence(songEvidence(st,id));
    if (!earned || playable.some(([key]) => key === id)) continue;
    const song = songs.find(s => s.id === id);
    out.push({id:'competence:'+id, word:(song?.title ?? id) + ' · ' + earned.word,
      shape:earned.word === 'with help' ? '◑' : earned.word === 'alone' ? '●' : '★',
      evidence:{songId:id, at:earned.at, line:competenceLine(songEvidence(st,id))}});
  }
  for (const [id, record] of Object.entries(st.mastery ?? {})) {
    const earned = competence(record);
    if (earned) out.push({id:'skill:'+id, word:(SKILL_BY_ID[id]?.name ?? id) + ' / ' + earned.word,
      shape:earned.word === 'with help' ? '◑' : earned.word === 'alone' ? '●' : '★',
      evidence:{at:earned.at, line:competenceLine(record)}});
  }
  for (const badge of out) {
    if (!badge.id.startsWith('playable:') && badge.id !== 'first-playable') continue;
    const earned = competence(songEvidence(st,badge.evidence.songId));
    const song = songs.find(s => s.id === badge.evidence.songId);
    badge.word = (song?.title ?? badge.evidence.songId) + ' · ' + (earned?.word ?? 'Not checked yet');
    badge.evidence.line = competenceLine(songEvidence(st,badge.evidence.songId));
  }
  if (st.calibratedAt) out.push({ id: 'calibrated', word: 'Calibrated', shape: '◎', evidence: { at: st.calibratedAt, offsetMs: st.calOffsetMs } });
  if ((st.bestRhythm ?? 0) >= 7) out.push({ id: 'rhythm7', word: '7-day rhythm', shape: '●', evidence: { best: st.bestRhythm } });
  const lessons = Object.keys(st.teacherLessons ?? {}).length;
  if (lessons >= 5) out.push({ id: 'foundation', word: 'Foundation complete', shape: '■', evidence: st.teacherLessons });
  const blocks = (st.blocks ?? []).filter(isPerformedBlock);
  if (blocks.length) out.push({ id: 'blocks', word: blocks.length + ' practice block' + (blocks.length === 1 ? '' : 's'), shape: '▮', evidence: { count: blocks.length, last: blocks[blocks.length - 1] } });
  // arcade stats are honest fun, labelled as arcade, never competence claims
  const bestCombo = Math.max(0, ...Object.values(st.songs ?? {}).map((s) => s.bestCombo ?? 0));
  if (bestCombo >= 50) out.push({ id: 'combo50', word: bestCombo + ' note streak', shape: '▲', arcade: true, evidence: { bestCombo } });
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
// EVERY SONG HAS A JOURNEY (17th council, 2026-09-06: the ten-session trial).
// The drawn strip (Hear it, Right hand, Left hand, Both hands, Full run, a
// Next step button) was lit for ONE pilot song; every other song opened as a
// whole-song run with no unit of work smaller than "play it". The generic
// ladder is built from the song's own sections: hear it, then per section
// each hand alone and then together with help on, then a full run with help
// off, then the playable proof. Each step is one declared target with one
// verdict, which is exactly a completed practice block. An authored entry in
// JOURNEYS still wins.
export function journeyFor(song) {
  if (!song) return null;
  if (JOURNEYS[song.id]) return JOURNEYS[song.id];
  const secs = song.sections ?? [];
  const notes = song.notes ?? [];
  const hasHand = (h, sec) => notes.some((n) => n.h === h && (!sec || (n.b >= sec.startBeat && n.b < sec.endBeat)));
  const steps = [{ name: 'Hear it', section: secs[0]?.name ?? null, hand: 'both', wait: true, pass: 'hear' }];
  const units = secs.length ? secs : [null];
  for (const sec of units) {
    const tag = sec ? ' · ' + sec.name.replace(/,.*$/, '') : '';
    const both = hasHand('L', sec) && hasHand('R', sec);
    if (both) {
      steps.push({ name: 'Right hand' + tag, section: sec?.name ?? null, hand: 'R', wait: true, pass: 'lap70' });
      steps.push({ name: 'Left hand' + tag, section: sec?.name ?? null, hand: 'L', wait: true, pass: 'lap70' });
    }
    steps.push({ name: (both ? 'Both hands' : 'Play it') + tag, section: sec?.name ?? null, hand: 'both', wait: true, pass: 'lap70' });
  }
  steps.push({ name: 'Full run', section: null, hand: 'both', wait: false, pass: 'run85' });
  steps.push({ name: 'Prove it', section: null, hand: 'both', wait: false, pass: 'playable' });
  return steps;
}
export function journeyState(st, song) {
  // accepts a song or, for the pilot's older callers, an id
  const id = typeof song === 'string' ? song : song?.id;
  const steps = typeof song === 'string' ? JOURNEYS[song] : journeyFor(song);
  if (!steps || !id) return null;
  const step = st.journeys?.[id]?.step ?? 0;
  return { steps, step: Math.min(step, steps.length) };
}
// A single prescription for the controls, instruction and saved-step return.
export function journeyPlan(st, song) {
  const j = journeyState(st, song), step = j?.steps[j.step];
  if (!step) return null;
  const section = (song.sections ?? []).findIndex((s) => s.name === step.section);
  const hands = { R: 'right hand', L: 'left hand', both: 'both hands' };
  const target = step.pass === 'hear' ? 'Listen to at least 80% of this passage.'
    : step.pass === 'finish' ? 'Reach the end of the passage.'
    : step.pass === 'lap70' ? 'Complete one pass with at least 70% accuracy.'
    : step.pass === 'run85' ? 'Complete one full run with at least 85% accuracy.'
    : 'Pass at least 85% at full tempo on two different days, with help off.';
  return { step: j.step, name: step.name, section: section < 0 ? '' : String(section),
    hand: step.hand, wait: step.wait, tempo: 100, listen: step.pass === 'hear',
    instruction: `${step.section ?? 'Whole song'}, ${hands[step.hand]}, help ${step.wait ? 'on' : 'off'}, full tempo. ${target}`,
    action: step.pass === 'hear' ? 'Listen to this passage' : 'Start this step',
    resume: `Library; resume at ${step.name}` };
}
export function journeySettingsMatch(plan, settings) {
  return !!plan && plan.section === settings.section && plan.hand === settings.hand &&
    plan.wait === settings.wait && plan.tempo === Number(settings.tempo) && settings.chunk == null;
}
export function journeyAttemptMatches(song, step, engine) {
  const section = step.section ? song.sections?.find(s=>s.name===step.section) : null;
  const start = section?.startBeat ?? 0;
  const end = section?.endBeat ?? Math.max(...song.notes.map(n=>n.b+n.d));
  return engine.hand === step.hand && engine.startBeat === start && engine.endBeat === end &&
    (!['run85','playable'].includes(step.pass) || (engine.tempo === 1 && !engine.waitMode));
}
export function firstPhrasePlan(song, experience) {
  if (!song || song.level?.toLowerCase() !== 'easy' || song.freeTime) return null;
  const start = song.barBeats?.[0] ?? 0;
  const end = song.barBeats?.[4] ?? start + 4 * beatsPerBar(song);
  if (Math.max(...song.notes.map(n=>n.b+n.d)) < end) return null;
  const hand = experience === 'returning' ? 'both' : 'R';
  const notes = song.notes.filter(n=>n.b>=start && n.b<end && (hand==='both' || n.h===hand));
  if (!notes.length) return null;
  return {songId:song.id,start,end,hand,wait:true,tempo:1,pass:70,
    keys:[...new Set(notes.map(n=>n.m))].sort((a,b)=>a-b)};
}
export function firstRunEligible(st) {
  return !st.firstRunDone && !st.lastSession && !st.diagnosticDone && !(st.days?.length) &&
    !Object.values(st.songs ?? {}).some(s => (s?.plays ?? 0) > 0 || (s?.ms ?? 0) > 0);
}
// The strip shows ONE section's ladder, not the whole song's: hear it, the
// current section's steps, the two closing steps. Six cells at most, which is
// what the design drew room for; finished sections fold away.
export function journeyWindow(st, song) {
  const js = journeyState(st, song);
  if (!js) return null;
  const cur = js.steps[js.step];
  const curSec = cur?.section ?? null;
  const shown = js.steps.map((s, i) => ({ s, i })).filter(({ s, i }) =>
    i === 0 || s.section === null || s.section === curSec || (cur && cur.section === null && i >= js.step));
  const idx = shown.findIndex(({ i }) => i === js.step);
  return { steps: shown.map(({ s }) => s), step: idx < 0 ? shown.length : idx, all: js };
}
export function journeyAdvance(st, song, evidence = null) {
  const id = typeof song === 'string' ? song : song?.id;
  const steps = typeof song === 'string' ? JOURNEYS[song] : journeyFor(song);
  if (!steps || !id) return null;
  const j = ((st.journeys ??= {})[id] ??= { step: 0 });
  if (j.step < steps.length) {
    const step=steps[j.step];
    if (evidence && Number.isFinite(evidence.acc) && step.pass !== 'hear') {
      (j.passes ??= []).push({...step,...evidence});
      if (j.passes.length > 100) j.passes.shift();
    }
    j.step++;
  }
  return j.step;
}

// ---- completed practice blocks (17th council) ----------------------------
// A block is a declared target, an attempt and a recorded verdict. It is the
// unit the ledger counts. It is NOT "focused hours": the council would not let
// a block claim anything about attention, and elapsed time stays a separate
// number. Sources: a journey step passed, a trained section passed, a lesson
// level passed, a path task finished, a transfer check passed.
export function recordBlock(st, kind, ref, now = Date.now()) {
  (st.blocks ??= []).push({ t: now, kind, ref });
  if (st.blocks.length > 2000) st.blocks.splice(0, st.blocks.length - 2000);
  return st.blocks.length;
}
export const isPerformedBlock = (b) => b.kind !== 'listening' && !(b.kind === 'journey' && b.ref?.endsWith('|Hear it'));
export function blockCount(st, sinceMs = 0, kind = 'practice') {
  return (st.blocks ?? []).filter((b) => b.t >= sinceMs && (kind === 'listening' ? b.kind === 'listening' : isPerformedBlock(b))).length;
}

// ---- three strands of evidence, never one number (2026-09-13) -------------
// Reading, repertoire and musical skill are different things and the app had
// one word for all three. A song played beautifully from memory says nothing
// about reading; a clean first reading says nothing about repertoire. So they
// are counted apart, they are counted from EVENTS, and an empty strand says
// "not checked yet" rather than zero-as-a-score.
//
// The READING half deliberately owns no ledger of its own. js/reading-session.mjs
// already records every read with its conditions, its contaminants and its three
// separate dimensions, under `state.sight`; a second copy here would be a second
// truth, and the first thing to disagree. So this reads THAT ledger's own
// `readingSummary()` output, which the caller passes in.

// A first reading comes back around after two days: the point is fresh
// material often, not a daily quota, and nothing is lost by skipping it.
export const READ_FRESH_GAP = 2 * DAY;
// Straight off reading-session's reads[]: the last CLEAN INDEPENDENT read.
export function lastIndependentRead(st) {
  const reads = st.sight?.reads ?? [];
  return reads.filter((r) => r.independent && r.verdict === 'clean').at(-1)?.t ?? 0;
}
export function freshReadDue(st, now = Date.now()) {
  const reads = st.sight?.reads ?? [];
  if (!reads.length) return false;               // the lane has never been used
  return now - (lastIndependentRead(st) || reads.at(-1).t) >= READ_FRESH_GAP;
}

// One quest rung banked. Rungs are named by the quest catalogue; this only
// records that a named rung of a named quest was passed, and when.
export function recordQuestRung(st, questId, rung, opts = {}, now = Date.now()) {
  const q = ((st.quests ??= {})[questId] ??= { rungs: {}, fails: 0 });
  if (!q.rungs || typeof q.rungs !== 'object') q.rungs = {};
  q.lastAt = now;
  if (!opts.passed) { q.fails = (q.fails ?? 0) + 1; q.lastFailAt = now; return q; }
  // First pass of a rung is the one that dates it. A replay refreshes `lastAt`
  // and nothing else: it cannot backfill a stage or re-open a reward.
  q.rungs[rung] ??= { at: now, assisted: !!opts.assisted, novel: !!opts.novel };
  if (opts.due) q.dueAt = opts.due;
  else if (rung === 'independent' && !q.rungs.recall) q.dueAt = now + DAY;
  return q;
}
export const questRungPassed = (st, questId, rung) => !!st.quests?.[questId]?.rungs?.[rung];
export function questDue(st, now = Date.now()) {
  return Object.entries(st.quests ?? {})
    .filter(([, q]) => q.dueAt && q.dueAt <= now && !q.rungs?.recall)
    .sort((a, b) => a[1].dueAt - b[1].dueAt)
    .map(([id]) => id);
}

// The three strands, each with its own word and its own evidence line. Missing
// evidence is UNKNOWN. Nothing here is derived from another strand.
// `summary` is reading-session's readingSummary(state.sight), passed in so this
// module keeps no second copy of the reading ledger.
export function evidenceStrands(st, summary = null) {
  const levels = summary?.levels ?? [];
  const independentReads = levels.reduce((a, l) => a + (l.independentCleans ?? 0), 0);
  const guidedReads = levels.reduce((a, l) => a + (l.guidedCleans ?? 0), 0);
  const proven = Object.values(st.playable ?? {}).filter((p) => p.provenAt).length;
  const quests = Object.values(st.quests ?? {});
  const rungs = quests.reduce((a, q) => a + Object.keys(q.rungs ?? {}).length, 0);
  const transfers = quests.filter((q) => q.rungs?.transfer).length;
  return [
    { id: 'reading', name: 'Reading',
      line: independentReads ? `${independentReads} clean read${independentReads === 1 ? '' : 's'} of music you had not seen` : null,
      detail: guidedReads ? `${guidedReads} clean guided read${guidedReads === 1 ? '' : 's'}`
        : summary?.legacy?.reads ? `${summary.legacy.reads} earlier reads, conditions not recorded` : null },
    { id: 'repertoire', name: 'Repertoire',
      line: proven ? `${proven} song${proven === 1 ? '' : 's'} proven playable` : null,
      detail: (st.blocks ?? []).filter(isPerformedBlock).length
        ? `${(st.blocks ?? []).filter(isPerformedBlock).length} practice blocks banked` : null },
    { id: 'skill', name: 'Musical skill',
      line: rungs ? `${rungs} quest rung${rungs === 1 ? '' : 's'} passed` : null,
      detail: transfers ? `${transfers} applied to new material` : null },
  ].map((s) => ({ ...s, known: !!s.line, line: s.line ?? 'Not checked yet' }));
}

// Listening credit measures unique playback coverage, never the seek position.
export const LISTEN_MIN_PROPORTION = 0.8;
export function listeningCoverage(ranges, start, end) {
  const sorted = ranges.map(([a, b]) => [Math.max(start, a), Math.min(end, b)])
    .filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
  let covered = 0, edge = start;
  for (const [a, b] of sorted) { covered += Math.max(0, b - Math.max(a, edge)); edge = Math.max(edge, b); }
  return end > start ? covered / (end - start) : 0;
}
