"""
LLM integration via OpenRouter.
Uses a shared httpx.AsyncClient for connection pooling and
includes retry logic with exponential backoff.
"""

import json
import re
import asyncio
import httpx
import structlog
from ..config import get_settings

logger = structlog.get_logger()

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ─── Shared HTTP Client (managed by app lifespan) ────────────────────────────
_client: httpx.AsyncClient | None = None


def get_http_client() -> httpx.AsyncClient:
    """Return the shared client. Falls back to creating one if not initialised."""
    global _client
    if _client is None or _client.is_closed:
        settings = get_settings()
        _client = httpx.AsyncClient(timeout=settings.llm_timeout)
    return _client


async def init_http_client():
    """Called at app startup."""
    global _client
    settings = get_settings()
    _client = httpx.AsyncClient(timeout=settings.llm_timeout)
    logger.info("http_client_initialized", timeout=settings.llm_timeout)


async def close_http_client():
    """Called at app shutdown."""
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
        logger.info("http_client_closed")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def extract_json(content: str) -> str:
    """Strip markdown code fences if the LLM wraps JSON in them."""
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
    return match.group(1) if match else content


async def call_openrouter(prompt: str) -> str:
    """
    Call the OpenRouter chat completions API.
    Retries up to `llm_max_retries` times on transient failures (5xx, timeouts).
    """
    settings = get_settings()
    client = get_http_client()

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "PaceMind - Adaptive AI Learning",
    }
    payload = {
        "model": settings.llm_model,
        "messages": [{"role": "user", "content": prompt}],
    }

    last_error: Exception | None = None
    for attempt in range(1 + settings.llm_max_retries):
        try:
            response = await client.post(
                OPENROUTER_URL, headers=headers, json=payload
            )

            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]

            # Retry on server errors (5xx)
            if response.status_code >= 500:
                last_error = RuntimeError(
                    f"OpenRouter server error: {response.status_code}"
                )
                logger.warning(
                    "llm_server_error",
                    status=response.status_code,
                    attempt=attempt + 1,
                )
            else:
                # Client errors (4xx) — don't retry
                raise RuntimeError(
                    f"OpenRouter API Error: {response.status_code} {response.text}"
                )

        except httpx.TimeoutException as exc:
            last_error = RuntimeError(f"LLM request timed out: {exc}")
            logger.warning("llm_timeout", attempt=attempt + 1)

        except httpx.RequestError as exc:
            last_error = RuntimeError(f"LLM network error: {exc}")
            logger.warning("llm_network_error", attempt=attempt + 1, error=str(exc))

        # Exponential backoff before retry
        if attempt < settings.llm_max_retries:
            wait = 2 ** attempt
            await asyncio.sleep(wait)

    raise last_error or RuntimeError("LLM call failed after retries")


# ─── Public API ───────────────────────────────────────────────────────────────

async def generate_curriculum(topic: str, intent: str, level: str = "intermediate") -> list[dict]:
    """Generate an 8-concept curriculum graph using LLM."""
    intent_context = {
        "exam_prep": "The student is preparing for an exam and needs structured, comprehensive coverage.",
        "catch_up": "The student is behind and needs to fill knowledge gaps efficiently.",
        "curiosity": "The student is exploring out of curiosity — make it engaging and fascinating.",
    }
    level_context = {
        "beginner": "Assume no prior knowledge. Start from absolute basics.",
        "intermediate": "Assume foundational knowledge. Focus on deepening understanding.",
        "advanced": "Assume strong fundamentals. Cover nuanced, challenging material.",
    }

    prompt = f"""You are an expert curriculum designer for an adaptive learning platform.

A student wants to learn about "{topic}".
Learning intent: {intent_context.get(intent, intent)}
Student level: {level_context.get(level, level)}

Generate exactly 8 concepts in strict dependency order (foundational → advanced).
Each concept must build on prerequisites that appear earlier in the list.

Return ONLY a valid JSON object with NO comments, NO markdown, NO extra text:
{{
  "concepts": [
    {{
      "id": "unique-kebab-slug",
      "concept": "Clear Concept Name",
      "prerequisites": [],
      "difficulty": 1,
      "questionTypes": ["mcq", "short-answer"],
      "estimatedMinutes": 10
    }}
  ]
}}

Rules:
- Exactly 8 concepts
- difficulty: 1 (easiest) to 5 (hardest), should generally increase through the list
- questionTypes: choose from ["mcq", "short-answer", "explain", "diagram", "calculation", "true-false"]
- estimatedMinutes: realistic study time (5-20 min)
- prerequisites: array of id slugs from earlier concepts (empty for the first)
- id: use kebab-case slugs
- For {level} level, adjust starting difficulty and pacing accordingly"""

    content = await call_openrouter(prompt)
    try:
        parsed = json.loads(extract_json(content))
        return parsed["concepts"]
    except (json.JSONDecodeError, KeyError) as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw: {content}")


async def generate_next_question(
    topic: str,
    current_mood: str,
    history_correct: int,
    history_total: int,
) -> dict:
    prompt = f"""You are an AI tutor teaching "{topic}".
The student's current emotional state is: "{current_mood}".
Their recent performance: {history_correct} correct out of {history_total} attempts.

Generate the next quiz question for this student.
Also generate a coaching intervention tailored to their mood.
- If mood is "Confused" or "Frustrated": offer gentle re-explanation or motivation.
- If mood is "Disengaged": add a curiosity hook before the question.
- If mood is "Flow": increase challenge and keep momentum.

Return ONLY a valid JSON object with NO comments, NO markdown, and NO extra text:
{{
  "questionText": "The question here...",
  "intervention": {{
    "coachMessage": "Short message to the student",
    "difficultyAdjustment": "easier",
    "formatSwitch": "text",
    "tone": "encouraging"
  }}
}}

Valid values: difficultyAdjustment = easier | same | harder. formatSwitch = text | visual | interactive | none."""

    content = await call_openrouter(prompt)
    try:
        parsed = json.loads(extract_json(content))
        return {
            "questionText": parsed["questionText"],
            "intervention": parsed["intervention"],
        }
    except (json.JSONDecodeError, KeyError) as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw: {content}")

async def grade_answer(question: str, answer: str) -> dict:
    prompt = f"""You are an expert tutor evaluating a student's answer.
Question: "{question}"
Student Answer: "{answer}"

Determine if the student's answer is logically correct or correct enough to be considered a pass.
Provide a boolean "is_correct" and a short, encouraging "feedback" string explaining why it is correct or incorrect.

Return ONLY a valid JSON object with NO comments, NO markdown, and NO extra text:
{{
  "is_correct": true,
  "feedback": "Great job! That is correct because..."
}}"""

    content = await call_openrouter(prompt)
    try:
        parsed = json.loads(extract_json(content))
        return {
            "is_correct": bool(parsed.get("is_correct", False)),
            "feedback": str(parsed.get("feedback", "")),
        }
    except (json.JSONDecodeError, KeyError) as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw: {content}")
