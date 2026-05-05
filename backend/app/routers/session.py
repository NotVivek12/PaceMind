import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Path
from ..models.session import (
    EvaluateSessionRequest, NextQuestionRequest, SessionStartRequest, 
    SessionStartResponse, SessionActivityRequest, ActivityEvent, AnswerSubmission,
    GradeAnswerRequest, GradeAnswerResponse
)
from ..services.ai_service import generate_next_question, grade_answer
from ..services.session_manager import create_session, get_session, add_activity_event, end_session
from ..services.mood_engine import infer_mood

router = APIRouter(prefix="/api/session", tags=["session"])

# --- Legacy endpoints for backward compatibility ---
@router.post("/evaluate")
def session_evaluate(req: EvaluateSessionRequest):
    # Map the old request to the new AnswerSubmission model for mood inference
    submission = AnswerSubmission(
        question_text="Unknown",
        answer_text="Unknown",
        is_correct=req.answer_correct,
        response_time_ms=req.response_time_ms,
        keystroke_speed=req.keystroke_speed_chars_per_sec,
        backspace_count=req.backspace_count,
        pause_count=req.pause_count,
        answer_length=10, # Defaults for backward compat
        edit_ratio=0.1,
        time_to_first_keystroke_ms=1000
    )
    mood_snapshot = infer_mood(submission)
    return {"mood": mood_snapshot.mood}

@router.post("/next-question")
async def session_next_question(req: NextQuestionRequest):
    try:
        perf = req.previous_performance
        result = await generate_next_question(
            topic=req.concept_id,
            current_mood=req.current_mood,
            history_correct=perf.correct if perf else 0,
            history_total=perf.total if perf else 0,
            wrong_streak=req.wrong_streak or 0,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

# --- New Session-Aware Endpoints ---
@router.post("/start", response_model=SessionStartResponse)
def start_session(req: SessionStartRequest):
    session = create_session(req.topic)
    return SessionStartResponse(session_id=session.session_id, topic=session.topic)

@router.get("/{session_id}")
def get_session_state(session_id: str = Path(...)):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/{session_id}/activity")
def submit_activity(req: SessionActivityRequest, session_id: str = Path(...)):
    event = ActivityEvent(
        event_id=str(uuid.uuid4()),
        event_type=req.event_type,
        timestamp=datetime.now(timezone.utc),
        data=req.data
    )
    session = add_activity_event(session_id, event)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "event_added"}

@router.post("/{session_id}/end")
def terminate_session(session_id: str = Path(...)):
    session = end_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "ended"}

@router.post("/grade", response_model=GradeAnswerResponse)
async def session_grade_answer(req: GradeAnswerRequest):
    try:
        result = await grade_answer(req.question_text, req.answer_text)
        return GradeAnswerResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
