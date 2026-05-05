from pydantic import BaseModel
from typing import Literal, Optional, List


class CurriculumRequest(BaseModel):
    topic: str
    intent: Literal["exam_prep", "catch_up", "curiosity"]
    level: Literal["beginner", "intermediate", "advanced"] = "intermediate"


class ConceptItem(BaseModel):
    id: str
    concept: str
    prerequisites: List[str] = []
    difficulty: int = 1
    questionTypes: List[str] = ["mcq"]
    estimatedMinutes: int = 10


class CurriculumResponse(BaseModel):
    concepts: List[ConceptItem]


class ContentExtractRequest(BaseModel):
    text: str
    type: Optional[str] = "notes"
