"""
Payment controller — HTTP route handlers for payment method operations.

Controller → Service → Repository → Database
^^^^^^^^^
You are here.

Thin layer: receives HTTP request, calls service, returns response.
No business logic lives here.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id
from app.database import get_db
from app.modules.payment.schemas.payment_method_schemas import (
    AddCardRequest,
    AddUPIRequest,
    AddBankAccountRequest,
    ToggleAutoPayRequest,
    PaymentMethodResponse,
    PaymentMethodListResponse,
)
from app.modules.payment.services import payment_method_service

router = APIRouter()


@router.post(
    "/methods/card",
    response_model=PaymentMethodResponse,
    status_code=201,
    summary="Add a debit/credit card",
    description="Add a card as a payment method. Card number is validated via Luhn check "
    "and only the last 4 digits are stored.",
)
def add_card(
    request: AddCardRequest,
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a debit or credit card as a payment method."""
    return payment_method_service.add_card(db, current_user["user_id"], request)


@router.post(
    "/methods/upi",
    response_model=PaymentMethodResponse,
    status_code=201,
    summary="Add a UPI ID",
    description="Add a UPI ID as a payment method. Format is validated (e.g., user@bankhandle).",
)
def add_upi(
    request: AddUPIRequest,
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a UPI ID as a payment method."""
    return payment_method_service.add_upi(db, current_user["user_id"], request)


@router.post(
    "/methods/bank-account",
    response_model=PaymentMethodResponse,
    status_code=201,
    summary="Add a bank account",
    description="Add a direct bank account as a payment method. IFSC code is validated "
    "and account number is stored in masked form.",
)
def add_bank_account(
    request: AddBankAccountRequest,
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a bank account as a payment method."""
    try:
        return payment_method_service.add_bank_account(
            db, current_user["user_id"], request
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/methods/",
    response_model=PaymentMethodListResponse,
    summary="List payment methods",
    description="Returns all active payment methods for the current user.",
)
def list_methods(
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List all payment methods for the authenticated user."""
    return payment_method_service.list_methods(db, current_user["user_id"])


@router.put(
    "/methods/{method_id}/default",
    response_model=PaymentMethodResponse,
    summary="Set default payment method",
    description="Set a payment method as the default. The previous default is unset.",
)
def set_default(
    method_id: str,
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Set a payment method as the default."""
    try:
        return payment_method_service.set_default(
            db, current_user["user_id"], method_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put(
    "/methods/{method_id}/auto-pay",
    response_model=PaymentMethodResponse,
    summary="Toggle auto-pay",
    description="Enable or disable auto-pay on a specific payment method.",
)
def toggle_auto_pay(
    method_id: str,
    request: ToggleAutoPayRequest,
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Toggle auto-pay on a payment method."""
    try:
        return payment_method_service.toggle_auto_pay(
            db, current_user["user_id"], method_id, request.enabled
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete(
    "/methods/{method_id}",
    summary="Remove a payment method",
    description="Soft-delete a payment method. It will no longer appear in listings.",
)
def delete_method(
    method_id: str,
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Remove a payment method (soft delete)."""
    try:
        return payment_method_service.delete_method(
            db, current_user["user_id"], method_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
