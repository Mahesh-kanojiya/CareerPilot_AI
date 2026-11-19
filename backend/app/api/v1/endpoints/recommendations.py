from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.schemas.job import JobMatchResponse
from app.services.recommendation_engine import recommendation_engine

router = APIRouter()

@router.get("/", response_model=List[JobMatchResponse])
def get_personalized_recommendations(
    query: Optional[str] = Query(None, description="Optional search keywords to refine recommendations"),
    remote_only: bool = Query(False, description="Filter for remote jobs"),
    limit: int = Query(15, ge=1, le=50),
    min_score: float = Query(20.0, ge=0.0, le=100.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns personalized job recommendations ranked by our Hybrid Engine:
    (50% Semantic Vector Similarity + 35% Skill Overlap + 15% Experience Alignment).
    """
    active_resume = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.is_active == True
    ).first()

    if not active_resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active resume found. Please upload a resume first to receive personalized recommendations."
        )

    recommendations = recommendation_engine.rank_jobs_for_resume(
        db=db,
        resume=active_resume,
        limit=limit,
        min_score=min_score,
        query=query,
        remote_only=remote_only
    )

    return recommendations
