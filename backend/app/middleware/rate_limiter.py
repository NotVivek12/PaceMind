import time
from collections import defaultdict
from fastapi.responses import JSONResponse
from ..config import get_settings


class _TokenBucket:
    def __init__(self, max_tokens: int, refill_seconds: int):
        self.max_tokens = max_tokens
        self.refill_seconds = refill_seconds
        self.tokens = float(max_tokens)
        self.last_refill = time.monotonic()

    def consume(self) -> bool:
        now = time.monotonic()
        elapsed = now - self.last_refill

        self.tokens = min(
            self.max_tokens,
            self.tokens + elapsed * (self.max_tokens / self.refill_seconds),
        )
        self.last_refill = now

        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False


class RateLimiterMiddleware:
    """
    Pure ASGI middleware — SAFE for CORS
    """

    def __init__(self, app):
        self.app = app
        self._buckets = defaultdict(self._new_bucket)

    @staticmethod
    def _new_bucket():
        settings = get_settings()
        return _TokenBucket(
            max_tokens=settings.rate_limit_requests,
            refill_seconds=settings.rate_limit_window_seconds,
        )

    async def __call__(self, scope, receive, send):
        # Only handle HTTP
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope["method"]
        path = scope["path"]

        # ✅ CRITICAL: never block CORS preflight
        if method == "OPTIONS":
            await self.app(scope, receive, send)
            return

        # Apply rate limiting only to API routes
        if path.startswith("/api/"):
            client = scope.get("client")
            client_ip = client[0] if client else "unknown"
            bucket = self._buckets[client_ip]

            if not bucket.consume():
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded"},
                )
                await response(scope, receive, send)
                return

        # Continue request chain
        await self.app(scope, receive, send)