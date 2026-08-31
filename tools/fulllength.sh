#!/bin/sh
# FULL-LENGTH SOURCES for the 23 compilation pieces.
#
# Mark: "make sure these get added in as well in their full lengths and not just
# how long they go for in this video." The compilation is 65 minutes for 23
# pieces, ~2.8 min each, so most are edits. Each piece is re-fetched from its own
# recording, searched by the title and composer the video's OWN chapter markers
# gave us, so nothing here is typed from memory.
#
# Imported under the SAME id as the chapter version, so a longer take simply
# replaces the shorter one. Resumable: an existing .mid is reused.
set -u
V="/c/Users/markh/keys-piano-tools/venv/Scripts"
F="/c/Users/markh/keys-piano-tools/workshop/full"
K="/c/Users/markh/keys-piano"
mkdir -p "$F"

run() {
  slug="$1"; title="$2"; composer="$3"
  echo ""
  echo "=============== $slug"
  if [ ! -f "$F/$slug.wav" ] && [ ! -f "$F/$slug.mid" ]; then
    "$V/yt-dlp.exe" -x --audio-format wav --audio-quality 0 --no-playlist \
      --match-filter "duration<900 & duration>90" \
      -o "$F/$slug.%(ext)s" "ytsearch1:$title $composer piano solo full" >/dev/null 2>&1 \
      || { echo "FETCH FAILED $slug"; return; }
  fi
  [ -f "$F/$slug.wav" ] || { echo "NO AUDIO $slug"; return; }
  if [ ! -f "$F/$slug.mid" ]; then
    "$V/python.exe" /c/Users/markh/keys-piano-tools/transcribe.py "$F/$slug.wav" "$F/$slug.mid" 2>&1 | tail -1
  fi
  [ -f "$F/$slug.mid" ] || { echo "NO MIDI $slug"; return; }
  node "$K/tools/import-midi.mjs" "$F/$slug.mid" --id "$slug" --title "$title" \
    --composer "$composer" --group "$slug" \
    --source "machine transcription of a full-length solo piano performance, 2026-08-31" 2>&1 \
    | grep -E "^(ok|REFUSED|only one)"
}

run passacaglia          "Passacaglia"                "Handel Halvorsen"
run comptine             "Comptine d'un autre ete"    "Yann Tiersen"
run valzer-d-inverno     "Valzer d'Inverno"           "Andrea Vanzo"
run pain                 "Pain"                       "Clavier"
run van-gogh             "Van Gogh"                   "Virginio Aiello"
run idea-10              "Idea 10"                    "Gibran Alcocer"
run now-we-are-free      "Now We Are Free"            "Hans Zimmer"
run mia-sebastian        "Mia and Sebastian's Theme"  "Justin Hurwitz"
run last-waltz           "Last Waltz"                 "Clavier"
run i-wanted-to-leave    "I Wanted to Leave"          "SYML"
run little-things        "Little Things"              "Adrian Berenguer"
run la-petite-fille      "La Petite Fille de la Mer"  "Vangelis"
run gray-day             "Gray Day"                   "Clavier"
run lauras-dance         "Laura's Dance"              "Mirko Dukanovic"
run see-you-tomorrow     "See You Tomorrow"           "Evgeny Grinko"
run idea-12              "Idea 12"                    "Gibran Alcocer"
run beanie               "Beanie"                     "Chezile"
run where-is-my-mind     "Where Is My Mind"           "Maxence Cyrin"
run afterglow            "Afterglow"                  "Clavier"
run mariage-d-amour      "Mariage d'Amour"            "Paul de Senneville"
run say-yes-to-heaven    "Say Yes to Heaven"          "Lana Del Rey"
run i-giorni             "I Giorni"                   "Ludovico Einaudi"
echo ""
echo "=============== full lengths done"
