from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    target_role: Optional[str] = None
    years_of_experience: Optional[int] = Field(None, ge=0, le=50)
    skills: Optional[List[str]] = None

class UserUpdateProfile(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    profile: Optional[UserProfile] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    profile: Optional[UserProfile] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class User(BaseModel):
    email: str
    password: Optional[str] = None
    is_verified: bool = False
    auth_provider: str  # "google" ya "email"

class GoogleTokenIn(BaseModel):
    token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None

class VerifyCodeRequest(BaseModel):
    email: str
    code: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str