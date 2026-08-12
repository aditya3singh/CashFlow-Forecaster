"""
Account service — business logic for bank account operations.

Controller → Service → Repository → Database
              ^^^^^^
              You are here.

Orchestrates Plaid calls, token encryption, and database operations.
"""

import uuid

from sqlalchemy.orm import Session

from app.core.encryption import encrypt_token
from app.core.logging_config import get_logger
from app.modules.bank.repositories import bank_account_repository
from app.modules.bank.schemas.bank_account_schemas import (
    BankAccountResponse,
    ExchangeTokenResponse,
    LinkTokenResponse,
)
from app.modules.bank.services import plaid_service

logger = get_logger(__name__)


def create_link_token(user_id: str) -> LinkTokenResponse:
    """
    Create a Plaid Link token so the frontend can open the Link widget.

    Args:
        user_id: The authenticated user's ID.

    Returns:
        LinkTokenResponse with the link_token.
    """
    link_token = plaid_service.create_link_token(user_id)
    return LinkTokenResponse(link_token=link_token)


def exchange_token(
    db: Session,
    user_id: str,
    public_token: str,
) -> ExchangeTokenResponse:
    """
    Exchange a Plaid public token for a permanent access token,
    encrypt it, and store the bank account.

    Flow:
        1. Exchange public token via Plaid → get access_token + item_id
        2. Encrypt access_token immediately (NEVER store plaintext)
        3. Create BankAccount record in DB
        4. Return the new account ID

    Security:
        The plaintext access_token only exists in local variables
        and is never logged or persisted.
    """
    # 1. Exchange token via Plaid
    access_token, item_id = plaid_service.exchange_public_token(public_token)

    # 2. Encrypt immediately
    encrypted_token = encrypt_token(access_token)

    # 3. Store in DB
    account = bank_account_repository.create_account(
        db=db,
        user_id=uuid.UUID(user_id),
        plaid_item_id=item_id,
        encrypted_access_token=encrypted_token,
    )

    logger.info(f"Bank account connected: {account.id} for user {user_id}")

    # 4. Return
    return ExchangeTokenResponse(bank_account_id=str(account.id))


def list_accounts(db: Session, user_id: str) -> list[BankAccountResponse]:
    """
    List all connected bank accounts for a user.

    Returns:
        List of BankAccountResponse objects.
    """
    accounts = bank_account_repository.get_accounts_by_user(
        db, uuid.UUID(user_id)
    )

    return [
        BankAccountResponse(
            id=str(a.id),
            institution_name=a.institution_name,
            account_name=a.account_name,
            current_balance=float(a.current_balance) if a.current_balance is not None else None,
            status=a.status,
            last_synced_at=a.last_synced_at.isoformat() if a.last_synced_at else None,
            connected_at=a.connected_at.isoformat(),
        )
        for a in accounts
    ]
