from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response
from .config import get_settings
from .routers import health, curriculum, content, session, analytics, mood, questions, intervention
from .middleware.logging import LoggingMiddleware
from .middleware.rate_limiter import RateLimiterMiddleware
from .middleware.error_handler import global_exception_handler
from .services.ai_service import init_http_client, close_http_client
import structlog


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_http_client()
    yield
    await close_http_client()


def create_app() -> FastAPI:
    _configure_logging()
    settings = get_settings()

    app = FastAPI(
        title="PaceMind - Adaptive AI Learning Platform API",
        version="1.2.0",
        lifespan=lifespan,
    )

    # ✅ CORS MUST be first
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ✅ Other middleware
    # app.add_middleware(LoggingMiddleware)
    app.add_middleware(RateLimiterMiddleware)

    # ✅ Exception handler
    app.add_exception_handler(Exception, global_exception_handler)

    # ✅ Catch-all OPTIONS for non-preflight clients/tests
    @app.options("/{full_path:path}")
    async def preflight_handler(full_path: str):
        return Response(status_code=200)

    # Routers
    app.include_router(health.router)
    app.include_router(content.router)
    app.include_router(session.router)
    app.include_router(analytics.router)

    app.include_router(curriculum.router, prefix="/api")
    app.include_router(mood.router, prefix="/api")
    app.include_router(questions.router, prefix="/api")
    app.include_router(intervention.router, prefix="/api")

    return app


app = create_app()