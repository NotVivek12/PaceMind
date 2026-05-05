from fastapi import APIRouter
from ..models.mood import MoodRequest

router = APIRouter()


async def infer_mood(signals: dict):
    """
    Weighted scoring mood classifier.
    Face expression and response_time_ms are HIGH-PRIORITY signals
    that override positive keystroke data.
    """
    typing_speed = signals.get("typing_speed_wpm", 0) or 0
    error_rate = signals.get("error_rate_pct", 0) or 0
    pause_seconds = signals.get("pause_seconds", 0) or 0
    face_expr = signals.get("face_expression")
    face_conf = signals.get("face_confidence", 0) or 0
    response_time = signals.get("response_time_ms", 0) or 0
    recent_wrong = signals.get("recent_wrong_answers", 0) or 0
    backspace_rate = signals.get("backspace_rate", 0) or 0

    scores = {"flow": 0, "confused": 0, "frustrated": 0, "disengaged": 0}

    # ── Face expression (HIGH PRIORITY — always pulls away from flow) ─────
    if face_expr and face_conf > 0.4:
        if face_expr in ("sad", "fearful"):
            scores["disengaged"] += 5
            scores["confused"] += 3
        elif face_expr in ("angry", "frustrated"):
            scores["frustrated"] += 5
        elif face_expr in ("happy", "surprised"):
            scores["flow"] += 2
        # neutral: no signal either way

    # ── Response time (>15s = strong confused/disengaged) ─────────────────
    if response_time > 15000:
        scores["confused"] += 5
        scores["disengaged"] += 3
    elif response_time > 10000:
        scores["confused"] += 3
    elif 0 < response_time < 3000:
        scores["flow"] += 1

    # ── Typing speed ─────────────────────────────────────────────────────
    if typing_speed >= 50:
        scores["flow"] += 2
    elif typing_speed >= 30:
        scores["flow"] += 1
    elif typing_speed <= 15 and typing_speed > 0:
        scores["disengaged"] += 2

    # ── Error rate ────────────────────────────────────────────────────────
    if error_rate > 30:
        scores["frustrated"] += 3
    elif error_rate > 15:
        scores["confused"] += 2
        scores["frustrated"] += 1
    elif error_rate <= 10:
        scores["flow"] += 1

    # ── Pause seconds ────────────────────────────────────────────────────
    if pause_seconds > 15:
        scores["disengaged"] += 3
    elif pause_seconds > 8:
        scores["confused"] += 2
        scores["disengaged"] += 1
    elif pause_seconds <= 3:
        scores["flow"] += 1

    # ── Backspace rate ───────────────────────────────────────────────────
    if backspace_rate > 0.25:
        scores["frustrated"] += 1

    # ── Recent wrong answers ─────────────────────────────────────────────
    if recent_wrong >= 3:
        scores["frustrated"] += 2
        scores["confused"] += 1
    elif recent_wrong >= 2:
        scores["confused"] += 1

    # ── Resolve ──────────────────────────────────────────────────────────
    mood = max(scores, key=scores.get)
    total = sum(scores.values())
    confidence = round(scores[mood] / total, 2) if total > 0 else 0.5

    # Default to flow if no signals at all
    if total == 0:
        mood = "flow"
        confidence = 0.5

    return mood, min(confidence, 0.99)


@router.post("/mood")
async def classify_mood(payload: MoodRequest):
    # Demo override — always check this first
    if payload.override:
        return {"mood": payload.override, "confidence": 1.0}

    # Build signal dict from whatever fields arrived
    signals = {
        "typing_speed_wpm":     payload.typing_speed_wpm,
        "error_rate_pct":       payload.error_rate_pct,
        "backspace_rate":       payload.backspace_rate,
        "pause_seconds":        payload.pause_seconds,
        "face_expression":      payload.face_expression,
        "face_confidence":      payload.face_confidence,
        "response_time_ms":     payload.response_time_ms,
        "recent_wrong_answers": payload.recent_wrong_answers,
    }
    # Remove None values
    signals = {k: v for k, v in signals.items() if v is not None}

    mood, confidence = await infer_mood(signals)
    return {"mood": mood, "confidence": confidence}
