"""
Payment method repository — database operations for payment methods.

Controller → Service → Repository → Database
                       ^^^^^^^^^^
                       You are here.

Pure data-access layer. No business logic, no validation.
"""

import uuid

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.modules.payment.models.payment_method import PaymentMethod


def create_payment_method(
    db: Session,
    *,
    user_id: uuid.UUID,
    method_type: str,
    label: str,
    last_four: str | None = None,
    card_brand: str | None = None,
    card_expiry_month: int | None = None,
    card_expiry_year: int | None = None,
    cardholder_name: str | None = None,
    upi_id: str | None = None,
    bank_name: str | None = None,
    bank_ifsc: str | None = None,
    bank_account_number_masked: str | None = None,
    account_holder_name: str | None = None,
    gateway_token: bytes | None = None,
    is_default: bool = False,
    is_auto_pay_enabled: bool = False,
) -> PaymentMethod:
    """Create a new payment method record."""
    method = PaymentMethod(
        user_id=user_id,
        method_type=method_type,
        label=label,
        last_four=last_four,
        card_brand=card_brand,
        card_expiry_month=card_expiry_month,
        card_expiry_year=card_expiry_year,
        cardholder_name=cardholder_name,
        upi_id=upi_id,
        bank_name=bank_name,
        bank_ifsc=bank_ifsc,
        bank_account_number_masked=bank_account_number_masked,
        account_holder_name=account_holder_name,
        gateway_token=gateway_token,
        is_default=is_default,
        is_auto_pay_enabled=is_auto_pay_enabled,
    )
    db.add(method)
    db.commit()
    db.refresh(method)
    return method


def get_methods_by_user(
    db: Session,
    user_id: uuid.UUID,
) -> list[PaymentMethod]:
    """Get all active payment methods for a user, ordered by default first then newest."""
    return (
        db.query(PaymentMethod)
        .filter(
            PaymentMethod.user_id == user_id,
            PaymentMethod.status != "deleted",
        )
        .order_by(
            PaymentMethod.is_default.desc(),
            PaymentMethod.created_at.desc(),
        )
        .all()
    )


def get_method_by_id(
    db: Session,
    method_id: uuid.UUID,
    user_id: uuid.UUID,
) -> PaymentMethod | None:
    """Get a specific payment method by ID, scoped to user."""
    return (
        db.query(PaymentMethod)
        .filter(
            PaymentMethod.id == method_id,
            PaymentMethod.user_id == user_id,
            PaymentMethod.status != "deleted",
        )
        .first()
    )


def clear_default_for_user(
    db: Session,
    user_id: uuid.UUID,
) -> None:
    """Remove the 'default' flag from all payment methods for this user."""
    db.execute(
        update(PaymentMethod)
        .where(
            PaymentMethod.user_id == user_id,
            PaymentMethod.is_default.is_(True),
        )
        .values(is_default=False)
    )
    db.flush()


def set_default(
    db: Session,
    method: PaymentMethod,
) -> PaymentMethod:
    """Set a payment method as default (assumes other defaults are already cleared)."""
    method.is_default = True
    db.commit()
    db.refresh(method)
    return method


def toggle_auto_pay(
    db: Session,
    method: PaymentMethod,
    enabled: bool,
) -> PaymentMethod:
    """Toggle auto-pay on a payment method."""
    method.is_auto_pay_enabled = enabled
    db.commit()
    db.refresh(method)
    return method


def soft_delete(
    db: Session,
    method: PaymentMethod,
) -> None:
    """Soft-delete a payment method (set status to 'deleted')."""
    method.status = "deleted"
    method.is_default = False
    method.is_auto_pay_enabled = False
    db.commit()
