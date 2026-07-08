from pydantic import BaseModel
from enum import Enum
from typing import Optional
from datetime import datetime

class StatusEnum(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class Session(BaseModel):
    session_id : Optional[str] = None
    user_id : str
    status : StatusEnum = StatusEnum.IN_PROGRESS
    started_at : datetime = datetime.utcnow()
    ended_at : Optional[datetime] = None
    questions : list = []
    final_report_id : Optional[str] = None

class SessionCreate(BaseModel):
    target_role: Optional[str] = None
    seniority_level: Optional[str] = None

