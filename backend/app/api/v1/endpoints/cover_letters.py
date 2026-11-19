from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.skill_gap import CoverLetter
from app.schemas.skill_gap import CoverLetterRequest, CoverLetterResponse
from app.services.cover_letter_service import CoverLetterService

router = APIRouter()

@router.post("/generate", response_model=CoverLetterResponse)
async def generate_cover_letter(
    req: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate an AI-tailored cover letter for a specific job."""
    active_resume = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.is_active == True
    ).first()

    if not active_resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active resume required. Please upload your resume first."
        )

    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    response = await CoverLetterService.generate_cover_letter(
        resume=active_resume,
        job=job,
        tone=req.tone,
        custom_instructions=req.custom_instructions
    )

    # Persist in database
    db_letter = CoverLetter(
        user_id=current_user.id,
        job_id=job.id,
        tone=req.tone,
        content=response.content
    )
    db.add(db_letter)
    db.commit()
    db.refresh(db_letter)

    response.id = db_letter.id
    return response

@router.get("/", response_model=List[CoverLetterResponse])
def get_user_cover_letters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve previously generated cover letters for the user."""
    letters = db.query(CoverLetter).filter(
        CoverLetter.user_id == current_user.id
    ).order_by(CoverLetter.created_at.desc()).all()

    results = []
    for l in letters:
        job = db.query(Job).filter(Job.id == l.job_id).first()
        results.append(CoverLetterResponse(
            id=l.id,
            user_id=l.user_id,
            job_id=l.job_id,
            job_title=job.title if job else "Software Engineer",
            company=job.company if job else "Tech Company",
            tone=l.tone,
            content=l.content,
            created_at=l.created_at
        ))
    return results
