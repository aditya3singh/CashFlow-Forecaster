"""
Plaid service — wrapper around Plaid SDK.

Currently STUBBED with TODO markers.
Replace stubs with real Plaid SDK calls in Phase 2.
"""

from datetime import date

from app.core.logging_config import get_logger

logger = get_logger(__name__)


def create_link_token(user_id: str) -> str:
    """
    Create a Plaid Link token for the frontend.

    TODO: Replace with real Plaid SDK call:
        from plaid.api import plaid_api
        response = client.link_token_create(LinkTokenCreateRequest(...))
        return response.link_token
    """
    logger.info(f"[STUB] Creating link token for user {user_id}")
    return "link-sandbox-stubbed-token"


def exchange_public_token(public_token: str) -> tuple[str, str]:
    """
    Exchange a Plaid public token for an access token.

    Returns:
        Tuple of (access_token, item_id).

    IMPORTANT: The access_token MUST be encrypted with
    encryption.encrypt_token() BEFORE any database write.

    TODO: Replace with real Plaid SDK call:
        response = client.item_public_token_exchange(...)
        return (response.access_token, response.item_id)
    """
    logger.info("[STUB] Exchanging public token")
    return ("access-sandbox-stubbed-token", "item-sandbox-stubbed-id")


def fetch_transactions(
    access_token: str,
    start_date: date,
    end_date: date,
) -> list[dict]:
    """
    Fetch transactions from Plaid for a date range.

    Returns:
        List of transaction dicts with keys:
            transaction_id, amount, category, merchant_name, date

    TODO: Replace with real Plaid SDK call using transactions_sync
    with cursor/pagination (handle `has_more`).
    """
    logger.info(f"[STUB] Fetching transactions from {start_date} to {end_date}")
    return [
        {
            "transaction_id": "txn-stub-001",
            "amount": -45.50,
            "category": "Food and Drink",
            "merchant_name": "Cafe Luna",
            "date": str(start_date),
        },
        {
            "transaction_id": "txn-stub-002",
            "amount": 2500.00,
            "category": "Transfer",
            "merchant_name": "Stripe Payout",
            "date": str(start_date),
        },
    ]
