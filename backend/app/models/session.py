from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict, Any
from datetime import datetime
from .mood import MoodSnapshot, MoodState

class PerformanceHistory(BaseModel):
    correct: int
    total: int

class EvaluateSessionRequest(BaseModel):
    answer_correct: bool
    response_time_ms: int
    keystroke_speed_chars_per_sec: float
    backspace_count: int
    pause_count: int

class NextQuestionRequest(BaseModel):
    current_mood: MoodState
    concept_id: str
    previous_performance: Optional[PerformanceHistory] = None
    wrong_streak: Optional[int] = Field(default=None, ge=0)

class Concept(BaseModel):
    id: str
    concept: str
    prerequisites: List[str] = []
    difficulty: int = 1

class AnswerSubmission(BaseModel):
    question_text: str
    answer_text: str
    is_correct: bool
    response_time_ms: int
    keystroke_speed: float
    backspace_count: int
    pause_count: int
    answer_length: int
    edit_ratio: float
    time_to_first_keystroke_ms: int

class ActivityEvent(BaseModel):
    event_id: str
    event_type: str
    timestamp: datetime
    data: Dict[str, Any]

class LearningSession(BaseModel):
    session_id: str
    topic: str
    concepts: List[Concept] = []
    status: Literal["active", "completed"] = "active"
    started_at: datetime
    ended_at: Optional[datetime] = None
    events: List[ActivityEvent] = []
    mood_history: List[MoodSnapshot] = []

class SessionStartRequest(BaseModel):
    topic: str

class SessionStartResponse(BaseModel):
    session_id: str
    topic: str

class SessionActivityRequest(BaseModel):
    event_type: str
    data: Dict[str, Any]

class SessionAnalyticsResponse(BaseModel):
    session_id: str
    topic: str
    status: str
    total_events: int
    mood_timeline: List[MoodSnapshot]

class GradeAnswerRequest(BaseModel):
    question_text: str
    answer_text: str

class GradeAnswerResponse(BaseModel):
    is_correct: bool
    feedback: str

