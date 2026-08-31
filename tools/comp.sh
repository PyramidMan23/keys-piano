#!/bin/sh
# THE 23-SONG COMPILATION Mark linked and I never started.
# https://www.youtube.com/watch?v=ssN7_u08HFY - "most beautiful piano pieces", 65 min.
#
# The video carries 23 real chapter markers with titles and composers, so the
# pieces are SPLIT BY CHAPTER rather than guessed at from silence: each track is
# already one solo-piano piece with a name attached. Title and composer come out
# of the chapter title, so nothing here is typed from memory.
#
# Resumable: an existing .mid is reused, so a re-run costs nothing.
set -u
V="/c/Users/markh/keys-piano-tools/venv/Scripts"
C="/c/Users/markh/keys-piano-tools/workshop/comp"
K="/c/Users/markh/keys-piano"

for wav in "$C"/[0-9][0-9]-*.wav; do
  [ -f "$wav" ] || continue
  base=$(basename "$wav" .wav)
  num=$(echo "$base" | cut -c1-2)
  rest=$(echo "$base" | cut -c4-)
  title=$(echo "$rest" | sed 's/ - [^-]*$//')
  composer=$(echo "$rest" | sed 's/.* - //')
  slug=$(echo "$title" | tr 'A-Z' 'a-z' | sed 's/[^a-z0-9]\+/-/g; s/^-//; s/-$//' | cut -c1-34)
  mid="$C/$slug.mid"
  echo ""
  echo "=============== $num $slug   ($title / $composer)"
  if [ ! -f "$mid" ]; then
    "$V/python.exe" /c/Users/markh/keys-piano-tools/transcribe.py "$wav" "$mid" 2>&1 | tail -1
  fi
  [ -f "$mid" ] || { echo "NO MIDI $slug"; continue; }
  node "$K/tools/import-midi.mjs" "$mid" --id "$slug" --title "$title" \
    --composer "$composer" --group "$slug" \
    --source "machine transcription of a solo piano performance, 2026-08-31" 2>&1 \
    | grep -E "^(ok|REFUSED|only one|wrote|read)"
done
echo ""
echo "=============== compilation done"
