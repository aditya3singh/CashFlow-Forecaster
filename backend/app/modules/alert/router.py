"""
Alert module router — registers the alert history endpoint.

All routes are prefixed with /api/v1/alerts.
This file is imported by main.py to include in the app.
"""

from fastapi import APIRouter

from app.modules.alert.controllers.alert_controller import (
    router as alert_controller,
)

router = APIRouter(
    prefix="/api/v1/alerts",
    tags=["Alerts"],
)

# Include controller routes
router.include_router(alert_controller)
