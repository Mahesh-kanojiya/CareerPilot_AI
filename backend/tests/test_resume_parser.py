import pytest
from app.services.resume_parser import ResumeParserService

SAMPLE_RESUME_TEXT = """
Sarah Jenkins
San Francisco, CA • sarah.jenkins@gmail.com • (555) 123-4567 • linkedin.com/in/sarahjenkins • github.com/sarah-j

SUMMARY
Full-Stack Software Engineer with 2 years of experience building scalable web applications and REST APIs using Python, FastAPI, and React. Passionate about AI integration and cloud systems.

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL, Bash
Frameworks: FastAPI, React, Next.js, Node.js, Tailwind CSS
Databases: PostgreSQL, Redis, MongoDB
Tools: Docker, Git, GitHub Actions, Linux, AWS

EXPERIENCE
Software Engineering Intern | CloudScale Inc.
June 2023 - Present | San Francisco, CA
- Developed asynchronous microservices using FastAPI and PostgreSQL handling 5,000 requests per minute.
- Built responsive UI components with React and Tailwind CSS.
- Containerized applications using Docker and automated CI/CD deployments with GitHub Actions.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley (2020 - 2024)
"""

def test_resume_rule_parser_contact_extraction():
    parsed = ResumeParserService.parse_with_rule_engine(SAMPLE_RESUME_TEXT)
    assert parsed.contact.name == "Sarah Jenkins"
    assert parsed.contact.email == "sarah.jenkins@gmail.com"
    assert "github.com/sarah-j" in parsed.contact.github
    assert "linkedin.com/in/sarahjenkins" in parsed.contact.linkedin

def test_resume_rule_parser_skills_extraction():
    parsed = ResumeParserService.parse_with_rule_engine(SAMPLE_RESUME_TEXT)
    skills = [s.lower() for s in parsed.technical_skills]
    assert "python" in skills
    assert "fastapi" in skills
    assert "react" in skills
    assert "postgresql" in skills
    assert "docker" in skills

def test_empty_resume_handling():
    parsed = ResumeParserService.parse_with_rule_engine("")
    assert parsed.contact.name == "Candidate"
    assert isinstance(parsed.technical_skills, list)
