"""
WebSocket endpoint for real-time pose detection.

Flow:
  1. Client sends base64-encoded JPEG frame OR a control message
  2. Server decodes → runs MediaPipe → runs exercise detector
  3. Server sends back JSON with metrics + skeleton landmarks
"""

import os
import base64
import json
import logging
import numpy as np
import cv2
import mediapipe as mp
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from detectors.squat import SquatDetector
from detectors.pushup import PushUpDetector
from detectors.biceps_curl import BicepsCurlDetector
from detectors.shoulder_press import ShoulderPressDetector
from detectors.lunges import LungesDetector
from services.config.workout_config import POSE_CONNECTIONS

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Detector registry ────────────────────────────────────────

_DETECTORS = {
    "Squats": SquatDetector,
    "Push-ups": PushUpDetector,
    "Biceps Curls (Dumbbell)": BicepsCurlDetector,
    "Shoulder Press": ShoulderPressDetector,
    "Lunges": LungesDetector,
}


def _init_landmarker() -> vision.PoseLandmarker:
    model_path = os.path.join(os.getcwd(), "ml_models", "pose_landmarker_full.task")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Pose model not found at {model_path}")

    base_option = python.BaseOptions(
        model_asset_path=model_path,
        delegate=python.BaseOptions.Delegate.GPU
    )

    options = vision.PoseLandmarkerOptions(
        base_options=base_option,
        running_mode=vision.RunningMode.VIDEO,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        output_segmentation_masks=False,
    )

    return vision.PoseLandmarker.create_from_options(options)


def _landmarks_to_points(landmarks, width: int, height: int) -> list[dict]:
    """Convert MediaPipe landmarks to simple {id, x, y, visibility} dicts."""
    points = []
    for i, lm in enumerate(landmarks):
        if lm.visibility > 0.3:
            points.append({
                "id": i,
                "x": round(lm.x * width),
                "y": round(lm.y * height),
                "visibility": round(lm.visibility, 2),
            })
    return points


@router.websocket("/ws/pose")
async def pose_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket client connected")

    landmarker = None
    detector = None
    current_exercise = None
    frame_ts = 0

    try:
        landmarker = _init_landmarker()

        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON"})
                continue

            # ── Handle control messages ──────────────────────
            msg_type = data.get("type", "frame")

            if msg_type == "reset":
                # Reset detector reps (used between sets)
                if detector:
                    detector.reset()
                await websocket.send_json({"type": "reset_ok"})
                continue

            if msg_type == "change_exercise":
                exercise = data.get("exercise", "Squats")
                detector_cls = _DETECTORS.get(exercise)
                if detector_cls:
                    detector = detector_cls()
                    current_exercise = exercise
                    await websocket.send_json({"type": "exercise_changed", "exercise": exercise})
                else:
                    await websocket.send_json({"error": f"Unknown exercise: {exercise}"})
                continue

            # ── Handle frame messages ────────────────────────
            frame_b64 = data.get("frame")
            exercise = data.get("exercise", "Squats")
            width = data.get("width", 640)
            height = data.get("height", 480)

            if not frame_b64:
                await websocket.send_json({"error": "No frame data"})
                continue

            # Switch detector if exercise changed
            if exercise != current_exercise:
                detector_cls = _DETECTORS.get(exercise)
                if detector_cls:
                    detector = detector_cls()
                    current_exercise = exercise
                else:
                    await websocket.send_json({"error": f"Unknown exercise: {exercise}"})
                    continue

            # Decode the frame
            try:
                img_bytes = base64.b64decode(frame_b64)
                np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
                image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if image is None:
                    await websocket.send_json({"error": "Could not decode frame"})
                    continue
            except Exception:
                await websocket.send_json({"error": "Frame decode failed"})
                continue

            # Run MediaPipe — GPU (Metal) on macOS needs RGBA, not RGB
            rgba = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGBA, data=rgba)

            frame_ts += 33  # ~30 FPS
            result = landmarker.detect_for_video(mp_image, frame_ts)

            if result.pose_landmarks and len(result.pose_landmarks) > 0:
                landmarks = result.pose_landmarks[0]

                # Run exercise detector
                metrics = detector.process(landmarks)

                # Build skeleton data for frontend rendering
                skeleton_points = _landmarks_to_points(landmarks, width, height)

                await websocket.send_json({
                    "metrics": metrics,
                    "landmarks": skeleton_points,
                    "connections": POSE_CONNECTIONS,
                    "pose_detected": True,
                })
            else:
                await websocket.send_json({
                    "metrics": {"reps": detector.reps if detector else 0},
                    "landmarks": [],
                    "connections": [],
                    "pose_detected": False,
                })

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        try:
            await websocket.close()
        except Exception:
            pass
    finally:
        if landmarker:
            landmarker.close()
