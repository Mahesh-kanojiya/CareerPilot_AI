from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.job import Job
from app.schemas.job import JobResponse, JobListResponse
from app.services.job_fetcher import JobFetcherService

router = APIRouter()

@router.get("/", response_model=JobListResponse)
def get_jobs(
    query: Optional[str] = Query(None, description="Keyword search in title, company, description"),
    location: Optional[str] = Query(None, description="Filter by location"),
    remote_only: bool = Query(False, description="Filter remote positions only"),
    experience_level: Optional[str] = Query(None, description="Entry, Mid, Senior"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List jobs with keyword filtering and pagination."""
    q = db.query(Job)

    if query:
        pattern = f"%{query}%"
        q = q.filter(
            or_(
                Job.title.ilike(pattern),
                Job.company.ilike(pattern),
                Job.description.ilike(pattern)
            )
        )
    if location:
        q = q.filter(Job.location.ilike(f"%{location}%"))
    if remote_only:
        q = q.filter(Job.remote_type.ilike("%remote%"))
    if experience_level:
        q = q.filter(Job.experience_level.ilike(f"%{experience_level}%"))

    total = q.count()
    jobs = q.order_by(Job.posted_at.desc()).offset(offset).limit(limit).all()

    return JobListResponse(
        total=total,
        jobs=[JobResponse.model_validate(j) for j in jobs]
    )

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single job posting."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse.model_validate(job)

@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_jobs(
    fetch_external: bool = Query(True, description="Fetch from live RemoteOK and Arbeitnow APIs"),
    db: Session = Depends(get_db)
):
    """Trigger job ingestion from live APIs and curated seeds."""
    added = await JobFetcherService.sync_all_jobs(db=db, fetch_external=fetch_external)
    return {
        "message": f"Job synchronization complete. Ingested {added} new postings.",
        "new_jobs_added": added,
        "total_jobs_in_db": db.query(Job).count()
    }
