from pydantic import BaseModel, Field
from typing import Literal, Dict, Any, Optional
from datetime import datetime

MoodState = Literal["Flow", "Confused", "Frustrated", "Disengaged"]

class MoodSnapshot(BaseModel):
    mood: MoodState
    confidence: float
    timestamp: datetime
    contributing_signals: Dict[str, Any]

class KeystrokeSignals(BaseModel):
    typing_speed_cps: float = Field(ge=0)
    backspace_count: int = Field(ge=0)
    pause_count: int = Field(ge=0)
    input_events: int = Field(ge=0)
    elapsed_ms: int = Field(ge=0)

class FaceExpressionScores(BaseModel):
    neutral: float = 0.0
    happy: float = 0.0
    sad: float = 0.0
    angry: float = 0.0
    fearful: float = 0.0
    disgusted: float = 0.0
    surprised: float = 0.0

class MoodRequest(BaseModel):
    # Keystroke dynamics
    typing_speed_wpm:  Optional[float] = None
    error_rate_pct:    Optional[float] = None
    backspace_rate:    Optional[float] = None
    pause_seconds:     Optional[float] = None

    # Webcam / face-api.js
    face_expression:   Optional[str]   = None
    face_confidence:   Optional[float] = None

    # Response timing
    response_time_ms:  Optional[float] = None

    # General
    recent_wrong_answers: Optional[int] = None
    session_id:        Optional[str]   = None

    # Demo override — bypasses inference entirely
    override:          Optional[str]   = None
