from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from database import get_db
from models.user import UserRegister, UserLogin, UserUpdateProfile, UserResponse, TokenResponse
from utils.auth import hash_password, verify_password, create_access_token, get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from config import settings

router = APIRouter()

def serialize_user(user: dict) -> dict:
    """Convert MongoDB user doc to serializable dict."""
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "created_at": user["created_at"],
        "profile": user.get("profile", None),
    }

# ──────────────────────────────
# POST /api/auth/register
# ──────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister):
    db = get_db()
    print("LOGIN DB =", db)
    print("CLIENT =", db.client)    
    # Check if email already exists
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": body.name,
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "created_at": now,
        "updated_at": now,
        "profile": {
            "target_role": None,
            "years_of_experience": None,
            "interview_count": 0,
        }
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id)})
    return {"access_token": token, "token_type": "bearer", "user": serialize_user(user_doc)}

# ──────────────────────────────
# POST /api/auth/login
# ──────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    db = get_db()

    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer", "user": serialize_user(user)}

@router.post("/token")
async def login_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    db = get_db()

    # Swagger sends the email in the username field
    user = await db.users.find_one({"email": form_data.username})

    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": str(user["_id"])})

    return {
        "access_token": token,
        "token_type": "bearer"
    }

# ──────────────────────────────
# GET /api/auth/me  (protected)
# ──────────────────────────────
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)

# ──────────────────────────────
# PUT /api/auth/profile  (protected)
# ──────────────────────────────
@router.put("/profile", response_model=UserResponse)
async def update_profile(body: UserUpdateProfile, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update_data = {"updated_at": datetime.now(timezone.utc)}

    if body.name:
        update_data["name"] = body.name
    if body.profile:
        profile_update = body.profile.dict(exclude_none=True)
        for key, val in profile_update.items():
            update_data[f"profile.{key}"] = val

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )

    updated = await db.users.find_one({"_id": current_user["_id"]})
    return serialize_user(updated)