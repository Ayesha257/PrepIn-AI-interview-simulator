from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId
from database import get_users_collection
from models.user import UserCreate, UserLogin, UserProfile
from utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    users_col = get_users_collection()

    # Check if email already exists
    existing = await users_col.find_one({"email": user.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password and store user
    hashed = hash_password(user.password)
    new_user = {
        "full_name": user.full_name,
        "email": user.email,
        "hashed_password": hashed,
        "created_at": datetime.utcnow(),
        "resume_id": None
    }
    result = await users_col.insert_one(new_user)

    # Generate token immediately so frontend can auto-login after register
    token = create_access_token({"sub": str(result.inserted_id)})

    return {
        "message": "Account created successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(result.inserted_id),
            "full_name": user.full_name,
            "email": user.email
        }
    }


@router.post("/login")
async def login(credentials: UserLogin):
    users_col = get_users_collection()

    user = await users_col.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": str(user["_id"])})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "full_name": user["full_name"],
            "email": user["email"]
        }
    }


@router.get("/me", response_model=UserProfile)
async def get_profile(user_id: str = Depends(get_current_user)):
    users_col = get_users_collection()

    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserProfile(
        id=str(user["_id"]),
        full_name=user["full_name"],
        email=user["email"],
        created_at=user.get("created_at"),
        resume_id=user.get("resume_id")
    )


@router.put("/me")
async def update_profile(
    updates: dict,
    user_id: str = Depends(get_current_user)
):
    users_col = get_users_collection()

    # Only allow safe fields to be updated
    allowed_fields = {"full_name"}
    safe_updates = {k: v for k, v in updates.items() if k in allowed_fields}

    if not safe_updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    await users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": safe_updates}
    )
    return {"message": "Profile updated successfully"}