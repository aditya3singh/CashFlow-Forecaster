"""
Auth request schemas — Pydantic models for incoming requests.

Validation happens here:
    - Email must be valid format
    - Password must be at least 8 characters
"""

from pydantic import BaseModel, EmailStr, field_validator


class SignupRequest(BaseModel):
    """Request body for POST /api/v1/auth/signup"""
    email: EmailStr
    password: str
    business_name: str | None = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    """Request body for POST /api/v1/auth/login"""
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Request body for POST /api/v1/auth/refresh"""
    refresh_token: str
