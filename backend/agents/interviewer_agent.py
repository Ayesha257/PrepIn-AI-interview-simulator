from core.llm import client

def generate_question(skills: list, job_role: str, seniority_level: str, difficulty: str, previous_questions: list, is_followup: bool, last_answer: str = ""):
    
    skills_str = ", ".join(skills) if skills else "general software development"
    asked = "\n".join(f"- {q}" for q in previous_questions) if previous_questions else "None yet"

    if is_followup:
        prompt = f"""You are a professional technical interviewer conducting a {seniority_level}-level interview for a {job_role} position.

The candidate gave this weak or incomplete answer: "{last_answer}"

Your job:
- If they said "I don't know", "I'm not sure", or gave a very vague answer — give them a HINT or simplify the question to help them think
- If they gave a partially correct answer — ask them to elaborate on one specific part
- NEVER repeat the exact same question
- Keep it encouraging and professional
- Return ONLY the follow-up question or hint, nothing else

Candidate skills: {skills_str}
Difficulty: {difficulty}"""

    else:
        level_guidance = {
            "Intern": "Start with very easy conceptual questions. Focus on fundamentals, basic syntax, simple project experience. Be warm and encouraging.",
            "Junior": "Ask beginner to intermediate questions. Focus on core concepts, basic problem solving, small project experience.",
            "Mid-Level": "Ask intermediate questions. Focus on design decisions, debugging, system thinking, real project challenges.",
            "Senior": "Ask advanced questions. Focus on architecture, scalability, leadership, trade-offs, and deep technical expertise."
        }.get(seniority_level, "Ask appropriate technical questions.")

        prompt = f"""You are a professional technical interviewer conducting a {seniority_level}-level interview for a {job_role} position.

Candidate skills: {skills_str}

Interview guidelines:
{level_guidance}

Questions already asked (DO NOT repeat these or same topics back to back):
{asked}

Rules:
- First question should ALWAYS be a warm-up like "Tell me about yourself" or "Walk me through your most recent project"
- Rotate topics — don't ask about same skill twice in a row
- Question difficulty: {difficulty}
- Keep questions concise and clear
- Return ONLY the question, nothing else"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content.strip()