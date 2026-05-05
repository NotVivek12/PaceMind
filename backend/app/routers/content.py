from fastapi import APIRouter, HTTPException
from ..models.curriculum import ContentExtractRequest
from ..services.notes_service import extract_concepts_from_text

router = APIRouter(prefix="/api/content", tags=["content"])


@router.post("/extract")
async def content_extract(req: ContentExtractRequest):
    """Extract concepts from pasted text using LLM."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    try:
        concepts = await extract_concepts_from_text(req.text)
        return {"concepts": concepts}
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
