import pytest
from app.services.recommendation_engine import recommendation_engine
from app.services.embedding_service import embedding_service
from app.models.resume import Resume
from app.models.job import Job

def test_cosine_similarity():
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    sim_identical = embedding_service.cosine_similarity(v1, v2)
    assert round(sim_identical, 2) == 1.0

    v3 = [0.0, 1.0, 0.0]
    sim_orthogonal = embedding_service.cosine_similarity(v1, v3)
    assert round(sim_orthogonal, 2) == 0.0

def test_skill_overlap_calculation():
    cand_skills = ["Python", "FastAPI", "Docker", "PostgreSQL"]
    job_skills = ["Python", "FastAPI", "Kubernetes", "AWS"]

    matching, missing, ratio = recommendation_engine.calculate_skill_overlap(cand_skills, job_skills)
    assert "Python" in matching
    assert "FastAPI" in matching
    assert "Kubernetes" in missing
    assert "AWS" in missing
    assert ratio == 0.5

def test_experience_scoring():
    # Candidate with 2 years applying for entry
    score_entry = recommendation_engine.calculate_experience_score(2.0, "Entry")
    assert score_entry == 1.0

    # Candidate with 1 year applying for senior
    score_senior = recommendation_engine.calculate_experience_score(1.0, "Senior")
    assert score_senior < 0.6
