import os
import re
import json
from dotenv import load_dotenv
from groq import Groq

from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
<<<<<<< HEAD
client = Groq(api_key="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")
=======
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
>>>>>>> 610ec63aebcbb8367379ea9ed5176ee205160c95

LOOP_BACK_THRESHOLD = 5.0

EVALUATOR_PROMPT = """
You are a strict technical interview evaluator.

Question asked: {question}
Candidate's answer: {answer}

Score the answer from 0.0 to 10.0 based on:
- Accuracy (is it correct?)
- Depth (did they explain enough?)
- Clarity (was it easy to understand?)

<<<<<<< HEAD
=======
Write feedback directly addressing the candidate as "you" (e.g. "Your answer lacks depth..."), not in third person.

>>>>>>> 610ec63aebcbb8367379ea9ed5176ee205160c95
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