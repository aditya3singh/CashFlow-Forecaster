"""
Transaction service — business logic for transaction operations.

Controller → Service → Repository → Database
              ^^^^^^
              You are here.

Handles listing, manual overrides, and sync orchestration.
"""

import uuid
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.core.encryption import decrypt_token
from app.core.exceptions import NotFoundException, ValidationException
from app.core.logging_config import get_logger
from app.modules.bank.models.bank_account import BankAccount
from app.modules.bank.repositories import bank_account_repository
from app.modules.bank.services import plaid_service
from app.modules.transaction.repositories import transaction_repository
from app.modules.transaction.schemas.transaction_schemas import (
    ManualOverrideRequest,
    ManualOverrideResponse,
    TransactionListResponse,
    TransactionResponse,
)

logger = get_logger(__name__)


def list_transactions(
    db: Session,
    user_id: str,
    start_date: date | None = None,
    end_date: date | None = None,
    account_id: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> TransactionListResponse:
    """
    List transactions for the authenticated user.

    If account_id is provided, filters to that account.
    Otherwise returns transactions across all user's accounts.
    """
    if account_id:
        # Verify the account belongs to this user
        account = bank_account_repository.get_account_by_id(
            db, uuid.UUID(account_id)
        )
        if not account or str(account.user_id) != user_id:
            raise NotFoundException("Account not found")

        txns, total = transaction_repository.get_transactions(
            db=db,
            bank_account_id=uuid.UUID(account_id),
            start_date=start_date,
            end_date=end_date,
            skip=skip,
            limit=limit,
        )
    else:
        # Get all accounts for user, then fetch transactions
        accounts = bank_account_repository.get_accounts_by_user(
            db, uuid.UUID(user_id)
        )
        account_ids = [a.id for a in accounts]

        if not account_ids:
            return TransactionListResponse(
                transactions=[], total=0, skip=skip, limit=limit
            )

        all_txns = transaction_repository.get_transactions_for_user(
            db=db,
            account_ids=account_ids,
            start_date=start_date,
            end_date=end_date,
        )
        total = len(all_txns)
        txns = all_txns[skip : skip + limit]

    return TransactionListResponse(
        transactions=[
            TransactionResponse(
                id=str(t.id),
                bank_account_id=str(t.bank_account_id),
                amount=float(t.amount),
                category=t.category,
                merchant_name=t.merchant_name,
                description=t.description,
                date=t.date,
                is_manual_override=t.is_manual_override,
            )
            for t in txns
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


def create_manual_override(
    db: Session,
    user_id: str,
    request: ManualOverrideRequest,
) -> ManualOverrideResponse:
    """
    Create a manual override transaction.

    Manual overrides represent known future events (e.g. "Invoice #204 due")
    that the user wants factored into the forecast projection.

    The override is attached to the user's first active bank account.
    """
    # Get user's accounts — need at least one to attach the override to
    accounts = bank_account_repository.get_accounts_by_user(
        db, uuid.UUID(user_id)
    )
    if not accounts:
        raise ValidationException(
            "Connect a bank account before adding manual overrides"
        )

    # Attach to the first active account
    target_account = next(
        (a for a in accounts if a.status == "active"),
        accounts[0],
    )

    txn = transaction_repository.create_manual_override(
        db=db,
        bank_account_id=target_account.id,
        amount=request.amount,
        override_date=request.expected_date,
        description=request.description,
    )

    logger.info(
        f"Manual override created: {txn.id} for user {user_id} "
        f"({request.amount} on {request.expected_date})"
    )

    return ManualOverrideResponse(
        id=str(txn.id),
        date=txn.date,
        amount=float(txn.amount),
        description=txn.description,
    )


def sync_account_transactions(
    db: Session,
    account: BankAccount,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    """
    Sync transactions for a single bank account from Plaid.

    Called by the daily_sync job. Decrypts the access token,
    fetches transactions, and upserts them.

    Args:
        db: Database session.
        account: The BankAccount to sync.
        start_date: Start of date range (default: 90 days ago).
        end_date: End of date range (default: today).

    Returns:
        Number of transactions synced.
    """
    if not start_date:
        start_date = date.today() - timedelta(days=90)
    if not end_date:
        end_date = date.today()

    # Decrypt the stored access token
    access_token = decrypt_token(account.encrypted_access_token)

    # Fetch from Plaid
    raw_transactions = plaid_service.fetch_transactions(
        access_token=access_token,
        start_date=start_date,
        end_date=end_date,
    )

    # Upsert into DB
    count = transaction_repository.upsert_transactions(
        db=db,
        bank_account_id=account.id,
        transactions=raw_transactions,
    )

    logger.info(
        f"Synced {count} transactions for account {account.id}"
    )

    return count
