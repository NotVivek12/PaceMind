import time
import structlog

logger = structlog.get_logger()

class LoggingMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope["method"]
        path = scope["path"]
        client = scope.get("client")
        client_ip = client[0] if client else None

        start_time = time.time()

        # Log request
        logger.info(
            "request_started",
            method=method,
            path=path,
            client=client_ip
        )

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                duration = (time.time() - start_time) * 1000

                logger.info(
                    "request_finished",
                    method=method,
                    path=path,
                    status_code=message["status"],
                    duration_ms=round(duration, 2)
                )

            await send(message)

        await self.app(scope, receive, send_wrapper)
