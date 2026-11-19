from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse, ResumeUploadResponse, ParsedResume
from app.services.resume_parser import ResumeParserService
from app.services.embedding_service import embedding_service

router = APIRouter()

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a resume file (PDF, DOCX, or TXT).
    Extracts text, parses into structured schema, generates dense embeddings,
    and stores it as the user's active resume.
    """
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit (10MB)."
        )

    # 1. Text Extraction
    raw_text = ResumeParserService.extract_text_from_bytes(content, file.filename)
    if not raw_text or len(raw_text.strip()) < 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract readable text from the uploaded document. Ensure it is not an empty or password-protected file."
        )

    # 2. Structured AI & Rule Parsing
    parsed_resume = await ResumeParserService.parse_resume(raw_text)

    # 3. Dense Semantic Vector Embedding
    embedding_text = f"{parsed_resume.summary or ''} {' '.join(parsed_resume.technical_skills)} {' '.join(parsed_resume.tools_and_frameworks)} {raw_text[:1500]}"
    vector = embedding_service.get_embedding(embedding_text)

    # 4. Deactivate previous active resumes
    db.query(Resume).filter(Resume.user_id == current_user.id).update({"is_active": False})

    # 5. Persist new Resume
    new_resume = Resume(
        user_id=current_user.id,
        file_name=file.filename,
        file_type=file.content_type or "application/octet-stream",
        raw_text=raw_text,
        parsed_json=parsed_resume.model_dump(),
        embedding=vector,
        is_active=True
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    return ResumeUploadResponse(
        message="Resume successfully uploaded, parsed, and indexed for semantic recommendations.",
        resume=ResumeResponse(
            id=new_resume.id,
            user_id=new_resume.user_id,
            file_name=new_resume.file_name,
            file_type=new_resume.file_type,
            raw_text=new_resume.raw_text,
            parsed_json=parsed_resume,
            is_active=new_resume.is_active,
            created_at=new_resume.created_at,
            updated_at=new_resume.updated_at
        )
    )

@router.get("/active", response_model=Optional[ResumeResponse])
def get_active_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the currently active parsed resume for the authenticated user."""
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.is_active == True
    ).first()

    if not resume:
        return None

    parsed_obj = ParsedResume(**resume.parsed_json) if resume.parsed_json else None
    return ResumeResponse(
        id=resume.id,
        user_id=resume.user_id,
        file_name=resume.file_name,
        file_type=resume.file_type,
        raw_text=resume.raw_text,
        parsed_json=parsed_obj,
        is_active=resume.is_active,
        created_at=resume.created_at,
        updated_at=resume.updated_at
    )

@router.get("/", response_model=List[ResumeResponse])
def list_user_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all resumes uploaded by the current user."""
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    results = []
    for r in resumes:
        p = ParsedResume(**r.parsed_json) if r.parsed_json else None
        results.append(ResumeResponse(
            id=r.id,
            user_id=r.user_id,
            file_name=r.file_name,
            file_type=r.file_type,
            raw_text=r.raw_text,
            parsed_json=p,
            is_active=r.is_active,
            created_at=r.created_at,
            updated_at=r.updated_at
        ))
    return results

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.delete(resume)
    db.commit()
    return None
