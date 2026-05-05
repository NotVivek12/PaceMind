from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path
from typing import List


class Settings(BaseSettings):
    # ─── API Keys ─────────────────────────────────────────────────────────────
    openrouter_api_key: str = ""
    gemini_api_key: str = ""

    # ─── Supabase ─────────────────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_key: str = ""

    # ─── Environment ──────────────────────────────────────────────────────────
    environment: str = "development"
    log_level: str = "INFO"

    # ─── CORS ─────────────────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:3000,http://localhost:3001,*"

    # ─── LLM Configuration ───────────────────────────────────────────────────
    llm_provider: str = "openrouter"
    llm_model: str = "anthropic/claude-3.5-sonnet"
    llm_timeout: float = 120.0
    llm_max_retries: int = 2

    # ─── Rate Limiting ────────────────────────────────────────────────────────
    rate_limit_requests: int = 30
    rate_limit_window_seconds: int = 60

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[1] / ".env"),
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()

