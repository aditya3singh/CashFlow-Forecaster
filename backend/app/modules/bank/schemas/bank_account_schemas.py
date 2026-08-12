"""
Bank account schemas — Pydantic models for account-related requests/responses.
"""

from pydantic import BaseModel


class ExchangeTokenRequest(BaseModel):
    """Request body for POST /api/v1/accounts/exchange-token"""
    public_token: str


class LinkTokenResponse(BaseModel):
    """Response for POST /api/v1/accounts/link-token"""
    link_token: str


class ExchangeTokenResponse(BaseModel):
    """Response for POST /api/v1/accounts/exchange-token"""
    bank_account_id: str


class BankAccountResponse(BaseModel):
    """Response for a single bank account in listing."""
    id: str
    institution_name: str | None
    account_name: str | None
    current_balance: float | None
    status: str
    last_synced_at: str | None
    connected_at: str

    class Config:
        from_attributes = True
