from typing import Optional
from ..models.session import SessionAnalyticsResponse, LearningSession
from ..store.memory_store import store

def get_session_analytics(session_id: str) -> Optional[SessionAnalyticsResponse]:
    session = store.get_session(session_id)
    if not session:
        return None
        
    return SessionAnalyticsResponse(
        session_id=session.session_id,
        topic=session.topic,
        status=session.status,
        total_events=len(session.events),
        mood_timeline=session.mood_history
    )
