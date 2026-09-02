# Run the hand landmarker over EVERY frame in VIDEO mode (temporal tracking) and
# write one compact record per frame: for each detected hand its wrist, the five
# fingertips, the MCP knuckles (for orientation), MediaPipe's label and score.
#   python hands-track.py <video> <out.json> [t0 t1]
import sys, json
import cv2
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
path, out = sys.argv[1], sys.argv[2]
t0 = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
t1 = float(sys.argv[4]) if len(sys.argv) > 4 else 1e9
opts = vision.HandLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path='C:/Users/markh/keys-piano-tools/models/hand_landmarker.task'),
    running_mode=vision.RunningMode.VIDEO, num_hands=2, min_hand_detection_confidence=0.3, min_hand_presence_confidence=0.3, min_tracking_confidence=0.3)
det = vision.HandLandmarker.create_from_options(opts)
cap = cv2.VideoCapture(path)
fps = cap.get(cv2.CAP_PROP_FPS); w = int(cap.get(3)); h = int(cap.get(4))
TIPS = (4, 8, 12, 16, 20); MCP = (5, 9, 13, 17)
frames = []
i = 0
while True:
    ok, frame = cap.read()
    if not ok: break
    t = i / fps
    if t >= t0 and t <= t1:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), int(round(t * 1000)))
        hands = []
        for lm, hd in zip(res.hand_landmarks, res.handedness):
            hands.append({'lab': hd[0].category_name[0], 'sc': round(hd[0].score, 2),
                          'w': [round(lm[0].x * w), round(lm[0].y * h)],
                          'tips': [[round(lm[k].x * w), round(lm[k].y * h)] for k in TIPS],
                          'mcp': [[round(lm[k].x * w), round(lm[k].y * h)] for k in MCP]})
        frames.append({'t': round(t, 4), 'h': hands})
    i += 1
    if t > t1: break
json.dump({'video': path, 'fps': fps, 'w': w, 'h': h, 'frames': frames}, open(out, 'w'))
n = len(frames); two = sum(1 for f in frames if len(f['h']) == 2); one = sum(1 for f in frames if len(f['h']) == 1)
print(f"{path}: {n} frames, two hands in {two} ({100*two/max(1,n):.0f}%), one in {one}, none in {n-two-one}")
