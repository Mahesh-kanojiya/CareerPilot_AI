from typing import Optional
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.skill_gap import CoverLetterResponse
from app.core.config import settings

class CoverLetterService:
    @classmethod
    async def generate_cover_letter(
        cls,
        resume: Resume,
        job: Job,
        tone: str = "Professional",
        custom_instructions: Optional[str] = None
    ) -> CoverLetterResponse:
        """
        Generates a tailored, persuasive cover letter matching candidate's
        concrete achievements to the specific requirements of the job.
        """
        parsed = resume.parsed_json or {}
        contact = parsed.get("contact", {})
        candidate_name = contact.get("name") or "Candidate"
        candidate_skills = ", ".join(parsed.get("technical_skills", [])[:6])
        experiences = parsed.get("experience", [])
        top_exp = experiences[0] if experiences else None
        top_role = top_exp.get("title", "Software Engineer") if top_exp else "Software Engineer"
        top_company = top_exp.get("company", "Tech Org") if top_exp else "Previous Tech Role"
        projects = parsed.get("projects", [])
        top_project = projects[0].get("name") if projects else "cloud application development"

        # 1. Try Gemini generation if configured
        if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-1.5-flash")

                prompt = f"""
                You are a world-class executive career coach and technical writer.
                Write a compelling, tailored cover letter for:
                Candidate Name: {candidate_name}
                Target Job: {job.title}
                Target Company: {job.company}
                Job Requirements/Description: {job.description[:1200]}
                Job Skills Needed: {', '.join(job.required_skills or [])}

                Candidate's Resume Highlights:
                - Technical Skills: {candidate_skills}
                - Most Recent Role: {top_role} at {top_company}
                - Key Project: {top_project}
                - Full Background Summary: {parsed.get('summary', '')}

                Tone requested: {tone}
                Additional Instructions: {custom_instructions or 'Focus on impact, engineering excellence, and problem-solving.'}

                Format requirements:
                - Output standard professional cover letter structure (Salutation, Hook, Core Value Pitch, Project/Impact alignment, Closing Call to Action, Sign-off).
                - Do not use generic cliches. Emphasize actual engineering fit and measurable enthusiasm.
                - Return ONLY the final letter text.
                """
                response = await model.generate_content_async(prompt)
                letter_content = response.text.strip()
                return CoverLetterResponse(
                    user_id=resume.user_id,
                    job_id=job.id,
                    job_title=job.title,
                    company=job.company,
                    tone=tone,
                    content=letter_content
                )
            except Exception as e:
                print(f"[CoverLetterService] Gemini fallback: {e}")

        # Deterministic High-Impact Template Fallback
        salutation = f"Dear Hiring Team at {job.company},"
        hook = (
            f"I am writing to express my strong interest in the {job.title} role at {job.company}. "
            f"With a strong technical foundation in {candidate_skills} and proven experience developing "
            f"resilient software systems, I am excited about the opportunity to contribute directly to "
            f"your engineering objectives."
        )
        body1 = (
            f"In my work as a {top_role} at {top_company}, I developed a deep appreciation for scalable architecture, "
            f"clean maintainable code, and collaborative agile engineering. Most recently, working on {top_project}, "
            f"I tackled complex requirements similar to those outlined in your posting for {job.company}."
        )
        body2 = (
            f"Reviewing the requirements for {job.title}, I was particularly drawn to your focus on "
            f"{', '.join(job.required_skills[:3]) if job.required_skills else 'high-performance systems'}. "
            f"My technical background and analytical problem-solving skills allow me to ramp up rapidly, "
            f"deliver immediate velocity to your sprint goals, and build reliable production features."
        )
        closing = (
            f"I would welcome the opportunity to discuss how my technical skills and enthusiasm for "
            f"{job.company}'s mission make me an excellent fit for the {job.title} team. "
            f"Thank you for your time and consideration."
        )
        signoff = f"Sincerely,\n{candidate_name}"

        full_letter = f"{salutation}\n\n{hook}\n\n{body1}\n\n{body2}\n\n{closing}\n\n{signoff}"

        return CoverLetterResponse(
            user_id=resume.user_id,
            job_id=job.id,
            job_title=job.title,
            company=job.company,
            tone=tone,
            content=full_letter
        )
