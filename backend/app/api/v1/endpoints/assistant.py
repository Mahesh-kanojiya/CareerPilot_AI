from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatPromptRequest, ChatMessageResponse, ChatSessionResponse
from app.services.career_agent import CareerAgentService

router = APIRouter()

@router.post("/chat")
async def chat_with_assistant(
    prompt_in: ChatPromptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Interact with CareerPilot AI Agent.
    Executes autonomous tool calling (search jobs, skill gap, resume lookup, cover letter)
    and maintains conversation state.
    """
    agent = CareerAgentService(db=db, user_id=current_user.id)
    response = await agent.process_message(
        session_id=prompt_in.session_id,
        user_message=prompt_in.message,
        target_job_id=prompt_in.target_job_id
    )
    return response

@router.get("/sessions", response_model=List[dict])
def list_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all previous conversation sessions for user."""
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).all()

    return [
        {
            "id": s.id,
            "title": s.title,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "message_count": len(s.messages)
        }
        for s in sessions
    ]

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_session_history(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete message transcript for a chat session."""
    session_record = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session_record:
        raise HTTPException(status_code=404, detail="Chat session not found")

    return ChatSessionResponse(
        id=session_record.id,
        title=session_record.title,
        created_at=session_record.created_at,
        updated_at=session_record.updated_at,
        messages=[ChatMessageResponse.model_validate(m) for m in session_record.messages]
    )
