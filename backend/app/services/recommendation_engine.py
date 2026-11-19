from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.job import Job
from app.models.resume import Resume
from app.schemas.job import JobMatchResponse
from app.services.embedding_service import embedding_service

class RecommendationEngine:
    @staticmethod
    def calculate_skill_overlap(candidate_skills: List[str], required_skills: List[str]) -> Tuple[List[str], List[str], float]:
        """
        Calculates exact and fuzzy overlap between candidate's extracted skills
        and job requirements.
        """
        c_set = {s.lower().strip() for s in candidate_skills if s}
        matching = []
        missing = []

        for req in required_skills:
            req_clean = req.lower().strip()
            # Direct match or substring token match
            matched = False
            for cand in c_set:
                if cand == req_clean or cand in req_clean or req_clean in cand:
                    matched = True
                    break
            
            if matched:
                matching.append(req)
            else:
                missing.append(req)

        overlap_ratio = len(matching) / len(required_skills) if required_skills else 1.0
        return matching, missing, overlap_ratio

    @staticmethod
    def calculate_experience_score(candidate_years: float, job_experience_level: str) -> float:
        """Calculate alignment between candidate's years of experience and target level."""
        level = (job_experience_level or "").lower()
        if "entry" in level or "junior" in level or "intern" in level:
            return 1.0 if candidate_years <= 3.0 else 0.8
        elif "mid" in level:
            if candidate_years >= 2.0:
                return 1.0
            elif candidate_years >= 1.0:
                return 0.8
            else:
                return 0.6
        elif "senior" in level or "lead" in level:
            if candidate_years >= 5.0:
                return 1.0
            elif candidate_years >= 3.0:
                return 0.75
            else:
                return 0.4
        return 0.85

    @classmethod
    def rank_jobs_for_resume(
        cls,
        db: Session,
        resume: Resume,
        limit: int = 15,
        min_score: float = 0.0,
        query: Optional[str] = None,
        remote_only: bool = False
    ) -> List[JobMatchResponse]:
        """
        Ranks all available jobs in the database against the user's active resume.
        Executes hybrid scoring:
        Score = (0.50 * SemanticSim) + (0.35 * SkillOverlap) + (0.15 * ExpScore) * 100
        """
        # Fetch candidate skills and vector
        parsed = resume.parsed_json or {}
        candidate_skills = parsed.get("technical_skills", []) + parsed.get("tools_and_frameworks", [])
        candidate_years = float(parsed.get("total_years_experience", 1.0))
        resume_vector = resume.embedding

        # Fallback to computing vector if not present
        if not resume_vector:
            resume_vector = embedding_service.get_embedding(resume.raw_text[:2000])

        # Filter jobs
        jobs_query = db.query(Job)
        if remote_only:
            jobs_query = jobs_query.filter(Job.remote_type.ilike("%remote%"))
        if query:
            q_filter = f"%{query}%"
            jobs_query = jobs_query.filter(
                or_(
                    Job.title.ilike(q_filter),
                    Job.company.ilike(q_filter),
                    Job.description.ilike(q_filter)
                )
            )

        all_jobs = jobs_query.all()
        scored_jobs = []

        for job in all_jobs:
            # 1. Semantic vector similarity
            job_vec = job.embedding
            if not job_vec:
                job_vec = embedding_service.get_embedding(f"{job.title} {job.description[:500]}")
            
            semantic_sim = embedding_service.cosine_similarity(resume_vector, job_vec)

            # 2. Skill overlap
            required_skills = job.required_skills or []
            matching_skills, missing_skills, skill_overlap_ratio = cls.calculate_skill_overlap(
                candidate_skills, required_skills
            )

            # 3. Experience alignment
            exp_score = cls.calculate_experience_score(candidate_years, job.experience_level)

            # 4. Composite weighted match score (0 - 100)
            composite_score = (
                (0.50 * semantic_sim) +
                (0.35 * skill_overlap_ratio) +
                (0.15 * exp_score)
            ) * 100.0

            # Round to 1 decimal place
            composite_score = round(min(99.0, max(15.0, composite_score)), 1)

            if composite_score < min_score:
                continue

            # Generate natural language reason
            reason_parts = []
            if semantic_sim > 0.65:
                reason_parts.append(f"Strong semantic profile alignment ({int(semantic_sim * 100)}%)")
            if matching_skills:
                reason_parts.append(f"Matches {len(matching_skills)} of {len(required_skills)} required skills ({', '.join(matching_skills[:3])})")
            if missing_skills:
                reason_parts.append(f"Missing: {', '.join(missing_skills[:2])}")
            
            match_reason = " • ".join(reason_parts) if reason_parts else "Good overall skill and trajectory alignment."

            match_obj = JobMatchResponse(
                id=job.id,
                title=job.title,
                company=job.company,
                location=job.location,
                remote_type=job.remote_type,
                description=job.description,
                requirements=job.requirements,
                required_skills=job.required_skills or [],
                experience_level=job.experience_level,
                salary_min=job.salary_min,
                salary_max=job.salary_max,
                currency=job.currency,
                source=job.source,
                source_url=job.source_url,
                external_id=job.external_id,
                posted_at=job.posted_at,
                created_at=job.created_at,
                match_score=composite_score,
                semantic_similarity=round(semantic_sim, 3),
                skill_match_percentage=round(skill_overlap_ratio * 100, 1),
                matching_skills=matching_skills,
                missing_skills=missing_skills,
                match_reason=match_reason
            )
            scored_jobs.append(match_obj)

        # Sort descending by match score
        scored_jobs.sort(key=lambda j: j.match_score, reverse=True)
        return scored_jobs[:limit]

recommendation_engine = RecommendationEngine()
