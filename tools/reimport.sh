#!/bin/sh
# RE-IMPORT every machine transcription through the CORRECTED importer.
#
# The first songs of the batch went through before three fixes landed:
#   - notes the model TIMED OUT on (600 frames = 6s, piano_vad.py:64) had their
#     invented 6-second duration shipped as if measured
#   - SPAN_MAX was 16 in the importer and 14 in the shipping audit, so the
#     importer approved shapes the audit then condemned
#   - the repair pass only knew about wide chords, not crossings or travel
#
# No transcription is redone: the .mid files already exist, so this is cheap.
set -u
K="/c/Users/markh/keys-piano"
W="/c/Users/markh/keys-piano-tools/workshop"

imp() {
  [ -f "$2" ] || { echo "MISSING $2"; return; }
  node "$K/tools/import-midi.mjs" "$2" --id "$1" --title "$3" --composer "$4" --group "$1" \
    --source "machine transcription of a solo piano performance, 2026-08-31" 2>&1 \
    | grep -E "^(ok|REFUSED|only one|pedal|hands: moved)" | sed "s/^/  /"
  echo "--- $1"
}

imp imperial-march   "$W/imperial-march.mid"   "The Imperial March"      "John Williams"
imp next-episode     "$W/next-episode.mid"     "The Next Episode"        "Dr. Dre"
imp jaws             "$W/jaws.mid"             "Jaws"                    "John Williams"
imp coffin-dance     "$W/coffin-dance.mid"     "Astronomia"              "Tony Igy"
imp never-gonna      "$W/never-gonna.mid"      "Never Gonna Give You Up" "Stock Aitken Waterman"
imp x-files          "$W/x-files.mid"          "The X-Files"             "Mark Snow"
imp disney-star      "$W/disney-star.mid"      "When You Wish Upon a Star" "Leigh Harline"
imp gladiator        "$W/gladiator.mid"        "Now We Are Free"         "Hans Zimmer"
imp overwatch        "$W/overwatch.mid"        "Overwatch"               "Derek Duke"
imp last-friday-night "$W/last-friday-night.mid" "Last Friday Night"     "Katy Perry"
echo "reimport done"
