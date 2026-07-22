from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from database import db
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from agents.orchestrator import start_interview, orchestrate_workflow
from utils.auth import get_current_user, assert_owner
from schemas.session_schema import SessionCreate

router = APIRouter()


class AnswerBody(BaseModel):
    session_id: str = Field(..., min_length=1)
    user_answer: str = Field(..., min_length=1, max_length=20000)


class SessionIdBody(BaseModel):
    session_id: str = Field(..., min_length=1)


def _parse_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value.strip())
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid session ID")


def _get_owned_session(session_id: str, current_user: dict) -> dict:
    session = db["sessions"].find_one({"_id": _parse_object_id(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    assert_owner(session.get("user_id"), current_user)
    return session


@router.post("/session")
async def create_session(
    body: SessionCreate,
    current_user: dict = Depends(get_current_user),
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
    result = db.sessions.insert_one(session)
    return {"session_id": str(result.inserted_id)}


@router.get("/session/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    session = _get_owned_session(session_id, current_user)
    session["_id"] = str(session["_id"])
    session["user_id"] = str(session["user_id"])
    return {"session": session}


@router.post("/start")
async def start(body: SessionIdBody, current_user: dict = Depends(get_current_user)):
    _get_owned_session(body.session_id, current_user)
    return await start_interview(body.session_id.strip())


@router.post("/answer")
async def answer(body: AnswerBody, current_user: dict = Depends(get_current_user)):
    _get_owned_session(body.session_id, current_user)
    return await orchestrate_workflow(body.session_id.strip(), body.user_answer)
