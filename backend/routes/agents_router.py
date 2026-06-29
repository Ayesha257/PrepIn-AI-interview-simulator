from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.resume_agent import run_resume_agent
from agents.evaluator_agent import run_evaluator_agent
from tools import fetch_resume_skills, update_difficulty, generate_question, score_answer
router = APIRouter(prefix="/agents", tags=["Agents"])


# ─── Request/Response models ──────────────────────────────────────────────────

class ParseResumeRequest(BaseModel):
    user_id: str
    resume_text: str  # plain text from your existing resume upload/extract step

class EvaluateRequest(BaseModel):
    session_id: str
    question_index: int
    question: str
    answer: str

class GenerateQuestionRequest(BaseModel):
    topic: str
    difficulty: str  # "easy" | "medium" | "hard"
    skills: list[str]

class UpdateDifficultyRequest(BaseModel):
    session_id: str
    score: float


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/parse-resume")
def parse_resume(req: ParseResumeRequest):
    """
    Resume Agent endpoint.
    Called after resume upload + text extraction.
    Returns the skills object → Faiqa's Interviewer Agent reads this.
    """
    result = run_resume_agent(req.user_id, req.resume_text)
    if not result["skills"]:
        # Don't crash, just warn — Faiqa's agent can handle empty skills
        print(f"[Warning] No skills extracted for user {req.user_id}")
    return result


@router.post("/evaluate")
def evaluate_answer(req: EvaluateRequest):
    """
    Evaluator Agent endpoint.
    Called by Faiqa's orchestrator after each answer.
    Returns score + feedback + signal (proceed/loop_back).
    """
    result = run_evaluator_agent(
        session_id=req.session_id,
        question_index=req.question_index,
        question=req.question,
        answer=req.answer,
    )
    return result


@router.get("/resume-skills/{user_id}")
async def get_resume_skills(user_id: str):
    """
    Tool: fetch_resume_skills
    Faiqa's agents call this to get the user's parsed skills from MongoDB.
    """
    result = await fetch_resume_skills(user_id)
    return result


@router.post("/update-difficulty")
def get_difficulty(req: UpdateDifficultyRequest):
    """
    Tool: update_difficulty
    Returns "easy", "medium", or "hard" based on score.
    """
    level = update_difficulty(req.session_id, req.score)
    return {"difficulty": level}


@router.post("/generate-question")
def get_question(req: GenerateQuestionRequest):
    """
    Tool: generate_question
    Generates one interview question. Used by Faiqa's Interviewer Agent.
    """
    question = generate_question(req.topic, req.difficulty, req.skills)
    return {"question": question}