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

    answered = [q for q in questions if q.get("score") is not None]

    if len(answered) >= CONSECUTIVE_LOW_THRESHOLD:
        last_three = answered[-CONSECUTIVE_LOW_THRESHOLD:]
        if all(q["score"] < LOW_SCORE_CUTOFF for q in last_three):
            return True, "struggling"

    if len(answered) >= MIN_QUESTIONS:
        recent_scores = [q["score"] for q in answered[-MIN_QUESTIONS:] if q.get("score") is not None]
        if recent_scores and sum(recent_scores) / len(recent_scores) >= HIGH_SCORE_CUTOFF:
            return True, "performing_well"

    return False, ""


def get_past_questions(user_id, current_session_id):
    past_sessions = list(db["sessions"].find(
        {"user_id": user_id, "_id": {"$ne": ObjectId(current_session_id)}},
        {"questions": 1}
    ))
    past_questions = []
    for s in past_sessions:
        for q in s.get("questions", []):
            if q.get("question"):
                past_questions.append(q["question"])
    return past_questions


async def orchestrate_workflow(session_id: str, user_answer: str):
    session = db["sessions"].find_one(ObjectId(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["_id"] = str(session["_id"])

    target_role = session.get("target_role")
    seniority_level = session.get("seniority_level")

    if not target_role or not seniority_level:
        raise HTTPException(status_code=400, detail="Please provide target role and seniority level before starting.")

    questions = session["questions"]
    current_session_questions = [q["question"] for q in questions if q.get("question")]
    question_count = len(questions)

    last_question = current_session_questions[-1] if current_session_questions else ""

    evaluation = run_evaluator_agent(session_id, question_count, last_question, user_answer, seniority_level)

    score = evaluation["score"]
    feedback = evaluation["feedback"]
    signal = evaluation["signal"]

    db["sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            f"questions.{question_count - 1}.answer": user_answer,
            f"questions.{question_count - 1}.score": score,
            f"questions.{question_count - 1}.feedback": feedback,
        }}
    )

    should_end, reason = should_end_interview(questions, question_count)

    if should_end:
        session = db["sessions"].find_one(ObjectId(session_id))
        questions_list = session.get("questions", [])
        scores = [q["score"] for q in questions_list if q.get("score") is not None]
        overall_score = round(sum(scores) / len(scores), 2) if scores else 0.0

        report_data = run_report_agent(session)

        report_doc = {
            "session_id": session_id,
            "user_id": session["user_id"],
            "overall_score": overall_score,
            "target_role": target_role,
            "seniority_level": seniority_level,
            "strengths": report_data["strengths"],
            "weak_areas": report_data["weak_areas"],
            "suggestions": report_data["suggestions"],
            "summary": report_data["summary"],
            "ready_for_role": report_data.get("ready_for_role", False),
            "readiness_note": report_data.get("readiness_note", ""),
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
        difficulty = update_difficulty(session["_id"], score)
        past_questions = get_past_questions(session["user_id"], session_id)
        all_previous = past_questions + current_session_questions

        if signal == "loop_back":
            next_question = generate_question(
                skills, target_role, seniority_level, difficulty,
                all_previous, current_session_questions, True, user_answer
            )
        else:
            next_question = generate_question(
                skills, target_role, seniority_level, difficulty,
                all_previous, current_session_questions, False, user_answer
            )

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

    past_questions = get_past_questions(session["user_id"], session_id)

    first_question = generate_question(
        skills, target_role, seniority_level, "easy",
        past_questions, [], False, None
    )

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