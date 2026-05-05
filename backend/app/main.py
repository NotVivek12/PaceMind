from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .routers import health, curriculum, content, session, analytics, mood
from .middleware.logging import LoggingMiddleware
from .middleware.rate_limiter import RateLimiterMiddleware
from .middleware.error_handler import global_exception_handler
from .services.ai_service import init_http_client, close_http_client
import structlog


# ─── Structured Logging Setup ─────────────────────────────────────────────────

def _configure_logging():
    settings = get_settings()
    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer()
            if settings.environment == "development"
            else structlog.processors.JSONRenderer(),
        ]
    )


# ─── Application Lifespan ─────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init shared HTTP client. Shutdown: close it."""
    await init_http_client()
    yield
    await close_http_client()


# ─── App Factory ──────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    _configure_logging()
    settings = get_settings()

    app = FastAPI(
        title="PaceMind - Adaptive AI Learning Platform API",
        version="1.2.0",
        lifespan=lifespan,
    )

    # ── Middleware (order matters: outermost first) ────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RateLimiterMiddleware)
    app.add_middleware(LoggingMiddleware)

    # ── Exception Handlers ────────────────────────────────────────────────
    app.add_exception_handler(Exception, global_exception_handler)

    # ── Routers ───────────────────────────────────────────────────────────
    app.include_router(health.router)
    app.include_router(curriculum.router)
    app.include_router(content.router)
    app.include_router(session.router)
    app.include_router(analytics.router)
    app.include_router(mood.router)

    return app


app = create_app()
