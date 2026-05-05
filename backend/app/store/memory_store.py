from typing import Dict, Optional
from ..models.session import LearningSession

class SessionStore:
    def __init__(self):
        self._sessions: Dict[str, LearningSession] = {}

    def get_session(self, session_id: str) -> Optional[LearningSession]:
        return self._sessions.get(session_id)

    def save_session(self, session: LearningSession) -> None:
        self._sessions[session.session_id] = session

    def delete_session(self, session_id: str) -> None:
        if session_id in self._sessions:
            del self._sessions[session_id]

# Singleton instance
store = SessionStore()
