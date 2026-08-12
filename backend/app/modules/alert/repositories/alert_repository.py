"""
Alert repository — data access layer for alerts.

Handles alert creation, querying, and idempotency checks.
"""

import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.modules.alert.models.alert import Alert


def create_alert(
    db: Session,
    user_id: uuid.UUID,
    alert_type: str,
    shortfall_date: date,
    message: str,
    sent: bool = False,
) -> Alert:
    """
    Create a new alert record.

    Args:
        db: Database session.
        user_id: The user to alert.
        alert_type: Type of alert (e.g. "projected_shortfall").
        shortfall_date: The date of the projected shortfall.
        message: Human-readable alert message.
        sent: Whether the notification was actually delivered.

    Returns:
        The created Alert object.
    """
    alert = Alert(
        user_id=user_id,
        alert_type=alert_type,
        shortfall_date=shortfall_date,
        message=message,
        sent=sent,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def get_alerts_by_user(
    db: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Alert], int]:
    """
    Get alerts for a user with pagination.

    Returns:
        Tuple of (alert list, total count).
    """
    query = db.query(Alert).filter(Alert.user_id == user_id)
    total = query.count()
    alerts = (
        query.order_by(Alert.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return alerts, total


def has_alert_for_date(
    db: Session,
    user_id: uuid.UUID,
    shortfall_date: date,
) -> bool:
    """
    Check if an alert already exists for this user and shortfall date.

    Used by the nightly alert scheduler for idempotency — don't
    re-alert for the same projected shortfall every night.
    """
    return (
        db.query(Alert)
        .filter(
            Alert.user_id == user_id,
            Alert.shortfall_date == shortfall_date,
        )
        .first()
        is not None
    )
