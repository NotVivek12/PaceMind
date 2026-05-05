from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional
from ai_service import generate_curriculum, generate_next_question

app = FastAPI(title="Adaptive AI Learning Platform API", version="1.0.0")

# Allow Next.js frontend on localhost:3000 to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ───────────────────────────────────────────────────────────────────

class CurriculumRequest(BaseModel):
    topic: str
    intent: Literal["exam_prep", "catch_up", "curiosity"]

class ContentExtractRequest(BaseModel):
    text: str
    type: Optional[str] = "notes"

class EvaluateSessionRequest(BaseModel):
    answer_correct: bool
    response_time_ms: int
    keystroke_speed_chars_per_sec: float
    backspace_count: int
    pause_count: int

class PerformanceHistory(BaseModel):
    correct: int
    total: int

class NextQuestionRequest(BaseModel):
    current_mood: Literal["Flow", "Confused", "Frustrated", "Disengaged"]
    concept_id: str
    previous_performance: Optional[PerformanceHistory] = None


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/curriculum/generate")
async def curriculum_generate(req: CurriculumRequest):
    """
    Generate a concept dependency graph for a given topic and student intent.
    """
    try:
        concepts = await generate_curriculum(req.topic, req.intent)
        return {"concepts": concepts}
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/api/content/extract")
async def content_extract(req: ContentExtractRequest):
    """
    Placeholder: extract key concepts from uploaded notes text.
    TODO: wire to LLM or OCR pipeline.
    """
    mock_concepts = [
        {"id": "extracted-1", "concept": "Core idea from notes", "prerequisites": [], "difficulty": 1},
        {"id": "extracted-2", "concept": "Secondary detail", "prerequisites": ["extracted-1"], "difficulty": 2},
    ]
    return {"concepts": mock_concepts}


@app.post("/api/session/evaluate")
def session_evaluate(req: EvaluateSessionRequest):
    """
    Simulated Mood Inference Engine.
    Maps response time, keystrokes, and answer correctness to a mood state.
    """
    is_slow = req.response_time_ms > 15_000
    is_fast = req.response_time_ms < 3_000
    many_backspaces = req.backspace_count > 5
    many_pauses = req.pause_count > 2

    mood: str

    if not req.answer_correct:
        if is_slow or many_backspaces:
            mood = "Confused"
        elif is_fast:
            mood = "Disengaged"  # Fast but wrong → guessing
        else:
            mood = "Frustrated"
    else:
        if is_slow or many_backspaces:
            mood = "Confused"  # Struggled but got it → still reinforce
        else:
            mood = "Flow"

    return {"mood": mood}


@app.post("/api/session/next-question")
async def session_next_question(req: NextQuestionRequest):
    """
    Intervention Router: given mood + concept, generates next question and coaching tone.
    """
    try:
        perf = req.previous_performance
        result = await generate_next_question(
            topic=req.concept_id,
            current_mood=req.current_mood,
            history_correct=perf.correct if perf else 0,
            history_total=perf.total if perf else 0,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
