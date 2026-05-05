from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from ..models.session import ActivityEvent, Concept, LearningSession

class SessionStore:
    def __init__(self):
        self._sessions: Dict[str, LearningSession] = {}
        self._seed_demo_session()

    def get_session(self, session_id: str) -> Optional[LearningSession]:
        return self._sessions.get(session_id)

    def save_session(self, session: LearningSession) -> None:
        self._sessions[session.session_id] = session

    def delete_session(self, session_id: str) -> None:
        if session_id in self._sessions:
            del self._sessions[session_id]

    def _seed_demo_session(self) -> None:
        started = datetime.now(timezone.utc) - timedelta(minutes=18)
        concepts = [
            Concept(id="photosynthesis-inputs", concept="Photosynthesis inputs", prerequisites=[], difficulty=1),
            Concept(id="light-dependent", concept="Light-dependent reactions", prerequisites=["photosynthesis-inputs"], difficulty=2),
            Concept(id="calvin-cycle", concept="Calvin cycle", prerequisites=["light-dependent"], difficulty=3),
            Concept(id="limiting-factors", concept="Limiting factors", prerequisites=["calvin-cycle"], difficulty=3),
        ]
        events = []
        samples = [
            ("photosynthesis-inputs", "Photosynthesis inputs", True, "Flow", 2200),
            ("photosynthesis-inputs", "Photosynthesis inputs", True, "Flow", 1800),
            ("light-dependent", "Light-dependent reactions", False, "Confused", 9200),
            ("light-dependent", "Light-dependent reactions", False, "Frustrated", 11200),
            ("light-dependent", "Light-dependent reactions", True, "Confused", 6500),
            ("calvin-cycle", "Calvin cycle", False, "Frustrated", 12800),
            ("calvin-cycle", "Calvin cycle", True, "Flow", 7600),
            ("limiting-factors", "Limiting factors", False, "Disengaged", 10100),
        ]
        for index, (concept_id, concept, is_correct, mood, response_ms) in enumerate(samples):
            events.append(
                ActivityEvent(
                    event_id=f"demo-event-{index}",
                    event_type="answer_submission",
                    timestamp=started + timedelta(minutes=index * 2),
                    data={
                        "concept_id": concept_id,
                        "concept": concept,
                        "question_text": f"Demo question for {concept}",
                        "answer_text": "Selected demo answer",
                        "is_correct": is_correct,
                        "response_time_ms": response_ms,
                        "keystroke_speed": 1.2 if not is_correct else 3.1,
                        "backspace_count": 6 if not is_correct else 1,
                        "pause_count": 3 if not is_correct else 0,
                        "answer_length": 24,
                        "edit_ratio": 0.32 if not is_correct else 0.05,
                        "time_to_first_keystroke_ms": 1800,
                        "mood": mood,
                        "mood_confidence": 0.82,
                    },
                )
            )

        self._sessions["demo-rich-session"] = LearningSession(
            session_id="demo-rich-session",
            topic="Photosynthesis from uploaded notes",
            concepts=concepts,
            status="completed",
            started_at=started,
            ended_at=started + timedelta(minutes=18),
            events=events,
            llm_summary=(
                "The student practiced photosynthesis inputs, light reactions, the Calvin cycle, and limiting factors. "
                "They began in flow, hit frustration during light-dependent reactions, and recovered after easier coaching. "
                "Revisit the Calvin cycle and limiting factors before raising difficulty again."
            ),
        )

# Singleton instance
store = SessionStore()
