import pytest
from app.services.career_agent import CareerAgentService
from app.models.resume import Resume
from app.models.job import Job
from app.models.user import User

def test_career_agent_search_tool(db_session, test_user):
    job = Job(
        title="Junior Python Engineer",
        company="Startup Co",
        location="Remote",
        remote_type="Remote",
        description="Python backend development with FastAPI.",
        required_skills=["Python", "FastAPI"],
        external_id="test-job-career-001"
    )
    db_session.add(job)
    db_session.commit()

    agent = CareerAgentService(db=db_session, user_id=test_user.id)
    results = agent.tool_search_jobs(query="Python", limit=5)
    assert results["count"] >= 1
    assert any("Python" in j["title"] for j in results["results"])

def test_career_agent_resume_summary_tool(db_session, test_user):
    agent = CareerAgentService(db=db_session, user_id=test_user.id)
    result = agent.tool_get_resume_summary()
    assert "status" in result or "technical_skills" in result
