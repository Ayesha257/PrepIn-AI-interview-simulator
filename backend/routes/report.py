from fastapi import APIRouter, Depends
from database import db
from datetime import datetime
from schemas.report_schema import Report
from utils.auth import get_current_user

router = APIRouter()

@router.post("/report")
async def create_final_report(report: Report, current_user: dict = Depends(get_current_user)):
    report_dict = report.model_dump()
    report_dict["user_id"] = str(current_user["_id"])
    result = db["reports"].insert_one(report_dict)
    return {"report_id": str(result.inserted_id)}