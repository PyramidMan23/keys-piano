// WHAT KIND OF THING IS THIS, AND WHAT SHELF DOES IT BELONG ON?
//
// Explore is the all-songs wall (Mark, 2026-08-30: "that's our all songs
// area"), and at 81 pieces a wall is not a library: everything is on it and
// nothing can be found. The collection chips over the wall need two facts the
// song data never carried, because neither can be derived from notes:
//
//   kind  is this MUSIC or a technique DRILL. The 46 ladder scales and
//         arpeggios already hide from Explore behind `song.ladder`, but the two
//         original scale songs (scale-c-major, scale-a-minor) predate the
//         ladder and have no flag, so they sat between Rondo alla Turca and
//         Runaway as though they were repertoire. They belong on the 12-keys
//         surface with their 46 siblings.
//   tags  which collection the piece answers to. Composer is not enough:
//         Koji Kondo wrote Mario and Zelda (games), John Williams wrote Jaws
//         and Star Wars (film), and no field in the song says so.
//
// Keyed by `song.group ?? song.id`, the key every other side-file here uses
// (METER, BARS, QUARANTINE), so the easy, medium and hard arrangements of one
// piece share one entry and can never drift apart.
//
// ☠️ COVERAGE IS A GATE, NOT A HABIT, AND IT WALKS THE RAW CATALOGUE. The gate
// in test/check.mjs fails if any song in SONGS is missing from this map, carries
// an unknown tag, or carries an unknown kind.
//
// SONGS, not SHELF: three groups (in-the-end, stairway, gray-day) ship only
// quarantined tiers, so a gate that walked the shelf would have let them through
// unclassified, and the day a quarantined tier is released it would arrive on
// the wall with no collection and nothing red. Codex caught that in review of
// the first cut. Classification is a fact about the music, not about whether a
// tier currently passes the playability audit, so it is written for all 132
// groups; the chips still count only what the shelf renders, which is 129.
//
// The gate is deliberate: an import that adds a song without classifying it
// would otherwise land silently in "All" and nowhere else, and nothing would go
// red. The cost of the gate is one line per import.
//
// Hand-written, from each song's own title and composer. A tag is a claim about
// where the music came from, so it is only ever written where that is plain:
// nothing here is inferred from key, tempo or note count.
export const KINDS = ['piece', 'exercise'];
export const TAGS = ['classical', 'pop', 'rock', 'film', 'games', 'anime', 'jazz', 'blues',
  'folk', 'hymns', 'christmas', 'contemporary'];

const piece = (...tags) => ({ kind: 'piece', tags });
// A drill is not on any collection: it carries no tags at all rather than a
// made-up one, and Explore never shows it.
const drill = () => ({ kind: 'exercise', tags: [] });

export const LIBRARY = {
  // ---- classical: the composer is dead and the score is the source ----
  'arabesque-1': piece('classical'),
  'bach-prelude-c': piece('classical'),
  'clair-de-lune': piece('classical'),
  'consolation-3': piece('classical'),
  'fantaisie-impromptu': piece('classical'),
  'fur-elise': piece('classical'),
  'goldberg-aria': piece('classical'),
  'gymnopedie-1': piece('classical'),
  'liebestraum-3': piece('classical'),
  'moonlight-sonata': piece('classical'),
  'mozart-pc21-2': piece('classical'),
  'nocturne-op9-2': piece('classical'),
  'ode-to-joy': piece('classical'),
  'passacaglia': piece('classical'),
  'pathetique-2': piece('classical'),
  'prelude-e-minor': piece('classical'),
  'rachmaninoff-pc2': piece('classical'),
  'raindrop-prelude': piece('classical'),
  'rondo-alla-turca': piece('classical'),
  'traumerei': piece('classical'),
  'un-sospiro': piece('classical'),

  // ---- pop ----
  'beanie': piece('pop'),
  'coffin-dance': piece('pop'),          // Astronomia, Tony Igy: a dance single
  'empire': piece('pop'),
  'faded': piece('pop'),
  'fray-save-a-life': piece('pop'),
  'gangstas-paradise': piece('pop'),
  'i-wanted-to-leave': piece('pop'),
  'last-friday-night': piece('pop'),
  'never-gonna-2': piece('pop'),
  'next-episode': piece('pop'),
  'piano-man': piece('pop'),
  'runaway': piece('pop'),
  'say-yes-to-heaven': piece('pop'),
  'see-you-again': piece('pop'),
  'still-dre': piece('pop'),

  // ---- rock ----
  'in-the-end': piece('rock'),          // quarantined tiers, still classified: see the note above
  'stairway': piece('rock'),
  'bohemian-rhapsody': piece('rock'),
  'hotel-california': piece('rock'),
  'in-a-gadda-da-vida': piece('rock'),
  'lost': piece('rock'),
  'numb': piece('rock'),
  'what-ive-done': piece('rock'),
  'work-this-time': piece('rock'),
  // Maxence Cyrin's own solo-piano reworking of a Pixies song: the arrangement
  // is contemporary piano, the song is rock, and both are true of what is
  // being played. Two tags, because one of them would be a half-truth.
  'where-is-my-mind': piece('contemporary', 'rock'),

  // ---- film and television ----
  'disney-star': piece('film'),          // When You Wish Upon a Star, Pinocchio
  'game-of-thrones': piece('film'),
  'gladiator': piece('film'),
  'imperial-march': piece('film'),
  'interstellar': piece('film'),
  'jaws': piece('film'),
  'light-of-the-seven': piece('film'),
  'married-life': piece('film'),         // Up
  'mia-sebastian': piece('film'),        // La La Land
  'pirates': piece('film'),
  'star-wars': piece('film'),
  'x-files': piece('film'),              // a screen theme, same shelf as the rest
  // Tiersen wrote it for solo piano AND it is the Amelie theme; a listener
  // looking under either heading is looking for the same piece.
  'comptine': piece('contemporary', 'film'),

  // ---- games ----
  'gerudo-valley': piece('games'),
  'mario': piece('games'),
  'overwatch': piece('games'),
  'silksong': piece('games'),
  'song-of-storms': piece('games'),
  'zelda-main-theme': piece('games'),
  'zeldas-lullaby': piece('games'),

  // ---- folk ----
  'bella-ciao': piece('folk'),
  'happy-birthday': piece('folk'),

  // ---- contemporary: living composers writing for solo piano ----
  'afterglow': piece('contemporary'),
  'gray-day': piece('contemporary'),    // Clavier, like Afterglow, Last Waltz and Pain
  'i-giorni': piece('contemporary'),
  'icarus': piece('contemporary'),
  'idea-10': piece('contemporary'),
  'idea-12': piece('contemporary'),
  'la-petite-fille': piece('contemporary'),
  'last-waltz': piece('contemporary'),
  'lauras-dance': piece('contemporary'),
  'little-things': piece('contemporary'),
  'mariage-d-amour': piece('contemporary'),
  'pain': piece('contemporary'),
  'river': piece('contemporary'),
  'see-you-tomorrow': piece('contemporary'),
  'valzer-d-inverno': piece('contemporary'),
  'van-gogh': piece('contemporary'),

  // ---- technique: the 12-keys ladder, plus the two scale songs that predate it ----
  'scale-a-minor': drill(),
  'scale-c-major': drill(),
  'scale-a-major': drill(),
  'scale-ab-major': drill(),
  'scale-b-major': drill(),
  'scale-b-minor': drill(),
  'scale-bb-major'
: drill(),
  'scale-bb-minor': drill(),
  'scale-c-minor': drill(),
  'scale-cs-minor': drill(),
  'scale-d-major': drill(),
  'scale-d-minor': drill(),
  'scale-db-major': drill(),
  'scale-e-major': drill(),
  'scale-e-minor': drill(),
  'scale-eb-major': drill(),
  'scale-eb-minor': drill(),
  'scale-f-major': drill(),
  'scale-f-minor': drill(),
  'scale-fs-major': drill(),
  'scale-fs-minor': drill(),
  'scale-g-major': drill(),
  'scale-g-minor': drill(),
  'scale-gs-minor': drill(),
  'arp-a-majarp': drill(),
  'arp-a-minarp': drill(),
  'arp-ab-majarp': drill(),
  'arp-b-majarp': drill(),
  'arp-b-minarp': drill(),
  'arp-bb-majarp': drill(),
  'arp-bb-minarp': drill(),
  'arp-c-majarp': drill(),
  'arp-c-minarp': drill(),
  'arp-cs-minarp': drill(),
  'arp-d-majarp': drill(),
  'arp-d-minarp': drill(),
  'arp-db-majarp': drill(),
  'arp-e-majarp': drill(),
  'arp-e-minarp': drill(),
  'arp-eb-majarp': drill(),
  'arp-eb-minarp': drill(),
  'arp-f-majarp': drill(),
  'arp-f-minarp': drill(),
  'arp-fs-majarp': drill(),
  'arp-fs-minarp': drill(),
  'arp-g-majarp': drill(),
  'arp-g-minarp': drill(),
  'arp-gs-minarp': drill(),

  // ---- the 13 September batch: 22 pieces, sourced by four agents --------------
  // Public domain from Mutopia (Greensleeves through the two Joplin rags), the
  // video lane for everything in copyright, and one original twelve-bar blues.
  // Ragtime carries both jazz and classical: Joplin is the root of one and is
  // written like the other, and a person looking under either wants him.
  'greensleeves': { kind: 'piece', tags: ['folk'] },
  'silent-night': { kind: 'piece', tags: ['christmas', 'hymns'] },
  'chopin-prelude-op28-7': { kind: 'piece', tags: ['classical'] },
  'schumann-melody-op68-1': { kind: 'piece', tags: ['classical'] },
  'schumann-soldiers-march': { kind: 'piece', tags: ['classical'] },
  'petzold-minuet-g': { kind: 'piece', tags: ['classical'] },
  'burgmuller-candeur': { kind: 'piece', tags: ['classical'] },
  'burgmuller-arabesque': { kind: 'piece', tags: ['classical'] },
  'clementi-sonatina-36-1': { kind: 'piece', tags: ['classical'] },
  'gnossienne-1': { kind: 'piece', tags: ['classical'] },
  'the-entertainer': { kind: 'piece', tags: ['jazz', 'classical'] },
  'maple-leaf-rag': { kind: 'piece', tags: ['jazz', 'classical'] },
  'blues-in-c': { kind: 'piece', tags: ['blues'] },
  'hey-jude': { kind: 'piece', tags: ['pop'] },
  'perfect': { kind: 'piece', tags: ['pop'] },
  'schindlers-list': { kind: 'piece', tags: ['film'] },
  'time-inception': { kind: 'piece', tags: ['film'] },
  'minecraft-sweden': { kind: 'piece', tags: ['games'] },
  'minecraft-wet-hands': { kind: 'piece', tags: ['games'] },
  'one-summers-day': { kind: 'piece', tags: ['anime'] },
  'fly-me-to-the-moon': { kind: 'piece', tags: ['jazz'] },
  'merry-christmas-mr-lawrence': { kind: 'piece', tags: ['contemporary'] },
};
