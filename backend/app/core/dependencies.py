"""
FastAPI dependencies — reusable across all module controllers.

Usage in a controller:
    from app.core.dependencies import get_current_user, require_role

    @router.get("/me")
    def get_me(user: User = Depends(get_current_user)):
        return user

    @router.get("/admin/users")
    def list_users(user: User = Depends(require_role(UserRole.ADMIN))):
        return ...
"""

from typing import Callable

from fastapi import Depends, Header
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token
from app.database import get_db


def get_current_user_id(authorization: str = Header(..., alias="Authorization")) -> dict:
    """
    Extract and validate the user from the JWT in the Authorization header.

    Returns:
        dict with 'user_id' and 'role' keys.

    Raises:
        UnauthorizedException: If the token is missing, invalid, or expired.
    """
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header format")

    token = authorization.split(" ", 1)[1]

    try:
        payload = decode_token(token)
    except JWTError:
        raise UnauthorizedException("Invalid or expired token")

    user_id = payload.get("sub")
    role = payload.get("role")
    token_type = payload.get("type")

    if not user_id or token_type != "access":
        raise UnauthorizedException("Invalid token")

    return {"user_id": user_id, "role": role}


def require_role(*allowed_roles: UserRole) -> Callable:
    """
    Factory that creates a dependency requiring specific roles.

    Usage:
        @router.get("/admin/users")
        def list_users(user = Depends(require_role(UserRole.ADMIN))):
            ...
    """

    def role_checker(
        current_user: dict = Depends(get_current_user_id),
    ) -> dict:
        if current_user["role"] not in [r.value for r in allowed_roles]:
            raise ForbiddenException("You don't have permission to access this resource")
        return current_user

    return role_checker
