from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from bson import ObjectId
from bson import ObjectId
from utils.auth import get_current_user

router = APIRouter()

@router.get("/report/{session_id}")
@router.get("/report/{session_id}")
async def get_final_report(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()

    report = await db.reports.find_one({"session_id": session_id})

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report["_id"] = str(report["_id"])
    report["user_id"] = str(report["user_id"])

    session = await db.sessions.find_one({"_id": ObjectId(session_id)})

    if session:
        report["questions"] = session.get("questions", [])

    return {"report": report}

@router.get("/latest")
async def get_latest_report(current_user: dict = Depends(get_current_user)):
    db = get_db()

    report = await db.reports.find_one(
        {"user_id": current_user["_id"]},
        sort=[("created_at", -1)]
    )

    if not report:
        raise HTTPException(status_code=404, detail="No reports found")

    report["_id"] = str(report["_id"])
    report["user_id"] = str(report["user_id"])

    return {"report": report}