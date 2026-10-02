"""
Payment method service — business logic for payment method operations.

Controller → Service → Repository → Database
              ^^^^^^
              You are here.

Handles card brand detection, masking, encryption, and validation orchestration.
"""

import re
import uuid

from sqlalchemy.orm import Session

from app.core.logging_config import get_logger
from app.modules.payment.repositories import payment_method_repository
from app.modules.payment.schemas.payment_method_schemas import (
    AddBankAccountRequest,
    AddCardRequest,
    AddUPIRequest,
    PaymentMethodResponse,
    PaymentMethodListResponse,
)

logger = get_logger(__name__)


# ── Card Brand Detection ──

CARD_BRAND_PATTERNS = [
    (r"^4[0-9]{12}(?:[0-9]{3})?$", "visa"),
    (r"^5[1-5][0-9]{14}$", "mastercard"),
    (r"^2(?:2[2-9][1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12}$", "mastercard"),
    (r"^3[47][0-9]{13}$", "amex"),
    (r"^6(?:011|5[0-9]{2}|4[4-9][0-9]|22[1-9])[0-9]{12}$", "discover"),
    (r"^6[0-9]{15}$", "rupay"),
    (r"^35(?:2[89]|[3-8][0-9])[0-9]{12}$", "jcb"),
    (r"^3(?:0[0-5]|[68][0-9])[0-9]{11}$", "diners"),
]


def detect_card_brand(card_number: str) -> str:
    """Detect card brand from card number using known BIN patterns."""
    for pattern, brand in CARD_BRAND_PATTERNS:
        if re.match(pattern, card_number):
            return brand
    return "unknown"


def mask_account_number(account_number: str) -> str:
    """Mask a bank account number, showing only the last 4 digits."""
    if len(account_number) <= 4:
        return account_number
    masked_length = len(account_number) - 4
    return "X" * masked_length + account_number[-4:]


# ── Service Methods ──

def add_card(
    db: Session,
    user_id: str,
    request: AddCardRequest,
) -> PaymentMethodResponse:
    """
    Add a debit/credit card as a payment method.

    Flow:
        1. Detect card brand from number
        2. Extract last 4 digits (never store full number)
        3. Generate label if not provided
        4. Create record in DB
    """
    card_number = request.card_number  # Already validated by Pydantic (Luhn)
    brand = detect_card_brand(card_number)
    last_four = card_number[-4:]
    label = request.label or f"{brand.capitalize()} •••• {last_four}"

    # Check if this is the user's first payment method — make it default
    existing = payment_method_repository.get_methods_by_user(db, uuid.UUID(user_id))
    is_first = len(existing) == 0

    method = payment_method_repository.create_payment_method(
        db,
        user_id=uuid.UUID(user_id),
        method_type="card",
        label=label,
        last_four=last_four,
        card_brand=brand,
        card_expiry_month=request.expiry_month,
        card_expiry_year=request.expiry_year,
        cardholder_name=request.cardholder_name,
        is_default=is_first,
    )

    logger.info(f"Card added: {brand} ****{last_four} for user {user_id}")
    return _to_response(method)


def add_upi(
    db: Session,
    user_id: str,
    request: AddUPIRequest,
) -> PaymentMethodResponse:
    """
    Add a UPI ID as a payment method.

    Flow:
        1. UPI ID already validated by Pydantic
        2. Generate label from UPI ID
        3. Create record in DB
    """
    upi_id = request.upi_id  # Already validated by Pydantic
    label = request.label or upi_id

    existing = payment_method_repository.get_methods_by_user(db, uuid.UUID(user_id))
    is_first = len(existing) == 0

    method = payment_method_repository.create_payment_method(
        db,
        user_id=uuid.UUID(user_id),
        method_type="upi",
        label=label,
        upi_id=upi_id,
        is_default=is_first,
    )

    logger.info(f"UPI added: {upi_id} for user {user_id}")
    return _to_response(method)


def add_bank_account(
    db: Session,
    user_id: str,
    request: AddBankAccountRequest,
) -> PaymentMethodResponse:
    """
    Add a direct bank account as a payment method.

    Flow:
        1. Validate account numbers match
        2. Mask the account number
        3. Generate label from bank name
        4. Create record in DB
    """
    # Confirm account numbers match
    if request.account_number != request.confirm_account_number:
        raise ValueError("Account numbers do not match")

    masked = mask_account_number(request.account_number)
    bank_name = request.bank_name or "Bank Account"
    label = request.label or f"{bank_name} •••• {request.account_number[-4:]}"

    existing = payment_method_repository.get_methods_by_user(db, uuid.UUID(user_id))
    is_first = len(existing) == 0

    method = payment_method_repository.create_payment_method(
        db,
        user_id=uuid.UUID(user_id),
        method_type="bank_account",
        label=label,
        bank_name=bank_name,
        bank_ifsc=request.ifsc_code,
        bank_account_number_masked=masked,
        account_holder_name=request.account_holder_name,
        last_four=request.account_number[-4:],
        is_default=is_first,
    )

    logger.info(f"Bank account added: {bank_name} ****{request.account_number[-4:]} for user {user_id}")
    return _to_response(method)


def list_methods(
    db: Session,
    user_id: str,
) -> PaymentMethodListResponse:
    """List all active payment methods for a user."""
    methods = payment_method_repository.get_methods_by_user(db, uuid.UUID(user_id))
    return PaymentMethodListResponse(
        methods=[_to_response(m) for m in methods],
        total=len(methods),
    )


def set_default(
    db: Session,
    user_id: str,
    method_id: str,
) -> PaymentMethodResponse:
    """Set a payment method as the default. Clears previous default."""
    method = payment_method_repository.get_method_by_id(
        db, uuid.UUID(method_id), uuid.UUID(user_id)
    )
    if not method:
        raise ValueError("Payment method not found")

    # Clear existing defaults then set new one
    payment_method_repository.clear_default_for_user(db, uuid.UUID(user_id))
    updated = payment_method_repository.set_default(db, method)

    logger.info(f"Default payment method set: {method_id} for user {user_id}")
    return _to_response(updated)


def toggle_auto_pay(
    db: Session,
    user_id: str,
    method_id: str,
    enabled: bool,
) -> PaymentMethodResponse:
    """Toggle auto-pay on a payment method."""
    method = payment_method_repository.get_method_by_id(
        db, uuid.UUID(method_id), uuid.UUID(user_id)
    )
    if not method:
        raise ValueError("Payment method not found")

    updated = payment_method_repository.toggle_auto_pay(db, method, enabled)

    logger.info(f"Auto-pay {'enabled' if enabled else 'disabled'}: {method_id} for user {user_id}")
    return _to_response(updated)


def delete_method(
    db: Session,
    user_id: str,
    method_id: str,
) -> dict:
    """Soft-delete a payment method."""
    method = payment_method_repository.get_method_by_id(
        db, uuid.UUID(method_id), uuid.UUID(user_id)
    )
    if not method:
        raise ValueError("Payment method not found")

    payment_method_repository.soft_delete(db, method)
    logger.info(f"Payment method deleted: {method_id} for user {user_id}")
    return {"deleted": True, "id": method_id}


# ── Helper ──

def _to_response(method) -> PaymentMethodResponse:
    """Convert ORM model to Pydantic response."""
    return PaymentMethodResponse(
        id=str(method.id),
        method_type=method.method_type,
        label=method.label,
        last_four=method.last_four,
        card_brand=method.card_brand,
        card_expiry_month=method.card_expiry_month,
        card_expiry_year=method.card_expiry_year,
        cardholder_name=method.cardholder_name,
        upi_id=method.upi_id,
        bank_name=method.bank_name,
        bank_ifsc=method.bank_ifsc,
        bank_account_number_masked=method.bank_account_number_masked,
        account_holder_name=method.account_holder_name,
        is_default=method.is_default,
        is_auto_pay_enabled=method.is_auto_pay_enabled,
        status=method.status,
        created_at=method.created_at.isoformat(),
        updated_at=method.updated_at.isoformat(),
    )
