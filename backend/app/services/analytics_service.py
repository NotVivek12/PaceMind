from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Optional
from ..models.session import (
    ConceptMastery,
    MoodTimelinePoint,
    SessionAnalyticsResponse,
    StudentSessionSummary,
)
from ..store.memory_store import store

def _mastery_status(accuracy: float, total: int) -> str:
    if total == 0:
        return "red"
    if accuracy >= 0.75:
        return "green"
    if accuracy >= 0.5:
        return "amber"
    return "red"


def build_student_summary(session) -> StudentSessionSummary:
    concept_lookup = {concept.id: concept.concept for concept in session.concepts}
    concept_stats = defaultdict(lambda: {"correct": 0, "total": 0, "concept": "Unknown concept"})
    mood_counts: Counter[str] = Counter()
    mood_timeline: list[MoodTimelinePoint] = []
    answers_correct = 0
    answers_total = 0

    for event in session.events:
        data = event.data or {}
        concept_id = data.get("concept_id") or data.get("conceptId") or "unknown"
        concept_name = data.get("concept") or concept_lookup.get(concept_id, str(concept_id))

        if event.event_type in {"answer_submission", "answer_timeout"}:
            was_correct = bool(data.get("is_correct", False))
            answers_total += 1
            answers_correct += 1 if was_correct else 0
            concept_stats[concept_id]["concept"] = concept_name
            concept_stats[concept_id]["total"] += 1
            concept_stats[concept_id]["correct"] += 1 if was_correct else 0

        mood = data.get("mood")
        if mood in {"Flow", "Confused", "Frustrated", "Disengaged"}:
            mood_counts[mood] += 1
            mood_timeline.append(
                MoodTimelinePoint(
                    timestamp=event.timestamp,
                    mood=mood,
                    confidence=float(data.get("mood_confidence", 0.75)),
                    concept=concept_name if concept_name != "unknown" else None,
                )
            )

    for snapshot in session.mood_history:
        mood_counts[snapshot.mood] += 1
        mood_timeline.append(
            MoodTimelinePoint(
                timestamp=snapshot.timestamp,
                mood=snapshot.mood,
                confidence=snapshot.confidence,
            )
        )

    if not mood_timeline:
        mood_counts["Flow"] += 1
        mood_timeline.append(
            MoodTimelinePoint(
                timestamp=session.started_at,
                mood="Flow",
                confidence=0.6,
            )
        )

    mastery = []
    seen_concepts = set()
    for concept in session.concepts:
        stats = concept_stats.get(concept.id, {"correct": 0, "total": 0, "concept": concept.concept})
        accuracy = stats["correct"] / stats["total"] if stats["total"] else 0
        mastery.append(
            ConceptMastery(
                concept_id=concept.id,
                concept=concept.concept,
                correct=stats["correct"],
                total=stats["total"],
                accuracy=round(accuracy, 2),
                status=_mastery_status(accuracy, stats["total"]),
            )
        )
        seen_concepts.add(concept.id)

    for concept_id, stats in concept_stats.items():
        if concept_id in seen_concepts:
            continue
        accuracy = stats["correct"] / stats["total"] if stats["total"] else 0
        mastery.append(
            ConceptMastery(
                concept_id=str(concept_id),
                concept=stats["concept"],
                correct=stats["correct"],
                total=stats["total"],
                accuracy=round(accuracy, 2),
                status=_mastery_status(accuracy, stats["total"]),
            )
        )

    dominant_mood = mood_counts.most_common(1)[0][0] if mood_counts else "Flow"
    accuracy = answers_correct / answers_total if answers_total else 0

    return StudentSessionSummary(
        session_id=session.session_id,
        topic=session.topic,
        status=session.status,
        started_at=session.started_at,
        ended_at=session.ended_at,
        total_events=len(session.events),
        answers_total=answers_total,
        answers_correct=answers_correct,
        accuracy=round(accuracy, 2),
        mood_counts=dict(mood_counts),
        dominant_mood=dominant_mood,
        mood_timeline=sorted(mood_timeline, key=lambda point: point.timestamp),
        concept_mastery=mastery,
        llm_summary=session.llm_summary,
    )


def get_session_analytics(session_id: str) -> Optional[SessionAnalyticsResponse]:
    session = store.get_session(session_id)
    if not session:
        return None

    student_summary = build_student_summary(session)
    return SessionAnalyticsResponse(
        session_id=session.session_id,
        topic=session.topic,
        status=session.status,
        total_events=len(session.events),
        mood_timeline=session.mood_history,
        class_overview=[student_summary],
        student_summary=student_summary,
    )
