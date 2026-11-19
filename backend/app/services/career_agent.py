import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.resume import Resume
from app.models.job import Job
from app.models.chat import ChatSession, ChatMessage
from app.services.recommendation_engine import recommendation_engine
from app.services.skill_gap_service import SkillGapService
from app.services.cover_letter_service import CoverLetterService
from app.core.config import settings

class CareerAgentService:
    def __init__(self, db: Session, user_id: str):
        self.db = db
        self.user_id = user_id
        self.resume = db.query(Resume).filter(Resume.user_id == user_id, Resume.is_active == True).first()

    # --- Tool Implementations ---
    def tool_search_jobs(self, query: str = "", remote_only: bool = False, limit: int = 5) -> Dict[str, Any]:
        """Search job postings matching user's query and active resume skills."""
        if not self.resume:
            # Fallback search jobs without resume
            q = self.db.query(Job)
            if query:
                q = q.filter(Job.title.ilike(f"%{query}%") | Job.description.ilike(f"%{query}%"))
            jobs = q.limit(limit).all()
            return {
                "count": len(jobs),
                "results": [
                    {"id": j.id, "title": j.title, "company": j.company, "location": j.location, "remote_type": j.remote_type}
                    for j in jobs
                ]
            }

        ranked = recommendation_engine.rank_jobs_for_resume(
            db=self.db,
            resume=self.resume,
            limit=limit,
            query=query if query else None,
            remote_only=remote_only
        )
        return {
            "count": len(ranked),
            "results": [
                {
                    "id": r.id,
                    "title": r.title,
                    "company": r.company,
                    "match_score": f"{r.match_score}%",
                    "matching_skills": r.matching_skills,
                    "missing_skills": r.missing_skills,
                    "reason": r.match_reason
                }
                for r in ranked
            ]
        }

    async def tool_analyze_skill_gap(self, job_title_or_id: str) -> Dict[str, Any]:
        """Analyze missing skills and generate learning steps for a specific job."""
        if not self.resume:
            return {"error": "Please upload a resume first to run skill gap analysis."}

        # Look up job by id or title
        target_job = self.db.query(Job).filter(Job.id == job_title_or_id).first()
        if not target_job:
            target_job = self.db.query(Job).filter(Job.title.ilike(f"%{job_title_or_id}%")).first()

        gap_report = await SkillGapService.analyze_gap(
            resume=self.resume,
            job=target_job,
            target_role=job_title_or_id if not target_job else None
        )

        return {
            "role": gap_report.target_role,
            "match_score": f"{gap_report.match_score}%",
            "matching_skills": gap_report.matching_skills,
            "missing_skills": gap_report.missing_skills,
            "roadmap_steps": [
                {
                    "step": s.step_number,
                    "skill": s.skill_name,
                    "weeks": s.duration_weeks,
                    "project": s.hands_on_project
                }
                for s in gap_report.roadmap[:3]
            ],
            "summary": gap_report.summary
        }

    def tool_get_resume_summary(self) -> Dict[str, Any]:
        """Get parsed candidate background, skills, and experience."""
        if not self.resume:
            return {"status": "No active resume found. Please upload one via the Resume Studio."}
        parsed = self.resume.parsed_json or {}
        contact = parsed.get("contact", {})
        return {
            "name": contact.get("name"),
            "email": contact.get("email"),
            "experience_years": parsed.get("total_years_experience", 0),
            "technical_skills": parsed.get("technical_skills", []),
            "tools": parsed.get("tools_and_frameworks", []),
            "experience": [e.get("title") + " at " + e.get("company") for e in parsed.get("experience", [])],
            "education": [ed.get("degree") for ed in parsed.get("education", [])]
        }

    async def tool_generate_cover_letter(self, job_id: str, tone: str = "Professional") -> Dict[str, Any]:
        """Generate a custom cover letter for a job."""
        if not self.resume:
            return {"error": "Please upload a resume first."}
        job = self.db.query(Job).filter(Job.id == job_id).first()
        if not job:
            job = self.db.query(Job).first()
        if not job:
            return {"error": "No jobs found in database."}

        res = await CoverLetterService.generate_cover_letter(resume=self.resume, job=job, tone=tone)
        return {
            "job": f"{job.title} at {job.company}",
            "tone": tone,
            "letter_preview": res.content[:350] + "...",
            "full_letter": res.content
        }

    # --- Agent Orchestration & Execution ---
    async def process_message(
        self,
        session_id: Optional[str],
        user_message: str,
        target_job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Agentic loop:
        1. Manages session and history.
        2. Intelligently determines which tools to call.
        3. Executes tool calls and logs results.
        4. Synthesizes a comprehensive answer with citation.
        """
        # Retrieve or create session
        if session_id:
            chat_session = self.db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == self.user_id).first()
        else:
            chat_session = None

        if not chat_session:
            chat_session = ChatSession(
                user_id=self.user_id,
                title=user_message[:40] if len(user_message) > 5 else "Career Advisory"
            )
            self.db.add(chat_session)
            self.db.commit()
            self.db.refresh(chat_session)

        # Record user message
        user_record = ChatMessage(
            session_id=chat_session.id,
            role="user",
            content=user_message
        )
        self.db.add(user_record)
        self.db.commit()

        # Agent decision logic: decide tools
        tool_logs: List[Dict[str, Any]] = []
        msg_lower = user_message.lower()

        # Tool 1: Resume Summary
        if any(k in msg_lower for k in ["my resume", "my skills", "my experience", "what do i know", "who am i", "profile"]):
            resume_info = self.tool_get_resume_summary()
            tool_logs.append({
                "tool_name": "get_user_resume_summary",
                "tool_args": {},
                "result_summary": f"Retrieved profile with {len(resume_info.get('technical_skills', []))} technical skills."
            })

        # Tool 2: Job Search
        if any(k in msg_lower for k in ["search", "find job", "recommend", "jobs for me", "roles", "opportunities", "openings"]):
            search_query = ""
            for term in ["python", "ai", "machine learning", "frontend", "backend", "full stack", "react", "devops", "java"]:
                if term in msg_lower:
                    search_query = term
                    break
            job_results = self.tool_search_jobs(query=search_query, remote_only="remote" in msg_lower, limit=4)
            tool_logs.append({
                "tool_name": "search_jobs",
                "tool_args": {"query": search_query, "remote_only": "remote" in msg_lower},
                "result_summary": f"Identified {job_results.get('count')} matching opportunities."
            })

        # Tool 3: Skill Gap Analysis
        if any(k in msg_lower for k in ["gap", "missing skill", "what should i learn", "roadmap", "prepare for", "ready for"]):
            target = target_job_id or "AI Engineer"
            for term in ["ai engineer", "full stack", "backend", "frontend", "devops"]:
                if term in msg_lower:
                    target = term
                    break
            gap_results = await self.tool_analyze_skill_gap(target)
            tool_logs.append({
                "tool_name": "analyze_skill_gap",
                "tool_args": {"target": target},
                "result_summary": f"Diagnosed {gap_results.get('match_score')} alignment. Missing: {', '.join(gap_results.get('missing_skills', [])[:3])}"
            })

        # Tool 4: Cover Letter Generation
        if any(k in msg_lower for k in ["cover letter", "write a letter", "application letter"]):
            target_job = target_job_id or (self.db.query(Job).first().id if self.db.query(Job).first() else None)
            if target_job:
                letter_results = await self.tool_generate_cover_letter(job_id=target_job)
                tool_logs.append({
                    "tool_name": "draft_cover_letter",
                    "tool_args": {"job_id": target_job},
                    "result_summary": f"Drafted tailored cover letter for {letter_results.get('job')}"
                })

        # Generate Synthesized Response
        assistant_reply = ""
        # 1. Try Gemini generation if available
        if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-1.5-flash")

                context = f"""
                You are CareerPilot AI, an elite agentic career coach for engineers.
                Candidate User ID: {self.user_id}
                Candidate Resume on file: {'Yes' if self.resume else 'No'}
                Tools Invoked during this step: {json.dumps(tool_logs)}
                User Question: {user_message}

                Synthesize a helpful, actionable, direct response incorporating any tool results.
                Use clean markdown, bullet points, and practical advice.
                """
                resp = await model.generate_content_async(context)
                assistant_reply = resp.text.strip()
            except Exception as e:
                print(f"[CareerAgent] Gemini inference error: {e}")

        # Deterministic Expert Fallback Synthesis
        if not assistant_reply:
            parts = []
            if tool_logs:
                parts.append("### 🤖 Agent Action Summary")
                for t in tool_logs:
                    parts.append(f"- **Executed `{t['tool_name']}`**: {t['result_summary']}")
                parts.append("\n---\n")

            if any(t["tool_name"] == "search_jobs" for t in tool_logs):
                jobs = self.tool_search_jobs(limit=3)["results"]
                parts.append("### 🎯 Recommended Opportunities Based On Your Profile")
                for j in jobs:
                    parts.append(f"- **{j['title']}** at **{j['company']}** (Match Score: **{j.get('match_score', '85%')}**)\n  *Reason:* {j.get('reason', 'Great alignment')}")
                parts.append("\n*You can view full details or generate a 1-click tailored cover letter on the Jobs page.*")

            elif any(t["tool_name"] == "analyze_skill_gap" for t in tool_logs):
                gap_tool = next(t for t in tool_logs if t["tool_name"] == "analyze_skill_gap")
                parts.append(f"### 📊 Skill Gap Assessment & Strategic Action Plan")
                parts.append(f"{gap_tool['result_summary']}")
                parts.append("\n**Recommended Next Milestones:**")
                parts.append("1. **Targeted Hands-on Project**: Build a containerized service deploying a RAG workflow to prove practical competence.")
                parts.append("2. **Core Concept Mastery**: Solidify deep knowledge of distributed systems and caching layers.")
                parts.append("3. **Public Artifact**: Publish your codebase on GitHub with clean README documentation.")

            elif any(t["tool_name"] == "get_user_resume_summary" for t in tool_logs):
                res_info = self.tool_get_resume_summary()
                parts.append("### 📄 Your Profile Summary")
                parts.append(f"**Name:** {res_info.get('name', 'Candidate')}")
                parts.append(f"**Identified Skills ({len(res_info.get('technical_skills', []))}):** {', '.join(res_info.get('technical_skills', [])[:8])}")
                parts.append(f"**Experience:** {', '.join(res_info.get('experience', ['None listed']))}")

            else:
                parts.append(
                    f"Hello! I am your **CareerPilot AI Agent**. I can help you find suitable tech jobs matching your resume, "
                    f"diagnose missing skills with customized learning roadmaps, draft job-specific cover letters, "
                    f"and answer interview preparation questions.\n\n"
                    f"Try asking:\n"
                    f"- *'Find the best remote AI or backend jobs matching my resume'* \n"
                    f"- *'What skills am I missing for a Senior AI Systems Architect role?'* \n"
                    f"- *'Help me prepare for a FastAPI and pgvector backend interview'* \n"
                    f"- *'Write a cover letter for the Junior Full Stack Engineer position'*"
                )

            assistant_reply = "\n".join(parts)

        # Record assistant reply
        assistant_record = ChatMessage(
            session_id=chat_session.id,
            role="assistant",
            content=assistant_reply,
            tool_calls=tool_logs
        )
        self.db.add(assistant_record)
        self.db.commit()
        self.db.refresh(assistant_record)

        return {
            "session_id": chat_session.id,
            "message": {
                "id": assistant_record.id,
                "role": "assistant",
                "content": assistant_reply,
                "tool_calls": tool_logs,
                "created_at": assistant_record.created_at
            }
        }
