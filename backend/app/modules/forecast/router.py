"""
Forecast module router — registers the forecast endpoint.

All routes are prefixed with /api/v1/forecast.
This file is imported by main.py to include in the app.
"""

from fastapi import APIRouter

from app.modules.forecast.controllers.forecast_controller import (
    router as forecast_controller,
)

router = APIRouter(
    prefix="/api/v1/forecast",
    tags=["Forecast"],
)

# Include controller routes
router.include_router(forecast_controller)
