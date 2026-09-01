# THE EAR HALF OF THE TEMPO LANE: track beats in a performance recording.
#
# Emits a sidecar JSON: tracked beat times (seconds), tempo estimate, and the
# evidence a promotion decision needs. It never writes into the app - promotion
# to metered display happens only through thresholds calibrated by
# tempo-truth.mjs on the ground-truth corpus (council 2026-09-01).
#
#   venv/Scripts/python.exe pulse.py <audio.wav> <out.json>
import sys, json
import scipy.signal, scipy.signal.windows
if not hasattr(scipy.signal, 'hann'):   # librosa 0.9.2 predates scipy's window move
    scipy.signal.hann = scipy.signal.windows.hann
import librosa, numpy as np

wav, out = sys.argv[1], sys.argv[2]
y, sr = librosa.load(wav, sr=22050, mono=True)
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
tempo, frames = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, trim=False)
beats = librosa.frames_to_time(frames, sr=sr)
iv = np.diff(beats)
cv = float(np.std(iv) / np.mean(iv)) if len(iv) > 4 else 9.9

# accent strength AT each tracked beat: the raw material for downbeat finding.
# kept as evidence, judged later - the tracker itself claims nothing about bars.
acc = [float(onset_env[f]) if f < len(onset_env) else 0.0 for f in frames]

json.dump({
    'source': wav,
    'tempo_bpm': float(tempo),
    'beats': [round(float(b), 4) for b in beats],
    'interval_cv': round(cv, 4),
    'beat_accents': [round(a, 2) for a in acc],
    'duration_s': round(float(len(y) / sr), 2),
}, open(out, 'w'))
print(f'{len(beats)} beats, tempo {float(tempo):.1f} bpm, interval spread {cv*100:.1f}% -> {out}')
