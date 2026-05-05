from fastapi import APIRouter

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.get("/session")
def fetch_demo_session():
    return {"session_id": "demo-rich-session"}
