from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Report(BaseModel):
    report_id : Optional[str] = None
    session_id : str
    user_id : str
    questions : list 
    total_score : float
    strengths : list = []
    weak_areas : list = []
    suggestions: list = []
    created_at : datetime = datetime.utcnow()