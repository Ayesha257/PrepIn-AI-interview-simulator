import random
from core.llm import client

WARMUP_QUESTIONS = [
    "Tell me about yourself and what drew you to this role.",
    "What's a project you're most proud of and why?",
    "How would you describe your programming style?",
    "What are your strongest technical skills and how did you develop them?",
    "Walk me through how you approach solving a new technical problem.",
    "What's something technical you taught yourself recently?",
    "Describe a challenge you faced in a project and how you overcame it.",
    "What motivated you to pursue a career in software development?",
    "Tell me about a time you had to learn something quickly for a project.",
]

def generate_question(
    skills: list,
    job_role: str,
    seniority_level: str,
    difficulty: str,
    all_previous_questions: list,  # past sessions + current session combined
    current_session_questions: list,  # only current session questions
    is_followup: bool,
    last_answer: str = ""
):
    skills_str = ", ".join(skills) if skills else "general software development"
    all_asked = "\n".join(f"- {q}" for q in all_previous_questions) if all_previous_questions else "None yet"
    session_asked = "\n".join(f"- {q}" for q in current_session_questions) if current_session_questions else "None yet"

    if is_followup:
        prompt = f"""You are a professional technical interviewer conducting a {seniority_level}-level interview for a {job_role} position.

The candidate just answered this question: "{current_session_questions[-1] if current_session_questions else ''}"
Their answer was: "{last_answer}"

Your job:
- If they said "I don't know", "I'm not sure", or gave a very vague answer — give them a HINT or a simpler version of the same concept to help them think
- If they gave a partially correct answer — ask them to elaborate on one specific part they got right
- NEVER repeat any question from this list:
{session_asked}
- Keep it encouraging and professional
- Return ONLY the follow-up question or hint, nothing else

Candidate skills: {skills_str}
Difficulty: {difficulty}"""

    else:
        level_guidance = {
            "Intern": "Focus on fundamentals and basic concepts. Be warm and encouraging. Avoid system design or architecture questions.",
            "Junior": "Ask beginner to intermediate questions. Focus on core concepts and basic problem solving.",
            "Mid-Level": "Ask intermediate questions. Focus on design decisions, debugging, and system thinking.",
            "Senior": "Ask advanced questions. Focus on architecture, scalability, leadership, and trade-offs."
        }.get(seniority_level, "Ask appropriate technical questions.")

        is_first_in_session = len(current_session_questions) == 0

        if is_first_in_session:
            chosen_warmup = random.choice(WARMUP_QUESTIONS)
            prompt = f"""You are a professional technical interviewer conducting a {seniority_level}-level interview for a {job_role} position.

Start with this warm-up question — rephrase it slightly to feel natural and tailored to the role and skills:
"{chosen_warmup}"

Candidate skills: {skills_str}
Return ONLY the question, nothing else."""

        else:
            # Extract topics already covered in this session to enforce variety
            prompt = f"""You are a professional technical interviewer conducting a {seniority_level}-level interview for a {job_role} position.

Candidate skills: {skills_str}

Interview guidelines:
{level_guidance}

ALL questions ever asked to this candidate (DO NOT repeat any of these or their topics):
{all_asked}

Rules:
- You MUST pick a completely different skill or topic from everything listed above
- Rotate across different skill areas — if last question was about Python, ask about databases or system design next
- Vary the question type: mix theoretical, practical, scenario-based, and debugging questions
- Question difficulty: {difficulty}
- Keep the question concise and clear — one question only
- Return ONLY the question, nothing else"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content.strip()