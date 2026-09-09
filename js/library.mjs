// Library organization (11th-hour council 2026-08-28, Codex v1 spec adopted):
// ONE page, progressive disclosure. Learning open + counted, Repertoire and
// Explore collapsed dense rows, one amber next-action, search scoped to
// Explore (icon until the catalog earns a persistent field).
// Pure + DOM-free so the classification is node-testable.

export const RANK = { Easy: 0, Medium: 1, Full: 1, Hard: 2 };

// Group SONGS into cards (same grouping the old flat library used).
export function groupSongs(songs) {
  const groups = new Map();
  for (const song of songs) {
    if (song.ladder) continue; // ladder scales live on the 12-keys grid
    const key = song.group ?? song.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(song);
  }
  for (const variants of groups.values()) {
    variants.sort((a, b) => (RANK[a.level] ?? 1) - (RANK[b.level] ?? 1));
  }
  return groups;
}

// Learning = a song Mark has actually WORKED ON: a finished run, or at least a
// minute of play time in any tier (Mark, 2026-09-09: "make sure that any song
// I'm learning comes up there in the order that I've tried playing or spent
// the most time in"). The 13th council's rule was a finished run only, which
// left every song he opened and drilled for twenty minutes but never played
// end to end sitting in Explore, alphabetically, with no trace: 59 of 69 song
// starts in the 3 to 5 Sep journal were abandoned before 5%. The minute floor
// keeps that council's intent (an accidental launch never promotes).
// Repertoire = a tier has passed the two-day playable proof. Explore = everything else.
export const LEARNING_MIN_MS = 60000;
export function classifyGroups(groups, statsOf, playable = {}) {
  const learning = [], repertoire = [], explore = [];
  const timeIn = (variants) => variants.reduce((a, v) => a + (statsOf(v.id).ms || 0), 0);
  const lastAt = (variants) => Math.max(0, ...variants.map((v) => statsOf(v.id).lastAt || 0));
  for (const variants of groups.values()) {
    const proven = variants.some((v) => playable?.[v.id]?.provenAt);
    const played = variants.some((v) => (statsOf(v.id).plays || 0) > 0);
    if (proven) repertoire.push(variants);
    else if (played || timeIn(variants) >= LEARNING_MIN_MS) learning.push(variants);
    else explore.push(variants);
  }
  // Learning: most time in the song first, then most recently opened, then the
  // old weakness order (fewest stars, lowest best) for anything older than the
  // clock, which has no time recorded.
  const weakness = (variants) => {
    const stars = variants.reduce((a, v) => a + (statsOf(v.id).stars || 0), 0);
    const best = Math.max(...variants.map((v) => statsOf(v.id).best || 0));
    return stars * 1000 + best;
  };
  learning.sort((a, b) => timeIn(b) - timeIn(a) || lastAt(b) - lastAt(a) || weakness(a) - weakness(b));
  const byTitle = (a, b) => a[0].title.localeCompare(b[0].title);
  repertoire.sort(byTitle);
  explore.sort(byTitle);
  return { learning, repertoire, explore };
}

// The amber next-action is decided by teacher.prescribe(), the app's ONE
// brain since the 13th council (2026-08-28). This module keeps only the
// shelf organization.

// Explore search filter (title + composer substring, case-insensitive).
export function filterExplore(explore, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return explore;
  return explore.filter((variants) =>
    variants[0].title.toLowerCase().includes(q) || variants[0].composer.toLowerCase().includes(q));
}

// Past this size the Explore search stops being an icon and stays a field.
export const SEARCH_PERSISTENT_AT = 40;

// Progress files include all state fields, including fields unknown to this build.
export const PROGRESS_FORMAT = 'keys-progress';
export const PROGRESS_VERSION = 1;
export const PROGRESS_MAX_BYTES = 8 * 1024 * 1024;
const plain = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
export function validateProgress(s) {
  const fail = () => { throw new Error('This file has an invalid progress structure. Nothing was restored.'); };
  let nodes = 0;
  const walk = (v, depth = 0) => {
    if (++nodes > 200000 || depth > 30) fail();
    if (typeof v === 'number' && (!Number.isFinite(v) || Math.abs(v) > Number.MAX_SAFE_INTEGER)) fail();
    if (v && typeof v === 'object') for (const [k, value] of Object.entries(v)) {
      if (['__proto__', 'prototype', 'constructor'].includes(k)) fail();
      walk(value, depth + 1);
    }
  };
  if (!plain(s) || !plain(s.songs) || !Array.isArray(s.days)) fail();
  walk(s);
  if (!s.days.every((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))) fail();
  const maps = ['songs','mastery','playable','transfers','passageExposure','pathProofs','lessons','lessonReviews',
    'lessonReplays','lessonBadges','lessonStars','teacherLessons','teacherStep','dayStats','litems','mem','pmin','lib',
    'xpKeys','journeys','echo','sight','rhythm','theory','touch','activeQuest','weekly','lastSession','pathPending'];
  for (const k of maps) if (s[k] != null && !plain(s[k])) fail();
  for (const k of ['xpLog','takes','passageChecks','blocks','frozenDays','technique']) if (s[k] != null && !Array.isArray(s[k])) fail();
  for (const k of ['xpLog','takes','passageChecks','blocks','technique']) if (s[k]?.some((e) => !plain(e))) fail();
  if (s.frozenDays?.some((d) => typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d))) fail();
  for (const k of ['xpTotal','freezeTokens','bestRhythm','calibratedAt','exposureTrackingSince']) {
    if (s[k] != null && (typeof s[k] !== 'number' || s[k] < 0)) fail();
  }
  if (s.xpTotal > 1000000000) fail();
  for (const entry of s.xpLog ?? []) if (typeof entry.xp !== 'number' || entry.xp < 0 || typeof entry.src !== 'string') fail();
  for (const k of ['transfers','pathProofs','dayStats','journeys','passageExposure']) {
    if (Object.values(s[k] ?? {}).some((e) => !plain(e))) fail();
  }
  for (const record of Object.values(s.passageExposure ?? {})) {
    if (typeof record.known !== 'boolean' || !plain(record.sections) || Object.values(record.sections).some((e) => !plain(e))) fail();
  }
  if (s.calOffsetMs != null && typeof s.calOffsetMs !== 'number') fail();
  for (const record of Object.values(s.songs)) {
    if (!plain(record)) fail();
    for (const k of ['ms','lastAt','best','plays','stars']) if (record[k] != null && (typeof record[k] !== 'number' || record[k] < 0)) fail();
  }
  for (const record of Object.values(s.mastery ?? {})) {
    if (!plain(record) || !['unseen','introduced','guided','independent','retained'].includes(record.stage) ||
        !Array.isArray(record.evidence) || record.evidence.some((e) => !plain(e) || typeof e.t !== 'number')) fail();
  }
  for (const record of Object.values(s.playable ?? {})) {
    if (!plain(record) || !Array.isArray(record.days) || record.days.some((d) => typeof d !== 'string')) fail();
  }
  return s;
}
export function exportProgress(state, now = Date.now()) {
  return JSON.stringify({format:PROGRESS_FORMAT, version:PROGRESS_VERSION, exportedAt:now, state}, null, 2);
}
export function importProgress(text) {
  if (new TextEncoder().encode(text).length > PROGRESS_MAX_BYTES) throw new Error('Progress file is too large.');
  const file = JSON.parse(text);
  if (file?.format !== PROGRESS_FORMAT || file.version !== PROGRESS_VERSION) throw new Error('Unsupported Keys progress file version.');
  return validateProgress(file.state);
}
export function saveProgress(storage, state) {
  try { storage.setItem('keys-v1', JSON.stringify(state)); return {ok:true}; }
  catch { return {ok:false, message:'Progress could not be saved on this browser. Export it now before closing Keys.'}; }
}
export function restoreProgress(storage, text) {
  const state = importProgress(text);
  // Back up before replacing. A quota failure leaves the active state untouched.
  storage.setItem('keys-v1-before-restore', storage.getItem('keys-v1') ?? '{}');
  storage.setItem('keys-v1', JSON.stringify(state));
  return state;
}

export const DIAGNOSTIC_EVENT_LIMIT = 200;
export function appendDiagnostic(events, event) {
  events.push(event);
  if (events.length > DIAGNOSTIC_EVENT_LIMIT) events.splice(0, events.length - DIAGNOSTIC_EVENT_LIMIT);
  return events;
}
