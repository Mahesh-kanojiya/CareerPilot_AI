from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ChatPromptRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    target_job_id: Optional[str] = None

class ToolCallLog(BaseModel):
    tool_name: str
    tool_args: Dict[str, Any]
    result_summary: str

class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)
