from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from ..services.ai_service import generate_next_question

router = APIRouter(tags=["questions"])

@router.get("/next-question")
async def next_question(
    topic: Optional[str] = Query(None),
    concept: Optional[str] = Query(None),
    current_mood: Optional[str] = Query("Flow"),
    mood: Optional[str] = Query(None),
    history_correct: Optional[int] = Query(0),
    history_total: Optional[int] = Query(0),
    wrong_streak: Optional[int] = Query(0),
    difficulty: Optional[int] = Query(None),
):
    try:
        return await generate_next_question(
            topic=topic or concept or "General",
            current_mood=current_mood or mood or "Flow",
            history_correct=history_correct or 0,
            history_total=history_total or 0,
            wrong_streak=wrong_streak or 0,
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
