from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ParsedSkill(BaseModel):
    skill: str
    level: str  # beginner | intermediate | advanced
    years: Optional[int] = None

class ResumeResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    uploaded_at: datetime
    is_parsed: bool
    status: str
    parsed_skills: List[ParsedSkill] = []

class ResumeListResponse(BaseModel):
    resumes: List[ResumeResponse]
    total: int