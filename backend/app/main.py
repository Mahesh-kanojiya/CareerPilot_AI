import os
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
import app.models  # Ensure all SQLAlchemy models are registered
from app.core.database import engine, Base, SessionLocal
from app.api.v1.router import api_router
from app.services.job_fetcher import JobFetcherService
from app.models.job import Job
from app.models.user import User

# Lifespan context manager for startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created
    try:
        if not settings.DATABASE_URL.startswith("sqlite"):
            try:
                with engine.connect() as conn:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                    conn.commit()
            except Exception as ext_err:
                print(f"[CareerPilot AI] Vector extension notice: {ext_err}")
        Base.metadata.create_all(bind=engine)
        print("[CareerPilot AI] Database tables verified.")
    except Exception as e:
        print(f"[CareerPilot AI] DB init notice: {e}")

    yield
    # Shutdown logic
    print("[CareerPilot AI] Server shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Agentic AI Career Intelligence Platform API empowering students and engineers with semantic job matching, skill gap diagnosis, and autonomous career guidance.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Global 500 error handler so debugging is transparent
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.strip().rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Router (supports both /api/v1/auth/login and direct /auth/login)
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router)

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health", tags=["Health"])
def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db = SessionLocal()
        try:
            Base.metadata.create_all(bind=engine)
            user_count = db.query(User).count()
            return {"status": "healthy", "database": "connected", "users_count": user_count}
        finally:
            db.close()
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e), "type": type(e).__name__}
        )
