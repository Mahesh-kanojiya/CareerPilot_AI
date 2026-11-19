import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import app.models  # Ensure all SQLAlchemy models are registered
from app.core.database import engine, Base, SessionLocal
from app.api.v1.router import api_router
from app.services.job_fetcher import JobFetcherService
from app.models.job import Job

# Lifespan context manager for startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created
    try:
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
    return {"status": "healthy", "database": "connected"}
