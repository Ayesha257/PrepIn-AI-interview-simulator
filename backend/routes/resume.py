from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from datetime import datetime, timezone
from bson import ObjectId
import os, shutil
from database import get_db
from models.resume import ResumeResponse, ResumeListResponse
from utils.auth import get_current_user
from pypdf import PdfReader
import docx
from agents.resume_agent import run_resume_agent

def extract_text(file_path: str, content_type: str) -> str:
    if content_type == "application/pdf":
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    else:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])

router = APIRouter()

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"application/pdf", "application/msword",
                 "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
MAX_SIZE_MB = 5

def serialize_resume(r: dict) -> dict:
    return {
        "id": str(r["_id"]),
        "user_id": str(r["user_id"]),
        "filename": r["filename"],
        "uploaded_at": r["uploaded_at"],
        "is_parsed": r.get("is_parsed", False),
        "status": r.get("status", "uploaded"),
        "skills": r.get("skills", []),
        "experience_years": r.get("experience_years", 0),
        "education": r.get("education", ""),
        "job_role": r.get("job_role", ""),
    }

# ──────────────────────────────
# POST /api/resume/upload
# ──────────────────────────────
@router.post("/upload", response_model=ResumeResponse, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF or DOCX files allowed")

    # Read & check size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_SIZE_MB}MB")

    # Save file to disk
    user_id_str = str(current_user["_id"])
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{user_id_str}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Extract text from the file
    resume_text = extract_text(file_path, file.content_type)

    # Run the Resume Agent to parse skills
    parsed_data = run_resume_agent(user_id_str, resume_text)

    db = get_db()
    resume_doc = {
    "user_id": current_user["_id"],
    "filename": file.filename,
    "file_path": file_path,
    "uploaded_at": datetime.now(timezone.utc),
    "is_parsed": True,
    "status": "parsed",
    "skills": parsed_data["skills"],
    "experience_years": parsed_data["experience_years"],
    "education": parsed_data["education"],
    "job_role": parsed_data["job_role"],
    "raw_text": resume_text
    }

    result = await db.resumes.insert_one(resume_doc)
    resume_doc["_id"] = result.inserted_id

    return serialize_resume(resume_doc)

# ──────────────────────────────
# GET /api/resume/my
# ──────────────────────────────
@router.get("/my", response_model=ResumeListResponse)
async def get_my_resumes(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.resumes.find({"user_id": current_user["_id"]}).sort("uploaded_at", -1)
    resumes = await cursor.to_list(length=50)
    return {
        "resumes": [serialize_resume(r) for r in resumes],
        "total": len(resumes)
    }

# ──────────────────────────────
# GET /api/resume/{resume_id}
# ──────────────────────────────
@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        obj_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid resume ID")

    resume = await db.resumes.find_one({"_id": obj_id, "user_id": current_user["_id"]})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return serialize_resume(resume)

# ──────────────────────────────
# DELETE /api/resume/{resume_id}
# ──────────────────────────────
@router.delete("/{resume_id}", status_code=204)
async def delete_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        obj_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid resume ID")

    resume = await db.resumes.find_one({"_id": obj_id, "user_id": current_user["_id"]})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Delete file from disk
    if os.path.exists(resume["file_path"]):
        os.remove(resume["file_path"])

    await db.resumes.delete_one({"_id": obj_id})