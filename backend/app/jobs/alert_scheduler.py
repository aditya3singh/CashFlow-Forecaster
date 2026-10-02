"""
Alert scheduler job — regenerates forecasts and sends shortfall alerts.

Run via cron AFTER daily_sync completes, or manually:
    python -m app.jobs.alert_scheduler

This is a SCRIPT, not an HTTP endpoint. It runs in the scheduler
process, not the request-serving API process.

Flow:
    1. Get all users who have at least one active bank account
    2. For each user:
       a. Regenerate forecast (forces fresh computation)
       b. Check for shortfall against user's alert threshold
       c. If shortfall found AND not already alerted → send alert
"""

import uuid
from decimal import Decimal

from sqlalchemy import distinct

from app.core.logging_config import get_logger, setup_logging
from app.database import SessionLocal
from app.modules.alert.services import alert_service
from app.modules.auth.repositories import user_repository
from app.modules.bank.models.bank_account import BankAccount
from app.modules.forecast.services import forecast_service

logger = get_logger(__name__)


def run():
    """
    Execute the nightly alert check for all users with active accounts.

    For each user:
    1. Generate a fresh forecast
    2. Detect shortfall
    3. Send alert if needed (with idempotency)
    """
    setup_logging(level="INFO")
    logger.info("=== Alert scheduler job started ===")

    db = SessionLocal()
    try:
        # Get distinct user IDs with active bank accounts
        user_ids = (
            db.query(distinct(BankAccount.user_id))
            .filter(BankAccount.status == "active")
            .all()
        )
        user_ids = [uid[0] for uid in user_ids]

        logger.info(f"Found {len(user_ids)} users with active accounts")

        alerts_sent = 0
        alerts_skipped = 0

        for user_id in user_ids:
            try:
                # Get user for email and threshold
                user = user_repository.get_by_id(db, user_id)
                if not user or not user.is_active:
                    continue

                threshold = float(user.alert_threshold)

                # Generate fresh forecast
                forecast_response = forecast_service.get_forecast(
                    db=db,
                    user_id=str(user_id),
                    threshold=threshold,
                )

                # Check for shortfall
                if forecast_response.shortfall:
                    sent = alert_service.send_shortfall_alert(
                        db=db,
                        user_id=user_id,
                        user_email=user.email,
                        shortfall_date=forecast_response.shortfall.date,
                        projected_balance=forecast_response.shortfall.projected_balance,
                        business_name=user.business_name,
                    )
                    if sent:
                        alerts_sent += 1
                    else:
                        alerts_skipped += 1

            except Exception as e:
                logger.error(
                    f"Failed to process alerts for user {user_id}: {e}"
                )

        logger.info(
            f"=== Alert scheduler completed: {alerts_sent} sent, "
            f"{alerts_skipped} skipped (already alerted) ==="
        )

    finally:
        db.close()


if __name__ == "__main__":
    run()
