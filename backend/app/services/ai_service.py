"""
LLM integration via Gemini or OpenRouter.
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
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

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

    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set")

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


def _extract_gemini_text(data: dict) -> str:
    candidates = data.get("candidates") or []
    if not candidates:
        raise RuntimeError("Gemini response missing candidates")
    content = candidates[0].get("content") or {}
    parts = content.get("parts") or []
    text = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
    if not text:
        raise RuntimeError("Gemini response missing text")
    return text


async def call_gemini(prompt: str) -> str:
    settings = get_settings()
    client = get_http_client()

    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")

    url = GEMINI_URL.format(model=settings.llm_model)
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ]
    }

    last_error: Exception | None = None
    for attempt in range(1 + settings.llm_max_retries):
        try:
            response = await client.post(
                url,
                params={"key": settings.gemini_api_key},
                json=payload,
            )

            if response.status_code == 200:
                return _extract_gemini_text(response.json())

            if response.status_code == 429 or response.status_code >= 500:
                last_error = RuntimeError(
                    f"Gemini server error: {response.status_code}"
                )
                logger.warning(
                    "llm_server_error",
                    status=response.status_code,
                    attempt=attempt + 1,
                )
            else:
                raise RuntimeError(
                    f"Gemini API Error: {response.status_code} {response.text}"
                )

        except httpx.TimeoutException as exc:
            last_error = RuntimeError(f"LLM request timed out: {exc}")
            logger.warning("llm_timeout", attempt=attempt + 1)

        except httpx.RequestError as exc:
            last_error = RuntimeError(f"LLM network error: {exc}")
            logger.warning("llm_network_error", attempt=attempt + 1, error=str(exc))

        if attempt < settings.llm_max_retries:
            wait = 2 ** attempt
            await asyncio.sleep(wait)

    raise last_error or RuntimeError("LLM call failed after retries")


async def call_llm(prompt: str) -> str:
    settings = get_settings()
    provider = settings.llm_provider.lower().strip()
    if provider == "openrouter":
        return await call_openrouter(prompt)
    if provider == "gemini":
        return await call_gemini(prompt)
    raise RuntimeError(f"Unknown LLM provider: {settings.llm_provider}")


# ─── In-memory curriculum cache (avoids redundant LLM calls) ──────────────────
_curriculum_cache: dict[str, list[dict]] = {}


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

    # Check cache first
    cache_key = f"{topic}|{intent}|{level}"
    if cache_key in _curriculum_cache:
        logger.info("curriculum_cache_hit", topic=topic)
        return _curriculum_cache[cache_key]

    content = await call_llm(prompt)
    try:
        parsed = json.loads(extract_json(content))
        concepts = parsed["concepts"]
        _curriculum_cache[cache_key] = concepts
        return concepts
    except (json.JSONDecodeError, KeyError) as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw: {content}")


async def generate_next_question(
    topic: str,
    current_mood: str,
    history_correct: int,
    history_total: int,
        wrong_streak: int = 0,
) -> dict:
    accuracy = (history_correct / history_total) if history_total else 0.0
    prompt = f"""You are an AI tutor teaching "{topic}".
The student's current emotional state is: "{current_mood}".
Their recent performance: {history_correct} correct out of {history_total} attempts.
Accuracy ratio: {accuracy:.2f}.
Wrong answers in a row: {wrong_streak}.

Generate the next quiz question for this student.
Also generate a coaching intervention tailored to their mood.
- If mood is "Confused" or "Frustrated": offer gentle re-explanation or motivation.
- If mood is "Disengaged": add a curiosity hook before the question.
- If mood is "Flow": increase challenge and keep momentum.
- If wrong_streak >= 3: make the question easier and set difficultyAdjustment to "easier".
- If history_total >= 3 and accuracy >= 0.8: raise challenge and set difficultyAdjustment to "harder".

Return ONLY a valid JSON object with NO comments, NO markdown, and NO extra text:
{{
  "questionText": "The question here...",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
  "intervention": {{
    "coachMessage": "Short message to the student",
    "difficultyAdjustment": "easier",
    "formatSwitch": "text",
    "tone": "encouraging"
  }}
}}

Valid values: difficultyAdjustment = easier | same | harder. formatSwitch = text | visual | interactive | none.
Options must be 4 short answer choices with exactly one correct; correctIndex is 0-3."""

    content = await call_llm(prompt)
    try:
        parsed = json.loads(extract_json(content))
        options = parsed.get("options", [])
        if not isinstance(options, list):
            options = []

        correct_index = parsed.get("correctIndex")
        if isinstance(correct_index, str) and correct_index.isdigit():
            correct_index = int(correct_index)
        if not isinstance(correct_index, int) or correct_index not in range(4):
            correct_index = None

        return {
            "questionText": parsed["questionText"],
            "options": options,
            "correctIndex": correct_index,
            "intervention": parsed["intervention"],
        }
    except (json.JSONDecodeError, KeyError) as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw: {content}")


async def generate_intervention(
    topic: str,
    current_mood: str,
    history_correct: int,
    history_total: int,
    wrong_streak: int = 0,
) -> dict:
    accuracy = (history_correct / history_total) if history_total else 0.0
    prompt = f"""You are a supportive coaching assistant for an adaptive learning app.

Topic: {topic}
Mood: {current_mood}
Recent performance: {history_correct} correct out of {history_total} attempts.
Accuracy ratio: {accuracy:.2f}
Wrong answers in a row: {wrong_streak}

Write a short coaching message that matches the mood and adjusts difficulty.
If wrong_streak >= 3, set difficultyAdjustment to "easier".
If history_total >= 3 and accuracy >= 0.8, set difficultyAdjustment to "harder".

Return ONLY valid JSON, no markdown:
{
  "coachMessage": "Short message",
  "difficultyAdjustment": "easier",
  "formatSwitch": "text",
  "tone": "encouraging"
}

Valid values: difficultyAdjustment = easier | same | harder. formatSwitch = text | visual | interactive | none."""

    content = await call_llm(prompt)
    try:
        parsed = json.loads(extract_json(content))
        return {
            "coachMessage": parsed.get("coachMessage", ""),
            "difficultyAdjustment": parsed.get("difficultyAdjustment", "same"),
            "formatSwitch": parsed.get("formatSwitch", "text"),
            "tone": parsed.get("tone", "encouraging"),
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

    content = await call_llm(prompt)
    try:
        parsed = json.loads(extract_json(content))
        return {
            "is_correct": bool(parsed.get("is_correct", False)),
            "feedback": str(parsed.get("feedback", "")),
        }
    except (json.JSONDecodeError, KeyError) as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw: {content}")
