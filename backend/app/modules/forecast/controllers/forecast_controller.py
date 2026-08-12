"""
Forecast controller — HTTP route handler for the forecast endpoint.

Controller → Service → Repository → Database
^^^^^^^^^
You are here.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_id
from app.database import get_db
from app.modules.forecast.schemas.forecast_schemas import ForecastResponse
from app.modules.forecast.services import forecast_service

router = APIRouter()


@router.get(
    "/",
    response_model=ForecastResponse,
    summary="Get cashflow forecast",
    description="Returns projected daily balances for the next 6 weeks, "
    "including shortfall warnings. Returns needs_onboarding=true "
    "if no bank accounts are connected.",
)
def get_forecast(
    current_user: dict = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get the cashflow forecast for the authenticated user.

    - Returns cached forecast if already generated today
    - Otherwise computes a fresh projection from transaction history
    - Includes shortfall detection against the user's alert threshold
    """
    return forecast_service.get_forecast(db, current_user["user_id"])
