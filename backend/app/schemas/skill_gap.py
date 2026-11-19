from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class LearningResource(BaseModel):
    title: str
    type: str  # Course, Documentation, Book, Tutorial, Project
    url: Optional[str] = None
    estimated_hours: int = 10

class RoadmapStep(BaseModel):
    step_number: int
    skill_name: str
    importance: str  # Critical, Recommended, Optional
    duration_weeks: int
    description: str
    key_topics: List[str] = Field(default_factory=list)
    hands_on_project: str
    resources: List[LearningResource] = Field(default_factory=list)

class SkillGapRequest(BaseModel):
    job_id: Optional[str] = None
    target_role: Optional[str] = None

class SkillGapResponse(BaseModel):
    id: Optional[str] = None
    user_id: str
    job_id: Optional[str] = None
    target_role: Optional[str] = None
    match_score: float
    matching_skills: List[str]
    missing_skills: List[str]
    summary: str
    roadmap: List[RoadmapStep]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CoverLetterRequest(BaseModel):
    job_id: str
    tone: str = "Professional"  # Professional, Enthusiastic, Technical, Executive
    custom_instructions: Optional[str] = None

class CoverLetterResponse(BaseModel):
    id: Optional[str] = None
    user_id: str
    job_id: str
    job_title: str
    company: str
    tone: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
