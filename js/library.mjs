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

// Council ruling: Learning = evidence of a FINISHED run (plays only increments
// on finish, so an accidental launch never promotes). Repertoire = the top
// tier is 3-starred. Explore = never finished anything.
export function classifyGroups(groups, statsOf) {
  const learning = [], repertoire = [], explore = [];
  for (const variants of groups.values()) {
    const top = variants[variants.length - 1];
    const played = variants.some((v) => (statsOf(v.id).plays || 0) > 0);
    if ((statsOf(top.id).stars || 0) >= 3) repertoire.push(variants);
    else if (played) learning.push(variants);
    else explore.push(variants);
  }
  // Learning: weakest first (fewest total stars, then least best accuracy).
  const weakness = (variants) => {
    const stars = variants.reduce((a, v) => a + (statsOf(v.id).stars || 0), 0);
    const best = Math.max(...variants.map((v) => statsOf(v.id).best || 0));
    return stars * 1000 + best;
  };
  learning.sort((a, b) => weakness(a) - weakness(b));
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
