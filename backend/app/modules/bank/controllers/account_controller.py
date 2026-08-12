"""
Account controller — HTTP route handlers for bank account operations.

Controller → Service → Repository → Database
^^^^^^^^^
You are here.

Thin layer: receives HTTP request, calls service, returns response.
No business logic lives here.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id
from app.database import get_db
from app.modules.bank.schemas.bank_account_schemas import (
    BankAccountResponse,
    ExchangeTokenRequest,
    ExchangeTokenResponse,
    LinkTokenResponse,
)
from app.modules.bank.services import account_service

router = APIRouter()


@router.post(
    "/link-token",
    response_model=LinkTokenResponse,
    summary="Create a Plaid Link token",
    description="Returns a link_token used to open the Plaid Link widget in the frontend.",
)
def create_link_token(
    current_user: dict = Depends(get_current_user_id),
):
    """
    Create a Plaid Link token for the authenticated user.

    The frontend uses this token to open the Plaid Link widget,
    which lets the user securely connect their bank.
    """
    return account_service.create_link_token(current_user["user_id"])


@router.post(
    "/exchange-token",
    response_model=ExchangeTokenResponse,
    status_code=201,
    summary="Exchange a Plaid public token",
    description="Exchanges a public token from Plaid Link for a permanent access token. "
    "The access token is encrypted before storage.",
)
def exchange_token(
    request: ExchangeTokenRequest,
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Complete the bank connection flow.

    After the user finishes Plaid Link, the frontend sends the public_token here.
    We exchange it for a permanent access token, encrypt it, and store the account.
    """
    return account_service.exchange_token(
        db=db,
        user_id=current_user["user_id"],
        public_token=request.public_token,
    )


@router.get(
    "/",
    response_model=list[BankAccountResponse],
    summary="List connected bank accounts",
    description="Returns all bank accounts connected by the current user.",
)
def list_accounts(
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List all connected bank accounts for the authenticated user."""
    return account_service.list_accounts(db, current_user["user_id"])
