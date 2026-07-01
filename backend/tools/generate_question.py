import os
from dotenv import load_dotenv
from groq import Groq

from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
client = Groq(api_key="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")

def generate_question(topic: str, difficulty: str, skills: list) -> str:
    skills_str = ", ".join(skills) if skills else "general software development"
    prompt = f"""
Generate ONE {difficulty}-level technical interview question.
Topic: {topic}
Candidate's skills: {skills_str}
Rules: Ask only ONE clear question. Return ONLY the question text, nothing else.
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[generate_question] Error: {e}")
        return f"Tell me about your experience with {topic}."