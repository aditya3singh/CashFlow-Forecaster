"""
Alert service — business logic for shortfall notifications.

Controller → Service → Repository → Database
              ^^^^^^
              You are here.

Handles alert formatting, delivery (stubbed — email via SendGrid in future),
and alert history retrieval.
"""

import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.core.constants import AlertType
from app.core.logging_config import get_logger
from app.modules.alert.repositories import alert_repository
from app.modules.alert.schemas.alert_schemas import (
    AlertListResponse,
    AlertResponse,
)

logger = get_logger(__name__)


def send_shortfall_alert(
    db: Session,
    user_id: uuid.UUID,
    user_email: str,
    shortfall_date: date,
    projected_balance: float,
) -> bool:
    """
    Send a shortfall alert notification to a user.

    Currently STUBBED — logs the alert instead of sending email.
    When ready, replace with SendGrid integration.

    Flow:
        1. Check idempotency — skip if already alerted for this date
        2. Format the message
        3. Send notification (stubbed: log only)
        4. Record the alert in DB

    Args:
        db: Database session.
        user_id: The user to alert.
        user_email: The user's email for notification delivery.
        shortfall_date: The projected shortfall date.
        projected_balance: The projected balance on that date.

    Returns:
        True if alert was sent, False if skipped (already alerted).
    """
    # 1. Idempotency check
    if alert_repository.has_alert_for_date(db, user_id, shortfall_date):
        logger.info(
            f"Alert already exists for user {user_id} on {shortfall_date} — skipping"
        )
        return False

    # 2. Format message
    message = (
        f"⚠️ Projected cashflow shortfall on {shortfall_date.strftime('%B %d, %Y')}. "
        f"Your projected balance will be ${projected_balance:,.2f}. "
        f"Consider adjusting upcoming expenses or securing additional funds."
    )

    # 3. Send notification (STUBBED)
    # TODO: Replace with real SendGrid call:
    #   from sendgrid import SendGridAPIClient
    #   sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
    #   ...
    logger.info(
        f"[STUB] Would send alert email to {user_email}: {message}"
    )
    sent = True  # In production, set based on SendGrid response

    # 4. Record in DB
    alert_repository.create_alert(
        db=db,
        user_id=user_id,
        alert_type=AlertType.PROJECTED_SHORTFALL.value,
        shortfall_date=shortfall_date,
        message=message,
        sent=sent,
    )

    logger.info(
        f"Shortfall alert created for user {user_id}: "
        f"{shortfall_date} (${projected_balance:,.2f})"
    )

    return True


def get_alert_history(
    db: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 50,
) -> AlertListResponse:
    """
    Get the alert history for a user.

    Returns:
        AlertListResponse with paginated alerts.
    """
    alerts, total = alert_repository.get_alerts_by_user(
        db=db,
        user_id=uuid.UUID(user_id),
        skip=skip,
        limit=limit,
    )

    return AlertListResponse(
        alerts=[
            AlertResponse(
                id=str(a.id),
                alert_type=a.alert_type,
                shortfall_date=a.shortfall_date,
                message=a.message,
                sent=a.sent,
                created_at=a.created_at,
            )
            for a in alerts
        ],
        total=total,
    )
