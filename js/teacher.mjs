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
    passRule: '8 of 10 taps inside 150ms',
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
  m.evidence.push({ t: now, passed: !!passed, assisted: !!assisted, novel: !!novel, note });
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
  const cap = assisted ? 'guided' : novel ? 'retained' : 'independent';
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
export function prescribe(st, now, ctx = {}) {
  const mastery = st.mastery ?? {};
  const done = st.teacherLessons ?? {};
  const seen = SKILLS.filter((s) => (mastery[s.id]?.stage ?? 'unseen') !== 'unseen');

  if (!st.diagnosticDone) {
    return {
      kind: 'diagnostic',
      reason: 'I have not heard you play yet. Four short questions and I will know where to start you.',
      evidence: null,
    };
  }

  // 1. overdue review of something already learned
  const overdue = seen
    .filter((s) => RANK[mastery[s.id].stage] >= RANK.guided && mastery[s.id].dueAt && mastery[s.id].dueAt <= now)
    .sort((a, b) => mastery[a.id].dueAt - mastery[b.id].dueAt)[0];
  if (overdue) {
    const m = mastery[overdue.id];
    const days = Math.max(1, Math.round((now - m.lastTested) / DAY));
    return {
      kind: 'review', skillId: overdue.id,
      reason: 'Time to check "' + overdue.name + '" is still there.',
      evidence: 'last tested ' + days + ' day(s) ago · stage: ' + m.stage,
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
          evidence: SKILL_BY_ID[missing].name + ' is at "' + (mastery[missing]?.stage ?? 'unseen') + '", it needs "independent"',
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

  // 5. the next lesson in the path
  if (nextUndone) {
    return {
      kind: 'lesson', lessonId: nextUndone.id,
      reason: 'Next up: "' + nextUndone.title + '".',
      evidence: nextUndone.skillIds.map((sid) => SKILL_BY_ID[sid].name + ': ' + (mastery[sid]?.stage ?? 'unseen')).join(' · '),
    };
  }

  if (!st.teacherAssessed) {
    return {
      kind: 'assessment',
      reason: 'Every lesson is done. The last step is eight bars you have never seen.',
      evidence: 'novel material is the only honest test of independence',
    };
  }

  // ---- the ongoing repertoire loop (13th council: after the foundation, the
  // path's job is making SONGS independently playable, forever) ----
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
  // 8. earn the next playable song from the proof map
  const provenIds = new Set(Object.keys(st.playable ?? {}).filter((id) => st.playable[id].provenAt));
  const candidates = [...new Set(Object.values(SKILL_REPERTOIRE).flatMap((m) => m.proof.map((p) => p.songId)))];
  const nextEarn = candidates.find((id) => !provenIds.has(id));
  if (nextEarn) {
    const s = songs.find((x) => x.id === nextEarn);
    const p = st.playable?.[nextEarn];
    return {
      kind: 'repertoire', sub: 'earn-playable', songId: nextEarn,
      reason: 'Make ' + (s?.title ?? nextEarn) + ' truly yours: full run, no waiting, full tempo.',
      evidence: (p?.days?.length ? 'one qualifying day banked, one more day proves it' : 'two ≥85% runs on different days make it playable'),
    };
  }
  // 9. ladder a proven song up a tier
  const RANK_T = { Easy: 0, Medium: 1, Full: 1, Hard: 2 };
  for (const id of provenIds) {
    const s = songs.find((x) => x.id === id);
    if (!s?.group) continue;
    const next = songs
      .filter((x) => x.group === s.group && (RANK_T[x.level] ?? 1) > (RANK_T[s.level] ?? 1) && !provenIds.has(x.id))
      .sort((a, b) => (RANK_T[a.level] ?? 1) - (RANK_T[b.level] ?? 1))[0];
    if (next) {
      return {
        kind: 'repertoire', sub: 'tier-up', songId: next.id,
        reason: s.title + ' is proven on ' + s.level + ', time for ' + next.level + '.',
        evidence: 'a tier unlocks only after the one below is retained',
      };
    }
  }
  const nGroups = playableGroups(st, songs).length;
  return {
    kind: 'done',
    reason: 'Foundation complete · ' + nGroups + ' song' + (nGroups === 1 ? '' : 's') + ' independently playable.',
    evidence: SKILLS.map((s) => s.name + ': ' + (mastery[s.id]?.stage ?? 'unseen')).join(' · '),
  };
}

// ---- the five ordered lessons ----
// Every one carries: teach[], a GUIDED task (assistance on) and an independent
// TRANSFER task (assistance off, different material), plus an explicit pass rule.
export const TEACHER_LESSONS = [
  {
    id: 'tl-pulse', title: 'A pulse you can trust', skillIds: ['pulse'],
    teach: [
      'Music is a clock: tick, tick, tick, tick. Your only job here is to press a key ON each tick.',
      'Say it out loud: "1, 2, 3, 4". Press as you SAY the number, like stepping on stones.',
      'Any key counts. This game is about WHEN you press, not WHICH key.',
    ],
    guided: { type: 'pulse', beats: 8, bpm: 70, help: true },
    transfer: { type: 'pulse', beats: 8, bpm: 84, help: false },
    passRule: '8 of 10 taps inside 150ms',
  },
  {
    id: 'tl-symbols', title: 'Four chords from their symbols', skillIds: ['chord-symbol'],
    teach: [
      'A chord is 3 keys pressed together, and its name tells you where to START: the C chord starts on the C key.',
      'The recipe never changes: press the letter key, SKIP one white key, press, SKIP one, press. Letter, skip, press, skip, press.',
      'A small m (like Am) is the same recipe, it just sounds sadder. The keys LIGHT UP to teach you: copy the lights until your fingers know it.',
    ],
    guided: { type: 'chord', pool: ['C', 'Am', 'F', 'G'], help: true },
    transfer: { type: 'chord', pool: ['G', 'F', 'Am', 'C'], help: false },
    passRule: '4 of 5 first try',
  },
  {
    id: 'tl-inversions', title: 'Move less: nearest position', skillIds: ['inversion'],
    teach: [
      'Here is a secret: C chord (C+E+G) and Am chord (A+C+E) SHARE two keys. C and E are in both!',
      'So to go from C to Am, keep two fingers glued down and move JUST ONE: the top finger slides from G down to A. One finger!',
      'That is the whole lesson: be lazy. Move as few fingers as you can. The lights show the lazy way: copy them, and when the lights go off, press "Show me" any time you forget.',
    ],
    guided: { type: 'inversion', seq: ['C', 'Am', 'F', 'G'], help: true },
    transfer: { type: 'inversion', seq: ['Am', 'F', 'C', 'G'], help: false },
    passRule: '4 of 5 changes use the nearest voicing',
  },
  {
    id: 'tl-two-hand', title: 'Left root, right chord', skillIds: ['two-hand'],
    teach: [
      'Right hand: the chord (3 keys). Left hand: ONE low key, the chord letter. C chord = left hand presses a low C.',
      'Both hands land at the SAME moment, like two feet jumping together. One thud, not two.',
      'Say the chord name out loud as you land. It feels silly. It works.',
    ],
    guided: { type: 'twohand', seq: ['C', 'Am', 'F', 'G'], help: true },
    transfer: { type: 'twohand', seq: ['F', 'C', 'G', 'Am'], help: false },
    passRule: '4 of 5 changes with both hands inside 120ms',
  },
  {
    id: 'tl-leadsheet', title: 'Play a lead sheet', skillIds: ['lead-sheet'],
    teach: [
      'Real musicians often read just LETTERS above the music: C... Am... F... G. That whole line is called a lead sheet, and you can already play every chord in it.',
      'Each letter lasts one bar (four clicks). On click 1: left hand letter-key, right hand chord, together. Then wait for the next bar.',
      'The trick: while your hands play THIS letter, your eyes peek at the NEXT one. That is the whole skill.',
    ],
    guided: { type: 'leadsheet', bars: ['C', 'Am', 'F', 'G'], bpm: 60, help: true },
    transfer: { type: 'leadsheet', bars: ['Am', 'F', 'C', 'G'], bpm: 72, help: false },
    passRule: 'the whole section, 0 wrong chords, every change on its bar',
  },
];

// The novel assessment: eight bars he has NOT drilled, in an order that appears
// in no lesson. Novel material is the only honest test of independence.
export const ASSESSMENT = {
  id: 'tl-assessment', title: 'Eight bars you have never seen',
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
