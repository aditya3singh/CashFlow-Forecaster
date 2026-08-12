"""
Daily sync job — pulls new transactions from Plaid for all active accounts.

Run via cron or manually:
    python -m app.jobs.daily_sync

This is a SCRIPT, not an HTTP endpoint. It runs in the scheduler
process, not the request-serving API process.

Flow:
    1. Query all bank accounts with status='active'
    2. For each account:
       a. Decrypt access token
       b. Fetch transactions from Plaid
       c. Upsert into DB
       d. Update last_synced_at
       e. Log the sync result
    3. Errors are per-account — one failure doesn't stop the loop
"""

from datetime import datetime, timezone

from app.core.logging_config import get_logger, setup_logging
from app.database import SessionLocal
from app.modules.bank.models.sync_log import SyncLog
from app.modules.bank.repositories import bank_account_repository
from app.modules.transaction.services import transaction_service

logger = get_logger(__name__)


def run():
    """
    Execute the daily transaction sync for all active bank accounts.

    Creates a SyncLog entry for each account to track success/failure.
    """
    setup_logging(level="INFO")
    logger.info("=== Daily sync job started ===")

    db = SessionLocal()
    try:
        accounts = bank_account_repository.get_active_accounts(db)
        logger.info(f"Found {len(accounts)} active accounts to sync")

        success_count = 0
        error_count = 0

        for account in accounts:
            sync_log = SyncLog(
                bank_account_id=account.id,
                status="running",
            )
            db.add(sync_log)
            db.commit()

            try:
                # Sync transactions (decrypts token internally)
                count = transaction_service.sync_account_transactions(
                    db=db,
                    account=account,
                )

                # Update account
                bank_account_repository.update_account(
                    db, account,
                    last_synced_at=datetime.now(timezone.utc),
                )

                # Update sync log
                sync_log.status = "success"
                sync_log.transactions_synced = count
                sync_log.completed_at = datetime.now(timezone.utc)
                db.commit()

                success_count += 1
                logger.info(
                    f"Synced account {account.id}: {count} transactions"
                )

            except Exception as e:
                # Per-account error handling — don't stop the loop
                sync_log.status = "failed"
                sync_log.error_message = str(e)
                sync_log.completed_at = datetime.now(timezone.utc)
                db.commit()

                # Set account status if it's an auth issue
                if "ITEM_LOGIN_REQUIRED" in str(e):
                    bank_account_repository.update_account(
                        db, account, status="reauth_required"
                    )
                    logger.warning(
                        f"Account {account.id} requires re-authentication"
                    )
                else:
                    logger.error(
                        f"Failed to sync account {account.id}: {e}"
                    )

                error_count += 1

        logger.info(
            f"=== Daily sync completed: {success_count} success, "
            f"{error_count} errors ==="
        )

    finally:
        db.close()


if __name__ == "__main__":
    run()
