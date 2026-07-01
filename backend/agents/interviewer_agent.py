import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.llm import client

def generate_question(skills: list, job_role: str, difficulty: str, previous_questions: list, is_followup: bool, last_answer: str = ""):
    if is_followup:
       prompt = f"""You are an AI technical interviewer.
       Candidate skills: {skills}
       Job role: {job_role}
       Difficulty: {difficulty}
       Their last answer: {last_answer}

       Generate a follow-up question based on their answer. Return only the question, nothing else."""
    else:
       prompt = f"""You are an AI technical interviewer.
       Candidate skills: {skills}
       Job role: {job_role}
       Difficulty: {difficulty}
       Questions already asked: {previous_questions}

       Generate the next interview question. Do not repeat any question already asked. Return only the question, nothing else."""

    response = client.chat.completions.create(
       model="llama-3.3-70b-versatile",
       messages=[
        {"role": "user", "content": prompt}
        ])

    return response.choices[0].message.content
