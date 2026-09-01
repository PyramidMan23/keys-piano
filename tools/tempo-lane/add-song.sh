#!/bin/sh
# ONE COMMAND FROM MARK'S VIDEO TO A SONG ON THE SHELF.
#
# Mark, 2026-09-01: "I'm gonna be able to give you a video, tell you a song,
# and then we can add it to the app." This is that, end to end:
#
#   sh add-song.sh <youtube-url> <slug> "<Title>" "<Composer>"
#
# url    -> HIS EXACT LINK. Never a search. ☠️ The 08-31 batch fetched by
#           ytsearch1 and shipped whatever ranked first at 1am; Overwatch was
#           the wrong recording for two days and Mark heard it. The url is the
#           spec, and it is recorded in the song's source line so provenance
#           is checkable forever.
# audio  -> wav via yt-dlp, transcribed by the ByteDance model
# pulse  -> pulse.py sidecar (beats/tempo evidence for the tempo lane; the
#           song ships as FREE TIME until tempo-truth thresholds promote it)
# import -> tiers built and gated by the playability audit
# rebuild-> the derived chain, in the one order that works (tools/rebuild.mjs)
#
# What it does NOT do: bump sw.js VERSION, commit, or push. Ship is a decision.
set -eu
URL="$1"; SLUG="$2"; TITLE="$3"; COMPOSER="$4"
V="/c/Users/markh/keys-piano-tools/venv/Scripts"
W="/c/Users/markh/keys-piano-tools/workshop"
K="/c/Users/markh/keys-piano"

echo "=============== $SLUG"
"$V/yt-dlp.exe" --print "%(title)s | %(duration)s sec | %(channel)s" --skip-download "$URL"

if [ ! -f "$W/$SLUG.wav" ]; then
  "$V/yt-dlp.exe" -x --audio-format wav --audio-quality 0 -o "$W/$SLUG.%(ext)s" "$URL" >/dev/null 2>&1
fi
[ -s "$W/$SLUG.wav" ] || { echo "☠️ FETCH FAILED or empty wav - stopping before a corpse becomes the source"; exit 1; }

if [ ! -f "$W/$SLUG.mid" ]; then
  "$V/python.exe" /c/Users/markh/keys-piano-tools/transcribe.py "$W/$SLUG.wav" "$W/$SLUG.mid" 2>&1 | tail -1
fi
# ☠️ a MIDI header check, because a 0-byte or 503-page file once became the
# only "source" for Moonlight and nobody noticed for days
head -c 4 "$W/$SLUG.mid" | grep -q "MThd" || { echo "☠️ NO VALID MIDI - stopping"; exit 1; }

"$V/python.exe" /c/Users/markh/keys-piano-tools/pulse.py "$W/$SLUG.wav" "$W/$SLUG.beats.json"

KEYS_RAW_QUARANTINE=1 node "$K/tools/import-midi.mjs" "$W/$SLUG.mid" \
  --id "$SLUG" --title "$TITLE" --composer "$COMPOSER" --group "$SLUG" \
  --source "machine transcription of a solo piano performance, $URL (Mark's own link)"

node "$K/tools/rebuild.mjs"

echo ""
echo "on the shelf:"
node --input-type=module -e "
import { SHELF } from 'file:///C:/Users/markh/keys-piano/js/songs.mjs';
const t = SHELF.filter((s) => (s.group ?? s.id) === '$SLUG');
console.log(t.length ? t.map((s) => '  ' + s.id + '  ' + (s.level ?? '') + '  ' + s.notes.length + ' notes').join('\n') : '  NOTHING - every tier was refused; read the import output above for why');
"
echo ""
echo "next: run the gates, bump sw.js VERSION, then ship (tools in $K)"
