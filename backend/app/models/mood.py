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


class MoodSignalRequest(BaseModel):
    keystroke: KeystrokeSignals
    expressions: Optional[FaceExpressionScores] = None
    override_mood: Optional[MoodState] = None


class MoodSignalResponse(BaseModel):
    mood: MoodState
    confidence: float
    source: Literal["aggregate", "override"]
    dominant_expression: Optional[str] = None
