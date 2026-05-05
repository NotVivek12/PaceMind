import uuid
from datetime import datetime, timezone
from typing import Optional
from ..models.session import LearningSession, ActivityEvent, AnswerSubmission
from ..models.mood import MoodSnapshot
from ..store.memory_store import store
from .mood_engine import infer_mood

def create_session(topic: str) -> LearningSession:
    session = LearningSession(
        session_id=str(uuid.uuid4()),
        topic=topic,
        started_at=datetime.now(timezone.utc)
    )
    store.save_session(session)
    return session

def get_session(session_id: str) -> Optional[LearningSession]:
    return store.get_session(session_id)

def add_activity_event(session_id: str, event: ActivityEvent) -> Optional[LearningSession]:
    session = store.get_session(session_id)
    if session:
        session.events.append(event)
        
        # If the event is an answer submission, infer mood
        if event.event_type == "answer_submission":
            try:
                # Convert the raw dict data into AnswerSubmission model
                submission = AnswerSubmission(**event.data)
                mood_snapshot = infer_mood(submission)
                session.mood_history.append(mood_snapshot)
            except Exception as e:
                # Log parsing error or missing fields
                print(f"Failed to infer mood: {e}")
                
        store.save_session(session)
    return session

def end_session(session_id: str) -> Optional[LearningSession]:
    session = store.get_session(session_id)
    if session:
        session.status = "completed"
        session.ended_at = datetime.now(timezone.utc)
        store.save_session(session)
    return session
