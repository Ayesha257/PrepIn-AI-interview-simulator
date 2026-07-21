from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from database import get_db
from models.user import (
    UserRegister, UserLogin, UserUpdateProfile,
    UserResponse, TokenResponse, GoogleTokenIn,
    VerifyCodeRequest, ForgotPasswordRequest, ResetPasswordRequest
)
from utils.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, hash_code,
)
from fastapi.security import OAuth2PasswordRequestForm
from config import settings
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from utils.email_utils import (
    generate_verification_code,
    send_verification_code_email,
    send_reset_password_code_email,
)

router = APIRouter()

GENERIC_CODE_ERROR = "Invalid or expired code"
GENERIC_EMAIL_SENT = "If an account exists with this email, a code has been sent."


def serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user["email"],
        "created_at": user["created_at"],
        "profile": user.get("profile", None),
    }


def _code_expired(expiry) -> bool:
    if expiry is None:
        return True
    if getattr(expiry, "tzinfo", None) is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) > expiry


# ──────────────────────────────
# POST /api/auth/register
# ──────────────────────────────
@router.post("/register", status_code=201)
async def register(body: UserRegister):
    db = get_db()

    existing = await db.users.find_one({"email": body.email})

    if existing:
        if existing.get("is_verified", False):
            raise HTTPException(status_code=400, detail="Email already registered")
        # Unverified account: update password + resend code
        code = generate_verification_code()
        expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
        await db.users.update_one(
            {"email": body.email},
            {
                "$set": {
                    "name": body.name,
                    "hashed_password": hash_password(body.password),
                    "verification_code": hash_code(code),
                    "verification_code_expiry": expiry,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        await send_verification_code_email(body.email, code)
        return {"message": "Verification code resent. Please check your inbox."}

    code = generate_verification_code()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    now = datetime.now(timezone.utc)

    user_doc = {
        "name": body.name,
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "is_verified": False,
        "verification_code": hash_code(code),
        "verification_code_expiry": expiry,
        "auth_provider": "email",
        "created_at": now,
        "updated_at": now,
        "profile": {
            "target_role": None,
            "years_of_experience": None,
            "interview_count": 0,
        },
    }

    await db.users.insert_one(user_doc)
    await send_verification_code_email(body.email, code)

    return {"message": "Signup successful. Please check your email for a verification code."}


# ──────────────────────────────
# POST /api/auth/verify-code
# ──────────────────────────────
@router.post("/verify-code")
async def verify_code(body: VerifyCodeRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email})

    if not user or user.get("is_verified", False):
        raise HTTPException(status_code=400, detail=GENERIC_CODE_ERROR)

    if user.get("verification_code") != hash_code(body.code):
        raise HTTPException(status_code=400, detail=GENERIC_CODE_ERROR)

    if _code_expired(user.get("verification_code_expiry")):
        raise HTTPException(status_code=400, detail=GENERIC_CODE_ERROR)

    await db.users.update_one(
        {"email": body.email},
        {
            "$set": {"is_verified": True},
            "$unset": {"verification_code": "", "verification_code_expiry": ""},
        },
    )

    updated_user = await db.users.find_one({"email": body.email})
    token = create_access_token({"sub": str(updated_user["_id"])})

    return {
        "message": "Email verified successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_user(updated_user),
    }


# ──────────────────────────────
# POST /api/auth/resend-verification
# ──────────────────────────────
@router.post("/resend-verification")
async def resend_verification(email: str):
    db = get_db()
    user = await db.users.find_one({"email": email})

    if user and not user.get("is_verified", False):
        code = generate_verification_code()
        expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
        await db.users.update_one(
            {"email": email},
            {"$set": {"verification_code": hash_code(code), "verification_code_expiry": expiry}},
        )
        await send_verification_code_email(email, code)

    return {"message": GENERIC_EMAIL_SENT}


# ──────────────────────────────
# POST /api/auth/login
# ──────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    db = get_db()

    user = await db.users.find_one({"email": body.email})
    if not user or not user.get("hashed_password") or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer", "user": serialize_user(user)}


@router.post("/token")
async def login_for_swagger(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user = await db.users.find_one({"email": form_data.username})

    if not user or not user.get("hashed_password") or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer"}


# ──────────────────────────────
# POST /api/auth/forgot-password
# ──────────────────────────────
@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email})

    if user and user.get("hashed_password"):
        code = generate_verification_code()
        expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
        await db.users.update_one(
            {"email": body.email},
            {"$set": {"reset_code": hash_code(code), "reset_code_expiry": expiry}},
        )
        await send_reset_password_code_email(body.email, code)

    return {"message": "If an account exists with this email, a reset code has been sent."}


# ──────────────────────────────
# POST /api/auth/reset-password
# ──────────────────────────────
@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email})

    if not user or user.get("reset_code") != hash_code(body.code) or _code_expired(user.get("reset_code_expiry")):
        raise HTTPException(status_code=400, detail=GENERIC_CODE_ERROR)

    await db.users.update_one(
        {"email": body.email},
        {
            "$set": {
                "hashed_password": hash_password(body.new_password),
                "updated_at": datetime.now(timezone.utc),
            },
            "$unset": {"reset_code": "", "reset_code_expiry": ""},
        },
    )

    return {"message": "Password reset successfully. You can now log in."}


# ──────────────────────────────
# POST /api/auth/google-login
# ──────────────────────────────
@router.post("/google-login", response_model=TokenResponse)
async def google_login(data: GoogleTokenIn):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google login is not configured")

    try:
        idinfo = id_token.verify_oauth2_token(
            data.token,
            grequests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    if not idinfo.get("email_verified"):
        raise HTTPException(status_code=403, detail="Google email not verified")

    email = idinfo["email"]
    name = idinfo.get("name", email.split("@")[0])

    db = get_db()
    user = await db.users.find_one({"email": email})

    if not user:
        now = datetime.now(timezone.utc)
        new_user = {
            "name": name,
            "email": email,
            "hashed_password": None,
            "is_verified": True,
            "auth_provider": "google",
            "google_sub": idinfo.get("sub"),
            "created_at": now,
            "updated_at": now,
            "profile": {
                "target_role": None,
                "years_of_experience": None,
                "interview_count": 0,
            },
        }
        result = await db.users.insert_one(new_user)
        user = await db.users.find_one({"_id": result.inserted_id})

    token = create_access_token({"sub": str(user["_id"])})
    return {"access_token": token, "token_type": "bearer", "user": serialize_user(user)}


# ──────────────────────────────
# GET /api/auth/me
# ──────────────────────────────
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)


# ──────────────────────────────
# PUT /api/auth/profile
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

    await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return serialize_user(updated)
