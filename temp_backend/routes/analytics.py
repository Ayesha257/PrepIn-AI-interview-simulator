from fastapi import APIRouter, Depends
from database import get_db
from utils.auth import get_current_user

router = APIRouter()

# ──────────────────────────────
# GET /api/analytics/dashboard
# ──────────────────────────────
@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Returns aggregate stats for the user's dashboard."""
    db = get_db()
    user_id = current_user["_id"]

    # Resume count
    resume_count = await db.resumes.count_documents({"user_id": user_id})

    # Session stats (Faiqa's collection — we only READ)
    total_sessions = await db.sessions.count_documents({"user_id": user_id})
    completed_sessions = await db.sessions.count_documents(
        {"user_id": user_id, "status": "completed"}
    )

    # Average score across all completed sessions
    pipeline = [
        {"$match": {"user_id": user_id, "status": "completed"}},
        {"$unwind": "$turns"},
        {"$group": {"_id": None, "avg_score": {"$avg": "$turns.score"}}},
    ]
    result = await db.sessions.aggregate(pipeline).to_list(1)
    avg_score = round(result[0]["avg_score"], 2) if result else None

    return {
        "resume_count": resume_count,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "avg_score": avg_score,
        "interview_count": current_user.get("profile", {}).get("interview_count", 0),
    }

# ──────────────────────────────
# GET /api/analytics/history
# ──────────────────────────────
@router.get("/history")
async def get_session_history(current_user: dict = Depends(get_current_user)):
    """Returns last 10 sessions with score summaries."""
    db = get_db()
    cursor = db.sessions.find(
        {"user_id": current_user["_id"]},
        {"turns": 0}  # exclude full turns for performance
    ).sort("started_at", -1).limit(10)

    sessions = await cursor.to_list(10)
    return {
        "sessions": [
            {
                "id": str(s["_id"]),
                "started_at": s.get("started_at"),
                "ended_at": s.get("ended_at"),
                "status": s.get("status"),
                "current_difficulty": s.get("current_difficulty"),
            }
            for s in sessions
        ]
    }