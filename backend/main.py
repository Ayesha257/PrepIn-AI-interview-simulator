from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict, deque
import time

from routes import interview, report
from routes.auth import router as auth_router
from routes.resume import router as resume_router
from routes.analytics import router as analytics_router
from database import connect_db, disconnect_db
from config import settings

IS_PROD = settings.ENVIRONMENT in {"production", "prod"}

app = FastAPI(
    title="PrepIn AI Interview Simulator",
    description="Backend API for PrepIn — AI-powered interview prep",
    version="1.0.0",
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
    openapi_url=None if IS_PROD else "/openapi.json",
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
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


@app.on_event("startup")
async def startup():
    await connect_db()


@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()
