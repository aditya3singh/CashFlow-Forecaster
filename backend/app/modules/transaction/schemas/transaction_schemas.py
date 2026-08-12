"""
Transaction schemas — Pydantic models for transaction requests/responses.
"""

from datetime import date

from pydantic import BaseModel, field_validator


class TransactionResponse(BaseModel):
    """Response for a single transaction."""
    id: str
    bank_account_id: str
    amount: float
    category: str | None
    merchant_name: str | None
    description: str | None
    date: date
    is_manual_override: bool

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    """Paginated list of transactions."""
    transactions: list[TransactionResponse]
    total: int
    skip: int
    limit: int


class ManualOverrideRequest(BaseModel):
    """Request body for POST /api/v1/transactions/manual-override"""
    description: str
    amount: float
    expected_date: date

    @field_validator("expected_date")
    @classmethod
    def date_must_be_future(cls, v: date) -> date:
        """Manual overrides are for future known events, not backdating history."""
        if v < date.today():
            raise ValueError("Expected date must be today or in the future")
        return v


class ManualOverrideResponse(BaseModel):
    """Response for a created manual override."""
    id: str
    date: date
    amount: float
    description: str | None
    is_manual_override: bool = True
