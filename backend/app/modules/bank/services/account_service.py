"""
Account service — business logic for bank account operations.

Controller → Service → Repository → Database
              ^^^^^^
              You are here.

Orchestrates Plaid calls, token encryption, and database operations.
"""

from datetime import date, timedelta
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
from app.modules.transaction.repositories import transaction_repository

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
    institution_name: str | None = None,
    account_name: str | None = None,
) -> ExchangeTokenResponse:
    """
    Exchange a Plaid public token for a permanent access token,
    encrypt it, and store the bank account.

    Flow:
        1. Exchange public token via Plaid → get access_token + item_id
        2. Encrypt access_token immediately (NEVER store plaintext)
        3. Fetch real balance + account metadata from Plaid
        4. Create BankAccount record in DB
        5. Sync initial transactions so forecast engine runs immediately
        6. Return the new account ID
    """
    # 1. Exchange token via Plaid
    access_token, item_id = plaid_service.exchange_public_token(public_token)

    # 2. Encrypt immediately
    encrypted_token = encrypt_token(access_token)

    # 3. Fetch real balance and account metadata from Plaid
    try:
        real_balance, plaid_inst_name, plaid_acct_name = (
            plaid_service.get_account_balance(access_token)
        )
    except Exception as e:
        logger.warning(
            f"Failed to fetch balance from Plaid, using defaults: {e}"
        )
        real_balance = 0.0
        plaid_inst_name = None
        plaid_acct_name = None

    # Use Plaid metadata if available, fall back to user-provided or defaults
    inst_name = institution_name or plaid_inst_name or "Connected Bank"
    acct_name = account_name or plaid_acct_name or "Checking Account"
    initial_balance = real_balance

    # 4. Store in DB
    account = bank_account_repository.create_account(
        db=db,
        user_id=uuid.UUID(user_id),
        plaid_item_id=item_id,
        encrypted_access_token=encrypted_token,
        institution_name=inst_name,
        account_name=acct_name,
        current_balance=initial_balance,
    )

    # 5. Sync initial transactions so forecast engine runs immediately
    start_date = date.today() - timedelta(days=60)
    end_date = date.today()
    txns = plaid_service.fetch_transactions(access_token, start_date, end_date)
    transaction_repository.upsert_transactions(db, account.id, txns)

    logger.info(f"Bank account connected: {account.id} ({inst_name}) for user {user_id}")

    # 6. Return
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
