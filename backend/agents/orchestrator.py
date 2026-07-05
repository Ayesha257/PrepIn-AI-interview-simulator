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

MAX_QUESTIONS = 2
async def orchestrate_workflow(session_id : str, user_answer : str):
    session = db["sessions"].find_one(ObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])

    questions = session["questions"]
    previous_questions = [q["question"] for q in questions]
    last_question = previous_questions[-1] if previous_questions else ""
    question_count = len(questions)

    evaluation = run_evaluator_agent(session_id, question_count, last_question, user_answer)

    score = evaluation["score"]
    feedback = evaluation["feedback"]
    signal = evaluation["signal"]

    question_data = {
        "question" : last_question,
        "answer" : user_answer,
        "score" : score,
        "feedback" : feedback
    }

    db["sessions"].update_one(
        {"_id" : ObjectId(session_id)},
        {"$push" : {"questions" : question_data} }
    )

    if question_count >= MAX_QUESTIONS:
        session = db["sessions"].find_one(ObjectId(session_id))
        questions = session.get("questions", [])
        scores = [q["score"] for q in questions if q.get("score") is not None]
        overall_score = round(sum(scores) / len(scores), 2) if scores else 0.0
        report_data = run_report_agent(session)
    
        report_doc = {
        "session_id": session_id,
        "user_id": session["user_id"],
        "overall_score": report_data["overall_score"],
        "strengths": report_data["strengths"],
        "weak_areas": report_data["weak_areas"],
        "suggestions": report_data["suggestions"],
        "summary": report_data["summary"],
        "created_at": datetime.utcnow()
        }
        report_result = db["reports"].insert_one(report_doc)
        report_id = str(report_result.inserted_id)
    
        db["sessions"].update_one(
            {"_id" : ObjectId(session_id)},
            {"$set" : {"status" : "completed", "ended_at" : datetime.utcnow(), "final_report_id": report_id}}
        )
        next_question = None
        status = "completed"

    else:
        resume_data = await fetch_resume_skills(str(session["user_id"]))
        skills = resume_data["skills"]
        job_role = resume_data["job_role"]
        difficulty = update_difficulty(session["_id"], score)

        if signal == "loop_back":
            next_question = generate_question(skills, job_role, difficulty, previous_questions, True, user_answer)
        else:
            next_question = generate_question(skills, job_role, difficulty, previous_questions, False, user_answer)
        status = "in_progress"
        
    return {"score" : score, "feedback" : feedback, "next_question" : next_question, "status" : status}

async def start_interview(session_id : str):
    
    session = db["sessions"].find_one(ObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])

    resume_data = await fetch_resume_skills(session["user_id"])
    skills = resume_data["skills"]
    job_role = resume_data["job_role"]
    print("SKILLS:", skills)
    print("JOB ROLE:", job_role)

    first_question = generate_question(skills, job_role, "medium", [], False, None)

    question_data = {
    "question": first_question,
    "answer": None,
    "score": None,
    "feedback": None
    }

    db["sessions"].update_one(
        {"_id" : ObjectId(session_id)},
        {"$push" : {"questions" : question_data}}
    )

    return {"question" : first_question}