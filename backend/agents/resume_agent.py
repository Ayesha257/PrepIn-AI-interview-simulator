import os
import re
import json
from dotenv import load_dotenv
from groq import Groq

from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
client = Groq(api_key="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")

RESUME_PARSE_PROMPT = """
You are a resume parser. Extract the following from the resume text below and return ONLY valid JSON, nothing else.

Fields to extract:
- skills: list of technical/professional skills (strings)
- experience_years: total years of experience as a number (0 if student/fresher)
- education: highest degree + field, e.g. "BS Computer Science"
- job_role: the most relevant job title or target role, e.g. "Backend Developer"

Resume:
{resume_text}

Return ONLY this JSON (no markdown, no explanation):
{{
  "skills": [],
  "experience_years": 0,
  "education": "",
  "job_role": ""
}}
"""

def run_resume_agent(user_id: str, resume_text: str) -> dict:
    prompt = RESUME_PARSE_PROMPT.format(resume_text=resume_text)
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?", "", raw).strip()
        raw = re.sub(r"```$", "", raw).strip()
        parsed = json.loads(raw)
        return {
            "user_id": user_id,
            "skills": parsed.get("skills", []),
            "experience_years": parsed.get("experience_years", 0),
            "education": parsed.get("education", ""),
            "job_role": parsed.get("job_role", ""),
        }
    except Exception as e:
        print(f"[ResumeAgent] Error: {e}")
        return {"user_id": user_id, "skills": [], "experience_years": 0, "education": "", "job_role": ""}