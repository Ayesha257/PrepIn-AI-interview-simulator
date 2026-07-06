from fastapi import APIRouter, Depends, HTTPException
from database import db
from datetime import datetime
from bson import ObjectId
from agents.orchestrator import start_interview, orchestrate_workflow
from utils.auth import get_current_user
from schemas.session_schema import SessionCreate

router = APIRouter()

@router.post("/session")
async def create_session(
    body: SessionCreate,
    current_user: dict = Depends(get_current_user)
):
    session = {
        "user_id": current_user["_id"],
        "status": "in_progress",
        "started_at": datetime.utcnow(),
        "ended_at": None,
        "questions": [],
        "final_report_id": None,
        "target_role": body.target_role,
        "seniority_level": body.seniority_level,
    }
    result = db["sessions"].insert_one(session)
    return {"session_id": str(result.inserted_id)}

@router.get("/session/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    session = db["sessions"].find_one({"_id": ObjectId(session_id.strip())})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])
    session["user_id"] = str(session["user_id"])
    return {"session": session}

@router.post("/start")
async def start(session_id: str, current_user: dict = Depends(get_current_user)):
    result = await start_interview(session_id.strip())
    return result

@router.post("/answer")
async def answer(session_id: str, user_answer: str, current_user: dict = Depends(get_current_user)):
    result = await orchestrate_workflow(session_id.strip(), user_answer)
    return result