import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base, VectorType

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    location = Column(String(255), default="Remote")
    remote_type = Column(String(50), default="Remote")  # Remote, Hybrid, On-site
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    required_skills = Column(JSON, default=list)  # List of strings e.g. ["Python", "FastAPI", "React"]
    experience_level = Column(String(50), default="Entry")  # Entry, Mid, Senior, Lead
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    currency = Column(String(10), default="USD")
    source = Column(String(100), default="Curated")  # RemoteOK, Arbeitnow, Curated
    source_url = Column(String(1024), nullable=True)
    external_id = Column(String(255), unique=True, index=True, nullable=True)
    embedding = Column(VectorType, nullable=True)  # Vector representation
    posted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    saved_jobs = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")
    cover_letters = relationship("CoverLetter", back_populates="job", cascade="all, delete-orphan")
    skill_gap_reports = relationship("SkillGapReport", back_populates="job", cascade="all, delete-orphan")
