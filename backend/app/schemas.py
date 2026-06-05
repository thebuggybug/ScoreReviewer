from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class CandidateScoreCreate(BaseModel):
    category: str
    score: int = Field(ge=1, le=5)
    note: str | None = None


class InternalNotesUpdate(BaseModel):
    internal_notes: str
