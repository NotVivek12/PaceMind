from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..services.ai_service import generate_intervention

router = APIRouter(tags=["intervention"])

@router.post("/intervention")
async def get_intervention(payload: Dict[str, Any]):
    try:
        topic = payload.get("topic") or payload.get("concept") or "General"
        current_mood = payload.get("mood") or payload.get("current_mood") or "Flow"
        history_correct = int(payload.get("history_correct") or 0)
        history_total = int(payload.get("history_total") or 0)
        wrong_streak = int(payload.get("wrong_streak") or payload.get("recent_wrong") or 0)

        result = await generate_intervention(
            topic=topic,
            current_mood=current_mood,
            history_correct=history_correct,
            history_total=history_total,
            wrong_streak=wrong_streak,
        )
        return {
            "message": result.get("coachMessage", ""),
            "coachMessage": result.get("coachMessage", ""),
            "difficultyAdjustment": result.get("difficultyAdjustment", "same"),
            "formatSwitch": result.get("formatSwitch", "text"),
            "tone": result.get("tone", "encouraging"),
        }
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
