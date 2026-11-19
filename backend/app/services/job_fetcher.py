import httpx
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.job import Job
from app.services.embedding_service import embedding_service
from app.core.config import settings

# Comprehensive high-quality tech job catalogue used for initial seeding & fallback
CURATED_TECH_JOBS = [
    {
        "external_id": "curated-001",
        "title": "Junior Full Stack Engineer",
        "company": "NextGen Cloud Labs",
        "location": "San Francisco, CA / Remote",
        "remote_type": "Remote",
        "experience_level": "Entry",
        "salary_min": 75000,
        "salary_max": 95000,
        "currency": "USD",
        "source": "Curated",
        "source_url": "https://careers.nextgencloud.io/jobs/junior-fs",
        "required_skills": ["React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS", "Git"],
        "description": "We are seeking a proactive Junior Full Stack Engineer to build responsive web applications. You will work on our Next.js frontend, build scalable Node.js microservices, and design PostgreSQL schemas. Ideal for recent graduates or self-taught developers with strong project experience.",
        "requirements": "Proficiency in JavaScript/TypeScript, React or Next.js, understanding of RESTful APIs, basic SQL knowledge, and version control using Git."
    },
    {
        "external_id": "curated-002",
        "title": "AI / Machine Learning Engineer",
        "company": "DeepCognition AI",
        "location": "New York, NY / Remote",
        "remote_type": "Remote",
        "experience_level": "Mid",
        "salary_min": 120000,
        "salary_max": 160000,
        "currency": "USD",
        "source": "Curated",
        "source_url": "https://deepcognition.ai/careers/ai-engineer",
        "required_skills": ["Python", "PyTorch", "LangChain", "RAG", "FastAPI", "Vector Search", "Docker"],
        "description": "Join our AI research team deploying production Agentic AI workflows. You will build RAG pipelines, fine-tune open-source LLMs, integrate vector databases like pgvector/Pinecone, and expose high-performance endpoints via FastAPI.",
        "requirements": "Strong Python programming skills, hands-on experience with LLM frameworks (LangChain, LangGraph, LlamaIndex), PyTorch or TensorFlow, and deploying containerized applications with Docker."
    },
    {
        "external_id": "curated-003",
        "title": "Backend Python Developer",
        "company": "Apex Fintech Systems",
        "location": "Austin, TX / Remote",
        "remote_type": "Hybrid",
        "experience_level": "Mid",
        "salary_min": 110000,
        "salary_max": 145000,
        "currency": "USD",
        "source": "Curated",
        "source_url": "https://apexfintech.com/careers/backend-python",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "Microservices", "CI/CD"],
        "description": "Build high-throughput, low-latency transaction processing APIs using FastAPI and asynchronous SQLAlchemy. You will collaborate with financial data engineers and optimize relational queries.",
        "requirements": "3+ years Python experience, proficiency with FastAPI or Django, deep understanding of SQL and indexing, Redis caching, and unit testing with pytest."
    },
    {
        "external_id": "curated-004",
        "title": "Frontend React / Next.js Developer",
        "company": "Vivid Media Stream",
        "location": "Seattle, WA / Remote",
        "remote_type": "Remote",
        "experience_level": "Entry",
        "salary_min": 70000,
        "salary_max": 90000,
        "currency": "USD",
        "source": "Curated",
        "source_url": "https://vividmedia.io/jobs/frontend-dev",
        "required_skills": ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "Redux"],
        "description": "Develop visually stunning and accessible UI components for our global streaming platform. You will implement responsive layouts, optimize core web vitals, and write end-to-end tests.",
        "requirements": "Solid foundation in modern JavaScript/TypeScript, React 18+, CSS/Tailwind, and state management."
    },
    {
        "external_id": "curated-005",
        "title": "DevOps & Cloud Infrastructure Intern",
        "company": "ScaleMatrix Cloud",
        "location": "Boston, MA / Remote",
        "remote_type": "Remote",
        "experience_level": "Entry",
        "salary_min": 55000,
        "salary_max": 75000,
        "currency": "USD",
        "source": "Curated",
        "source_url": "https://scalematrix.com/jobs/devops-intern",
        "required_skills": ["Linux", "Docker", "Kubernetes", "AWS", "Bash", "GitHub Actions", "Terraform"],
        "description": "Exciting internship opportunity for students eager to master cloud engineering. You will automate CI/CD pipelines, containerize backend microservices, and monitor Kubernetes clusters.",
        "requirements": "Familiarity with Linux command line, Docker basics, Git, and eagerness to learn AWS and Terraform."
    },
    {
        "external_id": "curated-006",
        "title": "Senior AI Systems Architect",
        "company": "Autonomous Minds Inc",
        "location": "Remote",
        "remote_type": "Remote",
        "experience_level": "Senior",
        "salary_min": 160000,
        "salary_max": 210000,
        "currency": "USD",
        "source": "Curated",
        "source_url": "https://autonomousminds.ai/careers/architect",
        "required_skills": ["Python", "LangGraph", "Multi-Agent Systems", "FastAPI", "PostgreSQL", "Kubernetes", "Redis"],
        "description": "Lead the architectural design of enterprise multi-agent workflows, autonomous agents with tool-calling capabilities, and vector search indexing. Mentor junior engineers and establish AI safety protocols.",
        "requirements": "Extensive experience designing distributed systems, production LLM agent architectures, vector indexing at scale, and high-concurrency API gateways."
    },
    {
        "external_id": "curated-007",
        "title": "Data Engineer / Analytics Specialist",
        "company": "Pulse Analytics",
        "location": "Chicago, IL / Remote",
        "remote_type": "Hybrid",
        "experience_level": "Mid",
        "salary_min": 100000,
        "salary_max": 130000,
        "currency": "USD",
        "source": "Curated",
        "source_url": "https://pulseanalytics.com/careers/data-engineer",
        "required_skills": ["Python", "SQL", "PostgreSQL", "Pandas", "ETL", "Docker", "Apache Spark"],
        "description": "Construct resilient ETL data pipelines ingesting terabytes of analytics data. Optimize data warehousing in PostgreSQL, automate schema migrations, and generate real-time metrics dashboards.",
        "requirements": "Expertise in complex SQL queries, Python data tooling (Pandas, PySpark), and data modeling best practices."
    },
    {
        "external_id": "curated-008",
        "title": "Associate Software Engineer - Platform",
        "company": "HyperDrive Networks",
        "location": "Denver, CO / Remote",
        "remote_type": "Remote",
        "experience_level": "Entry",
        "salary_min": 80000,
        "salary_max": 95000,
        "currency": "USD",
        "source": "Curated",
        "source_url": "https://hyperdrivenetworks.com/jobs/assoc-se",
        "required_skills": ["Java", "Spring Boot", "SQL", "Git", "REST API", "Docker"],
        "description": "Build resilient core microservices for a fast-growing cloud networking product. Great mentorship, code review culture, and opportunities to learn modern distributed systems.",
        "requirements": "Strong fundamentals in Object-Oriented Programming (Java or C#), understanding of HTTP protocols and relational databases."
    }
]

class JobFetcherService:
    @staticmethod
    async def fetch_remoteok_jobs(limit: int = 15) -> List[Dict[str, Any]]:
        """Fetch live tech jobs from RemoteOK public JSON API."""
        jobs = []
        try:
            async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "CareerPilotAI/1.0"}) as client:
                res = await client.get(settings.REMOTEOK_API_URL)
                if res.status_code == 200:
                    data = res.json()
                    # Skip the first disclaimer item if present
                    items = data[1:] if len(data) > 1 and "legal" in str(data[0]) else data
                    for item in items[:limit]:
                        ext_id = f"remoteok-{item.get('id', item.get('slug'))}"
                        title = item.get("position", "Software Engineer")
                        company = item.get("company", "Tech Company")
                        desc = item.get("description", "")
                        # Clean html tags
                        clean_desc = re.sub(r"<[^>]+>", " ", desc).strip()
                        tags = item.get("tags", [])
                        skills = [t.title() for t in tags if len(t) < 30]

                        jobs.append({
                            "external_id": ext_id,
                            "title": title,
                            "company": company,
                            "location": item.get("location") or "Remote, Worldwide",
                            "remote_type": "Remote",
                            "experience_level": "Mid" if "senior" not in title.lower() else "Senior",
                            "salary_min": float(item.get("salary_min")) if item.get("salary_min") else None,
                            "salary_max": float(item.get("salary_max")) if item.get("salary_max") else None,
                            "currency": "USD",
                            "source": "RemoteOK",
                            "source_url": item.get("url") or f"https://remoteok.com/remote-jobs/{item.get('id')}",
                            "required_skills": skills if skills else ["Software Development", "Git"],
                            "description": clean_desc[:2500] if clean_desc else f"{title} at {company}",
                            "requirements": f"Required skills: {', '.join(skills)}"
                        })
        except Exception as e:
            print(f"[JobFetcher] RemoteOK API live fetch exception: {e}")
        return jobs

    @staticmethod
    async def fetch_arbeitnow_jobs(limit: int = 15) -> List[Dict[str, Any]]:
        """Fetch live jobs from Arbeitnow public job board API."""
        jobs = []
        try:
            async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "CareerPilotAI/1.0"}) as client:
                res = await client.get(settings.ARBEITNOW_API_URL)
                if res.status_code == 200:
                    data = res.json()
                    data_items = data.get("data", [])
                    for item in data_items[:limit]:
                        ext_id = f"arbeitnow-{item.get('slug', item.get('id'))}"
                        clean_desc = re.sub(r"<[^>]+>", " ", item.get("description", "")).strip()
                        tags = item.get("tags", [])

                        jobs.append({
                            "external_id": ext_id,
                            "title": item.get("title", "Engineer"),
                            "company": item.get("company_name", "Global Firm"),
                            "location": item.get("location", "Remote / Europe"),
                            "remote_type": "Remote" if item.get("remote") else "Hybrid",
                            "experience_level": "Entry" if "junior" in item.get("title", "").lower() else "Mid",
                            "salary_min": None,
                            "salary_max": None,
                            "currency": "EUR",
                            "source": "Arbeitnow",
                            "source_url": item.get("url"),
                            "required_skills": tags if tags else ["Software Development"],
                            "description": clean_desc[:2500] if clean_desc else item.get("title"),
                            "requirements": f"Experience with {', '.join(tags[:5])}" if tags else ""
                        })
        except Exception as e:
            print(f"[JobFetcher] Arbeitnow API live fetch exception: {e}")
        return jobs

    @classmethod
    async def sync_all_jobs(cls, db: Session, fetch_external: bool = True) -> int:
        """
        Sync jobs into database:
        1. Always ensures curated jobs exist.
        2. Optionally attempts live external fetches.
        3. Computes vector embeddings and saves all new entries.
        """
        all_jobs_to_ingest = list(CURATED_TECH_JOBS)

        if fetch_external:
            remoteok_jobs = await cls.fetch_remoteok_jobs(limit=10)
            arbeitnow_jobs = await cls.fetch_arbeitnow_jobs(limit=10)
            all_jobs_to_ingest.extend(remoteok_jobs)
            all_jobs_to_ingest.extend(arbeitnow_jobs)

        added_count = 0
        for job_data in all_jobs_to_ingest:
            ext_id = job_data.get("external_id")
            existing = db.query(Job).filter(Job.external_id == ext_id).first()
            if existing:
                continue

            # Compute semantic vector embedding
            embedding_text = f"{job_data['title']} {job_data['company']} {' '.join(job_data.get('required_skills', []))} {job_data.get('description', '')[:500]}"
            vector = embedding_service.get_embedding(embedding_text)

            new_job = Job(
                title=job_data["title"],
                company=job_data["company"],
                location=job_data.get("location", "Remote"),
                remote_type=job_data.get("remote_type", "Remote"),
                description=job_data.get("description", ""),
                requirements=job_data.get("requirements", ""),
                required_skills=job_data.get("required_skills", []),
                experience_level=job_data.get("experience_level", "Entry"),
                salary_min=job_data.get("salary_min"),
                salary_max=job_data.get("salary_max"),
                currency=job_data.get("currency", "USD"),
                source=job_data.get("source", "Curated"),
                source_url=job_data.get("source_url"),
                external_id=ext_id,
                embedding=vector,
                posted_at=datetime.now(timezone.utc)
            )
            db.add(new_job)
            added_count += 1

        if added_count > 0:
            db.commit()
            print(f"[JobFetcher] Ingested and embedded {added_count} new job postings.")

        return added_count
