import { songDemands, metSongDemands, demandsFit, demandConnection } from './difficulty.mjs';
import { LESSONS as READING_LESSONS } from './lessons.mjs';
// Teacher Loop v1 (11th council 2026-08-25): the spine that turns Keys from a
// toolbox into a teacher, diagnose -> teach -> practise -> assess -> prescribe.
// DOM-free and node-tested. Everything here is EVIDENCE, never a verdict about
// technique: the P-45 reports keys, not fingers, so this module never claims
// fingering compliance, posture, or relaxation.

// ---- chords: the vehicle of v1 (taught with pulse + coordination) ----
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const TRIADS = {
  C: { root: 'C', quality: 'major' },
  Am: { root: 'A', quality: 'minor' },
  F: { root: 'F', quality: 'major' },
  G: { root: 'G', quality: 'major' },
};

// Root-position triad with its root at or above `low`.
export function triadMidis(sym, low = 60) {
  const t = TRIADS[sym];
  if (!t) throw new Error('unknown chord ' + sym);
  const rootPc = PC[t.root];
  const r = low + (((rootPc - low) % 12) + 12) % 12;
  const third = t.quality === 'minor' ? 3 : 4;
  return [r, r + third, r + 7];
}

// All three voicings of a triad (root, 1st, 2nd inversion) within one octave.
export function inversions(sym, low = 60) {
  const b = triadMidis(sym, low);
  return [
    b,
    [b[1], b[2], b[0] + 12],
    [b[2], b[0] + 12, b[1] + 12],
  ];
}

// Nearest-position voicing: the inversion that moves the LEAST from `from`
// (total semitone travel, voice by voice). This IS the skill lesson 3 teaches,
// so the app must compute it exactly the way it teaches it.
export function nearestVoicing(sym, from) {
  if (!from || !from.length) return triadMidis(sym);
  const cands = [];
  for (let oct = -1; oct <= 1; oct++) {
    for (const v of inversions(sym, 60 + oct * 12)) cands.push(v);
  }
  let best = null;
  let bestCost = Infinity;
  const src = [...from].sort((a, b) => a - b);
  for (const v of cands) {
    if (Math.min(...v) < 55 || Math.max(...v) > 84) continue; // keep it playable
    const cost = v.reduce((a, m, i) => a + Math.abs(m - src[Math.min(i, src.length - 1)]), 0);
    if (cost < bestCost) { bestCost = cost; best = v; }
  }
  return best || triadMidis(sym);
}

// ---- skills graph ----
// observable = what the app can actually SEE; passRule = the explicit gate.
export const SKILLS = [
  {
    id: 'pulse', name: 'Steady pulse', prerequisites: [],
    observable: 'onset timing against a metronome click',
    passRule: 'At least 80% of taps within 150 milliseconds of the click',
  },
  {
    id: 'chord-symbol', name: 'Chords from a symbol', prerequisites: [],
    observable: 'the exact set of keys held together',
    passRule: '4 of 5 symbols voiced correctly first try',
  },
  {
    id: 'inversion', name: 'Nearest-position inversions', prerequisites: ['chord-symbol'],
    observable: 'which voicing was played and how far the hand moved',
    passRule: '4 of 5 changes made with the nearest voicing',
  },
  {
    id: 'two-hand', name: 'Left root under right chord', prerequisites: ['chord-symbol', 'pulse'],
    observable: 'the gap between the left and right onsets of one change',
    passRule: '4 of 5 changes with both hands inside 120ms',
  },
  {
    id: 'lead-sheet', name: 'Playing from a lead sheet', prerequisites: ['inversion', 'two-hand'],
    observable: 'chord changes landing on their authored bar',
    passRule: 'a whole section, 0 wrong chords, every change on time',
  },
];

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const STAGES = ['unseen', 'introduced', 'guided', 'independent', 'retained'];
const RANK = Object.fromEntries(STAGES.map((s, i) => [s, i]));
export const stageRank = (s) => RANK[s] ?? 0;

const DAY = 86400000;
export const RETENTION_MIN_DELAY = DAY;
// Run C: one dated competence vocabulary. No passed evidence means no claim.
// A novel task cannot establish remembered learning of the preceding material.
export function competence(record) {
  const evidence = Array.isArray(record) ? record : record?.evidence;
  const passes = (Array.isArray(evidence) ? evidence : [])
    .filter(e => e?.passed === true && Number.isFinite(e.t) && Math.abs(e.t) <= 8640000000000000)
    .slice().sort((a,b) => a.t-b.t);
  const last = passes.at(-1);
  if (!last) return null;
  const previous = passes.slice(0,-1).findLast(e => e.assisted === false &&
    (e.scope ?? '') === (last.scope ?? ''));
  const word = last.assisted !== false ? 'with help' : !last.novel && previous &&
    last.t - previous.t >= RETENTION_MIN_DELAY ? 'still remembered' : 'alone';
  return {word, at:last.t, date:evidenceDate(last.t)};
}
export function competenceRank(record) {
  return {'with help':2,alone:3,'still remembered':4}[competence(record)?.word] ?? -1;
}
export function evidenceDate(t) {
  const d=new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function competenceLine(record) {
  const earned = competence(record);
  return earned ? earned.word + ' · ' + earned.date : 'Not checked yet';
}

// Full-song evidence stays separate from passage and one-hand results.
// Old proven dates remain usable; missing assistance or timing is not invented.
export function songEvidence(st, songId) {
  const current = Array.isArray(st.songs?.[songId]?.attempts) ? st.songs[songId].attempts : [];
  const whole = current.filter(e => e?.whole && e.hand === 'both');
  const provenAt = st.playable?.[songId]?.provenAt;
  return Number.isFinite(provenAt) && provenAt > 0 && !whole.some(e => e.t <= provenAt)
    ? [{t:provenAt, passed:true, assisted:false, scope:'whole:both'}, ...whole] : whole;
}
export function recordSongAttempt(st, songId, run) {
  const stats = ((st.songs ??= {})[songId] ??= {});
  if (!Array.isArray(stats.attempts)) {
    if (stats.attempts != null) stats.legacyAttempts ??= stats.attempts;
    stats.attempts=[];
  }
  const attempts = stats.attempts;
  const attempt = {...run, passed:run.acc >= 85,
    assisted:run.wait || run.tempo < 100, scope:run.whole ? `whole:${run.hand}` : `${run.start}:${run.end}:${run.hand}`};
  const previous = attempts.findLast(e => e?.start === run.start && e.end === run.end &&
    e.hand === run.hand && e.tempo === run.tempo && e.wait === run.wait);
  attempts.push(attempt);
  if (attempts.length > 80) attempts.shift();
  return {attempt, previous:previous ?? null};
}

// spacing after each stage is reached (retention is TESTED, never assumed)
const REVIEW_GAP = { introduced: 0, guided: DAY, independent: 2 * DAY, retained: 6 * DAY };

export function emptyMastery() {
  return Object.fromEntries(SKILLS.map((s) => [s.id, { stage: 'unseen', evidence: [], lastTested: 0, dueAt: 0 }]));
}

// Record one attempt. ASSISTED attempts can never produce independent mastery
// (council law: assistance level, not input device, decides what counts).
export function recordAttempt(mastery, skillId, opts) {
  const { passed, assisted = false, novel = false, now, note = '' } = opts;
  const m = (mastery[skillId] ??= { stage: 'unseen', evidence: [], lastTested: 0, dueAt: 0 });
  const previous = m.evidence.at(-1);
  const delayed = !novel && previous?.passed && !previous.assisted &&
    now - previous.t >= RETENTION_MIN_DELAY;
  const outcome = !passed ? 'not-yet' : assisted ? 'assisted' : novel ? 'transfer' : delayed ? 'retention' : 'independent';
  m.evidence.push({ t: now, passed: !!passed, assisted: !!assisted, novel: !!novel, note, outcome });
  if (m.evidence.length > 20) m.evidence.shift();
  m.lastTested = now;
  if (!passed) {
    // a failure never wipes history, it just re-opens the skill for work
    if (RANK[m.stage] > RANK.guided) m.stage = 'guided';
    m.dueAt = now;
    return m;
  }
  // A pass is worth exactly what its ASSISTANCE allows, immediately, stepping
  // one stage per attempt meant a lesson's guided+transfer pair could never
  // reach "independent", so the app claimed it while the ledger said otherwise
  // (caught live 2026-08-25). Assistance still caps it: that law is untouched.
  const cap = assisted ? 'guided' : delayed ? 'retained' : 'independent';
  if (RANK[cap] > RANK[m.stage]) m.stage = cap;
  m.dueAt = now + (REVIEW_GAP[m.stage] ?? DAY);
  return m;
}

// "introduced" means he has been TAUGHT it, which is a fact about the lesson
// being opened, not about any attempt.
export function markIntroduced(mastery, skillId, now) {
  const m = (mastery[skillId] ??= { stage: 'unseen', evidence: [], lastTested: 0, dueAt: 0 });
  if (m.stage === 'unseen') m.stage = 'introduced';
  return m;
}

export function isPrereqMet(mastery, skillId) {
  const sk = SKILL_BY_ID[skillId];
  if (!sk) return true;
  return sk.prerequisites.every((p) => RANK[mastery[p]?.stage ?? 'unseen'] >= RANK.independent);
}

export function lessonTeaching(skillId) {
  return TEACHER_LESSONS.find((l) => l.skillIds.includes(skillId));
}

// ---- repertoire proof (13th council 2026-08-28: lessons must cash out in his
// actual music). Every skill maps to REAL library sections, payoff = played
// with help right after the guided go; proof = a section run with the help off
// (timed, full tempo) before the lesson is treated as banked. The map reuses
// authored sections only; a validation test pins every reference to songs.mjs.
export const SKILL_REPERTOIRE = {
  pulse: {
    payoff: { songId: 'ode-to-joy', section: 'Phrase A' },
    proof: [
      { songId: 'happy-birthday', section: 'Lines 1-2' },
      { songId: 'bella-ciao-easy', section: 'Verse' },
    ],
  },
  'chord-symbol': {
    payoff: { songId: 'still-dre-easy', section: 'Loop 1' },
    proof: [
      { songId: 'still-dre-easy', section: 'Loops 2-8' },
      { songId: 'faded-easy', section: 'The hook' },
    ],
  },
  inversion: {
    payoff: { songId: 'still-dre-easy', section: 'Loop 1' },
    proof: [
      { songId: 'still-dre', section: 'Intro (loops 1-2)' },
      { songId: 'river-easy', section: 'The loop' },
    ],
  },
  'two-hand': {
    payoff: { songId: 'ode-to-joy', section: 'Phrase A' },
    proof: [
      { songId: 'happy-birthday', section: 'Lines 3-4' },
      { songId: 'bella-ciao-easy', section: 'Verse' },
    ],
  },
  'lead-sheet': {
    payoff: { songId: 'see-you-again-easy', section: 'Chorus' },
    proof: [
      { songId: 'faded-easy', section: 'The hook' },
      { songId: 'runaway-easy', section: 'The plink' },
    ],
  },
};
export const PROOF_PASS = { minAcc: 85, maxWrong: 0 }; // timed lap, tempo 100

// ---- the playable-song ledger (concrete events, no composite score) ----
// A run qualifies only when it could not have been carried: the whole song,
// wait mode OFF, both hands, full tempo, ≥85% accuracy, not sight-reading.
export function qualifiesPlayable({ secIdx, wait, tempo, hand, acc, sight }) {
  return (secIdx === '' || secIdx == null) && !wait && !sight &&
    +tempo >= 100 && hand === 'both' && acc >= 85;
}
// Two qualifying runs on DIFFERENT local days make a song playable; further
// qualifying runs refresh its retention clock. Pure: mutates st, returns what
// happened ('day-banked' | 'proven' | 'refreshed' | 'already-today').
export function recordPlayableRun(st, songId, { day, now }) {
  const p = ((st.playable ??= {})[songId] ??= { days: [] });
  if (p.provenAt) { p.dueAt = now + 12 * DAY; return 'refreshed'; }
  if (p.days.includes(day)) return 'already-today';
  p.days.push(day);
  if (p.days.length >= 2) { p.provenAt = now; p.dueAt = now + 6 * DAY; return 'proven'; }
  return 'day-banked';
}
// N distinct song GROUPS with a proven tier, the path's honest headline.
export function playableGroups(st, songs) {
  const proven = Object.entries(st.playable ?? {}).filter(([, p]) => p.provenAt).map(([id]) => id);
  return [...new Set(proven.map((id) => { const s = songs.find((x) => x.id === id); return s?.group ?? id; }))];
}

// ---- the prescription engine ----
// Strict council order: overdue review -> failed prerequisite -> unfinished
// lesson step -> weakest assessed skill -> next lesson. It always returns its
// REASON and the EVIDENCE behind it; a prescription with no evidence is a guess.
// ctx (all optional, DOM-free): songs = the SONGS array, statsOf(id) = per-song
// stats, resume = {songId, title, level, at} for the last open session. The
// 13th council made this the app's ONE brain: the library's amber card and the
// path screen both ask it, so there is never a second "do this next" voice.
// Reading revisits recur six days after completion or a clean revisit.
// The audit promotes these from shadow evidence into the prescription order.
// The shadow list remains in the returned record for existing journal readers.
export const READING_FIRST_GAP = 6 * DAY;
export function readingDue(st, now) {
  const done = st.lessons ?? {};
  return READING_LESSONS.filter((l) => {
    const t = done[l.id];
    const at = typeof t === 'number' ? t : t?.done;
    const last = Math.max(at || 0, st.lessonReviews?.[l.id] || 0);
    return last && now >= last + READING_FIRST_GAP;
  }).map((l) => l.id);
}
export function prescribe(st, now, ctx = {}) {
  const rx = prescribeCore(st, now, ctx);
  const due = readingDue(st, now);
  if (due.length) rx.shadow = { readingDue: due };
  return rx;
}
function prescribeCore(st, now, ctx = {}) {
  const mastery = st.mastery ?? {};
  const done = st.teacherLessons ?? {};
  const seen = SKILLS.filter((s) => (mastery[s.id]?.stage ?? 'unseen') !== 'unseen');

  if (!st.diagnosticDone) {
    return {
      kind: 'diagnostic',
      reason: st.firstMinuteResult
        ? 'Your four bars are a start. A short check-in can help choose what to practise next.'
        : 'I have not heard you play yet. Four short questions and I will know where to start you.',
      evidence: null,
    };
  }

  // 1. overdue review of something already learned
  const overdue = seen
    .filter((s) => RANK[mastery[s.id].stage] >= RANK.guided && mastery[s.id].dueAt && mastery[s.id].dueAt <= now)
    .sort((a, b) => mastery[a.id].dueAt - mastery[b.id].dueAt)[0];
  if (overdue) {
    const m = mastery[overdue.id];
    return {
      kind: 'review', skillId: overdue.id,
      reason: 'Time to check "' + overdue.name + '" is still there.',
      evidence: competenceLine(m),
    };
  }

  // 1.2 a transfer check that came due (17th council): a section passed with
  // help on is checked later on a DIFFERENT passage of the same song, help off.
  // Exposure history distinguishes transfer from a familiar passage check.
  const dueTransfer = Object.entries(st.transfers ?? {})
    .filter(([, t]) => t.dueAt && t.dueAt <= now)
    .sort((a, b) => a[1].dueAt - b[1].dueAt)[0];
  if (dueTransfer) {
    const [songId, t] = dueTransfer;
    const s = (ctx.songs ?? []).find((x) => x.id === songId);
    return {
      kind: 'transfer', songId, section: t.section, title: s?.title ?? songId,
      checkKind: passageCheckKind(st, songId, t),
      reason: (passageCheckKind(st, songId, t) === 'transfer' ? 'Try an unpractised passage: ' : passageCheckKind(st, songId, t) === 'retention' ? 'Check this passage again: ' : 'Play this passage independently: ') + (s?.title ?? songId) + ', ' + t.section + ', no waiting.',
      evidence: passageCheckKind(st, songId, t) === 'transfer' ? 'No prior exposure recorded. Both hands, full tempo, help off.' : passageCheckKind(st, songId, t) === 'retention' ? 'Previously seen material. Both hands, full tempo, help off. Retention requires a day since its last exposure.' : 'Exposure history unavailable. This checks independent playing, without a transfer or retention claim.',
    };
  }

  const songs = ctx.songs ?? [];
  // 6. a playable song whose retention clock ran out
  const dueSong = Object.entries(st.playable ?? {})
    .filter(([, p]) => p.provenAt && p.dueAt && p.dueAt <= now)
    .sort((a, b) => a[1].dueAt - b[1].dueAt)[0];
  if (dueSong) {
    const s = songs.find((x) => x.id === dueSong[0]);
    return {
      kind: 'song-review', songId: dueSong[0],
      reason: 'Still playable? Run ' + (s?.title ?? dueSong[0]) + ' start to finish, no waiting.',
      evidence: 'proven ' + Math.round((now - dueSong[1].provenAt) / DAY) + ' day(s) ago · retention is tested, never assumed',
    };
  }
  const dueReading = readingDue(st, now)[0];
  if (dueReading) return {kind:'reading', lessonId:dueReading,
    title:READING_LESSONS.find((l) => l.id === dueReading).title,
    reason:'A short reading revisit is due before resuming your song.',
    evidence:'Last completed or revisited at least six days ago.'};

  // 2. a failed prerequisite blocking the next lesson
  const nextUndone = TEACHER_LESSONS.find((l) => !done[l.id]);
  if (nextUndone) {
    for (const sid of nextUndone.skillIds) {
      if (isPrereqMet(mastery, sid)) continue;
      const missing = SKILL_BY_ID[sid].prerequisites
        .find((p) => RANK[mastery[p]?.stage ?? 'unseen'] < RANK.independent);
      if (missing) {
        return {
          kind: 'skill', skillId: missing, lessonId: lessonTeaching(missing)?.id,
          reason: '"' + SKILL_BY_ID[sid].name + '" needs "' + SKILL_BY_ID[missing].name + '" solid first.',
          evidence: SKILL_BY_ID[missing].name + ': ' + competenceLine(mastery[missing]) + '. A pass alone is needed.',
        };
      }
    }
  }

  // 3. an unfinished lesson step
  const started = TEACHER_LESSONS.find((l) => !done[l.id] && st.teacherStep?.[l.id]);
  if (started) {
    return {
      kind: 'lesson', lessonId: started.id, step: st.teacherStep[started.id],
      reason: 'You are part-way through "' + started.title + '".',
      evidence: 'you stopped at the ' + st.teacherStep[started.id] + ' task',
    };
  }

  // 1.5 resume where he left off, a CANDIDATE, not a separate authority
  // (13th council). Fresh means under 48h; sessions saved before timestamps
  // existed count as fresh so the Continue habit survives the upgrade.
  const resume = ctx.resume;
  if (resume && (!resume.at || now - resume.at < 48 * 3600000)) {
    return {
      kind: 'resume', songId: resume.songId,
      reason: '▶ Continue, ' + (resume.title ?? resume.songId) + (resume.level ? ' (' + resume.level + ')' : ''),
      evidence: 'you were here ' + (resume.at ? Math.max(1, Math.round((now - resume.at) / 3600000)) + 'h ago' : 'last time'),
    };
  }

  // 3.5 a cleared lesson whose SONG PROOF is not banked yet: the skill is not
  // real until it survives contact with actual music, help off, full tempo.
  const proofPending = TEACHER_LESSONS.find((l) => done[l.id] && !(st.pathProofs?.[l.id]));
  if (proofPending) {
    const skillId = proofPending.skillIds[0];
    const picks = SKILL_REPERTOIRE[skillId]?.proof ?? [];
    const used = new Set(Object.values(st.pathProofs ?? {}).map((p) => p.songId + '|' + p.section));
    const pick = picks.find((p) => !used.has(p.songId + '|' + p.section)) ?? picks[0];
    if (pick) {
      return {
        kind: 'proof', lessonId: proofPending.id, skillId, songId: pick.songId, section: pick.section,
        reason: 'Prove "' + SKILL_BY_ID[skillId].name + '" in real music: ' + pick.section + '.',
        evidence: 'lesson cleared · the proof is a timed run, help off, ≥' + PROOF_PASS.minAcc + '% with 0 wrong',
      };
    }
  }

  // 4. the weakest thing he has actually met
  const weakest = seen
    .map((s) => {
      const ev = mastery[s.id].evidence.slice(-5);
      return { s, fails: ev.filter((e) => !e.passed).length, n: ev.length };
    })
    .filter((x) => x.n > 0 && x.fails > 0 && RANK[mastery[x.s.id].stage] < RANK.independent)
    .sort((a, b) => b.fails / b.n - a.fails / a.n)[0];
  if (weakest) {
    return {
      kind: 'skill', skillId: weakest.s.id, lessonId: lessonTeaching(weakest.s.id)?.id,
      reason: '"' + weakest.s.name + '" is the shakiest thing you have met.',
      evidence: weakest.fails + ' miss(es) in your last ' + weakest.n + ' attempts',
    };
  }

  // 4.5 the reading ladder (17th council). This brain imported only the five
  // chord lessons and had never once been able to recommend any of the 13
  // reading lessons. Reading and chords now take turns: the next reading
  // lesson is prescribed whenever fewer reading lessons are done than chord
  // lessons, and always once the chord ladder is finished.
  const readingDone = st.lessons ?? {};
  const nextReading = READING_LESSONS.find((l) => !readingDone[l.id]);
  const nReading = READING_LESSONS.filter((l) => readingDone[l.id]).length;
  const nChord = TEACHER_LESSONS.filter((l) => done[l.id]).length;
  if (nextReading && nextUndone && nReading < nChord) {
    return {
      kind: 'reading', lessonId: nextReading.id, title: nextReading.title,
      reason: 'Next reading step: "' + nextReading.title + '".',
      evidence: nReading + ' of ' + READING_LESSONS.length + ' reading lessons done · reading and chords take turns',
    };
  }

  // 5. the next lesson in the path
  if (nextUndone) {
    return {
      kind: 'lesson', lessonId: nextUndone.id,
      reason: 'Next up: "' + nextUndone.title + '".',
      evidence: nextUndone.skillIds.map((sid) => SKILL_BY_ID[sid].name + ': ' + competenceLine(mastery[sid])).join(' · '),
    };
  }

  if (!st.teacherAssessed) {
    return {
      kind: 'assessment',
      reason: 'Every chord lesson is done. Try eight bars in a different order, with help off.',
      evidence: 'Both hands, with help off; a later pass is needed to test remembered learning',
    };
  }

  // ---- the ongoing repertoire loop (13th council: after the foundation, the
  // path's job is making SONGS independently playable, forever) ----
  // 7. the weakest section of anything he is learning (the old library target)
  if (ctx.statsOf) {
    let worst = null;
    for (const s of songs) {
      const acc = ctx.statsOf(s.id).sectionAcc ?? {};
      for (const [name, rec] of Object.entries(acc)) {
        if (rec.best >= 85) continue;
        if (!worst || rec.best < worst.best) worst = { song: s, name, best: rec.best };
      }
    }
    if (worst) {
      return {
        kind: 'repertoire', sub: 'weak-section', songId: worst.song.id, section: worst.name,
        reason: 'Weakest spot in your music: ' + worst.song.title + ', ' + worst.name + '.',
        evidence: 'best ' + worst.best + '% · five focused minutes here beats anything else',
      };
    }
  }
  // 7.5 the reading ladder continues (17th council) once nothing in his music
  // is urgent: a due retention check and a weak section outrank a new lesson,
  // a new song does not
  if (nextReading) {
    return {
      kind: 'reading', lessonId: nextReading.id, title: nextReading.title,
      reason: 'Next reading step: "' + nextReading.title + '".',
      evidence: nReading + ' of ' + READING_LESSONS.length + ' reading lessons done',
    };
  }
  // 8. earn the next playable song from the proof map
  const provenIds = new Set(Object.keys(st.playable ?? {}).filter((id) => st.playable[id].provenAt));
  const candidates = [...new Set(Object.values(SKILL_REPERTOIRE).flatMap((m) => m.proof.map((p) => p.songId)))];
  const met = metSongDemands(st, songs);
  const nextEarn = candidates.find(id => !provenIds.has(id) && demandsFit(songDemands(songs.find(s=>s.id===id)),met));
  if (nextEarn) {
    const s = songs.find((x) => x.id === nextEarn);
    const p = st.playable?.[nextEarn];
    return {
      kind: 'repertoire', sub: 'earn-playable', songId: nextEarn,
      reason: demandConnection(s,met),
      evidence: (p?.days?.length ? 'one qualifying day banked, one more day proves it' : 'two ≥85% runs on different days make it playable'),
    };
  }
  // 9. ladder a proven song up a tier
  const RANK_T = { Easy: 0, Medium: 1, Full: 1, Hard: 2 };
  for (const id of provenIds) {
    const s = songs.find((x) => x.id === id);
    if (!s?.group) continue;
    const next = songs
      .filter((x) => x.group === s.group && (RANK_T[x.level] ?? 1) > (RANK_T[s.level] ?? 1) && !provenIds.has(x.id) && demandsFit(songDemands(x),met))
      .sort((a, b) => (RANK_T[a.level] ?? 1) - (RANK_T[b.level] ?? 1))[0];
    if (next) {
      return {
        kind: 'repertoire', sub: 'tier-up', songId: next.id,
        reason: demandConnection(next,met),
        evidence: 'a tier unlocks only after the one below is retained',
      };
    }
  }
  if (candidates.some(id=>songs.some(s=>s.id===id) && !provenIds.has(id))) {
    const familiar=songs.find(s=>provenIds.has(s.id) && demandsFit(songDemands(s),met));
    if (familiar) return {kind:'repertoire',sub:'consolidate',songId:familiar.id,
      reason:'Play '+familiar.title+' again with help off; the next pieces ask for more than your recorded playing covers.',
      evidence:competenceLine(songEvidence(st,familiar.id))};
    return {kind:'review',skillId:'pulse',
      reason:'Start with a steady-pulse check; there is not enough timed evidence to choose a new piece yet.',
      evidence:competenceLine(mastery.pulse)};
  }
  const nGroups = playableGroups(st, songs).length;
  return {
    kind: 'done',
    reason: 'Foundation complete · ' + nGroups + ' song' + (nGroups === 1 ? '' : 's') + ' independently playable.',
    evidence: SKILLS.map((s) => s.name + ': ' + competenceLine(mastery[s.id])).join(' · '),
  };
}

// ---- the five ordered lessons ----
// Every one carries: teach[], a GUIDED task (assistance on) and an independent
// TRANSFER task (assistance off, different material), plus an explicit pass rule.
export const TEACHER_LESSONS = [
  {
    id: 'tl-pulse', title: 'A pulse you can trust', skillIds: ['pulse'],
    video: { url: 'https://www.youtube.com/watch?v=st7pabkIMZQ', title: "Playing with a Metronome: Beginner Piano Exercises for a Steady Tempo" },  // oEmbed-verified 2026-09-07
    teach: [
      'For this exercise, keep a steady pulse: tick, tick, tick, tick. Your only job here is to press a key ON each tick.',
      'Say it out loud: "1, 2, 3, 4". Press as you SAY the number, like stepping on stones.',
      'Any key counts. This game is about WHEN you press, not WHICH key.',
    ],
    guided: { type: 'pulse', beats: 8, bpm: 70, help: true },
    transfer: { type: 'pulse', beats: 8, bpm: 84, help: false },
    passRule: 'At least 80% of taps within 150 milliseconds of the click',
  },
  {
    id: 'tl-symbols', title: 'Four chords from their symbols', skillIds: ['chord-symbol'],
    video: { url: 'https://www.youtube.com/watch?v=P28KMjSNQYg', title: "Master Major and Minor Triads" },  // oEmbed-verified 2026-09-07
    teach: [
      'In this lesson each chord is a three-note triad in root position: the C major chord starts on the C key.',
      'For these four root-position chords only (C major, A minor, F major and G major), start on the named white key, skip one white key, press, skip one, press. Other chords can need black keys.',
      'The small m in Am means A minor. Here it uses the same white-key pattern; major and minor have different gaps in semitones. Copy the lit keys, then try recalling them without lights.',
    ],
    guided: { type: 'chord', pool: ['C', 'Am', 'F', 'G'], help: true },
    transfer: { type: 'chord', pool: ['G', 'F', 'Am', 'C'], help: false },
    passRule: '4 of 5 first try',
  },
  {
    id: 'tl-inversions', title: 'Move less: nearest position', skillIds: ['inversion'],
    video: { url: 'https://www.youtube.com/watch?v=KU4YLMlN5hk', title: "Beginner's Guide to Chord Inversions" },  // oEmbed-verified 2026-09-07
    teach: [
      'Here is a secret: C chord (C+E+G) and Am chord (A+C+E) SHARE two note names. C and E are in both!',
      'From C4+E4+G4, keep C4 and E4 and move G4 UP to A4. The result C4+E4+A4 is A minor in an inversion: the same chord notes in a different order.',
      'For each change, choose the position with the least total key-to-key travel. Some changes move all three notes. The lights show the target; "Show me" offers help and makes that attempt assisted.',
    ],
    guided: { type: 'inversion', seq: ['C', 'Am', 'F', 'G'], help: true },
    transfer: { type: 'inversion', seq: ['Am', 'F', 'C', 'G'], help: false },
    passRule: '4 of 5 changes use the nearest voicing',
  },
  {
    id: 'tl-two-hand', title: 'Left root, right chord', skillIds: ['two-hand'],
    video: { url: 'https://www.youtube.com/watch?v=suriVc4lBTo', title: "Left Hand Accompaniment 101" },  // oEmbed-verified 2026-09-07
    teach: [
      'Right hand: the chord (3 keys). Left hand: ONE low key, the chord letter. C chord = left hand presses a low C.',
      'Both hands land at the SAME moment, like two feet jumping together. One thud, not two.',
      'Try saying the chord name as you land if that helps you coordinate the change.',
    ],
    guided: { type: 'twohand', seq: ['C', 'Am', 'F', 'G'], help: true },
    transfer: { type: 'twohand', seq: ['F', 'C', 'G', 'Am'], help: false },
    passRule: '4 of 5 changes with both hands inside 120ms',
  },
  {
    id: 'tl-leadsheet', title: 'Play a lead sheet', skillIds: ['lead-sheet'],
    video: { url: 'https://www.youtube.com/watch?v=5v3z0cd7okY', title: "Reading Chords on a Lead Sheet" },  // oEmbed-verified 2026-09-07
    teach: [
      'A lead sheet usually shows a melody with chord symbols above it. Here we practise just the chord-symbol part: C, Am, F, G, using the chords from the earlier lessons.',
      'In this exercise each chord symbol lasts one bar (four clicks). On click 1: left hand letter-key, right hand chord, together. Then wait for the next bar.',
      'Try looking at the NEXT chord symbol while you hold this chord, so you can prepare the change.',
    ],
    guided: { type: 'leadsheet', bars: ['C', 'Am', 'F', 'G'], bpm: 60, help: true },
    transfer: { type: 'leadsheet', bars: ['Am', 'F', 'C', 'G'], bpm: 72, help: false },
    passRule: 'the whole section, 0 wrong chords, every change on its bar',
  },
];

// The novel assessment: eight bars he has NOT drilled, in an order that appears
// in no lesson. Novel material is the only honest test of independence.
export const ASSESSMENT = {
  id: 'tl-assessment', title: 'Eight bars with help off',
  bars: ['F', 'G', 'C', 'Am', 'F', 'C', 'G', 'C'], bpm: 66,
  passRule: '7 of 8 bars correct, both hands together',
};

// The four-part diagnostic, all on material no lesson has drilled.
export const DIAGNOSTIC = [
  { id: 'd-pulse', skillId: 'pulse', prompt: 'Tap any key on each click. Eight clicks.', type: 'pulse', beats: 8, bpm: 72 },
  { id: 'd-read', skillId: 'chord-symbol', prompt: 'Play these single notes as they appear.', type: 'read', notes: [62, 69, 65, 71] },
  { id: 'd-chord', skillId: 'chord-symbol', prompt: 'If you already know it, play this chord. If not, skip, that is the answer I need.', type: 'chord', pool: ['C'] },
  { id: 'd-hands', skillId: 'two-hand', prompt: 'Left hand low C, right hand the C chord, together.', type: 'twohand', seq: ['C'] },
];

// Filmed self-screening rubric. MIDI cannot see ANY of this, that is exactly
// why it is a checklist for his own eyes, never an app verdict.
export const TECHNIQUE_RUBRIC = [
  { id: 'setup', check: 'Bench height: forearms roughly level with the keys, elbows a touch higher than the keybed.' },
  { id: 'curved', check: 'Fingers curved as if holding a ball. Are any finger joints collapsing flat?' },
  { id: 'wrist', check: 'Wrist neutral and level, not dropped below the keys and not hitched above them.' },
  { id: 'shoulders', check: 'Shoulders down and loose. Do they creep toward your ears as the music gets harder?' },
  { id: 'pain', check: 'Any pain, pinching or numbness anywhere: fingers, wrist, forearm, shoulder?', stop: true },
];
export const TECHNIQUE_STOP_RULE =
  'If anything hurts, stop playing for today. Pain is not something to practise through, and it is not something this app can diagnose: that is a question for a human teacher or a doctor.';

export const ASSESSMENT_MIN_TEMPO = 1;
export function assessmentConditions(engine, section) {
  return !!engine && !!section && engine.hand === 'both' && engine.waitMode === false &&
    Number.isFinite(engine.tempo) && engine.tempo >= ASSESSMENT_MIN_TEMPO &&
    engine.startBeat === section.startBeat && engine.endBeat === section.endBeat;
}

// Historical evidence is preserved. Unsupported old retention labels are reopened.
export function reconcileMastery(mastery = {}) {
  if (!mastery || typeof mastery !== 'object') return mastery;
  for (const m of Object.values(mastery)) {
    if (!m || m.stage !== 'retained' || m.evidence?.some((e) => e.outcome === 'retention')) continue;
    m.legacyStage ??= m.stage;
    m.stage = 'independent';
  }
  return mastery;
}

// An unknown legacy history can never certify a passage as unexposed.
export function passageUnexposed(st, songId, section) {
  const history = st.passageExposure?.[songId];
  return !!history?.known && !history.sections?.[section];
}
export function exposePassage(st, song, start, end, now) {
  const history = ((st.passageExposure ??= {})[song.id] ??= {known:false, sections:{}});
  for (const section of song.sections ?? []) {
    if (section.startBeat < end && section.endBeat > start) {
      const rec = (history.sections[section.name] ??= {firstAt:now, count:0});
      rec.lastAt = now; rec.count++;
    }
  }
}
export function schedulePassageCheck(st, songId, from, next, now) {
  const novel = !!next && passageUnexposed(st, songId, next);
  return {section:novel ? next : from, from, kind:novel ? 'transfer' : 'retention',
    passedAt:now, dueAt:now + RETENTION_MIN_DELAY};
}
export function passageCheckKind(st, songId, check) {
  if (check.kind === 'transfer' && passageUnexposed(st, songId, check.section)) return 'transfer';
  return st.passageExposure?.[songId]?.sections?.[check.section] ? 'retention' : 'independent';
}

export function skillCheckDates(record, now = Date.now()) {
  const date = (t) => new Date(t).toLocaleDateString('en', {month:'short',day:'numeric'});
  const tested = record.lastTested ? 'Last checked ' + date(record.lastTested) : 'Not checked yet';
  return tested + (record.dueAt ? record.dueAt <= now ? '. Check again today.' : '. Next check ' + date(record.dueAt) + '.' : '.');
}

export function initializeExposure(st, songs) {
  if (st.exposureTrackingSince) return;
  const fresh = !st.firstRunDone && !st.lastSession && !(st.days?.length) && !Object.keys(st.songs ?? {}).length;
  st.exposureTrackingSince = Date.now();
  st.passageExposure ??= {};
  for (const song of songs) st.passageExposure[song.id] ??= {known:fresh,sections:{}};
}
