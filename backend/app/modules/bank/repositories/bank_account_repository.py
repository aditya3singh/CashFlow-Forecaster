"""
Bank account repository — data access layer for bank accounts.

This is the ONLY place that talks to the database for bank accounts.
Business logic goes in account_service.py, not here.
"""

import uuid

from sqlalchemy.orm import Session

from app.modules.bank.models.bank_account import BankAccount


def create_account(
    db: Session,
    user_id: uuid.UUID,
    plaid_item_id: str,
    encrypted_access_token: bytes,
    institution_name: str | None = None,
    account_name: str | None = None,
    current_balance: float | None = None,
) -> BankAccount:
    """
    Create a new bank account record.

    Args:
        db: Database session.
        user_id: The owning user's UUID.
        plaid_item_id: Plaid item ID from token exchange.
        encrypted_access_token: Fernet-encrypted access token (NEVER plaintext).
        institution_name: Optional bank/institution name.
        account_name: Optional account name (e.g. "Checking").
        current_balance: Optional starting balance.

    Returns:
        The created BankAccount object.
    """
    account = BankAccount(
        user_id=user_id,
        plaid_item_id=plaid_item_id,
        encrypted_access_token=encrypted_access_token,
        institution_name=institution_name,
        account_name=account_name,
        current_balance=current_balance,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def get_accounts_by_user(db: Session, user_id: uuid.UUID) -> list[BankAccount]:
    """Get all bank accounts for a user."""
    return (
        db.query(BankAccount)
        .filter(BankAccount.user_id == user_id)
        .order_by(BankAccount.connected_at.desc())
        .all()
    )


def get_account_by_id(db: Session, account_id: uuid.UUID) -> BankAccount | None:
    """Find a bank account by ID."""
    return db.query(BankAccount).filter(BankAccount.id == account_id).first()


def get_active_accounts(db: Session) -> list[BankAccount]:
    """
    Get all active bank accounts across all users.
    Used by the daily sync job.
    """
    return (
        db.query(BankAccount)
        .filter(BankAccount.status == "active")
        .all()
    )


def update_account(db: Session, account: BankAccount, **fields) -> BankAccount:
    """
    Update bank account fields.

    Usage:
        update_account(db, account, status="reauth_required", last_synced_at=now)
    """
    for key, value in fields.items():
        if hasattr(account, key):
            setattr(account, key, value)
    db.commit()
    db.refresh(account)
    return account
