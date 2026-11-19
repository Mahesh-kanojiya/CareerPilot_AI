import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.skill_gap import SkillGapResponse, RoadmapStep, LearningResource
from app.core.config import settings

# Curated skill curriculum knowledge base for instant high-quality roadmap synthesis
SKILL_CURRICULUM_MAP = {
    "docker": {
        "topics": ["Containerization fundamentals", "Dockerfile instructions & caching", "Multi-stage builds", "Docker Compose multi-service orchestration", "Volume mounts & networking"],
        "project": "Containerize a full-stack Next.js + FastAPI + PostgreSQL application with multi-stage production Dockerfiles and healthchecks.",
        "resources": [
            {"title": "Docker Official Deep Dive Documentation", "type": "Documentation", "url": "https://docs.docker.com/get-started/", "estimated_hours": 8},
            {"title": "Containers from the Ground Up", "type": "Tutorial", "url": "https://developer.ibm.com/articles/containers-101/", "estimated_hours": 6}
        ],
        "weeks": 2
    },
    "kubernetes": {
        "topics": ["Pods, Deployments, and ReplicaSets", "Cluster networking & Services (ClusterIP, NodePort, Ingress)", "ConfigMaps & Secrets", "PersistentVolumes", "Helm charts"],
        "project": "Deploy a microservices architecture to a local Minikube/Kind cluster with Ingress routing and automated rolling updates.",
        "resources": [
            {"title": "Kubernetes Official Interactive Tutorials", "type": "Documentation", "url": "https://kubernetes.io/docs/tutorials/", "estimated_hours": 12},
            {"title": "Kubernetes by Example", "type": "Tutorial", "url": "https://kubernetesbyexample.com/", "estimated_hours": 10}
        ],
        "weeks": 3
    },
    "langchain": {
        "topics": ["Prompts & Output Parsers", "Chains & LCEL (LangChain Expression Language)", "Vector stores & pgvector embeddings", "RAG retrieval architectures", "Agents & Tool Calling"],
        "project": "Build an intelligent Q&A system that extracts data from company PDF handbooks with pgvector hybrid search and citation generation.",
        "resources": [
            {"title": "LangChain Official Python Handbook", "type": "Documentation", "url": "https://python.langchain.com/docs/get_started/introduction", "estimated_hours": 10},
            {"title": "DeepLearning.AI: LangChain for LLM App Development", "type": "Course", "url": "https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/", "estimated_hours": 5}
        ],
        "weeks": 2
    },
    "langgraph": {
        "topics": ["StateGraph concepts & channels", "Cyclical execution & conditional branching", "Agent persistence & checkpoints", "Human-in-the-loop workflows", "Multi-agent coordination"],
        "project": "Build an autonomous code-review agent that pulls git diffs, runs static linting, calls a model to review logic, and loops until tests pass.",
        "resources": [
            {"title": "LangGraph Core Architecture Docs", "type": "Documentation", "url": "https://langchain-ai.github.io/langgraph/", "estimated_hours": 8}
        ],
        "weeks": 2
    },
    "rag": {
        "topics": ["Chunking strategies (sliding window, semantic chunking)", "Dense embeddings vs sparse retrieval", "Vector indexing (HNSW, IVFFlat)", "Reranking with Cross-Encoders", "Hallucination mitigation"],
        "project": "Implement an end-to-end RAG pipeline evaluating chunk sizes and comparing Precision@K with and without a Cohere reranker.",
        "resources": [
            {"title": "Building Production RAG Systems", "type": "Tutorial", "url": "https://www.pinecone.io/learn/retrieval-augmented-generation/", "estimated_hours": 8}
        ],
        "weeks": 2
    },
    "fastapi": {
        "topics": ["Path and query parameters with Pydantic", "Dependency Injection system", "Async request handling & ASGI", "SQLAlchemy 2.0 async sessions", "JWT authentication & OAuth2"],
        "project": "Develop a production REST API with role-based access control (RBAC), background worker tasks, and automated OpenAPI documentation.",
        "resources": [
            {"title": "FastAPI Official Tutorial", "type": "Documentation", "url": "https://fastapi.tiangolo.com/tutorial/", "estimated_hours": 10}
        ],
        "weeks": 2
    },
    "react": {
        "topics": ["Hooks deep-dive (useState, useEffect, useMemo, useCallback)", "Custom hooks", "Context API & Zustand", "Virtual DOM & reconciliation", "Tailwind CSS styling"],
        "project": "Create a real-time collaborative task board with drag-and-drop, optimistic UI updates, and dark mode toggling.",
        "resources": [
            {"title": "React.dev Interactive Documentation", "type": "Documentation", "url": "https://react.dev/learn", "estimated_hours": 12}
        ],
        "weeks": 2
    },
    "next.js": {
        "topics": ["App Router vs Pages Router", "Server Components vs Client Components", "Server Actions & API routes", "Streaming with Suspense", "Static Site Generation (SSG) & ISR"],
        "project": "Build an e-commerce storefront with server-side rendered product catalogs, dynamic caching, and instant checkout actions.",
        "resources": [
            {"title": "Next.js Learn Dashboard Tutorial", "type": "Documentation", "url": "https://nextjs.org/learn", "estimated_hours": 10}
        ],
        "weeks": 2
    },
    "postgresql": {
        "topics": ["Relational normalization & foreign keys", "B-tree and GiST indexing", "EXPLAIN ANALYZE query planning", "Transactions, ACID & locks", "pgvector extension for vectors"],
        "project": "Design a high-volume financial ledger schema with strict foreign keys, trigger-based audit logs, and optimized index performance.",
        "resources": [
            {"title": "PostgreSQL Tutorial for Developers", "type": "Documentation", "url": "https://www.postgresqltutorial.com/", "estimated_hours": 12}
        ],
        "weeks": 2
    },
    "typescript": {
        "topics": ["Union & intersection types", "Generics and type constraints", "Utility types (Partial, Pick, Omit)", "Type narrowing & discriminating unions", "Declaration files (.d.ts)"],
        "project": "Build a type-safe generic API client library with complete request/response type inference.",
        "resources": [
            {"title": "TypeScript Handbook", "type": "Documentation", "url": "https://www.typescriptlang.org/docs/handbook/intro.html", "estimated_hours": 8}
        ],
        "weeks": 1
    }
}

class SkillGapService:
    @classmethod
    async def analyze_gap(
        cls,
        resume: Resume,
        job: Optional[Job] = None,
        target_role: Optional[str] = None
    ) -> SkillGapResponse:
        """
        Analyzes the technical and conceptual delta between candidate's resume
        and the target job or role, generating an actionable learning roadmap.
        """
        parsed = resume.parsed_json or {}
        user_skills = set(s.lower().strip() for s in parsed.get("technical_skills", []) + parsed.get("tools_and_frameworks", []))

        # Target skills
        required_skills: List[str] = []
        role_title = target_role or "Software Engineer"
        if job:
            required_skills = job.required_skills or []
            role_title = f"{job.title} at {job.company}"
        elif target_role:
            role_lower = target_role.lower()
            if "ai" in role_lower or "ml" in role_lower:
                required_skills = ["Python", "PyTorch", "LangChain", "RAG", "FastAPI", "Docker", "Vector Search"]
            elif "frontend" in role_lower or "react" in role_lower:
                required_skills = ["React", "TypeScript", "Next.js", "Tailwind CSS", "Git", "REST API"]
            elif "devops" in role_lower or "cloud" in role_lower:
                required_skills = ["Linux", "Docker", "Kubernetes", "AWS", "GitHub Actions", "Terraform"]
            else:
                required_skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "Git", "REST API"]

        matching: List[str] = []
        missing: List[str] = []

        for req in required_skills:
            req_clean = req.lower().strip()
            if any(req_clean == u or req_clean in u or u in req_clean for u in user_skills):
                matching.append(req)
            else:
                missing.append(req)

        match_score = round((len(matching) / len(required_skills) * 100) if required_skills else 100.0, 1)

        # 1. Try Gemini generation if available
        if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10 and missing:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-1.5-flash")

                prompt = f"""
                You are a senior tech career coach.
                Candidate currently knows: {', '.join(user_skills)}
                Candidate wants to qualify for: {role_title}
                Identified Missing Skills: {', '.join(missing)}

                Generate a structured JSON learning roadmap with steps to master these missing skills.
                Respond ONLY with JSON matching:
                {{
                    "summary": "1-2 sentence executive assessment of their skill readiness",
                    "steps": [
                        {{
                            "step_number": 1,
                            "skill_name": "Skill Name",
                            "importance": "Critical",
                            "duration_weeks": 2,
                            "description": "Why this skill matters for this role",
                            "key_topics": ["Topic 1", "Topic 2", "Topic 3"],
                            "hands_on_project": "Concrete real-world project to build and publish",
                            "resources": [
                                {{
                                    "title": "Resource title",
                                    "type": "Documentation",
                                    "url": "https://...",
                                    "estimated_hours": 10
                                }}
                            ]
                        }}
                    ]
                }}
                """
                response = await model.generate_content_async(prompt)
                resp_text = response.text.strip()
                if resp_text.startswith("```json"):
                    resp_text = resp_text[7:]
                if resp_text.startswith("```"):
                    resp_text = resp_text[3:]
                if resp_text.endswith("```"):
                    resp_text = resp_text[:-3]

                data = json.loads(resp_text.strip())
                roadmap_steps = []
                for s in data.get("steps", []):
                    resources = [LearningResource(**r) for r in s.get("resources", [])]
                    roadmap_steps.append(RoadmapStep(
                        step_number=s.get("step_number", len(roadmap_steps) + 1),
                        skill_name=s.get("skill_name", "Technology"),
                        importance=s.get("importance", "Recommended"),
                        duration_weeks=s.get("duration_weeks", 2),
                        description=s.get("description", ""),
                        key_topics=s.get("key_topics", []),
                        hands_on_project=s.get("hands_on_project", "Build a capstone project."),
                        resources=resources
                    ))

                return SkillGapResponse(
                    user_id=resume.user_id,
                    job_id=job.id if job else None,
                    target_role=role_title,
                    match_score=match_score,
                    matching_skills=matching,
                    missing_skills=missing,
                    summary=data.get("summary", f"You have strong foundations with {len(matching)} skills matched. Bridging {len(missing)} areas will make you a standout candidate."),
                    roadmap=roadmap_steps
                )
            except Exception as e:
                print(f"[SkillGapService] Gemini API fallback: {e}")

        # Rule-based fallback synthesis
        roadmap_steps: List[RoadmapStep] = []
        for idx, skill in enumerate(missing, start=1):
            s_clean = skill.lower().replace(".", "").replace(" ", "")
            # Find closest match in curriculum
            curriculum = None
            for key, val in SKILL_CURRICULUM_MAP.items():
                if key in s_clean or s_clean in key:
                    curriculum = val
                    break
            
            if curriculum:
                topics = curriculum["topics"]
                project = curriculum["project"]
                weeks = curriculum["weeks"]
                res_objs = [LearningResource(**r) for r in curriculum["resources"]]
            else:
                topics = [f"Core syntax and paradigms of {skill}", f"Production architectural patterns in {skill}", f"Integration with backend databases and CI/CD"]
                project = f"Build and deploy an open-source reference project showcasing production use of {skill} with comprehensive unit tests."
                weeks = 2
                res_objs = [
                    LearningResource(title=f"Official {skill} Documentation", type="Documentation", url=f"https://www.google.com/search?q={skill}+official+docs", estimated_hours=10),
                    LearningResource(title=f"Full Practical {skill} Crash Course", type="Tutorial", url=f"https://www.google.com/search?q={skill}+tutorial", estimated_hours=8)
                ]

            roadmap_steps.append(RoadmapStep(
                step_number=idx,
                skill_name=skill,
                importance="Critical" if idx <= 2 else "Recommended",
                duration_weeks=weeks,
                description=f"Master {skill} to bridge requirements for {role_title}.",
                key_topics=topics,
                hands_on_project=project,
                resources=res_objs
            ))

        summary = (
            f"You have a solid {match_score}% capability match for {role_title}. "
            f"You possess {len(matching)} key competencies ({', '.join(matching[:3])}). "
            f"By mastering {len(missing)} skill areas ({', '.join(missing[:3])}) over an estimated "
            f"{sum(s.duration_weeks for s in roadmap_steps)} weeks, you will be exceptionally competitive."
        ) if missing else f"Outstanding alignment! You possess 100% of the core competencies required for {role_title}."

        return SkillGapResponse(
            user_id=resume.user_id,
            job_id=job.id if job else None,
            target_role=role_title,
            match_score=match_score,
            matching_skills=matching,
            missing_skills=missing,
            summary=summary,
            roadmap=roadmap_steps
        )
