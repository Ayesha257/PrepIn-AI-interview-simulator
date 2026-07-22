import re
import json
from core.llm import client

LOOP_BACK_THRESHOLD = 5.0

def run_evaluator_agent(session_id: str, question_index: int, question: str, answer: str, seniority_level: str ) -> dict:
    
    # Detect non-answers
    non_answer_phrases = ["i don't know", "idk", "i dont know", "not sure", "i'm not sure", 
                          "i don't remember", "i dont remember", "i have no idea", "no idea",
                          "i can't remember", "i cannot remember", "skip", "next question",
                          "i'm not familiar", "i am not familiar", "don't know"]
    
    is_non_answer = any(phrase in answer.lower() for phrase in non_answer_phrases)

    if is_non_answer:
        return {
            "session_id": session_id,
            "question_index": question_index,
            "score": 3.0,
            "feedback": "You mentioned you weren't sure about this — that's completely okay! Self-awareness is valued in interviews. We'll move to a related question to help you think it through.",
            "signal": "loop_back",
            "is_non_answer": True
        }

    level_expectations = {
        "Intern": "Be lenient. Reward effort and basic understanding. A partial answer showing conceptual awareness deserves 6-7. Only give below 4 for completely wrong answers.",
        "Junior": "Be moderately lenient. Reward correct concepts even if explanation is incomplete. Partial credit for right direction.",
        "Mid-Level": "Be balanced. Expect clear explanations and some depth. Partial credit for correct approach without full detail.",
        "Senior": "Be strict. Expect depth, trade-offs, real-world examples. Partial credit only for strong partial answers."
    }.get(seniority_level, "Be fair and balanced in scoring.")

    prompt = f"""
You are an experienced technical interviewer evaluating a candidate's answer.

Question asked: {question}
Candidate's answer: {answer}

Score the answer from 0.0 to 10.0 using this rubric. Use the FULL range — do not default to a "safe" middle score. Most answers should NOT score exactly 7.5.

Scoring guide:
- 9.0–10.0: Technically accurate, complete, and clearly explained. Covers the key points a strong candidate would mention. Doesn't need to be exhaustive — a concise but correct and complete answer deserves top marks.
- 7.0–8.9: Mostly correct with good understanding, but missing a minor detail, slightly vague in one area, or could be more precise.
- 5.0–6.9: Partially correct — shows some understanding but has a notable gap, a minor inaccuracy, or lacks depth.
- 3.0–4.9: Mostly incorrect or very shallow — shows limited understanding, only surface-level or buzzword-based.
- 0.0–2.9: Wrong, irrelevant, or effectively no real answer (e.g. "I don't know", nonsensical, or completely off-topic).

Important:
- Judge based on technical correctness and completeness relative to the question — NOT length. A short, precise, correct answer deserves a high score.
- Do not penalize for brevity if all key points are covered correctly.
- Do not penalize for imperfect grammar or phrasing if the technical content is correct.
- Be encouraging but honest — this is for a student practicing interviews, so fair, accurate scoring (not artificially inflated or deflated) is more helpful than a "safe" middling score.

Return ONLY valid JSON (no markdown, no explanation):
{{
  "score": 7.5,
  "feedback": "your feedback here"
}}
"""
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
    
    return {
        "session_id": session_id,
        "question_index": question_index,
        "score": score,
        "feedback": feedback,
        "signal": signal,
        "is_non_answer": False
    }