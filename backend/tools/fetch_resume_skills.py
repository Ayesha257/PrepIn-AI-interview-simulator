from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from config import settings

_client = AsyncIOMotorClient(settings.MONGO_URL)
_db = _client[settings.DB_NAME]


async def fetch_resume_skills(user_id: str) -> dict:
    try:
        doc = await _db.resumes.find_one(
            {"user_id": ObjectId(user_id)},
            sort=[("uploaded_at", -1)],
        )
        if doc:
            return {
                "user_id": user_id,
                "skills": doc.get("skills", []),
                "experience_years": doc.get("experience_years", 0),
                "education": doc.get("education", ""),
                "job_role": doc.get("job_role", ""),
            }
        return {"user_id": user_id, "skills": [], "experience_years": 0, "education": "", "job_role": ""}
    except Exception:
        return {"user_id": user_id, "skills": [], "experience_years": 0, "education": "", "job_role": ""}
