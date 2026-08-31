#!/bin/sh
# RE-IMPORT every transcription already on disk, through the current importer.
#
# Mark asked for every song "easy medium hard" and only 43 of 84 had three. The
# importer now repairs the hands of EACH TIER rather than only the parent, and
# defines hard as the fullest PLAYABLE reduction rather than every transcribed
# note. Both only take effect on a re-import, and no audio is re-fetched: this
# reads the .mid files that already exist, so it is cheap.
#
# The id and title come from the song already in the library, so nothing is
# retyped from memory and a re-run cannot rename anything.
set -u
K="/c/Users/markh/keys-piano"
node "$K/tools/reimport-plan.mjs" > /tmp/reimport-plan.tsv || exit 1
echo "$(wc -l < /tmp/reimport-plan.tsv) transcriptions to re-import"
while IFS="	" read -r mid id title composer; do
  [ -f "$mid" ] || { echo "MISSING $mid"; continue; }
  out=$(node "$K/tools/import-midi.mjs" "$mid" --id "$id" --title "$title" \
    --composer "$composer" --group "$id" \
    --source "machine transcription of a solo piano performance, 2026-08-31" 2>&1)
  tiers=$(echo "$out" | grep -cE "^ok ")
  echo "  $id: $tiers tier(s)"
done < /tmp/reimport-plan.tsv
echo "reimport-all done"
