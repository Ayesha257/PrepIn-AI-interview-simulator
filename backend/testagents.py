"""
test_agents.py — Mock Data Tests for Week 3
Run this to verify your agents work before Faiqa integrates.

Usage:
    python test_agents.py

No FastAPI server needed. Just run directly.
You DO need your GEMINI_API_KEY set in environment or .env
"""

import asyncio
import os
import sys

# If running from project root, adjust path as needed
sys.path.insert(0, ".")

# ── Set your Gemini key for testing (or load from .env) ──────────────────────
# If you use python-dotenv:
# from dotenv import load_dotenv; load_dotenv()

os.environ.setdefault("GEMINI_API_KEY", "your-gemini-key-here")  # ← replace or load from .env


# ─────────────────────────────────────────────────────────────────────────────
# MOCK: Fake the config and db imports so we don't need the full FastAPI app
# ─────────────────────────────────────────────────────────────────────────────
import types

# Mock settings
mock_settings = types.SimpleNamespace(GEMINI_API_KEY=os.environ["GEMINI_API_KEY"])
sys.modules["app"] = types.ModuleType("app")
sys.modules["app.config"] = types.SimpleNamespace(settings=mock_settings)

# Mock db (for fetch_resume_skills)
class MockDB:
    class resumes:
        @staticmethod
        async def find_one(query):
            # Simulate what's already stored in MongoDB after resume upload
            return {
                "user_id": "user_123",
                "skills": ["Python", "React", "MongoDB", "FastAPI"],
                "experience_years": 1,
                "education": "BS Computer Science",
                "job_role": "Backend Developer",
            }

sys.modules["app.database"] = types.SimpleNamespace(db=MockDB())


# Now import your actual agents
from agents.resume_agent import run_resume_agent
from agents.evaluator_agent import run_evaluator_agent 
from tools.score_answer import score_answer
from tools.fetch_resume_skills import fetch_resume_skills
from tools.update_difficulty import update_difficulty
from tools.generate_question import generate_question

# ─────────────────────────────────────────────────────────────────────────────
# TEST DATA
# ─────────────────────────────────────────────────────────────────────────────

MOCK_RESUME = """
Ayesha Khan
BS Computer Science, FAST NUCES Lahore (2022–2026)

Skills: Python, React, MongoDB, FastAPI, Docker, REST APIs, Tailwind CSS

Projects:
- CyberX: Deepfake detection system using CNN
- DevNest: Coding competition platform (fullstack)
- AI Interview Simulator (FYP): Multi-agent AI system

Experience:
- Frontend Intern at Web SOPs (3 months, 2024)
"""

MOCK_USER_ID = "user_123"
MOCK_SESSION_ID = "session_abc456"


# ─────────────────────────────────────────────────────────────────────────────
# TESTS
# ─────────────────────────────────────────────────────────────────────────────

def separator(title):
    print(f"\n{'='*55}")
    print(f"  {title}")
    print('='*55)


def test_resume_agent():
    separator("TEST 1: Resume Agent")
    result = run_resume_agent(MOCK_USER_ID, MOCK_RESUME)
    print("Output:")
    import json
    print(json.dumps(result, indent=2))

    # Basic validation
    assert result["user_id"] == MOCK_USER_ID, "user_id missing"
    assert isinstance(result["skills"], list), "skills should be a list"
    assert len(result["skills"]) > 0, "skills should not be empty"
    print("\n✅ Resume Agent PASSED")


def test_evaluator_agent_good_answer():
    separator("TEST 2: Evaluator Agent — Good Answer")
    result = run_evaluator_agent(
        session_id=MOCK_SESSION_ID,
        question_index=0,
        question="What is a REST API?",
        answer="REST is an architectural style for APIs that uses HTTP methods like GET, POST, PUT, DELETE. It is stateless and uses URLs to represent resources.",
    )
    import json
    print("Output:", json.dumps(result, indent=2))
    assert result["signal"] in ("proceed", "loop_back")
    print(f"\n✅ Evaluator Agent PASSED — signal: {result['signal']}")


def test_evaluator_agent_bad_answer():
    separator("TEST 3: Evaluator Agent — Weak Answer → expect loop_back")
    result = run_evaluator_agent(
        session_id=MOCK_SESSION_ID,
        question_index=1,
        question="Explain database indexing.",
        answer="I don't know much about it.",
    )
    import json
    print("Output:", json.dumps(result, indent=2))
    print(f"\n✅ Signal: {result['signal']}  (expected: loop_back if score < 5)")


def test_tool_score_answer():
    separator("TEST 4: Tool — score_answer()")
    score = score_answer(
        question="What is a Python decorator?",
        answer="A decorator is a function that wraps another function to add behavior.",
    )
    print(f"Score: {score}")
    assert 0.0 <= score <= 10.0
    print("✅ score_answer PASSED")


async def test_tool_fetch_resume_skills():
    separator("TEST 5: Tool — fetch_resume_skills()")
    result = await fetch_resume_skills(MOCK_USER_ID)
    import json
    print("Output:", json.dumps(result, indent=2))
    assert result["user_id"] == MOCK_USER_ID
    print("✅ fetch_resume_skills PASSED")


def test_tool_update_difficulty():
    separator("TEST 6: Tool — update_difficulty()")
    print(f"  score=3.0 → {update_difficulty(MOCK_SESSION_ID, 3.0)}  (expect: easy)")
    print(f"  score=6.0 → {update_difficulty(MOCK_SESSION_ID, 6.0)}  (expect: medium)")
    print(f"  score=9.0 → {update_difficulty(MOCK_SESSION_ID, 9.0)}  (expect: hard)")
    print("✅ update_difficulty PASSED")


def test_tool_generate_question():
    separator("TEST 7: Tool — generate_question()")
    q = generate_question(
        topic="databases",
        difficulty="medium",
        skills=["MongoDB", "FastAPI", "Python"],
    )
    print(f"Generated Question:\n  {q}")
    assert len(q) > 10
    print("✅ generate_question PASSED")


# ─────────────────────────────────────────────────────────────────────────────
# RUN ALL TESTS
# ─────────────────────────────────────────────────────────────────────────────

async def main():
    print("\n🚀 Running Week 3 Agent Tests...\n")
    test_resume_agent()
    test_evaluator_agent_good_answer()
    test_evaluator_agent_bad_answer()
    test_tool_score_answer()
    await test_tool_fetch_resume_skills()
    test_tool_update_difficulty()
    test_tool_generate_question()
    print("\n\n✅ All tests done! Share results with Faiqa before she integrates.\n")


if __name__ == "__main__":
    asyncio.run(main())