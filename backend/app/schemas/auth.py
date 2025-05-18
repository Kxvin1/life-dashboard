from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr = Field(..., max_length=50)
    full_name: str = Field(..., max_length=20)


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr = Field(..., max_length=50)
    password: str


class User(UserBase):
    id: int
    is_active: bool
    is_demo_user: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
