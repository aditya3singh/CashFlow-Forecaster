"""
User repository — data access layer for the auth module.

This is the ONLY place that talks to the database for users.
Business logic goes in auth_service.py, not here.
"""

import uuid

from sqlalchemy.orm import Session

from app.modules.auth.models.user import User


def create_user(
    db: Session,
    email: str,
    hashed_password: str,
    business_name: str | None = None,
    role: str = "customer",
) -> User:
    """
    Create a new user in the database.

    Args:
        db: Database session.
        email: User's email (must be unique).
        hashed_password: Already-hashed password (bcrypt).
        business_name: Optional business name.
        role: User role (customer/admin/partner).

    Returns:
        The created User object.
    """
    user = User(
        email=email,
        hashed_password=hashed_password,
        business_name=business_name,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_by_email(db: Session, email: str) -> User | None:
    """Find a user by email. Returns None if not found."""
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    """Find a user by UUID. Returns None if not found."""
    return db.query(User).filter(User.id == user_id).first()


def update_user(db: Session, user: User, **fields) -> User:
    """
    Update user fields.

    Usage:
        update_user(db, user, business_name="New Name", alert_threshold=500)
    """
    for key, value in fields.items():
        if hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def list_users(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    role: str | None = None,
) -> list[User]:
    """
    List users with pagination. Optionally filter by role.
    Used by the Admin module for user management.
    """
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.offset(skip).limit(limit).all()
