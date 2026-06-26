from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    id: Optional[str] = None
    full_name: str
    email: str
    created_at: Optional[datetime] = None
    resume_id: Optional[str] = None

    class Config:
        populate_by_name = True


class UserInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    full_name: str
    email: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resume_id: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True