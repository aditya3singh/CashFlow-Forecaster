"""
Auth controller — HTTP route handlers.

Controller → Service → Repository → Database
^^^^^^^^^
You are here.

Thin layer: receives HTTP request, calls service, returns response.
No business logic lives here.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id
from app.database import get_db
from app.modules.auth.schemas.auth_request import LoginRequest, SignupRequest
from app.modules.auth.schemas.auth_response import TokenResponse, UserResponse
from app.modules.auth.services import auth_service

router = APIRouter()


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=201,
    summary="Create a new account",
    description="Register a new user with email and password. Returns JWT tokens.",
)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """
    Create a new user account.

    - Validates email format and password strength
    - Hashes password with bcrypt
    - Returns access + refresh tokens
    """
    return auth_service.signup(db, request)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in to your account",
    description="Authenticate with email and password. Returns JWT tokens.",
)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate and get tokens.

    - Same error message for wrong email or wrong password (security)
    - Checks if account is active
    """
    return auth_service.login(db, request)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Returns the authenticated user's profile.",
)
def get_me(
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get the current authenticated user's profile."""
    return auth_service.get_current_user_profile(db, current_user["user_id"])
