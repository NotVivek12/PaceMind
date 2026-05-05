from fastapi import APIRouter
from ..models.mood import MoodSignalRequest, MoodSignalResponse
from ..services.mood_engine import infer_mood_from_signals

router = APIRouter(prefix="/api/mood", tags=["mood"])


@router.post("", response_model=MoodSignalResponse)
def aggregate_mood(req: MoodSignalRequest):
    if req.override_mood:
        return MoodSignalResponse(
            mood=req.override_mood,
            confidence=1.0,
            source="override",
            dominant_expression=None,
        )

    snapshot = infer_mood_from_signals(req.keystroke, req.expressions)
    dominant_expression = snapshot.contributing_signals.get("dominant_expression")
    return MoodSignalResponse(
        mood=snapshot.mood,
        confidence=snapshot.confidence,
        source="aggregate",
        dominant_expression=dominant_expression,
    )
