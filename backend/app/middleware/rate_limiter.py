"""
Simple in-memory token-bucket rate limiter.
No external dependencies (no Redis).
"""

import time
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from ..config import get_settings


class _TokenBucket:
    """Per-client token bucket."""

    def __init__(self, max_tokens: int, refill_seconds: int):
        self.max_tokens = max_tokens
        self.refill_seconds = refill_seconds
        self.tokens = float(max_tokens)
        self.last_refill = time.monotonic()

    def consume(self) -> bool:
        now = time.monotonic()
        elapsed = now - self.last_refill
        # Refill proportionally
        self.tokens = min(
            self.max_tokens,
            self.tokens + elapsed * (self.max_tokens / self.refill_seconds),
        )
        self.last_refill = now

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Applies rate limiting to /api/ routes only.
    Non-API routes (health, docs) are exempt.
    """

    def __init__(self, app):
        super().__init__(app)
        self._buckets: dict[str, _TokenBucket] = defaultdict(self._new_bucket)

    @staticmethod
    def _new_bucket() -> _TokenBucket:
        settings = get_settings()
        return _TokenBucket(
            max_tokens=settings.rate_limit_requests,
            refill_seconds=settings.rate_limit_window_seconds,
        )

    async def dispatch(self, request: Request, call_next):
        # Only rate-limit API endpoints
        if request.url.path.startswith("/api/"):
            client_ip = request.client.host if request.client else "unknown"
            bucket = self._buckets[client_ip]
            if not bucket.consume():
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Please slow down.",
                )

        return await call_next(request)
