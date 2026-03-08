"""
Configuration — reads from environment variables (loaded via python-dotenv).
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── App ────────────────────────────────────────────────────────────────────
    APP_NAME: str = "PillMate Mobile API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3001,http://localhost:3000,http://localhost:8080"
    ).split(",")

    # ── JWT ────────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24 h

    # ── AWS / DynamoDB ─────────────────────────────────────────────────────────
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    # Set to http://localhost:8000 to use DynamoDB Local for development
    DYNAMODB_ENDPOINT_URL: str | None = os.getenv("DYNAMODB_ENDPOINT_URL", None) or None

    # DynamoDB table names
    USERS_TABLE: str = os.getenv("DYNAMODB_USERS_TABLE", "pillmate_users")
    MEDICATIONS_TABLE: str = os.getenv("DYNAMODB_MEDICATIONS_TABLE", "pillmate_medications")
    PRESCRIPTIONS_TABLE: str = os.getenv("DYNAMODB_PRESCRIPTIONS_TABLE", "pillmate_prescriptions")

    # ── Google Gemini ──────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # ── FDA API ────────────────────────────────────────────────────────────────
    FDA_BASE_URL: str = "https://api.fda.gov/drug"


settings = Settings()

# Validate critical secrets at startup
if not settings.DEBUG and settings.JWT_SECRET_KEY == "change-me-in-production":
    raise RuntimeError(
        "JWT_SECRET_KEY is still the default placeholder. "
        "Set a strong random secret in your .env file before running in production."
    )
