from fastapi import APIRouter
from database import db
from datetime import datetime
from schemas.report_schema import Report

router = APIRouter()

@router.post("/report")
def create_final_report(report : Report):

    report_dict = report.model_dump()
    result = db["reports"].insert_one(report_dict)
    return {"report_id" : str(result.inserted_id)}
