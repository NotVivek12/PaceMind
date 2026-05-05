import os
import json
import re
import httpx
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
MODEL = "nvidia/nemotron-4-340b-instruct"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def extract_json(content: str) -> str:
    """Strip markdown code fences if the LLM wraps JSON in them."""
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
    return match.group(1) if match else content


async def call_openrouter(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Adaptive AI Platform",
    }
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(OPENROUTER_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise RuntimeError(
            f"OpenRouter API Error: {response.status_code} {response.text}"
        )

    data = response.json()
    return data["choices"][0]["message"]["content"]


async def generate_curriculum(topic: str, intent: str) -> list[dict]:
    prompt = f"""You are an expert curriculum designer.
A student wants to learn about "{topic}".
Their learning intent is: "{intent}".

Generate a concept dependency graph for this topic with 3-5 key concepts.
Foundational concepts must come first.

Return ONLY a valid JSON object with NO comments, NO markdown, and NO extra text. Use this exact schema:
{{
  "concepts": [
    {{
      "id": "unique-slug",
      "concept": "Concept Name",
      "prerequisites": [],
      "difficulty": 1
    }}
  ]
}}"""

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
