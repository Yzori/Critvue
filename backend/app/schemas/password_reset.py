"""Password reset Pydantic schemas"""

import re
from pydantic import BaseModel, EmailStr, Field, field_validator


class PasswordResetRequest(BaseModel):
    """Schema for requesting a password reset"""
    email: EmailStr = Field(..., description="Email address of the account to reset")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class PasswordResetConfirm(BaseModel):
    """Schema for confirming a password reset with token"""
    token: str = Field(..., min_length=32, max_length=100, description="Password reset token from email")
    new_password: str = Field(..., min_length=8, max_length=100, description="New password")

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """
        Validate password meets security requirements

        Requirements:
        - At least 8 characters long
        - Contains uppercase letter
        - Contains lowercase letter
        - Contains digit
        - Contains special character
        """
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

    class Config:
        json_schema_extra = {
            "example": {
                "token": "abc123def456ghi789jkl012mno345pqr678",
                "new_password": "NewSecureP@ssw0rd"
            }
        }


class PasswordResetResponse(BaseModel):
    """Generic success response for password reset operations"""
    message: str
    detail: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Password reset email sent",
                "detail": "If an account exists with this email, you will receive a password reset link."
            }
        }


class PasswordResetVerify(BaseModel):
    """Schema for verifying if a reset token is valid (optional endpoint)"""
    token: str = Field(..., min_length=32, max_length=100)

    class Config:
        json_schema_extra = {
            "example": {
                "token": "abc123def456ghi789jkl012mno345pqr678"
            }
        }


class PasswordResetVerifyResponse(BaseModel):
    """Response for token verification"""
    valid: bool
    email: str | None = None
    expires_in_seconds: int | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "valid": True,
                "email": "u***@example.com",
                "expires_in_seconds": 600
            }
        }
