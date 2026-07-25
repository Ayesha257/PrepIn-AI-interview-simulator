from dotenv import load_dotenv
import os
from pathlib import Path

# Always load backend/.env regardless of process working directory
_ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(_ENV_PATH)


def _require(name: str) -> str:
    value = os.getenv(name)
    if not value or not str(value).strip():
        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            f"Set it in {_ENV_PATH}"
        )
    return value.strip()


class Settings:
    MONGO_URL: str = _require("MONGO_URL")
    SECRET_KEY: str = _require("SECRET_KEY")
    DB_NAME: str = os.getenv("DB_NAME", "interview_simulator").strip()
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # 8h
    GOOGLE_CLIENT_ID: str | None = (os.getenv("GOOGLE_CLIENT_ID") or "").strip() or None
    FRONTEND_URL: str = (os.getenv("FRONTEND_URL") or "http://localhost:3000").strip()
    ENVIRONMENT: str = (os.getenv("ENVIRONMENT") or "development").strip().lower()
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in (os.getenv("CORS_ORIGINS") or "").split(",")
        if o.strip()
    ] or [
        "https://prep-in-ai-interview-simulator-hcgr.vercel.app",
        "http://localhost:3000",
    ]
    # Swagger / ReDoc — only enabled when BOTH are set (HTTP Basic Auth).
    # If unset, /docs /redoc /openapi.json are unavailable to everyone.
    DOCS_USERNAME: str | None = (os.getenv("DOCS_USERNAME") or "").strip() or None
    DOCS_PASSWORD: str | None = (os.getenv("DOCS_PASSWORD") or "").strip() or None


settings = Settings()
