from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    resumes,
    jobs,
    recommendations,
    skill_gap,
    cover_letters,
    applications,
    assistant
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(skill_gap.router, prefix="/skills", tags=["Skill Gap & Roadmaps"])
api_router.include_router(cover_letters.router, prefix="/cover-letters", tags=["Cover Letters"])
api_router.include_router(applications.router, prefix="/applications", tags=["Application Tracker"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["AI Career Assistant"])
