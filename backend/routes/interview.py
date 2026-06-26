from fastapi import APIRouter
from database import db
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.post("/session")
def post_session(user_id : str):
    session = {"user_id" : user_id,
               "status" : "in_progress",
               "started_at" : datetime.utcnow(),
               "ended_at" : None,
               "questions" : [],
               "final_report_id" : None}
    result = db["sessions"].insert_one(session)
    return {"session_id" : str(result.inserted_id)}

@router.get("/session/{session_id}")
def get_session(session_id : str):
    session = db["sessions"].find_one(ObjectId(session_id))
    session["_id"] = str(session["_id"])
    return {"session" : session}