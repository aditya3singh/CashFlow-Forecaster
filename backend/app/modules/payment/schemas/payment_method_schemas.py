"""
Payment method schemas — Pydantic models for payment method requests/responses.

Separate request models for each method type (card, UPI, bank account),
plus shared response and update models.
"""

import re
from datetime import datetime

from pydantic import BaseModel, field_validator


# ── Card Request ──

class AddCardRequest(BaseModel):
    """Request body for adding a debit/credit card."""
    card_number: str
    expiry_month: int
    expiry_year: int
    cvv: str
    cardholder_name: str
    label: str | None = None

    @field_validator("card_number")
    @classmethod
    def validate_card_number(cls, v: str) -> str:
        """Strip spaces/dashes, then validate via Luhn algorithm."""
        cleaned = re.sub(r"[\s\-]", "", v)
        if not cleaned.isdigit() or len(cleaned) < 13 or len(cleaned) > 19:
            raise ValueError("Card number must be 13-19 digits")
        # Luhn check
        total = 0
        for i, digit in enumerate(reversed(cleaned)):
            n = int(digit)
            if i % 2 == 1:
                n *= 2
                if n > 9:
                    n -= 9
            total += n
        if total % 10 != 0:
            raise ValueError("Invalid card number (failed Luhn check)")
        return cleaned

    @field_validator("expiry_month")
    @classmethod
    def validate_expiry_month(cls, v: int) -> int:
        if v < 1 or v > 12:
            raise ValueError("Expiry month must be between 1 and 12")
        return v

    @field_validator("expiry_year")
    @classmethod
    def validate_expiry_year(cls, v: int) -> int:
        current_year = datetime.now().year
        if v < current_year:
            raise ValueError("Card has expired")
        if v > current_year + 20:
            raise ValueError("Invalid expiry year")
        return v

    @field_validator("cvv")
    @classmethod
    def validate_cvv(cls, v: str) -> str:
        if not v.isdigit() or len(v) not in (3, 4):
            raise ValueError("CVV must be 3 or 4 digits")
        return v

    @field_validator("cardholder_name")
    @classmethod
    def validate_cardholder_name(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Cardholder name is required")
        return v.strip()


# ── UPI Request ──

class AddUPIRequest(BaseModel):
    """Request body for adding a UPI ID."""
    upi_id: str
    label: str | None = None

    @field_validator("upi_id")
    @classmethod
    def validate_upi_id(cls, v: str) -> str:
        """Validate UPI ID format: username@bankhandle"""
        pattern = r"^[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+$"
        if not re.match(pattern, v.strip()):
            raise ValueError(
                "Invalid UPI ID format. Expected format: username@bankhandle "
                "(e.g., john@upi, user123@okhdfcbank)"
            )
        return v.strip().lower()


# ── Bank Account Request ──

class AddBankAccountRequest(BaseModel):
    """Request body for adding a direct bank account."""
    account_number: str
    confirm_account_number: str
    ifsc_code: str
    account_holder_name: str
    bank_name: str | None = None
    label: str | None = None

    @field_validator("account_number")
    @classmethod
    def validate_account_number(cls, v: str) -> str:
        cleaned = re.sub(r"\s", "", v)
        if not cleaned.isdigit() or len(cleaned) < 8 or len(cleaned) > 18:
            raise ValueError("Account number must be 8-18 digits")
        return cleaned

    @field_validator("ifsc_code")
    @classmethod
    def validate_ifsc(cls, v: str) -> str:
        """IFSC format: 4 letters + 0 + 6 alphanumerics (e.g., HDFC0001234)"""
        pattern = r"^[A-Z]{4}0[A-Z0-9]{6}$"
        if not re.match(pattern, v.strip().upper()):
            raise ValueError(
                "Invalid IFSC code. Expected format: 4 letters + 0 + 6 characters "
                "(e.g., HDFC0001234)"
            )
        return v.strip().upper()

    @field_validator("account_holder_name")
    @classmethod
    def validate_account_holder(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Account holder name is required")
        return v.strip()


# ── Update Requests ──

class SetDefaultRequest(BaseModel):
    """Request body for setting a payment method as default."""
    pass  # No body needed — method ID comes from path param


class ToggleAutoPayRequest(BaseModel):
    """Request body for toggling auto-pay on a payment method."""
    enabled: bool


# ── Response Models ──

class PaymentMethodResponse(BaseModel):
    """Response for a single payment method."""
    id: str
    method_type: str
    label: str

    # Card fields (masked)
    last_four: str | None = None
    card_brand: str | None = None
    card_expiry_month: int | None = None
    card_expiry_year: int | None = None
    cardholder_name: str | None = None

    # UPI fields
    upi_id: str | None = None

    # Bank account fields (masked)
    bank_name: str | None = None
    bank_ifsc: str | None = None
    bank_account_number_masked: str | None = None
    account_holder_name: str | None = None

    # Flags
    is_default: bool = False
    is_auto_pay_enabled: bool = False
    status: str = "active"

    # Timestamps
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class PaymentMethodListResponse(BaseModel):
    """Response for listing all payment methods."""
    methods: list[PaymentMethodResponse]
    total: int
