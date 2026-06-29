import os, re, json
from dotenv import load_dotenv
from groq import Groq
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
client = Groq(api_key="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")

def score_answer(question: str, answer: str) -> float:
    prompt = f"""
Score this interview answer from 0.0 to 10.0.
Question: {question}
Answer: {answer}
Return ONLY a JSON object like: {{"score": 7.5}}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?", "", raw).strip()
        raw = re.sub(r"```$", "", raw).strip()
        return float(json.loads(raw).get("score", 0.0))
    except Exception as e:
        print(f"[score_answer] Error: {e}")
        return 0.0