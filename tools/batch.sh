#!/bin/sh
# THE 10 SONGS MARK ASKED FOR THAT NEVER GOT ADDED.
#
# Mark, 2026-08-31: "what have we been doing this whole time, where are the
# songs I told you to add?" Fair. They were never built.
#
# audio -> MIDI -> library, per song, resumable: an existing .wav or .mid is
# reused so a re-run costs nothing. Search terms aim at SOLO PIANO covers on
# purpose: the transcriber is a piano model, and feeding it a full orchestral
# or produced track gives mush.
set -u
V="/c/Users/markh/keys-piano-tools/venv/Scripts"
W="/c/Users/markh/keys-piano-tools/workshop"
K="/c/Users/markh/keys-piano"
mkdir -p "$W"

run() {
  slug="$1"; query="$2"; title="$3"; composer="$4"
  echo ""
  echo "=============== $slug"
  if [ ! -f "$W/$slug.wav" ] && [ ! -f "$W/$slug.mid" ]; then
    "$V/yt-dlp.exe" -x --audio-format wav --audio-quality 0 \
      --match-filter "duration<420 & duration>45" \
      -o "$W/$slug.%(ext)s" "ytsearch1:$query" >/dev/null 2>&1 \
      || { echo "FETCH FAILED $slug"; return; }
  fi
  if [ ! -f "$W/$slug.mid" ]; then
    "$V/python.exe" /c/Users/markh/keys-piano-tools/transcribe.py "$W/$slug.wav" "$W/$slug.mid" 2>&1 | tail -1
  fi
  [ -f "$W/$slug.mid" ] || { echo "NO MIDI $slug"; return; }
  node "$K/tools/import-midi.mjs" "$W/$slug.mid" --id "$slug" --title "$title" \
    --composer "$composer" --group "$slug" \
    --source "machine transcription of a solo piano performance, 2026-08-31" 2>&1 \
    | grep -E "^(ok|REFUSED|only one|wrote|read)"
}

run next-episode      "The Next Episode Dr Dre piano cover solo"        "The Next Episode"        "Dr. Dre"
run jaws              "Jaws theme piano solo cover"                     "Jaws"                    "John Williams"
run coffin-dance      "Astronomia Coffin Dance piano cover solo"        "Astronomia"              "Tony Igy"
run never-gonna       "Never Gonna Give You Up piano cover solo"        "Never Gonna Give You Up" "Stock Aitken Waterman"
run x-files           "X-Files theme piano cover solo"                  "The X-Files"             "Mark Snow"
run disney-star       "When You Wish Upon a Star piano solo cover"      "When You Wish Upon a Star" "Leigh Harline"
run gladiator         "Now We Are Free Gladiator piano solo cover"      "Now We Are Free"         "Hans Zimmer"
run overwatch         "Overwatch main theme piano cover solo"           "Overwatch"               "Derek Duke"
run last-friday-night "Last Friday Night Katy Perry piano cover solo"   "Last Friday Night"       "Katy Perry"
echo ""
echo "=============== batch done"
