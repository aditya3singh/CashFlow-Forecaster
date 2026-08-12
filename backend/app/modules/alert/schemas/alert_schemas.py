"""
Alert schemas — Pydantic models for alert API responses.
"""

from datetime import date, datetime

from pydantic import BaseModel


class AlertResponse(BaseModel):
    """Response for a single alert."""
    id: str
    alert_type: str
    shortfall_date: date
    message: str
    sent: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    """List of alerts for the current user."""
    alerts: list[AlertResponse]
    total: int
