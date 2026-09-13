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
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ART = join(ROOT, 'art');
const CAND = join(ART, '_candidates');

// Adding a WAVE without disturbing the sleeves already on disk.
//   ONLY=a,b,c   fetch just these groups and MERGE the result into the existing
//                art.json + art-manifest.mjs, leaving every other entry byte-identical.
//                Without it the run is a full refresh, which re-picks all ~77 and
//                lets the store's ranking move a sleeve Mark already accepted.
//   DRY=1        rank and PRINT the candidates, download nothing, write nothing.
//                A search term is a guess until you have seen what it returns.
const ONLY = (process.env.ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const DRY = process.env.DRY === '1';

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

  // ---- the 2026-08-31 wave. Mark, looking at the Explore shelf: "we can put
  // the Overwatch logo there for example, the next episode single cover etc,
  // why do so many of them just have a generic photo?" Fair: every song added in
  // the last two days got a generative plate because none of them had an entry
  // here, and this map is hand-written on purpose. Each one still has to pass
  // the artist/track check below, so a wrong sleeve is rejected, not substituted.
  'next-episode':       { term: 'The Next Episode Dr. Dre Snoop Dogg 2001',   artist: 'dr. dre',        track: 'next episode' },
  'overwatch':          { term: 'Overwatch Original Game Soundtrack Derek Duke', artist: 'duke',        track: 'overwatch' },
  'gladiator':          { term: 'Now We Are Free Gladiator Hans Zimmer Lisa Gerrard', artist: 'zimmer', track: 'now we are free' },
  'x-files':            { term: 'The X-Files Main Title Theme Mark Snow',     artist: 'snow',           track: 'x-files' },
  'jaws':               { term: 'Jaws Main Title John Williams',              artist: 'williams',       track: 'jaws' },
  'imperial-march':     { term: 'The Imperial March Star Wars Empire Strikes Back John Williams', artist: 'williams', track: 'imperial march' },
  'never-gonna-2':      { term: 'Never Gonna Give You Up Rick Astley',        artist: 'astley',         track: 'never gonna give you up' },
  'last-friday-night':  { term: 'Last Friday Night T.G.I.F. Katy Perry Teenage Dream', artist: 'katy perry', track: 'last friday night' },
  'coffin-dance':       { term: 'Astronomia Tony Igy',                        artist: 'igy',            track: 'astronomia' },
  'say-yes-to-heaven':  { term: 'Say Yes to Heaven Lana Del Rey',             artist: 'lana del rey',   track: 'say yes to heaven' },
  'light-of-the-seven': { term: 'Light of the Seven Game of Thrones Season 6 Ramin Djawadi', artist: 'djawadi', track: 'light of the seven' },
  'i-giorni':           { term: 'I Giorni Ludovico Einaudi',                  artist: 'einaudi',        track: 'giorni' },
  'comptine':           { term: "Comptine d'un autre ete Yann Tiersen Amelie", artist: 'tiersen',       track: 'comptine' },
  'la-petite-fille':    { term: 'La Petite Fille de la Mer Vangelis',         artist: 'vangelis',       track: 'petite fille' },
  'mariage-d-amour':    { term: "Mariage d'Amour Paul de Senneville Richard Clayderman", artist: '',    track: 'mariage' },
  'where-is-my-mind':   { term: 'Where Is My Mind Maxence Cyrin Novo Piano',  artist: 'cyrin',          track: 'where is my mind' },
  'beanie':             { term: 'Beanie Chezile',                            artist: 'chezile',        track: 'beanie' },
  'idea-10':            { term: 'Idea 10 Gibran Alcocer',                     artist: 'alcocer',        track: 'idea 10' },
  'idea-12':            { term: 'Idea 12 Gibran Alcocer',                     artist: 'alcocer',        track: 'idea 12' },
  'icarus':             { term: 'Icarus Tony Ann',                            artist: 'tony ann',       track: 'icarus' },
  'see-you-tomorrow':   { term: 'See You Tomorrow Evgeny Grinko',             artist: 'grinko',         track: 'see you tomorrow' },
  'i-wanted-to-leave':  { term: 'I Wanted to Leave SYML',                     artist: 'syml',           track: 'i wanted to leave' },
  'disney-star':        { term: 'When You Wish Upon a Star Pinocchio Cliff Edwards', artist: '',        track: 'wish upon a star' },
  'valzer-d-inverno':   { term: "Valzer d'Inverno Andrea Vanzo",              artist: 'vanzo',          track: 'valzer' },
  'little-things':      { term: 'Little Things Adrian Berenguer',            artist: 'berenguer',      track: 'little things' },
  'lauras-dance':       { term: "Laura's Dance Mirko Dukanovic",              artist: 'dukanovic',      track: 'dance' },
  'van-gogh':           { term: 'Van Gogh Virginio Aiello piano',             artist: 'aiello',         track: 'van gogh' },
  'passacaglia':        { term: 'Passacaglia Handel Halvorsen',               artist: '',               track: 'passacaglia' },
  'un-sospiro':         { term: 'Liszt Un Sospiro Concert Etude No. 3',       artist: '',               track: 'sospiro' },
  'rachmaninoff-pc2':   { term: 'Rachmaninoff Piano Concerto No. 2 Adagio sostenuto', artist: '',       track: 'concerto no. 2' },

  // ---- the classical wave. Mark: "some of them are classical old songs, surely
  // we can get a photo that represents that song? I pretty much only want a
  // generic photo if it's a chord or a scale."
  //
  // ⚖️ CODEX DISSENTS AND ITS OBJECTION IS RECORDED, NOT BURIED: a classical
  // album cover is ONE PERFORMER'S recording, not the piece. A beginner choosing
  // "Clair de Lune" is not choosing Kempff. It wanted scene art representing the
  // work instead — moonlit water, rain on glass — and called the three existing
  // Kempff/Karajan sleeves "evidence the mapping already conflates composition
  // with recording" rather than a precedent to extend.
  //
  // Overruled deliberately, on Mark's explicit preference for HIS app: fur-elise
  // has carried Kempff's Deutsche Grammophon sleeve for days and he never
  // objected to that one, he objected to the generative plates beside it. The
  // artist field is left empty for these so ANY credible performer passes and
  // the check falls on the WORK, which is the honest half of Codex's point.
  'clair-de-lune':      { term: 'Debussy Clair de Lune Suite bergamasque',    artist: '',               track: 'clair de lune' },
  'gymnopedie-1':       { term: 'Satie Gymnopedie No. 1',                     artist: '',               track: 'gymnop' },
  'arabesque-1':        { term: 'Debussy Arabesque No. 1 Deux Arabesques',    artist: '',               track: 'arabesque' },
  'bach-prelude-c':     { term: 'Bach Prelude in C major Well-Tempered Clavier Book 1', artist: '',     track: 'prelude' },
  'nocturne-op9-2':     { term: 'Chopin Nocturne in E-flat major Op. 9 No. 2', artist: '',              track: 'nocturne' },
  'liebestraum-3':      { term: 'Liszt Liebestraum No. 3 Dream of Love',      artist: '',               track: 'liebestraum' },
  'traumerei':          { term: 'Schumann Traumerei Kinderszenen',            artist: '',               track: 'ume' },
  'rondo-alla-turca':   { term: 'Mozart Rondo alla Turca Turkish March Sonata K331', artist: '',        track: 'turca' },
  'fantaisie-impromptu': { term: 'Chopin Fantaisie-Impromptu Op. 66',         artist: '',               track: 'impromptu' },
  'raindrop-prelude':   { term: 'Chopin Raindrop Prelude Op. 28 No. 15',      artist: '',               track: 'prelude' },
  'goldberg-aria':      { term: 'Bach Goldberg Variations Aria',              artist: '',               track: 'aria' },
  'pathetique-2':       { term: 'Beethoven Pathetique Sonata Adagio cantabile', artist: '',             track: 'adagio cantabile' },
  'consolation-3':      { term: 'Liszt Consolation No. 3 in D-flat major',    artist: '',               track: 'consolation' },
  'mozart-pc21-2':      { term: 'Mozart Piano Concerto No. 21 Andante Elvira Madigan', artist: '',      track: 'andante' },
  'prelude-e-minor':    { term: 'Chopin Prelude in E minor Op. 28 No. 4',     artist: '',               track: 'prelude' },

  // and the ones with a plain modern release, which nobody disputes
  'mia-sebastian':      { term: "Mia and Sebastian's Theme La La Land Justin Hurwitz", artist: 'hurwitz', track: 'mia' },
  // ☠️ the extra word 'piano' returned ZERO results for two of these. A search
  // term is not a description: every word narrows it, and 'Afterglow Clavier'
  // finds the single that 'Afterglow Clavier piano' cannot.
  'afterglow':          { term: 'Afterglow Clavier',                          artist: 'clavier',        track: 'afterglow' },
  'gray-day':           { term: 'Gray Day Clavier piano',                     artist: 'clavier',        track: 'gray day' },
  'last-waltz':         { term: 'Last Waltz Clavier',                         artist: 'clavier',        track: 'last waltz' },
  'married-life':       { term: 'Married Life Up Michael Giacchino',        artist: 'giacchino',      track: 'married life' },
  'pain':               { term: 'Pain Clavier',                               artist: 'clavier',        track: 'pain' },

  // ---- the 2026-09-14 wave. Mark, looking at the shelf after the 22-song
  // v132 import: "lots that were added recently don't have cover art we can get
  // cover art for." True: every song that arrives without a hand-written entry
  // here lands on a generative plate, and the import waves outran this map.
  // Same rule as every wave before it - the artist/track/album check runs first,
  // so a wrong sleeve is REJECTED, never substituted, and anything that misses
  // keeps the plate it already has.
  //
  // Classical follows the precedent set above: artist left EMPTY so any credible
  // performer passes and the check falls on the WORK, not on one recording.
  'the-entertainer':    { term: 'Scott Joplin The Entertainer',                artist: '',               track: 'entertainer', album: 'joplin' },
  'maple-leaf-rag':     { term: 'Scott Joplin Maple Leaf Rag',                 artist: '',               track: 'maple leaf', album: 'joplin' },
  'gnossienne-1':       { term: 'Satie Gnossienne No. 1',                      artist: '',               track: 'gnossienne', album: 'satie' },
  'petzold-minuet-g':   { term: 'Minuet in G major BWV Anh. 114 Notebook for Anna Magdalena Bach', artist: '', track: 'minuet in g major, bwv anh', album: 'bach' },
  'chopin-prelude-op28-7': { term: 'Chopin Prelude in A major Op. 28 No. 7',   artist: '',               track: 'prelude', album: 'chopin' },
  'clementi-sonatina-36-1': { term: 'Clementi Sonatina in C major Op. 36 No. 1', artist: '',             track: 'sonatina', album: 'clementi' },
  'schumann-melody-op68-1': { term: 'Schumann Album for the Young Melodie Op. 68', artist: '',           track: 'melod', album: 'schumann' },
  'schumann-soldiers-march': { term: "Schumann Soldiers' March Album for the Young Op. 68", artist: '',  track: 'march', album: 'schumann' },
  'burgmuller-arabesque': { term: 'Burgmuller 25 Etudes faciles Op. 100 Arabesque', artist: '',          track: 'arabesque', album: 'op. 100' },
  'burgmuller-candeur': { term: 'Burgmuller 25 Etudes faciles Op. 100 La Candeur', artist: '',           track: 'candeur', album: 'op. 100' },

  // film, television and game scores with a real commercial release
  'time-inception':     { term: 'Time Inception Hans Zimmer',                  artist: 'zimmer',         track: 'time', album: 'inception' },
  'schindlers-list':    { term: "Schindler's List Theme John Williams Itzhak Perlman", artist: '',       track: 'schindler' },
  'merry-christmas-mr-lawrence': { term: 'Merry Christmas Mr. Lawrence Ryuichi Sakamoto', artist: 'sakamoto', track: 'merry christmas' },
  'one-summers-day':    { term: "Spirited Away Joe Hisaishi One Summer's Day", artist: 'hisaishi',       track: "one summer's day", album: 'spirited away' },
  'minecraft-sweden':   { term: 'C418 Minecraft Volume Alpha Sweden',          artist: 'c418',           track: 'sweden' },
  'minecraft-wet-hands': { term: 'C418 Minecraft Volume Alpha Wet Hands',      artist: 'c418',           track: 'wet hands' },
  'silksong':           { term: 'Hollow Knight Silksong Christopher Larkin',   artist: 'larkin',         track: '', album: 'silksong' },

  // songs everybody knows, where one recording IS the record
  'hey-jude':           { term: 'Hey Jude The Beatles',                        artist: 'beatles',        track: 'hey jude', album: 'hey jude' },
  'perfect':            { term: 'Perfect Ed Sheeran Divide',                   artist: 'ed sheeran',     track: 'perfect' },
  // It Might as Well Be Swing, the 1964 record this was cut for, is not on the AU
  // store at all; the Sinatra-Basie Reprise set is where that same take lives.
  'fly-me-to-the-moon': { term: 'Fly Me to the Moon Frank Sinatra Count Basie', artist: 'sinatra', track: 'fly me to the moon', album: 'sinatra-basie' },
  'silent-night':       { term: 'Silent Night Bing Crosby',                    artist: 'crosby',         track: 'silent night' },
};

// iTunes has no honest release for these, so they come from MusicBrainz +
// the Cover Art Archive instead (checked: Nintendo has never put the Super
// Mario soundtrack on any store, so every iTunes hit is a cover band).
// mbid is pinned by hand after reading the search result, never guessed.
const MB = {
  'mario':     { mbid: '138c0ebc-2c41-4763-9b87-b6753e8946cb', artist: 'Koji Kondo', album: 'Super Mario Bros. 35 Original Soundtrack', year: '2020' },
  // 2026-09-14: same story as Mario. Every iTunes hit for the Zelda pieces is a
  // cover band, and 'Zelda's Lullaby' is hard-rejected by JUNK on the word
  // lullaby anyway. These four mbids were read out of a MusicBrainz release
  // search for Koji Kondo and each one was OPENED and looked at before it was
  // pinned here. The three Ocarina pieces share a sleeve because they share a
  // record, the same way the two Dr. Dre tracks both wear 2001.
  'gerudo-valley':    { mbid: 'e78b3cd0-7643-4520-99fe-4b180bb5098c', artist: 'Koji Kondo', album: 'The Legend of Zelda: Ocarina of Time (Original Soundtrack)', year: '1998' },
  'zeldas-lullaby':   { mbid: 'e78b3cd0-7643-4520-99fe-4b180bb5098c', artist: 'Koji Kondo', album: 'The Legend of Zelda: Ocarina of Time (Original Soundtrack)', year: '1998' },
  'song-of-storms':   { mbid: 'e78b3cd0-7643-4520-99fe-4b180bb5098c', artist: 'Koji Kondo', album: 'The Legend of Zelda: Ocarina of Time (Original Soundtrack)', year: '1998' },
  // the series theme is not an Ocarina track, so it wears the series record
  'zelda-main-theme': { mbid: 'fe88cd3f-1880-4ddf-98c4-2f74ca5f99f2', artist: 'Koji Kondo', album: 'The Legend of Zelda: 25th Anniversary Special Orchestra CD', year: '2011' },
};

// No honest recording exists at all for these. They keep the generative plate.
const NO_ALBUM = ['happy-birthday', 'bella-ciao', 'scale-c-major', 'scale-a-minor',
  // 2026-09-14: checked, not skipped. Greensleeves is a 16th-century tune whose
  // every release is somebody else's arrangement of it, and the twelve-bar blues
  // is a FORM plus Mark's own take on it. Neither has a record to photograph.
  'greensleeves', 'blues-in-c'];

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
  if (/greatest hits|very best|best of|essential|collection|now that|compilation|volume|vol\.|top 10|50 greatest|classical classics|masterpieces|while you work|for reading|for breakfast|relaxing|playlist|peaceful|lullabies|timeless|sensual|music for|\d{2,} pieces|\d{2,} minutes/i.test(c)) s -= 60;
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

const wanted = ([g]) => !ONLY.length || ONLY.includes(g);

for (const [group, want] of Object.entries(WANT).filter(wanted)) {
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
  if (DRY) {
    console.log(`\n${group}  <- "${want.term}"`);
    for (const c of cands) console.log(`   ${String(c.score).padStart(4)}  ${c.artist} - ${c.track}  [${c.album}, ${c.year}]`);
    continue;
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
for (const [group, m] of Object.entries(MB).filter(wanted)) {
  if (DRY) { console.log(`\n${group}  <- Cover Art Archive ${m.mbid} (${m.artist} - ${m.album})`); continue; }
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
for (const g of NO_ALBUM.filter((g) => !ONLY.length || ONLY.includes(g))) {
  manifest[g] = { file: null, reason: 'no canonical recording - generative plate' };
}
for (const [g, why] of Object.entries(rejects)) console.log(`MISS ${g.padEnd(20)} ${why}`);

if (DRY) { console.log('DRY=1: nothing downloaded, nothing written.'); process.exit(0); }

// MERGE, never replace. A group absent from this run keeps exactly the record it
// already had: the provenance in art.json and the sleeve on disk both survive.
const prev = await readFile(join(ART, 'art.json'), 'utf8').then(JSON.parse).catch(() => ({}));
const mergedManifest = { ...(prev.manifest ?? {}), ...manifest };
const mergedRejects = { ...(prev.rejects ?? {}) };
for (const g of Object.keys(manifest)) delete mergedRejects[g];
Object.assign(mergedRejects, rejects);

await writeFile(join(ART, 'art.json'), JSON.stringify({ fetched: new Date().toISOString(), source: 'iTunes Search API', manifest: mergedManifest, rejects: mergedRejects }, null, 2));

// The runtime module. The app must not fetch art.json at boot (offline PWA),
// so the manifest is compiled to an ES module the shell already caches.
// The generated plates registered by tools/register-sleeves.mjs live in this same
// module and are NOT this tool's to delete, so start from what is already there.
const existing = await readFile(join(ROOT, 'js', 'art-manifest.mjs'), 'utf8')
  .then((t) => JSON.parse(t.match(/export const ART = (\{[\s\S]*?\});?\s*$/)[1]))
  .catch(() => ({}));
const real = Object.fromEntries(Object.entries(mergedManifest)
  .filter(([, m]) => m.file)
  .map(([g, m]) => [g, { artist: m.artist, album: m.album, year: m.year }]));
const runtime = Object.fromEntries(Object.keys({ ...existing, ...real }).sort()
  .map((g) => [g, real[g] ?? existing[g]]));
const header = [
  '// GENERATED by tools/fetch-art.mjs. Do not hand-edit; re-run the fetcher.',
  '// group -> the real record its sleeve came from. Presence here means',
  '// art/512/<group>.jpg and art/128/<group>.jpg exist on disk.',
  '',
].join('\n');
await writeFile(join(ROOT, 'js', 'art-manifest.mjs'),
  header + 'export const ART = ' + JSON.stringify(runtime, null, 2) + ';\n');
console.log(`wrote js/art-manifest.mjs (${Object.keys(runtime).length} sleeves)`);
console.log(`\n${Object.values(mergedManifest).filter((m) => m.file).length} groups with real art, ${Object.values(runtime).filter((v) => v.generated).length} on a generative plate, ${Object.keys(mergedRejects).length} misses`);
