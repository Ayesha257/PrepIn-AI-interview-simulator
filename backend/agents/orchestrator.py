import sys
import os
from agents.evaluator_agent import run_evaluator_agent
from agents.interviewer_agent import generate_question
from tools.fetch_resume_skills import fetch_resume_skills
from tools.update_difficulty import update_difficulty
from database import db
from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException


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

    if question_count >=9:
        db["sessions"].update_one(
            {"_id" : ObjectId(session_id)},
            {"$set" : {"status" : "completed", "ended_at" : datetime.utcnow()}}
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