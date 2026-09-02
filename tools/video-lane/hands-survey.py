# Feasibility survey: sample one frame per second across a video, run the hand
# landmarker in VIDEO mode (temporal), and report detection rate, how often two
# hands are seen, and how the handedness labels behave against wrist x order.
import sys, json
import cv2, numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
path, out = sys.argv[1], sys.argv[2]
step = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
opts = vision.HandLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path='C:/Users/markh/keys-piano-tools/models/hand_landmarker.task'),
    running_mode=vision.RunningMode.VIDEO, num_hands=2, min_hand_detection_confidence=0.3, min_hand_presence_confidence=0.3, min_tracking_confidence=0.3)
det = vision.HandLandmarker.create_from_options(opts)
cap = cv2.VideoCapture(path)
fps = cap.get(cv2.CAP_PROP_FPS); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); w = int(cap.get(3)); h = int(cap.get(4))
rows = []
t = 0.0
while True:
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, frame = cap.read()
    if not ok: break
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res = det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), int(t * 1000))
    hands = []
    for lm, hd in zip(res.hand_landmarks, res.handedness):
        hands.append({'label': hd[0].category_name, 'score': round(hd[0].score, 2), 'wx': round(lm[0].x * w), 'wy': round(lm[0].y * h),
                      'tips': [[round(lm[i].x * w), round(lm[i].y * h)] for i in (4, 8, 12, 16, 20)]})
    rows.append({'t': round(t, 2), 'hands': hands})
    t += step
    if t > n / fps: break
json.dump({'video': path, 'fps': fps, 'w': w, 'h': h, 'samples': rows}, open(out, 'w'))
tot = len(rows); two = sum(1 for r in rows if len(r['hands']) == 2); one = sum(1 for r in rows if len(r['hands']) == 1)
# label vs x-order agreement when two hands are seen: the hand further LEFT in the frame should be the performer's left (overhead, from behind)
agree = disagree = same = 0
for r in rows:
    if len(r['hands']) != 2: continue
    a, b = sorted(r['hands'], key=lambda x: x['wx'])
    if a['label'] == b['label']: same += 1
    elif a['label'] == 'Left' and b['label'] == 'Right': agree += 1
    else: disagree += 1
print(f"{path}: {tot} samples at {step}s; two hands {two} ({100*two/tot:.0f}%), one {one}, none {tot-two-one}")
print(f"  when two: labels agree with left-to-right order {agree}, disagree {disagree}, both same label {same}")
