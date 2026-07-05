import json
import re
from agents.evaluator_agent import client

REPORT_PROMPT = """
You are an AI interview report generator.

Here is the full interview session data:
{session_data}

Generate a comprehensive interview report. Return ONLY valid JSON:
{{
  "overall_score": 7.5,
  "strengths": ["strength 1", "strength 2"],
  "weak_areas": ["weak area 1", "weak area 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "summary": "A brief overall summary of the candidate's performance"
}}
"""

def run_report_agent(session: dict) -> dict:
    questions = session.get("questions", [])
    
    session_data = []
    for i, q in enumerate(questions):
        session_data.append({
            "question_number": i + 1,
            "question": q.get("question"),
            "answer": q.get("answer"),
            "score": q.get("score"),
            "feedback": q.get("feedback")
        })
    
    prompt = REPORT_PROMPT.format(session_data=json.dumps(session_data, indent=2))
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?", "", raw).strip()
        raw = re.sub(r"```$", "", raw).strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[ReportAgent] Error: {e}")
        return {
            "overall_score": 0.0,
            "strengths": [],
            "weak_areas": [],
            "suggestions": [],
            "summary": "Report generation failed."
        }