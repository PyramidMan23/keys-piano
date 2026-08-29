// Real cover art for the library (Mark 2026-08-28: "the actual album art or
// song art for each song, not some random picture").
//
// Source: the public iTunes Search API (no key, no auth). We take the ARTWORK
// only, at build time, into art/ - so the PWA stays offline and the picture
// never changes under us. Every pick is VERIFIED against the expected artist
// and track before it is accepted; anything that fails the match is recorded
// as a reject, never silently substituted.
//
// Songs with no honest recording (scales, drills, folk tunes with no canonical
// album) are listed in NO_ALBUM and deliberately get NO art here - they keep
// the generative plate from covers.mjs. "Notes yes, guessed art never."
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ART = join(ROOT, 'art');
const CAND = join(ART, '_candidates');

// group -> the real recording we are asking for. term = what we search,
// artist/track = what the result MUST contain to be accepted, album = the
// record it actually came out on where that is an established fact (required,
// so a "Greatest Hits" cover can never stand in for the real sleeve).
const WANT = {
  'still-dre':          { term: 'Still D.R.E. Dr. Dre Snoop Dogg',            artist: 'dr. dre',        track: 'still d.r.e' },
  'game-of-thrones':    { term: 'Game of Thrones Main Title Ramin Djawadi',   artist: 'djawadi',        track: 'game of thrones' },
  'runaway':            { term: 'Runaway Kanye West Pusha T',                 artist: 'kanye',          track: 'runaway' },
  'faded':              { term: 'Faded Alan Walker',                          artist: 'alan walker',    track: 'faded' },
  'fray-save-a-life':   { term: 'How to Save a Life The Fray',                artist: 'fray',           track: 'how to save a life' },
  'empire':             { term: 'Empire State of Mind Jay-Z The Blueprint 3', artist: 'jay',            track: 'empire state of mind', album: 'blueprint 3' },
  'pirates':            { term: "He's a Pirate Curse of the Black Pearl soundtrack", artist: 'badelt', track: 'pirate', album: 'black pearl' },
  'river':              { term: 'River Flows in You Yiruma',                  artist: 'yiruma',         track: 'river flows in you' },
  'piano-man':          { term: 'Piano Man Billy Joel',                       artist: 'billy joel',     track: 'piano man' },
  'gangstas-paradise':  { term: "Gangsta's Paradise Coolio",                  artist: 'coolio',         track: 'paradise' },
  'lost':               { term: 'Lost Linkin Park Meteora 20th Anniversary',  artist: 'linkin park',    track: 'lost', album: 'lost demos' },
  'numb':               { term: 'Numb Linkin Park Meteora',                   artist: 'linkin park',    track: 'numb' },
  'star-wars':          { term: 'Star Wars Main Title John Williams A New Hope', artist: 'williams',    track: 'main title', album: 'new hope' },
  'see-you-again':      { term: 'See You Again Wiz Khalifa Furious 7 soundtrack', artist: 'wiz khalifa', track: 'see you again', album: 'furious 7' },
  'interstellar':       { term: 'Interstellar Main Theme Hans Zimmer',        artist: 'zimmer',         track: '', album: 'interstellar' },
  'in-the-end':         { term: 'In the End Linkin Park Hybrid Theory',       artist: 'linkin park',    track: 'in the end' },
  'what-ive-done':      { term: "What I've Done Linkin Park Minutes to Midnight", artist: 'linkin park', track: "what i've done" },
  'work-this-time':     { term: 'Work This Time King Gizzard and the Lizard Wizard', artist: 'gizzard', track: 'work this time' },
  'in-a-gadda-da-vida': { term: 'In-A-Gadda-Da-Vida Iron Butterfly',          artist: 'iron butterfly', track: 'gadda' },
  'stairway':           { term: 'Stairway to Heaven Led Zeppelin IV',         artist: 'led zeppelin',   track: 'stairway to heaven', album: 'led zeppelin iv' },
  'bohemian-rhapsody':  { term: 'Bohemian Rhapsody Queen A Night at the Opera', artist: 'queen',        track: 'bohemian rhapsody', album: 'night at the opera' },
  'hotel-california':   { term: 'Hotel California Eagles',                    artist: 'eagles',         track: 'hotel california' },
  // classical: a real recording exists, so we ask for one and let Mark judge
  // the candidates rather than assuming a compilation cover is the right face.
  'fur-elise':          { term: 'Beethoven Fur Elise Wilhelm Kempff Deutsche Grammophon', artist: '',    track: 'elise' },
  'moonlight-sonata':   { term: 'Beethoven Piano Sonata No. 14 Moonlight Adagio sostenuto Kempff', artist: '', track: 'sonata' },
  'ode-to-joy':         { term: 'Beethoven Symphony No. 9 Choral Karajan Berlin Philharmonic', artist: '', track: 'symphony no. 9' },
};

// iTunes has no honest release for these, so they come from MusicBrainz +
// the Cover Art Archive instead (checked: Nintendo has never put the Super
// Mario soundtrack on any store, so every iTunes hit is a cover band).
// mbid is pinned by hand after reading the search result, never guessed.
const MB = {
  'mario':     { mbid: '138c0ebc-2c41-4763-9b87-b6753e8946cb', artist: 'Koji Kondo', album: 'Super Mario Bros. 35 Original Soundtrack', year: '2020' },
};

// No honest recording exists at all for these. They keep the generative plate.
const NO_ALBUM = ['happy-birthday', 'bella-ciao', 'scale-c-major', 'scale-a-minor'];

// A result carrying any of these is not the record; it is a knock-off.
const JUNK = /karaoke|tribute|made (famous|popular)|in the style of|cover version|8-bit|8 bit|lullaby|string quartet|ringtone|instrumental version|piano version|rockabye|meditat|sleep baby|as made/i;

const big = (u) => u.replace(/\/\d+x\d+bb\.jpg$/, '/1000x1000bb.jpg');

async function search(term) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=25&country=AU`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`itunes ${r.status} for ${term}`);
  return (await r.json()).results ?? [];
}

const flat = (x) => (x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function score(res, want) {
  const a = flat(res.artistName), t = flat(res.trackName), c = flat(res.collectionName);
  if (JUNK.test(a) || JUNK.test(t) || JUNK.test(c)) return -1;         // hard reject
  if (want.artist && !a.includes(flat(want.artist))) return -1;        // wrong artist
  if (want.track && !t.includes(flat(want.track))) return -1;          // wrong track
  if (want.album && !c.includes(flat(want.album))) return -1;          // not the record it came out on
  let s = 100;
  if (/live|remix|edit\)|demo/i.test(t)) s -= 40;
  if (/greatest hits|very best|best of|essential|collection|now that|compilation|volume|vol\.|top 10|50 greatest/i.test(c)) s -= 60;
  if (/remaster|deluxe|anniversary|expanded/i.test(c)) s -= 5;
  if (t === flat(want.track)) s += 10;
  return s;
}

async function download(url, file) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`art ${r.status}`);
  await writeFile(file, Buffer.from(await r.arrayBuffer()));
}

const manifest = {}, rejects = {};
await mkdir(CAND, { recursive: true });

for (const [group, want] of Object.entries(WANT)) {
  let results;
  try { results = await search(want.term); }
  catch (e) { rejects[group] = `search failed: ${e.message}`; continue; }
  const ranked = results
    .map((r) => ({ r, s: score(r, want) }))
    .filter((x) => x.s >= 0 && x.r.artworkUrl100)
    .sort((a, b) => b.s - a.s);
  if (!ranked.length) {
    rejects[group] = `no result matched artist~"${want.artist}" track~"${want.track}" (${results.length} raw)`;
    continue;
  }
  // dedupe by album so the candidate sheet shows five DIFFERENT pictures
  const seen = new Set(), cands = [];
  for (const { r, s } of ranked) {
    const k = r.collectionId;
    if (seen.has(k)) continue;
    seen.add(k);
    cands.push({ score: s, artist: r.artistName, track: r.trackName, album: r.collectionName,
                 year: (r.releaseDate ?? '').slice(0, 4), art: big(r.artworkUrl100), url: r.collectionViewUrl });
    if (cands.length === 5) break;
  }
  for (let i = 0; i < cands.length; i++) {
    try { await download(cands[i].art, join(CAND, `${group}-${i}.jpg`)); cands[i].file = `_candidates/${group}-${i}.jpg`; }
    catch (e) { cands[i].error = e.message; }
  }
  try { await download(cands[0].art, join(ART, `${group}.jpg`)); }
  catch (e) { rejects[group] = `download: ${e.message}`; continue; }
  manifest[group] = { file: `art/${group}.jpg`, artist: cands[0].artist, album: cands[0].album,
                      track: cands[0].track, year: cands[0].year, source: cands[0].url, candidates: cands };
  console.log(`OK   ${group.padEnd(20)} ${cands[0].artist} - ${cands[0].album} (${cands[0].year})  [${cands.length} candidates]`);
}
for (const [group, m] of Object.entries(MB)) {
  const url = `https://coverartarchive.org/release/${m.mbid}/front-1200`;
  try {
    await download(url, join(ART, `${group}.jpg`));
    await download(url, join(CAND, `${group}-0.jpg`));
    manifest[group] = { file: `art/${group}.jpg`, artist: m.artist, album: m.album, track: m.album, year: m.year,
                        source: `https://musicbrainz.org/release/${m.mbid}`,
                        candidates: [{ score: 100, artist: m.artist, track: m.album, album: m.album, year: m.year, art: url, url: `https://musicbrainz.org/release/${m.mbid}`, file: `_candidates/${group}-0.jpg` }] };
    console.log(`OK   ${group.padEnd(20)} ${m.artist} - ${m.album} (${m.year})  [Cover Art Archive]`);
  } catch (e) { rejects[group] = `CAA: ${e.message}`; }
}
for (const g of NO_ALBUM) manifest[g] = { file: null, reason: 'no canonical recording - generative plate' };
for (const [g, why] of Object.entries(rejects)) console.log(`MISS ${g.padEnd(20)} ${why}`);

await writeFile(join(ART, 'art.json'), JSON.stringify({ fetched: new Date().toISOString(), source: 'iTunes Search API', manifest, rejects }, null, 2));

// The runtime module. The app must not fetch art.json at boot (offline PWA),
// so the manifest is compiled to an ES module the shell already caches.
const runtime = Object.fromEntries(Object.entries(manifest)
  .filter(([, m]) => m.file)
  .map(([g, m]) => [g, { artist: m.artist, album: m.album, year: m.year }]));
const header = [
  '// GENERATED by tools/fetch-art.mjs. Do not hand-edit; re-run the fetcher.',
  '// group -> the real record its sleeve came from. Presence here means',
  '// art/512/<group>.jpg and art/128/<group>.jpg exist on disk.',
  '',
].join('\n');
await writeFile(join(ROOT, 'js', 'art-manifest.mjs'),
  header + 'export const ART = ' + JSON.stringify(runtime, null, 2) + ';\n');
console.log(`wrote js/art-manifest.mjs (${Object.keys(runtime).length} sleeves)`);
console.log(`\n${Object.values(manifest).filter((m) => m.file).length} groups with real art, ${NO_ALBUM.length} deliberately without, ${Object.keys(rejects).length} misses`);
