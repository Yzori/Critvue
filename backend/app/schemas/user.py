"""User-related Pydantic schemas"""

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets security requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)')
        return v

    @field_validator('full_name')
    @classmethod
    def sanitize_full_name(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize full name to prevent injection attacks"""
        if v:
            # Strip whitespace and limit length
            v = v.strip()[:255]
            # Remove any HTML-like tags
            v = re.sub(r'<[^>]+>', '', v)
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response (public data)"""
    id: int
    role: str
    is_active: bool
    is_verified: bool
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Data stored in JWT token"""
    user_id: int
    email: str
