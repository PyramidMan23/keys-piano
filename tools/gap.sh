#!/bin/sh
# THE STRAGGLERS: what Mutopia did not carry, and what the first pass refused.
#   - Rachmaninoff PC2 2nd mvt and Un Sospiro: 2 of Mark's 19 classical titles,
#     neither on Mutopia (still in copyright there or simply absent).
#   - never-gonna: transcribed on the first pass, but EVERY tier failed the
#     playability audit, so nothing was written. A cleaner solo-piano source is
#     the fix; shipping the refused one would teach the wrong hands.
#   - gladiator: its search returned no usable audio. Also chapter 8 of the
#     compilation, so this is the belt to that braces.
set -u
V="/c/Users/markh/keys-piano-tools/venv/Scripts"
W="/c/Users/markh/keys-piano-tools/workshop"
K="/c/Users/markh/keys-piano"

run() {
  slug="$1"; query="$2"; title="$3"; composer="$4"
  echo ""
  echo "=============== $slug"
  if [ ! -f "$W/$slug.wav" ] && [ ! -f "$W/$slug.mid" ]; then
    "$V/yt-dlp.exe" -x --audio-format wav --audio-quality 0 \
      --match-filter "duration<600 & duration>45" \
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
    | grep -E "^(ok|REFUSED|only one|pedal|hands: moved)"
}

run rachmaninoff-pc2 "Rachmaninoff Piano Concerto No 2 second movement piano solo arrangement" "Piano Concerto No. 2 (2nd Movement)" "Sergei Rachmaninoff"
run un-sospiro       "Liszt Un Sospiro piano solo"                     "Un Sospiro"              "Franz Liszt"
run never-gonna-2    "Never Gonna Give You Up easy piano solo cover"   "Never Gonna Give You Up" "Stock Aitken Waterman"
run gladiator        "Now We Are Free Gladiator piano solo"            "Now We Are Free"         "Hans Zimmer"
echo ""
echo "=============== gap done"
