"""
Transaction controller — HTTP route handlers for transactions.

Controller → Service → Repository → Database
^^^^^^^^^
You are here.

Thin layer: receives HTTP request, calls service, returns response.
"""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id
from app.database import get_db
from app.modules.transaction.schemas.transaction_schemas import (
    ManualOverrideRequest,
    ManualOverrideResponse,
    TransactionListResponse,
)
from app.modules.transaction.services import transaction_service

router = APIRouter()


@router.get(
    "/",
    response_model=TransactionListResponse,
    summary="List transactions",
    description="Returns paginated transactions for the current user. "
    "Optionally filter by date range and/or account.",
)
def list_transactions(
    start_date: date | None = Query(None, description="Filter start date"),
    end_date: date | None = Query(None, description="Filter end date"),
    account_id: str | None = Query(None, description="Filter by bank account ID"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(50, ge=1, le=100, description="Page size"),
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List transactions with optional date and account filters."""
    return transaction_service.list_transactions(
        db=db,
        user_id=current_user["user_id"],
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/manual-override",
    response_model=ManualOverrideResponse,
    status_code=201,
    summary="Create a manual override",
    description="Add a known future transaction (e.g. invoice, rent) to be "
    "included in the forecast projection.",
)
def create_manual_override(
    request: ManualOverrideRequest,
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Create a manual override for a future known event.

    - Amount is positive for inflows, negative for outflows
    - Date must be today or in the future
    """
    return transaction_service.create_manual_override(
        db=db,
        user_id=current_user["user_id"],
        request=request,
    )
