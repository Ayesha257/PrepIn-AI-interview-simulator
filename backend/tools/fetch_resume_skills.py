import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
_client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
_db = _client[os.getenv("DB_NAME", "interview_simulator")]

async def fetch_resume_skills(user_id: str) -> dict:
    try:
        doc = await _db.resumes.find_one({"user_id": user_id})
        if doc:
            return {
                "user_id": user_id,
                "skills": doc.get("skills", []),
                "experience_years": doc.get("experience_years", 0),
                "education": doc.get("education", ""),
                "job_role": doc.get("job_role", ""),
            }
        return {"user_id": user_id, "skills": [], "experience_years": 0, "education": "", "job_role": ""}
    except Exception as e:
        print(f"[fetch_resume_skills] Error: {e}")
        return {"user_id": user_id, "skills": [], "experience_years": 0, "education": "", "job_role": ""}