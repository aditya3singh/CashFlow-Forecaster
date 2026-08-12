"""
Forecast schemas — Pydantic models for forecast API responses.
"""

from datetime import date

from pydantic import BaseModel


class ForecastDay(BaseModel):
    """A single day in the forecast projection."""
    date: date
    projected_balance: float


class ShortfallInfo(BaseModel):
    """Details about the first projected shortfall."""
    date: date
    projected_balance: float


class ForecastResponse(BaseModel):
    """
    Response for GET /api/v1/forecast/

    Contains the full forecast series, any shortfall warning,
    and a flag indicating whether the user needs to connect a bank first.
    """
    current_balance: float
    days: list[ForecastDay]
    shortfall: ShortfallInfo | None = None
    needs_onboarding: bool = False
