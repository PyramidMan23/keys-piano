#!/bin/sh
# Ground-truth corpus: performances of pieces whose ENGRAVED SCORES we already
# hold in the library. Aligning one to the other transfers the score's true
# beats and bar lines onto real rubato playing - truth for free, no purchases.
set -u
V="/c/Users/markh/keys-piano-tools/venv/Scripts"
W="/c/Users/markh/keys-piano-tools/workshop"
fetch() {
  slug="$1"; id="$2"
  if [ ! -f "$W/$slug.wav" ]; then
    "$V/yt-dlp.exe" -x --audio-format wav --audio-quality 0 -o "$W/$slug.%(ext)s" \
      "https://www.youtube.com/watch?v=$id" >/dev/null 2>&1 || { echo "FETCH FAILED $slug"; return; }
  fi
  [ -s "$W/$slug.wav" ] || { echo "EMPTY WAV $slug"; return; }
  if [ ! -f "$W/$slug.mid" ]; then
    "$V/python.exe" /c/Users/markh/keys-piano-tools/transcribe.py "$W/$slug.wav" "$W/$slug.mid" >/dev/null 2>&1
  fi
  head -c 4 "$W/$slug.mid" 2>/dev/null | grep -q MThd || { echo "NO MIDI $slug"; return; }
  "$V/python.exe" /c/Users/markh/keys-piano-tools/pulse.py "$W/$slug.wav" "$W/$slug.beats.json"
}
fetch perf-gymnopedie-1     2WfaotSK3mI
fetch perf-arabesque-1      cVYH-7QGE-A
fetch perf-bach-prelude-c   frxT2qB1POQ
fetch perf-rondo-alla-turca aeEmGvm7kDk
fetch perf-traumerei        6z82w0l6kwE
fetch perf-goldberg-aria    64NWDOzDtIY
echo "CORPUS FETCH DONE"
