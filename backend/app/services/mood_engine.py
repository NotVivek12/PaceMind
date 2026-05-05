from datetime import datetime, timezone
from typing import Dict
from ..models.mood import MoodState, MoodSnapshot, KeystrokeSignals, FaceExpressionScores
from ..models.session import AnswerSubmission

def infer_mood(submission: AnswerSubmission, baseline: dict = None) -> MoodSnapshot:
    """
    Enhanced mood inference engine.
    Computes weighted scores for each mood state.
    """
    scores: Dict[MoodState, float] = {
        "Flow": 0.0,
        "Confused": 0.0,
        "Frustrated": 0.0,
        "Disengaged": 0.0
    }
    
    # 1. Answer correctness (heavy weight)
    if submission.is_correct:
        scores["Flow"] += 3.0
        scores["Confused"] += 0.5
    else:
        scores["Confused"] += 1.5
        scores["Frustrated"] += 2.0
        scores["Disengaged"] += 1.0

    # 2. Time metrics
    if submission.response_time_ms > 15000:
        scores["Confused"] += 2.0
        scores["Frustrated"] += 1.0
        scores["Flow"] -= 1.0
    elif submission.response_time_ms < 3000:
        if submission.is_correct:
            scores["Flow"] += 2.0
        else:
            scores["Disengaged"] += 3.0
            scores["Frustrated"] += 1.0
            
    # 3. Edit Ratio & Keystroke metrics
    if submission.edit_ratio > 0.3 or submission.backspace_count > 5:
        scores["Confused"] += 1.5
        scores["Frustrated"] += 1.5
        
    if submission.pause_count > 2:
        scores["Confused"] += 1.0
        scores["Disengaged"] += 0.5
        
    # Find max score
    best_mood: MoodState = "Flow"
    max_score = -1.0
    for mood, score in scores.items():
        if score > max_score:
            max_score = score
            best_mood = mood
            
    total_score = sum(scores.values()) or 1.0
    confidence = max_score / total_score
    
    return MoodSnapshot(
        mood=best_mood,
        confidence=confidence,
        timestamp=datetime.now(timezone.utc),
        contributing_signals={
            "is_correct": submission.is_correct,
            "response_time_ms": submission.response_time_ms,
            "edit_ratio": submission.edit_ratio,
            "backspace_count": submission.backspace_count
        }
    )


def infer_mood_from_signals(
    keystroke: KeystrokeSignals,
    expressions: FaceExpressionScores | None = None,
) -> MoodSnapshot:
    scores: Dict[MoodState, float] = {
        "Flow": 0.0,
        "Confused": 0.0,
        "Frustrated": 0.0,
        "Disengaged": 0.0,
    }

    elapsed_s = max(1.0, keystroke.elapsed_ms / 1000.0)
    typing_speed = keystroke.typing_speed_cps
    backspace_rate = keystroke.backspace_count / max(1, keystroke.input_events)

    if typing_speed >= 4.0:
        scores["Flow"] += 2.0
    elif typing_speed >= 2.0:
        scores["Flow"] += 1.0
    elif typing_speed < 1.0:
        scores["Confused"] += 1.0
        scores["Disengaged"] += 1.0

    if backspace_rate >= 0.25:
        scores["Confused"] += 1.5
        scores["Frustrated"] += 1.0
    elif backspace_rate >= 0.15:
        scores["Confused"] += 1.0

    if keystroke.pause_count >= 2:
        scores["Confused"] += 1.0
        scores["Disengaged"] += 0.5
    if keystroke.pause_count >= 4:
        scores["Disengaged"] += 1.0

    if keystroke.input_events < 5 and elapsed_s >= 5.0:
        scores["Disengaged"] += 1.0

    dominant_expression = None
    if expressions is not None:
        scores["Flow"] += (expressions.happy * 2.0) + (expressions.surprised * 1.5)
        scores["Frustrated"] += expressions.angry * 2.0
        scores["Disengaged"] += expressions.sad * 2.0
        scores["Confused"] += (
            expressions.fearful
            + expressions.disgusted
            + expressions.neutral
        ) * 1.5

        expr_map = expressions.model_dump() if hasattr(expressions, "model_dump") else expressions.dict()
        dominant_expression = max(expr_map, key=expr_map.get) if expr_map else None

    best_mood: MoodState = "Flow"
    max_score = -1.0
    for mood, score in scores.items():
        if score > max_score:
            max_score = score
            best_mood = mood

    total_score = sum(scores.values()) or 1.0
    confidence = max_score / total_score

    return MoodSnapshot(
        mood=best_mood,
        confidence=confidence,
        timestamp=datetime.now(timezone.utc),
        contributing_signals={
            "typing_speed_cps": typing_speed,
            "backspace_rate": backspace_rate,
            "pause_count": keystroke.pause_count,
            "input_events": keystroke.input_events,
            "elapsed_ms": keystroke.elapsed_ms,
            "dominant_expression": dominant_expression,
        },
    )
