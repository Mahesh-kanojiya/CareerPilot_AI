from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ParsedContact(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None

class ParsedExperience(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    highlights: List[str] = Field(default_factory=list)

class ParsedEducation(BaseModel):
    degree: str
    institution: str
    field_of_study: Optional[str] = None
    graduation_year: Optional[str] = None
    gpa: Optional[str] = None

class ParsedProject(BaseModel):
    name: str
    description: str
    technologies: List[str] = Field(default_factory=list)
    link: Optional[str] = None

class ParsedResume(BaseModel):
    contact: ParsedContact = Field(default_factory=ParsedContact)
    summary: Optional[str] = None
    total_years_experience: float = 0.0
    technical_skills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    tools_and_frameworks: List[str] = Field(default_factory=list)
    experience: List[ParsedExperience] = Field(default_factory=list)
    education: List[ParsedEducation] = Field(default_factory=list)
    projects: List[ParsedProject] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)

class ResumeResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_type: str
    raw_text: str
    parsed_json: Optional[ParsedResume] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ResumeUploadResponse(BaseModel):
    message: str
    resume: ResumeResponse
