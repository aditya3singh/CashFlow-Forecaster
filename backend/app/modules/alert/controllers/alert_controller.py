"""
Alert controller — HTTP route handler for alert history.

Controller → Service → Repository → Database
^^^^^^^^^
You are here.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id
from app.database import get_db
from app.modules.alert.schemas.alert_schemas import AlertListResponse
from app.modules.alert.services import alert_service

router = APIRouter()


@router.get(
    "/",
    response_model=AlertListResponse,
    summary="List alert history",
    description="Returns past shortfall alerts sent to the current user.",
)
def list_alerts(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(50, ge=1, le=100, description="Page size"),
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List all past alerts for the authenticated user."""
    return alert_service.get_alert_history(
        db=db,
        user_id=current_user["user_id"],
        skip=skip,
        limit=limit,
    )
