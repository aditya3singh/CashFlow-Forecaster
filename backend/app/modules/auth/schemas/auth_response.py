"""
Auth response schemas — Pydantic models for outgoing responses.
"""

from pydantic import BaseModel


class TokenResponse(BaseModel):
    """Response for signup/login/refresh — returns JWT tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Response for GET /api/v1/auth/me — current user profile."""
    id: str
    email: str
    business_name: str | None
    role: str
    alert_threshold: float
    is_active: bool

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Generic success message response."""
    success: bool = True
    message: str
