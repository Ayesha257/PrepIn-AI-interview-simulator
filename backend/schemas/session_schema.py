"""
MongoDB Document Schemas — Ayesha's Responsibility
These are NOT enforced by Pydantic at DB level (MongoDB is schemaless),
but these are the exact shapes we write/read from MongoDB.
"""

# ──────────────────────────────────────────────
# COLLECTION: users
# ──────────────────────────────────────────────
USER_SCHEMA = {
    "_id": "ObjectId (auto)",
    "name": "str",
    "email": "str (unique, indexed)",
    "hashed_password": "str",
    "created_at": "datetime (UTC)",
    "updated_at": "datetime (UTC)",
    "profile": {
        "target_role": "str | None",       # e.g. 'Backend Engineer'
        "years_of_experience": "int | None",
        "interview_count": "int (default 0)",
    }
}

# ──────────────────────────────────────────────
# COLLECTION: resumes
# ──────────────────────────────────────────────
RESUME_SCHEMA = {
    "_id": "ObjectId (auto)",
    "user_id": "ObjectId → ref: users._id",
    "filename": "str",
    "file_path": "str",              # path on server or GridFS id
    "uploaded_at": "datetime (UTC)",
    "parsed_skills": [               # populated by Resume Agent (Week 3)
        {
            "skill": "str",          # e.g. 'Python'
            "level": "str",          # 'beginner' | 'intermediate' | 'advanced'
            "years": "int | None"
        }
    ],
    "raw_text": "str | None",        # full extracted text from PDF
    "is_parsed": "bool (default False)",
    "status": "str"                  # 'uploaded' | 'parsing' | 'parsed' | 'failed'
}

# ──────────────────────────────────────────────
# COLLECTION: sessions  (Faiqa's schema — read-only for Ayesha)
# Ayesha DESIGNS this, Faiqa WRITES to it
# ──────────────────────────────────────────────
SESSION_SCHEMA = {
    "_id": "ObjectId (auto)",
    "user_id": "ObjectId → ref: users._id",
    "resume_id": "ObjectId → ref: resumes._id",
    "started_at": "datetime (UTC)",
    "ended_at": "datetime | None",
    "status": "str",                 # 'active' | 'completed' | 'abandoned'
    "current_difficulty": "str",     # 'easy' | 'medium' | 'hard'
    "turns": [                       # one entry per Q&A pair
        {
            "turn_number": "int",
            "question": "str",
            "answer": "str",
            "score": "float | None",           # 0–10, from Evaluator Agent
            "feedback": "str | None",
            "difficulty": "str",
            "topic": "str",
            "timestamp": "datetime"
        }
    ]
}