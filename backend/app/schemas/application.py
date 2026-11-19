from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.job import JobResponse

class ApplicationCreate(BaseModel):
    job_id: str
    status: str = "Saved"  # Saved, Applied, Interviewing, Offer, Rejected
    applied_date: Optional[datetime] = None
    notes: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    applied_date: Optional[datetime] = None
    notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    job_id: str
    status: str
    applied_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    job: Optional[JobResponse] = None
    model_config = ConfigDict(from_attributes=True)

class SavedJobCreate(BaseModel):
    job_id: str

class SavedJobResponse(BaseModel):
    id: str
    user_id: str
    job_id: str
    created_at: datetime
    job: Optional[JobResponse] = None
    model_config = ConfigDict(from_attributes=True)
