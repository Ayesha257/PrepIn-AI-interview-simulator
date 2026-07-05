import os
import re
import json
from dotenv import load_dotenv
from groq import Groq

from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

LOOP_BACK_THRESHOLD = 5.0

EVALUATOR_PROMPT = """
You are a fair and supportive technical interview evaluator. This is a real-time spoken mock interview — candidates may fumble their words, speak informally, skip minor details, or phrase things imperfectly even when they understand the concept well. Judge the underlying understanding, not perfect delivery.

Question asked: {question}
Candidate's answer: {answer}

Score the answer from 0.0 to 10.0 based on:
- Accuracy (is the core idea correct, even if not stated with textbook precision?)
- Depth (do they show real understanding, even if the explanation is brief or informal?)
- Clarity (can a listener follow their reasoning, even with some rambling or hesitation?)

Scoring guide (use this as your anchor, don't be harsher than this):
- 9-10: Correct and well-explained, shows strong understanding
- 7-8: Correct core idea, minor gaps or slightly incomplete explanation
- 5-6: Partially correct, shows some real understanding but missing key parts
- 3-4: Vague or mostly incorrect, but shows they've heard of the concept
- 0-2: No relevant understanding at all, or left blank / completely off-topic

Be generous with partial credit. Do not penalize for informal phrasing, filler words, nervousness, or minor inaccuracies that don't change the core correctness of the answer. Only give a very low score (0-2) if the answer shows no real understanding of the topic.

Write feedback directly addressing the candidate as "you" (e.g. "Your answer lacks depth..."), not in third person. Keep feedback constructive and encouraging, even when pointing out gaps.

Return ONLY valid JSON (no markdown, no explanation):
{{
  "score": 7.5,
  "feedback": "your feedback here"
}}
"""

def run_evaluator_agent(session_id: str, question_index: int, question: str, answer: str) -> dict:
    prompt = EVALUATOR_PROMPT.format(question=question, answer=answer)
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?", "", raw).strip()
        raw = re.sub(r"```$", "", raw).strip()
        parsed = json.loads(raw)
        score = float(parsed.get("score", 0.0))
        feedback = parsed.get("feedback", "No feedback generated.")
    except Exception as e:
        print(f"[EvaluatorAgent] Error: {e}")
        score = 0.0
        feedback = "Evaluation failed."

    signal = "proceed" if score >= LOOP_BACK_THRESHOLD else "loop_back"
    return {"session_id": session_id, "question_index": question_index, "score": score, "feedback": feedback, "signal": signal}