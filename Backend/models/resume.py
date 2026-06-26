from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ResumeInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    filename: str
    file_path: str
    file_size: int
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    # Populated after resume agent parses it (Week 3)
    parsed_skills: Optional[List[str]] = None
    parsed_experience: Optional[str] = None
    parsed_education: Optional[str] = None
    raw_text: Optional[str] = None
    is_parsed: bool = False

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


class ResumeResponse(BaseModel):
    id: str
    filename: str
    uploaded_at: datetime
    file_size: int
    is_parsed: bool
    parsed_skills: Optional[List[str]] = None