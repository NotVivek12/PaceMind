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

class ConceptMastery(BaseModel):
    concept_id: str
    concept: str
    correct: int = 0
    total: int = 0
    accuracy: float = 0
    status: Literal["green", "amber", "red"] = "red"

class MoodTimelinePoint(BaseModel):
    timestamp: datetime
    mood: MoodState
    confidence: float = 0.7
    concept: Optional[str] = None

class StudentSessionSummary(BaseModel):
    student_id: str = "demo-student"
    student_name: str = "Demo Student"
    session_id: str
    topic: str
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    total_events: int
    answers_total: int
    answers_correct: int
    accuracy: float
    mood_counts: Dict[str, int]
    dominant_mood: MoodState
    mood_timeline: List[MoodTimelinePoint]
    concept_mastery: List[ConceptMastery]
    llm_summary: Optional[str] = None

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
    llm_summary: Optional[str] = None

class SessionStartRequest(BaseModel):
    topic: str
    concepts: List[Concept] = []

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
    class_overview: List[StudentSessionSummary] = []
    student_summary: Optional[StudentSessionSummary] = None

class GradeAnswerRequest(BaseModel):
    question_text: str
    answer_text: str

class GradeAnswerResponse(BaseModel):
    is_correct: bool
    feedback: str
