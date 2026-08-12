"""
Transaction repository — data access layer for transactions.

Handles both Plaid-synced transactions and manual overrides.
Upsert logic on plaid_transaction_id ensures idempotent syncs.
"""

import uuid
from datetime import date

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.modules.transaction.models.transaction import Transaction


def upsert_transactions(
    db: Session,
    bank_account_id: uuid.UUID,
    transactions: list[dict],
) -> int:
    """
    Upsert transactions from Plaid — idempotent on plaid_transaction_id.

    Uses PostgreSQL ON CONFLICT DO UPDATE to handle re-syncs without
    double-counting.

    Args:
        db: Database session.
        bank_account_id: The bank account these transactions belong to.
        transactions: List of dicts from plaid_service.fetch_transactions().

    Returns:
        Number of transactions upserted.
    """
    if not transactions:
        return 0

    for txn in transactions:
        stmt = pg_insert(Transaction).values(
            bank_account_id=bank_account_id,
            plaid_transaction_id=txn["transaction_id"],
            amount=txn["amount"],
            category=txn.get("category"),
            merchant_name=txn.get("merchant_name"),
            date=txn["date"],
            is_manual_override=False,
        ).on_conflict_do_update(
            index_elements=["plaid_transaction_id"],
            set_={
                "amount": txn["amount"],
                "category": txn.get("category"),
                "merchant_name": txn.get("merchant_name"),
            },
        )
        db.execute(stmt)

    db.commit()
    return len(transactions)


def get_transactions(
    db: Session,
    bank_account_id: uuid.UUID,
    start_date: date | None = None,
    end_date: date | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Transaction], int]:
    """
    Get transactions for a bank account with optional date filtering.

    Returns:
        Tuple of (transaction list, total count).
    """
    query = db.query(Transaction).filter(
        Transaction.bank_account_id == bank_account_id
    )

    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)

    total = query.count()
    transactions = (
        query.order_by(Transaction.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return transactions, total


def get_transactions_for_user(
    db: Session,
    account_ids: list[uuid.UUID],
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[Transaction]:
    """
    Get all transactions across multiple accounts (for forecast engine).

    Args:
        db: Database session.
        account_ids: List of bank account UUIDs owned by the user.
        start_date: Optional start date filter.
        end_date: Optional end date filter.

    Returns:
        List of Transaction objects.
    """
    if not account_ids:
        return []

    query = db.query(Transaction).filter(
        Transaction.bank_account_id.in_(account_ids)
    )

    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)

    return query.order_by(Transaction.date.asc()).all()


def get_manual_overrides_for_user(
    db: Session,
    account_ids: list[uuid.UUID],
) -> list[Transaction]:
    """
    Get all future manual overrides across the user's accounts.
    Used by the forecast engine.
    """
    if not account_ids:
        return []

    return (
        db.query(Transaction)
        .filter(
            Transaction.bank_account_id.in_(account_ids),
            Transaction.is_manual_override.is_(True),
            Transaction.date >= func.current_date(),
        )
        .order_by(Transaction.date.asc())
        .all()
    )


def create_manual_override(
    db: Session,
    bank_account_id: uuid.UUID,
    amount: float,
    override_date: date,
    description: str | None = None,
) -> Transaction:
    """
    Create a manual override transaction.

    Manual overrides represent known future events (invoices, bills)
    that the user wants factored into the forecast.
    """
    txn = Transaction(
        bank_account_id=bank_account_id,
        amount=amount,
        date=override_date,
        description=description,
        is_manual_override=True,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn
