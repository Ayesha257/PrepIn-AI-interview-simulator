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

    prompt = f"""You are a professional technical interview evaluator.

Question: {question}
Candidate's answer: {answer}
Seniority level being interviewed for: {seniority_level}

Scoring guidance:
{level_expectations}

Scoring scale:
- 9-10: Excellent — complete, accurate, well-explained
- 7-8: Good — mostly correct with minor gaps
- 5-6: Fair — correct direction but incomplete
- 3-4: Weak — some understanding but significant gaps
- 1-2: Poor — mostly incorrect
- 0: No attempt or completely wrong

Also evaluate:
- Communication clarity (did they explain well?)
- Problem-solving approach (did they think out loud?)
- Confidence in delivery

Write feedback directly addressing the candidate as "you".
Be encouraging and constructive — always end with something positive or a tip.

Return ONLY valid JSON:
{{
  "score": 7.5,
  "feedback": "your detailed encouraging feedback here"
}}"""

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