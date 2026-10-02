"""
Plaid service — wrapper around the Plaid Python SDK.

All Plaid API interaction is isolated here. No other module should
import plaid directly — they call these functions instead.

Environment variables used (via app.config.settings):
    PLAID_CLIENT_ID  — your Plaid client ID
    PLAID_SECRET     — your Plaid secret key
    PLAID_ENV        — "sandbox", "development", or "production"
"""

from datetime import date

import plaid
from plaid.api import plaid_api
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from plaid.model.accounts_balance_get_request import AccountsBalanceGetRequest

from app.config import settings
from app.core.exceptions import AppException
from app.core.logging_config import get_logger

logger = get_logger(__name__)

# ── Plaid environment mapping ──
# Note: plaid-python v26 only exposes Sandbox and Production.
# Plaid's "development" environment uses the production host with limited data.
_PLAID_ENV_MAP = {
    "sandbox": plaid.Environment.Sandbox,
    "development": plaid.Environment.Production,
    "production": plaid.Environment.Production,
}


def _get_plaid_client() -> plaid_api.PlaidApi:
    """
    Create a configured Plaid API client.

    Uses PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV from settings.
    Raises AppException if credentials are missing.
    """
    if not settings.PLAID_CLIENT_ID or not settings.PLAID_SECRET:
        raise AppException(
            "Plaid credentials not configured. "
            "Set PLAID_CLIENT_ID and PLAID_SECRET in .env",
            status_code=500,
        )

    env_url = _PLAID_ENV_MAP.get(
        settings.PLAID_ENV.lower(), plaid.Environment.Sandbox
    )

    configuration = plaid.Configuration(
        host=env_url,
        api_key={
            "clientId": settings.PLAID_CLIENT_ID,
            "secret": settings.PLAID_SECRET,
        },
    )

    api_client = plaid.ApiClient(configuration)
    return plaid_api.PlaidApi(api_client)


def _handle_plaid_error(e: plaid.ApiException) -> None:
    """
    Translate Plaid API errors into application exceptions.

    Detects specific error codes (ITEM_LOGIN_REQUIRED,
    INVALID_ACCESS_TOKEN) and raises appropriate AppExceptions.
    """
    try:
        error_body = e.body
        # plaid.ApiException.body is a JSON string
        import json
        error_data = json.loads(error_body) if isinstance(error_body, str) else {}
    except Exception:
        error_data = {}

    error_code = error_data.get("error_code", "")
    error_message = error_data.get("error_message", str(e))

    logger.error(f"Plaid API error: code={error_code}, message={error_message}")

    if error_code == "ITEM_LOGIN_REQUIRED":
        raise AppException(
            "Bank connection expired — please re-link your account",
            status_code=401,
        )
    elif error_code == "INVALID_ACCESS_TOKEN":
        raise AppException(
            "Invalid bank connection — please reconnect your account",
            status_code=400,
        )
    elif error_code == "INVALID_PUBLIC_TOKEN":
        raise AppException(
            "Invalid or expired link token — please restart the connection flow",
            status_code=400,
        )
    else:
        raise AppException(
            f"Bank service error: {error_message}",
            status_code=502,
        )


def create_link_token(user_id: str) -> str:
    """
    Create a Plaid Link token for the frontend.

    The frontend uses this token to open the Plaid Link widget,
    which lets the user securely connect their bank account.

    Args:
        user_id: The authenticated user's UUID string.

    Returns:
        A link_token string for the Plaid Link widget.

    Raises:
        AppException: If Plaid credentials are missing or API call fails.
    """
    client = _get_plaid_client()

    request = LinkTokenCreateRequest(
        user=LinkTokenCreateRequestUser(client_user_id=user_id),
        client_name=settings.APP_NAME,
        products=[Products("transactions")],
        country_codes=[CountryCode("US")],
        language="en",
    )

    try:
        response = client.link_token_create(request)
        logger.info(f"Link token created for user {user_id}")
        return response.link_token
    except plaid.ApiException as e:
        _handle_plaid_error(e)


def exchange_public_token(public_token: str) -> tuple[str, str]:
    """
    Exchange a Plaid public token for a permanent access token.

    Called after the user completes the Plaid Link flow. The returned
    access_token MUST be encrypted with encryption.encrypt_token()
    BEFORE any database write.

    Args:
        public_token: The public_token from Plaid Link's onSuccess callback.

    Returns:
        Tuple of (access_token, item_id).

    Raises:
        AppException: If the token is invalid or Plaid API fails.
    """
    client = _get_plaid_client()

    request = ItemPublicTokenExchangeRequest(public_token=public_token)

    try:
        response = client.item_public_token_exchange(request)
        access_token = response.access_token
        item_id = response.item_id

        logger.info(f"Public token exchanged successfully (item_id={item_id})")
        return (access_token, item_id)
    except plaid.ApiException as e:
        _handle_plaid_error(e)


def get_account_balance(
    access_token: str,
) -> tuple[float, str | None, str | None]:
    """
    Fetch the current account balance and metadata from Plaid.

    Returns data for the FIRST account associated with the access token.
    In most SMB use cases this is the primary checking account.

    Args:
        access_token: The decrypted Plaid access token.

    Returns:
        Tuple of (current_balance, institution_name, account_name).
        institution_name and account_name may be None.

    Raises:
        AppException: If the token is invalid/expired or API fails.
    """
    client = _get_plaid_client()

    request = AccountsBalanceGetRequest(access_token=access_token)

    try:
        response = client.accounts_balance_get(request)

        if not response.accounts:
            logger.warning("No accounts returned from Plaid balance call")
            return (0.0, None, None)

        # Use the first account (primary checking)
        account = response.accounts[0]
        balance = (
            float(account.balances.current)
            if account.balances.current is not None
            else 0.0
        )

        # Get institution name from the item if available
        institution_name = None
        if hasattr(response, "item") and response.item:
            institution_name = getattr(
                response.item, "institution_id", None
            )

        account_name = account.name or account.official_name

        logger.info(
            f"Balance fetched: ${balance:,.2f} "
            f"(account={account_name})"
        )
        return (balance, institution_name, account_name)

    except plaid.ApiException as e:
        _handle_plaid_error(e)


def fetch_transactions(
    access_token: str,
    start_date: date,
    end_date: date,
) -> list[dict]:
    """
    Fetch transactions from Plaid for a date range.

    Handles pagination automatically — Plaid returns at most 500
    transactions per request, so this loops until all are fetched.

    Args:
        access_token: The decrypted Plaid access token.
        start_date: Start of the date range (inclusive).
        end_date: End of the date range (inclusive).

    Returns:
        List of transaction dicts with keys:
            transaction_id, amount, category, merchant_name, date

    Raises:
        AppException: If the token is invalid/expired or API fails.
    """
    client = _get_plaid_client()

    all_transactions = []
    has_more = True
    offset = 0
    page_size = 500

    try:
        while has_more:
            request = TransactionsGetRequest(
                access_token=access_token,
                start_date=start_date,
                end_date=end_date,
                options=TransactionsGetRequestOptions(
                    count=page_size,
                    offset=offset,
                ),
            )

            response = client.transactions_get(request)

            for txn in response.transactions:
                # Plaid amounts: positive = money spent, negative = money received
                # Our convention: positive = income, negative = expense
                # So we invert the sign
                amount = -float(txn.amount)

                category = "Other"
                if txn.category:
                    category = txn.category[0]  # Primary category

                all_transactions.append({
                    "transaction_id": txn.transaction_id,
                    "amount": amount,
                    "category": category,
                    "merchant_name": txn.merchant_name or txn.name or "Unknown",
                    "date": txn.date.isoformat(),
                })

            offset += len(response.transactions)
            has_more = offset < response.total_transactions

        logger.info(
            f"Fetched {len(all_transactions)} transactions "
            f"from {start_date} to {end_date}"
        )
        return all_transactions

    except plaid.ApiException as e:
        _handle_plaid_error(e)
