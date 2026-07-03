from fastapi import APIRouter, Depends
from database import db
from datetime import datetime
from bson import ObjectId
from agents.orchestrator import start_interview, orchestrate_workflow
from utils.auth import get_current_user
from fastapi import HTTPException

router = APIRouter()

@router.post("/session")
async def create_session(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    session = {
        "user_id": current_user["_id"],  # store as ObjectId to match resume
        "status": "in_progress",
        "started_at": datetime.utcnow(),
        "ended_at": None,
        "questions": [],
        "final_report_id": None
    }
    result = db["sessions"].insert_one(session)
    return {"session_id": str(result.inserted_id)}

@router.get("/session/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one({"_id": ObjectId(session_id.strip())})
    session = db["sessions"].find_one(ObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Convert ObjectId fields to strings before returning
    session["_id"] = str(session["_id"])
    session["user_id"] = str(session["user_id"])
    return {"session": session}
    session["user_id"] = str(session["user_id"])
    if session.get("resume_id"):
        session["resume_id"] = str(session["resume_id"])

    return session

# @router.patch("/session/{session_id}")
# async def update_session(session_id: str, question: str, answer: str, score: str, feedback: str, current_user: dict = Depends(get_current_user)):
#     question_data = {"question": question, "answer": answer, "score": score, "feedback": feedback}
#     db["sessions"].update_one(
#         {"_id": ObjectId(session_id)},
#         {"$push": {"questions": question_data}}
#     )
#     return {"message": "session updated successfully!"}

@router.post("/start")
async def start(session_id: str, current_user: dict = Depends(get_current_user)):
    result = await start_interview(session_id.strip())
    return result

@router.post("/answer")
async def answer(session_id: str, user_answer: str, current_user: dict = Depends(get_current_user)):
    result = await orchestrate_workflow(session_id.strip(), user_answer)
    return result