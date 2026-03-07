"""
PillMate Mobile — FastAPI backend entry point.

Run:
    uvicorn main:app --reload --port 8080

Endpoints are grouped by router:
    /auth        — register, login, JWT, profile
    /analyze     — prescription image OCR via Gemini
    /medications — CRUD for a user's medication list
    /drugs       — FDA drug search + contraindication checking
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db.dynamodb import create_tables_if_not_exist
from routers import analyze, auth, drugs, medications


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Bootstrap DynamoDB tables on startup."""
    print("[Startup] Checking DynamoDB tables…")
    try:
        create_tables_if_not_exist()
        print("[Startup] DynamoDB ready.")
    except Exception as exc:
        print(f"[Startup] WARNING: Could not create DynamoDB tables: {exc}")
    yield


# Disable interactive docs in production (DEBUG=false)
_docs_url = "/docs" if settings.DEBUG else None
_redoc_url = "/redoc" if settings.DEBUG else None

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "REST API for the PillMate mobile app. "
        "Provides prescription analysis (Gemini AI), "
        "medication management (DynamoDB), "
        "drug search (FDA), and JWT authentication."
    ),
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(medications.router)
app.include_router(drugs.router)


@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/health", tags=["health"])
async def health():
    return {"status": "healthy"}
