"""
Auth service — business logic for authentication.

Controller → Service → Repository → Database
              ^^^^^^
              You are here.

This is where signup/login/refresh logic lives.
No HTTP concerns here — just pure business rules.
"""

import uuid

from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.logging_config import get_logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.modules.auth.models.user import User
from app.modules.auth.repositories import user_repository
from app.modules.auth.schemas.auth_request import LoginRequest, SignupRequest
from app.modules.auth.schemas.auth_response import TokenResponse, UserResponse

logger = get_logger(__name__)


def signup(db: Session, request: SignupRequest) -> TokenResponse:
    """
    Register a new user.

    Flow:
        1. Check email not duplicate → 409 if exists
        2. Hash password (bcrypt)
        3. Create user in DB (role="customer")
        4. Generate JWT + refresh token
        5. Return tokens

    Security note:
        Error message on duplicate is generic ("Email already registered")
        to avoid leaking whether a specific email exists.
    """
    # 1. Check for duplicate email
    existing = user_repository.get_by_email(db, request.email)
    if existing:
        raise ConflictException("Email already registered")

    # 2. Hash password
    hashed_pw = hash_password(request.password)

    # 3. Create user
    user = user_repository.create_user(
        db=db,
        email=request.email,
        hashed_password=hashed_pw,
        business_name=request.business_name,
        role=UserRole.CUSTOMER.value,
    )

    logger.info(f"New user signed up: {user.email} (id={user.id})")

    # 4. Generate tokens
    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    # 5. Return
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


def login(db: Session, request: LoginRequest) -> TokenResponse:
    """
    Authenticate a user.

    Flow:
        1. Find user by email → 401 if not found
        2. Verify password → 401 if wrong
        3. Check is_active → 401 if disabled
        4. Generate JWT + refresh token
        5. Return tokens

    Security note:
        Same error message for "not found" and "wrong password"
        to prevent user enumeration attacks.
    """
    # 1. Find user
    user = user_repository.get_by_email(db, request.email)
    if not user:
        raise UnauthorizedException("Invalid email or password")

    # 2. Verify password
    if not verify_password(request.password, user.hashed_password):
        raise UnauthorizedException("Invalid email or password")

    # 3. Check active
    if not user.is_active:
        raise UnauthorizedException("Account is disabled")

    logger.info(f"User logged in: {user.email}")

    # 4. Generate tokens
    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    # 5. Return
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


def get_current_user_profile(db: Session, user_id: str) -> UserResponse:
    """
    Get the current user's profile.

    Called by GET /api/v1/auth/me.
    """
    user = user_repository.get_by_id(db, uuid.UUID(user_id))
    if not user:
        raise UnauthorizedException("User not found")

    return UserResponse(
        id=str(user.id),
        email=user.email,
        business_name=user.business_name,
        role=user.role,
        alert_threshold=float(user.alert_threshold),
        is_active=user.is_active,
    )
