import sys
import os
from agents.evaluator_agent import run_evaluator_agent
from agents.interviewer_agent import generate_question
from agents.report_agent import run_report_agent
from tools.fetch_resume_skills import fetch_resume_skills
from tools.update_difficulty import update_difficulty
from database import db
from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException

MIN_QUESTIONS = 5
MAX_QUESTIONS = 10
CONSECUTIVE_LOW_THRESHOLD = 3
LOW_SCORE_CUTOFF = 4.0
HIGH_SCORE_CUTOFF = 7.0

def should_end_interview(questions: list, question_count: int) -> tuple[bool, str]:
    if question_count < MIN_QUESTIONS:
        return False, ""
    
    if question_count >= MAX_QUESTIONS:
        return True, "max_reached"
    
    # Check last 3 consecutive low scores
    answered = [q for q in questions if q.get("score") is not None]
    if len(answered) >= CONSECUTIVE_LOW_THRESHOLD:
        last_three = answered[-CONSECUTIVE_LOW_THRESHOLD:]
        if all(q["score"] < LOW_SCORE_CUTOFF for q in last_three):
            return True, "struggling"
    
    # Check if consistently performing well
    if len(answered) >= MIN_QUESTIONS:
        recent_scores = [q["score"] for q in answered[-MIN_QUESTIONS:] if q.get("score") is not None]
        if recent_scores and sum(recent_scores) / len(recent_scores) >= HIGH_SCORE_CUTOFF:
            return True, "performing_well"
    
    return False, ""

async def orchestrate_workflow(session_id : str, user_answer : str):
    session = db["sessions"].find_one(ObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])

    target_role = session.get("target_role")
    seniority_level = session.get("seniority_level")

    if not target_role or not seniority_level:
        raise HTTPException(status_code=400, detail="Please provide target role and seniority level before starting.")

    questions = session["questions"]
    previous_questions = [q["question"] for q in questions]
    last_question = previous_questions[-1] if previous_questions else ""
    question_count = len(questions)

    evaluation = run_evaluator_agent(session_id, question_count, last_question, user_answer, seniority_level)

    score = evaluation["score"]
    feedback = evaluation["feedback"]
    signal = evaluation["signal"]

    # FIX: update the existing last question entry instead of pushing a duplicate
    db["sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            f"questions.{question_count - 1}.answer": user_answer,
            f"questions.{question_count - 1}.score": score,
            f"questions.{question_count - 1}.feedback": feedback,
        }}
    )
    
    should_end, reason = should_end_interview(session["questions"], question_count)
    
    if should_end:
        session = db["sessions"].find_one(ObjectId(session_id))
        questions = session.get("questions", [])
        scores = [q["score"] for q in questions if q.get("score") is not None]
        overall_score = round(sum(scores) / len(scores), 2) if scores else 0.0
        report_data = run_report_agent(session)
        
        report_doc = {
        "session_id": session_id,
        "user_id": session["user_id"],
        "overall_score": overall_score,
        "target_role": session.get("target_role"),
        "seniority_level": session.get("seniority_level"),
        "strengths": report_data["strengths"],
        "weak_areas": report_data["weak_areas"],
        "suggestions": report_data["suggestions"],
        "summary": report_data["summary"],
        "end_reason": reason,
        "created_at": datetime.utcnow()
        }
        
        report_result = db["reports"].insert_one(report_doc)
        report_id = str(report_result.inserted_id)
        
        db["sessions"].update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"status": "completed", "ended_at": datetime.utcnow(), "final_report_id": report_id}}
            )
        
        next_question = None
        status = "completed"

    else:
        resume_data = await fetch_resume_skills(str(session["user_id"]))
        skills = resume_data["skills"]
        job_role = resume_data["job_role"]
        difficulty = update_difficulty(session["_id"], score)

        if signal == "loop_back":
            next_question = generate_question(skills, job_role, seniority_level, difficulty, previous_questions, True, user_answer)
        else:
            next_question = generate_question(skills, job_role, seniority_level, difficulty, previous_questions, False, user_answer)

        # FIX: actually save the next question so it can be matched correctly next time
        next_question_data = {
            "question": next_question,
            "answer": None,
            "score": None,
            "feedback": None
        }
        db["sessions"].update_one(
            {"_id": ObjectId(session_id)},
            {"$push": {"questions": next_question_data}}
        )

        status = "in_progress"

    return {"score": score, "feedback": feedback, "next_question": next_question, "status": status}


async def start_interview(session_id: str):
    session = db["sessions"].find_one(ObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])

    target_role = session.get("target_role")
    seniority_level = session.get("seniority_level")

    if not target_role or not seniority_level:
        raise HTTPException(status_code=400, detail="Please provide target role and seniority level before starting.")

    resume_data = await fetch_resume_skills(session["user_id"])
    skills = resume_data["skills"]
    job_role = resume_data["job_role"]

    first_question = generate_question(skills, job_role, seniority_level, "medium", [], False, None)

    question_data = {
        "question": first_question,
        "answer": None,
        "score": None,
        "feedback": None
    }

    db["sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"questions": question_data}}
    )

    return {"question": first_question}