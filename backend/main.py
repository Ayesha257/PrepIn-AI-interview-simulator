from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict, deque
import base64
import secrets
import time
import logging

from routes import interview, report
from routes.auth import router as auth_router
from routes.resume import router as resume_router
from routes.analytics import router as analytics_router
from database import connect_db, disconnect_db, get_db
from config import settings

logger = logging.getLogger("prepin")
IS_PROD = settings.ENVIRONMENT in {"production", "prod"}
DOCS_ENABLED = bool(settings.DOCS_USERNAME and settings.DOCS_PASSWORD)

# Built-in docs disabled — custom routes + Basic Auth middleware when credentials exist
app = FastAPI(
    title="PrepIn AI Interview Simulator",
    description="Backend API for PrepIn — AI-powered interview prep",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


def _docs_unauthorized():
    return Response(
        content="Authentication required",
        status_code=status.HTTP_401_UNAUTHORIZED,
        headers={"WWW-Authenticate": 'Basic realm="PrepIn Docs"'},
        media_type="text/plain",
    )


def _docs_authorized(request: Request) -> bool:
    """Validate HTTP Basic credentials for docs paths."""
    header = request.headers.get("Authorization") or ""
    if not header.startswith("Basic "):
        return False
    try:
        decoded = base64.b64decode(header[6:].strip()).decode("utf-8")
        username, _, password = decoded.partition(":")
    except Exception:
        return False
    user_ok = secrets.compare_digest(username, settings.DOCS_USERNAME or "")
    pass_ok = secrets.compare_digest(password, settings.DOCS_PASSWORD or "")
    return user_ok and pass_ok


class DocsAuthMiddleware(BaseHTTPMiddleware):
    """Lock /docs /redoc /openapi.json — shared username/password for owners only."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path.rstrip("/") or "/"
        docs_hit = path in {"/docs", "/redoc", "/openapi.json"}
        if not docs_hit:
            return await call_next(request)
        if not DOCS_ENABLED:
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        if not _docs_authorized(request):
            return _docs_unauthorized()
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Catch errors here so CORS middleware still attaches headers
        # (BaseHTTPMiddleware otherwise turns 500s into browser "Failed to fetch")
        try:
            response: Response = await call_next(request)
        except Exception as exc:
            from starlette.exceptions import HTTPException as StarletteHTTPException
            from fastapi.exceptions import RequestValidationError
            if isinstance(exc, (StarletteHTTPException, RequestValidationError)):
                raise
            logger.exception("Unhandled error on %s %s", request.method, request.url.path)
            detail = "Internal server error" if IS_PROD else str(exc)
            response = JSONResponse(status_code=500, content={"detail": detail})
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if IS_PROD:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class SimpleRateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory rate limiter for auth-sensitive paths."""

    def __init__(self, app, max_requests: int = 30, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.hits = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        sensitive = path.startswith("/api/auth/") or path.endswith("/upload") or "/interview/answer" in path
        if sensitive and request.method in {"POST", "PUT", "PATCH"}:
            client_ip = request.client.host if request.client else "unknown"
            key = f"{client_ip}:{path}"
            now = time.time()
            q = self.hits[key]
            while q and now - q[0] > self.window_seconds:
                q.popleft()
            if len(q) >= self.max_requests:
                return Response(content='{"detail":"Too many requests"}', status_code=429, media_type="application/json")
            q.append(now)
        return await call_next(request)


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(SimpleRateLimitMiddleware, max_requests=20, window_seconds=60)
app.add_middleware(DocsAuthMiddleware)

# CORS — set CORS_ORIGINS in production to your real frontend URL(s) only
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(resume_router, prefix="/api/resume", tags=["Resume"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(report.router, prefix="/api/report", tags=["Report"])


@app.get("/openapi.json", include_in_schema=False)
async def openapi_json():
    if not DOCS_ENABLED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")
    return app.openapi()


@app.get("/docs", include_in_schema=False)
async def swagger_ui():
    if not DOCS_ENABLED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="PrepIn API Docs",
    )


@app.get("/redoc", include_in_schema=False)
async def redoc_ui():
    if not DOCS_ENABLED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")
    return get_redoc_html(
        openapi_url="/openapi.json",
        title="PrepIn API ReDoc",
    )


@app.get("/api/health")
async def health():
    """Public health check — use this to verify deploy + MongoDB."""
    try:
        db = get_db()
        await db.command("ping")
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        logger.exception("Health check failed")
        return JSONResponse(
            status_code=503,
            content={"status": "error", "database": "disconnected", "detail": str(exc)},
        )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all for unexpected errors. HTTPException keeps FastAPI's own handler."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    detail = "Internal server error" if IS_PROD else str(exc)
    return JSONResponse(status_code=500, content={"detail": detail})


@app.on_event("startup")
async def startup():
    await connect_db()


@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()
