from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.job import Job
from app.models.application import Application, SavedJob
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    SavedJobCreate, SavedJobResponse
)

router = APIRouter()

@router.get("/", response_model=List[ApplicationResponse])
def get_user_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all tracked job applications for current user."""
    apps = db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.updated_at.desc()).all()
    return apps

@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a job to application tracker."""
    job = db.query(Job).filter(Job.id == app_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.job_id == app_in.job_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This job is already in your application tracker.")

    new_app = Application(
        user_id=current_user.id,
        job_id=app_in.job_id,
        status=app_in.status,
        applied_date=app_in.applied_date or (datetime.now(timezone.utc) if app_in.status == "Applied" else None),
        notes=app_in.notes
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

@router.patch("/{app_id}", response_model=ApplicationResponse)
def update_application_status(
    app_id: str,
    update_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update application status or notes."""
    app_record = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id
    ).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")

    if update_data.status is not None:
        app_record.status = update_data.status
        if update_data.status == "Applied" and not app_record.applied_date:
            app_record.applied_date = datetime.now(timezone.utc)
    if update_data.applied_date is not None:
        app_record.applied_date = update_data.applied_date
    if update_data.notes is not None:
        app_record.notes = update_data.notes

    db.commit()
    db.refresh(app_record)
    return app_record

@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an application tracker record."""
    app_record = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id
    ).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")
    db.delete(app_record)
    db.commit()
    return None

@router.get("/saved", response_model=List[SavedJobResponse])
def get_saved_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List bookmarked / saved jobs."""
    saved = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.id
    ).order_by(SavedJob.created_at.desc()).all()
    return saved

@router.post("/saved", response_model=SavedJobResponse, status_code=status.HTTP_201_CREATED)
def save_job(
    req: SavedJobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bookmark a job for later."""
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.id,
        SavedJob.job_id == req.job_id
    ).first()
    if existing:
        return existing

    new_saved = SavedJob(user_id=current_user.id, job_id=req.job_id)
    db.add(new_saved)
    db.commit()
    db.refresh(new_saved)
    return new_saved

@router.delete("/saved/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_saved_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a saved job bookmark."""
    saved = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.id,
        SavedJob.job_id == job_id
    ).first()
    if saved:
        db.delete(saved)
        db.commit()
    return None
