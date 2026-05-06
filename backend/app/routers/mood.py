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
    # ── Override check (both field names) ────────────────────────────────
    override = payload.override_mood or payload.override
    if override:
        return {"mood": override, "confidence": 1.0, "source": "override", "dominant_expression": None}

    # ── Build flat signal dict from whichever shape arrived ───────────────
    signals: dict = {}

    if payload.keystroke:
        # Frontend nested shape: translate cps → wpm (approx ×12), derive rates
        ks = payload.keystroke
        elapsed_s = max(1, ks.elapsed_ms / 1000)
        signals["typing_speed_wpm"] = round((ks.typing_speed_cps * 60) / 5, 1)  # chars/s → wpm
        signals["backspace_rate"] = round(ks.backspace_count / max(1, ks.input_events), 3)
        signals["pause_seconds"] = ks.pause_count * 2.0  # each pause ≈ 2s threshold
        signals["error_rate_pct"] = round((ks.backspace_count / max(1, ks.input_events)) * 100, 1)
    else:
        # Legacy flat fields
        for k in ("typing_speed_wpm", "error_rate_pct", "backspace_rate",
                  "pause_seconds", "response_time_ms", "recent_wrong_answers"):
            v = getattr(payload, k, None)
            if v is not None:
                signals[k] = v

    if payload.expressions:
        # Pick dominant expression from face-api.js scores
        expr = payload.expressions
        scores = {
            "happy":     expr.happy,
            "sad":       expr.sad,
            "angry":     expr.angry,
            "fearful":   expr.fearful,
            "disgusted": expr.disgusted,
            "surprised": expr.surprised,
            "neutral":   expr.neutral,
        }
        dominant = max(scores, key=scores.get)
        conf = scores[dominant]
        if conf >= 0.2:
            signals["face_expression"] = dominant
            signals["face_confidence"] = conf
    elif payload.face_expression:
        signals["face_expression"] = payload.face_expression
        signals["face_confidence"] = payload.face_confidence or 0.5

    mood, confidence = await infer_mood(signals)

    # Capitalise to match frontend MoodState type
    mood_map = {"flow": "Flow", "confused": "Confused",
                "frustrated": "Frustrated", "disengaged": "Disengaged"}
    mood = mood_map.get(mood, "Flow")

    return {
        "mood": mood,
        "confidence": confidence,
        "source": "aggregate",
        "dominant_expression": signals.get("face_expression"),
    }
