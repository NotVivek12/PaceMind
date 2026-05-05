from fastapi import APIRouter, HTTPException, UploadFile, File
from ..models.curriculum import CurriculumRequest
from ..services.ai_service import generate_curriculum
from ..services.notes_service import parse_pdf, extract_concepts_from_text
from ..services.supabase_client import save_concept_graph
import structlog

logger = structlog.get_logger()

router = APIRouter(tags=["curriculum"])

@router.post("/generate")
async def curriculum_generate(req: CurriculumRequest):
    try:
        concepts = await generate_curriculum(req.topic, req.intent, req.level)
        
        # Save to Supabase (fails silently if not configured)
        save_concept_graph(
            topic=req.topic,
            intent=req.intent,
            level=req.level,
            concepts=concepts
        )
        
        return {"concepts": concepts}
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/upload-notes")
async def upload_notes(file: UploadFile = File(...)):
    """Upload a PDF file, extract text, then extract concepts via LLM."""
    # Validate file type
    allowed_types = [
        "application/pdf",
        "text/plain",
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Please upload a PDF or text file.",
        )

    # Check file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")

    try:
        # Extract text
        if file.content_type == "application/pdf":
            text = await parse_pdf(contents)
        else:
            text = contents.decode("utf-8", errors="replace")

        # Extract concepts from text
        concepts = await extract_concepts_from_text(text)
        
        # Save to Supabase (fails silently if not configured)
        save_concept_graph(
            topic=f"Notes: {file.filename}",
            intent="catch_up",
            level="intermediate",
            concepts=concepts
        )

        return {
            "extracted_text_preview": text[:500],
            "concepts": concepts,
        }
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("upload_notes_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
