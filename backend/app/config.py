from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # ─── API Keys ─────────────────────────────────────────────────────────────
    openrouter_api_key: str = ""

    # ─── Supabase ─────────────────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_key: str = ""

    # ─── Environment ──────────────────────────────────────────────────────────
    environment: str = "development"
    log_level: str = "INFO"

    # ─── CORS ─────────────────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    # ─── LLM Configuration ───────────────────────────────────────────────────
    llm_model: str = "nvidia/nemotron-3-super-120b-a12b:free"
    llm_timeout: float = 60.0
    llm_max_retries: int = 2

    # ─── Rate Limiting ────────────────────────────────────────────────────────
    rate_limit_requests: int = 30
    rate_limit_window_seconds: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
