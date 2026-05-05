from fastapi import APIRouter, HTTPException, Path
from ..services.analytics_service import get_session_analytics
from ..models.session import SessionAnalyticsResponse

router = APIRouter(prefix="/api/session", tags=["analytics"])

@router.get("/{session_id}/analytics", response_model=SessionAnalyticsResponse)
def fetch_analytics(session_id: str = Path(...)):
    analytics = get_session_analytics(session_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="Session not found")
    return analytics

@router.get("/{session_id}/mood-history")
def fetch_mood_history(session_id: str = Path(...)):
    analytics = get_session_analytics(session_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"mood_history": analytics.mood_timeline}
