import json
import re
from core.llm import client

def run_report_agent(session: dict) -> dict:
    questions = session.get("questions", [])
    target_role = session.get("target_role", "Software Developer")
    seniority_level = session.get("seniority_level", "Junior")

    session_data = []
    for i, q in enumerate(questions):
        if q.get("answer") is not None:
            session_data.append({
                "question_number": i + 1,
                "question": q.get("question"),
                "answer": q.get("answer"),
                "score": q.get("score"),
                "feedback": q.get("feedback")
            })

    scores = [q["score"] for q in session_data if q.get("score") is not None]
    overall_score = round(sum(scores) / len(scores), 2) if scores else 0.0

    prompt = f"""You are an expert technical interview coach generating a detailed post-interview report.

Role applied for: {target_role}
Seniority level: {seniority_level}
Overall average score: {overall_score}/10

Full interview transcript:
{json.dumps(session_data, indent=2)}

Generate a COMPREHENSIVE interview report. Be specific — reference actual questions and answers from the transcript above.

Requirements:
- MINIMUM 5 items in strengths, weak_areas, and suggestions
- Cover DIFFERENT dimensions: technical knowledge, communication, problem-solving, confidence, depth of answers
- strengths should mention specific things the candidate did well with references to their actual answers
- weak_areas should be specific gaps observed, not generic
- suggestions should be ACTIONABLE — specific things to study or practice
- Also assess if the candidate is READY for this {seniority_level} {target_role} role
- summary should be 3-4 sentences, honest but encouraging

Return ONLY valid JSON, no markdown:
{{
  "strengths": [
    "at least 5 specific strengths based on actual answers"
  ],
  "weak_areas": [
    "at least 5 specific weak areas observed"
  ],
  "suggestions": [
    "at least 5 actionable specific suggestions"
  ],
  "summary": "3-4 sentence honest encouraging summary",
  "ready_for_role": true or false,
  "readiness_note": "one sentence on why they are or aren't ready yet"
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?", "", raw).strip()
        raw = re.sub(r"```$", "", raw).strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[ReportAgent] Error: {e}")
        return {
            "strengths": [],
            "weak_areas": [],
            "suggestions": [],
            "summary": "Report generation failed.",
            "ready_for_role": False,
            "readiness_note": "Could not assess readiness."
        }