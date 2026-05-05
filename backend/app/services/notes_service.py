"""
Notes processing service.
Extracts text from PDF files and sends to LLM for concept extraction.
"""

import io
import json
import structlog
from .ai_service import call_openrouter, extract_json

logger = structlog.get_logger()


async def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using PyPDF2."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        full_text = "\n".join(text_parts)
        if not full_text.strip():
            raise ValueError("PDF appears to be empty or image-only (no extractable text).")
        logger.info("pdf_parsed", pages=len(reader.pages), chars=len(full_text))
        return full_text
    except ImportError:
        raise RuntimeError("PyPDF2 is not installed. Run: pip install PyPDF2")


async def extract_concepts_from_text(text: str) -> list[dict]:
    """Send raw text to LLM and get back structured concept list."""
    # Truncate very long text to avoid token limits
    truncated = text[:8000] if len(text) > 8000 else text

    prompt = f"""You are an expert curriculum designer and study-material analyst.

A student has uploaded their study notes. Analyze the text and extract the key concepts
that should be studied, in dependency order (foundational concepts first).

Here are the notes:
---
{truncated}
---

Extract 5-8 key concepts from these notes. Return ONLY valid JSON, no markdown, no comments:
{{
  "concepts": [
    {{
      "id": "unique-slug",
      "concept": "Concept Name",
      "prerequisites": [],
      "difficulty": 1,
      "questionTypes": ["mcq", "short-answer"],
      "estimatedMinutes": 10
    }}
  ]
}}

Rules:
- difficulty is 1-5
- questionTypes can include: mcq, short-answer, explain, diagram, calculation
- Order concepts so prerequisites come first
- Use kebab-case for id slugs"""

    content = await call_openrouter(prompt)
    try:
        parsed = json.loads(extract_json(content))
        return parsed["concepts"]
    except (json.JSONDecodeError, KeyError) as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw: {content}")
