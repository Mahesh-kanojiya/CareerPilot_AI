from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class JobBase(BaseModel):
    title: str
    company: str
    location: str = "Remote"
    remote_type: str = "Remote"
    description: str
    requirements: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    experience_level: str = "Entry"
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: str = "USD"
    source: str = "Curated"
    source_url: Optional[str] = None

class JobCreate(JobBase):
    external_id: Optional[str] = None

class JobResponse(JobBase):
    id: str
    external_id: Optional[str] = None
    posted_at: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class JobSearchParams(BaseModel):
    query: Optional[str] = None
    location: Optional[str] = None
    remote_type: Optional[str] = None
    experience_level: Optional[str] = None
    min_salary: Optional[float] = None
    limit: int = 20
    offset: int = 0

class JobMatchResponse(JobResponse):
    match_score: float = Field(..., description="Overall weighted match percentage (0-100)")
    semantic_similarity: float = Field(..., description="Cosine similarity score (0-1)")
    skill_match_percentage: float = Field(..., description="Percentage of required skills present in resume")
    matching_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    match_reason: str = Field(..., description="AI or rule-based justification of match")

class JobListResponse(BaseModel):
    total: int
    jobs: List[JobResponse]
