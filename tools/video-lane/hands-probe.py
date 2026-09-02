# Feasibility probe: can MediaPipe see the performer's hands in these frames?
import sys, json
import cv2, numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
opts = vision.HandLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path='C:/Users/markh/keys-piano-tools/models/hand_landmarker.task'), num_hands=2, min_hand_detection_confidence=0.3, min_hand_presence_confidence=0.3)
det = vision.HandLandmarker.create_from_options(opts)
TIPS = [4, 8, 12, 16, 20]
for path in sys.argv[1:]:
    img = cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB)
    h, w = img.shape[:2]
    res = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=img))
    out = []
    for lm, hd in zip(res.hand_landmarks, res.handedness):
        wrist = lm[0]; tips = [(round(lm[i].x * w), round(lm[i].y * h)) for i in TIPS]
        out.append({'label': hd[0].category_name, 'score': round(hd[0].score, 2), 'wrist': (round(wrist.x * w), round(wrist.y * h)), 'tips_x': [t[0] for t in tips], 'tips_y': [t[1] for t in tips]})
    print(path, '->', len(out), 'hands', json.dumps(out))
